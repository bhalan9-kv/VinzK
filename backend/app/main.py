from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from datetime import datetime, timezone

from .database import users_col, sessions_col, cases_col, bookmarks_col, init_db
from .auth import hash_password, verify_password, create_token, get_current_user
from .interview import engine

app = FastAPI(title="Case Interviewer AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


# ── Auth ────────────────────────────────────────────────────────────
class RegisterReq(BaseModel):
    email: EmailStr
    password: str
    name: str = ""


class LoginReq(BaseModel):
    email: EmailStr
    password: str


@app.post("/api/auth/register")
async def register(req: RegisterReq):
    if await users_col.find_one({"email": req.email}):
        raise HTTPException(400, "Email already registered")
    result = await users_col.insert_one({
        "email": req.email,
        "password": hash_password(req.password),
        "name": req.name,
        "created_at": datetime.now(timezone.utc),
    })
    token = create_token(str(result.inserted_id))
    return {"token": token, "user": {"id": str(result.inserted_id), "email": req.email, "name": req.name}}


@app.post("/api/auth/login")
async def login(req: LoginReq):
    user = await users_col.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(str(user["_id"]))
    return {"token": token, "user": {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "")}}


@app.get("/api/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {"user": user}


# ── Cases ───────────────────────────────────────────────────────────
@app.get("/api/cases")
async def list_cases(user=Depends(get_current_user)):
    cases = []
    async for c in cases_col.find({}, {"exhibits": 0, "questions": 0}):
        c["id"] = str(c["_id"])
        del c["_id"]
        cases.append(c)
    return {"cases": cases}


@app.get("/api/cases/{case_id}")
async def get_case(case_id: str, user=Depends(get_current_user)):
    case = await cases_col.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(404, "Case not found")
    case["id"] = str(case["_id"])
    del case["_id"]
    return {"case": case}


# ── Sessions ────────────────────────────────────────────────────────
class StartSessionReq(BaseModel):
    case_id: str
    timed: bool = False
    time_limit_seconds: int = 1500  # 25 min default


@app.post("/api/sessions")
async def start_session(req: StartSessionReq, user=Depends(get_current_user)):
    case = await cases_col.find_one({"_id": ObjectId(req.case_id)})
    if not case:
        raise HTTPException(404, "Case not found")

    greeting = engine.start_session(case, is_timed=req.timed)
    now = datetime.now(timezone.utc)

    session_doc = {
        "user_id": user["id"],
        "case_id": req.case_id,
        "case_title": case.get("title", ""),
        "case_type": case.get("type", ""),
        "timed": req.timed,
        "time_limit_seconds": req.time_limit_seconds if req.timed else None,
        "time_remaining_seconds": req.time_limit_seconds if req.timed else None,
        "started_at": now,
        "completed": False,
        "messages": [{"role": "assistant", "content": greeting, "timestamp": now.isoformat()}],
        "scorecard": None,
    }
    result = await sessions_col.insert_one(session_doc)
    return {
        "session_id": str(result.inserted_id),
        "message": greeting,
        "timed": req.timed,
        "time_limit_seconds": req.time_limit_seconds,
    }


class MessageReq(BaseModel):
    content: str
    time_remaining_seconds: int = None


@app.post("/api/sessions/{session_id}/message")
async def send_message(session_id: str, req: MessageReq, user=Depends(get_current_user)):
    session = await sessions_col.find_one({"_id": ObjectId(session_id), "user_id": user["id"]})
    if not session:
        raise HTTPException(404, "Session not found")
    if session.get("completed"):
        raise HTTPException(400, "Session already completed")

    case = await cases_col.find_one({"_id": ObjectId(session["case_id"])})
    if not case:
        raise HTTPException(404, "Case not found")

    now = datetime.now(timezone.utc)
    session["messages"].append({"role": "user", "content": req.content, "timestamp": now.isoformat()})

    is_timed = session.get("timed", False)
    reply = engine.continue_conversation(session["messages"], case, is_timed=is_timed)
    session["messages"].append({"role": "assistant", "content": reply, "timestamp": now.isoformat()})

    update_fields = {
        "messages": session["messages"],
    }
    if req.time_remaining_seconds is not None:
        update_fields["time_remaining_seconds"] = req.time_remaining_seconds

    await sessions_col.update_one({"_id": ObjectId(session_id)}, {"$set": update_fields})

    return {"message": reply}


@app.post("/api/sessions/{session_id}/complete")
async def complete_session(session_id: str, user=Depends(get_current_user)):
    session = await sessions_col.find_one({"_id": ObjectId(session_id), "user_id": user["id"]})
    if not session:
        raise HTTPException(404, "Session not found")
    if session.get("completed"):
        raise HTTPException(400, "Session already completed")

    case = await cases_col.find_one({"_id": ObjectId(session["case_id"])})
    scorecard = engine.score_session(session["messages"], case)

    # XP calculation
    overall = scorecard.get("overall", 50)
    time_bonus = 0
    if session.get("timed") and session.get("time_remaining_seconds", 0) > 0:
        time_bonus = int(session["time_remaining_seconds"] / 30)  # ~5 pts per min remaining
    xp_earned = max(10, int(overall * 1.5)) + time_bonus

    scorecard["xp_earned"] = xp_earned
    scorecard["time_bonus"] = time_bonus

    await sessions_col.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"completed": True, "scorecard": scorecard, "xp_earned": xp_earned}},
    )

    return {"scorecard": scorecard, "xp_earned": xp_earned}


@app.get("/api/sessions")
async def list_sessions(user=Depends(get_current_user)):
    sessions = []
    async for s in sessions_col.find({"user_id": user["id"]}).sort("started_at", -1):
        sessions.append({
            "id": str(s["_id"]),
            "case_title": s.get("case_title", ""),
            "case_type": s.get("case_type", ""),
            "timed": s.get("timed", False),
            "completed": s.get("completed", False),
            "started_at": s.get("started_at", "").isoformat() if isinstance(s.get("started_at"), datetime) else str(s.get("started_at", "")),
            "xp_earned": s.get("xp_earned", 0),
            "overall_score": s.get("scorecard", {}).get("overall", 0) if s.get("completed") else None,
        })
    return {"sessions": sessions}


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, user=Depends(get_current_user)):
    s = await sessions_col.find_one({"_id": ObjectId(session_id), "user_id": user["id"]})
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "session": {
            "id": str(s["_id"]),
            "case_title": s.get("case_title", ""),
            "case_type": s.get("case_type", ""),
            "timed": s.get("timed", False),
            "time_limit_seconds": s.get("time_limit_seconds"),
            "completed": s.get("completed", False),
            "messages": s.get("messages", []),
            "scorecard": s.get("scorecard"),
            "xp_earned": s.get("xp_earned", 0),
            "started_at": s.get("started_at", "").isoformat() if isinstance(s.get("started_at"), datetime) else str(s.get("started_at", "")),
        }
    }


# ── Bookmarks ───────────────────────────────────────────────────────
class BookmarkReq(BaseModel):
    case_id: str


@app.post("/api/bookmarks")
async def add_bookmark(req: BookmarkReq, user=Depends(get_current_user)):
    try:
        await bookmarks_col.insert_one({"user_id": user["id"], "case_id": req.case_id})
    except Exception:
        pass  # Already bookmarked
    return {"ok": True}


@app.delete("/api/bookmarks/{case_id}")
async def remove_bookmark(case_id: str, user=Depends(get_current_user)):
    await bookmarks_col.delete_one({"user_id": user["id"], "case_id": case_id})
    return {"ok": True}


@app.get("/api/bookmarks")
async def list_bookmarks(user=Depends(get_current_user)):
    bookmarks = []
    async for b in bookmarks_col.find({"user_id": user["id"]}):
        bookmarks.append(b["case_id"])
    return {"bookmarks": bookmarks}


# ── Progress ────────────────────────────────────────────────────────
@app.get("/api/progress")
async def get_progress(user=Depends(get_current_user)):
    total_xp = 0
    completed = 0
    streak = 0
    case_types = {}
    scores = []

    async for s in sessions_col.find({"user_id": user["id"]}):
        if s.get("completed"):
            completed += 1
            total_xp += s.get("xp_earned", 0)
            ct = s.get("case_type", "general")
            case_types[ct] = case_types.get(ct, 0) + 1
            if s.get("scorecard"):
                scores.append(s["scorecard"].get("overall", 0))

    # Simple streak: count consecutive days with sessions
    dates = set()
    async for s in sessions_col.find({"user_id": user["id"]}, {"started_at": 1}):
        if s.get("started_at"):
            dates.add(s["started_at"].strftime("%Y-%m-%d"))
    from datetime import date, timedelta
    d = date.today()
    while d.isoformat() in dates:
        streak += 1
        d -= timedelta(days=1)

    strongest = max(case_types, key=case_types.get) if case_types else None
    avg_score = sum(scores) / len(scores) if scores else 0

    return {
        "total_xp": total_xp,
        "completed_sessions": completed,
        "streak": streak,
        "strongest_type": strongest,
        "case_type_distribution": case_types,
        "average_score": round(avg_score, 1),
    }

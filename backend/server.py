from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ["JWT_SECRET"]
LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")


class AuthInput(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    xp: int = 0

class TokenOut(BaseModel):
    token: str
    user: UserOut

class MessageInput(BaseModel):
    message: str

class BookmarkInput(BaseModel):
    case_id: str


CASES = [
    {"id":"profitability-01","type":"Profitability","slug":"profitability","level":"Core","difficulty":"Moderate","xp":120,"title":"The margin squeeze","prompt":"Your client is a regional coffee chain. Over the last 12 months, profits have fallen by 20% despite revenue growing by 8%. The CEO wants to understand why and what to do next.","tags":["Profit tree","Revenue","Costs"]},
    {"id":"gtm-01","type":"Go-to-market","slug":"go-to-market","level":"Core","difficulty":"Moderate","xp":140,"title":"A new audience","prompt":"A premium skincare company is considering launching a lower-priced line for college students. Should it enter this segment, and how should it go to market?","tags":["Segments","Channels","Positioning"]},
    {"id":"entry-01","type":"Market entry","slug":"market-entry","level":"Advanced","difficulty":"Hard","xp":160,"title":"The next country","prompt":"Your client is a European logistics platform considering entry into Brazil. Should it enter within the next two years?","tags":["Attractiveness","Right to win","Entry mode"]},
    {"id":"ma-01","type":"Due diligence","slug":"due-diligence","level":"Advanced","difficulty":"Hard","xp":180,"title":"The strategic buy","prompt":"A global industrials company is considering acquiring a fast-growing sensor manufacturer. Assess whether the acquisition is attractive and what risks matter most.","tags":["Valuation","Synergies","Integration"]},
    {"id":"unconventional-01","type":"Unconventional","slug":"unconventional","level":"Stretch","difficulty":"Hard","xp":180,"title":"The silent airport","prompt":"An airport authority says passengers are spending less time and money inside the terminal. Diagnose the situation and recommend how to reverse the trend.","tags":["Ambiguity","Creativity","Synthesis"]},
    {"id":"guesstimate-01","type":"Guesstimate","slug":"guesstimate","level":"Core","difficulty":"Easy","xp":100,"title":"How many rides?","prompt":"Estimate the annual number of rides taken by taxis in New York City. State your assumptions clearly and build your estimate from the bottom up.","tags":["Assumptions","Bottom-up","Math"]},
]

FMS_CASES = [
    ("Electricity Consumption",90,"Guesstimate"),("Number of Umbrellas Sold",91,"Guesstimate"),("Gurgaon Delhi Toll Plaza",92,"Guesstimate"),("TOI Revenues",93,"Guesstimate"),("Smart Watches in India",94,"Guesstimate"),("Smokers in India",95,"Guesstimate"),("Cheese Burst Pizzas",96,"Guesstimate"),("Petrol Pumps in India",97,"Guesstimate"),("TT Balls in Delhi",100,"Guesstimate"),("White Shirts in Delhi",102,"Guesstimate"),("Delhi Schools",103,"Guesstimate"),("Daily Departing Flights",104,"Guesstimate"),("Tractors in India",105,"Guesstimate"),("Market Size of EV in India",107,"Guesstimate"),("Flat Screen Televisions",108,"Guesstimate"),("Amazon India",109,"Guesstimate"),("Daily revenue of Airport",110,"Guesstimate"),("Automobile Tire Market",111,"Guesstimate"),("Wine Consumption in India",112,"Guesstimate"),("Bisleri Water Bottle",113,"Guesstimate"),("Sanitizer Demand in Delhi",115,"Guesstimate"),("BCom Admissions in DU",116,"Guesstimate"),("Credit Cards Issued",117,"Guesstimate"),("Revenue of Dream11",118,"Guesstimate"),("Revenue of Pickpocket",119,"Guesstimate"),("Number of Movie Screens",120,"Guesstimate"),("Petrol Consumption",121,"Guesstimate"),("Swiggy Drivers",122,"Guesstimate"),("Delhi Metro Passengers",123,"Guesstimate"),("Toothbrushes",124,"Guesstimate"),("Distance Travelled by Q-Commerce Drivers",125,"Guesstimate"),("Mutual Fund Market in India",126,"Guesstimate"),("Number of Car Tyres in Delhi",127,"Guesstimate"),
    ("Orchard Farmer",132,"Profitability"),("Retail Chain",134,"Profitability"),("E-Commerce Company",136,"Profitability"),("Garbage Collecting Company",138,"Profitability"),("Biscuit Manufacturer",140,"Profitability"),("Automobile Company Sales",142,"Revenues"),("Automobile Dealership",144,"Revenues"),("Kids' TV Channel",146,"Revenues"),("Apparel Company",148,"Cost Reduction"),("Quick Service Restaurant",150,"Cost Reduction"),("Steel Manufacturer",152,"Profitability"),("Toy Manufacturer",154,"Profitability"),("Pharmaceutical Analysis",156,"Profitability"),("Power Plant",158,"Profitability"),("Airline Profitability",162,"Profitability"),("Shopping Mall in South Delhi",164,"Revenues"),("Food Manufacturer Case",166,"Cost Reduction"),("IT Services Client",168,"Cost Reduction"),("Steel Manufacturer Costs",170,"Cost Reduction"),("Women Apparel Chain",172,"Cost Reduction"),("2024 Olympics Rights",174,"Profitability"),("Home Insurance Entry",176,"Market Entry"),("Sports Bike",178,"Market Entry"),("Home Automation Player",180,"Market Entry"),("Gold Mine in Mongolia",182,"Market Entry"),("Skin Care Manufacturer",185,"Market Entry"),("Smart Phone Market",187,"Market Entry"),("South African PE Firm",189,"Market Entry"),("5G Launch in India",191,"Market Entry"),("Coffee Capsule",193,"Market Entry"),("Appliance Distribution Company",196,"Growth"),("Apparel Business Topline",199,"Growth"),("Book Publishing",201,"Growth"),("Pediatric Vaccine Manufacturer",203,"Growth"),("Truck Manufacturer",205,"Growth"),("Fashion Retail Store",207,"Growth"),("Golf Course",209,"Pricing"),("Paint Manufacturer",211,"Pricing"),("On Demand Truck Platform",214,"Pricing"),("Hepatitis-B Drug",216,"Pricing"),("Ride hailing Helicopter Cab Service",218,"Pricing"),("Logistics Efficiency",221,"Unconventional"),("Chatbot Development",223,"Unconventional"),("Manufacturing Efficiency",225,"Unconventional"),("Time Management",227,"Unconventional"),("CO2 Emissions",229,"Unconventional"),("Unborn Baby",232,"Unconventional"),("Launching a Green Airline",234,"Unconventional"),("Client Stuck in an Island",237,"Unconventional"),("Increase in Product Returns",239,"Unconventional"),("Footfall of Church",242,"Unconventional"),("Money Heist",244,"Unconventional"),("Increase in Road Accidents",246,"Unconventional"),("Swedish Government",249,"Unconventional"),("Light Bulb Company",251,"Customer Satisfaction"),("Bottling Plant",254,"Customer Satisfaction"),("Telecom Provider",256,"Customer Satisfaction"),("Airline Acquisition",258,"M&A"),("PE Cosmetic Chain",261,"M&A"),("Metro Investment in Dubai",263,"M&A"),("Coffee Shop",267,"Due Diligence"),("Fantasy Sports App",270,"Due Diligence"),
]

for index, (title, page, case_type) in enumerate(FMS_CASES, start=1):
    slug = "fms-" + "-".join(title.lower().replace("'", "").split())
    CASES.append({
        "id": slug,
        "type": case_type,
        "slug": slug,
        "level": "Casebook",
        "difficulty": ["Easy", "Moderate", "Hard"][index % 3],
        "xp": 100,
        "title": title,
        "prompt": f"You are working through the FMS Consulting CaseBook case: {title}. The interviewer will lead this {case_type.lower()} case from the casebook (page {page}). Begin by stating how you'll structure your approach and what objective you want to answer before asking for data.",
        "tags": ["FMS CaseBook", case_type],
        "source": "FMS Consulting CaseBook 2024-25",
        "source_pages": str(page),
    })


def current_user(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Please sign in to continue")
    try:
        return jwt.decode(authorization.split(" ", 1)[1], JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Your session has expired")


def make_token(user):
    return jwt.encode({"sub": user["id"], "email": user["email"]}, JWT_SECRET, algorithm="HS256")


@api_router.get("/")
async def root():
    return {"message": "Case Interviewer API"}


@api_router.post("/auth/register", response_model=TokenOut)
async def register(input: AuthInput):
    email = input.email.lower().strip()
    if len(input.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if await db.users.find_one({"email": email}, {"_id": 0}):
        raise HTTPException(409, "An account already exists for this email")
    user = {"id": str(uuid.uuid4()), "email": email, "password": bcrypt.hashpw(input.password.encode(), bcrypt.gensalt()).decode(), "xp": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(user)
    return {"token": make_token(user), "user": {"id": user["id"], "email": email, "xp": 0}}


@api_router.post("/auth/login", response_model=TokenOut)
async def login(input: AuthInput):
    user = await db.users.find_one({"email": input.email.lower().strip()}, {"_id": 0})
    if not user or not bcrypt.checkpw(input.password.encode(), user["password"].encode()):
        raise HTTPException(401, "Email or password is incorrect")
    return {"token": make_token(user), "user": {"id": user["id"], "email": user["email"], "xp": user.get("xp", 0)}}


@api_router.get("/cases")
async def get_cases():
    return CASES


@api_router.get("/bookmarks")
async def get_bookmarks(authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    rows = await db.bookmarks.find({"user_id": user["sub"]}, {"_id": 0, "case_id": 1}).to_list(500)
    return [row["case_id"] for row in rows]


@api_router.post("/bookmarks")
async def add_bookmark(input: BookmarkInput, authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    if not any(c["id"] == input.case_id for c in CASES):
        raise HTTPException(404, "Case not found")
    await db.bookmarks.update_one({"user_id": user["sub"], "case_id": input.case_id}, {"$set": {"user_id": user["sub"], "case_id": input.case_id, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    return {"case_id": input.case_id, "saved": True}


@api_router.delete("/bookmarks/{case_id}")
async def remove_bookmark(case_id: str, authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    await db.bookmarks.delete_one({"user_id": user["sub"], "case_id": case_id})
    return {"case_id": case_id, "saved": False}


@api_router.get("/progress")
async def progress(authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    rows = await db.sessions.find({"user_id": user["sub"], "completed": True}, {"_id": 0}).sort("created_at", -1).to_list(200)
    total_xp = sum(r.get("xp_awarded", 0) for r in rows)
    return {"completed": len(rows), "xp": total_xp, "sessions": rows}


@api_router.get("/sessions")
async def list_sessions(authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    rows = await db.sessions.find({"user_id": user["sub"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return rows


@api_router.get("/sessions/{session_id}")
async def get_session(session_id: str, authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    session = await db.sessions.find_one({"id": session_id, "user_id": user["sub"]}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    return session


CATEGORY_GUIDANCE = {
    "Profitability": "Expect a profit tree (Revenue vs Cost, then volume/price and fixed/variable). Do not correct them if they skip diagnosing revenue vs cost first — let the data reveal the real lever.",
    "Go-to-market": "Expect segmentation + channel/positioning logic (4Ps). Gate customer segment data, channel economics, and competitor moves behind specific asks.",
    "Market entry": "Expect market attractiveness (size, growth, competition) + right to win + entry mode. Financial viability data (breakeven, payback) is gated separately from attractiveness data.",
    "Due diligence": "Expect standalone valuation, synergies (revenue + cost), and integration/risks as three distinct branches. Never volunteer strategic-fit context.",
    "M&A": "Same as due diligence. Expect valuation, synergies, and integration risks as distinct branches.",
    "Unconventional": "No fixed framework expected. Score primarily on creativity and structured thinking under ambiguity. Be more literal and deadpan.",
    "Guesstimate": "Expect a bottom-up build (population → segment → usage → frequency). If they ask for a number instead of estimating it, respond: 'The above question is not relevant for the case.' unless it is a grounding fact like country population.",
    "Revenues": "Expect a revenue tree (volume × price, split by segment or product). Do not volunteer segment data.",
    "Cost Reduction": "Expect a cost tree (fixed vs variable, direct vs indirect). Push them to size the buckets before diving into any single cost line.",
    "Growth": "Expect an Ansoff-style split (existing vs new, customers vs products). Gate customer, channel, and competitive data separately.",
    "Pricing": "Expect a three-lens view: cost-plus, value-based, competitive. Gate willingness-to-pay data and competitor pricing separately.",
    "Customer Satisfaction": "Expect a journey-based diagnosis (touchpoints) and root-cause tree. Do not reveal survey data until asked for.",
}


def case_prompt(case):
    category = case.get("type", "")
    guidance = CATEGORY_GUIDANCE.get(category, "Expect a structured, MECE approach appropriate to the prompt.")
    return f"""You are a strict, neutral, Socratic professional case interviewer. Run exactly one case: {case['title']} (type: {category}). You never solve the case, never volunteer information they haven't asked for, and never confirm whether a direction is "right" until they explicitly ask for feedback or deliver a final recommendation.

CASE PROMPT (deliver this verbatim as your very first message, and nothing else):
{case['prompt']}

CATEGORY BEHAVIOR: {guidance}

RULES:
- Structure before data. If the candidate asks for numbers before laying out a structure, give exactly one neutral nudge: "Before we dive into numbers — how are you thinking about structuring this problem?"
- For every candidate message, classify it:
  * Relevant hit → reveal ONE concise data point that would plausibly be in a real interviewer's data bank for this case. Do not editorialize. Do not hint at implications.
  * Irrelevant / out of scope → respond EXACTLY: "The above question is not relevant for the case."
  * Ambiguous phrasing → ask ONE clarifying question first.
  * Direct ask for the answer / framework → reply EXACTLY: "I can't solve it for you — what's your next step?"
- Never reveal two data points in one answer. Make them ask separately.
- Never give hints as data — a hint may only be a structural nudge (e.g., "Have you considered the cost side yet?").
- Keep every response under 80 words unless revealing a table or exhibit.

WHEN THEY DELIVER A FINAL RECOMMENDATION:
Close politely in one line, then on a new line output exactly:
SCORE_JSON={{"structuring":<0-100>,"data_efficiency":<0-100>,"math_accuracy":<0-100>,"synthesis":<0-100>,"creativity":<0-100>,"xp":<0-{case.get('xp',120)}>,"feedback":"3-5 plain sentences: what they structured well, one relevant data point they never asked for, whether their number/recommendation matches the range, one concrete next-time suggestion"}}
Base scores on their ACTUAL performance. Relevant asks raise data_efficiency; irrelevant asks lower it. A candidate who gathers data but never concludes must score low on synthesis regardless of data efficiency. Never award full XP unless the synthesis directly addresses the objective."""


@api_router.post("/sessions")
async def start_session(case_id: str, authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    case = next((c for c in CASES if c["id"] == case_id), None)
    if not case:
        raise HTTPException(404, "Case not found")
    sid = str(uuid.uuid4())
    await db.sessions.insert_one({"id": sid, "user_id": user["sub"], "case_id": case_id, "case_title": case["title"], "case_type": case["type"], "messages": [], "completed": False, "xp_awarded": 0, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"session_id": sid, "case": case}


@api_router.post("/sessions/{session_id}/message")
async def message(session_id: str, input: MessageInput, authorization: Optional[str] = Header(default=None)):
    user = current_user(authorization)
    session = await db.sessions.find_one({"id": session_id, "user_id": user["sub"]}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")
    case = next(c for c in CASES if c["id"] == session["case_id"])
    history = session.get("messages", [])
    if not LLM_KEY:
        raise HTTPException(503, "Interviewer is not configured")
    transcript = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history[-14:])
    user_prompt = (transcript + "\nCANDIDATE: " + input.message) if transcript else input.message
    chat = LlmChat(api_key=LLM_KEY, session_id=session_id, system_message=case_prompt(case)).with_model("openai", "gpt-5.4-mini")
    chunks = []
    async for event in chat.stream_message(UserMessage(text=user_prompt)):
        if isinstance(event, TextDelta):
            chunks.append(event.content)
        elif isinstance(event, StreamDone):
            break
    reply = "".join(chunks).strip()
    score = None
    display_reply = reply
    if "SCORE_JSON=" in reply:
        try:
            raw = reply.split("SCORE_JSON=", 1)[1].strip()
            # collect until closing brace
            depth = 0
            end = 0
            for i, ch in enumerate(raw):
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        end = i + 1
                        break
            score = json.loads(raw[:end])
            display_reply = reply.split("SCORE_JSON=", 1)[0].strip()
        except Exception:
            pass
    history += [{"role": "user", "content": input.message}, {"role": "assistant", "content": display_reply}]
    update = {"messages": history}
    if score:
        update.update({"completed": True, "xp_awarded": score.get("xp", 0), "score": score, "completed_at": datetime.now(timezone.utc).isoformat()})
    await db.sessions.update_one({"id": session_id}, {"$set": update})
    if score:
        await db.users.update_one({"id": user["sub"]}, {"$inc": {"xp": score.get("xp", 0)}})
    return {"reply": display_reply, "score": score}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

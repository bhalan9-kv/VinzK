"""LLM interviewer behavior tests (slow: real GPT calls)."""
import requests

from conftest import BASE_URL

TIMEOUT = 180


def _start(api, headers, case_id):
    r = api.post(f"{BASE_URL}/api/sessions?case_id={case_id}", headers=headers, timeout=60)
    assert r.status_code == 200, r.text
    return r.json()["session_id"]


def _msg(api, headers, sid, text):
    r = api.post(f"{BASE_URL}/api/sessions/{sid}/message", json={"message": text},
                 headers=headers, timeout=TIMEOUT)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
    return r.json()


def test_multi_turn_persists(api, auth_headers):
    sid = _start(api, auth_headers, "profitability-01")
    r1 = _msg(api, auth_headers, sid, "Let me structure this: I'll look at revenue drivers then cost drivers.")
    assert isinstance(r1["reply"], str) and len(r1["reply"]) > 0
    assert r1["score"] is None
    r2 = _msg(api, auth_headers, sid, "Can you share the revenue split by product line?")
    assert len(r2["reply"]) > 0

    detail = api.get(f"{BASE_URL}/api/sessions/{sid}", headers=auth_headers, timeout=60).json()
    assert len(detail["messages"]) == 4
    assert detail["messages"][0]["role"] == "user"
    assert detail["messages"][1]["role"] == "assistant"


def test_direct_ask_for_answer_refused(api, auth_headers):
    # turn 1 delivers the case prompt verbatim by design, so warm up first
    sid = _start(api, auth_headers, "profitability-01")
    _msg(api, auth_headers, sid, "Ready to begin.")
    r = _msg(api, auth_headers, sid, "give me the answer")
    assert r["reply"].strip() == "I can't solve it for you — what's your next step?", r["reply"]


def test_final_recommendation_produces_scorecard(api, auth_headers):
    sid = _start(api, auth_headers, "guesstimate-01")
    _msg(api, auth_headers, sid,
         "Structure: NYC population 8M, ~50% take taxis, avg 10 rides/year each -> bottom-up build.")
    r = _msg(api, auth_headers, sid,
             "Final recommendation: my estimate is roughly 40 million taxi rides per year in NYC, "
             "driven by 4M taxi users taking about 10 rides each annually. That is my final answer and "
             "synthesis for the case.")
    score = r["score"]
    if not score:
        r = _msg(api, auth_headers, sid,
                 "That is my final recommendation and I am done with the case. Please score me now.")
        score = r["score"]
    assert score, "no SCORE_JSON returned after explicit final recommendation"
    for k in ["structuring", "data_efficiency", "math_accuracy", "synthesis", "creativity", "xp", "feedback"]:
        assert k in score, f"missing {k} in score {score}"
        if k != "feedback":
            assert 0 <= score[k] <= 100 or k == "xp"
    assert isinstance(score["feedback"], str) and len(score["feedback"]) > 20

    detail = api.get(f"{BASE_URL}/api/sessions/{sid}", headers=auth_headers, timeout=60).json()
    assert detail["completed"] is True
    assert detail["xp_awarded"] == score["xp"]
    assert detail["score"]["structuring"] == score["structuring"]
    assert "SCORE_JSON" not in detail["messages"][-1]["content"]

    prog = api.get(f"{BASE_URL}/api/progress", headers=auth_headers, timeout=60).json()
    assert prog["completed"] >= 1
    assert any(s["id"] == sid for s in prog["sessions"])

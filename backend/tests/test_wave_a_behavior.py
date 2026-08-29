"""Wave A LLM behavior tests: fuzzy phrase matching, Easy hints, Hard strictness,
casebook grounding, and SCORE_JSON parsing. Slow — real GPT-5.4-mini calls."""
import pytest
import requests

from conftest import BASE_URL

TIMEOUT = 240
COACH = "A sharper phrasing would be:"
HARD_DECLINE = "I can't nudge you here — what's your next step?"


def _start(api, headers, case_id):
    r = api.post(f"{BASE_URL}/api/sessions?case_id={case_id}", headers=headers, timeout=60)
    assert r.status_code == 200, r.text
    return r.json()


def _msg(api, headers, sid, text):
    r = api.post(f"{BASE_URL}/api/sessions/{sid}/message", json={"message": text},
                 headers=headers, timeout=TIMEOUT)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:400]}"
    return r.json()


# --- fuzzy phrase matching (Medium) ---
def test_fuzzy_close_ask_gets_coaching_line(api, auth_headers):
    sid = _start(api, auth_headers, "profitability-01")["session_id"]
    intro = _msg(api, auth_headers, sid,
                 "Objective: recover the 20% profit decline. Structure: profit = revenue (volume x price by "
                 "product) minus costs (fixed vs variable). I'll diagnose revenue first, then costs.")
    print("TURN1:", intro["reply"][:300])
    r = _msg(api, auth_headers, sid, "how much do we spend on labour?")
    reply = r["reply"]
    print("FUZZY REPLY:", reply)
    assert COACH in reply, f"missing coaching line for fuzzy ask. reply={reply!r}"
    assert "not relevant for the case" not in reply


def test_crisp_ask_has_no_coaching_line(api, auth_headers):
    sid = _start(api, auth_headers, "profitability-01")["session_id"]
    _msg(api, auth_headers, sid,
         "Objective: explain the profit drop. Structure: revenue tree (volume x price per product line) "
         "then cost tree (fixed vs variable). Starting with revenue.")
    r = _msg(api, auth_headers, sid, "What is our revenue split by product line?")
    reply = r["reply"]
    print("CRISP REPLY:", reply)
    assert COACH not in reply, f"coaching line wrongly prepended to a crisp ask. reply={reply!r}"
    assert "not relevant for the case" not in reply


# --- Easy difficulty hint behavior ---
def test_easy_case_gives_structural_hint_when_stuck(api, auth_headers):
    started = _start(api, auth_headers, "fms-electricity-consumption")
    assert started["case"]["difficulty"] == "Easy"
    sid = started["session_id"]
    # NOTE: observed behaviour needs 3 stuck turns (turn 1 delivers the verbatim prompt,
    # turn 2 is spent on the structure-first nudge). Spec asks for a hint by turn 2.
    replies = []
    for m in ["i dont know how to start", "give me a number", "i am stuck, no idea"]:
        replies.append(_msg(api, auth_headers, sid, m)["reply"])
        print(f"EASY TURN{len(replies)} ({m}):", replies[-1][:400])
    assert "Hint:" in replies[1], (
        "SPEC: a structural 'Hint:' should appear by the 2nd stuck turn on an Easy case; "
        f"turn2 reply={replies[1]!r} / turn3 reply={replies[2]!r}"
    )
    combined = "\n".join(replies)
    hint_line = next(l for l in combined.splitlines() if "Hint:" in l)
    # a hint must be structural, not a data reveal
    assert not any(ch.isdigit() for ch in hint_line.split("Hint:", 1)[1]), \
        f"hint appears to contain data/numbers: {hint_line!r}"


# --- Hard difficulty strictness ---
def test_hard_case_declines_hint(api, auth_headers):
    started = _start(api, auth_headers, "entry-01")
    assert started["case"]["difficulty"] == "Hard"
    sid = started["session_id"]
    _msg(api, auth_headers, sid, "Ready to begin.")
    r = _msg(api, auth_headers, sid, "can you give me a hint?")
    print("HARD REPLY:", r["reply"])
    assert HARD_DECLINE in r["reply"], f"hard case did not decline with the exact line. reply={r['reply']!r}"
    assert "Hint:" not in r["reply"]


# --- Casebook grounding: verbatim prompt as first interviewer message ---
@pytest.mark.parametrize("case_id", ["fms-orchard-farmer", "fms-biscuit-manufacturer"])
def test_casebook_verbatim_prompt_is_first_message(api, auth_headers, case_id):
    started = _start(api, auth_headers, case_id)
    case = started["case"]
    assert not case["prompt"].startswith("You are working through"), "case has no verbatim prompt"
    sid = started["session_id"]
    r = _msg(api, auth_headers, sid, "Hi, I'm ready to start.")
    reply = r["reply"]
    print(f"{case_id} FIRST REPLY:", reply)
    core = case["prompt"].split(".")[0].strip().lower()
    assert core[:40] in reply.lower(), f"first message is not the verbatim casebook prompt.\nprompt={case['prompt']!r}\nreply={reply!r}"
    assert "You are working through" not in reply


# --- SCORE_JSON on a casebook case ---
def test_scorecard_on_casebook_case(api, auth_headers):
    sid = _start(api, auth_headers, "fms-biscuit-manufacturer")["session_id"]
    _msg(api, auth_headers, sid,
         "Objective: raise profitability. Structure: profit = revenue (volume x price, by SKU and channel) "
         "minus cost (raw material, labour, distribution, overhead). I'll size revenue first.")
    _msg(api, auth_headers, sid, "What is our revenue split by product category?")
    r = _msg(api, auth_headers, sid,
             "Final recommendation: focus on the premium biscuit SKUs and renegotiate distributor margins to "
             "lift profitability by roughly 10-15%; risks are volume loss in mass SKUs. That's my final answer, "
             "please score me.")
    score = r["score"]
    if not score:
        r = _msg(api, auth_headers, sid, "That is my final recommendation. Please close the case and score me.")
        score = r["score"]
    assert score, "no SCORE_JSON produced on a casebook case"
    for k in ["structuring", "data_efficiency", "math_accuracy", "synthesis", "creativity", "xp", "feedback"]:
        assert k in score, f"missing {k}: {score}"
    assert 0 <= score["xp"] <= 110, f"xp out of case range: {score['xp']}"
    detail = api.get(f"{BASE_URL}/api/sessions/{sid}", headers=auth_headers, timeout=60).json()
    assert detail["completed"] is True
    assert detail["xp_awarded"] == score["xp"]
    assert "SCORE_JSON" not in detail["messages"][-1]["content"]

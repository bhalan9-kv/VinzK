"""Diagnostic probes (not assertions) for Wave A prompt behavior flakiness."""
import pytest

from conftest import BASE_URL

TIMEOUT = 240
COACH = "A sharper phrasing would be:"


def _start(api, headers, case_id):
    r = api.post(f"{BASE_URL}/api/sessions?case_id={case_id}", headers=headers, timeout=60)
    return r.json()


def _msg(api, headers, sid, text):
    r = api.post(f"{BASE_URL}/api/sessions/{sid}/message", json={"message": text}, headers=headers, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    return r.json()["reply"]


def test_probe_crisp_repeat(api, auth_headers):
    hits = 0
    asks = ["What is our revenue split by product line?", "What are our labour costs?",
            "How has our average price per cup changed year over year?"]
    for ask in asks:
        sid = _start(api, auth_headers, "profitability-01")["session_id"]
        _msg(api, auth_headers, sid,
             "Objective: explain the 20% profit drop. Structure: revenue tree (volume x price per product "
             "line) then cost tree (fixed vs variable). Starting with revenue.")
        reply = _msg(api, auth_headers, sid, ask)
        flagged = COACH in reply
        hits += flagged
        print(f"\nASK: {ask}\nCOACH_PREPENDED={flagged}\nREPLY: {reply}")
    print(f"\nCRISP FALSE-POSITIVE RATE: {hits}/{len(asks)}")


def test_probe_easy_hint_turns(api, auth_headers):
    sid = _start(api, auth_headers, "fms-electricity-consumption")["session_id"]
    for i, m in enumerate(["i dont know how to start", "give me a number", "i am stuck, no idea", "help me please"], 1):
        reply = _msg(api, auth_headers, sid, m)
        print(f"\nEASY TURN {i} (msg={m!r}) HINT={'Hint:' in reply}\nREPLY: {reply}")

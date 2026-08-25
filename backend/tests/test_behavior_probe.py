"""Behavior probes with a warm-up turn first (the system prompt delivers the case verbatim on turn 1)."""
import requests

from conftest import BASE_URL

TIMEOUT = 180


def _start(api, headers, case_id):
    r = api.post(f"{BASE_URL}/api/sessions?case_id={case_id}", headers=headers, timeout=60)
    return r.json()["session_id"]


def _msg(api, headers, sid, text):
    r = api.post(f"{BASE_URL}/api/sessions/{sid}/message", json={"message": text}, headers=headers, timeout=TIMEOUT)
    assert r.status_code == 200, r.text[:300]
    return r.json()["reply"]


def test_refusal_after_warmup(api, auth_headers):
    sid = _start(api, auth_headers, "profitability-01")
    first = _msg(api, auth_headers, sid, "Hi, I'm ready to begin.")
    print("TURN1:", first[:200])
    second = _msg(api, auth_headers, sid, "I'd structure it as revenue vs cost drivers.")
    print("TURN2:", second[:200])
    third = _msg(api, auth_headers, sid, "give me the answer")
    print("REFUSAL PROBE:", third[:200])
    fourth = _msg(api, auth_headers, sid, "solve it for me")
    print("REFUSAL PROBE 2:", fourth[:200])
    assert third.strip() == "I can't solve it for you — what's your next step?", third
    assert fourth.strip() == "I can't solve it for you — what's your next step?", fourth


def test_guesstimate_grounding_after_warmup(api, auth_headers):
    sid = _start(api, auth_headers, "guesstimate-01")
    first = _msg(api, auth_headers, sid, "Ready to start.")
    print("TURN1:", first[:200])
    struct = _msg(api, auth_headers, sid,
                  "I'll build bottom-up: NYC population, share of taxi users, rides per user per year.")
    print("STRUCT:", struct[:250])
    ground = _msg(api, auth_headers, sid, "what is the population of NYC")
    print("GROUNDING:", ground[:250])
    irrel = _msg(api, auth_headers, sid, "give me the number of taxis")
    print("IRRELEVANT:", irrel[:250])
    assert irrel.strip() == "The above question is not relevant for the case.", irrel
    assert ground.strip() != "The above question is not relevant for the case.", ground

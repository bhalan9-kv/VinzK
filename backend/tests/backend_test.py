"""Regression tests: auth, cases, bookmarks, sessions (list/detail), progress."""
import uuid

import requests

from conftest import BASE_URL


# --- health / root ---
def test_root(api):
    r = api.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert "message" in r.json()


# --- auth ---
def test_register_short_password(api):
    r = api.post(f"{BASE_URL}/api/auth/register",
                 json={"email": f"TEST_{uuid.uuid4().hex[:8]}@example.com", "password": "short"})
    assert r.status_code == 400, r.text
    assert "8 characters" in r.json()["detail"]


def test_register_duplicate(api, test_account):
    r = api.post(f"{BASE_URL}/api/auth/register",
                 json={"email": test_account["email"], "password": test_account["password"]})
    assert r.status_code == 409, r.text


def test_login_success(api, test_account):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": test_account["email"], "password": test_account["password"]})
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data["token"], str) and data["token"]
    assert data["user"]["email"] == test_account["email"].lower()
    assert data["user"]["id"] == test_account["id"]


def test_login_case_insensitive_email(api, test_account):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": test_account["email"].upper(), "password": test_account["password"]})
    assert r.status_code == 200, r.text


def test_login_wrong_password(api, test_account):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": test_account["email"], "password": "WrongPassword1"})
    assert r.status_code == 401, r.text


def test_login_unknown_user(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": "nobody_TEST@example.com", "password": "PracticeRoom2026"})
    assert r.status_code == 401


# --- cases catalog ---
def test_cases_catalog(api):
    r = api.get(f"{BASE_URL}/api/cases")
    assert r.status_code == 200
    cases = r.json()
    assert len(cases) == 101, f"expected 101 cases, got {len(cases)}"
    ids = [c["id"] for c in cases]
    assert len(ids) == len(set(ids)), "duplicate case ids"
    slugs = [c["slug"] for c in cases]
    assert len(slugs) == len(set(slugs)), "duplicate case slugs (breaks data-testid selectors)"
    for c in cases:
        for k in ("id", "slug", "title", "type", "difficulty", "prompt", "xp"):
            assert k in c, f"missing {k} in {c.get('id')}"
        assert "_id" not in c


# --- auth guards ---
def test_protected_endpoints_require_auth(api):
    for method, path in [("get", "/api/bookmarks"), ("get", "/api/progress"),
                         ("get", "/api/sessions"), ("get", "/api/sessions/abc")]:
        r = getattr(api, method)(f"{BASE_URL}{path}", headers={"Authorization": ""})
        assert r.status_code == 401, f"{path} -> {r.status_code}"


def test_invalid_token_rejected(api):
    r = api.get(f"{BASE_URL}/api/sessions", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


# --- bookmarks ---
def test_bookmark_lifecycle(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/bookmarks", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []

    r = api.post(f"{BASE_URL}/api/bookmarks", json={"case_id": "profitability-01"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json() == {"case_id": "profitability-01", "saved": True}

    # idempotent
    r = api.post(f"{BASE_URL}/api/bookmarks", json={"case_id": "profitability-01"}, headers=auth_headers)
    assert r.status_code == 200
    r = api.get(f"{BASE_URL}/api/bookmarks", headers=auth_headers)
    assert r.json() == ["profitability-01"]

    r = api.delete(f"{BASE_URL}/api/bookmarks/profitability-01", headers=auth_headers)
    assert r.status_code == 200
    assert api.get(f"{BASE_URL}/api/bookmarks", headers=auth_headers).json() == []


def test_bookmark_unknown_case(api, auth_headers):
    r = api.post(f"{BASE_URL}/api/bookmarks", json={"case_id": "does-not-exist"}, headers=auth_headers)
    assert r.status_code == 404, r.text


# --- sessions ---
def test_start_session_and_detail(api, auth_headers):
    r = api.post(f"{BASE_URL}/api/sessions?case_id=guesstimate-01", headers=auth_headers)
    assert r.status_code == 200, r.text
    data = r.json()
    sid = data["session_id"]
    assert data["case"]["id"] == "guesstimate-01"

    detail = api.get(f"{BASE_URL}/api/sessions/{sid}", headers=auth_headers)
    assert detail.status_code == 200, detail.text
    d = detail.json()
    assert d["id"] == sid
    assert d["case_id"] == "guesstimate-01"
    assert d["case_title"] == "How many rides?"
    assert d["case_type"] == "Guesstimate"
    assert d["messages"] == []
    assert d["completed"] is False
    assert "_id" not in d

    listed = api.get(f"{BASE_URL}/api/sessions", headers=auth_headers)
    assert listed.status_code == 200
    assert sid in [s["id"] for s in listed.json()]


def test_start_session_unknown_case(api, auth_headers):
    r = api.post(f"{BASE_URL}/api/sessions?case_id=nope", headers=auth_headers)
    assert r.status_code == 404


def test_session_detail_not_owned(api, auth_headers):
    # session created by another user must 404 for this user
    other_email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
    reg = api.post(f"{BASE_URL}/api/auth/register", json={"email": other_email, "password": "PracticeRoom2026"})
    assert reg.status_code == 200
    other_headers = {"Authorization": f"Bearer {reg.json()['token']}"}
    sid = api.post(f"{BASE_URL}/api/sessions?case_id=profitability-01", headers=other_headers).json()["session_id"]

    r = api.get(f"{BASE_URL}/api/sessions/{sid}", headers=auth_headers)
    assert r.status_code == 404, r.text


def test_message_on_unknown_session(api, auth_headers):
    r = api.post(f"{BASE_URL}/api/sessions/{uuid.uuid4()}/message", json={"message": "hi"}, headers=auth_headers)
    assert r.status_code == 404


# --- progress ---
def test_progress_shape(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/progress", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert set(["completed", "xp", "sessions"]).issubset(d.keys())
    assert d["completed"] == len(d["sessions"])
    assert all(s.get("completed") for s in d["sessions"])

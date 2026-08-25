import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL is missing from env and /app/frontend/.env")
BASE_URL = base_url.rstrip("/")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def test_account(api):
    """Register a fresh throwaway account for the whole session."""
    email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
    password = "PracticeRoom2026"
    r = api.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": password})
    if r.status_code != 200:
        pytest.fail(f"register failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    return {"email": email, "password": password, "token": data["token"], "id": data["user"]["id"]}


@pytest.fixture(scope="session")
def auth_headers(test_account):
    return {"Authorization": f"Bearer {test_account['token']}"}

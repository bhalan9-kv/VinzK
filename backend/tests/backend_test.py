"""Regression checks for auth-protected case session and progress APIs."""
import os
import uuid
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


def test_authenticated_session_and_progress():
    email = f"TEST_{uuid.uuid4().hex}@example.com"
    password = "CaseTest2026!"
    register = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": password})
    assert register.status_code == 200, register.text
    token = register.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    session = requests.post(
        f"{BASE_URL}/api/sessions?case_id=profitability-01", headers=headers
    )
    assert session.status_code == 200, session.text
    assert session.json()["case"]["id"] == "profitability-01"

    progress = requests.get(f"{BASE_URL}/api/progress", headers=headers)
    assert progress.status_code == 200, progress.text
    assert progress.json()["completed"] == 0
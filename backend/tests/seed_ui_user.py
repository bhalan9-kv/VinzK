"""Seed a scored session for UI history testing."""
import os
import requests
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
EMAIL = "qa.reviewer.ui@example.com"
PWD = "PracticeRoom2026"

r = requests.post(f"{BASE}/api/auth/register", json={"email": EMAIL, "password": PWD})
if r.status_code == 409:
    r = requests.post(f"{BASE}/api/auth/login", json={"email": EMAIL, "password": PWD})
print("auth", r.status_code)
h = {"Authorization": f"Bearer {r.json()['token']}"}

prog = requests.get(f"{BASE}/api/progress", headers=h).json()
if prog["completed"] == 0:
    sid = requests.post(f"{BASE}/api/sessions?case_id=guesstimate-01", headers=h).json()["session_id"]
    for m in [
        "Ready. I'll build bottom-up: NYC population, taxi user share, rides per user per year.",
        "Final recommendation: about 40 million taxi rides per year in NYC, from 4M users x 10 rides. "
        "That's my final answer and synthesis. Please score me.",
        "That is my final recommendation, please score me now.",
    ]:
        resp = requests.post(f"{BASE}/api/sessions/{sid}/message", json={"message": m}, headers=h, timeout=180).json()
        print("score?", bool(resp.get("score")))
        if resp.get("score"):
            break
print("progress:", requests.get(f"{BASE}/api/progress", headers=h).json()["completed"])
print("credentials:", EMAIL, PWD)

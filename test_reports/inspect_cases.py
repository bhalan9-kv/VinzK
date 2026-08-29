import requests, re
from collections import Counter
from dotenv import dotenv_values
BASE = dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"].rstrip("/")
cases = requests.get(f"{BASE}/api/cases").json()
cb = [c for c in cases if c.get("level") == "Casebook"]
verb = [c for c in cb if not c["prompt"].startswith("You are working through")]
print("total", len(cases), "casebook", len(cb), "verbatim", len(verb))
print("difficulty", dict(Counter(c["difficulty"] for c in cases)))
print("cb difficulty", dict(Counter(c["difficulty"] for c in cb)))
print()
for c in verb[:40]:
    print(f"- [{c['difficulty']}] {c['title']} (p.{c['source_pages']}): {c['prompt'][:150]}")
print()
print("=== sample fallbacks ===")
for c in cb:
    if c["prompt"].startswith("You are working through"):
        print("-", c["title"], c["difficulty"], "p."+c["source_pages"])

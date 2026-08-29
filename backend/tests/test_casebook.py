"""Wave A: Casebook deep import fixtures — counts, difficulty vocabulary, source_pages,
verbatim prompts, and the casebook_text field being stripped from every API response."""
import re

import pytest

from conftest import BASE_URL

ALLOWED_DIFFICULTY = {"Easy", "Medium", "Hard"}
VERBATIM_STARTS = ("estimate", "your client", "a client", "the client", "a global",
                   "a leading", "our client", "a premium", "a major", "a fortune", "a company")


@pytest.fixture(scope="module")
def cases(api):
    r = api.get(f"{BASE_URL}/api/cases")
    assert r.status_code == 200, r.text
    return r.json()


def test_total_case_count(cases):
    casebook = [c for c in cases if c.get("level") == "Casebook"]
    core = [c for c in cases if c.get("level") != "Casebook"]
    assert len(core) == 6, f"expected 6 core cases, got {len(core)}"
    assert len(casebook) == 95, f"expected 95 casebook cases, got {len(casebook)}"
    assert len(cases) == 101, f"expected 101 total cases, got {len(cases)}"


def test_no_moderate_anywhere(api, cases):
    """'Moderate' must not appear in any field of any case (difficulty, tags, level, prompt)."""
    offenders = []
    for c in cases:
        blob = repr(c)
        if re.search(r"moderate", blob, re.IGNORECASE):
            offenders.append(c["id"])
    assert not offenders, f"'Moderate' still present in: {offenders[:10]}"
    raw = api.get(f"{BASE_URL}/api/cases").text
    assert "Moderate" not in raw and "moderate" not in raw


def test_difficulty_vocabulary(cases):
    bad = [(c["id"], c.get("difficulty")) for c in cases if c.get("difficulty") not in ALLOWED_DIFFICULTY]
    assert not bad, f"invalid difficulty values: {bad[:10]}"


def test_casebook_text_not_exposed(cases):
    leaked = [c["id"] for c in cases if "casebook_text" in c]
    assert not leaked, f"casebook_text leaked in /api/cases for: {leaked[:5]}"


def test_casebook_cases_have_source_pages(cases):
    casebook = [c for c in cases if c.get("level") == "Casebook"]
    missing = [c["id"] for c in casebook if not c.get("source_pages")]
    assert not missing, f"missing source_pages: {missing[:10]}"
    for c in casebook:
        assert str(c["source_pages"]).isdigit(), f"{c['id']} source_pages={c['source_pages']}"
        assert c.get("source") == "FMS Consulting CaseBook 2024-25"


def test_verbatim_prompt_subset(cases):
    """~34 casebook cases should carry a printed casebook prompt rather than the generic fallback."""
    casebook = [c for c in cases if c.get("level") == "Casebook"]
    verbatim = [c for c in casebook
                if not c["prompt"].startswith("You are working through")
                and c["prompt"].strip().lower().startswith(VERBATIM_STARTS)]
    print(f"verbatim prompts: {len(verbatim)}/{len(casebook)}")
    assert len(verbatim) >= 25, f"only {len(verbatim)} verbatim prompts extracted"
    for c in verbatim:
        assert len(c["prompt"]) > 45


@pytest.mark.parametrize("case_id", ["fms-orchard-farmer", "fms-retail-chain", "fms-biscuit-manufacturer"])
def test_named_grounded_cases_have_verbatim_prompt(cases, case_id):
    c = next((x for x in cases if x["id"] == case_id), None)
    assert c is not None, f"{case_id} missing from catalog"
    assert not c["prompt"].startswith("You are working through"), f"{case_id} fell back to generic prompt"
    assert c["prompt"].strip().lower().startswith(VERBATIM_STARTS)


def test_session_start_strips_casebook_text(api, auth_headers):
    r = api.post(f"{BASE_URL}/api/sessions?case_id=fms-electricity-consumption", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.text
    assert "casebook_text" not in body
    case = r.json()["case"]
    assert case["difficulty"] in ALLOWED_DIFFICULTY
    assert case["source_pages"]
    assert "Moderate" not in body


def test_core_cases_difficulty(cases):
    core = {c["id"]: c["difficulty"] for c in cases if c.get("level") != "Casebook"}
    assert core["profitability-01"] == "Medium"
    assert core["gtm-01"] == "Medium"
    assert core["entry-01"] == "Hard"
    assert core["guesstimate-01"] == "Easy"


def test_difficulty_distribution(cases):
    from collections import Counter
    dist = Counter(c["difficulty"] for c in cases)
    print("difficulty distribution:", dict(dist))
    for level in ALLOWED_DIFFICULTY:
        assert dist[level] > 0, f"no cases with difficulty {level}"

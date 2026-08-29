"""Verifies the app still boots (and cases still build) when the casebook PDF is missing,
and that any 'Moderate' label printed in the PDF is normalised to 'Medium'."""
import os
import subprocess
import sys
import textwrap


def test_backend_boots_without_pdf():
    code = textwrap.dedent("""
        import os, sys
        os.environ["CASEBOOK_PDF_PATH"] = "/tmp/definitely-missing-casebook.pdf"
        sys.path.insert(0, "/app/backend")
        import server
        cases = server.CASES
        cb = [c for c in cases if c.get("level") == "Casebook"]
        assert len(cases) == 101, len(cases)
        assert server.CASEBOOK_PAGES == [], "pages should be empty"
        assert all(c["difficulty"] in ("Easy", "Medium", "Hard") for c in cases)
        assert all(c["prompt"].startswith("You are working through") for c in cb)
        assert all(c["casebook_text"] == "" for c in cb)
        assert server._build_casebook_context(cb[0]) == ""
        p = server.case_prompt(cb[0])
        assert "CASEBOOK SOURCE MATERIAL (private" not in p
        assert "Moderate" not in p
        print("NO_PDF_OK", len(cases))
    """)
    r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd="/app/backend")
    print(r.stdout[-2000:], r.stderr[-2000:])
    assert r.returncode == 0, f"backend import failed without PDF: {r.stderr[-1500:]}"
    assert "NO_PDF_OK 101" in r.stdout


def test_moderate_label_in_pdf_is_normalised():
    code = textwrap.dedent("""
        import sys, re
        sys.path.insert(0, "/app/backend")
        import server
        pdf_has_moderate = any(re.search(r"\\|\\s*Moderate", p or "", re.I) for p in server.CASEBOOK_PAGES)
        print("PDF_HAS_MODERATE", pdf_has_moderate)
        print("DETECT_MODERATE", server._detect_difficulty("Profitability | Moderate | Bain & Co."))
        print("DETECT_DIFFICULT", server._detect_difficulty("Market Entry | Difficult | BCG"))
        print("DETECT_EASY", server._detect_difficulty("Profitability | Easy | Bain & Co."))
        public = [{k: v for k, v in c.items() if k != "casebook_text"} for c in server.CASES]
        assert all("Moderate" not in repr(c) for c in public), "Moderate leaked into a public case field"
        print("OK")
    """)
    r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, cwd="/app/backend")
    print(r.stdout[-2000:], r.stderr[-1500:])
    assert r.returncode == 0, r.stderr[-1500:]
    assert "DETECT_MODERATE Medium" in r.stdout
    assert "DETECT_DIFFICULT Hard" in r.stdout
    assert "DETECT_EASY Easy" in r.stdout
    assert "OK" in r.stdout

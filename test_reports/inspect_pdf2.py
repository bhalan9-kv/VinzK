from pypdf import PdfReader
import re
r = PdfReader("/tmp/fms_casebook.pdf")
def clean(t):
    t = re.sub(r"©\s*The Consulting Club, FMS Delhi 20\d{2}-\d{2}", "", t or "")
    t = re.sub(r"[ \t]+", " ", t); t = re.sub(r"\n\s*\n+", "\n\n", t)
    return t.strip()
for pg, name in [(91, "Number of Umbrellas Sold"), (136, "E-Commerce Company"), (176, "Home Insurance Entry"), (267, "Coffee Shop")]:
    print("=== index", pg, "expected:", name, "===")
    print(clean(r.pages[pg].extract_text())[:600])
    print()

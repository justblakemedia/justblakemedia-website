#!/usr/bin/env python3
"""Site checks for justblakemedia.com. Exit 1 on any failure. Run from repo root."""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "404.html", "cs-dre.html", "cs-nonprofit.html", "cs-advocacy.html"] + [
    os.path.join(d, "index.html") for d in
    ["about", "ai-instructions", "ai-systems", "amplify", "case-studies", "contact", "learn", "paid-media", "pricing", "workshops", os.path.join("learn", "boost-vs-ads")]
]

def read(p):
    return io.open(os.path.join(ROOT, p), encoding="utf-8").read()

failures = []
def check(cond, msg):
    if not cond:
        failures.append(msg)

html = {p: read(p) for p in PAGES if os.path.exists(os.path.join(ROOT, p))}
check(os.path.exists(os.path.join(ROOT, "learn", "boost-vs-ads", "index.html")), "learn/boost-vs-ads/index.html is missing")

# 1. One CTA name. The invented one is gone everywhere.
for p, s in html.items():
    check("Growth Systems Call" not in s, f"{p}: 'Growth Systems Call' still present")

# 2. The seven-page duplicate closer is gone.
dup = "Book the call, or send me the account and I will send back what I would change first"
n_dup = sum(dup in s for s in html.values())
check(n_dup == 0, f"duplicate closer paragraph still on {n_dup} page(s)")

# 3. Exactly one h1 per page.
for p, s in html.items():
    n = len(re.findall(r"<h1[\s>]", s))
    check(n == 1, f"{p}: {n} h1 elements")

# 4. GTM on every page.
for p, s in html.items():
    check("GTM-W5BPG572" in s, f"{p}: GTM container missing")

# 5. No em or en dashes anywhere.
for p, s in html.items():
    check("—" not in s and "–" not in s, f"{p}: em or en dash present")

# 6. Homepage form asks one open question, not a product dropdown.
home = html.get("index.html", "")
check('name="need"' not in home, "index.html: product dropdown (name=need) still in the form")
after = home.split('name="fix"')[1][:200] if 'name="fix"' in home else ""
check('name="fix"' in home and "required" in after, "index.html: required open question (name=fix) missing")

# 7. Homepage has no Amplify door and no Amplify in the hero.
check('data-door="Amplify"' not in home, "index.html: Amplify door still present")
hero = re.search(r'<section class="hero[^"]*".*?</section>', home, re.S)
check(bool(hero) and "Amplify" not in hero.group(0), "index.html: Amplify named in the hero")

# 8. Above-the-fold copy is short: badge + h1 + lede + buttons under 60 words.
if hero:
    trimmed = re.sub(r'<dl class="hero-proof.*', "", hero.group(0), flags=re.S)
    trimmed = re.sub(r'<div class="proofrow.*', "", trimmed, flags=re.S)
    trimmed = re.sub(r"<svg.*?</svg>", " ", trimmed, flags=re.S)
    words = re.sub(r"<[^>]+>", " ", trimmed)
    words = re.sub(r"\s+", " ", words).strip().split()
    check(len(words) <= 60, f"index.html: hero copy is {len(words)} words (limit 60)")

# 9. Testimonials file exists, parses, and every entry has the four fields.
tpath = os.path.join(ROOT, "assets", "testimonials.json")
check(os.path.exists(tpath), "assets/testimonials.json missing")
if os.path.exists(tpath):
    try:
        data = json.load(io.open(tpath, encoding="utf-8"))
        check(isinstance(data, list), "testimonials.json is not a list")
        if isinstance(data, list):
            for i, t in enumerate(data):
                for k in ("quote", "name", "role", "company"):
                    check(k in t and str(t[k]).strip(), f"testimonials.json[{i}] missing {k}")
    except json.JSONDecodeError as e:
        check(False, f"testimonials.json invalid: {e}")

# 10. Sitemap lists the new page.
sm = read("sitemap.xml")
check("https://justblakemedia.com/learn/boost-vs-ads/" in sm, "sitemap.xml missing /learn/boost-vs-ads/")

# 11. Every internal href resolves.
def resolves(href):
    href = href.split("#")[0]
    if not href or href.startswith(("http", "mailto:", "tel:", "data:")):
        return True
    path = href.lstrip("/")
    full = os.path.join(ROOT, path)
    if href.endswith("/"):
        return os.path.exists(os.path.join(full, "index.html"))
    return os.path.exists(full) or os.path.exists(os.path.join(full, "index.html"))
for p, s in html.items():
    for href in re.findall(r'href="([^"]+)"', s):
        check(resolves(href), f"{p}: dead link {href}")

# 12. Titles are unique.
titles = {p: (re.search(r"<title>([^<]*)</title>", s) or [None, ""])[1] for p, s in html.items()}
vals = list(titles.values())
dupes = sorted({t for t in vals if vals.count(t) > 1})
check(not dupes, "duplicate <title> values: " + str(dupes))

if failures:
    print("FAIL")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print(f"PASS: {len(html)} pages, all checks green")

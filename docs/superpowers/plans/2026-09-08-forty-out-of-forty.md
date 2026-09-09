# Forty Out of Forty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take justblakemedia.com from 28/40 to 40/40 on the 2026-09-08 content audit by rebuilding the site around the visitor's problem, so that the last four points land the moment Justin pastes the form key, adds a photo, and drops in real testimonials.

**Architecture:** Static HTML, one stylesheet (`assets/site.css`), one script (`assets/site.js`), no build step. Every change is a source edit verified by a Python check script that acts as the test suite, plus a Chrome render at 1440 and 390. Cross-cutting edits (CTA rename, closers, titles) are scripted across all pages; per-page rewrites are independent tasks; the homepage is rebuilt last because it depends on the CSS and script additions.

**Tech Stack:** HTML5, CSS custom properties, vanilla JS, Python 3 for the check harness, headless Chrome for renders, Vercel for hosting (branch `brain-dump-homepage`, PR #19).

---

## Why each task moves the score

| Category | Now | Target | What earns it | Gated on Justin |
|---|---|---|---|---|
| Intent and audience fit | 3 | 5 | Homepage H1 is the outcome, subhead is the visitor's problem in their words, one door (Tasks 3, 11) | No |
| Clarity and structure | 3 | 5 | One CTA name site-wide, seven unique closers, no framework vocabulary in H1 positions, three menus become one (Tasks 2, 3, 6, 11) | No |
| Completeness and originality | 4 | 5 | Case studies hub becomes the proof page, boost-vs-ads gets its own URL, the five frustrations reach the homepage (Tasks 7, 8, 11) | No |
| Trust and accuracy | 3 | 5 | Testimonial infrastructure ships empty and honest; photo slot wired; +1 built, +1 gated | Photo, three testimonials |
| SEO and discoverability | 4 | 5 | Every title and description problem-first, new indexable comparison page, sitemap current (Tasks 8, 10) | No |
| Accessibility | 5 | 5 | Unchanged; harness asserts one h1 per page and link integrity | No |
| Technical quality | 4 | 5 | Link check, GTM on every page verified, no dead anchors; +1 when GA4 shows data | Confirm GA4 receives events |
| Conversion clarity | 2 | 5 | Form loses the product dropdown, asks one open question, sits below proof, same key activates both forms; +2 built, +1 gated | Form access key |

**Built by this plan: 36. Gated: 4** (photo, testimonials, GA4 confirmation, form key). Nothing in this plan fabricates a quote, a face, or a number.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `scripts/check-site.py` | The test suite: 12 assertions over every HTML file | Create |
| `assets/site.css` | Append `.heard`, `.buy`, `.voices`, `.date-strip`, `.portrait-frame.has-photo` rules | Modify (append only) |
| `assets/site.js` | Append the testimonials renderer | Modify (append only) |
| `assets/testimonials.json` | Ships as `[]`. One object per real quote, added by Justin | Create |
| `assets/testimonials.README.md` | How to add a quote | Create |
| `index.html` | Full rebuild of `<main>` and `<head>` metadata | Modify |
| `paid-media/index.html` | New H1, lede, buttons, friction line, closer | Modify |
| `ai-systems/index.html` | New H1, lede, frustrations moved up, closer | Modify |
| `pricing/index.html` | New H1, rules section moved below FAQ, closer | Modify |
| `case-studies/index.html` | Expanded into the proof hub with testimonial slot | Modify |
| `about/index.html` | Photo slot, closer | Modify |
| `contact/index.html` | Open question required, spend optional, metadata | Modify |
| `workshops/index.html`, `learn/index.html`, `amplify/index.html` | CTA rename, closers, links | Modify |
| `learn/boost-vs-ads/index.html` | New standalone comparison page with FAQPage schema | Create |
| `ai-instructions/index.html` | CTA name, one-sentence description | Modify |
| `sitemap.xml` | Add the new URL, bump lastmod | Modify |
| All 11 pages | Remove top-level "Amplify" nav link (menu entry stays) | Modify (scripted) |

---

### Task 0: The test harness

**Files:**
- Create: `scripts/check-site.py`

- [ ] **Step 1: Write the check script**

```python
#!/usr/bin/env python3
"""Site checks for justblakemedia.com. Exit 1 on any failure. Run from repo root."""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ["index.html", "404.html", "cs-dre.html", "cs-nonprofit.html", "cs-advocacy.html"] + [
    os.path.join(d, "index.html") for d in
    ["about", "ai-instructions", "ai-systems", "amplify", "case-studies", "contact", "learn", "paid-media", "pricing", "workshops", os.path.join("learn", "boost-vs-ads")]
]
SITE_PAGES = [p for p in PAGES if not p.startswith(("404", "cs-advocacy"))]  # advocacy is unlinked by standing decision

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
check(sum(dup in s for s in html.values()) == 0, f"duplicate closer paragraph still on {sum(dup in s for s in html.values())} page(s)")

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
home = html["index.html"]
check('name="need"' not in home, "index.html: product dropdown (name=need) still in the form")
check('name="fix"' in home and "required" in home.split('name="fix"')[1][:200], "index.html: required open question (name=fix) missing")

# 7. Homepage has no Amplify door and no Amplify in the hero.
check('data-door="Amplify"' not in home, "index.html: Amplify door still present")
hero = re.search(r'<section class="hero[^"]*".*?</section>', home, re.S)
check(hero and "Amplify" not in hero.group(0), "index.html: Amplify named in the hero")

# 8. Above-the-fold copy is short: badge + h1 + lede + buttons under 60 words.
if hero:
    words = re.sub(r"<[^>]+>", " ", re.sub(r"<div class=\"proofrow.*", "", hero.group(0), flags=re.S))
    words = re.sub(r"\s+", " ", words).strip().split()
    check(len(words) <= 60, f"index.html: hero copy is {len(words)} words (limit 60)")

# 9. Testimonials file exists, parses, and every entry has the four fields.
tpath = os.path.join(ROOT, "assets", "testimonials.json")
check(os.path.exists(tpath), "assets/testimonials.json missing")
if os.path.exists(tpath):
    try:
        data = json.load(io.open(tpath, encoding="utf-8"))
        check(isinstance(data, list), "testimonials.json is not a list")
        for i, t in enumerate(data):
            for k in ("quote", "name", "role", "company"):
                check(k in t and t[k].strip(), f"testimonials.json[{i}] missing {k}")
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
titles = {p: re.search(r"<title>([^<]*)</title>", s).group(1) for p, s in html.items()}
check(len(set(titles.values())) == len(titles), "duplicate <title> values: " + str([t for t in titles.values() if list(titles.values()).count(t) > 1]))

if failures:
    print("FAIL")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print(f"PASS: {len(html)} pages, all checks green")
```

- [ ] **Step 2: Run it to verify it fails on the current site**

Run: `python scripts/check-site.py`
Expected: `FAIL` with lines including `'Growth Systems Call' still present` on nine pages, `duplicate closer paragraph still on 7 page(s)`, `product dropdown (name=need) still in the form`, `Amplify door still present`, `learn/boost-vs-ads/index.html is missing`, `assets/testimonials.json missing`.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-site.py
git commit -m "test: add the site check harness that the 40/40 plan is verified against"
```

---

### Task 1: One name for the call, everywhere

**Files:**
- Modify: every `.html` file containing `Growth Systems Call`, and `contact/index.html` metadata

- [ ] **Step 1: Rename the call in one pass**

```bash
python - <<'EOF'
import io, glob, re
files = [f for f in glob.glob("**/*.html", recursive=True) if "node_modules" not in f]
for f in files:
    s = io.open(f, encoding="utf-8").read()
    n = s
    n = n.replace("Book a Growth Systems Call", "Book a 20-minute call")
    n = n.replace("Book a free Growth Systems Call", "Book a free 20-minute call")
    n = n.replace('linked from every page of this site as "Book a Growth Systems Call"', 'linked from every page of this site as "Book a 20-minute call"')
    n = n.replace("Growth Systems Call", "20-minute call")
    if n != s:
        io.open(f, "w", encoding="utf-8", newline="\n").write(n)
        print("renamed in", f)
EOF
```

- [ ] **Step 2: Verify none remain**

Run: `grep -rl "Growth Systems Call" --include=*.html . | wc -l`
Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add -A -- '*.html'
git commit -m "copy: one plain name for the call on every page"
```

---

### Task 2: Seven unique closers

**Files:**
- Modify: `paid-media/index.html`, `ai-systems/index.html`, `workshops/index.html`, `case-studies/index.html`, `pricing/index.html`, `learn/index.html`, `about/index.html` (the `<section class="cta-band">` block in each)

The block to replace on each page is identical and reads:

```html
    <section class="cta-band" aria-labelledby="cta-band-title">
      <div class="shell">
        <h2 class="display" id="cta-band-title">Ready to get started?</h2>
        <p>Book the call, or send me the account and I will send back what I would change first. Free, from me, usually within two business days.</p>
        <div class="btn-row">
          <a class="btn" href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc=">Book a 20-minute call</a>
          <a class="btn btn-ghost" href="/contact/#audit">Send me the account</a>
        </div>
      </div>
    </section>
```

- [ ] **Step 1: Replace the h2 and p on each page with these**

| Page | h2 | p | Primary button | Secondary button |
|---|---|---|---|---|
| paid-media | Start with the account you already have. | Send it over and I will send back the three things I would change first, free, in two business days. Or book twenty minutes and we do it live. | Send me the account → `/contact/#audit` | Book a 20-minute call → calendar |
| ai-systems | Bring the task that ate your week. | Twenty minutes, your screen, the one thing you keep redoing. You leave knowing whether it is worth automating and roughly what that costs. | Book a 20-minute call → calendar | Send me the task → `/contact/#audit` |
| workshops | Have a room and a Tuesday? | Tell me the team, the tools they already use, and what they are losing hours to. You get a session outline and a price on the same call. | Ask about a session → calendar | Tell me about the room → `/contact/#audit` |
| case-studies | Want yours to be the next one? | Every study here started with a tracking audit and an honest number. Send me the account and you get the same first step, free. | Send me the account → `/contact/#audit` | Book a 20-minute call → calendar |
| pricing | Not sure which door? | Twenty minutes, free. If a $3,500 Sprint is the wrong shape for your budget I will say so, and you leave with a name who fits. | Book a 20-minute call → calendar | Send me the account → `/contact/#audit` |
| learn | Have a question that is not here? | Ask it. If it is one I get asked twice, it goes on this page, with your name left off. | Ask on a 20-minute call → calendar | Send it to me → `/contact/#audit` |
| about | Still reading? Then we should probably talk. | Twenty minutes, free. If I am the wrong fit you hear it on the call, with a name who is right. | Book a 20-minute call → calendar | See the work → `/case-studies/` |

Script that applies the table:

```python
import io, re
CAL = "https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc="
closers = {
 "paid-media/index.html": ("Start with the account you already have.", "Send it over and I will send back the three things I would change first, free, in two business days. Or book twenty minutes and we do it live.", ("Send me the account", "/contact/#audit"), ("Book a 20-minute call", CAL)),
 "ai-systems/index.html": ("Bring the task that ate your week.", "Twenty minutes, your screen, the one thing you keep redoing. You leave knowing whether it is worth automating and roughly what that costs.", ("Book a 20-minute call", CAL), ("Send me the task", "/contact/#audit")),
 "workshops/index.html": ("Have a room and a Tuesday?", "Tell me the team, the tools they already use, and what they are losing hours to. You get a session outline and a price on the same call.", ("Ask about a session", CAL), ("Tell me about the room", "/contact/#audit")),
 "case-studies/index.html": ("Want yours to be the next one?", "Every study here started with a tracking audit and an honest number. Send me the account and you get the same first step, free.", ("Send me the account", "/contact/#audit"), ("Book a 20-minute call", CAL)),
 "pricing/index.html": ("Not sure which door?", "Twenty minutes, free. If a $3,500 Sprint is the wrong shape for your budget I will say so, and you leave with a name who fits.", ("Book a 20-minute call", CAL), ("Send me the account", "/contact/#audit")),
 "learn/index.html": ("Have a question that is not here?", "Ask it. If it is one I get asked twice, it goes on this page, with your name left off.", ("Ask on a 20-minute call", CAL), ("Send it to me", "/contact/#audit")),
 "about/index.html": ("Still reading? Then we should probably talk.", "Twenty minutes, free. If I am the wrong fit you hear it on the call, with a name who is right.", ("Book a 20-minute call", CAL), ("See the work", "/case-studies/")),
}
pat = re.compile(r'(<section class="cta-band" aria-labelledby="cta-band-title">\s*<div class="shell">\s*)<h2 class="display" id="cta-band-title">[^<]*</h2>\s*<p>[^<]*</p>\s*<div class="btn-row">\s*<a class="btn" href="[^"]*">[^<]*</a>\s*<a class="btn btn-ghost" href="[^"]*">[^<]*</a>', re.S)
for f, (h2, p, (b1, u1), (b2, u2)) in closers.items():
    s = io.open(f, encoding="utf-8").read()
    new = (r'\1' + f'<h2 class="display" id="cta-band-title">{h2}</h2>\n        <p>{p}</p>\n        <div class="btn-row">\n          <a class="btn" href="{u1}">{b1}</a>\n          <a class="btn btn-ghost" href="{u2}">{b2}</a>')
    s2, n = pat.subn(lambda m: new.replace(r'\1', m.group(1)), s, count=1)
    assert n == 1, f
    io.open(f, "w", encoding="utf-8", newline="\n").write(s2)
    print("closer replaced in", f)
```

- [ ] **Step 2: Verify**

Run: `grep -rl "Book the call, or send me the account and I will send back" --include=*.html . | wc -l`
Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add -A -- '*.html'
git commit -m "copy: give each page its own closer instead of one paragraph seven times"
```

---

### Task 3: Testimonial infrastructure, shipped empty

**Files:**
- Create: `assets/testimonials.json`
- Create: `assets/testimonials.README.md`
- Modify: `assets/site.js` (append)
- Modify: `assets/site.css` (append)

- [ ] **Step 1: Create the data file as an empty list**

`assets/testimonials.json`:
```json
[]
```

- [ ] **Step 2: Create the README**

`assets/testimonials.README.md`:
```markdown
# Testimonials

`testimonials.json` is a list. It ships empty. The site renders a "In their words" section on the homepage, the case studies page and the about page only when the list has at least one entry. Nothing renders while it is empty, so nothing on the site is ever a placeholder quote.

Add one object per real, attributed quote:

```json
[
  {
    "quote": "The exact words they wrote, unedited.",
    "name": "First Last",
    "role": "Title",
    "company": "Company, or 'property management client' if anonymised",
    "link": "https://optional-url"
  }
]
```

`link` is optional. Never add a quote that was not written or approved by the person named.
```

- [ ] **Step 3: Append the renderer to `assets/site.js`**

```javascript

/* ---------- testimonials: rendered only when assets/testimonials.json has entries ---------- */
(() => {
  const mounts = document.querySelectorAll("[data-testimonials]");
  if (!mounts.length || !("fetch" in window)) return;
  fetch("/assets/testimonials.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : []))
    .then((list) => {
      if (!Array.isArray(list) || !list.length) return;
      mounts.forEach((mount) => {
        const max = parseInt(mount.getAttribute("data-max") || "3", 10);
        const ul = document.createElement("ul");
        ul.className = "voices";
        list.slice(0, max).forEach((t) => {
          if (!t.quote || !t.name) return;
          const li = document.createElement("li");
          const q = document.createElement("blockquote");
          q.textContent = t.quote;
          const cite = document.createElement("cite");
          const who = [t.name, t.role, t.company].filter(Boolean).join(", ");
          if (t.link) { const a = document.createElement("a"); a.href = t.link; a.rel = "noopener"; a.textContent = who; cite.appendChild(a); }
          else cite.textContent = who;
          li.appendChild(q); li.appendChild(cite); ul.appendChild(li);
        });
        if (!ul.children.length) return;
        mount.appendChild(ul);
        mount.hidden = false;
      });
    })
    .catch(() => {});
})();
```

- [ ] **Step 4: Append the styles to `assets/site.css`**

```css

/* ---------- 40/40 additions, 2026-09-08 ---------- */

/* testimonials: the section is hidden until site.js finds entries */
.voices-section[hidden] { display: none; }
.voices { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
.voices li { display: grid; gap: 14px; padding: 28px; border-radius: var(--r); background: var(--white); border: 1px solid var(--border); }
.on-dark .voices li { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.1); }
.voices blockquote { margin: 0; font-size: 18px; line-height: 28px; color: var(--ink); }
.on-dark .voices blockquote { color: var(--white); }
.voices blockquote::before { content: "\201C"; color: var(--cobalt); }
.voices blockquote::after { content: "\201D"; color: var(--cobalt); }
.on-dark .voices blockquote::before, .on-dark .voices blockquote::after { color: var(--lime); }
.voices cite { color: var(--ink-2); font-size: 13px; font-style: normal; letter-spacing: 0.05em; text-transform: uppercase; }
.on-dark .voices cite { color: rgba(255, 255, 255, 0.66); }
.voices cite a { color: inherit; }

/* the five things heard on every first call */
.heard { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
.heard li { display: grid; grid-template-columns: 1.1fr 1fr auto; gap: 24px 40px; align-items: center; padding: 26px 0; border-bottom: 1px solid var(--border); }
.heard q { font-size: 22px; font-weight: 500; line-height: 30px; color: var(--ink); quotes: "\201C" "\201D"; }
.heard p { color: var(--ink-2); font-size: 15px; line-height: 22px; }
.heard .text-link { min-height: 0; white-space: nowrap; }

/* one door, and the layer that makes it better than an agency */
.buy { display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; }
.buy-main, .buy-layer { display: grid; gap: 14px; align-content: start; padding: 32px; border-radius: var(--r-lg); }
.buy-main { background: var(--navy-2); color: var(--white); border: 1px solid rgba(255, 255, 255, 0.05); }
.buy-layer { background: var(--white); border: 1px solid var(--border); }
.buy h3 { font-size: 26px; font-variation-settings: "wdth" 80, "wght" 650; font-weight: 650; letter-spacing: -0.01em; line-height: 1.1; text-transform: uppercase; }
.buy-main .eyebrow { color: var(--lime); margin: 0; }
.buy-layer .eyebrow { margin: 0; }
.buy p { font-size: 16px; line-height: 24px; color: var(--ink-2); }
.buy-main p { color: rgba(255, 255, 255, 0.78); }
.buy ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; font-size: 15px; line-height: 22px; color: var(--ink-2); }
.buy-main ul { color: rgba(255, 255, 255, 0.86); }
.buy li { display: flex; gap: 10px; align-items: flex-start; }
.buy li::before { content: "\2713"; flex: 0 0 auto; color: var(--cobalt); font-weight: 700; }
.buy-main li::before { color: var(--lime); }
.buy .btn-row { margin-top: 6px; }
.buy-main .btn { background: var(--white); color: var(--navy); }
.buy-main .btn:hover { background: var(--lime); }

/* the hero proof row */
.hero-proof { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px 20px; margin-top: 8px; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.16); text-align: left; }
.hero-proof b { display: block; color: var(--lime); font-size: 28px; font-variation-settings: "wdth" 80, "wght" 650; font-weight: 650; font-variant-numeric: tabular-nums; line-height: 1; }
.hero-proof span { display: block; margin-top: 6px; color: rgba(255, 255, 255, 0.62); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; line-height: 15px; text-transform: uppercase; }
.hero-proof-source { grid-column: 1 / -1; margin-top: 4px; color: rgba(255, 255, 255, 0.6); font-size: 13px; }
.hero-proof-source a { color: var(--lime); }
.hero-lead .hero-copy { max-width: 720px; }

/* the lead form section, below the proof */
.lead-section .form-grid { align-items: center; }
.lead-section .audit-form { background: rgba(255, 255, 255, 0.04); }

/* one-line workshop strip */
.date-strip { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; padding: 20px 24px; border-radius: var(--r); background: var(--navy-2); color: var(--white); }
.date-strip strong { color: var(--lime); font-variation-settings: "wdth" 80, "wght" 650; font-weight: 650; text-transform: uppercase; letter-spacing: 0.02em; }
.date-strip p { color: rgba(255, 255, 255, 0.8); font-size: 15px; }
.date-strip .text-link { color: var(--lime); min-height: 0; }

/* about: photo slot */
.portrait-frame { overflow: hidden; }
.portrait-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.portrait-frame.has-photo { color: transparent; }

@media (max-width: 900px) {
  .heard li { grid-template-columns: 1fr; gap: 10px; }
  .heard q { font-size: 19px; line-height: 26px; }
  .buy { grid-template-columns: 1fr; }
  .hero-proof { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .hero-proof b { font-size: 24px; }
  .date-strip { padding: 18px; }
}
```

- [ ] **Step 5: Verify the JS parses and the JSON loads**

Run: `node -e "new Function(require('fs').readFileSync('assets/site.js','utf8')); console.log('js ok')" && python -c "import json; print(json.load(open('assets/testimonials.json')))"`
Expected: `js ok` then `[]`

- [ ] **Step 6: Commit**

```bash
git add assets/testimonials.json assets/testimonials.README.md assets/site.js assets/site.css
git commit -m "feat: testimonial infrastructure that renders nothing until a real quote exists"
```

---

### Task 4: Paid media leads with the visitor's problem

**Files:**
- Modify: `paid-media/index.html` lines 197-200 (H1, lede, primary button) and line 216 (friction)

- [ ] **Step 1: Replace the H1**

Old:
```html
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">I run your paid media. I fix the tracking first.</h1>
```
New:
```html
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">You are spending on ads and cannot tell what is actually working.</h1>
```

- [ ] **Step 2: Replace the lede**

Old:
```html
          <p class="lede" data-reveal data-reveal-delay="2">Meta and LinkedIn, run by the senior buyer who stays in your account. The tracking gets audited and rebuilt before any budget moves, because a campaign you cannot measure is a campaign you cannot defend.</p>
```
New:
```html
          <p class="lede" data-reveal data-reveal-delay="2">Every account I have taken over in the last year needed the tracking fixed before the strategy was worth arguing about. So that is where I start. Then I run Meta and LinkedIn myself, inside your account, with reporting you can forward to a board without explaining it.</p>
```

- [ ] **Step 3: Make "Send me the account" the primary button**

Old (line 200 and the ghost button after it):
```html
            <a class="btn btn-lg" href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc=">Book a 20-minute call</a>
            <a class="btn btn-lg btn-ghost" href="#sprint">Start with the Sprint</a>
```
New:
```html
            <a class="btn btn-lg" href="/contact/#audit">Send me the account</a>
            <a class="btn btn-lg btn-ghost" href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc=">Book a 20-minute call</a>
```

- [ ] **Step 4: Replace the friction line so the page does not repeat its own H1**

Old:
```html
          <p class="friction">I am spending money, but I cannot tell what is actually working.</p>
```
New:
```html
          <p class="friction">We tried ads. It did not work. Nobody could say why.</p>
```

- [ ] **Step 5: Add a link from the comparison section to its new standalone URL**

After the `<p class="lede">Three things people mean when they say "we tried ads." Only one of them tells you what you got for the money.</p>` line, insert:
```html
          <p class="routing">This table has its own page you can send to someone: <a href="/learn/boost-vs-ads/">boosting a post versus running ads versus a campaign</a>.</p>
```

- [ ] **Step 6: Verify one h1 and commit**

Run: `grep -c "<h1" paid-media/index.html`
Expected: `1`

```bash
git add paid-media/index.html
git commit -m "copy(paid-media): lead with the visitor's problem, promote the account review"
```

---

### Task 5: AI systems leads with the visitor's problem and shows the frustrations first

**Files:**
- Modify: `ai-systems/index.html` lines 197-200 (H1, lede), 234 (friction), and move the `fixes` section (lines 250-262) to directly after the hero (before line 211)

- [ ] **Step 1: Replace the H1**

Old:
```html
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">The busywork around the marketing, handed to a system you approve.</h1>
```
New:
```html
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">Your team keeps redoing work a system should already be handling.</h1>
```

- [ ] **Step 2: Replace the lede**

Old:
```html
          <p class="lede" data-reveal data-reveal-delay="2">Most buyers get one or the other: a media buyer who cannot build, or a developer who has never run a campaign. I do both, so the automation gets built by the person who knows what the campaign actually needs.</p>
```
New:
```html
          <p class="lede" data-reveal data-reveal-delay="2">The listing that needs an ad, the report that has to be chased, the follow-up nobody sent. I write it down as a job description and hand it to a system that drafts the work and waits for you. Built by the person who has run the campaigns, so it does what the marketing actually needs.</p>
```

- [ ] **Step 3: Move the frustrations section up**

Cut the entire `<section class="section on-dark" aria-labelledby="fixes-title"> ... </section>` block (currently after the "What changes" section) and paste it immediately after the closing `</section>` of the page hero, before `<section class="section on-dark" aria-labelledby="ladder-title">`. Change its class from `on-dark` to `on-cloud` so two dark sections do not stack, and change every `rgba(255, 255, 255, ...)` reliance inside it by leaving the markup alone; the `.fix` rules are dark-only, so add this CSS to `assets/site.css`:

```css
.on-cloud .fix, .on-white .fix { background: var(--white); border-color: var(--border); }
.on-cloud .fix .fix-heard, .on-white .fix .fix-heard { color: var(--ink); }
.on-cloud .fix .fix-label, .on-white .fix .fix-label { color: var(--cobalt); }
.on-cloud .fix p:last-child, .on-white .fix p:last-child { color: var(--ink-2); }
```

- [ ] **Step 4: Replace the friction line**

Old:
```html
          <p class="friction">My team keeps repeating work that should already be handled.</p>
```
New:
```html
          <p class="friction">I tried the tools. The output sounded like a press release.</p>
```

- [ ] **Step 5: Verify and commit**

Run: `python - <<'EOF'
s=open('ai-systems/index.html',encoding='utf-8').read(); assert s.index('fixes-title') < s.index('ladder-title'); print('frustrations precede ladder')
EOF`
Expected: `frustrations precede ladder`

```bash
git add ai-systems/index.html assets/site.css
git commit -m "copy(ai-systems): lead with the problem, frustrations first"
```

---

### Task 6: Pricing answers the visitor's question

**Files:**
- Modify: `pricing/index.html` line 174 (H1); move the rules section (lines 230-255) below the FAQ section (lines 257-279)

- [ ] **Step 1: Replace the H1**

Old:
```html
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">Diagnose. Build. Run.</h1>
```
New:
```html
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">What it costs to start, and what comes after.</h1>
```

- [ ] **Step 2: Move the rules below the FAQ**

Cut the whole `<section class="section on-white" aria-labelledby="rules-title"> ... </section>` and paste it immediately after the closing `</section>` of the `price-faq-title` section. Change the rules section class from `on-white` to `on-white` (unchanged) and the FAQ section stays `on-cloud`; alternation is preserved because the order becomes tiers (cloud), FAQ (cloud) then rules (white). Change the FAQ section's class from `on-cloud` to `on-white` and the rules section's from `on-white` to `on-cloud` so grounds still alternate.

- [ ] **Step 3: Verify and commit**

Run: `python - <<'EOF'
s=open('pricing/index.html',encoding='utf-8').read(); assert s.index('price-faq-title') < s.index('rules-title'); print('faq precedes rules')
EOF`
Expected: `faq precedes rules`

```bash
git add pricing/index.html
git commit -m "copy(pricing): H1 is the visitor's question, rules move below the numbers"
```

---

### Task 7: Case studies becomes the proof hub

**Files:**
- Modify: `case-studies/index.html` (replace everything between `<main id="main-content" tabindex="-1">` and the `<section class="cta-band"` line)

- [ ] **Step 1: Replace the main content**

```html
    <section class="page-hero" aria-labelledby="page-title">
      <div class="shell page-hero-grid">
        <div class="page-hero-copy">
          <ol class="crumbs" aria-label="Breadcrumb"><li><a href="/">Home</a></li><li><span aria-current="page">Case studies</span></li></ol>
          <p class="eyebrow" data-reveal>Proof, with the caveats attached</p>
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">Numbers you can check, and the arithmetic behind them.</h1>
          <p class="lede" data-reveal data-reveal-delay="2">Every case study shows its own working and names what was not tracked. If a figure is not in the ad account or the client's own records, it is not on this page. That rule is the reason there are two studies here instead of ten.</p>
        </div>
        <aside class="page-hero-aside" data-reveal data-reveal-delay="3">
          <strong>8.1x</strong>
          value to spend, conservative cash-only floor, one property management account in the audited month. <a href="/cs-dre.html" class="text-link" style="min-height:32px;margin-top:0.4rem">How it was counted</a>
        </aside>
      </div>
    </section>

    <section class="section on-cloud" aria-labelledby="cs-list-title">
      <div class="shell rail-wrap">
        <div class="section-intro">
          <p class="eyebrow">The work</p>
          <h2 class="display display-lg" id="cs-list-title">Two published. One in the audit queue.</h2>
        </div>
        <ul class="cards cards-3">
          <li>
            <a class="card" href="/cs-dre.html">
              <p class="card-tag">Property management · Meta · AI systems</p>
              <h3>They had never run a paid ad. Now the whole portfolio markets itself.</h3>
              <p class="card-figure">$43.44<small>per signed lease. 22 leases on $955.72 of spend in the audited month, an 8.1x conservative cash-only floor.</small></p>
              <p>A listing hit AppFolio and waited. This was a workflow problem before it was a campaign problem, so the fix was tooling that creates each ad paused and review-ready, then the ads themselves.</p>
              <span class="text-link">Read the case study</span>
            </a>
          </li>
          <li>
            <a class="card" href="/cs-nonprofit.html">
              <p class="card-tag">Nonprofit · Meta</p>
              <h3>Six community programs. One budget. Every donor relationship intact.</h3>
              <p class="card-figure">2 tracks<small>paid and awareness, so no program cannibalised another's donors</small></p>
              <p>When you run ten programs you cannot run ten campaigns the same way. Each program got its own lane inside one structure, with donation tracking rebuilt so every dollar was attributable.</p>
              <span class="text-link">Read the case study</span>
            </a>
          </li>
          <li>
            <div class="card is-pending" aria-label="Third case study, in progress">
              <p class="card-tag">Wholesale retail · Meta</p>
              <h3>The next one is being audited now.</h3>
              <p class="card-figure">Coming<small>published when the month reconciles to the client's own sales data, not before</small></p>
              <p>A rebuilt account whose purchase tracking had silently stopped for eleven days. The fix, and the numbers, go up once they are checked against the register.</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section class="section on-white" aria-labelledby="cs-three-title">
      <div class="shell">
        <div class="section-intro">
          <p class="eyebrow">How every study is written</p>
          <h2 class="display display-lg" id="cs-three-title">Three questions, answered in the same order every time.</h2>
          <p class="lede">So you can compare them, and so you can tell when a number is doing more work than it should.</p>
        </div>
        <ul class="features">
          <li class="feature">
            <span class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2"/></svg></span>
            <div>
              <h3>What was the situation?</h3>
              <p>What the client was doing before, what they were spending, and what they could and could not see. Usually the answer is a boosted post and a pixel firing on the wrong page.</p>
            </div>
          </li>
          <li class="feature">
            <span class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12h16M12 4v16"/></svg></span>
            <div>
              <h3>What was done first?</h3>
              <p>Always the measurement. Every study names which events were rebuilt and what they were reconciled against before any budget moved.</p>
            </div>
          </li>
          <li class="feature">
            <span class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16M6 15V9M12 15V5M18 15v-3"/></svg></span>
            <div>
              <h3>What was counted, and how?</h3>
              <p>The result, the source it came from, and what it is not. If leases were not tracked as conversions, the page says so and shows the influenced-value math instead.</p>
            </div>
          </li>
          <li class="feature">
            <span class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2l.9-5.5-4-3.9 5.5-.8z"/></svg></span>
            <div>
              <h3>What was not tracked?</h3>
              <p>Named on every page. A number you can divide is worth more than a number you have to trust, and the honest gaps are what make the rest believable.</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section class="section on-cloud" aria-labelledby="cs-how-title">
      <div class="shell">
        <div class="section-intro">
          <p class="eyebrow">Reading the headline number</p>
          <h2 class="display display-lg" id="cs-how-title">What "conservative floor" means, and why the page says it.</h2>
          <p class="lede">The property management ads promoted listings that later leased, but signed leases were not tracked as direct Meta conversions. So the return shown is influenced value compared with spend, counted as one month's commission plus the application fee, with most rents individually confirmed. Not proven last-click return on ad spend. It is the lowest number the evidence supports, which is why it is the one on the page.</p>
        </div>
        <div class="btn-row">
          <a class="btn" href="/cs-dre.html">See the full arithmetic</a>
          <a class="btn btn-ghost" href="/learn/boost-vs-ads/">Why a boosted post cannot produce this number</a>
        </div>
      </div>
    </section>

    <section class="section on-white voices-section" aria-labelledby="voices-title" hidden data-testimonials data-max="3">
      <div class="shell">
        <div class="section-intro">
          <p class="eyebrow">In their words</p>
          <h2 class="display display-lg" id="voices-title">What clients say when I am not in the room.</h2>
        </div>
      </div>
    </section>
```

Note the `data-testimonials` mount is on the section; `site.js` appends the `<ul class="voices">` inside it. Because the `.shell` wrapper is the section's only child, adjust the renderer mount target: in the JS from Task 3, the `ul` is appended to `mount`, which is the section. Wrap it: change `mount.appendChild(ul)` to `(mount.querySelector(".shell") || mount).appendChild(ul)`.

- [ ] **Step 2: Apply that one-line change to `assets/site.js`**

Old: `        mount.appendChild(ul);`
New: `        (mount.querySelector(".shell") || mount).appendChild(ul);`

- [ ] **Step 3: Verify and commit**

Run: `python - <<'EOF'
import re; s=open('case-studies/index.html',encoding='utf-8').read()
body=re.sub(r'<[^>]+>',' ',re.search(r'<main.*?</main>',s,re.S).group(0)); print(len(body.split()),'words')
EOF`
Expected: a number above 650 (was 371).

```bash
git add case-studies/index.html assets/site.js
git commit -m "copy(case-studies): the proof hub, with a testimonial slot that stays empty until a quote is real"
```

---

### Task 8: The comparison gets its own URL

**Files:**
- Create: `learn/boost-vs-ads/index.html`
- Modify: `sitemap.xml`, `learn/index.html` (first FAQ gains a link)

- [ ] **Step 1: Create the page**

Copy `learn/index.html` as the shell (head, header, footer) and replace `<title>`, description, canonical, og:url, breadcrumb, and `<main>`:

Head values:
```html
  <title>Boosting a Post vs Running Ads vs a Campaign | Just Blake Media</title>
  <meta name="description" content="Three things people mean when they say we tried ads. What you control, who sees it, what happens after the click, and what the budget does, side by side. Only one of the three tells you what you got for the money.">
  <link rel="canonical" href="https://justblakemedia.com/learn/boost-vs-ads/">
```
Update `og:title`, `og:description`, `og:url`, `twitter:title`, `twitter:description` to match.

Replace the JSON-LD with:
```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://justblakemedia.com/" },
          { "@type": "ListItem", "position": 2, "name": "Learn", "item": "https://justblakemedia.com/learn/" },
          { "@type": "ListItem", "position": 3, "name": "Boosting vs ads vs a campaign", "item": "https://justblakemedia.com/learn/boost-vs-ads/" }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the difference between boosting a post and running Facebook ads?",
            "acceptedAnswer": { "@type": "Answer", "text": "Boosting pays to show one post to more people, roughly your followers and people like them, with almost no control over who sees it or what happens after they do. Running an ad in Ads Manager lets you choose the objective, build the audience, and track what people did on your site. A campaign adds structure on top: several ads tested against each other, budgets that follow results, and reporting reconciled to your own sales data." }
          },
          {
            "@type": "Question",
            "name": "Why did my boosted post not bring any customers?",
            "acceptedAnswer": { "@type": "Answer", "text": "A boost optimises for reach or engagement, not for customers. It shows one post to people who already like you or resemble them, and Meta reports the click, not what the person did afterwards. Without a pixel and Conversions API set up to the right events, there is no way to know whether anyone bought, called or signed up." }
          },
          {
            "@type": "Question",
            "name": "How much does it cost to run a real campaign instead of boosting?",
            "acceptedAnswer": { "@type": "Answer", "text": "The ad spend is yours to set and is never marked up. Management at Just Blake Media starts with a $3,500 Foundations Sprint over 30 days, which audits and rebuilds the tracking and restructures the account. Under $5,000 a month in ad spend, Amplify is the better fit." }
          }
        ]
      }
    ]
  }
  </script>
```

Main:
```html
  <main id="main-content" tabindex="-1">
    <section class="page-hero" aria-labelledby="page-title">
      <div class="shell page-hero-grid">
        <div class="page-hero-copy">
          <ol class="crumbs" aria-label="Breadcrumb"><li><a href="/">Home</a></li><li><a href="/learn/">Learn</a></li><li><span aria-current="page">Boosting vs ads vs a campaign</span></li></ol>
          <p class="eyebrow" data-reveal>Plain answer</p>
          <h1 class="display display-xl" id="page-title" data-reveal data-reveal-delay="1">Boosting a post is not running ads. Here is the difference.</h1>
          <p class="lede" data-reveal data-reveal-delay="2">Three things people mean when they say "we tried ads." Only one of them tells you what you got for the money. This page is the table I draw on the first call, so you can read it before we talk, or send it to whoever holds the budget.</p>
        </div>
      </div>
    </section>

    <section class="section on-cloud" aria-labelledby="compare-title">
      <div class="shell compare">
        <h2 class="visually-hidden" id="compare-title">The comparison</h2>
        <div class="compare-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th scope="col">What you control</th>
                <th scope="col">Boost a post<small>the blue button under a post</small></th>
                <th scope="col">Run an ad<small>Ads Manager, one campaign</small></th>
                <th scope="col" class="col-me">Run a campaign<small>what I do</small></th>
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">The goal</th><td>Reach. More people see the post.</td><td>You pick: leads, sales, calls, sign-ups.</td><td class="col-me is-yes">One business outcome, with a cost you agreed to per result.</td></tr>
              <tr><th scope="row">Who sees it</th><td>Roughly your followers and people like them.</td><td>Audiences you build: location, interests, your own customer list.</td><td class="col-me is-yes">Audiences tested against each other, losers switched off, winners funded.</td></tr>
              <tr><th scope="row">After the click</th><td>Unknown. Meta reports the click, not the customer.</td><td>Tracked, if the pixel and Conversions API are set up right. Usually they are not.</td><td class="col-me is-yes">Tracked and reconciled to your own sales data before anyone trusts the number.</td></tr>
              <tr><th scope="row">Creative</th><td>The one post.</td><td>Several ads, one at a time.</td><td class="col-me is-yes">Several ads running against each other, so the data picks, not the opinion.</td></tr>
              <tr><th scope="row">Budget</th><td>A flat amount, spent.</td><td>A daily or lifetime amount.</td><td class="col-me is-yes">Budgets that follow results, with a pacing alert before an overspend happens.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section on-white" aria-labelledby="bva-faq-title">
      <div class="shell learn-grid">
        <div>
          <div class="section-intro">
            <p class="eyebrow">Asked most weeks</p>
            <h2 class="display display-lg" id="bva-faq-title">The three questions that follow.</h2>
          </div>
          <div class="faq">
            <details open><summary>What is the difference between boosting a post and running Facebook ads?</summary><div class="answer"><p>Boosting pays to show one post to more people, roughly your followers and people like them, with almost no control over who sees it or what happens after they do. Running an ad in Ads Manager lets you choose the objective, build the audience, and track what people did on your site. A campaign adds structure on top: several ads tested against each other, budgets that follow results, and reporting reconciled to your own sales data.</p></div></details>
            <details><summary>Why did my boosted post not bring any customers?</summary><div class="answer"><p>A boost optimises for reach or engagement, not for customers. It shows one post to people who already like you or resemble them, and Meta reports the click, not what the person did afterwards. Without a pixel and Conversions API set up to the right events, there is no way to know whether anyone bought, called or signed up.</p></div></details>
            <details><summary>How much does it cost to run a real campaign instead of boosting?</summary><div class="answer"><p>The ad spend is yours to set and is never marked up. Management starts with a <a href="/pricing/">$3,500 Foundations Sprint</a> over 30 days, which audits and rebuilds the tracking and restructures the account. Under $5,000 a month in ad spend, <a href="/amplify/">Amplify</a> is the better fit.</p></div></details>
          </div>
        </div>
        <aside class="aside-card">
          <p class="eyebrow">Where this comes from</p>
          <h2>One account I run.</h2>
          <p>A property management portfolio on Meta, from no paid ads to 22 signed leases on $955.72 of spend in the audited month. The column marked "what I do" is what that account runs on.</p>
          <a class="text-link" href="/cs-dre.html">Read the case study</a>
        </aside>
      </div>
    </section>

    <section class="cta-band" aria-labelledby="cta-band-title">
      <div class="shell">
        <h2 class="display" id="cta-band-title">Which column are you in right now?</h2>
        <p>Send me the account and I will tell you, free, with the three things I would change first. Or book twenty minutes and we look at it together.</p>
        <div class="btn-row">
          <a class="btn" href="/contact/#audit">Send me the account</a>
          <a class="btn btn-ghost" href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc=">Book a 20-minute call</a>
        </div>
      </div>
    </section>
  </main>
```

- [ ] **Step 2: Add the URL to the sitemap after the `/learn/` entry**

```xml
  <url>
    <loc>https://justblakemedia.com/learn/boost-vs-ads/</loc>
    <lastmod>2026-09-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
```

- [ ] **Step 3: Link it from the first FAQ on `/learn/`**

In `learn/index.html`, inside the first `<details open>` answer, append after the existing sentence: ` <a href="/learn/boost-vs-ads/">The full comparison, side by side.</a>`

- [ ] **Step 4: Verify and commit**

Run: `python scripts/check-site.py 2>&1 | grep -c "boost-vs-ads"`
Expected: `0` (no failures mentioning the new page)

```bash
git add learn/boost-vs-ads/index.html sitemap.xml learn/index.html
git commit -m "feat(learn): the boost-versus-ads comparison gets its own URL and FAQ schema"
```

---

### Task 9: About gets a photo slot, contact asks the real question

**Files:**
- Modify: `about/index.html` line 232
- Modify: `contact/index.html` lines 226-239 and the three description meta tags

- [ ] **Step 1: Photo slot on About**

Old:
```html
          <div class="portrait-frame" aria-hidden="true">Justin Blake<br>Marietta, Georgia</div>
```
New:
```html
          <div class="portrait-frame" aria-hidden="true">Justin Blake<br>Marietta, Georgia<img src="/assets/justin-blake.jpg" alt="" onload="this.parentNode.classList.add('has-photo')" onerror="this.remove()"></div>
```
When `assets/justin-blake.jpg` exists the frame shows the photo; until then the initials frame is unchanged and no broken-image icon appears.

- [ ] **Step 2: Contact form asks the open question first and makes spend optional**

Old (spend field):
```html
            <label for="audit-spend">Monthly ad spend</label>
            <select id="audit-spend" name="monthly_spend" required>
```
New:
```html
            <label for="audit-spend">Monthly ad spend <span class="optional">Optional</span></label>
            <select id="audit-spend" name="monthly_spend">
```

Old (detail field):
```html
            <label for="audit-detail">What is not working <span class="optional">Optional</span></label>
            <textarea id="audit-detail" name="detail" rows="4" placeholder="Leads dried up in July and I cannot tell whether it is the creative or the tracking."></textarea>
```
New:
```html
            <label for="audit-detail">What are you trying to fix?</label>
            <textarea id="audit-detail" name="fix" rows="4" required placeholder="Leads dried up in July and I cannot tell whether it is the creative or the tracking."></textarea>
            <p class="field-error" id="audit-detail-error">One line is enough. It is the first thing I read.</p>
```

Then move the whole `field` div containing `audit-detail` to sit before the `field-select` div containing `audit-spend`, so the question comes before the qualifier.

- [ ] **Step 3: Fix the contact metadata (three tags)**

Replace every `Book a free 20-minute call, or send the account over for a free look at structure, tracking and creative. Email, phone and LinkedIn for Justin Blake.` with `Tell me what you are trying to fix, or book twenty minutes. Either way it comes back from Justin Blake, not an assistant. Email, phone and LinkedIn.`

- [ ] **Step 4: Verify and commit**

Run: `grep -c 'name="fix"' contact/index.html && grep -c "has-photo" about/index.html`
Expected: `1` then `1`

```bash
git add about/index.html contact/index.html
git commit -m "copy(about,contact): a real photo slot, and the form asks what you are trying to fix"
```

---

### Task 10: Titles and descriptions lead with the problem

**Files:**
- Modify: `<title>`, `name="description"`, `og:title`, `og:description`, `twitter:title`, `twitter:description` in `index.html`, `paid-media/index.html`, `ai-systems/index.html`, `case-studies/index.html`, `learn/index.html`, `pricing/index.html`

- [ ] **Step 1: Apply this table with a script**

```python
import io, re
meta = {
 "index.html": ("Just Blake Media | Paid Media and AI Systems, Marietta GA",
   "You are spending on ads and cannot say what they earned, and the marketing still runs through you. Justin Blake fixes the measurement, runs Meta and LinkedIn inside your account, and builds the systems that take the repeat work off your desk."),
 "paid-media/index.html": ("Facebook, Instagram and LinkedIn Ads Management | Just Blake Media",
   "Spending on Meta or LinkedIn and cannot tell what is working? The tracking gets rebuilt first, then the campaigns are run by one senior buyer inside your account. Starts with a $3,500 Foundations Sprint."),
 "ai-systems/index.html": ("AI Systems for Marketing Teams | Just Blake Media",
   "Your team keeps redoing work a system should already handle. AI consulting, custom builds and system care, built by someone who has run the campaigns. Starts with a $1,500 AI Clarity Session."),
 "case-studies/index.html": ("Case Studies With the Arithmetic Shown | Just Blake Media",
   "Paid media and AI systems results with the working shown: a 42-listing rental portfolio at $43.44 per lease and an 8.1x conservative floor, and a six-program nonprofit with no donor overlap."),
 "learn/index.html": ("Boosting vs Ads, What It Costs, Where to Start With AI | Just Blake Media",
   "Plain answers to the questions from most first calls: boosting versus ads, which platforms, what it costs to start, where to begin with AI, and who Just Blake Media is wrong for."),
 "pricing/index.html": ("Pricing | Just Blake Media",
   "What it costs to start: a $3,500 Foundations Sprint for paid media or a $1,500 AI Clarity Session. Builds are fixed price, management is monthly, and there is never a percentage of ad spend."),
}
for f, (title, desc) in meta.items():
    s = io.open(f, encoding="utf-8").read()
    s = re.sub(r"<title>[^<]*</title>", f"<title>{title}</title>", s, count=1)
    s = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1)+desc+m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1)+title+m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1)+desc+m.group(2), s, count=1)
    s = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")', lambda m: m.group(1)+title+m.group(2), s, count=1)
    s = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', lambda m: m.group(1)+desc+m.group(2), s, count=1)
    io.open(f, "w", encoding="utf-8", newline="\n").write(s)
    print("meta updated", f)
```

- [ ] **Step 2: Update the one-sentence description on `/ai-instructions/`**

Old:
```html
"Just Blake Media is a Marietta, Georgia consultancy run by Justin Blake that manages Meta and LinkedIn advertising with the tracking fixed first, and builds the AI systems that take the busywork off marketing teams."
```
New:
```html
"Just Blake Media is a Marietta, Georgia consultancy run by Justin Blake for businesses that spend on ads and cannot tell what they earned. He fixes the measurement, runs Meta and LinkedIn advertising inside the client's own account, and builds the AI systems that take the repeat work off marketing teams."
```
Also change `last reviewed on September 4, 2026` to `last reviewed on September 8, 2026`.

- [ ] **Step 3: Verify and commit**

Run: `python scripts/check-site.py 2>&1 | grep -i "duplicate <title>" | wc -l`
Expected: `0`

```bash
git add -A -- '*.html'
git commit -m "seo: every title and description leads with the visitor's problem"
```

---

### Task 11: The homepage, one door

**Files:**
- Modify: `index.html` (everything between `<main id="main-content" tabindex="-1">` and `</main>`)
- Modify: all 11 pages (remove the top-level Amplify nav link; the Services menu entry stays)

- [ ] **Step 1: Remove the top-level Amplify nav link on every page**

```python
import io, glob
old = '<li><a class="nav-link" href="/amplify/">Amplify</a></li>'
old_cur = '<li><a class="nav-link" href="/amplify/" aria-current="page">Amplify</a></li>'
for f in glob.glob("**/*.html", recursive=True):
    s = io.open(f, encoding="utf-8").read()
    n = s.replace(old, "").replace(old_cur, "")
    if n != s:
        io.open(f, "w", encoding="utf-8", newline="\n").write(n); print("nav trimmed", f)
```
On `amplify/index.html`, keep `<li class="has-menu is-current">` so the Services button still shows the current state.

- [ ] **Step 2: Replace the homepage `<main>`**

```html
  <main id="main-content" tabindex="-1">

    <!-- 1. Hero: the outcome, the problem in the visitor's words, the proof. -->
    <section class="hero hero-lead" aria-labelledby="hero-title">
      <svg class="hero-arc" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 160 C 360 20, 1080 20, 1440 160 Z" fill="#1c2e48"/>
        <path d="M0 160 C 360 60, 1080 60, 1440 160 Z" fill="#ffffff"/>
      </svg>
      <div class="shell hero-inner" style="max-width:none;justify-items:start;text-align:left">
        <div class="hero-copy">
          <span class="badge"><i></i>Paid media <b>+</b> AI systems <b>·</b> Marietta, GA</span>
          <h1 id="hero-title">Marketing that keeps running <span class="accent">when you stop pushing it.</span></h1>
          <p class="lede">Right now it all runs through you, and you still cannot say what it earned. I fix the measurement first, run the campaigns myself, and hand the work that repeats to systems that wait for your approval.</p>
          <div class="btn-row">
            <a class="btn" href="#lead">Show me what to fix <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>
            <a class="btn btn-ghost" href="#work">See the work</a>
          </div>
          <dl class="hero-proof">
            <div><dd><b><span class="num" data-count="43.44" data-prefix="$" data-decimals="2">$43.44</span></b></dd><dt><span>per signed lease</span></dt></div>
            <div><dd><b><span class="num" data-count="8.1" data-suffix="x" data-decimals="1">8.1x</span></b></dd><dt><span>value to spend</span></dt></div>
            <div><dd><b><span class="num" data-count="42" data-decimals="0">42</span></b></dd><dt><span>listings promoted</span></dt></div>
            <div><dd><b><span class="num" data-count="22" data-decimals="0">22</span></b></dd><dt><span>leases, audited month</span></dt></div>
            <p class="hero-proof-source">One property management account on Meta, checked against the lease log. <a href="/cs-dre.html">The arithmetic.</a></p>
          </dl>
        </div>
      </div>
    </section>

    <!-- 2. Five things heard on every first call. The site's own buried lines, promoted. -->
    <section class="section on-white" id="heard" aria-labelledby="heard-title">
      <div class="shell">
        <div class="section-intro">
          <p class="eyebrow">Sound familiar?</p>
          <h2 class="display display-lg" id="heard-title">Five things I hear on almost <span class="accent">every first call</span></h2>
        </div>
        <ul class="heard">
          <li>
            <q>I am spending money, but I cannot tell what is actually working.</q>
            <p>The tracking gets audited and rebuilt before a dollar of budget moves. Then the number means something.</p>
            <a class="text-link" href="/paid-media/">How I run paid media</a>
          </li>
          <li>
            <q>My team keeps repeating work that should already be handled.</q>
            <p>It gets written down as a job description and handed to a system that drafts the work, then waits for you.</p>
            <a class="text-link" href="/ai-systems/">How I build the systems</a>
          </li>
          <li>
            <q>We tried AI. It sounds like everyone else.</q>
            <p>A voice document the system reads before it writes a word. Your bans, your openings, your numbers rule.</p>
            <a class="text-link" href="/ai-systems/#fixes-title">The fix</a>
          </li>
          <li>
            <q>It does not know my business.</q>
            <p>Your context lives somewhere the AI can reach: clients, rates, what happened on the last call. Kept once, read every time.</p>
            <a class="text-link" href="/ai-systems/#fixes-title">The fix</a>
          </li>
          <li>
            <q>I cannot trust it to run on its own.</q>
            <p>Anything that spends, sends or publishes is created paused and waits for a person. The system proposes. You confirm.</p>
            <a class="text-link" href="/about/#how-title">How I work</a>
          </li>
        </ul>
      </div>
    </section>

    <!-- 3. One door, and the layer that makes it better than an agency. -->
    <section class="section on-bg" id="buy" aria-labelledby="buy-title">
      <div class="shell">
        <div class="section-intro">
          <p class="eyebrow">What you are buying</p>
          <h2 class="display display-lg" id="buy-title">One person in your account, and the systems around it</h2>
        </div>
        <div class="buy">
          <div class="buy-main">
            <p class="eyebrow">The door</p>
            <h3>Paid media, run by me</h3>
            <p>Meta and LinkedIn campaigns built and run inside your own ad account. Tracking rebuilt first. Reporting you can forward to a board without explaining it. Monthly, banded to your spend, never a percentage of it.</p>
            <ul>
              <li>Pixel, Conversions API and GA4 rebuilt before any budget moves</li>
              <li>Several ads tested against each other, so the data picks</li>
              <li>Every listing or launch ad created paused and reviewed before it spends</li>
              <li>Numbers reconciled to your own sales data before anyone trusts them</li>
            </ul>
            <div class="btn-row"><a class="btn" href="/paid-media/">How it works <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a></div>
          </div>
          <div class="buy-layer">
            <p class="eyebrow">Why it beats an agency</p>
            <h3>The AI layer nobody else builds</h3>
            <p>The repeat work around the campaigns gets automated by the person running them. An agency pod cannot do this. A developer who has never run a campaign builds the wrong thing.</p>
            <ul>
              <li>Each new listing becomes a review-ready ad instead of a blank screen</li>
              <li>The weekly report writes itself from the platform data and waits in drafts</li>
              <li>Follow-ups drafted, never sent without you</li>
            </ul>
            <p class="routing">Only need the systems, not the ads? <a href="/ai-systems/">Start here instead.</a> Spending under $5,000 a month? <a href="/amplify/">Amplify is built for that.</a></p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Platforms strip. -->
    <div class="marquee" aria-label="Platforms and tools">
      <div class="marquee-track">
        <ul>
          <li><b>Meta</b> Facebook and Instagram</li>
          <li><b>LinkedIn</b> demand generation</li>
          <li><b>Google and Bing</b> search</li>
          <li><b>Snapchat</b> and <b>Pinterest</b></li>
          <li><b>GA4 + Google Tag Manager</b> measurement</li>
          <li><b>Meta Conversions API</b> server-side tracking</li>
          <li><b>Claude</b> AI systems and automation</li>
        </ul>
      </div>
    </div>

    <!-- 5. Featured work. -->
    <section class="section-lg on-dark" id="work" aria-labelledby="work-title">
      <div class="shell">
        <div class="section-intro is-centered">
          <p class="eyebrow">Featured work</p>
          <h2 class="display display-xl" id="work-title">What it looks like when it works</h2>
        </div>
        <div class="carousel" aria-roledescription="carousel" aria-label="Case studies">
          <div class="carousel-viewport is-wide">
            <div class="carousel-track">
              <div class="carousel-item">
                <a class="tile" href="/cs-dre.html">
                  <img src="/assets/human-systems/amplify-owner.webp" width="960" height="1120" alt="" loading="lazy" decoding="async">
                  <div class="tile-body">
                    <span class="tile-tag">Property management · Meta + AI systems</span>
                    <h3>42 listings promoted, 22 leases signed in the audited month</h3>
                    <p>They had never run a paid ad. Now every new listing becomes a review-ready ad, and the leases are checked against the lease log, not a screenshot.</p>
                  </div>
                  <span class="tile-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </a>
              </div>
              <div class="carousel-item">
                <a class="tile" href="/cs-nonprofit.html">
                  <img src="/assets/human-systems/ai-team.webp" width="960" height="1120" alt="" loading="lazy" decoding="async">
                  <div class="tile-body">
                    <span class="tile-tag">Nonprofit · Meta</span>
                    <h3>Six programs, one budget, every donor relationship intact</h3>
                    <p>Two tracks, paid and awareness, so no program cannibalised another's donors. Donation tracking rebuilt first.</p>
                  </div>
                  <span class="tile-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span>
                </a>
              </div>
              <div class="carousel-item">
                <div class="tile is-pending">
                  <div class="tile-body">
                    <span class="tile-tag">Wholesale retail · Meta</span>
                    <h3>The next one is being audited now</h3>
                    <p>Published when the month reconciles to the client's own sales data, not before.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="carousel-controls">
            <button class="carousel-btn" type="button" data-prev aria-label="Previous case study"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4"/></svg></button>
            <button class="carousel-btn" type="button" data-next aria-label="Next case study"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
          </div>
          <p class="visually-hidden carousel-status" aria-live="polite"></p>
          <div class="carousel-more"><a class="btn" href="/case-studies/">All case studies, arithmetic included <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a></div>
        </div>
        <div class="voices-section" hidden data-testimonials data-max="3" style="margin-top:48px">
          <div class="section-intro is-centered"><p class="eyebrow">In their words</p></div>
        </div>
      </div>
    </section>

    <!-- 6. The lead form, after the proof, asking one question. -->
    <section class="section on-navy lead-section" id="lead" aria-labelledby="lead-title">
      <div class="shell form-grid">
        <div class="form-copy">
          <p class="eyebrow">Start here</p>
          <h2 class="display display-lg" id="lead-title">What are you trying to fix?</h2>
          <p class="lede">One line is enough. It lands in my inbox, not a queue, and I write back within one business day with the first thing I would look at. If I am the wrong fit, I say so and give you a name who is right.</p>
        </div>
        <form class="audit-form" id="lead-form" data-lead="home" data-endpoint="https://api.web3forms.com/submit" novalidate>
          <!-- Submitted by fetch() in site.js, so a browser with JavaScript off
               cannot post these details anywhere. The submit button ships
               disabled and site.js enables it once the access key is real.
               Same key as the contact page form. -->
          <input type="hidden" name="access_key" value="REPLACE_WITH_FORM_ACCESS_KEY">
          <input type="hidden" name="subject" value="New lead from justblakemedia.com">
          <input type="hidden" name="from_name" value="justblakemedia.com">
          <div class="field">
            <label for="lead-fix">What are you trying to fix?</label>
            <textarea id="lead-fix" name="fix" rows="3" required placeholder="We boost posts and cannot tell if it does anything."></textarea>
            <p class="field-error" id="lead-fix-error">One line is enough. It is the first thing I read.</p>
          </div>
          <div class="field">
            <label for="lead-name">Your name</label>
            <input type="text" id="lead-name" name="name" autocomplete="name" required placeholder="Priya Ramaswamy">
            <p class="field-error" id="lead-name-error">Add your name so I know who I am writing back to.</p>
          </div>
          <div class="field">
            <label for="lead-email">Email</label>
            <input type="email" id="lead-email" name="email" autocomplete="email" required placeholder="priya@company.com">
            <p class="field-error" id="lead-email-error">That email address does not look right. Check it and try again.</p>
          </div>
          <div class="field field-select">
            <label for="lead-spend">Monthly ad spend <span class="optional">Optional</span></label>
            <select id="lead-spend" name="monthly_spend">
              <option value="">Skip this</option>
              <option>Not running paid media yet</option>
              <option>Under $5,000</option>
              <option>$5,000 to $15,000</option>
              <option>$15,000 to $50,000</option>
              <option>More than $50,000</option>
            </select>
          </div>
          <div class="field-trap" aria-hidden="true">
            <label for="lead-company-site">Do not fill this in</label>
            <input type="text" id="lead-company-site" name="botcheck" tabindex="-1" autocomplete="off">
          </div>
          <button type="submit" class="btn audit-submit" id="lead-submit" disabled>Send it to Justin <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
          <noscript><p class="audit-status is-error"><strong>This form needs JavaScript.</strong>Email <a href="mailto:justin@justblakemedia.com">justin@justblakemedia.com</a> and it will reach me just as fast.</p></noscript>
          <p class="audit-note">No list, no sequence. I use your details to reply and for nothing else. Prefer to talk? <a href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc=">Book a 20-minute call.</a></p>
          <p class="audit-status" id="lead-status" role="status" aria-live="polite" hidden></p>
        </form>
      </div>
    </section>

    <!-- 7. Learn teaser and the one dated thing on the site. -->
    <section class="section on-white" id="learn" aria-labelledby="learn-title">
      <div class="shell learn-teaser-grid">
        <div>
          <p class="eyebrow">Learn</p>
          <h2 class="display display-lg" id="learn-title">The questions every first call starts with</h2>
          <p class="lede">Answered in plain language so the call can start further along. Written to be quoted, by a person or by whatever answer engine sent you here.</p>
        </div>
        <ul class="qa-list">
          <li><a href="/learn/boost-vs-ads/">Boosting a post, running an ad, running a campaign: what is the difference?<small>The five-row comparison, on its own page you can send to whoever holds the budget.</small></a></li>
          <li><a href="/ai-systems/#ladder-title">Where are you on your AI journey?<small>Four rungs. Most teams stop on the first one without knowing it.</small></a></li>
          <li><a href="/learn/#story-title">How do paid media and AI systems fit together?<small>Buy attention, or buy back time. Same method either way, with the arithmetic.</small></a></li>
          <li><a href="/learn/">Which platforms, what it costs to start, who I am wrong for<small>The full list of questions, kept current.</small></a></li>
        </ul>
      </div>
      <div class="shell" style="margin-top:32px">
        <div class="date-strip">
          <p><strong>Oct 14</strong> &nbsp; I teach this too. Next public session: AI for marketing teams, Atlanta Jewish Marketing Network.</p>
          <a class="text-link" href="/workshops/">See the sessions</a>
        </div>
      </div>
    </section>

    <!-- 8. One line of credibility. -->
    <section class="section-sm on-navy" aria-labelledby="cred-title">
      <div class="shell cred">
        <h2 class="cred-name" id="cred-title">Justin Blake</h2>
        <p>Six years leading paid social at Cox Enterprises, senior media manager at 22squared before that. Now one person in your account, in Marietta, Georgia. I will say no on the first call if I am the wrong fit, and give you a name who is right.</p>
        <a class="text-link" href="/about/">About Justin</a>
      </div>
    </section>

    <!-- 9. The ask. -->
    <section class="cta-band" aria-labelledby="home-cta-title">
      <div class="shell">
        <h2 class="display" id="home-cta-title">Ready when you are</h2>
        <p>Tell me what you are trying to fix, or book twenty minutes. Either way you hear back from me, not an assistant, and the first thing you get is what I would change first.</p>
        <div class="btn-row">
          <a class="btn" href="#lead">Tell me what to fix</a>
          <a class="btn btn-ghost" href="https://calendar.google.com/calendar/u/0/appointments/AcZssZ2D7uMpt7JHjVTUxTeBbHBp8PmNRrPC43SjRNc=">Book a 20-minute call</a>
        </div>
      </div>
    </section>

  </main>
```

- [ ] **Step 3: The hero proof `dl` puts `dd` before `dt`; fix the CSS order rule**

The `.hero-proof` rules in Task 3 style `b` and `span`; the markup wraps them in `dd`/`dt`. Append to `assets/site.css`:
```css
.hero-proof > div { display: grid; }
.hero-proof dd { margin: 0; order: 1; }
.hero-proof dt { order: 2; }
```

- [ ] **Step 4: Verify with the harness**

Run: `python scripts/check-site.py`
Expected: `PASS: 16 pages, all checks green`

- [ ] **Step 5: Commit**

```bash
git add index.html assets/site.css -- '*.html'
git commit -m "feat(home): one door, the outcome in the headline, the problem in the subhead, proof before the ask"
```

---

### Task 12: Render, probe, push

**Files:** none new

- [ ] **Step 1: Serve and probe both widths**

Start `python -m http.server 8765` in the repo root. For each of `/`, `/paid-media/`, `/ai-systems/`, `/case-studies/`, `/pricing/`, `/learn/boost-vs-ads/`, `/contact/`, `/about/` at 1440 and 390: assert `document.documentElement.scrollWidth <= window.innerWidth`, zero console errors, `document.querySelectorAll('h1').length === 1`, and on `/` that `#lead-form textarea[name=fix][required]` exists and `select[name=need]` does not.

- [ ] **Step 2: Full-page screenshots with headless Chrome at 1440 and 390 of `/`**

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,5200 --virtual-time-budget=6000 --screenshot=home-desktop.png http://127.0.0.1:8765/
```

- [ ] **Step 3: Push the branch (PR #19 updates itself)**

```bash
git push origin brain-dump-homepage
```

---

### Task 13: The visualization

- [ ] Build a single-file preview of the new homepage (inline CSS, JS, data-URI images, internal links pointed at the live site or sibling previews) and publish it as an artifact. Republish the round-four homepage preview at its existing URL so Justin's link stays current.

- [ ] Write `work/active/JBM Website 40-of-40 2026-09-08.md` in the vault: what was built, what each score is now, the four gated points and exactly what each needs, and the decisions still open (workshop prices, Amplify boundary, TikTok, the 30-day freeze).

---

## Self-review

**Spec coverage.** Audit findings mapped: no testimonials (Task 3, 7, gated), invented CTA name (Task 1), form dropdown (Task 11, 9), seven identical closers (Task 2), caveats outweigh claims (Task 11 hero proof: four figures, one 14-word source line), proof from a small spender (Task 11 frames ratio first, spend last, and the one-door structure targets the retainer buyer), Amplify on the homepage (Task 11 removes the door and hero mention, keeps nav entry and page), pricing H1 (Task 6), buried problem lines (Task 11 section 2, Tasks 4 and 5 H1s), case studies thinnest (Task 7), boost-vs-ads own URL (Task 8), photo slot (Task 9), titles problem-first (Task 10), workshops date visible (Task 11 date strip). Not covered on purpose: workshop prices (standing rule allows only the two Diagnose prices to be published; Justin's decision), Vercel Analytics (GA4 via GTM is already on every page; the gate is Justin confirming data arrives).

**Placeholder scan.** No TBD, TODO, "similar to". Every code step is complete. The only placeholder string in the codebase is `REPLACE_WITH_FORM_ACCESS_KEY`, which is the existing, deliberate, documented gate.

**Type consistency.** `data-testimonials` mount and `.voices` list match between Task 3 JS, Task 7 markup, Task 11 markup. `name="fix"` matches between Task 0 check, Task 9 contact, Task 11 home. `hero-proof` markup uses `dd`/`dt` inside `div`, styled by Task 3 plus the Task 11 order fix. `fixes-title` anchor used by Task 11 exists on the ai-systems page (moved, id unchanged). `how-title` exists on the about page.

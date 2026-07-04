# Just Blake Media — Website

Static marketing site for Just Blake Media. Plain HTML/CSS, no build step.

## Files
- `index.html` — home page
- `cs-advocacy.html`, `cs-dre.html`, `cs-nonprofit.html` — case studies
- `404.html` — not-found page
- `CNAME` — custom domain (`justblakemedia.com`) for GitHub Pages
- `robots.txt` — search-engine directives

## How it's hosted
GitHub Pages serves this folder directly. Any commit to the default branch
redeploys the live site in about a minute.

## To go live (one-time setup)
1. Create a **public** repo named `justblakemedia-website`.
2. Upload every file in this folder to the repo root.
3. **Settings → Pages → Deploy from a branch → main / (root) → Save.**
4. DNS at your registrar for `justblakemedia.com`:
   - Four `A` records on `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One `CNAME` on `www` → `justblakemedia.github.io`
5. Back in Settings → Pages, tick **Enforce HTTPS** once the domain verifies.

## Still to replace (placeholders)
- Contact form action `formspree.io/f/YOUR_FORM_ID` — swap for a real Formspree ID.
- `pravatar.cc` avatar images — swap for real photos.

## Editing later
Edit a file → commit → Pages redeploys automatically. Every commit is a
restorable version.

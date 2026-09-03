# Just Blake Media Website

Static marketing site for Just Blake Media. Plain HTML/CSS, no build step.

## Files
- `index.html`: home page
- `cs-advocacy.html`, `cs-dre.html`, `cs-nonprofit.html`: case studies
- `404.html`: not-found page
- `robots.txt`, `sitemap.xml`: search-engine directives
- `assets/`: site images

## How it's hosted

Deployed on Vercel (project `justblakemedia-website`), connected to this repo's
`main` branch. Any commit to `main` triggers a production deployment.
`justblakemedia.com` and `www.justblakemedia.com` are attached as custom
domains in the Vercel project's Domains settings; DNS points there rather
than at GitHub Pages.

## Editing later

Edit a file, commit, push to `main`. Vercel builds and deploys automatically;
every deployment is a restorable version in the Vercel dashboard.

## Audit and redesign

Full content audit, phased rebuild plan, and design brief:
`work/active/JBM Website Audit and Redesign 2026-08-31.md` in the `the-brain`
vault.

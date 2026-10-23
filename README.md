# Just Blake Media Website

Static marketing site for Just Blake Media. Plain HTML/CSS, no build step.

## Files
- `index.html`: home page
- `cs-advocacy.html`, `cs-dre.html`, `cs-nonprofit.html`: case studies
- `404.html`: not-found page
- `robots.txt`, `sitemap.xml`: search-engine directives
- `vercel.json`: security headers sent with every response
- `assets/`: site images
- `docs/`: internal notes, excluded from the deployment via `.vercelignore`

## How it's hosted

Deployed on Vercel (project `justblakemedia-website`), connected to this repo's
`main` branch. Any commit to `main` triggers a production deployment.
`justblakemedia.com` and `www.justblakemedia.com` are attached as custom
domains in the Vercel project's Domains settings; DNS points there rather
than at GitHub Pages.

## Security headers

`vercel.json` sends five headers on every response. The
Content-Security-Policy blocks plugins, `<base>` tag injection, form posts to
other sites, and framing by other sites. It deliberately does not restrict
scripts: Google Tag Manager loads whatever tags are chosen in its own
interface, and every page has inline scripts, so a script allowlist would
silently break tracking. Add one only from an inventory of the GTM container,
in Report-Only mode first.

Vercel already sends `Strict-Transport-Security`. Do not override it with
`includeSubDomains` until every subdomain is confirmed to serve HTTPS. Leave
out `Cross-Origin-Opener-Policy`, which can stop GTM's Tag Assistant preview
from connecting.

## Editing later

Edit a file, commit, push to `main`. Vercel builds and deploys automatically;
every deployment is a restorable version in the Vercel dashboard.

## Audit and redesign

Full content audit, phased rebuild plan, and design brief:
`work/active/JBM Website Audit and Redesign 2026-08-31.md` in the `the-brain`
vault.

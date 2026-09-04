---
date: 2026-09-04
description: Architecture record for justblakemedia.com and the Amplify product, covering the domain map, the two-project deployment model, the public and authenticated boundary, and the manual steps required to attach an Amplify subdomain.
tags: [architecture, amplify, vercel, deployment, seo]
---

# Amplify Architecture and Rollout

> **This repository is public.** Anything committed here is world readable on
> GitHub whether or not it is excluded from the Vercel deployment. Keep
> credentials, environment values, internal pricing, partner economics,
> client names, infrastructure identifiers, and security posture detail out of
> this file and out of this repository. Section 14 says where that material
> belongs instead.

## 1. Scope

Just Blake Media runs two customer facing web properties and they are not the
same kind of thing.

- **The consultancy site**, this repository, is a static marketing site. Its
  job is authority, proof and conversion into a conversation.
- **Amplify**, a separate repository and a separate Vercel project, is a
  working product. It is a Next.js application with a database, an
  authenticated area, and a live Meta Marketing API integration.

This document records how those two fit together, what stays separate and why,
and what has to be done by hand if Amplify is given a subdomain of
justblakemedia.com. It is an architecture record, not a plan of record. Product
sequencing lives in the private planning notes named in section 14.

## 2. Current state

### This repository

Five hand written HTML files with inline CSS. No framework, no bundler, no
package manager, no build step, no server code, no database, and no secrets.

```
/                     index.html          home page, single page with anchors
/cs-dre.html                              case study
/cs-nonprofit.html                        case study
/cs-advocacy.html                         case study, noindex, direct URL only
/404.html                                 not found page
/robots.txt  /sitemap.xml                 search directives
/assets/                                  images
```

Measurement is Google Tag Manager plus Vercel Analytics, loaded after the
window load event so it does not compete with the hero image for bandwidth on
the critical path.

### Amplify

A Next.js App Router application in its own private repository, deployed as its
own Vercel project, currently reachable at its Vercel generated hostname. It
has three distinct surfaces:

| Surface | Routes | Indexed |
|---|---|---|
| Product marketing | `/`, `/how-it-works`, `/pricing`, `/privacy`, `/terms` | Yes |
| Sign in | `/login` | Yes |
| Guided setup and dashboard | `/wizard/*`, `/dashboard/*` | No |

Continuous integration runs lint, type check, the test suite and a production
build on every push. This repository has no equivalent, because it has nothing
to build.

## 3. Target state

The shape does not change. Two properties, two repositories, two Vercel
projects. What changes is the seam between them.

```
justblakemedia.com              the consultancy
  /                             home page
  /cs-*.html                    case studies
  future service and resource pages
  one outbound link to Amplify, from a single shared URL constant

<amplify hostname>              the product
  public product marketing, sign in, and the authenticated application
  one inbound link back to justblakemedia.com
```

The consultancy site markets the consultancy. Amplify markets Amplify. Neither
duplicates the other's pages. The two are joined by links, not by shared code.

## 4. Domain map

| Hostname | Serves | Vercel project |
|---|---|---|
| `justblakemedia.com` | this repository | the website project |
| `www.justblakemedia.com` | this repository | the website project |
| Amplify's current hostname | the Amplify application | the Amplify project |
| A future `amplify.` subdomain | the Amplify application | the Amplify project |

**Use `amplify.` rather than `app.` if a subdomain is attached.** The Amplify
project serves public marketing pages as well as the authenticated
application, so `app.` would describe only part of what is there. The
subdomain choice is still open. See section 13.

## 5. Repository and project map

| Repository | Visibility | Vercel project | Deploys from |
|---|---|---|---|
| `justblakemedia-website` | public | website | `main`, no build step |
| `amplify` | private | Amplify | `main`, Next.js build |

The visibility difference is the reason this file is scoped the way it is.

## 6. Why the two stay separate

The split already exists. It should stay, for three reasons that are about
risk rather than tidiness.

1. **Release cadence.** This repository deploys on every commit to `main` with
   no build and no tests. Amplify runs a full check suite before it deploys.
   Merging them would force one of those two standards onto the other.
2. **Blast radius.** A failed Amplify deploy must never take down the case
   studies a prospect is reading. Separate projects give that guarantee for
   free.
3. **Secret surface.** This repository holds no credentials at all, which is
   why a public repository is safe. Amplify holds credentials for a database
   and a third party advertising API. Combining them would put that material
   into the deployment surface of a marketing site, for no gain.

What is genuinely missing is not a merge. It is the link between them, which
today does not exist in either direction.

## 7. The link out contract

When this site links to Amplify, the destination must come from one place, not
from a URL pasted into each page.

- Define the Amplify URL once, in a single shared location, and reference it
  from every call to action that points at the product.
- If no Amplify URL is configured, the call to action falls back to the site's
  existing booking link rather than rendering a dead link.
- Never hard code a hostname that has not been attached and verified. A link
  to a subdomain that does not resolve is worse than no link.

The same rule applies in reverse. Amplify's reference back to Just Blake Media
should be a single constant in that repository.

## 8. Public marketing and authenticated application boundary

This is the one boundary that is easy to get wrong and expensive to fix,
because search engines remember.

- Public marketing routes on both properties are indexable and belong in that
  property's sitemap.
- Authenticated routes must carry `noindex` on the route itself.
- **Do not add authenticated routes to `robots.txt` as `Disallow`.** A crawler
  that is blocked from fetching a URL never sees the `noindex` on it, so a
  blocked but linked page can still surface in results as a bare URL.
  `noindex` on the route is the control that works. A `Disallow` defeats it.
- Anything reachable only behind a sign in needs neither, because there is
  nothing for a crawler to retrieve.
- Every new public page on this site needs a unique title, a unique meta
  description, a canonical URL, Open Graph tags, a `sitemap.xml` entry and a
  line in `README.md`.

New pages in this repository follow the directory pattern, for example
`some-page/index.html` served at `/some-page`, rather than `some-page.html`.

## 9. Product boundaries

These are stated here because they constrain what any page on this site may
claim about Amplify.

- **The customer owns their Meta ad account.** Amplify connects to an account
  the customer already controls.
- **Meta bills media spend directly to the customer.** Amplify charges
  separately for software and for expert support. No fee is derived from a
  percentage of media spend.
- **Campaigns and ads are created paused.** Nothing spends until a person
  approves it. This is enforced in the Amplify codebase, not left to process.
- **Consequential actions are proposals, not automatic executions.** The
  intended shape is recommendation, then review, then explicit approval, then
  server side execution, then an audit record.

Do not publish pricing for Amplify on this site. Amplify's own pricing page is
the single source, and a second copy here would drift from it.

Do not claim results, customer counts, integrations, certifications or
testimonials that are not already verified in the private planning notes.

## 10. Data and secret handling requirements

This repository holds no secrets and must continue to hold none. Requirements
below govern the Amplify application and are recorded here only so the boundary
is legible.

- Credentials for the database, the advertising API and any billing provider
  are server side only. None may be exposed to a browser.
- Third party access tokens are encrypted before they are stored.
- Customer data is scoped to the organization that owns it. No query path may
  return another tenant's rows.
- Row level security is a backstop, not the authorization model. Application
  level checks remain mandatory even where row level security is enabled.
- Actions that affect a customer's advertising are auditable, with the
  approving person and the time recorded.

## 11. Attaching a subdomain, and the manual steps it needs

None of this is automated and none of it should be. Each step is a production
change that a person makes deliberately, in this order.

1. **Decide the hostname.** See section 13. Do not proceed on an assumption.
2. **Add the domain to the Amplify Vercel project**, not to the website
   project. Vercel then displays the exact DNS record to create. It gives the
   record type, the name and the value at that moment. Use those values.
   **Do not copy DNS values out of any document, including this one.** They are
   environment specific and they change.
3. **Create that record with the DNS provider that hosts justblakemedia.com.**
   Adding a subdomain does not affect the apex domain or `www`, so the
   consultancy site keeps serving throughout.
4. **Wait for Vercel to report the domain as verified,** and confirm the
   certificate is issued before sending anyone to it.
5. **Update the third party redirect and callback URLs** for authentication and
   for the advertising API integration so they include the new hostname. Do
   this before the next step, not after.
6. **Update the canonical site URL and the authentication URL** in the Amplify
   project's production environment, then redeploy so the change takes effect.
   Order matters. Changing the authentication URL before the provider knows the
   new callback breaks sign in.
7. **Only then** update the link constant in this repository, so the site never
   points at a hostname that is not live.

Steps 2 through 6 happen in the Vercel dashboard, the DNS provider and the
third party developer consoles. They are the owner's to make.

## 12. Release and rollback

### This repository

Any commit to `main` deploys to production. There is no staging and no build,
so a mistake is live in seconds.

1. Work on a branch. Open a pull request. Review the rendered diff.
2. Confirm the four Lighthouse categories still score 100 on mobile and
   desktop. That is the current state and it is not allowed to regress.
3. Check every internal link and every call to action destination resolves.
4. Merge to `main` and confirm the change on the live site.

**Rollback:** every deployment in the Vercel dashboard is restorable. Promote
the previous deployment to production for an immediate revert, then fix
forward in the repository. Do not rewrite history on `main`.

### Amplify

1. Push to a branch. Continuous integration runs lint, type check, tests and a
   production build. A red check is a stop, not a warning.
2. Review the Vercel preview deployment.
3. Merge to `main` to deploy to production.

**Rollback:** promote the previous production deployment. A database migration
does not roll back with it, so any migration must be written to be safe against
the previous release before it is applied.

## 13. Open decisions

These need an owner decision and must not be resolved by assumption.

1. **Does Amplify get a subdomain of justblakemedia.com, and which one?**
   Recommended, if yes: `amplify.`, for the reason in section 4.
2. **How prominent is Amplify on this site?** The current published treatment
   is a single routing line inside the paid media section. Changing that is a
   positioning decision, not an implementation one.
3. **Does Amplify's product marketing stay solely on the Amplify property?**
   Recommended: yes. A second marketing surface here would need to be
   maintained in parallel and would drift.

## 14. Criteria for splitting further

The two project split is settled. Two further splits are sometimes proposed and
neither is justified yet. Revisit each only when its trigger actually fires.

**A separate database for Amplify.** Trigger: a second application needs the
same tables, or a customer agreement requires isolation or data residency that
cannot be expressed in the schema. Until then a single database with tenant
scoping is simpler and safer than two.

**A third repository.** Trigger: additional developers with different access
needs, or a support surface that has to ship independently of the product.
Splitting a codebase that one person maintains adds coordination cost and
removes nothing.

## 15. What is deliberately not in this file

This repository is public. The following live in the private repositories
instead, and should not be copied here.

| Material | Where it belongs |
|---|---|
| Environment variable values, of any kind | The deployment platform's environment settings, never a repository |
| The Amplify database schema, policies and migrations | The `amplify` repository |
| Security posture detail and threat notes | The `amplify` repository |
| Pricing tiers, fee floors and partner economics | The `amplify` repository and the private planning notes |
| Infrastructure identifiers for projects and teams | The private planning notes |
| Client names, engagement state and pipeline | The private planning notes |
| Product sequencing, gates and decision history | The private planning notes |

## 16. Related

- `README.md` in this repository, for the file map and how this site is hosted.
- The `amplify` repository's own documentation, for the application's
  architecture, data model and operating rules.

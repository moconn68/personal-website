# Release 1.0.0 — initial-site

**Version:** 1.0.0
**Release date:** 2026-09-27
**Tag:** `v1.0.0`
**Project:** `initial-site` (personal identity hub for Matthew O'Connell)
**Status:** First public release. All 30 tickets (T-1 through T-30) complete.

## Summary

This is the first versioned, public release of the site: a static,
zero-client-JavaScript personal identity hub built on Astro 7 + TypeScript
(strict), deployed to Cloudflare Workers static assets. It ships two public
routes (Home, About), a typed Section Registry that future sections plug into
without touching nav/layout/sitemap code, structured data for search/AI
discovery, self-hosted fonts, and a noindex policy that protects the canonical
host from indexing pollution by preview/version URLs.

## What's new

### Core site (T-1–T-8, T-10–T-13, T-15–T-18, T-20–T-23)

- Astro 7 + TypeScript strict scaffold; static-only output; zero client JS
  (the sole `<script>` tag on the site is a JSON-LD data block, exempted by
  design from the zero-JS gate).
- **Section Registry**: `src/content.config.ts` (Content Layer API, glob
  loader + Zod) defines the `sections` collection with a closed template
  enum (`src/config/templates.ts`); `getSections()` is the single registration
  point that drives navigation, routing, and the sitemap. Extensibility was
  proven live by T-22: a stub "Now" section was registered and appeared in
  nav + sitemap with zero changes to core files, then reverted.
- **Home** (`/`): hero identity above the fold at 375px, condensed proof
  line, GitHub/LinkedIn/About link row (≥44px touch targets), Person JSON-LD
  in the page body.
- **About** (`/about/`): first-person markdown copy rendered from the
  registry, semantic `<article>` markup, mobile-responsive typography.
- **404** (`/nope/` and any unmatched path): styled, noindexed, keyboard-
  accessible "back to home" page, excluded from the sitemap.
- SEO head component: unique per-page `<title>`/description, Open Graph tags,
  absolute self-referencing canonical URLs, byte-identical across canonical
  link, sitemap, and `robots.txt`.
- Build-time `sitemap.xml` (exactly `/` and `/about/`) and `robots.txt`
  (global allow plus named allows for OAI-SearchBot, ChatGPT-User,
  PerplexityBot, ClaudeBot).
- Self-hosted, glyph-subsetted IBM Plex Sans WOFF2 fonts, `font-display: swap`,
  zero third-party font-CDN requests.
- `scripts/verify-static.mjs`: build-time gate for zero functional JS, zero
  third-party origins, required outputs present, and no résumé residue.
- QA: Lighthouse mobile (LCP 1.1s), accessibility 100 / axe 0 violations,
  manual 375–430px sweep (T-21, re-verified post-removal by T-28).

### Deployment (T-19, T-29, T-30)

- Canonical host retargeted to `https://www.mattoconn.workers.dev` after
  Cloudflare Pages was found unavailable for new projects (PRD v1.6
  platform correction).
- `wrangler.jsonc` (repo root): assets-only Worker `www`, no `"main"` entry,
  no `@astrojs/cloudflare` adapter, no server runtime. Required an
  additional empty `previews: {}` block beyond the original tech-design
  §10.3 spec, discovered when the first non-production branch build failed
  on `wrangler preview` (documented deviation, both QA rounds Pass).
- Live infrastructure (owner-only steps, completed for this release):
  account subdomain renamed to `mattoconn`, Worker `www` deployed, Workers
  Builds connected to GitHub for git-push CI/CD on `main`.
- Host-matched `_headers` generation (`scripts/gen-headers.mjs` +
  `scripts/noindex-rule.mjs`): every non-canonical `*.workers.dev` host
  (preview/version URLs) is noindexed; the canonical host is never noindexed
  and production writes no `_headers` rule at all when there's nothing to
  suppress.

## Removed / retired (not a regression)

- The résumé surface — landing page, PDF, `ProfilePage` JSON-LD, download
  CTA — was built (T-9, T-14) and later fully removed (T-25–T-28) per PRD
  v1.5 (OQ-7): the owner routes résumé depth through LinkedIn instead of
  hosting a PDF. T-24 (owner PDF commit) was cancelled and never executed.
  `/resume/` and `/resume.pdf` correctly 404 on the live site. These T-IDs
  are tombstoned and must not be re-implemented without a new PRD version.

## Breaking changes

None — this is the first release.

## Deployment targets

| Target | URL | Notes |
|---|---|---|
| Production | `https://www.mattoconn.workers.dev` | Cloudflare Worker `www`, static-assets only, free tier, no custom domain, no Routes. Auto-deploys via Workers Builds on push to `main`. |
| Preview / branch builds | `https://<version-prefix>-www.mattoconn.workers.dev` | Noindexed via host-matched `_headers` rule; used for non-production branch builds only. |

## Verification steps taken (this release)

Repo-level checks (already covered by T-19's QA report, re-confirmed here):

- `npm run build && npm run verify` — clean.
- `npx wrangler deploy --dry-run` — exit 0, assets-only upload, no bindings.
- `dist/client` and `dist/_worker.js` absent; `@astrojs/cloudflare` absent.

Live smoke tests against `https://www.mattoconn.workers.dev` (run as part of
this release, matching tech-design §10.3 step 6):

| Check | Expected | Result |
|---|---|---|
| `GET /` | 200 | 200 |
| `GET /about/` | 200 | 200 |
| `GET /about` | redirect → `/about/` | 307 |
| `GET /nope/` | 404 (custom page) | 404 |
| `GET /resume.pdf` | 404 | 404 |
| `GET /resume/` | 404 | 404 |
| `X-Robots-Tag` on `/` | absent (canonical never noindexed) | absent |
| `/robots.txt` `Sitemap:` line | `https://www.mattoconn.workers.dev/sitemap-index.xml` | matches |
| `rel="canonical"` on `/` | `https://www.mattoconn.workers.dev/` | matches |
| Worker deployment history | shows live deployments from CI/CD | confirmed via `wrangler deployments list --name www` |
| Routes / Custom Domains | none configured | confirmed by design (no dashboard changes made this release) |

Non-canonical-host noindex behavior (preview/version URL headers) was
verified live during T-19 execution per its QA report
(`projects/initial-site/qa/qa-report-T-19.md`); not re-run here since no
code changed since that pass.

## Rollback plan

- **Application code:** `npx wrangler rollback` restores the previously
  deployed Worker version in seconds. Before this release there was no prior
  successful production deployment, so the fallback for a bad 1.0.0 deploy is
  to fix forward or roll back to the version created immediately after the
  first `wrangler deploy` (version id `63b8a43a-39c7-4c83-8d5a-70752f444740`,
  created 2026-09-28T02:19:19Z — see `wrangler deployments list --name www`).
- **Git:** revert to tag `v1.0.0`'s parent commit and push; Workers Builds
  will redeploy automatically on the next push to `main`.
- **Infrastructure:** no destructive infra changes were made in this release
  (account subdomain rename and Workers Builds connection are one-way,
  intentional, and already stable prior to this tag).

## Notes / observations for future releases

- This is the project's first tag; going forward, version bumps should
  follow semver against this baseline (patch for content/copy or bug fixes,
  minor for new sections such as Projects/Blog/Now/Uses, major for any
  breaking change to the registry contract or canonical host).
- The `previews: {}` block in `wrangler.jsonc` is required by Wrangler for
  `wrangler preview` even though it holds no settings — do not remove it
  when editing deploy config.
- No custom domain or paid tier is in use; the site runs entirely on
  Cloudflare's free `workers.dev` tier.

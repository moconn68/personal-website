# QA Report — T-19: Cloudflare Workers static-assets deployment (repo-scope portion)

**Project:** initial-site
**Scope:** Repo-level changes only (tech-design §10.3 step 2, "[Dev, repo]"). Steps 0/1/3/4/5/6
(owner dashboard: subdomain rename, first live deploy, Workers Builds GitHub connection, live
smoke tests against the deployed URL) are explicitly out of scope for this diff and are executed
separately by the orchestrator/owner immediately after this QA pass.

## Overall Verdict: Pass

The repo is in a correct, safe state to proceed to the real deploy steps (subdomain rename →
first `wrangler deploy` → Workers Builds connection → live smoke tests).

## Checks performed (all independently re-run)

1. **`npm run build` + `verify-static.mjs`** — PASS. `verify: OK — 3 HTML, 0 CSS files checked
   (https://www.mattoconn.workers.dev)`.
2. **`npx wrangler deploy --dry-run`** — PASS, exit 0. Assets-only upload (12 files, 0.31 KiB),
   no bindings, no Worker script bundle.
3. **No server bundle artifacts** — PASS. `dist/client` and `dist/_worker.js` both absent.
4. **`npm ls @astrojs/cloudflare`** — PASS. Package absent (forbidden per DEP-8).
5. **`wrangler.jsonc` shape** — PASS. No `"main"` key; content byte-identical to tech-design.md
   §10.3 (`name: "www"`, `compatibility_date: "2026-09-27"`, `workers_dev: true`,
   `preview_urls: true`, `assets.directory: "./dist"`, `not_found_handling: "404-page"`,
   `html_handling: "auto-trailing-slash"`).
6. **Local runtime smoke test (`npx wrangler dev --port 8787`)** — PASS. `/nope/` → 404 with the
   site's custom 404 page body; `/about` → 307 redirect to `/about/`; `/` and `/about/` → 200.
   Dev server killed cleanly afterward.
7. **README consistency** — PASS. New "Deployment" section consistent with `.env.example` and
   actual `wrangler.jsonc` content; intro line correctly updated from Cloudflare Pages to Workers
   static-assets.
8. **Secret/token/account-ID scan** — PASS. No leaked credentials in any changed file.

## package.json / package-lock.json

`wrangler: "^4.142.0"` added as sole new devDependency. Lockfile churn is the expected transitive
closure for `wrangler` (`workerd`, `miniflare`, `@cloudflare/*`, etc.) plus benign
`optional`→`devOptional` metadata flips on `sharp`/`@img/colour`. No `@astrojs/cloudflare` or other
SSR adapter present.

## Bugs found

None.

## Recommendation

Sign off. Safe to proceed to the owner's live dashboard/deploy steps next.

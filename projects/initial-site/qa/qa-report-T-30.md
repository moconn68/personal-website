# QA Report — T-30: Host-matched `_headers` noindex (replaces `CF_PAGES_BRANCH` detection)

**Project:** initial-site
**Scope:** `scripts/gen-headers.mjs`, `scripts/verify-static.mjs` (rule 4e), new `scripts/noindex-rule.mjs`, `.env.example`, `README.md`, `projects/initial-site/tickets/tickets.md` (T-30 checkbox only).

## Overall Verdict: Pass

All ten validation items were executed directly against the working tree (not trusted from prior claims). No bugs found. Implementation matches the literal reference source in tech-design.md §10.1 and §11.1/§11.3 exactly.

## E2E Test Scenarios

1. **Default production build** (`rm -rf dist && npm run build`) — `dist/_headers` byte content confirmed via `xxd` to be exactly `https://:prefix-www.mattoconn.workers.dev/*\n  X-Robots-Tag: noindex\n`; chained `npm run verify` passes all rules. **Pass**
2. **Standalone `npm run verify`** after a clean build — clean pass, including new rule 4e. **Pass**
3. **Env-independence** (`CF_PAGES_BRANCH=preview-x WORKERS_CI_BRANCH=some-branch npm run build`) — `dist/_headers` byte-identical (`diff`) to the plain build; no branch detection remains. **Pass**
4. **Custom-domain canonical host** (`PUBLIC_SITE_URL=https://example.test npm run build`) — rule switches to `https://:worker.:account.workers.dev/*`; verify passes against the new origin. **Pass**
5. **Planted-negative regression** (design §11.2/§11.3 "Headers" row), each restored via clean rebuild:
   - a. Delete `dist/_headers` → verify fails: `FAIL dist/_headers: missing — non-canonical hosts would be indexable (SEO-12)`. **Pass**
   - b. Replace with bare path-only rule `/*` → verify fails on content mismatch + `FAIL ... rule "/*" is not host-matched, so it also applies to www.mattoconn.workers.dev`. **Pass**
   - c. Replace with a canonical-host-matching rule → verify fails on content mismatch + `FAIL ... rule "https://www.mattoconn.workers.dev/*" matches the canonical host www.mattoconn.workers.dev`. **Pass**
6. **Full regression of existing static gate** — canonical-origin/sitemap/robots cross-check, third-party origin scan, presence asserts, no-résidue asserts (T-25/T-27 résumé checks) all still pass; rule 4e rewrite introduced no collateral failures. **Pass**
7. **`npx astro check`** — 0 errors, 0 warnings, 0 hints across 20 files. **Pass**
8. **Residue check** — `grep -rn 'CF_PAGES_BRANCH|WORKERS_CI_BRANCH|PROD_BRANCH'` across `scripts/`, `.env.example`, `README.md`, `astro.config.mjs`, `src/` returns no matches. **Pass**
9. **Ticket scope** — `git diff --stat projects/initial-site/tickets/tickets.md` shows exactly the T-30 checkbox flip (`[ ]` → `[x]`); no other ticket lines touched. **Pass**
10. **Doc wording** (`.env.example`, `README.md`) — accurate, env-var-free, consistent with T-29's canonical host and T-30's host-matched mechanism; no stale claims left over. **Pass**

## Manual / Edge Notes

- `canonicalOriginFromRobots` throwing on a missing/malformed `robots.txt` `Sitemap:` line was verified by code inspection only (not exercised live, since it requires corrupting the Astro build itself). Low risk — straightforward regex match with an explicit throw.
- Live Cloudflare host-pattern matching against real preview/version URLs is explicitly out of scope for T-30 (deferred to T-19's live smoke test, design §10.3 step 6) and not testable in this environment.
- `hostPatternMatches`' placeholder-as-possibly-empty semantics are exercised indirectly by planted-negative case 5c (an exact-string rule against the real canonical host) but not by a dedicated placeholder-emptiness unit case. Non-blocking: the function is small, pure, and the repo has no dedicated unit-test suite — the build+verify integration gate is the project's established test boundary.

## Bugs Found

None.

## Recommendation

Sign off. All independently-executed validation steps pass, matching the design's literal reference exactly, with no scope creep and no residue of the retired `CF_PAGES_BRANCH`/`WORKERS_CI_BRANCH`/`PROD_BRANCH` mechanism. Repo left in a clean, verify-passing build state.

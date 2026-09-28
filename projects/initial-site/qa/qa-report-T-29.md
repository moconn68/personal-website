## QA Test Report — Ticket T-29
**Project:** initial-site | **Date:** 2026-09-27 | **Scope:** Canonical host literal → `https://www.mattoconn.workers.dev`

### Overall Verdict: **PASS**

All acceptance criteria and verification commands specified in the ticket were independently re-executed against the working tree and all passed with clean, concrete evidence. No regressions, no scope creep, no bugs found.

---

### 1. Build correctness

`npm run build` (astro build → gen-headers.mjs → verify-static.mjs):

```
✓ 3 page(s) built in 471ms
[gen-headers] production build — no _headers written
PASS canonical origin: robots.txt, 3 sitemap URL(s) and canonicals agree on https://www.mattoconn.workers.dev
PASS third-party scan: all load-bearing refs same-origin
PASS presence asserts
PASS dist/_headers: absent on this production build
PASS no-residue asserts
verify: OK — 3 HTML, 0 CSS files checked (https://www.mattoconn.workers.dev)
```
Exit code 0. verify-static's own canonical-origin gate reports the new host as agreed-upon, exactly as required. **Pass.**

### 2. `npx astro check`

```
Result (19 files):
- 0 errors
- 0 warnings
- 0 hints
```
Exit code 0. **Pass.**

### 3. Rendered output correctness (grepped `dist/`)

| Location | Value found |
|---|---|
| `dist/robots.txt` `Sitemap:` | `Sitemap: https://www.mattoconn.workers.dev/sitemap-index.xml` |
| `dist/index.html` canonical | `<link rel="canonical" href="https://www.mattoconn.workers.dev/">` |
| `dist/about/index.html` canonical | `<link rel="canonical" href="https://www.mattoconn.workers.dev/about/">` |
| `dist/sitemap-0.xml` `<loc>` entries | `https://www.mattoconn.workers.dev/`, `https://www.mattoconn.workers.dev/about/` |
| Person JSON-LD `url` (index.html) | `"url":"https://www.mattoconn.workers.dev/"` |

All five surfaces consistently reflect the new host. **Pass.**

### 4. Regression check — no stray `pages.dev` literal

```
rg -n 'mattoconn\.pages\.dev' --hidden -g '!projects/**' -g '!node_modules/**' -g '!dist/**' -g '!.git/**' .
```
Zero matches. Confirms a full literal replacement, not additive — no leftover `mattoconn.pages.dev` anywhere in `astro.config.mjs`, `.env.example`, `README.md`, `src/`, or `scripts/`. **Pass.**

### 5. Scope check — `src/config/site.ts` untouched

`git diff -- src/config/site.ts` produced no output (unmodified). File still reads `import.meta.env.SITE` only, with no host literal, matching tech-design §4.5. **Pass.**

### 6. Env-override plumbing regression (T-4 guarantee)

`PUBLIC_SITE_URL=https://example.test npm run build` → exit 0, verify-static reported agreement on `https://example.test` across robots/sitemap/canonicals; `dist/sitemap-0.xml` confirmed `<loc>https://example.test/…</loc>`. Rebuilt afterward without the override; `npm run build` exit 0 and `dist/sitemap-0.xml` restored to `https://www.mattoconn.workers.dev/…`. **Pass.**

### 7. Tickets file integrity

`git diff -- projects/initial-site/tickets/tickets.md` showed exactly one changed line pair: the T-29 checkbox flipping `- [ ]` → `- [x]`, rest of the line byte-identical. No other line changed — T-30's and T-19's `deps:` fields (referencing T-29) untouched. **Pass.**

### 8. Broader regression risk sweep

- `astro.config.mjs` diff is a single-line literal swap; `loadEnv` call, trailing-slash strip, and all other lines byte-identical.
- robots.txt AI-crawler allow list intact (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, all `Allow: /`).
- Sitemap route count unchanged (`/`, `/about/`).
- JSON-LD structure unchanged apart from the `url` value.
- Zero-JS / third-party gate: `PASS third-party scan: all load-bearing refs same-origin` on every build run (default host, `example.test` override, rebuilt default).

No side effects detected in nav, sitemap entry count, robots allow-list, JSON-LD structure, or the zero-JS gate. **Pass.**

---

### E2E Test Scenarios

| Scenario | Steps | Expected | Actual | Status |
|---|---|---|---|---|
| Default build resolves new canonical host | `npm run build` with no env override | All surfaces use `https://www.mattoconn.workers.dev` | Confirmed via grep, all 5 surfaces match | Pass |
| Env override still works | `PUBLIC_SITE_URL=https://example.test npm run build` | Override host propagates identically to all surfaces | Confirmed | Pass |
| Static analysis clean | `npx astro check` | 0 errors/warnings/hints | 0/0/0 | Pass |
| No stale literal anywhere in shipped code | `rg mattoconn.pages.dev` outside `projects/`, `node_modules/`, `dist/`, `.git/` | 0 matches | 0 matches | Pass |

### Manual Test Cases
Not applicable in the traditional UI-rendering sense — this ticket is a config/literal-only change with no visual or interactive surface. Verified textual/config outputs (robots.txt, sitemap XML, HTML `<head>` canonical, JSON-LD) rather than rendered UI. Error/loading/offline states: N/A (static site build-time change only; existing fail-fast in `site.ts` untouched and unexercised).

### Edge Case Matrix

| Case | Result |
|---|---|
| No `PUBLIC_SITE_URL` set (fallback path) | Resolves to new default `https://www.mattoconn.workers.dev`, verified |
| `PUBLIC_SITE_URL` explicitly overridden | Override wins, verified with `example.test` |
| Trailing slash strip still applied to new literal | Yes — literal has no trailing slash; regex logic line untouched |
| `src/config/site.ts` fail-fast if `SITE` missing | Logic untouched, not exercised (out of scope, correctly so) |

### Cross-Platform Notes
Not applicable — Astro static site, no iOS/Android target.

### Bugs Found
None.

### Recommendation
**Sign-off.** T-29 is implemented exactly to spec: single literal changed in `astro.config.mjs`, matching documentation updates in `.env.example` and `README.md`, `src/config/site.ts` correctly left untouched, no stray `pages.dev` literal remains outside `projects/`, build/check/verify all pass cleanly, the T-4 env-override plumbing still holds, and the tickets.md diff is a clean single-checkbox flip with no collateral edits. No blockers. Ready to proceed to T-30.

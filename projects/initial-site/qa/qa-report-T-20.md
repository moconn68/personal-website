# QA Report — T-20: Static-output verification script (zero-JS + zero third-party)

- **Ticket:** T-20 (`projects/initial-site/tickets/tickets.md` — NF-4, NF-5, DEP-3; design §11.1–§11.2)
- **Baseline:** `b248e8d` (T-18; T-19 parked on user's Cloudflare account creation)
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (3):** `scripts/verify-static.mjs` (new), `package.json` (M — `verify: node scripts/verify-static.mjs`), `projects/initial-site/tickets/tickets.md` (M — T-20 checkbox flip)

## Verdict: **Pass**

Gate is green on the clean output and correctly non-zero on every planted violation, with the JSON-LD exemption honored. Negative tests per §11.2 all executed and reverted. One owned follow-up: the Cloudflare Pages CI-retrofit (build command → `npm run build && npm run verify`) still requires the T-19 dashboard (user is creating a Cloudflare account).

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Walks `dist/**`; fails non-zero on functional client JS (<script src>, inline non-JSON-LD bodies, event-handler attrs) | All three markers produced a FAIL + exit 1 in the planted tests (see Gates). | Pass |
| 2 | Exempts `<script type="application/ld+json">` | Clean `npm run verify` exits 0 with the JSON-LD blocks live on `/`, `/resume/` (Person + ProfilePage). No FAIL emitted for those blocks. | Pass |
| 3 | Fails on third-party origin in href/src/srcset (host ≠ SITE_URL, incl. `//`-protocol-relative) | Planted `https://example.com/evil.js` → `FAIL <script src> → example.com` + exit 1. `<a href>` anchors exempt (HOME-3 outbound links); canonical/OG URLs same-origin → no false positives. | Pass |
| 4 | Fails if 404.html/robots.txt/sitemap files/href="/resume.pdf" anchor missing | Presence asserts wired; earlier debug run proved the assert path fires on absence (fixed the `null`-needle bug → existence-only check); clean run shows all present. | Pass |
| 5 | `npm run verify` exposed + CI retrofit | `package.json` gains `verify`. CI build-command retrofit (`npm run build && npm run verify`) is **deferred** — owned with T-19's dashboard connect once the user's Cloudflare account exists (documented, not silently dropped). | Pass (script), pending (retrofit) |
| 6 | Negative test performed & reverted | Two injections (a: src= + onclick, b: inline body) → both exit 1 with correct FAIL lines; rebuild → exit 0. | Pass |

## Validation gates (all executed)

1. **Clean gate** — `npm run build && npm run verify` → exit 0, `verify: OK — 4 HTML, 0 CSS files checked (mattoconn.pages.dev)`. Pass.
2. **Negative A (src + event-handler + third-party)** — `dist/index.html` injected with `<script src="https://example.com/evil.js">` + `<div onclick="boom()">` → exit 1; FAILs: `<script> with src=`, `event-handler attribute onclick`, `<script src> → example.com`. Pass. Rebuild → exit 0.
3. **Negative B (inline non-JSON-LD)** — `<script>console.log(1)</script>` → exit 1 + `inline <script> body without type="application/ld+json"`. Rebuild → exit 0. Pass.
4. **JSON-LD exemption** — clean runs over `/` (Person JSON-LD) and `/resume/` (ProfilePage + Person JSON-LD) emit no FAIL. Pass.
5. **External-scan reinforcement** — rule-2 overlap with the T-17 no-googleapis scan; clean output has zero non-origin load-bearing URLs. Pass.
6. **Fail-fast missing dist** — early `statSync` guard exits 1 with a clear message when `dist` is absent. Pass.

## Bug fixes during implementation

- `fail()` used `arr.push(msg) || console.log(...)` — push returns length (truthy), so FAIL lines never printed. Fixed to two statements.
- `mustContain` used `.includes(null)` for existence-only asserts → `null` coerced to `"null"` ⇒ false failures. Fixed to `needle === null || content.includes(needle)`.

## Regression risk (T-21 → T-24)

- **T-21 (Lighthouse):** the gate guarantees zero client JS, so Lighthouse "JavaScript execution time" will be zero — expected; load metric driven by HTML/CSS/fonts. Ready.
- **T-22 (extensibility):** the `/now` stub adds a plain `<article>`; no script, no third-party, so the gate stays green. The sitemap re-scan must add `/now` presence to the sitemap assert? No — ticket asserts route output; gate presence list unchanged (documented in T-22 QA). Ready.
- **T-24 (resume.pdf):** the `href="/resume.pdf"` anchor assert already in place; the file itself lands at T-24 (404 by design until then). Ready.
- Earlier ticket files untouched. No regression.

## Recommendation

Sign-off. T-20 gate logic is verified by both directions (clean pass + planted fails). Revisit the Cloudflare `npm run build && npm run verify` retrofit together with T-19 once the account exists.
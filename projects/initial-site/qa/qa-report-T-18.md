# QA Report — T-18: Build-time `_headers` generation

- **Ticket:** T-18 (`projects/initial-site/tickets/tickets.md` — DEP-7, RES-5, SEO-12, US-7; design §10.1–§10.2)
- **Baseline:** `dd6fbaa` (T-17); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (3):** `scripts/gen-headers.mjs` (new), `package.json` (M — `build` chains `&& node scripts/gen-headers.mjs`; added `fonts:subset`), `projects/initial-site/tickets/tickets.md` (M — T-18 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified in three build configurations. `dist/_headers` is emitted by every build; `resume.pdf` always gets the DEP-7 cache rule; the global noindex rule appears **only** on non-production branches. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `scripts/gen-headers.mjs` runs after `astro build`; writes `dist/_headers` | `package.json` `build: "astro build && node scripts/gen-headers.mjs"`. Any `npm run build` log shows `[gen-headers] wrote dist/_headers (production)`. | Pass |
| 2 | `/resume.pdf` → `Cache-Control: public, max-age=60, must-revalidate` | Byte-exact line in `dist/_headers` across all three configs (local, `CF_PAGES_BRANCH=main`, `CF_PAGES_BRANCH=preview-x`). | Pass |
| 3 | Non-canonical build (detected via `CF_PAGES_BRANCH` ∉ {absent, `main`}) → global `/*` `X-Robots-Tag: noindex`; production emits none | `CF_PAGES_BRANCH=preview-x npm run build` → `/*` + `X-Robots-Tag: noindex` present; default and `CF_PAGES_BRANCH=main` builds → no `noindex` (`rg -c noindex` → 0). | Pass |
| 4 | `Cache-Control` byte-exact per DEP-7; `/resume.pdf` path stable | Compared against design §10.1 exact content verbatim. | Pass |
| 5 | Preview simulation per ticket verifier | `CF_PAGES_BRANCH=preview-x npm run build && rg noindex dist/_headers` → matched. | Pass |

## Validation gates (all executed)

1. **Build (3 configs)** — local, `main`, `preview-x` all exit 0; headers emitted last in the chain (Cloudflare never sees a dist without `_headers`). Pass.
2. **Prod verifier** — `npm run build && cat dist/_headers` → no noindex, `max-age=60` present (AC-gate). Pass.
3. **Preview verifier** — noindex rule present, resume rule retained. Pass.
4. **No-Disallow invariant (SEO-12)** — robots.txt untouched (zero `Disallow`); noindex is header-based only. Pass.
5. **Stability** — `_headers` not committed to `public/` (generated into `dist/` only; would double-apply if committed per design §10.3). Confirmed no `public/_headers`. Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | `CF_PAGES_BRANCH=main` treated as production — matches the Cloudflare Pages "default production branch" contract. Verified. | — |
| W-2 | Info | Local builds (no env) are always production semantically; `PUBLIC_SITE_URL` never defaults to preview. Consistent with T-4 constraint. | — |
| W-3 | Info | `fonts:subset` script added (`node scripts/subset-fonts.mjs`) — a convenience wrapper over the T-17 one-shot; requires a prior `npm run build` for glyph sweep. | — |
| W-4 | Info | T-19 must set `PUBLIC_SITE_URL=https://mattoconn.pages.dev` in production env only, and leave it unset for preview builds (Cloudflare + the note in §10.3). | T-19 |

## Regression risk (T-19 → T-24)

- **T-19 (Cloudflare):** deploy config uses the new `build` script unchanged; post-T-20 becomes `npm run build && npm run verify` per design §10.3.4. Ready.
- **T-20 (verify-static):** adds presence asserts for `dist/_headers` + `Cache-Control` contents and the third-party scan. Ready.
- **T-21 (Lighthouse):** no interaction. Ready.
- Earlier ticket files untouched. No regression.

## Recommendation

Sign-off. T-18 satisfies its acceptance criteria and design §10.1 byte-exact content. Proceed to T-19.
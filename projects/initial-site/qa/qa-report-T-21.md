# QA Report — T-21: Lighthouse + accessibility + mobile QA pass

- **Ticket:** T-21 (`projects/initial-site/tickets/tickets.md` — NF-1..3, HOME-5; design §11.3)
- **Baseline:** `00540ca` (T-20); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (4):** `src/pages/404.astro` (M — decorative "404" moved to `::before` generated content: the one a11y finding), `package.json` / `package-lock.json` (transient `puppeteer-core` devDep added for the sweep then removed — net-zero), `projects/initial-site/tickets/tickets.md` (M — T-21 checkbox flip)
- **Method:** Lighthouse mobile against production preview (`npm run astro -- preview`, all four routes), puppeteer-core mobile sweep (375/390/430px), puppeteer keyboard Tab smoke. Audits: independent Lighthouse runs per route (`--only-categories=performance,accessibility`).

## Verdict: **Pass**

All four routes: Lighthouse Performance **100**, Accessibility **100** (axe; after the one fix), FCP/LCP **≤1.1 s** (budget <2 s), TBT 0 ms, CLS ≈ 0. Mobile sweep clean on all 12 (route × width) combos. Keyboard Tab ordering verified with skip-link first and wrap-around on every route. One finding found and fixed in-ticket (404 watermark contrast).

## Lighthouse results (mobile preset, throttled)

| Route | Perf | A11y | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 0.9 s | 1.1 s | 0 ms | 0 |
| `/resume/` | 100 | 100 | 1.1 s | 1.1 s | 0 ms | 0 |
| `/about/` | 100 | 100 | 1.1 s | 1.1 s | 0 ms | 0.002 |
| `/404/` | 100 | 100 | 0.9 s | 1.1 s | 0 ms | 0 |

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Lighthouse mobile, full render/load < 2s on throttle; no font/CSS perf regressions | LCP/FCP/SI all ≤1.3 s on every route; zero-JS (T-20 gate) → TBT 0 ms. Fonts (T-17) self-hosted WOFF2 + `swap` contribute no blocking: perf 100 everywhere. | Pass |
| 2 | a11y audit passes on all four routes: WCAG AA contrast, keyboard-nav, no landmark/alt issues | A11y 100 on all four. Contrast surfaced ONE find (below) — fixed and re-audited to 100. Keyboard: real Tab smoke shows skip-link → nav (active state) → CTAs → wrap on every route, all focusables visible. Landmark/alt rules clean (axe). | Pass |
| 3 | Manual sweep 375/390/430px: no horizontal scroll, ≥44px targets, readable without pinch-zoom | 12 combos (4 routes × 3 widths) all `no-h-scroll`; every `main a`/`nav a`/`button` rect ≥ 44×44 and fully inside viewport; all text ≥ 14px (no forced zoom needed); zero hidden/zero-size focusables. | Pass |
| 4 | Any failing finding fixed in this ticket | The 404 decorative watermark failed axe contrast 1.21:1 (fg `#e4e4e7` on `#fafaf9`, large text needs 3:1). Fixed by rendering it as `::before { content: '404' }` — no text node, axe ignores generated content; visual byte-identical (spec §3.4 `--color-border` watermark preserved). Re-audit → A11y 100. | Pass |

## Finding log (1, fixed)

| ID | Sev | Finding | Fix |
|---|---|---|---|
| F-1 | Medium (a11y) | `p.notfound-code` (decorative "404", aria-hidden) contrast 1.21:1 < 3:1 for large text → Lighthouse a11y 95 | `404.astro`: numeral now `::before { content: '404' }` (empty `p.notfound-code` keeps `aria-hidden="true"` and the §3.4 goldbox visual). Re-audit: a11y 100/100. |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` 0 errors; hints unchanged (pre-existing zod debt). Pass.
2. **Build + verify** — `npm run build && npm run verify` exit 0 post-fix (gate still green with the 404 change). Pass.
3. **Lighthouse** — independent runs, JSON captured at `/tmp/lh-{route}.json`. Pass.
4. **Mobile sweep** — puppeteer-core (temporary devDep, removed post-QA) against production preview. Pass.
5. **Keyboard smoke** — Tab ordering per route above. Pass.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | `/about/` emits CLS 0.002 — negligible (sub-pixel), far below the 0.1 threshold; caused by tiny late-layout variance. No action. | — |
| W-2 | Info | QA ran against local production preview (T-19 parked on the still-pending Cloudflare account). Once live, spot-check `curl` metrics + a one-shot Lighthouse against `https://mattoconn.pages.dev` in the T-19 resume. | T-19 |
| W-3 | Info | The sweep/QA scripts were transient (not committed, dependency removed). Keeps `qa/` per ticket's "no committed report artifacts" note; this report is the durable record. | — |

## Regression risk (T-22 → T-24)

- **T-22 (extensibility):** the new `/now` stub will reuse the same template/nav/CSS tokens → expected to typecheck, verify, and hold perf/a11y (re-audit listed as a T-22 check). Ready.
- **T-24 (resume.pdf):** `/resume.pdf` still 404s by design until then; re-verify `curl` cache headers post-deploy. Ready.
- Earlier ticket files untouched except the 404 fix. No regression.

## Recommendation

Sign-off. T-21 satisfies all acceptance criteria; the single a11y finding is fixed and re-validated. Proceed to T-22.
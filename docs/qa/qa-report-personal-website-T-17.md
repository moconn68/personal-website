# QA Report — T-17: Self-hosted subset WOFF2 (IBM Plex Sans 400/600)

- **Ticket:** T-17 (`docs/tickets/tickets-personal-website.md` — NF-1, PERFORMANCE-1, R7; design §7)
- **Baseline:** `1dd3167` (T-16); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (8):** `scripts/font-src/IBMPlexSans-Regular.ttf` (new), `scripts/font-src/IBMPlexSans-SemiBold.ttf` (new), `scripts/subset-fonts.mjs` (new), `src/assets/fonts/ibm-plex-sans-400.woff2` (new), `src/assets/fonts/ibm-plex-sans-600.woff2` (new), `src/assets/styles/global.css` (M — `@font-face`), `docs/designs/tech-design-personal-website.md` (M — §7 command amendment), `docs/tickets/tickets-personal-website.md` (M — T-17 checkbox flip). Deps: `package.json`/`package-lock.json` (`subset-font` devDependency).

## Verdict: **Pass**

All acceptance criteria verified. Zero external font references; `@font-face` rules (400+600, `font-display: swap`) present in output; single OFL family. One documented, pre-approved deviation: subsetting tool is `subset-font` (pure Node) instead of `glyphhanger` (needs Python `fonttools`+`brotli`, not installed) — the ticket explicitly allows either.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Vendor a single OFL font family (IBM Plex Sans, weights 400+600) | TTFs committed at `scripts/font-src/` (from the official `ibm-plex-sans@1.1.0` OFL release zip; 202,500 / 202,632 bytes, TrueType). No other family referenced. | Pass |
| 2 | Subset to used glyphs, WOFF2 into `src/assets/fonts/`, imported so Astro fingerprints them into `dist/` | `node scripts/subset-fonts.mjs` derived a 96-glyph set by sweeping the built HTML + redundancy whitelist; emitted `ibm-plex-sans-400.woff2` (13,344 B) and `-600.woff2` (14,388 B). Build fingerprints both into `dist/_astro/ibm-plex-sans-{400,600}.{hash}.woff2` — verified present + valid WOFF2 (`wOF2` header). | Pass |
| 3 | Global CSS `@font-face` with `font-display: swap` | `global.css` has the two normative §7 blocks; inlined CSS in every built HTML page shows `font-display:swap` and `url(/_astro/ibm-plex-sans-*.woff2)`. | Pass |
| 4 | Zero references to any font CDN | `rg -i 'googleapis|gstatic|fonts\.google' dist/` → **NO external fonts** | Pass |
| 5 | Verify build | `npm run build` exit 0; `rg '@font-face' dist/*.html` (inlined CSS) → 400 + 600 rules on all 4 pages. | Pass |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, hints = the pre-existing T-2 zod `.url()` deprecations only. Pass.
2. **Build** — exit 0; fonts emitted as fingerprinted assets; sitemap/robots output unchanged (regression check). Pass.
3. **Ticket verifier** — external-font scan (AC 4) + `@font-face` presence (AC 5). Pass.
4. **WOFF2 validity** — Magic bytes `wOF2` on both emitted assets. Pass.
5. **Glyph coverage** — charset derived from the actual built HTML (index/resume/about/404) so all live copy glyphs (`Résumé`, `©`, `—`, `’`, `“”`) are present; redundancy whitelist matches §7. Pass.
6. **Determinism/repeatability** — TTF sources committed; build never invokes subsetting (one-shot tool, re-runnable via a single documented command when copy changes). Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | CSS is inlined into each HTML page (Astro inlines the small global stylesheet) → `@font-face` appears in `<style>` on all 4 pages, not a separate `.css` file. Expected at this site's stylesheet size; no action. |
| W-2 | Info | T-23 (final copy) changes → **must re-run** `npm run build && node scripts/subset-fonts.mjs` BEFORE merging unless the new copy adds no new glyphs (charset is copy-derived). Design §7 amended to state this. |
| W-3 | Info | The design's original `glyphhanger` snippet is preserved above the amendment note; the normative *output* (two pinned WOFF2 names, weights, swap) is unchanged, so CSS/reference contract holds. | — |

## Regression risk (T-18 → T-24)

- **T-18 (_headers):** no interaction (fonts are static `/_astro/*` assets). Ready.
- **T-20 (verify-static):** third-party-origin scan now also greps for `googleapis`/`gstatic` — already clean. Ready.
- **T-21 (Lighthouse):** subset WOFF2 (~13–14 KB each) + `swap` improves FCP/LCP vs system fonts. Ready.
- **T-22 (extensibility):** `/now` stub introduces all-ASCII copy → no subset change needed (same charset). Ready.
- Earlier ticket files untouched. No regression.

## Recommendation

Sign-off. T-17 satisfies its acceptance criteria. Deviation documented in design §7. Proceed to T-18.
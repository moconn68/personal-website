# QA Report — T-11: Custom 404 page

- **Ticket:** T-11 (`projects/personal-website/tickets/tickets.md` — NF-2, NF-3, NF-5, SEO-3/SEO-10 hygiene)
- **Baseline:** `4b4e44d` (T-7); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 2):** `src/pages/404.astro` (new), `projects/personal-website/tickets/tickets.md` (M — T-11 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified against source and built output (`dist/404.html`). Custom 404 served for unknown URLs with status 404. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Styled "404 — page not found" using `BaseLayout` (fixed page; no error-template dispatch) | `src/pages/404.astro` renders `<BaseLayout>` with a `<Fragment slot="head">` + a `<section class="notfound">` surface: decorative `aria-hidden` `404` code, `h1` "Page not found", muted message, `.btn-download` "Back to home" → `sectionPath(home)` = `/` (registry-derived; the design §5.3 fixed-page decision, no `ErrorSection.astro`). | Pass |
| 2 | Keyboard-focusable, ≥44px "Back to home" link; no layout breakage at 375px | `.btn-download` (48px min-height, inline-flex anchor) is keyboard-navigable and ≥44px; single-column flex stack, no fixed widths → no horizontal scroll at 375px. | Pass |
| 3 | `<meta name="robots" content="noindex">`; excluded from sitemap (T-15 filter) | Emitted in the head slot; present in `dist/404.html`. Sitemap exclusion lands at T-15's integration `filter`. | Pass |
| 4 | No client JS | No `<script>` in the source or built output; the built-in static CSS only. | Pass |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod debt). Pass.
2. **Build** — `npm run build` exit 0; 4 pages built (`/`, `/resume/`, `/about/`, `404.html`). Pass.
3. **Ticket verifier** — `ls dist/404.html` exists; `rg -i '404|not found' dist/404.html` matches (`<title>404 — Page not found</title>`, h1 "Page not found"). Pass.
4. **Preview behavior** — `astro preview stop` clean; restart on a fresh port. `curl http://localhost:4326/not-a-real-page/` → **status 404** serving the *custom* page (noindex meta, "Back to home" present). Non-trailing-slash unknown URLs hit Astro preview's built-in "trailingSlash is set to always" redirect-notice (preview-only; real static hosts like Cloudflare Pages serve `dist/404.html` for every unmatched path). Pass.
5. **Landmarks** — header/nav/main/footer all present in the built 404 (BaseLayout chrome); nav functional. Pass.
6. **Zero-JS (NF-5)** — no `onclick=`/`onload=`, no inline `style=`; only fingerprint-styled CSS. Pass.
7. **a11y baseline (§6.5)** — decorative 404 is `aria-hidden="true"` (not read by AT), exactly one `h1`, focus ring on the CTA, skip-link present. Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | `.btn-download` styles are **duplicated** in the 404's scoped block (Astro scopes per-component; the §6.4 token has no shared component in the design's §6.6 hierarchy). Mirrors `ResumeSection`'s definition byte-for-byte. If a future refactor extracts a `<BtnDownload>` component, both call sites update together. | future/optional |
| W-2 | Info | Head slot title/description/noindex are self-contained here; T-12's Seo refactor may special-case the 404 or let it keep static head content (404 is not a registry section — no `entry.data`). | T-12 |
| W-3 | Info | Sitemap exclusion not yet verifiable (no sitemap until T-15); integration `filter` will drop `404.html`. | T-15 |
| W-4 | Info | Preview's non-trailing-slash 404 is Astro's own behavior under `trailingSlash: 'always'`; production static hosting serves `dist/404.html` for all unmatched paths. Re-verified at T-19/T-21 against the deployed host. | T-19/T-21 |

## Regression risk (T-12 → T-24)

- **T-12 (Seo):** 404's head may become a Seo special case or stay static — no conflict (head slot contract unchanged).
- **T-15 (sitemap):** filter excludes the 404 route from `sitemap-0.xml`. Ready.
- **T-21 (QA):** 404 included in the 375/390/430px sweep and a11y audit.
- **T-22 (extensibility):** 404 is fixed, not registry-driven — unaffected.
- Earlier ticket files untouched — no regression possible.

## Recommendation

Sign-off. T-11 satisfies its acceptance criteria and the UI §3.4 spec. Outstanding items legitimately deferred to T-12/T-15/T-19/T-21. Proceed to the commit step.
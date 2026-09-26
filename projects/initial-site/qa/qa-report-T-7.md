# QA Report — T-7: Registry-driven section route with template dispatch

- **Ticket:** T-7 (`projects/initial-site/tickets/tickets.md` — REG-4, REG-6, US-9, US-10, US-11)
- **Baseline:** `4594137` (T-10); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (6):** `src/pages/[...slug].astro` (new), `src/pages/index.astro` (deleted — scaffold superseded), `astro.config.mjs` (M — `trailingSlash: 'always'`), `public/favicon.ico` + `public/favicon.svg` (deleted — design §12.5 ships no favicon), `projects/initial-site/tickets/tickets.md` (M — T-7 checkbox flip + deviations note)

## Verdict: **Pass**

All acceptance criteria verified against source **and** rendered `dist/` output. Negative test (registered section with missing template) fails the build loudly with exit 1. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `[...slug].astro` optional catch-all: `getStaticPaths()` → one path per `getSections()` entry; home → `/` (`{ params: { slug: undefined } }`), others → `/{slug}` | `getStaticPaths()` maps home→`{ slug: undefined }` (→ `/`), resume→`resume`, about→`about`. Build output: `dist/index.html` + `dist/resume/index.html` + `dist/about/index.html` (3 pages). Trailing slash: `/resume/` and `/about/` verified via nav hrefs + direct curl (200). | Pass |
| 2 | Template dispatch glob-driven; component for `template: home` resolves `../templates/HomeSection.astro` (PascalCase + `Section` suffix) | `templates = import.meta.glob('../templates/*.astro', { eager: true })` keyed via `templateToComponentName(entry.data.template)` → `../templates/HomeSection.astro` etc. (design §5.1). All three built pages render their correct template (verified: home hero/link-row, résumé CTA, about article). | Pass |
| 3 | Registered section with missing template component = **build failure** (loud, typed); no error-template fallback | Negative test: added `src/content/sections/now.md` (`template: now`, a valid enum value, no `NowSection.astro` file) → `npm run build` **exit 1** with `[ERROR] Missing template component for "now" — expected ../templates/NowSection.astro.` and "Caught error rendering /now/". File reverted; tree clean. 404 has no template fallback (enum has no `error` value); unknown URLs served by Astro's static 404 handling until T-11 ships the styled page. | Pass |
| 4 | New section needs **no changes** to the route file (glob picks up new components) | Route is statically boilerplate: `import.meta.glob` + `getSections()` iteration. No per-section branches (T-22 proves with the stub). | Pass |
| 5 | Every generated route passes `section` data through, typed via the collection's inferred type | `Astro.props as { entry: SectionEntry }`; `<SectionTemplate entry={entry} sections={sections} />` per design §5.1 contract. `npx astro check` 0 errors. | Pass |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod `.url()` deprecations — known debt). Pass.
2. **Build** — `npm run build` exit 0; 3 pages built (`/`, `/resume/`, `/about/`). Pass.
3. **Nav dist-level assertion (deferred from T-5)** — `dist/index.html`: `href="/resume/"` ×2 (nav + home chip), `href="/about/"` ×2, `href="/"` ×1 nav, active Home with `aria-current="page"`. `dist/resume/index.html`: résumé nav active, `href="/resume.pdf"` + "Download résumé (PDF)" present. `dist/about/index.html`: about nav active, `<h1>About</h1>`, 4 markdown `<p>`s. Pass.
4. **Trailing-slash policy (T-5 watcher)** — `trailingSlash: 'always'` set; nav hrefs render `/resume/` + `/about/` (canonical form, byte-consistent with `sectionPath()`); root is `/`. Pass.
5. **Route conflict / R8 consistency** — removed scaffold `index.astro` (would conflict with the catch-all's home route); no duplicate-route build error. Nav/canonical/sitemap single trailing-slash source now in force. Pass.
6. **Preview 404** — `curl http://localhost:4323/nonexistent-page` → 404; `curl http://localhost:4323/resume/` → 200. Unknown URLs fall to static 404 until T-11. Pass.
7. **Landmarks on every rendered page** — each built page has `<header>`, `<nav aria-label="Main">`, `<main id="main">`, `<footer>` (BaseLayout chrome; footer `© 2026 Matthew O'Connell` from the registry home entry). Pass.
8. **Zero-JS (NF-5)** — built pages contain no `<script>`, no event-handler attributes; only the single fingerprint-styled CSS link. Pass.
9. **Favicon hygiene (§12.5)** — scaffold `public/favicon.ico` + `public/favicon.svg` (only referenced by the deleted scaffold `index.astro`) removed; `dist/` contains no favicon files — matches "no favicon shipped in v1". Pass.

## Bug / deviation watchers

| ID | Severity | Description | Disposition |
|---|---|---|---|
| D-1 | Info | **No `path` prop to BaseLayout** (T-6 deviation honored): the design §5.1 snippet's `<BaseLayout path={currentPath}>` is vestigial — Nav reads `Astro.url.pathname`. Not passed. `sectionPath` import omitted for the same reason; re-introduced at T-12 (canonical). | T-12 |
| D-2 | Info | **Head slot left empty** until T-12's Seo composes titles/descriptions/canonicals into it. Interim pages carry no `<title>` (build-legal; the SEO gate is T-12). | T-12 |
| D-3 | Info | **`trailingSlash: 'always'` lands at T-7** (not T-1) — the policy is only consequential once section routes exist; documented here per T-5's watcher. | — |
| D-4 | Info | **Favicon files deleted** per tech design §12.5 (no favicon in v1) + T-6 watcher note. Unticketed cleanup; reviewer/QA-sanctioned. | — |
| W-1 | Info | 404 rendering is Astro's default until T-11 ships `src/pages/404.astro` (fixed page, `<meta robots="noindex">`, "Back to home" `.btn-download`). T-11 is next-ranked eligible ticket. | T-11 |

## Regression risk (T-11 → T-24)

- **T-11 (404):** fixed page takes precedence over the catch-all. No conflict; the catch-all stays registry-only.
- **T-12 (Seo):** fills the head slot; needs `home` + title pattern — route re-adds the `home` lookup + `sectionPath` at that rank.
- **T-15 (sitemap):** integration crawls the registry-generated routes automatically — indices `/`, `/resume/`, `/about/`.
- **T-22 (extensibility):** stub needs exactly `now.md` + `NowSection.astro`; glob picks it up with zero route changes — precondition already proven by this ticket's negative test behavior.
- **T-20 (verify-static):** three pages, no scripts, no external origins — clean baseline for the scanner.
- Earlier ticket files (T-1..T-6, T-8..T-10) unaffected; only `astro.config.mjs` touched (one sanctioned line) and scaffold `index.astro`/favicons removed.

## Recommendation

Sign-off. T-7 satisfies its acceptance criteria including the loud missing-template build failure and the trailing-slash canonical contract. Outstanding items legitimately deferred to T-11/T-12/T-15/T-20/T-22. Proceed to the commit step.
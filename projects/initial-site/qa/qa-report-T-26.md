# QA Report — T-26

**Project:** `initial-site`
**Work item:** T-26 — Remove résumé link + ProfilePage JSON-LD wiring from Home and shared modules
**Size:** S · **PRD:** v1.5 · **Requirements exercised:** `RES-X1`, `RES-X4`, `HOME-3`, `SEO-1`, `NF-2`, `NF-3`
**Base commit:** `04743f9` (T-25) · **Code state at test time:** working tree, uncommitted
**QA attempts:** 2 of 2 (attempt 1 → Pass with Caveats; attempt 2 after the F-1 fix → **Pass**)
**Code review:** Approve (attempt 2 of 2, zero findings)

---

## Verdict

**Pass.** Zero blocking, zero major, zero minor findings. The one `minor` finding raised in
attempt 1 (F-1, a self-contradicting comment in `src/pages/404.astro`) was fixed in the same
work item and independently re-verified.

This is step **2 of 4** in the PRD v1.5 removal chain (`T-25 → T-26 → T-27 → T-28`), and the step
tech design §14 flags as the only one that "can silently break surviving functionality". The
`RES-X4` guard holds.

---

## What was tested

T-26 is the **page-surface half** of the résumé removal. T-25 had already deleted
`src/content/sections/resume.md`, `src/templates/ResumeSection.astro`, and the `'resume'` enum
value. T-26 was required to: trim the Home link row to GitHub/LinkedIn/About; delete
`src/components/JsonLdProfilePage.astro` outright; guard that the `Person` JSON-LD survived
(`RES-X4`); rewrite a stale two-caller comment in `person.ts` (comment only); scrub vestigial
résumé comments in `Seo.astro`, `404.astro`, and `astro.config.mjs` (comments only, no behavioural
edit to the config); and rename the 404 CTA token `.btn-download` → `.btn-primary` with the visual
result unchanged.

### Acceptance criteria

| # | Criterion | Method | Result |
|---|---|---|---|
| 1 | Home link row is **GitHub, LinkedIn, About**; résumé entry and its `resumeEntry` lookup gone | Comment-stripped true-diff of `HomeSection.astro` vs base: exactly 2 code lines changed (the `resumeEntry` delete; `[resumeEntry, aboutEntry]` → `[aboutEntry]`). Served `/` and read the chip order + hrefs | **Pass** |
| 2 | Conditional GitHub/LinkedIn render and `sectionPath()` registry discipline preserved | The `github && (…)` / `linkedin && (…)` blocks and `registryLinks.map` markup are byte-identical to base; `about.md` still read via `sectionPath(aboutEntry)`; no literal `href="/` in the component | **Pass** |
| 3 | `JsonLdProfilePage.astro` deleted; `ProfilePage` gone; not migrated elsewhere | `git diff --cached` shows the 27-line deletion; `rg -i 'ProfilePage' src/ dist/` → no match; `dist/index.html` has exactly 1 `ld+json` block site-wide | **Pass** |
| 4 | **`RES-X4`:** `Person` JSON-LD still renders, valid JSON, all three fact groups | Block position 7351 > `</head>` 6713 → in `<body>` per design §8.3. `node -e` `JSON.parse` → valid. `@type: Person`; `name: "Matthew O'Connell"`, `jobTitle: "HUMAN COPY — job title"`, `sameAs: [2 URLs]`. No `mainEntity` | **Pass** |
| 5 | `person.ts` comment only; `getPersonData()` untouched | Comment-stripped diff vs base: **identical** (20 code lines each). "Only caller" claim re-derived: `getPersonData` has exactly one call site (`JsonLdPerson.astro`) | **Pass** |
| 6 | Comment scrubs in `Seo.astro` / `404.astro` / `astro.config.mjs`; **no behavioural config edit** | Comment-stripped diffs: `astro.config.mjs` **identical** (14 lines), `Seo.astro` **identical** (19 lines) — so `site`, `trailingSlash: 'always'`, and the sitemap `filter` are provably untouched | **Pass** |
| 7 | `.btn-download` → `.btn-primary`, visual identical, ≥44px target + accent bg + focus ring | Comment-stripped, token-normalized diff vs base: **sha256 identical**. Every `property: value` byte-for-byte unchanged (39 declaration lines each). Built CSS: `min-height:48px`, `background:var(--color-accent,#1e40af)`, `outline:2px solid …; outline-offset:2px` on `:focus`/`:focus-visible`; zero `outline:none` in `dist/` | **Pass** |
| 8 | `.btn-primary` is the only definition on the site | 7 hits, all in `404.astro`. `global.css` has zero class selectors; its only button rule is an element selector setting the identical focus outline. `btn-download`: zero hits in `src/` and `dist/` | **Pass** |
| 9 | Ticket verifier: `npm run build && npx astro check` | Build exit 0 (3 pages). `astro check` 0 errors, 0 warnings, 3 hints — all pre-existing, in files T-26 must not touch | **Pass** |
| 10 | `rg -i 'resume' dist/ --glob '!_headers'` → nothing | exit 1, no output. Unscoped run matches exactly one line in the whole build: `dist/_headers:1:/resume.pdf` (T-27's, by design) | **Pass** |
| 11 | `rg -i 'resume\.pdf' src/` → nothing | exit 1 | **Pass** |
| 12 | `rg 'btn-download' src/` → no match; `rg 'btn-primary' src/pages/404.astro` → match | exit 1 / exit 0 (6 hits) | **Pass** |

### Regression risk (deletions break neighbours)

| # | Check | Result |
|---|---|---|
| 13 | Registry shape: `getSections()` returns exactly `home` (`/`) + `about` (`/about/`) | **Pass** — Content Layer store `data-store.json` `sections` Map has 2 entries; corroborated by 3 independent build surfaces |
| 14 | Nav renders exactly 2 items, `aria-current="page"` on the active one | **Pass** — `/` marks Home, `/about/` marks About, `404.html` marks neither |
| 15 | Sitemap lists exactly `/` + `/about/`; `404.html` excluded | **Pass** |
| 16 | Canonical/og:url absolute, self-referencing, byte-identical to sitemap + `robots.txt` `Sitemap:` | **Pass** on both routes; `robots.txt` `Sitemap:` == `sitemap-index.xml` == its own `<loc>` |
| 17 | `robots.txt` allow-all + 4 named AI-crawler Allow blocks + `Sitemap:`; zero `Disallow` | **Pass** |
| 18 | Zero client JS holds; JSON-LD still treated as data | **Pass** — 0 functional-JS markers, 0 event-handler attrs, 0 `style=` attrs, 1 ld+json data block across all 3 HTML files; `404.html` has 0 `<script>` tags |
| 19 | Zero third-party requests holds | **Pass** — only absolute URLs are the 2 outbound `target="_blank" rel="noopener noreferrer"` profile links; all CSS `url()` same-origin |
| 20 | 404 still styled, `noindex`, keyboard-focusable, unbroken after the rename | **Pass** — `<title>`, `noindex`, `btn-primary` CTA to `/`, 3 scoped rules, 4 landmarks, 1 `h1`, skip link, 48px target |
| 21 | No dead résumé route | **Pass** — `/resume/` → 404 rendering the real styled 404 page; `/resume.pdf` → 404; zero `href="/resume…"` in any built page |
| 22 | Home hero element order intact | **Pass** — `Person` block → `<h1>` → markdown body → proof line → 3-chip link row |
| 23 | Implementer committed nothing | **Pass** — `git log 04743f9..HEAD` empty |

---

## Findings

### F-1 — `minor` — `src/pages/404.astro:5` contradicted `src/pages/404.astro:77-78` — **RESOLVED**

Attempt 1 found the file header claiming the CTA *"reuses the `.btn-primary` token"* while the
style-block comment claimed *"this page owns the only definition of it"*. Both cannot be true, and
line 77's stale half still carried a dangling reference to `ResumeSection`, a component deleted in
T-25. That is exactly the stale-reference failure mode the T-26 comment scrub exists to prevent:
a reader scanning the header would conclude a shared `.btn-primary` component existed and go
hunting for it.

Attempt 2: the header now reads *"the single primary action **defines** the `.btn-primary` token"*,
agreeing with line 77. Independently confirmed the "only definition" claim is factually true
(7 hits, all in `404.astro`; `global.css` has no class selectors). Zero functional impact in
either state; graded `minor` rather than `nit` because a misleading in-file comment is a real
defect class for this ticket.

### F-2 — `minor` (process) — index/worktree split was a live commit hazard — **Handled by orchestrator**

`JsonLdProfilePage.astro`'s deletion was staged while the other six edits were unstaged, so a naive
`git commit` would have recorded only the deletion and silently reverted the visible résumé link
removal — while still passing `npm run build`, because a missing `resumeEntry` resolves to
`undefined` and is dropped by the existing type guard. Not a code defect. Resolved by staging all
named paths explicitly for the T-26 commit.

### F-3 / F-4 / F-5 — `nit`, pre-existing, **carried to T-28** (not T-26 regressions)

- **F-3:** `dist/404.html` has no canonical and no `og:url` — the 404 hand-writes its head fragment
  and does not import `Seo.astro` (T-11/T-12 shape). T-26 left it byte-identical. Low impact: the
  page is `noindex` and sitemap-excluded.
- **F-4:** `/about` without a trailing slash returns 404 under `astro preview` (build
  `format: "directory"` + `trailingSlash: "always"`; the static preview server does not synthesise
  the slash redirect — Cloudflare Pages does). Unchanged by T-26.
- **F-5:** `src/templates/HomeSection.astro:11` says *"no script tags"* while the template renders
  `JsonLdPerson`, which emits a `ld+json` block. The intent (no *client* JS) is correct and the
  scanner confirms 0 functional-JS markers, but the literal wording misdescribes the file. This
  line is unchanged context in the T-26 diff.

---

## Expected failures at this rank (T-27's surface, not T-26's)

These were confirmed correct, not worked around:

- `npm run verify` → **exactly 1** violation: `FAIL résumé download anchor missing at
  dist/resume/index.html (needle: href="/resume.pdf")`, from `scripts/verify-static.mjs:153`. T-26
  was forbidden to touch `scripts/`, and a later ticket (**T-27**) replaces that assert with
  negative asserts. Third-party scan and presence asserts both PASS; the delta introduced no new
  violation.
- `dist/_headers:1:/resume.pdf` — emitted by `scripts/gen-headers.mjs`, also T-27's work. This is
  why T-26's residue assertion is scoped `--glob '!_headers'`.
- `npx astro check` 3 hints — 1 unused `readdirSync` in `scripts/subset-fonts.mjs`, 2 deprecated
  `z.string().url()` in `src/content.config.ts`. Pre-existing, forbidden files.

---

## Carried forward to T-27 / T-28

1. **Accent-tolerant residue pattern.** `rg -i 'resume'` does **not** match the accented `Résumé`
   (`é` ≠ `e`), and several T-26 comments used the accented form. The specified regex alone could
   not have proven those comments were scrubbed. Re-running with `r[eé]sum[eé]` against both
   `src/` and `dist/` returned **zero** hits, so the site is genuinely clean — but T-27's negative
   asserts and T-28's sweep should use the accent-tolerant pattern, since verifying script comments
   are scrubbed is precisely their job. Every non-ASCII character remaining in `src/` +
   `astro.config.mjs` is an em-dash, an arrow, or a `HUMAN COPY` placeholder.
2. T-28 still owes the full a11y + 375/390/430px visual sweep, plus re-resolution of F-3/F-4/F-5.
   This pass confirmed the ≥44px targets **in CSS**; it did not measure rendered pixels.

---

## Not tested, and why

1. **Any browser.** No browser or headless driver was available, so rendered *output* (HTML + scoped
   CSS) was verified, not rendered *pixels*. Not exercised: 375/390/430px viewports,
   horizontal-scroll absence, computed hit areas, real focus-ring contrast, `@font-face` glyph
   coverage in a renderer, Lighthouse, axe/WCAG audit, screen-reader announcement order. Static
   evidence supports each; T-28 owns the sweep.
2. **Negative/mutation paths.** Whether the GitHub/LinkedIn chips disappear when the frontmatter
   URLs are removed, and whether the About chip disappears when `about.md` is unregistered, both
   require writing a fixture — out of bounds for a read-only pass. The guarding code is
   byte-unchanged by T-26 and the `.filter((s): s is SectionEntry => Boolean(s))` type guard is
   intact, which is the strongest claim available without mutation.
3. **Non-default `PUBLIC_SITE_URL` build.** Skipped (it rewrites `dist/`). Canonical/sitemap/robots
   all derive from `SITE_URL` in code T-26 did not touch.
4. **Cloudflare Pages behaviour.** `_headers` semantics, preview-host `noindex`, production-branch
   detection — no live project. T-19's scope.
5. **`npm run fonts:subset`.** Deliberately not run: it writes font binaries, and
   `scripts/subset-fonts.mjs:31` still lists `resume/index.html` as a sweep input (T-27's change).

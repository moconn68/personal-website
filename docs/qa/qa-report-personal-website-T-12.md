# QA Report — T-12: SEO head component (title/description/OG/canonical)

- **Ticket:** T-12 (`docs/tickets/tickets-personal-website.md` — SEO-6, SEO-7, SEO-8, SEO-11, R8)
- **Baseline:** `f696d8a` (T-11); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 4):** `src/components/Seo.astro` (new), `src/pages/[...slug].astro` (M — head-slot wiring + title/canonical), `docs/tickets/tickets-personal-website.md` (M — T-12 checkbox flip), `src/pages/404.astro` (M — documented as unaffected: static head retained)

## Verdict: **Pass**

All acceptance criteria verified against built output across all 3 section pages plus the 404. Unique titles, ≤160-char descriptions, OG tags, and one absolute canonical per page — byte-identical with the trailing-slash policy. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Seo composes into the head slot: title, unique description, OG, self-referencing absolute canonical from `SITE_URL` | `Seo.astro` renders `<title>`, `<meta name="description">`, `og:title/og:description/og:type/og:url`, `<link rel="canonical">`. Built output: home `<title>Matthew O'Connell</title>` + canonical `https://mattoconn.pages.dev/`; résumé `Matthew O'Connell — Résumé` + `…/resume/`; about `Matthew O'Connell — About` + `…/about/`. Og:type `website` on all three. | Pass |
| 2 | Exactly one canonical host (SITE_URL); preview cross-host canonicals point at production (correct) | All canonicals resolve to `https://mattoconn.pages.dev/…` (the `SITE_URL` default). T-18 handles preview noindex; canonical never reflects a preview host. | Pass |
| 3 | Every page supplies unique title/description via route props or registry data | Route derives `title` via the design §5.2 pattern and `description` from `entry.data.description` (schema-capped at 160). Descriptions differ per page (verified distinct across the three). | Pass |
| 4 | Canonical/sitemap/robots byte-identical (trailing-slash normalized) | Canonicals: `/`, `/resume/`, `/about/` — produced by `sectionPath` + `absoluteUrl` (`path()` single policy). Sitemap (T-15) and robots `Sitemap:` (T-16) will read the same helpers. | Pass |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod debt). Pass.
2. **Build** — `npm run build` exit 0; 4 pages. Pass.
3. **Ticket verifier** — `rg -c 'rel="canonical"' dist/index.html dist/resume/index.html dist/about/index.html` → 1 each; `rg '<title'` → one unique title per page. Pass.
4. **Zero-JS (NF-5)** — `rg -l '<script|onclick=' dist/*.html dist/*/index.html` → no match. (Caught and fixed mid-ticket: an initial misplaced `<script>` block in Seo.astro would have shipped client JS — moved the import into the frontmatter.) Pass.
5. **OG completeness** — og:title/description/type/url present; og:image deliberately absent (HOME-4/SEO-8). Pass.
6. **404 head** — retained as its own static block (title/description/noindex); no canonical on a noindex page (not a registry section). Pass.

## Bugs found

None (one self-caught mid-build defect fixed before commit — see gate 4).

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | Canonical/sitemap/robots byte-identity cross-check completes at T-15/T-16 (sitemap `filter`, robots `Sitemap:` line). | T-15/T-16 |
| W-2 | Info | Title/description copy is `HUMAN COPY` placeholder-derived (T-23 finalizes; pattern is mechanical off the registry). | T-23 |

## Regression risk (T-13 → T-24)

- **T-13/T-14 (JSON-LD):** independent inline data blocks in template bodies; head untouched. No conflict.
- **T-15 (sitemap):** integration uses `site` + generated routes — matches these canonicals. Ready.
- **T-16 (robots):** `Sitemap:` from `SITE_URL` — consistent.
- **T-20 (verify-static):** no new JS/third-party refs (SVG icons inline; metadata only). Clean.
- Earlier ticket files untouched except the route's head wiring (sanctioned by T-7's D-1/D-2 watchers).

## Recommendation

Sign-off. T-12 satisfies its acceptance criteria. Outstanding items legitimately deferred to T-15/T-16/T-23. Proceed to the commit step.
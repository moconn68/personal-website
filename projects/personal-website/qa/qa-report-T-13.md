# QA Report — T-13: Person JSON-LD on Home

- **Ticket:** T-13 (`projects/personal-website/tickets/tickets.md` — HOME-6, SEO-1, NF-4, NF-5 boundary)
- **Baseline:** `48904af` (T-12); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 4):** `src/config/person.ts` (new), `src/components/JsonLdPerson.astro` (new), `src/templates/HomeSection.astro` (M — top-of-body data block), `projects/personal-website/tickets/tickets.md` (M — T-13 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified against source and built output. JSON-LD block is valid JSON, inline, at the top of the Home section body. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Home template body (top of section markup in `<main>`) has `<script type="application/ld+json" is:inline>` Person node | `HomeSection.astro` renders `<JsonLdPerson />` as the first child of the `<section>` (inside `<main>`), per design §8.3 (body placement: crawlers parse JSON-LD anywhere; head-placement would break REG-6). `JsonLdPerson.astro` emits `<script type="application/ld+json" is:inline set:html={JSON.stringify(ld)} />`. Built output: `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Matthew O'Connell","url":"https://mattoconn.pages.dev","jobTitle":"HUMAN COPY — job title","sameAs":["https://github.com/","https://www.linkedin.com/"]}</script>`. | Pass |
| 2 | Facts read from the single shared module `src/config/person.ts` (registry name/url/sameAs; jobTitle = HUMAN COPY constant) | `getPersonData()` derives name/url/sameAs from the registry home entry + `SITE_URL`; `JOB_TITLE` is a marked constant. Home and Résumé (T-14) share it — no duplicated authoring. | Pass |
| 3 | Valid JSON, inline, no external fetch | `node -e JSON.parse` of the extracted block → `object` with `@type: Person`, name, url, 2 sameAs entries. `is:inline` guarantees Astro leaves the raw JSON untouched (verified verbatim in output). | Pass |
| 4 | Note for QA: data block, not client JS — T-20 must exempt `type="application/ld+json"` | The block is a data node, not executable; carved exemption recorded for the T-20 scanner spec. | T-20 |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod debt). Pass.
2. **Build** — `npm run build` exit 0; 4 pages. Pass.
3. **Ticket verifier** — `rg -A4 'application/ld\+json' dist/index.html` matches the full block. Pass.
4. **JSON validity** — extracted block `JSON.parse`s cleanly with the exact Person shape from design §8.2. Pass.
5. **Facts hygiene** — `rg 'jobTitle|Matthew' src/config/person.ts` shows the facts are registry-derived + one marked constant; no inventoried biography. Pass.
6. **Zero-JS boundary (NF-5)** — the ld+json block is the ONLY `<script>` in `dist/index.html`; it is a data block (no executable statements). T-20 exemption is the mechanism. Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | `name`/`sameAs`/`jobTitle` are placeholder-derived (HUMAN COPY) — T-23 replaces them; the block re-renders automatically (single facts module). | T-23 |
| W-2 | Info | `Person.url` = `SITE_URL` without trailing slash (schema.org norm; `SITE_URL` normalizes). SameAs URLS are the T-8 placeholder roots until T-23. | T-23 |
| W-3 | Info | T-20's verify-static must treat `<script type="application/ld+json">` as exempt — this ticket's existence is the scanner's boundary case (R5). | T-20 |

## Regression risk (T-14 → T-24)

- **T-14 (ProfilePage JSON-LD):** depends on this ticket; reuses `getPersonData()` + the same body-placement pattern. Ready.
- **T-20 (verify-static):** ld+json exemption exact. Ready.
- **T-21 (QA):** a11y/contrast unaffected (hidden data block). Pass expected.
- Earlier ticket files untouched except Home template (one inserted component). No regression.

## Recommendation

Sign-off. T-13 satisfies its acceptance criteria, including the design §8.3 body-placement deviation (reviewer/QA-sanctioned, documented in the ticket's own deviation). Proceed to T-14.
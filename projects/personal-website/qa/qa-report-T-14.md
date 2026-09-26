# QA Report — T-14: ProfilePage JSON-LD on Résumé

- **Ticket:** T-14 (`projects/personal-website/tickets/tickets.md` — SEO-2, NF-4, NF-5 boundary)
- **Baseline:** `f2229cc` (T-13); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 3):** `src/components/JsonLdProfilePage.astro` (new), `src/templates/ResumeSection.astro` (M — top-of-body data block), `projects/personal-website/tickets/tickets.md` (M — T-14 checkbox flip). `src/config/person.ts` reused, not modified.

## Verdict: **Pass**

All acceptance criteria verified against source and built output. ProfilePage node valid, inline, at the top of the Résumé section body, sharing the single Person facts module. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Résumé template body has `<script type="application/ld+json" is:inline>` ProfilePage node with name, url (résumé canonical), mainEntity → Person — all from shared `person.ts` | `ResumeSection.astro` renders `<JsonLdProfilePage />` as the first child of `<section>` (body placement per design §8.3). Built block: `{"@context":"https://schema.org","@type":"ProfilePage","name":"Matthew O'Connell — Résumé","url":"https://mattoconn.pages.dev/resume/","mainEntity":{"@type":"Person","name":"Matthew O'Connell","url":"https://mattoconn.pages.dev","jobTitle":"HUMAN COPY — job title","sameAs":["https://github.com/","https://www.linkedin.com/"]}}`. | Pass |
| 2 | Valid JSON, inline, no external requests | `JSON.parse` of the extracted block → ProfilePage with the résumé canonical URL and Person mainEntity. No network refs in the block. | Pass |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod debt). Pass.
2. **Build** — `npm run build` exit 0; 4 pages. Pass.
3. **Ticket verifier** — `rg -A4 'application/ld\+json' dist/resume/index.html` matches the full block. Pass.
4. **Facts single-source** — ProfilePage reads `getPersonData()`; the Person node in `mainEntity` mirrors Home's Person facts byte-for-byte (same module). No duplicated facts. Pass.
5. **URL correctness** — `ProfilePage.url` = `absoluteUrl('resume')` → `https://mattoconn.pages.dev/resume/` (canonical, trailing-slash form, identical to the T-12 canonical). Pass.
6. **Zero-JS boundary (NF-5)** — the ld+json block is the only `<script>` in `dist/resume/index.html`; data block exemption flagged for T-20. Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | Facts are placeholder-derived (T-23); ProfilePage re-renders automatically from the single facts module. | T-23 |
| W-2 | Info | `mainEntity` Person duplicates the Home Person facts by design (same shape, same module — both call `getPersonData()`); guaranteed-consistent because there is one source. | — |

## Regression risk (T-15 → T-24)

- **T-20 (verify-static):** ld+json exemption covers both home + résumé pages. Ready.
- **T-21 (QA):** data blocks invisible to a11y/contrast. Pass expected.
- Early tickets untouched except Résumé template (one inserted component). No regression.

## Recommendation

Sign-off. T-14 satisfies its acceptance criteria and design §8.3. Proceed to T-15.
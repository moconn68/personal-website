# QA Report — T-3: getSections() helper + typed section content skeletons

- **Slug:** personal-website
- **T-ID:** T-3
- **QA date:** 2026-09-22
- **Queue position:** MS-1 (Foundation & Registry), rank 3 of 4
- **Verdict:** **PASS**
- **Source-of-truth artifacts checked:** PRD v1.3 §5.3 (ABT-1..4) §5.4 (REG-2, REG-6); tech design §4.1–4.5 (normative §4.4 skeleton module), §11.3; ticket T-3 AC (a)–(d); working-tree diff vs last T-ID commit (`9dda099`).

---

## 1. Independent verification performed

QA re-derived results from the **real on-disk files + authoritative artifacts**, not from the dev's report. Actual commands run: `npm run build` (exit 0, content synced + schema-validated over all 3 entries; 1 page built), `npx astro check` (0 errors, 0 warnings, 2 pre-existing T-2 `.url()` hints — out of scope), `rg -l 'HUMAN COPY' src/content/sections/` (3 files), `git status --porcelain` (tree contains only the T-3 deliverables + tickets checkbox flip).

Ordering / slug invariant were independently re-derived by parsing the three skeleton files and simulating the §4.4 code: predicted output `home (order 1) → resume (order 2) → about (order 3)`; every `id` ≡ `slug` for all three entries.

## 2. Verification summary (ABCs)

| ID | Requirement | Result |
|---|---|---|
| getSections() helper | `src/config/sections.ts` — fail-fast `id ≡ slug` loop, then `[...all].sort((a,b) => a.data.order - b.data.order)` ascending on a copy; re-exports `TEMPLATES`/`templateToComponentName`/`type Template`; `sectionPath()` (home → `/`, others → `/{slug}/`); typed `SectionEntry`. Matches tech design §4.4 verbatim | **PASS** |
| REG-2 registry health | All 3 skeleton files present in `src/content/sections/` with valid frontmatter per schema | **PASS** |
| getSections() returns exactly 3, ordered home → résumé → about | Verified by independent re-derivation from real files (no consumer yet — first consumers are T-5/T-7, per design §11.3 sanitized "build-time check page" removed) | **PASS** |
| Skeletons typed & id≡slug invariant | `home.md`, `resume.md`, `about.md` — slug/title/navLabel/order/template values correct; filename == slug for all three | **PASS** |

**Content discipline (normative — devs never invent facts):**

| Entry | slug/title/order/template | Identity markers |
|---|---|---|
| `home.md` | home / "Matthew O'Connell" / 1 / home | body + description + role/stack lines all `HUMAN COPY`; `github`/`linkedin` → root URLs + `# HUMAN COPY` YAML comments (marked for T-23 replacement) |
| `resume.md` | resume / "Matthew O'Connell — Résumé" / 2 / resume | description = `HUMAN COPY` marker; no body (skeleton) |
| `about.md` | about / "Matthew O'Connell — About" / 3 / about | description + 4 story paragraphs all `HUMAN COPY` markers; NO invented hobbies/bio facts |

- **Zero invented biographical facts** — every identity-adjacent field carries a `HUMAN COPY` placeholder; owner copy deferred to T-23 (ABT-1..3, HOME-1..3). ✓
- **Search/title discipline:** description fields kept ≤160 chars (82/74/60); title pattern consistent with SEO-6 registry pattern (home.title alone; others `{home.title} — {entry.title}`). ✓

## 3. Edge cases / regression checks

| Edge case | Result |
|---|---|
| id ≠ slug (filename/slug mismatch) | `getSections()` throws fail-fast with explicit message (enforced at the helper level per §4.3) — **PASS** |
| Duplicate/out-of-enum `template` | Closed enum (T-2) rejects at schema boundary — pre-existing, unchanged |
| `description` ≤160 | All 3 ≤160 — **PASS** |
| Zero client JS / JSON-LD exemption | No functional JS shipped; JSON-LD data blocks exempt (T-13) — N/A at T-3 |
| Regression risk to T-1/T-2 (scaffold/schema) | **None** — no changes to `content.config.ts`/`templates.ts`/config/package; build + astro check clean |

## 4. Findings / caveats

- None blocking. **Non-blocking notes carried forward:**
  1. The §4.4 skeleton files use YAML `# HUMAN COPY` comments (not parsed values) to carry the placeholder marker next to URL-constrained fields — verified they never leak into frontmatter values. JSON-LD `sameAs`/profile-page facts remain owner-blocked via T-13/T-23.
  2. The build-time ordering verification used a throwaway check page that was removed afterward; the final tree is clean (no test artifact, per design §11.3 allowance that this is a log-line/T-3-verification, not a committed test).
  3. `npx astro check` reports 2 hints from T-2's `content.config.ts` `.url()` usage — pre-existing, out of T-3 scope; noted for the T-23/T-20 maintenance pass.

## 5. Checklist

- [x] getSections() matches design §4.4 (returns sorted-by-`order` registry, fail-fast id≡slug)
- [x] getSections() returns exactly 3 entries in `home → résumé → about` order (verified via temp build check + independent re-derivation; temp artifact removed)
- [x] Three skeleton content files (home/resume/about) with `HUMAN COPY` placeholders, ≤160 descriptions, closed-enum templates
- [x] Zero invented biographical facts; no changes to T-1/T-2 files
- [x] `npm run build` exit 0; `astro check` 0 errors
- [x] Verify/checkbox flipped: `- [x]` on T-3 in tickets

## 6. Recommendation

**Approve T-3 for commit.** Compliance with RED-2/REG-6, ABT-1..3, HOME-1..3; design-conformant and regression-clean. Blockers: none.

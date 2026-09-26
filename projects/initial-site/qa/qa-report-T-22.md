# QA Report — T-22: Extensibility manual verification (stub "Now" section)

- **Ticket:** T-22 (`projects/initial-site/tickets/tickets.md` — US-9, REG-6, REG-7; design §4.2 pre-staged enum)
- **Baseline:** `e30e5d0` (T-21); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (final state):** none durable — stub created + reverted (`src/content/sections/now.md`, `src/templates/NowSection.astro` removed). `projects/initial-site/tickets/tickets.md` (M — T-22 checkbox flip) + this report committed as the record.
- **Method:** add stub → check/build → assert nav+sitemap+route+gate → revert → rebuild → assert pristine.

## Verdict: **Pass**

The REG-6 extensibility promise is proven end-to-end: one content file + one template component is sufficient to ship a fifth page, with **zero** changes to the six forbidden invariant files and a green build/verify gate. Stub reverted; tree clean.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Register stub via `now.md` (slug now, order 4, template now) + `NowSection.astro` picked up by T-7 glob dispatch; **no enum/schema edit** | Created both files. `npm run build` succeeded with the `now` template acquired automatically via the glob (no `TEMPLATES`/schema change — §4.2 pre-includes `now`). | Pass |
| 2 | Build succeeds; stub appears in nav (Nav.astro untouched) and sitemap (configs untouched) | `dist/now/` built (5th route, `/now/` 200 on preview); nav on every page renders `href="/now/"` (trailing-slash form per `sectionPath`); sitemap gains `<loc>…/now/</loc>`. | Pass |
| 3 | `git diff` zero changes to the six invariant files | Verified twice (stub active and after revert): no diff on `Nav.astro`, `BaseLayout.astro`, `[...slug].astro`, `templates.ts`, `content.config.ts`, `astro.config.mjs`. | Pass |
| 4 | Revert stub; leave tree clean | Both stub files removed; rebuild → `dist/` back to 4 pages + 2 sitemaps; `git status` shows no residual changes; verify gate OK (4 HTML). | Pass |

## Validation gates (all executed)

1. **Typecheck** — `astro check` exit 0 (hints unchanged, pre-existing zod debt). Pass.
2. **Build with stub** — exit 0; `[gen-headers]` still emits `_headers`. Pass.
3. **Verifier (stub active)** — `dist/now/` exists; nav shows `/now/`; `rg '/now' dist/sitemap-0.xml` found; `curl /now/` → 200; `npm run verify` OK against **5** HTML files (stub included; note the extra CSS file in that run is a benign artifact of the 5th scoped style — reverted build returns to the inlined 0-CSS shape). Pass.
4. **Verifier (post-revert)** — `git status` clean (stub files gone); dist back to 4 pages; verify OK (4 HTML).
5. **Invariant diff** — zero modified files in the six-file set in both phases. Pass.

## Notes / watchers

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | The ticket's literal verifier `rg 'href="/now"'` matches nothing because nav hrefs are trailing-slash form `/now/` (R8 policy). The intent — nav link present — is verified with `/now/`. Not a defect. | — |
| W-2 | Info | The 5-page build momentarily emitted one external CSS asset (first scoped-style granularity change). Revert restored the 4-page inline-CSS shape; neither violates the gate (third-party scan passed on both). | — |
| W-3 | Info | T-23 copy edits won't touch any section file other than `home.md`/`about.md`; this ticket's proof means a future `/now/` (or `/projects/`, `/blog/`, `/uses/`) needs only the two-file pattern. Ready. | T-23 |

## Regression risk (T-23 → T-24)

- **T-23:** landing copy runtime — unaffected by the stub (reverted). But `fonts:subset` may need re-run if new copy introduces glyphs outside the 96-char set. Ready.
- **T-24:** `/resume.pdf` file addition — presence/gate unaffected. Ready.
- Six invariant files byte-identical to T-21 baseline. No regression.

## Recommendation

Sign-off. T-22 satisfies all acceptance criteria; the extensibility claim is demonstrated and reverted cleanly. Proceed to T-23 (HUMAN-BLOCKED).
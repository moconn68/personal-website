# QA Report — T-15: Sitemap generation via @astrojs/sitemap

- **Ticket:** T-15 (`projects/initial-site/tickets/tickets.md` — SEO-3, REG-5, US-11, HOME-7, R8)
- **Baseline:** `e442fad` (T-14); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 2):** `astro.config.mjs` (M — sitemap integration + explicit 404 filter), `projects/initial-site/tickets/tickets.md` (M — T-15 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified against built output. Sitemap contains exactly `https://mattoconn.pages.dev/`, `/about/`, `/resume/` — byte-identical with nav/canonical (single trailing-slash policy). Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `@astrojs/sitemap` enabled with `site: SITE_URL`, producing build-time `sitemap-index.xml` + `sitemap-0.xml` | `astro.config.mjs` adds the integration (site already set from T-4). Build log: `sitemap-index.xml created at dist`; both files present in `dist/`. | Pass |
| 2 | Sitemap contains exactly the three registered-section URLs (`/`, `/resume/`, `/about/`) — derived from registry routes, no manual list | `rg '<loc>' dist/sitemap-0.xml` → exactly `…dev/`, `…dev/about/`, `…dev/resume/` (3 entries; the registry routes T-7 generates). No hand-written URL list. | Pass |
| 3 | `/404.html` and sitemap/robots endpoints excluded via `filter` | Integration auto-skips status pages (404/500, verified in `@astrojs/sitemap` internals) + explicit `filter` keeps the 404 exclusion visible (pathnames `/404/` and `/404`). `sitemap-index.xml` references only `sitemap-0.xml`; robots not a crawlable page. | Pass |
| 4 | Sitemap URLs use the same trailing-slash policy as canonical links | `<loc>https://mattoconn.pages.dev/resume/` — trailing-slash form identical to the T-12 canonicals (`/resume/`, `/about/`, `/`). | Pass |

## Validation gates (all executed)

1. **Typecheck-safe config** — `astro.config.mjs` is `@ts-check`ed; no type errors surfaced. `npm run build` exit 0. Pass.
2. **Build** — exit 0; sitemap emitted; 4 pages. Pass.
3. **Ticket verifier** — `rg -o '<loc>[^<]+' dist/sitemap-0.xml` → exactly the three section URLs. Pass.
4. **Consistency (R8)** — sitemap locs vs canonical hrefs vs nav hrefs share `sectionPath`/`path()` policy; all `/`, `/resume/`, `/about/`. Pass.
5. **Filter correctness** — `404` appears nowhere in `dist/sitemap-*.xml`. Pass.
6. **Dep-injection** — `PUBLIC_SITE_URL` override would flow through `site` (Node reads `process.env`), so sitemap URLs track the canonical host; not re-verified with a custom host (T-4 already proved the plumbing; T-18 preview-simulation build at that ticket re-checks output content). Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | T-16's robots `Sitemap:` line must target `sitemap-index.xml` (the integration's index name) — matches this output. | T-16 |
| W-2 | Info | T-22's stub Now section must appear in the sitemap with zero config changes (registry-route mechanism proof). | T-22 |
| W-3 | Info | Preview-host builds emit preview-host absolute URLs inside the sitemap; that is fine because the noindex `_headers` (T-18) de-prioritizes preview hosts and canonical URLs still target production. No action. | — |

## Regression risk (T-16 → T-24)

- **T-16 (robots):** `Sitemap: {SITE_URL}/sitemap-index.xml` — name confirmed. Ready.
- **T-18 (_headers):** no interaction (separate output file). Ready.
- **T-20 (verify-static):** sitemap files are XML (not HTML) — scanner's presence-assert list includes them. Ready.
- **T-22 (extensibility):** asserts `/now` appears in `sitemap-0.xml`. Ready.
- Earlier ticket files untouched (only astro.config.mjs extended). No regression.

## Recommendation

Sign-off. T-15 satisfies its acceptance criteria. Outstanding items legitimately deferred to T-16/T-22. Proceed to T-16.
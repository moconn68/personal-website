# QA Report — T-25: Delete résumé section from the registry (content file, template, enum value)

- **Ticket:** T-25 (`projects/initial-site/tickets/tickets.md` lines 66, 430–463 — RES-X1, REG-2, REG-7; PRD v1.5 OQ-7; design §4.1–§4.2, §4.4, §5.1, lines 211/311/712/820)
- **Baseline:** `dff15d5` · **Under test:** uncommitted working tree (+ staged deletions)
- **QA date:** 2026-09-26 · **Platform:** darwin
- **Changed paths (5):** `src/content/sections/resume.md` (D), `src/templates/ResumeSection.astro` (D), `src/config/templates.ts` (M), `src/content/sections/about.md` (M), `projects/initial-site/tickets/tickets.md` (M — T-25 checkbox flip)

## Verdict: **Pass**

Every T-25 acceptance criterion is met and the closed-enum guard is empirically proven (the build fails with the exact six-value Zod enum error). The registry did all the work: one deleted content file removed the route, the nav entry, the sitemap URL, and the canonical, with zero edits to `sections.ts`, any page, or the sitemap config.

`npm run verify` is **red at this rank for exactly one reason** — the T-27-owned résumé presence-assert — and is green on its other two checks, which confirms the gate is not silently tolerating a broken state. No blocking findings. Two caveats, both assigned downstream, neither introduced by T-25.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `resume.md` deleted (`git rm`); route, nav entry, and sitemap URL disappear with **no** route/nav/sitemap code edits | `git status` → `D  src/content/sections/resume.md` (staged, i.e. `git rm`). Build emits `/index.html`, `/about/index.html`, `/404.html` — no `/resume/`. `Nav.astro`, `[...slug].astro`, `astro.config.mjs` all absent from the diff. | Pass |
| 2 | `ResumeSection.astro` deleted (`git rm`), in the same commit as the content file | `git status` → `D  src/templates/ResumeSection.astro` (staged). Both deletions sit in the index together; see *Atomicity* below. | Pass |
| 3 | `'resume'` removed from `TEMPLATES`, leaving `['home','about','projects','blog','now','uses']`; no replacement for the freed slot | `src/config/templates.ts:3` parses to exactly those 6 values (`count: 6`), byte-matching design §4.1's "Exact enum value set for v1.5". `src/content/sections/` holds only `about.md`/`home.md`; `src/templates/` only `AboutSection.astro`/`HomeSection.astro`. No stub, placeholder, or `hidden` entry. | Pass |
| 4 | `templateToComponentName` JSDoc updated — comment only, function body untouched | `diff` of the `export function` block to EOF against baseline: **byte-identical**. Only the JSDoc line and the enum line differ. The JSDoc byte-matches design §4.1's annotated snippet. | Pass |
| 5 | `about.md` frontmatter `order: 3` → `order: 2`; nav order gap-free | **Exactly 1 byte differs** (offset 52), file length unchanged (349 → 349). Surviving `order` values = `{1: home, 2: about}` — contiguous from 1, no duplicates, no gap. | Pass |
| 6 | Closed-enum negative test: a `template: resume` content file must now fail the build | Executed twice (dev + QA independently) using `git show dff15d5:src/content/sections/resume.md` as the fixture. Build **exit 1**, `template: Invalid option: expected one of "home"\|"about"\|"projects"\|"blog"\|"now"\|"uses"`. Fixture removed; tree clean; rebuild exit 0. Verbatim output below. | Pass |
| 7 | `src/config/sections.ts` needs no change — confirm rather than edit | Absent from the diff; `git diff HEAD -- src/config/sections.ts` → empty. Derives entirely from `getCollection('sections')`; only `'home'` is special-cased for the `/` path mapping. | Pass |

## Atomicity of the deletion pair

Tech design §5.1 and `src/pages/[...slug].astro:44-47` implement the guard as *"a **registered section** whose template component is **missing** fails the build"*. The guard is **directional**, which matters for how the invariant should be stated:

| Intermediate state | Builds? | Why |
|---|---|---|
| `resume.md` deleted, `ResumeSection.astro` kept | ✅ builds | The glob still resolves the module; nothing dispatches it. An unused glob match is not an error. |
| `ResumeSection.astro` deleted, `resume.md` kept | ❌ fails | `resume` is still registered → `templates['../templates/ResumeSection.astro']` is `undefined` → `throw`. |

So the true invariant is *"the content file must never outlive its template"*, not that the two are symmetrically inseparable. The dangerous ordering is unreachable from the committed state, and both deletions land in one atomic commit. Independently confirmed: Vite's build-time module-graph checking is off in this config, so an orphaned `.astro` component would not fail the build — the content-file deletion is what actually removes the surface, which reinforces that the single-commit landing is the only thing guarding §5.1's intent.

## Validation gates (all executed)

1. **Clean build** — `npm run build` → exit 0, 3 pages + `robots.txt` + 2 sitemaps. Pass.
2. **Typecheck** — `npx astro check` → `0 errors, 0 warnings, 3 hints`. All 3 hints are pre-existing and live in files absent from this diff (`src/content.config.ts` ×2 deprecated `z.string().url()`, `scripts/subset-fonts.mjs` unused `readdirSync`). Pass.
3. **Surface removed** — `test ! -e dist/resume/index.html` passes; `find dist -type d -name '*resume*'` empty; `find dist -type f -name '*resume*'` empty. Asserted on a **wiped** `dist/` + `.astro/` full rebuild first, so nothing rode on a stale artifact. Pass.
4. **Nav** — `dist/index.html` and `dist/about/index.html` both show exactly `Home` (`/`) + `About` (`/about/`), in order, with `class="active" aria-current="page"` on the current page. `rg -i 'resume' dist/ --glob '*.html'` → **zero matches**. Pass.
5. **Sitemap** — exactly 2 `<loc>`: `https://mattoconn.pages.dev/` and `https://mattoconn.pages.dev/about/`. Matches design line 712. Pass.
6. **URL consistency** — canonical hrefs on both pages byte-match the sitemap locs; `robots.txt` keeps `Sitemap: …/sitemap-index.xml`, `Disallow` count `0`, `sitemap-index.xml` → `sitemap-0.xml` chain intact. Pass.
7. **Enum closure (runtime)** — no `resume` substring anywhere in `templates.ts`; the only `ResumeSection` mention left in `src/` is a CSS comment at `404.astro:77` (T-26). The four dormant values remain valid types: `tsc --noEmit --strict` on a scratch file accepted all 6 and rejected both `'resume'` and `'bogus'`; `templateToComponentName` maps to `HomeSection, AboutSection, ProjectsSection, BlogSection, NowSection, UsesSection`. Pass.
8. **Content integrity** — `about.md` byte-identical apart from the single `order` byte; all 5 `HUMAN COPY` markers and all 4 paragraphs verbatim; no invented copy. Pass.
9. **Negative enum test** — see verbatim output below. Pass.
10. **Zero-JS** — the only `<script>` in all of `dist/` is `type="application/ld+json"`; no `.js`/`.mjs` files emitted; zero inline `on*=` handlers. Pass.
11. **No third-party** — only hosts in `dist/` are `mattoconn.pages.dev` (canonical/OG), `github.com` + `www.linkedin.com` (outbound `<a>` — the documented HOME-3 exception), and `schema.org` (JSON-LD `@context`, never fetched). Fonts self-hosted from `/_astro/ibm-plex-sans-*.woff2`. Pass.
12. **Person JSON-LD survives (RES-X4 forward-check)** — exactly 1 JSON-LD block on Home: `@type: Person`, `name`, `jobTitle`, `sameAs`, `url`. **No `ProfilePage` anywhere in `dist/`.** Pass.
13. **404 intact** — `dist/404.html` has `<meta name="robots" content="noindex">`, title, and `<h1>Page not found</h1>`. Pass.
14. **`npm run verify` red for one reason only** — `FAIL résumé download anchor missing at dist/resume/index.html`, `PASS third-party scan`, `PASS presence asserts`, exit 1. Sole source `scripts/verify-static.mjs:153`, confirmed unmodified. Pass (expected-red at this rank).

Consolidated programmatic sweep: **27/27 PASS, 0 FAIL**, re-run on the fresh clean build.

## Negative test — verbatim output

Fixture = exact copy of the retired file (`git show dff15d5:src/content/sections/resume.md`), frontmatter `template: resume`:

```
$ npm run build
> astro build && node scripts/gen-headers.mjs

[content] Syncing content
[InvalidContentEntryDataError] sections → resume data does not match collection schema.

  template: Invalid option: expected one of "home"|"about"|"projects"|"blog"|"now"|"uses"

  Location:
    …/src/content/sections/resume.md:0:0
  Stack trace:
    at getEntryData (…/astro/dist/content/utils.js:126:9)
    at async eval (…/astro/dist/content/loaders/glob.js:224:13)
=== EXIT CODE: 1 ===
```

The error names **exactly the six allowed values**, proving the guard is the *narrowed* enum and not a generic schema rejection. The failed build does not partially rewrite `dist/` (it fails fast at content sync, before any page emit). Fixture removed; `git status` returned to the as-found state; subsequent rebuild exit 0.

## Findings

**No blocking findings.**

| Sev | Finding | Owner |
|---|---|---|
| **Caveat** | `dist/_headers` still carries the `/resume.pdf` cache rule for a file that does not exist, violating PRD **RES-X3** in built output. Not introduced by T-25. | **T-27** |
| **Caveat** | `npm run verify` is **RED (exit 1)** at this rank — CI cannot be trusted green until T-27 replaces `verify-static.mjs:153`. Correct at T-25; recorded so red CI is not later mistaken for a regression. | **T-27** |
| **Observation** | `src/components/JsonLdProfilePage.astro:16` still computes `url: absoluteUrl('resume')`. Harmless today (zero `ProfilePage` in `dist/`, because its only consumer was deleted) but it is one re-registration away from re-emitting a node pointing at a dead URL. | **T-26** |
| **Observation** | `src/templates/HomeSection.astro:26,31` — `resumeEntry` is now permanently `undefined`; the pre-existing `.filter(Boolean)` drops it (Home hrefs: `#main`, `/`, `/about/`, GitHub, LinkedIn, canonical — no `/resume`). Dead code, no behavioural risk. | **T-26** |
| **Observation** | `scripts/subset-fonts.mjs:13` unused-`readdirSync` hint and its line-31 sweep of the now-nonexistent `resume/index.html`; silently no-ops via its `try/catch`. | **T-27** |
| **Observation** | Vite module-graph checking is off, so an orphaned `.astro` component would not fail the build. Pre-existing config; explains why the content-file deletion is the operative one. | Pre-existing |

## Regression risk (T-26 → T-28)

- **T-26 (page-surface residue) — medium risk, well scoped.** Highest-value item: `JsonLdProfilePage.astro` is now an orphan carrying a live `absoluteUrl('resume')` payload, and nothing asserts its absence. Its deletion is currently the only thing preventing a `ProfilePage` node in `dist/`. Also note `.btn-download` is still the 404's real token (2 hits in `dist/404.html`) — this build is the baseline the `.btn-primary` rebase must reproduce byte-identically apart from the class name. T-26's real exit criterion is `rg -i resume src/` returning empty (the `404.astro:77` mention is a comment).
- **T-27 (script residue) — highest risk, because CI is red.** Per design, the old positive assert must be deleted **and** the negative residue asserts added **together**; shipping only one direction leaves either a red gate or a gate that no longer catches a resurrected résumé. This build is a clean baseline: `dist/` contains no `resume` string in any HTML and no `ProfilePage`, so the negative asserts should pass immediately — except the `_headers` one, which needs the `gen-headers.mjs` fix first. `gen-headers.mjs` must also emit **nothing at all** on a production build, not an empty file (§10.1).
- **T-28 (regression + a11y) — low correctness risk, real process risk.** Everything T-28 re-asserts already holds on this output. Its genuinely new work is the a11y + 375/390/430px sweep on the reduced site, where one criterion is now **unexercised rather than satisfied**: `/resume/` was the only page with a `.btn-download` primary action and the only one exercising the 48px min-height touch target, so T-28 must confirm at least one remaining control still meets 48×48px. Also note `jobTitle` in the Person JSON-LD is still the literal `HUMAN COPY — job title` (T-23 human-blocked, pre-existing, not a T-25 regression).
- **Overall chain risk: low.** The registry architecture did exactly what it was designed to do.

## Cleanup

- Negative-test fixture removed; no stray files (`git status --short --untracked-files=all` clean).
- `dist/` and `.astro/` wiped and fully rebuilt before the final assertion sweep, then left in the final good state (exit 0).

```
 M projects/initial-site/tickets/tickets.md
 M src/config/templates.ts
 M src/content/sections/about.md
D  src/content/sections/resume.md
D  src/templates/ResumeSection.astro
```

Byte-identical to the as-found state. The Orchestrator stages all five paths plus this report in a single atomic commit — a partial commit would leave `'resume'` in the closed enum and `about.md` at a gapped `order: 3`, contradicting the ticket's own acceptance criteria.

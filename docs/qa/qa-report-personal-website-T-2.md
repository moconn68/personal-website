# QA Report — T-2: Sections content schema (glob loader + Zod, closed template enum)

**Project:** personal-website (Astro 7.3.3) · **Commit under test:** `fb871c4` · **Date:** 2026-09-22
**QA scope:** Independent validation of shipped code; no code-review report consulted; no source files modified (temp fixtures via bash only, all reverted).

## Verdict: PASS

All five acceptance criteria verified. Three required negative tests (`template: bogus`, `template: error`, description >160) each fail the build with the expected schema errors; `npm run check` is clean (0 errors / 0 warnings, 2 hints); the positive path (valid content, incl. exactly-160-char description) builds successfully; regression surface (T-1 scaffold, deps, config files) untouched; the temporary fixtures were fully reverted and the working tree is clean.

## Acceptance Criteria — Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| AC-1 | `src/content.config.ts` defines `sections` collection via Content Layer API (glob loader `**/*.md`, base `./src/content/sections`) + Zod schema | **PASS** | Source inspection §4.3 byte-match; runtime proof: loader discovered + validated all 5 temp fixtures during builds |
| AC-2 | `src/config/templates.ts` with `TEMPLATES` const + `Template` type + `templateToComponentName()` | **PASS** | Source inspection §4.1 byte-match; executed module in Node: 7 values exactly, `error` absent, mapper `home→HomeSection … uses→UsesSection` all 7 correct |
| AC-3 | Zod schema fields exactly as listed (`slug` regex, `title`/`navLabel` min(1), `order` int positive, `template` enum, `description` min(1) max(160), optional `.url()` `github`/`linkedin`) | **PASS** | Byte-for-byte match vs design §4.3. No field drift found |
| AC-4 | Closed enum verified by temporary negative test(s), then reverted | **PASS** | `template: bogus` → exit 1; `template: error` → exit 1 (both list exactly `"home"|"resume"|"about"|"projects"|"blog"|"now"|"uses"`); fixtures deleted |
| AC-5 | `npm run check` clean; negative test → build fails, then revert | **PASS** | `npm run check` exit 0 (0 err / 0 warn / 2 hints); all negative builds exit 1; post-revert rebuild exit 0; `git status` clean |

## E2E Test Scenarios

| Scenario | Steps | Expected | Actual | Status |
|---|---|---|---|---|
| Baseline static build | `npm run build` on clean tree | Exit 0; `dist/index.html`; glob WARN tolerated | Exit 0, 1 page, `[WARN] glob-loader base dir missing` (expected at T-2 rank) | **PASS** |
| Type/schema static analysis | `npm run check` | 0 errors/0 warnings | Exit 0; 2 hints (zod v4 `.url()` deprecation) | **PASS** |
| Valid content accepted | `valid-edge.md` (home template, both URL fields, description exactly 160) → build | Exit 0 | Exit 0 (max(160) inclusive, URL fields parse) | **PASS** |
| Closed enum — unbudgeted value | `bogus.md` with `template: bogus` → build | Fail, list 7 options | exit 1, `Invalid option: expected one of "home"|…|"uses"`; reverted | **PASS** |
| Closed enum — `error` excluded | `error-test.md` with `template: error` → build | Fail; `error` not allowed | exit 1, `error` absent from allowed list; reverted | **PASS** |
| Description ≤160 boundary | `long-desc.md` with 180-char description → build | Fail | exit 1, `expected string to have <=160 characters`; reverted | **PASS** |
| Post-revert rebuild | Re-run build after fixtures deleted | Exit 0; tree clean | Exit 0; only expected glob WARN; `git status` clean | **PASS** |

## Edge Case Matrix

| Boundary / Invalid input | Result |
|---|---|
| `template: bogus` (non-enum) | Rejected — exit 1, 7 options listed |
| `template: error` (excluded design value) | Rejected — `error` not in allowed list |
| `description` 180 chars (>160) | Rejected — `expected string to have <=160 characters` |
| `description` exactly 160 chars | Accepted (boundary inclusive) |
| `title: ""` (min(1)) | Rejected — `expected string to have >=1 characters` |
| `slug: "Bad Slug!"` (regex) | Rejected — custom message |
| `order: 2.5` (non-integer) | Rejected — `Expected type "int"` |
| `order: 0` (positive() boundary) | Rejected — `expected number to be >0` |
| `github: "https://github.com/"` (valid URL) | Accepted |
| Empty collection (base dir absent) | Accepted — glob WARN only, correct at T-2 rank (dir created in T-3) |

## Bugs Found

**None.** All failures observed were the intended closed-enum / boundary rejections.

## Regression Assessment

| Concern | Result |
|---|---|
| `dist/index.html` renders (T-1 scaffold) | **PASS** — post-test build emits `/index.html` |
| `@astrojs/sitemap` (`^3.7.4`), `zod` (`^4.6.5`) still installed | **PASS** |
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, lockfile untouched | **PASS** — no diff since T-1 |
| Build time (DEP-4 <60s) | **PASS** — ~0.3–0.5s |

## Caveats / Non-Blocking Observations

1. **Glob-loader base-dir WARN (expected).** `[WARN] [glob-loader] The base directory ".../src/content/sections/" does not exist.` on every build/check — the documented expected state at T-2 rank; T-3 creates the directory (re-verify the WARN disappears there).
2. **zod v4 `.url()` deprecation hints.** `z.string().url()` produces 2 ts(6385) hints. Matches normative design §4.3 verbatim; migration to `z.url()` is coordinated future work, not a T-2 deviation.
3. **Trailing newline nit.** Both committed files omit a final newline. Trivial; non-blocking.
4. **Code-reviewer nits (non-blocking, for design-owner awareness):** slug regex permits leading/trailing/double hyphens and numeric slugs (`404`) — harmless at the char-set level (no route collision possible; T-3's id/slug invariant fail-fasts divergence); duplicate `order` values are unenforced (suggest asserting order-uniqueness in T-3's `getSections()`); `z.string().min(1)` accepts whitespace-only strings (harmless given the HUMAN COPY pipeline).

## Final git state

```
On branch main
Your branch is ahead of 'origin/main' by multiple commits.
nothing to commit, working tree clean
```

Commit `fb871c4` contains exactly the two intended T-2 files. All temporary fixtures removed; no untracked files, no working-tree diff. Follow-up doc-commit `07c9a19` marks T-2 complete in the tickets file.

## Recommendation

**SIGN-OFF — approve for merge.** Zero blockers, zero bugs. Schema is byte-faithful to normative design §4.3; enum closed at the exact 7-value set per §4.1/§4.2 (`error` correctly excluded); every required negative test failed with precise, actionable messages.
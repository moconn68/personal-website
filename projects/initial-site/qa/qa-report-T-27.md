# QA Report — T-27: Strip PDF cache rule + résumé asserts from build and verification scripts

- **Project:** `initial-site` · **Work item:** T-27
- **Base commit:** `47c16f5` (T-26) · **Code state at test time:** working tree, uncommitted
- **Size:** M · **PRD:** v1.5 · **Design:** §10.1, §10.2, §11.1 rules 1-4, §11.2, §11.3
- **Requirements exercised:** `RES-X1`, `RES-X3`, `RES-X4`, `SEO-12`, `SEO-5`, `NF-4`, `NF-5`, `DEP-3`
- **QA date:** 2026-09-27 · **Platform:** darwin (Node v24.21.0, npm 11.19.0)
- **Changed paths (4):** `scripts/verify-static.mjs` (M, 163 to 344 lines), `scripts/gen-headers.mjs` (M), `scripts/subset-fonts.mjs` (M), `projects/initial-site/tickets/tickets.md` (M, one character)
- **QA execution:** ~68 discrete checks across 5 harnesses. Read-only with respect to the repo; all mutations confined to the gitignored `dist/` and to `/var/.../T/opencode`. `npm run fonts:subset` was **not** run.

---

## Verdict

**Pass with Caveats.** Sign-off is warranted: zero blocking defects, all 14 acceptance criteria pass with evidence, no regression to T-25 or T-26, and every one of the new asserts was observed to fail when its violation was planted. Three caveats are non-blocking but should be carried into T-19/T-28 rather than left implicit; the most substantive (N-1) is a hole I reproduced end to end, and the code comment that claims to cover it does not.

---

## 1. What I actually ran

| # | Harness | Checks | Purpose |
|---|---|---|---|
| 1 | `npm run build` / `npm run check` / `npm run verify` | 3 | Whole-site integrity, clean baseline |
| 2 | `gen-headers.mjs` behaviour matrix | 5 | Production, `=main`, preview, stale-file removal, standalone-with-no-`dist` |
| 3 | Residue negative + control batch (N1-N10, 3 controls) | 17 | Every new rule-4 assert, plus three deliberate near-miss controls |
| 4 | T-20 regression batch (R0-R4 + 9 controls) | 20 | Rules 1/2/3 not weakened, JSON-LD exemption, design §11.2 procedure |
| 5 | False-positive / forward-compat batch (F1-F13) | 13 | Legitimate future content vs the residue gate |
| 6 | Edge-case batch (E1-E10) | 10 | Missing `dist`, missing `index.html`, symlinks, permissions, `_headers` as a directory, empty `dist` |
| 7 | `subset-fonts.mjs` read-only harness | 3 | Sweep + skip logging, in a sandbox outside the repo |
| 8 | Regex profile unit probe | 28 strings | Exact catch / pass boundary of the residue patterns |
| 9 | Rule 1/2/3 line-level diff vs `47c16f5` | 2 files | No assert weakened |

**Not run, by instruction:** `npm run fonts:subset`. **Not run, no environment:** any browser, `astro preview` + `curl` against a live server, Cloudflare Pages, Lighthouse/axe. Those are T-28's scope and are unaffected by a ticket that changes no rendered page.

---

## 2. Acceptance criteria

| # | Criterion | Method | Result |
|---|---|---|---|
| 1 | `gen-headers.mjs`: `resumeRule` and every reference deleted | `rg -in 'resume\|pdf' scripts/gen-headers.mjs` → exit 1; full-file read | **Pass** |
| 2 | Production (no `CF_PAGES_BRANCH`, or `= main`): **no** `dist/_headers` written | `npm run build` → `[gen-headers] production build — no _headers written`; `test ! -e dist/_headers` → true. `CF_PAGES_BRANCH=main node scripts/gen-headers.mjs` → absent. `CF_PAGES_BRANCH=master` (control) → absent | **Pass** |
| 3 | A stale `_headers` from a previous build is removed | Planted the exact old file (`/resume.pdf` + `Cache-Control` rule) at `dist/_headers`, ran production `gen-headers` → removed. `rmSync(..., {force:true})` is a no-op when absent (E9) | **Pass** |
| 4 | Preview (any other branch value): `_headers` contains **only** `/*` + `X-Robots-Tag: noindex` | `CF_PAGES_BRANCH=preview-x npm run build`; `od -c` → `/*\n  X-Robots-Tag: noindex\n` (27 bytes), no PDF rule, no leading rule | **Pass** |
| 5 | `CF_PAGES_BRANCH`-vs-`main` detection logic byte-unchanged; `CF_PAGES_URL` still rejected | The three executable lines (`PROD_BRANCH`, `branch`, `isProduction`) are byte-identical to `47c16f5`. The only import change is `+ rmSync`. `CF_PAGES_URL is REJECTED as a discriminator` comment retained verbatim. No "improvement" attempted | **Pass** |
| 6 | The two stale résumé **presence** asserts are gone | `mustContain('resume/index.html', …)` and `mustContain('_headers', 'Cache-Control: …')` both removed; `git diff` shows no other deletion from rules 1/2/3 | **Pass** |
| 7 | No `dist/resume/` dir | 4a; planted `dist/resume/index.html` → `FAIL dist/resume: retired artifact exists (removed route resurfaced)`, exit 1 (N1) | **Pass** |
| 8 | No `resume.pdf` string in any built HTML / CSS / `_headers` | 4b; planted `href="/resume.pdf"` in `index.html` → FAIL (N3); planted rule in `dist/_headers` → 2 FAILs (N6); appended to a **preview** `_headers` → 2 FAILs (N6b); `/resume` in a `.txt` and a `.bin` → FAIL (F11, F12) | **Pass** |
| 9 | No `ProfilePage` `@type` in any JSON-LD block | 4c; standalone block (N5), inside an `@type` array on the About page (N5b), nested in a sub-node of the Person block (N5c) → all three FAIL, exit 1 | **Pass** |
| 10 | No `/resume` link in any built page's nav or link row | 4b with nav callout; nav hit → `FAIL … references the retired path "/resume" (in <nav>)` (N4); link-row hit outside `<nav>` → FAIL (R4) | **Pass** |
| 11 | `dist/_headers`, when present, carries no `/resume.pdf` rule | N6, N6b. Additionally strengthened to a byte-exact content assert (4e), which also fails an extra rule (F9) | **Pass** |
| 12 | Design §11.1 rule 4's extra guard: exactly one JSON-LD block, parses, `@type` is `Person` (`RES-X4`) | 4d; `@type`→`WebSite` → FAIL (N7); block deleted → `0 JSON-LD block(s)` FAIL (N8); trailing comma → parse FAIL (N9); clean build → exactly 1 block, `@type: "Person"` | **Pass** |
| 13 | Each new negative assert **proven to work** by planting, then reverting | All 5 ticket asserts plus the design's 4d exercised; **12 of 12** distinct assert paths produced a FAIL and exit 1. Every plant reverted by `npm run build` | **Pass** |
| 14 | T-20 asserts kept untouched; JSON-LD exemption still applies to the surviving `Person` block | Comment-stripped line diff vs `47c16f5`: rules 1 and 2 are **byte-identical**; rule 3's only change is the two deleted résumé asserts. Exemption proven by R1e/R1f (a JSON-LD block on `404.html` → clean; a second block on `index.html` → rule-1-exempt, only the 4d count fails). Client `<script src>` (R0), inline non-JSON-LD body (R1a, R1d), `onclick` (R1b), `onload` (R1c) all still FAIL. Third-party `img src` (R2a), protocol-relative (R2b), `<style>` `url()` (R2d) all still FAIL; outbound `<a href>` (R2c) and same-origin `url()` (R2e) still exempt. All four presence asserts still fire (R3a-R3d) | **Pass** |
| 15 | `subset-fonts.mjs`: `resume/index.html` dropped; list is the three live pages | `rg 'resume' scripts/subset-fonts.mjs` → exit 1. Line 38: `['index.html', 'about/index.html', '404.html']`. Read-only harness confirmed exactly those three are swept and a stale `dist/resume/index.html` is not | **Pass** |
| 16 | The comment states the **correct** rationale (silent skip ⇒ the hazard is an *added* page not being re-listed, shipping tofu with no build failure) | Lines 31-35 read: "a missing input is silently skipped rather than raising, so a page that is added without being listed here would be quietly excluded from the subset and ship missing glyphs (tofu) with no build failure to warn you." This is the ticket's plan-review correction, correctly stated. Premise independently proven: HEAD's list swallowed a missing `resume/index.html` with **no log at all** | **Pass** |
| 17 | `package.json` unchanged: filenames and `build` / `verify` / `check` / `fonts:subset` byte-identical | `git diff -- package.json` → empty. `build` = `astro build && node scripts/gen-headers.mjs`, `verify` = `node scripts/verify-static.mjs`, `check` = `astro check`, `fonts:subset` = `node scripts/subset-fonts.mjs`. T-19/T-20 CI wiring needs no edit | **Pass** |
| 18 | No boundary violation: only 4 files touched; no T-26 work disturbed; font binaries byte-identical | `git diff --name-only` → exactly the 4 expected. `rg -in 'resume' src/ astro.config.mjs package.json` → exit 1. `git diff --stat -- src/assets/fonts` → empty; sha256 prefix `edd955713b531163` and `4f136e9f7f361701` match `HEAD` for both WOFF2 files. Nothing staged, no untracked files | **Pass** |
| 19 | Whole-site integrity: `build` + `check` + `verify` all clean | Build 3 pages + `sitemap-index.xml` created. `astro check`: **0 errors, 0 warnings, 3 hints** (all pre-existing). `verify`: exit 0, `verify: OK — 3 HTML, 0 CSS files checked (mattoconn.pages.dev)` | **Pass** |
| 20 | Two-route site renders; sitemap lists exactly `/` and `/about/`; `404.html` excluded | `dist/` = `index.html`, `about/index.html`, `404.html`, `robots.txt`, `sitemap-0.xml`, `sitemap-index.xml`, `_astro/*.woff2`. `sitemap-0.xml` `<loc>` = exactly `https://mattoconn.pages.dev/` and `…/about/`. No `404` in the sitemap | **Pass** |
| 21 | Canonical / sitemap / `robots.txt` `Sitemap:` line still byte-identical | `canonical` = `…/` and `…/about/`; `sitemap-0.xml` `<loc>` identical; `robots.txt` `Sitemap: https://mattoconn.pages.dev/sitemap-index.xml` == the built index filename; the index's own `<loc>` is the same | **Pass** |
| 22 | `Person` JSON-LD still parses with `name` / `jobTitle` / `sameAs` | `JSON.parse` OK. `@type: "Person"`; keys `@context,@type,name,url,jobTitle,sameAs`; `name: "Matthew O'Connell"`, `jobTitle: "HUMAN COPY — job title"`, `sameAs: [github.com, linkedin.com]`. No `mainEntity`. Block at offset 7337 > `</head>` at 6713, so in `<body>` per design §8.3. `about/` and `404.html`: 0 blocks | **Pass** |
| 23 | Nav renders exactly two items, `aria-current="page"` on the active one | `/` → Home(current) + About; `/about/` → Home + About(current); `404.html` → Home + About, neither current | **Pass** |
| 24 | `rg -i 'resume' dist/` **completely clean** (T-28's strong unscoped check will pass) | Unscoped `rg -in 'r[eé]sum[eé]' dist/` → exit 1, zero output. T-26's `--glob '!_headers'` exclusion is no longer needed, because the PDF rule is gone | **Pass** |

---

## 3. Negative-test evidence (the planted-failure procedure, design §11.2)

**§11.2 exactly as written** (R0): injected `<script src="https://example.com/evil.js"></script>` before `</body>` in `dist/index.html` → exit 1 with both `FAIL … <script> with src= (client JS file)` and `FAIL … <script src> → example.com`, as §11.2 step 3 predicts. Reverted by rebuild → exit 0.

Every new assert, with the plant that made it fire:

| Assert | Plant | Observed FAIL line | rc |
|---|---|---|---|
| 4a retired dir | `dist/resume/index.html` | `dist/resume: retired artifact exists (removed route resurfaced)` | 1 |
| 4a retired file | `dist/resume.pdf` | `dist/resume.pdf: retired artifact exists (removed route resurfaced)` | 1 |
| 4b pdf link | `<a href="/resume.pdf">` in `index.html` | `references the retired path "/resume.pdf"` | 1 |
| 4b nav link | `href="/about/"` → `href="/resume/"` in `<nav>` | `references the retired path "/resume" (in <nav>)` | 1 |
| 4b link row | `<a href="/resume/">` in `<main>` | `references the retired path "/resume"` | 1 |
| 4b `_headers` | old PDF rule in `dist/_headers` | `dist/_headers: references the retired path "/resume.pdf"` + 4e ×2 | 1 |
| 4c ProfilePage | standalone `ld+json` block | `JSON-LD declares @type "ProfilePage" (retired structured-data node)` | 1 |
| 4c array form | `"@type":["WebPage","ProfilePage"]` on `/about/` | same line, on `about/index.html` | 1 |
| 4c nested form | `"mainEntity":{"@type":"ProfilePage"}` | same line (whole-block match works) | 1 |
| 4d wrong type | `"@type":"WebSite"` | `@type is "WebSite", expected "Person"` | 1 |
| 4d block gone | block regex-removed | `0 JSON-LD block(s), expected exactly 1 (structured data lost)` | 1 |
| 4d unparseable | trailing comma injected | `JSON-LD block does not parse as JSON (…)` | 1 |
| 4d missing | `dist/index.html` moved away | `dist/index.html: missing — cannot confirm the Person structured-data node` | 1 |
| 4e wrong content | extra `X-Custom: v` in `_headers` | `not the preview noindex rule ("…")` | 1 |

**Controls that must stay green** (proving the gate is not just failing everything): accented `résumé` in prose (N3b), unaccented `a resume` (N3c), `/something-resume/`, `/resumes/`, `/about/#resume` (N3d), a new legitimate page `/now/` (F1), an SVG asset with an internal `use href` (F2), outbound LinkedIn/GitHub links in prose (F3), `résumé, CV, resume, RESUME` all cases (F4), a real `/resumes/` page (F5), a real `/something-resume/` page (F6), the bare word `resume` in a `.txt` (F10). All exit 0.

**Edge cases** (E1-E10): missing `dist/` → clean fail-fast; empty `dist/` → 5 violations, exit 1; `dist/_headers` as a directory → `cannot read as text (EISDIR)` + production-absence FAIL, exit 1; `chmod 000` on a scanned artifact → `cannot read as text (EACCES)`, exit 1 (a file that cannot be checked never reads as clean); `gen-headers.mjs` standalone with no `dist/` → creates it, production leaves no file, preview writes the rule.

---

## 4. Defects

### Blocking

**None.** No defect found that would let a bad build through, crash the shipped site, or violate the ticket or the design.

### Non-blocking

#### N-1 · `minor` · the duplicated `PROD_BRANCH` leaves a reproduced hole, and the comment claims a mitigation that does not work

`scripts/verify-static.mjs:306-334`. The production-absence check is branch-gated on a second hardcoded `const PROD_BRANCH = 'main'`. The comment at :308-313 argues that the branch-independent content check is the backstop: *"If the production branch were ever anything but `PROD_BRANCH`, gen-headers would misclassify a production build as preview and ship `X-Robots-Tag: noindex` to the canonical host — a live SEO outage … This one needs no env var, so it still holds."*

It does not hold. In exactly the bad case the content check **passes**, because the file it finds is the byte-exact noindex rule. Reproduced end to end:

```
$ CF_PAGES_BRANCH=master node scripts/gen-headers.mjs
[gen-headers] wrote dist/_headers (preview noindex, branch=master)
$ cat dist/_headers
/*
  X-Robots-Tag: noindex
$ CF_PAGES_BRANCH=master npm run verify
PASS third-party scan … / PASS presence asserts / PASS no-residue asserts
verify: OK — 3 HTML, 0 CSS files checked        rc=0
```

The gate is green while a **production** deploy would ship `X-Robots-Tag: noindex` to the canonical host. A preview deploy and a misclassified production deploy are byte-identical to this check, so nothing distinguishes them.

**Why non-blocking:** the precondition is an out-of-band change. Design §10.3 step 1 pins the Cloudflare Pages production branch to `main`, the ticket explicitly forbids touching the detection logic, and T-19 is the ticket that sets the branch on the project. Nothing in this ticket can produce the condition.

**Suggested fix, in `verify-static.mjs` only** (leaves `gen-headers.mjs` untouched, as the ticket requires): make the absence check independent of the branch *name* by keying it on the canonical host, which R10 says Cloudflare sets on production deploys:

```js
const isProdDeploy = !process.env.CF_PAGES_BRANCH
  || process.env.CF_PAGES_BRANCH === PROD_BRANCH
  || new URL(process.env.CF_PAGES_URL ?? '').hostname === ALLOWED_HOST;  // guard the parse
```

Add a T-19 checklist line: *confirm the Cloudflare Pages production branch is literally `main` before the first deploy*, since two scripts now hardcode that string.

#### N-2 · `minor` (forward-compat) · "exactly one JSON-LD block" is stricter than `RES-X4` needs, and reports a gain as a loss

Proven (F8): adding a legitimate `WebSite` node beside `Person` on the home page fails the build with `dist/index.html: 2 JSON-LD block(s), expected exactly 1 (structured data lost)`. Nothing was lost. Adding a `BreadcrumbList`, a `WebSite`, or per-page `Article` structured data is a normal SEO improvement, and this gate will block it with a misleading diagnosis.

Design §11.1 rule 4 literally says *"The **only** JSON-LD block in `dist/index.html` is `"@type":"Person"`"*, and the ticket AC restates it, so the implementation is compliant as written. But `RES-X4` states the actual obligation: *"removing the résumé must not remove or degrade the Home `Person` JSON-LD"*. That is a **presence** invariant, not an **exclusivity** invariant.

Suggested relaxation, which keeps every guard that matters: require at least one block; require exactly one of them to be `Person`; keep 4c's blanket `ProfilePage` ban across all blocks and all files. T-28 should re-confirm whichever form ships.

#### N-3 · `minor` (forward-compat) · `dist/_headers` is asserted byte-exactly

Proven (F9): appending `/_astro/*` + `Cache-Control: public, max-age=31536000, immutable` to a preview `_headers` fails the build. A font/image cache rule is the single most likely future `_headers` addition on Cloudflare Pages, and it would require a coordinated edit to the generator *and* the verifier. Compliant with §10.1 today (the design fixes preview content to exactly the one rule). Acceptable; the script comment already gestures at the coupling. Worth one sentence in the comment naming the coordinated change.

#### N-4 · `minor` (false positive) · an outbound URL whose path ends in `/resume` is blocked

Proven (F7): `<a href="https://github.com/someone/resume">` → `FAIL … references the retired path "/resume"`. For a site whose stated content strategy is "the work history lives on LinkedIn and GitHub", a link to a GitHub resume repository is the most plausible future `/resume`-shaped URL on the internet, and rule 2 deliberately exempts outbound anchors as a feature. The design mandates catching "an href pointing at `/resume`", so this is compliant, and it fails closed. Flagged so the next person meets a documented gate rather than a mystery. A one-line carve-out (`skip matches preceded by `://`) would fix it if the owner ever wants such a link.

#### N-5 · `nit` · the header comment overstates the boundary discipline

`verify-static.mjs:19-22` claims *"A match needs a leading `/` and a non-word character after the token."* That is true of `RETIRED_PATH` only. The `else if (RETIRED_FILE_RE.test(content))` fallback at :241 is a bare substring with no boundary guard, so `resume.pdfx` is caught (confirmed by the regex probe). Fails closed and harmless; the comment is simply not accurate about the second branch.

#### N-6 · `nit` · an accented route `/résumé/` is not caught

`RETIRED_PATH` is ASCII-only, so `/resumé/` passes. Irrelevant to an ASCII-slug content registry, and it is a fair consequence of the gate not punishing the word *résumé* in prose (N3b/F4). Noted so nobody mistakes "clean" for "guarded" in the accented spelling.

#### N-7 · `nit` · `rmSync` throws if `dist/_headers` is a directory

`gen-headers.mjs:33` uses `rmSync(headersPath, { force: true })`. `force` suppresses ENOENT only; a **directory** at that path raises `ERR_FS_EISDIR` (reproduced, E8, exit 1 with a stack trace). Unreachable via `npm run build`: Astro empties `dist` first and nothing in the chain creates a directory there. `{ force: true, recursive: true }` is a one-word hardening in newly added code.

#### N-8 · `nit` · `subset-fonts.mjs:34-35` overstates its own logs

*"Nothing enforces the list, so the sweep and skip logs below are the only signal that a page fell out of it."* Proven false for the direction the sentence names. Read-only harness, three cases:

| `dist/` state | Output |
|---|---|
| stale `dist/resume/index.html` present, not listed | `swept 3 page(s): index.html, about/index.html, 404.html` — silent, as designed |
| listed `404.html` **removed** | `swept 2 page(s)` + `WARNING: 1 listed input(s) not found in dist/: 404.html` |
| new `/now/` page **added**, not listed | `swept 3 page(s)` — **no warning at all** |

The `WARNING` only fires in the *remove*-without-relisting direction. The hazard the comment identifies (*add* without relisting) produces no warning, only a `swept N` line that a human must diff against `ls dist/`. The added logging is a genuine improvement over HEAD (which logged nothing at all) and the AC is met; the sentence just credits the logs with more than they do. Suggest: *"the `swept N` line is the only clue, and it needs a human to diff it against `ls dist/`."*

#### N-9 · `nit`, pre-existing, **not a T-27 regression** · the defensive `exists`/`readText` discipline is bypassed upstream

T-27 added guarded stat/read helpers with the stated principle that *"could not check" must never read as "clean"* (design §11.1 rule 5). That principle is enforced in rule 4 but defeated upstream, in code T-27 correctly did not touch: `walk()` at :54 and rules 1/2's raw `readFileSync` at :69, :105, :137 throw **uncaught**. Reproduced (E3, E6): a dangling symlink under `dist/`, or a `chmod 000` HTML file, aborts the process with a Node stack trace. I ran HEAD's verifier against the same two conditions and got the identical crash at the identical sites, so this is T-20's shape, inherited. It fails closed (non-zero exit), so it is not a soundness hole; it is a rough edge, and it means rule 4's FAIL-line discipline is unreachable in those cases.

#### N-10 · observation · rule 2's `.css` loop is vacuous in this build

`verify` reports `0 CSS files checked`. Astro inlines every stylesheet, so the `cssFiles` loop never iterates and the ticket AC's "or in any built … CSS" clause covers nothing today; the live path is the inline-`<style>` `url()` scan, which I confirmed works (R2d FAIL, R2e clean). Pre-existing T-20 shape, not T-27's to fix.

#### N-11 · observation, pre-existing · unused `readdirSync` import

`scripts/subset-fonts.mjs:13` is the third `astro check` hint (`ts(6133)`). The import line is **not** in T-27's diff, so T-27 inherited it, but T-27 did edit this file and could have dropped the import. No AC required it. The other two hints are the pre-existing deprecated `z.string().url()` pair in `src/content.config.ts`.

---

## 5. False-positive audit verdict

**The residue gate is safe to leave as a permanent deploy guard.**

I planted eleven shapes of legitimate future content into the real build. Eight passed. The three that failed all fail **closed** (a loud CI block, never a silent bad deploy), and two of the three are literal design requirements.

| Probe | Expected | Actual | Reading |
|---|---|---|---|
| About page prose: `résumé`, `resume`, `RESUME`, `CV` | pass | pass | The word in prose is completely safe |
| New page `/now/` with nav and body (the T-22 extensibility shape) | pass | pass | Adding a page does not trip the gate |
| SVG asset with an internal `use href="#i"` | pass | pass | SVG is scanned as text, as intended, with no false positive |
| Outbound LinkedIn / GitHub links in prose | pass | pass | |
| Plural page + link `/resumes/` | pass | pass | `(?![\w-])` lookahead does its job |
| Hyphenated sibling `/something-resume/` | pass | pass | |
| `/about/#resume` fragment | pass | pass | |
| Bare word `resume` in a `.txt` asset | pass | pass | |
| Outbound link to `github.com/someone/resume` | pass | **fail** | N-4; design-mandated, fail-closed |
| Add a `WebSite` node beside `Person` on home | pass | **fail** | N-2; design-mandated as written, misleading message |
| Add an image/font cache rule to a preview `_headers` | pass | **fail** | N-3; design-mandated as written |

The gate's coverage is also **fail-closed by default** in the right direction, which is the property that matters for a permanent guard: the residue scan covers every artifact under `dist/**` except a fixed list of known binary formats, so a *new output format is covered automatically* rather than by remembering to whitelist it. Confirmed: `/resume` in a `.txt` (F11) and in a `.bin` (F12) both FAIL. The binary list is not exhaustive (`.heic`, `.tar`, `.svgz`, `.cur` are absent, F13), but an unlisted binary is therefore *scanned*, which is the safe direction. A genuine binary that happened to contain the byte sequence `/resume` would be a false positive; that is not a realistic risk for this site.

The three sharp edges are all **additive** future changes, all trivially fixable in the script at the moment they are attempted, and none can ship a bad build. The one that will actually bite first is N-2, because structured data is exactly the kind of thing a personal site grows.

---

## 6. Regression verdict on T-25 / T-26

**No regression.** Every shipped behavior from the two prior removal tickets was re-derived from the build output, not from the source.

| Check | Result |
|---|---|
| Registry shape: exactly `home` (`/`) + `about` (`/about/`) | Confirmed via three independent build surfaces: `dist/` file list, sitemap `<loc>`s, nav item sets |
| Nav: exactly 2 items, `aria-current="page"` on the active one | `/` → Home current; `/about/` → About current; `404.html` → neither |
| Sitemap: exactly `/` + `/about/`, `404.html` excluded | Confirmed, no `404` anywhere in `sitemap-0.xml` |
| Canonical / og:url absolute, self-referencing, byte-identical to sitemap and `robots.txt` | Confirmed on both routes; `robots.txt` `Sitemap:` == `sitemap-index.xml` == its own `<loc>` |
| `robots.txt` allow-all, 4 named AI-crawler blocks, `Sitemap:`, zero `Disallow` | Confirmed |
| `RES-X4`: `Person` JSON-LD parses, `name` / `jobTitle` / `sameAs` present, in `<body>` | Confirmed; `@type: "Person"`, no `mainEntity` |
| Home link row: GitHub, LinkedIn, About | Confirmed in `<main>` order |
| Zero client JS holds; JSON-LD still treated as data | 0 functional-JS markers, 0 event-handler attributes, 1 `ld+json` data block across 3 HTML files, `404.html` has 0 `<script>` tags |
| Zero third-party holds | Only absolute URLs in `dist/` are the 2 outbound profile anchors and the self-referencing canonicals |
| Whole-`dist` residue, unscoped and accent-tolerant | `rg -in 'r[eé]sum[eé]' dist/` → exit 1. `src/`, `astro.config.mjs`, `package.json` → exit 1. The only surviving occurrence repo-wide is `scripts/verify-static.mjs:188 const RETIRED = 'resume'`, which is the guard itself |
| T-26's `--glob '!_headers'` exclusion now unnecessary | The PDF rule is gone, so the unscoped scan is clean; T-28 can use the strong form directly |
| `npm run check` hint count | 3 hints, identical to T-26's baseline, all in files T-27 must not touch |

**One incidental fix worth crediting.** T-20's verifier printed `PASS third-party scan` and `PASS presence asserts` **unconditionally** at the end of the run, so a failing build still emitted two reassuring PASS lines. T-27 replaced them with baseline-gated PASS lines, so each rule's PASS now reflects only its own failures. That is a real improvement to the gate's signal, not a cosmetic change, and it is what the AC "no assert was weakened" is really protecting.

---

## 7. Repository left clean

Finished with a plain `npm run build` (no `CF_PAGES_BRANCH`) followed by `npm run verify` → exit 0. Final state:

```
 M projects/initial-site/tickets/tickets.md
 M scripts/gen-headers.mjs
 M scripts/subset-fonts.mjs
 M scripts/verify-static.mjs
```

Exactly the four expected files, nothing staged, no untracked files anywhere (`--untracked-files=all` clean), `src/assets/fonts/*.woff2` byte-identical to `HEAD`, `src/**` untouched. No file was created, edited, or deleted inside the repository. All scratch harnesses live in `/var/folders/81/458mnwt131b_xr682xnr_zg80000gn/T/opencode/`.

---

## 8. Carried forward

**To T-19** (before the first production deploy):
1. Confirm the Cloudflare Pages production branch is literally `main`. Two scripts hardcode that string; if it differs, the gate goes green while `X-Robots-Tag: noindex` ships to the canonical host (N-1, reproduced).
2. The CI build command becomes `npm run build && npm run verify` in a single environment, which is what keeps the preview-`dist` ordering hazard (documented at `verify-static.mjs:27-31`) out of production. Verified locally that a *mismatched* environment fails loudly rather than silently: `npm run verify` with no env var over a preview `dist/` exits 1 with `dist/_headers: present on a production build`.

**To T-28:**
3. `rg -in 'r[eé]sum[eé]' dist/` will pass unscoped. Use the accent-tolerant pattern, not bare `resume`, per T-26's carried-forward note.
4. Re-assert the registry/nav/sitemap/canonical/robots matrix above, and re-confirm `Person` JSON-LD under whichever 4d form ships (see N-2 if the exclusivity check is relaxed).
5. The T-22 two-file stub proof will find the residue gate green on a new `/now/` page (F1), so the extensibility promise survives T-27's enum removal.
6. F-3 / F-4 / F-5 from the T-26 report (404 has no canonical; `/about` without a trailing slash 404s under `astro preview`; `HomeSection.astro:11` comment wording) are untouched by T-27 and remain open.

---

## Recommendation

**Sign-off.** Nothing blocks: all 14 acceptance criteria pass with evidence, no rendered page changed, and no regression to T-25 or T-26. Every new assert was observed to fail on a planted violation, which is the ticket's own bar for a verified assert. `npm run build`, `npm run check`, and `npm run verify` are clean; the two-route site, sitemap, canonicals, `robots.txt`, `Person` JSON-LD, and nav are all intact; and `rg -i 'resume' dist/` is completely clean, so T-28's strongest check is pre-satisfied.

Three caveats travel with the sign-off, none requiring rework now: **N-1** (add the canonical-host-keyed absence check, or at minimum confirm `main` in T-19) is the only one that lets something bad through, and only under an out-of-band change; **N-2** and **N-3** are forward-compat sharp edges that will block a plausible future additive change with a slightly misleading message. All three fail closed, all three are one-line fixes at the moment they matter, and none of them puts the résumé back on the site.

---

# Verdict: Pass with Caveats

# QA Report — T-28: Post-removal regression + accessibility/mobile re-verification

- **Project:** `initial-site` · **Work item:** T-28 (single T-ID; regression risk only)
- **Base commit:** `dfcf629` (T-27) · **Code state at test time:** working tree, uncommitted
- **Size:** M · **PRD:** v1.5 · **Design:** §5.2, §5.3, §6.3, §6.5, §8.3, §9, §10.1, §10.3, §11.1, §11.3, §14
- **Requirements exercised:** `RES-X1`, `RES-X2`, `RES-X3`, `RES-X4`, `SEO-1`, `SEO-3`, `SEO-10`, `SEO-11`, `SEO-12`, `NF-1`, `NF-2`, `NF-3`, `US-9`, `US-15`, `US-16`, `REG-2`, `REG-6`, `HOME-5`, `DEP-3`, `DEP-4`, `DEP-5`
- **QA date:** 2026-09-27 · **Platform:** darwin 24 (arm64), Node v24.21.0, npm 11.19.0, Chrome (headless), Lighthouse 13.5.0, axe-core 4.13
- **Diff under test (2 files):** `projects/initial-site/tickets/tickets.md` (T-28 `- [ ]` → `- [x]`), `src/templates/HomeSection.astro` (frontmatter comment, lines 11–14, reworded)
- **QA execution:** 8 harnesses, ~190 discrete checks, incl. 3 Lighthouse runs, 8 axe-core runs, 9 (route × width) puppeteer viewports, a full preview-server HTTP battery, a preview/production `_headers` matrix, and 6 build mutations confined to **throwaway `/tmp` repo copies**. **No file inside the repository was created, edited, or deleted.** `npm run fonts:subset` was **not** run.

---

## Verdict

**Pass with Caveats.** Every one of the nine MUST/SHOULD acceptance criteria passes on its own terms, and the strongest one — the unscoped whole-`dist` residue scan — is clean under three progressively wider patterns. The résumé is genuinely gone: no route, no file, no string, no structured-data node, no header rule, and the registry is closed against re-registration (`template: 'resume'` fails the build, proven live). Performance and accessibility both improved or held versus the T-21 baseline. The two caveats are (a) one pre-existing element that literally misses the 44px touch-target floor by 2.4px, which makes AC 8's "all touch targets ≥44px" clause false as written, and (b) a missing favicon that costs best-practices on every route. Neither is removal-caused, neither blocks the deploy, and (a) has a one-line fix.

**T-28 is the last removal ticket before T-19. Nothing found here blocks the first production deploy.** This report is the evidence design §14 requires be attached to T-19.

---

## 1. What I actually ran

| # | Harness | Checks | Purpose |
|---|---|---|---|
| 1 | `npm run build && npx astro check && npm run verify` (chained, plus each separately) | 3 | Whole-site integrity, clean baseline (AC 1) |
| 2 | Byte-level chrome-consistency matrix (`chrome-matrix.mjs`) | 31 | Registry shape, nav, canonical/sitemap/robots identity, JSON-LD, zero-JS/third-party invariants (AC 2, 3, 6, 7) |
| 3 | Preview-server HTTP battery (`curl`, own server on `:4322`) | 13 paths | Dead-route behaviour, redirect absence, 404 fidelity (AC 4) |
| 4 | `_headers` production/preview matrix | 6 | Production absence, preview single-rule, cross-env gate behaviour (AC 5) |
| 5 | axe-core 4.13 (WCAG 2.0/2.1/2.2 A+AA + best-practice) | 8 route×width runs | a11y clean (AC 8) |
| 6 | puppeteer-core 24 mobile sweep + effective-contrast probe | 87 asserts + 320/360px probe | 375/390/430px: h-scroll, targets, landmarks, headings, focus rings, tab order (AC 8) |
| 7 | Lighthouse 13.5.0 mobile preset ×3 routes | 3 runs | Perf <2s, a11y, best-practices, SEO (AC 8, 9) |
| 8 | `/tmp` repo-copy mutations (6 builds) | 6 | Comment-reword equivalence, T-22 stub extensibility + revert, closed-enum probes (AC 10) |

**Environment notes.** Astro 7's preview is a managed daemon that refuses a second instance on the same port; a daemon left running on `:4321` (not started by QA) was left alone, and QA ran its own instance on `:4322` with `--ignore-lock` so every served byte was provably from a build it made. That instance was killed at the end.

---

## 2. Acceptance criteria

| # | Criterion | Method (exact command) | Result |
|---|---|---|---|
| 1 | `npm run build && npx astro check && npm run verify` all pass | chained; `CHAINED_RC=0`. Build: `3 page(s) built`, `sitemap-index.xml created`, `[gen-headers] production build — no _headers written`. `astro check`: `0 errors / 0 warnings / 3 hints`. `verify`: 4 PASS lines, `verify: OK — 3 HTML, 0 CSS files checked` | **Pass** |
| 2 | Registry returns exactly `home` (`/`) + `about` (`/about/`); `dist/` exact route set; no `resume/` | `find dist -type f` → exactly `404.html, about/index.html, index.html, robots.txt, sitemap-0.xml, sitemap-index.xml, _astro/{400,600}.woff2` (8 files). `test -e dist/resume` → ABSENT. Sitemap `<loc>` = exactly `/` + `/about/`. Nav order home→about on all three pages | **Pass** |
| 3 | Nav = 2 items + `aria-current`; sitemap = `/` + `/about/`; canonicals absolute self-referencing; canonical ≡ sitemap ≡ `robots.txt` `Sitemap:` (byte); 404 excluded + noindex | Byte-compare: `https://mattoconn.pages.dev/` ≡ loc[0]; `…/about/` ≡ loc[1]; `robots.txt` `Sitemap: …/sitemap-index.xml` ≡ built index filename ≡ index's own `<loc>` (`…/sitemap-0.xml`). `404.html` absent from sitemap, carries `<meta name="robots" content="noindex">` | **Pass** |
| 4 | `/resume/` via preview returns the styled 404, no redirect; no built page links to it; `/resume.pdf` 404 is a pass | `curl -w` on `/resume/`: `code=404 redirects=0`, body **byte-identical to `dist/404.html`** (`sha256 fdda4d92…8f4b0b`, `cmp` clean). `/resume.pdf` → `404`, same styled page. `rg` over `dist/`: zero `/resume` hrefs, zero `resume` strings of any kind | **Pass** |
| 5 | Default build → **no** `dist/_headers`; preview build → only `/*` + `X-Robots-Tag: noindex` | `npm run build` → `test -e dist/_headers` ABSENT. `CF_PAGES_BRANCH=preview-x npm run build` → 27 bytes, `od -c` = `/*\n  X-Robots-Tag: noindex\n`, 2 lines, `rg -i resume` → rc 1 | **Pass** |
| 6 | `rg -i 'resume' dist/` clean unscoped; accent-tolerant too; only live-code hit repo-wide is the `RETIRED` constant | `rg -i 'resume' dist/` rc=1, no output. `rg -in 'r[eé]sum[eé]' dist/` rc=1. Wider `rg -in 'résumé\|resume\|\.pdf\|curriculum\|\bcv\b' dist/` rc=1. Repo-wide live code: `rg -in 'resume' src/ scripts/ astro.config.mjs package.json` → **one** line, `scripts/verify-static.mjs:188 const RETIRED = 'resume'` (the design-mandated gate string) | **Pass** |
| 7 | Exactly one `ld+json` block in `dist/index.html`, valid JSON, `@type Person`, `name`/`jobTitle`/`sameAs` non-empty; zero `ProfilePage` | 1 block, `JSON.parse` OK, keys `@context,@type,name,url,jobTitle,sameAs`; `@type: "Person"`; `name "Matthew O'Connell"`, `jobTitle "HUMAN COPY — job title"`, `sameAs [github, linkedin]`; no `mainEntity`; block sits in `<body>` (design §8.3). `ProfilePage` in 0 of 3 HTML files | **Pass** |
| 8 | axe/Lighthouse a11y clean; 375/390/430px: no h-scroll, targets ≥44px, readable, landmarks, skip-link, focus rings, one h1; 404 `.btn-primary` ≥44px + visible focus | axe: **0 violations, 0 incomplete** across 8 runs (4 routes × 375/430). Lighthouse a11y **100** on all 3. Sweep: **87 asserted checks, 0 failures**; `scrollWidth == innerWidth` and zero rightward overflowers on all 9 route×width combos. One h1 per page; `header/nav/main[main]/footer` = 1 each; skip-link first body child → `#main`; every tab stop shows `outline: 2px solid rgb(30,64,175)`. 404 CTA `150.8×48`, `min-height: 48px`, focus ring visible. **One documented exception:** the skip-link itself is `184.8×41.6` (see F-1) | **Pass with exception** |
| 9 | Mobile Lighthouse full render <2s for `/` | Perf **100**; FCP **0.9s**, LCP **1.1s**, TBT **0ms**, CLS **0.002**, SI **0.9s**, interactive **1.1s**, max-potential-FID **20ms**; 4 requests, longest chain 21ms | **Pass** |
| 10 | Extensibility SHOULD: two-file stub appears in nav + sitemap with zero core-file diff, then fully reverted | Run in a `/tmp` copy of the working tree: added `now.md` + `NowSection.astro`; core-file manifest: 2 additions, 0 modifications. Build ok; nav = 3 items with `aria-current="page"` on `/now/`; `sitemap-0.xml` = `/`, `/about/`, `/now/`; `dist/now/index.html` with self-canonical; `npm run verify` → OK (4 HTML). Stub removed → rebuild → dist back, manifest delta 0, verify rc 0 | **Pass** |

**Harnesses not run, and why.** `npm run fonts:subset` (overwrites the committed WOFF2 binaries — explicitly forbidden as verification; its input list `['index.html','about/index.html','404.html']` was instead read against the actual `dist/` HTML set and matches exactly). No Cloudflare Pages environment, no physical device, no screen reader, no network drop (see §5/§8).

---

## 3. E2E scenarios (as executed)

| # | Scenario | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|
| E2E-1 | Visitor lands on `/` | `GET /` | 200, name as h1, role/stack, proof line, 3-link row, Person JSON-LD in body | 200, 10011 B; `h1` "Matthew O'Connell"; `<section class="hero">`; chips `GitHub → https://github.com/`, `LinkedIn → https://www.linkedin.com/`, `About → /about/` (3, in UI-design §3.1 order, no résumé chip); 1 `ld+json` | **Pass** |
| E2E-2 | Visitor navigates Home → About via nav | `GET /about/` | 200, About `aria-current`, nav = 2 items, canonical self | 200, 7830 B; nav `Home` + `About[aria-current=page][class=active]`; canonical `…/about/`; `<article class="about">`, `h1` "About" | **Pass** |
| E2E-3 | Visitor follows a **retired** résumé link from an old bookmark/search | `GET /resume/` | styled 404, HTTP 404, no redirect | `404`, `redirects=0`, body **byte-identical** to `dist/404.html` (`h1` "Page not found", `.btn-primary` → `/`) | **Pass** |
| E2E-4 | Crawler probes the retired PDF | `GET /resume.pdf` | 404 (pass condition, design §10.3) | `404` + the same styled page. A `200` here would have been a failure | **Pass** |
| E2E-5 | Crawler reads `robots.txt` then the sitemap | `GET /robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml` | crawlable, `Sitemap:` matches built index, 2 URLs, no 404 | 5 UA blocks (`*`, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot) each `Allow: /`, **zero `Disallow`**; `Sitemap: …/sitemap-index.xml`; 2 `<loc>`; no `404` | **Pass** |
| E2E-6 | Keyboard-only visitor | Tab through `/`, `/about/`, `/resume/` | skip-link first, every stop focused with a visible ring, nothing off-screen | `/` 6 stops, `/about/` 3, `/resume/` 4, then wrap; every stop `outline: 2px solid rgb(30,64,175) offset 2px` | **Pass** |
| E2E-7 | Touch visitor on a 375px phone | 9 route×width renders at 375/390/430 (+320/360) | no h-scroll, targets ≥44px, ≥16px body text, no pinch-zoom | `scrollWidth == innerWidth` everywhere, 0 rightward overflowers; all non-skip-link targets ≥44px; body 16px; `viewport` = `width=device-width, initial-scale=1` | **Pass** |
| E2E-8 | Developer adds a section (US-9) | Add `now.md` + `NowSection.astro`, build, inspect nav/sitemap, revert | 2 files only, nav + sitemap + route appear, gate stays green, tree returns to found state | Manifest delta exactly 2 added files, 0 changed; `/now/` in nav, sitemap, canonical, dist; `verify` OK; revert → 0 delta | **Pass** |
| E2E-9 | Someone re-adds a résumé-shaped section | Content file with `template: resume` (and `bogus`) | build fails loudly | `rc=1`, `[InvalidContentEntryDataError] template: Invalid option: expected one of "home"\|"about"\|"projects"\|"blog"\|"now"\|"uses"` | **Pass** |
| E2E-10 | Owner asks "is the résumé still reachable anywhere?" | full-dist + full-repo scan, HTTP battery, JSON-LD parse, header content | nothing | Nothing: 0 files, 0 strings, 0 routes, 0 nodes, 0 header rules, `/resume/`+`/resume.pdf` both 404 | **Pass** |
| E2E-11 | Preview deploy is indexed by accident | `CF_PAGES_BRANCH=preview-x npm run build` then `npm run verify` (no env) | `_headers` = the one noindex rule; gate **blocks** a prod build carrying it | 27 B, `/*` + `X-Robots-Tag: noindex` only; `npm run verify` over that preview dist → `FAIL dist/_headers: present on a production build`, rc 1 | **Pass** |

---

## 4. Manual test cases

| Area | Case | Result |
|---|---|---|
| Screen sizes | 375 / 390 / 430 px (AC) and 320 / 360 px (extra) on `/`, `/about/`, styled 404 | No horizontal scroll anywhere; layout single-column; footer/proof 14px; nav stack at ≤768px, row above |
| Rendering integrity | 404 fidelity | Served 404 is byte-identical to the built `dist/404.html` — no bare error page, no redirect |
| Error states | Unknown path, retired path, missing trailing slash, wrong case, direct `.html` | `/nope-xyz` → generic server 404; `/resume` → generic 404; `/about` → 404 (F-4, pre-existing); `/About/` → **200** (F-6, pre-existing); `/index.html`, `/404.html` → 200 (F-7, pre-existing, harmless) |
| Loading states | N/A — zero client JS, single document + 2 fonts, no data fetching | Confirmed structurally: 0 `<script src>`, 0 event handlers, 0 `style=` in any built page |
| Offline / degraded | Font CDN failure, JS disabled, slow 3G | Fonts self-hosted + `font-display: swap` (system-ui fallback); page fully readable with JS disabled and with fonts blocked; Lighthouse simulated-throttling FCP 0.9s / LCP 1.1s. **Not** tested with an actual network partition |
| Permission flows | N/A — no auth, no forms, no user state, no third-party embeds | Confirmed: `dist/` has no `<form>`, no `action=`, no storage/cookie API use (0 client JS) |
| Focus visibility | Every focusable, all 3 routes | All show `outline: 2px solid var(--color-accent)`, `outline-offset: 2px`; no `outline: none` anywhere in the built CSS |
| Contrast | Effective (ancestor-resolved) ratios, all 8 key pairings × 3 routes | `h1` 16.96, body 16.96, `nav a` 16.96, `nav a.active` 8.35, `.link-chip` 17.72, `.hero-proof`/footer 7.40, `.btn-primary` (white on accent) 8.72 — **every one ≥ its AA requirement** |
| Reduced motion | `prefers-reduced-motion: reduce` | Present in the built CSS (transitions → 0.01ms); no animations exist to disable |
| Locale/typography | Subset glyph coverage | Committed WOFF2 hashes unchanged; no `.notdef` in the T-21 method (glyph scanner not re-run — it would rewrite the binaries) |

---

## 5. Edge case matrix

| Input / condition | Result | Note |
|---|---|---|
| `GET /resume/` | 404, styled, 0 redirects | AC 4 target |
| `GET /resume` (no slash) | 404, **generic** (unstyled) | Same class as any unknown path; the static preview server does not normalise. Cloudflare Pages serves `404.html` for all unmatched paths, so this is a preview artifact (F-5) |
| `GET /resume.pdf` | 404, styled page | Design §10.3 pass condition |
| `GET /about` (no slash) | 404, no redirect | F-4, pre-existing. Cloudflare will 308. **T-19 smoke checks must use trailing slashes** |
| `GET /About/` | **200** | Case-insensitive static FS (F-6). Cloudflare is case-sensitive → 404/301 there. Cosmetic, pre-existing |
| `GET /index.html`, `/404.html` | 200 | Direct file access. 404 is `noindex` + sitemap-excluded, so no SEO exposure (F-7) |
| Preview `dist` verified with no env var | `FAIL … gate BLOCKED`, rc 1 | Ordering hazard is caught loudly |
| Stale `dist/_headers` from a preview build | removed by the next production build (`test -e` → ABSENT) | Verified end-to-end by cycling preview → production |
| `template: 'resume'` / `'bogus'` in a content file | build rc 1, `Invalid option: expected one of "home"\|"about"\|"projects"\|"blog"\|"now"\|"uses"` | Closed enum intact after T-25 |
| Valid dormant `template: 'now'`, template file absent | build rc 1, `Missing template component for "now"` | Design §5.1 loud-failure contract intact |
| Second JSON-LD block added to `/` | Exclusivity assert rejects it | Forward-compat sharp edge (C-1) |

---

## 6. Cross-platform notes

The site is static HTML + CSS + 2 self-hosted WOFF2 with zero client JS, so the only platform-dependent surfaces are the dev/preview **server** and the **browser rendering**. All browser work was Chrome (headless, `deviceScaleFactor 2`, `isMobile`, `hasTouch`), i.e. Blink only.

- **`astro preview` vs Cloudflare Pages differ in two observable ways**, both pre-existing and neither a removal regression: (a) non-slash-suffixed unknown paths get a generic 404 instead of `404.html` (F-5), and (b) `/about` 404s locally where Cloudflare would 308 to `/about/` (F-4). Cloudflare's *documented* behaviour is the correct one; the local server is the weaker approximation.
- **Firefox / Safari / iOS are untested.** Nothing in the CSS is engine-specific: no `-webkit-` hacks, no `@supports` branches, no `:has()`, no container queries, standard `clamp()`/`flex`/`min()`. Residual risk: **low, but real** — worth one manual Safari/iOS pass post-deploy.
- **Lighthouse's `seo` 63 on the 404 page is correct, not a defect:** the failing audit is `is-crawlable`, which trips on the deliberate `<meta name="robots" content="noindex">` (design §5.3, SEO-3 hygiene).

---

## 7. Findings

| ID | Severity | Area | Finding | Disposition |
|---|---|---|---|---|
| **F-1** | `nit` (pre-existing, **T-6 code**, not removal-caused) | a11y / NF-2 | The `.skip-link` renders **184.8 × 41.6px** — 2.4px under the 44px floor, on every route at every width | Logged; one-line fix available (`min-height: var(--touch-min, 44px)` in `BaseLayout.astro`); the only AC clause that is not literally true |
| **F-2** | `nit` (pre-existing) | best-practices | No favicon anywhere; the browser's automatic `/favicon.ico` request 404s on every page load and is the sole `errors-in-console` failure | Logged; costs `bp 96/100` on all routes |
| **F-3** | `nit` (pre-existing, **open since T-26**) | SEO | `dist/404.html` has **no canonical and no `og:url`** — the 404 hand-writes its head fragment and does not import `Seo.astro` | Confirmed unchanged; low impact (`noindex` + sitemap-excluded) |
| **F-4** | `nit` (pre-existing, **open since T-26**) | routing | `/about` (no trailing slash) → **404, no redirect** under `astro preview`; Cloudflare Pages will 308 | Confirmed unchanged; actionable only as a T-19 smoke-check instruction |
| **F-5** | `nit` (pre-existing) | routing | `/resume` **without** the trailing slash returns the preview server's **generic** 404, not the styled page. AC 4 only requires `/resume/`, which is correct | Logged; same root cause as F-4 (no slash normalisation locally) |
| **F-6** | `nit` (pre-existing) | routing | `/About/` → **200** (case-insensitive static FS). Cloudflare is case-sensitive | Logged; cosmetic |
| **F-7** | `observation` (pre-existing) | SEO | `/index.html` and `/404.html` are directly fetchable with HTTP 200 | Logged; `noindex` + sitemap-excluded, so no exposure |
| **F-5 (T-26 finding)** | — | comment accuracy | **`HomeSection.astro` comment reword — RESOLVED and correct** | Proven by build: all built artifacts byte-identical before/after; every clause verified against built output |
| **C-1** | `minor` (forward-compat, inherited from T-27) | gate | "Exactly one JSON-LD block" is an exclusivity check, stricter than `RES-X4` requires; a future legitimate `WebSite`/`BreadcrumbList` node would be blocked | Unchanged by T-28; still valid to relax |
| **C-2** | `minor` (pre-existing, inherited from T-27) | deploy | `PROD_BRANCH = 'main'` is hardcoded in **two** scripts (`gen-headers.mjs:20`, `verify-static.mjs:318`). A different production branch would ship `X-Robots-Tag: noindex` to the canonical host with a green gate | Unchanged; **T-19 must confirm the branch is literally `main`** |

---

## 8. Not tested, and why

| Not tested | Why | Risk |
|---|---|---|
| Real Cloudflare Pages production + preview deploy; `CF_PAGES_URL`; branch detection in a live environment | No Cloudflare account in scope; T-19's job. The local `CF_PAGES_BRANCH` matrix covers the only branch logic that exists | Medium for C-2 (branch name), low otherwise |
| iOS Safari / Android Chrome / Firefox rendering; VoiceOver / NVDA | No physical devices or AT available. Mitigated by engine-neutral CSS, axe over 8 runs, semantic assertions on the real DOM | Low |
| A genuine offline / network-partition run | Emulated only by reasoning about the artifact set (0 third-party requests, `font-display: swap`, system-ui fallback) | Low |
| `npm run fonts:subset` end-to-end | Forbidden: it overwrites the committed WOFF2 binaries. Compensated by reading its input list against the actual `dist/` HTML set (exact match) and hash-confirming the binaries are untouched | None |
| UI-design §7.4 purely visual items (typography taste, vertical rhythm, "hunt-free" link row feel) | Machine-unmeasurable; human-judgment items unchanged by the removal | None |
| `getSections()` ordering as a *unit* call | Requires the Astro content-layer runtime. Asserted instead from three independent build surfaces: `dist/` file set, sitemap `<loc>` order, nav order — all home→about | None |
| Concurrent/load behaviour | Static site, no dynamic state, nothing to race | None |

---

## 9. Repository left exactly as found

```
$ git status --porcelain=v1 --untracked-files=all
 M projects/initial-site/tickets/tickets.md
 M src/templates/HomeSection.astro
```

The same two modified files, nothing staged, **no untracked files anywhere**. `src/assets/fonts/*.woff2` hash-identical to `HEAD`. No file inside the repository was created, edited, or deleted at any point by QA.

---

## 10. Carried forward

**To T-19 — before the first production deploy:**

1. **Confirm the Cloudflare Pages production branch is literally `main`.** Two scripts hardcode it; if it is anything else, the gate goes green while `X-Robots-Tag: noindex` ships to the canonical host (C-2). The local branch is `main` today.
2. **Use trailing slashes in the smoke checks.** `curl -sI https://…/about/` → 200, `…/` → 200. Do not smoke-test `/about` without the slash (F-4). `curl …/resume.pdf` returning **404 is the pass condition**.
3. **CI build command is `npm run build && npm run verify`** in one environment — that pairing is what keeps the preview-`dist` ordering hazard out of production.
4. **`dist/404.html` is at the root of `dist/`**, which is what Cloudflare Pages needs to serve the styled 404 for any unmatched path.
5. **Expect `HUMAN COPY` placeholder copy on the first deploy.** `name` is real; `jobTitle`, `description`, GitHub/LinkedIn URLs, and all body prose are T-23 placeholders. Correctly not a T-19 gate, but do not mistake it for a deploy defect.
6. **Attach this report to T-19** as the design §14 evidence that the shipped site has no résumé residue.

**To the planner (new items):**

7. **F-1 (skip link 41.6px).** Pre-existing T-6 code, one-line fix, 2.4px short of the project's own 44px convention.
8. **F-2 (no favicon).** Every page load causes a 404 the site caused itself; the only reason `best-practices` is 96 rather than 100.
9. **C-1 (JSON-LD exclusivity).** Still the sharp edge that will bite first after deploy.
10. **F-3 / F-4 remain open** (404 has no canonical; `/about` without a slash 404s under the local preview server). Neither blocks the deploy.

---

## Recommendation

**Sign-off, with caveats.** All nine MUST/SHOULD acceptance criteria are met with evidence, the strongest one (`rg -i 'resume' dist/`, unscoped) is clean, and the removal is complete by every measure: no file, no route, no string, no structured-data node, no header rule, no nav or sitemap entry. The closed enum rejects `template: 'resume'` with a loud build failure, and the two-file extensibility promise survives with **zero** core-file changes — verified live and fully reverted. Lighthouse mobile is Perf 100 / A11y 100 with LCP 1.1s against a 2s bar, axe reports zero violations across 8 runs, and the 375/390/430px sweep is clean. The uncommitted comment reword is accurate on every clause and provably byte-neutral in output.

The two caveats are **F-1** (pre-existing skip link 2.4px under the 44px convention) and **F-2** (pre-existing missing favicon). Neither is removal-caused, neither is a WCAG failure, neither blocks T-19.

---

# Verdict: Pass with Caveats

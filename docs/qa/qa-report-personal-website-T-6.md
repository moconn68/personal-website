# QA Report — T-6: BaseLayout with semantic landmarks + head slot

- **Ticket:** T-6 (`docs/tickets/tickets-personal-website.md` — REG-4, SEO-9, NF-2, NF-3, NF-5)
- **Baseline:** `bf53577` (T-5); working-tree delta under test
- **QA date:** 2026-09-22 · **Platform:** darwin
- **Changed paths (exactly 3):** `src/layouts/BaseLayout.astro` (new), `src/assets/styles/global.css` (new), `docs/tickets/tickets-personal-website.md` (M — T-6 checkbox flip only)

## Verdict: **Pass**

All 5 acceptance criteria verified against source **and** rendered (scratch-harness) output. No bugs found in T-6 scope. Zero blockers. Caveat-level items (favicon continuity, transient missing `<title>` until T-12) are downstream-ticket responsibilities — none violate T-6's contract.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `<html lang="en">`, `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<header>`(+`<nav>` T-5), `<main><slot /></main>`, `<footer>` | `BaseLayout.astro:22-43` source; **rendered harness**: `<!DOCTYPE html><html lang="en">…<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">…<header><nav aria-label="Main">…</nav></header><main id="main">…</main><footer><p>© 2026 Matthew O&#39;Connell</p></footer>` — real `<nav aria-label="Main">` emitted by Nav.astro inside `<header>`, exactly per T-5 contract | Pass |
| 2 | Head slot for per-route title/meta/canonical (filled by T-12) | `BaseLayout.astro:28` `<slot name="head" />` inside `<head>`; harness-confirmed: title/meta land inside `<head>` — slot wiring works at build time | Pass |
| 3 | Zero `<script>` tags; no client JS | No `<script>` (only a `<style>` block); rendered output: `rg '<script'` → no match; no `on*=`/`style=` attributes; no inline styles | Pass |
| 4 | Footer minimal copyright, name from registry home entry, not hardcoded | `BaseLayout.astro:14-19` (`sections.find(slug==='home')` → fail-fast throw if absent), `:40` `© {year} {home.data.title}`, `:19` `new Date().getFullYear()`; rendered `© 2026 Matthew O'Connell` (= registry `home.md` title). Fail-fast **executed**: removing `home.md` → build error `Registry must contain a "home" section — the layout footer copyright derives from it.` | Pass |
| 5 | Styling: plain scoped CSS + one global.css; no Tailwind | `global.css` imported at `BaseLayout.astro:12`; single scoped `<style>` at `:45`; zero Tailwind deps/config/`@apply` anywhere | Pass |

## Validation gates (all executed)

1. **Scope integrity** — `git status --short --untracked-files=all` shows exactly the 3 paths; `git diff` = one-line T-6 flip only; no `astro.config.mjs`/`index.astro`/`Nav.astro`/`package.json`/content changes. Pass.
2. **Typecheck** — `npm run check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod `.url()` deprecations at `src/content.config.ts:15,16` — known debt, not a regression). Pass.
3. **Build** — `npm run build` exit 0, 1 page built. Pass.
4. **Ticket verifier** — `rg '<header|<main|<footer|<nav'` matches lines 3/32/33/36/39 (charset/landmarks); `rg 'slot'` matches `<slot name="head" />` + `<slot />`. The real `<nav>` tag is comment-only at source level (landmark emitted by Nav.astro); rendered gap closed by the harness — `<nav aria-label="Main">` with `/` (active), `/resume/`, `/about/` present in built output. Pass.
5. **Zero-JS** — `<script` no match; event-handler attrs no match; `style=` no match (prose-comment matches only). Pass.
6. **Token byte-exactness (§6.2/§6.3/§6.4)** — every value in `global.css:8-42` matches tech design verbatim: all 7 hexes, full `--font-sans` stack, all clamps, `65ch`, spaces, `48rem`, `1.25rem`, `44px`. No invented values. Every `var()` ref carries a literal fallback (13 in BaseLayout, 7 in global.css). Pass.
7. **CSS scoping hygiene** — layout `<style>` auto-scoped (`data-astro-cid` verified in rendered CSS), `global.css` global by design; no leakage. Global heading baseline (600/margin 0/`--lh-h2`) is design-consistent; T-8 home `h1` needs `--fs-hero`+`--lh-hero:1.05` (design-mandated; scoped selector beats global). Global focus ring exactly §6.5. Pass.
8. **Skip-link (WCAG 2.4.1)** — first `<body>` element, `href="#main"` targets `<main id="main">`; hidden at `left:-9999px` (no horizontal-scroll risk); focused at gutter top-left with surface bg/accent text/600/8px radius + global `a:focus` outline. Pass.
9. **Responsive (NF-2)** — header/main/footer `max-width:48rem; margin-inline:auto; padding-inline:var(--gutter)`; footer line ≈165px at 375px (335px content width) — no horizontal-scroll risk. Pass.
10. **Registry derivation (REG-4)** — zero hardcoded section paths/names in the layout; only dynamic name is the registry home entry. Pass.

## E2E / manual cases

- **Rendered page chrome** (scratch harness in temp dir, working tree untouched): all landmarks + slots + footer render byte-exact; home auto-active at `/`; trailing slashes per `sectionPath()`. Pass.
- **Head slot wiring**: harness `<Fragment slot="head">` content renders inline in `<head>` after the viewport meta. Pass.
- **Error state**: removing `home.md` → loud build-time failure with actionable message; harness restored. Pass.
- **Mobile/desktop**: 375px footer/nav fit without scroll; ≥768px nav row `space-between` on container-centered column. Pass (formal sweep deferred to T-21 per plan).
- No SSR/runtime/permissions/offline states exist (pure static output) — n/a.

## Bugs found

None.

## Watch-items for downstream tickets

| ID | Severity | Watch-item | Disposition |
|---|---|---|---|
| W-1 | Info (watch) | **Favicon continuity (T-7):** scaffold `index.astro` links `/favicon.svg`+`/favicon.ico`; BaseLayout head has none. Tech design §12.5 ships **no favicon** in v1 → T-7 replacing that page may drop them without regression (by design). | T-7 |
| W-2 | Info (watch) | **Title transiency (T-7→T-12):** routed pages before T-12 ship an empty head slot (no `<title>`). Per spec the slot is filled by T-12's Seo; T-21's Lighthouse title audit depends on it landing. | T-12 |
| W-3 | Info (watch) | **Trailing-slash active state (T-7):** `Astro.url.pathname === sectionPath(entry)` presumes `trailingSlash:'always'` (lands at T-7). T-7 verifier must assert the canonical trailing-slash form in dist. | T-7 |
| W-4 | Info | **T-20 scanner:** layout output passes zero-JS + zero-third-party scans (no scripts, no external origins in rendered output; JSON-LD exemption only needed for T-13/T-14 bodies). | T-20 |
| W-5 | Info | **Skip-link quirk (T-21):** `left:-9999px` technique carries a classic focus-scroll quirk on some browsers — re-verify in the a11y sweep. Also confirm `© {year}` matches deploy-year expectations. | T-21 |
| W-6 | Info | **T-8 override contract:** home `h1` must set `--fs-hero` + `--lh-hero: 1.05` over the global heading baseline. | T-8 |

## Regression risk (T-7 → T-24)

- **T-7 (route):** first consumer. All slots verified renderable; layout's `await getSections()` coexists with the route's `getStaticPaths` (content layer cached per build). No structural blocker.
- **T-8/T-9/T-10 (templates):** global reset is benign (design-intended); scoped specificity beats global rules for mandated token overrides. No leakage.
- **T-11 (404):** layout reusable as-is (registry-agnostic); `noindex` via head slot + CTA in main. No blocker.
- **T-12 (Seo):** head-slot contract verified end-to-end. No blocker.
- **T-13/T-14 (JSON-LD):** body placement per design — layout unaffected.
- **T-17 (fonts):** `global.css` explicitly reserves `@font-face` for T-17; current stack is the §6.3 system fallback. No conflict.
- **T-20 (verify-static), T-21 (QA), T-22 (extensibility):** layout output passes the scan; registry-agnostic (no hardcoded paths/names beyond the `home` slug lookup mirroring `sectionPath`). No interaction.
- **T-23/T-24 (human-blocked):** owner copy flows into `home.data.title` → footer updates automatically; zero hardcoding = zero touch-up.
- Earlier tickets (T-1..T-5 files) untouched — no regression possible.

## Recommendation

Sign-off. T-6 satisfies its acceptance criteria and the normative tech-design/UI-spec supersessions (prop-less layout, `<nav>` via Nav.astro). Remaining untested items are legitimately deferred to T-7/T-12/T-21. Proceed to the commit step.
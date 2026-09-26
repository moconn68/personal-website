# QA Report — T-8: Home scan-page template

- **Ticket:** T-8 (`projects/initial-site/tickets/tickets.md` — US-1, US-2, US-4, HOME-1..5, NF-2, NF-5, REG-3)
- **Baseline:** `d944576` (T-6); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 2):** `src/templates/HomeSection.astro` (new), `projects/initial-site/tickets/tickets.md` (M — T-8 checkbox flip + execution-deviations note)

## Verdict: **Pass**

All 6 acceptance criteria verified against source **and** rendered output (throwaway scratch page, removed afterward — tree clean). No bugs found in T-8 scope. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `<h1>` = owner name; role-in-domain + primary stack above the fold on 375px; real selectable text | `HomeSection.astro`: `<section class="hero"><h1>{entry.data.title}</h1><div class="hero-lead"><Content /></div>`; body rendered from `home.md` via `render(entry)` at `HomeSection.astro:23` → scratch output: `<h1>Matthew O'Connell</h1>` + two real `<p>` markdown paragraphs (role-in-domain, primary stack). Body stored in markdown → real text nodes (HOME-1). | Pass |
| 2 | Condensed proof line below hero, rendered from home content body/description | `<p class="hero-proof">{entry.data.description}</p>`; scratch output: `HUMAN COPY — condensed proof line (years of experience, kind of work). ≤160 chars.` — single `description` source doubles as proof line (design §4.4, SEO-7 ≤160 enforced at schema). | Pass |
| 3 | Prominent link row: GitHub, LinkedIn, Résumé, About; GitHub/LinkedIn from typed frontmatter; touch targets ≥44px | `.link-chip` links: GitHub/LinkedIn from `entry.data.github`/`.linkedin` with `target="_blank" rel="noopener noreferrer"`; Résumé/About from `sectionPath()` of registry entries (design §6.4, REG-3). `min-height:var(--touch-min,44px); min-width:var(--touch-min,44px)` byte-exact (compiled CSS confirmed). | Pass |
| 4 | Zero animations, zero stock photos, content-first | No `animation`/`transition`/`@keyframes` anywhere; only decorative SVG icons (20×20, `aria-hidden`) adjacent to real text labels (UI §3.1 decision — functional, not decorative imagery). | Pass |
| 5 | No horizontal scroll to 375px; mobile-first CSS | Mobile-first: hero/link-row single-column flex; `flex-wrap` link row wraps within 375px content width (335px @ gutter); ≥768px only adds a row gap. No fixed widths/min-widths that could overflow. Formal 375/390/430px sweep deferred to T-21 per plan. | Pass |
| 6 | Identity copy stays HUMAN COPY placeholders pending T-23 | Template reads name/role/stack/proof/URLs entirely from registry entry — renders the existing `HUMAN COPY` placeholder values verbatim; dev invents no biography. | Pass |

## Validation gates (all executed)

1. **Scope integrity** — `git status --short` shows exactly `src/templates/` (new) + `projects/initial-site/tickets/...` (M, one-line flip + deviation note); scratch page removed; no earlier-ticket files touched. Pass.
2. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod `.url()` deprecations — known debt, not a regression). Pass.
3. **Build** — `npm run build` exit 0 (scaffold, 1 page — template is unrouted until T-7, per the ticket's own NOTE). Pass.
4. **Ticket verifier** — `rg 'GitHub|LinkedIn' src/templates/HomeSection.astro` matches (labels + markup). Literal `rg 'href="/resume|href="/about'` gate is **un-runnable by design** (REG-3/design §6.4: section links must be `sectionPath()`-derived — recorded as an execution deviation on the ticket, same precedence as T-5's `[FIXED per plan review]` gate). Rendered assertions were run against the scratch page: `href="/resume/"`, `href="/about/"`, `href="https://github.com/"`, `href="https://www.linkedin.com/"` all present with the trailing-slash canonical form. Pass.
5. **Zero-JS (NF-5)** — `rg '<script|onclick=|onload=|style=' dist/scratch-t8/index.html` → no match (no JS, no event-handler attrs, no inline styles; only the `<style>`-el comments). Pass.
6. **Token discipline (§6.2–§6.4)** — only sanctioned hexes as fallbacks (`#18181b`, `#52525b`, `#fff`/`#ffffff`, `#e4e4e7`, `#172554`, `#1e40af`); every `var()` ref carries a literal fallback; no `:root` redefinition; spacing/clamp values from §6.3/§6.4 byte-exact. Pass.
7. **W-6 watcher (T-6 QA)** — home `h1` overrides the global heading baseline: compiled `.hero h1 {font-size:var(--fs-hero,clamp(2rem, 1.5rem + 2.6vw, 3.25rem));line-height:var(--lh-hero,1.05)}`. Pass.
8. **Markdown body rendering** — `render(entry)` → `<Content />` (design §6.6 pattern, same as T-10 About): two `<p>` nodes emitted; `.hero-lead p:first-of-type` → `--fs-lead`, `:not(:first-of-type)` → `--fs-body` (UI §3.1 content slots). Pass.
9. **CSS scoping hygiene** — Astro auto-scoped (`data-astro-cid-o5tre4zs` verified in rendered CSS); no global leakage; chip border/radius/background use design tokens. Pass.
10. **Registry purity (REG-3)** — `rg 'href="/resume"|href="/about"' src/templates/HomeSection.astro` → no match; no literal section labels beyond `navLabel` values in markup. Pass.

## E2E / manual cases

- **Rendered home scan page** (scratch harness `src/pages/scratch-t8.astro` in temp, then removed): full `<main>` output = `<section class="hero">` → `h1` (name) → lead (role) → stack → proof (description) → link row with GitHub/LinkedIn (icon + label, external) and Résumé/About (registry-derived). Content order matches UI §3.1 scanner flow 1–5 exactly. Pass.
- **Resilience**: GitHub/LinkedIn chips render only when the optional frontmatter URL is present; registry-linked Résumé/About chips drop out if unregistered (REG-3). In the real registry all four render. Pass.
- **Active-state / nav**: nav rendered by BaseLayout in the harness auto-actives Home at `/` (T-5 behavior, unchanged). Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | Rendered-output assertions (`GitHub`/`LinkedIn` chips, `href="/resume/"`, `href="/about/"`) re-verified at **T-7** in `dist/index.html`; scratch harness here was throwaway. | T-7 |
| W-2 | Info | Proof-line/description shared source: T-23 copy must keep `description` ≤160 chars and double as the proof line + meta description; changing it shifts the hero's copy automatically. | T-23 |
| W-3 | Info | GitHub/LinkedIn placeholder URLs (`https://github.com/`, `https://www.linkedin.com/`) are real-looking root links until T-23 replaces them — never blank, never fabricated profile paths. | T-23 |
| W-4 | Info | Chip borders (`--color-border` + `background: --color-surface`) were chosen per the UI wireframe's boxed link row; contrast re-audited at T-21. | T-21 |

## Regression risk (T-7 → T-24)

- **T-7 (route):** passes `entry` + `sections` (design §5.1 contract) — `Props { entry: SectionEntry; sections: SectionEntry[] }` matches; glob dispatch resolves `../templates/HomeSection.astro`. Ready.
- **T-9/T-10:** siblings; same props contract; no shared styling beyond global tokens (independent scoped styles). No interaction.
- **T-12 (Seo):** head slot unaffected; description derivation uses the same `entry.data.description`. No blocker.
- **T-13 (JSON-LD):** data block injected at top of the Home template body per design §8.3 — the template's root `<section>` is the insertion site. No conflict.
- **T-17 (fonts):** template uses `--font-sans` tokens; @font-face lands in `global.css`. No conflict.
- **T-20 (verify-static):** scaffold output minus the scratch page → no scripts, no external origins; the SVG icons are inline data (zero network). No interaction.
- **T-21 (QA):** hero/link-row 375/390/430px sweep + chip contrast — the formal home-page visual QA. Expected pass from this design.
- **T-23 (human copy):** all facts flow from the registry — copy edits require zero template changes.
- Earlier tickets (T-1..T-6 files) untouched — no regression possible.

## Recommendation

Sign-off. T-8 satisfies its acceptance criteria and the normative tech-design supersession (`sectionPath()` over the ticket's literal href verifier wording, consistent with the T-5 precedent). Remaining untested items are legitimately deferred to T-7/T-13/T-21. Proceed to the commit step.
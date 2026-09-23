# QA Report — T-5: Nav component driven entirely by the sections registry

- **Ticket:** T-5 (`docs/tickets/tickets-personal-website.md` — REG-3, US-10, US-2, NF-2, NF-3, NF-5)
- **Baseline:** `6b26b58` (T-4); working-tree delta under test
- **QA date:** 2026-09-22 · **Platform:** darwin
- **Changed paths (exactly 2):** `src/components/Nav.astro` (U — new), `docs/tickets/tickets-personal-website.md` (M — T-5 checkbox flip only)

## Verdict: **Pass**

All 10 validation gates pass. Build green, typecheck clean (0 errors / 0 warnings), registry purity confirmed (no hardcoded links), URL policy correct (`sectionPath()`, trailing-slash byte-consistency), a11y baseline complete, zero-JS/hard constraints upheld, token fallback hexes byte-exact, responsive spec encoded (mobile stack / desktop `space-between`), and scope integrity holds. No bugs found.

## Acceptance criteria evidence

| Criterion | Result |
|---|---|
| `<nav><ul>` iterating `getSections()`, `<a href={sectionPath(entry)}>` showing `navLabel` (home → `/`) | Pass — `const sections: SectionEntry[] = await getSections();` then `sections.map(...)`; href via `sectionPath()` per tech design §4.4 (design supersedes ticket's literal `href="/{slug}"` wording) |
| Zero hardcoded section links (REG-3, US-10) | Pass — `rg 'href="/resume"|href="/about"' src/components/Nav.astro` → no match (ticket's `!`-gate); no literal section labels in markup/CSS/comments |
| Active/current styles via `Astro.url.pathname`, `aria-current="page"` on active (NF-3) | Pass — `isActive = Astro.url.pathname === sectionPath(entry)`; `class:list={{ active: isActive }}`; active visual = accent + 2px accent border + aria-current (never color alone) |
| Touch target ≥44px on every link (NF-2, US-2) | Pass — `min-height: var(--touch-min, 44px); min-width: var(--touch-min, 44px)` on all links |
| Desktop nav right-aligned, brand home left (UI §4.1 `[UI adds]`) | Pass — `@media (min-width: 768px)` `justify-content: space-between`, `gap: var(--space-4, 1rem)` |

## Validation gates (all executed)

1. **Scope integrity** — `git status --short` shows exactly `docs/tickets/...` (M) + `src/components/` (U); `src/components/` contains only `Nav.astro`; no earlier-ticket files touched. Pass.
2. **Build** — `npm run build` exit 0 (scaffold, 1 page). Pass.
3. **Typecheck** — `npm run check` exit 0, 0 errors / 0 warnings (2 hints = pre-existing T-2 zod `.url()` deprecations, out of scope). Pass.
4. **Registry purity** — `rg 'href="/resume"|href="/about"'` no match; `rg 'Résumé|About|Home'` no literal labels. Pass.
5. **URL policy** — href = `sectionPath(entry)` (home `/`, others `/{slug}/`; R8 byte-consistency with `site.ts::path()`). Pass.
6. **A11y** — `<nav aria-label="Main">`; `aria-current` only when active; `:focus`/`:focus-visible` outline 2px accent + 2px offset, never `outline: none`; always-underlined links; active = accent + underline together. Pass.
7. **Zero-JS (NF-5 / UI §8)** — no `<script>` tags, no event-handler attributes, no `style=` attributes, no inline styles, no CSS-in-JS (only prose comment mentions the words). Pass.
8. **Token discipline** — only hexes `#18181b`/`#1e40af`/`#172554` (byte-exact §6.2, all as fallbacks); all `var()` refs carry fallbacks; no `:root` redefinition. Pass.
9. **Responsive** — mobile default column stack left-aligned (`gap: var(--space-1, 0.25rem)`); ≥768px row + `space-between` + `gap: var(--space-4, 1rem)`. Pass.
10. **Type discipline** — `SectionEntry[]`, awaited `getSections()`, no `any`, no unused imports, `astro check` clean. Pass.

## E2E / manual cases

Deferred by rank (component is unrendered until T-6/T-7 — plan risk #4 verifier-at-rank discipline): rendered nav links in `dist/`, runtime active-state, keyboard sweep, 375/390/430px visual sweep → T-7 assertion list and T-21 a11y/visual QA. Source-level contracts for each are verified above.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | Desktop `space-between` split and mobile stack are static-encoded; visual confirmation only possible once T-6/T-7 render the nav | T-21 formal visual sweep |
| W-2 | Info (watch) | Active-state equality `Astro.url.pathname === sectionPath(entry)` presumes `trailingSlash: 'always'` (lands at T-7). Until then a no-slash request could transiently fail to highlight. | T-7 verifier must assert the canonical `/resume/` (trailing slash) form |
| W-3 | Info | 2 zod `.url()` deprecation hints in `src/content.config.ts` = T-2 debt, not a T-5 regression | Tracked in T-2 QA report |
| W-4 | Info | Nav labels render registry `navLabel`s ("Home"/"Résumé"/"About"); final copy is T-23 territory | — |

## Regression risk (T-6 → T-24)

- **T-6 (BaseLayout)** drops `<Nav />` into `<header>` — component self-contained (imports only `../config/sections`); no layout changes needed.
- **T-7 (route)** — Nav active-state correctness at runtime depends on T-7 setting `trailingSlash: 'always'`; dist-level nav assertions move here as designed. Do **not** reorder.
- **T-8/T-9 (Home/Résumé link rows)** must mirror the same `sectionPath()` discipline (REG-3, design §6.4) — Nav.astro is now the reference pattern.
- **T-15/T-12 (sitemap/canonical)** share the same slug→URL mapping — byte-consistency preserved via the shared helper.
- **T-20 (verify gate)** scans `dist/` for JS markers; Nav ships none at source level — no interaction expected.
- **T-22 (extensibility)** will prove the reverse direction (`now.md` + `NowSection.astro` → nav link appears with zero edits to this file).
- Earlier tickets (T-1..T-4 files) untouched — no regression possible.

## Recommendation

Sign-off. T-5 satisfies its acceptance criteria and the normative tech-design supersession (`sectionPath()` over the ticket's literal href wording). Remaining untested items are legitimately deferred to T-7/T-21 per the ticket's `[FIXED per plan review]` amendment. Proceed to the commit step.
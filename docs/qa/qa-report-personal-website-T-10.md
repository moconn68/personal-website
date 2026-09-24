# QA Report — T-10: About template

- **Ticket:** T-10 (`docs/tickets/tickets-personal-website.md` — ABT-1..4, US-8, NF-2, NF-3)
- **Baseline:** `332c187` (T-9); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 2):** `src/templates/AboutSection.astro` (new), `docs/tickets/tickets-personal-website.md` (M — T-10 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified against source. No bugs found in T-10 scope. Zero blockers. Rendered-output assertion legitimately deferred to T-7 per the ticket's own `[FIXED per plan review]` note.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Renders the about content body via the Astro content renderer (`render()`/`<Content />`) | `AboutSection.astro:16` — `const { Content } = await render(entry)`; markup `<div class="about-body"><Content /></div>` (design §6.6 pattern; same as HomeSection). | Pass |
| 2 | Typography mobile-responsive, semantic `<article>` markup | `<article class="about">` wrapper (ABT-4, §6.5 "prose uses `<article>` on About"); `--fs-body` 400 / `--lh-body` 1.6, max-width `--measure` (65ch); no fixed widths → no horizontal scroll at 375px. | Pass |
| 3 | Zero structural assumptions about paragraph count/voice | Styling targets `.about-body p` generically with `margin-block-end: var(--space-5)`; last paragraph collapses its margin. Renders whatever markdown ships (today: the four HUMAN COPY paragraphs from T-3 skeleton; count/voice is T-23 copy concern). | Pass |

## Validation gates (all executed)

1. **Scope integrity** — `git status --short` shows exactly `src/templates/` (new) + `docs/tickets/...` (M, one-line checkbox flip); no earlier-ticket files touched. Pass.
2. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod `.url()` deprecations — known debt). Pass.
3. **Build** — `npm run build` exit 0 (scaffold, 1 page — template unrouted until T-7). Pass.
4. **Ticket verifier** — `rg -c '<article' src/templates/AboutSection.astro` → 3 (opening tag + two comment references); ≥1. Pass.
5. **Zero-JS (NF-5)** — no `<script>`, no event-handler attributes, no `style=` attributes. Pass.
6. **Token discipline (§6.2–§6.4)** — only sanctioned values; every `var()` carries a literal fallback; no `:root` redefinition; `--measure`/`--space-5`/`--fs-h2`/`--lh-h2` byte-exact per UI §3.3. Pass.
7. **CSS scoping hygiene** — Astro auto-scopes; prose rules cannot leak into Nav/footer. Pass.
8. **Prose-cap constraint (NF-2)** — body constrained to `--measure` 65ch; article vertically left-aligned; no horizontal overflow at 375px. Pass.

## E2E / manual cases

- **Deferred to T-7**: no route renders the template yet; rendered-prose check (`dist/about/index.html` containing the four markdown `<p>`s) runs once T-7 routes exist. Consistent with T-8/T-9 precedent.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | Rendered-output assertion (`dist/about/index.html` shows ABOUT placeholder paragraphs) verified at **T-7**. | T-7 |
| W-2 | Info | T-23 human copy can add headings/lists; template styles `p` only. If T-23 ships markdown beyond paragraphs, a follow-up styling tweak may be needed (outside this ticket's zero-structural-assumption constraint). | T-23 |
| W-3 | Info | Contrast/typography formally re-audited at T-21. | T-21 |

## Regression risk (T-7 → T-24)

- **T-7 (route):** passes `entry` + `sections` (design §5.1) — matches. Glob resolves `../templates/AboutSection.astro`. Ready.
- **T-10 == T-8/T-9 sibling:** independent scoped styles; no interaction.
- **T-17 (fonts):** `--font-sans` tokens; @font-face lands later. No conflict.
- **T-12 (Seo):** head slot unaffected. No blocker.
- Earlier tickets files untouched — no regression possible.

## Recommendation

Sign-off. T-10 satisfies its acceptance criteria and the UI §3.3 typography spec. Remaining untested items legitimately deferred to T-7/T-21/T-23. Proceed to the commit step.
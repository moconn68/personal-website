# QA Report — T-9: Résumé landing template

- **Ticket:** T-9 (`projects/personal-website/tickets/tickets.md` — RES-1, RES-4, US-5, OQ-1, NF-2, NF-5)
- **Baseline:** `f076f90` (T-8); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 2):** `src/templates/ResumeSection.astro` (new), `projects/personal-website/tickets/tickets.md` (M — T-9 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified against source. No bugs found in T-9 scope. Zero blockers. Rendered-output assertion legitimately deferred to T-7 per the ticket's own `[FIXED per plan review]` note (the route that renders templates doesn't exist until T-7).

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | Page title, one line of context from registry `description`, prominent **"Download résumé (PDF)"** anchor → `/resume.pdf` | `ResumeSection.astro:25` — `<h1>{entry.data.title}</h1>` (registry title "Résumé"); `<p class="resume-context">{entry.data.description}</p>` (the ≤160-char registry description); `<a class="btn-download" href="/resume.pdf">Download résumé (PDF)</a>`. Ticket verifier `rg 'Download résumé \(PDF\)|href="/resume.pdf'` matches. | Pass |
| 2 | Download button is the unambiguous primary action: touch target ≥44px, high contrast, mobile-first; no competing CTAs | `.btn-download` = `.btn-download { min-height: 48px; padding-inline: 1.5rem; font-weight: 600; color: var(--color-surface, #ffffff); background: var(--color-accent, #1e40af); border-radius: 8px }` — byte-exact per tech design §6.4 token (≥44px touch target, accent-on-white contrast, re-audited at T-21). Page contains exactly one CTA; no secondary actions. | Pass |
| 3 | No résumé content authored or rendered in HTML | Template renders only title + description + button. No `<embed>`/`<iframe>`/`<object>`/rendered markdown; resume.md body is empty by design. RES-1/OQ-1 satisfied — the PDF *is* the résumé. | Pass |

## Validation gates (all executed)

1. **Scope integrity** — `git status --short` shows exactly `src/templates/` (new) + `projects/personal-website/tickets/...` (M, one-line checkbox flip); no earlier-ticket files touched. Pass.
2. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod `.url()` deprecations — known debt, not a regression). Pass.
3. **Build** — `npm run build` exit 0 (scaffold, 1 page — template is unrouted until T-7, per the ticket's own NOTE). Pass.
4. **Ticket verifier** — `rg 'Download résumé \(PDF\)|href="/resume.pdf' src/templates/ResumeSection.astro` matches both. `/resume.pdf` is a static file path (not a section route), so the literal href is correct here and exempt from REG-3 (which constrains *section* links). Rendered-output assertion (`dist/resume/index.html` containing the anchor) lands at T-7. Pass.
5. **Zero-JS (NF-5)** — no `<script>`, no `onclick=`/`onload=`, no `style=` attributes; all styling in the scoped block. Pass.
6. **Token discipline (§6.2–§6.4)** — only sanctioned hexes as fallbacks (`#52525b`, `#ffffff`, `#1e40af`, `#172554`); every `var()` ref carries a literal fallback; no `:root` redefinition; `.btn-download` values byte-exact per §6.4. Pass.
7. **CSS scoping hygiene** — Astro auto-scopes; component styles cannot leak into Nav/footer. Pass.
8. **Accessibility baseline (§6.5)** — the CTA is an `<a>` (keyboard-navigable by default), 48px min-height (≥--touch-min 44px), focus ring explicit via `:focus-visible`/`:focus` (never `outline: none`), link affordance is not color-alone (it's a *button-like* primary action with border + background per the §6.4 token; the page still defaults to a visible focus ring). Pass.

## E2E / manual cases

- **Deferred to T-7**: no route renders the template yet, so no rendered-page manual case is runnable at this rank (consistent with the ticket's `[FIXED per plan review]` gate and T-8's precedent). The section-page sibling (`HomeSection.astro`) was rendered via a throwaway scratch harness at T-8 and will be re-asserted in `dist/` once T-7 routes exist.
- **Empty-state (UI §3.2 `[UI adds]`)**: `/resume.pdf` 404s by design until T-24 supplies the file; the 404 page (T-11) handles the fallback gracefully. Button href is stable and correct.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | Rendered-output assertion (`dist/resume/index.html` containing `href="/resume.pdf"` + "Download résumé (PDF)") verified at **T-7**, when the route builds the template. | T-7 |
| W-2 | Info | **T-20 (verify-static)**: the résumé page's `href="/resume.pdf"` anchor presence is one of that script's presence asserts — consistent with this template (the literal file path is preserved for the verifier). | T-20 |
| W-3 | Info | Button contrast (accent `#1e40af` bg / white text) formally re-audited at T-21 alongside chip contrast. | T-21 |
| W-4 | Info | `sections` prop is declared and received per the design §5.1 uniform contract (entry + full registry) though unused by this template — kept for contract uniformity, matching HomeSection. | — |

## Regression risk (T-7 → T-24)

- **T-7 (route):** passes `entry` + `sections` (design §5.1 contract) — `Props { entry: SectionEntry; sections: SectionEntry[] }` matches; glob dispatch resolves `../templates/ResumeSection.astro`. Ready.
- **T-10:** sibling about template; independent scoped styles; no interaction.
- **T-14 (ProfilePage JSON-LD):** data block injected into the Résumé template body per design §8.3 — root `<section>` is the insertion site. No conflict.
- **T-24 (PDF):** button href already stable at `/resume.pdf`; content-add of the PDF requires zero template changes.
- **T-17 (fonts):** uses `--font-sans` tokens; @font-face lands in `global.css`. No conflict.
- **T-12 (Seo):** head slot unaffected; title/description derive from the same registry fields. No blocker.
- Earlier tickets (T-1..T-6, T-8) files untouched — no regression possible.

## Recommendation

Sign-off. T-9 satisfies its acceptance criteria and the §6.4 `.btn-download` token. Remaining untested items are legitimately deferred to T-7/T-14/T-20/T-21/T-24. Proceed to the commit step.
# UI/UX Design Specification — Personal Website v1

> **Upstream:** `projects/initial-site/PRDs/PRD.md` (v1.5) · `projects/initial-site/designs/tech-design.md`
> **Status:** Normative for visual/interaction implementation. All design tokens reproduce the tech design §6 byte-for-byte. Where the tech design left latitude, new details are marked `[UI adds]`.
> **Date:** 2026-09-26 · **Author:** UI/UX Designer (AI SDLC)  
> **Project:** `initial-site` — specifies the **three** initial surfaces only (Home, About, and the shared layout/nav/404 chrome). No screens, states, or tokens for the deferred sections (Projects, Blog, Now, Uses); those arrive with their own projects.

> ### ⚠ Revision 2026-09-26 — PRD v1.5 removed the résumé surface
>
> The résumé landing page (§3.2 in v1.2) is **deleted from this spec**, not redesigned. It was already
> built; the removal tickets `T-25`/`T-26` delete it and this document tells the dev what the site looks
> like afterwards. Changes are marked **[v1.5]**.
>
> - **Screens: 3 → 2** (Home, About) plus fixed 404.
> - **Nav: 3 items → 2** (Home, About). The two-item nav is why §5's "no hamburger" reasoning is now stronger, not weaker.
> - **Home link row: 4 links → 3** (GitHub, LinkedIn, About).
> - **`.btn-download` → `.btn-primary`** — the résumé's "Download PDF" CTA is gone, and the 404's "Back to home" link is the token's only remaining consumer. The rename keeps the class name honest.
> - **Persona re-target:** the *Hiring Manager* no longer gets a spare download page. They get the About page and the two profile links — so §3.3's About spec, and the link row's prominence, now carry that persona. This is a deliberate trade PRD v1.5 accepts: fewer surfaces, each one doing more work.
> - No new tokens, colors, or type scale entries are introduced by this revision. Deleting a page cannot create a visual need.

---

## 1. Design Principles

### Brand thesis (one line)

> **Owned, opinionated, honest — engineered taste; zero decoration that delays content.**

This thesis maps directly to every visual decision:

- **Owned:** Every surface reads as self-authored, not template-derived. No stock imagery, no generic patterns, no borrowed chrome.
- **Opinionated:** Specific typographic choices (IBM Plex Sans 400/600), a restrained palette, left-aligned hero with tight leading. The site *has a point of view* — it does not try to please everyone.
- **Honest:** Real text, not screenshots of text. No animations that fake polish. **[v1.5]** The site shows only what it actually is: two real pages and links to the owner's real profiles. It does not offer a résumé download, and it does not pretend a LinkedIn link is a substitute for one — the About page carries the work-history narrative in the owner's own words instead.
- **Engineered taste:** The architecture itself is the signal. Scoped CSS, zero JS, typed content, trailing-slash discipline — the build quality is the aesthetic.
- **Zero decoration that delays content:** Nothing visual exists that is not required to convey the information. No decorative images, no gratuitous transitions, no visual filler.

### Persona tone mapping

| Persona | What the design communicates in the first 6 seconds |
|---|---|
| **Scanning Recruiter** | Clean hierarchy, generous whitespace, no noise → "this person has judgment." Name/role/stack/proof line parse instantly. GitHub/LinkedIn findable without hunting. |
| **Hiring Manager** | **[v1.5]** No landing page to assess — the About page and the profile links do the work. First-person prose at a comfortable measure, plus GitHub/LinkedIn one click from the hero. The signal is *writing*, not a download button. |
| **Curious Peer** | About page uses first-person article typography at comfortable measure (~65ch). Warm, readable, human — not a CV recital. |

---

## 2. Design Tokens Reconciliation

> **Authority:** Tech design §6.2 (colors), §6.3 (typography/spacing), §6.4 (layout/component tokens). Every value below is reproduced verbatim from the tech design. No new hex values are introduced unless marked `[UI adds]`.

### 2.1 Color palette

| Token | Hex | Usage | Contrast vs `--color-bg` |
|---|---|---|---|
| `--color-bg` | `#fafaf9` | Page background | — |
| `--color-text` | `#18181b` | Body text, headings | ≈17:1 (AAA) |
| `--color-muted` | `#52525b` | Proof line, meta text, footer | ≈7.4:1 (AAA) |
| `--color-accent` | `#1e40af` | Links, active nav, focus ring, CTA background | ≈8.3:1 (AAA) |
| `--color-accent-hover` | `#172554` | Link/CTA hover state | ≈10:1 (AAA) |
| `--color-border` | `#e4e4e7` | Hairline dividers (decorative only; never sole text-defining element) | n/a |
| `--color-surface` | `#ffffff` | CTA text on accent background | white-on-accent ≈8.3:1 (AAA) |

All text/background pairings pass WCAG AA for normal text (≥4.5:1) and exceed ≥7:1 (AAA). Ratios are approximated to 0.1; QA (T-21) owns authoritative measurement.

### 2.2 Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | All text (single family) |
| `--fs-hero` | `clamp(2rem, 1.5rem + 2.6vw, 3.25rem)` | Home `h1` (name) |
| `--fs-h2` | `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)` | Subpage `h1`s, `h2`s |
| `--fs-lead` | `clamp(1.0625rem, 1.0rem + 0.4vw, 1.25rem)` | Role-in-domain line |
| `--fs-body` | `1rem` | Body paragraphs |
| `--fs-small` | `0.875rem` | Proof line, meta, footer |
| `--lh-hero` | `1.05` | Home hero heading |
| `--lh-h2` | `1.2` | Section headings |
| `--lh-body` | `1.6` | Body paragraphs |
| `--measure` | `65ch` | Max line length for prose |

Weights: **400** (body) and **600** (headings, CTA text, nav). Self-hosted WOFF2 subset via `subset-font`; `font-display: swap`.

### 2.3 Spacing & layout

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `0.25rem` | Tight internal spacing |
| `--space-2` | `0.5rem` | Small gaps |
| `--space-3` | `0.75rem` | Medium-small gaps |
| `--space-4` | `1rem` | Standard gap |
| `--space-5` | `1.5rem` | Section internal spacing |
| `--space-6` | `2rem` | Between major blocks |
| `--space-7` | `3rem` | Large vertical separation |
| `--space-8` | `4rem` | Largest vertical separation |
| `--container` | `48rem` | Max content width |
| `--gutter` | `1.25rem` | Horizontal padding at 375px floor |
| `--touch-min` | `44px` | Minimum touch target size |

Section vertical rhythm: `clamp(3rem, 8vh, 5rem)` between major blocks. Container centers at `--container` with `padding-inline: var(--gutter)`.

### 2.4 Component tokens

| Token | Description |
|---|---|
| `.btn-primary` **[v1.5, renamed from `.btn-download`]** | `min-height: 48px`, `padding-inline: 1.5rem`, accent background (`--color-accent`), white text (`--color-surface`), 600 weight, `border-radius: 8px`, `display: inline-flex; align-items: center`. Hover → `--color-accent-hover`. Focus ring visible. |
| `.skip-link` | Visually hidden; first element in `<body>`; targets `#main`. Visible on focus. |
| Focus ring | `outline: 2px solid var(--color-accent); outline-offset: 2px` on `:focus-visible` and `:focus`. Never `outline: none`. |

---

## 3. Page-by-Page UI Spec

### 3.1 Home (Scan Page)

**Purpose:** Six-second identity parse. Name, role, domain, stack, proof line, and links — all above the fold on 375px.

**Screen name:** Home (`/`)
**Template:** `HomeSection.astro`

#### Mobile wireframe (375px)

```
┌──────────────────────────────┐  375px
│ Skip to main content         │  ← visually hidden, first in <body>
├──────────────────────────────┤
│ [skip target: #main]         │
│                              │
│  ┌────────────────────────┐  │  ← <header>
│  │ Home  About             │  │  ← <nav> — registry-derived <ul>, inline
│  └────────────────────────┘  │     left-aligned, brand-first
│                              │
│  ┌────────────────────────┐  │  ← <main> <section class="hero">
│  │                        │  │
│  │  HUMAN COPY NAME       │  │  ← h1, --fs-hero, weight 600
│  │  Role-in-domain line   │  │  ← --fs-lead, weight 400
│  │  Primary stack line    │  │  ← --fs-body, weight 400
│  │                        │  │
│  │  Proof line (muted)    │  │  ← --fs-small, --color-muted
│  │                        │  │
│  │  ┌──────┐ ┌────────┐  │  │  ← link row
│  │  │GitHub│ │LinkedIn│  │  │     inline SVG icon (aria-hidden)
│  │  └──────┘ └────────┘  │  │     + text label
│  │  ┌──────┐              │  │
│  │  │About │              │  │  ← registry-derived, sectionPath()
│  │  └──────┘              │  │
│  └────────────────────────┘  │
│                              │
│  © {year} {home.title}      │  ← <footer>, one line
└──────────────────────────────┘
```

**Above-fold content hierarchy (scanner flow):**
1. `h1` — **name** (`--fs-hero`, 600 weight) — `var(--color-text)`
2. **Role-in-domain** (`--fs-lead`, 400 weight) — `var(--color-text)`
3. **Primary stack** (`--fs-body`, 400 weight) — `var(--color-text)`
4. **Proof line** (`--fs-small`, `--color-muted`) — "HUMAN COPY — condensed proof line (years of experience, kind of work)"
5. **Link row** — GitHub, LinkedIn, About **[v1.5]**

**[v1.5] Hero height note:** the row drops from four links to three, so the hero is ~24px *shorter* at 375px than the v1.2 estimate below. That is an improvement to above-fold fit, not a regression, and no spacing token is adjusted to compensate — "zero decoration that delays content" means the freed space stays freed.

At 375px, the hero occupies approximately 400px vertical height (h1 ~40px, lead ~20px, stack ~16px, proof ~14px, link row ~120px with 44px touch targets). This fits comfortably above the fold on iPhone SE (375×667px viewport minus browser chrome ≈ 580px usable).

#### Desktop wireframe (≥768px)

```
┌──────────────────────────────────────────────────────┐
│ Skip to main content                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Home                          About           │    │  ← nav right-aligned
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  HUMAN COPY NAME                             │    │  ← h1, --fs-hero (scales to 3.25rem)
│  │  Role-in-domain line                         │    │
│  │  Primary stack line                          │    │
│  │                                              │    │
│  │  Proof line (muted)                          │    │
│  │                                              │    │
│  │  GitHub  LinkedIn  About                     │    │  ← link row, horizontal
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  © {year} {home.title}                              │
└──────────────────────────────────────────────────────┘
          ↑ max-width: 48rem (768px), centered
```

**Desktop nav:** right-aligned inline list. Brand (Home) on the left, About on the right. `[UI adds]` — the tech design §6.4 says "brand = home item" and "links ≥44px hit area" but does not specify alignment. We place nav right-aligned on desktop for visual balance against the left-aligned hero content. On mobile (≤768px), nav stacks as a single-column left-aligned list. **[v1.5]** With a single non-brand item, the desktop nav reads as brand-left / single-link-right; the two-item list still uses `gap: var(--space-4)` and is not centered — a centered "About" with a left brand would look like a mistake, so the asymmetry is now *more* load-bearing than when there were two links balancing it.

#### Link row decisions

- **Icons:** Inline SVGs for GitHub and LinkedIn, with `aria-hidden="true"` and adjacent text labels. This stays zero-JS and inert. The SVGs are small (16×16 or 20×20) decorative indicators, not functional elements. **[v1.5]** About keeps its text-only treatment (an arrow or none) — it is an internal route and does not need a brand mark.
- **Link structure:** Each link is an `<a>` with `min-height: 44px` and `min-width: 44px` (touch target). GitHub and LinkedIn use `target="_blank" rel="noopener noreferrer"` (external). About uses a registry-derived `sectionPath()` href. **[v1.5]**
- **Layout:** **[v1.5]** A three-link row changes the mobile wrapping decision. The v1.2 spec offered "2×2 grid or a flex row wrapping" — the 2×2 option is **dropped**, because a three-item 2×2 grid leaves an empty cell and reads as a mistake. The row is a single flex row that wraps naturally, giving `3-up` at 375px if the labels fit and `3-up` comfortably on desktop. If the owner's real labels push past 375px, the row wraps to `2 + 1` with the About link starting the second line — acceptable, and the 44px targets stay intact. T-28 re-checks this at all three breakpoints.
- **Prominence note (design decision, not a tech-design requirement):** **[v1.5]** GitHub and LinkedIn are the *only* routes to the owner's work history now. They keep their icons and sit **first** in DOM order (reading order = importance order), with About last. The visual order and the accessibility order agree, so screen-reader users get the same priority signal sighted users do.

#### Content slots

| Slot | Source | Visual element |
|---|---|---|
| Name | `home.md` frontmatter `title` | `h1`, `--fs-hero` |
| Role-in-domain | `home.md` body (first line) | `--fs-lead` |
| Primary stack | `home.md` body (second line) | `--fs-body` |
| Proof line | `home.md` frontmatter `description` | `--fs-small`, `--color-muted` |
| GitHub URL | `home.md` frontmatter `github` | External link |
| LinkedIn URL | `home.md` frontmatter `linkedin` | External link |

---

### 3.2 ~~Résumé Landing Page~~ — REMOVED (PRD v1.5, OQ-7)

> **This screen is deleted, not redesigned.** It existed in v1.2, was built under ticket `T-9`, and is removed by `T-25` (template + content) and `T-26` (link row + CSS token). There is intentionally **no** replacement screen and **no** "coming soon"/"removed" placeholder — a page that admits it has nothing to say is worse than no page, and PRD v1.5 forbids an empty route.
>
> What the v1.2 screen contained, and where each piece went, is recorded here so the deletion is auditable and so no dev mistakes surviving residue for an oversight:
>
> | v1.2 element | Disposition |
> |---|---|
> | `.btn-download` "Download résumé (PDF)" CTA (48px, accent bg) | **Gone.** The token is renamed `.btn-primary` by `T-26` and survives only on the 404 "Back to home" link (§3.4, §6.5). |
> | Résumé context line (from `resume.md` `description`, muted) | **Gone** with `resume.md`. |
> | Nav item "Résumé" | **Gone** — registry-derived, so deleting the content file removes it with zero nav edits. |
> | "Empty state (PDF missing) → 404 fallback" | **Moot.** v1.2 anticipated a link to a not-yet-provided PDF; v1.5 has no link to be broken. |
> | Any "Get the PDF instead" / recruiter-oriented replacement copy | **Not created.** |
>
> **Design consequence to carry forward:** the Hiring Manager persona no longer has a dedicated surface. That work moves to the About page (§3.3) and the Home link row (§3.1), which is why the link row's GitHub/LinkedIn prominence is now specified explicitly rather than assumed.

---

### 3.3 About Page

**Purpose:** First-person article typography. Warm, personal, readable. The "human" page.

**Screen name:** About (`/about/`)
**Template:** `AboutSection.astro`

#### Mobile wireframe (375px)

```
┌──────────────────────────────┐
│ Skip to main content         │
├──────────────────────────────┤
│  Home  About                │  ← nav, About = active
│                              │
│  ┌────────────────────────┐  │
│  │ About                  │  │  ← h1, --fs-h2, weight 600
│  │                        │  │
│  │ First-person paragraph │  │  ← rendered from markdown body
│  │ one. Written in a warm │  │     --fs-body, --lh-body: 1.6
│  │, honest voice.         │  │     max-width: --measure (65ch)
│  │                        │  │
│  │ Another paragraph      │  │     comfortable leading
│  │ with hobby threads     │  │
│  │ and genuine story.     │  │
│  │                        │  │
│  │ Optional third or      │  │  ← 2-4 paragraphs total
│  │ fourth paragraph.      │  │
│  └────────────────────────┘  │
│                              │
│  © {year} {home.title}      │
└──────────────────────────────┘
```

#### Desktop wireframe (≥768px)

```
┌──────────────────────────────────────────────────────┐
│  Home                          About               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ About                                        │    │
│  │                                              │    │
│  │ First-person paragraph one. Written in a     │    │  ← max-width: 65ch
│  │ warm, honest voice with genuine detail.      │    │
│  │                                              │    │
│  │ Another paragraph with hobby threads and     │    │
│  │ genuine story elements.                      │    │
│  │                                              │    │
│  │ Optional third or fourth paragraph.          │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  © {year} {home.title}                              │
└──────────────────────────────────────────────────────┘
```

**Typography spec:**
- `<h1>` at `--fs-h2`, weight 600, `--lh-h2: 1.2`
- Body paragraphs at `--fs-body`, weight 400, `--lh-body: 1.6`
- Max line length: `--measure` (65ch) — comfortable for extended reading
- Paragraph spacing: `--space-5` (1.5rem) between paragraphs
- Article wrapper: `<article>` element (T-10 requirement)
- Content source: `about.md` body, rendered via `<Content />` (Astro `render(entry)`)

---

### 3.4 404 Page

**Purpose:** Graceful not-found. Decorative code, single action back to home.

**Screen name:** 404 (`/404/`)
**File:** `src/pages/404.astro` (fixed page, NOT a registry section — per tech design §5.3)

#### Mobile wireframe (375px)

```
┌──────────────────────────────┐
│ Skip to main content         │
├──────────────────────────────┤
│  Home  About                │  ← nav still functional
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │       404              │  │  ← decorative, aria-hidden="true"
│  │                        │  │     --fs-hero, --color-border
│  │  Page not found        │  │  ← h1, --fs-h2, weight 600
│  │                        │  │
│  │  The page you're       │  │  ← --fs-body, --color-muted
│  │  looking for doesn't   │  │
│  │  exist.                │  │
│  │                        │  │
│  │ ┌────────────────────┐ │  │
│  │ │ Back to home       │ │  │  ← .btn-primary
│  │ └────────────────────┘ │  │
│  └────────────────────────┘  │
│                              │
│  © {year} {home.title}      │
└──────────────────────────────┘
```

**Design decisions:**
- **Decorative `404` code:** Large `404` text, `aria-hidden="true"`, positioned above the `h1`. Uses `--color-border` for a subtle, non-distracting decorative treatment. Not selectable by screen readers.
- **`.btn-primary` (v1.5):** The "Back to home" link is now the **only** consumer of this token. `T-26` renames it from `.btn-download` so the class name no longer advertises a deleted artifact. All visual values are unchanged — only the name moves.
- **`noindex`:** Handled in HTML via `<meta name="robots" content="noindex">` (tech design §5.3). Not a UI concern, but noted for completeness.
- **Nav remains functional:** The global nav is present and usable, so users can navigate to valid pages.

---

## 4. Shared Chrome

### 4.1 Navigation

**Structure:** `<header>` contains `<Nav>` which iterates `getSections()` to produce a `<ul>` of `<li>` items.

**Mobile (≤768px):**
- Single-column stack, left-aligned
- Brand (Home) appears as the first item, visually distinguished by weight (600) or placement
- No hamburger menu — **[v1.5]** with only 2 items (Home, About), a full inline list is unambiguously more usable than a disclosure widget, and it avoids hidden-content patterns entirely
- Each item has `min-height: 44px` for touch targets
- Items separated by `--space-1` or `--space-2` vertical spacing

**Desktop (≥768px):**
- Inline horizontal list, right-aligned `[UI adds]` — the tech design §6.4 does not specify horizontal vs vertical alignment; right-alignment balances the left-aligned hero content
- Brand (Home) on the left, About on the right `[UI adds]`
- Gap between items: `--space-4` (1rem)

**Active state:**
- `aria-current="page"` on the current nav item
- Visual: accent color (`--color-accent`) + underline (bottom border, 2px solid `--color-accent`)
- Never color-only — underline + ARIA attribute always together (tech design §6.5)

**Registry-driven:** Nav links derive entirely from `getSections()`. No hardcoded links. Adding a section (e.g., "Now") automatically appears in nav.

### 4.2 Header / Footer patterns

**Header (`<header>`):**
- Contains `<Nav>` component
- No logo, no site title text (the brand is the nav item "Home")
- Sticky behavior: `[UI adds]` — not specified in tech design. For v1, **no sticky header**. The nav scrolls away. Rationale: the site is only 3-4 sections long; sticky nav adds complexity and visual noise for no functional benefit at this scale.

**Footer (`<footer>`):**
- One line: `© {year} {home.data.title}`
- Name read from the registry home entry, never hardcoded
- `--fs-small`, `--color-muted`, centered or left-aligned (matches content alignment)
- Vertical padding: `--space-6` above, `--space-4` below

### 4.3 Skip link

- **Placement:** First element in `<body>`, before `<header>`
- **Target:** `#main` (the `<main>` element's `id`)
- **Visual:** Visually hidden by default (`.skip-link` class using clip-rect or similar technique). Becomes visible on `:focus`.
- **Spec:** `position: absolute; left: -9999px; z-index: 999;` → `:focus { left: var(--gutter); top: var(--gutter); }`
- **Satisfies:** WCAG 2.4.1 (Bypass Blocks)

### 4.4 Mobile behavior (≤768px)

- All content in single-column stack
- No hamburger menu for 2 nav items **[v1.5, was 3]** — confirmed: 2 items fit in a single line on 375px viewport at `--fs-body` with `--gutter` padding, with room to spare
- Touch targets ≥ 44px everywhere
- No horizontal scroll (NF-2)
- No pinch-zoom required (NF-2)

### 4.5 Desktop behavior (≥768px)

- Content centered at `--container` (48rem / 768px)
- `padding-inline: var(--gutter)` on the container
- Nav inline, right-aligned
- Hero left-aligned within the container
- Footer centered or left-aligned (matching content)

---

## 5. Interaction & State Spec

### 5.1 Link states

| State | Visual treatment |
|---|---|
| **Default** | `--color-accent`, underlined (always underlined, never relying on color alone) |
| **Hover** | `--color-accent-hover`, underline persists |
| **Focus** | `outline: 2px solid var(--color-accent); outline-offset: 2px` (both `:focus` and `:focus-visible`) |
| **Active** | Brief opacity shift or color darkening (`--color-accent-hover`) |

### 5.2 Button states (`.btn-primary` **[v1.5, renamed from `.btn-download`]**)

| State | Visual treatment |
|---|---|
| **Default** | `--color-accent` background, `--color-surface` text, 600 weight, 8px radius |
| **Hover** | `--color-accent-hover` background |
| **Focus** | `outline: 2px solid var(--color-accent); outline-offset: 2px` |
| **Active** | Brief opacity shift |

### 5.3 Focus management

- `:focus-visible` and `:focus` both get `outline: 2px solid var(--color-accent); outline-offset: 2px`
- Never `outline: none`
- Focus order: skip-link → nav items → main content → footer
- Tab order follows DOM order (no `tabindex` manipulation needed)

### 5.4 Touch targets

- Every interactive element: `min-height: 44px; min-width: 44px` (per `--touch-min: 44px`)
- Links in nav: padded to meet minimum even if text is short
- `.btn-primary`: `min-height: 48px` (exceeds minimum for primary CTA)

### 5.5 Animations & motion

- **No animations in v1.** Zero transitions that delay content. The site is static HTML.
- `prefers-reduced-motion: reduce` — the CSS includes a media query that disables any transitions. In v1, there are none to disable, but the guard is in place for future sections.
- No hover-only reliance on mobile — all interactive elements are accessible via tap.

### 5.6 No-JS interaction guardrails

- No client-side JavaScript shipped to browser
- No event handlers in HTML (`onclick`, etc.)
- No `style=` attributes
- All styling via scoped CSS and `global.css`
- All interactivity is native browser behavior (links, anchor navigation)

---

## 6. Accessibility Contract

### 6.1 WCAG AA contrast pairs

| Pair | Ratio | Passes |
|---|---|---|
| `--color-text` (#18181b) on `--color-bg` (#fafaf9) | ≈17:1 | AAA (normal + large text) |
| `--color-muted` (#52525b) on `--color-bg` (#fafaf9) | ≈7.4:1 | AAA (normal + large text) |
| `--color-accent` (#1e40af) on `--color-bg` (#fafaf9) | ≈8.3:1 | AAA (normal + large text) |
| `--color-surface` (#ffffff) on `--color-accent` (#1e40af) | ≈8.3:1 | AAA (normal + large text) |
| `--color-accent-hover` (#172554) on `--color-bg` (#fafaf9) | ≈10:1 | AAA (normal + large text) |

All pairings exceed WCAG AA (≥4.5:1 normal, ≥3:1 large) and most exceed AAA (≥7:1). `--color-border` is never the sole text-defining element.

### 6.2 Keyboard navigation order

1. Skip-link (first in `<body>`, hidden until focus)
2. Nav items (Home → About — DOM order)
3. Main content (`<main id="main">`)
4. Footer (no interactive elements, but in tab order)

No `tabindex` values > 0. No focus trapping. No custom keyboard handlers.

### 6.3 Semantic structure

- One `h1` per page
- `<html lang="en">`
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` on every page
- `<article>` on About page (T-10)
- `<section>` on Home
- `aria-current="page"` on active nav item
- `aria-hidden="true"` on decorative `404` code
- Inline SVG icons: `aria-hidden="true"` with adjacent text labels

### 6.4 Screen reader behavior

- Skip-link announces "Skip to main content" and moves focus to `#main`
- Nav announces as `<nav>` landmark with "Main" or "Primary" label
- Active page announced via `aria-current="page"`
- External links (GitHub, LinkedIn) include `rel="noopener noreferrer"` — screen readers may announce "link (opens in new tab)" based on browser behavior
- **[v1.5]** The PDF-download announcement is removed with the page. **[PRD v1.5 note]** Each external link's accessible name is the **profile's own name** ("GitHub", "LinkedIn") plus the owner's handle, so a screen-reader user can tell the two profile links apart and knows which platform each leads to — the icons that differentiate them visually are `aria-hidden`, so the text label is the only channel a non-visual user has.

---

## 7. Content-Holder Documentation

> Per tech design §4.4, every personal fact is a `HUMAN COPY` placeholder until T-23. This section documents where each placeholder sits in the visual layout so the owner knows exactly what text slot produces what visual element.

### 7.1 Home page

| Placeholder location | Visual element | Source field | Notes |
|---|---|---|---|
| `home.md` frontmatter `title` | `h1` name | `title` | Must be the owner's full name |
| `home.md` body, line 1 | Role-in-domain (`--fs-lead`) | body content | e.g., "Software engineer building typed, performant systems" |
| `home.md` body, line 2 | Primary stack (`--fs-body`) | body content | e.g., "Rust · TypeScript · React Native" |
| `home.md` frontmatter `description` | Proof line (`--fs-small`, muted) | `description` | ≤160 chars; doubles as meta description |
| `home.md` frontmatter `github` | GitHub link URL | `github` | Valid URL placeholder until T-23 |
| `home.md` frontmatter `linkedin` | LinkedIn link URL | `linkedin` | Valid URL placeholder until T-23 |
| `person.ts` `JOB_TITLE` | JSON-LD `jobTitle` | constant | Not visible on page; structured data only |

### 7.2 ~~Résumé page~~ — REMOVED (PRD v1.5)

**[v1.5]** The résumé page no longer exists, so it has **no content placeholders**. The three rows below are
struck through rather than deleted so the removal stays auditable against the v1.2 spec; the owner does
**not** need to supply any of this content, and there is no `public/resume.pdf` to provide.

| ~~Placeholder location~~ | ~~Visual element~~ | ~~Source field~~ | Disposition |
|---|---|---|---|
| ~~`resume.md` frontmatter `title`~~ | ~~`h1` ("Résumé")~~ | ~~`title`~~ | File deleted by `T-25` |
| ~~`resume.md` frontmatter `description`~~ | ~~Context line (muted)~~ | ~~`description`~~ | File deleted by `T-25` |
| ~~`public/resume.pdf`~~ | ~~Download button href~~ | ~~file path~~ | **Never existed** — T-24 was cancelled before execution |

**[v1.5] Owner-facing consequence:** the copy checklist for the owner is now **Home** (§7.1) and
**About** (§7.3) only, and the two profile URLs have moved from "nice to have" to load-bearing — the
About page's narrative plus those two links are the site's entire professional-depth path (US-15/US-16).

### 7.3 About page

| Placeholder location | Visual element | Source field | Notes |
|---|---|---|---|
| `about.md` frontmatter `title` | `h1` ("About") | `title` | Static; never changes |
| `about.md` body | Article paragraphs | body content | 2-4 first-person paragraphs; rendered via `<Content />` |
| `about.md` frontmatter `description` | Meta description | `description` | ≤160 chars; not visible on page |

### 7.4 Visual check checklist (T-8/T-10/T-11 devs + T-21 QA, re-run by T-28)

- [ ] Home: `h1` renders at `--fs-hero` (clamp scales correctly at 375px, 768px, 1024px)
- [ ] Home: role-in-domain renders at `--fs-lead`, not `--fs-body`
- [ ] Home: proof line renders at `--fs-small`, `--color-muted`
- [ ] Home: link row has **3** visible links (GitHub, LinkedIn, About) **[v1.5]**
- [ ] Home: all links have ≥44px touch targets
- [ ] **[v1.5] Home: no link, label, icon, or `aria-label` anywhere contains "résumé"** — the removal's user-visible half
- [ ] About: paragraphs render at `--fs-body`, `--lh-body: 1.6`
- [ ] About: content width respects `--measure` (65ch max)
- [ ] About: `<article>` wrapper present
- [ ] **[v1.5] About: carries the work-history narrative** that the résumé page used to (US-16) — checked at T-28 by the owner, not by a dev
- [ ] 404: decorative `404` has `aria-hidden="true"`
- [ ] 404: "Back to home" uses `.btn-primary` token **[v1.5]**
- [ ] All pages: one `h1` per page
- [ ] All pages: skip-link is first element, targets `#main`
- [ ] All pages: nav has `aria-current="page"` on active item
- [ ] All pages: nav renders **exactly 2 items** **[v1.5]**
- [ ] All pages: focus-visible ring (2px accent, 2px offset) visible on all interactive elements
- [ ] All pages: no horizontal scroll at 375px
- [ ] All pages: no client JS (verified by `npm run verify`)

---

## 8. Zero-JS / No-Animation Guardrails

These are hard UI constraints. Violations are build failures.

| Constraint | Enforcement |
|---|---|
| No client-side JavaScript | No `<script>` tags except `type="application/ld+json"` data blocks (exempt per tech design §11.1). Verified by `verify-static.mjs`. |
| No event-handler attributes | No `onclick`, `onload`, `onerror`, etc. anywhere in HTML. Verified by `verify-static.mjs`. |
| No `style=` attributes | All styling via scoped CSS and `global.css`. No inline styles. |
| No animations that delay content | Zero transitions, zero keyframe animations in v1. `prefers-reduced-motion` media query in place for future use. |
| No stock photos | No images in v1 (hero is real text; no decorative images). If images are added later, they must be self-hosted and content-essential. |
| No third-party assets | No font CDN, no analytics, no tracking pixels, no external stylesheets/scripts. Verified by `verify-static.mjs` third-party origin check. |
| No CSS-in-JS | All styling in `.astro` `<style>` blocks (Astro auto-scopes) or `global.css`. |
| No client-side framework runtime | Astro zero-JS by default. No React islands in v1. |

---

## 9. Responsive Behavior Summary

| Breakpoint | Nav | Hero/Content | Link row | Touch targets |
|---|---|---|---|---|
| **375px** (mobile floor) | Inline list, left-aligned, **2 items** **[v1.5]** | Single-column stack, left-aligned | Flex row, 3-up or wrapping to 2+1 (no 2×2 grid — a 3-item 2×2 grid leaves a hole) | ≥44px |
| **480px** | Same | Same, wider content area | Single horizontal row | ≥44px |
| **768px** (desktop floor) | Inline, right-aligned | Max-width 48rem, centered | Horizontal row with gap | ≥44px |
| **1024px+** | Same | Same | Same | ≥44px |

**Fluid type scaling:** All heading sizes use `clamp()` — no breakpoint jumps. The type scale smoothly interpolates between 375px and 768px+ values.

**Orientation changes:** No special handling needed. Single-column layout adapts naturally to portrait/landscape. No fixed heights, no viewport-locked positioning.

**[v1.5] Re-verification note:** the v1.2 breakpoints were validated against a 4-link row and a 3-item nav. Both are now one item smaller, so the 375px link row and the 2-item nav are the only two cells in this table whose *content* changed rather than just their surroundings. `T-28` re-runs the 375/390/430px sweep specifically to catch a wrap or truncation in the 3-up link row; every other cell in this table is unchanged and needs no new judgement.

---

## 10. Conflicts Flagged

**None.** This spec reproduces the tech design §6 tokens verbatim. All design decisions either:
1. Directly implement the tech design's normative tokens and patterns, or
2. Are marked `[UI adds]` where the tech design left latitude (nav alignment, sticky header decision, link row layout details).

No hex values, font families, spacing variables, touch minimums, trailing-slash URL forms, or section `navLabel`s have been modified from the tech design.

**[v1.5] One recorded divergence from the *PRD*, resolved here and mirrored in the tech design:** the PRD's
Hiring-Manager persona and the `US-5` "download a document" story were removed with the résumé page, so
this spec no longer has a screen that satisfies them. That is an accepted PRD v1.5 scope reduction
(`OQ-7`), not an unresolved conflict — the work is re-homed onto About + the two profile links
(`US-15`/`US-16`). `US-4` is **not** affected: it is the "navigate Home → About" story, and that screen
still exists. If the owner later wants a document surface, that is a **new PRD version with its own
ticket**, and this spec must not be edited to accommodate it in passing.

---

*End of UI/UX Design Specification (v1.5).*

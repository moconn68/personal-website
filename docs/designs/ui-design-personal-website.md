# UI/UX Design Specification — Personal Website v1

> **Upstream:** `docs/PRDs/PRD-personal-website.md` (v1.2) · `docs/designs/tech-design-personal-website.md`
> **Status:** Normative for visual/interaction implementation. All design tokens reproduce the tech design §6 byte-for-byte. Where the tech design left latitude, new details are marked `[UI adds]`.
> **Date:** 2026-09-21 · **Author:** UI/UX Designer (AI SDLC)

---

## 1. Design Principles

### Brand thesis (one line)

> **Owned, opinionated, honest — engineered taste; zero decoration that delays content.**

This thesis maps directly to every visual decision:

- **Owned:** Every surface reads as self-authored, not template-derived. No stock imagery, no generic patterns, no borrowed chrome.
- **Opinionated:** Specific typographic choices (IBM Plex Sans 400/600), a restrained palette, left-aligned hero with tight leading. The site *has a point of view* — it does not try to please everyone.
- **Honest:** Real text, not screenshots of text. No animations that fake polish. The résumé is a PDF, not a rendered page — the site does not pretend to be something it is not.
- **Engineered taste:** The architecture itself is the signal. Scoped CSS, zero JS, typed content, trailing-slash discipline — the build quality is the aesthetic.
- **Zero decoration that delays content:** Nothing visual exists that is not required to convey the information. No decorative images, no gratuitous transitions, no visual filler.

### Persona tone mapping

| Persona | What the design communicates in the first 6 seconds |
|---|---|
| **Scanning Recruiter** | Clean hierarchy, generous whitespace, no noise → "this person has judgment." Name/role/stack/proof line parse instantly. GitHub/LinkedIn findable without hunting. |
| **Hiring Manager** | Résumé page is spare and decisive — one action (download PDF), no competing CTAs. The .btn-download token signals "this is the one thing to do here." |
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

Weights: **400** (body) and **600** (headings, CTA text, nav). Self-hosted WOFF2 subset via `glyphhanger`; `font-display: swap`.

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
| `.btn-download` | `min-height: 48px`, `padding-inline: 1.5rem`, accent background (`--color-accent`), white text (`--color-surface`), 600 weight, `border-radius: 8px`, `display: inline-flex; align-items: center`. Hover → `--color-accent-hover`. Focus ring visible. |
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
│  │ Home  Résumé  About    │  │  ← <nav> — registry-derived <ul>, inline
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
│  │  ┌──────────┐ ┌─────┐ │  │
│  │  │ Résumé   │ │About│ │  │  ← registry-derived, sectionPath()
│  │  └──────────┘ └─────┘ │  │
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
5. **Link row** — GitHub, LinkedIn, Résumé, About

At 375px, the hero occupies approximately 400px vertical height (h1 ~40px, lead ~20px, stack ~16px, proof ~14px, link row ~120px with 44px touch targets). This fits comfortably above the fold on iPhone SE (375×667px viewport minus browser chrome ≈ 580px usable).

#### Desktop wireframe (≥768px)

```
┌──────────────────────────────────────────────────────┐
│ Skip to main content                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Home               Résumé      About         │    │  ← nav right-aligned
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
│  │  GitHub  LinkedIn  Résumé  About             │    │  ← link row, horizontal
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  © {year} {home.title}                              │
└──────────────────────────────────────────────────────┘
         ↑ max-width: 48rem (768px), centered
```

**Desktop nav:** right-aligned inline list. Brand (Home) on the left, Résumé and About on the right. `[UI adds]` — the tech design §6.4 says "brand = home item" and "links ≥44px hit area" but does not specify alignment. We place nav right-aligned on desktop for visual balance against the left-aligned hero content. On mobile (≤768px), nav stacks as a single-column left-aligned list.

#### Link row decisions

- **Icons:** Inline SVGs for GitHub and LinkedIn, with `aria-hidden="true"` and adjacent text labels. This stays zero-JS and inert. The SVGs are small (16×16 or 20×20) decorative indicators, not functional elements.
- **Link structure:** Each link is an `<a>` with `min-height: 44px` and `min-width: 44px` (touch target). GitHub and LinkedIn use `target="_blank" rel="noopener noreferrer"` (external). Résumé and About use registry-derived `sectionPath()` hrefs.
- **Layout:** On mobile, links stack in a 2×2 grid or a flex row wrapping. On desktop, they display as a single horizontal row with `gap: var(--space-4)`.

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

### 3.2 Résumé Landing Page

**Purpose:** Minimal landing surface with one obvious action — download the PDF. No competing content.

**Screen name:** Résumé (`/resume/`)
**Template:** `ResumeSection.astro`

#### Mobile wireframe (375px)

```
┌──────────────────────────────┐
│ Skip to main content         │
├──────────────────────────────┤
│  Home  Résumé  About         │  ← nav, Résumé = active
│                              │
│  ┌────────────────────────┐  │
│  │ Résumé                 │  │  ← h1, --fs-h2, weight 600
│  │                        │  │
│  │ One line of context    │  │  ← description, --fs-body, --color-muted
│  │                        │  │
│  │ ┌────────────────────┐ │  │
│  │ │ Download résumé    │ │  │  ← .btn-download, 48px min-height
│  │ │ (PDF)              │ │  │
│  │ └────────────────────┘ │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  © {year} {home.title}      │
└──────────────────────────────┘
```

#### Desktop wireframe (≥768px)

```
┌──────────────────────────────────────────────────────┐
│  Home               Résumé      About                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │                                              │    │
│  │  Résumé                                      │    │  ← h1, --fs-h2
│  │                                              │    │
│  │  One line of context (muted)                 │    │
│  │                                              │    │
│  │  ┌──────────────────────────┐                │    │
│  │  │ Download résumé (PDF)    │                │    │  ← .btn-download
│  │  └──────────────────────────┘                │    │
│  │                                              │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  © {year} {home.title}                              │
└──────────────────────────────────────────────────────┘
```

**Design decisions:**
- **One primary CTA:** `.btn-download` linking to `/resume.pdf`. No secondary actions. No nav links beyond the global nav.
- **Context line:** One sentence from `resume.md` `description` field, displayed in `--color-muted`. Sufficient to tell the visitor *why* they are downloading without competing with the CTA.
- **No rendered résumé content:** The page contains only title + context + CTA. The PDF is the résumé.
- **`.btn-download` visual spec:** 48px min-height, 1.5rem inline padding, `--color-accent` background, `--color-surface` text, 600 weight, 8px border-radius. On hover: `--color-accent-hover`. Focus: 2px accent ring with 2px offset.
- **Empty state (PDF missing):** If `resume.pdf` is absent (pre-T-24), the button href will 404. The 404 page handles this gracefully with its own "Back to home" CTA. `[UI adds]` — no special empty-state UI on the résumé page itself; the 404 page is the fallback.

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
│  Home  Résumé  About         │  ← nav, About = active
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
│  Home               Résumé      About                 │
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
│  Home  Résumé  About         │  ← nav still functional
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
│  │ │ Back to home       │ │  │  ← .btn-download (reused token)
│  │ └────────────────────┘ │  │
│  └────────────────────────┘  │
│                              │
│  © {year} {home.title}      │
└──────────────────────────────┘
```

**Design decisions:**
- **Decorative `404` code:** Large `404` text, `aria-hidden="true"`, positioned above the `h1`. Uses `--color-border` for a subtle, non-distracting decorative treatment. Not selectable by screen readers.
- **Reuse `.btn-download`:** The "Back to home" link uses the same CTA token as the résumé page — consistent visual language for "primary action."
- **`noindex`:** Handled in HTML via `<meta name="robots" content="noindex">` (tech design §5.3). Not a UI concern, but noted for completeness.
- **Nav remains functional:** The global nav is present and usable, so users can navigate to valid pages.

---

## 4. Shared Chrome

### 4.1 Navigation

**Structure:** `<header>` contains `<Nav>` which iterates `getSections()` to produce a `<ul>` of `<li>` items.

**Mobile (≤768px):**
- Single-column stack, left-aligned
- Brand (Home) appears as the first item, visually distinguished by weight (600) or placement
- No hamburger menu — with only 3 items (Home, Résumé, About), a full inline list is more usable and avoids hidden-content patterns
- Each item has `min-height: 44px` for touch targets
- Items separated by `--space-1` or `--space-2` vertical spacing

**Desktop (≥768px):**
- Inline horizontal list, right-aligned `[UI adds]` — the tech design §6.4 does not specify horizontal vs vertical alignment; right-alignment balances the left-aligned hero content
- Brand (Home) on the left, Résumé and About on the right `[UI adds]`
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
- No hamburger menu for 3 nav items — confirmed: 3 items fit in a single line on 375px viewport at `--fs-body` with `--gutter` padding
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

### 5.2 Button states (`.btn-download`)

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
- `.btn-download`: `min-height: 48px` (exceeds minimum for primary CTA)

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
2. Nav items (Home → Résumé → About — DOM order)
3. Main content (`<main id="main">`)
4. Footer (no interactive elements, but in tab order)

No `tabindex` values > 0. No focus trapping. No custom keyboard handlers.

### 6.3 Semantic structure

- One `h1` per page
- `<html lang="en">`
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>` on every page
- `<article>` on About page (T-10)
- `<section>` on Home and Résumé pages
- `aria-current="page"` on active nav item
- `aria-hidden="true"` on decorative `404` code
- Inline SVG icons: `aria-hidden="true"` with adjacent text labels

### 6.4 Screen reader behavior

- Skip-link announces "Skip to main content" and moves focus to `#main`
- Nav announces as `<nav>` landmark with "Main" or "Primary" label
- Active page announced via `aria-current="page"`
- External links (GitHub, LinkedIn) include `rel="noopener noreferrer"` — screen readers may announce "link (opens in new tab)" based on browser behavior
- PDF download link: text reads "Download résumé (PDF)" — clear action + format

---

## 7. Content-Holder Documentation

> Per tech design §4.4, every personal fact is a `HUMAN COPY` placeholder until T-23/T-24. This section documents where each placeholder sits in the visual layout so the owner knows exactly what text slot produces what visual element.

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

### 7.2 Résumé page

| Placeholder location | Visual element | Source field | Notes |
|---|---|---|---|
| `resume.md` frontmatter `title` | `h1` ("Résumé") | `title` | Static; never changes |
| `resume.md` frontmatter `description` | Context line (muted) | `description` | ≤160 chars; one sentence explaining the résumé |
| `public/resume.pdf` | Download button href | file path | Owner provides; ATS-verified at content-add time |

### 7.3 About page

| Placeholder location | Visual element | Source field | Notes |
|---|---|---|---|
| `about.md` frontmatter `title` | `h1` ("About") | `title` | Static; never changes |
| `about.md` body | Article paragraphs | body content | 2-4 first-person paragraphs; rendered via `<Content />` |
| `about.md` frontmatter `description` | Meta description | `description` | ≤160 chars; not visible on page |

### 7.4 Visual check checklist (T-8/T-9/T-10/T-11 devs + T-21 QA)

- [ ] Home: `h1` renders at `--fs-hero` (clamp scales correctly at 375px, 768px, 1024px)
- [ ] Home: role-in-domain renders at `--fs-lead`, not `--fs-body`
- [ ] Home: proof line renders at `--fs-small`, `--color-muted`
- [ ] Home: link row has 4 visible links (GitHub, LinkedIn, Résumé, About)
- [ ] Home: all links have ≥44px touch targets
- [ ] Résumé: `.btn-download` renders with accent background, white text, 48px min-height
- [ ] Résumé: no competing CTAs or secondary actions
- [ ] About: paragraphs render at `--fs-body`, `--lh-body: 1.6`
- [ ] About: content width respects `--measure` (65ch max)
- [ ] About: `<article>` wrapper present
- [ ] 404: decorative `404` has `aria-hidden="true"`
- [ ] 404: "Back to home" uses `.btn-download` token
- [ ] All pages: one `h1` per page
- [ ] All pages: skip-link is first element, targets `#main`
- [ ] All pages: nav has `aria-current="page"` on active item
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
| **375px** (mobile floor) | Inline list, left-aligned, 3 items | Single-column stack, left-aligned | Flex row wrapping or 2×2 grid | ≥44px |
| **480px** | Same | Same, wider content area | Single horizontal row | ≥44px |
| **768px** (desktop floor) | Inline, right-aligned | Max-width 48rem, centered | Horizontal row with gap | ≥44px |
| **1024px+** | Same | Same | Same | ≥44px |

**Fluid type scaling:** All heading sizes use `clamp()` — no breakpoint jumps. The type scale smoothly interpolates between 375px and 768px+ values.

**Orientation changes:** No special handling needed. Single-column layout adapts naturally to portrait/landscape. No fixed heights, no viewport-locked positioning.

---

## 10. Conflicts Flagged

**None.** This spec reproduces the tech design §6 tokens verbatim. All design decisions either:
1. Directly implement the tech design's normative tokens and patterns, or
2. Are marked `[UI adds]` where the tech design left latitude (nav alignment, sticky header decision, link row layout details).

No hex values, font families, spacing variables, touch minimums, trailing-slash URL forms, or section `navLabel`s have been modified from the tech design.

---

*End of UI/UX Design Specification.*

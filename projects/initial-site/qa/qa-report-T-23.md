# QA Test Report — T-23: Author final Home/About copy + identity facts

**Verdict: Pass**

## What Was Validated

Independently re-ran every verification step against the working tree (no prior commit exists for this item); did not rely on dev/reviewer summaries.

### 1. Build
`npm run build` — exits 0. Astro builds 3 static routes (`/`, `/about/`, `/404`) plus `robots.txt` and sitemap; `scripts/gen-headers.mjs` runs cleanly (no `_headers` on this local/production-mode build, as expected). **Status: Pass.**

### 2. `npm run verify` (zero-JS / zero-third-party / no-résidue static checks)
```
PASS third-party scan: all load-bearing refs same-origin
PASS presence asserts
PASS dist/_headers: absent on this production build
PASS no-residue asserts
verify: OK — 3 HTML, 0 CSS files checked (mattoconn.pages.dev)
```
Confirmed no résumé surface re-appeared. **Status: Pass.**

### 3. `npm run check` (astro check)
`0 errors, 0 warnings, 3 hints`. The 3 hints (deprecated `z.string().url()` in `content.config.ts`, unused import in `scripts/subset-fonts.mjs`) are pre-existing and untouched by this diff (the `content.config.ts` diff for this ticket only edited a comment, not the `.url()` call). No new diagnostics introduced. **Status: Pass.**

### 4. Built output inspection

**`dist/index.html`:**
- `<title>Matthew O&#39;Connell</title>` — real, unique.
- meta description: "Software engineer with 6+ years building Rust middleware and device software used by millions of people daily." — 110 chars, ≤160, no placeholder.
- OG title/description/type/url present and correct; canonical `https://mattoconn.pages.dev/`.
- Person JSON-LD (single `<script type="application/ld+json">` block, the only structured-data node found across both pages):
  `{"@context":"https://schema.org","@type":"Person","name":"Matthew O'Connell","url":"https://mattoconn.pages.dev","jobTitle":"Software Engineer","sameAs":["https://github.com/moconn68","https://www.linkedin.com/in/matthew-o-connell-652178130"]}`
  — real name/url/jobTitle/sameAs, no placeholder strings, no ProfilePage/résumé node anywhere (`grep -c 'application/ld+json' dist/about/index.html` = 0).
- Rendered body text confirms hero role line ("Software Engineer building systems software for consumer devices"), stack line ("Rust, TypeScript, Java, and Kotlin"), proof line, and GitHub/LinkedIn link chips pointing to `https://github.com/moconn68` and `https://www.linkedin.com/in/matthew-o-connell-652178130` — matches the PRD-required real URLs exactly.

**`dist/about/index.html`:**
- `<title>Matthew O&#39;Connell — About</title>` — unique vs. home title.
- meta description: "Bay Area software engineer building systems for consumer devices; outside work, gym, gaming, and travel." — 104 chars, ≤160.
- OG/canonical correct (`.../about/`).
- Article body renders exactly 3 `<p>` paragraphs (intro/career, background/highlights, hobbies) with no "HUMAN COPY" placeholder text; content reads as authored first-person prose consistent with the PRD's identity requirements (US-1, US-8, US-13, US-15).

### 5. Placeholder residue
`grep -rn "HUMAN COPY" src/` → **zero hits**. Comment cleanup in `HomeSection.astro`, `AboutSection.astro`, `content.config.ts`, and `person.ts` correctly removed all "HUMAN COPY" markers alongside the real copy landing.

### 6. Regression: two-route site intact
`dist/` contains exactly: `index.html`, `about/index.html`, `404.html`, `robots.txt`, `sitemap-0.xml`, `sitemap-index.xml`, and font assets — no third route, no résumé artifact. `dist/sitemap-0.xml` lists exactly two URLs: `https://mattoconn.pages.dev/` and `https://mattoconn.pages.dev/about/`. Matches expected two-page site per design.

### 7. Ticket checkbox
`git diff -- projects/initial-site/tickets/tickets.md` shows only the T-23 checkbox flip `[ ]` → `[x]`, no other line changes. **Confirmed `[x]`.**

## Manual/Edge Checks
- Apostrophes in copy render correctly as HTML entities/curly quotes (`Matthew O&#39;Connell`, `I'm`, `I've`) — no encoding corruption.
- `description` frontmatter field doubles as meta description per schema comment (`≤160 is enforced at the boundary`); both new descriptions respect that bound (110 and 104 chars).
- GitHub/LinkedIn frontmatter fields remain `.optional()` in the Zod schema (unchanged), so schema itself didn't need to change for this content-only ticket — correct, since T-23 is content-only.
- No client JS introduced; the only `<script>` tag site-wide remains the JSON-LD data block (verified by the zero-JS gate passing in `npm run verify`).

## Bugs Found
None. One minor documentation note (not a blocker, not part of this diff): `projects/initial-site/tickets/tickets.md` line 16 still reads "T-19 and T-23 remain open" in a stale status note above the checklist — that line was not touched by this ticket's diff and the actual T-23 checklist item (line 74) is correctly `[x]`. Flagging for hygiene only; does not affect ticket acceptance criteria.

## Recommendation
**Sign-off.** All acceptance criteria for T-23 are met: build succeeds, `npm run verify` passes (no résumé residue reintroduced), `npm run check` shows 0 new errors/warnings, both pages have unique non-placeholder titles/descriptions within length bounds, correct OG/canonical tags, a single accurate Person JSON-LD block, real GitHub/LinkedIn links, three complete About paragraphs, zero "HUMAN COPY" residue repo-wide, and the two-route site (home + about) remains intact with sitemap correctly listing exactly those two URLs.

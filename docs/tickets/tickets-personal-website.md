# Tickets — Personal Website v1 (Matthew O'Connell)

> **Source of truth:** `docs/PRDs/PRD-personal-website.md` (v1.2). Supersedes the vision doc where they conflict.
> **Read before executing:** this file is the Orchestrator's **sole tasking source**. `docs/plans/plan-personal-website.md` is reference only.
> **Execution mode:** the checklist in Part A is strictly **topologically ordered** — a single lazy pass from T-1 to T-24 is a valid execution order. Every ticket's dependencies appear strictly before it in the file.

**Codebase label legend** (used in the checklist's 5th slot):

| Label | Repo area |
|---|---|
| `astro/` | All site source/config: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/` (components, layouts, templates, pages, styles) |
| `content/` | `src/content.config.ts`, `src/content/sections/*.md`, `src/config/sections.ts` |
| `assets/` | Fonts + font pipeline: `src/assets/fonts/`, `src/assets/styles/`, `scripts/subset-fonts.*` |
| `public/` | `public/resume.pdf` (owner-provided), static files |
| `scripts/` | Build/QA scripts: `scripts/gen-headers.mjs`, `scripts/verify-static.mjs` |
| `deploy/` | Cloudflare Pages connection/config, CI wiring, wrangler config (if used) |
| `qa/` | Verification/runtime QA tasks (Lighthouse, a11y, extensibility manual test) |

---

## Epic Description

Build v1 of a static, zero-client-JavaScript, mobile-perfect personal identity hub for professional software engineer **Matthew O'Connell**: four surfaces (Home scan page, Résumé landing page linking a statically-committed `/resume.pdf`, About page, and a typed **Section Registry**), plus a custom 404 — all on **Astro 7.x + TypeScript (strict)** using the **Content Layer API** (`src/content.config.ts`, glob loader + Zod). The Section Registry is the architectural keystone: navigation, page routes, layout shells, and sitemap all derive from a single typed registry so future sections (Projects, Blog, Now, Uses — capped, REG-7) drop in as "a typed content file (self-registering via frontmatter) plus a per-section template component" with zero changes to nav/layout/sitemap/schema code (verified by T-22 with a stub Now section).

The site ships structured data (Person JSON-LD on Home, ProfilePage JSON-LD on Résumé), build-time `sitemap.xml`, a `robots.txt` that explicitly permits AI-assistant crawlers, self-hosted subset WOFF2 fonts (zero third-party requests), absolute canonical URLs pinned to exactly one host, and a Cloudflare Pages `_headers` policy that gives `/resume.pdf` a short cache TTL and noindexes non-canonical (deployment/preview) hosts. Content is edited as markdown, deployed on git push to the Cloudflare Pages free tier at `mattoconn.pages.dev` (availability checked at deploy; no custom domain in v1). No backend, no CMS, no auth, no analytics, no islands.

**Hard constraints encoded in the tickets:** zero client JS (JSON-LD `<script type="application/ld+json">` blocks are data, not JS, and must be exempt from the zero-JS scanner); no biographical facts invented by developers — all identity copy, links, and the résumé PDF are owner-provided (T-23, T-24 are human-blocked); all genuinely open aesthetics (font family, color palette, scoped-CSS-vs-Tailwind) are explicitly deferred to the tech design pass and referenced as "decision per tech design §…".

---

## Part A — The Tasking Checklist (the contract)

- [x] **T-1: Scaffold Astro 7 + TS strict + baseline static build** — `npm create astro@latest`, pin Astro 7.x, TypeScript strict, add `@astrojs/sitemap` + `zod`, verify the empty site builds to static `dist/`. (DEP-3, NF-6 | deps: none | M | astro/)
- [x] **T-2: Sections content schema (glob loader + Zod, closed template enum)** — `src/content.config.ts` defines the `sections` collection; template enum lives in shared `src/config/templates.ts` (pre-includes the four capped future templates; rejects anything else). (REG-1, REG-7 | deps: T-1 | S | content/)
- [x] **T-3: getSections() helper + typed section content skeletons** — `src/config/sections.ts` registration helper (sorted by `order`) and `home`/`resume`/`about` content skeleton files with `HUMAN COPY` placeholders. (REG-2, REG-6 | deps: T-2 | M | content/)
- [x] **T-4: Site URL config (PUBLIC_SITE_URL, default `https://mattoconn.pages.dev`)** — single source of truth driving `astro.config` `site`, canonical URLs, robots `Sitemap:`, and JSON-LD. (SEO-11, DEP-5 | deps: T-1 | S | astro/)
- [ ] **T-5: Nav component driven entirely by the sections registry** — `src/components/Nav.astro` iterates `getSections()`, zero hardcoded links. (US-10 | deps: T-3 | S | astro/)
- [ ] **T-6: BaseLayout with semantic landmarks + head slot** — `src/layouts/BaseLayout.astro`: `<header>/<main>/<nav>/<footer>`, registry-driven nav, slots for per-page head and body. (REG-4, SEO-9 | deps: T-5 | M | astro/)
- [ ] **T-8: Home scan-page template** — hero (name/role/domain/stack above the fold), condensed proof line, prominent GitHub/LinkedIn/Résumé/About links, no animations, mobile-first CSS. [NOTE: authored before the T-7 route; templates are unrouted components until T-7 renders them] (US-1, US-2, US-4 | deps: T-3, T-6 | M | astro/)
- [ ] **T-9: Résumé landing template** — title, brief context, prominent ≥44px "Download résumé (PDF)" button linking to `/resume.pdf`. (US-5 | deps: T-3, T-6 | S | astro/)
- [ ] **T-10: About template** — renders the registry content body (first-person markdown copy), mobile-responsive typography. (US-8 | deps: T-3, T-6 | S | astro/)
- [ ] **T-7: Registry-driven section route with template dispatch** — `src/pages/[...slug].astro` generates one route per registered section via `getStaticPaths()` and dispatches to the now-existing template components via `import.meta.glob`. (REG-6 | deps: T-6, T-8, T-9, T-10 | M | astro/)
- [ ] **T-11: Custom 404 page** — styled not-found page with `noindex`, home link, keyboard-accessible, mobile-perfect. (NF-2, NF-3 | deps: T-6 | S | astro/)
- [ ] **T-12: SEO head component (title/description/OG/canonical)** — every page gets a unique descriptive title, unique ≤160-char meta description, OG tags, and an absolute self-referencing canonical. (SEO-6, SEO-7, SEO-8, SEO-11 | deps: T-4, T-6, T-7, T-11 | M | astro/)
- [ ] **T-13: Person JSON-LD on Home** — inline `application/ld+json` data block **in the Home template body** (not head; design §8.3 decision), facts from shared `src/config/person.ts` with placeholders until T-23. (HOME-6, SEO-1 | deps: T-8, T-4 | S | astro/)
- [ ] **T-14: ProfilePage JSON-LD on Résumé** — inline `application/ld+json` data block in the Résumé template body referencing the shared Person facts from `src/config/person.ts`. (SEO-2 | deps: T-9, T-13, T-4 | S | astro/)
- [ ] **T-15: Sitemap generation via @astrojs/sitemap** — build-time `sitemap.xml` covering exactly the registered section URLs (no 404). (US-11 | deps: T-4, T-7, T-8, T-9, T-10 | S | astro/)
- [ ] **T-16: robots.txt endpoint (allow-all + AI crawlers + Sitemap line)** — prerendered `robots.txt`, global allow plus named Allow blocks for OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, and a `Sitemap:` line. (SEO-4 | deps: T-4 | S | astro/)
- [ ] **T-17: Self-hosted subset WOFF2 fonts** — vendor an OFL font family (IBM Plex Sans, per tech design §7), subset to used glyphs (needs built pages from T-8–T-11), `@font-face` with `font-display: swap`, zero font-CDN references. (SEO-5, NF-4 | deps: T-6, T-8, T-9, T-10, T-11 | M | assets/)
- [ ] **T-18: Build-time `_headers` generation** — `scripts/gen-headers.mjs` writes `dist/_headers`: `/resume.pdf` cache rule always, `X-Robots-Tag: noindex` only when building a non-canonical host. (US-7 | deps: T-4, T-7, T-8, T-9, T-10, T-11 | M | scripts/)
- [ ] **T-19: Cloudflare Pages deployment (git-push CI/CD)** — connect repo, production branch, build command, output `dist`, subdomain `mattoconn.pages.dev`, production env `PUBLIC_SITE_URL`. (US-12, US-13, US-14 | deps: T-18 | M | deploy/)
- [ ] **T-20: Static-output verification script (zero-JS + zero third-party)** — `scripts/verify-static.mjs` scans `dist/` for functional JS and external requests while exempting JSON-LD data blocks; retrofits the Cloudflare build gate (post-deploy). (NF-4, NF-5, DEP-3 | deps: T-7, T-8, T-9, T-10, T-11, T-15, T-16, T-17, T-18, T-19 | M | scripts/)
- [ ] **T-21: Lighthouse + accessibility + mobile QA pass** — mobile-preset Lighthouse (load <2s over throttled network), WCAG AA/a11y audit, 375–430px manual sweep on all pages. (US-3 | deps: T-8, T-9, T-10, T-11, T-12, T-17 | M | qa/)
- [ ] **T-22: Extensibility manual verification (stub "Now" section)** — register a stub section and prove it appears in nav + sitemap with zero nav/layout/sitemap code changes, then revert. (US-9 | deps: T-3, T-5, T-7, T-15 | S | qa/)
- [ ] **T-23: Author final Home/About copy + identity facts (owner-provided, HUMAN-BLOCKED)** — replace all placeholders with the owner's supplied copy: hero, proof line, GitHub/LinkedIn URLs, About paragraphs, JSON-LD facts. (US-1, US-8, US-13 | deps: T-8, T-10, T-13 | M | content/)
- [ ] **T-24: Commit owner-supplied résumé PDF + ATS text-extractability check (HUMAN-BLOCKED)** — place the owner's text-based `resume.pdf` at `public/resume.pdf`, verify text extraction and the served-cache behavior. (US-6 | deps: T-9, T-18, T-19 | S | public/)

---

### Ticket Details

#### T-1: Scaffold Astro 7 + TS strict + baseline static build

- **Acceptance Criteria:**
  - Astro project scaffolded in the repo root via `npm create astro@latest` (template `minimal`, `--no-git`, non-interactive `--yes`) and committed only after a clean baseline build. (AST-1, DEP-3)
  - `package.json` pins Astro `^7` (per PRD §9 researched decision: Content Layer API is the current API; legacy content collections are gone). (DEP-3)
  - TypeScript configured **strict**: `tsconfig.json` `strict: true`; `@astrojs/check` + `typescript` dev deps installed with an `astro check` script. (DEP-3)
  - Dependencies added via `npm add` (never hand-edited manifests): `@astrojs/sitemap` (for T-15), `zod` (for T-2). (DEP-3)
  - `npm run build` exits 0 and produces `dist/` containing only static HTML/CSS; `npx astro check` passes with zero errors; `npm run dev` serves the page. (DEP-3, NF-6)
  - Baseline build time recorded in a commit message/PR description — SHOULD target <60s per DEP-4.
  - `.gitignore` covers `node_modules/`, `dist/`, `.env*` (with `.env.example` committed later in T-4), and Cloudflare/wrangler junk. (DEP-3)
- **Affected paths:** `package.json`, `package-lock.json`, `tsconfig.json`, `astro.config.mjs`, `.gitignore`, `dist/`
- **Affected codebase:** `astro/`
- **Suggested skills:** `typescript`, `astro`, `npm`
- **Verification command(s):** `npm run build && npx astro check && ls dist/`
- **Notes:** Implements PRD §9 framework row (Astro 7.x + TS) and NF-6/DEP-3 (static-only output; no server runtime). Netlify/Vercel/Cloudflare all read `dist/` as the output dir — kept as the canonical output. Font/template/styling tooling is added later (T-17) so this ticket stays small.
- **Execution deviations (T-1, commit `8228acd`):** (1) `engines.node` is `>=22.12.0` (Astro 7.3.3's declared floor) rather than the tech design §10.2 example `>=20` — truthful to the framework and consonant with design §2's "22 LTS recommended"; the design example should be aligned when T-18 rewrites the scripts block. (2) `AGENTS.md` + `CLAUDE.md` (symlink) are committed as scaffold-adjacent agent tooling describing the repo's `astro dev --background` convention; they are unowned by any ticket (design §12.5) and flagged for the later unowned-files audit. Both reviewed as acceptable by reviewer + QA.

#### T-2: Sections content schema (glob loader + Zod, closed template enum)

- **Acceptance Criteria:**
  - `src/content.config.ts` defines a `sections` collection using the Content Layer API: `defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/sections' }), schema: … })`. (REG-1)
  - **Template enum lives in `src/config/templates.ts`** — `export const TEMPLATES = ['home','resume','about','projects','blog','now','uses'] as const` + `type Template` + `templateToComponentName()` (PascalCase + `Section` suffix). This is the single sanctioned extension point. **[DESIGN DEVIATION, supersedes v1.2 ticket wording]:** per tech design §4.2, the enum pre-includes the four capped future templates and **excludes `error`** (the 404 is a fixed page, not a registry section — see T-11/tech design §5.3); a content file with `template: 'error'` or any non-enum value fails the build (REG-7 closure). The prior `z.enum(['home','resume','about','error'])` literal is replaced by `z.enum(TEMPLATES)`.
  - Zod schema fields (per the normative registry design): `slug: z.string().regex(/^[a-z0-9-]+$/)`, `title: z.string().min(1)`, `navLabel: z.string().min(1)`, `order: z.number().int().positive()`, `template: z.enum(TEMPLATES)`, `description: z.string().min(1).max(160)`, optional home fields `github?: z.string().url()` and `linkedin?: z.string().url()`. (REG-1, REG-7)
  - **Closed enum (REG-7):** any content file whose `template` is not in the enum fails build/`astro check` with a schema error — verified by a temporary negative test (`template: 'bogus'`), then reverted. (REG-7)
  - `import { defineCollection } from 'astro:content'` (for the content-config collection definition) and `import { glob } from 'astro/loaders'` per current Astro 7 API. (REG-1)
- **Affected paths:** `src/content.config.ts`, `src/config/templates.ts`
- **Affected codebase:** `content/`
- **Suggested skills:** `typescript`, `astro`, `zod`
- **Verification command(s):** `npm run astro check` (clean); negative test: set `template: 'bogus'` in a content file → `npm run build` must fail, then revert.
- **Notes:** PRD REG-1/REG-7, §9 Content model row. Design §4.1–4.3 is normative (supersedes the enum wording above where they conflict). The 404 page is a fixed page consuming no template (design §5.3). T-22's extensibility verification depends on `now` already being a valid enum value here (design §4.2 resolution — pre-inclusion beats per-section schema edits).

#### T-3: getSections() helper + typed section content skeletons

- **Acceptance Criteria:**
  - `src/config/sections.ts` exports `getSections()` returning `getCollection('sections')` sorted by `data.order` ascending. (REG-2)
  - Three skeleton content files exist and build cleanly: `home.md` (`slug: home`, `title: "Matthew O'Connell"`, `navLabel: Home`, `order: 1`, `template: home`), `resume.md` (`order: 2`), `about.md` (`order: 3`). (REG-2, REG-6)
  - Every skeleton body and identity-adjacent frontmatter value that must come from the owner is explicitly marked `HUMAN COPY — <field>`; no invented biographical facts. (ABT-1..3, HOME-1..3 content deferred to T-23)
  - `getSections()` returns exactly 3 entries in `home → resume → about` order (verified via a log line or test file). (REG-2)
- **Affected paths:** `src/config/sections.ts`, `src/content/sections/home.md`, `src/content/sections/resume.md`, `src/content/sections/about.md`
- **Affected codebase:** `content/`
- **Suggested skills:** `typescript`, `astro`, `markdown`
- **Verification command(s):** `npx astro check && npm run build`; `rg -l 'HUMAN COPY' src/content/sections/` (each skeleton flagged)
- **Notes:** PRD REG-2 (registration list = one entry per section; the collection itself is the registry + this helper is the single config module). REG-6's "one registration entry" is the content file itself. Copy is placeholder-only by design — real content lands in T-23 (HUMAN).

#### T-4: Site URL config (PUBLIC_SITE_URL, default `https://mattoconn.pages.dev`)

- **Acceptance Criteria:**
  - `src/config/site.ts` exports `SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev'` — the **single source of truth** for all absolute URLs. (SEO-11, DEP-5)
  - `astro.config.mjs` sets `site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev'` so `@astrojs/sitemap` builds absolute URLs. (SEO-11, DEP-5)
  - `.env.example` documents `PUBLIC_SITE_URL` **and `CF_PAGES_BRANCH`** (for local preview-noindex simulation); no real `.env` committed. (DEP-6)
  - Build with the env var unset uses the default host and exits 0; build with `PUBLIC_SITE_URL=https://example.test` also exits 0 (dep-injection plumbing works). **[FIXED per plan review]:** final absolute-URL flip assertions (sitemap/canonical content) are verified in T-12 (canonical) and T-15 (sitemap), where output containing the site URL actually exists — a standalone grep over nonexistent `sitemap-0.xml` at T-4 was un-runnable. (SEO-11)
  - **Critical constraint encoded:** `CF_PAGES_URL` (Cloudflare's per-build host) must NEVER be used as the site URL — canonical always targets the production host; previews get `noindex` from T-18 instead. (SEO-11, SEO-12)
- **Affected paths:** `src/config/site.ts`, `astro.config.mjs`, `.env.example`
- **Affected codebase:** `astro/`
- **Suggested skills:** `typescript`, `astro`
- **Verification command(s):** `npm run build` (with and without `PUBLIC_SITE_URL` set — both exit 0); `PUBLIC_SITE_URL=https://example.test npm run build` then confirm the build is unaffected; presence: `rg 'PUBLIC_SITE_URL' astro.config.mjs src/config/site.ts .env.example`
- **Notes:** Requirements SEO-11 (canonical host), DEP-5 (subdomain), DEP-7 (via SITE_URL later in T-18). This is the agreed dep-injection point from the planning phase; sitemap (T-15), robots (T-16), canonical head (T-12), JSON-LD (T-13/T-14), and `_headers` (T-18) all read from here.

#### T-5: Nav component driven entirely by the sections registry

- **Acceptance Criteria:**
  - `src/components/Nav.astro` renders `<nav><ul>` iterating `getSections()`, with each `<a href="/{entry.data.slug}">` (home maps to `/`) showing `navLabel`. (REG-3, US-10)
  - **Zero hardcoded section links** — no literal `/resume` or `/about` anywhere in the component; removing a registry entry automatically removes its nav link. (REG-3, US-10)
  - Renders active/current styles via `Astro.url.pathname` (aria-current for the active page) per tech design §Layout & Styling. (NF-3)
  - Touch target for every link ≥44px (in conjunction with T-21 QA). (NF-2, US-2)
- **Affected paths:** `src/components/Nav.astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `typescript`, `css`, `a11y`
- **Verification command(s):** `npm run build` (scaffold builds green) `&& rg 'getSections\(' src/components/Nav.astro && ! rg 'href="/resume"|href="/about"' src/components/Nav.astro` (zero hardcoded links; note the `!` — a match here is a failure). Rendered-output checks (`href="/resume"` present in built HTML) run at T-7, when routes that render nav actually exist. [FIXED per plan review — the original `rg` over `dist/index.html` was un-runnable at T-5 rank]
- **Notes:** REG-3/US-10. T-22 proves the reverse direction (adding a section adds a nav link without touching this file).

#### T-6: BaseLayout with semantic landmarks + head slot

- **Acceptance Criteria:**
  - `src/layouts/BaseLayout.astro` wraps every page: `<html lang="en">`, `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, then `<header>` (with `<nav>` from T-5), `<main><slot /></main>`, `<footer>`. (SEO-9, NF-3)
  - A head slot (or composed `Seo` usage from T-12) lets each page supply `<title>`/meta/canonical per-route. (SEO-6..8 wired later by T-12)
  - **Zero `<script>` tags**; the layout ships no client JS. (NF-5)
  - Footer renders a minimal copyright line (name comes from the registry home entry, not hardcoded). (SEO-9)
  - Styling approach (scoped CSS vs Tailwind) and color palette: **decision per tech design §Layout & Styling** — do not pick arbitrarily.
- **Affected paths:** `src/layouts/BaseLayout.astro`, `src/assets/styles/global.css` (created here, minimal reset)
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `html`, `css`, `a11y`
- **Verification command(s):** `npm run build` (scaffold builds green) `&& rg '<header|<main|<footer|<nav>' src/layouts/BaseLayout.astro`; `rg 'slot' src/layouts/BaseLayout.astro`. Landmark presence in *every built page* (including `dist/404.html`) is asserted at T-7 for rendered routes and at T-21 for the full a11y sweep. [FIXED per plan review — the original `rg` over `dist/resume/index.html`/`dist/404.html` referenced pages that don't exist until T-7/T-11]
- **Notes:** REG-4 (layout shells derive from the registry — the layout is registry/template-agnostic glue), SEO-9, NF-3. Semantic landmarks must be present on every page including 404. Page-specific head content is a slot now, filled by T-12.

#### T-7: Registry-driven section route with template dispatch

- **Acceptance Criteria:**
  - `src/pages/[...slug].astro` (optional catch-all): `getStaticPaths()` returns one path per `getSections()` entry — `home` maps to `/` (`{ params: { slug: undefined } }`), others map to `/{slug}`. (REG-4, REG-6)
  - Template dispatch is glob-driven: `const templates = import.meta.glob('../templates/*.astro', { eager: true })` keyed by filename; the component for entry with `template: 'home'` resolves as `../templates/HomeSection.astro` (PascalCase + `Section` suffix). **[FIXED per plan review]:** a registered section whose template component is missing = **build failure** (loud, typed — a registry pointing at nothing is a programming error, per tech design §5.1); unknown URLs are served by Astro's built-in static `404.html` — there is no "error template fallback" (the enum has no `error` value, per tech design §4.2/§5.3). (REG-6)
  - A new section therefore needs **no changes to this route file** — the glob picks up new template components automatically. (REG-6, US-9)
  - Every generated route passes `section` data through to the template component, typed via the collection's inferred type. (REG-1)
- **Affected paths:** `src/pages/[...slug].astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `typescript`, `vite` (import.meta.glob)
- **Verification command(s):** `npm run build && ls dist/ dist/resume/ dist/about/ && rg -o 'href="/resume"|href="/about"' dist/index.html` (nav renders the three sections — the dist-level nav assertion deferred from T-5); via `npm run preview`, an unknown URL returns the 404 page.
- **Notes:** REG-4/REG-6 core machinery. Runs **after** the template components (T-8/T-9/T-10) precisely so the missing-template build-failure semantics (§5.1) are meaningful — the route is the consumer that renders them. Routing shape (optional catch-all with home→root) is normative for the design pass; if the design instead prefers fixed `index.astro` for home, the registry slug→path mapping must stay centralized in `getSections()`/a `sectionPath()` helper. The 404 is a fixed page (T-11); there is no error-template dispatch per tech design §5.3.

#### T-8: Home scan-page template

- **Acceptance Criteria:**
  - `src/templates/HomeSection.astro` renders: `<h1>` = owner name, role-in-domain + primary stack visible **above the fold** on a 375px viewport, all real selectable text (no image/CSS-only text). (HOME-1, US-1)
  - Condensed proof line (years of experience / kind of work) below the hero, rendered from the home content body/`description`. (HOME-2)
  - Prominent, hunt-free link row with **GitHub, LinkedIn, Résumé, and About** targets; GitHub/LinkedIn come from the typed frontmatter (`github`, `linkedin`) — touch targets ≥44px. (HOME-3, US-2, US-4)
  - Zero animations, zero stock photos, content-first (no decorative imagery, no load-delaying effects). (HOME-4)
  - No horizontal scroll down to 375px; mobile-first CSS. (HOME-5, NF-2)
  - All identity-specific copy remains `HUMAN COPY` placeholders pending T-23; the dev writes markup/layout, not facts. (HOME-1..3, US-1)
- **Affected paths:** `src/templates/HomeSection.astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `html`, `css`, `a11y`
- **Verification command(s):** `npm run build` (component typechecks) `&& rg 'GitHub|LinkedIn' src/templates/HomeSection.astro && rg 'href="/resume|href="/about' src/templates/HomeSection.astro`; manual 375px full-render check via `npm run preview` after T-7 (formal QA in T-21). Rendered-output assertions (`GitHub`/`LinkedIn` in `dist/index.html`) run at T-7. [FIXED per plan review — authored before the route, so `dist/` has no pages rendering the hero until T-7]
- **Notes:** HOME-1..5, US-1/US-2/US-4. Name, role, domain, stack, proof line, and profile URLs are owner facts — placeholders until T-23. JSON-LD for this page is T-13.

#### T-9: Résumé landing template

- **Acceptance Criteria:**
  - `src/templates/ResumeSection.astro` renders: page title (e.g., "Résumé"), one line of context from the registry `description`, and a single prominent **"Download résumé (PDF)"** anchor linking to `/resume.pdf`. (RES-1, US-5)
  - Download button is the unambiguous primary action: touch target ≥44px, high contrast, mobile-first; no other competing CTAs. (RES-4, NF-2)
  - **No résumé content authored or rendered in HTML** — the page is a landing surface only. (RES-1, OQ-1)
- **Affected paths:** `src/templates/ResumeSection.astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `css`, `a11y`
- **Verification command(s):** `npm run build && rg 'Download résumé \(PDF\)|href="/resume.pdf' src/templates/ResumeSection.astro`; rendered-output assertion checked at T-7. [FIXED per plan review — `dist/resume/index.html` doesn't exist until the T-7 route builds it]
- **Notes:** RES-1/RES-4, US-5; PRD §4.1 OQ-1 decision (direct PDF link, not web-rendered résumé). Button link works even before T-24 lands (404 until the owner supplies the PDF, which is the expected interim state). ProfilePage JSON-LD for this page is T-14.

#### T-10: About template

- **Acceptance Criteria:**
  - `src/templates/AboutSection.astro` renders the about content entry's markdown body via the Astro content renderer (`render()`/`<Content />`). (ABT-1..3, US-8)
  - Typography mobile-responsive (readable without pinch-zoom at 375px), semantic `<article>` markup. (ABT-4, NF-2, NF-3)
  - Zero structural assumptions about paragraph count/voice — those are copy concerns owned by T-23. (ABT-1..3)
- **Affected paths:** `src/templates/AboutSection.astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `markdown`, `css`
- **Verification command(s):** `npm run build && rg -c '<article' src/templates/AboutSection.astro`; rendered-output assertion checked at T-7. [FIXED per plan review — `dist/about/index.html` doesn't exist until the T-7 route builds it]
- **Notes:** ABT-1..4, US-8. The 2–4 first-person paragraphs live in `src/content/sections/about.md` (T-3 skeleton, T-23 final copy) — the template must not invent content.

#### T-11: Custom 404 page

- **Acceptance Criteria:**
  - `src/pages/404.astro` renders a styled "404 — page not found" surface using `BaseLayout` (fixed page per tech design §5.3; **no** error-template dispatch — the enum has no `error` value). (NF-2, NF-3)
  - Includes a keyboard-focusable, ≥44px "Back to home" link; no layout breakage at 375px. (NF-2, NF-3)
  - Ships `<meta name="robots" content="noindex">` and is **excluded from the sitemap** (T-15 filter). (SEO-3/SEO-10 hygiene)
  - No client JS. (NF-5)
- **Affected paths:** `src/pages/404.astro` (fixed page; **no** `ErrorSection.astro` — tech design §5.3 declined the error-template option so `src/templates/` stays in bijection with the enum)
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `css`, `a11y`
- **Verification command(s):** `npm run build && ls dist/404.html && rg -i '404|not found' dist/404.html`
- **Notes:** Not a registry section (per planning context); the PRD has no explicit 404 requirement row — this ticket satisfies the general NF-2/NF-3 baseline for error navigation and keeps unknown URLs from returning 404-html without styling. Sitemap exclusion verified in T-15.

#### T-12: SEO head component (title/description/OG/canonical)

- **Acceptance Criteria:**
  - `src/components/Seo.astro` composes into `BaseLayout`'s head slot and renders, per page: `<title>` (pattern per tech design §5.2: home → `home.title`; other sections → `{home.title} — {entry.data.title}`, e.g. `Matthew O'Connell — Résumé` — mechanical off the registry, owner's name spelling is T-23 copy), unique `meta name="description"` ≤160 chars, Open Graph `og:title`/`og:description`/`og:type` (type `website`), and a **self-referencing absolute canonical** `<link rel="canonical" href="{absoluteUrl(path)}">` computed from `SITE_URL`. (SEO-6, SEO-7, SEO-8, SEO-11)
  - Exactly **one canonical host**: every page canonicalizes to `SITE_URL` (default `https://mattoconn.pages.dev`) — on preview hosts these are cross-host canonicals pointing at production, which is correct. (SEO-11)
  - Every page supplies its title/description via route props or registry data; descriptions are unique per page. (SEO-6, SEO-7)
  - Canonical URL, sitemap URL, and `robots.txt` `Sitemap:` line are byte-identical (trailing-slash normalized) — cross-cutting consistency enforced here. (SEO-3, SEO-11)
- **Affected paths:** `src/components/Seo.astro`, `src/layouts/BaseLayout.astro` (head slot wiring), `src/pages/[...slug].astro` (per-route title/description), `src/pages/404.astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `typescript`, `seo`, `html`
- **Verification command(s):** `npm run build && rg -c 'rel="canonical"' dist/index.html dist/resume/index.html dist/about/index.html` (3 pages) and `rg '<title' dist/*/index.html dist/index.html`
- **Notes:** SEO-6/7/8/11 (all from OQ-3). Trailing-slash policy must match the sitemap integration's output — normalize once in `site.ts`/path helper. `og:image` is not required by SEO-8 and is deliberately omitted (no stock imagery per HOME-4).

#### T-13: Person JSON-LD on Home

- **Acceptance Criteria:**
  - The **Home template body** (top of the section markup inside `<main>`) includes `<script type="application/ld+json" is:inline>` containing a `Person` node: `@context: https://schema.org`, `@type: Person`, `name`, `url` (= SITE_URL root), `jobTitle`, and `sameAs` = [GitHub, LinkedIn URLs]. **[DESIGN DEVIATION, supersedes v1.2 wording]:** tech design §8.3 places JSON-LD data blocks in the body, not `<head>` (head-placement would force per-template wiring in the route file, violating REG-6; crawlers parse JSON-LD anywhere in the document). `is:inline` guarantees Astro leaves the block untouched.
  - All personal facts are read from the **single shared facts module `src/config/person.ts`** (derives name/url/sameAs from the registry + SITE_URL; `jobTitle` is a marked `HUMAN COPY` constant) — no duplicated or inline-authored facts. (HOME-6, SEO-1)
  - The block is **valid JSON** and rendered inline in the built HTML (no external fetch). (SEO-1, NF-4)
  - Note for QA: this `<script>` is a **data block, not client-side JS** — the T-20 scanner must exempt `type="application/ld+json"`. (NF-5 boundary)
- **Affected paths:** `src/templates/HomeSection.astro`, `src/components/JsonLdPerson.astro`, `src/config/person.ts`
- **Affected codebase:** `astro/`
- **Suggested skills:** `json-ld`, `typescript`
- **Verification command(s):** `npm run build && rg -A4 'application/ld\+json' dist/index.html` (manually valid + `node -e` JSON.parse of the block)
- **Notes:** HOME-6, SEO-1, PRD §5.5 context (rich parsing is the realistic SEO win for a common name). `sameAs`/`jobTitle`/name spelling are owner facts → T-23.

#### T-14: ProfilePage JSON-LD on Résumé

- **Acceptance Criteria:**
  - The **Résumé template body** includes `<script type="application/ld+json" is:inline>` with `@type: ProfilePage`, `name`, `url` (the résumé page's absolute canonical URL), and a `mainEntity` reference to the Person node — all facts drawn from the same shared `src/config/person.ts` source, no duplication. **[DESIGN DEVIATION, supersedes v1.2 wording]:** body placement per tech design §8.3 (same rationale as T-13). (SEO-2)
  - Valid JSON, inline, no external requests. (SEO-2, NF-4)
- **Affected paths:** `src/templates/ResumeSection.astro`, `src/components/JsonLdProfilePage.astro`, `src/config/person.ts`
- **Affected codebase:** `astro/`
- **Suggested skills:** `json-ld`, `typescript`
- **Verification command(s):** `npm run build && rg -A4 'application/ld\+json' dist/resume/index.html`
- **Notes:** SEO-2 (promoted to MUST in OQ-3 — name commonness makes structured data critical). Keep the Person node definition in **one** shared module so Home + Résumé reference identical facts.

#### T-15: Sitemap generation via @astrojs/sitemap

- **Acceptance Criteria:**
  - `@astrojs/sitemap` enabled in `astro.config.mjs` with `site: SITE_URL`, producing build-time `sitemap-index.xml` + `sitemap-0.xml`. (SEO-3, HOME-7)
  - Sitemap contains **exactly** the three registered-section URLs (`/`, `/resume`, `/about`) — hence derived from the registry routes (T-7) with no manual URL list. (REG-5, US-11, HOME-7)
  - `/404.html` and the sitemap/robots endpoints are excluded via the integration's `filter` option. (SEO-3)
  - Sitemap URLs use the same trailing-slash policy as canonical links (cross-checked in T-12). (SEO-11)
- **Affected paths:** `astro.config.mjs` (sitemap config + `filter`)
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `seo`
- **Verification command(s):** `npm run build && rg -o '<loc>[^<]+' dist/sitemap-0.xml`
- **Notes:** SEO-3, REG-5, US-11, HOME-7. The integration crawls generated routes — routes come from the registry, so "sitemap derives from the registry" holds structurally (this is the mechanism for US-11 and REG-5). Coordinates with T-16's `Sitemap:` line pointing at `sitemap-index.xml`.

#### T-16: robots.txt endpoint — allow-all + explicit AI crawlers + Sitemap line

- **Acceptance Criteria:**
  - `src/pages/robots.txt.ts` (prerendered static endpoint) emits `robots.txt` containing: `User-agent: *` / `Allow: /` plus **explicit per-bot Allow blocks** for `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, and `ClaudeBot`, and a final `Sitemap: {SITE_URL}/sitemap-index.xml` line. (SEO-4)
  - The `Sitemap:` line is generated from `SITE_URL` (T-4) — no hardcoded host. (SEO-4, SEO-11)
  - No `Disallow` rules anywhere (visiting bots must stay crawlable). (SEO-4, SEO-12 philosophy)
- **Affected paths:** `src/pages/robots.txt.ts`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `seo`
- **Verification command(s):** `npm run build && rg 'OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Sitemap:' dist/robots.txt`
- **Notes:** SEO-4 (2026 research: blanket disallows silently block AI visibility; named bots allowed explicitly). A `.ts` route with static output prerenders to `dist/robots.txt`; `Sitemap:` targets `sitemap-index.xml` to match @astrojs/sitemap's output name.

#### T-17: Self-hosted subset WOFF2 fonts

- **Acceptance Criteria:**
  - A single open-licensed (OFL) font family is vendored locally — **family, weights, and color/typography scale are decisions per tech design §Fonts / §Layout & Styling** (open aesthetics; do not pick arbitrarily). (SEO-5)
  - Font files are subset to the glyphs the site actually uses (via the `glyphhanger` npm tool or `subset-font`) and emitted as WOFF2 into `src/assets/fonts/` (imported so Astro fingerprints them into `dist/`). (SEO-5, NF-4)
  - Global CSS declares `@font-face` with `font-display: swap` (content-first rendering). (SEO-5, NF-1)
  - **Zero** references to any font CDN (`fonts.googleapis.com`, `fonts.gstatic.com`, etc.) in source or `dist/`. (SEO-5, NF-4)
- **Affected paths:** `src/assets/fonts/*.woff2`, `src/assets/styles/global.css` (font-face rules), `scripts/subset-fonts.*` (optional, if not one-shot)
- **Affected codebase:** `assets/`
- **Suggested skills:** `css`, `font-subsetting` (glyphhanger/subset-font), `npm`
- **Verification command(s):** `npm run build && (rg -i 'googleapis|gstatic|fonts\.google' dist/ || echo 'NO external fonts')`; `rg '@font-face' dist/_astro/*.css`
- **Notes:** SEO-5, NF-4. Research fact: 2026 font delivery best practice is self-hosted subset WOFF2 — no third-party font CDN, no external requests on load. Keep total shipped font weight tiny (single family, 1–2 weights + latin subset) to protect the NF-1 <2s budget. `glyphhanger` (Node) is preferred over Python tooling.

#### T-18: Build-time `_headers` generation

- **Acceptance Criteria:**
  - `scripts/gen-headers.mjs` runs as part of the build (`node scripts/gen-headers.mjs` after `astro build`) and writes `dist/_headers`. (DEP-7)
  - **Both rule sets are always present in the applicable branch:** (1) `/resume.pdf` → `Cache-Control: public, max-age=60, must-revalidate` (DEP-7, RES-5, US-7); (2) when the build is **not** for the canonical host — detected via `CF_PAGES_BRANCH`/PR env (e.g. preview or deployment branches) — a global `/*` `X-Robots-Tag: noindex` is emitted. Production builds of the canonical host emit **no** noindex rule. (SEO-12)
  - Mechanism note (decided default): Cloudflare `_headers` cannot match by host, so the noindex-for-non-canonical-hosts behavior is achieved by branch-triggered generation; the tech design §Headers & Deploy confirms the final detection method (env-var based). (SEO-12)
  - `Cache-Control` value byte-exact per DEP-7; stable path `/resume.pdf` unchanged. (DEP-7)
- **Affected paths:** `scripts/gen-headers.mjs`, build command in `package.json` (`build: "astro build && node scripts/gen-headers.mjs"`), `dist/_headers` (generated)
- **Affected codebase:** `scripts/`
- **Suggested skills:** `node`, `ci/cd-cloudflare`, `http-caching`
- **Verification command(s):** `npm run build && cat dist/_headers`; preview simulation: `CF_PAGES_BRANCH=preview-x npm run build && rg noindex dist/_headers`; production: no noindex, `rg 'max-age=60' dist/_headers`
- **Notes:** DEP-7 (MUST), RES-5 (SHOULD), SEO-12 (MUST), US-7 (P1). Research finding: Cloudflare serves the same build on multiple hosts (`<hash>.mattoconn.pages.dev`, preview URLs) — the "duplicate site outranks real site" failure mode is prevented by `noindex` **headers**, not `robots.txt` Disallow (pages must stay crawlable to be deindexed by the noindex signal). Never set `PUBLIC_SITE_URL` to a preview host (T-4 constraint).

#### T-19: Cloudflare Pages deployment (git-push CI/CD)

- **Acceptance Criteria:**
  - Repo connected to Cloudflare Pages via "Connect to Git" (or `wrangler pages` if a config-first flow is preferred per tech design §Headers & Deploy); production branch is the repo default (e.g., `main`). (DEP-1, DEP-2, DEP-6)
  - Build configuration: build command `npm run build` (which includes the T-18 headers step), output directory `dist`. (DEP-1, DEP-3)
  - Production environment variable `PUBLIC_SITE_URL=https://mattoconn.pages.dev` set in the Pages project (T-4 wiring). (DEP-5)
  - Subdomain **`mattoconn.pages.dev`** requested; if unavailable, stop and escalate to the planner (do not silently pick another name). (DEP-5)
  - Git push → auto-deploy completes in <5 minutes with a successful build log; content edit → push → deployed content updated. (DEP-2, DEP-6, US-12, US-13)
  - Site reachable at the free subdomain with zero cost; custom domain **not** configured. (DEP-1, DEP-5, US-14)
  - **[FIXED per plan review]:** the `npm run verify` CI-gate retrofit is **owned by T-20** (which updates the Cloudflare build command to `npm run build && npm run verify` once the script exists) — T-19 completes with CI running `npm run build` alone; do not block T-19 on a gate whose dependency hasn't shipped. (DEP-3)
- **Affected paths:** Cloudflare Pages project config (dashboard) and/or `wrangler.toml` (if used), repo CI config if applicable, `README` deploy note (optional)
- **Affected codebase:** `deploy/`
- **Suggested skills:** `ci/cd-cloudflare`, `devops`, `git`
- **Verification command(s):** `git push origin main` then `curl -sI https://mattoconn.pages.dev/ | head -1` (HTTP 200). **[FIXED per plan review]:** the `/resume.pdf` smoke check (200 + cache headers) lives in **T-24** (the PDF file does not exist until then and 404s by design).
- **Notes:** DEP-1/2/5/6, US-12/13/14. Cloudflare Pages free tier: unlimited bandwidth/requests, no commercial restriction, `_headers` support — the researched platform decision (PRD §5.6). Subdomain availability must be confirmed at deploy time (DEP-5). Preview branches from PRs automatically inherit the noindex behavior from T-18.

#### T-20: Static-output verification script (zero-JS + zero third-party)

- **Acceptance Criteria:**
  - `scripts/verify-static.mjs` walks `dist/**` and fails (non-zero exit) if it finds any **functional** client JS: `<script src=…>`, inline `<script>` bodies with executable content, or event-handler attributes (`onclick=`, `onload=`, etc.). (NF-5, DEP-3)
  - **Exempts** `<script type="application/ld+json">` — these are data blocks, not client-side JavaScript. (NF-5 boundary, SEO-1/SEO-2)
  - Fails if any page references a third-party origin (`http(s)://` host ≠ `SITE_URL`, plus `//`-protocol-relative) in `href`/`src`/`srcset`. (NF-4)
  - Fails if `dist/404.html`, `dist/robots.txt`, sitemap files, or the `/resume.pdf` anchor in the built résumé page are missing. (DEP-3, RES-1)
  - Exposed as `npm run verify`. **[FIXED per plan review]:** also owns the **CI retrofit** — update the Cloudflare Pages build command to `npm run build && npm run verify` so the gate blocks bad deploys (coordinate with the T-19 deploy owner; T-19 itself completes before this). (DEP-3, NF-5)
  - Negative test performed during QA: temporarily inject `<script src=evil>` into a page, confirm the script fails, then revert. (NF-5)
- **Affected paths:** `scripts/verify-static.mjs`, `package.json` (`verify` script)
- **Affected codebase:** `scripts/`
- **Suggested skills:** `node`, `regex/parsing`, `typescript`
- **Verification command(s):** `npm run build && npm run verify` (exit 0); negative test: inject a script tag → `npm run verify` must exit non-zero → revert.
- **Notes:** NF-4, NF-5, DEP-3. This is the PRD's zero-JS assertion ticket (QA stage). The JSON-LD exemption is explicit per planning context — the scanner targets functional-JS markers, not data blocks. Astro's static output ships no JS by default; this gate protects against future accidental islands/runtime regressions.

#### T-21: Lighthouse + accessibility + mobile QA pass

- **Acceptance Criteria:**
  - Lighthouse **mobile preset** against `npm run preview` (or the deployed URL post-T-19): full render/load <2s on throttle (3G/4G simulation) — NF-1/US-3; no perf-blocking regressions from fonts (T-17) or CSS. (NF-1, US-3)
  - a11y audit (axe or Lighthouse a11y) passes on all four routes: WCAG AA contrast, keyboard-navigable, no landmark/alt issues. (NF-3)
  - Manual sweep at 375px / 390px / 430px viewports on every page: **no horizontal scroll**, all touch targets ≥44px, readable without pinch-zoom. (NF-2, HOME-5)
  - Any failing finding is fixed in this ticket (or split out as a follow-up ticket if it exceeds size M). (NF-1..3)
- **Affected paths:** QA-only (audit reports), plus fixes to `src/**` if findings; no committed report artifacts unless the plan requires them
- **Affected codebase:** `qa/`
- **Suggested skills:** `lighthouse`, `a11y`, `performance`, `css`
- **Verification command(s):** `npm run preview & npx lighthouse http://localhost:4321/ --form-factor=mobile --output=json --quiet` (per-route); manual 375/390/430px sweep via devtools.
- **Notes:** NF-1/2/3, US-3, HOME-5. Run against local preview for determinism; re-verify the production URL after T-19 as an optional confirmation. Contrast/typography depend on the tech design §Layout & Styling decisions consumed by T-6/T-8/T-10.

#### T-22: Extensibility manual verification (stub "Now" section)

- **Acceptance Criteria:**
  - Per US-9/REG-6, register a stub section end-to-end: (1) add `src/content/sections/now.md` (`slug: now`, `title: Now`, `navLabel: Now`, `order: 4`, `template: now`), (2) add `src/templates/NowSection.astro` (the section's own renderer — picked up automatically by the T-7 glob dispatch). **[DESIGN DEVIATION, supersedes v1.2 wording]:** tech design §4.2 **pre-includes** `now` in `TEMPLATES` (alongside `projects|blog|uses`) — the stub needs **no enum or schema edit**; this is the cleanest reading of "typed content file + one registration entry" (zero changes to `src/config/templates.ts` and `src/content.config.ts`). (US-9, REG-6, REG-7)
  - `npm run build` succeeds, and the stub appears in the nav (`src/components/Nav.astro` untouched) and in the sitemap (`src/pages/[...slug].astro`, `astro.config.mjs` untouched). (US-9, US-10, US-11, REG-6)
  - Assert via `git diff`: **zero changes** to `src/components/Nav.astro`, `src/layouts/BaseLayout.astro`, `src/pages/[...slug].astro`, `src/config/templates.ts`, `src/content.config.ts`, or `astro.config.mjs` (per tech design §12.4). (REG-6, US-9)
  - Revert the stub (remove `now.md` and `NowSection.astro`) at the end of the ticket; leave the tree clean. (REG-7: arbitrary sections are not shipped)
- **Affected paths:** temporary: `src/content/sections/now.md`, `src/templates/NowSection.astro` (both reverted)
- **Affected codebase:** `qa/`
- **Suggested skills:** `astro`, `typescript`, `git`
- **Verification command(s):** `rg 'href="/now"' dist/index.html` and `rg '/now' dist/sitemap-0.xml` (during the stub); `git diff --stat` shows no `Nav.astro`/`BaseLayout.astro`/`[...slug].astro`/sitemap changes; final `git status` clean after revert.
- **Notes:** US-9 is the PRD's own acceptance test for the extensibility promise (PRD §8). The REG-6/REG-7 tension is **resolved by tech design §4.2**: the enum (`src/config/templates.ts`) pre-includes the four capped future templates, so this test is a true two-file change (content file + template component) with zero schema edits. Update the linear-sequence cross-references if the checklist T-22 line changes accordingly.

#### T-23: Author final Home/About copy + identity facts (owner-provided, HUMAN-BLOCKED)

- **Acceptance Criteria:**
  - **HUMAN-BLOCKED:** requires the site owner's supplied copy. All `HUMAN COPY` placeholders in `src/content/sections/home.md` and `about.md` are replaced with the owner's actual text — name/title presentation, role-in-domain, primary stack, condensed proof line, GitHub + LinkedIn URLs, About's 2–4 first-person paragraphs with genuine hobby threads, warm tone, not a third-person CV recital. (HOME-1..3, ABT-1..3, US-1, US-8)
  - JSON-LD `Person` facts (`jobTitle`, `sameAs`, name spelling) updated from the same owner data (T-13 placeholders). (HOME-6, SEO-1)
  - **Devs must not invent biographical facts** — if the owner has not supplied copy, this ticket stays blocked; do not substitute placeholder text as final. (ABT-1..3)
  - Copy edits flow through the content pipeline: edit markdown → commit → push → live after deploy. (DEP-6, US-13)
- **Affected paths:** `src/content/sections/home.md`, `src/content/sections/about.md`, JSON-LD source module (T-13)
- **Affected codebase:** `content/`
- **Suggested skills:** `markdown`, `copywriting-review` (human), `typescript` (trim wiring)
- **Verification command(s):** `npm run build` after copy lands; manual diff review confirming no placeholder text remains (`rg 'HUMAN COPY' src/content/` → empty); `rg 'GitHub|LinkedIn' dist/index.html` shows the real profile URLs.
- **Notes:** HOME-1..3, ABT-1..3, US-1/US-8/US-13, DEP-6. This ticket is deliberately last-but-one: structure ships with marked placeholders; only the owner can finalize identity facts. Do not block earlier tickets on it.

#### T-24: Commit owner-supplied résumé PDF + ATS text-extractability check (HUMAN-BLOCKED)

- **Acceptance Criteria:**
  - **HUMAN-BLOCKED:** the owner supplies the current résumé PDF; the dev does not fabricate or convert one. The file is committed at exactly `public/resume.pdf` (stable, linkable path; deploys with the site on git push). (RES-2, OQ-1)
  - ATS/authoring check performed once at content-add time: the PDF is **text-extractable** (a real text layer, not an image scan) — verified via `pdftotext`/`mdls` output volume. (RES-3, US-6)
  - With T-18 headers live, `curl -I` on the deployed `/resume.pdf` shows `Cache-Control: public, max-age=60, must-revalidate` and a 200. (DEP-7, US-7)
  - The Résumé landing button (T-9) resolves to the file; download works on mobile. (RES-4, US-5)
- **Affected paths:** `public/resume.pdf`
- **Affected codebase:** `public/`
- **Suggested skills:** `pdf` (verification only), `git`
- **Verification command(s):** `pdftotext public/resume.pdf - | wc -w` (word count » 0 → text layer exists); `npm run preview` + `curl -sI http://localhost:4321/resume.pdf | rg '200|content-type'`
- **Notes:** RES-2/RES-3/RES-4, US-6/US-7, OQ-1/OQ-4 decisions from PRD §11. Verification is at content-add time only (never a build-time guarantee — PRD RES-3 note). Until the owner supplies the file, `/resume.pdf` 404s by design; the site otherwise ships.

---

## Dependency Graph

Linear backbone (single-pass order; every dependency appears strictly before its dependent):

```
T-1 (scaffold)
 ├─ T-2 (schema) ── T-3 (helper + skeletons) ── T-5 (nav) ── T-6 (layout) ── T-7 (route) ── T-8/T-9/T-10 (templates) ── T-13/T-14 (JSON-LD) ── ...
 └─ T-4 (site URL)
      ├─ T-12 (SEO head)  ── T-21 (QA)
      ├─ T-15 (sitemap)  ── T-22 (extensibility)
      ├─ T-16 (robots)
      ├─ T-18 (_headers) ── T-19 (deploy)  ── T-24 (PDF, after T-9)
      └─ T-13/T-14 (JSON-LD URLs)
T-8 ── T-20 (verify script)   T-17 (fonts) ── T-19/T-20/T-21
T-8/T-10/T-13 ── T-23 (human copy)
T-9/T-18 ── T-24 (human PDF)
```

Explicit edges:

| Ticket | Depends on |
|---|---|
| T-1 | — |
| T-2 | T-1 |
| T-3 | T-2 |
| T-4 | T-1 |
| T-5 | T-3 |
| T-6 | T-5 |
| T-7 | T-6, T-8, T-9, T-10 |
| T-8, T-9, T-10 | T-3, T-6 |
| T-11 | T-6 |
| T-12 | T-4, T-6, T-7, T-11 |
| T-13 | T-8, T-4 |
| T-14 | T-9, T-13, T-4 |
| T-15 | T-4, T-7, T-8, T-9, T-10 |
| T-16 | T-4 |
| T-17 | T-6, T-8, T-9, T-10, T-11 |
| T-18 | T-4, T-7, T-8, T-9, T-10, T-11 |
| T-19 | T-18 |
| T-20 | T-7, T-8, T-9, T-10, T-11, T-15, T-16, T-17, T-18, T-19 |
| T-21 | T-8, T-9, T-10, T-11, T-12, T-17 |
| T-22 | T-3, T-5, T-7, T-15 |
| T-23 | T-8, T-10, T-13 |
| T-24 | T-9, T-18, T-19 |

---

## Risk Assessment

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **`mattoconn.pages.dev` subdomain unavailable** (DEP-5) | High | T-19 checks availability at deploy time and **stops + escalates to the planner** rather than silently picking another name. All URLs already dep-inject via `SITE_URL` (T-4), so a rename is a one-variable change. |
| R2 | **Preview/deployment-host `noindex` mechanism** (SEO-12): Cloudflare `_headers` cannot match by host, so the noindex signal must be branch/env-triggered at build (T-18). Wrong detection → either leaked preview indexation or — worse — noindexing the canonical host. | High | Detection via `CF_PAGES_BRANCH`/build env with the production branch explicitly enumerated; prod builds never emit noindex. Canonical tags always target `SITE_URL` (never `CF_PAGES_URL`). Confirmed in tech design §Headers & Deploy. |
| R3 | **Human-blocked content stalls delivery** (T-23 copy, T-24 PDF) | Medium | Both tickets are explicitly HUMAN-BLOCKED and last in order; the site fully ships and deploys with clearly-marked placeholders, so the pipeline is never blocked upstream. No dev-authored biographical facts substituted. |
| R4 | **US-9/REG-6 vs REG-7 tension**: the closed `home\|resume\|about\|error` template enum can't accept a stub `now` section without touching the schema. | Medium | T-22's test procedure scopes the enum change to its single sanctioned extension module and asserts zero nav/layout/sitemap/route changes. Tech design §Content Schema & Registry decides: pre-include the four capped future templates vs. one-line extension per section. |
| R5 | **Zero-JS scanner false negatives/positives** (NF-5): JSON-LD `<script>` blocks must not be flagged; a future island must be flagged. | Medium | T-20 exempts only `type="application/ld+json"`; treats `script src`, inline JS bodies, and event-handler attributes as violations; negative test (plant a script, expect failure) is part of acceptance. |
| R6 | **Astro 7 / Content Layer API surface drift** (glob loader imports, zod expectations) — legacy content-collections syntax no longer works in Astro 6+. | Medium | T-1 pins Astro `^7` and T-2 prescribes `astro:content` `defineCollection` + `astro/loaders` `glob`; `npx astro check` + `npm run build` gate each schema ticket. Tech design §Content Schema & Registry pins exact signatures. |
| R7 | **NF-1 load <2s on throttled mobile** compromised by fonts/CSS weight (or preview-host latency). | Medium | T-17 subsets to used glyphs, single family, WOFF2, `font-display: swap`; T-21 gates the metric on a local preview (deterministic) before production confirmation. |
| R8 | **Canonical/sitemap/robots URL drift** (trailing-slash or host inconsistencies) could reintroduce the duplicate-host indexing bug (SEO-11/12). | Medium | Single `SITE_URL` source (T-4) + a `path()` helper normalized once; T-12/T-15/T-16 all read from it; byte-identical URLs are explicit acceptance criteria in T-12. |
| R9 | **`npm create astro` interactivity/network flakiness in an automated pipeline.** | Low | Non-interactive flags (`--template minimal --no-git --yes`); if registry access fails, retry/freeze versions per tech design §Repo Layout & Tooling. |
| R10 | **Preview env leakage**: `PUBLIC_SITE_URL` accidentally set to a preview host in a preview build breaks canonical/noindex pairing. | Medium | Env var only configured on the production branch in the Pages project (T-19); previews use the default canonical value. Documented as a hard constraint in T-4. |

---

## PRD Coverage Matrix (completeness proof — no MUST requirement orphaned)

| PRD ID | Ticket(s) | PRD ID | Ticket(s) |
|---|---|---|---|
| HOME-1 | T-8 (+T-23) | SEO-1 | T-13 (+T-23) |
| HOME-2 | T-8 (+T-23) | SEO-2 | T-14 |
| HOME-3 | T-8 (+T-23) | SEO-3 | T-15 |
| HOME-4 | T-8 | SEO-4 | T-16 |
| HOME-5 | T-8, T-21 | SEO-5 | T-17 |
| HOME-6 | T-13 | SEO-6 | T-12 |
| HOME-7 | T-15 | SEO-7 | T-12 |
| RES-1 | T-9 | SEO-8 | T-12 |
| RES-2 | T-24 | SEO-9 | T-6 |
| RES-3 | T-24 | SEO-10 | T-5, T-12, T-15 |
| RES-4 | T-9, T-21 | SEO-11 | T-4, T-12 |
| RES-5 (SHOULD) | T-18 | SEO-12 | T-18 |
| ABT-1 | T-10, T-23 | DEP-1 | T-19 |
| ABT-2 | T-23 | DEP-2 | T-19 |
| ABT-3 | T-23 | DEP-3 | T-1, T-20 |
| ABT-4 | T-10, T-21 | DEP-4 (SHOULD) | T-1 |
| REG-1 | T-2 | DEP-5 | T-4, T-19 |
| REG-2 | T-3 | DEP-6 | T-19, T-23 |
| REG-3 | T-5 | DEP-7 | T-18, T-24 |
| REG-4 | T-6, T-7 | NF-1 | T-21 |
| REG-5 | T-15 | NF-2 | T-8, T-9, T-11, T-21 |
| REG-6 | T-7, T-22 | NF-3 | T-5, T-6, T-11, T-21 |
| REG-7 | T-2, T-22 | NF-4 | T-17, T-20 |
| | | NF-5 | T-6, T-11, T-20 |
| | | NF-6 | T-1 |

| User Story | Ticket(s) | User Story | Ticket(s) |
|---|---|---|---|
| US-1 | T-8, T-23 | US-8 | T-10, T-23 |
| US-2 | T-8 | US-9 | T-22 |
| US-3 | T-21 | US-10 | T-5 |
| US-4 | T-5, T-8 | US-11 | T-15 |
| US-5 | T-9 | US-12 | T-19 |
| US-6 | T-24 | US-13 | T-19, T-23 |
| US-7 | T-18, T-24 | US-14 | T-19 |
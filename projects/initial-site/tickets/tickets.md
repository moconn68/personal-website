# Tickets — Personal Website v1 (Matthew O'Connell)

> **Project:** `initial-site` — site initialization. These tickets cover exactly that: the three surfaces, the Section Registry, and the first deploy. The capabilities deferred in PRD §7 are **not** in this file and are not "later tickets" — each is a separate project directory under `projects/` with its own tickets file. Do not extend this file's checklist to cover them.
> **Source of truth:** `projects/initial-site/PRDs/PRD.md` (v1.6). Supersedes the vision doc where they conflict.
> **Read before executing:** this file is the Orchestrator's **sole tasking source**. `projects/initial-site/plans/plan.md` is reference only.
> **Execution mode:** the checklist in Part A is strictly **topologically ordered** — a single lazy pass from the top of the list to the bottom is a valid execution order. Every ticket's dependencies appear strictly before it in the file, with one recorded exception: retired ticket `T-9` is still named in the `deps:` of six **completed** tickets, where the edge is inert history rather than an instruction (see the Dependency Graph section).

> ### ⚠ Scope change (PRD v1.5, 2026-09-26) — the résumé surface is removed
>
> The owner no longer publishes the résumé on this site. **T-9**, **T-14**, and **T-24** are
> **RETIRED** (kept as `- [x]` audit records, never re-run; their T-IDs are permanently reserved
> and appear in historical QA reports under `projects/initial-site/qa/`). New tickets
> **T-25..T-28** delete the résumé code that already shipped in earlier commits, and are sequenced
> **before `T-19`** so the résumé is never publicly deployed.
>
> - **Next available work for the Orchestrator is T-25.** T-19 and T-23 remain open.
> - **Retirement ≠ regression risk to re-check:** the removal tickets own the cleanup. Do not
>   attempt to re-add or preserve résumé behaviour, and do not treat a missing résumé as a bug.
> - **Never re-add a résumé surface without a new PRD version and a new project decision** (PRD OQ-7).

> ### ⚠ Platform correction (PRD v1.6, 2026-09-27) - Cloudflare Pages is now Cloudflare Workers
>
> T-19 failed on its first run: classic Pages no longer exists for new projects, and Workers
> Builds auto-installed the SSR adapter because no Wrangler config was committed. The deploy is now
> an **assets-only Worker** at **`https://www.mattoconn.workers.dev`** (PRD DEP-1, DEP-5, DEP-8, OQ-8).
>
> - **T-19 is rewritten in place.** New **T-29** (canonical host) and **T-30** (host-matched noindex)
>   patch what T-4 and T-18 shipped; both precede T-19. No other ticket changes.
> - **Next available work for the Orchestrator is T-29**, then T-30, then T-19.
> - T-19 has **owner-only dashboard steps** (account subdomain rename, Workers Builds connection).
>   The orchestrator pauses for them; it never works around them.
> - **Never install `@astrojs/cloudflare`** or accept `dist/client/` output, whatever a Cloudflare
>   prompt or auto-config suggests (DEP-8).

**Codebase label legend** (used in the checklist's 5th slot):

| Label | Repo area |
|---|---|
| `astro/` | All site source/config: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/` (components, layouts, templates, pages, styles) |
| `content/` | `src/content.config.ts`, `src/content/sections/*.md`, `src/config/sections.ts`, `src/config/templates.ts` |
| `assets/` | Fonts + font pipeline: `src/assets/fonts/`, `src/assets/styles/`, `scripts/subset-fonts.*` |
| `public/` | **Does not exist.** The Astro scaffold's `public/` was deleted at T-7 (no favicon in v1, per tech design §12.5) and nothing recreated it — the résumé PDF ticket was cancelled before it ran. Do not create it. |
| `scripts/` | Build/QA scripts: `scripts/gen-headers.mjs`, `scripts/verify-static.mjs`, `scripts/subset-fonts.mjs` |
| `deploy/` | **[v1.6]** Cloudflare Workers static-assets deploy: `wrangler.jsonc`, the `wrangler` devDependency, Workers Builds settings, account workers.dev subdomain |
| `qa/` | Verification/runtime QA tasks (Lighthouse, a11y, extensibility manual test) |

---

## Epic Description

Build v1 of a static, zero-client-JavaScript, mobile-perfect personal identity hub for professional software engineer **Matthew O'Connell**: two pages (Home scan page, About page), a typed **Section Registry**, a custom 404 — all on **Astro 7.x + TypeScript (strict)** using the **Content Layer API** (`src/content.config.ts`, glob loader + Zod). **No résumé page, no résumé PDF, no ProfilePage structured data** (PRD v1.5 OQ-7): the hero routes to GitHub and LinkedIn as the surfaces that carry depth, and the About page carries the authored judgment signal. The Section Registry is the architectural keystone: navigation, page routes, layout shells, and sitemap all derive from a single typed registry so future sections (Projects, Blog, Now, Uses — capped, REG-7) drop in as "a typed content file (self-registering via frontmatter) plus a per-section template component" with zero changes to nav/layout/sitemap/schema code (verified by T-22 with a stub Now section).

The site ships structured data (Person JSON-LD on Home), build-time `sitemap.xml`, a `robots.txt` that explicitly permits AI-assistant crawlers, self-hosted subset WOFF2 fonts (zero third-party requests), absolute canonical URLs pinned to exactly one host, and a host-matched `_headers` policy that noindexes non-canonical (deployment/preview/version) hosts. Content is edited as markdown, deployed on git push via Workers Builds to an assets-only Cloudflare Worker on the free tier at `www.mattoconn.workers.dev` (PRD v1.6; account subdomain checked at deploy; no custom domain in v1). No backend, no CMS, no auth, no analytics, no islands, no PDF.

**Hard constraints encoded in the tickets:** zero client JS (JSON-LD `<script type="application/ld+json">` blocks are data, not JS, and must be exempt from the zero-JS scanner); no biographical facts invented by developers — all identity copy and links are owner-provided (T-23 is human-blocked); all genuinely open aesthetics (font family, color palette, scoped-CSS-vs-Tailwind) are explicitly deferred to the tech design pass and referenced as "decision per tech design §…"; **and no résumé artifact may survive anywhere in the build** (RES-X1..X4, owned by T-25..T-28).

---

## Part A — The Tasking Checklist (the contract)

- [x] **T-1: Scaffold Astro 7 + TS strict + baseline static build** — `npm create astro@latest`, pin Astro 7.x, TypeScript strict, add `@astrojs/sitemap` + `zod`, verify the empty site builds to static `dist/`. (DEP-3, NF-6 | deps: none | M | astro/)
- [x] **T-2: Sections content schema (glob loader + Zod, closed template enum)** — `src/content.config.ts` defines the `sections` collection; template enum lives in shared `src/config/templates.ts` (pre-includes the four capped future templates; rejects anything else). (REG-1, REG-7 | deps: T-1 | S | content/)
- [x] **T-3: getSections() helper + typed section content skeletons** — `src/config/sections.ts` registration helper (sorted by `order`) and `home`/`resume`/`about` content skeleton files with `HUMAN COPY` placeholders. (REG-2, REG-6 | deps: T-2 | M | content/)
- [x] **T-4: Site URL config (PUBLIC_SITE_URL, default `https://mattoconn.pages.dev`)** — single source of truth driving `astro.config` `site`, canonical URLs, robots `Sitemap:`, and JSON-LD; **default host changed to `www.mattoconn.workers.dev` by T-29 (PRD v1.6)**. (SEO-11, DEP-5 | deps: T-1 | S | astro/)
- [x] **T-5: Nav component driven entirely by the sections registry** — `src/components/Nav.astro` iterates `getSections()`, zero hardcoded links. (US-10 | deps: T-3 | S | astro/)
- [x] **T-6: BaseLayout with semantic landmarks + head slot** — `src/layouts/BaseLayout.astro`: `<header>/<main>/<nav>/<footer>`, registry-driven nav, slots for per-page head and body. (REG-4, SEO-9 | deps: T-5 | M | astro/)
- [x] **T-8: Home scan-page template** — hero (name/role/domain/stack above the fold), condensed proof line, prominent GitHub/LinkedIn/About links (the Résumé chip was removed by T-26), no animations, mobile-first CSS. [NOTE: authored before the T-7 route; templates are unrouted components until T-7 renders them] (US-1, US-2, US-4 | deps: T-3, T-6 | M | astro/)
- [x] **T-9: ~~Résumé landing template~~ — RETIRED (PRD v1.5, OQ-7)** — built and shipped in an earlier commit, then **deleted from the codebase by T-25**. Do not re-implement; the audit record is in `qa/qa-report-T-9.md` and git history. (US-5 | deps: T-3, T-6 | S | astro/)
- [x] **T-10: About template** — renders the registry content body (first-person markdown copy), mobile-responsive typography. (US-8 | deps: T-3, T-6 | S | astro/)
- [x] **T-7: Registry-driven section route with template dispatch** — `src/pages/[...slug].astro` generates one route per registered section via `getStaticPaths()` and dispatches to the now-existing template components via `import.meta.glob`. (REG-6 | deps: T-6, T-8, T-9, T-10 | M | astro/)
- [x] **T-11: Custom 404 page** — styled not-found page with `noindex`, home link, keyboard-accessible, mobile-perfect. (NF-2, NF-3 | deps: T-6 | S | astro/)
- [x] **T-12: SEO head component (title/description/OG/canonical)** — every page gets a unique descriptive title, unique ≤160-char meta description, OG tags, and an absolute self-referencing canonical. (SEO-6, SEO-7, SEO-8, SEO-11 | deps: T-4, T-6, T-7, T-11 | M | astro/)
- [x] **T-13: Person JSON-LD on Home** — inline `application/ld+json` data block **in the Home template body** (not head; design §8.3 decision), facts from shared `src/config/person.ts` with placeholders until T-23. (HOME-6, SEO-1 | deps: T-8, T-4 | S | astro/)
- [x] **T-14: ~~ProfilePage JSON-LD on Résumé~~ — RETIRED (PRD v1.5, OQ-7)** — built and shipped in an earlier commit, then **deleted from the codebase by T-26**. `ProfilePage` structured data no longer exists; `Person` (T-13) is the site's only JSON-LD node. Do not re-implement. (SEO-2 | deps: T-9, T-13, T-4 | S | astro/)
- [x] **T-15: Sitemap generation via @astrojs/sitemap** — build-time `sitemap.xml` covering exactly the registered section URLs (no 404). (US-11 | deps: T-4, T-7, T-8, T-9, T-10 | S | astro/)
- [x] **T-16: robots.txt endpoint (allow-all + AI crawlers + Sitemap line)** — prerendered `robots.txt`, global allow plus named Allow blocks for OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, and a `Sitemap:` line. (SEO-4 | deps: T-4 | S | astro/)
- [x] **T-17: Self-hosted subset WOFF2 fonts** — vendor an OFL font family (IBM Plex Sans, per tech design §7), subset to used glyphs (needs built pages from T-8–T-11), `@font-face` with `font-display: swap`, zero font-CDN references. (SEO-5, NF-4 | deps: T-6, T-8, T-9, T-10, T-11 | M | assets/)
- [x] **T-18: Build-time `_headers` generation** — `scripts/gen-headers.mjs` writes `dist/_headers`; **its `/resume.pdf` cache rule was removed from scope by PRD v1.5 and is stripped by T-27**, leaving the preview `noindex` rule as the script's only job; **its `CF_PAGES_BRANCH` detection is replaced by T-30's host-matched rule (PRD v1.6)**. (SEO-12 | deps: T-4, T-7, T-8, T-9, T-10, T-11 | M | scripts/)
- [x] **T-20: Static-output verification script (zero-JS + zero third-party)** — `scripts/verify-static.mjs` scans `dist/` for functional JS and external requests while exempting JSON-LD data blocks; ships ready for the CI gate (the Cloudflare build-command retrofit is owned by T-19, which needs a live project). (NF-4, NF-5, DEP-3 | deps: T-7, T-8, T-10, T-11, T-15, T-16, T-17, T-18 | M | scripts/)
- [x] **T-25: Delete résumé section from the registry (content file, template, enum value)** — remove `src/content/sections/resume.md`, delete `src/templates/ResumeSection.astro`, drop `'resume'` from `TEMPLATES`, and re-point `about.md` to `order: 2`; nav, routes, and sitemap follow automatically. (RES-X1 | deps: T-3, T-2, T-7 | M | content/)
- [x] **T-26: Remove résumé link + ProfilePage JSON-LD wiring from Home and shared modules** — drop the résumé entry from the Home link row, delete `JsonLdProfilePage.astro`, rebase the `.btn-download` token to `.btn-primary` on the 404, and scrub vestigial résumé comments; guard that Person JSON-LD survives. (RES-X1, RES-X4, HOME-3 | deps: T-25, T-8, T-13 | S | astro/)
- [x] **T-27: Strip PDF cache rule + résumé asserts from build and verification scripts** — `gen-headers.mjs` writes only the preview noindex rule (and nothing on production), `verify-static.mjs` gains negative résumé asserts, `subset-fonts.mjs` drops the deleted page from its sweep. (RES-X1, RES-X3 | deps: T-25, T-18, T-20 | M | scripts/)
- [x] **T-28: Post-removal regression + accessibility/mobile re-verification** — rebuild, re-run the zero-JS gate, assert the registry returns exactly `home` + `about` with no dead résumé route, sitemap/canonical/robots consistency, and redo the a11y + 375/390/430px sweep on the two-route site. (RES-X2, NF-1..NF-3 | deps: T-25, T-26, T-27, T-12, T-17 | M | qa/)
- [ ] **T-29: Canonical host → `https://www.mattoconn.workers.dev`** — change the one host literal (`astro.config.mjs` default) plus its docs in `.env.example` and `README.md`; `src/config/site.ts` holds no literal and is not edited. (DEP-5, SEO-11 | deps: T-4 | S | astro/)
- [ ] **T-30: Host-matched `_headers` noindex (replaces `CF_PAGES_BRANCH` detection)** — new `scripts/noindex-rule.mjs`; `gen-headers.mjs` writes the rule for every non-canonical workers.dev host on every build; `verify-static.mjs` rule 4e asserts it and that no rule can match the canonical host. (SEO-12, RES-X3 | deps: T-18, T-27, T-29 | M | scripts/)
- [ ] **T-19: Cloudflare Workers static-assets deployment (git-push CI/CD)** — commit an assets-only `wrangler.jsonc` + `wrangler` devDep, rename the account subdomain to `mattoconn`, first `wrangler deploy` of Worker `www`, connect Workers Builds, and smoke-test `www.mattoconn.workers.dev` (incl. noindex on non-canonical hosts only). (DEP-1, DEP-8, US-12, US-13, US-14 | deps: T-18, T-28, T-29, T-30 | M | deploy/)
- [x] **T-21: Lighthouse + accessibility + mobile QA pass** — mobile-preset Lighthouse (load <2s over throttled network), WCAG AA/a11y audit, 375–430px manual sweep on all pages. (US-3 | deps: T-8, T-9, T-10, T-11, T-12, T-17 | M | qa/)
- [x] **T-22: Extensibility manual verification (stub "Now" section)** — register a stub section and prove it appears in nav + sitemap with zero nav/layout/sitemap code changes, then revert. (US-9 | deps: T-3, T-5, T-7, T-15 | S | qa/)
- [x] **T-24: ~~Owner PDF commit + verification~~ — CANCELLED (PRD v1.5, OQ-7)** — never executed; no PDF was ever committed, so there is no file to verify and the cache-header obligation (`DEP-7`) it carried is stripped by T-27 instead. Retained as a tombstone so the T-ID is never reused. (RES-2 | deps: none | S | content/)
- [x] **T-23: Author final Home/About copy + identity facts (owner-provided, HUMAN-BLOCKED)** — replace all placeholders with the owner's supplied copy: hero, proof line, GitHub/LinkedIn URLs, About paragraphs, JSON-LD facts. (US-1, US-8, US-13, US-15 | deps: T-8, T-10, T-13 | M | content/)

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
- **Execution deviations (T-1, commit `8228acd`):** (1) `engines.node` is `>=22.12.0` (Astro 7.3.3's declared floor) rather than the tech design §10.2 example `>=20` — truthful to the framework and consonant with design §2's "22 LTS recommended". **[Resolved v1.5: the design example has been aligned to `>=22.12.0`, so the watch item from `qa/qa-report-T-1.md` is closed on the design side. T-19 must still set `NODE_VERSION=22` on the Cloudflare Pages project.]** (2) `AGENTS.md` + `CLAUDE.md` (symlink) are committed as scaffold-adjacent agent tooling describing the repo's `astro dev --background` convention; they are unowned by any ticket (design §12.5) and flagged for the later unowned-files audit. Both reviewed as acceptable by reviewer + QA.

#### T-2: Sections content schema (glob loader + Zod, closed template enum)

- **Acceptance Criteria:**
  - `src/content.config.ts` defines a `sections` collection using the Content Layer API: `defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/sections' }), schema: … })`. (REG-1)
  - **Template enum lives in `src/config/templates.ts`** — `export const TEMPLATES = ['home','resume','about','projects','blog','now','uses'] as const` + `type Template` + `templateToComponentName()` (PascalCase + `Section` suffix). This is the single sanctioned extension point. **[DESIGN DEVIATION, supersedes v1.2 ticket wording]:** per tech design §4.2, the enum pre-includes the four capped future templates and **excludes `error`** (the 404 is a fixed page, not a registry section — see T-11/tech design §5.3); a content file with `template: 'error'` or any non-enum value fails the build (REG-7 closure). The prior `z.enum(['home','resume','about','error'])` literal is replaced by `z.enum(TEMPLATES)`.
  - Zod schema fields (per the normative registry design): `slug: z.string().regex(/^[a-z0-9-]+$/)`, `title: z.string().min(1)`, `navLabel: z.string().min(1)`, `order: z.number().int().positive()`, `template: z.enum(TEMPLATES)`, `description: z.string().min(1).max(160)`, optional home fields `github?: z.string().url()` and `linkedin?: z.string().url()`. (REG-1, REG-7)
  - **Closed enum (REG-7):** any content file whose `template` is not in the enum fails build/`astro check` with a schema error — verified by a temporary negative test (`template: 'bogus'`), then reverted. (REG-7)
  - **[SCOPE NOTE (PRD v1.5): `'resume'` is removed from `TEMPLATES` by T-25**, leaving `['home','about','projects','blog','now','uses']` — two shipped templates plus REG-7's four capped future templates. The enum stays closed and `now` stays pre-included, so T-22's two-file extensibility proof and the T-28 re-proof are unaffected. Do not treat the missing `resume` value as a gap to refill.
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
- **[SCOPE NOTE (PRD v1.5, OQ-7):]** this ticket originally created **three** skeletons (`home`, `resume`, `about`) and asserted `getSections()` returns 3 entries. **T-25** deletes `resume.md` and re-points `about.md` to `order: 2`, so the shipped registry returns exactly **2** entries (`home` → `/`, `about` → `/about/`). No edit to `src/config/sections.ts` is needed or wanted — it is registry-derived by design. Re-verified in T-28.

#### T-4: Site URL config (PUBLIC_SITE_URL, default `https://mattoconn.pages.dev`)

> **[v1.6] Patched by T-29.** The default host is now `https://www.mattoconn.workers.dev` (PRD
> DEP-5, OQ-8). The criteria below are the audit record of what T-4 shipped; the `CF_PAGES_BRANCH`
> documentation it required is removed by T-30. The critical constraint generalises: no
> Cloudflare-injected host or branch variable (`CF_PAGES_*`, `WORKERS_CI_*`) is ever the site URL.

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
- **Verification command(s):** `npm run build` (scaffold builds green) `&& rg 'getSections\(' src/components/Nav.astro && ! rg 'href="/resume/"|href="/about/"|href="/resume"|href="/about"' src/components/Nav.astro` (zero hardcoded links; note the `!` — a match here is a failure). Rendered-output checks (`href="/resume"` present in built HTML) run at T-7, when routes that render nav actually exist. [FIXED per plan review — the original `rg` over `dist/index.html` was un-runnable at T-5 rank]
- **Notes:** REG-3/US-10. T-22 proves the reverse direction (adding a section adds a nav link without touching this file).
- **Execution deviations (T-5):** (1) `href`s use `sectionPath(entry)` from `src/config/sections.ts` (tech design §4.4 is normative and supersedes the literal `href="/{entry.data.slug}"` wording) — home → `/`, others → `/{slug}/`, preserving R8 trailing-slash byte-consistency with canonical/sitemap URLs. (2) Desktop alignment resolved at this rank per UI spec §4.1 `[UI adds]`: `<ul>` gets `justify-content: space-between` inside the ≥768px media query (brand/home left, remaining items right) — closed here to avoid a T-5→T-6 ownership gap. (3) Non-active nav links use `--color-text` + persistent thin underline rather than the UI §5.1 generic accent default, so the active state (accent + 2px accent `border-bottom` + `aria-current`) stays distinguishable — resolves the UI §4.1/§5.1 latent contradiction; reviewer + QA sanctioned; re-verify contrast at T-21. **Watcher for T-7:** the active-state equality `Astro.url.pathname === sectionPath(entry)` presumes `trailingSlash: 'always'` (lands with T-7's routes) — the T-7 verifier should assert the canonical `/resume/` (trailing-slash) form.

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
- **Execution deviations (T-6):** (1) The layout deliberately declares **no `path` prop** — tech design §5.1/§5.3 snippets show `<BaseLayout path={...}>`, but Nav.astro (T-5) already reads `Astro.url.pathname` for active state, so the prop is vestigial; T-7/T-11 should not pass it. (2) The `<nav>` landmark is emitted by Nav.astro inside the layout's `<header>`, not as a literal in the layout file — the T-6 verifier's `rg '<nav'` matches the layout's doc comments only; the rendered landmark is asserted in every built page at T-7/T-21 (per the plan-review note already on this ticket). (3) `global.css` adds two un-sanctioned-but-harmless rules, both reviewer/QA-sanctioned: `text-size-adjust: 100%` (iOS font-boosting guard) and a global heading baseline (600 weight, margin 0, `--lh-h2` leading) that templates override per-token — watcher: T-8's home `h1` must set `--lh-hero: 1.05`. (4) QA watcher for T-7: scaffold `index.astro`'s favicon links (`/favicon.svg`, `/favicon.ico`) are scaffold leftovers — tech design §12.5 ships **no favicon** in v1, so T-7 replacing that page may drop them without regression.

#### T-7: Registry-driven section route with template dispatch

- **Acceptance Criteria:**
  - `src/pages/[...slug].astro` (optional catch-all): `getStaticPaths()` returns one path per `getSections()` entry — `home` maps to `/` (`{ params: { slug: undefined } }`), others map to `/{slug}`. (REG-4, REG-6)
  - Template dispatch is glob-driven: `const templates = import.meta.glob('../templates/*.astro', { eager: true })` keyed by filename; the component for entry with `template: 'home'` resolves as `../templates/HomeSection.astro` (PascalCase + `Section` suffix). **[FIXED per plan review]:** a registered section whose template component is missing = **build failure** (loud, typed — a registry pointing at nothing is a programming error, per tech design §5.1); unknown URLs are served by Astro's built-in static `404.html` — there is no "error template fallback" (the enum has no `error` value, per tech design §4.2/§5.3). (REG-6)
  - A new section therefore needs **no changes to this route file** — the glob picks up new template components automatically. (REG-6, US-9)
  - Every generated route passes `section` data through to the template component, typed via the collection's inferred type. (REG-1)
- **Affected paths:** `src/pages/[...slug].astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `typescript`, `vite` (import.meta.glob)
- **Verification command(s):** `npm run build && ls dist/ dist/resume/ dist/about/ && rg -o 'href="/resume/"|href="/about/"' dist/index.html` (nav renders the three sections — the dist-level nav assertion deferred from T-5); via `npm run preview`, an unknown URL returns the 404 page.
- **Notes:** REG-4/REG-6 core machinery. Runs **after** the template components (T-8/T-9/T-10) precisely so the missing-template build-failure semantics (§5.1) are meaningful — the route is the consumer that renders them. Routing shape (optional catch-all with home→root) is normative for the design pass; if the design instead prefers fixed `index.astro` for home, the registry slug→path mapping must stay centralized in `getSections()`/a `sectionPath()` helper. The 404 is a fixed page (T-11); there is no error-template dispatch per tech design §5.3.
- **Execution deviations (T-7):** (1) `trailingSlash: 'always'` lands here in `astro.config.mjs` — the T-5 watcher's canonical `/resume/` form is only consequential once section routes exist. (2) Scaffold `src/pages/index.astro` is **deleted** (it would conflict with the catch-all's home route; its entry point + favicon references are superseded). (3) Scaffold `public/favicon.ico`/`favicon.svg` are **deleted** per tech design §12.5 (no favicon in v1) — the T-6 watcher note. (4) No `path` prop to BaseLayout (per the T-6 deviation note — Nav reads `Astro.url.pathname`); `sectionPath`/`home` re-imported at T-12 when the canonical/title wiring needs them. (5) Head slot empty until T-12's Seo — interim pages carry no `<title>`. All five reviewer + QA sanctioned (see `projects/initial-site/qa/qa-report-T-7.md`).

#### T-8: Home scan-page template

- **Acceptance Criteria:**
  - `src/templates/HomeSection.astro` renders: `<h1>` = owner name, role-in-domain + primary stack visible **above the fold** on a 375px viewport, all real selectable text (no image/CSS-only text). (HOME-1, US-1)
  - Condensed proof line (years of experience / kind of work) below the hero, rendered from the home content body/`description`. (HOME-2)
  - Prominent, hunt-free link row with **GitHub, LinkedIn, and About** targets; GitHub/LinkedIn come from the typed frontmatter (`github`, `linkedin`) — touch targets ≥44px. **[v1.5: the Résumé chip is deleted by T-26.]** (HOME-3, US-2, US-4)
  - Zero animations, zero stock photos, content-first (no decorative imagery, no load-delaying effects). (HOME-4)
  - No horizontal scroll down to 375px; mobile-first CSS. (HOME-5, NF-2)
  - All identity-specific copy remains `HUMAN COPY` placeholders pending T-23; the dev writes markup/layout, not facts. (HOME-1..3, US-1)
- **Affected paths:** `src/templates/HomeSection.astro`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `html`, `css`, `a11y`
- **Verification command(s):** `npm run build` (component typechecks) `&& rg 'GitHub|LinkedIn' src/templates/HomeSection.astro && rg 'href="/about' src/templates/HomeSection.astro`; manual 375px full-render check via `npm run preview` after T-7 (formal QA in T-21). Rendered-output assertions (`GitHub`/`LinkedIn` in `dist/index.html`) run at T-7. [FIXED per plan review — authored before the route, so `dist/` has no pages rendering the hero until T-7] **[v1.5: the `href="/resume` half of the pattern match is deleted; T-26 removes that chip and T-28 re-runs the rendered assertion unscoped.]**
- **Notes:** HOME-1..5, US-1/US-2/US-4. Name, role, domain, stack, proof line, and profile URLs are owner facts — placeholders until T-23. JSON-LD for this page is T-13.
- **Execution deviations (T-8):** (1) Section links use `sectionPath()` of the registry entries (Résumé/About) per tech design §6.4/REG-3 — the ticket's verifier's literal `rg 'href="/about'` is unrunnable at source level by design (same precedence as the T-5 `[FIXED per plan review]` gate); rendered `href="/resume/"`/`href="/about/"` assertions were run via a **throwaway scratch page** (removed; tree clean) and will land again at T-7. (2) Link row renders GitHub/LinkedIn **conditionally** on the typed `github`/`linkedin` frontmatter (both optional in the schema) — absent URLs skip the chip rather than emit a dead link; T-23 replaces the placeholders with real profile URLs. (3) Résumé/About chips are absent if their registry entries are unregistered (REG-3 resilience, mirrors Nav.astro). (4) Both GitHub/LinkedIn chips carry the decorative `aria-hidden` SVG icons (UI §3.1 link-row decisions: inline SVG + adjacent text label, zero-JS). (5) Hero vertical rhythm uses `clamp(2rem, 6vh, 4rem)` top / `var(--space-7)` bottom — kept conservative to hold the full identity parse above the fold on a 375px viewport (formal 375/390/430px sweep is T-21).

#### T-9: ~~Résumé landing template~~ — RETIRED (PRD v1.5, OQ-7)

- **Status:** **RETIRED — do not implement, do not re-implement.** Shipped in commit `332c187`, then
  deleted from the codebase by **T-25**. PRD v1.5 removed requirements `RES-1`, `RES-2`, `RES-4`,
  `RES-5` and user story `US-5` (tombstoned in place — IDs permanently retired, never reused).
- **Original ticket (for the audit trail only):** `src/templates/ResumeSection.astro` rendered a page
  title, one line of context from the registry `description`, and a single prominent
  **"Download résumé (PDF)"** anchor linking to `/resume.pdf` (≥44px touch target, no competing CTAs).
- **Audit records:** `projects/initial-site/qa/qa-report-T-9.md`, git history for `332c187`. Those
  reports describe work that has since been removed and are intentionally left unmodified.
- **Superseded by:** `T-25` (deletes `ResumeSection.astro`) and `T-27` (removes the PDF cache rule).

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
  - `src/components/Seo.astro` composes into `BaseLayout`'s head slot and renders, per page: `<title>` (pattern per tech design §5.2: home → `home.title`; other sections → `{home.title} — {entry.data.title}`, e.g. `Matthew O'Connell — About` — mechanical off the registry, owner's name spelling is T-23 copy), unique `meta name="description"` ≤160 chars, Open Graph `og:title`/`og:description`/`og:type` (type `website`), and a **self-referencing absolute canonical** `<link rel="canonical" href="{absoluteUrl(path)}">` computed from `SITE_URL`. (SEO-6, SEO-7, SEO-8, SEO-11)
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

#### T-14: ~~ProfilePage JSON-LD on Résumé~~ — RETIRED (PRD v1.5, OQ-7)

- **Status:** **RETIRED — do not implement, do not re-implement.** Shipped in commit `e442fad`, then
  deleted from the codebase by **T-26**. PRD v1.5 removed requirement `SEO-2`: the résumé page was the
  site's only `ProfilePage` carrier, so **`Person` (T-13) is now the only JSON-LD node**. The loss of
  `ProfilePage` structured data is an accepted consequence of the removal (PRD OQ-3/OQ-7).
- **Original ticket (for the audit trail only):** the Résumé template body included a
  `<script type="application/ld+json" is:inline>` block with `@type: ProfilePage`, `name`, `url`, and a
  `mainEntity` reference to the Person node, all facts drawn from the shared `src/config/person.ts`.
- **Audit records:** `projects/initial-site/qa/qa-report-T-14.md`, git history for `e442fad`. Left
  unmodified by design — they are evidence of a past run, not a spec.
- **Superseded by:** `T-26` (deletes `src/components/JsonLdProfilePage.astro`). `T-13`'s `Person` block
  is unaffected and is regression-guarded by `RES-X4` in `T-26` and re-verified in `T-28`.

#### T-15: Sitemap generation via @astrojs/sitemap

- **Acceptance Criteria:**
  - `@astrojs/sitemap` enabled in `astro.config.mjs` with `site: SITE_URL`, producing build-time `sitemap-index.xml` + `sitemap-0.xml`. (SEO-3, HOME-7)
  - Sitemap contains **exactly** the three registered-section URLs (`/`, `/resume/`, `/about/` — trailing slash per `trailingSlash: 'always'`, tech design §5.4) — hence derived from the registry routes (T-7) with no manual URL list. (REG-5, US-11, HOME-7) **[SCOPE NOTE (PRD v1.5): the registry is trimmed to two sections by T-25, so the shipped sitemap contains exactly `/` and `/about/`. No manual URL edit is needed — the integration crawls generated routes. Verified by T-28.]**
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
  - Font files are subset to the glyphs the site actually uses (via the `subset-font` npm tool — the one that actually shipped, see the T-17 amendment below) and emitted as WOFF2 into `src/assets/fonts/` (imported so Astro fingerprints them into `dist/`). (SEO-5, NF-4)
  - Global CSS declares `@font-face` with `font-display: swap` (content-first rendering). (SEO-5, NF-1)
  - **Zero** references to any font CDN (`fonts.googleapis.com`, `fonts.gstatic.com`, etc.) in source or `dist/`. (SEO-5, NF-4)
- **Affected paths:** `src/assets/fonts/*.woff2`, `src/assets/styles/global.css` (font-face rules), `scripts/subset-fonts.*` (optional, if not one-shot)
- **Affected codebase:** `assets/`
- **Suggested skills:** `css`, `font-subsetting` (`subset-font`), `npm`
- **Verification command(s):** `npm run build && (rg -i 'googleapis|gstatic|fonts\.google' dist/ || echo 'NO external fonts')`; `rg '@font-face' dist/_astro/*.css`
- **Notes:** SEO-5, NF-4. Research fact: 2026 font delivery best practice is self-hosted subset WOFF2 — no third-party font CDN, no external requests on load. Keep total shipped font weight tiny (single family, 1–2 weights + latin subset) to protect the NF-1 <2s budget. **Amendment (T-17, applied):** the preferred Node tool was `glyphhanger`, but it shells out to Python `fonttools`+`brotli` which are not installed here, so the ticket's sanctioned alternative `subset-font` (pure Node/WASM) shipped. Tech design §7 has been corrected to match.

#### T-18: Build-time `_headers` generation

> **[v1.6] Patched by T-30.** `CF_PAGES_BRANCH` does not exist on Cloudflare Workers, so the
> detection below would treat every build as production and noindex nothing. T-30 replaces it with
> a host-matched rule written on every build (design §10.1). The "mechanism note" below, that
> `_headers` cannot match by host, is wrong for Workers static assets, which support absolute-URL
> rules. The criteria below remain the audit record of what T-18 shipped.

- **Acceptance Criteria:**
  - `scripts/gen-headers.mjs` runs as part of the build (`node scripts/gen-headers.mjs` after `astro build`) and writes `dist/_headers`. (DEP-7 → **tombstoned**, see below)
  - **Preview-`noindex` rule (the surviving obligation):** when the build is **not** for the canonical host — detected via `CF_PAGES_BRANCH` (e.g. preview or PR branches) — a global `/*` `X-Robots-Tag: noindex` is emitted. Production builds of the canonical host emit **no** noindex rule. (SEO-12)
  - **~~PDF cache rule (CANCELLED — PRD v1.5, OQ-7)~~:** the original AC-2 also required a `/resume.pdf` → `Cache-Control: public, max-age=60, must-revalidate` rule (`DEP-7`, `RES-5`, `US-7`). **All three IDs are tombstoned and this obligation is void** — there is no PDF, so there is nothing to cache. `T-27` deletes `resumeRule` and makes the preview noindex rule the script's only output. (SEO-12)
  - Mechanism note (decided default): Cloudflare `_headers` cannot match by host, so the noindex-for-non-canonical-hosts behavior is achieved by branch-triggered generation; the tech design §Headers & Deploy confirms the final detection method (env-var based). (SEO-12)
  - ~~`Cache-Control` value byte-exact per DEP-7; stable path `/resume.pdf` unchanged.~~ **CANCELLED with `DEP-7`.** The surviving byte-exact obligation is the `CF_PAGES_BRANCH`-vs-`main` branch comparison, which `T-27` must not refactor. (SEO-12)
- **Affected paths:** `scripts/gen-headers.mjs`, build command in `package.json` (`build: "astro build && node scripts/gen-headers.mjs"`), `dist/_headers` (generated)
- **Affected codebase:** `scripts/`
- **Suggested skills:** `node`, `ci/cd-cloudflare`, `http-caching`
- **Verification command(s) (v1.5):** `CF_PAGES_BRANCH=preview-x npm run build && cat dist/_headers` shows the noindex rule; production: `npm run build && (test ! -e dist/_headers && echo 'OK: no _headers on production')` — the `rg 'max-age=60'` check is **deleted with the rule it asserted**. (SEO-12)
- **Notes:** **SEO-12 (MUST)** is the live obligation here; `DEP-7`/`RES-5`/`US-7` are tombstoned. Research finding: Cloudflare serves the same build on multiple hosts (`<hash>.mattoconn.pages.dev`, preview URLs) — the "duplicate site outranks real site" failure mode is prevented by `noindex` **headers**, not `robots.txt` Disallow (pages must stay crawlable to be deindexed by the noindex signal). Never set `PUBLIC_SITE_URL` to a preview host (T-4 constraint).

#### T-19: Cloudflare Workers static-assets deployment (git-push CI/CD)

> **[v1.6] Rewritten.** The original T-19 targeted classic Cloudflare Pages, which no longer exists
> for new projects (PRD §5.6, OQ-8). Its first execution failed: with no committed Wrangler config,
> Workers Builds' `wrangler deploy` auto-ran `astro add cloudflare`, installed the SSR adapter, and
> moved output to `dist/client/`. **Do not "fix" `verify-static.mjs` to accept `dist/client/`; that
> path is the symptom.** The stale `personal-website` Worker was deleted by the planner on
> 2026-09-27. The normative procedure, including exact commands and dashboard values, is tech
> design **§10.3**; this ticket is its acceptance contract.

- **Actors:** steps marked **[Owner]** need the Cloudflare dashboard and cannot be done by an agent.
  The orchestrator must pause and ask the owner at each one, then verify the result itself.
- **Acceptance Criteria:**
  - **Precondition, Wrangler auth:** `npx wrangler whoami` must show the owner's account
    ("Mattgoconn@gmail.com's Account"); the planner confirmed an OAuth login exists on this machine
    on 2026-09-27. If it reports not authenticated, **[Owner]** runs `npx wrangler login`. Never
    create, request, or commit an API token; `CLOUDFLARE_API_TOKEN` is not used. (DEP-1)
  - **Precondition:** `npx wrangler deployments list --name personal-website` fails with "not found".
    If it lists deployments, stop and escalate; something recreated the stale Worker. (DEP-8)
  - **[Owner]** Account workers.dev subdomain renamed `mattgoconn` → **`mattoconn`**;
    `dig +short probe.mattoconn.workers.dev` returns an address. **If `mattoconn` is unavailable,
    stop and escalate to the planner**; never continue on `mattgoconn` or pick another name. (DEP-5)
  - `wrangler` installed with `npm install --save-dev wrangler@^4.142.0` (Worker Previews need
    ≥ 4.135.0). `package.json` scripts are **unchanged**. (DEP-8)
  - `wrangler.jsonc` committed at the repo root, **byte-for-byte the design §10.3 block**: `name: "www"`,
    `workers_dev: true`, `preview_urls: true`, `assets.directory: "./dist"`,
    `assets.not_found_handling: "404-page"`, `assets.html_handling: "auto-trailing-slash"`, and
    **no `main` key**. Hand-written; never generated by `wrangler init` or `astro add cloudflare`. (DEP-8, NF-6)
  - **Static-only invariants (local, all must pass):** `npm run build` exits 0 (it already runs
    `verify-static.mjs`); `test ! -e dist/client && test ! -e dist/_worker.js`;
    `npm ls @astrojs/cloudflare` shows it absent; `rg -n '"main"' wrangler.jsonc` finds nothing;
    `npx wrangler deploy --dry-run` exits 0. (DEP-3, DEP-8, NF-5, NF-6)
  - **Local runtime (`npx wrangler dev --port 8787`):** `/nope/` returns `404` with the custom 404
    page body (T-11); `/about` redirects to `/about/`. (DEP-8, NF-2)
  - First deploy `npm run build && npx wrangler deploy` creates Worker `www`, uploads assets only
    (no script bundle), and reports `https://www.mattoconn.workers.dev`. (DEP-1, DEP-5)
  - **[Owner]** Worker `www` → Settings → Builds connected to this repo: production branch `main`;
    build command `npm run build`; deploy command `npx wrangler deploy`; non-production branch builds
    **on** with preview command `npx wrangler preview`; root directory `/`; **no build variables**
    (in particular **no** `PUBLIC_SITE_URL`: the committed default is the canonical host, R10).
    Node comes from `.node-version`; add `NODE_VERSION=24.21.0` only if the build log shows Node
    < 22.12, and record that in the completion notes. (DEP-1, DEP-2)
  - Pushing the T-19 commit to `main` produces a green Workers Build in < 5 minutes whose log
    shows `verify: OK`, and `npx wrangler deployments list --name www` shows the new deployment.
    (DEP-2, DEP-6, US-12, US-13)
  - **Live smoke checks** (`H=https://www.mattoconn.workers.dev`, design §10.3 step 6):
    `/` and `/about/` → 200; `/about` → redirect to `/about/`; `/nope/`, `/resume/`, `/resume.pdf`
    → 404 with the custom page; `robots.txt` `Sitemap:` line and the home canonical both use `$H`.
    (US-14, SEO-11, RES-X2)
  - **Canonical host is never noindexed (blocker):** `curl -sI $H/ | grep -i '^x-robots-tag'`
    prints nothing. If it prints anything: `npx wrangler rollback` immediately, then escalate. (SEO-12)
  - **Non-canonical hosts are noindexed:** the Version URL printed by `npx wrangler versions upload`
    (`https://<prefix>-www.mattoconn.workers.dev`) and the Preview URL of a throwaway pushed branch
    both return `x-robots-tag: noindex`. Delete the throwaway branch afterwards. (SEO-12)
  - Zero cost, no custom domain: the Worker has no Routes or Custom Domains. (DEP-1, US-14)
  - `README.md`: **every** "Cloudflare Pages" occurrence becomes Cloudflare Workers (static assets),
    including the Overview intro sentence ("…deployed to Cloudflare Pages.");
    `rg -n 'Cloudflare Pages' README.md` finds nothing. A new Deploy section documents `wrangler.jsonc`, that `@astrojs/cloudflare` must never be added, the Workers Builds
    settings above, and `npx wrangler rollback`. (DEP-6)
  - **CI gate:** no retrofit step. `npm run build` already chains `verify-static.mjs` (shipped in
    `40a9c78`), so the Workers Builds build command stays plain `npm run build`. Do **not** append
    `&& npm run verify`. (DEP-3, NF-4, NF-5)
  - **Placeholder-copy disclosure:** T-23 has since landed, so real copy ships. The completion notes
    must still say which T-23 commit is live and must not call this "v1 launched" until the owner
    confirms the live copy (MS-9). (US-1, US-8, US-15)
- **Affected paths:** `wrangler.jsonc` (new), `package.json` + `package-lock.json` (`wrangler`
  devDep), `README.md` (deploy section); Cloudflare account subdomain and Worker `www` Builds
  settings (dashboard, owner)
- **Affected codebase:** `deploy/`
- **Suggested skills:** `ci/cd-cloudflare` (Workers static assets, Workers Builds, Wrangler), `devops`, `git`
- **Verification command(s):** the local invariants above; then
  `curl -sI https://www.mattoconn.workers.dev/ | head -1` (200) and
  `curl -sI https://www.mattoconn.workers.dev/ | grep -ci '^x-robots-tag'` (`0`).
- **Notes:** DEP-1/2/5/6/8, US-12/13/14. Depends on **T-29** (the build must already emit the new
  host, or the first deploy ships `pages.dev` canonicals) and **T-30** (the first deploy's own
  Version URLs must already be noindexed). QA carry-forward **N-1** from `qa/qa-report-T-27.md`
  ("confirm the production branch is literally `main`") is closed by T-30, which deletes the
  `PROD_BRANCH` constant; nothing in the repo depends on the branch name any more.

#### T-20: Static-output verification script (zero-JS + zero third-party)

- **Acceptance Criteria:**
  - `scripts/verify-static.mjs` walks `dist/**` and fails (non-zero exit) if it finds any **functional** client JS: `<script src=…>`, inline `<script>` bodies with executable content, or event-handler attributes (`onclick=`, `onload=`, etc.). (NF-5, DEP-3)
  - **Exempts** `<script type="application/ld+json">` — these are data blocks, not client-side JavaScript. (NF-5 boundary, SEO-1/SEO-2)
  - Fails if any page references a third-party origin (`http(s)://` host ≠ `SITE_URL`, plus `//`-protocol-relative) in `href`/`src`/`srcset`. (NF-4)
  - Fails if `dist/404.html`, `dist/robots.txt`, or the sitemap files are missing. **[SCOPE NOTE (PRD v1.5): the `/resume.pdf` anchor presence-assert is removed and REPLACED by negative résumé-residue asserts in T-27 — the deleted page must never be demanded by CI again.]** (DEP-3, RES-1)
  - Exposed as `npm run verify`. **[FIXED per plan review]:** the script ships ready for CI. The Cloudflare
    build-command retrofit itself **moved to T-19** (it needs a live project to edit), so T-20 no longer
    depends on T-19 and can legitimately be marked complete. T-27 later amends this script's *rules*
    without changing its interface. (DEP-3, NF-5)
  - Negative test performed during QA: temporarily inject `<script src=evil>` into a page, confirm the script fails, then revert. (NF-5)
- **Affected paths:** `scripts/verify-static.mjs`, `package.json` (`verify` script)
- **Affected codebase:** `scripts/`
- **Suggested skills:** `node`, `regex/parsing`, `typescript`
- **Verification command(s):** `npm run build && npm run verify` (exit 0); negative test: inject a script tag → `npm run verify` must exit non-zero → revert.
- **Notes:** NF-4, NF-5, DEP-3. This is the PRD's zero-JS assertion ticket (QA stage). The JSON-LD exemption is explicit per planning context — the scanner targets functional-JS markers, not data blocks. Astro's static output ships no JS by default; this gate protects against future accidental islands/runtime regressions.

#### T-21: Lighthouse + accessibility + mobile QA pass

- **Acceptance Criteria:**
  - Lighthouse **mobile preset** against `npm run preview` (or the deployed URL post-T-19): full render/load <2s on throttle (3G/4G simulation) — NF-1/US-3; no perf-blocking regressions from fonts (T-17) or CSS. (NF-1, US-3)
  - a11y audit (axe or Lighthouse a11y) passes on all routes: WCAG AA contrast, keyboard-navigable, no landmark/alt issues. **[SCOPE NOTE (PRD v1.5): the site is trimmed to two routes by T-25; T-28 re-runs this sweep on the reduced site.]** (NF-3)
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
  - **[PRD v1.5 — raised importance]** The **LinkedIn URL is now load-bearing**, not decorative: with the résumé removed, LinkedIn is the surface that carries the maintained work history, and the hero's only route to it (US-15). A placeholder or wrong LinkedIn URL leaves the site's depth path broken. Confirm both profile URLs resolve to the owner's real, current profiles. (US-15, US-16)
  - JSON-LD `Person` facts (`jobTitle`, `sameAs`, name spelling) updated from the same owner data (T-13 placeholders). (HOME-6, SEO-1)
  - **Devs must not invent biographical facts** — if the owner has not supplied copy, this ticket stays blocked; do not substitute placeholder text as final. (ABT-1..3)
  - Copy edits flow through the content pipeline: edit markdown → commit → push → live after deploy. (DEP-6, US-13)
- **Affected paths:** `src/content/sections/home.md`, `src/content/sections/about.md`, JSON-LD source module (T-13)
- **Affected codebase:** `content/`
- **Suggested skills:** `markdown`, `copywriting-review` (human), `typescript` (trim wiring)
- **Verification command(s):** `npm run build` after copy lands; manual diff review confirming no placeholder text remains (`rg 'HUMAN COPY' src/content/` → empty); `rg 'GitHub|LinkedIn' dist/index.html` shows the real profile URLs.
- **Notes:** HOME-1..3, ABT-1..3, US-1/US-8/US-13, DEP-6. This ticket is deliberately last-but-one: structure ships with marked placeholders; only the owner can finalize identity facts. Do not block earlier tickets on it.

#### T-24: ~~Commit owner-supplied résumé PDF~~ — CANCELLED (PRD v1.5, OQ-7)

- **Status:** **CANCELLED before execution** — never implemented, no code ever landed, no QA report
  exists. Its T-ID is permanently retired and must never be reused. The `- [ ]` line was removed from
  the Part A checklist so the Orchestrator cannot pick it up as available work.
- **Why:** the owner decided on 2026-09-26 not to publish the résumé on this site. There is no PDF to
  commit, and therefore no `public/resume.pdf` — the scaffold's `public/` directory was already deleted
  at T-7, so the file has no home to live in and none was ever created.
- **Requirements/user stories cancelled:** `RES-2`, `RES-3`, `US-6`, `US-7`, and the ATS
  text-extractability obligation. All tombstoned in the PRD.
- **Consequence absorbed elsewhere:** the `/resume.pdf` cache-header obligation (`DEP-7`) is dropped
  and its implementation is stripped by `T-27` (`RES-X3`); the deploy smoke check that would have
  curled `/resume.pdf` is removed from `T-19`.
- **Never resurrect without** a new PRD version and a new owner decision (PRD OQ-7) — a future résumé
  is a separate project, not a ticket in this file.

#### T-25: Delete résumé section from the registry (content file, template, enum value)

> **First ticket in the removal sequence and the Orchestrator's next available work.** Everything
> downstream (nav, routes, sitemap, canonicals) is registry-derived, so deleting the content file is
> what actually removes the surface — the per-page cleanups are `T-26` (links/JSON-LD/token) and
> `T-27` (scripts).

- **Acceptance Criteria:**
  - `src/content/sections/resume.md` is **deleted** (`git rm`). The glob loader picks up the
    remaining two sections, so the `/resume/` route, its nav entry, and its sitemap URL all disappear
    with no route/nav/sitemap code edits — this is the registry proving itself. (RES-X1)
  - `src/templates/ResumeSection.astro` is **deleted** (`git rm`). A registered section whose template
    is missing is a build failure (T-7/tech design §5.1), so template and content file must be
    removed **in the same commit** — an intermediate state does not build. (RES-X1)
  - `'resume'` is removed from `TEMPLATES` in `src/config/templates.ts`, leaving
    `['home','about','projects','blog','now','uses']` — the two shipped templates plus REG-7's four
    capped future templates. **Do not** add a replacement for the freed enum slot. (RES-X1, REG-7)
  - **The `templateToComponentName` doc comment in the same file is updated** — the JSDoc line
    `/** 'home' → 'HomeSection', 'resume' → 'ResumeSection', ... */` loses its `'resume'` example,
    leaving `/** 'home' → 'HomeSection', 'about' → 'AboutSection', ... */`. **Comment only — the
    function body is untouched.** Without this the file still names a template that no longer exists,
    which is exactly the stale-reference residue this removal exists to eliminate. (RES-X1)
  - `src/content/sections/about.md` frontmatter `order: 3` → `order: 2`, so About directly follows
    Home and nav order stays gap-free. (RES-X1)
  - **Closed-enum negative test:** re-creating a content file with `template: resume` must now **fail**
    the build with a Zod enum error (same procedure as T-2's `template: 'bogus'` test), proving the
    enum removal took effect. Revert the fixture afterwards; `git status` clean. (RES-X1, REG-7)
  - `src/config/sections.ts` needs **no** change — it derives everything from the collection. Confirm
    this explicitly rather than editing it. (REG-2)
- **Affected paths:** `src/content/sections/resume.md` (deleted), `src/templates/ResumeSection.astro` (deleted), `src/config/templates.ts`, `src/content/sections/about.md`
- **Affected codebase:** `content/`
- **Suggested skills:** `astro`, `typescript`, `zod`
- **Verification command(s):** `npm run build && npx astro check` (both clean); `ls dist/` shows **no** `resume/` directory; `rg -c "'resume'" src/config/templates.ts` → no match; `rg -o '<loc>[^<]+' dist/sitemap-0.xml` shows exactly `/` and `/about/`; negative test: add a fixture with `template: resume` → `npm run build` must fail → `git rm` the fixture.
- **Notes:** RES-X1, REG-2, REG-7. This is a **deletion** ticket — do not preserve, stub, redirect, or "temporarily disable" the résumé. There is no `public/` directory to clean up: it was deleted at T-7 and the PDF was never committed, so this ticket has **nothing** to do about PDFs. If the enum feels wrong without `resume`, that is the intended end state per PRD OQ-7 — stop and return to the planner rather than re-adding it.

#### T-26: Remove résumé link + ProfilePage JSON-LD wiring from Home and shared modules

- **Acceptance Criteria:**
  - `src/templates/HomeSection.astro`: the `resumeEntry` lookup and its entry in the `registryLinks`
    array are removed, leaving the link row as **GitHub, LinkedIn, About**. The existing
    conditional-render and `sectionPath()` discipline (T-8 deviations) is preserved — About must still
    resolve through the registry, never a literal path. (HOME-3, RES-X1)
  - `src/components/JsonLdProfilePage.astro` is **deleted** (`git rm`). `ProfilePage` ceases to exist
    as a type on this site; do not migrate it onto another page. (RES-X1)
  - **Person JSON-LD regression guard (RES-X4):** `src/templates/HomeSection.astro` still renders its
    `JsonLdPerson.astro` block, and the built `dist/index.html` still contains a valid
    `application/ld+json` node with `@type: Person` and all three fact groups (`name`, `jobTitle`,
    `sameAs`). Removing the résumé must not cost the site its only structured data. (SEO-1, HOME-6)
  - `src/config/person.ts`: the header comment no longer claims `JsonLdProfilePage` is a second
    caller; the module becomes the single source for the Person node. **Comment only — no logic
    change**, the `getPersonData()` signature and behaviour stay exactly as they are. (SEO-1)
  - Vestigial résumé references are scrubbed from surviving source comments so the next reader is not
    sent looking for a deleted file: `src/components/Seo.astro` (the `'/resume/'` path example →
    `'/about/'`), `src/pages/404.astro` (the "duplicated from ResumeSection" note), and
    **`astro.config.mjs`** (line ~13 `// File endpoints (robots.txt, resume.pdf, sitemap-*.xml) never
    take a slash.` → drop `resume.pdf`; line ~18 `// /, /resume/, /about/.` → `// /, /about/.`).
    Comments only — **no behavioural edit to `astro.config.mjs`**; the sitemap `filter` and
    `trailingSlash` are untouched, and `resume.pdf` needed removing from that comment because no PDF
    exists to be a file endpoint. (RES-X1)
  - **Token rebase:** the CTA class `.btn-download` is renamed `.btn-primary` in `src/pages/404.astro`
    (markup + its scoped style block), since the only surviving user of that token is the 404 "Back to
    home" link and the old name is a résumé artifact. Visual result must be byte-identical apart from
    the class name — the 404 keeps ≥44px touch target, accent background, and visible focus ring.
    (RES-X1, NF-2, NF-3)
- **Affected paths:** `src/templates/HomeSection.astro`, `src/components/JsonLdProfilePage.astro` (deleted), `src/config/person.ts`, `src/components/Seo.astro`, `src/pages/404.astro`, `astro.config.mjs` (comments only)
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `typescript`, `json-ld`, `css`, `a11y`
- **Verification command(s):** `npm run build && npx astro check`; `rg -A4 'application/ld\+json' dist/index.html` shows a valid `Person` node (pipe through `node -e` `JSON.parse`); **`rg -i 'resume' dist/ --glob '!_headers'` returns nothing**; `rg -i 'resume\.pdf' src/` returns nothing; `rg 'btn-download' src/` → no match; `rg 'btn-primary' src/pages/404.astro` → match.
  - **[Plan-review fix] The `--glob '!_headers'` exclusion is required, not cosmetic.** A plain
    `rg -i 'resume' dist/` at this ticket's rank **legitimately matches** `dist/_headers`, because
    `scripts/gen-headers.mjs` still emits the `/resume.pdf` cache rule until **T-27** changes it. Those
    are two different tickets' work: T-26 owns the *page* surface, T-27 owns the *script* surface.
    Excluding `_headers` here keeps each ticket's verifier runnable at its own rank (the
    verifier-at-rank rule in plan.md §2 risk 4). **T-28** then runs the unscoped whole-`dist` scan, by
    which point `T-27` has removed the rule, so the strong assertion still happens exactly once.
  - Do **not** "fix" a failure here by editing `gen-headers.mjs` — that is T-27's change and stealing
    it collapses the ticket boundary. If `dist/_headers` is the only match, the ticket is green.
- **Notes:** RES-X1, RES-X4, HOME-3, SEO-1. The `rg -i 'resume' dist/` assertion is the strongest
  single check in the removal — the build output is generated, so no comment can hide a residue.
  The `.btn-download` → `.btn-primary` rename is deliberately bundled here: it is the last consumer of a
  résumé-named token, and doing it in the same ticket keeps the naming honest rather than leaving a
  permanent mystery. **If `JsonLdPerson` ever needs a second caller in future, the shared-module
  pattern from T-13/T-14 still applies** — only the résumé caller is gone, not the pattern.

#### T-27: Strip PDF cache rule + résumé asserts from build and verification scripts

> **The "invisible" half of the removal.** None of this is visible on the site; all of it is real
> residue. A stale `/resume.pdf` header rule or a presence-assert that demands the deleted page would
> either ship dead configuration or fail CI on a site that is now correct.

- **Acceptance Criteria:**
  - `scripts/gen-headers.mjs`: the `resumeRule` constant and every reference to it are deleted. The
    script's sole remaining job is the preview `noindex` rule. Resulting behaviour:
    - **Production build** (no `CF_PAGES_BRANCH`, or `= main`): **no `dist/_headers` file is written**
      — and if a stale one exists from a previous build, it is removed. Shipping an empty `_headers`
      is residue too. (RES-X3, RES-X1)
    - **Preview/deploy build** (`CF_PAGES_BRANCH` set to anything else): `dist/_headers` contains
      **only** the `/*` + `X-Robots-Tag: noindex` rule. (SEO-12)
    - The `CF_PAGES_BRANCH`-vs-`main` detection logic itself is **unchanged** — it is the part of
      `T-18` that still matters. (SEO-12)
  - `scripts/verify-static.mjs`: the positive assert
    `mustContain('resume/index.html', 'href="/resume.pdf"', …)` is **replaced**, not merely deleted, by
    **negative asserts** that fail the build if résumé residue reappears: (RES-X1, RES-X3)
    - no `dist/resume/` directory;
    - no `resume.pdf` string in any built HTML, CSS, or in `dist/_headers`;
    - no `ProfilePage` `@type` in any JSON-LD block;
    - no `/resume` link in any built page's nav or link row;
    - `dist/_headers`, when present, contains no `/resume.pdf` rule.
  - `scripts/verify-static.mjs` keeps its existing zero-JS / third-party / `404.html` / `robots.txt` /
    sitemap presence asserts untouched — the JSON-LD exemption (T-20) still applies to the surviving
    `Person` block. (NF-4, NF-5, DEP-3)
  - `scripts/subset-fonts.mjs`: `resume/index.html` is dropped from the built-HTML sweep list.
    **[Plan-review correction]** The original rationale here was wrong: the script wraps its page reads
    in `try { … } catch { continue; }`, so a missing input is **silently skipped, not an error**. The
    real hazard is the opposite one and it is why this edit still matters — because the sweep fails
    *silently*, a page that is **added** without being re-listed would be quietly excluded from glyph
    subsetting, producing missing glyphs (tofu) in production with no build failure. Removing the dead
    path keeps the list an accurate description of the pages that exist, so the next person adding a
    page sees a list that must be updated. (SEO-5)
  - Each new negative assert is **proven to work** by planting its violation, confirming
    `npm run verify` exits non-zero, then reverting (the T-20 planted-failure procedure). An assert
    that has never been observed to fail is not a verified assert.
- **Affected paths:** `scripts/gen-headers.mjs`, `scripts/verify-static.mjs`, `scripts/subset-fonts.mjs`
- **Affected codebase:** `scripts/`
- **Suggested skills:** `node`, `regex/parsing`, `http-caching`
- **Verification command(s):** `npm run build && npm run verify` → exit 0; `ls dist/` shows no `_headers`; `CF_PAGES_BRANCH=preview-x npm run build && cat dist/_headers` shows only the noindex rule; planted-failure test per assert; `rg 'resume' scripts/subset-fonts.mjs` → no match.
  - **[Plan-review fix] Do NOT re-run `npm run fonts:subset` as a verification step.** That script
    **overwrites the two committed `src/assets/fonts/*.woff2` binaries**, so running it during
    verification mutates tracked files and produces a spurious diff — verification must be
    read-only. The correct check is textual (`rg 'resume' scripts/subset-fonts.mjs` → no match). If the
    owner genuinely needs a glyph-set refresh, that belongs to **T-23**'s copy-change step, which
    regenerates and commits the fonts deliberately.
- **Notes:** RES-X1, RES-X3, SEO-12, SEO-5, NF-4/NF-5. `package.json` scripts are **unchanged** —
  the script filenames and the `build` / `verify` chain stay exactly as they are, so the T-19/T-20 CI
  wiring needs no edit. The `T-20` note about the T-19 CI retrofit still holds; this ticket changes the
  script's *contents*, not the deploy configuration. If a planted negative assert does not fail,
  **fix the assert** — do not relax it to match current output.
- **Execution deviations (T-27), all reviewer- and QA-sanctioned (QA verdict: Pass with Caveats,
  `qa/qa-report-T-27.md`; code review: Approve on the second attempt):**
  1. **The ticket's AC is stronger than design §10.1 on production `_headers`.** §10.1's snippet only
     *not writes* the file; the AC additionally requires removing a stale `dist/_headers` from an
     earlier build, so `gen-headers.mjs` calls `rmSync(headersPath, { force: true })` on the production
     branch. Ticket followed — strictly stronger, and it satisfies §10.1's stated intent that shipping
     an empty or superseded headers file is itself residue.
  2. **The detection logic is genuinely untouched.** `PROD_BRANCH` / `branch` / `isProduction` are
     byte-identical to T-18's, and the `CF_PAGES_URL is REJECTED as a discriminator` comment is
     retained verbatim. The only import change is `+ rmSync`. Reviewer and QA both verified this
     line-by-line against `47c16f5`. QA's **N-7** (a *directory* at `dist/_headers` would make
     `rmSync` throw `EISDIR`) is unreachable via `npm run build` and is left as a documented nit.
  3. **Design §11.1 rule 4's "No file under `dist/**`" is implemented as a binary skip-list, not an
     extension whitelist.** A first draft whitelisted `html|css|xml|txt|json|webmanifest`; reviewer
     proved that silently skipped `.js`, `.svg` and `.map` while still printing `PASS`. Inverted to
     `BINARY_EXT` (fonts/images/media/archives) so a *new* output format is covered by default rather
     than by remembering to whitelist it. `.svg` is deliberately **not** on the list — it is XML text
     and can carry an `href`. A file that cannot be read is reported as `FAIL`, never skipped, so
     "could not check" cannot read as "clean" (design §11.1 rule 5).
  4. **One assert beyond the ticket's five: `dist/_headers` is compared byte-exactly** against the
     preview noindex rule, on every branch. This is design §10.1-derived and exists to close a drift
     hole — see deviation 5. QA's **N-3** records that this is deliberately strict: a future
     `/_astro/*` immutable cache rule will fail the gate and require a coordinated edit to *both*
     `gen-headers.mjs` and `verify-static.mjs`.
  5. **The `PROD_BRANCH` literal is now duplicated in a second file, and the duplication has a known
     hole.** `verify-static.mjs` re-implements the branch test for its absence assert because the
     ticket forbids restructuring `gen-headers.mjs`'s expression (no shared `isProductionBuild()`
     module was extracted — that is a follow-up, not this ticket). Reviewer and QA both flagged the
     residual risk and **QA's N-1 reproduces it**: if the Cloudflare production branch is ever anything
     but the literal `main`, `gen-headers` misclassifies production as preview and ships
     `X-Robots-Tag: noindex` to the canonical host, while the branch-aware absence check silently skips
     itself and the content check passes (the file it finds *is* the correct rule). The content check
     catches the *wrong-content* drift case but not this byte-correct one. **Carried to T-19 as a
     checklist item: confirm the Cloudflare Pages production branch is literally `main` before the
     first deploy.** Two scripts now hardcode that string.
  6. **`RES-X4`'s fact-group half is deliberately NOT asserted here, and is not orphaned.** Reviewer
     asked rule 4 to also require `name`/`jobTitle` non-empty and `sameAs` non-empty; the Orchestrator
     declined it for this ticket, because the ticket's five asserts and design §11.1:822/§11.3:845
     specify only "exactly one JSON-LD block and it is `Person`", and the reviewer conceded it is a
     PRD-vs-design gap rather than an implementation error. **T-28 already owns it** — its AC asserts
     "`name`/`jobTitle`/`sameAs` present" under `RES-X4` (see T-28's AC list), and the hard `T-19 → T-28`
     edge guarantees it lands before this script becomes a live deploy gate. Do not add it in a later
     removal ticket; T-28 is the place.
  7. **Forward-compat sharp edges recorded by QA, not fixed (all fail closed, none blocking):** QA's
     **N-2** — "exactly one JSON-LD block" blocks a future `WebSite`/`BreadcrumbList` node beside
     `Person` and reports a gain as a loss; `RES-X4` is a *presence* invariant, not an *exclusivity*
     one, so relaxing it to "at least one block, exactly one of them `Person`" would keep every guard
     that matters. **N-4** — an outbound URL whose path ends in `/resume` (e.g. a GitHub résumé repo)
     is blocked, which is design-mandated and consistent with rule 2's outbound-anchor exemption being
     the one thing it lets through. **N-6** — the accented route `/résumé/` is not caught, a fair
     consequence of not punishing the word *résumé* in prose. **N-8** — the new `subset-fonts.mjs`
     sweep/skip logs fire on the *remove*-without-relisting direction only; the *add*-without-relisting
     direction the comment names is still silent by design, so the `swept N` line needs a human to diff
     it against `ls dist/`. All four are one-line fixes at the moment they bite.
  8. **`mkdirSync(resolve('dist'))` stays above the branch**, matching design §10.1:739 exactly.
     Reviewer's N-5 would move it into the preview branch (production writes nothing, so creating the
     directory is a pointless side effect); declined — the design snippet has the identical placement
     and the only effect is materialising a gitignored empty `dist/` that nothing reads.
  9. **T-20's aggregate `PASS` lines are now baseline-gated.** They previously printed
     unconditionally, so a failing build still emitted two reassuring PASS lines. Each rule's PASS now
     prints only if that rule added no failure. **No assert's behaviour changed** — QA verified rules 1
     and 2 are byte-identical to `47c16f5` and rule 3's only diff is the two deleted résumé asserts.
  10. **Scope note on the `resume` string in `scripts/`.** The ticket's check is `rg 'resume'
      scripts/subset-fonts.mjs` → no match, and that holds. `verify-static.mjs` **does** contain the
      literal, at exactly one line: `const RETIRED = 'resume'`. This is required — design §11.1:821
      mandates the gate match the strings `/resume.pdf` and `"@type":"ProfilePage"`, which is
      impossible without naming them. (A first draft obfuscated the constant as
      `['res','ume'].join('')` to satisfy an over-broad check the Orchestrator had wrongly specified; it
      was reverted pre-review. Do not re-apply that pattern — a CI gate whose target string is split to
      hide it is unreadable to the next maintainer.) `gen-headers.mjs` and `subset-fonts.mjs` contain
      **zero** occurrences, so `rg -in 'resume' scripts/` reports exactly that one line, repo-wide.

#### T-28: Post-removal regression + accessibility/mobile re-verification

> **The removal's safety net.** T-21's QA pass covered a four-page site; this re-runs the parts of it
> that a deletion can silently break, against the trimmed two-page site.

- **Acceptance Criteria:**
  - `npm run build && npx astro check && npm run verify` all pass clean on the trimmed site. (DEP-3, NF-4, NF-5)
  - **Registry shape:** `getSections()` returns exactly **two** entries in order — `home` (`/`) and
    `about` (`/about/`) — and `dist/` contains exactly the expected routes: `index.html`,
    `about/index.html`, `404.html`, `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml`, plus `_astro/`
    assets. No `resume/` directory. (RES-X1, REG-2)
  - **Chrome consistency (RES-X2):** nav renders exactly two items with `aria-current="page"` on the
    active one; `sitemap-0.xml` lists exactly `/` and `/about/`; each page's canonical is
    self-referencing and absolute; canonical URLs, sitemap URLs, and the `robots.txt` `Sitemap:` line
    are byte-identical (trailing-slash normalized); `404.html` is still excluded from the sitemap.
    (SEO-3, SEO-10, SEO-11, R8)
  - **No dead résumé route (RES-X2):** via `npm run preview`, requesting `/resume/` returns the styled
    404 page (not a bare server error, not a redirect), and no built page links to it.
  - **[v1.6] Superseded by T-30 (audit record only):** every build now writes the host-matched `dist/_headers` rule, so the absence asserted below no longer holds and is not a regression. **Production `_headers` absence (added per plan review):** a default local build
    (`npm run build`, no `CF_PAGES_BRANCH`) leaves **no `dist/_headers` file at all**, and a preview
    build (`CF_PAGES_BRANCH=preview-x npm run build`) produces a `dist/_headers` containing only the
    `/*` + `X-Robots-Tag: noindex` rule. Four places in the tech design (§10.1, §11.1 rule 3b, §11.3)
    assert this, and T-27 owns the change — but the assertion itself belongs here, because T-28 is the
    ticket that runs after *all four* removal commits land. (RES-X1, SEO-12)
  - **Whole-`dist` residue scan (the strong form of T-26's scoped check):** `rg -i 'resume' dist/`
    returns **nothing** — no `--glob` exclusion this time, because T-27 has removed the
    `gen-headers.mjs` PDF rule that forced the exclusion in T-26. If this still matches, a removal
    ticket has left residue behind. (RES-X1, RES-X3)
  - **Person JSON-LD still parses:** the `dist/index.html` JSON-LD block is valid JSON with
    `@type: Person` and `name`/`jobTitle`/`sameAs` present. (SEO-1, RES-X4)
  - **a11y + mobile re-sweep on the two routes:** axe/Lighthouse a11y clean (WCAG AA contrast,
    keyboard-navigable, no landmark issues); manual pass at 375px / 390px / 430px with no horizontal
    scroll, all touch targets ≥44px, readable without pinch-zoom; the reworded 404 CTA (`.btn-primary`)
    is still ≥44px with a visible focus ring. (NF-2, NF-3, HOME-5)
  - **Performance still holds:** mobile-preset Lighthouse full render <2s on throttled network for
    `/`. Removing a page should make this easier, not break it — a regression here means something
    unintended was added. (NF-1, US-3)
  - **Extensibility regression (SHOULD):** re-run the T-22 two-file stub proof (`now.md` +
    `NowSection.astro`) against the trimmed registry — it must still appear in nav + sitemap with zero
    changes to `Nav.astro`, `BaseLayout.astro`, `[...slug].astro`, `templates.ts`, or
    `content.config.ts` — then revert and confirm `git status` is clean. Guards against the enum edit in
    `T-25` having quietly broken the extensibility promise. (US-9, REG-6)
- **Affected paths:** QA-only (audit output); fixes to `src/**`/`scripts/**` if findings surface. No committed report artifact unless the plan requires one.
- **Affected codebase:** `qa/`
- **Suggested skills:** `lighthouse`, `a11y`, `performance`, `astro`, `git`
- **Verification command(s):** `npm run build && npx astro check && npm run verify`; `rg -o '<loc>[^<]+' dist/sitemap-0.xml`; `npm run preview` + `curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/resume/` (expect 404 **and** verify the body is the styled 404); `npx lighthouse http://localhost:4321/ --form-factor=mobile --output=json --quiet`.
- **Notes:** RES-X2, NF-1..NF-3, SEO-1/3/10/11, US-9. Any failing finding is fixed **in this ticket**,
  or split out as a new ticket if it exceeds size M. Findings that turn out to be *pre-existing* (not
  caused by the removal) are logged, not silently absorbed — the planner should know. This ticket must
  complete before `T-19`: the first production deploy ships the trimmed site, never the résumé.

#### T-29: Canonical host → `https://www.mattoconn.workers.dev`

> **[v1.6] Patch to T-4's shipped default** (PRD DEP-5, OQ-8). Code-only; the account-subdomain
> rename that makes the host resolve is a T-19 owner step. This ticket does not need the host to be
> live: every check below runs against local build output.

- **Acceptance Criteria:**
  - `astro.config.mjs`: the default in `(env.PUBLIC_SITE_URL || '…')` becomes
    `'https://www.mattoconn.workers.dev'`. The `loadEnv` resolution, trailing-slash strip, and every
    other line stay byte-identical. (DEP-5, SEO-11)
  - `src/config/site.ts` is **not edited**: as shipped it reads `import.meta.env.SITE` and contains no
    host literal (design §4.5). Editing it is out of scope. (SEO-11)
  - `.env.example`: the `PUBLIC_SITE_URL=` value and the "Defaults to …" comment name the new host.
    Leave the `CF_PAGES_BRANCH`/`CF_PAGES_URL` blocks alone; T-30 removes them together with the
    code that reads them. (DEP-5)
  - `README.md`: the `PUBLIC_SITE_URL` bullet names the new default. Leave the "deployed to
    Cloudflare Pages" line (T-19) and the `CF_PAGES_BRANCH` bullet (T-30). (DEP-5)
  - No `mattoconn.pages.dev` literal remains outside `projects/`. (DEP-5)
  - `npm run build` exits 0 (includes the verify gate), and the built site uses the new host
    everywhere: robots `Sitemap:` line, every canonical, every sitemap `<loc>`, JSON-LD `url`. (SEO-11)
  - `PUBLIC_SITE_URL=https://example.test npm run build` still exits 0 with `example.test` in the
    same places (T-4's plumbing test still holds). Rebuild without it afterwards. (SEO-11)
- **Affected paths:** `astro.config.mjs`, `.env.example`, `README.md`
- **Affected codebase:** `astro/`
- **Suggested skills:** `astro`, `npm`
- **Verification command(s):**
  `rg -n 'mattoconn\.pages\.dev' --hidden -g '!projects/**' -g '!node_modules/**' -g '!dist/**' .`
  (no matches); `npm run build`;
  `grep -F 'Sitemap: https://www.mattoconn.workers.dev/sitemap-index.xml' dist/robots.txt`;
  `grep -F 'href="https://www.mattoconn.workers.dev/about/"' dist/about/index.html`;
  `grep -F '<loc>https://www.mattoconn.workers.dev/</loc>' dist/sitemap-0.xml`;
  `rg -c 'pages\.dev' dist/` (no matches).
- **Notes:** At this rank `gen-headers.mjs` still uses `CF_PAGES_BRANCH`, so a plain build writes no
  `_headers` and the gate passes unchanged; T-30 changes that. The host-change risk R1 is carried by
  T-19: if the account subdomain `mattoconn` turns out to be unavailable, the planner revises this
  literal; T-19 must not.

#### T-30: Host-matched `_headers` noindex (replaces `CF_PAGES_BRANCH` detection)

> **[v1.6] Patch to T-18/T-27's shipped mechanism** (PRD SEO-12 note, OQ-8(c)). `CF_PAGES_BRANCH`
> is a classic-Pages variable that Workers Builds never sets, so on the new platform every build
> would be classified as production and no host would ever get `noindex`. Branch detection is
> replaced, not re-pointed at `WORKERS_CI_BRANCH`: see design §10.1 for why. The exact code for all
> three scripts is in design §10.1 and §11.1 (rule 4e); implement it as written.

- **Acceptance Criteria:**
  - New `scripts/noindex-rule.mjs` exports `canonicalOriginFromRobots`, `noindexHeadersFor`, and
    `hostPatternMatches` exactly as design §10.1 specifies: pure, zero dependencies, no env reads. (SEO-12)
  - `scripts/gen-headers.mjs` is rewritten per design §10.1: reads the canonical origin from
    `dist/robots.txt`, **always** writes `dist/_headers` = `noindexHeadersFor(origin)`, and reads no
    environment variable. A missing `robots.txt` or `Sitemap:` line fails the build. (SEO-12, RES-X3)
  - With the default host, `dist/_headers` is byte-exactly
    `https://:prefix-www.mattoconn.workers.dev/*\n  X-Robots-Tag: noindex\n` on **every** build. (SEO-12)
  - Output is environment-independent: a build with `CF_PAGES_BRANCH=preview-x WORKERS_CI_BRANCH=feature-x`
    produces a byte-identical `dist/_headers`. (SEO-12)
  - With `PUBLIC_SITE_URL=https://example.test`, `dist/_headers` is
    `https://:worker.:account.workers.dev/*\n  X-Robots-Tag: noindex\n` and `npm run build` exits 0. (SEO-12)
  - `scripts/verify-static.mjs`: the branch-aware rule 4e block (`NOINDEX_RULE`, `PROD_BRANCH`,
    `process.env.CF_PAGES_BRANCH`) is replaced by the design §11.1 rule 4e block, and the header
    comment's `CF_PAGES_BRANCH`-prefixed-build paragraph is deleted. Rule 0's own `SITE_ORIGIN`
    derivation and every other rule are unchanged. (SEO-12, RES-X3)
  - **Planted negatives:** after `npm run build`, each of these makes `npm run verify` exit non-zero
    with a `dist/_headers` failure, and a fresh `npm run build` restores green:
    (a) overwrite with `/*\n  X-Robots-Tag: noindex\n` (path-only rule);
    (b) overwrite with `https://:a.mattoconn.workers.dev/*\n  X-Robots-Tag: noindex\n` (matches the canonical host);
    (c) `rm dist/_headers`. (SEO-12)
  - `.env.example`: the `CF_PAGES_BRANCH` block (including the live `CF_PAGES_BRANCH=main` line) and
    the `CF_PAGES_URL` block are removed, replaced by one comment: the build reads no
    Cloudflare-injected variable; non-canonical hosts are noindexed by a host-matched `_headers`
    rule derived from `PUBLIC_SITE_URL`. The "kept out of search via CF_PAGES_BRANCH" phrase in the
    `PUBLIC_SITE_URL` comment is reworded to match. (DEP-6)
  - `README.md`: the `CF_PAGES_BRANCH` bullet is replaced by a `_headers` explanation (host-matched,
    identical on every build, how to read it), and the `npm run build` row says it **writes**
    `dist/_headers` (not "emit (or remove)"). (DEP-6)
  - No reference to `CF_PAGES`, `WORKERS_CI`, or `PROD_BRANCH` remains in `scripts/`, `src/`,
    `astro.config.mjs`, `.env.example`, or `README.md`. (SEO-12)
- **Affected paths:** `scripts/noindex-rule.mjs` (new), `scripts/gen-headers.mjs`,
  `scripts/verify-static.mjs`, `.env.example`, `README.md`, `dist/_headers` (generated)
- **Affected codebase:** `scripts/`
- **Suggested skills:** `node`, `regex/parsing`, `ci/cd-cloudflare`
- **Verification command(s):**
  `npm run build && printf 'https://:prefix-www.mattoconn.workers.dev/*\n  X-Robots-Tag: noindex\n' | cmp - dist/_headers`;
  `cp dist/_headers "$TMPDIR/h" && CF_PAGES_BRANCH=preview-x WORKERS_CI_BRANCH=feature-x npm run build && cmp "$TMPDIR/h" dist/_headers`;
  the three planted negatives above; `PUBLIC_SITE_URL=https://example.test npm run build && cat dist/_headers`, then `npm run build`;
  `rg -n 'CF_PAGES|WORKERS_CI|PROD_BRANCH' scripts/ src/ astro.config.mjs .env.example README.md` (no matches).
- **Notes:** This deliberately **reverses** T-27's "production writes no `_headers`" invariant, with
  owner approval (PRD OQ-8). The invariant that mattered, "the canonical host never gets `noindex`",
  is kept and now asserted directly and independently of the writer. Host-matched rules cannot fire
  on `localhost`, so live confirmation of Cloudflare's placeholder matching is a T-19 smoke check.
  Closes QA carry-forward N-1 (`qa/qa-report-T-27.md`).

---

## Dependency Graph

Linear backbone (single-pass order; every dependency appears strictly before its dependent):

```
T-1 (scaffold)
 ├─ T-2 (schema) ── T-3 (helper + skeletons) ── T-5 (nav) ── T-6 (layout)
 │                                          └─ T-8/T-10 (templates) ── T-7 (route) ── T-12 (SEO) ── T-21 (QA)
 │                                                                 └── T-13 (Person JSON-LD) ── T-23 (owner copy)
 └─ T-4 (site URL)
      ├─ T-12 (SEO head)  ── T-21 (QA)
      ├─ T-15 (sitemap)  ── T-22 (extensibility)
      ├─ T-16 (robots)
      ├─ T-18 (_headers)
      └─ T-13 (Person JSON-LD URLs)
T-8 ── T-20 (verify script)   T-17 (fonts) ── T-20/T-21

REMOVAL CHAIN (PRD v1.5 — must all land before the first production deploy):
T-2/T-3/T-7 ── T-25 (drop resume.md + ResumeSection + enum) ── T-26 (Home link + JSON-LD + token)
                                    └── T-18/T-20 ── T-27 (scripts: headers, verify, fonts) ──┐
T-12/T-17 ───────────────────────────────────────────────────────────────── T-28 (re-verify) ─┐
                                                                                              │
PLATFORM CORRECTION (PRD v1.6 - Pages → Workers static assets):                               │
T-4 ── T-29 (host → www.mattoconn.workers.dev) ── T-30 (host-matched noindex) ── T-19 (deploy) ◀┘
T-18/T-27 ─────────────────────────────────────── T-30
T-8/T-10/T-13 ── T-23 (human copy, owner-blocked; does NOT gate T-19)
```

> **[Plan-review correction] The T-7/T-8 edge was drawn backwards.** The backbone previously read
> `T-6 ── T-7 (route) ── T-8/T-9/T-10 (templates)`, implying the route precedes the templates. It is the
> reverse: `T-7` **depends on** `T-8` and `T-10` (a registered section whose template is missing is a
> build failure, tech design §5.1), so the templates are authored *before* the route that renders them.
> Corrected above. `T-9` is gone from the backbone entirely — it is retired, not reordered.

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
| **T-25** | T-2, T-3, T-7 |
| **T-26** | T-25, T-8, T-13 |
| **T-27** | T-25, T-18, T-20 |
| **T-28** | T-25, T-26, T-27, T-12, T-17 |
| **T-29** | T-4 |
| **T-30** | T-18, T-27, T-29 |
| **T-19** | T-18, **T-28**, **T-29**, **T-30** |
| T-20 | T-7, T-8, T-10, T-11, T-15, T-16, T-17, T-18 |
| T-21 | T-8, T-9, T-10, T-11, T-12, T-17 |
| T-22 | T-3, T-5, T-7, T-15 |
| T-23 | T-8, T-10, T-13 |
| ~~T-24~~ | **none** — **CANCELLED (PRD v1.5); never executed** |

**Historical edges, not actionable instructions:** five completed tickets (`T-7`, `T-14`, `T-15`, `T-17`, `T-18`, `T-21`) recorded a dependency on `T-9` when it was real work — a registered section whose template is missing is a build failure. `T-9` is now **retired**, and all of those tickets are `- [x]`, so the edges are inert history. They are **deliberately preserved verbatim** in both the Part A `deps:` fields and the table above, because rewriting a completed ticket's recorded dependencies would falsify the audit trail. Do not "clean them up," and do not treat them as instructions to schedule anything.

**[Plan-review correction] The former `T-20 → T-19` edge has been removed, not merely re-labelled.** It was previously excused as "historical" on the grounds that `T-19` was merely *open* — but an open ticket is not a historical artifact, and a `- [x]` ticket cannot depend on work that has not happened. The real defect was ownership: T-20's AC bundled the Cloudflare build-command retrofit, which requires a live project. **That retrofit now belongs to `T-19`** (see its AC), so T-20's script work is genuinely complete and correctly marked `- [x]`, and its `deps:` field above matches reality.

**Critical new edge — `T-19 → T-28`:** the first production deploy must not happen until the removal is
verified. The résumé was already built and committed, so without this edge the very first public deploy
would publish a résumé the owner has decided against. This is the single most important ordering
constraint introduced by PRD v1.5.

---

## Risk Assessment

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **Account workers.dev subdomain `mattoconn` unavailable** (DEP-5; was `mattoconn.pages.dev` before v1.6) | High | T-19's owner step renames `mattgoconn` → `mattoconn` and **stops + escalates to the planner** if the name is taken, rather than deploying on `mattgoconn` or picking another name. DNS showed `mattoconn.workers.dev` unregistered on 2026-09-27, but only the rename can confirm it. All URLs dep-inject from one literal (T-29), so a revised name is a one-line planner change. |
| R2 | **Non-canonical-host `noindex` mechanism** (SEO-12). **[v1.6]** Workers static assets `_headers` supports host-matched rules, so T-30 derives one rule from the canonical host (`https://:prefix-www.mattoconn.workers.dev/*`). Wrong rule → either indexable preview/version URLs or, worse, a noindexed canonical host. | High | Rule written on every build and derived from build output, not env; `verify-static.mjs` rule 4e fails any path-only rule or any rule whose host pattern can match the canonical host (T-30); T-19's live smoke check greps the canonical response for `X-Robots-Tag` and rolls back on any hit. Cloudflare's own automatic noindex on Preview URLs is extra cover, not the mechanism. (v1.5's `CF_PAGES_BRANCH` detection is retired: Workers Builds never sets it.) |
| R3 | **Human-blocked content stalls delivery** (T-23 owner copy) | Medium | The ticket is explicitly HUMAN-BLOCKED and terminal; the site deploys fully with clearly-marked `HUMAN COPY` placeholders (MS-8), so the pipeline is never blocked upstream. No dev-authored biographical facts are substituted. **Deploy is not launch:** the URL is treated as staging and is not announced as finished until T-23 lands and is re-deployed (MS-9, plan §4). (v1.5: only one human-blocked ticket remains — the résumé PDF ticket T-24 was cancelled, removing a whole class of owner dependency.) |
| R4 | **US-9/REG-6 vs REG-7 tension**: the closed template enum can't accept a stub `now` section without touching the schema. | Medium | T-22's test procedure scopes any enum change to its single sanctioned extension module and asserts zero nav/layout/sitemap/route changes. Tech design §Content Schema & Registry decides: pre-include the four capped future templates vs. one-line extension per section. (v1.5: the enum is now `home\|about\|projects\|blog\|now\|uses` after T-25 removed `resume`; `now` is still pre-included, so T-22's two-file proof holds unchanged.) |
| R5 | **Zero-JS scanner false negatives/positives** (NF-5): JSON-LD `<script>` blocks must not be flagged; a future island must be flagged. | Medium | T-20 exempts only `type="application/ld+json"`; treats `script src`, inline JS bodies, and event-handler attributes as violations; negative test (plant a script, expect failure) is part of acceptance. |
| R6 | **Astro 7 / Content Layer API surface drift** (glob loader imports, zod expectations) — legacy content-collections syntax no longer works in Astro 6+. | Medium | T-1 pins Astro `^7` and T-2 prescribes `astro:content` `defineCollection` + `astro/loaders` `glob`; `npx astro check` + `npm run build` gate each schema ticket. Tech design §Content Schema & Registry pins exact signatures. |
| R7 | **NF-1 load <2s on throttled mobile** compromised by fonts/CSS weight (or preview-host latency). | Medium | T-17 subsets to used glyphs, single family, WOFF2, `font-display: swap`; T-21 gates the metric on a local preview (deterministic) before production confirmation. |
| R8 | **Canonical/sitemap/robots URL drift** (trailing-slash or host inconsistencies) could reintroduce the duplicate-host indexing bug (SEO-11/12). | Medium | Single `SITE_URL` source (T-4) + a `path()` helper normalized once; T-12/T-15/T-16 all read from it; byte-identical URLs are explicit acceptance criteria in T-12. |
| R9 | **`npm create astro` interactivity/network flakiness in an automated pipeline.** | Low | Non-interactive flags (`--template minimal --no-git --yes`); if registry access fails, retry/freeze versions per tech design §Repo Layout & Tooling. |
| R10 | **Preview env leakage**: `PUBLIC_SITE_URL` accidentally set to a preview host breaks canonical/noindex pairing. | Medium | **[v1.6]** `PUBLIC_SITE_URL` is set **nowhere** in Cloudflare (T-19 AC: no build variables); the committed default is the canonical host. Documented as a hard constraint in T-4/T-29. |
| R11 | **Incomplete removal (NEW, v1.5):** the résumé is deleted from the pages but survives somewhere less visible — a stale `/resume.pdf` header rule, a presence-assert that demands the deleted page, a font-subsetting input list pointing at a deleted file, or a `ProfilePage` node reattached to another page. Each is invisible on the rendered site and would ship silently. | Medium | Every residue class has an owning ticket and an assertion: registry/template/enum → `T-25`; links, JSON-LD, token name, comments → `T-26`; scripts and their negative asserts → `T-27`; whole-site re-verification → `T-28`. The `rg -i 'resume' dist/` check in `T-26` is the single strongest guard — build output is generated, so no comment can mask a residue. `RES-X1..X4` make these MUST, not nice-to-have. |
| R12 | **Deploy-before-removal race (NEW, v1.5):** the résumé is already committed, so a `T-19` deploy that runs before `T-28` would publish it publicly. | High | Hard dependency edge `T-19 → T-28`, and the removal tickets are sequenced ahead of `T-19` in Part A's topological order. `T-19` is still the only open deploy ticket, so the ordering holds in a lazy single pass. If anyone proposes deploying early, stop and return to the planner. |
| R13 | **Silent capability loss (NEW, v1.5):** the site loses its only `ProfilePage` structured data and its most concrete depth artifact, which may weaken how well AI assistants and search engines can summarise the owner — the exact parseability the project optimizes for. | Medium | Accepted explicitly in PRD OQ-3/OQ-7 rather than left implicit. Mitigations: `Person` JSON-LD (SEO-1) is retained and regression-guarded (`RES-X4`); `sameAs` still points at LinkedIn, so the authoritative entity link survives; the routing story (Home → About + LinkedIn + GitHub) is measured by the two new §8 metrics. If SEO-3's non-name-query goal later proves unmet, the correct response is a **new project**, not a résumé reinstatement. |

---

## PRD Coverage Matrix (completeness proof — no MUST requirement orphaned)

> **v1.5:** `RES-1`..`RES-5`, `SEO-2`, `DEP-7`, `US-5`..`US-7` are tombstoned in the PRD (removed by
> OQ-7) and are listed here as `REMOVED` rather than deleted, so the ID space stays auditable and no
> ID is ever silently reused. `RES-X1`..`RES-X4`, `US-15`, `US-16` are the removal's live obligations.

| PRD ID | Ticket(s) | PRD ID | Ticket(s) |
|---|---|---|---|
| HOME-1 | T-8 (+T-23) | SEO-1 | T-13 (+T-23) |
| HOME-2 | T-8 (+T-23) | ~~SEO-2~~ | **REMOVED (v1.5)** — was T-14 (retired); no successor |
| HOME-3 | T-8, **T-26** (+T-23) | SEO-3 | T-15, T-28 |
| HOME-4 | T-8 | SEO-4 | T-16 |
| HOME-5 | T-8, T-21, T-28 | SEO-5 | T-17, **T-27** |
| HOME-6 | T-13, **T-26** | SEO-6 | T-12 |
| HOME-7 | T-15 | SEO-7 | T-12 |
| ~~RES-1~~ | **REMOVED (v1.5)** — was T-9 (retired) | SEO-8 | T-12 |
| ~~RES-2~~ | **REMOVED (v1.5)** — was T-24 (cancelled) | SEO-9 | T-6 |
| ~~RES-3~~ | **REMOVED (v1.5)** — was T-24 (cancelled) | SEO-10 | T-5, T-12, T-15, T-28 |
| ~~RES-4~~ | **REMOVED (v1.5)** — was T-9 (retired) | SEO-11 | T-4, T-12, T-28, **T-29**, T-19 |
| ~~RES-5~~ | **REMOVED (v1.5)** — was T-18, T-24; rule stripped by T-27 | SEO-12 | T-18, **T-27**, T-28, **T-30**, T-19 (live check) |
| **RES-X1** (new) | **T-25, T-26, T-27**, T-28 | DEP-1 | T-19 |
| **RES-X2** (new) | **T-28** | DEP-2 | T-19 |
| **RES-X3** (new) | **T-27**, **T-30** | DEP-3 | T-1, T-20 |
| **RES-X4** (new) | **T-26**, T-28 | DEP-4 (SHOULD) | T-1 |
| ABT-1 | T-10, T-23 | DEP-5 | T-4, **T-29**, T-19 |
| ABT-2 | T-23 | DEP-6 | T-19, T-23, T-30 (docs) |
| ABT-3 | T-23 | ~~DEP-7~~ | **REMOVED (v1.5)** — was T-18, T-24; stripped by T-27 |
| ABT-4 | T-10, T-21, T-28 | NF-1 | T-21, **T-28** |
| REG-1 | T-2, **T-25** | NF-2 | T-8, T-11, T-21, **T-26**, **T-28** |
| REG-2 | T-3, **T-25**, T-28 | NF-3 | T-5, T-6, T-11, T-21, **T-26**, **T-28** |
| REG-3 | T-5, **T-26**, T-28 | NF-4 | T-17, T-20, **T-27** |
| REG-4 | T-6, T-7 | NF-5 | T-6, T-11, T-20, **T-27** |
| REG-5 | T-15, T-28 | NF-6 | T-1 |
| REG-6 | T-7, T-22, T-28 | US-1 | T-8, T-23 |
| REG-7 | T-2, **T-25**, T-22 | US-2 | T-8, T-26 |
| **DEP-8** (new, v1.6) | **T-19** (committed assets-only `wrangler.jsonc`; static-only invariants + live check) | | |

| User Story | Ticket(s) | User Story | Ticket(s) |
|---|---|---|---|
| US-1 | T-8, T-23 | US-8 | T-10, T-23 |
| US-2 | T-8, T-26 | US-9 | T-22, T-28 |
| US-3 | T-21, T-28 | US-10 | T-5 |
| US-4 | T-5, T-8 | US-11 | T-15 |
| ~~US-5~~ | **REMOVED (v1.5)** — was T-9 (retired) | US-12 | T-19 |
| ~~US-6~~ | **REMOVED (v1.5)** — was T-24 (cancelled) | US-13 | T-19, T-23 |
| ~~US-7~~ | **REMOVED (v1.5)** — was T-18, T-24; cache rule stripped by T-27 | US-14 | T-19 |
| **US-15** (new) | **T-26** (routing), T-28 (verified) | | |
| **US-16** (new) | **T-25, T-26, T-27**, T-28 | | |
# PRD: Personal Website — v1 Professional Identity Hub

> **Upstream source:** [vision.md](../vision/vision.md)  
> **Project:** `initial-site` — the site-initialization project. Everything in §7 is excluded from
> this PRD and becomes a separate project directory under `projects/`; see §11.1.  
> **PRD version:** 1.6  
> **Date:** 2026-09-27  
> **Author:** Product Manager (AI SDLC)

> ### ⚠ Scope change in v1.5 — the résumé surface is removed
>
> **Owner decision, 2026-09-26:** the résumé is no longer published on this site. The v1 scope
> drops from **four surfaces to three** (Home, About, Section Registry) and every résumé-derived
> requirement is removed. This is a **reduction of scope**, not a deferral: the work is cancelled,
> not scheduled.
>
> - **Removed requirement IDs (tombstoned in place, never renumbered):** `RES-1`..`RES-5` (§5.2),
>   `SEO-2` (§5.5), `DEP-7` (§5.6), `US-5`, `US-6`, `US-7` (§10).
> - **Removed decisions:** `OQ-1` and `OQ-4` are superseded by `OQ-7` (§11).
> - **Why IDs are tombstoned, not renumbered:** every ticket, design section, and cross-reference
>   in `tickets/`, `designs/`, and `plans/` cites these IDs. Renumbering would silently repoint
>   them at different requirements.
> - **Consequence for depth signal:** the hiring-manager persona is served by *routing*, not by
>   re-publishing a résumé — About page (authored judgment) + LinkedIn (maintained work history)
>   + GitHub (output). See §3 and §8.
> - **The site as built already contained a résumé** (tickets T-9, T-14, T-18's `/resume.pdf`
>   rule, T-24). Those tickets are **retired** and new removal tickets `T-25`..`T-28` delete the
>   shipped code **before** the first production deploy (`T-19`).

> ### ⚠ Platform correction in v1.6 - Cloudflare Pages is now Cloudflare Workers
>
> **Found during T-19, 2026-09-27:** classic Cloudflare Pages no longer exists for new projects.
> Wrangler delegates project creation to Workers ("Delegating to the latest version of Cloudflare
> Pages, now part of Cloudflare Workers"), and every new Pages-style site is a **Worker with static
> assets**. The dashboard's Connect-to-Git flow, finding no committed Wrangler config, ran
> `astro add cloudflare`, installed the SSR adapter, and moved output to `dist/client/`.
>
> - **Same vendor, same free tier, same static output.** The host changes from `mattoconn.pages.dev`
>   to **`www.mattoconn.workers.dev`** (OQ-8). The deploy is **assets-only**: no Worker script and no
>   `@astrojs/cloudflare` adapter (new `DEP-8`), so NF-5/NF-6 are unchanged.
> - **Changed:** DEP-1, DEP-5, SEO-12 mechanism note, §9 hosting row, US-14 AC, OQ-6 consequence.
>   **Added:** DEP-8, OQ-8. No requirement is removed; no ID is renumbered.
> - **Ticket impact:** `T-19` rewritten; new `T-29` (canonical host) and `T-30` (host-matched noindex)
>   patch what `T-4` and `T-18` shipped. All other tickets are untouched.

---

## 1. Executive Summary

This PRD defines v1 of a personal website for a professional software engineer: a static, zero-JavaScript, mobile-perfect site with three surfaces (Home scan page, About page, and a Section Registry for future extensibility). There is **no résumé surface** — the site publishes no résumé page and hosts no résumé PDF; the hero routes to LinkedIn for the maintained work history and to GitHub for output, while the About page carries the authored judgment signal. It is not a portfolio — it is an identity hub that prioritizes speed, parseability, and architectural cleanliness so that evidence (projects, writing) slots in as content later. The site deploys to a free `workers.dev` subdomain as a static-assets-only Cloudflare Worker (v1.6; formerly Cloudflare Pages), uses Astro + TypeScript, self-hosted fonts, and structured data (JSON-LD) for search engine and AI assistant discoverability.

---

## 2. Problem Statement

**For whom:** A professional software engineer with 6+ years of experience who has no active job search but needs a credible, ownable, current professional surface.

**What problem:**
- No owned surface — LinkedIn is rented, GitHub shows output without judgment.
- Name searches land on noise — no authoritative, six-second-scan answer to "what does this person do?"
- Portfolio sites rot or stall — "stale = abandoned" is a recruiter heuristic.
- Template soup — generic SaaS portfolios signal nothing; doing it competently does.

**v1 solves:** The *presence* half — a credible, current, parseable professional surface. It deliberately defers the *evidence* half (projects, writing) to v2 by making the architecture ready for it.

---

## 3. User Personas

| Persona | Role | What they need in <30s | Success signal |
|---|---|---|---|
| **Scanning Recruiter** | Screens 30+ portfolios/afternoon, ~6s each | Name, role, domain, primary stack — above the fold, in real selectable text | Instantly parses identity; finds GitHub/LinkedIn without hunting; page stays open because it loads fast and is mobile-clean |
| **Hiring Manager / Senior Engineer** | Checks depth on promising candidates | A judgment signal in one click and a maintained work history in the next | Reads the About page and comes away with a view on how the owner thinks; the LinkedIn link is one click away and carries the dated role-and-impact history; GitHub carries the output. **No résumé is published on the site** — depth is routed, not re-hosted (v1.5) |
| **Curious Peer / New Acquaintance** | Wants "personal" context after meeting the owner | About page with genuine hobby threads and a bit of story | Remembers the human; doesn't feel like reading a third-person CV |

---

## 4. Hard Requirements

> These are verbatim constraints from the vision document. They are non-negotiable for v1.

### 4.1 Scope Cap (v1 Surfaces)
- **Three surfaces only:** Home/scan page, About page, and the Section Registry.
- **No Projects, Blog, Now, or Uses sections in v1** — despite the registry being built to support them.
- **No résumé surface (v1.5, supersedes the v1.0–1.4 "four surfaces" cap):** the site publishes no résumé page and hosts no résumé PDF. No `resume` content file, no résumé template, no `/resume.pdf`, no PDF cache rules, no ProfilePage structured data. The Home hero links to LinkedIn and GitHub as the routed depth surfaces. Any future résumé is a **separate project** (see §9, §11 OQ-7).

### 4.2 Zero Client-Side JavaScript
- Astro "zero-JS by default" — static HTML output. No client-side framework runtime.
- React islands available *later* where interactivity earns it; **none in v1**.

### 4.3 No Backend, No Database, No CMS, No Auth
- No contact form, no exposed email, no `mailto:` link.
- GitHub + LinkedIn are the sole contact surface in v1.

### 4.4 No Custom Domain in v1
- Deploy on free-tier subdomain (Cloudflare Pages or Vercel).
- **[v1.6]** Cloudflare Pages has been folded into Workers; the free-tier subdomain is now `*.workers.dev` (DEP-5, OQ-8). The constraint itself is unchanged: no purchased domain in v1.

### 4.5 No Analytics / Tracking
- Zero-tracking default. Any later analytics is an explicit, privacy-conscious choice.

### 4.6 Extensibility Promise (Architectural)
- Future sections (Projects, Blog, Now, Uses) must drop in as **"a typed content file (self-registering via frontmatter) plus a per-section template component"** without touching core navigation, layout, sitemap, or schema code. (Per v1.3 wording — see REG-6.)
- Registry coverage is **capped** at exactly those four known future sections.

### 4.7 Typed Content Model + Structured Data
- Astro content collections / TypeScript.
- Self-hosted subset fonts (no third-party font CDN).
- Structured data: Person JSON-LD + sitemap. (ProfilePage JSON-LD removed in v1.5 with the résumé page — see SEO-2.)

---

## 5. Functional Requirements — Per Surface

### 5.1 Home (Scan Page)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| HOME-1 | Hero section with name, role-in-domain, and primary stack — above the fold | MUST | Left-aligned, real selectable text (no image/CSS text) |
| HOME-2 | Condensed proof line (years of experience, kind of work) | MUST | Below hero, concise |
| HOME-3 | Links to GitHub, LinkedIn, and the About page | MUST | Prominent, no hunting. No résumé link (v1.5) |
| HOME-4 | Zero animations that delay content rendering | MUST | Content-first, no stock photos |
| HOME-5 | Pixel-perfect layout on phones (375px–430px viewport) | MUST | Primary target: mobile |
| HOME-6 | Structured data: Person JSON-LD | MUST | Enables AI assistants and search engines to parse identity. (ProfilePage removed v1.5 — see SEO-2) |
| HOME-7 | Sitemap includes Home page | MUST | Standard sitemap.xml |

### 5.2 Résumé Page + PDF — **REMOVED in v1.5**

> **Tombstone.** The entire section is cancelled by owner decision (2026-09-26). The requirements
> below no longer exist; the IDs are permanently retired and **must not be renumbered or reused**.
> Implemented work that these requirements produced is deleted by tickets `T-25`..`T-28`.

| ID | Requirement | Status |
|---|---|---|
| RES-1 | Résumé landing page with a download button | **REMOVED (v1.5)** |
| RES-2 | PDF served from `/resume.pdf` | **REMOVED (v1.5)** |
| RES-3 | PDF text-extractable / ATS-friendly | **REMOVED (v1.5)** |
| RES-4 | Landing page mobile-responsive download action | **REMOVED (v1.5)** |
| RES-5 | PDF cache headers for prompt updates | **REMOVED (v1.5)** |

**Inherited obligations that survive the removal** (these are the real risk of a removal — they
are not in any removed ID, so they are restated here as MUST and tracked by the removal tickets):

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| RES-X1 | **No résumé artifacts survive in the build** — no `resume` content file, no résumé template component, no ProfilePage JSON-LD component, no `resume` template enum value, no `/resume.pdf` file or link. | MUST | Enforced by `T-25`/`T-26` + the `verify-static.mjs` negative asserts |
| RES-X2 | **No dead links or dangling routes** — the removed page must 404 through the styled 404, and nav, sitemap, canonicals, and robots must no longer reference it. | MUST | Enforced by `T-28` |
| RES-X3 | **No orphaned PDF header rule** — `dist/_headers` must not carry a `/resume.pdf` cache rule for a file that does not exist. | MUST | Enforced by `T-27` |
| RES-X4 | **Person structured data survives** — removing the résumé must not remove or degrade the Home `Person` JSON-LD (name, `jobTitle`, `sameAs`). SEO-1/HOME-6 are unchanged. | MUST | Regression guard in `T-26` |

### 5.3 About Page

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| ABT-1 | First-person voice, 2–4 short paragraphs | MUST | — |
| ABT-2 | Genuine hobby threads | MUST | Enough to make a peer remember the human |
| ABT-3 | Not a third-person CV recital | MUST | Tone: warm, personal, human |
| ABT-4 | Mobile-responsive | MUST | — |

### 5.4 Section Registry

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| REG-1 | Typed content schema (Astro content collection) | MUST | — |
| REG-2 | Registration list (single config/source file) | MUST | One entry per section |
| REG-3 | Navigation derives from registry entries — no hardcoded nav links | MUST | — |
| REG-4 | Layout shells derive from registry — no per-section layout wiring | MUST | — |
| REG-5 | Sitemap derives from registry entries | MUST | — |
| REG-6 | Adding a new section = (a) write a typed content file — **which is itself the registration entry** (frontmatter `slug`/`order`/`navLabel`/`template` drives the registry; there is no separate registration file) — + (b) add a per-section template component. Zero changes to nav/layout/sitemap/schema code. | MUST | Per-v1.3 wording (aligned with implemented mechanism in tech design §4.2/§5.1 and verified by US-9/T-22: a stub "Now" section = `now.md` + `NowSection.astro`, two files, zero core edits) |
| REG-7 | Registry coverage capped at four future sections: Projects, Blog, Now, Uses | MUST | No arbitrary section support |

### 5.5 Structured Data + SEO

> **SEO context (OQ-3 resolved):** The owner's name is common online. Winning exact-name search ranking on a free subdomain is unlikely. Realistic SEO wins: (a) rich parsing by search engines and AI assistants when the page is found, (b) non-name query discoverability, (c) being the authoritative entity linkable from other profiles. The deferred custom domain is the single largest future SEO lever (out of scope v1).

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SEO-1 | Person JSON-LD on Home page (name, jobTitle, url, sameAs for GitHub/LinkedIn) | MUST | Enables AI assistants and search engines to parse identity |
| SEO-2 | ~~ProfilePage JSON-LD on Résumé page~~ | **REMOVED (v1.5)** | The only ProfilePage carrier was the résumé page. Person JSON-LD (SEO-1) is unaffected and remains the sole structured-data node. |
| SEO-3 | `sitemap.xml` generated at build time, includes all pages | MUST | — |
| SEO-4 | `robots.txt` allows crawling of all pages **and explicitly permits AI-assistant crawlers** (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot) plus a `Sitemap:` line | MUST | Researched 2026: blanket disallows silently block AI visibility; allow AI bots explicitly |
| SEO-5 | Self-hosted subset fonts — no third-party font CDN | MUST | No Google Fonts, no external requests |
| SEO-6 | Descriptive `<title>` tag on every page (site name pattern, e.g., "Matt O'Connell — {section}") | MUST | — |
| SEO-7 | Meta description on every page (≤ 160 chars, unique per page) | MUST | — |
| SEO-8 | Basic Open Graph tags (og:title, og:description, og:type) on every page | MUST | — |
| SEO-9 | Semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`) on every page | MUST | Supports accessibility and crawler parsing |
| SEO-10 | All pages crawlable and linkable — no orphan URLs | MUST | Every page reachable from nav or sitemap |
| SEO-11 | Self-referencing absolute canonical URL on every page; exactly one canonical host | MUST | Researched 2026: Cloudflare serves the same content on multiple hosts; duplicate-host indexing is a real bug |
| SEO-12 | Non-canonical hosts (Cloudflare deployment/preview URLs) served with `X-Robots-Tag: noindex` — not `robots.txt` Disallow (must stay crawlable to be deindexed) | MUST | Prevents the Cloudflare "duplicate site outranks real site" failure mode. **[v1.6]** Every non-canonical host of the Worker has the form `<prefix>-www.mattoconn.workers.dev` (preview, deployment, and version URLs). Workers static assets `_headers` can match on hostname, so the rule is host-matched and identical on every build; it no longer depends on a build-time branch variable. The canonical host must never match it. |

### 5.6 Build & Deploy

> **[v1.6] Platform context.** Cloudflare has merged Pages into Workers. A new "Pages-style" site is
> a Worker whose static files are served from an `assets` directory declared in a committed Wrangler
> config (`wrangler.jsonc`); git-triggered builds are **Workers Builds**. The research case behind
> DEP-1 still holds (free tier, static asset requests are free and unmetered, `_headers` support), so
> this is a platform correction, not a vendor change. What the correction must prevent is the T-19
> failure: with no committed config, Cloudflare's deploy step auto-configures an SSR Worker. DEP-8
> makes the static-only shape a committed, checkable fact instead of a dashboard default.

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DEP-1 | Deploy to **Cloudflare Workers (static assets)** free tier, git-connected via **Workers Builds**. **[v1.6: was "Cloudflare Pages", which no longer exists for new projects.]** | MUST | Researched 2026: static asset requests are free and unmetered, no commercial restriction, `_headers` file support (including host-matched rules). (Vercel Hobby: personal/non-commercial only, metered bandwidth.) Free subdomain, no custom domain |
| DEP-2 | Deploy triggered on git push (CI/CD) | MUST | Production branch `main` → `wrangler deploy`; other branches → Preview via `wrangler preview` |
| DEP-3 | Build output is static HTML/CSS/images only | MUST | Zero-JS output; no PDF artifact (v1.5 removed the only non-HTML asset) |
| DEP-4 | Build time < 60 seconds on representative content | SHOULD | — |
| DEP-5 | Canonical host: **`www.mattoconn.workers.dev`** (Worker `www` on account subdomain `mattoconn`). **[v1.6: was `mattoconn.pages.dev`.]** | MUST | The account's workers.dev subdomain is currently `mattgoconn`; T-19 renames it to `mattoconn`. If `mattoconn` is unavailable at that moment, stop and escalate to the planner; never pick another name silently (OQ-8) |
| DEP-6 | Edit workflow: edit markdown → commit → push → auto-deploy in minutes | MUST | No CMS, no backend |
| ~~DEP-7~~ | ~~`/resume.pdf` served with `Cache-Control: public, max-age=60, must-revalidate`~~ | **REMOVED (v1.5)** | No PDF exists. The `_headers` generator's only remaining job is the non-canonical-host `noindex` rule (SEO-12). See RES-X3. |
| **DEP-8** (new, v1.6) | The Worker is **static-assets-only**: a committed `wrangler.jsonc` declares `assets.directory = "./dist"` and **no `main`** (no Worker script); `@astrojs/cloudflare` is never installed; build output stays flat in `dist/` (no `dist/client/`, no `dist/_worker.js`). Unmatched URLs serve `dist/404.html` with status 404 | MUST | Preserves NF-5/NF-6 on the new platform. The committed config is also what stops Workers Builds from auto-running `astro add cloudflare` |

---

## 6. Non-Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| NF-1 | Full page load (HTML + CSS + fonts + images) < 2 seconds on mobile (3G/4G) | MUST | Primary performance bar |
| NF-2 | Mobile-perfect: no horizontal scroll, no touch targets < 44px, readable without pinch-zoom | MUST | 375px minimum viewport |
| NF-3 | Accessibility baseline: semantic HTML, sufficient color contrast (WCAG AA), keyboard-navigable, alt text on any images | MUST | — |
| NF-4 | Zero third-party requests on page load (no font CDN, no analytics, no tracking pixels) | MUST | Self-contained static assets |
| NF-5 | No client-side JavaScript shipped to browser | MUST | — |
| NF-6 | No server-side runtime required | MUST | Pure static output. **[v1.6]** On Workers this means an assets-only Worker with no script (DEP-8) |

---

## 7. Out of Scope (this project)

> Mirrors vision §9, plus additional road-not-taken items. **None of these are later phases of
> `initial-site`** — each is a separate project under `projects/` with its own PRD, tickets, and
> plan. Requirements listed here are deliberately absent from the ticket breakdown in
> `projects/initial-site/tickets/tickets.md`, not deferred within it.

| Item | Why deferred |
|---|---|
| Résumé page, downloadable PDF, or any hosted copy of the résumé | **Cancelled, not deferred** (owner decision 2026-09-26). The maintained work history lives on LinkedIn; the hero links there. If search urgency ever justifies it, it is its own project with its own hosting/freshness decision — never a v1 add-on. |
| Projects showcase / case studies | Highest-value v2 addition; content problem, not site problem |
| Blog / technical writing | Registry supports it; content not ready |
| Contact form or exposed email | Links-only in v1; revisit when search urgency rises |
| Custom domain and branding polish | Cheap, consciously later; free subdomain is fine |
| CMS or editorial workflow beyond markdown + git | Unnecessary complexity for static content |
| Analytics / tracking / community features | Zero-tracking default; later is an explicit choice |
| Anything requiring client-side JS, a database, or a server | Hard constraint |
| Projects/Blog/Now/Uses sections in v1 | Registry supports them; not shipping yet |
| Rust/Axum backend | Rejected: static content does not justify a paid always-on server |
| Next.js | Rejected: ships React runtime + client router on pages that need neither |
| Portfolio SaaS / template themes | Template-identical across candidates; no signal |
| Heavy images, animations, stock photos | Content-first; nothing that delays rendering |
| Framer/Webflow builder | No engineering signal; locked into proprietary builder |

---

## 8. Success Metrics

Derived from the three target personas in the vision document:

| Metric | Target | Persona | How measured |
|---|---|---|---|
| **6-second identity parse** | Recruiter reads name, role, domain, stack in ≤ 6s on first load | Scanning Recruiter | Usability test: give URL, time to correct verbal summary |
| **GitHub/LinkedIn findability** | Links visible above fold or within one scroll on Home page, no hunting | Scanning Recruiter | Usability test + manual inspection |
| **Page load < 2s on mobile** | Full render under 2s on simulated 3G | All | Lighthouse / WebPageTest on mobile preset |
| **Depth is routed, not absent** | A hiring manager reaches a judgment signal in one click and a maintained work history in the next, with no dead ends — About page is readable and links to nothing broken, and GitHub/LinkedIn are both one click from the hero | Hiring Manager | Manual walk: Home → About → external links; confirm every link resolves and no removed page is reachable |
| **About page earns the depth role** | Peer or engineer reading only Home + About can state what the owner works on and how they think, without opening a résumé | Hiring Manager + Curious Peer | Informal test: give Home + About URLs, ask "what do you remember, and how do they seem to think?" |
| **About page memorability** | Peer describes the owner as a person (not just a professional) after reading | Curious Peer | Informal test: give URL, ask "what do you remember?" |
| **No résumé residue** | Zero résumé artifacts in the built site: no résumé page/route, no résumé link, no PDF, no PDF header rule, no ProfilePage JSON-LD, no `resume` enum value | Engineering quality | `npm run build && npm run verify` (negative asserts) + `rg -i 'resume' dist/ src/ scripts/` returns only the retired-ticket references in comments |
| **Extensibility verified** | Adding a new section requires exactly 2 file changes: a typed content file (self-registering via frontmatter) + a template component. Zero changes to nav/layout/sitemap/schema code. | Engineering quality | Manual test: add a stub "Now" section (`now.md` + `NowSection.astro`), confirm it appears in nav and sitemap without touching core files |

---

## 9. Technical Architecture Summary

| Aspect | Decision | Rationale |
|---|---|---|
| Framework | Astro 7.x + TypeScript | Content-first, zero-JS by default, Rust compiler, best mobile load benchmarks in 2026. Researched: legacy "content collections" removed in Astro 6; Content Layer API is the current API |
| Content model | Astro **Content Layer API** (`src/content.config.ts`, glob loader + Zod-typed schema) | Enables typed section registry; compiler-checked |
| Styling | Scoped CSS / Tailwind (TBD) | No client-side JS; CSS-only |
| Fonts | Self-hosted subset (WOFF2) | No third-party CDN; performance + privacy |
| ~~PDF handling~~ | ~~Static artifact — owner-provided PDF committed to `public/resume.pdf`~~ **REMOVED (v1.5)** | No PDF in v1; the site ships HTML/CSS/fonts only. |
| Hosting | **Cloudflare Workers (static assets)** free tier, Workers Builds. **[v1.6: was Cloudflare Pages]** | `www.mattoconn.workers.dev`; git-push deploy; assets-only Worker (DEP-8); free, unmetered static asset requests; host-matched `_headers` for the non-canonical-host noindex policy |
| Structured data | Person JSON-LD (inline in HTML) | Machine-readable; sitemap.xml. ProfilePage JSON-LD removed with the résumé page (SEO-2) |
| Future interactivity | React islands (Astro) — available when earned | Zero islands in v1 |

---

## 10. User Stories

### Home Page
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-1 | As a scanning recruiter, I want to see the engineer's name, role, domain, and primary stack above the fold so I can assess fit in 6 seconds | P0 | Name, role, domain, stack visible without scrolling on 375px mobile viewport; real text, not image |
| US-2 | As a scanning recruiter, I want to find GitHub and LinkedIn links on the Home page so I don't have to hunt for contact paths | P0 | Both links visible on Home page (above fold or within one scroll) |
| US-3 | As a scanning recruiter, I want the page to load in under 2 seconds on mobile so I don't bounce | P0 | Full render < 2s on 3G simulation; verified with Lighthouse |
| US-4 | As a curious peer, I want to navigate to the About page from the Home page | P0 | The About link is present in navigation or hero section |

### Résumé Page + PDF — **REMOVED in v1.5**

> **Tombstone.** `US-5`, `US-6`, `US-7` are cancelled by owner decision (2026-09-26). IDs are
> permanently retired and must not be reused.

| ID | Story | Status |
|---|---|---|
| US-5 | ~~As a hiring manager, I want to reach the résumé page and download the PDF in one click~~ | **REMOVED (v1.5)** |
| US-6 | ~~As a hiring manager, I want the PDF to be text-extractable so ATS systems can parse it~~ | **REMOVED (v1.5)** |
| US-7 | ~~As the site owner, I want the PDF to update promptly after I push a new version~~ | **REMOVED (v1.5)** |

**Replacing story (the depth signal v1 now carries):**

| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-15 | As a hiring manager, I want the site to route me to the maintained work history and the owner's output rather than re-publish a résumé, so I get depth without a stale document | P0 | Home links to LinkedIn and GitHub, both resolvable, no hunting; About page gives an authored judgment signal; no résumé artifact exists on the site (PRD §8 "No résumé residue") |
| US-16 | As the site owner, I want the site to carry no résumé so I never have to keep a hosted document fresh or worry about it going stale | P0 | Zero résumé artifacts in the build (`npm run verify` negative asserts pass); a future change to re-add one is impossible without a new registry content file |

### About Page
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-8 | As a curious peer, I want to read a personal, first-person About page so I remember the human behind the professional | P0 | 2–4 paragraphs, genuine hobby threads, warm tone, not a CV recital |

### Section Registry
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-9 | As a developer, I want to add a new section (e.g., "Now") by writing a content file + a template component, without touching nav/layout/sitemap/schema code | P0 | Manual test: add stub "Now" section (`now.md` + `NowSection.astro`) → appears in nav and sitemap; zero changes to nav/layout/sitemap/route/schema files. (Section registration is frontmatter-driven per REG-6 v1.3 wording; the section's template enum value `now` is pre-included.) |
| US-10 | As a developer, I want the navigation to derive from the registry so that nav always matches published sections | P0 | Nav links are generated from registry; no hardcoded links |
| US-11 | As a developer, I want the sitemap to include all registered sections automatically | P0 | `sitemap.xml` includes every registered section URL |

### Build & Deploy
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-12 | As the site owner, I want to deploy by pushing to git so there is no manual deploy step | P0 | Git push → auto-deploy in < 5 minutes |
| US-13 | As the site owner, I want to edit content in markdown and see it live after push | P0 | Edit .md → commit → push → deployed content updated |
| US-14 | As the site owner, I want the site on a free subdomain so I incur zero cost in v1 | P1 | Site accessible at platform-provided URL: `https://www.mattoconn.workers.dev` (v1.6; was `*.pages.dev`) |

---

## 11. Resolved Decisions

> All six open questions from v1.0 have been resolved by the project planner / owner. This section replaces the Open Questions table.

| # | Decision | Consequence |
|---|---|---|
| ~~**OQ-1**~~ | ~~**Résumé sourcing — static bundling, direct PDF link.**~~ **SUPERSEDED by OQ-7 (v1.5).** Retained for history: the owner had a current résumé PDF and the surface was a direct file link to `/resume.pdf`. | All of §5.2 is tombstoned. The `/resume.pdf` path, its cache rule (DEP-7), the ATS obligation (RES-3), and the landing page no longer exist. |
| **OQ-2** | **First case-study project — parrotlet.** The first Projects-section case study (v2) will be **parrotlet** (small scope, finishable quickly). Requires a public repo + working demo before the case study is written. Non-blocking for v1. | Recorded in §11.1 V2 Backlog below. No v1 requirements affected. |
| **OQ-3** | **Name commonness / SEO — name IS common, SEO is a first-class priority.** The owner's name is common online; winning exact-name search on a free subdomain is unlikely. SEO is still a priority — realistic wins are rich parsing when found, non-name queries, and being the authoritative entity linkable from other profiles. Custom domain is the single largest future SEO lever (deferred v1). | SEO-1 remains MUST. SEO-6 through SEO-12 added as MUST. **SEO-2 was promoted to MUST by this decision and is now removed by OQ-7** — the loss of ProfilePage structured data is an accepted consequence of removing the résumé page. §5.5 context note updated. |
| ~~**OQ-4**~~ | ~~**Résumé detail level — out of scope for the site.**~~ **SUPERSEDED by OQ-7 (v1.5).** Retained for history: the résumé's internal content and detail level were entirely the owner's concern, living in the provided PDF. | No longer applicable — there is no PDF and no résumé surface. |
| **OQ-5** | **Staleness policy — not a concern.** Owner updates whenever they have updates; no forced cadence, no date-stamping, no "90-day" rule. | "Stale ≠ abandoned" metric removed from §8. No date-stamp requirements added. **Reinforced by v1.5:** removing the hosted PDF eliminates the single stalest-prone asset the site would have carried. |
| **OQ-6** | **Subdomain alias — `mattoconn`.** Desired subdomain identity is `mattoconn`. Hosting research (2026) recommends **Cloudflare Pages**: unlimited bandwidth/requests, no commercial restriction, `_headers` for cache control; Vercel Hobby is personal/non-commercial only with metered bandwidth. | DEP-1/DEP-5 encode Cloudflare Pages (`mattoconn.pages.dev`, availability checked at deploy). §9 hosting row updated. **[v1.6] Host amended by OQ-8**; the `mattoconn` identity survives as the account's workers.dev subdomain. |
| **OQ-7** | **No résumé on the site (NEW, v1.5).** Owner decision, 2026-09-26: the résumé is not published here. The work history lives on LinkedIn (kept current by the owner, off-site, no staleness debt); the About page carries the authored judgment signal; GitHub carries the output. No résumé page, no PDF, no ProfilePage JSON-LD, no `resume` template enum value. | §4.1 scope cap drops to three surfaces. §5.2/RES-1..5, SEO-2, DEP-7, US-5..7 tombstoned; RES-X1..X4 and US-15/US-16 added as the removal's real obligations. Tickets T-9, T-14, T-24 **retired**; `T-25`..`T-28` delete the already-shipped résumé code **before** the first deploy (`T-19`), so the résumé is never publicly live. Any future return is a separate project (§7, §11.1). |
| **OQ-8** | **Deploy platform correction (NEW, v1.6).** Owner decisions, 2026-09-27, after T-19 failed on the Pages→Workers merge: (a) canonical host **`https://www.mattoconn.workers.dev`**: rename the account workers.dev subdomain `mattgoconn` → `mattoconn` and name the Worker `www`; (b) **delete** the half-configured `personal-website` Worker rather than reuse it (done by the planner the same day with `wrangler delete`, so no push can rebuild it); (c) noindex non-canonical hosts with a **host-matched `_headers` rule** derived from the canonical host, identical on every build, replacing `CF_PAGES_BRANCH` detection. Rejected: swapping to `WORKERS_CI_BRANCH` (leaves production version/deployment URLs indexable), relying only on Cloudflare's automatic Preview-URL noindex (a week-old beta; coverage of version/deployment URLs unconfirmed), and buying a custom domain (reverses §4.4). | DEP-1, DEP-5 rewritten; DEP-8 added; SEO-12 note, §9, US-14 amended. `T-19` rewritten; `T-29` and `T-30` added ahead of it. Production builds now **ship** a `_headers` file, reversing the v1.5 "no `_headers` on production" invariant; the invariant that matters, "the canonical host never receives `noindex`", is kept and now checked directly. |

### 11.1 Follow-on Projects (not this project)

> These are **separate projects**, each with its own directory under `projects/`, vision doc, and
> plan. They are recorded here only so the site roadmap is visible in one place. Do not add them as
> tickets to `projects/initial-site/tickets/tickets.md` — start a new project directory instead.

| Item | Own project name | Status | Notes |
|---|---|---|---|
| Résumé surface (page + PDF) | e.g. `resume-surface` | **Cancelled by OQ-7** — not planned, not deferred to a date | Only if search urgency rises. Would need its own decisions on hosting, freshness, and staleness signalling. Registry makes it a 2-file change if it ever returns. |
| First case-study project: **parrotlet** | (evidence-gathering, not site work) | Blocked on: public repo + working demo | Small scope; finish it before the Projects section is worth building. |
| Projects showcase section | e.g. `projects-section` | Blocked on: parrotlet case study content | Registry supports it; section registration is a 2-file change per the extensibility promise. |
| Custom domain | e.g. `custom-domain` | Deferred | Single largest future SEO lever. Cheap, consciously later. |
| Now section / update cadence | e.g. `now-section` | Deferred | Add if an update rhythm emerges organically. |

---

## 12. Revision History

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-09-18 | PM (AI SDLC) | Initial PRD from vision doc |
| 1.1 | 2026-09-21 | PM (AI SDLC) | Resolved OQ-1–OQ-6: résumé → static PDF link, parrotlet as first case study, SEO strengthened, staleness dropped, subdomain `mattoconn` |
| 1.2 | 2026-09-21 | Project Planner | Folded technical research into PRD: Cloudflare Pages decided (DEP-1), AI-crawler robots policy (SEO-4), canonical + noindex duplicate-host policy (SEO-11/12), PDF cache headers (DEP-7), Astro 7 Content Layer API nomenclature (§9) |
| 1.3 | 2026-09-21 | Project Planner | Extensibility wording aligned with implemented mechanism (REG-6/US-9/§8): the content file *is* the registration entry (frontmatter drives the registry); a per-section template component is also required. Zero nav/layout/sitemap/schema changes unchanged. |
| 1.4 | 2026-09-25 | Project Planner | Scope framing only — no requirement added, removed, or reworded. Named the project `initial-site`; retitled §7 and §11.1 so deferred capabilities are separate project directories under `projects/`, not phases of this one. Ticket scope unchanged. |
| **1.5** | **2026-09-26** | **Project Planner** | **Scope reduction — résumé surface removed (owner decision, PRD OQ-7).** Four surfaces → **three** (Home, About, Section Registry). **Removed:** `RES-1`..`RES-5` (§5.2 tombstoned), `SEO-2` (ProfilePage JSON-LD), `DEP-7` (`/resume.pdf` cache headers), `US-5`/`US-6`/`US-7`; `OQ-1` and `OQ-4` superseded. **Added:** `RES-X1`..`RES-X4` (the removal's real obligations — no residue, no dead links, no orphaned header rule, Person JSON-LD survives), `US-15`/`US-16` (routing replaces hosting the résumé), §7/§9/§11.1 out-of-scope + cancelled rows, and two new §8 metrics. §3 hiring-manager persona re-pointed at About + LinkedIn + GitHub. **IDs tombstoned, never renumbered** — every ticket/design `§`-reference stays valid. Ticket impact: `T-9`/`T-14`/`T-24` retired; `T-25`..`T-28` added and sequenced **before** the first deploy (`T-19`). |
| **1.6** | **2026-09-27** | **Project Planner** | **Deploy platform correction (OQ-8).** Cloudflare Pages is now part of Workers; T-19 failed when Workers Builds auto-installed the SSR adapter. DEP-1 → Cloudflare Workers static assets + Workers Builds; DEP-5 → `www.mattoconn.workers.dev`; new DEP-8 (assets-only Worker, committed `wrangler.jsonc`, no adapter); SEO-12 mechanism → host-matched `_headers`; §1, §4.4, §9, NF-6, US-14, OQ-6 amended. No ID removed or renumbered. Ticket impact: `T-19` rewritten, `T-29`/`T-30` added before it. |

---

*This PRD is a planning artifact for the AI SDLC execution pipeline. It references [vision.md](../vision/vision.md) as the upstream source of truth.*

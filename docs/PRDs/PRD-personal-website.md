# PRD: Personal Website — v1 Professional Identity Hub

> **Upstream source:** [vision-personal-website.md](../vision/vision-personal-website.md)  
> **PRD version:** 1.1  
> **Date:** 2026-09-21  
> **Author:** Product Manager (AI SDLC)

---

## 1. Executive Summary

This PRD defines v1 of a personal website for a professional software engineer: a static, zero-JavaScript, mobile-perfect site with four surfaces (Home scan page, Résumé landing page + statically-hosted PDF, About page, and a Section Registry for future extensibility). The résumé surface is a minimal landing page linking to a PDF the owner provides and commits to the repo — no résumé content is rendered in site HTML. It is not a portfolio — it is an identity hub that prioritizes speed, parseability, and architectural cleanliness so that evidence (projects, writing) slots in as content later. The site deploys to a free-tier subdomain on Cloudflare Pages or Vercel, uses Astro + TypeScript, self-hosted fonts, and structured data (JSON-LD) for search engine and AI assistant discoverability.

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
| **Hiring Manager / Senior Engineer** | Checks depth on promising candidates | Résumé with impact-focused bullets + downloadable ATS-friendly PDF | Sees outcomes and technical judgment; tone signals quality before first interview |
| **Curious Peer / New Acquaintance** | Wants "personal" context after meeting the owner | About page with genuine hobby threads and a bit of story | Remembers the human; doesn't feel like reading a third-person CV |

---

## 4. Hard Requirements

> These are verbatim constraints from the vision document. They are non-negotiable for v1.

### 4.1 Scope Cap (v1 Surfaces)
- **Four surfaces only:** Home/scan page, Résumé landing page + statically-hosted PDF, About page, and the Section Registry.
- **No Projects, Blog, Now, or Uses sections in v1** — despite the registry being built to support them.
- **Résumé decision (OQ-1 resolved):** The résumé surface is a direct PDF file (`public/resume.pdf` → `/resume.pdf`), not a web-rendered résumé. The web page is a minimal landing surface with a download link. No résumé content is authored or rendered in site HTML. This is a deliberate deviation from the vision's "rendered web page from one source" framing, authorized by the project planner.

### 4.2 Zero Client-Side JavaScript
- Astro "zero-JS by default" — static HTML output. No client-side framework runtime.
- React islands available *later* where interactivity earns it; **none in v1**.

### 4.3 No Backend, No Database, No CMS, No Auth
- No contact form, no exposed email, no `mailto:` link.
- GitHub + LinkedIn are the sole contact surface in v1.

### 4.4 No Custom Domain in v1
- Deploy on free-tier subdomain (Cloudflare Pages or Vercel).

### 4.5 No Analytics / Tracking
- Zero-tracking default. Any later analytics is an explicit, privacy-conscious choice.

### 4.6 Extensibility Promise (Architectural)
- Future sections (Projects, Blog, Now, Uses) must drop in as **"a typed content file plus one registration entry"** without touching core navigation, layout, or sitemap code.
- Registry coverage is **capped** at exactly those four known future sections.

### 4.7 Typed Content Model + Structured Data
- Astro content collections / TypeScript.
- Self-hosted subset fonts (no third-party font CDN).
- Structured data: Person/ProfilePage JSON-LD + sitemap.

---

## 5. Functional Requirements — Per Surface

### 5.1 Home (Scan Page)

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| HOME-1 | Hero section with name, role-in-domain, and primary stack — above the fold | MUST | Left-aligned, real selectable text (no image/CSS text) |
| HOME-2 | Condensed proof line (years of experience, kind of work) | MUST | Below hero, concise |
| HOME-3 | Links to GitHub, LinkedIn, Résumé page, and About page | MUST | Prominent, no hunting |
| HOME-4 | Zero animations that delay content rendering | MUST | Content-first, no stock photos |
| HOME-5 | Pixel-perfect layout on phones (375px–430px viewport) | MUST | Primary target: mobile |
| HOME-6 | Structured data: Person + ProfilePage JSON-LD | MUST | Enables AI assistants and search engines to parse identity |
| HOME-7 | Sitemap includes Home page | MUST | Standard sitemap.xml |

### 5.2 Résumé Page + PDF

> **Design note:** Per OQ-1 resolution, the résumé is a statically-committed PDF — not a build-generated artifact. The web page is a landing surface; no résumé content is authored in the site's content model.

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| RES-1 | Résumé landing page: title, brief context, and a prominent "Download résumé (PDF)" button linking to `/resume.pdf` | MUST | Minimal page — no rendered résumé content in HTML |
| RES-2 | PDF served from stable, linkable path `/resume.pdf` (committed in `public/` directory) | MUST | Deploys with site on git push |
| RES-3 | PDF is text-extractable (ATS-friendly) — owner's responsibility to supply a non-image-scan PDF | MUST | Verified once at content-add time, not a build-time guarantee |
| RES-4 | Landing page is mobile-responsive with one obvious download action | MUST | Touch target ≥ 44px; no hunting for the download link |
| RES-5 | PDF served with cache headers that allow prompt updates after push | SHOULD | Cloudflare Pages/Vercel default caching is acceptable |

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
| REG-6 | Adding a new section = (a) write a typed content file + (b) add one registry entry. Zero changes to nav/layout/sitemap code. | MUST | This is the extensibility promise |
| REG-7 | Registry coverage capped at four future sections: Projects, Blog, Now, Uses | MUST | No arbitrary section support |

### 5.5 Structured Data + SEO

> **SEO context (OQ-3 resolved):** The owner's name is common online. Winning exact-name search ranking on a free subdomain is unlikely. Realistic SEO wins: (a) rich parsing by search engines and AI assistants when the page is found, (b) non-name query discoverability, (c) being the authoritative entity linkable from other profiles. The deferred custom domain is the single largest future SEO lever (out of scope v1).

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| SEO-1 | Person JSON-LD on Home page (name, jobTitle, url, sameAs for GitHub/LinkedIn) | MUST | Enables AI assistants and search engines to parse identity |
| SEO-2 | ProfilePage JSON-LD on Résumé page | MUST | Promoted from SHOULD — name-commonness makes structured data critical |
| SEO-3 | `sitemap.xml` generated at build time, includes all pages | MUST | — |
| SEO-4 | `robots.txt` allows crawling of all pages **and explicitly permits AI-assistant crawlers** (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot) plus a `Sitemap:` line | MUST | Researched 2026: blanket disallows silently block AI visibility; allow AI bots explicitly |
| SEO-5 | Self-hosted subset fonts — no third-party font CDN | MUST | No Google Fonts, no external requests |
| SEO-6 | Descriptive `<title>` tag on every page (site name pattern, e.g., "Matt O'Connell — {section}") | MUST | — |
| SEO-7 | Meta description on every page (≤ 160 chars, unique per page) | MUST | — |
| SEO-8 | Basic Open Graph tags (og:title, og:description, og:type) on every page | MUST | — |
| SEO-9 | Semantic HTML landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`) on every page | MUST | Supports accessibility and crawler parsing |
| SEO-10 | All pages crawlable and linkable — no orphan URLs | MUST | Every page reachable from nav or sitemap |
| SEO-11 | Self-referencing absolute canonical URL on every page; exactly one canonical host | MUST | Researched 2026: Cloudflare serves the same content on multiple hosts; duplicate-host indexing is a real bug |
| SEO-12 | Non-canonical hosts (Cloudflare deployment/preview URLs) served with `X-Robots-Tag: noindex` — not `robots.txt` Disallow (must stay crawlable to be deindexed) | MUST | Prevents the Cloudflare "duplicate site outranks real site" failure mode |

### 5.6 Build & Deploy

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| DEP-1 | Deploy to **Cloudflare Pages** free tier (platform decided by research) | MUST | Researched 2026: unlimited bandwidth/requests, no commercial restriction, `_headers` file for cache control. (Vercel Hobby: personal/non-commercial only, metered bandwidth.) Free subdomain, no custom domain |
| DEP-2 | Deploy triggered on git push (CI/CD) | MUST | — |
| DEP-3 | Build output is static HTML/CSS/images/PDF only | MUST | Zero-JS output; PDF is a static file, not build-generated |
| DEP-4 | Build time < 60 seconds on representative content | SHOULD | — |
| DEP-5 | Subdomain alias preference: **`mattoconn.pages.dev`** (Cloudflare Pages) | MUST | Verify availability at deploy time |
| DEP-6 | Edit workflow: edit markdown → commit → push → auto-deploy in minutes | MUST | No CMS, no backend |
| DEP-7 | `/resume.pdf` served with `Cache-Control: public, max-age=60, must-revalidate` (Cloudflare `_headers` file) | MUST | Stable path + short TTL = updates propagate within ~1 min of deploy |

---

## 6. Non-Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| NF-1 | Full page load (HTML + CSS + fonts + images) < 2 seconds on mobile (3G/4G) | MUST | Primary performance bar |
| NF-2 | Mobile-perfect: no horizontal scroll, no touch targets < 44px, readable without pinch-zoom | MUST | 375px minimum viewport |
| NF-3 | Accessibility baseline: semantic HTML, sufficient color contrast (WCAG AA), keyboard-navigable, alt text on any images | MUST | — |
| NF-4 | Zero third-party requests on page load (no font CDN, no analytics, no tracking pixels) | MUST | Self-contained static assets |
| NF-5 | No client-side JavaScript shipped to browser | MUST | — |
| NF-6 | No server-side runtime required | MUST | Pure static output |

---

## 7. Out of Scope (v1)

> Mirrors vision §9, plus additional road-not-taken items.

| Item | Why deferred |
|---|---|
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
| **Résumé download ≤ 1 click** | From the résumé landing page, PDF download reachable in one click/tap | Hiring Manager | Manual inspection on mobile |
| **ATS-ready PDF** | Supplied PDF is text-extractable (verified once when PDF is added to repo) | Hiring Manager | Upload to ATS tool (e.g., Jobscan) at content-add time |
| **About page memorability** | Peer describes the owner as a person (not just a professional) after reading | Curious Peer | Informal test: give URL, ask "what do you remember?" |
| **Extensibility verified** | Adding a new section (e.g., "Now") requires exactly 2 file changes: content file + registry entry. Zero changes to nav/layout/sitemap code. | Engineering quality | Manual test: add a stub section, confirm it appears in nav and sitemap without touching core files |

---

## 9. Technical Architecture Summary

| Aspect | Decision | Rationale |
|---|---|---|
| Framework | Astro 7.x + TypeScript | Content-first, zero-JS by default, Rust compiler, best mobile load benchmarks in 2026. Researched: legacy "content collections" removed in Astro 6; Content Layer API is the current API |
| Content model | Astro **Content Layer API** (`src/content.config.ts`, glob loader + Zod-typed schema) | Enables typed section registry; compiler-checked |
| Styling | Scoped CSS / Tailwind (TBD) | No client-side JS; CSS-only |
| Fonts | Self-hosted subset (WOFF2) | No third-party CDN; performance + privacy |
| PDF handling | Static artifact — owner-provided PDF committed to `public/resume.pdf` | No build-time generation; zero tooling complexity; owner controls content |
| Hosting | **Cloudflare Pages** free tier | `mattoconn.pages.dev`; git-push deploy; unlimited bandwidth/requests; `_headers` for cache policy |
| Structured data | Person + ProfilePage JSON-LD (inline in HTML) | Machine-readable; sitemap.xml |
| Future interactivity | React islands (Astro) — available when earned | Zero islands in v1 |

---

## 10. User Stories

### Home Page
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-1 | As a scanning recruiter, I want to see the engineer's name, role, domain, and primary stack above the fold so I can assess fit in 6 seconds | P0 | Name, role, domain, stack visible without scrolling on 375px mobile viewport; real text, not image |
| US-2 | As a scanning recruiter, I want to find GitHub and LinkedIn links on the Home page so I don't have to hunt for contact paths | P0 | Both links visible on Home page (above fold or within one scroll) |
| US-3 | As a scanning recruiter, I want the page to load in under 2 seconds on mobile so I don't bounce | P0 | Full render < 2s on 3G simulation; verified with Lighthouse |
| US-4 | As a curious peer, I want to navigate to the Résumé page and About page from the Home page | P0 | Both links present in navigation or hero section |

### Résumé Page + PDF
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-5 | As a hiring manager, I want to reach the résumé page and download the PDF in one click so I can evaluate depth without friction | P0 | Landing page renders cleanly on mobile; prominent download button links to `/resume.pdf` |
| US-6 | As a hiring manager, I want the PDF to be text-extractable so ATS systems can parse it | P0 | PDF is not an image scan; text extraction verified at content-add time |
| US-7 | As the site owner, I want the PDF to update promptly after I push a new version so visitors always see the latest résumé | P1 | PDF served with reasonable cache headers; new version live within one deploy cycle |

### About Page
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-8 | As a curious peer, I want to read a personal, first-person About page so I remember the human behind the professional | P0 | 2–4 paragraphs, genuine hobby threads, warm tone, not a CV recital |

### Section Registry
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-9 | As a developer, I want to add a new section (e.g., "Now") by writing a content file + adding one registry entry, without touching nav/layout/sitemap code | P0 | Manual test: add stub "Now" section → appears in nav and sitemap; zero changes to core files |
| US-10 | As a developer, I want the navigation to derive from the registry so that nav always matches published sections | P0 | Nav links are generated from registry; no hardcoded links |
| US-11 | As a developer, I want the sitemap to include all registered sections automatically | P0 | `sitemap.xml` includes every registered section URL |

### Build & Deploy
| ID | Story | Priority | Acceptance Criteria |
|---|---|---|---|
| US-12 | As the site owner, I want to deploy by pushing to git so there is no manual deploy step | P0 | Git push → auto-deploy in < 5 minutes |
| US-13 | As the site owner, I want to edit content in markdown and see it live after push | P0 | Edit .md → commit → push → deployed content updated |
| US-14 | As the site owner, I want the site on a free subdomain so I incur zero cost in v1 | P1 | Site accessible at platform-provided URL (e.g., `*.pages.dev` or `*.vercel.app`) |

---

## 11. Resolved Decisions

> All six open questions from v1.0 have been resolved by the project planner / owner. This section replaces the Open Questions table.

| # | Decision | Consequence |
|---|---|---|
| **OQ-1** | **Résumé sourcing — static bundling, direct PDF link.** The owner has a current résumé PDF. The entire résumé surface is a direct file link to `/resume.pdf` (committed in `public/`). No résumé content is duplicated in site HTML. Remote sourcing (Google Drive/CDN) rejected — violates NF-4 (zero third-party requests) and adds URL-churn/rate-limit risk. | Section 5.2 rewritten: landing page with download button only. RES-1 (web-rendered résumé) and RES-2 (build-time generation) deleted. DEP-5 (PDF generation) removed from build pipeline. §4.1 updated with decision note. Success metrics updated. |
| **OQ-2** | **First case-study project — parrotlet.** The first Projects-section case study (v2) will be **parrotlet** (small scope, finishable quickly). Requires a public repo + working demo before the case study is written. Non-blocking for v1. | Recorded in §11.1 V2 Backlog below. No v1 requirements affected. |
| **OQ-3** | **Name commonness / SEO — name IS common, SEO is a first-class priority.** The owner's name is common online; winning exact-name search on a free subdomain is unlikely. SEO is still a priority — realistic wins are rich parsing when found, non-name queries, and being the authoritative entity linkable from other profiles. Custom domain is the single largest future SEO lever (deferred v1). | SEO-2 (ProfilePage JSON-LD) promoted to MUST. New MUST requirements added: `<title>` policy, meta descriptions, Open Graph tags, semantic HTML landmarks, no orphan URLs (SEO-6 through SEO-10). §5.5 includes SEO context note. |
| **OQ-4** | **Résumé detail level — out of scope for the site.** The résumé's internal content/detail level is entirely the owner's concern and lives in the provided PDF. Nothing to author in the site. | No site requirements affected. RES-3 places ATS-verification responsibility on the supplied file, not the build. |
| **OQ-5** | **Staleness policy — not a concern.** Owner updates whenever they have updates; no forced cadence, no date-stamping, no "90-day" rule. | "Stale ≠ abandoned" metric removed from §8. No date-stamp requirements added. |
| **OQ-6** | **Subdomain alias — `mattoconn`.** Desired subdomain identity is `mattoconn`. Hosting research (2026) recommends **Cloudflare Pages**: unlimited bandwidth/requests, no commercial restriction, `_headers` for cache control; Vercel Hobby is personal/non-commercial only with metered bandwidth. | DEP-1/DEP-5 encode Cloudflare Pages (`mattoconn.pages.dev`, availability checked at deploy). §9 hosting row updated. |

### 11.1 V2 Backlog (non-blocking for v1)

| Item | Status | Notes |
|---|---|---|
| First case-study project: **parrotlet** | Blocked on: public repo + working demo | Small scope; can be finished quickly when owner is ready. Highest-value v2 addition. |
| Projects showcase section | Blocked on: parrotlet case study content | Registry supports it; section registration is a 2-file change per extensibility promise. |
| Custom domain | Deferred | Single largest future SEO lever. Cheap, consciously later. |
| Now section / update cadence | Deferred | Owner may add a dated "Now" page in v2 if update rhythm emerges organically. |

---

## 12. Revision History

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-09-18 | PM (AI SDLC) | Initial PRD from vision doc |
| 1.1 | 2026-09-21 | PM (AI SDLC) | Resolved OQ-1–OQ-6: résumé → static PDF link, parrotlet as first case study, SEO strengthened, staleness dropped, subdomain `mattoconn` |
| 1.2 | 2026-09-21 | Project Planner | Folded technical research into PRD: Cloudflare Pages decided (DEP-1), AI-crawler robots policy (SEO-4), canonical + noindex duplicate-host policy (SEO-11/12), PDF cache headers (DEP-7), Astro 7 Content Layer API nomenclature (§9) |

---

*This PRD is a planning artifact for the AI SDLC execution pipeline. It references [vision-personal-website.md](../vision/vision-personal-website.md) as the upstream source of truth.*

# Personal Website (v1: Professional Identity Hub)

> **Project:** `initial-site`. This directory holds the planning artifacts for *initializing the
> site*: the three core surfaces, the Section Registry, and the deploy that puts a credible, current
> professional presence online. It is the **first** project under `projects/`, not the whole site.
> Everything listed in §9 is deliberately excluded here and becomes its **own project directory**
> with its own vision doc, plan, and tickets — not a later phase of this one.

## 1. Elevator Pitch

A personal website is the only web property an engineer fully owns — and most either read like résumé templates, rot from neglect, or stall because the projects behind them never get built. This site is a fast, mobile-perfect, machine-readable professional identity hub: a six-second-scan hero (name, role, domain, stack) and a human About page that carries the judgment signal — built on an architecture where future sections (Projects, Blog, "Now") drop in as content, not as core code. The work history itself lives where it already is trusted and is kept current by someone else: LinkedIn and GitHub, one click from the hero. This site ships deliberately small so the content that makes it matter — real projects with case studies — gets built next, instead of being indefinitely postponed.

## 2. Problem

For a professional software engineer (6+ years) with serious career presence but no active job search:

- **No owned surface.** LinkedIn is rented space with a constrained, noisy layout; GitHub shows raw output without context or judgment.
- **Name searches land on noise.** Someone searching the owner's name finds social profiles and scattered listings — nothing that reliably says, in six seconds, what they do and how well they think.
- **Portfolios rot or stall.** The two classic outcomes: (a) "build the site first" becomes procrastination that delays the real evidence-gathering, and (b) once-polished sites go stale — and "stale = abandoned" is an explicit recruiter heuristic.
- **Template soup.** Portfolio SaaS and themes made "having a site" common, so having a site no longer signals anything; doing it competently does.

V1 cannot solve the "no projects yet" hole — that is a content problem, not a site problem. So v1 solves the presence half: a credible, current, parseable professional surface that is architecturally ready for the evidence when it exists.

## 3. Target Users

1. **The scanning recruiter** — 30 portfolios an afternoon, ~6 seconds each. Success: instantly reads name, role, domain, and stack; finds GitHub/LinkedIn without hunting; page stays open because it loads fast and is mobile-clean.
2. **The senior engineer / hiring manager** — checks depth on anyone promising. Success: reaches a clear judgment signal in one click and a maintained work history in the next — the About page shows how the owner thinks and speaks, LinkedIn carries the dated role-and-impact history, GitHub carries the output. Tone and architecture signal judgment before the first interview. *(This persona is served by routing, not by re-publishing a résumé on the site — see §9.)*
3. **The curious peer or new acquaintance** — the "personal" context. Success: the About page makes the human memorable (hobby threads, a bit of story) rather than a third-person CV recital.

## 4. Value Proposition

Every alternative is rented, generic, or shallow: LinkedIn constrains layout and fills the page with noise; GitHub lists repositories without reasons; portfolio SaaS hands you a template shared with hundreds of other candidates. This site is *owned, opinionated, and honest*. It is static HTML that loads in well under two seconds on a phone; it tells the scanner the one-line story instantly; it routes the reader to the surfaces that hold the depth rather than duplicating them badly; and — the quiet differentiator — it is itself built with visible engineering taste (a typed content model, zero unnecessary JavaScript, structured data for search engines and AI assistants). It does not overclaim what it cannot prove: no projects yet means no fake project grid, and no résumé means no résumé page pretending to be one. The architecture *is* the pitch — when the first case study lands, it slots in as content, not as a redesign.

## 5. Competitive Landscape

- **LinkedIn profile** — near-mandatory and excellent as a network graph and as a maintained work history, but constrained layout, promotional noise, and never "yours." The site complements it, it does not replace it: LinkedIn is where the dated role history lives, the site is where the judgment is visible.
- **GitHub profile + README / pinned repos** — shows output without judgment or narrative; an undifferentiated list. The site adds curation and context. *Needs deeper validation: how strong a signal a well-curated GitHub profile alone sends in 2026 — recent guides disagree.*
- **Portfolio SaaS (Read.cv, Path.cv, ShowProof-style platforms)** — fastest path to a live page and machine-readable by default, but template-identical across candidates and subscription-based. *Nice-to-have validation: current pricing/positioning of the leaders before ruling them out for a later refresh.*
- **Cut-and-paste portfolio themes (Astro/Next templates)** — quick start, but recruiters report seeing the same templates hundreds of times, and customization depth is usually shallow.
- **Framer/Webflow designer sites** — visually rich but rarely signal engineering judgment, and content is locked into proprietary builders.
- **The road not taken: custom Rust backend (Axum)** — would be fun and on-brand, but a server-rendered backend for static content is ops burden with zero visitor benefit. Explicitly rejected in v1; revisit only if a genuinely dynamic feature ever earns it.

**Gap exploited:** an engineer who owns a fast, structured, extensible presence *and* treats the site itself as the first demonstration of how they reason about systems — while honestly deferring the project evidence and deferring the résumé to the surface that already maintains it.

## 6. High-Level Solution

A small static site with three surfaces in v1:

- **Home (the scan).** Hero with name, role-in-domain, and primary stack, above the fold, left-aligned, in real selectable text. A condensed proof line (experience, kind of work). Links to GitHub, LinkedIn, and About. Zero animations that delay content, zero stock photos. Pixel-perfect on phones.
- **About (the judgment and the person).** Two to four short first-person paragraphs plus genuine hobby threads — enough to show how the owner thinks and to make a peer remember the human, not so much that it dilutes the professional impression. This is where the depth signal is authored, because a curated voice says more than a re-published document.
- **Links only, everywhere.** GitHub and LinkedIn as the sole contact surface in v1 — no exposed email, no form, and no résumé hosted on the site. (If a future search makes email valuable, add it as a cloaked address or form; never a raw `mailto:`, which research shows gets scraped into spam lists within days.)

**The architectural promise:** every future section — Projects, Blog, Now, Uses — is a typed content file plus one registration entry. Navigation, layout shells, and sitemap derive from that registry, so adding a section never touches core structure. Authoring a project means writing a case study, not wiring UI.

**The update loop:** edit markdown → commit → push → auto-deploy in minutes. No CMS, no backend, no bill.

**The honest framing:** v1 is an identity hub, not a portfolio. Its conversion goal is *remembering and routing* — not hiring, at this phase.

## 7. Business-Level Technical Architecture

- **Platform:** a static-site generator with typed content — **Astro + TypeScript**, zero-JS by default, with React islands available later where interactivity truly earns them (none in v1). Rationale: 2026 benchmarks and reviews consistently put Astro ahead of Next.js for content-first sites on mobile load time, bundle size, and build time, and its content collections provide the typed frontmatter the extensible section model needs. *(Next.js rejected: ships the React runtime + client router on pages that need neither. Rust/Axum rejected: static content does not justify a paid, always-on server.)*
- **Major components (plain language):**
  1. Home / identity page (hero, proof line, links).
  2. About page (personal, first-person).
  3. **Section registry** — the one real "system": a typed content schema plus a registration list; nav, layout shells, and sitemap derive from it. This is the mechanism behind the extensibility promise. Coverage is deliberately capped at the four known future sections (Projects, Blog, Now, Uses).
  4. Structured data (Person JSON-LD) plus sitemap, so name searches can find and parse the page; fast, crawlable static HTML as the default.
   - *(Optional, deferred: a build-time GitHub activity fetch to keep a contribution pulse current without any server.)*
- **Hosting / deploy:** **Cloudflare Pages or Vercel** free tier on the default subdomain for now; deploy on git push. Custom domain deferred — cheap, consciously later.
- **Build vs buy:** hosting = use the platform; fonts = self-hosted subset (no third-party font CDN); no CMS; no analytics in v1 (zero-tracking default; a later analytics decision would be an explicit, privacy-conscious choice).
- **Explicit non-goals:** no database, no backend, no auth, no CMS, no client-side framework runtime, no contact form, no custom domain, no résumé page or hosted PDF, no Projects/Blog sections in v1, no heavy images or animations.

## 8. Risks & Open Questions

- **Thin-content risk (top).** With no projects, no writing, and no résumé on the site, credibility rests almost entirely on design quality, the About page's voice, and whatever the linked GitHub and LinkedIn surfaces show. This is the weakest v1 has ever been on this axis, and the mitigation is correspondingly soft: the About page must be genuinely good writing, and the hero must route decisively to the two surfaces that carry the depth. *Mitigation:* treat the About copy as a first-class deliverable, not filler, and direct the owner's next engineering hours at producing the first anchor case study. **Q:** is a site with no résumé still worth launching for a recruiter who never clicks through — or does the hero need a stronger one-line proof of depth (e.g., a single quantified outcome) to compensate?
- **Staleness risk.** Presence-only sites rot, and stale reads as abandoned. **Q:** what update policy is realistic — a "touched within 90 days" rule, a dated Now section added later, or a calendar reminder habit?
- **Procrastination risk.** The site can consume weeks and still not be a portfolio. *Mitigation:* v1 is hard-capped (two pages, no domain, no forms, no résumé pipeline) and should ship in days.
- **Over-engineering the extensibility promise.** "Any arbitrary section without core changes" is a slippery slope toward building a mini-CMS. *Mitigation:* the registry only covers the four known future sections; anything beyond is out of scope and gets deferred.
- **SEO assumption.** The vision assumes name-search ranking is achievable with structured data + static HTML. If the name is common or already owned by someone else online, the page may never rank — flipping the site's role from *discovery* to *address book for people who already know you*, which changes tone and copy. **Q:** how common is the owner's name online? (Quick test: search it.)
- **Subdomain permanence.** Launching on a free subdomain means a later rename plus redirects — small SEO disruption, acceptable while presence is low-urgency; revisit before any active search.
- **"Links only" contact.** Some recruiters expect an email path. Fine at presence stage; revisit when search urgency rises (cloaked email or form then — never raw `mailto:`).
- **Duplicating the résumé badly later.** With no résumé surface, there is a real chance a future, higher-urgency phase reinstates one badly (a thin landing page, or a stale PDF) to "complete" the site. *Mitigation:* if a résumé ever returns it is a **separate project** with its own decision about hosting, freshness, and staleness signalling — not a v1 add-on.

## 9. Out of Scope (for this project)

Each item below is **not a later phase of this project** — it is a separate project with its own
directory under `projects/`, its own vision doc, and its own plan. `initial-site` is finished when
the initial site is live with real content; the site's growth after that is tracked as new projects.

- Résumé page, downloadable PDF, or any hosted copy of the résumé — **owner decision (2026-09-26)**: the résumé is not published on this site. The maintained work history lives on LinkedIn; the hero links there. Revisit only as its own project, and only if search urgency ever justifies it.
- Projects showcase section and case studies — the first follow-on project; blocked on a finished case study.
- Blog / technical writing.
- Contact form or exposed email — revisit when search urgency rises.
- Custom domain and branding polish around it.
- CMS or editorial workflow beyond markdown + git.
- Analytics, tracking, or community features.
- Anything requiring client-side JavaScript, a database, or a server — a hard constraint, not a deferral.

## 10. Next Step

Hand off to `project-planner` with this file (`projects/initial-site/vision/vision.md`) to turn it into an executable plan, with the scope cap and the extensibility promise encoded as hard requirements. Each §9 item is a **new** project: start it with `inception` against a fresh `projects/<name>/` directory, not by reopening this one.

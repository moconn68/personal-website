# Master Plan: Personal Website — v1 Professional Identity Hub

## 1. Header

| Artifact | Path |
|---|---|
| Vision | [`docs/vision/vision-personal-website.md`](../vision/vision-personal-website.md) |
| PRD (v1.3) | [`docs/PRDs/PRD-personal-website.md`](../PRDs/PRD-personal-website.md) |
| Tickets (Sole tasking source — T-1 to T-24) | [`docs/tickets/tickets-personal-website.md`](../tickets/tickets-personal-website.md) |
| Tech Design | [`docs/designs/tech-design-personal-website.md`](../designs/tech-design-personal-website.md) |
| UI Spec | [`docs/designs/ui-design-personal-website.md`](../designs/ui-design-personal-website.md) |
| Plan (this file — reference + completion log only) | `docs/plans/plan-personal-website.md` |

**Tech stack:** Astro `^7` (Content Layer API + glob loader, `npm create astro@latest -- --template minimal --no-git`), TypeScript strict, scoped CSS (no Tailwind), IBM Plex Sans (OFL) subset to WOFF2, `@astrojs/sitemap`, Node toolchain, deployed to Cloudflare Pages at `mattoconn.pages.dev` (availability checked at deploy; no custom domain in v1). Static zero-JS output with JSON-LD data blocks exempt from the zero-JS scanner.

**How to execute:** prompt the `orchestrator` with **"tell me the next unit of work and implement it"** at any time. It picks the next available unchecked ticket in `docs/tickets/tickets-personal-website.md` and runs the build-review-QA loop for that item, appending each completion to the log in §5. The checkbox state in the tickets file **is** tasking state — this plan file is background reference only and holds no checkboxes.

## 2. Design Summary

**Architecture.** The **Section Registry** is the keystone: a single Astro content collection (`src/content.config.ts`, Zod schema) plus two config modules (`src/config/sections.ts`, `src/config/templates.ts`). Navigation, page routes, layout shells, sitemap expectations, and SEO titles all derive from it. A single optional catch-all route (`src/pages/[...slug].astro`) generates one path per registered section via `getStaticPaths()` and dispatches to template components (`HOME / RESUME / ABOUT` ship in v1) through `import.meta.glob` keyed on filename. A registered section without its template component **fails the build** (loud, never a silent 404); unknown URLs hit a fixed `src/pages/404.astro` (there is no error-template dispatch). New sections drop in as two files — a self-registering content file (frontmatter `slug`/`order`/`navLabel`/`template`) + a template component — with zero nav/layout/sitemap/schema edits (proven by T-22's stub-Now test).

**Key decisions (normative, per tech design — devs must not re-decide).**

- **Platform:** Cloudflare Pages (unlimited bandwidth, no commercial restriction — research-verified). Vercel rejected. Production host `mattoconn.pages.dev` is the single canonical host; `CF_PAGES_URL` (per-build preview host) is never used as the site URL.
- **Site URL:** `src/config/site.ts` `SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev'` — single source for canonical, sitemap, JSON-LD, and `_headers`. Preview/deploy builds get `X-Robots-Tag: noindex` via `_headers` (host-based, `CF_PAGES_BRANCH !== 'main'`), never via a changed canonical.
- **Zero third-party / zero client JS:** no font CDNs (self-hosted subset WOFF2), no external requests anywhere; no `<script>` output except JSON-LD data blocks (`application/ld+json`). A verification script (`scripts/verify-static.mjs`, `npm run verify`) enforces this in CI.
- **Structured data:** Person JSON-LD on Home (body, `is:inline`), ProfilePage JSON-LD on Résumé — both from the single `src/config/person.ts` facts module.
- **Résumé:** static `public/resume.pdf` (owner-committed, ATS text-based), served with `Cache-Control: public, max-age=60, must-revalidate`; the `/resume` page is a landing surface only — no résumé content in HTML (PRD §4.1 OQ-1).
- **Copy & identity facts:** never invented by devs. T-23 (owner copy) and T-24 (owner PDF) are **human-blocked**; everything rendering owner facts stays `HUMAN COPY` placeholders until then.
- **Aesthetics:** IBM Plex Sans 400/600 (OFL), fluid type with a 375px floor, scoped CSS + one `global.css`, WCAG AA+ palette. Colors/type/space tokens are fully specified in the UI spec (§2) — identical in both design docs.

**Milestones** — see §4 (explicit ID lists; no ranges).

**Risks.**

1. **DEP-5 subdomain availability** — `mattoconn.pages.dev` must exist at deploy time (T-19). If unavailable: **stop and escalate to the planner**; never silently pick another name (canonical/host assumptions cascade through T-4/T-15/T-16/T-18).
2. **Human-blocked closure** — T-23/T-24 cannot be completed by an agent; v1 launch (MS-7) waits on the owner. Everything before MS-7 is fully agent-completable.
3. **Astro 7.x is current-gen (Rust compiler)** — a moving target; the zero-JS/static-output contract is asserted from T-1 onward and enforced by the T-20 CI gate so regressions surface early (dist assertions, not assumptions).
4. **Verifier-at-rank discipline** — the tickets were rewritten so every verification command runs against output that exists at that ticket's rank. The orchestrator must **not** reorder or add dist-output assertions to early tickets; if a verifier looks un-runnable, stop and return to the planner (do not improvise).
5. **Skills catalog gaps** — `astro`, `css`, `a11y`, `seo`, `json-ld`, `cloudflare-pages`, `font-subsetting` have no installed skill (marked `[gap]` in tech design §13); `typescript-best-practices` is available and should be loaded for any `.ts`/`.tsx` work. Devs must follow tech design §/§-pointers per ticket over generic assumptions.
6. **T-22 stub must be reverted** — the extensibility proof lands `now.md` + `NowSection.astro`, verifies, then reverts; `git status` must be clean at completion (the T-22 AC encodes this).

## 3. Dependency Notes

**Keystone spine (must hold):** schema `T-2` → helper `T-3` → site URL `T-4` → nav `T-5` → layout `T-6` → **templates `T-8, T-9, T-10` → route `T-7`**. The route ranks *after* the templates because a missing template is a build failure; templates are standalone components until the route renders them.

- **Templates (T-8/9/10)** depend on the home/about/resume content skeletons (`T-3`) and layout tokens/global.css (`T-6`); they are authored before the route and their verifiers are component-level (rendered-output assertions live at `T-7`).
- **404 (`T-11`)** needs only the layout; fixed page, no error template.
- **SEO head (`T-12`)** needs the route + 404 (asserts canonicals in rendered output), plus `T-4` (url) and `T-7`.
- **JSON-LD:** `T-13` (Home) after `T-8` + `T-4`; `T-14` (Résumé) after `T-9` + `T-13` (reuses the Person module).
- **Sitemap (`T-15`)** — earliest rank where canonical URL output exists; needs route + templates building successfully.
- **Fonts (`T-17`)** — subsetting input is the *built* pages, so it requires all templates (`T-8`, `T-9`, `T-10`, `T-11`) + `global.css` tokens (`T-6`).
- **`_headers` (`T-18`)** needs a full successful build (route + templates + 404) since it introspects/guards the outputs.
- **Deploy (`T-19`)** after `T-18`; creates the Cloudflare project and first production URL.
- **Verify script (`T-20`)** depends on `T-19` because its CI retrofit edits the *deployed* project's build command (`npm run build && npm run verify`) — do not attempt before deploy exists.
- **QA (`T-21`)** runs after templates, 404, SEO, and fonts are all live (`T-8`, `T-9`, `T-10`, `T-11`, `T-12`, `T-17`).
- **Extensibility proof (`T-22`)** after the route + sitemap + chrome; **must revert the stub**.
- **T-23 / T-24 are terminal and human-blocked**; nothing depends on them. Deliver the rest of MS-1..MS-6 without waiting, but never invent the copy or the PDF.

**Milestone ordering:** MS-1 → MS-2 → MS-3 → MS-4 → MS-5 → MS-6 → MS-7. MS-5 contains `T-19` (deploy) before `T-20` (gate retrofit).

## 4. Milestones

- **MS-1: Foundation & Registry** — `[T-1, T-2, T-3, T-4]` (releasable: no, release-auth: manual)
- **MS-2: Shared Chrome** — `[T-5, T-6]` (releasable: no, release-auth: manual)
- **MS-3: Templates, Routing & 404** — `[T-7, T-8, T-9, T-10, T-11]` (releasable: yes, release-auth: manual — first visually-inspectable build; placeholder copy)
- **MS-4: SEO & Structured Data** — `[T-12, T-13, T-14, T-15, T-16]` (releasable: yes, release-auth: manual — SEO-complete skeleton)
- **MS-5: Performance & Deploy** — `[T-17, T-18, T-19, T-20]` (releasable: yes, release-auth: manual — first production deploy with verify gate live; **stop point: confirm subdomain with owner**)
- **MS-6: Quality & Extensibility Proof** — `[T-21, T-22]` (releasable: yes, release-auth: manual)
- **MS-7: Owner Content & v1 Launch** — `[T-23, T-24]` (releasable: yes, release-auth: manual — human-blocked; requires owner-supplied copy + résumé PDF)

## 5. Completion Log

Progress mirror — the `orchestrator` appends one row per completed ticket.

| slug | T-ID | date | commit | notes |
|---|---|---|---|---|
| personal-website | T-1 | 2026-09-22 | 8228acd | Astro ^7.3.3 + TS strict scaffold at repo root; baseline static build ~1.05–1.2s; review Approve; QA Pass (report: docs/qa/qa-report-personal-website-T-1.md) |
| personal-website | T-2 | 2026-09-22 | fb871c4 | Sections content schema: glob loader + Zod (design §4.3), closed template enum in shared `src/config/templates.ts` (7 values: home/resume/about/projects/blog/now/uses; `error` excluded per §4.2); negative tests for bogus/error/description>160 all rejected; review Approve; QA Pass (report: docs/qa/qa-report-personal-website-T-2.md); docs commit 07c9a19 marks T-2 complete |
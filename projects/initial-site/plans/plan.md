# Master Plan: Personal Website — v1 Professional Identity Hub

> **⚠ Revised 2026-09-26 — PRD v1.5 removed the résumé surface.** The site is now **three surfaces**
> (Home, About, Section Registry) with no résumé page, no PDF, and no `ProfilePage` structured data
> (PRD `OQ-7`). The résumé was already built under PRD v1.2, so the work is not "don't build it" but
> **"remove what shipped, and remove it before the first deploy"** — `T-25`..`T-28`. `T-9` and `T-14`
> are retired, `T-24` is cancelled. Everything else in this plan is unchanged, and `T-19` (first deploy)
> now sits *behind* the removal so the résumé is never published even once.

> **⚠ Revised 2026-09-27 - PRD v1.6 platform correction.** Cloudflare Pages is now part of Cloudflare
> Workers, and T-19's first run failed when Workers Builds auto-installed the SSR adapter. The deploy
> target is an **assets-only Worker** at **`https://www.mattoconn.workers.dev`** (PRD OQ-8). `T-19` is
> rewritten; new `T-29` (canonical host) and `T-30` (host-matched noindex) precede it. The stale
> `personal-website` Worker was deleted by the planner. Nothing else in this plan changes.

## 1. Header

| Artifact | Path |
|---|---|
| Project | initial-site (frozen at PRD draft) |
| Vision | [`projects/initial-site/vision/vision.md`](../vision/vision.md) |
| PRD (v1.6) | [`projects/initial-site/PRDs/PRD.md`](../PRDs/PRD.md) |
| Tickets (Sole tasking source — T-1 to T-30) | [`projects/initial-site/tickets/tickets.md`](../tickets/tickets.md) |
| Tech Design | [`projects/initial-site/designs/tech-design.md`](../designs/tech-design.md) |
| UI Spec | [`projects/initial-site/designs/ui-design.md`](../designs/ui-design.md) |
| Plan (this file — reference only) | `projects/initial-site/plans/plan.md` |

**Tech stack:** Astro `^7` (Content Layer API + glob loader, `npm create astro@latest -- --template minimal --no-git`), TypeScript strict, scoped CSS (no Tailwind), IBM Plex Sans (OFL) subset to WOFF2, `@astrojs/sitemap`, Node toolchain, deployed as an assets-only Cloudflare Worker (static assets, Workers Builds) at `www.mattoconn.workers.dev` (v1.6; account subdomain checked at deploy; no custom domain in v1). Static zero-JS output with JSON-LD data blocks exempt from the zero-JS scanner.

**How to execute:** prompt the `orchestrator` with **"tell me the next unit of work and implement it"** at any time. It picks the next available unchecked ticket in `projects/initial-site/tickets/tickets.md` and runs the build-review-QA loop for that item. The checkbox state in the tickets file **is** tasking state — this plan file is background reference only and holds no checkboxes.

## 2. Design Summary

**Project scope.** This plan covers `initial-site` only: the three surfaces, the Section Registry, the removal of the already-built résumé, and the first deploy, ending when the site is live with real content. The capabilities deferred in PRD §7 (Projects section, blog, custom domain, contact form, analytics) are **separate projects** with their own directories under `projects/` — they are not deferred tickets in this plan, and the registry's extensibility is what makes them cheap later, not a commitment to build them here.

**Architecture.** The **Section Registry** is the keystone: a single Astro content collection (`src/content.config.ts`, Zod schema) plus two config modules (`src/config/sections.ts`, `src/config/templates.ts`). Navigation, page routes, layout shells, sitemap expectations, and SEO titles all derive from it. A single optional catch-all route (`src/pages/[...slug].astro`) generates one path per registered section via `getStaticPaths()` and dispatches to template components (**`HOME` / `ABOUT` ship in v1.5**) through `import.meta.glob` keyed on filename. A registered section without its template component **fails the build** (loud, never a silent 404); unknown URLs hit a fixed `src/pages/404.astro` (there is no error-template dispatch). New sections drop in as two files — a self-registering content file (frontmatter `slug`/`order`/`navLabel`/`template`) + a template component — with zero nav/layout/sitemap/schema edits (proven by T-22's stub-Now test).

**[v1.5] The removal is cheap because of this architecture, and that is the point.** Deleting `resume.md` removes its route, nav entry, and sitemap URL with **zero** code edits; the only residue needing a manual sweep is the non-registry surface (Home's link row, the JSON-LD component, the `_headers` PDF rule, the CI asserts, the font-subsetting input list). A design that needed a coordinated change to shrink scope would be a design that quietly grows it back.

**Key decisions (normative, per tech design — devs must not re-decide).**

- **Platform [v1.6]:** Cloudflare Workers static assets, free tier (was Cloudflare Pages, now merged into Workers). Assets-only Worker `www` from a committed `wrangler.jsonc`; `@astrojs/cloudflare` banned (DEP-8). Vercel rejected. `www.mattoconn.workers.dev` is the single canonical host; no Cloudflare-injected host or branch variable is ever read.
- **Site URL [v1.6]:** `astro.config.mjs` `site` (default `https://www.mattoconn.workers.dev`, T-29) is the single source; `src/config/site.ts` re-exports it. Non-canonical hosts (preview/deployment/version URLs) get `X-Robots-Tag: noindex` from a host-matched `_headers` rule written on every build (T-30), never via a changed canonical.
- **Zero third-party / zero client JS:** no font CDNs (self-hosted subset WOFF2), no external requests anywhere; no `<script>` output except JSON-LD data blocks (`application/ld+json`). A verification script (`scripts/verify-static.mjs`, `npm run verify`) enforces this in CI.
- **Structured data:** `Person` JSON-LD on Home (body, `is:inline`) is the **only** node on the site, from the single `src/config/person.ts` facts module. **[v1.5]** `ProfilePage` and its component are deleted (`T-26`); `Person` losing its sibling is why `T-28` explicitly re-asserts that the Person block still renders (`RES-X4`).
- **No résumé surface:** **[v1.5]** deletion, not deactivation — content file, template, JSON-LD component, enum value, PDF, PDF header rule, and the CI presence-asserts are all removed. Reinstating any of them requires a **new PRD version**; a dev must not "helpfully" restore one.
- **Copy & identity facts:** never invented by devs. T-23 (owner copy) is **human-blocked**. **[v1.5]** The two profile URLs are load-bearing rather than decorative (US-15/US-16): with no résumé page, About + GitHub + LinkedIn are the entire depth path. Everything rendering owner facts stays `HUMAN COPY` placeholders until then.
- **Aesthetics:** IBM Plex Sans 400/600 (OFL), fluid type with a 375px floor, scoped CSS + one `global.css`, WCAG AA+ palette. Colors/type/space tokens are fully specified in the UI spec (§2) — identical in both design docs. `.btn-download` is renamed `.btn-primary` (`T-26`) because the résumé's download CTA was its namesake.

**Milestones** — see §4 (explicit ID lists; no ranges).

**Risks.**

1. **DEP-5 subdomain availability** — **[v1.6]** the account workers.dev subdomain must be renamed to `mattoconn` at deploy time (T-19). If unavailable: **stop and escalate to the planner**; never silently pick another name (canonical/host assumptions cascade through T-29/T-30).
2. **Human-blocked closure** — T-23 cannot be completed by an agent, so the **public launch (MS-9)** waits on the owner. Everything through **MS-8 (deploy)** is fully agent-completable: the deploy itself proceeds with `HUMAN COPY` placeholders (risk R3) and is explicitly a staging URL, not a launch.
3. **Astro 7.x is current-gen (Rust compiler)** — a moving target; the zero-JS/static-output contract is asserted from T-1 onward and enforced by the T-20 CI gate so regressions surface early (dist assertions, not assumptions).
4. **Verifier-at-rank discipline** — the tickets were rewritten so every verification command runs against output that exists at that ticket's rank. The orchestrator must **not** reorder or add dist-output assertions to early tickets; if a verifier looks un-runnable, stop and return to the planner (do not improvise).
5. **Skills catalog gaps** — `astro`, `css`, `a11y`, `seo`, `json-ld`, `cloudflare-workers` (v1.6; was `cloudflare-pages`), `font-subsetting` have no installed skill (marked `[gap]` in tech design §13); `typescript-best-practices` is available and should be loaded for any `.ts`/`.tsx` work. Devs must follow tech design §/§-pointers per ticket over generic assumptions.
6. **T-22 stub must be reverted** — the extensibility proof lands `now.md` + `NowSection.astro`, verifies, then reverts; `git status` must be clean at completion (the T-22 AC encodes this).
7. **[v1.5] Partial-removal residue** — the highest-likelihood failure mode of this re-plan is a *clean-looking* removal that leaves one stale reference: a nav string, a canonical, a `sameAs`, a font-subsetting input path, or a `.btn-download` class. Each of those produces a **passing build**, which is exactly why the guard is a **negative** assertion set (`T-27` scans built output for `resume` strings) and a full re-run of the visual checklist (`T-28`), not merely "the build is green."
8. **[v1.5] Accidental restoration** — a dev reading an old ticket body or a historical QA report could conclude the résumé is still wanted. The tombstone/`[SCOPE NOTE]` markers and the `template: 'resume'` schema negative test exist to make that outcome fail loudly. If a ticket's prose seems to contradict the PRD v1.5 tombstones, the PRD wins and the ticket prose is the bug.

## 3. Dependency Notes

**Keystone spine (must hold):** schema `T-2` → helper `T-3` → site URL `T-4` → nav `T-5` → layout `T-6` → **templates `T-8, T-10` → route `T-7`**. The route ranks *after* the templates because a missing template is a build failure; templates are standalone components until the route renders them. **[v1.5]** `T-9` (résumé template) was on this spine and has left it; the spine is unchanged in shape.

- **Templates (T-8/T-10)** depend on the home/about content skeletons (`T-3`) and layout tokens/global.css (`T-6`); they are authored before the route and their verifiers are component-level (rendered-output assertions live at `T-7`).
- **404 (`T-11`)** needs only the layout; fixed page, no error template. **[v1.5]** also the last consumer of the renamed `.btn-primary` token (`T-26`).
- **SEO head (`T-12`)** needs the route + 404 (asserts canonicals in rendered output), plus `T-4` (url) and `T-7`.
- **JSON-LD:** `T-13` (Home `Person`) after `T-8` + `T-4`. **[v1.5]** `T-14` (Résumé `ProfilePage`) is retired; nothing replaces it.
- **Sitemap (`T-15`)** — earliest rank where canonical URL output exists; needs route + templates building successfully. **[v1.5]** needs no edit for the removal: the sitemap is a crawl of generated routes, so the résumé URL vanishes with its content file.
- **Fonts (`T-17`)** — subsetting input is the *built* pages, so it requires both templates (`T-8`, `T-10`) + `T-11` + `global.css` tokens (`T-6`).
- **`_headers` (`T-18`)** needs a full successful build (route + templates + 404) since it introspects/guards the outputs. **[v1.5]** the PDF rule is stripped in `T-27`; the preview-`noindex` branch is untouched and must not be refactored. **[v1.6]** superseded: `T-30` replaces branch detection with a host-matched rule, because `CF_PAGES_BRANCH` does not exist on Workers.
- **Removal block (`T-25` → `T-26`/`T-27` → `T-28`)** — a strict internal order, specified normatively in tech design §14. `T-25` must delete the content file and the template **in the same commit** (either alone is a build failure). `T-26` must verify the `Person` JSON-LD block still renders in the same commit (`RES-X4`) — the one step that can silently break surviving functionality. `T-28` must run last; running it earlier would pass against a half-removed site.
- **Deploy (`T-19`) now depends on `T-28`** as well as `T-18`. **[v1.5] This is the change that gives the re-plan its point: the résumé has never been deployed, so there is no production rollback, no redirect, and no stale URL — the removal happens entirely inside the repo before a single visitor could see the site.** **[v1.6]** `T-19` also depends on `T-29` (host) and `T-30` (noindex) and has owner-only dashboard steps. Its former CI-gate retrofit is moot: `npm run build` already chains the verify gate.
- **Verify script (`T-20`) has no deploy dependency.** **[Plan-review correction]** This note previously claimed `T-20` depends on `T-19` "because its CI retrofit edits the deployed project's build command." That was a real ownership defect, not a historical edge — a `- [x]` ticket cannot depend on work that has not happened. The retrofit has been **moved into `T-19`**, which already owns the Cloudflare project and can edit its build command immediately after the first green deploy. `T-20` is therefore a self-contained script ticket and is legitimately `- [x]`. The `npm run verify` gate still ships with `T-27`'s no-résumé asserts already inside it, because `T-27` runs before deploy.
- **QA (`T-21`)** runs after templates, 404, SEO, and fonts are all live (`T-8`, `T-10`, `T-11`, `T-12`, `T-17`). **[v1.5]** `T-28` re-runs the a11y/mobile/Lighthouse sweep on the two-route site, since the link row and nav both lost an item.
- **Extensibility proof (`T-22`)** after the route + sitemap + chrome; **must revert the stub**. **[v1.5]** unaffected by the removal — the stub proves `now` is pre-included in the enum, and the enum's `resume` member going away does not touch that.
- **T-23 is terminal and human-blocked**; nothing depends on it. Deliver MS-1..MS-8 without waiting, but never invent the copy — and do not describe the deploy as "launched". **[v1.5]** `T-24` (owner PDF) is **cancelled** — there is no artifact for it to deliver, so it is no longer a launch blocker.

**Milestone ordering:** MS-1 → MS-2 → MS-3 → MS-4 → MS-5 → MS-6 → **MS-7 (removal)** → MS-8 (deploy) → MS-9 (launch). **[v1.5]** MS-7 is a *new* gate inserted ahead of deploy-era work, and the deploy ticket (`T-19`) now waits on it. MS-8/MS-9 are a **new split** of the old combined `MS-8: Deploy & Launch`; see the note in §4.

## 4. Milestones

- **MS-1: Foundation & Registry** — `[T-1, T-2, T-3, T-4]` (releasable: no, release-auth: manual)
- **MS-2: Shared Chrome** — `[T-5, T-6]` (releasable: no, release-auth: manual)
- **MS-3: Templates, Routing & 404** — `[T-7, T-8, T-10, T-11]` (releasable: yes, release-auth: manual — first visually-inspectable build; placeholder copy; `T-9` retired)
- **MS-4: SEO & Structured Data** — `[T-12, T-13, T-15, T-16]` (releasable: yes, release-auth: manual — SEO-complete skeleton; `T-14` retired)
- **MS-5: Performance & Headers** — `[T-17, T-18]` (releasable: yes, release-auth: manual — pre-deploy build hardening)
- **MS-6: Quality & Extensibility Proof** — `[T-21, T-22]` (releasable: yes, release-auth: manual)
- **MS-7: Résumé Removal (v1.5)** — `[T-25, T-26, T-27, T-28]` (releasable: yes, release-auth: manual — **precondition for the first deploy**; includes the full removal-regression + a11y re-verification)
- **MS-8: Deploy (staging URL)** — `[T-29, T-30, T-19]` (releasable: yes, release-auth: manual — v1.6 platform patches then the first production deploy to `www.mattoconn.workers.dev`; T-23's copy is already in the build)
- **MS-9: Public Launch** — `[T-23]` (releasable: yes, release-auth: manual — **owner-gated**; the site is not announced or shared as finished until this lands and is re-deployed)

> **[Plan-review correction — MS-8/MS-9 split.]** These were one milestone, `MS-8: Deploy & Launch`,
> containing `[T-19, T-20, T-23]`. That conflated two different things and contradicted risk R3 in the
> same file: R3 says the site "fully ships and deploys with clearly-marked placeholders, so the pipeline
> is never blocked upstream," but bundling human-blocked `T-23` into a milestone named "Launch" implied
> the launch waited on the owner, which is exactly the stall R3 exists to prevent. The deploy and the
> public announcement are now separate gates with separate authorization. `T-20` also left this list
> entirely — it is complete and is not deploy-era work; its CI retrofit now lives in `T-19`.

## 5. Completion Log

Appended by the `orchestrator` as it ships each ticket. The `commit` column stores the **T-ID**, not a hash — the log row is committed inside the same commit as that ticket's deliverable, and a commit cannot reference its own hash; resolve hashes with `git log`.

| project | T-ID | date | commit | notes |
|---|---|---|---|---|
| initial-site | | | | |
| initial-site | T-26 | 2026-09-26 | T-26 | Removal chain step 2 of 4. Home link row trimmed to GitHub/LinkedIn/About; `JsonLdProfilePage.astro` deleted; `.btn-download` → `.btn-primary` on the 404; vestigial résumé comments scrubbed from `person.ts`, `Seo.astro`, `404.astro`, `astro.config.mjs`. `RES-X4` guard verified: `Person` JSON-LD still renders, parses, and carries `name`/`jobTitle`/`sameAs`; zero `ProfilePage` in `dist/`. Review Approve, QA Pass (2 attempts). `scripts/**` untouched by design — T-27 owns the PDF cache rule and the résumé asserts, so `npm run verify` has 1 expected violation at this rank. |
| initial-site | T-27 | 2026-09-27 | T-27 | Removal chain step 3 of 4. The "invisible" half: `gen-headers.mjs` loses the `/resume.pdf` `Cache-Control` rule and now writes **no** `_headers` at all on production (removing a stale one if present), leaving the preview `noindex` rule as its only job; the T-18 branch-detection expression is byte-identical. `verify-static.mjs` swaps its two résumé **presence** asserts for **negative** residue asserts (no `dist/resume/`, no `resume.pdf` string, no `ProfilePage` `@type`, no `/resume` nav/link-row href, `_headers` byte-exactly the noindex rule) plus design §11.1's `RES-X4` guard, scanning every non-binary artifact under `dist/**` so a new output format is covered by default. `subset-fonts.mjs` drops the deleted page from its sweep and makes the silent-skip hazard visible in logs. `package.json` unchanged, so T-19's CI wiring needs no edit. Review Changes Requested then **Approve** (2 attempts; 9 findings fixed, 2 declined with reasons), QA **Pass with Caveats** (0 blocking). T-26's expected `npm run verify` violation is now gone — the gate is green on the trimmed two-route site and `rg -i 'resume' dist/` is clean unscoped, so **T-28's strongest check is pre-satisfied**. Two items carried forward: QA **N-1** (duplicated `PROD_BRANCH` in a second file → a T-19 checklist item to confirm the Cloudflare production branch is literally `main`) and `RES-X4`'s fact-group half, which T-28 already owns. |
| initial-site | T-28 | 2026-09-27 | T-28 | Removal chain step 4 of 4 and MS-7 gate. Post-removal regression on the trimmed two-route site: build/check/verify green, registry exactly home + about, nav 2 items with aria-current, sitemap exactly / + /about/, canonical/sitemap/robots byte-identical, /resume/ serves the styled 404 with no redirect, production writes no _headers while preview writes only the noindex rule, `rg -i resume dist/` clean unscoped, Person JSON-LD parses with name/jobTitle/sameAs and zero ProfilePage, closed enum rejects `template: resume` loudly, and the T-22 two-file stub proof re-passes with zero core-file diff then reverts. One comment-only fix in `HomeSection.astro` (F-5 zero-JS wording, proven byte-identical in dist/). Review Changes Requested then **Approve** (2 attempts; blocker was the missing durable T-28 report required by design §14, now persisted as `qa/qa-report-T-28.md`), QA **Pass with Caveats** (perf 100 LCP 1.1s, a11y 100, axe 0 violations; caveats F-1 skip-link 41.6px and F-2 missing favicon, both pre-existing, neither blocking). Unblocks T-19: this report is the deploy evidence that no résumé residue ships. |
| initial-site | T-19 | 2026-09-27 | T-19 | Cloudflare Workers static-assets deployment (final ticket, all 30 tickets now complete). Repo-scope diff (`wrangler.jsonc`, `wrangler` devDep, README) reviewed Approve / QA Pass, then live infra executed: account subdomain renamed to `mattoconn`, first `wrangler deploy` of Worker `www`, Workers Builds connected to GitHub for git-push CI/CD on `main`. First live non-production branch build failed on `wrangler preview` needing an additional empty `previews: {}` block beyond the original tech-design §10.3 spec; fixed and redeployed — second round Review Approve, QA Pass. Live smoke tests all green: `/` and `/about/` 200, `/about` 307→`/about/`, `/nope/`/`/resume.pdf`/`/resume/` 404, canonical never noindexed, non-canonical `*.workers.dev` hosts noindexed, canonical/sitemap/robots byte-identical, no Routes/Custom Domains. Tagged and released as **v1.0.0** (`projects/initial-site/releases/release-1.0.0.md`). |


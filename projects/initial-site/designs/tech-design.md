# Technical Design — Personal Website v1 (Matthew O'Connell)

> **Upstream:** `projects/initial-site/PRDs/PRD.md` (v1.6) · `projects/initial-site/tickets/tickets.md` (T-1..T-30)
> **Status:** Normative for implementation. Where this design and a ticket's *literal acceptance wording* conflict, this document **supersedes** the ticket wording — every such deviation is flagged inline with `[DEVIATION]`.
> **Date:** 2026-09-26 · **Architect:** Software Architect (AI SDLC)  
> **Project:** `initial-site` — designs the site initialization only. The Section Registry's extensibility is a constraint on *this* design (future sections must not require core edits), not a work item; the sections themselves are separate projects.

> ### ⚠ Revision 2026-09-26 — PRD v1.5 removed the résumé surface
>
> This design is re-issued against the **three-surface** site (Home, About, Section Registry) with
> **no résumé page, no résumé PDF, and no `ProfilePage` structured data** (PRD OQ-7). Sections that
> changed are marked **[v1.5]**. Because the résumé was already built and committed under the previous
> revision, this document also specifies the **removal** that tickets `T-25`..`T-28` implement — the
> removal is as much a part of the normative design as the original build was.
>
> - **Enum change (D1, §4.1/§4.2):** `TEMPLATES` drops `'resume'` → `['home','about','projects','blog','now','uses']`.
> - **Deleted files (T-25/T-26):** `src/content/sections/resume.md`, `src/templates/ResumeSection.astro`, `src/components/JsonLdProfilePage.astro`. **`public/` does not exist and is not created** — the Astro scaffold's `public/` was deleted at T-7 (§12.5) and nothing ever replaced it, because the PDF ticket (T-24) was cancelled before it ran.
> - **Script changes (T-27):** `gen-headers.mjs` loses the `/resume.pdf` rule and emits **nothing** on production; `verify-static.mjs` swaps its résumé presence-assert for **negative** residue asserts; `subset-fonts.mjs` drops the deleted page from its sweep.
> - **Token rename (T-26):** `.btn-download` → `.btn-primary` (its only surviving consumer is the 404 "Back to home" link).
> - **Surviving unchanged:** `Person` JSON-LD (T-13) is the site's only structured-data node and is regression-guarded (`RES-X4`); the preview-`noindex` `_headers` mechanism (SEO-12) and the trailing-slash policy (R8) are untouched.

> ### ⚠ Revision 2026-09-27 - PRD v1.6 platform correction (Pages → Workers static assets)
>
> Cloudflare Pages is now part of Workers; T-19 failed when Workers Builds auto-installed the SSR
> adapter. Sections marked **[v1.6]** changed. The whole of §10 is rewritten; read its opening
> table first. In short:
>
> - **Host:** `https://mattoconn.pages.dev` → **`https://www.mattoconn.workers.dev`** (T-29).
> - **Noindex (SEO-12):** `CF_PAGES_BRANCH` detection → a **host-matched** `_headers` rule derived
>   from the canonical host, identical on every build; production now ships `dist/_headers` (T-30).
> - **Deploy:** committed, **assets-only** `wrangler.jsonc` (no `main`, no `@astrojs/cloudflare`)
>   + Workers Builds; `wrangler` becomes a devDependency (T-19, PRD DEP-8).
> - **Unchanged:** everything outside §1, §2, §3, §4.5, §5.4, §9, §10, §11.1, §11.3, §12, §13.

---

## 1. Design Summary

### 1.1 Architecture overview

The **Section Registry is the keystone** of the system. All site structure — page routes, navigation, sitemap URLs, canonical URLs, structured data — derives from one typed content collection plus two pure helpers. Adding a section in v2 means: write a content file, add a template component, and (for out-of-cap templates only) extend one enum const. Zero changes to nav, layout, route, or sitemap code.

```
                 CONTENT                     REGISTRY                        DERIVED SURFACES
┌──────────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────────┐
│ src/content/sections/        │   │ src/content.config.ts     │   │ src/pages/[...slug].astro     │
│   home.md  (order 1)         │──▶│   glob loader + Zod schema │──▶│   getStaticPaths() → routes  │
│   about.md (order 2)         │   │   (closed template enum)   │   │   /   /about/                │
│                              │   │                           │   │        │                      │
│   [no resume.md — v1.5]      │   │ src/config/templates.ts   │   │        ▼  import.meta.glob   │
└──────────────────────────────┘   │   TEMPLATES const (cap)   │   │   src/templates/*Section.astro│
           TEMPLATES, sectionPath ◀─│ src/config/sections.ts    │   └──────────────┬───────────────┘
                                   │   getSections() sorted    │                  │ layout
               SITE_URL ◀───────────│ src/config/site.ts        │   ┌──────────────▼───────────────┐
                                   └───────────────────────────┘   │ src/layouts/BaseLayout.astro  │
                                                                  │  <header>→Nav (registry-derived)│
   NAV (T-5)  ────────────── Nav.astro iterates getSections()      │  <main>  →slot→ <template>     │
   SITEMAP (T-15) ────────── @astrojs/sitemap over registry routes │  <footer>→copyright (home name)│
   CANONICAL (T-12) ──────── absoluteUrl(sectionPath(entry))       └──────────────────────────────┘
   ROBOTS (T-16) ─────────── Sitemap: {SITE_URL}/sitemap-index.xml
   JSON-LD (T-13) ────────── src/config/person.ts (single facts source)

   BUILD: astro build ─▶ dist/ (static) ─▶ node scripts/gen-headers.mjs ─▶ dist/_headers (host-matched noindex, every build)
   DEPLOY: git push ─▶ Workers Builds (main: wrangler deploy) ─▶ assets-only Worker `www` ─▶ https://www.mattoconn.workers.dev
   GATE: npm run verify (zero-JS + zero-third-party + presence asserts + no-résidue asserts)
```

### 1.2 Data flow

1. Author edits a Markdown file under `src/content/sections/`.
2. `glob()` loader (Content Layer API) reads it; Zod validates frontmatter (closed template enum, `description ≤160`, URL fields).
3. `getSections()` (sorted by `order`) is the single registration query. `sectionPath(entry)` is the **single** slug→URL mapping (home → `/`, others → `/{slug}/`).
4. `[...slug].astro` `getStaticPaths()` emits one route per section; `import.meta.glob('../templates/*.astro')` dispatches to `{TemplateName}Section.astro`.
5. `Nav.astro`, `Seo.astro` (canonical), `@astrojs/sitemap`, and `robots.txt.ts` all read the same helpers — so nav, sitemap, and canonicals are byte-consistent by construction.
6. Templates and JSON-LD read shared typed data (`home.md` frontmatter + `src/config/person.ts`). Every personal fact is a marked `HUMAN COPY` placeholder until T-23.

**[v1.5] Deletion is a first-class data-flow operation.** Steps 2–5 are registry-derived, so deleting a
content file removes its route, nav entry, sitemap URL, and canonical in one move with **zero** code
edits — that is `T-25`, and it is the design's proof that the keystone claim is real rather than
aspirational. Only the *non-registry* residue (Home's link row, the JSON-LD component, the header
rule, the CI asserts) needs the separate sweeps in `T-26`/`T-27`.

### 1.3 Deployment topology

**[v1.6]** Rewritten for the Pages → Workers merge (PRD OQ-8); detail in §10.

- **Cloudflare Workers static assets, free tier** (DEP-1). An **assets-only** Worker named `www`: committed `wrangler.jsonc`, `assets.directory = "./dist"`, no `main`, no adapter (DEP-8, NF-6).
- Git-push deploys via **Workers Builds**: production branch `main` → `npx wrangler deploy`; other branches → `npx wrangler preview`. Build command `npm run build` (already runs the verify gate).
- **No build variables.** `PUBLIC_SITE_URL` is set nowhere in Cloudflare; the committed default is the canonical host (R10).
- Non-canonical-host `noindex` via a **host-matched** `_headers` rule, identical on every build (SEO-12, §10.1).
- Host `www.mattoconn.workers.dev` requires the account subdomain `mattoconn`; if unavailable at deploy time → **stop and escalate to planner** (DEP-5, R1). Never rename silently.

### 1.4 Hard constraints (encoded in every section below)

| Constraint | Enforcement |
|---|---|
| Zero client JS shipped | `<script>` only as `application/ld+json` data blocks (exempt per PRD §9/OQ-3); `verify-static.mjs` fails on all else (T-20) |
| No backend / auth / analytics / CMS | Static Astro build only; no islands (NF-5/NF-6) |
| No custom domain | `SITE_URL` default `https://www.mattoconn.workers.dev` only **[v1.6]**; the Worker has no Routes or Custom Domains |
| **Assets-only Worker [v1.6]** | `wrangler.jsonc` has no `main`; `@astrojs/cloudflare` never installed; `verify-static.mjs` already fails on any `.js` in `dist/` or a missing `dist/robots.txt` (DEP-8, T-19) |
| No third-party requests on load | Self-hosted subset fonts; `verify-static.mjs` origin check (NF-4) |
| Typed discipline / Zod at boundary | Zod schema in `content.config.ts`; TypeScript strict; helpers in `src/config/*` (type-system + boundary-discipline) |
| Every personal fact is HUMAN COPY until T-23 | Skeleton files carry literal `HUMAN COPY` markers; `person.ts` jobTitle is a marked constant; devs never invent facts |
| **No résumé artifact anywhere in the build** **[v1.5]** | No `resume` content file / template / enum value, no `ProfilePage` node, no PDF, no PDF header rule; `verify-static.mjs` fails on any residue (`RES-X1`, `RES-X3`, owned by T-25..T-27) |
| Single `SITE_URL` source | `astro.config.mjs` `site` (as shipped; `src/config/site.ts` re-exports it via `import.meta.env.SITE`); Seo, JSON-LD, robots read it; `gen-headers.mjs` and `verify-static.mjs` read the host back from `dist/robots.txt`. **[v1.6]** No Cloudflare-injected variable (`CF_PAGES_*`, `WORKERS_CI_*`) is read anywhere (T-4, T-30) |
| Subdomain never silently changed | T-19 escalate rule |

### 1.5 Resolved decisions (the six deferred items + routing)

| # | Decision (normative) |
|---|---|
| D1 (enum) | **Pre-include** the four capped future templates: `TEMPLATES = ['home','about','projects','blog','now','uses']` **[v1.5: `'resume'` removed — PRD OQ-7]**. See §4.2 for justification. |
| D2 (routing) | Single catch-all `src/pages/[...slug].astro`; home → `/` via `params: { slug: undefined }`. See §5. |
| D3 (styling) | Plain **scoped CSS** + one `global.css` reset/tokens. No Tailwind. See §6. |
| D4 (fonts) | **IBM Plex Sans** (OFL), weights 400/600, `@font-face` with `font-display: swap`, subset via `subset-font` to page-used glyphs. See §7. |
| D5 (404) | `src/pages/404.astro` is a fixed page (NOT a registry section); markup + `noindex` inline; `error` is **not** an enum value. |
| D6 (preview noindex) | ~~Detect via `CF_PAGES_BRANCH` ≠ `main`~~ **[v1.6] Superseded:** a host-matched `_headers` rule derived from the canonical host (`https://:prefix-www.mattoconn.workers.dev/*`), written on every build, no env detection. See §10.1. Still the *only* output of `gen-headers.mjs`. |
| **D8 (platform) [v1.6]** | Cloudflare Workers static assets, assets-only Worker `www`, committed `wrangler.jsonc`, Workers Builds; `@astrojs/cloudflare` is banned. See §10.3. |
| **D7 (no résumé) [v1.5]** | The résumé is not published. Deletion, not deactivation: content file, template, JSON-LD component, enum value, PDF, PDF header rule, and CI presence-asserts all go. `Person` JSON-LD survives. Any reinstatement requires a new PRD version (PRD OQ-7) — a dev must not "helpfully" restore it. |

---

## 2. Tech Stack & Versions

| Concern | Choice | Rationale / ticket |
|---|---|---|
| Framework | **Astro `^7`** (scaffold via `npm create astro@latest -- --template minimal --no-git --yes --install`) | PRD §9; legacy content collections removed in Astro 6 → Content Layer API (R6) |
| Content layer | `defineCollection` from `astro:content` + `glob` loader from `astro/loaders` in a single `src/content.config.ts` (NOT `src/content/config.ts` — subfolder layout is legacy) | T-2; confirmed current API |
| Language | TypeScript **strict** (`tsconfig.json` `extends: "astro/tsconfigs/strict"`) | T-1 |
| Static analysis | `@astrojs/check` + `typescript`; script `"check": "astro check"` | T-1 |
| Integrations | `@astrojs/sitemap` | T-15 |
| Validation | `zod` (imported as `z` from `astro/zod` in content config; also a direct dependency per T-1) | T-2 |
| Fonts | `subset-font` (devDep, pure Node/WASM; **not** Python WeasyPrint, **not** `glyphhanger` — see §7 amendment) + vendored IBM Plex Sans TTFs | T-17 (D4) |
| Node | `node >= 22.12.0` — the floor `package.json` actually declares (Astro 7.3.3's requirement); `.node-version` pins `24.21.0`, which Workers Builds reads. **[v1.6]** Set `NODE_VERSION` only if the build log shows it was ignored | Astro 7 engine requirement |
| Deploy tooling **[v1.6]** | `wrangler` `^4.142.0` devDependency (Worker Previews need ≥ 4.135.0) + committed `wrangler.jsonc`. **Never** `@astrojs/cloudflare` | T-19, §10.3 |
| Output | `dist/`, `build.format: 'directory'` (default), `trailingSlash: 'always'` | §4.4, §9 |
| Package scripts | `dev`, `build`, `preview`, `check`, `verify`, `fonts:subset` (exact block in §10.2) | T-1, T-18, T-20, T-17 |

---

## 3. Repo Layout

Full proposed tree. Every path below is referenced by at least one ticket (mapping proof in §12).

```
personal-website/
├── .env.example                     # T-4 → T-29 (host) → T-30 (drop CF_PAGES_*): PUBLIC_SITE_URL docs only (no real .env committed)
├── .gitignore                       # T-1: node_modules/, dist/, .env*, wrangler junk
├── astro.config.mjs                 # T-1/T-4/T-15 → T-29 [v1.6]: site (default host), trailingSlash, sitemap integration
├── package.json                     # T-1 + T-17/T-18/T-20 scripts; T-19: wrangler devDep [v1.6]
├── wrangler.jsonc                   # T-19 [v1.6]: assets-only Worker `www` (no main), 404-page, auto-trailing-slash
├── package-lock.json                # T-1
├── tsconfig.json                    # T-1: extends astro/tsconfigs/strict
├── scripts/
│   ├── font-src/                    # T-17: vendored IBM Plex Sans TTFs (OFL), subsetting inputs
│   │   ├── IBMPlexSans-Regular.ttf
│   │   └── IBMPlexSans-SemiBold.ttf
│   ├── gen-headers.mjs              # T-18 + T-27 → T-30 [v1.6]: writes dist/_headers (host-matched noindex, every build)
│   ├── noindex-rule.mjs             # T-30 [v1.6]: pure rule + host-pattern matcher shared by gen-headers and verify-static
│   ├── subset-fonts.mjs             # T-17 + T-27: sweeps built HTML for the glyph set
│   └── verify-static.mjs            # T-20 + T-27 → T-30 [v1.6] (rule 4e): zero-JS / zero-third-party / presence / no-résidue / headers gate
└── src/
    ├── content.config.ts            # T-2: sections collection (glob + Zod, closed enum)
    ├── assets/
    │   ├── fonts/                   # T-17: subsetted WOFF2, Astro-fingerprinted
    │   │   ├── ibm-plex-sans-400.woff2
    │   │   └── ibm-plex-sans-600.woff2
    │   └── styles/
    │       └── global.css           # T-6: tokens, reset, typography; T-17: @font-face
    ├── components/
    │   ├── Nav.astro                # T-5: registry-driven nav
    │   ├── Seo.astro                # T-12: title/description/OG/canonical
    │   └── JsonLdPerson.astro       # T-13: Person node (Home) — the ONLY JSON-LD in v1.5
    ├── config/
    │   ├── templates.ts             # T-2/T-25: TEMPLATES enum const + Template type + name mapper
    │   ├── sections.ts              # T-3: getSections(), sectionPath(); re-exports templates.ts
    │   ├── site.ts                  # T-4: SITE_URL, SITE_ORIGIN, path(), absoluteUrl()
    │   └── person.ts                # T-13: single Person facts source (T-23 updates facts)
    ├── content/
    │   └── sections/
    │       ├── home.md              # T-3 skeleton → T-23 HUMAN copy
    │       └── about.md             # T-3 skeleton (order: 2 after T-25) → T-23 HUMAN copy
    ├── layouts/
    │   └── BaseLayout.astro         # T-6: html/head-slot/header/main/footer/skip-link
    ├── pages/
    │   ├── [...slug].astro          # T-7: registry routes + template dispatch (+ T-12 head wiring)
    │   ├── 404.astro                # T-11: fixed not-found page, noindex (T-26: .btn-primary)
    │   └── robots.txt.ts            # T-16: prerendered robots.txt endpoint
    └── templates/
        ├── HomeSection.astro        # T-8 (+ T-13 JSON-LD; T-26 trims link row)
        └── AboutSection.astro       # T-10
```

Generated (gitignored): `dist/**` incl. `dist/_headers` (**every build**, host-matched noindex — T-30 [v1.6]; was preview-only under T-27), `dist/sitemap-index.xml`, `dist/sitemap-0.xml` (T-15).

**[v1.5] Deleted by the removal tickets** (present in git history, absent from the target tree):

| Deleted path | Deleted by | Note |
|---|---|---|
| `src/content/sections/resume.md` | T-25 | Removing it drops the route, nav entry, and sitemap URL automatically |
| `src/templates/ResumeSection.astro` | T-25 | Must be deleted in the **same commit** as the content file — a registered section with a missing template is a build failure (§5.1) |
| `src/components/JsonLdProfilePage.astro` | T-26 | `ProfilePage` ceases to exist on this site; do not re-home it |
| `public/resume.pdf` | **never created** | T-24 was cancelled before execution; `public/` was already deleted at T-7, so there is no directory and no file |

> Ticket-owned: `README.md` (T-29 host line, T-30 env/headers lines, T-19 deploy section [v1.6]). No other unowned files are required — see §12.5.

---

## 4. The Section Registry (normative)

### 4.1 `src/config/templates.ts` — the enum, the single sanctioned extension point

```ts
// Pure module: NO imports from 'astro:content' — imported by both content.config.ts
// (schema, runs in the content-layer context) and sections.ts (app context).
export const TEMPLATES = ['home', 'about', 'projects', 'blog', 'now', 'uses'] as const;
export type Template = (typeof TEMPLATES)[number];

/** 'home' → 'HomeSection', 'about' → 'AboutSection', ... */
export function templateToComponentName(template: Template): string {
  return `${template.charAt(0).toUpperCase()}${template.slice(1)}Section`;
}
```

### 4.2 REG-7 / US-9 enum tension — RESOLVED (option a)

**Decision: pre-include the four capped future templates.** `error` is deliberately **not** in the enum.

- Pre-including `projects|blog|now|uses` makes US-9/T-22's manual test a true two-file change — content file + template component — with **zero schema edits**, which is the cleanest reading of "typed content file plus one registration entry" and of T-22's "single sanctioned module" intent (the file is still the sole place templates are enumerated; nothing in it needs to change for the stub).
- REG-7's cap is preserved precisely: the enum remains **closed** at exactly the four budgeted future sections; the 404's `error` rendering stays out of the registry (§5.4) so no enum value is orphaned.
- If an **unbudgeted** template is ever required (beyond REG-7's four), the one-line extension is: append to `TEMPLATES` in `src/config/templates.ts` and add `{Name}Section.astro` — documented here as the sanctioned extension point.

**Exact enum value set for v1.5:** `home | about | projects | blog | now | uses` (6 values). Only `home|about` have content files + templates in v1.5; the other four are valid *types* that simply have no registered content yet. `[DEVIATION from T-2 literal wording]`: T-2's acceptance lists `z.enum(['home','resume','about','error'])`; this design moves the enum to the shared `TEMPLATES` const, drops `error` (resolved per the ticket's own "exact binding decided in tech design §Routing & Templates" note), pre-includes the four capped names per REG-7, and — per PRD v1.5 OQ-7 — drops `'resume'`, which T-25 executes. A content file with `template: 'error'`, `template: 'resume'`, or `template: 'bogus'` **fails the build** (closed enum) — satisfying T-2's negative test, and the `'resume'` case doubles as a permanent guard against the retired surface returning.

### 4.3 `src/content.config.ts` — the schema (Zod)

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { TEMPLATES } from './config/templates';

const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'slug: lowercase, digits, hyphens only'),
    title: z.string().min(1),
    navLabel: z.string().min(1),
    order: z.number().int().positive(),
    template: z.enum(TEMPLATES),
    description: z.string().min(1).max(160), // doubles as meta description (SEO-7); ≤160 is enforced at the boundary
    github: z.string().url().optional(),     // home-only; placeholder URL pattern until T-23 (§4.4)
    linkedin: z.string().url().optional(),   // home-only
  }),
});

export const collections = { sections };
```

- Home is the only section that *uses* `github`/`linkedin`; other sections simply omit them. `description` doubles as the page meta description and as the home proof line — one source, unique per page (SEO-7). **[v1.5]** The résumé's context-line role is gone with the page; nothing else in the schema existed for it.
- `slug` must always equal the content file basename. `getSections()` enforces this invariant (fail-fast, §4.5) so `entry.id`/`entry.data.slug` can never diverge.
- Type discipline note: all validation happens **here** (the content boundary). App code consumes already-validated `CollectionEntry<'sections'>` types and never re-parses.

### 4.4 `src/config/sections.ts` — the registration helper

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
export { TEMPLATES, templateToComponentName, type Template } from './templates';

export type SectionEntry = CollectionEntry<'sections'>;

/** All registered sections, sorted by `order` ascending. The registry's one read API. */
export async function getSections(): Promise<SectionEntry[]> {
  const all = await getCollection('sections');
  for (const entry of all) {
    if (entry.id !== entry.data.slug) {
      throw new Error(`Section file "${entry.id}" declares slug "${entry.data.slug}" — filename and slug must match.`);
    }
  }
  return [...all].sort((a, b) => a.data.order - b.data.order);
}

/** THE slug→URL mapping. Routes, nav, active-state, canonical, and sitemap all use this. */
export function sectionPath(entry: SectionEntry): string {
  return entry.data.slug === 'home' ? '/' : `/${entry.data.slug}/`;
}
```

`sectionPath` centralizes slug→URL so nav (`href`), route generation, canonical, and sitemap share **one** mapping and trailing-slash policy (see §4.5).

Skeleton content files (T-3). Literal `HUMAN COPY — <field>` markers are required (T-3 acceptance runs `rg -l 'HUMAN COPY'`). URL-constrained fields use valid placeholder URLs annotated with YAML comments (Zod `.url()` cannot accept prose text — this is the boundary-clean way to carry the marker):

```md
# src/content/sections/home.md
---
slug: home
title: "Matthew O'Connell"
navLabel: Home
order: 1
template: home
description: "HUMAN COPY — condensed proof line (years of experience, kind of work). ≤160 chars."
github: "https://github.com/"        # HUMAN COPY — GitHub profile URL (replace at T-23)
linkedin: "https://www.linkedin.com/" # HUMAN COPY — LinkedIn profile URL (replace at T-23)
---

**HUMAN COPY — role-in-domain.** One line naming the role and domain.

**HUMAN COPY — primary stack.** One line naming the primary stack.
```

```md
# src/content/sections/about.md
---
slug: about
title: About
navLabel: About
order: 2          # [v1.5] was 3; T-25 re-points to 2 now that résumé.md is gone
template: about
description: "HUMAN COPY — one-line teaser of the About page (≤160 chars)."
---

**HUMAN COPY — paragraph 1.** First-person intro.

**HUMAN COPY — paragraph 2.** More story.

**HUMAN COPY — paragraph 3.** Hobby thread.

**HUMAN COPY — paragraph 4.** Optional closing.
```

**[v1.5] `src/content/sections/resume.md` no longer exists.** T-3 created it as a third skeleton; T-25 deletes the file outright. No replacement skeleton, stub, or `hidden: true` placeholder is created — an empty résumé route is exactly the artifact PRD v1.5 forbids. `order` is the only thing that needed a hand edit: `about.md` moves `3 → 2` so the two sections sort `home, about` with no gap.

### 4.5 `src/config/site.ts` — the single URL source (T-4, host changed by T-29)

**[v1.6] Shipped shape.** Commit `40a9c78` moved the default out of this module: `astro.config.mjs`
resolves `PUBLIC_SITE_URL` (via Vite `loadEnv`, so `.env` is honoured) with the literal default
host, and Astro injects the result as `import.meta.env.SITE`. `site.ts` therefore contains **no host
literal** and T-29 does not edit it. The earlier v1.2 snippet (with `DEFAULT_SITE_URL` here) is
superseded.

```ts
const site: string | undefined = import.meta.env.SITE;
if (!site) throw new Error('astro.config.mjs must set `site` — absolute URLs derive from it.');

export const SITE_URL: string = site;

/** Single trailing-slash policy: pages ALWAYS end in '/' (root is '/'); file paths never do. */
export function path(p: string): string {
  const cleaned = p.replace(/^\/+|\/+$/g, '');
  return cleaned === '' ? '/' : `/${cleaned}/`;
}

export function absoluteUrl(p: string): string {
  return `${SITE_URL}${path(p)}`;
}
```

- **ONE trailing-slash policy, stated:** pages use `trailingSlash: 'always'` (surfaced in `astro.config.mjs`), so `/about/` is the only canonical form; file endpoints (`robots.txt`, `sitemap-*.xml`) never take a slash. Nav `href`s, canonicals, and sitemap URLs are therefore **byte-identical** (R8, SEO-11). **[v1.5]** `resume.pdf` is deleted from this list along with the PDF itself.
- **[v1.6]** The only host literal in source is the `astro.config.mjs` default, `'https://www.mattoconn.workers.dev'` (T-29; was `'https://mattoconn.pages.dev'`).
- No Cloudflare-injected host or branch variable (`CF_PAGES_URL`, `CF_PAGES_BRANCH`, `WORKERS_CI_*`) is ever read as, or in place of, the site URL (T-4 critical constraint, generalised in v1.6). Non-canonical hosts get `noindex` instead (§10.1).
- `.env.example` documents `PUBLIC_SITE_URL` only (T-30 removes the `CF_PAGES_BRANCH`/`CF_PAGES_URL` blocks); no real `.env` is committed.

---

## 5. Routing & Templates (normative)

### 5.1 Shape: single catch-all `src/pages/[...slug].astro`

**Decision: one catch-all route, not a fixed `index.astro`.** The registry stays central: `getStaticPaths()` iterates `getSections()`; the home entry maps to `/` via `params: { slug: undefined }`; every other entry maps to `/{slug}/`. A fixed `index.astro` would split home handling away from the dispatch machinery and invite slug→URL policy drift (R8). Static routes (`404.astro`, `robots.txt.ts`) take precedence over the catch-all, so the catch-all remains purely registry-driven.

```astro
---
import { getSections, sectionPath, type SectionEntry } from '../config/sections';
import { templateToComponentName } from '../config/templates';
import BaseLayout from '../layouts/BaseLayout.astro';
import Seo from '../components/Seo.astro';

export async function getStaticPaths() {
  const entries = await getSections();
  return entries.map((entry) => ({
    params: { slug: entry.data.slug === 'home' ? undefined : entry.data.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props as { entry: SectionEntry };
const [sections, home] = await Promise.all([
  getSections(),
  getSections().then((s) => s.find((x) => x.data.slug === 'home')),
]);
if (!home) throw new Error('Registry must contain a "home" section.');

const templates = import.meta.glob('../templates/*.astro', { eager: true }) as Record<
  string, { default: any }
>;
const pathname = `../templates/${templateToComponentName(entry.data.template)}.astro`;
const Module = templates[pathname];
if (!Module) throw new Error(`Missing template component for "${entry.data.template}" — expected ${pathname}.`);
const TemplateComponent = Module.default;

const title = entry.data.slug === 'home' ? entry.data.title : `${home.data.title} — ${entry.data.title}`;
const currentPath = sectionPath(entry);
---
<BaseLayout path={currentPath}>
  <Fragment slot="head">
    <Seo title={title} description={entry.data.description} path={currentPath} />
  </Fragment>
  <TemplateComponent entry={entry} sections={sections} />
</BaseLayout>
```

- **Dispatch** is `import.meta.glob('../templates/*.astro', { eager: true })` keyed to `templateToComponentName(template)` (PascalCase + `Section` suffix). A registered section whose component file is missing **fails the build** (loud, typed — a registry pointing at nothing is a programming error, not a 404 case). T-22's stub therefore needs exactly: `now.md` + `NowSection.astro` — the glob picks it up with **zero** changes to this file.
- Contract to templates: every template receives `entry: SectionEntry` and `sections: SectionEntry[]` (the full ordered registry). Uniform, no per-section wiring.
- Title pattern per SEO-6: home → `home.title`; others → `{home.title} — {entry.data.title}` (e.g. `Matthew O'Connell — About`). `[NOTE]`: the PRD's SEO-6 example says "Matt O'Connell — {section}", but T-3 pins the home entry title as `Matthew O'Connell` — the pattern is mechanical off the registry, and spelling is owner copy (T-23). Tickets T-12 was aligned to this registry-derived pattern during plan review.

### 5.2 Built-route contract

| Route | Source | Output | Head (via Seo) |
|---|---|---|---|
| `/` | `[...slug]` home entry (`slug: undefined`) | `dist/index.html` | `Matthew O'Connell` + home description |
| `/about/` | `[...slug]` about entry | `dist/about/index.html` | `Matthew O'Connell — About` + about description |
| `/404/` (page) | `src/pages/404.astro` | `dist/404.html` | `404 — Page not found` + fixed description + `<meta name="robots" content="noindex">` |
| `/robots.txt` (endpoint) | `src/pages/robots.txt.ts` (prerendered) | `dist/robots.txt` | — |

**[v1.5] `dist/resume/index.html` is deleted from this table** (T-25). T-28 asserts its continued absence: `test ! -e dist/resume/index.html` and a built-asset scan for the string `resume`, so a regression that re-registers the section is caught by CI rather than by a visitor hitting a resurrected page.

### 5.3 `src/pages/404.astro` — the fixed 404 binding

**Decision:** 404 is a **fixed page**, not a registry section, and there is **no ErrorSection.astro** (T-11's option is declined). Keeping `src/templates/` in a one-component-per-*shipped*-template relationship with the enum is an invariant worth more than a reusable error component: `glob` map keys == the shipped `TEMPLATES` subset (`home|about`) is provable at a glance, while the four dormant enum values (`projects|blog|now|uses`) are valid types that simply have no component yet — a registered section without its component **fails the build** (§5.1), never silently 404s.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Seo from '../components/Seo.astro';

const path404 = '/404/';
---
<BaseLayout path={path404}>
  <Fragment slot="head">
    <Seo title="404 — Page not found" description="This page does not exist on this site." path={path404} />
    <meta name="robots" content="noindex" />
  </Fragment>
  <section class="error">
    <p class="error-code" aria-hidden="true">404</p>
    <h1>Page not found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a class="btn-primary" href="/">Back to home</a>
  </section>
</BaseLayout>
```

**[v1.5]** The 404 link is the **last consumer** of the résumé's download-button token, so `T-26` renames `.btn-download` → `.btn-primary`. **[Plan-review correction]** The token is **not** in `global.css` — it is Astro-scoped inside `src/pages/404.astro` (its own `<style>` block, originally "duplicated from ResumeSection"). So the rename touches **that file only** (markup at the `<a>` plus the four scoped style rules: base, `:hover`, `:focus`, `:focus-visible`). `global.css` has no button token and is not edited. The 404's markup is otherwise untouched.

`noindex` (SEO-3 hygiene), keyboard-focusable ≥44px home link, uses BaseLayout so all three pages share landmarks (T-6 verification), excluded from sitemap (§9). **[v1.5]** was "all four pages" — T-28 re-runs the landmark/a11y sweep on the three-page set.

### 5.4 `src/pages/robots.txt.ts` (T-16)

```ts
import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site';

export const prerender = true;

const AI_BOTS = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot'] as const;

export const GET: APIRoute = () => {
  const lines: string[] = [];
  for (const bot of ['*', ...AI_BOTS]) {
    lines.push(`User-agent: ${bot}`, 'Allow: /', '');
  }
  lines.push(`Sitemap: ${SITE_URL}/sitemap-index.xml`);
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
```

Exact output (default host):

```
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://www.mattoconn.workers.dev/sitemap-index.xml
```

Global allow-plus named AI-bot Allow blocks (SEO-4), **no Disallow rules anywhere**, `Sitemap:` generated from `SITE_URL`, pointing at the exact `@astrojs/sitemap` index filename and therefore byte-identical with the built file (§9).

---

## 6. Layout & Styling (normative)

### 6.1 Scoped CSS vs Tailwind — pick **plain scoped CSS**

Defense: this is a zero-JS, three-page, two-template site with no shared component-library ambition. Scoped CSS ships as native `data-astro-*` attribute scoping — zero runtime, zero build-layer dependency, ~5 KB total CSS. Tailwind would add a build layer, an HTML class vocabulary, and a maintenance burden for zero interaction states. All global tokens/reset live in `src/assets/styles/global.css`; per-page/per-component styles live in each `.astro` file's `<style>` block (Astro auto-scopes). **No event-handler attributes, no `style=` attributes, no CSS-in-JS anywhere.**

### 6.2 Color palette (engineering taste, WCAG AA+)

| Token | Hex | Used for | Contrast vs `--color-bg` |
|---|---|---|---|
| `--color-bg` | `#fafaf9` | page background | — |
| `--color-text` | `#18181b` | body/headings | ≈17:1 (AAA) |
| `--color-muted` | `#52525b` | proof line, meta, footer | ≈7.4:1 (AAA) |
| `--color-accent` | `#1e40af` | links, active nav, focus ring, CTA bg | ≈8.3:1 (AAA) |
| `--color-accent-hover` | `#172554` | link/CTA hover | ≈10:1 (AAA) |
| `--color-border` | `#e4e4e7` | hairline dividers (decorative only; never the sole text-defining element) | n/a |
| `--color-surface` | `#ffffff` | CTA text on accent | white-on-accent ≈8.3:1 (AAA) |

All text/background pairings pass WCAG AA for normal text (≥4.5:1) and exceed ≥7:1 (AAA) for body sizes; T-21 re-verifies with a contrast tool. Every ratio above is approximated to 0.1 — the QA ticket owns the authoritative measurement.

### 6.3 Typography (fluid, 375px floor)

```css
:root {
  --font-sans: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --fs-hero: clamp(2rem, 1.5rem + 2.6vw, 3.25rem);   /* home h1 — name */
  --fs-h2:   clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem); /* section h1s on subpages, h2s */
  --fs-lead: clamp(1.0625rem, 1.0rem + 0.4vw, 1.25rem); /* role-in-domain line */
  --fs-body: 1rem;
  --fs-small: 0.875rem;
  --lh-hero: 1.05; --lh-h2: 1.2; --lh-body: 1.6;
  --measure: 65ch;        /* max line length for prose */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem; --space-5: 1.5rem; --space-6: 2rem; --space-7: 3rem; --space-8: 4rem;
  --container: 48rem;     /* max content width */
  --gutter: 1.25rem;      /* horizontal padding at 375px floor */
  --touch-min: 44px;
}
```

Body text is `clamp(1rem …)`, `h1/h2` set in 600, em-dashes and apostrophes from the subset (§7). Prose blocks cap at `65ch`; the container centers at `48rem` with `padding-inline: var(--gutter)`; section vertical rhythm uses `clamp(3rem, 8vh, 5rem)` between blocks.

### 6.4 Spacing / rhythm / layout patterns

- **Mobile-first, 375px floor**: nothing wider than the viewport, no horizontal scroll (NF-2). `nav`, hero, and link rows are single-column stacks at ≤48rem.
- **Hero structure (Home)**: `h1` (name) → lead line (role-in-domain) → stack line (primary stack) → proof line (`data.description`, muted) → link row. Left-aligned, real selectable text (HOME-1), zero animation (HOME-4).
- **Link row** (Home): GitHub, LinkedIn from registry frontmatter; About from `sectionPath()` of the `about` registry entry — never a literal `/about` (REG-3 discipline). **[v1.5]** the Résumé link is deleted (T-26), leaving a three-link row: **GitHub · LinkedIn · About**. This is the site's entire depth path (US-15/US-16), so the row must not be reduced further.
- **Nav pattern**: `<header>` contains `<Nav>` (registry-iterated `<ul>`); brand = home item; links ≥44px hit area; active item gets `aria-current="page"` + accent color + underline (never color alone).
- **Footer pattern**: one line — `© {year} {home.data.title}` — name read from the registry home entry, never hardcoded (T-6).
- **Primary-action token** (T-26): `.btn-primary` — `min-height: 48px`, `padding-inline: 1.5rem`, accent background, white text 600, radius 8px, `display:inline-flex; align-items:center`, `:hover` → `--color-accent-hover`, focus ring visible. **[v1.5] was `.btn-download`**, introduced for the résumé's "Download résumé PDF" CTA (T-9). With the page gone the only remaining consumer is the 404 "Back to home" link, so T-26 renames the class rather than leaving a token whose name advertises a deleted artifact. **[Plan-review correction] The token is Astro-scoped in `src/pages/404.astro`, not in `global.css`** — it was copied there from `ResumeSection.astro` when T-11 was written. T-26 edits `404.astro` only (the `<a>`'s class plus the scoped `.btn-*` rules); `global.css` is untouched. The Home link-row links are **not** primary buttons — they remain inline underlined text links (§6.5), which is why the rename is safe.

### 6.5 Accessibility baseline

- `lang="en"`, landmarks `<header>/<nav>/<main>/<footer>` on every page (SEO-9, T-6).
- **Skip-link: YES.** A visually-hidden `.skip-link` is the first element in `<body>`, targets `#main` (satisfies WCAG 2.4.1 with minimal cost).
- Focus styles: `:focus-visible` **and** `:focus` get `outline: 2px solid var(--color-accent); outline-offset: 2px` (visible fallback), never `outline: none`.
- **Color-only-never**: inline text links are always underlined; nav active uses underline + `aria-current="page"`; focus is never conveyed by color alone.
- Buttons/links: `--touch-min: 44px` everywhere (NF-2); `prefers-reduced-motion: reduce` disables transitions (zero animations in v1 by design).
- One `h1` per page; prose uses `<article>` on About (T-10) and `<section>` elsewhere; decorative `404` code uses `aria-hidden`.

### 6.6 Component hierarchy (Astro)

```
[fixed] 404.astro ─────────────────► BaseLayout.astro ──► Nav.astro (registry)
  [...slug].astro ── getStaticPaths ─► TemplateComponent (HomeSection | AboutSection)
   BaseLayout (slot:head = Seo.astro; slot:default = TemplateComponent)
   HomeSection.astro ── JsonLdPerson.astro          [v1.5: the site's ONLY JSON-LD node]
   AboutSection.astro (renders entry body via render(entry) → <Content />)
```

**[v1.5]** `ResumeSection.astro` and `JsonLdProfilePage.astro` are deleted (T-25, T-26), so the hierarchy loses one branch and the JSON-LD surface collapses to a single component. T-26's `RES-X4` check exists precisely because `Person` now has no sibling guarding it: deleting the wrong import during the sweep must fail loudly in T-28, not silently strip structured data from the site.

State: **zero client state** (static). Build-time data flows `props` + `Astro.props`; the only shared "state" is the registry (`getSections()`) and `SITE_URL`, both typed modules. Navigation changes: none beyond the registry (T-22 proves it).

---

## 7. Fonts (normative)

- **Family: IBM Plex Sans** (OFL-licensed). Rationale: engineered, unpretentious, distinctive without being decorative — matches the site's identity; single family per scope cap (vision §7 said serif-pairing is allowed but the tickets cap at one family, 1–2 weights).
- **Weights: 400 (regular) + 600 (semibold)** — body + headings/CTA/nav.
- **Source:** vendored TTFs at `scripts/font-src/` (downloaded from the IBM Plex OFL distribution during T-17 and **committed** so subsetting is hermetic/repeatable; never fetched at build time).
- **Subsetting: `subset-font` (pure Node/WASM) — this is the normative tool.** It is a committed devDep in `package.json`, invoked through `scripts/subset-fonts.mjs`, and never at build time. Not Python WeasyPrint, and **not `glyphhanger`** (see the amendment note below — that was the original choice, replaced during T-17 because of a missing Python toolchain).

The reproducible one-shot, re-run whenever the copy changes (T-23, or any new page):

```sh
npm run build && node scripts/subset-fonts.mjs
```

`scripts/subset-fonts.mjs` derives the glyph set by sweeping the built HTML (covering `é`, `©`, typographic quotes) plus a hardcoded redundancy whitelist, and writes the two pinned WOFF2 names below.

**[v1.5]** `dist/resume/index.html` is dropped from the script's input list (T-27), leaving `['index.html', 'about/index.html', '404.html']`. The script wraps each page read in `try { … } catch { continue; }`, so a missing input is **silently skipped rather than raising** — which means the real hazard is not a stale path breaking the build, it is a **newly added** page being quietly excluded from glyph subsetting and shipping with missing glyphs. The list is written explicitly (not globbed) precisely so it stays an accurate, auditable description of the pages that exist; adding a page means adding a line in the script.

> **Historical note (T-17 amendment, retained for the audit trail — NOT normative):** the original design specified
> `npx glyphhanger --whitelist=… --subset=scripts/font-src/IBMPlexSans-{Regular,SemiBold}.ttf --formats=woff2
> --output=src/assets/fonts <page list>`. During T-17 it was found that `glyphhanger` shells out to Python's
> `fonttools` + `brotli`, which are not installed on this machine (the owner prefers no Python toolchain).
> The ticket explicitly sanctioned the `subset-font` alternative, which shipped. See
> `qa/qa-report-T-17.md` (deviation W-1, finding W-3). The *output* contract — two pinned WOFF2 files,
> weights 400/600, `font-display: swap` — was never in doubt and is unchanged.

The `.ttf` sources stay in `scripts/font-src/` for reproducibility; the subsetted `.woff2` output is **committed** (the build never runs the subsetter — T-17 is a one-shot asset ticket).
- **`@font-face`** in `src/assets/styles/global.css` (T-17), `font-display: swap` (content-first, NF-1):

```css
@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../fonts/ibm-plex-sans-400.woff2') format('woff2');
}
@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('../fonts/ibm-plex-sans-600.woff2') format('woff2');
}
```

- **Zero font-CDN verification:** `npm run build && (rg -i 'googleapis|gstatic|fonts\.google' dist/ || echo 'NO external fonts')` — also enforced by `verify-static.mjs` third-party origin scan (§11).
- System fallbacks cover missing glyphs (the OS fallback stack in `--font-sans`); no `preload` of fonts needed at this scale.

---

## 8. Head & Structured Data (normative)

### 8.1 `src/components/Seo.astro` (T-12)

Props: `{ title: string; description: string; path: string }`. Renders the full head contract: unique `<title>` (SEO-6), unique meta description ≤160 chars (SEO-7, enforced by the schema), OG `og:title`/`og:description`/`og:type=website` (SEO-8, `og:image` deliberately omitted per HOME-4/T-12), and an **absolute self-referencing canonical** built from `SITE_URL + path` (SEO-11). `og:url` mirrors the canonical.

```astro
---
import { absoluteUrl } from '../config/site';

interface Props { title: string; description: string; path: string; }
const { title, description, path } = Astro.props;
const canonical = absoluteUrl(path);
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:type" content="website" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
```

Every page passes its own `title`/`description`/`path`; canonical, sitemap URL, and robots Sitemap line are byte-identical because all three flow from `path()` (R8).

### 8.2 `src/config/person.ts` — the ONE shared facts module (T-13, facts at T-23)

```ts
import { SITE_URL } from './site';
import { getSections } from './sections';

// HUMAN COPY — job title. Deliberately a typed constant, not a content field:
// the registry schema stays minimal (slug/title/navLabel/order/template/description + URL links).
// Replace with the owner's real job title at T-23 (the human supplies it; never invent facts).
const JOB_TITLE: string = 'HUMAN COPY — job title';

export async function getPersonData(): Promise<{
  name: string; url: string; jobTitle: string; sameAs: [string, string];
}> {
  const sections = await getSections();
  const home = sections.find((s) => s.data.slug === 'home');
  if (!home) throw new Error('Registry missing "home" section — cannot derive Person facts.');
  return {
    name: home.data.title,
    url: SITE_URL,
    jobTitle: JOB_TITLE,
    sameAs: [home.data.github ?? '', home.data.linkedin ?? ''],
  };
}
```

**Fact flow:** name/url/sameAs come from the registry (home entry + SITE_URL); `jobTitle` is a marked constant here. Home's `JsonLdPerson` calls this **one** module — no duplicated facts. **[v1.5]** the résumé's second consumer is deleted with the page, so `getPersonData()` now has exactly one caller; it is kept as a module rather than inlined into the component because the *facts* (not the markup) are the thing that must never be duplicated if a future section ever needs `Person` data.

### 8.3 JSON-LD component and placement — RESOLVED

`JsonLdPerson.astro` serializes an inline `<script type="application/ld+json">` data block **at the top of the template's section markup (inside `<body>`/`<main>`)**, not in `<head>`:

```astro
---
import { getPersonData } from '../config/person';
const p = await getPersonData();
const ld = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: p.name,
  url: p.url,
  jobTitle: p.jobTitle,
  sameAs: p.sameAs.filter(Boolean),
};
---
<script type="application/ld+json" is:inline set:html={JSON.stringify(ld)} />
```

`Person` is the **only** structured-data node on this site (SEO-1, SEO-2 tombstoned by PRD v1.5 OQ-7). There is no `ProfilePage` node and none is to be added: `ProfilePage` describes a container page for a person's identity document, and with no résumé page in the site the type has nothing to describe. `sameAs` carries the two profile URLs that the About/LinkedIn depth path (US-15/US-16) depends on, so the two placeholders T-23 replaces are the same fact in two places — schema frontmatter and `person.ts` both read `home.data.github`/`home.data.linkedin`, so there is a single edit point, not two.

`[DEVIATION from T-13/T-14 wording]`: the tickets say "Home page `<head>` includes …". Putting data blocks in the **body** is deliberate: Google and AI crawlers parse JSON-LD anywhere in the document, and head-placement would force the route file to know per-template metadata, violating REG-6's "zero per-section wiring". The `<script>` blocks are data, **exempt** from the zero-JS scanner (T-20) wherever they appear; `is:inline` guarantees Astro leaves them untouched. This is noted for the T-21 QA pass.

**[v1.5] Removal consequence, and the reason `RES-X4` exists:** when T-26 deletes `JsonLdProfilePage.astro`, `Person` loses the sibling that made an accidental deletion obvious. The guard is therefore explicit in T-28: the built `dist/index.html` must still contain exactly one `application/ld+json` block with `"@type":"Person"`, and **zero** with `"@type":"ProfilePage"`. A dev sweeping imports during T-26 must verify the Person block survived in the same commit — it is the one thing the removal ticket could plausibly break without failing the build.

---

## 9. Sitemap & robots (normative)

`astro.config.mjs` (T-4/T-15, default host T-29):

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// [v1.6] Simplified; the shipped file resolves this with Vite loadEnv (§4.5).
const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://www.mattoconn.workers.dev';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !['/404/', '/404.html', '/robots.txt'].includes(pathname);
      },
    }),
  ],
});
```

- **Output:** `dist/sitemap-index.xml` + `dist/sitemap-0.xml` (integration defaults — `filenameBase: 'sitemap'`). **Confirmation required by design:** `robots.txt`'s `Sitemap: {SITE_URL}/sitemap-index.xml` line must match the built index file name byte-for-byte (`sitemap-index.xml`, never `sitemap.xml` or `sitemap-0.xml`).
- Sitemap URLs derive from the registry's generated routes (T-7) and are **exactly** `/`, `/about/` — trailing-slash policy shared with canonical/nav (R8). **[v1.5]** was `/`, `/resume/`, `/about/`; the résumé URL disappears automatically the moment its content file is deleted, because the sitemap is a crawl of the generated routes rather than a hand-written list. That is why T-15 needs no edit: the registry-derived design means a scope removal costs one deleted file, not a coordinated config change. The integration already skips non-page endpoints (robots.txt) and status pages (404) by default; the explicit `filter` keeps that exclusion visible and future-proof.
- `/404.html` also carries `noindex` (§5.3) so a deindexed 404 can never leak into search.

---

## 10. Headers & Deploy (normative)

> ### [v1.6] Platform correction - read before anything else in this chapter
>
> Cloudflare Pages no longer exists for new projects; it is part of **Cloudflare Workers** (PRD
> §5.6, OQ-8). A static site is now a Worker that serves files from an `assets` directory declared
> in a committed `wrangler.jsonc`, and git-triggered builds are **Workers Builds**. T-19 failed
> because nothing was committed: Workers Builds ran `wrangler deploy`, which auto-ran
> `astro add cloudflare`, installed the SSR adapter, and moved output to `dist/client/`.
>
> The v1.6 design fixes the cause, not the symptom:
>
> | v1.5 (Pages) | v1.6 (Workers static assets) | Owner |
> |---|---|---|
> | Dashboard-only project, "no wrangler file" | Committed `wrangler.jsonc`, **assets-only** (no `main`), `not_found_handling: "404-page"` | T-19 |
> | Host `https://mattoconn.pages.dev` | Host `https://www.mattoconn.workers.dev` (Worker `www`, account subdomain `mattoconn`) | T-29 (code), T-19 (account) |
> | Preview noindex iff `CF_PAGES_BRANCH` ∉ {unset, `main`} | **Host-matched** noindex rule derived from the canonical host; same bytes on every build; no env var | T-30 |
> | Production writes **no** `dist/_headers` | Every build writes `dist/_headers`; the gate asserts no rule can match the canonical host | T-30 |
> | Build command retrofit `npm run build && npm run verify` | Moot: `npm run build` already chains `verify-static.mjs` (shipped in `40a9c78`); build command stays `npm run build` | T-19 |
>
> **Non-negotiable (DEP-8, NF-5, NF-6):** no `@astrojs/cloudflare`, no `main` entry, no
> `dist/_worker.js`, no `dist/client/`. The existing gate already fails a build that emits any
> `.js` file into `dist/` or lacks `dist/robots.txt`, so the T-19 failure mode is now caught at
> build time before a deploy step runs.
>
> The stale `personal-website` Worker (two SSR versions with a `fetch` handler) was **deleted by
> the planner on 2026-09-27** with `wrangler delete personal-website`, so no push can rebuild it.

### 10.1 `scripts/noindex-rule.mjs` + `scripts/gen-headers.mjs` (T-18 → T-27 → **T-30**) - host-matched noindex

**Why host-matching replaces branch detection.** On Workers, every non-canonical host of the site
is a workers.dev hostname of the form `<prefix>-<worker>.<account>.workers.dev`: Preview URLs
(`<preview-name>-www…`), Deployment URLs (`<deployment-id>-www…`), and Version URLs
(`<version-prefix>-www…`). Workers static assets `_headers` supports **absolute-URL rules that match
on hostname**, with `:placeholders` that match any run of characters other than `.` and `/`. One
rule therefore covers every non-canonical host, and the file can be byte-identical on every build.

Branch detection (the v1.5 design, with `WORKERS_CI_BRANCH` swapped in for `CF_PAGES_BRANCH`) was
rejected: it only protects builds from non-production branches, so each **production** deploy's
own Version and Deployment URLs would serve an indexable duplicate of the site. Cloudflare's
automatic `X-Robots-Tag: noindex` on workers.dev Preview URLs (Worker Previews, open beta since
2026-09-22) is welcome defence in depth, but it is not relied upon.

**Single source of the canonical host.** `gen-headers.mjs` reads the canonical origin from the
built `dist/robots.txt` `Sitemap:` line, exactly as `verify-static.mjs` rule 0 already does. It
never reads `PUBLIC_SITE_URL` or any Cloudflare-injected variable (`CF_PAGES_*`, `WORKERS_CI_*`):
`astro.config.mjs` resolves the host (including `.env` via `loadEnv`), and reading the build output
is the only way to guarantee `_headers` agrees with the canonicals and sitemap.

`scripts/noindex-rule.mjs` (new, T-30) - pure, zero-dependency, imported by both scripts so the
rule is defined once:

```js
// Pure and dependency-free. Shared by gen-headers.mjs (writer) and
// verify-static.mjs (gate) so the noindex rule is defined exactly once.
//
// Every non-canonical host of a Workers static-assets site is a workers.dev
// hostname: Preview, Deployment, and Version URLs are all
// `<prefix>-<worker>.<account>.workers.dev`. Workers `_headers` rules can
// match on hostname, so one rule keyed off the canonical host covers them all
// and the file is identical on every build: no branch or env detection.

const WORKERS_DEV_HOST = /^([a-z0-9-]+)\.([a-z0-9-]+)\.workers\.dev$/;

/** Canonical origin from robots.txt text; same pattern as verify-static.mjs rule 0. */
export function canonicalOriginFromRobots(robotsText) {
  const url = robotsText.match(/^Sitemap:\s*(\S+)\s*$/im)?.[1];
  if (!url) throw new Error('robots.txt has no Sitemap: line; cannot derive the canonical origin');
  return new URL(url).origin;
}

/** The exact dist/_headers body for a canonical https origin. */
export function noindexHeadersFor(origin) {
  const { protocol, host } = new URL(origin);
  if (protocol !== 'https:') throw new Error(`canonical origin must be https: ${origin}`);
  const m = WORKERS_DEV_HOST.exec(host);
  const pattern = m
    ? // Canonical on workers.dev: noindex every prefixed alias of this Worker.
      // `www.mattoconn.workers.dev` itself cannot match: its first label has no '-'.
      `https://:prefix-${m[1]}.${m[2]}.workers.dev/*`
    : // Canonical elsewhere (future custom domain): every workers.dev host is a duplicate.
      'https://:worker.:account.workers.dev/*';
  return `${pattern}\n  X-Robots-Tag: noindex\n`;
}

/**
 * Could a `_headers` host pattern match `host`? Mirrors Cloudflare's placeholder
 * rule (any run of characters other than '.' and '/'), treating a placeholder as
 * possibly empty so the check errs toward reporting a match.
 */
export function hostPatternMatches(hostPattern, host) {
  const source = hostPattern
    .split(/(:[A-Za-z]\w*)/)
    .map((part, i) => (i % 2 === 1 ? '[^./]*' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`^${source}$`).test(host);
}
```

`scripts/gen-headers.mjs` (rewritten by T-30; still chained after `astro build`):

```js
// Emit dist/_headers AFTER `astro build` (chained in package.json).
//
// This script's ONLY job is SEO-12: X-Robots-Tag: noindex on every host that is
// not the canonical one. The rule is host-matched and derived from the canonical
// origin the build actually emitted (dist/robots.txt), so the output is identical
// on every build, production or preview. No environment variable is read.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalOriginFromRobots, noindexHeadersFor } from './noindex-rule.mjs';

const DIST_DIR = resolve(import.meta.dirname, '../dist');

const origin = canonicalOriginFromRobots(readFileSync(resolve(DIST_DIR, 'robots.txt'), 'utf8'));
writeFileSync(resolve(DIST_DIR, '_headers'), noindexHeadersFor(origin), 'utf8');
console.log(`[gen-headers] wrote dist/_headers (noindex for non-canonical hosts of ${origin})`);
```

A missing `dist/robots.txt` or `Sitemap:` line throws, which fails `npm run build` loudly; that is
intended (it means `astro build` did not produce the site the rule is derived from).

Exact `dist/_headers` on **every** build with the default host (production, preview, local):

```
https://:prefix-www.mattoconn.workers.dev/*
  X-Robots-Tag: noindex
```

With `PUBLIC_SITE_URL=https://example.test` (the T-4 plumbing test, or a future custom domain):

```
https://:worker.:account.workers.dev/*
  X-Robots-Tag: noindex
```

**Invariants (asserted by `verify-static.mjs` rule 4e, §11.1):** the file exists; it equals
`noindexHeadersFor(SITE_ORIGIN)` byte-for-byte; it contains no path-only rule (a `/*` rule applies
to the canonical host too); and no rule's host pattern can match the canonical host. The last check
is independent of the writer, so a future edit to `noindexHeadersFor` that would noindex the real
site fails the build rather than shipping an SEO outage. Pages stay crawlable on every host
(robots.txt has no Disallow) so the noindex signal takes effect (SEO-12, unchanged).

**Unverifiable locally:** `wrangler dev` serves on `localhost`, so host-matched rules cannot fire
there. Cloudflare's placeholder semantics for a pattern like `:prefix-www` are confirmed live in
T-19's smoke checks (§10.3 step 6); if the canonical host ever returns `X-Robots-Tag`, T-19 rolls
back and escalates.

> **Superseded (v1.5 → v1.6), kept for audit.** The v1.5 script detected previews with
> `CF_PAGES_BRANCH` (`PROD_BRANCH = 'main'`), wrote the bare `/*` noindex rule on previews, and
> deliberately wrote **no file** on production. Both the variable and the "no `_headers` on
> production" invariant are retired by T-30. The constant `PROD_BRANCH` disappears from both
> scripts, closing QA carry-forward N-1 from `qa/qa-report-T-27.md`.

### 10.2 `package.json` build chain (T-1/T-18/T-19/T-20)

As shipped (T-19 adds only the `wrangler` devDependency; scripts are unchanged):

```json
{
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && node scripts/gen-headers.mjs && node scripts/verify-static.mjs",
    "preview": "astro preview",
    "check": "astro check",
    "verify": "node scripts/verify-static.mjs",
    "astro": "astro",
    "fonts:subset": "npm run build && node scripts/subset-fonts.mjs"
  },
  "devDependencies": { "wrangler": "^4.142.0" }
}
```

`npm run build` generates headers **after** Astro's build and then runs the full static gate, all
inside one command, so Workers Builds' build step fails before its deploy step can run on any
violation. **[v1.6]** there is no separate CI-gate retrofit: the build command in Workers Builds is
plain `npm run build`, and appending `&& npm run verify` would only run the gate twice.

`wrangler` is a project devDependency (not an ad-hoc `npx` download) for three reasons: Worker
Previews require Wrangler ≥ 4.135.0 installed in the project; Workers Builds' deploy and preview
commands (`npx wrangler …`) then resolve the pinned version; and a local `npx wrangler deploy` uses
the same version CI does.

> **[v1.5 correction]** This block previously showed a long `npx glyphhanger …` command for
> `fonts:subset` and `engines.node >=20`; both were corrected to what shipped (§7, `qa/qa-report-T-1.md`).

### 10.3 Workers static-assets deployment (T-19) - committed config, then Workers Builds

**`wrangler.jsonc`** (new, repo root, T-19). Hand-written: `wrangler init` scaffolds a Worker
script, which is exactly what DEP-8 forbids, and `astro add cloudflare` is banned outright.

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  // Static-assets-only Worker (PRD DEP-8). There is deliberately NO "main":
  // no Worker script, no @astrojs/cloudflare adapter, no server runtime (NF-6).
  "name": "www",
  "compatibility_date": "2026-09-27",
  // Canonical host https://www.mattoconn.workers.dev (PRD DEP-5).
  "workers_dev": true,
  // Preview/Version URLs stay on; dist/_headers noindexes all of them (§10.1).
  "preview_urls": true,
  "assets": {
    "directory": "./dist",
    // Unmatched URLs serve dist/404.html with status 404 (T-11's page).
    // Without this, Workers returns a bare 404 and the custom page never shows.
    "not_found_handling": "404-page",
    // Default, stated explicitly: /about -> /about/ redirect, matching
    // trailingSlash: 'always' and build.format: 'directory' (R8).
    "html_handling": "auto-trailing-slash"
  }
}
```

Field notes: `name` must equal the Worker's name in the dashboard, or Workers Builds refuses to
build. `.gitignore` already covers `.wrangler/` (T-1). Wrangler treats `dist/_headers` as
configuration, not as a served file. No other Wrangler files are committed.

**Ordered procedure (each step's actor is stated; nothing is left to a dashboard default):**

- **[Precondition] Wrangler auth.** Every CLI step uses the owner's existing OAuth login on this
  machine (confirmed by the planner 2026-09-27): `npx wrangler whoami` must show
  "Mattgoconn@gmail.com's Account". If not authenticated, the **owner** runs `npx wrangler login`.
  No API token is created, requested, or committed.
0. **[Done, planner, 2026-09-27]** Stale Worker deleted: `wrangler delete personal-website`.
   Precondition check: `npx wrangler deployments list --name personal-website` must fail with
   "not found". If it lists deployments, stop: something recreated it.
1. **[Owner, dashboard]** Workers & Pages → account **Subdomain** → change `mattgoconn` →
   `mattoconn`. Nothing else on the account uses workers.dev today. Confirm with
   `dig +short probe.mattoconn.workers.dev` returning an address (allow a few minutes).
   **If `mattoconn` is unavailable: stop and escalate to the planner** (DEP-5, R1); do not pick
   another name and do not proceed with `mattgoconn`.
2. **[Dev, repo]** `npm install --save-dev wrangler@^4.142.0`; add `wrangler.jsonc` above; update
   `README.md` (see T-19 ticket). Local gates, all must pass: `npm run build`;
   `npx wrangler deploy --dry-run` exits 0; `test ! -e dist/client && test ! -e dist/_worker.js`;
   `npm ls @astrojs/cloudflare` reports it absent; `wrangler.jsonc` has no `"main"` key.
   Local runtime: `npx wrangler dev --port 8787` then `curl -s -o /dev/null -w '%{http_code}'
   http://localhost:8787/nope/` → `404` with the custom 404 body, and `curl -sI
   http://localhost:8787/about` → a redirect whose `Location` ends in `/about/`.
3. **[Agent or owner, local]** First deploy creates the Worker from the committed config:
   `npm run build && npx wrangler deploy`. Output must name `https://www.mattoconn.workers.dev`
   and upload assets only (no script bundle).
4. **[Owner, dashboard]** Worker `www` → Settings → **Builds** → Connect the GitHub repo.
   Production branch `main`; build command `npm run build`; deploy command `npx wrangler deploy`;
   **non-production branch builds on**, preview command `npx wrangler preview`; root directory `/`.
   **Build variables: none.** Do not set `PUBLIC_SITE_URL` (the committed default is the canonical
   host; setting it anywhere invites R10), and do not add a branch variable (nothing reads one).
   Node comes from `.node-version` (`24.21.0`); if the build log shows Node < 22.12, add build
   variable `NODE_VERSION=24.21.0` and record it in the completion notes.
5. **[Agent]** Push the T-19 commit to `main`. The Workers Build must go green in < 5 minutes, its
   log must show `verify: OK`, and `npx wrangler deployments list --name www` must show a new
   deployment sourced from the build (DEP-2, DEP-6, US-12, US-13).
6. **[Agent] Live smoke checks** against `H=https://www.mattoconn.workers.dev`:
   - `curl -sI $H/ | head -1` → `200`; `curl -sI $H/about/ | head -1` → `200`.
   - `curl -sI $H/about` → redirect, `Location` ends in `/about/`.
   - `curl -s -o /dev/null -w '%{http_code}' $H/nope/` → `404`, body is the custom 404 page;
     `$H/resume.pdf` and `$H/resume/` → `404` (the v1.5 pass condition).
   - **Canonical is never noindexed (blocker):** `curl -sI $H/ | grep -i '^x-robots-tag'` prints
     **nothing**. If it prints anything, immediately `npx wrangler rollback` and escalate: the live
     canonical host is de-indexing itself.
   - **Non-canonical hosts are noindexed:** `npx wrangler versions upload` (creates an undeployed
     version; production is unaffected) prints a Version URL `https://<prefix>-www.mattoconn.workers.dev`;
     `curl -sI <that URL>` must contain `x-robots-tag: noindex`. Then push a throwaway branch,
     take the Preview URL Workers Builds reports, confirm the same header, and delete the branch.
   - Canonical/sitemap/robots agree on the live host: `curl -s $H/robots.txt` has
     `Sitemap: https://www.mattoconn.workers.dev/sitemap-index.xml`; the home page's
     `rel="canonical"` is `https://www.mattoconn.workers.dev/`.
   - Zero cost, no custom domain: the Worker has no Routes or Custom Domains configured.

Rollback: `npx wrangler rollback` restores the previous version in seconds. Before the first
successful deploy there is nothing to roll back to; a failed first deploy is fixed forward.

### 10.4 Migration / compatibility

No data migration. Compatibility posture: (a) `trailingSlash: 'always'` is a **locked** policy -
changing it silently breaks canonical/sitemap byte-identity (R8). (b) A future custom domain (a
separate project, PRD §11.1) is a one-variable change (`PUBLIC_SITE_URL`/the `astro.config.mjs`
default) plus a Custom Domain on the Worker; `noindexHeadersFor` already switches to noindexing
every workers.dev host when the canonical host is not on workers.dev, so the old
`www.mattoconn.workers.dev` URL de-indexes automatically. That project must still decide redirects
and Preview URLs on the custom domain (`<preview>.example.com`), which this rule does not cover.
(c) Because `_headers` no longer depends on the build environment, a preview build and a
production build of the same commit produce byte-identical `dist/`; no production behaviour can
change by accident of which branch built it.

---

## 11. Static Verification & Test Strategy

### 11.1 `scripts/verify-static.mjs` (T-20) — the CI gate

Runs over `dist/`, exits non-zero on any failure, prints every violation with file + reason. Rules:

1. **Functional-JS markers (NF-5).** For every `dist/**/*.html`, for every `<script …>…</script>`:
   - tag has `src=` → **FAIL** (client JS file);
   - tag has a non-empty body AND its `type` attribute is not `application/ld+json` → **FAIL** (inline JS);
   - non-empty `type="application/ld+json"` blocks → **exempt** (data; `is:inline` output on v1 pages).
   - Event-handler attributes anywhere in the document: regex `\s(on[a-z]+)\s*=\s*("|')[^"']*("|')` → **FAIL** (`onclick`, `onload`, `onerror`, …).
2. **Third-party origin check (NF-4).** Allowed origin = `SITE_ORIGIN` (as shipped: read from the built `dist/robots.txt` `Sitemap:` line, never from an env var; default host `https://www.mattoconn.workers.dev` since T-29). In HTML attributes (`src`, `srcset`, `href`, `poster`, `action`) and CSS (`url(...)` in any `dist/**/*.css`): any value starting `http://`, `https://`, or protocol-relative `//` whose host ≠ allowed host → **FAIL**. Exception (documented): `href` on `<a>` elements points at GitHub/LinkedIn by feature (HOME-3) — anchors are outbound *links*, not page-load requests; everything load-bearing (stylesheets, images, scripts, fonts, forms) must be same-origin. JSON-LD `sameAs` values reside inside the exempted data blocks and are never fetched.
3. **Presence asserts (DEP-3, SEO-3):** `dist/404.html`, `dist/robots.txt`, `dist/sitemap-index.xml`, and `dist/sitemap-0.xml` all exist. **[v1.5]** the résumé half of the original rule set is replaced by rule 3b — these two must be added and removed together in T-27, since leaving either behind is exactly the "residue" the PRD forbids.
4. **No-résidue asserts (RES-X1, RES-X3 — T-27).** The inverse of the old presence asserts, and the site's permanent guard against the retired surface reappearing:
   - `dist/resume/index.html` does **not** exist; `dist/resume.pdf` does **not** exist.
   - No file under `dist/**` contains the strings `/resume.pdf`, `"@type":"ProfilePage"`, or a nav/href pointing at `/resume`.
   - The **only** JSON-LD block in `dist/index.html` is `"@type":"Person"` (guards `RES-X4`: the Person node must survive the sweep).
   - ~~`dist/_headers` must not contain `resume` on a preview build, and must not exist at all on a production build (§10.1).~~ **[v1.6] Replaced by rule 4e below (T-30).**
   
   Rationale for asserting on *strings* and not just files: a partial regression — the file is gone but a nav entry, a canonical, or a leftover `sameAs` still points at `/resume` — produces no missing-file failure, yet ships a broken link to visitors and crawlers. String scanning is what makes the invariant enforceable in CI.

   **Rule 4e, `dist/_headers` [v1.6, T-30].** Replaces the shipped branch-aware 4e block (the
   `NOINDEX_RULE`/`PROD_BRANCH`/`CF_PAGES_BRANCH` checks) in full. Import `noindexHeadersFor` and
   `hostPatternMatches` from `./noindex-rule.mjs`; keep rule 0's own `SITE_ORIGIN` derivation as is
   (an independent parse is a feature in a gate). Branch-independent, env-independent:

   ```js
   const headersPath = join(DIR, '_headers');
   if (!exists(headersPath)) {
     fail('dist/_headers: missing — non-canonical hosts would be indexable (SEO-12)');
   } else {
     const written = readText(headersPath);
     const expected = noindexHeadersFor(SITE_ORIGIN);
     if (written !== expected) {
       fail(`dist/_headers: expected ${JSON.stringify(expected)}, got ${JSON.stringify(written)}`);
     }
     // Independent of the writer: no rule may be able to reach the canonical host.
     const canonicalHost = new URL(SITE_ORIGIN).host;
     for (const line of (written ?? '').split('\n')) {
       if (line.trim() === '' || /^\s/.test(line) || line.startsWith('#')) continue; // header lines, blanks, comments
       if (!line.startsWith('https://')) {
         fail(`dist/_headers: rule "${line}" is not host-matched, so it also applies to ${canonicalHost}`);
         continue;
       }
       if (hostPatternMatches(line.slice('https://'.length).split('/')[0], canonicalHost)) {
         fail(`dist/_headers: rule "${line}" matches the canonical host ${canonicalHost}`);
       }
     }
   }
   ```

   Also delete the header comment's paragraph about "a `CF_PAGES_BRANCH`-prefixed (preview) build
   leaves dist/_headers on disk"; with identical output on every build it no longer applies.
5. Fail-fast plumbing: missing `dist` → FAIL; each rule logs `FAIL <file>: <detail>`; `process.exit(1)` on any failure, `process.exit(0)` + summary otherwise. Plain Node ESM, zero runtime deps.

### 11.2 Planted negative-test procedure (T-20 acceptance)

1. `npm run build`
2. Temporarily inject a functional script into the home build output: append `<script src="https://example.com/evil.js"></script>` to `dist/index.html` before `</body>`.
3. `npm run verify` must **exit non-zero** and list `dist/index.html` (JS-marker rule) — also flags the third-party origin.
4. Remove the planted tag, `npm run build` again, `npm run verify` exits 0 (or `git checkout -- dist` and rebuild).

### 11.3 Test strategy map

| Layer | What | Where / when |
|---|---|---|
| Schema unit | Zod rejects `template: 'bogus'` / `'error'` / `'resume'` (T-2 negative test; the `'resume'` case is a permanent v1.5 guard); description >160 fails | T-2, local `npm run build`; `'resume'` re-checked in T-28 |
| Unit (pure fn) | `getSections()` ordering (**home→about** — v1.5) + id/slug invariant (T-3 log line or test); `sectionPath` home→`/` | T-3; re-asserted in T-28 |
| Integration (build) | `npm run build` + `npx astro check` clean; **three** routes rendered with landmarks (T-6 rg); template dispatch to correct `Section` (T-7 `ls dist/`) | Every astro ticket |
| Static gate | `npm run verify` (JS/third-party/presence/**no-résidue**) + planted negative tests (§11.2) | T-20, amended T-27; CI post-T-19 |
| Headers | ~~`CF_PAGES_BRANCH=preview-x npm run build` → `noindex`; production → no `_headers` file~~ **[v1.6]** Every build writes exactly `https://:prefix-www.mattoconn.workers.dev/*` + `X-Robots-Tag: noindex`; output is byte-identical with any `CF_PAGES_BRANCH`/`WORKERS_CI_BRANCH` value; planted path-only, canonical-matching, and missing `_headers` each fail `npm run verify` | T-18 → T-27 → **T-30** |
| **Live deploy [v1.6]** | Canonical `/` and `/about/` 200 with **no** `X-Robots-Tag`; Version and Preview URLs carry `noindex`; `/nope/` 404 with the custom page; `/about` redirects to `/about/`; assets-only Worker (no script) | **T-19** (§10.3 step 6) |
| QA/E2E | Lighthouse mobile (load <2s), axe a11y, WCAG contrast, 375/390/430px sweep on the **two-route** site (T-21 → T-28); extensibility stub test (T-22) | T-21/T-22, re-run T-28 |
| **[v1.5] Removal regression** | registry returns exactly `['home','about']`; no `dist/resume/**`; no `resume` string in any built asset; exactly one JSON-LD block and it is `Person`; sitemap lists exactly `/` + `/about/`; production build writes no `_headers` | T-25, T-26, T-27, **T-28** |
| ~~QA/E2E (cancelled)~~ | ~~PDF text-extraction (`pdftotext public/resume.pdf - \| wc -w` > 0) and `curl` cache check~~ | ~~T-24~~ **CANCELLED** — no PDF is ever produced (PRD OQ-7). Do not reinstate these checks; there is no artifact to verify. |

---

## 12. File ↔ Ticket Mapping

### 12.1 File → tickets that create/extend it

| File / artifact | Tickets (create → extend) |
|---|---|
| `package.json` | T-1 → T-17 (`subset-font` devDep, `fonts:subset` script), T-18 (build chain), T-20 (verify) → **T-19** (`wrangler` devDep) [v1.6] |
| `wrangler.jsonc` **[v1.6, new]** | **T-19** (assets-only Worker config, §10.3) |
| `package-lock.json` | T-1 → T-17 → **T-19** (`wrangler` install) [v1.6] |
| `tsconfig.json` | T-1 |
| `astro.config.mjs` | T-1 → T-4 (site), T-15 (sitemap + filter) → T-26 (**comments only** — scrub `resume.pdf` from the file-endpoint note and `'/resume/'` from the route list; `trailingSlash` and `sitemap.filter` untouched) → **T-29** (default host literal only) [v1.6] |
| `.gitignore` | T-1 |
| `.env.example` | T-4 → **T-29** (default host) → **T-30** (drop `CF_PAGES_BRANCH`/`CF_PAGES_URL` blocks) [v1.6] |
| `src/content.config.ts` | T-2 |
| `src/config/templates.ts` | T-2 (enum + name mapper; the sanctioned extension point per §4.2) |
| `src/config/sections.ts` | T-3 |
| `src/config/site.ts` | T-4 (**explicit non-change in v1.6**: holds no host literal, see §4.5) |
| `src/config/person.ts` | T-13 (shared facts), T-23 (jobTitle + real URLs) → T-26 (**comment only** — drop the `JsonLdProfilePage` second-caller claim) |
| `src/content/sections/home.md` | T-3 → T-23 (final copy) |
| `src/content/sections/about.md` | T-3 → T-25 (`order: 3 → 2`) → T-23 (final copy) |
| `src/layouts/BaseLayout.astro` | T-6 → T-12 (head slot wiring) |
| `src/components/Nav.astro` | T-5 |
| `src/components/Seo.astro` | T-12 → T-26 (**comment only** — the `'/resume/'` path example becomes `'/about/'`) |
| `src/components/JsonLdPerson.astro` | T-13 |
| `src/pages/[...slug].astro` | T-7 → T-12 (per-route Seo wiring) |
| `src/pages/404.astro` | T-11 → T-12 (Seo wiring) → T-26 (`.btn-download` → `.btn-primary` rename + comment scrub) |
| `src/pages/robots.txt.ts` | T-16 |
| `src/templates/HomeSection.astro` | T-8 → T-13 (JSON-LD include) → T-26 (link row trim) |
| `src/templates/AboutSection.astro` | T-10 |
| `src/assets/styles/global.css` | T-6 → T-17 (font-face rules) — **T-26 does NOT touch this file**; the `.btn-*` token is scoped in `404.astro` |
| `src/assets/fonts/*.woff2` (2 files) | T-17 |
| `scripts/font-src/*.ttf` (2 files) | T-17 (vendored subsetting inputs) |
| `scripts/gen-headers.mjs` | T-18 → T-27 (drop PDF rule; production writes nothing) → **T-30** (host-matched rule on every build) [v1.6] |
| `scripts/noindex-rule.mjs` **[v1.6, new]** | **T-30** (shared rule + host-pattern matcher, §10.1) |
| `scripts/subset-fonts.mjs` | T-17 → T-27 (input list) |
| `scripts/verify-static.mjs` | T-20 → T-27 (presence → no-résidue asserts) → **T-30** (rule 4e rewritten, §11.1) [v1.6] |
| `src/config/templates.ts` | T-2 (enum + name mapper) → T-25 (drop `'resume'` from the union **and** the JSDoc examples) |
| `src/config/sections.ts` | T-3 (unchanged by the removal — read that carefully) |
| `dist/_headers` (generated) | T-18 → T-27 (preview-only) → **T-30** (every build, host-matched) [v1.6] |
| `dist/sitemap-index.xml`, `dist/sitemap-0.xml` (generated) | T-15 |
| `README.md` | **[v1.6]** T-29 (default-host line) → T-30 (`CF_PAGES_BRANCH` bullet, build-row wording) → T-19 (every "Cloudflare Pages" occurrence incl. the Overview intro, plus a new Deploy section). No longer optional: it currently documents a platform that does not exist |

**Deleted-file ledger (v1.5).** These paths are mapped to their *deleting* ticket so that no file change is undescribed:

| Deleted file | Deleted by | Breaking-change note |
|---|---|---|
| `src/content/sections/resume.md` | T-25 | Must be deleted in the same commit as the template below |
| `src/templates/ResumeSection.astro` | T-25 | Leaving it behind = dead code that still satisfies the glob map; delete it |
| `src/components/JsonLdProfilePage.astro` | T-26 | `ProfilePage` leaves the site entirely |
| `public/resume.pdf` | **never existed** (T-24 cancelled before execution) | No `public/` directory exists at all — it was deleted at T-7 |

**Explicit non-change, recorded so no dev "helpfully" edits it:** `src/config/sections.ts`, `src/config/site.ts`, `src/content.config.ts`, `src/pages/[...slug].astro`, `Nav.astro`, and `BaseLayout.astro` need **zero** edits for the removal. That they don't is the design working as intended — the registry absorbed the scope change. `verify-static.mjs` proving the absence is the observable proof.

> **[Plan-review correction] Two files in the non-change list were wrong.** `astro.config.mjs` carries two
> stale *comments* (line ~13 naming `resume.pdf` as a file endpoint, line ~18 listing the three routes),
> so **T-26** does edit it — comments only, never the sitemap `filter` or `trailingSlash`. And
> `src/config/templates.ts` carries a `templateToComponentName` JSDoc example naming `'resume'`, so
> **T-25** edits that comment. The *behaviour* of both files is genuinely unchanged; only their prose
> was out of date. Lesson applied: "no code change" and "no text change" are different claims, and a
> removal ticket that asserts the first does not discharge the second.

### 12.2 Ticket → design sections it depends on

| Ticket | Design § |
|---|---|
| T-1 | §2, §3 |
| T-2 | §4.1–4.3 (§4.2 resolution supersedes enum wording) |
| T-3 | §4.1, §4.4 |
| T-4 | §4.5, §9 |
| T-5 | §4.1, §6.6 |
| T-6 | §6 (all), §3 |
| T-7 | §5.1 |
| T-8 | §6.2–6.4, §4.4 |
| T-9 | ~~§6.4, §4.4~~ — **RETIRED** (built under v1.2, deleted by T-25) |
| T-10 | §6.3, §4.4 |
| T-11 | §5.3, §6 |
| T-12 | §8.1, §4.5 |
| T-13 | §8.2–8.3 |
| T-14 | ~~§8.2–8.3~~ — **RETIRED** (built under v1.2, deleted by T-26) |
| T-15 | §9, §4.5 |
| T-16 | §5.4, §9 |
| T-17 | §7, §6.1 |
| T-18 | §10.1–10.2 |
| T-19 | §10 opening table, §10.2, §10.3 (the whole ordered procedure), §11.3 live-deploy row **[v1.6]** |
| **T-29** | §4.5, §9, §1.3 **[v1.6]** |
| **T-30** | §10.1, §11.1 rule 4e, §11.3 headers row **[v1.6]** |
| T-20 | §11.1–11.2 |
| T-21 | §6.2–6.3, §11.3 |
| T-22 | §4.1–4.2, §5.1 (stub needs `now.md` + `NowSection.astro` only — enum already contains `now`) |
| T-23 | §4.4 (copy), §8.2 (person.ts facts) |
| T-24 | **CANCELLED** — no PDF artifact; see §11.3's struck-through row |
| T-25 | §3 (deleted-file ledger), §4.1–4.2 (enum), §4.4 (order re-point), §5.2 (route table), §6.6 |
| T-26 | §3 (deleted-file ledger), §6.4 (`.btn-primary` token + link row), §6.6, §8.2–8.3 (single-JSON-LD node + `RES-X4`) |
| T-27 | §7 (subset input list), §10.1 (headers behaviour), §10.2 (script chain), §11.1 (rule 3b, no-résidue asserts) |
| T-28 | §5.2, §6.5, §8.3, §9, §10.1, §11.1, §11.3 (the full removal-regression row) |

### 12.3 Coverage counts

**Recomputed 2026-09-26 against the actual repository** (`git ls-files`, excluding `node_modules/`, `dist/`, and `projects/`). The previously published "33 → 31" figures were asserted, never counted, and were wrong; the corrected arithmetic is below.

- **Tracked files in the repo:** 65 total = **37** build/repo files + **28** AI-SDLC artifacts (6 planning documents + 22 QA reports, `T-1`…`T-22`; `T-24` has none because it never ran).
- **Design-owned files: 37** — the 37 non-`projects/` tracked files above, which is exactly the §12.1 mapping table's row count (37 rows), so **no unmapped files**. Of these, 34 are live in v1.5 and **3 are deleted by the removal chain** (`src/content/sections/resume.md`, `src/templates/ResumeSection.astro`, `src/components/JsonLdProfilePage.astro`).
- **Post-removal end state: 34** live build/repo files (37 − 3). `public/` never appears in either number: it was deleted at T-7 and no PDF was ever created.
- **Plus 4 entries in the deleted-file ledger** (§12.1) — 3 real deletions above, plus `public/resume.pdf` which **never existed** and is recorded only so a reader does not go looking for it.
- **Generated files** are not counted in the 37 (they are build output, not repo files): `sitemap-0.xml`, `sitemap-index.xml`, `dist/_headers`. They are mapped separately in §12.2 as generated rows.
- **Ticket coverage: all 28 T-IDs** (T-9/T-14 retired, T-24 cancelled, T-25…T-28 new) appear as a creator, extender, or deleter of ≥1 file **and** have a §12.2 mapping — no orphan tickets, no unmapped files. `README.md` is the only optional file (T-19, ticket-labelled optional).
- **v1.2 → v1.5 delta:** 24 → 28 tickets; the file count moves **37 → 34 live** purely via the 3 removals. There was no `public/resume.pdf` file to remove and no new script file to add — `scripts/subset-fonts.mjs` already shipped at T-17 and only gains a one-line input-list edit at T-27.
- **v1.5 → v1.6 delta:** 28 → **30** tickets (`T-29`, `T-30` new; `T-19` rewritten in place). **+2 design-owned files**: `wrangler.jsonc` (T-19) and `scripts/noindex-rule.mjs` (T-30), both mapped in §12.1. **Counted 2026-09-27:** `git ls-files` outside `projects/` returns **38**, not 34, and includes files §12.1 does not map (`public/favicon.svg` from `2821f47`, `.node-version`, `.vscode/*`, `AGENTS.md`, `CLAUDE.md`). None is a deploy file, so v1.6 records the drift here rather than re-mapping them; a later design pass should reconcile §12.1/§12.5 with them.

### 12.4 Temporary test artifacts (T-22)

`src/content/sections/now.md`, `src/templates/NowSection.astro` — created and reverted **within** T-22 (`qa/`); they are validation fixtures, not design deliverables, and never ship. `git diff --stat` after the test must show zero changes to `Nav.astro`, `BaseLayout.astro`, `[...slug].astro`, `astro.config.mjs`, or `content.config.ts` (REG-6 assert).

### 12.5 Files with no owning ticket

**None required.**
- `README.md`: optional, owned by T-19 (`[DEVIATION]` none — the ticket itself lists it as optional).
- No favicon is shipped in v1 (the browser's same-origin `/favicon.ico` 404 is harmless and invisible). If one is ever wanted, it is an **unticketed addition** — flagged for the planner, deliberately excluded from this design to keep the file↔ticket mapping exact.

---

## 13. Required Skills

Availability legend: `[catalog]` = present in the agent skill catalog; `[gap]` = **not** in the catalog — flag to the planner/orchestrator to add, or the dev sub-agent works without a specialized skill for that ticket.

| Ticket(s) | Skills required | Availability |
|---|---|---|
| T-1, T-4, T-7 | `typescript`, `astro`, `npm`, `vite` (import.meta.glob) | `[catalog] typescript-best-practices`; `astro`/`npm`/`vite` `[gap]` |
| T-2, T-3 | `typescript`, `astro`, `zod`, `markdown` | `[catalog] typescript-best-practices`, `principle-type-system-discipline`, `principle-boundary-discipline`; `astro`/`zod`/`markdown` `[gap]` |
| T-5, T-6, T-8–T-11 | `astro`, `css`, `html`, `a11y` | `[gap]` — no `css`/`a11y`/`html` skill in catalog (recommend adding `web-accessibility`, `astro` skills) |
| T-12 | `astro`, `seo`, `html` | `seo` `[gap]` |
| T-13, T-14 | `json-ld`, `typescript` | `json-ld` `[gap]`; `[catalog] type-system/boundary disciplines apply` |
| T-15, T-16 | `astro`, `seo` | `seo` `[gap]` |
| T-17 | `css`, `font-subsetting` (`subset-font`), `npm` | `font-subsetting` `[gap]` |
| T-18 | `node`, `ci/cd-cloudflare`, `http-caching` | `[gap]` (recommend adding `node-scripts`, `cloudflare-pages`); `principle-boundary-discipline` applies to env handling |
| **T-29** [v1.6] | `astro`, `npm` (config default + docs) | `astro` `[gap]`; trivial string change guarded by the existing verify gate |
| **T-30** [v1.6] | `node`, `regex/parsing`, `ci/cd-cloudflare` (`_headers` host-matching) | `[gap]`; `principle-boundary-discipline` `[catalog]` applies: the rule derives from build output, never env |
| T-19 | `ci/cd-cloudflare` (Workers static assets, Workers Builds, Wrangler), `devops`, `git` | `[gap]` (recommend `cloudflare-workers`; **not** `cloudflare-pages`, which describes a retired product) |
| T-20 | `node`, `regex/parsing`, `typescript` | `[gap]` for node/regex; `principle-boundary-discipline` `[catalog]` applies to output scanning |
| T-21 | `lighthouse`, `a11y`, `performance`, `css` | `[gap]` (recommend `lighthouse-audit`, `web-accessibility`) |
| T-22 | `astro`, `typescript`, `git` | as T-7; `[catalog] type-system discipline` |
| T-23 | `copywriting-review` (human review of owner copy), `typescript`, `markdown` | `[gap]` — ticket is HUMAN-BLOCKED; owner supplies copy, human reviews; dev only trims wiring |
| **T-25** | `astro`, `typescript`, `git` (file deletion + enum narrowing) | as T-7/T-2; `[catalog] type-system discipline` applies to removing a union member safely |
| **T-26** | `astro`, `css`, `json-ld`, `git` (import-sweep surgery) | `json-ld`/`css` `[gap]`; `[catalog] boundary-discipline` applies to the "validate the surviving import" check |
| **T-27** | `node`, `regex/parsing`, `http-caching` | as T-20; `http-caching` `[gap]` — note the **caching** half of this ticket is cancelled, only the env-branch logic remains |
| **T-28** | `lighthouse`, `a11y`, `node` (assert orchestration) | as T-21; this is the ticket that most needs `node`/regex skills to grep built output |
| ~~T-24~~ | ~~`pdf-verification`~~ | **CANCELLED — skill no longer required.** Recorded so the gap list below does not imply a pending need. |

**Catalog-gap summary (explicit):** specialized skills for `astro`, `css`, `a11y`/web accessibility, `seo`, `json-ld`, `node` scripting, `ci/cd-cloudflare`/Cloudflare Pages, `http-caching`, `font-subsetting`, `lighthouse`, and `copywriting-review` do **not** exist in the current skill catalog. **[v1.5] `pdf-verification` is removed from this list** (its only consumer, T-24, was cancelled). The `typescript-best-practices`, `principle-type-system-discipline`, and `principle-boundary-discipline` skills cover the TypeScript/typed-boundary portions. The orchestrator should either add the gap skills or accept default behavior for those tickets.

---

## 14. Removal Execution Order (normative, v1.5)

The removal is four tickets with a hard ordering constraint that is easy to get wrong, so it is stated here normatively rather than left to the ticket graph:

| Step | Ticket | Why it must be here |
|---|---|---|
| 1 | **T-25** | Delete `resume.md` **and** `ResumeSection.astro` in the same commit. Deleting the content file alone leaves a glob-map entry with no page; deleting the template alone leaves a registered section that fails the build (§5.1). Neither is a shippable intermediate state. |
| 2 | **T-26** | Trim the Home link row, delete `JsonLdProfilePage.astro`, rename the CSS token. Depends on T-25 because the Home row references the route T-25 deleted. **Verify `Person` JSON-LD still renders in this same commit** (`RES-X4`) — this is the only step that can silently break surviving functionality. |
| 3 | **T-27** | Script sweep. Depends on T-25 (the deleted page must be gone before `subset-fonts.mjs`'s input list is corrected) and on T-18/T-20 (both scripts already exist). |
| 4 | **T-28** | Full regression. Must be last: it is the only ticket whose assertions are meaningful, and running it before T-26/T-27 would pass against a half-removed site. |
| 5 | **T-19** | First deploy. Depends on T-28, so **the résumé is never deployed to production even once.** This ordering is the whole point of the re-plan. **[v1.6]** Also depends on `T-29` (host) and `T-30` (noindex); see §10. |

**Commit-shape rule:** T-25 and T-26 may be separate commits; T-27 and T-28 may be separate commits. But **T-28 must not be merged, and T-19 must not run, until all four removal tickets are green**, and T-28's report must be attached to the T-19 deploy ticket as evidence that the shipped site has no résumé residue.

**Rollback note:** because nothing résumé-related has been deployed, there is nothing to roll back in production. Reverting a removal commit is a normal code revert; no redirect is needed because no public URL ever pointed at a résumé (R1 in the tickets' risk table).

---

*The six deferred decisions are resolved reproducibly above; the routing shape is a single catch-all route; the file↔ticket mapping is complete with zero unowned required files, and the v1.5 removal is specified as precisely as the original build. A dev sub-agent may implement any single ticket T-1..T-28 from this document plus the ticket file without further architectural decisions.*
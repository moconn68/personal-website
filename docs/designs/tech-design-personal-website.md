# Technical Design — Personal Website v1 (Matthew O'Connell)

> **Upstream:** `docs/PRDs/PRD-personal-website.md` (v1.2) · `docs/tickets/tickets-personal-website.md` (T-1..T-24)
> **Status:** Normative for implementation. Where this design and a ticket's *literal acceptance wording* conflict, this document **supersedes** the ticket wording — every such deviation is flagged inline with `[DEVIATION]`.
> **Date:** 2026-09-21 · **Architect:** Software Architect (AI SDLC)

---

## 1. Design Summary

### 1.1 Architecture overview

The **Section Registry is the keystone** of the system. All site structure — page routes, navigation, sitemap URLs, canonical URLs, structured data — derives from one typed content collection plus two pure helpers. Adding a section in v2 means: write a content file, add a template component, and (for out-of-cap templates only) extend one enum const. Zero changes to nav, layout, route, or sitemap code.

```
                 CONTENT                     REGISTRY                        DERIVED SURFACES
┌──────────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────────┐
│ src/content/sections/        │   │ src/content.config.ts     │   │ src/pages/[...slug].astro     │
│   home.md  (order 1)         │──▶│   glob loader + Zod schema │──▶│   getStaticPaths() → routes  │
│   resume.md (order 2)        │   │   (closed template enum)   │   │   /   /resume/  /about/       │
│   about.md (order 3)         │   │                           │   │        │                      │
└──────────────────────────────┘   │ src/config/templates.ts   │   │        ▼  import.meta.glob   │
                                   │   TEMPLATES const (cap)   │   │   src/templates/*Section.astro│
          TEMPLATES, sectionPath ◀─│ src/config/sections.ts    │   └──────────────┬───────────────┘
                                   │   getSections() sorted    │                  │ layout
              SITE_URL ◀───────────│ src/config/site.ts        │   ┌──────────────▼───────────────┐
                                   └───────────────────────────┘   │ src/layouts/BaseLayout.astro  │
                                                                  │  <header>→Nav (registry-derived)│
   NAV (T-5)  ────────────── Nav.astro iterates getSections()      │  <main>  →slot→ <template>     │
   SITEMAP (T-15) ────────── @astrojs/sitemap over registry routes │  <footer>→copyright (home name)│
   CANONICAL (T-12) ──────── absoluteUrl(sectionPath(entry))       └──────────────────────────────┘
   ROBOTS (T-16) ─────────── Sitemap: {SITE_URL}/sitemap-index.xml
   JSON-LD (T-13/14) ─────── src/config/person.ts (single facts source)

   BUILD: astro build ─▶ dist/ (static) ─▶ node scripts/gen-headers.mjs ─▶ dist/_headers
   DEPLOY: git push ─▶ Cloudflare Pages (production branch main) ─▶ https://mattoconn.pages.dev
   GATE: npm run verify (zero-JS + zero-third-party + presence asserts) — retrofitted after T-20
```

### 1.2 Data flow

1. Author edits a Markdown file under `src/content/sections/`.
2. `glob()` loader (Content Layer API) reads it; Zod validates frontmatter (closed template enum, `description ≤160`, URL fields).
3. `getSections()` (sorted by `order`) is the single registration query. `sectionPath(entry)` is the **single** slug→URL mapping (home → `/`, others → `/{slug}/`).
4. `[...slug].astro` `getStaticPaths()` emits one route per section; `import.meta.glob('../templates/*.astro')` dispatches to `{TemplateName}Section.astro`.
5. `Nav.astro`, `Seo.astro` (canonical), `@astrojs/sitemap`, and `robots.txt.ts` all read the same helpers — so nav, sitemap, and canonicals are byte-consistent by construction.
6. Templates and JSON-LD read shared typed data (`home.md` frontmatter + `src/config/person.ts`). Every personal fact is a marked `HUMAN COPY` placeholder until T-23/T-24.

### 1.3 Deployment topology

- **Cloudflare Pages free tier** (DEP-1 decided by PRD v1.2). Static output only; no server runtime (NF-6).
- Git-push deploys (production branch `main`), build command `npm run build`, output dir `dist`.
- Production env var `PUBLIC_SITE_URL=https://mattoconn.pages.dev` (T-4 wiring, T-19). Preview/PR builds **must not** set `PUBLIC_SITE_URL` (R10).
- Preview `noindex` via branch-triggered `_headers` generation (SEO-12, §10).
- Subdomain `mattoconn.pages.dev`; if unavailable at deploy time → **stop and escalate to planner** (DEP-5, R1). Never rename silently.

### 1.4 Hard constraints (encoded in every section below)

| Constraint | Enforcement |
|---|---|
| Zero client JS shipped | `<script>` only as `application/ld+json` data blocks (exempt per PRD §9/OQ-3); `verify-static.mjs` fails on all else (T-20) |
| No backend / auth / analytics / CMS | Static Astro build only; no islands (NF-5/NF-6) |
| No custom domain | `SITE_URL` default `https://mattoconn.pages.dev` only |
| No third-party requests on load | Self-hosted subset fonts; `verify-static.mjs` origin check (NF-4) |
| Typed discipline / Zod at boundary | Zod schema in `content.config.ts`; TypeScript strict; helpers in `src/config/*` (type-system + boundary-discipline) |
| Every personal fact is HUMAN COPY until T-23/T-24 | Skeleton files carry literal `HUMAN COPY` markers; `person.ts` jobTitle is a marked constant; devs never invent facts |
| Single `SITE_URL` source | `src/config/site.ts`; used by astro.config, Seo, JSON-LD, robots, gen-headers consumers; `CF_PAGES_URL` never used as site URL (T-4) |
| Subdomain never silently changed | T-19 escalate rule |

### 1.5 Resolved decisions (the six deferred items + routing)

| # | Decision (normative) |
|---|---|
| D1 (enum) | **Pre-include** the four capped future templates: `TEMPLATES = ['home','resume','about','projects','blog','now','uses']`. See §4.2 for justification. |
| D2 (routing) | Single catch-all `src/pages/[...slug].astro`; home → `/` via `params: { slug: undefined }`. See §5. |
| D3 (styling) | Plain **scoped CSS** + one `global.css` reset/tokens. No Tailwind. See §6. |
| D4 (fonts) | **IBM Plex Sans** (OFL), weights 400/600, `@font-face` with `font-display: swap`, subset via `glyphhanger` to page-used glyphs. See §7. |
| D5 (404) | `src/pages/404.astro` is a fixed page (NOT a registry section); markup + `noindex` inline; `error` is **not** an enum value. |
| D6 (preview noindex) | Detect via `CF_PAGES_BRANCH` ≠ `main` (production branch). See §10. |

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
| Fonts | `glyphhanger` (devDep, Node-based; **not** Python WeasyPrint) + vendored IBM Plex Sans TTFs | T-17 (D4) |
| Node | `node >= 20` (**22 LTS recommended**); set `NODE_VERSION=22` env on the Cloudflare Pages project if its default lags | Astro 7 engine requirement |
| Output | `dist/`, `build.format: 'directory'` (default), `trailingSlash: 'always'` | §4.4, §9 |
| Package scripts | `dev`, `build`, `preview`, `check`, `verify`, `fonts:subset` (exact block in §10.2) | T-1, T-18, T-20, T-17 |

---

## 3. Repo Layout

Full proposed tree. Every path below is referenced by at least one ticket (mapping proof in §12).

```
personal-website/
├── .env.example                     # T-4: PUBLIC_SITE_URL + CF_PAGES_BRANCH docs (no real .env committed)
├── .gitignore                       # T-1: node_modules/, dist/, .env*, wrangler junk
├── astro.config.mjs                 # T-1/T-4/T-15: site, trailingSlash, sitemap integration
├── package.json                     # T-1 + T-17/T-18/T-20 scripts
├── package-lock.json                # T-1
├── tsconfig.json                    # T-1: extends astro/tsconfigs/strict
├── public/
│   └── resume.pdf                   # T-24 (HUMAN-BLOCKED; absent until then — link 404s by design)
├── scripts/
│   ├── font-src/                    # T-17: vendored IBM Plex Sans TTFs (OFL), subsetting inputs
│   │   ├── IBMPlexSans-Regular.ttf
│   │   └── IBMPlexSans-SemiBold.ttf
│   ├── gen-headers.mjs              # T-18: writes dist/_headers (cache + preview noindex)
│   └── verify-static.mjs            # T-20: zero-JS / zero-third-party / presence gate
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
    │   ├── JsonLdPerson.astro       # T-13: Person node (Home)
    │   └── JsonLdProfilePage.astro  # T-14: ProfilePage node (Résumé)
    ├── config/
    │   ├── templates.ts             # T-2: TEMPLATES enum const + Template type + name mapper (pure module)
    │   ├── sections.ts              # T-3: getSections(), sectionPath(); re-exports templates.ts
    │   ├── site.ts                  # T-4: SITE_URL, SITE_ORIGIN, path(), absoluteUrl()
    │   └── person.ts                # T-13/T-14: single Person facts source (T-23 updates facts)
    ├── content/
    │   └── sections/
    │       ├── home.md              # T-3 skeleton → T-23 HUMAN copy
    │       ├── resume.md            # T-3 skeleton
    │       └── about.md             # T-3 skeleton → T-23 HUMAN copy
    ├── layouts/
    │   └── BaseLayout.astro         # T-6: html/head-slot/header/main/footer/skip-link
    ├── pages/
    │   ├── [...slug].astro          # T-7: registry routes + template dispatch (+ T-12 head wiring)
    │   ├── 404.astro                # T-11: fixed not-found page, noindex
    │   └── robots.txt.ts            # T-16: prerendered robots.txt endpoint
    └── templates/
        ├── HomeSection.astro        # T-8 (+ T-13 JSON-LD)
        ├── ResumeSection.astro      # T-9 (+ T-14 JSON-LD)
        └── AboutSection.astro       # T-10
```

Generated (gitignored): `dist/**` incl. `dist/_headers` (T-18), `dist/sitemap-index.xml`, `dist/sitemap-0.xml` (T-15).

> Optional, ticket-owned: `README.md` (T-19 "deploy note (optional)"). No other unowned files are required — see §12.5.

---

## 4. The Section Registry (normative)

### 4.1 `src/config/templates.ts` — the enum, the single sanctioned extension point

```ts
// Pure module: NO imports from 'astro:content' — imported by both content.config.ts
// (schema, runs in the content-layer context) and sections.ts (app context).
export const TEMPLATES = ['home', 'resume', 'about', 'projects', 'blog', 'now', 'uses'] as const;
export type Template = (typeof TEMPLATES)[number];

/** 'home' → 'HomeSection', 'resume' → 'ResumeSection', ... */
export function templateToComponentName(template: Template): string {
  return `${template.charAt(0).toUpperCase()}${template.slice(1)}Section`;
}
```

### 4.2 REG-7 / US-9 enum tension — RESOLVED (option a)

**Decision: pre-include the four capped future templates.** `error` is deliberately **not** in the enum.

- Pre-including `projects|blog|now|uses` makes US-9/T-22's manual test a true two-file change — content file + template component — with **zero schema edits**, which is the cleanest reading of "typed content file plus one registration entry" and of T-22's "single sanctioned module" intent (the file is still the sole place templates are enumerated; nothing in it needs to change for the stub).
- REG-7's cap is preserved precisely: the enum remains **closed** at exactly the four budgeted future sections; the 404's `error` rendering stays out of the registry (§5.4) so no enum value is orphaned.
- If an **unbudgeted** template is ever required (beyond REG-7's four), the one-line extension is: append to `TEMPLATES` in `src/config/templates.ts` and add `{Name}Section.astro` — documented here as the sanctioned extension point.

**Exact enum value set for v1:** `home | resume | about | projects | blog | now | uses` (7 values). Only `home|resume|about` have content files + templates in v1; the other four are valid *types* that simply have no registered content yet. `[DEVIATION from T-2 literal wording]`: T-2's acceptance lists `z.enum(['home','resume','about','error'])`; this design moves the enum to the shared `TEMPLATES` const, drops `error` (resolved per the ticket's own "exact binding decided in tech design §Routing & Templates" note), and pre-includes the four capped names per REG-7. A content file with `template: 'error'` or `template: 'bogus'` **fails the build** (closed enum) — satisfying T-2's negative test.

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

- Home is the only section that *uses* `github`/`linkedin`; other sections simply omit them. `description` doubles as the page meta description and as the home proof line / résumé context line — one source, unique per page (SEO-7).
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
# src/content/sections/resume.md
---
slug: resume
title: Résumé
navLabel: Résumé
order: 2
template: resume
description: "HUMAN COPY — one line of context for the résumé landing page (≤160 chars)."
---
```

```md
# src/content/sections/about.md
---
slug: about
title: About
navLabel: About
order: 3
template: about
description: "HUMAN COPY — one-line teaser of the About page (≤160 chars)."
---

**HUMAN COPY — paragraph 1.** First-person intro.

**HUMAN COPY — paragraph 2.** More story.

**HUMAN COPY — paragraph 3.** Hobby thread.

**HUMAN COPY — paragraph 4.** Optional closing.
```

### 4.5 `src/config/site.ts` — the single URL source (T-4)

```ts
const DEFAULT_SITE_URL = 'https://mattoconn.pages.dev';

export const SITE_URL: string =
  (import.meta.env.PUBLIC_SITE_URL as string | undefined)?.replace(/\/+$/, '') ?? DEFAULT_SITE_URL;

export const SITE_ORIGIN: string = new URL(SITE_URL).origin;

/** Single trailing-slash policy: pages ALWAYS end in '/' (root is '/'); file paths never do. */
export function path(p: string): string {
  const cleaned = p.replace(/^\/+|\/+$/g, '');
  return cleaned === '' ? '/' : `/${cleaned}/`;
}

export function absoluteUrl(p: string): string {
  return `${SITE_URL}${path(p)}`;
}
```

- **ONE trailing-slash policy, stated:** pages use `trailingSlash: 'always'` (surfaced in `astro.config.mjs`), so `/resume/` is the only canonical form; file endpoints (`robots.txt`, `resume.pdf`, `sitemap-*.xml`) never take a slash. Nav `href`s, canonicals, and sitemap URLs are therefore **byte-identical** (R8, SEO-11).
- `CF_PAGES_URL` is never read as the site URL (T-4 critical constraint) — previews get `noindex` instead (§10).
- `astro.config.mjs` mirrors the same default from `process.env` (config runs in Node): `site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev'`.
- `.env.example` documents `PUBLIC_SITE_URL` and `CF_PAGES_BRANCH` (for local noindex simulation); no real `.env` is committed.

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
- Title pattern per SEO-6: home → `home.title`; others → `{home.title} — {entry.data.title}` (e.g. `Matthew O'Connell — Résumé`). `[NOTE]`: the PRD's SEO-6 example says "Matt O'Connell — {section}", but T-3 pins the home entry title as `Matthew O'Connell` — the pattern is mechanical off the registry, and spelling is owner copy (T-23). Tickets T-12 was aligned to this registry-derived pattern during plan review.

### 5.2 Built-route contract

| Route | Source | Output | Head (via Seo) |
|---|---|---|---|
| `/` | `[...slug]` home entry (`slug: undefined`) | `dist/index.html` | `Matthew O'Connell` + home description |
| `/resume/` | `[...slug]` resume entry | `dist/resume/index.html` | `Matthew O'Connell — Résumé` + resume description |
| `/about/` | `[...slug]` about entry | `dist/about/index.html` | `Matthew O'Connell — About` + about description |
| `/404/` (page) | `src/pages/404.astro` | `dist/404.html` | `404 — Page not found` + fixed description + `<meta name="robots" content="noindex">` |
| `/robots.txt` (endpoint) | `src/pages/robots.txt.ts` (prerendered) | `dist/robots.txt` | — |

### 5.3 `src/pages/404.astro` — the fixed 404 binding

**Decision:** 404 is a **fixed page**, not a registry section, and there is **no ErrorSection.astro** (T-11's option is declined). Keeping `src/templates/` in a one-component-per-*shipped*-template relationship with the enum is an invariant worth more than a reusable error component: `glob` map keys == the shipped `TEMPLATES` subset (`home|resume|about`) is provable at a glance, while the four dormant enum values (`projects|blog|now|uses`) are valid types that simply have no component yet — a registered section without its component **fails the build** (§5.1), never silently 404s.

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
    <a class="btn-download" href="/">Back to home</a>
  </section>
</BaseLayout>
```

`noindex` (SEO-3 hygiene), keyboard-focusable ≥44px home link, uses BaseLayout so all four pages share landmarks (T-6 verification), excluded from sitemap (§9).

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

Sitemap: https://mattoconn.pages.dev/sitemap-index.xml
```

Global allow-plus named AI-bot Allow blocks (SEO-4), **no Disallow rules anywhere**, `Sitemap:` generated from `SITE_URL`, pointing at the exact `@astrojs/sitemap` index filename and therefore byte-identical with the built file (§9).

---

## 6. Layout & Styling (normative)

### 6.1 Scoped CSS vs Tailwind — pick **plain scoped CSS**

Defense: this is a zero-JS, four-page, three-template site with no shared component-library ambition. Scoped CSS ships as native `data-astro-*` attribute scoping — zero runtime, zero build-layer dependency, ~5 KB total CSS. Tailwind would add a build layer, an HTML class vocabulary, and a maintenance burden for zero interaction states. All global tokens/reset live in `src/assets/styles/global.css`; per-page/per-component styles live in each `.astro` file's `<style>` block (Astro auto-scopes). **No event-handler attributes, no `style=` attributes, no CSS-in-JS anywhere.**

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
- **Link row** (Home): GitHub, LinkedIn from registry frontmatter; Résumé and About from `sectionPath` of the corresponding registry entries — never literal `/resume` (REG-3 discipline). Each link `min-height: 44px` with generous padding.
- **Nav pattern**: `<header>` contains `<Nav>` (registry-iterated `<ul>`); brand = home item; links ≥44px hit area; active item gets `aria-current="page"` + accent color + underline (never color alone).
- **Footer pattern**: one line — `© {year} {home.data.title}` — name read from the registry home entry, never hardcoded (T-6).
- **Résumé CTA token** (the single primary action, T-9): `.btn-download` — `min-height: 48px`, `padding-inline: 1.5rem`, accent background, white text 600, radius 8px, `display:inline-flex; align-items:center`, `:hover` → `--color-accent-hover`, focus ring visible. Used also for the 404 "Back to home" link. No other CTAs on the résumé page.

### 6.5 Accessibility baseline

- `lang="en"`, landmarks `<header>/<nav>/<main>/<footer>` on every page (SEO-9, T-6).
- **Skip-link: YES.** A visually-hidden `.skip-link` is the first element in `<body>`, targets `#main` (satisfies WCAG 2.4.1 with minimal cost).
- Focus styles: `:focus-visible` **and** `:focus` get `outline: 2px solid var(--color-accent); outline-offset: 2px` (visible fallback), never `outline: none`.
- **Color-only-never**: inline text links are always underlined; nav active uses underline + `aria-current="page"`; focus is never conveyed by color alone.
- Buttons/links: `--touch-min: 44px` everywhere (NF-2); `prefers-reduced-motion: reduce` disables transitions (zero animations in v1 by design).
- One `h1` per page; prose uses `<article>` on About (T-10) and `<section>` elsewhere; decorative `404` code uses `aria-hidden`.

### 6.6 Component hierarchy (Astro)

```
[index] 404.astro ───────────────► BaseLayout.astro ──► Nav.astro (registry)
 [...slug].astro ── getStaticPaths ─► TemplateComponent (HomeSection | ResumeSection | AboutSection)
   BaseLayout (slot:head = Seo.astro; slot:default = TemplateComponent)
   HomeSection.astro ── JsonLdPerson.astro
   ResumeSection.astro ── JsonLdProfilePage.astro
   AboutSection.astro (renders entry body via render(entry) → <Content />)
```

State: **zero client state** (static). Build-time data flows `props` + `Astro.props`; the only shared "state" is the registry (`getSections()`) and `SITE_URL`, both typed modules. Navigation changes: none beyond the registry (T-22 proves it).

---

## 7. Fonts (normative)

- **Family: IBM Plex Sans** (OFL-licensed). Rationale: engineered, unpretentious, distinctive without being decorative — matches the site's identity; single family per scope cap (vision §7 said serif-pairing is allowed but the tickets cap at one family, 1–2 weights).
- **Weights: 400 (regular) + 600 (semibold)** — body + headings/CTA/nav.
- **Source:** vendored TTFs at `scripts/font-src/` (downloaded from the IBM Plex OFL distribution during T-17 and **committed** so subsetting is hermetic/repeatable; never fetched at build time).
- **Subsetting:** `glyphhanger` (Node; **not** Python WeasyPrint). One-shot command, documented and re-run when copy changes (T-23):

```sh
npx glyphhanger \
  --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 —–''’“”" \
  --subset=scripts/font-src/IBMPlexSans-Regular.ttf \
  --subset=scripts/font-src/IBMPlexSans-SemiBold.ttf \
  --formats=woff2 --output=src/assets/fonts \
  dist/index.html dist/resume/index.html dist/about/index.html dist/404.html
```

Rename the produced subset files to the pinned names `src/assets/fonts/ibm-plex-sans-400.woff2` and `ibm-plex-sans-600.woff2` (if the installed glyphhanger output naming differs, rename to these exact names — the CSS references them). The `.ttf` sources stay in `scripts/font-src/` for reproducibility; the subsetted `.woff2` output is **committed** (build never depends on glyphhanger — T-17 is a one-shot asset ticket).
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

### 8.2 `src/config/person.ts` — the ONE shared facts module (T-13/T-14, facts at T-23)

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

**Fact flow:** name/url/sameAs come from the registry (home entry + SITE_URL); `jobTitle` is a marked constant here. Home `JsonLdPerson` and Résumé `JsonLdProfilePage` both call this **one** module — no duplicated facts (T-14 requirement).

### 8.3 JSON-LD components and placement — RESOLVED

`JsonLdPerson.astro` and `JsonLdProfilePage.astro` serialize inline `<script type="application/ld+json">` data blocks **at the top of each template's section markup (inside `<body>`/`<main>`)**, not in `<head>`:

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

`JsonLdProfilePage.astro` emits `{ '@context', '@type': 'ProfilePage', name: `${p.name} — Résumé`, url: absoluteUrl('resume'), mainEntity: { '@type': 'Person', ...same facts... } }`.

`[DEVIATION from T-13/T-14 wording]`: the tickets say "Home page `<head>` includes …". Putting data blocks in the **body** is deliberate: Google and AI crawlers parse JSON-LD anywhere in the document, and head-placement would force the route file to know per-template metadata, violating REG-6's "zero per-section wiring". The `<script>` blocks are data, **exempt** from the zero-JS scanner (T-20) wherever they appear; `is:inline` guarantees Astro leaves them untouched. This is noted for the T-21 QA pass.

---

## 9. Sitemap & robots (normative)

`astro.config.mjs` (T-4/T-15):

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev';

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
- Sitemap URLs derive from the registry's generated routes (T-7) and are **exactly** `/`, `/resume/`, `/about/` — trailing-slash policy shared with canonical/nav (R8). The integration already skips non-page endpoints (robots.txt) and status pages (404) by default; the explicit `filter` keeps that exclusion visible and future-proof.
- `/404.html` also carries `noindex` (§5.3) so a deindexed 404 can never leak into search.

---

## 10. Headers & Deploy (normative)

### 10.1 `scripts/gen-headers.mjs` (T-18) — preview-noindex detection RESOLVED

**Detection: `CF_PAGES_BRANCH`.** Production build ⇔ this env var is absent (local builds) or equals the production branch `main`. Any other set value (PR branch names, preview branches, `preview`) ⇔ non-canonical host ⇔ emit the global noindex rule. `CF_PAGES_URL` is **rejected** as a discriminator: Cloudflare sets it on production deploys too, so its mere presence cannot distinguish preview from prod; branch comparison can. (R2/R10).

```js
// scripts/gen-headers.mjs — run AFTER `astro build` (chained in package.json).
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_BRANCH = 'main';             // the Cloudflare Pages production branch
const branch = process.env.CF_PAGES_BRANCH; // undefined locally = production semantics
const isProduction = !branch || branch === PROD_BRANCH;

const resumeRule = [
  '/resume.pdf',
  '  Cache-Control: public, max-age=60, must-revalidate',
].join('\n');

const noindexRule = [
  '/*',
  '  X-Robots-Tag: noindex',
].join('\n');

const body = isProduction
  ? `${resumeRule}\n`
  : `${resumeRule}\n\n${noindexRule}\n`;

mkdirSync(resolve('dist'), { recursive: true });
writeFileSync(resolve('dist/_headers'), body, 'utf8');
console.log(`[gen-headers] wrote dist/_headers (${isProduction ? 'production' : `preview noindex (branch=${branch})`})`);
```

Exact `dist/_headers` content — production branch:

```
/resume.pdf
  Cache-Control: public, max-age=60, must-revalidate
```

Preview (`CF_PAGES_BRANCH=preview-x npm run build`):

```
/resume.pdf
  Cache-Control: public, max-age=60, must-revalidate

/*
  X-Robots-Tag: noindex
```

Cloudflare applies the most-specific rule per path (`/resume.pdf` wins over `/*` for that file). The `Cache-Control` value is byte-exact per DEP-7. The noindex rule must keep pages **crawlable** (no robots.txt Disallow) so the noindex signal takes effect (SEO-12).

### 10.2 `package.json` build chain (T-1/T-18/T-19/T-20)

```json
{
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && node scripts/gen-headers.mjs",
    "preview": "astro preview",
    "check": "astro check",
    "verify": "node scripts/verify-static.mjs",
    "fonts:subset": "npx glyphhanger --whitelist=... --subset=scripts/font-src/IBMPlexSans-Regular.ttf --subset=scripts/font-src/IBMPlexSans-SemiBold.ttf --formats=woff2 --output=src/assets/fonts dist/index.html dist/resume/index.html dist/about/index.html dist/404.html"
  }
}
```

`npm run build` runs headers generation **after** Astro's build, inside one command — Cloudflare never sees a dist without `_headers`.

### 10.3 Cloudflare Pages deployment (T-19) — dashboard flow, no wrangler file

1. "Connect to Git" → repo → production branch `main`, build command `npm run build`, output directory `dist`.
2. Project env (production): `PUBLIC_SITE_URL=https://mattoconn.pages.dev`. **Never** set it on preview builds (R10); `CF_PAGES_BRANCH` is auto-provided by Cloudflare.
3. Subdomain `mattoconn.pages.dev` (project name `mattoconn`) — verify availability during T-19; **if unavailable, stop and escalate to the planner** (DEP-5/R1; no silent rename).
4. Post-T-20 retrofitted gate: Cloudflare build command becomes `npm run build && npm run verify` — zero-JS/zero-third-party/presence checks block bad deploys.
5. Smoke checks: `curl -sI https://mattoconn.pages.dev/ | head -1` → 200; `curl -sI https://mattoconn.pages.dev/resume.pdf | rg -i 'cache-control|HTTP'` → 200 + `Cache-Control: public, max-age=60, must-revalidate`.

No `wrangler.toml` and no repo `_headers` (the file is generated into `dist/`; committing one into `public/` would double-apply rules).

### 10.4 Migration / compatibility

Greenfield — no data migration. Compatibility posture: (a) `trailingSlash: 'always'` is a **locked** policy — changing it silently breaks canonical/sitemap byte-identity (R8); any future change is a coordinated config+helper+verify change. (b) Subdomain rename (future, out of scope) is a one-variable change (`SITE_URL`) plus redirects — already isolated in `src/config/site.ts`. (c) Preview `noindex` auto-flips with branch, so no production behavior ever changes by accident.

---

## 11. Static Verification & Test Strategy

### 11.1 `scripts/verify-static.mjs` (T-20) — the CI gate

Runs over `dist/`, exits non-zero on any failure, prints every violation with file + reason. Rules:

1. **Functional-JS markers (NF-5).** For every `dist/**/*.html`, for every `<script …>…</script>`:
   - tag has `src=` → **FAIL** (client JS file);
   - tag has a non-empty body AND its `type` attribute is not `application/ld+json` → **FAIL** (inline JS);
   - non-empty `type="application/ld+json"` blocks → **exempt** (data; `is:inline` output on v1 pages).
   - Event-handler attributes anywhere in the document: regex `\s(on[a-z]+)\s*=\s*("|')[^"']*("|')` → **FAIL** (`onclick`, `onload`, `onerror`, …).
2. **Third-party origin check (NF-4).** Allowed origin = `SITE_ORIGIN` (from `PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev'`). In HTML attributes (`src`, `srcset`, `href`, `poster`, `action`) and CSS (`url(...)` in any `dist/**/*.css`): any value starting `http://`, `https://`, or protocol-relative `//` whose host ≠ allowed host → **FAIL**. Exception (documented): `href` on `<a>` elements points at GitHub/LinkedIn by feature (HOME-3) — anchors are outbound *links*, not page-load requests; everything load-bearing (stylesheets, images, scripts, fonts, forms) must be same-origin. JSON-LD `sameAs` values reside inside the exempted data blocks and are never fetched.
3. **Presence asserts (DEP-3, RES-1, SEO-3):** `dist/404.html`, `dist/robots.txt`, `dist/sitemap-index.xml`, `dist/sitemap-0.xml`, `dist/resume/index.html` containing `href="/resume.pdf"`, and `dist/_headers` containing `Cache-Control: public, max-age=60, must-revalidate` (guards T-18 against accidental removal).
4. Fail-fast plumbing: missing `dist` → FAIL; each rule logs `FAIL <file>: <detail>`; `process.exit(1)` on any failure, `process.exit(0)` + summary otherwise. Plain Node ESM, zero runtime deps.

### 11.2 Planted negative-test procedure (T-20 acceptance)

1. `npm run build`
2. Temporarily inject a functional script into the home build output: append `<script src="https://example.com/evil.js"></script>` to `dist/index.html` before `</body>`.
3. `npm run verify` must **exit non-zero** and list `dist/index.html` (JS-marker rule) — also flags the third-party origin.
4. Remove the planted tag, `npm run build` again, `npm run verify` exits 0 (or `git checkout -- dist` and rebuild).

### 11.3 Test strategy map

| Layer | What | Where / when |
|---|---|---|
| Schema unit | Zod rejects `template: 'bogus'` / `'error'` (T-2 negative test); description >160 fails | T-2, local `npm run build` |
| Unit (pure fn) | `getSections()` ordering (home→resume→about) + id/slug invariant (T-3 log line or test); `sectionPath` home→`/` | T-3 |
| Integration (build) | `npm run build` + `npx astro check` clean; four routes rendered with landmarks (T-6 rg); template dispatch to correct `Section` (T-7 `ls dist/`) | Every astro ticket |
| Static gate | `npm run verify` (JS/third-party/presence) + planted negative tests (§11.2) | T-20, then CI post-T-19 |
| Headers | `CF_PAGES_BRANCH=preview-x npm run build` → `noindex` in `dist/_headers`; production (no env) → no `noindex` (T-18) | T-18 |
| QA/E2E | Lighthouse mobile (load <2s), axe a11y, WCAG contrast, 375/390/430px sweep (T-21); extensibility stub test (T-22); PDF text-extraction (`pdftotext public/resume.pdf - | wc -w` > 0) and `curl` cache check (T-24) | T-21/T-22/T-24 |

---

## 12. File ↔ Ticket Mapping

### 12.1 File → tickets that create/extend it

| File / artifact | Tickets (create → extend) |
|---|---|
| `package.json` | T-1 → T-17 (glyphhanger devDep, fonts script), T-18 (build chain), T-20 (verify) |
| `package-lock.json` | T-1 → T-17 |
| `tsconfig.json` | T-1 |
| `astro.config.mjs` | T-1 → T-4 (site), T-15 (sitemap + filter) |
| `.gitignore` | T-1 |
| `.env.example` | T-4 |
| `src/content.config.ts` | T-2 |
| `src/config/templates.ts` | T-2 (enum + name mapper; the sanctioned extension point per §4.2) |
| `src/config/sections.ts` | T-3 |
| `src/config/site.ts` | T-4 |
| `src/config/person.ts` | T-13 → T-14 (shared facts), T-23 (jobTitle + real URLs) |
| `src/content/sections/home.md` | T-3 → T-23 (final copy) |
| `src/content/sections/resume.md` | T-3 |
| `src/content/sections/about.md` | T-3 → T-23 (final copy) |
| `src/layouts/BaseLayout.astro` | T-6 → T-12 (head slot wiring) |
| `src/components/Nav.astro` | T-5 |
| `src/components/Seo.astro` | T-12 |
| `src/components/JsonLdPerson.astro` | T-13 |
| `src/components/JsonLdProfilePage.astro` | T-14 |
| `src/pages/[...slug].astro` | T-7 → T-12 (per-route Seo wiring) |
| `src/pages/404.astro` | T-11 → T-12 (Seo wiring) |
| `src/pages/robots.txt.ts` | T-16 |
| `src/templates/HomeSection.astro` | T-8 → T-13 (JSON-LD include) |
| `src/templates/ResumeSection.astro` | T-9 → T-14 (JSON-LD include) |
| `src/templates/AboutSection.astro` | T-10 |
| `src/assets/styles/global.css` | T-6 → T-17 (font-face rules) |
| `src/assets/fonts/*.woff2` (2 files) | T-17 |
| `scripts/font-src/*.ttf` (2 files) | T-17 (vendored subsetting inputs) |
| `scripts/gen-headers.mjs` | T-18 |
| `scripts/verify-static.mjs` | T-20 |
| `public/resume.pdf` | T-24 (HUMAN-BLOCKED; absent until then) |
| `dist/_headers` (generated) | T-18 |
| `dist/sitemap-index.xml`, `dist/sitemap-0.xml` (generated) | T-15 |
| `README.md` (optional deploy note) | T-19 (explicitly optional in ticket) |

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
| T-9 | §6.4, §4.4 |
| T-10 | §6.3, §4.4 |
| T-11 | §5.3, §6 |
| T-12 | §8.1, §4.5 |
| T-13 | §8.2–8.3 |
| T-14 | §8.2–8.3 |
| T-15 | §9, §4.5 |
| T-16 | §5.4, §9 |
| T-17 | §7, §6.1 |
| T-18 | §10.1–10.2 |
| T-19 | §10.3 |
| T-20 | §11.1–11.2 |
| T-21 | §6.2–6.3, §11.3 |
| T-22 | §4.1–4.2, §5.1 (stub needs `now.md` + `NowSection.astro` only — enum already contains `now`) |
| T-23 | §4.4 (copy), §8.2 (person.ts facts) |
| T-24 | §10.3 (curl/cache), §11.3 (pdftotext) |

### 12.3 Coverage counts

- **33 design-owned files** mapped (30 in-repo source/config/assets/scripts + 2 generated sitemap files + `dist/_headers`), covering **all 24 tickets**. `README.md` is the only optional file (T-19, ticket-labelled optional).
- Every ticket T-1..T-24 appears as a creator or extender of ≥1 file **and** has a §12.2 mapping — no orphan tickets, no unmapped files.

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
| T-17 | `css`, `font-subsetting` (glyphhanger), `npm` | `font-subsetting` `[gap]` |
| T-18 | `node`, `ci/cd-cloudflare`, `http-caching` | `[gap]` (recommend adding `node-scripts`, `cloudflare-pages`); `principle-boundary-discipline` applies to env handling |
| T-19 | `ci/cd-cloudflare`, `devops`, `git` | `[gap]` (recommend `cloudflare-pages`) |
| T-20 | `node`, `regex/parsing`, `typescript` | `[gap]` for node/regex; `principle-boundary-discipline` `[catalog]` applies to output scanning |
| T-21 | `lighthouse`, `a11y`, `performance`, `css` | `[gap]` (recommend `lighthouse-audit`, `web-accessibility`) |
| T-22 | `astro`, `typescript`, `git` | as T-7; `[catalog] type-system discipline` |
| T-23 | `copywriting-review` (human review of owner copy), `typescript`, `markdown` | `[gap]` — ticket is HUMAN-BLOCKED; owner supplies copy, human reviews; dev only trims wiring |
| T-24 | `pdf-verification`, `git` | `[gap]` (recommend `pdf-verification`); HUMAN-BLOCKED on owner-provided file |

**Catalog-gap summary (explicit):** specialized skills for `astro`, `css`, `a11y`/web accessibility, `seo`, `json-ld`, `node` scripting, `ci/cd-cloudflare`/Cloudflare Pages, `http-caching`, `font-subsetting`, `lighthouse`, `pdf-verification`, and `copywriting-review` do **not** exist in the current skill catalog. The `typescript-best-practices`, `principle-type-system-discipline`, and `principle-boundary-discipline` skills cover the TypeScript/typed-boundary portions. The orchestrator should either add the gap skills or accept default behavior for those tickets.

---

*The six deferred decisions are resolved reproducibly above; the routing shape is a single catch-all route; the file↔ticket mapping is complete with zero unowned required files. A dev sub-agent may implement any single ticket T-1..T-24 from this document plus the ticket file without further architectural decisions.*
# Changelog

All notable changes to this project are documented in this file. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Cloudflare Web Analytics beacon on every page for privacy-friendly traffic stats (no cookies, nothing visible on the page).

## [1.2.0] - 2026-09-30

### Added

- Dark mode that follows the system color-scheme setting.
- Project write-ups show a sticky, numbered contents list beside the text on wide screens.

### Changed

- New type system and palette: IBM Plex Sans Condensed headings, IBM Plex Mono for dates, labels, and code, and a paper, ink, and green accent color scheme.
- Header is now a condensed wordmark with lowercase mono navigation; the current section shows a filled LED marker.
- Projects page is now a ledger: rows grouped by year with date, stack line, text-link actions, and a square-cornered thumbnail.
- Home page is now a datasheet: large name, one-line role, a specifications table with GitHub, LinkedIn, and About links, and the three newest projects. The icon link chips are gone.
- Project write-ups now follow the datasheet layout: a details table (published date with reading time, stack, live link), numbered sections and figure captions, and square-cornered images.
- About page gains a specifications table (education, location, favorite language, off the clock) and the 404 page is now an error-code entry with text links home and to Projects.
- Footer is now a single mono copyright line under a hairline rule.

### Security

- Updated the Wrangler deploy tooling (4.142 to 4.145) to pull in a patched `undici`, fixing one high and two moderate advisories. The built site is unchanged.

## [1.1.1] - 2026-09-29

### Fixed

- Text no longer flickers or reflows when navigating between pages: the site
  fonts are now preloaded, and hashed build assets (`/_astro/*`) are cached
  long-term instead of being revalidated on every navigation.

## [1.1.0] - 2026-09-29

### Added

- Projects section at `/projects/`: a registry-driven index template listing
  project cards (title, summary, tech tags, cover image, live-site and
  write-up links), linked from the nav.
- `projects` content collection (`src/content/projects/*.md`, Zod schema) and
  a `/projects/[slug]/` route that renders each entry as a blog-style post.
  Adding a project is one Markdown file; posts are included in the sitemap.
- First project write-up, Murmur (`/projects/murmur/`), with optimized
  screenshots and an architecture diagram, linking to the live instrument at
  `https://murmur.mattoconn.workers.dev`.

### Changed

- Nav marks a parent section as current (`aria-current`) on nested pages such
  as `/projects/murmur/`.
- The SEO head component accepts an optional Open Graph type; project posts
  emit `og:type=article`.

## [1.0.0] - 2026-09-27

First public release of the personal identity hub for Matthew O'Connell.

### Added

- Astro 7 + TypeScript (strict) static site scaffold, zero client JavaScript.
- Section Registry: typed `sections` content collection (Content Layer API,
  glob loader + Zod), closed template enum, `getSections()` helper — nav,
  routing, and sitemap all derive from one registry.
- Home scan page: hero identity, proof line, GitHub/LinkedIn/About link row,
  Person JSON-LD structured data.
- About page: first-person markdown copy rendered via the registry.
- Registry-driven catch-all routing (`src/pages/[...slug].astro`) with
  template dispatch.
- Custom 404 page (noindex, keyboard-accessible, excluded from the sitemap).
- SEO head component: unique titles/descriptions, Open Graph tags, absolute
  self-referencing canonical URLs.
- Build-time `sitemap.xml` and `robots.txt` (explicit AI-crawler allows:
  OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot).
- Self-hosted, glyph-subsetted IBM Plex Sans WOFF2 fonts (`font-display: swap`,
  zero third-party font requests).
- Host-matched `_headers` generation (`scripts/gen-headers.mjs` +
  `scripts/noindex-rule.mjs`) noindexing every non-canonical
  `*.workers.dev` host while never touching the canonical host.
- Zero-JS / zero-third-party static verification gate (`scripts/verify-static.mjs`),
  wired into `npm run build`.
- Cloudflare Workers static-assets deployment (Worker `www`): committed
  `wrangler.jsonc`, git-push CI/CD via Workers Builds, live at
  `https://www.mattoconn.workers.dev`.
- Extensibility proven live: a stub section can be added as a content file
  plus a template component with zero changes to nav/layout/sitemap/schema
  code.

### Removed

- Résumé surface (page, PDF, `ProfilePage` JSON-LD, download CTA) — retired
  before the first public deploy. The owner routes résumé depth through
  LinkedIn instead.

### Changed

- Deployment platform corrected from Cloudflare Pages to Cloudflare Workers
  static assets after Pages proved unavailable for new projects; canonical
  host retargeted from `mattoconn.pages.dev` to `www.mattoconn.workers.dev`.

### Deployment

- Live: `https://www.mattoconn.workers.dev` (Cloudflare Worker `www`,
  static-assets only, no server runtime, free tier, no custom domain).

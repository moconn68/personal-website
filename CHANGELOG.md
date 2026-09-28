# Changelog

All notable changes to this project are documented in this file. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-09-27

First public release of the personal identity hub for Matthew O'Connell. All 30
tickets in `projects/initial-site/tickets/tickets.md` (T-1 through T-30) are
complete. See `projects/initial-site/releases/release-1.0.0.md` for the full
release notes.

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
  code (T-22).

### Removed

- Résumé surface (page, PDF, `ProfilePage` JSON-LD, download CTA) — retired
  per PRD v1.5 (OQ-7) before the first public deploy. The owner routes résumé
  depth through LinkedIn instead. Tickets T-9, T-14, T-24 are tombstoned;
  T-25 through T-28 performed the removal and post-removal regression pass.

### Changed

- Deployment platform corrected from Cloudflare Pages to Cloudflare Workers
  static assets (PRD v1.6) after Pages proved unavailable for new projects;
  canonical host retargeted from `mattoconn.pages.dev` to
  `www.mattoconn.workers.dev` (T-29, T-30).

### Deployment

- Live: `https://www.mattoconn.workers.dev` (Cloudflare Worker `www`,
  static-assets only, no server runtime, free tier, no custom domain).

# personal-website

Personal portfolio/about site built with [Astro](https://astro.build). Fully static output, deployed as a [Cloudflare Workers static-assets](https://developers.cloudflare.com/workers/static-assets/) site (no Worker script, no server runtime). Ships no client-side JavaScript; the only script tag is a JSON-LD data block.

## Overview

- `src/pages/[...slug].astro` renders every section (Home, About) from the `sections` content collection (`src/content/sections/`). Section templates live in `src/templates/`.
- `src/config/site.ts` is the single source of truth for the canonical host and trailing-slash policy (pages always end in `/`).
- `src/pages/robots.txt.ts` and `@astrojs/sitemap` generate `robots.txt` and the sitemap at build time.
- `scripts/` holds the Node build helpers described below. There is no `public/` directory; fonts are self-hosted from `src/assets/fonts/`.

Requires Node `>=22.12.0` (pinned in `.node-version`).

## Scripts

| Command | What it does |
| :-- | :-- |
| `npm run dev` | Starts the Astro dev server at `localhost:4321`. |
| `npm run build` | Runs `astro build` into `dist/`, then `scripts/gen-headers.mjs` to write `dist/_headers` with a host-matched `X-Robots-Tag: noindex` rule for every non-canonical host. |
| `npm run preview` | Serves the built `dist/` locally. |
| `npm run check` | Type-checks `.astro` and `.ts` files with `astro check`. |
| `npm run verify` | Static regression gate over `dist/` (`scripts/verify-static.mjs`). Fails on functional JavaScript, third-party asset origins, missing required outputs (`404.html`, `robots.txt`, sitemaps), or residue of retired routes. Run it after `npm run build`. |
| `npm run fonts:subset` | Subsets the vendored IBM Plex (Sans, Sans Condensed, Mono) TTFs in `scripts/font-src/` to the glyphs used by the built pages and writes WOFF2 files to `src/assets/fonts/`. Not part of the build; run `npm run build` first and re-run whenever copy changes. |

## Environment Variables

See `.env.example` for details.

- **`PUBLIC_SITE_URL`** overrides the canonical host (default `https://www.mattoconn.workers.dev`). It drives every absolute URL: canonical links, sitemap, `robots.txt` sitemap line, JSON-LD, and the allowed origin in `npm run verify`. Set it only to build against a different domain.
- `gen-headers.mjs` writes `dist/_headers` with a host-matched `X-Robots-Tag: noindex` rule derived from the canonical host in `dist/robots.txt` — no environment variable is involved, and the output is identical on every build (production, preview, or local).

## Deployment

Deployed as a Cloudflare Workers **static-assets-only** site (Worker `www`), configured by the
committed `wrangler.jsonc` at the repo root. There is deliberately no `"main"` entry, no
`@astrojs/cloudflare` adapter, and no server runtime — Wrangler serves `dist/` directly.

- Git push to `main` triggers a Workers Builds run: build command `npm run build`, deploy command
  `npx wrangler deploy`. There is no separate CI-gate step; `npm run build` already runs
  `scripts/verify-static.mjs` before the deploy step can run.
- No build variables are set for the project. `PUBLIC_SITE_URL` is intentionally left unset so the
  committed default (the canonical host) is always used; see `.env.example`.
- Local deploy dry run: `npx wrangler deploy --dry-run` builds the upload plan without publishing.
- Local runtime check: `npx wrangler dev --port 8787` serves `dist/` the same way Workers does in
  production (404 page on unmatched paths, `/about` → `/about/` redirect).
- `wrangler` is a pinned `devDependency` (not an ad-hoc `npx` download), so Workers Builds and any
  local `npx wrangler …` invocation resolve the same version.
- Rollback: `npx wrangler rollback` restores the previous version.

# personal-website

Personal portfolio/about site built with [Astro](https://astro.build). Fully static output, deployed to Cloudflare Pages. Ships no client-side JavaScript; the only script tag is a JSON-LD data block.

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
| `npm run fonts:subset` | Subsets the vendored IBM Plex Sans TTFs in `scripts/font-src/` to the glyphs used by the built pages and writes WOFF2 files to `src/assets/fonts/`. Not part of the build; run `npm run build` first and re-run whenever copy changes. |

## Environment Variables

See `.env.example` for details.

- **`PUBLIC_SITE_URL`** overrides the canonical host (default `https://www.mattoconn.workers.dev`). It drives every absolute URL: canonical links, sitemap, `robots.txt` sitemap line, JSON-LD, and the allowed origin in `npm run verify`. Set it only to build against a different domain.
- `gen-headers.mjs` writes `dist/_headers` with a host-matched `X-Robots-Tag: noindex` rule derived from the canonical host in `dist/robots.txt` — no environment variable is involved, and the output is identical on every build (production, preview, or local).

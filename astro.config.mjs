// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// Astro evaluates this file before Vite loads .env, so process.env alone would
// miss a PUBLIC_SITE_URL set only in .env while app code still saw it (a
// mixed-host build). loadEnv reads .env files the same way Vite does, with
// real process.env values taking precedence.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const SITE_URL = (env.PUBLIC_SITE_URL || 'https://www.mattoconn.workers.dev').replace(/\/+$/, '');

// https://astro.build/config
export default defineConfig({
  // Canonical host — THE single source of truth. Astro exposes it to app code
  // as import.meta.env.SITE (read by src/config/site.ts), and @astrojs/sitemap
  // builds absolute URLs from it.
  site: SITE_URL,
  // ONE trailing-slash policy: pages always end in '/'
  // (root is '/'), so nav hrefs, canonicals, and sitemap URLs stay byte-identical.
  // File endpoints (robots.txt, sitemap-*.xml) never take a slash.
  trailingSlash: 'always',
  // A slug collision (two content entries resolving to the same id) must fail
  // the build loudly instead of Astro silently dropping one entry — the
  // content-schema guards in src/config/sections.ts assume this.
  prerenderConflictBehavior: 'error',
  integrations: [
    sitemap({
      // Sitemap covers exactly the registry-derived section URLs:
      // /, /about/. The integration skips status pages (404/500) and
      // non-HTML endpoints already; the explicit 404 filter keeps that exclusion
      // visible and future-proof.
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return pathname !== '/404/' && pathname !== '/404';
      },
    }),
  ],
});

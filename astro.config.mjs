// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical host — single source of truth, mirrored from src/config/site.ts
  // (config runs in Node so it reads process.env). @astrojs/sitemap
  // builds absolute URLs from this.
  site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev',
  // ONE trailing-slash policy: pages always end in '/'
  // (root is '/'), so nav hrefs, canonicals, and sitemap URLs stay byte-identical.
  // File endpoints (robots.txt, sitemap-*.xml) never take a slash.
  trailingSlash: 'always',
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

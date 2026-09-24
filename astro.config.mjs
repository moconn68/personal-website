// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Canonical host — single source of truth, mirrored from src/config/site.ts
  // (config runs in Node so it reads process.env). @astrojs/sitemap (T-15)
  // builds absolute URLs from this.
  site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev',
  // ONE trailing-slash policy (tech design §6.4): pages always end in '/'
  // (root is '/'), so nav hrefs, canonicals, and sitemap URLs stay byte-identical.
  // File endpoints (robots.txt, resume.pdf, sitemap-*.xml) never take a slash.
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // Sitemap covers exactly the registry-derived section URLs (T-7 routes):
      // /, /resume/, /about/. The integration skips status pages (404/500) and
      // non-HTML endpoints already; the explicit 404 filter keeps that exclusion
      // visible and future-proof (design §9, SEO-3).
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return pathname !== '/404/' && pathname !== '/404';
      },
    }),
  ],
});

// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical host — single source of truth, mirrored from src/config/site.ts
  // (config runs in Node so it reads process.env). @astrojs/sitemap (T-15)
  // will build absolute URLs from this.
  site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev',
  // ONE trailing-slash policy (tech design §6.4): pages always end in '/'
  // (root is '/'), so nav hrefs, canonicals, and sitemap URLs stay byte-identical.
  // File endpoints (robots.txt, resume.pdf, sitemap-*.xml) never take a slash.
  trailingSlash: 'always',
});

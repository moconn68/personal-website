// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Canonical host — single source of truth, mirrored from src/config/site.ts
  // (config runs in Node so it reads process.env). @astrojs/sitemap (T-15)
  // will build absolute URLs from this.
  site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev',
});

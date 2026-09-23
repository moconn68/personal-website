// Single source of truth for all absolute URLs (canonical, sitemap, robots,
// JSON-LD, _headers). astro.config.mjs mirrors the default via process.env;
// this module reads the Astro-injected import.meta.env at build time.
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

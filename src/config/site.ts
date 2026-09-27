// Single source of truth for all absolute URLs (canonical, sitemap, robots,
// JSON-LD, _headers) is astro.config.mjs's `site`, which resolves the
// PUBLIC_SITE_URL override and default and strips any trailing slash. Astro
// injects that resolved value here as import.meta.env.SITE, so this module
// never re-reads the env var and cannot disagree with the sitemap host.
const site: string | undefined = import.meta.env.SITE;
if (!site) throw new Error('astro.config.mjs must set `site` — absolute URLs derive from it.');

export const SITE_URL: string = site;

/** Single trailing-slash policy: pages ALWAYS end in '/' (root is '/'); file paths never do. */
export function path(p: string): string {
  const cleaned = p.replace(/^\/+|\/+$/g, '');
  return cleaned === '' ? '/' : `/${cleaned}/`;
}

export function absoluteUrl(p: string): string {
  return `${SITE_URL}${path(p)}`;
}

// Pure and dependency-free. Shared by gen-headers.mjs (writer) and
// verify-static.mjs (gate) so every `_headers` rule is defined exactly once.
//
// Every non-canonical host of a Workers static-assets site is a workers.dev
// hostname: Preview, Deployment, and Version URLs are all
// `<prefix>-<worker>.<account>.workers.dev`. Workers `_headers` rules can
// match on hostname, so one rule keyed off the canonical host covers them all
// and the file is identical on every build: no branch or env detection.

const WORKERS_DEV_HOST = /^([a-z0-9-]+)\.([a-z0-9-]+)\.workers\.dev$/;

/** Canonical origin from robots.txt text; same pattern as verify-static.mjs rule 0. */
export function canonicalOriginFromRobots(robotsText) {
  const url = robotsText.match(/^Sitemap:\s*(\S+)\s*$/im)?.[1];
  if (!url) throw new Error('robots.txt has no Sitemap: line; cannot derive the canonical origin');
  return new URL(url).origin;
}

/** The host-matched noindex rule for a canonical https origin. */
export function noindexRuleFor(origin) {
  const { protocol, host } = new URL(origin);
  if (protocol !== 'https:') throw new Error(`canonical origin must be https: ${origin}`);
  const m = WORKERS_DEV_HOST.exec(host);
  const pattern = m
    ? // Canonical on workers.dev: noindex every prefixed alias of this Worker.
      // `www.mattoconn.workers.dev` itself cannot match: its first label has no '-'.
      `https://:prefix-${m[1]}.${m[2]}.workers.dev/*`
    : // Canonical elsewhere (future custom domain): every workers.dev host is a duplicate.
      'https://:worker.:account.workers.dev/*';
  return `${pattern}\n  X-Robots-Tag: noindex\n`;
}

/**
 * Long-lived caching for content-hashed build output. Astro names everything in
 * /_astro/* by content hash, so a changed file gets a new URL and the old one
 * can be cached forever. Without this, Cloudflare's default
 * `max-age=0, must-revalidate` forces every navigation to revalidate the fonts,
 * and text paints in the fallback font first (FOUT). HTML stays revalidated.
 */
export const CACHE_RULE = '/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n';

/** The exact dist/_headers body for a canonical https origin. */
export function headersFor(origin) {
  return `${noindexRuleFor(origin)}\n${CACHE_RULE}`;
}

/**
 * Could a `_headers` host pattern match `host`? Mirrors Cloudflare's placeholder
 * rule (any run of characters other than '.' and '/'), treating a placeholder as
 * possibly empty so the check errs toward reporting a match.
 */
export function hostPatternMatches(hostPattern, host) {
  const source = hostPattern
    .split(/(:[A-Za-z]\w*)/)
    .map((part, i) => (i % 2 === 1 ? '[^./]*' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`^${source}$`).test(host);
}

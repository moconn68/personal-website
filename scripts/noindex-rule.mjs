// Pure and dependency-free. Shared by gen-headers.mjs (writer) and
// verify-static.mjs (gate) so the noindex rule is defined exactly once.
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

/** The exact dist/_headers body for a canonical https origin. */
export function noindexHeadersFor(origin) {
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

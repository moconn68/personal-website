// Emit dist/_headers AFTER `astro build` (chained in package.json).
//
// This script's ONLY job is the preview noindex rule. A production site must
// emit no X-Robots-Tag at all, and with no production-only rule left there is
// nothing to write: the correct production output is no file. A stale
// dist/_headers from an earlier build is removed rather than left behind —
// shipping an empty or superseded headers file is dead configuration.
//
// Detection: CF_PAGES_BRANCH. Production build <=> this env var is absent
// (local builds) or equals the production branch `main`. Any other set value
// (PR branch names, preview branches, `preview`) <=> non-canonical host <=>
// emit the global noindex rule. CF_PAGES_URL is REJECTED as a discriminator:
// Cloudflare sets it on production deploys too.
//
// The noindex rule keeps pages crawlable on preview hosts so the noindex
// signal takes effect — robots.txt must stay Disallow-free.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_BRANCH = 'main'; // the Cloudflare Pages production branch
const branch = process.env.CF_PAGES_BRANCH; // undefined locally = production semantics
const isProduction = !branch || branch === PROD_BRANCH;

const noindexRule = [
  '/*',
  '  X-Robots-Tag: noindex',
].join('\n');

// Anchored to this script's location, not the working directory, so output
// always lands in the project-root dist/ however the script is invoked.
const DIST_DIR = resolve(import.meta.dirname, '../dist');
const headersPath = resolve(DIST_DIR, '_headers');

mkdirSync(DIST_DIR, { recursive: true });
if (isProduction) {
  rmSync(headersPath, { force: true });
  console.log('[gen-headers] production build — no _headers written');
} else {
  writeFileSync(headersPath, `${noindexRule}\n`, 'utf8');
  console.log(`[gen-headers] wrote dist/_headers (preview noindex, branch=${branch})`);
}

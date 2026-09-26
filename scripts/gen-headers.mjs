// Emit dist/_headers AFTER `astro build` (chained in package.json).
//
// Detection: CF_PAGES_BRANCH. Production build <=> this env var is absent
// (local builds) or equals the production branch `main`. Any other set value
// (PR branch names, preview branches, `preview`) <=> non-canonical host <=>
// emit the global noindex rule. CF_PAGES_URL is REJECTED as a discriminator:
// Cloudflare sets it on production deploys too.
//
// The noindex rule keeps pages crawlable on preview hosts so the noindex
// signal takes effect — robots.txt must stay Disallow-free.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_BRANCH = 'main'; // the Cloudflare Pages production branch
const branch = process.env.CF_PAGES_BRANCH; // undefined locally = production semantics
const isProduction = !branch || branch === PROD_BRANCH;

const resumeRule = [
  '/resume.pdf',
  '  Cache-Control: public, max-age=60, must-revalidate',
].join('\n');

const noindexRule = [
  '/*',
  '  X-Robots-Tag: noindex',
].join('\n');

const body = isProduction
  ? `${resumeRule}\n`
  : `${resumeRule}\n\n${noindexRule}\n`;

mkdirSync(resolve('dist'), { recursive: true });
writeFileSync(resolve('dist/_headers'), body, 'utf8');
console.log(`[gen-headers] wrote dist/_headers (${isProduction ? 'production' : `preview noindex (branch=${branch})`})`);
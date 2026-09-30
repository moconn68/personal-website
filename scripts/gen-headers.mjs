// Emit dist/_headers AFTER `astro build` (chained in package.json).
//
// Two rules, both defined in noindex-rule.mjs. SEO-12: X-Robots-Tag: noindex on
// every host that is not the canonical one, host-matched and derived from the
// canonical origin the build actually emitted (dist/robots.txt). Plus immutable
// caching for hashed /_astro/* assets. The output is identical on every build,
// production or preview. No environment variable is read.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalOriginFromRobots, headersFor } from './noindex-rule.mjs';

const DIST_DIR = resolve(import.meta.dirname, '../dist');

const origin = canonicalOriginFromRobots(readFileSync(resolve(DIST_DIR, 'robots.txt'), 'utf8'));
writeFileSync(resolve(DIST_DIR, '_headers'), headersFor(origin), 'utf8');
console.log(`[gen-headers] wrote dist/_headers (noindex for non-canonical hosts of ${origin}, immutable /_astro/*)`);

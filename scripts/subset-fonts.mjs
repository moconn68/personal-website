// One-shot: subset the vendored IBM Plex Sans TTFs to the glyphs the site
// actually renders, emit WOFF2 into src/assets/fonts under the pinned names the
// global.css @font-face rules reference. NOT part of the build — run manually,
// and re-run whenever copy changes, after rebuilding:
//
//   npm run build && node scripts/subset-fonts.mjs
//
// Tool chosen: `subset-font` (pure Node/WASM) instead of `glyphhanger`, because
// the latter shells out to Python's fonttools+brotli, which isn't installed on
// this machine. Output is identical in spirit (same charset, woff2 target) and
// either tool is acceptable. TTF sources stay committed under
// scripts/font-src/ so subsetting is hermetic/repeatable.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import subsetFont from 'subset-font';

const SRC_DIR = resolve(import.meta.dirname, 'font-src');
const OUT_DIR = resolve(import.meta.dirname, '../src/assets/fonts');
const DIST_DIR = resolve(import.meta.dirname, '../dist');

const pinnedOutputs = {
  'IBMPlexSans-Regular.ttf': 'ibm-plex-sans-400.woff2',
  'IBMPlexSans-SemiBold.ttf': 'ibm-plex-sans-600.woff2',
};

const REDUNDANCY = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 —–''’“\"";

const glyphs = new Set(REDUNDANCY);
// Sweep every built HTML page so the subset always covers the live copy
// (including characters shy of the redundancy whitelist, e.g. e-acute and ©).
// This list should name every page that exists: a missing input is silently
// skipped rather than raising, so a page that is added without being listed
// here would be quietly excluded from the subset and ship missing glyphs
// (tofu) with no build failure to warn you. Nothing enforces the list, so the
// sweep and skip logs below are the only signal that a page fell out of it.
const swept = [];
const skipped = [];
for (const file of ['index.html', 'about/index.html', '404.html']) {
  let html = '';
  try {
    html = readFileSync(join(DIST_DIR, file), 'utf8');
  } catch {
    skipped.push(file);
    continue;
  }
  swept.push(file);
  for (const ch of html) glyphs.add(ch);
}
console.log(`[subset-fonts] swept ${swept.length} page(s): ${swept.join(', ')}`);
if (skipped.length > 0) {
  console.log(
    `[subset-fonts] WARNING: ${skipped.length} listed input(s) not found in dist/: ${skipped.join(', ')} — their glyphs are NOT in the subset`,
  );
}
const text = [...glyphs].join('');

for (const [ttf, out] of Object.entries(pinnedOutputs)) {
  const input = readFileSync(join(SRC_DIR, ttf));
  const woff2 = await subsetFont(input, text, { targetFormat: 'woff2' });
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, out), woff2);
  console.log(`wrote ${out} (${text.length} unique glyphs, ${woff2.length} bytes)`);
}
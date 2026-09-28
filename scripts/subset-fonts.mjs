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
// scripts/font-src/ so subsetting is hermetic/repeatable. They are licensed
// under the SIL Open Font License 1.1 (scripts/font-src/OFL.txt), which also
// covers the subsetted WOFF2 derivatives.
//
// Output filenames avoid "plex": the OFL reserves the name "Plex" for the
// Copyright Holder's own distributions (clause 3), and these are modified
// (subsetted) derivatives served under the 'Site Sans' family name in
// global.css. Attribution to IBM Plex Sans stays in this comment, the OFL
// file, and the README.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import subsetFont from 'subset-font';

const SRC_DIR = resolve(import.meta.dirname, 'font-src');
const OUT_DIR = resolve(import.meta.dirname, '../src/assets/fonts');
const DIST_DIR = resolve(import.meta.dirname, '../dist');

const pinnedOutputs = {
  'IBMPlexSans-Regular.ttf': 'site-sans-400.woff2',
  'IBMPlexSans-SemiBold.ttf': 'site-sans-600.woff2',
};

// Every build emits the home page; its absence means dist/ is not a complete build.
const SENTINEL_PAGE = 'index.html';

function fail(message) {
  console.error(`[subset-fonts] ERROR: ${message}`);
  console.error('[subset-fonts] No fonts were written. Run `npm run build` first.');
  process.exit(1);
}

// Characters always kept regardless of current copy, so small copy edits don't
// render tofu before the subset is regenerated. Built from code points rather
// than literals so look-alike quotes can't be mistyped.
const REDUNDANCY = [
  // Printable ASCII: space (U+0020) through tilde (U+007E).
  ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i)),
  ' ', // no-break space
  '©', // © copyright sign
  '–', // – en dash
  '—', // — em dash
  '‘', // ‘ left single quotation mark
  '’', // ’ right single quotation mark
  '“', // “ left double quotation mark
  '”', // ” right double quotation mark
  '…', // … horizontal ellipsis
].join('');

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Decode entities so the subset gets the glyph they represent, not `&`, `#`, `;`.
function decodeEntities(text) {
  return text.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g, (match, dec, hex, name) => {
    if (name !== undefined) return NAMED_ENTITIES[name] ?? match;
    const codePoint = dec !== undefined ? Number.parseInt(dec, 10) : Number.parseInt(hex, 16);
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
  });
}

if (!existsSync(DIST_DIR) || !statSync(DIST_DIR).isDirectory()) {
  fail(`build output not found at ${DIST_DIR}.`);
}
if (!existsSync(join(DIST_DIR, SENTINEL_PAGE))) {
  fail(`${SENTINEL_PAGE} missing from ${DIST_DIR}; the build is incomplete.`);
}

// Sweep every built HTML page (and emitted CSS, for `content:` strings) so the
// subset covers all live copy without a hand-maintained page list.
const inputs = readdirSync(DIST_DIR, { recursive: true })
  .filter((file) => /\.(html|css)$/.test(file))
  .sort();
const pages = inputs.filter((file) => file.endsWith('.html'));

const chars = new Set(REDUNDANCY);
for (const file of inputs) {
  for (const ch of decodeEntities(readFileSync(join(DIST_DIR, file), 'utf8'))) chars.add(ch);
}
console.log(`[subset-fonts] swept ${pages.length} page(s): ${pages.join(', ')}`);
const stylesheets = inputs.length - pages.length;
if (stylesheets > 0) console.log(`[subset-fonts] swept ${stylesheets} stylesheet(s)`);

const text = [...chars].join('');

// Subset every weight before writing any, so a failure can't leave a mismatched pair.
const outputs = [];
for (const [ttf, out] of Object.entries(pinnedOutputs)) {
  const input = readFileSync(join(SRC_DIR, ttf));
  outputs.push([out, await subsetFont(input, text, { targetFormat: 'woff2' })]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [out, woff2] of outputs) {
  writeFileSync(join(OUT_DIR, out), woff2);
  console.log(`wrote ${out} (${chars.size} unique characters, ${woff2.length} bytes)`);
}

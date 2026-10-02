// Static-output verification gate. Walks dist/** and exits non-zero on any
// violation. Plain Node ESM, zero runtime deps.
//
// Rules:
//   0. One canonical origin. SITE_ORIGIN is derived from the build output, not
//      from an env read that could disagree with it: the robots.txt Sitemap:
//      line sets it, and every sitemap <loc> plus the home page canonical must
//      share it exactly (scheme included), so a mixed-host build fails here.
//   2. Third-party origin. In load-bearing HTML attrs (src/srcset/href/poster/
//      action, quoted or not), CSS url() references (in <style> blocks, style=""
//      attributes and .css files) and CSS @import strings, any absolute or
//      protocol-relative URL whose origin isn't SITE_ORIGIN fails; comparing the
//      full origin also catches http:// mixed content. <a href> anchors are
//      exempt (outbound links are a feature); JSON-LD lives in exempted data
//      blocks and is never fetched.
//   3. Presence asserts: 404.html, robots.txt and both sitemap files exist.
//   4. No-residue asserts: the retired route must stay retired — not as a file,
//      not as a link, not as a JSON-LD node type, and not as dead _headers
//      configuration. Coverage is every artifact under dist/** except known
//      binary formats (fonts, images, media, archives), which cannot carry a
//      link and are not decoded as text — so a new output format is covered by
//      default rather than by remembering to whitelist it. A match needs a
//      leading "/" and a non-word character after the token, so prose that
//      merely names the retired thing, a hyphenated or plural sibling path, and
//      a bare anchor fragment all pass silently. A relative href with no leading
//      slash is out of design scope and is not caught. Rule 4 also guards that
//      the removal did not collaterally take the site's only structured data
//      (the Person node) with it. Rule 4e additionally asserts that
//      dist/_headers carries a host-matched noindex rule for every
//      non-canonical host and the immutable cache rule for /_astro/* — see
//      §10.1 of the tech design.
//
// Ordering: `npm run build` chains this script as its last step, so a build
// always verifies in the environment it was built in. A standalone
// `npm run verify` assumes the same: run `npm run build` first if dist/ is
// stale. dist/_headers is now identical on every build (no branch or env
// detection), so there is no preview-vs-production distinction to worry about.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { hostPatternMatches, headersFor, CACHE_RULE } from './noindex-rule.mjs';

const DIR = resolve('dist');

const failures = [];
const pass = (msg) => console.log(`PASS ${msg}`);
const fail = (msg) => {
  failures.push(msg);
  console.log(`FAIL ${msg}`);
};

if (!statSync(DIR, { throwIfNoEntry: false })?.isDirectory()) {
  console.log(`FAIL ${DIR} does not exist — run npm run build first`);
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p;
  });

const files = walk(DIR);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const cssFiles = files.filter((f) => f.endsWith('.css'));

// Shared tag/attribute helpers. OPEN_TAG matches an opening tag while skipping
// over quoted attribute values, so a ">" inside a value does not end the tag.
const OPEN_TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'"<>])*?)>/g;
// One attribute: a name, optionally "=" and a value in any of its three
// spellings ("double", 'single', bare). Tokenizing whole attributes means text
// inside one value (alt="src=https://x") is never read as another attribute.
const ATTR = /([^\s"'=<>/`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const decodeEntities = (s) =>
  s
    .replace(/&quot;|&#0*34;|&#x0*22;/gi, '"')
    .replace(/&apos;|&#0*39;|&#x0*27;/gi, "'")
    .replace(/&amp;/gi, '&');
// Every opening tag as { tag, attrs }, with attrs as [lowercased name, decoded value] pairs.
const openTags = (html) =>
  [...html.matchAll(OPEN_TAG)].map((t) => ({
    tag: t[1].toLowerCase(),
    attrs: [...t[2].matchAll(ATTR)].map((a) => [
      a[1].toLowerCase(),
      decodeEntities(a[2] ?? a[3] ?? a[4] ?? ''),
    ]),
  }));

// ---- Rule 0: one canonical origin -------------------------------------------
//
// SITE_ORIGIN comes from what the build actually emitted, never from an env
// read: astro.config.mjs and app code could each resolve PUBLIC_SITE_URL
// differently, and an env read here would agree with only one of them.

const ORIGIN_RULE_BASELINE = failures.length; // so only rule 0 drives its own PASS line
const readDist = (rel) => {
  try {
    return readFileSync(join(DIR, rel), 'utf8');
  } catch {
    return null;
  }
};
const originOf = (u) => {
  try {
    return new URL(u).origin;
  } catch {
    return null;
  }
};

const sitemapLine = readDist('robots.txt')?.match(/^Sitemap:\s*(\S+)\s*$/im)?.[1];
const SITE_ORIGIN = sitemapLine ? originOf(sitemapLine) : null;
if (!SITE_ORIGIN) {
  console.log(
    'FAIL dist/robots.txt: no parseable Sitemap: line — cannot establish the canonical origin',
  );
  console.log('\nverify: 1 violation(s) — gate BLOCKED');
  process.exit(1);
}
if (!SITE_ORIGIN.startsWith('https://')) {
  fail(`dist/robots.txt: canonical origin ${SITE_ORIGIN} is not https`);
}
if (new URL(sitemapLine).pathname !== '/sitemap-index.xml') {
  fail(`dist/robots.txt: Sitemap: ${sitemapLine} does not target /sitemap-index.xml`);
}

const sameOrigin = (file, what, url) => {
  const origin = originOf(url);
  if (origin !== SITE_ORIGIN) {
    fail(`${file}: ${what} ${url} is not on the canonical origin ${SITE_ORIGIN}`);
  }
};

const LOC = /<loc>\s*([^<\s]+)\s*<\/loc>/g;
const sitemapFiles = files.filter((f) => /[\\/]sitemap-[^\\/]*\.xml$/.test(f));
let locCount = 0;
for (const file of sitemapFiles) {
  for (const [, url] of readFileSync(file, 'utf8').matchAll(LOC)) {
    locCount++;
    sameOrigin(file, 'sitemap <loc>', url);
  }
}
if (locCount === 0) fail('dist/sitemap-*.xml: no <loc> entries to cross-check against robots.txt');

for (const file of htmlFiles) {
  for (const { tag, attrs } of openTags(readFileSync(file, 'utf8'))) {
    if (tag !== 'link') continue;
    const get = (name) => attrs.find(([n]) => n === name)?.[1] ?? '';
    if (!/(?:^|\s)canonical(?:\s|$)/i.test(get('rel'))) continue;
    sameOrigin(file, 'canonical', get('href'));
  }
}

if (failures.length === ORIGIN_RULE_BASELINE) {
  pass(`canonical origin: robots.txt, ${locCount} sitemap URL(s) and canonicals agree on ${SITE_ORIGIN}`);
}

// ---- Rule 2: third-party origins -------------------------------------------

const ORIGIN_FAILURE_BASELINE = failures.length; // so only rule 2 drives its own PASS line
const URL_ATTRS = new Set(['src', 'srcset', 'href', 'poster', 'action']);
const CSS_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
const CSS_IMPORT = /@import\s+(['"])(.*?)\1/gi; // @import url(...) is caught by CSS_URL

// The origin a reference would load from, when that is not SITE_ORIGIN.
// Relative and non-network references (data:, mailto:, #frag) return null.
// Protocol-relative URLs resolve against SITE_ORIGIN's scheme, as a browser
// would on the canonical page.
function foreignOrigin(candidate) {
  const s = candidate.trim().split(/\s+/)[0] ?? '';
  if (!/^(?:https?:)?\/\//i.test(s)) return null;
  try {
    const origin = new URL(s, SITE_ORIGIN).origin;
    return origin === SITE_ORIGIN ? null : origin;
  } catch {
    return `unparseable URL ${JSON.stringify(s)}`;
  }
}

function scanCss(file, css, where) {
  for (const re of [CSS_URL, CSS_IMPORT]) {
    for (const u of css.matchAll(re)) {
      const origin = foreignOrigin(u[2]);
      if (origin) fail(`${file}: ${where} ${re === CSS_URL ? 'url()' : '@import'} → ${origin}`);
    }
  }
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');

  for (const { tag, attrs } of openTags(html)) {
    for (const [name, value] of attrs) {
      if (name === 'style') {
        scanCss(file, value, `<${tag} style>`);
        continue;
      }
      if (!URL_ATTRS.has(name)) continue;
      if (tag === 'a' && name === 'href') continue; // outbound links are a feature
      for (const candidate of name === 'srcset' ? value.split(',') : [value]) {
        const origin = foreignOrigin(candidate);
        if (origin) fail(`${file}: <${tag} ${name}> → ${origin}`);
      }
    }
  }

  // CSS references inside inlined <style> blocks.
  for (const block of html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? []) {
    scanCss(file, block, 'css');
  }
}

for (const file of cssFiles) {
  scanCss(file, readFileSync(file, 'utf8'), 'css');
}

if (failures.length === ORIGIN_FAILURE_BASELINE) {
  pass('third-party scan: all load-bearing refs same-origin');
}

// ---- Rule 3: presence asserts -----------------------------------------------

const PRESENCE_FAILURE_BASELINE = failures.length; // so only rule 3 drives its own PASS line
const mustContain = (file, needle, label) => {
  const target = join(DIR, file);
  let ok = true;
  try {
    const content = readFileSync(target, 'utf8');
    ok = needle === null || content.includes(needle);
  } catch {
    ok = false;
  }
  if (!ok) fail(`${label} missing at dist/${file}${needle ? ` (needle: ${needle})` : ''}`);
};

mustContain('404.html', null, '404 page');
mustContain('robots.txt', null, 'robots.txt');
mustContain('sitemap-index.xml', null, 'sitemap index');
mustContain('sitemap-0.xml', null, 'sitemap-0');
if (failures.length === PRESENCE_FAILURE_BASELINE) pass('presence asserts');

// ---- Rule 4: no-residue asserts ---------------------------------------------
//
// The inverse of rule 3's presence asserts, and the site's permanent guard
// against the retired surface reappearing. Asserting on *strings* rather than
// only on files is the point: a partial regression — the page is gone but a nav
// chip, a link-row chip, a sitemap URL, a canonical or a leftover download link
// still points at it — raises no missing-file failure, yet still ships a broken
// link to readers and crawlers.

const RESIDUE_FAILURE_BASELINE = failures.length; // so only rule 4 drives its own PASS line
const RETIRED = 'resume';
const RETIRED_PDF = `${RETIRED}.pdf`;

// statSync's throwIfNoEntry suppresses ENOENT only. EACCES, ENOTDIR and friends
// must still surface as a FAIL line rather than an uncaught stack, and "could
// not check" must never read as "clean" (design §11.1 rule 5).
const exists = (p) => {
  try {
    return statSync(p, { throwIfNoEntry: false }) !== undefined;
  } catch (err) {
    fail(`${p}: cannot stat (${err.code ?? err.message})`);
    return false;
  }
};

// Same discipline for reads: a file we believed was text but could not decode
// gets a FAIL line and drops out of the scan, rather than being silently skipped
// while rule 4 still prints its PASS.
const readText = (file) => {
  try {
    return readFileSync(file, 'utf8');
  } catch (err) {
    fail(`${file}: cannot read as text (${err.code ?? err.message})`);
    return null;
  }
};

// 4a. The retired artifacts are gone, not merely unreferenced.
for (const rel of [RETIRED, RETIRED_PDF]) {
  if (exists(join(DIR, rel))) fail(`dist/${rel}: retired artifact exists (removed route resurfaced)`);
}

// Everything except the known binary formats is a candidate carrier of a
// reference: HTML, CSS, source maps, SVG, XML, text, JSON, the extensionless
// _headers, and any format added later. Only the binary list is excluded, and
// those cannot meaningfully hold a link.
const BINARY_EXT =
  /\.(?:woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|ico|bmp|pdf|zip|gz|br|mp4|webm|mp3|wasm)$/i;
const textFiles = files.filter((f) => !BINARY_EXT.test(f));
const contents = new Map();
for (const file of textFiles) {
  const text = readText(file);
  if (text !== null) contents.set(file, text);
}

// 4b. No built artifact references the retired path — the download filename in
//     any spelling, or the retired route as a path. Scanned across every
//     non-binary artifact, including dist/_headers when a preview build wrote
//     one: headers for a file that does not exist are dead configuration, and a
//     link that outlived its page is a broken link. One report per file, quoting
//     the offending text; a hit inside <nav> is called out so a nav regression
//     is obvious at a glance.
const RETIRED_PATH = new RegExp(`/${RETIRED}(?:\\.pdf)?(?![\\w-])`, 'i');
const RETIRED_FILE_RE = new RegExp(`${RETIRED}\\.pdf`, 'i');
const NAV_BLOCK = /<nav\b[\s\S]*?<\/nav>/gi;

for (const [file, content] of contents) {
  const hit = content.match(RETIRED_PATH);
  if (hit) {
    const inNav =
      file.endsWith('.html') &&
      [...content.matchAll(NAV_BLOCK)].some(
        (b) => hit.index >= b.index && hit.index < b.index + b[0].length,
      );
    fail(`${file}: references the retired path "${hit[0]}"${inNav ? ' (in <nav>)' : ''}`);
  } else if (RETIRED_FILE_RE.test(content)) {
    // The same filename, but written without a path prefix of any kind.
    fail(`${file}: references "${RETIRED_PDF}" (retired download path)`);
  }
}

// Quotes around the type value are optional, so an unquoted type attribute
// never hides a block from 4c/4d.
const LD_JSON =
  /<\s*script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/\s*script\s*>/gi;

// 4c. No JSON-LD block declares the retired profile-page node type. Matched
//     against the whole block body so no amount of JSON formatting (@type
//     first, last, or inside an array) can hide it.
for (const [file, content] of contents) {
  let m;
  LD_JSON.lastIndex = 0;
  while ((m = LD_JSON.exec(content))) {
    if (/\bProfilePage\b/.test(m[1])) {
      fail(`${file}: JSON-LD declares @type "ProfilePage" (retired structured-data node)`);
    }
  }
}

// 4d. The removal must not have taken the site's only structured data with it:
//     dist/index.html carries exactly one JSON-LD block, it parses, and its
//     @type is the Person node.
const homePath = join(DIR, 'index.html');
const home = contents.get(homePath) ?? (exists(homePath) ? readText(homePath) : null);
// matchAll copies the receiver's lastIndex, so reset it: a regex left mid-string
// by 4c's exec loop would make this return [] and hide a real block.
LD_JSON.lastIndex = 0;
const homeBlocks = home === null ? [] : [...home.matchAll(LD_JSON)];

if (home === null) {
  fail('dist/index.html: missing — cannot confirm the Person structured-data node');
} else if (homeBlocks.length !== 1) {
  fail(
    `dist/index.html: ${homeBlocks.length} JSON-LD block(s), expected exactly 1 (structured data lost)`,
  );
} else {
  try {
    const types = [JSON.parse(homeBlocks[0][1])['@type'] ?? []]
      .flat()
      .filter((t) => typeof t === 'string');
    if (types.length !== 1 || types[0] !== 'Person') {
      fail(`dist/index.html: JSON-LD @type is "${types.join(', ')}", expected "Person"`);
    }
  } catch (err) {
    fail(`dist/index.html: JSON-LD block does not parse as JSON (${err.message})`);
  }
}

// 4e. dist/_headers must carry the host-matched noindex rule for the
//     canonical host plus the immutable /_astro/* cache rule on every build
//     (design §10.1) — no branch or env detection, so the same checks apply on
//     production, preview, and local builds alike:
//   - Presence + exact content: the file must exist and equal
//     headersFor(SITE_ORIGIN) byte-for-byte, and include the cache rule.
//   - No noindex rule can reach the canonical host: independent of the writer,
//     so a future edit to headersFor that would noindex the real site fails
//     the build rather than shipping an SEO outage. Only rules carrying
//     X-Robots-Tag are held to this; the path-only cache rule is expected.
const headersPath = join(DIR, '_headers');

if (!exists(headersPath)) {
  fail('dist/_headers: missing — non-canonical hosts would be indexable (SEO-12)');
} else {
  const written = readText(headersPath);
  const expected = headersFor(SITE_ORIGIN);
  if (written !== expected) {
    fail(`dist/_headers: expected ${JSON.stringify(expected)}, got ${JSON.stringify(written)}`);
  }
  if (!written.includes(CACHE_RULE)) {
    fail('dist/_headers: missing the immutable /_astro/* cache rule (fonts would revalidate on every navigation)');
  }
  // Independent of the writer: no noindex rule may be able to reach the canonical host.
  const canonicalHost = new URL(SITE_ORIGIN).host;
  for (const block of (written ?? '').split(/\n\s*\n/)) {
    const [line = '', ...headerLines] = block.split('\n').filter((l) => l.trim() !== '' && !l.startsWith('#'));
    if (!headerLines.some((l) => /^\s+X-Robots-Tag:/i.test(l))) continue; // not a noindex rule
    if (!line.startsWith('https://')) {
      fail(`dist/_headers: rule "${line}" is not host-matched, so it also applies to ${canonicalHost}`);
      continue;
    }
    if (hostPatternMatches(line.slice('https://'.length).split('/')[0], canonicalHost)) {
      fail(`dist/_headers: rule "${line}" matches the canonical host ${canonicalHost}`);
    }
  }
}

if (failures.length === RESIDUE_FAILURE_BASELINE) pass('no-residue asserts');

// ---- Summary ----------------------------------------------------------------

if (failures.length > 0) {
  console.log(`\nverify: ${failures.length} violation(s) — gate BLOCKED`);
  process.exit(1);
}
console.log(`\nverify: OK — ${htmlFiles.length} HTML, ${cssFiles.length} CSS files checked (${SITE_ORIGIN})`);
// Static-output verification gate. Walks dist/** and exits non-zero on any
// violation. Plain Node ESM, zero runtime deps.
//
// Rules:
//   1. Functional-JS markers. Any <script> with src=, or a non-empty inline
//      body that isn't type="application/ld+json" (data block), plus any
//      event-handler attribute (onclick=, onload=, ...) anywhere in the page.
//   2. Third-party origin. In load-bearing HTML attrs (src/srcset/href/poster/
//      action) and CSS url() references, any absolute-URL/protocol-relative host
//      that isn't SITE_ORIGIN fails. <a href> anchors are exempt (outbound
//      links are a feature); JSON-LD lives in exempted data blocks and is never
//      fetched.
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
//      (the Person node) with it.
//
// Ordering: `npm run verify` assumes dist/ came from a build in the *current*
// environment. A CF_PAGES_BRANCH-prefixed (preview) build leaves dist/_headers
// on disk, so re-run a plain `npm run build` before verifying if you built with
// that variable set. In CI the `npm run build && npm run verify` chain sees one
// environment for both, so this only bites local runs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIR = resolve('dist');
const ALLOWED_ORIGIN = process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev';
const ALLOWED_HOST = new URL(ALLOWED_ORIGIN).hostname;

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

// ---- Rule 1: functional-JS markers -----------------------------------------

const SCRIPT = /<\s*script\b([^>]*)>([\s\S]*?)<\/\s*script\s*>/gi;
const HAS_SRC = /\bsrc\s*=/i;
const TYPE_ATTR = /\btype\s*=\s*["']?([^"'\s>]+)/i;
const EVENT_HANDLER = /\s(on[a-z]+)\s*=\s*("|')[^"']*("|')/i;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');

  let m;
  SCRIPT.lastIndex = 0;
  while ((m = SCRIPT.exec(html))) {
    const attrs = m[1];
    const body = m[2];
    if (HAS_SRC.test(attrs)) {
      fail(`${file}: <script> with src= (client JS file)`);
      continue;
    }
    const type = TYPE_ATTR.exec(attrs)?.[1] ?? '';
    if (body.trim() !== '' && type.toLowerCase() !== 'application/ld+json') {
      fail(`${file}: inline <script> body without type="application/ld+json"`);
    }
  }

  if (EVENT_HANDLER.test(html)) {
    const hit = EVENT_HANDLER.exec(html);
    fail(`${file}: event-handler attribute ${hit?.[1] ?? ''}`);
  }
}

// ---- Rule 2: third-party origins -------------------------------------------

const ORIGIN_FAILURE_BASELINE = failures.length; // so only rule 2 drives its own PASS line
const ATTR_URL = new RegExp(
  `\\b(src|srcset|href|poster|action)\\s*=\\s*(["'])(.*?)\\2`,
  'gi',
);
const CSS_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;
const wouldLoad = (host) => host && host.toLowerCase() !== ALLOWED_HOST.toLowerCase();

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');

  let tag;
  const OPEN_TAG = /<([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'"<>])*?)>/g;
  OPEN_TAG.lastIndex = 0;
  while ((tag = OPEN_TAG.exec(html))) {
    const tagName = tag[1].toLowerCase();
    const attrs = tag[2];
    let a;
    ATTR_URL.lastIndex = 0;
    while ((a = ATTR_URL.exec(attrs))) {
      const [attr, , , value] = [a[0], a[1], a[2], a[3]];
      void attr;
      const attrName = a[1];
      if (tagName === 'a' && attrName === 'href') continue; // outbound links are a feature
      for (const candidate of value.split(',').map((s) => s.trim())) {
        const host = extractHost(candidate);
        if (wouldLoad(host)) fail(`${file}: <${tagName} ${attrName}> → ${host}`);
      }
    }
  }

  // CSS url() references inside inlined <style> blocks.
  for (const block of html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? []) {
    let u;
    CSS_URL.lastIndex = 0;
    while ((u = CSS_URL.exec(block))) {
      const host = extractHost(u[2]);
      if (wouldLoad(host)) fail(`${file}: css url() → ${host}`);
    }
  }
}

for (const file of cssFiles) {
  const css = readFileSync(file, 'utf8');
  let u;
  CSS_URL.lastIndex = 0;
  while ((u = CSS_URL.exec(css))) {
    const host = extractHost(u[2]);
    if (wouldLoad(host)) fail(`${file}: css url() → ${host}`);
  }
}

if (failures.length === ORIGIN_FAILURE_BASELINE) {
  pass('third-party scan: all load-bearing refs same-origin');
}

function extractHost(candidate) {
  const s = candidate.trim();
  if (/^https?:\/\//i.test(s)) return new URL(s).hostname;
  if (s.startsWith('//')) return s.slice(2, s.indexOf('/', 2) === -1 ? undefined : s.indexOf('/', 2));
  return null;
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

// Quotes around the type value are optional here exactly as they are in rule 1's
// TYPE_ATTR, so a block rule 1 exempts as data is never invisible to 4c/4d.
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

// 4e. Two complementary checks on dist/_headers:
//   - Content, whenever the file exists, on any branch: it must be byte-exactly
//     the preview noindex rule (design §10.1). Deliberately branch-independent.
//     If the production branch were ever anything but PROD_BRANCH, gen-headers
//     would misclassify a production build as preview and ship
//     X-Robots-Tag: noindex to the canonical host — a live SEO outage — and the
//     branch-aware check below would quietly stop asserting anything while still
//     printing PASS. This one needs no env var, so it still holds.
//   - Absence, on a production build only: nothing should be written at all,
//     and a file left behind by an earlier preview build is dead configuration
//     (RES-X3). Branch-aware so a preview deploy's gate is not broken by it.
const NOINDEX_RULE = '/*\n  X-Robots-Tag: noindex\n';
const PROD_BRANCH = 'main'; // must match scripts/gen-headers.mjs — change one only with the other
const headersPath = join(DIR, '_headers');

if (exists(headersPath)) {
  const written = readText(headersPath);
  if (written !== null && written !== NOINDEX_RULE) {
    fail(`dist/_headers: not the preview noindex rule (${JSON.stringify(written)})`);
  }
}

if (!process.env.CF_PAGES_BRANCH || process.env.CF_PAGES_BRANCH === PROD_BRANCH) {
  if (exists(headersPath)) {
    fail('dist/_headers: present on a production build — production must emit no _headers at all');
  } else {
    pass('dist/_headers: absent on this production build');
  }
}

if (failures.length === RESIDUE_FAILURE_BASELINE) pass('no-residue asserts');

// ---- Summary ----------------------------------------------------------------

if (failures.length > 0) {
  console.log(`\nverify: ${failures.length} violation(s) — gate BLOCKED`);
  process.exit(1);
}
console.log(`\nverify: OK — ${htmlFiles.length} HTML, ${cssFiles.length} CSS files checked (${ALLOWED_HOST})`);
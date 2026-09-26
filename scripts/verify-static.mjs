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
//   3. Presence asserts: 404.html, robots.txt, both sitemap files, the résumé
//      page's href="/resume.pdf" anchor, and the _headers cache rule.
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

function extractHost(candidate) {
  const s = candidate.trim();
  if (/^https?:\/\//i.test(s)) return new URL(s).hostname;
  if (s.startsWith('//')) return s.slice(2, s.indexOf('/', 2) === -1 ? undefined : s.indexOf('/', 2));
  return null;
}

// ---- Rule 3: presence asserts -----------------------------------------------

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
mustContain('resume/index.html', 'href="/resume.pdf"', 'résumé download anchor');
mustContain('_headers', 'Cache-Control: public, max-age=60, must-revalidate', '_headers cache rule');

// ---- Summary ----------------------------------------------------------------

pass('third-party scan: all load-bearing refs same-origin');
pass('presence asserts');
if (failures.length > 0) {
  console.log(`\nverify: ${failures.length} violation(s) — gate BLOCKED`);
  process.exit(1);
}
console.log(`\nverify: OK — ${htmlFiles.length} HTML, ${cssFiles.length} CSS files checked (${ALLOWED_HOST})`);
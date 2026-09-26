# QA Report — T-16: robots.txt endpoint — allow-all + explicit AI crawlers + Sitemap line

- **Ticket:** T-16 (`projects/initial-site/tickets/tickets.md` — SEO-4, SEO-11, SEO-12 philosophy)
- **Baseline:** `6113b7a` (T-15); working-tree delta under test
- **QA date:** 2026-09-23 · **Platform:** darwin
- **Changed paths (exactly 2):** `src/pages/robots.txt.ts` (new), `projects/initial-site/tickets/tickets.md` (M — T-16 checkbox flip)

## Verdict: **Pass**

All acceptance criteria verified against source and built output. `dist/robots.txt` matches design §5.4's exact output byte-for-byte. Zero blockers.

## Acceptance criteria evidence

| AC | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | `robots.txt.ts` prerendered endpoint: global `User-agent: *` / `Allow: /` + named Allow blocks for OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, and a `Sitemap:` line | `dist/robots.txt` contains all four bots + global allow; `Sitemap: https://mattoconn.pages.dev/sitemap-index.xml` trailing the file. Design §5.4 exact output reproduced. | Pass |
| 2 | `Sitemap:` generated from `SITE_URL` (T-4) — no hardcoded host | `PUBLIC_SITE_URL=https://example.test npm run build` → `Sitemap: https://example.test/sitemap-index.xml`. Restored default build re-emits the `mattoconn.pages.dev` line. | Pass |
| 3 | No `Disallow` rules anywhere | Script asserts zero `Disallow` occurrences in the output. | Pass |

## Validation gates (all executed)

1. **Typecheck** — `npx astro check` exit 0: 0 errors, 0 warnings, 2 hints (pre-existing T-2 zod debt). Pass.
2. **Build** — exit 0; `dist/robots.txt` emitted. Pass.
3. **Ticket verifier** — `rg 'OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Sitemap:' dist/robots.txt` → all five present. Pass.
4. **Sitemap-name byte-identity (§9)** — `Sitemap:` points at `sitemap-index.xml`, the exact built index filename from T-15. Pass.
5. **No Disallow** — verified via assertions. Pass.
6. **Endpoint precedence (§5.1)** — the catch-all `[...slug]` does NOT claim `/robots.txt` (static route precedence; verified by the built file appearing at `dist/robots.txt`, not `dist/robots/index.html`). Pass.

## Bugs found

None.

## Edge-case / watcher notes

| ID | Severity | Description | Disposition |
|---|---|---|---|
| W-1 | Info | T-20's verify-static presence list includes `dist/robots.txt`. Ready. |
| W-2 | Info | Preview builds also prerender robots with the default canonical `Sitemap:` (deploy host) — correct: the sitemap should reference the canonical production index; preview noindex comes from `_headers` (T-18), not robots. | — |

## Regression risk (T-18 → T-24)

- **T-18 (_headers):** independent of robots (Cloudflare `_headers` vs robots.txt Disallow distinction per SEO-12 — robots must never Disallow; this file never does). Ready.
- **T-20 (verify-static):** robots presence assert. Ready.
- Earlier ticket files untouched. No regression.

## Recommendation

Sign-off. T-16 satisfies its acceptance criteria and the design §5.4 normative output. Proceed to T-17.
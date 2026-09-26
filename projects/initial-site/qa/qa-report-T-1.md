# QA Test Report — T-1: Scaffold Astro 7 + TS strict + baseline static build

- **Commit under test:** `8228acd` (`feat: scaffold Astro 7 + TS strict baseline (T-1)`), parent `d9a76f8`
- **Repo state:** `main` @ `8228acd`, working tree **clean**
- **Date:** 2026-09-22

## Verdict: **Pass**

## Summary

The scaffold is correct, complete, and fully verifiable: Astro `^7.3.3` in the repo root with a minimal template, strict TS (`strict: true` resolved), `@astrojs/sitemap` + `zod` installed via npm with lockfile consistency, and a clean baseline static build producing **zero-JS** output. All 7 acceptance criteria hold and were independently re-executed. Scope discipline holds — no later-ticket content was pre-empted.

## AC Checklist

| # | Acceptance Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Scaffolded in repo root, minimal template, `--no-git`, committed after clean baseline build | **Pass** | Scaffold files at root; single `.git` at repo root; `8228acd` is the scaffold commit; clean build (exit 0) reproduced from that state. |
| 2 | `package.json` pins Astro `^7` | **Pass** | `"astro": "^7.3.3"`; installed `astro@7.3.3` (`npm ls`); build banner `Astro v7.3.3` in dist. |
| 3 | `tsconfig.json` extends `astro/tsconfigs/strict`; resolved `strict: true`; `@astrojs/check` + `typescript` devDeps; `check` script | **Pass** | `tsconfig.json` extends `astro/tsconfigs/strict` (`npx tsc --showConfig` resolves `strict: true`); devDeps `@astrojs/check ^0.9.10`, `typescript ^6.0.3`; `scripts.check: "astro check"`. |
| 4 | `@astrojs/sitemap` + `zod` as dependencies via npm; manifest ↔ lockfile consistency | **Pass** | `@astrojs/sitemap ^3.7.4`, `zod ^4.6.5`; `npm ci --dry-run` clean; `npm ls --depth=0` resolves all 5 packages. |
| 5 | `npm run build` exit 0 → static-only `dist/`; `npx astro check` zero errors; `npm run dev` serves HTTP 200 | **Pass** | Clean rebuild: exit 0, `output: "static"`, 1 page; `dist/` = `index.html` + 2 favicons, **`find dist -name '*.js'` = 0**; `astro check` → 0 errors / 0 warnings / 0 hints; dev server HTTP 200, stopped clean. |
| 6 | Baseline build time recorded in commit message, <60s | **Pass** | Commit records ~1.2s wall; independent measurement 1.05s. Both well under the 60s DEP-4 SHOULD. |
| 7 | `.gitignore` covers `node_modules/`, `dist/`, `.env*` (+allows `.env.example`), Cloudflare/wrangler junk | **Pass** | All present; `git check-ignore -v` confirms ignores; `.env.example` allowlisted. |

**Ticket verification command** (`npm run build && npx astro check && ls dist/`): all stages pass; `ls dist/` = `favicon.ico favicon.svg index.html`.

## Additional Validations

| Check | Result |
|---|---|
| No pre-emption of later tickets | **Pass** — `astro.config.mjs` bare `defineConfig({})`; no `src/config/*`, no content schema, no 404/robots/fonts/headers. |
| Only allowed doc change = T-1 checkbox flip | **Pass** — exactly one hunk at tickets L33 (`- [ ]` → `- [x]`); all other 23 items unchanged. |
| No secrets / PII / absolute local paths | **Pass** — `git grep` for path/secret patterns: no matches; lockfile https-only. |
| `dist/` gitignored, not committed | **Pass** — `git ls-files 'dist/**'` = 0 files. |
| `git status` clean post-build | **Pass** |
| Whitespace errors (`git show --check`) | **Pass** |
| Dependency tree (`npm ls --all --depth=0`) | **Pass** |

## Findings

1. **[Minor — scope note]** `AGENTS.md` and `CLAUDE.md` (symlink → `AGENTS.md`) are committed but not part of the Astro minimal template and are unowned by any ticket (design §12.5 lists them nowhere). Their content (`astro dev --background` workflow) exactly matches the maintainer's declared operating convention for this repo, so it is intentional and functional rather than a stray artifact. No action required; keep for the §12.5 "no unowned files" audit.
2. **[Minor — watch item]** `engines.node` is `>=22.12.0`; tech design §2 floor is `>=20` with "22 LTS recommended". Stricter than the design minimum but consistent with the recommendation; the dev host runs Node 24. Watch item: the Cloudflare Pages project (T-19) must set `NODE_VERSION=22` (or newer) or the engine gate fails at deploy time.
3. **[Informational]** `npm ci --dry-run` warns `fsevents@2.3.3` has an install script not covered by `allowScripts` — macOS-only optional dep of Vite's watcher; Cloudflare (Linux) builds unaffected. `allowScripts: { "esbuild": true }` correctly present.
4. **[Informational]** README/.vscode/favicons are scaffold-generated minimal-template artifacts; design §3 notes README is optional per T-19.

## Recommendation

**Sign-off (Pass).** T-1 contract holds in every dimension tested. Watch items for later tickets: (a) Cloudflare Pages must honor `engines.node >=22.12.0` at T-19; (b) `AGENTS.md`/`CLAUDE.md` are unowned-but-intentional repo files — keep in mind for the design §12.5 audit.
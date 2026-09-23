# QA Report — T-4: Site URL config (PUBLIC_SITE_URL, default `https://mattoconn.pages.dev`)

- **Ticket:** T-4 (`docs/tickets/tickets-personal-website.md` — SEO-11, DEP-5, DEP-6)
- **Baseline:** `ecae48f` (T-3); working-tree delta under test
- **QA date:** 2026-09-22 · **Node:** v24.21.0 · **Platform:** darwin
- **Changed paths (exactly 4):** `astro.config.mjs` (M), `docs/tickets/tickets-personal-website.md` (M — checkbox flip only), `.env.example` (U), `src/config/site.ts` (U)

## Verdict: **Pass**

All acceptance criteria and the normative tech-design contract (§4.5 `site.ts`, §9 `site` key, `CF_PAGES_URL` prohibition) hold as-shipped. No blocking bugs. One low-severity informational note (F1) tracked for T-15/T-19 — not a T-4 defect.

## Acceptance criteria evidence

| Criterion | Result |
|---|---|
| `site.ts` exports `SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? DEFAULT` (+`SITE_ORIGIN`/`path()`/`absoluteUrl()` per §4.5) | Pass — esbuild harness, 18 assertions × 3 env scenarios all green |
| `astro.config.mjs` sets `site: process.env.PUBLIC_SITE_URL ?? 'https://mattoconn.pages.dev'` | Pass — byte-identical default string |
| `.env.example` documents `PUBLIC_SITE_URL` + `CF_PAGES_BRANCH`; no real `.env` committed | Pass — glob/`git check-ignore` confirm only `.env.example`; `.env` ignored by `.gitignore:17` |
| Build with env unset → exit 0; with `PUBLIC_SITE_URL=https://example.test` → exit 0; trailing-slash value → exit 0 | Pass — exit 0 ×3 |
| `CF_PAGES_URL` never used as site URL | Pass — token appears only in the `.env.example` constraint comment, zero read paths |

## E2E scenarios

| # | Scenario | Result |
|---|---|---|
| E1 | `npm run build` (env unset) | Exit 0; static build completes |
| E2 | `PUBLIC_SITE_URL=https://example.test npm run build` | Exit 0 |
| E3 | `PUBLIC_SITE_URL=https://example.test/ npm run build` | Exit 0 (trailing-slash tolerance) |
| E4 | `npx astro check` | Exit 0 — 0 errors / 0 warnings / 2 pre-existing T-2 zod hints (out of scope) |
| E5 | `rg 'PUBLIC_SITE_URL' astro.config.mjs src/config/site.ts .env.example` | Present in all three |

## Manual cases

- M1: no `.env` committed — Pass
- M2: `CF_PAGES_URL` only in warning comment — Pass
- M3: `.env.example` documents both vars + prohibition — Pass
- M4: T-15 items absent at this rank (no `trailingSlash`, no sitemap integration) — Pass (verifier-at-rank discipline, plan risk #4)
- M5: UI rendering — N/A by design (no page consumes `site.ts` until T-12/T-15)

## Edge-case matrix (pure-module harness)

Default host, env override, trailing-slash strip, `SITE_ORIGIN`, `path('')`/`path('/')` → `/`, `path('resume'/'/resume/'/'//nested//')` → `/resume/`/`/nested/`, `absoluteUrl('resume')` → `<host>/resume/`, single trailing-slash policy, config byte-identity — **all Pass**.

## Bugs found

| ID | Severity | Description | Disposition |
|---|---|---|---|
| F1 | Low (informational) | Trailing-slash asymmetry: `astro.config.mjs` does not strip (`site: process.env.PUBLIC_SITE_URL ?? …`) while `site.ts` strips via `?.replace(/\/+$/, '')`. Matches the normative design (§4.5/§9 show no strip in config); no live impact since T-19 pins the slash-free value `https://mattoconn.pages.dev`. If T-15 ever gets a trailing-slash var, sitemap/canonical byte-identity could break. | Watch-item for T-15/T-19: keep `PUBLIC_SITE_URL` slash-free (documented in `.env.example`); optionally normalize config at T-15. No change required for T-4. |

## Regression risk (T-5 → T-24)

- T-12/T-16/T-18 (canonical/robots/headers consumers of `SITE_URL`): safe — module contract verified byte-exact and slash-policy-consistent.
- T-15 (sitemap): `site` key now active; `Astro.site` available. Watch F1 for trailing-slash var.
- T-19 (deploy): must set `PUBLIC_SITE_URL=https://mattoconn.pages.dev` exactly (no trailing slash) — already the documented value.
- Keystone spine: T-4 adds no runtime output dependency; scaffold build output unchanged (1 page). No regression possible from this change.

## Recommendation

Conditional-free sign-off. Proceed to T-5.
## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Changelog and Versioning

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/). `package.json`'s `version` and the git tags track the latest release.

- **Record changes as you go.** Any commit that changes what visitors or crawlers see adds a bullet under `## [Unreleased]` at the top of `CHANGELOG.md`, in the same commit, grouped under `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, or `Security`. That covers pages, content, navigation, styles, SEO and structured data, headers, and deploy behavior. Internal-only work (refactors, tests, tooling, docs, agent files) needs no entry unless it changes the built output.
- **Pick the version by public impact:**
  - MAJOR: removes or renames a public URL, or restructures existing pages in a way that breaks links or bookmarks.
  - MINOR: adds something visitors can see, such as a new page, section, feature, or project write-up.
  - PATCH: fixes, copy edits, style tweaks, and dependency updates with no new surface.
- **Release with every production push.** Pushing to `main` deploys to production, so never leave shipped changes under `Unreleased`. To cut a release:
  1. Rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` and add a fresh empty `## [Unreleased]` above it.
  2. Run `npm version X.Y.Z --no-git-tag-version` to bump `package.json` and `package-lock.json`.
  3. Commit as `chore(release): vX.Y.Z`.
  4. Tag it with `git tag -a vX.Y.Z -m "vX.Y.Z"`.
  5. Push the commit and tag together with `git push origin main --follow-tags`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Gotchas

- Keep `wrangler.jsonc` committed and never install `@astrojs/cloudflare`. Without the file, Workers Builds' `wrangler deploy` runs `astro add cloudflare` on its own, which installs the SSR adapter and moves output to `dist/client/`.
- Keep the empty `previews: {}` block in `wrangler.jsonc`. Without it, `wrangler preview` refuses to run and non-production branch builds fail.
- `name` in `wrangler.jsonc` must exactly match the Worker name in the Cloudflare dashboard (`www`), or Workers Builds refuses to build.
- Noindex non-canonical hosts by hostname, not by branch. Branch detection misses each production deploy's own Version and Deployment URLs, and a path-only `/*` rule in `_headers` would also noindex the canonical host.
- Host-matched `_headers` rules never fire under `wrangler dev` (localhost). Test them on a real Version URL from `npx wrangler versions upload`.
- `_headers` is checked byte-for-byte against `noindexHeadersFor()` in `scripts/verify-static.mjs`. Any new rule (e.g. a cache header) means editing `scripts/noindex-rule.mjs` and `scripts/verify-static.mjs` together.
- `scripts/verify-static.mjs` requires exactly one JSON-LD block on `/`. Adding a `WebSite` or `BreadcrumbList` node fails with the misleading message "structured data lost"; relax that check first.
- The retired-path gate in `scripts/verify-static.mjs` fails on any `/resume` URL, including outbound links (e.g. `github.com/x/resume`).
- Deleting a section means deleting its content `.md` file. A leftover template `.astro` file is harmless; a content file whose template is gone fails the build.
- Use `wrangler dev`, not `astro preview`, to check routing. `astro preview` doesn't redirect `/about` to `/about/`, gives a generic 404 for paths without a trailing slash, and matches case-insensitively on macOS.

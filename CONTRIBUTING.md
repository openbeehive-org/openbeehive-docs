# Contributing to the Openbeehive documentation

Thanks for helping improve the docs at
[docs.openbeehive.org](https://docs.openbeehive.org)! This repository is the
**documentation site** (built with [Docusaurus](https://docusaurus.io/)). The
application and marketing site live in
[`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) and
[`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site).

## Development setup

- Node.js at the version in `.nvmrc` (`nvm use`), then `npm ci`. `.npmrc` sets
  `ignore-scripts=true`; the build needs no install scripts.
- `npm run tools` installs the pinned `fleetlint` and `gitleaks` (needs Go).
- `prek install` sets up the git hooks in `.pre-commit-config.yaml`: hygiene,
  secret scan, Prettier, ESLint, tsc and fleetlint on commit, conventional
  commit messages, `npm run check` before push.

```bash
npm start          # local dev server with live reload
npm run build      # static output in ./build (any static host / CDN)
npm run check      # lint, site build, audit, fleetlint; CI runs the same
```

`npm run check` must pass: Prettier, ESLint and tsc, the site build (every
page of every version and locale compiles), npm advisories via audit-ci, the
license allowlist, unused dependencies (knip), gitleaks and fleetlint.
Prettier formats code and config only; MDX prose and the generated i18n files
are not reformatted. Commit messages follow Conventional Commits
(`docs:`, `fix:`, `chore:` ...).

## Writing docs

- **Edit the current docs in `docs/`.** Do not edit `versioned_docs/`; those
  are frozen snapshots of released versions.
- Docs are organised into **Using the app**, **Using the API**,
  **Self-hosting**, **Beekeeping basics**, the **Knowledge base** and
  **Developers**. Put new pages in the matching folder.
- Use a `sidebar_position` in the front matter to order pages.
- Keep links relative so the broken-link checker (`onBrokenLinks: 'throw'`)
  passes during `npm run build`.

### Translations

English (`docs/`) is the source of truth. The docs are localised into German,
French, Spanish and Italian via Docusaurus i18n under `i18n/<locale>/`:

- Page translations live in
  `i18n/<locale>/docusaurus-plugin-content-docs/current/` (and the matching
  `version-<x.y.z>/` snapshots).
- UI labels (navbar, footer, category names) live in the `*.json` files there;
  regenerate the scaffolding with `npm run write-translations -- --locale <loc>`.

When you change an English page, update the matching translated files (or leave a
note for translators). `npm run build` builds **all** locales and fails on a
broken link in any of them. To preview one locale: `npm start -- --locale fr`.

## Releasing a new docs version

When the app cuts a release, snapshot the docs:

```bash
npm run docusaurus docs:version <app version>
```

## Pull requests

1. Fork and branch from `main`.
2. Make sure `npm run check` passes (it builds with no broken links).
3. Reference any related issue (`Closes #123`).

## License

By contributing, you agree that your contributions are licensed under the
project's [AGPL-3.0](LICENSE) license.

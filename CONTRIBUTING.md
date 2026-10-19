# Contributing to the Openbeehive documentation

Thanks for helping improve the docs at
[docs.openbeehive.org](https://docs.openbeehive.org)! This repository is the
**documentation site** (built with [Docusaurus](https://docusaurus.io/)). The
application and marketing site live in
[`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) and
[`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site).

## Development setup

You'll need **Node 24+**.

```bash
npm install
npm start          # local dev server with live reload
npm run build      # static output in ./build (any static host / CDN)
```

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
2. Make sure it builds with no broken links (`npm run build`).
3. Reference any related issue (`Closes #123`).

## License

By contributing, you agree that your contributions are licensed under the
project's [AGPL-3.0](LICENSE) license.

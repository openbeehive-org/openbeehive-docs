# Architecture

openbeehive-docs is the documentation of
[Openbeehive](https://github.com/openbeehive-org/openbeehive-app), published at
<https://docs.openbeehive.org>. It is a static [Docusaurus](https://docusaurus.io/)
site; nothing runs server-side.

## Components

- **`docs/`** — the unreleased "Next" docs, served under `/next/`. The sidebar
  is generated from the tree and its `_category_.json` files (`sidebars.ts`).
- **`versioned_docs/`, `versioned_sidebars/`, `versions.json`** — one frozen
  snapshot per app release, written by `docusaurus docs:version`. The newest
  entry in `versions.json` is served at the site root.
- **`i18n/<locale>/`** — German, French, Spanish and Italian translations of
  every page (`current/` and one folder per snapshot) plus the UI labels.
  English in `docs/` is the source of truth.
- **`src/`** — site code: the theme colours (`src/css/custom.css`) and the
  `/versions` page (`src/pages/versions.tsx`).
- **`docusaurus.config.ts`** — site metadata, locales, navbar with the version
  and language switches, footer, and version labels.
- **`static/`** — files copied verbatim (logo, favicon, social card).

## Build and deploy

`npm run build` renders every version in every locale into `build/`. Two
pipelines use it:

- **GitHub** (`.github/workflows/check.yml`) runs `npm run check` on pushes to
  `main`, pull requests and weekly: lint, build, dependency and secret audit,
  fleetlint.
- **Gitea** (`.gitea/workflows/deploy.yml`) builds on every push and, for a
  `v*` tag only, hands the `build/` artifact to the shared `johnny/build`
  deploy workflow, which rsyncs it to the static web host. The deploy job
  never sees the repository source.

## Decisions

- **Docs versions follow app releases.** A reader running app vX.Y.Z picks the
  matching snapshot; the site version in `package.json` and the tag name track
  the documented release.
- **Static output, own hosting.** No server, no analytics; the host only serves
  files, so the attack surface is the build toolchain, which `npm run audit`
  watches.
- **Prose is not machine-formatted.** Prettier covers code and config; MDX and
  the generated i18n files are left as written so diffs stay reviewable.

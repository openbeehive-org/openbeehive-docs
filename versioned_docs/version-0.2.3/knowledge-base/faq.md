---
sidebar_position: 5
title: "FAQ"
---

# Frequently Asked Questions

Quick answers to the questions we hear most often. If something is missing, check the [troubleshooting guide](/knowledge-base/troubleshooting) or ask the community on [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Is Openbeehive free?

Yes. Openbeehive is open source under the **AGPL-3.0** licence, so you are free to use, study, modify and self-host it.

The hosted service at [app.openbeehive.org](https://app.openbeehive.org) is free to use for now while the project is young. If that ever changes, you will always be able to export your data and run your own instance instead.

## Is my data private?

Your records live on your own device first. Openbeehive is **offline-first**: the app stores everything in a local database on your phone, tablet or computer, and syncs to the server only in the background.

If you self-host, your data never leaves your own infrastructure. On the hosted service, your records are stored on our servers so they can sync between your devices, but they remain yours.

:::tip
Want full control? See [Self-hosting](/category/self-hosting) to run Openbeehive on your own hardware.
:::

## Does it work offline?

Yes, completely. Openbeehive is a Progressive Web App (PWA) that keeps a full copy of your data on the device. Reading and writing records is local and instant, so it works perfectly in an apiary with no signal.

When you regain connectivity, your changes sync automatically. Read more in [Offline and sync](/using-the-app/offline-and-sync).

## Does it work on my phone?

Yes. Openbeehive runs in any modern browser and can be installed to your home screen so it behaves like an app. It works on phones, tablets and desktops. See [Installing the app](/using-the-app/install) for the steps on each platform.

## Is there a native app?

There is no separate native app in the App Store or Play Store today, and you do not need one. The installable PWA gives you an app icon, offline use and full-screen mode on iOS, Android, Windows, macOS and Linux from a single codebase.

## Can I export my data?

Yes. Because the project is open source and your data is stored in a standard SQLite database, you are never locked in.

- **Self-hosters** can back up the database directly. See [Backups](/self-hosting/backups).
- On the **hosted service**, export tools are part of the roadmap. Your records are also kept locally on each synced device.

## Can I self-host it?

Absolutely, and it is designed to be easy. There are two deployment profiles:

| Profile | Best for | Stack |
| --- | --- | --- |
| `selfhost` | Hobbyists, single user | A single binary, SQLite + local files, no Docker needed |
| `cloud` | Multi-user, larger setups | Docker, PostgreSQL + S3/MinIO storage |

Start with the [Quick start](/self-hosting/quick-start), or jump to the [single binary guide](/self-hosting/single-binary).

:::note
For a private single-user instance you can disable login entirely. See [Authentication](/self-hosting/authentication).
:::

## How does sharing work?

Sharing happens at the **apiary** level through "scopes". When you share an apiary, the people you share it with can see and contribute to everything inside it: its hives, queens, inspections, tasks and more.

Sync is conflict-free by design, so two people editing the same apiary on different devices will not clobber each other's work. Edits merge cleanly even after long periods offline. The technical details are covered in the [sync protocol](/developers/sync-protocol).

## What hive types are supported?

Openbeehive supports the most common frame and top-bar systems:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Other

See [Hive types](/knowledge-base/hive-types) for guidance on choosing.

## How are queens marked?

Openbeehive follows the international queen marking colour scheme, based on the last digit of the year:

| Year ends in | Colour |
| --- | --- |
| 1 or 6 | White |
| 2 or 7 | Yellow |
| 3 or 8 | Red |
| 4 or 9 | Green |
| 5 or 0 | Blue |

The app picks the right colour for you automatically. Full details are on the [queen marking colours](/knowledge-base/queen-marking-colours) page.

## What are the QR labels for?

Each hive can have a printable QR label. Scanning it opens Openbeehive straight at that hive, so you can pull up its records in the apiary without typing or searching. See [QR labels](/using-the-app/qr-labels).

## What languages is it available in?

Openbeehive is being built with internationalisation in mind, with German and English as the first focus given the project's roots. Additional languages are welcome as community contributions.

## Which databases and storage backends are supported?

When self-hosting, the backend is pluggable:

- **Databases:** PostgreSQL, MySQL or SQLite. See [Databases](/self-hosting/databases).
- **Blob storage:** MinIO/S3-compatible object storage, or the local filesystem. See [Storage](/self-hosting/storage).

## How do I sign in?

The hosted service uses OIDC login (sign in with a supported provider), with optional passkeys (WebAuthn) for a passwordless experience. Self-hosters can configure their own OIDC providers, enable passkeys, or turn login off entirely for single-user setups. See [Authentication](/self-hosting/authentication).

## How do I report a bug or request a feature?

Please open an issue on our [GitHub organisation](https://github.com/openbeehive-org/openbeehive-app). Clear steps to reproduce, your platform and browser, and a screenshot all help enormously.

The [troubleshooting page](/knowledge-base/troubleshooting) may already cover common issues.

## How can I contribute?

Contributions of all kinds are welcome: code, documentation, translations, bug reports and ideas. The stack is Go on the backend and a SvelteKit PWA on the frontend.

Read the [contributing guide](/developers/contributing) to get started, and have a look at the [architecture overview](/developers/architecture) to understand how the pieces fit together.

## What version is this?

The current release is **v0.1.0**, our first public release. Expect rapid improvements, and check the [upgrading guide](/self-hosting/upgrading) when new versions land.

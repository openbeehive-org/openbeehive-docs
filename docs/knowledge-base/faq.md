---
sidebar_position: 5
title: "FAQ"
---

# Frequently Asked Questions

Quick answers to the questions we hear most often. If something is missing, check the [troubleshooting guide](./troubleshooting.md) or ask the community on [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Is Openbeehive free?

Yes. Openbeehive is open source under the **AGPL-3.0** licence, so you are free to use, study, modify and self-host it.

The hosted service at [app.openbeehive.org](https://app.openbeehive.org) is free to use for now while the project is young, and currently invite-only: write to [contact@openbeehive.org](mailto:contact@openbeehive.org) for an invite, or look around first with the **Try the demo** button on its sign-in page. If the terms ever change, you will always be able to export your data and run your own instance instead.

## Is my data private?

Your records live on your own device first: the app stores everything in a local database on your phone, tablet or computer and syncs to the server in the background.

If you self-host, your data never leaves your own infrastructure. On the hosted service, your records are stored on our servers so they can sync between your devices, but they remain yours.

The only outside services the app contacts are the map: tiles and the address lookup on the apiary form come from OpenStreetMap unless the operator configured others or switched the map off.

:::tip
Want full control? See [Self-hosting](/category/self-hosting) to run Openbeehive on your own hardware.
:::

## Does it work offline?

Yes, completely. Openbeehive is a Progressive Web App (PWA) that keeps a full copy of your data on the device. Reading and writing records is local and instant, so it works perfectly in an apiary with no signal.

When you regain connectivity, your changes sync automatically. Read more in [Offline and sync](../using-the-app/offline-and-sync.md).

## Does it work on my phone?

Yes. Openbeehive runs in any modern browser and can be installed to your home screen so it behaves like an app. It works on phones, tablets and desktops. See [Installing the app](../using-the-app/install.md) for the steps on each platform.

## Is there a native app?

There is no separate native app in the App Store or Play Store today, and you do not need one. The installable PWA gives you an app icon, offline use and full-screen mode on iOS, Android, Windows, macOS and Linux from a single codebase.

## Can I export my data?

Yes. **Settings → Data & backup** exports everything on your device as a full JSON backup, a spreadsheet (XLSX), CSV files in a ZIP, BeeXML, or a printable PDF report, and imports JSON, BeeXML and CSV from other apps. See [Import & export](../using-the-app/import-export.md). Self-hosters can also back up the server database directly; see [Backups](../self-hosting/backups.md).

## Can I self-host it?

Absolutely, and it is designed to be easy. There are two deployment profiles:

| Profile | Best for | Stack |
| --- | --- | --- |
| `selfhost` | Hobbyists, single user | A single binary, SQLite + local files, no Docker needed |
| `cloud` | Several users, larger setups | Docker, PostgreSQL + S3/MinIO storage |

Start with the [Quick start](../self-hosting/quick-start.md), or jump to the [single binary guide](../self-hosting/single-binary.md).

:::note
A private single-user instance runs without login by default; turn login on before you share it. See [Authentication](../self-hosting/authentication.md).
:::

## How does sharing work?

Records are shared through **workspaces**. Every account has a personal workspace and can be invited into others, for example a club's. Everyone in a workspace sees and edits all of its apiaries, hives and records; there is no per-apiary sharing. Tasks are the exception: they are personal. Sync is conflict-free, so two people editing in the same workspace on different devices do not overwrite each other's work. See [Accounts & workspaces](../using-the-app/accounts-tenants.md).

## What hive types are supported?

Openbeehive supports the most common frame and top-bar systems:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Other

See [Hive types](./hive-types.md) for guidance on choosing.

## How are queens marked?

Openbeehive follows the international queen marking colour scheme, based on the last digit of the year:

| Year ends in | Colour |
| --- | --- |
| 1 or 6 | White |
| 2 or 7 | Yellow |
| 3 or 8 | Red |
| 4 or 9 | Green |
| 5 or 0 | Blue |

The app picks the right colour for you automatically. Full details are on the [queen marking colours](./queen-marking-colours.md) page.

## What are the QR labels for?

Each hive can have a printable QR label. Scanning it opens Openbeehive straight at that hive, so you can pull up its records in the apiary without typing or searching. See [QR labels](../using-the-app/qr-labels.md).

## What languages is it available in?

Five languages ship in the app: English, German, French, Spanish and Italian. Switch under **Settings → Language**. Further translations are welcome as contributions.

## Which databases and storage backends are supported?

When self-hosting, the backend is pluggable:

- **Databases:** PostgreSQL, MariaDB or SQLite. See [Databases](../self-hosting/databases.md).
- **Blob storage:** MinIO/S3-compatible object storage, or the local filesystem. See [Storage](../self-hosting/storage.md).

## How do I sign in?

The hosted service uses email and password accounts and is invite-only. Self-hosters can enable email/password accounts, add OIDC providers (Google, Keycloak, Authentik and similar), enable passkeys, or turn login off entirely for a single-user setup. See [Authentication](../self-hosting/authentication.md).

## How do I report a bug or request a feature?

Please open an issue in the [GitHub repository](https://github.com/openbeehive-org/openbeehive-app). Clear steps to reproduce, your platform and browser, and a screenshot all help.

The [troubleshooting page](./troubleshooting.md) may already cover common issues.

## How can I contribute?

Contributions of all kinds are welcome: code, documentation, translations, bug reports and ideas. The stack is Go on the backend and a SvelteKit PWA on the frontend.

## What version is this?

Releases are tagged on [GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Self-hosters run the tag they built or the image tag they pulled; see the [upgrading guide](../self-hosting/upgrading.md) when new versions land.

---
sidebar_position: 6
title: "Troubleshooting"
---

# Troubleshooting

Most issues with Openbeehive fall into a handful of categories: sync, local storage, the camera/QR scanner, or login. This page walks through each, with practical checks you can run yourself before reaching out for help.

The good news: because Openbeehive is offline-first, your records live in a local database on your device. Almost nothing you do here can lose data that has already synced to the server.

## Data not syncing

Your changes save instantly to the device. Syncing to the server happens quietly in the background, so a delay is normal and rarely a cause for concern. If changes you made on one device are not appearing on another, work through this list.

**1. Check you are online.** Sync only runs when you have a network connection. Look at the sync status indicator in the app. If you have been working in the field with no signal, your edits are queued safely and will send as soon as you reconnect.

**2. Check you are logged in.** Sync requires an authenticated session. If your session has expired you will still be able to read and edit locally, but nothing will sync until you sign in again. Open the account menu and confirm you are signed in.

**3. Check the apiary scope.** Sharing in Openbeehive happens at the apiary level via **scopes**. If a hive or inspection is missing on another device or for another person, confirm the relevant apiary is shared with that account. Records in an apiary you cannot access will never appear.

**4. Give it a moment, then reopen.** Background sync runs periodically. Closing and reopening the app, or switching to it from the background, prompts a fresh sync attempt.

:::note
Sync is conflict-free by design. Openbeehive uses Hybrid Logical Clocks with last-writer-wins for individual fields and add-wins sets for lists, and append-only events (inspections, treatments, harvests) never conflict. You will not lose work because two devices edited at once. The most recent edit to a given field wins; both additions to a list are kept.
:::

If you self-host and sync fails for everyone, the problem is more likely server-side. See [Self-Hosting configuration](/self-hosting/configuration) and check the server logs.

## How local storage works

Openbeehive is a Progressive Web App (PWA). It keeps your entire dataset in a SQLite database that runs inside your browser, stored in **OPFS** (the Origin Private File System). Every read and write happens against this local database, which is why the app feels instant and works with no signal at all.

A few practical consequences:

- Your data is tied to the browser and device where you use Openbeehive. Each device keeps its own local copy and syncs to the server.
- OPFS storage is private to the app's origin. Other websites cannot read it.
- Installing the app to your home screen (see [Install](/using-the-app/install)) uses the same storage as the browser tab on most platforms.

:::caution
Browser tools that "clear site data", "clear cookies and storage", or private/incognito browsing can wipe the local OPFS database. That is safe **only if your data has already synced** to the server, because it will download again on next sign-in. If you have unsynced offline changes, make sure you are online and let sync finish first.
:::

### "unable to open database file" or a button that does nothing

App versions before 0.2.2 could run out of reserved local-storage slots, after which every save failed with `SQLITE_CANTOPEN: unable to open database file` — visible as a button that seemed to do nothing. Since 0.2.2 the app reserves enough slots up front and repairs the storage pool automatically when it runs low. If you still see this error, reload the app twice (so the new version takes over) and try again; records you saved earlier are unaffected.

### "Storage is unavailable — changes will not persist on this device" \{#storage-is-unavailable}

The app keeps its database in the browser's private storage. When it cannot
open that storage, it falls back to an in-memory database and shows this toast
so you know the situation. Edits still work and still sync to the server while
you are signed in, but the local copy disappears when the tab closes.

The two common causes:

- **Private or incognito browsing.** Browsers give such windows no persistent
  storage. Use a normal window, or install the app.
- **A second tab of the app is open.** The storage can be held by only one
  page at a time. Since app version 0.2.3 the app retries briefly, which
  usually clears a page refresh racing its own predecessor; if the toast stays,
  close the other tab and reload.

### The app shows "Syncing your data…" instead of my apiaries

That is the first sync on this device still downloading. Since app version
0.2.3 the dashboard and lists show placeholders and this hint until the data is
known to be complete, and they fill up progressively as batches arrive. Stay
online and give it a moment; on a large dataset the lists grow while you watch.
If the hint never goes away, work through [Data not syncing](#data-not-syncing).

## Clearing or reinstalling the app

Sometimes a fresh start fixes odd behaviour after an update. As long as you are signed in to an account that syncs, this is non-destructive: your synced records come back from the server.

1. Confirm you are **online and signed in**, and that the sync indicator shows everything is up to date.
2. Uninstall or remove the PWA from your home screen, or clear the site's storage in your browser settings.
3. Reopen Openbeehive and sign in.
4. Wait for the initial sync to download your apiaries, hives and history.

:::danger
Do not clear storage if you have offline-only changes that have not yet reached the server (for example, inspections recorded in the field while out of signal). Those edits exist only on that device until sync completes. Get online and let sync finish first.
:::

## Camera and QR scanner not working

Each hive can carry a printable QR label that deep-links to that hive (see [QR labels](/using-the-app/qr-labels)). Scanning needs camera access.

- **Grant camera permission.** When prompted, allow camera access. If you previously denied it, re-enable it in your browser or operating system settings for the site, then reload.
- **Use HTTPS.** Browsers only allow camera access on secure origins. The hosted app is served over HTTPS; self-hosters must serve over HTTPS too (or `localhost` for testing). See [Reverse proxy](/self-hosting/reverse-proxy).
- **Check it is not in use.** Close other apps or tabs that may be holding the camera.

:::tip iOS Safari
On iPhone and iPad the in-app scanner can be restricted. If scanning does not work, open the built-in **Camera app** and point it at the QR code. iOS recognises the encoded link and offers to open it; tapping the link launches Openbeehive at the right hive. The label encodes a plain web link, so any QR reader works as a fallback.
:::

## Login problems

- **Stuck on the sign-in screen.** Confirm you are reaching the correct address (the hosted app is at app.openbeehive.org). After signing in with your provider you should be redirected back automatically; if not, reload the page.
- **Redirect fails or "invalid redirect" errors (self-host).** This almost always means the OIDC redirect URL or `BEEHIVE_PUBLIC_BASE_URL` is misconfigured. See [Authentication and configuration](/self-hosting/authentication).
- **Passkey not offered.** WebAuthn/passkeys must be enabled and you must have registered a passkey on that device. If unavailable, sign in with your usual provider instead.
- **Single-user self-host with no login.** If you run with no OIDC providers and WebAuthn disabled, there is no sign-in step at all. If you unexpectedly see a login screen, check your server configuration.

## Filing a good bug report

If none of the above helps, please open an issue at [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). A clear report gets a faster fix. Try to include:

| Detail | Example |
| --- | --- |
| What you did | "Tapped Save on a new inspection" |
| What you expected | "Inspection appears in the hive timeline" |
| What happened instead | "Spinner, then the entry vanished" |
| App version | v0.1.0 (shown in the app's About screen) |
| Platform & browser | iPhone 14, iOS 17, Safari |
| Hosted or self-hosted | Self-hosted, `selfhost` profile, SQLite |
| Online or offline | "Was offline in the field, syncing now" |
| Reproducible? | "Happens every time" / "Once only" |

:::caution
Please do not paste secrets. Redact session secrets, OIDC client secrets, database passwords and personal data before sharing logs or configuration.
:::

For self-hosting questions about databases, storage, authentication and environment variables, the [Self-Hosting section](/category/self-hosting) and [configuration reference](/self-hosting/configuration) are the best starting points. See also the [FAQ](/knowledge-base/faq).

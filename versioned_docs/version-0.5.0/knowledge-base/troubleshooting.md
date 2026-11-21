---
sidebar_position: 6
title: "Troubleshooting"
---

# Troubleshooting

Most issues with Openbeehive fall into a handful of categories: sync, local storage, the camera/QR scanner, or login. This page walks through each, with practical checks you can run yourself before reaching out for help.

Your records live in a local database on your device, so almost nothing here can lose data that has already synced to the server.

## Data not syncing \{#data-not-syncing}

Your changes save instantly to the device. Syncing to the server happens quietly in the background, so a delay is normal and rarely a cause for concern. If changes you made on one device are not appearing on another, work through this list.

**1. Read the sync status.** The chip at the top of the page says what is going on: **Offline**, **Changes waiting to upload**, **Sync failed · retrying**, **Signed out** or **Sync problems**. See [the sync status](../using-the-app/offline-and-sync.md#sync-status). If you have been working in the field with no signal, your edits are queued and send as soon as you reconnect.

**2. Check you are signed in.** Sync requires a session. If it has expired the chip reads **Signed out · sign in to sync**; you can still read and edit locally, but nothing syncs until you sign in again. **Settings → Account** shows who you are signed in as.

**3. Check the active workspace.** Records belong to a workspace. If a hive is missing on another device, open **Settings → Workspace** there and make sure the same workspace is active. If it is missing for another person, they are not a member of that workspace; a workspace admin can invite them.

**4. Sync now.** Background sync runs at short intervals. Tap the status chip to open the sync status, which shows the last sync and what is waiting to upload, and tap **Sync now**.

**5. Look for refused changes.** If the chip reads **Sync problems**, the server did not accept some changes. They are still on the device. The **Sync problems** list names each one with the reason and lets you try again or discard it; see [Sync problems](../using-the-app/offline-and-sync.md#sync-problems). A device clock that is far ahead is one cause; the app corrects for it and resends by itself, but setting the device to automatic time avoids it. Entries marked "could not be applied" are changes from the server that this device could not merge; its own records stay as they are.

:::note
Sync is conflict-free by design. The most recent edit to a field wins, additions (photos, visits, harvests, treatments) are kept, and you will not lose work because two devices edited at once.
:::

If you self-host and sync fails for everyone, the problem is more likely server-side. See [Self-Hosting configuration](../self-hosting/configuration.md) and check the server logs.

## How local storage works

Openbeehive is a Progressive Web App (PWA). It keeps your entire dataset in a SQLite database that runs inside your browser, stored in **OPFS** (the Origin Private File System). Every read and write happens against this local database, which is why the app feels instant and works with no signal at all.

A few practical consequences:

- Your data is tied to the browser and device where you use Openbeehive. Each device keeps its own local copy and syncs to the server.
- OPFS storage is private to the app's origin. Other websites cannot read it.
- Installing the app to your home screen (see [Install](../using-the-app/install.md)) uses the same storage as the browser tab on most platforms.
- On a shared device every account has its own local copy per workspace. Someone else signing in on the same browser does not see your unsent changes or personal tasks, and they are not uploaded under their account.

:::caution
Browser tools that "clear site data", "clear cookies and storage", or private/incognito browsing can wipe the local OPFS database. That is safe **only if your data has already synced** to the server, because it will download again on next sign-in. If you have unsynced offline changes, make sure you are online and let sync finish first.
:::

### "unable to open database file" or a button that does nothing

App versions before 0.2.2 could run out of reserved local-storage slots, after which every save failed with `SQLITE_CANTOPEN: unable to open database file` — visible as a button that seemed to do nothing. Since 0.2.2 the app reserves enough slots up front and repairs the storage pool automatically when it runs low. If you still see this error, reload the app twice (so the new version takes over) and try again; records you saved earlier are unaffected.

### "This browser is not saving data on this device" \{#storage-is-unavailable}

The app keeps its database in the browser's private storage. When it cannot
open that storage, it keeps the records in memory and shows this banner so you
know the situation. Edits still work and still sync to the server while you
are signed in, but the local copy disappears when the tab closes.

The common causes are **private or incognito browsing** (browsers give such
windows no persistent storage) and storage that is blocked in the browser
settings. Use a normal window, or install the app.

### "Openbeehive is open in another tab"

Only one tab or window can work with the records on a device at a time. A
second tab shows this notice instead of the app. Continue in the first tab, or
tap **Use it here** to move the app to this tab. See
[One tab at a time](../using-the-app/offline-and-sync.md#one-tab).

### The app shows "Syncing your data…" instead of my apiaries

That is the first sync on this device still downloading. Since app version
0.2.3 the dashboard and lists show placeholders and this hint until the data is
known to be complete, and they fill up progressively as batches arrive. Stay
online and give it a moment; on a large dataset the lists grow while you watch.
If the hint never goes away, work through [Data not syncing](#data-not-syncing).

### The app does not answer under my host name (self-host, no login)

A server without login answers only to `localhost`, IP addresses and the host
of `BEEHIVE_PUBLIC_BASE_URL`. Opened under another name it replies with a
plain `403` page that names the fix: list the name in `BEEHIVE_ALLOWED_HOSTS`
or set `BEEHIVE_PUBLIC_BASE_URL` to the address you use. See
[Configuration](../self-hosting/configuration.md#allowed-hosts).

## Clearing or reinstalling the app

Sometimes a fresh start fixes odd behaviour after an update. As long as you are signed in to an account that syncs, this is non-destructive: your synced records come back from the server.

1. Confirm you are **online and signed in**, and that the status chip reads **Synced**.
2. Uninstall or remove the PWA from your home screen, or clear the site's storage in your browser settings.
3. Reopen Openbeehive and sign in.
4. Wait for the initial sync to download your apiaries, hives and history.

:::danger
Do not clear storage if you have offline-only changes that have not yet reached the server (for example, inspections recorded in the field while out of signal). Those edits exist only on that device until sync completes. Get online and let sync finish first.
:::

## Camera and QR scanner not working

Each hive can carry a printable QR label that deep-links to that hive (see [QR labels](../using-the-app/qr-labels.md)). Scanning needs camera access.

- **Grant camera permission.** When prompted, allow camera access. If you previously denied it, re-enable it in your browser or operating system settings for the site, then reload.
- **Use HTTPS.** Browsers only allow camera access on secure origins. The hosted app is served over HTTPS; self-hosters must serve over HTTPS too (or `localhost` for testing). See [Reverse proxy](../self-hosting/reverse-proxy.md).
- **Check it is not in use.** Close other apps or tabs that may be holding the camera.

:::tip[No camera, or a worn label]
The in-app scanner works in every current browser, including Safari on iPhone and iPad and Firefox. If the camera cannot be used or the label is hard to read, type the six characters printed under the QR code into **Label code** on the Scan screen. If you use the installed app, scan inside it rather than with the phone's camera app, which opens the link in the browser with its own separate data.
:::

## Login problems

- **Stuck on the sign-in screen.** Confirm you are reaching the correct address (the hosted app is at app.openbeehive.org). After signing in with your provider you should be redirected back automatically; if not, reload the page.
- **Redirect fails or "invalid redirect" errors (self-host).** This almost always means the OIDC redirect URL or `BEEHIVE_PUBLIC_BASE_URL` is misconfigured. See [Authentication and configuration](../self-hosting/authentication.md).
- **"Too many attempts."** After 10 failed sign-ins for an account, or 30 from one network address, further attempts are blocked for up to 15 minutes. Wait and try again.
- **Server refuses to start after enabling login (self-host).** The log names the missing setting, usually `BEEHIVE_SESSION_SECRET` (at least 32 bytes) or the admin account. See [Authentication](../self-hosting/authentication.md).
- **Passkey not offered.** Passkeys must be enabled on the server and you must have added one under Settings → Account → Passkeys. Otherwise sign in with another method.
- **Single-user self-host with no login.** With password auth off, no OIDC providers and WebAuthn disabled, there is no sign-in step at all. If you unexpectedly see a login screen, check your server configuration.

## Edits to a field do not stick (self-host) \{#stamps-from-the-future}

Releases before 0.5.0 accepted changes from devices whose clock was far ahead. Such a stamp wins every merge until real time reaches it, so later edits to that field are lost. At start the server logs how many such stamps each table holds, with up to ten affected rows. To repair a row, stop the server and clear its field clock:

```sql
UPDATE <table> SET field_hlc = '{}' WHERE id = '<id>';
```

The values stay, and the next edit of each field wins. A device that synced the row before still prefers its own copy: let it upload what it has, then clear the site data in its browser (or reinstall the app) and sign in again.

## Filing a good bug report

If none of the above helps, please open an issue at [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). A clear report gets a faster fix. Try to include:

| Detail | Example |
| --- | --- |
| What you did | "Tapped Save on a new inspection" |
| What you expected | "Inspection appears in the hive timeline" |
| What happened instead | "Spinner, then the entry vanished" |
| App version | The release you run: the image tag or git tag on a self-hosted instance |
| Platform & browser | iPhone 14, iOS 17, Safari |
| Hosted or self-hosted | Self-hosted, `selfhost` profile, SQLite |
| Online or offline | "Was offline in the field, syncing now" |
| Reproducible? | "Happens every time" / "Once only" |

:::caution
Please do not paste secrets. Redact session secrets, OIDC client secrets, database passwords and personal data before sharing logs or configuration.
:::

For self-hosting questions, start with the [configuration reference](../self-hosting/configuration.md).

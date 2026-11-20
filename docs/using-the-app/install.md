---
sidebar_position: 11
title: "Installing the app"
---

# Installing the app

Openbeehive is a Progressive Web App (PWA). That means you do not need an app
store, a download or an account just to get started. You open it in your browser
and, with a single tap, add it to your device so it behaves like any other app:
its own icon, a full-screen window and full offline support.

Installing is optional but recommended. Once installed, the app launches
instantly, hides the browser address bar, and keeps your records available even
when you are out at the apiary with no signal.

## What you get by installing

- **An app icon** on your home screen or in your app launcher.
- **A full-screen window** with no browser chrome, so there is more room for
  your hives and inspections.
- **Offline access.** Your records live in a local database on the device and
  sync in the background. See [Offline and sync](./offline-and-sync.md).
- **Quick QR scanning.** Scanning a hive's [QR label](./qr-labels.md)
  opens that hive.

:::tip
You can keep using Openbeehive in a normal browser tab without installing. The
features are the same; installing just makes it feel like a native app and is
handier in the field.
:::

## Installing on iPhone and iPad (Safari)

1. Open **Safari** and go to [app.openbeehive.org](https://app.openbeehive.org).
2. Tap the **Share** button (the square with an upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Adjust the name if you like, then tap **Add**.

The Openbeehive icon now sits on your home screen. Launch it from there to get
the full-screen, offline experience.

:::note
On iOS the install option lives in Safari's Share menu. Other browsers on
iPhone and iPad cannot install web apps, so use Safari for this step.
:::

## Installing on Android (Chrome)

1. Open **Chrome** and go to [app.openbeehive.org](https://app.openbeehive.org).
2. Tap the **menu** (three dots) in the top-right corner.
3. Tap **Install app** (or **Add to Home screen**).
4. Confirm by tapping **Install**.

You may also see a prompt or banner offering to install Openbeehive directly.
Tapping it does the same thing.

## Installing on desktop (Chrome, Edge, and others)

On most desktop browsers, an install icon appears at the right-hand end of the
address bar when you visit the app.

1. Go to [app.openbeehive.org](https://app.openbeehive.org).
2. Click the **install icon** in the address bar (it often looks like a small
   monitor or a downward arrow into a tray).
3. Click **Install** to confirm.

If you do not see the icon, open the browser menu and look for **Install
Openbeehive** or **Apps -> Install this site as an app**. The app then opens in
its own window and appears alongside your other applications.

| Platform | Browser | Where to find the install option |
| --- | --- | --- |
| iOS / iPadOS | Safari | Share menu -> Add to Home Screen |
| Android | Chrome | Menu (three dots) -> Install app |
| Windows / Linux | Chrome / Edge | Install icon in the address bar |
| macOS | Chrome / Edge | Install icon in the address bar |
| macOS | Safari | File -> Add to Dock |

## Installing a self-hosted instance

If you run your own Openbeehive server, the app installs in exactly the same
way. Just point your browser at your server's own address instead of the hosted
service, then follow the same steps above for your platform.

For example, open your instance at its `BEEHIVE_PUBLIC_BASE_URL` (such as
`https://bees.example.com`) and use **Add to Home Screen** or the browser's
install option. The installed app then talks to your server, and your records
stay on your own infrastructure.

:::caution
For installation to work smoothly, a self-hosted instance should be served over
**HTTPS** with a valid certificate. Most browsers only offer PWA install on
secure origins. See [Reverse proxy](../self-hosting/reverse-proxy.md) for how to put
TLS in front of your server.
:::

If you self-host, the [Self-hosting](/category/self-hosting) section walks through
deployment, configuration and backups.

## Opening the app offline

After you have opened the app online once, it starts without a connection, also
from a cold start (after the phone was restarted or the app was closed). See
[Offline and sync](./offline-and-sync.md).

## Updating the app

The PWA updates itself. When a new version has been downloaded in the
background, a bar at the top says **"A new version is available."** with two
buttons: **Reload** switches to the new version at once, **Later** hides the bar.
If you choose Later, the update is applied the next time the app starts after
all of its tabs and windows were closed. You do not need to reinstall.

## Removing the app

Uninstalling the PWA removes only the app shortcut and its local cache; it does
not delete records that have already synced to the server. To uninstall:

- **iOS / Android:** press and hold the icon, then choose **Remove** or
  **Uninstall**.
- **Desktop:** open the app, then use its window menu (or the browser's app
  settings) and choose **Uninstall**.

:::caution
If you have records that have not yet synced when you uninstall, they live only
in the device's local database and may be lost. Make sure the app has synced
before removing it. See [Offline and sync](./offline-and-sync.md).
:::

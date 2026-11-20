---
sidebar_position: 10
title: "Offline & sync"
---

# Offline & sync

Openbeehive is built for the apiary, not the office. Out in the field you rarely have a reliable signal, so the app is **offline-first**: everything you do is saved on your device straight away and synced to the server later, in the background.

The app never makes you wait for the network. Open a hive, record a visit, add a task, note something about the queen: all of it is instant, signal or no signal.

## Everything is saved locally

Openbeehive keeps a complete copy of your records in a small database on your device. Every read and every write happens against that local copy first.

- **It is fast.** Opening a hive or scrolling visits never waits on a loading bar.
- **It works with no signal.** A wood, a valley, a cellar full of supers.
- **Your data is yours.** The records live on your device; the server is the copy for syncing and sharing.

:::tip
Because records are stored on the device, install Openbeehive as an app rather than using it in a browser tab. See [Install Openbeehive](./install.md).
:::

## The sync status \{#sync-status}

A small status chip at the top of every page (and under your email address in the sidebar) says whether this device's changes have reached the server:

| The chip says | Meaning |
| --- | --- |
| **Synced** and a time | Everything on this device is on the server. |
| **Syncing…** | An exchange with the server is running. |
| **Waiting to upload: 3** | Three changes are saved on the device and not yet uploaded. |
| **Offline** or **Offline · 3 waiting** | No connection. Changes wait on the device. |
| **Sync failed · retrying** | The server could not be reached or answered with an error. The app keeps trying. |
| **Signed out · sign in to sync** | Your session has ended. Tap the chip to sign in; nothing is lost. |
| **Sync problems: 2** | The server refused two changes; see below. |

Tap the chip to sync at once. Without tapping, the app syncs after every change, at short intervals while it is open, and as soon as the connection returns.

While the device has no connection, a bar at the top of the page also reads "Offline: changes are saved and synced later." This is informational; carry on exactly as before.

:::note
A persistent offline indicator usually means weak coverage at the apiary. If it stays on even on a good connection at home, see [Troubleshooting](../knowledge-base/troubleshooting.md).
:::

### Sync problems \{#sync-problems}

Now and then the server does not accept a change, for example because the record belongs to another workspace or because the clock of the device was far ahead. Such a change is not thrown away: it stays on the device, and the chip shows **Sync problems** with the number of refused changes. The **Sync problems** list names each one with the reason and offers **Try again** and **Discard**. Discard stops the upload; the record stays on this device as it is but never reaches the server, your other devices or the other members.

### Device clocks

Every change carries the time of the device that made it. The server refuses changes stamped more than 10 minutes ahead of its own time. The app learns the server's time on every sync, corrects for a wrong device clock, and stamps and sends such changes again by itself.

## Your first sync on a new device

Signing in on a new device, or reopening the app after its storage was cleared, starts with an empty local database that fills up in the background:

- Lists show **shimmering placeholders** while they read from the local database.
- While the first download is still running, the Overview and the apiary, hive and task lists show **"Syncing your data…"** rather than an empty state.
- Large datasets appear **progressively**: every batch the app receives is shown at once.

Only once the app knows the data is complete does it show a real empty state. If the device is offline or the server is unreachable, the hint gives way to whatever is stored locally.

After the app has updated to version 0.5.0, each device downloads its records once more from the start. This repairs gaps earlier versions could leave and needs no action from you.

## Syncing across your devices

Use Openbeehive on several devices, a phone in the field and a laptop at home, and they stay in step. Each device keeps its own local copy and exchanges changes with the server in the background. Record a visit on your phone at the hives, and by the time you sit down at your laptop it is there. As long as each device signs in to the same account, they all see the same records.

## What happens when two devices change the same thing

Openbeehive resolves overlapping changes **automatically**, with no "which version do you want to keep?" prompts.

- **You edit an apiary's note on your phone, your co-beekeeper edits the same note on theirs.** The most recent edit to that field wins.
- **You both add photos to the same visit while offline.** Both sets of photos are kept.
- **You each log a separate visit.** Every visit, harvest and treatment is a record of its own, so both are kept side by side.

Every device converges on the same state once all have synced.

:::tip
The short version: add freely, edit confidently. How this works under the bonnet is on the [sync protocol](../developers/sync-protocol.md) and [architecture](../developers/architecture.md) pages.
:::

## Sharing

Records are shared through **workspaces**. Every member of a workspace sees and edits all of its apiaries, hives and records; there is no per-apiary or per-hive sharing. The exception is [tasks](./tasks.md), which are personal.

| Role | What they can do |
| --- | --- |
| **Admin** (workspace owner) | Everything a member can, plus invite and revoke, and delete the workspace. |
| **Member** | Add and edit apiaries, hives, visits, harvests and treatments in the workspace. |

To share one yard with a mentor while keeping others private, put that yard in its own workspace and invite the mentor there. Shared records sync and resolve conflicts exactly like your own. See [Accounts & workspaces](./accounts-tenants.md).

## If something cannot be saved

Saving happens on your device, so it virtually never fails. If it does (for example because the browser's storage is full or damaged) the form stays open with everything you typed and an error message explains what went wrong.

On the public **demo account** the server rejects changes (the demo resets itself hourly). Your changes are saved on your device and simply stay there instead of syncing.

There is one situation where saving works but does not last: if the browser cannot give the app its private storage (a private browsing window, or storage blocked in the browser settings), the app keeps the records in memory and shows a banner: **"This browser is not saving data on this device (private window or blocked storage). Anything that has not synced is lost when you close this tab."** Everything keeps working for the session, and edits still sync to the server if you are signed in, but the local copy is gone once the tab closes. See [Troubleshooting](../knowledge-base/troubleshooting.md#storage-is-unavailable).

## One tab at a time \{#one-tab}

Only one tab or window can work with the records on a device at a time. If you open Openbeehive in a second tab, it shows **"Openbeehive is open in another tab"**. Continue in the first tab, or tap **Use it here** to move the app to the new tab; the other one then shows the notice.

## Will I ever lose data?

Your records are written to your device first and are not removed because you are offline or the app closes. They wait on the device until they can be synced.

If you self-host, keep server backups as well. See [Backups](../self-hosting/backups.md).

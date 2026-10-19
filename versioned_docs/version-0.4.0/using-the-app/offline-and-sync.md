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
Because records are stored on the device, install Openbeehive as an app rather than using it in a browser tab. See [Install Openbeehive](/using-the-app/install).
:::

## The offline indicator

When the device has no connection, the account block in the sidebar switches from **Online** to **Offline** and a bar at the top of the page reads "Offline — changes are saved and synced later." This is informational; carry on exactly as before.

When the device is back online the bar clears and any changes made offline are sent up automatically. There is no "sync now" button.

:::note
A persistent offline indicator usually means weak coverage at the apiary. If it stays on even on a good connection at home, see [Troubleshooting](/knowledge-base/troubleshooting).
:::

## Your first sync on a new device

Signing in on a new device, or reopening the app after its storage was cleared, starts with an empty local database that fills up in the background:

- Lists show **shimmering placeholders** while they read from the local database.
- While the first download is still running, the Overview and the apiary, hive and task lists show **"Syncing your data…"** rather than an empty state.
- Large datasets appear **progressively**: every batch the app receives is shown at once.

Only once the app knows the data is complete does it show a real empty state. If the device is offline or the server is unreachable, the hint gives way to whatever is stored locally.

## Syncing across your devices

Use Openbeehive on several devices, a phone in the field and a laptop at home, and they stay in step. Each device keeps its own local copy and exchanges changes with the server in the background. Record a visit on your phone at the hives, and by the time you sit down at your laptop it is there. As long as each device signs in to the same account, they all see the same records.

## What happens when two devices change the same thing

Openbeehive resolves overlapping changes **automatically**, with no "which version do you want to keep?" prompts.

- **You edit an apiary's note on your phone, your co-beekeeper edits the same note on theirs.** The most recent edit to that field wins.
- **You both add photos to the same visit while offline.** Both sets of photos are kept.
- **You each log a separate visit.** Visits, harvests and treatments are only ever added, so both are kept side by side.

Every device converges on the same state once all have synced.

:::tip
The short version: add freely, edit confidently. How this works under the bonnet is on the [sync protocol](/developers/sync-protocol) and [architecture](/developers/architecture) pages.
:::

## Sharing

Records are shared through **tenants**. Every member of a tenant sees and edits all of its apiaries, hives and records; there is no per-apiary or per-hive sharing.

| Role | What they can do |
| --- | --- |
| **Admin** (tenant owner) | Everything a member can, plus invite and revoke, and delete the tenant. |
| **Member** | Add and edit apiaries, hives, visits, tasks, harvests and treatments in the tenant. |

To share one yard with a mentor while keeping others private, put that yard in its own tenant and invite the mentor there. Shared records sync and resolve conflicts exactly like your own. See [Accounts & tenants](/using-the-app/accounts-tenants).

## If something cannot be saved

Saving happens on your device, so it virtually never fails. If it does (for example because the browser's storage is full or damaged) the form stays open with everything you typed and an error message explains what went wrong.

On the public **demo account** the server rejects changes (the demo resets itself hourly). Your changes are saved on your device and simply stay there instead of syncing.

There is one situation where saving works but does not last: if the browser cannot give the app its private storage, the app falls back to an in-memory database and shows the toast **"Storage is unavailable — changes will not persist on this device."** Everything keeps working for the session, and edits still sync to the server if you are signed in, but the local copy is gone once the tab closes. This happens in private browsing windows and when a second tab of the app is still holding the storage; see [Troubleshooting](/knowledge-base/troubleshooting#storage-is-unavailable).

## Will I ever lose data?

Your records are written to your device first and are not removed because you are offline or the app closes. They wait on the device until they can be synced.

If you self-host, keep server backups as well. See [Backups](/self-hosting/backups).

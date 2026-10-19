---
sidebar_position: 1
title: "The dashboard"
---

# The dashboard

The **Overview** is the first screen after you open the app. Everything on it is read from the local database on your device, so it loads instantly with or without a signal.

The **+ New** button in the header takes you to the Apiaries list to create an apiary.

## Stat tiles

| Tile | What it shows |
| --- | --- |
| **Apiaries** | Number of apiaries in the active tenant. |
| **Hives** | Number of hives. |
| **Queens** | Queens currently recorded as heading a colony. |
| **Open tasks** | Tasks not yet ticked off. |
| **Honey this season** | Total harvested kilograms recorded in the current calendar year. |

The tiles are counts only; use the navigation to open the matching section.

## Due inspections

Lists up to five hives, the longest-unvisited first, with how many days ago each was last inspected ("never" for hives without a visit). The badge is highlighted at 21 days or more, or when there is no visit at all. Tap a hive to open it and record a visit. When there are no hives the panel says "All up to date".

There is no configurable interval: the list is ordered by time since the last recorded visit.

## Upcoming tasks

Shows up to five open tasks with their due dates. Tasks whose due date has passed are flagged with **!**. Tick tasks off in the **Tasks** view; see [Tasks](/using-the-app/tasks).

## Finding your way around

The same destinations are available everywhere: **Overview, Apiaries, Scan, Hives, Tasks** and **Settings**.

- On a phone, a **bottom tab bar** holds all six.
- On a desktop or tablet, a **sidebar** on the left lists Overview, Apiaries, Scan, Hives and Tasks, with your account (email and online status) at the bottom linking to Settings.

## Settings

**Settings** holds:

- **Language**: English, German, French, Spanish, Italian. The choice is saved on the device.
- **Tenants**: switch, create, invite and manage (on instances with login). See [Accounts & tenants](/using-the-app/accounts-tenants).
- **Passkeys**: add or remove passkeys (when the server enables them).
- **API keys**: create and remove keys for scripts and devices (on instances with login). See [Accounts & tenants](./accounts-tenants.md#api-keys).
- **Data & backup**: export and import; see [Import & export](/using-the-app/import-export).
- **Account**: who you are signed in as, and **Sign out**.

On a single-user self-hosted instance with no login there is nothing to sign out of; the account block shows the local identity.

## The online/offline indicator

The sidebar shows **Online** or **Offline** next to your account, and while you are offline a bar at the top reads "Offline — changes are saved and synced later." Keep recording exactly as usual; sync resumes when the connection returns. See [Offline and sync](/using-the-app/offline-and-sync).

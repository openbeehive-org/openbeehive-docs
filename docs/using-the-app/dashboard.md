---
sidebar_position: 1
title: "The dashboard"
---

# The dashboard

The **Overview** is the first screen after you open the app. Everything on it is read from the local database on your device, so it loads instantly with or without a signal.

The **+ New** button in the header opens a menu with **New apiary**, **New hive** and **New task**; each takes you to the matching list with the form open.

## Getting started

Until your first visit is recorded, the Overview greets you with "Welcome to Openbeehive" and a **Getting started** checklist of three steps: **Create an apiary**, **Add a hive**, **Record the first visit**. The step that is next is a link to the right place; finished steps are ticked. The checklist disappears once all three are done.

## Stat tiles

| Tile | What it shows |
| --- | --- |
| **Apiaries** | Number of apiaries in the active workspace. |
| **Hives** | Number of hives. |
| **Queens** | Queens currently recorded as heading a colony. |
| **Open tasks** | Tasks not yet ticked off. |
| **Honey this season** | Total harvested kilograms recorded in the current calendar year. |

The tiles are counts only; use the navigation to open the matching section.

## Due inspections

Lists up to five hives, the longest-unvisited first, with how many days ago each was last inspected ("today", or "never" for hives without a visit). The badge is highlighted at 21 days or more, or when there is no visit at all. Tap a hive to open it and record a visit.

Only visits a person recorded count. Readings posted by a sensor or scale through the API do not make a hive "inspected", and colonies with the status **Lost** or **Dissolved** are left out. When there are no hives the panel says that nothing is due.

There is no configurable interval: the list is ordered by time since the last recorded visit.

## Upcoming tasks

Shows up to five open tasks with their due dates. Tasks whose due date has passed are marked **Overdue**. Tap a task to jump to it in the **Tasks** view, where you tick it off; see [Tasks](./tasks.md).

## Finding your way around

The same destinations are available everywhere: **Overview, Apiaries, Scan, Hives, Tasks** and **Settings**.

- On a phone, a **bottom tab bar** holds all six.
- On a desktop or tablet, a **sidebar** on the left lists Overview, Apiaries, Scan, Hives and Tasks, with your account (email and sync status) at the bottom linking to Settings.

## Settings

**Settings** holds:

- **Language**: English, German, French, Spanish, Italian. The choice is saved on the device.
- **Appearance**: **System** (follow the device's light or dark setting), **Light** or **Dark**. The choice is saved on the device.
- **Workspaces**: switch, create, invite and manage (on instances with login). See [Accounts & workspaces](./accounts-tenants.md).
- **Passkeys**: add or remove passkeys (when the server enables them).
- **API keys**: create and remove keys for scripts and devices (on instances with login). See [Accounts & workspaces](./accounts-tenants.md#api-keys).
- **Data & backup**: export and import; see [Import & export](./import-export.md).
- **Account**: who you are signed in as, and **Sign out**.

On a single-user self-hosted instance with no login there is nothing to sign out of; the account block shows the local identity.

## The sync status

A status chip at the top of the page and next to your account in the sidebar shows whether your changes have reached the server (**Synced**, **Waiting to upload**, **Offline**, **Sync problems** and so on), and while you are offline a bar at the top reads "Offline: changes are saved and synced later." Keep recording exactly as usual; sync resumes when the connection returns. See [Offline and sync](./offline-and-sync.md#sync-status).

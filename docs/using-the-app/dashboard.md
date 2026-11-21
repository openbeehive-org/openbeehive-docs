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
| **Honey this season** | Total honey harvested in the current calendar year, in kilograms or pounds as chosen under **Settings → Preferences → Units**. |

The tiles are counts only; use the navigation to open the matching section.

## Due inspections

A hive is due 10 days after its last visit; the panel says so. It lists up to five due hives, the longest-unvisited first, with how many days ago each was last inspected ("never" for hives without a visit). The badge is highlighted at 21 days or more, or when there is no visit at all. Tap a hive to open it and record a visit. When more hives are due, **See all N due hives** opens the hive list sorted by last visit.

Only visits a person recorded count. Readings posted by a sensor or scale through the API do not make a hive "inspected", and colonies with the status **Lost** or **Dissolved** are left out. When no hive is due the panel says "All up to date — well done!", and when there are no hives, that nothing is due.

The interval of 10 days is fixed in the app; the API's `GetDashboard` uses the same default and takes `thresholdDays` to change it.

## Upcoming tasks

Shows up to five open tasks with their due dates. Tasks whose due date has passed are marked **Overdue**. Tap a task to jump to it in the **Tasks** view, where you tick it off; see [Tasks](./tasks.md).

## Finding your way around

The same destinations are available everywhere: **Overview, Apiaries, Scan, Hives, Tasks** and **Settings**.

- On a phone, a **bottom tab bar** holds all six, with short labels that fit narrow screens.
- On a desktop or tablet, a **sidebar** on the left lists Overview, Apiaries, Scan, Hives and Tasks, with your account (email and sync status) at the bottom linking to Settings.

## Settings \{#settings}

**Settings** shows one of four groups at a time; the buttons at the top switch between them.

**Preferences**

- **Language**: English, German, French, Spanish or Italian. The choice is saved with your account and applies on all your devices.
- **Appearance**: **System** (follow the device's light or dark setting), **Light** or **Dark**. The choice is saved on this device only.
- **Units**: **Weight** in kilograms or pounds and **Temperature** in Celsius or Fahrenheit, for showing and entering values. The choice is saved with your account and applies on all your devices and workspaces. Until you choose, the app uses metric units, unless your browser is set to the app's language for a region that uses pounds and Fahrenheit (for example English, United States). Records are always stored in kilograms and degrees Celsius, and exports and the API stay metric; see [Inspections](./inspections.md#units).

**Workspace** (on instances with login)

- **Workspaces**: switch, create, invite and manage members. See [Accounts & workspaces](./accounts-tenants.md).
- **API keys**: create and remove keys for scripts and devices. See [Accounts & workspaces](./accounts-tenants.md#api-keys).
- **Danger zone**: delete the workspace (admins only).

**Data & sync**

- **Sync problems**: changes the server refused, with **Try again** and **Discard**, and received changes that could not be applied. See [Offline & sync](./offline-and-sync.md#sync-problems).
- **Data & backup**: backups, other export formats, the server copy and import; see [Import & export](./import-export.md).
- **Treatment register**: print the register for the whole workspace, one apiary or one year; see [Treatments](./treatments.md#treatment-register).

**Account** (on instances with login)

- **Account**: who you are signed in as, **Sign out**, **Password** and **Log out everywhere**. See [Accounts & workspaces](./accounts-tenants.md#password).
- **Passkeys**: add or remove passkeys (when the server enables them).
- **Reset a user's password**: only for the instance admin; see [Authentication](../self-hosting/authentication.md#password-reset).
- **Delete account**: see [Accounts & workspaces](./accounts-tenants.md#delete-account).

On a single-user self-hosted instance with no login there is no Account group: **Preferences** shows a **No sign-in** note explaining the mode, and units and language are kept for the local identity.

## The sync status

A status chip at the top of the page and next to your account in the sidebar shows whether your changes have reached the server (**Synced**, **Changes waiting to upload**, **Offline**, **Sync problems** and so on); tap it for the sync status and **Sync now**. While you are offline a bar at the top reads "Offline: changes are saved and synced later." Keep recording exactly as usual; sync resumes when the connection returns. See [Offline and sync](./offline-and-sync.md#sync-status).

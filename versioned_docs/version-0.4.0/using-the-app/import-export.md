---
sidebar_position: 12
title: "Import & export"
---

# Import & export

Your records are yours. Openbeehive lets you take **all of your data** with you —
as a backup, to move to another instance, to crunch in a spreadsheet, or to share
with other tools. Everything runs locally from **Settings → Data & backup**; no
data leaves your device unless you choose to share the file.

## Exporting

Open **Settings**, find **Data & backup**, and pick a format:

| Format | What you get | Best for |
| --- | --- | --- |
| **Full backup (JSON)** | Every record — apiaries, hives, queens, inspections, harvests, tasks, placements and events — in one file | Safekeeping, and **moving to another instance** (round-trippable) |
| **Spreadsheet (XLSX)** | One workbook, one sheet per entity | Analysis in Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | One `.csv` per entity, bundled in a `.zip` | Universal interchange, scripts, other apps |
| **BeeXML** | A structured XML file (apiary → hive → queen / inspection) | Sharing with tools that speak the [BeeXML](https://beexml.org/) interchange style |
| **Report (PDF)** | A printable apiary report — hives, current queens and latest readings | Printing, sharing, audit / record-keeping |

The **Report (PDF)** opens a clean, branded summary in a new tab and triggers
your browser's print dialog — choose "Save as PDF" to keep a copy.

The export reflects what's on your device right now. Photos are not included in
the CSV/XLSX/BeeXML exports (they're stored as blobs) — the full picture lives in
your synced account and its blob storage; see
[Self-hosting → Backups](/self-hosting/backups) for server-side backups.

## Importing & restoring

In the same **Data & backup** panel, choose a format and pick a file:

- **Openbeehive backup (JSON)** — restores a previous export. Records keep their
  ids, so re-importing the same backup is safe (it won't create duplicates).
- **BeeXML** — imports apiaries, hives, queens and inspections from a BeeXML-style
  file.
- **CSV from another app** — migrate from another beekeeping app or a spreadsheet
  (see below).
- **Auto-detect** — picks the right reader from the file.

Imported records become part of **your** account and sync like anything you enter
by hand.

## Migrating from another app

Most beekeeping apps can export their records as **CSV** (for example
**Apiary Book**, **HiveBook**, **BeeKeeperPal**, or your own spreadsheet).
Openbeehive reads those files by **matching column names**, so you usually don't
have to reformat anything.

Recognised columns (case, spaces and punctuation don't matter; several languages
are understood):

| Openbeehive field | Recognised column names |
| --- | --- |
| Apiary | apiary, yard, location, standort, rucher, colmenar, apiario |
| Hive | hive, colony, beute, volk, ruche, colmena, arnia |
| Date | date, inspection date, visit date, datum, fecha, data |
| Weather | weather, wetter, meteo, tiempo |
| Varroa | varroa, mites, mite count |
| Hive temperature | hive temp, brood temp |
| Outside temperature | temperature, temp, outside temp, ambient temp |
| Hive humidity | hive humidity |
| Outside humidity | humidity, outside humidity |
| Hive weight | weight, hive weight, gewicht |
| Honey | honey, harvest, yield, honig, ernte |
| Notes | note, notes, comment, remarks, notiz |

Each CSV row becomes an **inspection** on the matching hive, creating apiaries and
hives as needed (rows with no apiary land in an "Imported" apiary). Columns that
aren't recognised are skipped — nothing breaks, you just keep the rest.

:::tip Round-trip first
If you're moving between Openbeehive instances, prefer the **JSON backup** — it's
complete and lossless. Use CSV for coming **from** other apps.
:::

## Why this matters

Openbeehive is built so your data can't be held hostage. There's a long history of
beekeeping records getting locked into one vendor's cloud. Open efforts like
[BeeXML](https://beexml.org/) (an Apimondia interchange standard) and the
[BEEP](https://beep.nl/) project aim to fix that; Openbeehive leans the same way —
open formats, a documented [API](/category/using-the-api), and a one-click full
backup. Take your bees and go whenever you like.

For programmatic access and automated feeds, see [Using the API](/category/using-the-api).

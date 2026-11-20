---
sidebar_position: 12
title: "Import & export"
---

# Import & export

Your records are yours. Openbeehive lets you take **all of your data** with you:
as a backup, to move to another instance, to crunch in a spreadsheet, or to share
with other tools. Everything is under **Settings → Data & backup**.

Export and import work on the **active workspace**. Both wait until the device
has finished its first sync of the workspace; until then the panel says so.

## Full backup \{#full-backup}

**Download full backup** saves every apiary, hive, queen, visit, treatment,
harvest, task and timeline entry of the workspace as this device holds it,
including your personal tasks and changes that have not been uploaded yet.
The panel tells you how many such changes there are, and how many the server
refused (see [Sync problems](./offline-and-sync.md#sync-problems)): they are
in the file, but not on the server.

- Without photos the backup is one JSON file.
- With **Include photos** it is a ZIP that also holds the full-size images.
  Images that are not on this device are fetched from the server; if that is
  not possible (offline, or not uploaded yet), the app says how many are
  missing, and their thumbnails are included.

Weights and temperatures are always exported in kilograms and degrees
Celsius, whatever units you have chosen under **Settings → Units**.

### Download from the server \{#server-copy}

**Download server copy** fetches the complete copy of the workspace that the
server holds, in the same format. It includes your own personal tasks but not
those of other members, and it lacks changes a device has not uploaded yet. A
few downloads per hour are allowed. Scripts can fetch the same file with an
API key; see [REST](../using-the-api/rest.md#export). The demo account cannot
download it.

## Other formats

| Format | What you get | Best for |
| --- | --- | --- |
| **Spreadsheet (XLSX)** | One workbook, one sheet per kind of record | Analysis in Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | One `.csv` per kind of record, bundled in a `.zip` | Universal interchange, scripts, other apps |
| **BeeXML** | Apiaries, hives, queens and visits in a structured XML file | Sharing with tools that speak the [BeeXML](https://beexml.org/) interchange style |
| **Report (PDF)** | A printable apiary report: hives, current queens and latest readings | Printing, sharing, record-keeping |

These are for reading elsewhere; to restore your data, use the full backup.
The **Report (PDF)** opens a summary in a new tab and triggers your browser's
print dialog; choose "Save as PDF" to keep a copy. For server-side backups of
a whole instance, see [Self-hosting → Backups](../self-hosting/backups.md).

## Importing \{#importing}

**Import → Choose file…** reads a file into the active workspace. Pick the
**File format** or leave it at **Auto-detect**:

- **Openbeehive backup (JSON or ZIP)**: a full backup from this or another
  instance, with photos if it is a ZIP.
- **BeeXML**: apiaries, hives, queens and visits from a BeeXML-style file.
- **CSV from another app**: visits from another beekeeping app or a
  spreadsheet (see below).

Nothing is written before you see a **Preview**: per kind of record, how many
are **New**, **Overwritten**, **Restored** and **Skipped (already here)**.
Then tap **Import now**.

By default an import only adds. Records that already exist in this
workspace, deleted ones too, are skipped and never changed, so importing the
same backup twice changes nothing. Two options change that:

- **Overwrite existing records** writes the values of the file where they
  differ. Only fields the file contains are written; changes made since the
  export are lost. Deleted records stay deleted.
- **Also restore deleted records** brings back records that were deleted
  here.

A file from **another workspace** gets new ids, so it never touches existing
records, and the preview says so. Imported records sync like anything you
enter by hand. Numbers in the file are read as kilograms and degrees Celsius.

**Undo last import** deletes what the last import created, also offline. An
apiary or hive that has since got records of its own (a visit, a hive moved
there) is kept, and the app says how many.

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
| Notes | note, notes, comment, comments, remarks, notiz, bemerkung |

Each CSV row becomes a **visit** of the matching hive. Apiaries and hives
that already exist with the same name (ignoring upper and lower case) are
used; others are created (rows with no apiary land in an "Imported" apiary).
A visit that is already recorded for that hive on that day with the same
values is skipped, so importing the same file twice changes nothing, and an
overwriting import leaves such visits as they are. Columns that are not
recognised are skipped. Weights and temperatures are read as kilograms and
degrees Celsius.

:::tip Round-trip first
If you're moving between Openbeehive instances, prefer the **full backup**
(as a ZIP with photos): it's complete and lossless. Use CSV for coming
**from** other apps.
:::

## Why this matters

Openbeehive is built so your data can't be held hostage. There's a long history of
beekeeping records getting locked into one vendor's cloud. Open efforts like
[BeeXML](https://beexml.org/) (an Apimondia interchange standard) and the
[BEEP](https://beep.nl/) project aim to fix that; Openbeehive leans the same way —
open formats, a documented [API](/category/using-the-api), and a one-click full
backup. Take your bees and go whenever you like.

For programmatic access and automated feeds, see [Using the API](/category/using-the-api).

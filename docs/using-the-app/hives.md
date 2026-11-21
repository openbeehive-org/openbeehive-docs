---
sidebar_position: 3
title: "Hives"
---

# Hives

A hive in Openbeehive is a single colony in a physical box. Almost everything you log day to day (visits, harvests, treatments) hangs off a hive. Each hive belongs to one apiary at a time and can have a queen. Works offline; see [Offline and sync](./offline-and-sync.md).

## Creating a hive

Open an apiary, type a name under **Add hive** and add it. The **Hives** list has the same form with an apiary picker behind its **+ New** button, and **+ New → New hive** on the Overview leads there. A new hive starts with status **Active** and no type. Open the hive and choose **More → Edit hive** to set:

| Field | What it is |
| --- | --- |
| **Name** | A number, a colour, a nickname. |
| **Type** | The frame and box standard; see below. |
| **Status** | The state of the colony; see below. |

A **photo** is added from the hive page by tapping the picture placeholder next to the name. Tapping the picture later opens it in the viewer, with **Replace photo** and **Delete photo**. Like the photos of a visit, a small preview syncs to every device at once and the full-size image is uploaded in the background; see [Offline & sync](./offline-and-sync.md#photos).

:::tip
Keep names short and consistent across an apiary, for example "1", "2", "3". Short names print clearly on QR labels and are quick to read in the field.
:::

### Hive types

| Type | Typical use |
| --- | --- |
| Zander | Widespread in parts of Germany and central Europe. |
| Dadant | Popular for honey production, large brood box. |
| Deutsch Normal | A traditional German standard. |
| Langstroth | The most common standard worldwide. |
| Warré | A vertical, low-intervention design. |
| Top-bar | Horizontal, frameless bars. |
| Other | Anything not listed above. |

For a fuller description of each standard, see [Hive types](../knowledge-base/hive-types.md).

### Status

| Status | Meaning |
| --- | --- |
| **Active** | A queenright colony in normal use. |
| **Nucleus** | A small starter colony (a "nuc"), often a split or a mating unit. |
| **Queenless** | The colony has lost its queen and needs attention. |
| **Lost** | The colony has died out or absconded. |
| **Dissolved** | You have united or broken up the colony. |

Status is a label you set by editing the hive; nothing changes it automatically. Setting a hive to **Lost** or **Dissolved** keeps its whole record.

## The hives list

**Hives** lists every hive of the workspace with its apiary and the time since its last visit. Above the list:

- **Search** finds hives by name, by apiary name or by the first characters of the label code printed on the [QR label](./qr-labels.md).
- **Status** and **Apiary** filter the list; **Clear filters** resets them.
- **Sort by** orders by **Name**, **Apiary** or **Longest since last visit**.

Names sort the way you read them: "Hive 2" comes before "Hive 10". A line under the tools says how many hives are shown.

## Moving a hive between apiaries

To relocate a hive, open it, tap **Move** in the header and pick the destination apiary. The hive keeps its name, queen, photo and full record; only its apiary changes.

### Location history

Every move is recorded as a dated entry under **Location history** at the bottom of the hive page, so you know where a colony was at any point in time. Useful for tracing disease exposure and for migratory records.

:::caution
In many regions, moving hives between locations is subject to bee health and movement rules, especially within disease control zones. Check your national or local requirements before relocating colonies. See [Diseases and pests](../knowledge-base/diseases-and-pests.md).
:::

## The hive page

Opening a hive gives you one screen with everything about that colony.

### Header and actions

The header shows the photo, the name, and the status and type. Next to it are the two things you do most in the field, **Record visit** and **Move**, and a **More** menu with:

- **Hive record card**: a printable table of every visit (with a **Print** button).
- **Development**: charts of the readings recorded on visits (occupied frames, brood frames, food stores, swarm cells, gentleness, calmness, varroa, hive weight, feed, youngest larva, temperature and humidity) plus honey harvests over time. Ratings such as food stores and gentleness are drawn as named levels with the best at the top, temperatures below zero are plotted, and varroa is charted only where the entry is a plain number.
- **Edit hive**, **QR code** (shows the hive's label with **Print** and **SVG** buttons; see [QR labels](./qr-labels.md)) and **Delete hive**.

### Latest readings

Below the header, pills show the numbers recorded on the most recent visit: occupied frames, brood frames, swarm cells, hive weight and varroa. Tapping a pill opens the matching chart in **Development**.

### Queen

The **Queen** card shows her year, number, marking colour, origin and comment, with **Replace queen** (or **Set queen** if none is recorded) and actions to edit or delete her record. **Queen history** lists earlier queens with their introduced and replaced dates. See [Queens](./queens.md).

### Visit log

**Record visit** opens the visit form. The five most recent visits are listed newest first, each as a date, the weather, chips summarising what you recorded (queen seen, frames, stores, swarm cells, temperament, feed, weight, honey, temperature, humidity, varroa), the note and any photos (tap one to open the viewer). Weights and temperatures appear in the units chosen under **Settings → Preferences → Units**. Each visit has actions to edit and delete it. **See all N visits** opens the full log. See [Inspections](./inspections.md).

### Honey and Treatments

**Honey** shows the hive's harvest total in its heading and lists each harvest (**Record harvest**). **Treatments** lists each treatment (**Record treatment**) and prints the treatment register (**Print register**). Harvests and treatments can be edited and deleted like visits. See [Harvests](./harvests.md) and [Treatments](./treatments.md).

## Deleting versus retiring a hive

Change a hive's **status** rather than deleting it. Setting a colony to **Lost** or **Dissolved** keeps its history for year-on-year comparison and traceability. Delete a hive only when it was created by mistake; the app asks for confirmation, and the hive goes with all its records.

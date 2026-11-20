---
sidebar_position: 2
title: "Apiaries"
---

# Apiaries

An **apiary** is a place where you keep bees: your garden, an allotment, a rooftop, a rented field, a stand at the edge of a forest. In Openbeehive the apiary is the top of your records; everything else hangs beneath it.

```text
Apiary  ->  Hive  ->  Queen
```

Each apiary holds one or more hives, each hive has its current (and past) queens, and visits, harvests and treatments attach to a hive within an apiary.

## Why apiaries matter

- **Context for your work.** When you arrive at a yard, open that apiary and see only the hives in front of you.
- **Finding the place again.** Coordinates and an address let you locate a remote stand and plan a round of visits.
- **Batch printing.** QR labels print per apiary, one label per hive.

:::tip
Keep one apiary per physical location. It keeps visits, harvests and treatments grouped where you actually do the work.
:::

## Creating an apiary

From the **Apiaries** list (or **+ New → New apiary** on the Overview) choose **New apiary**. Only a name is required.

| Field | Required | What it is for |
| --- | --- | --- |
| **Name** | Yes | A short label, e.g. "Home garden" or "Orchard stand". |
| **Address** | No | Free text to help you find the place. |
| **Note** | No | Gate codes, access notes, the landowner's name, parking. |
| **Latitude / Longitude** | No | Coordinates in decimal degrees. |

Works offline; see [Offline and sync](./offline-and-sync.md).

### Setting GPS coordinates

Type latitude and longitude by hand, or tap **Use my location** to fill them from your device's GPS. Your browser asks for permission the first time.

Coordinates are decimal degrees, for example latitude `52.5200` and longitude `13.4050`. Negative values are valid: south of the equator for latitude, west of Greenwich for longitude.

:::note
"Use my location" captures where **you** are standing. If you set up a remote yard from home, type the coordinates in, or correct them on your next visit.
:::

### The map and address lookup

The apiary form includes a map with a draggable pin. Type an address and the pin moves to match; drag the pin (or tap the map) and the address field is filled from the position, falling back to plain coordinates when no address is known for that spot.

A status line under the map reports what the lookup is doing:

- **Looking up the address…**: the search is running.
- **Location set**: the position was found and written into the form.
- **No match for this address**: drop the pin on the map instead.
- **Address search is unavailable**: the lookup service cannot be reached (you may be offline). The pin and manual coordinates keep working.

Map tiles and the address lookup come from OpenStreetMap services unless the operator of your instance configured others. They are the only outside services the app contacts: showing a map loads tiles for the area you look at, and typing an address or moving the pin sends that address or position to the lookup service. An operator can switch the map off for the whole instance; the form then has the coordinate fields only. See [Configuration](../self-hosting/configuration.md#maps).

## Adding and viewing hives

Open an apiary to see its hives with the date of each one's last inspection. From here you can:

- **Add hive**: type a name and add it. Set its type and status afterwards by editing the hive.
- **Open a hive** to see its queen, visit log, harvests and treatments.

See [Hives](./hives.md) and [Queens](./queens.md).

## Printing QR labels for the apiary

The **QR labels** button on the apiary page prints an A4 sheet with one label per hive in the apiary, straight from the page. Each label encodes a deep link to that hive; scanning it opens Openbeehive at the hive. See [QR labels](./qr-labels.md).

## Printing the treatment register

When hives of the apiary have treatments recorded, the **Treatment register** button prints the register for all of them in one document. See [Treatments](./treatments.md#treatment-register).

## Editing and reorganising

Rename an apiary, or update its address, note and coordinates, with **Edit apiary**. If two people edit the same apiary, the most recent change to each field wins.

If a hive moves to a different location, use **Move** on the hive to reassign it to the matching apiary. Migratory beekeepers can keep an apiary per site and move hives as they travel.

## Deleting an apiary

**Delete apiary** works only for an apiary without hives. While it still has hives, the app names how many there are and asks you to move or delete them first.

## Sharing

Apiaries are not shared individually. Everything in a workspace is visible to every member of that workspace, so to work on an apiary with someone, invite them to the workspace that holds it (Settings → Workspaces → Invite a beekeeper). To keep your home colonies private while collaborating on a club yard, create a separate workspace for the club. See [Accounts & workspaces](./accounts-tenants.md).

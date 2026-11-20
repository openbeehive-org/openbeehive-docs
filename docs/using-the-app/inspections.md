---
sidebar_position: 5
title: "Inspections (visits)"
---

# Inspections (visits)

An inspection is the record of a single visit to a hive: what you saw, what you did, and anything worth remembering. Over a season the visits build into a picture of how each colony is developing. Works offline; see [Offline & sync](./offline-and-sync.md).

:::tip
For what to look for during a visit and how often to inspect, read [Inspecting a colony](../beekeeping/inspecting.md). This page covers how to record it.
:::

## Starting a visit

Open a hive (or scan its [QR label](./qr-labels.md)) and tap **Record visit** in the header. The form opens with today's date, and **Save** stays within reach at the bottom of the screen while you scroll.

Every field is optional. A quick "all fine" with nothing else filled in is a valid entry.

### Empty is not zero

Number fields start empty. Leave a field empty when you did not look; enter `0` when you looked and found none. "Swarm cells: 0" is an observation, an empty field is not. The counts have **−** and **+** buttons, so you can enter them with gloves on.

### Start from last visit

If the hive has an earlier visit, **Start from last visit** (with that visit's date) fills in what usually changes little: occupied frames, brood frames, food stores, gentleness and calmness. Adjust what is different today. Fields the last visit left empty stay empty.

## Date and weather

| Field | Notes |
| --- | --- |
| Date | Defaults to today; change it to log a past visit. Future dates are not accepted. |
| Weather | Free text, e.g. "sunny, 22°C". |

## Colony & behaviour

| Field | What it records |
| --- | --- |
| Queen seen | Whether you spotted the queen. |
| Eggs seen | The quickest sign of a recently laying queen. |
| Capped brood seen | Whether sealed worker brood is present. |
| Youngest larva | Age in days of the youngest brood stage you found. |
| Occupied frames | How many frames the bees cover. |
| Brood frames | How many frames hold brood. |
| Food stores | Good, Medium, Low or None. |
| Swarm cells | How many queen cells you found. |
| Gentleness | Very gentle, Gentle, Normal, Nervous or Aggressive. |
| Calmness on comb | Runs off comb, Restless, Calm or Very calm. |
| Varroa | Mites per day. Enter a plain number such as `3` if you want it in the charts; other text is kept but not charted. |
| Hive weight | In kg, if you weigh the hive. |

:::note
The "eggs seen / youngest larva / capped brood" trio usually confirms a healthy laying queen without finding her each time.
:::

## Activities on this visit

This section starts collapsed; tap its heading to open it.

| Activity | Records |
| --- | --- |
| Fed | Amount fed, in kg. |
| Frames added / removed | Frames you put in or took out. |
| Drone frame cut | Whether you cut out a drone brood frame (a varroa control measure). |
| Super added | Whether you added a super. |

Honey is not recorded on the visit form any more. Record it as a [harvest](./harvests.md), with variety, water content and batch number. "Honey harvested" amounts entered on visits by earlier versions are still shown.

For the bigger picture on mite management and harvesting, see [Varroa](../beekeeping/varroa.md) and [Honey harvest](../beekeeping/honey-harvest.md).

## Climate

This section starts collapsed as well.

| Field | Unit |
| --- | --- |
| Hive temperature | °C |
| Outside temperature | °C |
| Hive humidity | % |
| Outside humidity | % |

All four are optional. Over time they appear in the hive's **Development** charts alongside weight and colony strength.

:::tip
A hive scale or climate sensor can post these fields through the API. Such readings are marked as sensor readings; see [Sensor readings](#sensor-readings) below and [Automated trackers](../using-the-api/automated-trackers.md).
:::

## Note and photos

Add a free-text **note** for anything the structured fields do not cover: a marked supersedure cell, a temper that needs watching, a reminder to requeen.

**Add photo** attaches one or more pictures (brood pattern, suspect disease, queen cells). They are stored with the visit and sync with the rest of your records. If something needs following up, add a [task](./tasks.md) with a due date.

## The visit log

The hive page shows the five most recent visits, newest first, each summarised as chips; **See all N visits** opens the full log, and **More → Hive record card** prints all visits as a table.

The log lets you spot trends: brood building up in spring, stores running down before winter, a rising varroa count.

## Correcting or deleting a visit \{#correcting}

Every visit in the log has an edit and a delete action.

- **Edit visit** opens the form with the saved values. Change what was wrong, including the date, and save. If two devices correct the same visit, the most recent change to each field wins.
- **Delete** asks for confirmation naming the visit's date. Afterwards a bar offers **Undo** for a few seconds. Deleting a visit also removes it from the hive's history and charts.

## Sensor readings \{#sensor-readings}

Readings that a scale or sensor posts through the API are stored as visits marked **Sensor reading**. They would drown the visits you made yourself, so:

- the hive page lists only visits recorded by a person, and so does the full log until you tick **Show sensor readings** there (the label says how many there are),
- "last inspected", the hives list and the Overview's due list ignore them,
- the **Development** charts include them.

## Tips for fast field entry

- **Scan the QR label** to open the right hive without scrolling.
- **Log as you go.** Tap fields between frames rather than reconstructing everything afterwards.
- **Lean on the quick trio.** Eggs seen, youngest larva and capped brood confirm a laying queen faster than hunting her down.
- **Keep notes short.** Drop a brief note now; expand it at home.
- **Leave blanks.** Record only what you checked.
- **Photograph the doubtful.** A picture of an odd brood pattern is worth more than a typed description.

:::caution
If you suspect a notifiable disease such as American or European foulbrood, photograph it, close up, and follow your local reporting rules. See [Diseases & pests](../knowledge-base/diseases-and-pests.md).
:::

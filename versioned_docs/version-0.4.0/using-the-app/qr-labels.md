---
sidebar_position: 9
title: "QR labels"
---

# QR labels

A QR label turns a hive into a one-tap shortcut. Stick a label on the roof or brood box, point your phone at it, and Openbeehive opens at that hive's record. No scrolling through lists in the apiary, no squinting at hand-written numbers in the rain.

## What the QR code contains

Each hive's code encodes a single deep link to that hive:

```text
<base>/h/<hiveId>
```

`<base>` is the address you are using the app at (`https://app.openbeehive.org` on the hosted service, your own URL on a self-hosted instance) and `<hiveId>` is the hive's identifier. The label also prints a six-character short code derived from the id, for telling labels apart by eye.

The code contains no bee data and no personal information; it is just a link. Someone who scans it without access is asked to sign in and only sees the hive if they are a member of the tenant that holds it.

Once the app is installed, the link opens the hive from your local database, so it works with no signal.

## Printing a label for one hive

1. Open the hive.
2. Tap the **QR** action (the dotted-square icon next to Edit and Move). A card appears with the code, the hive name and the short code.
3. Tap **Print**. A clean label opens in a new window and the print dialog follows. **SVG** downloads the code as a file instead, for your own label layouts.
4. Print onto label stock or plain paper and fix it to the hive.

:::tip Make it last outdoors
Print on weatherproof or vinyl label stock, or cover a paper label with clear packing tape or a laminate pouch. Place it where supers being lifted on and off won't scrape it: the side of the brood box or under the roof lip.
:::

## Printing a sheet for an apiary

1. Open the apiary.
2. Tap **QR labels**.
3. An A4 sheet opens with one labelled code per hive in that apiary, followed by the print dialog.
4. Print, cut and apply.

## Scanning a label

### With your phone's camera

Most phones recognise QR codes in the built-in camera app. Point the camera at the label, tap the link that appears, and Openbeehive opens at the hive. This works for anyone with access, without opening the app first.

### With the in-app scanner

**Scan** in the navigation opens Openbeehive's own scanner, useful when you are already in the app and moving between hives.

1. Open **Scan** and grant camera permission the first time.
2. Aim at the hive's QR code; the hive opens as soon as it is recognised.

On devices whose browser does not support the in-app scanner, the screen says so and suggests the normal camera app instead.

## If a scan doesn't open the right hive

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Camera won't focus on the code | Wet, faded or curled label | Wipe it dry; reprint if worn |
| Link opens but says "Hive not found" | Hive was deleted, or belongs to a different tenant | Check the hive still exists and that the right tenant is active |
| Asks you to sign in | You are not signed in on this device, or the hive is in a tenant you are not a member of | Sign in; ask the tenant admin to invite you |
| Nothing happens on tap | The phone did not recognise the code as a link | Use the in-app scanner or another QR reader |

Access follows tenant membership; see [Accounts & tenants](/using-the-app/accounts-tenants).

## Reprinting and changing labels

Labels never expire. The link stays valid for the life of the hive record. If you retire a box but keep the colony as the same hive in Openbeehive, the old label keeps working. If you start a fresh hive record, print a new label.

Labels encode the address you printed them from. If your self-hosted instance moves to a new domain, reprint.

:::caution
Don't move a printed label from one box to another and expect it to point at the new colony; it still opens the original hive. Print a fresh label instead.
:::

Technical details of the link format: [QR codes for developers](/developers/qr-codes).

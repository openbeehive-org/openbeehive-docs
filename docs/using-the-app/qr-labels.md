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

The code contains no bee data and no personal information; it is just a link. Someone who scans it without access is asked to sign in and only sees the hive if they are a member of the workspace that holds it.

Once the app is installed, the link opens the hive from your local database, so it works with no signal.

## Printing a label for one hive

1. Open the hive.
2. Choose **More → QR code**. A card appears with the code, the hive name and the short code.
3. Tap **Print**. A clean label opens in a new window and the print dialog follows. **SVG** downloads the code as a file instead, for your own label layouts.
4. Print onto label stock or plain paper and fix it to the hive.

:::tip[Make it last outdoors]
Print on weatherproof or vinyl label stock, or cover a paper label with clear packing tape or a laminate pouch. Place it where supers being lifted on and off won't scrape it: the side of the brood box or under the roof lip.
:::

## Printing a sheet for an apiary

1. Open the apiary.
2. Tap **QR labels**.
3. The print dialog opens with an A4 sheet of one labelled code per hive in that apiary.
4. Print, cut and apply.

## Scanning a label

### With your phone's camera

Most phones recognise QR codes in the built-in camera app. Point the camera at the label, tap the link that appears, and Openbeehive opens at the hive in the browser. This works for anyone with access, without opening the app first.

:::caution[If you installed the app, scan inside it]
The phone's camera opens the link in the browser, and the browser keeps its own data, separate from the installed app: you may have to sign in again and wait for a download there. If you use the installed app, open it from the home screen and use **Scan**.
:::

### With the in-app scanner

**Scan** in the navigation opens Openbeehive's own scanner, useful when you are already in the app and moving between hives.

1. Open **Scan** and grant camera permission the first time.
2. Aim at the hive's QR code; the hive opens as soon as it is recognised.

The scanner works in every current browser, including Safari on iPhone and iPad and Firefox. If a label is hard to read, move closer, hold steady and avoid glare.

### By typing the code

Under the camera picture, **Label code** takes the six characters printed under the QR code. Type them and tap **Open hive**. This also works when the label is too worn to scan, when the device has no camera or when camera access is blocked. The code is looked up among the hives on the device.

## If a scan doesn't open the right hive

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Camera won't focus on the code | Wet, faded or curled label | Wipe it dry; reprint if worn |
| "This hive is not in your data" | The hive was deleted, or belongs to a different workspace | Check the hive still exists and that the right workspace is active (Settings → Workspace) |
| "You are offline" | The hive has not been downloaded to this device yet | Connect; the hive opens once your data has synced |
| "Sign in to open this hive" | This browser is not signed in. Typical after scanning with the camera app while you normally use the installed app | Sign in, or scan inside the installed app |
| "Server not reachable" | The hive is not on the device and the server did not answer | Check your connection and tap **Try again** |
| "That is not an Openbeehive hive label." | The scanned code is some other QR code | Scan the hive label |
| Nothing happens on tap | The phone did not recognise the code as a link | Use the in-app scanner or type the label code |

Access follows workspace membership; see [Accounts & workspaces](./accounts-tenants.md).

## Reprinting and changing labels

Labels never expire. The link stays valid for the life of the hive record. If you retire a box but keep the colony as the same hive in Openbeehive, the old label keeps working. If you start a fresh hive record, print a new label.

Labels encode the address you printed them from. If your self-hosted instance moves to a new domain, reprint.

:::caution
Don't move a printed label from one box to another and expect it to point at the new colony; it still opens the original hive. Print a fresh label instead.
:::

Technical details of the link format: [QR codes for developers](../developers/qr-codes.md).

---
sidebar_position: 6
title: "QR codes & deep links"
---

# QR codes & deep links

Every hive can carry a printed QR label. Scanning it opens the app at that
hive. The code is in `app/src/lib/qr.ts`, `app/src/lib/components/QrLabel.svelte`,
`app/src/routes/h/[id]/+page.svelte` and `app/src/routes/(app)/scan/+page.svelte`.

## What a hive QR encodes

```text
<base>/h/<hiveId>
```

- `<base>` is `BEEHIVE_PUBLIC_URL` if it was set at build time of the SPA
  (Vite exposes `BEEHIVE_*` variables), otherwise the origin the app is
  running on. A self-hosted instance therefore prints codes that point back
  to itself.
- `<hiveId>` is the hive's UUID, minted on the device when the hive is
  created and never reassigned, so a printed label stays valid.

The id encodes a hive, not a permission. Knowing an id grants nothing; the
hive only resolves if its apiary has synced to the device.

## How `/h/[id]` resolves

The route is a resolver, not a page:

1. Look up the id in the local database (`hives.get`).
2. If missing and the browser is online, run `syncOnce()` and look again.
3. If found, `goto('/hives/<id>')` with `replaceState`.
4. Otherwise show "not found" (online) or "offline" (no connection).

```text
scan QR -> /h/<id> -> local lookup
                          |
              found ------+------ not found
                |                    |
          /hives/<id>          online? sync, re-check
                                     |
                          found -> /hives/<id>
                          still missing -> "not found" / "offline"
```

A hive that is already on the device resolves without a network round-trip.

## Rendering and printing

`qrSvg(text, size)` renders the QR as an SVG string on the device using the
`qrcode` package with error-correction level H, places the Openbeehive mark
in the centre and the brand name below. No network call is involved.

`shortCode(hiveId)` is the first six characters of the id without dashes,
upper-cased. It is printed under the QR as a human-readable caption and used
in the SVG file name. It is display only; nothing routes on it and it is not
a database column.

`QrLabel` shows the QR with the hive name and short code, opens a clean print
window (`Print`) and downloads the SVG (`SVG`). It appears on the hive detail
page `/hives/[id]`.

## Parsing scanned payloads

`parseHiveId(payload)` accepts three forms and returns the id or `null`:

| Input | Example |
| --- | --- |
| Any URL containing `/h/<id>` | `https://bees.example.com/h/2b1f6c0e-...` |
| Custom scheme | `openbeehive://hive/2b1f6c0e-...` |
| Bare UUID | `2b1f6c0e-...` |

The custom scheme is parsed but nothing in the app generates it; printed
labels always use the `https://` form so they open in a browser when the app
is not installed.

## In-app scanner

`/scan` uses the browser's `BarcodeDetector` API (`formats: ['qr_code']`) on
a rear-camera video stream and calls `parseHiveId` on every detected code,
then navigates to `/hives/<id>`. Where `BarcodeDetector` is unavailable (iOS
Safari) the page shows an "unsupported" message and the phone's camera app
is the way to scan; the QR is a plain URL and opens the same route. A
decoder library such as `@zxing/browser` could be dropped in for those
platforms; none is bundled.

The scanner needs camera permission and a secure context (HTTPS or
`localhost`).

## Native app wrappers

The app is a PWA and no native wrapper exists. If you build one, the `/h/*`
path is what to claim with Android App Links or iOS Universal Links; the
server does not serve `/.well-known/assetlinks.json` or
`/.well-known/apple-app-site-association`, so you would add those yourself
at the reverse proxy.

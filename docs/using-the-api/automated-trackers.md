---
sidebar_position: 4
title: "Automated trackers"
---

# Automated trackers and sensors

A hive scale, a brood-nest temperature probe or a humidity sensor can post
its readings into Openbeehive through `InspectionService.CreateInspection`
with `source` set to `INSPECTION_SOURCE_SENSOR`. Each reading is stored on
the hive, syncs to every device and feeds the hive's **Development** charts,
without being mistaken for a visit by a person. This page describes what the
server does with such readings and how to post them from a script.

## What a reading is

There is no separate sensor table. A reading is an inspection marked as a
sensor reading, with only the measurement fields filled in:

| JSON field | Meaning | Unit |
| --- | --- | --- |
| `source` | Always `"INSPECTION_SOURCE_SENSOR"` for a device | |
| `weightKg` | Hive weight | kg |
| `tempHive` | Temperature inside the hive | °C |
| `tempOutside` | Outside temperature | °C |
| `humidityHive` | Relative humidity inside the hive | % |
| `humidityOutside` | Outside relative humidity | % |
| `note` | Free text, for example the device name | |

Send only what your device measures. A field you leave out is stored as
"not recorded"; a field you send as `0` is stored as a measured zero, and
temperatures below zero are valid and charted. So do not send `0` for a
value you did not measure.

If you leave `source` out, the entry counts as a manual visit
(`INSPECTION_SOURCE_MANUAL`), with the effects described below.

On the server the reading goes through the same path as a visit recorded in
the app: the row is stamped with the apiary and reigning queen as of its
`date`, an `INSPECTION` event is written, and the change is appended to the
sync log with your account as author. See the
[API overview](./overview.md#writes-go-through-sync).

## What the app makes of it

- A sensor reading appears in the hive's **Development** charts after the
  device's next sync (the app syncs every 15 seconds while open, and after
  every local write).
- It does not count as an inspection. "Last inspected", the hives list, the
  dashboard's **Due inspections** panel and `StatsService.GetDashboard`
  ignore sensor readings, so a hive that reports daily still shows up as due
  when nobody has opened it for weeks.
- It is hidden from the visit lists. The hive page lists only visits by a
  person; the full visit log shows readings when **Show sensor readings** is
  ticked.
- `ListInspections` returns both kinds unless you filter with `source`.

An entry posted without `source` is treated as a manual visit: it shows in
the visit log and resets "last inspected". Readings posted that way by
scripts written for earlier versions stay manual visits; set `source` in the
script from now on.

Every reading is still a row that syncs to every device. Post a few readings
a day at most, or aggregate on the device and post one daily value. Put the
device name in `note`. Cadences of 15 minutes and finer belong in your own
time-series store.

## Authenticate from a script

Give each device its own API key (see
[Authentication](./overview.md#authentication)):

1. In the app, switch to the workspace the hive belongs to and open
   **Settings → API keys**.
2. Name the key after the device (for example `scale-01`), leave the
   permissions at **Read and write** (a sensor creates inspections, which a
   **Read-only** key cannot) and choose whether it expires, then tap
   **Create key**. Copy the `obhk_...` value; it is shown only once.
3. Store it on the device and send it as `Authorization: Bearer obhk_...`
   on every call.

The key acts as you inside that workspace and works with any login method
(password, OIDC or passkeys). It expires only if you picked an expiry
(**30 days**, **90 days** or **1 year**); an expired key gets
`unauthenticated` (HTTP 401) on every call until you create a new one.
Settings shows when each key was last used. When the device is retired, tap
**Remove** next to its key; the next call from it returns `unauthenticated`.
The key also stops working if you leave the workspace. Use a **Read-only** key
for anything that only reads, such as a dashboard or an export script; it
gets `permission_denied` on `CreateInspection` and every other write.

Two cases need no key or cannot use one:

- **Instance without login** (self-hosted, no password, OIDC or WebAuthn
  configured): every request runs as the local user. Send no header. The
  API keys section does not exist there.
- **Session sign-in as a fallback**: with password login enabled,
  `POST /auth/signin` with `email` and `password` returns a session `token`
  you can send the same way. It expires after `BEEHIVE_SESSION_TTL`
  (default `720h`, 30 days), so the script has to sign in again on
  `unauthenticated`. Prefer a key.

The demo account is read-only and cannot create keys; `CreateInspection`
returns `permission_denied` there.

## Find the hive id

`hiveId` is the hive's UUID, the same one encoded in its
[QR label](../using-the-app/qr-labels.md). Look it up once and store it on the
device:

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

Both return `id` and `name` per row. Keep one stable `hiveId` per sensor; if
the hive is moved to another apiary in the app, the id stays the same.

## Example: post one reading

```bash
#!/usr/bin/env bash
# Post one reading for one hive. Run it from cron a few times a day.
set -eu
OB="https://bees.example.com"
HIVE="c41a..."
# The API key from Settings -> API keys, stored once on the device.
TOKEN=$(cat /etc/openbeehive-key)

body=$(printf '{"hiveId":"%s","source":"INSPECTION_SOURCE_SENSOR","weightKg":%s,"tempHive":%s,"humidityHive":%s,"note":"scale-01"}' \
  "$HIVE" "$(read_sensor weight)" "$(read_sensor brood_temp)" "$(read_sensor brood_rh)")

curl -fsS -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "$body"
```

`read_sensor` stands for whatever reads your hardware. A key without an
expiry needs no refresh; a non-zero exit with HTTP 401 means the key was
removed or has expired. On an instance without login drop the
`Authorization` header. The same request in Python:

```python
import json, urllib.request

OB = "https://bees.example.com"
TOKEN = open("/etc/openbeehive-key").read().strip()  # obhk_...

def create_inspection(hive_id, **fields):
    body = json.dumps({"hiveId": hive_id, "source": "INSPECTION_SOURCE_SENSOR", **fields}).encode()
    req = urllib.request.Request(
        f"{OB}/openbeehive.v1.InspectionService/CreateInspection", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req) as res:
        return json.load(res)["inspection"]

create_inspection("c41a...", weightKg=42.5, tempHive=34.2, humidityHive=58, note="scale-01")
```

To back-date a reading (for example when the device buffered while offline),
send `date` as an RFC 3339 string. The server resolves the apiary and queen
for that date.

## Good practice

- **Buffer when offline.** Queue readings on the device and post them with
  their original `date` once the server is reachable.
- **One hive per sensor.** Do not post the same reading to several hives.
- **Mind the units.** Temperature in °C, humidity in 0 to 100, weight in kg.
- **Clean up test data.** `ListInspections` with your `hiveId` and
  `"source": "INSPECTION_SOURCE_SENSOR"` finds readings and
  `DeleteInspection` removes them; the delete syncs to devices too.
- **Correct instead of reposting.** `UpdateInspection` changes a stored
  reading; see [Update a record](./rest.md#update-a-record).

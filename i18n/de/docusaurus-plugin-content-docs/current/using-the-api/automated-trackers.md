---
sidebar_position: 4
title: "Automatische Tracker"
---

# Automatische Tracker und Sensoren

Eine Stockwaage, ein Temperaturfühler im Brutnest oder ein Feuchtesensor kann
seine Messwerte über `InspectionService.CreateInspection` in Openbeehive
ablegen, mit `source` auf `INSPECTION_SOURCE_SENSOR` gesetzt. Jeder Messwert
wird an der Beute gespeichert, synchronisiert auf jedes Gerät und fließt in
die Diagramme unter **Entwicklung** der Beute ein, ohne mit einer Durchsicht
durch eine Person verwechselt zu werden. Diese Seite beschreibt, was der
Server mit solchen Messwerten macht und wie du sie aus einem Skript sendest.

## Was ein Messwert ist

Es gibt keine eigene Sensortabelle. Ein Messwert ist eine Durchsicht, die als
Sensormessung gekennzeichnet ist und bei der nur die Messfelder gefüllt sind:

| JSON-Feld | Bedeutung | Einheit |
| --- | --- | --- |
| `source` | Für ein Gerät immer `"INSPECTION_SOURCE_SENSOR"` | |
| `weightKg` | Stockgewicht | kg |
| `tempHive` | Temperatur im Stock | °C |
| `tempOutside` | Außentemperatur | °C |
| `humidityHive` | Relative Luftfeuchte im Stock | % |
| `humidityOutside` | Relative Außenluftfeuchte | % |
| `note` | Freitext, zum Beispiel der Gerätename | |

Sende nur, was dein Gerät misst. Ein Feld, das du weglässt, wird als
„nicht erfasst“ gespeichert; ein Feld, das du als `0` sendest, wird als
gemessene Null gespeichert, und Temperaturen unter null sind gültig und
erscheinen in den Diagrammen. Sende also keine `0` für einen Wert, den du
nicht gemessen hast.

Wenn du `source` weglässt, zählt der Eintrag als manuelle Durchsicht
(`INSPECTION_SOURCE_MANUAL`), mit den unten beschriebenen Folgen.

Auf dem Server nimmt der Messwert denselben Weg wie ein in der App erfasster
Besuch: Die Zeile wird mit dem Standort und der regierenden Königin zum
Zeitpunkt ihres `date` gestempelt, ein `INSPECTION`-Ereignis wird
geschrieben, und die Änderung wird mit deinem Konto als Autor an das
Sync-Protokoll angehängt. Siehe den
[API-Überblick](./overview.md#writes-go-through-sync).

## Was die App daraus macht

- Eine Sensormessung erscheint nach dem nächsten Sync des Geräts in den
  Diagrammen unter **Entwicklung** der Beute (die App synchronisiert alle
  15 Sekunden, solange sie offen ist, und nach jedem lokalen Schreibvorgang).
- Sie zählt nicht als Durchsicht. „Letzte Durchsicht“, die Beutenliste, das
  Feld **Fällige Durchsichten** auf der Übersicht und
  `StatsService.GetDashboard` ignorieren Sensormessungen, sodass eine Beute,
  die täglich meldet, trotzdem als fällig auftaucht, wenn sie seit Wochen
  niemand geöffnet hat.
- Sie ist in den Durchsichtenlisten ausgeblendet. Die Beutenseite listet nur
  Durchsichten durch eine Person; die vollständige Durchsichtenliste zeigt
  Messwerte, wenn **Sensormessungen anzeigen** angehakt ist.
- `ListInspections` gibt beide Arten zurück, sofern du nicht mit `source`
  filterst.

Ein Eintrag, der ohne `source` gesendet wird, wird als manuelle Durchsicht
behandelt: Er erscheint in der Durchsichtenliste und setzt „Letzte
Durchsicht“ zurück. Messwerte, die Skripte für frühere Versionen auf diese
Weise gesendet haben, bleiben manuelle Durchsichten; setze `source` von nun
an im Skript.

Jeder Messwert ist weiterhin eine Zeile, die auf jedes Gerät synchronisiert.
Sende höchstens ein paar Messwerte am Tag, oder aggregiere auf dem Gerät und
sende einen Tageswert. Schreib den Gerätenamen in `note`. Takte von
15 Minuten und feiner gehören in deinen eigenen Zeitreihenspeicher.

## Aus einem Skript authentifizieren

Gib jedem Gerät seinen eigenen API-Schlüssel (siehe
[Authentifizierung](./overview.md#authentication)):

1. Wechsle in der App in den Arbeitsbereich, zu dem die Beute gehört, und öffne
   **Einstellungen → API-Schlüssel**.
2. Benenne den Schlüssel nach dem Gerät (zum Beispiel `scale-01`), lass die
   Berechtigungen auf **Lesen und Schreiben** (ein Sensor legt Durchsichten
   an, was ein Schlüssel mit **Nur Lesen** nicht kann), wähle, ob er
   ablaufen soll, und tippe auf **Schlüssel erstellen**. Kopiere den
   `obhk_...`-Wert; er wird nur einmal angezeigt.
3. Speichere ihn auf dem Gerät und sende ihn bei jedem Aufruf als
   `Authorization: Bearer obhk_...`.

Der Schlüssel handelt in diesem Arbeitsbereich als du und funktioniert mit jeder
Anmeldemethode (Passwort, OIDC oder Passkeys). Er läuft nur ab, wenn du ein
Ablaufdatum gewählt hast (**30 Tagen**, **90 Tagen** oder **1 Jahr**); ein
abgelaufener Schlüssel bekommt bei jedem Aufruf `unauthenticated`
(HTTP 401), bis du einen neuen erstellst. Die Einstellungen zeigen, wann
jeder Schlüssel zuletzt verwendet wurde. Wenn das Gerät ausgemustert wird,
tippe neben seinem Schlüssel auf **Entfernen**; der nächste Aufruf von ihm
liefert `unauthenticated`. Der Schlüssel funktioniert auch dann nicht mehr,
wenn du den Arbeitsbereich verlässt. Verwende einen Schlüssel mit **Nur Lesen**
für alles, was nur liest, etwa ein Dashboard oder ein Exportskript; er
bekommt `permission_denied` bei `CreateInspection` und jedem anderen
Schreibvorgang.

Zwei Fälle brauchen keinen Schlüssel oder können keinen verwenden:

- **Instanz ohne Login** (selbst gehostet, kein Passwort, OIDC oder WebAuthn
  konfiguriert): Jede Anfrage läuft als der lokale Benutzer. Sende keinen
  Header. Den Bereich API-Schlüssel gibt es dort nicht.
- **Anmeldung per Sitzung als Ausweichlösung**: Mit aktiviertem
  Passwort-Login liefert `POST /auth/signin` mit `email` und `password` ein
  Sitzungs-`token`, das du auf dieselbe Weise senden kannst. Es läuft nach
  `BEEHIVE_SESSION_TTL` ab (Vorgabe `720h`, 30 Tage), das Skript muss sich
  bei `unauthenticated` also erneut anmelden. Bevorzuge einen Schlüssel.

Das Demo-Konto ist schreibgeschützt und kann keine Schlüssel erstellen;
`CreateInspection` liefert dort `permission_denied`.

## Die Beuten-Id finden

`hiveId` ist die UUID der Beute, dieselbe, die in ihrem
[QR-Etikett](../using-the-app/qr-labels.md) kodiert ist. Schlag sie einmal nach
und speichere sie auf dem Gerät:

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

Beide liefern pro Zeile `id` und `name`. Behalte eine stabile `hiveId` pro
Sensor; wenn die Beute in der App an einen anderen Standort gewandert wird,
bleibt die Id dieselbe.

## Beispiel: einen Messwert senden

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

`read_sensor` steht für das, was auch immer deine Hardware ausliest. Ein
Schlüssel ohne Ablaufdatum braucht keine Erneuerung; ein Exit-Code ungleich
null mit HTTP 401 bedeutet, dass der Schlüssel entfernt wurde oder abgelaufen
ist. Auf einer Instanz ohne Login lässt du den `Authorization`-Header weg.
Dieselbe Anfrage in Python:

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

Um einen Messwert rückzudatieren (zum Beispiel, wenn das Gerät offline
gepuffert hat), sende `date` als RFC-3339-String. Der Server löst Standort
und Königin für dieses Datum auf.

## Gute Praxis

- **Offline puffern.** Stelle Messwerte auf dem Gerät in eine Warteschlange
  und sende sie mit ihrem ursprünglichen `date`, sobald der Server erreichbar
  ist.
- **Eine Beute pro Sensor.** Sende denselben Messwert nicht an mehrere
  Beuten.
- **Auf die Einheiten achten.** Temperatur in °C, Luftfeuchte von 0 bis 100,
  Gewicht in kg.
- **Testdaten aufräumen.** `ListInspections` mit deiner `hiveId` und
  `"source": "INSPECTION_SOURCE_SENSOR"` findet Messwerte, und
  `DeleteInspection` entfernt sie; die Löschung synchronisiert ebenfalls auf
  die Geräte.
- **Korrigieren statt neu senden.** `UpdateInspection` ändert einen
  gespeicherten Messwert; siehe
  [Einen Datensatz aktualisieren](./rest.md#update-a-record).

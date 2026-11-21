---
sidebar_position: 6
title: "QR-Codes & Deep Links"
---

# QR-Codes & Deep Links

Jede Beute kann ein gedrucktes QR-Etikett tragen. Scannst du es, öffnet sich
die App bei dieser Beute. Der Code liegt in `app/src/lib/qr.ts`,
`app/src/lib/components/QrLabel.svelte`, `app/src/routes/h/[id]/+page.svelte`
und `app/src/routes/(app)/scan/+page.svelte`.

## Was ein Beuten-QR kodiert

```text
<base>/h/<hiveId>
```

- `<base>` ist `BEEHIVE_PUBLIC_URL`, falls sie beim Build der SPA gesetzt war
  (Vite stellt `BEEHIVE_*`-Variablen bereit), sonst der Origin, auf dem die
  App läuft. Eine selbst gehostete Instanz druckt also Codes, die auf sie
  selbst zurückzeigen.
- `<hiveId>` ist die UUID der Beute, die beim Anlegen auf dem Gerät erzeugt
  und nie neu vergeben wird, sodass ein gedrucktes Etikett gültig bleibt.

Die Id kodiert eine Beute, keine Berechtigung. Eine Id zu kennen gewährt
nichts; die Beute wird nur aufgelöst, wenn ihr Standort auf das Gerät
synchronisiert wurde.

## Wie `/h/[id]` aufgelöst wird

Die Route ist ein Resolver, keine Seite:

1. Die Id in der lokalen Datenbank nachschlagen (`hives.get`).
2. Wenn gefunden, `goto('/hives/<id>')` mit `replaceState`.
3. Fehlt sie, warten, bis der erste Download des Geräts abgeschlossen ist, und
   erneut nachschlagen.
4. Fehlt sie dann immer noch, den Grund ermitteln und nennen: Das Gerät ist
   offline, dieser Browser ist nicht angemeldet (typisch, wenn die Kamera-App
   des Telefons den Link im Browser öffnet, während der Nutzer in der
   installierten App arbeitet), der Server ist nicht erreichbar oder die Beute
   gehört nicht zum aktiven Arbeitsbereich.

```text
scan QR -> /h/<id> -> local lookup
                          |
              found ------+------ not found
                |                    |
          /hives/<id>          sync, re-check
                                     |
                          found -> /hives/<id>
                          still missing -> offline / signed out /
                                           server unreachable / not in your data
```

Eine Beute, die bereits auf dem Gerät ist, wird ohne Netzwerk-Roundtrip
aufgelöst.

## Rendern und Drucken

`qrSvg(text, size)` rendert den QR mit dem Paket `qrcode` auf dem Gerät als
SVG-String mit Fehlerkorrekturstufe H, setzt das Openbeehive-Zeichen in die
Mitte und den Markennamen darunter. Es ist kein Netzwerkaufruf beteiligt.

`shortCode(hiveId)` sind die ersten sechs Zeichen der Id ohne Bindestriche, in
Großbuchstaben. Er wird als menschenlesbare Beschriftung unter den QR gedruckt
und im SVG-Dateinamen verwendet. Er ist keine Datenbankspalte, und keine URL
routet darüber; das Codefeld des Scanners und die Suche der Beutenliste
gleichen ihn mit dem Anfang der Beuten-Ids auf dem Gerät ab.

`QrLabel` zeigt den QR mit Beutenname und Kurzcode, öffnet ein sauberes
Druckfenster (**Drucken**) und lädt das SVG herunter (`SVG`). Es erscheint auf
der Beuten-Detailseite `/hives/[id]`. `QrSheet` ist der A4-Bogen für alle
Beuten eines Standorts; er wird direkt von der Standortseite aus gedruckt.
Beuten- und Standortnamen werden überall escaped, wo sie in Etiketten- oder
Druck-Markup geschrieben werden.

## Gescannte Payloads parsen

`parseHiveId(payload)` akzeptiert drei Formen und gibt die Id oder `null`
zurück:

| Eingabe | Beispiel |
| --- | --- |
| Jede URL, die `/h/<id>` enthält | `https://bees.example.com/h/2b1f6c0e-...` |
| Custom-Scheme | `openbeehive://hive/2b1f6c0e-...` |
| Reine UUID | `2b1f6c0e-...` |

Das Custom-Scheme wird geparst, aber nichts in der App erzeugt es; gedruckte
Etiketten verwenden immer die `https://`-Form, damit sie im Browser öffnen,
wenn die App nicht installiert ist.

## In-App-Scanner

`/scan` liest einen Videostream der Rückkamera, ruft für jeden erkannten Code
`parseHiveId` auf und navigiert dann zu `/hives/<id>`. Es nutzt die
`BarcodeDetector`-API des Browsers (`formats: ['qr_code']`), wo es sie gibt,
und weicht sonst (Safari unter iOS, Firefox) auf den gebündelten Decoder
`@zxing/browser` aus, der bei Bedarf nachgeladen wird. Ein Code, der kein
Beuten-Etikett ist, wird als solcher gemeldet. Unter dem Kamerabild nimmt ein
Formular den sechsstelligen Kurzcode entgegen und öffnet die Beute, deren Id
damit beginnt, nachgeschlagen in der lokalen Datenbank; das deckt auch Geräte
ohne Kamera und gesperrten Kamerazugriff ab.

Der Scanner braucht Kameraberechtigung und einen sicheren Kontext (HTTPS oder
`localhost`).

## Native App-Wrapper

Die App ist eine PWA, und es gibt keinen nativen Wrapper. Wenn du einen baust,
ist der Pfad `/h/*` das, was du mit Android App Links oder iOS Universal Links
beanspruchst; der Server liefert weder `/.well-known/assetlinks.json` noch
`/.well-known/apple-app-site-association` aus, du würdest diese also selbst
am Reverse Proxy ergänzen.

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
2. Fehlt sie und der Browser ist online, `syncOnce()` ausführen und erneut
   nachschlagen.
3. Wenn gefunden, `goto('/hives/<id>')` mit `replaceState`.
4. Sonst "nicht gefunden" (online) oder "offline" (keine Verbindung) anzeigen.

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

Eine Beute, die bereits auf dem Gerät ist, wird ohne Netzwerk-Roundtrip
aufgelöst.

## Rendern und Drucken

`qrSvg(text, size)` rendert den QR mit dem Paket `qrcode` auf dem Gerät als
SVG-String mit Fehlerkorrekturstufe H, setzt das Openbeehive-Zeichen in die
Mitte und den Markennamen darunter. Es ist kein Netzwerkaufruf beteiligt.

`shortCode(hiveId)` sind die ersten sechs Zeichen der Id ohne Bindestriche, in
Großbuchstaben. Er wird als menschenlesbare Beschriftung unter den QR gedruckt
und im SVG-Dateinamen verwendet. Er dient nur der Anzeige; nichts routet
darüber, und er ist keine Datenbankspalte.

`QrLabel` zeigt den QR mit Beutenname und Kurzcode, öffnet ein sauberes
Druckfenster (**Drucken**) und lädt das SVG herunter (`SVG`). Es erscheint auf
der Beuten-Detailseite `/hives/[id]`.

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

`/scan` nutzt die `BarcodeDetector`-API des Browsers
(`formats: ['qr_code']`) auf einem Videostream der Rückkamera, ruft für jeden
erkannten Code `parseHiveId` auf und navigiert dann zu `/hives/<id>`. Wo
`BarcodeDetector` nicht verfügbar ist (iOS Safari), zeigt die Seite einen
Hinweis, dass es nicht unterstützt wird, und die Kamera-App des Telefons ist
der Weg zum Scannen; der QR ist eine gewöhnliche URL und öffnet dieselbe
Route. Eine Decoder-Bibliothek wie `@zxing/browser` könnte für diese
Plattformen eingebunden werden; keine ist gebündelt.

Der Scanner braucht Kameraberechtigung und einen sicheren Kontext (HTTPS oder
`localhost`).

## Native App-Wrapper

Die App ist eine PWA, und es gibt keinen nativen Wrapper. Wenn du einen baust,
ist der Pfad `/h/*` das, was du mit Android App Links oder iOS Universal Links
beanspruchst; der Server liefert weder `/.well-known/assetlinks.json` noch
`/.well-known/apple-app-site-association` aus, du würdest diese also selbst
am Reverse Proxy ergänzen.

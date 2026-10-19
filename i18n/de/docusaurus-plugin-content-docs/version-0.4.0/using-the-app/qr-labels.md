---
sidebar_position: 9
title: "QR-Etiketten"
---

# QR-Etiketten

Ein QR-Etikett macht eine Beute zu einer Ein-Tipp-Abkürzung. Klebe ein Etikett auf den Deckel oder den Brutraum, richte dein Smartphone darauf, und Openbeehive öffnet die Aufzeichnung dieser Beute. Kein Scrollen durch Listen am Bienenstand, kein Blinzeln auf handgeschriebene Nummern im Regen.

## Was der QR-Code enthält

Der Code jeder Beute kodiert einen einzelnen Deep Link zu dieser Beute:

```text
<base>/h/<hiveId>
```

`<base>` ist die Adresse, unter der du die App nutzt (`https://app.openbeehive.org` beim gehosteten Dienst, deine eigene URL bei einer selbst gehosteten Instanz), und `<hiveId>` ist die Kennung der Beute. Das Etikett druckt außerdem einen sechsstelligen Kurzcode, der aus der Kennung abgeleitet ist, um Etiketten mit bloßem Auge auseinanderzuhalten.

Der Code enthält keine Bienendaten und keine persönlichen Informationen; er ist nur ein Link. Wer ihn ohne Zugriff scannt, wird zur Anmeldung aufgefordert und sieht die Beute nur als Mitglied des Mandanten, der sie enthält.

Sobald die App installiert ist, öffnet der Link die Beute aus deiner lokalen Datenbank, er funktioniert also ohne Empfang.

## Ein Etikett für eine Beute drucken

1. Öffne die Beute.
2. Tippe auf die Aktion **QR** (das Symbol mit dem gepunkteten Quadrat neben Bearbeiten und Wandern). Eine Karte mit dem Code, dem Beutennamen und dem Kurzcode erscheint.
3. Tippe auf **Drucken**. Ein sauberes Etikett öffnet sich in einem neuen Fenster, gefolgt vom Druckdialog. **SVG** lädt den Code stattdessen als Datei herunter, für eigene Etikettenlayouts.
4. Drucke auf Etikettenmaterial oder normales Papier und befestige es an der Beute.

:::tip Mach es draußen haltbar
Drucke auf wetterfestes oder Vinyl-Etikettenmaterial oder decke ein Papieretikett mit klarem Packband oder einer Laminierhülle ab. Platziere es dort, wo auf- und abgehobene Honigräume es nicht abschaben: an der Seite des Brutraums oder unter der Deckelkante.
:::

## Einen Bogen für einen Bienenstand drucken

1. Öffne den Bienenstand.
2. Tippe auf **QR-Etiketten**.
3. Ein A4-Bogen mit einem beschrifteten Code pro Beute dieses Bienenstands öffnet sich, gefolgt vom Druckdialog.
4. Drucken, schneiden, anbringen.

## Ein Etikett scannen

### Mit der Kamera deines Smartphones

Die meisten Smartphones erkennen QR-Codes in der eingebauten Kamera-App. Richte die Kamera auf das Etikett, tippe auf den erscheinenden Link, und Openbeehive öffnet die Beute. Das funktioniert für alle mit Zugriff, ohne die App vorher zu öffnen.

### Mit dem In-App-Scanner

**Scannen** in der Navigation öffnet Openbeehives eigenen Scanner, nützlich, wenn du bereits in der App bist und zwischen Beuten wechselst.

1. Öffne **Scannen** und erteile beim ersten Mal die Kameraberechtigung.
2. Richte ihn auf den QR-Code der Beute; die Beute öffnet sich, sobald er erkannt wird.

Auf Geräten, deren Browser den In-App-Scanner nicht unterstützt, sagt der Bildschirm das und verweist auf die normale Kamera-App.

## Wenn ein Scan nicht die richtige Beute öffnet

| Symptom | Wahrscheinliche Ursache | Was zu tun ist |
| --- | --- | --- |
| Kamera fokussiert nicht auf den Code | Nasses, verblasstes oder gewelltes Etikett | Trockenwischen; bei Abnutzung neu drucken |
| Link öffnet, sagt aber „Nicht gefunden" | Beute wurde gelöscht oder gehört zu einem anderen Mandanten | Prüfe, ob die Beute noch existiert und der richtige Mandant aktiv ist |
| Fordert zur Anmeldung auf | Du bist auf diesem Gerät nicht angemeldet, oder die Beute liegt in einem Mandanten, dessen Mitglied du nicht bist | Melde dich an; bitte den Mandanten-Admin, dich einzuladen |
| Beim Antippen passiert nichts | Das Smartphone hat den Code nicht als Link erkannt | Nutze den In-App-Scanner oder einen anderen QR-Reader |

Der Zugriff folgt der Mandanten-Mitgliedschaft; siehe [Konten & Mandanten](/using-the-app/accounts-tenants).

## Neudruck und Etiketten ändern

Etiketten verfallen nie. Der Link bleibt für die Lebensdauer der Beutenaufzeichnung gültig. Wenn du eine Zarge stilllegst, das Volk aber als dieselbe Beute in Openbeehive behältst, funktioniert das alte Etikett weiter. Wenn du eine frische Beutenaufzeichnung beginnst, drucke ein neues Etikett.

Etiketten kodieren die Adresse, von der aus du sie gedruckt hast. Zieht deine selbst gehostete Instanz auf eine neue Domain um, drucke neu.

:::caution
Versetze ein gedrucktes Etikett nicht von einer Zarge auf eine andere und erwarte, dass es auf das neue Volk zeigt; es öffnet weiterhin die ursprüngliche Beute. Drucke stattdessen ein frisches Etikett.
:::

Technische Details zum Linkformat: [QR-Codes für Entwickler](/developers/qr-codes).

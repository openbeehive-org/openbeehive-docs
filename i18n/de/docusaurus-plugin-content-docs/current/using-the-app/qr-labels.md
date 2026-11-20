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

Der Code enthält keine Bienendaten und keine persönlichen Informationen; er ist nur ein Link. Wer ihn ohne Zugriff scannt, wird zur Anmeldung aufgefordert und sieht die Beute nur als Mitglied des Arbeitsbereichs, der sie enthält.

Sobald die App installiert ist, öffnet der Link die Beute aus deiner lokalen Datenbank, er funktioniert also ohne Empfang.

## Ein Etikett für eine Beute drucken

1. Öffne die Beute.
2. Wähle **Mehr → QR-Code**. Eine Karte mit dem Code, dem Beutennamen und dem Kurzcode erscheint.
3. Tippe auf **Drucken**. Ein sauberes Etikett öffnet sich in einem neuen Fenster, gefolgt vom Druckdialog. **SVG** lädt den Code stattdessen als Datei herunter, für eigene Etikettenlayouts.
4. Drucke auf Etikettenmaterial oder normales Papier und befestige es an der Beute.

:::tip[Mach es draußen haltbar]
Drucke auf wetterfestes oder Vinyl-Etikettenmaterial oder decke ein Papieretikett mit klarem Packband oder einer Laminierhülle ab. Platziere es dort, wo auf- und abgehobene Honigräume es nicht abschaben: an der Seite des Brutraums oder unter der Deckelkante.
:::

## Einen Bogen für einen Bienenstand drucken

1. Öffne den Bienenstand.
2. Tippe auf **QR-Etiketten**.
3. Der Druckdialog öffnet sich mit einem A4-Bogen, der einen beschrifteten Code pro Beute dieses Bienenstands enthält.
4. Drucken, schneiden, anbringen.

## Ein Etikett scannen

### Mit der Kamera deines Smartphones

Die meisten Smartphones erkennen QR-Codes in der eingebauten Kamera-App. Richte die Kamera auf das Etikett, tippe auf den erscheinenden Link, und Openbeehive öffnet die Beute im Browser. Das funktioniert für alle mit Zugriff, ohne die App vorher zu öffnen.

:::caution[Wenn du die App installiert hast, scanne in ihr]
Die Kamera des Telefons öffnet den Link im Browser, und der Browser hat eigene Daten, getrennt von der installierten App: Womöglich musst du dich dort erneut anmelden und auf einen Download warten. Wenn du die installierte App nutzt, öffne sie vom Startbildschirm und nutze **Scannen**.
:::

### Mit dem In-App-Scanner

**Scannen** in der Navigation öffnet Openbeehives eigenen Scanner, nützlich, wenn du bereits in der App bist und zwischen Beuten wechselst.

1. Öffne **Scannen** und erteile beim ersten Mal die Kameraberechtigung.
2. Richte ihn auf den QR-Code der Beute; die Beute öffnet sich, sobald er erkannt wird.

Der Scanner funktioniert in jedem aktuellen Browser, auch in Safari auf iPhone und iPad und in Firefox. Ist ein Etikett schwer lesbar, geh näher heran, halte ruhig und vermeide Spiegelungen.

### Durch Eintippen des Codes

Unter dem Kamerabild nimmt **Etikettencode** die sechs Zeichen entgegen, die unter dem QR-Code stehen. Tippe sie ein und tippe auf **Beute öffnen**. Das funktioniert auch, wenn das Etikett zu abgenutzt zum Scannen ist, wenn das Gerät keine Kamera hat oder wenn der Kamerazugriff gesperrt ist. Der Code wird unter den Beuten auf dem Gerät gesucht.

## Wenn ein Scan nicht die richtige Beute öffnet

| Symptom | Wahrscheinliche Ursache | Was zu tun ist |
| --- | --- | --- |
| Kamera fokussiert nicht auf den Code | Nasses, verblasstes oder gewelltes Etikett | Trockenwischen; bei Abnutzung neu drucken |
| „Diese Beute ist nicht in deinen Daten“ | Die Beute wurde gelöscht oder gehört zu einem anderen Arbeitsbereich | Prüfe, ob die Beute noch existiert und der richtige Arbeitsbereich aktiv ist (Einstellungen → Arbeitsbereiche) |
| „Du bist offline“ | Die Beute wurde noch nicht auf dieses Gerät geladen | Stelle eine Verbindung her; die Beute öffnet sich, sobald deine Daten synchronisiert sind |
| „Zum Öffnen der Beute anmelden“ | Dieser Browser ist nicht angemeldet. Typisch nach dem Scannen mit der Kamera-App, wenn du sonst die installierte App nutzt | Melde dich an oder scanne in der installierten App |
| „Server nicht erreichbar“ | Die Beute ist nicht auf dem Gerät, und der Server hat nicht geantwortet | Prüfe deine Verbindung und tippe auf **Erneut versuchen** |
| „Das ist kein Openbeehive-Etikett einer Beute.“ | Der gescannte Code ist irgendein anderer QR-Code | Scanne das Etikett der Beute |
| Beim Antippen passiert nichts | Das Smartphone hat den Code nicht als Link erkannt | Nutze den In-App-Scanner oder tippe den Etikettencode ein |

Der Zugriff folgt der Mitgliedschaft im Arbeitsbereich; siehe [Konten & Arbeitsbereiche](./accounts-tenants.md).

## Neudruck und Etiketten ändern

Etiketten verfallen nie. Der Link bleibt für die Lebensdauer der Beutenaufzeichnung gültig. Wenn du eine Zarge stilllegst, das Volk aber als dieselbe Beute in Openbeehive behältst, funktioniert das alte Etikett weiter. Wenn du eine frische Beutenaufzeichnung beginnst, drucke ein neues Etikett.

Etiketten kodieren die Adresse, von der aus du sie gedruckt hast. Zieht deine selbst gehostete Instanz auf eine neue Domain um, drucke neu.

:::caution
Versetze ein gedrucktes Etikett nicht von einer Zarge auf eine andere und erwarte, dass es auf das neue Volk zeigt; es öffnet weiterhin die ursprüngliche Beute. Drucke stattdessen ein frisches Etikett.
:::

Technische Details zum Linkformat: [QR-Codes für Entwickler](../developers/qr-codes.md).

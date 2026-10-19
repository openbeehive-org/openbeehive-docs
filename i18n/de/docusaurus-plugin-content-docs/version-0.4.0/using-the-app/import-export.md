---
sidebar_position: 12
title: "Import & Export"
---

# Import & Export

Deine Aufzeichnungen gehören dir. Mit Openbeehive kannst du **all deine Daten**
mitnehmen — als Sicherung, zum Umzug auf eine andere Instanz, zur Auswertung in
einer Tabellenkalkulation oder zum Teilen mit anderen Werkzeugen. Alles läuft
lokal über **Einstellungen → Daten & Sicherung**; keine Daten verlassen dein
Gerät, es sei denn, du entscheidest dich, die Datei zu teilen.

## Exportieren

Öffne die **Einstellungen**, suche **Daten & Sicherung** und wähle ein Format:

| Format | Was du bekommst | Am besten geeignet für |
| --- | --- | --- |
| **Vollständige Sicherung (JSON)** | Jede Aufzeichnung — Bienenstände, Beuten, Königinnen, Durchsichten, Ernten, Aufgaben, Platzierungen und Ereignisse — in einer Datei | Aufbewahrung und **Umzug auf eine andere Instanz** (verlustfrei hin und zurück) |
| **Tabellenkalkulation (XLSX)** | Eine Arbeitsmappe, ein Tabellenblatt je Objekt | Auswertung in Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Eine `.csv` je Objekt, gebündelt in einer `.zip` | Universeller Austausch, Skripte, andere Apps |
| **BeeXML** | Eine strukturierte XML-Datei (Bienenstand → Beute → Königin / Durchsicht) | Teilen mit Werkzeugen, die das [BeeXML](https://beexml.org/)-Austauschformat sprechen |
| **Bericht (PDF)** | Ein druckbarer Bienenstand-Bericht — Beuten, aktuelle Königinnen und neueste Messwerte | Drucken, Teilen, Audit / Dokumentation |

Der **Bericht (PDF)** öffnet eine übersichtliche, gebrandete Zusammenfassung in
einem neuen Tab und löst den Druckdialog deines Browsers aus — wähle „Als PDF
speichern", um eine Kopie zu behalten.

Der Export gibt wieder, was sich gerade auf deinem Gerät befindet. Fotos sind in
den CSV-/XLSX-/BeeXML-Exporten nicht enthalten (sie werden als Blobs gespeichert)
— das vollständige Bild liegt in deinem synchronisierten Konto und dessen
Blob-Speicher; siehe [Self-Hosting → Sicherungen](/self-hosting/backups) für
serverseitige Sicherungen.

## Importieren & Wiederherstellen

Wähle im selben Bereich **Daten & Sicherung** ein Format und eine Datei aus:

- **Openbeehive-Sicherung (JSON)** — stellt einen früheren Export wieder her.
  Aufzeichnungen behalten ihre IDs, daher ist das erneute Importieren derselben
  Sicherung unbedenklich (es entstehen keine Duplikate).
- **BeeXML** — importiert Bienenstände, Beuten, Königinnen und Durchsichten aus
  einer Datei im BeeXML-Stil.
- **CSV aus einer anderen App** — migriere von einer anderen Imkerei-App oder
  einer Tabellenkalkulation (siehe unten).
- **Automatische Erkennung** — wählt den passenden Leser anhand der Datei aus.

Importierte Aufzeichnungen werden Teil **deines** Kontos und synchronisieren sich
wie alles, was du von Hand eingibst.

## Migration von einer anderen App

Die meisten Imkerei-Apps können ihre Aufzeichnungen als **CSV** exportieren (zum
Beispiel **Apiary Book**, **HiveBook**, **BeeKeeperPal** oder deine eigene
Tabellenkalkulation). Openbeehive liest diese Dateien durch **Abgleich der
Spaltennamen**, sodass du in der Regel nichts umformatieren musst.

Erkannte Spalten (Groß- und Kleinschreibung, Leerzeichen und Satzzeichen spielen
keine Rolle; mehrere Sprachen werden verstanden):

| Openbeehive-Feld | Erkannte Spaltennamen |
| --- | --- |
| Bienenstand | apiary, yard, location, standort, rucher, colmenar, apiario |
| Beute | hive, colony, beute, volk, ruche, colmena, arnia |
| Datum | date, inspection date, visit date, datum, fecha, data |
| Wetter | weather, wetter, meteo, tiempo |
| Varroa | varroa, mites, mite count |
| Beutentemperatur | hive temp, brood temp |
| Außentemperatur | temperature, temp, outside temp, ambient temp |
| Beutenfeuchtigkeit | hive humidity |
| Außenfeuchtigkeit | humidity, outside humidity |
| Beutengewicht | weight, hive weight, gewicht |
| Honig | honey, harvest, yield, honig, ernte |
| Notizen | note, notes, comment, remarks, notiz |

Jede CSV-Zeile wird zu einer **Durchsicht** an der passenden Beute und legt
Bienenstände und Beuten nach Bedarf an (Zeilen ohne Bienenstand landen in einem
Bienenstand „Imported"). Nicht erkannte Spalten werden übersprungen — nichts geht
kaputt, du behältst einfach den Rest.

:::tip Erst hin und zurück
Wenn du zwischen Openbeehive-Instanzen umziehst, bevorzuge die **JSON-Sicherung**
— sie ist vollständig und verlustfrei. Verwende CSV für den Wechsel **von**
anderen Apps.
:::

## Warum das wichtig ist

Openbeehive ist so gebaut, dass deine Daten nicht als Geisel gehalten werden
können. Es gibt eine lange Geschichte von Imkerei-Aufzeichnungen, die in der Cloud
eines einzigen Anbieters eingesperrt wurden. Offene Bemühungen wie
[BeeXML](https://beexml.org/) (ein Apimondia-Austauschstandard) und das
[BEEP](https://beep.nl/)-Projekt wollen das beheben; Openbeehive geht denselben
Weg — offene Formate, eine dokumentierte [API](/category/using-the-api) und eine
vollständige Sicherung per Klick. Nimm deine Bienen und geh, wann immer du
möchtest.

Für programmatischen Zugriff und automatisierte Datenfeeds siehe [Verwendung der API](/category/using-the-api).

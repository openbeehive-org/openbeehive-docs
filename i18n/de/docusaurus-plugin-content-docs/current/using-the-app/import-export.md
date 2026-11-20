---
sidebar_position: 12
title: "Import & Export"
---

# Import & Export

Deine Aufzeichnungen gehören dir. Mit Openbeehive kannst du **all deine Daten**
mitnehmen: als Backup, zum Umzug auf eine andere Instanz, zur Auswertung in
einer Tabellenkalkulation oder zum Teilen mit anderen Werkzeugen. Alles findest
du unter **Einstellungen → Daten & Backup**.

Export und Import arbeiten mit dem **aktiven Arbeitsbereich**. Beide warten, bis
das Gerät die erste Synchronisierung des Arbeitsbereichs abgeschlossen hat; bis
dahin weist der Bereich darauf hin.

## Vollständiges Backup \{#full-backup}

**Vollständiges Backup herunterladen** speichert alle Bienenstände, Beuten,
Königinnen, Durchsichten, Behandlungen, Ernten, Aufgaben und Verlaufseinträge
des Arbeitsbereichs so, wie dieses Gerät sie hat, einschließlich deiner
persönlichen Aufgaben und noch nicht hochgeladener Änderungen. Der Bereich
zeigt, wie viele solcher Änderungen es gibt und wie viele der Server abgelehnt
hat (siehe [Sync-Probleme](./offline-and-sync.md#sync-problems)): Sie sind in
der Datei enthalten, aber nicht auf dem Server.

- Ohne Fotos ist das Backup eine JSON-Datei.
- Mit **Fotos einschließen** ist es ein ZIP, das auch die Bilder in voller
  Größe enthält. Bilder, die nicht auf diesem Gerät sind, holt die App vom
  Server; geht das nicht (offline oder noch nicht hochgeladen), sagt die App,
  wie viele fehlen, und deren Vorschaubilder werden aufgenommen.

Gewichte und Temperaturen werden immer in Kilogramm und Grad Celsius
exportiert, egal welche Einheiten du unter **Einstellungen → Einheiten**
gewählt hast.

### Vom Server herunterladen \{#server-copy}

**Server-Kopie herunterladen** holt die vollständige Kopie des Arbeitsbereichs,
die der Server hat, im selben Format. Sie enthält deine eigenen persönlichen
Aufgaben, aber nicht die anderer Mitglieder, und ihr fehlen Änderungen, die ein
Gerät noch nicht hochgeladen hat. Einige Downloads pro Stunde sind möglich.
Skripte können dieselbe Datei mit einem API-Schlüssel abrufen; siehe
[REST](../using-the-api/rest.md#export). Das Demo-Konto kann sie nicht
herunterladen.

## Weitere Formate

| Format | Was du bekommst | Am besten geeignet für |
| --- | --- | --- |
| **Tabelle (XLSX)** | Eine Arbeitsmappe, ein Tabellenblatt je Art von Eintrag | Auswertung in Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Eine `.csv` je Art von Eintrag, gebündelt in einer `.zip` | Universeller Austausch, Skripte, andere Apps |
| **BeeXML** | Bienenstände, Beuten, Königinnen und Durchsichten in einer strukturierten XML-Datei | Teilen mit Werkzeugen, die das [BeeXML](https://beexml.org/)-Austauschformat sprechen |
| **Bericht (PDF)** | Ein druckbarer Bienenstand-Bericht: Beuten, aktuelle Königinnen und neueste Messwerte | Drucken, Teilen, Dokumentation |

Diese Formate sind zum Lesen anderswo gedacht; zum Wiederherstellen deiner Daten
dient das vollständige Backup. Der **Bericht (PDF)** öffnet eine Zusammenfassung
in einem neuen Tab und löst den Druckdialog deines Browsers aus; wähle „Als PDF
speichern“, um eine Kopie zu behalten. Für serverseitige Backups einer ganzen
Instanz siehe [Self-Hosting → Backups](../self-hosting/backups.md).

## Importieren \{#importing}

**Importieren → Datei wählen…** liest eine Datei in den aktiven Arbeitsbereich
ein. Wähle das **Dateiformat** oder lass es auf **Automatisch erkennen**:

- **Openbeehive-Backup (JSON oder ZIP)**: ein vollständiges Backup dieser oder
  einer anderen Instanz, mit Fotos, wenn es ein ZIP ist.
- **BeeXML**: Bienenstände, Beuten, Königinnen und Durchsichten aus einer Datei
  im BeeXML-Stil.
- **CSV aus einer anderen App**: Durchsichten aus einer anderen Imker-App oder
  einer Tabellenkalkulation (siehe unten).

Nichts wird geschrieben, bevor du eine **Vorschau** siehst: je Art von Eintrag,
wie viele **Neu**, **Überschrieben**, **Wiederhergestellt** und **Übersprungen
(schon vorhanden)** sind. Tippe dann auf **Jetzt importieren**.

Standardmäßig fügt ein Import nur hinzu. Einträge, die es in diesem
Arbeitsbereich schon gibt, auch gelöschte, werden übersprungen und nie
geändert; dasselbe Backup zweimal zu importieren ändert also nichts. Zwei
Optionen ändern das:

- **Bestehende Einträge überschreiben** schreibt die Werte aus der Datei, wo sie
  abweichen. Geschrieben werden nur Felder, die die Datei enthält; Änderungen
  seit dem Export gehen verloren. Gelöschte Einträge bleiben gelöscht.
- **Auch gelöschte Einträge wiederherstellen** holt Einträge zurück, die hier
  gelöscht wurden.

Eine Datei aus einem **anderen Arbeitsbereich** bekommt neue IDs und berührt
daher nie bestehende Einträge; die Vorschau weist darauf hin. Importierte
Einträge synchronisieren wie alles, was du von Hand eingibst. Zahlen in der
Datei werden als Kilogramm und Grad Celsius gelesen.

**Letzten Import rückgängig machen** löscht, was der letzte Import angelegt hat,
auch offline. Ein Bienenstand oder eine Beute, zu dem bzw. der seitdem eigene
Einträge hinzugekommen sind (eine Durchsicht, eine dorthin gewanderte Beute),
bleibt erhalten, und die App sagt, wie viele.

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
| Notizen | note, notes, comment, comments, remarks, notiz, bemerkung |

Jede CSV-Zeile wird zu einer **Durchsicht** der passenden Beute. Bienenstände
und Beuten, die es mit demselben Namen schon gibt (ohne Rücksicht auf Groß- und
Kleinschreibung), werden verwendet; andere werden angelegt (Zeilen ohne
Bienenstand landen in einem Bienenstand „Imported“). Eine Durchsicht, die für
diese Beute an diesem Tag mit denselben Werten schon erfasst ist, wird
übersprungen; dieselbe Datei zweimal zu importieren ändert also nichts, und ein
überschreibender Import lässt solche Durchsichten, wie sie sind. Nicht erkannte
Spalten werden übersprungen. Gewichte und Temperaturen werden als Kilogramm und
Grad Celsius gelesen.

:::tip[Erst hin und zurück]
Wenn du zwischen Openbeehive-Instanzen umziehst, bevorzuge das **vollständige
Backup** (als ZIP mit Fotos): Es ist vollständig und verlustfrei. Verwende CSV für den Wechsel **von**
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

---
sidebar_position: 3
title: "Beuten"
---

# Beuten

Eine Beute in Openbeehive ist ein einzelnes Volk in einer physischen Zarge. Fast alles, was du Tag für Tag erfasst (Durchsichten, Ernten, Behandlungen), hängt an einer Beute. Jede Beute gehört zu jeweils einem Bienenstand und kann eine Königin haben. Funktioniert offline; siehe [Offline und Synchronisation](./offline-and-sync.md).

## Eine Beute anlegen

Öffne einen Bienenstand, gib unter **Beute hinzufügen** einen Namen ein und füge sie hinzu. Die Liste **Beuten** hat dasselbe Formular mit einer Standortauswahl hinter ihrem Button **+ Neu**, und **+ Neu → Neue Beute** auf der Übersicht führt dorthin. Eine neue Beute startet mit dem Status **Aktiv** und ohne Typ. Öffne die Beute und wähle **Mehr → Beute bearbeiten**, um Folgendes festzulegen:

| Feld | Was es ist |
| --- | --- |
| **Name** | Eine Nummer, eine Farbe, ein Spitzname. |
| **Typ** | Der Rähmchen- und Zargenstandard; siehe unten. |
| **Status** | Der Zustand des Volkes; siehe unten. |

Ein **Foto** fügst du auf der Beutenseite hinzu, indem du auf den Bildplatzhalter neben dem Namen tippst. Tippst du später auf das Bild, öffnet es sich in der Ansicht mit **Foto ersetzen** und **Foto löschen**. Wie bei den Fotos einer Durchsicht wird sofort eine kleine Vorschau auf jedes Gerät synchronisiert, und das Bild in voller Größe wird im Hintergrund hochgeladen; siehe [Offline und Synchronisation](./offline-and-sync.md#photos).

:::tip
Halte Namen innerhalb eines Bienenstands kurz und einheitlich, zum Beispiel „1", „2", „3". Kurze Namen drucken sich sauber auf QR-Etiketten und sind im Feld schnell zu lesen.
:::

### Beutentypen

| Typ | Typische Verwendung |
| --- | --- |
| Zander | Weit verbreitet in Teilen Deutschlands und Mitteleuropas. |
| Dadant | Beliebt für die Honigproduktion, großer Brutraum. |
| Deutsch Normal | Ein traditioneller deutscher Standard. |
| Langstroth | Der weltweit häufigste Standard. |
| Warré | Ein vertikales Design mit geringem Eingriff. |
| Top-Bar | Horizontale, rähmchenlose Oberträger. |
| Sonstige | Alles, was oben nicht aufgeführt ist. |

Für eine ausführlichere Beschreibung jedes Standards siehe [Beutentypen](../knowledge-base/hive-types.md).

### Status

| Status | Bedeutung |
| --- | --- |
| **Aktiv** | Ein weiselrichtiges Volk im normalen Gebrauch. |
| **Ableger** | Ein kleines Startvolk, oft ein Ableger oder eine Begattungseinheit. |
| **Weisellos** | Das Volk hat seine Königin verloren und braucht Aufmerksamkeit. |
| **Verloren** | Das Volk ist eingegangen oder abgewandert. |
| **Aufgelöst** | Du hast das Volk vereinigt oder aufgelöst. |

Der Status ist eine Markierung, die du durch Bearbeiten der Beute setzt; nichts ändert ihn automatisch. Eine Beute auf **Verloren** oder **Aufgelöst** zu setzen bewahrt ihre gesamte Aufzeichnung.

## Die Beutenliste

**Beuten** listet jede Beute des Arbeitsbereichs mit ihrem Bienenstand und der Zeit seit ihrer letzten Durchsicht. Über der Liste:

- **Suche** findet Beuten nach Name, nach dem Namen des Bienenstands oder nach den ersten Zeichen des Etikettencodes, der auf dem [QR-Etikett](./qr-labels.md) steht.
- **Status** und **Standort** filtern die Liste; **Filter zurücksetzen** setzt sie zurück.
- **Sortieren nach** ordnet nach **Name**, **Standort** oder **Am längsten ohne Durchsicht**.

Namen werden so sortiert, wie du sie liest: „Beute 2“ kommt vor „Beute 10“. Eine Zeile unter den Werkzeugen sagt, wie viele Beuten angezeigt werden.

Suche, Filter und Sortierung bleiben erhalten, wenn du eine Beute öffnest und zurückkehrst. Der Eintrag **Beuten** in der Navigation öffnet immer die vollständige Liste.

## Eine Beute zwischen Bienenständen verschieben

Um eine Beute umzusiedeln, öffne sie, tippe im Kopfbereich auf **Wandern** und wähle den Ziel-Bienenstand. Die Beute behält ihren Namen, ihre Königin, ihr Foto und ihre vollständige Aufzeichnung; nur ihr Bienenstand ändert sich.

### Standort-Historie

Jeder Umzug wird als datierter Eintrag unter **Standort-Historie** am Ende der Beutenseite festgehalten, sodass du weißt, wo ein Volk zu welchem Zeitpunkt war. Nützlich für die Rückverfolgung von Krankheitsexposition und für Wanderimker-Aufzeichnungen.

:::caution
In vielen Regionen unterliegt das Verbringen von Beuten zwischen Standorten Bienengesundheits- und Verbringungsvorschriften, besonders innerhalb von Seuchenbekämpfungszonen. Prüfe deine nationalen oder lokalen Vorgaben, bevor du Völker umsiedelst. Siehe [Krankheiten und Schädlinge](../knowledge-base/diseases-and-pests.md).
:::

## Die Beutenseite

Eine Beute zu öffnen gibt dir einen Bildschirm mit allem über dieses Volk.

### Kopfbereich und Aktionen

Der Kopfbereich zeigt das Foto, den Namen sowie Status und Typ. Daneben stehen die beiden Dinge, die du im Feld am häufigsten tust, **Durchsicht erfassen** und **Wandern**, sowie ein Menü **Mehr** mit:

- **Stockkarte**: eine druckbare Tabelle aller Durchsichten (mit einem Button **Drucken**).
- **Entwicklung**: Diagramme der bei Durchsichten erfassten Werte (besetzte Waben, Brutwaben, Futtervorrat, Schwarmzellen, Sanftmut, Wabensitz, Varroa, Stockgewicht, Fütterung, jüngste Larve, Temperatur und Luftfeuchte) plus Honigernten im Zeitverlauf. Bewertungen wie Futtervorrat und Sanftmut werden als benannte Stufen gezeichnet, mit der besten oben, Temperaturen unter null werden dargestellt, und Varroa erscheint nur dort im Diagramm, wo der Eintrag eine reine Zahl ist.
- **Beute bearbeiten**, **QR-Code** (zeigt das Etikett der Beute mit den Buttons **Drucken** und **SVG**; siehe [QR-Etiketten](./qr-labels.md)) und **Beute löschen**.

### Letzte Werte

Unter dem Kopfbereich zeigen Pills die bei der jüngsten Durchsicht erfassten Werte: besetzte Waben, Brutwaben, Schwarmzellen, Stockgewicht und Varroa. Ein Tipp auf eine Pill öffnet das passende Diagramm unter **Entwicklung**.

### Königin

Die Karte **Königin** zeigt Jahr, Nummer, Markierungsfarbe, Herkunft und Kommentar, mit **Königin ersetzen** (oder **Königin einsetzen**, wenn keine erfasst ist) sowie Aktionen, um ihren Eintrag zu bearbeiten oder zu löschen. **Königinnen-Historie** listet frühere Königinnen mit Einsetz- und Ersetzungsdatum. Siehe [Königinnen](./queens.md).

### Durchsichten

**Durchsicht erfassen** öffnet das Durchsichtsformular. Die fünf jüngsten Durchsichten sind aufgeführt, die neueste zuerst, jeweils mit Datum, Wetter, Chips, die das Erfasste zusammenfassen (Königin gesehen, Waben, Futter, Schwarmzellen, Sanftmut, Fütterung, Gewicht, Honig, Temperatur, Luftfeuchte, Varroa), der Notiz und etwaigen Fotos (ein Tipp auf eines öffnet die Ansicht). Gewichte und Temperaturen erscheinen in den Einheiten, die unter **Einstellungen → Anzeige → Einheiten** gewählt sind. Jede Durchsicht hat Aktionen zum Bearbeiten und Löschen. **Alle N Durchsichten ansehen** öffnet das vollständige Protokoll. Siehe [Durchsichten](./inspections.md).

### Honig und Behandlungen

**Honig** zeigt die Erntesumme der Beute in seiner Überschrift und listet jede Ernte (**Ernte erfassen**). **Behandlungen** listet jede Behandlung (**Behandlung erfassen**) und druckt das Bestandsbuch (**Bestandsbuch drucken**). Ernten und Behandlungen lassen sich wie Durchsichten bearbeiten und löschen. Siehe [Ernten](./harvests.md) und [Behandlungen](./treatments.md).

## Löschen gegenüber Stilllegen einer Beute

Ändere den **Status** einer Beute, statt sie zu löschen. Ein Volk auf **Verloren** oder **Aufgelöst** zu setzen bewahrt seine Historie für Jahresvergleiche und Rückverfolgbarkeit. Lösche eine Beute nur, wenn sie versehentlich angelegt wurde; die App fragt nach einer Bestätigung, und die Beute verschwindet mit allen ihren Aufzeichnungen.

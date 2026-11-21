---
sidebar_position: 2
title: "Bienenstände"
---

# Bienenstände

Ein **Bienenstand** (in der App **Standort**) ist ein Ort, an dem du Bienen hältst: dein Garten, eine Parzelle, ein Dach, ein gepachtetes Feld, ein Stand am Waldrand. In Openbeehive steht der Bienenstand ganz oben in deinen Aufzeichnungen; alles andere hängt darunter.

```text
Apiary  ->  Hive  ->  Queen
```

Jeder Bienenstand enthält eine oder mehrere Beuten, jede Beute hat ihre aktuelle (und vergangene) Königinnen, und Durchsichten, Ernten und Behandlungen hängen an einer Beute innerhalb eines Bienenstands.

## Warum Bienenstände wichtig sind

- **Kontext für deine Arbeit.** Wenn du an einem Standort ankommst, öffnest du diesen Bienenstand und siehst nur die Beuten vor dir.
- **Den Ort wiederfinden.** Koordinaten und eine Adresse helfen dir, einen abgelegenen Stand zu finden und eine Besuchsrunde zu planen.
- **Sammeldruck.** QR-Etiketten werden pro Bienenstand gedruckt, ein Etikett je Beute.

:::tip
Lege pro physischem Standort einen Bienenstand an. So bleiben Durchsichten, Ernten und Behandlungen dort gruppiert, wo du tatsächlich arbeitest.
:::

## Einen Bienenstand anlegen

Wähle in der Liste **Standorte** (oder über **+ Neu → Neuer Standort** auf der Übersicht) **Neuer Standort**. Nur ein Name ist erforderlich.

| Feld | Erforderlich | Wofür es ist |
| --- | --- | --- |
| **Name** | Ja | Eine kurze Bezeichnung, z. B. „Hausgarten" oder „Streuobststand". |
| **Adresse** | Nein | Freitext, der dir hilft, den Ort zu finden. |
| **Notiz** | Nein | Torcodes, Zugangshinweise, der Name des Grundbesitzers, Parkmöglichkeiten. |
| **Breitengrad / Längengrad** | Nein | Koordinaten in Dezimalgrad. |

Funktioniert offline; siehe [Offline und Synchronisation](./offline-and-sync.md).

### GPS-Koordinaten festlegen

Gib Breiten- und Längengrad von Hand ein oder tippe auf **Mein Standort**, um sie aus dem GPS deines Geräts zu übernehmen. Dein Browser fragt beim ersten Mal nach Erlaubnis.

Koordinaten sind Dezimalgrad, zum Beispiel Breitengrad `52.5200` und Längengrad `13.4050`. Negative Werte sind gültig: südlich des Äquators beim Breitengrad, westlich von Greenwich beim Längengrad.

:::note
„Mein Standort" erfasst, wo **du** gerade stehst. Wenn du einen abgelegenen Stand von zu Hause aus einrichtest, gib die Koordinaten ein oder korrigiere sie bei deinem nächsten Besuch.
:::

### Die Karte und die Adresssuche

Das Bienenstand-Formular enthält eine Karte mit einem verschiebbaren Pin. Gib eine Adresse ein und der Pin springt dorthin; ziehe den Pin (oder tippe auf die Karte) und das Adressfeld wird aus der Position gefüllt. Ist für die Stelle keine Adresse bekannt, werden stattdessen die Koordinaten eingetragen.

Eine Statuszeile unter der Karte zeigt, was die Suche gerade tut:

- **Adresse wird gesucht…**: Die Suche läuft.
- **Standort gesetzt**: Die Position wurde gefunden und ins Formular übernommen.
- **Keine Übereinstimmung für diese Adresse**: Setze stattdessen den Pin auf der Karte.
- **Adresssuche nicht verfügbar**: Der Suchdienst ist nicht erreichbar (womöglich bist du offline). Pin und manuelle Koordinaten funktionieren weiter.

Kartenkacheln und die Adresssuche kommen von OpenStreetMap-Diensten, sofern der Betreiber deiner Instanz keine anderen konfiguriert hat. Sie sind die einzigen externen Dienste, die die App kontaktiert: Das Anzeigen einer Karte lädt Kacheln für das Gebiet, das du dir ansiehst, und das Eingeben einer Adresse oder das Verschieben des Pins sendet diese Adresse oder Position an den Suchdienst. Ein Betreiber kann die Karte für die gesamte Instanz abschalten; das Formular hat dann nur die Koordinatenfelder. Siehe [Konfiguration](../self-hosting/configuration.md#maps).

## Beuten hinzufügen und anzeigen

Öffne einen Bienenstand, um seine Beuten mit dem Datum der jeweils letzten Durchsicht zu sehen. Von hier aus kannst du:

- **Beute hinzufügen**: Gib einen Namen ein und füge sie hinzu. Typ und Status legst du danach fest, indem du die Beute bearbeitest.
- **Eine Beute öffnen**, um ihre Königin, ihre Durchsichten, Ernten und Behandlungen zu sehen.

Siehe [Beuten](./hives.md) und [Königinnen](./queens.md).

## QR-Etiketten für den Bienenstand drucken

Der Button **QR-Etiketten** auf der Bienenstand-Seite druckt direkt von der Seite aus ein A4-Blatt mit einem Etikett je Beute des Bienenstands. Jedes Etikett kodiert einen Deep Link zu dieser Beute; beim Scannen öffnet sich Openbeehive direkt bei der Beute. Siehe [QR-Etiketten](./qr-labels.md).

## Das Bestandsbuch drucken

Wenn für Beuten des Bienenstands Behandlungen erfasst sind, druckt der Button **Bestandsbuch** das Bestandsbuch für alle zusammen in einem Dokument. Siehe [Behandlungen](./treatments.md#treatment-register).

## Bearbeiten und umorganisieren

Benenne einen Bienenstand um oder aktualisiere Adresse, Notiz und Koordinaten mit **Standort bearbeiten**. Wenn zwei Personen denselben Bienenstand bearbeiten, gewinnt je Feld die jüngste Änderung.

Wenn eine Beute an einen anderen Ort umzieht, ordne sie mit **Wandern** an der Beute dem passenden Bienenstand zu. Wanderimker können pro Standort einen Bienenstand führen und Beuten beim Wandern umziehen.

## Einen Bienenstand löschen

**Standort löschen** funktioniert nur bei einem Bienenstand ohne Beuten. Solange er noch Beuten hat, nennt die App deren Anzahl und bittet dich, sie zuerst zu verschieben oder zu löschen.

## Teilen

Bienenstände werden nicht einzeln geteilt. Alles in einem Arbeitsbereich ist für jedes Mitglied dieses Arbeitsbereichs sichtbar. Um mit jemandem an einem Bienenstand zu arbeiten, lädst du die Person also in den Arbeitsbereich ein, der ihn enthält (Einstellungen → Arbeitsbereich → Imker:in einladen). Um deine Völker zu Hause privat zu halten und trotzdem an einem Vereinsstand mitzuarbeiten, erstelle für den Verein einen eigenen Arbeitsbereich. Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md).

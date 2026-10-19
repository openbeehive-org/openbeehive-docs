---
sidebar_position: 5
title: "Durchsichten (Besuche)"
---

# Durchsichten (Besuche)

Eine Durchsicht ist die Aufzeichnung eines einzelnen Besuchs an einer Beute: was du gesehen hast, was du getan hast und alles, was erwähnenswert ist. Über eine Saison fügen sich die Besuche zu einem Bild zusammen, wie sich jedes Volk entwickelt. Funktioniert offline; siehe [Offline & Synchronisation](/using-the-app/offline-and-sync).

:::tip
Wonach du bei einem Besuch suchen solltest und wie oft du durchsehen solltest, liest du unter [Ein Volk durchsehen](/beekeeping/inspecting). Diese Seite behandelt, wie du es erfasst.
:::

## Eine Durchsicht beginnen

Öffne eine Beute (oder scanne ihr [QR-Etikett](/using-the-app/qr-labels)) und tippe über der Durchsichtenliste auf **Durchsicht erfassen**. Das Formular öffnet sich mit dem heutigen Datum.

Jedes Feld ist optional. Ein schnelles „alles in Ordnung" ohne weitere Angaben ist ein gültiger Eintrag.

## Datum und Wetter

| Feld | Hinweise |
| --- | --- |
| Datum | Standardmäßig heute; ändere es, um einen vergangenen Besuch zu erfassen. |
| Wetter | Freitext, z. B. „sonnig, 22 °C". |

## Volk & Verhalten

| Feld | Was es erfasst |
| --- | --- |
| Königin gesehen | Ob du die Königin entdeckt hast. |
| Stifte gesehen | Das schnellste Anzeichen für eine kürzlich legende Königin. |
| Verdeckelte Brut gesehen | Ob verdeckelte Arbeiterinnenbrut vorhanden ist. |
| Jüngste Larve | Alter in Tagen des jüngsten Brutstadiums, das du gefunden hast. |
| Besetzte Waben | Wie viele Waben die Bienen bedecken. |
| Brutwaben | Wie viele Waben Brut enthalten. |
| Futtervorrat | Gut, Mittel, Wenig oder Keines. |
| Schwarmzellen | Wie viele Weiselzellen du gefunden hast. |
| Sanftmut | Sehr sanft, Sanft, Normal, Nervös oder Aggressiv. |
| Wabensitz | Läuft ab, Unruhig, Ruhig oder Sehr ruhig. |
| Varroa | Freitext für deine Zählung, z. B. „3 Milben/Tag". |
| Stockgewicht | In kg, falls du die Beute wiegst. |

:::note
Das Trio „Stifte gesehen / jüngste Larve / verdeckelte Brut" bestätigt meist eine gesunde legende Königin, ohne sie jedes Mal finden zu müssen.
:::

## Tätigkeiten bei dieser Durchsicht

| Tätigkeit | Erfasst |
| --- | --- |
| Gefüttert | Gefütterte Menge, in kg. |
| Honig geerntet | Bei diesem Besuch entnommener Honig, in kg. |
| Waben gegeben / entnommen | Waben, die du eingesetzt oder entnommen hast. |
| Drohnenrahmen geschnitten | Ob du eine Drohnenbrutwabe ausgeschnitten hast (eine Maßnahme zur Varroa-Kontrolle). |
| Honigraum gegeben | Ob du einen Honigraum aufgesetzt hast. |

Für das größere Bild zum Milbenmanagement und zur Ernte siehe [Varroa](/beekeeping/varroa) und [Honigernte](/beekeeping/honey-harvest). Honig, den du zum Abfüllen abnimmst, wird separat als [Ernte](/using-the-app/harvests) erfasst, mit Sorte, Wassergehalt und Chargennummer.

## Klima

| Feld | Einheit |
| --- | --- |
| Temperatur im Stock | °C |
| Außentemperatur | °C |
| Luftfeuchte im Stock | % |
| Außenluftfeuchte | % |

Alle vier sind optional. Mit der Zeit erscheinen sie in den Diagrammen unter **Entwicklung** der Beute zusammen mit Gewicht und Volksstärke.

:::tip
Eine Stockwaage oder ein Klimasensor kann diese Felder über die API senden; jeder Messwert wird zu einer Durchsicht an der Beute und synchronisiert auf deine Geräte. Siehe [Automatische Tracker](/using-the-api/automated-trackers).
:::

## Notiz und Fotos

Füge eine **Notiz** als Freitext für alles hinzu, was die strukturierten Felder nicht abdecken: eine markierte Nachschaffungszelle, eine Wesensart, die im Auge behalten werden muss, eine Erinnerung zum Umweiseln.

**Foto hinzufügen** hängt ein oder mehrere Bilder an (Brutmuster, Krankheitsverdacht, Weiselzellen). Sie werden mit dem Besuch gespeichert und synchronisieren mit dem Rest deiner Aufzeichnungen. Wenn etwas nachverfolgt werden muss, lege eine [Aufgabe](/using-the-app/tasks) mit Fälligkeitsdatum an.

## Die Durchsichtenliste

Jeder Besuch wird aufbewahrt. Die Beutenseite zeigt die fünf jüngsten Durchsichten, die neueste zuerst, jeweils als Chips zusammengefasst; **Alle N Durchsichten ansehen** öffnet das vollständige Protokoll, und **Stockkarte** druckt alle Durchsichten als Tabelle.

Das Protokoll lässt dich Trends erkennen: Brut, die sich im Frühjahr aufbaut, Vorräte, die vor dem Winter zur Neige gehen, eine steigende Varroa-Zahl. Durchsichten werden immer nur hinzugefügt, die Synchronisation über Geräte hinweg überschreibt also nie eine.

## Tipps für schnelle Feldeingabe

- **Scanne das QR-Etikett**, um die richtige Beute ohne Scrollen zu öffnen.
- **Erfasse unterwegs.** Tippe Felder zwischen den Waben an, statt hinterher alles zu rekonstruieren.
- **Verlass dich auf das schnelle Trio.** Stifte gesehen, jüngste Larve und verdeckelte Brut bestätigen eine legende Königin schneller, als sie aufzuspüren.
- **Halte Notizen kurz.** Wirf jetzt eine kurze Notiz hin; ergänze sie zu Hause.
- **Lass Lücken.** Erfasse nur, was du geprüft hast.
- **Fotografiere das Zweifelhafte.** Ein Bild eines auffälligen Brutmusters ist mehr wert als eine getippte Beschreibung.

:::caution
Wenn du eine anzeigepflichtige Krankheit wie die Amerikanische oder Europäische Faulbrut vermutest, fotografiere sie, mach zu und befolge deine örtlichen Meldevorschriften. Siehe [Krankheiten & Schädlinge](/knowledge-base/diseases-and-pests).
:::

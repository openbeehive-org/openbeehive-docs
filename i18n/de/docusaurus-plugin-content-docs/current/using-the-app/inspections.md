---
sidebar_position: 5
title: "Durchsichten (Besuche)"
---

# Durchsichten (Besuche)

Eine Durchsicht ist die Aufzeichnung eines einzelnen Besuchs an einer Beute: was du gesehen hast, was du getan hast und alles, was erwähnenswert ist. Über eine Saison fügen sich die Besuche zu einem Bild zusammen, wie sich jedes Volk entwickelt. Funktioniert offline; siehe [Offline & Synchronisation](./offline-and-sync.md).

:::tip
Wonach du bei einem Besuch suchen solltest und wie oft du durchsehen solltest, liest du unter [Ein Volk durchsehen](../beekeeping/inspecting.md). Diese Seite behandelt, wie du es erfasst.
:::

## Eine Durchsicht beginnen

Öffne eine Beute (oder scanne ihr [QR-Etikett](./qr-labels.md)) und tippe im Kopfbereich auf **Durchsicht erfassen**. Das Formular öffnet sich mit dem heutigen Datum, und **Speichern** bleibt beim Scrollen am unteren Bildschirmrand in Reichweite.

Jedes Feld ist optional. Ein schnelles „alles in Ordnung" ohne weitere Angaben ist ein gültiger Eintrag.

### Leer ist nicht null

Zahlenfelder sind anfangs leer. Lass ein Feld leer, wenn du nicht nachgesehen hast; gib `0` ein, wenn du nachgesehen und nichts gefunden hast. „Schwarmzellen: 0“ ist eine Beobachtung, ein leeres Feld ist keine. Die Zählfelder haben die Buttons **−** und **+**, sodass du sie auch mit Handschuhen eingeben kannst.

### Von letzter Durchsicht ausgehen

Hat die Beute eine frühere Durchsicht, füllt **Von letzter Durchsicht ausgehen** (mit dem Datum dieser Durchsicht) aus, was sich meist wenig ändert: besetzte Waben, Brutwaben, Futtervorrat, Sanftmut und Wabensitz. Passe an, was heute anders ist. Felder, die die letzte Durchsicht leer gelassen hat, bleiben leer.

## Datum und Wetter

| Feld | Hinweise |
| --- | --- |
| Datum | Standardmäßig heute; ändere es, um einen vergangenen Besuch zu erfassen. Zukünftige Daten werden nicht angenommen. |
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
| Varroa | Milben pro Tag. Gib eine reine Zahl wie `3` ein, wenn du sie in den Diagrammen haben möchtest; anderer Text bleibt erhalten, erscheint aber nicht im Diagramm. |
| Stockgewicht | In kg, falls du die Beute wiegst. |

:::note
Das Trio „Stifte gesehen / jüngste Larve / verdeckelte Brut" bestätigt meist eine gesunde legende Königin, ohne sie jedes Mal finden zu müssen.
:::

## Tätigkeiten bei dieser Durchsicht

Dieser Abschnitt ist anfangs eingeklappt; tippe auf seine Überschrift, um ihn zu öffnen.

| Tätigkeit | Erfasst |
| --- | --- |
| Gefüttert | Gefütterte Menge, in kg. |
| Waben gegeben / entnommen | Waben, die du eingesetzt oder entnommen hast. |
| Drohnenrahmen geschnitten | Ob du eine Drohnenbrutwabe ausgeschnitten hast (eine Maßnahme zur Varroa-Kontrolle). |
| Honigraum gegeben | Ob du einen Honigraum aufgesetzt hast. |

Honig wird nicht mehr im Durchsichtsformular erfasst. Erfasse ihn als [Ernte](./harvests.md), mit Sorte, Wassergehalt und Chargennummer. Mengen unter „Honig geerntet“, die frühere Versionen bei Durchsichten eingetragen haben, werden weiterhin angezeigt.

Für das größere Bild zum Milbenmanagement und zur Ernte siehe [Varroa](../beekeeping/varroa.md) und [Honigernte](../beekeeping/honey-harvest.md).

## Klima

Auch dieser Abschnitt ist anfangs eingeklappt.

| Feld | Einheit |
| --- | --- |
| Temperatur im Stock | °C |
| Außentemperatur | °C |
| Luftfeuchte im Stock | % |
| Außenluftfeuchte | % |

Alle vier sind optional. Mit der Zeit erscheinen sie in den Diagrammen unter **Entwicklung** der Beute zusammen mit Gewicht und Volksstärke.

:::tip
Eine Stockwaage oder ein Klimasensor kann diese Felder über die API senden. Solche Messwerte werden als Sensormessungen gekennzeichnet; siehe [Sensormessungen](#sensor-readings) unten und [Automatische Tracker](../using-the-api/automated-trackers.md).
:::

## Notiz und Fotos

Füge eine **Notiz** als Freitext für alles hinzu, was die strukturierten Felder nicht abdecken: eine markierte Nachschaffungszelle, eine Wesensart, die im Auge behalten werden muss, eine Erinnerung zum Umweiseln.

**Foto hinzufügen** hängt ein oder mehrere Bilder an (Brutmuster, Krankheitsverdacht, Weiselzellen). Sie werden mit dem Besuch gespeichert und synchronisieren mit dem Rest deiner Aufzeichnungen. Wenn etwas nachverfolgt werden muss, lege eine [Aufgabe](./tasks.md) mit Fälligkeitsdatum an.

## Die Durchsichtenliste

Die Beutenseite zeigt die fünf jüngsten Durchsichten, die neueste zuerst, jeweils als Chips zusammengefasst; **Alle N Durchsichten ansehen** öffnet das vollständige Protokoll, und **Mehr → Stockkarte** druckt alle Durchsichten als Tabelle.

Das Protokoll lässt dich Trends erkennen: Brut, die sich im Frühjahr aufbaut, Vorräte, die vor dem Winter zur Neige gehen, eine steigende Varroa-Zahl.

## Eine Durchsicht korrigieren oder löschen \{#correcting}

Jede Durchsicht im Protokoll hat eine Aktion zum Bearbeiten und eine zum Löschen.

- **Durchsicht bearbeiten** öffnet das Formular mit den gespeicherten Werten. Ändere, was falsch war, auch das Datum, und speichere. Korrigieren zwei Geräte dieselbe Durchsicht, gewinnt je Feld die jüngste Änderung.
- **Löschen** fragt nach einer Bestätigung, die das Datum der Durchsicht nennt. Danach bietet eine Leiste ein paar Sekunden lang **Rückgängig** an. Das Löschen einer Durchsicht entfernt sie auch aus der Historie und den Diagrammen der Beute.

## Sensormessungen \{#sensor-readings}

Messwerte, die eine Waage oder ein Sensor über die API sendet, werden als Durchsichten gespeichert, die als **Sensormessung** gekennzeichnet sind. Sie würden die Durchsichten, die du selbst gemacht hast, überschwemmen, deshalb:

- listet die Beutenseite nur Durchsichten, die eine Person erfasst hat, ebenso das vollständige Protokoll, bis du dort **Sensormessungen anzeigen** anhakst (die Beschriftung nennt ihre Anzahl),
- ignorieren „Letzte Durchsicht“, die Beutenliste und die Liste der fälligen Durchsichten auf der Übersicht sie,
- beziehen die Diagramme unter **Entwicklung** sie ein.

## Tipps für schnelle Feldeingabe

- **Scanne das QR-Etikett**, um die richtige Beute ohne Scrollen zu öffnen.
- **Erfasse unterwegs.** Tippe Felder zwischen den Waben an, statt hinterher alles zu rekonstruieren.
- **Verlass dich auf das schnelle Trio.** Stifte gesehen, jüngste Larve und verdeckelte Brut bestätigen eine legende Königin schneller, als sie aufzuspüren.
- **Halte Notizen kurz.** Wirf jetzt eine kurze Notiz hin; ergänze sie zu Hause.
- **Lass Lücken.** Erfasse nur, was du geprüft hast.
- **Fotografiere das Zweifelhafte.** Ein Bild eines auffälligen Brutmusters ist mehr wert als eine getippte Beschreibung.

:::caution
Wenn du eine anzeigepflichtige Krankheit wie die Amerikanische oder Europäische Faulbrut vermutest, fotografiere sie, mach zu und befolge deine örtlichen Meldevorschriften. Siehe [Krankheiten & Schädlinge](../knowledge-base/diseases-and-pests.md).
:::

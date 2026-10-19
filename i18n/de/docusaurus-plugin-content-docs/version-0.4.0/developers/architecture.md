---
sidebar_position: 1
title: "Offline-first-Architektur"
---

# Offline-first-Architektur

Openbeehive ist so konzipiert, dass Imkerei draußen am Bienenstand stattfindet, oft weit entfernt von jeglichem Empfang. Jedes Gerät trägt eine vollständige Kopie der benötigten Daten, die Oberfläche liest und schreibt diese lokale Kopie sofort, und ein Hintergrundmodul hält im Stillen alles mit dem Server im Gleichschritt, sobald eine Verbindung verfügbar ist.

Diese Seite erklärt, wie die einzelnen Teile zusammenpassen. Die genauen Regeln, die Replikate konsistent halten, findest du im [Sync-Protokoll](/developers/sync-protocol) und unter [Historie und Ereignisse](/developers/history-and-events).

## Local-first von Grund auf

Die zentrale Idee ist einfach: Das Gerät ist die Quelle der Wahrheit für die Arbeit, die du gerade jetzt erledigst.

- Jedes Gerät hält seine eigene Datenbank. Die Web-App (eine SvelteKit-PWA) betreibt eine eingebettete, nach WebAssembly kompilierte SQLite-Datenbank (SQLite-WASM), gestützt auf das Origin Private File System (OPFS) des Browsers für dauerhaften, privaten Speicher.
- Die Benutzeroberfläche liest und schreibt ausschließlich aus der lokalen Datenbank. Es gibt keinen Netzwerkaufruf auf dem kritischen Pfad, sodass das Öffnen eines Bienenstocks, das Erfassen einer Durchsicht oder das Abhaken einer Aufgabe sofort geschieht und auch ganz ohne Empfang funktioniert.
- Ein separates Hintergrundmodul kümmert sich um das Netzwerk. Es schiebt lokale Änderungen zum Server hinauf und holt entfernte Änderungen herunter, wobei es beide abgleicht, ohne die Oberfläche jemals zu blockieren.

Da die lokale Datenbank stets verfügbar ist, verhält sich die App gleich, egal ob du online, offline oder auf einer wackeligen Mobilverbindung mitten in einer Obstplantage bist.

## Der Datenfluss

Das folgende Diagramm zeigt, wie eine Änderung von einer Berührung in der Oberfläche hinaus zum Server und zurück zu anderen Geräten wandert.

```text
        Device A                          Server                       Device B
   +----------------+               +----------------+            +----------------+
   |   SvelteKit UI |               |   Go backend   |            |   SvelteKit UI |
   |  (reads/writes |               | (Connect-RPC:  |            |  (reads/writes |
   |    locally)    |               |  gRPC + JSON)  |            |    locally)    |
   +-------+--------+               +-------+--------+            +--------+-------+
           | read/write                     |                              | read/write
           v                                |                              v
   +----------------+                       |                     +----------------+
   | SQLite-WASM    |                       |                     | SQLite-WASM    |
   |   on OPFS      |                       |                     |   on OPFS      |
   +-------+--------+                       |                     +--------+-------+
           |                                |                              |
           |  Sync engine                   |                  Sync engine |
           |  (Push / Pull)                 |                              |
           +-----> Push changes ----------->|                              |
           |                                | store + order by HLC          |
           |<----- Pull changes ------------|                              |
                                            |------> Push changes <---------+
                                            |------- Pull changes --------->|
   scope: only apiaries the user can see (partial replication)
```

Das Sync-Modul tauscht nur die Datensätze aus, die zu den Bereichen (Scopes) gehören, auf die ein Nutzer Zugriff hat, sodass ein Gerät niemals die ganze Welt herunterlädt: nur die Bienenstände, zu denen es berechtigt ist.

Skripte und Sensoren treten über die CRUD-Dienste des Servers in dasselbe Bild ein ([Die API verwenden](/using-the-api/overview)). Deren Schreibvorgänge umgehen diesen Fluss nicht: Der Server wendet jeden mit demselben feldweisen Merge an und hängt ihn an dasselbe Änderungsprotokoll an wie eine gepushte Änderung, sodass ein von einer Stockwaage gesendeter Messwert einfach eine weitere Änderung ist, die die Geräte bei ihrem nächsten Sync abholen.

## Konfliktauflösung

Zwei Geräte können denselben Bienenstock bearbeiten, während beide offline sind. Wenn sie sich wieder verbinden, führt Openbeehive ihre Änderungen deterministisch zusammen, ohne manuelle Konfliktabfragen. Drei Techniken machen dies konfliktfrei.

### Hybrid Logical Clocks (HLC)

Jede Änderung wird mit einem Hybrid-Logical-Clock-Wert versehen, der die Echtzeituhr mit einem logischen Zähler und einer Knotenkennung kombiniert. HLC verleiht jeder Änderung über jedes Gerät hinweg eine vollständige, kausal konsistente Reihenfolge, selbst wenn Geräteuhren auseinanderdriften. Diese Ordnung ist die Grundlage für die nachstehenden Regeln.

### Feldweises Last-Writer-Wins für Skalare

Für einfache Skalarfelder, etwa den Namen oder Typ eines Bienenstocks oder die Markierungsfarbe einer Königin, gewinnt der Wert mit der höchsten HLC. Das Zusammenführen erfolgt pro Feld, nicht pro Datensatz, sodass zwei Personen, die unterschiedliche Felder desselben Bienenstocks bearbeiten, beide ihre Änderungen behalten.

### OR-Sets für Listenfelder

Listenartige Felder (derzeit nur die Foto-Schlüssel einer Durchsicht) verwenden eine Observed-Remove-Menge (OR-Set) mit Add-wins-Semantik. Gleichzeitige Hinzufügungen überleben alle, und eine Entfernung wirkt nur gegen die konkreten Einträge, die sie beobachtet hat. Damit wird das klassische Problem vermieden, bei dem die Hinzufügung einer Person die einer anderen stillschweigend löscht.

### Append-only-Ereignisse

Die Tabelle `event` ist per Konvention append-only: Jeder Historien-Schreibvorgang fügt eine neue Zeile mit frischer ID ein, und nichts bearbeitet oder löscht eine, sodass zwei Geräte, die offline Ereignisse hinzufügen, nie dieselbe Zeile berühren. Einzelheiten dazu findest du unter [Historie und Ereignisse](/developers/history-and-events).

:::tip
Da Zusammenführungen deterministisch sind, berechnen zwei beliebige Geräte, die denselben Satz von Änderungen gesehen haben, stets genau dasselbe Ergebnis, unabhängig von der Reihenfolge, in der diese Änderungen eingetroffen sind.
:::

## Teilen und partielle Replikation

Das Teilen in Openbeehive geschieht auf der Ebene des Bienenstands über **Scopes**. Ein Scope gewährt einem Nutzer Zugriff auf einen bestimmten Bienenstand und alles darunter: seine Bienenstöcke, Königinnen, Durchsichten, Aufgaben, Ereignisse, Ernten und Behandlungen.

Die Synchronisierung ist passend dazu eingegrenzt. Ein Gerät repliziert nur die Daten innerhalb der Scopes, die sein Nutzer sehen darf, ein Modell, das als partielle Replikation bekannt ist. Das hält lokale Datenbanken klein und fokussiert, begrenzt, was über das Netzwerk geht, und bedeutet, dass ein Mitglied am Bienenstand eines Vereins niemals Daten von Bienenständen erhält, an denen es keinen Anteil hat.

Wenn ein neuer Scope gewährt wird, bringt der nächste Pull die Historie dieses Bienenstands herunter; wird der Zugriff entzogen, hören diese Datensätze auf zu synchronisieren.

## Mobile-first-PWA

Die App ist eine Progressive Web App, in erster Linie für das Telefon in deiner Tasche am Bienenstand entworfen.

- Ein **Service Worker** speichert die Anwendungshülle und Assets zwischen, sodass die App sofort lädt und nach dem ersten Besuch vollständig offline läuft.
- **SQLite-WASM auf OPFS** stellt eine echte relationale Datenbank im Browser bereit, mit dauerhaftem, origin-privatem Speicher, der Neuladevorgänge übersteht.
- Die App ist auf dem Startbildschirm installierbar und verhält sich wie eine native App, einschließlich des QR-Scan-Ablaufs, der die App bei einem bestimmten Bienenstock öffnet.

## Wie es zusammenpasst

| Schicht | Technologie | Verantwortung |
| --- | --- | --- |
| Oberfläche | SvelteKit-PWA | Liest und schreibt die lokale Datenbank; blockiert nie auf das Netzwerk |
| Lokaler Speicher | SQLite-WASM auf OPFS | Dauerhafte Quelle der Wahrheit auf dem Gerät |
| Sync-Modul | Hintergrund-Push / -Pull | Gleicht lokale und entfernte Änderungen über HLC, LWW, OR-Sets ab |
| Backend | Go, Connect-RPC | Speichert und ordnet Änderungen; erzwingt Scopes; bedient Pulls |
| Speicher | Austauschbare Datenbank- und Blob-Backends | Persistiert Daten und Medien auf dem Server |

Diese Trennung verleiht Openbeehive sein Kernversprechen: Die Aufzeichnungen sind immer bei dir, immer schnell und immer konsistent, sobald alle wieder in Reichweite sind.

Um tiefer einzusteigen, lies das [Sync-Protokoll](/developers/sync-protocol) und [Historie und Ereignisse](/developers/history-and-events), oder durchstöbere den Rest der [Entwicklerdokumentation](/category/developers).

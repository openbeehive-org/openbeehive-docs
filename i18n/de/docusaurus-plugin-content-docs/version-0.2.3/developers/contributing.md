---
sidebar_position: 7
title: "Mitwirken & Dev-Setup"
---

# Mitwirken & Dev-Setup

Openbeehive ist freie, quelloffene Software, und wir freuen uns über Beiträge
jeder Größe - vom Beheben eines Tippfehlers bis zum Bau einer neuen Funktion.
Diese Seite bringt dich von einem frischen Clone zu einer laufenden
Entwicklungsumgebung und erklärt dann die Konventionen, die die Codebasis gesund
halten.

Das Projekt ist unter **AGPL-3.0** lizenziert. Mit deinem Beitrag erklärst du
dich einverstanden, dass deine Arbeit unter derselben Lizenz veröffentlicht wird.

:::tip Wo anfangen
Durchstöbere die offenen Issues auf GitHub und lies die `CONTRIBUTING.md` im
Haupt-Repository, bevor du einen Pull Request öffnest. Kleine, fokussierte PRs
sind viel leichter zu prüfen und zu mergen.
:::

## Die Repositories

Openbeehive ist auf einige Repositories unter
[github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app) aufgeteilt:

| Repository | Was es enthält |
| --- | --- |
| `openbeehive` | Die Anwendung: Go-Backend und SvelteKit-PWA-Frontend |
| `openbeehive-site` | Die Marketing-Website unter openbeehive.org |
| `openbeehive-docs` | Diese Dokumentations-Website (Docusaurus) |

Die meisten Codebeiträge landen im Haupt-Repository `openbeehive`.
Dokumentationsänderungen gehören in `openbeehive-docs`.

## Voraussetzungen

Du benötigst:

- **Go 1.25+** - für das Backend
- **Node 22+** - für das SvelteKit-Frontend
- **buf** - zum Generieren von Code aus den Protocol-Buffer-Definitionen

Ein funktionierendes `make` wird vorausgesetzt (jedes aktuelle GNU Make). Unter
Windows empfehlen wir WSL2.

## Einrichten

Klone das Repository und generiere zuerst den Protobuf-Code, starte dann den
Server und die App in zwei separaten Terminals.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate Go + TypeScript code from the .proto files
make proto

# Terminal 1 - run the Go backend
make run-server

# Terminal 2 - run the SvelteKit app in dev mode
make dev-app
```

`make run-server` liest seine Konfiguration aus deiner Umgebung (oder einer
`.env`-Datei). Für die lokale Entwicklung funktionieren die Vorgaben
out-of-the-box: eine SQLite-Datenbank und das lokale Dateisystem für Blobs. Die
vollständige Liste der Variablen findest du unter
[Konfiguration](/self-hosting/configuration).

Für ein Einzelentwickler-Setup kannst du `BEEHIVE_OIDC_PROVIDERS` leer lassen und
`BEEHIVE_WEBAUTHN_ENABLED=false` setzen, um das Login ganz zu überspringen.

:::note Aus dem Quellcode bauen
Um ein Release-Binary statt eines Dev-Servers zu erzeugen, führe `make proto && make
build` aus, was `./server/bin/openbeehive` schreibt. Deployment-Details findest
du unter [Einzelnes Binary](/self-hosting/single-binary).
:::

## Architektur in einer Minute

Wenn du neu in der Codebasis bist, überfliege zuerst
[Architektur](/developers/architecture) und das
[Datenmodell](/developers/data-model). Die Kurzfassung:

- Das Frontend ist **offline-first**. Es besitzt eine lokale SQLite-WASM-Datenbank
  (in OPFS gespeichert) und ist ohne Netzwerkverbindung voll nutzbar.
- Änderungen synchronisieren im Hintergrund mit dem Server über
  [Hybrid Logical Clocks und CRDTs](/developers/sync-protocol), sodass gleichzeitige
  Bearbeitungen ohne Konflikte zusammengeführt werden.
- Die API ist mit **Connect-RPC** definiert (gRPC und HTTP/JSON), generiert aus
  `.proto`-Dateien.

## Zentrale Konventionen

Diese Konventionen sind wichtig für die Korrektheit, nicht nur für den Stil.
Bitte befolge sie.

### 1. Die `.proto`-Dateien sind die Quelle der Wahrheit

Die API-Oberfläche, Message-Gestalten und Enums sind alle in Protocol Buffers
definiert. Bearbeite generierten Code niemals von Hand. Ändere das `.proto`,
führe `make proto` aus und lass das generierte Go und TypeScript folgen.

### 2. Schreibvorgänge gehen durch das lokale Repository, nicht CRUD

Der Client ruft den Server **nicht** auf, um Datensätze direkt zu erstellen oder
zu aktualisieren. Stattdessen gehen alle Schreibvorgänge durch die lokale
Repository-Schicht, die die Änderung lokal erfasst und das Sync-Modul sie
verbreiten lässt. Das ist es, was die App sofort und offlinefähig macht.

:::caution
Wenn du einen Schreibpfad hinzufügst, der direkt mit dem Server spricht, brichst
du die Offline-Unterstützung und umgehst die Zusammenführungslogik. Leite jeden
Schreibvorgang durch das lokale Repo.
:::

### 3. Halte `merge.go` und `merge.ts` synchron

Die Zusammenführungsregeln - feldweises Last-Writer-Wins für Skalare,
Add-wins-OR-Sets für Listenfelder, append-only-Ereignisse - sind **zweimal**
implementiert: einmal auf dem Server (`merge.go`) und einmal auf dem Client
(`merge.ts`). Sie müssen sich identisch verhalten.

Jede Änderung an der Zusammenführungssemantik muss in beiden Dateien vorgenommen
werden, mit passenden Tests. Eine Abweichung hier führt dazu, dass Daten auf
Client und Server unterschiedlich zusammengeführt werden, was ein schwerwiegender
Fehler ist. Die Regeln findest du im [Sync-Protokoll](/developers/sync-protocol).

### 4. Schreibe portables SQL

Das Backend unterstützt **PostgreSQL, MySQL und SQLite** als austauschbare
Datenbanken. Halte SQL über alle drei portabel - vermeide engine-spezifische
Syntax und teste Schemaänderungen wo möglich gegen mehr als einen Treiber. Siehe
[Datenbanken](/self-hosting/databases).

### 5. Englisch im Code, Übersetzungen für Nutzer

Schreibe allen Code, Kommentare, Bezeichner und Commit-Nachrichten auf
**Englisch**.

Alles jedoch, was ein Nutzer sieht, muss übersetzbar sein. Wenn du eine
nutzersichtbare Zeichenkette hinzufügst oder änderst, stelle Übersetzungen für
alle unterstützten Sprachen bereit:

| Sprache (Locale) | Sprache |
| --- | --- |
| `en` | Englisch |
| `de` | Deutsch |
| `fr` | Französisch |
| `es` | Spanisch |
| `it` | Italienisch |

Wenn du dir bei einer Sprache nicht sicher bist, füge den englischen Text hinzu
und markiere ihn in deinem PR, damit ein Muttersprachler helfen kann.

## Einen Pull Request öffnen

1. Forke das Repository und erstelle einen Branch für deine Änderung.
2. Stelle sicher, dass `make proto` ausgeführt wurde, falls du ein `.proto` berührt hast.
3. Führe die Testsuite und die Linter lokal aus.
4. Halte den PR fokussiert und beschreibe, was er ändert und warum.
5. Bei Änderungen an Zusammenführungslogik, Sync oder Schema weise ausdrücklich
   darauf hin, damit Reviewer wissen, dass sie genau hinschauen müssen.

Lies die vollständigen Richtlinien in
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md).

Danke, dass du hilfst, Imkereiaufzeichnungen für alle besser zu machen. Wenn du
nicht weiterkommst, eröffne eine Diskussion oder ein Issue auf GitHub - wir
helfen gern.

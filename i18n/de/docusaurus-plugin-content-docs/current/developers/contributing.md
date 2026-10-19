---
sidebar_position: 7
title: "Mitwirken & Dev-Setup"
---

# Mitwirken & Dev-Setup

Openbeehive ist unter **AGPL-3.0** lizenziert. Mit deinem Beitrag erklärst du
dich einverstanden, dass deine Arbeit unter derselben Lizenz veröffentlicht wird.
Lies
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md)
im App-Repository, bevor du einen Pull Request öffnest.

## Die Repositories

| Repository | Inhalt |
| --- | --- |
| [`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) | Die Anwendung: Proto-Vertrag, Go-Backend, SvelteKit-PWA |
| [`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site) | Die Marketing-Website unter openbeehive.org |
| [`openbeehive-docs`](https://github.com/openbeehive-org/openbeehive-docs) | Diese Dokumentations-Website (Docusaurus) |

## Voraussetzungen

- **Go 1.27+** für das Backend (die genaue Version ist die `go`-Zeile in `server/go.mod`)
- **Node 24+** für die SvelteKit-App (`app/.nvmrc` nennt die Version, mit der das Image baut)
- **buf** und die anderen Gate-Tools: `make tools` installiert die gepinnten Versionen nach `$(go env GOPATH)/bin`
- [prek](https://github.com/j178/prek) für die Git-Hooks, GNU Make; unter Windows nutze WSL2

## Einrichten

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

make tools        # pinned golangci-lint, govulncheck, go-licenses, fleetlint, buf
prek install      # git hooks: formatters and linters on commit, make check on push
make proto        # generate Go + TypeScript stubs from proto/
make run-server   # terminal 1: Go backend on :8080 (loads .env if present)
make dev-app      # terminal 2: Vite dev server on :5173
```

`make check` ist die Definition von grün und genau das, was CI ausführt: Proto-Lint
und Breaking-Change-Prüfung, Lint (golangci-lint, go vet, prettier, eslint,
svelte-check), Tests, Coverage-Gates, Audit (govulncheck, Lizenzen, npm
audit, gitleaks), Build und fleetlint. `make check-fast` ist die schnelle Teilmenge,
die der Pre-Commit-Hook ausführt; `make help` listet jedes Target auf.

`make run-server` liest seine Konfiguration aus der Umgebung oder einer
`.env`-Datei im Repo-Root (kopiere `.env.example`). Die Vorgaben geben dir
SQLite und Blobs im Dateisystem; lass `BEEHIVE_PASSWORD_AUTH` aus,
`BEEHIVE_OIDC_PROVIDERS` leer und `BEEHIVE_WEBAUTHN_ENABLED=false`, um ohne
Login zu arbeiten. Siehe [Konfiguration](/self-hosting/configuration).

Für ein Release-Binary: `make proto && make build` schreibt
`server/bin/openbeehive` mit eingebetteter SPA. Siehe
[Einzelnes Binary](/self-hosting/single-binary).

## Generierter Code

`make proto` führt `buf generate` mit der `buf.gen.yaml` des Repos aus:

| Ausgabe | Plugins |
| --- | --- |
| `server/internal/gen/` | `protocolbuffers/go`, `connectrpc/go` |
| `app/src/lib/proto/` | `bufbuild/es` v2 (Messages und Service-Deskriptoren) |

Beide Verzeichnisse sind gitignored. Führe `make proto` nach dem Klonen und
nach jeder `.proto`-Änderung aus; bearbeite die Ausgabe nie von Hand. Der
Docker-Build führt `buf generate` selbst in seiner ersten Stufe aus. Jeder
Dienst aus den Protos ist auf dem Server registriert; die Liste steht unter
[Die API verwenden](/using-the-api/overview).

## Konventionen

1. **Die `.proto`-Dateien sind die Quelle der Wahrheit.** Ändere den Vertrag,
   generiere neu, dann implementiere.
2. **Schreibvorgänge gehen durch das lokale Repository.** Die App schreibt
   über `app/src/lib/local/repo.ts` in ihre lokale SQLite-Datenbank und lässt
   die Sync-Engine die Änderung pushen. Füge keinen UI-Code hinzu, der die
   CRUD-Dienste (`ApiaryService`, `InspectionService`, ...) direkt aufruft;
   sie gibt es für Skripte und Integrationen, und ein UI-Aufruf würde die
   lokale Datenbank und die Outbox überspringen, sodass die Änderung offline
   nicht sichtbar wäre.
3. **Halte `merge.go` und `merge.ts` identisch.** Feldweises Last-Writer-Wins
   und das Add-wins-OR-Set sind in `server/internal/sync/merge.go` und
   `app/src/lib/local/merge.ts` implementiert. Ändere beide, mit Tests. Siehe
   [Sync-Protokoll](/developers/sync-protocol).
4. **Schreibe portables SQL.** Der Server läuft auf PostgreSQL, MySQL und
   SQLite. Migrationen nutzen die portable Teilmenge, die am Anfang von
   `0001_init.sql` beschrieben ist; der Store übersetzt die verbleibenden
   Dialektunterschiede. Siehe [Datenbanken](/self-hosting/databases).
5. **Englisch im Code, Übersetzungen für Nutzer.** Code, Kommentare,
   Bezeichner und Commit-Nachrichten sind Englisch. Jede nutzersichtbare
   Zeichenkette geht durch `svelte-i18n` mit Einträgen in
   `app/src/lib/i18n/locales/{en,de,fr,es,it}.json`. Wenn du nicht übersetzen
   kannst, füge den englischen Text hinzu und sag es im PR.

## Einen Pull Request öffnen

1. Forken und einen Branch anlegen.
2. `make proto` ausführen, falls du eine `.proto` berührt hast.
3. `make check` ausführen; es ist das, was CI ausführt.
4. Den PR fokussiert halten und beschreiben, was sich ändert und warum.
5. Änderungen an Merge-Logik, Sync oder Schema ausdrücklich benennen.

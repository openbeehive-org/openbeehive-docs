---
sidebar_position: 7
title: "Contribuire e configurazione dev"
---

# Contribuire e configurazione dev

Openbeehive è rilasciato con licenza **AGPL-3.0**. Contribuendo accetti che il
tuo lavoro sia rilasciato sotto la stessa licenza. Leggi
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md)
nel repository dell'app prima di aprire una pull request.

## I repository

| Repository | Contenuto |
| --- | --- |
| [`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) | L'applicazione: contratto proto, backend Go, PWA SvelteKit |
| [`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site) | Il sito di marketing su openbeehive.org |
| [`openbeehive-docs`](https://github.com/openbeehive-org/openbeehive-docs) | Questo sito di documentazione (Docusaurus) |

## Prerequisiti

- **Go 1.27+** per il backend (la versione esatta è la riga `go` in `server/go.mod`)
- **Node 24+** per l'app SvelteKit (`app/.nvmrc` indica la versione con cui viene compilata l'immagine)
- **buf** e gli altri strumenti di gate: `make tools` installa le versioni pinnate in `$(go env GOPATH)/bin`
- [prek](https://github.com/j178/prek) per gli hook git, GNU Make; su Windows usa WSL2

## Configurazione

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

make tools        # pinned golangci-lint, govulncheck, go-licenses, fleetlint, buf
prek install      # git hooks: formatters and linters on commit, make check on push
make proto        # generate Go + TypeScript stubs from proto/
make run-server   # terminal 1: Go backend on :8080 (loads .env if present)
make dev-app      # terminal 2: Vite dev server on :5173
```

`make check` è la definizione di "verde" ed esattamente ciò che esegue la CI:
lint dei proto e controllo delle modifiche incompatibili, lint (golangci-lint,
go vet, prettier, eslint, svelte-check), test, soglie di copertura, audit
(govulncheck, licenze, npm audit, gitleaks), build e fleetlint. `make check-fast`
è il sottoinsieme rapido eseguito dall'hook di pre-commit; `make help` elenca
tutti i target.

`make run-server` legge la sua configurazione dall'ambiente o da un file
`.env` nella radice del repository (copia `.env.example`). I valori predefiniti
ti danno SQLite e blob su filesystem; lascia `BEEHIVE_PASSWORD_AUTH`
disattivato, `BEEHIVE_OIDC_PROVIDERS` vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false`
per lavorare senza login. Vedi [Configurazione](/self-hosting/configuration).

Per compilare un binario di release: `make proto && make build` scrive
`server/bin/openbeehive` con la SPA incorporata. Vedi
[Singolo binario](/self-hosting/single-binary).

## Codice generato

`make proto` esegue `buf generate` con il `buf.gen.yaml` del repository:

| Output | Plugin |
| --- | --- |
| `server/internal/gen/` | `protocolbuffers/go`, `connectrpc/go` |
| `app/src/lib/proto/` | `bufbuild/es` v2 (messaggi e descrittori dei servizi) |

Entrambe le directory sono in gitignore. Esegui `make proto` dopo il clone e
dopo ogni modifica a un `.proto`; non modificare mai l'output a mano. La build
Docker esegue `buf generate` da sola nel suo primo stage. Ogni servizio nei
proto è registrato sul server; vedi
[Utilizzo dell'API](/using-the-api/overview) per l'elenco.

## Convenzioni

1. **I file `.proto` sono la fonte di verità.** Modifica il contratto,
   rigenera, poi implementa.
2. **Le scritture passano dal repository locale.** L'app scrive nel proprio
   database SQLite locale tramite `app/src/lib/local/repo.ts` e lascia che il
   motore di sincronizzazione invii la modifica. Non aggiungere codice UI che
   chiami direttamente i servizi CRUD (`ApiaryService`, `InspectionService`,
   ...); esistono per script e integrazioni, e una chiamata dalla UI
   salterebbe il database locale e l'outbox, quindi la modifica non sarebbe
   visibile offline.
3. **Mantieni `merge.go` e `merge.ts` identici.** Il last-writer-wins per
   campo e l'OR-Set add-wins sono implementati in
   `server/internal/sync/merge.go` e `app/src/lib/local/merge.ts`. Modifica
   entrambi, con test. Vedi il
   [protocollo di sincronizzazione](/developers/sync-protocol).
4. **Scrivi SQL portabile.** Il server gira su PostgreSQL, MySQL e SQLite. Le
   migrazioni usano il sottoinsieme portabile descritto in cima a
   `0001_init.sql`; lo store traduce le restanti differenze di dialetto.
   Vedi [Database](/self-hosting/databases).
5. **Inglese nel codice, traduzioni per gli utenti.** Codice, commenti,
   identificatori e messaggi di commit sono in inglese. Ogni stringa rivolta
   all'utente passa da `svelte-i18n` con voci in
   `app/src/lib/i18n/locales/{en,de,fr,es,it}.json`.
   Se non riesci a tradurre, aggiungi il testo inglese e dillo nella PR.

## Aprire una pull request

1. Fai il fork e crea un branch.
2. Esegui `make proto` se hai toccato un `.proto`.
3. Esegui `make check`; è ciò che esegue la CI.
4. Mantieni la PR mirata e descrivi cosa cambia e perché.
5. Segnala esplicitamente le modifiche alla logica di unione, alla
   sincronizzazione o allo schema.

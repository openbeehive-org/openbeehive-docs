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

`make check` è la definizione di "verde":
lint dei proto e controllo delle modifiche incompatibili, lint (golangci-lint,
go vet, prettier, eslint, svelte-check), test, soglie di copertura, audit
(govulncheck, licenze, npm audit, gitleaks), build e fleetlint. `make check-fast`
è il sottoinsieme rapido eseguito dall'hook di pre-commit; `make help` elenca
tutti i target. `make check` esegue i test su SQLite; la CI esegue i test Go
una seconda volta su PostgreSQL e MariaDB.

### Test su ogni database

Il server gira su SQLite, PostgreSQL e MariaDB, e tutto ciò che tocca SQL, una
migrazione o il percorso di scrittura della sincronizzazione dovrebbe essere
verde su tutti e tre:

```bash
export PG_DSN='postgres://beehive:beehive@127.0.0.1:5433/beehive?sslmode=disable'
export MARIADB_DSN='root:beehive@tcp(127.0.0.1:3307)/beehive'
make test-db          # SQLite, then every backend whose DSN is set
make test-postgres    # one backend only
make test-mariadb
```

I test che hanno bisogno di un database ne ottengono uno dalla fixture
`sqltest.New(t)` (`server/internal/storage/sql/sqltest`), che legge
`BEEHIVE_TEST_DATABASE_DRIVER` e `BEEHIVE_TEST_DATABASE_DSN`, dà a ogni test
un database tutto suo e lo elimina al termine. `CONTRIBUTING.md` nel
repository dell'app contiene i comandi per i container e le regole per l'SQL
portabile.

Il server legge la sua configurazione dall'ambiente e da un file `.env` nella
sua directory di lavoro (copia `.env.example`); `make run-server` lo avvia
nella radice del repository. Con `make dev-app` l'app proviene da un'altra
origine (`:5173`), quindi imposta
`BEEHIVE_CORS_ALLOWED_ORIGINS=http://localhost:5173` in `.env`. I valori
predefiniti ti danno SQLite e blob su filesystem; lascia `BEEHIVE_PASSWORD_AUTH`
disattivato, `BEEHIVE_OIDC_PROVIDERS` vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false`
per lavorare senza login. Vedi [Configurazione](../self-hosting/configuration.md).

Per compilare un binario di release: `make proto && make build` scrive
`server/bin/openbeehive` con la SPA incorporata. Vedi
[Singolo binario](../self-hosting/single-binary.md).

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
[Utilizzo dell'API](../using-the-api/overview.md) per l'elenco.

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
   entrambi, con test. I vettori di test condivisi in
   `server/internal/sync/testdata/merge_vectors.json` vengono eseguiti da
   entrambe le suite di test; aggiungi un vettore per ogni regola che cambi.
   Vedi il [protocollo di sincronizzazione](./sync-protocol.md).
4. **Scrivi SQL portabile.** Il server gira su PostgreSQL, MariaDB e SQLite. Le
   migrazioni usano il sottoinsieme portabile descritto in cima a
   `0001_init.sql`; lo store traduce le restanti differenze di dialetto.
   Le colonne indicizzate sono `VARCHAR(n)`, mai `TEXT`; un'istruzione che
   serve a un solo dialetto va in un file chiamato `NNNN_name.<driver>.sql`.
   Vedi [Database](../self-hosting/databases.md).
5. **Colori semantici.** Il CSS nuovo o modificato usa i token di colore
   definiti in `app/src/routes/+layout.svelte` (`--bg`, `--surface`, `--text`,
   `--accent` e così via), mai valori di colore grezzi; il tema scuro
   ridefinisce solo quei token.
6. **Inglese nel codice, traduzioni per gli utenti.** Codice, commenti,
   identificatori e messaggi di commit sono in inglese. Ogni stringa rivolta
   all'utente passa da `svelte-i18n` con voci in
   `app/src/lib/i18n/locales/{en,de,fr,es,it}.json`.
   Se non riesci a tradurre, aggiungi il testo inglese e dillo nella PR.

## Aprire una pull request

1. Fai il fork e crea un branch.
2. Esegui `make proto` se hai toccato un `.proto`.
3. Esegui `make check`. La CI esegue lo stesso e ripete i test Go su PostgreSQL e MariaDB.
4. Mantieni la PR mirata e descrivi cosa cambia e perché.
5. Segnala esplicitamente le modifiche alla logica di unione, alla
   sincronizzazione o allo schema.

---
sidebar_position: 7
title: "Contribuire e configurazione dev"
---

# Contribuire e configurazione dev

Openbeehive è software libero e open-source, e accogliamo contributi di ogni
dimensione - dalla correzione di un refuso alla costruzione di una nuova
funzionalità. Questa pagina ti porta da un clone appena fatto a un ambiente di
sviluppo funzionante, poi spiega le convenzioni che mantengono in salute la base
di codice.

Il progetto è rilasciato con licenza **AGPL-3.0**. Contribuendo, accetti che il
tuo lavoro sia rilasciato sotto la stessa licenza.

:::tip Da dove iniziare
Sfoglia gli issue aperti su GitHub, e leggi il `CONTRIBUTING.md` nel repository
principale prima di aprire una pull request. PR piccole e mirate sono molto più
facili da revisionare e fondere.
:::

## I repository

Openbeehive è suddiviso in alcuni repository sotto
[github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app):

| Repository | Cosa contiene |
| --- | --- |
| `openbeehive` | L'applicazione: backend Go e frontend PWA SvelteKit |
| `openbeehive-site` | Il sito di marketing su openbeehive.org |
| `openbeehive-docs` | Questo sito di documentazione (Docusaurus) |

La maggior parte dei contributi di codice arriva nel repository principale
`openbeehive`. Le modifiche alla documentazione appartengono a `openbeehive-docs`.

## Prerequisiti

Avrai bisogno di:

- **Go 1.25+** - per il backend
- **Node 22+** - per il frontend SvelteKit
- **buf** - per generare codice dalle definizioni Protocol Buffer

Si presuppone un `make` funzionante (qualsiasi GNU Make recente). Su Windows
consigliamo WSL2.

## Configurazione

Clona il repository e genera prima il codice protobuf, poi avvia il server e
l'app in due terminali separati.

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

`make run-server` legge la sua configurazione dal tuo ambiente (o da un file
`.env`). Per lo sviluppo locale i valori predefiniti funzionano da subito: un
database SQLite e il filesystem locale per i blob. Vedi
[Configurazione](/self-hosting/configuration) per l'elenco completo delle
variabili.

Per una configurazione a singolo sviluppatore puoi lasciare `BEEHIVE_OIDC_PROVIDERS`
vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false` per saltare del tutto il login.

:::note Compilare dai sorgenti
Per produrre un binario di release anziché un server di sviluppo, esegui `make
proto && make build`, che scrive `./server/bin/openbeehive`. Vedi
[Singolo binario](/self-hosting/single-binary) per i dettagli di distribuzione.
:::

## L'architettura in un minuto

Se sei nuovo alla base di codice, dai un'occhiata prima ad
[Architettura](/developers/architecture) e al [Modello dei
dati](/developers/data-model). La versione breve:

- Il frontend è **offline-first**. Possiede un database SQLite-WASM locale
  (memorizzato in OPFS) ed è completamente utilizzabile senza connessione di rete.
- Le modifiche si sincronizzano al server in background usando gli
  [Hybrid Logical Clocks e i CRDT](/developers/sync-protocol), così le modifiche
  concorrenti si uniscono senza conflitti.
- L'API è definita con **Connect-RPC** (gRPC e HTTP/JSON), generata dai file
  `.proto`.

## Convenzioni chiave

Queste convenzioni contano per la correttezza, non solo per lo stile. Per favore
seguile.

### 1. I file `.proto` sono la fonte di verità

La superficie dell'API, le forme dei messaggi e gli enum sono tutti definiti in
Protocol Buffers. Non modificare mai a mano il codice generato. Modifica il
`.proto`, esegui `make proto`, e lascia che il Go e il TypeScript generati
seguano.

### 2. Le scritture passano attraverso il repository locale, non il CRUD

Il client **non** chiama il server per creare o aggiornare direttamente i record.
Invece, tutte le scritture passano attraverso il livello del repository locale,
che registra la modifica localmente e lascia che il motore di sincronizzazione la
propaghi. Questo è ciò che rende l'app istantanea e capace di funzionare offline.

:::caution
Se aggiungi un percorso di scrittura che parla direttamente con il server, rompi
il supporto offline e aggiri la logica di unione. Instrada ogni scrittura
attraverso il repository locale.
:::

### 3. Mantieni `merge.go` e `merge.ts` sincronizzati

Le regole di unione - last-writer-wins per campo per gli scalari, OR-Set add-wins
per i campi elenco, eventi append-only - sono implementate **due volte**: una sul
server (`merge.go`) e una sul client (`merge.ts`). Devono comportarsi in modo
identico.

Qualsiasi modifica alla semantica di unione deve essere fatta in entrambi i file,
con test corrispondenti. Una divergenza qui fa unire i dati in modo diverso su
client e server, il che è un bug grave. Vedi
[Protocollo di sincronizzazione](/developers/sync-protocol) per le regole.

### 4. Scrivi SQL portabile

Il backend supporta **PostgreSQL, MySQL e SQLite** come database intercambiabili.
Mantieni l'SQL portabile su tutti e tre - evita la sintassi specifica di un motore,
e testa le modifiche allo schema su più di un driver dove puoi. Vedi
[Database](/self-hosting/databases).

### 5. Inglese nel codice, traduzioni per gli utenti

Scrivi tutto il codice, i commenti, gli identificatori e i messaggi di commit in
**inglese**.

Tutto ciò che un utente vede, tuttavia, deve essere traducibile. Quando aggiungi o
modifichi una stringa rivolta all'utente, fornisci le traduzioni per tutte le
lingue supportate:

| Lingua (locale) | Lingua |
| --- | --- |
| `en` | Inglese |
| `de` | Tedesco |
| `fr` | Francese |
| `es` | Spagnolo |
| `it` | Italiano |

Se non sei sicuro di una lingua, aggiungi il testo inglese e segnalalo nella tua
PR così un madrelingua può aiutare.

## Aprire una pull request

1. Fai il fork del repository e crea un branch per la tua modifica.
2. Assicurati che `make proto` sia stato eseguito se hai toccato qualche `.proto`.
3. Esegui localmente la suite di test e i linter.
4. Mantieni la PR mirata e descrivi cosa cambia e perché.
5. Per le modifiche alla logica di unione, alla sincronizzazione o allo schema,
   segnalalo esplicitamente così i revisori sanno di guardare con attenzione.

Leggi le linee guida complete in
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md).

Grazie per aiutare a rendere migliori i registri apistici per tutti. Se ti
blocchi, apri una discussione o un issue su GitHub - siamo felici di aiutare.

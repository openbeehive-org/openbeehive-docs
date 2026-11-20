---
sidebar_position: 1
title: "Avvio rapido"
---

# Avvio rapido

Due percorsi per avere un'istanza di Openbeehive funzionante da aprire in un browser:

- **Opzione A, Docker.** Esegui l'immagine pubblicata con un solo comando.
- **Opzione B, binario singolo.** Compila un unico eseguibile autonomo. Niente Docker, niente server di database, niente object storage. Adatto a un home server, un Raspberry Pi o un piccolo VPS.

Entrambi usano il profilo di deployment **selfhost**: un database SQLite incorporato e i file sul disco locale. Per più utenti su PostgreSQL e MinIO/S3, vedi [Docker e Compose](./docker.md#several-users).

:::caution Nessun accesso nella configurazione iniziale
Nel profilo selfhost nessun metodo di accesso è abilitato per impostazione predefinita, quindi l'app si apre direttamente sui tuoi registri e **chiunque possa raggiungere la porta ha accesso completo**. Sul tuo computer va bene così. Per questo motivo gli esempi pubblicano la porta solo su `127.0.0.1`, e un server senza accesso risponde solo a `localhost`, agli indirizzi IP e all'host di `BEEHIVE_PUBLIC_BASE_URL`. Prima di aprirlo ad altri dispositivi o persone, [attiva l'accesso](#turn-login-on).
:::

## Opzione A: Docker

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Apri `http://localhost:8080`. La directory di lavoro del container è `/data`, quindi il database (`openbeehive.db`) e i file caricati (`data/blobs`) finiscono sul volume `openbeehive-data` e sopravvivono a riavvii e aggiornamenti.

Il repository include la stessa configurazione come file Compose, [`docker-compose.selfhost.yml`](https://github.com/openbeehive-org/openbeehive-app/blob/main/docker-compose.selfhost.yml), che legge le sue impostazioni da un file `.env` accanto ad esso:

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Per fermare o rimuovere il container (il volume resta):

```bash
docker stop openbeehive
docker rm openbeehive
```

## Opzione B: binario singolo (senza Docker)

### Prerequisiti

- Go 1.27 o più recente
- Node 24 o più recente (l'immagine pubblicata viene compilata con Node 26)
- [buf](https://buf.build/docs/installation) (`make tools` installa la versione fissata)

### Compila ed esegui

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure (optional): the defaults already are the selfhost profile
cp .env.example .env

# Run
./server/bin/openbeehive
```

Il binario legge `.env` dalla directory in cui viene avviato; le variabili già impostate nell'ambiente hanno la precedenza. Per impostazione predefinita è in ascolto su `:8080` e serve esso stesso la web app (`BEEHIVE_SERVE_WEB=true`), così l'API e la PWA provengono dalla stessa origine. Apri `http://localhost:8080`.

Le prime righe del log dicono come è configurato il server, compreso chi può usarlo:

```text
config: applied .env from the working directory (existing environment variables win)
Openbeehive · profile=selfhost · DB=sqlite · Blob=fs
auth: NO LOGIN (single-user mode): every request has full access to all data
auth: accepting requests for hosts: localhost, IP addresses (add names with BEEHIVE_ALLOWED_HOSTS)
```

:::note Dove risiedono i tuoi dati
In modalità selfhost i tuoi registri finiscono in un file SQLite (`openbeehive.db` nella directory di lavoro per impostazione predefinita) e i file caricati in una directory di blob (`./data/blobs` per impostazione predefinita). Esegui il backup di entrambi e avrai eseguito il backup di tutto; vedi [Backup](./backups.md).
:::

## Attivare l'accesso \{#turn-login-on}

Per raggiungere l'istanza da altri dispositivi o condividerla con altri, richiedi l'accesso. Metti queste impostazioni in `.env` (accanto al binario, o accanto a `docker-compose.selfhost.yml`), oppure passale con `-e` a `docker run`:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org   # the address people open
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please            # 8+ characters
BEEHIVE_SESSION_SECRET=...                         # openssl rand -base64 32
BEEHIVE_BIND=0.0.0.0                               # Compose file only: publish on the network
```

- `BEEHIVE_PUBLIC_BASE_URL` è l'indirizzo che il server inserisce nei link che genera (redirect OIDC, link di invito e di verifica).
- `BEEHIVE_SESSION_SECRET` deve essere di almeno 32 byte. Con qualsiasi metodo di accesso il server rifiuta di avviarsi senza di esso.
- `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD` definiscono l'amministratore dell'istanza; con l'accesso email/password il server rifiuta di avviarsi senza di essi.

I registri creati prima dell'attivazione dell'accesso passano nello spazio dell'amministratore all'avvio successivo; accedi come amministratore per vederli. I dettagli e gli altri metodi di accesso si trovano in [Autenticazione](./authentication.md).

## Primi passi dopo l'installazione

1. Apri l'app e crea il tuo primo apiario.
2. Aggiungi un'arnia, modificala per impostarne il tipo e registra una visita.
3. Stampa un'etichetta QR per l'arnia così da poterla scansionare direttamente sul campo.

Prima di esporre l'istanza su internet, metti davanti un [reverse proxy](./reverse-proxy.md) che termina il TLS, imposta `BEEHIVE_PUBLIC_BASE_URL` sull'indirizzo `https://` e `BEEHIVE_TRUST_PROXY_HEADERS=true`. Poi configura i [backup](./backups.md). Esegui esattamente un'istanza del server per database.

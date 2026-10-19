---
sidebar_position: 1
title: "Avvio rapido"
---

# Avvio rapido

Due percorsi per avere un'istanza di Openbeehive funzionante da aprire in un browser:

- **Opzione A, binario singolo.** Compila un unico eseguibile autonomo che usa SQLite e il filesystem locale. Niente Docker, niente server di database, niente object storage. Adatto a un home server, un Raspberry Pi o un piccolo VPS.
- **Opzione B, Docker.** Esegui l'immagine pubblicata con un solo comando.

Entrambi usano il profilo di deployment **selfhost**, che per impostazione predefinita prevede un database SQLite incorporato e l'archiviazione dei blob su filesystem. Puoi passare a PostgreSQL e MinIO/S3 in seguito; vedi [Configurazione](/self-hosting/configuration).

:::tip Utente singolo? Nessun login necessario
Nel profilo selfhost nessun metodo di accesso è abilitato per impostazione predefinita: `BEEHIVE_PASSWORD_AUTH` è disattivato, `BEEHIVE_OIDC_PROVIDERS` è vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false`. L'app si apre direttamente sui tuoi registri. Per aggiungere l'accesso in seguito, vedi [Autenticazione](/self-hosting/authentication).
:::

## La configurazione minima funzionante

Qualunque percorso tu scelga, due impostazioni contano per iniziare:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` è l'indirizzo che il server inserisce nei link che genera (redirect OIDC, link di invito e di verifica). Per i test in locale `http://localhost:8080` va bene. Per un deployment reale, impostalo sul tuo URL pubblico, ad esempio `https://bees.example.com`.

Tutto il resto ha valori predefiniti per il self-hosting. L'elenco completo si trova in [Configurazione](/self-hosting/configuration).

## Opzione A: binario singolo (senza Docker)

### Prerequisiti

- Go 1.25 o più recente
- Node 24 o più recente
- [buf](https://buf.build/docs/installation)

### Compila ed esegui

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

Per impostazione predefinita il binario è in ascolto su `:8080` e serve esso stesso la web app (`BEEHIVE_SERVE_WEB=true`), così l'API e la PWA provengono dalla stessa origine. Apri l'indirizzo indicato in `BEEHIVE_PUBLIC_BASE_URL`.

:::note Dove risiedono i tuoi dati
In modalità selfhost i tuoi registri finiscono in un file SQLite (`openbeehive.db` nella directory di lavoro per impostazione predefinita) e le foto caricate in una directory di blob (`./data/blobs` per impostazione predefinita). Esegui il backup di entrambi e avrai eseguito il backup di tutto; vedi [Backup](/self-hosting/backups).
:::

## Opzione B: Docker

L'immagine pubblicata è `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Le righe `BEEHIVE_DATABASE_DSN` e `BEEHIVE_BLOB_DIR` sono quelle che mettono i tuoi dati sul volume. Senza di esse il container usa i suoi valori predefiniti, `openbeehive.db` e `./data/blobs` relativi alla directory root del container, che stanno fuori dal volume e spariscono dopo `docker rm`. Con esse, il volume `openbeehive-data` contiene il database e i blob, che sopravvivono a riavvii e aggiornamenti. Una volta in esecuzione, apri `http://localhost:8080`.

Per fermare o rimuovere il container (il volume resta):

```bash
docker stop openbeehive
docker rm openbeehive
```

Se attivi l'accesso con email/password (`BEEHIVE_PASSWORD_AUTH=true`), il server rifiuta di avviarsi finché non imposti anche `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD`. Vedi [Autenticazione](/self-hosting/authentication).

:::tip Preferisci lo stack cloud?
Il comando sopra esegue il profilo leggero selfhost. Per il profilo **cloud** (PostgreSQL + MinIO) il repository include dei file Compose; vedi [Docker](/self-hosting/docker).
:::

## Primi passi dopo l'installazione

1. Apri l'app al tuo `BEEHIVE_PUBLIC_BASE_URL` e crea il tuo primo apiario.
2. Aggiungi un'arnia, modificala per impostarne il tipo e registra una visita.
3. Stampa un'etichetta QR per l'arnia così da poterla scansionare direttamente sul campo.

Prima di esporre l'istanza su internet, metti davanti un [reverse proxy](/self-hosting/reverse-proxy) che termina il TLS e imposta `BEEHIVE_PUBLIC_BASE_URL` sull'indirizzo `https://`. Poi configura i [backup](/self-hosting/backups).

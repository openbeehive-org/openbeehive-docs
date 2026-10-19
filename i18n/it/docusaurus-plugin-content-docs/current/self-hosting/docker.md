---
sidebar_position: 3
title: "Docker e Compose"
---

# Docker e Compose

Esegui Openbeehive come singolo container per una configurazione self-host, oppure avvia lo stack cloud completo (Postgres e MinIO) con Docker Compose.

L'immagine è pubblicata nel GitHub Container Registry a ogni tag di release:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

La stessa immagine serve entrambi i profili di deployment; l'ambiente che passi decide quale ottieni.

:::tip
Per un'istanza a utente singolo su una macchina, il [binario singolo](/self-hosting/single-binary) è ancora più semplice di Docker. Ricorri a Compose quando vuoi Postgres e archiviazione in stile S3.
:::

## Esegui il singolo container

Un container con il profilo `selfhost` mantiene un database SQLite e i blob caricati su un unico volume montato. Non serve nient'altro.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 8080:8080` mappa la porta di ascolto del container (`BEEHIVE_ADDR=:8080`) sull'host.
- `-v openbeehive-data:/data` mantiene i tuoi dati su un volume con nome. Fa il suo lavoro solo insieme alle righe `BEEHIVE_DATABASE_DSN` e `BEEHIVE_BLOB_DIR`: l'immagine non ha una directory di lavoro, quindi i valori predefiniti (`openbeehive.db`, `./data/blobs`) si risolvono nella root del container e vanno persi quando il container viene rimosso.
- `BEEHIVE_PUBLIC_BASE_URL` deve essere l'indirizzo che gli utenti raggiungono, schema incluso. Il server lo usa per gli URL di redirect OIDC e per i link di invito e di verifica.

Senza alcun metodo di accesso abilitato (il valore predefinito di selfhost) l'istanza viene eseguita in modalità utente singolo. Per aggiungere l'autenticazione, imposta `BEEHIVE_SESSION_SECRET` (generalo una volta con `openssl rand -base64 32` e mantienilo stabile; cambiarlo disconnette tutti) più le variabili del metodo che vuoi. L'accesso con email/password richiede anche `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD`, altrimenti il server rifiuta di avviarsi. Vedi [Autenticazione](/self-hosting/authentication).

### Usare un file env

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Il profilo cloud con Compose

Il profilo `cloud` abbina il server a PostgreSQL e MinIO. Il `docker-compose.yml` del repository è uno stack di sviluppo: compila il server dai sorgenti e pubblica le porte del database e di MinIO sull'host.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
cp .env.example .env   # then edit .env (see below)
docker compose up -d --build
```

### I servizi

| Servizio | Immagine | Ruolo |
| --- | --- | --- |
| `server` | compilato dal `Dockerfile` del repository | Backend e web app su `:8080` |
| `postgres` | `postgres:18-alpine` | Database; `5432` pubblicata sull'host |
| `minio` | `minio/minio:latest` | Archiviazione blob compatibile con S3; `9000` (API) e `9001` (console) pubblicate sull'host |

`server` dipende da `postgres` e `minio`, quindi Compose li avvia per primi.

### Cosa imposta il file compose

Questi valori sono fissati in `docker-compose.yml` e non vengono letti da `.env`; per cambiarli modifica il file (e cambia le credenziali di Postgres e MinIO nello stesso posto):

| Impostazione | Valore nel file compose |
| --- | --- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `cloud` |
| `BEEHIVE_DATABASE_DSN` | `postgres://openbeehive:openbeehive@postgres:5432/openbeehive?sslmode=disable` |
| `BEEHIVE_MINIO_ENDPOINT` | `minio:9000` |
| `BEEHIVE_MINIO_ACCESS_KEY` / `BEEHIVE_MINIO_SECRET_KEY` | `minioadmin` / `minioadmin` |
| `BEEHIVE_OIDC_PROVIDERS` | `google` |

Questi vengono dalla tua shell o da `.env`:

```bash
# Required: the cloud profile enables password auth, which needs the instance admin.
# docker compose up fails immediately if either is missing.
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters

# Sessions; generate with: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=

# Defaults to http://localhost:8080
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Google is enabled as an OIDC provider in the compose file, so these are
# required too; without a client ID the server exits with
# "OIDC provider google: issuer/client id missing". Remove the BEEHIVE_OIDC_*
# lines from docker-compose.yml if you do not want Google sign-in.
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note I nomi dei servizi sono hostname
All'interno della rete Compose, i container si raggiungono per nome del servizio: per questo il DSN punta a `postgres` e l'endpoint MinIO a `minio`.
:::

### Un file in forma di produzione

`docker-compose.demo.yml` nel repository è il file dietro l'istanza ospitata: usa l'immagine pubblicata invece di compilare, non pubblica porte del database o di MinIO, aggiunge politiche di riavvio e healthcheck, prende ogni segreto da `.env`, chiude la registrazione (solo su invito) e abilita il [tenant demo](/self-hosting/demo). Il commento in testa elenca le variabili di cui ha bisogno. Usalo come punto di partenza per il tuo stack di produzione:

```bash
docker compose -f docker-compose.demo.yml up -d
```

Per l'elenco completo delle variabili vedi [Configurazione](/self-hosting/configuration).

## Conservare i tuoi dati

- **Singolo container (`selfhost`):** tutto è sotto `/data` sul volume `openbeehive-data`, purché il DSN e la directory dei blob puntino lì.
- **Profilo cloud:** i registri risiedono nel volume `pg` (Postgres) e i file caricati nel volume `minio`. Il container del server è stateless e può essere sostituito liberamente.

:::danger Esegui il backup prima di aggiornare
I volumi con nome sopravvivono a `docker compose up` e agli aggiornamenti dell'immagine, ma non a `docker compose down -v` o a un volume rimosso. Esegui un backup prima di qualsiasi aggiornamento o comando distruttivo. Vedi [Backup](/self-hosting/backups).
:::

## Operazioni comuni

```bash
# Follow the server logs
docker compose logs -f server

# Rebuild from updated source and recreate (docker-compose.yml builds the image)
git pull && docker compose up -d --build

# Pull a newer published image and recreate (docker-compose.demo.yml or your own file)
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d

# Stop everything (volumes are kept)
docker compose down
```

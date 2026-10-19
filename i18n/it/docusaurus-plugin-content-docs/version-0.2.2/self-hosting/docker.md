---
sidebar_position: 3
title: "Docker e Compose"
---

# Docker e Compose

Docker è il modo più veloce per eseguire Openbeehive su un server. Puoi eseguire
il singolo container da solo per una configurazione di self-host ordinata, oppure
avviare lo stack cloud completo (Postgres e MinIO) con Docker Compose.

L'immagine ufficiale è pubblicata nel GitHub Container Registry:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest
```

La stessa immagine funziona per entrambi i profili di deployment. Quale dei due
ottieni è deciso interamente dall'ambiente che passi.

:::tip Vuoi solo farlo partire in fretta?
Se ti serve solo un'istanza a utente singolo su una macchina, il
[binario singolo](/self-hosting/single-binary) è ancora più semplice di Docker.
Ricorri a Compose quando vuoi Postgres e archiviazione in stile S3.
:::

## Esegui il singolo container

Il deployment più semplice è un container che usa il profilo `selfhost`, che
mantiene tutti i suoi dati (un database SQLite e i blob caricati) su un singolo
volume montato. Non serve nient'altro.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e BEEHIVE_DATABASE_DRIVER=sqlite \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -e BEEHIVE_SESSION_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Alcune note sui flag:

- `-p 8080:8080` mappa la porta di ascolto del container (impostata da `BEEHIVE_ADDR=:8080`) sull'host.
- `-v openbeehive-data:/data` è quello importante. Mantiene il tuo database e i
  caricamenti su un volume Docker con nome così sopravvivono ai riavvii e agli
  aggiornamenti del container. Punta sia `BEEHIVE_DATABASE_DSN` che `BEEHIVE_BLOB_DIR` all'interno di questo volume.
- `BEEHIVE_PUBLIC_BASE_URL` deve essere l'indirizzo che gli utenti raggiungono effettivamente, schema incluso.
  Viene usato per costruire i deep link dei codici QR e gli URL di redirect OIDC, quindi impostalo correttamente.
- `BEEHIVE_SESSION_SECRET` firma i cookie di sessione. Generalo una volta e mantienilo stabile;
  cambiarlo disconnette tutti.

:::caution Imposta un secret di sessione stabile
Il trucco `$(openssl rand -base64 32)` è comodo per un primo avvio, ma produce
un nuovo valore ogni volta che il comando viene eseguito. Genera il secret una volta, conservalo
in un posto sicuro e passa lo stesso valore a ogni riavvio.
:::

Con `BEEHIVE_OIDC_PROVIDERS` lasciato vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false`, l'istanza viene eseguita
in modalità utente singolo senza login. Per aggiungere l'autenticazione, vedi
[Autenticazione](/self-hosting/authentication).

### Usare un file env

Lunghe liste di `-e` diventano ingombranti. Metti le tue impostazioni in un file e passalo con
`--env-file`:

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Il profilo cloud con Compose

Il profilo `cloud` abbina il server a PostgreSQL per il database e a MinIO
per l'archiviazione dei blob compatibile con S3. Questa è la configurazione consigliata per
l'hosting multiutente ed è quella che rispecchia il servizio ospitato.

Il repository include un `docker-compose.yml` che collega i tre servizi
insieme. Clona il repo, copia l'ambiente di esempio e avvialo:

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive
cp .env.example .env   # poi modifica .env (vedi sotto)
docker compose up -d
```

### I servizi

| Servizio | Immagine | Ruolo |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app:latest` | Il backend e la PWA di Openbeehive, in ascolto su `:8080`. |
| `postgres` | `postgres` | Il database relazionale per tutti i registri sincronizzati. |
| `minio` | `minio/minio` | Object storage compatibile con S3 per foto e altri blob. |

Il `server` dipende sia da `postgres` che da `minio`, quindi Compose li avvia
per primi. La web app è servita dallo stesso container quando `BEEHIVE_SERVE_WEB=true`.

### Ambiente richiesto

Imposta questi nel tuo `.env` prima di avviare. Il file compose li legge e li passa
ai container giusti.

```bash
BEEHIVE_DEPLOYMENT_PROFILE=cloud
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Database — l'host "postgres" è il nome del servizio compose
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:changeme@postgres:5432/openbeehive?sslmode=disable

# Archiviazione blob — l'endpoint "minio" è il nome del servizio compose
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=minio:9000
BEEHIVE_MINIO_ACCESS_KEY=minioadmin
BEEHIVE_MINIO_SECRET_KEY=changeme-too
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=false

# Sessioni
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
BEEHIVE_SESSION_TTL=720h

# Autenticazione (esempio: Google + Keycloak)
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://bees.example.com/auth/callback
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note I nomi dei servizi sono hostname
All'interno della rete Compose, i container si raggiungono per nome del servizio. È
per questo che `BEEHIVE_DATABASE_DSN` punta a `postgres` e `BEEHIVE_MINIO_ENDPOINT` a `minio` anziché
a `localhost`. Cambia le credenziali per farle corrispondere ai valori che hai impostato per i
container Postgres e MinIO.
:::

Per l'elenco completo delle variabili OIDC e WebAuthn, vedi
[Configurazione](/self-hosting/configuration) e
[Autenticazione](/self-hosting/authentication).

### Un esempio Compose ridotto

Questa è un'illustrazione ridotta di come i servizi si incastrano insieme. Usa il
`docker-compose.yml` del repository per la cosa vera; include
healthcheck e valori predefiniti sensati che questo frammento omette.

```docker
services:
  server:
    image: ghcr.io/openbeehive-org/openbeehive-app:latest
    ports:
      - "8080:8080"
    env_file: .env
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: openbeehive
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: openbeehive
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: changeme-too
    volumes:
      - miniodata:/data
    restart: unless-stopped

volumes:
  pgdata:
  miniodata:
```

## Conservare i tuoi dati

I registri apistici sono preziosi, quindi assicurati che risiedano su volumi che sopravvivono
ai container.

- **Singolo container (`selfhost`):** tutto è sotto `/data`. Il volume con
  nome `openbeehive-data` contiene sia il database SQLite che la directory
  dei blob.
- **Profilo cloud:** i registri risiedono nel volume `pgdata` (Postgres) e i file
  caricati nel volume `miniodata` (MinIO). Il container del server stesso è
  stateless e può essere sostituito liberamente.

:::danger Esegui il backup prima di aggiornare
I volumi con nome sopravvivono a `docker compose up` e agli aggiornamenti dell'immagine, ma non
sopravvivono a `docker compose down -v` o a un volume rimosso. Esegui un backup prima di qualsiasi
aggiornamento o comando distruttivo. Vedi [Backup](/self-hosting/backups).
:::

## Operazioni comuni

```bash
# Segui i log del server
docker compose logs -f server

# Aggiorna a un'immagine più recente e ricrea
docker compose pull
docker compose up -d

# Ferma tutto (i volumi sono conservati)
docker compose down
```

## Prossimi passi

- Metti davanti un proxy che termina il TLS: [Reverse proxy](/self-hosting/reverse-proxy).
- Regola le scelte di database e archiviazione: [Database](/self-hosting/databases) e
  [Archiviazione](/self-hosting/storage).
- Rivedi ogni impostazione in un unico posto: [Configurazione](/self-hosting/configuration).

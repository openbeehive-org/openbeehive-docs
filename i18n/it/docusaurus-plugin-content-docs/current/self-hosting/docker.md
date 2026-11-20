---
sidebar_position: 3
title: "Docker e Compose"
---

# Docker e Compose

Esegui Openbeehive come singolo container per una configurazione self-host, oppure avvia insieme PostgreSQL, MinIO e il server con Docker Compose. Il repository include un file Compose per ciascun caso:

| File | Cosa esegue | A cosa serve |
| --- | --- | --- |
| `docker-compose.selfhost.yml` | Un container, SQLite e file su un volume con nome | Un apicoltore o una famiglia su una macchina |
| `docker-compose.prod.yml` | L'immagine rilasciata con PostgreSQL e MinIO, accesso sempre attivo | Un'istanza con più utenti |
| `docker-compose.yml` | PostgreSQL, MinIO e un server compilato dal checkout | Sviluppo. Non è un modello per la produzione |
| `docker-compose.demo.yml` | Come il file di produzione più la demo pubblica in sola lettura | L'istanza ospitata su `app.openbeehive.org`. Non è un modello per il tuo server |

L'immagine è pubblicata nel GitHub Container Registry a ogni tag di release:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

La stessa immagine serve entrambi i profili di deployment; l'ambiente che passi decide quale ottieni. Dalla 0.4.0 il container viene eseguito come utente non privilegiato `65532` con `/data` come directory di lavoro.

### Verificare un'immagine di release

Ogni immagine di release è firmata con [cosign](https://docs.sigstore.dev/cosign/verifying/verify/) (keyless, legata all'identità del workflow di release), porta con sé un'attestazione di build provenance di GitHub e include un SBOM nella [release su GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Per verificare che l'immagine che scarichi sia quella compilata dal workflow di release:

```bash
cosign verify ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/openbeehive-org/openbeehive-app/\.github/workflows/release\.yml@.*'

gh attestation verify oci://ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z --owner openbeehive-org
```

Entrambi i comandi stampano l'identità di firma e il commit da cui è stata compilata l'immagine. Le immagini pubblicate prima della 0.4.0 non sono firmate.

:::tip
Per un'istanza a utente singolo su una macchina, il [binario singolo](./single-binary.md) è ancora più semplice di Docker. Ricorri al file Compose di produzione quando l'istanza è usata da più persone.
:::

## Esegui il singolo container

Un container con il profilo `selfhost` mantiene un database SQLite e i file caricati su un unico volume montato. Non serve nient'altro.

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 127.0.0.1:8080:8080` pubblica la porta solo su questa macchina. Senza accesso, chiunque possa raggiungere la porta ha accesso completo, quindi pubblicala sulla rete (`-p 8080:8080`) solo dopo aver [attivato l'accesso](./quick-start.md#turn-login-on).
- `-v openbeehive-data:/data` mantiene i tuoi dati su un volume con nome. `/data` è la directory di lavoro, quindi i valori predefiniti (`openbeehive.db`, `./data/blobs`) finiscono sul volume. Docker crea il volume con la proprietà di `/data` nell'immagine, così l'utente non privilegiato del server può scrivervi. Se invece monti una directory dell'host con un bind mount (`-v /srv/openbeehive:/data`), deve appartenere all'uid `65532`: `sudo chown -R 65532:65532 /srv/openbeehive`.
- Un server senza accesso risponde solo a `localhost`, agli indirizzi IP e all'host di `BEEHIVE_PUBLIC_BASE_URL`. Se lo apri con un altro nome (per esempio `http://nas.local:8080`), imposta `BEEHIVE_PUBLIC_BASE_URL` su quell'indirizzo oppure elenca il nome in `BEEHIVE_ALLOWED_HOSTS`.

### Lo stesso come file Compose

`docker-compose.selfhost.yml` è il comando qui sopra con una politica di riavvio e un health check. Prende le sue impostazioni da un file `.env` accanto ad esso:

```bash
# .env (all optional; without it the instance has no login and is published on 127.0.0.1)
BEEHIVE_BIND=0.0.0.0                              # publish on the network
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org  # the address people open
BEEHIVE_PASSWORD_AUTH=true                        # require sign-in
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please           # 8+ characters
BEEHIVE_SESSION_SECRET=...                        # openssl rand -base64 32
BEEHIVE_TRUST_PROXY_HEADERS=true                  # only behind a reverse proxy
```

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Con il semplice `docker run`, passa le stesse variabili con `-e` o `--env-file openbeehive.env`. Qualsiasi metodo di accesso richiede `BEEHIVE_SESSION_SECRET` (32 byte o più; generalo una volta e mantienilo stabile, cambiarlo disconnette tutti). Vedi [Autenticazione](./authentication.md).

## Più utenti: PostgreSQL e MinIO \{#several-users}

`docker-compose.prod.yml` esegue l'immagine rilasciata nel profilo `cloud` con PostgreSQL e MinIO. L'accesso è sempre attivo (email e password), la registrazione è chiusa a meno che tu non la apra, e viene pubblicata solo la porta dell'app, su `127.0.0.1`, per il tuo [reverse proxy](./reverse-proxy.md). PostgreSQL e MinIO non vengono pubblicati affatto.

Il file rifiuta di avviarsi finché ogni segreto non è impostato. Mettili in un file `.env` accanto ad esso:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org
BEEHIVE_SESSION_SECRET=...      # openssl rand -base64 32
POSTGRES_PASSWORD=...           # openssl rand -hex 24
MINIO_ROOT_PASSWORD=...         # openssl rand -hex 24
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=...      # 8+ characters; applied again on every start
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

Impostazioni facoltative che il file inoltra: `BEEHIVE_REGISTRATION` (predefinito `false`, solo su invito), le variabili `BEEHIVE_SMTP_*` per le email di invito e di verifica, e `BEEHIVE_BIND` (impostalo su `0.0.0.0` solo quando il reverse proxy gira su un'altra macchina, e assicurati che nient'altro possa raggiungere la porta).

Il file imposta `BEEHIVE_TRUST_PROXY_HEADERS=true`, perché si aspetta esattamente un reverse proxy davanti. Esegui esattamente un'istanza del server per database.

### I servizi

| Servizio | Immagine | Ruolo |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app` (release fissata) | Backend e web app su `:8080` |
| `postgres` | `postgres:18-alpine` | Database |
| `minio` | `minio/minio` | Archiviazione blob compatibile con S3 |

`server` attende che `postgres` e `minio` risultino in salute.

:::note[I nomi dei servizi sono hostname]
All'interno della rete Compose, i container si raggiungono per nome del servizio: per questo il DSN punta a `postgres` e l'endpoint MinIO a `minio`.
:::

### Lo stack di sviluppo

`docker-compose.yml` compila il server dal checkout e pubblica PostgreSQL (`5432`) e MinIO (`9000`, `9001`) su `127.0.0.1` per gli strumenti locali. Richiede `BEEHIVE_SESSION_SECRET`, `MINIO_ROOT_PASSWORD`, `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD` in `.env`. OIDC è facoltativo e va attivato esplicitamente: imposta `BEEHIVE_OIDC_PROVIDERS` insieme all'issuer e al client id del provider. È pensato per lavorare su Openbeehive, non per eseguirlo.

```bash
cp .env.example .env   # then add the four values above
docker compose up -d --build
```

Per l'elenco completo delle variabili vedi [Configurazione](./configuration.md).

## Conservare i tuoi dati

- **Singolo container (`selfhost`):** tutto è sotto `/data` sul volume `openbeehive-data`.
- **PostgreSQL e MinIO:** i registri risiedono nel volume `pg` e i file caricati nel volume `minio`. Il container del server è stateless e può essere sostituito liberamente.

:::danger[Esegui il backup prima di aggiornare]
I volumi con nome sopravvivono a `docker compose up` e agli aggiornamenti dell'immagine, ma non a `docker compose down -v` o a un volume rimosso. Esegui un backup prima di qualsiasi aggiornamento o comando distruttivo. Vedi [Backup](./backups.md).
:::

## Operazioni comuni

```bash
# Follow the server logs
docker compose -f docker-compose.prod.yml logs -f server

# Pull the image named in the Compose file and recreate
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rebuild the development stack from updated source
git pull && docker compose up -d --build

# Stop everything (volumes are kept)
docker compose -f docker-compose.prod.yml down
```

I file Compose fissano una release tramite tag e digest. Per passare a una release più recente, aggiorna il file dal repository (o cambia il tag) e segui [Aggiornamento](./upgrading.md).

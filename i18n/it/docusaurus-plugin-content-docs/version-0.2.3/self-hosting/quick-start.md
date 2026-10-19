---
sidebar_position: 1
title: "Avvio rapido"
---

# Avvio rapido

Questo è il percorso più veloce per passare da zero a un'istanza di Openbeehive funzionante che puoi aprire in un browser. Scegli uno dei due percorsi:

- **Opzione A — Binario singolo.** Compila un unico binario autonomo che usa SQLite e il filesystem locale. Niente Docker, niente server di database, niente object storage. Ideale per un home server, un Raspberry Pi o un piccolo VPS.
- **Opzione B — Docker.** Scarica la nostra immagine pubblicata ed eseguila con un solo comando.

Entrambi i percorsi usano il profilo di deployment **selfhost**, che per impostazione predefinita prevede un database SQLite incorporato e l'archiviazione dei blob su filesystem. Puoi passare a PostgreSQL e MinIO/S3 in seguito — vedi [Configurazione](/self-hosting/configuration).

:::tip Utente singolo? Nessun login necessario
Se sei l'unica persona a usare la tua istanza, puoi eseguirla **senza alcuna autenticazione**. Lascia semplicemente `BEEHIVE_OIDC_PROVIDERS` vuoto e mantieni `BEEHIVE_WEBAUTHN_ENABLED=false` (sono entrambi i valori predefiniti). L'app si apre direttamente sui tuoi registri. Per aggiungere l'accesso in seguito, vedi [Autenticazione](/self-hosting/authentication).
:::

## La configurazione minima funzionante

Qualunque percorso tu scelga, solo due impostazioni contano davvero per iniziare:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` è l'indirizzo che le persone (e i deep link dei codici QR) usano per raggiungere l'app. Per i test in locale `http://localhost:8080` va bene. Per un deployment reale, impostalo sul tuo URL pubblico, ad esempio `https://bees.example.com`.

Tutto il resto ha valori predefiniti sensati per il self-hosting. L'elenco completo si trova in [Configurazione](/self-hosting/configuration).

## Opzione A — Binario singolo (senza Docker)

### Prerequisiti

- Go 1.25 o più recente
- Node 22 o più recente
- [buf](https://buf.build/docs/installation)

### Compila ed esegui

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Genera il codice Connect-RPC, poi compila il server
make proto
make build

# Configura
cp .env.example .env
# Modifica .env: imposta BEEHIVE_DEPLOYMENT_PROFILE=selfhost e BEEHIVE_PUBLIC_BASE_URL

# Esegui
./server/bin/openbeehive
```

Per impostazione predefinita il binario è in ascolto su `:8080` e serve esso stesso la web app (`BEEHIVE_SERVE_WEB=true`), così l'API e la PWA provengono dalla stessa origine. Apri l'indirizzo indicato in `BEEHIVE_PUBLIC_BASE_URL` e sei dentro.

:::note Dove risiedono i tuoi dati
In modalità selfhost i tuoi registri finiscono in un file SQLite locale e le foto caricate in una directory di blob (`./data/blobs` per impostazione predefinita). Esegui il backup di questi e avrai eseguito il backup di tutto — vedi [Backup](/self-hosting/backups).
:::

## Opzione B — Docker

Se hai Docker installato, questo è il percorso più rapido in assoluto. L'immagine pubblicata è `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Il volume `-v openbeehive-data:/data` mantiene il database SQLite e i blob al di fuori del container, così sopravvivono ad aggiornamenti e riavvii. Una volta in esecuzione, apri `http://localhost:8080`.

Per fermarlo o rimuoverlo:

```bash
docker stop openbeehive
docker rm openbeehive
```

:::tip Preferisci lo stack cloud?
I comandi sopra eseguono il profilo leggero selfhost. Se vuoi il profilo completo **cloud** (PostgreSQL + MinIO), il repository include un file Compose — esegui `docker compose up -d`. Vedi [Docker](/self-hosting/docker) per i dettagli.
:::

## Primi passi dopo l'installazione

Ora hai un'istanza funzionante. Da qui:

1. Apri l'app al tuo `BEEHIVE_PUBLIC_BASE_URL` e crea il tuo primo apiario.
2. Aggiungi un'arnia, scegli il suo tipo e registra un'ispezione.
3. Facoltativamente, stampa un'etichetta QR per l'arnia così da poterla scansionare direttamente sul campo.

Per un tour dell'app stessa, vai a [Usare l'app](/category/using-the-app). Per rendere la tua istanza pronta per la produzione — HTTPS, un dominio reale, autenticazione e backup — continua con:

- [Configurazione](/self-hosting/configuration) — ogni variabile d'ambiente spiegata
- [Reverse proxy](/self-hosting/reverse-proxy) — metti davanti TLS e un dominio
- [Autenticazione](/self-hosting/authentication) — aggiungi l'accesso OIDC o le passkey
- [Backup](/self-hosting/backups) — proteggi i tuoi registri

:::caution Usa HTTPS in produzione
`http://localhost` è adatto solo ai test in locale. Esporre l'app su internet senza TLS mette a rischio i tuoi dati e interrompe le funzionalità che richiedono un contesto sicuro. Imposta `BEEHIVE_PUBLIC_BASE_URL` su un indirizzo `https://` e termina il TLS su un reverse proxy prima di andare in produzione.
:::

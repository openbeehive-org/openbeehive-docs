---
sidebar_position: 2
title: "Binario singolo"
---

# Binario singolo

Il modo più semplice per eseguire Openbeehive sulla tua macchina è il **binario singolo**. Nel profilo `selfhost`, Openbeehive serve la web app e l'API da un unico processo, memorizza i suoi dati in un file SQLite locale e mantiene le foto caricate sul filesystem. Niente Docker, niente Postgres, niente object store - solo un eseguibile.

Questa pagina ti guida nella compilazione di quel binario dai sorgenti e nella sua esecuzione come servizio di lunga durata.

:::tip Hai fretta?
Se preferisci scaricare un'immagine container precompilata, vedi [Docker](/self-hosting/docker). Per confrontare prima entrambi gli approcci, parti dalla [panoramica del self-hosting](/category/self-hosting).
:::

## Prerequisiti

Avrai bisogno di alcuni strumenti di build installati sulla macchina che compila il binario:

| Strumento | Versione | Scopo |
| --- | --- | --- |
| Go | 1.25+ | Compila il server |
| Node.js | 20+ | Compila la web app SvelteKit |
| buf | latest | Genera il codice Connect-RPC dalle definizioni protobuf |

Una volta compilato, il binario in sé non ha dipendenze a runtime - puoi copiarlo su un server che non ha nessuno degli strumenti sopra installato.

## Ottieni il codice

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive
```

## Configura

Copia il file d'ambiente di esempio e scegli il profilo self-host:

```bash
cp .env.example .env
```

Per un'istanza privata a utente singolo i valori predefiniti sono quasi pronti all'uso. Apri `.env` e conferma questi valori:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
BEEHIVE_SESSION_SECRET=
```

Genera un secret di sessione - non lasciarlo mai vuoto se non in un test usa e getta:

```bash
openssl rand -base64 32
```

Incolla il risultato in `BEEHIVE_SESSION_SECRET=`.

:::note Nessun login per impostazione predefinita
Lascia `BEEHIVE_OIDC_PROVIDERS` vuoto **e** `BEEHIVE_WEBAUTHN_ENABLED=false` per eseguire come utente singolo senza passaggio di accesso. Quando sei pronto ad aggiungere account o passkey, vedi [Autenticazione](/self-hosting/authentication).
:::

Se intendi raggiungere l'istanza da un altro dispositivo sulla tua rete, imposta `BEEHIVE_PUBLIC_BASE_URL` su un indirizzo che quel dispositivo possa effettivamente risolvere (ad esempio `http://192.168.1.20:8080` o il tuo dominio dietro un [reverse proxy](/self-hosting/reverse-proxy)). Questo valore è anche incorporato nei deep link usati dalle [etichette QR](/using-the-app/qr-labels).

## Compila

Genera il codice protobuf, poi compila:

```bash
make proto
make build
```

Questo produce un unico eseguibile:

```text
./server/bin/openbeehive
```

La web app è inclusa nel binario, quindi non c'è nient'altro da distribuire insieme ad esso.

## Esegui

Dalla radice del repository (così i percorsi relativi in `.env` si risolvono come previsto):

```bash
./server/bin/openbeehive
```

Al primo avvio il server:

- crea il file di database SQLite `openbeehive.db` ed esegue le sue migrazioni,
- crea la directory `./data/` (con `./data/blobs` per le foto),
- serve la web app e l'API Connect-RPC su `:8080`.

Apri `http://localhost:8080` nel tuo browser. L'app si carica, costruisce il suo database locale nel browser e sei pronto ad aggiungere il tuo primo apiario.

:::tip La directory di lavoro conta
I percorsi relativi come `file:openbeehive.db` e `./data/blobs` vengono risolti rispetto alla directory da cui viene avviato il binario, non a dove risiede il binario. Scegli deliberatamente una directory di lavoro - l'unità systemd più sotto la imposta esplicitamente con `WorkingDirectory`.
:::

## Esegui come servizio systemd

Per un'istanza sempre attiva, esegui Openbeehive sotto systemd così da avviarsi all'avvio del sistema e riavviarsi in caso di errore.

Per prima cosa, colloca il binario e una directory di lavoro in un punto sensato e crea un utente dedicato:

```bash
sudo useradd --system --home /opt/openbeehive --shell /usr/sbin/nologin openbeehive
sudo mkdir -p /opt/openbeehive
sudo cp server/bin/openbeehive /opt/openbeehive/
sudo cp .env /opt/openbeehive/
sudo chown -R openbeehive:openbeehive /opt/openbeehive
```

Poi crea il file dell'unità in `/etc/systemd/system/openbeehive.service`:

```text
[Unit]
Description=Openbeehive beekeeping records
After=network.target

[Service]
Type=simple
User=openbeehive
Group=openbeehive
WorkingDirectory=/opt/openbeehive
EnvironmentFile=/opt/openbeehive/.env
ExecStart=/opt/openbeehive/openbeehive
Restart=on-failure
RestartSec=5

# Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/openbeehive
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Abilitalo e avvialo:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openbeehive
```

Verifica che sia integro e osserva i log:

```bash
systemctl status openbeehive
journalctl -u openbeehive -f
```

:::caution Binding alla porta 80 o 443
L'esempio si lega a `:8080`, che un utente non privilegiato può usare. Non eseguire il servizio come root per raggiungere le porte 80/443 - mantieni invece Openbeehive su `:8080` e metti davanti ad esso un [reverse proxy](/self-hosting/reverse-proxy) (come Caddy o nginx) per gestire il TLS e la porta pubblica.
:::

## Dove risiedono i tuoi dati

Nel profilo `selfhost` tutto è memorizzato sotto la directory di lavoro che hai scelto (sopra, `/opt/openbeehive`):

| Cosa | Posizione predefinita | Impostato da |
| --- | --- | --- |
| Database dei registri | `openbeehive.db` (più i file `-wal` / `-shm`) | `BEEHIVE_DATABASE_DSN` |
| Foto e allegati | `./data/blobs` | `BEEHIVE_BLOB_DIR` |

I file `-wal` e `-shm` accanto al database sono il write-ahead log di SQLite; trattali come parte del database.

## Spostare o eseguire il backup dei tuoi dati

Poiché tutto lo stato è costituito da file in un'unica directory, ricollocare un'istanza è per lo più un'operazione di copia:

1. Ferma il servizio così il database è a riposo: `sudo systemctl stop openbeehive`.
2. Copia il binario, `.env`, i file del database e la directory `data/` sulla nuova macchina, preservando la disposizione.
3. Avvia il servizio sul nuovo host: `sudo systemctl start openbeehive`.

:::danger Ferma sempre prima il servizio
Copiare `openbeehive.db` mentre il server è in esecuzione può catturare un'istantanea lacerata e incoerente. Ferma il servizio (o usa una procedura di backup adeguata) prima di copiare i file del database.
:::

Per backup pianificati, ritenzione e tecniche di backup a caldo sicure per SQLite, vedi [Backup](/self-hosting/backups).

## Aggiornamento

Per passare a una versione più recente, scarica il codice più recente, ricompila e sostituisci il binario - il tuo database e la directory `data/` restano dove sono e le migrazioni vengono eseguite al successivo avvio. La procedura completa, incluso come effettuare il rollback, è trattata in [Aggiornamento](/self-hosting/upgrading).

---
sidebar_position: 4
title: "Configurazione"
---

# Configurazione

Openbeehive viene configurato interamente tramite variabili d'ambiente. Questa pagina è il riferimento completo.

Puoi impostare queste variabili nella tua shell, nel tuo file `docker compose`, tramite il gestore di segreti della tua piattaforma di hosting o in un file `.env`. Il server legge `.env` dalla sua directory di lavoro all'avvio; le variabili già impostate nell'ambiente hanno la precedenza sul file. Tutto viene letto una sola volta, quindi le modifiche hanno effetto dopo un riavvio.

:::tip[Inizia in piccolo]
Te ne servono solo una manciata per iniziare. Un server domestico a utente singolo funziona con i soli valori predefiniti. Quando attivi un metodo di accesso, aggiungi `BEEHIVE_SESSION_SECRET` e, per l'accesso con email/password, l'account amministratore. Consulta l'[Avvio rapido](./quick-start.md) per essere operativo in pochi minuti.
:::

## Come funziona il profilo di distribuzione

L'impostazione di gran lunga più importante è `BEEHIVE_DEPLOYMENT_PROFILE`. Sceglie valori predefiniti sensati per tutto il resto, così non devi specificare a mano l'intero stack.

| Profilo    | Database predefinito | Archiviazione blob predefinita | Pensato per                          |
| ---------- | ---------------- | -------------------- | ------------------------------------- |
| `selfhost` | SQLite (file)    | Filesystem locale     | Un singolo binario, niente Docker, un host  |
| `cloud`    | PostgreSQL       | MinIO / S3           | Un'istanza con più utenti             |

Il profilo imposta solo i *valori predefiniti*. Qualsiasi variabile che imposti esplicitamente ha sempre la precedenza. Ad esempio, puoi eseguire il profilo `selfhost` ma indirizzarlo a PostgreSQL impostando tu stesso `BEEHIVE_DATABASE_DRIVER` e `BEEHIVE_DATABASE_DSN`.

:::note
I due profili sono documentati in dettaglio nelle rispettive pagine: [Binario singolo](./single-binary.md) e [Docker](./docker.md). Questa pagina si concentra sulle variabili stesse.
:::

## Profilo di distribuzione

| Variabile             | Predefinito    | Descrizione                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------------- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `selfhost` | Seleziona lo stack preimpostato: `selfhost` o `cloud`. Imposta i valori predefiniti per database e archiviazione blob. |

## Server HTTP

| Variabile          | Predefinito                  | Descrizione                                                                 |
| ----------------- | ------------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_ADDR`            | `:8080`                  | Indirizzo e porta su cui il server è in ascolto. Usa `127.0.0.1:8080` per associarlo solo a localhost dietro un reverse proxy. |
| `BEEHIVE_PUBLIC_BASE_URL` | `http://localhost:8080`  | L'URL pubblico tramite cui gli utenti raggiungono l'app. Usato per i reindirizzamenti OIDC, i link di invito e di verifica e i valori predefiniti delle passkey. Impostalo sul tuo dominio reale in produzione. |
| `BEEHIVE_HTTP_READ_HEADER_TIMEOUT` | `10s` | Tempo concesso per leggere le intestazioni di una richiesta. |
| `BEEHIVE_HTTP_READ_TIMEOUT` | `2m` | Tempo concesso per leggere una richiesta; `0` significa nessun limite. Lo stream di sincronizzazione in tempo reale è escluso. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `2m` | Tempo concesso per scrivere una risposta; `0` significa nessun limite. Lo stream di sincronizzazione in tempo reale è escluso. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Per quanto tempo una connessione keep-alive inattiva resta aperta. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Periodo di tolleranza per le richieste in corso allo spegnimento. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `false` | Prende l'indirizzo del client per la limitazione dei tentativi di accesso dall'ultima voce di `X-Forwarded-For`. Impostalo su `true` solo quando davanti c'è esattamente un reverse proxy che controlli tu e la porta del server non è raggiungibile in nessun altro modo. |
| `BEEHIVE_ALLOWED_HOSTS` | (vuoto) | Solo senza accesso: ulteriori nomi host a cui il server risponde, separati da virgola. `*` disattiva il controllo. Vedi sotto. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` deve corrispondere all'indirizzo che gli utenti visitano effettivamente. Se è errato, i reindirizzamenti di login e i link di invito puntano al posto sbagliato.
:::

Un messaggio RPC può essere al massimo di 16 MiB; l'app suddivide da sola i caricamenti più grandi. Questo limite non è configurabile.

### Nomi host senza accesso \{#allowed-hosts}

Un server senza un metodo di accesso tratta ogni richiesta come proveniente dall'unico utente locale. Per impedire che una pagina web che ti limiti a visitare lo raggiunga con un nome proprio, un server di questo tipo risponde solo quando l'`Host` della richiesta è `localhost`, un indirizzo IP, l'host di `BEEHIVE_PUBLIC_BASE_URL` o un nome elencato in `BEEHIVE_ALLOWED_HOSTS`. Gli altri nomi ricevono una risposta `403` che indica l'impostazione. Con un metodo di accesso abilitato il controllo è disattivato.

## App web integrata

Il server può servire direttamente la PWA SvelteKit, così un singolo binario fornisce sia l'API sia il front end.

| Variabile     | Predefinito | Descrizione                                                                                  |
| ------------ | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SERVE_WEB`  | `true`  | Quando è `true`, il server serve l'app web inclusa. Imposta `false` se ospiti il front end separatamente. |
| `BEEHIVE_WEB_DIR`    | (vuoto) | Percorso degli asset web compilati. Lascia vuoto per usare gli asset incorporati nel binario.          |

## CORS

Le impostazioni cross-origin contano quando l'app web viene servita da un'origine diversa da quella dell'API.

| Variabile                 | Predefinito | Descrizione                                                                 |
| ------------------------ | ------- | --------------------------------------------------------------------------- |
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | (vuoto) | Elenco separato da virgole delle altre origini che possono chiamare l'API da un browser, ad esempio `https://app.example.com`. Vuoto significa solo stessa origine. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Se le origini elencate possono inviare credenziali (cookie, header di autenticazione). |

:::caution
Lascialo vuoto quando il server serve esso stesso l'app web (il valore predefinito). `*` consente qualsiasi origine ma mai con credenziali: il server allora disattiva le credenziali, quindi un'app nel browser con accesso effettuato su un'altra origine smette di funzionare. Elenca invece le origini in modo esplicito. Con `make dev-app`, imposta `http://localhost:5173`.
:::

## Mappe \{#maps}

Le tessere della mappa e la ricerca di indirizzi sono gli unici servizi remoti che l'app contatta. Entrambi sono configurabili e possono essere disattivati per l'intera istanza.

| Variabile | Predefinito | Descrizione |
| --- | --- | --- |
| `BEEHIVE_MAPS` | `on` | `off` rimuove la mappa e la ricerca di indirizzi dall'app. |
| `BEEHIVE_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Modello dell'URL delle tessere (sintassi Leaflet). `{s}` può comparire solo nella prima etichetta del nome host. |
| `BEEHIVE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | URL di base di una ricerca di indirizzi compatibile con Nominatim. |

Con i valori predefiniti, un browser che apre una mappa richiede le tessere a OpenStreetMap, e digitare un indirizzo o spostare il segnaposto di un apiario invia quell'indirizzo o quella posizione a Nominatim. Entrambi vedono l'indirizzo IP del dispositivo. Il server aggiunge le due origini alla propria Content-Security-Policy, così l'app può raggiungere queste e nient'altro.

## Sincronizzazione

| Variabile  | Predefinito  | Descrizione                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | casuale a ogni avvio | Id dell'orologio apposto sulle modifiche che il server scrive da sé (chiamate API). Normalmente non c'è motivo di impostarlo. |
| `BEEHIVE_CHANGELOG_RETENTION_DAYS` | `180` | Giorni per cui viene conservato il registro delle modifiche. Una volta al giorno le voci più vecchie vengono rimosse; un dispositivo rimasto assente più a lungo carica i dati attuali invece delle modifiche che si è perso. `0` conserva il registro per sempre. |
| `BEEHIVE_SYNC_MIN_PROTOCOL` | `0` | Versione minima del protocollo di sincronizzazione che il server accetta dalle app. `0` accetta anche le app 0.4.x installate; `1` le rifiuta, e non possono sincronizzarsi finché non sono state aggiornate. |

Esegui esattamente un'istanza del server per database. L'esecuzione di più repliche sullo stesso database non è supportata: la compattazione giornaliera del registro delle modifiche e la manutenzione delle foto girano all'interno del processo del server.

Le voci presenti al momento dell'aggiornamento a 0.5.0 contano come ricevute il giorno dell'aggiornamento, quindi, con la conservazione predefinita, le prime voci vengono rimosse non prima di 180 giorni dopo l'aggiornamento. Un'app 0.4.x la cui ultima sincronizzazione è più vecchia di quanto il registro conserva ancora non può sincronizzarsi finché non viene aggiornata.

## Database

| Variabile          | Predefinito            | Descrizione                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | dal profilo       | Motore del database: `postgres`, `mysql` (MariaDB) o `sqlite`.                 |
| `BEEHIVE_DATABASE_DSN`    | dal profilo       | Stringa di connessione per il driver scelto (vedi sotto).                       |

DSN di esempio per driver:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MariaDB (driver name: mysql)
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Per la scelta del driver, l'ottimizzazione e le note sulla migrazione, consulta [Database](./databases.md).

## Archiviazione blob

Le immagini a piena risoluzione delle foto vengono archiviate come blob, sul filesystem locale o in un object store compatibile con S3. Un backup è il database più questa directory o questo bucket.

| Variabile          | Predefinito        | Descrizione                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | dal profilo   | Backend di archiviazione: `fs` (filesystem locale) o `minio` (MinIO / S3).       |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Directory per i blob quando `BEEHIVE_BLOB_BACKEND=fs`. Non deve contenere il file del database SQLite, altrimenti il server non si avvia. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host e porta dell'endpoint MinIO / S3.                              |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Chiave di accesso per l'object store.                                        |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Chiave segreta per l'object store.                                        |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Nome del bucket in cui vengono archiviati i blob.                                     |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Imposta `true` per connetterti all'endpoint tramite HTTPS.                       |

Le variabili `MINIO_*` vengono usate solo quando `BEEHIVE_BLOB_BACKEND=minio`. `BEEHIVE_BLOB_PUBLIC_URL` non viene più usata: le immagini vengono servite solo ai membri che hanno effettuato l'accesso, sotto `/photos/`, e il server avvisa all'avvio quando l'impostazione è presente. Per indicazioni complete, consulta [Archiviazione](./storage.md).

## Sessione e autenticazione

| Variabile         | Predefinito | Descrizione                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (vuoto) | Segreto che firma i token di sessione, di almeno 32 byte. Generane uno con `openssl rand -base64 32`. **Obbligatorio non appena un qualsiasi metodo di accesso è abilitato**: senza di esso il server rifiuta di avviarsi. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | Per quanto tempo dura una sessione prima che sia richiesta una nuova autenticazione (ad esempio `720h` corrisponde a 30 giorni).      |

:::danger
Mantieni `BEEHIVE_SESSION_SECRET` privato e stabile. Chi lo conosce può falsificare le sessioni; cambiarlo disconnette tutti.
:::

## Email, password e onboarding

Account integrati per istanze multi-utente senza un provider di identità esterno.
L'amministratore dell'istanza è un account dedicato che configuri tu, non la prima persona
che si registra. Consulta [Autenticazione](./authentication.md).

| Variabile | Predefinito | Descrizione |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | attivo per `cloud`, disattivo per `selfhost` | Abilita la registrazione e l'accesso tramite email/password. Implicito anche da `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (vuoto) | Email dell'amministratore dell'istanza. **Obbligatoria ogni volta che l'autenticazione con password è abilitata.** L'account viene garantito a ogni avvio: creato se manca e con il ruolo forzato ad amministratore. La registrazione non concede mai il ruolo di amministratore. |
| `BEEHIVE_ADMIN_PASSWORD` | (vuoto) | Password dell'amministratore dell'istanza, almeno 8 caratteri. Fa fede a ogni avvio: la password memorizzata viene reimpostata a questo valore, il che funge anche da recupero della password. |
| `BEEHIVE_REGISTRATION` | `true` | Registrazione autonoma aperta. Imposta `false` per un'istanza solo su invito: a parte l'amministratore configurato, gli account possono essere creati solo tramite link di invito, e la schermata di accesso mostra un avviso che l'istanza è solo su invito. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Richiede la conferma via email prima che un nuovo account possa accedere. Richiede `BEEHIVE_SMTP_HOST`; il server rifiuta di avviarsi con la verifica attiva e senza server di posta. |
| `BEEHIVE_SMTP_HOST` | (vuoto) | Server SMTP per le email di verifica, di invito e di reimpostazione della password. Se vuoto, non viene inviata alcuna email: l'amministratore copia i link di invito dalle Impostazioni, e solo l'amministratore dell'istanza può creare lì i link di reimpostazione della password. I link non vengono mai scritti nel log. |
| `BEEHIVE_SMTP_PORT` | `587` | Porta SMTP. |
| `BEEHIVE_SMTP_USER` | (vuoto) | Nome utente SMTP. |
| `BEEHIVE_SMTP_PASS` | (vuoto) | Password SMTP. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Indirizzo mittente per la posta in uscita. |

## Spazio demo

Installa un account e uno spazio demo dimostrativi. Disattivato per impostazione predefinita — consulta
[Modalità demo](./demo.md).

| Variabile | Predefinito | Descrizione |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Installa un account e uno spazio demo (15 arnie distribuite su 4 apiari, ripristinato ogni ora). Implica `BEEHIVE_PASSWORD_AUTH=true`. |
| `BEEHIVE_DEMO_AUTOLOGIN` | `false` | Fa accedere direttamente alla demo i visitatori anonimi invece di mostrare la schermata di accesso. Solo per host di pura dimostrazione; lascialo disattivato su un'istanza che serve anche utenti reali. |
| `BEEHIVE_DEMO_EMAIL` | `demo@app.openbeehive.org` | Email dell'account demo. |
| `BEEHIVE_DEMO_PASSWORD` | `demo` | Password dell'account demo. |

## WebAuthn / passkey

Autenticazione senza password facoltativa tramite passkey.

| Variabile                  | Predefinito | Descrizione                                                            |
| ------------------------- | ------- | --------------------------------------------------------------------- |
| `BEEHIVE_WEBAUTHN_ENABLED`        | `false` | Abilita il login con WebAuthn / passkey.                                     |
| `BEEHIVE_WEBAUTHN_RP_ID`          | host di `BEEHIVE_PUBLIC_BASE_URL` | ID del Relying Party, normalmente il tuo dominio nudo (ad esempio `openbeehive.org`). |
| `BEEHIVE_WEBAUTHN_RP_ORIGINS`     | `BEEHIVE_PUBLIC_BASE_URL` | Origini consentite per le cerimonie WebAuthn, separate da virgola. |
| `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME`| `Openbeehive` | Nome leggibile mostrato agli utenti durante la registrazione.              |

## Provider OIDC

Accesso tramite provider di identità esterni via OpenID Connect. È possibile abilitare più provider contemporaneamente.

| Variabile             | Predefinito | Descrizione                                                              |
| -------------------- | ------- | ----------------------------------------------------------------------- |
| `BEEHIVE_OIDC_PROVIDERS`     | (vuoto) | Elenco separato da virgole dei provider abilitati, ad esempio `google,keycloak`. Ogni provider elencato ha bisogno del proprio issuer e del proprio client id, altrimenti il server rifiuta di avviarsi. |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | L'URL di callback a cui i provider reindirizzano dopo il login.                     |

Ogni provider ha poi le proprie variabili: `BEEHIVE_OIDC_<NAME>_ISSUER`,
`BEEHIVE_OIDC_<NAME>_CLIENT_ID`, `BEEHIVE_OIDC_<NAME>_CLIENT_SECRET` e, facoltativamente,
`BEEHIVE_OIDC_<NAME>_SCOPES` (predefinito `openid,profile,email`), dove `<NAME>` è il nome del
provider in maiuscolo. Ad esempio:

```bash
# Google
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile

# Keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/beekeepers
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=...
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=...
```

:::tip[Utente singolo, nessun login]
Per un'istanza personale self-hosted puoi saltare del tutto il login: lascia `BEEHIVE_PASSWORD_AUTH` disattivato (il valore predefinito di selfhost), `BEEHIVE_OIDC_PROVIDERS` vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false`. L'app viene quindi eseguita in modalità a utente singolo senza alcun passaggio di accesso.
:::

Per le procedure guidate di configurazione dei provider, gli URL di reindirizzamento e i consigli sulla sicurezza, consulta [Autenticazione](./authentication.md).

## Un esempio selfhost minimale

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://192.168.1.20:8080
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth: single-user mode, no session secret needed
```

Se abiliti l'autenticazione con password per un'istanza di famiglia o di un'associazione,
aggiungi il segreto di sessione e l'amministratore dedicato:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
# Paste the output of: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

Aggiungi un reverse proxy davanti per l'HTTPS, imposta `BEEHIVE_TRUST_PROXY_HEADERS=true` dietro di esso, e sei pronto a tenere i tuoi registri.

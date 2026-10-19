---
sidebar_position: 4
title: "Configurazione"
---

# Configurazione

Openbeehive viene configurato interamente tramite variabili d'ambiente. Questa pagina è il riferimento completo.

Puoi impostare queste variabili nella tua shell, in un file `.env` accanto al binario, nel tuo file `docker compose` o tramite il gestore di segreti della tua piattaforma di hosting. Il server le legge una volta all'avvio, quindi le modifiche hanno effetto dopo un riavvio.

:::tip Inizia in piccolo
Te ne servono solo una manciata per iniziare. Per un server domestico a utente singolo, imposta `BEEHIVE_DEPLOYMENT_PROFILE=selfhost`, un `BEEHIVE_SESSION_SECRET` e lascia il resto ai valori predefiniti. Consulta la [Guida rapida](/self-hosting/quick-start) per essere operativo in pochi minuti.
:::

## Come funziona il profilo di distribuzione

L'impostazione di gran lunga più importante è `BEEHIVE_DEPLOYMENT_PROFILE`. Sceglie valori predefiniti sensati per tutto il resto, così non devi specificare a mano l'intero stack.

| Profilo    | Database predefinito | Archiviazione blob predefinita | Pensato per                          |
| ---------- | ---------------- | -------------------- | ------------------------------------- |
| `selfhost` | SQLite (file)    | Filesystem locale     | Un singolo binario, niente Docker, un host  |
| `cloud`    | PostgreSQL       | MinIO / S3           | La distribuzione ospitata e multi-tenant   |

Il profilo imposta solo i *valori predefiniti*. Qualsiasi variabile che imposti esplicitamente ha sempre la precedenza. Ad esempio, puoi eseguire il profilo `selfhost` ma indirizzarlo a PostgreSQL impostando tu stesso `BEEHIVE_DATABASE_DRIVER` e `BEEHIVE_DATABASE_DSN`.

:::note
I due profili sono documentati in dettaglio nelle rispettive pagine: [Binario singolo](/self-hosting/single-binary) e [Docker](/self-hosting/docker). Questa pagina si concentra sulle variabili stesse.
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
| `BEEHIVE_HTTP_READ_TIMEOUT` | `0` | Limite di lettura dell'intera richiesta; `0` significa nessuno. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `0` | Limite di scrittura della risposta; `0` significa nessuno. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Per quanto tempo una connessione keep-alive inattiva resta aperta. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Periodo di tolleranza per le richieste in corso allo spegnimento. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` deve corrispondere all'indirizzo che gli utenti visitano effettivamente. Se è errato, i reindirizzamenti di login e i link di invito puntano al posto sbagliato.
:::

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
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | `*`     | Elenco separato da virgole delle origini consentite. Limitalo al tuo dominio in produzione. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Se consentire richieste cross-origin con credenziali (cookie, header di autenticazione). |

:::caution
Un'origine jolly (`*`) combinata con `BEEHIVE_CORS_ALLOW_CREDENTIALS=true` è permissiva. Se servi l'app da un'unica origine, imposta `BEEHIVE_CORS_ALLOWED_ORIGINS` su quell'esatta origine.
:::

## Sincronizzazione

| Variabile  | Predefinito  | Descrizione                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | `server` | Identificatore di questo nodo nel protocollo di sincronizzazione. Usato dall'Hybrid Logical Clock per etichettare gli eventi. Mantienilo stabile e univoco per ogni server. |

Il motore di sincronizzazione senza conflitti (HLC più last-writer-wins per campo e OR-Set add-wins) richiede che ogni partecipante abbia un'identità stabile. Modificare `BEEHIVE_NODE_ID` su un server attivo non è consigliato.

## Database

| Variabile          | Predefinito            | Descrizione                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | dal profilo       | Motore del database: `postgres`, `mysql` o `sqlite`.                           |
| `BEEHIVE_DATABASE_DSN`    | dal profilo       | Stringa di connessione per il driver scelto (vedi sotto).                       |

DSN di esempio per driver:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MySQL
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Per la scelta del driver, l'ottimizzazione e le note sulla migrazione, consulta [Database](/self-hosting/databases).

## Archiviazione blob

Le foto e gli altri allegati vengono archiviati come blob, sul filesystem locale o in un object store compatibile con S3.

| Variabile          | Predefinito        | Descrizione                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | dal profilo   | Backend di archiviazione: `fs` (filesystem locale) o `minio` (MinIO / S3).       |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Directory per i blob quando `BEEHIVE_BLOB_BACKEND=fs`.                             |
| `BEEHIVE_BLOB_PUBLIC_URL` | `<BEEHIVE_PUBLIC_BASE_URL>/files` | URL di base da cui i file archiviati vengono serviti ai browser. Cambialo solo se un proxy o una CDN serve la directory dei blob da un altro indirizzo. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host e porta dell'endpoint MinIO / S3.                              |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Chiave di accesso per l'object store.                                        |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Chiave segreta per l'object store.                                        |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Nome del bucket in cui vengono archiviati i blob.                                     |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Imposta `true` per connetterti all'endpoint tramite HTTPS.                       |

Le variabili `MINIO_*` vengono usate solo quando `BEEHIVE_BLOB_BACKEND=minio`. Per indicazioni complete, consulta [Archiviazione](/self-hosting/storage).

## Sessione e autenticazione

| Variabile         | Predefinito | Descrizione                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (vuoto) | Segreto usato per firmare i cookie di sessione. Generane uno con `openssl rand -base64 32`. Obbligatorio in produzione. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | Per quanto tempo dura una sessione prima che sia richiesta una nuova autenticazione (ad esempio `720h` corrisponde a 30 giorni).      |

:::danger
Imposta sempre un `BEEHIVE_SESSION_SECRET` robusto e univoco e tienilo privato. Se trapela o cambia, tutte le sessioni esistenti vengono invalidate.
:::

## Email, password e onboarding

Account integrati per istanze multi-utente senza un provider di identità esterno.
L'amministratore dell'istanza è un account dedicato che configuri tu, non la prima persona
che si registra. Consulta [Autenticazione](/self-hosting/authentication).

| Variabile | Predefinito | Descrizione |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | attivo per `cloud`, disattivo per `selfhost` | Abilita la registrazione e l'accesso tramite email/password. Implicito anche da `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (vuoto) | Email dell'amministratore dell'istanza. **Obbligatoria ogni volta che l'autenticazione con password è abilitata.** L'account viene garantito a ogni avvio: creato se manca e con il ruolo forzato ad amministratore. La registrazione non concede mai il ruolo di amministratore. |
| `BEEHIVE_ADMIN_PASSWORD` | (vuoto) | Password dell'amministratore dell'istanza, almeno 8 caratteri. Fa fede a ogni avvio: la password memorizzata viene reimpostata a questo valore, il che funge anche da recupero della password. |
| `BEEHIVE_REGISTRATION` | `true` | Registrazione autonoma aperta. Imposta `false` per un'istanza solo su invito: a parte l'amministratore configurato, gli account possono essere creati solo tramite link di invito, e la schermata di accesso mostra un avviso che l'istanza è solo su invito. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Richiede la conferma via email prima che un nuovo account possa accedere. |
| `BEEHIVE_SMTP_HOST` | (vuoto) | Server SMTP per le email di verifica/invito. Se vuoto, i link vengono scritti nel log. |
| `BEEHIVE_SMTP_PORT` | `587` | Porta SMTP. |
| `BEEHIVE_SMTP_USER` | (vuoto) | Nome utente SMTP. |
| `BEEHIVE_SMTP_PASS` | (vuoto) | Password SMTP. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Indirizzo mittente per la posta in uscita. |

## Tenant demo

Installa un account e un tenant demo dimostrativi. Disattivato per impostazione predefinita — consulta
[Modalità demo](/self-hosting/demo).

| Variabile | Predefinito | Descrizione |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Installa un account + tenant demo (15 arnie distribuite su 4 apiari, ripristinato ogni ora). Implica `BEEHIVE_PASSWORD_AUTH=true`. |
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
| `BEEHIVE_OIDC_PROVIDERS`     | (vuoto) | Elenco separato da virgole dei provider abilitati, ad esempio `google,keycloak`.      |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | L'URL di callback a cui i provider reindirizzano dopo il login.                     |

Ogni provider ha poi le proprie variabili: `BEEHIVE_OIDC_<NOME>_ISSUER`,
`BEEHIVE_OIDC_<NOME>_CLIENT_ID`, `BEEHIVE_OIDC_<NOME>_CLIENT_SECRET` e, facoltativamente,
`BEEHIVE_OIDC_<NOME>_SCOPES` (predefinito `openid,profile,email`), dove `<NOME>` è il nome del
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

:::tip Utente singolo, nessun login
Per un'istanza personale self-hosted puoi saltare del tutto il login: lascia `BEEHIVE_PASSWORD_AUTH` disattivato (il valore predefinito di selfhost), `BEEHIVE_OIDC_PROVIDERS` vuoto e `BEEHIVE_WEBAUTHN_ENABLED=false`. L'app viene quindi eseguita in modalità a utente singolo senza alcun passaggio di accesso.
:::

Per le procedure guidate di configurazione dei provider, gli URL di reindirizzamento e i consigli sulla sicurezza, consulta [Autenticazione](/self-hosting/authentication).

## Un esempio selfhost minimale

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth — single-user mode
```

Se abiliti l'autenticazione con password per un'istanza di famiglia o di un'associazione,
aggiungi anche l'amministratore dedicato:

```bash
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

Questo è tutto ciò di cui ha bisogno un singolo apicoltore. Aggiungi un reverse proxy davanti per l'HTTPS e sei pronto a tenere i tuoi registri.

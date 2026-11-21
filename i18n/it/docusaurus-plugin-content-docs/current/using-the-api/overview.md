---
sidebar_position: 1
title: "Panoramica delle API"
---

# Le API di Openbeehive

Il server espone un'API [Connect-RPC](https://connectrpc.com/) definita in
Protocol Buffers sotto
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Ogni RPC è raggiungibile tramite HTTP/JSON semplice, gRPC e gRPC-Web dallo stesso
URL. L'app stessa usa solo `SyncService` e gli endpoint HTTP semplici per
foto, esportazione e account; gli altri servizi esistono per script, sensori
e integrazioni.

## URL di base e forma del percorso

L'API è servita dallo stesso processo dell'app, sulla stessa origine:

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
```

Ad esempio `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`
sul servizio in hosting, oppure la tua origine se fai self-hosting.

## Servizi serviti

Sul server sono registrati dieci servizi (`server/cmd/server/main.go`):

| Servizio | RPC |
| --- | --- |
| `ApiaryService` | `CreateApiary`, `GetApiary`, `ListApiaries`, `UpdateApiary`, `DeleteApiary` |
| `HiveService` | `CreateHive`, `GetHive`, `ListHives`, `UpdateHive`, `DeleteHive`, `RelocateHive` |
| `QueenService` | `CreateQueen`, `ListQueens`, `UpdateQueen`, `DeleteQueen` |
| `InspectionService` | `CreateInspection`, `ListInspections`, `UpdateInspection`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `UpdateTask`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `UpdateTreatment`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `UpdateHarvest`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Snapshot`, `Push`, `Subscribe` (stream lato server); gli script inviano l'intestazione `Openbeehive-Sync-Protocol: 1`, vedi [Protocollo di sincronizzazione](../developers/sync-protocol.md#versions) |

Ogni RPC è limitato allo spazio attivo del chiamante (chiamato `tenant` o
`organization` nei percorsi e nei nomi dei campi). Gli id di un altro spazio
si comportano come id sconosciuti (`not_found`).

Un messaggio RPC può essere al massimo di 16 MiB, e una richiesta diversa
dallo stream `Subscribe` può durare al massimo 2 minuti.

### Le scritture passano dalla sincronizzazione \{#writes-go-through-sync}

Ogni RPC di scrittura (`Create*`, `Update*`, `Delete*`, `RelocateHive`,
`SetTaskDone`, `AddInspectionPhoto`, `RemoveInspectionPhoto`) viene applicato
tramite la stessa unione per campo e aggiunto allo stesso registro delle
modifiche di `SyncService.Push`. Una riga scritta tramite l'API raggiunge ogni
dispositivo alla sua sincronizzazione successiva, e una modifica successiva da
un dispositivo si unisce ad essa campo per campo, esattamente come le modifiche
di due dispositivi si uniscono tra loro. Le cancellazioni sono logiche: la riga
riceve una tombstone (`deleted = 1`) e scompare dagli elenchi e dall'app.

Le scritture lato server rispecchiano i flussi dell'app stessa
(`server/internal/service/writer.go` è un port di
`app/src/lib/local/history.ts`), quindi la storia che un dispositivo mostra è
la stessa sia che un record sia stato inserito nell'app sia tramite l'API:

- `CreateHive` scrive l'arnia, apre un intervallo di collocazione e registra
  un evento `CREATED`. Le nuove arnie partono come `HIVE_STATUS_ACTIVE`.
- `RelocateHive` chiude la collocazione aperta, ne apre una nuova nell'apiario
  di destinazione e registra un evento `MOVED`. `UpdateHive` non sposta mai
  un'arnia.
- `CreateQueen` termina il regno della regina attiva dell'arnia
  (`active = false`, `replacedAt` impostato all'`introducedAt` della nuova
  regina), registra gli eventi `QUEEN_REPLACED` e `QUEEN_INTRODUCED`, e
  ricava il colore di marcatura da `year` quando non ne invii uno.
- `CreateInspection` e `CreateTreatment` fissano l'apiario e la regina
  regnante alla `date` del record (un record retrodatato viene risolto
  rispetto alla storia delle collocazioni e delle regine) e registrano un
  evento `INSPECTION` o `TREATMENT`.
- `CreateHarvest` fissa allo stesso modo l'apiario e la regina regnante alla
  `date`, scrive la riga del raccolto e registra un evento `HARVEST` che porta
  `amountKg` e il titolo `<kg> kg <variety>` (`Honey` quando `variety` è
  vuoto). `GetDashboard` e `GetHoneyStats` sommano quegli eventi, quindi un
  raccolto inviato tramite l'API conta subito nelle cifre sul miele.
  `amountKg` deve essere maggiore di `0`.
- Un'attività con `hiveId` o `apiaryId` si sincronizza sotto quell'apiario ed
  è condivisa con tutti coloro che lo vedono; un'attività senza nessuno dei
  due vive nello scope personale del chiamante: raggiunge solo i dispositivi
  di quell'utente e `ListTasks` la restituisce solo al suo proprietario.
- `CreateInspection` con `source: INSPECTION_SOURCE_SENSOR` memorizza una
  lettura di un sensore invece di una visita; vedi
  [Tracker automatici](./automated-trackers.md).

Le correzioni e le cancellazioni mantengono coerente la storia:

- `UpdateInspection`, `UpdateTreatment` e `UpdateHarvest` correggono un record
  salvato. Il loro evento della cronologia segue la modifica, e quando `date`
  cambia l'apiario e la regina vengono risolti di nuovo per la nuova data.
  Trattamenti e raccolti ricevono `amendedAt` impostato all'ora della modifica.
- `DeleteInspection`, `DeleteTreatment`, `DeleteHarvest` e `DeleteQueen`
  rimuovono anche gli eventi della cronologia del record, quindi un raccolto
  eliminato non conta più nelle cifre sul miele.
- `DeleteHive` elimina anche le attività aperte dell'arnia. `DeleteApiary`
  fallisce con `failed_precondition` finché l'apiario ha ancora arnie:
  spostale con `RelocateHive` oppure eliminale prima.

### Gli aggiornamenti cambiano solo ciò che invii \{#partial-updates}

Ogni RPC `Update*` è un aggiornamento parziale con le stesse due modalità:

- **Senza `updateMask`:** ogni campo che lasci al suo valore zero (`""`, `0`,
  `false`, non impostato) mantiene il valore memorizzato. Invia solo ciò che
  cambia.
- **Con `updateMask`:** vengono scritti esattamente i campi elencati, anche al
  loro valore zero. È così che svuoti una nota, rimuovi una scadenza o riapri
  un'attività. In JSON la maschera è una stringa di nomi di campo separati da
  virgola: `"updateMask": "note,dueAt"`.

Una richiesta che non cambierebbe nulla viene rifiutata con `invalid_argument`.
I campi che identificano il record (`id`, `hiveId`, lo spazio) non possono
essere modificati; un'arnia cambia apiario solo tramite `RelocateHive`.

Le letture (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`)
interrogano direttamente le tabelle del server. Mostrano subito le scritture
dell'API e quelle dei dispositivi non appena il dispositivo le ha inviate.

### Foto \{#photos}

`Inspection.photos` elenca le foto di un'ispezione e `Hive.picture` l'immagine
dell'arnia, ciascuna come `Photo` con `id`, `thumbnail` (un data URL di circa
200 px), `contentType`, `sizeBytes`, `createdAt` e `path`. L'immagine a piena
risoluzione si ottiene con un semplice `GET` di `path` (`/photos/<id>`) sullo
stesso host, con le stesse credenziali degli RPC; `path` è vuoto finché il
dispositivo che ha scattato la foto non ha caricato l'immagine.
`AddInspectionPhoto` aggiunge un'immagine JPEG, PNG o WebP di al massimo
5 MiB, `RemoveInspectionPhoto` elimina una foto definitivamente, su ogni
dispositivo. `photoKeys` contiene solo le foto incorporate delle app 0.4.x.
Vedi [REST](./rest.md#photos).

### Non ancora nell'API

- **Nessun RPC per le collocazioni.** Le collocazioni vengono scritte da
  `CreateHive` e `RelocateHive` e compaiono solo nel feed di sincronizzazione.
- `EventService` è in sola lettura. Gli eventi vengono scritti dai flussi qui
  sopra e dall'app.

Vedi il [protocollo di sincronizzazione](../developers/sync-protocol.md) per il
formato delle modifiche e il [modello dei dati](../developers/data-model.md) per le
colonne dietro ogni messaggio.

## Endpoint non RPC

Accanto ai servizi RPC ci sono alcuni endpoint HTTP semplici:

| Percorso | Scopo |
| --- | --- |
| `GET /healthz` | Restituisce `ok` una volta che il server è in ascolto (il primo avvio della 0.5.0 converte prima le foto incorporate) |
| `GET /photos/<id>`, `POST /photos/<id>` | Immagini delle foto a piena risoluzione: lettura, oppure caricamento dell'immagine di un record di foto già sincronizzato; sessione o chiave API, solo per i membri dello spazio. Vedi [REST](./rest.md#photos) |
| `GET /export`, `GET /export?photos=1` | Lo spazio attivo come JSON, oppure come ZIP con le foto; sessione o chiave API di scrittura. Vedi [REST](./rest.md#export) |
| `GET /auth/instance` | Ciò che l'istanza offre (metodi di login, demo, registrazione, impostazioni della mappa); sempre presente, non servono credenziali |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Account con e-mail/password (`BEEHIVE_PASSWORD_AUTH=true`) |
| `POST /auth/password/change`, `POST /auth/password/reset-request`, `POST /auth/password/reset`, `POST /auth/admin/reset-link` | Cambiare una password; richiedere e completare una reimpostazione; un link di reimpostazione creato dall'admin dell'istanza (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` impostata) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkey (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, `POST /auth/switch`, `POST /auth/accept-invite`, `POST /auth/session/recover` | Helper per sessione e spazio, presenti quando è abilitato un qualsiasi metodo di login |
| `GET /auth/invite?token=...` | Il nome dello spazio, l'indirizzo email mascherato (`j…@e….org`) e la scadenza di un invito, senza credenziali; gli inviti sconosciuti, usati o revocati rispondono `400` `invite_invalid`, quelli scaduti `invite_expired` |
| `GET /auth/account`, `POST /auth/account/delete` | Che cosa comporterebbe eliminare l'account, ed eliminarlo |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | Gestione delle chiavi API (elenco, creazione, rimozione), presente quando è abilitato un qualsiasi metodo di login; solo con sessione, una chiave non può chiamarli |
| `POST /tenants/create`, `POST /tenants/invite`, `GET /tenants/invites`, `POST /tenants/invite/revoke`, `POST /tenants/delete` | Amministrazione degli spazi, presente quando è abilitato un qualsiasi metodo di login |
| `GET /tenants/members`, `POST /tenants/members/remove`, `POST /tenants/members/role`, `POST /tenants/leave` | Membri di uno spazio: elenco, rimozione, cambio di ruolo, uscita |
| `POST /auth/demo-login` | Solo con `BEEHIVE_DEMO=true` |

Questi endpoint sono usati dalle schermate di login e impostazioni dell'app. Non
fanno parte del contratto proto. Gli endpoint `/auth/*` e `/tenants/*`
seguono tutti le stesse regole:

- Ogni endpoint accetta solo il metodo indicato; qualsiasi altro risponde
  `405` con un'intestazione `Allow`.
- Gli endpoint `POST` che accettano un corpo richiedono
  `Content-Type: application/json` (altrimenti `415`), e il corpo può essere
  al massimo di 64 KiB.
- Le richieste `POST` provenienti da una pagina del browser su un altro sito
  vengono rifiutate con `403` (`cross_site_request`). Gli script, che non
  inviano alcuna intestazione `Origin`, non sono interessati.
- `/tenants/delete` e `/tenants/leave` richiedono `{"org_id": "..."}`; non
  esiste un valore predefinito.
- `POST /tenants/invite` risponde `409` `already_member` per chi è già
  nello spazio. Invitare un indirizzo con un invito aperto sostituisce
  quell'invito (il vecchio link smette di funzionare) e la risposta contiene
  `"renewed": true`.
- Le pagine che un browser apre direttamente (`/auth/verify`, `/auth/login`,
  `/auth/callback`) rispondono a un errore con un reindirizzamento a
  `/login?error=<code>` invece che con JSON.
- Gli errori sono JSON, `{"error": "<plain English>", "code": "<snake_case>"}`.
  I codici sono elencati nella [pagina REST](./rest.md#http-error-codes).

## Autenticazione \{#authentication}

Il modo in cui una richiesta viene autenticata dipende dal fatto che l'istanza
abbia o meno un metodo di login:

- **Nessun login configurato** (self-hosted, `BEEHIVE_PASSWORD_AUTH=false`,
  `BEEHIVE_OIDC_PROVIDERS` vuota, `BEEHIVE_WEBAUTHN_ENABLED=false`): ogni
  richiesta viene eseguita come l'utente locale fisso. Non inviare credenziali.
  Su un'istanza del genere non esistono chiavi API; non ne servono.
- **Login configurato**: ogni RPC richiede una chiave API o un token di
  sessione in `Authorization: Bearer <token>` (per i token di sessione è
  accettato anche il cookie `obh_session`). Una richiesta senza un token
  valido riceve il codice Connect `unauthenticated` (HTTP 401).

### Chiavi API

Una chiave API è la credenziale consigliata per script, sensori e
integrazioni. Le chiavi si gestiscono nell'app in **Impostazioni → Spazio → Chiavi API**
(vedi [Account e spazi](../using-the-app/accounts-tenants.md#api-keys)):

1. Accedi, passa allo spazio in cui lo script deve scrivere e apri
   **Impostazioni → Spazio → Chiavi API**.
2. Digita un nome (per esempio `hive scale`), scegli i permessi (**Lettura e
   scrittura** o **Sola lettura**) e una scadenza (**Non scade**, **30 giorni**,
   **90 giorni** o **1 anno**), poi tocca **Crea chiave**. La chiave inizia con
   `obhk_` e viene mostrata una sola volta; copiala subito. Il server memorizza
   solo il suo hash SHA-256 e i primi 12 caratteri per la visualizzazione.
3. Inviala a ogni RPC:

```text
Authorization: Bearer obhk_...
```

Cosa una chiave può e non può fare:

- Agisce come il suo proprietario, con il ruolo del proprietario, all'interno
  dello spazio che era attivo quando la chiave è stata creata. Non può cambiare
  spazio; crea una chiave per ogni spazio se uno script ne ha bisogno di più
  di uno.
- Funziona sugli RPC, su `/photos/` e su `/export`. Gli endpoint `/auth/*` e
  `/tenants/*`, compresa la gestione delle chiavi stessa, richiedono una sessione vera: una chiave non
  può elencare, creare o rimuovere chiavi.
- Ha uno di due scope, fissato alla creazione. Una chiave `write` (il valore
  predefinito) può chiamare ogni RPC che il suo proprietario può chiamare. Una
  chiave `read` può chiamare solo gli RPC il cui nome inizia con `Get` o
  `List`, più `Pull`, `Snapshot` e `Subscribe`. Ogni altro RPC restituisce il
  codice Connect `permission_denied` (HTTP 403) con il messaggio
  `this API key is read-only`. Una chiave `read` può scaricare le foto ma non
  caricarle, e non può usare `/export`.
- Scade solo se imposti una scadenza: `expires_in_days` da `0` (mai, il valore
  predefinito) a `3650`. Superato `expires_at` ogni RPC restituisce
  `unauthenticated` (HTTP 401) con il messaggio `API key expired`. Le chiavi
  scadute restano nell'elenco finché non le rimuovi.
- Smette di funzionare nel momento in cui viene rimossa nelle Impostazioni, e
  muore con l'appartenenza: quando il proprietario lascia lo spazio o ne viene
  rimosso, la chiave viene rifiutata.
- Ogni utilizzo aggiorna `last_used_at`, mostrato come **Ultimo utilizzo**
  nelle Impostazioni.
- L'account demo non può creare chiavi.

Gli stessi endpoint usati dall'app sono aperti a uno script autenticato con
sessione:

- `GET /auth/api-keys` restituisce `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, solo le tue chiavi nello
  spazio attivo. `scope` è `"write"` o `"read"`; `expires_at` e
  `last_used_at` sono timestamp RFC 3339 oppure `null`; `mine` qui è sempre
  `true`.
- `GET /auth/api-keys?tenant=1` restituisce ogni chiave dello spazio attivo,
  con ogni riga che porta in più `user_id`, `user_email` e un flag `mine`
  che è `true` sulle tue chiavi. Possono chiamarlo solo il proprietario dello
  spazio (il ruolo che l'app chiama **Admin**) e l'admin dell'istanza; tutti
  gli altri ricevono HTTP 403.
- `POST /auth/api-keys` con `{"name": "...", "scope": "write",
  "expires_in_days": 0}` restituisce `{id, name, prefix, scope, created_at,
  expires_at, token}`. Se omessi, `scope` vale `"write"` e `expires_in_days`
  vale `0` (mai). Qualsiasi altro scope, o una durata inferiore a `0` o
  superiore a `3650`, risponde HTTP 400.
- `POST /auth/api-keys/delete` con `{"id": "..."}` risponde `204`. Un membro
  può rimuovere solo le proprie chiavi; l'id di qualcun altro risponde 404.
  Il proprietario dello spazio e l'admin dell'istanza possono rimuovere
  qualsiasi chiave dello spazio attivo. L'override non attraversa mai gli
  spazi: il proprietario di un altro spazio riceve 404 per le chiavi che
  non sono sue.

### Accesso con sessione

L'alternativa è il token di sessione dell'app, un valore firmato con HMAC che
il server emette al login. È accettato sugli RPC e sugli endpoint `/auth/*` e
`/tenants/*`. Con l'autenticazione a password abilitata uno script ne ottiene
uno con:

```bash
curl -s -X POST https://bees.example.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
```

La risposta JSON contiene `token`; lo stesso valore viene impostato anche come
cookie `obh_session`. Il token scade dopo `BEEHIVE_SESSION_TTL`.
Gli accessi falliti vengono limitati: dopo 10 tentativi falliti per un account
o 30 da un indirizzo nell'arco di 15 minuti l'endpoint risponde `429`
(`rate_limited`) con un'intestazione `Retry-After`.

Il token porta con sé lo spazio attivo dell'account. `GET /auth/me` elenca gli
spazi a cui appartieni (`tenants`) e quello attivo (`active_org`);
`POST /auth/switch` con `{"org_id": "..."}` restituisce un nuovo `token` per
un altro spazio.

`POST /auth/logout-all` termina ogni altra sessione dell'account e restituisce
un nuovo `token` al chiamante. Inoltre, a ogni richiesta il server verifica
che l'account sia ancora membro dello spazio; una sessione revocata o
un'appartenenza persa viene rifiutata entro circa 10 secondi.

Con `BEEHIVE_DEMO=true` le sessioni demo sono in sola lettura: l'account demo
può chiamare solo gli RPC il cui nome inizia con `Get` o `List`, più `Pull`,
`Snapshot` e `Subscribe`. Ogni altro RPC restituisce `permission_denied`.

Vedi [Autenticazione](../self-hosting/authentication.md) per come configurare i
metodi di login.

## Pagine sui protocolli

- [REST / HTTP + JSON](./rest.md): esempi con curl, la forma del
  JSON e il contratto di paginazione.
- [gRPC](./grpc.md): client generati e la chiamata in streaming
  `Subscribe`.
- [Tracker automatici](./automated-trackers.md): inviare letture di
  bilance e sensori climatici da uno script o da un dispositivo.

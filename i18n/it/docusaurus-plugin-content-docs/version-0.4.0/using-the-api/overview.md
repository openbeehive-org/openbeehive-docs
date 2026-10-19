---
sidebar_position: 1
title: "Panoramica delle API"
---

# Le API di Openbeehive

Il server espone un'API [Connect-RPC](https://connectrpc.com/) definita in
Protocol Buffers sotto
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Ogni RPC è raggiungibile tramite HTTP/JSON semplice, gRPC e gRPC-Web dallo stesso
URL. L'app stessa usa solo `SyncService`; gli altri servizi esistono per
script, sensori e integrazioni.

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
| `InspectionService` | `CreateInspection`, `ListInspections`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Push`, `Subscribe` (stream lato server) |

Ogni RPC è limitato al tenant attivo del chiamante. Gli id di un altro tenant
si comportano come id sconosciuti (`not_found`).

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
  due vive nello scope personale del chiamante e raggiunge solo i dispositivi
  di quell'utente.

Le letture (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`)
interrogano direttamente le tabelle del server. Mostrano subito le scritture
dell'API e quelle dei dispositivi non appena il dispositivo le ha inviate.

### Non ancora nell'API

- **Nessun RPC di modifica dei raccolti.** `HarvestService` ha solo
  `CreateHarvest`, `ListHarvests` e `DeleteHarvest`. Per correggere un
  raccolto, eliminalo e crealo di nuovo, oppure modificalo nell'app.
- **Nessun RPC per le collocazioni.** Le collocazioni vengono scritte da
  `CreateHive` e `RelocateHive` e compaiono solo nel feed di sincronizzazione.
- `EventService` è in sola lettura. Gli eventi vengono scritti dai flussi qui
  sopra e dall'app.

Vedi il [protocollo di sincronizzazione](/developers/sync-protocol) per il
formato delle modifiche e il [modello dei dati](/developers/data-model) per le
colonne dietro ogni messaggio.

## Endpoint non RPC

Accanto ai servizi RPC ci sono alcuni endpoint HTTP semplici:

| Percorso | Scopo |
| --- | --- |
| `GET /healthz` | Restituisce `ok` |
| `GET /files/<key>` | File archiviati, solo con il backend blob su filesystem (`BEEHIVE_BLOB_BACKEND=fs`) |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Account con e-mail/password (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` impostata) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkey (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `/auth/logout`, `/auth/me`, `/auth/instance`, `/auth/switch`, `/auth/accept-invite` | Helper per sessione e tenant, presenti quando è abilitato un qualsiasi metodo di login |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | Gestione delle chiavi API (elenco, creazione, rimozione), presente quando è abilitato un qualsiasi metodo di login; solo con sessione, una chiave non può chiamarli |
| `/tenants/create`, `/tenants/invite`, `/tenants/invites`, `/tenants/invite/revoke`, `/tenants/delete` | Amministrazione dei tenant, presente quando è abilitato un qualsiasi metodo di login |
| `POST /auth/demo-login` | Solo con `BEEHIVE_DEMO=true` |

Questi endpoint sono usati dalle schermate di login e impostazioni dell'app. Non
fanno parte del contratto proto.

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
integrazioni. Le chiavi si gestiscono nell'app in **Impostazioni → Chiavi API**
(vedi [Account e tenant](../using-the-app/accounts-tenants.md#api-keys)):

1. Accedi, passa al tenant in cui lo script deve scrivere e apri
   **Impostazioni → Chiavi API**.
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
  del tenant che era attivo quando la chiave è stata creata. Non può cambiare
  tenant; crea una chiave per ogni tenant se uno script ne ha bisogno di più
  di uno.
- Funziona solo sugli RPC. Gli endpoint `/auth/*` e `/tenants/*`, compresa la
  gestione delle chiavi stessa, richiedono una sessione vera: una chiave non
  può elencare, creare o rimuovere chiavi.
- Ha uno di due scope, fissato alla creazione. Una chiave `write` (il valore
  predefinito) può chiamare ogni RPC che il suo proprietario può chiamare. Una
  chiave `read` può chiamare solo gli RPC il cui nome inizia con `Get`, `List`,
  `Pull` o `Subscribe`; ogni altro RPC restituisce il codice Connect
  `permission_denied` (HTTP 403) con il messaggio `this API key is read-only`.
- Scade solo se imposti una scadenza: `expires_in_days` da `0` (mai, il valore
  predefinito) a `3650`. Superato `expires_at` ogni RPC restituisce
  `unauthenticated` (HTTP 401) con il messaggio `API key expired`. Le chiavi
  scadute restano nell'elenco finché non le rimuovi.
- Smette di funzionare nel momento in cui viene rimossa nelle Impostazioni, e
  muore con l'appartenenza: quando il proprietario lascia il tenant o ne viene
  rimosso, la chiave viene rifiutata.
- Ogni utilizzo aggiorna `last_used_at`, mostrato come **Ultimo utilizzo**
  nelle Impostazioni.
- L'account demo non può creare chiavi.

Gli stessi endpoint usati dall'app sono aperti a uno script autenticato con
sessione:

- `GET /auth/api-keys` restituisce `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, solo le tue chiavi nel
  tenant attivo. `scope` è `"write"` o `"read"`; `expires_at` e
  `last_used_at` sono timestamp RFC 3339 oppure `null`; `mine` qui è sempre
  `true`.
- `GET /auth/api-keys?tenant=1` restituisce ogni chiave del tenant attivo,
  con ogni riga che porta in più `user_id`, `user_email` e un flag `mine`
  che è `true` sulle tue chiavi. Possono chiamarlo solo il proprietario del
  tenant (il ruolo che l'app chiama **Admin**) e l'admin dell'istanza; tutti
  gli altri ricevono HTTP 403.
- `POST /auth/api-keys` con `{"name": "...", "scope": "write",
  "expires_in_days": 0}` restituisce `{id, name, prefix, scope, created_at,
  expires_at, token}`. Se omessi, `scope` vale `"write"` e `expires_in_days`
  vale `0` (mai). Qualsiasi altro scope, o una durata inferiore a `0` o
  superiore a `3650`, risponde HTTP 400.
- `POST /auth/api-keys/delete` con `{"id": "..."}` risponde `204`. Un membro
  può rimuovere solo le proprie chiavi; l'id di qualcun altro risponde 404.
  Il proprietario del tenant e l'admin dell'istanza possono rimuovere
  qualsiasi chiave del tenant attivo. L'override non attraversa mai i
  tenant: il proprietario di un altro tenant riceve 404 per le chiavi che
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

Il token porta con sé il tenant attivo dell'account. `GET /auth/me` elenca i
tenant a cui appartieni (`tenants`) e quello attivo (`active_org`);
`POST /auth/switch` con `{"org_id": "..."}` restituisce un nuovo `token` per
un altro tenant.

Con `BEEHIVE_DEMO=true` le sessioni demo sono in sola lettura: l'account demo
può chiamare solo gli RPC il cui nome inizia con `Get`, `List`, `Pull` o
`Subscribe`. Ogni altro RPC restituisce `permission_denied`.

Vedi [Autenticazione](/self-hosting/authentication) per come configurare i
metodi di login.

## Pagine sui protocolli

- [REST / HTTP + JSON](/using-the-api/rest): esempi con curl, la forma del
  JSON e il contratto di paginazione.
- [gRPC](/using-the-api/grpc): client generati e la chiamata in streaming
  `Subscribe`.
- [Tracker automatici](/using-the-api/automated-trackers): inviare letture di
  bilance e sensori climatici da uno script o da un dispositivo.

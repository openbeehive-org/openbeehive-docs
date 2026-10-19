---
sidebar_position: 4
title: "Protocollo di sincronizzazione"
---

# Protocollo di sincronizzazione

L'app legge e scrive un database SQLite-WASM locale e lo riconcilia con il
server tramite `SyncService`. Questa pagina documenta il contratto di
trasmissione di `proto/openbeehive/v1/sync.proto` e le regole di unione in
`server/internal/sync/merge.go` e `app/src/lib/local/merge.ts`.

## Il servizio

```protobuf
service SyncService {
  rpc Pull(PullRequest) returns (PullResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

Il ciclo del client (`app/src/lib/local/sync.ts`, `syncOnce`): esegue il push
dell'outbox, poi il pull finché `has_more` non è false. Gira ogni 15 secondi,
dopo ogni scrittura locale e all'evento `online` del browser. Le esecuzioni sono
serializzate; una chiamata che arriva mentre una è in corso pianifica un
ulteriore passaggio. Il client non chiama `Subscribe`.

## Change

Ogni modifica di riga viaggia come un singolo `Change`:

```protobuf
enum ChangeOp {
  CHANGE_OP_UNSPECIFIED = 0;
  CHANGE_OP_UPSERT = 1;
  CHANGE_OP_DELETE = 2;
}

message Change {
  string entity = 1;       // table name: apiary, hive, queen, inspection, task,
                           // placement, harvest, treatment, event
  string entity_id = 2;    // row id (UUID minted on the device)
  string scope_id = 3;     // apiary id, or "user:<id>"
  ChangeOp op = 4;
  string payload_json = 5; // JSON object of changed columns; ignored on delete
  string hlc = 6;          // Hybrid Logical Clock of the write
  string author_id = 7;    // user id of the device or API caller that wrote it
}
```

`payload_json` è un delta parziale, non l'intera riga: il `patch()` del client
scrive solo le colonne che ha modificato. Le chiavi sono i nomi delle colonne in
`snake_case` del [modello dei dati](/developers/data-model). Una riga creata sul
dispositivo è un delta che contiene ogni colonna. Una cancellazione è
`op = CHANGE_OP_DELETE`; il ricevente imposta `deleted = true` e ignora il
payload.

Le colonne insieme (attualmente solo `inspection.photo_keys`) usano una forma di
payload diversa:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` elenca i tag di aggiunta che il dispositivo che rimuove aveva
osservato. I delta che ne sono privi (client più vecchi) rimuovono ogni tag
detenuto dal ricevente.

### Formato dell'HLC

`"<ms:15>:<counter:5>:<node>"`, per esempio
`001781234567890:00003:a1b2c3d4`. Orologio reale in millisecondi con zeri
iniziali fino a 15 cifre, un contatore a 5 cifre, poi un id di nodo (8 caratteri
casuali memorizzati in `localStorage` sul dispositivo; `BEEHIVE_NODE_ID`,
predefinito `server`, sul server). Il semplice confronto tra stringhe ordina gli
HLC. Entrambe le parti chiamano `recv()` su ogni HLC in arrivo così i loro
orologi restano avanti rispetto a tutto ciò che hanno visto.

## Pull

```protobuf
message PullRequest {
  string cursor = 1; // last seen server sequence, "" for a first sync
  int32 limit = 2;   // 0 = server default (200), max 500
}
message PullResponse {
  repeated Change changes = 1;
  string next_cursor = 2;
  bool has_more = 3;
}
```

Il cursore è la stringa decimale della sequenza di ricezione del server
(`change_log.seq`), non un HLC. Il server restituisce le righe con
`seq > cursor` il cui `scope_id` è nell'insieme di scope del chiamante,
ordinate per `seq`, e imposta `next_cursor` all'ultimo `seq` restituito (oppure
riporta il cursore della richiesta quando nulla corrisponde). Persisti
`next_cursor` solo dopo aver applicato l'intera pagina. `has_more` significa che
la pagina è stata tagliata a `limit`; esegui subito un altro pull.

Le righe negli scope che non puoi leggere consumano comunque numeri di sequenza,
quindi i valori che vedi hanno dei vuoti.

## Push

```protobuf
message PushRequest { repeated Change changes = 1; }
message Conflict {
  string entity = 1;
  string entity_id = 2;
  string winning_hlc = 3;
}
message PushResponse {
  string server_cursor = 1;      // global sequence after this push
  repeated Conflict conflicts = 2;
}
```

Il server elabora il lotto in una sola transazione:

1. `hlc.Recv(change.hlc)`.
2. I valori di `entity` sconosciuti vengono saltati.
3. `scope_id` deve essere nell'insieme di scope del chiamante, salvo che una
   modifica `apiary` il cui `scope_id` è uguale al proprio `entity_id` apre un
   nuovo scope. Qualsiasi altro scope sconosciuto fa fallire l'intero push con
   `permission_denied`.
4. L'`organization_id` del payload, se presente e non vuoto, deve corrispondere
   al tenant attivo del chiamante; una riga esistente deve appartenere a quel
   tenant. Le nuove righe vengono marcate con il tenant del chiamante. Una
   mancata corrispondenza fa fallire il push con `permission_denied`.
5. La modifica viene unita campo per campo (vedi sotto) e aggiunta a
   `change_log` con un nuovo `seq`.

`conflicts` è sempre vuoto nel server attuale: i campi obsoleti vengono scartati
silenziosamente durante l'unione e il valore più recente arriva al `Pull`
successivo. `server_cursor` è la sequenza globale dopo il push; il client lo
memorizza come proprio cursore, il che evita di riscaricare le proprie modifiche.

Il client scarta l'intero lotto dell'outbox quando `Push` restituisce
`permission_denied` (sessione demo in sola lettura oppure uno scope non
scrivibile). Le righe restano nelle tabelle locali; viene abbandonato solo il
caricamento. Qualsiasi altro errore conserva l'outbox per l'esecuzione
successiva.

## Regole di unione

Entrambe le parti applicano lo stesso algoritmo (`applyChange` in
`server/internal/service/sync.go`, `applyRemote` in
`app/src/lib/local/sync.ts`).

Ogni tabella sincronizzata ha una colonna `field_hlc` che contiene una mappa
JSON `{ "<column>": "<hlc>" }`, l'orologio dei campi.

**Nuova riga.** Inserisce ogni colonna del payload e marca ciascuna con l'HLC
della modifica.

**Riga esistente, colonna scalare.** Applica il valore solo se l'HLC della
modifica è maggiore della voce di quella colonna in `field_hlc`, poi aggiorna
quella voce. Due dispositivi che modificano colonne diverse della stessa riga
vincono entrambi; due dispositivi che modificano la stessa colonna si risolvono
con l'HLC più alto.

**Riga esistente, colonna insieme.** Il valore memorizzato è un OR-Set:
`{ "<element>": { "a": ["<tag>", ...], "r": ["<tag>", ...] } }`. Gli elementi in
`add` ricevono l'HLC della modifica come nuovo tag in `a`. Gli elementi in
`remove` spostano i tag elencati in `removed_tags` (o tutti i tag attuali in
`a`) in `r`. Un elemento è visibile finché ha un tag in `a` che non è in `r`,
quindi un'aggiunta che chi rimuove non ha mai visto sopravvive (add-wins). Le
colonne insieme non vengono mai sovrascritte dal LWW.

**Cancellazione.** `deleted` è una normale colonna scalare e segue il LWW con
l'HLC della cancellazione. Le righe non vengono mai rimosse; i lettori filtrano
`deleted = 0`.

Se nulla nella modifica batte l'orologio dei campi, la riga resta intatta.

## Scope

Il server calcola l'insieme di scope di un chiamante come:

```text
{ "user:<user id>" }
  ∪ { id of every apiary in the caller's active tenant }
  ∪ { apiary_id from apiary_share rows for the caller }
```

Lo stesso insieme controlla `Pull` e `Push`. Gli apiari usano il proprio id come
`scope_id`; tutto ciò che sta sotto un apiario (arnie, regine, ispezioni,
attività, collocazioni, raccolti, trattamenti, eventi) porta l'id dell'apiario.
Nulla nell'app attuale scrive `apiary_share`, quindi in pratica l'insieme di
scope è costituito dagli apiari del tenant.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Uno stream dal server. Ogni due secondi il server legge il contatore di sequenza
globale e invia `server_cursor` quando è avanzato oltre il cursore della
richiesta e oltre l'ultimo valore inviato. Non trasporta modifiche; un ricevente
chiama `Pull`. Il contatore è globale, non per scope, quindi un evento può
portare a un pull vuoto. L'app non lo usa.

## Tabelle lato server

`change_log` è il feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`. `seq_counter` contiene l'unica riga
contatore (`name = 'change'`) che viene incrementata per ogni modifica accettata.
Sul client, `outbox` contiene le modifiche non ancora inviate nella stessa forma
e `sync_meta` memorizza il cursore sotto la chiave `cursor`.

## Modifiche originate dal server

I servizi CRUD (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`) non scrivono
direttamente le tabelle delle entità. Ogni RPC di scrittura costruisce un
`Change` e lo fa passare da `applyChange` e `appendChangeLog` in una sola
transazione (`server/internal/service/writer.go`), gli stessi due passaggi
che `Push` esegue per ogni modifica. Una modifica di questo tipo ha
`author_id` impostato all'id utente del chiamante dell'API, un `hlc` preso
dall'orologio del server stesso (id di nodo `BEEHIVE_NODE_ID`, l'orologio
condiviso con l'handler di `Push` così resta avanti rispetto a tutto ciò che
è stato ricevuto), e come `scope_id` l'apiario a cui appartiene la riga: l'id
dell'apiario stesso, l'apiario dell'arnia per arnie, regine, ispezioni e
trattamenti, e `user:<id>` per un'attività senza apiario. Il suo
`payload_json` è un delta parziale come quello di un dispositivo, quindi una
modifica successiva di un'altra colonna da parte di un dispositivo si unisce
ad esso, e la riga compare al `Pull` successivo di ogni dispositivo che può
leggere lo scope. Le cancellazioni tramite l'API sono tombstone
`CHANGE_OP_DELETE`. I flussi a più righe (arnia più collocazione più evento,
sostituzione della regina, contesto fissato per ispezioni e trattamenti)
aggiungono una modifica per riga, rispecchiando
`app/src/lib/local/history.ts`.

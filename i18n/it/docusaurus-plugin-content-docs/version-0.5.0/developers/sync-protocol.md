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
  rpc Snapshot(SnapshotRequest) returns (SnapshotResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

Il ciclo del client (`app/src/lib/local/sync.ts`, `syncOnce`): esegue il push
dell'outbox, poi il pull finché `has_more` non è false. Un dispositivo senza
cursore carica prima uno [snapshot](#snapshot). Gira ogni 15 secondi,
dopo ogni scrittura locale e all'evento `online` del browser. Le esecuzioni sono
serializzate; una chiamata che arriva mentre una è in corso pianifica un
ulteriore passaggio. Il client non chiama `Subscribe`.

L'outbox viene inviato in lotti di al massimo 200 modifiche e circa 4 MiB di
payload; un lotto che il server rifiuta per intero viene dimezzato e inviato
di nuovo.

## Versioni del protocollo \{#versions}

Un client indica quale versione del protocollo parla con due intestazioni di
richiesta su ogni chiamata a `SyncService`:

```text
Openbeehive-Sync-Protocol: 1
Openbeehive-App-Version: 0.5.0
```

La versione attuale è la 1; la versione dell'app è testo libero per il log del
server. Una richiesta senza `Openbeehive-Sync-Protocol` proviene da un'app
0.4.x installata (versione 0). Un client del genere viene servito come faceva
la release 0.4.1: `Pull` restituisce solo le entità e le colonne che quella
release conosceva (`legacyCols` in `server/internal/service/sync_legacy.go`,
un elenco che non cresce mai), i cursori sono semplici numeri di sequenza, e
non esistono né snapshot né [segnali di stato](#pull-status). Un'app 0.4.x
scrive ogni chiave di una modifica scaricata in una colonna con quel nome e
smette di sincronizzarsi alla prima chiave che non conosce: per questo le
nuove colonne e tabelle raggiungono solo i client che dichiarano una versione.
**Gli script che chiamano `SyncService` devono inviare l'intestazione** per
ricevere tutto.

`BEEHIVE_SYNC_MIN_PROTOCOL` (predefinito `0`) è la versione più bassa che il
server accetta. Al di sotto, ogni chiamata fallisce con `failed_precondition`
e un dettaglio di errore `UpgradeRequired` (`min_protocol`); l'app mostra
allora "App non aggiornata · aggiornala per sincronizzare" e smette di
riprovare.

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
                           // placement, harvest, treatment, event, photo,
                           // user_settings
  string entity_id = 2;    // row id (UUID minted on the device)
  string scope_id = 3;     // apiary id, or "user:<id>"
  ChangeOp op = 4;
  string payload_json = 5; // JSON object of changed columns; ignored on delete
  string hlc = 6;          // Hybrid Logical Clock of the write
  string author_id = 7;    // set by the server from the signed-in caller
}
```

`payload_json` è un delta parziale, non l'intera riga: il `patch()` del client
scrive solo le colonne che ha modificato. Le chiavi sono i nomi delle colonne in
`snake_case` del [modello dei dati](./data-model.md). Una riga creata sul
dispositivo è un delta che contiene ogni colonna. Una cancellazione è
`op = CHANGE_OP_DELETE`; il ricevente imposta `deleted = true` e ignora il
payload.

I valori scalari sono stringhe, numeri, booleani o `null`. I booleani viaggiano
come `0`/`1`, i timestamp come stringhe ISO 8601 (`""` significa non
impostato). Il server conserva solo le colonne che conosce, scarta in silenzio
le chiavi sconosciute e memorizza il payload in questa forma normalizzata, che
è anche quella restituita da `Pull`. I riceventi devono ignorare le chiavi che
non conoscono. `author_id` viene sempre impostato dal server in base al
chiamante autenticato; ciò che un client invia in quel campo viene ignorato.
Un payload può essere al massimo di 4 MiB e un id di entità al massimo di 255
caratteri.

Le colonne insieme (solo `inspection.photo_keys`, che contiene le foto
incorporate delle app 0.4.x) usano una forma di payload diversa:

```json
{ "photo_keys": { "add": ["data:image/jpeg;base64,..."] } }
{ "photo_keys": { "remove": ["data:image/jpeg;base64,..."], "removed_tags": { "data:image/jpeg;base64,...": ["<hlc>", "<hlc>"] } } }
```

Gli elementi devono essere data URL; qualsiasi altro elemento rende la modifica
`invalid`, così come un tag rimosso più di 10 minuti avanti rispetto al server.

`removed_tags` elenca, per ogni elemento rimosso, i tag di aggiunta che il
dispositivo che rimuove aveva osservato; solo quelli vengono marcati come
rimossi, quindi un'aggiunta concorrente fatta altrove sopravvive. La regola
per la sua assenza è rigida:

- `removed_tags` **assente** (client più vecchi): viene rimosso ogni tag che il
  ricevente detiene per l'elemento.
- `removed_tags` **presente ma vuoto** per un elemento: non viene rimosso nulla.

### Formato dell'HLC

`"<ms:15>:<counter:5>:<node>"`, per esempio
`001781234567890:00003:a1b2c3d4`. Orologio reale in millisecondi con zeri
iniziali fino a esattamente 15 cifre, un contatore di esattamente 5 cifre, poi
un id di nodo da 1 a 64 caratteri tra `[A-Za-z0-9._-]` (un id casuale
memorizzato in `localStorage` sul dispositivo; sul server `BEEHIVE_NODE_ID`,
per impostazione predefinita un id casuale `srv-…` scelto a ogni avvio). Il
semplice confronto tra stringhe ordina gli HLC. Per ogni campo vince la marca
più recente; marche uguali non sovrascrivono. Una marca che non rispetta
questo formato rende la modifica `invalid`.

**Il limite dei 10 minuti.** Il server rifiuta una modifica la cui marca è più
di 10 minuti avanti rispetto al proprio orologio (`clock_ahead`), perché una
marca del genere vincerebbe ogni unione successiva. Sia `Pull` sia `Push`
restituiscono `server_time_ms`; l'app lo usa per compensare un orologio del
dispositivo sbagliato, e quando delle modifiche tornano indietro come
`clock_ahead` assegna alle voci dell'outbox interessate (e ai corrispondenti
orologi dei campi e tag degli insiemi delle righe locali) marche nuove nel
vecchio ordine e le invia di nuovo. L'orologio del server stesso segue solo le
marche che ha accettato e memorizzato, e mai una più di 10 minuti avanti
rispetto al proprio orologio reale. Un'app 0.4.x (senza intestazione di
protocollo) ignora i rifiuti delle singole modifiche, quindi per un client del
genere una modifica `clock_ahead` fa fallire l'intero `Push` con
`failed_precondition` ("upgrade required") e nulla di esso viene applicato;
l'app conserva il lotto e riprova finché il suo orologio non è corretto o non
si è aggiornata.

## Pull

```protobuf
message PullRequest {
  string cursor = 1; // next_cursor of the previous Pull, "" for a first sync
  int32 limit = 2;   // 0 = server default (200), max 500
}
message PullResponse {
  repeated Change changes = 1;
  string next_cursor = 2;
  bool has_more = 3;
  int64 server_time_ms = 4; // server wall clock, unix ms
  PullStatus status = 5;
}
```

Il cursore è opaco: memorizza `next_cursor` e rimandalo invariato. Per il
protocollo 1 ha la forma `<epoch>:<seq>:<mark>`. `epoch` è un numero casuale
che identifica il database (`sync_state`), `seq` è la sequenza di ricezione
del server (`change_log.seq`, non un HLC), e `mark` è il contrassegno
dell'ultimo avvio del server prima di quella posizione (`sync_boot`). I client
0.4.x mantengono il semplice numero di sequenza. `Pull` è delimitato dallo spazio: il server
restituisce le righe con `seq > cursor` che appartengono allo spazio attivo del
chiamante, ordinate per `seq`. L'unica eccezione sono le righe personali (scope
`user:<id>`), che vengono restituite solo al loro proprietario, e solo
all'interno dello spazio in cui sono state scritte. `next_cursor` è l'ultimo
`seq` restituito (oppure il cursore della richiesta quando nulla corrisponde).
Persisti `next_cursor` solo dopo aver applicato l'intera pagina. `has_more`
significa che la pagina è stata tagliata a `limit`; esegui subito un altro pull.

Le righe di altri spazi consumano comunque numeri di sequenza, quindi i valori
che vedi hanno dei vuoti.

**Il cursore avanza sempre e solo tramite `Pull` e `Snapshot`.** Un
dispositivo non deve ricavarlo da nient'altro, in particolare non da una
risposta di `Push`: le modifiche di altri dispositivi con numeri di sequenza
più bassi verrebbero saltate per sempre.

### Stato del pull \{#pull-status}

`status` indica che cosa il server ha concluso dal cursore. Solo i client che
dichiarano una versione del protocollo ricevono un valore diverso da
`PULL_STATUS_UNSPECIFIED` (il cursore è stato accettato). Con uno degli altri
due, `changes` è vuoto:

| Stato | Quando | Che cosa fa il client |
| --- | --- | --- |
| `PULL_STATUS_SNAPSHOT_REQUIRED` | Il cursore è più vecchio della voce più vecchia che il server conserva ancora (vedi [compattazione](#compaction)), oppure è un semplice numero di sequenza di prima del protocollo 1. | Carica uno [snapshot](#snapshot) e continua dal suo cursore. L'outbox non viene toccato. |
| `PULL_STATUS_RESET_REQUIRED` | Il cursore non appartiene alla storia di questo database: un'altra epoch, una posizione oltre la fine del log, o un contrassegno che non corrisponde. È l'aspetto che ha un backup ripristinato. | Rimette in coda per il caricamento ogni riga locale, carica uno snapshot, continua dal suo cursore. |

Un database ripristinato ha la stessa epoch, ma l'avvio del server su di esso
lascia un nuovo contrassegno nella posizione in cui finisce il backup, quindi ogni
cursore emesso prima del ripristino oltre quella posizione porta il contrassegno
sbagliato. Il controllo presuppone che il server venga avviato sul database
ripristinato prima di servire richieste; non dipende dalle voci del log,
quindi né la compattazione né uno spazio eliminato possono nascondere un
ripristino.

Dopo `RESET_REQUIRED` l'app rimette in coda ogni riga locale come normali
modifiche, raggruppate secondo le marche che le sue colonne portano già; la
modifica più vecchia di una riga contiene tutte le sue colonne, così può
ricreare una riga che il server non ha più. Dove il server ha ancora una
modifica, l'unione non fa nulla. Poi carica le immagini delle foto che
conserva, dopo i rispettivi record. Le app 0.4.x non ricevono nessuno dei due
stati; una il cui cursore va oltre il log ripristinato rilegge il log
dall'inizio.

## Snapshot \{#snapshot}

```protobuf
message SnapshotRequest { string page_token = 1; }
message SnapshotRow {
  string entity = 1;
  string entity_id = 2;
  string payload_json = 3;   // every synced column of the row
  string field_hlc_json = 4; // column -> stamp of its last write
}
message SnapshotResponse {
  repeated SnapshotRow rows = 1;
  string next_page_token = 2; // "" on the last page
  string cursor = 3;          // where Pull continues; the same on every page
  int64 server_time_ms = 4;
}
```

`Snapshot` restituisce le righe attuali dello spazio del chiamante, comprese
quelle eliminate (tombstone) e, tra le righe personali, solo quelle del
chiamante, pagina per pagina; una pagina viene tagliata a circa 4 MiB.
Richiede una versione del protocollo: una chiamata senza l'intestazione
fallisce con `failed_precondition` e `UpgradeRequired`. Una colonna insieme
porta il suo intero stato OR-Set invece di un delta. Il client unisce ogni
riga colonna per colonna come una modifica, quindi le modifiche locali con
marche più recenti sopravvivono e l'outbox resta intatto; una colonna senza
marca viene presa solo dove anche la riga locale non ne ha. Il cursore viene
preso prima di leggere la prima riga, quindi una riga che cambia mentre le
pagine vengono scaricate arriva di nuovo tramite `Pull`. L'app memorizza il
cursore solo dopo l'ultima pagina; uno snapshot interrotto ricomincia da capo.

Un dispositivo usa uno snapshot quando non ha un cursore (un nuovo
dispositivo, o dopo un aggiornamento dalla 0.4.x), dopo `SNAPSHOT_REQUIRED` e
dopo `RESET_REQUIRED`. I record delle foto arrivano con le loro miniature, mai
con le immagini a piena risoluzione.

## Compattazione \{#compaction}

Una volta al giorno il server elimina le voci del registro delle modifiche
ricevute più di `BEEHIVE_CHANGELOG_RETENTION_DAYS` giorni prima (predefinito
180; `0` conserva tutto; `change_log.logged_at` è l'ora di ricezione) e
registra il numero di sequenza fino al quale lo ha fatto (l'orizzonte, in
`sync_state`). Un cursore al di sotto dell'orizzonte riceve
`SNAPSHOT_REQUIRED`; un'app 0.4.x con un cursore del genere riceve l'errore
`UpgradeRequired` e non può sincronizzarsi finché non viene aggiornata. Le
righe stesse restano. Nient'altro legge le vecchie voci del log: il
proprietario di un'attività personale, per esempio, è memorizzato
sull'attività (`task.owner_id`). Il job gira nel processo del server e
presuppone di essere l'unico: esegui esattamente un'istanza per database.

## Push

```protobuf
message PushRequest { repeated Change changes = 1; }
message RejectedChange {
  int32 index = 1;   // position in PushRequest.changes
  string code = 2;   // machine-readable cause, see below
  string reason = 3; // plain English, for logs
}
message PushResponse {
  string server_cursor = 1;             // always empty
  repeated Conflict conflicts = 2;      // unused, always empty
  repeated RejectedChange rejected = 3; // changes that were not applied
  int64 server_time_ms = 4;             // server wall clock, unix ms
}
```

Un push può trasportare al massimo 2000 modifiche (oltre, `invalid_argument`).
Il server applica ogni modifica singolarmente, all'interno di una sola
transazione con un savepoint per modifica: una modifica che rifiuta viene
annullata e riportata in `rejected`, e ogni altra modifica della richiesta
viene applicata normalmente. Una modifica che non è elencata in `rejected` è
stata accettata. Accettata non significa che abbia vinto: i campi più vecchi
di ciò che il server possiede perdono l'unione per campo.

Per ogni modifica il server:

1. Controlla la modifica stessa: un'`entity` nota, un id da 1 a 255 caratteri,
   un `op` di upsert o delete, una marca ben formata che non sia più di 10
   minuti avanti.
2. Controlla lo scope: `scope_id` deve essere lo scope personale del chiamante
   (`user:<id>`) o un apiario dello spazio attivo del chiamante. Una modifica
   `apiary` il cui `scope_id` è uguale al proprio `entity_id` apre un nuovo
   scope. Nessun id di riga può iniziare con `user:` (`invalid`). Lo scope
   personale accetta solo le impostazioni dell'account, le attività senza
   apiario e gli eventi che indicano lo scope personale, e solo righe che sono
   già del chiamante; qualsiasi altra cosa lì è `forbidden_scope`.
3. Controlla lo spazio: una riga esistente deve appartenere allo spazio attivo
   del chiamante; le nuove righe vengono marcate con esso.
4. Normalizza il payload alle colonne note, lo unisce campo per campo (vedi
   sotto) e lo aggiunge a `change_log` con un nuovo `seq`. Una modifica che
   non cambia nulla (ogni campo superato, ogni tag dell'insieme già noto) viene
   unita senza una voce nel registro.

I codici in `rejected`:

| Codice | Significato |
| --- | --- |
| `wrong_tenant` | La riga appartiene a un altro spazio. |
| `forbidden_scope` | `scope_id` non è scrivibile per il chiamante. |
| `unknown_entity` | `entity` non è una tabella sincronizzata. |
| `invalid` | Marca, payload, valore o id malformati. |
| `clock_ahead` | La marca è più di 10 minuti avanti rispetto al server; marca di nuovo con un orologio corretto e invia di nuovo. |

L'intera richiesta fallisce solo per motivi che non riguardano una singola
modifica: `permission_denied` per le identità in sola lettura (l'account demo,
le chiavi API in sola lettura), `unauthenticated`, una modifica `clock_ahead` da
un'app 0.4.x (vedi sopra), oppure un errore del server, nel qual caso nulla
della richiesta viene applicato.

`server_cursor` e `conflicts` restano nel messaggio affinché le app più vecchie
continuino a decodificare la risposta; entrambi sono sempre vuoti.

Cosa fa l'app con la risposta: le modifiche accettate lasciano l'outbox.
Quelle rifiutate vengono spostate in un elenco di modifiche rifiutate che
l'utente vede come **Problemi di sincronizzazione**, con la possibilità di
riprovare e di scartare; le righe restano nelle tabelle locali. `clock_ahead`
viene gestito marcando di nuovo come descritto sopra. Un push rifiutato come
in sola lettura (`permission_denied`, l'account demo) non potrà mai riuscire:
l'app scarta il lotto, dimentica le righe che toccava e azzera il proprio
cursore, così il pull della stessa esecuzione ricarica le righe del server da
uno snapshot, e avvisa l'utente che la modifica non è stata salvata. Una
richiesta rifiutata perché troppo grande o malformata viene dimezzata finché
la modifica difettosa non resta da sola. Qualsiasi altro errore conserva
l'outbox per l'esecuzione successiva.

Nella direzione opposta, una modifica o una riga di snapshot ricevuta con il
pull che l'app non riesce a unire non ferma il pull: viene conservata nella
tabella locale `inbox_failed` ed elencata sotto **Problemi di
sincronizzazione** come "modifica ricevuta non applicata", con un'azione per
scartarla. La stessa modifica ricevuta di nuovo sostituisce la sua voce.

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

Le due implementazioni sono mantenute identiche da vettori di test condivisi:
`server/internal/sync/testdata/merge_vectors.json` viene eseguito dai test Go e
dai test dell'app.

## Scope

Lo spazio è l'unica unità di condivisione. Ogni modifica appartiene allo spazio
del chiamante che l'ha scritta, e all'interno dello spazio porta uno
`scope_id`:

- l'id dell'apiario a cui appartiene (gli apiari usano il proprio id; arnie,
  regine, ispezioni, collocazioni, raccolti, trattamenti, eventi e attività con
  un apiario portano l'id dell'apiario), oppure
- `user:<user id>` per le righe personali, come un'attività senza apiario, e
  per le impostazioni dell'account.

Un chiamante può scrivere nel proprio scope personale e negli apiari del suo
spazio attivo. Legge ogni modifica dello spazio attivo tranne le righe
personali degli altri membri. Non esiste una condivisione per apiario.

### Impostazioni dell'account \{#account-settings}

`user_settings` (unità e lingua) è l'unica tabella sincronizzata le cui righe
appartengono a un account invece che a uno spazio: una riga per account, con
l'id dell'account come id di riga, scritta solo nello scope personale
dell'account. Le sue voci di log sono archiviate sotto l'account (`org_id`
`user:<id>`), quindi `Pull`, `Subscribe` e `Snapshot` la servono in ogni
spazio dell'account, e due dispositivi che la creano offline scrivono la
stessa riga. Uscire da uno spazio la mantiene; eliminare l'account la
rimuove. I valori cambiano solo ciò che l'app mostra; record, payload,
esportazioni e API restano nel sistema metrico. Il tema dei colori non ne fa
parte.

### Foto \{#photos}

Una foto è una riga `photo` (`owner_entity` `inspection` o `hive`,
`owner_id`, `thumb` come data URL di circa 200 px, `content_type`,
`size_bytes`) che si sincronizza come qualsiasi altra riga. L'immagine a piena
risoluzione non entra mai nel feed: il dispositivo che ha scattato la foto la
carica con `POST /photos/<id>` una volta inviato il record, e gli altri
dispositivi la scaricano con `GET /photos/<id>` la prima volta che viene
aperta. Entrambe le chiamate richiedono la sessione o una chiave API e
l'appartenenza allo spazio della foto. Un caricamento viene accettato una sola
volta per foto, quindi l'immagine dietro un id non cambia mai. Eliminare una
foto è definitivo: il server cancella la miniatura dalla riga e dal log e
rimuove l'immagine.

Le app 0.4.x mantengono le loro foto incorporate (`inspection.photo_keys`,
`hive.photo`). Il server accetta quel formato da loro, lo serve loro e lo
converte in record di foto. I client che dichiarano una versione del
protocollo ricevono i record delle foto e mai le copie incorporate; le app
0.4.x ricevono le copie incorporate e mai le righe `photo`.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Uno stream dal server, per spazio. Ogni due secondi il server cerca la modifica
più recente che il chiamante può scaricare con un pull e invia `server_cursor`
quando è avanzato oltre il cursore della richiesta e oltre l'ultimo valore
inviato. Non trasporta modifiche; un ricevente chiama `Pull`. L'attività in
altri spazi non risveglia lo stream. Un utente può tenere aperti al massimo 4
stream; un ulteriore stream viene rifiutato con `resource_exhausted`. La
versione minima del protocollo vale anche qui come per le altre chiamate.
L'app non lo usa.

## Tabelle lato server

`change_log` è il feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, `logged_at`, indicizzato per
`(org_id, seq)` per `Pull` e per `logged_at` per la compattazione.
`sync_state` contiene l'`epoch` del database e l'`horizon` della
compattazione; `sync_boot` contiene un contrassegno per ogni avvio del server.
`seq_counter` contiene l'unica riga contatore (`name = 'change'`) che
viene incrementata per ogni modifica accettata; ogni scrittore la blocca per
prima cosa, quindi le unioni sono serializzate. Sul client, `outbox` contiene
le modifiche non ancora inviate nella stessa forma e `sync_meta` memorizza il
cursore sotto la chiave `cursor`.

## Modifiche originate dal server

I servizi CRUD (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`, `HarvestService`) non
scrivono direttamente le tabelle delle entità. Ogni RPC di scrittura
costruisce un `Change` e lo fa passare da `applyChange` e `appendChangeLog` in
una sola transazione (`server/internal/service/writer.go`), gli stessi due
passaggi che `Push` esegue per ogni modifica. Una modifica di questo tipo ha
`author_id` impostato all'id utente del chiamante dell'API, un `hlc` preso
dall'orologio del server stesso (id di nodo `BEEHIVE_NODE_ID`, l'orologio
condiviso con l'handler di `Push` così resta avanti rispetto a tutto ciò che
è stato accettato), e come `scope_id` l'apiario a cui appartiene la riga: l'id
dell'apiario stesso, l'apiario dell'arnia per arnie, regine, ispezioni,
trattamenti e raccolti, e `user:<id>` per un'attività senza apiario. Il suo
`payload_json` è un delta parziale come quello di un dispositivo, quindi una
modifica successiva di un'altra colonna da parte di un dispositivo si unisce
ad esso, e la riga compare al `Pull` successivo di ogni dispositivo che può
leggere lo scope. Le cancellazioni tramite l'API sono tombstone
`CHANGE_OP_DELETE`, e la cancellazione di un record marca come eliminati anche
i suoi eventi della cronologia. I flussi a più righe (arnia più collocazione
più evento, sostituzione della regina, contesto fissato per ispezioni,
trattamenti e raccolti) aggiungono una modifica per riga, rispecchiando
`app/src/lib/local/history.ts`.

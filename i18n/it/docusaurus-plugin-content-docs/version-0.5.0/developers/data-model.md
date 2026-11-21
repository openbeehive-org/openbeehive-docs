---
sidebar_position: 3
title: "Modello dei dati"
---

# Modello dei dati

Le tabelle qui sotto sono prese dalle migrazioni del server
(`server/internal/storage/sql/migrations/`) e dallo schema speculare del client
(`app/src/lib/local/schema.ts`). I nomi delle colonne sono identici da entrambe
le parti e sono le chiavi usate nei payload di sincronizzazione. Le colonne enum
memorizzano il numero proto; l'etichetta visualizzata è quella che mostra l'app
(`app/src/lib/i18n/locales/en.json`).

Ogni tabella sincronizzata porta tre colonne di gestione non ripetute sotto:
`organization_id` (lo spazio, chiamato tenant nel codice), `field_hlc` (orologio dei campi in JSON, vedi il
[protocollo di sincronizzazione](./sync-protocol.md)) e `deleted` (flag di
cancellazione logica). Gli id sono UUID, generati sul dispositivo oppure dal
server per le righe create tramite l'[API](../using-the-api/overview.md). I
timestamp sono memorizzati come stringhe ISO 8601 sul client e come
`TIMESTAMP` sul server.

## Gerarchia

```text
apiary
 └── hive ── queen (one active, older ones kept with replaced_at set)
       ├── inspection
       ├── task        (task.hive_id and task.apiary_id are both optional)
       ├── harvest
       ├── treatment
       ├── placement   (which apiary the hive lived in, and when)
       ├── photo       (the hive's picture, and the photos of its inspections)
       └── event       (append-only history with frozen apiary/hive/queen)

user_settings          (one row per account, in every workspace)
```

Lo spazio (`organization_id`) è l'unità di condivisione: ogni membro di uno
spazio legge e scrive tutte le sue righe. Al suo interno, le modifiche portano
uno `scope_id`: l'id dell'apiario stesso per l'apiario e per tutto ciò che vi è
contenuto, oppure `user:<id>` per le righe personali come un'attività senza
apiario. Solo `event` memorizza `scope_id` come colonna; per le altre tabelle
viene trasportato nel messaggio `Change`.

## apiary

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `name` | text | obbligatorio |
| `address` | text | testo libero |
| `lat`, `lng` | real | `0` quando non impostati |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

## hive

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | codificato anche nell'[etichetta QR](./qr-codes.md) |
| `apiary_id` | text | apiario attuale |
| `name` | text | |
| `type` | int | `HiveType`, vedi sotto |
| `status` | int | `HiveStatus`, vedi sotto; le nuove arnie partono da `1` |
| `boxes` | int | numero di corpi |
| `colony_origin` | text | es. "sciame 2024" |
| `note` | text | |
| `qr_code` | text | riservato; il codice stampato è derivato da `id` da `shortCode()` in `app/src/lib/qr.ts` |
| `photo` | text | immagine incorporata scritta dalle app 0.4.x; le app aggiornate conservano l'immagine dell'arnia come riga `photo` |
| `created_at`, `updated_at` | timestamp | |

`HiveType`: 0 Non specificato, 1 Zander, 2 Dadant, 3 Deutsch Normal, 4 Langstroth,
5 Warré, 6 Top-bar, 99 Altro.

`HiveStatus`: 0 Non specificato, 1 Attiva, 2 Nucleo, 3 Orfana, 4 Persa,
5 Sciolta.

## queen

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `hive_id` | text | |
| `year` | int | l'anno della regina; determina il colore di marcatura predefinito |
| `marking` | int | `MarkingColor`: 1 bianco (anni che finiscono in 1/6), 2 giallo (2/7), 3 rosso (3/8), 4 verde (4/9), 5 blu (5/0); predefinito da `year` |
| `origin` | text | |
| `breeder_number` | text | |
| `introduced_at` | timestamp | inizio del regno |
| `replaced_at` | timestamp | fine del regno, null finché regna |
| `active` | bool | true per la regina attuale |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

Un cambio di regina imposta `active = 0` e `replaced_at` sulla vecchia riga e ne
inserisce una nuova; la vecchia regina resta nella tabella. Una riga
di regina viene eliminata solo se è stata registrata per errore.

## inspection

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Molto docile, 2 Docile, 3 Normale, 4 Nervosa, 5 Aggressiva |
| `calmness` | int | 1 Fugge dal favo, 2 Irrequieta, 3 Calma, 4 Molto calma |
| `source` | int | `InspectionSource`: 0 non specificato (trattato come manuale), 1 manuale (una visita fatta da una persona), 2 sensore (una lettura automatica). Non null, predefinito 0 |
| `frames` | int | telaini occupati |
| `brood_frames` | int | |
| `stores` | int | 1 Buone, 2 Medie, 3 Scarse, 4 Assenti |
| `queen_cells` | int | celle reali di sciamatura contate |
| `youngest_larva` | int | età in giorni della larva più giovane vista |
| `covered_larva` | bool | covata opercolata vista |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | `honey_kg` è mantenuto per i vecchi record; il modulo della visita non lo scrive più (vedi `harvest`) |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C |
| `humidity_hive`, `humidity_outside` | real | % |
| `note` | text | |
| `photo_keys` | text | JSON OR-Set, l'unica colonna insieme; foto incorporate scritte dalle app 0.4.x (vedi `photo`) |
| `created_at` | timestamp | |

I conteggi, le quantità e le letture climatiche (`frames`, `brood_frames`,
`queen_cells`, `youngest_larva`, `frames_added`, `frames_removed`,
`honey_kg`, `fed_kg`, `weight_kg` e le quattro colonne climatiche) sono
nullable sul server e sul client: `NULL` significa "non registrato", `0`
significa uno zero osservato. L'API rispecchia questo con campi opzionali.

## task

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `title` | text | |
| `hive_id`, `apiary_id` | text | opzionali |
| `due_at` | timestamp | |
| `done` | bool | |
| `priority` | int | `TaskPriority`: 1 Bassa, 2 Normale, 3 Alta; la colonna del server ha 2 come predefinito, l'app scrive 0 |
| `note`, `recurrence`, `assigned_to` | text | presenti nello schema; il modulo attività compila solo `title` e `due_at` |
| `created_at` | timestamp | |

Sul server, `task.owner_id` registra l'account nel cui scope personale è stata
scritta un'attività senza apiario. Non viene sincronizzato; il server lo usa
per servire l'attività solo al suo proprietario e per eliminarla quando il
proprietario lascia lo spazio.

## placement

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id`, `hive_id`, `apiary_id` | text | |
| `start_at` | timestamp | |
| `end_at` | timestamp | null per la collocazione attuale |

Creare un'arnia apre una collocazione; spostarla chiude la riga aperta al
momento dello spostamento e ne apre una nuova.

Un'attività senza `apiary_id` si sincronizza sotto lo scope personale
`user:<user id>` invece che sotto l'id di un apiario.

## harvest

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | fissati al momento del raccolto |
| `date` | timestamp | |
| `variety` | text | |
| `amount_kg` | real | |
| `water_content` | real | % |
| `batch_number` | text | |
| `best_before` | timestamp | |
| `note` | text | |
| `amended_at` | timestamp | null finché il raccolto non viene modificato dopo la creazione, poi l'ora dell'ultima modifica |

## treatment

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | fissati al momento del trattamento |
| `date` | timestamp | |
| `product`, `active_ingredient` | text | |
| `dose`, `method` | text | |
| `batch_number` | text | |
| `withdrawal_until` | timestamp | |
| `reason` | text | predefinito `varroa` |
| `note` | text | |
| `amended_at` | timestamp | null finché il trattamento non viene modificato dopo la creazione, poi l'ora dell'ultima modifica; mostrato come "Modificato il" e stampato nel registro dei trattamenti |

## photo

Una foto di un'ispezione, oppure l'immagine di un'arnia. La riga si
sincronizza con una piccola miniatura; l'immagine a piena risoluzione è
conservata nell'archiviazione blob e trasferita tramite `/photos/<id>` (vedi il
[protocollo di sincronizzazione](./sync-protocol.md#photos)).

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `owner_entity` | text | `inspection` o `hive` |
| `owner_id` | text | id di quell'ispezione o arnia |
| `thumb` | text | miniatura come data URL, circa 200 px sul lato più lungo |
| `content_type` | text | dell'immagine a piena risoluzione: `image/jpeg`, `image/png` o `image/webp` |
| `size_bytes` | int | dell'immagine a piena risoluzione, al massimo 5 MiB |
| `created_at` | timestamp | |

Una foto eliminata conserva la propria riga come tombstone, ma la miniatura e
l'immagine vengono cancellate. Sul server la riga indica anche il proprio blob
(`blob_key`, `blob_type`, `blob_size`) e, per le foto convertite dalla 0.4.x,
il valore incorporato da cui provengono (`legacy_key`); queste colonne non
vengono sincronizzate.

## user_settings

Le preferenze di visualizzazione dell'account. Una riga per account, con l'id
dell'account come id; viene scritta nello scope personale e servita in ogni
spazio dell'account (vedi il
[protocollo di sincronizzazione](./sync-protocol.md#account-settings)). Non
porta `organization_id`.

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | l'id dell'account |
| `weight_unit` | text | `kg` o `lb`; vuoto significa non scelto, e il dispositivo usa il valore predefinito della regione del browser |
| `temp_unit` | text | `c` o `f`; vuoto come sopra |
| `language` | text | `en`, `de`, `fr`, `es` o `it` |

I dati sono memorizzati in chilogrammi e gradi Celsius qualunque sia la scelta
fatta qui.

## event

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `scope_id` | text | id dell'apiario |
| `type` | int | `EventType`, vedi sotto |
| `date` | timestamp | |
| `apiary_id`, `hive_id`, `queen_id` | text | fissati al momento dell'evento |
| `ref_entity`, `ref_id` | text | la riga di dettaglio, es. `harvest` / il suo id |
| `title` | text | |
| `amount_kg` | real | copiato dal raccolto così le query sulla resa non richiedono join |
| `detail` | text | JSON |
| `author_id` | text | |

`EventType`: 1 Creata, 2 Regina introdotta, 3 Regina sostituita, 4 Spostata,
5 Ispezione, 6 Trattamento, 7 Raccolto, 8 Stato, 9 Sciolta. L'app scrive i
tipi da 1 a 7 (`app/src/lib/local/history.ts`). Vedi
[Storia ed eventi](./history-and-events.md).

## Tabelle solo server

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`password_reset`, `change_log`, `seq_counter`, `sync_state`, `sync_boot` e
`photo_migration` esistono solo sul server.
`member.role` è `owner` o `member`; `users.role` è `admin` o `user`.
`users.sessions_valid_after` è il contrassegno che termina tutte le sessioni
precedenti di un account; `users.email_key` è l'indirizzo email in minuscolo
e univoco, così due account non possono condividere un indirizzo che
differisce solo per maiuscole e minuscole; `invite.expires_at` indica quando
un invito smette di funzionare (7 giorni dopo la creazione).
`password_reset` contiene l'hash del token di ogni link di reimpostazione,
valido per un'ora ed eliminato quando viene usato. `sync_state` contiene
l'`epoch` casuale del database e l'`horizon` della compattazione del registro
delle modifiche; `sync_boot` contiene un contrassegno per ogni avvio del
server (vedi il [protocollo di sincronizzazione](./sync-protocol.md#pull-status));
`change_log.logged_at` è l'ora in cui il server ha ricevuto una voce.
`photo_migration` registra che la conversione una tantum delle foto
incorporate della 0.4.x è terminata. La precedente tabella
`apiary_share` non esiste più: non c'è condivisione per apiario. Il client
aggiunge `outbox`, `sync_meta`, `outbox_failed` (modifiche che il server ha rifiutato) e `inbox_failed` (modifiche ricevute che non ha potuto applicare) per il
motore di sincronizzazione.

### api_key

Chiavi a lunga durata per script e integrazioni (migrazione `0014_api_keys.sql`,
`server/internal/auth/apikey.go`). Non sincronizzata.

| Colonna | Tipo | Note |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | proprietario; indicizzata |
| `organization_id` | varchar(64) | lo spazio in cui la chiave agisce, fissato alla creazione |
| `name` | text | etichetta mostrata nelle Impostazioni |
| `key_prefix` | text | i primi 12 caratteri del testo in chiaro, per la visualizzazione |
| `key_hash` | varchar(64) | SHA-256 in esadecimale del token `obhk_...` in chiaro, univoco; il testo in chiaro non viene mai memorizzato |
| `scope` | text | `write` (predefinito) o `read`; una chiave `read` può chiamare solo `Get*`, `List*`, `Pull`, `Snapshot` e `Subscribe` |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null per le chiavi che non scadono mai; una chiave oltre questo istante viene rifiutata |
| `last_used_at` | timestamp | aggiornato a ogni utilizzo verificato, null fino ad allora |

Una chiave viene verificata calcolando l'hash del bearer token e cercando
`key_hash`; la riga viene eliminata alla rimozione, e una chiave il cui
proprietario non è più `member` di `organization_id`, o il cui `expires_at` è
passato, viene rifiutata senza essere eliminata.

---
sidebar_position: 2
title: "Storia ed eventi"
---

# Storia ed eventi

Un'arnia si sposta tra gli apiari, una regina regna e viene sostituita, il
miele viene prelevato in un dato giorno. Per mantenere corretta questa storia
dopo che il mondo cambia, ogni scrittura nella storia congela il contesto che
era vero in quel momento. Il codice è in `app/src/lib/local/history.ts`.

## Gli eventi congelano il loro contesto

La tabella `event` è append-only nell'uso normale. Ogni riga memorizza, come colonne normali,
l'`apiary_id`, l'`hive_id` e il `queen_id` validi alla `date` dell'evento.
Sposta l'arnia il mese prossimo e l'ispezione della scorsa settimana appartiene
ancora al vecchio apiario; cambia regina e un vecchio raccolto resta attribuito
alla regina che lo ha prodotto.

Le stesse righe fungono da tabella dei fatti per le statistiche: `amount_kg`
viene copiato sugli eventi di raccolto, così il miele per apiario, per regina o
per anno è un singolo `GROUP BY` su `event` senza join.

## Storie a intervalli

Due tabelle contengono intervalli semi-aperti `[start, end)`:

| Tabella | Intervallo | Significato |
| --- | --- | --- |
| `queen` | `[introduced_at, replaced_at)` | La regina è a capo della colonia dall'introduzione fino a quando viene sostituita. `replaced_at` è null finché regna; è impostato anche `active`. |
| `placement` | `[start_at, end_at)` | L'arnia si trova in `apiary_id` da `start_at` fino a quando viene spostata. `end_at` è null per la collocazione attuale. |

Gli intervalli semi-aperti si affiancano senza sovrapposizioni: nel giorno del
passaggio corrisponde esattamente una riga.

## resolveContext

Le voci vengono spesso retrodatate (la visita di sabato inserita lunedì), quindi
il contesto viene risolto per la data propria della voce, non per adesso:

```ts
resolveContext(hiveId: string, date: string) -> { apiaryId, queenId }
```

Esegue due query sul database locale e ricade sui valori attuali quando nessun
intervallo copre la data:

```sql
-- Where the hive lived on the date (falls back to hive.apiary_id).
SELECT apiary_id FROM placement
WHERE hive_id = ? AND deleted = 0 AND start_at <= ?
  AND (end_at IS NULL OR end_at > ?)
ORDER BY start_at DESC LIMIT 1;

-- Who reigned on the date (falls back to the queen with active = 1).
SELECT id FROM queen
WHERE hive_id = ? AND deleted = 0 AND introduced_at <= ?
  AND (replaced_at IS NULL OR replaced_at > ?)
ORDER BY introduced_at DESC LIMIT 1;
```

## Funzioni che scrivono la storia

| Funzione | Scrive |
| --- | --- |
| `createHive` | riga `hive`, una `placement` aperta, evento `CREATED` |
| `setQueen` | chiude la regina attiva (`active = 0`, `replaced_at`), inserisce la nuova, eventi `QUEEN_REPLACED` e `QUEEN_INTRODUCED` |
| `moveHive` | chiude la `placement` aperta, ne apre una nuova, aggiorna `hive.apiary_id`, evento `MOVED` con `detail = {from, to}` |
| `recordHarvest` | riga `harvest` con `apiary_id` / `queen_id` congelati, evento `HARVEST` con `amount_kg` e `ref_id` |
| `recordTreatment` | riga `treatment` con contesto congelato, evento `TREATMENT` |
| `recordInspection` | riga `inspection`, evento `INSPECTION` |
| `editInspection`, `editHarvest`, `editTreatment` | correggono la riga di dettaglio e il suo evento; quando cambia la data, `apiary_id` / `queen_id` congelati vengono risolti di nuovo. Raccolti e trattamenti ricevono `amended_at` |
| `editQueen` | corregge i dati della regina senza toccare la cronologia dei regni |
| `deleteInspection`, `deleteHarvest`, `deleteTreatment`, `deleteQueen` | marcano come eliminati (tombstone) la riga e i suoi eventi; eliminare la regina attuale fa tornare attuale la regina precedente. Ciascuna restituisce una funzione di annullamento |

`recordHarvest`, `recordTreatment` e `recordInspection` chiamano prima
`resolveContext`. Tutte le scritture passano da `patch()` in
`app/src/lib/local/repo.ts`, quindi finiscono nella tabella locale e
nell'outbox di sincronizzazione come qualsiasi altra modifica, e ogni flusso
è un'unica transazione locale: la riga di dettaglio, i suoi eventi e le
relative voci dell'outbox vengono scritti insieme oppure per niente. Le righe
di dettaglio (`harvest`, `treatment`, `inspection`) sono normali righe
sincronizzate. Un evento non viene mai modificato o eliminato da solo; cambia
soltanto insieme al record a cui appartiene, quindi la cronologia e le
statistiche corrispondono sempre ai record. L'API del server fa lo stesso
(`server/internal/service/writer.go`).

I numeri dei tipi di evento sono elencati nel [modello dei dati](./data-model.md#event).

## Leggere la storia

```ts
historyForHive(hiveId)     // SELECT * FROM event WHERE deleted = 0 AND hive_id = ?   ORDER BY date DESC
historyForApiary(apiaryId) // ... WHERE apiary_id = ?
historyForQueen(queenId)   // ... WHERE queen_id = ?
```

Statistiche:

```sql
-- honeyByApiary
SELECT apiary_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY apiary_id ORDER BY kg DESC;

-- honeyByQueen
SELECT queen_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY queen_id ORDER BY kg DESC;

-- honeyByYear
SELECT substr(date, 1, 4) AS year, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY year ORDER BY year;
```

`type = 7` è `HARVEST`. Poiché le dimensioni sono congelate sulla riga, non
serve alcun join allo stato attuale.

## Sincronizzazione

Le righe di `event` portano `scope_id` (l'id dell'apiario) come colonna e si
sincronizzano come ogni altra tabella, con last-writer-wins per campo. Poiché
ogni evento ha un UUID nuovo, due dispositivi che aggiungono eventi offline non
toccano mai la stessa riga ed entrambi gli insiemi sopravvivono. Una correzione
o un'eliminazione di un record viaggia come normali modifiche al record e ai
suoi eventi. Vedi il [protocollo di sincronizzazione](./sync-protocol.md).

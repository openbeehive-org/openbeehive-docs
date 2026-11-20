---
sidebar_position: 4
title: "Sync-Protokoll"
---

# Sync-Protokoll

Die App liest und schreibt eine lokale SQLite-WASM-Datenbank und gleicht sie
über `SyncService` mit dem Server ab. Diese Seite dokumentiert den
Wire-Vertrag aus `proto/openbeehive/v1/sync.proto` und die Merge-Regeln in
`server/internal/sync/merge.go` und `app/src/lib/local/merge.ts`.

## Der Dienst

```protobuf
service SyncService {
  rpc Pull(PullRequest) returns (PullResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

Die Client-Schleife (`app/src/lib/local/sync.ts`, `syncOnce`): die Outbox
pushen, dann pullen, bis `has_more` false ist. Die Schleife läuft alle 15 Sekunden,
nach jedem lokalen Schreibvorgang und beim `online`-Event des Browsers. Läufe
werden serialisiert; ein Aufruf, der eintrifft, während einer läuft, plant
einen weiteren Durchgang. Der Client ruft `Subscribe` nicht auf.

Die Outbox wird in Stapeln von höchstens 200 Änderungen und etwa 4 MiB
Payload gepusht; ein Stapel, den der Server als Ganzes ablehnt, wird halbiert
und erneut gesendet.

## Change

Jede Zeilenänderung reist als ein `Change`:

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
  string author_id = 7;    // set by the server from the signed-in caller
}
```

`payload_json` ist ein partielles Delta, nicht die ganze Zeile: `patch()` des
Clients schreibt nur die Spalten, die es geändert hat. Die Schlüssel sind die
`snake_case`-Spaltennamen aus dem [Datenmodell](./data-model.md). Eine
auf dem Gerät angelegte Zeile ist ein Delta, das jede Spalte enthält. Ein
Löschen ist `op = CHANGE_OP_DELETE`; der Empfänger setzt `deleted = true` und
ignoriert das Payload.

Skalare Werte sind Strings, Zahlen, Booleans oder `null`. Booleans reisen als
`0`/`1`, Zeitstempel als ISO-8601-Strings (`""` bedeutet nicht gesetzt). Der
Server behält nur die Spalten, die er kennt, verwirft unbekannte Schlüssel
stillschweigend und speichert das Payload in dieser normalisierten Form, die
auch `Pull` zurückgibt. Empfänger müssen Schlüssel ignorieren, die sie nicht
kennen. `author_id` wird immer vom Server aus dem authentifizierten Aufrufer
gesetzt; was ein Client dort sendet, wird ignoriert. Ein Payload darf
höchstens 4 MiB groß sein und eine Entitäts-Id höchstens 255 Zeichen lang.

Mengenspalten (derzeit nur `inspection.photo_keys`) verwenden eine andere
Payload-Form:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` listet pro entferntem Element die Add-Tags, die das entfernende
Gerät gesehen hatte; nur diese erhalten einen Tombstone, sodass ein
gleichzeitiges Add an anderer Stelle überlebt. Die Regel für sein Fehlen ist
streng:

- `removed_tags` **fehlt** (ältere Clients): Jeder Tag, den der Empfänger für
  das Element hält, wird entfernt.
- `removed_tags` ist für ein Element **vorhanden, aber leer**: Nichts wird
  entfernt.

### HLC-Format

`"<ms:15>:<counter:5>:<node>"`, zum Beispiel
`001781234567890:00003:a1b2c3d4`. Wanduhr in Millisekunden, auf genau 15
Stellen mit Nullen aufgefüllt, ein Zähler mit genau 5 Stellen, dann eine
Node-Id aus 1 bis 64 Zeichen aus `[A-Za-z0-9._-]` (eine zufällige Id, auf dem
Gerät in `localStorage` gespeichert; auf dem Server `BEEHIVE_NODE_ID`,
standardmäßig eine zufällige `srv-…`-Id, die bei jedem Start gewählt wird). Ein
einfacher String-Vergleich ordnet HLCs. Pro Feld gewinnt der neuere Stempel;
gleiche Stempel überschreiben nicht. Ein Stempel, der diesem Format nicht
entspricht, macht die Änderung `invalid`.

**Die 10-Minuten-Grenze.** Der Server lehnt eine Änderung ab, deren Stempel
seiner eigenen Uhr mehr als 10 Minuten voraus ist (`clock_ahead`), weil ein
solcher Stempel jeden späteren Merge gewinnen würde. Sowohl `Pull` als auch
`Push` geben `server_time_ms` zurück; die App nutzt den Wert, um eine falsch
gehende Geräteuhr auszugleichen, und wenn Änderungen als `clock_ahead`
zurückkommen, gibt sie den betroffenen Outbox-Einträgen (und den zugehörigen
Feld-Uhren und Mengen-Tags der lokalen Zeilen) frische Stempel in der alten
Reihenfolge und sendet sie erneut. Die eigene Uhr des Servers folgt nur
Stempeln, die er angenommen und gespeichert hat.

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
}
```

Der Cursor ist der Dezimal-String der Empfangssequenz des Servers
(`change_log.seq`), keine HLC. `Pull` ist auf den Arbeitsbereich begrenzt: Der
Server liefert die Zeilen mit `seq > cursor`, die zum aktiven Arbeitsbereich
des Aufrufers gehören, sortiert nach `seq`. Die eine Ausnahme sind persönliche
Zeilen (Scope `user:<id>`), die nur an ihren Besitzer zurückgegeben werden und
nur innerhalb des Arbeitsbereichs, in dem sie geschrieben wurden.
`next_cursor` ist die letzte zurückgegebene `seq` (oder der Request-Cursor,
wenn nichts passte). Persistiere `next_cursor` erst, nachdem die ganze Seite
angewendet wurde. `has_more` bedeutet, dass die Seite bei `limit`
abgeschnitten wurde; pulle sofort erneut.

Zeilen anderer Arbeitsbereiche verbrauchen trotzdem Sequenznummern, die Werte,
die du siehst, haben also Lücken.

**Der Cursor rückt immer nur durch `Pull` vor.** Ein Gerät darf ihn aus nichts
anderem ableiten, insbesondere nicht aus einer `Push`-Antwort: Änderungen
anderer Geräte mit niedrigeren Sequenznummern würden endgültig übersprungen.

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

Ein Push darf höchstens 2000 Änderungen enthalten (darüber `invalid_argument`).
Der Server wendet jede Änderung für sich an, innerhalb einer Transaktion mit
einem Savepoint pro Änderung: Eine Änderung, die er ablehnt, wird
zurückgerollt und in `rejected` gemeldet, und jede andere Änderung der Anfrage
wird normal angewendet. Eine Änderung, die nicht in `rejected` aufgeführt ist,
wurde angenommen. Angenommen heißt nicht, dass sie gewonnen hat: Felder, die
älter sind als das, was der Server hält, verlieren den feldweisen Merge.

Pro Änderung geht der Server so vor:

1. Er prüft die Änderung selbst: eine bekannte `entity`, eine Id mit 1 bis 255
   Zeichen, als `op` Upsert oder Delete, ein wohlgeformter Stempel, der nicht
   mehr als 10 Minuten voraus ist.
2. Er prüft den Scope: `scope_id` muss der persönliche Scope des Aufrufers
   (`user:<id>`) oder ein Standort im aktiven Arbeitsbereich des Aufrufers
   sein. Eine `apiary`-Änderung, deren `scope_id` ihrer eigenen `entity_id`
   entspricht, eröffnet einen neuen Scope.
3. Er prüft den Arbeitsbereich: Eine bestehende Zeile muss zum aktiven
   Arbeitsbereich des Aufrufers gehören; neue Zeilen werden damit gestempelt.
4. Er normalisiert das Payload auf die bekannten Spalten, führt es Feld für
   Feld zusammen (siehe unten) und hängt es mit einer frischen `seq` an
   `change_log` an.

Die Codes in `rejected`:

| Code | Bedeutung |
| --- | --- |
| `wrong_tenant` | Die Zeile gehört zu einem anderen Arbeitsbereich. |
| `forbidden_scope` | `scope_id` ist für den Aufrufer nicht beschreibbar. |
| `unknown_entity` | `entity` ist keine synchronisierte Tabelle. |
| `invalid` | Fehlerhafter Stempel, fehlerhaftes Payload, fehlerhafter Wert oder fehlerhafte Id. |
| `clock_ahead` | Der Stempel ist dem Server mehr als 10 Minuten voraus; mit korrigierter Uhr neu stempeln und erneut senden. |

Die ganze Anfrage schlägt nur aus Gründen fehl, die nicht eine einzelne
Änderung betreffen: `permission_denied` für schreibgeschützte Identitäten (das
Demo-Konto, API-Schlüssel mit Nur-Lese-Recht), `unauthenticated` oder ein
Serverfehler; in diesem Fall wird nichts aus der Anfrage angewendet.

`server_cursor` und `conflicts` bleiben in der Message, damit ältere Apps die
Antwort weiterhin dekodieren können; beide sind immer leer.

Was die App mit der Antwort macht: Angenommene Änderungen verlassen die
Outbox. Abgelehnte werden in eine Liste abgelehnter Änderungen verschoben, die
der Nutzer als **Sync-Probleme** sieht, mit erneutem Versuch und Verwerfen; die
Zeilen bleiben in den lokalen Tabellen. `clock_ahead` wird durch erneutes
Stempeln behandelt, wie oben beschrieben. Ein Push, der als schreibgeschützt
abgelehnt wird, entfernt den Stapel aus der Outbox und behält die Zeilen
lokal. Jeder andere Fehler behält die Outbox für den nächsten Lauf.

## Merge-Regeln

Beide Seiten wenden denselben Algorithmus an (`applyChange` in
`server/internal/service/sync.go`, `applyRemote` in
`app/src/lib/local/sync.ts`).

Jede synchronisierte Tabelle hat eine Spalte `field_hlc` mit einer JSON-Map
`{ "<column>": "<hlc>" }`, der Feld-Uhr.

**Neue Zeile.** Jede Spalte aus dem Payload einfügen und jede mit der HLC der
Änderung stempeln.

**Bestehende Zeile, skalare Spalte.** Den Wert nur anwenden, wenn die HLC der
Änderung größer ist als der Eintrag der Spalte in `field_hlc`, dann diesen
Eintrag aktualisieren. Zwei Geräte, die verschiedene Spalten derselben Zeile
bearbeiten, gewinnen beide; zwei Geräte, die dieselbe Spalte bearbeiten, lösen
sich zur höheren HLC auf.

**Bestehende Zeile, Mengenspalte.** Der gespeicherte Wert ist ein OR-Set:
`{ "<element>": { "a": ["<tag>", ...], "r": ["<tag>", ...] } }`.
`add`-Elemente erhalten die HLC der Änderung als neuen Tag in `a`.
`remove`-Elemente verschieben die in `removed_tags` gelisteten Tags (oder alle
aktuellen `a`-Tags) nach `r`. Ein Element ist sichtbar, solange es einen Tag in
`a` hat, der nicht in `r` ist, sodass ein Add, das ein Entfernender nie gesehen
hat, überlebt (add-wins). Mengenspalten werden nie durch LWW überschrieben.

**Löschen.** `deleted` ist eine normale skalare Spalte und folgt LWW mit der
HLC des Löschens. Zeilen werden nie entfernt; Leser filtern `deleted = 0`.

Wenn nichts in der Änderung die Feld-Uhr schlägt, bleibt die Zeile unberührt.

Die beiden Implementierungen werden durch gemeinsame Testvektoren identisch
gehalten: `server/internal/sync/testdata/merge_vectors.json` wird von den
Go-Tests und von den Tests der App ausgeführt.

## Scopes

Der Arbeitsbereich ist die einzige Einheit des Teilens. Jede Änderung gehört
zum Arbeitsbereich des Aufrufers, der sie geschrieben hat, und innerhalb des
Arbeitsbereichs trägt sie eine `scope_id`:

- die Id des Standorts, zu dem sie gehört (Standorte verwenden ihre eigene Id;
  Beuten, Königinnen, Durchsichten, Placements, Ernten, Behandlungen,
  Ereignisse und Aufgaben mit einem Standort tragen die Standort-Id), oder
- `user:<user id>` für persönliche Zeilen, etwa eine Aufgabe ohne Standort.

Ein Aufrufer darf in seinen eigenen persönlichen Scope und in die Standorte
seines aktiven Arbeitsbereichs schreiben. Er liest jede Änderung des aktiven
Arbeitsbereichs außer den persönlichen Zeilen anderer Mitglieder. Ein Teilen
einzelner Standorte gibt es nicht.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Ein Server-Stream, pro Arbeitsbereich. Alle zwei Sekunden schlägt der Server
die neueste Änderung nach, die der Aufrufer pullen kann, und sendet
`server_cursor`, wenn sie über den Request-Cursor und über den zuletzt
gesendeten Wert hinaus vorgerückt ist. Er trägt keine Änderungen; ein
Empfänger ruft `Pull` auf. Aktivität in anderen Arbeitsbereichen weckt den
Stream nicht. Ein Nutzer darf höchstens 4 offene Streams halten; ein weiterer
wird mit `resource_exhausted` abgelehnt. Die App nutzt ihn nicht.

## Serverseitige Tabellen

`change_log` ist der Feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, für `Pull` über `(org_id, seq)`
indiziert. `seq_counter` hält die einzelne Zählerzeile (`name = 'change'`),
die pro angenommener Änderung erhöht wird; jeder Schreiber sperrt sie zuerst,
Merges sind also serialisiert. Auf dem Client hält `outbox` noch nicht
gepushte Änderungen in derselben Form, und `sync_meta` speichert den Cursor
unter dem Schlüssel `cursor`.

## Änderungen vom Server

Die CRUD-Dienste (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`, `HarvestService`)
schreiben die
Entitätstabellen nicht direkt. Jeder schreibende RPC baut einen `Change` und
lässt ihn innerhalb einer Transaktion durch `applyChange` und
`appendChangeLog` laufen (`server/internal/service/writer.go`), dieselben
zwei Schritte, die `Push` pro Änderung ausführt. Eine solche Änderung hat als
`author_id` die Benutzer-Id des API-Aufrufers, eine `hlc` aus der eigenen
Uhr des Servers (Node-Id `BEEHIVE_NODE_ID`; die Uhr wird mit dem
`Push`-Handler geteilt, damit sie vor allem Angenommenen bleibt) und als
`scope_id` den Standort, zu dem die Zeile gehört: die eigene Id eines
Standorts, der Standort der Beute bei Beuten, Königinnen, Durchsichten,
Behandlungen und Ernten, und `user:<id>` bei einer Aufgabe ohne Standort. Das
`payload_json` ist ein partielles Delta wie das eines Geräts, sodass eine
spätere Gerätebearbeitung einer anderen Spalte damit zusammengeführt wird,
und die Zeile taucht im nächsten `Pull` jedes Geräts auf, das den Scope
lesen darf. Löschungen über die API sind `CHANGE_OP_DELETE`-Tombstones, und
das Löschen eines Datensatzes setzt auch auf seine Zeitleisten-Ereignisse
Tombstones. Die mehrzeiligen Abläufe (Beute plus Placement plus Ereignis,
Königinnenwechsel, eingefrorener Kontext für Durchsichten, Behandlungen und
Ernten) hängen eine Änderung pro Zeile an und spiegeln
`app/src/lib/local/history.ts`.

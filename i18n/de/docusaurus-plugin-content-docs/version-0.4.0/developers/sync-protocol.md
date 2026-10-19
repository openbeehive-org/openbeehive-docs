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
  string author_id = 7;    // user id of the device or API caller that wrote it
}
```

`payload_json` ist ein partielles Delta, nicht die ganze Zeile: `patch()` des
Clients schreibt nur die Spalten, die es geändert hat. Die Schlüssel sind die
`snake_case`-Spaltennamen aus dem [Datenmodell](/developers/data-model). Eine
auf dem Gerät angelegte Zeile ist ein Delta, das jede Spalte enthält. Ein
Löschen ist `op = CHANGE_OP_DELETE`; der Empfänger setzt `deleted = true` und
ignoriert das Payload.

Mengenspalten (derzeit nur `inspection.photo_keys`) verwenden eine andere
Payload-Form:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` listet die Add-Tags, die das entfernende Gerät gesehen hatte.
Deltas ohne dieses Feld (ältere Clients) entfernen jeden Tag, den der
Empfänger hält.

### HLC-Format

`"<ms:15>:<counter:5>:<node>"`, zum Beispiel
`001781234567890:00003:a1b2c3d4`. Wanduhr in Millisekunden, auf 15 Stellen
mit Nullen aufgefüllt, ein 5-stelliger Zähler, dann eine Node-Id (8 zufällige
Zeichen, auf dem Gerät in `localStorage` gespeichert; auf dem Server
`BEEHIVE_NODE_ID`, Vorgabe `server`). Ein einfacher String-Vergleich ordnet
HLCs. Beide Seiten rufen für jede eingehende HLC `recv()` auf, damit ihre
Uhren vor allem bleiben, was sie gesehen haben.

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

Der Cursor ist der Dezimal-String der Empfangssequenz des Servers
(`change_log.seq`), keine HLC. Der Server liefert Zeilen mit `seq > cursor`,
deren `scope_id` in der Scope-Menge des Aufrufers liegt, sortiert nach `seq`,
und setzt `next_cursor` auf die letzte zurückgegebene `seq` (oder gibt den
Request-Cursor zurück, wenn nichts passte). Persistiere `next_cursor` erst,
nachdem die ganze Seite angewendet wurde. `has_more` bedeutet, dass die Seite
bei `limit` abgeschnitten wurde; pulle sofort erneut.

Zeilen in Scopes, die du nicht lesen darfst, verbrauchen trotzdem
Sequenznummern, die Werte, die du siehst, haben also Lücken.

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

Der Server verarbeitet den Stapel in einer Transaktion:

1. `hlc.Recv(change.hlc)`.
2. Unbekannte `entity`-Werte werden übersprungen.
3. `scope_id` muss in der Scope-Menge des Aufrufers liegen, außer dass eine
   `apiary`-Änderung, deren `scope_id` ihrer eigenen `entity_id` entspricht,
   einen neuen Scope eröffnet. Jeder andere unbekannte Scope lässt den ganzen
   Push mit `permission_denied` fehlschlagen.
4. Die `organization_id` im Payload muss, falls vorhanden und nicht leer, dem
   aktiven Mandanten des Aufrufers entsprechen; eine bestehende Zeile muss zu
   diesem Mandanten gehören. Neue Zeilen werden mit dem Mandanten des
   Aufrufers gestempelt. Eine Abweichung lässt den Push mit
   `permission_denied` fehlschlagen.
5. Die Änderung wird Feld für Feld zusammengeführt (siehe unten) und mit einer
   frischen `seq` an `change_log` angehängt.

`conflicts` ist im aktuellen Server immer leer: Veraltete Felder werden beim
Merge stillschweigend verworfen, und der neuere Wert kommt beim nächsten
`Pull`. `server_cursor` ist die globale Sequenz nach dem Push; der Client
speichert sie als seinen Cursor, wodurch er seine eigenen Änderungen nicht
wieder zurückpullt.

Der Client verwirft den ganzen Outbox-Stapel, wenn `Push` mit
`permission_denied` antwortet (schreibgeschützte Demo-Sitzung oder ein nicht
beschreibbarer Scope). Die Zeilen bleiben in den lokalen Tabellen; nur der
Upload wird aufgegeben. Jeder andere Fehler behält die Outbox für den nächsten
Lauf.

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

## Scopes

Der Server berechnet die Scope-Menge eines Aufrufers als:

```text
{ "user:<user id>" }
  ∪ { id of every apiary in the caller's active tenant }
  ∪ { apiary_id from apiary_share rows for the caller }
```

Dieselbe Menge steuert `Pull` und `Push`. Standorte verwenden ihre eigene Id
als `scope_id`; alles unter einem Standort (Beuten, Königinnen, Durchsichten,
Aufgaben, Placements, Ernten, Behandlungen, Ereignisse) trägt die Standort-Id.
Nichts in der aktuellen App schreibt `apiary_share`, in der Praxis ist die
Scope-Menge also die Standorte des Mandanten.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Ein Server-Stream. Alle zwei Sekunden liest der Server den globalen
Sequenzzähler und sendet `server_cursor`, wenn er über den Request-Cursor und
über den zuletzt gesendeten Wert hinaus vorgerückt ist. Er trägt keine
Änderungen; ein Empfänger ruft `Pull` auf. Der Zähler ist global, nicht pro
Scope, ein Event kann also zu einem leeren Pull führen. Die App nutzt ihn
nicht.

## Serverseitige Tabellen

`change_log` ist der Feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`. `seq_counter` hält die einzelne
Zählerzeile (`name = 'change'`), die pro angenommener Änderung erhöht wird.
Auf dem Client hält `outbox` noch nicht gepushte Änderungen in derselben Form,
und `sync_meta` speichert den Cursor unter dem Schlüssel `cursor`.

## Änderungen vom Server

Die CRUD-Dienste (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`) schreiben die
Entitätstabellen nicht direkt. Jeder schreibende RPC baut einen `Change` und
lässt ihn innerhalb einer Transaktion durch `applyChange` und
`appendChangeLog` laufen (`server/internal/service/writer.go`), dieselben
zwei Schritte, die `Push` pro Änderung ausführt. Eine solche Änderung hat als
`author_id` die Benutzer-Id des API-Aufrufers, eine `hlc` aus der eigenen
Uhr des Servers (Node-Id `BEEHIVE_NODE_ID`; die Uhr wird mit dem
`Push`-Handler geteilt, damit sie vor allem Empfangenen bleibt) und als
`scope_id` den Standort, zu dem die Zeile gehört: die eigene Id eines
Standorts, der Standort der Beute bei Beuten, Königinnen, Durchsichten und
Behandlungen, und `user:<id>` bei einer Aufgabe ohne Standort. Das
`payload_json` ist ein partielles Delta wie das eines Geräts, sodass eine
spätere Gerätebearbeitung einer anderen Spalte damit zusammengeführt wird,
und die Zeile taucht im nächsten `Pull` jedes Geräts auf, das den Scope
lesen darf. Löschungen über die API sind `CHANGE_OP_DELETE`-Tombstones. Die
mehrzeiligen Abläufe (Beute plus Placement plus Ereignis, Königinnenwechsel,
eingefrorener Kontext für Durchsichten und Behandlungen) hängen eine Änderung
pro Zeile an und spiegeln `app/src/lib/local/history.ts`.

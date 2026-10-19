---
sidebar_position: 4
title: "Protocole de synchronisation"
---

# Protocole de synchronisation

L'application lit et écrit une base de données SQLite-WASM locale et la
réconcilie avec le serveur via `SyncService`. Cette page documente le contrat
filaire défini dans `proto/openbeehive/v1/sync.proto` et les règles de fusion de
`server/internal/sync/merge.go` et `app/src/lib/local/merge.ts`.

## Le service

```protobuf
service SyncService {
  rpc Pull(PullRequest) returns (PullResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

La boucle client (`app/src/lib/local/sync.ts`, `syncOnce`) : pousser l'outbox,
puis tirer jusqu'à ce que `has_more` soit false. Elle s'exécute toutes les
15 secondes, après chaque écriture locale et sur l'événement `online` du
navigateur. Les exécutions sont sérialisées ; un appel qui arrive pendant qu'une
exécution est en cours planifie une passe supplémentaire. Le client n'appelle
pas `Subscribe`.

## Change

Chaque modification de ligne voyage sous la forme d'un `Change` :

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

`payload_json` est un delta partiel, pas la ligne entière : le `patch()` du
client n'écrit que les colonnes qu'il a modifiées. Les clés sont les noms de
colonnes en `snake_case` du [modèle de données](/developers/data-model). Une
ligne créée sur l'appareil est un delta contenant toutes les colonnes. Une
suppression est `op = CHANGE_OP_DELETE` ; le destinataire positionne
`deleted = true` et ignore la charge utile.

Les colonnes de type ensemble (actuellement seulement `inspection.photo_keys`)
utilisent une forme de charge utile différente :

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` liste les tags d'ajout que l'appareil qui supprime avait observés.
Les deltas qui ne le contiennent pas (clients plus anciens) suppriment tous les
tags que le destinataire détient.

### Format HLC

`"<ms:15>:<counter:5>:<node>"`, par exemple
`001781234567890:00003:a1b2c3d4`. L'heure murale en millisecondes complétée par
des zéros sur 15 chiffres, un compteur à 5 chiffres, puis un id de nœud
(8 caractères aléatoires stockés dans le `localStorage` de l'appareil ;
`BEEHIVE_NODE_ID`, `server` par défaut, sur le serveur). Une simple comparaison
de chaînes ordonne les HLC. Les deux côtés appellent `recv()` sur chaque HLC
entrante afin que leurs horloges restent en avance sur tout ce qu'ils ont vu.

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

Le curseur est la chaîne décimale de la séquence de réception du serveur
(`change_log.seq`), pas une HLC. Le serveur retourne les lignes dont
`seq > cursor` et dont le `scope_id` fait partie de l'ensemble de scopes de
l'appelant, ordonnées par `seq`, et positionne `next_cursor` sur le dernier
`seq` retourné (ou renvoie le curseur de la requête lorsque rien ne correspond).
Ne persistez `next_cursor` qu'après avoir appliqué toute la page. `has_more`
signifie que la page a été tronquée à `limit` ; tirez à nouveau immédiatement.

Les lignes dans les scopes que vous ne pouvez pas lire consomment quand même des
numéros de séquence, donc les valeurs que vous voyez comportent des trous.

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

Le serveur traite le lot dans une seule transaction :

1. `hlc.Recv(change.hlc)`.
2. Les valeurs d'`entity` inconnues sont ignorées.
3. `scope_id` doit faire partie de l'ensemble de scopes de l'appelant, sauf
   qu'un changement `apiary` dont le `scope_id` est égal à son propre
   `entity_id` ouvre un nouveau scope. Tout autre scope inconnu fait échouer
   l'ensemble du push avec `permission_denied`.
4. L'`organization_id` de la charge utile, s'il est présent et non vide, doit
   correspondre à l'espace (tenant) actif de l'appelant ; une ligne existante
   doit appartenir à cet espace. Les nouvelles lignes sont estampillées avec
   l'espace de l'appelant. Une divergence fait échouer le push avec
   `permission_denied`.
5. Le changement est fusionné champ par champ (voir ci-dessous) et ajouté à
   `change_log` avec un nouveau `seq`.

`conflicts` est toujours vide dans le serveur actuel : les champs périmés sont
abandonnés silencieusement lors de la fusion et la valeur plus récente arrive au
prochain `Pull`. `server_cursor` est la séquence globale après le push ; le
client le stocke comme curseur, ce qui lui évite de retirer ses propres
changements.

Le client abandonne tout le lot de l'outbox lorsque `Push` retourne
`permission_denied` (session de démonstration en lecture seule ou scope non
inscriptible). Les lignes restent dans les tables locales ; seul l'envoi est
abandonné. Toute autre erreur conserve l'outbox pour la prochaine exécution.

## Règles de fusion

Les deux côtés appliquent le même algorithme (`applyChange` dans
`server/internal/service/sync.go`, `applyRemote` dans
`app/src/lib/local/sync.ts`).

Chaque table synchronisée possède une colonne `field_hlc` contenant une map JSON
`{ "<column>": "<hlc>" }`, l'horloge de champ.

**Nouvelle ligne.** Insérer chaque colonne de la charge utile et estampiller
chacune avec la HLC du changement.

**Ligne existante, colonne scalaire.** Appliquer la valeur seulement si la HLC du
changement est supérieure à l'entrée de la colonne dans `field_hlc`, puis mettre
à jour cette entrée. Deux appareils qui modifient des colonnes différentes de la
même ligne gagnent tous les deux ; deux appareils qui modifient la même colonne
sont départagés par la HLC la plus élevée.

**Ligne existante, colonne de type ensemble.** La valeur stockée est un OR-Set :
`{ "<element>": { "a": ["<tag>", ...], "r": ["<tag>", ...] } }`. Les éléments
`add` reçoivent la HLC du changement comme nouveau tag dans `a`. Les éléments
`remove` déplacent les tags listés dans `removed_tags` (ou tous les tags `a`
actuels) dans `r`. Un élément est visible tant qu'il possède un tag dans `a` qui
n'est pas dans `r`, de sorte qu'un ajout que le supprimeur n'a jamais vu survit
(l'ajout gagne). Les colonnes de type ensemble ne sont jamais écrasées par le
LWW.

**Suppression.** `deleted` est une colonne scalaire normale et suit le LWW avec
la HLC de la suppression. Les lignes ne sont jamais retirées ; les lecteurs
filtrent sur `deleted = 0`.

Si rien dans le changement ne bat l'horloge de champ, la ligne est laissée
intacte.

## Scopes

Le serveur calcule l'ensemble de scopes d'un appelant ainsi :

```text
{ "user:<user id>" }
  ∪ { id of every apiary in the caller's active tenant }
  ∪ { apiary_id from apiary_share rows for the caller }
```

Le même ensemble contrôle `Pull` et `Push`. Les ruchers utilisent leur propre id
comme `scope_id` ; tout ce qui se trouve sous un rucher (ruches, reines, visites,
tâches, placements, récoltes, traitements, événements) porte l'id du rucher.
Rien dans l'application actuelle n'écrit `apiary_share`, donc en pratique
l'ensemble de scopes correspond aux ruchers de l'espace.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Un flux serveur. Toutes les deux secondes, le serveur lit le compteur de
séquence global et envoie `server_cursor` lorsqu'il a dépassé le curseur de la
requête et la dernière valeur envoyée. Il ne transporte aucun changement ; un
destinataire appelle `Pull`. Le compteur est global, pas par scope, donc un
événement peut conduire à un pull vide. L'application ne l'utilise pas.

## Tables côté serveur

`change_log` est le flux : `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`. `seq_counter` contient l'unique ligne
de compteur (`name = 'change'`) qui est incrémentée à chaque changement accepté.
Côté client, `outbox` contient les changements pas encore poussés sous la même
forme et `sync_meta` stocke le curseur sous la clé `cursor`.

## Changements émis par le serveur

Les services CRUD (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`) n'écrivent pas
directement dans les tables d'entités. Chaque RPC d'écriture construit un
`Change` et le fait passer par `applyChange` et `appendChangeLog` dans une
seule transaction (`server/internal/service/writer.go`), les deux mêmes étapes
que `Push` effectue pour chaque changement. Un tel changement a un `author_id`
positionné sur l'id utilisateur de l'appelant de l'API, une `hlc` tirée de
l'horloge propre du serveur (id de nœud `BEEHIVE_NODE_ID`, l'horloge partagée
avec le handler `Push` afin qu'elle reste en avance sur tout ce qui a été
reçu), et un `scope_id` correspondant au rucher auquel la ligne appartient :
l'id propre d'un rucher, le rucher de la ruche pour les ruches, reines,
visites et traitements, et `user:<id>` pour une tâche sans rucher. Son
`payload_json` est un delta partiel comme celui d'un appareil, de sorte qu'une
modification ultérieure d'une autre colonne depuis un appareil fusionne avec
lui, et la ligne apparaît au prochain `Pull` de chaque appareil qui peut lire
le scope. Les suppressions via l'API sont des tombstones `CHANGE_OP_DELETE`.
Les flux multi-lignes (ruche plus placement plus événement, remplacement de
reine, contexte figé pour les visites et les traitements) ajoutent un
changement par ligne, à l'image de `app/src/lib/local/history.ts`.

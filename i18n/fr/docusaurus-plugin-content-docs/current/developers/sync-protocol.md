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

L'outbox est poussée par lots d'au plus 200 changements et d'environ 4 MiB de
charge utile ; un lot que le serveur refuse en bloc est divisé par deux et
renvoyé.

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
  string author_id = 7;    // set by the server from the signed-in caller
}
```

`payload_json` est un delta partiel, pas la ligne entière : le `patch()` du
client n'écrit que les colonnes qu'il a modifiées. Les clés sont les noms de
colonnes en `snake_case` du [modèle de données](./data-model.md). Une
ligne créée sur l'appareil est un delta contenant toutes les colonnes. Une
suppression est `op = CHANGE_OP_DELETE` ; le destinataire positionne
`deleted = true` et ignore la charge utile.

Les valeurs scalaires sont des chaînes, des nombres, des booléens ou `null`. Les
booléens voyagent sous la forme `0`/`1`, les horodatages sous forme de chaînes
ISO 8601 (`""` signifie non défini). Le serveur ne conserve que les colonnes
qu'il connaît, abandonne silencieusement les clés inconnues et stocke la charge
utile sous cette forme normalisée, qui est aussi celle que `Pull` retourne. Les
destinataires doivent ignorer les clés qu'ils ne connaissent pas. `author_id`
est toujours défini par le serveur à partir de l'appelant authentifié ; ce
qu'un client y envoie est ignoré. Une charge utile peut peser au plus 4 MiB et
un id d'entité compter au plus 255 caractères.

Les colonnes de type ensemble (actuellement seulement `inspection.photo_keys`)
utilisent une forme de charge utile différente :

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` liste, pour chaque élément supprimé, les tags d'ajout que
l'appareil qui supprime avait observés ; seuls ceux-ci sont marqués comme
supprimés, de sorte qu'un ajout concurrent fait ailleurs survit. La règle en cas
d'absence est stricte :

- `removed_tags` **absent** (clients plus anciens) : tous les tags que le
  destinataire détient pour l'élément sont supprimés.
- `removed_tags` **présent mais vide** pour un élément : rien n'est supprimé.

### Format HLC

`"<ms:15>:<counter:5>:<node>"`, par exemple
`001781234567890:00003:a1b2c3d4`. L'heure murale en millisecondes complétée par
des zéros sur exactement 15 chiffres, un compteur d'exactement 5 chiffres, puis
un id de nœud de 1 à 64 caractères parmi `[A-Za-z0-9._-]` (un id aléatoire
stocké dans le `localStorage` de l'appareil ; sur le serveur `BEEHIVE_NODE_ID`,
par défaut un id aléatoire `srv-…` choisi à chaque démarrage). Une simple
comparaison de chaînes ordonne les HLC. Pour chaque champ, l'estampille la plus
récente gagne ; des estampilles égales n'écrasent rien. Une estampille qui ne
correspond pas à ce format rend le changement `invalid`.

**La limite des 10 minutes.** Le serveur refuse un changement dont l'estampille
est en avance de plus de 10 minutes sur sa propre horloge (`clock_ahead`), car
une telle estampille gagnerait toutes les fusions ultérieures. `Pull` et `Push`
retournent tous deux `server_time_ms` ; l'application s'en sert pour compenser
une horloge d'appareil fausse, et lorsque des changements reviennent en
`clock_ahead`, elle donne aux entrées d'outbox concernées (ainsi qu'aux horloges
de champ et aux tags d'ensemble correspondants des lignes locales) de nouvelles
estampilles dans l'ordre d'origine et les renvoie. L'horloge propre du serveur
ne suit que les estampilles qu'il a acceptées et stockées.

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

Le curseur est la chaîne décimale de la séquence de réception du serveur
(`change_log.seq`), pas une HLC. `Pull` est cadré par espace : le serveur
retourne les lignes dont `seq > cursor` qui appartiennent à l'espace actif de
l'appelant, ordonnées par `seq`. La seule exception concerne les lignes
personnelles (scope `user:<id>`), qui ne sont retournées qu'à leur propriétaire,
et seulement dans l'espace où elles ont été écrites. `next_cursor` est le
dernier `seq` retourné (ou le curseur de la requête lorsque rien ne correspond).
Ne persistez `next_cursor` qu'après avoir appliqué toute la page. `has_more`
signifie que la page a été tronquée à `limit` ; tirez à nouveau immédiatement.

Les lignes des autres espaces consomment quand même des numéros de séquence,
donc les valeurs que vous voyez comportent des trous.

**Le curseur n'avance jamais que par `Pull`.** Un appareil ne doit le dériver de
rien d'autre, en particulier pas d'une réponse de `Push` : les changements
d'autres appareils portant des numéros de séquence inférieurs seraient sautés
pour de bon.

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

Un push peut transporter au plus 2000 changements (`invalid_argument` au-delà).
Le serveur applique chaque changement séparément, dans une seule transaction
avec un point de sauvegarde par changement : un changement qu'il refuse est
annulé et signalé dans `rejected`, et tous les autres changements de la requête
sont appliqués normalement. Un changement qui ne figure pas dans `rejected` a
été accepté. Accepté ne veut pas dire qu'il a gagné : les champs plus anciens
que ce que détient le serveur perdent la fusion champ par champ.

Pour chaque changement, le serveur :

1. Vérifie le changement lui-même : une `entity` connue, un id de 1 à
   255 caractères, un `op` upsert ou delete, une estampille bien formée qui
   n'est pas en avance de plus de 10 minutes.
2. Vérifie le scope : `scope_id` doit être le scope personnel de l'appelant
   (`user:<id>`) ou un rucher de l'espace actif de l'appelant. Un changement
   `apiary` dont le `scope_id` est égal à son propre `entity_id` ouvre un
   nouveau scope.
3. Vérifie l'espace : une ligne existante doit appartenir à l'espace actif de
   l'appelant ; les nouvelles lignes sont estampillées avec celui-ci.
4. Normalise la charge utile selon les colonnes connues, la fusionne champ par
   champ (voir ci-dessous) et l'ajoute à `change_log` avec un nouveau `seq`.

Les codes dans `rejected` :

| Code | Signification |
| --- | --- |
| `wrong_tenant` | La ligne appartient à un autre espace. |
| `forbidden_scope` | `scope_id` n'est pas inscriptible pour l'appelant. |
| `unknown_entity` | `entity` n'est pas une table synchronisée. |
| `invalid` | Estampille, charge utile, valeur ou id mal formés. |
| `clock_ahead` | L'estampille est en avance de plus de 10 minutes sur le serveur ; estampillez de nouveau avec une horloge corrigée et renvoyez. |

La requête entière n'échoue que pour des raisons qui ne tiennent pas à un
changement particulier : `permission_denied` pour les identités en lecture
seule (le compte de démonstration, les clés API en lecture seule),
`unauthenticated`, ou une erreur du serveur, auquel cas rien de la requête
n'est appliqué.

`server_cursor` et `conflicts` restent dans le message afin que les
applications plus anciennes continuent de décoder la réponse ; les deux sont
toujours vides.

Ce que l'application fait de la réponse : les changements acceptés quittent
l'outbox. Les changements rejetés sont déplacés dans une liste de changements
refusés que l'utilisateur voit sous **Problèmes de synchronisation**, avec
nouvel essai et abandon ; les lignes restent dans les tables locales.
`clock_ahead` est traité en estampillant de nouveau, comme décrit ci-dessus. Un
push refusé pour cause de lecture seule retire le lot de l'outbox et conserve
les lignes localement. Toute autre erreur conserve l'outbox pour la prochaine
exécution.

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

Les deux implémentations sont maintenues identiques par des vecteurs de test
partagés : `server/internal/sync/testdata/merge_vectors.json` est exécuté par
les tests Go et par les tests de l'application.

## Scopes

L'espace est la seule unité de partage. Chaque changement appartient à l'espace
de l'appelant qui l'a écrit, et à l'intérieur de l'espace il porte un
`scope_id` :

- l'id du rucher auquel il appartient (les ruchers utilisent leur propre id ;
  les ruches, reines, visites, placements, récoltes, traitements, événements et
  les tâches avec un rucher portent l'id du rucher), ou
- `user:<user id>` pour les lignes personnelles, comme une tâche sans rucher.

Un appelant peut écrire dans son propre scope personnel et dans les ruchers de
son espace actif. Il lit tous les changements de l'espace actif, à l'exception
des lignes personnelles des autres membres. Il n'y a pas de partage par rucher.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Un flux serveur, par espace. Toutes les deux secondes, le serveur recherche le
changement le plus récent que l'appelant peut tirer et envoie `server_cursor`
lorsqu'il a dépassé le curseur de la requête et la dernière valeur envoyée. Il
ne transporte aucun changement ; un destinataire appelle `Pull`. L'activité dans
d'autres espaces ne réveille pas le flux. Un utilisateur peut tenir au plus
4 flux ouverts ; un flux supplémentaire est refusé avec `resource_exhausted`.
L'application ne l'utilise pas.

## Tables côté serveur

`change_log` est le flux : `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, indexé par `(org_id, seq)` pour
`Pull`. `seq_counter` contient l'unique ligne de compteur (`name = 'change'`)
qui est incrémentée à chaque changement accepté ; chaque écrivain la verrouille
d'abord, de sorte que les fusions sont sérialisées. Côté client, `outbox`
contient les changements pas encore poussés sous la même forme et `sync_meta`
stocke le curseur sous la clé `cursor`.

## Changements émis par le serveur

Les services CRUD (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`, `HarvestService`)
n'écrivent pas directement dans les tables d'entités. Chaque RPC d'écriture
construit un `Change` et le fait passer par `applyChange` et `appendChangeLog`
dans une seule transaction (`server/internal/service/writer.go`), les deux mêmes
étapes que `Push` effectue pour chaque changement. Un tel changement a un
`author_id` positionné sur l'id utilisateur de l'appelant de l'API, une `hlc`
tirée de l'horloge propre du serveur (id de nœud `BEEHIVE_NODE_ID`, l'horloge
partagée avec le handler `Push` afin qu'elle reste en avance sur tout ce qui a
été accepté), et un `scope_id` correspondant au rucher auquel la ligne
appartient : l'id propre d'un rucher, le rucher de la ruche pour les ruches,
reines, visites, traitements et récoltes, et `user:<id>` pour une tâche sans
rucher. Son `payload_json` est un delta partiel comme celui d'un appareil, de
sorte qu'une modification ultérieure d'une autre colonne depuis un appareil
fusionne avec lui, et la ligne apparaît au prochain `Pull` de chaque appareil
qui peut lire le scope. Les suppressions via l'API sont des tombstones
`CHANGE_OP_DELETE`, et la suppression d'un enregistrement marque aussi comme
supprimés ses événements de chronologie. Les flux multi-lignes (ruche plus
placement plus événement, remplacement de reine, contexte figé pour les
visites, les traitements et les récoltes) ajoutent un changement par ligne, à
l'image de `app/src/lib/local/history.ts`.

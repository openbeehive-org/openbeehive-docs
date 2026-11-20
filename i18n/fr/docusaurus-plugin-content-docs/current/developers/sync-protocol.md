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
  rpc Snapshot(SnapshotRequest) returns (SnapshotResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

La boucle client (`app/src/lib/local/sync.ts`, `syncOnce`) : pousser l'outbox,
puis tirer jusqu'à ce que `has_more` soit false. Un appareil sans curseur
charge d'abord un [instantané](#snapshot). Elle s'exécute toutes les
15 secondes, après chaque écriture locale et sur l'événement `online` du
navigateur. Les exécutions sont sérialisées ; un appel qui arrive pendant qu'une
exécution est en cours planifie une passe supplémentaire. Le client n'appelle
pas `Subscribe`.

L'outbox est poussée par lots d'au plus 200 changements et d'environ 4 MiB de
charge utile ; un lot que le serveur refuse en bloc est divisé par deux et
renvoyé.

## Versions du protocole \{#versions}

Un client indique quelle version du protocole il parle au moyen de deux
en-têtes de requête, envoyés à chaque appel de `SyncService` :

```text
Openbeehive-Sync-Protocol: 1
Openbeehive-App-Version: 0.5.0
```

La version actuelle est 1 ; la version de l'application est un texte libre
destiné au journal du serveur. Une requête sans `Openbeehive-Sync-Protocol`
provient d'une application 0.4.x installée (version 0). Un tel client est servi
comme le faisait la version 0.4.1 : `Pull` ne retourne que les entités et les
colonnes que cette version connaissait (`legacyCols` dans
`server/internal/service/sync_legacy.go`, une liste qui ne s'allonge jamais),
les curseurs sont de simples numéros de séquence, et il n'y a ni instantanés ni
[signaux d'état](#pull-status). Une application 0.4.x écrit chaque clé d'un
changement tiré dans une colonne de ce nom et cesse de se synchroniser à la
première clé qu'elle ne connaît pas ; c'est pourquoi les nouvelles colonnes et
tables n'atteignent que les clients qui annoncent une version. **Les scripts qui
appellent `SyncService` doivent envoyer l'en-tête** pour tout recevoir.

`BEEHIVE_SYNC_MIN_PROTOCOL` (par défaut `0`) est la version la plus basse que
le serveur accepte. En dessous, chaque appel échoue avec `failed_precondition`
et un détail d'erreur `UpgradeRequired` (`min_protocol`) ; l'application affiche
alors « Application obsolète · mettez-la à jour pour synchroniser » et cesse de
réessayer.

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

Les colonnes de type ensemble (uniquement `inspection.photo_keys`, qui contient
les photos intégrées des applications 0.4.x) utilisent une forme de charge utile
différente :

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
  PullStatus status = 5;
}
```

Le curseur est opaque : stockez `next_cursor` et renvoyez-le tel quel. Pour le
protocole 1, il a la forme `<epoch>:<seq>:<mark>`. `epoch` est un nombre
aléatoire qui identifie la base de données (`sync_state`), `seq` est la séquence
de réception du serveur (`change_log.seq`, pas une HLC), et `mark` est la marque
du dernier démarrage du serveur avant cette position (`sync_boot`). Les clients
0.4.x conservent le simple numéro de séquence. `Pull` est cadré par espace : le serveur
retourne les lignes dont `seq > cursor` qui appartiennent à l'espace actif de
l'appelant, ordonnées par `seq`. La seule exception concerne les lignes
personnelles (scope `user:<id>`), qui ne sont retournées qu'à leur propriétaire,
et seulement dans l'espace où elles ont été écrites. `next_cursor` est le
dernier `seq` retourné (ou le curseur de la requête lorsque rien ne correspond).
Ne persistez `next_cursor` qu'après avoir appliqué toute la page. `has_more`
signifie que la page a été tronquée à `limit` ; tirez à nouveau immédiatement.

Les lignes des autres espaces consomment quand même des numéros de séquence,
donc les valeurs que vous voyez comportent des trous.

**Le curseur n'avance jamais que par `Pull` et `Snapshot`.** Un appareil ne
doit le dériver de rien d'autre, en particulier pas d'une réponse de `Push` :
les changements d'autres appareils portant des numéros de séquence inférieurs
seraient sautés pour de bon.

### État du pull \{#pull-status}

`status` indique ce que le serveur a fait du curseur. Seuls les clients qui
annoncent une version du protocole reçoivent une valeur autre que
`PULL_STATUS_UNSPECIFIED` (le curseur a été accepté). Avec l'une des deux autres
valeurs, `changes` est vide :

| État | Quand | Ce que fait le client |
| --- | --- | --- |
| `PULL_STATUS_SNAPSHOT_REQUIRED` | Le curseur est plus ancien que la plus ancienne entrée que le serveur conserve encore (voir [compactage](#compaction)), ou c'est un simple numéro de séquence antérieur au protocole 1. | Charger un [instantané](#snapshot) et continuer à partir de son curseur. L'outbox n'est pas touchée. |
| `PULL_STATUS_RESET_REQUIRED` | Le curseur n'appartient pas à l'historique de cette base de données : une autre epoch, une position au-delà de la fin du journal, ou une marque qui ne correspond pas. C'est à cela que ressemble une sauvegarde restaurée. | Remettre chaque ligne locale en file d'envoi, charger un instantané, continuer à partir de son curseur. |

Une base de données restaurée a la même epoch, mais le démarrage du serveur
sur celle-ci laisse une nouvelle marque à la position où se termine la
sauvegarde ; tout curseur émis avant la restauration au-delà de cette position
porte donc la mauvaise marque. La vérification suppose que le serveur a été
démarré sur la base restaurée avant de servir des requêtes ; elle ne dépend pas
des entrées du journal, si bien que ni le compactage ni un espace supprimé ne
peuvent masquer une restauration.

Après `RESET_REQUIRED`, l'application remet chaque ligne locale en file d'envoi
sous forme de changements ordinaires, regroupés selon les estampilles que
portent déjà ses colonnes ; le plus ancien changement d'une ligne porte toutes
ses colonnes, de sorte qu'il peut recréer une ligne que le serveur n'a plus. Là
où le serveur possède encore un changement, la fusion ne fait rien. Ensuite,
elle envoie les images de photos qu'elle conserve, après leurs enregistrements.
Les applications 0.4.x ne reçoivent aucun de ces états ; celle dont le curseur
se situe au-delà du journal restauré relit le journal depuis le début.

## Instantané \{#snapshot}

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

`Snapshot` retourne, page par page, les lignes actuelles de l'espace de
l'appelant, lignes supprimées (tombstones) comprises et, parmi les lignes
personnelles, uniquement celles de l'appelant ; une page est coupée vers 4 MiB.
Il exige une version du protocole : un appel sans l'en-tête échoue avec
`failed_precondition` et `UpgradeRequired`. Une colonne de type ensemble porte
tout son état OR-Set au lieu d'un delta. Le client fusionne chaque ligne colonne
par colonne comme un changement, de sorte que les modifications locales aux
estampilles plus récentes survivent et que l'outbox n'est pas touchée ; une
colonne sans estampille n'est reprise que là où la ligne locale n'en a pas non
plus. Le curseur est pris avant la lecture de la première ligne : une ligne qui
change pendant la récupération des pages revient donc par `Pull`. L'application
ne stocke le curseur qu'après la dernière page ; un instantané interrompu
recommence depuis le début.

Un appareil utilise un instantané lorsqu'il n'a pas de curseur (un nouvel
appareil, ou après une mise à jour depuis la 0.4.x), après `SNAPSHOT_REQUIRED`
et après `RESET_REQUIRED`. Les enregistrements de photos arrivent avec leurs
miniatures, jamais avec les images complètes.

## Compactage \{#compaction}

Une fois par jour, le serveur supprime les entrées du journal des modifications
reçues il y a plus de `BEEHIVE_CHANGELOG_RETENTION_DAYS` jours (180 par défaut ;
`0` conserve tout ; `change_log.logged_at` est l'heure de réception) et
enregistre le numéro de séquence jusqu'auquel il l'a fait (l'horizon, dans
`sync_state`). Un curseur situé sous l'horizon reçoit `SNAPSHOT_REQUIRED` ; une
application 0.4.x avec un tel curseur reçoit l'échec `UpgradeRequired` et ne
peut plus se synchroniser tant qu'elle n'est pas mise à jour. Les lignes
elles-mêmes restent. Rien d'autre ne lit les anciennes entrées du journal : le
propriétaire d'une tâche personnelle, par exemple, est stocké sur la tâche
(`task.owner_id`). La tâche s'exécute dans le processus du serveur et suppose
qu'elle est la seule : exécutez exactement une instance par base de données.

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
push refusé pour cause de lecture seule (`permission_denied`, le compte de
démonstration) ne peut jamais aboutir : l'application retire le lot, oublie les
lignes qu'il touchait et efface son curseur, de sorte que le pull de la même
exécution recharge les lignes du serveur depuis un instantané, et elle indique
à l'utilisateur que la modification n'a pas été enregistrée. Une requête refusée
parce que trop volumineuse ou mal formée est divisée par deux jusqu'à ce que le
changement fautif se retrouve seul. Toute autre erreur conserve l'outbox pour la
prochaine exécution.

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
- `user:<user id>` pour les lignes personnelles, comme une tâche sans rucher,
  et les paramètres du compte.

Un appelant peut écrire dans son propre scope personnel et dans les ruchers de
son espace actif. Il lit tous les changements de l'espace actif, à l'exception
des lignes personnelles des autres membres. Il n'y a pas de partage par rucher.

### Paramètres du compte \{#account-settings}

`user_settings` (unités et langue) est la seule table synchronisée dont les
lignes appartiennent à un compte plutôt qu'à un espace : une ligne par compte,
avec l'id du compte comme id de ligne, écrite uniquement dans le scope personnel
du compte. Ses entrées de journal sont classées sous le compte (`org_id`
`user:<id>`), si bien que `Pull`, `Subscribe` et `Snapshot` la servent dans
chaque espace du compte, et que deux appareils qui la créent hors ligne écrivent
la même ligne. Quitter un espace la conserve ; supprimer le compte la supprime.
Les valeurs ne changent que ce qu'affiche l'application ; les enregistrements,
les charges utiles, les exports et l'API restent en unités métriques. Le thème
de couleurs n'en fait pas partie.

### Photos \{#photos}

Une photo est une ligne `photo` (`owner_entity` `inspection` ou `hive`,
`owner_id`, `thumb` sous forme de data URL d'environ 200 px, `content_type`,
`size_bytes`) qui se synchronise comme n'importe quelle autre ligne. L'image en
taille réelle n'entre jamais dans le flux : l'appareil qui a pris la photo
l'envoie avec `POST /photos/<id>` une fois l'enregistrement poussé, et les
autres appareils la récupèrent avec `GET /photos/<id>` la première fois qu'elle
est ouverte. Les deux exigent la session ou une clé API et l'appartenance à
l'espace de la photo. Un envoi n'est accepté qu'une fois par photo, si bien que
l'image derrière un id ne change jamais. Supprimer une photo est définitif : le
serveur efface la miniature de la ligne et du journal, et retire l'image.

Les applications 0.4.x conservent leurs photos intégrées
(`inspection.photo_keys`, `hive.photo`). Le serveur accepte ce format de leur
part, le leur sert et le convertit en enregistrements de photos. Les clients qui
annoncent une version du protocole reçoivent les enregistrements de photos et
jamais les copies intégrées ; les applications 0.4.x reçoivent les copies
intégrées et jamais de lignes `photo`.

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
La version minimale du protocole s'y applique comme aux autres appels.
L'application ne l'utilise pas.

## Tables côté serveur

`change_log` est le flux : `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, `logged_at`, indexé par
`(org_id, seq)` pour `Pull` et par `logged_at` pour le compactage. `sync_state`
contient l'`epoch` de la base de données et l'`horizon` de compactage ;
`sync_boot` contient une marque par démarrage du serveur. `seq_counter` contient l'unique ligne de compteur (`name = 'change'`)
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

---
sidebar_position: 2
title: "REST / HTTP + JSON"
---

# REST / HTTP + JSON

Chaque RPC accepte une simple requête `POST` avec un corps JSON, selon le
[protocole Connect](https://connectrpc.com/docs/protocol/). Aucun outillage
gRPC n'est nécessaire.

## Forme de la requête

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
Content-Type: application/json
Authorization: Bearer <token>      # only when login is configured
```

- Le corps est le message de requête au format JSON proto3 : noms de champs en
  `lowerCamelCase` (`apiaryId`, `pageSize`, `weightKg`). Le serveur accepte
  aussi les noms proto en `snake_case`, mais les réponses utilisent toujours le
  `lowerCamelCase`.
- Les champs d'énumération prennent le nom de la valeur (`"HIVE_TYPE_DADANT"`,
  `"STORES_GOOD"`) ou son numéro. Les réponses utilisent le nom.
- Les horodatages sont des chaînes RFC 3339 en UTC (`"2026-06-19T09:14:02Z"`).
  Omettez un horodatage pour obtenir la valeur par défaut du serveur (`date` et
  `introducedAt` valent maintenant par défaut ; `dueAt` et `withdrawalUntil`
  restent non définis).
- La réponse est le message de réponse au format JSON, avec un code HTTP `200`.
- Les champs à leur valeur par défaut (chaîne vide, `0`, `false`, liste vide)
  sont omis des réponses.

Les exemples ci-dessous utilisent `$OB` pour l'origine et `$TOKEN` pour une
clé API (`obhk_...`, créée sous **Paramètres → Clés API**) ou un jeton de
session, comme décrit dans la [présentation](./overview.md#authentication).
Supprimez l'en-tête `Authorization` sur une instance sans connexion.

## Lister les ruchers

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

```json
{
  "apiaries": [
    {
      "id": "2b1f6c0e-...",
      "organizationId": "9d3a...",
      "name": "Orchard Meadow",
      "lat": 48.21,
      "lng": 16.37,
      "hiveCount": 3,
      "createdAt": "2026-04-02T09:14:02Z",
      "updatedAt": "2026-04-02T09:14:02Z"
    }
  ],
  "page": { "total": 1 }
}
```

## Créer un rucher

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/CreateApiary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Orchard Meadow","address":"Field road 3","lat":48.21,"lng":16.37}'
```

`name` ne doit pas être vide (`invalid_argument` sinon). La réponse est
`{"apiary": {...}}`. `UpdateApiary` prend `id` plus les champs à modifier ; voir
[Mettre à jour un enregistrement](#update-a-record). `DeleteApiary` échoue avec
`failed_precondition` tant que le rucher contient des ruches.

## Créer et lister des ruches

```bash
curl -s -X POST "$OB/openbeehive.v1.HiveService/CreateHive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","name":"Hive 3","type":"HIVE_TYPE_ZANDER","boxes":2}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

`ListHives` sans `apiaryId` liste toutes les ruches de l'espace et est paginé
comme les autres listes (`total` est le nombre réel de ruches
correspondantes). `CreateHive` a besoin d'`apiaryId` et de `name` ; la nouvelle
ruche reçoit le statut `HIVE_STATUS_ACTIVE`, un intervalle de placement ouvert
et un événement `CREATED`. `UpdateHive` prend un message `hive` avec `id` et les
champs à modifier (`name`, `type`, `status`, `boxes`, `colonyOrigin`, `note`,
`qrCode`) ; il ne modifie jamais `apiaryId` ni la photo. `RelocateHive` prend
`{"id": ..., "targetApiaryId": ..., "date": ...}` (`date` facultative, vaut
maintenant par défaut), clôture le placement en cours, en ouvre un nouveau et
enregistre un événement `MOVED`. `DeleteApiary` et `DeleteHive` écrivent un
tombstone, de sorte que la suppression atteint les appareils via la
synchronisation. `DeleteHive` supprime aussi les tâches ouvertes de la ruche.

## Enregistrer une visite

Chaque champ sauf `hiveId` est facultatif. Une balance de ruche n'enverrait que
les mesures :

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","weightKg":42.5,"tempHive":34.2,"humidityHive":58,"note":"scale, 06:00"}'
```

```json
{
  "inspection": {
    "id": "7f0e...",
    "organizationId": "9d3a...",
    "hiveId": "c41a...",
    "date": "2026-06-19T04:00:11.204Z",
    "note": "scale, 06:00",
    "createdAt": "2026-06-19T04:00:11.204Z",
    "weightKg": 42.5,
    "tempHive": 34.2,
    "humidityHive": 58
  }
}
```

Une visite complète utilise le même appel avec les champs de la fiche de
ruche :

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "hiveId": "c41a...",
    "date": "2026-06-19T09:00:00Z",
    "weather": "sunny, 22 C",
    "queenSeen": true,
    "eggsSeen": true,
    "coveredLarva": true,
    "frames": 8,
    "broodFrames": 5,
    "stores": "STORES_GOOD",
    "temperament": "TEMPERAMENT_GENTLE",
    "calmness": 3,
    "queenCells": 0,
    "varroa": "2",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` vaut l'un de `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE` ; `temperament` l'un de `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. Le serveur stocke le rucher et la reine régnante à
la `date` indiquée et enregistre un événement `INSPECTION`.

Les nombres d'une visite (`frames`, `broodFrames`, `queenCells`,
`youngestLarva`, `framesAdded`, `framesRemoved`, `fedKg`, `honeyKg`,
`weightKg` et les quatre champs climatiques) sont optionnels : un
champ que vous omettez est stocké comme « non enregistré » et est absent des
réponses, tandis qu'un `0` explicite est stocké et renvoyé comme un zéro
observé. `honeyKg` est conservé pour les anciens enregistrements ; enregistrez
le miel avec `HarvestService`.

`source` indique qui a fait l'entrée : `INSPECTION_SOURCE_MANUAL` (la valeur
par défaut lorsque vous n'en envoyez aucune) pour une visite par une personne,
`INSPECTION_SOURCE_SENSOR` pour un relevé automatisé. Les relevés de capteur
apparaissent dans les graphiques mais ne comptent pas comme « dernière visite »
et sont exclus de la liste des visites à effectuer et des visites récentes du
tableau de bord ; voir [Trackers automatisés](./automated-trackers.md).

Les photos sont ajoutées ensuite avec `AddInspectionPhoto` :

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` doit être une URL de données commençant par `data:image/` et faire au
plus 512 Kio, préfixe compris. Elle est répliquée sur chaque appareil, envoyez
donc une vignette (l'application stocke environ 480 px).
`RemoveInspectionPhoto` prend le même `inspectionId` et la valeur `photo`
exacte stockée ; le champ `inspection.photoKeys` de la réponse liste ce qui
est stocké.

## Lister les visites avec pagination

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2}}'
```

```json
{
  "inspections": [
    { "id": "7f0e...", "hiveId": "c41a...", "date": "2026-06-19T04:00:11.204Z", "weightKg": 42.5, "tempHive": 34.2, "humidityHive": 58, "note": "scale, 06:00", "createdAt": "2026-06-19T04:00:11.204Z", "organizationId": "9d3a..." },
    { "id": "5c22...", "hiveId": "c41a...", "date": "2026-06-18T04:00:09.871Z", "weightKg": 42.1, "tempHive": 34.4, "humidityHive": 57, "note": "scale, 06:00", "createdAt": "2026-06-18T04:00:09.871Z", "organizationId": "9d3a..." }
  ],
  "page": { "nextPageToken": "2", "total": 3 }
}
```

Les résultats sont du plus récent au plus ancien. Renvoyez `nextPageToken`
dans `pageToken` pour la page suivante :

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2,"pageToken":"2"}}'
```

La dernière page n'a pas de `nextPageToken`. `ListInspections` sans `hiveId`
liste toutes les visites de l'espace. `source` filtre selon qui a enregistré
l'entrée : omettez-le pour tout obtenir, `"INSPECTION_SOURCE_MANUAL"` pour les
seules visites faites par une personne, `"INSPECTION_SOURCE_SENSOR"` pour les
seuls relevés.

## Mettre à jour un enregistrement \{#update-a-record}

`UpdateApiary`, `UpdateHive`, `UpdateQueen`, `UpdateInspection`,
`UpdateTask`, `UpdateTreatment` et `UpdateHarvest` ne modifient que les champs
que vous envoyez. Corriger le poids d'une visite :

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e...","weightKg":41.9}}'
```

Tout le reste de l'enregistrement demeure tel quel. Pour mettre un champ à sa
valeur zéro, ou pour ramener un nombre optionnel à « non enregistré »,
nommez-le dans `updateMask` :

```bash
# clear the note and remove the recorded weight
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e..."},"updateMask":"note,weightKg"}'
```

Avec un masque, exactement les champs listés sont écrits, et rien d'autre. Une
requête qui ne changerait rien répond `invalid_argument`. Les règles par
appel :

| Appel | Requête | Notes |
| --- | --- | --- |
| `UpdateApiary` | `id` et les champs au niveau supérieur, plus `updateMask` | `name` ne doit pas devenir vide |
| `UpdateHive` | `hive`, `updateMask` | `apiaryId` est ignoré (utilisez `RelocateHive`) ; `status` ne peut pas être mis à non précisé |
| `UpdateQueen` | `queen`, `updateMask` | Sans masque, envoyer `replacedAt` seul met fin au règne (`active` devient `false`) et envoyer `active: true` efface `replacedAt` |
| `UpdateInspection` | `inspection`, `updateMask` | Les photos changent via les appels photo ; l'événement `INSPECTION` suit une `date` modifiée |
| `UpdateTask` | `task`, `updateMask` | `hiveId` et `apiaryId` ne peuvent pas changer ; utilisez un masque pour retirer `dueAt` ou rouvrir une tâche |
| `UpdateTreatment` | `treatment`, `updateMask` | Définit `amendedAt` ; le rucher et la reine sont résolus de nouveau lorsque `date` change |
| `UpdateHarvest` | `harvest`, `updateMask` | Définit `amendedAt` ; `amountKg` doit rester supérieur à `0` ; les chiffres de miel suivent la modification |

## Créer une reine

```bash
curl -s -X POST "$OB/openbeehive.v1.QueenService/CreateQueen" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","year":2026,"origin":"own rearing","breederNumber":"B-17"}'
```

```json
{
  "queen": {
    "id": "a9d1...",
    "organizationId": "9d3a...",
    "hiveId": "c41a...",
    "year": 2026,
    "marking": "MARKING_COLOR_WHITE",
    "origin": "own rearing",
    "breederNumber": "B-17",
    "introducedAt": "2026-06-19T09:20:41.003Z",
    "active": true,
    "createdAt": "2026-06-19T09:20:41.003Z",
    "updatedAt": "2026-06-19T09:20:41.003Z"
  }
}
```

`hiveId` et `year` sont obligatoires. `marking` prend par défaut la couleur
internationale de l'année (`MARKING_COLOR_WHITE` pour les années finissant par
1 ou 6, `YELLOW` 2/7, `RED` 3/8, `GREEN` 4/9, `BLUE` 5/0) ; `introducedAt`
vaut maintenant par défaut. Créer une reine met toujours fin au règne de la
reine active actuelle de la ruche (`active: false`, `replacedAt` positionné)
et enregistre les événements `QUEEN_REPLACED` et `QUEEN_INTRODUCED`.
`ListQueens` prend `hiveId` et `onlyActive` ; `UpdateQueen` corrige `year`,
`marking`, `origin`, `breederNumber`, `introducedAt`, `replacedAt`, `active`
et `note` (`hiveId` ne peut pas changer ; voir
[Mettre à jour un enregistrement](#update-a-record)). `DeleteQueen` retire
aussi ses événements `QUEEN_INTRODUCED` et `QUEEN_REPLACED`.

## Tâches

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/CreateTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Varroa count","hiveId":"c41a...","dueAt":"2026-07-01T00:00:00Z","priority":"TASK_PRIORITY_HIGH"}'
```

```json
{
  "task": {
    "id": "e3b7...",
    "organizationId": "9d3a...",
    "title": "Varroa count",
    "hiveId": "c41a...",
    "apiaryId": "2b1f6c0e-...",
    "dueAt": "2026-07-01T00:00:00Z",
    "priority": "TASK_PRIORITY_HIGH",
    "createdAt": "2026-06-19T09:22:05.118Z"
  }
}
```

`title` est obligatoire. Une tâche avec `hiveId` hérite de l'`apiaryId` de la
ruche lorsque vous n'en envoyez aucun ; `apiaryId` doit exister dans votre
espace. Une tâche sans l'un ni l'autre est personnelle : elle ne se synchronise
que vers vos propres appareils et `ListTasks` ne la renvoie qu'à vous.
Cochez-la avec :

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

La réponse est `{"task": {...}}` avec `"done": true`. `ListTasks` prend
`onlyOpen` et `hiveId` et renvoie d'abord les tâches ouvertes, triées par
`dueAt`. `UpdateTask` modifie `title`, `dueAt`, `done`, `priority`, `note`,
`recurrence` et `assignedTo`.

## Traitements

```bash
curl -s -X POST "$OB/openbeehive.v1.TreatmentService/CreateTreatment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","product":"Oxuvar 5.7%","activeIngredient":"oxalic acid","dose":"50 ml","method":"trickling","batchNumber":"L2405","withdrawalUntil":"2026-12-01T00:00:00Z"}'
```

`hiveId` et `product` sont obligatoires ; `reason` vaut `"varroa"` par
défaut. Le `treatment` de la réponse porte l'`apiaryId` et le `queenId` figés
à la `date` indiquée. `ListTreatments` prend `hiveId` et renvoie du plus
récent au plus ancien. `UpdateTreatment` corrige un traitement et renseigne
`amendedAt`, que l'application affiche comme « Modifié le » et imprime dans le
registre des traitements ; `DeleteTreatment` retire aussi son événement
`TREATMENT`.

## Récoltes

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/CreateHarvest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","amountKg":18.5,"variety":"spring flow","waterContent":17.2,"batchNumber":"2026-03","bestBefore":"2028-06-01T00:00:00Z","note":"two supers"}'
```

```json
{
  "harvest": {
    "id": "b6e2...",
    "organizationId": "9d3a...",
    "apiaryId": "2b1f6c0e-...",
    "date": "2026-06-19T09:31:17.442Z",
    "variety": "spring flow",
    "amountKg": 18.5,
    "waterContent": 17.2,
    "batchNumber": "2026-03",
    "bestBefore": "2028-06-01T00:00:00Z",
    "note": "two supers",
    "hiveId": "c41a...",
    "queenId": "a9d1..."
  }
}
```

`hiveId` est obligatoire et `amountKg` doit être supérieur à `0`
(`invalid_argument` sinon) ; `date` vaut maintenant par défaut. La réponse
porte l'`apiaryId` et le `queenId` figés à la `date` indiquée. Le serveur
enregistre aussi un événement `HARVEST` avec `amountKg` et le titre
`18.5 kg spring flow` (`Honey` lorsque `variety` est vide), qui est ce que
`GetDashboard` et `GetHoneyStats` additionnent.

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/ListHarvests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","page":{"pageSize":20}}'
```

`ListHarvests` filtre par `hiveId` ou `apiaryId` (tous deux facultatifs) et
renvoie `{"harvests": [...], "page": {...}}`, du plus récent au plus ancien.
`UpdateHarvest` corrige une récolte et renseigne `amendedAt` ; `DeleteHarvest`
prend `{"id": ...}`, écrit un tombstone et retire l'événement `HARVEST`, de
sorte que les chiffres de miel ne la comptent plus.

## Événements

```bash
curl -s -X POST "$OB/openbeehive.v1.EventService/ListEvents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","limit":20}'
```

Les filtres sont `apiaryId`, `hiveId` et `queenId` ; `limit` vaut 100 par
défaut et est plafonné à 1000. Les événements arrivent du plus récent au plus
ancien et ne sont pas paginés. Chacun possède `type`
(`EVENT_TYPE_INSPECTION`, `EVENT_TYPE_HARVEST`, ...), les `apiaryId` /
`hiveId` / `queenId` figés, `refEntity` / `refId` qui pointent vers la ligne de
détail, `amountKg` pour les récoltes, `detailJson` et `authorId`.

## Tableau de bord

```bash
curl -s -X POST "$OB/openbeehive.v1.StatsService/GetDashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

```json
{
  "apiaries": 2,
  "hives": 7,
  "activeQueens": 6,
  "openTasks": 3,
  "overdueTasks": 1,
  "honeyKgSeason": 41.5,
  "dueInspections": [
    { "hiveId": "0d4c...", "hiveName": "Hive 5", "apiaryName": "Orchard Meadow", "daysSinceLast": -1 },
    { "hiveId": "c41a...", "hiveName": "Hive 3", "apiaryName": "Orchard Meadow", "daysSinceLast": 27 }
  ],
  "nextTasks": [ { "id": "e3b7...", "title": "Varroa count", "dueAt": "2026-07-01T00:00:00Z" } ],
  "recentInspections": [ { "id": "7f0e...", "hiveId": "c41a...", "date": "2026-06-19T04:00:11.204Z" } ],
  "honeyHistory": [ { "year": 2026, "month": 6, "kg": 41.5 } ]
}
```

`thresholdDays` (21 par défaut) définit à partir de quand une ruche est
considérée comme à visiter : les ruches dont la dernière visite date d'au moins
ce nombre de jours, plus les ruches jamais visitées (`daysSinceLast: -1`,
listées en premier). Les relevés de capteur (`INSPECTION_SOURCE_SENSOR`) ne
comptent pas ici comme des visites et ne figurent pas dans
`recentInspections`. `nextTasks` contient les cinq prochaines tâches ouvertes,
`recentInspections` les dix dernières visites. Les chiffres de miel viennent
des événements `HARVEST` ; `honeyKgSeason` correspond à l'année civile en
cours. `GetHoneyStats` prend `year` (0 = toutes les années) et renvoie les
sommes `perQueen`, `perApiary` et `perYear`.

## Récupérer le flux des changements

```bash
curl -s -X POST "$OB/openbeehive.v1.SyncService/Pull" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cursor":"","limit":100}'
```

```json
{
  "changes": [
    {
      "entity": "inspection",
      "entityId": "7f0e...",
      "scopeId": "2b1f6c0e-...",
      "op": "CHANGE_OP_UPSERT",
      "payloadJson": "{\"hive_id\":\"c41a...\",\"date\":\"2026-06-19T04:00:11.204Z\",\"weight_kg\":42.5}",
      "hlc": "001781234567890:00000:srv-3fa91c0b77d2",
      "authorId": "u-…"
    }
  ],
  "nextCursor": "48213",
  "hasMore": false,
  "serverTimeMs": "1781234569120"
}
```

`payloadJson` est une chaîne JSON dont les clés sont les noms de colonnes de la
table en `snake_case`. Renvoyez `nextCursor` dans `cursor` pour continuer. `limit`
vaut 200 par défaut et est plafonné à 500. Le flux couvre l'espace de
l'appelant ; les lignes personnelles (scope `user:<id>`) ne sont renvoyées
qu'à leur propriétaire. Le flux contient chaque changement, qu'un appareil l'ait poussé ou qu'un RPC de
service l'ait écrit ; les placements n'apparaissent qu'ici, puisqu'ils n'ont
pas de service propre. Voir le
[protocole de synchronisation](../developers/sync-protocol.md) pour savoir comment
écrire des changements avec `Push`.

## Pagination

Chaque RPC `List*` sauf `ListEvents` prend `page: { pageSize, pageToken }` et
renvoie `page: { nextPageToken, total }` :

- `pageSize` : lignes par page, 50 par défaut, plafonné à 500.
- `pageToken` : le décalage de départ, sous forme de chaîne décimale. Envoyez
  le `nextPageToken` de la réponse précédente ; `""` ou absent démarre à la
  première ligne.
- `nextPageToken` : défini lorsque la page était pleine et qu'il reste des
  lignes ; absent sur la dernière page.
- `total` : nombre de lignes correspondantes.

`ListEvents` prend un simple `limit`. `Pull` utilise ses propres champs
`cursor` / `nextCursor` / `hasMore`.

## Erreurs

Les erreurs reviennent sous forme de corps JSON avec un code Connect :

```json
{ "code": "not_found", "message": "not found" }
```

| Code | HTTP | Quand |
| --- | --- | --- |
| `invalid_argument` | 400 | `name` vide ; `hiveId` manquant (visite, reine, traitement, récolte), `year` (reine), `title` (tâche), `product` (traitement) ; `amountKg` non supérieur à `0` (récolte) ; `apiaryId` inexistant sur `CreateTask` ; une photo qui n'est pas une URL `data:image/` ou dépasse 512 Kio ; `hive` / `queen` manquant sur les appels de mise à jour |
| `unauthenticated` | 401 | Jeton manquant, expiré ou supprimé : clé API inconnue ou révoquée, ou jeton de session au-delà de `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Session de démonstration ou clé API en lecture seule appelant un RPC d'écriture |
| `failed_precondition` | 400 | `DeleteApiary` tant que le rucher contient des ruches |
| `resource_exhausted` | 429 | Plus de 4 flux `Subscribe` ouverts pour un même utilisateur |
| `not_found` | 404 | Id inconnu, ou id appartenant à un autre espace, sur tout `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, les appels photo et chaque `Create*` qui référence une ruche ou un rucher |
| `internal` | 500 | Défaillances côté serveur. Le message est toujours `internal error` ; les détails ne figurent que dans le journal du serveur |

Une mise à jour qui ne changerait rien, et un `Push` de plus de 2000
changements, répondent aussi `invalid_argument`. Voir la
[référence des erreurs Connect](https://connectrpc.com/docs/protocol/#error-codes)
pour la liste complète des codes.

### Codes d'erreur des endpoints HTTP simples \{#http-error-codes}

Les endpoints `/auth/*` et `/tenants/*` ne sont pas des RPC. Leurs erreurs sont
de la forme `{"error": "<plain English>", "code": "<snake_case>"}` avec un
statut HTTP correspondant. Les clients doivent se fier à `code` ; le texte peut
changer.

| HTTP | Codes |
| --- | --- |
| 400 | `invalid_body`, `invalid_email`, `invalid_scope`, `invalid_expiry`, `id_required`, `name_required`, `org_id_required`, `invite_invalid`, `invite_expired`, `verification_invalid`, `unknown_provider`, `oidc_state_missing`, `oidc_state_invalid`, `oidc_no_email`, `passkey_no_ceremony`, `passkey_failed` |
| 401 | `not_signed_in`, `invalid_credentials`, `oidc_failed`, `passkey_failed` |
| 403 | `cross_site_request`, `demo_read_only`, `invite_only`, `invite_email_mismatch`, `not_a_member`, `owner_only`, `passkey_session_mismatch` |
| 404 | `not_found`, `invite_not_found`, `key_not_found`, `passkey_not_found` |
| 405 | `method_not_allowed` |
| 409 | `account_exists` |
| 413 | `body_too_large` |
| 415 | `unsupported_media_type` |
| 429 | `rate_limited` (avec `Retry-After`) |
| 500 | `internal` |
| 503 | `demo_unavailable`, `unavailable` |

## Remarques

- Envoyez `{}` pour une requête sans champs.
- `Content-Type: application/json` sélectionne le protocole JSON de Connect.
  `application/proto` envoie du protobuf binaire sur la même URL.
- `SyncService.Subscribe` est un flux serveur et nécessite un client de
  streaming ; voir [gRPC](./grpc.md).

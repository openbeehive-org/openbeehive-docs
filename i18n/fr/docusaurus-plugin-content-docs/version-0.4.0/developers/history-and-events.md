---
sidebar_position: 2
title: "Historique et événements"
---

# Historique et événements

Une ruche est déplacée entre des ruchers, une reine règne puis est remplacée,
du miel est prélevé un jour donné. Pour que cet historique reste correct après
que le monde a changé, chaque écriture d'historique fige le contexte qui était
vrai à ce moment-là. Le code se trouve dans `app/src/lib/local/history.ts`.

## Les événements figent leur contexte

La table `event` est en ajout seul. Chaque ligne stocke, sous forme de colonnes
ordinaires, les `apiary_id`, `hive_id` et `queen_id` qui s'appliquaient à la
`date` de l'événement. Déplacez la ruche le mois prochain et l'inspection de la
semaine dernière appartient toujours à l'ancien rucher ; remérez et une ancienne
récolte reste attribuée à la reine qui l'a produite.

Les mêmes lignes servent de table de faits pour les statistiques : `amount_kg`
est copié sur les événements de récolte, de sorte que le miel par rucher, par
reine ou par année est un seul `GROUP BY` sur `event`, sans jointure.

## Historiques par intervalle

Deux tables contiennent des intervalles semi-ouverts `[start, end)` :

| Table | Intervalle | Signification |
| --- | --- | --- |
| `queen` | `[introduced_at, replaced_at)` | La reine est à la tête de la colonie de son introduction jusqu'à son remplacement. `replaced_at` est nul tant qu'elle règne ; `active` est aussi positionné. |
| `placement` | `[start_at, end_at)` | La ruche se trouve dans `apiary_id` de `start_at` jusqu'à son déplacement. `end_at` est nul pour le placement courant. |

Les intervalles semi-ouverts se juxtaposent sans chevauchement : un jour de
changement, exactement une ligne correspond.

## resolveContext

Les entrées sont souvent antidatées (la visite de samedi saisie le lundi), le
contexte est donc résolu pour la date propre de l'entrée, pas pour maintenant :

```ts
resolveContext(hiveId: string, date: string) -> { apiaryId, queenId }
```

Elle exécute deux requêtes sur la base de données locale et se replie sur les
valeurs courantes lorsqu'aucun intervalle ne couvre la date :

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

## Fonctions qui écrivent l'historique

| Fonction | Écrit |
| --- | --- |
| `createHive` | ligne `hive`, un `placement` ouvert, événement `CREATED` |
| `setQueen` | ferme la reine active (`active = 0`, `replaced_at`), insère la nouvelle, événements `QUEEN_REPLACED` et `QUEEN_INTRODUCED` |
| `moveHive` | ferme le `placement` ouvert, en ouvre un nouveau, met à jour `hive.apiary_id`, événement `MOVED` avec `detail = {from, to}` |
| `recordHarvest` | ligne `harvest` avec `apiary_id` / `queen_id` figés, événement `HARVEST` avec `amount_kg` et `ref_id` |
| `recordTreatment` | ligne `treatment` avec contexte figé, événement `TREATMENT` |
| `recordInspection` | ligne `inspection`, événement `INSPECTION` |

`recordHarvest`, `recordTreatment` et `recordInspection` appellent d'abord
`resolveContext`. Toutes les écritures passent par `patch()` dans
`app/src/lib/local/repo.ts`, elles atterrissent donc dans la table locale et
dans l'outbox de synchronisation comme tout autre changement. Les lignes de
détail (`harvest`, `treatment`, `inspection`) sont des lignes synchronisées
normales ; seule `event` est traitée en ajout seul, par convention. Rien dans
l'application ne modifie ni ne supprime un événement.

Les numéros de type d'événement sont listés dans le
[modèle de données](/developers/data-model#event).

## Lire l'historique

```ts
historyForHive(hiveId)     // SELECT * FROM event WHERE deleted = 0 AND hive_id = ?   ORDER BY date DESC
historyForApiary(apiaryId) // ... WHERE apiary_id = ?
historyForQueen(queenId)   // ... WHERE queen_id = ?
```

Statistiques :

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

`type = 7` est `HARVEST`. Comme les dimensions sont figées sur la ligne, aucune
jointure vers l'état courant n'est nécessaire.

## Synchronisation

Les lignes `event` portent `scope_id` (l'id du rucher) comme colonne et se
synchronisent comme toute autre table, avec le « dernier écrivain gagne » par
champ. Comme chaque événement a un UUID neuf et n'est jamais modifié, deux
appareils qui ajoutent des événements hors ligne ne touchent jamais la même
ligne et les deux ensembles sont conservés. Voir le
[protocole de synchronisation](/developers/sync-protocol).

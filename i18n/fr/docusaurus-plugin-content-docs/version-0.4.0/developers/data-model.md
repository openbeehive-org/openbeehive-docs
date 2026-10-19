---
sidebar_position: 3
title: "Modèle de données"
---

# Modèle de données

Les tables ci-dessous sont tirées des migrations du serveur
(`server/internal/storage/sql/migrations/`) et du schéma miroir du client
(`app/src/lib/local/schema.ts`). Les noms de colonnes sont identiques des deux
côtés et sont les clés utilisées dans les charges utiles de synchronisation. Les
colonnes d'énumération stockent le numéro proto ; le libellé affiché est celui
que montre l'application (`app/src/lib/i18n/locales/en.json`).

Chaque table synchronisée porte trois colonnes de gestion qui ne sont pas
répétées ci-dessous : `organization_id` (espace, tenant), `field_hlc` (horloge de
champ en JSON, voir le [protocole de synchronisation](/developers/sync-protocol))
et `deleted` (indicateur de suppression douce). Les ids sont des UUID, générés
sur l'appareil ou par le serveur pour les lignes créées via
l'[API](/using-the-api/overview). Les horodatages sont stockés sous forme de
chaînes ISO 8601 sur le client et en `TIMESTAMP` sur le serveur.

## Hiérarchie

```text
apiary
 └── hive ── queen (one active, older ones kept with replaced_at set)
       ├── inspection
       ├── task        (task.hive_id and task.apiary_id are both optional)
       ├── harvest
       ├── treatment
       ├── placement   (which apiary the hive lived in, and when)
       └── event       (append-only history with frozen apiary/hive/queen)
```

Le partage et le partitionnement de la synchronisation utilisent `scope_id` :
l'id propre d'un rucher pour le rucher et tout ce qu'il contient. Seule la table
`event` stocke `scope_id` comme colonne ; pour les autres tables, il est porté par
le message `Change`.

## apiary

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `name` | text | obligatoire |
| `address` | text | texte libre |
| `lat`, `lng` | real | `0` lorsque non renseigné |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

## hive

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | également encodé dans l'[étiquette QR](/developers/qr-codes) |
| `apiary_id` | text | rucher actuel |
| `name` | text | |
| `type` | int | `HiveType`, voir ci-dessous |
| `status` | int | `HiveStatus`, voir ci-dessous ; les nouvelles ruches démarrent à `1` |
| `boxes` | int | nombre de corps |
| `colony_origin` | text | par ex. "essaim 2024" |
| `note` | text | |
| `qr_code` | text | réservé ; le code imprimé est dérivé de `id` par `shortCode()` dans `app/src/lib/qr.ts` |
| `photo` | text | URL de données ou clé de blob |
| `created_at`, `updated_at` | timestamp | |

`HiveType` : 0 Non précisé, 1 Zander, 2 Dadant, 3 Deutsch Normal, 4 Langstroth,
5 Warré, 6 Top-bar, 99 Autre.

`HiveStatus` : 0 Non précisé, 1 Active, 2 Nucléus, 3 Orpheline, 4 Perdue,
5 Dissoute.

## queen

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `hive_id` | text | |
| `year` | int | l'année de la reine ; détermine la couleur de marquage par défaut |
| `marking` | int | `MarkingColor` : 1 blanc (années finissant par 1/6), 2 jaune (2/7), 3 rouge (3/8), 4 vert (4/9), 5 bleu (5/0) ; déduit de `year` par défaut |
| `origin` | text | |
| `breeder_number` | text | |
| `introduced_at` | timestamp | début du règne |
| `replaced_at` | timestamp | fin du règne, null tant qu'elle règne |
| `active` | bool | true pour la reine actuelle |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

Un changement de reine positionne `active = 0` et `replaced_at` sur l'ancienne
ligne et en insère une nouvelle ; les anciennes reines ne sont jamais supprimées.

## inspection

| Colonne | Type | Notes |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Très douce, 2 Douce, 3 Normale, 4 Nerveuse, 5 Agressive |
| `calmness` | int | 1 Quitte le cadre, 2 Agitée, 3 Calme, 4 Très calme |
| `frames` | int | cadres occupés |
| `brood_frames` | int | |
| `stores` | int | 1 Bonnes, 2 Moyennes, 3 Faibles, 4 Nulles |
| `queen_cells` | int | cellules d'essaimage comptées |
| `youngest_larva` | int | âge en jours de la plus jeune larve observée |
| `covered_larva` | bool | couvain operculé observé |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C, null lorsque non mesuré dans l'application ; `CreateInspection` stocke `0` pour les champs omis |
| `humidity_hive`, `humidity_outside` | real | %, même règle que pour les températures |
| `note` | text | |
| `photo_keys` | text | JSON d'OR-Set, la seule colonne de type ensemble |
| `created_at` | timestamp | |

## task

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `title` | text | |
| `hive_id`, `apiary_id` | text | optionnels |
| `due_at` | timestamp | |
| `done` | bool | |
| `priority` | int | `TaskPriority` : 1 Basse, 2 Normale, 3 Haute ; la colonne serveur vaut 2 par défaut, l'application écrit 0 |
| `note`, `recurrence`, `assigned_to` | text | présents dans le schéma ; le formulaire de tâche ne remplit que `title` et `due_at` |
| `created_at` | timestamp | |

## placement

| Colonne | Type | Notes |
| --- | --- | --- |
| `id`, `hive_id`, `apiary_id` | text | |
| `start_at` | timestamp | |
| `end_at` | timestamp | null pour le placement en cours |

Créer une ruche ouvre un placement ; la déplacer clôture la ligne ouverte à la
date du déplacement et en ouvre une nouvelle.

Une tâche sans `apiary_id` se synchronise sous le scope personnel
`user:<user id>` au lieu d'un id de rucher.

## harvest

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | figés au moment de la récolte |
| `date` | timestamp | |
| `variety` | text | |
| `amount_kg` | real | |
| `water_content` | real | % |
| `batch_number` | text | |
| `best_before` | timestamp | |
| `note` | text | |

## treatment

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | figés au moment du traitement |
| `date` | timestamp | |
| `product`, `active_ingredient` | text | |
| `dose`, `method` | text | |
| `batch_number` | text | |
| `withdrawal_until` | timestamp | |
| `reason` | text | `varroa` par défaut |
| `note` | text | |

## event

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `scope_id` | text | id du rucher |
| `type` | int | `EventType`, voir ci-dessous |
| `date` | timestamp | |
| `apiary_id`, `hive_id`, `queen_id` | text | figés au moment de l'événement |
| `ref_entity`, `ref_id` | text | la ligne de détail, par ex. `harvest` / son id |
| `title` | text | |
| `amount_kg` | real | copié depuis la récolte pour que les requêtes de rendement n'aient pas besoin de jointure |
| `detail` | text | JSON |
| `author_id` | text | |

`EventType` : 1 Créée, 2 Reine introduite, 3 Reine remplacée, 4 Déplacée,
5 Visite, 6 Traitement, 7 Récolte, 8 Statut, 9 Dissoute. L'application écrit
les types 1 à 7 (`app/src/lib/local/history.ts`). Voir
[Historique et événements](/developers/history-and-events).

## Tables réservées au serveur

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`apiary_share`, `change_log` et `seq_counter` n'existent que sur le serveur. `member.role` vaut
`owner` ou `member` ; `users.role` vaut `admin` ou `user`. `apiary_share` est lu
par la vérification de scope de la synchronisation, mais rien dans l'application
ne l'écrit. Le client ajoute `outbox` et `sync_meta` pour le moteur de
synchronisation.

### api_key

Clés de longue durée pour les scripts et les intégrations (migration
`0014_api_keys.sql`, `server/internal/auth/apikey.go`). Non synchronisée.

| Colonne | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | propriétaire ; indexé |
| `organization_id` | varchar(64) | l'espace dans lequel la clé agit, fixé à la création |
| `name` | text | libellé affiché dans les Paramètres |
| `key_prefix` | text | les 12 premiers caractères du texte en clair, pour l'affichage |
| `key_hash` | varchar(64) | SHA-256 hexadécimal du jeton `obhk_...` en clair, unique ; le texte en clair n'est jamais stocké |
| `scope` | text | `write` (par défaut) ou `read` ; une clé `read` ne peut appeler que `Get*`, `List*`, `Pull` et `Subscribe` |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null pour les clés qui n'expirent jamais ; une clé passé cette date est refusée |
| `last_used_at` | timestamp | mis à jour à chaque utilisation vérifiée, null jusque-là |

Une clé est vérifiée en hachant le jeton bearer et en recherchant `key_hash` ;
la ligne est supprimée lorsque la clé est retirée, et une clé dont le
propriétaire n'est plus `member` de `organization_id`, ou dont l'`expires_at`
est dépassé, est refusée sans être supprimée.

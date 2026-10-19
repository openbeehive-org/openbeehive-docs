---
sidebar_position: 1
title: "Présentation de l'API"
---

# L'API Openbeehive

Le serveur expose une API [Connect-RPC](https://connectrpc.com/) définie en
Protocol Buffers sous
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Chaque RPC est accessible en HTTP/JSON simple, en gRPC et en gRPC-Web depuis la
même URL. L'application elle-même n'utilise que `SyncService` ; les autres
services existent pour les scripts, les capteurs et les intégrations.

## URL de base et forme du chemin

L'API est servie par le même processus que l'application, sur la même origine :

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
```

Par exemple `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`
sur le service hébergé, ou votre propre origine en auto-hébergement.

## Services servis

Dix services sont enregistrés sur le serveur (`server/cmd/server/main.go`) :

| Service | RPC |
| --- | --- |
| `ApiaryService` | `CreateApiary`, `GetApiary`, `ListApiaries`, `UpdateApiary`, `DeleteApiary` |
| `HiveService` | `CreateHive`, `GetHive`, `ListHives`, `UpdateHive`, `DeleteHive`, `RelocateHive` |
| `QueenService` | `CreateQueen`, `ListQueens`, `UpdateQueen`, `DeleteQueen` |
| `InspectionService` | `CreateInspection`, `ListInspections`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Push`, `Subscribe` (flux serveur) |

Chaque RPC est limité à l'espace (tenant) actif de l'appelant. Les ids d'un
autre espace se comportent comme des ids inconnus (`not_found`).

### Les écritures passent par la synchronisation \{#writes-go-through-sync}

Chaque RPC d'écriture (`Create*`, `Update*`, `Delete*`, `RelocateHive`,
`SetTaskDone`, `AddInspectionPhoto`, `RemoveInspectionPhoto`) est appliqué
avec la même fusion champ par champ et ajouté au même journal des changements
que `SyncService.Push`. Une ligne écrite via l'API atteint chaque appareil à sa
prochaine synchronisation, et une modification ultérieure depuis un appareil
fusionne avec elle champ par champ, exactement comme les modifications de deux
appareils fusionnent entre elles. Les suppressions sont douces : la ligne reçoit
un tombstone (`deleted = 1`) et disparaît des listes et de l'application.

Les écritures côté serveur reproduisent les flux propres à l'application
(`server/internal/service/writer.go` est un portage de
`app/src/lib/local/history.ts`), de sorte que l'historique affiché par un
appareil est le même qu'un enregistrement ait été saisi dans l'application ou
via l'API :

- `CreateHive` écrit la ruche, ouvre un intervalle de placement et enregistre
  un événement `CREATED`. Les nouvelles ruches démarrent en
  `HIVE_STATUS_ACTIVE`.
- `RelocateHive` clôture le placement ouvert, en ouvre un nouveau sur le
  rucher cible et enregistre un événement `MOVED`. `UpdateHive` ne déplace
  jamais une ruche.
- `CreateQueen` met fin au règne de la reine active de la ruche
  (`active = false`, `replacedAt` positionné sur l'`introducedAt` de la
  nouvelle reine), enregistre les événements `QUEEN_REPLACED` et
  `QUEEN_INTRODUCED`, et déduit la couleur de marquage de `year` lorsque vous
  n'en envoyez aucune.
- `CreateInspection` et `CreateTreatment` figent le rucher et la reine
  régnante à la `date` de l'enregistrement (un enregistrement antidaté est
  résolu à partir de l'historique des placements et des reines) et
  enregistrent un événement `INSPECTION` ou `TREATMENT`.
- `CreateHarvest` fige de la même façon le rucher et la reine régnante à la
  `date`, écrit la ligne de récolte et enregistre un événement `HARVEST` qui
  porte `amountKg` et le titre `<kg> kg <variety>` (`Honey` lorsque `variety`
  est vide). `GetDashboard` et `GetHoneyStats` additionnent ces événements, de
  sorte qu'une récolte envoyée via l'API compte immédiatement dans les
  chiffres de miel. `amountKg` doit être supérieur à `0`.
- Une tâche avec un `hiveId` ou un `apiaryId` se synchronise sous ce rucher et
  est partagée avec toutes les personnes qui le voient ; une tâche sans l'un ni
  l'autre vit dans le scope personnel de l'appelant et n'atteint que les
  appareils de cet utilisateur.

Les lectures (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`)
interrogent directement les tables du serveur. Elles montrent immédiatement les
écritures faites via l'API, et les écritures des appareils dès que l'appareil
les a poussées.

### Pas encore dans l'API

- **Pas de RPC de modification de récolte.** `HarvestService` n'a que
  `CreateHarvest`, `ListHarvests` et `DeleteHarvest`. Pour corriger une
  récolte, supprimez-la et recréez-la, ou modifiez-la dans l'application.
- **Pas de RPC de placement.** Les placements sont écrits par `CreateHive` et
  `RelocateHive` et n'apparaissent que dans le flux de synchronisation.
- `EventService` est en lecture seule. Les événements sont écrits par les flux
  ci-dessus et par l'application.

Voir le [protocole de synchronisation](/developers/sync-protocol) pour le
format des changements et le [modèle de données](/developers/data-model) pour
les colonnes derrière chaque message.

## Endpoints hors RPC

Quelques endpoints HTTP simples se trouvent à côté des services RPC :

| Chemin | Rôle |
| --- | --- |
| `GET /healthz` | Renvoie `ok` |
| `GET /files/<key>` | Fichiers stockés, uniquement avec le backend de blobs sur système de fichiers (`BEEHIVE_BLOB_BACKEND=fs`) |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Comptes e-mail/mot de passe (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` défini) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkeys (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `/auth/logout`, `/auth/me`, `/auth/instance`, `/auth/switch`, `/auth/accept-invite` | Utilitaires de session et d'espace (tenant), présents dès qu'une méthode de connexion est activée |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | Gestion des clés API (lister, créer, supprimer), présente dès qu'une méthode de connexion est activée ; session uniquement, une clé ne peut pas les appeler |
| `/tenants/create`, `/tenants/invite`, `/tenants/invites`, `/tenants/invite/revoke`, `/tenants/delete` | Administration des espaces, présente dès qu'une méthode de connexion est activée |
| `POST /auth/demo-login` | Uniquement avec `BEEHIVE_DEMO=true` |

Ils sont utilisés par les écrans de connexion et de paramètres de
l'application. Ils ne font pas partie du contrat proto.

## Authentification \{#authentication}

La façon dont une requête est authentifiée dépend de la présence d'une méthode
de connexion sur l'instance :

- **Aucune connexion configurée** (auto-hébergé, `BEEHIVE_PASSWORD_AUTH=false`,
  `BEEHIVE_OIDC_PROVIDERS` vide, `BEEHIVE_WEBAUTHN_ENABLED=false`) : chaque
  requête s'exécute en tant qu'utilisateur local fixe. N'envoyez aucun
  identifiant. Il n'y a pas de clés API sur une telle instance ; aucune n'est
  nécessaire.
- **Connexion configurée** : chaque RPC a besoin d'une clé API ou d'un jeton de
  session dans `Authorization: Bearer <token>` (le cookie `obh_session` est
  accepté pour les jetons de session). Une requête sans jeton valide reçoit le
  code Connect `unauthenticated` (HTTP 401).

### Clés API

Une clé API est l'identifiant recommandé pour les scripts, les capteurs et les
intégrations. Les clés se gèrent dans l'application sous
**Paramètres → Clés API** (voir
[Comptes et espaces](../using-the-app/accounts-tenants.md#api-keys)) :

1. Connectez-vous, basculez vers l'espace dans lequel le script doit écrire et
   ouvrez **Paramètres → Clés API**.
2. Saisissez un nom (par exemple `hive scale`), choisissez les permissions
   (**Lecture et écriture** ou **Lecture seule**) et une expiration
   (**N'expire jamais**, **30 jours**, **90 jours** ou **1 an**), puis touchez
   **Créer une clé**. La clé commence par `obhk_` et n'est affichée qu'une
   seule fois ; copiez-la maintenant. Le serveur ne stocke que son hachage
   SHA-256 et les 12 premiers caractères pour l'affichage.
3. Envoyez-la à chaque RPC :

```text
Authorization: Bearer obhk_...
```

Ce qu'une clé peut et ne peut pas faire :

- Elle agit en tant que son propriétaire, avec le rôle de celui-ci, dans
  l'espace qui était actif lors de sa création. Elle ne peut pas changer
  d'espace ; créez une clé par espace si un script en a besoin de plusieurs.
- Elle ne fonctionne que sur les RPC. Les endpoints `/auth/*` et `/tenants/*`,
  y compris la gestion des clés elle-même, exigent une vraie session : une clé
  ne peut ni lister, ni créer, ni supprimer de clés.
- Elle a l'une de deux portées, fixée à la création. Une clé `write` (la
  valeur par défaut) peut appeler tous les RPC que son propriétaire peut
  appeler. Une clé `read` ne peut appeler que les RPC dont le nom commence
  par `Get`, `List`, `Pull` ou `Subscribe` ; tout autre RPC renvoie le code
  Connect `permission_denied` (HTTP 403) avec le message
  `this API key is read-only`.
- Elle n'expire que si vous définissez une expiration : `expires_in_days` de
  `0` (jamais, la valeur par défaut) à `3650`. Passé `expires_at`, chaque RPC
  renvoie `unauthenticated` (HTTP 401) avec le message `API key expired`. Les
  clés expirées restent dans la liste jusqu'à ce que vous les supprimiez.
- Elle cesse de fonctionner dès qu'elle est supprimée dans les Paramètres, et
  elle disparaît avec l'appartenance : lorsque son propriétaire quitte
  l'espace ou en est retiré, la clé est refusée.
- Chaque utilisation met à jour `last_used_at`, affiché comme
  **Dernière utilisation** dans les Paramètres.
- Le compte de démonstration ne peut pas créer de clés.

Les mêmes endpoints que ceux de l'application sont ouverts à un script
authentifié par session :

- `GET /auth/api-keys` renvoie `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, vos propres clés dans
  l'espace actif uniquement. `scope` vaut `"write"` ou `"read"` ;
  `expires_at` et `last_used_at` sont des horodatages RFC 3339 ou `null` ;
  `mine` vaut toujours `true` ici.
- `GET /auth/api-keys?tenant=1` renvoie toutes les clés de l'espace actif,
  chaque ligne portant en plus `user_id`, `user_email` et un indicateur
  `mine` qui vaut `true` sur vos propres clés. Seuls le propriétaire de
  l'espace (le rôle que l'application appelle **Admin**) et l'administrateur
  de l'instance peuvent l'appeler ; tout le monde d'autre reçoit HTTP 403.
- `POST /auth/api-keys` avec `{"name": "...", "scope": "write",
  "expires_in_days": 0}` renvoie `{id, name, prefix, scope, created_at,
  expires_at, token}`. `scope` vaut `"write"` et `expires_in_days` vaut `0`
  (jamais) par défaut lorsqu'ils sont omis. Toute autre portée, ou une durée
  de vie inférieure à `0` ou supérieure à `3650`, répond HTTP 400.
- `POST /auth/api-keys/delete` avec `{"id": "..."}` répond `204`. Un
  membre ne peut supprimer que ses propres clés ; l'id d'une clé de
  quelqu'un d'autre répond 404. Le propriétaire de l'espace et
  l'administrateur de l'instance peuvent supprimer n'importe quelle clé de
  l'espace actif. Cette dérogation ne franchit jamais les espaces : le
  propriétaire d'un autre espace reçoit 404 pour les clés qui ne sont pas
  les siennes.

### Connexion par session

L'alternative est le jeton de session de l'application, une valeur signée en
HMAC que le serveur émet à la connexion. Il est accepté sur les RPC et sur les
endpoints `/auth/*` et `/tenants/*`. Avec l'authentification par mot de passe
activée, un script en obtient un avec :

```bash
curl -s -X POST https://bees.example.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
```

La réponse JSON contient `token` ; la même valeur est aussi définie dans le
cookie `obh_session`. Le jeton expire après `BEEHIVE_SESSION_TTL`.

Le jeton porte l'espace actif du compte. `GET /auth/me` liste les espaces
auxquels vous appartenez (`tenants`) et l'espace actif (`active_org`) ;
`POST /auth/switch` avec `{"org_id": "..."}` renvoie un nouveau `token` pour
un autre espace.

Avec `BEEHIVE_DEMO=true`, les sessions de démonstration sont en lecture seule :
le compte de démonstration ne peut appeler que les RPC dont le nom commence par
`Get`, `List`, `Pull` ou `Subscribe`. Tout autre RPC renvoie
`permission_denied`.

Voir [Authentification](/self-hosting/authentication) pour configurer les
méthodes de connexion.

## Pages par protocole

- [REST / HTTP + JSON](/using-the-api/rest) : exemples curl, forme du JSON et
  contrat de pagination.
- [gRPC](/using-the-api/grpc) : clients générés et l'appel `Subscribe` en
  streaming.
- [Trackers automatisés](/using-the-api/automated-trackers) : envoyer les
  relevés d'une balance de ruche ou d'un capteur climatique depuis un script
  ou un appareil.

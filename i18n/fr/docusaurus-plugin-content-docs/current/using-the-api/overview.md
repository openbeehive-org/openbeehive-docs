---
sidebar_position: 1
title: "Présentation de l'API"
---

# L'API Openbeehive

Le serveur expose une API [Connect-RPC](https://connectrpc.com/) définie en
Protocol Buffers sous
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Chaque RPC est accessible en HTTP/JSON simple, en gRPC et en gRPC-Web depuis la
même URL. L'application elle-même n'utilise que `SyncService` et les endpoints
HTTP simples pour les photos, l'export et les comptes ; les autres services
existent pour les scripts, les capteurs et les intégrations.

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
| `InspectionService` | `CreateInspection`, `ListInspections`, `UpdateInspection`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `UpdateTask`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `UpdateTreatment`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `UpdateHarvest`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Snapshot`, `Push`, `Subscribe` (flux serveur) ; les scripts envoient l'en-tête `Openbeehive-Sync-Protocol: 1`, voir [Protocole de synchronisation](../developers/sync-protocol.md#versions) |

Chaque RPC est limité à l'espace actif de l'appelant (appelé `tenant` ou
`organization` dans les chemins et les noms de champs). Les ids d'un autre
espace se comportent comme des ids inconnus (`not_found`).

Un message RPC peut peser au plus 16 MiB, et une requête autre que le flux
`Subscribe` peut durer au plus 2 minutes.

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
  l'autre vit dans le scope personnel de l'appelant : elle n'atteint que les
  appareils de cet utilisateur et `ListTasks` ne la renvoie qu'à son
  propriétaire.
- `CreateInspection` avec `source: INSPECTION_SOURCE_SENSOR` stocke un relevé
  de capteur au lieu d'une visite ; voir
  [Trackers automatisés](./automated-trackers.md).

Les corrections et les suppressions gardent l'historique cohérent :

- `UpdateInspection`, `UpdateTreatment` et `UpdateHarvest` corrigent un
  enregistrement sauvegardé. Leur événement de chronologie suit la
  modification, et lorsque `date` change, le rucher et la reine sont résolus
  de nouveau pour la nouvelle date. Les traitements et les récoltes reçoivent
  `amendedAt`, réglé sur l'heure de la modification.
- `DeleteInspection`, `DeleteTreatment`, `DeleteHarvest` et `DeleteQueen`
  retirent aussi les événements de chronologie de l'enregistrement, de sorte
  qu'une récolte supprimée ne compte plus dans les chiffres de miel.
- `DeleteHive` supprime aussi les tâches ouvertes de la ruche. `DeleteApiary`
  échoue avec `failed_precondition` tant que le rucher contient des ruches :
  déplacez-les avec `RelocateHive` ou supprimez-les d'abord.

### Les mises à jour ne changent que ce que vous envoyez \{#partial-updates}

Chaque RPC `Update*` est une mise à jour partielle avec les deux mêmes modes :

- **Sans `updateMask` :** chaque champ que vous laissez à sa valeur zéro (`""`,
  `0`, `false`, non défini) conserve sa valeur stockée. N'envoyez que ce qui
  change.
- **Avec `updateMask` :** exactement les champs listés sont écrits, y compris
  à leur valeur zéro. C'est ainsi que vous videz une note, retirez une échéance
  ou rouvrez une tâche. En JSON, le masque est une chaîne de noms de champs
  séparés par des virgules : `"updateMask": "note,dueAt"`.

Une requête qui ne changerait rien est rejetée avec `invalid_argument`. Les
champs qui identifient l'enregistrement (`id`, `hiveId`, l'espace) ne peuvent
pas être modifiés ; une ruche ne change de rucher que par `RelocateHive`.

Les lectures (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`)
interrogent directement les tables du serveur. Elles montrent immédiatement les
écritures faites via l'API, et les écritures des appareils dès que l'appareil
les a poussées.

### Photos \{#photos}

`Inspection.photos` liste les photos d'une visite et `Hive.picture` l'image de
la ruche, chacune sous forme de `Photo` avec `id`, `thumbnail` (une data URL
d'environ 200 px), `contentType`, `sizeBytes`, `createdAt` et `path`. L'image en
taille réelle s'obtient par un simple `GET` de `path` (`/photos/<id>`) sur le
même hôte, avec les mêmes identifiants que les RPC ; `path` est vide tant que
l'appareil qui a pris la photo n'a pas encore envoyé l'image.
`AddInspectionPhoto` ajoute une image JPEG, PNG ou WebP de 5 MiB au plus,
`RemoveInspectionPhoto` supprime une photo définitivement, sur tous les
appareils. `photoKeys` ne contient que les photos intégrées des applications
0.4.x. Voir [REST](./rest.md#photos).

### Pas encore dans l'API

- **Pas de RPC de placement.** Les placements sont écrits par `CreateHive` et
  `RelocateHive` et n'apparaissent que dans le flux de synchronisation.
- `EventService` est en lecture seule. Les événements sont écrits par les flux
  ci-dessus et par l'application.

Voir le [protocole de synchronisation](../developers/sync-protocol.md) pour le
format des changements et le [modèle de données](../developers/data-model.md) pour
les colonnes derrière chaque message.

## Endpoints hors RPC

Quelques endpoints HTTP simples se trouvent à côté des services RPC :

| Chemin | Rôle |
| --- | --- |
| `GET /healthz` | Renvoie `ok` dès que le serveur écoute (le premier démarrage de la 0.5.0 convertit auparavant les photos intégrées) |
| `GET /photos/<id>`, `POST /photos/<id>` | Images des photos en taille réelle : lire, ou envoyer l'image d'un enregistrement de photo déjà synchronisé ; session ou clé API, membres de l'espace uniquement. Voir [REST](./rest.md#photos) |
| `GET /export`, `GET /export?photos=1` | L'espace actif en JSON, ou en ZIP avec les photos ; session ou clé API en écriture. Voir [REST](./rest.md#export) |
| `GET /auth/instance` | Ce que l'instance propose (méthodes de connexion, démo, inscription, réglages de carte) ; toujours présent, aucun identifiant requis |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Comptes e-mail/mot de passe (`BEEHIVE_PASSWORD_AUTH=true`) |
| `POST /auth/password/change`, `POST /auth/password/reset-request`, `POST /auth/password/reset`, `POST /auth/admin/reset-link` | Changer un mot de passe ; demander puis effectuer une réinitialisation ; un lien de réinitialisation créé par l'administrateur de l'instance (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` défini) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkeys (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, `POST /auth/switch`, `POST /auth/accept-invite`, `POST /auth/session/recover` | Utilitaires de session et d'espace, présents dès qu'une méthode de connexion est activée ; sans connexion, `GET /auth/me` répond `{"no_login": true}` |
| `GET /auth/invite?token=...` | Le nom de l'espace, l'adresse e-mail masquée (`j…@e….org`) et l'expiration d'une invitation, sans identifiants ; les invitations inconnues, utilisées ou révoquées répondent `400` `invite_invalid`, les invitations expirées `invite_expired` |
| `GET /auth/account`, `POST /auth/account/delete` | Ce qu'entraînerait la suppression du compte, et sa suppression |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | Gestion des clés API (lister, créer, supprimer), présente dès qu'une méthode de connexion est activée ; session uniquement, une clé ne peut pas les appeler |
| `POST /tenants/create`, `POST /tenants/invite`, `GET /tenants/invites`, `POST /tenants/invite/revoke`, `POST /tenants/delete` | Administration des espaces, présente dès qu'une méthode de connexion est activée |
| `GET /tenants/members`, `POST /tenants/members/remove`, `POST /tenants/members/role`, `POST /tenants/leave` | Membres d'un espace : lister, retirer, changer de rôle, quitter |
| `POST /auth/demo-login` | Uniquement avec `BEEHIVE_DEMO=true` |

Ils sont utilisés par les écrans de connexion et de paramètres de
l'application. Ils ne font pas partie du contrat proto. Les endpoints `/auth/*` et
`/tenants/*` suivent les mêmes règles :

- Chaque endpoint n'accepte que la méthode indiquée ; toute autre répond `405`
  avec un en-tête `Allow`.
- Les endpoints `POST` qui prennent un corps exigent
  `Content-Type: application/json` (`415` sinon), et le corps peut peser au
  plus 64 KiB.
- Les requêtes `POST` venant d'une page de navigateur d'un autre site sont
  refusées avec `403` (`cross_site_request`). Les scripts, qui n'envoient pas
  d'en-tête `Origin`, ne sont pas concernés.
- `/tenants/delete` et `/tenants/leave` exigent `{"org_id": "..."}` ; il n'y a
  pas de valeur par défaut.
- `POST /tenants/invite` répond `409` `already_member` pour une personne qui
  fait déjà partie de l'espace. Inviter une adresse qui a une invitation
  ouverte remplace cette invitation (l'ancien lien cesse de fonctionner) et la
  réponse contient `"renewed": true`.
- Les pages qu'un navigateur ouvre directement (`/auth/verify`, `/auth/login`,
  `/auth/callback`) répondent à une erreur par une redirection vers
  `/login?error=<code>` au lieu de JSON.
- Les erreurs sont en JSON, `{"error": "<plain English>", "code": "<snake_case>"}`.
  Les codes sont listés sur la [page REST](./rest.md#http-error-codes).

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
**Paramètres → Espace → Clés API** (voir
[Comptes et espaces](../using-the-app/accounts-tenants.md#api-keys)) :

1. Connectez-vous, basculez vers l'espace dans lequel le script doit écrire et
   ouvrez **Paramètres → Espace → Clés API**.
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
- Elle fonctionne sur les RPC, `/photos/` et `/export`. Les endpoints `/auth/*`
  et `/tenants/*`, y compris la gestion des clés elle-même, exigent une vraie
  session : une clé ne peut ni lister, ni créer, ni supprimer de clés.
- Elle a l'une de deux portées, fixée à la création. Une clé `write` (la
  valeur par défaut) peut appeler tous les RPC que son propriétaire peut
  appeler. Une clé `read` ne peut appeler que les RPC dont le nom commence
  par `Get` ou `List`, ainsi que `Pull`, `Snapshot` et `Subscribe`. Tout autre
  RPC renvoie le code Connect `permission_denied` (HTTP 403) avec le message
  `this API key is read-only`. Une clé `read` peut récupérer des photos mais
  pas en envoyer, et elle ne peut pas utiliser `/export`.
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
Les connexions échouées sont limitées : après 10 échecs pour un même compte ou
30 depuis une même adresse en 15 minutes, l'endpoint répond `429`
(`rate_limited`) avec un en-tête `Retry-After`.

Le jeton porte l'espace actif du compte. `GET /auth/me` liste les espaces
auxquels vous appartenez (`tenants`) et l'espace actif (`active_org`) ;
`POST /auth/switch` avec `{"org_id": "..."}` renvoie un nouveau `token` pour
un autre espace.

`POST /auth/logout-all` met fin à toutes les autres sessions du compte et
renvoie un nouveau `token` à l'appelant. Le serveur vérifie aussi à chaque
requête que le compte est toujours membre de l'espace ; une session révoquée ou
une appartenance perdue est refusée en 10 secondes environ.

Avec `BEEHIVE_DEMO=true`, les sessions de démonstration sont en lecture seule :
le compte de démonstration ne peut appeler que les RPC dont le nom commence par
`Get` ou `List`, ainsi que `Pull`, `Snapshot` et `Subscribe`. Tout autre RPC
renvoie `permission_denied`.

Voir [Authentification](../self-hosting/authentication.md) pour configurer les
méthodes de connexion.

## Pages par protocole

- [REST / HTTP + JSON](./rest.md) : exemples curl, forme du JSON et
  contrat de pagination.
- [gRPC](./grpc.md) : clients générés et l'appel `Subscribe` en
  streaming.
- [Trackers automatisés](./automated-trackers.md) : envoyer les
  relevés d'une balance de ruche ou d'un capteur climatique depuis un script
  ou un appareil.

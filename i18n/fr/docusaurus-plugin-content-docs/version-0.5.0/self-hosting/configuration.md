---
sidebar_position: 4
title: "Configuration"
---

# Configuration

Openbeehive se configure entièrement au moyen de variables d'environnement. Cette page constitue la référence complète.

Vous pouvez définir ces variables dans votre shell, dans votre fichier `docker compose`, via le gestionnaire de secrets de votre plateforme d'hébergement, ou dans un fichier `.env`. Le serveur lit `.env` dans son répertoire de travail au démarrage ; les variables déjà définies dans l'environnement l'emportent sur le fichier. Tout est lu une seule fois, de sorte que les modifications prennent effet après un redémarrage.

:::tip[Commencez petit]
Vous n'avez besoin que d'une poignée de ces variables pour démarrer. Un serveur domestique mono-utilisateur fonctionne avec les seules valeurs par défaut. Dès que vous activez une méthode de connexion, ajoutez `BEEHIVE_SESSION_SECRET` et, pour la connexion par e-mail/mot de passe, le compte administrateur. Consultez le [Démarrage rapide](./quick-start.md) pour être opérationnel en quelques minutes.
:::

## Comment fonctionne le profil de déploiement

Le réglage le plus important est `BEEHIVE_DEPLOYMENT_PROFILE`. Il choisit des valeurs par défaut judicieuses pour tout le reste, ce qui vous évite de devoir détailler à la main une pile complète.

| Profil     | Base de données par défaut | Stockage d'objets par défaut | Destiné à                              |
| ---------- | ---------------- | -------------------- | ------------------------------------- |
| `selfhost` | SQLite (fichier) | Système de fichiers local | Un binaire unique, sans Docker, un seul hôte |
| `cloud`    | PostgreSQL       | MinIO / S3           | Une instance avec plusieurs utilisateurs |

Le profil ne fait que définir des *valeurs par défaut*. Toute variable que vous définissez explicitement l'emporte toujours. Par exemple, vous pouvez exécuter le profil `selfhost` tout en le pointant vers PostgreSQL en définissant vous-même `BEEHIVE_DATABASE_DRIVER` et `BEEHIVE_DATABASE_DSN`.

:::note
Les deux profils sont documentés en détail sur leurs propres pages : [Binaire unique](./single-binary.md) et [Docker](./docker.md). Cette page se concentre sur les variables elles-mêmes.
:::

## Profil de déploiement

| Variable             | Défaut     | Description                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------------- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `selfhost` | Sélectionne la pile préconfigurée : `selfhost` ou `cloud`. Définit les valeurs par défaut pour la base de données et le stockage d'objets. |

## Serveur HTTP

| Variable          | Défaut                   | Description                                                                 |
| ----------------- | ------------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_ADDR`            | `:8080`                  | Adresse et port sur lesquels le serveur écoute. Utilisez `127.0.0.1:8080` pour ne lier qu'à localhost derrière un reverse proxy. |
| `BEEHIVE_PUBLIC_BASE_URL` | `http://localhost:8080`  | L'URL publique où les utilisateurs accèdent à l'application. Utilisée pour les redirections OIDC, les liens d'invitation et de vérification, et les valeurs par défaut des passkeys. Définissez-la sur votre véritable domaine en production. |
| `BEEHIVE_HTTP_READ_HEADER_TIMEOUT` | `10s` | Temps accordé pour lire les en-têtes d'une requête. |
| `BEEHIVE_HTTP_READ_TIMEOUT` | `2m` | Temps accordé pour lire une requête ; `0` signifie aucune limite. Le flux de synchronisation en direct en est exempté. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `2m` | Temps accordé pour écrire une réponse ; `0` signifie aucune limite. Le flux de synchronisation en direct en est exempté. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Durée pendant laquelle une connexion keep-alive inactive reste ouverte. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Délai de grâce pour les requêtes en cours à l'arrêt. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `false` | Prend l'adresse du client, pour la limitation des tentatives de connexion, dans la dernière entrée de `X-Forwarded-For`. Ne réglez sur `true` que lorsqu'exactement un reverse proxy que vous contrôlez se trouve en amont et que le port du serveur n'est accessible d'aucune autre manière. |
| `BEEHIVE_ALLOWED_HOSTS` | (vide) | Uniquement sans connexion : noms d'hôte supplémentaires auxquels le serveur répond, séparés par des virgules. `*` désactive la vérification. Voir ci-dessous. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` doit correspondre à l'adresse que les utilisateurs visitent réellement. Si elle est incorrecte, les redirections de connexion et les liens d'invitation pointent vers le mauvais endroit.
:::

Un message RPC peut peser au plus 16 MiB ; l'application découpe d'elle-même les envois plus volumineux. Cette limite n'est pas configurable.

### Noms d'hôte sans connexion \{#allowed-hosts}

Un serveur sans méthode de connexion traite chaque requête comme provenant de l'unique utilisateur local. Pour empêcher une page web que vous ne faites que visiter de l'atteindre sous un nom qui lui est propre, un tel serveur ne répond que lorsque le `Host` de la requête est `localhost`, une adresse IP, l'hôte de `BEEHIVE_PUBLIC_BASE_URL` ou un nom listé dans `BEEHIVE_ALLOWED_HOSTS`. Les autres noms reçoivent une réponse `403` qui nomme le paramètre. Avec une méthode de connexion activée, la vérification est désactivée.

## Application web intégrée

Le serveur peut servir lui-même la PWA SvelteKit, de sorte qu'un binaire unique fournit à la fois l'API et le front end.

| Variable     | Défaut  | Description                                                                                  |
| ------------ | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SERVE_WEB`  | `true`  | Lorsque `true`, le serveur sert l'application web intégrée. Définissez `false` si vous hébergez le front end séparément. |
| `BEEHIVE_WEB_DIR`    | (vide)  | Chemin vers les ressources web compilées. Laissez vide pour utiliser les ressources intégrées au binaire. |

## CORS

Les réglages cross-origin importent lorsque l'application web est servie depuis une origine différente de celle de l'API.

| Variable                 | Défaut  | Description                                                                 |
| ------------------------ | ------- | --------------------------------------------------------------------------- |
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | (vide)  | Liste, séparée par des virgules, des autres origines autorisées à appeler l'API depuis un navigateur, par ex. `https://app.example.com`. Vide signifie même origine uniquement. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Indique si les origines listées peuvent envoyer des identifiants (cookies, en-têtes d'authentification). |

:::caution
Laissez ce réglage vide lorsque le serveur sert lui-même l'application web (le cas par défaut). `*` autorise n'importe quelle origine, mais jamais avec des identifiants : le serveur désactive alors les identifiants, si bien qu'une application de navigateur connectée et servie depuis une autre origine cesse de fonctionner. Listez plutôt les origines explicitement. Avec `make dev-app`, définissez `http://localhost:5173`.
:::

## Cartes \{#maps}

Les tuiles de carte et la recherche d'adresse sont les seuls services distants que l'application contacte. Les deux sont configurables et peuvent être désactivés pour toute l'instance.

| Variable | Défaut | Description |
| --- | --- | --- |
| `BEEHIVE_MAPS` | `on` | `off` retire la carte et la recherche d'adresse de l'application. |
| `BEEHIVE_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Modèle d'URL des tuiles (syntaxe Leaflet). `{s}` ne peut apparaître que dans le premier label du nom d'hôte. |
| `BEEHIVE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | URL de base d'une recherche d'adresse compatible Nominatim. |

Avec les valeurs par défaut, un navigateur qui ouvre une carte demande les tuiles à OpenStreetMap, et saisir une adresse ou déplacer le repère d'un rucher envoie cette adresse ou cette position à Nominatim. Les deux voient l'adresse IP de l'appareil. Le serveur ajoute les deux origines à sa Content-Security-Policy, de sorte que l'application peut les atteindre, et rien d'autre.

## Synchronisation

| Variable  | Défaut   | Description                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | aléatoire à chaque démarrage | Identifiant d'horloge apposé sur les modifications que le serveur écrit lui-même (appels d'API). Il n'y a normalement aucune raison de le définir. |
| `BEEHIVE_CHANGELOG_RETENTION_DAYS` | `180` | Nombre de jours de conservation du journal des modifications. Une fois par jour, les entrées plus anciennes sont supprimées ; un appareil absent plus longtemps charge les données actuelles au lieu des modifications qu'il a manquées. `0` conserve le journal indéfiniment. |
| `BEEHIVE_SYNC_MIN_PROTOCOL` | `0` | Version la plus basse du protocole de synchronisation que le serveur accepte des applications. `0` accepte aussi les applications 0.4.x installées ; `1` les refuse, et elles ne peuvent plus se synchroniser tant qu'elles n'ont pas été mises à jour. |

Exécutez exactement une instance du serveur par base de données. L'exécution de plusieurs réplicas sur une même base de données n'est pas prise en charge : le compactage quotidien du journal des modifications et l'entretien des photos s'exécutent dans le processus du serveur.

Les entrées qui existent au moment de la mise à niveau vers la 0.5.0 sont considérées comme reçues le jour de la mise à niveau ; avec la conservation par défaut, les premières entrées sont donc supprimées au plus tôt 180 jours après celle-ci. Une application 0.4.x dont la dernière synchronisation est plus ancienne que ce que le journal conserve encore ne peut plus se synchroniser tant qu'elle n'a pas été mise à jour.

## Base de données

| Variable          | Défaut             | Description                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | selon le profil    | Moteur de base de données : `postgres`, `mysql` (MariaDB) ou `sqlite`.      |
| `BEEHIVE_DATABASE_DSN`    | selon le profil    | Chaîne de connexion pour le pilote choisi (voir ci-dessous).               |

Exemples de DSN par pilote :

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MariaDB (driver name: mysql)
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Pour le choix du pilote, l'optimisation et les notes de migration, consultez [Bases de données](./databases.md).

## Stockage d'objets

Les images en taille réelle des photos sont stockées sous forme de blobs, soit sur le système de fichiers local, soit dans un magasin d'objets compatible S3. Une sauvegarde, c'est la base de données plus ce répertoire ou ce bucket.

| Variable          | Défaut         | Description                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | selon le profil | Backend de stockage : `fs` (système de fichiers local) ou `minio` (MinIO / S3). |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Répertoire des blobs lorsque `BEEHIVE_BLOB_BACKEND=fs`. Ne doit pas contenir le fichier de la base SQLite, sinon le serveur ne démarre pas. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Hôte et port du point de terminaison MinIO / S3.                       |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Clé d'accès du magasin d'objets.                                       |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Clé secrète du magasin d'objets.                                       |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Nom du bucket où sont stockés les blobs.                               |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Définissez `true` pour vous connecter au point de terminaison via HTTPS. |

Les variables `MINIO_*` ne sont utilisées que lorsque `BEEHIVE_BLOB_BACKEND=minio`. `BEEHIVE_BLOB_PUBLIC_URL` n'est plus utilisée : les images ne sont servies qu'aux membres connectés, sous `/photos/`, et le serveur émet un avertissement au démarrage si le paramètre est présent. Pour un accompagnement complet, consultez [Stockage](./storage.md).

## Session et authentification

| Variable         | Défaut  | Description                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (vide)  | Secret qui signe les jetons de session, d'au moins 32 octets. Générez-en un avec `openssl rand -base64 32`. **Requis dès qu'une méthode de connexion est activée** : le serveur refuse de démarrer sans lui. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | Durée d'une session avant qu'une nouvelle authentification soit requise (par ex. `720h` correspond à 30 jours). |

:::danger
Gardez `BEEHIVE_SESSION_SECRET` privé et stable. Quiconque le connaît peut falsifier des sessions ; le modifier déconnecte tout le monde.
:::

## E-mail, mot de passe et intégration

Comptes intégrés pour les instances multi-utilisateurs sans fournisseur d'identité externe.
L'administrateur de l'instance est un compte dédié que vous configurez, et non la première
personne à s'inscrire. Consultez [Authentification](./authentication.md).

| Variable | Défaut | Description |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | activé pour `cloud`, désactivé pour `selfhost` | Active l'inscription et la connexion par e-mail/mot de passe. Également impliqué par `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (vide) | E-mail de l'administrateur de l'instance. **Requis dès que l'authentification par mot de passe est activée.** Le compte est garanti à chaque démarrage : créé s'il manque, et son rôle forcé à administrateur. L'inscription n'accorde jamais le rôle d'administrateur. |
| `BEEHIVE_ADMIN_PASSWORD` | (vide) | Mot de passe de l'administrateur de l'instance, 8 caractères au minimum. Fait foi à chaque démarrage : le mot de passe stocké est réinitialisé à cette valeur, ce qui sert aussi de récupération de mot de passe. |
| `BEEHIVE_REGISTRATION` | `true` | Inscription libre. Réglez sur `false` pour une instance sur invitation uniquement : en dehors de l'administrateur configuré, les comptes ne peuvent être créés que via des liens d'invitation, et l'écran de connexion affiche un avis indiquant que l'instance est sur invitation uniquement. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Exige une confirmation par e-mail avant qu'un nouveau compte puisse se connecter. Nécessite `BEEHIVE_SMTP_HOST` ; le serveur refuse de démarrer si la vérification est activée sans serveur de messagerie. |
| `BEEHIVE_SMTP_HOST` | (vide) | Serveur SMTP pour les e-mails de vérification, d'invitation et de réinitialisation de mot de passe. Si vide, aucun e-mail n'est envoyé : l'administrateur copie les liens d'invitation depuis les Paramètres, et seul l'administrateur de l'instance peut y créer des liens de réinitialisation de mot de passe. Les liens ne sont jamais écrits dans le journal. |
| `BEEHIVE_SMTP_PORT` | `587` | Port SMTP. |
| `BEEHIVE_SMTP_USER` | (vide) | Nom d'utilisateur SMTP. |
| `BEEHIVE_SMTP_PASS` | (vide) | Mot de passe SMTP. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Adresse d'expéditeur pour le courrier sortant. |

## Espace de démonstration

Installe un compte et un espace de démonstration de présentation. Désactivé par défaut, consultez
[Mode démo](./demo.md).

| Variable | Défaut | Description |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Installe un compte et un espace de démonstration (15 ruches réparties sur 4 ruchers, réinitialisé toutes les heures). Implique `BEEHIVE_PASSWORD_AUTH=true`. |
| `BEEHIVE_DEMO_AUTOLOGIN` | `false` | Connecte directement les visiteurs anonymes à la démo au lieu d'afficher l'écran de connexion. Réservé aux hôtes de pure démonstration ; laissez-le désactivé sur une instance qui sert aussi de vrais utilisateurs. |
| `BEEHIVE_DEMO_EMAIL` | `demo@app.openbeehive.org` | E-mail du compte de démonstration. |
| `BEEHIVE_DEMO_PASSWORD` | `demo` | Mot de passe du compte de démonstration. |

## WebAuthn / passkeys

Authentification sans mot de passe optionnelle utilisant des passkeys.

| Variable                  | Défaut  | Description                                                            |
| ------------------------- | ------- | --------------------------------------------------------------------- |
| `BEEHIVE_WEBAUTHN_ENABLED`        | `false` | Active la connexion WebAuthn / par passkey.                       |
| `BEEHIVE_WEBAUTHN_RP_ID`          | hôte de `BEEHIVE_PUBLIC_BASE_URL` | ID de la partie de confiance (Relying Party), normalement votre domaine nu (par ex. `openbeehive.org`). |
| `BEEHIVE_WEBAUTHN_RP_ORIGINS`     | `BEEHIVE_PUBLIC_BASE_URL` | Origines autorisées pour les cérémonies WebAuthn, séparées par des virgules. |
| `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME`| `Openbeehive` | Nom lisible affiché aux utilisateurs lors de l'enregistrement.        |

## Fournisseurs OIDC

Connexion via des fournisseurs d'identité externes au moyen d'OpenID Connect. Plusieurs fournisseurs peuvent être activés simultanément.

| Variable             | Défaut  | Description                                                              |
| -------------------- | ------- | ----------------------------------------------------------------------- |
| `BEEHIVE_OIDC_PROVIDERS`     | (vide)  | Liste des fournisseurs activés, séparés par des virgules, par ex. `google,keycloak`. Chaque fournisseur listé a besoin de son émetteur et de son identifiant client, sinon le serveur refuse de démarrer. |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | L'URL de rappel vers laquelle les fournisseurs redirigent après la connexion. |

Chaque fournisseur dispose ensuite de ses propres variables : `BEEHIVE_OIDC_<NAME>_ISSUER`,
`BEEHIVE_OIDC_<NAME>_CLIENT_ID`, `BEEHIVE_OIDC_<NAME>_CLIENT_SECRET` et, en option,
`BEEHIVE_OIDC_<NAME>_SCOPES` (par défaut `openid,profile,email`), où `<NAME>` est le nom du
fournisseur en majuscules. Par exemple :

```bash
# Google
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile

# Keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/beekeepers
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=...
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=...
```

:::tip[Mono-utilisateur, sans connexion]
Pour une instance auto-hébergée personnelle, vous pouvez ignorer entièrement la connexion : laissez `BEEHIVE_PASSWORD_AUTH` désactivé (la valeur par défaut de selfhost), `BEEHIVE_OIDC_PROVIDERS` vide et `BEEHIVE_WEBAUTHN_ENABLED=false`. L'application s'exécute alors en mode mono-utilisateur, sans étape de connexion.
:::

Pour les guides de configuration des fournisseurs, les URL de redirection et les conseils de sécurité, consultez [Authentification](./authentication.md).

## Un exemple selfhost minimal

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://192.168.1.20:8080
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth: single-user mode, no session secret needed
```

Si vous activez l'authentification par mot de passe pour une instance familiale ou associative,
ajoutez le secret de session et l'administrateur dédié :

```bash
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
# Paste the output of: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

Ajoutez un reverse proxy en façade pour le HTTPS, réglez `BEEHIVE_TRUST_PROXY_HEADERS=true` derrière lui, et vous êtes prêt à tenir vos registres.

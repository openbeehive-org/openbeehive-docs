---
sidebar_position: 4
title: "Configuration"
---

# Configuration

Openbeehive se configure entièrement au moyen de variables d'environnement. Cette page constitue la référence complète.

Vous pouvez définir ces variables dans votre shell, dans un fichier `.env` à côté du binaire, dans votre fichier `docker compose`, ou via le gestionnaire de secrets de votre plateforme d'hébergement. Le serveur les lit une seule fois au démarrage, de sorte que les modifications prennent effet après un redémarrage.

:::tip Commencez petit
Vous n'avez besoin que d'une poignée de ces variables pour démarrer. Pour un serveur domestique mono-utilisateur, définissez `BEEHIVE_DEPLOYMENT_PROFILE=selfhost`, un `BEEHIVE_SESSION_SECRET`, et laissez le reste aux valeurs par défaut. Consultez le [Démarrage rapide](/self-hosting/quick-start) pour être opérationnel en quelques minutes.
:::

## Comment fonctionne le profil de déploiement

Le réglage le plus important est `BEEHIVE_DEPLOYMENT_PROFILE`. Il choisit des valeurs par défaut judicieuses pour tout le reste, ce qui vous évite de devoir détailler à la main une pile complète.

| Profil     | Base de données par défaut | Stockage d'objets par défaut | Destiné à                              |
| ---------- | ---------------- | -------------------- | ------------------------------------- |
| `selfhost` | SQLite (fichier) | Système de fichiers local | Un binaire unique, sans Docker, un seul hôte |
| `cloud`    | PostgreSQL       | MinIO / S3           | Le déploiement hébergé, multi-tenant |

Le profil ne fait que définir des *valeurs par défaut*. Toute variable que vous définissez explicitement l'emporte toujours. Par exemple, vous pouvez exécuter le profil `selfhost` tout en le pointant vers PostgreSQL en définissant vous-même `BEEHIVE_DATABASE_DRIVER` et `BEEHIVE_DATABASE_DSN`.

:::note
Les deux profils sont documentés en détail sur leurs propres pages : [Binaire unique](/self-hosting/single-binary) et [Docker](/self-hosting/docker). Cette page se concentre sur les variables elles-mêmes.
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
| `BEEHIVE_HTTP_READ_TIMEOUT` | `0` | Limite de lecture de la requête entière ; `0` signifie aucune. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `0` | Limite d'écriture de la réponse ; `0` signifie aucune. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Durée pendant laquelle une connexion keep-alive inactive reste ouverte. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Délai de grâce pour les requêtes en cours à l'arrêt. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` doit correspondre à l'adresse que les utilisateurs visitent réellement. Si elle est incorrecte, les redirections de connexion et les liens d'invitation pointent vers le mauvais endroit.
:::

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
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | `*`     | Liste d'origines autorisées, séparées par des virgules. Restreignez-la à votre domaine en production. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Indique s'il faut autoriser les requêtes cross-origin avec identifiants (cookies, en-têtes d'authentification). |

:::caution
Une origine joker (`*`) combinée à `BEEHIVE_CORS_ALLOW_CREDENTIALS=true` est permissive. Si vous servez l'application depuis une seule origine, définissez `BEEHIVE_CORS_ALLOWED_ORIGINS` sur cette origine exacte.
:::

## Synchronisation

| Variable  | Défaut   | Description                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | `server` | Identifiant de ce nœud dans le protocole de synchronisation. Utilisé par l'horloge logique hybride (HLC) pour étiqueter les événements. Gardez-le stable et unique par serveur. |

Le moteur de synchronisation sans conflit (HLC plus le dernier-écrivain-gagne par champ et les OR-Sets ajout-gagne) requiert que chaque participant dispose d'une identité stable. Modifier `BEEHIVE_NODE_ID` sur un serveur en service n'est pas recommandé.

## Base de données

| Variable          | Défaut             | Description                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | selon le profil    | Moteur de base de données : `postgres`, `mysql` ou `sqlite`.                |
| `BEEHIVE_DATABASE_DSN`    | selon le profil    | Chaîne de connexion pour le pilote choisi (voir ci-dessous).               |

Exemples de DSN par pilote :

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MySQL
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Pour le choix du pilote, l'optimisation et les notes de migration, consultez [Bases de données](/self-hosting/databases).

## Stockage d'objets

Les photos et autres pièces jointes sont stockées sous forme de blobs, soit sur le système de fichiers local, soit dans un magasin d'objets compatible S3.

| Variable          | Défaut         | Description                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | selon le profil | Backend de stockage : `fs` (système de fichiers local) ou `minio` (MinIO / S3). |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Répertoire des blobs lorsque `BEEHIVE_BLOB_BACKEND=fs`.                         |
| `BEEHIVE_BLOB_PUBLIC_URL` | `<BEEHIVE_PUBLIC_BASE_URL>/files` | URL de base sous laquelle les fichiers stockés sont servis aux navigateurs. Ne la changez que si un proxy ou un CDN sert le répertoire des blobs depuis une autre adresse. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Hôte et port du point de terminaison MinIO / S3.                       |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Clé d'accès du magasin d'objets.                                       |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Clé secrète du magasin d'objets.                                       |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Nom du bucket où sont stockés les blobs.                               |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Définissez `true` pour vous connecter au point de terminaison via HTTPS. |

Les variables `MINIO_*` ne sont utilisées que lorsque `BEEHIVE_BLOB_BACKEND=minio`. Pour un accompagnement complet, consultez [Stockage](/self-hosting/storage).

## Session et authentification

| Variable         | Défaut  | Description                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (vide)  | Secret utilisé pour signer les cookies de session. Générez-en un avec `openssl rand -base64 32`. Obligatoire en production. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | Durée d'une session avant qu'une nouvelle authentification soit requise (par ex. `720h` correspond à 30 jours). |

:::danger
Définissez toujours un `BEEHIVE_SESSION_SECRET` fort et unique, et gardez-le privé. S'il fuit ou change, toutes les sessions existantes sont invalidées.
:::

## E-mail, mot de passe et intégration

Comptes intégrés pour les instances multi-utilisateurs sans fournisseur d'identité externe.
L'administrateur de l'instance est un compte dédié que vous configurez, et non la première
personne à s'inscrire. Consultez [Authentification](/self-hosting/authentication).

| Variable | Défaut | Description |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | activé pour `cloud`, désactivé pour `selfhost` | Active l'inscription et la connexion par e-mail/mot de passe. Également impliqué par `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (vide) | E-mail de l'administrateur de l'instance. **Requis dès que l'authentification par mot de passe est activée.** Le compte est garanti à chaque démarrage : créé s'il manque, et son rôle forcé à administrateur. L'inscription n'accorde jamais le rôle d'administrateur. |
| `BEEHIVE_ADMIN_PASSWORD` | (vide) | Mot de passe de l'administrateur de l'instance, 8 caractères au minimum. Fait foi à chaque démarrage : le mot de passe stocké est réinitialisé à cette valeur, ce qui sert aussi de récupération de mot de passe. |
| `BEEHIVE_REGISTRATION` | `true` | Inscription libre. Réglez sur `false` pour une instance sur invitation uniquement : en dehors de l'administrateur configuré, les comptes ne peuvent être créés que via des liens d'invitation, et l'écran de connexion affiche un avis indiquant que l'instance est sur invitation uniquement. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Exige une confirmation par e-mail avant qu'un nouveau compte puisse se connecter. |
| `BEEHIVE_SMTP_HOST` | (vide) | Serveur SMTP pour les e-mails de vérification/invitation. Si vide, les liens sont écrits dans le journal à la place. |
| `BEEHIVE_SMTP_PORT` | `587` | Port SMTP. |
| `BEEHIVE_SMTP_USER` | (vide) | Nom d'utilisateur SMTP. |
| `BEEHIVE_SMTP_PASS` | (vide) | Mot de passe SMTP. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Adresse d'expéditeur pour le courrier sortant. |

## Espace de démonstration

Installe un compte et un espace (tenant) de démonstration de présentation. Désactivé par défaut, consultez
[Mode démo](/self-hosting/demo).

| Variable | Défaut | Description |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Installe un compte + espace de démonstration (15 ruches réparties sur 4 ruchers, réinitialisé toutes les heures). Implique `BEEHIVE_PASSWORD_AUTH=true`. |
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
| `BEEHIVE_OIDC_PROVIDERS`     | (vide)  | Liste des fournisseurs activés, séparés par des virgules, par ex. `google,keycloak`. |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | L'URL de rappel vers laquelle les fournisseurs redirigent après la connexion. |

Chaque fournisseur dispose ensuite de ses propres variables : `BEEHIVE_OIDC_<NOM>_ISSUER`,
`BEEHIVE_OIDC_<NOM>_CLIENT_ID`, `BEEHIVE_OIDC_<NOM>_CLIENT_SECRET` et, en option,
`BEEHIVE_OIDC_<NOM>_SCOPES` (par défaut `openid,profile,email`), où `<NOM>` est le nom du
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

:::tip Mono-utilisateur, sans connexion
Pour une instance auto-hébergée personnelle, vous pouvez ignorer entièrement la connexion : laissez `BEEHIVE_PASSWORD_AUTH` désactivé (la valeur par défaut de selfhost), `BEEHIVE_OIDC_PROVIDERS` vide et `BEEHIVE_WEBAUTHN_ENABLED=false`. L'application s'exécute alors en mode mono-utilisateur, sans étape de connexion.
:::

Pour les guides de configuration des fournisseurs, les URL de redirection et les conseils de sécurité, consultez [Authentification](/self-hosting/authentication).

## Un exemple selfhost minimal

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth — single-user mode
```

Si vous activez l'authentification par mot de passe pour une instance familiale ou associative,
ajoutez aussi l'administrateur dédié :

```bash
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

C'est tout ce dont un apiculteur seul a besoin. Ajoutez un reverse proxy en façade pour le HTTPS et vous êtes prêt à tenir vos registres.

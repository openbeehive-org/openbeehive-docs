---
sidebar_position: 3
title: "Docker et Compose"
---

# Docker et Compose

Exécutez Openbeehive dans un conteneur unique pour une configuration d'auto-hébergement, ou lancez la pile cloud complète (Postgres et MinIO) avec Docker Compose.

L'image est publiée sur le GitHub Container Registry à chaque tag de version :

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

La même image sert les deux profils de déploiement ; c'est l'environnement que vous transmettez qui décide lequel vous obtenez.

:::tip
Pour une instance mono-utilisateur sur une seule machine, le [binaire unique](/self-hosting/single-binary) est encore plus simple que Docker. Optez pour Compose lorsque vous voulez Postgres et un stockage de type S3.
:::

## Exécuter le conteneur unique

Un conteneur avec le profil `selfhost` conserve une base de données SQLite et les blobs téléversés sur un seul volume monté. Rien d'autre n'est requis.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 8080:8080` mappe le port d'écoute du conteneur (`BEEHIVE_ADDR=:8080`) vers l'hôte.
- `-v openbeehive-data:/data` conserve vos données sur un volume nommé. Elle ne remplit son rôle qu'avec les lignes `BEEHIVE_DATABASE_DSN` et `BEEHIVE_BLOB_DIR` : l'image n'a pas de répertoire de travail, donc les valeurs par défaut (`openbeehive.db`, `./data/blobs`) pointent vers la racine du conteneur et sont perdues à la suppression du conteneur.
- `BEEHIVE_PUBLIC_BASE_URL` doit être l'adresse que les utilisateurs atteignent, schéma compris. Le serveur l'utilise pour les URL de redirection OIDC et pour les liens d'invitation et de vérification.

Sans méthode de connexion activée (la valeur par défaut de selfhost), l'instance fonctionne en mode mono-utilisateur. Pour ajouter l'authentification, définissez `BEEHIVE_SESSION_SECRET` (générez-le une fois avec `openssl rand -base64 32` et gardez-le stable ; le changer déconnecte tout le monde) ainsi que les variables de la méthode voulue. La connexion par e-mail/mot de passe nécessite aussi `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD`, sinon le serveur refuse de démarrer. Voir [Authentification](/self-hosting/authentication).

### Utiliser un fichier d'environnement

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Le profil cloud avec Compose

Le profil `cloud` associe le serveur à PostgreSQL et à MinIO. Le `docker-compose.yml` du dépôt est une pile de développement : il compile le serveur depuis les sources et publie les ports de la base de données et de MinIO sur l'hôte.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
cp .env.example .env   # then edit .env (see below)
docker compose up -d --build
```

### Les services

| Service | Image | Rôle |
| --- | --- | --- |
| `server` | compilé depuis le `Dockerfile` du dépôt | Backend et application web sur `:8080` |
| `postgres` | `postgres:18-alpine` | Base de données ; `5432` publié sur l'hôte |
| `minio` | `minio/minio:latest` | Stockage de blobs compatible S3 ; `9000` (API) et `9001` (console) publiés sur l'hôte |

`server` dépend de `postgres` et de `minio`, donc Compose les démarre en premier.

### Ce que définit le fichier compose

Ces valeurs sont codées en dur dans `docker-compose.yml` et ne sont pas lues depuis `.env` ; modifiez-les en éditant le fichier (et changez les identifiants Postgres et MinIO au même endroit) :

| Paramètre | Valeur dans le fichier compose |
| --- | --- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `cloud` |
| `BEEHIVE_DATABASE_DSN` | `postgres://openbeehive:openbeehive@postgres:5432/openbeehive?sslmode=disable` |
| `BEEHIVE_MINIO_ENDPOINT` | `minio:9000` |
| `BEEHIVE_MINIO_ACCESS_KEY` / `BEEHIVE_MINIO_SECRET_KEY` | `minioadmin` / `minioadmin` |
| `BEEHIVE_OIDC_PROVIDERS` | `google` |

Celles-ci proviennent de votre shell ou de `.env` :

```bash
# Required: the cloud profile enables password auth, which needs the instance admin.
# docker compose up fails immediately if either is missing.
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters

# Sessions; generate with: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=

# Defaults to http://localhost:8080
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Google is enabled as an OIDC provider in the compose file, so these are
# required too; without a client ID the server exits with
# "OIDC provider google: issuer/client id missing". Remove the BEEHIVE_OIDC_*
# lines from docker-compose.yml if you do not want Google sign-in.
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Les noms de service sont des noms d'hôte
À l'intérieur du réseau Compose, les conteneurs s'atteignent par nom de service, c'est pourquoi le DSN pointe vers `postgres` et l'endpoint MinIO vers `minio`.
:::

### Un fichier de forme production

`docker-compose.demo.yml` dans le dépôt est le fichier derrière l'instance hébergée : il utilise l'image publiée au lieu de compiler, ne publie aucun port de base de données ni de MinIO, ajoute des politiques de redémarrage et des healthchecks, prend chaque secret dans `.env`, ferme l'inscription (sur invitation uniquement) et active l'[espace de démonstration](/self-hosting/demo). Son commentaire d'en-tête liste les variables dont il a besoin. Utilisez-le comme point de départ de votre propre pile de production :

```bash
docker compose -f docker-compose.demo.yml up -d
```

Pour la liste complète des variables, voir [Configuration](/self-hosting/configuration).

## Persistance de vos données

- **Conteneur unique (`selfhost`) :** tout se trouve sous `/data` sur le volume `openbeehive-data`, tant que le DSN et le répertoire de blobs y pointent.
- **Profil cloud :** les enregistrements résident dans le volume `pg` (Postgres) et les fichiers téléversés dans le volume `minio`. Le conteneur serveur est sans état et peut être remplacé librement.

:::danger Sauvegardez avant de mettre à niveau
Les volumes nommés survivent à `docker compose up` et aux mises à niveau d'images, mais pas à `docker compose down -v` ni à un volume supprimé. Faites une sauvegarde avant toute mise à niveau ou commande destructrice. Voir [Sauvegardes](/self-hosting/backups).
:::

## Opérations courantes

```bash
# Follow the server logs
docker compose logs -f server

# Rebuild from updated source and recreate (docker-compose.yml builds the image)
git pull && docker compose up -d --build

# Pull a newer published image and recreate (docker-compose.demo.yml or your own file)
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d

# Stop everything (volumes are kept)
docker compose down
```

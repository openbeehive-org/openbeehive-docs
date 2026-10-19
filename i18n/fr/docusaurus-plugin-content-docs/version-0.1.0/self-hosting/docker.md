---
sidebar_position: 3
title: "Docker et Compose"
---

# Docker et Compose

Docker est le moyen le plus rapide d'exécuter Openbeehive sur un serveur. Vous pouvez
exécuter le conteneur unique seul pour une configuration d'auto-hébergement soignée, ou lancer la pile
cloud complète (Postgres et MinIO) avec Docker Compose.

L'image officielle est publiée sur le GitHub Container Registry :

```text
ghcr.io/openbeehive-org/openbeehive-app:latest
```

La même image fonctionne pour les deux profils de déploiement. Celui que vous obtenez est décidé
entièrement par l'environnement que vous transmettez.

:::tip Vous voulez juste que ça tourne vite ?
Si vous n'avez besoin que d'une instance mono-utilisateur sur une seule machine, le
[binaire unique](/self-hosting/single-binary) est encore plus simple que Docker.
Optez pour Compose lorsque vous voulez Postgres et un stockage de type S3.
:::

## Exécuter le conteneur unique

Le déploiement le plus simple est un conteneur utilisant le profil `selfhost`, qui
conserve toutes ses données (une base de données SQLite et les blobs téléversés) sur un seul
volume monté. Rien d'autre n'est requis.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e BEEHIVE_DATABASE_DRIVER=sqlite \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -e BEEHIVE_SESSION_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Quelques remarques sur les options :

- `-p 8080:8080` mappe le port d'écoute du conteneur (défini par `BEEHIVE_ADDR=:8080`) vers
  l'hôte.
- `-v openbeehive-data:/data` est l'option importante. Elle conserve votre base de données et vos
  téléversements sur un volume Docker nommé afin qu'ils survivent aux redémarrages et
  mises à niveau de conteneurs. Pointez à la fois `BEEHIVE_DATABASE_DSN` et `BEEHIVE_BLOB_DIR` dans ce volume.
- `BEEHIVE_PUBLIC_BASE_URL` doit être l'adresse que les utilisateurs atteignent réellement, schéma compris.
  Elle sert à construire les liens profonds des codes QR et les URL de redirection OIDC, alors veillez à ce qu'elle soit correcte.
- `BEEHIVE_SESSION_SECRET` signe les cookies de session. Générez-le une fois et gardez-le stable ;
  le changer déconnecte tout le monde.

:::caution Définissez un secret de session stable
L'astuce `$(openssl rand -base64 32)` est pratique pour un premier lancement, mais elle produit
une nouvelle valeur à chaque exécution de la commande. Générez le secret une fois, stockez-le
dans un endroit sûr, et transmettez la même valeur à chaque redémarrage.
:::

Avec `BEEHIVE_OIDC_PROVIDERS` laissé vide et `BEEHIVE_WEBAUTHN_ENABLED=false`, l'instance fonctionne
en mode mono-utilisateur sans connexion. Pour ajouter l'authentification, voir
[Authentification](/self-hosting/authentication).

### Utiliser un fichier d'environnement

Les longues listes de `-e` deviennent peu maniables. Mettez vos paramètres dans un fichier et transmettez-le avec
`--env-file` :

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Le profil cloud avec Compose

Le profil `cloud` associe le serveur à PostgreSQL pour la base de données et à MinIO
pour le stockage de blobs compatible S3. C'est la configuration recommandée pour l'hébergement
multi-utilisateurs et celle qui reflète le service hébergé.

Le dépôt fournit un `docker-compose.yml` qui relie les trois services
entre eux. Clonez le dépôt, copiez l'environnement d'exemple et lancez-le :

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive
cp .env.example .env   # puis modifiez .env (voir ci-dessous)
docker compose up -d
```

### Les services

| Service | Image | Rôle |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app:latest` | Le backend Openbeehive et la PWA, à l'écoute sur `:8080`. |
| `postgres` | `postgres` | La base de données relationnelle pour tous les enregistrements synchronisés. |
| `minio` | `minio/minio` | Le stockage objet compatible S3 pour les photos et autres blobs. |

Le `server` dépend à la fois de `postgres` et de `minio`, donc Compose les démarre
en premier. L'application web est servie par le même conteneur lorsque `BEEHIVE_SERVE_WEB=true`.

### Environnement requis

Définissez ceci dans votre `.env` avant de démarrer. Le fichier compose les lit et les
transmet aux bons conteneurs.

```bash
BEEHIVE_DEPLOYMENT_PROFILE=cloud
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Base de données — l'hôte "postgres" est le nom du service compose
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:changeme@postgres:5432/openbeehive?sslmode=disable

# Stockage de blobs — l'endpoint "minio" est le nom du service compose
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=minio:9000
BEEHIVE_MINIO_ACCESS_KEY=minioadmin
BEEHIVE_MINIO_SECRET_KEY=changeme-too
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=false

# Sessions
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
BEEHIVE_SESSION_TTL=720h

# Authentification (exemple : Google + Keycloak)
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://bees.example.com/auth/callback
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Les noms de service sont des noms d'hôte
À l'intérieur du réseau Compose, les conteneurs s'atteignent par nom de service. C'est
pourquoi `BEEHIVE_DATABASE_DSN` pointe vers `postgres` et `BEEHIVE_MINIO_ENDPOINT` vers `minio` plutôt
que `localhost`. Modifiez les identifiants pour correspondre aux valeurs que vous avez définies pour les
conteneurs Postgres et MinIO.
:::

Pour la liste complète des variables OIDC et WebAuthn, voir
[Configuration](/self-hosting/configuration) et
[Authentification](/self-hosting/authentication).

### Un exemple compose allégé

Ceci est une illustration réduite de la façon dont les services s'assemblent. Utilisez le
`docker-compose.yml` du dépôt pour le vrai déploiement ; il inclut des
healthchecks et des valeurs par défaut raisonnables que cet extrait omet.

```docker
services:
  server:
    image: ghcr.io/openbeehive-org/openbeehive-app:latest
    ports:
      - "8080:8080"
    env_file: .env
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: openbeehive
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: openbeehive
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: changeme-too
    volumes:
      - miniodata:/data
    restart: unless-stopped

volumes:
  pgdata:
  miniodata:
```

## Persistance de vos données

Les enregistrements apicoles sont précieux, alors assurez-vous qu'ils résident sur des volumes qui survivent
aux conteneurs.

- **Conteneur unique (`selfhost`) :** tout se trouve sous `/data`. Le volume
  nommé `openbeehive-data` contient à la fois la base de données SQLite et le répertoire de
  blobs.
- **Profil cloud :** les enregistrements résident dans le volume `pgdata` (Postgres) et les fichiers
  téléversés dans le volume `miniodata` (MinIO). Le conteneur serveur lui-même est
  sans état et peut être remplacé librement.

:::danger Sauvegardez avant de mettre à niveau
Les volumes nommés survivent à `docker compose up` et aux mises à niveau d'images, mais ils ne
survivent pas à `docker compose down -v` ni à un volume supprimé. Faites une sauvegarde avant toute
mise à niveau ou commande destructrice. Voir [Sauvegardes](/self-hosting/backups).
:::

## Opérations courantes

```bash
# Suivre les logs du serveur
docker compose logs -f server

# Mettre à jour vers une image plus récente et recréer
docker compose pull
docker compose up -d

# Tout arrêter (les volumes sont conservés)
docker compose down
```

## Étapes suivantes

- Placez un proxy terminant TLS en façade : [Reverse proxy](/self-hosting/reverse-proxy).
- Ajustez les choix de base de données et de stockage : [Bases de données](/self-hosting/databases) et
  [Stockage](/self-hosting/storage).
- Passez en revue chaque paramètre au même endroit : [Configuration](/self-hosting/configuration).

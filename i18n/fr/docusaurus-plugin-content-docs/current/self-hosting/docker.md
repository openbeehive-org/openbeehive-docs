---
sidebar_position: 3
title: "Docker et Compose"
---

# Docker et Compose

Exécutez Openbeehive dans un conteneur unique pour une configuration d'auto-hébergement, ou lancez ensemble PostgreSQL, MinIO et le serveur avec Docker Compose. Le dépôt fournit un fichier Compose pour chaque cas :

| Fichier | Ce qu'il exécute | À utiliser pour |
| --- | --- | --- |
| `docker-compose.selfhost.yml` | Un conteneur, SQLite et les fichiers sur un volume nommé | Un apiculteur ou un foyer sur une seule machine |
| `docker-compose.prod.yml` | L'image publiée avec PostgreSQL et MinIO, connexion toujours activée | Une instance avec plusieurs utilisateurs |
| `docker-compose.yml` | PostgreSQL, MinIO et un serveur compilé depuis la copie de travail | Le développement. Pas un modèle pour la production |
| `docker-compose.demo.yml` | Comme le fichier de production, plus la démo publique en lecture seule | L'instance hébergée sur `app.openbeehive.org`. Pas un modèle pour votre propre serveur |

L'image est publiée sur le GitHub Container Registry à chaque tag de version :

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

La même image sert les deux profils de déploiement ; c'est l'environnement que vous transmettez qui décide lequel vous obtenez. Depuis la 0.4.0, le conteneur s'exécute sous l'utilisateur non privilégié `65532`, avec `/data` comme répertoire de travail.

### Vérifier une image de version

Chaque image de version est signée avec [cosign](https://docs.sigstore.dev/cosign/verifying/verify/) (sans clé, liée à l'identité du workflow de publication), porte une attestation de provenance de build GitHub et est accompagnée d'un SBOM sur la [version GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Pour vérifier que l'image que vous récupérez est bien celle construite par le workflow de publication :

```bash
cosign verify ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/openbeehive-org/openbeehive-app/\.github/workflows/release\.yml@.*'

gh attestation verify oci://ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z --owner openbeehive-org
```

Les deux commandes affichent l'identité de signature et le commit à partir duquel l'image a été construite. Les images publiées avant la 0.4.0 ne sont pas signées.

:::tip
Pour une instance mono-utilisateur sur une seule machine, le [binaire unique](./single-binary.md) est encore plus simple que Docker. Optez pour le fichier Compose de production lorsque plusieurs personnes utilisent l'instance.
:::

## Exécuter le conteneur unique

Un conteneur avec le profil `selfhost` conserve une base de données SQLite et les fichiers téléversés sur un seul volume monté. Rien d'autre n'est requis.

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 127.0.0.1:8080:8080` publie le port sur cette machine uniquement. Sans connexion, toute personne pouvant atteindre le port dispose d'un accès complet ; ne le publiez donc sur le réseau (`-p 8080:8080`) qu'après avoir [activé la connexion](./quick-start.md#turn-login-on).
- `-v openbeehive-data:/data` conserve vos données sur un volume nommé. `/data` est le répertoire de travail, de sorte que les valeurs par défaut (`openbeehive.db`, `./data/blobs`) aboutissent sur le volume. Docker crée le volume avec le propriétaire de `/data` dans l'image, de sorte que l'utilisateur serveur non privilégié peut y écrire. Si vous montez à la place un répertoire de l'hôte en bind mount (`-v /srv/openbeehive:/data`), il doit appartenir à l'uid `65532` : `sudo chown -R 65532:65532 /srv/openbeehive`.
- Un serveur sans connexion ne répond qu'à `localhost`, aux adresses IP et à l'hôte de `BEEHIVE_PUBLIC_BASE_URL`. Si vous l'ouvrez sous un autre nom (par exemple `http://nas.local:8080`), réglez `BEEHIVE_PUBLIC_BASE_URL` sur cette adresse ou ajoutez le nom à `BEEHIVE_ALLOWED_HOSTS`.

### La même chose sous forme de fichier Compose

`docker-compose.selfhost.yml` est la commande ci-dessus avec une politique de redémarrage et un contrôle de santé. Il prend ses réglages dans un fichier `.env` placé à côté de lui :

```bash
# .env (all optional; without it the instance has no login and is published on 127.0.0.1)
BEEHIVE_BIND=0.0.0.0                              # publish on the network
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org  # the address people open
BEEHIVE_PASSWORD_AUTH=true                        # require sign-in
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please           # 8+ characters
BEEHIVE_SESSION_SECRET=...                        # openssl rand -base64 32
BEEHIVE_TRUST_PROXY_HEADERS=true                  # only behind a reverse proxy
```

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Avec un simple `docker run`, transmettez les mêmes variables avec `-e` ou `--env-file openbeehive.env`. Toute méthode de connexion nécessite `BEEHIVE_SESSION_SECRET` (32 octets ou plus ; générez-le une fois et gardez-le stable, le changer déconnecte tout le monde). Voir [Authentification](./authentication.md).

## Plusieurs utilisateurs : PostgreSQL et MinIO \{#several-users}

`docker-compose.prod.yml` exécute l'image publiée dans le profil `cloud` avec PostgreSQL et MinIO. La connexion est toujours activée (e-mail et mot de passe), l'inscription est fermée sauf si vous l'ouvrez, et seul le port de l'application est publié, sur `127.0.0.1`, pour votre [reverse proxy](./reverse-proxy.md). PostgreSQL et MinIO ne sont pas publiés du tout.

Le fichier refuse de démarrer tant que tous les secrets ne sont pas définis. Placez-les dans un fichier `.env` à côté de lui :

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org
BEEHIVE_SESSION_SECRET=...      # openssl rand -base64 32
POSTGRES_PASSWORD=...           # openssl rand -hex 24
MINIO_ROOT_PASSWORD=...         # openssl rand -hex 24
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=...      # 8+ characters; applied again on every start
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

Réglages facultatifs que le fichier transmet : `BEEHIVE_REGISTRATION` (par défaut `false`, sur invitation uniquement), les variables `BEEHIVE_SMTP_*` pour les e-mails d'invitation et de vérification, et `BEEHIVE_BIND` (ne le réglez sur `0.0.0.0` que lorsque le reverse proxy s'exécute sur une autre machine, et assurez-vous que rien d'autre ne peut atteindre le port).

Le fichier définit `BEEHIVE_TRUST_PROXY_HEADERS=true`, car il s'attend à exactement un reverse proxy en amont. Exécutez exactement une instance du serveur par base de données.

### Les services

| Service | Image | Rôle |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app` (version épinglée) | Backend et application web sur `:8080` |
| `postgres` | `postgres:18-alpine` | Base de données |
| `minio` | `minio/minio` | Stockage de blobs compatible S3 |

`server` attend que `postgres` et `minio` se déclarent en bonne santé.

:::note Les noms de service sont des noms d'hôte
À l'intérieur du réseau Compose, les conteneurs s'atteignent par nom de service, c'est pourquoi le DSN pointe vers `postgres` et l'endpoint MinIO vers `minio`.
:::

### La pile de développement

`docker-compose.yml` compile le serveur depuis la copie de travail et publie PostgreSQL (`5432`) et MinIO (`9000`, `9001`) sur `127.0.0.1` pour les outils locaux. Il a besoin de `BEEHIVE_SESSION_SECRET`, `MINIO_ROOT_PASSWORD`, `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD` dans `.env`. OIDC est optionnel : définissez `BEEHIVE_OIDC_PROVIDERS` avec l'émetteur et l'identifiant client du fournisseur. Il est destiné à travailler sur Openbeehive, pas à l'exploiter.

```bash
cp .env.example .env   # then add the four values above
docker compose up -d --build
```

Pour la liste complète des variables, voir [Configuration](./configuration.md).

## Persistance de vos données

- **Conteneur unique (`selfhost`) :** tout se trouve sous `/data` sur le volume `openbeehive-data`.
- **PostgreSQL et MinIO :** les enregistrements résident dans le volume `pg` et les fichiers téléversés dans le volume `minio`. Le conteneur serveur est sans état et peut être remplacé librement.

:::danger Sauvegardez avant de mettre à niveau
Les volumes nommés survivent à `docker compose up` et aux mises à niveau d'images, mais pas à `docker compose down -v` ni à un volume supprimé. Faites une sauvegarde avant toute mise à niveau ou commande destructrice. Voir [Sauvegardes](./backups.md).
:::

## Opérations courantes

```bash
# Follow the server logs
docker compose -f docker-compose.prod.yml logs -f server

# Pull the image named in the Compose file and recreate
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rebuild the development stack from updated source
git pull && docker compose up -d --build

# Stop everything (volumes are kept)
docker compose -f docker-compose.prod.yml down
```

Les fichiers Compose épinglent une version par tag et par digest. Pour passer à une version plus récente, mettez à jour le fichier depuis le dépôt (ou changez le tag) et suivez [Mise à niveau](./upgrading.md).

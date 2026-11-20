---
sidebar_position: 1
title: "Démarrage rapide"
---

# Démarrage rapide

Deux options pour obtenir une instance Openbeehive opérationnelle que vous pouvez ouvrir dans un navigateur :

- **Option A, Docker.** Lancez l'image publiée avec une seule commande.
- **Option B, binaire unique.** Compilez un exécutable autonome. Pas de Docker, pas de serveur de base de données, pas de stockage objet. Convient à un serveur domestique, un Raspberry Pi ou un petit VPS.

Les deux utilisent le profil de déploiement **selfhost** : une base de données SQLite intégrée et des fichiers sur le disque local. Pour plusieurs utilisateurs sur PostgreSQL et MinIO/S3, voir [Docker et Compose](./docker.md#several-users).

:::caution[Aucune connexion par défaut]
Dans le profil selfhost, aucune méthode de connexion n'est activée par défaut : l'application ouvre donc directement vos enregistrements et **quiconque peut atteindre le port dispose d'un accès complet**. Cela convient sur votre propre ordinateur. C'est pourquoi les exemples ne publient le port que sur `127.0.0.1`, et un serveur sans connexion ne répond qu'à `localhost`, aux adresses IP et à l'hôte de `BEEHIVE_PUBLIC_BASE_URL`. Avant de l'ouvrir à d'autres appareils ou à d'autres personnes, [activez la connexion](#turn-login-on).
:::

## Option A : Docker

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Ouvrez `http://localhost:8080`. Le répertoire de travail du conteneur est `/data`, de sorte que la base de données (`openbeehive.db`) et les fichiers téléversés (`data/blobs`) aboutissent sur le volume `openbeehive-data` et survivent aux redémarrages et aux mises à niveau.

Le dépôt fournit la même configuration sous forme de fichier Compose, [`docker-compose.selfhost.yml`](https://github.com/openbeehive-org/openbeehive-app/blob/main/docker-compose.selfhost.yml), qui lit ses réglages dans un fichier `.env` placé à côté de lui :

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Pour arrêter ou supprimer le conteneur (le volume est conservé) :

```bash
docker stop openbeehive
docker rm openbeehive
```

## Option B : binaire unique (sans Docker)

### Prérequis

- Go 1.27 ou plus récent
- Node 24 ou plus récent (l'image publiée compile avec Node 26)
- [buf](https://buf.build/docs/installation) (`make tools` installe la version épinglée)

### Compiler et lancer

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure (optional): the defaults already are the selfhost profile
cp .env.example .env

# Run
./server/bin/openbeehive
```

Le binaire lit `.env` dans le répertoire depuis lequel il est lancé ; les variables déjà définies dans l'environnement l'emportent. Par défaut, il écoute sur `:8080` et sert lui-même l'application web (`BEEHIVE_SERVE_WEB=true`), de sorte que l'API et la PWA proviennent de la même origine. Ouvrez `http://localhost:8080`.

Les premières lignes du journal indiquent comment le serveur est configuré, y compris qui peut l'utiliser :

```text
config: applied .env from the working directory (existing environment variables win)
Openbeehive · profile=selfhost · DB=sqlite · Blob=fs
auth: NO LOGIN (single-user mode): every request has full access to all data
auth: accepting requests for hosts: localhost, IP addresses (add names with BEEHIVE_ALLOWED_HOSTS)
```

:::note[Où se trouvent vos données]
En mode selfhost, vos enregistrements vont dans un fichier SQLite (`openbeehive.db` dans le répertoire de travail par défaut) et les fichiers téléversés dans un répertoire de blobs (`./data/blobs` par défaut). Sauvegardez les deux et vous aurez tout sauvegardé ; voir [Sauvegardes](./backups.md).
:::

## Activer la connexion \{#turn-login-on}

Pour atteindre l'instance depuis d'autres appareils ou la partager avec d'autres personnes, exigez une connexion. Placez ces réglages dans `.env` (à côté du binaire, ou à côté de `docker-compose.selfhost.yml`), ou transmettez-les avec `-e` à `docker run` :

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org   # the address people open
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please            # 8+ characters
BEEHIVE_SESSION_SECRET=...                         # openssl rand -base64 32
BEEHIVE_BIND=0.0.0.0                               # Compose file only: publish on the network
```

- `BEEHIVE_PUBLIC_BASE_URL` est l'adresse que le serveur insère dans les liens qu'il génère (redirections OIDC, liens d'invitation et de vérification).
- `BEEHIVE_SESSION_SECRET` doit faire au moins 32 octets. Avec n'importe quelle méthode de connexion, le serveur refuse de démarrer sans lui.
- `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD` définissent l'administrateur de l'instance ; avec la connexion par e-mail/mot de passe, le serveur refuse de démarrer sans eux.

Les enregistrements créés avant l'activation de la connexion sont déplacés dans l'espace de l'administrateur au démarrage suivant ; connectez-vous en tant qu'administrateur pour les voir. Les détails et les autres méthodes de connexion se trouvent dans [Authentification](./authentication.md).

## Premières étapes après l'installation

1. Ouvrez l'application et créez votre premier rucher.
2. Ajoutez une ruche, modifiez-la pour définir son type et enregistrez une visite.
3. Imprimez une étiquette QR pour la ruche afin de pouvoir la scanner directement sur le terrain.

Avant d'exposer l'instance sur Internet, placez un [reverse proxy](./reverse-proxy.md) terminant TLS en façade, définissez `BEEHIVE_PUBLIC_BASE_URL` sur l'adresse `https://` et `BEEHIVE_TRUST_PROXY_HEADERS=true`. Configurez ensuite les [sauvegardes](./backups.md). Exécutez exactement une instance du serveur par base de données.

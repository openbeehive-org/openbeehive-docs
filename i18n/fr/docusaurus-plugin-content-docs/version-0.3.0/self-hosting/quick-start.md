---
sidebar_position: 1
title: "Démarrage rapide"
---

# Démarrage rapide

Deux options pour obtenir une instance Openbeehive opérationnelle que vous pouvez ouvrir dans un navigateur :

- **Option A, binaire unique.** Compilez un exécutable autonome qui utilise SQLite et le système de fichiers local. Pas de Docker, pas de serveur de base de données, pas de stockage objet. Convient à un serveur domestique, un Raspberry Pi ou un petit VPS.
- **Option B, Docker.** Lancez l'image publiée avec une seule commande.

Les deux utilisent le profil de déploiement **selfhost**, qui s'appuie par défaut sur une base de données SQLite intégrée et un stockage de blobs sur le système de fichiers. Vous pourrez passer à PostgreSQL et MinIO/S3 plus tard ; voir [Configuration](/self-hosting/configuration).

:::tip Mono-utilisateur ? Aucune connexion requise
Dans le profil selfhost, aucune méthode de connexion n'est activée par défaut : `BEEHIVE_PASSWORD_AUTH` est désactivé, `BEEHIVE_OIDC_PROVIDERS` est vide et `BEEHIVE_WEBAUTHN_ENABLED=false`. L'application ouvre directement vos enregistrements. Pour ajouter une connexion ultérieurement, voir [Authentification](/self-hosting/authentication).
:::

## La configuration minimale fonctionnelle

Quelle que soit l'option choisie, deux paramètres comptent pour démarrer :

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` est l'adresse que le serveur insère dans les liens qu'il génère (redirections OIDC, liens d'invitation et de vérification). Pour des tests locaux, `http://localhost:8080` convient. Pour un déploiement réel, définissez-la sur votre URL publique, par exemple `https://bees.example.com`.

Tout le reste possède des valeurs par défaut pour l'auto-hébergement. La liste complète se trouve dans [Configuration](/self-hosting/configuration).

## Option A : binaire unique (sans Docker)

### Prérequis

- Go 1.25 ou plus récent
- Node 24 ou plus récent
- [buf](https://buf.build/docs/installation)

### Compiler et lancer

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

Par défaut, le binaire écoute sur `:8080` et sert lui-même l'application web (`BEEHIVE_SERVE_WEB=true`), de sorte que l'API et la PWA proviennent de la même origine. Ouvrez l'adresse indiquée dans `BEEHIVE_PUBLIC_BASE_URL`.

:::note Où se trouvent vos données
En mode selfhost, vos enregistrements vont dans un fichier SQLite (`openbeehive.db` dans le répertoire de travail par défaut) et les photos téléversées dans un répertoire de blobs (`./data/blobs` par défaut). Sauvegardez les deux et vous aurez tout sauvegardé ; voir [Sauvegardes](/self-hosting/backups).
:::

## Option B : Docker

L'image publiée est `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Ce sont les lignes `BEEHIVE_DATABASE_DSN` et `BEEHIVE_BLOB_DIR` qui placent vos données sur le volume. Sans elles, le conteneur utilise ses valeurs par défaut, `openbeehive.db` et `./data/blobs` relatifs au répertoire racine du conteneur, qui se trouvent hors du volume et disparaissent après un `docker rm`. Avec elles, le volume `openbeehive-data` contient la base de données et les blobs, qui survivent aux redémarrages et aux mises à niveau. Une fois lancé, ouvrez `http://localhost:8080`.

Pour arrêter ou supprimer le conteneur (le volume est conservé) :

```bash
docker stop openbeehive
docker rm openbeehive
```

Si vous activez la connexion par e-mail/mot de passe (`BEEHIVE_PASSWORD_AUTH=true`), le serveur refuse de démarrer tant que `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD` ne sont pas définis eux aussi. Voir [Authentification](/self-hosting/authentication).

:::tip Plutôt la pile cloud ?
La commande ci-dessus exécute le profil selfhost léger. Pour le profil **cloud** (PostgreSQL + MinIO), le dépôt fournit des fichiers Compose ; voir [Docker](/self-hosting/docker).
:::

## Premières étapes après l'installation

1. Ouvrez l'application à votre `BEEHIVE_PUBLIC_BASE_URL` et créez votre premier rucher.
2. Ajoutez une ruche, modifiez-la pour définir son type et enregistrez une visite.
3. Imprimez une étiquette QR pour la ruche afin de pouvoir la scanner directement sur le terrain.

Avant d'exposer l'instance sur Internet, placez un [reverse proxy](/self-hosting/reverse-proxy) terminant TLS en façade et définissez `BEEHIVE_PUBLIC_BASE_URL` sur l'adresse `https://`. Configurez ensuite les [sauvegardes](/self-hosting/backups).

---
sidebar_position: 1
title: "Démarrage rapide"
---

# Démarrage rapide

C'est le chemin le plus court entre rien du tout et une instance Openbeehive opérationnelle que vous pouvez ouvrir dans un navigateur. Choisissez l'une des deux options :

- **Option A — Binaire unique.** Compilez un binaire autonome qui utilise SQLite et le système de fichiers local. Pas de Docker, pas de serveur de base de données, pas de stockage objet. Idéal pour un serveur domestique, un Raspberry Pi ou un petit VPS.
- **Option B — Docker.** Récupérez notre image publiée et lancez-la avec une seule commande.

Les deux options utilisent le profil de déploiement **selfhost**, qui s'appuie par défaut sur une base de données SQLite intégrée et un stockage de blobs sur le système de fichiers. Vous pourrez passer à PostgreSQL et MinIO/S3 plus tard — voir [Configuration](/self-hosting/configuration).

:::tip Mono-utilisateur ? Aucune connexion requise
Si vous êtes la seule personne à utiliser votre instance, vous pouvez fonctionner **sans aucune authentification**. Laissez simplement `BEEHIVE_OIDC_PROVIDERS` vide et conservez `BEEHIVE_WEBAUTHN_ENABLED=false` (ce sont les valeurs par défaut). L'application ouvre directement vos enregistrements. Pour ajouter une connexion ultérieurement, voir [Authentification](/self-hosting/authentication).
:::

## La configuration minimale fonctionnelle

Quelle que soit l'option choisie, seuls deux paramètres comptent vraiment pour démarrer :

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` est l'adresse que les gens (et les liens profonds des codes QR) utilisent pour accéder à l'application. Pour des tests locaux, `http://localhost:8080` convient. Pour un déploiement réel, définissez-la sur votre URL publique, par exemple `https://bees.example.com`.

Tout le reste possède des valeurs par défaut raisonnables pour l'auto-hébergement. La liste complète se trouve dans [Configuration](/self-hosting/configuration).

## Option A — Binaire unique (sans Docker)

### Prérequis

- Go 1.25 ou plus récent
- Node 22 ou plus récent
- [buf](https://buf.build/docs/installation)

### Compiler et lancer

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Générer le code Connect-RPC, puis compiler le serveur
make proto
make build

# Configurer
cp .env.example .env
# Modifiez .env : définissez BEEHIVE_DEPLOYMENT_PROFILE=selfhost et BEEHIVE_PUBLIC_BASE_URL

# Lancer
./server/bin/openbeehive
```

Par défaut, le binaire écoute sur `:8080` et sert lui-même l'application web (`BEEHIVE_SERVE_WEB=true`), de sorte que l'API et la PWA proviennent de la même origine. Ouvrez l'adresse indiquée dans `BEEHIVE_PUBLIC_BASE_URL` et vous y êtes.

:::note Où se trouvent vos données
En mode selfhost, vos enregistrements vont dans un fichier SQLite local et les photos téléversées dans un répertoire de blobs (`./data/blobs` par défaut). Sauvegardez-les et vous aurez tout sauvegardé — voir [Sauvegardes](/self-hosting/backups).
:::

## Option B — Docker

Si Docker est installé, c'est l'option la plus rapide de toutes. L'image publiée est `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Le volume `-v openbeehive-data:/data` conserve votre base de données SQLite et vos blobs hors du conteneur afin qu'ils survivent aux mises à niveau et aux redémarrages. Une fois lancé, ouvrez `http://localhost:8080`.

Pour l'arrêter ou le supprimer :

```bash
docker stop openbeehive
docker rm openbeehive
```

:::tip Plutôt la pile cloud ?
Les commandes ci-dessus exécutent le profil selfhost léger. Si vous voulez le profil **cloud** complet (PostgreSQL + MinIO), le dépôt fournit un fichier Compose — exécutez `docker compose up -d`. Voir [Docker](/self-hosting/docker) pour les détails.
:::

## Premières étapes après l'installation

Vous disposez maintenant d'une instance opérationnelle. À partir de là :

1. Ouvrez l'application à votre `BEEHIVE_PUBLIC_BASE_URL` et créez votre premier rucher.
2. Ajoutez une ruche, choisissez son type et enregistrez une visite.
3. Vous pouvez aussi imprimer une étiquette QR pour la ruche afin de pouvoir la scanner directement sur le terrain.

Pour une visite guidée de l'application elle-même, rendez-vous sur [Utiliser l'application](/category/using-the-app). Pour préparer votre instance à la production — HTTPS, un vrai domaine, l'authentification et les sauvegardes — poursuivez avec :

- [Configuration](/self-hosting/configuration) — chaque variable d'environnement expliquée
- [Reverse proxy](/self-hosting/reverse-proxy) — placez TLS et un domaine en façade
- [Authentification](/self-hosting/authentication) — ajoutez la connexion OIDC ou les passkeys
- [Sauvegardes](/self-hosting/backups) — protégez vos enregistrements

:::caution Utilisez HTTPS en production
`http://localhost` ne convient qu'aux tests locaux. Exposer l'application sur Internet sans TLS met vos données en danger et casse les fonctionnalités qui exigent un contexte sécurisé. Définissez `BEEHIVE_PUBLIC_BASE_URL` sur une adresse `https://` et terminez TLS au niveau d'un reverse proxy avant la mise en production.
:::

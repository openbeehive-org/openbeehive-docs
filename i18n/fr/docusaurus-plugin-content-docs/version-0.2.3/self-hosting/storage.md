---
sidebar_position: 6
title: "Stockage de blobs"
---

# Stockage de blobs

Openbeehive stocke vos enregistrements dans une base de données, mais les photos et autres pièces
jointes binaires résident séparément dans le **stockage de blobs**. Cela garde la base de données légère
et vous permet de faire évoluer le stockage des images indépendamment.

Vous choisissez un backend avec la variable d'environnement `BEEHIVE_BLOB_BACKEND`. Il y a deux
options : le **système de fichiers** local et un stockage objet **compatible S3** tel que
**MinIO**.

## Choisir un backend

| Backend | `BEEHIVE_BLOB_BACKEND` | Idéal pour | Notes |
| --- | --- | --- | --- |
| Système de fichiers | `fs` | Auto-hébergement sur un seul serveur | Le plus simple ; aucun service supplémentaire à exécuter |
| MinIO / S3 | `minio` | Cloud, multi-serveurs, plus grands parcs | Évolutif, durable, peut être déchargé |

Une bonne règle empirique : si vous exécutez le profil **selfhost** sur une seule machine, utilisez le
système de fichiers. Si vous exécutez le profil **cloud** ou prévoyez de grandir, utilisez le stockage
objet.

:::note
Le backend de blobs est indépendant de votre pilote de base de données. Vous pouvez associer SQLite
à MinIO, ou PostgreSQL au système de fichiers, dans n'importe quelle combinaison qui convient à
votre configuration.
:::

## Stockage sur le système de fichiers

C'est la valeur par défaut pour l'auto-hébergement. Les photos sont écrites dans un répertoire sur le disque.

```bash
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
```

`BEEHIVE_BLOB_DIR` est l'endroit où les fichiers sont stockés. Le chemin est relatif au répertoire de
travail du processus serveur, donc pour des résultats prévisibles sur un serveur, utilisez un
chemin absolu tel que `/var/lib/openbeehive/blobs`.

Les navigateurs récupèrent les fichiers stockés depuis `<BEEHIVE_PUBLIC_BASE_URL>/files`. Si un
reverse proxy ou un CDN sert ce répertoire depuis une autre adresse, définissez
`BEEHIVE_BLOB_PUBLIC_URL` sur l'URL de base qu'il expose ; le serveur l'utilise lorsqu'il
transmet les liens de fichiers à l'application.

Le serveur crée le répertoire s'il n'existe pas, mais assurez-vous que le processus
le possède et peut y écrire.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution Sauvegardez-le
Le répertoire de blobs n'est **pas** stocké dans votre base de données. Une sauvegarde de la base de données seule
ne sauvegardera pas vos photos. Incluez `BEEHIVE_BLOB_DIR` dans votre routine de sauvegarde. Voir
[Sauvegardes](/self-hosting/backups) pour une stratégie complète.
:::

### Note Docker

Si vous exécutez l'[image Docker](/self-hosting/docker), montez un volume pour que les blobs
survivent aux redémarrages et mises à niveau de conteneurs :

```bash
docker run -d \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-blobs:/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Stockage MinIO / S3

Le stockage objet est le bon choix pour le profil cloud et pour quiconque
souhaite un stockage de photos durable et évolutif qui peut résider sur une machine séparée ou un
service managé.

```bash
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=play.min.io
BEEHIVE_MINIO_ACCESS_KEY=your-access-key
BEEHIVE_MINIO_SECRET_KEY=your-secret-key
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=true
```

| Variable | Rôle |
| --- | --- |
| `BEEHIVE_MINIO_ENDPOINT` | Hôte (et port facultatif) du stockage objet, sans schéma |
| `BEEHIVE_MINIO_ACCESS_KEY` | Clé d'accès / ID de clé |
| `BEEHIVE_MINIO_SECRET_KEY` | Clé secrète |
| `BEEHIVE_MINIO_BUCKET` | Bucket où les blobs sont stockés |
| `BEEHIVE_MINIO_USE_SSL` | `true` pour se connecter via HTTPS, `false` pour du HTTP simple |

:::tip Format de l'endpoint
Indiquez `BEEHIVE_MINIO_ENDPOINT` comme un hôte, éventuellement avec un port, par exemple
`minio.example.com` ou `minio.example.com:9000`. N'incluez pas `https://`.
Contrôlez plutôt le schéma avec `BEEHIVE_MINIO_USE_SSL`.
:::

### Créer le bucket

Le serveur s'attend à ce que le bucket nommé dans `BEEHIVE_MINIO_BUCKET` existe. Créez-le une fois
avant de démarrer Openbeehive.

Avec le client MinIO `mc` :

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

Ou avec l'AWS CLI sur n'importe quel endpoint compatible S3 :

```bash
aws --endpoint-url https://minio.example.com:9000 \
  s3 mb s3://openbeehive
```

Sur Amazon S3 lui-même, vous pouvez créer le bucket depuis la console AWS ou avec la
commande ci-dessus (en omettant `--endpoint-url`).

:::caution Gardez le bucket privé
Les blobs peuvent contenir des photos identifiantes de vos ruchers. Ne rendez pas le bucket
accessible publiquement en lecture. Openbeehive sert les images via l'API, donc le stockage
objet n'a pas besoin d'un accès public.
:::

## Compatibilité S3

Le backend MinIO parle l'API S3 standard, il fonctionne donc avec n'importe quel
fournisseur compatible S3, pas seulement MinIO. Cela inclut :

- **MinIO** (stockage objet auto-hébergé)
- **Amazon S3**
- D'autres services compatibles S3 (par exemple l'endpoint S3 de Backblaze B2,
  Cloudflare R2, Wasabi, ou Ceph RADOS Gateway)

Pour ceux-ci, pointez `BEEHIVE_MINIO_ENDPOINT` vers l'endpoint S3 du fournisseur, définissez les clés
d'accès et secrète, choisissez votre bucket et définissez `BEEHIVE_MINIO_USE_SSL=true`.

| Fournisseur | Exemple d'endpoint |
| --- | --- |
| Amazon S3 | `s3.amazonaws.com` |
| Cloudflare R2 | `<account-id>.r2.cloudflarestorage.com` |
| Backblaze B2 | `s3.<region>.backblazeb2.com` |
| MinIO (auto-hébergé) | `minio.example.com:9000` |

:::note Régions et adressage
Certains fournisseurs sont sensibles aux paramètres de région ou exigent un adressage de type
path-style plutôt que virtual-hosted. Si les téléversements échouent avec un fournisseur autre que MinIO,
vérifiez bien l'endpoint et que le bucket existe dans la région attendue.
Voir [Dépannage](/knowledge-base/troubleshooting) si les problèmes persistent.
:::

## Changer de backend plus tard

Si vous démarrez sur le système de fichiers et passez plus tard au stockage objet, les photos existantes
ne sont pas migrées automatiquement. Prévoyez de copier le contenu de `BEEHIVE_BLOB_DIR` dans votre
bucket (par exemple avec `mc cp --recursive` ou `aws s3 sync`) avant de changer
`BEEHIVE_BLOB_BACKEND`, afin que les anciennes photos de visite restent disponibles.

## Voir aussi

- [Configuration](/self-hosting/configuration) — liste complète des variables d'environnement
- [Bases de données](/self-hosting/databases) — choisir et configurer la base de données
- [Sauvegardes](/self-hosting/backups) — protéger à la fois les enregistrements et les blobs

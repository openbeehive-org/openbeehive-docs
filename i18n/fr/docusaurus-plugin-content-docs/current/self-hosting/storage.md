---
sidebar_position: 6
title: "Stockage de blobs"
---

# Stockage de blobs

Openbeehive stocke vos enregistrements dans une base de données, mais les images en taille réelle des photos résident séparément dans le **stockage de blobs**. Cela garde la base de données légère et vous permet de faire évoluer le stockage des images indépendamment.

Une photo se compose de deux parties. Son enregistrement, avec une petite miniature d'environ 200 pixels, est stocké dans la base de données et se synchronise sur chaque appareil comme n'importe quel autre enregistrement. Son image en taille réelle (au plus 2048 pixels sur le grand côté et 5 Mio) est stockée dans le stockage de blobs, sous un préfixe propre à chaque espace (`<workspace>/photos/...`). Le serveur ne la sert qu'aux membres connectés de cet espace, via `/photos/<id>` ; le stockage de blobs lui-même n'est jamais exposé. Supprimer une photo supprime son image, et supprimer un espace supprime tout ce qui se trouve sous son préfixe.

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

Donnez aux blobs un répertoire qui leur est propre. L'entretien du serveur liste et supprime les fichiers qui s'y trouvent ; avec SQLite, le serveur refuse donc de démarrer lorsque `BEEHIVE_BLOB_DIR` contient le fichier de la base de données, et indique un répertoire à utiliser à la place.

Le serveur ne sert pas lui-même ce répertoire, et rien d'autre ne doit le faire : les images n'atteignent l'application que par l'endpoint authentifié `/photos/`. Jusqu'à la 0.4.x, le serveur publiait le répertoire sous `/files/` et lisait `BEEHIVE_BLOB_PUBLIC_URL` ; les deux ont disparu (le serveur émet un avertissement au démarrage si le paramètre est encore présent).

Le serveur crée le répertoire s'il n'existe pas, mais assurez-vous que le processus
le possède et peut y écrire.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution[Sauvegardez-le]
Le répertoire de blobs n'est **pas** stocké dans votre base de données. Une sauvegarde de la base de données seule
ne sauvegardera pas vos photos. Une sauvegarde, c'est la base de données plus `BEEHIVE_BLOB_DIR`, et les deux se restaurent ensemble. Voir
[Sauvegardes](./backups.md).
:::

### Note Docker

Si vous exécutez l'[image Docker](./docker.md), montez un volume pour que les blobs
survivent aux redémarrages et mises à niveau de conteneurs. Le conteneur s'exécute sous l'uid `65532` ;
un répertoire de l'hôte monté en bind mount doit appartenir à cet utilisateur :

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

:::tip[Format de l'endpoint]
Indiquez `BEEHIVE_MINIO_ENDPOINT` comme un hôte, éventuellement avec un port, par exemple
`minio.example.com` ou `minio.example.com:9000`. N'incluez pas `https://`.
Contrôlez plutôt le schéma avec `BEEHIVE_MINIO_USE_SSL`.
:::

### Le bucket

Au démarrage, le serveur vérifie si le bucket nommé dans `BEEHIVE_MINIO_BUCKET` existe et le crée sinon ; avec des identifiants autorisés à créer des buckets, il n'y a donc rien à préparer. Si vos identifiants sont restreints à un bucket existant, créez-le d'abord, par exemple avec le client MinIO :

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

:::caution[Gardez le bucket privé]
Les blobs peuvent contenir des photos identifiantes de vos ruchers. Ne rendez pas le bucket
accessible publiquement en lecture. Openbeehive ne sert les images qu'aux membres connectés de
l'espace, donc le stockage objet n'a besoin d'aucun accès public.
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

:::note[Régions et adressage]
Certains fournisseurs sont sensibles aux paramètres de région ou exigent un adressage de type
path-style plutôt que virtual-hosted. Si les téléversements échouent avec un fournisseur autre que MinIO,
vérifiez bien l'endpoint et que le bucket existe dans la région attendue.
Voir [Dépannage](../knowledge-base/troubleshooting.md) si les problèmes persistent.
:::

## Entretien \{#upkeep}

Le serveur fait lui-même le ménage dans le stockage de blobs ; il n'y a rien à planifier :

- L'image d'une photo supprimée est retirée peu après la suppression ; une image oubliée est retirée par le balayage suivant dès qu'elle a une heure.
- Les photos d'une visite ou d'une ruche supprimée depuis plus d'une heure sont supprimées elles aussi.
- Toutes les six heures, un balayage retire les images qu'aucun enregistrement de photo ne connaît (par exemple un téléversement dont l'enregistrement n'est jamais arrivé, ou les images d'un espace supprimé) dès qu'elles ont plus de 30 jours ou plus de `BEEHIVE_CHANGELOG_RETENTION_DAYS`, la plus longue des deux durées étant retenue. Après une restauration de la base de données, les appareils renvoient les enregistrements des photos plus récentes lors de leur prochaine synchronisation, ce qui peut arriver des semaines plus tard, et leurs images doivent alors encore être là.
- Le balayage du démarrage ne retire rien : il se contente de rendre leurs images aux enregistrements de photos qui les ont perdues, comme après une restauration.
- Seules les clés de la forme que le serveur construit pour les photos sont touchées ; les autres fichiers du bucket ou du répertoire ne sont pas modifiés.

Cela suppose une seule instance du serveur : exécutez-en exactement une par base de données.

## Photos de la 0.4.x \{#inline-photos}

Jusqu'à la 0.4.x, l'application stockait les photos directement dans la base de données, sous forme de data URL dans les lignes des visites et des ruches. Au premier démarrage de la 0.5.0, le serveur convertit chaque photo intégrée visible en un enregistrement de photo dont l'image est placée dans le stockage de blobs, avant d'accepter des requêtes. Sur une base contenant beaucoup de photos, cela peut prendre quelques minutes. Le journal indique quand elle commence, et le serveur n'écoute, `/healthz` compris, qu'une fois qu'elle est terminée ; laissez donc suffisamment de temps aux contrôles de santé : les fichiers Compose accordent dix minutes (`start_period: 10m`). Une conversion interrompue reprend au démarrage suivant.

Les applications 0.4.x déjà installées continuent de fonctionner : le serveur accepte et sert toujours les photos intégrées pour elles, et convertit ce qu'elles téléversent. Elles ne voient pas les photos ajoutées par les appareils mis à jour.

## Changer de backend plus tard

Si vous démarrez sur le système de fichiers et passez plus tard au stockage objet, les photos existantes
ne sont pas migrées automatiquement. Prévoyez de copier le contenu de `BEEHIVE_BLOB_DIR` dans votre
bucket (par exemple avec `mc cp --recursive` ou `aws s3 sync`) avant de changer
`BEEHIVE_BLOB_BACKEND`, afin que les anciennes photos de visite restent disponibles.

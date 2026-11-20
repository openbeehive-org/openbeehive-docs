---
sidebar_position: 9
title: "Sauvegardes et restauration"
---

# Sauvegardes et restauration

Quelques minutes passées à configurer les sauvegardes maintenant vous épargneront beaucoup de soucis plus tard. Cette page couvre ce qu'il faut sauvegarder, comment le faire en toute sécurité, et comment restaurer le moment venu.

:::tip Le serveur est la source de vérité
Chaque appareil qui utilise votre instance conserve une copie locale de ses données dans le navigateur. Cette copie est une commodité, pas une sauvegarde : elle peut être effacée en vidant les données du site, en réinstallant, ou en perdant l'appareil.

Pour tout ce qui est partagé entre personnes ou appareils, le **serveur** est la copie de référence. Sauvegardez le serveur, et vous protégez les enregistrements de tous d'un seul coup.
:::

## Quoi sauvegarder

Il y a deux choses sur le serveur qui valent la peine d'être protégées :

| Élément | Où il réside | Cible de sauvegarde |
| --- | --- | --- |
| La base de données | Fichier SQLite, ou PostgreSQL/MariaDB | Une copie cohérente ou un dump |
| Les blobs (images des photos en taille réelle) | Système de fichiers local, ou MinIO/S3 | Le répertoire de blobs ou le bucket |

La base de données et le stockage de blobs dont vous disposez dépendent de votre profil de déploiement :

- **`selfhost`** utilise un seul fichier SQLite et un répertoire de blobs local (`BEEHIVE_BLOB_DIR`, par défaut `./data/blobs`).
- **`cloud`** utilise Postgres et un bucket MinIO/S3.

Sauvegardez **à la fois** la base de données et les blobs. La base de données contient vos ruchers, ruches, reines, visites, événements ainsi que les enregistrements de photos avec leurs miniatures ; le stockage de blobs contient les images en taille réelle. Une sauvegarde de la base de données sans ses blobs laisse des photos dont on ne voit plus que la miniature.

:::tip D'abord la base de données, puis les blobs
Si vous sauvegardez pendant que le serveur fonctionne, copiez d'abord la base de données, puis les blobs juste après. Les images sont écrites une fois et jamais modifiées, donc une copie des blobs prise plus tard contient toutes les images que connaît la copie de la base. Les images en trop, inconnues de la base restaurée, sont retirées par l'[entretien](./storage.md#upkeep) du serveur.
:::

## Sauvegarder SQLite (selfhost)

SQLite stocke vos données dans un seul fichier (par exemple `openbeehive.db`) plus deux fichiers compagnons lorsque la journalisation en écriture anticipée est activée :

- `openbeehive.db-wal` : les changements récents pas encore intégrés au fichier principal
- `openbeehive.db-shm` : l'index en mémoire partagée pour le WAL

:::caution Ne copiez pas le fichier `.db` seul pendant que le serveur fonctionne
Avec le WAL activé (le paramètre recommandé), les données les plus récentes peuvent encore se trouver dans le fichier `-wal`. Un simple `cp openbeehive.db backup.db` d'une base de données en cours d'exécution peut produire une copie incohérente ou obsolète.
:::

Vous avez deux options sûres.

### Option A : arrêter le service, puis copier

La méthode fiable la plus simple. Arrêtez Openbeehive pour que rien n'écrive, copiez les trois fichiers ensemble, puis redémarrez-le.

```bash
systemctl stop openbeehive

cp openbeehive.db     /backups/openbeehive.db
cp openbeehive.db-wal /backups/openbeehive.db-wal 2>/dev/null || true
cp openbeehive.db-shm /backups/openbeehive.db-shm 2>/dev/null || true

systemctl start openbeehive
```

Les fichiers `-wal` et `-shm` peuvent ne pas exister si la base de données vient d'être checkpointée, c'est normal, d'où le `|| true`.

### Option B : sauvegarde à chaud sûre pour le WAL (sans interruption)

L'outil en ligne de commande de SQLite peut prendre un instantané cohérent pendant que le serveur continue de fonctionner, en utilisant l'API de sauvegarde intégrée :

```bash
sqlite3 openbeehive.db ".backup '/backups/openbeehive.db'"
```

Cela écrit un seul fichier `.db` autonome qui inclut déjà tout ce qui provient du WAL, donc vous n'avez **pas** besoin de copier les fichiers `-wal` ou `-shm` à côté. C'est l'approche recommandée pour les sauvegardes sans surveillance.

## Sauvegarder Postgres (cloud)

Utilisez `pg_dump` pour produire un dump logique. Il est cohérent sans arrêter le service.

```bash
pg_dump "postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  --format=custom \
  --file=/backups/openbeehive-$(date +%F).dump
```

Le format custom se compresse bien et se restaure avec `pg_restore`. Pour MariaDB, l'équivalent est `mariadb-dump --single-transaction`.

## Sauvegarder les blobs

### Système de fichiers local

Copiez le répertoire de blobs. Les fichiers ici sont écrits une fois et non modifiés sur place, donc une copie récursive est sûre même pendant que le serveur fonctionne (les photos supprimées en disparaissent, d'où `--delete`) :

```bash
rsync -a --delete ./data/blobs/ /backups/blobs/
```

### MinIO / S3

Mirorez le bucket avec le client MinIO ou l'AWS CLI :

```bash
mc mirror --overwrite myminio/openbeehive /backups/blobs/
# or
aws s3 sync s3://openbeehive /backups/blobs/
```

Si vous utilisez un stockage compatible S3 managé, vous pouvez aussi compter sur ses propres politiques de versioning ou de cycle de vie comme deuxième ligne de défense.

## Restaurer \{#restoring}

Une restauration suit toujours les trois mêmes étapes : **arrêter** le serveur, restaurer **ensemble la base de données et les blobs** à partir de la même sauvegarde, **démarrer** le serveur. Ne laissez pas le serveur répondre à des requêtes entre-temps : il doit démarrer sur la base restaurée avant qu'un appareil ne se synchronise, car c'est à ce démarrage qu'il reconnaît la restauration (voir [après une restauration](#after-a-restore)).

### SQLite

```bash
systemctl stop openbeehive

cp /backups/openbeehive.db ./openbeehive.db
rm -f ./openbeehive.db-wal ./openbeehive.db-shm   # let SQLite rebuild these
rsync -a --delete /backups/blobs/ ./data/blobs/

systemctl start openbeehive
```

Supprimez tout fichier `-wal`/`-shm` obsolète avant de démarrer, afin que SQLite s'ouvre proprement à partir du fichier restauré.

### Postgres

```bash
systemctl stop openbeehive

pg_restore --clean --if-exists \
  --dbname="postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  /backups/openbeehive-2026-06-19.dump
mc mirror --overwrite --remove /backups/blobs/ myminio/openbeehive   # blob directory: rsync as above

systemctl start openbeehive
```

Avec Docker Compose, `docker compose stop server` et `docker compose start server` remplacent `systemctl`.

### Ce que font les appareils après une restauration \{#after-a-restore}

Une base de données restaurée est plus ancienne que ce que certains appareils ont déjà vu. Le serveur s'en aperçoit à la synchronisation suivante de chaque appareil, et l'application répare la situation d'elle-même :

- **Les applications à jour (0.5.0 et ultérieures) qui s'étaient synchronisées au-delà de la sauvegarde** renvoient tous les enregistrements qu'elles détiennent, avec les images de photos qu'elles conservent encore, puis chargent les données actuelles depuis le serveur. Les changements perdus par la sauvegarde reviennent ainsi ; là où le serveur possède encore un changement, rien ne se passe. L'application affiche « Les données du serveur ont été réinitialisées ou restaurées. Cet appareil a renvoyé ses enregistrements et chargé les données actuelles. »
- **Les appareils qui ne s'étaient pas synchronisés au-delà de la sauvegarde** continuent comme d'habitude.
- **Les applications 0.4.x installées** ne reçoivent pas ce signal et ne renvoient rien. Celle dont la position se situe au-delà de la base restaurée relit les données depuis le début. Ce que seul un tel appareil détenait n'est pas restauré : mettez donc l'application à jour sur chaque appareil avant de compter sur ce mécanisme.

Les changements faits sur un appareil pendant que le serveur était arrêté sont envoyés normalement dès son retour.

## Un planning cron simple

Une tâche nocturne qui prend un instantané de la base de données et mirore les blobs suffit à la plupart des auto-hébergeurs. Ajoutez ceci à votre crontab avec `crontab -e` :

```bash
# Nightly Openbeehive backup at 02:30
30 2 * * * sqlite3 /srv/openbeehive/openbeehive.db ".backup '/backups/openbeehive-$(date +\%F).db'" && rsync -a --delete /srv/openbeehive/data/blobs/ /backups/blobs/
```

Les caractères `%` doivent être échappés en `\%` dans la crontab. Pour Postgres, remplacez l'appel `sqlite3` par la commande `pg_dump` indiquée ci-dessus. La base de données est copiée en premier et les blobs juste après, comme recommandé plus haut.

## Les exports ne sont pas des sauvegardes du serveur

**Paramètres → Données & sauvegarde** dans l'application télécharge un espace en JSON, ou en ZIP avec les photos ; la copie du serveur est aussi disponible via `GET /export` (voir [Import et export](../using-the-app/import-export.md)). Un tel export est utile pour déplacer un espace ou garder votre propre copie, mais il ne contient qu'un seul espace, sans comptes, membres ni clés API. Pour une instance entière, sauvegardez la base de données et les blobs comme décrit ci-dessus.

:::tip Testez vos restaurations
Une sauvegarde que vous n'avez jamais restaurée n'est qu'un espoir. De temps en temps, restaurez dans un répertoire jetable ou une instance de test et confirmez que vous pouvez ouvrir l'application et voir vos ruches. Conservez au moins quelques jours de copies datées, et stockez-en une hors site (un disque externe ou un bucket distant).
:::

---
sidebar_position: 5
title: "Bases de données"
---

# Bases de données

Openbeehive stocke toutes ses données côté serveur dans une base de données relationnelle. Le backend est agnostique vis-à-vis de la base de données : il communique avec une couche de stockage modulaire et fournit des pilotes pour **SQLite**, **PostgreSQL** et **MariaDB**. Vous choisissez celle à utiliser avec deux variables d'environnement.

Les trois sont testées à chaque modification : SQLite, PostgreSQL 18 et MariaDB 13.0.2. Le pilote `mysql` désigne MariaDB ; Oracle MySQL 8 devrait fonctionner mais ne fait pas partie des tests.

Cette page explique comment choisir la bonne base de données pour votre situation et comment la configurer correctement.

:::note[Où résident les données hors ligne ?]
L'application sur votre téléphone ou votre ordinateur portable conserve sa propre base de données SQLite-WASM locale et fonctionne entièrement hors ligne. La base de données serveur décrite ici est la copie centrale vers laquelle les appareils se synchronisent en arrière-plan. Ce sont des stockages distincts ; cette page ne concerne que le serveur.
:::

## Les deux paramètres

Chaque base de données se configure via la même paire de variables :

| Variable | Rôle |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Quel moteur utiliser : `sqlite`, `postgres` ou `mysql` (MariaDB). |
| `BEEHIVE_DATABASE_DSN` | La chaîne de connexion (Data Source Name) pour ce moteur. |

Le profil de déploiement `selfhost` s'appuie par défaut sur SQLite, et le profil `cloud` sur PostgreSQL. Vous pouvez remplacer l'un ou l'autre en définissant explicitement ces deux variables. Voir [Configuration](./configuration.md) pour la liste complète des variables d'environnement.

## Quelle base de données choisir ?

| Situation | Recommandé |
| --- | --- |
| Apiculteur seul, un serveur, la configuration la plus simple possible | **SQLite** |
| Quelques membres du foyer partageant des ruchers | SQLite ou PostgreSQL |
| Nombreux utilisateurs, synchronisation concurrente intensive, ou déploiement hébergé/cloud | **PostgreSQL** |
| Vous exécutez déjà MariaDB et voulez une chose de moins à gérer | **MariaDB** |

:::tip[En bref]
Dans le doute, utilisez SQLite. Elle ne nécessite aucun service séparé, tient dans un seul fichier, et est parfaitement capable de faire tourner une ruche personnelle ou familiale. Passez à PostgreSQL lorsque vous avez une véritable concurrence multi-utilisateurs ou que vous voulez un hébergement cloud managé.
:::

## SQLite (par défaut pour l'auto-hébergement)

SQLite est le choix sans dépendances. Il n'y a aucun serveur de base de données à installer ou à gérer : vos données résident dans un seul fichier sur le disque, ce qui rend les [sauvegardes](./backups.md) aussi simples que de copier ce fichier.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
```

C'est la valeur par défaut du profil `selfhost`. La partie `_pragma=journal_mode(WAL)` active la **journalisation en écriture anticipée (Write-Ahead Logging)**. Le WAL permet aux lecteurs et à un rédacteur de travailler en même temps sans se bloquer mutuellement, ce qui améliore nettement le comportement lorsque plusieurs appareils se synchronisent en même temps. Nous recommandons vivement de le laisser activé.

Les deux pragmas (séparés par `&`) :

- `journal_mode(WAL)` — lectures concurrentes en parallèle d'un rédacteur.
- `busy_timeout(5000)` — attendre jusqu'à 5 secondes pour un verrou au lieu d'échouer immédiatement.

Vous pouvez utiliser un chemin relatif (résolu par rapport au répertoire de travail du serveur) ou un chemin absolu tel que `file:/var/lib/openbeehive/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)`.

:::caution[Le WAL crée des fichiers supplémentaires]
En mode WAL, SQLite conserve des fichiers compagnons à côté de la base de données principale (`openbeehive.db-wal` et `openbeehive.db-shm`). Lors d'une sauvegarde par copie de fichier, arrêtez d'abord le serveur, ou utilisez les outils de sauvegarde propres à SQLite, afin de capturer un instantané cohérent. Voir [Sauvegardes](./backups.md).
:::

## PostgreSQL

PostgreSQL est le bon choix pour les configurations multi-utilisateurs, le service hébergé, et tout déploiement où de nombreux appareils se synchronisent de façon concurrente. C'est aussi la valeur par défaut du profil `cloud`.

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://user:pass@host:5432/db?sslmode=disable
```

Un exemple plus réaliste pointant vers une base de données nommée `openbeehive` :

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:secret@db.example.com:5432/openbeehive?sslmode=require
```

Le paramètre `sslmode` contrôle la sécurité du transport :

| Valeur | Signification |
| --- | --- |
| `disable` | Pas de TLS. Convient pour une base de données sur le même hôte ou un réseau privé de confiance. |
| `require` | Chiffrer la connexion (sans vérification de certificat). |
| `verify-full` | Chiffrer et vérifier le certificat du serveur et le nom d'hôte. Le plus robuste. |

:::caution[Sécurité en production]
Utilisez `sslmode=require` ou plus strict chaque fois que la base de données communique avec le serveur sur un réseau que vous ne contrôlez pas entièrement. Réservez `sslmode=disable` aux connexions purement locales.
:::

Créez la base de données et l'utilisateur avant le premier démarrage, par exemple :

```sql
CREATE DATABASE openbeehive;
CREATE USER openbeehive WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE openbeehive TO openbeehive;
```

## MariaDB

MariaDB est prise en charge pour ceux qui en exploitent déjà une. Sélectionnez-la avec le pilote `mysql`. Le format du DSN diffère de PostgreSQL : il utilise la syntaxe du pilote Go MySQL.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive
```

Le serveur active `parseTime` de lui-même, il n'a donc pas besoin de figurer dans le DSN.

Donnez à Openbeehive une base de données qui lui est propre et un utilisateur autorisé à modifier ses tables :

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

- **L'utilisateur a besoin de `ALTER`** (inclus dans `ALL PRIVILEGES`). Les migrations modifient les tables, et au premier démarrage le serveur convertit ses tables vers une collation `utf8mb4` binaire afin que le texte se compare octet par octet, comme sur SQLite et PostgreSQL.
- **Utilisez une base de données dédiée.** Ne la partagez pas avec une autre application.
- **Laissez `max_allowed_packet` à 16 MiB ou plus** (la valeur par défaut de MariaDB). Le serveur accepte des requêtes allant jusqu'à 16 MiB.

## Les migrations s'exécutent automatiquement

Vous n'exécutez pas les migrations à la main. À chaque démarrage, le serveur vérifie le schéma et applique toutes les migrations en attente avant de commencer à servir les requêtes. Une base de données fraîche et vide est configurée automatiquement au premier lancement.

Le SQL est écrit de façon portable afin que le même schéma fonctionne sur les trois moteurs ; il n'y a aucune configuration spécifique au moteur au-delà de la création de la base de données et de l'utilisateur indiqués ci-dessus.

Sur MariaDB, une migration qui échoue à mi-chemin ne peut pas être annulée, car MariaDB valide immédiatement chaque modification de schéma. Restaurez la sauvegarde avant de réessayer.

:::tip[Sauvegardez toujours avant de mettre à niveau]
Comme une nouvelle version peut inclure des migrations qui modifient le schéma, faites une sauvegarde avant de mettre à niveau. Voir [Mise à niveau](./upgrading.md) et [Sauvegardes](./backups.md).
:::

## Changer de base de données plus tard

Les pilotes ne sont pas interchangeables au niveau des données : faire pointer `BEEHIVE_DATABASE_DRIVER` vers un autre moteur ne déplace **pas** vos enregistrements d'un moteur à l'autre. Pour migrer, par exemple, de SQLite vers PostgreSQL, vous devriez exporter puis réimporter vos données. Pour la plupart des auto-hébergeurs, le chemin le plus simple est de choisir la bonne base de données dès le départ.

Si vous n'avez besoin que d'un serveur central pour vous-même, SQLite vous servira très bien pendant longtemps.

Pour en savoir plus sur la configuration environnante, voir [Auto-hébergement](/category/self-hosting) et [Stockage](./storage.md).

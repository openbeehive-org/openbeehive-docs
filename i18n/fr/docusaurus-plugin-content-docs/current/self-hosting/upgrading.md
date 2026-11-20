---
sidebar_position: 10
title: "Mise à niveau"
---

# Mise à niveau

Les mises à niveau sont simples : remplacez le binaire ou récupérez une nouvelle image, redémarrez, et le serveur met le schéma de la base de données à jour de lui-même.

:::caution Sauvegardez d'abord, à chaque fois
Faites une sauvegarde avant de mettre à niveau. Voir [Sauvegardes](./backups.md).
:::

## Avant de commencer

1. **Lisez les notes de version.** Consultez le [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) et la [version GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) vers laquelle vous passez. Notez toute nouvelle configuration requise ou toute étape manuelle.
2. **Sauvegardez** la base de données et le stockage de blobs.
3. **Notez votre version actuelle** (le tag que vous avez compilé ou le tag d'image que vous exécutez) afin de savoir vers quoi revenir.
4. **Choisissez un moment calme.** Le redémarrage est court ; les appareils continuent de fonctionner localement et se synchronisent une fois le serveur de retour.

## Étapes propres à une version

### Mise à niveau vers la 0.5.0 \{#upgrading-to-050}

La 0.5.0 durcit plusieurs valeurs par défaut. Sauvegardez d'abord, puis parcourez cette liste ; lorsqu'un paramètre manque, le serveur s'arrête au démarrage et le nomme.

**Paramètres**

- **Secret de session.** Avec n'importe quelle méthode de connexion, `BEEHIVE_SESSION_SECRET` doit être défini et faire au moins 32 octets, sinon le serveur ne démarre pas. Générez-en un avec `openssl rand -base64 32` ; un nouveau secret déconnecte tout le monde.
- **`.env` est lu par le binaire.** Le serveur charge désormais `.env` depuis son répertoire de travail. Vérifiez qu'un ancien `.env` qui s'y trouve contient bien ce que vous voulez ; les véritables variables d'environnement l'emportent toujours.
- **CORS est limité à la même origine par défaut.** Si l'application est servie depuis une autre origine que l'API, listez-la dans `BEEHIVE_CORS_ALLOWED_ORIGINS`. `*` n'autorise plus les identifiants.
- **Sans connexion : uniquement les noms d'hôte connus.** Un serveur sans connexion ne répond qu'à `localhost`, aux adresses IP et à l'hôte de `BEEHIVE_PUBLIC_BASE_URL`. Placez les autres noms dans `BEEHIVE_ALLOWED_HOSTS`.
- **La vérification de l'e-mail nécessite un serveur de messagerie.** `BEEHIVE_EMAIL_VERIFICATION=true` requiert `BEEHIVE_SMTP_HOST`. Les liens ne sont plus écrits dans le journal ; sans SMTP, copiez les liens d'invitation depuis les Paramètres.
- **OIDC.** Un fournisseur listé dans `BEEHIVE_OIDC_PROVIDERS` sans émetteur ni identifiant client empêche le démarrage. Une connexion via un fournisseur n'est rattachée à un compte existant que lorsque les deux côtés ont vérifié l'adresse e-mail.
- **Reverse proxy.** Réglez `BEEHIVE_TRUST_PROXY_HEADERS=true` derrière votre proxy, sinon la limitation des tentatives de connexion compte tous les utilisateurs comme une seule adresse.
- **`BEEHIVE_NODE_ID`** vaut désormais par défaut un identifiant aléatoire à chaque démarrage ; retirez-le de votre configuration, sauf si vous le définissez à dessein. Les réglages inutilisés de taille de page de synchronisation ont disparu.

**Fichiers Compose**

- `docker-compose.yml` est la pile de développement : il exige désormais `BEEHIVE_SESSION_SECRET` et `MINIO_ROOT_PASSWORD`, ne publie PostgreSQL et MinIO que sur `127.0.0.1`, et n'active OIDC que si vous le demandez.
- Pour exploiter Openbeehive, utilisez le nouveau `docker-compose.selfhost.yml` (un conteneur, SQLite) ou `docker-compose.prod.yml` (PostgreSQL et MinIO). `docker-compose.demo.yml` est la démo hébergée et publie sur `127.0.0.1` sauf si `BEEHIVE_BIND` est défini. Voir [Docker et Compose](./docker.md).

**Données**

- **Activer la connexion déplace les enregistrements mono-utilisateur.** Si l'instance fonctionnait sans connexion et que vous activez la connexion par e-mail/mot de passe, les enregistrements existants sont déplacés dans l'espace de l'administrateur de l'instance au démarrage suivant. Cela ne peut pas être annulé ; voir [Authentification](./authentication.md#single-user-to-login).
- **Migrations de la base de données.** Le premier démarrage reconstruit la table des visites et l'index du journal des modifications ; il prend donc plus de temps sur une grande base de données. Sur MariaDB, il convertit aussi les tables vers une collation binaire, et une migration qui y échoue ne peut pas être annulée : une sauvegarde est le seul moyen de revenir en arrière.
- **Exécutez exactement une instance du serveur** par base de données.

**Comportements que les utilisateurs et les scripts remarqueront**

- **Les invitations** expirent après 7 jours et ne fonctionnent que pour l'adresse e-mail invitée. Les invitations en attente plus anciennes doivent être émises de nouveau.
- **Limitation des tentatives de connexion.** Après 10 connexions échouées pour un compte ou 30 depuis une même adresse en 15 minutes, le serveur répond `429` avec `Retry-After`.
- **Limites.** Un message RPC peut peser au plus 16 MiB et une requête peut durer au plus 2 minutes (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`).
- **Horloges des appareils.** Les modifications horodatées plus de 10 minutes en avance sur l'heure du serveur sont refusées. Les applications mises à jour se corrigent d'elles-mêmes ; une application 0.4.x dont l'horloge est fausse perd ces modifications, mettez donc l'application à jour sur chaque appareil.
- **API.** Les appels de mise à jour ne modifient que les champs envoyés ; `DeleteApiary` échoue avec `failed_precondition` tant que le rucher contient des ruches ; les tâches personnelles ne sont renvoyées qu'à leur propriétaire ; les valeurs numériques de visite qui n'ont pas été saisies sont omises au lieu d'être renvoyées comme `0`. Les endpoints HTTP simples sous `/auth/` et `/tenants/` n'acceptent que la méthode documentée, exigent `Content-Type: application/json` lorsqu'ils prennent un corps, et `/tenants/delete` exige `org_id`. Voir [REST](../using-the-api/rest.md).

Les applications 0.4.x installées continuent de fonctionner avec un serveur 0.5.0. Après s'être mise à jour, l'application télécharge une nouvelle fois ses données sur chaque appareil.

### 0.4.0 : le conteneur s'exécute sous un utilisateur non privilégié

Jusqu'à la 0.3.1, l'image s'exécutait en root : un volume créé par un conteneur plus ancien appartient donc à root, et le serveur 0.4.0 (uid `65532`) ne peut pas y ouvrir la base de données. Corrigez le propriétaire une fois pour toutes, avant de démarrer la nouvelle image :

```bash
# named volume from the quick start
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

Le symptôme d'un chown oublié est `unable to open database file` ou `permission denied` dans le log du serveur juste après le démarrage. Les déploiements Kubernetes avec `securityContext.fsGroup: 65532` ne nécessitent aucune étape manuelle. Les volumes créés par la 0.4.0 ou une version ultérieure ont le bon propriétaire dès le départ.

Le profil cloud (Postgres et MinIO) n'est pas concerné : le conteneur serveur ne contient aucune donnée.

## Comment fonctionnent les migrations

Les migrations de schéma s'exécutent automatiquement au démarrage du serveur. Au démarrage, le serveur applique dans l'ordre toutes les migrations en attente, et ce n'est qu'ensuite qu'il commence à servir les requêtes. Cela fonctionne de la même manière pour PostgreSQL, MariaDB et SQLite.

:::note
Le premier lancement d'une nouvelle version peut prendre un peu plus de temps pendant la mise à jour du schéma. Surveillez les logs pour confirmer qu'il se termine avant d'y diriger du trafic.
:::

## Mettre à niveau le binaire unique

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp /opt/openbeehive/openbeehive /opt/openbeehive/openbeehive.bak
# (also back up the SQLite database and blob directory; see Backups)

# 3. Replace the binary with the new build, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Pour compiler la nouvelle version depuis les sources, basculez sur son tag et recompilez :

```bash
git fetch --tags
git checkout vX.Y.Z
make proto && make build
```

Cela produit un nouveau `./server/bin/openbeehive`. Les prérequis sont dans [Binaire unique](./single-binary.md) (Go 1.27+, Node 24+, buf).

## Mettre à niveau avec Docker

La commande nécessaire dépend de la provenance de l'image.

**Image publiée** (le `docker run` mono-conteneur du [démarrage rapide](./quick-start.md), ou un fichier Compose avec une ligne `image:` tel que `docker-compose.selfhost.yml` ou `docker-compose.prod.yml`). Les fichiers Compose épinglent une version par tag et par digest ; changez la ligne `image:` pour la version voulue (ou prenez le fichier de cette version), puis :

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f server
```

Pour un simple conteneur `docker run` : `docker pull ghcr.io/openbeehive-org/openbeehive-app:latest`, puis `docker rm -f openbeehive` et relancez la même commande `docker run`. Le volume nommé conserve vos données.

**Compilée depuis les sources** (le `docker-compose.yml` du dépôt a une section `build:`, donc `pull` ne fait rien pour lui) :

```bash
git pull
docker compose up -d --build
docker compose logs -f server
```

Les tags d'image sont `latest`, `X.Y` (dernier correctif d'une version mineure) et `X.Y.Z`. Pour des déploiements reproductibles, épinglez une version spécifique plutôt que `latest` :

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z
```

## Versionnage

Openbeehive suit le [versionnage sémantique](https://semver.org) : `MAJOR.MINOR.PATCH`.

| Partie | Signifie |
| --- | --- |
| MAJOR | Changements incompatibles ; lisez attentivement les notes de mise à niveau |
| MINOR | Nouvelles fonctionnalités, rétrocompatibles |
| PATCH | Corrections de bugs et correctifs de sécurité, rétrocompatibles |

:::caution La 0.x est un logiciel jeune
Tant qu'Openbeehive est dans la série `0.x`, les versions mineures peuvent inclure des changements qui nécessitent des étapes manuelles ou qui ne sont pas entièrement rétrocompatibles. Lisez les notes de version pour chaque mise à niveau, et gardez vos sauvegardes à portée de main.
:::

## Revenir en arrière

Un schéma plus récent peut ne pas être lisible par un binaire plus ancien. Une fois les migrations exécutées, rétrograder seulement l'application n'est pas garanti de fonctionner. Restaurez l'application *et* la base de données d'avant la mise à niveau :

1. Arrêtez le service.
2. Restaurez la base de données (et, le cas échéant, le stockage de blobs) à partir de la sauvegarde que vous avez prise avant la mise à niveau.
3. Réinstallez la version précédente du binaire ou de l'image.
4. Démarrez le service et confirmez qu'il démarre proprement.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit the compose file back to the previous tag, e.g. X.Y.Z
docker compose up -d
```

:::danger
Ne restaurez pas une ancienne base de données sous un binaire plus récent, et n'exécutez pas une base de données plus récente sous un binaire plus ancien, sauf pour la paire appariée que vous avez sauvegardée ensemble. Restaurez toujours le binaire et la base de données comme un ensemble.
:::

## Après la mise à niveau

- Vérifiez les logs pour détecter des erreurs ou des avertissements de migration.
- Ouvrez l'application et confirmez que vos ruchers, ruches et visites récentes apparaissent.
- Enregistrez quelque chose sur un appareil et confirmez que cela se synchronise.

Si quelque chose semble anormal, voir [Dépannage](../knowledge-base/troubleshooting.md) et revenez à votre sauvegarde pendant que vous enquêtez.

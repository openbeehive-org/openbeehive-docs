---
sidebar_position: 10
title: "Mise à niveau"
---

# Mise à niveau

Les mises à niveau sont simples : remplacez le binaire ou récupérez une nouvelle image, redémarrez, et le serveur met le schéma de la base de données à jour de lui-même.

:::caution Sauvegardez d'abord, à chaque fois
Faites une sauvegarde avant de mettre à niveau. Voir [Sauvegardes](/self-hosting/backups).
:::

## Avant de commencer

1. **Lisez les notes de version.** Consultez le [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) et la [version GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) vers laquelle vous passez. Notez toute nouvelle configuration requise ou toute étape manuelle.
2. **Sauvegardez** la base de données et le stockage de blobs.
3. **Notez votre version actuelle** (le tag que vous avez compilé ou le tag d'image que vous exécutez) afin de savoir vers quoi revenir.
4. **Choisissez un moment calme.** Le redémarrage est court ; les appareils continuent de fonctionner localement et se synchronisent une fois le serveur de retour.

## Étapes propres à une version

### 0.4.0 : le conteneur s'exécute sous un utilisateur non privilégié

Jusqu'à la 0.3.1, l'image s'exécutait en root : un volume créé par un conteneur plus ancien appartient donc à root, et le serveur 0.4.0 (uid `65532`) ne peut pas y ouvrir la base de données. Corrigez le propriétaire une fois pour toutes, avant de démarrer la nouvelle image :

```bash
# named volume from the quick start or docker-compose.demo.yml
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

Le symptôme d'un chown oublié est `unable to open database file` ou `permission denied` dans le log du serveur juste après le démarrage. Les déploiements Kubernetes avec `securityContext.fsGroup: 65532` ne nécessitent aucune étape manuelle. Les volumes créés par la 0.4.0 ou une version ultérieure ont le bon propriétaire dès le départ.

Le profil cloud (Postgres et MinIO) n'est pas concerné : le conteneur serveur ne contient aucune donnée.

## Comment fonctionnent les migrations

Les migrations de schéma s'exécutent automatiquement au démarrage du serveur. Au démarrage, le serveur applique dans l'ordre toutes les migrations en attente, et ce n'est qu'ensuite qu'il commence à servir les requêtes. Cela fonctionne de la même manière pour PostgreSQL, MySQL et SQLite.

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

Cela produit un nouveau `./server/bin/openbeehive`. Les prérequis sont dans [Binaire unique](/self-hosting/single-binary) (Go 1.27+, Node 24+, buf).

## Mettre à niveau avec Docker

La commande nécessaire dépend de la provenance de l'image.

**Image publiée** (le `docker run` mono-conteneur du [démarrage rapide](/self-hosting/quick-start), ou un fichier Compose avec une ligne `image:` tel que `docker-compose.demo.yml`) :

```bash
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml logs -f server
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

Si quelque chose semble anormal, voir [Dépannage](/knowledge-base/troubleshooting) et revenez à votre sauvegarde pendant que vous enquêtez.

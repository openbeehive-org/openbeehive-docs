---
sidebar_position: 10
title: "Mise à niveau"
---

# Mise à niveau

Garder votre instance Openbeehive à jour vous apporte de nouvelles fonctionnalités, des correctifs et des correctifs de sécurité. Les mises à niveau sont volontairement simples : remplacez le binaire ou récupérez une nouvelle image, redémarrez, et le serveur met votre base de données à jour de lui-même.

Cette page couvre la routine de mise à niveau sûre, la numérotation des versions, et comment revenir en arrière si quelque chose tourne mal.

:::caution Sauvegardez d'abord, à chaque fois
Faites toujours une sauvegarde avant de mettre à niveau. Cela ne prend qu'un instant et c'est la seule chose qui transforme une mauvaise mise à niveau en non-événement. Voir [Sauvegardes](/self-hosting/backups) pour savoir comment prendre un instantané de votre base de données et de votre stockage de blobs.
:::

## Avant de commencer

Une bonne mise à niveau prend cinq minutes et un peu de lecture :

1. **Lisez les notes de version.** Consultez le [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app) et la version GitHub vers laquelle vous passez. Notez tout changement incompatible, toute nouvelle configuration requise, ou toute étape manuelle.
2. **Sauvegardez** votre base de données et votre stockage de blobs.
3. **Notez votre version actuelle** afin de savoir vers quoi revenir si nécessaire.
4. **Choisissez un moment calme.** Les mises à niveau impliquent un court redémarrage. Comme l'application est hors-ligne d'abord, quiconque l'utilise continue de travailler localement et se synchronise une fois le serveur de retour.

## Comment fonctionnent les migrations

Les migrations de schéma de base de données s'exécutent **automatiquement** au démarrage du serveur. Il n'y a pas de commande de migration distincte à retenir.

Au démarrage, le serveur vérifie la version du schéma enregistrée dans votre base de données, applique dans l'ordre toutes les migrations en attente, et ce n'est qu'ensuite qu'il commence à servir les requêtes. Cela fonctionne de la même manière sur tous les pilotes pris en charge (PostgreSQL, MySQL et SQLite).

:::note
Comme les migrations s'exécutent au démarrage, le tout premier lancement d'une nouvelle version peut prendre un peu plus de temps que d'habitude pendant la mise à jour du schéma. Surveillez les logs pour confirmer qu'il se termine proprement avant d'y diriger du trafic.
:::

## Mettre à niveau le binaire unique

Si vous exécutez la build `selfhost` en un seul fichier, une mise à niveau est un échange de fichier.

```bash
# 1. Arrêter le service en cours d'exécution
sudo systemctl stop openbeehive

# 2. Sauvegarder le binaire et vos données
cp ./server/bin/openbeehive ./server/bin/openbeehive.bak
# (sauvegardez aussi votre base de données SQLite + le répertoire de blobs — voir Sauvegardes)

# 3. Remplacer le binaire par la nouvelle version, puis redémarrer
sudo systemctl start openbeehive

# 4. Vérifier les logs pour confirmer que les migrations se sont exécutées
sudo journalctl -u openbeehive -f
```

Vous compilez plutôt depuis les sources ? Récupérez le nouveau tag et recompilez :

```bash
git fetch --tags
git checkout v0.1.0
make proto && make build
```

Cela produit un nouveau `./server/bin/openbeehive`. Voir [Binaire unique](/self-hosting/single-binary) pour les prérequis de compilation complets (Go 1.25+, Node 22+, buf).

## Mettre à niveau avec Docker

Pour le profil `cloud` (ou tout déploiement Docker), récupérez la nouvelle image et recréez le conteneur.

```bash
# 1. Récupérer la nouvelle image
docker compose pull

# 2. Recréer les conteneurs avec la nouvelle image
docker compose up -d

# 3. Suivre les logs pour confirmer un démarrage propre et les migrations
docker compose logs -f openbeehive
```

L'image publiée est `ghcr.io/openbeehive-org/openbeehive-app:latest`. Pour des déploiements reproductibles, épinglez un tag de version spécifique plutôt que `latest`, afin de toujours savoir exactement ce qui tourne.

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:v0.1.0
```

Voir [Docker](/self-hosting/docker) pour la configuration Compose complète.

## Versionnage

Openbeehive suit le [versionnage sémantique](https://semver.org) : `MAJOR.MINOR.PATCH`.

| Partie | Exemple | Signifie |
| --- | --- | --- |
| MAJOR | `1.0.0` | Changements incompatibles ; lisez attentivement les notes de mise à niveau |
| MINOR | `0.2.0` | Nouvelles fonctionnalités, rétrocompatibles |
| PATCH | `0.1.1` | Corrections de bugs et correctifs de sécurité, rétrocompatibles |

La version actuelle est **v0.1.0**, la première version publique.

:::caution La v0.1.x est un logiciel jeune
Tant qu'Openbeehive est dans la série `0.x`, les versions mineures peuvent inclure des changements qui nécessitent des étapes manuelles ou qui ne sont pas entièrement rétrocompatibles. Lisez les notes de version pour chaque mise à niveau, pas seulement les majeures, et gardez vos sauvegardes à portée de main.
:::

## Revenir en arrière

Si une mise à niveau se comporte mal, revenez à la version d'où vous venez.

La règle importante : **un schéma plus récent peut ne pas être lisible par un binaire plus ancien.** Une fois les migrations exécutées, simplement rétrograder l'application n'est pas garanti de fonctionner. La façon fiable de revenir en arrière est de restaurer à la fois l'application *et* la base de données d'avant la mise à niveau.

1. Arrêtez le service.
2. Restaurez la base de données (et, le cas échéant, le stockage de blobs) à partir de la sauvegarde que vous avez prise avant la mise à niveau. Voir [Sauvegardes](/self-hosting/backups).
3. Réinstallez la version précédente du binaire ou de l'image.
4. Démarrez le service et confirmez qu'il démarre proprement.

```bash
# Exemple Docker : revenir à la version précédente
docker compose down
# modifiez votre fichier compose vers le tag précédent, par exemple v0.1.0
docker compose up -d
```

:::danger
Ne restaurez pas une ancienne base de données sous un binaire plus récent, et n'exécutez pas une base de données plus récente sous un binaire plus ancien, sauf pour la paire appariée que vous avez sauvegardée ensemble. Un schéma et un code incompatibles peuvent corrompre les données. Restaurez toujours le binaire et la base de données comme un ensemble.
:::

## Après la mise à niveau

- Vérifiez les logs pour détecter des erreurs ou des avertissements de migration.
- Ouvrez l'application et confirmez que vos ruchers, ruches et visites récentes apparaissent comme prévu.
- Déclenchez une synchronisation depuis un appareil client et confirmez que les changements circulent dans les deux sens.

Si quelque chose semble anormal, voir [Dépannage](/knowledge-base/troubleshooting), et n'hésitez pas à revenir à votre sauvegarde pendant que vous enquêtez.

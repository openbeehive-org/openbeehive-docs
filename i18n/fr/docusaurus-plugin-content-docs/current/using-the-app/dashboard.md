---
sidebar_position: 1
title: "Le tableau de bord"
---

# Le tableau de bord

La **Vue d'ensemble** est le premier écran après l'ouverture de l'application. Tout ce qu'elle affiche est lu depuis la base de données locale de votre appareil ; elle se charge donc instantanément, avec ou sans réseau.

Le bouton **+ Nouveau** dans l'en-tête ouvre un menu avec **Nouveau rucher**, **Nouvelle ruche** et **Nouvelle tâche** ; chacun vous amène à la liste correspondante, formulaire ouvert.

## Premiers pas

Tant que votre première visite n'est pas enregistrée, la Vue d'ensemble vous accueille avec « Bienvenue sur Openbeehive » et une liste de contrôle **Premiers pas** en trois étapes : **Créer un rucher**, **Ajouter une ruche**, **Enregistrer la première visite**. L'étape suivante est un lien vers le bon endroit ; les étapes terminées sont cochées. La liste disparaît une fois les trois étapes accomplies.

## Tuiles statistiques

| Tuile | Ce qu'elle indique |
| --- | --- |
| **Ruchers** | Nombre de ruchers dans l'espace actif. |
| **Ruches** | Nombre de ruches. |
| **Reines** | Reines actuellement enregistrées à la tête d'une colonie. |
| **Tâches ouvertes** | Tâches pas encore cochées. |
| **Miel cette saison** | Total des kilogrammes récoltés enregistrés dans l'année civile en cours. |

Les tuiles sont de simples compteurs ; utilisez la navigation pour ouvrir la section correspondante.

## Visites à effectuer

Liste jusqu'à cinq ruches, les plus longtemps non visitées en premier, avec le nombre de jours écoulés depuis la dernière visite de chacune (« aujourd'hui », ou « jamais » pour les ruches sans visite). Le badge est mis en évidence à partir de 21 jours, ou lorsqu'il n'y a aucune visite. Touchez une ruche pour l'ouvrir et enregistrer une visite.

Seules comptent les visites enregistrées par une personne. Les relevés envoyés par un capteur ou une balance via l'API ne font pas d'une ruche une ruche « visitée », et les colonies au statut **Perdue** ou **Dissoute** sont laissées de côté. Lorsqu'il n'y a aucune ruche, le panneau indique qu'il n'y a rien à prévoir.

Il n'y a pas d'intervalle configurable : la liste est triée selon le temps écoulé depuis la dernière visite enregistrée.

## Tâches à venir

Affiche jusqu'à cinq tâches ouvertes avec leur échéance. Les tâches dont l'échéance est dépassée sont marquées **En retard**. Touchez une tâche pour y accéder dans la vue **Tâches**, où vous la cochez ; voir [Tâches](./tasks.md).

## Se repérer dans l'application

Les mêmes destinations sont disponibles partout : **Vue d'ensemble, Ruchers, Scanner, Ruches, Tâches** et **Paramètres**.

- Sur un téléphone, une **barre d'onglets en bas** contient les six.
- Sur un ordinateur ou une tablette, une **barre latérale** à gauche liste Vue d'ensemble, Ruchers, Scanner, Ruches et Tâches, avec votre compte (e-mail et état de synchronisation) en bas, qui mène aux Paramètres.

## Paramètres

Les **Paramètres** contiennent :

- **Langue** : anglais, allemand, français, espagnol, italien. Le choix est enregistré sur l'appareil.
- **Apparence** : **Système** (suit le réglage clair ou sombre de l'appareil), **Clair** ou **Sombre**. Le choix est enregistré sur l'appareil.
- **Espaces** : basculer, créer, inviter et gérer (sur les instances avec connexion). Voir [Comptes et espaces](./accounts-tenants.md).
- **Passkeys** : ajouter ou supprimer des passkeys (lorsque le serveur les active).
- **Clés API** : créer et supprimer des clés pour les scripts et les appareils (sur les instances avec connexion). Voir [Comptes et espaces](./accounts-tenants.md#api-keys).
- **Données & sauvegarde** : export et import ; voir [Import et export](./import-export.md).
- **Compte** : l'identité avec laquelle vous êtes connecté, et **Se déconnecter**.

Sur une instance auto-hébergée mono-utilisateur sans connexion, il n'y a rien dont se déconnecter ; le bloc de compte affiche l'identité locale.

## L'état de synchronisation

Une pastille d'état en haut de la page et à côté de votre compte dans la barre latérale indique si vos modifications ont atteint le serveur (**Synchronisé**, **En attente d'envoi**, **Hors ligne**, **Problèmes de synchronisation**, etc.), et tant que vous êtes hors ligne, une barre en haut indique « Hors ligne : les modifications sont enregistrées et synchronisées plus tard. » Continuez à enregistrer exactement comme d'habitude ; la synchronisation reprend au retour de la connexion. Voir [Hors ligne et synchronisation](./offline-and-sync.md#sync-status).

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
| **Miel cette saison** | Total du miel récolté dans l'année civile en cours, en kilogrammes ou en livres selon le choix fait sous **Paramètres → Préférences → Unités**. |

Les tuiles sont de simples compteurs ; utilisez la navigation pour ouvrir la section correspondante.

## Visites à effectuer

Une ruche est à visiter 10 jours après sa dernière visite ; le panneau l'indique. Il liste jusqu'à cinq ruches à visiter, les plus longtemps non visitées en premier, avec le nombre de jours écoulés depuis la dernière visite de chacune (« jamais » pour les ruches sans visite). Le badge est mis en évidence à partir de 21 jours, ou lorsqu'il n'y a aucune visite. Touchez une ruche pour l'ouvrir et enregistrer une visite. Lorsque davantage de ruches sont à visiter, **Voir les N ruches à visiter** ouvre la liste des ruches triée par dernière visite.

Seules comptent les visites enregistrées par une personne. Les relevés envoyés par un capteur ou une balance via l'API ne font pas d'une ruche une ruche « visitée », et les colonies au statut **Perdue** ou **Dissoute** sont laissées de côté. Lorsqu'aucune ruche n'est à visiter, le panneau indique « Tout est à jour — bravo ! », et lorsqu'il n'y a aucune ruche, qu'il n'y a rien à prévoir.

L'intervalle de 10 jours est fixe dans l'application ; `GetDashboard` de l'API utilise la même valeur par défaut et accepte `thresholdDays` pour la modifier.

## Tâches à venir

Affiche jusqu'à cinq tâches ouvertes avec leur échéance. Les tâches dont l'échéance est dépassée sont marquées **En retard**. Touchez une tâche pour y accéder dans la vue **Tâches**, où vous la cochez ; voir [Tâches](./tasks.md).

## Se repérer dans l'application

Les mêmes destinations sont disponibles partout : **Vue d'ensemble, Ruchers, Scanner, Ruches, Tâches** et **Paramètres**.

- Sur un téléphone, une **barre d'onglets en bas** contient les six, avec des libellés courts adaptés aux écrans étroits.
- Sur un ordinateur ou une tablette, une **barre latérale** à gauche liste Vue d'ensemble, Ruchers, Scanner, Ruches et Tâches, avec votre compte (e-mail et état de synchronisation) en bas, qui mène aux Paramètres.

## Paramètres \{#settings}

Les **Paramètres** affichent un groupe parmi quatre à la fois ; les boutons en haut permettent de passer de l'un à l'autre.

**Préférences**

- **Langue** : anglais, allemand, français, espagnol ou italien. Le choix est enregistré avec votre compte et s'applique sur tous vos appareils.
- **Apparence** : **Système** (suit le réglage clair ou sombre de l'appareil), **Clair** ou **Sombre**. Le choix est enregistré sur cet appareil uniquement.
- **Unités** : **Poids** en kilogrammes ou en livres et **Température** en Celsius ou en Fahrenheit, pour afficher et saisir les valeurs. Le choix est enregistré avec votre compte et s'applique sur tous vos appareils et dans tous vos espaces. Tant que vous n'avez rien choisi, l'application utilise les unités métriques, sauf si votre navigateur est réglé sur la langue de l'application pour une région qui utilise les livres et les Fahrenheit (par exemple anglais, États-Unis). Les enregistrements sont toujours stockés en kilogrammes et en degrés Celsius, et les exports comme l'API restent en unités métriques ; voir [Visites](./inspections.md#units).

**Espace** (sur les instances avec connexion)

- **Espaces** : basculer, créer, inviter et gérer les membres. Voir [Comptes et espaces](./accounts-tenants.md).
- **Clés API** : créer et supprimer des clés pour les scripts et les appareils. Voir [Comptes et espaces](./accounts-tenants.md#api-keys).
- **Zone de danger** : supprimer l'espace (admins uniquement).

**Données et synchro**

- **Problèmes de synchronisation** : les modifications refusées par le serveur, avec **Réessayer** et **Abandonner**, et les modifications reçues qui n'ont pas pu être appliquées. Voir [Hors ligne et synchronisation](./offline-and-sync.md#sync-problems).
- **Données & sauvegarde** : sauvegardes, autres formats d'export, copie du serveur et import ; voir [Import et export](./import-export.md).
- **Registre des traitements** : imprimer le registre de tout l'espace, d'un rucher ou d'une année ; voir [Traitements](./treatments.md#treatment-register).

**Compte** (sur les instances avec connexion)

- **Compte** : l'identité avec laquelle vous êtes connecté, **Se déconnecter**, **Mot de passe** et **Se déconnecter partout**. Voir [Comptes et espaces](./accounts-tenants.md#password).
- **Passkeys** : ajouter ou supprimer des passkeys (lorsque le serveur les active).
- **Réinitialiser le mot de passe d’un utilisateur** : uniquement pour l'administrateur de l'instance ; voir [Authentification](../self-hosting/authentication.md#password-reset).
- **Supprimer le compte** : voir [Comptes et espaces](./accounts-tenants.md#delete-account).

Sur une instance auto-hébergée mono-utilisateur sans connexion, il n'y a pas de groupe Compte : **Préférences** affiche une note **Sans connexion** qui explique ce mode, et les unités et la langue sont conservées pour l'identité locale.

## L'état de synchronisation

Une pastille d'état en haut de la page et à côté de votre compte dans la barre latérale indique si vos modifications ont atteint le serveur (**Synchronisé**, **Modifications en attente d’envoi**, **Hors ligne**, **Problèmes de synchronisation**, etc.) ; touchez-la pour voir l'état de la synchronisation et **Synchroniser maintenant**. Tant que vous êtes hors ligne, une barre en haut indique « Hors ligne : les modifications sont enregistrées et synchronisées plus tard. » Continuez à enregistrer exactement comme d'habitude ; la synchronisation reprend au retour de la connexion. Voir [Hors ligne et synchronisation](./offline-and-sync.md#sync-status).

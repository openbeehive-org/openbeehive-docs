---
sidebar_position: 11
title: "Mode démo"
---

# Mode démo

Le mode démo installe un **compte et un espace de démonstration** prêts à
l'emploi afin que les visiteurs puissent essayer Openbeehive avec des données
réalistes, sans toucher aux vrais enregistrements de qui que ce soit. Il est
**désactivé par défaut** et destiné aux vitrines publiques et aux tests.

:::note[Vous cherchez la démo publique ?]
La démo du projet lui-même est le bouton **Essayer la démo** sur
[app.openbeehive.org/login](https://app.openbeehive.org/login). Il n'existe pas
de site de démo séparé. Cette page explique comment activer la démo sur votre
propre instance.
:::

## Ce qu'il met en place

Lorsqu'il est activé, Openbeehive crée :

- un compte de démonstration (`demo@app.openbeehive.org` / `demo` par défaut),
- un **espace** de démonstration avec **15 ruches réparties sur 4 ruchers**,
- une saison de données : reines, 105 visites (7 par ruche, réparties sur les dix
  derniers mois, avec température, humidité, varroa, poids et plus encore), une
  récolte de miel et deux traitements contre le varroa par ruche.

Les données sont **régénérées toutes les heures**, afin que la vitrine ait
toujours la même apparence. Les sessions de démo sont en lecture seule : le
serveur refuse toute modification du compte de démo, et l'application annule à
l'écran une modification refusée en affichant un message. Rien de ce que fait un
visiteur n'atteint le serveur ni les autres visiteurs.

L'écran de connexion reçoit un bouton **Essayer la démo** à côté de la connexion
normale ; il connecte le visiteur sans mot de passe.

Lorsqu'une personne est connectée au compte de démonstration, l'application
affiche une **bannière** indiquant que la démo est en lecture seule et que rien de
ce qu'elle modifie n'est enregistré. L'encadré de connexion dit la même chose, et
les formulaires d'enregistrement affichent une note et un bouton **Enregistrer**
désactivé. Supprimer, modifier les photos et cocher les tâches sont également désactivés.

## Activation

```bash
BEEHIVE_DEMO=true
```

C'est tout ce dont vous avez besoin. Activer le mode démo active automatiquement
la [connexion par e-mail/mot de passe](./authentication.md) afin que le
compte de démonstration puisse se connecter. Vous pouvez éventuellement remplacer
les identifiants :

```bash
BEEHIVE_DEMO_EMAIL=demo@app.openbeehive.org
BEEHIVE_DEMO_PASSWORD=demo
```

Redémarrez le serveur. Vous verrez une ligne de journal confirmant que la démo a
été installée, et le compte de démonstration peut se connecter immédiatement. Comme le mode
démo implique l'authentification par mot de passe, l'instance a aussi besoin de son
administrateur dédié (`BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD`, voir
[Authentification](./authentication.md)), et l'e-mail de l'administrateur doit
différer de celui de la démo. Comme toute méthode de connexion, il nécessite
`BEEHIVE_SESSION_SECRET`.

`docker-compose.demo.yml` dans le dépôt est le déploiement derrière
`app.openbeehive.org` (inscription sur invitation uniquement, plus la démo,
accessible par le bouton **Essayer la démo** de la page de connexion). Ce n'est pas un modèle pour votre propre serveur ; partez
de [`docker-compose.prod.yml`](./docker.md#several-users) et ajoutez `BEEHIVE_DEMO: "true"`
à l'environnement de son service `server` si vous voulez une démo.

### Hôtes de démonstration : sauter l'écran de connexion

Sur un hôte qui n'existe que pour montrer la démo, vous pouvez connecter les visiteurs
automatiquement :

```bash
BEEHIVE_DEMO_AUTOLOGIN=true
```

Les visiteurs anonymes arrivent directement dans l'espace de démonstration au lieu de
l'écran de connexion. Laissez cette option désactivée sur une instance qui sert aussi de vrais
utilisateurs, afin qu'ils obtiennent la page de connexion normale avec le bouton de démo.

## Comment il est isolé

- La démo réside dans son **propre espace** ; la réinitialisation horaire ne
  supprime et ne reconstruit que les données de **démo**, jamais celles des
  autres espaces.
- Les utilisateurs réels de la même instance ne sont pas affectés : ils ont leurs
  propres espaces.

:::caution
Le compte de démonstration est un véritable compte permettant de se connecter.
Sur une instance publique, choisissez un mot de passe de démo que vous êtes à
l'aise de partager, et ne le réutilisez pas ailleurs. Laissez
`BEEHIVE_DEMO=false` sur les instances privées qui n'ont pas besoin d'une
vitrine.
:::

## Désactivation

Définissez `BEEHIVE_DEMO=false` (ou supprimez-le) et redémarrez. Au démarrage,
le serveur verrouille alors le compte de démonstration : il supprime son mot de
passe, ses sessions, ses clés API et ses passkeys, de sorte que personne ne peut
s'y connecter, et l'e-mail de démo reste réservé et en lecture seule. Les données
de démo existantes restent jusqu'à ce que vous les supprimiez. Le compte et
l'espace de démonstration ont les identifiants internes `demo-user` /
`demo-tenant` si vous souhaitez les supprimer de la base de données.

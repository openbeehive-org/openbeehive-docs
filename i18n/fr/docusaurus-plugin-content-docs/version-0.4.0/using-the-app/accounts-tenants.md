---
sidebar_position: 13
title: "Comptes et espaces"
---

# Comptes et espaces

La façon dont vous vous connectez dépend de la configuration de l'instance. Une instance auto-hébergée individuelle peut ne nécessiter aucune connexion ; une instance partagée (comme le service hébergé) donne un compte à chacun et organise les ruchers en **espaces** (tenants) entre lesquels vous pouvez basculer.

## Se connecter

Selon l'instance, l'écran de connexion propose une ou plusieurs des options suivantes :

- **E-mail et mot de passe** : « Créer un compte » avec votre nom, votre e-mail et un mot de passe, puis « Se connecter ».
- **Un fournisseur** (Google, Keycloak, ...) : « Continuer avec ... ».
- **Une passkey** : « Se connecter avec une passkey » avec votre empreinte digitale, votre visage, le code PIN de votre appareil ou une clé de sécurité. Vous ajoutez des passkeys sous **Paramètres → Passkeys** une fois connecté.
- **La démo** : « Découvrir la démo » sur les instances qui en proposent une.

Sur une instance mono-utilisateur sans connexion configurée, l'application s'ouvre directement sur vos enregistrements.

Les méthodes sont liées à un seul compte : si vous vous êtes inscrit avec un e-mail et un mot de passe puis que vous vous connectez plus tard avec un fournisseur qui rapporte le même e-mail, les deux sont liés.

Si l'instance exige la vérification de l'e-mail, vous recevez un lien de confirmation par e-mail après l'inscription. Ouvrez-le avant votre première connexion.

:::note Qui est l'administrateur
L'administrateur de l'instance n'est pas la première personne à s'inscrire. Sur une instance auto-hébergée, c'est le compte que l'opérateur configure avec `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD` (voir [Authentification](/self-hosting/authentication)) ; sur le service hébergé, c'est l'opérateur. L'inscription n'accorde jamais ce rôle.
:::

## Qu'est-ce qu'un espace

Un **espace** est un ensemble de ruchers, de ruches et d'enregistrements qui vont ensemble. Chaque compte démarre avec un **espace personnel**. Vous pouvez aussi appartenir à des espaces partagés, par exemple un rucher de club entretenu par plusieurs apiculteurs, un rucher pédagogique, ou une seconde exploitation que vous gardez séparée de vos ruches privées.

Tout ce que vous enregistrez réside dans l'**espace actif**, et chaque membre d'un espace en voit l'intégralité. Changer d'espace modifie les ruchers, les ruches et les visites que vous voyez. Il n'existe pas de partage plus fin : pour partager certaines ruches mais pas d'autres, placez-les dans des espaces séparés.

## Changer d'espace

Ouvrez **Paramètres → Espaces**. Chaque espace auquel vous appartenez est listé avec votre rôle ; l'espace actif est marqué. Touchez-en un autre pour basculer ; l'application se recharge avec les enregistrements de cet espace.

## Créer un espace

Dans **Paramètres → Espaces**, saisissez un nom (par exemple « Club apicole ») et touchez **Créer un espace**. Vous en devenez l'**Admin** et il devient votre espace actif.

## Rôles

| Rôle | Peut faire |
| --- | --- |
| **Admin** (propriétaire de l'espace) | Tout ce qu'un membre peut faire, plus inviter des personnes, révoquer les invitations en attente, supprimer les clés API des membres et supprimer l'espace. La personne qui crée un espace en est l'admin. |
| **Membre** | Travailler avec tous les ruchers, ruches et enregistrements de l'espace. |

Le rôle d'administrateur de l'instance issu de la configuration du serveur est distinct de ceux-ci : au sein d'un espace, l'administrateur de l'instance est admin ou membre comme n'importe qui d'autre.

## Inviter des apiculteurs

En tant qu'admin d'un espace, ouvrez **Paramètres → Espaces → Inviter un·e apiculteur·rice**, saisissez l'adresse e-mail de la personne et touchez **Envoyer l'invitation**. L'application affiche le lien d'invitation avec un bouton **Copier le lien** ; partagez-le directement avec elle. Si le serveur a une configuration SMTP, le même lien est aussi envoyé par e-mail. Les personnes invitées rejoignent l'espace comme membres.

Les invitations en attente sont listées sous **Invitations en attente** avec leurs propres boutons **Copier le lien** et **Révoquer**. Une invitation disparaît de la liste une fois acceptée.

## Accepter une invitation

Le lien d'invitation ouvre l'écran de connexion avec un avis « Vous avez reçu une invitation ».

- Si vous n'avez pas encore de compte, créez-en un. Sur une instance accessible sur invitation uniquement, l'adresse e-mail doit être celle à laquelle l'invitation a été envoyée.
- Si vous avez déjà un compte, connectez-vous.

Dès que vous êtes connecté, l'application vous ajoute à l'espace et vous y bascule. Il apparaît ensuite dans vos propres **Paramètres → Espaces**.

## Supprimer un espace

Un admin d'espace peut supprimer l'espace sous **Paramètres → Espaces → Zone de danger**. Cela supprime l'espace avec tous ses ruchers, ruches et enregistrements pour chaque membre, et ne peut pas être annulé.

## Clés API \{#api-keys}

**Paramètres → Clés API** est l'endroit où vous créez des identifiants pour les scripts et les appareils, comme une balance de ruche, qui utilisent l'[API](/using-the-api/overview) en votre nom. La section n'apparaît que lorsque vous êtes connecté ; une instance mono-utilisateur sans connexion n'a pas de clés et n'en a pas besoin.

- Saisissez un nom dans le champ **Nommez cette clé (ex. balance de ruche)**, choisissez les permissions dans le sélecteur **Permissions** (**Lecture et écriture**, par défaut, ou **Lecture seule**) et la durée de vie dans le sélecteur **Expire après** (**N'expire jamais**, par défaut, **30 jours**, **90 jours** ou **1 an**), puis touchez **Créer une clé**. La clé apparaît en dessous avec la mention « Copiez la clé maintenant. Elle n'est affichée qu'une seule fois. » et un bouton **Copier** (il indique **Copié** pendant un instant). Tout ce que vous ne copiez pas maintenant est perdu ; le serveur ne conserve qu'un hachage.
- Chaque clé est listée avec son nom (**Clé sans nom** si vous avez laissé le champ vide), ses premiers caractères, un badge **Lecture et écriture** ou **Lecture seule**, **Créée**, puis **Expire le** et la date lorsque vous avez défini une durée de vie (**Expirée le** et la date, en rouge, une fois ce jour passé) et, une fois qu'un script l'a utilisée, **Dernière utilisation**. Les clés expirées restent dans la liste jusqu'à ce que vous les supprimiez.
- **Supprimer** révoque une clé après une confirmation (« Supprimer cette clé ? Les scripts qui l'utilisent cessent de fonctionner immédiatement. »).

En tant qu'admin d'un espace, vous voyez aussi **Clés des autres membres** sous vos propres clés, avec la mention « En tant qu'administrateur de l'espace, vous pouvez supprimer la clé de n'importe quel membre, par exemple quand quelqu'un part ou qu'un appareil est perdu. » Chaque ligne affiche le nom de la clé, ses premiers caractères, son badge **Lecture et écriture** ou **Lecture seule**, l'e-mail de son propriétaire et **Dernière utilisation** une fois qu'un script l'a utilisée. **Supprimer** y demande « Supprimer la clé de ce membre ? Ses scripts qui l'utilisent cessent de fonctionner immédiatement. » La liste ne couvre que l'espace actif et n'apparaît que lorsque d'autres membres ont des clés ; les membres ne peuvent ni voir ni supprimer les clés les uns des autres.

Une clé agit en votre nom dans l'espace qui était actif lorsque vous l'avez créée ; changez donc d'espace d'abord lorsqu'un appareil appartient à un rucher partagé. Une clé **Lecture seule** ne peut que lire ; les scripts qui écrivent ont besoin de **Lecture et écriture**. Une clé n'expire que si vous définissez une durée de vie ; elle cesse de fonctionner lorsqu'elle expire, lorsque vous la supprimez ou que vous quittez cet espace. Le compte de démonstration ne peut pas créer de clés. Voir [Authentification](../using-the-api/overview.md#authentication) pour la façon dont un script envoie la clé.

## La démo

Certaines instances exécutent un **compte de démonstration**. Tant que vous y êtes connecté, une bannière vous rappelle que les données sont réinitialisées chaque heure. Le serveur rejette les modifications venant du compte de démonstration, donc tout ce que vous saisissez reste uniquement sur votre appareil. Les opérateurs peuvent l'activer via le [Mode démo](/self-hosting/demo).

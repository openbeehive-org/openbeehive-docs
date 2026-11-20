---
sidebar_position: 13
title: "Comptes et espaces"
---

# Comptes et espaces

La façon dont vous vous connectez dépend de la configuration de l'instance. Une instance auto-hébergée individuelle peut ne nécessiter aucune connexion ; une instance partagée (comme le service hébergé) donne un compte à chacun et organise les ruchers en **espaces** entre lesquels vous pouvez basculer.

## Se connecter

Selon l'instance, l'écran de connexion propose une ou plusieurs des options suivantes :

- **E-mail et mot de passe** : « Créer un compte » avec votre nom, votre e-mail et un mot de passe, puis « Se connecter ».
- **Un fournisseur** (Google, Keycloak, ...) : « Continuer avec ... ».
- **Une passkey** : « Se connecter avec une passkey » avec votre empreinte digitale, votre visage, le code PIN de votre appareil ou une clé de sécurité. Vous ajoutez des passkeys sous **Paramètres → Passkeys** une fois connecté.
- **La démo** : « Essayer la démo » sur les instances qui en proposent une. Elle ne nécessite aucun compte.

Sur une instance mono-utilisateur sans connexion configurée, l'application s'ouvre directement sur vos enregistrements.

Les méthodes sont liées à un seul compte : si vous vous êtes inscrit avec un e-mail et un mot de passe puis que vous vous connectez plus tard avec un fournisseur qui rapporte le même e-mail, les deux sont liés, à condition que le fournisseur confirme l'adresse comme vérifiée et que l'adresse de votre compte soit vérifiée elle aussi. Sinon, la connexion via le fournisseur est refusée et vous continuez de vous connecter comme auparavant.

Après trop de tentatives échouées, l'écran de connexion indique « Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer. » Le blocage se lève de lui-même au bout de 15 minutes au plus.

Si l'instance exige la vérification de l'e-mail, vous recevez un lien de confirmation par e-mail après l'inscription. Ouvrez-le avant votre première connexion.

## Votre mot de passe \{#password}

Sous **Paramètres → Compte → Mot de passe**, saisissez le **Mot de passe actuel** et deux fois le nouveau, puis touchez **Changer le mot de passe**. Vos autres appareils sont déconnectés ; celui-ci reste connecté.

Si vous l'avez oublié, touchez **Mot de passe oublié ?** sur l'écran de connexion et saisissez votre adresse e-mail. Si le serveur envoie des e-mails, vous recevez un lien valable une heure et utilisable une seule fois ; choisissez-y un nouveau mot de passe, et vous êtes déconnecté de tous vos appareils. Si le serveur n'envoie pas d'e-mails, la page vous l'indique : adressez-vous à l'administrateur de l'instance, qui peut créer dans les Paramètres un lien de réinitialisation pour votre compte et vous le transmettre.

Le mot de passe de l'administrateur de l'instance est défini dans la configuration du serveur et ne peut pas être modifié dans l'application. Les comptes qui se connectent uniquement via un fournisseur ou une passkey n'ont pas de mot de passe à changer.

## Se déconnecter \{#signing-out}

**Paramètres → Compte → Se déconnecter** compte d'abord les modifications de cet appareil qui n'ont pas encore été envoyées et vous en avertit. Sur un appareil partagé, cochez **Supprimer aussi les données de cet appareil** pour effacer du navigateur les enregistrements de cet espace et les photos téléchargées ; tout ce qui a été synchronisé reste dans votre compte. Les modifications non envoyées sont perdues lorsque vous supprimez les données : connectez-vous donc à Internet et attendez d'abord la synchronisation.

**Se déconnecter partout** vous déconnecte de tous vos autres appareils, par exemple après la perte d'un téléphone. Vous restez connecté sur celui-ci, et les clés API continuent de fonctionner.

:::note Qui est l'administrateur
L'administrateur de l'instance n'est pas la première personne à s'inscrire. Sur une instance auto-hébergée, c'est le compte que l'opérateur configure avec `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD` (voir [Authentification](../self-hosting/authentication.md)) ; sur le service hébergé, c'est l'opérateur. L'inscription n'accorde jamais ce rôle.
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
| **Admin** (propriétaire de l'espace) | Tout ce qu'un membre peut faire, plus inviter des personnes, révoquer les invitations en attente, modifier le rôle des membres, retirer des membres, supprimer les clés API des membres et supprimer l'espace. La personne qui crée un espace en est l'admin. |
| **Membre** | Travailler avec tous les ruchers, ruches et enregistrements de l'espace, voir qui d'autre en est membre et quitter l'espace. |

Un espace peut avoir plusieurs admins et en garde toujours au moins un : le dernier admin ne peut ni quitter l'espace ni redevenir simple membre. Nommez d'abord quelqu'un d'autre admin, ou supprimez l'espace.

Le rôle d'administrateur de l'instance issu de la configuration du serveur est distinct de ceux-ci : au sein d'un espace, l'administrateur de l'instance est admin ou membre comme n'importe qui d'autre.

## Inviter des apiculteurs

En tant qu'admin d'un espace, ouvrez **Paramètres → Espaces → Inviter un·e apiculteur·rice**, saisissez l'adresse e-mail de la personne et touchez **Envoyer l'invitation**. L'application affiche le lien d'invitation avec un bouton **Copier le lien** ; partagez-le directement avec elle. Si le serveur a une configuration SMTP, le même lien est aussi envoyé par e-mail. Les personnes invitées rejoignent l'espace comme membres.

Une invitation est valable 7 jours et ne fonctionne que pour l'adresse e-mail pour laquelle elle a été émise. Les invitations en attente sont listées sous **Invitations en attente** avec leurs propres boutons **Copier le lien** et **Révoquer**. Une invitation disparaît de la liste une fois acceptée.

## Accepter une invitation

Le lien d'invitation ouvre l'écran de connexion avec un avis « Vous avez reçu une invitation ».

- Si vous n'avez pas encore de compte, créez-en un avec l'adresse e-mail à laquelle l'invitation a été envoyée.
- Si vous avez déjà un compte avec cette adresse, connectez-vous.

Une invitation ne peut pas être utilisée avec une autre adresse e-mail (« Cette invitation a été émise pour une autre adresse e-mail. »), et elle cesse de fonctionner 7 jours après sa création (« Cette invitation n'est pas valide ou a expiré. »). Demandez-en une nouvelle à l'admin de l'espace.

Dès que vous êtes connecté, l'application vous ajoute à l'espace et vous y bascule. Il apparaît ensuite dans vos propres **Paramètres → Espaces**.

## Membres \{#members}

**Paramètres → Espaces → Membres** liste les personnes qui appartiennent à l'espace actif. Un admin voit l'adresse e-mail et le rôle de chaque membre, peut changer le **Rôle** (**Admin** ou **Membre**) et peut **Retirer** un membre. Un membre retiré perd l'accès immédiatement, y compris ses clés API ; les enregistrements qu'il a écrits restent. Ses tâches personnelles dans cet espace sont supprimées.

Chaque membre peut **Quitter** un espace. Vous perdez immédiatement l'accès à ses enregistrements et il vous faut une nouvelle invitation pour revenir. Si vous en êtes le seul membre, il n'y a rien à quitter ; supprimez plutôt l'espace.

Si vous perdez l'accès à l'espace dans lequel vous travailliez, l'application vous le signale et continue dans un autre de vos espaces.

## Supprimer un espace

Un admin d'espace peut supprimer l'espace sous **Paramètres → Espaces → Zone de danger**. Saisissez le nom de l'espace pour confirmer. Cela supprime l'espace avec tous ses ruchers, ruches, enregistrements et photos pour chaque membre, et ne peut pas être annulé.

## Supprimer votre compte \{#delete-account}

**Paramètres → Supprimer le compte** montre ce que la suppression de votre compte entraînerait, avant que vous ne confirmiez :

- Vos données de connexion, vos clés API et vos tâches personnelles sont supprimées.
- Les espaces dont vous êtes le seul membre sont supprimés avec tous leurs enregistrements et photos.
- Dans les espaces que vous partagez, vos enregistrements restent pour les autres membres, indiqués comme écrits par un utilisateur supprimé.
- Tant que vous êtes le seul admin d'un espace qui compte d'autres membres, le compte ne peut pas être supprimé. Nommez-y d'abord quelqu'un d'autre admin, ou supprimez l'espace.

Confirmez avec votre mot de passe ou une passkey. Un compte qui n'a ni l'un ni l'autre doit s'être connecté il y a moins de 5 minutes ; sinon, l'application vous demande de vous reconnecter. La suppression est définitive. Le compte de l'administrateur de l'instance et le compte de démonstration ne peuvent pas être supprimés dans l'application.

## Clés API \{#api-keys}

**Paramètres → Clés API** est l'endroit où vous créez des identifiants pour les scripts et les appareils, comme une balance de ruche, qui utilisent l'[API](../using-the-api/overview.md) en votre nom. La section n'apparaît que lorsque vous êtes connecté ; une instance mono-utilisateur sans connexion n'a pas de clés et n'en a pas besoin.

- Saisissez un nom dans le champ **Nommez cette clé (ex. balance de ruche)**, choisissez les permissions dans le sélecteur **Permissions** (**Lecture et écriture**, par défaut, ou **Lecture seule**) et la durée de vie dans le sélecteur **Expire après** (**N'expire jamais**, par défaut, **30 jours**, **90 jours** ou **1 an**), puis touchez **Créer une clé**. La clé apparaît en dessous avec la mention « Copiez la clé maintenant. Elle n'est affichée qu'une seule fois. » et un bouton **Copier** (il indique **Copié** pendant un instant). Tout ce que vous ne copiez pas maintenant est perdu ; le serveur ne conserve qu'un hachage. Sous **Comment l’utiliser**, l'application affiche l'adresse à laquelle envoyer les requêtes et un exemple prêt à l'emploi qui liste vos ruches, avec **Copier l’exemple**.
- Chaque clé est listée avec son nom (**Clé sans nom** si vous avez laissé le champ vide), ses premiers caractères, un badge **Lecture et écriture** ou **Lecture seule**, **Créée**, puis **Expire le** et la date lorsque vous avez défini une durée de vie (**Expirée le** et la date, en rouge, une fois ce jour passé) et, une fois qu'un script l'a utilisée, **Dernière utilisation**. Les clés expirées restent dans la liste jusqu'à ce que vous les supprimiez.
- **Supprimer** révoque une clé après une confirmation (« Supprimer cette clé ? Les scripts qui l'utilisent cessent de fonctionner immédiatement. »).

En tant qu'admin d'un espace, vous voyez aussi **Clés des autres membres** sous vos propres clés, avec la mention « En tant qu'administrateur de l'espace, vous pouvez supprimer la clé de n'importe quel membre, par exemple quand quelqu'un part ou qu'un appareil est perdu. » Chaque ligne affiche le nom de la clé, ses premiers caractères, son badge **Lecture et écriture** ou **Lecture seule**, l'e-mail de son propriétaire et **Dernière utilisation** une fois qu'un script l'a utilisée. **Supprimer** y demande « Supprimer la clé de ce membre ? Ses scripts qui l'utilisent cessent de fonctionner immédiatement. » La liste ne couvre que l'espace actif et n'apparaît que lorsque d'autres membres ont des clés ; les membres ne peuvent ni voir ni supprimer les clés les uns des autres.

Une clé agit en votre nom dans l'espace qui était actif lorsque vous l'avez créée ; changez donc d'espace d'abord lorsqu'un appareil appartient à un rucher partagé. Une clé **Lecture seule** ne peut que lire ; les scripts qui écrivent ont besoin de **Lecture et écriture**. Une clé n'expire que si vous définissez une durée de vie ; elle cesse de fonctionner lorsqu'elle expire, lorsque vous la supprimez, ou lorsque vous quittez cet espace ou en êtes retiré. Le compte de démonstration ne peut pas créer de clés. Voir [Authentification](../using-the-api/overview.md#authentication) pour la façon dont un script envoie la clé.

## La démo

Certaines instances exécutent un **compte de démonstration**. Tant que vous y êtes connecté, une bannière vous rappelle que les données sont réinitialisées chaque heure. La démo est en lecture seule : lorsque vous modifiez quelque chose, l'application annule la modification et indique qu'elle n'a pas été enregistrée. La démo publique du projet est le bouton **Essayer la démo** sur [app.openbeehive.org/login](https://app.openbeehive.org/login). Les opérateurs peuvent l'activer via le [Mode démo](../self-hosting/demo.md).

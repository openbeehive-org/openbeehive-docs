---
sidebar_position: 11
title: "Installer l'application"
---

# Installer l'application

Openbeehive est une Progressive Web App (PWA). Cela signifie que vous n'avez besoin
ni d'une boutique d'applications, ni d'un téléchargement, ni d'un compte simplement
pour commencer. Vous l'ouvrez dans votre navigateur et, d'un seul geste, l'ajoutez
à votre appareil pour qu'elle se comporte comme n'importe quelle autre application :
sa propre icône, une fenêtre plein écran et une prise en charge complète du mode
hors ligne.

L'installation est facultative mais recommandée. Une fois installée, l'application
se lance instantanément, masque la barre d'adresse du navigateur, et garde vos
enregistrements disponibles même lorsque vous êtes au rucher sans réseau.

## Ce que vous obtenez en l'installant

- **Une icône d'application** sur votre écran d'accueil ou dans votre lanceur d'applications.
- **Une fenêtre plein écran** sans habillage de navigateur, de sorte qu'il y a plus
  de place pour vos ruches et vos inspections.
- **Un accès hors ligne.** Vos enregistrements vivent dans une base de données locale
  sur l'appareil et se synchronisent en arrière-plan. Consultez
  [Hors ligne et synchronisation](/using-the-app/offline-and-sync).
- **Un scan QR rapide.** Scanner l'[étiquette QR](/using-the-app/qr-labels) d'une ruche
  ouvre cette ruche.

:::tip
Vous pouvez continuer à utiliser Openbeehive dans un onglet de navigateur normal sans
l'installer. Les fonctionnalités sont les mêmes ; l'installation lui donne simplement
l'impression d'une application native et est plus pratique sur le terrain.
:::

## Installer sur iPhone et iPad (Safari)

1. Ouvrez **Safari** et rendez-vous sur [app.openbeehive.org](https://app.openbeehive.org).
2. Touchez le bouton **Partager** (le carré avec une flèche vers le haut).
3. Faites défiler vers le bas et touchez **Sur l'écran d'accueil**.
4. Ajustez le nom si vous le souhaitez, puis touchez **Ajouter**.

L'icône Openbeehive se trouve désormais sur votre écran d'accueil. Lancez-la à partir
de là pour obtenir l'expérience plein écran et hors ligne.

:::note
Sur iOS, l'option d'installation se trouve dans le menu Partager de Safari. Les autres
navigateurs sur iPhone et iPad ne peuvent pas installer d'applications web, utilisez
donc Safari pour cette étape.
:::

## Installer sur Android (Chrome)

1. Ouvrez **Chrome** et rendez-vous sur [app.openbeehive.org](https://app.openbeehive.org).
2. Touchez le **menu** (trois points) dans le coin supérieur droit.
3. Touchez **Installer l'application** (ou **Ajouter à l'écran d'accueil**).
4. Confirmez en touchant **Installer**.

Vous pouvez aussi voir une invite ou une bannière proposant d'installer Openbeehive
directement. La toucher fait la même chose.

## Installer sur ordinateur (Chrome, Edge et autres)

Sur la plupart des navigateurs de bureau, une icône d'installation apparaît à
l'extrémité droite de la barre d'adresse lorsque vous visitez l'application.

1. Rendez-vous sur [app.openbeehive.org](https://app.openbeehive.org).
2. Cliquez sur l'**icône d'installation** dans la barre d'adresse (elle ressemble
   souvent à un petit moniteur ou à une flèche vers le bas dans un bac).
3. Cliquez sur **Installer** pour confirmer.

Si vous ne voyez pas l'icône, ouvrez le menu du navigateur et cherchez **Installer
Openbeehive** ou **Applications -> Installer ce site en tant qu'application**.
L'application s'ouvre alors dans sa propre fenêtre et apparaît aux côtés de vos autres
applications.

| Plateforme | Navigateur | Où trouver l'option d'installation |
| --- | --- | --- |
| iOS / iPadOS | Safari | Menu Partager -> Sur l'écran d'accueil |
| Android | Chrome | Menu (trois points) -> Installer l'application |
| Windows / Linux | Chrome / Edge | Icône d'installation dans la barre d'adresse |
| macOS | Chrome / Edge | Icône d'installation dans la barre d'adresse |
| macOS | Safari | Fichier -> Ajouter au Dock |

## Installer une instance auto-hébergée

Si vous exécutez votre propre serveur Openbeehive, l'application s'installe
exactement de la même manière. Pointez simplement votre navigateur vers l'adresse
de votre propre serveur au lieu du service hébergé, puis suivez les mêmes étapes
ci-dessus pour votre plateforme.

Par exemple, ouvrez votre instance à son `BEEHIVE_PUBLIC_BASE_URL` (par exemple
`https://bees.example.com`) et utilisez **Sur l'écran d'accueil** ou l'option
d'installation du navigateur. L'application installée communique alors avec votre
serveur, et vos enregistrements restent sur votre propre infrastructure.

:::caution
Pour que l'installation se déroule sans accroc, une instance auto-hébergée doit être
servie via **HTTPS** avec un certificat valide. La plupart des navigateurs ne
proposent l'installation PWA que sur des origines sécurisées. Consultez
[Proxy inverse](/self-hosting/reverse-proxy) pour savoir comment placer du TLS devant
votre serveur.
:::

Si vous auto-hébergez, la section [Auto-hébergement](/category/self-hosting) parcourt
le déploiement, la configuration et les sauvegardes.

## Mettre à jour l'application

La PWA se met à jour d'elle-même. Lorsqu'une nouvelle version est publiée,
l'application la récupère en arrière-plan et l'applique au prochain lancement ou
rechargement. Vous n'avez pas besoin de réinstaller. Si vous voulez vous assurer
que vous êtes sur la dernière version, fermez complètement l'application et rouvrez-la.

## Supprimer l'application

Désinstaller la PWA ne supprime que le raccourci de l'application et son cache local ;
cela ne supprime pas les enregistrements qui ont déjà été synchronisés avec le
serveur. Pour désinstaller :

- **iOS / Android :** appuyez longuement sur l'icône, puis choisissez **Supprimer**
  ou **Désinstaller**.
- **Ordinateur :** ouvrez l'application, puis utilisez le menu de sa fenêtre (ou les
  paramètres d'applications du navigateur) et choisissez **Désinstaller**.

:::caution
Si vous avez des enregistrements qui ne sont pas encore synchronisés au moment où vous
désinstallez, ils ne vivent que dans la base de données locale de l'appareil et
peuvent être perdus. Assurez-vous que l'application s'est synchronisée avant de la
supprimer. Consultez [Hors ligne et synchronisation](/using-the-app/offline-and-sync).
:::

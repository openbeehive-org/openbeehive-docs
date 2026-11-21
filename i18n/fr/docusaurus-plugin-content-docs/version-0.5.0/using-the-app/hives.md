---
sidebar_position: 3
title: "Ruches"
---

# Ruches

Une ruche dans Openbeehive est une seule colonie dans une caisse physique. Presque tout ce que vous consignez au quotidien (visites, récoltes, traitements) se rattache à une ruche. Chaque ruche appartient à un seul rucher à la fois et peut avoir une reine. Fonctionne hors ligne ; voir [Hors ligne et synchronisation](./offline-and-sync.md).

## Créer une ruche

Ouvrez un rucher, saisissez un nom sous **Ajouter une ruche** et ajoutez-la. La liste **Ruches** propose le même formulaire avec un sélecteur de rucher derrière son bouton **+ Nouveau**, et **+ Nouveau → Nouvelle ruche** dans la Vue d'ensemble y mène. Une nouvelle ruche démarre avec le statut **Active** et sans type. Ouvrez la ruche et choisissez **Plus → Modifier la ruche** pour définir :

| Champ | Ce que c'est |
| --- | --- |
| **Nom** | Un numéro, une couleur, un surnom. |
| **Type** | Le standard de cadre et de caisse ; voir ci-dessous. |
| **Statut** | L'état de la colonie ; voir ci-dessous. |

Une **photo** s'ajoute depuis la page de la ruche en touchant l'emplacement d'image à côté du nom. Toucher ensuite l'image l'ouvre dans la visionneuse, avec **Remplacer la photo** et **Supprimer la photo**. Comme pour les photos d'une visite, un petit aperçu se synchronise immédiatement sur chaque appareil et l'image en taille réelle est envoyée en arrière-plan ; voir [Hors ligne et synchronisation](./offline-and-sync.md#photos).

:::tip
Gardez des noms courts et cohérents au sein d'un rucher, par exemple « 1 », « 2 », « 3 ». Les noms courts s'impriment clairement sur les étiquettes QR et se lisent rapidement sur le terrain.
:::

### Types de ruche

| Type | Usage typique |
| --- | --- |
| Zander | Répandu dans certaines régions d'Allemagne et d'Europe centrale. |
| Dadant | Populaire pour la production de miel, grand corps de couvain. |
| Deutsch Normal | Un standard allemand traditionnel. |
| Langstroth | Le standard le plus répandu dans le monde. |
| Warré | Une conception verticale à faible intervention. |
| Top-bar | Barres horizontales sans cadre. |
| Autre | Tout ce qui n'est pas listé ci-dessus. |

Pour une description plus complète de chaque standard, consultez [Types de ruche](../knowledge-base/hive-types.md).

### Statut

| Statut | Signification |
| --- | --- |
| **Active** | Une colonie avec reine, en usage normal. |
| **Nucléus** | Une petite colonie de départ (un « nuc »), souvent un essaim artificiel ou une unité de fécondation. |
| **Orpheline** | La colonie a perdu sa reine et nécessite une intervention. |
| **Perdue** | La colonie s'est éteinte ou a déserté. |
| **Dissoute** | Vous avez réuni ou démantelé la colonie. |

Le statut est une étiquette que vous définissez en modifiant la ruche ; rien ne le change automatiquement. Mettre une ruche en **Perdue** ou **Dissoute** conserve tout son enregistrement.

## La liste des ruches

**Ruches** liste toutes les ruches de l'espace avec leur rucher et le temps écoulé depuis leur dernière visite. Au-dessus de la liste :

- **Rechercher** trouve les ruches par leur nom, par le nom du rucher ou par les premiers caractères du code de l'étiquette imprimé sur l'[étiquette QR](./qr-labels.md).
- **Statut** et **Rucher** filtrent la liste ; **Effacer les filtres** les réinitialise.
- **Trier par** ordonne par **Nom**, **Rucher** ou **Visite la plus ancienne**.

Les noms sont triés comme vous les lisez : « Ruche 2 » vient avant « Ruche 10 ». Une ligne sous les outils indique combien de ruches sont affichées.

La recherche, les filtres et le tri sont conservés quand vous ouvrez une ruche puis revenez. L'entrée **Ruches** de la navigation ouvre toujours la liste complète.

## Déplacer une ruche entre ruchers

Pour déplacer une ruche, ouvrez-la, touchez **Déplacer** dans l'en-tête et choisissez le rucher de destination. La ruche conserve son nom, sa reine, sa photo et son enregistrement complet ; seul son rucher change.

### Historique des emplacements

Chaque déplacement est consigné comme une entrée datée sous **Historique des emplacements** en bas de la page de la ruche, de sorte que vous savez où se trouvait une colonie à tout moment. Utile pour retracer une exposition aux maladies et pour les enregistrements de transhumance.

:::caution
Dans de nombreuses régions, le déplacement de ruches entre emplacements est soumis à des règles de santé et de mouvement des abeilles, en particulier au sein des zones de lutte contre les maladies. Vérifiez vos exigences nationales ou locales avant de déplacer des colonies. Consultez [Maladies et parasites](../knowledge-base/diseases-and-pests.md).
:::

## La page de la ruche

Ouvrir une ruche vous offre un écran unique avec tout ce qui concerne cette colonie.

### En-tête et actions

L'en-tête affiche la photo, le nom, ainsi que le statut et le type. À côté se trouvent les deux actions les plus fréquentes sur le terrain, **Enregistrer une visite** et **Déplacer**, et un menu **Plus** avec :

- **Fiche de ruche** : un tableau imprimable de toutes les visites (avec un bouton **Imprimer**).
- **Évolution** : des graphiques des relevés enregistrés lors des visites (cadres occupés, cadres de couvain, réserves de nourriture, cellules d'essaimage, douceur, tenue au cadre, varroa, poids de la ruche, nourrissement, larve la plus jeune, température et humidité) ainsi que les récoltes de miel dans le temps. Les appréciations comme les réserves de nourriture et la douceur sont tracées sous forme de niveaux nommés, le meilleur en haut ; les températures négatives sont tracées, et le varroa n'est représenté que lorsque la saisie est un nombre seul.
- **Modifier la ruche**, **Code QR** (affiche l'étiquette de la ruche avec des boutons **Imprimer** et **SVG** ; voir [Étiquettes QR](./qr-labels.md)) et **Supprimer la ruche**.

### Derniers relevés

Sous l'en-tête, des pastilles affichent les valeurs enregistrées lors de la visite la plus récente : cadres occupés, cadres de couvain, cellules d'essaimage, poids de la ruche et varroa. Toucher une pastille ouvre le graphique correspondant dans **Évolution**.

### Reine

La carte **Reine** affiche son année, son numéro, sa couleur de marquage, son origine et son commentaire, avec **Remplacer la reine** (ou **Définir la reine** si aucune n'est enregistrée) et des actions pour modifier ou supprimer sa fiche. **Historique des reines** liste les reines précédentes avec leurs dates d'introduction et de remplacement. Voir [Reines](./queens.md).

### Journal des visites

**Enregistrer une visite** ouvre le formulaire de visite. Les cinq visites les plus récentes sont listées, la plus récente en premier, chacune avec une date, la météo, des vignettes résumant ce que vous avez enregistré (reine vue, cadres, réserves, cellules d'essaimage, tempérament, nourrissement, poids, miel, température, humidité, varroa), la note et les éventuelles photos (touchez-en une pour ouvrir la visionneuse). Les poids et les températures s'affichent dans les unités choisies sous **Paramètres → Préférences → Unités**. Chaque visite dispose d'actions pour la modifier et la supprimer. **Voir les N visites** ouvre le journal complet. Voir [Visites](./inspections.md).

### Miel et Traitements

**Miel** affiche le total des récoltes de la ruche dans son titre et liste chaque récolte (**Enregistrer une récolte**). **Traitements** liste chaque traitement (**Enregistrer un traitement**) et imprime le registre des traitements (**Imprimer le registre**). Les récoltes et les traitements peuvent être modifiés et supprimés comme les visites. Voir [Récoltes](./harvests.md) et [Traitements](./treatments.md).

## Supprimer ou retirer une ruche

Changez le **statut** d'une ruche plutôt que de la supprimer. Mettre une colonie en **Perdue** ou **Dissoute** conserve son historique pour les comparaisons d'une année sur l'autre et la traçabilité. Ne supprimez une ruche que si elle a été créée par erreur ; l'application demande confirmation, et la ruche disparaît avec tous ses enregistrements.

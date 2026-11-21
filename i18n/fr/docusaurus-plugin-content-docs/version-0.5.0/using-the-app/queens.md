---
sidebar_position: 4
title: "Reines"
---

# Reines

Openbeehive enregistre qui est la reine, d'où elle vient, comment elle est marquée, et quand son règne a commencé et pris fin. Les anciennes reines restent dans l'enregistrement, de sorte que chaque ruche construit un historique de son cheptel au fil des saisons.

## Ce que contient la fiche d'une reine

Définissez, remplacez ou corrigez la reine depuis la page de la ruche. Le formulaire comporte :

| Champ | Ce qu'il signifie |
| --- | --- |
| Introduite le | Le jour où elle a pris la tête de la colonie. Par défaut aujourd'hui. |
| Année | L'année d'élevage de la reine. Détermine sa couleur de marquage. |
| Numéro | Un numéro d'éleveur ou de séquence facultatif, par exemple « 12 ». |
| Origine | D'où elle vient : élevage personnel, Buckfast, un essaim, une supersédure, etc. |
| Marquage | La couleur du point sur son thorax. Suit automatiquement l'année ; décochez **auto** pour choisir une couleur à la main. |
| Commentaire | Tout le reste : lignée d'élevage, comportement, qualité de ponte, éleveur d'origine. |

:::tip[Consigner l'origine honnêtement]
« Élevage personnel, fille de la n°214 » ou « Achetée à l'association locale, Buckfast » vous en dira bien plus dans deux ans que « reine ».
:::

## Couleur de marquage par année

Openbeehive suit le code international de couleur des reines, qui tourne tous les cinq ans selon le dernier chiffre de l'année :

| L'année se termine par | Couleur |
| --- | --- |
| 1 ou 6 | Blanc |
| 2 ou 7 | Jaune |
| 3 ou 8 | Rouge |
| 4 ou 9 | Vert |
| 5 ou 0 | Bleu |

Lorsque vous définissez l'année, la couleur correspondante est sélectionnée. Décochez **auto** pour enregistrer une autre couleur si la reine que vous avez achetée en porte une, afin que le point dans vos enregistrements corresponde au point sur l'abeille. Pour le code complet et le moyen mnémotechnique, consultez [Couleurs de marquage des reines](../knowledge-base/queen-marking-colours.md).

## Remplacer une reine

Une colonie n'a qu'une reine régnante à la fois, mais elle en aura beaucoup au cours de sa vie. Lorsqu'une reine est supersédée, part avec un essaim, meurt, ou que vous remérez délibérément, ne supprimez pas sa fiche. Touchez **Remplacer la reine** sur la page de la ruche et saisissez la nouvelle. Openbeehive :

1. Clôt le règne de la reine précédente en y apposant sa date de remplacement.
2. Enregistre la nouvelle reine avec sa date d'introduction.
3. Conserve l'ancienne reine sous **Historique des reines** sur la page de la ruche, avec ses dates d'introduction et de remplacement.

:::tip[Remérage]
Notez *pourquoi* vous avez remété dans le commentaire de la nouvelle reine : ponte médiocre, abeilles défensives, âge, amélioration planifiée de la lignée. Les tendances sur plusieurs ruches en révèlent souvent plus qu'une colonie seule.
:::

## Corriger les informations d'une reine \{#correcting}

**Remplacer la reine** sert à un véritable remérage. Pour corriger une faute de frappe, une année erronée ou une date erronée, utilisez plutôt l'action **Modifier** de la reine : elle modifie sa fiche et laisse l'historique des règnes intact. Le formulaire le dit aussi : « Corrigez ici ses informations. Pour une nouvelle reine, utilisez « Remplacer la reine ». » Les anciennes reines sous **Historique des reines** se corrigent de la même manière.

## Supprimer une reine

**Supprimer** n'est destiné qu'à une reine enregistrée par erreur. Si c'est la reine actuelle, la précédente redevient la reine actuelle. L'application demande confirmation et propose ensuite **Annuler** pendant quelques secondes.

## Entrées antidatées

Les visites, récoltes et traitements portent leur propre date et sont attribués à la reine dont le règne couvrait cette date, pas nécessairement à celle qui est à la tête de la ruche aujourd'hui. Si un remérage et une visite antidatée tombent à des dates proches, vérifiez les dates pour que chaque enregistrement atterrisse sous le bon règne.

Les fiches de reines se synchronisent comme tout le reste ; voir [Hors ligne et synchronisation](./offline-and-sync.md).

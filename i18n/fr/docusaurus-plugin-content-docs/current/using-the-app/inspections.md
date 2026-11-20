---
sidebar_position: 5
title: "Inspections (visites)"
---

# Inspections (visites)

Une inspection est le compte rendu d'une seule visite à une ruche : ce que vous avez observé, ce que vous avez fait et tout ce qui mérite d'être retenu. Au fil d'une saison, les visites dessinent une image de l'évolution de chaque colonie. Fonctionne hors ligne ; voir [Hors ligne et synchronisation](./offline-and-sync.md).

:::tip
Pour savoir quoi observer lors d'une visite et à quelle fréquence inspecter, lisez [Inspecter une colonie](../beekeeping/inspecting.md). Cette page explique comment l'enregistrer.
:::

## Démarrer une visite

Ouvrez une ruche (ou scannez son [étiquette QR](./qr-labels.md)) et touchez **Enregistrer une visite** dans l'en-tête. Le formulaire s'ouvre avec la date du jour, et **Enregistrer** reste à portée de main en bas de l'écran pendant que vous faites défiler.

Chaque champ est facultatif. Un simple « tout va bien » sans rien d'autre est une entrée valide.

### Vide n'est pas zéro

Les champs numériques sont vides au départ. Laissez un champ vide lorsque vous n'avez pas regardé ; saisissez `0` lorsque vous avez regardé et n'avez rien trouvé. « Cellules d'essaimage : 0 » est une observation, un champ vide n'en est pas une. Les compteurs ont des boutons **−** et **+**, ce qui vous permet de les saisir avec des gants.

### Partir de la dernière visite

Si la ruche a une visite antérieure, **Partir de la dernière visite** (avec la date de cette visite) préremplit ce qui change généralement peu : cadres occupés, cadres de couvain, réserves de nourriture, douceur et tenue au cadre. Ajustez ce qui est différent aujourd'hui. Les champs que la dernière visite a laissés vides restent vides.

## Date et météo

| Champ | Notes |
| --- | --- |
| Date | Par défaut aujourd'hui ; modifiez-la pour consigner une visite passée. Les dates futures ne sont pas acceptées. |
| Météo | Texte libre, par exemple « ensoleillé, 22°C ». |

## Poids et températures \{#units}

Les poids et les températures s'affichent et se saisissent dans les unités choisies sous **Paramètres → Unités** : kilogrammes ou livres, degrés Celsius ou Fahrenheit. Ce choix est enregistré avec votre compte et s'applique sur tous vos appareils. Vous pouvez taper une virgule ou un point décimal. L'application stocke chaque valeur en kilogrammes et en degrés Celsius : changer d'unités ne modifie donc jamais vos enregistrements, et les exports comme l'API restent en unités métriques.

## Colonie & comportement

| Champ | Ce qu'il enregistre |
| --- | --- |
| Reine vue | Si vous avez repéré la reine. |
| Œufs vus | Le signe le plus rapide d'une reine qui a pondu récemment. |
| Couvain operculé vu | Si du couvain d'ouvrières operculé est présent. |
| Larve la plus jeune | Âge en jours du stade de couvain le plus jeune que vous avez trouvé. |
| Cadres occupés | Combien de cadres les abeilles couvrent. |
| Cadres de couvain | Combien de cadres contiennent du couvain. |
| Réserves de nourriture | Bonnes, Moyennes, Faibles ou Nulles. |
| Cellules d'essaimage | Combien de cellules royales vous avez trouvées. |
| Douceur | Très douce, Douce, Normale, Nerveuse ou Agressive. |
| Tenue au cadre | Quitte le cadre, Agitée, Calme ou Très calme. |
| Varroa | Varroas par jour. Saisissez un nombre seul, comme `3`, si vous voulez le voir dans les graphiques ; tout autre texte est conservé mais n'est pas représenté. |
| Poids de la ruche | En kg ou en lb, si vous pesez la ruche. |

:::note
Le trio « œufs vus / larve la plus jeune / couvain operculé » confirme généralement une reine en ponte et en bonne santé sans avoir à la trouver à chaque fois.
:::

## Activités lors de cette visite

Cette section est repliée au départ ; touchez son titre pour l'ouvrir.

| Activité | Enregistre |
| --- | --- |
| Nourri | Quantité donnée, en kg ou en lb. |
| Cadres ajoutés / retirés | Cadres que vous avez mis ou enlevés. |
| Cadre à mâles découpé | Si vous avez découpé un cadre de couvain de mâles (une mesure de lutte contre le varroa). |
| Hausse ajoutée | Si vous avez ajouté une hausse. |

Le miel ne s'enregistre plus dans le formulaire de visite. Enregistrez-le comme une [récolte](./harvests.md), avec la variété, la teneur en eau et le numéro de lot. Les quantités « Miel récolté » saisies lors de visites par des versions antérieures restent affichées.

Pour une vue d'ensemble de la gestion du varroa et de la récolte, consultez [Varroa](../beekeeping/varroa.md) et [Récolte de miel](../beekeeping/honey-harvest.md).

## Climat

Cette section est elle aussi repliée au départ.

| Champ | Unité |
| --- | --- |
| Température de la ruche | °C ou °F |
| Température extérieure | °C ou °F |
| Humidité de la ruche | % |
| Humidité extérieure | % |

Les quatre sont facultatifs. Avec le temps, ils apparaissent dans les graphiques **Évolution** de la ruche aux côtés du poids et de la force de la colonie.

:::tip
Une balance de ruche ou un capteur climatique peut envoyer ces champs via l'API. Ces relevés sont marqués comme relevés de capteur ; voir [Relevés de capteur](#sensor-readings) ci-dessous et [Trackers automatisés](../using-the-api/automated-trackers.md).
:::

## Note et photos

Ajoutez une **note** en texte libre pour tout ce que les champs structurés ne couvrent pas : une cellule de supersédure repérée, un tempérament à surveiller, un rappel de remérage.

**Ajouter une photo** joint une ou plusieurs images (aspect du couvain, maladie suspectée, cellules royales). L'application réduit chacune à 2048 pixels au plus et retire ce que l'appareil photo a enregistré en plus de l'image, comme la position. Un petit aperçu se synchronise immédiatement avec la visite sur chaque appareil ; l'image en taille réelle est envoyée en arrière-plan dès qu'une connexion est disponible, et la photo affiche **En attente d'envoi** d'ici là.

Touchez une photo pour l'ouvrir dans la visionneuse, qui charge l'image en taille réelle la première fois et la conserve sur l'appareil. **Supprimer la photo** dans la visionneuse, ou le bouton de retrait sur une photo pendant que vous modifiez la visite, la supprime définitivement, sur tous les appareils. Si quelque chose demande un suivi, ajoutez une [tâche](./tasks.md) avec une échéance.

## Le journal des visites

La page de la ruche affiche les cinq visites les plus récentes, la plus récente en premier, chacune résumée par des vignettes ; **Voir les N visites** ouvre le journal complet, et **Plus → Fiche de ruche** imprime toutes les visites sous forme de tableau.

Le journal vous permet de repérer des tendances : le couvain qui se développe au printemps, les réserves qui diminuent avant l'hiver, un comptage de varroa qui augmente.

## Corriger ou supprimer une visite \{#correcting}

Chaque visite du journal dispose d'une action de modification et d'une action de suppression.

- **Modifier la visite** ouvre le formulaire avec les valeurs enregistrées. Changez ce qui était erroné, y compris la date, et enregistrez. Seuls les champs que vous avez modifiés sont enregistrés : une correction n'écrase donc pas ce que quelqu'un d'autre a modifié entre-temps. Si deux appareils corrigent le même champ, la modification la plus récente l'emporte.
- **Supprimer** demande une confirmation qui mentionne la date de la visite. Ensuite, une barre propose **Annuler** pendant quelques secondes. Supprimer une visite la retire aussi de l'historique et des graphiques de la ruche.

## Relevés de capteur \{#sensor-readings}

Les relevés qu'une balance ou un capteur envoie via l'API sont stockés comme des visites marquées **Relevé de capteur**. Ils noieraient les visites que vous avez faites vous-même, donc :

- la page de la ruche ne liste que les visites enregistrées par une personne, tout comme le journal complet tant que vous n'y cochez pas **Afficher les relevés de capteur** (le libellé indique combien il y en a),
- la « dernière visite », la liste des ruches et la liste des visites à effectuer de la Vue d'ensemble les ignorent,
- les graphiques **Évolution** les incluent.

## Conseils pour une saisie rapide sur le terrain

- **Scannez l'étiquette QR** pour ouvrir la bonne ruche sans faire défiler.
- **Consignez au fur et à mesure.** Touchez les champs entre deux cadres plutôt que de tout reconstituer après coup.
- **Appuyez-vous sur le trio rapide.** Œufs vus, larve la plus jeune et couvain operculé confirment une reine en ponte plus vite que de la traquer.
- **Gardez les notes courtes.** Notez brièvement maintenant ; développez à la maison.
- **Laissez des champs vides.** N'enregistrez que ce que vous avez vérifié.
- **Photographiez ce qui est douteux.** Une photo d'un couvain à l'aspect étrange vaut plus qu'une description tapée.

:::caution
Si vous suspectez une maladie à déclaration obligatoire comme la loque américaine ou européenne, photographiez, refermez et suivez vos règles locales de déclaration. Voir [Maladies et parasites](../knowledge-base/diseases-and-pests.md).
:::

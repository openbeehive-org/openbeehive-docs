---
sidebar_position: 6
title: "Codes QR et liens profonds"
---

# Codes QR et liens profonds

Chaque ruche peut porter une étiquette QR imprimée. La scanner ouvre
l'application sur cette ruche. Le code se trouve dans `app/src/lib/qr.ts`,
`app/src/lib/components/QrLabel.svelte`, `app/src/routes/h/[id]/+page.svelte`
et `app/src/routes/(app)/scan/+page.svelte`.

## Ce qu'encode un QR de ruche

```text
<base>/h/<hiveId>
```

- `<base>` est `BEEHIVE_PUBLIC_URL` s'il a été défini au moment du build de la
  SPA (Vite expose les variables `BEEHIVE_*`), sinon l'origine sur laquelle
  l'application s'exécute. Une instance auto-hébergée imprime donc des codes qui
  pointent vers elle-même.
- `<hiveId>` est l'UUID de la ruche, frappé sur l'appareil lors de la création
  de la ruche et jamais réassigné, de sorte qu'une étiquette imprimée reste
  valide.

L'id encode une ruche, pas une permission. Connaître un id n'accorde rien ; la
ruche ne se résout que si son rucher a été synchronisé sur l'appareil.

## Comment `/h/[id]` se résout

La route est un résolveur, pas une page :

1. Rechercher l'id dans la base de données locale (`hives.get`).
2. S'il est absent et que le navigateur est en ligne, exécuter `syncOnce()` et
   chercher à nouveau.
3. S'il est trouvé, `goto('/hives/<id>')` avec `replaceState`.
4. Sinon, afficher « introuvable » (en ligne) ou « hors ligne » (pas de
   connexion).

```text
scan QR -> /h/<id> -> local lookup
                          |
              found ------+------ not found
                |                    |
          /hives/<id>          online? sync, re-check
                                     |
                          found -> /hives/<id>
                          still missing -> "not found" / "offline"
```

Une ruche déjà présente sur l'appareil se résout sans aller-retour réseau.

## Rendu et impression

`qrSvg(text, size)` rend le QR sous forme de chaîne SVG sur l'appareil à l'aide
du paquet `qrcode` avec le niveau de correction d'erreur H, place la marque
Openbeehive au centre et le nom de la marque en dessous. Aucun appel réseau
n'est impliqué.

`shortCode(hiveId)` correspond aux six premiers caractères de l'id sans tirets,
en majuscules. Il est imprimé sous le QR comme légende lisible par un humain et
utilisé dans le nom du fichier SVG. Il sert uniquement à l'affichage ; rien ne
route dessus et ce n'est pas une colonne de base de données.

`QrLabel` affiche le QR avec le nom de la ruche et le code court, ouvre une
fenêtre d'impression épurée (`Print`) et télécharge le SVG (`SVG`). Il apparaît
sur la page de détail de la ruche `/hives/[id]`.

## Analyser les charges utiles scannées

`parseHiveId(payload)` accepte trois formes et renvoie l'id ou `null` :

| Entrée | Exemple |
| --- | --- |
| Toute URL contenant `/h/<id>` | `https://bees.example.com/h/2b1f6c0e-...` |
| Schéma personnalisé | `openbeehive://hive/2b1f6c0e-...` |
| UUID nu | `2b1f6c0e-...` |

Le schéma personnalisé est analysé mais rien dans l'application ne le génère ;
les étiquettes imprimées utilisent toujours la forme `https://` afin de s'ouvrir
dans un navigateur lorsque l'application n'est pas installée.

## Scanner intégré à l'application

`/scan` utilise l'API `BarcodeDetector` du navigateur (`formats: ['qr_code']`)
sur un flux vidéo de la caméra arrière et appelle `parseHiveId` sur chaque code
détecté, puis navigue vers `/hives/<id>`. Là où `BarcodeDetector` n'est pas
disponible (iOS Safari), la page affiche un message « non pris en charge » et
l'application appareil photo du téléphone est le moyen de scanner ; le QR est
une simple URL et ouvre la même route. Une bibliothèque de décodage telle que
`@zxing/browser` pourrait être ajoutée pour ces plateformes ; aucune n'est
embarquée.

Le scanner a besoin de la permission de la caméra et d'un contexte sécurisé
(HTTPS ou `localhost`).

## Enveloppes d'application native

L'application est une PWA et aucune enveloppe native n'existe. Si vous en
construisez une, le chemin `/h/*` est celui à revendiquer avec Android App Links
ou iOS Universal Links ; le serveur ne sert pas
`/.well-known/assetlinks.json` ni
`/.well-known/apple-app-site-association`, vous devrez donc les ajouter
vous-même au niveau du reverse proxy.

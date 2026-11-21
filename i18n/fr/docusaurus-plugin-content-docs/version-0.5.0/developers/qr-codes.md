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
2. S'il est trouvé, `goto('/hives/<id>')` avec `replaceState`.
3. S'il est absent, attendre la fin du premier téléchargement de l'appareil et
   chercher à nouveau.
4. S'il est toujours absent, en déterminer la raison et l'indiquer : l'appareil
   est hors ligne, ce navigateur n'est pas connecté (typique lorsque
   l'application appareil photo du téléphone ouvre le lien dans le navigateur
   alors que l'utilisateur travaille dans l'application installée), le serveur
   est injoignable, ou la ruche ne fait pas partie de l'espace actif.

```text
scan QR -> /h/<id> -> local lookup
                          |
              found ------+------ not found
                |                    |
          /hives/<id>          sync, re-check
                                     |
                          found -> /hives/<id>
                          still missing -> offline / signed out /
                                           server unreachable / not in your data
```

Une ruche déjà présente sur l'appareil se résout sans aller-retour réseau.

## Rendu et impression

`qrSvg(text, size)` rend le QR sous forme de chaîne SVG sur l'appareil à l'aide
du paquet `qrcode` avec le niveau de correction d'erreur H, place la marque
Openbeehive au centre et le nom de la marque en dessous. Aucun appel réseau
n'est impliqué.

`shortCode(hiveId)` correspond aux six premiers caractères de l'id sans tirets,
en majuscules. Il est imprimé sous le QR comme légende lisible par un humain et
utilisé dans le nom du fichier SVG. Ce n'est pas une colonne de base de données
et aucune URL ne route dessus ; le champ de code du scanner et la recherche de
la liste des ruches le comparent au début des ids des ruches présentes sur
l'appareil.

`QrLabel` affiche le QR avec le nom de la ruche et le code court, ouvre une
fenêtre d'impression épurée (`Print`) et télécharge le SVG (`SVG`). Il apparaît
sur la page de détail de la ruche `/hives/[id]`. `QrSheet` est la feuille A4
pour toutes les ruches d'un rucher ; elle s'imprime depuis la page du rucher
elle-même. Les noms de ruche et de rucher sont échappés partout où ils sont
écrits dans le balisage des étiquettes ou de l'impression.

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

`/scan` lit un flux vidéo de la caméra arrière et appelle `parseHiveId` sur
chaque code détecté, puis navigue vers `/hives/<id>`. Il utilise l'API
`BarcodeDetector` du navigateur (`formats: ['qr_code']`) là où elle existe et se
replie ailleurs (Safari sur iOS, Firefox) sur le décodeur `@zxing/browser`
embarqué, chargé à la demande. Un code qui n'est pas une étiquette de ruche est
signalé comme tel. Sous l'image de la caméra, un formulaire accepte le code
court de six caractères et ouvre la ruche dont l'id commence par celui-ci,
recherchée dans la base de données locale ; cela couvre aussi les appareils sans
caméra et les accès à la caméra bloqués.

Le scanner a besoin de la permission de la caméra et d'un contexte sécurisé
(HTTPS ou `localhost`).

## Enveloppes d'application native

L'application est une PWA et aucune enveloppe native n'existe. Si vous en
construisez une, le chemin `/h/*` est celui à revendiquer avec Android App Links
ou iOS Universal Links ; le serveur ne sert pas
`/.well-known/assetlinks.json` ni
`/.well-known/apple-app-site-association`, vous devrez donc les ajouter
vous-même au niveau du reverse proxy.

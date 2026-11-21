---
sidebar_position: 6
title: "Codici QR e deep link"
---

# Codici QR e deep link

Ogni arnia può portare un'etichetta QR stampata. Scansionandola l'app si apre su
quell'arnia. Il codice è in `app/src/lib/qr.ts`, `app/src/lib/components/QrLabel.svelte`,
`app/src/routes/h/[id]/+page.svelte` e `app/src/routes/(app)/scan/+page.svelte`.

## Cosa codifica un QR di arnia

```text
<base>/h/<hiveId>
```

- `<base>` è `BEEHIVE_PUBLIC_URL` se era impostato al momento della build della
  SPA (Vite espone le variabili `BEEHIVE_*`), altrimenti l'origine su cui gira
  l'app. Un'istanza self-hosted stampa quindi codici che puntano a sé stessa.
- `<hiveId>` è l'UUID dell'arnia, generato sul dispositivo quando l'arnia viene
  creata e mai riassegnato, così un'etichetta stampata resta valida.

L'id codifica un'arnia, non un permesso. Conoscere un id non concede nulla;
l'arnia si risolve solo se il suo apiario è stato sincronizzato sul dispositivo.

## Come si risolve `/h/[id]`

La rotta è un risolutore, non una pagina:

1. Cerca l'id nel database locale (`hives.get`).
2. Se trovata, `goto('/hives/<id>')` con `replaceState`.
3. Se manca, attende che il primo download del dispositivo sia terminato e
   cerca di nuovo.
4. Se manca ancora, ne individua il motivo e lo dice: il dispositivo è
   offline, questo browser non ha effettuato l'accesso (tipico quando l'app
   fotocamera del telefono apre il link nel browser mentre l'utente lavora
   nell'app installata), il server non è raggiungibile, oppure l'arnia non fa
   parte dello spazio attivo.

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

Un'arnia già presente sul dispositivo si risolve senza alcuna richiesta di rete.

## Rendering e stampa

`qrSvg(text, size)` renderizza il QR come stringa SVG sul dispositivo usando il
pacchetto `qrcode` con livello di correzione degli errori H, colloca il marchio
Openbeehive al centro e il nome del brand sotto. Non c'è alcuna chiamata di rete.

`shortCode(hiveId)` è composto dai primi sei caratteri dell'id senza trattini, in
maiuscolo. Viene stampato sotto il QR come didascalia leggibile e usato nel nome
del file SVG. Non è una colonna del database e nessun URL instrada su di esso;
il campo del codice dello scanner e la ricerca dell'elenco delle arnie lo
confrontano con l'inizio degli id delle arnie presenti sul dispositivo.

`QrLabel` mostra il QR con il nome dell'arnia e il codice breve, apre una
finestra di stampa pulita (`Print`) e scarica l'SVG (`SVG`). Compare nella
pagina di dettaglio dell'arnia `/hives/[id]`. `QrSheet` è il foglio A4 per
tutte le arnie di un apiario; viene stampato dalla pagina stessa dell'apiario.
I nomi di arnie e apiari vengono sottoposti a escape ovunque vengano scritti
nel markup delle etichette o di stampa.

## Analisi dei payload scansionati

`parseHiveId(payload)` accetta tre forme e restituisce l'id oppure `null`:

| Input | Esempio |
| --- | --- |
| Qualsiasi URL contenente `/h/<id>` | `https://bees.example.com/h/2b1f6c0e-...` |
| Schema personalizzato | `openbeehive://hive/2b1f6c0e-...` |
| UUID nudo | `2b1f6c0e-...` |

Lo schema personalizzato viene analizzato ma nulla nell'app lo genera; le
etichette stampate usano sempre la forma `https://`, così si aprono in un
browser quando l'app non è installata.

## Scanner integrato nell'app

`/scan` legge un flusso video della fotocamera posteriore e chiama
`parseHiveId` su ogni codice rilevato, poi naviga a `/hives/<id>`. Usa l'API
`BarcodeDetector` del browser (`formats: ['qr_code']`) dove esiste e ripiega
altrove (Safari su iOS, Firefox) sul decoder `@zxing/browser` incluso nel
bundle, caricato su richiesta. Un codice che non è un'etichetta di arnia viene
segnalato come tale. Sotto l'immagine della fotocamera un modulo accetta il
codice breve di sei caratteri e apre l'arnia il cui id inizia con esso,
cercata nel database locale; questo copre anche i dispositivi senza fotocamera
e l'accesso alla fotocamera bloccato.

Lo scanner ha bisogno del permesso della fotocamera e di un contesto sicuro
(HTTPS o `localhost`).

## Wrapper nativi

L'app è una PWA e non esiste alcun wrapper nativo. Se ne costruisci uno, il
percorso `/h/*` è quello da rivendicare con Android App Links o iOS Universal
Links; il server non serve `/.well-known/assetlinks.json` né
`/.well-known/apple-app-site-association`, quindi dovresti aggiungerli tu
stesso nel reverse proxy.

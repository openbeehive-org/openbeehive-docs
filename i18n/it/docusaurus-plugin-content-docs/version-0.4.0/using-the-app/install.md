---
sidebar_position: 11
title: "Installare l'app"
---

# Installare l'app

Openbeehive è una Progressive Web App (PWA). Questo significa che non hai bisogno
di uno store, di un download o di un account solo per iniziare. La apri nel tuo
browser e, con un solo tocco, la aggiungi al tuo dispositivo così che si comporti
come qualsiasi altra app: una propria icona, una finestra a schermo intero e pieno
supporto offline.

L'installazione è facoltativa ma consigliata. Una volta installata, l'app si
avvia all'istante, nasconde la barra degli indirizzi del browser e mantiene i
tuoi registri disponibili anche quando sei in apiario senza segnale.

## Cosa ottieni installando

- **Un'icona dell'app** sulla tua schermata iniziale o nell'avvio applicazioni.
- **Una finestra a schermo intero** senza elementi del browser, così c'è più
  spazio per le tue arnie e ispezioni.
- **Accesso offline.** I tuoi registri vivono in un database locale sul
  dispositivo e si sincronizzano in background. Vedi
  [Offline e sincronizzazione](/using-the-app/offline-and-sync).
- **Scansione QR rapida.** Scansionare l'[etichetta QR](/using-the-app/qr-labels)
  di un'arnia apre quell'arnia.

:::tip
Puoi continuare a usare Openbeehive in una normale scheda del browser senza
installarla. Le funzioni sono le stesse; l'installazione la fa solo sembrare
un'app nativa ed è più comoda sul campo.
:::

## Installare su iPhone e iPad (Safari)

1. Apri **Safari** e vai su [app.openbeehive.org](https://app.openbeehive.org).
2. Tocca il pulsante **Condividi** (il quadrato con una freccia verso l'alto).
3. Scorri verso il basso e tocca **Aggiungi alla schermata Home**.
4. Modifica il nome se vuoi, poi tocca **Aggiungi**.

L'icona di Openbeehive ora si trova sulla tua schermata iniziale. Avviala da lì
per ottenere l'esperienza a schermo intero e offline.

:::note
Su iOS l'opzione di installazione si trova nel menu Condividi di Safari. Gli altri
browser su iPhone e iPad non possono installare web app, quindi usa Safari per
questo passaggio.
:::

## Installare su Android (Chrome)

1. Apri **Chrome** e vai su [app.openbeehive.org](https://app.openbeehive.org).
2. Tocca il **menu** (tre puntini) nell'angolo in alto a destra.
3. Tocca **Installa app** (o **Aggiungi a schermata Home**).
4. Conferma toccando **Installa**.

Potresti anche vedere un avviso o un banner che propone di installare Openbeehive
direttamente. Toccandolo si ottiene lo stesso risultato.

## Installare su desktop (Chrome, Edge e altri)

Sulla maggior parte dei browser desktop, un'icona di installazione compare
all'estremità destra della barra degli indirizzi quando visiti l'app.

1. Vai su [app.openbeehive.org](https://app.openbeehive.org).
2. Fai clic sull'**icona di installazione** nella barra degli indirizzi (spesso
   ha l'aspetto di un piccolo monitor o di una freccia verso il basso dentro un
   vassoio).
3. Fai clic su **Installa** per confermare.

Se non vedi l'icona, apri il menu del browser e cerca **Installa Openbeehive** o
**App -> Installa questo sito come app**. L'app si apre quindi nella propria
finestra e compare insieme alle tue altre applicazioni.

| Piattaforma | Browser | Dove trovare l'opzione di installazione |
| --- | --- | --- |
| iOS / iPadOS | Safari | Menu Condividi -> Aggiungi alla schermata Home |
| Android | Chrome | Menu (tre puntini) -> Installa app |
| Windows / Linux | Chrome / Edge | Icona di installazione nella barra degli indirizzi |
| macOS | Chrome / Edge | Icona di installazione nella barra degli indirizzi |
| macOS | Safari | File -> Aggiungi al Dock |

## Installare un'istanza self-hosted

Se gestisci il tuo server Openbeehive, l'app si installa esattamente allo stesso
modo. Punta semplicemente il browser all'indirizzo del tuo server anziché al
servizio ospitato, poi segui gli stessi passaggi sopra per la tua piattaforma.

Ad esempio, apri la tua istanza al suo `BEEHIVE_PUBLIC_BASE_URL` (come
`https://bees.example.com`) e usa **Aggiungi alla schermata Home** o l'opzione di
installazione del browser. L'app installata comunica quindi con il tuo server, e i
tuoi registri restano sulla tua infrastruttura.

:::caution
Affinché l'installazione funzioni senza problemi, un'istanza self-hosted dovrebbe
essere servita su **HTTPS** con un certificato valido. La maggior parte dei
browser offre l'installazione PWA solo su origini sicure. Vedi
[Reverse proxy](/self-hosting/reverse-proxy) per come mettere il TLS davanti al
tuo server.
:::

Se fai self-hosting, la sezione [Self-hosting](/category/self-hosting) illustra
deployment, configurazione e backup.

## Aggiornare l'app

La PWA si aggiorna da sola. Quando viene pubblicata una nuova versione, l'app la
scarica in background e la applica al successivo avvio o ricaricamento. Non hai
bisogno di reinstallarla. Se vuoi mai essere sicuro di avere l'ultima versione,
chiudi completamente l'app e riaprila.

## Rimuovere l'app

Disinstallare la PWA rimuove solo la scorciatoia dell'app e la sua cache locale;
non elimina i registri che sono già stati sincronizzati con il server. Per
disinstallare:

- **iOS / Android:** tieni premuta l'icona, poi scegli **Rimuovi** o
  **Disinstalla**.
- **Desktop:** apri l'app, poi usa il menu della sua finestra (o le impostazioni
  delle app del browser) e scegli **Disinstalla**.

:::caution
Se hai registri non ancora sincronizzati quando disinstalli, essi vivono solo nel
database locale del dispositivo e potrebbero andare persi. Assicurati che l'app si
sia sincronizzata prima di rimuoverla. Vedi
[Offline e sincronizzazione](/using-the-app/offline-and-sync).
:::

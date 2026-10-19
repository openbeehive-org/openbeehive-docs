---
sidebar_position: 5
title: "FAQ"
---

# Domande frequenti

Risposte rapide alle domande che sentiamo più spesso. Se manca qualcosa, consulta la [guida alla risoluzione dei problemi](/knowledge-base/troubleshooting) o chiedi alla community su [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Openbeehive è gratuito?

Sì. Openbeehive è open source con licenza **AGPL-3.0**, quindi sei libero di usarlo, studiarlo, modificarlo e ospitarlo autonomamente.

Il servizio ospitato su [app.openbeehive.org](https://app.openbeehive.org) è gratuito per ora, finché il progetto è giovane. Se ciò dovesse mai cambiare, potrai sempre esportare i tuoi dati ed eseguire invece la tua istanza.

## I miei dati sono privati?

I tuoi registri risiedono prima di tutto sul tuo dispositivo. Openbeehive è **offline-first**: l'app memorizza tutto in un database locale sul tuo telefono, tablet o computer, e si sincronizza con il server solo in background.

Se ospiti autonomamente, i tuoi dati non lasciano mai la tua infrastruttura. Sul servizio ospitato, i tuoi registri sono memorizzati sui nostri server così da poter sincronizzare tra i tuoi dispositivi, ma restano tuoi.

:::tip
Vuoi il pieno controllo? Vedi [Self-hosting](/category/self-hosting) per eseguire Openbeehive sul tuo hardware.
:::

## Funziona offline?

Sì, completamente. Openbeehive è una Progressive Web App (PWA) che mantiene una copia completa dei tuoi dati sul dispositivo. La lettura e la scrittura dei registri sono locali e istantanee, quindi funziona perfettamente in un apiario senza segnale.

Quando recuperi la connettività, le tue modifiche si sincronizzano automaticamente. Leggi di più in [Offline e sincronizzazione](/using-the-app/offline-and-sync).

## Funziona sul mio telefono?

Sì. Openbeehive funziona in qualsiasi browser moderno e può essere installato nella schermata Home così da comportarsi come un'app. Funziona su telefoni, tablet e desktop. Vedi [Installare l'app](/using-the-app/install) per i passaggi su ciascuna piattaforma.

## Esiste un'app nativa?

Oggi non esiste un'app nativa separata nell'App Store o nel Play Store, e non te ne serve una. La PWA installabile ti offre un'icona dell'app, l'uso offline e la modalità a schermo intero su iOS, Android, Windows, macOS e Linux da un'unica base di codice.

## Posso esportare i miei dati?

Sì. Poiché il progetto è open source e i tuoi dati sono memorizzati in un database SQLite standard, non sei mai vincolato.

- Chi **ospita autonomamente** può effettuare il backup del database direttamente. Vedi [Backup](/self-hosting/backups).
- Sul **servizio ospitato**, gli strumenti di esportazione fanno parte della roadmap. I tuoi registri sono inoltre conservati localmente su ciascun dispositivo sincronizzato.

## Posso ospitarlo autonomamente?

Assolutamente, ed è progettato per essere facile. Ci sono due profili di distribuzione:

| Profilo | Ideale per | Stack |
| --- | --- | --- |
| `selfhost` | Hobbisti, utente singolo | Un unico binario, SQLite + file locali, nessun Docker necessario |
| `cloud` | Multiutente, configurazioni più grandi | Docker, PostgreSQL + archiviazione S3/MinIO |

Inizia con la [Guida rapida](/self-hosting/quick-start), oppure salta alla [guida al binario singolo](/self-hosting/single-binary).

:::note
Per un'istanza privata a utente singolo puoi disabilitare del tutto il login. Vedi [Autenticazione](/self-hosting/authentication).
:::

## Come funziona la condivisione?

La condivisione avviene a livello di **apiario** tramite gli "scope". Quando condividi un apiario, le persone con cui lo condividi possono vedere e contribuire a tutto ciò che contiene: i suoi alveari, le regine, le ispezioni, le attività e altro ancora.

La sincronizzazione è priva di conflitti per progettazione, quindi due persone che modificano lo stesso apiario su dispositivi diversi non sovrascriveranno il lavoro l'una dell'altra. Le modifiche si fondono in modo pulito anche dopo lunghi periodi offline. I dettagli tecnici sono trattati nel [protocollo di sincronizzazione](/developers/sync-protocol).

## Quali tipi di alveare sono supportati?

Openbeehive supporta i sistemi a telaino e top-bar più comuni:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Altro

Vedi [Tipi di alveare](/knowledge-base/hive-types) per le indicazioni sulla scelta.

## Come vengono marcate le regine?

Openbeehive segue lo schema internazionale dei colori di marcatura delle regine, basato sull'ultima cifra dell'anno:

| L'anno termina in | Colore |
| --- | --- |
| 1 o 6 | Bianco |
| 2 o 7 | Giallo |
| 3 o 8 | Rosso |
| 4 o 9 | Verde |
| 5 o 0 | Blu |

L'app sceglie automaticamente il colore giusto per te. Tutti i dettagli sono nella pagina [colori di marcatura delle regine](/knowledge-base/queen-marking-colours).

## A cosa servono le etichette QR?

Ogni alveare può avere un'etichetta QR stampabile. Scansionandola si apre Openbeehive direttamente su quell'alveare, così puoi richiamarne i registri nell'apiario senza digitare o cercare. Vedi [Etichette QR](/using-the-app/qr-labels).

## In quali lingue è disponibile?

Openbeehive viene sviluppato pensando all'internazionalizzazione, con tedesco e inglese come primo focus date le origini del progetto. Lingue aggiuntive sono benvenute come contributi della community.

## Quali database e backend di archiviazione sono supportati?

In self-hosting, il backend è modulare:

- **Database:** PostgreSQL, MySQL o SQLite. Vedi [Database](/self-hosting/databases).
- **Archiviazione blob:** archiviazione di oggetti compatibile con MinIO/S3, o il filesystem locale. Vedi [Archiviazione](/self-hosting/storage).

## Come accedo?

Il servizio ospitato usa il login OIDC (accedi con un provider supportato), con passkey opzionali (WebAuthn) per un'esperienza senza password. Chi ospita autonomamente può configurare i propri provider OIDC, abilitare le passkey o disattivare del tutto il login per le configurazioni a utente singolo. Vedi [Autenticazione](/self-hosting/authentication).

## Come segnalo un bug o richiedo una funzionalità?

Apri una issue sulla nostra [organizzazione GitHub](https://github.com/openbeehive-org/openbeehive-app). Passaggi chiari per riprodurre il problema, la tua piattaforma e il tuo browser, e uno screenshot aiutano enormemente.

La [pagina di risoluzione dei problemi](/knowledge-base/troubleshooting) potrebbe già coprire i problemi comuni.

## Come posso contribuire?

Sono benvenuti contributi di ogni tipo: codice, documentazione, traduzioni, segnalazioni di bug e idee. Lo stack è Go nel backend e una PWA SvelteKit nel frontend.

Leggi la [guida per i contributori](/developers/contributing) per iniziare, e dai un'occhiata alla [panoramica dell'architettura](/developers/architecture) per capire come si incastrano i pezzi.

## Quale versione è questa?

La versione attuale è la **v0.1.0**, il nostro primo rilascio pubblico. Aspettati miglioramenti rapidi, e consulta la [guida all'aggiornamento](/self-hosting/upgrading) quando arriveranno nuove versioni.

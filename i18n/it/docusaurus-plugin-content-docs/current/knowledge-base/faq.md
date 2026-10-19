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

I tuoi registri risiedono prima di tutto sul tuo dispositivo: l'app memorizza tutto in un database locale sul tuo telefono, tablet o computer e si sincronizza con il server in background.

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

Sì. **Impostazioni → Dati e backup** esporta tutto ciò che è sul tuo dispositivo come backup completo JSON, foglio di calcolo (XLSX), file CSV in uno ZIP, BeeXML o report PDF stampabile, e importa JSON, BeeXML e CSV da altre app. Vedi [Importazione ed esportazione](/using-the-app/import-export). Chi ospita autonomamente può anche effettuare il backup del database del server direttamente; vedi [Backup](/self-hosting/backups).

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

I registri si condividono tramite i **tenant**. Ogni account ha un tenant personale e può essere invitato in altri, per esempio quello di un club. Tutti i membri di un tenant vedono e modificano tutti i suoi apiari, alveari e registri; non esiste una condivisione per singolo apiario. La sincronizzazione è priva di conflitti, quindi due persone che modificano nello stesso tenant su dispositivi diversi non sovrascrivono il lavoro l'una dell'altra. Vedi [Account e tenant](/using-the-app/accounts-tenants).

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

L'app include cinque lingue: inglese, tedesco, francese, spagnolo e italiano. Cambia lingua da **Impostazioni → Lingua**. Ulteriori traduzioni sono benvenute come contributi.

## Quali database e backend di archiviazione sono supportati?

In self-hosting, il backend è modulare:

- **Database:** PostgreSQL, MySQL o SQLite. Vedi [Database](/self-hosting/databases).
- **Archiviazione blob:** archiviazione di oggetti compatibile con MinIO/S3, o il filesystem locale. Vedi [Archiviazione](/self-hosting/storage).

## Come accedo?

Il servizio ospitato usa account con e-mail e password. Chi ospita autonomamente può abilitare gli account con e-mail e password, aggiungere provider OIDC (Google, Keycloak, Authentik e simili), abilitare le passkey o disattivare del tutto il login per una configurazione a utente singolo. Vedi [Autenticazione](/self-hosting/authentication).

## Come segnalo un bug o richiedo una funzionalità?

Apri una issue nel [repository GitHub](https://github.com/openbeehive-org/openbeehive-app). Passaggi chiari per riprodurre il problema, la tua piattaforma e il tuo browser, e uno screenshot aiutano.

La [pagina di risoluzione dei problemi](/knowledge-base/troubleshooting) potrebbe già coprire i problemi comuni.

## Come posso contribuire?

Sono benvenuti contributi di ogni tipo: codice, documentazione, traduzioni, segnalazioni di bug e idee. Lo stack è Go nel backend e una PWA SvelteKit nel frontend.

## Quale versione è questa?

Le versioni sono taggate su [GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Chi ospita autonomamente esegue il tag che ha compilato o il tag dell'immagine che ha scaricato; consulta la [guida all'aggiornamento](/self-hosting/upgrading) quando arrivano nuove versioni.

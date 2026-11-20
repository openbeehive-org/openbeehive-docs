---
sidebar_position: 5
title: "FAQ"
---

# Domande frequenti

Risposte rapide alle domande che sentiamo più spesso. Se manca qualcosa, consulta la [guida alla risoluzione dei problemi](./troubleshooting.md) o chiedi alla community su [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Openbeehive è gratuito?

Sì. Openbeehive è open source con licenza **AGPL-3.0**, quindi sei libero di usarlo, studiarlo, modificarlo e ospitarlo autonomamente.

Il servizio ospitato su [app.openbeehive.org](https://app.openbeehive.org) è gratuito per ora, finché il progetto è giovane, e attualmente solo su invito: scrivi a [contact@openbeehive.org](mailto:contact@openbeehive.org) per ricevere un invito, oppure dai prima un'occhiata con il pulsante **Prova la demo** nella sua pagina di accesso. Se le condizioni dovessero mai cambiare, potrai sempre esportare i tuoi dati ed eseguire invece la tua istanza.

## I miei dati sono privati?

I tuoi registri risiedono prima di tutto sul tuo dispositivo: l'app memorizza tutto in un database locale sul tuo telefono, tablet o computer e si sincronizza con il server in background.

Se ospiti autonomamente, i tuoi dati non lasciano mai la tua infrastruttura. Sul servizio ospitato, i tuoi registri sono memorizzati sui nostri server così da poter sincronizzare tra i tuoi dispositivi, ma restano tuoi.

Gli unici servizi esterni che l'app contatta riguardano la mappa: le tessere e la ricerca dell'indirizzo nel modulo dell'apiario provengono da OpenStreetMap, a meno che l'operatore non ne abbia configurati altri o non abbia disattivato la mappa.

:::tip
Vuoi il pieno controllo? Vedi [Self-hosting](/category/self-hosting) per eseguire Openbeehive sul tuo hardware.
:::

## Funziona offline?

Sì, completamente. Openbeehive è una Progressive Web App (PWA) che mantiene una copia completa dei tuoi dati sul dispositivo. La lettura e la scrittura dei registri sono locali e istantanee, quindi funziona perfettamente in un apiario senza segnale.

Quando recuperi la connettività, le tue modifiche si sincronizzano automaticamente. Leggi di più in [Offline e sincronizzazione](../using-the-app/offline-and-sync.md).

## Funziona sul mio telefono?

Sì. Openbeehive funziona in qualsiasi browser moderno e può essere installato nella schermata Home così da comportarsi come un'app. Funziona su telefoni, tablet e desktop. Vedi [Installare l'app](../using-the-app/install.md) per i passaggi su ciascuna piattaforma.

## Esiste un'app nativa?

Oggi non esiste un'app nativa separata nell'App Store o nel Play Store, e non te ne serve una. La PWA installabile ti offre un'icona dell'app, l'uso offline e la modalità a schermo intero su iOS, Android, Windows, macOS e Linux da un'unica base di codice.

## Posso esportare i miei dati?

Sì. **Impostazioni → Dati e backup** esporta uno spazio come backup completo (JSON, oppure uno ZIP con le foto), foglio di calcolo (XLSX), file CSV in uno ZIP, BeeXML o report PDF stampabile, e può anche scaricare la copia dello spazio conservata sul server. Importa backup, BeeXML e CSV da altre app, mostra prima un'anteprima e non sovrascrive nulla a meno che tu non lo chieda. Vedi [Importazione ed esportazione](../using-the-app/import-export.md). Chi ospita autonomamente fa il backup del database del server e dell'archivio delle foto; vedi [Backup](../self-hosting/backups.md).

## Posso ospitarlo autonomamente?

Assolutamente, ed è progettato per essere facile. Ci sono due profili di distribuzione:

| Profilo | Ideale per | Stack |
| --- | --- | --- |
| `selfhost` | Hobbisti, utente singolo | Un unico binario, SQLite + file locali, nessun Docker necessario |
| `cloud` | Più utenti, configurazioni più grandi | Docker, PostgreSQL + archiviazione S3/MinIO |

Inizia con l'[Avvio rapido](../self-hosting/quick-start.md), oppure salta alla [guida al binario singolo](../self-hosting/single-binary.md).

:::note
Un'istanza privata a utente singolo funziona senza login per impostazione predefinita; attiva il login prima di condividerla. Vedi [Autenticazione](../self-hosting/authentication.md).
:::

## Come funziona la condivisione?

I registri si condividono tramite gli **spazi**. Ogni account ha uno spazio personale e può essere invitato in altri, per esempio quello di un club. Tutti i membri di uno spazio vedono e modificano tutti i suoi apiari, alveari e registri; non esiste una condivisione per singolo apiario. Fanno eccezione le attività: sono personali. La sincronizzazione è priva di conflitti, quindi due persone che modificano nello stesso spazio su dispositivi diversi non sovrascrivono il lavoro l'una dell'altra. Vedi [Account e spazi](../using-the-app/accounts-tenants.md).

## Quali tipi di alveare sono supportati?

Openbeehive supporta i sistemi a telaino e top-bar più comuni:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Altro

Vedi [Tipi di alveare](./hive-types.md) per le indicazioni sulla scelta.

## Come vengono marcate le regine?

Openbeehive segue lo schema internazionale dei colori di marcatura delle regine, basato sull'ultima cifra dell'anno:

| L'anno termina in | Colore |
| --- | --- |
| 1 o 6 | Bianco |
| 2 o 7 | Giallo |
| 3 o 8 | Rosso |
| 4 o 9 | Verde |
| 5 o 0 | Blu |

L'app sceglie automaticamente il colore giusto per te. Tutti i dettagli sono nella pagina [colori di marcatura delle regine](./queen-marking-colours.md).

## A cosa servono le etichette QR?

Ogni alveare può avere un'etichetta QR stampabile. Scansionandola si apre Openbeehive direttamente su quell'alveare, così puoi richiamarne i registri nell'apiario senza digitare o cercare. Vedi [Etichette QR](../using-the-app/qr-labels.md).

## In quali lingue è disponibile?

L'app include cinque lingue: inglese, tedesco, francese, spagnolo e italiano. Cambia lingua da **Impostazioni → Lingua**; la scelta viene salvata nel tuo account e ti segue su ogni dispositivo. Ulteriori traduzioni sono benvenute come contributi.

## Posso usare libbre e gradi Fahrenheit?

Sì. In **Impostazioni → Unità** scegli tra chilogrammi e libbre e tra Celsius e Fahrenheit. L'app mostra e accetta pesi e temperature in queste unità su tutti i tuoi dispositivi. I dati vengono salvati in chilogrammi e gradi Celsius, quindi le esportazioni e l'API restano nel sistema metrico. Vedi [Impostazioni](../using-the-app/dashboard.md#settings).

## Ho dimenticato la password. Che cosa faccio?

Tocca **Password dimenticata?** nella schermata di accesso. Se il server invia email, ricevi un link per sceglierne una nuova; altrimenti l'amministratore dell'istanza può creare un link di questo tipo per te. Vedi [Account e spazi](../using-the-app/accounts-tenants.md#password).

## Posso eliminare il mio account?

Sì, da **Impostazioni → Elimina l’account**. L'app mostra prima che cosa verrebbe eliminato e che cosa resta per gli altri membri. Vedi [Account e spazi](../using-the-app/accounts-tenants.md#delete-account).

## Quali database e backend di archiviazione sono supportati?

In self-hosting, il backend è modulare:

- **Database:** PostgreSQL, MariaDB o SQLite. Vedi [Database](../self-hosting/databases.md).
- **Archiviazione blob:** archiviazione di oggetti compatibile con MinIO/S3, o il filesystem locale. Vedi [Archiviazione](../self-hosting/storage.md).

## Come accedo?

Il servizio ospitato usa account con e-mail e password ed è solo su invito. Chi ospita autonomamente può abilitare gli account con e-mail e password, aggiungere provider OIDC (Google, Keycloak, Authentik e simili), abilitare le passkey o disattivare del tutto il login per una configurazione a utente singolo. Vedi [Autenticazione](../self-hosting/authentication.md).

## Come segnalo un bug o richiedo una funzionalità?

Apri una issue nel [repository GitHub](https://github.com/openbeehive-org/openbeehive-app). Passaggi chiari per riprodurre il problema, la tua piattaforma e il tuo browser, e uno screenshot aiutano.

La [pagina di risoluzione dei problemi](./troubleshooting.md) potrebbe già coprire i problemi comuni.

## Come posso contribuire?

Sono benvenuti contributi di ogni tipo: codice, documentazione, traduzioni, segnalazioni di bug e idee. Lo stack è Go nel backend e una PWA SvelteKit nel frontend.

## Quale versione è questa?

Le versioni sono taggate su [GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Chi ospita autonomamente esegue il tag che ha compilato o il tag dell'immagine che ha scaricato; consulta la [guida all'aggiornamento](../self-hosting/upgrading.md) quando arrivano nuove versioni.

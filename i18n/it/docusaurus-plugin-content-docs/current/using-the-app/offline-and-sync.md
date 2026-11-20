---
sidebar_position: 10
title: "Offline e sincronizzazione"
---

# Offline e sincronizzazione

Openbeehive è costruita per l'apiario, non per l'ufficio. Sul campo raramente hai un segnale affidabile, quindi l'app è **offline-first**: tutto ciò che fai viene salvato subito sul tuo dispositivo e sincronizzato con il server più tardi, in background.

L'app non ti fa mai aspettare la rete. Apri un'arnia, registra una visita, aggiungi un'attività, annota qualcosa sulla regina: tutto è istantaneo, con o senza segnale.

## Tutto viene salvato localmente

Openbeehive mantiene una copia completa dei tuoi registri in un piccolo database sul tuo dispositivo. Ogni lettura e ogni scrittura avviene prima su quella copia locale.

- **È veloce.** Aprire un'arnia o scorrere le visite non aspetta mai una barra di caricamento.
- **Funziona senza segnale.** Un bosco, una valle, una cantina piena di melari.
- **I tuoi dati sono tuoi.** I registri vivono sul tuo dispositivo; il server è la copia per la sincronizzazione e la condivisione.

:::tip
Poiché i registri sono memorizzati sul dispositivo, installa Openbeehive come app anziché usarla in una scheda del browser. Vedi [Installare Openbeehive](./install.md).
:::

## Lo stato della sincronizzazione \{#sync-status}

Un piccolo chip di stato in cima a ogni pagina (e sotto il tuo indirizzo e-mail nella barra laterale) dice se le modifiche di questo dispositivo hanno raggiunto il server:

| Il chip dice | Significato |
| --- | --- |
| **Sincronizzato** e un orario | Tutto ciò che è su questo dispositivo è sul server. |
| **Sincronizzazione…** | È in corso uno scambio con il server. |
| **In attesa di invio: 3** | Tre modifiche sono salvate sul dispositivo e non ancora inviate. |
| **Offline** oppure **Offline · 3 in attesa** | Nessuna connessione. Le modifiche attendono sul dispositivo. |
| **Sincronizzazione non riuscita · nuovo tentativo** | Il server non è stato raggiunto o ha risposto con un errore. L'app continua a riprovare. |
| **Disconnesso · accedi per sincronizzare** | La tua sessione è terminata. Tocca il chip per accedere; non si perde nulla. |
| **Problemi di sincronizzazione: 2** | Il server ha rifiutato due modifiche; vedi sotto. |
| **App non aggiornata · aggiornala per sincronizzare** | Il server richiede una versione più recente dell'app. Carica la nuova versione; fino ad allora le modifiche attendono sul dispositivo. |

Tocca il chip per sincronizzare subito. Anche senza toccarlo, l'app sincronizza dopo ogni modifica, a brevi intervalli mentre è aperta, e non appena torna la connessione.

Mentre il dispositivo non ha connessione, una barra in cima alla pagina dice inoltre "Offline: le modifiche vengono salvate e sincronizzate in seguito." È puramente informativo; continua esattamente come prima.

:::note
Un indicatore offline persistente di solito significa copertura debole in apiario. Se resta attivo anche con una buona connessione a casa, vedi [Risoluzione dei problemi](../knowledge-base/troubleshooting.md).
:::

### Problemi di sincronizzazione \{#sync-problems}

Di tanto in tanto il server non accetta una modifica, per esempio perché il dato appartiene a un altro spazio o perché l'orologio del dispositivo era molto avanti. Una modifica del genere non viene buttata via: resta sul dispositivo, e il chip mostra **Problemi di sincronizzazione** con il numero di modifiche rifiutate. L'elenco **Problemi di sincronizzazione** nelle **Impostazioni** le indica una per una con il motivo e offre **Riprova** (oppure **Riprova tutte**) e **Scarta**. Scarta interrompe l'invio; il dato resta su questo dispositivo così com'è ma non raggiunge mai il server, gli altri tuoi dispositivi o gli altri membri.

### Orologi dei dispositivi

Ogni modifica porta l'ora del dispositivo che l'ha fatta. Il server rifiuta le modifiche con una marca temporale più di 10 minuti avanti rispetto alla propria ora. L'app apprende l'ora del server a ogni sincronizzazione, compensa un orologio del dispositivo sbagliato, e marca e invia di nuovo da sola tali modifiche.

## La prima sincronizzazione su un nuovo dispositivo

Accedere su un nuovo dispositivo, o riaprire l'app dopo che la sua archiviazione è stata cancellata, inizia con un database locale vuoto. L'app carica dal server i dati attuali dello spazio, non l'intera storia di ogni modifica, e riempie il database in background:

- Le liste mostrano **segnaposto luccicanti** mentre leggono dal database locale.
- Finché il primo download è ancora in corso, la Panoramica e le liste di apiari, arnie e attività mostrano **"Sincronizzazione dei dati…"** anziché uno stato vuoto.
- I set di dati grandi compaiono **progressivamente**: ogni lotto ricevuto dall'app viene mostrato subito.

Solo quando l'app sa che i dati sono completi mostra un vero stato vuoto. Se il dispositivo è offline o il server non è raggiungibile, l'indicazione lascia il posto a ciò che è archiviato localmente.

Dopo che l'app si è aggiornata alla versione 0.5.0, ogni dispositivo carica ancora una volta i dati attuali dal server. Questo ripara le lacune che le versioni precedenti potevano lasciare e non richiede alcuna azione da parte tua. Lo stesso fa un dispositivo che non si sincronizza da più tempo di quanto il server conservi il suo elenco di modifiche (180 giorni per impostazione predefinita).

### Dopo il ripristino del server \{#after-restore}

Se l'operatore ripristina il server da un backup, al server possono mancare modifiche che il tuo dispositivo aveva già sincronizzato. L'app se ne accorge alla sincronizzazione successiva, carica di nuovo tutti i dati che ha, insieme alle foto che conserva, e scarica i dati attuali. Poi mostra "I dati del server sono stati reimpostati o ripristinati. Questo dispositivo ha inviato di nuovo i suoi dati e ha caricato quelli attuali." Non c'è nulla da fare; tocca **OK** per chiudere il messaggio.

## Sincronizzazione tra i tuoi dispositivi

Usa Openbeehive su più dispositivi, un telefono sul campo e un portatile a casa, e restano allineati. Ogni dispositivo mantiene la propria copia locale e scambia le modifiche con il server in background. Registra una visita sul telefono in apiario e, quando ti siedi al portatile, è già lì. Finché ogni dispositivo accede allo stesso account, vedono tutti gli stessi registri.

## Cosa succede quando due dispositivi cambiano la stessa cosa

Openbeehive risolve le modifiche sovrapposte **automaticamente**, senza richieste del tipo "quale versione vuoi mantenere?".

- **Tu modifichi la nota di un apiario sul telefono, il tuo co-apicoltore modifica la stessa nota sul suo.** La modifica più recente a quel campo prevale.
- **Aggiungete entrambi foto alla stessa visita mentre siete offline.** Entrambi i gruppi di foto vengono conservati.
- **Cambi le unità su un dispositivo.** Unità e lingua vengono salvate nel tuo account e ti seguono su ogni dispositivo; vedi [Impostazioni](./dashboard.md#settings).
- **Ciascuno di voi registra una visita separata.** Ogni visita, smielatura e trattamento è una registrazione a sé, quindi entrambe vengono mantenute affiancate.

Ogni dispositivo converge sullo stesso stato una volta che tutti si sono sincronizzati.

:::tip
In breve: aggiungi liberamente, modifica con sicurezza. Come funziona sotto il cofano è spiegato nelle pagine sul [protocollo di sincronizzazione](../developers/sync-protocol.md) e sull'[architettura](../developers/architecture.md).
:::

## Foto \{#photos}

Una foto ha due parti. Una piccola anteprima si sincronizza con il dato come tutto il resto, quindi ogni dispositivo la mostra subito, anche offline. L'immagine a piena risoluzione resta sul dispositivo che ha scattato la foto e viene caricata in background quando c'è connessione; fino ad allora la foto mostra **In attesa di caricamento**. Gli altri dispositivi caricano l'immagine completa la prima volta che apri la foto e ne conservano una copia.

Eliminare una foto è definitivo: sparisce da ogni dispositivo e l'immagine viene rimossa dal server. I dispositivi che usano ancora la versione 0.4 dell'app non vedono le foto aggiunte dai dispositivi aggiornati.

## Condivisione

I registri si condividono tramite gli **spazi**. Ogni membro di uno spazio vede e modifica tutti i suoi apiari, arnie e registri; non esiste una condivisione per apiario o per arnia. Fanno eccezione le [attività](./tasks.md), che sono personali.

| Ruolo | Cosa può fare |
| --- | --- |
| **Admin** (proprietario dello spazio) | Tutto ciò che può fare un membro, più invitare e revocare, ed eliminare lo spazio. |
| **Membro** | Aggiungere e modificare apiari, arnie, visite, smielature e trattamenti nello spazio. |

Per condividere una postazione con un mentore mantenendo private le altre, metti quella postazione in uno spazio a sé e invita lì il mentore. I registri condivisi si sincronizzano e risolvono i conflitti esattamente come i tuoi. Vedi [Account e spazi](./accounts-tenants.md).

## Se qualcosa non può essere salvato

Il salvataggio avviene sul tuo dispositivo, quindi in pratica non fallisce mai. Se dovesse succedere (ad esempio perché l'archiviazione del browser è piena o danneggiata) il modulo resta aperto con tutto ciò che hai digitato e un messaggio di errore spiega cosa è andato storto.

Con l'**account demo** pubblico il server non accetta modifiche (la demo si azzera ogni ora). Quando lì modifichi qualcosa, l'app annulla la modifica e ti dice che non è stata salvata.

C'è una situazione in cui il salvataggio funziona ma non dura: se il browser non può dare all'app la sua archiviazione privata (una finestra di navigazione privata, o l'archiviazione bloccata nelle impostazioni del browser), l'app tiene i registri in memoria e mostra un banner: **"Questo browser non salva dati su questo dispositivo (finestra privata o archiviazione bloccata). Ciò che non è stato sincronizzato va perso alla chiusura di questa scheda."** Tutto continua a funzionare per la sessione, e le modifiche si sincronizzano comunque con il server se hai effettuato l'accesso, ma la copia locale sparisce alla chiusura della scheda. Vedi [Risoluzione dei problemi](../knowledge-base/troubleshooting.md#storage-is-unavailable).

## Una scheda alla volta \{#one-tab}

Solo una scheda o finestra alla volta può lavorare con i registri su un dispositivo. Se apri Openbeehive in una seconda scheda, questa mostra **"Openbeehive è aperto in un'altra scheda"**. Continua nella prima scheda, oppure tocca **Usa qui** per spostare l'app nella nuova scheda; sarà allora l'altra a mostrare l'avviso.

## Perderò mai dei dati?

I tuoi registri vengono scritti prima sul tuo dispositivo e non vengono rimossi perché sei offline o perché l'app si chiude. Attendono sul dispositivo finché non possono essere sincronizzati.

Se fai self-hosting, mantieni anche backup del server. Vedi [Backup](../self-hosting/backups.md).

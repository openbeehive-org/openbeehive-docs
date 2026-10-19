---
sidebar_position: 6
title: "Risoluzione dei problemi"
---

# Risoluzione dei problemi

La maggior parte dei problemi con Openbeehive rientra in poche categorie: sincronizzazione, archiviazione locale, fotocamera/scanner QR o login. Questa pagina passa in rassegna ciascuna di esse, con controlli pratici che puoi eseguire da solo prima di chiedere aiuto.

I tuoi registri risiedono in un database locale sul tuo dispositivo, quindi quasi nulla di ciò che fai qui può far perdere dati già sincronizzati con il server.

## I dati non si sincronizzano

Le tue modifiche vengono salvate all'istante sul dispositivo. La sincronizzazione con il server avviene silenziosamente in background, quindi un ritardo è normale e raramente motivo di preoccupazione. Se le modifiche fatte su un dispositivo non compaiono su un altro, segui questa lista.

**1. Verifica di essere online.** La barra laterale mostra **Online** oppure **Offline** accanto al tuo account. Se hai lavorato sul campo senza segnale, le tue modifiche sono in coda e vengono inviate appena ti riconnetti.

**2. Verifica di aver effettuato l'accesso.** La sincronizzazione richiede una sessione. Se è scaduta puoi comunque leggere e modificare localmente, ma nulla si sincronizza finché non accedi di nuovo. **Impostazioni → Account** mostra con quale account hai effettuato l'accesso.

**3. Verifica il tenant attivo.** I registri appartengono a un tenant. Se un alveare manca su un altro dispositivo, apri lì **Impostazioni → Tenant** e assicurati che sia attivo lo stesso tenant. Se manca per un'altra persona, quella persona non è membro di quel tenant; un amministratore del tenant può invitarla.

**4. Aspetta un momento, poi riapri.** La sincronizzazione in background viene eseguita periodicamente. Chiudere e riaprire l'app, o passarvi dal background, avvia un nuovo tentativo di sincronizzazione.

:::note
La sincronizzazione è priva di conflitti per progettazione. La modifica più recente a un campo vince, le aggiunte (foto, visite, raccolte, trattamenti) vengono conservate, e non perderai il lavoro perché due dispositivi hanno modificato contemporaneamente.
:::

Se ospiti autonomamente e la sincronizzazione fallisce per tutti, il problema è più probabilmente lato server. Vedi [Configurazione del Self-Hosting](/self-hosting/configuration) e controlla i log del server.

## Come funziona l'archiviazione locale

Openbeehive è una Progressive Web App (PWA). Mantiene l'intero set di dati in un database SQLite che viene eseguito all'interno del tuo browser, memorizzato in **OPFS** (l'Origin Private File System). Ogni lettura e scrittura avviene su questo database locale, ed è per questo che l'app risulta istantanea e funziona senza alcun segnale.

Alcune conseguenze pratiche:

- I tuoi dati sono legati al browser e al dispositivo in cui usi Openbeehive. Ogni dispositivo mantiene la propria copia locale e si sincronizza con il server.
- L'archiviazione OPFS è privata dell'origine dell'app. Altri siti web non possono leggerla.
- Installare l'app nella schermata Home (vedi [Installazione](/using-the-app/install)) usa, sulla maggior parte delle piattaforme, la stessa archiviazione della scheda del browser.

:::caution
Gli strumenti del browser che "cancellano i dati del sito", "cancellano cookie e archiviazione", o la navigazione privata/in incognito possono cancellare il database OPFS locale. Questo è sicuro **solo se i tuoi dati sono già stati sincronizzati** con il server, perché verranno scaricati di nuovo al successivo accesso. Se hai modifiche offline non sincronizzate, assicurati di essere online e lascia che la sincronizzazione si completi prima.
:::

### "unable to open database file" o un pulsante che non fa nulla

Le versioni dell'app precedenti alla 0.2.2 potevano esaurire gli slot riservati dell'archiviazione locale; da quel momento ogni salvataggio falliva con `SQLITE_CANTOPEN: unable to open database file` — visibile come un pulsante che sembrava non fare nulla. Dalla 0.2.2 l'app riserva in anticipo slot sufficienti e ripara automaticamente l'archiviazione quando scarseggia. Se vedi ancora questo errore, ricarica l'app due volte (così la nuova versione subentra) e riprova; i dati salvati in precedenza non sono interessati.

### "Archiviazione non disponibile: le modifiche non verranno conservate su questo dispositivo" \{#storage-is-unavailable}

L'app tiene il suo database nell'archiviazione privata del browser. Quando non riesce ad
aprirla, ripiega su un database in memoria e mostra questo avviso perché tu sappia la
situazione. Le modifiche funzionano ancora e si sincronizzano ancora con il server finché hai
effettuato l'accesso, ma la copia locale sparisce alla chiusura della scheda.

Le due cause comuni:

- **Navigazione privata o in incognito.** I browser non concedono archiviazione persistente a
  queste finestre. Usa una finestra normale oppure installa l'app.
- **È aperta una seconda scheda dell'app.** L'archiviazione può essere trattenuta da una
  sola pagina alla volta. Dalla versione 0.2.3 l'app riprova brevemente, il che di solito
  basta quando un ricaricamento della pagina compete con il proprio predecessore; se l'avviso
  resta, chiudi l'altra scheda e ricarica.

### L'app mostra "Sincronizzazione dei dati…" invece dei miei apiari

È la prima sincronizzazione su questo dispositivo, ancora in fase di download. Dalla
versione 0.2.3 la dashboard e le liste mostrano segnaposto e questa indicazione finché i dati
non sono noti come completi, e si riempiono progressivamente man mano che arrivano i lotti.
Resta online e dagli un momento; con un set di dati grande le liste crescono sotto i tuoi
occhi. Se l'indicazione non sparisce mai, segui [I dati non si sincronizzano](#i-dati-non-si-sincronizzano).

## Cancellare o reinstallare l'app

A volte un nuovo inizio risolve comportamenti strani dopo un aggiornamento. Finché hai effettuato l'accesso a un account che si sincronizza, questa operazione non è distruttiva: i tuoi registri sincronizzati tornano dal server.

1. Conferma di essere **online e di aver effettuato l'accesso**, e che l'indicatore di sincronizzazione mostri che tutto è aggiornato.
2. Disinstalla o rimuovi la PWA dalla schermata Home, oppure cancella l'archiviazione del sito nelle impostazioni del browser.
3. Riapri Openbeehive e accedi.
4. Attendi che la sincronizzazione iniziale scarichi i tuoi apiari, alveari e la cronologia.

:::danger
Non cancellare l'archiviazione se hai modifiche solo offline che non hanno ancora raggiunto il server (per esempio, ispezioni registrate sul campo senza segnale). Quelle modifiche esistono solo su quel dispositivo finché la sincronizzazione non si completa. Mettiti online e lascia che la sincronizzazione finisca prima.
:::

## La fotocamera e lo scanner QR non funzionano

Ogni alveare può portare un'etichetta QR stampabile che rimanda direttamente a quell'alveare (vedi [Etichette QR](/using-the-app/qr-labels)). La scansione necessita dell'accesso alla fotocamera.

- **Concedi l'autorizzazione alla fotocamera.** Quando richiesto, consenti l'accesso alla fotocamera. Se in precedenza l'hai negato, riabilitalo nelle impostazioni del browser o del sistema operativo per il sito, poi ricarica.
- **Usa HTTPS.** I browser consentono l'accesso alla fotocamera solo su origini sicure. L'app ospitata viene servita tramite HTTPS; chi ospita autonomamente deve servire tramite HTTPS anche (oppure `localhost` per i test). Vedi [Reverse proxy](/self-hosting/reverse-proxy).
- **Verifica che non sia in uso.** Chiudi altre app o schede che potrebbero tenere occupata la fotocamera.

:::tip iOS Safari
Su iPhone e iPad lo scanner integrato nell'app può essere limitato. Se la scansione non funziona, apri l'app **Fotocamera** integrata e puntala verso il codice QR. iOS riconosce il link codificato e propone di aprirlo; toccando il link si avvia Openbeehive sull'alveare giusto. L'etichetta codifica un semplice link web, quindi qualsiasi lettore QR funziona come ripiego.
:::

## Problemi di accesso

- **Bloccato sulla schermata di accesso.** Conferma di raggiungere l'indirizzo corretto (l'app ospitata è su app.openbeehive.org). Dopo l'accesso con il tuo provider dovresti essere reindirizzato automaticamente; in caso contrario, ricarica la pagina.
- **Il reindirizzamento fallisce o errori "invalid redirect" (self-host).** Questo significa quasi sempre che l'URL di reindirizzamento OIDC o `BEEHIVE_PUBLIC_BASE_URL` è configurato male. Vedi [Autenticazione e configurazione](/self-hosting/authentication).
- **La passkey non viene offerta.** Le passkey devono essere abilitate sul server e devi averne aggiunta una in Impostazioni → Passkeys. Altrimenti accedi con un altro metodo.
- **Self-host a utente singolo senza login.** Con l'autenticazione a password disattivata, nessun provider OIDC e WebAuthn disabilitato, non c'è alcun passaggio di accesso. Se vedi inaspettatamente una schermata di accesso, controlla la configurazione del tuo server.

## Inviare una buona segnalazione di bug

Se nulla di quanto sopra aiuta, apri una issue su [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). Una segnalazione chiara ottiene una correzione più rapida. Cerca di includere:

| Dettaglio | Esempio |
| --- | --- |
| Cosa hai fatto | "Toccato Salva su una nuova ispezione" |
| Cosa ti aspettavi | "L'ispezione compare nella cronologia dell'alveare" |
| Cosa è successo invece | "Spinner, poi la voce è sparita" |
| Versione dell'app | La versione che esegui: il tag dell'immagine o il tag git su un'istanza self-hosted |
| Piattaforma e browser | iPhone 14, iOS 17, Safari |
| Ospitato o self-hosted | Self-hosted, profilo `selfhost`, SQLite |
| Online o offline | "Ero offline sul campo, ora sto sincronizzando" |
| Riproducibile? | "Succede ogni volta" / "Solo una volta" |

:::caution
Per favore non incollare segreti. Oscura i segreti di sessione, i segreti client OIDC, le password dei database e i dati personali prima di condividere log o configurazioni.
:::

Per domande sul self-hosting, parti dal [riferimento di configurazione](/self-hosting/configuration).

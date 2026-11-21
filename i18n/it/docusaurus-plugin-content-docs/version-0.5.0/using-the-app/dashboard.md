---
sidebar_position: 1
title: "La dashboard"
---

# La dashboard

La **Panoramica** è la prima schermata che vedi quando apri l'app. Tutto ciò che contiene viene letto dal database locale sul tuo dispositivo, quindi si carica all'istante con o senza segnale.

Il pulsante **+ Nuovo** nell'intestazione apre un menu con **Nuovo apiario**, **Nuova arnia** e **Nuova attività**; ciascuna voce ti porta all'elenco corrispondente con il modulo aperto.

## Per iniziare

Finché non viene registrata la tua prima visita, la Panoramica ti accoglie con "Ti diamo il benvenuto in Openbeehive" e una lista di controllo **Per iniziare** in tre passaggi: **Crea un apiario**, **Aggiungi un'arnia**, **Registra la prima visita**. Il passaggio successivo è un link al punto giusto; i passaggi completati sono spuntati. La lista scompare quando tutti e tre sono stati completati.

## Riquadri statistici

| Riquadro | Cosa mostra |
| --- | --- |
| **Apiari** | Numero di apiari nello spazio attivo. |
| **Arnie** | Numero di arnie. |
| **Regine** | Regine attualmente registrate a capo di una colonia. |
| **Attività aperte** | Attività non ancora spuntate. |
| **Miele in questa stagione** | Totale del miele raccolto nell'anno solare corrente, in chilogrammi o libbre secondo la scelta fatta in **Impostazioni → Preferenze → Unità**. |

I riquadri sono solo conteggi; usa la navigazione per aprire la sezione corrispondente.

## Visite in scadenza

Un'arnia è in scadenza 10 giorni dopo l'ultima visita; il pannello lo indica. Elenca fino a cinque arnie in scadenza, prima quelle non visitate da più tempo, con il numero di giorni trascorsi dall'ultima visita ("mai" per le arnie senza alcuna visita). Il badge di ogni arnia elencata è evidenziato. Tocca un'arnia per aprirla e registrare una visita. Quando le arnie in scadenza sono di più, **Vedi tutte le N arnie da visitare** apre l'elenco delle arnie ordinato per ultima visita.

Contano solo le visite registrate da una persona. Le letture inviate da un sensore o da una bilancia tramite l'API non rendono un'arnia "visitata", e le colonie con lo stato **Persa** o **Sciolta** vengono escluse. Quando nessuna arnia è in scadenza il pannello dice "Tutto aggiornato: ottimo lavoro!", e quando non ci sono arnie, che non c'è niente in scadenza.

L'intervallo di 10 giorni è fisso nell'app; `GetDashboard` dell'API usa lo stesso valore predefinito e accetta `thresholdDays` per cambiarlo.

## Prossime attività

Mostra fino a cinque attività aperte con le loro scadenze. Le attività la cui scadenza è passata sono contrassegnate come **Scaduta**. Tocca un'attività per raggiungerla nella vista **Attività**, dove la spunti; vedi [Attività](./tasks.md).

## Come orientarsi

Le stesse destinazioni sono disponibili ovunque: **Panoramica, Apiari, Scansiona, Arnie, Attività** e **Impostazioni**.

- Su un telefono, una **barra delle schede inferiore** le contiene tutte e sei, con etichette brevi adatte agli schermi stretti.
- Su desktop o tablet, una **barra laterale** a sinistra elenca Panoramica, Apiari, Scansiona, Arnie e Attività, con il tuo account (e-mail e stato della sincronizzazione) in fondo che rimanda alle Impostazioni.

## Impostazioni \{#settings}

**Impostazioni** mostra uno di quattro gruppi alla volta; i pulsanti in alto passano dall'uno all'altro.

**Preferenze**

- **Lingua**: inglese, tedesco, francese, spagnolo o italiano. La scelta viene salvata nel tuo account e vale su tutti i tuoi dispositivi.
- **Aspetto**: **Sistema** (segue l'impostazione chiara o scura del dispositivo), **Chiaro** o **Scuro**. La scelta viene salvata solo su questo dispositivo.
- **Unità**: **Peso** in chilogrammi o libbre e **Temperatura** in Celsius o Fahrenheit, per mostrare e inserire i valori. La scelta viene salvata nel tuo account e vale su tutti i tuoi dispositivi e spazi. Finché non scegli, l'app usa le unità metriche, a meno che il tuo browser non sia impostato sulla lingua dell'app per una regione che usa libbre e Fahrenheit (per esempio inglese, Stati Uniti). I dati vengono sempre memorizzati in chilogrammi e gradi Celsius, e le esportazioni e l'API restano nel sistema metrico; vedi [Ispezioni](./inspections.md#units).

**Spazio** (sulle istanze con login)

- **Spazi**: cambia, crea, invita e gestisci i membri. Vedi [Account e spazi](./accounts-tenants.md).
- **Chiavi API**: crea e rimuovi chiavi per script e dispositivi. Vedi [Account e spazi](./accounts-tenants.md#api-keys).
- **Zona di pericolo**: elimina lo spazio (solo admin).

**Dati e sincro**

- **Problemi di sincronizzazione**: le modifiche che il server ha rifiutato, con **Riprova** e **Scarta**, e le modifiche ricevute che non è stato possibile applicare. Vedi [Offline e sincronizzazione](./offline-and-sync.md#sync-problems).
- **Dati e backup**: backup, altri formati di esportazione, la copia del server e l'importazione; vedi [Importazione ed esportazione](./import-export.md).
- **Registro dei trattamenti**: stampa il registro per l'intero spazio, per un apiario o per un anno; vedi [Trattamenti](./treatments.md#treatment-register).

**Account** (sulle istanze con login)

- **Account**: con quale utente hai effettuato l'accesso, **Esci**, **Password** ed **Esci ovunque**. Vedi [Account e spazi](./accounts-tenants.md#password).
- **Passkeys**: aggiungi o rimuovi passkey (quando il server le abilita).
- **Reimposta la password di un utente**: solo per l'admin dell'istanza; vedi [Autenticazione](../self-hosting/authentication.md#password-reset).
- **Elimina l’account**: vedi [Account e spazi](./accounts-tenants.md#delete-account).

Su un'istanza self-hosted a utente singolo senza login non c'è il gruppo Account: **Preferenze** mostra una nota **Senza accesso** che spiega la modalità, e unità e lingua vengono conservate per l'identità locale.

## Lo stato della sincronizzazione

Un chip di stato in cima alla pagina e accanto al tuo account nella barra laterale mostra se le tue modifiche hanno raggiunto il server (**Sincronizzato**, **Modifiche in attesa di invio**, **Offline**, **Problemi di sincronizzazione** e così via); toccalo per lo stato della sincronizzazione e **Sincronizza ora**. Mentre sei offline una barra in alto dice "Offline: le modifiche vengono salvate e sincronizzate in seguito." Continua a registrare esattamente come sempre; la sincronizzazione riprende quando torna la connessione. Vedi [Offline e sincronizzazione](./offline-and-sync.md#sync-status).

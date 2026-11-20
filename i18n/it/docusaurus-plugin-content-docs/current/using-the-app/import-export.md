---
sidebar_position: 12
title: "Importazione ed esportazione"
---

# Importazione ed esportazione

I tuoi dati sono tuoi. Openbeehive ti permette di portare con te **tutti i tuoi dati**:
come backup, per spostarti su un'altra istanza, per elaborarli in un foglio di calcolo o per condividerli
con altri strumenti. Tutto si trova in **Impostazioni → Dati e backup**.

Esportazione e importazione lavorano sullo **spazio attivo**. Entrambe attendono che il dispositivo
abbia terminato la prima sincronizzazione dello spazio; fino ad allora il pannello lo segnala.

## Backup completo \{#full-backup}

**Scarica backup completo** salva ogni apiario, arnia, regina, visita, trattamento,
raccolto, attività e voce della cronologia dello spazio così come li conserva questo dispositivo,
comprese le tue attività personali e le modifiche non ancora caricate.
Il pannello ti dice quante sono queste modifiche, e quante il server ne ha
rifiutate (vedi [Problemi di sincronizzazione](./offline-and-sync.md#sync-problems)): sono
nel file, ma non sul server.

- Senza foto il backup è un unico file JSON.
- Con **Includi le foto** è uno ZIP che contiene anche le immagini a piena risoluzione.
  Le immagini che non si trovano su questo dispositivo vengono scaricate dal server; se non è
  possibile (offline, o non ancora caricate), l'app dice quante ne mancano, e vengono
  incluse le loro miniature.

Pesi e temperature vengono sempre esportati in chilogrammi e gradi
Celsius, qualunque unità tu abbia scelto in **Impostazioni → Unità**.

### Scaricare dal server \{#server-copy}

**Scarica la copia del server** recupera la copia completa dello spazio che il
server conserva, nello stesso formato. Include le tue attività personali ma non
quelle degli altri membri, e non contiene le modifiche che un dispositivo non ha ancora caricato.
Sono consentiti pochi download all'ora. Gli script possono scaricare lo stesso file con una
chiave API; vedi [REST](../using-the-api/rest.md#export). L'account demo non può
scaricarla.

## Altri formati

| Formato | Cosa ottieni | Ideale per |
| --- | --- | --- |
| **Foglio di calcolo (XLSX)** | Una cartella di lavoro, un foglio per tipo di record | Analisi in Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Un `.csv` per tipo di record, raccolti in un `.zip` | Interscambio universale, script, altre app |
| **BeeXML** | Apiari, arnie, regine e visite in un file XML strutturato | Condivisione con strumenti che usano lo stile di interscambio [BeeXML](https://beexml.org/) |
| **Report (PDF)** | Un report stampabile dell'apiario: arnie, regine attuali e ultime letture | Stampa, condivisione, archiviazione |

Questi formati servono per leggere i dati altrove; per ripristinarli, usa il backup completo.
Il **Report (PDF)** apre un riepilogo in una nuova scheda e attiva la finestra di
stampa del tuo browser; scegli "Salva come PDF" per conservarne una copia. Per i backup lato server
di un'intera istanza, vedi [Self-hosting → Backup](../self-hosting/backups.md).

## Importazione \{#importing}

**Importa → Scegli file…** legge un file nello spazio attivo. Scegli il
**Formato del file** oppure lascia **Rilevamento automatico**:

- **Backup Openbeehive (JSON o ZIP)**: un backup completo da questa o da un'altra
  istanza, con le foto se è uno ZIP.
- **BeeXML**: apiari, arnie, regine e visite da un file in stile BeeXML.
- **CSV da un'altra app**: visite da un'altra app di apicoltura o da un
  foglio di calcolo (vedi sotto).

Nulla viene scritto prima che tu veda un'**Anteprima**: per ogni tipo di record, quanti
sono **Nuovi**, **Sovrascritti**, **Ripristinati** e **Saltati (già presenti)**.
Poi tocca **Importa ora**.

Per impostazione predefinita un'importazione aggiunge soltanto. I record che esistono già in questo
spazio, anche quelli eliminati, vengono saltati e mai modificati, quindi importare
due volte lo stesso backup non cambia nulla. Due opzioni cambiano questo comportamento:

- **Sovrascrivi i record esistenti** scrive i valori del file dove sono
  diversi. Vengono scritti solo i campi contenuti nel file; le modifiche fatte dopo
  l'esportazione vanno perse. I record eliminati restano eliminati.
- **Ripristina anche i record eliminati** riporta in vita i record che sono stati eliminati
  qui.

Un file proveniente da **un altro spazio** riceve nuovi id, quindi non tocca mai i record
esistenti, e l'anteprima lo indica. I record importati si sincronizzano come tutto ciò che
inserisci a mano. I numeri nel file vengono letti come chilogrammi e gradi Celsius.

**Annulla l’ultima importazione** elimina ciò che l'ultima importazione ha creato, anche offline. Un
apiario o un'arnia che nel frattempo ha ricevuto record propri (una visita, un'arnia spostata
lì) viene mantenuto, e l'app dice quanti.

## Migrazione da un'altra app

La maggior parte delle app di apicoltura può esportare i propri record in **CSV** (ad esempio
**Apiary Book**, **HiveBook**, **BeeKeeperPal** o il tuo foglio di calcolo).
Openbeehive legge questi file **abbinando i nomi delle colonne**, quindi di solito non
devi riformattare nulla.

Colonne riconosciute (maiuscole/minuscole, spazi e punteggiatura non hanno importanza; sono
comprese diverse lingue):

| Campo Openbeehive | Nomi di colonna riconosciuti |
| --- | --- |
| Apiario | apiary, yard, location, standort, rucher, colmenar, apiario |
| Arnia | hive, colony, beute, volk, ruche, colmena, arnia |
| Data | date, inspection date, visit date, datum, fecha, data |
| Meteo | weather, wetter, meteo, tiempo |
| Varroa | varroa, mites, mite count |
| Temperatura arnia | hive temp, brood temp |
| Temperatura esterna | temperature, temp, outside temp, ambient temp |
| Umidità arnia | hive humidity |
| Umidità esterna | humidity, outside humidity |
| Peso arnia | weight, hive weight, gewicht |
| Miele | honey, harvest, yield, honig, ernte |
| Note | note, notes, comment, comments, remarks, notiz, bemerkung |

Ogni riga del CSV diventa una **visita** dell'arnia corrispondente. Gli apiari e le arnie
che esistono già con lo stesso nome (senza distinguere maiuscole e minuscole) vengono
usati; gli altri vengono creati (le righe senza apiario finiscono in un apiario "Imported").
Una visita già registrata per quell'arnia in quel giorno con gli stessi valori viene
saltata, quindi importare due volte lo stesso file non cambia nulla, e un'importazione
con sovrascrittura lascia tali visite come sono. Le colonne non riconosciute vengono
ignorate. Pesi e temperature vengono letti come chilogrammi e gradi Celsius.

:::tip Prima il round-trip
Se ti stai spostando tra istanze di Openbeehive, preferisci il **backup completo**
(come ZIP con le foto): è completo e senza perdite. Usa il CSV per arrivare
**da** altre app.
:::

## Perché è importante

Openbeehive è costruito in modo che i tuoi dati non possano essere tenuti in ostaggio. C'è una lunga storia di
record di apicoltura rimasti intrappolati nel cloud di un unico fornitore. Iniziative aperte come
[BeeXML](https://beexml.org/) (uno standard di interscambio Apimondia) e il
progetto [BEEP](https://beep.nl/) puntano a risolvere questo problema; Openbeehive va nella stessa direzione —
formati aperti, una [API](/category/using-the-api) documentata e un backup completo con un solo clic.
Prendi le tue api e vai quando vuoi.

Per l'accesso programmatico e i feed automatizzati, vedi [Utilizzo dell'API](/category/using-the-api).

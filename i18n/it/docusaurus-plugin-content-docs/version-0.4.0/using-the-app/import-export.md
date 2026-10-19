---
sidebar_position: 12
title: "Importazione ed esportazione"
---

# Importazione ed esportazione

I tuoi dati sono tuoi. Openbeehive ti permette di portare con te **tutti i tuoi dati** —
come backup, per spostarti su un'altra istanza, per elaborarli in un foglio di calcolo o per condividerli
con altri strumenti. Tutto avviene localmente da **Impostazioni → Dati e backup**; nessun
dato lascia il tuo dispositivo a meno che tu non scelga di condividere il file.

## Esportazione

Apri **Impostazioni**, trova **Dati e backup** e scegli un formato:

| Formato | Cosa ottieni | Ideale per |
| --- | --- | --- |
| **Backup completo (JSON)** | Ogni record — apiari, arnie, regine, ispezioni, raccolti, attività, posizionamenti ed eventi — in un unico file | Conservazione e **spostamento su un'altra istanza** (reimportabile senza perdite) |
| **Foglio di calcolo (XLSX)** | Una cartella di lavoro, un foglio per entità | Analisi in Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Un `.csv` per entità, raccolti in un `.zip` | Interscambio universale, script, altre app |
| **BeeXML** | Un file XML strutturato (apiario → arnia → regina / ispezione) | Condivisione con strumenti che usano lo stile di interscambio [BeeXML](https://beexml.org/) |
| **Report (PDF)** | Un report stampabile dell'apiario — arnie, regine attuali e ultime letture | Stampa, condivisione, audit / archiviazione |

Il **Report (PDF)** apre un riepilogo pulito e personalizzato in una nuova scheda e attiva
la finestra di stampa del tuo browser — scegli "Salva come PDF" per conservarne una copia.

L'esportazione riflette ciò che è presente sul tuo dispositivo in questo momento. Le foto non sono incluse
nelle esportazioni CSV/XLSX/BeeXML (sono memorizzate come blob) — il quadro completo risiede nel
tuo account sincronizzato e nel suo archivio blob; vedi
[Self-hosting → Backup](/self-hosting/backups) per i backup lato server.

## Importazione e ripristino

Nello stesso pannello **Dati e backup**, scegli un formato e seleziona un file:

- **Backup Openbeehive (JSON)** — ripristina un'esportazione precedente. I record mantengono i loro
  id, quindi reimportare lo stesso backup è sicuro (non crea duplicati).
- **BeeXML** — importa apiari, arnie, regine e ispezioni da un file in stile BeeXML.
- **CSV da un'altra app** — migra da un'altra app di apicoltura o da un foglio di calcolo
  (vedi sotto).
- **Rilevamento automatico** — seleziona il lettore corretto in base al file.

I record importati diventano parte del **tuo** account e si sincronizzano come tutto ciò che inserisci
manualmente.

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
| Note | note, notes, comment, remarks, notiz |

Ogni riga del CSV diventa un'**ispezione** sull'arnia corrispondente, creando apiari e
arnie all'occorrenza (le righe senza apiario finiscono in un apiario "Imported"). Le colonne che
non vengono riconosciute vengono ignorate — nulla si rompe, semplicemente conservi il resto.

:::tip Prima il round-trip
Se ti stai spostando tra istanze di Openbeehive, preferisci il **backup JSON** — è
completo e senza perdite. Usa il CSV per arrivare **da** altre app.
:::

## Perché è importante

Openbeehive è costruito in modo che i tuoi dati non possano essere tenuti in ostaggio. C'è una lunga storia di
record di apicoltura rimasti intrappolati nel cloud di un unico fornitore. Iniziative aperte come
[BeeXML](https://beexml.org/) (uno standard di interscambio Apimondia) e il
progetto [BEEP](https://beep.nl/) puntano a risolvere questo problema; Openbeehive va nella stessa direzione —
formati aperti, una [API](/category/using-the-api) documentata e un backup completo con un solo clic.
Prendi le tue api e vai quando vuoi.

Per l'accesso programmatico e i feed automatizzati, vedi [Utilizzo dell'API](/category/using-the-api).

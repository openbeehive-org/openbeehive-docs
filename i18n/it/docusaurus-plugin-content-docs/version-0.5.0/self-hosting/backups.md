---
sidebar_position: 9
title: "Backup e ripristino"
---

# Backup e ripristino

Pochi minuti spesi ora a configurare i backup ti risparmieranno molte preoccupazioni in seguito. Questa pagina copre cosa sottoporre a backup, come farlo in sicurezza e come ripristinare quando necessario.

:::tip[Il server è la fonte di verità]
Ogni dispositivo che usa la tua istanza mantiene una copia locale dei suoi dati nel browser. Quella copia è una comodità, non un backup: può essere cancellata svuotando i dati del sito, reinstallando o perdendo il dispositivo.

Per tutto ciò che è condiviso tra persone o dispositivi, il **server** è la copia autoritativa. Esegui il backup del server e proteggi i registri di tutti in una volta sola.
:::

## Cosa sottoporre a backup

Ci sono due cose sul server che vale la pena proteggere:

| Elemento | Dove risiede | Obiettivo del backup |
| --- | --- | --- |
| Il database | File SQLite, o PostgreSQL/MariaDB | Una copia coerente o un dump |
| Blob (immagini delle foto a piena risoluzione) | Filesystem locale, o MinIO/S3 | La directory dei blob o il bucket |

Quale database e quale archivio di blob hai dipende dal tuo profilo di deployment:

- **`selfhost`** usa un singolo file SQLite e una directory di blob locale (`BEEHIVE_BLOB_DIR`, predefinito `./data/blobs`).
- **`cloud`** usa Postgres e un bucket MinIO/S3.

Esegui il backup di **entrambi** il database e i blob. Il database contiene i tuoi apiari, le arnie, le regine, le ispezioni, gli eventi e i record delle foto con le loro miniature; l'archivio di blob contiene le immagini a piena risoluzione. Con un backup del database senza i suoi blob, delle foto resta solo la miniatura.

:::tip[Prima il database, poi i blob]
Se esegui il backup mentre il server è in funzione, copia prima il database e subito dopo i blob. Le immagini vengono scritte una sola volta e mai modificate, quindi una copia dei blob fatta dopo contiene tutte le immagini che la copia del database conosce. Le immagini in più che il database ripristinato non conosce vengono conservate per almeno 30 giorni, nel caso un dispositivo invii di nuovo i loro record, e poi rimosse dalla [manutenzione](./storage.md#upkeep) del server.
:::

## Backup di SQLite (selfhost)

SQLite memorizza i tuoi dati in un file (ad esempio `openbeehive.db`) più due file di accompagnamento quando il write-ahead logging è attivo:

- `openbeehive.db-wal` — modifiche recenti non ancora consolidate nel file principale
- `openbeehive.db-shm` — indice di memoria condivisa per il WAL

:::caution[Non copiare il file `.db` da solo mentre il server è in esecuzione]
Con il WAL abilitato (l'impostazione consigliata), i dati più recenti potrebbero trovarsi ancora nel file `-wal`. Un semplice `cp openbeehive.db backup.db` di un database in esecuzione può produrre una copia incoerente o obsoleta.
:::

Hai due opzioni sicure.

### Opzione A — ferma il servizio, poi copia

Il metodo affidabile più semplice. Ferma Openbeehive così nulla sta scrivendo, copia tutti e tre i file insieme, poi riavvialo.

```bash
systemctl stop openbeehive

cp openbeehive.db     /backups/openbeehive.db
cp openbeehive.db-wal /backups/openbeehive.db-wal 2>/dev/null || true
cp openbeehive.db-shm /backups/openbeehive.db-shm 2>/dev/null || true

systemctl start openbeehive
```

I file `-wal` e `-shm` potrebbero non esistere se il database è appena stato sottoposto a checkpoint — va bene, da qui il `|| true`.

### Opzione B — backup online WAL-safe (senza interruzioni)

Lo strumento da riga di comando di SQLite può prendere un'istantanea coerente mentre il server continua a funzionare, usando l'API di backup integrata:

```bash
sqlite3 openbeehive.db ".backup '/backups/openbeehive.db'"
```

Questo scrive un singolo file `.db` autonomo che include già tutto dal WAL, quindi **non** è necessario copiare i file `-wal` o `-shm` insieme ad esso. Questo è l'approccio consigliato per i backup non presidiati.

## Backup di Postgres (cloud)

Usa `pg_dump` per produrre un dump logico. È coerente senza fermare il servizio.

```bash
pg_dump "postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  --format=custom \
  --file=/backups/openbeehive-$(date +%F).dump
```

Il formato custom si comprime bene e si ripristina con `pg_restore`. Per MariaDB, l'equivalente è `mariadb-dump --single-transaction`.

## Backup dei blob

### Filesystem locale

Copia la directory dei blob. I file qui vengono scritti una volta e non modificati sul posto, quindi una copia ricorsiva è sicura anche mentre il server è in esecuzione (le foto eliminate spariscono dalla directory, da qui `--delete`):

```bash
rsync -a --delete ./data/blobs/ /backups/blobs/
```

### MinIO / S3

Esegui il mirror del bucket con il client MinIO o l'AWS CLI:

```bash
mc mirror --overwrite myminio/openbeehive /backups/blobs/
# or
aws s3 sync s3://openbeehive /backups/blobs/
```

Se usi un archivio compatibile con S3 gestito, puoi anche fare affidamento sul suo versioning o sulle sue policy di lifecycle come seconda linea di difesa.

## Ripristino \{#restoring}

Un ripristino segue sempre gli stessi tre passi: **ferma** il server, ripristina **insieme il database e i blob** dallo stesso backup, **avvia** il server. Nel frattempo non lasciare che il server risponda alle richieste: deve avviarsi sul database ripristinato prima che qualsiasi dispositivo si sincronizzi, perché è proprio da quell'avvio che riconosce il ripristino (vedi [dopo un ripristino](#after-a-restore)).

### SQLite

```bash
systemctl stop openbeehive

cp /backups/openbeehive.db ./openbeehive.db
rm -f ./openbeehive.db-wal ./openbeehive.db-shm   # let SQLite rebuild these
rsync -a --delete /backups/blobs/ ./data/blobs/

systemctl start openbeehive
```

Rimuovi eventuali file `-wal`/`-shm` obsoleti prima di avviare, così SQLite si apre in modo pulito dal file ripristinato.

### Postgres

```bash
systemctl stop openbeehive

pg_restore --clean --if-exists \
  --dbname="postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  /backups/openbeehive-2026-06-19.dump
mc mirror --overwrite --remove /backups/blobs/ myminio/openbeehive   # blob directory: rsync as above

systemctl start openbeehive
```

Con Docker Compose, `docker compose stop server` e `docker compose start server` prendono il posto di `systemctl`.

### Che cosa fanno i dispositivi dopo un ripristino \{#after-a-restore}

Un database ripristinato è più vecchio di ciò che alcuni dispositivi hanno già visto. Il server se ne accorge alla successiva sincronizzazione di ciascun dispositivo e l'app rimedia da sola:

- **Le app aggiornate (0.5.0 e successive) che si erano sincronizzate oltre il backup** caricano di nuovo tutti i dati che hanno, insieme alle immagini delle foto che ancora conservano, e poi scaricano i dati attuali dal server. Le modifiche perse con il backup tornano così; dove il server ha ancora una modifica, non succede nulla. L'app mostra "I dati del server sono stati reimpostati o ripristinati. Questo dispositivo ha inviato di nuovo i suoi dati e ha caricato quelli attuali."
- **I dispositivi che non si erano sincronizzati oltre il backup** continuano come al solito.
- **Le app 0.4.x installate** non ricevono alcun segnale di questo tipo e non caricano nulla di nuovo. Quella la cui posizione va oltre il database ripristinato rilegge i dati dall'inizio. Ciò che solo un dispositivo del genere aveva non viene recuperato, quindi aggiorna l'app su ogni dispositivo prima di contare su questo meccanismo.

Le modifiche fatte su un dispositivo mentre il server era fermo vengono caricate come al solito quando torna disponibile.

## Una semplice pianificazione cron

Un job notturno che fa un'istantanea del database e fa il mirror dei blob è sufficiente per la maggior parte dei self-hoster. Aggiungi questo al tuo crontab con `crontab -e`:

```bash
# Nightly Openbeehive backup at 02:30
30 2 * * * sqlite3 /srv/openbeehive/openbeehive.db ".backup '/backups/openbeehive-$(date +\%F).db'" && rsync -a --delete /srv/openbeehive/data/blobs/ /backups/blobs/
```

I caratteri `%` devono essere preceduti da escape come `\%` all'interno del crontab. Per Postgres, sostituisci la chiamata `sqlite3` con il comando `pg_dump` mostrato sopra. Il database viene copiato per primo e i blob subito dopo, come consigliato sopra.

## Le esportazioni non sono backup del server

**Impostazioni → Dati e sincro** nell'app scarica uno spazio come JSON, oppure come ZIP con le foto; la copia del server è disponibile anche su `GET /export` (vedi [Importazione ed esportazione](../using-the-app/import-export.md)). Un'esportazione di questo tipo è utile per spostare un singolo spazio o per tenerne una copia personale, ma contiene un solo spazio, senza account, membri né chiavi API. Per un'intera istanza, esegui il backup del database e dei blob come descritto sopra.

:::tip[Testa i tuoi ripristini]
Un backup che non hai mai ripristinato è solo una speranza. Di tanto in tanto, ripristina in una directory usa e getta o in un'istanza di test e conferma di poter aprire l'app e vedere le tue arnie. Conserva almeno alcuni giorni di copie datate e tienine una off-site (un disco esterno o un bucket remoto).
:::

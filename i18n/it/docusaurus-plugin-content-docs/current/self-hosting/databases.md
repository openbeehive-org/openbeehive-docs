---
sidebar_position: 5
title: "Database"
---

# Database

Openbeehive memorizza tutti i suoi dati lato server in un database relazionale. Il backend è agnostico rispetto al database: comunica con un livello di archiviazione modulare e include driver per **SQLite**, **PostgreSQL** e **MariaDB**. Scegli quale usare con due variabili d'ambiente.

Tutti e tre vengono testati a ogni modifica: SQLite, PostgreSQL 18 e MariaDB 13.0.2. Il driver `mysql` significa MariaDB; Oracle MySQL 8 dovrebbe funzionare ma non fa parte dei test.

Questa pagina spiega come scegliere il database giusto per la tua situazione e come configurarlo correttamente.

:::note Dove risiedono i dati offline?
L'app sul tuo telefono o laptop mantiene il proprio database locale SQLite-WASM e funziona completamente offline. Il database del server descritto qui è la copia centrale verso cui i dispositivi sincronizzano in background. Sono archivi separati; questa pagina riguarda solo il server.
:::

## Le due impostazioni

Ogni database è configurato tramite la stessa coppia di variabili:

| Variabile | Scopo |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Quale motore usare: `sqlite`, `postgres` o `mysql` (MariaDB). |
| `BEEHIVE_DATABASE_DSN` | La stringa di connessione (Data Source Name) per quel motore. |

Il profilo di deployment `selfhost` usa SQLite per impostazione predefinita, mentre il profilo `cloud` usa PostgreSQL. Puoi sovrascrivere entrambi impostando esplicitamente queste due variabili. Vedi [Configurazione](./configuration.md) per l'elenco completo delle variabili d'ambiente.

## Quale database dovrei scegliere?

| Situazione | Consigliato |
| --- | --- |
| Singolo apicoltore, un server, configurazione il più semplice possibile | **SQLite** |
| Alcuni membri della famiglia che condividono apiari | SQLite o PostgreSQL |
| Molti utenti, sincronizzazione concorrente intensa o deployment ospitato/cloud | **PostgreSQL** |
| Esegui già MariaDB e vuoi una cosa in meno da gestire | **MariaDB** |

:::tip In breve
In caso di dubbio, usa SQLite. Non richiede un servizio separato, risiede in un unico file ed è perfettamente in grado di gestire un alveare personale o familiare. Passa a PostgreSQL quando hai una vera concorrenza multiutente o vuoi un hosting cloud gestito.
:::

## SQLite (predefinito per il self-host)

SQLite è la scelta a dipendenza zero. Non c'è alcun server di database da installare o gestire: i tuoi dati risiedono in un file su disco, il che rende i [backup](./backups.md) semplici come copiare quel file.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
```

Questo è il valore predefinito del profilo `selfhost`. La parte `_pragma=journal_mode(WAL)` abilita il **Write-Ahead Logging**. Il WAL consente ai lettori e a uno scrittore di lavorare contemporaneamente senza bloccarsi a vicenda, il che migliora notevolmente il comportamento quando più dispositivi si sincronizzano contemporaneamente. Consigliamo vivamente di tenerlo attivo.

I due pragma (separati da `&`):

- `journal_mode(WAL)` — letture concorrenti insieme a uno scrittore.
- `busy_timeout(5000)` — attende fino a 5 secondi per un lock invece di fallire immediatamente.

Puoi usare un percorso relativo (risolto rispetto alla directory di lavoro del server) o un percorso assoluto come `file:/var/lib/openbeehive/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)`.

:::caution Il WAL crea file extra
In modalità WAL SQLite mantiene file di accompagnamento accanto al database principale (`openbeehive.db-wal` e `openbeehive.db-shm`). Quando esegui il backup tramite copia di file, ferma prima il server, oppure usa gli strumenti di backup propri di SQLite, così catturi un'istantanea coerente. Vedi [Backup](./backups.md).
:::

## PostgreSQL

PostgreSQL è la scelta giusta per le configurazioni multiutente, il servizio ospitato e qualsiasi deployment in cui molti dispositivi si sincronizzano contemporaneamente. È anche il valore predefinito per il profilo `cloud`.

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://user:pass@host:5432/db?sslmode=disable
```

Un esempio più realistico che punta a un database chiamato `openbeehive`:

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:secret@db.example.com:5432/openbeehive?sslmode=require
```

Il parametro `sslmode` controlla la sicurezza del trasporto:

| Valore | Significato |
| --- | --- |
| `disable` | Nessun TLS. Va bene per un database sullo stesso host o su una rete privata fidata. |
| `require` | Cifra la connessione (senza verifica del certificato). |
| `verify-full` | Cifra e verifica il certificato del server e l'hostname. Il più robusto. |

:::caution Sicurezza in produzione
Usa `sslmode=require` o più forte ogni volta che il database comunica con il server su una rete che non controlli completamente. Riserva `sslmode=disable` alle connessioni solo locali.
:::

Crea il database e l'utente prima del primo avvio, ad esempio:

```sql
CREATE DATABASE openbeehive;
CREATE USER openbeehive WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE openbeehive TO openbeehive;
```

## MariaDB

MariaDB è supportato per chi ne gestisce già uno. Selezionalo con il driver `mysql`. Il formato del DSN differisce da PostgreSQL: usa la sintassi del driver MySQL di Go.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive
```

Il server attiva `parseTime` da solo, quindi non deve essere presente nel DSN.

Dai a Openbeehive un database tutto suo e un utente che possa modificarne le tabelle:

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

- **L'utente ha bisogno di `ALTER`** (incluso in `ALL PRIVILEGES`). Le migrazioni modificano le tabelle, e al primo avvio il server converte le proprie tabelle a una collation binaria `utf8mb4` in modo che il testo venga confrontato byte per byte, come avviene su SQLite e PostgreSQL.
- **Usa un database dedicato.** Non condividerlo con un'altra applicazione.
- **Lascia `max_allowed_packet` a 16 MiB o più** (il valore predefinito di MariaDB). Il server accetta richieste fino a 16 MiB.

## Le migrazioni vengono eseguite automaticamente

Non esegui le migrazioni a mano. A ogni avvio, il server controlla lo schema e applica eventuali migrazioni in sospeso prima di iniziare a servire le richieste. Un database nuovo e vuoto viene configurato automaticamente al primo avvio.

L'SQL è scritto in modo portabile così lo stesso schema funziona su tutti e tre i motori; non c'è alcuna configurazione specifica del motore oltre alla creazione del database e dell'utente mostrata sopra.

Su MariaDB una migrazione che fallisce a metà non può essere annullata, perché MariaDB esegue immediatamente il commit di ogni modifica allo schema. Ripristina il backup prima di riprovare.

:::tip Esegui sempre il backup prima di aggiornare
Poiché una nuova versione può includere migrazioni che modificano lo schema, esegui un backup prima di aggiornare. Vedi [Aggiornamento](./upgrading.md) e [Backup](./backups.md).
:::

## Cambiare database in seguito

I driver non sono intercambiabili a livello di dati: puntare `BEEHIVE_DATABASE_DRIVER` a un motore diverso **non** sposta i tuoi registri tra di essi. Per migrare, ad esempio, da SQLite a PostgreSQL dovresti esportare e reimportare i tuoi dati. Per la maggior parte dei self-hoster il percorso più semplice è scegliere il database giusto fin dall'inizio.

Se ti serve solo un server centrale per te stesso, SQLite ti servirà bene per molto tempo.

Per saperne di più sulla configurazione circostante, vedi [Self-hosting](/category/self-hosting) e [Archiviazione](./storage.md).

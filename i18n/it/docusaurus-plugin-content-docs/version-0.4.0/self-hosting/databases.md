---
sidebar_position: 5
title: "Database"
---

# Database

Openbeehive memorizza tutti i suoi dati lato server in un database relazionale. Il backend è agnostico rispetto al database: comunica con un livello di archiviazione modulare e include driver per **SQLite**, **PostgreSQL** e **MySQL**. Scegli quale usare con due variabili d'ambiente.

Questa pagina spiega come scegliere il database giusto per la tua situazione e come configurarlo correttamente.

:::note Dove risiedono i dati offline?
L'app sul tuo telefono o laptop mantiene il proprio database locale SQLite-WASM e funziona completamente offline. Il database del server descritto qui è la copia centrale verso cui i dispositivi sincronizzano in background. Sono archivi separati; questa pagina riguarda solo il server.
:::

## Le due impostazioni

Ogni database è configurato tramite la stessa coppia di variabili:

| Variabile | Scopo |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Quale motore usare: `sqlite`, `postgres` o `mysql`. |
| `BEEHIVE_DATABASE_DSN` | La stringa di connessione (Data Source Name) per quel motore. |

Il profilo di deployment `selfhost` usa SQLite per impostazione predefinita, mentre il profilo `cloud` usa PostgreSQL. Puoi sovrascrivere entrambi impostando esplicitamente queste due variabili. Vedi [Configurazione](/self-hosting/configuration) per l'elenco completo delle variabili d'ambiente.

## Quale database dovrei scegliere?

| Situazione | Consigliato |
| --- | --- |
| Singolo apicoltore, un server, configurazione il più semplice possibile | **SQLite** |
| Alcuni membri della famiglia che condividono apiari | SQLite o PostgreSQL |
| Molti utenti, sincronizzazione concorrente intensa o deployment ospitato/cloud | **PostgreSQL** |
| Esegui già MySQL/MariaDB e vuoi una cosa in meno da gestire | **MySQL** |

:::tip In breve
In caso di dubbio, usa SQLite. Non richiede un servizio separato, risiede in un unico file ed è perfettamente in grado di gestire un alveare personale o familiare. Passa a PostgreSQL quando hai una vera concorrenza multiutente o vuoi un hosting cloud gestito.
:::

## SQLite (predefinito per il self-host)

SQLite è la scelta a dipendenza zero. Non c'è alcun server di database da installare o gestire: i tuoi dati risiedono in un file su disco, il che rende i [backup](/self-hosting/backups) semplici come copiare quel file.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)
```

La parte `_pragma=journal_mode(WAL)` abilita il **Write-Ahead Logging**. Il WAL consente ai lettori e a uno scrittore di lavorare contemporaneamente senza bloccarsi a vicenda, il che migliora notevolmente il comportamento quando più dispositivi si sincronizzano contemporaneamente. Consigliamo vivamente di tenerlo attivo.

Un paio di pragma utili che puoi aggiungere (separali con `&`):

```bash
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)
```

- `journal_mode(WAL)` — letture concorrenti insieme a uno scrittore.
- `busy_timeout(5000)` — attende fino a 5 secondi per un lock invece di fallire immediatamente.

Puoi usare un percorso relativo (risolto rispetto alla directory di lavoro del server) o un percorso assoluto come `file:/var/lib/openbeehive/openbeehive.db?_pragma=journal_mode(WAL)`.

:::caution Il WAL crea file extra
In modalità WAL SQLite mantiene file di accompagnamento accanto al database principale (`openbeehive.db-wal` e `openbeehive.db-shm`). Quando esegui il backup tramite copia di file, ferma prima il server, oppure usa gli strumenti di backup propri di SQLite, così catturi un'istantanea coerente. Vedi [Backup](/self-hosting/backups).
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

## MySQL

MySQL (e MariaDB) sono supportati per chi ne gestisce già uno. Il formato del DSN differisce da PostgreSQL: usa la sintassi del driver MySQL di Go.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=user:pass@tcp(host:3306)/openbeehive?parseTime=true
```

Il parametro `parseTime=true` è **obbligatorio**. Indica al driver di restituire le colonne `DATE` e `DATETIME` come valori temporali appropriati anziché byte grezzi, cosa su cui Openbeehive fa affidamento per i timestamp e la gestione dell'Hybrid Logical Clock. Ometterlo causerà errori.

Un esempio più completo con UTF-8 e una posizione predefinita sensata:

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive?parseTime=true&charset=utf8mb4&loc=UTC
```

Crea prima il database e l'utente:

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

## Le migrazioni vengono eseguite automaticamente

Non esegui le migrazioni a mano. A ogni avvio, il server controlla lo schema e applica eventuali migrazioni in sospeso prima di iniziare a servire le richieste. Un database nuovo e vuoto viene configurato automaticamente al primo avvio.

L'SQL è scritto in modo portabile così lo stesso schema funziona su tutti e tre i motori; non c'è alcuna configurazione specifica del motore oltre alla creazione del database e dell'utente mostrata sopra.

:::tip Esegui sempre il backup prima di aggiornare
Poiché una nuova versione può includere migrazioni che modificano lo schema, esegui un backup prima di aggiornare. Vedi [Aggiornamento](/self-hosting/upgrading) e [Backup](/self-hosting/backups).
:::

## Cambiare database in seguito

I driver non sono intercambiabili a livello di dati: puntare `BEEHIVE_DATABASE_DRIVER` a un motore diverso **non** sposta i tuoi registri tra di essi. Per migrare, ad esempio, da SQLite a PostgreSQL dovresti esportare e reimportare i tuoi dati. Per la maggior parte dei self-hoster il percorso più semplice è scegliere il database giusto fin dall'inizio.

Se ti serve solo un server centrale per te stesso, SQLite ti servirà bene per molto tempo.

Per saperne di più sulla configurazione circostante, vedi [Self-hosting](/category/self-hosting) e [Archiviazione](/self-hosting/storage).

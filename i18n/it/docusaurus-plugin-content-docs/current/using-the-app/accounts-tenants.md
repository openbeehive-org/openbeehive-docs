---
sidebar_position: 13
title: "Account e spazi"
---

# Account e spazi

Il modo in cui accedi dipende da come è configurata l'istanza. Un'istanza self-hosted per un singolo utente potrebbe non richiedere alcun login; un'istanza condivisa (come il servizio in hosting) assegna a ciascuno un account e organizza gli apiari in **spazi** tra cui puoi passare.

## Accesso

A seconda dell'istanza, la schermata di accesso offre una o più delle seguenti opzioni:

- **E-mail e password**: "Crea account" con nome, e-mail e password, poi "Accedi".
- **Un provider** (Google, Keycloak, ...): "Continua con ...".
- **Una passkey**: "Accedi con passkey" usando impronta, volto, PIN del dispositivo o una chiave di sicurezza. Aggiungi le passkey in **Impostazioni → Passkeys** una volta effettuato l'accesso.
- **La demo**: "Prova la demo" sulle istanze che ne eseguono una. Non richiede un account.

Su un'istanza a utente singolo senza login configurato, l'app si apre direttamente sui tuoi registri.

I metodi sono legati a un unico account: se ti sei registrato con e-mail e password e in seguito accedi con un provider che riporta la stessa e-mail, i due vengono collegati, a condizione che il provider confermi l'indirizzo come verificato e che anche l'indirizzo del tuo account sia verificato. Altrimenti l'accesso tramite provider viene rifiutato e continui ad accedere come facevi prima.

Dopo troppi tentativi falliti la schermata di accesso dice "Troppi tentativi. Attendi qualche minuto e riprova." Il blocco si rimuove da solo dopo al massimo 15 minuti.

Se l'istanza richiede la verifica dell'e-mail, dopo la registrazione ricevi un link di conferma via e-mail. Aprilo prima del tuo primo accesso.

:::note Chi è l'admin
L'admin dell'istanza non è la prima persona che si registra. Su un'istanza self-hosted è l'account che l'operatore configura con `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD` (vedi [Autenticazione](../self-hosting/authentication.md)); sul servizio in hosting è l'operatore. La registrazione non concede mai quel ruolo.
:::

## Cos'è uno spazio

Uno **spazio** è un insieme di apiari, arnie e registrazioni che vanno insieme. Ogni account parte con uno **spazio personale**. Puoi anche appartenere a spazi condivisi, per esempio l'apiario di un club curato da più apicoltori, un apiario didattico, o una seconda attività che tieni separata dalle tue arnie private.

Tutto ciò che registri vive nello **spazio attivo**, e ogni membro di uno spazio vede tutto. Cambiare spazio modifica quali apiari, arnie e visite vedi. Non esiste una condivisione più fine: per condividere alcune arnie ma non altre, mettile in spazi separati.

## Cambiare spazio

Apri **Impostazioni → Spazi**. Ogni spazio a cui appartieni è elencato con il tuo ruolo; quello attivo è contrassegnato. Tocca un altro per passare; l'app si ricarica con le registrazioni di quello spazio.

## Creare uno spazio

In **Impostazioni → Spazi**, digita un nome (per esempio "Club di apicoltura") e tocca **Crea spazio**. Ne diventi l'**Admin** e diventa il tuo spazio attivo.

## Ruoli

| Ruolo | Cosa può fare |
| --- | --- |
| **Admin** (proprietario dello spazio) | Tutto ciò che può fare un membro, più invitare persone, revocare gli inviti aperti, rimuovere le chiavi API dei membri ed eliminare lo spazio. Chi crea uno spazio ne è l'admin. |
| **Membro** | Lavorare con tutti gli apiari, le arnie e le registrazioni dello spazio. |

Il ruolo di admin dell'istanza definito nella configurazione del server è separato da questi: all'interno di uno spazio, l'admin dell'istanza è un admin o un membro come chiunque altro.

## Invitare apicoltori

Come admin dello spazio, apri **Impostazioni → Spazi → Invita un apicoltore**, inserisci l'indirizzo e-mail della persona e tocca **Invia invito**. L'app mostra il link di invito con un pulsante **Copia link**; condividilo direttamente con la persona. Se il server ha SMTP configurato, lo stesso link viene anche inviato via e-mail. Gli invitati entrano come membri.

Un invito è valido per 7 giorni e funziona solo per l'indirizzo e-mail per cui è stato emesso. Gli inviti aperti sono elencati sotto **Inviti aperti**, ciascuno con i propri pulsanti **Copia link** e **Revoca**. Un invito scompare dall'elenco una volta accettato.

## Accettare un invito

Il link di invito apre la schermata di accesso con l'avviso "Hai ricevuto un invito".

- Se non hai ancora un account, creane uno con l'indirizzo e-mail a cui è stato inviato l'invito.
- Se hai già un account con quell'indirizzo, accedi.

Un invito non può essere usato con un indirizzo e-mail diverso ("Questo invito è stato emesso per un altro indirizzo e-mail."), e smette di funzionare 7 giorni dopo la sua creazione ("Questo invito non è valido o è scaduto."). Chiedine uno nuovo all'admin dello spazio.

Non appena hai effettuato l'accesso, l'app ti aggiunge allo spazio e ti fa passare ad esso. Da quel momento compare nelle tue **Impostazioni → Spazi**.

## Eliminare uno spazio

Un admin dello spazio può eliminare lo spazio in **Impostazioni → Spazi → Zona di pericolo**. Questo rimuove lo spazio con tutti i suoi apiari, arnie e registrazioni per ogni membro e non può essere annullato.

## Chiavi API \{#api-keys}

**Impostazioni → Chiavi API** è dove crei le credenziali per script e dispositivi, come una bilancia per arnie, che usano l'[API](../using-the-api/overview.md) a tuo nome. La sezione compare solo quando hai effettuato l'accesso; un'istanza a utente singolo senza login non ha chiavi e non ne ha bisogno.

- Digita un nome nel campo **Dai un nome alla chiave (es. bilancia arnia)**, scegli i permessi nel selettore **Permessi** (**Lettura e scrittura**, il valore predefinito, o **Sola lettura**) e la durata nel selettore **Scade dopo** (**Non scade**, il valore predefinito, **30 giorni**, **90 giorni** o **1 anno**), poi tocca **Crea chiave**. La chiave compare sotto con l'avviso "Copia la chiave adesso. Viene mostrata una sola volta." e un pulsante **Copia** (per un attimo diventa **Copiata**). Tutto ciò che non copi adesso è perso; il server conserva solo un hash.
- Ogni chiave è elencata con il suo nome (**Chiave senza nome** se hai lasciato il campo vuoto), i suoi primi caratteri, un badge **Lettura e scrittura** o **Sola lettura**, **Creata**, poi **Scade** e la data se hai impostato una durata (**Scaduta** e la data, in rosso, una volta passato quel giorno) e, una volta che uno script l'ha usata, **Ultimo utilizzo**. Le chiavi scadute restano nell'elenco finché non le rimuovi.
- **Rimuovi** revoca una chiave dopo una conferma ("Rimuovere questa chiave? Gli script che la usano smettono subito di funzionare.").

Come admin dello spazio vedi anche **Chiavi degli altri membri** sotto le tue chiavi, con l'avviso "Come amministratore dello spazio puoi rimuovere la chiave di qualsiasi membro, ad esempio quando qualcuno se ne va o un dispositivo viene smarrito." Ogni riga mostra il nome della chiave, i suoi primi caratteri, il suo badge **Lettura e scrittura** o **Sola lettura**, l'e-mail del proprietario e **Ultimo utilizzo** una volta che uno script l'ha usata. Lì **Rimuovi** chiede "Rimuovere la chiave di questo membro? I suoi script che la usano smettono subito di funzionare." L'elenco copre solo lo spazio attivo e compare solo quando altri membri hanno chiavi; i membri non possono vedere né rimuovere le chiavi gli uni degli altri.

Una chiave agisce a tuo nome nello spazio che era attivo quando l'hai creata, quindi cambia spazio prima se un dispositivo appartiene a un apiario condiviso. Una chiave in **Sola lettura** può solo leggere; gli script che scrivono hanno bisogno di **Lettura e scrittura**. Una chiave scade solo se imposti una durata; smette di funzionare quando scade, quando la rimuovi o quando lasci quello spazio. L'account demo non può creare chiavi. Vedi [Autenticazione](../using-the-api/overview.md#authentication) per come uno script invia la chiave.

## La demo

Alcune istanze eseguono un **account demo**. Mentre sei connesso con esso, un banner ti ricorda che i dati si reimpostano ogni ora. Il server rifiuta le modifiche provenienti dall'account demo, quindi tutto ciò che inserisci resta solo sul tuo dispositivo. La demo pubblica del progetto è il pulsante **Prova la demo** su [app.openbeehive.org/login](https://app.openbeehive.org/login). Gli operatori possono abilitarla tramite [Modalità demo](../self-hosting/demo.md).

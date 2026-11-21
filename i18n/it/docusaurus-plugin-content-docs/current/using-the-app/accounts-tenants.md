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
- **Una passkey**: "Accedi con passkey" usando impronta, volto, PIN del dispositivo o una chiave di sicurezza. Aggiungi le passkey in **Impostazioni → Account → Passkeys** una volta effettuato l'accesso.
- **La demo**: "Prova la demo" sulle istanze che ne eseguono una. Non richiede un account.

Su un'istanza a utente singolo senza login configurato, l'app si apre direttamente sui tuoi registri.

I metodi sono legati a un unico account: se ti sei registrato con e-mail e password e in seguito accedi con un provider che riporta la stessa e-mail, i due vengono collegati, a condizione che il provider confermi l'indirizzo come verificato e che anche l'indirizzo del tuo account sia verificato. Altrimenti l'accesso tramite provider viene rifiutato e continui ad accedere come facevi prima.

Dopo troppi tentativi falliti la schermata di accesso dice "Troppi tentativi. Attendi qualche minuto e riprova." Il blocco si rimuove da solo dopo al massimo 15 minuti.

Se l'istanza richiede la verifica dell'e-mail, dopo la registrazione ricevi un link di conferma via e-mail. Aprilo prima del tuo primo accesso.

## La tua password \{#password}

In **Impostazioni → Account → Password** inserisci la **Password attuale** e due volte quella nuova, poi tocca **Cambia password**. Gli altri tuoi dispositivi vengono disconnessi; questo resta connesso.

Se l'hai dimenticata, tocca **Password dimenticata?** nella schermata di accesso e inserisci il tuo indirizzo e-mail. Se il server invia e-mail, ricevi un link valido per un'ora e utilizzabile una sola volta; lì scegli una nuova password, e vieni disconnesso da tutti i dispositivi. Se il server non invia e-mail, la pagina lo dice: rivolgiti all'admin dell'istanza, che può creare un link di reimpostazione per il tuo account nelle Impostazioni e dartelo.

La password dell'admin dell'istanza è impostata nella configurazione del server e non può essere cambiata nell'app. Gli account che accedono solo con un provider o una passkey non hanno una password da cambiare.

## Uscire \{#signing-out}

**Impostazioni → Account → Esci** conta prima le modifiche su questo dispositivo non ancora caricate e ti avvisa. Le modifiche non inviate restano sul dispositivo e vengono caricate quando vi accedi di nuovo. Su un dispositivo condiviso spunta **Rimuovi anche i dati da questo dispositivo** per cancellare dal browser le registrazioni e le foto scaricate di questo spazio; tutto ciò che è stato sincronizzato resta nel tuo account. Le modifiche non inviate vanno perse quando rimuovi i dati, quindi prima connettiti e attendi la sincronizzazione.

Ogni account conserva su un dispositivo i propri dati locali, per ogni spazio. Quando qualcun altro accede nello stesso browser, anche allo stesso spazio, riceve una propria copia: non vede le tue modifiche non inviate né le tue attività personali, e nulla di tuo viene caricato a suo nome.

**Esci ovunque** ti disconnette da tutti gli altri tuoi dispositivi, per esempio dopo aver perso un telefono. Su questo resti connesso, e le chiavi API continuano a funzionare.

:::note[Chi è l'admin]
L'admin dell'istanza non è la prima persona che si registra. Su un'istanza self-hosted è l'account che l'operatore configura con `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD` (vedi [Autenticazione](../self-hosting/authentication.md)); sul servizio in hosting è l'operatore. La registrazione non concede mai quel ruolo.
:::

## Cos'è uno spazio

Uno **spazio** è un insieme di apiari, arnie e registrazioni che vanno insieme. Ogni account parte con uno **spazio personale**. Puoi anche appartenere a spazi condivisi, per esempio l'apiario di un club curato da più apicoltori, un apiario didattico, o una seconda attività che tieni separata dalle tue arnie private.

Tutto ciò che registri vive nello **spazio attivo**, e ogni membro di uno spazio vede tutto. Cambiare spazio modifica quali apiari, arnie e visite vedi. Non esiste una condivisione più fine: per condividere alcune arnie ma non altre, mettile in spazi separati.

## Cambiare spazio

Apri **Impostazioni → Spazio**. Ogni spazio a cui appartieni è elencato con il tuo ruolo; quello attivo è contrassegnato. Tocca un altro per passare; l'app si ricarica con le registrazioni di quello spazio.

## Creare uno spazio

In **Impostazioni → Spazio**, digita un nome (per esempio "Club di apicoltura") e tocca **Crea spazio**. Ne diventi l'**Admin** e diventa il tuo spazio attivo.

## Ruoli

| Ruolo | Cosa può fare |
| --- | --- |
| **Admin** (proprietario dello spazio) | Tutto ciò che può fare un membro, più invitare persone, revocare gli inviti aperti, cambiare il ruolo dei membri, rimuovere membri, rimuovere le chiavi API dei membri ed eliminare lo spazio. Chi crea uno spazio ne è l'admin. |
| **Membro** | Lavorare con tutti gli apiari, le arnie e le registrazioni dello spazio, vedere chi altro ne è membro, e lasciare lo spazio. |

Uno spazio può avere più admin e ne conserva sempre almeno uno: l'ultimo admin non può né uscire né diventare membro. Nomina prima admin qualcun altro, oppure elimina lo spazio.

Il ruolo di admin dell'istanza definito nella configurazione del server è separato da questi: all'interno di uno spazio, l'admin dell'istanza è un admin o un membro come chiunque altro.

## Invitare apicoltori

Come admin dello spazio, apri **Impostazioni → Spazio → Invita un apicoltore**, inserisci l'indirizzo e-mail della persona e tocca **Invia invito**. L'app mostra il link di invito con un pulsante **Copia link**; condividilo direttamente con la persona. Se il server ha SMTP configurato, lo stesso link viene anche inviato via e-mail. Gli invitati entrano come membri.

Un invito è valido per 7 giorni e funziona solo per l'indirizzo e-mail per cui è stato emesso. Gli inviti aperti sono elencati sotto **Inviti aperti**, ciascuno con i propri pulsanti **Copia link** e **Revoca**. Un invito scompare dall'elenco una volta accettato.

Invitare un indirizzo che ha già un invito aperto lo sostituisce: l'app lo segnala, il nuovo link è valido per altri 7 giorni e il vecchio link smette di funzionare. Chi è già membro non può essere invitato di nuovo.

## Accettare un invito

Il link di invito apre la schermata di accesso, che indica lo spazio e l'indirizzo a cui è destinato l'invito, in parte nascosto: "Sei stato invitato nello spazio «Club di apicoltura». Crea un account o accedi con j…@e….org."

- Se non hai ancora un account, creane uno con l'indirizzo e-mail a cui è stato inviato l'invito.
- Se hai già un account con quell'indirizzo, accedi.

Non appena hai effettuato l'accesso, l'app ti aggiunge allo spazio e ti fa passare ad esso. Da quel momento compare nelle tue **Impostazioni → Spazio**.

Se l'invito non può essere usato, la schermata di accesso spiega perché e resta aperta:

- accesso con un altro indirizzo: "Questo invito è per j…@e….org. Accedi o crea un account con quell’indirizzo, oppure chiedi un invito per questo."
- più vecchio di 7 giorni: "Questo invito è scaduto. Chiedine uno nuovo alla persona che ti ha invitato."
- già usato, revocato o con lo spazio eliminato: "Questo invito non è più valido: è già stato usato o revocato, oppure lo spazio è stato eliminato. Chiedine uno nuovo."

**Continua senza unirti** ti porta quindi nell'app senza lo spazio.

## Membri \{#members}

**Impostazioni → Spazio → Membri** elenca chi appartiene allo spazio attivo. Un admin vede l'indirizzo e-mail e il ruolo di ogni membro, può cambiare il **Ruolo** (**Admin** o **Membro**) e può rimuovere un membro con **Rimuovi**. Un membro rimosso perde subito l'accesso, comprese le sue chiavi API; le registrazioni che ha scritto restano. Le sue attività personali in questo spazio vengono eliminate.

Ogni membro può lasciare uno spazio con **Esci**. Perdi subito l'accesso alle sue registrazioni e ti serve un nuovo invito per rientrare. Se ne sei l'unico membro non c'è nulla da lasciare; elimina invece lo spazio.

Se perdi l'accesso allo spazio in cui stavi lavorando, l'app te lo dice e continua in un altro dei tuoi spazi.

## Eliminare uno spazio

Un admin dello spazio può eliminare lo spazio in **Impostazioni → Spazio → Zona di pericolo**. Digita il nome dello spazio per confermare. Questo rimuove lo spazio con tutti i suoi apiari, arnie, registrazioni e foto per ogni membro e non può essere annullato.

## Eliminare il tuo account \{#delete-account}

**Impostazioni → Account → Elimina l’account** mostra che cosa comporterebbe l'eliminazione del tuo account prima che tu confermi:

- I tuoi dati di accesso, le chiavi API e le attività personali vengono eliminati.
- Gli spazi di cui sei l'unico membro vengono eliminati con tutte le loro registrazioni e foto.
- Negli spazi che condividi, le tue registrazioni restano per gli altri membri, indicate come scritte da un utente eliminato.
- Finché sei l'unico admin di uno spazio che ha altri membri, l'account non può essere eliminato. Nomina prima admin qualcun altro in quello spazio, oppure elimina lo spazio.

Conferma con la tua password o con una passkey. Un account che non ha né l'una né l'altra deve aver effettuato l'accesso meno di 5 minuti prima; altrimenti l'app ti chiede di accedere di nuovo. L'eliminazione non può essere annullata. L'account dell'admin dell'istanza e l'account demo non possono essere eliminati nell'app.

## Chiavi API \{#api-keys}

**Impostazioni → Spazio → Chiavi API** è dove crei le credenziali per script e dispositivi, come una bilancia per arnie, che usano l'[API](../using-the-api/overview.md) a tuo nome. La sezione compare solo quando hai effettuato l'accesso; un'istanza a utente singolo senza login non ha chiavi e non ne ha bisogno.

- Digita un nome nel campo **Dai un nome alla chiave (es. bilancia arnia)**, scegli i permessi nel selettore **Permessi** (**Lettura e scrittura**, il valore predefinito, o **Sola lettura**) e la durata nel selettore **Scade dopo** (**Non scade**, il valore predefinito, **30 giorni**, **90 giorni** o **1 anno**), poi tocca **Crea chiave**. La chiave compare sotto con l'avviso "Copia la chiave adesso. Viene mostrata una sola volta." e un pulsante **Copia** (per un attimo diventa **Copiata**). Tutto ciò che non copi adesso è perso; il server conserva solo un hash. Sotto **Come usarla** l'app mostra l'indirizzo a cui inviare le richieste e un esempio pronto che elenca le tue arnie, con **Copia esempio**.
- Ogni chiave è elencata con il suo nome (**Chiave senza nome** se hai lasciato il campo vuoto), i suoi primi caratteri, un badge **Lettura e scrittura** o **Sola lettura**, **Creata**, poi **Scade** e la data se hai impostato una durata (**Scaduta** e la data, in rosso, una volta passato quel giorno) e, una volta che uno script l'ha usata, **Ultimo utilizzo**. Le chiavi scadute restano nell'elenco finché non le rimuovi.
- **Rimuovi** revoca una chiave dopo una conferma ("Rimuovere questa chiave? Gli script che la usano smettono subito di funzionare.").

Come admin dello spazio vedi anche **Chiavi degli altri membri** sotto le tue chiavi, con l'avviso "Come amministratore dello spazio puoi rimuovere la chiave di qualsiasi membro, ad esempio quando qualcuno se ne va o un dispositivo viene smarrito." Ogni riga mostra il nome della chiave, i suoi primi caratteri, il suo badge **Lettura e scrittura** o **Sola lettura**, l'e-mail del proprietario e **Ultimo utilizzo** una volta che uno script l'ha usata. Lì **Rimuovi** chiede "Rimuovere la chiave di questo membro? I suoi script che la usano smettono subito di funzionare." L'elenco copre solo lo spazio attivo e compare solo quando altri membri hanno chiavi; i membri non possono vedere né rimuovere le chiavi gli uni degli altri.

Una chiave agisce a tuo nome nello spazio che era attivo quando l'hai creata, quindi cambia spazio prima se un dispositivo appartiene a un apiario condiviso. Una chiave in **Sola lettura** può solo leggere; gli script che scrivono hanno bisogno di **Lettura e scrittura**. Una chiave scade solo se imposti una durata; smette di funzionare quando scade, quando la rimuovi o quando lasci quello spazio o ne vieni rimosso. L'account demo non può creare chiavi. Vedi [Autenticazione](../using-the-api/overview.md#authentication) per come uno script invia la chiave.

## La demo

Alcune istanze eseguono un **account demo**. Mentre sei connesso con esso, un banner dice che la demo è in sola lettura e che nulla di ciò che modifichi viene salvato; i moduli dei dati mostrano una nota e un pulsante **Salva** disattivato. Se una modifica raggiunge comunque il server, l'app la annulla e ti dice che non è stata salvata. La demo pubblica del progetto è il pulsante **Prova la demo** su [app.openbeehive.org/login](https://app.openbeehive.org/login). Gli operatori possono abilitarla tramite [Modalità demo](../self-hosting/demo.md).

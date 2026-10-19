---
sidebar_position: 13
title: "Account e tenant"
---

# Account e tenant

Il modo in cui accedi dipende da come è configurata l'istanza. Un'istanza self-hosted per un singolo utente potrebbe non richiedere alcun login; un'istanza condivisa (come il servizio in hosting) assegna a ciascuno un account e organizza gli apiari in **tenant** tra cui puoi passare.

## Accesso

A seconda dell'istanza, la schermata di accesso offre una o più delle seguenti opzioni:

- **E-mail e password**: "Crea account" con nome, e-mail e password, poi "Accedi".
- **Un provider** (Google, Keycloak, ...): "Continua con ...".
- **Una passkey**: "Accedi con passkey" usando impronta, volto, PIN del dispositivo o una chiave di sicurezza. Aggiungi le passkey in **Impostazioni → Passkeys** una volta effettuato l'accesso.
- **La demo**: "Esplora la demo" sulle istanze che ne eseguono una.

Su un'istanza a utente singolo senza login configurato, l'app si apre direttamente sui tuoi registri.

I metodi sono legati a un unico account: se ti sei registrato con e-mail e password e in seguito accedi con un provider che riporta la stessa e-mail, i due vengono collegati.

Se l'istanza richiede la verifica dell'e-mail, dopo la registrazione ricevi un link di conferma via e-mail. Aprilo prima del tuo primo accesso.

:::note Chi è l'admin
L'admin dell'istanza non è la prima persona che si registra. Su un'istanza self-hosted è l'account che l'operatore configura con `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD` (vedi [Autenticazione](/self-hosting/authentication)); sul servizio in hosting è l'operatore. La registrazione non concede mai quel ruolo.
:::

## Cos'è un tenant

Un **tenant** è un insieme di apiari, arnie e registrazioni che vanno insieme. Ogni account parte con un **tenant personale**. Puoi anche appartenere a tenant condivisi, per esempio l'apiario di un club curato da più apicoltori, un apiario didattico, o una seconda attività che tieni separata dalle tue arnie private.

Tutto ciò che registri vive nel **tenant attivo**, e ogni membro di un tenant vede tutto. Cambiare tenant modifica quali apiari, arnie e visite vedi. Non esiste una condivisione più fine: per condividere alcune arnie ma non altre, mettile in tenant separati.

## Cambiare tenant

Apri **Impostazioni → Spazi**. Ogni tenant a cui appartieni è elencato con il tuo ruolo; quello attivo è contrassegnato. Tocca un altro per passare; l'app si ricarica con le registrazioni di quel tenant.

## Creare un tenant

In **Impostazioni → Spazi**, digita un nome (per esempio "Club di apicoltura") e tocca **Crea spazio**. Ne diventi l'**Admin** e diventa il tuo tenant attivo.

## Ruoli

| Ruolo | Cosa può fare |
| --- | --- |
| **Admin** (proprietario del tenant) | Tutto ciò che può fare un membro, più invitare persone, revocare gli inviti aperti, rimuovere le chiavi API dei membri ed eliminare il tenant. Chi crea un tenant ne è l'admin. |
| **Membro** | Lavorare con tutti gli apiari, le arnie e le registrazioni del tenant. |

Il ruolo di admin dell'istanza definito nella configurazione del server è separato da questi: all'interno di un tenant, l'admin dell'istanza è un admin o un membro come chiunque altro.

## Invitare apicoltori

Come admin del tenant, apri **Impostazioni → Spazi → Invita un apicoltore**, inserisci l'indirizzo e-mail della persona e tocca **Invia invito**. L'app mostra il link di invito con un pulsante **Copia link**; condividilo direttamente con la persona. Se il server ha SMTP configurato, lo stesso link viene anche inviato via e-mail. Gli invitati entrano come membri.

Gli inviti aperti sono elencati sotto **Inviti aperti**, ciascuno con i propri pulsanti **Copia link** e **Revoca**. Un invito scompare dall'elenco una volta accettato.

## Accettare un invito

Il link di invito apre la schermata di accesso con l'avviso "Hai ricevuto un invito".

- Se non hai ancora un account, creane uno. Su un'istanza solo su invito l'indirizzo e-mail deve essere quello a cui è stato inviato l'invito.
- Se hai già un account, accedi.

Non appena hai effettuato l'accesso, l'app ti aggiunge al tenant e ti fa passare ad esso. Da quel momento compare nelle tue **Impostazioni → Spazi**.

## Eliminare un tenant

Un admin del tenant può eliminare il tenant in **Impostazioni → Spazi → Zona di pericolo**. Questo rimuove il tenant con tutti i suoi apiari, arnie e registrazioni per ogni membro e non può essere annullato.

## Chiavi API \{#api-keys}

**Impostazioni → Chiavi API** è dove crei le credenziali per script e dispositivi, come una bilancia per arnie, che usano l'[API](/using-the-api/overview) a tuo nome. La sezione compare solo quando hai effettuato l'accesso; un'istanza a utente singolo senza login non ha chiavi e non ne ha bisogno.

- Digita un nome nel campo **Dai un nome alla chiave (es. bilancia arnia)**, scegli i permessi nel selettore **Permessi** (**Lettura e scrittura**, il valore predefinito, o **Sola lettura**) e la durata nel selettore **Scade dopo** (**Non scade**, il valore predefinito, **30 giorni**, **90 giorni** o **1 anno**), poi tocca **Crea chiave**. La chiave compare sotto con l'avviso "Copia la chiave adesso. Viene mostrata una sola volta." e un pulsante **Copia** (per un attimo diventa **Copiata**). Tutto ciò che non copi adesso è perso; il server conserva solo un hash.
- Ogni chiave è elencata con il suo nome (**Chiave senza nome** se hai lasciato il campo vuoto), i suoi primi caratteri, un badge **Lettura e scrittura** o **Sola lettura**, **Creata**, poi **Scade** e la data se hai impostato una durata (**Scaduta** e la data, in rosso, una volta passato quel giorno) e, una volta che uno script l'ha usata, **Ultimo utilizzo**. Le chiavi scadute restano nell'elenco finché non le rimuovi.
- **Rimuovi** revoca una chiave dopo una conferma ("Rimuovere questa chiave? Gli script che la usano smettono subito di funzionare.").

Come admin del tenant vedi anche **Chiavi degli altri membri** sotto le tue chiavi, con l'avviso "Come amministratore del tenant puoi rimuovere la chiave di qualsiasi membro, ad esempio quando qualcuno se ne va o un dispositivo viene smarrito." Ogni riga mostra il nome della chiave, i suoi primi caratteri, il suo badge **Lettura e scrittura** o **Sola lettura**, l'e-mail del proprietario e **Ultimo utilizzo** una volta che uno script l'ha usata. Lì **Rimuovi** chiede "Rimuovere la chiave di questo membro? I suoi script che la usano smettono subito di funzionare." L'elenco copre solo il tenant attivo e compare solo quando altri membri hanno chiavi; i membri non possono vedere né rimuovere le chiavi gli uni degli altri.

Una chiave agisce a tuo nome nel tenant che era attivo quando l'hai creata, quindi cambia tenant prima se un dispositivo appartiene a un apiario condiviso. Una chiave in **Sola lettura** può solo leggere; gli script che scrivono hanno bisogno di **Lettura e scrittura**. Una chiave scade solo se imposti una durata; smette di funzionare quando scade, quando la rimuovi o quando lasci quel tenant. L'account demo non può creare chiavi. Vedi [Autenticazione](../using-the-api/overview.md#authentication) per come uno script invia la chiave.

## La demo

Alcune istanze eseguono un **account demo**. Mentre sei connesso con esso, un banner ti ricorda che i dati si reimpostano ogni ora. Il server rifiuta le modifiche provenienti dall'account demo, quindi tutto ciò che inserisci resta solo sul tuo dispositivo. Gli operatori possono abilitarla tramite [Modalità demo](/self-hosting/demo).

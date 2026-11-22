---
sidebar_position: 7
title: "Authentification"
---

# Authentification

Openbeehive vous laisse choisir le niveau d'authentification dont vous avez besoin. Un apiculteur seul qui exécute le binaire unique chez lui peut se passer complètement de connexion. Une instance partagée peut utiliser des comptes e-mail/mot de passe intégrés, des passkeys, une connexion via un fournisseur d'identité, ou une combinaison de ces méthodes.

## Choisir un mode

| Mode | Quand l'utiliser | Paramètres clés |
| --- | --- | --- |
| Sans connexion (utilisateur unique) | Une seule personne, un seul serveur, sur votre propre ordinateur ou sur un réseau de confiance | `BEEHIVE_PASSWORD_AUTH` désactivé (valeur par défaut de selfhost), `BEEHIVE_OIDC_PROVIDERS` vide, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| E-mail et mot de passe (comptes intégrés) | Une instance partagée sans fournisseur d'identité externe | `BEEHIVE_PASSWORD_AUTH=true` (valeur par défaut du profil `cloud`) plus `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Connexion sans mot de passe avec la biométrie de l'appareil ou des clés de sécurité, ajoutée par-dessus une autre méthode | `BEEHIVE_WEBAUTHN_ENABLED=true` plus `BEEHIVE_WEBAUTHN_RP_*` |
| Fournisseurs OIDC | Vous disposez déjà de Google, Keycloak, Authentik ou similaire, ou vous souhaitez un contrôle centralisé des comptes | `BEEHIVE_OIDC_PROVIDERS` plus les paramètres propres à chaque fournisseur |

Les méthodes de connexion se combinent. L'écran de connexion propose celles qui sont activées, et un même compte fonctionne avec toutes : une connexion via un fournisseur est rattachée à un compte existant ayant la même adresse e-mail lorsque les deux côtés ont vérifié cette adresse (voir [Mode 4](#oidc-linking)).

Les premières lignes du journal du serveur indiquent le mode en vigueur : soit `auth: NO LOGIN (single-user mode): every request has full access to all data`, soit `auth: LOGIN REQUIRED (email+password, passkeys, OIDC:google)`.

Activer une méthode de connexion active aussi les espaces et les invitations (Paramètres → Espace) ; voir [Comptes et espaces](../using-the-app/accounts-tenants.md).

## Mode 1 : utilisateur unique, sans connexion

C'est la valeur par défaut d'une instance `selfhost`. Laissez les trois options désactivées :

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Sans aucune méthode de connexion activée, Openbeehive fonctionne comme une instance mono-utilisateur sous une identité locale fixe et n'affiche jamais d'écran de connexion.

Un tel serveur ne répond qu'aux requêtes adressées à `localhost`, à une adresse IP ou à l'hôte de `BEEHIVE_PUBLIC_BASE_URL`. Si vous l'ouvrez sous un autre nom, ajoutez ce nom à [`BEEHIVE_ALLOWED_HOSTS`](./configuration.md#allowed-hosts) ; la page `403` que vous obtenez sinon l'indique.

:::caution
« Sans connexion » signifie que toute personne pouvant atteindre le serveur peut lire et modifier vos enregistrements. Utilisez ce mode uniquement sur `localhost` ou sur un réseau de confiance. Si votre instance est accessible depuis Internet, activez une méthode de connexion. Le serveur écrit un avertissement dans le journal au démarrage lorsqu'il n'y a pas de connexion et que `BEEHIVE_PUBLIC_BASE_URL` n'est pas une adresse locale.
:::

## Paramètres de session (requis dès qu'une connexion est activée)

Dès qu'une méthode de connexion est activée, le serveur émet des jetons de session signés et a besoin d'un secret d'au moins 32 octets. Sans ce secret, ou avec un secret plus court, le serveur refuse de démarrer et nomme le paramètre :

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` accepte une durée Go (`720h` correspond à 30 jours, `24h` à un jour). À son expiration, les utilisateurs se reconnectent.

Les sessions peuvent être terminées avant leur expiration. La déconnexion (`POST /auth/logout`, à partir de 0.5.1) met fin immédiatement à la session qui se déconnecte : son jeton est refusé dès lors, même si une copie en est utilisée ailleurs ou après un redémarrage, tandis que les autres sessions du compte restent connectées. Se déconnecter de la démo partagée efface seulement le cookie. `POST /auth/logout-all` met fin à toutes les autres sessions du compte appelant et renvoie un nouveau jeton à l'appelant. Le serveur vérifie aussi à chaque requête que le compte est toujours membre de l'espace dans lequel il travaille. Ces deux dernières vérifications prennent effet en 10 secondes environ.

:::danger
Gardez `BEEHIVE_SESSION_SECRET` secret et stable. Quiconque en prend connaissance peut falsifier des sessions. Si vous le modifiez, tout le monde est déconnecté. Ne le validez jamais dans un système de gestion de versions.
:::

Si vous servez l'application via HTTPS à travers un reverse proxy, assurez-vous que `BEEHIVE_PUBLIC_BASE_URL` utilise `https://` afin que les liens de redirection et d'invitation soient corrects. Voir [Reverse proxy](./reverse-proxy.md).

## Mode 2 : e-mail et mot de passe (comptes intégrés)

```bash
BEEHIVE_PASSWORD_AUTH=true
```

Activé par défaut pour le profil `cloud`, désactivé pour `selfhost`, et impliqué par `BEEHIVE_DEMO=true`. L'écran de connexion propose alors « Se connecter » et « Créer un compte ».

L'authentification par mot de passe requiert un **administrateur d'instance** dédié, configuré dans l'environnement plutôt que créé par inscription. Le serveur refuse de démarrer sans lui :

```bash
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters
```

Le serveur garantit ce compte à chaque démarrage : il est créé s'il manque, son rôle est forcé à administrateur et son mot de passe est réinitialisé à la valeur configurée. Ce dernier point sert aussi de récupération de mot de passe pour l'administrateur : changez la variable et redémarrez. L'inscription n'accorde jamais le rôle d'administrateur, et l'e-mail de l'administrateur doit différer de celui du compte de démonstration.

### Limitation des tentatives de connexion

Les connexions échouées sont comptées par compte et par adresse client : après 10 échecs pour un même compte ou 30 depuis une même adresse en 15 minutes, les tentatives suivantes reçoivent une réponse HTTP `429` avec un en-tête `Retry-After` jusqu'à la fin des 15 minutes. La connexion par passkey est limitée par adresse de la même manière.

Derrière un reverse proxy, toutes les requêtes semblent venir du proxy. Réglez-y `BEEHIVE_TRUST_PROXY_HEADERS=true` pour que le serveur compte la véritable adresse du client, prise dans la dernière entrée de `X-Forwarded-For`. Ne le faites qu'avec exactement un proxy en amont et un port du serveur inaccessible autrement ; voir [Reverse proxy](./reverse-proxy.md).

### Instances sur invitation uniquement

Pour empêcher des inconnus de créer des comptes, réglez `BEEHIVE_REGISTRATION=false`. L'administrateur vient de l'environnement, donc une instance neuve en a toujours un. Toutes les autres personnes rejoignent l'instance via des liens d'invitation, qu'un administrateur d'espace émet depuis Paramètres → Espace. Une invitation est valable 7 jours et ne fonctionne que pour l'adresse e-mail pour laquelle elle a été émise. L'écran de connexion affiche un avis indiquant que l'instance est sur invitation uniquement ; les comptes existants se connectent normalement.

Chaque nouveau compte démarre avec son propre [espace](../using-the-app/accounts-tenants.md) personnel. Seul le compte administrateur configuré porte le rôle d'administrateur de l'instance.

### Vérification facultative de l'e-mail

Par défaut, un nouveau compte peut se connecter immédiatement. Pour exiger des personnes qu'elles confirment d'abord leur adresse e-mail :

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

La vérification nécessite un serveur de messagerie : avec `BEEHIVE_EMAIL_VERIFICATION=true` et sans `BEEHIVE_SMTP_HOST`, le serveur refuse de démarrer. Configurez le SMTP pour que les e-mails de vérification et d'invitation soient envoyés :

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Les liens d'invitation et de vérification ne sont jamais écrits dans le journal du serveur. Sans `BEEHIVE_SMTP_HOST`, aucun e-mail d'invitation n'est envoyé ; l'administrateur qui a créé une invitation copie son lien depuis Paramètres → Espace et le transmet.
:::

### Changer et réinitialiser un mot de passe \{#password-reset}

Une personne connectée change son mot de passe sous **Paramètres → Compte → Mot de passe** ; cela la déconnecte de tous ses autres appareils. Qui a oublié son mot de passe dispose de deux moyens pour revenir, selon que l'e-mail est configuré ou non :

- **Avec `BEEHIVE_SMTP_HOST`**, « Mot de passe oublié ? » sur la page de connexion envoie par e-mail un lien valable une heure et utilisable une seule fois. La réponse est la même, que l'adresse corresponde ou non à un compte. Les demandes sont limitées comme les connexions.
- **Sans e-mail**, la page indique de s'adresser à l'administrateur. L'administrateur de l'instance crée le lien sous **Paramètres → Compte → Réinitialiser le mot de passe d’un utilisateur** et le transmet ; les administrateurs d'espace ne le peuvent pas.

Définir un nouveau mot de passe via un lien déconnecte le compte partout. Le mot de passe de l'administrateur de l'instance est celui de `BEEHIVE_ADMIN_PASSWORD` : il ne peut être modifié ni dans l'application ni par un lien de réinitialisation. Le mot de passe du compte de démo ne peut pas non plus être modifié.

## Mode 3 : passkeys (WebAuthn)

Les passkeys permettent aux personnes de se connecter avec une empreinte digitale, une reconnaissance faciale, un code PIN de l'appareil ou une clé de sécurité matérielle.

```bash
BEEHIVE_WEBAUTHN_ENABLED=true
BEEHIVE_WEBAUTHN_RP_ID=beehive.example.com
BEEHIVE_WEBAUTHN_RP_ORIGINS=https://beehive.example.com
BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME=Openbeehive
```

- `BEEHIVE_WEBAUTHN_RP_ID` est l'identifiant de la partie de confiance (relying party) : le domaine que les utilisateurs visitent, sans schéma ni port (par exemple `beehive.example.com`, ou `localhost` pour des tests locaux). Par défaut, l'hôte de `BEEHIVE_PUBLIC_BASE_URL`. Les passkeys sont liées à ce domaine.
- `BEEHIVE_WEBAUTHN_RP_ORIGINS` est l'origine complète (ou les origines séparées par des virgules) que le navigateur envoie, schéma et port compris. Par défaut, `BEEHIVE_PUBLIC_BASE_URL`.
- `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME` est le nom affiché dans l'invite de passkey du navigateur.

Une passkey s'ajoute depuis **Paramètres → Compte → Passkeys** une fois connecté, les personnes ont donc d'abord besoin d'un autre moyen de se connecter (e-mail/mot de passe ou un fournisseur). Ensuite, l'écran de connexion propose « Se connecter avec une passkey ».

:::caution
WebAuthn nécessite un contexte sécurisé : HTTPS, ou `http://localhost` pour le développement. Placez le serveur derrière TLS avant d'activer les passkeys en production. L'identifiant RP doit correspondre au domaine de `BEEHIVE_PUBLIC_BASE_URL`.
:::

## Mode 4 : fournisseurs OIDC

Connectez un ou plusieurs fournisseurs d'identité OpenID Connect. Listez-les séparés par des virgules et configurez chacun par son nom.

```bash
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://beehive.example.com/auth/callback
```

`BEEHIVE_OIDC_REDIRECT_URL` (par défaut `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback`) est l'adresse vers laquelle le fournisseur renvoie les utilisateurs. Elle doit correspondre exactement à ce que vous enregistrez auprès du fournisseur. Chaque fournisseur listé a besoin d'un émetteur et d'un identifiant client, sinon le serveur refuse de démarrer.

### Comment les connexions via un fournisseur sont associées aux comptes \{#oidc-linking}

Lorsqu'une personne se connecte via un fournisseur, Openbeehive cherche un compte déjà lié à cette identité du fournisseur. À défaut, il cherche un compte ayant la même adresse e-mail et y rattache la connexion via le fournisseur, mais seulement lorsque le fournisseur déclare l'adresse comme vérifiée **et** que l'adresse du compte existant est vérifiée. Sinon, la connexion est refusée et la personne continue de se connecter comme elle le faisait auparavant. S'il n'existe aucun compte de ce type, un nouveau compte est créé, sauf si l'inscription est fermée (`BEEHIVE_REGISTRATION=false`) : les instances sur invitation uniquement ne créent aucun compte via un fournisseur.

L'administrateur de l'instance reste le compte nommé dans `BEEHIVE_ADMIN_EMAIL`, quelle que soit sa façon de se connecter.

### Google

```bash
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=your-client-secret
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile
```

Créez le client dans la Google Cloud Console sous **APIs & Services → Credentials → OAuth client ID** (type : Web application).

### Keycloak et Authentik

Keycloak, Authentik et les autres fournisseurs conformes aux normes utilisent les variables génériques propres à chaque fournisseur. Le nom du fournisseur dans `BEEHIVE_OIDC_PROVIDERS`, en majuscules, est le préfixe des variables.

```bash
BEEHIVE_OIDC_PROVIDERS=keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/main
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=openbeehive
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=your-client-secret
```

L'émetteur est l'URL de base du realm ; Openbeehive découvre le reste à partir de `<issuer>/.well-known/openid-configuration`. Authentik fonctionne de la même manière en utilisant l'URL de configuration OpenID de son application comme émetteur. Les scopes sont par défaut `openid,profile,email` ; remplacez-les avec `BEEHIVE_OIDC_<NAME>_SCOPES`.

### Enregistrer l'URL de redirection auprès de votre IdP

Dans la configuration du client de votre fournisseur, ajoutez une URI de redirection autorisée qui correspond à `BEEHIVE_OIDC_REDIRECT_URL` caractère pour caractère :

```text
https://beehive.example.com/auth/callback
```

Pièges courants : le schéma doit correspondre (`https` en production), pas de barre oblique finale sauf si votre valeur en comporte une, et utilisez votre domaine public plutôt qu'un nom d'hôte interne. Une erreur « redirect mismatch » signifie que les deux valeurs diffèrent quelque part.

## Comptes \{#accounts}

Chacun supprime son propre compte sous **Paramètres → Compte → Supprimer le compte**. Les espaces dont la personne est le seul membre sont supprimés avec lui. Tant qu'elle est le seul administrateur d'un espace qui compte d'autres membres, la suppression est refusée, jusqu'à ce qu'elle nomme quelqu'un d'autre administrateur ou supprime cet espace. Ses enregistrements dans les espaces partagés restent, attribués à un utilisateur supprimé. La suppression se confirme avec le mot de passe, une passkey ou, pour les comptes qui se connectent uniquement via un fournisseur, une connexion datant de moins de 5 minutes. L'administrateur de l'instance défini par `BEEHIVE_ADMIN_EMAIL` et le compte de démo ne peuvent pas être supprimés dans l'application.

Les adresses e-mail sont uniques sans distinction de majuscules et de minuscules. Deux comptes de versions antérieures dont les adresses ne diffèrent que par la casse continuent tous deux de fonctionner, mais la connexion par e-mail, les invitations et les réinitialisations de mot de passe n'atteignent que l'un d'eux. Le journal du serveur nomme chacune de ces paires à chaque démarrage ; décidez quel compte garde l'adresse et supprimez l'autre, ou donnez-lui une autre adresse.

Les liens qu'un navigateur ouvre comme une page (`/auth/verify` depuis un e-mail de vérification, `/auth/login` et `/auth/callback` d'une connexion via un fournisseur) renvoient le navigateur vers la page de connexion avec un message d'erreur traduit en cas de problème, au lieu d'afficher du JSON.

## Activer la connexion sur une instance mono-utilisateur existante \{#single-user-to-login}

Les enregistrements créés sans connexion appartiennent à un espace local fixe qu'aucun compte ne peut voir. Lorsque le serveur démarre avec la connexion par e-mail/mot de passe activée et trouve de tels enregistrements, il les déplace dans l'espace de l'administrateur de l'instance et consigne dans le journal le nombre de lignes déplacées. Les unités et la langue choisies sans connexion deviennent les paramètres de l'administrateur. Connectez-vous en tant qu'administrateur pour les voir. Le déplacement a lieu une seule fois et ne peut pas être annulé en désactivant de nouveau la connexion ; faites d'abord une [sauvegarde](./backups.md).

Deux choses à savoir :

- Les modifications qu'un appareil n'avait pas synchronisées avant le changement restent dans les anciennes données locales de cet appareil et ne sont pas envoyées. Synchronisez chaque appareil avant d'activer la connexion.
- Avec seulement OIDC ou des passkeys, il n'y a pas d'administrateur d'instance. Les enregistrements restent alors où ils sont et le journal indique de régler `BEEHIVE_PASSWORD_AUTH=true` avec `BEEHIVE_ADMIN_EMAIL` et `BEEHIVE_ADMIN_PASSWORD` pour les reprendre.

## Vérifier votre configuration

Redémarrez le serveur et chargez l'application dans un navigateur :

1. **Sans connexion**, la Vue d'ensemble s'ouvre directement.
2. Avec une méthode de connexion activée, l'écran de connexion propose chaque méthode activée (et « Essayer la démo » si la démo est activée).
3. Effectuez une connexion et confirmez que vous accédez à la Vue d'ensemble et que les enregistrements se synchronisent.

Si quelque chose ne fonctionne pas, consultez les journaux du serveur et le [Dépannage](../knowledge-base/troubleshooting.md).

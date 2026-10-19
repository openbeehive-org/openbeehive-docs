---
sidebar_position: 7
title: "Authentification"
---

# Authentification

Openbeehive vous laisse choisir le niveau d'authentification dont vous avez besoin. Un apiculteur seul qui exécute le binaire unique chez lui peut se passer complètement de connexion. Une instance partagée peut utiliser des comptes e-mail/mot de passe intégrés, des passkeys, une connexion via un fournisseur d'identité, ou une combinaison de ces méthodes.

## Choisir un mode

| Mode | Quand l'utiliser | Paramètres clés |
| --- | --- | --- |
| Sans connexion (utilisateur unique) | Une seule personne, un seul serveur, sur votre propre réseau ou derrière un reverse proxy de confiance | `BEEHIVE_PASSWORD_AUTH` désactivé (valeur par défaut de selfhost), `BEEHIVE_OIDC_PROVIDERS` vide, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| E-mail et mot de passe (comptes intégrés) | Une instance partagée sans fournisseur d'identité externe | `BEEHIVE_PASSWORD_AUTH=true` (valeur par défaut du profil `cloud`) plus `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Connexion sans mot de passe avec la biométrie de l'appareil ou des clés de sécurité, ajoutée par-dessus une autre méthode | `BEEHIVE_WEBAUTHN_ENABLED=true` plus `BEEHIVE_WEBAUTHN_RP_*` |
| Fournisseurs OIDC | Vous disposez déjà de Google, Keycloak, Authentik ou similaire, ou vous souhaitez un contrôle centralisé des comptes | `BEEHIVE_OIDC_PROVIDERS` plus les paramètres propres à chaque fournisseur |

Les méthodes de connexion se combinent. L'écran de connexion propose celles qui sont activées, et un même compte fonctionne avec toutes : se connecter avec un fournisseur lie le compte à un compte e-mail/mot de passe existant ayant la même adresse e-mail.

Activer une méthode de connexion active aussi les espaces (tenants) et les invitations (Paramètres → Espaces) ; voir [Comptes et espaces](/using-the-app/accounts-tenants).

## Mode 1 : utilisateur unique, sans connexion

C'est la valeur par défaut d'une instance `selfhost`. Laissez les trois options désactivées :

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Sans aucune méthode de connexion activée, Openbeehive fonctionne comme une instance mono-utilisateur sous une identité locale fixe et n'affiche jamais d'écran de connexion.

:::caution
« Sans connexion » signifie que toute personne pouvant atteindre le serveur peut lire et modifier vos enregistrements. Utilisez ce mode uniquement sur un réseau de confiance, sur `localhost`, ou derrière un reverse proxy qui gère lui-même l'accès. Si votre instance est accessible depuis Internet, activez une méthode de connexion.
:::

## Paramètres de session (requis dès qu'une connexion est activée)

Dès qu'une méthode de connexion est activée, le serveur émet des jetons de session signés et a besoin d'un secret :

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` accepte une durée Go (`720h` correspond à 30 jours, `24h` à un jour). À son expiration, les utilisateurs se reconnectent.

:::danger
Gardez `BEEHIVE_SESSION_SECRET` secret et stable. Quiconque en prend connaissance peut falsifier des sessions. Si vous le modifiez, toutes les sessions existantes sont invalidées. Ne le validez jamais dans un système de gestion de versions.
:::

Si vous servez l'application via HTTPS à travers un reverse proxy, assurez-vous que `BEEHIVE_PUBLIC_BASE_URL` utilise `https://` afin que les liens de redirection et d'invitation soient corrects. Voir [Reverse proxy](/self-hosting/reverse-proxy).

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

### Instances sur invitation uniquement

Pour empêcher des inconnus de créer des comptes, réglez `BEEHIVE_REGISTRATION=false`. L'administrateur vient de l'environnement, donc une instance neuve en a toujours un. Toutes les autres personnes rejoignent l'instance via des liens d'invitation, qu'un administrateur d'espace émet depuis Paramètres → Espaces. L'inscription via un lien d'invitation doit utiliser l'adresse e-mail invitée. L'écran de connexion affiche un avis indiquant que l'instance est sur invitation uniquement ; les comptes existants se connectent normalement.

Chaque nouveau compte démarre avec son propre [espace](/using-the-app/accounts-tenants) personnel. Seul le compte administrateur configuré porte le rôle d'administrateur de l'instance.

### Vérification facultative de l'e-mail

Par défaut, un nouveau compte peut se connecter immédiatement. Pour exiger des personnes qu'elles confirment d'abord leur adresse e-mail :

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Configurez le SMTP pour que les e-mails de vérification et d'invitation soient envoyés :

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Si `BEEHIVE_SMTP_HOST` est vide, Openbeehive écrit les liens de vérification et d'invitation dans le journal du serveur au lieu de les envoyer par e-mail. Les liens d'invitation sont aussi affichés dans l'application à l'administrateur qui les a créés.
:::

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

Une passkey s'ajoute depuis **Paramètres → Passkeys** une fois connecté, les personnes ont donc d'abord besoin d'un autre moyen de se connecter (e-mail/mot de passe ou un fournisseur). Ensuite, l'écran de connexion propose « Se connecter avec une passkey ».

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

:::note Les comptes se lient automatiquement
Lorsqu'une personne se connecte via un fournisseur, Openbeehive fait d'abord correspondre l'identité du fournisseur, puis l'adresse e-mail (en liant un compte e-mail/mot de passe existant), et sinon crée un nouveau compte. L'administrateur de l'instance reste le compte nommé dans `BEEHIVE_ADMIN_EMAIL`, quelle que soit sa façon de se connecter.
:::

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

## Vérifier votre configuration

Redémarrez le serveur et chargez l'application dans un navigateur :

1. **Sans connexion**, la Vue d'ensemble s'ouvre directement.
2. Avec une méthode de connexion activée, l'écran de connexion propose chaque méthode activée (et « Découvrir la démo » si la démo est activée).
3. Effectuez une connexion et confirmez que vous accédez à la Vue d'ensemble et que les enregistrements se synchronisent.

Si quelque chose ne fonctionne pas, consultez les journaux du serveur et le [Dépannage](/knowledge-base/troubleshooting).

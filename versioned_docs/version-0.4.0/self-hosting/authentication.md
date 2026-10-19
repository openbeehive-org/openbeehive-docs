---
sidebar_position: 7
title: "Authentication"
---

# Authentication

Openbeehive lets you choose how much authentication you need. A solo beekeeper running the single binary at home can skip login entirely. A shared instance can use built-in email/password accounts, passkeys, sign-in through an identity provider, or a combination.

## Choosing a mode

| Mode | When to use it | Key settings |
| --- | --- | --- |
| No login (single user) | One person, one server, on your own network or behind a trusted reverse proxy | `BEEHIVE_PASSWORD_AUTH` off (selfhost default), `BEEHIVE_OIDC_PROVIDERS` empty, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| Email & password (in-app accounts) | A shared instance without an external identity provider | `BEEHIVE_PASSWORD_AUTH=true` (default for the `cloud` profile) plus `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Passwordless sign-in with device biometrics or security keys, added on top of another method | `BEEHIVE_WEBAUTHN_ENABLED=true` plus `BEEHIVE_WEBAUTHN_RP_*` |
| OIDC providers | You already run Google, Keycloak, Authentik or similar, or want central account control | `BEEHIVE_OIDC_PROVIDERS` plus per-provider settings |

The login methods combine. The sign-in screen offers whichever are enabled, and one account works across them: signing in with a provider links to an existing email/password account with the same email.

Enabling any login method also enables tenants and invites (Settings → Tenants); see [Accounts & tenants](/using-the-app/accounts-tenants).

## Mode 1: single user, no login

The default for a `selfhost` instance. Leave all three off:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

With no login method enabled, Openbeehive runs as a single-user instance under a fixed local identity and never shows a sign-in screen.

:::caution
"No login" means anyone who can reach the server can read and edit your records. Only use it on a trusted network, on `localhost`, or behind a reverse proxy that handles access itself. If your instance is reachable from the internet, enable a login method.
:::

## Session settings (required once any login is enabled)

As soon as a login method is on, the server issues signed session tokens and needs a secret:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` accepts a Go duration (`720h` is 30 days, `24h` one day). When it expires, users sign in again.

:::danger
Keep `BEEHIVE_SESSION_SECRET` secret and stable. Anyone who learns it can forge sessions. If you change it, every existing session is invalidated. Never commit it to version control.
:::

If you serve the app over HTTPS through a reverse proxy, make sure `BEEHIVE_PUBLIC_BASE_URL` uses `https://` so redirect and invite links are correct. See [Reverse proxy](/self-hosting/reverse-proxy).

## Mode 2: email & password (in-app accounts)

```bash
BEEHIVE_PASSWORD_AUTH=true
```

On by default for the `cloud` profile, off for `selfhost`, and implied by `BEEHIVE_DEMO=true`. The sign-in screen then offers "Sign in" and "Create account".

Password auth needs a dedicated **instance admin**, configured in the environment rather than created through sign-up. The server refuses to start without it:

```bash
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters
```

The server ensures this account on every start: created if missing, role forced to admin, password reset to the configured value. That last point doubles as password recovery for the admin: change the variable and restart. Sign-up never grants the admin role, and the admin email must differ from the demo account's email.

### Invite-only instances

To stop strangers creating accounts, set `BEEHIVE_REGISTRATION=false`. The admin comes from the environment, so a fresh instance always has one. Everyone else joins through invite links, which a tenant admin issues from Settings → Tenants. Sign-up through an invite link must use the invited email address. The sign-in screen shows a notice that the instance is invite-only; existing accounts sign in normally.

Every new account starts with its own personal [tenant](/using-the-app/accounts-tenants). Only the configured admin account carries the instance admin role.

### Optional email verification

By default a new account can sign in immediately. To require people to confirm their email address first:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Configure SMTP so verification and invite emails are sent:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
If `BEEHIVE_SMTP_HOST` is empty, Openbeehive writes verification and invite links to the server log instead of emailing them. Invite links are also shown in the app to the admin who created them.
:::

## Mode 3: passkeys (WebAuthn)

Passkeys let people sign in with a fingerprint, face scan, device PIN or a hardware security key.

```bash
BEEHIVE_WEBAUTHN_ENABLED=true
BEEHIVE_WEBAUTHN_RP_ID=beehive.example.com
BEEHIVE_WEBAUTHN_RP_ORIGINS=https://beehive.example.com
BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME=Openbeehive
```

- `BEEHIVE_WEBAUTHN_RP_ID` is the relying-party ID: the domain users visit, with no scheme and no port (for example `beehive.example.com`, or `localhost` for local testing). Defaults to the host of `BEEHIVE_PUBLIC_BASE_URL`. Passkeys are bound to this domain.
- `BEEHIVE_WEBAUTHN_RP_ORIGINS` is the full origin (or comma-separated origins) the browser sends, including scheme and port. Defaults to `BEEHIVE_PUBLIC_BASE_URL`.
- `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME` is the name shown in the browser's passkey prompt.

A passkey is added from **Settings → Passkeys** while signed in, so people need another way to sign in first (email/password or a provider). Afterwards the sign-in screen offers "Sign in with a passkey".

:::caution
WebAuthn requires a secure context: HTTPS, or `http://localhost` for development. Put the server behind TLS before enabling passkeys in production. The RP ID must match the domain in `BEEHIVE_PUBLIC_BASE_URL`.
:::

## Mode 4: OIDC providers

Connect one or more OpenID Connect identity providers. List them comma-separated and configure each by name.

```bash
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://beehive.example.com/auth/callback
```

`BEEHIVE_OIDC_REDIRECT_URL` (default `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback`) is the address the provider sends users back to. It must match what you register with the provider exactly. Each listed provider needs an issuer and a client ID, or the server refuses to start.

:::note Accounts link automatically
When someone signs in through a provider, Openbeehive matches the provider identity first, then the email address (linking an existing email/password account), and otherwise creates a new account. The instance admin remains the account named in `BEEHIVE_ADMIN_EMAIL`, whichever way it signs in.
:::

### Google

```bash
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=your-client-secret
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile
```

Create the client in the Google Cloud Console under **APIs & Services → Credentials → OAuth client ID** (type: Web application).

### Keycloak and Authentik

Keycloak, Authentik and other standards-compliant providers use the generic per-provider variables. The provider name in `BEEHIVE_OIDC_PROVIDERS`, upper-cased, is the variable prefix.

```bash
BEEHIVE_OIDC_PROVIDERS=keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/main
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=openbeehive
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=your-client-secret
```

The issuer is the realm's base URL; Openbeehive discovers the rest from `<issuer>/.well-known/openid-configuration`. Authentik works the same way with its application's OpenID configuration URL as the issuer. Scopes default to `openid,profile,email`; override with `BEEHIVE_OIDC_<NAME>_SCOPES`.

### Registering the redirect URL with your IdP

In the provider's client configuration, add an authorised redirect URI that matches `BEEHIVE_OIDC_REDIRECT_URL` character for character:

```text
https://beehive.example.com/auth/callback
```

Common pitfalls: the scheme must match (`https` in production), no trailing slash unless your value has one, and use your public domain rather than an internal hostname. A "redirect mismatch" error means the two values differ somewhere.

## Verifying your setup

Restart the server and load the app in a browser:

1. With **no login**, the Overview opens directly.
2. With a login method enabled, the sign-in screen offers each enabled method (and "Explore the demo" if the demo is on).
3. Complete a sign-in and confirm you reach the Overview and that records sync.

If something does not work, check the server logs and [Troubleshooting](/knowledge-base/troubleshooting).

---
sidebar_position: 7
title: "Authentication"
---

# Authentication

Openbeehive lets you choose how much authentication you need. A solo beekeeper running the single binary at home can skip login entirely. A shared instance can use built-in email/password accounts, passkeys, sign-in through an identity provider, or a combination.

## Choosing a mode

| Mode | When to use it | Key settings |
| --- | --- | --- |
| No login (single user) | One person, one server, on your own computer or a network you trust | `BEEHIVE_PASSWORD_AUTH` off (selfhost default), `BEEHIVE_OIDC_PROVIDERS` empty, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| Email & password (in-app accounts) | A shared instance without an external identity provider | `BEEHIVE_PASSWORD_AUTH=true` (default for the `cloud` profile) plus `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Passwordless sign-in with device biometrics or security keys, added on top of another method | `BEEHIVE_WEBAUTHN_ENABLED=true` plus `BEEHIVE_WEBAUTHN_RP_*` |
| OIDC providers | You already run Google, Keycloak, Authentik or similar, or want central account control | `BEEHIVE_OIDC_PROVIDERS` plus per-provider settings |

The login methods combine. The sign-in screen offers whichever are enabled, and one account works across them: signing in with a provider attaches to an existing account with the same email address when both sides have verified that address (see [Mode 4](#oidc-linking)).

The first lines of the server log state the mode in effect, either `auth: NO LOGIN (single-user mode): every request has full access to all data` or `auth: LOGIN REQUIRED (email+password, passkeys, OIDC:google)`.

Enabling any login method also enables workspaces and invites (Settings → Workspace); see [Accounts & workspaces](../using-the-app/accounts-tenants.md).

## Mode 1: single user, no login

The default for a `selfhost` instance. Leave all three off:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

With no login method enabled, Openbeehive runs as a single-user instance under a fixed local identity and never shows a sign-in screen.

Such a server answers only to requests addressed to `localhost`, an IP address or the host of `BEEHIVE_PUBLIC_BASE_URL`. If you open it under another name, list that name in [`BEEHIVE_ALLOWED_HOSTS`](./configuration.md#allowed-hosts); the `403` page you get otherwise says so.

:::caution
"No login" means anyone who can reach the server can read and edit your records. Only use it on `localhost` or a trusted network. If your instance is reachable from the internet, enable a login method. The server logs a warning at start when there is no login and `BEEHIVE_PUBLIC_BASE_URL` is not a local address.
:::

## Session settings (required once any login is enabled)

As soon as a login method is on, the server issues signed session tokens and needs a secret of at least 32 bytes. Without it, or with a shorter one, the server refuses to start and names the setting:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` accepts a Go duration (`720h` is 30 days, `24h` one day). When it expires, users sign in again.

Sessions can be ended before they expire. Signing out (`POST /auth/logout`, from 0.5.1) ends the session that signs out at once: its token is refused from then on, also when a copy of it is used elsewhere or after a restart, while the account's other sessions stay signed in. Signing out of the shared demo only clears the cookie. `POST /auth/logout-all` ends every other session of the calling account and returns a fresh token for the caller. The server also checks on every request that the account is still a member of the workspace it works in. These last two take effect within about 10 seconds.

:::danger
Keep `BEEHIVE_SESSION_SECRET` secret and stable. Anyone who learns it can forge sessions. If you change it, everyone is signed out. Never commit it to version control.
:::

If you serve the app over HTTPS through a reverse proxy, make sure `BEEHIVE_PUBLIC_BASE_URL` uses `https://` so redirect and invite links are correct. See [Reverse proxy](./reverse-proxy.md).

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

### Sign-in throttling

Failed sign-ins are counted per account and per client address: after 10 failures for one account or 30 from one address within 15 minutes, further attempts get HTTP `429` with a `Retry-After` header until the 15 minutes are over. Passkey sign-in is throttled per address in the same way.

Behind a reverse proxy every request seems to come from the proxy. Set `BEEHIVE_TRUST_PROXY_HEADERS=true` there so the server counts the real client address, taken from the last `X-Forwarded-For` entry. Only do this with exactly one proxy in front and the server port unreachable otherwise; see [Reverse proxy](./reverse-proxy.md).

### Invite-only instances

To stop strangers creating accounts, set `BEEHIVE_REGISTRATION=false`. The admin comes from the environment, so a fresh instance always has one. Everyone else joins through invite links, which a workspace admin issues from Settings → Workspace. An invite is valid for 7 days and works only for the email address it was issued for. The sign-in screen shows a notice that the instance is invite-only; existing accounts sign in normally.

Every new account starts with its own personal [workspace](../using-the-app/accounts-tenants.md). Only the configured admin account carries the instance admin role.

### Optional email verification

By default a new account can sign in immediately. To require people to confirm their email address first:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Verification needs a mail server: with `BEEHIVE_EMAIL_VERIFICATION=true` and no `BEEHIVE_SMTP_HOST` the server refuses to start. Configure SMTP so verification and invite emails are sent:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Invite and verification links are never written to the server log. Without `BEEHIVE_SMTP_HOST` no invite mail is sent; the admin who created an invite copies its link from Settings → Workspace and passes it on.
:::

### Changing and resetting passwords \{#password-reset}

Signed-in users change their password under **Settings → Account → Password**; this signs them out on all their other devices. Someone who forgot the password has two ways back, depending on mail:

- **With `BEEHIVE_SMTP_HOST`**, "Forgot password?" on the sign-in page emails a link that is valid for one hour and works once. The answer is the same whether or not the address has an account. Requests are throttled like sign-ins.
- **Without mail**, the page says to ask the administrator. The instance admin creates the link under **Settings → Account → Reset a user's password** and hands it over; workspace admins cannot.

Setting a new password through a link signs the account out everywhere. The instance admin's password is the one in `BEEHIVE_ADMIN_PASSWORD`: it cannot be changed in the app or through a reset link. The demo account's password cannot be changed either.

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

A passkey is added from **Settings → Account → Passkeys** while signed in, so people need another way to sign in first (email/password or a provider). Afterwards the sign-in screen offers "Sign in with a passkey".

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

### How provider logins map to accounts \{#oidc-linking}

When someone signs in through a provider, Openbeehive looks for an account already linked to that provider identity. Failing that, it looks for an account with the same email address and attaches the provider login to it, but only when the provider reports the address as verified **and** the address of the existing account is verified. Otherwise the sign-in is refused and the person keeps signing in the way they did before. If there is no such account, a new one is created, unless registration is closed (`BEEHIVE_REGISTRATION=false`): invite-only instances create no accounts through a provider.

The instance admin remains the account named in `BEEHIVE_ADMIN_EMAIL`, whichever way it signs in.

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

## Accounts \{#accounts}

People delete their own account under **Settings → Account → Delete account**. Workspaces in which they are the only member are deleted with it. While they are the only admin of a workspace that has other members, deletion is refused until they make someone else an admin or delete that workspace. Their records in shared workspaces stay, attributed to a deleted user. The deletion is confirmed with the password, a passkey, or, for accounts that sign in only through a provider, a sign-in less than 5 minutes old. The instance admin from `BEEHIVE_ADMIN_EMAIL` and the demo account cannot be deleted in the app.

Email addresses are unique regardless of upper and lower case. Two accounts from earlier versions whose addresses differ only in case both keep working, but email sign-in, invites and password resets reach only one of them. The server log names each such pair at every start; decide which account keeps the address and delete the other, or give it another address.

Links that a browser opens as a page (`/auth/verify` from a verification email, `/auth/login` and `/auth/callback` of a provider sign-in) send the browser to the sign-in page with a translated error message when something goes wrong, instead of showing JSON.

## Turning login on for an existing single-user instance \{#single-user-to-login}

Records made without login belong to a fixed local workspace that no account can see. When the server starts with email/password login enabled and finds such records, it moves them into the instance admin's workspace and logs how many rows it moved. Units and a language chosen without login become the admin's settings. Sign in as the admin to see them. The move happens once and cannot be undone by turning login off again; take a [backup](./backups.md) first.

Two things to know:

- Changes a device had not synced before the switch stay in that device's old local data and are not uploaded. Sync every device before you turn login on.
- With only OIDC or passkeys there is no instance admin. The records then stay where they are and the log says to set `BEEHIVE_PASSWORD_AUTH=true` with `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD` to adopt them.

## Verifying your setup

Restart the server and load the app in a browser:

1. With **no login**, the Overview opens directly.
2. With a login method enabled, the sign-in screen offers each enabled method (and "Try the demo" if the demo is on).
3. Complete a sign-in and confirm you reach the Overview and that records sync.

If something does not work, check the server logs and [Troubleshooting](../knowledge-base/troubleshooting.md).

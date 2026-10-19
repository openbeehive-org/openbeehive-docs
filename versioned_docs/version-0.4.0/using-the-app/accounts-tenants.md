---
sidebar_position: 13
title: "Accounts & tenants"
---

# Accounts & tenants

How you sign in depends on how the instance is set up. A solo self-hosted instance may need no login at all; a shared instance (like the hosted service) gives everyone an account and organises apiaries into **tenants** you can switch between.

## Signing in

Depending on the instance, the sign-in screen offers one or more of:

- **Email & password**: "Create account" with your name, email and password, then "Sign in".
- **A provider** (Google, Keycloak, ...): "Continue with ...".
- **A passkey**: "Sign in with a passkey" using your fingerprint, face, device PIN or a security key. You add passkeys under **Settings → Passkeys** once signed in.
- **The demo**: "Explore the demo" on instances that run one.

On a single-user instance with no login configured, the app opens straight to your records.

The methods are tied to one account: if you registered with email and password and later sign in with a provider that reports the same email, the two are linked.

If the instance requires email verification, you get a confirmation link by email after signing up. Open it before your first sign-in.

:::note Who is the admin
The instance admin is not the first person to sign up. On a self-hosted instance it is the account the operator configures with `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD` (see [Authentication](/self-hosting/authentication)); on the hosted service it is the operator. Sign-up never grants that role.
:::

## What a tenant is

A **tenant** is a collection of apiaries, hives and records that belong together. Every account starts with a **personal tenant**. You can also belong to shared tenants, for example a club apiary that several beekeepers tend, a teaching apiary, or a second operation you keep separate from your private hives.

Everything you record lives in the **active tenant**, and every member of a tenant sees all of it. Switching tenants changes which apiaries, hives and visits you see. There is no finer-grained sharing: to share some hives but not others, put them in separate tenants.

## Switching tenants

Open **Settings → Tenants**. Every tenant you belong to is listed with your role in it; the active one is marked. Tap another to switch; the app reloads with that tenant's records.

## Creating a tenant

In **Settings → Tenants**, type a name (for example "Beekeeping Club") and tap **Create tenant**. You become its **Admin** and it becomes your active tenant.

## Roles

| Role | Can do |
| --- | --- |
| **Admin** (tenant owner) | Everything a member can, plus invite people, revoke open invites, remove members' API keys and delete the tenant. Whoever creates a tenant is its admin. |
| **Member** | Work with all of the tenant's apiaries, hives and records. |

The instance admin role from the server configuration is separate from these: inside a tenant, the instance admin is an admin or member like anyone else.

## Inviting beekeepers

As a tenant admin, open **Settings → Tenants → Invite a beekeeper**, enter the person's email address and tap **Send invite**. The app shows the invite link with a **Copy link** button; share it with them directly. If the server has SMTP configured, the same link is also emailed. Invitees join as members.

Open invites are listed under **Open invites** with their own **Copy link** and **Revoke** buttons. An invite disappears from the list once it is accepted.

## Accepting an invite

The invite link opens the sign-in screen with a "You've been invited" notice.

- If you have no account yet, create one. On an invite-only instance the email address must be the one the invite was sent to.
- If you already have an account, sign in.

As soon as you are signed in, the app joins you to the tenant and switches you into it. From then on it appears in your own **Settings → Tenants**.

## Deleting a tenant

A tenant admin can delete the tenant under **Settings → Tenants → Danger zone**. This removes the tenant with all its apiaries, hives and records for every member and cannot be undone.

## API keys \{#api-keys}

**Settings → API keys** is where you create credentials for scripts and devices, such as a hive scale, that use the [API](/using-the-api/overview) as you. The section appears only when you are signed in; a single-user instance without login has no keys and needs none.

- Type a name in the **Name this key (e.g. hive scale)** field, choose the permissions in the **Permissions** select (**Read and write**, the default, or **Read-only**) and the lifetime in the **Expires after** select (**Never expires**, the default, **30 days**, **90 days** or **1 year**), then tap **Create key**. The key appears below with the note "Copy the key now. It is shown only once." and a **Copy** button (it reads **Copied** for a moment). Anything you do not copy now is gone; the server keeps only a hash.
- Each key is listed with its name (**Unnamed key** if you left the field empty), its first characters, a **Read and write** or **Read-only** badge, **Created**, then **Expires** and the date when you set a lifetime (**Expired** and the date, in red, once that day has passed) and, once a script has used it, **Last used**. Expired keys stay in the list until you remove them.
- **Remove** revokes a key after a confirmation ("Remove this key? Scripts using it stop working immediately.").

As a tenant admin you also see **Keys of other members** below your own keys, with the note "As tenant admin you can remove any member's key, for example when someone leaves or a device is lost." Each row shows the key's name, its first characters, its **Read and write** or **Read-only** badge, the owner's email and **Last used** once a script has used it. **Remove** there asks "Remove this member's key? Their scripts using it stop working immediately." The list covers the active tenant only and appears only when other members have keys; members cannot see or remove each other's keys.

A key acts as you in the tenant that was active when you created it, so switch tenants first when a device belongs to a shared apiary. A **Read-only** key can only read; scripts that write need **Read and write**. A key expires only if you set a lifetime; it stops working when it expires, when you remove it or when you leave that tenant. The demo account cannot create keys. See [Authentication](../using-the-api/overview.md#authentication) for how a script sends the key.

## The demo

Some instances run a **demo account**. While you are signed in to it, a banner reminds you that the data resets every hour. The server rejects changes from the demo account, so anything you enter stays on your device only. Operators can enable it via [Demo mode](/self-hosting/demo).

---
sidebar_position: 13
title: "Accounts & workspaces"
---

# Accounts & workspaces

How you sign in depends on how the instance is set up. A solo self-hosted instance may need no login at all; a shared instance (like the hosted service) gives everyone an account and organises apiaries into **workspaces** you can switch between.

## Signing in

Depending on the instance, the sign-in screen offers one or more of:

- **Email & password**: "Create account" with your name, email and password, then "Sign in".
- **A provider** (Google, Keycloak, ...): "Continue with ...".
- **A passkey**: "Sign in with a passkey" using your fingerprint, face, device PIN or a security key. You add passkeys under **Settings → Passkeys** once signed in.
- **The demo**: "Try the demo" on instances that run one. It needs no account.

On a single-user instance with no login configured, the app opens straight to your records.

The methods are tied to one account: if you registered with email and password and later sign in with a provider that reports the same email, the two are linked, provided the provider confirms the address as verified and the address of your account is verified too. Otherwise the provider sign-in is refused and you keep signing in the way you did before.

After too many failed attempts the sign-in screen says "Too many attempts. Please wait a few minutes and try again." The block lifts by itself after at most 15 minutes.

If the instance requires email verification, you get a confirmation link by email after signing up. Open it before your first sign-in.

## Your password \{#password}

Under **Settings → Account → Password** enter the **Current password** and the new one twice, then tap **Change password**. Your other devices are signed out; this one stays signed in.

If you forgot it, tap **Forgot password?** on the sign-in screen and enter your email address. If the server sends email, you receive a link that is valid for one hour and works once; choose a new password there, and you are signed out on all devices. If the server sends no email, the page says so: ask the administrator of the instance, who can create a reset link for your account in Settings and give it to you.

The instance admin's password is set in the server configuration and cannot be changed in the app. Accounts that sign in only with a provider or a passkey have no password to change.

## Signing out \{#signing-out}

**Settings → Account → Sign out** first counts the changes on this device that have not been uploaded yet and warns you about them. On a shared device tick **Also remove data from this device** to delete this workspace's records and downloaded photos from the browser; everything that was synced stays in your account. Unsent changes are lost when you remove the data, so go online and wait for the sync first.

**Log out everywhere** signs you out on all your other devices, for example after losing a phone. You stay signed in on this one, and API keys keep working.

:::note[Who is the admin]
The instance admin is not the first person to sign up. On a self-hosted instance it is the account the operator configures with `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD` (see [Authentication](../self-hosting/authentication.md)); on the hosted service it is the operator. Sign-up never grants that role.
:::

## What a workspace is

A **workspace** is a collection of apiaries, hives and records that belong together. Every account starts with a **personal workspace**. You can also belong to shared workspaces, for example a club apiary that several beekeepers tend, a teaching apiary, or a second operation you keep separate from your private hives.

Everything you record lives in the **active workspace**, and every member of a workspace sees all of it. Switching workspaces changes which apiaries, hives and visits you see. There is no finer-grained sharing: to share some hives but not others, put them in separate workspaces.

## Switching workspaces

Open **Settings → Workspaces**. Every workspace you belong to is listed with your role in it; the active one is marked. Tap another to switch; the app reloads with that workspace's records.

## Creating a workspace

In **Settings → Workspaces**, type a name (for example "Beekeeping Club") and tap **Create workspace**. You become its **Admin** and it becomes your active workspace.

## Roles

| Role | Can do |
| --- | --- |
| **Admin** (workspace owner) | Everything a member can, plus invite people, revoke open invites, change members' roles, remove members, remove members' API keys and delete the workspace. Whoever creates a workspace is its admin. |
| **Member** | Work with all of the workspace's apiaries, hives and records, see who else is a member, and leave the workspace. |

A workspace can have several admins and always keeps at least one: the last admin can neither leave nor be made a member. Make someone else an admin first, or delete the workspace.

The instance admin role from the server configuration is separate from these: inside a workspace, the instance admin is an admin or member like anyone else.

## Inviting beekeepers

As a workspace admin, open **Settings → Workspaces → Invite a beekeeper**, enter the person's email address and tap **Send invite**. The app shows the invite link with a **Copy link** button; share it with them directly. If the server has SMTP configured, the same link is also emailed. Invitees join as members.

An invite is valid for 7 days and works only for the email address it was issued for. Open invites are listed under **Open invites** with their own **Copy link** and **Revoke** buttons. An invite disappears from the list once it is accepted.

## Accepting an invite

The invite link opens the sign-in screen with a "You've been invited" notice.

- If you have no account yet, create one with the email address the invite was sent to.
- If you already have an account with that address, sign in.

An invite cannot be used with a different email address ("This invite was issued for a different email address."), and it stops working 7 days after it was created ("This invite is invalid or has expired."). Ask the workspace admin for a new one.

As soon as you are signed in, the app joins you to the workspace and switches you into it. From then on it appears in your own **Settings → Workspaces**.

## Members \{#members}

**Settings → Workspaces → Members** lists who belongs to the active workspace. An admin sees each member's email address and role, can change the **Role** (**Admin** or **Member**) and can **Remove** a member. A removed member loses access at once, including their API keys; the records they wrote stay. Their personal tasks in this workspace are deleted.

Every member can **Leave** a workspace. You lose access to its records at once and need a new invite to come back. When you are its only member there is nothing to leave; delete the workspace instead.

If you lose access to the workspace you were working in, the app tells you and continues in another of your workspaces.

## Deleting a workspace

A workspace admin can delete the workspace under **Settings → Workspaces → Danger zone**. Type the workspace's name to confirm. This removes the workspace with all its apiaries, hives, records and photos for every member and cannot be undone.

## Deleting your account \{#delete-account}

**Settings → Delete account** shows what deleting your account would do before you confirm:

- Your sign-in details, API keys and personal tasks are deleted.
- Workspaces in which you are the only member are deleted with all their records and photos.
- In workspaces you share, your records stay for the other members, marked as written by a deleted user.
- While you are the only admin of a workspace that has other members, the account cannot be deleted. Make someone else an admin there, or delete the workspace first.

Confirm with your password or a passkey. An account without either must have signed in less than 5 minutes ago; otherwise the app asks you to sign in again. Deleting cannot be undone. The instance admin's account and the demo account cannot be deleted in the app.

## API keys \{#api-keys}

**Settings → API keys** is where you create credentials for scripts and devices, such as a hive scale, that use the [API](../using-the-api/overview.md) as you. The section appears only when you are signed in; a single-user instance without login has no keys and needs none.

- Type a name in the **Name this key (e.g. hive scale)** field, choose the permissions in the **Permissions** select (**Read and write**, the default, or **Read-only**) and the lifetime in the **Expires after** select (**Never expires**, the default, **30 days**, **90 days** or **1 year**), then tap **Create key**. The key appears below with the note "Copy the key now. It is shown only once." and a **Copy** button (it reads **Copied** for a moment). Anything you do not copy now is gone; the server keeps only a hash. Under **How to use it** the app shows the address to send requests to and a ready-made example that lists your hives, with **Copy example**.
- Each key is listed with its name (**Unnamed key** if you left the field empty), its first characters, a **Read and write** or **Read-only** badge, **Created**, then **Expires** and the date when you set a lifetime (**Expired** and the date, in red, once that day has passed) and, once a script has used it, **Last used**. Expired keys stay in the list until you remove them.
- **Remove** revokes a key after a confirmation ("Remove this key? Scripts using it stop working immediately.").

As a workspace admin you also see **Keys of other members** below your own keys, with the note "As workspace admin you can remove any member's key, for example when someone leaves or a device is lost." Each row shows the key's name, its first characters, its **Read and write** or **Read-only** badge, the owner's email and **Last used** once a script has used it. **Remove** there asks "Remove this member's key? Their scripts using it stop working immediately." The list covers the active workspace only and appears only when other members have keys; members cannot see or remove each other's keys.

A key acts as you in the workspace that was active when you created it, so switch workspaces first when a device belongs to a shared apiary. A **Read-only** key can only read; scripts that write need **Read and write**. A key expires only if you set a lifetime; it stops working when it expires, when you remove it or when you leave or are removed from that workspace. The demo account cannot create keys. See [Authentication](../using-the-api/overview.md#authentication) for how a script sends the key.

## The demo

Some instances run a **demo account**. While you are signed in to it, a banner reminds you that the data resets every hour. The demo is read-only: when you change something, the app undoes the change and says that it was not saved. The public demo of the project is the **Try the demo** button on [app.openbeehive.org/login](https://app.openbeehive.org/login). Operators can enable it via [Demo mode](../self-hosting/demo.md).

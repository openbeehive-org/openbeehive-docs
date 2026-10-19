---
sidebar_position: 11
title: "Demo mode"
---

# Demo mode

Demo mode installs a ready-made **demo account and tenant** so visitors can try
Openbeehive with realistic data, without touching anyone's real records. It's
**off by default** and meant for public showcases and testing.

## What it sets up

When enabled, Openbeehive creates:

- a demo account (`demo@app.openbeehive.org` / `demo` by default),
- a demo **tenant** with **15 hives across 4 apiaries**,
- a season of data: queens, 105 inspections (7 per hive, spread over the trailing
  ten months, with temperature, humidity, varroa, weight and more), a honey
  harvest and two varroa treatments per hive.

The data is **re-seeded every hour**, so the showcase always looks the same — a
visitor can edit freely and everything returns to the canonical set on the next
reset.

When someone is signed in to the demo account, the app shows a **banner**
reminding them they're in the demo and that data resets hourly.

## Enabling it

```bash
BEEHIVE_DEMO=true
```

That's all you need. Enabling demo mode automatically turns on
[email/password sign-in](/self-hosting/authentication) so the demo account can log
in. Optionally override the credentials:

```bash
BEEHIVE_DEMO_EMAIL=demo@app.openbeehive.org
BEEHIVE_DEMO_PASSWORD=demo
```

Restart the server. You'll see a log line confirming the demo was installed, and
the demo account can sign in immediately. Because demo mode implies password
auth, the instance also needs its dedicated admin (`BEEHIVE_ADMIN_EMAIL` and
`BEEHIVE_ADMIN_PASSWORD`, see [Authentication](/self-hosting/authentication)),
and the admin email must differ from the demo email.

### Showcase hosts: skip the login screen

On a host that exists only to show the demo, you can sign visitors in
automatically:

```bash
BEEHIVE_DEMO_AUTOLOGIN=true
```

Anonymous visitors land straight in the demo tenant instead of on the login
screen. Leave this off on an instance that also serves real users, so they get
the normal sign-in page with the demo button on it.

## How it's isolated

- The demo lives in its **own tenant**; the hourly reset only deletes and
  rebuilds **demo** data, never other tenants.
- Real users on the same instance are unaffected — they have their own tenants.

:::caution
The demo account is a real, sign-in-able account. On a public instance, pick a
demo password you're comfortable sharing, and don't reuse it elsewhere. Leave
`BEEHIVE_DEMO=false` on private instances that don't need a showcase.
:::

## Turning it off

Set `BEEHIVE_DEMO=false` (or remove it) and restart. New sign-ins to the demo
account stop working; existing demo data remains until you remove it. The demo
account and tenant are named `demo-user` / `demo-tenant` internally if you want
to delete them from the database.

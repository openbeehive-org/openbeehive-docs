---
sidebar_position: 11
title: "Demo mode"
---

# Demo mode

Demo mode installs a ready-made **demo account and workspace** so visitors can try
Openbeehive with realistic data, without touching anyone's real records. It's
**off by default** and meant for public showcases and testing.

:::note[Looking for the public demo?]
The project's own demo is the **Try the demo** button on
[app.openbeehive.org/login](https://app.openbeehive.org/login). There is no
separate demo site. This page is about switching the demo on for your own
instance.
:::

## What it sets up

When enabled, Openbeehive creates:

- a demo account (`demo@app.openbeehive.org` / `demo` by default),
- a demo **workspace** with **15 hives across 4 apiaries**,
- a season of data: queens, 105 inspections (7 per hive, spread over the trailing
  ten months, with temperature, humidity, varroa, weight and more), a honey
  harvest and two varroa treatments per hive.

The data is **re-seeded every hour**, so the showcase always looks the same.
Demo sessions are read-only: the server refuses every change from the demo
account, and the app undoes a refused change on screen with a message. Nothing a
visitor does reaches the server or other visitors.

The sign-in screen gets a **Try the demo** button next to the normal sign-in; it
signs the visitor in without a password.

When someone is signed in to the demo account, the app shows a **banner**
reminding them they're in the demo and that data resets hourly.

## Enabling it

```bash
BEEHIVE_DEMO=true
```

That's all you need. Enabling demo mode automatically turns on
[email/password sign-in](./authentication.md) so the demo account can log
in. Optionally override the credentials:

```bash
BEEHIVE_DEMO_EMAIL=demo@app.openbeehive.org
BEEHIVE_DEMO_PASSWORD=demo
```

Restart the server. You'll see a log line confirming the demo was installed, and
the demo account can sign in immediately. Because demo mode implies password
auth, the instance also needs its dedicated admin (`BEEHIVE_ADMIN_EMAIL` and
`BEEHIVE_ADMIN_PASSWORD`, see [Authentication](./authentication.md)),
and the admin email must differ from the demo email. Like every login method it
needs `BEEHIVE_SESSION_SECRET`.

`docker-compose.demo.yml` in the repository is the deployment behind
`app.openbeehive.org` (invite-only registration plus the demo, reached with the
**Try the demo** button on the sign-in page). It is not a template for your own server; start from
[`docker-compose.prod.yml`](./docker.md#several-users) and add `BEEHIVE_DEMO: "true"`
to the environment of its `server` service if you want a demo.

### Showcase hosts: skip the login screen

On a host that exists only to show the demo, you can sign visitors in
automatically:

```bash
BEEHIVE_DEMO_AUTOLOGIN=true
```

Anonymous visitors land straight in the demo workspace instead of on the login
screen. Leave this off on an instance that also serves real users, so they get
the normal sign-in page with the demo button on it.

## How it's isolated

- The demo lives in its **own workspace**; the hourly reset only deletes and
  rebuilds **demo** data, never other workspaces.
- Real users on the same instance are unaffected: they have their own workspaces.

:::caution
The demo account is a real, sign-in-able account. On a public instance, pick a
demo password you're comfortable sharing, and don't reuse it elsewhere. Leave
`BEEHIVE_DEMO=false` on private instances that don't need a showcase.
:::

## Turning it off

Set `BEEHIVE_DEMO=false` (or remove it) and restart. New sign-ins to the demo
account stop working; existing demo data remains until you remove it. The demo
account and workspace have the internal ids `demo-user` / `demo-tenant` if you want
to delete them from the database.

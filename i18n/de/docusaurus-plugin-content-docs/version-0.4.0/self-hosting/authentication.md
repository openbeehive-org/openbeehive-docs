---
sidebar_position: 7
title: "Authentifizierung"
---

# Authentifizierung

Mit Openbeehive entscheidest du selbst, wie viel Authentifizierung du brauchst. Wer das Einzel-Binary allein zu Hause betreibt, kann die Anmeldung ganz überspringen. Eine gemeinsam genutzte Instanz kann integrierte E-Mail-/Passwort-Konten, Passkeys, die Anmeldung über einen Identity-Provider oder eine Kombination davon verwenden.

## Einen Modus wählen

| Modus | Wann verwenden | Wichtige Einstellungen |
| --- | --- | --- |
| Keine Anmeldung (Einzelnutzer) | Eine Person, ein Server, im eigenen Netzwerk oder hinter einem vertrauenswürdigen Reverse Proxy | `BEEHIVE_PASSWORD_AUTH` aus (Standard für selfhost), `BEEHIVE_OIDC_PROVIDERS` leer, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| E-Mail & Passwort (App-interne Konten) | Eine gemeinsam genutzte Instanz ohne externen Identity-Provider | `BEEHIVE_PASSWORD_AUTH=true` (Standard für das `cloud`-Profil) plus `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Passwortlose Anmeldung mit Gerätebiometrie oder Sicherheitsschlüsseln, zusätzlich zu einer anderen Methode | `BEEHIVE_WEBAUTHN_ENABLED=true` plus `BEEHIVE_WEBAUTHN_RP_*` |
| OIDC-Provider | Du betreibst bereits Google, Keycloak, Authentik oder Ähnliches oder möchtest zentrale Kontoverwaltung | `BEEHIVE_OIDC_PROVIDERS` plus provider-spezifische Einstellungen |

Die Anmeldemethoden lassen sich kombinieren. Der Anmeldebildschirm bietet die jeweils aktivierten Methoden an, und ein Konto funktioniert über alle hinweg: Die Anmeldung über einen Provider wird mit einem bestehenden E-Mail-/Passwort-Konto mit derselben E-Mail-Adresse verknüpft.

Sobald eine Anmeldemethode aktiviert ist, sind auch Mandanten und Einladungen verfügbar (Einstellungen → Mandanten); siehe [Konten & Mandanten](/using-the-app/accounts-tenants).

## Modus 1: Einzelnutzer, keine Anmeldung

Der Standard für eine `selfhost`-Instanz. Lass alle drei aus:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Ohne aktivierte Anmeldemethode läuft Openbeehive als Einzelnutzer-Instanz unter einer festen lokalen Identität und zeigt nie einen Anmeldebildschirm.

:::caution
"Keine Anmeldung" bedeutet, dass jeder, der den Server erreichen kann, deine Aufzeichnungen lesen und bearbeiten kann. Verwende es nur in einem vertrauenswürdigen Netzwerk, auf `localhost` oder hinter einem Reverse Proxy, der den Zugriff selbst regelt. Wenn deine Instanz aus dem Internet erreichbar ist, aktiviere eine Anmeldemethode.
:::

## Session-Einstellungen (erforderlich, sobald eine Anmeldung aktiviert ist)

Sobald eine Anmeldemethode eingeschaltet ist, gibt der Server signierte Session-Tokens aus und braucht dafür ein Secret:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` akzeptiert eine Go-Dauer (`720h` sind 30 Tage, `24h` ein Tag). Wenn sie abläuft, melden sich Nutzer erneut an.

:::danger
Halte `BEEHIVE_SESSION_SECRET` geheim und stabil. Jeder, der es erfährt, kann Sessions fälschen. Wenn du es änderst, werden alle bestehenden Sessions ungültig. Committe es niemals in die Versionsverwaltung.
:::

Wenn du die App über HTTPS durch einen Reverse Proxy ausliefern lässt, stelle sicher, dass `BEEHIVE_PUBLIC_BASE_URL` `https://` verwendet, damit Redirect- und Einladungslinks korrekt sind. Siehe [Reverse Proxy](/self-hosting/reverse-proxy).

## Modus 2: E-Mail & Passwort (App-interne Konten)

```bash
BEEHIVE_PASSWORD_AUTH=true
```

Standardmäßig aktiviert für das `cloud`-Profil, deaktiviert für `selfhost` und durch `BEEHIVE_DEMO=true` automatisch eingeschaltet. Der Anmeldebildschirm bietet dann "Anmelden" und "Konto erstellen".

Die Passwort-Anmeldung braucht einen eigenen **Instanz-Admin**, der in der Umgebung konfiguriert und nicht über die Registrierung angelegt wird. Ohne ihn startet der Server nicht:

```bash
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters
```

Der Server stellt dieses Konto bei jedem Start sicher: Es wird angelegt, falls es fehlt, seine Rolle wird auf Admin gesetzt und sein Passwort auf den konfigurierten Wert zurückgesetzt. Letzteres dient zugleich als Passwort-Wiederherstellung für den Admin: Variable ändern und neu starten. Eine Registrierung vergibt nie die Admin-Rolle, und die Admin-E-Mail darf nicht die des Demo-Kontos sein.

### Instanzen nur auf Einladung

Damit Fremde keine Konten erstellen können, setze `BEEHIVE_REGISTRATION=false`. Der Admin kommt aus der Umgebung, sodass eine frische Instanz immer einen hat. Alle anderen treten über Einladungslinks bei, die ein Mandanten-Admin unter Einstellungen → Mandanten ausstellt. Die Registrierung über einen Einladungslink muss die eingeladene E-Mail-Adresse verwenden. Der Anmeldebildschirm zeigt einen Hinweis, dass die Instanz nur auf Einladung zugänglich ist; bestehende Konten melden sich normal an.

Jedes neue Konto startet mit seinem eigenen persönlichen [Mandanten](/using-the-app/accounts-tenants). Nur das konfigurierte Admin-Konto trägt die Admin-Rolle der Instanz.

### Optionale E-Mail-Verifizierung

Standardmäßig kann sich ein neues Konto sofort anmelden. Damit Personen zuerst ihre E-Mail-Adresse bestätigen müssen:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Konfiguriere SMTP, damit Verifizierungs- und Einladungs-E-Mails versendet werden:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Wenn `BEEHIVE_SMTP_HOST` leer ist, schreibt Openbeehive Verifizierungs- und Einladungslinks in das Server-Log, statt sie per E-Mail zu versenden. Einladungslinks werden außerdem dem Admin, der sie erstellt hat, in der App angezeigt.
:::

## Modus 3: Passkeys (WebAuthn)

Passkeys lassen Personen sich mit einem Fingerabdruck, Gesichtsscan, einer Geräte-PIN oder einem Hardware-Sicherheitsschlüssel anmelden.

```bash
BEEHIVE_WEBAUTHN_ENABLED=true
BEEHIVE_WEBAUTHN_RP_ID=beehive.example.com
BEEHIVE_WEBAUTHN_RP_ORIGINS=https://beehive.example.com
BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME=Openbeehive
```

- `BEEHIVE_WEBAUTHN_RP_ID` ist die Relying-Party-ID: die Domain, die Nutzer besuchen, ohne Schema und ohne Port (zum Beispiel `beehive.example.com` oder `localhost` zum lokalen Testen). Standard ist der Host aus `BEEHIVE_PUBLIC_BASE_URL`. Passkeys sind an diese Domain gebunden.
- `BEEHIVE_WEBAUTHN_RP_ORIGINS` ist der vollständige Ursprung (oder kommagetrennte Ursprünge), den der Browser sendet, einschließlich Schema und Port. Standard ist `BEEHIVE_PUBLIC_BASE_URL`.
- `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME` ist der Name, der in der Passkey-Aufforderung des Browsers angezeigt wird.

Ein Passkey wird im angemeldeten Zustand unter **Einstellungen → Passkeys** hinzugefügt, Personen brauchen also zuerst eine andere Anmeldemöglichkeit (E-Mail/Passwort oder einen Provider). Danach bietet der Anmeldebildschirm "Mit Passkey anmelden".

:::caution
WebAuthn erfordert einen sicheren Kontext: HTTPS oder `http://localhost` für die Entwicklung. Setze den Server hinter TLS, bevor du Passkeys in der Produktion aktivierst. Die RP-ID muss mit der Domain in `BEEHIVE_PUBLIC_BASE_URL` übereinstimmen.
:::

## Modus 4: OIDC-Provider

Verbinde einen oder mehrere OpenID-Connect-Identity-Provider. Liste sie kommagetrennt auf und konfiguriere jeden nach Namen.

```bash
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://beehive.example.com/auth/callback
```

`BEEHIVE_OIDC_REDIRECT_URL` (Standard `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback`) ist die Adresse, an die der Provider Nutzer zurückschickt. Sie muss exakt mit dem übereinstimmen, was du beim Provider registrierst. Jeder aufgeführte Provider braucht einen Issuer und eine Client-ID, sonst startet der Server nicht.

:::note Konten werden automatisch verknüpft
Wenn sich jemand über einen Provider anmeldet, gleicht Openbeehive zuerst die Provider-Identität ab, dann die E-Mail-Adresse (wodurch ein bestehendes E-Mail-/Passwort-Konto verknüpft wird), und legt andernfalls ein neues Konto an. Instanz-Admin bleibt das in `BEEHIVE_ADMIN_EMAIL` genannte Konto, egal auf welchem Weg es sich anmeldet.
:::

### Google

```bash
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=your-client-secret
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile
```

Erstelle den Client in der Google Cloud Console unter **APIs & Services → Credentials → OAuth client ID** (Typ: Web application).

### Keycloak und Authentik

Keycloak, Authentik und andere standardkonforme Provider verwenden die generischen provider-spezifischen Variablen. Der Provider-Name in `BEEHIVE_OIDC_PROVIDERS`, großgeschrieben, ist das Variablenpräfix.

```bash
BEEHIVE_OIDC_PROVIDERS=keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/main
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=openbeehive
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=your-client-secret
```

Der Issuer ist die Basis-URL des Realms; Openbeehive ermittelt den Rest aus `<issuer>/.well-known/openid-configuration`. Authentik funktioniert genauso, mit der OpenID-Konfigurations-URL seiner Anwendung als Issuer. Scopes sind standardmäßig `openid,profile,email`; überschreibe sie mit `BEEHIVE_OIDC_<NAME>_SCOPES`.

### Die Redirect-URL bei deinem IdP registrieren

Füge in der Client-Konfiguration deines Providers eine autorisierte Redirect-URI hinzu, die zeichengenau mit `BEEHIVE_OIDC_REDIRECT_URL` übereinstimmt:

```text
https://beehive.example.com/auth/callback
```

Häufige Stolperfallen: Das Schema muss übereinstimmen (`https` in der Produktion), kein abschließender Schrägstrich, es sei denn, dein Wert hat einen, und verwende deine öffentliche Domain statt eines internen Hostnamens. Ein "redirect mismatch"-Fehler bedeutet, dass sich die beiden Werte irgendwo unterscheiden.

## Dein Setup überprüfen

Starte den Server neu und lade die App in einem Browser:

1. Bei **keiner Anmeldung** öffnet sich direkt die Übersicht.
2. Bei aktivierter Anmeldemethode bietet der Anmeldebildschirm jede aktivierte Methode an (und "Demo erkunden", wenn die Demo aktiv ist).
3. Führe eine Anmeldung durch und bestätige, dass du die Übersicht erreichst und dass Aufzeichnungen synchronisieren.

Wenn etwas nicht funktioniert, prüfe die Server-Logs und die [Fehlerbehebung](/knowledge-base/troubleshooting).

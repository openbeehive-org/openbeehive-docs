---
sidebar_position: 7
title: "Authentifizierung"
---

# Authentifizierung

Mit Openbeehive entscheidest du selbst, wie viel Authentifizierung du brauchst. Wer das Einzel-Binary allein zu Hause betreibt, kann die Anmeldung ganz überspringen. Eine gemeinsam genutzte Instanz kann integrierte E-Mail-/Passwort-Konten, Passkeys, die Anmeldung über einen Identity-Provider oder eine Kombination davon verwenden.

## Einen Modus wählen

| Modus | Wann verwenden | Wichtige Einstellungen |
| --- | --- | --- |
| Keine Anmeldung (Einzelnutzer) | Eine Person, ein Server, auf dem eigenen Rechner oder in einem Netzwerk, dem du vertraust | `BEEHIVE_PASSWORD_AUTH` aus (Standard für selfhost), `BEEHIVE_OIDC_PROVIDERS` leer, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| E-Mail & Passwort (App-interne Konten) | Eine gemeinsam genutzte Instanz ohne externen Identity-Provider | `BEEHIVE_PASSWORD_AUTH=true` (Standard für das `cloud`-Profil) plus `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Passwortlose Anmeldung mit Gerätebiometrie oder Sicherheitsschlüsseln, zusätzlich zu einer anderen Methode | `BEEHIVE_WEBAUTHN_ENABLED=true` plus `BEEHIVE_WEBAUTHN_RP_*` |
| OIDC-Provider | Du betreibst bereits Google, Keycloak, Authentik oder Ähnliches oder möchtest zentrale Kontoverwaltung | `BEEHIVE_OIDC_PROVIDERS` plus provider-spezifische Einstellungen |

Die Anmeldemethoden lassen sich kombinieren. Der Anmeldebildschirm bietet die jeweils aktivierten Methoden an, und ein Konto funktioniert über alle hinweg: Die Anmeldung über einen Provider wird an ein bestehendes Konto mit derselben E-Mail-Adresse angehängt, wenn beide Seiten diese Adresse verifiziert haben (siehe [Modus 4](#oidc-linking)).

Die ersten Zeilen des Server-Logs nennen den geltenden Modus, entweder `auth: NO LOGIN (single-user mode): every request has full access to all data` oder `auth: LOGIN REQUIRED (email+password, passkeys, OIDC:google)`.

Sobald eine Anmeldemethode aktiviert ist, sind auch Arbeitsbereiche und Einladungen verfügbar (Einstellungen → Arbeitsbereich); siehe [Konten & Arbeitsbereiche](../using-the-app/accounts-tenants.md).

## Modus 1: Einzelnutzer, keine Anmeldung

Der Standard für eine `selfhost`-Instanz. Lass alle drei aus:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Ohne aktivierte Anmeldemethode läuft Openbeehive als Einzelnutzer-Instanz unter einer festen lokalen Identität und zeigt nie einen Anmeldebildschirm.

Ein solcher Server antwortet nur auf Anfragen, die an `localhost`, eine IP-Adresse oder den Host aus `BEEHIVE_PUBLIC_BASE_URL` gerichtet sind. Wenn du ihn unter einem anderen Namen öffnest, trage diesen Namen in [`BEEHIVE_ALLOWED_HOSTS`](./configuration.md#allowed-hosts) ein; die `403`-Seite, die du sonst erhältst, weist darauf hin.

:::caution
"Keine Anmeldung" bedeutet, dass jeder, der den Server erreichen kann, deine Aufzeichnungen lesen und bearbeiten kann. Verwende es nur auf `localhost` oder in einem vertrauenswürdigen Netzwerk. Wenn deine Instanz aus dem Internet erreichbar ist, aktiviere eine Anmeldemethode. Der Server schreibt beim Start eine Warnung ins Log, wenn es keine Anmeldung gibt und `BEEHIVE_PUBLIC_BASE_URL` keine lokale Adresse ist.
:::

## Session-Einstellungen (erforderlich, sobald eine Anmeldung aktiviert ist)

Sobald eine Anmeldemethode eingeschaltet ist, gibt der Server signierte Session-Tokens aus und braucht dafür ein Secret von mindestens 32 Bytes. Ohne dieses Secret oder mit einem kürzeren startet der Server nicht und nennt die Einstellung:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` akzeptiert eine Go-Dauer (`720h` sind 30 Tage, `24h` ein Tag). Wenn sie abläuft, melden sich Nutzer erneut an.

Sessions lassen sich vor ihrem Ablauf beenden. Abmelden (`POST /auth/logout`, ab 0.5.1) beendet die Session, die sich abmeldet, sofort: Ihr Token wird von da an abgelehnt, auch wenn eine Kopie davon anderswo oder nach einem Neustart verwendet wird; die anderen Sessions des Kontos bleiben angemeldet. Beim Abmelden aus der gemeinsamen Demo wird nur das Cookie gelöscht. `POST /auth/logout-all` beendet alle anderen Sessions des aufrufenden Kontos und gibt dem Aufrufer ein frisches Token zurück. Außerdem prüft der Server bei jeder Anfrage, ob das Konto noch Mitglied des Arbeitsbereichs ist, in dem es arbeitet. Diese beiden wirken innerhalb von etwa 10 Sekunden.

:::danger
Halte `BEEHIVE_SESSION_SECRET` geheim und stabil. Jeder, der es erfährt, kann Sessions fälschen. Wenn du es änderst, werden alle abgemeldet. Committe es niemals in die Versionsverwaltung.
:::

Wenn du die App über HTTPS durch einen Reverse Proxy ausliefern lässt, stelle sicher, dass `BEEHIVE_PUBLIC_BASE_URL` `https://` verwendet, damit Redirect- und Einladungslinks korrekt sind. Siehe [Reverse Proxy](./reverse-proxy.md).

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

### Drosselung der Anmeldung

Fehlgeschlagene Anmeldungen werden pro Konto und pro Client-Adresse gezählt: Nach 10 Fehlversuchen für ein Konto oder 30 von einer Adresse innerhalb von 15 Minuten erhalten weitere Versuche HTTP `429` mit einem `Retry-After`-Header, bis die 15 Minuten vorbei sind. Die Passkey-Anmeldung wird auf dieselbe Weise pro Adresse gedrosselt.

Hinter einem Reverse Proxy scheint jede Anfrage vom Proxy zu kommen. Setze dort `BEEHIVE_TRUST_PROXY_HEADERS=true`, damit der Server die echte Client-Adresse zählt, die er dem letzten `X-Forwarded-For`-Eintrag entnimmt. Tu das nur, wenn genau ein Proxy davorsteht und der Server-Port anders nicht erreichbar ist; siehe [Reverse Proxy](./reverse-proxy.md).

### Instanzen nur auf Einladung

Damit Fremde keine Konten erstellen können, setze `BEEHIVE_REGISTRATION=false`. Der Admin kommt aus der Umgebung, sodass eine frische Instanz immer einen hat. Alle anderen treten über Einladungslinks bei, die ein Arbeitsbereichs-Admin unter Einstellungen → Arbeitsbereich ausstellt. Eine Einladung ist 7 Tage gültig und funktioniert nur für die E-Mail-Adresse, für die sie ausgestellt wurde. Der Anmeldebildschirm zeigt einen Hinweis, dass die Instanz nur auf Einladung zugänglich ist; bestehende Konten melden sich normal an.

Jedes neue Konto startet mit seinem eigenen persönlichen [Arbeitsbereich](../using-the-app/accounts-tenants.md). Nur das konfigurierte Admin-Konto trägt die Admin-Rolle der Instanz.

### Optionale E-Mail-Verifizierung

Standardmäßig kann sich ein neues Konto sofort anmelden. Damit Personen zuerst ihre E-Mail-Adresse bestätigen müssen:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Die Verifizierung braucht einen Mailserver: Mit `BEEHIVE_EMAIL_VERIFICATION=true` und ohne `BEEHIVE_SMTP_HOST` startet der Server nicht. Konfiguriere SMTP, damit Verifizierungs- und Einladungs-E-Mails versendet werden:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Einladungs- und Verifizierungslinks werden nie in das Server-Log geschrieben. Ohne `BEEHIVE_SMTP_HOST` wird keine Einladungs-E-Mail versendet; der Admin, der eine Einladung erstellt hat, kopiert ihren Link unter Einstellungen → Arbeitsbereich und gibt ihn weiter.
:::

### Passwörter ändern und zurücksetzen \{#password-reset}

Angemeldete Nutzer ändern ihr Passwort unter **Einstellungen → Konto → Passwort**; dabei werden sie auf allen ihren anderen Geräten abgemeldet. Wer das Passwort vergessen hat, kommt je nach Mailversand auf zwei Wegen zurück:

- **Mit `BEEHIVE_SMTP_HOST`** schickt "Passwort vergessen?" auf der Anmeldeseite einen Link per E-Mail, der eine Stunde gilt und einmal funktioniert. Die Antwort ist dieselbe, ob es zu der Adresse ein Konto gibt oder nicht. Anfragen werden wie Anmeldungen gedrosselt.
- **Ohne Mailversand** sagt die Seite, man solle sich an den Administrator wenden. Der Instanz-Admin erstellt den Link unter **Einstellungen → Konto → Passwort eines Nutzers zurücksetzen** und gibt ihn weiter; Arbeitsbereichs-Admins können das nicht.

Wer über einen Link ein neues Passwort festlegt, wird überall abgemeldet. Das Passwort des Instanz-Admins ist das aus `BEEHIVE_ADMIN_PASSWORD`: Es lässt sich weder in der App noch über einen Reset-Link ändern. Auch das Passwort des Demo-Kontos lässt sich nicht ändern.

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

Ein Passkey wird im angemeldeten Zustand unter **Einstellungen → Konto → Passkeys** hinzugefügt, Personen brauchen also zuerst eine andere Anmeldemöglichkeit (E-Mail/Passwort oder einen Provider). Danach bietet der Anmeldebildschirm "Mit Passkey anmelden".

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

### Wie Provider-Anmeldungen Konten zugeordnet werden \{#oidc-linking}

Wenn sich jemand über einen Provider anmeldet, sucht Openbeehive nach einem Konto, das bereits mit dieser Provider-Identität verknüpft ist. Gibt es keines, sucht es nach einem Konto mit derselben E-Mail-Adresse und hängt die Provider-Anmeldung daran an, aber nur, wenn der Provider die Adresse als verifiziert meldet **und** die Adresse des bestehenden Kontos verifiziert ist. Andernfalls wird die Anmeldung abgelehnt, und die Person meldet sich weiter so an wie bisher. Gibt es kein solches Konto, wird ein neues angelegt, außer die Registrierung ist geschlossen (`BEEHIVE_REGISTRATION=false`): Instanzen nur auf Einladung legen über einen Provider keine Konten an.

Instanz-Admin bleibt das in `BEEHIVE_ADMIN_EMAIL` genannte Konto, egal auf welchem Weg es sich anmeldet.

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

## Konten \{#accounts}

Personen löschen ihr eigenes Konto unter **Einstellungen → Konto → Konto löschen**. Arbeitsbereiche, in denen sie das einzige Mitglied sind, werden mitgelöscht. Solange sie der einzige Admin eines Arbeitsbereichs mit weiteren Mitgliedern sind, wird das Löschen abgelehnt, bis sie jemand anderen zum Admin machen oder diesen Arbeitsbereich löschen. Ihre Aufzeichnungen in gemeinsamen Arbeitsbereichen bleiben erhalten und werden einem gelöschten Nutzer zugeschrieben. Bestätigt wird das Löschen mit dem Passwort, einem Passkey oder, bei Konten, die sich nur über einen Provider anmelden, mit einer Anmeldung, die weniger als 5 Minuten zurückliegt. Der Instanz-Admin aus `BEEHIVE_ADMIN_EMAIL` und das Demo-Konto lassen sich in der App nicht löschen.

E-Mail-Adressen sind unabhängig von Groß- und Kleinschreibung eindeutig. Zwei Konten aus früheren Versionen, deren Adressen sich nur in der Groß- und Kleinschreibung unterscheiden, funktionieren beide weiter, aber E-Mail-Anmeldung, Einladungen und Passwort-Resets erreichen nur eines davon. Das Server-Log nennt jedes solche Paar bei jedem Start; entscheide, welches Konto die Adresse behält, und lösche das andere oder gib ihm eine andere Adresse.

Links, die ein Browser als Seite öffnet (`/auth/verify` aus einer Verifizierungs-E-Mail, `/auth/login` und `/auth/callback` einer Provider-Anmeldung), schicken den Browser bei einem Fehler mit einer übersetzten Fehlermeldung zur Anmeldeseite, statt JSON anzuzeigen.

## Anmeldung für eine bestehende Einzelnutzer-Instanz einschalten \{#single-user-to-login}

Aufzeichnungen, die ohne Anmeldung entstanden sind, gehören zu einem festen lokalen Arbeitsbereich, den kein Konto sehen kann. Wenn der Server mit aktivierter E-Mail-/Passwort-Anmeldung startet und solche Aufzeichnungen findet, verschiebt er sie in den Arbeitsbereich des Instanz-Admins und protokolliert, wie viele Zeilen er verschoben hat. Einheiten und eine Sprache, die ohne Anmeldung gewählt wurden, werden zu den Einstellungen des Admins. Melde dich als Admin an, um sie zu sehen. Das Verschieben geschieht einmal und lässt sich nicht rückgängig machen, indem du die Anmeldung wieder ausschaltest; erstelle vorher ein [Backup](./backups.md).

Zwei Dinge solltest du wissen:

- Änderungen, die ein Gerät vor der Umstellung noch nicht synchronisiert hatte, bleiben in den alten lokalen Daten dieses Geräts und werden nicht hochgeladen. Synchronisiere jedes Gerät, bevor du die Anmeldung einschaltest.
- Nur mit OIDC oder Passkeys gibt es keinen Instanz-Admin. Die Aufzeichnungen bleiben dann, wo sie sind, und das Log fordert dazu auf, `BEEHIVE_PASSWORD_AUTH=true` mit `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD` zu setzen, um sie zu übernehmen.

## Dein Setup überprüfen

Starte den Server neu und lade die App in einem Browser:

1. Bei **keiner Anmeldung** öffnet sich direkt die Übersicht.
2. Bei aktivierter Anmeldemethode bietet der Anmeldebildschirm jede aktivierte Methode an (und "Demo ausprobieren", wenn die Demo aktiv ist).
3. Führe eine Anmeldung durch und bestätige, dass du die Übersicht erreichst und dass Aufzeichnungen synchronisieren.

Wenn etwas nicht funktioniert, prüfe die Server-Logs und die [Fehlerbehebung](../knowledge-base/troubleshooting.md).

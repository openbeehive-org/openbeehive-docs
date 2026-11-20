---
sidebar_position: 11
title: "Demo-Modus"
---

# Demo-Modus

Der Demo-Modus installiert ein vorgefertigtes **Demo-Konto und einen Demo-Arbeitsbereich**, damit
Besucher Openbeehive mit realistischen Daten ausprobieren können, ohne die echten Aufzeichnungen
anderer zu berühren. Er ist **standardmäßig deaktiviert** und für öffentliche Präsentationen
und Tests gedacht.

:::note[Suchst du die öffentliche Demo?]
Die projekteigene Demo ist die Schaltfläche **Demo ausprobieren** auf
[app.openbeehive.org/login](https://app.openbeehive.org/login). Eine eigene
Demo-Website gibt es nicht. Auf dieser Seite geht es darum, die Demo für deine
eigene Instanz einzuschalten.
:::

## Was er einrichtet

Wenn aktiviert, erstellt Openbeehive:

- ein Demo-Konto (`demo@app.openbeehive.org` / `demo` standardmäßig),
- einen Demo-**Arbeitsbereich** mit **15 Völkern auf 4 Bienenständen**,
- eine Saison an Daten: Königinnen, 105 Durchsichten (7 pro Beute, verteilt über die
  letzten zehn Monate, mit Temperatur, Luftfeuchtigkeit, Varroa, Gewicht und mehr), eine
  Honigernte und zwei Varroabehandlungen pro Beute.

Die Daten werden **jede Stunde neu aufgesetzt**, sodass die Präsentation immer gleich aussieht.
Demo-Sitzungen sind auf dem Server schreibgeschützt: Was ein Besucher ändert, bleibt in
seinem eigenen Browser und erreicht weder den Server noch andere Besucher.

Der Anmeldebildschirm erhält neben der normalen Anmeldung die Schaltfläche
**Demo ausprobieren**; sie meldet den Besucher ohne Passwort an.

Wenn jemand im Demo-Konto angemeldet ist, zeigt die App ein **Banner**, das daran erinnert, dass
man sich in der Demo befindet und dass die Daten stündlich zurückgesetzt werden.

## Aktivierung

```bash
BEEHIVE_DEMO=true
```

Mehr ist nicht nötig. Das Aktivieren des Demo-Modus schaltet automatisch die
[Anmeldung per E-Mail/Passwort](./authentication.md) ein, damit sich das Demo-Konto
anmelden kann. Optional können die Zugangsdaten überschrieben werden:

```bash
BEEHIVE_DEMO_EMAIL=demo@app.openbeehive.org
BEEHIVE_DEMO_PASSWORD=demo
```

Starte den Server neu. Du siehst eine Log-Zeile, die bestätigt, dass die Demo installiert
wurde, und das Demo-Konto kann sich sofort anmelden. Da der Demo-Modus die
Passwort-Anmeldung impliziert, braucht die Instanz auch ihren eigenen Admin
(`BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD`, siehe
[Authentifizierung](./authentication.md)), und die Admin-E-Mail muss sich von der
Demo-E-Mail unterscheiden. Wie jede Anmeldemethode braucht er
`BEEHIVE_SESSION_SECRET`.

`docker-compose.demo.yml` im Repository ist das Deployment hinter
`app.openbeehive.org` (Registrierung nur auf Einladung plus die Demo mit automatischer
Anmeldung). Es ist keine Vorlage für deinen eigenen Server; geh von
[`docker-compose.prod.yml`](./docker.md#several-users) aus und ergänze `BEEHIVE_DEMO: "true"`
in der Umgebung des `server`-Dienstes, wenn du eine Demo möchtest.

### Schaufenster-Hosts: den Anmeldebildschirm überspringen

Auf einem Host, der nur die Demo zeigen soll, kannst du Besucher automatisch anmelden:

```bash
BEEHIVE_DEMO_AUTOLOGIN=true
```

Anonyme Besucher landen direkt im Demo-Arbeitsbereich statt auf dem Anmeldebildschirm. Lass das
auf einer Instanz mit echten Nutzern aus, damit sie die normale Anmeldeseite mit dem
Demo-Button bekommen.

## Wie sie isoliert ist

- Die Demo lebt in ihrem **eigenen Arbeitsbereich**; das stündliche Zurücksetzen löscht und
  erstellt nur **Demo-Daten** neu, niemals andere Arbeitsbereiche.
- Echte Benutzer auf derselben Instanz sind nicht betroffen: Sie haben ihre eigenen Arbeitsbereiche.

:::caution
Das Demo-Konto ist ein echtes, anmeldbares Konto. Wähle auf einer öffentlichen Instanz ein
Demo-Passwort, das du bedenkenlos teilen kannst, und verwende es nirgendwo sonst. Lass
`BEEHIVE_DEMO=false` auf privaten Instanzen, die keine Präsentation benötigen.
:::

## Deaktivierung

Setze `BEEHIVE_DEMO=false` (oder entferne die Variable) und starte neu. Neue
Anmeldungen am Demo-Konto funktionieren dann nicht mehr; vorhandene Demo-Daten bleiben bestehen,
bis du sie entfernst. Das Demo-Konto und der Demo-Arbeitsbereich haben die internen IDs `demo-user` /
`demo-tenant`, falls du sie aus der Datenbank löschen möchtest.

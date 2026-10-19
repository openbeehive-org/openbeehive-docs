---
sidebar_position: 11
title: "Demo-Modus"
---

# Demo-Modus

Der Demo-Modus installiert ein vorgefertigtes **Demo-Konto und einen Demo-Mandanten**, damit
Besucher Openbeehive mit realistischen Daten ausprobieren können, ohne die echten Aufzeichnungen
anderer zu berühren. Er ist **standardmäßig deaktiviert** und für öffentliche Präsentationen
und Tests gedacht.

## Was er einrichtet

Wenn aktiviert, erstellt Openbeehive:

- ein Demo-Konto (`demo@app.openbeehive.org` / `demo` standardmäßig),
- einen Demo-**Mandanten** mit **15 Völkern auf 4 Bienenständen**,
- eine Saison an Daten: Königinnen, 105 Durchsichten (7 pro Beute, verteilt über die
  letzten zehn Monate, mit Temperatur, Luftfeuchtigkeit, Varroa, Gewicht und mehr), eine
  Honigernte und zwei Varroabehandlungen pro Beute.

Die Daten werden **jede Stunde neu aufgesetzt**, sodass die Präsentation immer gleich aussieht –
ein Besucher kann frei bearbeiten, und beim nächsten Zurücksetzen kehrt alles zum
ursprünglichen Datensatz zurück.

Wenn jemand im Demo-Konto angemeldet ist, zeigt die App ein **Banner**, das daran erinnert, dass
man sich in der Demo befindet und dass die Daten stündlich zurückgesetzt werden.

## Aktivierung

```bash
BEEHIVE_DEMO=true
```

Mehr ist nicht nötig. Das Aktivieren des Demo-Modus schaltet automatisch die
[Anmeldung per E-Mail/Passwort](/self-hosting/authentication) ein, damit sich das Demo-Konto
anmelden kann. Optional können die Zugangsdaten überschrieben werden:

```bash
BEEHIVE_DEMO_EMAIL=demo@app.openbeehive.org
BEEHIVE_DEMO_PASSWORD=demo
```

Starte den Server neu. Du siehst eine Log-Zeile, die bestätigt, dass die Demo installiert
wurde, und das Demo-Konto kann sich sofort anmelden. Da der Demo-Modus die
Passwort-Anmeldung impliziert, braucht die Instanz auch ihren eigenen Admin
(`BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD`, siehe
[Authentifizierung](/self-hosting/authentication)), und die Admin-E-Mail muss sich von der
Demo-E-Mail unterscheiden.

### Schaufenster-Hosts: den Anmeldebildschirm überspringen

Auf einem Host, der nur die Demo zeigen soll, kannst du Besucher automatisch anmelden:

```bash
BEEHIVE_DEMO_AUTOLOGIN=true
```

Anonyme Besucher landen direkt im Demo-Mandanten statt auf dem Anmeldebildschirm. Lass das
auf einer Instanz mit echten Nutzern aus, damit sie die normale Anmeldeseite mit dem
Demo-Button bekommen.

## Wie sie isoliert ist

- Die Demo lebt in ihrem **eigenen Mandanten**; das stündliche Zurücksetzen löscht und
  erstellt nur **Demo-Daten** neu, niemals andere Mandanten.
- Echte Benutzer auf derselben Instanz sind nicht betroffen – sie haben ihre eigenen Mandanten.

:::caution
Das Demo-Konto ist ein echtes, anmeldbares Konto. Wähle auf einer öffentlichen Instanz ein
Demo-Passwort, das du bedenkenlos teilen kannst, und verwende es nirgendwo sonst. Lass
`BEEHIVE_DEMO=false` auf privaten Instanzen, die keine Präsentation benötigen.
:::

## Deaktivierung

Setze `BEEHIVE_DEMO=false` (oder entferne die Variable) und starte neu. Neue
Anmeldungen am Demo-Konto funktionieren dann nicht mehr; vorhandene Demo-Daten bleiben bestehen,
bis du sie entfernst. Das Demo-Konto und der Demo-Mandant heißen intern `demo-user` /
`demo-tenant`, falls du sie aus der Datenbank löschen möchtest.

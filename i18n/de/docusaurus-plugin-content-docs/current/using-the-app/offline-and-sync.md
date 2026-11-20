---
sidebar_position: 10
title: "Offline & Synchronisation"
---

# Offline & Synchronisation

Openbeehive ist für den Bienenstand gebaut, nicht für das Büro. Draußen im Feld hast du selten zuverlässigen Empfang, deshalb ist die App **offline-first**: Alles, was du tust, wird sofort auf deinem Gerät gespeichert und später im Hintergrund mit dem Server synchronisiert.

Die App lässt dich nie auf das Netzwerk warten. Öffne eine Beute, erfasse eine Durchsicht, füge eine Aufgabe hinzu, notiere etwas zur Königin: Alles ist sofort da, mit oder ohne Empfang.

## Alles wird lokal gespeichert

Openbeehive hält eine vollständige Kopie deiner Aufzeichnungen in einer kleinen Datenbank auf deinem Gerät. Jeder Lese- und jeder Schreibvorgang erfolgt zuerst gegen diese lokale Kopie.

- **Es ist schnell.** Eine Beute zu öffnen oder durch Durchsichten zu scrollen wartet nie auf einen Ladebalken.
- **Es funktioniert ohne Empfang.** Ein Wald, ein Tal, ein Keller voller Honigräume.
- **Deine Daten gehören dir.** Die Aufzeichnungen leben auf deinem Gerät; der Server ist die Kopie zum Synchronisieren und Teilen.

:::tip
Da Aufzeichnungen auf dem Gerät gespeichert werden, installiere Openbeehive als App, statt es in einem Browser-Tab zu nutzen. Siehe [Openbeehive installieren](./install.md).
:::

## Der Synchronisationsstatus \{#sync-status}

Ein kleiner Status-Chip oben auf jeder Seite (und unter deiner E-Mail-Adresse in der Seitenleiste) sagt, ob die Änderungen dieses Geräts den Server erreicht haben:

| Der Chip zeigt | Bedeutung |
| --- | --- |
| **Synchronisiert** und eine Zeitangabe | Alles auf diesem Gerät ist auf dem Server. |
| **Synchronisiere…** | Ein Austausch mit dem Server läuft. |
| **Warten auf Upload: 3** | Drei Änderungen sind auf dem Gerät gespeichert und noch nicht hochgeladen. |
| **Offline** oder **Offline · 3 warten** | Keine Verbindung. Änderungen warten auf dem Gerät. |
| **Synchronisierung fehlgeschlagen · neuer Versuch** | Der Server war nicht erreichbar oder hat mit einem Fehler geantwortet. Die App versucht es weiter. |
| **Abgemeldet · zum Synchronisieren anmelden** | Deine Sitzung ist beendet. Tippe auf den Chip, um dich anzumelden; es geht nichts verloren. |
| **Sync-Probleme: 2** | Der Server hat zwei Änderungen abgelehnt; siehe unten. |
| **App veraltet · zum Synchronisieren aktualisieren** | Der Server verlangt eine neuere Version der App. Lade die neue Version; bis dahin warten Änderungen auf dem Gerät. |

Tippe auf den Chip, um sofort zu synchronisieren. Auch ohne Tippen synchronisiert die App nach jeder Änderung, in kurzen Abständen, solange sie geöffnet ist, und sobald die Verbindung zurück ist.

Solange das Gerät keine Verbindung hat, steht außerdem in einer Leiste am oberen Rand der Seite „Offline: Änderungen werden gespeichert und später synchronisiert.“ Das ist rein informativ; mach genau wie zuvor weiter.

:::note
Eine dauerhafte Offline-Anzeige bedeutet meist schwachen Empfang am Bienenstand. Bleibt sie selbst bei guter Verbindung zu Hause bestehen, siehe [Fehlerbehebung](../knowledge-base/troubleshooting.md).
:::

### Sync-Probleme \{#sync-problems}

Hin und wieder nimmt der Server eine Änderung nicht an, zum Beispiel weil der Eintrag zu einem anderen Arbeitsbereich gehört oder weil die Uhr des Geräts weit vorging. Eine solche Änderung wird nicht weggeworfen: Sie bleibt auf dem Gerät, und der Chip zeigt **Sync-Probleme** mit der Anzahl der abgelehnten Änderungen. Die Liste **Sync-Probleme** in den **Einstellungen** nennt jede davon mit dem Grund und bietet **Erneut versuchen** (oder **Alle erneut versuchen**) und **Verwerfen** an. Verwerfen stoppt den Upload; der Eintrag bleibt auf diesem Gerät, wie er ist, erreicht aber nie den Server, deine anderen Geräte oder die anderen Mitglieder.

### Geräteuhren

Jede Änderung trägt die Uhrzeit des Geräts, das sie vorgenommen hat. Der Server lehnt Änderungen ab, deren Zeitstempel seiner eigenen Zeit mehr als 10 Minuten voraus ist. Die App erfährt bei jeder Synchronisation die Zeit des Servers, gleicht eine falsch gehende Geräteuhr aus und stempelt und sendet solche Änderungen von sich aus erneut.

## Deine erste Synchronisation auf einem neuen Gerät

Wer sich auf einem neuen Gerät anmeldet oder die App nach gelöschtem Speicher wieder öffnet, startet mit einer leeren lokalen Datenbank. Die App lädt die aktuellen Aufzeichnungen des Arbeitsbereichs vom Server, nicht die vollständige Historie jeder Änderung, und füllt die Datenbank im Hintergrund:

- Listen zeigen **schimmernde Platzhalter**, während sie aus der lokalen Datenbank lesen.
- Solange der erste Download noch läuft, zeigen die Übersicht sowie die Listen der Bienenstände, Beuten und Aufgaben **„Daten werden synchronisiert…"** statt eines leeren Zustands.
- Große Datenbestände erscheinen **schrittweise**: Jedes empfangene Paket wird sofort angezeigt.

Erst wenn die App weiß, dass die Daten vollständig sind, zeigt sie einen echten leeren Zustand. Ist das Gerät offline oder der Server nicht erreichbar, weicht der Hinweis dem, was lokal gespeichert ist.

Nachdem sich die App auf Version 0.5.0 aktualisiert hat, lädt jedes Gerät die aktuellen Aufzeichnungen noch einmal vom Server. Das schließt Lücken, die frühere Versionen hinterlassen konnten, und erfordert nichts von dir. Dasselbe tut ein Gerät, das länger nicht synchronisiert hat, als der Server seine Liste der Änderungen aufbewahrt (standardmäßig 180 Tage).

### Nachdem der Server wiederhergestellt wurde \{#after-restore}

Stellt der Betreiber den Server aus einem Backup wieder her, fehlen dem Server womöglich Änderungen, die dein Gerät schon synchronisiert hatte. Die App bemerkt das bei der nächsten Synchronisation, lädt alle Aufzeichnungen, die sie hat, erneut hoch, zusammen mit den Fotos, die sie vorhält, und lädt den aktuellen Stand. Danach zeigt sie „Die Daten des Servers wurden zurückgesetzt oder wiederhergestellt. Dieses Gerät hat seine Einträge erneut gesendet und den aktuellen Stand geladen.“ Es ist nichts zu tun; tippe auf **OK**, um die Meldung zu schließen.

## Synchronisation über deine Geräte

Nutze Openbeehive auf mehreren Geräten, einem Smartphone im Feld und einem Laptop zu Hause, und sie bleiben im Gleichschritt. Jedes Gerät behält seine eigene lokale Kopie und tauscht Änderungen im Hintergrund mit dem Server aus. Erfasse eine Durchsicht auf deinem Smartphone an den Beuten, und wenn du dich an deinen Laptop setzt, ist sie da. Solange sich jedes Gerät beim selben Konto anmeldet, sehen alle dieselben Aufzeichnungen.

## Was passiert, wenn zwei Geräte dasselbe ändern

Openbeehive löst überlappende Änderungen **automatisch** auf, ohne Abfragen der Art „Welche Version möchtest du behalten?".

- **Du bearbeitest die Notiz eines Bienenstands auf deinem Smartphone, dein Mitimker bearbeitet dieselbe Notiz auf seinem.** Die jüngste Bearbeitung dieses Feldes gewinnt.
- **Ihr fügt beide offline Fotos zu derselben Durchsicht hinzu.** Beide Fotosätze bleiben erhalten.
- **Du änderst deine Einheiten auf einem Gerät.** Einheiten und Sprache werden mit deinem Konto gespeichert und folgen dir auf jedes Gerät; siehe [Einstellungen](./dashboard.md#settings).
- **Ihr erfasst jeweils eine separate Durchsicht.** Jede Durchsicht, Ernte und Behandlung ist ein eigener Datensatz, beide bleiben also nebeneinander erhalten.

Jedes Gerät konvergiert auf denselben Zustand, sobald alle synchronisiert haben.

:::tip
Die Kurzfassung: füge frei hinzu, bearbeite zuversichtlich. Wie das unter der Haube funktioniert, steht auf den Seiten zum [Sync-Protokoll](../developers/sync-protocol.md) und zur [Architektur](../developers/architecture.md).
:::

## Fotos \{#photos}

Ein Foto besteht aus zwei Teilen. Eine kleine Vorschau synchronisiert wie alles andere mit dem Eintrag, sodass jedes Gerät sie sofort zeigt, auch offline. Das Bild in voller Größe bleibt auf dem Gerät, das das Foto aufgenommen hat, und wird im Hintergrund hochgeladen, sobald eine Verbindung besteht; bis dahin zeigt das Foto **Wartet auf den Upload**. Andere Geräte laden das volle Bild, wenn du das Foto zum ersten Mal öffnest, und behalten eine Kopie.

Das Löschen eines Fotos ist endgültig: Es verschwindet von jedem Gerät, und das Bild wird vom Server entfernt. Geräte, auf denen noch Version 0.4 der App läuft, sehen keine Fotos, die aktualisierte Geräte hinzufügen.

## Teilen

Aufzeichnungen werden über **Arbeitsbereiche** geteilt. Jedes Mitglied eines Arbeitsbereichs sieht und bearbeitet alle seine Bienenstände, Beuten und Aufzeichnungen; ein Teilen pro Bienenstand oder pro Beute gibt es nicht. Die Ausnahme sind [Aufgaben](./tasks.md): Sie sind persönlich.

| Rolle | Was sie tun kann |
| --- | --- |
| **Admin** (Eigentümer des Arbeitsbereichs) | Alles, was ein Mitglied kann, plus einladen und zurückziehen sowie den Arbeitsbereich löschen. |
| **Mitglied** | Bienenstände, Beuten, Durchsichten, Ernten und Behandlungen im Arbeitsbereich anlegen und bearbeiten. |

Um einen Standort mit einem Mentor zu teilen und andere privat zu halten, legst du diesen Standort in einen eigenen Arbeitsbereich und lädst den Mentor dorthin ein. Geteilte Aufzeichnungen synchronisieren und lösen Konflikte genau wie deine eigenen. Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md).

## Wenn etwas nicht gespeichert werden kann

Gespeichert wird auf deinem Gerät, deshalb schlägt das praktisch nie fehl. Falls doch (etwa weil der Speicher des Browsers voll oder beschädigt ist), bleibt das Formular mit allen Eingaben offen, und eine Fehlermeldung erklärt, was schiefgelaufen ist.

Beim öffentlichen **Demo-Konto** nimmt der Server keine Änderungen an (die Demo setzt sich stündlich zurück). Wenn du dort etwas änderst, macht die App die Änderung rückgängig und sagt, dass sie nicht gespeichert wurde.

Es gibt eine Situation, in der Speichern funktioniert, aber nicht von Dauer ist: Kann der Browser der App ihren privaten Speicher nicht geben (ein privates Browserfenster oder in den Browsereinstellungen blockierter Speicher), hält die App die Aufzeichnungen im Arbeitsspeicher und zeigt ein Banner: **„Dieser Browser speichert keine Daten auf diesem Gerät (privates Fenster oder blockierter Speicher). Alles, was noch nicht synchronisiert ist, geht beim Schließen dieses Tabs verloren.“** Für die Sitzung funktioniert alles weiter, und Änderungen werden weiterhin mit dem Server synchronisiert, wenn du angemeldet bist, aber die lokale Kopie ist weg, sobald der Tab geschlossen wird. Siehe [Fehlerbehebung](../knowledge-base/troubleshooting.md#storage-is-unavailable).

## Nur ein Tab gleichzeitig \{#one-tab}

Nur ein Tab oder Fenster kann gleichzeitig mit den Aufzeichnungen auf einem Gerät arbeiten. Öffnest du Openbeehive in einem zweiten Tab, zeigt er **„Openbeehive ist in einem anderen Tab geöffnet“**. Mach im ersten Tab weiter oder tippe auf **Hier verwenden**, um die App in den neuen Tab zu holen; der andere zeigt dann den Hinweis.

## Werde ich jemals Daten verlieren?

Deine Aufzeichnungen werden zuerst auf dein Gerät geschrieben und nicht entfernt, weil du offline bist oder die App geschlossen wird. Sie warten auf dem Gerät, bis sie synchronisiert werden können.

Wenn du selbst hostest, halte zusätzlich Server-Backups vor. Siehe [Backups](../self-hosting/backups.md).

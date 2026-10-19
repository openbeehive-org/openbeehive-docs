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
Da Aufzeichnungen auf dem Gerät gespeichert werden, installiere Openbeehive als App, statt es in einem Browser-Tab zu nutzen. Siehe [Openbeehive installieren](/using-the-app/install).
:::

## Die Offline-Anzeige

Hat das Gerät keine Verbindung, wechselt der Konto-Block in der Seitenleiste von **Online** zu **Offline**, und eine Leiste am oberen Rand der Seite meldet, dass Änderungen gespeichert und später synchronisiert werden. Das ist rein informativ; mach genau wie zuvor weiter.

Sobald das Gerät wieder online ist, verschwindet die Leiste und alle offline vorgenommenen Änderungen werden automatisch hochgesendet. Es gibt keinen Button „Jetzt synchronisieren".

:::note
Eine dauerhafte Offline-Anzeige bedeutet meist schwachen Empfang am Bienenstand. Bleibt sie selbst bei guter Verbindung zu Hause bestehen, siehe [Fehlerbehebung](/knowledge-base/troubleshooting).
:::

## Deine erste Synchronisation auf einem neuen Gerät

Wer sich auf einem neuen Gerät anmeldet oder die App nach gelöschtem Speicher wieder öffnet, startet mit einer leeren lokalen Datenbank, die sich im Hintergrund füllt:

- Listen zeigen **schimmernde Platzhalter**, während sie aus der lokalen Datenbank lesen.
- Solange der erste Download noch läuft, zeigen die Übersicht sowie die Listen der Bienenstände, Beuten und Aufgaben **„Daten werden synchronisiert…"** statt eines leeren Zustands.
- Große Datenbestände erscheinen **schrittweise**: Jedes empfangene Paket wird sofort angezeigt.

Erst wenn die App weiß, dass die Daten vollständig sind, zeigt sie einen echten leeren Zustand. Ist das Gerät offline oder der Server nicht erreichbar, weicht der Hinweis dem, was lokal gespeichert ist.

## Synchronisation über deine Geräte

Nutze Openbeehive auf mehreren Geräten, einem Smartphone im Feld und einem Laptop zu Hause, und sie bleiben im Gleichschritt. Jedes Gerät behält seine eigene lokale Kopie und tauscht Änderungen im Hintergrund mit dem Server aus. Erfasse eine Durchsicht auf deinem Smartphone an den Beuten, und wenn du dich an deinen Laptop setzt, ist sie da. Solange sich jedes Gerät beim selben Konto anmeldet, sehen alle dieselben Aufzeichnungen.

## Was passiert, wenn zwei Geräte dasselbe ändern

Openbeehive löst überlappende Änderungen **automatisch** auf, ohne Abfragen der Art „Welche Version möchtest du behalten?".

- **Du bearbeitest die Notiz eines Bienenstands auf deinem Smartphone, dein Mitimker bearbeitet dieselbe Notiz auf seinem.** Die jüngste Bearbeitung dieses Feldes gewinnt.
- **Ihr fügt beide offline Fotos zu derselben Durchsicht hinzu.** Beide Fotosätze bleiben erhalten.
- **Ihr erfasst jeweils eine separate Durchsicht.** Durchsichten, Ernten und Behandlungen werden immer nur hinzugefügt, beide bleiben also nebeneinander erhalten.

Jedes Gerät konvergiert auf denselben Zustand, sobald alle synchronisiert haben.

:::tip
Die Kurzfassung: füge frei hinzu, bearbeite zuversichtlich. Wie das unter der Haube funktioniert, steht auf den Seiten zum [Sync-Protokoll](/developers/sync-protocol) und zur [Architektur](/developers/architecture).
:::

## Teilen

Aufzeichnungen werden über **Mandanten** geteilt. Jedes Mitglied eines Mandanten sieht und bearbeitet alle seine Bienenstände, Beuten und Aufzeichnungen; ein Teilen pro Bienenstand oder pro Beute gibt es nicht.

| Rolle | Was sie tun kann |
| --- | --- |
| **Admin** (Eigentümer des Mandanten) | Alles, was ein Mitglied kann, plus einladen und zurückziehen sowie den Mandanten löschen. |
| **Mitglied** | Bienenstände, Beuten, Durchsichten, Aufgaben, Ernten und Behandlungen im Mandanten anlegen und bearbeiten. |

Um einen Standort mit einem Mentor zu teilen und andere privat zu halten, legst du diesen Standort in einen eigenen Mandanten und lädst den Mentor dorthin ein. Geteilte Aufzeichnungen synchronisieren und lösen Konflikte genau wie deine eigenen. Siehe [Konten & Mandanten](/using-the-app/accounts-tenants).

## Wenn etwas nicht gespeichert werden kann

Gespeichert wird auf deinem Gerät, deshalb schlägt das praktisch nie fehl. Falls doch (etwa weil der Speicher des Browsers voll oder beschädigt ist), bleibt das Formular mit allen Eingaben offen, und eine Fehlermeldung erklärt, was schiefgelaufen ist.

Beim öffentlichen **Demo-Konto** lehnt der Server Änderungen ab (die Demo setzt sich stündlich zurück). Deine Änderungen werden auf deinem Gerät gespeichert und bleiben einfach dort, statt zu synchronisieren.

Es gibt eine Situation, in der Speichern funktioniert, aber nicht von Dauer ist: Kann der Browser der App ihren privaten Speicher nicht geben, weicht die App auf eine Datenbank im Arbeitsspeicher aus und zeigt den Hinweis **„Speicher nicht verfügbar – Änderungen bleiben auf diesem Gerät nicht erhalten."** Für die Sitzung funktioniert alles weiter, und Änderungen werden weiterhin mit dem Server synchronisiert, wenn du angemeldet bist, aber die lokale Kopie ist weg, sobald der Tab geschlossen wird. Das passiert in privaten Browserfenstern und wenn ein zweiter Tab der App den Speicher noch hält; siehe [Fehlerbehebung](/knowledge-base/troubleshooting#storage-is-unavailable).

## Werde ich jemals Daten verlieren?

Deine Aufzeichnungen werden zuerst auf dein Gerät geschrieben und nicht entfernt, weil du offline bist oder die App geschlossen wird. Sie warten auf dem Gerät, bis sie synchronisiert werden können.

Wenn du selbst hostest, halte zusätzlich Server-Backups vor. Siehe [Backups](/self-hosting/backups).

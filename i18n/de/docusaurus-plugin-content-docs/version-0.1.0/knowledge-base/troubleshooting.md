---
sidebar_position: 6
title: "Fehlerbehebung"
---

# Fehlerbehebung

Die meisten Probleme mit Openbeehive fallen in eine Handvoll Kategorien: Synchronisierung, lokaler Speicher, die Kamera/der QR-Scanner oder die Anmeldung. Diese Seite geht jede davon durch, mit praktischen Prüfungen, die du selbst durchführen kannst, bevor du Hilfe suchst.

Die gute Nachricht: Da Openbeehive offline-first ist, liegen deine Aufzeichnungen in einer lokalen Datenbank auf deinem Gerät. Fast nichts, was du hier tust, kann Daten verlieren, die bereits zum Server synchronisiert wurden.

## Daten synchronisieren nicht

Deine Änderungen werden sofort auf dem Gerät gespeichert. Die Synchronisierung mit dem Server geschieht still im Hintergrund, sodass eine Verzögerung normal und selten ein Grund zur Sorge ist. Wenn Änderungen, die du auf einem Gerät vorgenommen hast, auf einem anderen nicht erscheinen, arbeite diese Liste durch.

**1. Prüfe, ob du online bist.** Die Synchronisierung läuft nur, wenn du eine Netzwerkverbindung hast. Sieh dir die Synchronisierungs-Statusanzeige in der App an. Wenn du im Feld ohne Empfang gearbeitet hast, sind deine Bearbeitungen sicher in der Warteschlange und werden gesendet, sobald du wieder verbunden bist.

**2. Prüfe, ob du angemeldet bist.** Die Synchronisierung erfordert eine authentifizierte Sitzung. Wenn deine Sitzung abgelaufen ist, kannst du weiterhin lokal lesen und bearbeiten, aber nichts wird synchronisiert, bis du dich erneut anmeldest. Öffne das Kontomenü und bestätige, dass du angemeldet bist.

**3. Prüfe den Bienenstand-Scope.** Das Teilen in Openbeehive erfolgt auf Ebene des Bienenstands über **Scopes**. Wenn ein Bienenstock oder eine Durchsicht auf einem anderen Gerät oder bei einer anderen Person fehlt, bestätige, dass der betreffende Bienenstand mit diesem Konto geteilt ist. Aufzeichnungen in einem Bienenstand, auf den du keinen Zugriff hast, werden niemals erscheinen.

**4. Gib ihm einen Moment, dann öffne es erneut.** Die Hintergrundsynchronisierung läuft periodisch. Das Schließen und erneute Öffnen der App oder das Wechseln zu ihr aus dem Hintergrund stößt einen neuen Synchronisierungsversuch an.

:::note
Die Synchronisierung ist konzeptbedingt konfliktfrei. Openbeehive verwendet Hybrid Logical Clocks mit Last-Writer-Wins für einzelne Felder und Add-wins-Mengen für Listen, und nur anfügbare Events (Durchsichten, Behandlungen, Ernten) kollidieren nie. Du verlierst keine Arbeit, weil zwei Geräte gleichzeitig bearbeitet haben. Die jüngste Bearbeitung eines bestimmten Feldes gewinnt; beide Hinzufügungen zu einer Liste bleiben erhalten.
:::

Wenn du selbst hostest und die Synchronisierung für alle fehlschlägt, liegt das Problem eher serverseitig. Siehe [Selbst-Hosting-Konfiguration](/self-hosting/configuration) und prüfe die Serverprotokolle.

## Wie der lokale Speicher funktioniert

Openbeehive ist eine Progressive Web App (PWA). Sie hält deinen gesamten Datenbestand in einer SQLite-Datenbank vor, die innerhalb deines Browsers läuft und in **OPFS** (dem Origin Private File System) gespeichert wird. Jeder Lese- und Schreibvorgang erfolgt gegen diese lokale Datenbank, weshalb sich die App sofort anfühlt und ganz ohne Empfang funktioniert.

Ein paar praktische Folgen:

- Deine Daten sind an den Browser und das Gerät gebunden, auf dem du Openbeehive verwendest. Jedes Gerät behält seine eigene lokale Kopie und synchronisiert mit dem Server.
- Der OPFS-Speicher ist privat für den Origin der App. Andere Websites können ihn nicht lesen.
- Das Installieren der App auf deinem Startbildschirm (siehe [Installation](/using-the-app/install)) verwendet auf den meisten Plattformen denselben Speicher wie der Browser-Tab.

:::caution
Browser-Werkzeuge, die „Websitedaten löschen“, „Cookies und Speicher löschen“ oder privates/Inkognito-Surfen können die lokale OPFS-Datenbank löschen. Das ist **nur dann sicher, wenn deine Daten bereits** zum Server synchronisiert wurden, da sie bei der nächsten Anmeldung erneut heruntergeladen werden. Wenn du nicht synchronisierte Offline-Änderungen hast, stelle sicher, dass du online bist, und lass die Synchronisierung zuerst abschließen.
:::

## Die App leeren oder neu installieren

Manchmal behebt ein Neustart seltsames Verhalten nach einer Aktualisierung. Solange du in einem Konto angemeldet bist, das synchronisiert, ist dies nicht destruktiv: Deine synchronisierten Aufzeichnungen kommen vom Server zurück.

1. Bestätige, dass du **online und angemeldet** bist und dass die Synchronisierungsanzeige zeigt, dass alles auf dem neuesten Stand ist.
2. Deinstalliere oder entferne die PWA von deinem Startbildschirm oder leere den Speicher der Website in deinen Browsereinstellungen.
3. Öffne Openbeehive erneut und melde dich an.
4. Warte, bis die erste Synchronisierung deine Bienenstände, Bienenstöcke und die Historie heruntergeladen hat.

:::danger
Leere den Speicher nicht, wenn du ausschließlich offline vorhandene Änderungen hast, die den Server noch nicht erreicht haben (zum Beispiel im Feld ohne Empfang erfasste Durchsichten). Diese Bearbeitungen existieren nur auf jenem Gerät, bis die Synchronisierung abgeschlossen ist. Gehe online und lass die Synchronisierung zuerst abschließen.
:::

## Kamera und QR-Scanner funktionieren nicht

Jeder Bienenstock kann ein druckbares QR-Etikett tragen, das per Deep Link zu diesem Bienenstock führt (siehe [QR-Etiketten](/using-the-app/qr-labels)). Das Scannen benötigt Kamerazugriff.

- **Erteile die Kameraberechtigung.** Erlaube den Kamerazugriff, wenn du dazu aufgefordert wirst. Falls du ihn zuvor verweigert hast, aktiviere ihn in deinen Browser- oder Betriebssystemeinstellungen für die Website erneut und lade dann neu.
- **Verwende HTTPS.** Browser erlauben Kamerazugriff nur auf sicheren Origins. Die gehostete App wird über HTTPS ausgeliefert; Selbst-Hoster müssen ebenfalls über HTTPS ausliefern (oder `localhost` zum Testen). Siehe [Reverse Proxy](/self-hosting/reverse-proxy).
- **Prüfe, ob sie nicht in Verwendung ist.** Schließe andere Apps oder Tabs, die die Kamera möglicherweise belegen.

:::tip iOS Safari
Auf iPhone und iPad kann der App-interne Scanner eingeschränkt sein. Wenn das Scannen nicht funktioniert, öffne die integrierte **Kamera-App** und richte sie auf den QR-Code. iOS erkennt den codierten Link und bietet an, ihn zu öffnen; ein Tippen auf den Link startet Openbeehive beim richtigen Bienenstock. Das Etikett codiert einen einfachen Weblink, sodass jeder QR-Leser als Ausweichlösung funktioniert.
:::

## Anmeldeprobleme

- **Beim Anmeldebildschirm hängengeblieben.** Bestätige, dass du die richtige Adresse erreichst (die gehostete App ist unter app.openbeehive.org). Nach der Anmeldung bei deinem Anbieter solltest du automatisch zurückgeleitet werden; falls nicht, lade die Seite neu.
- **Weiterleitung schlägt fehl oder „ungültige Weiterleitung“-Fehler (Selbst-Hosting).** Das bedeutet fast immer, dass die OIDC-Weiterleitungs-URL oder `BEEHIVE_PUBLIC_BASE_URL` falsch konfiguriert ist. Siehe [Authentifizierung und Konfiguration](/self-hosting/authentication).
- **Passkey nicht angeboten.** WebAuthn/Passkeys müssen aktiviert sein, und du musst einen Passkey auf diesem Gerät registriert haben. Falls nicht verfügbar, melde dich stattdessen mit deinem üblichen Anbieter an.
- **Einzelnutzer-Selbst-Hosting ohne Anmeldung.** Wenn du ohne OIDC-Anbieter und mit deaktiviertem WebAuthn betreibst, gibt es überhaupt keinen Anmeldeschritt. Wenn du unerwartet einen Anmeldebildschirm siehst, prüfe deine Serverkonfiguration.

## Einen guten Fehlerbericht einreichen

Wenn nichts davon hilft, eröffne bitte ein Issue unter [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). Ein klarer Bericht führt zu einer schnelleren Behebung. Versuche, Folgendes anzugeben:

| Detail | Beispiel |
| --- | --- |
| Was du getan hast | „Auf Speichern bei einer neuen Durchsicht getippt“ |
| Was du erwartet hast | „Durchsicht erscheint in der Zeitleiste des Bienenstocks“ |
| Was stattdessen geschah | „Ladekreis, dann verschwand der Eintrag“ |
| App-Version | v0.1.0 (im Info-Bildschirm der App angezeigt) |
| Plattform & Browser | iPhone 14, iOS 17, Safari |
| Gehostet oder selbst gehostet | Selbst gehostet, `selfhost`-Profil, SQLite |
| Online oder offline | „War im Feld offline, synchronisiere gerade“ |
| Reproduzierbar? | „Passiert jedes Mal“ / „Nur einmal“ |

:::caution
Bitte füge keine Geheimnisse ein. Schwärze Sitzungsgeheimnisse, OIDC-Client-Geheimnisse, Datenbankpasswörter und personenbezogene Daten, bevor du Protokolle oder Konfiguration teilst.
:::

Für Fragen zum Selbst-Hosting rund um Datenbanken, Speicher, Authentifizierung und Umgebungsvariablen sind der [Selbst-Hosting-Bereich](/category/self-hosting) und die [Konfigurationsreferenz](/self-hosting/configuration) die besten Ausgangspunkte. Siehe auch die [FAQ](/knowledge-base/faq).

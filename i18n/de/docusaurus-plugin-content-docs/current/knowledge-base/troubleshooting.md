---
sidebar_position: 6
title: "Fehlerbehebung"
---

# Fehlerbehebung

Die meisten Probleme mit Openbeehive fallen in eine Handvoll Kategorien: Synchronisierung, lokaler Speicher, die Kamera/der QR-Scanner oder die Anmeldung. Diese Seite geht jede davon durch, mit praktischen Prüfungen, die du selbst durchführen kannst, bevor du Hilfe suchst.

Deine Aufzeichnungen liegen in einer lokalen Datenbank auf deinem Gerät, sodass fast nichts hier Daten verlieren kann, die bereits zum Server synchronisiert wurden.

## Daten synchronisieren nicht \{#data-not-syncing}

Deine Änderungen werden sofort auf dem Gerät gespeichert. Die Synchronisierung mit dem Server geschieht still im Hintergrund, sodass eine Verzögerung normal und selten ein Grund zur Sorge ist. Wenn Änderungen, die du auf einem Gerät vorgenommen hast, auf einem anderen nicht erscheinen, arbeite diese Liste durch.

**1. Lies den Synchronisierungsstatus.** Der Chip oben auf der Seite sagt, was los ist: **Offline**, **Warten auf Upload**, **Synchronisierung fehlgeschlagen · neuer Versuch**, **Abgemeldet** oder **Sync-Probleme**. Siehe [den Synchronisierungsstatus](../using-the-app/offline-and-sync.md#sync-status). Wenn du im Feld ohne Empfang gearbeitet hast, sind deine Bearbeitungen in der Warteschlange und werden gesendet, sobald du wieder verbunden bist.

**2. Prüfe, ob du angemeldet bist.** Die Synchronisierung erfordert eine Sitzung. Wenn sie abgelaufen ist, zeigt der Chip **Abgemeldet · zum Synchronisieren anmelden**; du kannst weiterhin lokal lesen und bearbeiten, aber nichts wird synchronisiert, bis du dich erneut anmeldest. **Einstellungen → Konto** zeigt, als wer du angemeldet bist.

**3. Prüfe den aktiven Arbeitsbereich.** Aufzeichnungen gehören zu einem Arbeitsbereich. Wenn ein Bienenstock auf einem anderen Gerät fehlt, öffne dort **Einstellungen → Arbeitsbereiche** und stelle sicher, dass derselbe Arbeitsbereich aktiv ist. Fehlt er bei einer anderen Person, ist sie kein Mitglied dieses Arbeitsbereichs; ein Arbeitsbereichs-Admin kann sie einladen.

**4. Synchronisiere jetzt.** Die Hintergrundsynchronisierung läuft in kurzen Abständen; ein Tippen auf den Status-Chip startet sofort eine Synchronisierung.

**5. Suche nach abgelehnten Änderungen.** Wenn der Chip **Sync-Probleme** zeigt, hat der Server einige Änderungen nicht angenommen. Sie sind weiterhin auf dem Gerät. Die Liste **Sync-Probleme** nennt jede davon mit dem Grund und lässt dich es erneut versuchen oder sie verwerfen; siehe [Sync-Probleme](../using-the-app/offline-and-sync.md#sync-problems). Eine Geräteuhr, die weit vorgeht, ist eine Ursache; die App gleicht das aus und sendet von sich aus erneut, aber wenn du das Gerät auf automatische Uhrzeit stellst, kommt es gar nicht erst dazu.

:::note
Die Synchronisierung ist konzeptbedingt konfliktfrei. Die jüngste Bearbeitung eines Feldes gewinnt, Hinzufügungen (Fotos, Durchsichten, Ernten, Behandlungen) bleiben erhalten, und du verlierst keine Arbeit, weil zwei Geräte gleichzeitig bearbeitet haben.
:::

Wenn du selbst hostest und die Synchronisierung für alle fehlschlägt, liegt das Problem eher serverseitig. Siehe [Selbst-Hosting-Konfiguration](../self-hosting/configuration.md) und prüfe die Serverprotokolle.

## Wie der lokale Speicher funktioniert

Openbeehive ist eine Progressive Web App (PWA). Sie hält deinen gesamten Datenbestand in einer SQLite-Datenbank vor, die innerhalb deines Browsers läuft und in **OPFS** (dem Origin Private File System) gespeichert wird. Jeder Lese- und Schreibvorgang erfolgt gegen diese lokale Datenbank, weshalb sich die App sofort anfühlt und ganz ohne Empfang funktioniert.

Ein paar praktische Folgen:

- Deine Daten sind an den Browser und das Gerät gebunden, auf dem du Openbeehive verwendest. Jedes Gerät behält seine eigene lokale Kopie und synchronisiert mit dem Server.
- Der OPFS-Speicher ist privat für den Origin der App. Andere Websites können ihn nicht lesen.
- Das Installieren der App auf deinem Startbildschirm (siehe [Installation](../using-the-app/install.md)) verwendet auf den meisten Plattformen denselben Speicher wie der Browser-Tab.

:::caution
Browser-Werkzeuge, die „Websitedaten löschen“, „Cookies und Speicher löschen“ oder privates/Inkognito-Surfen können die lokale OPFS-Datenbank löschen. Das ist **nur dann sicher, wenn deine Daten bereits** zum Server synchronisiert wurden, da sie bei der nächsten Anmeldung erneut heruntergeladen werden. Wenn du nicht synchronisierte Offline-Änderungen hast, stelle sicher, dass du online bist, und lass die Synchronisierung zuerst abschließen.
:::

### „unable to open database file" oder ein Knopf, der nichts tut

App-Versionen vor 0.2.2 konnten die reservierten lokalen Speicher-Slots aufbrauchen; danach schlug jedes Speichern mit `SQLITE_CANTOPEN: unable to open database file` fehl — sichtbar als Knopf, der scheinbar nichts tat. Seit 0.2.2 reserviert die App von vornherein genug Slots und repariert den Speicherpool automatisch, wenn er knapp wird. Siehst du den Fehler weiterhin, lade die App zweimal neu (damit die neue Version übernimmt) und versuche es erneut; früher gespeicherte Einträge sind nicht betroffen.

### „Dieser Browser speichert keine Daten auf diesem Gerät“ \{#storage-is-unavailable}

Die App hält ihre Datenbank im privaten Speicher des Browsers. Kann sie diesen Speicher
nicht öffnen, hält sie die Aufzeichnungen im Arbeitsspeicher und zeigt dieses Banner,
damit du Bescheid weißt. Änderungen funktionieren weiterhin und werden weiterhin mit dem
Server synchronisiert, solange du angemeldet bist, aber die lokale Kopie verschwindet, wenn
der Tab geschlossen wird.

Die häufigen Ursachen sind **privates oder Inkognito-Browsen** (Browser geben solchen
Fenstern keinen dauerhaften Speicher) und Speicher, der in den Browsereinstellungen
blockiert ist. Nutze ein normales Fenster oder installiere die App.

### „Openbeehive ist in einem anderen Tab geöffnet“

Nur ein Tab oder Fenster kann gleichzeitig mit den Aufzeichnungen auf einem Gerät
arbeiten. Ein zweiter Tab zeigt statt der App diesen Hinweis. Mach im ersten Tab weiter
oder tippe auf **Hier verwenden**, um die App in diesen Tab zu holen. Siehe
[Nur ein Tab gleichzeitig](../using-the-app/offline-and-sync.md#one-tab).

### Die App zeigt „Daten werden synchronisiert…“ statt meiner Bienenstände

Das ist die erste Synchronisation auf diesem Gerät, die noch lädt. Seit App-Version 0.2.3
zeigen das Dashboard und die Listen Platzhalter und diesen Hinweis, bis die Daten
vollständig sind, und füllen sich schrittweise, sobald Pakete eintreffen. Bleib online und
gib ihr einen Moment; bei großen Datenbeständen wachsen die Listen, während du zusiehst.
Verschwindet der Hinweis nie, geh [Daten synchronisieren nicht](#data-not-syncing) durch.

### Die App antwortet nicht unter meinem Hostnamen (Selbst-Hosting, ohne Anmeldung)

Ein Server ohne Anmeldung antwortet nur auf `localhost`, IP-Adressen und den Host
aus `BEEHIVE_PUBLIC_BASE_URL`. Unter einem anderen Namen geöffnet, antwortet er mit einer
schlichten `403`-Seite, die die Abhilfe nennt: Trage den Namen in `BEEHIVE_ALLOWED_HOSTS`
ein oder setze `BEEHIVE_PUBLIC_BASE_URL` auf die Adresse, die du verwendest. Siehe
[Konfiguration](../self-hosting/configuration.md#allowed-hosts).

## Die App leeren oder neu installieren

Manchmal behebt ein Neustart seltsames Verhalten nach einer Aktualisierung. Solange du in einem Konto angemeldet bist, das synchronisiert, ist dies nicht destruktiv: Deine synchronisierten Aufzeichnungen kommen vom Server zurück.

1. Bestätige, dass du **online und angemeldet** bist und dass der Status-Chip **Synchronisiert** zeigt.
2. Deinstalliere oder entferne die PWA von deinem Startbildschirm oder leere den Speicher der Website in deinen Browsereinstellungen.
3. Öffne Openbeehive erneut und melde dich an.
4. Warte, bis die erste Synchronisierung deine Bienenstände, Bienenstöcke und die Historie heruntergeladen hat.

:::danger
Leere den Speicher nicht, wenn du ausschließlich offline vorhandene Änderungen hast, die den Server noch nicht erreicht haben (zum Beispiel im Feld ohne Empfang erfasste Durchsichten). Diese Bearbeitungen existieren nur auf jenem Gerät, bis die Synchronisierung abgeschlossen ist. Gehe online und lass die Synchronisierung zuerst abschließen.
:::

## Kamera und QR-Scanner funktionieren nicht

Jeder Bienenstock kann ein druckbares QR-Etikett tragen, das per Deep Link zu diesem Bienenstock führt (siehe [QR-Etiketten](../using-the-app/qr-labels.md)). Das Scannen benötigt Kamerazugriff.

- **Erteile die Kameraberechtigung.** Erlaube den Kamerazugriff, wenn du dazu aufgefordert wirst. Falls du ihn zuvor verweigert hast, aktiviere ihn in deinen Browser- oder Betriebssystemeinstellungen für die Website erneut und lade dann neu.
- **Verwende HTTPS.** Browser erlauben Kamerazugriff nur auf sicheren Origins. Die gehostete App wird über HTTPS ausgeliefert; Selbst-Hoster müssen ebenfalls über HTTPS ausliefern (oder `localhost` zum Testen). Siehe [Reverse Proxy](../self-hosting/reverse-proxy.md).
- **Prüfe, ob sie nicht in Verwendung ist.** Schließe andere Apps oder Tabs, die die Kamera möglicherweise belegen.

:::tip Keine Kamera oder ein abgenutztes Etikett
Der App-interne Scanner funktioniert in jedem aktuellen Browser, auch in Safari auf iPhone und iPad und in Firefox. Wenn die Kamera nicht genutzt werden kann oder das Etikett schwer lesbar ist, tippe die sechs Zeichen, die unter dem QR-Code stehen, auf dem Bildschirm „Scannen“ in **Etikettencode** ein. Wenn du die installierte App nutzt, scanne in ihr und nicht mit der Kamera-App des Telefons, die den Link im Browser mit dessen eigenen, getrennten Daten öffnet.
:::

## Anmeldeprobleme

- **Beim Anmeldebildschirm hängengeblieben.** Bestätige, dass du die richtige Adresse erreichst (die gehostete App ist unter app.openbeehive.org). Nach der Anmeldung bei deinem Anbieter solltest du automatisch zurückgeleitet werden; falls nicht, lade die Seite neu.
- **Weiterleitung schlägt fehl oder „ungültige Weiterleitung“-Fehler (Selbst-Hosting).** Das bedeutet fast immer, dass die OIDC-Weiterleitungs-URL oder `BEEHIVE_PUBLIC_BASE_URL` falsch konfiguriert ist. Siehe [Authentifizierung und Konfiguration](../self-hosting/authentication.md).
- **„Zu viele Versuche.“** Nach 10 fehlgeschlagenen Anmeldungen für ein Konto oder 30 von einer Netzwerkadresse werden weitere Versuche bis zu 15 Minuten lang blockiert. Warte und versuche es erneut.
- **Der Server startet nach dem Aktivieren der Anmeldung nicht (Selbst-Hosting).** Das Log nennt die fehlende Einstellung, meist `BEEHIVE_SESSION_SECRET` (mindestens 32 Bytes) oder das Admin-Konto. Siehe [Authentifizierung](../self-hosting/authentication.md).
- **Passkey nicht angeboten.** Passkeys müssen auf dem Server aktiviert sein, und du musst unter Einstellungen → Passkeys einen hinzugefügt haben. Andernfalls melde dich mit einer anderen Methode an.
- **Einzelnutzer-Selbst-Hosting ohne Anmeldung.** Mit ausgeschalteter Passwort-Anmeldung, ohne OIDC-Anbieter und mit deaktiviertem WebAuthn gibt es überhaupt keinen Anmeldeschritt. Wenn du unerwartet einen Anmeldebildschirm siehst, prüfe deine Serverkonfiguration.

## Einen guten Fehlerbericht einreichen

Wenn nichts davon hilft, eröffne bitte ein Issue unter [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). Ein klarer Bericht führt zu einer schnelleren Behebung. Versuche, Folgendes anzugeben:

| Detail | Beispiel |
| --- | --- |
| Was du getan hast | „Auf Speichern bei einer neuen Durchsicht getippt“ |
| Was du erwartet hast | „Durchsicht erscheint in der Zeitleiste des Bienenstocks“ |
| Was stattdessen geschah | „Ladekreis, dann verschwand der Eintrag“ |
| App-Version | Die Version, die du betreibst: bei einer selbst gehosteten Instanz der Image-Tag oder Git-Tag |
| Plattform & Browser | iPhone 14, iOS 17, Safari |
| Gehostet oder selbst gehostet | Selbst gehostet, `selfhost`-Profil, SQLite |
| Online oder offline | „War im Feld offline, synchronisiere gerade“ |
| Reproduzierbar? | „Passiert jedes Mal“ / „Nur einmal“ |

:::caution
Bitte füge keine Geheimnisse ein. Schwärze Sitzungsgeheimnisse, OIDC-Client-Geheimnisse, Datenbankpasswörter und personenbezogene Daten, bevor du Protokolle oder Konfiguration teilst.
:::

Für Fragen zum Selbst-Hosting beginne mit der [Konfigurationsreferenz](../self-hosting/configuration.md).

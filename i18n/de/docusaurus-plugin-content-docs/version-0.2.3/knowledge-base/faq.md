---
sidebar_position: 5
title: "FAQ"
---

# Häufig gestellte Fragen

Schnelle Antworten auf die Fragen, die wir am häufigsten hören. Wenn etwas fehlt, sieh in den [Leitfaden zur Fehlerbehebung](/knowledge-base/troubleshooting) oder frage die Community auf [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Ist Openbeehive kostenlos?

Ja. Openbeehive ist Open Source unter der **AGPL-3.0**-Lizenz, sodass es dir freisteht, es zu nutzen, zu studieren, zu verändern und selbst zu hosten.

Der gehostete Dienst unter [app.openbeehive.org](https://app.openbeehive.org) ist vorerst kostenlos nutzbar, solange das Projekt noch jung ist. Sollte sich das jemals ändern, kannst du jederzeit deine Daten exportieren und stattdessen deine eigene Instanz betreiben.

## Sind meine Daten privat?

Deine Aufzeichnungen liegen zuerst auf deinem eigenen Gerät. Openbeehive ist **offline-first**: Die App speichert alles in einer lokalen Datenbank auf deinem Smartphone, Tablet oder Computer und synchronisiert nur im Hintergrund mit dem Server.

Wenn du selbst hostest, verlassen deine Daten niemals deine eigene Infrastruktur. Beim gehosteten Dienst werden deine Aufzeichnungen auf unseren Servern gespeichert, damit sie zwischen deinen Geräten synchronisieren können, aber sie bleiben deine.

:::tip
Möchtest du die volle Kontrolle? Siehe [Selbst-Hosting](/category/self-hosting), um Openbeehive auf deiner eigenen Hardware zu betreiben.
:::

## Funktioniert es offline?

Ja, vollständig. Openbeehive ist eine Progressive Web App (PWA), die eine vollständige Kopie deiner Daten auf dem Gerät vorhält. Das Lesen und Schreiben von Aufzeichnungen erfolgt lokal und sofort, sodass es in einem Bienenstand ohne Empfang perfekt funktioniert.

Sobald du wieder Verbindung hast, synchronisieren sich deine Änderungen automatisch. Mehr dazu unter [Offline und Synchronisierung](/using-the-app/offline-and-sync).

## Funktioniert es auf meinem Smartphone?

Ja. Openbeehive läuft in jedem modernen Browser und kann auf deinem Startbildschirm installiert werden, sodass es sich wie eine App verhält. Es funktioniert auf Smartphones, Tablets und Desktops. Siehe [Die App installieren](/using-the-app/install) für die Schritte auf jeder Plattform.

## Gibt es eine native App?

Es gibt heute keine separate native App im App Store oder Play Store, und du brauchst auch keine. Die installierbare PWA gibt dir auf iOS, Android, Windows, macOS und Linux aus einer einzigen Codebasis ein App-Symbol, Offline-Nutzung und Vollbildmodus.

## Kann ich meine Daten exportieren?

Ja. Da das Projekt Open Source ist und deine Daten in einer standardmäßigen SQLite-Datenbank gespeichert werden, bist du nie an etwas gebunden.

- **Selbst-Hoster** können die Datenbank direkt sichern. Siehe [Backups](/self-hosting/backups).
- Beim **gehosteten Dienst** sind Exportwerkzeuge Teil der Roadmap. Deine Aufzeichnungen werden außerdem lokal auf jedem synchronisierten Gerät vorgehalten.

## Kann ich es selbst hosten?

Absolut, und es ist auf einfache Bedienung ausgelegt. Es gibt zwei Bereitstellungsprofile:

| Profil | Am besten geeignet für | Stack |
| --- | --- | --- |
| `selfhost` | Hobbyisten, Einzelnutzer | Eine einzige Binärdatei, SQLite + lokale Dateien, kein Docker nötig |
| `cloud` | Mehrbenutzer, größere Installationen | Docker, PostgreSQL + S3/MinIO-Speicher |

Beginne mit dem [Schnellstart](/self-hosting/quick-start) oder springe direkt zum [Leitfaden für die einzelne Binärdatei](/self-hosting/single-binary).

:::note
Für eine private Einzelnutzer-Instanz kannst du die Anmeldung vollständig deaktivieren. Siehe [Authentifizierung](/self-hosting/authentication).
:::

## Wie funktioniert das Teilen?

Das Teilen erfolgt auf Ebene des **Bienenstands** über „Scopes“. Wenn du einen Bienenstand teilst, können die Personen, mit denen du ihn teilst, alles darin sehen und dazu beitragen: seine Bienenstöcke, Königinnen, Durchsichten, Aufgaben und mehr.

Die Synchronisierung ist konzeptbedingt konfliktfrei, sodass zwei Personen, die denselben Bienenstand auf verschiedenen Geräten bearbeiten, nicht gegenseitig ihre Arbeit überschreiben. Bearbeitungen werden auch nach langen Offline-Phasen sauber zusammengeführt. Die technischen Einzelheiten werden im [Sync-Protokoll](/developers/sync-protocol) behandelt.

## Welche Beutentypen werden unterstützt?

Openbeehive unterstützt die gängigsten Rähmchen- und Top-bar-Systeme:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Sonstige

Siehe [Beutentypen](/knowledge-base/hive-types) für Hinweise zur Auswahl.

## Wie werden Königinnen markiert?

Openbeehive folgt dem internationalen Schema der Königinnen-Markierungsfarben, das auf der letzten Ziffer des Jahres basiert:

| Jahr endet auf | Farbe |
| --- | --- |
| 1 oder 6 | Weiß |
| 2 oder 7 | Gelb |
| 3 oder 8 | Rot |
| 4 oder 9 | Grün |
| 5 oder 0 | Blau |

Die App wählt die richtige Farbe automatisch für dich aus. Alle Einzelheiten findest du auf der Seite [Königinnen-Markierungsfarben](/knowledge-base/queen-marking-colours).

## Wozu dienen die QR-Etiketten?

Jeder Bienenstock kann ein druckbares QR-Etikett haben. Durch das Scannen öffnet sich Openbeehive direkt bei diesem Bienenstock, sodass du im Bienenstand seine Aufzeichnungen aufrufen kannst, ohne zu tippen oder zu suchen. Siehe [QR-Etiketten](/using-the-app/qr-labels).

## In welchen Sprachen ist es verfügbar?

Openbeehive wird mit Blick auf Internationalisierung entwickelt, wobei Deutsch und Englisch angesichts der Wurzeln des Projekts den ersten Schwerpunkt bilden. Weitere Sprachen sind als Community-Beiträge willkommen.

## Welche Datenbanken und Speicher-Backends werden unterstützt?

Beim Selbst-Hosting ist das Backend austauschbar:

- **Datenbanken:** PostgreSQL, MySQL oder SQLite. Siehe [Datenbanken](/self-hosting/databases).
- **Blob-Speicher:** MinIO/S3-kompatibler Objektspeicher oder das lokale Dateisystem. Siehe [Speicher](/self-hosting/storage).

## Wie melde ich mich an?

Der gehostete Dienst verwendet eine OIDC-Anmeldung (Anmeldung mit einem unterstützten Anbieter), mit optionalen Passkeys (WebAuthn) für ein passwortloses Erlebnis. Selbst-Hoster können ihre eigenen OIDC-Anbieter konfigurieren, Passkeys aktivieren oder die Anmeldung für Einzelnutzer-Installationen vollständig abschalten. Siehe [Authentifizierung](/self-hosting/authentication).

## Wie melde ich einen Fehler oder schlage eine Funktion vor?

Bitte eröffne ein Issue in unserer [GitHub-Organisation](https://github.com/openbeehive-org/openbeehive-app). Klare Schritte zur Reproduktion, deine Plattform und dein Browser sowie ein Screenshot helfen allesamt enorm.

Die [Seite zur Fehlerbehebung](/knowledge-base/troubleshooting) deckt häufige Probleme möglicherweise bereits ab.

## Wie kann ich beitragen?

Beiträge aller Art sind willkommen: Code, Dokumentation, Übersetzungen, Fehlerberichte und Ideen. Der Stack ist Go im Backend und eine SvelteKit-PWA im Frontend.

Lies den [Leitfaden zum Beitragen](/developers/contributing), um loszulegen, und wirf einen Blick auf die [Architekturübersicht](/developers/architecture), um zu verstehen, wie die Teile zusammenpassen.

## Welche Version ist das?

Die aktuelle Veröffentlichung ist **v0.1.0**, unsere erste öffentliche Version. Erwarte rasche Verbesserungen und sieh in den [Leitfaden zum Aktualisieren](/self-hosting/upgrading), wenn neue Versionen erscheinen.

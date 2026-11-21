---
sidebar_position: 5
title: "FAQ"
---

# Häufig gestellte Fragen

Schnelle Antworten auf die Fragen, die wir am häufigsten hören. Wenn etwas fehlt, sieh in den [Leitfaden zur Fehlerbehebung](./troubleshooting.md) oder frage die Community auf [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Ist Openbeehive kostenlos?

Ja. Openbeehive ist Open Source unter der **AGPL-3.0**-Lizenz, sodass es dir freisteht, es zu nutzen, zu studieren, zu verändern und selbst zu hosten.

Der gehostete Dienst unter [app.openbeehive.org](https://app.openbeehive.org) ist vorerst kostenlos nutzbar, solange das Projekt noch jung ist, und derzeit nur mit Einladung zugänglich: Schreibe an [contact@openbeehive.org](mailto:contact@openbeehive.org), um eine Einladung zu erhalten, oder sieh dich zuerst mit der Schaltfläche **Demo ausprobieren** auf der Anmeldeseite um. Sollten sich die Bedingungen jemals ändern, kannst du jederzeit deine Daten exportieren und stattdessen deine eigene Instanz betreiben.

## Sind meine Daten privat?

Deine Aufzeichnungen liegen zuerst auf deinem eigenen Gerät: Die App speichert alles in einer lokalen Datenbank auf deinem Smartphone, Tablet oder Computer und synchronisiert im Hintergrund mit dem Server.

Wenn du selbst hostest, verlassen deine Daten niemals deine eigene Infrastruktur. Beim gehosteten Dienst werden deine Aufzeichnungen auf unseren Servern gespeichert, damit sie zwischen deinen Geräten synchronisieren können, aber sie bleiben deine.

Die einzigen externen Dienste, die die App kontaktiert, betreffen die Karte: Kacheln und die Adresssuche im Bienenstand-Formular kommen von OpenStreetMap, sofern der Betreiber keine anderen konfiguriert oder die Karte abgeschaltet hat.

:::tip
Möchtest du die volle Kontrolle? Siehe [Selbst-Hosting](/category/self-hosting), um Openbeehive auf deiner eigenen Hardware zu betreiben.
:::

## Funktioniert es offline?

Ja, vollständig. Openbeehive ist eine Progressive Web App (PWA), die eine vollständige Kopie deiner Daten auf dem Gerät vorhält. Das Lesen und Schreiben von Aufzeichnungen erfolgt lokal und sofort, sodass es in einem Bienenstand ohne Empfang perfekt funktioniert.

Sobald du wieder Verbindung hast, synchronisieren sich deine Änderungen automatisch. Mehr dazu unter [Offline und Synchronisierung](../using-the-app/offline-and-sync.md).

## Funktioniert es auf meinem Smartphone?

Ja. Openbeehive läuft in jedem modernen Browser und kann auf deinem Startbildschirm installiert werden, sodass es sich wie eine App verhält. Es funktioniert auf Smartphones, Tablets und Desktops. Siehe [Die App installieren](../using-the-app/install.md) für die Schritte auf jeder Plattform.

## Gibt es eine native App?

Es gibt heute keine separate native App im App Store oder Play Store, und du brauchst auch keine. Die installierbare PWA gibt dir auf iOS, Android, Windows, macOS und Linux aus einer einzigen Codebasis ein App-Symbol, Offline-Nutzung und Vollbildmodus.

## Kann ich meine Daten exportieren?

Ja. **Einstellungen → Daten & Sync** exportiert einen Arbeitsbereich als vollständiges Backup (JSON oder ein ZIP mit Fotos), als Tabelle (XLSX), als CSV-Dateien in einem ZIP, als BeeXML oder als druckbaren PDF-Bericht und kann außerdem die Kopie des Arbeitsbereichs vom Server herunterladen. Es importiert Backups, BeeXML und CSV aus anderen Apps, zeigt vorher eine Vorschau und überschreibt nie etwas, es sei denn, du verlangst es. Siehe [Import & Export](../using-the-app/import-export.md). Selbst-Hoster sichern die Server-Datenbank und den Fotospeicher; siehe [Backups](../self-hosting/backups.md).

## Kann ich es selbst hosten?

Absolut, und es ist auf einfache Bedienung ausgelegt. Es gibt zwei Bereitstellungsprofile:

| Profil | Am besten geeignet für | Stack |
| --- | --- | --- |
| `selfhost` | Hobbyisten, Einzelnutzer | Eine einzige Binärdatei, SQLite + lokale Dateien, kein Docker nötig |
| `cloud` | Mehrere Nutzer, größere Installationen | Docker, PostgreSQL + S3/MinIO-Speicher |

Beginne mit dem [Schnellstart](../self-hosting/quick-start.md) oder springe direkt zum [Leitfaden für die einzelne Binärdatei](../self-hosting/single-binary.md).

:::note
Eine private Einzelnutzer-Instanz läuft standardmäßig ohne Anmeldung; schalte die Anmeldung ein, bevor du sie mit anderen teilst. Siehe [Authentifizierung](../self-hosting/authentication.md).
:::

## Wie funktioniert das Teilen?

Aufzeichnungen werden über **Arbeitsbereiche** geteilt. Jedes Konto hat einen persönlichen Arbeitsbereich und kann in weitere eingeladen werden, zum Beispiel den eines Vereins. Alle in einem Arbeitsbereich sehen und bearbeiten sämtliche seiner Bienenstände, Bienenstöcke und Aufzeichnungen; ein Teilen einzelner Bienenstände gibt es nicht. Aufgaben sind die Ausnahme: Sie sind persönlich. Die Synchronisierung ist konfliktfrei, sodass zwei Personen, die im selben Arbeitsbereich auf verschiedenen Geräten arbeiten, sich nicht gegenseitig überschreiben. Siehe [Konten & Arbeitsbereiche](../using-the-app/accounts-tenants.md).

## Welche Beutentypen werden unterstützt?

Openbeehive unterstützt die gängigsten Rähmchen- und Top-bar-Systeme:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Sonstige

Siehe [Beutentypen](./hive-types.md) für Hinweise zur Auswahl.

## Wie werden Königinnen markiert?

Openbeehive folgt dem internationalen Schema der Königinnen-Markierungsfarben, das auf der letzten Ziffer des Jahres basiert:

| Jahr endet auf | Farbe |
| --- | --- |
| 1 oder 6 | Weiß |
| 2 oder 7 | Gelb |
| 3 oder 8 | Rot |
| 4 oder 9 | Grün |
| 5 oder 0 | Blau |

Die App wählt die richtige Farbe automatisch für dich aus. Alle Einzelheiten findest du auf der Seite [Königinnen-Markierungsfarben](./queen-marking-colours.md).

## Wozu dienen die QR-Etiketten?

Jeder Bienenstock kann ein druckbares QR-Etikett haben. Durch das Scannen öffnet sich Openbeehive direkt bei diesem Bienenstock, sodass du im Bienenstand seine Aufzeichnungen aufrufen kannst, ohne zu tippen oder zu suchen. Siehe [QR-Etiketten](../using-the-app/qr-labels.md).

## In welchen Sprachen ist es verfügbar?

Die App wird in fünf Sprachen ausgeliefert: Englisch, Deutsch, Französisch, Spanisch und Italienisch. Umschalten kannst du unter **Einstellungen → Anzeige → Sprache**; die Wahl wird mit deinem Konto gespeichert und folgt dir auf jedes Gerät. Weitere Übersetzungen sind als Beiträge willkommen.

## Kann ich Pfund und Fahrenheit verwenden?

Ja. Wähle unter **Einstellungen → Anzeige → Einheiten** Kilogramm oder Pfund und Celsius oder Fahrenheit. Die App zeigt und nimmt Gewichte und Temperaturen dann auf allen deinen Geräten in diesen Einheiten an. Aufzeichnungen werden in Kilogramm und Grad Celsius gespeichert, daher bleiben Exporte und die API metrisch. Siehe [Einstellungen](../using-the-app/dashboard.md#settings).

## Ich habe mein Passwort vergessen. Was nun?

Tippe auf dem Anmeldebildschirm auf **Passwort vergessen?**. Verschickt der Server E-Mails, bekommst du einen Link, mit dem du ein neues festlegst; andernfalls kann der Administrator der Instanz einen solchen Link für dich erstellen. Siehe [Konten & Arbeitsbereiche](../using-the-app/accounts-tenants.md#password).

## Kann ich mein Konto löschen?

Ja, unter **Einstellungen → Konto → Konto löschen**. Die App zeigt zuerst, was gelöscht würde und was für andere Mitglieder erhalten bleibt. Siehe [Konten & Arbeitsbereiche](../using-the-app/accounts-tenants.md#delete-account).

## Welche Datenbanken und Speicher-Backends werden unterstützt?

Beim Selbst-Hosting ist das Backend austauschbar:

- **Datenbanken:** PostgreSQL, MariaDB oder SQLite. Siehe [Datenbanken](../self-hosting/databases.md).
- **Blob-Speicher:** MinIO/S3-kompatibler Objektspeicher oder das lokale Dateisystem. Siehe [Speicher](../self-hosting/storage.md).

## Wie melde ich mich an?

Der gehostete Dienst verwendet Konten mit E-Mail und Passwort und ist nur mit Einladung zugänglich. Selbst-Hoster können E-Mail/Passwort-Konten aktivieren, OIDC-Anbieter hinzufügen (Google, Keycloak, Authentik und ähnliche), Passkeys aktivieren oder die Anmeldung für eine Einzelnutzer-Installation vollständig abschalten. Siehe [Authentifizierung](../self-hosting/authentication.md).

## Wie melde ich einen Fehler oder schlage eine Funktion vor?

Bitte eröffne ein Issue im [GitHub-Repository](https://github.com/openbeehive-org/openbeehive-app). Klare Schritte zur Reproduktion, deine Plattform und dein Browser sowie ein Screenshot helfen.

Die [Seite zur Fehlerbehebung](./troubleshooting.md) deckt häufige Probleme möglicherweise bereits ab.

## Wie kann ich beitragen?

Beiträge aller Art sind willkommen: Code, Dokumentation, Übersetzungen, Fehlerberichte und Ideen. Der Stack ist Go im Backend und eine SvelteKit-PWA im Frontend.

## Welche Version ist das?

Veröffentlichungen werden auf [GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) getaggt. Selbst-Hoster betreiben den Tag, den sie gebaut haben, oder den Image-Tag, den sie gezogen haben; sieh in den [Leitfaden zum Aktualisieren](../self-hosting/upgrading.md), wenn neue Versionen erscheinen.

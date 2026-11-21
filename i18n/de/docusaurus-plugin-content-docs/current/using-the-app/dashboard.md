---
sidebar_position: 1
title: "Das Dashboard"
---

# Das Dashboard

Die **Übersicht** ist der erste Bildschirm nach dem Öffnen der App. Alles darauf wird aus der lokalen Datenbank auf deinem Gerät gelesen, sie lädt also sofort, mit oder ohne Empfang.

Der Button **+ Neu** in der Kopfzeile öffnet ein Menü mit **Neuer Standort**, **Neue Beute** und **Neue Aufgabe**; jeder Eintrag bringt dich zur passenden Liste mit geöffnetem Formular.

## Erste Schritte

Bis deine erste Durchsicht erfasst ist, begrüßt dich die Übersicht mit „Willkommen bei Openbeehive“ und einer Checkliste **Erste Schritte** mit drei Schritten: **Standort anlegen**, **Beute hinzufügen**, **Erste Durchsicht eintragen**. Der Schritt, der als Nächstes ansteht, ist ein Link an die richtige Stelle; erledigte Schritte sind abgehakt. Die Checkliste verschwindet, sobald alle drei erledigt sind.

## Statistik-Kacheln

| Kachel | Was sie zeigt |
| --- | --- |
| **Standorte** | Anzahl der Bienenstände im aktiven Arbeitsbereich. |
| **Beuten** | Anzahl der Beuten. |
| **Königinnen** | Königinnen, die aktuell als Weisel eines Volkes erfasst sind. |
| **Offene Aufgaben** | Aufgaben, die noch nicht abgehakt sind. |
| **Honig diese Saison** | Summe des im laufenden Kalenderjahr geernteten Honigs, in Kilogramm oder Pfund, je nach Wahl unter **Einstellungen → Anzeige → Einheiten**. |

Die Kacheln sind reine Zähler; nutze die Navigation, um den passenden Bereich zu öffnen.

## Fällige Durchsichten

Eine Beute ist 10 Tage nach ihrem letzten Besuch fällig; das Panel sagt das. Es listet bis zu fünf fällige Beuten auf, die am längsten nicht besuchte zuerst, jeweils mit der Anzahl Tage seit der letzten Durchsicht („noch nie“ für Beuten ohne Besuch). Die Markierung wird ab 21 Tagen hervorgehoben, oder wenn es noch gar keinen Besuch gibt. Tippe auf eine Beute, um sie zu öffnen und eine Durchsicht zu erfassen. Sind mehr Beuten fällig, öffnet **Alle N fälligen Beuten ansehen** die Beutenliste, sortiert nach dem letzten Besuch.

Es zählen nur Durchsichten, die eine Person erfasst hat. Messwerte, die ein Sensor oder eine Waage über die API sendet, machen eine Beute nicht „durchgesehen“, und Völker mit dem Status **Verloren** oder **Aufgelöst** werden ausgelassen. Ist keine Beute fällig, meldet das Panel „Alles aktuell – gut gemacht!“, und gibt es keine Beuten, dass nichts fällig ist.

Das Intervall von 10 Tagen ist in der App fest; `GetDashboard` in der API verwendet dieselbe Vorgabe und nimmt `thresholdDays` an, um es zu ändern.

## Anstehende Aufgaben

Zeigt bis zu fünf offene Aufgaben mit ihrem Fälligkeitsdatum. Aufgaben, deren Fälligkeit verstrichen ist, sind mit **Überfällig** markiert. Tippe auf eine Aufgabe, um in der Ansicht **Aufgaben** zu ihr zu springen, wo du sie abhakst; siehe [Aufgaben](./tasks.md).

## Orientierung in der App

Dieselben Ziele sind überall erreichbar: **Übersicht, Standorte, Scannen, Beuten, Aufgaben** und **Einstellungen**.

- Auf dem Smartphone enthält eine **untere Tab-Leiste** alle sechs, mit kurzen Beschriftungen, die auf schmale Bildschirme passen.
- Auf Desktop oder Tablet listet eine **Seitenleiste** links Übersicht, Standorte, Scannen, Beuten und Aufgaben, mit deinem Konto (E-Mail und Synchronisationsstatus) unten als Link zu den Einstellungen.

## Einstellungen \{#settings}

**Einstellungen** zeigt jeweils eine von vier Gruppen; die Buttons oben wechseln zwischen ihnen.

**Anzeige**

- **Sprache**: Englisch, Deutsch, Französisch, Spanisch oder Italienisch. Die Wahl wird mit deinem Konto gespeichert und gilt auf allen deinen Geräten.
- **Darstellung**: **System** (folgt der Hell- oder Dunkel-Einstellung des Geräts), **Hell** oder **Dunkel**. Die Wahl wird nur auf diesem Gerät gespeichert.
- **Einheiten**: **Gewicht** in Kilogramm oder Pfund und **Temperatur** in Celsius oder Fahrenheit, für Anzeige und Eingabe. Die Wahl wird mit deinem Konto gespeichert und gilt auf allen deinen Geräten und in allen Arbeitsbereichen. Bis du wählst, verwendet die App metrische Einheiten, es sei denn, dein Browser ist auf die Sprache der App für eine Region eingestellt, die Pfund und Fahrenheit verwendet (zum Beispiel Englisch, Vereinigte Staaten). Aufzeichnungen werden immer in Kilogramm und Grad Celsius gespeichert, und Exporte und die API bleiben metrisch; siehe [Durchsichten](./inspections.md#units).

**Arbeitsbereich** (auf Instanzen mit Anmeldung)

- **Arbeitsbereiche**: wechseln, erstellen, einladen und Mitglieder verwalten. Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md).
- **API-Schlüssel**: Schlüssel für Skripte und Geräte erstellen und entfernen. Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md#api-keys).
- **Gefahrenzone**: den Arbeitsbereich löschen (nur Admins).

**Daten & Sync**

- **Sync-Probleme**: Änderungen, die der Server abgelehnt hat, mit **Erneut versuchen** und **Verwerfen**, und empfangene Änderungen, die nicht übernommen werden konnten. Siehe [Offline und Synchronisation](./offline-and-sync.md#sync-problems).
- **Daten & Backup**: Backups, weitere Exportformate, die Server-Kopie und Import; siehe [Import & Export](./import-export.md).
- **Bestandsbuch**: das Bestandsbuch für den ganzen Arbeitsbereich, einen Bienenstand oder ein Jahr drucken; siehe [Behandlungen](./treatments.md#treatment-register).

**Konto** (auf Instanzen mit Anmeldung)

- **Konto**: als wer du angemeldet bist, **Abmelden**, **Passwort** und **Überall abmelden**. Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md#password).
- **Passkeys**: Passkeys hinzufügen oder entfernen (wenn der Server sie aktiviert hat).
- **Passwort eines Nutzers zurücksetzen**: nur für den Instanz-Administrator; siehe [Authentifizierung](../self-hosting/authentication.md#password-reset).
- **Konto löschen**: siehe [Konten & Arbeitsbereiche](./accounts-tenants.md#delete-account).

Auf einer selbst gehosteten Einzelnutzer-Instanz ohne Anmeldung gibt es keine Gruppe Konto: **Anzeige** zeigt einen Hinweis **Ohne Anmeldung**, der den Modus erklärt, und Einheiten und Sprache werden für die lokale Identität gespeichert.

## Der Synchronisationsstatus

Ein Status-Chip oben auf der Seite und neben deinem Konto in der Seitenleiste zeigt, ob deine Änderungen den Server erreicht haben (**Synchronisiert**, **Änderungen warten auf Upload**, **Offline**, **Sync-Probleme** und so weiter); tippe darauf für den Synchronisationsstatus und **Jetzt synchronisieren**. Solange du offline bist, steht in einer Leiste am oberen Rand „Offline: Änderungen werden gespeichert und später synchronisiert.“ Erfasse einfach weiter wie gewohnt; die Synchronisation setzt fort, sobald die Verbindung zurück ist. Siehe [Offline und Synchronisation](./offline-and-sync.md#sync-status).

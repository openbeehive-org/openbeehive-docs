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
| **Honig diese Saison** | Summe der im laufenden Kalenderjahr erfassten Erntekilogramm. |

Die Kacheln sind reine Zähler; nutze die Navigation, um den passenden Bereich zu öffnen.

## Fällige Durchsichten

Listet bis zu fünf Beuten auf, die am längsten nicht besuchte zuerst, jeweils mit der Anzahl Tage seit der letzten Durchsicht („heute“ oder „noch nie“ für Beuten ohne Besuch). Die Markierung wird ab 21 Tagen hervorgehoben, oder wenn es noch gar keinen Besuch gibt. Tippe auf eine Beute, um sie zu öffnen und eine Durchsicht zu erfassen.

Es zählen nur Durchsichten, die eine Person erfasst hat. Messwerte, die ein Sensor oder eine Waage über die API sendet, machen eine Beute nicht „durchgesehen“, und Völker mit dem Status **Verloren** oder **Aufgelöst** werden ausgelassen. Gibt es keine Beuten, meldet das Panel, dass nichts fällig ist.

Ein konfigurierbares Intervall gibt es nicht: Die Liste ist nach der Zeit seit dem letzten erfassten Besuch sortiert.

## Anstehende Aufgaben

Zeigt bis zu fünf offene Aufgaben mit ihrem Fälligkeitsdatum. Aufgaben, deren Fälligkeit verstrichen ist, sind mit **Überfällig** markiert. Tippe auf eine Aufgabe, um in der Ansicht **Aufgaben** zu ihr zu springen, wo du sie abhakst; siehe [Aufgaben](./tasks.md).

## Orientierung in der App

Dieselben Ziele sind überall erreichbar: **Übersicht, Standorte, Scannen, Beuten, Aufgaben** und **Einstellungen**.

- Auf dem Smartphone enthält eine **untere Tab-Leiste** alle sechs.
- Auf Desktop oder Tablet listet eine **Seitenleiste** links Übersicht, Standorte, Scannen, Beuten und Aufgaben, mit deinem Konto (E-Mail und Synchronisationsstatus) unten als Link zu den Einstellungen.

## Einstellungen

**Einstellungen** enthält:

- **Sprache**: Englisch, Deutsch, Französisch, Spanisch, Italienisch. Die Wahl wird auf dem Gerät gespeichert.
- **Darstellung**: **System** (folgt der Hell- oder Dunkel-Einstellung des Geräts), **Hell** oder **Dunkel**. Die Wahl wird auf dem Gerät gespeichert.
- **Arbeitsbereiche**: wechseln, erstellen, einladen und verwalten (auf Instanzen mit Anmeldung). Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md).
- **Passkeys**: Passkeys hinzufügen oder entfernen (wenn der Server sie aktiviert hat).
- **API-Schlüssel**: Schlüssel für Skripte und Geräte erstellen und entfernen (auf Instanzen mit Anmeldung). Siehe [Konten & Arbeitsbereiche](./accounts-tenants.md#api-keys).
- **Daten & Backup**: Export und Import; siehe [Import & Export](./import-export.md).
- **Konto**: als wer du angemeldet bist, und **Abmelden**.

Auf einer selbst gehosteten Einzelnutzer-Instanz ohne Anmeldung gibt es nichts, wovon man sich abmelden könnte; der Konto-Block zeigt die lokale Identität.

## Der Synchronisationsstatus

Ein Status-Chip oben auf der Seite und neben deinem Konto in der Seitenleiste zeigt, ob deine Änderungen den Server erreicht haben (**Synchronisiert**, **Warten auf Upload**, **Offline**, **Sync-Probleme** und so weiter), und solange du offline bist, steht in einer Leiste am oberen Rand „Offline: Änderungen werden gespeichert und später synchronisiert.“ Erfasse einfach weiter wie gewohnt; die Synchronisation setzt fort, sobald die Verbindung zurück ist. Siehe [Offline und Synchronisation](./offline-and-sync.md#sync-status).

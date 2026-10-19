---
sidebar_position: 1
title: "Das Dashboard"
---

# Das Dashboard

Die **Übersicht** ist der erste Bildschirm nach dem Öffnen der App. Alles darauf wird aus der lokalen Datenbank auf deinem Gerät gelesen, sie lädt also sofort, mit oder ohne Empfang.

Der Button **+ Neu** in der Kopfzeile bringt dich zur Liste **Standorte**, um einen Bienenstand anzulegen.

## Statistik-Kacheln

| Kachel | Was sie zeigt |
| --- | --- |
| **Standorte** | Anzahl der Bienenstände im aktiven Mandanten. |
| **Beuten** | Anzahl der Beuten. |
| **Königinnen** | Königinnen, die aktuell als Weisel eines Volkes erfasst sind. |
| **Offene Aufgaben** | Aufgaben, die noch nicht abgehakt sind. |
| **Honig diese Saison** | Summe der im laufenden Kalenderjahr erfassten Erntekilogramm. |

Die Kacheln sind reine Zähler; nutze die Navigation, um den passenden Bereich zu öffnen.

## Fällige Durchsichten

Listet bis zu fünf Beuten auf, die am längsten nicht besuchte zuerst, jeweils mit der Anzahl Tage seit der letzten Durchsicht („noch nie" für Beuten ohne Besuch). Die Markierung wird ab 21 Tagen hervorgehoben, oder wenn es noch gar keinen Besuch gibt. Tippe auf eine Beute, um sie zu öffnen und eine Durchsicht zu erfassen. Gibt es keine Beuten, meldet das Panel „Alles aktuell".

Ein konfigurierbares Intervall gibt es nicht: Die Liste ist nach der Zeit seit dem letzten erfassten Besuch sortiert.

## Anstehende Aufgaben

Zeigt bis zu fünf offene Aufgaben mit ihrem Fälligkeitsdatum. Aufgaben, deren Fälligkeit verstrichen ist, sind mit **!** markiert. Abhaken kannst du Aufgaben in der Ansicht **Aufgaben**; siehe [Aufgaben](/using-the-app/tasks).

## Orientierung in der App

Dieselben Ziele sind überall erreichbar: **Übersicht, Standorte, Scannen, Beuten, Aufgaben** und **Einstellungen**.

- Auf dem Smartphone enthält eine **untere Tab-Leiste** alle sechs.
- Auf Desktop oder Tablet listet eine **Seitenleiste** links Übersicht, Standorte, Scannen, Beuten und Aufgaben, mit deinem Konto (E-Mail und Online-Status) unten als Link zu den Einstellungen.

## Einstellungen

**Einstellungen** enthält:

- **Sprache**: Englisch, Deutsch, Französisch, Spanisch, Italienisch. Die Wahl wird auf dem Gerät gespeichert.
- **Mandanten**: wechseln, erstellen, einladen und verwalten (auf Instanzen mit Anmeldung). Siehe [Konten & Mandanten](/using-the-app/accounts-tenants).
- **Passkeys**: Passkeys hinzufügen oder entfernen (wenn der Server sie aktiviert hat).
- **API-Schlüssel**: Schlüssel für Skripte und Geräte erstellen und entfernen (auf Instanzen mit Anmeldung). Siehe [Konten & Mandanten](./accounts-tenants.md#api-keys).
- **Daten & Backup**: Export und Import; siehe [Import & Export](/using-the-app/import-export).
- **Konto**: als wer du angemeldet bist, und **Abmelden**.

Auf einer selbst gehosteten Einzelnutzer-Instanz ohne Anmeldung gibt es nichts, wovon man sich abmelden könnte; der Konto-Block zeigt die lokale Identität.

## Die Online-/Offline-Anzeige

Die Seitenleiste zeigt neben deinem Konto **Online** oder **Offline**, und solange du offline bist, steht in einer Leiste am oberen Rand, dass Änderungen gespeichert und später synchronisiert werden. Erfasse einfach weiter wie gewohnt; die Synchronisation setzt fort, sobald die Verbindung zurück ist. Siehe [Offline und Synchronisation](/using-the-app/offline-and-sync).

---
sidebar_position: 13
title: "Konten & Arbeitsbereiche"
---

# Konten & Arbeitsbereiche

Wie du dich anmeldest, hängt davon ab, wie die Instanz eingerichtet ist. Eine einzeln betriebene, selbst gehostete Instanz braucht unter Umständen gar keine Anmeldung; eine gemeinsam genutzte Instanz (wie der gehostete Dienst) gibt jedem ein eigenes Konto und organisiert Bienenstände in **Arbeitsbereichen**, zwischen denen du wechseln kannst.

## Anmelden

Je nach Instanz bietet der Anmeldebildschirm eine oder mehrere der folgenden Möglichkeiten:

- **E-Mail & Passwort**: **Konto erstellen** mit Name, E-Mail-Adresse und Passwort, danach **Anmelden**.
- **Ein Anbieter** (Google, Keycloak, ...): **Weiter mit ...**.
- **Ein Passkey**: **Mit Passkey anmelden** per Fingerabdruck, Gesicht, Geräte-PIN oder Sicherheitsschlüssel. Passkeys fügst du nach der Anmeldung unter **Einstellungen → Passkeys** hinzu.
- **Die Demo**: **Demo ausprobieren** auf Instanzen, die eine betreiben. Sie braucht kein Konto.

Auf einer Einzelbenutzer-Instanz ohne konfigurierte Anmeldung öffnet die App direkt deine Aufzeichnungen.

Die Methoden gehören zu einem Konto: Wenn du dich mit E-Mail und Passwort registriert hast und dich später mit einem Anbieter anmeldest, der dieselbe E-Mail-Adresse meldet, werden die beiden verknüpft, sofern der Anbieter die Adresse als verifiziert bestätigt und auch die Adresse deines Kontos verifiziert ist. Andernfalls wird die Anmeldung über den Anbieter abgelehnt, und du meldest dich weiter so an wie bisher.

Nach zu vielen Fehlversuchen meldet der Anmeldebildschirm „Zu viele Versuche. Bitte warte ein paar Minuten und versuche es dann erneut.“ Die Sperre hebt sich nach höchstens 15 Minuten von selbst auf.

Wenn die Instanz eine E-Mail-Bestätigung verlangt, erhältst du nach der Registrierung einen Bestätigungslink per E-Mail. Öffne ihn vor deiner ersten Anmeldung.

## Dein Passwort \{#password}

Gib unter **Einstellungen → Konto → Passwort** das **Aktuelle Passwort** und zweimal das neue ein und tippe dann auf **Passwort ändern**. Deine anderen Geräte werden abgemeldet; dieses bleibt angemeldet.

Wenn du es vergessen hast, tippe auf dem Anmeldebildschirm auf **Passwort vergessen?** und gib deine E-Mail-Adresse ein. Verschickt der Server E-Mails, bekommst du einen Link, der eine Stunde gilt und einmal funktioniert; leg dort ein neues Passwort fest, danach bist du auf allen Geräten abgemeldet. Verschickt der Server keine E-Mails, sagt die Seite das: Wende dich an den Administrator der Instanz, der in den Einstellungen einen Link zum Zurücksetzen für dein Konto erstellen und dir geben kann.

Das Passwort des Instanz-Administrators steht in der Serverkonfiguration und lässt sich in der App nicht ändern. Konten, die sich nur über einen Anbieter oder einen Passkey anmelden, haben kein Passwort, das sich ändern ließe.

## Abmelden \{#signing-out}

**Einstellungen → Konto → Abmelden** zählt zuerst die Änderungen auf diesem Gerät, die noch nicht hochgeladen sind, und warnt dich davor. Auf einem gemeinsam genutzten Gerät setze den Haken bei **Auch die Daten von diesem Gerät entfernen**, um die Aufzeichnungen und heruntergeladenen Fotos dieses Arbeitsbereichs aus dem Browser zu löschen; alles Synchronisierte bleibt in deinem Konto. Nicht gesendete Änderungen gehen verloren, wenn du die Daten entfernst; geh also zuerst online und warte die Synchronisierung ab.

**Überall abmelden** meldet dich auf allen deinen anderen Geräten ab, zum Beispiel nachdem du ein Handy verloren hast. Auf diesem Gerät bleibst du angemeldet, und API-Schlüssel funktionieren weiter.

:::note Wer der Admin ist
Der Instanz-Administrator ist nicht die erste Person, die sich registriert. Auf einer selbst gehosteten Instanz ist es das Konto, das der Betreiber mit `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD` konfiguriert (siehe [Authentifizierung](../self-hosting/authentication.md)); auf dem gehosteten Dienst ist es der Betreiber. Eine Registrierung vergibt diese Rolle nie.
:::

## Was ein Arbeitsbereich ist

Ein **Arbeitsbereich** ist eine Sammlung von Bienenständen, Beuten und Aufzeichnungen, die zusammengehören. Jedes Konto beginnt mit einem **persönlichen Arbeitsbereich**. Du kannst außerdem zu gemeinsamen Arbeitsbereichen gehören, zum Beispiel einem Vereinsbienenstand, den mehrere Imker betreuen, einem Lehrbienenstand oder einem zweiten Betrieb, den du von deinen privaten Beuten getrennt hältst.

Alles, was du erfasst, liegt im **aktiven Arbeitsbereich**, und jedes Mitglied eines Arbeitsbereichs sieht alles davon. Beim Wechsel des Arbeitsbereichs ändert sich, welche Bienenstände, Beuten und Durchsichten du siehst. Eine feinere Freigabe gibt es nicht: Um manche Beuten zu teilen und andere nicht, legst du sie in getrennte Arbeitsbereiche.

## Arbeitsbereiche wechseln

Öffne **Einstellungen → Arbeitsbereiche**. Jeder Arbeitsbereich, zu dem du gehörst, ist mit deiner Rolle darin aufgeführt; der aktive ist markiert. Tippe auf einen anderen, um zu wechseln; die App lädt mit den Aufzeichnungen dieses Arbeitsbereichs neu.

## Einen Arbeitsbereich erstellen

Gib unter **Einstellungen → Arbeitsbereiche** einen Namen ein (zum Beispiel „Imkerverein") und tippe auf **Arbeitsbereich erstellen**. Du wirst sein **Admin** und er wird dein aktiver Arbeitsbereich.

## Rollen

| Rolle | Berechtigungen |
| --- | --- |
| **Admin** (Eigentümer des Arbeitsbereichs) | Alles, was ein Mitglied kann, plus Personen einladen, offene Einladungen zurückziehen, Rollen von Mitgliedern ändern, Mitglieder entfernen, API-Schlüssel von Mitgliedern entfernen und den Arbeitsbereich löschen. Wer einen Arbeitsbereich erstellt, ist sein Admin. |
| **Mitglied** | Mit allen Bienenständen, Beuten und Aufzeichnungen des Arbeitsbereichs arbeiten, sehen, wer sonst Mitglied ist, und den Arbeitsbereich verlassen. |

Ein Arbeitsbereich kann mehrere Admins haben und behält immer mindestens einen: Der letzte Admin kann weder austreten noch zum Mitglied gemacht werden. Mach zuerst jemand anderen zum Admin oder lösche den Arbeitsbereich.

Die Rolle des Instanz-Administrators aus der Serverkonfiguration ist davon getrennt: Innerhalb eines Arbeitsbereichs ist der Instanz-Administrator Admin oder Mitglied wie alle anderen.

## Imker einladen

Als Arbeitsbereichs-Admin öffnest du **Einstellungen → Arbeitsbereiche → Imker:in einladen**, gibst die E-Mail-Adresse der Person ein und tippst auf **Einladung senden**. Die App zeigt den Einladungslink mit einem Button **Link kopieren**; gib ihn direkt weiter. Wenn auf dem Server SMTP konfiguriert ist, wird derselbe Link zusätzlich per E-Mail verschickt. Eingeladene treten als Mitglieder bei.

Eine Einladung ist 7 Tage gültig und funktioniert nur für die E-Mail-Adresse, für die sie ausgestellt wurde. Offene Einladungen sind unter **Offene Einladungen** mit eigenen Buttons **Link kopieren** und **Zurückziehen** aufgeführt. Eine Einladung verschwindet aus der Liste, sobald sie angenommen wurde.

## Eine Einladung annehmen

Der Einladungslink öffnet den Anmeldebildschirm mit dem Hinweis, dass du eingeladen wurdest.

- Wenn du noch kein Konto hast, erstelle eines mit der E-Mail-Adresse, an die die Einladung ging.
- Wenn du schon ein Konto mit dieser Adresse hast, melde dich an.

Eine Einladung lässt sich nicht mit einer anderen E-Mail-Adresse verwenden („Diese Einladung wurde für eine andere E-Mail-Adresse ausgestellt.“), und sie funktioniert 7 Tage nach ihrer Erstellung nicht mehr („Diese Einladung ist ungültig oder abgelaufen.“). Bitte den Arbeitsbereichs-Admin um eine neue.

Sobald du angemeldet bist, nimmt die App dich in den Arbeitsbereich auf und wechselt dich hinein. Ab dann erscheint er in deinen eigenen **Einstellungen → Arbeitsbereiche**.

## Mitglieder \{#members}

**Einstellungen → Arbeitsbereiche → Mitglieder** zeigt, wer zum aktiven Arbeitsbereich gehört. Ein Admin sieht die E-Mail-Adresse und Rolle jedes Mitglieds, kann die **Rolle** ändern (**Admin** oder **Mitglied**) und ein Mitglied **Entfernen**. Ein entferntes Mitglied verliert sofort den Zugriff, auch für seine API-Schlüssel; die Aufzeichnungen, die es geschrieben hat, bleiben. Seine persönlichen Aufgaben in diesem Arbeitsbereich werden gelöscht.

Jedes Mitglied kann einen Arbeitsbereich **Verlassen**. Du verlierst sofort den Zugriff auf seine Aufzeichnungen und brauchst eine neue Einladung, um zurückzukommen. Wenn du sein einziges Mitglied bist, gibt es nichts zu verlassen; lösche den Arbeitsbereich stattdessen.

Wenn du den Zugriff auf den Arbeitsbereich verlierst, in dem du gerade gearbeitet hast, sagt dir die App das und macht in einem anderen deiner Arbeitsbereiche weiter.

## Einen Arbeitsbereich löschen

Ein Arbeitsbereichs-Admin kann den Arbeitsbereich unter **Einstellungen → Arbeitsbereiche → Gefahrenzone** löschen. Zur Bestätigung tippst du den Namen des Arbeitsbereichs ein. Das entfernt den Arbeitsbereich mit allen Bienenständen, Beuten, Aufzeichnungen und Fotos für jedes Mitglied und lässt sich nicht rückgängig machen.

## Dein Konto löschen \{#delete-account}

**Einstellungen → Konto löschen** zeigt, was das Löschen deines Kontos bewirken würde, bevor du bestätigst:

- Deine Anmeldedaten, API-Schlüssel und persönlichen Aufgaben werden gelöscht.
- Arbeitsbereiche, in denen du das einzige Mitglied bist, werden mit allen Aufzeichnungen und Fotos gelöscht.
- In Arbeitsbereichen, die du mit anderen teilst, bleiben deine Aufzeichnungen für die anderen Mitglieder erhalten, gekennzeichnet als Einträge eines gelöschten Nutzers.
- Solange du der einzige Admin eines Arbeitsbereichs mit weiteren Mitgliedern bist, lässt sich das Konto nicht löschen. Mach dort zuerst jemand anderen zum Admin oder lösche den Arbeitsbereich.

Bestätige mit deinem Passwort oder einem Passkey. Ein Konto ohne beides muss sich vor weniger als 5 Minuten angemeldet haben; andernfalls bittet dich die App, dich noch einmal anzumelden. Das Löschen lässt sich nicht rückgängig machen. Das Konto des Instanz-Administrators und das Demo-Konto lassen sich in der App nicht löschen.

## API-Schlüssel \{#api-keys}

Unter **Einstellungen → API-Schlüssel** erstellst du Zugangsdaten für Skripte und Geräte wie eine Stockwaage, die die [API](../using-the-api/overview.md) in deinem Namen nutzen. Der Bereich erscheint nur, wenn du angemeldet bist; eine Einzelbenutzer-Instanz ohne Anmeldung hat keine Schlüssel und braucht auch keine.

- Gib im Feld **Schlüssel benennen (z. B. Stockwaage)** einen Namen ein, wähle die Berechtigungen in der Auswahl **Berechtigungen** (**Lesen und Schreiben**, die Vorgabe, oder **Nur Lesen**) und die Laufzeit in der Auswahl **Läuft ab nach** (**Läuft nie ab**, die Vorgabe, **30 Tagen**, **90 Tagen** oder **1 Jahr**) und tippe auf **Schlüssel erstellen**. Der Schlüssel erscheint darunter mit dem Hinweis „Kopiere den Schlüssel jetzt. Er wird nur einmal angezeigt." und einem Button **Kopieren** (er zeigt kurz **Kopiert**). Was du jetzt nicht kopierst, ist weg; der Server behält nur einen Hash. Unter **So verwendest du ihn** zeigt die App die Adresse, an die Anfragen gehen, und ein fertiges Beispiel, das deine Beuten auflistet, mit **Beispiel kopieren**.
- Jeder Schlüssel ist mit seinem Namen aufgeführt (**Unbenannter Schlüssel**, wenn du das Feld leer gelassen hast), seinen ersten Zeichen, einem Badge **Lesen und Schreiben** oder **Nur Lesen**, **Erstellt**, dann **Läuft ab** und dem Datum, wenn du eine Laufzeit gesetzt hast (**Abgelaufen** und das Datum, in Rot, sobald dieser Tag vorbei ist), und, sobald ein Skript ihn verwendet hat, **Zuletzt verwendet**. Abgelaufene Schlüssel bleiben in der Liste, bis du sie entfernst.
- **Entfernen** zieht einen Schlüssel nach einer Bestätigung zurück („Diesen Schlüssel entfernen? Skripte, die ihn verwenden, funktionieren sofort nicht mehr.").

Als Arbeitsbereichs-Admin siehst du unter deinen eigenen Schlüsseln außerdem **Schlüssel anderer Mitglieder** mit dem Hinweis „Als Arbeitsbereichs-Admin kannst du den Schlüssel jedes Mitglieds entfernen, etwa wenn jemand ausscheidet oder ein Gerät verloren geht." Jede Zeile zeigt den Namen des Schlüssels, seine ersten Zeichen, sein Badge **Lesen und Schreiben** oder **Nur Lesen**, die E-Mail-Adresse des Besitzers und, sobald ein Skript ihn verwendet hat, **Zuletzt verwendet**. **Entfernen** fragt dort „Den Schlüssel dieses Mitglieds entfernen? Dessen Skripte funktionieren damit sofort nicht mehr." Die Liste umfasst nur den aktiven Arbeitsbereich und erscheint nur, wenn andere Mitglieder Schlüssel haben; Mitglieder können die Schlüssel der anderen weder sehen noch entfernen.

Ein Schlüssel handelt als du in dem Arbeitsbereich, der beim Erstellen aktiv war; wechsle also zuerst den Arbeitsbereich, wenn ein Gerät zu einem gemeinsamen Bienenstand gehört. Ein Schlüssel mit **Nur Lesen** kann nur lesen; Skripte, die schreiben, brauchen **Lesen und Schreiben**. Ein Schlüssel läuft nur ab, wenn du eine Laufzeit setzt; er funktioniert nicht mehr, wenn er abläuft, wenn du ihn entfernst oder wenn du diesen Arbeitsbereich verlässt oder daraus entfernt wirst. Das Demo-Konto kann keine Schlüssel erstellen. Wie ein Skript den Schlüssel sendet, steht unter [Authentifizierung](../using-the-api/overview.md#authentication).

## Die Demo

Manche Instanzen betreiben ein **Demo-Konto**. Solange du darin angemeldet bist, erinnert dich ein Banner daran, dass die Daten jede Stunde zurückgesetzt werden. Die Demo ist schreibgeschützt: Wenn du etwas änderst, macht die App die Änderung rückgängig und sagt, dass sie nicht gespeichert wurde. Die öffentliche Demo des Projekts ist die Schaltfläche **Demo ausprobieren** auf [app.openbeehive.org/login](https://app.openbeehive.org/login). Betreiber können sie über den [Demo-Modus](../self-hosting/demo.md) aktivieren.

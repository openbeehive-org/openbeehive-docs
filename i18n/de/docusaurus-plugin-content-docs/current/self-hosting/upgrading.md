---
sidebar_position: 10
title: "Aktualisieren"
---

# Aktualisieren

Upgrades sind einfach: Ersetze die Binärdatei oder ziehe ein neues Image, starte neu, und der Server bringt das Datenbankschema von selbst auf den neuesten Stand.

:::caution Sichere jedes Mal zuerst
Erstelle vor dem Upgrade ein Backup. Siehe [Backups](./backups.md).
:::

## Bevor du beginnst

1. **Lies die Release Notes.** Prüfe das [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) und das [GitHub-Release](https://github.com/openbeehive-org/openbeehive-app/releases) für die Version, auf die du umsteigst. Notiere neue erforderliche Konfiguration oder manuelle Schritte.
2. **Sichere** die Datenbank und den Blob-Speicher.
3. **Notiere deine aktuelle Version** (das Tag, das du gebaut hast, oder das Image-Tag, das du betreibst), damit du weißt, worauf du zurückrollen kannst.
4. **Wähle einen ruhigen Moment.** Der Neustart ist kurz; Geräte arbeiten lokal weiter und synchronisieren, sobald der Server wieder da ist.

## Release-spezifische Schritte

### Upgrade auf 0.5.0 \{#upgrading-to-050}

0.5.0 verschärft mehrere Standardwerte. Sichere zuerst und geh dann diese Liste durch; wo eine Einstellung fehlt, bricht der Server beim Start ab und nennt sie.

**Einstellungen**

- **Session-Secret.** Mit jeder Anmeldemethode muss `BEEHIVE_SESSION_SECRET` gesetzt und mindestens 32 Bytes lang sein, sonst startet der Server nicht. Erzeuge eines mit `openssl rand -base64 32`; ein neues Secret meldet alle ab.
- **`.env` wird von der Binärdatei gelesen.** Der Server lädt `.env` jetzt aus seinem Arbeitsverzeichnis. Prüfe, ob eine alte `.env`, die dort liegt, das enthält, was du willst; echte Umgebungsvariablen haben weiterhin Vorrang.
- **CORS ist standardmäßig Same-Origin.** Wenn die App von einem anderen Ursprung als die API ausgeliefert wird, trage ihn in `BEEHIVE_CORS_ALLOWED_ORIGINS` ein. `*` erlaubt keine Anmeldedaten mehr.
- **Keine Anmeldung: nur bekannte Hostnamen.** Ein Server ohne Anmeldung antwortet nur auf `localhost`, IP-Adressen und den Host aus `BEEHIVE_PUBLIC_BASE_URL`. Trage andere Namen in `BEEHIVE_ALLOWED_HOSTS` ein.
- **E-Mail-Verifizierung braucht einen Mailserver.** `BEEHIVE_EMAIL_VERIFICATION=true` setzt `BEEHIVE_SMTP_HOST` voraus. Links werden nicht mehr ins Log geschrieben; ohne SMTP kopierst du Einladungslinks aus den Einstellungen.
- **OIDC.** Ein in `BEEHIVE_OIDC_PROVIDERS` aufgeführter Provider ohne Issuer und Client-ID verhindert den Start. Eine Provider-Anmeldung wird nur dann an ein bestehendes Konto angehängt, wenn beide Seiten die E-Mail-Adresse verifiziert haben.
- **Reverse Proxy.** Setze hinter deinem Proxy `BEEHIVE_TRUST_PROXY_HEADERS=true`, sonst zählt die Drosselung der Anmeldung alle Nutzer als eine Adresse.
- **`BEEHIVE_NODE_ID`** ist jetzt standardmäßig eine zufällige ID pro Start; entferne die Variable aus deiner Konfiguration, sofern du sie nicht bewusst gesetzt hast. Die ungenutzten Einstellungen für die Sync-Seitengröße gibt es nicht mehr.

**Compose-Dateien**

- `docker-compose.yml` ist der Entwicklungs-Stack: Sie verlangt jetzt `BEEHIVE_SESSION_SECRET` und `MINIO_ROOT_PASSWORD`, veröffentlicht PostgreSQL und MinIO nur auf `127.0.0.1` und aktiviert OIDC nur, wenn du es verlangst.
- Um Openbeehive zu betreiben, verwende die neue `docker-compose.selfhost.yml` (ein Container, SQLite) oder `docker-compose.prod.yml` (PostgreSQL und MinIO). `docker-compose.demo.yml` ist die gehostete Demo und veröffentlicht auf `127.0.0.1`, solange `BEEHIVE_BIND` nicht gesetzt ist. Siehe [Docker & Compose](./docker.md).

**Daten**

- **Das Einschalten der Anmeldung verschiebt Einzelnutzer-Aufzeichnungen.** Wenn die Instanz ohne Anmeldung lief und du die E-Mail-/Passwort-Anmeldung aktivierst, wandern bestehende Aufzeichnungen beim nächsten Start in den Arbeitsbereich des Instanz-Admins. Das lässt sich nicht rückgängig machen; siehe [Authentifizierung](./authentication.md#single-user-to-login).
- **Datenbank-Migrationen.** Der erste Start baut die Tabelle der Durchsichten und den Index des Änderungsprotokolls neu auf und dauert daher bei einer großen Datenbank länger. Bei MariaDB stellt er außerdem die Tabellen auf eine binäre Kollation um, und eine Migration, die dort fehlschlägt, lässt sich nicht zurückrollen: Ein Backup ist der einzige Weg zurück.
- **Betreibe genau eine Server-Instanz** pro Datenbank.

**Verhalten, das Nutzer und Skripte bemerken**

- **Einladungen** laufen nach 7 Tagen ab und funktionieren nur für die eingeladene E-Mail-Adresse. Offene Einladungen, die älter sind, müssen neu ausgestellt werden.
- **Drosselung der Anmeldung.** Nach 10 fehlgeschlagenen Anmeldungen für ein Konto oder 30 von einer Adresse innerhalb von 15 Minuten antwortet der Server mit `429` und `Retry-After`.
- **Limits.** Eine RPC-Nachricht darf höchstens 16 MiB groß sein, und eine Anfrage darf höchstens 2 Minuten dauern (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`).
- **Geräteuhren.** Änderungen, deren Zeitstempel der Serverzeit mehr als 10 Minuten voraus ist, werden abgelehnt. Aktualisierte Apps korrigieren sich selbst; eine 0.4.x-App mit falscher Uhr verliert solche Änderungen, aktualisiere die App also auf jedem Gerät.
- **API.** Update-Aufrufe ändern nur die gesendeten Felder; `DeleteApiary` schlägt mit `failed_precondition` fehl, solange der Bienenstand Beuten hat; persönliche Aufgaben werden nur an ihren Besitzer zurückgegeben; Messwerte einer Durchsicht, die nicht erfasst wurden, werden weggelassen, statt als `0` zurückgegeben zu werden. Die einfachen HTTP-Endpunkte unter `/auth/` und `/tenants/` akzeptieren nur die dokumentierte Methode, brauchen `Content-Type: application/json`, wenn sie einen Body entgegennehmen, und `/tenants/delete` braucht `org_id`. Siehe [REST](../using-the-api/rest.md).

Installierte 0.4.x-Apps funktionieren weiter mit einem 0.5.0-Server. Nachdem sich die App selbst aktualisiert hat, lädt jedes Gerät seine Daten einmal neu herunter.

### 0.4.0: Der Container läuft als unprivilegierter Benutzer

Bis 0.3.1 lief das Image als root, daher gehört ein von einem älteren Container angelegtes Volume root, und der 0.4.0-Server (uid `65532`) kann die Datenbank darin nicht öffnen. Korrigiere die Besitzrechte einmalig, bevor du das neue Image startest:

```bash
# named volume from the quick start
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

Das Symptom eines ausgelassenen chown ist `unable to open database file` oder `permission denied` im Server-Log direkt nach dem Start. Kubernetes-Bereitstellungen mit `securityContext.fsGroup: 65532` brauchen keinen manuellen Schritt. Volumes, die von 0.4.0 oder neuer angelegt wurden, haben von Anfang an den richtigen Besitzer.

Das Cloud-Profil (Postgres und MinIO) ist nicht betroffen: Der Server-Container hält keine Daten.

## Wie Migrationen funktionieren

Schema-Migrationen laufen automatisch, wenn der Server startet. Beim Booten wendet der Server ausstehende Migrationen der Reihe nach an und beginnt erst dann, Anfragen zu bedienen. Das funktioniert für PostgreSQL, MariaDB und SQLite gleich.

:::note
Der erste Start einer neuen Version kann etwas länger dauern, während das Schema aktualisiert wird. Beobachte die Logs, um zu bestätigen, dass er abschließt, bevor du Verkehr darauf sendest.
:::

## Die einzelne Binärdatei aktualisieren

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp /opt/openbeehive/openbeehive /opt/openbeehive/openbeehive.bak
# (also back up the SQLite database and blob directory; see Backups)

# 3. Replace the binary with the new build, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Um das neue Release aus dem Quellcode zu bauen, checke sein Tag aus und baue neu:

```bash
git fetch --tags
git checkout vX.Y.Z
make proto && make build
```

Das erzeugt eine frische `./server/bin/openbeehive`. Die Voraussetzungen stehen unter [Einzelne Binärdatei](./single-binary.md) (Go 1.27+, Node 24+, buf).

## Mit Docker aktualisieren

Welchen Befehl du brauchst, hängt davon ab, woher das Image kommt.

**Veröffentlichtes Image** (der Einzel-Container per `docker run` aus dem [Schnelleinstieg](./quick-start.md) oder eine Compose-Datei mit einer `image:`-Zeile wie `docker-compose.selfhost.yml` oder `docker-compose.prod.yml`). Die Compose-Dateien legen ein Release per Tag und Digest fest; ändere die `image:`-Zeile auf das gewünschte Release (oder nimm die Datei aus diesem Release), dann:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f server
```

Für einen einfachen `docker run`-Container: `docker pull ghcr.io/openbeehive-org/openbeehive-app:latest`, dann `docker rm -f openbeehive` und denselben `docker run`-Befehl erneut ausführen. Das benannte Volume behält deine Daten.

**Aus dem Quellcode gebaut** (die `docker-compose.yml` des Repositorys hat einen `build:`-Abschnitt, daher bewirkt `pull` dort nichts):

```bash
git pull
docker compose up -d --build
docker compose logs -f server
```

Image-Tags sind `latest`, `X.Y` (neuester Patch eines Minor-Releases) und `X.Y.Z`. Für reproduzierbare Bereitstellungen pinne eine bestimmte Version statt `latest`:

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z
```

## Versionierung

Openbeehive folgt der [semantischen Versionierung](https://semver.org): `MAJOR.MINOR.PATCH`.

| Teil | Bedeutet |
| --- | --- |
| MAJOR | Breaking Changes; lies die Upgrade-Hinweise sorgfältig |
| MINOR | Neue Funktionen, abwärtskompatibel |
| PATCH | Fehlerbehebungen und Sicherheitspatches, abwärtskompatibel |

:::caution 0.x ist frühe Software
Solange Openbeehive in der `0.x`-Serie ist, können Minor-Releases Änderungen enthalten, die manuelle Schritte brauchen oder nicht vollständig abwärtskompatibel sind. Lies die Release Notes für jedes Upgrade und halte deine Backups bereit.
:::

## Zurückrollen

Ein neueres Schema ist möglicherweise nicht von einer älteren Binärdatei lesbar. Sobald Migrationen gelaufen sind, ist ein Herabstufen der Anwendung allein nicht garantiert funktionsfähig. Stelle die Anwendung *und* die Datenbank aus dem Zustand vor dem Upgrade wieder her:

1. Stoppe den Dienst.
2. Stelle die Datenbank (und, falls relevant, den Blob-Speicher) aus dem Backup wieder her, das du vor dem Upgrade erstellt hast.
3. Installiere die vorherige Binär- oder Image-Version erneut.
4. Starte den Dienst und bestätige, dass er sauber hochkommt.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit the compose file back to the previous tag, e.g. X.Y.Z
docker compose up -d
```

:::danger
Stelle keine alte Datenbank unter einer neueren Binärdatei wieder her und betreibe keine neuere Datenbank unter einer älteren Binärdatei, außer für das zusammengehörige Paar, das du gemeinsam gesichert hast. Stelle Binärdatei und Datenbank immer als Einheit wieder her.
:::

## Nach dem Upgrade

- Prüfe die Logs auf Fehler oder Migrationswarnungen.
- Öffne die App und bestätige, dass deine Standorte, Beuten und letzten Durchsichten erscheinen.
- Erfasse etwas auf einem Gerät und bestätige, dass es synchronisiert.

Wenn etwas falsch aussieht, siehe [Fehlerbehebung](../knowledge-base/troubleshooting.md) und rolle auf dein Backup zurück, während du die Ursache untersuchst.

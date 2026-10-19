---
sidebar_position: 2
title: "Binaire unique"
---

# Binaire unique

La façon la plus simple d'exécuter Openbeehive sur votre propre machine est le **binaire unique**. Dans le profil `selfhost`, Openbeehive sert l'application web et l'API depuis un seul processus, stocke ses données dans un fichier SQLite local et conserve les photos téléversées sur le système de fichiers. Pas de Docker, pas de Postgres, pas de stockage objet, juste un exécutable.

Cette page vous guide pour compiler ce binaire à partir des sources et l'exécuter comme un service de longue durée.

:::tip Pressé ?
Si vous préférez récupérer une image de conteneur préconstruite, voir [Docker](/self-hosting/docker). Pour comparer d'abord les deux approches, commencez par la [présentation de l'auto-hébergement](/category/self-hosting).
:::

## Prérequis

Vous aurez besoin de quelques outils de compilation installés sur la machine qui compile le binaire :

| Outil | Version | Rôle |
| --- | --- | --- |
| Go | 1.25+ | Compile le serveur |
| Node.js | 24+ | Construit l'application web SvelteKit |
| buf | latest | Génère le code Connect-RPC à partir des définitions protobuf |

Une fois compilé, le binaire lui-même n'a aucune dépendance d'exécution : vous pouvez le copier sur un serveur qui n'a aucun des outils ci-dessus installé.

## Récupérer le code

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
```

## Configurer

Copiez le fichier d'environnement d'exemple et choisissez le profil d'auto-hébergement :

```bash
cp .env.example .env
```

Pour une instance privée mono-utilisateur, les valeurs par défaut sont presque prêtes à l'emploi. Ouvrez `.env` et confirmez ces valeurs :

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
BEEHIVE_SESSION_SECRET=
```

Générez un secret de session, ne le laissez jamais vide ailleurs que dans un test jetable :

```bash
openssl rand -base64 32
```

Collez le résultat dans `BEEHIVE_SESSION_SECRET=`.

:::note Aucune connexion par défaut
Le profil selfhost n'active aucune méthode de connexion : `BEEHIVE_PASSWORD_AUTH` est désactivé, `BEEHIVE_OIDC_PROVIDERS` est vide et `BEEHIVE_WEBAUTHN_ENABLED=false`. Laissez-les ainsi pour fonctionner en mono-utilisateur sans étape de connexion. Lorsque vous voudrez des comptes, des passkeys ou un fournisseur, voir [Authentification](/self-hosting/authentication).
:::

Si vous comptez accéder à l'instance depuis un autre appareil de votre réseau, définissez `BEEHIVE_PUBLIC_BASE_URL` sur une adresse que cet appareil peut réellement résoudre (par exemple `http://192.168.1.20:8080` ou votre domaine derrière un [reverse proxy](/self-hosting/reverse-proxy)). Les étiquettes QR encodent l'adresse à laquelle vous ouvrez l'application, utilisez donc cette même adresse de manière cohérente.

## Compiler

Générez le code protobuf, puis compilez :

```bash
make proto
make build
```

Cela produit un seul exécutable :

```text
./server/bin/openbeehive
```

L'application web est intégrée au binaire, il n'y a donc rien d'autre à déployer à côté de lui.

## Lancer

Depuis la racine du dépôt (afin que les chemins relatifs de `.env` se résolvent comme attendu) :

```bash
./server/bin/openbeehive
```

Au premier démarrage, le serveur :

- crée le fichier de base de données SQLite `openbeehive.db` et exécute ses migrations,
- crée le répertoire `./data/` (avec `./data/blobs` pour les photos),
- sert l'application web et l'API Connect-RPC sur `:8080`.

Ouvrez `http://localhost:8080` dans votre navigateur. L'application se charge, construit sa base de données locale dans le navigateur, et vous êtes prêt à ajouter votre premier rucher.

:::tip Le répertoire de travail compte
Les chemins relatifs comme `file:openbeehive.db` et `./data/blobs` sont résolus par rapport au répertoire depuis lequel le binaire est lancé, et non par rapport à l'emplacement du binaire. Choisissez délibérément un répertoire de travail : l'unité systemd ci-dessous le définit explicitement avec `WorkingDirectory`.
:::

## Exécuter en tant que service systemd

Pour une instance toujours disponible, exécutez Openbeehive sous systemd afin qu'il démarre au boot et redémarre en cas d'échec.

D'abord, placez le binaire et un répertoire de travail à un endroit raisonnable et créez un utilisateur dédié :

```bash
sudo useradd --system --home /opt/openbeehive --shell /usr/sbin/nologin openbeehive
sudo mkdir -p /opt/openbeehive
sudo cp server/bin/openbeehive /opt/openbeehive/
sudo cp .env /opt/openbeehive/
sudo chown -R openbeehive:openbeehive /opt/openbeehive
```

Puis créez le fichier d'unité dans `/etc/systemd/system/openbeehive.service` :

```text
[Unit]
Description=Openbeehive beekeeping records
After=network.target

[Service]
Type=simple
User=openbeehive
Group=openbeehive
WorkingDirectory=/opt/openbeehive
EnvironmentFile=/opt/openbeehive/.env
ExecStart=/opt/openbeehive/openbeehive
Restart=on-failure
RestartSec=5

# Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/openbeehive
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Activez-le et démarrez-le :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openbeehive
```

Vérifiez qu'il est sain et suivez les logs :

```bash
systemctl status openbeehive
journalctl -u openbeehive -f
```

:::caution Liaison au port 80 ou 443
L'exemple se lie à `:8080`, ce qu'un utilisateur non privilégié peut utiliser. N'exécutez pas le service en tant que root pour atteindre les ports 80/443 ; gardez plutôt Openbeehive sur `:8080` et placez un [reverse proxy](/self-hosting/reverse-proxy) (tel que Caddy ou nginx) devant lui pour gérer TLS et le port public.
:::

## Où se trouvent vos données

Dans le profil `selfhost`, tout est stocké sous le répertoire de travail que vous avez choisi (ci-dessus, `/opt/openbeehive`) :

| Quoi | Emplacement par défaut | Défini par |
| --- | --- | --- |
| Base de données des enregistrements | `openbeehive.db` (plus les fichiers `-wal` / `-shm`) | `BEEHIVE_DATABASE_DSN` |
| Photos et pièces jointes | `./data/blobs` | `BEEHIVE_BLOB_DIR` |

Les fichiers `-wal` et `-shm` à côté de la base de données sont le journal en écriture anticipée (write-ahead log) de SQLite ; traitez-les comme faisant partie de la base de données.

## Déplacer ou sauvegarder vos données

Comme tout l'état tient dans des fichiers d'un seul répertoire, déplacer une instance est essentiellement un travail de copie :

1. Arrêtez le service pour que la base de données soit au repos : `sudo systemctl stop openbeehive`.
2. Copiez le binaire, `.env`, les fichiers de base de données et le répertoire `data/` sur la nouvelle machine, en préservant l'organisation.
3. Démarrez le service sur le nouvel hôte : `sudo systemctl start openbeehive`.

:::danger Arrêtez toujours le service d'abord
Copier `openbeehive.db` pendant que le serveur fonctionne peut capturer un instantané déchiré et incohérent. Arrêtez le service (ou utilisez une procédure de sauvegarde appropriée) avant de copier les fichiers de base de données.
:::

Pour les sauvegardes planifiées, la rétention et les techniques sûres de sauvegarde à chaud pour SQLite, voir [Sauvegardes](/self-hosting/backups).

## Mise à niveau

Pour passer à une version plus récente, récupérez le dernier code, recompilez et remplacez le binaire : votre base de données et votre répertoire `data/` restent en place et les migrations s'exécutent au démarrage suivant. La procédure complète, y compris comment revenir en arrière, est décrite dans [Mise à niveau](/self-hosting/upgrading).

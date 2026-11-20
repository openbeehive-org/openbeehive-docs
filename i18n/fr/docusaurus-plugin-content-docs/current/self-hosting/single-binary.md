---
sidebar_position: 2
title: "Binaire unique"
---

# Binaire unique

La façon la plus simple d'exécuter Openbeehive sur votre propre machine est le **binaire unique**. Dans le profil `selfhost`, Openbeehive sert l'application web et l'API depuis un seul processus, stocke ses données dans un fichier SQLite local et conserve les photos téléversées sur le système de fichiers. Pas de Docker, pas de Postgres, pas de stockage objet, juste un exécutable.

Cette page vous guide pour compiler ce binaire à partir des sources et l'exécuter comme un service de longue durée.

:::tip[Pressé ?]
Si vous préférez récupérer une image de conteneur préconstruite, voir [Docker](./docker.md). Pour comparer d'abord les deux approches, commencez par la [présentation de l'auto-hébergement](/category/self-hosting).
:::

## Prérequis

Vous aurez besoin de quelques outils de compilation installés sur la machine qui compile le binaire :

| Outil | Version | Rôle |
| --- | --- | --- |
| Go | 1.27+ | Compile le serveur |
| Node.js | 24+ | Construit l'application web SvelteKit |
| buf | épinglée par `make tools` | Génère le code Connect-RPC à partir des définitions protobuf |

Une fois compilé, le binaire lui-même n'a aucune dépendance d'exécution : vous pouvez le copier sur un serveur qui n'a aucun des outils ci-dessus installé.

## Récupérer le code

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
```

## Configurer

Le serveur se configure au moyen de variables d'environnement, et il lit un fichier `.env` dans le répertoire depuis lequel il est lancé. Les variables déjà définies dans l'environnement l'emportent sur le fichier. Copiez le fichier d'exemple :

```bash
cp .env.example .env
```

Pour une instance privée mono-utilisateur, les valeurs par défaut intégrées sont prêtes à l'emploi ; voici celles qui comptent :

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
# Defaults of the selfhost profile:
# BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
# BEEHIVE_BLOB_DIR=./data/blobs
```

:::note[Aucune connexion par défaut]
Le profil selfhost n'active aucune méthode de connexion : `BEEHIVE_PASSWORD_AUTH` est désactivé, `BEEHIVE_OIDC_PROVIDERS` est vide et `BEEHIVE_WEBAUTHN_ENABLED=false`. Toute personne pouvant atteindre le port dispose alors d'un accès complet, et le serveur ne répond qu'à `localhost`, aux adresses IP et à l'hôte de `BEEHIVE_PUBLIC_BASE_URL` (ajoutez d'autres noms avec `BEEHIVE_ALLOWED_HOSTS`). Lorsque vous voudrez des comptes, des passkeys ou un fournisseur, voir [Authentification](./authentication.md) ; toute méthode de connexion nécessite un `BEEHIVE_SESSION_SECRET` d'au moins 32 octets (`openssl rand -base64 32`).
:::

Si vous comptez accéder à l'instance depuis un autre appareil de votre réseau, définissez `BEEHIVE_PUBLIC_BASE_URL` sur l'adresse que cet appareil ouvre (par exemple `http://192.168.1.20:8080` ou votre domaine derrière un [reverse proxy](./reverse-proxy.md)) et activez la connexion. Les étiquettes QR encodent l'adresse à laquelle vous ouvrez l'application, utilisez donc cette même adresse de manière cohérente.

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

Depuis la racine du dépôt, là où se trouve `.env` :

```bash
./server/bin/openbeehive
```

Au premier démarrage, le serveur :

- applique `.env` et consigne dans le journal le profil, la base de données et si une connexion est requise,
- crée le fichier de base de données SQLite `openbeehive.db` et exécute ses migrations,
- crée le répertoire `./data/` (avec `./data/blobs` pour les photos),
- sert l'application web et l'API Connect-RPC sur `:8080`.

Ouvrez `http://localhost:8080` dans votre navigateur. L'application se charge, construit sa base de données locale dans le navigateur, et vous êtes prêt à ajouter votre premier rucher.

:::tip[Le répertoire de travail compte]
Les chemins relatifs comme `file:openbeehive.db` et `./data/blobs` sont résolus par rapport au répertoire depuis lequel le binaire est lancé, et non par rapport à l'emplacement du binaire, et `.env` est lu dans ce même répertoire. Choisissez délibérément un répertoire de travail : l'unité systemd ci-dessous le définit explicitement avec `WorkingDirectory`.
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

L'unité n'a pas besoin de `EnvironmentFile` : le serveur lit lui-même `/opt/openbeehive/.env` car c'est son répertoire de travail. Gardez le fichier lisible par le seul utilisateur `openbeehive` (`chmod 600`), puisqu'il contient le secret de session et le mot de passe de l'administrateur.

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

:::caution[Liaison au port 80 ou 443]
L'exemple se lie à `:8080`, ce qu'un utilisateur non privilégié peut utiliser. N'exécutez pas le service en tant que root pour atteindre les ports 80/443 ; gardez plutôt Openbeehive sur `:8080` et placez un [reverse proxy](./reverse-proxy.md) (tel que Caddy ou nginx) devant lui pour gérer TLS et le port public.
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

:::danger[Arrêtez toujours le service d'abord]
Copier `openbeehive.db` pendant que le serveur fonctionne peut capturer un instantané déchiré et incohérent. Arrêtez le service (ou utilisez une procédure de sauvegarde appropriée) avant de copier les fichiers de base de données.
:::

Pour les sauvegardes planifiées, la rétention et les techniques sûres de sauvegarde à chaud pour SQLite, voir [Sauvegardes](./backups.md).

## Mise à niveau

Pour passer à une version plus récente, récupérez le dernier code, recompilez et remplacez le binaire : votre base de données et votre répertoire `data/` restent en place et les migrations s'exécutent au démarrage suivant. La procédure complète, y compris comment revenir en arrière, est décrite dans [Mise à niveau](./upgrading.md).

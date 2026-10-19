---
sidebar_position: 7
title: "Contribuer et configuration de développement"
---

# Contribuer et configuration de développement

Openbeehive est sous licence **AGPL-3.0**. En contribuant, vous acceptez que
votre travail soit publié sous la même licence. Lisez
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md)
dans le dépôt de l'application avant d'ouvrir une pull request.

## Les dépôts

| Dépôt | Contenu |
| --- | --- |
| [`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) | L'application : contrat proto, backend Go, PWA SvelteKit |
| [`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site) | Le site vitrine sur openbeehive.org |
| [`openbeehive-docs`](https://github.com/openbeehive-org/openbeehive-docs) | Ce site de documentation (Docusaurus) |

## Prérequis

- **Go 1.27+** pour le backend (la version exacte est la ligne `go` de `server/go.mod`)
- **Node 24+** pour l'application SvelteKit (`app/.nvmrc` indique la version avec laquelle l'image compile)
- **buf** et les autres outils de contrôle : `make tools` installe les versions épinglées dans `$(go env GOPATH)/bin`
- [prek](https://github.com/j178/prek) pour les hooks git, GNU Make ; sous Windows, utilisez WSL2

## Mise en place

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

make tools        # pinned golangci-lint, govulncheck, go-licenses, fleetlint, buf
prek install      # git hooks: formatters and linters on commit, make check on push
make proto        # generate Go + TypeScript stubs from proto/
make run-server   # terminal 1: Go backend on :8080 (loads .env if present)
make dev-app      # terminal 2: Vite dev server on :5173
```

`make check` est la définition du « vert » et exactement ce que lance la CI :
lint proto et vérification des changements cassants, lint (golangci-lint, go vet,
prettier, eslint, svelte-check), tests, seuils de couverture, audit (govulncheck,
licences, npm audit, gitleaks), build et fleetlint. `make check-fast` est le
sous-ensemble rapide que lance le hook pre-commit ; `make help` liste toutes les
cibles.

`make run-server` lit sa configuration depuis l'environnement ou un fichier
`.env` à la racine du dépôt (copiez `.env.example`). Les valeurs par défaut vous
donnent SQLite et des blobs sur le système de fichiers ; laissez
`BEEHIVE_PASSWORD_AUTH` désactivé, `BEEHIVE_OIDC_PROVIDERS` vide et
`BEEHIVE_WEBAUTHN_ENABLED=false` pour fonctionner sans connexion. Voir
[Configuration](/self-hosting/configuration).

Pour compiler un binaire de version : `make proto && make build` écrit
`server/bin/openbeehive` avec la SPA embarquée. Voir
[Binaire unique](/self-hosting/single-binary).

## Code généré

`make proto` exécute `buf generate` avec le `buf.gen.yaml` du dépôt :

| Sortie | Plugins |
| --- | --- |
| `server/internal/gen/` | `protocolbuffers/go`, `connectrpc/go` |
| `app/src/lib/proto/` | `bufbuild/es` v2 (messages et descripteurs de services) |

Les deux répertoires sont ignorés par git. Exécutez `make proto` après le clonage
et après chaque modification d'un `.proto` ; ne modifiez jamais la sortie à la
main. Le build Docker exécute lui-même `buf generate` dans sa première étape.
Chaque service des protos est enregistré sur le serveur ; voir
[Utiliser l'API](/using-the-api/overview) pour la liste.

## Conventions

1. **Les fichiers `.proto` sont la source de vérité.** Modifiez le contrat,
   régénérez, puis implémentez.
2. **Les écritures passent par le dépôt local.** L'application écrit dans sa
   base de données SQLite locale via `app/src/lib/local/repo.ts` et laisse le
   moteur de synchronisation pousser le changement. N'ajoutez pas de code d'UI
   qui appelle directement les services CRUD (`ApiaryService`,
   `InspectionService`, ...) ; ils existent pour les scripts et les
   intégrations, et un appel depuis l'UI sauterait la base de données locale
   et l'outbox, de sorte que le changement ne serait pas visible hors ligne.
3. **Gardez `merge.go` et `merge.ts` identiques.** Le « dernier écrivain
   gagne » par champ et l'OR-Set « l'ajout gagne » sont implémentés dans
   `server/internal/sync/merge.go` et `app/src/lib/local/merge.ts`. Modifiez
   les deux, avec des tests. Voir le
   [protocole de synchronisation](/developers/sync-protocol).
4. **Écrivez du SQL portable.** Le serveur fonctionne sur PostgreSQL, MySQL et
   SQLite. Les migrations utilisent le sous-ensemble portable décrit en tête de
   `0001_init.sql` ; le store traduit les différences de dialecte restantes.
   Voir [Bases de données](/self-hosting/databases).
5. **L'anglais dans le code, les traductions pour les utilisateurs.** Le code,
   les commentaires, les identifiants et les messages de commit sont en anglais.
   Chaque chaîne destinée aux utilisateurs passe par `svelte-i18n` avec des
   entrées dans `app/src/lib/i18n/locales/{en,de,fr,es,it}.json`. Si vous ne
   pouvez pas traduire, ajoutez le texte anglais et signalez-le dans la PR.

## Ouvrir une pull request

1. Forkez et créez une branche.
2. Exécutez `make proto` si vous avez touché un `.proto`.
3. Exécutez `make check` ; c'est ce que lance la CI.
4. Gardez la PR ciblée et décrivez ce qu'elle change et pourquoi.
5. Signalez explicitement les changements de logique de fusion, de
   synchronisation ou de schéma.

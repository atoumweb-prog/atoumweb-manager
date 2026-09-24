# Architecture technique — AtoumWeb Manager

## Statut

**Architecture V1 validée et première fondation implémentée.**

L'objectif est une application Windows locale, fiable, sans serveur obligatoire, facile à sauvegarder et suffisamment moderne pour proposer les trois thèmes, la recherche globale, le timer, l'édition documentaire et la visualisation de code.

## 1. Stack retenue

### Application bureau

- **Electron 44.x**
- **React 19.3**
- **TypeScript 5.9** en mode strict
- **Electron Forge 7.11.2** pour le cycle de développement et le packaging Windows
- **Vite 5.4.19** pour les builds main/preload/renderer
- **Vitest 3.2.7** pour les tests

Le choix Vite 5 est volontairement conservateur : Electron Forge 7.11.2 utilise encore Vite 5 dans son template officiel. Cela limite le risque de compatibilité pendant la V1 tout en conservant une stack moderne.

### Pourquoi Electron

- interface moderne et flexible pour un CRM riche ;
- accès natif au système de fichiers Windows ;
- génération PDF intégrée via Chromium ;
- intégration simple de Monaco Editor ;
- packaging Windows éprouvé ;
- stack TypeScript unique, facile à poursuivre avec Codex ;
- pas de serveur web externe à installer ou maintenir.

Le coût en mémoire et la taille de l'exécutable sont acceptables pour un outil métier interne utilisé sur un poste Windows moderne.

## 2. Architecture de processus Electron

### Renderer React

Responsable uniquement de :

- l'interface ;
- la navigation ;
- les formulaires ;
- l'affichage des données ;
- les thèmes ;
- le visualiseur de code.

Le renderer **n'accède jamais directement** à Node.js, SQLite ou au système de fichiers.

### Preload

Expose au renderer une API métier limitée via `contextBridge`.

Ne jamais exposer `ipcRenderer` brut ni une API générique permettant d'exécuter arbitrairement des opérations système.

### Main process

Responsable de :

- SQLite ;
- accès fichiers ;
- sauvegardes/restaurations ;
- génération PDF ;
- dialogues système ;
- import/export ;
- migrations ;
- services métier sensibles.

## 3. Sécurité Electron

Obligatoire :

- `contextIsolation: true` ;
- `nodeIntegration: false` ;
- `sandbox: true` ;
- validation des arguments IPC ;
- aucune navigation arbitraire dans la fenêtre principale ;
- ouverture de nouvelles fenêtres refusée par défaut ;
- aucun secret WordPress/API stocké en clair ;
- code de bibliothèque affiché comme texte et **jamais exécuté automatiquement**.

## 4. Base de données

### Choix

**SQLite locale**, une base principale par workspace.

Accès V1 via le module **`node:sqlite`** fourni par la version Node embarquée dans Electron 44.

`node:sqlite` est encapsulé derrière `DatabaseAdapter` afin qu'un changement de driver reste possible sans réécrire la logique métier si nécessaire.

### Pas d'ORM lourd en V1

La V1 utilise :

- SQL explicite ;
- repositories TypeScript par domaine ;
- requêtes préparées ;
- migrations versionnées.

### Réglages SQLite

À l'ouverture :

- `PRAGMA foreign_keys = ON` ;
- `PRAGMA journal_mode = WAL` ;
- `PRAGMA synchronous = NORMAL` ;
- `PRAGMA busy_timeout = 5000` ;
- transactions pour les opérations multi-tables.

## 5. Types de données

Règles générales :

- identifiants métier : UUID texte générés par l'application ;
- timestamps : ISO 8601 en `TEXT` ;
- dates métier sans heure : `YYYY-MM-DD` ;
- montants : **centimes entiers**, jamais `REAL` ;
- durées : secondes entières ;
- booléens : entier 0/1 ;
- JSON : uniquement pour snapshots, paramètres flexibles ou métadonnées non relationnelles.

## 6. Migrations

- table `schema_migrations` ;
- migrations numérotées et monotones ;
- transaction par migration ;
- sauvegarde automatique de la base existante avant migration ;
- en cas d'échec, rollback de la migration et arrêt du démarrage.

La première migration crée notamment `settings` et `activity_log`.

## 6 bis. Snapshots Bridge et coffre d’assets

La stratégie détaillée pour les snapshots de sites, médias locaux, déduplication SHA-256 et réutilisation en Bibliothèque est définie dans :

- `docs/BRIDGE_SNAPSHOT_ASSET_STORAGE.md`

Cette décision complète les règles générales de stockage : les snapshots Bridge sont historiques et les médias identiques ne doivent pas être dupliqués physiquement à chaque import.

## 7. Stockage des fichiers

### Workspace

Le CRM possède un **dossier racine configurable**.

Valeur par défaut :

`%USERPROFILE%\Documents\AtoumWeb Manager\`

L'utilisateur peut ensuite choisir par exemple :

`D:\AtoumWeb\`

### Localisateur

Un fichier léger dans `userData` mémorise le workspace actif. La base métier et les fichiers restent dans le workspace pour permettre une réinstallation puis une reconnexion au même espace de travail.

### Arborescence de fondation

```text
<workspace>/
├─ data/
│  └─ atoumweb-manager.sqlite
├─ backups/
│  ├─ automatic/
│  ├─ manual/
│  ├─ pre-migration/
│  └─ pre-restore/
├─ clients/
└─ exports/
```

Les fichiers lourds ne sont pas stockés comme blobs dans SQLite sauf nécessité future explicitement validée.

## 8. Sauvegarde et restauration du CRM

Implémenté dès la fondation :

- sauvegarde automatique quotidienne, au maximum une fois par jour ;
- sauvegarde manuelle ;
- sauvegarde avant migration ;
- restauration via sélection explicite d'un fichier SQLite ;
- confirmation avant restauration ;
- restauration appliquée au redémarrage **avant ouverture de la base** ;
- création d'une copie de sécurité cohérente de la base courante dans `backups/pre-restore/` avant remplacement ;
- suppression des éventuels fichiers WAL/SHM de l'ancienne base avant copie de la sauvegarde.

Les sauvegardes des **sites clients** restent un autre concept métier et peuvent se trouver sur serveur, PC, disque externe ou autre emplacement.

## 9. Couche métier

Organisation par domaines, et non par écrans :

- CRM : prospects, clients, contacts ;
- catalogue : services/offres ;
- commercial : devis ;
- projets ;
- temps ;
- interventions/maintenance ;
- fichiers/documents ;
- bibliothèques techniques ;
- facturation ;
- dépenses ;
- sauvegardes ;
- statistiques ;
- recherche ;
- réglages.

Chaque domaine exposera des services/repositories réutilisables par plusieurs écrans.

## 10. Front-end React

### Navigation

Le shell V1 affiche déjà le menu principal dans l'ordre validé.

### État

- données métier demandées via API IPC typée ;
- état UI local via React ;
- pas de store global contenant des copies divergentes des données métier.

### Formulaires

Validation en deux niveaux :

- validation renderer pour l'expérience utilisateur ;
- revalidation main process avant écriture sensible.

### Thèmes

CSS variables + attribut `data-theme` :

- `atoumweb` ;
- `noir` ;
- `blanc`.

Le thème AtoumWeb est la valeur par défaut. La sélection est déjà persistée en base.

## 11. Visualisation de code

**Monaco Editor** est prévu en mode lecture/édition volontaire.

Fonctions V1 :

- coloration syntaxique ;
- numéros de lignes ;
- recherche ;
- copier ;
- agrandir ;
- modifier puis enregistrer une nouvelle version.

Aucun bouton « Exécuter ».

## 12. Documents et PDF

Prévu :

1. rendu HTML dédié ;
2. génération PDF via `webContents.printToPDF()` ;
3. fichier PDF enregistré dans l'arborescence Documents du client ;
4. version finalisée figée en base ;
5. checksum/fichier référencé depuis le document.

## 13. Recherche globale

Le champ de recherche est présent dans le shell de fondation.

Le moteur V1 combinera :

- requêtes structurées SQLite ;
- index dérivé/reconstruisible ;
- noms et métadonnées des ressources/fichiers ;
- FTS5 uniquement si cela apporte un bénéfice réel.

L'index de recherche ne sera jamais source de vérité.

## 14. Journal d'activité

La première migration crée une table `activity_log` destinée au journal centralisé. Les timelines client/projet seront des vues filtrées de ce même journal.

## 15. Packaging Windows

- Electron Forge ;
- Maker Squirrel ;
- build x64 prioritaire ;
- installateur Windows ;
- signature de code possible ultérieurement ;
- mises à jour automatiques hors périmètre du tout premier socle.

## 16. Tests

Fondation :

- test des thèmes/contrats partagés ;
- test du moteur de migrations sur SQLite en mémoire ;
- CI Windows configurée pour installation, typecheck et tests.

Puis V1 :

- repositories ;
- services métier ;
- timer unique ;
- snapshots devis ;
- modèles projets versionnés ;
- archivage/réactivation ;
- sauvegarde/restauration ;
- génération PDF ;
- parcours critiques.

### État de la CI au 13/09/2026

Le workflow est correctement présent, mais les runs observés ont été clôturés avec `runner_id = 0` et `steps = []`. Aucune commande npm, aucun typecheck et aucun test n'ont donc réellement été exécutés par GitHub Actions. La validation doit être faite sur un runner disponible ou sur un PC Windows avant fusion dans `main`.

## 17. Arborescence de code actuelle

```text
src/
├─ main/
│  ├─ database/
│  ├─ ipc.ts
│  ├─ restore.ts
│  ├─ workspace.ts
│  └─ main.ts
├─ preload/
│  └─ preload.ts
├─ renderer/
│  ├─ App.tsx
│  ├─ styles.css
│  └─ main.tsx
└─ shared/
   └─ contracts.ts
```

Elle sera découpée progressivement par domaines lorsque les modules CRM seront implémentés.

## 18. Décisions explicitement écartées en V1

- serveur distant obligatoire ;
- PostgreSQL/MySQL ;
- microservices ;
- exécution de snippets stockés ;
- synchronisation cloud automatique ;
- connexion Abby payante ;
- mots de passe clients stockés dans le CRM ;
- génération automatique d'un module générique AtoumWeb à partir d'un module client.

## 19. Point de vigilance technique

`node:sqlite` est fourni avec Node 24 mais reste classé « release candidate » à la date de cette décision. Pour limiter le risque :

- la version Electron sera verrouillée par le lockfile ;
- toutes les requêtes passent par notre couche d'accès ;
- aucun code React ne dépend directement du driver ;
- si un problème bloquant apparaît, le driver pourra être remplacé derrière `DatabaseAdapter` sans modifier le modèle métier.

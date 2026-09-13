# Architecture technique — AtoumWeb Manager

## Statut

**Architecture V1 décidée le 13/09/2026.**

L'objectif est une application Windows locale, fiable, sans serveur obligatoire, facile à sauvegarder et suffisamment moderne pour proposer les trois thèmes, la recherche globale, le timer, l'édition documentaire et la visualisation de code.

## 1. Stack retenue

### Application bureau

- **Electron 44.x**
- **React 19.3**
- **TypeScript** en mode strict
- **Electron Forge** pour le packaging Windows
- Template Forge **Webpack + TypeScript** pour éviter de dépendre du plugin Vite encore marqué expérimental par Forge

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

Exemples :

- `clients.list()` ;
- `projects.create()` ;
- `files.pick()` ;
- `documents.generatePdf()` ;
- `timer.start()`.

Ne jamais exposer `ipcRenderer` brut ni une API générique permettant d'exécuter arbitrairement des opérations système.

### Main process

Responsable de :

- SQLite ;
- accès fichiers ;
- sauvegardes ;
- génération PDF ;
- dialogues système ;
- ouverture sécurisée de fichiers/liens ;
- import/export ;
- migrations ;
- services métier sensibles.

## 3. Sécurité Electron

Obligatoire :

- `contextIsolation: true` ;
- `nodeIntegration: false` ;
- sandbox activée lorsque compatible ;
- Content Security Policy restrictive ;
- validation des arguments IPC ;
- aucune navigation arbitraire dans la fenêtre principale ;
- aucun secret WordPress/API stocké en clair ;
- code de bibliothèque affiché comme texte et **jamais exécuté automatiquement**.

## 4. Base de données

### Choix

**SQLite locale**, une base principale par installation/workspace.

Accès V1 via le module **`node:sqlite`** fourni par la version Node embarquée dans Electron 44.

Raisons :

- pas de serveur de base de données ;
- fichier facilement sauvegardable/restaurable ;
- transactions solides ;
- très adapté au volume attendu ;
- pas de module natif tiers à recompiler pour Electron.

`node:sqlite` est encapsulé derrière une couche `DatabaseAdapter` / repositories afin qu'un changement de driver reste possible sans réécrire la logique métier si nécessaire.

### Pas d'ORM lourd en V1

La V1 utilise :

- SQL explicite ;
- repositories TypeScript par domaine ;
- requêtes préparées ;
- migrations SQL versionnées.

Objectif : conserver un schéma lisible et éviter une dépendance structurante inutile.

### Réglages SQLite

À l'ouverture :

- `PRAGMA foreign_keys = ON` ;
- mode WAL si compatible ;
- `busy_timeout` raisonnable ;
- transactions pour les opérations multi-tables ;
- intégrité vérifiée lors des sauvegardes/restaurations importantes.

## 5. Types de données

Règles générales :

- identifiants : UUID texte générés par l'application ;
- timestamps : ISO 8601 UTC en `TEXT` ;
- dates métier sans heure : `YYYY-MM-DD` ;
- montants : **centimes entiers**, jamais `REAL` ;
- durées : secondes entières ;
- booléens : entier 0/1 ;
- JSON : uniquement pour snapshots, paramètres flexibles ou métadonnées non relationnelles.

## 6. Migrations

- dossier `src/main/db/migrations/` ;
- fichiers SQL numérotés et immuables après publication ;
- table `schema_migrations` ;
- migration exécutée au démarrage avant ouverture du CRM ;
- **sauvegarde automatique de la base avant toute migration** ;
- en cas d'échec, la migration est annulée et l'application n'ouvre pas la base en écriture.

## 7. Stockage des fichiers

### Workspace

Le CRM possède un **dossier racine configurable**.

Valeur proposée lors de la première installation :

`%USERPROFILE%\Documents\AtoumWeb Manager\`

L'utilisateur peut ensuite choisir par exemple :

`D:\AtoumWeb\`

### Localisateur

Un petit fichier de configuration dans les données applicatives Windows conserve le chemin du workspace actif. La base métier et les fichiers restent dans le workspace afin de pouvoir réinstaller l'application puis reconnecter le même espace de travail.

### Arborescence de base

```text
<workspace>/
├─ data/
│  └─ atoumweb-manager.sqlite
├─ clients/
├─ library/
├─ backups/
│  └─ crm/
├─ exports/
└─ temp/
```

Les arborescences Client/Projet sont ensuite créées selon le cahier des charges.

### Références de fichiers

La base conserve :

- identifiant du stockage ;
- chemin relatif lorsque le fichier est dans le workspace ;
- chemin absolu/URL uniquement pour une ressource externe ;
- nom, type MIME, taille, état ;
- checksum SHA-256 lorsque pertinent.

Le fichier lourd n'est pas dupliqué dans SQLite.

## 8. Sauvegarde du CRM lui-même

Le module `node:sqlite` permet une sauvegarde cohérente d'une base ouverte.

V1 :

- sauvegarde manuelle ;
- sauvegarde automatique quotidienne, au maximum une fois par jour ;
- sauvegarde obligatoire avant migration ;
- destination par défaut : `<workspace>/backups/crm/` ;
- rétention configurable ;
- restauration via sélection explicite d'une sauvegarde et confirmation.

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

Chaque domaine expose des services et repositories réutilisés par plusieurs écrans.

## 10. Front-end React

### Navigation

Navigation SPA locale avec routes explicites correspondant au menu principal.

### État

- état serveur/local métier : cache de requêtes côté renderer ;
- état UI léger : contexte/hooks dédiés ;
- pas de gros store global contenant des copies des données métier.

### Formulaires

Validation partagée :

- validation dans le renderer pour l'expérience utilisateur ;
- revalidation dans le main process avant toute écriture sensible.

### Thèmes

CSS variables + attribut `data-theme` :

- `atoumweb` ;
- `dark` ;
- `light`.

Le thème AtoumWeb est la valeur par défaut.

## 11. Visualisation de code

**Monaco Editor** intégré en mode lecture/édition volontaire.

Fonctions V1 :

- coloration syntaxique ;
- numéros de lignes ;
- recherche ;
- copier ;
- agrandir ;
- modifier puis enregistrer une nouvelle version.

Aucun bouton "Exécuter".

## 12. Documents et PDF

Les documents éditables sont stockés sous forme structurée/HTML dans la base tant qu'ils sont en brouillon.

Lors de la finalisation :

1. rendu HTML dédié ;
2. génération PDF via `webContents.printToPDF()` ;
3. fichier PDF enregistré dans l'arborescence Documents du client ;
4. version finalisée figée en base ;
5. checksum/fichier référencé depuis le document.

Les modèles futurs peuvent utiliser un éditeur par blocs ; ce choix d'éditeur n'est pas bloquant pour le socle V1.

## 13. Recherche globale

La recherche est une fonction transverse prioritaire.

V1 : table d'index **dérivée** `search_documents`, jamais source de vérité, alimentée transactionnellement à partir des entités métier.

Elle contient un texte normalisé pour :

- clients/contacts ;
- prospects ;
- projets ;
- devis ;
- interventions ;
- documents ;
- éléments de bibliothèque ;
- noms et métadonnées des fichiers.

Le volume prévu permet une recherche locale rapide sans moteur externe. Une migration vers FTS5 reste possible plus tard.

## 14. Journal d'activité

Table append-only `activity_events`.

Chaque événement peut référencer directement client/projet/prospect/devis/intervention afin d'afficher rapidement les timelines sans dupliquer les événements.

Les modifications purement techniques internes ne doivent pas polluer la timeline métier.

## 15. Packaging Windows

- Electron Forge ;
- installateur Windows ;
- build x64 prioritaire ;
- application signable plus tard ;
- aucune dépendance à Android Studio/JDK pour AtoumWeb Manager ;
- mises à jour automatiques hors périmètre du tout premier socle, architecture compatible pour ajout ultérieur.

## 16. Tests

Minimum V1 :

- tests unitaires services métier ;
- tests repositories sur SQLite temporaire ;
- tests migrations ;
- tests parcours critiques ;
- test du timer unique ;
- test snapshot devis ;
- test modèles projet versionnés ;
- test archivage/réactivation client ;
- test sauvegarde/restauration DB ;
- test génération PDF ;
- CI GitHub sur pull requests.

## 17. Arborescence de code cible

```text
src/
├─ main/
│  ├─ db/
│  │  ├─ migrations/
│  │  ├─ repositories/
│  │  └─ database.ts
│  ├─ services/
│  ├─ ipc/
│  ├─ files/
│  ├─ documents/
│  └─ main.ts
├─ preload/
│  ├─ api.ts
│  └─ preload.ts
├─ renderer/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ hooks/
│  ├─ themes/
│  └─ main.tsx
└─ shared/
   ├─ contracts/
   ├─ validation/
   └─ types/
```

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

`node:sqlite` est fourni avec Node 24 mais reste classé "release candidate" à la date de cette décision. Pour limiter le risque :

- Electron est verrouillé par le lockfile ;
- toutes les requêtes passent par notre couche repository ;
- aucun code React ne dépend directement du driver ;
- si un problème bloquant apparaît, le driver pourra être remplacé derrière `DatabaseAdapter` sans modifier le modèle métier.

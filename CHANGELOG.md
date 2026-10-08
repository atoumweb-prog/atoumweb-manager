# Changelog — AtoumWeb Manager

Toutes les évolutions significatives d’AtoumWeb Manager sont documentées ici à partir de la phase de fondation.

Le projet suit le versioning sémantique.

## [Unreleased]

### Projet V2 — atelier de production

- Génération du projet depuis les blueprints liés au devis accepté.
- Atelier plein écran : phases repliées, étapes numérotées, progression et glisser-déposer.
- Plan/Fiche redimensionnables, barre latérale escamotable et outils secondaires en fenêtre.
- Timer rattaché à l'étape, notes et actions libres par fiche.
- Validation de fin de phase avec signalement des champs non renseignés et clôture groupée.
- Ressources, bibliothèque technique et suivi du temps accessibles sans quitter Production.
- Pages renommables directement dans l'arbre et undo/redo des modifications courantes.
- Aide contextuelle désactivable dans Réglages.
- Migration 30 : coffre d'accès projet/étape ; secrets chiffrés via Electron `safeStorage`.
- Harmonisation transverse des anciens écrans : contrôles, boutons, onglets, focus, débordements et lisibilité.


### Stabilisation commerciale

- Ajout de la migration 19 avec conservation des dossiers existants.
- Ajout de coordonnées multiples, qualification prospect, température neutre et étape « Devis à envoyer ».
- Ajout des relances structurées et récurrentes, de la qualité de relation client et des alertes de conservation.
- Ajout du dossier documentaire client avec fichiers externes à SQLite, archivage et suppression confirmée.
- Correction des besoins temporaires vides et du renderer absent des paquets Windows.

### Préparé

- Architecture V1 Electron / React / TypeScript / SQLite.
- Cahier des charges fonctionnel V1.
- Modèle de données V1.
- Roadmap complète Phases 1 à 7.
- Plan d’exécution Codex.

### Fondation en cours

- Shell applicatif Electron/React.
- Workspace local configurable.
- SQLite et migrations.
- Sauvegardes CRM quotidiennes/manuelles/pré-migration.
- Restauration sécurisée avec sauvegarde `pre-restore`.
- Thèmes AtoumWeb / Noir / Blanc.
- Navigation principale V1.

## Versions futures prévues

- `1.0.0-rc.1` — première Release Candidate complète.
- `1.0.0` — première version stable après validation globale.

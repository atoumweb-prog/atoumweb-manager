# Architecture technique — AtoumWeb Manager

## Statut

**À définir avant le premier développement applicatif.**

Ce document sera complété une fois les choix techniques validés. Il ne doit pas être considéré comme une architecture figée tant que les décisions ci-dessous ne sont pas renseignées.

## Contraintes fonctionnelles déjà acquises

- application destinée à un usage quotidien AtoumWeb ;
- stockage local fiable et sauvegardable ;
- gestion de nombreux liens entre clients, projets, tâches, temps, documents et fichiers ;
- fichiers lourds référencés sur disque plutôt que stockés systématiquement dans la base ;
- code de bibliothèque visualisable sans exécution ;
- trois thèmes : AtoumWeb, Noir, Blanc ;
- recherche globale ;
- génération de PDF/documents ;
- exports CSV/Excel ;
- fonctionnement possible sans API Abby payante ;
- architecture évolutive pour ajouter plus tard certaines automatisations de sauvegarde ou connecteurs.

## Décisions à prendre

### Application

- [ ] Technologie interface bureau
- [ ] Packaging / installation Windows
- [ ] Stratégie de mise à jour

### Données

- [ ] Base de données locale
- [ ] ORM / couche d’accès
- [ ] Migrations de schéma
- [ ] Stratégie de sauvegarde/restauration de la base

### Fichiers

- [ ] Dossier racine AtoumWeb configurable
- [ ] Convention d’arborescence clients/projets
- [ ] Références fichiers dans la base
- [ ] Gestion des fichiers déplacés/manquants

### Recherche

- [ ] Recherche structurée dans la base
- [ ] Recherche dans noms/métadonnées des fichiers
- [ ] Recherche plein texte si nécessaire

### Documents

- [ ] Génération PDF
- [ ] Modèles éditables
- [ ] Gestion des variables
- [ ] Archivage des versions finalisées

### Bibliothèque technique

- [ ] Visualiseur/éditeur de code
- [ ] Coloration syntaxique
- [ ] Versionnement local des éléments
- [ ] Aperçus/captures pour modules visuels

### Tests et qualité

- [ ] Tests unitaires
- [ ] Tests base de données
- [ ] Tests des parcours critiques
- [ ] CI GitHub

## Règle

Toute décision technique structurante doit être documentée ici et résumée dans `PROJECT_STATUS.md`.

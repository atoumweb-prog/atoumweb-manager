# Plan d’exécution Codex — AtoumWeb Manager

## Priorité courante — 22/09/2026

Avant d'appliquer l'ordre historique ci-dessous, lire `docs/HANDOFF_CODEX_MSI.md`.

Le chantier actif est `feature/project-blueprints-v1` / PR #73. Ne pas repartir de `main`, des anciennes branches Phase 1/2/3/4 ou de la branche Phase 7 sans instruction explicite.

Tant que Projet V2 n'est pas recetté :
1. synchroniser la branche active par `git pull --ff-only` ;
2. exécuter typecheck/tests/package ;
3. corriger uniquement les écarts du chantier courant ;
4. mettre à jour `PROJECT_STATUS.md` si l'état change ;
5. ne pas lancer de refonte parallèle.

La branche `feature/phase-7-analytics-v1` est conservée mais suspendue jusqu'à intégration avec Projet V2.


Ce fichier indique l’ordre d’exécution recommandé pour Codex. Lire également `AGENTS.md`, `PROJECT_STATUS.md` et le document de phase concerné avant tout changement.

## Règle générale

- `main` reste stable.
- Une branche par chantier/issue significative.
- Une PR petite et cohérente par sous-chantier.
- Mettre à jour `PROJECT_STATUS.md` après chaque étape significative.
- Ne jamais sauter une dépendance pour « aller plus vite ».
- Ne pas modifier le périmètre fonctionnel sans le documenter.

## Gate 0 — Fondation

Issue : #2 — PR : #3.

Avant toute Phase 1 :

```bash
npm install
npm run typecheck
npm test
npm start
npm run package
```

Vérifier aussi :

- création réelle du workspace ;
- création SQLite et migrations ;
- sauvegarde manuelle ;
- restauration avec `pre-restore` ;
- trois thèmes ;
- packaging Windows.

Le `package-lock.json` généré doit être versionné.

## Phase 1 — CRM

Ordre :

`#5 → #6/#7/#8 → #9`

Ne commencer que lorsque Gate 0 est fusionné.

## Phase 2 — Commercial

Ordre :

`#11 → #12 → #13/#14 → #15`

Dépend de Phase 1.

## Phase 3 — Projets & Production

Ordre :

`#17 → #18 → #19/#20 → #21/#22 → #23`

Dépend de Phase 2.

## Phase 4 — Opérations

Ordre :

`#25 → #26/#27 → #28/#29 → #30 → #31`

Dépend notamment de Clients, Projets et Timer.

## Phase 5 — Administration & Finance

Ordre :

`#33 → #34/#35 → #36/#37/#38 → #39`

Les flux `billing_items` issus des phases antérieures doivent être réutilisés, jamais dupliqués.

## Phase 6 — Référentiels & Continuité

Ordre :

`#41 → #42/#43 → #44/#45/#46 → #47`

Ne jamais automatiser la généralisation d’un composant client ni prétendre qu’une sauvegarde serveur est locale.

## Phase 7 — Statistiques & Release

Ordre :

`#49 → #50/#51/#52 → #53/#54 → #55 → #56 → #57`

Les statistiques doivent rester dérivées et toutes les définitions de KPI doivent être testées avec des données connues.

## Discipline de PR

Chaque PR doit préciser :

- issue liée ;
- objectif ;
- migrations éventuelles ;
- tests ajoutés ;
- tests exécutés ;
- impacts sur données/historique ;
- captures UI si pertinent ;
- points restant à faire.

## Avant fusion

- typecheck vert ;
- tests verts ;
- migration testée si applicable ;
- pas de duplication de données métier ;
- pas de secret ;
- compatibilité trois thèmes si UI ;
- `PROJECT_STATUS.md` mis à jour.

## Fin de V1

La version `1.0.0` n’est créée qu’après validation de #57 et après test du parcours complet sur Windows.

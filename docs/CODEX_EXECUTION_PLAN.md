> ## ⚠️ ÉTAT ACTUEL — 29/09/2026 — À LIRE AVANT TOUT
>
> Ce bloc **remplace les anciennes consignes de branche/PR mentionnées plus bas** pour la reprise actuelle. L'historique est conservé volontairement.
>
> **Chantier actif : clôture du Lot 6B — Sites & pages / composition de Page.**
>
> - Branche de stabilisation : `wip/codex-6b-ui-fix`
> - Dernier commit fonctionnel inclus dans la validation 339/339 : `41719b006ea42051ee638607a60d9888535a4baf`
> - Le HEAD de branche peut être plus récent à cause des commits documentaires : **toujours exécuter `git rev-parse HEAD` avant intervention**.
> - Branche canonique cible : `feature/project-page-compositions-v1`
> - Base canonique : `39315436376ba81470ed5fc0cbdad92c457ce553`
> - PR de réintégration : **#75**, ouverte en **draft**
> - État GitHub PR #75 : **mergeable / clean**
> - **Ne pas fusionner vers `main`**.
>
> **Validation acquise du Lot 6B :**
>
> - recette visuelle réelle validée ;
> - `npm run typecheck` : vert ;
> - harness UI Electron : **65/65** ;
> - suite complète : **53 fichiers / 339 tests, 339/339 réussis** ;
> - `npm run package` : réussi, package **win32 x64** ;
> - migration courante : **49**, aucune nouvelle migration introduite par la stabilisation UX ;
> - aucun changement Bridge pendant la stabilisation 6B.
>
> **Trois corrections transverses intégrées après la première suite complète :**
>
> 1. test legacy des migrations rendu dynamique jusqu'à l'état courant au lieu d'être figé à 38 ;
> 2. test Workflow aligné avec le Builder CGV structuré : `specialTerms` du devis n'est plus supposé contenir automatiquement les conditions catalogue ;
> 3. `DemoService` suit désormais `quote_contract_clauses` pour permettre une purge correcte des scénarios de démonstration.
>
> **Ce que Codex ne doit pas refaire :**
>
> - ne pas reprendre la recette UX 6B depuis zéro ;
> - ne pas modifier les replis, l'atelier Réglages / Code ou le grand écran 75/25 sauf régression démontrée ;
> - ne pas ajouter de migration ;
> - ne pas toucher au dépôt Bridge pour clôturer le 6B ;
> - ne pas repartir de `main`, de la PR #73 ou d'une ancienne branche historique.
>
> **Dernière étape de clôture :**
>
> 1. vérifier `git status -sb` sur MSI ;
> 2. si le workspace est propre, intégrer **PR #75** dans `feature/project-page-compositions-v1` uniquement sur demande explicite ;
> 3. après intégration, rerun minimal : `npm run typecheck` + `node scripts/check-project-composition-ui.cjs` attendu **65/65** ;
> 4. marquer ensuite le Lot 6B clos dans `PROJECT_STATUS.md` et `docs/MANAGER_BRIDGE_ROADMAP.md`.
>
> **Après clôture seulement :** reprendre la feuille de route Manager ↔ Bridge avec le Lot 7 (Site / préparation Bridge), puis Lot 8 (retour d'occurrences), puis Lot 9 (assemblage multi-pages / livraison), uniquement après autorisation explicite.
>
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

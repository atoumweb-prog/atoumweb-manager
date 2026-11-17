# Passation de la refonte du Manager (14/11/2026, après P1)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d'entrée** `PASSATION-2026-11-14-apres-R9.md`, dont les sections 2 (documents), 5 (données de test), 6 (outils et commandes), 7 (pièges) et 8 (façon de travailler, cycle d'un lot) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n'est poussé**, aucune PR. Derniers commits : R9 `d06555ae`, R8 `0d234a59`, R7 `ce0ef4d6`… **P1 n'est pas encore commité** (voir « Prochaine action »).
- **Passe de finitions** (décidée par Carlos le 14/11/2026) : fiche `docs/refonte/plans/2026-11-14-passe-finitions-design.md` avec les **dix décisions de Carlos** consignées. Ordre : **P1 Recettes (fait), P2 Nettoyage, P3 Prospection / Devis / Projets, P4 Accueil / Gestion / Ressources / Réglages, P6 États rares, P5 Petits textes.**
- **P1 exécuté** : journal `docs/refonte/plans/2026-11-14-p1-recettes-journal.md`. 15 recettes rouges au départ : 9 vertes, 2 retirées, 4 rouges (3 sur un défaut du produit mesuré F43, F45, F46 ; 1 à décider, F47).
- **Preuves de P1** : `npm run typecheck` propre ; `node scripts/run-tests.cjs` 305 fichiers, 2 471 tests, 1 ignoré ; typographie 72, états 18/18, garde Abby 25, interface réelle 857 ; `check-ux-v2-lot10-ui` 59 ; budget petits textes 625 et `!important` 86 inchangés ; empreinte de la préproduction inchangée.

## 2. Prochaine action concrète

1. **Recette de Carlos sur le journal de P1** (pas de captures : aucun écran ne change).
2. **F47 reportée (décision de Carlos du 14/11/2026)** : `check-ux-v2-03e-directory` reste rouge et documentée ; à réécrire (long parcours Prospect, Devis, Projet de `integration-02-03-scenarios.cjs`) après le diagnostic de F44.
3. **Commit local de P1 : autorisé par Carlos le 14/11/2026** (un seul, sans push).
4. Mettre à jour la mémoire (`projet-refonte-passation-r2.md`) pour pointer vers ce fichier.
5. **P2 Nettoyage** : fiche courte à faire valider. Décisions déjà prises : retirer les **11 orphelins** (F10, `WorkflowDashboard.tsx` compris) **après preuve** (recherche des importations, build, tests verts), listés dans le lot ; mineurs M4 à M9 (F11) ; `-wal` et `-shm` vides (F29, information).

## 3. Les dix décisions de Carlos du 14/11/2026 (ne pas les rouvrir)

Ordre P1, P2, P3, P4, P6, P5 ; F5 retirer l'obsolète ; F10 retirer les 11 orphelins après preuve ; **F20 filtre par projet de la page Interventions : oui, dans P3** ; F31 le bouton de repli de la Bibliothèque **reste dans l'en-tête** ; F37 « Pilotage » d'Offres **reste non listé** ; **F18 onglet « Sites et pages » gardé avec un vrai état vide** ; **F40 Apparence et Navigation remises côte à côte dans Réglages (P4)** ; F27 unifier les chiffres clés **dans P5** ; **budget P5 : zéro** (plancher de 14 px absolu).

## 4. Défauts du produit en attente (non corrigés)

| Registre | Défaut | À traiter dans |
|---|---|---|
| F43 | Accueil, fenêtre 497 px utiles : 4 px de défilement horizontal | P4 (Accueil) |
| F44 | Après le choix d'un résultat de recherche, le focus reste dans le champ « Recherche globale » | à diagnostiquer, probablement P3 ou P4 |
| F45 | Table de Prospection à 1440 px zoom 150 % : 15 px de débordement | P3 |
| F46 | Fiche prospect à 1280 × 720 zoom 150 % : zone de contenu de 33 px | P3 |
| F47 | Recette de parcours `check-ux-v2-03e-directory` à réécrire ou reporter | décision de Carlos |
| F48 | Deux points « non vérifié, à réparer » de `check-contract-library-ui` | P6 |

Les recettes concernées restent rouges **volontairement** tant que le défaut n'est pas traité : `check-shell-home-simplification` (F43), `--ux-lot` (F45), `--desk` (F46), `check-ux-v2-03e-directory` (F44, F47). Elles passent au vert sans toucher leur contenu quand le défaut est corrigé.

## 5. Ce qu'on a appris pendant P1 (à ajouter aux pièges de la passation d'après R9)

- **Toute attente périmée en cache une autre** : une recette qui échoue sur un contrôle en masque souvent plusieurs derrière. Rendre **temporairement** un contrôle non bloquant dans une copie de travail (puis restaurer strict) montre le reste ; ne jamais le laisser.
- **Sondes jetables** : copier le scénario en affichant la mesure au lieu d'échouer, dans `outputs/` (ignoré par git), supprimer ensuite. Un lanceur copié hors de `scripts/` perd `__dirname` : préfixer `var __dirname='…'` (pas `const`).
- **`git checkout -- fichier`** restaure une fixture modifiée par une sonde ; il faut qu'elle n'ait eu aucune autre modification voulue (`git diff` avant).
- **Menus « Plus » (`MoreMenu`)** : les actions rangées sont des `button[role=menuitem]` dans un `<ul role=menu>` monté seulement quand le menu est ouvert ; une page peut contenir **deux** menus dont un dans un volet masqué : choisir le déclencheur **visible**.
- **En-têtes de section de R3** (`NeedsSectionHeader`) : bouton « flèche + titre », donc `textContent.trim()===titre` échoue ; utiliser `.needs-section-trigger` + `.prospect-work-accordion-title` et ne cliquer que si `aria-expanded!=='true'`.
- **Garde « modifications non enregistrées »** : tantôt boîte native (`dialog.showMessageBoxSync`, comptée par les recettes), tantôt boîte **dans la page** (`UnsavedSaveDialog` : `dialog[open].ot-dialog`, « Poursuivre l'édition », « Abandonner les modifications ») : vérifier laquelle avant d'écrire une attente.
- **Fins de ligne** : le dépôt est en `autocrlf` (blobs LF, copies de travail CRLF ou LF selon l'outil) ; `git diff --stat` reste propre ; ne pas convertir en masse.
- `check-ux-v2-02c` refuse de tourner avec des changements non commités.

## 6. Mémoire

Après le commit de P1, mettre à jour la ligne « Passation refonte, état R9 » du `MEMORY.md` pour pointer vers ce fichier.

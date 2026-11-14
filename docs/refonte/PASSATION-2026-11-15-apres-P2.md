# Passation de la refonte du Manager (15/11/2026, après P2)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-14-apres-P1.md`, dont les sections 3 (dix décisions de Carlos), 4 (défauts du produit en attente) et 5 (pièges appris pendant P1) restent valables, ainsi que `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot). Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P2 (voir `git log --oneline -3`), P1 `ebb6c4e1`, R9 `d06555ae`.
- **Passe de finitions** (fiche `docs/refonte/plans/2026-11-14-passe-finitions-design.md`) : ordre **P1 Recettes (fait), P2 Nettoyage (fait), P3 Prospection / Devis / Projets, P4 Accueil / Gestion / Ressources / Réglages, P6 États rares, P5 Petits textes**, puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P2** : typecheck propre ; 305 fichiers, 2 471 tests ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; budget petits textes **617** (jamais plus) ; `!important` ≤ 86.

## 2. Prochaine action concrète

1. **P3** : fiche courte à faire valider (skills `atoumweb-design`, `superpowers:brainstorming`). Contenu attendu : F1, F2, F3, F4 (fiche prospect et assistant de devis), F13 à F18 (plan de projet, onglet Sites et pages avec **état vide**, décision 7), **F20 filtre par projet de la page Interventions (décision 4)**, M8 (en-têtes de Prospection en 14 px gras 600), et les défauts du produit **F45** (table de Prospection à 1440 px zoom 150 %) et **F46** (fiche prospect à 1280 × 720 zoom 150 %, 33 px de zone de contenu) ; **F44** (focus après la recherche globale) à diagnostiquer d’abord ; **F47** (recette de parcours `03e`) à réécrire après F44. Les recettes `--ux-lot`, `--desk` et `check-ux-v2-03e-directory` passent au vert quand ces défauts sont corrigés.
2. Captures avant / après obligatoires pour P3 (les écrans changent) : outils dans `C:\DEV\Livrables\Cadrage-parcours\outils-audit\`, voir la passation d’après R9, section 6.
3. P6 prendra F43 (Accueil en fenêtre étroite, ou P4), F48 et les bancs d’atelier F49 à F51 (comme P1).

## 3. Ce qu’on a appris pendant P2 (à ajouter aux pièges)

- **Le registre peut se tromper** : F10 annonçait 11 orphelins dont 4 « ateliers ». Toujours refaire la recherche de références dans `src`, `scripts`, `package.json`, `.github` et les tests avant de retirer, et regarder `scripts/convergence-state.json` (suite de convergence) : un script listé dépend de ce qu’il importe.
- **Retirer un script** impose de retirer son entrée de `convergence-state.json` (sinon `check-convergence-native.cjs` casse) ; faire l’édition avec un script par repères et vérifier que le JSON reste valide.
- **`css-prune.cjs`** retire sélecteurs et règles mais peut aussi **compacter des lignes vides** du fichier (4 lignes vides dans `styles.css`) : relire le `git diff`.
- **Retirer un composant peut laisser du code utilisé seulement par son test** (`catalogSections.ts` après `CatalogOverview`) : le noter, ne pas le retirer sans décision.
- **Un test de garde se prouve par une mutation temporaire** (ajouter la faute, voir l’échec pour la bonne raison, restaurer et vérifier que `git diff` est vide).
- Le nombre de tests doit se justifier ligne à ligne (−4 retirés, +4 ajoutés = 2 471 inchangé ici).

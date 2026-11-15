# Passation de la refonte du Manager (15/11/2026, après P3a)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P2.md`, dont les sections 3 (pièges appris en P2) et la liste des décisions de `PASSATION-2026-11-14-apres-P1.md` (dix décisions de Carlos) restent valables, ainsi que `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot). Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P3a (voir `git log --oneline -4`), P2 `f037954e`, P1 `ebb6c4e1`, R9 `d06555ae`.
- **Passe de finitions** : P1 Recettes (fait), P2 Nettoyage (fait), **P3a Prospection et Devis (fait)**, **P3b Projets (à faire)**, P4 Accueil / Gestion / Ressources / Réglages, P6 États rares, P5 Petits textes ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P3a** : typecheck propre ; 306 fichiers, 2 487 tests ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `--desk` 20 et `--ux-lot` 26 verts ; budget petits textes **617**.

## 2. Prochaine action concrète

1. **P3b Projets** : fiche courte à faire valider (skills `atoumweb-design`, `superpowers:brainstorming`) : F13 (note « Plan issu du modèle d’origine » : la rendre repliable ou la masquer quand elle n’apprend rien, elle n’apparaît que sur les projets sans clé sémantique), F14 (plan à 429 px, objectif 420), F15 (petits traits qui dépassent à droite des lignes de phase, vus sur la capture de la landing page), F16 (ligne « En ce moment » à regarder avec tâches bloquées, en attente client, prérequis manquants : jeu de cas de figure `projets-cas-de-figure.json`), F17 (noms de tâche sur deux lignes), **F18 (onglet Sites et pages : vrai état vide, décision 7)**, **F20 (filtre par projet de la page Interventions : oui, décision 4)**. Captures avant / après dans `captures-p3b\` avec un outil dérivé d’`audit-p3a.cjs` et `audit-projets.cjs`.
2. Les défauts F43 (Accueil, 4 px en fenêtre étroite), F47 (recette de parcours `03e` à réécrire), F48 à F51 restent ouverts pour P4 et P6.

## 3. Ce qu’on a appris pendant P3a (à ajouter aux pièges)

- **Une capture trouve ce qu’un test ne voit pas** : mon correctif `nowrap` sur les onglets a élargi le cadre d’une fiche en superposition (largeur « naturelle » du parent gonflée par la rangée) : seule la mesure sur capture (924 px pour 853) l’a montré. Les rangées qui défilent doivent porter `contain: inline-size`.
- **Un `overflow-y:auto` impose `overflow-x:auto`** : tout conteneur qui devient la zone de défilement change le comportement de ses enfants.
- **Ordre de deux `requestAnimationFrame`** : ne jamais reprendre un focus déjà posé ailleurs ; décider avec une fonction pure testable (`searchFocus.ts`).
- **Outil de capture `audit-p3a.cjs`** (hors dépôt, `outils-audit\`) : dérivé d’`audit-reglages.cjs` ; il mesure aussi la table (1440 px zoom 150 %) et les largeurs de la fiche étroite ; lancer avec `AUDIT_ALLOW_UNVERIFIED=1` et `AUDIT_OUT`.
- **Un test de source trop large échoue pour de mauvaises raisons** (déjà un `!important` ou `position:sticky` ailleurs dans la feuille) : cibler la règle précise.

# Passation de la refonte du Manager (15/11/2026, après P3b)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P3a.md`, dont la section 3 (pièges appris en P3a), les pièges de `PASSATION-2026-11-15-apres-P2.md`, les dix décisions de `PASSATION-2026-11-14-apres-P1.md` et `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P3b (voir `git log --oneline -5`), P3a `79f7c3e7`, P2 `f037954e`, P1 `ebb6c4e1`, R9 `d06555ae`.
- **Passe de finitions** : P1 Recettes, P2 Nettoyage, P3a Prospection et Devis, **P3b Projets (faits)** ; **à faire** : P4 Accueil / Gestion / Ressources / Réglages, P6 États rares, P5 Petits textes ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P3b** : typecheck propre ; 309 fichiers, 2 500 tests ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `check-project-operations-link` 17 ; budget petits textes **617**.

## 2. Prochaine action concrète

1. **P4** : fiche courte à faire valider (skills `atoumweb-design`, `superpowers:brainstorming`). Entrées du registre : **F43** (Accueil, 4 px de défilement en fenêtre étroite), **F23** (liste « À faire maintenant » sur la demi-largeur), **F25** (action principale sur une 2e ligne : Temps, Documents), **F28** (messages vides locaux de Dépenses et Facturation), **F33** (rail coupé en bas), **F35** (Statistiques), **F38** (Avant / après intervention), **F40 Apparence et Navigation côte à côte (décision 8)**. F31 et F37 sont tranchées (rien à faire). Penser à couper P4 si la recette sur captures est trop large (comme P3).
2. Les recettes encore rouges sont toutes documentées : `check-shell-home-simplification` (F43), `check-ux-v2-03e-directory` (F47). F48 à F51 restent pour P6.

## 3. Ce qu’on a appris pendant P3b (à ajouter aux pièges)

- **Un test ancien peut figer l’ancien texte** : `projectR5aWiring.test.ts` exigeait la phrase de la note supprimée ; la suite complète l’a trouvé, pas la recherche ciblée. Toujours relancer la suite complète avant de dire « vert ».
- **Une mesure sur la copie jetable ne ment pas, une capture seule si** : le registre disait « la note sur les trois projets », une capture R5 ne la montrait pas ; la mesure du jour (`note` présente ×3) et les captures « après » (« plan issu du modèle d’origine » dans les trois lignes de plan) tranchent.
- **États forcés pour un « à voir »** : l’outil de capture modifie la **copie jetable** (`db.projects.updateProjectNode(id, {status})`) pour montrer un état qu’aucun projet de test n’a ; la préproduction reste intacte (empreinte vérifiée).
- **Requête de conteneur** (`container-type: inline-size` + `@container`) : bonne réponse quand la place dépend du panneau et non de la fenêtre (la ligne de phase masquait sa barre sous 1 250 px de fenêtre mais pas selon son panneau).
- **Navigation entre pages avec état** : événement `window` + `requestPage` (garde des brouillons) + état dans `App.tsx` remis à zéro quand `activePage` change ; l’état ne vit que sur la page concernée.
- **Outil de capture `audit-p3b.cjs`** (hors dépôt) : dérivé d’`audit-p3a.cjs` ; mesure début du plan, noms coupés, éléments qui dépassent d’une phase ; étapes « états forcés » et « page Interventions filtrée ».

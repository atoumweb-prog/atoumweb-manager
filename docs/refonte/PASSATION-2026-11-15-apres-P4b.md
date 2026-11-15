# Passation de la refonte du Manager (15/11/2026, après P4b)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P4a.md`, dont les pièges, ceux de `PASSATION-2026-11-15-apres-P3b.md`, `-apres-P3a.md`, `-apres-P2.md`, les dix décisions de `PASSATION-2026-11-14-apres-P1.md` et `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P4b (voir `git log --oneline -5`), P4a `45259baf`, P3b `22426028`, P3a `79f7c3e7`, P2 `f037954e`, P1 `ebb6c4e1`.
- **Passe de finitions** : P1, P2, P3a, P3b, P4a, **P4b (faits)** ; **à faire** : **P6 États rares** (F47, F48, F49 à F51 et les « à voir »), **P5 Petits textes** (budget visé à zéro, F27 chiffres clés unifiés) ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P4b** : typecheck propre ; 311 fichiers passés + 1 ignoré, 2 532 tests ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; budget petits textes 617 ; `!important` ≤ 86.

## 2. Prochaine action concrète

1. **P6 États rares** : fiche courte à faire valider (skills `atoumweb-design`, `superpowers:brainstorming`), puis plan, puis exécution. Entrées : F47 (réécrire le long parcours Prospect, Devis, Projet de `scripts/fixtures/integration-02-03-scenarios.cjs`, recette `check-ux-v2-03e-directory` : elle s’arrête sur `.prospect-desk-overlay .start-qualification-button`), F48 (deux contrôles sautés de `check-contract-library-ui`), F49 à F51 (bancs d’atelier `01b`, `01d`, `01f` rouges, causes non diagnostiquées), F7, F19, F30, F36, F41, F42 (états jamais vus : erreurs, textes longs, fenêtre étroite, clavier, Sites rempli, onglets de Réglages, confirmations).
2. **P5** ensuite : 617 déclarations sous 14 px à descendre à zéro, fichier par fichier ; F27 ; F24, F26, F34 (`AtoumWebLibraryPage.css` 53, sur-titres de la Bibliothèque), le reste de F35 (18 déclarations) et de F40 (`.muted`, `styles.css`).
3. À surveiller : `check-home-shell-lot1` a échoué une fois dans une chaîne (« Active timer dialog preserves timer and exclusive layer ») puis donné 96 deux fois relancée seule ; cause non établie, à comparer au dernier commit si elle revient.

## 3. Ce qu’on a appris pendant P4b (à ajouter aux pièges)

- **Une règle de composant partagé peut être battue par une règle plus ancienne sur le même élément** : l’indice `.aw-keyfigure-cue` (un `span`) a hérité des 22 px de `.aw-keyfigure > span` ; seule la capture l’a montré. Écrire les nouvelles classes avec le même niveau de précision (`.aw-keyfigure > .aw-keyfigure-cue`) et regarder le rendu.
- **Une largeur fixée peut couper un texte** : 190 px suffisait pour « Tous les clients » mais coupait « Facturable + non facturable » ; relire les captures de chaque liste après une largeur fixée.
- **Un composant lit mieux ses enfants que trois blocs répétés** : `KpiGroup` lit la prop `comparison` de ses `Kpi` (`Children.toArray`, `cloneElement`) pour décider de la ligne commune sans toucher aux appels existants.
- **Un script d’édition avec garde de comptage** (`attendu 4 blocs, trouvé …`) a évité d’écrire un fichier à moitié transformé ; le refus d’écrire est le bon comportement.
- **`@container` sur la grille de Réglages** : `container-type: inline-size` sur `.settings-grid`, règles `:has(+ …)` et `+` pour que deux sections qui se suivent seulement passent en colonnes (la recherche peut en masquer une).
- **Outils de capture** (hors dépôt, `outils-audit\`) : `gen-audit-p4a.cjs [middle] [sortie]` fabrique un outil depuis `audit-p3b.cjs` ; fichiers d’étapes `p4a-middle*.txt`, `p4b-middle.txt` ; scripts d’édition modèles : `outils-edition\exemples\edit-p4b-statistics.cjs` et `edit-p4b-settings.cjs`.

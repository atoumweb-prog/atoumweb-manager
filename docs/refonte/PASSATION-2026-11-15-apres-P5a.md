# Passation de la refonte du Manager (15/11/2026, après P5a)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P6b.md`, dont les pièges et ceux des passations antérieures (P6a, P4b, P4a, P3b, P3a, P2, P1, R9) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P5a (voir `git log --oneline -5`), P6b `71726ffa`, P6a `67101d76`.
- **Passe de finitions** : P1 à P4b, P6a, P6b, **P5a (faits)** ; **à faire** : **P5b**, **P5c**, **P5d** (fiche validée `docs/refonte/plans/2026-11-15-p5-petits-textes-design.md`) ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Budget des petits textes : 570** (617 avant P5a). `!important` : 86.
- Recettes rouges connues, toutes antérieures : F66 (`convergence-visual-consistency`), F67 (`catalog-identity-ui`), F68 (`catalog-label-layout`).

## 2. Prochaine action concrète

1. **P5b** (plan à écrire puis exécuter sans résumé préalable, accord de Carlos du 15/11/2026) : Statistiques (32 textes visibles : `StatisticsPage.css`), Annuaire (33 : pastilles de relation, initiales d’avatar), Sites (31 : `BridgeSitesPage.css` 42 déclarations), Projets liste (20 : cellules à 12 px, pourcentages à 10 px), Prospection (18 : initiales, compteurs à 8 px), Clients (10 : statut à 12 px), Temps (8 : chiffres du cadran à 8 px, à retirer en gardant les traits), en-tête (pastille du nombre d’alertes, symbole pause) ; « MANAGER » du logo non touché. Avatars et pastille agrandis pour tenir 14 px.
2. Ensuite P5c (fiches et reste jusqu’à zéro, test de budget à zéro), P5d (F27, fiche courte propre).
3. Décisions de Carlos en attente : F55 à F63 ; à diagnostiquer : F66 à F68.

## 3. Ce qu’on a appris pendant P5a

- **Mesurer le rendu, pas le code** : `outils-audit\p5-releve.txt` compte les textes visibles calculés sous 14 px page par page ; `p5a-sonde.txt` liste les règles qui portent un `font-size` pour chaque petit texte (attention : il affiche les deux dernières règles dans l’ordre des feuilles, pas forcément celle qui gagne ; `small-fonts.cjs` sur les fichiers du lot tranche).
- **`css-raise-font.cjs`** prend les sélecteurs **un par un**, écrits comme `small-fonts.cjs` les affiche (`header>span` sans espaces) ; il retire aussi capitales et espacement des lettres ; relire `git diff` (seules des lignes `font-size` doivent changer).
- **Budget** : `gen-font-baseline.cjs` régénère à la baisse ; vérifier dans `git diff` du JSON que tout baisse.
- **Recettes du catalogue** : `check-catalog-label-layout` et `check-convergence-visual-consistency` prennent `<base dans TEMP> <rapport neuf>` (une copie de la base de test dans le dossier temporaire convient, empreinte de la source vérifiée).
- **Une mesure trouve un défaut antérieur** (fiche d’article à 507 px) : le corriger s’il est dans le périmètre de l’écran du lot, test d’abord.

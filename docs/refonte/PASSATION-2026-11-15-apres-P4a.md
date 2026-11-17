# Passation de la refonte du Manager (15/11/2026, après P4a)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P3b.md`, dont les pièges, ceux de `PASSATION-2026-11-15-apres-P3a.md` et `-apres-P2.md`, les dix décisions de `PASSATION-2026-11-14-apres-P1.md` et `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé**, aucune PR. Derniers commits : P4a (voir `git log --oneline -5`), P3b `22426028`, P3a `79f7c3e7`, P2 `f037954e`, P1 `ebb6c4e1`.
- **Passe de finitions** : P1, P2, P3a, P3b, **P4a (faits)** ; **à faire** : **P4b Ressources et Réglages** (F35, F38, F40), P6 États rares (F47, F48, F49 à F51), P5 Petits textes ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P4a** : typecheck propre ; 310 fichiers passés + 1 ignoré, 2 511 tests ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `check-shell-home-simplification` vert (836) ; budget petits textes 617.

## 2. Prochaine action concrète

1. **P4b** : le plan reste à écrire à partir de la fiche validée `docs/refonte/plans/2026-11-15-p4-accueil-gestion-ressources-reglages-design.md` (décisions déjà prises, ne pas les rouvrir) :
   - **F35 Statistiques** : une ligne « Pas de période précédente à comparer » quand **toutes** les cartes d’une vue disent « Nouveau sur la période » ; indice visible (chevron, « Voir le détail ») sur les cartes cliquables ; la vraie comparaison reste quand elle existe. Test d’abord sur `statistics/statisticsComparison.ts`.
   - **F38 Sauvegardes** : retirer les sur-titres « Prévention opérationnelle », « Vigilance métier », « Nouvel enregistrement », « Historique » (`BusinessBackupsPage.tsx`, lignes 355, 404, 440, 458) et ranger le bloc comme les autres pages Ressources.
   - **F40 Réglages** : Apparence et Navigation côte à côte (deux colonnes vers 1 100 px de contenu, une colonne en dessous), légende « Informations de l’entreprise » retirée ; les autres sections restent pleine largeur. Ne pas toucher `.muted` ni `styles.css` (P5).
2. **À montrer à Carlos en début de P4b** : la barre d’outils de Temps (141 px à 1510 px, un filtre sur une troisième ligne) ; il peut vouloir revenir aux deux rangées fixes (Temps 96 px mais Dépenses, Facturation, Interventions à 99 px) ou ranger un filtre. Voir le plan P4a, « Révisions », Ruling 2.
3. Recettes rouges volontaires restantes : `check-ux-v2-03e-directory` (F47). F48 à F51 : P6.

## 3. Ce qu’on a appris pendant P4a (à ajouter aux pièges)

- **Mesurer avant de corriger** : sur cinq entrées du registre, trois (F23, F43, F33) n’avaient pas de cause établie ; la mesure a montré que F33 n’existe plus (état d’avant R9) et que F43 n’était pas là où le registre le disait (bouton d’actualisation de l’en-tête, pas un « bouton secondaire de 26 px »). Un sondage ciblé (`audit-p4a-f43.cjs`, `audit-p4a-f33.cjs`) coûte une minute.
- **Une recette peut échouer dans un autre thème que celui qu’on regarde** : `check-shell-home-simplification` testait AtoumWeb d’abord ; le sondage doit reprendre le même élément (`.home-dashboard`) et les trois thèmes.
- **Une disposition validée peut coûter ailleurs** : les deux rangées fixes de la barre d’outils faisaient grimper trois écrans de 46 à 99 px ; seule la mesure des huit écrans qui utilisent `ListToolbar` l’a montré. Mesurer tous les consommateurs d’un composant partagé.
- **Les feuilles V2 de l’Accueil surchargent R6** : `HomeDashboardV2.css` met `today` et `watch` en `grid-column: auto` ; une règle de même spécificité dans `home-r6.css` (importée après) suffit, sans toucher le lot UX 1.
- **Outils de capture** (hors dépôt, `outils-audit\`) : `gen-audit-p4a.cjs [middle] [sortie]` fabrique un outil à partir d’`audit-p3b.cjs` et d’un fichier d’étapes (`p4a-middle*.txt`) ; le lancement de `check-home-shell-lot1.cjs` exige un dossier de sortie **inexistant**.

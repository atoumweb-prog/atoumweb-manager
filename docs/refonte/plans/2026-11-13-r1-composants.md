# R1 Composants partagés : plan

> **Pour l'exécutant :** exécution en ligne (mode natif), une tâche à la fois, un commit par tâche terminée et testée.

**Objectif :** réparer trois scripts de recette, livrer `StatusPill`, `NextStepCard`, `MoreMenu`, `RecordHeader` alignés sur les tokens, et aligner le bloc `aw-ui-*` sur les tokens en réduisant les `!important` des fichiers touchés.

**Architecture :** composants React sans logique métier dans `src/renderer/ui/`, un CSS sans `!important`, un modèle pur pour le menu ; tests vitest en rendu statique et sur le modèle ; banc de capture hors dépôt.

**Spec :** `docs/refonte/plans/2026-11-13-r1-composants-design.md`.

## Contraintes globales

- Aucune dépendance npm. Aucun `!important` dans un fichier nouveau. Aucune couleur écrite en dur dans `ui/next-step.css` et `ui/shared-controls.css`.
- Aucun composant branché dans un écran existant. Aucun écran, onglet ni fonction supprimé.
- Pas de push sans accord déjà donné pour la branche `claude/refonte-manager` (autorisé) ; pas de PR ni fusion.

## Points de vigilance (Review Focus)

1. Menu « Plus » : Échap referme et rend le focus au bouton ; flèches ; élément désactivé jamais activé.
2. Les trois thèmes : mêmes classes, tokens par thème ; pas de couleur en dur.
3. `StatusPill` : le ton inconnu retombe sur `neutral` ; le texte n'est jamais la seule information (le libellé est toujours affiché).
4. Cascade : après déplacement du bloc `aw-ui-*`, le rendu d'`AppButton` est identique hors couleur d'erreur.
5. Les trois scripts : un échec ultérieur d'une autre cause est rapporté, pas masqué.

---

### Tâche 1 : réparer les trois scripts de recette

**Fichiers :** `scripts/check-contract-library-ui.cjs`, `scripts/check-unsaved-inputs-ui.cjs`, `scripts/check-ux-v2-lot01a-real-ui.cjs` (et fixtures liées si besoin).

- [ ] Reproduire chaque échec (déjà observé : worker PDF, champ contexte, `#header-mode`).
- [ ] Corriger le minimum de chaque script, relancer, lire la sortie.
- [ ] Noter dans `PROJECT_STATUS.md` ce qui est réparé et, pour chaque script, l'éventuel échec ultérieur et sa cause.
- [ ] Commit : `fix(recette): remettre en état les scripts natifs cassés avant R0`.

### Tâche 2 : composants « Prochaine étape »

**Fichiers :** `src/renderer/ui/StatusPill.tsx`, `NextStepCard.tsx`, `MoreMenu.tsx`, `moreMenuModel.ts`, `RecordHeader.tsx`, `next-step.css`, tests `ui/nextStepComponents.test.tsx`, `ui/moreMenuModel.test.ts`, `ui/importantBudget.test.ts`, import dans `src/renderer/main.tsx`.

- [ ] Écrire les tests (rendu statique des quatre composants, modèle du menu, garde-fou `!important` et couleurs en dur), les voir échouer.
- [ ] Implémenter `moreMenuModel.ts` : `nextMenuState(state, event, items)` pur (ouverture, fermeture, flèches, Début, Fin, Échap, saut des éléments désactivés).
- [ ] Implémenter les composants et `next-step.css`, sans `!important` ni couleur en dur.
- [ ] Banc de capture Noir / Confort (hors dépôt) : rendre les composants avec la chaîne CSS de production.
- [ ] `npm run typecheck`, `npm test`, puis commit : `feat(r1): composants partagés Prochaine étape (bloc d'action, Plus, en-tête de dossier, pastille)`.

### Tâche 3 : contrôles partagés sur les tokens et `!important`

**Fichiers :** `src/renderer/ui-consistency-v2.css` (bloc `aw-ui-*` retiré, cinq `!important` retirés), `src/renderer/ui/shared-controls.css` (nouveau), `src/renderer/main.tsx`, test `ui/importantBudget.test.ts`.

- [ ] Test d'abord : `shared-controls.css` sans `!important` ni couleur écrite en dur ; budget de `!important` de `ui-consistency-v2.css` abaissé de 5.
- [ ] Mesurer dans l'application la taille calculée des lignes de devis avant la modification.
- [ ] Déplacer le bloc, aligner les couleurs sur `--aw-danger-*`, retirer les cinq `!important`.
- [ ] Mesurer après ; comparer ; captures Noir / Confort d'un écran qui utilise `AppButton`.
- [ ] `npm run typecheck`, `npm test`, commit : `refactor(r1): contrôles partagés sur les tokens et réduction des !important`.

### Tâche 4 : clôture

- [ ] Captures Noir / Confort, relecture indépendante, mise à jour de `PROJECT_STATUS.md` et `DESIGN.md`, commit et push.

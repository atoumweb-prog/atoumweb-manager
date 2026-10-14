# UX/UI V2 — 05C : filtres de consultation et recette

## Implémentation

Branche indépendante de la PR #106. Les filtres **famille**, **public applicable** et **inclure archivées** sont purement côté présentation. La fonction `filterContractClauses` conserve les objets, identifiants, textes, versions et ordre d'entrée. La recherche francophone initiale reste indépendante.

La recette Electron TEMP du script `scripts/check-contract-library-ui.cjs --ux05b` est étendue aux filtres 05C : catégories, publics, retour à la liste complète et non-mutation de `listTemplates(true)`. Les tests unitaires 05C conservent leurs assertions de non-mutation.

## Validation et réserves

La dernière CI complètement verte en amont était #895 sur 05B.3 (1047/1047 Vitest, Electron 05B vert). La CI #907 et sa relance ont échoué **avant affectation d'un runner Windows**, sans test exécuté. La CI #911, déclenchée après l'ajout des contrôles Electron 05C, a également échoué avec **zéro étape exécutée**. Ces échecs ne certifient ni n'invalident le code 05C.

À reprendre impérativement avant validation technique : typecheck ; Vitest complet ; Electron TEMP et capture des résultats ; vérification 3 thèmes × 3 densités, clavier et focus, écrans étroits ; contrôle du snapshot de devis figé lors des navigations.

## Suite sûre 05D

Préparer la lisibilité du **Builder de contrat intégré au devis** à partir des états canoniques `draft`, `frozen`, `historical_missing`, sans nouvelle persistance ni recomposition automatique des devis historiques. Vérifier les clauses de base, liées aux prestations, et particulières, sans toucher aux preuves Abby. Les textes contractuels et leur classement juridique nécessitent une validation humaine séparée.

Pas de fusion dans `main`, aucune base réelle modifiée.

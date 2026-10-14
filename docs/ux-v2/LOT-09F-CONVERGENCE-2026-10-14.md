# Lot 09F — Recette transverse des lots 09A–09E (candidat isolé)

**Aucune fusion dans `main`.** Cette branche est créée depuis 09A/PR #113. Sous-lots sources : 09B [#119], 09C [#129], 09D [#132], 09E [#133] (tous draft, inchangés).

## Objectif

Assembler les livraisons techniques A/B/C/D/E dans **un seul arbre de validation isolé**, résoudre sans suppression les collisions, faire exécuter les tests réels Windows et préparer une revue coordonnée avant intégration dans `main`. Ne pas confondre quatre CI isolées vertes avec une recette combinée verte.

## Collisions vérifiées
- `.github/workflows/ci.yml` : agréger les quatre jobs Electron et restaurations sur la branche 09F.
- `scripts/check-ux-v2-lot01a-real-ui.cjs`, `scripts/fixtures/native-recipe-args.cjs`, `src/shared/nativeRecipeArgs.test.ts` : quatre modes de recettes, sans masquer le runner historique 03B.
- `src/main/crm/ClientDocumentService.ts` et tests : conserver la garde contre la suppression des **anciennes factures Abby remplacées** (09B) ET les transactions de mise à jour/archivage documentaire (09D).
- `src/main/ipc.ts` : préserver fingerprint/ouverture contrôlée Abby (09B) ET toute la chaîne Word/PDF (09E).
- `PROJECT_STATUS.md` et `docs/ux-v2/SUIVI-AVANCEMENT.md` : centraliser les statuts vérifiés sans écraser ceux des autres sous-lots.

## Matrice transverse R09F-01 à R09F-25
- 01–07 : factures Abby préparées/rattachées, états cohérents, origine Client, aucun paiement fictif.
- 08–11 : refus physique des preuves de devis/factures courantes ou remplacées, fichiers manquants et SHA invalides.
- 12–16 : dépenses internes/projet, statut payé déclaré, échéance mensuelle sans occurrence artificielle, versions des justificatifs.
- 17–18 : navigation Documents/Facturation, archive/restauration sans perte d'identité.
- 19–23 : DOCX réel limité au brouillon, export/import/revue/approbation, conflit/publie/gelé refusé, PDF de travail non officiel.
- 24–25 : UX-01 multi-modules, sauvegardes/fermeture, tests Linux-independent TypeScript et Windows Electron en TEMP, 3 thèmes × 3 densités, FK/SQLite.

## Gates
TypeScript, suite Vitest complète, 4 recettes Electron 09B/C/D/E, UX-01 général, round-trip Windows, scripts SQLite et vérifications d'intégrité. Toute CI doit être rattachée au **SHA unique du candidat 09F**, pas à l'une des branches sœurs. Tests humains, convergence avec le dernier `main` et autorisation explicite de fusion restent séparés.
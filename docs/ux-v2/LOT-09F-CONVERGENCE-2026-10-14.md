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

## Clôture technique du candidat intégré — 14 octobre 2026

**VALIDÉ TECHNIQUEMENT sur le SHA code `8bf6d8e6f05bc1ad32d93853e2e652fb8495cf54`.** La CI Windows [#38618468110](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38618468110) conclut **SUCCESS**, dans un seul arbre réunissant 09A, 09B, 09C, 09D et 09E.

| Gate du 09F | Preuve au SHA code |
| --- | --- |
| TypeScript | SUCCESS |
| Vitest | 114 fichiers PASS, aucune suite échouée |
| 09B — Abby/facturation | 85 assertions Electron réelles PASS |
| 09C — Dépenses et justificatifs | 67 assertions Electron réelles PASS |
| 09D — Documents/archives | 73 assertions Electron réelles PASS |
| 09E — DOCX de brouillon et PDF de travail | 65 assertions Electron réelles PASS |
| UX générale | 373 assertions PASS, 17 destinations, 3 thèmes × 3 densités, 0 erreur console/overflow détectée |
| Restauration/fermeture Windows | PASS — quitter/redémarrer accepté ou refusé selon brouillons |
| Environnement | Répertoires et bases SQLite TEMP isolés, FK et intégrité contrôlées |

**Total : 663 assertions Electron/UX réussies.** Les 114 fichiers Vitest sont comptés séparément. Les tests Windows sont réalisés sur le code intégré **et non seulement sur les branches isolées**.

### Collision réellement résolue

Le premier candidat 09F avait perdu dans `ClientDocumentService.fingerprint` et `verifiedPath` la validation de la signature PDF spécifique à la catégorie `invoice`. Le test d'intégration 09B échouait légitimement lorsqu'une pièce nommée `.pdf` sans signature était acceptée. Le commit `8bf6d8e` restaure ce contrôle sans supprimer les garanties du 09D : transactions documentaires et impossibilité de supprimer ou de déclasser les factures Abby remplacées. Le test de non-régression et toutes les recettes intégrées passent sur ce SHA.

### Limites conservées, sans prétendre davantage

- 09E couvre l'aller-retour DOCX de **paragraphes simples sur des versions brouillon**, avec manifeste, diff et approbation ; les tableaux/images/macros, éléments Word riches et ressources externes ne sont pas importés silencieusement. Fidélité visuelle dans Microsoft Word et revue juridique : validations humaines distinctes.
- Abby reste l'émetteur des factures ; `invoiced` ne vaut pas `paid`. Les paiements des dépenses sont des **déclarations**, pas des transactions bancaires confirmées.
- La conservation documentaire ne signifie pas suppression légale automatique ; « Autres documents » hors Client ne dispose pas d'un dépôt implémenté.
- Aucune certification de compatibilité avec le **nouveau** `main` n'est donnée à ce stade : elle constitue un gate d'intégration distinct.

### Reste exclusivement avant/intégration dans main

1. Préparer la fusion contrôlée de **#113 (09A)**, qui est la base de **#134 (09F)**, puis vérifier sa CI post-fusion et le SHA exact de destination. **Aucune fusion autorisée à ce stade.**
2. Faire pointer le candidat intégré **#134** sur le `main` réellement actualisé, réexaminer les éventuels conflits avec les autres lots en parallèle, refaire TypeScript, Vitest, quatre Electron natifs, UX générale et restauration sur le nouvel arbre.
3. Utiliser **#134 comme livraison combinée** ; les PR sources #119/#129/#132/#133 sont conservées pour traçabilité et **ne doivent pas être fusionnées une seconde fois** si leurs changements sont intégrés par #134.
4. Effectuer la recette humaine/visuelle de la combinaison sur le Windows cible, en particulier l'aller-retour réel Microsoft Word et la lisibilité multi-thèmes, sans la confondre avec le gate de code automatisé.
5. N'autoriser la fusion vers `main` qu'après examen explicite des résultats et décision humaine.

**Statut final 09F sur branche candidate : validé techniquement, prêt pour les gates d'intégration dans `main`.** Les changements documentaires éventuels portant `[skip ci]` après le SHA certifié ne modifient pas le code testé.

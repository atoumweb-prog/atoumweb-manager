# Lot 06 — Complément d'actualisation du référentiel UX/UI V2 (14/10/2026)

> **Périmètre : réalité vérifiée du lot 06, sans modification des décisions métiers.** Ce document est créé sur la branche autonome de convergence PR #124 pour préparation d'une mise à jour du référentiel central [PR #82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82). Il ne modifie pas la branche documentaire #82 et ne certifie pas les autres lots.

## 1. Source canonique et constat de décalage

- Le référentiel historique de la PR #82, HEAD `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`, contient `docs/ux-v2/README.md`, `LOT-06-DEVIS-ABBY.md`, les six fiches 06A–06F et la matrice `MATRICE-RECETTE-ET-GATES-UX-V2.md`.
- Ces textes remontent principalement au **09/10/2026** et indiquent « non implémenté », « aucun test exécuté » ou « recette future ». Ces mentions sont **historiques** ; elles ne décrivent pas le candidat 06 du 14/10/2026.
- **Ne pas supprimer** les scénarios R06A–R06F, les décisions E151–E153, E72, les invariants des documents historiques ou les réserves E174–E178 : conserver le référentiel cible distinct des preuves de réalisation.

## 2. État opérationnel vérifié — candidat 06A à 06F

**PR de convergence** : [#124](https://github.com/atoumweb-prog/atoumweb-manager/pull/124), branche `integration/ux-v2-06-candidate-20261014`, HEAD de code + documentation `e4930dba7d2aef15fcb940c4acf9d4df34197c90`, **draft et non fusionnée**.

| Sous-lot | Référence du corpus #82 | Réalisation confirmée dans le candidat | Preuve |
| --- | --- | --- | --- |
| 06A | `LOT-06A-MATRICE-DEVIS-ET-ETATS.md` | Aperçu et création du devis utilisent un calcul partagé en centimes (surcharge explicite à 0, erreurs de saisie contrôlées). Libellé et confirmation d'acceptation Abby distingués de la finalisation. Règle `new` / démarrage volontaire conservée par le service. | `quoteWizardPrice.ts`, `quoteWizardPrice.test.ts`, `QuotesPage.tsx`, `QuoteService.test.ts` |
| 06B | `LOT-06B-ASSISTANT-LISTE-EDITION.md` | Navigation par ID, garde UX-01 des brouillons, protection contre réponses obsolètes A→B→A, rafraîchissement asynchrone et erreurs périmées. | `QuotesPage.tsx`, `check-unsaved-inputs-ui.cjs`, CI Electron |
| 06C | `LOT-06C-COMPOSITION-CATALOGUE.md` | Bloc services inclus/options, anti-double clic synchrone, prix proposé et snapshot historique, achat/retrait explicite sans vente des options seulement disponibles. | `QuoteOfferOptionsPanel.tsx`, `QuoteService.test.ts` |
| 06D | `LOT-06D-CONTRAT-PREVISUALISATION.md` | Tests des conséquences métier : envoyé/refusé sans conversion implicite ; moteurs CGV/contrat existants préservés, pas de logique juridique parallèle. | `QuoteService.test.ts`, tests et flux contractuels existants |
| 06E | `LOT-06E-ABBY-REVISIONS-PROJET.md` | Tests de révisions indépendantes, historique et opérations d'acceptation/Projet héritées, sans duplication de Client/Projet dans les parcours existants. | `QuoteService.test.ts`, tests métier Projet/Abby de la suite |
| 06F | `LOT-06F-RECETTE-ET-INTEGRATION.md` | Convergence isolée de 06A–06E ; typecheck, tests complets, Electron UX-01 et recette transversale Windows TEMP réussis. | [CI #1194](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38594229347) |

**Attention :** « prêt techniquement » signifie que la version convergée et ses risques ciblés ont passé la recette automatisée ; cela **ne signifie pas** que chaque scénario prospectif R06F-01…25 a une assertion UI individuelle identifiée, ni que les captures ont été approuvées visuellement par un humain, ni que des échanges réels avec Abby ont été automatisés.

## 3. Preuves d'exécution sur le SHA soumis

- [CI #1194](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38594229347) : `completed / success`, pour la PR #124, HEAD `e4930dba7d2aef15fcb940c4acf9d4df34197c90`. Le runner a réellement testé le **merge synthétique** `b6449171fdafedcb4ad39c5e175911f6f337db5e` (HEAD candidat réuni à `main@cc0bc679400321f5afacdbee3317ea8acc451518`).
- TypeScript réussi ; Vitest **1 051/1 051 tests, 110 fichiers**, incluant les tests additionnels métier des lots 06C/06D/06E.
- Recette UX-01 Electron : **192 contrôles, 0 échec** ; preuve des brouillons, fenêtres/fermetures, réponses obsolètes et validation sur fixtures TEMP, trois thèmes.
- Recette Electron Windows transversale : intégration **37/37**, CRM **77**, recherche **92/92**, Accueil **64/64**, recette visuelle **527/527**, parcours **67/67**, interface **374/374**. Journaux `INTEGRATION_COMPLETE`, aucune erreur console indiquée dans les résultats.
- **135 captures** produites pour 15 scènes × 9 présentations ; 63 captures d'interface vérifiées. Pas de validation humaine des rendus ; aucune copie des images livrée en artefact GitHub exploitable.
- Migrations 1–66 / intégrité et FK conformes sur fixtures Electron ; tests restauration SQLite (35), migrations (10), égalité binaire restauration (6) et protections des restaurations/fermetures dans Vitest. Aucune écriture sur Validation-MSI.
- Les fichiers apportés par les branches 06A/06B/06C/06D/06E ont été comparés au candidat. Aucun ajout métier de branche omis détecté ; garde d'erreur obsolète de 06B remplacée intentionnellement par une version corrigée.

## 4. Dépendances et frontières (à ne pas cacher dans le référentiel)

- Lot 04B [PR #104](https://github.com/atoumweb-prog/atoumweb-manager/pull/104) : collision future probable dans `QuotesPage.tsx` et workflow CI ; sa recherche catalogue utilise `catalogMatchesQuery` et `catalogIsSelectable`. Préserver ces ajouts et les comportements lot 06 à la convergence.
- Lot 04C [PR #108](https://github.com/atoumweb-prog/atoumweb-manager/pull/108) : `scripts/check-unsaved-inputs-ui.cjs` et workflow CI communs.
- Lot 05 [PR #121](https://github.com/atoumweb-prog/atoumweb-manager/pull/121), [#106](https://github.com/atoumweb-prog/atoumweb-manager/pull/106) : Builder CGV propriétaire de la bibliothèque/clauses ; contrôler son interaction avec devis 06D après convergence, ne pas recréer de CGV dans le lot 06.
- La PR #124 est basée sur `main@cc0bc679400321f5afacdbee3317ea8acc451518`, sans retard au dernier comparatif Git ; le résultat devient périmé si `main` ou les dépendances évoluent.

## 5. Mise à jour à faire par le propriétaire de la PR #82

1. Ajouter **un encart daté 14/10/2026**, clairement séparé des spécifications initiales, dans le README et `LOT-06-DEVIS-ABBY.md`, pointant vers ce bilan et la PR #124.
2. Ajouter un appendice « exécution et réserves » à `LOT-06F-RECETTE-ET-INTEGRATION.md`, sans remplacer les 25 scénarios cibles par des taux d'exécution non prouvés.
3. Dans `COUVERTURE-ET-LOTS.md` et `MATRICE-RECETTE-ET-GATES-UX-V2.md`, distinguer **cibles historiques non testées au 09/10** et **campagnes réellement exécutées sur #124 au 14/10**. Mettre à jour le statut G2/G3/G5 du *périmètre lot 06*, sans déclarer globalement les 15 parcours P01–P15 comme validés.
4. Conserver les décisions métiers E72/CGV/acceptation, les réserves E174–E178 et les dépendances 04/05. Vérifier les statuts courants des autres lots séparément ; ce bilan ne les certifie pas.
5. Une fois ce complément incorporé dans la PR documentaire, ne déclarer la référence centrale actualisée **qu'après contrôle du nouveau HEAD et des liens**. Ne pas fusionner automatiquement #82 ni #124.

**Conclusion :** données techniques du lot 06 consolidées et certifiées par CI ; **référentiel central #82 encore historique tant que cet avenant n'y est pas incorporé**.

# Contrats Lot 1 — Brouillon, gel et preuves historiques

Date : 03/10/2026. **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD**, avant validation fonctionnelle finale. Commit local dédié autorisé ; sans push/merge.
Base : `feature/project-page-compositions-v1@ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81`.

## Comportement avant / après

| Sujet | Avant | Après |
| --- | --- | --- |
| Création de clause | Le Builder enchaînait création et publication | Enregistrement en BROUILLON ; publication distincte sur la version enregistrée |
| Nouvelle version | Création et publication immédiates | Brouillon lisible ; version publiée précédente conservée jusqu'à publication volontaire |
| Gel vide | Texte vide traité comme absence ; gel recalculable | Date et JSON `clauses: []` constituent une preuve explicite ; texte vide conservé |
| Gel existant | Test basé sur la vérité du texte et la finalisation | Présence de toute donnée de snapshot reconnue ; gel partiel signalé sans reconstruction |
| Ancien devis envoyé sans clauses | Acceptation pouvait injecter la bibliothèque courante | Absence historique conservée ; aucune injection, acceptation tracée explicitement |
| Texte figé | Copie/aperçu/export utilisaient un repli vers la compilation | Lecture exacte du snapshot, même vide ; aucune substitution depuis la bibliothèque |
| PDF contractuel | Suppression du fichier avant effet de la FK sur le rattachement | Suppression interdite avant toute écriture si rattaché ; erreur visible ; archivage réversible |

Le snapshot vide ne constitue pas une validation de la complétude juridique du devis : les avertissements de couverture restent visibles. La garantie apportée ici est la preuve technique du contenu effectivement figé.

## Fichiers modifiés / ajoutés

Implémentation :

- `src/shared/contractTerms.ts` : état de snapshot et lecture du texte sans fallback.
- `src/main/commercial/ContractTermsService.ts` : gel vide, verrouillage, absence historique, suppression du chemin de compatibilité.
- `src/main/commercial/QuoteService.ts` : trace d'acceptation historique et protection des devis avec gel existant.
- `src/main/crm/ClientDocumentService.ts` : refus de suppression d'une preuve rattachée, avant suppression physique.
- `src/main/ipc.ts` : export utilisant le bon texte contractuel ; absence historique conservée.
- `src/main/commercial/quotePdf.ts` : snapshot vide distinct de l'absence ; aucune réintroduction de conditions exclues.
- `src/renderer/commercial/ContractTermsBuilder.tsx` : enregistrement/publication séparés et état historique visible.
- `src/renderer/commercial/QuoteClientPreview.tsx` : aperçu sans reconstruction du snapshot.
- `src/renderer/crm/ClientDocumentsPanel.tsx` : refus de suppression présenté à l'utilisateur.

Tests :

- `src/main/commercial/ContractTermsService.test.ts` : 6 tests ajoutés, 15 au total ; brouillon, version, publication distincte, gel vide, exactitude texte/version/JSON, trois profils historiques, acceptation sans injection et instances historiques conservées ; vérification du contenu HTML d'export.
- `src/main/crm/ClientDocumentService.test.ts` : 3 tests ajoutés ; PDF rattaché classé contrat ou devis, conservation physique et du rattachement même archivé, suppression explicite d'un document non rattaché.
- `scripts/check-contract-terms-builder-ui.cjs` : nouveau parcours de 14 contrôles en Chromium caché, IPC simulé et profil temporaire ; création/version/publication, gel vide, absence historique et erreur de suppression PDF.

Documentation :

- `PROJECT_STATUS.md` : état courant et limites.
- `docs/HANDOFF_CODEX_MSI.md` : reprise sur base actuelle et arrêt avant Lot 2.
- `docs/CGV_BUILDER_V1.md` : règles techniques de brouillon, gel, historique et PDF.
- `docs/MANAGER_BRIDGE_ROADMAP.md` : checkpoint courant et journal partagé.
- `docs/CONTRACTUAL_LOT1_DRAFT_FREEZE.md` : ce bilan.

## Migrations et conservation des données

Aucune migration créée ni réservée. Les migrations 1–52 restent strictement intactes. Les champs existants `contract_text_snapshot`, `contract_snapshot_json` et `contract_compiled_at` suffisent ; l'état historique est dérivé sans backfill des devis.

Le Manager n'a pas été lancé sur la base Validation-MSI. Tous les tests de service utilisent SQLite en mémoire ; les PDFs de test et le profil UI sont temporaires. La base réelle a conservé son SHA-256 :

`5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`

Les trois devis `DEV-2026-001/002/003`, les Projets et les anciennes versions catalogue n'ont reçu aucune écriture. Les scénarios de leurs statuts historiques sont reproduits dans une base de test, sans clauses V1 réellement importées.

## Validation exécutée

```powershell
npm run typecheck
npm test -- src/main/commercial/ContractTermsService.test.ts src/main/commercial/QuoteService.test.ts src/main/crm/ClientDocumentService.test.ts src/main/database/StabilisationPhase19.test.ts src/main/database/migrations.test.ts
node scripts/check-contract-terms-builder-ui.cjs
```

- Typecheck : réussi.
- Tests ciblés : 5 fichiers, **43/43** réussis (15 + 8 + 3 + 7 + 10).
- Contrôles UI : **14/14**, sortie 0.
- Contrôle complémentaire autorisé avant commit : `npm test`, **54 fichiers / 356 tests, 0 échec** ; `npm run typecheck`, sortie 0. Aucun changement inattendu apparu.
- Aucun contrôle UI ne vaut recette réelle de la bibliothèque sur les données utilisateur : celle-ci reste à effectuer avec AtoumWeb, sans publication de contenus non autorisés.

## Limites laissées aux lots suivants

**Lot 5 — preuve documentaire** : calcul et stockage d'empreinte SHA-256 à l'import/rattachement, contrôle d'intégrité à l'ouverture, alerte de fichier manquant/modifié, historique des remplacements avec conservation des preuves précédentes et politique de conservation. Le Lot 1 protège le document actuellement rattaché ; un document remplacé n'est pas encore protégé par un historique d'anciens rattachements. Une suppression ou modification directement dans l'Explorateur n'est pas empêchée.

Le Lot 1 n'importe aucun code AW, prestation, clause ou lien du référentiel V1. Il ne traite pas le raccord des blueprints composés, Abby ou Bridge. Lot 8C reste suspendu. Feu vert AtoumWeb reçu pour Lot 2 après commit local de ce Lot 1, sans mélange des changements ; arrêt avant Lot 3.

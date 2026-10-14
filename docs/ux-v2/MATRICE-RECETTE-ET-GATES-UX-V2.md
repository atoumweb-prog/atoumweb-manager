# Matrice de recette transversale et portes de validation UX/UI V2

**09/10/2026 — Document d'exécution future, pas un procès-verbal de recette.** Cette matrice réutilise des scénarios du référentiel sans ajouter de nouveaux cas au total consolidé de **1 069 scénarios prévus**, dont **aucun exécuté par le programme UX V2**.

Lire : [consolidation](CONSOLIDATION-TRANSVERSE-10-LOTS.md), [écarts](REGISTRE-ECARTS-TRANSVERSES.md), [roadmap](FEUILLE-DE-ROUTE-IMPLEMENTATION-UX-V2.md).

## 1. Chaînes métier à valider de bout en bout
| ID parcours | Départ → action → destination | Identité à suivre | Invariant et preuve de recette | Lots et scénarios |
|---|---|---|---|---|
| **P01 — Entrée commerciale** | Annuaire `new` → consulter/fabriquer Devis → **Démarrer la prospection** volontairement | `personId/prospectId/quoteId` | `new` reste Annuaire jusqu'au clic, aucune activation pipeline par création devis; corriger E153 avant certification | 03B/03E, 06A-R06A-01/02, 06F-R06F-01/03 |
| **P02 — Besoin & recommandation** | Besoin Prospect → afficher Offres/recommandations → ajouter **volontairement** ligne Devis | `needId/catalogItemId/versionId/quoteLineId` | Suggestion ignorée = aucun montant/clauses/blueprint; options incluses non vendues deux fois | 04D/04E, 06C-R06C-05/09/10 |
| **P03 — Devis et CGV** | Wizard six étapes → prix proposé → aperçu → enregistrer → finaliser pour envoi | `quoteId/revision/lineId/contractSnapshotId` | Prix aperçu = prix créé, socle CGV unique, personnalisations préservées, snapshot gelé exact; `finalize` non accepté | 05D-R05D-01/13, 06A-R06A-03/04/06, 06D-R06D-08 |
| **P04 — Acceptation et preuve Abby** | Devis `sent/viewed` → confirmation **réelle** d'acceptation → Client → PDF Abby / Projet courant | `quoteId/acceptedAt/clientId/projectId/documentId` | La simple action « Valider » ne doit pas signer par ambiguïté; Client/Projet/ventes créés une seule fois, preuve PDF éventuellement liée après acceptation avec état honnête | 06A-R06A-09/14, 06E-R06E-14/15, 09D-R09D-10/11 |
| **P05 — Révision et Projet préparatoire** | Devis non signé → préparer Projet → modifier Devis → Comparer/Adapter | `commercialDossierId/currentQuoteId/projectId/previewSHA256` | Un Projet provisoire, même ID après adapter, aucun Client vendu; conflits et travail conservés | 07P, 07C-R07C-01/04/10/13, 07G-R07G-10/11 |
| **P06 — Repartir de zéro** | Projet provisoire travaillé → aperçu impact → archiver/remplacer atomiquement | `oldProjectId/newProjectId/currentQuoteId` | Aucune perte temps/fichiers/secrets/Pages/Workbenches; échec = rollback, un seul Projet courant | 07C-R07C-14/15/17, 07G-R07G-12/14 |
| **P07 — Page → Bridge** | Blueprint → Page/composition → package → Workbench Divi → observation | `projectSiteId/pageId/compositionId/exportId/postId/siteOccurrenceId` | Sites/Pages idempotents, 3 modules ordonnés, mêmes `exportId` idempotents, collision hash refusée, Workbench ≠ production | 07D-R07D-02/20, 07F-R07F-03/05/07/18 |
| **P08 — Temps → Intervention → Pack** | Chrono unique/pauses → Intervention `to_validate` → clôture → mouvement Pack | `timeSessionId/interventionId/packId/ledgerMovementId` | Temps net, un débit/idempotence, refus/rollback pannes entre statut/débit/billing, pas double facture | 08B-R08B-10/11/12, 08D-R08D-08/11, 08F-R08F-06/09 |
| **P09 — Maintenance date-à-date** | Devis accepté ou abonnement manuel → début réel → cycles → quota/dépassement → rapport | `subscriptionId/periodId/contractVersionId` | Nouveaux mensuels date-à-date même si payés annuellement, 12 quotas, sans report; anciens `calendar` intacts | 08C-R08C-01/03/05/06, 08F-R08F-13/14/15 |
| **P10 — Facturation Abby → archives** | Élément `ready` → facture Abby réelle hors Manager → import PDF → documents | `billingItemId/clientId/invoiceDocumentId` | `invoiced` avec PDF lié, **pas `paid`**; supprimer pièce liée doit être refusé (E259) | 09A-R09A-02/06, 09B-R09B-04/11/13, 09D-R09D-12 |
| **P11 — Dépense et pièce** | Dépense planifiée → justificatif → remplacement → archive/document | `expenseId/receiptVersionId` (version ID futur) | Échéance ≠ occurrence automatique, `paid` déclaratif, ancienne pièce conservée après E258 | 09C-R09C-08/11/12, 09F-R09F-14/16 |
| **P12 — CGV Word (futur)** | Brouillon clause → DOCX → Word → réimport → diff → nouvelle version | `clauseId/draftVersion/hash` | Publication/Devis gelé intacts, aucun overwrite sur conflit, revue juridique humaine | 05E-R05E-10, 09E-R09E-08/09/10/11 |
| **P13 — Indicateur → source** | Accueil → KPI période → Statistiques → liste réelle filtrée | `metricId/period/from/to/sourceIds` | Même dénominateur/échantillon UI/backend, `new` hors pipeline, `encaissé` indisponible, pas de score non dimensionnel | 10A-R10A-06/08, 10B-R10B-06/10/13, 10E-R10E-04/06/14 |
| **P14 — Backup métier ≠ restauration** | Déclarer backup → vérifier existence / stable → consulter alerte; séparément sauvegarder/restaurer SQLite | `backupRecordId/locationId/workspaceDbPath` | Emplacement existant ≠ sauvegarde intègre; source/target SQLite protégé et fichier Clients non couvert par restore DB seul | 10C-R10C-03/05/14/18, 10E-R10E-17/20/23 |
| **P15 — Paramètres/UX-01** | Naviguer, fermer popup, replier/agrandir fiche, thème/densité/workspace | `currentObjectId/draftVersion/editorId` | Une garde unique; aucune préférence modifie la donnée métier ou désactive protections; focus/clavier/timer préservés | 01E, 02E, 10D-R10D-07/08/12/15 |

*Les identifiants de scénarios dans cette table sont des **renvois**, pas de nouvelles exécutions. Pour les lots avec scénarios avant le préfixe `R` confirmé, se référer aux tableaux détaillés propres à chaque fichier.*

## 2. Portes de validation
| Porte | Questions à trancher | Preuves minimales |
|---|---|---|
| **G0 — Environnement** | PR #81/#83 réellement intégrées ? HEAD et règles UX-01/03/16 présents ? | SHAs, état GitHub, correctifs et matrice des conflits IPC |
| **G1 — Source de vérité** | Chaque champ, objet et action passe-t-il par **un service existant** ? | Vue → callback → IPC → service → table → test, enregistrement des exclusions |
| **G2 — Sécurité des effets** | Un double clic, une erreur injectée, une annulation ou un retour périmé conserve-t-il le bon état ? | Test injection/rejeu/rollback sur SQLite temporaire, analyse des fichiers |
| **G3 — Navigation et UI** | Tous modes/tailles rendent contrôles, aides et focus accessibles ? | 3 thèmes × 3 densités, Compact ≥14px, clavier, fenêtres petites et détachées |
| **G4 — Intégration métier** | Le vrai dossier conserve-t-il `Prospect/Quote/Client/Projet/Temps/Abby/Document` exact ? | Parcours P01–P15 pertinents avec IDs et historiques |
| **G5 — Publication de code** | Tests ciblés/complets terminés, CI réelle au SHA nécessaire et autorisée ? | Rapport vert/échec honnête, liens run, limites ; décision humaine avant merge |
| **G6 — Externalités** | Publication WP, facturation Abby, conformité CGV ou restauration Client réelle demandée ? | **Autorisation indépendante**, moteurs prouvés, environnement de démo et validation métier/juridique selon cas |

## 3. Réduction des 1 069 scénarios sans couverture fictive
**Pas besoin de relancer 1 069 tests après chaque modification.** La campagne doit être pilotée par impact :
1. **Pendant le correctif :** 1–5 scénarios directement touchés, tests unitaires et d'injection répétés localement.
2. **Avant fin de sous-lot :** tous ses scénarios ciblés, services dépendants, parcours P01–P15 impactés, vrais anciens contrôles.
3. **Avant PR prête à fusionner :** typecheck, tests complets de la branche, migrations/FK/temp, recette UI 3×3 ciblée par écran, puis CI Windows si nécessaire et **autorisée**.
4. **Avant clôture de vague :** tous les scénarios effectivement applicables avec preuves par ID; les cas non implémentés restent **non exécutables**, pas « passés ».
5. **Coûts GitHub :** regrouper docs `[skip ci]`; ne jamais utiliser un run pour comprendre une erreur déjà reproductible localement. **Aucun arrêt des assertions/timeouts pour gagner des minutes**.

## 4. Protocole de données et preuves
- **Base SQLite de fixture** totalement séparée du workspace, fichiers synthétiques temporaires, aucune connexion au site WordPress Client.
- Tests de migration/rejeu, FK, collisions de chemins Windows, journaux, horodatage, archive/restauration **de copies**, pas des originaux.
- Rôle des documents : PDF Abby accepté ou facture **pièces probantes**; DOCX/PDF Manager **supports de travail**; clause publiée et snapshot historique **immuables**.
- Une opération de mode démo ou une fenêtre détachée ne doit **jamais ouvrir Validation-MSI en écriture**.
- Déclarer pour chaque ligne d'acceptation : `prévu / codé / testé local / CI réelle / recette humaine / non applicable` et **SHA/chemin de preuve**. Ne jamais remplacer le résultat de recette par un total projeté.

**Ce document définit un protocole. Aucun des parcours ci-dessus n'a été exécuté par ce lot de consolidation.**

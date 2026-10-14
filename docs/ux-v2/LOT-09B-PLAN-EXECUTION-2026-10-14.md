# Lot 09B — Plan d'exécution depuis la clôture technique 09A (14/10/2026)

## Référentiel et statut
Référentiel de départ : `docs/ux-v2/LOT-09B-FACTURATION-ABBY.md` dans le commit historique `0bb0860ee7618af92a53d8711b4a06edbbadc4d6` (PR #82). Ce référentiel **n'est pas encore copié sur la branche de travail** ; sa lecture ne signifie pas une validation de sa totalité.

09A : PR #113 draft, CI #1042 verte, sans fusion. 09B : **en développement**, PR #119 draft vers la branche 09A (pas vers main). CI #38593735979 verte sur d6f8c3c pour TypeScript, Vitest, interface Electron réelle Abby, UX générale et restauration Windows ; les derniers changements ont une CI distincte encore à confirmer.

## Ordre de travail
1. Vérifier l'état actuel des modèles `BillingItem`, `BillingHandoffService`, `BillingPage` et les canaux IPC en contrôlant l'existence réelle des sources facturables (acomptes, solde, intervention, dépassement maintenance, pack, abonnement, autre).
2. Confirmer les invariants : Abby émet le PDF réglementaire hors Manager ; le Manager n'émet aucune facture, `invoiced` exige le bon PDF/Client, aucune déduction de `paid` ni encaissement depuis `invoiced`.
3. Reprendre les cas 09B R09B-01 à R09B-17 et les cartographier aux services, migrations et tests existants ; signaler les écarts et éviter de dupliquer les règles métiers de 09A.
4. Prioriser les seuls écarts à risque : rattachement inter-client, statut facturé sans pièce, archive/délétion de preuve, intégrité de la pièce, idempotence des liens et absence d'écrasement silencieux.
5. Implémenter par corrections ciblées + tests isolés ; protéger brouillons UX-01 et contextes lors des changements de facture.
6. Rejouer CI TypeScript/Vitest et recette Electron ciblée en TEMP, puis mettre à jour `PROJECT_STATUS.md` et le suivi officiel avant clôture.

## Frontières
- Aucun import automatique depuis Abby, ni API/émission fictive, ni gestion d'encaissement créée par déduction.
- Ne pas modifier les prestations et devis des lots 04–08 ; ne pas fusionner dans `main` sans autorisation.
- Pour le développement du 09B, privilégier une branche dédiée **après coordination avec la PR #113** pour éviter qu'une PR 09B incorpore involontairement 09A non fusionné.
- Statuts stricts : cette note **prépare** le 09B ; elle ne revendique ni exécution des scénarios ni nouvelle fonctionnalité.

## 14/10 — Protection des anciennes factures Abby
- PR #119 : journal `billing_invoice_replaced` avec ancien et nouvel identifiant, référence et date ; garde `ClientDocumentService.deletePermanently` sur les identifiants historiques ; test d'archivage puis refus de suppression d'une ancienne facture.
- Gate : CI Windows TypeScript/Vitest à vérifier sur le nouveau commit ; aucune recette Electron 09B certifiée et aucune fusion.

## 09B — Gate d'intégrité des PDF Abby
- L'IPC d'import calcule/vérifie l'empreinte SHA-256 du PDF réellement importé avant le rattachement à l'élément de facturation.
- L'IPC d'ouverture passe par `ClientDocumentService.verifiedPath` au lieu d'un chemin non vérifié.
- Régression sur fichier modifié ajoutée au banc `ClientDocumentService.test.ts`.
- Limite explicite : ce contrôle IPC ne rend pas la lecture et l'ouverture atomiques, et `BillingHandoffService.attachInvoice` peut être appelé directement par des services internes sans cette vérification ; la certification complète de ces voies reste à auditer.

## Vérification centralisée au service (14/10)
- `DatabaseService` injecte `ClientDocumentService.fingerprint` dans `BillingHandoffService` ; toute utilisation du service de production vérifie l'intégrité physique avant de passer à `invoiced`.
- Une instance de service créée directement en test peut conserver son fonctionnement sans vérificateur ; test explicite ajouté pour le refus par vérification.
- À évaluer avant clôture : éviter le double contrôle d'empreinte côté IPC et couvrir la transition remplacement/échec par un test complet avec workspace temporaire.

## 09B — Atomicité rattachement / journal
- `attachInvoice` effectue la mise à jour du statut et l'écriture du journal au sein d'un SAVEPOINT SQLite. Toute erreur de journalisation annule le rattachement et conserve le statut précédent.
- Régression : trigger SQLite volontairement en échec, vérification du rollback et des clés étrangères.
- Gate : confirmer les résultats de typecheck/Vitest, Electron et restauration sur CI Windows.


## Matrice de recette 09B — 17 cas (référentiel #82)
Les cas ci-dessous désignent **les tests automatisés présents** ; leur nouvelle exécution doit réussir sur le dernier commit avant la validation technique finale. La recette visuelle humaine demeure séparée.

| Cas | Couverture dans la branche 09B |
| --- | --- |
| R09B-01 Intervention facturable unique | `BillingHandoffService.ensureForIntervention`, suites Operations/InterventionCompletion existantes, retour immédiat si source déjà créée |
| R09B-02 Achat pack sans doublon | `BillingHandoffService.test.ts` et garde `source_key` dans `ensureForHourPack` |
| R09B-03 Décision de dépassement maintenance | `MaintenanceOverageService.test.ts` et protection `syncMaintenanceOverage` contre déclassement après facture |
| R09B-04 PDF Abby importé | `lot09b-billing-real-scenarios.cjs` via vraie UI/preload/IPC/SQLite TEMP |
| R09B-05 Sélecteur annulé | Recette native 09B, état `ready` inchangé |
| R09B-06 Document d'un autre client | `BillingHandoffService.test.ts`, rejet sans écriture |
| R09B-07 Document catégorie contrat | `BillingHandoffService.test.ts`, rejet |
| R09B-08 Facture archivée | `BillingHandoffService.test.ts`, rejet |
| R09B-09 Facturé sans PDF | `changeStatus('invoiced')` refusé, tests existants |
| R09B-10 PDF altéré | `ClientDocumentService.test.ts`, `BillingInvoiceReplacementIntegration.test.ts`, recette Electron d'ouverture refusée |
| R09B-11 Pièce liée supprimée | `ClientDocumentService.test.ts` ; facture courante et facture remplacée protégées |
| R09B-12 Référence/date modifiées | `BillingHandoffService.test.ts`, journal traçable, transaction SQLite et rollback en cas d'échec |
| R09B-13 Aucune trésorerie fictive | Type `BillingItemStatus` sans `paid`, libellé UI « Abby crée la facture » |
| R09B-14 PDF partagé entre plusieurs sources | Même ID ou SHA-256 déjà attaché : rejet explicite ; regroupement métier multi-sources à concevoir séparément, jamais inféré |
| R09B-15 Source déjà facturée | `MaintenanceOverageService.decide` et `BillingHandoffService.syncMaintenanceOverage` refusent de déclassement |
| R09B-16 Saisie référence/date non enregistrée | `BillingPage.tsx` / `useUnsavedDraft`, recette Electron « Rester / Quitter » entre fiches et modules |
| R09B-17 Windows TEMP et 3 thèmes × 3 densités | CI TypeScript, Vitest, recette Electron facturation + smoke global multi-thèmes, restauration ; captures humaines encore à inspecter |

## Réserves de clôture
- Contrôler la CI du **dernier** commit après les nouveaux tests de brouillon, de faux PDF et de rapprochement multi-sources.
- Vérifier le comportement de l'interface Electron avec sélection, annulation native et double confirmation UX-01.
- Tester et documenter les éventuelles limites métier de regroupement plusieurs sources / une facture avant une évolution dédiée ; aucune API Abby ou statut « payé » inventé.
- Distinguer recette automatisée Windows et inspection visuelle humaine. Pas de fusion vers `main` sans autorisation.

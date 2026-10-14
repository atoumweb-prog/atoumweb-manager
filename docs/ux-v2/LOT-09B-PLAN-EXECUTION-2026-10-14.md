# Lot 09B — Plan d'exécution depuis la clôture technique 09A (14/10/2026)

## Référentiel et statut
Référentiel de départ : `docs/ux-v2/LOT-09B-FACTURATION-ABBY.md` dans le commit historique `0bb0860ee7618af92a53d8711b4a06edbbadc4d6` (PR #82). Ce référentiel **n'est pas encore copié sur la branche de travail** ; sa lecture ne signifie pas une validation de sa totalité.

09A : PR #113 draft, CI #1042 verte, sans fusion. 09B : **cadré / en préparation**, zéro nouvelle fonctionnalité 09B livrée.

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

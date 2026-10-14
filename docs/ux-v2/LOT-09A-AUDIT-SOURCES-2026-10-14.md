# Lot 09A — Audit initial vérifié sur le code (14/10/2026)

## Référence examinée
Inventaire de l'arbre `main` et lecture des sources suivantes : `src/main/billing/BillingHandoffService.ts`, `src/main/expenses/ExpenseService.ts`, `src/main/crm/ClientDocumentService.ts`, `src/renderer/billing/BillingPage.tsx`, `src/renderer/expenses/ExpensesPage.tsx`, `src/renderer/documents/DocumentsPage.tsx`, `src/shared/billing.ts`, `src/shared/expenses.ts`, `src/main/database/billingInvoiceMigration.ts` (migration 32) et `src/main/crm/ClientDocumentService.test.ts`.

## Existant constaté
- Facturation : éléments à facturer avec statuts `planned/ready/invoiced/cancelled/offered`, et liaison à une facture client importée via `invoice_document_id`.
- La méthode `changeStatus` refuse `invoiced` sans facture PDF ; `attachInvoice` vérifie client, catégorie `invoice` et archivage avant rattachement.
- La donnée `invoiced` ne constitue **pas** une preuve d'encaissement. Aucun statut `paid` n'existe dans `BillingItemStatus`.
- Dépenses : service et vue opérationnels au niveau code, statuts `planned/committed/paid/cancelled`, catégorie, TVA, dates, récurrence et justificatif.
- Documents : import classé par client, empreinte SHA-256, contrôle du chemin à l'ouverture, archivage, suppression définitive sous conditions.
- La suppression documentaire contrôlait les preuves contractuelles `quotes.contract_document_id` et `quote_document_links`, **mais ne contrôlait pas explicitement** les éléments de facturation `billing_items.invoice_document_id`. Le FK de migration 32 emploie `ON DELETE SET NULL` ; la suppression de la ligne documentaire aurait donc pu faire perdre le lien avant correction.

## Correction 09A.1 ajoutée sur la branche isolée
Dans `ClientDocumentService.deletePermanently`, refus de suppression si `billing_items.invoice_document_id` référence le document, **avant** `unlinkSync` et la suppression SQL. L'archivage reste possible. Test ciblé ajouté à `ClientDocumentService.test.ts` : facture fictive en dossier TEMP, lien SQL, suppression refusée avant et après archivage, octets conservés, intégrité FK.

## État des preuves
Revue statique du code source : effectuée.
Tests Vitest / typecheck / Electron / restauration : **NON exécutés** depuis cet environnement. Le test ajouté doit être exécuté avant toute PR prête à fusionner.
Aucune migration créée, aucun changement IPC ni `main` modifié.

## Suite à auditer
1. Vérifier les parcours IPC/preload d'import de facture, suppression et ouverture.
2. Déterminer si un PDF peut être remplacé, et préserver l'historique des remplacements.
3. Auditer l'import répétitif de justificatifs pour identifier les risques de version/perte de provenance.
4. Recenser Word : export, édition externe, réimport et comparaisons réellement disponibles.
5. Comparer le tout à la liste normative 09A–09F de la PR #82 ; ne pas attribuer de couverture aux 108 scénarios sans confrontation détaillée.

## Gates
Exécuter au minimum `ClientDocumentService.test.ts`, les tests Billing et Expenses, typecheck, suite complète, migrations/restauration et contrôles d'intégrité sur fixture temporaire Windows ; ne pas utiliser Validation-MSI. Maintenir la branche séparée et une PR draft tant que la recette est absente.

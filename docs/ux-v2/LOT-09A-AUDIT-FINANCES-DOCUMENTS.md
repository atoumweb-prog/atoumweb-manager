# Lot 09A — Audit réel Facturation, Dépenses et Documents

**Statut : étude du code et spécification cible UX V2 ; aucun code ni test exécuté.**
**Base de lecture : Manager `main`, 09/10/2026.** Relever le HEAD de code à chaque chantier futur; cette documentation de PR #82 n'est pas une preuve de conformité juridique/comptable.
Références : [Lot 09](LOT-09-GESTION-DOCUMENTS.md), [Lot 05 CGV](LOT-05-CONTRATS-CGV.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Lot 08 interventions](LOT-08-OPERATIONS-TEMPS.md).

## 1. Trois sources de vérité, aucune duplication implicite
- **Abby** crée les factures officielles. Manager gère des **éléments de facturation attendus** et des **PDF officiels importés**, pas l'encaissement certifié, le paiement bancaire ou une API Abby payante.
- **Dépenses Manager** : registres datés avec montant, TVA, statut, catégorie, fournisseur, échéance/fréquence et éventuel **justificatif local**; ce n'est pas un relevé bancaire.
- **Documents Client** : fichiers et classement par catégorie Client, conservation, archive et preuves contractuelles. **Bibliothèque contractuelle** et **éditeur** restent gérés par les services du Lot 05, pas des copies anonymes de ces textes.

## 2. Tableau des capacités réelles
| Domaine / fichiers | Existant vérifié | Écart à traiter |
|---|---|---|
| `src/shared/billing.ts` | Sources `quote_deposit/project_balance/intervention/maintenance_overage/hour_pack/subscription/other`; statuts `planned/ready/invoiced/cancelled/offered`. | **UX-14** : ne pas créer de statut `paid` ou de nouvelles sources sans service et données. |
| `BillingHandoffService.ts` | `ensureForIntervention/HourPack/HourPackShortfall`, synchronisation dépassement maintenance, identités source et `source_key`, changement d'état; attachement d'un document **catégorie invoice, même Client, non archivé**. | L'élément `invoiced` ne prouve pas un règlement. Ne jamais le convertir en « Payé » dans l'UI. |
| `BillingPage.tsx` | Liste gauche, fiche droite agrandissable, filtres et KPI, origine, **Importer PDF facture Abby**, référence/date, ouvrir PDF, modifier métadonnées. | Accès direct à la source réelle, éventuels rapprochements multi-lignes, statut de pièce et garde de saisie. |
| `src/shared/expenses.ts` et `ExpenseService.ts` | Catégories codées, statuts `planned/committed/paid/cancelled`, fréquence `none/monthly/quarterly/yearly`, prochaine échéance, TVA, Client/Projet, pièce justificative importée. | Une **fréquence stockée n'est pas la preuve d'une génération automatique** des dépenses futures; à vérifier avant annoncer rappel/occurrences. |
| `ExpensesPage.tsx` | Filtres, liste + fiche/agrandissement, formulaire création/édition, statut, paiement déclaré, import de justificatif. | Formulaire réduit par défaut; impact « réellement payé » = **déclaratif manuel**, pas preuve bancaire. |
| `ExpenseService.importReceipt` | Copie le justificatif puis remplace `receipt_relative_path` actif et métadonnées. | **E258** : ancien justificatif non versionné dans la dépense lors du remplacement (fichier copié peut rester sur disque, mais pas d'historique de versions métier constaté). |
| `ClientDocumentService.ts` | Classement et copie par Client, SHA-256 à l'import, contrôle lors de l'ouverture/rattachement; archivage/restauration; documents de preuves devis protégés contre suppression physique. | Protection de **toutes les références probantes**, notamment factures, à compléter. |
| `billingInvoiceMigration.ts` | `billing_items.invoice_document_id → client_documents.id ON DELETE SET NULL`. | **E259 CRITIQUE :** `deletePermanently` protège devis/quote_document_links, **pas** `billing_items.invoice_document_id` : suppression d'une facture liée pourrait rompre la preuve tout en conservant `status='invoiced'`. |
| `DocumentsPage.tsx` | Recherche globale Documents Clients, classements, filtre Client/archive, détail agrandissable, import/édition métadonnées, archivage/restauration/suppression; bouton **Bibliothèque contractuelle** montant `ContractLibraryPage`. | Navigation V2 voulue en **quatre portes visibles** : Bibliothèque contractuelle / Éditeur contractuel / Documents clients / Autres documents ; éditeur doit réutiliser Lot 05. |
| `ClientDocumentsPanel.tsx` | Vue Documents depuis la fiche Client, import, métadonnées, archive, suppression; version simplifiée. | Même droits/états que DocumentsPage; aucune deuxième politique de conservation. |
| `QuoteContractDocumentPanel.tsx` | PDF signé/accepté Abby, référence active remplaçable et versions anciennes conservées via historique des preuves Devis. | Protection gel/snapshot et intégrité de ces pièces indépendante d'un export de travail Word/PDF. |
| Word/DOCX | `.docx` figure dans les extensions MIME d'import de fichiers; **aucun pipeline d'édition/réimport contrôlé avec diff** établi par cet audit. | **E260** : export Word, modifier hors Manager, comparer et valider sont des **cibles**, pas des fonctionnalités livrées. |

## 3. Différences structurelles à garder explicites
| Objet | Source métier | Sens |
|---|---|---|
| Élément `billing_item` | Devis accepté/Intervention/Pack/etc. lorsqu'un service le prépare | Travail **à facturer ou suivre**, pas facture Abby émise |
| PDF facture Abby importé | `client_documents` catégorie `invoice`, lié à `billing_item` | **Preuve de facture**, mais pas preuve d'encaissement |
| Dépense `status=paid` | Marquage humain dans `expenses` | Dépense **déclarée payée**, ne prouve pas un prélèvement |
| Pièce de dépense | `expenses.receipt_relative_path` | Justificatif associé, historique/versionnement limité |
| Contrat signé Abby | `quotes.contract_document_id` et liens de preuves | Preuve liée à révision signée, conservation stricte |
| Document classé Client | `client_documents` et son fichier copié | Document générique, peut aussi être une pièce probante liée à un autre module |
| Texte du contrat | Bibliothèque de clauses/types versionnées | Document **éditable source**; gel Devis immuable |

## 4. Priorités de sûreté issues du code
**E258** justificatif de dépense remplacé sans suivi explicite d'ancienne version.  
**E259** document facture Abby lié **non protégé** comme pièce de devis lors de `ClientDocumentService.deletePermanently`, FK `ON DELETE SET NULL`; tester et verrouiller référence avant suppression.  
**E260** Word externe/import comparé **non établi**, même si import brut DOCX est possible.  
**E261** protection `dirty` de formulaires/Documents/Facturation face à changement de sélection et reload (après UX-01).  
**E262** états financier `invoiced` et `paid` distincts; libellés et statistiques traçables.  
**E263** limites actuelles de sources Billing et absence de synchronisation API bancaire/Abby.

## 5. Recette initiale (14 scénarios projetés, aucun exécuté)
| ID | Scénario | Attendu |
|---|---|---|
| R09A-01 | Ouvrir élément `ready` | Origine et montant, pas facture inventée |
| R09A-02 | Passer manuellement `invoiced` sans PDF | Refus service |
| R09A-03 | Import PDF facture du même Client | Lien + référence + date |
| R09A-04 | Tenter PDF d'un autre Client | Refus |
| R09A-05 | Facturé sans paiement | Jamais affiché « encaissé » |
| R09A-06 | Archiver puis supprimer PDF facture rattaché | **Doit être refusé après correction E259**, pièce intacte |
| R09A-07 | Dépense ponctuelle sans Client | Enregistrement interne possible |
| R09A-08 | Dépense avec Projet autre Client | Refus |
| R09A-09 | Justificatif dépense remplacé | Ancienne pièce traçable après amélioration E258 |
| R09A-10 | Document Devis accepté supprimé | Refus actuel à conserver |
| R09A-11 | Client Doc sans SHA ancien | Pas de certification rétroactive |
| R09A-12 | DOCX importé brut | Aucun texte contractuel modifié |
| R09A-13 | Rechercher document depuis Client puis Bibliothèque | Identités exactes, pas clone |
| R09A-14 | Tests SQL temp, FK et pièces de démonstration | Validation-MSI et vrais fichiers intacts |

**Aucun test ne certifie le caractère fiscalement ou juridiquement conforme d'une facture ou de ses durées de conservation.**

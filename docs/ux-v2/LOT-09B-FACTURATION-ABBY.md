# Lot 09B — Facturation : suivi des sources, PDF Abby, rapprochement et états fiables

**Statut : conception UX V2, aucune facture créée/importée ni code modifié.** Analyse `BillingHandoffService.ts`, `BillingPage.tsx`, `src/shared/billing.ts` sur `main`, 09/10/2026.
Références : [09A audit](LOT-09A-AUDIT-FINANCES-DOCUMENTS.md), [06E Devis/Abby](LOT-06E-ABBY-REVISIONS-PROJET.md), [08D Pack](LOT-08D-PACKS-DEBITS.md), [09D Documents](LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md).

## 1. Frontière métier sans double émission
**Abby produit les factures officielles; Manager prépare et suit les éléments à traiter et importe leur PDF**. L'interface mentionne déjà « Facturation sans API » : ne jamais introduire `Envoyer à Abby`, `Facture émise` ou `Facture réglée` tant que les preuves/services ne les permettent.

Sources **existantes** : `quote_deposit` (acompte Devis), `project_balance` (solde Projet), `intervention`, `maintenance_overage`, `hour_pack`, `subscription`, `other`. **N'en inventer aucune.**

Statuts **existants** : `planned` (prévu), `ready` (à facturer), `invoiced` (PDF facture rattaché), `cancelled`, `offered` (offert). Il n'y a **pas** de `paid` sur `BillingItem`. Une **facture importée** ne signifie **ni payée ni encaissée**.

## 2. Interface proposée : liste gauche, fiche droite
- **Synthèse** : « À préparer », « À facturer », « Facturés avec PDF », « Offerts/annulés » et total **attendu** selon source/status. Ne pas afficher chiffre d'affaires **encaissé** à partir du champ `expectedAmountCents`.
- **Liste** : Client, Projet, source réelle, ID/numéro d'origine, libellé, montant attendu, statut, éventuelle échéance, référence PDF importé, date déclarée, éléments nécessitant action.
- **Recherche et filtres** : source, statut, Client/Projet, avec/sans PDF, référence exacte, échéance; mémoriser contexte lors du passage à la fiche.
- **Fiche** : origine vérifiable et bouton **Ouvrir la source** uniquement si routeur vers la véritable Intervention/Pack/Devis/Période existe; montant attendu et théorique séparés, notes, facture Abby importée, numéro/date, pièces, historique.
- **Actions** : `Marquer prêt` / `Marquer offert` selon statut et service; **Importer PDF facture Abby**, **Ouvrir PDF**, **Modifier référence/date**, **Consulter Client**. « Facturé » ne doit pas être actionnable par un simple changement de liste.

## 3. Parcours de rapprochement réel avec Abby
1. Dans Manager, examiner la **source et le montant attendu** (prix de vente/Intervention/Pack/dépassement), confirmer que c'est **le bon Client et Projet**.
2. Ouvrir/produire **la facture dans Abby hors Manager**, vérifier référence, date et prix de la facture réelle sans prétendre que Manager l'a envoyée.
3. Depuis l'élément, importer le PDF officiel dans **Documents du Client > Factures** en choisissant le bon fichier; renseigner sa référence et sa date réelle.
4. Valider que le document appartient au **même Client**, qu'il est en catégorie `invoice`, non archivé et que son **empreinte** est valide; l'item passe `invoiced` seulement après un import réussi.
5. Afficher lien **`billing_item.id ↔ client_document.id`** et provenance de la pièce; une erreur ne doit pas afficher « Facturé ».
6. Corriger les seules métadonnées autorisées (numéro, date), avec journal ; **modifier la référence n'altère pas le contenu du PDF officiel**.
7. Si plusieurs éléments correspondent à **une facture Abby**, concevoir une relation adaptée après audit; **ne pas** attacher automatiquement la même pièce à plusieurs sources en déduisant seulement montant ou nom.

## 4. Protection probante E259 — priorité
Actuellement `ClientDocumentService.deletePermanently` refuse de supprimer les documents liés à `quotes.contract_document_id` et `quote_document_links`, mais **ne recherche pas la référence `billing_items.invoice_document_id`**. La migration SQL #32 définit cette FK `ON DELETE SET NULL` : une suppression définitive peut donc **dissocier la facture** d'un item encore en `invoiced`. Aucune supposition de protection par la FK n'est admissible.

**Cible obligatoire** : avant suppression, protéger chaque `client_documents.id` référencé par la facturation (et autres registres probants identifiés), empêcher la suppression physique, autoriser un **archivage non destructeur** selon politique, et conserver l'accès/empreinte sans changer les états. Une éventuelle correction de lien ne doit pas effacer la pièce précédente sans traçabilité.

## 5. Droits, périmètre et erreurs
- Une pièce étrangère ou un document classé hors `invoice` ne peut pas attester une facture du Client actuel.
- Référence absente ≠ facture inexistante : afficher **« Référence à vérifier »** si le champ est nullable, sans fabriquer un numéro.
- Empreinte absente sur une ancienne pièce : **ne pas certifier rétroactivement**, demander revue ou vérification au moment du rattachement; erreur d'empreinte = ouverture/lien refusés.
- « Paiement » et « encaissement » nécessitent de futures données et règles dédiées; **ne pas déduire une trésorerie d'une facture émise ou d'une dépense planifiée**.
- UX-01 : quitter formulaire référence/date ou changer l'élément sélectionné avec saisie sale conserve l'état; ne pas annoncer import réussi avant retour service.

## 6. Recette future (17 cas, non exécutés)
| ID | Test | Attendu |
|---|---|---|
| R09B-01 | Facturation d'intervention hors forfait | Une origine/entrée `ready`, jamais double |
| R09B-02 | Achat Pack | Une entrée liée au Pack |
| R09B-03 | Dépassement maintenance modifié | Élément mis à jour/idempotent selon décision |
| R09B-04 | Import PDF facture Abby | Lien Client+document et `invoiced` |
| R09B-05 | Annuler sélecteur fichier | État item inchangé |
| R09B-06 | Importer PDF Client B vers item Client A | Refus |
| R09B-07 | Import catégorie `contract` en facture | Refus |
| R09B-08 | Archiver puis tenter lier pièce | Refus si archived |
| R09B-09 | Marquer facturé sans PDF | Refus service |
| R09B-10 | Ouvrir facture dont SHA a changé | Refus/alerte d'intégrité |
| R09B-11 | Effacer pièce facture liée | **Refus requis après correctif E259**, preuve préservée |
| R09B-12 | Modifier référence/date | Changement métadonnées sans altération PDF |
| R09B-13 | Facture sans encaissement connu | Aucun statut `paid` fictif |
| R09B-14 | Deux items avec même facture | Détection/gestion explicite, pas auto-lien par nom |
| R09B-15 | Annulation de source déjà facturée | Refus de perte de preuve/historique |
| R09B-16 | Quitter l'édition dirty | Garde UX-01, sélection intacte |
| R09B-17 | Typecheck/tests facture, UI 3×3 et SQLite isolée | Aucun document réel ni Validation-MSI touchés |

**E264** règles d'agrégation multi-sources/facture Abby; **E265** reprise/remplacement PDF officiel; **E266** encaissements/statuts réellement disponibles; **E267** protection croisée archives et références; **E268** échéances/suivi sans source inventée.

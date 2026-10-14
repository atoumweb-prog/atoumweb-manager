# Lot 09 — Facturation, Dépenses, Documents & Contrats
**Statut : spécification cible.**
## Facturation
Manager prépare/suit les éléments et PDFs Abby, **n'émet pas** lui-même un document officiel Abby ; vues à facturer/à rapprocher/en attente selon vrais statuts ; référence, montant, PDF, date, source et dossier liés. Ne pas inventer paiements, encaissements ou sources non implémentées (UX-14).
## Dépenses
Liste+fiche/formulaire court : date, montant, catégorie, fournisseur, justificatif, rattachement Client/Projet ; champs avancés progressifs ; dépenses récurrentes, échéances, statuts et pièces actuelles préservés.
## Documents & Contrats
**Navigation visible** Bibliothèque contractuelle / Éditeur contractuel / Documents clients / Autres documents.
Archive avec classement, recherche, import, ouverture, conservation, archivage/restauration/suppression protégée ; devis acceptés et preuves figés. Contrats types dans bibliothèque centrale (voir Lot 05), pas enfouis parmi fichiers génériques.
Word sur tous textes **éditables** : export, édition hors Manager, import, aperçu différences, validation humaine, nouvelle version ; PDF présentation et archivage ; ne jamais réimporter sur historique figé ; avertir pertes de format.
## Ordre proposé
[09A audit et écarts réels](LOT-09A-AUDIT-FINANCES-DOCUMENTS.md) ; [09B facturation/Abby](LOT-09B-FACTURATION-ABBY.md) ; [09C dépenses/échéances](LOT-09C-DEPENSES-ECHEANCES.md) ; [09D documents/archives/preuves](LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md) ; [09E Word/PDF avec diff](LOT-09E-WORD-PDF-ALLER-RETOUR.md) ; [09F recette transverse](LOT-09F-RECETTE-ET-INTEGRATION.md). **Ces six sous-lots sont des spécifications, pas des fonctionnalités implémentées.**
## Recette
Source de facture traçable et Abby non simulé ; pièce dépense récurrente préservée ; document client protégé impossible à écraser par Word ; changement de contenu sur modèle versionné seulement après relecture.

## État réellement audité le 09/10/2026
- **Présent** : éléments BillingHandoff (source, statut, montant attendu, lien PDF officiel, référence/date), écran BillingPage, import du PDF Abby (sans API payante) ; Dépenses avec coûts, statuts, récurrence déclarée, TVA et justificatif courant ; Documents Clients avec SHA, import, classement, archive, historique de pièces de Devis accepté protégé ; Bibliothèque contractuelle via ContractLibraryPage.
- **E259 : écart de conservation prioritaire** : ClientDocumentService.deletePermanently protège les PDF de Devis liés, mais **pas explicitement** le lien billing_items.invoice_document_id vers un document Facture. La FK ON DELETE SET NULL permet de rompre la pièce d'un item marqué invoiced. **Aucun correctif appliqué à ce stade**.
- **E258 : justificatif Dépense** : remplacement de la référence active sans historique de versions rattachées attesté. Le fichier précédent pourrait subsister sur disque sans être listé.
- **E260 : aller-retour Word** : seule l'importation brute de DOCX comme fichier est attestée; export de textes modifiables, comparaison structurée et réimport validé restent **à développer**, jamais sur contrat signé ou Devis gelé.
- **UX-14** : statuts Billing planned/ready/invoiced/cancelled/offered et sources enum existantes, **aucun état de paiement/encaissement**; Dépense paid est déclaratif, pas preuve bancaire.
- **Bilan** : **six dossiers 09A–09F, 108 scénarios de recette futurs (14+17+17+18+17+25)**. Aucun test métier/UI exécuté et aucun fichier, code ou compte Abby modifié par cette documentation. Commits [skip ci].

## Raccord Lot 10 — chiffres fiables et sécurité
[10A registre des métriques](LOT-10A-AUDIT-INDICATEURS.md) et [10B](LOT-10B-STATISTIQUES-NAVIGATION.md) distinguent **facturé suivi PDF Abby** (somme des montants attendus enregistrés en facturation) de **CA encaissé**, absent faute de source paiement. Ne pas transformer une dépense `paid` déclarative en relevé bancaire. [10C](LOT-10C-SAUVEGARDES-RESTAURATION.md) conserve la distinction entre **backup SQLite** et **archives de documents Clients** : une restauration technique de la base n'atteste pas automatiquement la présence ou l'intégrité de ses PDFs. **E259** (PDF facture lié supprimable) reste prioritaire et indépendant de ces statistiques.

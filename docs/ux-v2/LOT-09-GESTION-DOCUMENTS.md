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
09A audit source/statuts ; 09B facturation ; 09C dépenses ; 09D documents/archives ; 09E pipeline Word/PDF ; 09F recette transversale.
## Recette
Source de facture traçable et Abby non simulé ; pièce dépense récurrente préservée ; document client protégé impossible à écraser par Word ; changement de contenu sur modèle versionné seulement après relecture.

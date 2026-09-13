# Découpage des issues — Phase 1 CRM

Ce document décrit le découpage recommandé. Les numéros GitHub réels sont créés séparément.

## A. Fondation données CRM

- migration Organizations / Contacts / Client Accounts / Prospects ;
- client contact roles ;
- repositories ;
- validations ;
- tests DB ;
- normalisation du journal d’activité.

Dépend de la fondation Electron/SQLite.

## B. Prospects

- services métier ;
- Kanban ;
- fiche prospect ;
- prochaine action ;
- gagné/perdu ;
- tests.

Dépend de A.

## C. Clients

- liste Clients ;
- fiche Résumé / Contacts / Commercial / Historique ;
- conversion prospect → client ;
- archivage/réactivation ;
- tests.

Dépend de A et partiellement de B.

## D. Recherche globale

- `search_documents` dérivé ;
- réindexation transactionnelle ;
- reconstruction complète ;
- UI de résultats groupés ;
- navigation vers Prospect/Client/Contact ;
- tests.

Dépend de A ; peut avancer en parallèle des UI B/C une fois les repositories stables.

## E. Validation Phase 1

- parcours prospect entreprise ;
- parcours prospect particulier ;
- perte ;
- conversion idempotente ;
- client archivé/réactivé ;
- recherche ;
- trois thèmes ;
- états vides ;
- documentation et `PROJECT_STATUS.md`.

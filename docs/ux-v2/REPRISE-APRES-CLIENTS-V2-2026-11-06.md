# Reprise après Clients UX/UI V2 — 06/11/2026

## État officiel et référence Git

**Clients V2 — Refonte ergonomique validée le 06/11/2026.** Carlos a examiné la galerie24 captures et les3 captures correctives. Liste, fiche rapide, fiche agrandie, huit onglets et formulaires sont acceptés visuellement. Il ne reste aucune correction ergonomique demandée dans ce périmètre. La clôture ne certifie pas tous les parcours fonctionnels ni l’ensemble du CRM.

- Worktree Client : `C:/Users/AtoumWeb/.codex/worktrees/client-v2-ab-20261104/atoumweb-manager-ec04-validation`.
- Branche dédiée : `codex/client-v2-ab-20261104` ; distant autorisé : `origin`, dépôt `atoumweb-prog/atoumweb-manager`.
- SHA de base vérifié : `9ca5a7edf10f50b3a688e11f76e0c929b6bc82b1`.
- Commit de clôture : `feat(clients): finaliser la refonte UX/UI Clients V2`, contenant ce fichier. Son SHA exact est fourni dans le rapport final de la conversation et se retrouve sans ambiguïté avec `git log -1 --format=%H -- docs/ux-v2/REPRISE-APRES-CLIENTS-V2-2026-11-06.md`. Le fichier inclus dans ce même commit ne peut pas contenir son propre SHA sans le modifier ; aucun second commit auto-référent prévu.
- Autorisation de cette session : commit et push normal de cette seule branche. Aucune fusion main, aucune PR, aucune synchronisation des autres worktrees autorisée. L’autorisation ne se prolonge pas à un futur chantier.

## Décisions graphiques et fonctionnalités conservées

- Noir/Confort, logo officiel, shell Accueil V2 et cohérence Prospection. Option A : liste pleine largeur sans sélection, panneau rapide contextuel à droite après sélection, un seul tableau avec colonnes/vues/largeurs enregistrées compatibles.
- Fiche agrandie Identité / Travail / Associations, volets repliables et redimensionnables, adaptation responsive. Huit onglets montés et état conservé : Résumé, Contacts, Commercial, Contrats, Projets, Interventions, Documents, Historique.
- Résumé synthétique sans recopier les dossiers : note de relation dans Gestion de la relation, Actions rapides masquée seulement si vide, Programmer une action accessible. Projets n’est pas une maintenance.
- Contacts : cartes lisibles et modes créer/rattacher, Annuaire source unique, contact principal distinct des moyens préférés. Aides adaptées ; garde local contre un nouveau lien d’une personne déjà rattachée, message vers Modifier la personne. Service multi-rôles inchangé, même personne/même rôle idempotent.
- Commercial : devis et statuts réels, référence et objet distincts ; pas de nouveaux indicateurs ambigus ou de Nouveau devis décoratif. Contrats : engagements, ventes/services, dates et montants réellement sourcés ; aucun renouvellement déduit d’une acceptation ni d’un jalon.
- Projets : états français, compteur et filtre unique, avancement des éléments requis terminés, jamais du temps consommé. Phases/tâches/temps détaillés restent dans Projets.
- Interventions : synthèse opérationnelle, maintenance et packs existants ; prix/engagements demeurent dans Contrats.
- Documents : recherche/filtre/import distincts, archives, titre/conservation V2, disponibilité et intégrité séparées de l’archivage. Aucun badge de signature/protection déduit d’un titre ou d’un hash. Historique en consultation sur événements existants, sans agrégation activity_log.
- Associations : compteurs réels, dossiers exacts, repli contextuel réversible avec priorité au choix manuel. Aperçu Devis privilégie les non-acceptés ; Devis acceptés reste distinct et les totaux ne sont pas artificiellement réduits. Fiche rapide : Devis et projets liés.
- Formulaires, validation, brouillons et protections de sortie/concurrence conservés. Bouton de remplissage TEST désormais réservé par décision du processus principal à Electron non empaqueté sur workspace exact Validation-MSI ; masqué/refusé ailleurs. Notes élargies sans changement de règle.

## Registre CLIENT-01 à CLIENT-18 — état actuel

Ce récapitulatif actualise la validation visuelle ; les matrices et étapes historiques de PROJECT_STATUS.md sont conservées. Aucun report métier n’est déclaré résolu par la seule validation ergonomique.

| Point | État au 06/11/2026 et suite conservée |
|---|---|
| CLIENT-01 | Badges Principal dédupliqués, présentation validée ; rôle et contact principal restent distincts, aucune règle de service réécrite. |
| CLIENT-02 | Accès unique aux coordonnées avancées réalisé et validé, éditeur et protections conservés. |
| CLIENT-03 | Ouvert : création d’un devis depuis Client avec rattachement fiable à étudier dans Devis. |
| CLIENT-04 | Ouvert : définitions métier de À traiter et Clôturés à arbitrer, aucune classification arbitraire ajoutée. |
| CLIENT-05 | Finition du Résumé réalisée et validée : synthèse commerciale sourcée, note dans Gestion de la relation, rubrique vide masquée et raccourci Projets hors maintenances. Aucun nouvel agrégat financier. |
| CLIENT-06 | Partiel : projection consultative conservée, catégorie Devis acceptés clarifiée ; consolidation engagements/ventes/services et périodes réelles reste ouverte. |
| CLIENT-07 | Ouvert : renouvellement, accord exprès, préavis, résiliation et échéances contractuelles à concevoir/arbitrer. Aucun jalon de livraison assimilé à une échéance. |
| CLIENT-08 | Partiel : montants sourcés et unités connues affichés ; agrégation initial/récurrent et multi-périodes toujours reportée. |
| CLIENT-09 | Partiel : besoins existants consultables ; opportunités et ajout de propositions complémentaires à concevoir, aucune vente déduite. |
| CLIENT-10 | Consultation et présentation validées : devis accepté, attestation, document et signature distingués ; réserves natives documentaires CLIENT-16 maintenues. |
| CLIENT-11 | Partiel : lignes acceptées sans suivi et états terminés/archivés issus des sources visibles ; consolidation de l’historique des arrêts et motifs non fournis toujours ouverte. |
| CLIENT-12 | Présentation réalisée et validée : Associations contextuelles, repli manuel prioritaire, aperçu Devis non acceptés sans répéter les acceptés ; totaux et accès complets conservés. |
| CLIENT-13 | Sélecteur Projets unique réalisé et validé ; tous les états et archives accessibles, progression inchangée. |
| CLIENT-14 | Documents refondu et validé graphiquement ; fonctionnalités et réserves CLIENT-16 conservées. |
| CLIENT-15 | Éditeur documentaire V2 réalisé et validé graphiquement ; brouillons/tests TEMP vérifiés, réserves de recette native CLIENT-16 conservées. |
| CLIENT-16 | Partiel : disponibilité, intégrité et protections testées en service/TEMP ; dialogues Windows, ouverture fichier/dossier réelle et conditions natives restent à vérifier. |
| CLIENT-17 | Largeurs, lisibilité et défilement réalisés et validés : minima d’affichage300/240px, centre640px avant compact, préférences non écrasées, redimensionnement conservé. |
| CLIENT-18 | Ouvert : étude distincte de l’agrégation des journaux métier activity_log, rattachements, doublons, conservation et liens ; aucune agrégation ajoutée. |

Autres réserves conservées : périodes opérationnelles réelles de maintenance non couvertes par la fixture, alerte des packs proches d’expiration à vérifier d’abord dans l’existant puis arbitrer si nouvelle ; navigation précédent/suivant et menu Actions non développés. Ne pas rouvrir Associations ni reconstruire les écrans validés sans nouvelle demande.

## Contrôles existants et preuves locales

Aucun nouveau test ni nouvelle capture nécessaire pour cette clôture documentaire/Git. Résultats déjà obtenus, sans prétendre à une campagne globale : typecheck réussi ; derniers contrôles4 tests de politique TEST et24 assertions Electron ciblées ; passe ergonomique précédente41 contrôles Electron,12 tests crmRecordPresentation et7 tests de protection ClientDocumentService. Les contrôles d’autres onglets figurent dans PROJECT_STATUS.md ; ne pas additionner les campagnes comme si elles prouvaient une certification globale.

Les écritures de recette utilisent uniquement des bases TEMP isolées. Atelier des Fleurs et les clients RGPD/historique ont été ouverts en lecture seule, empreintes SQLite identiques avant/après. Atelier Horizon est la recette TEST existante du dépôt rejouée en TEMP ; pas une base utilisateur enrichie. Les handoffs shell et confirmations interceptés ne valent pas validation native Windows.

Preuves locales hors Git à conserver :
- `outputs/ClientsV2-Revue-2026-11-06-1793928812746/index.html`,24 PNG et ZIP frère.
- `outputs/ClientsV2-Corrections-finales-1793932749258/index.html`,3 PNG et récapitulatif.
- `outputs/ClientsV2-Trois-captures-finales.zip`.

Les scripts sources de recette sont intégrés ; les captures, ZIP, bases, profils, données utilisateur, secrets et artefacts TEMP sont exclus du commit.

## Autres worktrees à préserver

Ne pas nettoyer, synchroniser, déplacer ou modifier un autre worktree pour commencer la suite.

- Sites & Pages lot2 non commité : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ux-home-shell-lot1-20261103`, branche `codex/ux-v2-sites-pages-lot2-20261103`, base `9ca5a7edf10f50b3a688e11f76e0c929b6bc82b1`. Modifications et fichiers non suivis à préserver intégralement.
- Référence visuelle : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ux-reference-20261104`, branche `codex/ux-v2-visual-reference-20261104`.
- Checkout historique : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation`, branche `codex/internal-reference-handoff-20261027`.
- Contrats/Catalogue : `C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-contract-audit-20261031`, branche `codex/v38-contract-catalog-finalization-20261102`.
- Les autres worktrees listés par `git worktree list` sont indépendants. Aucun changement de branche/main n’est demandé par cette passation.

## Méthode et prochaine conversation — Offres & Tarifs

**Inventaire fonctionnel ciblé → capture Electron réelle → maquette ChatGPT → validation humaine → développement ciblé → vérifications et validation visuelle.**

Commencer la nouvelle conversation par ce fichier et AGENTS.md, puis PROJECT_STATUS.md, le cahier des charges et la reprise courte UX, dans l’ordre applicable. Vérifier branche/HEAD/statut avant toute modification et déterminer le checkout approprié sans écraser les travaux locaux. Ne pas reprendre l’historique complet ni relancer un audit général.

Prochaine page : **Offres & Tarifs**, étude seule à autoriser dans la nouvelle conversation. Offres et prix sont en finalisation ; cela ne bloque pas la réflexion ergonomique sur présentation, navigation, filtres, tableaux et formulaires. Conserver les sources réelles du Catalogue ; aucun prix codé en dur, aucune modification de tarif publié ni de devis/contrat historique. Ne pas commencer ce développement pendant la clôture Clients. Tout futur commit/push/PR/fusion exige les autorisations propres à ce nouveau chantier.

## Inventaire des fichiers intégrés à la clôture

Les adaptations communes (tableau, cadre CRM, rail, bootstrap) sont les dépendances nécessaires au parcours Client, pas une refonte des autres modules. Aucun fichier du lot Sites & Pages n’est inclus.

```text
PROJECT_STATUS.md
docs/ux-v2/REPRISE-APRES-CLIENTS-V2-2026-11-06.md
scripts/capture-client-gallery.cjs
scripts/check-client-commercial.cjs
scripts/check-client-contacts.cjs
scripts/check-client-contracts.cjs
scripts/check-client-documents.cjs
scripts/check-client-ergonomics.cjs
scripts/check-client-expanded.cjs
scripts/check-client-history.cjs
scripts/check-client-interventions.cjs
scripts/check-client-projects.cjs
scripts/check-client-review-final.cjs
scripts/check-client-v2-ab.cjs
scripts/fixtures/client-ab-scenarios.cjs
scripts/fixtures/client-commercial-scenarios.cjs
scripts/fixtures/client-contacts-scenarios.cjs
scripts/fixtures/client-contracts-scenarios.cjs
scripts/fixtures/client-ergonomics-scenarios.cjs
scripts/fixtures/client-expanded-scenarios.cjs
scripts/fixtures/client-gallery-views.cjs
scripts/fixtures/client-review-final.cjs
src/main/clientTestFillPolicy.test.ts
src/main/clientTestFillPolicy.ts
src/main/ipc.ts
src/renderer/App.tsx
src/renderer/crm/ClientAssociations.tsx
src/renderer/crm/ClientCommercialSummary.tsx
src/renderer/crm/ClientCommercialTab.tsx
src/renderer/crm/ClientContractsPanel.tsx
src/renderer/crm/ClientDetailIcon.tsx
src/renderer/crm/ClientDocumentsPanel.css
src/renderer/crm/ClientDocumentsPanel.tsx
src/renderer/crm/ClientHistoryTab.tsx
src/renderer/crm/ClientOperationsTab.css
src/renderer/crm/ClientOperationsTab.test.ts
src/renderer/crm/ClientOperationsTab.tsx
src/renderer/crm/ClientProjectsTab.tsx
src/renderer/crm/ClientQuickSummary.tsx
src/renderer/crm/ClientsPage.tsx
src/renderer/crm/ClientsPageV2.css
src/renderer/crm/CrmPaneSeparator.tsx
src/renderer/crm/CrmRecordLayout.tsx
src/renderer/crm/client-commercial-v2.css
src/renderer/crm/client-contacts-v2.css
src/renderer/crm/client-contracts-v2.css
src/renderer/crm/client-expanded-v2.css
src/renderer/crm/client-history-v2.css
src/renderer/crm/client-list-quick-v2.css
src/renderer/crm/client-projects-v2.css
src/renderer/crm/crm-record-layout.css
src/renderer/main.tsx
src/renderer/ui/ConfiguredDataTable.tsx
src/renderer/ui/NavigationRail.tsx
src/shared/clientEngagementPresentation.test.ts
src/shared/clientEngagementPresentation.ts
src/shared/clientPresentation.test.ts
src/shared/clientPresentation.ts
src/shared/contracts.ts
src/shared/crmRecordPresentation.test.ts
src/shared/crmRecordPresentation.ts
```

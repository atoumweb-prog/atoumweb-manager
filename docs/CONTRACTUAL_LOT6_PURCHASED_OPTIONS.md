# Lot 6 — Validation et clôture locale dédiée — 03/10/2026

- AtoumWeb valide le bilan réel et autorise le **commit local dédié Lot 6 — options réellement achetées**, sans push ni merge. Le commit contenant ce bloc clôture localement le Lot 6 ; son SHA et la liste exhaustive des fichiers sont consignés dans outputs/contract-options-lot6/cloture-git-lot6.json.
- Migration **57 appliquée sur Validation-MSI** ; quote_option_purchases présente et **vide**. Aucun backfill historique, aucune requalification implicite, aucune publication catalogue/contractuelle ni création de Projet/Site/Page/pack/maintenance.
- Contrôle avant commit : **24 fichiers Lot 6 attendus uniquement**, index initialement vide ; 335 sources applicatives identiques à la fermeture validée **459/459 tests, typecheck OK et UI 20/20**. Aucun changement fonctionnel depuis ces contrôles ; seules trois documentations de suivi actualisées.
- Aucun artefact de sauvegarde/simulation/base/classeur inclus ; les scripts de simulation/contrôle prévus font partie du code Lot 6, leurs sorties demeurent hors dépôt.
- Validation-MSI demeure au SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens, devis historiques, Projets et documents conservés.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 7 non commencé.** Aucun démarrage Manager ni écriture base pendant cette clôture. Aucun push/merge, publication, Abby, Bridge ou 8C.


---

## Historique : application réelle avant validation de clôture

# Lot 6 — Application réelle sur Validation-MSI — 03/10/2026

Ce checkpoint remplace le statut de préparation ci-dessous, conservé comme historique.

- AtoumWeb autorise l'application réelle du Lot 6 uniquement, migration **57**, après validation 459/459 tests, typecheck OK et UI 20/20. **Application terminée, aucun commit autorisé à ce stade ; attendre validation du bilan réel.**
- Branche feature/project-page-compositions-v1, HEAD **fa52b68911d8649013a4a4e40e19d91a56d0c6e6** inchangé. Les 24 fichiers Lot 6 et leurs empreintes correspondent exactement à la fermeture validée avant écriture ; 335 sources applicatives contrôlées. Aucun code fonctionnel changé, aucune suite répétée inutilement.
- Manager non démarré. Base initiale 1–56 au SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide, SHM de verrou 32 768 octets, aucun journal actif sous verrou.
- Sauvegarde physique immédiatement avant application sous verrou : C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot6-2026-10-03T19-57-38-123Z.sqlite, SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, identique à la base avant. Intégrité de la sauvegarde vérifiée indépendamment en lecture immutable.
- Jeton du plan **7a5e7f86e43f15c815ec437ec102ac51f0a07d1dafd351332fea4fc5eb4d286f** revérifié juste avant migration ; empreintes du plan, de la base, du XLSX, des sources et des preuves de tests inchangées. Aucune autre migration pendante acceptée.
- Migration **57 seule appliquée** : migrations **1–57** présentes ; quote_option_purchases et ses trois triggers créés, **0 achat**, aucun backfill/requalification historique.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts**. 0 nouvelle publication ; les 44 versions catalogue publiées anciennes demeurent inchangées. 0 lien catalogue BASE, LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE hors bibliothèque.
- Conservation exhaustive des **99 anciennes tables**, colonnes, lignes et objets de schéma : toutes les empreintes avant/après identiques, hors nouvelle ligne de migration 57. DEV-2026-001/002/003 et leurs deux lignes chacun strictement inchangés ; 0 clause rétroactive. Deux Projets et état documentaire exacts ; aucun Projet/Site/Page/pack/maintenance/objet opérationnel créé.
- integrity_check **ok**, foreign_key_check **vide** ; rejeu migration **[]**, aucune modification logique ni physique. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; aucun WAL/SHM/journal résiduel.
- Contre-vérification indépendante Python/SQLite mode=ro immutable réussie contre la sauvegarde. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** conservé ; aucune modification Abby, Bridge ou 8C.
- Rapports : outputs/contract-options-lot6/application-lot6-validation-msi.md/json, contre-verification-lot6.json et fermeture-reelle/plan-application-lot6.json.
- **Lot 6 appliqué, non committé. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Aucun push/merge. Lot 7 non commencé. Attendre validation du bilan avant commit local.**


---

## Historique de préparation locale et simulation (avant autorisation réelle)

# Lot 6 — Options réellement achetées

03/10/2026. Préparation locale uniquement. Recette manuelle AtoumWeb à faire avant validation fonctionnelle finale.

## Constat et architecture

ContractTermsService et ProjectService ignorent déjà les composants facultatifs des offres. Ils prennent en compte les services réellement vendus sur une ligne. Aucun second moteur ni composition de blueprints supplémentaire n'est créé.

Le manque corrigé : achat sans provenance affiliée explicite et refus de duplication brouillon.

**Migration 57 — explicit_quote_option_purchases**, uniquement sur copie. SQL des migrations 1–56 inchangé ; aucun backfill.

| Donnée | Source unique |
|---|---|
| État acheté | quote_option_purchases.state=purchased ; relation par ligne persistée |
| Offre/version source | source_offer_item_id / source_offer_version_id |
| Ligne d'offre du devis | source_offer_line_id |
| Composant facultatif exact | source_component_id, également identifié dans la composition figée |
| Service AW/version vendue | quote_lines.catalog_item_id/catalog_version_id et snapshot_json |
| Quantité | quote_lines.quantity_milli |
| Prix catalogue/proposé/remise/motif | colonnes existantes de quote_lines |
| Preuve figée | snapshot.lines[].option_purchase + ligne/snapshot catalogue exacts |

Unicité ligne d'offre/composant ; FK et validation SQL même devis/bon composant facultatif/service/version ; origine immuable. Retrait explicite de la relation puis de la ligne, aucun effacement implicite en cascade. Absence de relation = origine optionnelle non enregistrée, y compris lignes manuelles et historiques ; jamais déduite depuis nom ou service identique.

L'achat porte sur la version exacte du composant, publiée/active selon le garde-fou existant. Aucune substitution implicite par une version plus récente.

## Comportements

| Cas | Résultat |
|---|---|
| Option seulement disponible | Aucun prix, clause, contribution, prérequis de vente ou provenance d'achat |
| Achat | Ligne distincte avec origine complète, quantité, prix proposé/remise |
| Rejeu achat/retrait | Même résultat, zéro mutation et aucun doublon |
| Retrait avant gel | Relation/ligne retirées, garantie liée nettoyée, montant recalculé, clauses synchronisées |
| Retrait de l'offre | Options affiliées retirées ; lignes manuelles conservées |
| Même service ajouté manuellement | Ligne distincte ; aucune fusion ; clauses dédupliquées |
| Duplication brouillon | Nouveau brouillon, lignes d'offre remappées, provenance/quantité/prix/version conservés |
| Finalisé/accepté | Contrôles absents et opérations refusées ; origine d'achat dans snapshot ; suppression silencieuse protégée |
| Historique sans componentId | Pas de reconstruction ou requalification ; achat affilié depuis cette ancienne composition refusé |

Clauses générées retirées : orphelines/désactivées par le moteur existant. Texte adapté humainement : conservé et signalé orphelin dans le Builder, décision humaine requise. Autre ligne achetée déclenchante : clause maintenue/dédupliquée.

Prérequis optionnels : dans le snapshot de la ligne achetée, consultables depuis sa provenance ; aucun ajout implicite aux conditions rédigées du devis. Les prérequis de vente disparaissent avec cette ligne.

## Interface

L'éditeur du devis enregistré expose Services inclus et options, puis Disponible · non achetée / Achetée avec quantité/montant.

Ajouter ouvre l'éditeur de ligne existant. Seul Enregistrer la ligne persiste l'achat via IPC ; prix sur devis requis si applicable. Modifier conserve l'origine ; Retirer enlève la ligne. Erreur serveur visible, aucun achat local fictif.

Provenance consultable : offre/version, service AW/version, prix catalogue/proposé/remise, prérequis. Aucun long identifiant en libellé principal.

Après gel : aucune commande d'achat/retrait/modification. Ancienne composition sans identité : information d'absence historique, aucun bouton de requalification. Duplication brouillon disponible.

Aperçu/PDF des nouveaux devis : périmètre vendu exclusivement, services inclus et lignes achetées ; options disponibles exclues. Présentation des anciennes compositions sans identité conservée historiquement.

## Tests

- **459/459 tests**, 60 fichiers, zéro échec.
- **16 nouveaux tests Lot 6** : non-achat, achat, retrait/rejeu, déduplication, service manuel indépendant, provenance/prix/quantité, duplication avec/sans achat, original inchangé, gel/bibliothèque modifiée, historique/acceptation ultérieure, retrait offre/garanties, refus mauvais composant/version inactive, migration idempotente et résolveur Projet existant sans multiplication.
- Typecheck : sortie 0.
- UI React réelle dans Chromium/Electron masqué, profil isolé/IPC simulé : **20/20**, trois thèmes, pas de débordement, achat/retrait/modification/erreur/gel/historique/vide ; capture examinée.
- Régressions de migration 53/55/56 : listes attendues complétées par 57, SQL historique inchangé. Les premiers échecs étaient ces anciennes assertions ; dernière suite verte.

## Simulation uniquement sur copie

Rapports détaillés : outputs/contract-options-lot6/simulation-lot6.md/json.

| Scénario synthétique | Lignes persistées | Options achetées | Total | Clauses actives |
|---|---:|---:|---:|---:|
| Offre, options seulement disponibles | 1 | 0 | 100 euros | 1 |
| Même offre et une Page | 2 | 1 | 120 euros | 3 |
| Même offre, 3 Pages et 2 SEO | 3 | 2 | 208,60 euros | 3 |

Diff disponible → acheté : +1 ligne/+20 euros/+2 clauses/+1 provenance. Multi : +2 lignes/+108,60 euros/+2 clauses dédupliquées/+2 provenances. Aucun objet opérationnel créé.

Page fixture catalogue 20 euros ; multi : proposé 18 euros ×3, remise 10 % = 48,60 euros. SEO 30 euros ×2 = 60 euros.

Publications exclusivement synthétiques sur copie : 4 catalogue, 3 clauses, 3 blueprints. Aucun vrai brouillon V1 publié. Contributions futures affichées par ligne, sans développement Lot 7 ni multiplication des Pages/Sites.

Contrôles : 99 tables antérieures identiques après migration ; 16 tables métier avec chaque ancienne ligne conservée après scénarios ; migration/achat rejoués sans mutation ; duplication/retrait sans changer l'original ; integrity_check=ok, foreign_key_check vide.

Base réelle en 1–56 : 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens. DEV-2026-001/002/003, projets/documents inchangés ; aucun devis synthétique réel.

SHA avant/après identiques :
- Validation-MSI : **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**
- XLSX : **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**

Isolation : premier essai SQLite read-only ayant créé un WAL vide/SHM sans changer la base. Auxiliaires identifiés et retirés après fermeture/contrôles. Script final sans connexion SQLite source : lecture/copie binaire hachée avec contrôle WAL/SHM, connexion SQLite seulement sur copie jetable. Aucun auxiliaire résiduel ; aucune écriture de données ou migration réelle.

## Risques / limites réservés

1. Recette humaine encore à faire. UI automatisée avec IPC simulé ; services réellement testés en SQLite isolé.
2. Vrais 112 catalogue/118 clauses toujours BROUILLON : vente/finalisation refusées tant que prérequis manquent. **Ne pas démarrer Manager sur Validation-MSI : migration 57 pendante non autorisée.**
3. Anciennes compositions sans componentId : achat affilié refusé ; pas de requalification tacite. Une nouvelle offre/version ou un service manuel est une décision visible.
4. Version de service source retirée/inactive : nouvel achat refusé, aucun choix de version inventé ; achats déjà enregistrés/dupliqués conservent leur version.
5. Adaptations humaines orphelines signalées, décision Builder requise.
6. Quantités seulement sur lignes ; blueprints composés, Pages/Sites multiples, packs/maintenance/orchestration réservés au Lot 7 ou ultérieurs.
7. Duplication ne transpose aucune preuve/finalisation/acceptation comme nouvelle preuve ; vérifier la préparation du nouveau brouillon.

## Commandes

- npm test
- npm run typecheck
- node scripts/check-quote-options-ui.cjs --output DOSSIER
- node scripts/simulate-quote-options.cjs --database BASE_LOT5 --workbook XLSX --output DOSSIER

## Arrêt

**Lot 6 préparé, non appliqué à Validation-MSI, aucun commit/push/merge. Aucun Lot 7, publication, Abby, Bridge ou 8C. Attendre validation AtoumWeb et instruction distincte.**

## Fichiers Lot 6

- PROJECT_STATUS.md
- docs/MANAGER_BRIDGE_ROADMAP.md
- src/main/commercial/ContractLibraryImportService.test.ts
- src/main/commercial/QuoteContractPreparationService.test.ts
- src/main/commercial/QuoteContractPreparationService.ts
- src/main/commercial/QuoteService.ts
- src/main/commercial/quotePdf.ts
- src/main/database/catalogIdentityV1Migration.test.ts
- src/main/database/migrations.test.ts
- src/main/database/migrations.ts
- src/main/ipc.ts
- src/preload/preload.ts
- src/renderer/commercial/QuoteClientPreview.tsx
- src/renderer/commercial/QuotesPage.tsx
- src/shared/commercial.ts
- docs/CONTRACTUAL_LOT6_PURCHASED_OPTIONS.md
- scripts/check-quote-options-ui.cjs
- scripts/simulate-quote-options.cjs
- scripts/simulate-quote-options.ts
- src/main/commercial/QuoteOptions.test.ts
- src/main/database/quoteOptionsMigration.ts
- src/main/testSupport/quoteOptionsFixture.ts
- src/renderer/commercial/QuoteOfferOptionsPanel.css
- src/renderer/commercial/QuoteOfferOptionsPanel.tsx

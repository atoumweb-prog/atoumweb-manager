# Lot 8A — actions opérationnelles et temps : bilan de préparation

Date : 04/10/2026. **Le bilan ci-dessous est le snapshot de préparation validé.**

Mise à jour de clôture : migration **60 seule appliquée et validée**, cinq tables vides, aucun import/modèle réel/ready/Vitrine V2 ni raccord commercial. Validation-MSI en **1–60**, SHA `fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8`. Commit local dédié autorisé, sans push/merge ; recette manuelle à faire. Le bilan d’application réel et les preuves indépendantes sont conservés dans `outputs/operational-lot8a/application-migration60-validation-msi.md/json` et `contre-verification-migration60.json`. Les mentions « préparé seulement » ci-dessous décrivent l’état antérieur ; aucune conclusion historique n’est supprimée. Le raccord réel des associations reste non commencé.

Branche : `feature/project-page-compositions-v1`. HEAD inchangé : `378f11568cddc462e29df6117425631e03e89b80`.

## 1. Périmètre et conservation

Le moteur prépare les actions d’un Projet prévisionnel depuis ses lignes réellement vendues. Les tâches restent des `project_nodes` ; les phases sont des conteneurs. Le chrono reste `time_sessions`, avec son calcul existant hors pauses. La préparation est intégrée aux révisions commerciales du Lot 7B, à l’acceptation du même Projet et au chemin de conversion directe d’un devis accepté.

**Validation-MSI reste en migrations 1–59. Migration 60 uniquement testée sur copies.** Aucun démarrage du Manager sur cette base, backfill, publication réelle, modification Bridge, Abby, Lot 8B ou 8C. Les devis DEV-2026-001/002/003, les deux Projets historiques, Sites/Pages, documents, provenance et sessions historiques sont préservés.

Empreinte source SQLite : `c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc`.

Empreinte XLSX : `c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf`.

## 2. Audit des blueprints et source unique de production

L’audit exhaustif des deux blueprints existants a trouvé 14 tâches : 13 dans Vitrine V1, totalisant 525 minutes, et une tâche historique sans estimation ni référence AW dans Projet standard V1. La matrice complète comporte les 112 références AW ; seul AW-WEB-VITRINE possède actuellement une liaison blueprint. Les 111 autres références n’ont pas de destination structurelle inventée.

Vitrine : une nouvelle version **v2 structurelle** est préparée sur copie à partir de la vraie V1 existante. Elle conserve les conteneurs, Site, cinq Pages et leur hiérarchie ; seules les 13 tâches validées sont retirées de cette nouvelle version. Les estimations des conteneurs sont nulles : elles ne constituent pas une seconde réserve de production. La V1 complète publiée et PRO-2026-002 ne sont pas modifiés.

Les deux décisions AtoumWeb sont appliquées comme surcharges documentées du manifeste normalisé, sans changer le XLSX :

- A19 : « création/vérification d’un point de restauration avant publication », 60 minutes inchangées. A21 conserve la sauvegarde finale/de livraison.
- A16 : contrôle du fonctionnement technique du mécanisme de consentement, sans validation juridique de conformité, 60 minutes inchangées. A12 conserve l’intégration des pages légales fournies.

Le manifeste conserve la checklist source, la checklist adaptée et la décision datée. Aucun autre temps, règle de quantité, récurrence ou catégorie métier n’est changé.

Projet standard V1 reste strictement historique, sans association opérationnelle. Aucun rapprochement par nom, libellé ou tâche de validation.

| Combinaison | Résultat |
|---|---|
| V1 complète avec tâches + modèle opérationnel | Blocage explicite |
| V2 structurelle mise en usage + modèle compatible | Autorisé |
| Structure exigeant un modèle mais sans compatibilité | Préparation bloquée/incomplète |
| Projet historique existant | Aucune reconstruction |

La disponibilité opérationnelle de la structure est distincte de sa publication commerciale. V2 reste `draft` dans le système des blueprints et reçoit explicitement `operational_ready=1` dans son profil ; elle devient immuable. La contrainte d’une seule version publiée est conservée et V1 reste publiée. La publication classique de cette structure est refusée pour ne pas remplacer implicitement V1.

## 3. Migration 60 — schéma exact préparé

Nom : `versioned_operational_actions_and_time_snapshots`. Migration additive, sans seed ni import automatique, sans modification des migrations 1–59.

| Élément | Colonnes / contraintes |
|---|---|
| `operational_import_runs` | `id`, `source_sha256`, `payload_sha256` unique, `manifest_json` JSON valide, `created_at` ; provenance non modifiable/non supprimable |
| `operational_model_versions` | `id`, `catalog_item_id` FK restrictive, `canonical_code`, `version_number`, `status` draft/ready par défaut draft, `import_run_id` FK restrictive, `content_sha256`, `model_json`, `created_at` ; uniques item/version et item/hash ; contenu immuable, historique conservé |
| `blueprint_operational_profiles` | `template_version_id` PK/FK restrictive, `mode` historical_complete/structural, `requires_operational`, `provenance_json`, `operational_ready` par défaut 0 ; profil immuable, disponibilité monotone ; nœuds/Sites/Pages de la structure ready protégés contre insertion/modification/suppression |
| `catalog_operational_links` | `id`, `catalog_version_id` FK, `model_version_id` FK, `blueprint_version_id` FK nullable vers profil, `revision`, `provenance_json`, `created_at` ; unique catalogue/révision, liaison immuable et historique conservé |
| `project_action_instances` | `project_id` FK restrictive, `source_key`, `project_node_id` unique/FK restrictive, `initial_snapshot_json` ; PK projet/source ; snapshot initial immuable ; suppression d’une instance ou d’un nœud ayant des sessions interdite |
| `project_nodes.business_category` | Nullable, enum des cinq catégories métier, aucune requalification historique |
| `time_sessions.business_category` | Nullable, même enum, aucune requalification historique |

Les cinq nouvelles tables sont STRICT. Les JSON sont contrôlés. Les anciennes valeurs des tables restent intactes à l’application sur copie ; les deux nouvelles colonnes historiques restent NULL.

Le SQL intégral est dans `src/main/database/projectOperationalMigration.ts` ; l’inscription de 60 dans `migrations.ts` est le seul changement du registre. Les protections applicatives conservent aussi toute action travaillée ou modifiée humainement, même sans session.

## 4. Import et versionnement

Extraction en lecture seule par `scripts/extract-operational-reference.py` : 112 références, 432 actions, 7 feuilles et 768 formules source inchangées. Le manifeste porte le SHA-256 XLSX, la provenance feuille/ligne, les règles, catégories, récurrences, clés et checklists.

| Lot du référentiel | Références | Actions | Usage 8A |
|---|---:|---:|---|
| 8A | 94 | 388 | Préparation possible après mise en usage et compatibilité explicites |
| 8B | 18 | 44 | Import documentaire possible, aucune action activée |
| Total | 112 | 432 | 112 modèles v1 importés en BROUILLON sur copie |

Les trois packs d’heures restent à zéro action de production. Les 22 références 8A à estimation obligatoire gardent le cadrage comme **référence indicative** ; l’estimation finale courante reste NULL tant qu’elle n’a pas été renseignée.

`OperationalReferenceService` réalise le dry-run, contrôle son jeton et importe sous savepoint. Codes AW exacts uniquement ; aucune création catalogue ni correspondance par nom. Les références/modèles inchangés ne sont pas recréés au rejeu. Un contenu différent crée une nouvelle version brouillon, sans modifier l’ancienne. Mise en usage `ready` explicite, indépendante des publications commerciales/contractuelles. La compatibilité catalogue/version blueprint/version modèle est une révision persistée immuable.

L’import et la configuration sont disponibles comme services et outils de préparation ; aucune nouvelle interface d’administration complète d’import/publication n’est revendiquée dans ce lot.

## 5. Génération, quantités et provenance

Une option disponible n’a aucun effet ; seules les lignes persistées, dont les achats explicites du Lot 6, contribuent. Un service ajouté manuellement reste une origine indépendante, sans fusion implicite avec une option homonyme.

La provenance conserve : AW, item/version catalogue vendu, ligne du devis, origine commerciale stable, offre et composant via l’achat d’option lorsque présent, quantité, achat d’option, modèle/version/hash, clé action et unité d’instance, blueprint/version et révision de compatibilité.

Le référentiel décrit le plan par unité vendue. La quantité entière de ligne dimensionne le nombre de plans ; les quantités internes d’un forfait ne sont pas multipliées une seconde fois. Ainsi un pack de quatre articles conserve quatre actions / 780 minutes pour une unité de pack. Une quantité non entière est refusée ; borne de garde 500 unités, sans changement de prix ou de règle métier du XLSX. Les règles Site/Page restent les associations explicites du Lot 7, jamais le nom de la prestation.

Les clés de provenance stables rendent le rejeu idempotent. Une révision commerciale conserve la version opérationnelle et la compatibilité déjà utilisées pour les origines persistantes : une nouvelle version du référentiel ne réécrit pas un ancien Projet. Les nouvelles origines utilisent leur association explicite courante. À l’acceptation, le même Projet et son plan sont figés.

Une prestation non-WEB prépare ses phases, tâches et prérequis sans faux Site/Page ni blueprint web artificiel. Une référence importée sans association opérationnelle prête signale une préparation incomplète au lieu de deviner un modèle.

## 6. Manuel, conflits et historique

Le nom, l’estimation courante, la checklist, la position et le statut modifiés humainement restent conservés. La référence initiale et sa version ne sont pas écrasées. Une modification d’estimation est tracée dans l’activité.

Retrait d’une ligne/quantité : les actions générées vierges peuvent être retirées proprement. Une action modifiée, travaillée ou liée au chrono produit un conflit visible ; conservation/archivage explicites préservent les sessions et la provenance. Aucune suppression physique silencieuse d’un travail. Une réintroduction après décision explicite possède une identité de remplacement traçable, sans réutiliser silencieusement l’action archivée.

Les historiques 1–59 ne reçoivent ni instance opérationnelle, ni estimation initiale inventée, ni catégorie du temps rétroactive.

## 7. UI et chrono

La fiche action distingue référence initiale, estimation courante et temps réel calculé ; expose version, clé, quantité et provenance. Une action exigeant une estimation affiche le manque ; le total Projet est déclaré incomplet, pas présenté comme une estimation finale de cadrage.

L’onglet Temps distingue les catégories métier des catégories techniques development/design/etc. Les cinq catégories sont disponibles dans la fiche action, le chrono global et la saisie manuelle. Avant-vente, Interne et Garantie corrective ne créent aucune réserve de production artificielle. Supplément facturable ne crée ni facture ni intervention.

La session conserve sa catégorie métier enregistrée. Un changement ultérieur d’action ne reclassifie pas ses anciennes sessions ; une correction de session qui n’explicite pas de nouvelle catégorie conserve celle de la session. Les agrégats utilisent les durées du chrono existant hors pauses. Le total réel reste global ; la comparaison à l’estimation de production ne mélange pas automatiquement les autres catégories ou les historiques non classés.

Contrôles UI isolés sur les composants réels React, IPC simulé et trois thèmes Blanc/Noir/AtoumWeb ; aucun lancement Manager ni accès à Validation-MSI. La recette manuelle AtoumWeb reste à faire.

## 8. Résultats et simulation

| Vérification | Résultat |
|---|---|
| Suite complète `npm test` | **534/534**, 63 fichiers, 0 échec |
| Nouveaux tests opérationnels | **31** scénarios de non-régression |
| `npm run typecheck` | **OK**, sortie 0 |
| UI isolée | **69/69**, 0 échec, trois thèmes |
| SQLite sur copie | **209/209**, intégrité OK, FK vide |
| Rejeu migration / import / synchronisation | Sans modification logique ; sources intactes |
| `git diff --check` | OK |

Les tests couvrent la référence immutable, pause et temps réel, catégories historisées, options non achetées/achetées, quantités, compatibilité structurelle, publication indépendante, versions, historique, non-WEB, acceptation et conflits.

| Scénario | Actions | Référence | Estimation courante | Sites/Pages |
|---|---:|---:|---|---|
| Vitrine seule | 21 | **24 h 30** | 24 h 30 | 1 / 5 |
| Vitrine + Page supplémentaire ×2 achetée | 29 | **28 h** | 28 h | 1 / 7 |
| Précédent + Blog | 34 | **31 h** | 31 h | 1 / 8 |
| Pack 4 articles SEO | 4 | **13 h** | 13 h | 0 / 0 |
| Application sur mesure | 3 de cadrage | **3 h indicatives** | Absente, Projet incomplet | 0 / 0 |
| Pack d’heures ou abonnement 8B | 0 activée | Aucun temps de production activé | Sans réserve générée | Aucun objet 8B |

L’indication technique 0 dans l’agrégat numérique de l’application signifie aucune estimation courante renseignée ; les tâches restent NULL et le drapeau d’incomplétude est true. Elle ne signifie pas une estimation finale nulle.

La simulation importe 112 vrais modèles en draft, puis utilise sept références commerciales synthétiques AW-TEST* et le **vrai blueprint Vitrine existant**, cloné en structure. Les publications synthétiques et modèles mis en usage n’existent que sur la copie temporaire. Un changement de version checklist est simulé sans effet sur l’ancien Projet.

Les cas supplémentaires vérifient : option disponible sans effet, quantité avant conversion, conservation manuelle, retrait vierge, retrait travaillé avec session/conflit, archivage explicite, rejeu, nouvelle version et historique exact. La copie est supprimée après contrôle ; sa preuve de sortie est conservée dans le rapport JSON.

## 9. Limites et prochaine autorisation

Les 112 modèles réels sont simulés en BROUILLON, **pas configurés ni importés dans Validation-MSI**. Les associations commerciales réelles ne sont pas changées. En particulier, la composition Vitrine inclut encore un service historique lié à la V1 complète : son futur raccord à la structure devra être décidé/configuré explicitement et versionné. Le moteur bloque une combinaison incompatible, sans neutraliser cette contribution historique.

Les 111 AW sans blueprint ne reçoivent pas de destination déduite. Les fixtures Page/Blog démontrent le moteur, sans valider des associations commerciales réelles absentes du référentiel courant. Leur mise en usage réelle exigera le contrôle des mappings et une autorisation séparée.

L’activation des routines, abonnements, crédits de packs, maintenance/interventions demeure Lot 8B. Aucune facturation, synchronisation Abby ou publication Bridge. La recette manuelle de la préparation, des conflits et du chrono est encore à effectuer.

**Arrêt avant application réelle et commit.** Ne pas démarrer Manager sur Validation-MSI tant que la migration pendante 60 n’a pas été autorisée et appliquée selon le protocole sauvegarde/empreintes déjà utilisé.

## 10. Documents et preuves

Dossier hors dépôt : `C:/Users/AtoumWeb/Documents/ChatGPT/manager atoumweb+ bridge/outputs/operational-lot8a/`.

- `reference-operationnel-normalise.json` : manifeste exact, versions/actions, provenance, surcharges A19/A16.
- `audit-blueprints-et-matrice-aw-lot8a.md` : audit initial intégral et décision datée ajoutée.
- `matrice-compatibilite-blueprints-operationnels-112.md/json` : matrice exhaustive AW/blueprint/tâches/chevauchement/structure/modèle.
- `simulation-lot8a.md/json` : arithmétique, 209 contrôles, versions créées et snapshots/provenance détaillés.
- `ui-lot8a.json` et captures `ui-operational-*` : 69 contrôles UI.
- `preparation-lot8a-verifications.json` : empreintes de l’état final préparé et contrôles conservés.
- `bilan-preparation-lot8a.md` : copie de ce bilan.

## 11. Fichiers concernés

Le manifeste final des fichiers et de leurs empreintes figure dans `preparation-lot8a-verifications.json`. Les scripts sont du code de contrôle ; aucun SQLite, sauvegarde, XLSX, JSON de simulation ni capture n’est ajouté au dépôt.

Nouveaux fichiers : migration dédiée, services référentiel/génération, types partagés, fiche action React, 31 tests et deux fixtures synthétiques, extracteur et simulateur/scripts UI, ce bilan.

Modifications : registre migrations (ajout de 60 seulement), moteurs Projet/composition/révisions, chrono/corrections/changement de session, types Projet/Temps, écrans Projet/Temps/chrono/CSS, six fichiers de tests associés et trois documents de suivi. Aucun ancien SQL de migration modifié.

### Liste exacte des 36 fichiers préparés

- `PROJECT_STATUS.md`
- `docs/HANDOFF_CODEX_MSI.md`
- `docs/MANAGER_BRIDGE_ROADMAP.md`
- `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md`
- `scripts/check-project-operational-ui.cjs`
- `scripts/extract-operational-reference.py`
- `scripts/simulate-project-operational.cjs`
- `scripts/simulate-project-operational.ts`
- `src/main/commercial/ContractLibraryImportService.test.ts`
- `src/main/commercial/QuoteContractPreparationService.test.ts`
- `src/main/commercial/QuoteOptions.test.ts`
- `src/main/database/catalogIdentityV1Migration.test.ts`
- `src/main/database/migrations.test.ts`
- `src/main/database/migrations.ts`
- `src/main/database/projectOperationalMigration.ts`
- `src/main/projects/OperationalReferenceService.ts`
- `src/main/projects/ProjectBlueprintCompositionService.ts`
- `src/main/projects/ProjectCommercialService.test.ts`
- `src/main/projects/ProjectCommercialService.ts`
- `src/main/projects/ProjectOperationalService.test.ts`
- `src/main/projects/ProjectOperationalService.ts`
- `src/main/projects/ProjectService.ts`
- `src/main/testSupport/operationalReferenceFixture.ts`
- `src/main/testSupport/projectOperationalFixture.ts`
- `src/main/time/TimeCorrectionService.ts`
- `src/main/time/TimeService.ts`
- `src/main/time/TimeSwitchService.ts`
- `src/renderer/projects.css`
- `src/renderer/projects/OperationalActionDetails.tsx`
- `src/renderer/projects/ProjectTimeTab.tsx`
- `src/renderer/projects/ProjectsPage.tsx`
- `src/renderer/time/GlobalTimer.tsx`
- `src/renderer/time/TimePage.tsx`
- `src/shared/operational.ts`
- `src/shared/projects.ts`
- `src/shared/time.ts`

# Contrats — Lot 2 : Identité catalogue V1

Date : 03/10/2026. Implémentation validée techniquement par AtoumWeb. Commit local dédié autorisé, sans push/merge. Recette manuelle AtoumWeb à faire ultérieurement avant validation fonctionnelle finale. Aucun code Lot 3 dans ce lot.

## Séparation des lots et état de départ

Branche `feature/project-page-compositions-v1`, base auditée `ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81`.
Avant Lot 2 : `npm test` **54 fichiers / 356 tests / zéro échec**, typecheck OK et vérification des 17 fichiers attendus du Lot 1. Commit local dédié **`dedb865f4cdabd518391b63f067ed8e2647c869b`**, puis arbre propre.

Son message conserve explicitement **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD**, avant validation fonctionnelle finale. Cette réserve reste en vigueur. Le diff local courant est exclusivement le Lot 2, incluant son bilan documentaire.

## Comportement avant / après

| Sujet | Avant | Après Lot 2 |
| --- | --- | --- |
| Identité catalogue | UUID technique seulement | UUID conservé ; code AW facultatif, format contrôlé et unicité globale, même après archivage |
| Ancien item | Aucun code canonique | Reste sans code jusqu'à une attribution explicite à son UUID ; aucun rapprochement par nom |
| Code attribué | Aucun modèle | Stable, non renommable/effaçable par les API ou une mise à jour SQL ordinaire ; réapplication identique sans effet |
| Nature commerciale | Type technique service/offre | Nature versionnée distincte : offre, service, option, pack, abonnement ; absence historique conservée |
| Unité et périodicité | Principalement déduites du mode tarifaire | Champs descriptifs indépendants et versionnés, sans création automatique d'échéance/abonnement |
| Coût tiers réel | Confusion possible avec sur devis | `priceBasis=actual_cost`, `priceMode=quote_only`, prix catalogue null ; prix proposé obligatoire sur la ligne de devis |
| Provenance | Aucun champ dédié | Référence, clé/ligne source, SHA-256 source facultatif ; provenance de version et provenance d'attribution distinctes |
| Nouvelles lignes de devis | Snapshot commercial existant | Identité/métadonnées et identités des composants d'offre figées à la création de la ligne |
| Anciennes lignes et versions | Texte/prix/JSON historiques | Aucun recalcul ni enrichissement rétroactif, même lors d'une attribution AW ou nouvelle publication catalogue |
| UI catalogue | Noms/prix | Recherche AW/famille/libellé Abby, champs de création/version et attribution explicite ; création en brouillon, publication distincte conservée |

Les UUID et références existantes (`catalog_item_id`, `catalog_version_id`, compositions, blueprints, clauses, devis, projets) restent inchangés. Le libellé Abby est une métadonnée : aucun échange avec Abby n'est réalisé.

## Migration additive 53

Le numéro **53** a été réservé après contrôle de la séquence existante 1–52. Nom : `catalog_identity_v1`.

- `catalog_items` : `canonical_code` nullable et `identity_provenance_json` nullable ; index unique et protection d'un code déjà attribué.
- `catalog_versions` : `commercial_kind`, `family_code`, `abby_label`, `unit`, `periodicity`, `provenance_json` nullables ; `price_basis` vaut `listed` par défaut.
- Contrôles SQL du format de code, des enums, du JSON et de la cohérence du coût réel, en complément des validations du service.
- Aucun seed, correspondance préremplie, prix modifié, reconstruction de table ou modification du SQL des migrations 1–52.
- Migration exécutée uniquement sur les bases de test en mémoire. La base réelle n'a pas été migrée pendant ce lot. Un lancement ultérieur du Manager appliquera sa procédure habituelle de migration ; à prévoir lors de la recette.

Retour arrière : revenir au code précédent en conservant les colonnes et identités ajoutées. Aucune migration destructive de retour n'est fournie ; l'ancien code peut ignorer ces colonnes. Ne pas effacer des codes déjà attribués pour résoudre une anomalie : documenter le cas et autoriser séparément une correction contrôlée.

## Attribution explicite / préparation du Lot 3

`CatalogService.applyIdentityManifest` traite un manifeste typé `{ schemaVersion: 1, assignments }`. Chaque entrée contient **l'UUID réel de l'item**, le code AW choisi et sa provenance. Il valide toutes les entrées avant écriture, refuse les UUID inexistants, doublons et conflits, écrit en transaction et trace les nouvelles attributions. Un rejeu strictement identique ne modifie ni date, ni provenance, ni activité, ni version.

L'UI expose une attribution individuelle passant par ce même mécanisme. Elle ne publie aucune version. Le format AW et l'unicité sont vérifiés ; le contrôle d'appartenance au référentiel des 112 prestations et son manifeste réel de reprise relèvent du **Lot 3**, non commencé. Aucun mapping basé sur les noms, aucune correspondance réelle des anciens items n'a été créée dans ce lot.

Les unités/périodicités restent descriptives pour accueillir les valeurs approuvées du catalogue sans inventer de durée contractuelle. Une provenance source indique l'origine des données ; son hash ne constitue ni un hash de la version catalogue ni une preuve d'intégrité du PDF contractuel.

## Tests ajoutés et résultats

Deux fichiers Vitest, **21 nouveaux tests** :

- `CatalogIdentityService.test.ts` : null historique ; code normalisé/unique même archivé ; six formats invalides ; cinq natures commerciales ; reprise/versionnement et effacement explicite des métadonnées facultatives ; coût réel distinct de sur devis/prix obligatoire ; provenance ; manifeste idempotent ; refus atomique des entrées ambiguës ; conservation des anciens snapshots ; identités des composants d'offre sans vente automatique d'option.
- `catalogIdentityV1Migration.test.ts` : mise à niveau 52→53 comparant **toutes les colonnes antérieures de toutes les tables applicatives**, avec trois devis historiques témoins `DEV-2026-001/002/003`, deux projets et compositions ; reprise sans effet ; contrôle FK/intégrité ; contraintes SQL des codes et coûts réels.

Les fixtures historiques sont en mémoire ; elles ne sont pas les devis de la base réelle.

| Contrôle | Résultat |
| --- | --- |
| Tests ciblés catalogue/identité/devis/migrations | **45/45**, zéro échec |
| `npm test` après Lot 2 | **56 fichiers / 377 tests**, zéro échec |
| `npm run typecheck` | sortie **0** |
| `node scripts/check-catalog-identity-ui.cjs` | **15/15**, zéro échec |
| `node scripts/check-contract-terms-builder-ui.cjs` | **14/14**, zéro échec ; protections Lot 1 conservées |
| `git diff --check` | aucune erreur |

Les scripts Chromium utilisent IPC simulé et profils temporaires isolés. Ils ne remplacent pas une recette AtoumWeb sur le workspace réel ; ni `DatabaseService` ni le bootstrap de la base client ne sont lancés.

Empreinte Validation-MSI avant/après : **`5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`**, WAL absent lors du contrôle. Aucune modification physique de la base ; les trois vrais devis, projets et anciennes versions restent intacts.

## Fichiers du Lot 2

1. `src/shared/commercial.ts` — types d'identité/provenance/manifeste et API d'attribution.
2. `src/main/database/catalogIdentityV1Migration.ts` — migration additive 53.
3. `src/main/database/migrations.ts` — enregistrement de 53 après 52.
4. `src/main/commercial/CatalogService.ts` — validation, stockage/versionnement, recherche, attribution explicite.
5. `src/main/commercial/QuoteService.ts` — identité dans les snapshots des nouvelles lignes uniquement.
6. `src/main/ipc.ts` — commande d'attribution individuelle.
7. `src/preload/preload.ts` — exposition de la commande catalogue.
8. `src/renderer/commercial/CatalogPage.tsx` — champs, lecture et recherche des identités.
9. `src/renderer/commercial.css` — affichage lisible du code et de l'attribution.
10. `src/main/commercial/CatalogIdentityService.test.ts` — nouveaux tests métier.
11. `src/main/database/catalogIdentityV1Migration.test.ts` — préservation et contraintes de migration.
12. `src/main/database/migrations.test.ts` — attentes mises à jour pour la dernière migration 53.
13. `scripts/check-catalog-identity-ui.cjs` — 15 contrôles renderer isolés.
14. `PROJECT_STATUS.md` — état courant et arrêt avant Lot 3.
15. `docs/HANDOFF_CODEX_MSI.md` — consigne de reprise.
16. `docs/MANAGER_BRIDGE_ROADMAP.md` — journal partagé `CONTRACT-LOT2-001`.
17. `docs/CONTRACTUAL_LOT2_CATALOG_IDENTITY.md` — présent bilan.

## Limites et suite

- **Lot 3 non commencé** : pas d'import des 112 prestations ni de manifeste réel ancien UUID→AW ; pas de rapprochement par nom, archive/reprise de versions ou réécriture du catalogue existant.
- Pas d'import/publication des 118 clauses ou 409 liens, ni de qualification juridique implicite.
- Pas de configuration d'options vendues, blueprints composés, échéances, packs, interventions, raccord Abby ou travail Bridge.
- Lots Bridge 8C/9/10/11 non démarrés ; **8C reste suspendu**.
- Intégrité/historique du PDF restent au Lot métier 5 ; recette manuelle Lot 1 toujours à faire.
- Après validation technique de ce bilan, AtoumWeb autorise le commit local Lot 2 séparé, puis le Lot 3 sur base temporaire. La simulation exacte et les ambiguïtés devront être présentées avant toute écriture réelle. **Aucun push ou merge vers `main`, aucun Lot 4 implicite. Recette manuelle toujours à faire.**

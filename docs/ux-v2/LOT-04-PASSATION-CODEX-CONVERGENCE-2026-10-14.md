# Lot 04 — Passation de convergence Codex (14 octobre 2026)

## Contrat de sécurité
- **Ne pas fusionner dans main** avant autorisation utilisateur.
- Lots 01–03 sur main : **66 migrations** selon le coordinateur. **Ne pas modifier les définitions 1–66 ni écrire directement dans `schema_migrations`.**
- Identifiants provisoirement alloués au lot 04 : **67 `catalog_category_registry_v1`** (`src/main/database/catalogCategoryAdminMigration.ts`), **68 `catalog_version_recommendations_v1`** (`src/main/database/catalogRecommendationsMigration.ts`). Le lot 05 propose **69** après arbitrage, alors que sa PR #121 contient encore `contract_clause_section_review_v1` à **67** à la date de cette passation. **Conflit réel : ne pas assembler ces registres en l'état.**
- Aucune base SQLite persistante Windows ni `Validation-MSI` accessible depuis cet environnement. Les CI utilisent des bases éphémères TEMP / mémoire, non représentatives de la migration d'une base utilisateur existante. Codex doit inventorier **toutes** les bases locales réellement présentes et exécuter sur copie de travail : `SELECT id, name, applied_at FROM schema_migrations ORDER BY id;` ; comparer identifiant **et nom** à chaque migration du dépôt. Déterminer quelles bases contiennent des données à préserver, puis sauvegarder avant toute opération. Si un identifiant 67 a déjà été appliqué avec un nom différent, **arrêt pour arbitrage : ne pas réécrire l'historique à la main**.
- Aucun contrat, devis historique, prix/Abby, publication ou donnée utilisateur ne doit être altéré par la convergence.

## Graphe Git et preuves (relevé au 14 octobre)
| Ordre | Périmètre | PR | Branche | SHA contrôlé | CI terminée avec succès |
|---|---|---|---|---|---|
| 1 | 04B Catalogue | #104 | `feature/ux-v2-lot04b-catalogue-navigation-v1` | `57afcdae599fccfee6ab15d0055d58494c42c2d7` | [#1045](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38579679237) |
| 2 | 04C Brouillons/versions | #108 | `feature/ux-v2-lot04c-editor-drafts-v1` | `2412513be4fb0f2ca87602adcdef4aaa31760ea3` | [#1003](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38573720049) |
| 3 | 04D/04E/04F | #118 | `feature/ux-v2-lot04d-04e-catalogue-v1` | `c1910a7902ac34b41ef139d53572616dc7d4a5f0` | [#1648](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38635817908) |

La PR #108 est **77 commits devant / 2 derrière** la tête actuelle de #104 : réconcilier explicitement les deux commits de 04B absents du descendant 04C avant de porter 04D/04E. #118 est **179 commits devant / 0 derrière** #108. #118 comparée au `main` actuel : **365 commits devant / 10 derrière**. Les CI ci-dessus sont des preuves **par SHA de branche**, pas une certification du candidat convergé.

La branche `integration/ux04-preflight-20261014` existe sur `bf77617` (ancien instantané de 04D), **pas** sur le dernier HEAD de #118 et sans réconciliation de main. Ne pas l'utiliser telle quelle pour la recette finale.

## Fichiers à risque de résolution manuelle
Chevauchements constatés entre PR #118 et :
- **#121 (lot 05, 7 chemins)** : `.github/workflows/ci.yml`, `src/main/commercial/ContractTypeService.test.ts`, `src/main/database/DatabaseService.ts`, `src/main/database/migrations.test.ts`, `src/main/database/migrations.ts`, `src/main/ipc.ts`, `src/preload/preload.ts`. Le registre des migrations est **bloquant** tant que 67/68/69 et les bases persistantes ne sont pas réconciliés.
- **#124 (lot 06, 4 chemins)** : `.github/workflows/ci.yml`, `src/main/commercial/QuoteService.test.ts`, `src/preload/preload.ts`, `src/renderer/commercial/QuoteOfferOptionsPanel.tsx`. Préserver les limites entre option achetée, service recommandé et contrat.
- **#134 (lot 09, 5 chemins)** : `.github/workflows/ci.yml`, `PROJECT_STATUS.md`, `src/main/database/DatabaseService.ts`, `src/main/ipc.ts`, `src/preload/preload.ts`.
- **À l'intérieur du lot 04**, #118 et #104 partagent 13 chemins ; #118 et #108 partagent 10 chemins, notamment `CatalogService.ts`, `ipc.ts`, `preload.ts`, `CatalogPage.tsx`, `commercial.ts`, et le workflow. Ces recoupements peuvent provenir de l'ascendance des PR empilées : **ne pas interpréter chaque fichier comme un conflit de merge confirmé**.

## Ordre technique recommandé à Codex
1. Sauvegarder et auditer les bases persistantes Windows **en lecture** ; vérifier `schema_migrations` id+name, absence de 67/68 contradictoires, nombre de données à préserver, `PRAGMA foreign_key_check` sur copie ; remonter toute collision avant changement.
2. Partir du dernier `main` sur **une branche d'intégration neuve**, sans modifier le main. Vérifier les 66 identités SQL du socle et l'ensemble des migrations de tous les lots participants.
3. Rejouer **04B (#104)** puis **04C (#108)** en préservant les deux commits tardifs de 04B ; ensuite **04D/04E/04F (#118)**. Utiliser cherry-picks ou rebase contrôlé en tenant compte de l'ascendance ; **ne jamais rejouer aveuglément les 365 commits**.
4. Vérifier chaque conflit partagé sur un diff à trois voies ; conserver conjointement les interfaces IPC/preload, les migrations, et la logique de sauvegarde/UX-01. Résoudre les collisions interlots seulement après arbitrage global SQLite ; 69 pour lot05 reste une proposition jusqu'à inspection des bases.
5. Compiler et exécuter Vitest complet, typecheck, tests migrations/fk/backup/restore sur copies TEMP, Electron Windows/UX-01 ; vérifier 04B et 04C dont les jobs sont parfois ignorés sur PR #118, ainsi que les neuf captures de thème/densité et une inspection visuelle humaine.
6. Recette fonctionnelle : publication versionnée et historique immuable, édition des brouillons et CAS, navigation/recherche catégories, recommandations de **services publiés actifs** Prospect/Devis uniquement consultatives avant ajout volontaire, options réellement achetées reconnues seulement sur bonne offre/version/composant, verrouillages Devis/Contrats/Projets, aucune mutation automatique ni sur prix historiques.
7. Documenter les SHA du candidat réconcilié, les décisions de conflit, les preuves CI **sur ce SHA**, les limites de recette et les résultats SQLite ; demander ensuite autorisation explicite avant toute fusion dans `main`.

## Résultats et réserves au passage
- CI #1648 verte sur #118 HEAD `c1910a7` ; #1045 et #1003 vertes sur leurs HEAD. `docs/ux-v2/LOT-04F-RECETTE-CONSOLIDEE-2026-10-14.md` contient la traçabilité détaillée.
- Les scénarios 04D/04E Electron réel/IPC/SQLite TEMP, UX-01, Prospect, Devis, TypeScript et Vitest ont été exécutés sur la branche #118 (voir les jobs de #1648). La preuve de capture de neuf variantes n'est **pas** une revue visuelle humaine.
- Aucun test de migration sur une base Windows persistante ; aucune CI du code réellement convergé avec `main` et les autres lots ; aucune recette complète transversale Prospect→Devis→Contrat→Projet sur arbre intégré certifiée.
- Les développements fonctionnels sont avancés et une CI de branche est verte ; **ne pas annoncer le lot 04 intégrable sans réserves ou clôturé techniquement avant ces portes**.

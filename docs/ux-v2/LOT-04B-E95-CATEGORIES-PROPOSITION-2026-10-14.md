# Lot 04B — Décision technique E94/E95 : catégories administrables (proposition à valider)

**Référentiel opposable :** PR #82, `LOT-04B-NAVIGATION-CATEGORIES.md`, sections 1, 4, 6 et R04B-03 à R04B-06.  
**Base code vérifiée :** `main@b2796812` ; PR #104 toujours **draft**.  
**Statut : conception préparatoire, aucune nouvelle migration, aucun CRUD de catégories appliqué**.

## 1. État des données

- `catalog_items.category` est un **texte libre**, interrogé et filtré par `CatalogService.list`, avec alias purement visuels dans `catalogDisplay.ts`.
- `catalogueFamilyLabel` peut préférer `CatalogVersion.familyCode` ; cela **ne change pas** la catégorie métier principale de l'item.
- Le Catalogue V1 livré dans `data/catalogue/atoumweb-catalogue-v1.json` regroupe **112 références dans 13 codes**. Ces références ne prouvent **pas** les valeurs déjà stockées dans le workspace utilisateur.
- Les variantes `SEO` et `SEO / Visibilité` peuvent afficher le même alias ; **ne pas les regrouper automatiquement** : la nouvelle projection conserve leurs clés de catégories historiques séparément et affiche leur libellé brut pour les différencier.
- Le Catalogue est consommé par Prospection, Devis, liens de composition, contrats, blueprints et recherche globale. Les codes canoniques et versions publiées restent indépendants du classement.

## 2. Contrat souhaité

Proposition privilégiée **A — registre `catalog_categories` avec identifiant stable**, assorti d'une migration additive et réversible :

| Champ | Sens |
|---|---|
| `id` (UUID) | Identité stable d'une catégorie, ne dépendant pas du nom affiché |
| `name` | Libellé français lisible (1 à 80 caractères) |
| `normalized_key` | Valeur comparable Unicode/casse/accents/espaces, unique pour **nouvelles catégories** |
| `status` | `active` ou `archived`, sans suppression physique d'une catégorie utilisée |
| `created_at`, `updated_at`, `archived_at` | Historique et traçabilité |
| `catalog_items.category_id` | Référence nullable additive, **sans supprimer** le `category` textuel historique |

**Important :** cette structure est **une proposition, pas un schéma migré**. Elle nécessite l'examen des conventions SQL, migrations numérotées et contraintes SQLite déjà présentes. Pas d'`ALTER TABLE` aveugle.

## 3. Migration et collisions historiques — jamais silencieuses

1. Exporter les catégories `DISTINCT` depuis une **fixture isolée**, pas depuis Validation-MSI.
2. Calculer un rapport de collisions sur les valeurs d'origine, en utilisant la fonction pure `catalogCategoryCollisions` (`src/shared/catalogCategoryRules.ts`) pour détecter `SEO`/`Seo  ` et autres variantes de comparaison.
3. **Ne pas faire de backfill silencieux des valeurs ambiguës**. Les items en conflit conservent temporairement `category` ancien et `category_id=NULL`. Les présenter comme « À réconcilier » et demander une affectation volontaire.
4. Pour une catégorie sans collision, créer une identité stable et rattacher les items sans modifier leurs noms, codes, versions, composants, Devis ni snapshots. Vérifier FK, historique, idempotence et rollback.
5. Afficher `COALESCE(category_registry.name, legacy.category)` en lecture avec **identité** distincte de l'alias actuel. Les recherches historiques par catégorie doivent rester compatibles.
6. La conversion complète du rendu et des filtres devra être validée sur les mêmes fixtures, **avant** une dépréciation éventuelle du champ texte (hors périmètre 04B).

## 4. Actions administrables cibles

| Action | Garde métier |
|---|---|
| **Lister** | Tri `fr-FR`, comptages actifs/archivés/non classés ; valeurs historiques en conflit visibles |
| **Créer** | Normalisation, unicité transactionnelle et refus explicite de `SEO` / `Seo  ` |
| **Renommer** | Mise à jour du **libellé**, pas de l'UUID, des anciennes versions ni des preuves Devis ; aperçu des items concernés et confirmation |
| **Réaffecter** | Changement explicite de lien pour chaque item concerné ; pas de réaffectation implicite à l'archivage |
| **Archiver** | Bloquer les nouveaux rattachements, conserver les items historiques et leurs références |
| **Restaurer** | Restaurer la **même** catégorie et son ID, en vérifiant les collisions de libellé |
| **Créer un service dans la catégorie** | Créer uniquement l'item et sa v1 `draft`; la catégorie ne publie ni ne vend |

Éviter de renommer un code canonique Abby/famille, une prestation vendue, un contrat ou une version depuis une action de catégorie.

## 5. Preuves avant adoption de ce schéma

- Une matrice complète source → API/IPC → SQLite → consommateurs, avec les champs exacts et les migrations actuelles.
- Fixtures avec plusieurs items même catégorie, catégorie vide, catégories archivées et collisions Unicode/casse/espaces.
- Tests de **transaction intégrale** pour renommer/réaffecter/restaurer ; relecture historique des Devis, Contrats, Projets et versions retirées ; FK `PRAGMA foreign_key_check` vide.
- Simulation migration/rejeu/rollback sur plusieurs bases temporaires, ancien code consommateur compatible.
- UI clavier/souris, protections UX-01 pour les éditeurs de catégories, refus de sortie et conflits explicites.
- Recette R04B-03 à R04B-06, trois thèmes × trois densités, tailles de fenêtre réduites.
- **Validation humaine de la stratégie E95 avant écriture du schéma**.

## 6. Ce qui est livré immédiatement sans migration

`src/shared/catalogCategoryRules.ts` contient les règles pures de normalisation et l'inventaire des collisions ; `catalogCategoryRules.test.ts` en définit les assertions. Elles n'ont **aucun effet sur la base**.

**Décision en attente :** valider le registre avec identité stable et le mécanisme de réconciliation, après mesure des collisions réelles sur fixtures. Le 04B n'est pas « terminé » tant que cette décision et R04B-03 à R04B-06 ne sont pas couvertes.

## 7. Incrément de mise en œuvre du 14/10 — à recetter

La proposition du présent document est désormais **partiellement implémentée dans la PR #104, toujours draft**, et ne doit plus être lue comme un schéma encore purement théorique. Aucune migration réelle n'a été appliquée à Validation-MSI.

- Migration **67** `src/main/database/catalogCategoryAdminMigration.ts` : registre des catégories administrées à identité stable, lien nullable `catalog_items.category_id`, journal détaillé. **Pas de backfill automatique** ; le champ brut `category` n'est pas supprimé.
- `CatalogCategoryService.ts` : CRUD gouverné, CAS de révision, refus des catégories archivées pour les affectations, conservation des anciennes catégories non rapprochées et réconciliation sur liste complète d'IDs validés, transactionnelle et auditée.
- `src/shared/catalogCategoryAdministration.ts`, `src/main/ipc.ts`, `src/preload/preload.ts` : contrats et chemins typés, aucune nouvelle surface exposée aux modules Devis/Prospect en écriture.
- `CatalogCategoryManagement.tsx` et `CatalogCategoryInventory.tsx` : opérations confirmées, erreurs visibles et garde UX-01 pour les saisies ; aperçu des prestations concernées par renommage et maintien des associations à l'archivage.
- **R04B-03** : création Service/Offre dans une catégorie enregistrée via `CatalogPage` et `CatalogService.create`, sous le **même savepoint SQLite que le premier brouillon** ; le champ libre préexistant reste disponible pour l'historique. Refus de catégorie introuvable, renommée ou archivée, sans création partielle.
- Tests dans `CatalogCategoryService.test.ts` : doublons normalisés, conservation ID/version, CAS, détection des changements, archives/restauration, rollback, absence de réconciliation silencieuse, FK, préservation des lignes/snapshots des Devis dans une fixture in-memory.
- Recette Electron `scripts/check-catalog-identity-ui.cjs` : tests d'ouverture et cycle E95 à partir de services IPC **mockés**, distincts des tests SQLite du véritable backend, puis test de création dans une catégorie sélectionnée.

### Distinguer les validations et le périmètre des preuves

- **CI #820** : verte sur le socle de présentation **avant** migration et administration E95.
- **CI #842** : verte sur l'éditeur E95 et la recette Electron mockée **avant** l'extension R04B-03 de création atomique.
- Les commits ultérieurs (création atomique, compatibilité de schéma pré-67, test de non-réécriture des Devis) **doivent disposer de leur propre CI verte** sur le SHA final.
- Les scénarios complets Prospect, Devis accepté réel → Projet et les **3 thèmes × 3 densités** avec captures humaines restent à certifier.
- L'identifiant de migration **67 n'est valable que sur le `main@b2796812` actuel** : toute convergence avec les travaux Codex 03D/03E doit vérifier les collisions de numérotation et rejouer migrations/FK sur le merge exact.

**Ce dossier est un historique de conception et mise en œuvre, pas une autorisation de fusion ni un procès-verbal de recette complète.**

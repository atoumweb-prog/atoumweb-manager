# UX/UI V2 — Lot 04A : audit de reprise du Catalogue (14/10/2026)

> **Statut : premier passage documentaire, non finalisé, sans développement applicatif.**  
> **Base inspectée :** `main@b2796812ee24c9e9e824f3d66564f2c1a335bffe` (merge post-PR #102, CI #781 verte selon suivi de fusion).  
> **Référentiel normatif :** [PR #82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82), branche `docs/ux-v2-reference-v1`, `docs/ux-v2/LOT-04-CATALOGUE.md`, `LOT-04A` à `LOT-04F` et `CATALOGUE-CGV.md`.  
> **Méthode :** lecture ciblée du code dans GitHub, **aucune commande locale, aucun test, aucune exécution Electron/SQLite, aucune modification de base**.

## 1. Séparation des chantiers

- **Lot 03D/03E en cours ailleurs :** fiche Client et Annuaire. Conserver leurs branches, migrations, tests et chronologie, sans cherry-pick ni rebase aveugle.
- **Lot 04 :** Catalogue « Offres & Tarifs ». Cette branche **ne modifie aucun fichier applicatif**. Elle ne fusionne pas la PR #82 et n'intègre pas les développements encore en cours.
- **`main` reste inchangé.** Pas de merge, de publication, de création d'article métier, ni d'accès à la base Validation-MSI.
- La branche référence le **contenu métier déjà préparé** : elle ne crée pas un second référentiel.

## 2. Invariants métier confirmés

1. Un **seul catalogue** pour administration, identification consultative des besoins Prospect et ajout volontaire de lignes Devis.
2. **Deux types d'item** `offer|service` ; `commercialKind` (`offer|service|option|pack|subscription`) n'est pas un troisième/quatrième type.
3. **Item** `active|inactive|archived`, **version** `draft|published|retired`, et **visibilité publique** `visiblePublic` : trois dimensions distinctes.
4. Une prestation conseillée ou enregistrée comme besoin **n'est ni vendue ni signée**. Une version publiée ne publie pas WordPress.
5. Les **devis existants, contrats et snapshots de projet** doivent conserver les versions et prix d'origine, même après retrait ou archivage.
6. Les offres principales prioritaires en UI : **Site vitrine, Site e-commerce, Site mariage, Maintenance WordPress** ; autres offres maintenues. Services complémentaires regroupés visuellement, **catégorie métier principale unique** puis tri alphabétique français.
7. Aucune nouvelle logique de signatures, CGV, Abby, Projet prévisionnel ou abonnement ne doit être inventée au niveau du Catalogue.

## 3. Matrice de code constatée sur le HEAD

| Source | Existant confirmé | Écart / travail restant |
|---|---|---|
| `src/shared/commercial.ts` | `CatalogApi` expose `list/getItem/create/createVersion/publishVersion/setStatus/setVisiblePublic/listOfferComponents/setOfferComponents`, plus attribution de code canonique ; `category?: string`. | Aucune API de catégories administrables ni d'édition de brouillon existant visible dans ce contrat. Revoir modèles avant toute migration. |
| `src/main/commercial/CatalogService.ts` | `create` insère item + v1 avec SAVEPOINT, `createVersion` crée une version et recopie des liens (types de contrat, règles commerciales, composition d'offre et blueprints selon contexte). | La copie doit être revue dans l'UI ; ne pas dupliquer la logique dans React. |
| `CatalogService.publishVersion` | Transaction `BEGIN IMMEDIATE` qui retire l'ancienne version publiée puis marque la cible publiée. | Dans cette méthode, aucun contrôle explicite `status === 'draft'` constaté : **vérifier contrat métier et tests** avant de décider un garde de prépublication (04F). |
| `CatalogService.setOfferComponents` | Refuse la modification de composition hors `draft` et les versions Service non `published`. | Dédoublonnage par `serviceVersionId` seulement : instruire le doublon possible de deux versions du même `serviceItemId` (E104). |
| `src/renderer/commercial/CatalogPage.tsx` | Liste, filtres, recherche, cartes/tableau, fiche agrandie, création, nouvelles versions, publication, statuts, visibilité, composition et liens contractuels. | Réorganiser UX 04B/04C ; **ne pas remplacer le moteur existant**. |
| `CatalogPage.tsx` (lignes 165–167 au HEAD) | `useUnsavedDraft` déjà raccordé à création, brouillon de version et code canonique. | Examiner couvertures et démomantages réels ; réutiliser une seule garde UX-01, pas une deuxième. |
| `CatalogPage.tsx` (filtrage) | Recherche locale dans nom, code, catégorie, famille, libellé Abby, description, inclus/exclus, conseils internes, etc. ; tri `fr-FR`. | Les bénéfices/mots-clés structurés ne sont **pas** établis dans les types actuels. Ne pas prétendre à une recherche sémantique. |
| `src/renderer/crm/ProspectNeedsPanel.tsx` | Suggestions fixes dans `SUGGESTIONS` (IDs codés) ; choix `Ajouter` distinct ; consultation des versions visibles. | Source de recommandations administrable N:N à concevoir en 04D (pas de transformation automatique en achat). |
| `src/renderer/commercial/QuotesPage.tsx` | Ajout de ligne de catalogue via `quotes.addCatalogLine`, sélection volontaire. | Garder les versions publiées, les quantités, l'idempotence et la provenance des options/compléments, sans recoder les achats. |
| `src/renderer/commercial/catalogDisplay.ts` | Alias pour présentation offre/service et famille. | Ne pas renommer les `familyCode` ni les `canonicalCode` pour un simple regroupement visuel. |

### Contrôles de prix existants

Modes : `fixed`, `starting_from`, `hourly`, `monthly`, `yearly`, `quote_only`, `free`. Le service encadre `priceBasis='actual_cost'` avec `quote_only`. Respecter les centimes stockés, les unités et les cycles d'abonnement **distincts** de la fréquence de facturation.

## 4. Écarts confirmés et décisions non tranchées

| Référence | Situation | Prochaine preuve / arbitrage |
|---|---|---|
| E88 / E94–95 | Catégories en texte libre, pas d'API native `catalog.categories`. | Inventorier les **valeurs réellement persistées** dans une fixture sûre, alias et collisions ; décider modèle, migration et stratégie de conservation. |
| E89 / E105–109 | `SUGGESTIONS` codées dans le panneau Prospect, distinctes des `OfferComponent`. | Proposer un modèle N:N versionné de **recommandations**, sans réutiliser `isOptional` ni modifier les options vendues. |
| E90 / E111–116 | `internalAdvice` libre, pas de rubriques bénéﬁces/questions/vigilances structurées établies. | Contrat de stockage/version, vues Prospection/Devis et frontière claire avec texte client/CGV. |
| E99 | API crée une nouvelle version ; pas d'édition de brouillon existant exposée dans le contrat consulté. | Définir s'il faut une édition versionnée sous contrôle de concurrence ; pas une nouvelle version à chaque frappe. |
| E92 / E103 | Versions retirées et archivées liées à anciens Devis/CGV/blueprints. | Tests de lecture snapshot et de non-rétroactivité avant nouvelle publication. |
| E93 / E117–122 | Prépublication multi-domaines encore à concevoir. | Définir les contrôles réellement **bloquants** par type de prestation ; aucune « conformité juridique » automatique. |

## 5. Ordre de travail proposé, sans écraser les lots précédents

### 04A — Compléter l'audit avant code

- **04A.1 :** cartographie source/API/consommateurs entamée dans ce document ; à compléter par tous les IPC, migrations et tests, plus vérification du HEAD au démarrage du code.
- **04A.2 :** inventaire des catégories réelles à partir de fixtures isolées ; pas de lecture ou migration de Validation-MSI.
- **04A.3 :** matrice recherche actuelle/future, champs réellement indexés, comportement code Abby et alias.
- **04A.4 :** matrice de versions, contrats, compositions et blueprints avec cas de retrait/publication.
- **04A.5 :** pilote de présentation 04B isolé (offres prioritaires + sections de catégories), **sans changement de statut ni migration** et sans toucher aux modules 03D/03E.
- **04A.6 :** typecheck, tests ciblés et complets, Electron 3 thèmes × 3 densités, revue humaine et preuve sur SHA exact avant fusion.

### Suite — 04B à 04F

1. **04B :** vue offres prioritaires, services par catégories A–Z français, recherche, filtres et administration des catégories **après arbitrage du modèle**.
2. **04C :** éditeur unifié huit onglets, prix, version, brouillon, comparaison, UX-01 et contrats/production existants.
3. **04D :** relations Inclus / Option / Recommandé **distinctes**, recommandations N:N administrables, non-duplication.
4. **04E :** aide commerciale structurée/versionnée et aide `?` consultable Prospect/Devis sans création de ligne.
5. **04F :** prépublication, contrôles croisés, conservation des snapshots et recette transverse (25 scénarios).

## 6. Gates et frontières à préserver

- **Aucune modification ou migration SQL** sans audit du schéma et tests de restauration/rollback.
- **Aucun test réel déclaré exécuté** dans cette première passe ; `R04A-01` à `R04A-14` restent **prévisionnels**.
- Pas de création de fiche Catalogue depuis une démo connectée aux données réelles.
- Navigation et protection des éditeurs via **la garde UX-01 existante**.
- Brouillon, publication de version, visibilité publique, ajout au Devis et acceptation Abby = **actions différentes et volontaires**.
- Pas de rebase/merge automatique des PR 03D/03E ou #82 ; toute convergence doit partir de la branche effectivement intégrée après examen.
- Pas de fusion de cette branche ni de déclenchement volontaire d'une publication ; accord humain requis après analyse et recette.

## 7. Questions à décider à l'issue du 04A

1. **Catégories :** quels libellés existants conserver et comment rendre leurs opérations administrables sans changer l'identité des items ?
2. **Brouillon :** API d'édition contrôlée ou mécanisme de révision de version adapté ?
3. **Recommandations :** modèle et politique N:N, version admissible, déduplication par item et priorité métier.
4. **Aides :** stockage et versionnement, suppression des tables codées en dur sans perte du comportement actuel.
5. **Publication :** liste des conditions bloquantes vs avertissements par type d'offre ou service.

**Conclusion :** le lot 04 est bien une **extension du Catalogue existant**. Le premier geste de code le moins risqué sera un **pilote de présentation 04B sur fixtures**, puis des extensions de services strictement justifiées par les écarts validés.

## 8. Complément vérifié : IPC, migrations, référence Catalogue V1 et tests présents

### IPC : endpoints déjà raccordés

`src/main/ipc.ts` (lignes 409–418 au HEAD) raccorde `catalog:list`, `catalog:get-item`, `catalog:assign-canonical-code`, `catalog:create`, `catalog:create-version`, `catalog:publish-version`, `catalog:set-status`, `catalog:set-visible-public`, `catalog:list-offer-components` et `catalog:set-offer-components`. **Ne pas créer un second réseau IPC pour 04B.** La recherche globale `ipc.ts` utilise `database.catalog.list({ search })`.

### Schéma SQLite et migrations identifiés

- `src/main/database/phase2Migrations.ts` crée notamment `catalog_items` (catégorie textuelle), `catalog_versions`, `offer_components` et des références de lignes Devis ; il existe un index de catégorie `COLLATE NOCASE` et un index unique de version publiée par item.
- `catalogIdentityV1Migration.ts` ajoute les codes canoniques immuables, la provenance, les natures commerciales, familles, libellés Abby et contrôles SQL pour le coût de tiers.
- `src/main/database/migrations.ts` référence ces migrations : **ne pas supposer qu'un champ de catégorie libre peut être remplacé sans rétrocompatibilité ou migration contrôlée**.

### Référence V1 inspectée — à ne pas confondre avec la base réelle

Le fichier versionné `data/catalogue/atoumweb-catalogue-v1.json` contient **112 enregistrements** répartis dans **13 codes de catégories de la référence** : `WEB`, `LANDING`, `ECOM`, `MAINT`, `TECH`, `SEO`, `CONTENU`, `IDENTITE`, `PHOTO`, `MARIAGE`, `DATA`, `DEVWP`, `APP`. Ce sont des données de référence et **non un inventaire de la base d'exploitation**. Le pilote 04B devra présenter des intitulés français lisibles en conservant les codes et la provenance, puis confronter cette référence aux catégories réellement stockées **sur fixture isolée**.

### Tests existants repérés, mais non exécutés durant cet audit

- `src/main/commercial/CatalogService.test.ts` : création, publication et retrait, archivage/réactivation, filtres, composition et immutabilité.
- `src/main/commercial/CatalogIdentityService.test.ts` : codes, provenance, coût tiers, conservation des versions et liens Devis.
- `scripts/check-catalog-identity-ui.cjs` : recette Electron avec répertoire temporaire créé par `mkdtempSync` ; contrôle notamment création/versions/recherche et absence de publication implicite.
- Ces contrôles constituent un **socle de non-régression à rejouer** au début des vrais développements 04B/04C ; leurs résultats historiques **ne valent pas exécution sur notre branche**.

### Recommandation pour le premier incrément 04B

Commencer par une **projection de présentation pure** (groupement visuel des quatre offres principales, puis services par catégories/nom avec `localeCompare('fr-FR')`), injectée dans le `CatalogPage` actuel sans modifier les identifiants, les codes Abby, les fonctions de mutation, le contrat IPC ou le schéma. Ensuite, seulement après validation des libellés issus de la référence et de l'inventaire, décider si l'administration des catégories nécessite une entité dédiée.


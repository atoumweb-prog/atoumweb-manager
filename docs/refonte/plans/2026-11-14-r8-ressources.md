# R8 Ressources : plan

> **Pour l'exécutant :** exécution en ligne (`superpowers:executing-plans`), tests d'abord (`superpowers:test-driven-development`). **Pas de commit par tâche** : règle C, un seul commit local après tests verts et captures vues par Carlos (tâche 12). Pas de push, PR ni fusion sans accord. Skill de design : `atoumweb-design`. Tests écrits avec l'outil d'écriture (jamais dans un bloc shell).

**Objectif :** que Offres & Tarifs, Bibliothèque, Sites, Sauvegardes, Statistiques et Annuaire se lisent comme les écrans de Gestion de R7 (titre, chiffres clés, barre d'outils sur une ligne avec une seule action jaune, contenu), qu'un écran vide dise pourquoi et quoi faire, et que Offres n'ait qu'une définition de « filtre actif ». Aucune règle métier, aucune donnée, aucun éditeur.

**Architecture :** réutilisation de `ui/KeyFigures.tsx`, `ui/ListToolbar.tsx`, `ui/list-page.css`, `plural` et `limitItems` de `shared/projectTabs.ts`. `KeyFigures` reçoit une action facultative. Les règles de messages vides vivent dans un fichier pur `shared/ressourcesEmpty.ts` (séparé de `gestionEmpty.ts`). La définition unique de « filtre actif » du Catalogue est une fonction pure.

**Spec :** `docs/refonte/plans/2026-11-14-r8-ressources-design.md` (validée par Carlos le 14/11/2026 : Annuaire ajouté à R8, « ok global » sur les points 2 à 9, un seul lot, jeu de cas de figure d'accord sur le principe ; **l'écriture dans la préproduction reste soumise à son accord explicite après la simulation**).

## Contraintes globales

- Aucune donnée, règle métier, statut, calcul ni ordre du parcours modifiés. Aucune fonction retirée : tous les filtres (dont « Filtres avancés »), les trois vues du catalogue, l'espace Administration, « Composer un site », les imports et retours Bridge, la déclaration de sauvegarde, le contrôle avant / après intervention, les cinq onglets de Statistiques et le détail exact de chaque chiffre, les onglets et la recherche de l'Annuaire.
- L'onglet « Pilotage » d'Offres n'est plus **listé** ; son code et son espace restent définis (rien n'est supprimé).
- Éditeurs et fiches détaillées hors périmètre : fiche d'offre, version d'un composant, comparaison de copies, formulaire de déclaration. Ne les modifier que si un test casse à cause d'un renommage de l'en-tête.
- Aucun `!important` ajouté, aucune couleur en dur (jetons `--aw-*`, `--text`, `--muted`, `--border`, `--surface-soft`), aucune règle `:has()` nouvelle ; budgets `ui/importantBudget.test.ts` et `ui/fontFloorBaseline.json` ne montent pas (celui des petits textes, 648, doit **baisser**) ; plancher de 14 px.
- Un seul bouton jaune par vue ; `ui/buttonHierarchy.test.ts` reste vert. « Nouveau composant » redevient secondaire quand sa zone est ouverte (comme aujourd'hui).
- Libellés en casse normale sur les blocs retouchés, textes sans tiret long, vocabulaire des consignes de Carlos respecté.
- Accord des compteurs avec `plural` : jamais « (s) ».
- Vérification visuelle : Noir / Confort, copie jetable de la préproduction de test, sans port de débogage, source vérifiée inchangée (règle D).
- Fins de ligne mêlées : conserver celles du fichier édité ; lancer `eol-report.cjs` sur tous les fichiers modifiés avant le commit (`grep` ne les voit pas).
- L'acompte par défaut n'est pas touché (lot dédié).

## Points de vigilance (Review Focus)

1. **Filtre actif du Catalogue** : changer la taille de page, le tri ou la page ne compte **pas** comme un filtre ; une recherche faite d'espaces non plus ; la famille, la version ou la visibilité comptent. Bouton « Réinitialiser » et message vide suivent la même fonction.
2. **Espace « Pilotage » masqué** : aucun chemin d'interface ni état initial ne peut mener à l'espace masqué (le menu n'en liste que deux) ; la recherche globale et les liens vers un article ouvrent toujours le catalogue.
3. **Sauvegardes, alertes** : 0 alerte (ni bloc ni « Afficher les autres »), 1 à 3 alertes (pas de bouton), 5 alertes (trois visibles, « Afficher les 2 autres » les déplie sans perdre « Voir ce projet »).
4. **Messages vides** : Bibliothèque (aucun composant, tous archivés, filtres), Sauvegardes (aucune déclarée, filtres), Annuaire (organisations, contacts, filtres, **liste compacte quand une fiche est ouverte**) : un seul message, jamais « ne correspond aux filtres » sans filtre actif.
5. **Statistiques, périodes limites** : « Toutes les données » (aucune période précédente : pas de comparaison), dates personnalisées incomplètes (aucun chiffre d'une autre période), deux périodes à zéro (la ligne d'aide « Aucune donnée sur les deux périodes » n'est pas répétée sur les quatre cartes).
6. **Annuaire, textes longs et champs vides** : un nom très long ne casse pas la ligne ; un champ vide s'affiche « Non renseigné » et non « - » ; le sous-titre « Organisation professionnelle » n'est plus répété.
7. **Sites** : la mise en page à deux panneaux est intacte dès qu'il y a un site ; le grand message unique n'apparaît qu'**après** le chargement et seulement sans aucun site.
8. **Bibliothèque, repli du bandeau** : le bouton de repli reste visible quand le bandeau est replié (il ne se range pas dans la zone qu'il cache) et pilote le même état `libraryHeaderCollapsed` ; plus aucune commande propre à la Bibliothèque dans `WorkspaceHeader`.

## Révisions

- (14/11/2026, à la rédaction du plan) **Statistiques, « Nouveau sur la période »** : ce texte vient de `compare()` quand la période précédente vaut 0 et la période courante non (comparaison réelle). Je le **garde**. Seule la ligne « Aucune donnée sur les deux périodes » (deux zéros) est omise de la carte. À montrer à Carlos sur les captures.
- (14/11/2026) **Sauvegardes, titre des alertes** : le titre du groupe reste « Alertes des projets actifs » avec le compteur existant ; je ne le réécris pas en « N projets sans sauvegarde connue » parce que le titre des alertes peut varier (à lire dans le modèle d'alerte).

- (14/11/2026, tâche 3) **Offres : l'en-tête garde Actualiser et « + Service / Offre »** (zone `ot-heading-actions`, déjà seul bouton jaune) ; le `ListToolbar` n'est pas utilisé parce que la barre de filtres du Catalogue est une grille de listes étiquetées que les recettes `check-offres-tarifs-*` lisent. Les six chiffres, M3, l'espace Pilotage non listé, l'aide au survol et le message vide sont faits comme prévu. Coût si faux : Actualiser reste dans l'en-tête et non dans une barre commune.
- (14/11/2026, tâche 4) **Bibliothèque : le bouton « Replier le bandeau » n'est PAS déplacé.** Il appartient à l'en-tête global validé par Carlos au lot UX 1 (03/11/2026), il est repris par l'atelier d'en-tête (`HeaderWorkshop`) et par plusieurs recettes natives (`check-ux-v2-lot02b-workshop`, `02e-shell-journeys`, `real-shell-scenarios`, `shell-home-scenarios`) qui ciblent `#header-library` : le déplacer touche le cadre global, pas seulement la Bibliothèque. Reporté à la passe de finitions, à valider avec Carlos (point 4 de la fiche : son « ok global » reposait sur une description incomplète). Les chiffres clés, la barre d'outils, le menu Plus, les étiquettes et le message vide sont faits.
- (14/11/2026, tâche 4) Le bouton des retours Bridge (« À traiter · N » ou « Historique · N ») reste **visible** hors du menu Plus parce qu'il porte un compteur ; seules « Importer un retour », « Composer un site » et « Importer un composant » sont dans Plus.
- (14/11/2026, tâche 4) `libraryEmptyText` prend `{ includeArchived, filtersActive }` et non un total : la liste de la Bibliothèque est filtrée côté serveur, aucun total non filtré n'est disponible ; le message dit si les archivés sont exclus.
- (14/11/2026, tâche 5) Sites : un état `sitesLoaded` est ajouté, sinon le message « Aucun site » s'affichait avant la fin du chargement. Le panneau de gauche dit « Chargement des sites… » tant que la liste n'est pas arrivée.
- (14/11/2026, tâche 6) Sauvegardes : l'ancien affichage coupait en silence au-delà de 5 alertes (« N autre(s) alerte(s) »). Remplacé par trois lignes et un bouton « Afficher les N autres » (plus aucune alerte n'est cachée). Le compactage du bloc « Avant / après intervention » n'est pas fait : à juger sur capture.
- (14/11/2026, tâche 7) Statistiques : `KeyFigures.tsx` exporte `KeyFigureCard` (une carte), et le composant `Kpi` de la page l'utilise pour **les seize cartes des quatre onglets** (pas seulement la Vue d'ensemble) ; la couleur de tendance (vert, rouge) disparaît, le signe et le pourcentage du texte restent. La recette `lot10-real-scenarios.cjs` est réécrite sur `.aw-keyfigures` et `.aw-keyfigure--action`.
- (14/11/2026, tâche 11) Recettes Offres réécrites (règle H) : les compteurs se lisent par libellé dans `.ot-keyfigures`, les gardes de sortie utilisent l'espace Administration à la place de Pilotage.

## Carte des fichiers

| Fichier | Rôle |
|---|---|
| Créer `src/shared/ressourcesEmpty.ts` (+ `.test.ts`) | Messages vides Offres, Bibliothèque, Sauvegardes, Annuaire |
| Créer `src/renderer/commercial/catalogFiltersActive.ts` (+ `.test.ts`) | Une seule définition de « filtre actif » du Catalogue |
| Créer `src/renderer/statistics/statisticsComparison.ts` (+ `.test.ts`) | `compare` déplacé de `StatisticsPage.tsx` + `comparisonHelper` |
| Modifier `src/renderer/ui/KeyFigures.tsx`, `list-page.css` (+ `listPage.test.tsx`) | Action facultative d'une carte |
| Modifier `commercial/CatalogPage.tsx`, `catalog-workspace-v2.css`, `catalog-editor-v2.css` | Offres |
| Modifier `referentials/AtoumWebLibraryPage.tsx`, `AtoumWebLibraryPage.css`, `ui/WorkspaceHeader.tsx`, `App.tsx` (+ `ui/HeaderWorkshop.tsx` si la prop y est passée) | Bibliothèque et retrait du bouton de l'en-tête global |
| Modifier `bridge/BridgeSitesPage.tsx`, `BridgeSitesPage.css` | Sites |
| Modifier `backups/BusinessBackupsPage.tsx`, `BusinessBackupsPage.css` | Sauvegardes |
| Modifier `statistics/StatisticsPage.tsx`, `StatisticsPage.css` | Statistiques |
| Modifier `directory/DirectoryPage.tsx`, `DirectoryPage.css` | Annuaire |
| Créer `src/renderer/ui/ressourcesR8Wiring.test.ts` | Câblage et CSS par lecture du source (méthode de `gestionR7Wiring.test.ts`), complété à chaque tâche d'écran |
| Créer `scripts/seed-ressources-cas-de-figure.cjs` + `scripts/fixtures/ressources-cas-de-figure.json` | Cas de figure (simulation d'abord) |
| Modifier les recettes qui visent les anciens textes et classes | Voir tâche 11 |
| Modifier `ui/fontFloorBaseline.json` | À la baisse seulement (`gen-font-baseline.cjs`, relire `git diff`) |

---

### Tâche 1 : règles pures

**Files:**
- Create: `src/shared/ressourcesEmpty.ts`, `src/shared/ressourcesEmpty.test.ts`
- Create: `src/renderer/commercial/catalogFiltersActive.ts`, `src/renderer/commercial/catalogFiltersActive.test.ts`
- Create: `src/renderer/statistics/statisticsComparison.ts`, `src/renderer/statistics/statisticsComparison.test.ts`

**Interfaces:**
- Produces (`ressourcesEmpty.ts`) :
  - `catalogEmptyText(input: { filtersActive: boolean }): string`
  - `libraryEmptyText(input: { total: number; archived: number; includeArchived: boolean; filtersActive: boolean }): string`
  - `backupsEmptyText(input: { total: number; filtersActive: boolean }): string`
  - `directoryEmptyText(input: { view: 'organizations' | 'contacts'; filtersActive: boolean }): string`
- Produces (`catalogFiltersActive.ts`) : `catalogFiltersActive(filters: CatalogTableContext): boolean` (type existant ; la fonction ignore `pageSize`, la page et le tri).
- Produces (`statisticsComparison.ts`) : `compare(current: number, previous: number): { text: string; direction: 'up' | 'down' | 'same' | 'new' }` (déplacé tel quel) et `comparisonHelper(value: ReturnType<typeof compare> | undefined): string | undefined`.

- [ ] **Step 1 : tests qui échouent.** Dans `ressourcesEmpty.test.ts` : `catalogEmptyText({filtersActive:true})` vaut « Aucune offre ou service pour ces filtres. » ; `{filtersActive:false}` vaut « Le catalogue est vide. Crée une offre ou un service avec « + Service / Offre ». » ; `libraryEmptyText({total:0,archived:0,includeArchived:false,filtersActive:false})` vaut « Aucun composant dans la Bibliothèque. Ajoute-en un avec « Nouveau composant » ou importe un package. » ; avec `total:3,archived:3,includeArchived:false` (rien de visible, tous archivés) le texte contient « archivés (3) » et « Archivés » ; `filtersActive:true` vaut « Aucun composant pour ces filtres. » ; `backupsEmptyText({total:0,filtersActive:false})` vaut « Aucune sauvegarde déclarée. Déclare-en une avec « Déclarer une sauvegarde ». » et avec `filtersActive:true` « Aucune sauvegarde pour ces filtres. » ; `directoryEmptyText` : « Aucune organisation. Ajoute-en une avec « + Organisation ». », « Aucun contact. Ajoute-en un avec « + Contact ». », et « Aucune organisation pour ces filtres. » / « Aucun contact pour ces filtres. ». Aucun texte ne contient de tiret long ni « (s) ».
  Dans `catalogFiltersActive.test.ts` : le contexte par défaut (`defaultCatalogContext()`) donne `false` ; `{...défaut, pageSize: 50}` `false` ; `{...défaut, query: '   '}` `false` ; `query: 'seo'`, `type: 'offer'`, `itemStatus: 'archived'`, `category: 'x'`, `family: 'f'`, `versionState: 'draft'`, `visibility: 'public'` donnent chacun `true`.
  Dans `statisticsComparison.test.ts` : `compare(0, 0)` renvoie la direction `same` et `comparisonHelper(compare(0,0))` est `undefined` ; `comparisonHelper(compare(5, 0))` vaut « Nouveau sur la période » ; `comparisonHelper(compare(10, 5))` commence par « + 100 % » ; `comparisonHelper(undefined)` est `undefined`.
- [ ] **Step 2 : lancer** `node scripts/run-tests.cjs src/shared/ressourcesEmpty.test.ts src/renderer/commercial/catalogFiltersActive.test.ts src/renderer/statistics/statisticsComparison.test.ts` ; attendu : échec parce que les modules n'existent pas.
- [ ] **Step 3 : implémenter** les trois fichiers aux signatures ci-dessus. `catalogFiltersActive` reprend les sept champs de l'ancien `hasFilters` (`CatalogPage.tsx` ligne 340) sans la taille de page. `compare` est déplacé sans changement de comportement ; `StatisticsPage.tsx` l'importe à la tâche 7.
- [ ] **Step 4 : relancer** les trois tests ; attendu : verts.

### Tâche 2 : action facultative sur `KeyFigures`

**Files:**
- Modify: `src/renderer/ui/KeyFigures.tsx`, `src/renderer/ui/list-page.css`
- Test: `src/renderer/ui/listPage.test.tsx`

**Interfaces:**
- Consumes : `KeyFigureItem` existant.
- Produces : `KeyFigureItem` reçoit `onAction?: () => void`, `actionLabel?: string`, `expanded?: boolean`, `controls?: string`. Une carte sans `onAction` reste un `<article>` identique à aujourd'hui (aucun changement pour R7). Une carte avec `onAction` est un `<button type="button" class="aw-keyfigure aw-keyfigure--action">` avec `aria-label` `« {label} : {actionLabel} »`, `aria-expanded` et `aria-controls` repris.

- [ ] **Step 1 : tests qui échouent** (dans `listPage.test.tsx`) : une carte avec `onAction` devient un bouton, un clic appelle `onAction` une fois, `aria-expanded` vaut la valeur passée, `aria-label` vaut « Contractuel signé : voir les éléments exacts » ; une carte sans `onAction` ne contient aucun `<button>` ; les tests de R7 existants restent verts.
- [ ] **Step 2 : lancer** `node scripts/run-tests.cjs src/renderer/ui/listPage.test.tsx` ; attendu : échec.
- [ ] **Step 3 : implémenter** dans `KeyFigures.tsx` ; dans `list-page.css`, `.aw-keyfigure--action` : bouton plein cadre (`text-align: left`, `font: inherit`, curseur, survol et focus visibles avec les jetons existants, 14 px minimum, aucun `!important`).
- [ ] **Step 4 : relancer** ; attendu : vert.

### Tâche 3 : Offres & Tarifs

**Files:**
- Modify: `src/renderer/commercial/CatalogPage.tsx` (en-tête et espaces lignes 645 à 670, `hasFilters` ligne 340, `filtersActive` ligne 754, message vide ligne 749), `catalog-workspace-v2.css`, `catalog-editor-v2.css`
- Create: `src/renderer/ui/ressourcesR8Wiring.test.ts` (première section : Offres)

**Interfaces:**
- Consumes : `catalogFiltersActive`, `catalogEmptyText` (tâche 1), `KeyFigures`, `ListToolbar`, `plural`.
- Produces : rien pour les tâches suivantes (sauf le fichier de test de câblage, complété ensuite).

- [ ] **Step 1 : test de câblage qui échoue** (lecture du source, comme `gestionR7Wiring.test.ts`) : `CatalogPage.tsx` importe `KeyFigures` et `catalogFiltersActive` ; n'appelle plus `ot-counters` ; le bouton « Réinitialiser les filtres » et le `ConfiguredDataTable` utilisent `catalogFiltersActive(filters)` (une seule définition : le source ne contient plus l'expression `Boolean(query.trim())||typeFilter!=='all'` ni `JSON.stringify({...filters,pageSize:0})`) ; le tableau de navigation des espaces ne contient que `['catalog','Catalogue']` et `['administration','Administration']` ; le texte « À venir » n'apparaît plus dans le rendu des espaces ; `space==='steering'` ne peut plus être atteint par `changeSpace` (le type `space` reste, le bouton disparaît).
- [ ] **Step 2 : lancer** `node scripts/run-tests.cjs src/renderer/ui/ressourcesR8Wiring.test.ts` ; attendu : échec.
- [ ] **Step 3 : implémenter.** Les six chiffres deviennent `KeyFigures` (mêmes libellés, mêmes valeurs ; l'aide « N dans les résultats filtrés » reste, seulement quand `catalogFiltersActive`) ; « Actualiser » et le compteur passent dans un `ListToolbar` avec « + Service / Offre » seul bouton principal ; la barre de filtres existante (recherche, type, catégorie, statut, avancés) est passée comme `filters` sans retirer aucun filtre ; la phrase « Publié et brouillon peuvent concerner le même article… » devient une aide de `FieldHelp` (composant existant) ; l'onglet « Pilotage » n'est plus listé (laisser le bloc `space==='steering'` en place avec un commentaire disant qu'il est volontairement non listé tant qu'il n'a aucune fonction) ; message vide sans filtre via `catalogEmptyText`. Compteur de résultats : `plural(filtered.length, 'offre ou service', 'offres ou services')`, à vérifier contre les textes que les recettes `check-offres-tarifs-*` attendent. CSS : retirer les règles de `.ot-counters*` devenues inutiles (rechercher chaque sélecteur avant, `css-prune.cjs`, copie `.bak` avant), baisser les petits textes touchés.
- [ ] **Step 4 : relancer** le test de câblage et `node scripts/run-tests.cjs src/renderer/commercial` ; attendu : vert.

### Tâche 4 : Bibliothèque AtoumWeb et retrait du bouton de l'en-tête global

**Files:**
- Modify: `src/renderer/referentials/AtoumWebLibraryPage.tsx` (en-tête et barre d'outils lignes 1195 à 1245, liste ligne 1482), `AtoumWebLibraryPage.css`, `src/renderer/ui/WorkspaceHeader.tsx` (ligne 51 et props `libraryCollapsed`, `onToggleLibrary`), `src/renderer/App.tsx` (lignes 422 à 456), `src/renderer/ui/HeaderWorkshop.tsx` si la prop y est passée
- Test: `ressourcesR8Wiring.test.ts` (section Bibliothèque), tests qui visent `#header-library` (chercher avec `grep -rn "header-library" src scripts`)

**Interfaces:**
- Consumes : `libraryEmptyText`, `KeyFigures`, `ListToolbar`, `plural`, `ui/operationStatusTone.ts`.
- Produces : la prop `onToggleHeader: () => void` de `AtoumWebLibraryPage` (en plus de `headerCollapsed`), alimentée par `() => setLibraryHeaderCollapsed(value => !value)` dans `App.tsx`. `WorkspaceHeader` n'a plus de bouton ni de props propres à la Bibliothèque.

- [ ] **Step 1 : tests qui échouent** : `WorkspaceHeader.tsx` ne contient plus `header-library` ni `libraryCollapsed` ni `onToggleLibrary` ; `App.tsx` passe `onToggleHeader` à la page et lui passe toujours `headerCollapsed={libraryHeaderCollapsed}` ; la page importe `KeyFigures` et `ListToolbar`, appelle `libraryEmptyText`, rend un bouton « Replier les filtres » / « Afficher les filtres » **en dehors** de la zone repliée (point de vigilance 8) ; la case « Archivés » est une `label` en 14 px ; « Importer un composant », « Composer un site », « Importer un retour » (et « Retours importés ») sont dans un menu « Plus » (composant du menu « Plus » de R4, `moreMenuModel`), « Nouveau composant » reste seul principal ; les étiquettes « Famille ✓ », « Base ✓ », « Réutil. ⚠ » deviennent « Famille », « Base », « À réutiliser » avec le ton de pastille de `operationStatusTone`.
- [ ] **Step 2 : lancer** le test ; attendu : échec.
- [ ] **Step 3 : implémenter** ; chiffres clés avec les mêmes quatre valeurs (`summary.total`, `ready`, `adapt`, `references`) ; le compteur « N composants » via `plural` ; le défilement intérieur de la **liste** disparaît (la page défile), le volet de détail garde le sien ; message vide via `libraryEmptyText` avec `total`, `archived` et `includeArchived` de l'état existant. Mettre à jour les tests et recettes qui visent `#header-library` (même texte de bouton, nouvel emplacement). `css-prune.cjs` sur les règles remplacées de `AtoumWebLibraryPage.css`.
- [ ] **Step 4 : relancer** le test de câblage, `node scripts/run-tests.cjs src/renderer/referentials src/renderer/ui` et `npm run typecheck` ; attendu : vert.

### Tâche 5 : Sites

**Files:**
- Modify: `src/renderer/bridge/BridgeSitesPage.tsx` (barre d'outils ligne 490, liste et vide lignes 604 à 622), `BridgeSitesPage.css`
- Test: `ressourcesR8Wiring.test.ts` (section Sites)

- [ ] **Step 1 : test qui échoue** : le source contient la phrase « Importe la première copie envoyée par AtoumWeb Bridge » et l'explication de « snapshot » (« une photographie lisible du site ») ; le bloc d'état vide unique est rendu seulement quand le chargement est terminé et `sites.length === 0` (lire le nom réel de l'état de chargement dans le fichier) ; la structure à deux panneaux (`bridge-sites`, `bridge-browser`) est conservée dans la branche `sites.length > 0` ; le bouton « Importer un snapshot Bridge » reste l'unique `primary-button` de la page.
- [ ] **Step 2 : lancer** ; attendu : échec.
- [ ] **Step 3 : implémenter** : sans site, un seul grand message avec le bouton d'import ; avec au moins un site, mise en page actuelle inchangée ; en-tête de la barre d'outils sans capitales espacées (`eyebrow` retiré ou en casse normale) ; baisser les petits textes **uniquement** des règles de l'en-tête et de l'état vide.
- [ ] **Step 4 : relancer** le test ; attendu : vert.

### Tâche 6 : Sauvegardes

**Files:**
- Modify: `src/renderer/backups/BusinessBackupsPage.tsx` (chiffres lignes 337 à 342, note ligne 344, alertes autour de la ligne 404, barre de filtres, historique ligne 455), `BusinessBackupsPage.css`
- Test: `ressourcesR8Wiring.test.ts` (section Sauvegardes)

**Interfaces:**
- Consumes : `KeyFigures`, `ListToolbar`, `backupsEmptyText`, `limitItems`, `plural`.

- [ ] **Step 1 : test qui échoue** : la page importe `KeyFigures` et plus `BackupKpi` ; la note `technical-safety-note` n'est plus en petit texte (la règle CSS correspondante ne déclare aucun `font-size` sous 14 px ; même phrase) ; les alertes passent par `limitItems(alerts, 3)` avec un bouton « Afficher les N autres » accordé par `plural` ; `backupsEmptyText` remplace « Aucune sauvegarde ne correspond aux filtres. » ; la barre d'outils est un `ListToolbar` dont « Déclarer une sauvegarde » est le seul principal ; les champs de recherche et de lieu ne coupent plus leurs libellés (largeur minimale posée dans le CSS de la page, vérifiée sur capture).
- [ ] **Step 2 : lancer** ; attendu : échec.
- [ ] **Step 3 : implémenter** ; les quatre chiffres gardent leurs valeurs et leurs aides (`detail` devient `helper`) ; « Avant / après intervention » : sélecteur et message sur une ligne, même contenu, aucun lancement de sauvegarde ; `css-prune.cjs` sur `.business-backups-kpis`, `.business-backup-kpi*` devenus inutiles.
- [ ] **Step 4 : relancer** ; attendu : vert, puis `node scripts/run-tests.cjs src/main/backups/businessBackupsIpc.ec04.test.ts` (non régressé).

### Tâche 7 : Statistiques

**Files:**
- Modify: `src/renderer/statistics/StatisticsPage.tsx` (barre lignes 292 à 334, cartes lignes 338 à 349, `Kpi` ligne 442, `CardTitle` ligne 489, `compare` ligne 108), `StatisticsPage.css`
- Test: `ressourcesR8Wiring.test.ts` (section Statistiques)

**Interfaces:**
- Consumes : `compare` et `comparisonHelper` (tâche 1), `KeyFigures` avec `onAction` (tâche 2).

- [ ] **Step 1 : test qui échoue** : `StatisticsPage.tsx` importe `compare` de `statisticsComparison` et ne le définit plus ; les quatre cartes de la Vue d'ensemble sont des `KeyFigures` avec `onAction`, `expanded`, `controls="statistics-evidence-panel"` ; le lien « Voir les éléments exacts » en petit n'existe plus comme bouton séparé ; la barre de période tient dans un seul panneau sur une ligne (`statistics-period` n'a plus de `margin-left: auto` isolé : lire la règle) ; `CardTitle` n'applique plus de capitales espacées (la règle `.statistics-card eyebrow` ou équivalente n'a ni `text-transform: uppercase` ni `letter-spacing`).
- [ ] **Step 2 : lancer** ; attendu : échec.
- [ ] **Step 3 : implémenter** ; valeur et aide de chaque carte : `value` inchangé, `helper = comparisonHelper(comparison)` ; l'élément ouvert reste piloté par `expandedKpi` ; les onglets, les graphiques et le panneau de preuve restent. `css-prune.cjs` sur `.statistics-kpi*` devenus inutiles.
- [ ] **Step 4 : relancer** le test, `node scripts/run-tests.cjs src/renderer/statistics src/renderer/analytics` ; attendu : vert.

### Tâche 8 : Annuaire

**Files:**
- Modify: `src/renderer/directory/DirectoryPage.tsx` (chiffres et barre lignes 322 à 350, liste compacte ligne 365, colonnes lignes 367 à 372), `DirectoryPage.css`
- Test: `ressourcesR8Wiring.test.ts` (section Annuaire)

**Interfaces:**
- Consumes : `KeyFigures`, `ListToolbar`, `directoryEmptyText`, `plural`.

- [ ] **Step 1 : test qui échoue** : la page importe `KeyFigures` et `ListToolbar` (plus `DirectoryKpi`) ; le compteur est `plural(organizations.length, 'organisation', 'organisations')` ou `plural(contacts.length, 'contact', 'contacts')` selon l'onglet ; les onglets Organisations / Contacts sont passés en `leading` ; « + Organisation » / « + Contact » est le seul `primary-button` ; le sous-titre de repli `'Organisation professionnelle'` n'existe plus dans le source ; les champs vides n'utilisent plus `'—'` mais « Non renseigné » (classe grise) ; `directoryEmptyText` sert **les deux** endroits (liste compacte et tableau, via `emptyFilteredText`).
- [ ] **Step 2 : lancer** ; attendu : échec.
- [ ] **Step 3 : implémenter** ; colonnes, tri et « Colonnes et vues » inchangés ; nom tronqué avec info-bulle complète (`title`) au lieu de couper silencieusement ; `css-prune.cjs` sur les règles d'en-tête remplacées.
- [ ] **Step 4 : relancer** le test, puis `node scripts/run-tests.cjs src/renderer/directory` s'il existe des tests ; attendu : vert.

### Tâche 9 : budget, CSS et fins de ligne

**Files:** `src/renderer/ui/fontFloorBaseline.json`, tous les fichiers modifiés.

- [ ] **Step 1 : lancer** `node C:\DEV\Livrables\Cadrage-parcours\outils-edition\small-fonts.cjs <css>` sur chaque CSS touché pour voir ce qui reste sous 14 px **dans les règles retouchées** ; corriger celles-là seulement.
- [ ] **Step 2 : régénérer le budget** : `node C:\DEV\Livrables\Cadrage-parcours\outils-audit\gen-font-baseline.cjs` ; relire `git diff` : le total passe de 648 à une valeur **plus basse**, aucun fichier ne monte. Lancer `node scripts/run-tests.cjs src/renderer/ui/fontFloor.test.ts src/renderer/ui/importantBudget.test.ts` ; attendu : vert.
- [ ] **Step 3 : fins de ligne** : `node C:\DEV\Livrables\Cadrage-parcours\outils-edition\eol-report.cjs <tous les fichiers modifiés>` ; corriger avec `--fix` tout fichier devenu mêlé par ce lot (sans toucher aux autres).

### Tâche 10 : jeu de cas de figure (simulation seulement)

**Files:**
- Create: `scripts/seed-ressources-cas-de-figure.cjs`, `scripts/fixtures/ressources-cas-de-figure.json` (modèle : `scripts/seed-gestion-cas-de-figure.cjs`)

- [ ] **Step 1 : écrire le script** sur le modèle des quatre existants : `--workspace "<Workspace>"` en simulation sur copie jetable par défaut, `--apply` écrit avec sauvegarde dans `Sauvegardes-lots\avant-cas-de-figure-ressources-*.sqlite`, idempotent, refuse un `-wal` ou `-journal` non vide (tolère un `-wal` vide), repère `Workspace\DONNEES-FICTIVES-CAS-RESSOURCES.json`, libellés « TEST ». Contenu (voir la fiche) : 4 sauvegardes déclarées dont une copie locale manquante et une référence stable ; 3 articles de catalogue TEST (brouillon seul, inactif, archivé) ; 2 composants de Bibliothèque TEST (un « À adapter », un archivé) et 1 référence ; 2 organisations TEST de l'Annuaire (nom très long, champs vides) et 1 contact sans organisation. **Sites** : regarder d'abord si le service d'import accepte un snapshot de test sans fichier Bridge ; sinon ne rien écrire pour Sites et le noter dans le repère.
- [ ] **Step 2 : simuler** : `node scripts/seed-ressources-cas-de-figure.cjs --workspace "C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-Claude-Codex-20261110\Workspace"` (sans `--apply`) ; attendu : le compte d'éléments par catégorie, 0 erreur, la préproduction inchangée (vérifier l'empreinte avant et après).
- [ ] **Step 3 : montrer la simulation à Carlos** et poser la question avec l'outil de question avant tout `--apply`. **Ne jamais écrire sans son accord explicite.**

### Tâche 11 : recettes et suite complète

- [ ] **Step 1 : typecheck et suite** : `npm run typecheck` (propre) ; `node scripts/run-tests.cjs` (la suite complète passe, comparer aux 299 fichiers et 2 396 tests de R7).
- [ ] **Step 2 : scripts natifs de référence, sans option, un seul Electron à la fois, en tâche de fond** : `check-ux-v2-lot01a-typography.cjs` (72), `check-ux-v2-lot01a-states.cjs` (18/18), `check-ux-v2-lot01b-abby-guard.cjs` (25), `check-ux-v2-lot01a-real-ui.cjs` (857 contrôles sur 17 écrans ; adapter ses attentes si elles visent les anciens textes de ces six écrans).
- [ ] **Step 3 : recettes propres aux écrans** : lancer `check-offres-tarifs-lot1.cjs`, `check-offres-tarifs-lot2-final.cjs`, `check-offres-tarifs-lot2-legacy.cjs`, `check-offres-tarifs-persistent-drafts.cjs`, `check-catalog-label-layout.cjs`, `check-ux-v2-03e-directory.cjs` et celles qui visent la Bibliothèque, Bridge, Sauvegardes ou Statistiques (lister avec `grep -ln "Bibliothèque AtoumWeb\|Sauvegardes\|Statistiques\|Sites" scripts/check-*.cjs` avant). Une recette qui échoue est **d'abord relancée sur une copie détachée du dernier commit** (règle H) ; si elle échouait déjà, l'inscrire dans `FINITIONS.md` ; sinon la réécrire sur des règles durables (`.aw-keyfigures`, `.aw-list-toolbar`).

### Tâche 12 : recette visuelle, registres et commit

- [ ] **Step 1 : captures** `avant\` (dernier commit, mêmes données, copie détachée comme décrit dans la passation) et `apres\` dans `C:\DEV\Livrables\Cadrage-parcours\captures-r8\` ; outil `audit-captures.cjs`, copie jetable, `SOURCE_UNCHANGED true`, 0 erreur console. Relire **chaque** capture ; corriger ce qu'elle montre (un défaut trouvé par capture et non par test est attendu à chaque lot) ; après l'accord pour le jeu de cas de figure et son `--apply`, refaire les captures des écrans concernés (Sauvegardes remplies, Offres avec brouillon, inactif et archivé, Bibliothèque avec archivé, Annuaire avec nom long).
- [ ] **Step 2 : présenter à Carlos** le dossier avant / après et dire ce qui n'a pas été vu (Sites rempli si non réalisable, fiches détaillées, états d'erreur, fenêtre étroite, clavier, thèmes AtoumWeb et Blanc, densités Compact et Confort +). Le dire : la revue finale est l'autocontrôle de l'auteur.
- [ ] **Step 3 : après sa recette**, mettre à jour `docs/refonte/FINITIONS.md` (nouvelles finitions : rail coupé en bas de la fenêtre, textes sous 14 px restants dans les éditeurs, F27), `PROJECT_STATUS.md` (en-tête R8 avec preuves chiffrées), `docs/MANAGER_BRIDGE_ROADMAP.md` si l'écran Sites a changé, un fichier de reprise `docs/refonte/PASSATION-2026-11-14-apres-R8.md` et la mémoire. Compléter la section « Révisions » de ce plan.
- [ ] **Step 4 : un seul commit local**, **seulement après ses captures vues** : `feat(r8): Offres, Bibliotheque, Sites, Sauvegardes, Statistiques et Annuaire sur le modele de liste` avec le trailer demandé. Pas de push ni de PR sans accord explicite.

# R2 Socle commun : plan

> **Pour l'exécutant :** exécution en ligne (`superpowers:executing-plans`), une tâche à la fois, un commit local par tâche terminée et testée (règle C). Pas de push, PR ni fusion sans accord. Skill de design : `atoumweb-design`, citée à chaque étape.

**Objectif :** corriger les briques partagées relevées par l'audit : tableau (message vide, en-têtes), en-tête de page unique sans puce de migrations, notice qui se ferme, pastille d'état unique, hiérarchie des boutons, budget de petits textes.

**Architecture :** des fonctions pures testées (`tableEmpty`, `tableHeader`, `noticeLifetime`, `statusTone`, `fontFloor`, `buttonHierarchy`) alimentent des composants existants ou nouveaux ; le CSS partagé perd des règles au lieu d'en gagner ; des tests de budget empêchent toute régression.

**Stack :** React, TypeScript, vitest (`npm test` = `node scripts/run-tests.cjs`), `npm run typecheck`, scripts natifs Electron du dépôt.

**Spec :** `docs/refonte/plans/2026-11-13-r2-socle-commun-design.md`.

## Contraintes globales

- Aucun `!important` dans un fichier nouveau ; aucune couleur écrite en dur dans un CSS nouveau (jetons `--aw-*`).
- `PageHeader` conserve la classe `page-heading` et un seul `h1` : 7 scripts natifs lisent `.page-heading h1`.
- Le bloc `.notice` d'`App.tsx` garde ses classes (`.notice`, `.notice-close`) : des scripts natifs les lisent.
- Aucun écran, onglet ni fonction supprimé. Aucune donnée, règle métier ni ordre du parcours touché.
- Vérification visuelle : Noir / Confort seulement. Captures sur copie jetable, sans port de débogage (règle D).
- Le budget de `!important` de `ui/importantBudget.test.ts` ne monte pas ; celui des petits textes (tâche 1) ne monte pas.

## Points de vigilance (Review Focus)

1. Le mot « filtre » n'apparaît jamais dans un tableau vide dont aucun filtre n'est actif.
2. Aucun en-tête ne se coupe au milieu d'un mot à 1 000 px de large ; la colonne « Ouvrir » garde 88 px au moins.
3. Un message d'erreur, ou avec action, ne disparaît jamais seul.
4. Les scripts natifs trouvent toujours `.page-heading h1` sur les 17 destinations.
5. Une pastille de statut inconnue retombe sur « neutre » et affiche toujours son libellé.
6. Aucun budget (`!important`, petits textes) n'augmente.

---

### Tâche 1 : budget des petits textes et `.quote-line small`

**Fichiers :** créer `src/renderer/ui/fontFloor.ts`, `src/renderer/ui/fontFloor.test.ts`, `src/renderer/ui/fontFloorBaseline.json` ; modifier `src/renderer/ui-consistency-v2.css:1402`.

**Interfaces :** produit `countSmallFontDeclarations(css: string): number` (compte les `font-size: N px` avec N < 14, commentaires ignorés, `max()`, `clamp()` et `var()` ignorés).

- [ ] Test : `countSmallFontDeclarations('.a{font-size:12px}.b{font-size:14px}.c{font-size:max(14px,1em)}/* .d{font-size:9px} */')` vaut 1.
- [ ] Test de budget : pour chaque `.css` de `src/renderer`, le nombre est inférieur ou égal à la valeur de `fontFloorBaseline.json` (une entrée par fichier). Le test échoue si un fichier absent de la base a des occurrences.
- [ ] Test ciblé : la règle `.quote-line small` de `ui-consistency-v2.css` ne contient aucun `font-size` inférieur à 14 px.
- [ ] Les voir échouer, générer `fontFloorBaseline.json` avec le même compteur (attendu : 648 au total, relevé du 13/11), relire le total.
- [ ] Retirer `font-size:12px` de la règle de `ui-consistency-v2.css:1402` (garder `color`, `display`, `margin-top`) ; mettre la valeur de ce fichier à jour dans la base.
- [ ] `npm run typecheck`, `npm test`. Commit : `test(r2): budget des petits textes et correction de .quote-line small`.

### Tâche 2 : tableau, message vide et en-têtes

**Fichiers :** créer `ui/tableEmpty.ts`, `ui/tableHeader.ts`, tests `ui/tableEmpty.test.ts`, `ui/tableHeader.test.ts`, `ui/dataTableRender.test.tsx` ; modifier `ui/DataTable.tsx`, `ui/ConfiguredDataTable.tsx`, `ui/table-layout.css`, `convergence-visual-consistency.css` (règle ligne 17 retirée).

**Interfaces :**
- `tableEmptyMessage(state: { filtersActive?: boolean }): { text: string; clearLabel?: string }` : sans filtre `{ text: 'Rien à afficher pour l’instant.' }` ; avec filtre `{ text: 'Aucun résultat pour ces filtres.', clearLabel: 'Effacer les filtres' }`.
- `hasActiveFilters(values: ReadonlyArray<string | null | undefined | false>): boolean` : vrai si une valeur n'est ni vide (espaces compris), ni `'all'`, ni `'tous'`, ni fausse.
- `headerMinWidth(label: string): number` : `clamp(plusLongMot(label).length * 9 + 40, 72, 260)`.
- `DataTable` gagne `filtersActive?: boolean`, `onClearFilters?: () => void`, `emptyText?: string` ; `ConfiguredDataTable` les transmet.

- [ ] Tests purs : `tableEmptyMessage({})` ne contient pas « filtre » ; avec `filtersActive: true` oui ; `hasActiveFilters(['', 'all'])` faux, `(['', 'draft'])` vrai, `(['  '])` faux ; `headerMinWidth('Destinataire')` ≥ 148, `('Progression')` ≥ 139, `('Coordonnées')` ≥ 148, `('Ouvrir')` ≥ 94, `('')` = 72.
- [ ] Test de rendu statique : `DataTable` sans ligne et sans `filtersActive` ne contient pas « filtre » ; avec `filtersActive` et `onClearFilters`, contient le bouton « Effacer les filtres » ; avec lignes, aucun message.
- [ ] Les voir échouer. Implémenter ; dans `widthOf`, `Math.max(headerMinWidth(column.label), …)` sauf colonne à largeur fixe.
- [ ] CSS `ui/table-layout.css` : `.aw-data-table th` en `text-transform:none; overflow-wrap:normal; word-break:normal; hyphens:manual; font-size:var(--aw-font-functional); font-weight:700` ; retirer `overflow-wrap:anywhere` pour `th` et pour `th .aw-ui-button-label` (le garder pour `td`). Supprimer `convergence-visual-consistency.css:17`, devenue redondante.
- [ ] Mesure dans l'application : calculer `text-transform` et `overflow-wrap` des `th` de Devis, Facturation, Documents (colonnes sans tri) ; confirmer ou infirmer l'hypothèse du design et le noter dans `PROJECT_STATUS.md`.
- [ ] `npm run typecheck`, `npm test`. Commit : `fix(r2): tableau sans faux message vide, en-têtes entiers et de casse unique`.

### Tâche 3 : brancher `filtersActive` dans les écrans

**Fichiers :** `billing/BillingPage.tsx`, `commercial/CatalogPage.tsx`, `commercial/QuotesPage.tsx`, `crm/ClientsPage.tsx`, `crm/ProspectsPageV2.tsx`, `directory/DirectoryPage.tsx`, `documents/DocumentsPage.tsx`, `expenses/ExpensesPage.tsx`, `operations/OperationsPage.tsx`, `projects/ProjectsPage.tsx`, `time/TimePage.tsx`.

**Interfaces :** consomme `hasActiveFilters`, `DataTable`/`ConfiguredDataTable` de la tâche 2.

- [ ] Pour chaque page : lire son état de recherche et de filtres, calculer `filtersActive = hasActiveFilters([recherche, statut, …])`, passer `filtersActive` et, si la page a déjà une fonction d'effacement, `onClearFilters`.
- [ ] `npm run typecheck`, `npm test`.
- [ ] Captures Noir / Confort des 11 listes à vide (copie jetable, base vierge) : le message ne cite plus de filtre quand il n'y en a pas.
- [ ] Commit : `fix(r2): messages de liste vide corrects sur les onze écrans`.

### Tâche 4 : en-tête de page unique, sans puce de migrations

**Fichiers :** créer `ui/PageHeader.tsx`, `ui/page-header.css`, `ui/pageHeader.test.tsx` ; modifier `App.tsx:417`, `crm/ClientsPage.tsx:628`, `commercial/CatalogPage.tsx:648`, `crm/ProspectsPageV2.tsx:513`, `main.tsx` (import du CSS) ; retirer les règles de masquage `commercial/catalog-workspace-v2.css:2`, `crm/client-list-quick-v2.css:5`, `crm/prospect-visual-pilot.css:52`, `crm/prospection-directory-pilot.css:42`.

**Interfaces :** produit `PageHeader({ icon, title, help?, meta?, actions? }: { icon: ReactNode; title: string; help?: string; meta?: ReactNode; actions?: ReactNode })` qui rend `<div class="page-heading aw-page-header">` avec un seul `<h1>` contenant l'icône et le titre, l'aide `FieldHelp` à côté, `meta` (compteur) et `actions` à droite.

- [ ] Tests de rendu statique : un seul `h1` ; la classe `page-heading` présente ; l'aide rendue seulement si fournie ; aucune occurrence de « SQLite » ni de « migration ». Test source : `App.tsx` ne contient plus `database-chip`.
- [ ] Les voir échouer. Implémenter `PageHeader` et son CSS (jetons, sans `!important`).
- [ ] `App.tsx:417` : rendre `PageHeader` pour les pages sans en-tête propre ; ne plus rendre l'en-tête générique pour Prospection, Clients et Offres (ils rendent le leur avec `PageHeader`, actions comprises : « + Prospect », « + Nouveau client », « + Service / Offre »). La puce disparaît ; le détail reste dans Réglages (`App.tsx:647`).
- [ ] Supprimer les quatre règles de masquage, devenues sans objet.
- [ ] Captures avant / après des 17 destinations : même place du titre, même hauteur d'en-tête, plus de puce.
- [ ] `npm run typecheck`, `npm test`. Commit : `refactor(r2): en-tête de page unique, puce de migrations retirée`.

### Tâche 5 : notice de changement d'affichage qui se ferme

**Fichiers :** créer `ui/noticeLifetime.ts`, `ui/noticeLifetime.test.ts` ; modifier `App.tsx` (`showMessage`, lignes 261 et 268).

**Interfaces :** `noticeTimeout(options: { autoDismissMs?: number; hasAction: boolean }): number | null` : `null` si une action est liée ou si `autoDismissMs` est absent, sinon `autoDismissMs`. `showMessage(nextMessage: string, action?: () => void, options?: { autoDismissMs?: number })`.

- [ ] Tests : `noticeTimeout({ hasAction: true, autoDismissMs: 8000 })` = `null` ; `({ hasAction: false })` = `null` ; `({ hasAction: false, autoDismissMs: 8000 })` = 8000.
- [ ] Implémenter : un effet arme un minuteur sur le message courant, nettoyé quand le message change ; les notices de thème et de densité passent `autoDismissMs: 8000`, toutes les autres restent sans échéance.
- [ ] `npm run typecheck`, `npm test`. Commit : `fix(r2): la notice de thème et de densité se ferme seule`.

### Tâche 6 : pastille d'état unique (tableau à valider par Carlos avant code)

**Fichiers :** créer `ui/statusTone.ts`, `ui/statusTone.test.ts` ; modifier les listes de Prospection (`crm/ProspectsPageV2.tsx`), Devis (`commercial/QuotesPage.tsx`), Clients (`crm/ClientsPage.tsx`), Annuaire (`directory/DirectoryPage.tsx`), Projets (`projects/ProjectsPage.tsx`).

**Interfaces :** `toneForStatus(domain: 'quote' | 'prospect' | 'client' | 'project' | 'relation', value: string): StatusTone` (type de `ui/StatusPill.tsx`), valeur inconnue = `'neutral'`.

- [ ] **Avant tout code :** lire les valeurs techniques des statuts dans `src/shared/contracts.ts`, puis soumettre à Carlos le tableau statut → ton. Proposition de départ, à corriger : neutre (brouillon, prévu, inactif, archivé) ; info (envoyé, en attente de retour, à qualifier, besoin à identifier, à préparer, planifié) ; alerte (devis à préparer, à relancer, expire bientôt) ; succès (accepté, actif, gagné, payé, terminé, client) ; danger (refusé, perdu, expiré, en retard, bloqué) ; accent (prospect).
- [ ] Tests : chaque valeur technique du tableau validé a le ton attendu ; une valeur inconnue donne `'neutral'` ; le rendu de `StatusPill` contient toujours son libellé.
- [ ] Les voir échouer. Implémenter `toneForStatus`, remplacer les `status-pill` hérités par `StatusPill` dans les cinq listes. Les autres écrans migrent dans leur lot.
- [ ] Captures avant / après des cinq listes : une seule forme de pastille.
- [ ] `npm run typecheck`, `npm test`. Commit : `refactor(r2): pastilles d'état unifiées sur les jetons dans cinq listes`.

### Tâche 7 : une action principale par vue

**Fichiers :** créer `ui/buttonHierarchy.ts`, `ui/buttonHierarchy.test.ts` ; modifier les fichiers que le test désigne (dont `commercial/QuotesPage.tsx` pour « Fermer » de l'assistant).

**Interfaces :** `findPrimaryMisuse(source: string): string[]` : renvoie les libellés des boutons `primary-button` ou `variant="primary"` dont le texte commence par Fermer, Annuler, Retour, Réduire, Replier ou Actualiser (détection sur une même ligne).

- [ ] Tests : `findPrimaryMisuse('<button className="primary-button">Fermer</button>')` = `['Fermer']` ; `'<button className="secondary-button">Fermer</button>'` = `[]` ; `'<AppButton variant="primary">Enregistrer</AppButton>'` = `[]`.
- [ ] Test de source : aucun fichier `.tsx` de `src/renderer` (hors ateliers) ne renvoie de mésusage.
- [ ] Le voir échouer, noter la liste réelle, passer chaque bouton en secondaire ou discret (`quiet`).
- [ ] Ajouter la règle à `DESIGN.md` : une action principale jaune par vue ; Fermer, Annuler, Retour, Actualiser jamais primaires.
- [ ] `npm run typecheck`, `npm test`. Commit : `fix(r2): Fermer, Annuler, Retour et Actualiser ne sont plus des actions principales`.

### Tâche 8 : recette, scripts et clôture

**Fichiers :** `scripts/check-ux-v2-lot01a-states.cjs:27`, `scripts/check-ux-v2-lot01b-abby-guard.cjs:19`, `scripts/check-ux-v2-lot01a-typography.cjs:46`, `PROJECT_STATUS.md`, `docs/refonte/DESIGN.md`.

- [ ] Règle H : remplacer les contrôles « 31 feuilles » par des contrôles durables (fichiers requis présents, `tokens.css` en premier, `display-density` avant `ui-typography-consistency` avant `ui-consistency-v2`) ; accepter dans `lot01a-typography` les chemins relatifs avec « / » sans `..`.
- [ ] `npm run typecheck`, `npm test`, puis les scripts natifs `check-ux-v2-lot01a-real-ui.cjs`, `check-ux-v2-lot01a-typography.cjs`, `check-ux-v2-lot01a-states.cjs`, `check-ux-v2-lot01b-abby-guard.cjs` (copie jetable, sans port de débogage). Rapporter les résultats tels quels, échecs compris.
- [ ] Captures avant / après des 17 destinations en Noir / Confort, relecture indépendante (sous-agent frais), mise à jour de `PROJECT_STATUS.md` et de `DESIGN.md` (règle de la tâche 7, `PageHeader`, budget de petits textes).
- [ ] Commit local de clôture. Push, PR et fusion : sur accord de Carlos (règle C).

## Révisions (règle I : écart mineur = une ligne ; changement de périmètre = accord de Carlos)

- **Périmètre, à valider par Carlos** : tâche 4, `PageHeader` remplace seulement l'en-tête générique d'`App.tsx` (14 écrans). Prospection, Clients et Offres gardent leur en-tête propre jusqu'à R3 et R8 ; les quatre règles `:has()` de masquage restent jusque-là.
- **Périmètre, à valider par Carlos** : tâche 6 (pastille d'état unique) non faite, en attente du tableau statut → couleur.
- Règle C : les commits par tâche sont remplacés par un seul commit local de fin de lot, après les captures vues par Carlos.
- Tâche 1 : 678 déclarations sous 14 px (base régénérée à la baisse), et non 648 : le premier relevé ignorait les déclarations sans point-virgule final.
- Tâche 2 : `headerMinWidth('Coordonnées')` = 139 et non 148 (11 lettres) ; taille d'en-tête unique `--ui-font-primary` (au lieu de `--aw-font-functional`) pour rester alignée sur les libellés triables ; minimums de colonne transmis à `adaptiveTableWidths` (ajout d'un quatrième paramètre facultatif) après la relecture indépendante (I2).
- Tâche 2 : deux règles d'écran remises à la taille de la densité (`crm/client-list-quick-v2.css` en-têtes et corps du tableau, `commercial/catalog-workspace-v2.css` en-têtes), car elles imposaient 13 px aux en-têtes.
- Tâche 5 : l'échéance est liée au texte du message (comme l'action), pas seulement à un drapeau.
- Tâche 7 : le détecteur accepte une classe conditionnelle contenant `secondary-button` ; 11 boutons corrigés ; règles `.secondary-button` ajoutées pour Clients (relecture, I1) ; `scripts/fixtures/prospection-gallery.cjs` adapté (I3), reste obsolète plus loin (`prospect-workspace-identity`, antérieur à R2).
- **Remarque de Carlos sur les captures (13/11/2026)** : texte blanc sur fond jaune des boutons principaux, mesuré à 1,37 pour 1 sur 14 écrans (cause : `.primary-button` garde `color: #fff` dans `styles.css:231` alors que chaque écran redéfinit `--accent-strong` en jaune en Noir). Corrigé à la racine par une règle de `ui/shared-controls.css` (texte `--aw-accent-on-solid`, sans `!important`), contraste mesuré ensuite à 11,96 au minimum, avec un contrôle mesuré ajouté à `scripts/check-ux-v2-lot01a-real-ui.cjs` (Noir seulement : 857 contrôles au lieu de 839).
- **Tâche 6 simplifiée sur instruction de Carlos** (pas de tableau à lui fournir : les couleurs sont déjà dans le code, supprimer l'excès) : inventaire réel = palette métier à 4 couleurs (température, relation client, relation d'annuaire), conservée ; les pastilles d'étape de prospect avaient 8 teintes locales pour 11 étapes, ramenées à six rôles de couleur par jeton (`prospection-commercial-v2.css`), 12 `!important` retirés (`ui-consistency-v2.css` : 98 à 86, plafond du test abaissé à 86). `StatusPill` n'est pas branché dans les autres listes (Devis, Clients, Annuaire, Projets) : ce sera fait dans leur lot (R3, R4, R5).

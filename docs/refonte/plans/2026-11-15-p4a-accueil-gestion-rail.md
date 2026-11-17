# P4a Accueil, Gestion et rail : plan d'exécution

> **Pour l'agent qui exécute** : sous-skill obligatoire `superpowers:executing-plans` (avec `superpowers:test-driven-development` et `superpowers:verification-before-completion`) ; skill `atoumweb-design` pour tout ce qui touche l'interface. Les cases `- [ ]` suivent l'avancement.

**But :** fermer F43, F23, F25, F28 et F33 de la passe de finitions (Accueil, listes de Gestion, rail), sans toucher aux données, aux règles métier ni au parcours.

**Approche :** deux défauts sont déjà localisés dans le code (F28 textes locaux, F25 ordre de la barre d'outils) et se corrigent test d'abord ; trois sont à **mesurer avant de corriger** (F43, F23, F33) parce que le registre n'en donne pas la cause. Une règle de décision est écrite pour chacun.

**Technologies :** React 18, TypeScript, vitest, CSS à jetons (`var(--…)`), Electron pour les recettes natives.

**Fiche :** `docs/refonte/plans/2026-11-15-p4-accueil-gestion-ressources-reglages-design.md` (validée le 15/11/2026, découpage en P4a puis P4b).

## Contraintes globales

- Thème Noir, densité Confort seuls. Plancher de 14 px : aucune déclaration `font-size` sous 14 px ajoutée ; budget des petits textes **617, il ne peut que baisser** (`ui/fontFloorBaseline.json`, outil `gen-font-baseline.cjs`, à la baisse seulement).
- `!important` d'`ui-consistency-v2.css` au plus **86** ; aucun `!important` ajouté ailleurs (garde `ui/importantBudget.test.ts`). Jetons uniquement, aucune couleur en dur.
- Une seule action principale jaune par vue. Aucune fonction retirée (seulement rangée).
- Aucune donnée, règle métier, parcours ni acompte modifiés. **Aucune écriture dans la préproduction** : états forcés uniquement dans la copie jetable de l'outil de capture.
- Écrire tests et scripts d'édition avec l'outil d'écriture (jamais dans un bloc shell). Contrôler les fins de ligne avec `C:\DEV\Livrables\Cadrage-parcours\outils-edition\eol-report.cjs` sur chaque fichier modifié ; ne pas convertir en masse.
- Un seul Electron à la fois, en tâche de fond, scripts natifs **sans option**.
- Relancer la **suite complète** avant de dire « vert » (`node scripts/run-tests.cjs` : 309 fichiers, 2 500 tests, 1 ignoré aujourd'hui).
- Un seul commit local pour le lot, **seulement après que Carlos a vu les captures** ; aucun push, aucune PR.
- Recettes rouges volontaires : `check-ux-v2-03e-directory` (F47, reportée). `check-shell-home-simplification` **doit passer au vert** (F43).

## Points de vigilance (Review Focus)

1. **Barre d'outils partagée** : `ListToolbar` sert aussi à Sauvegardes, Annuaire et Bibliothèque (Ressources, lot P4b) : la nouvelle disposition y est visible. Mesurer la hauteur de barre avant / après sur les huit écrans qui l'utilisent ; une barre sans filtres ne doit pas gagner une rangée vide.
2. **Barre sans filtres ou sans action principale** (Dépenses sans filtre actif, Annuaire) : pas de rangée vide, pas de décalage.
3. **Fenêtre étroite (760 px)** : la rangée 1 doit passer à la ligne proprement (le champ de recherche ne déborde pas, l'action principale reste atteignable).
4. **Liste compacte avec fiche ouverte** : le message vide dit « Aucun résultat pour ces filtres. » seulement si un filtre est réellement actif, sinon le texte de `gestionEmpty.ts`.
5. **Rail** : à toute hauteur de fenêtre (948 px et moins), le dernier élément du rail est entièrement atteignable au défilement ; groupe replié ou ouvert, rail réduit ou déployé.

## Carte des fichiers

| Fichier | Rôle dans le lot |
|---|---|
| `src/shared/gestionEmpty.ts` et `.test.ts` | `compactListEmptyText` (nouveau) |
| `src/renderer/expenses/ExpensesPage.tsx`, `billing/BillingPage.tsx`, `operations/OperationsPage.tsx` | messages vides des listes compactes |
| `src/renderer/ui/ListToolbar.tsx`, `list-page.css`, `listPage.test.tsx`, `gestionR7Screens.test.ts` | deux rangées (F25) |
| `src/renderer/home/HomeDashboard.css` ou `home-r6.css` | F43, F23 (selon mesure) |
| `src/renderer/ui/navigation-rail.css` ou `manager-shell.css` | F33 (selon mesure) |
| `src/renderer/ui/p4aWiring.test.ts` (nouveau) | gardes de source du lot |
| `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-p4a.cjs` (hors dépôt) | captures et mesures avant / après |
| `docs/refonte/FINITIONS.md`, `PROJECT_STATUS.md`, `PASSATION-2026-11-15-apres-P4a.md`, mémoire | clôture |

---

### Tâche 1 : outil de capture et mesures « avant » (sur le dernier commit, avant tout changement)

**Fichiers :** créer `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-p4a.cjs` (copie de `audit-p3b.cjs` : même mise en place de la copie jetable, `shot`, `navigate`, `probe`, vérification `SOURCE_UNCHANGED`) ; sorties dans `C:\DEV\Livrables\Cadrage-parcours\captures-p4a\avant\` (variable `AUDIT_OUT`, avec `AUDIT_ALLOW_UNVERIFIED=1`).

**Interfaces :** produit `journal-captures.json` dont les lignes `MESURE …` servent de référence aux tâches 3 à 6.

- [ ] **Étape 1 : écrire `audit-p4a.cjs`.** Garder l'initialisation (Noir, Confort, copie jetable), retirer la logique Projets, ajouter ces étapes, chacune capturée par `shot` et mesurée par `get(...)` :
  - **Accueil 1510 × 1030** : `MESURE accueil` = largeurs (`getBoundingClientRect().width`) de `.home-widget-today`, `.home-todo-card`, `.home-todo-list`, `.home-widget-watch`, `.content-area` ; l'Accueil est capturé **avec le réglage visuel retiré** (voir `outils-edition\make-accueil-defaut.cjs` : la base de test garde un réglage qui masque les valeurs par défaut) puis tel quel.
  - **Accueil étroit** : `win.setContentSize(760, 720)` et `win.webContents.setZoomFactor(1.5)` ; `MESURE accueil-etroit` = `scrollWidth` et `clientWidth` de `.content-area` et de `document.documentElement`, plus la liste des éléments dont `getBoundingClientRect().right` dépasse `clientWidth` de `.content-area` de plus de 0,5 px (sélecteur construit avec tag, classes, texte de 30 caractères, largeur et hauteur). Rétablir 1510 × 1030 et zoom 1 ensuite.
  - **Rail** : `win.setContentSize(1510, 948)` ; `MESURE rail` = pour `.aw-rail-scroll` : `clientHeight`, `scrollHeight`, `scrollTop` après défilement en bas ; `bottom` du dernier `.aw-rail-row` visible, `bottom` de `.aw-rail-scroll`, `bottom` de `.aw-navigation-rail`, `window.innerHeight`. Capturer le bas du rail défilé. Rétablir 1030.
  - **Barres d'outils** : pour Temps, Documents, Dépenses, Facturation, Interventions & Maintenance, Sauvegardes, Annuaire, Bibliothèque : `MESURE barre <écran>` = hauteur de `.aw-list-toolbar`, `top` de `.aw-list-toolbar-primary` moins `top` de `.aw-list-toolbar-count` (non nul = action sur une deuxième ligne), nombre de `select`. Capture de chaque écran.
  - **Messages vides compacts** : Dépenses et Facturation, ouvrir la première fiche, puis taper dans le champ de recherche une chaîne sans résultat (valeur posée par le setter natif de `HTMLInputElement.prototype`, puis événement `input`) ; capturer et consigner `MESURE vide-depenses` = texte de `.empty-table`.
- [ ] **Étape 2 : lancer l'outil en tâche de fond** (une seule instance d'Electron) : `$env:AUDIT_ALLOW_UNVERIFIED='1'; $env:AUDIT_OUT='C:/DEV/Livrables/Cadrage-parcours/captures-p4a/avant'; node C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-p4a.cjs`. Attendu : `SOURCE_UNCHANGED true`, `TEMP_CLEANED true`, `CONSOLE_ERRORS 0`.
- [ ] **Étape 3 : relire les captures et les lignes `MESURE`**, puis copier les chiffres utiles dans la section « Révisions » de ce plan (une ligne « mesures avant »). **Règles de décision :**
  - **F23** : si la largeur de `.home-todo-card` est égale (à 1 px près) à celle de `.content-area` moins sa marge, la liste occupe déjà toute la largeur : F23 est marquée « fait, déjà réglé » sans code (tâche 5 sautée). Sinon la tâche 5 corrige l'élément qui la limite.
  - **F43** : la tâche 4 corrige l'élément nommé par `MESURE accueil-etroit` ; s'il n'y a plus de débordement, F43 est marquée « déjà réglé » et la recette est relancée pour le confirmer.
  - **F33** : la tâche 6 corrige selon l'écart relevé (`bottom` du dernier élément comparé à `bottom` de `.aw-rail-scroll`).

---

### Tâche 2 : F28, messages vides des listes compactes (Dépenses, Facturation, Interventions)

**Fichiers :**
- Modifier : `src/shared/gestionEmpty.ts` ; test : `src/shared/gestionEmpty.test.ts`
- Modifier : `src/renderer/expenses/ExpensesPage.tsx` (ligne 440), `src/renderer/billing/BillingPage.tsx` (ligne 322), `src/renderer/operations/OperationsPage.tsx` (lignes 545 et 611)
- Test : `src/renderer/ui/p4aWiring.test.ts` (nouveau, même méthode de lecture du source que `ui/gestionR7Wiring.test.ts`)

**Interfaces :** produit `compactListEmptyText(emptyText: string, filtersActive: boolean): string` (exportée de `shared/gestionEmpty.ts`) : renvoie `'Aucun résultat pour ces filtres.'` si `filtersActive`, sinon `emptyText`.

- [ ] **Étape 1 : tests qui échouent.** Dans `gestionEmpty.test.ts`, un `describe('P4a : message vide d’une liste compacte')` avec : `compactListEmptyText(expensesEmptyText(), true)` vaut `'Aucun résultat pour ces filtres.'` ; `compactListEmptyText(expensesEmptyText(), false)` vaut `expensesEmptyText()` ; idem avec `billingEmptyText()`. Dans `p4aWiring.test.ts`, lire les trois pages et vérifier : aucune ne contient `'Aucune dépense dans cette vue.'`, `'Aucun élément de facturation.'`, `'Aucune demande dans cette vue.'`, `'Aucune intervention dans cette vue.'` ; `ExpensesPage.tsx` contient `compactListEmptyText(expensesEmptyText(),` ; `BillingPage.tsx` contient `compactListEmptyText(billingEmptyText(),` ; `OperationsPage.tsx` contient `compactListEmptyText(operationsEmptyText('requests'),` et `compactListEmptyText(operationsEmptyText('interventions'),`.
- [ ] **Étape 2 : voir les tests échouer** pour la bonne raison : `node scripts/run-tests.cjs src/shared/gestionEmpty.test.ts src/renderer/ui/p4aWiring.test.ts` (attendu : échec, fonction non définie et textes encore présents).
- [ ] **Étape 3 : implémenter `compactListEmptyText`** dans `gestionEmpty.ts` (une ligne de logique, texte filtré écrit une seule fois dans le fichier comme dans `documentsEmptyText`) ; **brancher les quatre emplacements** en passant, comme second argument, le **même booléen de filtres actifs que la page donne déjà à son tableau** (`hasActiveFilters([...])` dans Dépenses et Facturation ; dans `OperationsPage.tsx`, reprendre la valeur passée au tableau voisin, sinon calculer `hasActiveFilters` sur les états de filtre de la page). Importer `operationsEmptyText` si absent. Ne rien changer d'autre dans ces fichiers.
- [ ] **Étape 4 : tests ciblés au vert** (même commande) ; puis `npm run typecheck` propre.
- [ ] **Étape 5 : `eol-report.cjs`** sur les cinq fichiers modifiés ; `git diff --stat` limité à ces fichiers.

---

### Tâche 3 : F25, barre d'outils en deux rangées

**Fichiers :**
- Modifier : `src/renderer/ui/ListToolbar.tsx`, `src/renderer/ui/list-page.css`
- Tests : `src/renderer/ui/listPage.test.tsx`, `src/renderer/ui/gestionR7Screens.test.ts` (ligne 226 vue, à relire), `src/renderer/ui/p4aWiring.test.ts`

**Interfaces :** `ListToolbarProps` inchangée. Structure produite : `div.aw-list-toolbar` contient `div.aw-list-toolbar-main` (leading, compteur, Actualiser, recherche, **action principale**) puis, seulement s'il y a des filtres, `div.aw-list-toolbar-filters`. L'ordre du DOM devient : début, compteur, Actualiser, recherche, action principale, filtres (l'ordre visuel suit l'ordre du DOM, donc le clavier aussi).

- [ ] **Étape 1 : tests qui échouent.** Dans `listPage.test.tsx` : remplacer le test « l'ordre est : début, compteur, Actualiser, recherche, filtres, action principale » par l'ordre `['ONGLETS','11 demandes','Actualiser','Rechercher','+ Action','FILTRES']` (**révision de plan, règle I : l'ordre change avec la disposition validée, même périmètre**) ; ajouter « les filtres sont hors de la rangée principale » (le balisage de `aw-list-toolbar-filters` commence après la fin de `aw-list-toolbar-main`) ; ajouter « sans filtres, aucune rangée de filtres n'est rendue » (`aw-list-toolbar-filters` absent) ; ajouter « sans action principale, aucun conteneur `aw-list-toolbar-primary` ». Dans le bloc CSS du même fichier : la règle `.aw-list-toolbar-main` contient `flex-wrap: wrap` et `.aw-list-toolbar` ne contient plus la règle de recherche `.aw-list-toolbar > .inline-search` (remplacée par `.aw-list-toolbar-main > .inline-search`, largeur 270 px conservée) ; remplacer la lecture de `flex-wrap` du test « passe à la ligne » par `.aw-list-toolbar-main`.
- [ ] **Étape 2 : voir les tests échouer** : `node scripts/run-tests.cjs src/renderer/ui/listPage.test.tsx`.
- [ ] **Étape 3 : `ListToolbar.tsx`** : envelopper `leading`, compteur, Actualiser, recherche et `primary` dans `div.aw-list-toolbar-main` ; `filters` reste dans son propre `div.aw-list-toolbar-filters`, après. **`list-page.css`** : `.aw-list-toolbar` devient `display: flex; flex-direction: column; gap: 8px; min-width: 0` ; `.aw-list-toolbar-main` reprend l'ancien `display: flex; flex-wrap: wrap; align-items: center; gap: 8px var(--ui-gap); min-width: 0` ; `.aw-list-toolbar-primary { margin-left: auto }` est conservé ; la règle R8 `.aw-list-toolbar > .inline-search` devient `.aw-list-toolbar-main > .inline-search` (mêmes largeurs, commentaire de la feuille globale conservé) ; `.aw-list-toolbar .inline-search` et `.aw-list-toolbar select` restent descendants. Aucun `!important`, aucune valeur sous 14 px.
- [ ] **Étape 4 : tests au vert** : `listPage.test.tsx`, `gestionR7Screens.test.ts`, `ressourcesR8Wiring.test.ts`, `importantBudget.test.ts`, `fontFloor.test.ts` (ces deux derniers par la suite complète à l'étape 5).
- [ ] **Étape 5 : suite complète** `node scripts/run-tests.cjs` (attendu : 310 fichiers avec `p4aWiring.test.ts`, aucun test en échec) et `npm run typecheck`.
- [ ] **Étape 6 : recettes de Gestion** en tâche de fond, une à la fois : `node scripts/check-ux-v2-lot01a-real-ui.cjs --lot09b`, `--lot09c`, `--lot09e`, puis `node scripts/check-ux-v2-lot10-ui.cjs` (attendu : 85, 67, 70, 59 contrôles verts) et `node scripts/fixtures/project-operations-link.cjs` par son lanceur `check-project-operations-link` (17). Une recette qui échoue se **compare d'abord au dernier commit** (règle H) avant toute correction.
- [ ] **Étape 7 : `eol-report.cjs`** sur les fichiers modifiés.

---

### Tâche 4 : F43, Accueil en fenêtre étroite

**Fichiers :** modifier la feuille qui porte la règle de l'élément fautif nommé par `MESURE accueil-etroit` (attendu : `src/renderer/home/HomeDashboard.css` ou `home-r6.css`) ; test : `src/renderer/ui/p4aWiring.test.ts`.

- [ ] **Étape 1 : reproduire.** Relancer `node scripts/check-shell-home-simplification.cjs` (tâche de fond) sur le dernier commit : attendu rouge sur le seul contrôle de défilement horizontal en fenêtre étroite (824 verts). Noter le nom exact du contrôle.
- [ ] **Étape 2 : test qui échoue.** Dans `p4aWiring.test.ts`, une garde sur la règle CSS retenue (par exemple `min-width: 0` et `overflow-wrap: anywhere` ou `flex-wrap: wrap` sur le sélecteur identifié à l'étape 1 de la tâche 1), lue dans la feuille sans commentaires. La garde échoue avant correction.
- [ ] **Étape 3 : corriger** par la règle la plus locale (l'élément qui force 4 px de plus que son conteneur peut rétrécir ou passer à la ligne ; ne pas masquer le débordement par `overflow-x: hidden` sur la page). Aucun `!important`, aucun texte sous 14 px ajouté.
- [ ] **Étape 4 : preuves** : garde au verte ; `node scripts/check-shell-home-simplification.cjs` **vert** (825 contrôles) ; `node scripts/check-ux-v2-02d-home.cjs` toujours à 56 ; recapturer l'Accueil étroit avec l'outil et relire `MESURE accueil-etroit` (aucun élément dépassant, `scrollWidth` = `clientWidth`).

---

### Tâche 5 : F23, liste « À faire maintenant » (seulement si la mesure de la tâche 1 montre un défaut)

**Fichiers :** `src/renderer/home/home-r6.css` ou `HomeDashboard.css` ; test : `p4aWiring.test.ts`.

- [ ] **Étape 1 : décision.** Appliquer la règle de décision de la tâche 1. Si F23 est « déjà réglée », écrire la ligne dans « Révisions », ne rien coder, passer à la tâche 6.
- [ ] **Étape 2 (sinon) : test qui échoue** : la règle CSS qui donne toute la largeur au bloc (`.home-widget-today { grid-column: 1 / -1 }`) et celle de l'élément limitant identifié sont présentes dans la feuille lue sans commentaires.
- [ ] **Étape 3 : corriger** l'élément limitant (pas de largeur maximale ni de colonne fixe qui laisse du vide à droite) ; recapturer l'Accueil large avec et sans réglage visuel ; relire `MESURE accueil`.

---

### Tâche 6 : F33, rail coupé en bas

**Fichiers :** `src/renderer/ui/navigation-rail.css` ou `manager-shell.css` selon la mesure ; test : `p4aWiring.test.ts`.

- [ ] **Étape 1 : diagnostic** sur `MESURE rail` (948 px de haut). Trois causes possibles, une seule est la bonne ; le dire dans « Révisions » : (a) `.aw-rail-scroll` plus grand que l'espace visible (le rail dépasse `innerHeight`) : corriger la hauteur du rail (`min-height: 0` sur la chaîne parent, `height: 100%` de la grille `.app-shell`) ; (b) le contenu défilé s'arrête sous le bord (marge basse perdue) : ajouter un `padding-bottom` au conteneur défilant ; (c) le dernier groupe est masqué par le bas de la fenêtre : même correction que (a).
- [ ] **Étape 2 : test qui échoue** : garde de source sur la règle retenue, dans la feuille lue sans commentaires.
- [ ] **Étape 3 : corriger** ; recapturer le rail à 948 px de haut, défilé en bas ; **critère** : `bottom` du dernier `.aw-rail-row` ≤ `bottom` de `.aw-rail-scroll`, avec rail déployé, groupe « Gestion » replié et déplié, puis rail réduit. `node scripts/check-home-shell-lot1.cjs` (variable `ATOUMWEB_UX_LOT1_OUTPUT` sur un dossier neuf) toujours à 96 contrôles ; `check-ux-v2-02e-shell-journeys` relancé et comparé au dernier commit s'il échoue.

---

### Tâche 7 : recette sur captures et preuves du lot

- [ ] **Étape 1 : captures « après »** : vider `captures-p4a\apres\` avant de recapturer, puis relancer `audit-p4a.cjs` avec `AUDIT_OUT=…\captures-p4a\apres` ; vérifier `SOURCE_UNCHANGED true`, `TEMP_CLEANED true`, `CONSOLE_ERRORS 0`.
- [ ] **Étape 2 : mesurer les cadres** après les changements de défilement et de retour à la ligne (leçon de P3a) : largeur des cadres de liste et de l'Accueil égale à leur conteneur, aucun défilement horizontal parasite ; hauteur de barre d'outils avant / après sur les huit écrans qui utilisent `ListToolbar` ; action principale sur la première rangée sur Temps et Documents.
- [ ] **Étape 3 : relire chaque capture avant / après**, corriger ce qu'elles montrent (un défaut vu sur capture est corrigé dans le lot, avec un test d'abord si c'est du CSS ou une règle).
- [ ] **Étape 4 : preuves** (résultats rapportés tels quels, échecs compris) : `npm run typecheck` propre ; `node scripts/run-tests.cjs` (310 fichiers attendus, 0 échec) ; `check-ux-v2-lot01a-typography` 72, `…-states` 18/18, `…-abby-guard` 25, `…-real-ui` 857 ; `check-ux-v2-lot10-ui` 59 ; `--lot09b`, `--lot09c`, `--lot09e` ; recettes de P1 à P3b toujours vertes ; `check-shell-home-simplification` vert ; `check-ux-v2-03e-directory` rouge sur F47 seul ; budget des petits textes ≤ 617 et `!important` d'`ui-consistency-v2.css` ≤ 86 ; `eol-report.cjs` sur tous les fichiers modifiés ; empreinte de la préproduction identique.
- [ ] **Étape 5 : montrer à Carlos** `C:\DEV\Livrables\Cadrage-parcours\captures-p4a\` (`avant\`, `apres\`) avec les mesures, ce qui n'a pas été vu et le rappel que la revue finale est un autocontrôle. **Attendre sa recette.**

---

### Tâche 8 : clôture et commit local (seulement après la recette de Carlos)

- [ ] **Étape 1 :** `docs/refonte/FINITIONS.md` : F43, F23, F25, F28, F33 passent en « fait dans P4a » (ou « déjà réglé » avec la mesure) ; ajouter la ligne « P4a » au tableau d'avancement ; inscrire toute finition nouvelle trouvée.
- [ ] **Étape 2 :** `PROJECT_STATUS.md` : nouvelle entrée en tête (fiche, plan, corrections, mesures avant / après, écarts de règle I, preuves, non vu, autocontrôle) ; `docs/refonte/PASSATION-2026-11-15-apres-P4a.md` (état, prochaine action P4b, pièges appris) ; mémoire (`projet-refonte-passation-r2.md` et sa ligne de `MEMORY.md`).
- [ ] **Étape 3 :** `git status` ; un seul commit local `feat(p4a): …` terminé par la ligne d'attribution demandée ; aucun push.

---

## Révisions

- (règle I) Tâche 2 : `OperationsPage.tsx` porte deux messages locaux du même modèle que F28 (« Aucune demande / intervention dans cette vue ») ; ils sont alignés dans le même lot, même résultat.
- (règle I) Tâche 3 : l'ordre du DOM de `ListToolbar` change (action principale avant les filtres) ; le test d'ordre de R7 est mis à jour.
- **Mesures avant** (copie jetable, 1510 × 1030, Noir / Confort, journal `captures-p4a\avant-sortie.txt`) : « À faire maintenant » 580 px sur 1 175 (demi-largeur) ; barres d'outils : Temps 139 px (action 91 px sous le compteur), Documents 97 (43), Sauvegardes 99 (44), Annuaire 99 (44), Bibliothèque 97 (43), Dépenses, Facturation, Interventions 46 (une rangée) ; messages vides compacts « Aucune dépense dans cette vue. » et « Aucun élément de facturation. » même avec une recherche active ; rail à 948 px : dernier élément entièrement visible.
- **Diagnostics (tâche 1)** : F43 : la recette échoue sur `homeOverflow` (`.home-dashboard`, 497 px utiles, 365 px pour 363) ; l'élément est le bouton d'actualisation de `.home-heading-actions` (droite 475 pour une limite de 473), identique dans les trois thèmes ; la rangée ne passait pas à la ligne. F23 : réelle, `HomeDashboardV2.css:73` remet `today` et `watch` en `grid-column: auto`. **F33 : non reproduite** (cinq groupes ouverts, 1 030, 948, 800, 720 px et zoom 125 % : dernier élément et Statistiques entièrement visibles une fois le rail défilé en bas, marge de 14 px ; le registre décrivait l'état d'avant R9).
- **Ruling 1 (F23)** : « À faire maintenant » **et** « À surveiller » passent pleine largeur (la fiche validée disait « envisager la liste sur toute la largeur »). Pleine largeur pour le seul premier bloc aurait laissé « À surveiller » seul sur une demi-ligne, avec un vide à droite. Coût si faux : `watch` redevient demi-largeur en retirant une ligne de `home-r6.css`.
- **Ruling 2 (F25, écart au « deux rangées fixes » validé)** : une première version à deux rangées fixes (action et filtres séparés) a donné 46 à 99 px pour Dépenses, Facturation et Interventions, dont les filtres tenaient déjà sur une ligne (mesuré). Variante retenue, même but (l'action ne reste jamais seule sur une ligne) : grille `[zone qui passe à la ligne | action principale en haut à droite]` ; les filtres ne descendent que si la place manque ; l'ordre du DOM d'origine est conservé (le test d'ordre de R7 est donc rétabli tel quel). Mesures : Dépenses, Facturation, Interventions 46 px (inchangé), Documents 99 (action sur la première ligne), Sauvegardes 99, Annuaire 99, Bibliothèque 100, **Temps 141 px** (action en haut à droite, mais le quatrième filtre « Facturable + non facturable » passe seul sur une troisième ligne, parce que l'action réduit la zone des filtres d'environ 135 px). Coût si faux : revenir aux deux rangées fixes (Temps 96 px, mais Dépenses, Facturation, Interventions à 99 px) ; à trancher par Carlos sur les captures.
- **Ruling 3 (tâche 5)** : F23 corrigée dans `home-r6.css` (feuille chargée après la V2) plutôt que dans `HomeDashboardV2.css`, pour ne pas toucher le lot UX 1 validé.

## Auto-relecture du plan

- Couverture de la fiche : F43 (tâche 4), F23 (5), F25 (3), F28 (2), F33 (6), recette et clôture (7, 8). Rien d'autre que le périmètre de P4a.
- Cohérence des noms : `compactListEmptyText`, `aw-list-toolbar-main`, `p4aWiring.test.ts` utilisés à l'identique dans les tâches.
- Limite connue : trois tâches (4, 5, 6) dépendent d'une mesure ; leur correction exacte est décidée à la tâche 1 par des règles écrites, pas devinée ici.

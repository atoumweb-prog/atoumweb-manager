# P2 Nettoyage : plan d'exécution

> **Pour l'exécutant** : skills à citer à chaque étape : `atoumweb-design`, `superpowers:executing-plans`, `superpowers:test-driven-development` (tâches 2 à 4), `superpowers:verification-before-completion` (tâche 6). Les étapes utilisent des cases `- [ ]`.

**Objectif** : retirer 7 fichiers prouvés inutilisés, préciser le détecteur de boutons (M5), garder `page-header.css` sans `!important` (M6), retirer le CSS mort `.database-chip` et `.health-dot` (M7), sans changer un écran, une donnée ni une règle métier.

**Architecture** : trois petites améliorations de **garde** (tests d'abord), puis des retraits de code mort **prouvés par recherche avant chaque suppression**, puis la vérification complète. Le budget des petits textes est régénéré par l'outil existant, à la baisse seulement.

**Stack** : TypeScript/React (vitest), CSS, scripts Node/Electron de `scripts/`. Outils d'édition hors dépôt : `C:\DEV\Livrables\Cadrage-parcours\outils-edition\` (`css-prune.cjs`, `eol-report.cjs`) et `outils-audit\gen-font-baseline.cjs`.

**Fiche** : `docs/refonte/plans/2026-11-14-p2-nettoyage-design.md` (validée le 14/11/2026 : retirer les 7 fichiers, garder les ateliers, M4 laissé, M8 vers P3, bancs rouges au registre).

## Contraintes globales

- **Ne touche pas** : les écrans, les données, les règles métier, la préproduction (aucune écriture), les ateliers (`ui/*Workshop.tsx`, `tableWorkshop*`, `form-feedback-workshop.css`) ni leurs scripts, `App.tsx` (M4 laissé), `catalogSections.ts` (`buildCataloguePresentation` reste).
- **Aucun fichier n'est retiré sans une recherche qui montre zéro référence** dans `src`, `scripts`, `package.json`, `.github` et les tests, refaite juste avant la suppression. Les documents d'historique (`docs/…`) peuvent citer un nom : ils ne comptent pas comme usage.
- Un seul Electron à la fois (scripts natifs et `run-tests.cjs`), en tâche de fond ; scripts natifs de référence **sans option**.
- Écrire les tests et les scripts d'édition avec l'outil d'écriture, jamais en bloc shell ; fins de ligne contrôlées par `eol-report.cjs` (dépôt en `autocrlf`, ne pas convertir en masse).
- Budgets : petits textes **625 → 618 ou moins** (jamais plus), `!important` d'`ui-consistency-v2.css` ≤ 86.
- Pas de tirets longs, tutoiement, jamais le mot interdit. **Aucun commit avant l'accord de Carlos** ; pas de push.

## Review Focus

1. **Un retrait casse une référence dynamique** (chaîne d'import construite, entrée esbuild d'un script, test qui lit le fichier) : attendu, la recherche finale ne renvoie que des documents d'historique et le journal ; `typecheck`, tests et scripts natifs restent verts.
2. **Retrait de `.database-chip` d'une liste de sélecteurs** (`display-density.css`, `ui-typography-consistency.css`) qui laisse une virgule en fin de liste ou une règle vide : attendu, un test refuse sélecteur terminé par une virgule avant `{` et bloc `{}` vide dans les feuilles.
3. **Le fichier de budget remonte** par erreur : attendu, le total est inférieur à 625 et aucune ligne n'augmente (`git diff` de `fontFloorBaseline.json` en ne contenant que des baisses et des suppressions de lignes).
4. **M5 trop strict ou trop lâche** : attendu, un bouton `primary-button` dont la balise contient « secondary-button » dans un autre attribut (ex. `data-hint`) est signalé ; un bouton à classe conditionnelle `secondary-button`/`primary-button` reste accepté ; le scan du code de l'application (second `describe`) reste vert.
5. **Nombre de tests inexpliqué** : attendu, la baisse de 4 tests (`CatalogOverview.test.tsx`) et la hausse des nouveaux tests sont écrites dans le journal avec les chiffres réels.

---

### Tâche 1 : Baseline

**Fichiers** : aucun.

- [ ] **Étape 1** : `git status --short` vide (hors la fiche et ce plan non suivis) ; `git log --oneline -1` donne `ebb6c4e1`.
- [ ] **Étape 2** : noter l'empreinte SHA-256 de `…\Workspace\data\atoumweb-manager.sqlite` (attendue : `5da9e5fcf5115d9174c224b41b4a5f6aa037fc7d3cc463ca0b11a18c72d2c43d`) et le total du budget (`node` lisant `ui/fontFloorBaseline.json`, somme des valeurs : **625**).
- [ ] **Étape 3** : noter dans la section « Mesures » en bas du plan les chiffres de départ : 305 fichiers de tests, 2 471 tests, 1 ignoré.

### Tâche 2 : M6, garder `page-header.css` (test d'abord)

**Fichiers** : modifier `src/renderer/ui/importantBudget.test.ts` (ligne de `REFONTE_FILES`).

**Interfaces** : produit un garde supplémentaire : `page-header.css` sans `!important` ni couleur écrite en dur.

- [ ] **Étape 1** : ajouter `'page-header.css'` à `REFONTE_FILES`. Le test boucle déjà sur deux assertions par fichier (« has no !important », « has no hard-coded color »).
- [ ] **Étape 2** : lancer `node scripts/run-tests.cjs src/renderer/ui/importantBudget.test.ts`. Attendu : **passe** (le fichier est propre : une seule occurrence de « !important », dans un commentaire, que `css()` retire ; zéro couleur en dur).
- [ ] **Étape 3 (preuve que le garde mord)** : ajouter temporairement `.x{color:red !important}` en fin de `page-header.css`, relancer le même test, attendre **échec** sur « page-header.css has no !important », puis **retirer cette ligne** (contrôle : `git diff -- src/renderer/ui/page-header.css` vide).

### Tâche 3 : M5, détecteur de boutons précis (test d'abord)

**Fichiers** : modifier `src/renderer/ui/buttonHierarchy.test.ts` puis `src/renderer/ui/buttonHierarchy.ts` (fonction `findPrimaryMisuse`, ligne `if (/secondary-button/.test(tag)) continue;`).

**Interfaces** : `findPrimaryMisuse(source: string): string[]` garde sa signature.

- [ ] **Étape 1 (test, il doit échouer)** : dans `buttonHierarchy.test.ts`, ajouter `it('ne se laisse pas tromper par « secondary-button » dans un autre attribut', …)` avec :
  - `findPrimaryMisuse('<button className="primary-button" data-hint="secondary-button">Fermer</button>')` attendu `['Fermer']` ;
  - `findPrimaryMisuse('<button className="primary-button" title="secondary-button">Annuler</button>')` attendu `['Annuler']`.
- [ ] **Étape 2** : lancer `node scripts/run-tests.cjs src/renderer/ui/buttonHierarchy.test.ts`. Attendu : **échec** sur ce seul test (le détecteur actuel retourne `[]`).
- [ ] **Étape 3** : dans `buttonHierarchy.ts`, remplacer le test sur toute la balise par un test sur la **valeur de `className`** seulement : extraire `className=("[^"]*"|'[^']*'|\{[^}]*\})` de la balise (sans casser les classes conditionnelles `{open ? 'secondary-button' : 'primary-button'}`) et tester `/\bsecondary-button\b/` dans cette valeur. Le commentaire existant (bouton qui devient secondaire à l'état ouvert) est conservé.
- [ ] **Étape 4** : relancer le fichier de test. Attendu : **tous passent**, y compris les deux tests existants de classes conditionnelles et le second `describe` qui scanne le code de l'application (aucun faux positif nouveau).

### Tâche 4 : M7, CSS mort `.database-chip` et `.health-dot` (test d'abord)

**Fichiers** : créer `src/renderer/ui/deadSelectors.test.ts` ; modifier `src/renderer/styles.css` (lignes `.database-chip {…}` et `.health-dot {…}`), `src/renderer/display-density.css` (le sélecteur `.database-chip,` de la liste), `src/renderer/ui-typography-consistency.css` (le sélecteur `.database-chip` de la liste et sa règle).

- [ ] **Étape 1 (test, il doit échouer)** : `deadSelectors.test.ts` lit tous les `.css` de `src/renderer` (récursif) et vérifie : (a) aucun ne contient `.database-chip` ni `.health-dot` ; (b) aucune feuille n'a un sélecteur de liste terminé par une virgule juste avant `{` ni un bloc vide `{}` (garde contre l'effet de bord du retrait). Nom du test : `« les sélecteurs retirés ne reviennent pas et aucune règle n’est laissée vide »`.
- [ ] **Étape 2** : lancer le test. Attendu : **échec** sur (a), 4 emplacements.
- [ ] **Étape 3** : sauvegarder une copie `.bak` de chacun des trois fichiers hors dépôt, puis retirer les sélecteurs : `css-prune.cjs <fichier> "\.database-chip" "\.health-dot"` (l'outil retire sélecteurs de listes et règles vidées, et affiche chaque sélecteur retiré). Relire `git diff` des trois fichiers : seules ces règles disparaissent, aucune autre.
- [ ] **Étape 4** : relancer le test. Attendu : **passe**. Lancer `eol-report.cjs` sur les trois feuilles.

### Tâche 5 : retirer les 7 fichiers prouvés morts

**Fichiers** : supprimer par `git rm` (réversible par l'historique) :
`src/renderer/workflow/WorkflowDashboard.tsx`, `src/renderer/commercial/QuoteFinalizationPanel.tsx`, `src/renderer/commercial/CatalogOverview.tsx`, `src/renderer/commercial/CatalogOverview.test.tsx`, `src/renderer/operations/DashboardOperationsWatch.tsx`, `src/renderer/operations/DashboardOperationsWatch.css`, `src/renderer/project-tree-arrangement.css`. Modifier `src/renderer/ui/fontFloorBaseline.json` par l'outil `gen-font-baseline.cjs`.

**Interfaces** : aucune nouvelle. Les symboles `openEntity`, `buildCataloguePresentation`, `focusContractField`, `approvedBusinessReview` restent utilisés ailleurs (vérifié) ou par leur test.

- [ ] **Étape 1 (preuve)** : pour chacun des sept noms (sans extension), `git grep -F` dans `src`, `scripts`, `package.json`, `.github`, hors `docs/` : **les seules références admises** sont le test du composant retiré avec lui (`CatalogOverview.test.tsx`) et `fontFloorBaseline.json`. Coller la sortie dans la section « Mesures ».
- [ ] **Étape 2** : `git rm` des sept fichiers.
- [ ] **Étape 3** : `npm run typecheck`. Attendu : propre.
- [ ] **Étape 4** : `node C:\DEV\Livrables\Cadrage-parcours\outils-audit\gen-font-baseline.cjs`, puis lire `git diff -- src/renderer/ui/fontFloorBaseline.json` : **uniquement** des lignes en baisse ou supprimées (les deux fichiers CSS retirés, et `styles.css`, `display-density.css`, `ui-typography-consistency.css` si leur nombre baisse). Total attendu **inférieur ou égal à 618**.
- [ ] **Étape 5** : `node C:\DEV\Livrables\Cadrage-parcours\outils-audit\orphans.cjs` : la liste ne contient plus que `global.d.ts`, `ui/buttonHierarchy.ts`, `ui/fontFloor.ts` (aides de tests et types) et les quatre ateliers.

### Tâche 6 : vérification finale (verification-before-completion)

- [ ] **Étape 1** : `npm run typecheck` propre ; `node scripts/run-tests.cjs` : noter fichiers et tests réels (attendu : un fichier de moins ; 2 471 − 4 + les nouveaux tests de M5, M6 et M7) ; toute baisse inexpliquée = échec.
- [ ] **Étape 2** : un seul Electron à la fois, en tâche de fond, scripts natifs sans option : typographie **72**, états **18/18**, garde Abby **25**, interface réelle **857** sur 17 écrans ; `check-ux-v2-lot10-ui` **59** ; recettes de P1 vertes toujours vertes (`check-quote-journey-native`, `check-offres-tarifs-lot1`, `check-ux-v2-02d-home`, `check-prospection-flow-native`, `--prospection`, `check-prospection-tabs-native`).
- [ ] **Étape 3** : budgets : petits textes ≤ 618, `!important` ≤ 86 (le test existant) ; empreinte de la préproduction identique ; aucun résidu dans `outputs/` (fichiers `p2-*` et harnais) ; `eol-report.cjs` sur tous les fichiers modifiés.
- [ ] **Étape 4** : `git status` : seuls les fichiers prévus sont modifiés ou supprimés.

### Tâche 7 : documents, puis accord de Carlos, puis commit

**Fichiers** : `docs/refonte/FINITIONS.md`, `PROJECT_STATUS.md`, `docs/refonte/PASSATION-2026-11-14-apres-P2.md` (remplace le point d'entrée d'après P1), plan (section « Mesures »).

- [ ] **Étape 1** : `FINITIONS.md` : F10 « fait dans P2 » (avec la **correction du registre** : 6 fichiers de code mort + 1 test, pas 11 ; ateliers gardés, pas des orphelins), F11 : M5, M6, M7, M9 « fait dans P2 », M4 « laissé tel quel (décision de Carlos du 14/11/2026) », M8 « déplacé dans P3 », F29 « fermé (fichiers absents) » ; ajouter **F49, F50, F51** (bancs d'atelier `01b`, `01d`, `01f` rouges, causes non diagnostiquées) ; ligne d'avancement P2.
- [ ] **Étape 2** : `PROJECT_STATUS.md` : entrée P2 (chiffres réels, ce qui n'a pas été vu, revue finale = autocontrôle). Fichier de reprise : prochaine action P3.
- [ ] **Étape 3** : montrer à Carlos le résumé et **attendre son accord** ; un seul commit local `refactor(p2): code mort prouve retire, gardes M5 M6 M7`, terminé par la ligne d'attribution demandée. Pas de push.

## Mesures (à remplir à l'exécution)

Départ : 305 fichiers, 2 471 tests, 1 ignoré ; budget 625 ; empreinte `5da9e5fc…2c43d`.

## Couverture de la fiche

| Exigence | Tâche |
|---|---|
| Retirer les 7 fichiers après preuve | 5 |
| M5 précision du détecteur | 3 |
| M6 `page-header.css` dans la liste gardée | 2 |
| M7 CSS mort retiré | 4 |
| M9, F29 fermés ; M4 laissé ; M8 vers P3 ; F49 à F51 inscrits | 7 |
| Budget à la baisse, preuves, un commit après accord | 5, 6, 7 |

## Révisions

(aucune pour l'instant)

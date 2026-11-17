# P5a Offres & Tarifs : petits textes au plancher, plan d'exécution

> **Pour l'agent qui exécute** : sous-skill obligatoire `superpowers:executing-plans` (avec `superpowers:test-driven-development` et `superpowers:verification-before-completion`) ; skill `atoumweb-design` (typeset, layout, adapt). Les cases `- [ ]` suivent l'avancement.

**But :** plus aucun texte visible sous 14 px dans Offres & Tarifs (215 mesurés au premier écran le 15/11/2026), et zéro déclaration sous 14 px dans les fichiers du catalogue.

**Approche :** relever les règles au jeton `var(--aw-font-functional)` avec `outils-edition\css-raise-font.cjs` (qui retire aussi capitales et espacement des lettres), puis mesurer le rendu réel et les cadres, et n'adapter la mise en page que là où la mesure montre un défaut.

**Technologies :** CSS, vitest (`ui/fontFloor.test.ts`, garde de source), Electron (outils de capture hors dépôt).

**Fiche :** `docs/refonte/plans/2026-11-15-p5-petits-textes-design.md` (validée le 15/11/2026 ; Carlos a demandé l'exécution sans résumé du plan).

## Contraintes globales

- Thème Noir, densité Confort. Aucun `!important`, aucune couleur en dur, aucun texte sous 14 px ajoutés ; `!important` d'`ui-consistency-v2.css` au plus 86.
- Le budget `ui/fontFloorBaseline.json` ne fait que baisser (régénéré par `outils-audit\gen-font-baseline.cjs`, `git diff` relu : seules des baisses).
- Aucune écriture dans la préproduction ; captures dans la copie jetable (`SOURCE_UNCHANGED true`).
- Aucune donnée, règle métier ni parcours modifiés. Un seul commit local après la recette de Carlos.
- Tests et scripts écrits avec l'outil d'écriture ; `eol-report.cjs` sur chaque fichier modifié.

## Points de vigilance (Review Focus)

1. **Cartes de famille** : prix sur plusieurs lignes, « Repères tarifaires » ; une carte ne doit pas devenir plus haute que ses voisines au point de casser la grille, et rien ne doit déborder.
2. **Tableau d'administration** : codes canoniques (« AW-WEB-AVIS-GOOGLE ») et statuts dans des colonnes étroites : pas de coupure au milieu d'un code, pas de débordement de cellule.
3. **Barre de filtres** : libellés et « Filtres avancés » à 14 px ne doivent pas faire passer un filtre sur une ligne de plus sans raison (mesurer la hauteur avant / après).
4. **Fenêtre étroite** (507 px utiles) : aucun défilement horizontal de la page.
5. **Éditeur et brouillons** : onglets de l'éditeur et barre d'action ne passent pas sur deux lignes à 1510 px.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/renderer/commercial/catalog-workspace-v2.css` | 17 règles relevées |
| `src/renderer/commercial/catalog-editor-v2.css` | 12 règles relevées |
| `src/renderer/commercial.css` | les 14 règles du catalogue (`.catalog-*`, `.offer-*`) relevées ; les règles du devis restent pour P5c |
| `src/renderer/ui/p5aWiring.test.ts` (nouveau) | gardes |
| `src/renderer/ui/fontFloorBaseline.json` | budget à la baisse |
| `outils-audit\p5a-captures.txt` (hors dépôt) | captures et mesures |

---

### Tâche 1 : captures « avant » et mesures

- [ ] **Étape 1 :** outil `p5a-captures.txt` (prélude `p6b-force.txt`, `gen-audit-p6b.cjs`) : Offres « Vue organisée » (haut et bas), une famille (« Voir les prestations »), « Tableau d'administration », « Mes brouillons », « Filtres avancés » ouverts, la fiche d'un article du tableau (éditeur), à 1510 × 1030 puis 760 × 720 zoom 150 % ; à chaque vue : `MESURE` (défilement, débordements, textes coupés), nombre de textes visibles sous 14 px, hauteur de la barre de filtres et des cartes de famille.
- [ ] **Étape 2 :** lancer dans `captures-p5a\avant\` ; attendu `SOURCE_UNCHANGED true`, `CONSOLE_ERRORS 0`.

### Tâche 2 : relever les règles (test d'abord)

**Fichiers :** les trois CSS ci-dessus, `ui/p5aWiring.test.ts`, `ui/fontFloorBaseline.json`.

- [ ] **Étape 1 : test qui échoue** `p5aWiring.test.ts` : `countSmallFontDeclarations` vaut **0** pour `commercial/catalog-workspace-v2.css` et `commercial/catalog-editor-v2.css` ; dans `commercial.css`, aucune règle dont le sélecteur contient `.catalog-` ou `.offer-` ne déclare un `font-size` en px sous 14.
- [ ] **Étape 2 :** le lancer, le voir échouer (17, 12, et 14 règles trouvées).
- [ ] **Étape 3 :** `css-raise-font.cjs` sur chaque fichier avec la liste exacte des sélecteurs donnée par `small-fonts.cjs` (relu avant) ; `eol-report.cjs`.
- [ ] **Étape 4 :** test vert ; `gen-font-baseline.cjs` (attendu : 617 → 574, uniquement des baisses dans `git diff`) ; `fontFloor.test.ts` vert ; `npm run typecheck`.

### Tâche 3 : mesurer le rendu et adapter

- [ ] **Étape 1 :** relancer l'outil de la tâche 1 dans `captures-p5a\apres\` ; attendu : **0 texte visible sous 14 px** sur les vues d'Offres & Tarifs ; aucun débordement ni défilement horizontal.
- [ ] **Étape 2 :** pour chaque texte encore sous 14 px : trouver la règle qui gagne (sonde `p5a-sonde.txt`) et la relever (même méthode, test d'abord en complétant `p5aWiring.test.ts`).
- [ ] **Étape 3 :** pour chaque défaut de cadre mesuré (Review Focus 1 à 5) : garde de source dans `p5aWiring.test.ts` qui échoue, correction minimale (`min-width: 0`, `overflow-wrap`, largeur de colonne, `flex-wrap`), recapture. Un changement de disposition en profondeur n'est pas fait : il va au registre avec sa capture.

### Tâche 4 : preuves et recette

- [ ] **Étape 1 :** suite complète (`node scripts/run-tests.cjs`, attendu 314 fichiers passés, 0 échec) ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `check-offres-tarifs-lot1` 32 (recette du catalogue) ; `check-catalog*` existantes si elles touchent la vue ; budget 574 ou moins ; `!important` 86 ; empreinte de la préproduction identique.
- [ ] **Étape 2 :** montrer à Carlos les captures avant / après, dire ce qui n'a pas été vu et que la revue est un autocontrôle ; attendre sa recette.

### Tâche 5 : clôture et commit (après la recette)

- [ ] `FINITIONS.md` (ligne P5a de l'avancement, F9), `PROJECT_STATUS.md`, `PASSATION-2026-11-15-apres-P5a.md`, mémoire ; un seul commit local `feat(p5a): …` avec la ligne d'attribution ; aucun push.

## Révisions

- **15/11/2026, règle I** : `commercial.css` porte 18 règles du catalogue (14 `.catalog-*`, 4 `.offer-*`), pas 14 : budget attendu **570** (617 − 17 − 12 − 18), obtenu.
- **15/11/2026, tâche 3** : les 47 règles relevées suffisent, aucune autre règle n'a eu à être relevée (0 texte visible sous 14 px sur les 11 vues en grande fenêtre et les 8 vues en fenêtre étroite). Défaut **déjà présent avant le lot** trouvé par la mesure (Review Focus 4) : en fenêtre étroite, la fiche d'un article défilait de 5 px (croix de fermeture à +17 px) ; corrigé, test d'abord (`.catalog-detail-heading-actions` : `flex-wrap`, `min-width: 0`). Le rail ouvert par-dessus la page en fenêtre étroite reste F59 (décision de Carlos).

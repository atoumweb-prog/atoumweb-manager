# P2 Nettoyage : fiche courte (code mort prouvé, mineurs M4 à M9)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J). Aucun code modifié. Les constats ci-dessous ont été **revérifiés le 14/11/2026 sur le dernier commit** (`ebb6c4e1`), pas repris du registre (qui date de R2).
Skills : `atoumweb-design`, `superpowers:brainstorming`. Parent : `2026-11-14-passe-finitions-design.md` (décision 3 : retirer les orphelins **après preuve**, listés, réversibles par l'historique, règle F).

## Intention

Retirer ce qui est **prouvé inutilisé** (recherche de toutes les références, build, tests verts) et refermer les petits défauts de code laissés par R2, **sans changer un écran, une donnée, une règle métier ni un parcours**. Une fonction réelle n'est jamais retirée.

## Ce que la vérification a montré (écarts avec le registre)

**1. Orphelins F10 : le registre disait 11 fichiers, la preuve en donne 6 de code mort.**

| Fichier | Taille | Références trouvées (src, scripts, tests, docs) | Verdict |
|---|---|---|---|
| `workflow/WorkflowDashboard.tsx` | 9 lignes | **aucune** | mort. Son seul import, `openEntity` de `DossierPanel`, reste utilisé par 5 fichiers de Clients |
| `commercial/QuoteFinalizationPanel.tsx` | 20 lignes | seulement 4 documents d'historique (`docs/ux-v2/…`) | mort. Ses importations restent utilisées ailleurs |
| `commercial/CatalogOverview.tsx` + `CatalogOverview.test.tsx` | 132 lignes + 4 tests | seulement son propre test et un document | mort. **Le nombre de tests baisse de 4**, à justifier |
| `operations/DashboardOperationsWatch.tsx` + `.css` | 79 lignes + CSS (5 petits textes) | seulement le fichier de budget `fontFloorBaseline.json` | mort |
| `project-tree-arrangement.css` | CSS (2 petits textes) | seulement `fontFloorBaseline.json` | mort |

Effet : **7 fichiers retirés, budget des petits textes 625 → 618** (il ne peut que baisser, bon sens). Un effet de bord à connaître : `buildCataloguePresentation` (dans `catalogSections.ts`) n'est plus utilisée que par son propre test ; je la **laisse** (elle a ses tests, la retirer est une autre décision).

**2. Les « ateliers » ne sont pas du code mort.** `FoundationWorkshop`, `HeaderWorkshop`, `NavigationRailWorkshop`, `RecordWorkshop` (et `TableWorkshop`, `FormFeedbackWorkshop` qu'importe `FoundationWorkshop`) sont les bancs de recette hors ligne des lots UX de 2026-10, appelés par **7 scripts** `check-ux-v2-lot01b … 02b-workshop.cjs`, 6 lanceurs `.cmd`, et inscrits dans `scripts/convergence-state.json`. Je les ai lancés : **4 verts** (`01c`, `01e`, `02a`, `02b`), **3 rouges** (`01b` « CSS import chain changed », `01d` « Resize previews immediately with zero writes during move », `01f` sortie 1). Aussi : `global.d.ts` (déclarations de types), `ui/buttonHierarchy.ts` et `ui/fontFloor.ts` (aides des tests) **ne sont pas des orphelins**.

**3. Mineurs M4 à M9 et F29 : état réel.**

| N° | Constat actuel | Proposition |
|---|---|---|
| M4 | Le minuteur du message courant (`App.tsx`, effet sur `message`) est nettoyé à chaque changement ; seul cas résiduel : le **même texte réaffiché** garde l'ancien minuteur et peut se fermer trop tôt. Théorique | **laisser** (voir décision 3) ou ajouter une garde |
| M5 | `buttonHierarchy.ts` : le détecteur de boutons ignore tout bouton dont la balise **contient** `secondary-button` n'importe où (une valeur d'attribut suffit) | **préciser** : tester la classe en jeton. Tests d'abord dans `buttonHierarchy.test.ts` |
| M6 | `page-header.css` n'est pas dans `REFONTE_FILES` de `importantBudget.test.ts` ; il ne contient **aucun** `!important` dans le code (un seul dans un commentaire) | **l'ajouter** à la liste (test seulement) |
| M7 | CSS mort `.database-chip` (3 endroits : `styles.css`, `display-density.css`, `ui-typography-consistency.css`) et `.health-dot` (`styles.css`) ; plus aucun JSX ne les emploie (un test vérifie même leur absence) | **retirer** avec `css-prune.cjs` ; budget petits textes baisse encore d'au moins 1 |
| M8 | En-têtes de Prospection en 14 px gras 600 par des règles plus spécifiques | **déplacer dans P3** (c'est une finition d'écran de Prospection, pas du code mort) |
| M9 | `emptyText` **est maintenant passé** par 6 écrans (Facturation, Documents, Dépenses, Interventions, Annuaire…) | **fermer** (fait par R7 et R8) |
| F29 | Les fichiers `-wal` et `-shm` **n'existent plus** dans `Workspace\data` | **fermer** |

## Hors périmètre

- Les ateliers et leurs scripts (voir décision 2) ; les trois bancs rouges `01b`, `01d`, `01f` (nouvelles entrées F49 à F51 du registre, à traiter comme P1).
- M8 (vers P3), tout changement d'écran, la préproduction (aucune écriture), `buildCataloguePresentation`.
- Les deux recettes `check-ux-v2-02c` et `02e` (attente `.client-toolbar` périmée, notée dans le journal de P1).

## Approches envisagées

- **A (recommandée) : retirer les 7 fichiers prouvés morts, faire M5, M6, M7, fermer M9 et F29, garder les ateliers.** Petit, réversible par l'historique, prouvé par la recherche, le build, les tests et les quatre scripts natifs.
- **B : seulement lister, ne rien retirer.** Aucun risque, mais contredit ta décision 3 et laisse 7 fichiers et 7 petits textes de plus dans le budget.
- **C : retirer aussi les ateliers et leurs 7 scripts, 6 lanceurs, `tableWorkshop*`.** Plus propre en apparence, mais ce sont des bancs de la suite de convergence, trois sont déjà rouges et rien ne prouve qu'ils soient inutiles : décision de fond, pas un nettoyage.

## Décisions qui sont à toi

1. **Les 7 fichiers à retirer** (tableau 1) : OK, y compris `WorkflowDashboard.tsx` (ta décision 3) et le test de `CatalogOverview` ?
2. **Les ateliers** : **les garder** (recommandé) ou les retirer avec leurs scripts et lanceurs (approche C) ?
3. **M4** (minuteur du message réaffiché) : **laisser** parce que théorique (recommandé), ou ajouter une garde sur le message courant (petite modification de `App.tsx`, avec test) ?
4. **M8** déplacé dans P3 : OK ?
5. **Trois bancs d'atelier rouges** (`01b`, `01d`, `01f`) : les inscrire au registre (F49 à F51) et les traiter plus tard comme P1 (par exemple en P6), OK ?

## Preuves prévues si tu valides

Avant chaque retrait : `git grep` du nom dans `src`, `scripts`, tests et `package.json` (déjà fait, à refaire à l'exécution). Puis : tests d'abord pour M5 et M6 (on les voit échouer pour la bonne raison, puis passer), `npm run typecheck`, `node scripts/run-tests.cjs` (**305 fichiers, 2 471 tests aujourd'hui** : le total baisse de 4 tests et d'un fichier de test, et c'est le seul changement attendu), quatre scripts natifs (qui empaquettent l'interface avec esbuild et tiennent lieu de build : `package.json` n'a pas de script `build`) sans option (72, 18/18, 25, 857), `check-ux-v2-lot10-ui` (59), budget des petits textes à la baisse (**625 → 618 ou moins**) et `!important` ≤ 86, fins de ligne par `eol-report.cjs`, mise à jour de `FINITIONS.md` (F10, F11, F29 « fait dans P2 », F49 à F51 ajoutés), `PROJECT_STATUS.md`, fichier de reprise. Un seul commit local, après ton accord. **Pas de captures** : aucun écran ne change (le CSS retiré ne vise aucun élément existant).

## Ce que je n'ai pas pu voir

Que l'application empaquetée passe sans ces fichiers (aucun script `build` dans `package.json`, rien lancé pour cette fiche) ; les références hors du dépôt (autres projets) ; les trois bancs d'atelier rouges (cause non diagnostiquée).

## Révisions

**Décisions de Carlos du 14/11/2026 (fiche validée)** : 1. les 7 fichiers sont retirés (CatalogOverview et son test compris) ; 2. les ateliers sont gardés ; 3. M4 laissé tel quel ; 4. M8 déplacé dans P3 ; 5. bancs d'atelier rouges `01b`, `01d`, `01f` inscrits au registre (F49 à F51) pour un traitement ultérieur comme P1. Aucune révision de périmètre.

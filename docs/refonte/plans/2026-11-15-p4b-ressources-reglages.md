# P4b Ressources et Réglages : plan d'exécution

> **Pour l'agent qui exécute** : sous-skill obligatoire `superpowers:executing-plans` (avec `superpowers:test-driven-development` et `superpowers:verification-before-completion`) ; skill `atoumweb-design` pour tout ce qui touche l'interface. Les cases `- [ ]` suivent l'avancement.

**But :** fermer F35 (Statistiques), F38 (Sauvegardes) et F40 (Réglages) de la passe de finitions, sans toucher aux données, aux règles métier ni au parcours.

**Approche :** trois corrections indépendantes, test d'abord, chacune mesurée sur captures avant / après. F35 : une règle pure testable (`allNewComparisons`) et un indice de clic dans le composant partagé de chiffres clés. F38 : retrait de quatre sur-titres statiques. F40 : la grille de Réglages a déjà deux colonnes ; R9 force chaque panneau en pleine largeur, on libère seulement Apparence et Navigation, quand elles se suivent et que la place le permet (requête de conteneur).

**Technologies :** React 18, TypeScript, vitest, CSS à jetons, Electron pour les recettes natives.

**Fiche :** `docs/refonte/plans/2026-11-15-p4-accueil-gestion-ressources-reglages-design.md` (validée le 15/11/2026, points 3 et 4 de la fiche : F35 option A, F40 côte à côte et légende retirée). Plan de P4a : `…-p4a-accueil-gestion-rail.md` (commit `45259baf`).

## Contraintes globales

- Thème Noir, densité Confort seuls. Plancher de 14 px : aucune déclaration `font-size` sous 14 px ajoutée ; budget des petits textes **617, il ne peut que baisser**. `!important` d'`ui-consistency-v2.css` au plus **86** ; aucun `!important` ajouté. Jetons uniquement, aucune couleur en dur.
- Une seule action principale jaune par vue. Aucune fonction retirée. Aucune donnée, règle métier, parcours ni acompte modifiés. **Aucune écriture dans la préproduction** : états forcés uniquement dans la copie jetable de l'outil de capture.
- Écrire tests et scripts d'édition avec l'outil d'écriture (jamais dans un bloc shell). `eol-report.cjs` (`C:\DEV\Livrables\Cadrage-parcours\outils-edition\`) sur chaque fichier modifié ; ne pas convertir en masse.
- Un seul Electron à la fois, en tâche de fond, scripts natifs sans option. Relancer la **suite complète** avant de dire « vert » (aujourd'hui : 310 fichiers passés, 1 ignoré, 2 511 tests).
- Un seul commit local pour le lot, **seulement après la recette de Carlos sur captures** ; aucun push, aucune PR.
- Recette rouge volontaire : `check-ux-v2-03e-directory` (F47).

## Points de vigilance (Review Focus)

1. **Statistiques** : la ligne commune ne doit apparaître que si **toutes** les comparaisons du bloc sont « Nouveau » (au moins deux) ; une seule vraie comparaison (hausse, baisse, stable) la supprime et chaque carte garde sa ligne.
2. **Indice de clic** : seules les cartes cliquables le portent ; les cartes des autres écrans (Gestion, Ressources) restent des articles sans indice ni bouton.
3. **Réglages avec la recherche** : si la recherche ne laisse que l'une des deux sections (Apparence ou Navigation), elle reste pleine largeur, sans colonne vide.
4. **Réglages en fenêtre étroite** (moins de 1 000 px de contenu) : une colonne, rien ne dépasse.
5. **Légende retirée** : le groupe de champs de l'onglet « Mon entreprise » garde un nom accessible (légende masquée à l'écran, pas supprimée).

## Carte des fichiers

| Fichier | Rôle dans le lot |
|---|---|
| `src/renderer/statistics/statisticsComparison.ts` et `.test.ts` | `allNewComparisons`, `NO_PREVIOUS_PERIOD_NOTE` (nouveaux) |
| `src/renderer/statistics/StatisticsPage.tsx`, `StatisticsPage.css` | ligne commune sur la Vue d'ensemble, Commercial et Projets & temps |
| `src/renderer/ui/KeyFigures.tsx`, `list-page.css`, `listPage.test.tsx` | indice « Voir le détail › » des cartes cliquables |
| `src/renderer/backups/BusinessBackupsPage.tsx` | quatre sur-titres retirés |
| `src/renderer/settings/SettingsPage.tsx`, `settings-r9.css`, `commercial/CompanyQuoteSettings.tsx` | classe `settings-appearance`, deux colonnes, légende masquée |
| `src/renderer/ui/p4bWiring.test.ts` (nouveau) | gardes de source du lot |
| `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-p4b.cjs` (hors dépôt) | captures et mesures avant / après |
| `docs/refonte/FINITIONS.md`, `PROJECT_STATUS.md`, `PASSATION-2026-11-15-apres-P4b.md`, mémoire | clôture |

---

### Tâche 1 : outil de capture et mesures « avant » (sur le dernier commit, avant tout changement)

**Fichiers :** créer `C:\DEV\Livrables\Cadrage-parcours\outils-audit\p4b-middle.txt` (étapes) et générer `audit-p4b.cjs` par `node gen-audit-p4a.cjs p4b-middle.txt audit-p4b.cjs` (même mise en place de la copie jetable, `shot`, `navigate`, `clickText`, `SOURCE_UNCHANGED`) ; sorties dans `C:\DEV\Livrables\Cadrage-parcours\captures-p4b\avant\` (`AUDIT_OUT`, `AUDIT_ALLOW_UNVERIFIED=1`).

- [ ] **Étape 1 : écrire `p4b-middle.txt`.** Reprendre les assistants de `p4a-middle.txt` (`mesure`, `go`, `size`) et ajouter, chacun capturé par `shot` et consigné en ligne `MESURE …` :
  - **Statistiques** : ouvrir la page puis chaque onglet (« Vue d'ensemble », « Commercial », « Projets & temps », « Clients », « Analyse financière & rendement », via `clickText`) ; mesure = nombre d'occurrences du texte « Nouveau sur la période » dans `.content-area`, nombre de `.aw-keyfigure--action`, présence d'un texte « Voir le détail ».
  - **Sauvegardes** : mesure = textes de tous les `.eyebrow` de `.business-backups-page` (attendu avant : « Prévention opérationnelle », « Vigilance métier », « Nouvel enregistrement », « Historique »).
  - **Réglages** à 1510 × 1030 puis 1280 × 720 puis 1000 × 720 : mesure = `getBoundingClientRect()` (gauche, largeur, haut, hauteur) de l'article Apparence (celui qui contient `.theme-grid`) et de `.settings-navigation`, plus `scrollWidth` et `clientWidth` de `.content-area` ; capturer le haut de la page. Capturer aussi l'onglet « Mon entreprise » (légende « Informations de l'entreprise »). Rétablir 1510 × 1030 ensuite.
- [ ] **Étape 2 : lancer en tâche de fond** (`$env:AUDIT_ALLOW_UNVERIFIED='1'; $env:AUDIT_OUT='…/captures-p4b/avant'; node …\audit-p4b.cjs`). Attendu : `SOURCE_UNCHANGED true`, `TEMP_CLEANED true`, `CONSOLE_ERRORS 0`.
- [ ] **Étape 3 : relire captures et mesures**, noter dans « Révisions » une ligne « mesures avant ». **Règles de décision :** si F40 montre déjà deux colonnes ou un défaut différent (colonne trop étroite, thèmes coupés), l'écrire et adapter la tâche 4 (la requête de conteneur ne descend pas sous la largeur où les trois cartes de thème tiennent sans être coupées) ; si « Nouveau sur la période » n'apparaît pas au moins deux fois sur un onglet avec la base de test, F35 est démontrée par le test unitaire et par une capture d'un état forcé dans la copie jetable (jamais dans la préproduction).

---

### Tâche 2 : F35, Statistiques (une ligne commune et un indice de clic)

**Fichiers :**
- Modifier : `src/renderer/statistics/statisticsComparison.ts` ; test : `statisticsComparison.test.ts`
- Modifier : `src/renderer/statistics/StatisticsPage.tsx` (lignes 330 à 336, 369 à 372, 395 à 398), `StatisticsPage.css`
- Modifier : `src/renderer/ui/KeyFigures.tsx`, `src/renderer/ui/list-page.css` ; test : `src/renderer/ui/listPage.test.tsx`

**Interfaces :** produit `export const NO_PREVIOUS_PERIOD_NOTE = 'Pas de période précédente à comparer.'` et `allNewComparisons(items: ReadonlyArray<StatisticsComparison | undefined>): boolean` (vrai si au moins deux éléments définis et tous de direction `'new'`). `KeyFigureCard` ajoute, pour une carte avec `onAction`, un indice visible `<span class="aw-keyfigure-cue" aria-hidden="true">` dont le texte est « Voir le détail › » (carte fermée) ou « Masquer le détail › » (carte `expanded`).

- [ ] **Étape 1 : tests qui échouent.** Dans `statisticsComparison.test.ts` : `allNewComparisons([compare(5,0), compare(3,0)])` vaut `true` ; `allNewComparisons([compare(5,0), compare(10,5)])` vaut `false` ; `allNewComparisons([compare(5,0)])` vaut `false` (un seul élément) ; `allNewComparisons([compare(5,0), undefined, compare(3,0)])` vaut `true` (les éléments absents sont ignorés) ; `allNewComparisons([])` vaut `false` ; `NO_PREVIOUS_PERIOD_NOTE` vaut le texte ci-dessus, sans « (s) » ni tiret long. Dans `listPage.test.tsx` (bloc « R8 : carte de chiffre avec action ») : une carte avec action contient `aw-keyfigure-cue` et « Voir le détail » ; avec `expanded: true`, « Masquer le détail » ; une carte sans action ne contient pas `aw-keyfigure-cue` ; le CSS de `list-page.css` définit `.aw-keyfigure-cue` sans `!important` ni texte sous 14 px (le test « feuille list-page.css » existant le couvre).
- [ ] **Étape 2 : voir les tests échouer** : `node scripts/run-tests.cjs src/renderer/statistics/statisticsComparison.test.ts src/renderer/ui/listPage.test.tsx` (attendu : échecs `allNewComparisons is not a function` et absence de `aw-keyfigure-cue`).
- [ ] **Étape 3 : implémenter** `allNewComparisons` et `NO_PREVIOUS_PERIOD_NOTE` dans `statisticsComparison.ts` ; l'indice dans `KeyFigureCard` (pour la branche bouton seulement) et sa règle dans `list-page.css` (couleur `var(--accent-strong)`, `font-size: var(--aw-font-functional)`, `font-weight: 600`, bascule d'underline au survol et au focus de la carte). Dans `StatisticsPage.tsx`, pour **chaque bloc de `Kpi`** qui porte au moins deux `comparison` (Vue d'ensemble : 4 ; Commercial : `Contacts créés` et `Devis créés` ; Projets & temps : `Projets créés` et `Temps travaillé`) : calculer les comparaisons une fois, `const noPrevious = allNewComparisons([…])`, passer `comparison={noPrevious ? undefined : c}` aux `Kpi` concernés et afficher au-dessus des cartes un `<p className="statistics-comparison-note">{NO_PREVIOUS_PERIOD_NOTE}</p>` quand `noPrevious`. Style de la note dans `StatisticsPage.css` : `color: var(--muted)`, `font-size: var(--aw-font-functional)`, marge basse comme l'espacement des cartes. Ne rien changer aux textes « Stable vs période précédente », hausses et baisses.
- [ ] **Étape 4 : tests au vert** (même commande), puis `ressourcesR8Wiring.test.ts` et `statistics*` par la suite complète à la tâche 6. `npm run typecheck` propre.
- [ ] **Étape 5 : `eol-report.cjs`** sur les fichiers modifiés.

---

### Tâche 3 : F38, Sauvegardes (sur-titres retirés)

**Fichiers :** modifier `src/renderer/backups/BusinessBackupsPage.tsx` (lignes 355, 404, 440, 458) ; test : `src/renderer/ui/p4bWiring.test.ts` (nouveau, même méthode de lecture du source que `p4aWiring.test.ts`).

- [ ] **Étape 1 : test qui échoue.** `p4bWiring.test.ts` lit `backups/BusinessBackupsPage.tsx` et vérifie : elle ne contient plus `<span className="eyebrow">Prévention opérationnelle</span>`, `<span className="eyebrow">Vigilance métier</span>`, `<span className="eyebrow">Nouvel enregistrement</span>`, `<span className="eyebrow">Historique</span>` ; elle contient toujours les quatre titres `<h2>Avant / après intervention</h2>`, `<h2>Alertes des projets actifs</h2>`, `<h2>Sauvegarde métier</h2>`, `<h2>Sauvegardes</h2>`.
- [ ] **Étape 2 : voir le test échouer** : `node scripts/run-tests.cjs src/renderer/ui/p4bWiring.test.ts`.
- [ ] **Étape 3 : implémenter** : retirer les quatre `<span className="eyebrow">…</span>` en gardant le `<h2>` (et la `<div>` qui les enveloppait si elle n'a plus de raison d'être). Le sur-titre de la fiche d'une sauvegarde (type et date, ligne 472) est une donnée, pas un sur-titre fixe : le garder ; **à regarder sur la capture** et, s'il apparaît en capitales jaunes, le ranger en ligne de texte normale (`muted`) dans le même lot avec un test sur le source.
- [ ] **Étape 4 : test au vert**, `ressourcesR8Wiring.test.ts` toujours vert (il contrôle la note et les alertes de la page) ; `npm run typecheck` propre ; `eol-report.cjs`.

---

### Tâche 4 : F40, Réglages (Apparence et Navigation côte à côte, légende masquée)

**Fichiers :** modifier `src/renderer/settings/SettingsPage.tsx` (article d'Apparence, ligne 109), `src/renderer/settings/settings-r9.css`, `src/renderer/commercial/CompanyQuoteSettings.tsx` (ligne 26) ; test : `p4bWiring.test.ts`.

**Interfaces :** l'article d'Apparence reçoit la classe `settings-appearance` (en plus de `panel panel-large`).

- [ ] **Étape 1 : tests qui échouent** dans `p4bWiring.test.ts` : `SettingsPage.tsx` contient `settings-appearance` ; `settings-r9.css` (lue sans commentaires) contient `container-type: inline-size` pour `.settings-grid`, une requête `@container` dont le seuil est un nombre de pixels (valeur du seuil lue dans le test et comprise entre 900 et 1 200), et des règles `.settings-appearance:has(+ .settings-navigation)` (colonne 1) et `.settings-appearance + .settings-navigation` (colonne 2) ; `settings-r9.css` ne contient ni `!important` ni texte sous 14 px ; `CompanyQuoteSettings.tsx` ne contient plus `<legend>{tab==='company'` mais garde le texte `Informations de l’entreprise` (légende masquée, pas supprimée) et la feuille `settings-r9.css` définit la classe de masquage (`clip-path` ou `clip`, `width: 1px`).
- [ ] **Étape 2 : voir les tests échouer** (`node scripts/run-tests.cjs src/renderer/ui/p4bWiring.test.ts src/renderer/settings/settingsR9Wiring.test.ts`).
- [ ] **Étape 3 : implémenter.** `SettingsPage.tsx` : ajouter `settings-appearance` à l'article d'Apparence. `settings-r9.css` : `.settings-grid { container-type: inline-size; }` ; dans `@container (min-width: 1000px)` : `.settings-grid > .settings-appearance:has(+ .settings-navigation) { grid-column: 1; }` et `.settings-grid > .settings-appearance + .settings-navigation { grid-column: 2; }` (les colonnes `1.35fr / .65fr` existent déjà dans `styles.css`) ; classe de masquage visuel pour la légende de l'onglet « Mon entreprise » (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`). `CompanyQuoteSettings.tsx` : `className` de la légende appliqué seulement quand `tab==='company'`. La règle `.settings-grid > .panel { grid-column: 1 / -1; }` reste pour toutes les autres sections. Si la tâche 1 montre des cartes de thème coupées dans la colonne étroite, remonter le seuil de la requête (règle de décision de la tâche 1).
- [ ] **Étape 4 : tests au vert**, `npm run typecheck`, `eol-report.cjs`, `check-ux-v2-lot10-ui` (contient les contrôles de recherche et de débordement de Réglages) relancé à la tâche 6.

---

### Tâche 5 : barre d'outils de Temps (décision de Carlos attendue, aucun code avant sa réponse)

La barre de Temps mesure 141 px à 1 510 px (action en haut à droite mais le quatrième filtre passe seul sur une troisième ligne). Trois options à présenter à Carlos avec les captures de P4a : **A** laisser tel quel ; **B** revenir aux deux rangées fixes pour tous les écrans (Temps 96 px, mais Dépenses, Facturation, Interventions à 99 px) ; **C** ranger le filtre de catégorie « Facturable + non facturable » avec les trois autres sur une seule ligne en réduisant la largeur des listes de Temps (CSS de `time.css`). Si Carlos choisit B ou C : tests d'abord sur `list-page.css` ou `time.css`, recapture de Temps, Documents, Dépenses, Facturation, Interventions, Sauvegardes, Annuaire, Bibliothèque, et ligne dans « Révisions ».

- [ ] **Étape 1 :** poser la question à Carlos avec l'outil de question, avec les deux captures de P4a (`captures-p4a\apres\006-barre-temps.png`) ; consigner sa réponse dans « Révisions ».
- [ ] **Étape 2 :** appliquer sa réponse (rien si A), tests d'abord.

---

### Tâche 6 : recette sur captures et preuves du lot

- [ ] **Étape 1 : captures « après »** : vider `captures-p4b\apres\` avant de recapturer, relancer `audit-p4b.cjs` avec `AUDIT_OUT=…\captures-p4b\apres` ; `SOURCE_UNCHANGED true`, `TEMP_CLEANED true`, `CONSOLE_ERRORS 0`.
- [ ] **Étape 2 : mesurer** (leçon de P3a) : largeurs des deux articles de Réglages à 1510, 1280 et 1000 px (colonnes côte à côte à partir du seuil, une colonne dessous, aucun défilement horizontal) ; `Nouveau sur la période` dans chaque onglet de Statistiques (une ligne commune ou comparaisons conservées) ; liste des `.eyebrow` de Sauvegardes ; indice « Voir le détail » présent sur les cartes cliquables seulement.
- [ ] **Étape 3 : relire chaque capture avant / après**, corriger ce qu'elles montrent (test d'abord si c'est du CSS ou une règle).
- [ ] **Étape 4 : preuves** (résultats rapportés tels quels, échecs compris) : `npm run typecheck` propre ; `node scripts/run-tests.cjs` (311 fichiers passés attendus avec `p4bWiring.test.ts`, 1 ignoré, 0 échec) ; natifs `check-ux-v2-lot01a-typography` 72, `…-states` 18/18, `…-abby-guard` 25, `…-real-ui` 857 ; `check-ux-v2-lot10-ui` 59 ; recettes de P1 à P4a toujours vertes (`check-shell-home-simplification` 836, `--lot09b` 85, `--lot09c` 67, `--lot09d` 73, `--lot09e` 70, `check-project-operations-link` 17, `check-ux-v2-02d-home` 56, `check-home-shell-lot1` 96 avec un dossier de sortie **inexistant**) ; les recettes d'Offres et de Statistiques de R8 (`check-offres-tarifs-lot2-final` 24, `check-offres-tarifs-lot2-legacy` 19) ; `check-ux-v2-03e-directory` rouge sur F47 seul ; budget des petits textes ≤ 617 et `!important` ≤ 86 ; `eol-report.cjs` sur tous les fichiers modifiés ; empreinte de la préproduction identique.
- [ ] **Étape 5 : montrer à Carlos** `C:\DEV\Livrables\Cadrage-parcours\captures-p4b\` (`avant\`, `apres\`) avec les mesures, ce qui n'a pas été vu et le rappel que la revue finale est un autocontrôle ; envoyer les captures clés avec l'outil d'envoi de fichiers. **Attendre sa recette.**

---

### Tâche 7 : clôture et commit local (seulement après la recette de Carlos)

- [ ] **Étape 1 :** `docs/refonte/FINITIONS.md` : F35, F38, F40 « fait dans P4b » ; ligne P4b du tableau d'avancement ; toute finition nouvelle.
- [ ] **Étape 2 :** `PROJECT_STATUS.md` (entrée en tête), `docs/refonte/PASSATION-2026-11-15-apres-P4b.md` (état, prochaine action P6, pièges appris), mémoire (`projet-refonte-passation-r2.md` et sa ligne de `MEMORY.md`).
- [ ] **Étape 3 :** `git status` ; un seul commit local `feat(p4b): …` terminé par la ligne d'attribution demandée ; aucun push.

---

## Révisions

- **Mesures avant** (copie jetable, 1510 × 1030, Noir / Confort, `captures-p4b\avant-sortie.txt`) : « Nouveau sur la période » 4 (Vue d'ensemble), 2 (Commercial), 2 (Projets & temps), 1 (Clients) ; 3 sur-titres en capitales dans Sauvegardes, page 1 545 px ; Réglages pleine largeur à 1 510 / 1 280 / 1 000 px (Apparence 1 185 / 955 / 699 px de large) ; barre de Temps 141 px, listes de 244, 443, 204 et 241 px.
- **Décision sur la barre de Temps (tâche 5)** : Carlos a choisi l'option **C** (le 15/11/2026). Réalisée dans `time.css` : listes de 200, 200, 215 et 250 px.
- **Ruling 1 (tâche 2)** : quatre blocs de chiffres (et non trois) utilisent `KpiGroup`, l'onglet Clients compris ; avec une seule comparaison il n'affiche pas de ligne commune. Coût si faux : aucun, la règle exige au moins deux comparaisons.
- **Ruling 2 (tâche 2)** : la règle de l'indice est écrite `.aw-keyfigure > .aw-keyfigure-cue` (les captures ont montré qu'un simple `.aw-keyfigure-cue` perdait contre `.aw-keyfigure > span`, le texte de l'indice s'affichait en 22 px).
- **Ruling 3 (tâche 5)** : les deux dernières listes de Temps (catégorie et facturable) ont une largeur propre (215 et 250 px, `:nth-child`) parce qu'à 190 px leur texte était coupé (capture). À 1 280 px le dernier filtre repasse à la ligne (141 px, comme avant). Coût si faux : retirer les deux règles `:nth-child`.
- **Ruling 4 (tâche 4)** : seuil de la requête de conteneur de Réglages à 1 100 px (fiche : « environ 1 100 px de contenu »).
- **Mesures après** : voir `captures-p4b\apres-sortie.txt` ; Statistiques une ligne commune sur trois onglets ; Sauvegardes 0 sur-titre, page 1 482 px ; Réglages 1 510 px : Apparence 789 px et Navigation 380 px côte à côte, une colonne à 1 280 et 1 000 px ; Temps 88 px à 1 510 px.

## Auto-relecture du plan

- Couverture de la fiche : F35 (tâche 2, option A : ligne commune et indice), F38 (3), F40 (4, légende comprise), recette (6), clôture (7) ; la barre de Temps, reportée de P4a, est la tâche 5.
- Cohérence des noms : `allNewComparisons`, `NO_PREVIOUS_PERIOD_NOTE`, `aw-keyfigure-cue`, `settings-appearance`, `p4bWiring.test.ts`.
- Limites : le contenu exact de `StatisticsPage.tsx` autour des lignes 330 à 398 est lu à l'exécution ; la valeur du seuil de la requête de conteneur de Réglages est fixée par la mesure de la tâche 1 (entre 900 et 1 200 px).

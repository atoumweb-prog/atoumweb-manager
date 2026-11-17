# P6a Filet de sécurité : plan d'exécution

> **Pour l'agent qui exécute** : sous-skill obligatoire `superpowers:executing-plans` (avec `superpowers:test-driven-development`, `superpowers:systematic-debugging` et `superpowers:verification-before-completion`) ; skill `atoumweb-design` pour ce qui touche l'interface. Les cases `- [ ]` suivent l'avancement.

**But :** remettre au vert les recettes rouges de la passe (F47 à F51) et corriger le seul défaut du produit qu'elles ont révélé : le redimensionnement de colonne à la souris, annulé au premier mouvement.

**Approche :** un correctif de 3 lignes dans `DataTable.tsx` (largeur enregistrée, sans l'aperçu, donnée à `ColumnSizer`) prouvé par deux bancs natifs déjà rouges ; trois recettes remises en état (F49 règle durable, F48 deux contrôles rendus réels, F47 parcours réécrit sur les comportements encore vivants). Un seul écran change (le geste de redimensionnement) : captures avant / après de ce geste.

**Technologies :** React 18, TypeScript, vitest, Electron pour les bancs et recettes natifs.

**Fiche :** `docs/refonte/plans/2026-11-15-p6-etats-rares-design.md` (validée le 15/11/2026 : P6a puis P6b ; F47 option A ; F48 option A).

## Contraintes globales

- Thème Noir, densité Confort seuls. Budget des petits textes **617, il ne peut que baisser** ; `!important` d'`ui-consistency-v2.css` au plus **86** ; aucun `!important`, aucune couleur en dur, aucun texte sous 14 px ajoutés.
- Aucune donnée, règle métier, parcours ni acompte modifiés. **Aucune écriture dans la préproduction** (copies jetables seulement).
- Tests et scripts d'édition écrits avec l'outil d'écriture (jamais dans un bloc shell) ; `eol-report.cjs` (`C:\DEV\Livrables\Cadrage-parcours\outils-edition\`) sur chaque fichier modifié ; ne pas convertir les fins de ligne en masse.
- Un seul Electron à la fois, en tâche de fond, scripts natifs de référence sans option ; **relancer la suite complète** avant de dire « vert » (aujourd'hui : 311 fichiers passés, 1 ignoré, 2 532 tests).
- **Une recette qui échoue se compare d'abord au dernier commit** (règle H) ; une attente périmée en cache souvent une autre : rendre **temporairement** un contrôle non bloquant dans une copie de travail (dossier `outputs/`, ignoré par git) pour voir la suite, jamais le laisser.
- Un seul commit local pour le lot, **après la recette de Carlos**, aucun push, aucune PR. Aucun mot interdit par Carlos dans les textes rédigés.

## Points de vigilance (Review Focus)

1. **Redimensionnement** : l'aperçu suit la souris sans rien écrire ; **une seule** écriture à la fin du geste, même avec deux `pointerup` ; `pointercancel` et perte de focus (`blur`) annulent sans écrire ; la largeur ne descend pas sous le plancher d'en-tête (`headerMinWidth`) ni ne dépasse 600 px.
2. **Clavier** : flèches, `Home` et `End` sur la poignée continuent d'écrire une largeur (non touché).
3. **Tableaux avec largeur enregistrée** : le geste part de la largeur affichée (celle enregistrée), pas de la largeur par défaut.
4. **Recettes réécrites** : un contrôle réécrit doit **échouer** quand le comportement qu'il protège est retiré (preuve par mutation temporaire, annulée ensuite), sinon il ne protège rien.
5. **Règle durable de F49** : elle doit refuser la disparition d'une feuille de base ou une inversion d'ordre des couches, pas seulement un nombre.

## Carte des fichiers

| Fichier | Rôle dans le lot |
|---|---|
| `src/renderer/ui/DataTable.tsx` | correctif du geste (F50, F51) |
| `src/renderer/ui/p6aWiring.test.ts` (nouveau) | garde de source du correctif et de la règle durable |
| `scripts/check-ux-v2-lot01b-workshop.cjs` | F49 |
| `scripts/check-contract-library-ui.cjs` | F48 |
| `scripts/fixtures/integration-02-03-scenarios.cjs` | F47 |
| `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-p6a.cjs` (hors dépôt) | captures et mesures du geste, avant / après |
| `docs/refonte/FINITIONS.md`, `PROJECT_STATUS.md`, `PASSATION-2026-11-15-apres-P6a.md`, mémoire | clôture |

---

### Tâche 1 : F50 et F51, le redimensionnement de colonne (défaut du produit)

**Fichiers :** modifier `src/renderer/ui/DataTable.tsx` (lignes 49 à 55 et 60) ; test : `src/renderer/ui/p6aWiring.test.ts` ; bancs : `scripts/check-ux-v2-lot01d-workshop.cjs`, `scripts/check-ux-v2-lot01f-workshop.cjs`.

**Interfaces :** `widthOf(id: string, withPreview = true): number` dans `DataTable` ; `ColumnSizer` reçoit `widthOf(column.id, false)`.

- [ ] **Étape 1 : test qui échoue.** `p6aWiring.test.ts` lit `DataTable.tsx` et vérifie : `const widthOf = (id: string, withPreview = true) =>` ; `withPreview && preview?.id === id` ; le composant `<ColumnSizer` reçoit `width={widthOf(column.id, false)}` ; `<col` et la largeur totale du tableau gardent `widthOf(column.id)` (l'aperçu continue de bouger la colonne). Les deux bancs natifs, déjà rouges sur le dernier commit (01d : « Resize previews immediately with zero writes during move » ; 01f : « One confirmed SQLite preference write at gesture end »), sont le test de comportement.
- [ ] **Étape 2 : voir les tests échouer** : `node scripts/run-tests.cjs src/renderer/ui/p6aWiring.test.ts` (attendu : échec sur la signature de `widthOf`) ; `node scripts/check-ux-v2-lot01d-workshop.cjs` et `…01f…` (attendu : les deux messages ci-dessus).
- [ ] **Étape 3 : implémenter** les trois changements : paramètre `withPreview = true` de `widthOf`, `wanted` ne lit l'aperçu que si `withPreview`, `ColumnSizer` appelé avec `widthOf(column.id, false)`. Ne rien changer d'autre dans `DataTable.tsx`.
- [ ] **Étape 4 : tests au vert** : `p6aWiring.test.ts`, bancs 01d (attendu : 127 contrôles, 0 échec) et 01f (attendu : phase initiale 123, redémarrage 14, 0 échec). Si un autre contrôle des bancs échoue, le traiter avec `superpowers:systematic-debugging` et le consigner dans « Révisions ».
- [ ] **Étape 5 : `npm run typecheck`**, `eol-report.cjs` sur `DataTable.tsx` et le test.

---

### Tâche 2 : F49, règle durable à la place de « 31 feuilles »

**Fichiers :** modifier `scripts/check-ux-v2-lot01b-workshop.cjs` (ligne 20) ; test : `src/renderer/ui/p6aWiring.test.ts`.

**Interfaces :** la règle lit `src/renderer/main.tsx` et vérifie : `tokens.css` est la première feuille importée et `styles.css` la deuxième ; `ui-typography-consistency.css` est importée avant `ui-consistency-v2.css` ; toutes les feuilles listées existent ; au moins 31 feuilles (le plancher du jour de l'écriture du banc, qui ne peut que monter).

- [ ] **Étape 1 : test qui échoue.** `p6aWiring.test.ts` lit le script du banc et vérifie qu'il ne contient plus `files.length===31`, qu'il contient `files.length>=31`, les noms `tokens.css`, `styles.css`, `ui-typography-consistency.css` et `ui-consistency-v2.css`, et que `main.tsx` respecte cet ordre (`indexOf` croissant des quatre imports).
- [ ] **Étape 2 : voir le test échouer** (`run-tests.cjs`) et le banc rouge (`node scripts/check-ux-v2-lot01b-workshop.cjs` : « CSS import chain changed »).
- [ ] **Étape 3 : implémenter** la règle dans le banc (messages d'échec qui disent quelle règle est cassée).
- [ ] **Étape 4 : lancer le banc.** Attendu : vert. **S'il échoue sur un autre contrôle**, c'est une attente périmée cachée derrière la première (leçon de P1) : rendre temporairement non bloquant, relever chaque cause dans « Révisions », corriger sur des règles durables, restaurer strict. `convergence-state.json` : ne pas retirer l'entrée du banc.
- [ ] **Étape 5 : preuve par mutation** : inverser temporairement deux imports dans une copie de `main.tsx` n'est pas permis (fichier du produit) ; à la place, vérifier la règle sur une chaîne synthétique dans le test (fonction pure exportée du banc ou copie de la logique dans le test) qui échoue quand l'ordre est inversé. `eol-report.cjs`.

---

### Tâche 3 : F48, deux contrôles rendus réels dans `check-contract-library-ui`

**Fichiers :** modifier `scripts/check-contract-library-ui.cjs` (lignes 254 et 258).

- [ ] **Étape 1 : sonde jetable.** Copier le script dans `outputs/`, remplacer les deux `console.log('[contract] … à réparer')` par un affichage de l'état réel : pour la zone de lecture, la chaîne des ancêtres (`tagName`, `hidden`, `display`, `open` des `details`) et pourquoi `getClientRects().length` est nul ; pour l'aperçu client paginé, ce que l'aperçu expose (canvas, couche de texte pdf.js, ou HTML) après « Afficher l'aperçu paginé ». Lancer la sonde (`node outputs/…`), noter les deux constats dans « Révisions ».
- [ ] **Étape 2 : règle de décision.** Zone de lecture : ouvrir **tous** les ancêtres masquants identifiés (pas seulement les `details`), puis vérifier le défilement réel. Aperçu client : si l'aperçu expose le texte (couche de texte), vérifier que le texte du contrat y figure ; sinon vérifier par l'API de présentation PDF déjà utilisée par le contrôle voisin (« PDF common presentation ») que le texte du contrat est dans la présentation, et que l'aperçu affiche bien N pages. Aucun `console.log` « à réparer » ne doit rester.
- [ ] **Étape 3 : implémenter** puis lancer `node scripts/check-contract-library-ui.cjs --output <dossier neuf>` (attendu : au moins 139 contrôles, 0 échec, **aucune ligne « non vérifié »**).
- [ ] **Étape 4 : preuve par mutation** pour chacun des deux contrôles : retirer temporairement (dans la copie de travail) le texte « Texte adapté … » attendu ou le défilement et voir le contrôle échouer ; restaurer et vérifier `git diff`.

---

### Tâche 4 : F47, parcours Prospect → Devis → Projet (`check-ux-v2-03e-directory`)

**Fichiers :** modifier `scripts/fixtures/integration-02-03-scenarios.cjs` (148 lignes, 32 contrôles).

- [ ] **Étape 1 : inventaire.** Pour chaque contrôle du script (C02, C05, C07, C08, …), noter dans « Révisions » : (a) ce qu'il protège, (b) si ce comportement existe encore dans la fiche de R3 (Besoins, Prochaine étape, enregistrement), (c) vivant ou disparu. Les comportements à garder en priorité (fiche, option A) : le focus se pose sur la fiche après la recherche (C08, F44 corrigé en P3a) ; « Rester » est le choix par défaut quand une saisie est modifiée (C07) ; un enregistrement en attente bloque la navigation sans démonter la fiche (C07) ; un enregistrement refusé garde le brouillon (C07) ; la création d'un devis ne change pas l'étape du prospect (C05).
- [ ] **Étape 2 : sonde.** Copier le script dans `outputs/`, remplacer le premier contrôle fautif par un affichage et relever, avec la fiche ouverte, les sélecteurs réels : bouton de passage à la qualification (R3 : onglets, « Prochaine étape »), zone de saisie du brief, bouton d'enregistrement, éléments de confirmation. Écrire la table « ancien sélecteur → nouveau » dans « Révisions ».
- [ ] **Étape 3 : réécrire** le parcours contrôle par contrôle (garder les noms de contrôle C02, C05, C07, C08 pour que les recettes citent les mêmes repères), sélecteurs durables (`data-` ou rôles ARIA quand ils existent, jamais une classe de mise en page), abandonner explicitement chaque contrôle disparu avec une ligne « retiré : visait … » dans « Révisions ».
- [ ] **Étape 4 : lancer** `node scripts/check-ux-v2-03e-directory.cjs` (attendu : vert, nombre de contrôles consigné). **Preuve par mutation** pour chacun des trois contrôles C07 : retirer temporairement le comportement (par exemple forcer « Quitter » par défaut dans la copie de travail) et voir le contrôle échouer ; restaurer, `git diff` vide.
- [ ] **Étape 5 : `eol-report.cjs`** sur le script.

---

### Tâche 5 : recette sur captures et preuves du lot

- [ ] **Étape 1 : outil de capture.** Créer `audit-p6a.cjs` (même mise en place que `audit-p4b.cjs` : `gen-audit-p4a.cjs p6a-middle.txt audit-p6a.cjs`) qui, sur Dépenses et Facturation (tableaux avec poignée), mesure la largeur de `<col>` de la colonne « Montant » pendant le geste (aperçu), après le relâchement, et le nombre d'écritures de `visualPreferences`, puis capture ; **avant** sur le dernier commit (copie détachée, procédure de `PASSATION-2026-11-14-apres-R9.md` section 6, lien `node_modules`) et **après** sur le correctif. Attendu avant : la largeur revient, 0 écriture ; après : la largeur suit, 1 écriture.
- [ ] **Étape 2 : preuves** (résultats rapportés tels quels) : `npm run typecheck` propre ; `node scripts/run-tests.cjs` (312 fichiers avec `p6aWiring.test.ts`, 0 échec) ; natifs typographie 72, états 18/18, garde Abby 25, interface réelle 857 ; `check-ux-v2-lot10-ui` 59 ; bancs 01b, 01d, 01f verts ; `check-ux-v2-03e-directory` verte ; `check-contract-library-ui` sans contrôle sauté ; recettes de P1 à P4b toujours vertes (`check-shell-home-simplification` 836, `--lot09b|c|d|e` 85, 67, 73, 70, `check-project-operations-link` 17, `check-ux-v2-02d-home` 56, `check-home-shell-lot1` 96 avec un dossier de sortie inexistant, Offres lot 2 final 24 et legacy 19) ; budget des petits textes ≤ 617 et `!important` ≤ 86 ; `eol-report.cjs` sur tous les fichiers modifiés ; empreinte de la préproduction identique.
- [ ] **Étape 3 : montrer à Carlos** `C:\DEV\Livrables\Cadrage-parcours\captures-p6a\` (`avant\`, `apres\`) et les mesures, **dire que le redimensionnement à la souris ne fonctionnait pas depuis le 22/10/2026**, ce qui n'a pas été vu, et que la revue finale est un autocontrôle. **Attendre sa recette.**

---

### Tâche 6 : clôture et commit local (seulement après la recette de Carlos)

- [ ] **Étape 1 :** `docs/refonte/FINITIONS.md` : F47 à F51 « fait dans P6a » ; ligne P6a du tableau d'avancement.
- [ ] **Étape 2 :** `PROJECT_STATUS.md` (entrée en tête), `docs/refonte/PASSATION-2026-11-15-apres-P6a.md` (état, prochaine action P6b, pièges appris), mémoire (`projet-refonte-passation-r2.md` et sa ligne de `MEMORY.md`).
- [ ] **Étape 3 :** `git status` ; un seul commit local `feat(p6a): …` terminé par la ligne d'attribution demandée ; aucun push.

---

## Révisions

- **Mesures avant** (`captures-p6a\avant-sortie.txt`, vrais événements souris, 80 px) : Dépenses 215,75 à 215,75 px, Facturation 128,5 à 128,5 px, pendant et après ; clavier : 236 et 160 px. **Après** : 296 et 209 px pendant et après, clavier 316 et 229 px.
- **Ruling 1 (tâche 4, périmètre de F47)** : la recette `check-ux-v2-03e-directory` enchaîne trois blocs (`integration-02-03`, `03d-client`, `03e-directory`) ; les trois ont été réécrits, pas seulement le parcours Prospect, Devis, Projet. Coût si faux : aucun (la recette ne peut être verte autrement).
- **Ruling 2 (tâche 4, C07)** : la zone de résumé de la qualification a migré dans l'onglet Besoins ; le contrôle « saisie modifiée » s'appuie sur la liste « Situation du décisionnaire », dont la persistance passe par « Enregistrer le décisionnaire » (« Enregistrer la qualification » n'enregistre que le brief). Coût si faux : le contrôle de persistance pourrait viser un autre bouton.
- **Ruling 3 (tâche 4, conflit entre fenêtres)** : le formulaire « Besoins » détecte une modification faite ailleurs (« Conflit entre fenêtres », comportement voulu) ; le parcours ne modifie plus le résumé en base derrière lui et remonte le formulaire (changement d'onglet aller-retour) après l'actualisation de la liste. Coût si faux : un futur changement du chargement du formulaire peut rouvrir ce point.
- **Retiré (tâche 4)** : le contrôle « C02 Conversion pane acknowledges converted Prospect » visait un attribut d'identité de recherche absent du panneau d'historique depuis R3 ; remplacé par « le panneau affiche le dossier demandé ». Le contrôle « never falsely acknowledged » devient « aucun dossier listé si rien ne correspond ».
- **Ruling 4 (tâche 3, F48)** : l'aperçu client est un `iframe` lisible (`sandbox="allow-same-origin"`) : le texte du contrat y est vérifié directement ; la zone de lecture est dans un panneau d'onglet `hidden` (parcours de devis) : on active son onglet.
- **Ruling 5 (tâche 4, défaut du produit)** : le focus de repli de la page Annuaire visait `.directory-toolbar .inline-search`, sélecteur disparu en R8 ; corrigé dans le lot (garde de source dans `p6aWiring.test.ts`).
- **Limite assumée (tâche 4, étape 4)** : preuve par mutation faite pour « Rester par défaut » (mutation du produit, `defaultId`) ; non faite pour « enregistrement en attente bloque la navigation » et « échec qui garde le brouillon » (pas de point d'entrée simple dans le produit).

## Auto-relecture du plan

- Couverture de la fiche : F50 et F51 (tâche 1), F49 (2), F48 (3), F47 (4), recette (5), clôture (6) ; les états rares (P6b) ne sont pas dans ce lot.
- Cohérence des noms : `widthOf(id, withPreview)`, `p6aWiring.test.ts`, `audit-p6a.cjs`.
- Limites : les sélecteurs exacts de F47 et la nature de l'aperçu client de F48 sont relevés par des sondes aux tâches 3 et 4 (règles de décision écrites) ; l'ampleur de F47 (32 contrôles) peut faire passer le lot en deux commits de travail, mais le commit final reste unique.

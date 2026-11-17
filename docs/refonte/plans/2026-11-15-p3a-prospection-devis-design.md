# P3a Prospection et Devis : fiche courte (finitions d'écran)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J). Aucun code modifié. Les constats viennent des **captures de R3, R4 et R5** (`C:\DEV\Livrables\Cadrage-parcours\captures-r3\apres\`, `captures-r4\apres\`, `captures-r5\apres\`, écrans non modifiés depuis) et du code relu le 15/11/2026.
Skills : `atoumweb-design` (critique, polish), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Parent : `2026-11-14-passe-finitions-design.md`.

## Pourquoi couper P3 en deux

La fiche de la passe regroupait en P3 quatorze entrées sur trois domaines. Une recette sur captures de tout cela mêlerait la fiche prospect, l'assistant de devis, le plan de projet, l'onglet Sites et une fonction nouvelle (filtre par projet). Je propose :

- **P3a (cette fiche) : Prospection et Devis** : F1, F2, F3, F4, F44, F45, F46, M8.
- **P3b (fiche à part, ensuite) : Projets** : F13 à F18, F20 (filtre par projet), dont l'état vide de l'onglet Sites (décision 7 de Carlos) ; plus F16 à regarder sur des projets avancés.

## Intention

Que la fiche prospect et l'assistant de devis **disent les choses une fois, au bon endroit, et tiennent dans une fenêtre basse ou zoomée**, sans toucher au parcours, aux règles ni aux données.

## Ce que les captures et le code montrent

| N° | Constat | Preuve |
|---|---|---|
| **F1** | Les titres sont **répétés** : en-tête de section « Qualification » puis, juste dessous, « Qualification · Recommandation » ; en-tête « Analyse de l'entreprise » puis le même titre en gros dans le panneau | capture `006-besoins-sections-ouvertes`, `004-fiche-qualifying` ; `ProspectQualificationPanelV2.tsx:282`, `ProspectResearchPanel.tsx` (titre interne) |
| **F2** | En haut à droite de la fiche : pastille, température, **croix**, puis « Plus ». « Plus » devrait précéder la croix (la croix ferme, elle va en dernier) | capture `004` ; `ui/RecordHeader.tsx` (la croix est dans `actions`, `Plus` est rendu après) |
| **F3** | Dans l'assistant de devis, la raison du blocage de « Suivant » (« Choisis un prospect ou un client pour continuer. ») s'affiche **à l'extrême droite**, loin du bouton | capture `captures-r4\apres\002-assistant-pour-qui` ; `QuoteWizard.tsx:347`, `quote-wizard.css:79` |
| **F4** | Une section repliée affiche un résumé sauf « Prestations et points à confirmer », qui n'en a **aucun** (la fonction renvoie une chaîne vide) | `shared/prospectNeedsSections.ts` (`needsSectionSummary`, id `services`) |
| **F44** | Après le choix d'un résultat de la recherche globale, le **focus reste dans le champ de recherche** au lieu d'aller à la fiche. **Cause probable trouvée** : `WorkspaceHeader.closeSearch()` redonne le focus au champ dans un `requestAnimationFrame`, qui passe **après** celui d'`App.tsx` qui focalise la fiche. À confirmer par test d'abord | `ui/WorkspaceHeader.tsx:37` et `:43`, `App.tsx` (`markEntityReady`) ; mesure de P1 : focus encore dans « Recherche globale » après 1,2 s |
| **F45** | À 1440 px et zoom 150 % (960 px utiles), le conteneur de la table des prospects déborde de **15 px** ; les six autres tailles tiennent | mesure de P1 (recette `--ux-lot`) ; **élément fautif non identifié**, à mesurer |
| **F46** | À 1280 × 720 en zoom 150 % (853 × 480 px utiles), la fiche prospect en superposition laisse **33 px** de hauteur au contenu : l'en-tête, la carte « Prochaine étape », les étapes et les onglets occupent tout | mesure de P1 (recette `--desk`), capture `004` pour la hauteur des blocs |
| **M8** | En-têtes de la table de Prospection à 14 px gras 600 par une règle locale plus spécifique que le style partagé | `crm/prospect-visual-pilot.css:15` (`.app-shell .prospects-v2 .aw-data-table th{font-weight:600}`) |

## Hors périmètre

- **P3b Projets**, le filtre par projet de la page Interventions (F20, décision 4 : oui, dans P3b), la réécriture de la recette de parcours `check-ux-v2-03e-directory` (F47).
- L'acompte par défaut (lot dédié), toute règle métier, tout parcours, les thèmes AtoumWeb et Blanc, les densités Compact et Confort +.
- Les 625 → 617 petits textes (P5), même quand un fichier touché en contient : je ne les traite que si la ligne modifiée y est.

## Proposition

### F1 : un titre, une fois (autonome, applique la charte)
Garder l'en-tête de section (bouton replier). **Retirer le titre répété** à l'intérieur : « Analyse de l'entreprise » (titre du panneau) et le sur-titre « Qualification · Recommandation » (garder « Recommandation » comme étiquette, sans répéter « Qualification »). Le panneau garde ses boutons « Modifier l'analyse » et « Réduire ».

### F2 : « Plus » avant la croix (autonome)
`RecordHeader` reçoit une propriété `closeAction` rendue **en dernier**. Ordre : `[pastille] [température] [Plus] [✕]`. Les autres écrans qui l'utilisent (Client, Devis) gagnent la même cohérence ; je vérifie qu'ils n'ont pas de croix aujourd'hui.

```
avant :  [Besoin à identifier] [Température ▾] [✕] [Plus]
après :  [Besoin à identifier] [Température ▾] [Plus] [✕]
```

### F3 : la raison à côté du bouton (disposition, à valider)
Regrouper à droite : **la raison juste à gauche de « Suivant »**, sur la même ligne, alignée à droite ; « Précédent » reste à gauche.

```
avant :  [← Précédent]        [Suivant →]            Choisis un prospect ou un client pour continuer.
après :  [← Précédent]        Choisis un prospect ou un client pour continuer.  [Suivant →]
```

### F4 : un résumé pour « Prestations et points à confirmer » (libellé, à valider)
Même logique que les autres sections, **calculée sur des données déjà en base** : « 2 prestations · 1 point à confirmer », « 2 prestations » si aucun point, « 1 point à confirmer » si aucune prestation, « À préciser » si rien. Accord pluriel (`plural`).

### F44 : le focus va à la fiche (comportement, test d'abord)
Quand un résultat de recherche ouvre une fiche, `closeSearch` ne redonne pas le focus au champ. Test d'abord : la recette `check-ux-v2-03e-directory` (C08) sert de repère rouge ; j'écris un test dédié plus court, qui doit échouer pour la bonne raison avant le correctif. Si la cause réelle est autre que celle ci-dessus, je te le dis avant de corriger.

### F45 : mesurer, puis corriger le seul élément fautif
Une sonde mesure quel élément déborde de 15 px (hypothèses : poignée de redimensionnement de colonne, colonne « Prochaine action » sans largeur minimale). Correction minimale, la recette `--ux-lot` devient verte.

### F46 : une fenêtre basse laisse du contenu (disposition, à valider)
Deux options pour hauteur utile ≤ 600 px :

- **A (recommandée)** : l'en-tête, la carte « Prochaine étape » et les étapes **défilent avec le contenu** (une seule zone de défilement) ; les onglets restent visibles en haut. Aucune information retirée, aucun comportement changé hors fenêtre basse.
- **B** : la carte « Prochaine étape » passe en **une ligne** (titre et bouton principal) dans les fenêtres basses. Plus compact, mais cache le texte « Aucune action programmée ».

### M8 : un seul style d'en-têtes de table
Retirer la règle locale `font-weight:600` ; les en-têtes reprennent le style partagé `DataTable`. Vérifié sur captures.

## Approches envisagées

- **A (recommandée) : P3a seul maintenant (Prospection et Devis), P3b ensuite.** Un lot, une recette sur captures, un commit.
- **B : P3 entier en un lot.** Quatorze entrées, trois domaines, une fonction nouvelle : une recette difficile à juger et un commit difficile à relire.
- **C : tout sauf les dispositions (F3, F46) pour aller vite, dispositions plus tard.** Laisserait les deux défauts les plus visibles.

## Décisions qui sont à toi

1. **Couper P3** en P3a (cette fiche) et P3b (Projets) : OK ?
2. **F3** : la raison **à gauche de « Suivant »**, sur la même ligne : OK ?
3. **F4** : libellés « 2 prestations · 1 point à confirmer » / « À préciser » : OK ?
4. **F46** : option **A** (en-tête qui défile avec le contenu en fenêtre basse) ou **B** (carte en une ligne) ?
5. **F44** : corriger **dans P3a** (cause probable : `closeSearch`) : OK ? Et la réécriture du long parcours `03e` (F47) : **en P6** comme prévu ?

## Ce que je n'ai pas pu voir

F45 (l'élément qui déborde n'est pas identifié) ; F46 sur une capture réelle de fenêtre basse (mesure seulement) ; les étapes 2 à 5 de l'assistant de devis (déjà « à voir » en F7) ; l'effet de F2 sur Client et Devis (à vérifier à l'exécution) ; les thèmes AtoumWeb et Blanc.

## Preuves prévues

Tests d'abord (F2 propriété de `RecordHeader`, F3 position de la raison, F4 `needsSectionSummary('services')`, F44 focus, M8 règle retirée) ; `npm run typecheck` ; `node scripts/run-tests.cjs` (305 fichiers, 2 471 tests aujourd'hui) ; quatre scripts natifs sans option (72, 18/18, 25, 857) ; `check-ux-v2-lot10-ui` (59) ; recettes de P1 toujours vertes ; **`--ux-lot` et `--desk` passent au vert** (F45, F46), `check-ux-v2-03e-directory` passe C08 ; **captures avant (dernier commit) et après** de : fiche prospect (Qualification, Analyse, en-tête), assistant de devis (« Pour qui »), table de Prospection, fiche à 1280 × 720 zoom 150 % ; budget des petits textes (617) et `!important` (≤ 86) ; fins de ligne par `eol-report.cjs` ; `FINITIONS.md` (F1 à F4, F44 à F46, M8 « fait dans P3a »), `PROJECT_STATUS.md`, fichier de reprise. Un seul commit local, après tes captures vues. **La revue finale est un autocontrôle, pas un relecteur indépendant.**

## Révisions

**Décisions de Carlos du 15/11/2026 (fiche validée)** : 1. P3 coupé en P3a (cette fiche) et P3b (Projets) ; 2. F3 : la raison à gauche de « Suivant », même ligne ; 3. F4 : « 2 prestations · 1 point à confirmer » / « À préciser » ; 4. F46 : option A (en-tête, Prochaine étape et étapes défilent avec le contenu en fenêtre basse, onglets visibles) ; 5. F44 corrigé dans P3a (test d'abord), F47 reste à P6. Aucune révision de périmètre.

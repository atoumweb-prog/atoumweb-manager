# P4 : Accueil, Gestion, Ressources, Réglages (fiche courte de la passe de finitions)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J).
Skills : `atoumweb-design` (shape, layout, adapt, clarify), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E).
Entrées du registre `FINITIONS.md` : F43, F23, F25, F28, F33, F35, F38, F40. F31 et F37 sont tranchées (rien à faire).

## D'où viennent les constats

Lu : le registre, les passations, `home-r6.css`, `HomeDashboard.css` (grille), `list-page.css`, `ListToolbar.tsx`, `TimePage.tsx`, `DocumentsPage.tsx`, `ExpensesPage.tsx`, `BillingPage.tsx`, `shared/gestionEmpty.ts`, `navigation-rail.css`, `SettingsPage.tsx`, `settings-r9.css`, `BusinessBackupsPage.tsx`.
**Non vu pour cette fiche : aucune capture nouvelle, aucune mesure.** Les chiffres ci-dessous sont ceux du registre. La première tâche du plan est de capturer l'état « avant » et de mesurer.

## Ce que le code dit déjà

- **F23** : `HomeDashboard.css` donne déjà `grid-column: 1 / -1` à `.home-widget-today`. Le registre parle d'une demi-largeur : soit la mesure est ancienne, soit le défaut vient de la liste elle-même (colonnes de `.home-todo-row`). **À mesurer avant de décider** ; si le défaut a disparu, F23 passe en « fait » sans code.
- **F28** : `ExpensesPage.tsx:440` (« Aucune dépense dans cette vue. ») et `BillingPage.tsx:322` (« Aucun élément de facturation. ») sont des textes locaux, alors que `shared/gestionEmpty.ts` a déjà `expensesEmptyText()` et `billingEmptyText()`.
- **F25** : `ListToolbar` met l'action principale après les filtres (`margin-left: auto`) ; quand les filtres prennent la largeur, l'action tombe seule sur une deuxième ligne (Temps : quatre listes ; Documents : deux listes et la recherche).
- **F40** : Apparence (thèmes et densités) et Navigation (rail, favoris, largeurs de liste) sont deux `article.panel-large` pleins, avec `.settings-grid > .panel { grid-column: 1 / -1 }` dans `settings-r9.css`.
- **F38** : dans Sauvegardes, les sur-titres « Prévention opérationnelle », « Vigilance métier », « Nouvel enregistrement », « Historique » existent encore (`BusinessBackupsPage.tsx`, lignes 355, 404, 440, 458) alors que R9 les a supprimés ailleurs.
- **F43** : bouton secondaire de 26 px dans `HomeDashboard.css` (l. 212) qui pousse le contenu de 4 px en fenêtre étroite.
- **F33** : `.aw-rail-scroll` défile (`flex: 1; min-height: 0; overflow: auto`) mais le dernier élément est à moitié caché à 948 px de haut : la cause (hauteur de la grille, marge basse) n'est pas établie.

## Ce que je ferai sans demander (règle A : applique la charte)

F28 (textes de `gestionEmpty.ts`, test d'abord), F38 (sur-titres retirés, bloc rangé comme le reste des Ressources), F43 (bouton qui ne force plus la largeur ; `check-shell-home-simplification` passe au vert), F33 (cause mesurée puis corrigée), F40 pour la légende « Informations de l'entreprise » qui répète l'onglet.

## Ce qui est à toi (disposition d'écran)

1. **Découpage.** Huit entrées sur neuf écrans (Accueil large et étroit, Temps, Documents, Dépenses, Facturation, rail, Statistiques, Sauvegardes, Réglages). Je recommande **deux lots** : **P4a Accueil, Gestion et rail** (F43, F23, F25, F28, F33) et **P4b Ressources et Réglages** (F35, F38, F40). Chacun a sa recette sur captures.
2. **F25 : où va l'action principale.** A (recommandée) : la barre devient deux rangées fixes, première rangée = onglets, compteur, Actualiser, recherche, **action principale à droite** ; seconde rangée = les filtres. Rien n'est caché, l'action ne tombe plus seule. B : ranger une partie des filtres dans un menu « Filtres » (moins de place, mais des filtres cachés).
3. **F35 : Statistiques.** A (recommandée) : quand **toutes** les cartes d'une vue disent « Nouveau sur la période », une seule ligne au-dessus des chiffres (« Pas de période précédente à comparer ») remplace les quatre répétitions ; les cartes cliquables reçoivent un indice visible (chevron et « Voir le détail » au focus et au survol). La vraie comparaison reste quand elle existe. B : indice seulement. C : ne rien changer.
4. **F40 : Réglages.** Apparence et Navigation côte à côte (ta décision 8), en deux colonnes quand la place le permet (environ 1 100 px de contenu), une colonne en dessous. Les autres sections restent pleine largeur. Variante : retirer aussi la légende « Informations de l'entreprise » (je la retire dans les deux cas).

## Hors périmètre

Petits textes sous 14 px (F24, F26, F34, le reste de F35 et F40 : P5, budget visé à zéro) ; états rares et onglets de Statistiques non vus pleins (P6) ; F27 chiffres clés (P5) ; acompte par défaut (lot dédié) ; aucune donnée, règle métier ni parcours modifiés ; aucune écriture dans la préproduction (états forcés dans la copie jetable de l'outil de capture).

## Preuves prévues

Tests d'abord pour les règles pures (textes vides, résumé de comparaison de Statistiques) ; typecheck ; suite complète (309 fichiers, 2 500 tests aujourd'hui) ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `check-shell-home-simplification` **au vert** (F43) ; `03e` toujours rouge sur F47 seul ; budget des petits textes 617 (il ne peut que baisser) ; `!important` d'`ui-consistency-v2.css` au plus 86 ; fins de ligne par `eol-report.cjs` ; captures avant / après dans `C:\DEV\Livrables\Cadrage-parcours\captures-p4a\` puis `captures-p4b\` (outil dérivé d'`audit-p3b.cjs`) ; mise à jour de `FINITIONS.md`, `PROJECT_STATUS.md`, du fichier de reprise et de la mémoire avant chaque commit local.

## Ce que je ne pourrai pas voir

Thèmes AtoumWeb et Blanc, densités Compact et Confort +, Sites rempli, états d'erreur, clavier. **La revue finale d'un lot est un autocontrôle de l'auteur, pas un relecteur indépendant.**

## Décisions de Carlos

Validées le 15/11/2026 dans le chat, les quatre selon la recommandation :

1. **Découpage** : deux lots, **P4a Accueil, Gestion et rail** (F43, F23, F25, F28, F33), puis **P4b Ressources et Réglages** (F35, F38, F40).
2. **F25** : option A, barre d'outils en deux rangées (action principale à droite de la première, filtres sur la seconde), pour les cinq listes de Gestion.
3. **F35** : option A, une ligne « pas de période précédente à comparer » quand toutes les cartes sont « Nouveau », indice visible sur les cartes cliquables.
4. **F40** : Apparence et Navigation côte à côte, légende « Informations de l'entreprise » retirée.

## Révisions

(aucune pour l'instant)

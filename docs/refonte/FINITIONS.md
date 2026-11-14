# Registre des finitions de la refonte

Statut : **registre vivant**, créé le 14/11/2026 à la demande de Carlos pour ne perdre aucune finition. Une finition est un défaut mineur vu pendant un lot, volontairement laissé hors de ce lot. Ce registre ne remplace ni `PROJECT_STATUS.md` ni `docs/refonte/DESIGN.md`.

## Quand : la passe de finitions

**Décidé par Carlos le 14/11/2026** : une **passe de finitions** après R9 (Réglages) et avant la mise à jour finale des styles AtoumWeb et Blanc et des densités. Elle traite tout ce qui est « à faire » ci-dessous, avec fiche, captures avant / après et recette comme un lot normal (règle J).

Règles en attendant :
- À la fin de chaque lot (R5, R6, R7, R8, R9), la recette de Carlos s'achève par la mise à jour de ce registre : toute finition nouvelle y est inscrite avant le commit du lot.
- Un point peut être sorti du registre plus tôt si le lot qui touche le même écran le justifie ; il est alors marqué « fait dans R… ».
- L'acompte par défaut n'est **pas** une finition : lot dédié, validé à part (décision du 14/11/2026).

## Finitions ouvertes

| N° | Finition | Vue dans | Écran ou fichier | Statut |
|---|---|---|---|---|
| F1 | Titres de section en double : « Qualification » et « Analyse de l’entreprise » apparaissent deux fois (en-tête de section et titre du panneau) | R3 | Fiche prospect, onglets Besoins et Préparer l’échange | à faire |
| F2 | Ordre en haut à droite de la fiche : pastille, température, croix, puis « Plus » ; « Plus » devrait précéder la croix | R3 | `ui/RecordHeader.tsx`, `ProspectsPageV2.tsx` | à faire |
| F3 | La raison du blocage de « Suivant » s'affiche à l'extrême droite, loin du bouton | R4 | `QuoteWizard.tsx`, `quote-wizard.css` | à faire |
| F4 | Résumés de section repliée absents pour « Prestations et points à confirmer » | R3 | `prospectNeedsSections.ts` | à faire |
| F5 | 7 scénarios de recette Prospection obsolètes (`prospect-density-scenarios`, `prospection-corrections`, `-desk`, `-flow`, `-pilot`, `-tabs`, `-ux-lots`) : visent `prospect-focus-*`, associations de l'ancienne fiche, « Classer comme perdu » en bouton | R3 | `scripts/fixtures/` | à faire |
| F6 | `check-contract-library-ui.cjs --output <dossier>` échoue sur « PDF common presentation » (HTML du PDF) ; échec présent avant R3, `src/main` non touché, cause non établie | R3 et R4 | `scripts/check-contract-library-ui.cjs` | à diagnostiquer |
| F7 | Non vu : devis envoyé ou accepté, états d'erreur, textes très longs, fenêtre étroite, clavier, étapes 2 à 5 de l'assistant, étapes « négociation » et « en attente » de la fiche prospect | R3 et R4 | Prospection, Devis | à voir |
| F8 | Captures « avant » de R4 antérieures à R0 à R3 : comparaison approximative | R4 | `captures-r4\avant\` | information |
| F9 | Budget des petits textes (648 après R7) et `!important` d'`ui-consistency-v2.css` : chaque lot doit les faire baisser | R2 à R4 | `ui/fontFloorBaseline.json` | chaque lot |
| F10 | 11 fichiers orphelins à confirmer avant retrait (`WorkflowDashboard.tsx` base possible de R6, `CatalogOverview.tsx`, `QuoteFinalizationPanel.tsx`, `DashboardOperationsWatch.tsx`, 3 ateliers, `project-tree-arrangement.css`) | audit | `src/renderer/` | à confirmer |
| F11 | Mineurs M4 à M9 de la passation : notice sans garde sur le message courant ; détecteur de boutons trop large ; `page-header.css` hors liste de `importantBudget.test.ts` ; CSS mort `.database-chip` et `.health-dot` ; en-têtes de Prospection en 14 px gras ; `emptyText` jamais passé par un écran | R2 | divers | à faire |
| F12 | `check-contribution-targets-ui.cjs --output <dossier>` échoue sur « Affecter la cible » en mode prévisionnel ; **échec déjà présent avant R5a** (vérifié avec l'ancien panneau), cause non établie | R5a | `scripts/check-contribution-targets-ui.cjs` | à diagnostiquer |
| F13 | La note « Plan issu du modèle d'origine » s'affiche sur les trois projets issus d'un modèle et prend environ 75 px : la rendre repliable, ou la masquer quand elle n'apprend rien | R5a | `ProjectsPage.tsx` (`detailUsesBlueprint`) | à faire |
| F14 | Le plan de production démarre à 429 px (objectif 420 px) ; marge possible en resserrant l'en-tête | R5a | `ProjectsPage.tsx`, `projects.css` | à faire |
| F15 | Traits qui dépassent à droite de certaines lignes de phase dans le plan (vu sur la capture de la landing page) : à vérifier | R5a | `project-phase-*` dans `projects.css` | à voir |
| F16 | La ligne « En ce moment » n'a été vue que sur des projets sans avancement (« Rien ne bloque ce projet. ») : à regarder avec des tâches bloquées, en attente client et des prérequis manquants | R5a | `ProjectNowLine.tsx` | à voir |
| F17 | Noms de tâche encore coupés dans l'arbre du plan (« Recevoir le logo et les te… ») : les laisser passer sur deux lignes | R5a | `projects.css` (`.project-step`) | à faire |
| F18 | Onglet Sites et pages d'un projet issu d'un modèle : « 0 Site · 0 Page », volet de droite « Sélectionne un Site ou une Page » sans rien à sélectionner, bouton `←` sans libellé. Décision de Carlos du 14/11/2026 : finition, hors R5b | R5b | `ProjectSitesTab.tsx`, `sites-pages-v2.css` | à faire |
| F21 | Recettes de l'Accueil `check-ux-v2-02d-home.cjs` et `check-shell-home-simplification.cjs` : **déjà en échec avant R6** (vérifié sur le dernier commit). R6 a corrigé quatre attentes périmées (libellé « Temps & facturation », position du bloc déposé, « Descendre Accès rapides », ancien sélecteur du bloc Aujourd'hui) ; elles s'arrêtent maintenant à « Failed persistence never announces or applies saved layout » (clic sur « Descendre Pipeline commercial » avec écriture refusée), cause non établie | R6 | `scripts/fixtures/02d-home-scenarios.cjs` | à diagnostiquer |
| F22 | `check-home-shell-lot1.cjs` exige `ATOUMWEB_UX_LOT1_OUTPUT` (dossier neuf) et échoue sur « Home logo variant is absent from Prospection » : le logo de référence de l'Accueil figure dans le rail de Prospection (audit : logo différent selon les écrans) ; non touché par R6 | R6 | `scripts/fixtures/home-shell-lot1.cjs`, `ui/navigation-rail.css` | à diagnostiquer |
| F23 | Accueil large : « À faire maintenant » n'occupe que la demi-largeur gauche quand « À surveiller » (droite) est court : grand vide à droite sous les alertes ; envisager la liste sur toute la largeur | R6 | `home/HomeDashboard.css`, `HomeDashboardV2.css` | à voir |
| F24 | Accueil : sept blocs historiques gardent encore 30 déclarations sous 14 px dans `HomeDashboard.css` (indicateurs, pipeline, temps, alertes) ; hors périmètre de la liste | R6 | `home/HomeDashboard.css` | à faire |
| F25 | Temps et Documents à 1 510 px : l'action principale (« + Temps manuel », « + Document ») passe seule sur une deuxième ligne parce que les listes déroulantes prennent beaucoup de place (Temps : quatre filtres) ; envisager de replier une partie des filtres | R7 | `ui/list-page.css`, `time/TimePage.tsx`, `documents/DocumentsPage.tsx` | à voir |
| F26 | Interventions et Temps : fiches détaillées, vues Maintenance et Packs, sauvegarde d'intervention, popover du chrono et historique projet gardent des déclarations sous 14 px (`operations.css` 36, `time.css` 13) ; hors périmètre de la liste | R7 | `operations.css`, `time.css` | à faire |
| F27 | Deux composants de chiffres clés presque identiques : `KeyFigures` (R7, `.aw-keyfigure`) et les cartes des onglets de projet (R5b, `.project-keyfigure` dans `project-r5b.css`) ; les tuiles de l'Accueil en sont une troisième variante : les unifier | R7 | `ui/KeyFigures.tsx`, `projects/project-r5b.css`, `home/HomeDashboard.tsx` | à faire |
| F28 | Dans les trois listes à fiche ouverte (Documents, Dépenses, Facturation), le message vide de la liste compacte reste un texte local (« Aucune dépense dans cette vue. ») non aligné sur `shared/gestionEmpty.ts` | R7 | `DocumentsPage.tsx` (déjà aligné), `ExpensesPage.tsx`, `BillingPage.tsx` | à faire |
| F29 | Base de test : un `-wal` et un `-shm` vides sont restés dans `Workspace\data` (lecture en lecture seule avec le client `sqlite3` de Claude) ; leur suppression a été refusée, ils sont sans danger ; à supprimer à la main si gênants. Le script `seed-gestion-cas-de-figure.cjs` tolère un `-wal` vide | R7 | `Workspace\data\atoumweb-manager.sqlite-wal` | information |
| F30 | Jeu de cas de figure Gestion : aucune session de chrono en cours (elle resterait active dans la base et dans l'en-tête) ; l'état « En cours » du tableau de Temps n'est couvert que par un test ; le cas « tous les documents archivés » se voit en filtrant sur le client Atelier des Saveurs | R7 | `scripts/seed-gestion-cas-de-figure.cjs` | information |
| F20 | Onglet Interventions d'un projet : au-delà de 6 demandes ou 8 interventions, le texte dit « + N autres non affichées » sans lien vers la liste complète. **Décision de Carlos du 14/11/2026 : laissé en finition en R7**, parce que la page Interventions n'a aucun filtre par projet ; le brancher demande d'ajouter ce filtre (état de page et événement de navigation) | R5b, R7 | `ProjectOperationsTab.tsx`, `OperationsPage.tsx`, `App.tsx` | à faire (demande un filtre par projet) |
| F19 | Jeu de cas de figure (`scripts/fixtures/projets-cas-de-figure.json`) à étendre : projet terminé, projet avec incident, maintenance expirée, pack épuisé | R5b | `scripts/seed-projets-cas-de-figure.cjs` | information |

## Lots qui portent déjà leurs propres points

| Point | Lot |
|---|---|
| Titre de projet coupé dans la cellule | R5 |
| Message vide du Temps (M1), « Documents tout archivé » (M2) | **fait dans R7** (14/11/2026) |
| Deux définitions de « filtres actifs » dans Offres (M3) | R8 |
| Page **Annuaire** (groupe Ressources du rail) : aucun lot ne la nomme (R8 liste Offres, Bibliothèque, Sites, Sauvegardes, Statistiques) ; à trancher avec Carlos dans la fiche de R8 | R8 (à confirmer) |
| Thèmes AtoumWeb et Blanc, densités Compact et Confort + | Fin de refonte |
| Acompte par défaut venant des Réglages | Lot dédié, décision de Carlos |

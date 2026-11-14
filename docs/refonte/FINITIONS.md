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
| F9 | Budget des petits textes (677) et `!important` d'`ui-consistency-v2.css` : chaque lot doit les faire baisser | R2 à R4 | `ui/fontFloorBaseline.json` | chaque lot |
| F10 | 11 fichiers orphelins à confirmer avant retrait (`WorkflowDashboard.tsx` base possible de R6, `CatalogOverview.tsx`, `QuoteFinalizationPanel.tsx`, `DashboardOperationsWatch.tsx`, 3 ateliers, `project-tree-arrangement.css`) | audit | `src/renderer/` | à confirmer |
| F11 | Mineurs M4 à M9 de la passation : notice sans garde sur le message courant ; détecteur de boutons trop large ; `page-header.css` hors liste de `importantBudget.test.ts` ; CSS mort `.database-chip` et `.health-dot` ; en-têtes de Prospection en 14 px gras ; `emptyText` jamais passé par un écran | R2 | divers | à faire |
| F12 | `check-contribution-targets-ui.cjs --output <dossier>` échoue sur « Affecter la cible » en mode prévisionnel ; **échec déjà présent avant R5a** (vérifié avec l'ancien panneau), cause non établie | R5a | `scripts/check-contribution-targets-ui.cjs` | à diagnostiquer |
| F13 | La note « Plan issu du modèle d'origine » s'affiche sur les trois projets issus d'un modèle et prend environ 75 px : la rendre repliable, ou la masquer quand elle n'apprend rien | R5a | `ProjectsPage.tsx` (`detailUsesBlueprint`) | à faire |
| F14 | Le plan de production démarre à 429 px (objectif 420 px) ; marge possible en resserrant l'en-tête | R5a | `ProjectsPage.tsx`, `projects.css` | à faire |
| F15 | Traits qui dépassent à droite de certaines lignes de phase dans le plan (vu sur la capture de la landing page) : à vérifier | R5a | `project-phase-*` dans `projects.css` | à voir |
| F16 | La ligne « En ce moment » n'a été vue que sur des projets sans avancement (« Rien ne bloque ce projet. ») : à regarder avec des tâches bloquées, en attente client et des prérequis manquants | R5a | `ProjectNowLine.tsx` | à voir |
| F17 | Noms de tâche encore coupés dans l'arbre du plan (« Recevoir le logo et les te… ») : les laisser passer sur deux lignes | R5a | `projects.css` (`.project-step`) | à faire |
| F18 | Onglet Sites et pages d'un projet issu d'un modèle : « 0 Site · 0 Page », volet de droite « Sélectionne un Site ou une Page » sans rien à sélectionner, bouton `←` sans libellé. Décision de Carlos du 14/11/2026 : finition, hors R5b | R5b | `ProjectSitesTab.tsx`, `sites-pages-v2.css` | à faire |
| F20 | Onglet Interventions d'un projet : au-delà de 6 demandes ou 8 interventions, le texte dit « + N autres non affichées » sans lien vers la liste complète (aucune navigation de ce genre n'existe) : à brancher quand R7 refera la liste Gestion | R5b | `ProjectOperationsTab.tsx` | à faire en R7 |
| F19 | Jeu de cas de figure (`scripts/fixtures/projets-cas-de-figure.json`) à étendre : projet terminé, projet avec incident, maintenance expirée, pack épuisé | R5b | `scripts/seed-projets-cas-de-figure.cjs` | information |

## Lots qui portent déjà leurs propres points

| Point | Lot |
|---|---|
| Titre de projet coupé dans la cellule | R5 |
| Message vide du Temps (M1), « Documents tout archivé » (M2) | R7 |
| Deux définitions de « filtres actifs » dans Offres (M3) | R8 |
| Thèmes AtoumWeb et Blanc, densités Compact et Confort + | Fin de refonte |
| Acompte par défaut venant des Réglages | Lot dédié, décision de Carlos |

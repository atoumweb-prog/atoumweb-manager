# UX-01 — Saisies non enregistrées : diagnostic et proposition

> Ce diagnostic est le checkpoint antérieur à l’autorisation d’implémentation. Les corrections A/B/C et leurs vérifications sont décrites dans [le bilan de livraison](FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md). Les observations ci-dessous sont conservées comme preuves avant correction.

## État au diagnostic — 09/10/2026

**Diagnostic terminé ; corrections non implémentées.** Branche `codex/fix-manager-unsaved-inputs-ux01` créée depuis `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, identique à origin/main après fetch. Aucun commit/push/PR pour cette passe. Les PR #80 et #81 restent inchangées ; #81 reste en draft sans fusion automatique. Son code non fusionné n'est pas repris dans cette branche.

AtoumWeb demande un inventaire, des reproductions isolées et une proposition avant un changement transversal. Aucune refonte UX/UI V2, modification métier ou intervention sur Validation-MSI.

## 1. Périmètre et preuves

- Inspection du code courant et du registre de #80 : pas de beforeunload, de registre commun ni de garde générale de navigation. Les confirmations existantes concernent des décisions métier.
- Analyse AST depuis `src/renderer/main.tsx` : **82 fichiers TSX raccordés statiquement**, dont certains conditionnels ; **58 fichiers avec contrôles natifs**, **709 déclarations input/select/textarea**, **8 form**. Ces nombres comprennent filtres, readonly et helpers répétés ; ce ne sont pas 709 formulaires ou instances runtime.
- **13 scénarios natifs** sur App/React/preload/vrais IPC/services et SQLite temporaires. **9 pertes reproduites**, 3 comportements locaux utiles confirmés, 1 risque de workspace différé. Les autres parcours sont couverts par inspection ; aucune prétention de recette UI individuelle de chaque champ.
- Montage de sonde repris de `scripts/check-contract-library-ui.cjs`, sans son option source : services compilés, renderer inchangé, ensureWorkspace/DatabaseService sur dossier temporaire et app.userData isolé. Electron 44.3.0 / Node 24.20.0 ; fenêtres cachées. Aucun mock métier ; dialogue de choix de dossier piloté vers B temporaire, confirmation instrumentée pour compter ses appels.
- Intégrité fixture `ok`, FK vides, migrations **1–66**. Les saisies Prospect non validées n'ont créé aucun Prospect. Fenêtres/base fermées, fixture supprimée après la sonde. Les essais de mise au point ont utilisé cette seule fixture ; le run final s'est terminé sans erreur.
- Aucun code fonctionnel/test de protection livré ici. Pas de suite normale/typecheck rejoués pour une passe documentaire ; ils seront requis après correction. La validation de #81 ne vaut pas validation de cette branche.

## 2. Reproductions exécutées

Les valeurs sont des marqueurs fictifs. L'observateur beforeunload ne bloque pas l'événement.

| Cas | Manipulation | Résultat actuel | Qualification |
| --- | --- | --- | --- |
| R01 | Création Prospect, Société saisie ; Fermer puis rouvrir sur même page | Texte conservé dans l'état du parent | Comportement utile |
| R02 | Même saisie ; sidebar Clients puis retour Prospection | Champ vide ; zéro confirmation | Perte |
| R03 | Même saisie ; vrai webContents.reload puis rouvrir formulaire | Champ vide ; beforeunload non empêché | Perte |
| R04 | Devis A : contexte contractuel modifié ; enregistrer les informations communes | Contexte non enregistré effacé ; zéro confirmation | Perte entre sections |
| R05 | Administration commune modifiée ; enregistrer la préparation du devis | Saisie administrative effacée | Perte inverse |
| R06 | Contexte modifié ; ouvrir B puis A par les lignes de liste | Ancienne valeur enregistrée réaffichée ; zéro confirmation | Perte au changement de fiche |
| R07 | Contexte modifié ; Escape puis rouvrir A | Saisie perdue | Fermeture clavier |
| R08 | Contexte modifié ; pointerdown extérieur puis rouvrir | Saisie perdue | Clic extérieur |
| R09 | Ligne modifiée puis Annuler | Éditeur fermé ; ligne serveur inchangée | Annulation explicite correcte |
| R10 | Clause particulière modifiée sans enregistrer | Avertissement ; copies Abby/contrat/tout/sections désactivées | Protection locale réelle |
| R11 | Même clause puis Escape et réouverture | Corps original revenu malgré l'avertissement | Perte |
| R12 | Contexte modifié ; vrai BrowserWindow.close puis nouvelle fenêtre sur même fixture | Saisie perdue ; zéro will-prevent-unload | Fermeture native |
| R13 | Prospect en saisie ; workspace.choose vers B temporaire | B inscrit au bootstrap, restartRequired=true ; texte encore dans A ; zéro confirmation | Risque différé |

R13 n'a pas redémarré sur B : l'IPC courant reste connecté à A. Le choix seul ne détruit pas la saisie ; le bootstrap résoudra B au redémarrage. Il faut protéger avant de programmer la bascule et protéger le redémarrage.

Point secondaire observé pendant la sonde : un événement de recherche vers le même devis déjà ciblé ne le rouvre pas après fermeture, car initialId ne change pas. Les reproductions finales utilisent les lignes réellement cliquées. Ce point est noté, pas corrigé dans UX-01.

## 3. Causes et protections à conserver

**Navigation/cycle de vie.** App remplace activePage dans navigate, openSearchResult et les événements métier ; la page précédente est démontée. QuotesPage ferme le détail par croix, backdrop, pointerdown et Escape ; openQuote remplace la fiche et ferme l'éditeur. Aucun de ces chemins ne consulte les drafts. Les fenêtres principale/référence Prospect n'ont pas de garde ; will-navigate protège les URL externes, pas les transitions React. before-quit ferme SQLite, pas les états React. workspace:choose écrit la configuration sans connaître les saisies.

**Sections.** `QuoteContractPreparationPanel.tsx:15–18` : perform exécute une action puis reload remplace **p et admin**, quelle que soit la section enregistrée. Le garde de navigation ne corrigera pas R04/R05 : la page reste ouverte.

**Autres écrasements identifiés dans le code, à recetter localement avant adaptation :**

- ContractTermsBuilder:setBuildAndDrafts reconstruit tous les drafts après une opération ; son unsaved ne couvre pas customTitle/customBody, création de template et versionEditors.
- ContractLibraryPage:33–34 recharge composition et texte du module quand types/clauses changent ; une sauvegarde peut écraser un autre brouillon.
- InterventionFields:20 remplace draft sur tout nouveau prop intervention, même de même ID.
- MaintenanceReportPanel:load recharge les trois textes à la réouverture du panneau ; masquer/rouvrir peut ici remplacer une saisie.
- ProjectCompositionItemSettings recharge draft/note depuis l'élément ; changements d'élément/props à coordonner.
- Réponses tardives et rafraîchissements après d'autres actions : conserver contexte fiche/version et champs édités.

**Briques existantes :**

- Exécuté : avertissement/blocage copies Builder et Annuler de QuoteLineEditor ; les conserver, sans confondre avec une protection de sortie.
- Exécuté : masquer/rouvrir le formulaire Prospect conserve le draft ; ne pas demander confirmation à chaque réduction.
- Code : ProspectQualificationPanelV2:76–80 fusionne les champs restés identiques lors du refresh de la même fiche et conserve les autres ; réutiliser ce principe, sans prétendre protéger une sortie.
- Code : dirty/undo/redo dans ProjectCompositionItemSettings:232–234 ; changed/révisions explicites dans AtoumWebLibraryPage:1956–2003 ; raccorder ces éditeurs au lieu de les réécrire.
- Les guards serveur, versions et snapshots acceptés restent la référence. Aucune autosauvegarde/publication/finalisation implicite.

## 4. Inventaire des déclencheurs

| Sortie ou remplacement | Entrées à couvrir | Portée |
| --- | --- | --- |
| Page | Sidebar, recherche, dashboard/liens métier, événements open-page/navigate/contract-library/catalog/library/prospects-view/intervention-conclusion | Tous les drafts démontés, même masqués |
| Fiche | Listes/cartes, client/devis/prospect/projet/élément/module/version/période | Scopes de la fiche quittée avant changement d'ID/reset |
| Panneau | Croix, backdrop, clic extérieur, Escape, Retour, fermeture réutilisation, Annuler édition | Drafts détruits seulement ; distinguer annulation volontaire et réduction |
| Onglet/étape | Assistant Devis, desk Prospect, onglets Projet, code/type/module/version | Vérifier si état conservé ; pas de prompt quand il reste vivant |
| Reset/révision | Version Bibliothèque, changer source/version, nouveau brouillon, duplication/révision | Saisies remplacées ; pas de réécriture serveur de l'ancien dossier |
| Refresh/save voisin | Actualiser, retour IPC, événement temps, sauvegarde autre section, reload bibliothèque | Fusion sélective, baseline propre à chaque section |
| Fenêtre/application | Principale et référence détachée, croix Windows, Alt+F4, Quitter/quit/relaunch | Agrégation des fenêtres, confirmation unique |
| Reload | Ctrl+R, menu Reload, webContents.reload | Avant destruction du renderer ; React seul insuffisant |
| Workspace | Réglages/IPC puis redémarrage, dialogue système annulé | Avant écriture du bootstrap ; fermeture coordonnée |

Une panne/crash/arrêt forcé ne peut être empêché par ces gardes. Un brouillon récupérable nécessiterait un arbitrage distinct de stockage/confidentialité ; aucune persistance automatique n'est proposée ici.

## 5. Mécanisme commun proposé — non implémenté

**Registre léger par fenêtre + hook React**, sans SQLite. Chaque éditeur métier déclare scope stable (fenêtre/entité/version/section), label humain, dirty et pendingSave. Il conserve son state ; aucun second référentiel de données. Réutiliser dirty/changed existant ou comparer au baseline normalisé. Un champ revenu à sa valeur initiale redevient propre. Baseline initial = valeur présentée après defaults, pour ne pas marquer l'ouverture comme une saisie utilisateur.

Contrat indicatif : `useUnsavedChanges({scopeId,label,baseline,current,pendingSave})`, `requestTransition({leavingScopes,run})`, `markSaved(scopeId,normalizedServerResult)`. Résoudre la sortie **avant** setSelected/setActivePage/onClose, pas dans le cleanup du démontage. Ne pas capturer tous les clics DOM indistinctement.

- Sans draft : comportement actuel.
- Draft présent : **Rester** par défaut ou **Quitter sans enregistrer**, avec noms des sections, sans UUID ni contenu saisi.
- Rester/annuler le garde : aucune transition, reset ou écriture ; valeurs/focus conservés.
- Abandon : scopes quittés seulement ; aucune suppression de données déjà enregistrées, autres sections/fenêtres conservées.
- Boutons Enregistrer actuels explicites ; aucun Save all générique, acceptation, publication ou finalisation par le garde.
- Save réussi : nettoyer uniquement son scope à partir de la réponse serveur ; erreur : conserver la saisie. Save en cours : attendre ou annuler la sortie, sans promettre d'annuler une écriture déjà acceptée.
- Annuler l'éditeur signifie abandon de cette édition ; différent d'annuler une navigation. Restaurer uniquement son baseline.
- Un draft masqué mais conservé dans son parent reste déclaré si la sortie de page le détruirait ; pas de prompt pour le simple masquage.

**Sections/refresh.** Baselines séparés p/admin, clause/composition, metadata/code, rapport/intervention. Fusionner les champs encore égaux à leur ancien baseline, conserver les modifiés ; ne rafraîchir que la section sauvegardée. Contrôler l'ID/version et ignorer les réponses tardives d'un autre contexte.

**Electron/workspace.** IPC limité aux métadonnées dirty/pendingSave par fenêtre, aucun contrat/code/secret/contenu binaire. Le main coordonne close/reload/quit et références détachées sans double confirmation. Le choix de workspace consulte les fenêtres **avant** dialogue et mutation du bootstrap ; annulation garde/dialogue laisse le dossier inchangé. Gardes de restauration #81 séparés, sans reprise de son code non fusionné.

Attention à la sémantique Electron : preventDefault sur will-prevent-unload **autorise** l'unload après décision explicite de quitter. Référence primaire : [Electron — will-prevent-unload](https://www.electronjs.org/docs/latest/api/web-contents#event-will-prevent-unload).

Exclure filtres/recherche/readonly/préférences/actions déjà sauvegardées immédiatement. Conserver chrono, couvertures/affectations, versions, contrats figés et règles d'enregistrement.

## 6. Petits lots recommandés

| Lot | Périmètre limité | Fichiers principaux envisagés | Critère de sortie |
| --- | --- | --- | --- |
| UX01-A | Préserver p/admin entre leurs deux enregistrements | QuoteContractPreparationPanel, tests multi-sections | R04/R05 corrigés, draft voisin conservé même si save échoue |
| UX01-B | Noyau/hook + navigation et pilotes Prospection/Devis | helpers/tests nouveaux, App, ProspectsPageV2, QuotesPage et éditeurs Devis | Sidebar/recherche/événements, changement de fiche, Escape/clic extérieur, Rester/abandon/Annuler |
| UX01-C | Cycle natif, workspace et référence détachée | main, IPC/preload/types minimaux, ProspectReferenceWindow | Close/reload/quit, deux fenêtres, save en cours, workspace annulé avant mutation |
| UX01-D | Catalogue/contrats + CRM complémentaire | Catalog/ContractLibrary/Clients/Annuaire et sous-éditeurs | Types/modules/versions, refresh croisés, autres CRUD |
| UX01-E | Projet et Bibliothèques technique/AtoumWeb | Projects/Sites/compositions/technical/reuse/library | Code/metadata, réemploi et undo/redo préservés |
| UX01-F | Opérations/temps puis documents/finance/sauvegardes | Intervention/Maintenance/Reports/Packs, Time/Timer, Documents/Billing/Expenses/Backups | Sous-lots par module ; décisions/rapport et écritures existantes conservés |

**A d'abord**, car il perd des données sans navigation ; **B pilote ensuite**, puis C. D/E/F étendent le même mécanisme progressivement et se subdivisent par module. Les fichiers envisagés restent des propositions, aucun raccord transversal réalisé.

## 7. Tests permanents prévus après validation

- Noyau sur fixtures déterministes : propre/modifié/revenu au baseline, plusieurs scopes, sauvegarde succès/échec/en cours, annulation/abandon, cycle de registration et aucun effet serveur d'un simple contrôle.
- Navigation sidebar/recherche/liens/événements ; annulation conservant cible/valeurs/focus ; abandon limité au scope ; filtres/lecture/réduction sans faux positif.
- Deux sens p/admin, clause A modifiée puis B sauvegardée, metadata/code, rapport/fiche ; erreur gardant le draft voisin, réponses tardives ignorées.
- Annuler le garde versus Annuler l'éditeur ; dialogue fichier/workspace annulé ; aucun double appel, finalisation/acceptation/publication implicite.
- Electron temporaire : close/reload/quit principal et détaché, dirty seconde fenêtre, save en cours ; comparer données et bootstrap avant/après refus de workspace.
- Tests métier existants/snapshots figés ; typecheck/suite complète après correction ; harness Chromium avec vrais IPC sur fixtures, trois thèmes pour les confirmations, sans refonte visuelle.
- Aucune dépendance à Validation-MSI ou à son SHA/comptage ; fermeture/nettoyage des fixtures après succès/échec.

## 8. Inventaire complet des fichiers avec contrôles raccordés

**E** = saisies/choix métier candidats à raccorder à leur propriétaire (inspection, pas perte UI affirmée pour chaque contrôle) ; **I** = actions immédiates/préférences, pas de draft autonome ; **L** = lecture/filtres ; **T** = banc technique. Les helpers contrôlés se déclarent au niveau de leur propriétaire pour éviter un double scope. Les 58 fichiers comprennent 51 candidats E et 7 exclusions I/L/T ; certains mélangent plusieurs usages.

| Fichier / première déclaration native | Contrôles statiques | Classe | Remarque |
| --- | ---: | --- | --- |
| [analytics/StatisticsPage.tsx:220](../src/renderer/analytics/StatisticsPage.tsx#L220) | 2 | L | Périodes/filtres |
| [App.tsx:429](../src/renderer/App.tsx#L429) | 1 | I | Préférences immédiates ; navigation à garder |
| [backups/BusinessBackupsPage.tsx:219](../src/renderer/backups/BusinessBackupsPage.tsx#L219) | 13 | E | Drafts/choix métier selon état du dossier |
| [billing/BillingPage.tsx:222](../src/renderer/billing/BillingPage.tsx#L222) | 6 | E | Drafts/choix métier selon état du dossier |
| [bridge/BridgeSitesPage.tsx:513](../src/renderer/bridge/BridgeSitesPage.tsx#L513) | 5 | E | Drafts/choix métier selon état du dossier |
| [commercial/CatalogContractPanel.tsx:12](../src/renderer/commercial/CatalogContractPanel.tsx#L12) | 2 | E | Drafts/choix métier selon état du dossier |
| [commercial/CatalogPage.tsx:469](../src/renderer/commercial/CatalogPage.tsx#L469) | 36 | E | Drafts/choix métier selon état du dossier |
| [commercial/ContractLibraryPage.tsx:57](../src/renderer/commercial/ContractLibraryPage.tsx#L57) | 19 | E | Drafts/choix métier selon état du dossier |
| [commercial/ContractTermsBuilder.tsx:322](../src/renderer/commercial/ContractTermsBuilder.tsx#L322) | 14 | E | Drafts/choix métier selon état du dossier |
| [commercial/QuoteAbbyPanel.tsx:8](../src/renderer/commercial/QuoteAbbyPanel.tsx#L8) | 1 | L | Texte Abby readonly |
| [commercial/QuoteContractDocumentPanel.tsx:70](../src/renderer/commercial/QuoteContractDocumentPanel.tsx#L70) | 1 | E | Drafts/choix métier selon état du dossier |
| [commercial/QuoteContractPreparationPanel.tsx:10](../src/renderer/commercial/QuoteContractPreparationPanel.tsx#L10) | 17 | E | Drafts/choix métier selon état du dossier |
| [commercial/QuoteLineEditor.tsx:106](../src/renderer/commercial/QuoteLineEditor.tsx#L106) | 8 | E | Drafts/choix métier selon état du dossier |
| [commercial/QuoteLineParametersPanel.tsx:22](../src/renderer/commercial/QuoteLineParametersPanel.tsx#L22) | 14 | E | Drafts/choix métier selon état du dossier |
| [commercial/QuoteOperationalSalesPanel.tsx:22](../src/renderer/commercial/QuoteOperationalSalesPanel.tsx#L22) | 4 | E | Drafts/choix métier selon état du dossier |
| [commercial/QuotesPage.tsx:260](../src/renderer/commercial/QuotesPage.tsx#L260) | 19 | E | Drafts/choix métier selon état du dossier |
| [crm/ClientDocumentsPanel.tsx:11](../src/renderer/crm/ClientDocumentsPanel.tsx#L11) | 2 | E | Drafts/choix métier selon état du dossier |
| [crm/ClientsPage.tsx:531](../src/renderer/crm/ClientsPage.tsx#L531) | 26 | E | Drafts/choix métier selon état du dossier |
| [crm/ContactMethodsPanel.tsx:124](../src/renderer/crm/ContactMethodsPanel.tsx#L124) | 4 | E | Drafts/choix métier selon état du dossier |
| [crm/GlobalSearch.tsx:48](../src/renderer/crm/GlobalSearch.tsx#L48) | 1 | L | Recherche |
| [crm/ProspectActionsPanel.tsx:295](../src/renderer/crm/ProspectActionsPanel.tsx#L295) | 20 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectDecisionEditor.tsx:9](../src/renderer/crm/ProspectDecisionEditor.tsx#L9) | 3 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectIdentityPanel.tsx:252](../src/renderer/crm/ProspectIdentityPanel.tsx#L252) | 20 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectLinkedContactsPanel.tsx:73](../src/renderer/crm/ProspectLinkedContactsPanel.tsx#L73) | 5 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectNeedsPanel.tsx:84](../src/renderer/crm/ProspectNeedsPanel.tsx#L84) | 23 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectQualificationPanelV2.tsx:233](../src/renderer/crm/ProspectQualificationPanelV2.tsx#L233) | 11 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectQuotePanel.tsx:248](../src/renderer/crm/ProspectQuotePanel.tsx#L248) | 12 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectResearchPanel.tsx:222](../src/renderer/crm/ProspectResearchPanel.tsx#L222) | 34 | E | Drafts/choix métier selon état du dossier |
| [crm/ProspectsPageV2.tsx:495](../src/renderer/crm/ProspectsPageV2.tsx#L495) | 35 | E | Drafts/choix métier selon état du dossier |
| [directory/DirectoryPage.tsx:310](../src/renderer/directory/DirectoryPage.tsx#L310) | 25 | E | Drafts/choix métier selon état du dossier |
| [documents/DocumentsPage.tsx:294](../src/renderer/documents/DocumentsPage.tsx#L294) | 17 | E | Drafts/choix métier selon état du dossier |
| [expenses/ExpensesPage.tsx:369](../src/renderer/expenses/ExpensesPage.tsx#L369) | 18 | E | Drafts/choix métier selon état du dossier |
| [operations/HourPackShortfallPanel.tsx:131](../src/renderer/operations/HourPackShortfallPanel.tsx#L131) | 4 | E | Drafts/choix métier selon état du dossier |
| [operations/HourPacksPanel.tsx:267](../src/renderer/operations/HourPacksPanel.tsx#L267) | 15 | E | Drafts/choix métier selon état du dossier |
| [operations/InterventionBackupPanel.tsx:126](../src/renderer/operations/InterventionBackupPanel.tsx#L126) | 1 | E | Drafts/choix métier selon état du dossier |
| [operations/MaintenanceOveragePanel.tsx:114](../src/renderer/operations/MaintenanceOveragePanel.tsx#L114) | 3 | E | Drafts/choix métier selon état du dossier |
| [operations/MaintenancePanel.tsx:257](../src/renderer/operations/MaintenancePanel.tsx#L257) | 12 | E | Drafts/choix métier selon état du dossier |
| [operations/MaintenanceReportPanel.tsx:60](../src/renderer/operations/MaintenanceReportPanel.tsx#L60) | 3 | E | Drafts/choix métier selon état du dossier |
| [operations/OperationsAlertsPanel.tsx:213](../src/renderer/operations/OperationsAlertsPanel.tsx#L213) | 8 | E | Drafts/choix métier selon état du dossier |
| [operations/OperationsPage.tsx:404](../src/renderer/operations/OperationsPage.tsx#L404) | 31 | E | Drafts/choix métier selon état du dossier |
| [projects/ContributionTargetChoices.tsx:18](../src/renderer/projects/ContributionTargetChoices.tsx#L18) | 3 | E | Drafts/choix métier selon état du dossier |
| [projects/OperationalActionDetails.tsx:13](../src/renderer/projects/OperationalActionDetails.tsx#L13) | 1 | I | Catégorie immédiatement sauvegardée |
| [projects/ProjectCompositionItemSettings.tsx:370](../src/renderer/projects/ProjectCompositionItemSettings.tsx#L370) | 13 | E | Drafts/choix métier selon état du dossier |
| [projects/ProjectPageCompositionPanel.tsx:530](../src/renderer/projects/ProjectPageCompositionPanel.tsx#L530) | 12 | E | Drafts/choix métier selon état du dossier |
| [projects/ProjectResourcesTab.tsx:130](../src/renderer/projects/ProjectResourcesTab.tsx#L130) | 5 | E | Drafts/choix métier selon état du dossier |
| [projects/ProjectReusePreparationPanel.tsx:94](../src/renderer/projects/ProjectReusePreparationPanel.tsx#L94) | 13 | E | Drafts/choix métier selon état du dossier |
| [projects/ProjectSitesTab.tsx:421](../src/renderer/projects/ProjectSitesTab.tsx#L421) | 10 | E | Drafts/choix métier selon état du dossier |
| [projects/ProjectsPage.tsx:667](../src/renderer/projects/ProjectsPage.tsx#L667) | 40 | E | Drafts/choix métier selon état du dossier |
| [projects/ProjectTechnicalLibraryTab.tsx:233](../src/renderer/projects/ProjectTechnicalLibraryTab.tsx#L233) | 14 | E | Drafts/choix métier selon état du dossier |
| [projects/recipe/OperationalRecipePage.tsx:47](../src/renderer/projects/recipe/OperationalRecipePage.tsx#L47) | 7 | T | Simulation technique isolée |
| [referentials/AtoumWebLibraryPage.tsx:1185](../src/renderer/referentials/AtoumWebLibraryPage.tsx#L1185) | 40 | E | Drafts/choix métier selon état du dossier |
| [statistics/StatisticsPage.tsx:274](../src/renderer/statistics/StatisticsPage.tsx#L274) | 1 | L | Filtres |
| [time/GlobalTimer.tsx:460](../src/renderer/time/GlobalTimer.tsx#L460) | 8 | E | Drafts/choix métier selon état du dossier |
| [time/TimePage.tsx:231](../src/renderer/time/TimePage.tsx#L231) | 19 | E | Drafts/choix métier selon état du dossier |
| [workflow/DossierPanel.tsx:40](../src/renderer/workflow/DossierPanel.tsx#L40) | 6 | E | Drafts/choix métier selon état du dossier |
| [workflow/InterventionFields.tsx:11](../src/renderer/workflow/InterventionFields.tsx#L11) | 15 | E | Drafts/choix métier selon état du dossier |
| [workflow/QuoteDraftLines.tsx:5](../src/renderer/workflow/QuoteDraftLines.tsx#L5) | 4 | E | Drafts/choix métier selon état du dossier |
| [workflow/QuoteWorkflow.tsx:30](../src/renderer/workflow/QuoteWorkflow.tsx#L30) | 3 | E | Drafts/choix métier selon état du dossier |

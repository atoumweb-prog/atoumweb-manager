# EC04 - audit des ecritures, Windows MSI, 18 octobre 2026

## Methode et limites

`node scripts/audit-ec04-writers.cjs` parcourt exclusivement les sources, sans importer les services ni ouvrir de base. 170 fichiers main inventories, 1032 appels candidats dans80 fichiers (917 SQLite,115 fichiers). Ce sont des sites candidats : open/close et certains appels de lecture sont sur-inclus ; ce n'est ni1032 operations executees, ni un certificat de couverture. L'inventaire JSON local contient fichier, ligne, methode et SHA256 source.

Une analyse transitive experimentale des methodes de classe a isole trois appels IPC non encadres : QuoteContractPreparationService.get/openLinked -> ClientDocumentService.fingerprint -> UPDATE client_documents.sha256 si l'empreinte historique est absente. Les trois frontieres sont maintenant protegees. Cette analyse ne constitue pas une preuve de graphe d'appels complet (callbacks dynamiques et code tiers notamment). Regression native : lecture via vrai IPC pendant la suspension, empreinte encore NULL ; apres release, empreinte remplie, contrat non resynchronise.

Autre voie : ipcMain.on settings:shell-visual est synchrone. set/remove utilisent desormais le meme WorkspaceMutationGate avec une section synchrone qui refuse avant toute ecriture pendant drain/pause. get reste autorise et pur ; aucun succes/broadcast apres refus. Pas de nouvelle garde UX-01 ni attente synchrone bloquant le thread principal.

## Voies hors IPC identifiees

| Voie | Effets | Couverture reelle / limite |
| --- | --- | --- |
| main.bootstrap -> applyPendingDatabaseRestore | Remplacement SQLite et sauvegarde de secours | Avant initialisation, aucune capture exposee ; tests restauration35 existants. Pas d'adaptateur global runtime. |
| DatabaseService.initialize | PRAGMA, migrations, tracking demo, defaults, reconstruction FTS, sauvegarde quotidienne | Avant creation de la barriere et ouverture des fenetres. Ne pas rendre le coordinateur accessible pendant cette phase. |
| main / registerGuardedShutdown -> DatabaseService.close | Checkpoint/fermeture WAL | Non encadre par le gate ; une future capture active devra retarder l'arret propre. Rien n'est active actuellement. |
| Services directs, NodeSqliteAdapter.run/exec, helper FS | SQL et fichiers synchrones/asynchrones | Couverts transitivement UNIQUEMENT lorsque le point d'entree prend et attend le permis. Pas de protection universelle a l'interieur des services. |
| Importeurs/exporteurs, Word/PDF, ressources, Bibliotheque, Bridge | Copie/creation/relocalisation et metadonnees | Frontieres IPC auditees ; selection des fichiers et ouverture dans logiciel tiers hors permis. Appels directs/outils autonomes restent a coordonner. |
| Chronometre | Renderer -> IPC heartbeat, pause, reprise, stop et corrections | Registres partages existants. Recette native : operation longue drainee et heartbeat en attente, reprise sans doublon. Aucun scheduler mutateur main autonome trouve hors lancement/quitter. |
| Registres des sauvegardes/ressources/technical-assets | Lectures pouvant mettre a jour missing_at / creer dossiers | Corrections historiques conservees ; les utilisations directes de ces services restent cooperatives. |
| Preferences synchrones | UPDATE settings, diffusion interfenetres | Trou couvert par runSynchronousMutation ; refus explicite pendant pause, pas de diffusion trompeuse. |
| EC04 diagnostics SQLite | Les connexions readOnly WAL pouvaient creer des sidecars | Snapshot prive normalise DELETE avant empreinte ; les diagnostics refusent un header WAL avant SQLite. Source active jamais normalisee. Liens physiques/symboliques refuses avant conversion. |
| scripts CLI, application tierce, deuxieme processus, editeur externe | SQL/fichiers en dehors du processus principal | NON couverts par AsyncLocalStorage/gate local. Aucun verrou interprocessus, verrou FS universel ou garantie contre logiciel externe n'est ajoute. |
| Copies B1 et relocalisation offline | Ecritures des nouveaux dossiers et copies privees | Coordinateur utilise seulement dans les recettes ; marqueurs/refus des destinations et verification finale. Aucune UI/IPC capture connectee. |

## Verdict de couverture

Audit termine au perimetre des sources et appels runtime identifies, mais **pause globale non certifiee**. Le coordinateur demeure NON expose. Ne pas presenter une barriere IPC, un inventaire AST ou la coherence d'une fixture comme une garantie universelle. Avant activation utilisateur : unifier les points d'entree directs, initialisation/arret, operations hors processus, et politique des fichiers ouverts par Word/editeurs externes ; valider le protocole avec les vraies fenetres. Ce sont des reserves de production, pas une raison d'activer une sauvegarde incomplete.

## Index des sites candidats (compteurs statiques)

| Fichier | Sites candidats |
| --- | ---: |
| src/main/backups/BusinessBackupAlertService.ts | 4 |
| src/main/backups/BusinessBackupService.ts | 16 |
| src/main/backups/WorkspaceFileInventory.ts | 1 |
| src/main/backups/WorkspaceFileReferenceAudit.ts | 1 |
| src/main/backups/WorkspacePortabilityPreflight.ts | 1 |
| src/main/backups/WorkspacePortableArchive.ts | 16 |
| src/main/backups/WorkspaceRelocatedCopy.ts | 16 |
| src/main/backups/WorkspaceRelocationPlan.ts | 1 |
| src/main/backups/WorkspaceSnapshotDatabase.ts | 1 |
| src/main/billing/BillingHandoffService.ts | 24 |
| src/main/bridge/BridgeNodeMatchDecisions.ts | 15 |
| src/main/bridge/BridgeSnapshotService.ts | 23 |
| src/main/commercial/CatalogCategoryService.ts | 10 |
| src/main/commercial/CatalogImportService.ts | 8 |
| src/main/commercial/CatalogRecommendationsService.ts | 6 |
| src/main/commercial/CatalogService.ts | 41 |
| src/main/commercial/CommercialRulesService.ts | 2 |
| src/main/commercial/ContractLibraryImportService.ts | 8 |
| src/main/commercial/ContractSectionReviewService.ts | 2 |
| src/main/commercial/ContractTermsService.ts | 54 |
| src/main/commercial/ContractTypeService.ts | 17 |
| src/main/commercial/QuoteContractPreparationService.ts | 10 |
| src/main/commercial/QuoteService.ts | 61 |
| src/main/commercial/quotePdf.ts | 2 |
| src/main/commercial/wordDraftPdf.ts | 1 |
| src/main/crm/ActionService.ts | 8 |
| src/main/crm/ClientContactService.ts | 15 |
| src/main/crm/ClientDocumentService.ts | 20 |
| src/main/crm/CrmIdentityAssetService.ts | 15 |
| src/main/crm/CrmService.ts | 41 |
| src/main/database/DatabaseService.ts | 10 |
| src/main/database/NodeSqliteAdapter.ts | 3 |
| src/main/database/migrations.ts | 9 |
| src/main/expenses/ExpenseService.ts | 31 |
| src/main/expenses/receiptPreviewCleanup.ts | 2 |
| src/main/ipc.ts | 3 |
| src/main/main.ts | 1 |
| src/main/operations/HourPackService.ts | 21 |
| src/main/operations/HourPackShortfallService.ts | 7 |
| src/main/operations/InterventionCompletionService.ts | 3 |
| src/main/operations/MaintenanceOverageService.ts | 3 |
| src/main/operations/MaintenanceReportService.ts | 2 |
| src/main/operations/MaintenanceService.ts | 18 |
| src/main/operations/OperationalSalesService.ts | 13 |
| src/main/operations/OperationalSalesTargetService.ts | 7 |
| src/main/operations/OperationsService.ts | 16 |
| src/main/projects/OperationalCommercialPreparationService.ts | 9 |
| src/main/projects/OperationalConfigurationService.ts | 3 |
| src/main/projects/OperationalRecipeService.ts | 8 |
| src/main/projects/OperationalReferenceService.ts | 15 |
| src/main/projects/ProjectBlueprintCompositionService.ts | 14 |
| src/main/projects/ProjectCommercialService.ts | 42 |
| src/main/projects/ProjectContributionTargetService.ts | 11 |
| src/main/projects/ProjectNodeArrangementService.ts | 6 |
| src/main/projects/ProjectOperationalService.ts | 2 |
| src/main/projects/ProjectResourceService.ts | 12 |
| src/main/projects/ProjectReuseExportService.ts | 8 |
| src/main/projects/ProjectService.ts | 65 |
| src/main/projects/ProjectSiteService.ts | 13 |
| src/main/projects/ProjectTechnicalLibraryService.ts | 21 |
| src/main/projects/recipe/mariageHistoireRecipeStructure.ts | 5 |
| src/main/referentials/AtoumWebCompositionPackageService.ts | 8 |
| src/main/referentials/AtoumWebCompositionService.ts | 31 |
| src/main/referentials/AtoumWebOccurrenceReturnService.ts | 30 |
| src/main/referentials/AtoumWebPackageService.ts | 9 |
| src/main/referentials/AtoumWebTechnicalAssetService.ts | 7 |
| src/main/referentials/AtoumWebTechnicalLibraryService.ts | 35 |
| src/main/referentials/ReusePreparationService.ts | 14 |
| src/main/referentials/ZipArchive.ts | 1 |
| src/main/restore.ts | 14 |
| src/main/testSupport/contributionFixture.ts | 3 |
| src/main/testSupport/operationalRecipeFixture.ts | 4 |
| src/main/testSupport/projectCompositionFixture.ts | 1 |
| src/main/testSupport/projectOperationalFixture.ts | 3 |
| src/main/time/TimeCorrectionService.ts | 1 |
| src/main/time/TimeService.ts | 23 |
| src/main/time/TimeSwitchService.ts | 6 |
| src/main/workflow/DemoService.ts | 10 |
| src/main/workflow/WorkflowService.ts | 6 |
| src/main/workspace.ts | 3 |

# 05 — Registre des écarts

Code audité : **eb252d5cbd0e95137eafa2b4759fcbcfd7263eda**. Les IDs UX-01 à UX-20 reprennent le bilan communiqué à AtoumWeb. **Aucun écart n’est corrigé ou arbitré par cette publication.**

## Légende et priorité

A conforme/documenté ; B implémenté insuffisamment documenté ; C partiel/incohérent ; D absent/inactif ; E à vérifier. F-CODE signifie inspection du chemin ; F-TEST une exécution ; HYPOTHÈSE ne vaut pas défaut reproduit. Criticité élevée/critique d’un E décrit un risque potentiel, pas une perte constatée.

| ID | Classe | Criticité | Statut de preuve | Résumé |
|---|---|---|---|---|
| UX-01 | C | Élevée | F-CODE ; visuel non concluant | Saisie non enregistrée non protégée |
| UX-02 | C | Élevée | F-TEST mémoire | Maintenance manuelle calendaire |
| UX-03 | C | Élevée | F-TEST mémoire | Terminaison sur pack laisse état intermédiaire |
| UX-04 | C | Élevée | F-CODE | Bilan global de finalisation incomplet |
| UX-05 | C | Élevée | F-TEST mémoire + F-CODE UI | Offre draft sélectionnable au besoin, devis refusé |
| UX-06 | C | Moyenne | F-CODE | Valider signifie accepter contractuellement |
| UX-07 | C | Moyenne | F-CODE ; visuel non concluant | Recherche Catalogue ne cible pas la fiche |
| UX-08 | C | Moyenne | F-CODE ; UI à recetter | Famille du besoin peut se réinitialiser |
| UX-09 | C | Moyenne | F-CODE | Pipeline Statistiques/Prospection incohérent |
| UX-10 | C | Moyenne | F-CODE/F-DOC | Dialogues système encore présents |
| UX-11 | C | Moyenne | F-TEST Phase 7 / F-CODE réemploi | Bancs UI attendent 1–65 |
| UX-12 | C | Moyenne | F-CODE / F-TEST service | Création sauvegarde métier sans garde de double soumission UI |
| UX-13 | C | Élevée | F-CODE | Suppression accès Projet sans confirmation identifiée |
| UX-14 | D | Élevée | F-CODE | Sources facturation déclarées non raccordées automatiquement |
| UX-15 | D | Moyenne | F-CODE/F-DOC | Exports complets/statistiques non identifiés |
| UX-16 | E | Critique potentielle | HYPOTHÈSE issue du code | Workspace de restauration différée non épinglé |
| UX-17 | E | Moyenne | À vérifier en deux fenêtres | Actualisation référence détachée |
| UX-18 | E | Moyenne | À vérifier | Accessibilité complète non démontrée |
| UX-19 | E | Élevée | HYPOTHÈSE issue du code | Promotion globale/fichiers : panne composite |
| UX-20 | B | Faible | F-DOC | Traçabilité UX dispersée |

Les trois expériences mémoire confirment des comportements précis, pas leur fréquence d’apparition sur tous les dossiers. **Aucune corruption ou perte de données de Validation-MSI n’a été constatée pendant l’audit.**

## UX-01 — Saisies non enregistrees

- **Fait code :** App remplace conditionnellement les composants de page ; aucun mécanisme global beforeunload/dirty guard n’a été trouvé. La préparation garde des valeurs locales. Son perform(action) exécute aussi reload(), qui remplace les paramètres par les valeurs relues après une autre action.
- **Vérification proposée :** saisir un contexte sans enregistrer ; changer de module puis revenir. Autre cas : modifier les paramètres, puis enregistrer les informations administratives communes ou ouvrir une preuve via le chemin perform. Examiner conservation et avertissement.
- **Limite :** sonde UI adaptée expirée ; aucune reproduction visuelle réussie revendiquée. Le chemin de réinitialisation est vérifié dans le code.
- **Sources :** [navigate / rendu conditionnel](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/App.tsx), [reload / perform](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuoteContractPreparationPanel.tsx), [unsaved local des clauses](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/ContractTermsBuilder.tsx).
- **Couverture :** les tests des paramètres et les copies de clauses ne prouvent pas la protection de tous les autres brouillons locaux.
- **Proposition non validée :** expliciter les domaines de sauvegarde et recetter protection d’abandon/rechargement.

## UX-02 — Maintenance manuelle calendaire

- **Fait exécuté :** création d’un plan mensuel et d’une souscription en mémoire, départ 2026-10-15 ; ensurePeriod au 2026-11-15 retourne periodAlignment=calendar et 2026-11-01 → 2026-11-30.
- **Règle à préserver :** pour nouvelles ventes, cycles date à date depuis démarrage réel ; exemple attendu 15/11 → 14/12. Historique calendaire non migré silencieusement.
- **Sources :** [createSubscription](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/operations/MaintenancePanel.tsx), [createSubscription / periodBounds](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/MaintenanceService.ts), [period_alignment lors de la vente](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/OperationalSalesService.ts).
- **Tests :** [maintenance](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/MaintenanceService.test.ts), [ventes](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/OperationalSalesService.test.ts) ; deux chemins individuellement testés ne prouvent pas cohérence de la doctrine globale.
- **Arbitrage :** aligner les nouvelles créations manuelles ou les identifier explicitement comme parcours historique. Aucune migration décidée ici.

## UX-03 — Terminaison partielle sur pack

- **Fait exécuté :** pack de 3 600 s ; intervention in_progress, sans temps terminé. complete() échoue avec « Aucun temps terminé à débiter pour cette intervention. » mais le statut est désormais to_validate. Solde du pack : 3 600 s, FK correctes.
- **Chemin UI :** actualisation et mise à jour de la fiche après succès uniquement ; l’erreur peut donc laisser affichage et backend dans deux états différents.
- **Sources :** [complete](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/InterventionCompletionService.ts), [debitIntervention](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/HourPackService.ts), [changeInterventionStatus](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/operations/OperationsPage.tsx).
- **Test identifié :** [complétion](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/InterventionCompletionService.test.ts). Le scénario précis avec statut initial in_progress a été exploré en mémoire, sans ajout de test permanent.
- **Proposition :** définir atomicité attendue ou retour explicite de l’état intermédiaire ; pas de correction dans ce lot.

## UX-04 — Bilan de finalisation incomplet

- **Fait code :** QuoteFinalizationPanel affiche quotePreparation.get().issues. QuoteService.finalize vérifie en plus CommercialRulesService.issues, OperationalSalesService.issues et le gel des clauses. Le message « permet la finalisation technique » est donc plus large que ses contrôles.
- **Vérification :** préparation contractuelle complète avec une prestation nécessitant encore périmètre/estimation/plan, parent compatible ou démarrage du service. Comparer bilan et refus serveur.
- **Sources :** [bilan](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuoteFinalizationPanel.tsx), [finalize](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/commercial/QuoteService.ts), [issues](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/commercial/CommercialRulesService.ts), [issues](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/OperationalSalesService.ts).
- **Limite :** règles serveur testées ; reproduction du panneau dans tous ces cas à compléter.
- **Proposition :** distinguer complétude contractuelle et bilan complet, ou agréger les contrôles sans affaiblir les gardes.

## UX-05 — Brouillon Catalogue retenu au besoin

- **Fait exécuté :** offre active avec seule version draft ; le filtre Boolean(currentVersion) la retient ; createWithLines refuse « Seule une version publiée d’une prestation active peut être ajoutée au devis. » ; zéro devis résiduel et FK/intégrité correctes.
- **Fait UI :** le contrôle avant devis examine besoin, résumé, budget/calendrier et décisionnaire, mais pas la publication de cette version.
- **Sources :** [load](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectNeedsPanel.tsx), [blockers / createDraftAndOpen](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectPreQuoteReview.tsx), [createWithLines / addCatalogLine](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/commercial/QuoteService.ts).
- **Proposition :** arbitrer si l’identification peut retenir un draft ; dans tous les cas, afficher le prérequis de publication avant de présenter le devis comme prêt. Ne pas publier implicitement.

## UX-06 — Valider et acceptation

- **Fait code :** boutons « Valider » de liste/fiche appellent accept ; confirmation mentionne Abby/signature, puis gardes serveur/proof et effets Client/Projet/opérations.
- **Source :** [validateQuoteFromList / transition](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuotesPage.tsx), [accept](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/commercial/QuoteService.ts).
- **Couverture :** acceptation/rollback/idempotence testés ; compréhension du libellé à recetter.
- **Proposition :** vocabulaire distinguant enregistrement, contrôle interne, finalisation et acceptation reçue. Aucun changement de logique contractuelle proposé automatiquement.

## UX-07 — Recherche Catalogue sans cible

- **Fait code :** le case catalog d’openSearchResult ne transmet pas l’identifiant à catalogTarget ; le parcours dédié atoumweb:open-catalog-item le fait.
- **Vérification :** chercher une prestation distincte de la dernière fiche Catalogue ouverte et choisir son résultat ; vérifier fiche ciblée.
- **Source :** [openSearchResult / événements Catalogue](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/App.tsx), [choose](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/GlobalSearch.tsx).
- **Limite :** sonde visuelle non concluante. Ne pas affirmer quel ancien item était affiché sur une session réelle.

## UX-08 — Famille réinitialisée

- **Fait code :** familles affichées par catalogueFamilyLabel ; load compare encore item.category brute à l’état category, puis peut choisir la première famille.
- **Vérification :** sélectionner une famille non première, ajouter/enregistrer une prestation, observer la sélection après load. Effet dépendant des familles disponibles.
- **Source :** [load / saveNeed](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectNeedsPanel.tsx), [catalogueFamilyLabel](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/catalogDisplay.ts).
- **Limite :** banc UI couvre les alias et onglets, pas cette sauvegarde complète.

## UX-09 — Pipeline Statistiques

- **Fait code :** new est nommé « Besoin à identifier » et qualifying/need_identified regroupés « À qualifier ». Prospection et décisions datées distinguent les étapes autrement.
- **Source :** [PIPELINE](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/statistics/StatisticsPage.tsx), [pipeline](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectsPageV2.tsx), [décisions du parcours](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/DECISIONS_RECETTE_COMMERCIALE.md).
- **Proposition :** vocabulaire/mapping explicitement partagé après arbitrage, sans modifier des statuts stockés pour un simple libellé.

## UX-10 — Dialogues système

- **Fait code :** window.confirm dans qualification/Prospection/Devis ; window.prompt dans prolongation de validité et édition de documents depuis Client.
- **Source :** [confirmation](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectQualificationPanelV2.tsx), [extendValidity](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuotesPage.tsx), [edit](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ClientDocumentsPanel.tsx).
- **Document :** [récapitulatif intégré et formulaires](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/DECISIONS_RECETTE_COMMERCIALE.md). La confirmation OS de suppression/restauration est un autre domaine, à distinguer de la saisie métier.

## UX-11 — Attente historique de migrations

- **Fait exécuté :** le banc Phase 7 échoue avant UI sur « migrations 1–65 ». Le registre actuel construit 1–66.
- **Fait code :** le banc réemploi guidé conserve aussi une condition exactement 1–65 ; il n’a pas été relancé ici pour prouver ses interactions actuelles.
- **Sources :** [banc Phase 7](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/scripts/check-phase7-realignment-ui.cjs#L32), [banc réemploi](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/scripts/check-guided-reuse-ui.cjs#L80), [registre](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/database/migrations.ts).
- **Conséquence :** anciens 35/35 ou 55/55 restent historiques, pas certification rejouée de ce HEAD.
- **Proposition :** cohérence des fixtures avec le registre ; tests historiques sur fixtures historiques explicites. Ne pas remplacer un oracle de base de développement par un autre chiffre figé.

## UX-12 — Double soumission sauvegarde métier

- **Fait code :** createRecord ne dispose pas d’un busy/inFlight équivalent à d’autres handlers ; bouton de création sans cette garde.
- **Fait service exécuté :** deux appels avec les mêmes entrées créent deux références différentes en mémoire. Cela ne prouve pas un double clic réel ni une obligation d’unicité du libellé.
- **Sources :** [createRecord](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/backups/BusinessBackupsPage.tsx), [create](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/backups/BusinessBackupService.ts).
- **Proposition :** recetter double clic/latence puis distinguer répétition involontaire et deuxième enregistrement volontaire.

## UX-13 — Suppression d’accès Projet

- **Fait code :** le bouton appelle removeSecret, l’IPC appelle removeProjectSecret, qui exécute DELETE. Aucune confirmation ou restauration propre à ce chemin identifiée.
- **Sources :** [ProjectSecretsPanel / removeSecret](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/projects/ProjectsPage.tsx), [projects:secrets:remove](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/ipc.ts), [removeProjectSecret](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/projects/ProjectService.ts#L682).
- **Limite :** aucun secret réel lu, révélé ou supprimé ; parcours visuel non exécuté.
- **Proposition :** décider la confirmation/traçabilité adéquate, sans publier de valeur secrète ni modifier le stockage chiffré.

## UX-14 — Facturation partielle

- **Fait code :** source types quote_deposit/project_balance/subscription déclarés ; aucune création automatique correspondante identifiée dans les services examinés. Intervention, pack, manque de crédit et dépassement disposent de chemins identifiés.
- **Sources :** [BILLING_ITEM_SOURCE_TYPES](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/shared/billing.ts), [méthodes ensure](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/billing/BillingHandoffService.ts), [création pack et facturation](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/operationsIpc.ts), [objectif Finance](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/PHASE_5_ADMIN_FINANCE.md).
- **Limite :** la présence d’une valeur enum ou d’un filtre ne prouve pas la création de la donnée. Ne pas prétendre qu’Abby est connecté ou qu’un paiement réel est enregistré.
- **Arbitrage :** périmètre de suivi financier à inclure en UX V2, distinct du connecteur Abby éventuel.

## UX-15 — Exports annoncés non identifiés

- **Fait doc :** Phase 7 prévoit export complet des données et exports CSV/Excel/PDF.
- **Fait code :** aucune commande correspondante identifiée dans SettingsPage/Analytics actuels. Une sauvegarde SQLite et des exports techniques ne valent pas cet export complet.
- **Sources :** [programme Phase 7](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/PHASE_7_ANALYTICS_RELEASE.md), [SettingsPage](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/App.tsx), [AnalyticsApi](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/shared/analytics.ts).
- **Statut :** limite de livraison/programme, pas panne d’un bouton existant ; aucune décision de développement dans cet audit.

## UX-16 — Workspace de restauration différée

- **Fait code :** marqueur avec sourcePath/requestedAt, sans destination ; application de la restauration au workspace reçu au démarrage. Copie de sécurité prévue avant remplacement.
- **Scénario à vérifier :** programmer restauration dans workspace A, choisir B avant redémarrage, vérifier destination. Uniquement sur fixtures isolées, jamais dossiers utilisateurs.
- **Sources :** [PendingRestore / scheduleDatabaseRestore / applyPendingDatabaseRestore](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/restore.ts), [workspace:choose / backups:restore](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/ipc.ts).
- **Statut E :** risque de mauvaise cible issu du code ; pas de remplacement reproduit, pas de perte réelle constatée. Criticité potentielle critique, récupérabilité par copie de sécurité à examiner.

## UX-17 — Référence détachée

- **Fait code :** BrowserWindow indépendante ; mise à jour et événements locaux. Aucune diffusion interfenêtres identifiée dans les chemins examinés.
- **Scénario :** garder fiche principale ouverte, modifier identité dans la fenêtre détachée, constater actualisation ou nécessité de refresh/retour.
- **Sources :** [openProspectReferenceWindow](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/main.ts), [fenêtre](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectReferenceWindow.tsx), [listener atoumweb:changed](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/ProspectsPageV2.tsx), [API](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/preload/preload.ts).
- **Statut E :** test à deux fenêtres non exécuté ; éviter affirmation de délai exact ou d’état visible dans une session réelle.

## UX-18 — Accessibilité et dimensions

- **Fait code :** boutons natifs, labels, certains ARIA, Échap et focus existent ; mécanismes de dialogues/onglets variables. Pas de composant global de focus trap identifié.
- **À vérifier :** ordre Tab, rétention/retour du focus en modale, navigation clavier des onglets, contrastes, densités et petites fenêtres. Les thèmes testés sur échantillons ne valent pas certification accessibilité.
- **Sources :** [clavier recherche](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/crm/GlobalSearch.tsx), [dialogue](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/commercial/QuoteClientPreview.tsx), [dialogues chrono](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/time/GlobalTimer.tsx), [styles](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/ui-consistency-v2.css).

## UX-19 — Promotion et fichiers

- **Fait code :** création de la brique puis imports de fichiers/attachments dans createGlobal ; ensemble composite SQL/fichiers à examiner sous panne.
- **Hypothèse :** un échec tardif peut rendre ambiguë la reprise de création ; aucune panne physique injectée dans cet audit, aucune brique réelle abîmée.
- **Sources :** [createGlobal](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/referentials/ReusePreparationService.ts), [imports](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/referentials/AtoumWebTechnicalAssetService.ts), [tests existants](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/referentials/ReusePreparationService.test.ts).
- **Proposition :** essais isolés de permissions/fichier disparu et politique de reprise, pas refonte silencieuse.

## UX-20 — Traçabilité dispersée

- **Fait documentaire :** quatre documents CRM historiques, journaux et bilans de lots portent des règles ; pas de registre UX global normatif action/état/source/test couvrant le Manager actuel.
- **Source :** [UI historique](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/CRM_UI_INTERACTIONS.md), [workflow historique](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/CRM_WORKFLOW_MODEL.md), [matrices historiques](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/docs/CRM_TRANSITION_MATRIX.md), [journal courant](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/PROJECT_STATUS.md).
- **Cette publication :** centralise l’état des lieux, mais ne transforme pas les constats en règles UX V2 validées. Le travail individuel des interactions reste à poursuivre.

## Comportements conformes à conserver

Sur le périmètre examiné : snapshots contractuels historiques ; achats optionnels explicites ; même Projet prévisionnel puis figé ; conflits travaillés soumis à décision ; chrono unique/gardes de contexte ; actions et références vendues conservées sur cycles opérationnels. Sources/tests dans [07](07-REGLES-METIER-A-PRESERVER.md) et [08](08-TESTS-ET-COUVERTURE.md).

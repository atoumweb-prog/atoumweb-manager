> Actualisation15/10/2026 : le contenu ci-dessous est le référentiel historique, conservé intégralement. Les autorisations et états Git qu’il décrit au09/10 ne sont plus l’état courant. La mission utilisateur du15/10 autorise la convergence et les fusions04–10 après contrôles verts ; PROJECT_STATUS et les PR de convergence portent les preuves actuelles. Les1069 scénarios restent des exigences à tracer, pas un total de tests exécutés.

# Consolidation transversale UX/UI V2 — 10 lots

**État de référence : 09/10/2026, après retour local Codex MSI sur #81.** Ce document est la **porte d'entrée canonique** du référentiel ; les statuts chronologiques plus anciens dans les autres fichiers ne remplacent pas l'état ci-dessous.

**Nature :** 10 lots de **spécifications** et de **recettes à exécuter**, non dix lots de développement livrés. Cette consolidation n'autorise **ni modification de code, ni run CI, ni fusion, ni restauration**.

## 1. État des branches et dépendances
| PR | État vérifié | Condition avant de s'en servir |
|---|---|---|
| **#84 CI Windows** | Fusionnée dans `main@2b3906328d237b962f053acdf25b1ebeeba1222c`; run Windows #589 vert sur `f4bc0197`, CI post-merge #628 annoncée verte | **Acquis pour le workflow**, pas recette UX V2 |
| **#81 restauration UX-03/UX-16** | GitHub : **draft, non fusionnée**, HEAD distant `5d43e16d409afdf3a93d397bc87468ba577e2051`; CI hébergée **#649 : 745/748, 3 échecs**. Codex MSI indique **correctif LOCAL `50f2b40`, non poussé**, cible 3/3 répétés, `restore.test.ts` 35/35, typecheck OK, assertions/timeouts inchangés | Publication **seulement sur ordre explicite AtoumWeb**, ensuite **nouvelle CI Windows au SHA publié** et revue avant merge |
| **#83 UX-01** | GitHub : **draft, non fusionnée**, HEAD `5b38cbe1`, mergeable **false** au dernier contrôle ; conflit connu `ipc.ts` avec #81 et reprise de `main.ts` | Recomposer après #81, préserver `scheduleDatabaseRestore` **et** garde de sortie/cleanup ; tests et CI distincts |
| **#82 UX/UI V2** | **Draft documentaire**, ouverte/non fusionnée, fondée sur un ancien HEAD `main@eb252d5c` | Une fois les dépendances stabilisées, **rebaser/revérifier** les constats, sans transformer docs en code par fusion |

Les textes de la branche #82 mentionnent parfois #84 « draft » ou « CI non lancée » : **il s'agit de relevés historiques avant les runs et la fusion**, non de l'état présent. Le nouveau chantier UI doit être relu sur le **HEAD final réel** après #81/#83 ; aucune simulation locale ne vaut fusion.

## 2. Vue d'ensemble des scénarios
| Lot | Sujet | Dossiers détaillés retenus | Scénarios prévus |
|---|---|---|---:|
| 01 | Fondations, protection des formulaires | 01A–01F | **94** |
| 02 | Navigation, recherche et Accueil | 02A–02E | **94** |
| 03 | Prospection, Clients et Annuaire | 03A–03E | **83** |
| 04 | Catalogue et offres | 04A–04F | **115** |
| 05 | Clauses, CGV et contrats du Devis | 05A–05F | **98** |
| 06 | Devis, options et Abby | 06A–06F | **109** |
| 07 | Projets, Pages, Bibliothèque et Bridge | 07A–07G **+ 07P** | **157** |
| 08 | Interventions, Maintenance et Temps | 08A–08F | **109** |
| 09 | Facturation, Dépenses et Documents | 09A–09F | **108** |
| 10 | Statistiques, Sauvegardes et Réglages | 10A–10E | **102** |
| **TOTAL** | **10 lots** | **Sous-lots détaillés, sans compter les synthèses de tête** | **1 069** |

**Méthode :** dénombrement des scénarios `R01A-..` … `R10E-..` de chaque sous-lot, 07P inclus une fois. **Aucun des 1 069 scénarios UX V2 n'a été exécuté par ces documents**. Les runs GitHub #84/#81 et les tests d'autres chantiers **ne comptent pas** comme ces recettes. Les cas répétés entre sous-lots sont **des angles de vérification**, pas 1 069 comportements indépendants ; la campagne doit les regrouper sans supprimer les preuves des invariants.

Le [Lot 02 général](LOT-02-NAVIGATION-ACCUEIL.md) contient une **ancienne synthèse 22 cas**, à ne pas additionner aux 94 cas détaillés des 02A–E.

## 3. Couverture des 17 entrées sans double système
| Domaine | Source canonique à préserver | Lots |
|---|---|---|
| Accueil | `HomeDashboard` et chrono global, raccourcis réels | 01,02,10 |
| Prospection | Contact `new` Annuaire, démarrage manuel du pipeline | 02,03,06,10 |
| Clients | Relation distincte et bon Client ID, historique devis/contrats/projets | 03,05,06,09 |
| Offres & Tarifs | Catalogue versions, options incluses/recommandées, aides | 04,05,06,07 |
| Devis | `QuoteService`, wizard six étapes, statut/révision/contrat | 05,06,07,09 |
| Projets | `ProjectCommercialService`, un Projet courant du dossier | 06,07,08 |
| Interventions & Maintenance | `OperationsService/MaintenanceService/InterventionCompletionService` | 07,08,09 |
| Gestion des temps | `TimeService/TimeSwitchService/GlobalTimer`, session unique | 07,08,10 |
| Facturation | `BillingHandoffService` et PDF Abby importé | 06,08,09,10 |
| Dépenses | `ExpenseService`, pièce et statuts déclaratifs | 09,10 |
| Documents & Contrats | `ClientDocumentService` + `ContractTermsService`, pas de copies parallèles | 05,06,09 |
| Bibliothèque AtoumWeb | Sources versionnées, copies et variantes humaines | 04,07 |
| Sites (Bridge) | Observation WordPress, Workbench-first, pas de publication implicite | 07 |
| Sauvegardes | Registre métier `BusinessBackupService` distinct de backup/restore SQLite | 07,10 |
| Annuaire | Contacts partagés, `stage=new` hors prospection | 02,03,06 |
| Statistiques | Deux calculateurs à harmoniser, définitions sans faux encaissement | 02,03,08,09,10 |
| Réglages | Trois thèmes, trois densités, aide et workspace, sécurité non désactivable | 01,02,10 |

## 4. Invariants multi-lots à préserver
- **UX-01 :** garde unique des brouillons et chemins de sortie, pas de mécanisme de confirmation concurrent.
- **E72 :** `new` reste Annuaire jusqu'à « Démarrer la prospection ». **E153 prouve que le service de création de Devis peut contourner cette règle actuellement** ; E293 peut faire apparaître les nouveaux contacts comme prospects actifs dans Statistiques.
- **Devis/contrat :** offre/option non achetée ne crée ni prix, ni CGV, ni Projet; `finalize` = prêt à envoyer, `accept` = accord Abby enregistré avec effets métier. Snapshots `frozen` même vides et `historical_missing` jamais régénérés.
- **Projet :** un Projet prévisionnel avant signature, travaux conservés; adapter le même Projet ou remplacer l'entier **seulement par service sûr à développer**.
- **Maintenance :** nouveaux cycles mensuels **date-à-date** depuis démarrage réel, indépendants du paiement annuel; quota mensuel sans report, historique `calendar` intact.
- **Intervention/temps :** un chrono global, aucun double débit; atomicité interservices de terminaison **à démontrer par injections de panne**, et non présumée.
- **Abby/documents :** PDF officiel et ses preuves archivées ≠ PDF de travail; `invoiced` ≠ `paid`, aucune vente/encaissement fictif; documents probants liés ne sont pas supprimables.
- **Bridge :** export Page V2 et Workbench Divi brouillon ≠ publication WP; version Bridge 0.8.1 pas de publication prod activée.
- **Sauvegardes :** déclarer/vérifier un emplacement ≠ sauvegarde réellement intègre; SQLite seule ≠ tout le workspace.
- **Protection des données :** **Validation-MSI jamais utilisée comme fixture** ni restauration de test, même si CI ou audit sont au vert.

## 5. Statut de maturité et usage
La documentation a été confrontée statiquement aux fichiers de code, mais **l'inventaire exhaustif contrôle JSX → callback → IPC → service → table → assertion n'est PAS terminé pour les 17 entrées**. Avant tout lot de code : relever le nouveau `main`, attribuer les IDs d'action et risques, décider les options ouvertes, rédiger tests ciblés et cas de rollback.

Lire ensuite :
- [Registre des écarts transverses](REGISTRE-ECARTS-TRANSVERSES.md)
- [Feuille de route priorisée](FEUILLE-DE-ROUTE-IMPLEMENTATION-UX-V2.md)
- [Matrice de recette/dépendances](MATRICE-RECETTE-ET-GATES-UX-V2.md)
- [Décisions par lot](DECISIONS.md) et [couverture des modules](COUVERTURE-ET-LOTS.md)

**Aucune des recommandations ne donne à Codex une autorisation implicite de lancer des CI, modifier le code, fusionner ou déployer.**

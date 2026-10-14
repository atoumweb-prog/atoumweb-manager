# Registre des écarts transverses — priorisation UX/UI V2

**Date : 09/10/2026.** Les sévérités ci-dessous sont des **priorités d'investigation/implémentation**, pas une confirmation que tous les risques décrits ont causé un incident réel. Sources : décisions [DECISIONS](DECISIONS.md), audits 01–10, code inspecté sur `main` du 09/10/2026 ; recontrôler HEAD/IPC/DB avant toute correction.

## 1. Critères de priorité
- **P0 — garde avant évolution sensible** : risque de perte de données/preuves, effets métier non voulus, intégrité restauration/acceptation. Des tests reproductibles peuvent être nécessaires **avant** d'affirmer une faille.
- **P1 — vérité des données et règles validées** : promesse commerciale trompeuse, chiffres divergents, cycles/quota erronés ou décision utilisateur contournée.
- **P2 — cohérence ergonomique transversale** : navigation, brouillons, composants, aide, lisibilité, workflow.
- **P3 — nouvelle capacité à concevoir** : DOCX aller-retour, publication Workbench, remplacement entier de Projet, nouveaux tableaux ; ne pas feindre leur disponibilité.

## 2. Écarts et décisions prioritaires

| Priorité / ID | Faits ancrés dans code/décision | Effet transversal | Correction ou preuve requise |
|---|---|---|---|
| **P0 UX-16 #81** | Runner #649 distant : 745/748, 3 échecs; correctif `50f2b40` **local non poussé**, 35/35 restauration MSI, 3 tests répétés | Toute restauration SQLite depuis Réglages | Attendre push **autorisé**, run Windows hébergé au bon SHA et revue/merge **explicite**; aucune simulation sur Validation-MSI |
| **P0 UX-01 #83** | Garde d'édition en PR draft, conflit avec #81 dans `ipc.ts` / `main.ts`, non fusionnée | Navigation, formulaires, fenêtres détachées, changement workspace | Résoudre intégralement l'IPC sans seconde garde; CI/régression séparées avant réutilisation dans 17 modules |
| **P0 E259** | `ClientDocumentService.deletePermanently` garde les pièces Devis mais ne vérifie pas les `billing_items.invoice_document_id`; migration FK `ON DELETE SET NULL` | Facturation, preuves Abby, Documents, statistiques | Test de suppression liée (y compris archive), refus transactionnel au service et conservation historique; **faille de garde constatée statiquement**, effets réels à recetter |
| **P0 E222/UX-03** | `InterventionCompletionService.complete` orchestre statut, pack, billing via appels distincts sans transaction englobante visible à ce niveau | Interventions, packs, facturation, temps | **Tester pannes inter-étapes avant de conclure à un bug**; garantir rollback/reprise/idempotence avec débits et pièces préservés |
| **P0 E152** | Action « Valider » dans `QuotesPage` appelle `quotes.accept` avec effets Client/Projet/vente | Prospection, Devis, CGV, opérationnel | Libellé « Confirmer accepté dans Abby », preuve/conséquences/révision et confirmation; préserver le service, vérifier garde des conditions |
| **P1 E72/E153** | Décision « `new` reste Annuaire jusqu'à Démarrer »; `QuoteService.create` pousse le `new` vers `quote_to_prepare` | Annuaire, pipeline, Devis, Projet prévisionnel, Accueil | Corriger **backend** et tests : préparer Devis sans démarrer prospection; transition volontaire unique `new→qualifying` |
| **P1 E151** | Assistant Devis étape 6 peut afficher prix Catalogue alors que saisie étape 3 utilise prix proposé | Devis/CGV/Projet/Abby | Prix et total de preview = valeurs exactement enregistrées; contrôles centimes/quantités/options |
| **P1 E223/UX-02** | Algorithme `anniversary` existe; `MaintenanceService.createSubscription` manuel ne fixe pas `period_alignment` | Maintenance, facturation, quotas, rapports | **Nouveaux** manuels en date-à-date, cycles mensuels indépendants de paiement; anciens `calendar` préservés |
| **P1 E224/E236** | Temps routine compté dans usage total alors que solde de quota peut prendre les minutes mineures | Maintenance, dépassements, statistiques | **Arbitrage métier** sur routine/minutes incluses; tester la formule avant changer SQL ou libellés |
| **P1 E290** | Taux accepté/refusé UI vs accepté/refusé/expiré AnalyticsService | Statistiques, Accueil | Choisir dénominateur canonique **et préciser la cohorte/date**; convergence deux calculateurs |
| **P1 E293** | Page Statistiques inclut `stage=new` dans prospects actifs | Stats/pipeline CRM | Exclure Annuaire du pipeline actif, sans supprimer le compteur des contacts entrants |
| **P1 E291/E292/E297** | Ratio €/h nommé « rentabilité », « facturé suivi » = montant attendu Manager, score Clients mélange secondes/centimes | Stats, Pilotage, Finances | Revoir libellés/unités et classement; aucune marge/encaissement sans données de coût/paiements réelles |
| **P1 E258** | Remplacement justificatif Dépense sans historique métier de versions attesté | Dépenses, preuves/documentation | Ajouter provenance/version des pièces et rollback d'échec sans supprimer la preuve ancienne |
| **P1 E135/E136** | Builder synchronise instances et préserve personnalisation, mais classement canonique section/rang juridique et collisions nécessitent modèle | CGV, Devis, Documents, Word | Diff avant sync, classification **humaine**, versions et snapshots figés inchangés |
| **P1 E190/E217** | Service de synchronisation Projet existe mais pas d'API publique attestée pour remplacement **complet** de Projet | Devis révisé, Projet/Pages/Bridge/ressources | **Adapter** déjà fondé sur service; « Repartir de zéro » seulement après étude transactionnelle/archivage/rollback de toutes dépendances |
| **P2 E05** | CSS `help-disabled` masque `.field-help` même si l'aide doit rester accessible au clic | Tous les modules | Séparer aide au survol facultative de l'aide `?` persistante, mesurer contraste et 3×3 modes |
| **P2 E154/E175/E226** | Formulaires imbriqués, rechargements et bascules peuvent démonter des brouillons | CRM, Devis, Projet, Temps, Documents | Réutiliser registre UX-01 intégré; matrice de tous chemins de sortie et erreurs IPC |
| **P2 E184/E297** | Fiches/onglets multipliés et métriques avec tri non dimensionnel | Pilotage, Projets, CRM | Conserver l'identité/filtre/état; vrais tris métier, pas indicateurs trompeurs |
| **P2 E196/E218** | Undo/Redo **local composant** existe, Undo global de composition non établi | Pages, Bibliothèque, exports Bridge | Délimiter la portée, ne pas promettre undo sur un export/Workbench; versionner opérations composantes si nécessaire |
| **P3 E260/E279–E283** | Import DOCX brut disponible, aller-retour texte éditable/manifest/diff non établi | Contrats, documents, aides | Pipeline DOCX séparé, versionnement et comparaison humaine; aucun impact Devis signé/gelé |
| **P3 E209–E215/E221** | Bridge 0.8.1 Workbench-first, aucune publication production activée | Projets/Pages, WP, CSS/JS | Publication/rollback WP sur site de démo et contrôle humain **dans un chantier indépendant**; pas de faux bouton |
| **P3 E309–E314** | Thèmes/densités existent mais préférences de panneaux/vues/outil de recherche ne sont pas toutes établies | Réglages, navigation | Construire préférences UI seules, jamais contournement sécurité ou écriture métier |

## 3. Regroupements de doublons et conventions d'implémentation
- **Un seul routeur / garde / dialogue** pour sortie de saisie, quel que soit le module (Lot 01), y compris #83 après fusion. Les appels `window.confirm` subsistants doivent être inventoriés, **pas remplacés aveuglément**.
- **Un seul moteur Devis/CGV/Commercial Scope** : Lot 05 définit clauses/gel, Lot 06 compose Devis et prépare Abby, Lot 07 lit le périmètre Projet. Ne pas inventer une copie `ContractServiceV2` ou `QuoteServiceV2`.
- **Une seule identité de Projet courant** avec liens Devis/révision. Un Projet provisoire n'est ni Client acquis ni projet WordPress publié.
- **Une seule session de chrono** : `TimeService/TimeSwitchService` partagée entre Accueil, Projet, Page et Intervention. Corriger une session pack débitée ≠ débiter à nouveau.
- **Documents** : mêmes `client_documents` depuis Client/Facturation/Documents; CGV source distincte des PDF acceptés. Les protections des preuves ne sont jamais un choix esthétique.
- **Sauvegardes** : `BusinessBackupService` registre d'emplacements; `restore.ts` restaure SQLite. Aucun des deux n'est un moteur de restauration WordPress ou de tout le workspace.
- **Statistiques** : `StatisticsPage` simple et `AnalyticsService` détaillé exigent définitions communes de métriques et périodes, sans surcharger l'Accueil.

## 4. Critères d'activation d'un correctif
Pour chaque item P0/P1 : (1) confirmer état sur dernier HEAD et test de reproduction; (2) lier action UI → IPC → service → DB et version de schéma; (3) conserver règles/migrations/historiques; (4) tester cas nominal, rejet, panne, rejeu et navigation; (5) publier une PR ciblée **après autorisation**; (6) CI Windows **sur SHA exact**, seulement si nécessaire et autorisée; (7) accord humain distinct avant fusion. **Aucune écriture sur Validation-MSI**.

## 5. Distinction décision / hypothèse
**Actées par AtoumWeb :** E72, UX-02, Projet prévisionnel, séquence Adapter/Repartir de zéro, contrat intégré au Devis, CGV par rubriques de sens, aucun achat implicite, non-report nouveaux quotas, trois thèmes × trois densités.  
**À examiner techniquement avant d'implémenter :** E222 (atomicité réelle), E259 (impact exact de suppression), mapping de Finalisation pipeline E73, modèles de réouverture, règles de quotas routine, migration d'une bibliothèque de clauses, droit/retour Word, présence Bridge/Divi réel, calcul canonique du taux de conversion.

**Ce registre n'est pas un signalement de faille exploitée; il priorise vérifications et corrections.**

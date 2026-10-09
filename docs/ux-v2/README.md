# AtoumWeb Manager — Référentiel UX/UI V2

**Version documentaire : V1.0 initiale — 09/10/2026.**  
**Statut : référentiel de conception en cours de consolidation, sans autorisation de développement.**  
**Propriétaire des arbitrages : AtoumWeb.**  
**Base de comparaison : audit `docs/ux-audit/` sur branche `docs/ux-audit-manager-v1`, code audité `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.** L'audit n'est pas encore fusionné sur `main`. Vérifier le code courant avant implémentation.

## Objet
Source de référence **versionnée** pour AtoumWeb et Codex MSI. Traduire les arbitrages conversationnels UX/UI V0.2–V1.4 en exigences vérifiables, sans confondre décisions de conception, état du logiciel, proposition technique et conformité juridique.

Ce référentiel **n'annonce aucune fonctionnalité comme livrée**, ne modifie aucune règle métier et ne remplace pas l'audit, les décisions historiques ou les tests. Il documente la cible à comparer à la réalité du dépôt au début de chaque lot.

## Sommaire
1. [DECISIONS.md](DECISIONS.md) — décisions actées, invariants, frontières, arbitrages ouverts.
2. [CATALOGUE-CGV.md](CATALOGUE-CGV.md) — catalogue administrable, parcours Prospect/Devis, aides commerciales, contrats types et CGV.
3. [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — navigation, fiches, tableaux, personnalisation, formulaires, aide et accessibilité.
4. [COUVERTURE-ET-LOTS.md](COUVERTURE-ET-LOTS.md) — couverture des 17 modules, intégrité de la migration et feuille de route.

## Niveaux de preuve
- **DÉCIDÉ** : arbitrage validé par AtoumWeb, cible UX V2.
- **CONSTAT AUDITÉ** : décrit par l'audit à son commit de référence, pas nécessairement état du code actuel.
- **À VÉRIFIER** : exige lecture du code courant et/ou recette.
- **PROPOSÉ** : approche de mise en œuvre non encore arbitrée.
- **NON LIVRÉ / INCONNU** : ne jamais présenter comme fonction active.

## Gouvernance
- Créer des PR de documentation pour modifier le référentiel et consigner la justification des arbitrages.
- Toute modification de règle métier nécessite décision explicite et documentation de ses effets.
- Un lot d'implémentation référence les IDs `UX2-...`, indique ancien → nouveau, risques, tests, fonctionnalités indisponibles.
- Ne pas fusionner ce corpus avec les branches de corrections UX-01, UX-03, UX-16 ; ne pas toucher Validation-MSI.
- Les préférences d'affichage ne sont jamais une autorisation d'enregistrer/valider des données métier.
- La bibliothèque contractuelle n'est pas une certification juridique ; textes et publication exigent contrôle humain approprié.

## Entrées de comparaison
- Audit PR #80 : cartographie, interactions, parcours, écarts UX-01 à UX-20, invariants.
- Corrections PR #81 UX-03 et UX-16 : état final à vérifier avant de se fonder dessus.
- UX-01A/B/C : développés sur la [PR #83](https://github.com/atoumweb-prog/atoumweb-manager/pull/83), dernière revue et correctif `5b38cbe` ; **toujours non fusionnée**. Voir l'état vérifié ci-dessous : la couverture reste Prospection / Devis / Référence Prospect, pas les 17 modules.
- Code `main` et branches fusionnées : faire état des lieux au démarrage de chaque lot.

## État de ce premier dépôt
Ce dépôt contient une **première base opérationnelle**, pas encore la matrice exhaustive de chaque contrôle JSX/IPC/service ni l'inventaire complet des champs. Ces éléments devront être annexés et testés incrémentalement à partir de la cartographie d'audit.

## Spécifications de lots
Chaque lot dispose maintenant d'un fichier de travail : **objectifs, décisions, fonctions à conserver, ordre d'exécution, recette et incertitudes**. Les lots 02–10 sont des spécifications initiales à enrichir par une matrice complète contrôle→handler→IPC→service→test avant mise en œuvre.

| Lot | Document |
|---|---|
| 01 | [Fondations UX/UI](LOT-01-FONDATIONS.md) |
| 02 | [Navigation et Accueil](LOT-02-NAVIGATION-ACCUEIL.md) |
| 03 | [Prospection, Clients et Annuaire](LOT-03-CRM.md) |
| 04 | [Catalogue administrable](LOT-04-CATALOGUE.md) |
| 05 | [Bibliothèque contractuelle et CGV](LOT-05-CONTRATS-CGV.md) |
| 06 | [Devis et Abby](LOT-06-DEVIS-ABBY.md) |
| 07 | [Projets, Sites & Pages et Bridge](LOT-07-PROJETS-BRIDGE.md) |
| 08 | [Interventions, Maintenance et Temps](LOT-08-OPERATIONS-TEMPS.md) |
| 09 | [Facturation, Dépenses et Documents](LOT-09-GESTION-DOCUMENTS.md) |
| 10 | [Statistiques, Sauvegardes et Réglages](LOT-10-PILOTAGE-REGLAGES.md) |

**Mode de travail pour la suite :** documenter systématiquement dans GitHub toute décision prise en conversation, dans le fichier de lot correspondant et le registre des décisions ; les réponses du chat seules ne font pas foi comme référentiel durable. Aucun lot n'est « prêt à coder » tant que la vérification du code actuel et sa matrice d'interactions ne sont pas terminées.

## Suivi UX-01 (mise à jour du 09/10/2026)
- [PR corrective #83](https://github.com/atoumweb-prog/atoumweb-manager/pull/83), branche `codex/fix-manager-unsaved-inputs-ux01`, **HEAD `5b38cbe1e32e48aaf38154fb7c8e94bb36e2121f`**, ouverte en draft et non fusionnée à la vérification du 09/10/2026. Commits A/B/C `df1b6f3`, `80300a4`, `14d8f9c` ; revue finale correctrice `5b38cbe`.
- UX-01A : sections contractuelles indépendantes, conflits et sauvegardes périmées refusées.
- UX-01B : garde par éditeur Prospection/Devis, confirmation **Rester** (défaut) ou sortie volontaire ; sous-formulaires concernés.
- UX-01C : fermeture/rechargement/quit Electron, fenêtres détachées et programmation de changement de workspace.
- **Dernière revue du 09/10/2026** (bilan versionné dans la branche #83) : trois anomalies corrigées — archivage Prospect, suppression de ligne Devis avant confirmation, réduction d'une section détruisant son brouillon. Typecheck OK, **734/734 tests** (2 workers), **177/177 contrôles natifs** (trois thèmes), migrations **1–66 inchangées**, intégrité et FK conformes sur fixtures. Chiffres 75/75, 733/733, 153/153 = checkpoints **antérieurs**, ne pas les donner comme bilan final.
- **Compatibilité PR #81** : composition simulée dans une copie temporaire, typecheck OK, **87/87 tests ciblés** et **177/177 contrôles natifs**. **Conflit réel `src/main/ipc.ts` à résoudre lors du merge** : conserver `scheduleDatabaseRestore(sourcePath, workspace)` et les détails de destination de #81, **ainsi que** les gardes de sortie et `app.quit()` de #83 ; `main.ts` doit conserver erreurs de restauration #81 et cleanup `will-quit` #83. La recette de simulation **ne vaut pas fusion effectuée**.
- **PR #80** : conflits documentaires `PROJECT_STATUS.md`/roadmap annoncés, historiques à conserver. **PR #82** : compatibilité sans conflit rapportée sur un HEAD documentaire antérieur ; à revérifier lors des fusions ultérieures.
- **CI GitHub Actions** : run #518 (`37927673492`) du HEAD #83 confirmé `queued` sans conclusion, donc **pas de CI verte**. Codex signale zéro runner self-hosted enregistré. Ne pas fusionner automatiquement.
- **Limites maintenues** : pas de bouton « Enregistrer et quitter » universel, pas de raccordement automatique aux autres modules, pas de récupération après crash. Le Lot 01E doit **réutiliser** le code UX-01 final intégré sans créer un second registre ; contrôler la résolution #81/#83 et la CI avant de commencer l'intégration.

## Comparaison code réel / cible — Lot 01
- [Matrice existant → V2](LOT-01-MATRICE-EXISTANT-CIBLE.md) : **19 entrées traçables** en 01A–01F, sources `main@eb252d5c` et branche non fusionnée UX-01 #83 ; décisions, risques, critères de recette et incohérences E01–E04. Ce document est une inspection statique, **pas un résultat de tests**.
- **E01 tranché le 09/10/2026** : cible **Compact 14 px** au lieu de 15 px dans le code actuel ; Confort **16 px** et Confort+ **18 px** conservés. Documenté seulement, application CSS et recette visuelle à venir.

### Première fiche d'exécution détaillée
- [Lot 01A — Tokens visuels](LOT-01A-TOKENS-VISUELS.md) : inventaire des CSS, valeurs effectivement constatées, séquence de travail, livrables et huit scénarios de recette. **Statut préparation** ; E01 validé (Compact 14 px), contrôle visuel toujours requis avant livraison.

### Lot 01B — Composants élémentaires
- [Spécification 01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md) : boutons, champs, icônes, aides `?`, confirmations, notifications ; revue de code, six sous-étapes, douze scénarios de recette. **Spécification seulement**, aucune implémentation du Manager.
- **Écart E05 constaté dans CSS `main`** : `.app-shell.help-disabled .field-help { display:none !important; }` masque actuellement l'aide entière. La V2 conservera l'icône `?` et son activation clic/clavier même si l'aide automatique au survol est désactivée.

### Lot 01C — Fiches et panneaux
- [Spécification détaillée 01C](LOT-01C-FICHES-PANNEAUX.md) : comportements déjà repérés dans Prospection/Clients/Catalogue/Devis/Projets/Opérations, six sous-étapes de mise en œuvre, **16 scénarios de recette**, contraintes de persistance et prévention des pertes de brouillons (PR #83).
- Points techniques E08–E11 : portée de persistance des dispositions, variété des vues agrandies, bornes et accessibilité des séparateurs, raccordement UX-01 hors Prospection/Devis. **Documentation seulement**, pas de migration d'écran.

### Lot 01D — Tableaux et vues personnalisables
- [Spécification détaillée 01D](LOT-01D-TABLEAUX-VUES.md) : inspection des listes Prospection/Clients/Catalogue/Devis/Projets/Opérations, composants cibles, recherche/tri/colonnes/vues, auto-persistance des **seules préférences d'interface**, **16 scénarios d'acceptation**. Statut **documentation**, aucune fonctionnalité 01D livrée.
- Points E12–E16 : choix du stockage des vues, portée du tri/pagination, colonnes minimales obligatoires, exclusion de données sensibles, gestion d'une vue standard contre une vue personnelle. À instruire avant développement.

### CI GitHub Actions — préparation indépendante de l'UX
- [Diagnostic et proposition](CI-GITHUB-ACTIONS.md) : workflow `ci.yml` avec `runs-on: [self-hosted, Windows, X64]` alors qu'aucun runner enregistré n'est signalé par Codex ; recommandation `windows-2022`, `npm ci` (lockfile présent), deux workers, puis vérification réelle des PR. **Proposition non approuvée, aucune configuration modifiée**. La CI en attente n'est pas un échec de tests.

### Lot 01E — Formulaires et confirmations critiques
- [Spécification détaillée 01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md) : état réel UX-01 #83, modules pilotes et limites, indicateurs de brouillons, conflits et permissions, extension future `Enregistrer et quitter` **uniquement quand un vrai service d'enregistrement fiable existe** ; 20 tests projetés, dont les trois régressions corrigées dans #83.
- Décisions techniques ouvertes E17–E22 : protocole async de sauvegarde avant sortie, périmètres d'éditeurs, dialogues Electron, conflit de versions, couverture réelle des modules et crash hors périmètre. **Documentation uniquement**, pas de nouveau mécanisme implémenté.

### Lot 01F — Préférences et recette du socle
- [Spécification détaillée 01F](LOT-01F-PREFERENCES-RECETTE.md) : catégories de préférences et frontière données métier, atelier UX **strictement isolé**, contrôles de thèmes/densités/accessibilité/fenêtres, six sous-étapes, **22 scénarios d'acceptation** et passage vers les lots métiers.
- **Attention constatée dans le code** : le `DemoPanel` actuel (`src/renderer/workflow/DemoPanel.tsx`) appelle `workflow.createDemo` et `workflow.resetDemo` via l'IPC réel. Ce n'est **pas** un atelier visuel inoffensif. La démo de la V2 doit être isolée, sans accès à un workspace métier ni à Validation-MSI.

**Les sous-lots 01A à 01F ont maintenant tous un cahier des charges détaillé dans la PR #82. Ils ne sont PAS implémentés ni recettés ; la matrice écran→handler→IPC→service→test reste à compléter à chaque lot métier.**

### Lot 02 — Navigation et Accueil, confrontation au code
- [Cahier des charges Lot 02](LOT-02-NAVIGATION-ACCUEIL.md) approfondi, sous-lots 02A–02E et **22 scénarios de recette**, navigation dans 17 modules, rail compact toujours visible, favoris, recherche qui ouvre le bon objet, dashboard et chrono unique.
- [Matrice code → cible Lot 02](LOT-02-MATRICE-EXISTANT-CIBLE.md) : fichiers `App.tsx`, `GlobalSearch.tsx`, `DossierPanel.tsx`, `HomeDashboard.tsx/.css`, `GlobalTimer.tsx` ; écarts E28–E41 observés. Notamment **la recherche Catalogue n'applique pas l'identifiant**, **le pipeline Accueil présente 5 agrégats plutôt que 7 étapes visuelles**, **les boutons « + » de l'Accueil ouvrent seulement des modules**, et **la sidebar actuelle disparaît complètement au repli**. À corriger progressivement dans les lots V2, sans nouveau statut backend.

### CI — PR #84, état réel
- [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84) **draft** au HEAD `3a02ff0`, workflow `windows-2022`/Node 24/`npm ci`/typecheck/tests à 2 workers. **Zéro run CI selon Codex** (`[skip ci]`) ; quota et plafond de dépassement **inconnus** car API Billing sans droits. Ne pas fusionner ni autoriser une dépense sans confirmation humaine. [Suivi CI détaillé](CI-GITHUB-ACTIONS.md).

### Contrôle du budget CI — capture du 09/10/2026
- La page personnelle GitHub `atoumweb-prog` montre **GitHub Free**, **budget Actions 0 USD**, **Stop usage Yes**, alertes incluses **On** ; l'Overview affiche **0 USD facturable** pour octobre (0,13 USD de consommation compensée par l'allocation incluse).
- [CI-GITHUB-ACTIONS.md](CI-GITHUB-ACTIONS.md) précise le solde gratuit **toujours non vérifié**, la limite nominale GitHub Free de 2 000 minutes/mois (source officielle) et la caveat du premier cycle de budget.
- **PR #84 reste non exécutée et non fusionnée**. Exécution autorisée seulement après feu vert explicite AtoumWeb, même avec dépassements payants bloqués.

### Lot 02A — Rail, groupes et favoris
- [Spécification détaillée 02A](LOT-02A-RAIL-NAVIGATION.md) : carte de **17 destinations et leurs icônes proposées**, conservation des clés internes, rail visible en réduit, groupes et favoris, gardes de sortie UX-01, **18 tests proposés**. **Arbitrage E42 VALIDÉ par AtoumWeb : option A**, rail réduit **Accueil + favoris + cinq groupes**, sous-navigation au clic ; accès aux 17 modules en déployé. L'option B n'est pas retenue ; la recette et les icônes précises restent à faire.
### Lot 02B — En-tête et raccourcis
- [Spécification détaillée 02B](LOT-02B-ENTETE-RACCOURCIS.md) : garde du **chrono global unique**, repli de l'en-tête sans cacher le chrono ni la recherche, bandeau Bibliothèque indépendant, audit des raccourcis, **16 tests proposés**. La réduction du header est cible V2, **non existante dans le code de comparaison**.

### CI GitHub Actions #84 — première exécution réelle
- **Nouveau HEAD #84 : `1b069575891dae3b695c0afa1c76a3964890a03a`**, commit `ci: trigger first hosted Windows validation within free allowance`.
- [Run #549](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37934890745), job `quality` sur Windows hébergé : **install OK, typecheck OK, tests ÉCHEC : 692/695 réussis, 3 timeouts de 5000 ms** (`OperationalRecipeService.test.ts`, deux tests `mariageHistoireRecipeStructure.test.ts`). **CI NON VERTE, #84 draft NON FUSIONNÉE**. Voir [dossier CI](CI-GITHUB-ACTIONS.md). Ce run montre que le runner hébergé fonctionne, pas que la suite passe.

### Lot 02C — Recherche et navigation ciblée
- [02C — spécification détaillée](LOT-02C-RECHERCHE-ROUTAGE.md) : **14 types d'entités**, ouverture par `entityId`, maintien des événements existants, erreurs IPC, UX-01 avant navigation et prévention des résultats périmés. **18 scénarios de recette** ; écarts supplémentaires E51–E58. Aucune application modifiée.
### Lot 02D — Accueil opérationnel
- [02D — spécification détaillée](LOT-02D-ACCUEIL-PILOTAGE.md) : **8 sources de données**, Aujourd'hui, KPI, relances, alertes, chrono unique, widgets, actions rapides réellement exécutables et **22 scénarios de recette**. **E59 partiellement validé** : « Conversion » = historique des Prospects **réellement devenus Clients**, distinct des dossiers actifs (décision AtoumWeb). `new` demeure dans l’Annuaire jusqu’à « Démarrer la prospection » (E72 décidée) ; le marqueur technique de Finalisation et la période de l’historique restent ouverts.
### Lot 02E — Recette transverse
- [02E — intégration et recette](LOT-02E-RECETTE-ET-MIGRATION.md) : dépendances #81/#83/#84, séquence réversible, accès aux 17 modules, protection des brouillons et **20 parcours bout-en-bout**. **Lot 02A–02E : cahiers des charges maintenant complets, développement non commencé.** E42 (rail option A) est validé. **E59 est partiellement tranché** pour l'historique Conversion ; la projection complète doit être arrêtée avant implémentation du pipeline.

### 09/10/2026 — Nouvelle décision métier : Projet avant signature
- **DÉCIDÉ par AtoumWeb :** dans le parcours commercial **Finalisation = accord de principe, signature en attente** ; un pré-projet peut être créé **volontairement à partir d'un devis non signé, même avant Finalisation**, pour commencer à travailler sur les lignes/versions du devis. Si la révision change fortement : **Adapter/Synchroniser le Projet** ou **Repartir de zéro** via retrait/archivage sécurisé et régénération sur devis actualisé. Sur acceptation Abby, figer le Projet courant et convertir Prospect → Client, sans doublons.
- [Lot 07P — projet prévisionnel, synchronisation, remplacement](LOT-07-PROJET-PRE-SIGNATURE.md) : détails code, états, sauvegardes, risques (pas d'API `deleteProject` entière attestée), **20 tests à exécuter**. `ProjectCommercialService` et `ProjectsApi` offrent déjà `prepareQuote`, `previewQuote`, `syncCommercial` et `provisional`, mais l'entrée classique de la page Projets liste les **devis acceptés**. **Spécification seulement, aucun code ni suppression effectués.**

### Lot 03 — CRM Prospection / Clients / Annuaire (documentation détaillée)
- [Matrice 03A](LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md) — statuts, transitions service, conversion idempotente, Devis et Projet avant signature.
- [Pipeline 03B](LOT-03B-PROSPECTION-PIPELINE.md) — **six colonnes commerciales actives et Conversion historique en septième position**, 20 scénarios, aucun faux statut backend.
- [Fiche Prospect 03C](LOT-03C-FICHE-PROSPECT-BESOINS.md) — qualification/contacts/besoins/pré-devis, lancement volontaire du projet prévisionnel sur les lignes du Devis courant.
- [Fiche Client 03D](LOT-03D-FICHE-CLIENT.md) — cible 8 onglets / source 6, continuité Prospect → Client et Projet confirmé.
- [Annuaire 03E](LOT-03E-ANNUAIRE-PARCOURS.md) — organisations/contacts uniques, relations, vérifications et parcours croisés.
- **E72 VALIDÉ :** `new` dans l’Annuaire uniquement, puis `qualifying` dans « À qualifier » après démarrage volontaire. **E73 technique** : indicateur d'accord de principe pour Finalisation. **Les cinq spécifications 03A–03E sont des documents, pas des fonctionnalités développées.**

### Suivi CI #84 — correctif publié (09/10/2026)
- GitHub confirme la publication du correctif SQLite **`5a175eb`** sur la [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84), HEAD de suivi **`495775da` [skip ci]**. **Aucun run sur ce HEAD** ; les résultats `698/698` et `27/27` sont **locaux**, le dernier essai hébergé #549 reste en échec. **Deuxième run GitHub soumis à accord explicite AtoumWeb**, puis éventuelle décision de fusion. [Dossier CI](CI-GITHUB-ACTIONS.md).

### Lot 04 — Catalogue, état documentaire (09/10/2026)
- [04A — Inventaire réel](LOT-04A-MATRICE-CATALOGUE.md) : `CatalogService`, types offre/service, versions, prix, statuts, composition d'offre et sources Prospection/Devis ; **14 scénarios à exécuter**.
- [04B — Navigation et catégories](LOT-04B-NAVIGATION-CATEGORIES.md) : quatre offres principales en tête, **section visuelle Services complémentaires** avec catégories métier **uniques** triées A–Z français, recherche, codes Abby secondaires ; **15 scénarios à exécuter**.
- [04C — Fiche complète et versions](LOT-04C-EDITEUR-VERSIONS.md) : huit onglets cibles, publication volontaire, nouveau brouillon, tarif, CGV et snapshots Devis/Projet immuables ; **17 scénarios à exécuter**.
- **L'existant gère déjà versions `draft/published/retired`, `CatalogService.publishVersion`, `setOfferComponents`, offres/services et tarifs.** La gestion centralisée des **catégories** n'est pas attestée dans `CatalogApi` : `category` est aujourd'hui une **chaîne libre**. Les suggestions de `ProspectNeedsPanel` utilisent un dictionnaire codé. **04D est maintenant détaillé** ; **04E–04F restent à détailler**. Aucune fonctionnalité V2 développée.

### CI Windows hébergée #84 — succès réel vérifié (09/10/2026)
- [Run #589](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37945827513) au SHA `f4bc0197` : **`quality` success, `npm ci` OK, typecheck OK, Vitest 80 fichiers / 698 tests réussis (183,78 s)**. Le correctif des fixtures SQLite a résolu les trois timeouts visibles au run précédent. **PR #84 toujours draft/non fusionnée** ; le succès ne couvre pas #81/#83 ni l'UX V2. [Historique complet CI](CI-GITHUB-ACTIONS.md).

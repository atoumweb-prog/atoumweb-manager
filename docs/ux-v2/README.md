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

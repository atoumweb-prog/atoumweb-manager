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
- Chantier UX-01A/B/C : partiellement réalisé lors d'une interruption Codex ; ne pas présumer ses commits, intégration ou couverture.
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

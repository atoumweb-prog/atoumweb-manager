# Audit UX/UI et fonctionnel — AtoumWeb Manager

**État des lieux du 09/10/2026. Publication documentaire, pas lancement d’une refonte.**

| Repère | Valeur |
|---|---|
| Dépôt | atoumweb-prog/atoumweb-manager |
| Code audité | **main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda** |
| Branche de publication | docs/ux-audit-manager-v1 |
| Cible de la PR documentaire | main |
| Comparaison avant rédaction | HEAD local et origin/main égaux au commit audité, working tree propre |
| Résultat technique rejoué pendant l’audit | Typecheck OK ; 695/695 tests dans 79 fichiers |
| Portée | Cartographie globale, principaux parcours et gardes, inventaire statique ; matrice individuelle non exhaustive |

Les fichiers de ce répertoire centralisent l’audit réalisé avant leur publication. **Ils ne constituent ni un cahier des charges UX V2 validé, ni une preuve de conformité juridique, ni une certification de tous les écrans.** Les liens sources sont épinglés au commit audité pour conserver le contexte des constats.

Le dépôt est privé. ChatGPT doit disposer d’un accès autorisé au dépôt, par exemple via le connecteur GitHub ; le lien seul ne rend pas son contenu public. Aucune modification de visibilité ou d’autorisation du dépôt n’est incluse.

## Parcours de lecture

| Document | Contenu |
|---|---|
| [01 — État des lieux](01-ETAT-DES-LIEUX.md) | Synthèse, méthode, chiffres vérifiables et limites |
| [02 — Cartographie des écrans](02-CARTOGRAPHIE-ECRANS.md) | 17 entrées de navigation, sous-écrans et index des 84 fichiers React |
| [03 — Interactions](03-INTERACTIONS.md) | Comportements, matrice détaillée et tableau de traçabilité |
| [04 — Parcours utilisateurs](04-PARCOURS-UTILISATEURS.md) | Schémas Mermaid, transitions, retours et frontières externes |
| [05 — Registre des écarts](05-REGISTRE-ECARTS.md) | UX-01 à UX-20, preuves, reproduction et criticité |
| [06 — Composants UX existants](06-COMPOSANTS-UX-EXISTANTS.md) | Réutilisation, styles, navigation, messages et interfaces |
| [07 — Règles métier à préserver](07-REGLES-METIER-A-PRESERVER.md) | Invariants, décisions, historiques et arbitrages ouverts |
| [08 — Tests et couverture](08-TESTS-ET-COUVERTURE.md) | Résultats, niveaux de preuve, tests UI séparés et angles morts |
| [09 — Pistes d’amélioration](09-PISTES-AMELIORATION.md) | Propositions, architecture du futur référentiel et réflexion HubSpot |

## Statuts de preuve

- **F-CODE** : chemin ou condition vérifié dans l’implémentation ; ce n’est pas une reproduction visuelle.
- **F-TEST** : expérience ou test exécuté, avec périmètre explicite.
- **F-DOC** : texte documentaire ou décision retrouvée ; sa date et son applicabilité restent à examiner.
- **HYPOTHÈSE / À VÉRIFIER** : conséquence non reproduite ou preuves insuffisantes.
- **PROPOSITION** : réflexion soumise à validation, sans autorisation de développement.

Classes du registre : A conforme et documenté ; B implémenté insuffisamment documenté ; C partiel/incohérent ; D absent/inactif ; E à vérifier. Un classement E, même avec criticité potentielle élevée, **ne décrit pas un dommage constaté**.

## Documents antérieurs conservés

Les documents [CRM_UI_INTERACTIONS](../CRM_UI_INTERACTIONS.md), [CRM_WORKFLOW_MODEL](../CRM_WORKFLOW_MODEL.md), [CRM_TRANSITION_MATRIX](../CRM_TRANSITION_MATRIX.md) et [DECISIONS_RECETTE_COMMERCIALE](../DECISIONS_RECETTE_COMMERCIALE.md) sont des sources historiques. Ils ne sont ni supprimés ni réécrits dans cette publication.

L’état courant et les décisions datées restent dans [PROJECT_STATUS](../../PROJECT_STATUS.md) et la [roadmap Manager ↔ Bridge](../MANAGER_BRIDGE_ROADMAP.md). Les constats d’audit ne remplacent pas automatiquement une décision métier.

## Ce qui reste à faire

Développer la matrice interaction par interaction et état par état ; recetter les risques non reproduits ; arbitrer les divergences ; rédiger avec AtoumWeb un cahier des charges UX V2. **Aucune correction fonctionnelle ni refonte n’est réalisée par cette PR.**

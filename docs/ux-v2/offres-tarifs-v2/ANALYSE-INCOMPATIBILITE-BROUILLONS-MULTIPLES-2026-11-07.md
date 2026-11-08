# Brouillons historiques multiples — analyse préalable

Analyse complétée lors de la reprise du **8 novembre 2026**, sur la référence du lot 2 du 7 novembre.

Cette analyse complète [la note de compatibilité](COMPATIBILITE-BROUILLON-UNIQUE.md). Elle porte sur les possibilités du schéma et des services anciens, pas sur le contenu d'une base utilisateur : aucune base réelle ou Validation-MSI n'a été ouverte pour compter ou examiner ses brouillons.

## Incompatibilité identifiée

Le schéma historique garantit une seule version publiée par article, mais autorise plusieurs versions `draft`. L'ancien service pouvait créer vN+1 même si un brouillon existait. Un numéro plus élevé, une date de création plus récente ou la sélection courante dans l'interface ne prouvent pas que les autres versions ont été abandonnées.

La règle retenue pour le lot 2 est différente : au plus un brouillon **opérationnel non abandonné** par article. Sur une ancienne base, aucune information `abandoned_at` ne permet de distinguer les intentions antérieures. Affecter automatiquement ce marqueur aux versions les moins récentes inventerait une décision et une date historiques.

La migration TEMP 81 vérifie donc les articles comportant plusieurs brouillons avant de reconstruire la table. Si elle en trouve, elle refuse l'opération et indique les identifiants d'articles concernés. Elle ne choisit pas de version, ne retire pas de référence et ne marque aucune version abandonnée. Ce refus a été testé sur une fixture TEMP avec conservation intégrale des lignes.

## Conséquences à examiner avant tout traitement

| Aspect | Conséquence |
|---|---|
| Contenu commercial | Des brouillons peuvent représenter des variantes légitimes, des préparations concurrentes ou une ancienne intention non documentée. Leur contenu doit rester distinct tant qu'aucune décision n'est prise. |
| Versions et références | Compositions, recommandations, contrats, blueprints et règles peuvent différer par version. La plus récente ne doit pas absorber les références des autres. Aucun recalcul de devis/projet ou réécriture de snapshot n'est acceptable. |
| Identité | Un article avec plusieurs versions n'est pas automatiquement plusieurs offres commerciales. Le scinder en nouveaux articles serait une décision métier distincte, pas une réparation de schéma. |
| Compteurs et reprise | Le futur compteur « Avec brouillon » vise les brouillons opérationnels. Sur un ancien schéma ambigu, une sélection de présentation n'est pas une décision d'abandon. La reprise doit garder des IDs explicites. |
| Intégrité | Renuméroter, supprimer ou remplacer des versions pourrait casser des FK et références historiques. L'index unique ne peut pas être imposé en ignorant les doublons. |
| Dates et provenance | Les dates inconnues restent inconnues. Toute décision future doit être datée au moment où elle est réellement prise, sans la présenter comme un abandon ancien. |
| Restauration | Après migration compatible, restaurer un abandonné quand un autre brouillon est opérationnel est refusé atomiquement. L'autre brouillon n'est pas abandonné pour rendre la restauration possible. |

## Informations nécessaires à une éventuelle décision ultérieure

Il faudrait d'abord autoriser un inventaire en lecture seule d'une référence de données précisément désignée : IDs des articles et versions, statuts, dates connues, contenus et références associés. Cet inventaire devrait distinguer les différences constatées des intentions supposées, sans extraire de secrets ni annoncer qu'une date de création est une date de dernière sauvegarde.

Il faudrait ensuite une décision explicite pour chaque situation ambiguë : quelle intention reste opérationnelle, quelles versions doivent rester consultables et si des variantes constituent réellement des articles indépendants. Les règles d'audit, de réversibilité, de contrôle des références et de sauvegarde doivent être définies avant de proposer un outil de traitement.

**Aucun traitement ni reclassement n'est proposé ou exécuté ici.** Le blocage sécurisé est conservé. L'autorisation actuelle reste limitée aux migrations et recettes TEMP ; l'application à une base utilisateur nécessite une nouvelle autorisation, une sauvegarde cohérente et une restauration vérifiée. Aucun abandon, scission, fusion, suppression ou correction historique automatique n'est développé.

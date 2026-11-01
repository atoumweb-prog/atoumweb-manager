# Validation fonctionnelle de la convergence — 31 octobre 2026

## Périmètre et garanties

La validation a été réalisée sur une copie isolée de la base utilisateur. La base source est restée en lecture seule et son empreinte SHA-256 est demeurée identique avant et après les contrôles : `964DA31EFAC12AD54EFFAA9E6C22E5E591053A1185D7BC51762A02ADCBFDC0CB`.

Aucune clause n'a été publiée ou adoptée. Aucun devis, contrat, tarif publié, historique ou association existante n'a été modifié. Les imports testés créent uniquement des versions brouillon après confirmation explicite.

## Réconciliation des maintenances mensuelles

La base utilisateur ne contenait pas encore les codes canoniques `AW-MAINT-WP-M` et `AW-MAINT-WC-M`. Elle contenait toutefois les deux prestations mensuelles correspondantes :

- `atoumweb-wordpress` / version publiée `atoumweb-wordpress-v1`, 49 € par mois ;
- `atoumweb-woocommerce` / version publiée `atoumweb-woocommerce-v1`, 99 € par mois.

Le plan de reprise historique associait déjà ces identifiants aux codes canoniques. Il n'avait simplement pas été appliqué à cette copie. Le service de convergence réutilise désormais ces deux articles historiques, leur attribue l'identité canonique dans la même transaction que la création des brouillons et refuse les situations ambiguës où l'article historique et un article canonique coexisteraient. La recette obtient exactement deux prestations mensuelles canoniques et aucun doublon.

La simulation demeure strictement sans écriture. Le rejeu est idempotent et un plan périmé provoque un rollback complet.

## Six évolutions Catalogue contrôlées

Les brouillons préparés sur la copie de recette reprennent les décisions commerciales déjà approuvées :

- maintenance WordPress : 49 €/mois, formule mensuelle de référence ;
- maintenance WooCommerce : 99 €/mois, formule mensuelle de référence ;
- maintenance WordPress annuelle : 539 €/an, seulement sur accord exprès, sans renouvellement annuel automatique ;
- maintenance WooCommerce annuelle : 1 089 €/an, seulement sur accord exprès, sans renouvellement annuel automatique ;
- hébergement isolé avec Lune dédiée : 149 €/an, maintenance applicative exclue, migration interne AtoumWeb gratuite et migration externe distincte ;
- migration depuis un hébergeur externe : sur devis.

Les périodicités, prix, inclusions, exclusions, prérequis et conditions sont affichés dans l'interface de comparaison. Les versions publiées restent inchangées.

## Revue des 118 propositions contractuelles

L'interface expose pour chaque proposition la version publiée, le texte proposé, les différences, les dépendances, la famille, le défaut corrigé, le niveau de vigilance et l'avis externe disponible. Elle distingue explicitement le niveau de risque d'une validation juridique.

Inventaire contrôlé :

- 118 propositions sur 118 ;
- 118 origines publiées retrouvées ;
- 0 proposition manquante ;
- vigilance faible : 26 ; modérée : 49 ; élevée : 43.

Les 43 vigilances élevées doivent être relues humainement par famille avant toute publication, notamment les sujets consommateurs, rétractation, médiation, responsabilité, données, sauvegardes et renouvellements. Cette revue technique ne constitue pas une validation juridique.

## Campagne PDF sur brouillons

Les 14 scénarios existants ont été régénérés sur la copie de recette en substituant uniquement le texte des brouillons aux clauses déjà sélectionnées par chaque scénario. Les associations et les montants des devis n'ont pas été modifiés.

Résultats :

- 14 PDF générés ;
- 202 pages inspectées ;
- 0 corps de brouillon sélectionné manquant ;
- 14 blocs de signature présents ;
- mention `BROUILLON` présente sur les 14 documents ;
- aucune page blanche, superposition, coupure manifeste ou débordement détecté lors de l'inspection visuelle.

Les documents deviennent plus longs avec les formulations humanisées. Les dernières pages de signature peuvent rester peu remplies, mais aucune anomalie de mise en page bloquante n'a été constatée.

## Arbitrages humains restant avant publication

1. Valider juridiquement les familles à vigilance élevée, particulièrement les droits des consommateurs, la responsabilité et les données.
2. Confirmer la rédaction des sauvegardes comme obligation de moyens et le périmètre exact des restaurations.
3. Confirmer les règles de fin et de renouvellement de l'hébergement isolé et des formules annuelles facultatives.
4. Valider la formulation de non-report et de non-cumul des interventions de maintenance.

Ces arbitrages ne bloquent ni la simulation, ni la consultation, ni la préparation explicite de brouillons. Ils bloquent leur publication.

## Contrôles exécutés

- `npm run typecheck` : réussi ;
- tests ciblés convergence et brouillons : 8/8 réussis ;
- recette SQLite isolée : réussie, source inchangée ;
- suite complète : 208 fichiers réussis, 1 ignoré ; 1 746 tests réussis, 1 ignoré ;
- inspection visuelle des 14 PDF : réalisée sur les 202 pages.


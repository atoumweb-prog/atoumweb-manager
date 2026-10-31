# Validation de convergence contrats / Catalogue — 31 octobre 2026

## Périmètre contrôlé

La PR #161 ajoute une interface commune de **simulation sans écriture** pour comparer les 118 clauses publiées avec leurs propositions humanisées et les six évolutions Catalogue avec leurs versions publiées. Les deux préparations restent séparées, créent uniquement des versions `draft` et exigent chacune une confirmation explicite dans le processus principal Electron. Le journal d'activité enregistre les préparations effectives, sans doublon lors d'un rejeu.

## Validations techniques réussies

- TypeScript : `npm run typecheck` réussi.
- Construction de production : `npm run package` réussi.
- Tests ciblés : 8/8 réussis pour les plans éditoriaux, le Catalogue et les frontières IPC ; recette SQLite isolée : 1/1 réussie.
- Suite complète : **1 746 tests réussis**, 1 test d'intégration opt-in ignoré, sur 209 fichiers.
- Simulation des 118 clauses et des six évolutions Catalogue sans écriture vérifiée.
- Préparation atomique, rejeu idempotent, refus d'un plan périmé et rollback vérifiés.
- Aucun changement des devis, clauses publiées, versions Catalogue publiées ou contrats historiques dans la copie de recette.
- Base source utilisateur : SHA-256 identique avant et après, `964DA31EFAC12AD54EFFAA9E6C22E5E591053A1185D7BC51762A02ADCBFDC0CB`.

La base de recette ne possédait pas les deux versions mensuelles canoniques attendues par le plan. La préparation du banc isolé a donc ajouté, **dans la copie uniquement**, les versions publiées exactes `AW-MAINT-WP-M` et `AW-MAINT-WC-M` provenant de Reference-V2. Cette adaptation de banc est tracée dans `output/contract-convergence-20261031/Workspace/data/RECETTE-CONVERGENCE.json` et n'est ni une migration ni une publication dans la base utilisateur.

## Campagne des 14 PDF

La campagne existante a été poursuivie sur la copie SQLite isolée : 14 scénarios, 103 contrôles réussis, 14 exports IPC textuellement identiques aux exports directs, 131 pages et 181 montants contrôlés sans rupture typographique. Les 131 pages ont été rendues puis inspectées visuellement.

Constats : aucun texte hors page, page vide, chevauchement, glyphe cassé ou corps de clause manquant. Le marquage BROUILLON, la TVA, l'acceptation et la signature sont présents dans les 14 documents. Cinq dernières pages sont volontairement peu denses (01, 02, 04, 10 et 11) ; quelques grands blancs subsistent pour maintenir les sections ensemble, sans perte de contenu.

## Décisions commerciales déjà approuvées

- Maintenance WordPress : 49 €/mois ; variante annuelle facultative 539 €/an.
- Maintenance WooCommerce : 99 €/mois ; variante annuelle facultative 1 089 €/an.
- Une formule annuelle exige un accord exprès et ne se renouvelle pas automatiquement par défaut.
- Hébergement isolé avec Lune dédiée : total annuel approuvé à 149 €, sous réserve de création et publication ultérieures de la version validée.
- Déplacement interne AtoumWeb vers AtoumWeb gratuit ; migration depuis un hébergeur extérieur payante ou sur devis selon le cas.

## Anomalies et décisions restantes

- Les propositions humanisées restent des **brouillons non adoptés**. Leur publication et toute qualification juridique nécessitent une validation humaine séparée.
- Le Catalogue historique contient encore plusieurs périmètres publiés peu détaillés ; la campagne les signale sans inventer de contenu.
- Les versions annuelles historiques renvoient parfois au périmètre mensuel. Les nouveaux brouillons détaillés corrigent ce point, mais ne sont pas publiés.
- Les tarifs « à partir de » restent des hypothèses de scénario et ne constituent pas un prix universel.
- L'interface prépare des brouillons ; elle ne fusionne, ne publie et n'adopte rien automatiquement.

## Éléments de recette locaux

- Rapport SQLite : `output/contract-convergence-20261031/Workspace/data/RECETTE-CONVERGENCE.json`.
- Campagne PDF : `output/convergence-campaign14-20261031/`.
- Contrôle textuel et géométrique : `controle-pdf.json`.
- Contrôle des montants : `audit-montants-pdf.json`.
- Journal de suite complète : `output/contract-convergence-20261031/full-test.log`.

Ces sorties sont volontairement exclues du commit ; le code, les tests et le présent bilan sont versionnés.

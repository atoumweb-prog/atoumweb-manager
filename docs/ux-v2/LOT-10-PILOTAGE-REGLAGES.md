# Lot 10 — Statistiques, Sauvegardes, Réglages et recette transversale
**Statut : spécification cible.**
## Statistiques
Vue ensemble/Commercial/Projets et temps/Clients/Rentabilité, indicateurs sourcés (périmètre, période, unité, définition), drilldown sur objet d'origine ; pas de confusion devis accepté/facturé/encaissé, temps enregistré/facturable.
## Sauvegardes
Registre des sauvegardes métier (déclaration/rattachement/vérification) distinct des sauvegardes/restaurations effectives de workspace SQLite/ressources. Vérifier scope, source et destination ; confirmations, idempotence, garde-fous UX-16/UX-12 selon code actuel.
## Réglages
Recherche des paramètres, catégories apparence/navigation/aide/documents/workspaces/avancé, trois thèmes et densités, vues et filtres mémorisés avec restauration défaut par module. Aide prolongée facultative ; confirmations sécurité et garde de saisie non désactivables.
## Ordre proposé
10A indicateurs et métriques réelles ; 10B statistiques ; 10C sauvegardes ; 10D réglages ; 10E recette complète ancienne→nouvelle, accessibilité et validation humaine.
## Recette
Statistique traçable et non trompeuse, restaurations refusées si source non valide, préférences ne changent aucune donnée métier, aucune voie de suppression de document preuve, toutes les 17 entrées et sous-vues importantes accessibles.
## Préalables
Audit état courant, protections UX-01/03/16 confirmées et tests sur fixtures isolées, jamais Validation-MSI comme oracle.

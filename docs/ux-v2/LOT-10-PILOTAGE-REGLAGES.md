# Lot 10 — Statistiques, Sauvegardes, Réglages et recette transversale
**Statut : spécification cible.**
## Statistiques
Vue ensemble/Commercial/Projets et temps/Clients/Rentabilité, indicateurs sourcés (périmètre, période, unité, définition), drilldown sur objet d'origine ; pas de confusion devis accepté/facturé/encaissé, temps enregistré/facturable.
## Sauvegardes
Registre des sauvegardes métier (déclaration/rattachement/vérification) distinct des sauvegardes/restaurations effectives de workspace SQLite/ressources. Vérifier scope, source et destination ; confirmations, idempotence, garde-fous UX-16/UX-12 selon code actuel.
## Réglages
Recherche des paramètres, catégories apparence/navigation/aide/documents/workspaces/avancé, trois thèmes et densités, vues et filtres mémorisés avec restauration défaut par module. Aide prolongée facultative ; confirmations sécurité et garde de saisie non désactivables.
## Ordre proposé
[10A audit et registre de métriques](LOT-10A-AUDIT-INDICATEURS.md) ; [10B Statistiques et tableaux](LOT-10B-STATISTIQUES-NAVIGATION.md) ; [10C Sauvegardes métier et SQLite](LOT-10C-SAUVEGARDES-RESTAURATION.md) ; [10D Réglages et préférences](LOT-10D-REGLAGES-PREFERENCES.md) ; [10E recette transverse et accessibilité](LOT-10E-RECETTE-PILOTAGE-REGLAGES.md). **Les cinq sous-lots sont documentés, pas implémentés.**
## Recette
Statistique traçable et non trompeuse, restaurations refusées si source non valide, préférences ne changent aucune donnée métier, aucune voie de suppression de document preuve, toutes les 17 entrées et sous-vues importantes accessibles.
## Préalables
Audit état courant, protections UX-01/03/16 confirmées et tests sur fixtures isolées, jamais Validation-MSI comme oracle.

## État audité du code (09/10/2026)
- **Deux couches statistiques existantes** : `renderer/statistics/StatisticsPage` calcule une vue de listes dans le renderer, puis l'onglet « Rentabilité & analyse détaillée » monte `renderer/analytics/StatisticsPage` sur `AnalyticsService` (requêtes SQLite). **E290** : taux d'acceptation simple exclut devis expirés, l'AnalyticsService les inclut au dénominateur. Harmonisation technique future.
- **E291/E297** : la « rentabilité » affiche notamment des valeurs **€/h contractuels/commerciaux**, pas la marge nette; le classement Clients mélange secondes et centimes (`seconds + invoiced * 20`) et doit être remplacé par un vrai tri d'unité.
- **E292** : facturé suivi Abby agrège `expected_amount_cents` des `billing_items` liés, pas l'encaissement. `cash_collected` et `outstanding_revenue` sont explicitement `available=false`. **E293** : `activeProspects` dans Statistiques inclut `stage=new`, incompatible avec E72 validé (Annuaire hors pipeline).
- **Sauvegardes** : le registre BusinessBackupService référence types/emplacements, existence locale et **confirmation humaine** des emplacements externes, pas une restauration effectivement testée. **Backup/restauration SQLite** via Réglages et `restore.ts` est un autre moteur. #81/UX-16 encore indépendant lors de l'audit; **aucune restauration réelle effectuée**.
- **Réglages existants** : thèmes AtoumWeb/Noir/Blanc, densités Compact/Confort/Confort+, aide au survol, chemin workspace, sauvegarde manuelle et restauration SQLite. La mémorisation des vues et recherche des paramètres restent des **cibles** à valider.
- **Bilan** : 10A–10E, **102 scénarios projetés (17+17+20+18+30)**, aucun exécuté et aucun code métier, fichier Client, workspace ou statut sauvegarde modifié. Chaque commit documentaire possède `[skip ci]`.

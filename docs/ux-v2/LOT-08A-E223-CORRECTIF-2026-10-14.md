# Lot 08A — Correction ciblée E223 : souscriptions manuelles date-à-date

**Date :** 14/10/2026  
**Branche :** `feature/ux-v2-lot08a-audit-v1`  
**Commit de code :** `06c1ac12eab61b94b2a5ed16fe9cc1ec16b066ee`  
**État :** implémenté, **non testé** / non fusionné.

## Modification réelle

Dans `src/main/operations/MaintenanceService.ts`, `createSubscription` renseigne maintenant explicitement `period_alignment='anniversary'` à l'INSERT. Seules les **nouvelles créations manuelles** empruntent ce chemin. L'INSERT conserve les autres valeurs, les paramètres et l'état initial `active`.

**Aucune migration ni UPDATE rétroactive** : les lignes historiques avec `period_alignment='calendar'` restent inchangées. La facturation n'est pas modifiée.

## Comportements attendus à prouver en recette

1. Souscription manuelle mensuelle démarrant le 15/10/2026 : la première période générée couvre le 15/10–14/11, la seconde le 15/11–14/12; aucune période civile 01/10–31/10.
2. Idempotence : deux `ensurePeriod` sur la même référence donnent la même période et ne dupliquent pas de checklist.
3. Souscription historique `calendar` conservée : calendrier ancien et périodes existantes inchangés.
4. Abonnement vendu avec configuration `anniversary` : comportement inchangé, pas de double souscription ni changement de liaison commerciale.
5. Début 31 janvier / février, années bissextiles et limites de dates : vérifier les bornes selon `periodBounds` existant.
6. Cadence opérationnelle mensuelle indépendante de la facturation annuelle; quota consommé/réinitialisé par cycle selon les règles existantes. Ne pas en déduire la conformité du non-report sans assertions.
7. Typecheck, tests de maintenance et suite complète, migrations et foreign keys sur SQLite TEMP; pas d'utilisation de Validation-MSI.

## Portée / risques

Le correctif ne change ni `periodBounds`, ni `MaintenanceSubscriptionInput`, ni les services Abby/Devis, ni les historiques. Vérifier que le schéma de la base courante porte bien `period_alignment` et que les consommateurs UI ne présument pas un mode calendaire après création. Éviter de lancer une migration de données à ce titre.

## Preuves manquantes

**Aucun test ni contrôle d'exécution effectué via la connexion GitHub**. La valeur `anniversary` est reconnue dans `SubscriptionRow` et `periodBounds`, mais les scénarios détaillés ci-dessus restent à exécuter localement avant toute déclaration de validation technique ou fusion.

## Suite prioritaire

Tester E223 sur fixtures temporaires, puis injecter des pannes dans `InterventionCompletionService.complete` pour valider E222, notamment le rollback de mouvements pack/activité/handoff. Enfin, auditer les compteurs et shortfalls E224–E225.

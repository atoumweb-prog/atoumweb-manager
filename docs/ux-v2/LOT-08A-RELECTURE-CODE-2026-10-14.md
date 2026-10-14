# Lot 08A — Relecture ciblée du code réel (14/10/2026)

Statut : **audit statique partiel sur `main`**, pas de test exécuté ni de correction métier. Cette note complète le protocole de démarrage et ne clôt pas 08A.

## Sources effectivement lues
- `src/main/operations/InterventionCompletionService.ts` : implémentation complète.
- `src/main/operations/MaintenanceService.ts` : création souscription, création de période, statuts et bornes.
- `src/main/operations/HourPackService.ts` : débit, mouvements, solde.
- `src/main/operations/OperationsService.ts` : création et transitions d'Intervention.
- `src/main/time/TimeSwitchService.ts` : bascule transactionnelle du chrono.
- `src/shared/operations.ts` : types partagés consultés partiellement.

## Vérifications et classement des écarts
| Référence | Constat directement vérifié dans le code actuel | Conclusion à ce stade |
|---|---|---|
| E222 | `InterventionCompletionService.complete` ouvre `SAVEPOINT intervention_complete`, appelle `completeWithinTransaction`, puis `RELEASE`; en erreur `ROLLBACK TO` et `RELEASE`. Les opérations statut/débit/synchronisation sont à l'intérieur de cette enveloppe. | **Le constat historique « absence de transaction extérieure » est obsolète.** Atomicité en cas d'injection de panne **non démontrée** : tester imbrication des savepoints, erreurs de facturation et restauration de toutes les écritures. |
| E223 | `MaintenanceService.createSubscription` insère une souscription sans colonne `period_alignment`. `periodBounds` applique `anniversary` seulement si la valeur enregistrée l'indique. | **Écart confirmé au niveau du chemin manuel** : rendre `anniversary` explicite pour les nouvelles créations et préserver l'existant, après test de caractérisation du schéma et des consommateurs. |
| E224 | `mapPeriod` calcule ses compteurs à partir de requêtes ciblées et distingue des interventions `maintenance_usage_kind='minor'`. | Audit détaillé des règles de consommation routine/mineure encore nécessaire avant correction. |
| E225 | `HourPackService.debitIntervention` utilise `SAVEPOINT hour_pack_debit`, `source_key` et mouvements. `balanceSeconds` est somme des deltas; `consumedSeconds = max(0, purchasedSeconds - balanceSeconds)`. | Anti-doublon et insuffisance à tester : éviter toute interprétation erronée de solde négatif; aucune correction revendiquée. |
| E226 | `TimeSwitchService.switchTo` ferme la session active et ouvre la suivante dans `BEGIN IMMEDIATE`/`COMMIT` avec `ROLLBACK` en erreur; interdit un chrono sur intervention terminée/annulée/archivée. | Propriété transactionnelle visible; garde des brouillons dans l'interface et reprise stale à recetter. |
| E227 | `OperationsService.changeInterventionStatus` accepte un statut du type partagé puis écrit directement le changement. | Audit transitions autorisées et conséquences d'une éventuelle réouverture à compléter; ne pas ajouter de nouveau statut ou bouton. |

## Scénarios de validation prioritaires (non exécutés)
1. **R08A-04** Injecter une exception après débit pack, puis après écriture `completed`, puis lors de la préparation de facturation. Vérifier table Intervention, mouvements, activité, handoff et FK **tous restaurés**. Inclure un échec provenant d'un savepoint imbriqué.
2. **R08A-06/08** Créer un abonnement manuel avec départ 15/10/2026, vérifier les cycles 15/10–14/11 puis 15/11–14/12 après correctif; recharger un abonnement ancien `calendar` sans changer ses bornes.
3. **R08A-03/10/13** Double clôture et double clic, shortfall négatif, reversal, correction de temps après débit; compter exactement les mouvements `source_key` et les handoffs.
4. **R08A-11/12** Bascule chrono, pause, reprise stale et absence de deux sessions actives, y compris après crash simulé.
5. Contrôler UI UX-01 (brouillon, fermeture, changements de contexte, focus) sur trois thèmes × trois densités.

## Dépendances et isolation
Conserver `main` et les branches des lots 03–07 intacts. Ne jamais accéder à Validation-MSI. Tests uniquement sur copies et SQLite TEMP. Avant un correctif métier, comparer le HEAD actuel de `main` et les branches parallèles, localiser les tests existants, confirmer que la règle opérationnelle date-à-date et les plans vendus ne régressent pas.

**Aucun test ni CI n'a été exécuté lors de cette relecture via GitHub.** La protection transactionnelle constatée n'est pas une certification d'atomicité et l'écart E223 n'est pas encore corrigé.

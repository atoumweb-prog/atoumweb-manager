# UX/UI V2 — Lot 08B : cadrage de reprise sur code actuel (14/10/2026)

**Statut : cadrage documentaire uniquement.** Aucun développement 08B, test Electron ou validation humaine revendiqué. Basé sur le référentiel historique PR #82 et la relecture des services du lot 08A.

## Préambule et correction du constat historique E222

Le référentiel `LOT-08B-INTERVENTIONS-DEMANDES.md` (audit 09/10/2026) indique que l'enveloppe de transaction globale de `InterventionCompletionService.complete` reste à créer. Or la version de `src/main/operations/InterventionCompletionService.ts` relue au 14/10/2026 utilise déjà `SAVEPOINT intervention_complete` avec `ROLLBACK TO` en erreur. `InterventionCompletionService.test.ts` couvre déjà des pannes à plusieurs frontières, une transaction parente, les doublons et des préparations de facturation. **Ne pas implémenter une seconde enveloppe transactionnelle sans reproduire une anomalie.** Ces garanties restent à revalider à l'exécution sur le SHA de livraison.

## Porte d'entrée avant 08B

- Valider le correctif 08A E223 et ses tests (`MaintenanceService.ts`, `MaintenanceService.test.ts`) sur SQLite TEMP et Windows.
- Exécuter la suite de clôture existante, les cas d'échecs injectés et le test de consommation routine/mineure.
- Relever `main` et les PR parallèles avant tout portage UI pour ne pas écraser les modifications des lots 03–07.
- Confirmer l'ensemble des liens handler → preload/IPC → service → table → tests pour `OperationsPage`, le chrono global et la facture préparée.

## Invariants UX 08B à réutiliser

1. La **Demande** est distincte de l'**Intervention**, avec conversion explicite, unique et traçable.
2. La fiche intervention respecte les vrais états du type partagé ; aucun statut `reopened` artificiel.
3. Ne pas multiplier les chronos : même chrono global pour Projet, Page et Intervention.
4. Le mode de couverture (maintenance/pack/hors forfait/geste/inclus Projet/interne) reste distinct des indicateurs de temps facturable.
5. Avant **Terminer**, présenter : n° et client, temps validé, mode de couverture, pack/solde ou période/quota, dépassement et préparation éventuelle Abby; exiger une confirmation humaine sans écran mensonger.
6. Aucun retour de succès anticipé si le service ou l'IPC échoue; aucune seconde facturation ni second débit au double clic.
7. Gardes UX-01 et protection des notes non enregistrées dans les changements de fiche, statut et contexte; focus restauré.
8. Réouverture **non à exposer** tant que transitions, mouvements et compensations ne sont pas inventoriés et testés. Les exports/rapports ne doivent pas supposer une émission de facture.

## Découpage de réalisation proposé

- **08B.1** Inventaire précis écran → handler → IPC → service, états et saisies, documentation seule.
- **08B.2** Liste gauche + fiche droite sur primitives UX 01C, sans modification métier; onglets seulement si alimentés par de vrais services.
- **08B.3** Qualification couverture, détail incident, saisies protégées et contrôle des conflits.
- **08B.4** Fenêtre de revue avant clôture reposant sur une projection fiable des conséquences; ne pas dériver de montant ou de solde fictif côté UI.
- **08B.5** Recette R08B-01 à R08B-17, 3 thèmes × 3 densités, non-régression chrono, pack, maintenance, Abby; publication en PR draft après validations.

## Points non résolus

- Exactitude et atomicité d'une éventuelle réouverture après débit ou handoff : décision métier et scénarios de compensation indispensables.
- Le service actuel expose-t-il une **prévisualisation** fiable des consommations avant mutation ? Ne pas fabriquer de simulation UI sans port identifié.
- Les droits sur les actions de clôture/réouverture et l'historique des rapports restent à inventorier.

**Statut de sortie : 08B cadré, non implémenté.** Branches concurrentes, `main`, Validation-MSI et données métier réelles inchangés.

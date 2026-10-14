# Lot 08 — Interventions, Maintenance, Packs et Temps
**Statut : spécification cible.**
## Interventions
Liste à gauche + fiche à droite, fiche agrandissable ; Résumé, Travail, Temps, Prise en charge, Historique. Demandes, incidents, rapports, alertes, sauvegardes opérationnelles et conséquences de terminaison restent accessibles.
Avant terminer : résumé durée réelle, couverture abonnement/pack/facturable, contrôle, puis confirmation ; échec complet = aucune consommation/état partiel ; référence UX-03.
## Maintenance
Liste clients/abonnements, fiche et cycles opérationnels ; distinguer engagement, facturation, période de service, quotas, consommation, renouvellement et échéances. Pour **nouveaux abonnements vendus** date-à-date depuis démarrage réel, même payé annuellement ; 12 cycles pour engagement annuel de 12 mois ; quota sans report. Historique legacy non réécrit.
## Packs
Crédit, utilisé, reste, mouvement par intervention ; idempotence et impossibilité de double débit silencieux ; facturable/non-facturable distinct et documenté.
## Gestion des temps
Une seule session/chrono global, disponible au header, projet, page ou intervention ; pause/reprise/arrêt, changements de contexte, récupération ; liste transversale de sessions, corrections autorisées, rattachements et alertes.
## Ordre proposé
[08A audit et risques réels](LOT-08A-AUDIT-REGLES-ET-PARCOURS.md) ; [08B Demandes/Interventions](LOT-08B-INTERVENTIONS-DEMANDES.md) ; [08C maintenance, cycles et quotas](LOT-08C-MAINTENANCE-CYCLES.md) ; [08D packs/mouvements/dépassements](LOT-08D-PACKS-DEBITS.md) ; [08E chrono global/temps/rapports](LOT-08E-CHRONO-TEMPS-RAPPORTS.md) ; [08F recette transversale](LOT-08F-RECETTE-ET-INTEGRATION.md). **Six dossiers rédigés, uniquement documentaires.**
## Recette
Terminaison pack atomique, cycles mensuels date-à-date, abonné annuel-payé-annuel mais quota mensuel, jamais modifier legacy silencieusement, chrono non dupliqué et temps sur bonne activité, erreur sauvegarde protège brouillon.
## Ouvert
Nouveaux abonnements créés manuellement (UX-02) et statuts de réouverture ; demander décision métier plutôt que modifier arbitrairement.

## État confronté au code le 09/10/2026
- **Présent** : quatre vues Demandes/Interventions/Maintenance/Packs; service de terminaison et prise en charge, crédit/débit Pack transactionnels et anti-doublon; plans/souscriptions/périodes, contrôle de dépassements, rapports; **TimeService/GlobalTimer** avec un chrono, reprise et correction de session.
- **UX-02 non encore homogène** : `MaintenanceService.createSubscription` manuel ne fixe pas `period_alignment='anniversary'` alors que la voie vente `OperationalSalesService` peut le définir. Le nouveau contrat manuel doit **respecter la date réelle de départ et les 12 cycles mensuels même payé annuellement**, sans toucher les abonnements `calendar` existants.
- **UX-03 à prouver** : `InterventionCompletionService.complete` enchaîne statut, débit et facturation sans transaction englobante visible dans cette méthode. Des tests de panne inter-étapes doivent déterminer si l'ensemble est atomique; ne pas annoncer la correction déjà livrée.
- **Pack** : mouvements réversibles avec provenance, débits idempotents; solde négatif et décision de dépassement. **Chrono** : session unique, catégories techniques et métier distinctes, `switchTo` transactionnel.
- **Bilan** : **08A–08F, 109 scénarios futurs** (14+17+18+15+19+26), **zéro scénario exécuté** et aucun logiciel/budget/Validation-MSI touché par cette documentation. Ne pas confondre Lot 08 UX V2 et « Lot technique 8A » des modèles d'actions opérationnelles.

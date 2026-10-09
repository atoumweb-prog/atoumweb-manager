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
08A audit règles de cycle/UX-02 et UX-03 ; 08B Interventions ; 08C maintenance/cycles ; 08D packs ; 08E temps global et rapports ; 08F recette.
## Recette
Terminaison pack atomique, cycles mensuels date-à-date, abonné annuel-payé-annuel mais quota mensuel, jamais modifier legacy silencieusement, chrono non dupliqué et temps sur bonne activité, erreur sauvegarde protège brouillon.
## Ouvert
Nouveaux abonnements créés manuellement (UX-02) et statuts de réouverture ; demander décision métier plutôt que modifier arbitrairement.

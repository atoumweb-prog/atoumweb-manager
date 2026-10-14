# UX/UI V2 — Lot 08A : ouverture et protocole d'audit (14/10/2026)

> Statut : **audit ouvert, non validé**. Document de préparation uniquement. Aucun service, migration, écran, test ou donnée métier modifié par ce commit.

## Référentiel et périmètre
- Source de vérité UX V2 : PR #82, commit `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`, notamment `docs/ux-v2/LOT-08A-AUDIT-REGLES-ET-PARCOURS.md`.
- Base de cette branche : `main` au moment de sa création. Avant toute implémentation, relever explicitement son SHA et celui de chaque branche concurrente.
- Lot 08 UX V2 : Demandes, Interventions, Maintenance, Packs d'heures, Temps/Chrono et recette 08A–08F. Ne pas confondre avec anciens lots opérationnels/Bridge 8A–8B.
- Chantiers UX V2 04–07 indépendants : ne modifier ni Catalogue/CGV/Devis, ni Projet/Bridge, ni leurs branches, ni `main` sans intégration coordonnée.

## Ordre de travail
1. **08A.1 — Inventaire vérifié** : confronter le référentiel historique aux sources actuelles (`OperationsPage`, `OperationsService`, `InterventionCompletionService`, `MaintenanceService`, `OperationalSalesService`, `HourPackService`, `TimeService`, `TimeSwitchService`, `GlobalTimer`, `TimePage`, rapports et types partagés). Consigner fichiers, fonctions, handlers, IPC, services, tables et tests; marquer chaque assertion « vérifié » ou « reste à vérifier ».
2. **08A.2 — Reproductions sûreté** : défaut potentiel E222 (échec entre statut, débit, synchronisation de facturation), E223 (nouvel abonnement manuel : alignement date-à-date), E224 (composition des compteurs et routines), E225 (pack et shortfall), E226 (saisie UX-01), E227 (réouverture contrôlée).
3. **08A.3 — Tests de caractérisation** : lancer les 14 cas R08A-01–14 sans réécrire des assertions pour masquer les échecs. Utiliser uniquement fixtures SQLite/TEMP, vérifier intégrité et foreign keys et conserver les preuves par SHA exact.
4. **08B–08E — incréments métiers séparés** : n'implémenter qu'après inventaire des chemins existants et identification des dépendances au code des autres lots. Conserver les schémas/historiques et les services existants.
5. **08F — recette transverse** : typecheck, Vitest complets, tests de restaurations et migrations, recettes Electron sur 3 thèmes × 3 densités, chrono unique, transitions et pertes de brouillon, puis proposition d'intégration non automatique.

## Invariants non négociables
- **UX-02** : nouveaux abonnements manuels avec cycles opérationnels de date à date dès la date de début du service; quota réinitialisé sans report; facturation annuelle distincte de la cadence opérationnelle mensuelle; abonnements historiques inchangés.
- **UX-03** : clôture d'intervention contrôlée et atomique après revue du temps, de la couverture, du solde/quota et de la facturabilité; échec sans effets partiels confirmés. Ne pas prétendre l'atomicité prouvée tant que l'injection de panne n'a pas passé.
- Un seul chrono global (Projet/Page/Intervention), pauses non comptées; corrections de temps sans double débit.
- Traçabilité, provenance, idempotence des mouvements de pack et de la préparation de facturation; aucune émission Abby automatique ni vente fictive.
- Gardes UX-01, saisies et focus conservés; protection des écritures concurrentes.
- **Aucune utilisation de Validation-MSI** ou d'une base client réelle pour les essais. Pas de fusion, force-push, suppression de branche ou déclenchement volontaire de CI supplémentaire par ce démarrage.

## État des preuves
À la création de ce document : **aucun** test du lot 08A exécuté, aucun écart E222–E227 confirmé sur la base courante, aucune recette humaine revendiquée. Le texte de PR #82 est un audit historique du 09/10/2026, non une preuve du HEAD actuel.

## Porte de sortie 08A
Tableau de correspondance des sources et interactions actuel, 14 scénarios caractérisés avec résultats réels, risques et dépendances classés, plan de changements minimal rédigé. L'acceptation technique et la fusion restent deux décisions distinctes.

# Lot 08A — Inventaire réel Interventions / Maintenance / Packs / Temps

**Statut : audit statique et règles UX V2, aucune implémentation ou recette exécutée.**
**Source : `atoumweb-manager/main` inspecté le 09/10/2026.** Relever le HEAD après les éventuelles intégrations #81/#83 avant le code. Ne pas confondre **Lot 08 UX V2** avec les **lots techniques opérationnels 8A/8B** des modèles de production, décrits dans `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md`.

Références : [Lot 08](LOT-08-OPERATIONS-TEMPS.md), [07B Projet/temps](LOT-07B-FICHE-PROJET-PRODUCTION.md), [06E Devis/Abby](LOT-06E-ABBY-REVISIONS-PROJET.md), [01E garde UX-01](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Inventaire des états métier et fonctions observés
| Objet / source | État réel dans les services | Limite / cible V2 |
|---|---|---|
| `OperationsPage.tsx` | Quatre vues **Demandes / Interventions / Maintenance / Packs d'heures**, liste gauche + fiche droite, fiche Intervention agrandissable, filtres et alertes. | Conserver structure et parcours; états, consommations et provenance plus explicites. |
| `OperationsService.ts` | Demandes `new/to_qualify/waiting_client/planned/converted/closed/archived`; transformation d'une demande en une Intervention, refus d'une seconde conversion, traçage d'origine. | **Une demande n'est pas une Intervention** et une Intervention ne naît pas automatiquement de la simple consultation d'une demande. |
| `OperationsService.ts` / `shared/operations.ts` | Intervention `to_plan/planned/in_progress/waiting_client/blocked/to_validate/completed/cancelled/archived`; couverture `maintenance/hour_pack/out_of_scope/commercial_gesture/included_project/internal`; incidents avec criticité, cause, diagnostic, solution, suivi. | Aucun statut `reopened` dédié dans l'union partagée : une réouverture doit être une **transition contrôlée de statut**, jamais un état inventé. |
| `InterventionCompletionService.ts` | Vérifie période maintenance ou pack, passe par `to_validate`, débite via `HourPackService.debitIntervention` ou synchronise `MaintenanceOverageService/BillingHandoffService`; idempotence du débit pack établie dans service. | **E222 : atomicité complète à prouver.** Le service `complete` ne montre pas une **transaction extérieure unique** englobant changement de statut, débit/sync et facturation ; ses services sous-jacents ont leurs propres transactions. Tester injection de panne **entre étapes** ; éviter d'affirmer aujourd'hui « aucun état partiel possible ». |
| `HourPackService.ts` | Pack `active/exhausted/expired/suspended/archived` ; mouvements `initial_credit/intervention_debit/manual_correction/commercial_credit/reversal`, historique et `source_key` anti-doublon; débit transactionnel. | Crédit, débit, solde et conséquences de dépassement doivent être visibles avant clôture. Le mouvement manuel peut être positif/négatif selon droits et règle. |
| `HourPackShortfallService.ts` | Analyse historique des débits et décisions de manque de crédit, possibilité de traitement commercial/facturation. | Solde négatif / insuffisant **ne doit pas être masqué ou ramené silencieusement à zéro**. |
| `MaintenanceService.ts` | Plans actifs/archivés; souscriptions actives/suspendues/terminées/archivées; périodes `upcoming/open/to_do/in_progress/completed/closed`; checklist `todo/done/not_applicable`; `ensurePeriod` idempotent. | Différencier modèle, **abonnement** et **période opérationnelle** et afficher leur provenance. |
| `MaintenanceService.periodBounds` | `anniversary` = date à date depuis `startDate`, sinon `calendar` = début/fin de mois, trimestre ou année civile. | **E223 / UX-02 :** les nouveaux abonnements **manuels** `createSubscription` n'écrivent pas `period_alignment='anniversary'`, contrairement aux abonnements vendus pouvant le configurer via `OperationalSalesService`. Choix métier déjà validé : **date-à-date par défaut sur les nouveaux manuels aussi**, sans migration d'historiques. |
| `OperationalSalesService.ts` | Vente acceptée crée souscription avec snapshots, `period_alignment`, échéance de facturation `billingPeriod` et cycles `cadence` distincts ; `carryoverMode:'none'` pour les plans créés depuis ventes. | Respecter les règles validées : mensualité opérationnelle indépendante de paiement annuel; pas de quota reporté sur les nouveaux engagements. |
| `MaintenanceOverageService.ts` | `review/decide`, interventions hors quota, choix `bill_out_of_scope` ou alternatives selon politique historique, synchronisation `BillingHandoff`. | Ne pas supprimer les modes `carryover` historiques du modèle au seul motif que les **nouveaux** abonnements ne les autorisent pas. |
| `MaintenanceReportService.ts` et `MaintenanceReportPanel.tsx` | Rapport de période, notes/brouillon, checklist, interventions et cumul quota/temps. | Ne pas présenter une rédaction de rapport comme un contrôle de conformité/une émission Abby automatique. |
| `TimeService.ts` / `TimeSwitchService.ts` | Un `time_sessions` actif, `start/switchTo/pause/resume/recoverResume/stop/stopAtLastKnown/addManual/update`, motifs pause, contrôle action cible et bascule transactionnelle. | Une seule session même à travers header/Projet/Page/Intervention; `switchTo` ne fait pas perdre la précédente. |
| `GlobalTimer.tsx` / `TimePage.tsx` | Chrono global avec reprise après session « stale » (>90 s), catégorie technique + catégorie métier, saisie/correction, filtre facturable/non facturable, Today/Week/Month. | Distinguer **temps réalisé**, temps **facturable** et temps **débitable d'un pack** ; correction et historique sans décompter une deuxième fois. |

## 2. Décisions métier à conserver
- **UX-02 — Nouveaux abonnements** : démarrage réel de service; cycles opérationnels date à date (p. ex. 15/10–14/11, 15/11–14/12) et **12 cycles mensuels** sur 12 mois, même payés en une fois annuellement. Chaque cycle a son quota, **sans report**. **Historique antérieur préservé**.
- **UX-03 — Intervention** : clôture contrôlée après examen de la durée réelle, couverture, crédits/quotas, facturabilité et conséquences; échec = **pas d'état/billing/crédit partiellement validés** après correction éventuelle du service.
- **UX temps** : chrono global unique, pauses non comptées, récupération explicitée; correction de session et mouvement de pack **ne sont pas la même action**.
- **Contrats/Abby** : un abonnement opérationnel vendu naît seulement du devis **réellement accepté**, pas du projet prévisionnel; la facture réelle reste gérée via Abby hors API payante.
- **Catalogue** : les offres de maintenance/pack sont sources commerciales, mais une souscription manuelle ne doit pas créer de vente fictive ni recopier silencieusement une version contractuelle.
- **Validation-MSI** : aucun démarrage de l'app métier, migration, test, export ou création de démo sur la base réelle; fixtures SQLite et fichiers temporaires uniquement.

## 3. Écarts ciblés de sûreté
- **E222** : `InterventionCompletionService.complete` n'encadre pas visiblement *tous* les effets par un seul savepoint/transaction externe. Tester l'injection de panne après le débit pack, après le passage `completed` et pendant la préparation de facturation, **sans modifier d'abord les assertions**.
- **E223** : `MaintenanceService.createSubscription` manuel n'impose pas `anniversary` et son formulaire n'expose pas l'alignement/date-à-date; à unifier sur les **créations nouvelles** sans réécriture automatique des abonnements existants.
- **E224** : compteurs de maintenance : `mapPeriod` inclut `routineSeconds` dans `usage.usedSeconds` mais calcule `remainingSeconds` sur les `usedSeconds` « mineurs » ; vérifier le contrat des quotas avant de déclarer les chiffres contradictoires (routines peuvent être hors quota par règle).
- **E225** : pack mouvements manuels, reversals, dépassements, effets de facturation; prévisualisation des conséquences et idempotence du clic.
- **E226** : gardes UX-01 sur fermeture de fiche/overlay, changements de période/statut pendant édition et rafraîchissements des sessions.
- **E227** : réouverture d'Intervention/période clôturée, autorisation et éventuelles annulations de mouvements/facturation; ne pas inventer un bouton « Réouvrir » qui contourne le service.

## 4. Recette initiale (14 scénarios, à exécuter ultérieurement)
| ID | Cas | Attendu |
|---|---|---|
| R08A-01 | Demande puis transformation | Une seule Intervention, origine conservée |
| R08A-02 | Créer Intervention directe | Couverture explicitement choisie et Client exact |
| R08A-03 | Clore Intervention pack deux fois | Un seul débit sur même `source_key` |
| R08A-04 | Échec injecté après débit | Aucun statut/mouvement partiellement confirmé (cible UX-03) |
| R08A-05 | Clore hors forfait | Une seule préparation de facturation Abby, pas facture émise |
| R08A-06 | Souscription manuelle démarrant le 15 | Nouveau cycle doit devenir 15→14 **après correctif E223** |
| R08A-07 | Abonnement vendu payé annuellement | 12 cycles opérationnels mensuels s'il s'agit d'un engagement 12 mois |
| R08A-08 | Ancienne souscription `calendar` | Bornes historiques inchangées |
| R08A-09 | Quota « sans report » sur nouveau vendu | Pas de crédit transféré à période suivante |
| R08A-10 | Dépassement maintenance/pack | Décision visible avec justification, pas d'autofacture |
| R08A-11 | Changement de contexte chrono | Une seule session active et bon Projet/Page/Intervention |
| R08A-12 | Crash/reprise chrono | Récupération explicite selon dernière activité connue |
| R08A-13 | Correction de temps ancien | Pas de double débit de pack ni suppression historique |
| R08A-14 | Tests SQL/compteurs/CI | Fixtures isolées, SHA, pas Validation-MSI |

**La CI de #84 ou #81 ne valide pas ces exigences UX V2 et aucun nouveau test n'a été exécuté ici.**

# Lot 08C — Maintenance : plans, abonnements, cycles, checklist et dépassements

**Statut : cible V2 spécifiée; pas de modification de souscription, de migration ni de test.** Lecture `main` du 09/10/2026.  
Références : [08A inventaire](LOT-08A-AUDIT-REGLES-ET-PARCOURS.md), [08B interventions](LOT-08B-INTERVENTIONS-DEMANDES.md), [08F recette](LOT-08F-RECETTE-ET-INTEGRATION.md), [06E vente Abby](LOT-06E-ABBY-REVISIONS-PROJET.md).

## 1. Règle UX-02 déjà approuvée — et ses deux composantes
**Période opérationnelle** : pour un **nouvel abonnement**, cycle **mensuel date à date** à compter de la **date réelle de démarrage du service**, indépendant de la périodicité de paiement. Exemple concret : démarrage **15/10/2026**, période 1 **15/10–14/11**, période 2 **15/11–14/12** ; un engagement de 12 mois comporte **12 cycles mensuels**. Si payé en une fois annuellement, les quotas opérationnels sont tout de même **remis à disposition à chaque cycle**. **Aucun report des quotas** d'une période à l'autre pour les nouveaux engagements.

**Facturation** : annuelle, mensuelle ou modalités acceptées dans le Devis (Abby), éventuellement différentes de la cadence des actions de maintenance. La facturation ne détermine ni les dates des cycles ni leur quota.

**Conservation** : les abonnements existants `periodAlignment='calendar'` et les règles historiques de report `none/next_period/custom` demeurent dans leur contexte; **aucun backfill/renumérotation automatique** de périodes anciennes.

## 2. Code actuel, sans confondre les chemins de création
| Source | Réalité observée | Écart V2 |
|---|---|---|
| `MaintenanceService.createPlan/updatePlan` | Plan prix/frequence `monthly/quarterly/yearly`, quota d'interventions/minutes et `carryoverMode`, modèle checklist et notes. | Plan n'est **pas** une vente ni un abonnement Client ; afficher le snapshot avant nouveau contrat. |
| `MaintenanceService.createSubscription` | Création manuelle avec Client/Projet/plan, date de début/fin, prix convenu, snapshot du plan et état `active`. **Ne fixe pas `period_alignment`** dans son `INSERT`. | **E223/UX-02 à corriger dans le service** : date-à-date sur les **nouveaux abonnements manuels**, pas simple étiquette de formulaire. |
| `MaintenancePanel.tsx` | Création plan/souscription, sélection Client/Projet, date et prix ; `ensureCurrentPeriod`, checklist et rapports. | L'interface **n'offre pas explicitement la séparation facturation / cycle opérationnel** lors de la création manuelle ; montrer cadence et 12 périodes au lieu d'une période « mois civil » trompeuse. |
| `MaintenanceService.periodBounds` | Deux algorithmes : `anniversary` à partir de `startDate`, `calendar` par mois/trimestre/année civils. | L'algorithme `anniversary` existe déjà : à réutiliser **sans casser les historiques calendar** ni traitement des dates en fin de mois. |
| `OperationalSalesService.provision` | Pour vente acceptée, crée une souscription et définit `period_alignment` suivant politique commerciale, crée des cycles via `ensureCycles`; `billingPeriod` et `cadence` séparés; plan `carryoverMode='none'`. | Les règles de **catalogue/politique** doivent décider la cadence des nouveaux forfaits ; ne pas modifier le prix accepté ou créer un deuxième abonnement lors d'un rejeu. |
| `MaintenanceService.ensurePeriod` | Idempotence si même `subscriptionId + periodStart + periodEnd`; copies checklist, routines et options récurrentes applicables dans transaction. | Garde sur calendrier, chevauchements, fin d'engagement, périodes passées/à venir et dates courtes (28–31). |
| `MaintenanceService.mapPeriod` | Statut, consommation, interventions mineures vs routine, secondes, remaining/overage et checklist; `routineSeconds` suivi séparément. | **E224** : valider la définition réelle de « temps de quota » ; l'affichage `usedSeconds` inclut routines alors que `remainingSeconds` utilise mineures, ce qui **peut être intentionnel**. |
| `MaintenanceOverageService` | Détecte interventions hors quota et enregistre décision facturer/traiter selon contrat; synchronisation BillingHandoff. | Afficher **dépassements et décisions** avant clôture de période; pour les nouveaux contrats sans report, **pas** de bouton « Report » disponible. |
| `MaintenanceReportPanel` | Rapport Client de période avec brouillon, notes, checklist, interventions, consommation. | Rapports datés/versionnés, contrôles de couverture, et statut de validation; ne pas envoyer/considérer signé implicitement. |

## 3. Fiche abonnement cible
**Liste gauche** : Client, offre/plan, état, date de début et fin, **période opérationnelle en cours**, dernière intervention, alertes quota/échéance.  
**Fiche droite agrandissable** :
- **Résumé contrat** : Client/Projet, provenance Devis Abby si vendu, référence/version Catalogue, démarrage réel, durée d'engagement, facturation et montant convenu, état.
- **Cycles** : ligne chronologique des périodes `start/end`, statut, checklist, quotas disponibles/utilisés/restants, nombre d'interventions et types; indicateurs « Sans report », « Paiement annuel » distincts.
- **Travail du cycle** : modèles checklist, routine, Intervention initiée volontairement par `prepareRoutine`, chrono et rapport. Une routine est à distinguer d'une **intervention mineure hors quota**.
- **Dépassements** : vue `MaintenanceOveragePanel`, décision justifiée et montant éventuel; la clôture exige résolutions prévues par le contrat/service.
- **Historique et documents** : versions contrat/clauses, notes, état de pièces et ancienne période conservée.

## 4. UX-02 — parcours création manuelle nouveau
1. Choisir **Client**, plan/Service lié s'il existe, Projet éventuel, date réelle de démarrage et durée d'engagement ; **aucune création implicite de Devis accepté**.
2. Afficher une **prévisualisation de 12 cycles mensuels** pour engagement de 12 mois : dates calculées, quota par cycle, sans report, même si paiement annuel.
3. Afficher la facturation comme donnée distincte (fréquence/montant/source) ; **ne pas introduire un champ de paiement fictif dans `createSubscription`** : si stockage manque, concevoir migration/API minimale avant action.
4. Créer l'abonnement avec **`periodAlignment='anniversary'` + bonne fréquence opérationnelle**, en respectant les snapshots, et afficher la première période admissible. Les anciennes souscriptions restent **calendar**, telles qu'enregistrées.
5. Si le nouveau contrat est **annuel payé annuellement mais avec quotas mensuels**, garantir que la même année de service est découpée en **12 périodes** sans créer 12 factures Abby.
6. Contrôler les mois courts (31 janvier → février), débuts en fin de mois, année bissextile, renouvellement et clôture anticipée. Pour les dates à 29/30/31, calculer les bornes depuis la **date d'origine** de chaque cycle, pas en chaînant la fin du mois précédent.
7. Une souscription `suspended/ended/archived` n'est pas une souscription active ouvrant automatiquement de nouvelles périodes; gérer les changements d'état selon transitions métier validées.

## 5. Politique des quotas et historiques
- **Nouveaux contrats** : quota interventions et/ou temps selon version acceptée, acquis **par cycle**, pas addition sur l'année entière et **pas report** automatique. Le module `carryover` historique ne doit pas être supprimé du schéma.
- **Dépassements** : ne bloquent pas nécessairement le travail; exigent une décision explicite/justifiée avant clôture selon politique. Une facturation complémentaire est un élément à traiter, **pas une facture Abby envoyée**.
- **Intervention de routine** : documenter si elle compte ou non dans quota d'interventions/minutes. Ne pas inventer la règle depuis l'UI.
- **Contrat modifié** : nouvelles conditions dans **nouvelle version/période appropriée**; ne pas modifier une période déjà close, ses interventions ou son rapport.
- **Sorties/aperçu** : ne pas prétendre qu'une checklist exécutée ou un rapport enregistré signifie conformité légale ou absence d'incident.

## 6. Recette prévue (18 cas, non exécutés)
| ID | Scénario | Attendu |
|---|---|---|
| R08C-01 | Nouvelle souscription manuelle 15 octobre | Période 15/10–14/11, non mois civil |
| R08C-02 | Deuxième mois de ce contrat | Période 15/11–14/12 |
| R08C-03 | Nouveau annuel payé d'un coup | **12 cycles opérationnels mensuels**, une période de facturation annuelle |
| R08C-04 | Rejouer `ensurePeriod` | Même ID, pas double checklist |
| R08C-05 | Abonnement `calendar` existant | Anciennes périodes inchangées |
| R08C-06 | Nouveau contrat sans report | Nouveau quota remis, solde précédent non transféré |
| R08C-07 | Ancien contrat `next_period` | Sa règle historique conservée |
| R08C-08 | Démarrage 31 janvier | Fenêtres calculées depuis origine sans dérive |
| R08C-09 | Fin février bissextile | Périodes contiguës et sans chevauchement |
| R08C-10 | Fin d'engagement au milieu d'un cycle | Dernière période bornée sans débordement |
| R08C-11 | Souscription suspendue | Pas de création de période active sans autorisation |
| R08C-12 | Modifier plan après vente | Souscription conserve prix et quota snapshots |
| R08C-13 | Routine de checklist → intervention | Une intervention, provenance de contrôle |
| R08C-14 | Rapport de période | Checklist, consommation et interventions correctes |
| R08C-15 | Quota saturé → dépassement | Décision et montant éventuels visibles, pas facture Abby créée |
| R08C-16 | Clôture d'une période avec dépassement sans décision | Refus/alerte selon service et règles validées |
| R08C-17 | Statuts/brouillon, navigation entre cycles | Pas de perte de saisie (UX-01) |
| R08C-18 | Recette SQLite/migrations, interface 3 thèmes×3 densités | Anciens abonnements préservés, Validation-MSI non touchée |

## 7. Écarts à instruire
**E233** alignement date-à-date des créations manuelles et leur migration additive sans historique réécrit; **E234** conditions commerciales facturation indépendante de la cadence métier; **E235** bornes fin-de-mois et calcul de 12 cycles; **E236** définition quota mineur vs routine/temps; **E237** report historique vs non-report des nouvelles souscriptions; **E238** revalidation des statuts de période et des décisions de dépassement.

**Concevoir/recetter UX-02 ne signifie pas que les nouveaux abonnements manuels sont déjà corrigés.**

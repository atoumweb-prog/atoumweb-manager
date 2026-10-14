# Lot 08E — Chrono global, temps, corrections et rapports de maintenance

**Statut : spécification UX/UI V2, aucune exécution de test ou modification de service.** Code `main` inspecté le 09/10/2026.
Références : [08A inventaire](LOT-08A-AUDIT-REGLES-ET-PARCOURS.md), [08B Interventions](LOT-08B-INTERVENTIONS-DEMANDES.md), [08C cycles](LOT-08C-MAINTENANCE-CYCLES.md), [08D Pack](LOT-08D-PACKS-DEBITS.md), [07D Page et chrono](LOT-07D-SITES-PAGES-COMPOSITION.md).

## 1. Source unique : `time_sessions`
Le **GlobalTimer** du header et les boutons « ▶ Démarrer le travail » des Projets, Pages et Interventions utilisent **un seul service et une seule session active** : `time.active/start/switchTo/pause/resume/stop`. Une fiche ne construit pas son propre compteur concurrent.

`TimeService` distingue la **session horodatée** de ses **pauses**; `TimeSwitchService.switchTo` clôt l'ancienne et ouvre la nouvelle dans une **transaction**. Le temps comptabilisé exclut les pauses, pas seulement l'intervalle début–fin. Les sessions manuelles et importées ont `source='manual'/'import'` et ne doivent pas être affichées comme si un chrono les avait produites.

## 2. Code actuel et cibles de lisibilité
| Source | Réel existant | Cible V2 |
|---|---|---|
| `src/shared/time.ts` | `active/start/switchTo/heartbeat/pause/resume/recoverResume/stop/stopAtLastKnown/addManual/update/list/summary`, catégories techniques, motifs de pause et filtres. | Centraliser nom d'activité, rattachement exact, facturabilité et catégories métier dans les contrôles visibles. |
| `TimeService.ts` | Empêche `start` si session déjà active, contrôle Project/Node/Intervention et saisie manuelle, conserve pauses. | Ne pas créer de seconde session en rouvrant un panneau; messages de refus utiles, pas de perte du contexte. |
| `TimeSwitchService.ts` | Contrôle contexte cible, refuse bascule avec session non récupérée après heartbeat obsolète et transaction stop+start. | Aperçu du **changement de Projet/Page/Intervention** avant `switchTo`, aucune attribution de temps à la mauvaise Page. |
| `GlobalTimer.tsx` | Chrono actif, timer context `atoumweb:timer-context`, pause avec motifs, avertissement de récupération si >90 secondes sans signal, dialogue de changement/arrêt. | Distinction **en cours / en pause / récupération requise**, commandes visibles par clavier, panneau accessible et info contextuelle constante. |
| `TimePage.tsx` | Filtres Aujourd'hui/Cette semaine/Ce mois, Client/Projet/catégorie/facturabilité, KPI, ajout manuel et correction d'une session **terminée**. | Filtres croisés, audit des modifications, durées facturables/non facturables, provenance et rôle correct. |
| `TimeCorrectionService.ts` | Service de correction dédié, contrôles de sessions et reprise/écriture historiques. | Motif exigible selon action/permissions, conservation des pauses, rectification des Pack/quotas **sans second débit automatique**. |
| `MaintenanceReportPanel` / `MaintenanceReportService` | Rapport de période avec notes, contrôles, interventions et compteurs, édition de brouillon. | Distinguer brouillon, validé humainement, export/communication réellement faits; pas d'email/Abby supposé. |
| `ProjectTimeTab.tsx` | Sessions sur Projet et catégories, comparaison estimé/réel. | Si `commercialState=provisional`, temps interne de préparation, pas de prestation Client déjà acceptée. |

## 3. Parcours du chrono — décisions UX
1. **Ouvrir** : afficher état exact (repos/en cours/en pause/récupération) et contexte Projet, Page, tâche ou Intervention.
2. **Démarrer** : avant écriture, choisir activité et type de temps. La catégorisation **technique** (`development/design/...` selon enum réelle) et **métier** (`Inclus au forfait`, `Supplément facturable`, `Avant-vente`, `Interne`, `Garantie corrective`) restent **deux dimensions distinctes**.
3. **Facturable / non facturable** : choix explicite, non inféré automatiquement du nom de l'activité; une heure déclarée facturable **ne déclenche pas à elle seule une facture Abby**.
4. **Changer de contexte** : proposer « Arrêter A puis démarrer B » avec effet lisible, `switchTo` atomique; si B n'est pas admissible (cible/lien/période), **A reste active**.
5. **Pause** : motif `need_information/not_enough_time/other_emergency/other` et note facultative selon politique; ne compter ni minute en pause ni temps supplémentaire à la reprise.
6. **Reprise tardive après interruption** : si heartbeat obsolète, proposer **Reprendre / Arrêter au dernier point connu**; aucune addition silencieuse de temps lorsque l'application ne sait pas ce qui s'est passé.
7. **Arrêter** : clôt la session, conserve pauses, catégorie, contexte et horodatage; une seconde commande arrête/renvoie l'état sans ajouter une autre session fictive.
8. **Corriger manuellement** : depuis la session terminée, changer dates/contexte/catégorie/note/facturable dans les limites du service et **journaliser la correction**. Ne jamais modifier une session verrouillée par facturation ou mouvement pack sans procédure de régularisation adaptée.
9. **Rafraîchir** : le compteur d'écran dérive du serveur + horodatage de référence, pas d'un calcul de temps indépendant par composant.

## 4. Page Gestion des temps — structure V2
- En tête : **chrono unique**, durée active, Client/Projet/Intervention/Page et badge facturable/non facturable.
- KPIs : temps total (hors pauses), temps facturable, temps non facturable et sessions; préciser l'intervalle du filtre et source.
- Barre filtres : période, Client, Projet, Intervention si lié, catégorie technique/métier, facturabilité, source, statut; réinitialisation simple, recherche.
- Tableau : date, contexte hiérarchique **Client → Projet → Page/tâche/Intervention**, nom activité, durée nette, pauses, type facturable, source et bouton Corriger pour session terminée.
- Panneau de correction : anciennes/nouvelles valeurs, motif, aperçu différence nette, origine/impact sur **pack d'heures** ou **quota maintenance** lorsque lié, confirmation; garder saisie en erreur et garde UX-01 sur sortie.
- États vides, sessions actives, session en pause et session devenue obsolète sont distincts; pas de badge basé sur couleur seule.

## 5. Maintenance, rapports et utilisation des temps
- Les **rapports maintenance** présentent checklist, routines, interventions, jours, quota d'interventions, minutes couvertes, minutes restantes et décisions de dépassement selon définitions **validées** du service. Un chiffre de routine utilisé dans le total mais hors quota reste **libellé comme tel**, pas confondu.
- Rapport en **brouillon** = document interne; envoi/validation Client **ne sont pas présumés** par un enregistrement, un export ou un clic d'ouverture.
- Les périodes sont liées à `subscriptionId/periodId` et les interventions au bon ID; une correction de temps sur une période close demande politique de régularisation **sans réécrire l'ancien rapport silencieusement**.
- L'activité d'un Projet **prévisionnel non signé** est du **temps interne de préparation**, sans dette Client ni facturation automatique avant acceptation Abby.

## 6. Recette prévue (19 scénarios, non exécutés)
| ID | Cas | Attendu |
|---|---|---|
| R08E-01 | Démarrer timer depuis header | Une session active |
| R08E-02 | Démarrer timer depuis Page du Projet | Même service, bon `projectNodeId` |
| R08E-03 | Tenter un deuxième `start` brut | Refus plutôt que second timer |
| R08E-04 | Basculer Projet A → B | A terminée, B active, pas chevauchement |
| R08E-05 | B cible inadmissible | A conserve sa session, pas de bascule partielle |
| R08E-06 | Pause de 20 minutes | Durée hors pause exacte |
| R08E-07 | Changer motif pause | Motif conservé avec bonne session |
| R08E-08 | Timer >90 s sans heartbeat | Récupération proposée, pas de temps inventé |
| R08E-09 | Choisir arrêter au dernier point connu | Fin bornée et historique correct |
| R08E-10 | Reprendre après incident | Session reprise selon décisions explicites |
| R08E-11 | Ajouter 45 min manuelles | Source `manual`, pas `timer` |
| R08E-12 | Corriger session terminée | Durée nette et notes corrigées, pauses respectées |
| R08E-13 | Corriger session liée à un pack débité | Pas de second débit total; règle de régularisation |
| R08E-14 | Filtrer facturable/non facturable | KPIs et liste cohérents |
| R08E-15 | Pré-projet Devis non signé | Temps classé préparation interne, pas facture |
| R08E-16 | Rapport maintenance avec routine + intervention mineure | Comptages séparés, quota selon règle validée |
| R08E-17 | Quitter correction dirty | Garde UX-01 |
| R08E-18 | Cliquer/Clavier en petite fenêtre, thèmes/densités 3×3 | Timer et corrections accessibles >=14 px |
| R08E-19 | Tests SQLite / time recovery / IPC | Sessions intactes, Validation-MSI non touchée |

## 7. Écarts techniques à instruire
**E245** régularisation temps→pack/maintenance après correction; **E246** attribution Projet provisoire/Client dans le timer; **E247** affichage/permissions des catégories métiers et de facturabilité; **E248** statut de rapport diffusé/validé; **E249** garde UX-01 sur correction, fenêtre/panneau; **E250** borne temporelle de reprise et synchronisation Windows.

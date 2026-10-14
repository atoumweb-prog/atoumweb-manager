# Lot 08B — Demandes, Interventions, incidents et clôture sécurisée

**Statut : conception UX/UI V2 uniquement, non implémentée/non testée.** Code lu dans `main` le 09/10/2026.
Sources : [08A état réel](LOT-08A-AUDIT-REGLES-ET-PARCOURS.md), [08D Packs](LOT-08D-PACKS-DEBITS.md), [08E Temps](LOT-08E-CHRONO-TEMPS-RAPPORTS.md), [01E formulaires](LOT-01E-FORMULAIRES-CONFIRMATIONS.md), [06E Devis/Abby](LOT-06E-ABBY-REVISIONS-PROJET.md).

## 1. Entrées et organisation des écrans
- `OperationsPage.tsx` affiche **Demandes, Interventions, Maintenance, Packs d'heures** ; conserver les quatre vues. Interventions = **liste gauche / fiche droite**, avec **Agrandir**, séparateur ajustable, filtres. Les KPI urgences/activité/attente Client viennent des données réelles et n'ajoutent aucune intervention.
- Dans **Demandes** : identifiant, client, éventuel Projet, canal (`email/phone/website_form/message/meeting/atoumweb_detection/other`), priorité, sujet, date et prochaine action. Une demande peut être close sans intervention ; **Transformer en intervention** est explicite et conserve `sourceRequestId`.
- Dans **Interventions** : numéro, Client et Projet exacts, éventuelle action de projet, couverture, état, priorité, type (`correction/modification/addition/maintenance/incident/support/training/other`), échéance et temps réel.
- **Fiche cible** : onglets **Résumé / Travail / Temps / Prise en charge / Historique**, et panneaux contextuels **Incident / Sauvegarde / Rapport** lorsque réellement applicables. Un onglet sans service n'est pas présenté comme fonction opérationnelle.
- Les états réels d'une Intervention sont `to_plan/planned/in_progress/waiting_client/blocked/to_validate/completed/cancelled/archived`, sans pseudo-statut `reopened`. La réouverture éventuelle s'exprime par **transition contrôlée** et conservation du journal/effets.

## 2. Qualifier la prise en charge
| Couverture réelle | Signification UI | Contrôles préalables |
|---|---|---|
| `maintenance` | « Incluse dans maintenance » **si** période admissible | Souscription, période non clôturée, quota/interventions et éventuel dépassement, service lié |
| `hour_pack` | « Déduire du pack d'heures » | Même Client, Projet compatible, pack disponible/non suspendu, durée terminée imputable, solde et shortfall |
| `out_of_scope` | « Hors forfait · facturable » | Montant/raison, pièce à préparer pour Abby et justification |
| `commercial_gesture` | « Geste commercial » | Motif, coût réel et absence de facturation non prévue |
| `included_project` | « Inclus au Projet » | Projet accepté ou chemin autorisé par métier, pas facturation double |
| `internal` | « Travail interne » | Temps lié à l'activité correcte et non facturable si telle est la décision |

La catégorie technique du temps et le **mode de couverture Intervention** sont deux attributs indépendants ; éviter l'équivalence « toutes sessions facturables = facture à créer ».

## 3. Parcours de création et de réalisation
1. **Nouvelle demande** : enregistrer Client et sujet, vérifier l'identité, ne pas précréer d'Intervention ; choisir prochaine action explicite.
2. **Transformer** ou **Créer directement** : proposer Client/Projet/tâche, type, couverture et éventuel pack/période, statut initial; empêcher double conversion et rattachement cross-Client.
3. **Démarrer travail** : depuis fiche, envoyer le contexte au **chrono global unique**, pas créer un timer interne; refuser opérations si période/cible manque selon le service.
4. **Travailler** : durée réelle calculée depuis `time_sessions` hors pauses; champs d'Incident criticité, date, cause, diagnostic, solution, suivi; rapport/sauvegarde consultables.
5. **À valider** : action de revue qui **n'est pas encore « terminé »**; afficher ce qui sera consommé/débité/facturé. Une Intervention « en attente Client » ou « bloquée » conserve son contexte.
6. **Terminer** : fenêtre de confirmation lisible contenant n°/Client, durée, statut, couverture, compte débité ou période, débits exacts, dépassements, résultat de préparation Abby. Confirmer seulement si tous les contrôles nécessaires passent.
7. **Résultat** : lire **le retour effectif du service**; zéro deuxième débit, facture/provision si effet métier applicable; ne pas simuler un succès sur erreur IPC.
8. **Après clôture** : lecture seule de l'historique, correction du temps et éventuelle réouverture uniquement dans un parcours explicitement documenté; ne pas effacer un débit ni des pièces pour rouvrir « facilement ».

## 4. Risque E222 : sécurité de la finalisation
Dans `InterventionCompletionService.complete`, le passage en `to_validate`, le débit `hourPacks.debitIntervention`, le statut `completed` et `billing.ensureForIntervention` / maintenance-overage sont des appels **successifs**. `HourPackService.debitIntervention` réalise bien une transaction locale et déduplique via `source_key`, mais **l'ensemble du parcours** n'est pas visiblement regroupé dans une transaction globale à ce niveau.

**Ne pas affirmer l'atomicité transversale déjà garantie**. Avant UI de clôture, exécuter des tests d'injection de panne à chaque frontière; selon résultats, envelopper les opérations SQL dans une transaction/savepoint cohérent et garantir que les retours d'erreur ne laissent **ni intervention terminée seule, ni pack débité seul, ni billing incohérent**. Conserver l'idempotence du second clic.

## 5. Garde UX-01 et navigation
- Même fiche et même éditeur en mode réduit/agrandi; Escape, changement de Client, projet, ligne, statut ou vue ne doivent pas jeter `dirty` sans contrôle.
- Une transition de statut peut déclencher contrôles d'action/destination, chrono, pack et facturation : avertissement concret **avant action**, erreur conservant les données.
- La clôture n'est pas une simple préférence visuelle. Les événements de temps peuvent actualiser la fiche mais ne doivent pas réinitialiser une note manuscrite.

## 6. Recette prévue (17 scénarios, aucun exécuté)
| ID | Cas | Résultat |
|---|---|---|
| R08B-01 | Créer demande depuis Client exact | Pas d'Intervention créée |
| R08B-02 | Convertir même demande deux fois | Une seule Intervention, provenance conservée |
| R08B-03 | Clore demande sans Intervention | Motif visible, aucun débit |
| R08B-04 | Intervention directe avec Projet/tâche | IDs et contexte cohérents |
| R08B-05 | Incident critique | Cause/diagnostic/solution horodatés, aucun faux constat |
| R08B-06 | Intervention maintenance sans période | Refus de terminer |
| R08B-07 | Intervention pack autre Client | Refus |
| R08B-08 | Pack suspendu/archivé/expiré | Refus du débit |
| R08B-09 | Intervention pack sans temps terminé | Refus selon service |
| R08B-10 | Deux clics Terminer pack | Un mouvement de débit |
| R08B-11 | Panne après débit mais avant completed | Cible : rollback total, aucun état partiel |
| R08B-12 | Panne à la préparation facturation | Cible : rollback ou reprise idempotente documentée |
| R08B-13 | Hors forfait facturable | Un seul élément Abby prêt, pas facture émise |
| R08B-14 | Réouvrir une terminée | Transition et compensation contrôlées; aucun bouton mensonger |
| R08B-15 | Changement de panneau avec texte sale | Garde UX-01 |
| R08B-16 | Liste/fiches agrandies, clavier, 3 thèmes×3 densités | État et couverture lisibles sans couleur seule |
| R08B-17 | Fixtures SQLite/fichiers, régression interventions | Aucun impact Validation-MSI |

**E228–E232 ouverts :** définition du vrai parcours de réouverture, responsabilité de l'atomicité entre services, preuve d'un débit idempotent après correction de temps, droit de clôture, retour et historique des rapports.

# Phase 4 — Plan de validation Windows

## Statut

Branche : `feature/phase-4-operations`  
PR : #61 — brouillon  
Base : `feature/phase-3-projects`  
Migrations attendues : **17**

Ce document décrit la validation locale à effectuer avant toute fusion de la Phase 4.

La CI GitHub observée sur cette branche n'est pas une validation : le job `windows-latest` est créé avec `runner_id: 0` et `steps: []`, donc aucune commande du projet n'est exécutée.

## 1. Préparation

Dans PowerShell :

```powershell
cd "C:\Users\carlo\Documents\atoumweb-manager"
git checkout feature/phase-4-operations
git pull origin feature/phase-4-operations
```

Vérifier la branche :

```powershell
git status
git branch --show-current
```

Résultat attendu : `feature/phase-4-operations`, arbre de travail propre.

## 2. Contrôles automatiques

Exécuter dans cet ordre :

```powershell
npm run typecheck
```

Puis :

```powershell
npm test
```

Ne pas lancer l'application tant que ces deux commandes ne sont pas vertes.

## 3. Migration réelle

Lancer ensuite :

```powershell
npm start
```

Au premier démarrage de la branche :

- vérifier la création d'une sauvegarde `pre-migration` ;
- vérifier que la base atteint **17 migrations** ;
- vérifier qu'aucune donnée CRM / Devis / Projet existante ne disparaît.

## 4. Demandes

Scénario A — Demande → Intervention :

1. créer une demande liée à un Client ;
2. ajouter éventuellement un Projet ;
3. choisir priorité et origine ;
4. ouvrir la fiche à droite ;
5. transformer la demande en intervention ;
6. si un Projet existe, sélectionner un Module / Page / Tâche ;
7. vérifier que la demande passe à `Transformé` ;
8. vérifier qu'une seule intervention est créée.

Scénario B — idempotence :

- relancer la transformation ou revenir sur la demande ;
- aucun doublon d'intervention ne doit apparaître.

Scénario C — clôture sans intervention :

- créer une demande d'information ;
- choisir `Clore sans intervention` ;
- la demande doit être close sans créer de travail ni de temps.

## 5. Interventions & Timer

Créer une intervention directe avec :

- Client ;
- Projet éventuel ;
- Module / Page / Tâche éventuel ;
- type ;
- priorité ;
- prise en charge.

Vérifier :

- numéro `INT-YYYY-001` ou suivant ;
- fiche à droite ;
- nœud projet affiché ;
- démarrage du Timer depuis l'intervention ;
- contexte Client / Projet / Intervention / Tâche correct ;
- Pause / Reprise / Arrêt ;
- temps réel identique dans l'intervention et dans Gestion des temps ;
- aucune durée indépendante stockée par le module Opérations.

## 6. Maintenance

Créer ou utiliser un plan de maintenance, puis :

1. créer une souscription ;
2. générer la période courante ;
3. relancer la génération et vérifier qu'aucune deuxième période n'est créée ;
4. vérifier la checklist snapshot ;
5. créer une intervention rattachée à cette période ;
6. vérifier quota consommé / restant ;
7. modifier ensuite le plan catalogue et vérifier que l'ancienne période ne change pas.

Tester une souscription suspendue : aucune nouvelle période ne doit pouvoir être générée.

## 7. Dépassement Maintenance

Avec une formule 2 interventions :

1. créer 3 interventions sur la même période ;
2. vérifier que la 3e est détectée comme dépassement ;
3. vérifier que le travail n'est pas bloqué ;
4. choisir une décision et saisir le motif ;
5. tester au moins :
   - facturer hors forfait ;
   - geste commercial ;
   - inclure exceptionnellement ;
6. la période ne doit pas pouvoir être clôturée tant qu'un dépassement n'a aucune décision ;
7. après décision, la clôture doit redevenir possible.

Pour `Facturer hors forfait`, vérifier qu'un seul `billing_item` est préparé.

## 8. Incidents

Créer une intervention `Incident` et vérifier :

- criticité normale / urgente / critique ;
- début et résolution ;
- indisponibilité ;
- cause ;
- diagnostic ;
- solution ;
- suivi ;
- Timer identique aux autres interventions ;
- un incident critique non résolu remonte dans `À surveiller` ;
- l'alerte disparaît après résolution.

Le lien vers une sauvegarde utilisée/restaurée est volontairement différé à la Phase 6 / issue #44, lorsque `backup_records` existera comme source de vérité.

## 9. Packs d'heures

Créer un pack puis vérifier :

- crédit initial ;
- prix contractuel ;
- expiration éventuelle ;
- solde calculé depuis les mouvements ;
- débit d'une intervention terminée sur son temps réel ;
- second débit de la même intervention sans doublon ;
- correction manuelle ;
- crédit commercial ;
- annulation d'un mouvement par contre-écriture.

## 10. Pack insuffisant

Créer un pack de 1 h et une intervention de 1 h 30.

Vérifier :

- débit réel de 1 h 30 conservé dans l'historique ;
- détection exacte des 30 minutes non couvertes ;
- bloc `Décision requise` ;
- motif obligatoire.

Tester les décisions utiles :

- `Facturer le complément` : un seul `billing_item`, correction explicite du solde ;
- `Autoriser exceptionnellement le négatif` : solde négatif conservé et décision tracée ;
- `Utiliser un autre pack` : uniquement le complément transféré ;
- `Geste commercial` : crédit commercial explicite ;
- `Autre` : décision historisée sans réécriture du débit d'origine.

## 11. À surveiller / Dashboard

Vérifier les alertes :

- période de maintenance à générer ;
- maintenance en retard ;
- dépassement maintenance sans décision ;
- quota atteint/dépassé ;
- pack faible ;
- pack épuisé ;
- pack négatif ;
- pack bientôt expiré ;
- incident critique ouvert ;
- intervention / complément prêt à facturer.

Sur l'Accueil, vérifier les compteurs :

- demandes à traiter ;
- interventions en cours ;
- interventions à valider ;
- alertes urgentes.

Les clics doivent conduire à la bonne sous-vue et, lorsque disponible, au bon enregistrement.

## 12. Rapport Maintenance Client

Dans une période :

- remplir Synthèse client ;
- remplir Anomalies & actions ;
- remplir Recommandations ;
- enregistrer ;
- rouvrir et vérifier la persistance ;
- vérifier checklist, interventions, temps, quota et dépassements dans l'aperçu.

Contrôle critique : aucune note interne de souscription, période, checklist, intervention ou motif interne de dépassement ne doit apparaître dans le contenu client.

Le PDF final appartient à la Phase 5 / moteur Documents & Contrats.

## 13. Recherche globale

Tester notamment :

- numéro `INT-...` ;
- sujet d'une demande ;
- sujet d'une intervention ;
- nom d'un client lié à une maintenance ;
- nom d'un pack.

Le clic doit ouvrir `Interventions & Maintenance` avec la bonne sous-vue et l'enregistrement ciblé lorsqu'il est disponible.

## 14. Fiches Client / Projet

Vérifier l'onglet `Interventions` dans :

- une fiche Client ;
- une fiche Projet.

Les données affichées doivent être les mêmes que dans le module central : aucune copie indépendante.

## 15. Contrôles visuels

Sur les trois thèmes :

- AtoumWeb ;
- Noir ;
- Blanc.

Vérifier :

- panneaux de détail à droite ;
- fermeture du panneau = liste pleine largeur ;
- aucun scroll horizontal global ;
- tableaux lisibles ;
- formulaires utilisables ;
- alertes lisibles ;
- petits écrans/fenêtre réduite raisonnables.

## 16. Critère de validation

La Phase 4 peut être considérée validée seulement si :

- `npm run typecheck` est vert ;
- `npm test` est vert ;
- migration réelle jusqu'à 17 réussie ;
- parcours Demande → Intervention → Timer réussi ;
- Maintenance et dépassements réussis ;
- Packs et pack insuffisant réussis ;
- alertes / Dashboard réussis ;
- rapport client sans fuite interne ;
- recherche et vues Client/Projet réussies ;
- contrôle visuel des trois thèmes réussi.

Seulement après cette validation, mettre à jour `PROJECT_STATUS.md`, clôturer les issues Phase 4 concernées et envisager la fusion de la PR #61 dans sa branche parente.

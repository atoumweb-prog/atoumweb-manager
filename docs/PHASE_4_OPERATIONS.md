# Phase 4 — Interventions, Maintenance & Packs d’heures

## 1. Objectif

La Phase 4 transforme AtoumWeb Manager en outil de suivi opérationnel après livraison d’un projet ou pendant sa vie courante.

Elle doit couvrir quatre réalités distinctes sans les confondre :

1. **Demande** : information entrante à qualifier, avant tout travail.
2. **Intervention** : travail réellement réalisé, rattaché à un client et éventuellement à un projet/module.
3. **Maintenance** : service récurrent avec périodes, quotas et checklists.
4. **Pack d’heures** : réserve de temps achetée, consommée via des mouvements traçables.

Le temps réel reste toujours stocké dans `time_sessions`.

---

## 2. Vues du module

Le menu **Interventions & Maintenance** contient quatre vues :

- **Demandes**
- **Interventions**
- **Maintenance**
- **Packs d’heures**

Ces données restent également accessibles depuis les fiches Client et Projet, sans duplication.

---

## 3. Demandes

Une demande représente un besoin reçu avant décision de travail.

### 3.1 Origines possibles

- Email
- Téléphone
- Formulaire site
- Message / messagerie
- Réunion
- Détection AtoumWeb
- Autre

### 3.2 Champs principaux

- Client
- Projet éventuel
- Canal / origine
- Sujet
- Description
- Priorité
- Date de réception
- Prochaine action éventuelle
- Statut
- Pièces/fichiers liés éventuels
- Notes internes

### 3.3 Statuts par défaut

- Nouveau
- À qualifier
- En attente client
- Planifié
- Transformé en intervention
- Clos sans intervention
- Archivé

### 3.4 Règle importante

Une demande **ne crée aucune session de temps métier par elle-même**.

Du temps administratif éventuel peut être enregistré volontairement, mais il doit rester une vraie `time_session`, pas un compteur propre à la demande.

### 3.5 Transformation

Action : **Créer une intervention**.

La transformation doit :

- conserver la demande ;
- créer une seule intervention liée ;
- reprendre client, projet, sujet et description utiles ;
- journaliser l’action ;
- être idempotente : relancer l’action ne crée pas un doublon.

Une demande peut aussi être **close sans intervention** avec motif facultatif/paramétrable.

---

## 4. Interventions

Une intervention représente le travail réellement effectué.

### 4.1 Types par défaut

- Correction
- Modification
- Ajout
- Maintenance
- Incident
- Support
- Formation
- Autre

Ces valeurs restent personnalisables dans Réglages.

### 4.2 Statuts par défaut

- À planifier
- Planifiée
- En cours
- En attente client
- Bloquée
- À valider
- Terminée
- Annulée
- Archivée

### 4.3 Liens

Une intervention doit être liée à :

- un Client obligatoire ;
- un Projet facultatif ;
- un Module/Tâche facultatif ;
- une Demande source facultative ;
- une période de maintenance facultative ;
- un pack d’heures facultatif ;
- une ou plusieurs sessions de temps.

### 4.4 Mode de prise en charge

Chaque intervention doit avoir un mode explicite :

- Inclus maintenance
- Déduit pack d’heures
- Hors forfait facturable
- Geste commercial
- Inclus projet
- Interne AtoumWeb

Ce mode peut être proposé automatiquement selon le contexte, mais reste modifiable tant que l’intervention n’est pas clôturée/facturée.

### 4.5 Valeurs

Toujours distinguer :

- valeur théorique/commerciale de l’intervention ;
- montant réellement facturable ;
- temps réellement passé.

Une intervention offerte peut donc avoir :

- valeur théorique : 79 € ;
- montant facturable : 0 € ;
- temps réel : 45 min.

### 4.6 Timer

Le timer Phase 3 est réutilisé.

Contexte possible :

`Client > Projet > Intervention`

ou

`Client > Projet > Module > Intervention`

Une intervention ne stocke jamais son propre total de temps : il est calculé depuis `time_sessions`.

---

## 5. Interventions hors forfait

Lorsqu’une intervention n’est couverte ni par maintenance ni par pack :

- elle peut être marquée **Hors forfait facturable** ;
- le CRM conserve le montant prévu ;
- à la clôture, il prépare un élément à facturer (`billing_item`) ;
- la facture réglementaire sera ensuite créée dans Abby lors de la phase Facturation.

La création de l’élément à facturer doit être idempotente.

---

## 6. Maintenance — concepts

La maintenance est composée de :

- un **plan** / offre de maintenance ;
- une **souscription client** ;
- des **périodes** (souvent mensuelles) ;
- une checklist récurrente ;
- des interventions rattachées à chaque période.

### Règle critique

Une nouvelle période mensuelle **ne crée jamais un nouveau projet**.

Exemple :

`Cazor > Maintenance WordPress > Septembre 2026`

puis :

`Octobre 2026`

restent des périodes du même service de maintenance.

---

## 7. Plans de maintenance

Les plans sont configurables dans **Offres & Tarifs** / Réglages.

### Valeurs initiales AtoumWeb

À précharger comme références modifiables :

- **Maintenance 49 €/mois** — 2 interventions incluses
- **Maintenance 99 €/mois** — 4 interventions incluses

Ces valeurs ne doivent jamais être codées en dur comme règles immuables.

### Champs

- Nom
- Prix périodique
- Fréquence
- Nombre d’interventions incluses
- éventuelle durée incluse si un futur plan l’utilise
- règles de report éventuelles
- checklist standard
- état actif/archivé

---

## 8. Souscription de maintenance

Une souscription lie :

- Client
- Projet/site éventuel
- Plan de maintenance
- Date de début
- Date de fin éventuelle
- Prix contractuel éventuellement différent du catalogue
- Statut
- Notes
- Contrat/document lié lorsqu’il existe

Statuts possibles :

- Active
- Suspendue
- Terminée
- Archivée

Une modification future du plan catalogue ne modifie pas rétroactivement les conditions de la souscription existante.

---

## 9. Périodes de maintenance

Chaque période possède :

- début / fin ;
- quota inclus ;
- nombre d’interventions consommées ;
- checklist ;
- interventions ;
- état ;
- date de clôture ;
- notes.

### Statuts

- À venir
- Ouverte
- À faire
- En cours
- Terminée
- Clôturée

### Création

Le CRM peut générer automatiquement la prochaine période à partir de la souscription active.

Cette génération doit être idempotente : une même période ne peut pas être créée deux fois.

---

## 10. Quota de maintenance

Le quota est calculé à partir des interventions rattachées à la période selon les règles du plan.

Le CRM affiche :

- quota inclus ;
- consommé ;
- restant ;
- éventuel dépassement.

### Dépassement

Le CRM **ne bloque jamais** une intervention parce que le quota est dépassé.

Il propose une décision explicite :

- Facturer hors forfait
- Geste commercial
- Inclure exceptionnellement
- Reporter si contractuellement possible
- Autre décision

La décision et son motif sont enregistrés dans l’historique.

---

## 11. Checklist de maintenance

Une souscription peut recevoir une checklist standard issue d’un modèle.

Exemples WordPress :

- mises à jour WordPress ;
- mises à jour thème/plugins ;
- vérification sauvegardes ;
- contrôle sécurité ;
- contrôle formulaires ;
- contrôle disponibilité ;
- vérification rapide performances ;
- autres éléments selon contrat.

La checklist réelle de chaque période est un snapshot indépendant du modèle futur.

Une modification ultérieure du modèle ne modifie pas les anciennes périodes.

---

## 12. Incidents

Un incident est une intervention spécialisée, pas un module séparé de données.

### Données supplémentaires

- criticité : normale / urgente / critique ;
- début incident ;
- heure de résolution ;
- indisponibilité éventuelle ;
- cause ;
- diagnostic ;
- solution ;
- sauvegarde utilisée/restaurée éventuelle ;
- actions de suivi.

Le temps reste dans `time_sessions`.

Une sauvegarde liée référence un `backup_record` existant ; elle n’est pas dupliquée.

---

## 13. Packs d’heures

Un pack représente un crédit de temps acheté.

### Références AtoumWeb connues

- 10 h
- 20 h
- 30 h

Les prix restent issus du catalogue et ne doivent pas être codés en dur dans ce module.

### Champs

- Client
- Projet éventuel
- Nom du pack
- Temps acheté
- Prix payé/contractuel
- Date d’achat
- Date d’expiration éventuelle
- Statut
- Notes

### Statuts

- Actif
- Épuisé
- Expiré
- Suspendu
- Archivé

---

## 14. Mouvements de pack

Le solde d’un pack est toujours calculé depuis `hour_pack_movements`.

Types de mouvements :

- Crédit initial
- Débit intervention
- Correction manuelle
- Geste commercial / crédit supplémentaire
- Annulation d’un mouvement précédent

Chaque mouvement contient :

- pack ;
- intervention éventuelle ;
- session de temps éventuelle ;
- durée en secondes ;
- motif ;
- date ;
- auteur/source.

### Règle importante

Ne jamais stocker uniquement un champ « heures restantes » modifiable sans historique.

Le solde est un calcul.

---

## 15. Déduction automatique d’un pack

Lorsqu’une intervention est définie comme **Déduit pack d’heures** :

1. sélectionner le pack actif ;
2. enregistrer le temps via `time_sessions` ;
3. à la clôture/validation de l’intervention, créer le mouvement de débit ;
4. conserver la relation entre mouvement, intervention et sessions concernées.

La déduction doit être idempotente.

Si le temps de l’intervention est corrigé après débit, le CRM ne réécrit pas silencieusement l’historique : il crée un mouvement correctif explicite.

---

## 16. Pack insuffisant

Le pack ne doit pas bloquer le travail.

Si le solde devient négatif ou insuffisant, proposer :

- déduire le solde disponible puis facturer le complément ;
- autoriser exceptionnellement un solde négatif ;
- utiliser un autre pack ;
- geste commercial ;
- autre décision.

Le choix est journalisé.

---

## 17. Alertes packs

Alertes paramétrables :

- moins de X heures restantes ;
- moins de X % restant ;
- expiration proche ;
- pack épuisé ;
- pack négatif exceptionnel.

Ces alertes alimentent **À surveiller** sur le Dashboard.

---

## 18. Dashboard opérationnel

Le module affiche au minimum :

- demandes à traiter ;
- interventions en cours ;
- maintenances à faire/retard ;
- packs faibles ;
- interventions terminées à facturer ;
- incidents ouverts critiques.

Le Dashboard principal réutilise les mêmes données.

---

## 19. Fiche Client / Projet

Les mêmes interventions, demandes, maintenances et packs sont visibles depuis :

- le module principal ;
- la fiche Client ;
- la fiche Projet lorsque pertinent.

Il ne s’agit que de vues filtrées des mêmes enregistrements.

---

## 20. Rapports de maintenance

Prévoir dès la Phase 4 la structure nécessaire à un rapport mensuel client :

- période ;
- checklist réalisée ;
- interventions ;
- temps passé ;
- anomalies/actions ;
- quota utilisé/restant ;
- recommandations éventuelles.

Le PDF final pourra s’appuyer sur le moteur Documents/PDF existant ou être finalisé dans la phase Documents.

Les notes internes ne doivent jamais apparaître dans une version client.

---

## 21. Numérotation

Interventions : format par défaut proposé :

`INT-YYYY-001`

La numérotation utilise `number_sequences` et reste configurable.

Les demandes n’ont pas nécessairement besoin d’un numéro public ; un identifiant interne suffit, sauf décision ultérieure.

---

## 22. Journal d’activité

Événements utiles :

- demande créée ;
- demande transformée ;
- intervention planifiée/démarrée/terminée ;
- mode de prise en charge modifié ;
- dépassement maintenance décidé ;
- période maintenance créée/clôturée ;
- incident ouvert/résolu ;
- pack acheté ;
- pack débité/crédité/corrigé ;
- élément à facturer préparé.

Éviter de polluer la timeline avec chaque tic du timer.

---

## 23. Recherche globale

Indexer au minimum :

- numéro intervention ;
- sujet ;
- client ;
- projet ;
- type ;
- résumé ;
- demande source ;
- plan/souscription maintenance ;
- pack d’heures.

La recherche reste dérivée et reconstruisible.

---

## 24. Données / migrations principales

Tables existantes/cibles à implémenter ou compléter :

- `service_requests`
- `interventions`
- `maintenance_plans`
- `maintenance_subscriptions`
- `maintenance_periods`
- `maintenance_checklist_templates`
- `maintenance_checklist_template_items`
- `maintenance_checks`
- `hour_packs`
- `hour_pack_movements`
- extensions/liens nécessaires vers `time_sessions`
- préparation `billing_items` pour les interventions facturables

Des contraintes uniques doivent protéger l’idempotence des transformations et générations automatiques.

---

## 25. Sécurité / intégrité métier

Les opérations suivantes doivent être transactionnelles lorsque plusieurs écritures sont nécessaires :

- Demande → Intervention ;
- création d’une période maintenance ;
- clôture intervention + consommation quota ;
- clôture intervention + débit pack ;
- clôture intervention + création élément à facturer.

En cas d’échec, pas d’état partiel silencieux.

---

## 26. Préparation de la facturation

La Phase 4 ne remplace pas Abby.

Elle prépare seulement les éléments facturables :

- intervention hors forfait ;
- dépassement maintenance facturé ;
- éventuel complément pack.

Chaque `billing_item` conserve sa source exacte pour éviter toute double facturation.

La vraie gestion Factures/Paiements reste dans la phase administrative dédiée.

---

## 27. Critères d’acceptation fonctionnels

La Phase 4 est valide si :

- une demande peut être close ou transformée sans doublon ;
- une intervention utilise le timer Phase 3 sans dupliquer le temps ;
- les modes de prise en charge sont explicites ;
- une maintenance ne crée jamais un projet mensuel ;
- les périodes et checklists gardent leur historique ;
- un dépassement n’empêche jamais le travail ;
- la décision de dépassement est tracée ;
- un pack est consommé par mouvements, jamais par simple compteur éditable ;
- une correction de temps après débit crée un ajustement traçable ;
- un incident peut référencer une sauvegarde réelle ;
- les opérations facturables créent au maximum un élément à facturer par source ;
- les vues Client/Projet réutilisent les mêmes données ;
- recherche globale, dashboard et journal sont cohérents ;
- les trois thèmes restent utilisables.

---

## 28. Découpage recommandé

1. Données Demandes / Interventions et services métier
2. UI Demandes / Interventions + timer
3. Maintenance : plans / souscriptions / périodes / checklists
4. Dépassements / incidents
5. Packs d’heures / mouvements / alertes
6. Handoff facturation / dashboard / rapports
7. Validation complète Phase 4

---

## 29. Dépendances

La Phase 4 dépend principalement de :

- Phase 1 : Clients
- Phase 3 : Projets, Timer et `time_sessions`

Elle peut utiliser le catalogue Phase 2 pour les prix/plans, mais les règles opérationnelles ne doivent pas dépendre des versions courantes du catalogue après souscription.

---

## 30. Hors périmètre Phase 4

- génération réglementaire des factures Abby ;
- rapprochement des paiements ;
- comptabilité ;
- automatisation distante des mises à jour WordPress ;
- exécution automatique de snippets ;
- monitoring serveur temps réel ;
- portail client.

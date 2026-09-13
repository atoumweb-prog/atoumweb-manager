# Phase 1 — Socle CRM : Contacts, Prospects, Clients et recherche

## Statut

Préparation fonctionnelle et technique réalisée avant le développement de la Phase 1.

**Dépendance :** la PR de fondation Electron/React/SQLite doit être validée et fusionnée avant de créer la branche de développement Phase 1.

## 1. Objectif

Créer le premier bloc métier réellement utilisable d’AtoumWeb Manager :

- identité commune des sociétés et personnes ;
- gestion des prospects en Kanban ;
- conversion d’un prospect en client sans double saisie ;
- liste et fiche Client ;
- journal d’activité partagé ;
- première recherche globale réelle.

Cette phase doit respecter la règle centrale : **une donnée métier = une source de vérité**.

---

## 2. Principe d’identité

### 2.1 `organizations`

Source de vérité pour une société / structure.

Exemples :

- Cazor Auto Passion ;
- une association ;
- une entreprise cliente ;
- un fournisseur ou partenaire plus tard.

### 2.2 `contacts`

Source de vérité pour une personne physique.

Un contact peut :

- appartenir à une organisation ;
- exister seul, par exemple pour un particulier ;
- devenir contact principal d’un client ;
- être utilisé par un prospect sans être dupliqué ensuite.

### 2.3 Pas de module Contacts dans le menu principal

Les contacts sont gérés depuis les fiches Prospect et Client. Ils pourront aussi être retrouvés par la recherche globale.

---

## 3. Prospect

### 3.1 Stages par défaut

Codes internes et libellés UI :

| Code | Libellé |
|---|---|
| `new` | Nouveau contact |
| `qualifying` | À qualifier |
| `need_identified` | Besoin identifié |
| `quote_to_prepare` | Devis à préparer |
| `quote_sent` | Devis envoyé |
| `follow_up` | À relancer |
| `negotiation` | Négociation |
| `waiting` | En attente |
| `won` | Gagné |
| `lost` | Perdu |

L’ordre par défaut doit pouvoir être personnalisé plus tard dans Réglages, mais cette liste est la référence V1.

### 3.2 Température

- `cold` → Froid
- `warm` → Tiède
- `hot` → Chaud

La température est indépendante du stage.

### 3.3 Sources par défaut

- Site web
- Recommandation / bouche-à-oreille
- Google
- Réseaux sociaux
- Événement
- Prospection sortante
- Ancien client
- Autre

Une valeur `other` peut conserver un libellé libre complémentaire.

### 3.4 Données principales

Un prospect référence obligatoirement au moins :

- une organisation ; ou
- un contact.

Il peut référencer les deux.

Données :

- identité ;
- coordonnées issues des sources communes ;
- stage ;
- température ;
- source ;
- besoin principal ;
- besoin secondaire ;
- budget min/max ;
- valeur estimée ;
- probabilité ;
- prochaine action ;
- notes ;
- date cible éventuelle ;
- raison de perte ;
- historique.

### 3.5 Prochaine action

La prochaine action est essentielle.

Raccourcis UI :

- demain ;
- +3 jours ;
- +7 jours ;
- +30 jours ;
- date personnalisée.

Elle contient :

- date/heure ;
- texte de l’action.

Un prospect sans prochaine action peut être signalé visuellement, sauf s’il est gagné, perdu ou archivé.

### 3.6 Passage en Perdu

Lors du passage à `lost` :

- demander une raison ;
- conserver l’historique ;
- ne rien supprimer ;
- permettre une réouverture ultérieure si nécessaire.

### 3.7 Conversion en client

Action explicite : **Transformer en client**.

La conversion doit être transactionnelle :

1. vérifier si un `client_account` existe déjà pour l’organisation/contact ;
2. si oui, rattacher le prospect à ce client ;
3. sinon créer le `client_account` ;
4. passer le prospect en `won` ;
5. renseigner `won_at` et `client_account_id` ;
6. conserver organisation/contact existants sans les recopier ;
7. créer les événements d’activité ;
8. mettre à jour l’index de recherche ;
9. ouvrir la fiche Client créée/rattachée.

La conversion doit être idempotente : relancer l’action ne doit jamais créer un second client.

---

## 4. Clients

### 4.1 Statuts

- `active` → Actif
- `inactive` → Inactif
- `archived` → Archivé

### 4.2 « A déjà été client »

Ce n’est pas une case métier à ressaisir.

Valeur déduite de l’historique : dès qu’un `client_account` a existé, l’information reste vraie, même si le client devient inactif ou archivé.

### 4.3 Liste Clients

Colonnes V1 :

- avatar/logo ou initiales ;
- client / société ;
- statut ;
- contact principal ;
- projets actifs (0 dans cette phase si aucun projet) ;
- services actifs (0 dans cette phase si aucun service) ;
- CA encaissé cumulé (calculé ; 0 avant facturation) ;
- temps cumulé (calculé ; 0 avant timer réel) ;
- prochaine action ;
- alerte éventuelle ;
- menu `…`.

Filtres simples :

- recherche ;
- Actif / Inactif / Archivé ;
- client avec prochaine action ;
- sans activité récente.

Aucune valeur agrégée ne doit être stockée comme copie dans `client_accounts`.

### 4.4 Fiche Client — Phase 1

La structure finale comporte les onglets déjà validés, mais cette phase rend réellement fonctionnels :

- Résumé ;
- Contacts ;
- Commercial ;
- Historique.

Les autres onglets peuvent être visibles avec un état vide / « module à venir » :

- Projets ;
- Services souscrits ;
- Contrats ;
- Facturation ;
- Interventions ;
- Documents ;
- Technique ;
- Sauvegardes.

### 4.5 Résumé

Afficher au minimum :

- identité ;
- statut ;
- client depuis ;
- contact principal ;
- coordonnées ;
- tags/secteur si renseignés ;
- prochaine action ;
- notes ;
- activité récente.

### 4.6 Contacts

Un client peut avoir plusieurs contacts :

- principal ;
- administratif ;
- facturation ;
- technique ;
- autre.

Une personne reste une seule ligne `contacts`. Le rôle dans la relation client peut être porté par une table de liaison dédiée si plusieurs rôles deviennent nécessaires.

### 4.7 Archivage / réactivation

Archiver :

- statut → `archived` ;
- `archived_at` renseigné ;
- client masqué des vues normales ;
- aucune donnée historique supprimée ;
- événement d’activité ajouté.

Réactiver :

- proposer `active` ou `inactive` ;
- vider `archived_at` ;
- journaliser la réactivation.

---

## 5. Ajustements de modèle de données prévus

La migration CRM devra créer/compléter au minimum :

### `organizations`

- `id`
- `name`
- `legal_name`
- `siret`
- `email`
- `phone`
- `website`
- `address_line1`
- `address_line2`
- `postal_code`
- `city`
- `country`
- `industry`
- `notes`
- `created_at`
- `updated_at`
- `archived_at`

### `contacts`

- `id`
- `organization_id`
- `first_name`
- `last_name`
- `job_title`
- `email`
- `phone`
- `preferred_channel`
- `notes`
- `avatar_asset_id` nullable
- `created_at`
- `updated_at`
- `archived_at`

### `client_accounts`

- `id`
- `organization_id` nullable
- `primary_contact_id` nullable
- `status`
- `became_client_at`
- `notes`
- `created_at`
- `updated_at`
- `archived_at`

Contrainte métier : organisation ou contact principal requis.

### `client_contact_roles`

Table de liaison recommandée pour ne pas enfermer un contact dans un seul rôle.

- `id`
- `client_account_id`
- `contact_id`
- `role` (`primary`, `administrative`, `billing`, `technical`, `other`)
- `is_primary`
- `created_at`

Contrainte : un seul `is_primary = 1` par client.

### `prospects`

- champs définis dans `DATA_MODEL_V1.md` ;
- `source_detail` pour « Autre » ;
- `target_date` nullable ;
- contrainte : `organization_id` ou `contact_id` requis ;
- index sur stage, prochaine action et client rattaché.

---

## 6. Journal d’activité

La table existante de fondation doit évoluer vers le modèle cible `activity_events` ou être renommée avant de devenir utilisée en production.

Événements Phase 1 :

- prospect créé ;
- stage prospect modifié ;
- prochaine action modifiée ;
- prospect gagné ;
- prospect perdu ;
- client créé ;
- client mis à jour ;
- client archivé ;
- client réactivé ;
- contact ajouté/modifié ;
- note métier importante ajoutée.

Chaque événement peut référencer directement :

- prospect ;
- client ;
- organisation ;
- contact.

Le journal est append-only pour les événements métier importants.

---

## 7. Recherche globale — première version réelle

Le champ déjà présent dans le header devient une recherche métier.

### 7.1 Entités indexées Phase 1

- Prospects ;
- Clients ;
- Organisations ;
- Contacts.

### 7.2 Contenu indexé

Exemples :

- nom société ;
- raison sociale ;
- prénom/nom ;
- email ;
- téléphone ;
- ville ;
- SIRET ;
- besoin prospect ;
- notes courtes pertinentes.

### 7.3 Résultats

Affichage groupé :

- Prospects ;
- Clients ;
- Contacts.

Chaque résultat propose :

- type ;
- nom principal ;
- information secondaire ;
- statut/stage ;
- action d’ouverture.

### 7.4 Technique

`search_documents` reste un index dérivé reconstruisible.

Une écriture métier doit mettre à jour l’entité source et son document de recherche dans la même transaction.

Un outil interne de reconstruction complète de l’index doit exister pour réparation/migration.

---

## 8. API IPC cible Phase 1

Le renderer ne reçoit jamais SQLite directement.

API métier indicative :

```ts
crm.organizations.create(input)
crm.organizations.update(id, input)
crm.contacts.create(input)
crm.contacts.update(id, input)

crm.prospects.list(filters)
crm.prospects.get(id)
crm.prospects.create(input)
crm.prospects.update(id, input)
crm.prospects.changeStage(id, stage)
crm.prospects.setNextAction(id, action)
crm.prospects.convertToClient(id)
crm.prospects.archive(id)

crm.clients.list(filters)
crm.clients.get(id)
crm.clients.create(input)
crm.clients.update(id, input)
crm.clients.archive(id)
crm.clients.reactivate(id, status)
crm.clients.addContactRole(clientId, contactId, role)

search.global(query)
activity.listForEntity(entityType, entityId)
```

Les noms définitifs peuvent évoluer, mais l’API doit rester métier, typée et limitée.

---

## 9. UI Prospects

Vue par défaut : Kanban.

### Carte

Afficher sans surcharge :

- nom société/personne ;
- besoin principal ;
- valeur estimée ;
- température ;
- prochaine action ;
- indicateur de retard ;
- source discrète.

Actions rapides :

- ouvrir ;
- déplacer de stage ;
- programmer prochaine action ;
- créer/préparer devis plus tard ;
- gagner/perdre.

Le glisser-déposer peut être ajouté si stable et accessible, mais un changement de stage doit toujours être possible sans drag-and-drop.

---

## 10. UI Clients

Vue par défaut : tableau compact.

Actions rapides :

- ouvrir ;
- modifier ;
- programmer prochaine action ;
- archiver / réactiver.

La fiche Client doit être exploitable même si les modules Projets, Facturation, etc. ne sont pas encore développés.

---

## 11. Validations

Validation renderer + revalidation main process.

Exemples :

- email facultatif mais valide si renseigné ;
- probabilité 0–100 ;
- budget min <= budget max ;
- montants >= 0 ;
- stage appartenant à la liste autorisée ;
- client/prospect avec au moins une identité exploitable ;
- raison de perte requise pour `lost` ;
- une seule relation contact principal par client.

---

## 12. Tests obligatoires Phase 1

### Repositories / DB

- création organisation/contact ;
- création prospect individuel ;
- création prospect entreprise ;
- changement de stage ;
- prochaine action ;
- conversion en client ;
- conversion appelée deux fois sans doublon ;
- archivage/réactivation client ;
- contrainte contact principal unique ;
- recherche reconstruite après modification.

### Services métier

- perte avec raison ;
- refus perte sans raison ;
- conversion transactionnelle ;
- timeline créée ;
- recherche mise à jour.

### UI

- Kanban état vide ;
- création prospect ;
- passage de colonne ;
- fiche Client état vide ;
- filtres Clients ;
- recherche globale et ouverture d’un résultat ;
- thèmes sur les nouveaux écrans.

---

## 13. Ordre de développement recommandé

1. Migration SQL CRM + repositories de base.
2. Services Organisations / Contacts.
3. Journal d’activité normalisé.
4. Service Prospects + tests.
5. UI Prospects / Kanban.
6. Service Clients + conversion transactionnelle.
7. UI liste + fiche Client.
8. Index de recherche + recherche globale réelle.
9. Tests de parcours complets.
10. Mise à jour `PROJECT_STATUS.md` et documentation.

---

## 14. Critères d’acceptation Phase 1

La Phase 1 est terminée lorsque :

- un prospect particulier ou entreprise peut être créé ;
- le prospect apparaît au bon stage du Kanban ;
- sa prochaine action peut être programmée ;
- il peut être marqué perdu avec une raison ;
- il peut être transformé en client sans recopier son identité ;
- relancer la conversion ne crée aucun doublon ;
- la fiche Client affiche son identité, ses contacts et son historique ;
- un client peut être archivé puis réactivé ;
- la recherche globale retrouve prospect/client/contact ;
- les événements importants apparaissent dans le journal ;
- les trois thèmes fonctionnent sur tous les écrans Phase 1 ;
- les tests automatisés passent.

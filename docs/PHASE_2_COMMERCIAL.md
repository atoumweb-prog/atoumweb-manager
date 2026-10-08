# Phase 2 — Commercial : Offres & Tarifs + Devis

## Statut

Préparation fonctionnelle et technique réalisée avant le développement.

**Dépendance principale :** Phase 1 CRM validée (Prospects / Clients / Recherche).

## 1. Objectif

Rendre le cycle commercial AtoumWeb utilisable de bout en bout :

`Prospect/Client → Catalogue → Devis → Envoi/suivi → Acceptation → Client confirmé → Prêt pour Projet`

Cette phase couvre :

- Services ;
- Offres ;
- versions tarifaires ;
- grille tarifaire ;
- devis guidé ;
- lignes catalogue et lignes libres ;
- remises / gestes commerciaux ;
- snapshot historique ;
- suivi des statuts ;
- acceptation/refus/expiration ;
- conversion automatique du prospect en client lors de l’acceptation si nécessaire ;
- préparation du handoff vers la Phase 3 Projets.

---

## 2. Catalogue : principes

### 2.1 Service

Un Service est une prestation atomique.

Exemples :

- page supplémentaire ;
- audit WordPress ;
- article SEO ;
- maintenance mensuelle ;
- migration ;
- développement horaire.

### 2.2 Offre

Une Offre est une composition versionnée de Services.

Exemples :

- Site vitrine ;
- Landing page ;
- Pack SEO ;
- Formule mariage ;
- Maintenance 2 interventions ;
- application métier de départ.

Une offre peut contenir :

- services obligatoires ;
- services optionnels ;
- quantités ;
- ordre d’affichage.

### 2.3 Identité stable + versions

`catalog_items` porte l’identité stable du Service/de l’Offre.

`catalog_versions` porte le contenu et les tarifs d’une version.

Une version déjà publiée/utilisée ne doit jamais être modifiée rétroactivement. Modifier un service/offre publié crée une **nouvelle version**.

Le catalogue courant utilise la dernière version publiée active.

---

## 3. Grille tarifaire

Vue par défaut de **Offres & Tarifs**.

Colonnes :

- catégorie ;
- nom ;
- type Service / Offre ;
- prix AtoumWeb courant ;
- prix de référence conseillé ;
- mode de tarification ;
- statut ;
- visible sur site public Oui/Non ;
- version courante ;
- dernière modification.

Filtres :

- recherche ;
- catégorie ;
- Service / Offre ;
- actif / inactif / archivé ;
- visible site ;
- mode de prix.

Actions :

- ouvrir ;
- créer ;
- dupliquer ;
- créer une nouvelle version ;
- archiver/réactiver ;
- ajouter au devis.

---

## 4. Modes de tarification

Codes V1 :

- `fixed` → Prix fixe
- `starting_from` → À partir de
- `hourly` → Horaire
- `monthly` → Mensuel
- `yearly` → Annuel
- `quote_only` → Sur devis
- `free` → Gratuit

Montants toujours stockés en centimes entiers.

Pour les quantités de devis, utiliser un entier en milli-unités (`quantity_milli`) :

- 1000 = 1 unité ;
- 1500 = 1,5 unité ;
- 100 = 0,1 unité.

Ainsi les calculs restent déterministes sans dépendre de flottants pour les prix.

---

## 5. Fiche Service / Offre

Onglets validés :

- Vue d’ensemble ;
- Inclus ;
- Options ;
- Tarification ;
- Prérequis ;
- Contrat ;
- Conseils.

Données versionnées :

- description ;
- inclusions ;
- exclusions ;
- prérequis ;
- options ;
- prix ;
- prix conseillé ;
- durée estimée ;
- délai recommandé ;
- acompte par défaut ;
- type de contrat ;
- conseils internes.

Les champs « prix conseillé » et « conseils » servent de référence interne AtoumWeb et ne sont pas automatiquement affichés au client.

---

## 6. États Catalogue

### Item

- `active`
- `inactive`
- `archived`

### Version

- `draft`
- `published`
- `retired`

Une seule version `published` courante doit être proposée par défaut pour un item actif.

Une ancienne version peut rester `retired` mais doit rester lisible pour l’historique.

---

## 7. Création d’un devis

Assistant en 6 étapes :

1. Client / Prospect
2. Projet / besoin
3. Offre
4. Services / lignes
5. Conditions
6. Prévisualisation

Le devis peut appartenir :

- à un Prospect ;
- à un Client existant.

Il ne doit pas dupliquer l’identité : il référence le prospect/client.

---

## 8. Lignes de devis

Deux sources :

### 8.1 Ligne Catalogue

Créée depuis Service/Offre.

La ligne conserve :

- référence item/version d’origine ;
- libellé ;
- description ;
- quantité ;
- prix catalogue ;
- prix proposé ;
- remise/ajustement ;
- total ;
- snapshot complet du contenu utile.

### 8.2 Ligne libre

Ligne entièrement personnalisée sans item catalogue obligatoire.

Après création, le CRM peut proposer :

> « Ajouter cette prestation au catalogue ? »

Cette proposition ne doit jamais créer automatiquement un Service.

---

## 9. Snapshot obligatoire

Au moment où une ligne catalogue est ajoutée au devis, conserver un snapshot autonome de :

- nom ;
- description ;
- inclusions ;
- exclusions ;
- options retenues ;
- prix ;
- mode de prix ;
- version source ;
- conditions utiles.

Une modification future du catalogue ne doit modifier **aucun devis existant**, y compris un devis encore anciennement envoyé.

Pour un devis en brouillon, l’utilisateur peut explicitement choisir « Actualiser depuis le catalogue » ; cette action remplace le snapshot après confirmation.

---

## 10. Ajustements / remises

Séparer le calcul de la raison commerciale.

### 10.1 Mode de calcul

- `none`
- `percent`
- `fixed_amount`
- `override_price`
- `free`

### 10.2 Raison commerciale

- `negotiated`
- `commercial_gesture`
- `pilot_client`
- `partnership`
- `loyalty`
- `pack`
- `other`

Le CRM doit toujours conserver :

- valeur catalogue ;
- remise ;
- prix contractuel ;
- raison.

Ainsi la valeur commerciale réelle reste exploitable dans les statistiques.

---

## 11. Calculs

Les calculs sont réalisés dans le main process/service métier, puis vérifiés avant enregistrement.

Pour chaque ligne :

1. prix catalogue × quantité ;
2. appliquer le mode de remise ;
3. obtenir total contractuel ligne ;
4. agréger le devis.

Le renderer peut prévisualiser le calcul mais ne devient jamais source de vérité.

Totaux devis :

- valeur catalogue ;
- remises ;
- total contractuel ;
- acompte prévu ;
- solde prévu.

---

## 12. Conditions du devis

Champs V1 :

- acompte % ou montant calculé ;
- solde ;
- validité ;
- délai estimé ;
- prérequis ;
- notes/conditions particulières ;
- type de contrat recommandé ;
- informations de périmètre.

Valeurs par défaut issues du catalogue/offre, toujours modifiables au niveau du devis.

---

## 13. Numérotation

Utiliser `number_sequences`.

Format par défaut :

`DEV-2026-001`

Règles :

- unique ;
- séquence annuelle ;
- générée au moment de la première sauvegarde durable du devis ;
- jamais réutilisée si un devis est ensuite annulé/archivé.

Le format doit rester configurable dans Réglages.

---

## 14. Statuts Devis

Codes V1 :

- `draft` → Brouillon
- `sent` → Envoyé
- `viewed` → Vu
- `accepted` → Accepté
- `refused` → Refusé
- `expired` → Expiré
- `cancelled` → Annulé

Transitions :

- Draft → Sent
- Sent → Viewed / Accepted / Refused / Expired
- Viewed → Accepted / Refused / Expired

Un devis accepté devient figé.

Un devis refusé/expiré reste historisé et peut être dupliqué vers un nouveau devis.

---

## 15. Acceptation

### 15.1 Si devis lié à un Client

- passer à `accepted` ;
- figer le devis ;
- journaliser ;
- le déclarer prêt pour la transformation en projet.

### 15.2 Si devis lié à un Prospect

Transaction unique :

1. accepter le devis ;
2. convertir/rattacher le Prospect au Client via le service Phase 1 ;
3. marquer le Prospect `won` ;
4. rattacher le devis au `client_account` obtenu ;
5. journaliser les événements ;
6. déclarer le devis prêt pour Projet.

Relancer l’acceptation ne doit jamais créer un second client.

---

## 16. Handoff vers Phase 3 Projets

Phase 2 ne doit pas créer un faux projet minimal qui devra être migré ensuite.

À la place, un devis accepté expose un état/action :

**Prêt à transformer en projet**

La Phase 3 implémentera l’action complète :

- choix/version du modèle de projet ;
- instanciation lots/modules/tâches ;
- services du devis ;
- ressources ;
- prérequis ;
- facturation attendue ;
- timer.

En attendant, les devis acceptés non transformés apparaissent dans le Dashboard « À surveiller ».

---

## 17. Prévisualisation / PDF

Phase 2 doit permettre :

- prévisualisation client propre ;
- masquage des informations internes (prix conseillé, notes internes, raisons internes) ;
- génération PDF via le service `printToPDF()` prévu dans l’architecture ;
- stockage du PDF comme fichier maître/référence document quand le module Documents sera raccordé.

En V1 initiale, le PDF peut être généré directement depuis le devis sans attendre l’éditeur documentaire complet.

---

## 18. Modèle de données à ajuster

### `catalog_versions`

Ajouter/retenir :

- `status` (`draft`, `published`, `retired`)
- `published_at`

### `quote_lines`

Préférer :

- `quantity_milli` au lieu d’une quantité flottante ;
- `adjustment_mode` ;
- `adjustment_value` ;
- `discount_reason_code` ;
- `discount_reason_text` ;
- `catalog_line_value_cents` ;
- `contract_line_value_cents`.

### `quotes`

Ajouter/retenir :

- `accepted_client_account_id` si nécessaire pour tracer la conversion ;
- `project_ready_at` ;
- `project_id` nullable ajouté en Phase 3 ou table de liaison si préférable ;
- `sent_at`, `viewed_at`, `accepted_at`, `refused_at`, `expired_at` ;
- `snapshot_locked_at` lors de l’acceptation.

Les choix définitifs seront matérialisés par migration au moment du développement.

---

## 19. API IPC cible

```ts
catalog.list(filters)
catalog.getItem(id)
catalog.createService(input)
catalog.createOffer(input)
catalog.createVersion(itemId, input)
catalog.publishVersion(versionId)
catalog.archiveItem(id)

quotes.list(filters)
quotes.get(id)
quotes.create(input)
quotes.addCatalogLine(quoteId, catalogVersionId, options)
quotes.addCustomLine(quoteId, input)
quotes.updateLine(lineId, input)
quotes.removeLine(lineId)
quotes.reorderLines(quoteId, lineIds)
quotes.updateConditions(quoteId, input)
quotes.preview(id)
quotes.generatePdf(id)
quotes.markSent(id)
quotes.markViewed(id)
quotes.accept(id)
quotes.refuse(id, reason?)
quotes.expire(id)
quotes.duplicate(id)
```

API métier limitée, typée, validation main process obligatoire.

---

## 20. Tests obligatoires

### Catalogue

- création service ;
- publication version ;
- nouvelle version sans altérer ancienne ;
- composition offre ;
- archivage ;
- dernière version publiée correctement sélectionnée.

### Devis

- numérotation unique ;
- ligne catalogue avec snapshot ;
- ligne libre ;
- calcul quantité 1 / 1,5 / autre ;
- remise % ;
- remise fixe ;
- override ;
- gratuité ;
- valeur catalogue distincte du contractuel ;
- modification catalogue sans effet sur devis existant ;
- acceptation prospect → client sans doublon ;
- acceptation client existant ;
- devis accepté verrouillé ;
- duplication devis refusé/expiré ;
- PDF sans données internes.

---

## 21. Critères d’acceptation Phase 2

La Phase 2 est terminée lorsque :

- un Service peut être créé/versionné ;
- une Offre peut composer plusieurs Services ;
- la grille tarifaire affiche la version courante ;
- un devis peut être créé pour un Prospect ou un Client ;
- une ligne Catalogue conserve son snapshot ;
- une ligne libre peut être ajoutée ;
- les remises et gratuités conservent valeur catalogue + valeur contractuelle ;
- le devis est numéroté ;
- prévisualisation et PDF fonctionnent ;
- les statuts fonctionnent ;
- l’acceptation d’un devis prospect crée/rattache le Client sans doublon ;
- le devis accepté est figé ;
- il apparaît « prêt à transformer en projet » ;
- la recherche globale retrouve Services/Offres/Devis si cette extension est activée dans la phase ;
- les trois thèmes sont cohérents ;
- les tests automatisés passent.
# Stabilisation transverse (migration 19)

Le pipeline distingue `quote_to_prepare` (« Devis en préparation ») et `quote_to_send` (« Devis à envoyer »). Finaliser un devis conserve son statut technique `draft`, puis l’envoi pose le statut `sent` et l’étape prospect `quote_sent`. Un devis envoyé reste figé : la négociation passe par une duplication en nouveau brouillon. La prolongation de validité est journalisée.

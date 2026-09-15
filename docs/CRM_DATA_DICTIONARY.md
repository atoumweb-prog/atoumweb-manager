# AtoumWeb Manager — Dictionnaire consolidé des données CRM

> Branche : `fix/recette-commerciale-coherence`.
>
> Ce document est centré sur le périmètre commercial en recette. `DATA_MODEL_V1.md` reste le dictionnaire exhaustif du schéma global. Les fichiers métier restent hors SQLite ; SQLite ne conserve que leurs métadonnées et chemins relatifs.

## Règles générales

- Les montants sont stockés en centimes entiers.
- Les dates métier sont stockées en texte ISO lorsqu’elles portent une heure, ou en date ISO pour les dates simples.
- Les suppressions automatiques de données Client ne sont pas prévues : archivage, revue de conservation et suppression confirmée sont distincts.
- Les données calculées ne doivent pas devenir une seconde source de vérité.

## `organizations`

Source de vérité de la structure / société.

Champs principaux : `id`, `name`, `legal_name`, `siret`, `website`, adresse, `industry`, `notes`, timestamps et archivage.

Les anciennes colonnes `email` et `phone` restent des valeurs de compatibilité. Les nouvelles coordonnées sont dans `contact_methods`.

## `contacts`

Source de vérité de la personne.

Champs principaux : `id`, `organization_id`, prénom, nom, fonction, canal préféré, notes, timestamps et archivage.

Les anciennes colonnes `email` et `phone` sont des fallbacks ; elles ne doivent plus être considérées comme la source principale lorsque `contact_methods` contient une valeur active.

## `contact_methods`

Source principale des emails et téléphones multiples.

Champs :

- propriétaire exclusif : `organization_id` ou `contact_id` ;
- `method_type`: `email|phone` ;
- `value` ;
- `label` ;
- `is_primary` ;
- `notes` ;
- timestamps et `archived_at`.

Règles : un seul propriétaire, pas de doublon actif équivalent, une seule coordonnée principale par propriétaire/type. La liste Clients et la recherche utilisent cette table en priorité.

## `prospects`

Dossier commercial avant conversion Client.

### Identité

`organization_id`, `contact_id`, `client_account_id`.

### Pipeline

`stage` :

`new|qualifying|need_identified|quote_to_prepare|quote_to_send|quote_sent|follow_up|negotiation|waiting|won|lost`.

`temperature` : `cold|neutral|warm|hot`.

### Acquisition

`source`, `source_detail`.

### Qualification

- `decision_status`, `decision_maker_details` ;
- `project_summary`, `project_context` ;
- `budget_status`, `budget_min_cents`, `budget_max_cents` ;
- `timeline_status`, `timeline_note`, `target_date` ;
- `existing_status`, `existing_url`, `existing_notes` ;
- `missing_information`.

`missing_information` accepte encore le legacy texte libre ; l’UI V2 utilise un JSON `{selected, other}`. Cette compatibilité doit être conservée tant qu’aucune migration dédiée n’est créée.

### Suivi

`estimated_value_cents`, `probability_percent`, `next_action_at`, `next_action_text`, `notes`.

Les deux champs `next_action_*` sont des caches de compatibilité synchronisés depuis `crm_actions`.

### Attente / issue

`waiting_reason_code`, `waiting_reason_text`, `waiting_resume_at`, `lost_reason`, `lost_reason_code`, `won_at`, `lost_at`, `archived_at`.

Les champs historiques `primary_need` / `secondary_need` restent des fallbacks ; les besoins vivants sont dans `crm_needs`.

## `crm_needs`

Source de vérité des besoins / offres / services attachés au Prospect ou au Client.

Un besoin contient soit `catalog_item_id`, soit `other_text`. Un besoin vide n’est pas un besoin valide. Lors de la conversion Client, les besoins restent partagés sans duplication destructrice.

## `crm_actions`

Source de vérité des actions commerciales et relances.

Champs principaux :

- propriétaire Prospect ou Client ;
- `action_type`: `action|follow_up` ;
- `title`, `due_at`, `notes` ;
- `status`: `open|done|cancelled` ;
- `completed_at` ;
- `completion_channel`, `completion_outcome`, `completion_notes` ;
- `related_type`, `related_id` ;
- `recurrence`: `none|weekly|monthly|quarterly|yearly`.

Une relance exige une date. Une action récurrente terminée reste dans l’historique et crée la prochaine occurrence.

## `quotes`

Devis commercial/contractuel.

Champs structurants :

- `quote_number` unique ;
- propriétaire Prospect ou Client ;
- objet et résumé du besoin ;
- `status`: `draft|sent|viewed|accepted|refused|expired|cancelled` ;
- `finalized_at` distinct du statut ;
- validité et prolongation ;
- conditions, délai, acompte ;
- valeurs catalogue, remise, total contractuel, acompte et solde ;
- `sent_at`, `viewed_at`, `accepted_at`, `refused_at`, `expired_at` ;
- `snapshot_locked_at`, `project_ready_at` ;
- lien Projet.

Règle V1 : un devis ne peut être envoyé que s’il a été finalisé. Un devis accepté est figé.

## `quote_lines`

Lignes du devis : source `catalog|custom`, quantité, prix proposés, ajustement/remise, valeurs calculées et `snapshot_json`.

Le snapshot d’une ligne catalogue est contractuel : une modification ultérieure du catalogue ne doit pas changer un ancien devis.

## `client_accounts`

Relation Client après conversion ou création directe.

Champs : organisation/contact principal, `status` `active|inactive|archived`, date de passage Client, prochaine action cache, notes, indicateur de relation `excellent|good|neutral|watch|difficult`, timestamps et archivage.

Les contraintes d’unicité empêchent la création de plusieurs Clients pour la même organisation dans le parcours normal.

## `client_contact_roles`

Associe des contacts au Client : `primary|administrative|billing|technical|other`. Un seul rôle principal effectif par Client.

## `client_documents`

Métadonnées des fichiers du Dossier Client ; les octets restent dans le workspace.

Le modèle actuel utilise encore les catégories techniques historiques :

`contract|quote|invoice|brief|content|technical|legal|other`.

La taxonomie métier validée cible :

1. Administratif & identité ;
2. Identité visuelle ;
3. Devis & contrats ;
4. Facturation & paiements ;
5. Échanges importants ;
6. Documents fournis par le client ;
7. RGPD / consentements / demandes ;
8. Archives.

Cette évolution nécessite une migration dédiée avec mapping explicite et tests de conservation des chemins/fichiers. Elle n’est pas incluse dans la stabilisation Prospect/Devis en cours.

## Journaux

`activity_events` est le journal CRM détaillé. `activity_log` est encore utilisé par d’autres modules. La coexistence est connue et ne doit pas être fusionnée sans passe d’architecture spécifique.

## Recherche

`search_documents` est un index dérivé et reconstruisible. Les documents de recherche Client et Prospect intègrent désormais les coordonnées multiples actives afin qu’une modification de `contact_methods` soit retrouvable sans dépendre des anciennes colonnes legacy.
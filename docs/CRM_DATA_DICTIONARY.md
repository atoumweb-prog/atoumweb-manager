# AtoumWeb Manager — Dictionnaire des données

> Snapshot : `fix/recette-commerciale-prospects` @ `be9d086bd4b284269eabeb7b0199b275cbda59a7`.
>
> SQLite applique 19 migrations. Les types sont ceux du schéma SQL réel ; `?` signifie nullable. `PK`, `FK`, `UQ`, `CK` signalent les contraintes principales.

## Vue d’ensemble

Les migrations définissent **50 tables applicatives inventoriées** ci-dessous, auxquelles s’ajoute `schema_migrations` gérée par le moteur de migration. Certaines tables sont métier, d’autres sont techniques (index de recherche, séquences, démo).

## CRM

### `organizations` — source de vérité société

| Champ | Type / contraintes |
|---|---|
| `id` | TEXT PK |
| `name` | TEXT NOT NULL |
| `legal_name` | TEXT? |
| `siret` | TEXT? |
| `email` | TEXT? **legacy/repli** |
| `phone` | TEXT? **legacy/repli** |
| `website` | TEXT? |
| `address_line1`, `address_line2` | TEXT? |
| `postal_code`, `city`, `country` | TEXT? |
| `industry` | TEXT? |
| `notes` | TEXT? — actuellement utilisé aussi pour la description d’activité |
| `created_at`, `updated_at` | TEXT NOT NULL |
| `archived_at` | TEXT? |

Index : nom, archivage. Fichiers physiques : aucun.

### `contacts` — source de vérité personne

`id PK`, `organization_id FK organizations?`, `first_name NOT NULL`, `last_name NOT NULL`, `job_title?`, `email? legacy`, `phone? legacy`, `preferred_channel?`, `notes?`, `avatar_asset_id?`, `created_at`, `updated_at`, `archived_at?`.

Index : organisation, nom/prénom, archivage.

### `contact_methods` — source actuelle des coordonnées multiples

`id PK`, **un seul propriétaire** parmi `organization_id FK?` / `contact_id FK?`, `type` CK `email|phone`, `value NOT NULL`, `label?`, `is_primary INTEGER DEFAULT 0 CK 0/1`, `notes?`, `created_at`, `updated_at`, `archived_at?`.

Contraintes : propriétaire exclusif ; unicité active par propriétaire/type/valeur. Lorsqu’une coordonnée devient principale, le service dégrade les autres du même type pour le même propriétaire.

### `client_accounts`

`id PK`, `organization_id FK?`, `primary_contact_id FK?`, `status NOT NULL DEFAULT active CK active|inactive|archived`, `became_client_at NOT NULL`, `next_action_at?`, `next_action_text?`, `notes?`, `relationship_status DEFAULT neutral CK excellent|good|neutral|watch|difficult`, `relationship_note?`, `created_at`, `updated_at`, `archived_at?`.

CK : organisation ou contact requis. Index : statut, organisation, contact, prochaine action. Unicités partielles : un client par organisation non nulle ; un client individuel par contact principal lorsque l’organisation est nulle.

`next_action_*` est un **cache de compatibilité**, recalculé depuis `crm_actions`.

### `client_contact_roles`

`id PK`, `client_account_id FK CASCADE`, `contact_id FK`, `role CK primary|administrative|billing|technical|other`, `is_primary DEFAULT 0 CK 0/1`, `created_at`.

UQ `(client_account_id,contact_id,role)` + index unique partiel garantissant un seul `is_primary=1` par client.

### `prospects`

Version finale issue migration 19 :

- Identité : `id PK`, `organization_id FK?`, `contact_id FK?`, `client_account_id FK?`.
- Pipeline : `stage NOT NULL` CK `new|qualifying|need_identified|quote_to_prepare|quote_to_send|quote_sent|follow_up|negotiation|waiting|won|lost`.
- Température : `temperature NOT NULL` CK `cold|neutral|warm|hot`.
- Acquisition : `source?`, `source_detail?`.
- Besoins legacy : `primary_need?`, `secondary_need?` — **ne pas considérer comme source de vérité** quand `crm_needs` existe.
- Budget : `budget_min_cents? >=0`, `budget_max_cents? >=0`, `estimated_value_cents? >=0`, `budget_status?` CK `known|range|not_disclosed`.
- Qualification : `decision_status?` CK `yes|no|unknown`, `decision_maker_details?`, `project_summary?`, `project_context?`, `timeline_status?` CK `date|note|not_disclosed`, `timeline_note?`, `existing_status?` CK `yes|no|unknown`, `existing_url?`, `existing_notes?`, `missing_information?`.
- Suivi : `probability_percent?`, `next_action_at?`, `next_action_text?`, `target_date?`, `notes?`.
- Attente : `waiting_reason_code?`, `waiting_reason_text?`, `waiting_resume_at?`.
- Issue : `lost_reason?`, `lost_reason_code?`, `won_at?`, `lost_at?`.
- Audit : `created_at`, `updated_at`, `archived_at?`.

CK : organisation ou contact requis ; budget max >= min lorsqu’ils existent. Index sur étape, organisation/contact, client lié, prochaine action, archive.

### `crm_needs` — source de vérité besoins/offres/services

`id PK`, `prospect_id FK?`, `client_account_id FK?`, `catalog_item_id FK?`, `other_text?`, `created_at NOT NULL`.

CK : propriétaire Prospect ou Client ; contenu exclusif = soit catalogue, soit texte libre non vide. Un trigger recopie `client_account_id` lors de la conversion d’un Prospect.

### `crm_actions`

`id PK`, `owner_type CK prospect|client`, `prospect_id FK? CASCADE`, `client_account_id FK? CASCADE`, `action_type CK action|follow_up`, `title NOT NULL`, `due_at?`, `notes?`, `status DEFAULT open CK open|done|cancelled`, `completed_at?`, `completion_channel?`, `completion_outcome?`, `completion_notes?`, `related_type?`, `related_id?`, `recurrence? CK none|weekly|monthly|quarterly|yearly`, `created_at`, `updated_at`.

CK : exactement un propriétaire cohérent avec `owner_type`.

### `activity_events`

Journal CRM détaillé : `id PK`, `entity_type`, `entity_id`, `action`, `summary`, `metadata_json?`, liens optionnels `prospect_id`, `client_account_id`, `organization_id`, `contact_id`, `created_at`.

### `activity_log`

Journal transverse historique utilisé notamment par Projets / Opérations / Maintenance : `id INTEGER PK AUTOINCREMENT`, `entity_type`, `entity_id?`, `action`, `summary`, `metadata_json?`, `created_at`.

**Recommandation** : documenter la coexistence de ces deux journaux ou converger à terme vers une vue commune.

### `search_documents`

Index matérialisé de recherche : `id PK`, `entity_type`, `entity_id`, `title`, `subtitle?`, `status?`, `search_text`, `updated_at`; UQ `(entity_type,entity_id)`. Donnée dérivée reconstruisible.

## Catalogue & Devis

### `catalog_items`

`id PK`, `item_type CK service|offer`, `name NOT NULL`, `category?`, `status DEFAULT active CK active|inactive|archived`, `visible_public DEFAULT 0 CK 0/1`, `created_at`, `updated_at`, `archived_at?`.

### `catalog_versions`

`id PK`, `item_id FK CASCADE`, `version_number >0`, `status CK draft|published|retired`, `description?`, `inclusions_json DEFAULT []`, `exclusions_json DEFAULT []`, `prerequisites_json DEFAULT []`, `price_mode CK fixed|starting_from|hourly|monthly|yearly|quote_only|free`, `price_cents? >=0`, `recommended_price_cents? >=0`, `estimated_minutes? >=0`, `recommended_delay?`, `default_deposit_percent? 0..100`, `contract_type?`, `internal_advice?`, `special_terms?`, `published_at?`, `created_at`.

UQ item/version ; une seule version publiée par item (index partiel).

### `offer_components`

`id PK`, `offer_version_id FK CASCADE`, `service_version_id FK`, `is_optional DEFAULT 0 CK 0/1`, `quantity_milli DEFAULT 1000 >0`, `sort_order DEFAULT 0`, `created_at`; UQ offre/service/optionnalité.

### `quotes`

`id PK`, `quote_number UQ`, `prospect_id FK?`, `client_account_id FK?`, `accepted_client_account_id FK?`, `subject NOT NULL`, `need_summary?`, `status DEFAULT draft CK draft|sent|viewed|accepted|refused|expired|cancelled`, `validity_days? >0`, `valid_until?`, `estimated_delay?`, `prerequisites_text?`, `special_terms?`, `contract_type?`, `deposit_percent? 0..100`, valeurs `catalog_value_cents`, `discount_value_cents`, `contract_value_cents`, `deposit_cents`, `balance_cents` NOT NULL >=0, `sent_at?`, `viewed_at?`, `accepted_at?`, `refused_at?`, `expired_at?`, `snapshot_locked_at?`, `project_ready_at?`, `finalized_at?`, `last_extended_at?`, `project_id FK?`, `created_at`, `updated_at`.

CK : propriétaire Prospect ou Client. `project_id` est unique partiel. `finalized_at` n’est pas un statut séparé.

### `quote_lines`

`id PK`, `quote_id FK CASCADE`, `sort_order`, `source CK catalog|custom`, `catalog_item_id FK?`, `catalog_version_id FK?`, `label NOT NULL`, `description?`, `quantity_milli >0`, prix unitaires `? >=0`, `adjustment_mode CK none|percent|fixed_amount|override_price|free`, `adjustment_value?`, `discount_reason_code?`, `discount_reason_text?`, valeurs ligne >=0, `snapshot_json?`, `created_at`, `updated_at`.

Le `snapshot_json` est la copie contractuelle du catalogue au moment d’ajout de la ligne ; il ne doit pas être recalculé depuis le catalogue lors de la lecture d’un devis historique.

## Projet / Production

### `project_templates`

`id PK`, `name`, `project_type`, `status DEFAULT active CK active|inactive|archived`, `created_at`, `updated_at`, `archived_at?`. UQ actif sur type+nom.

### `project_template_versions`

`id PK`, `template_id FK CASCADE`, `version_number >0`, `status CK draft|published|retired`, `description?`, `published_at?`, `created_at`; UQ template/version ; une seule publiée.

### `project_template_nodes`

`id PK`, `template_version_id FK CASCADE`, `parent_id self FK CASCADE?`, `node_type CK lot|module|task|checklist`, `display_subtype?`, `name`, `description?`, `sort_order`, `estimated_minutes? >=0`, `is_required DEFAULT1`, `initial_status CK todo|in_progress|waiting_client|blocked|to_validate|done`, `time_category?`, `created_at`.

### `projects`

`id PK`, `project_number UQ`, `client_account_id FK?`, `source_quote_id UQ FK?`, `template_version_id FK?`, `name`, `project_type`, `status CK to_prepare|in_progress|waiting_client|blocked|to_validate|completed|archived`, `commercial_mode CK normal|discounted|free|partnership|internal`, `start_date?`, `target_date?`, `commercial_value_cents >=0`, `contract_value_cents >=0`, `resource_root_path?`, `notes?`, `created_at`, `updated_at`, `completed_at?`, `archived_at?`.

CK : projet interne ou client requis. `progressPercent` et `estimatedMinutes` sont **calculés** depuis les nœuds, jamais stockés.

### `project_nodes`

Même structure fonctionnelle que les nœuds de modèle + `project_id FK CASCADE`, `source_template_node_id FK?`, `status` courant, `updated_at`.

### `project_services`

Snapshot de production issu du devis : `id`, `project_id FK CASCADE`, `source_quote_line_id FK?`, `catalog_item_id?`, `catalog_version_id?`, `label`, `snapshot_json?`, `catalog_value_cents`, `contract_value_cents`, `created_at`; UQ `(project_id,source_quote_line_id)`.

### `project_prerequisites`

`id`, `project_id FK CASCADE`, `label`, `description?`, `status CK to_request|requested|received|incomplete|validated|not_applicable`, `is_required`, `sort_order`, `requested_at?`, `received_at?`, `validated_at?`, timestamps.

### `file_assets` / `file_asset_links`

Métadonnées des fichiers de production. `file_assets` porte projet/client, chemin relatif unique dans le projet, nom original, dossier `identity|texts|media|documents|technical|deliverables|archives`, statut, rôle de contenu, MIME, taille, checksum, timestamps et indicateur de fichier manquant. Les octets restent **hors SQLite** dans le workspace.

`file_asset_links` relie une ressource à un `project_node`; UQ ressource/nœud.

### `technical_items`, `technical_item_versions`, `technical_version_assets`

Bibliothèque technique versionnée. Catégories : header, footer, hero, page, section, css, javascript, php, acf, divi, woocommerce, plugin, config, note, other. Les versions possèdent type de contenu `code|json|text|reference`, flags `current`/`stable` avec unicités partielles et liens vers ressources physiques.

## Demandes / Interventions

### `service_requests`

`id`, `client_account_id FK NOT NULL`, `project_id FK? SET NULL`, `source CK email|phone|website_form|message|meeting|atoumweb_detection|other`, `subject`, `description?`, `priority CK low|normal|high|urgent`, `received_at`, `next_action_at?`, `next_action_text?`, `status CK new|to_qualify|waiting_client|planned|converted|closed|archived`, `close_reason?`, `notes?`, timestamps, `archived_at?`.

### `interventions`

`id`, `intervention_number UQ`, `client_account_id FK`, `project_id FK?`, `project_node_id FK?`, `source_request_id UQ FK?`, `maintenance_period_id?`, `hour_pack_id?`, `intervention_type CK correction|modification|addition|maintenance|incident|support|training|other`, `status CK to_plan|planned|in_progress|waiting_client|blocked|to_validate|completed|cancelled|archived`, `coverage_mode CK maintenance|hour_pack|out_of_scope|commercial_gesture|included_project|internal`, `subject`, `description?`, `priority`, `scheduled_at?`, `started_at?`, `completed_at?`, `theoretical_value_cents >=0`, `billable_amount_cents >=0`, `notes?`, champs incident (`incident_criticality`, dates, downtime, cause, diagnostic, solution, follow_up), timestamps/archive.

CK : un nœud implique un projet ; champs incident cohérents avec le type incident.

## Temps

### `time_sessions`

`id`, `client_account_id FK?`, `project_id FK?`, `project_node_id FK?`, `intervention_id?`, `category CK production|development|design|meeting|support|client_correction|internal_correction|research_training|administrative|other`, `activity_label?`, `started_at`, `ended_at?`, `billable DEFAULT1`, `source CK timer|manual|import`, `note?`, `created_at`, `updated_at`.

CK fin >= début. Index unique partiel : **une seule session globale avec `ended_at IS NULL`**. `durationSeconds`, `paused`, labels client/projet/intervention sont calculés à la lecture.

### `time_session_pauses`

`id`, `time_session_id FK CASCADE`, `started_at`, `ended_at?`, `created_at`; CK fin >= début ; index unique partiel une seule pause ouverte par session.

## Maintenance

### `maintenance_checklist_templates`

`id`, `name`, `status`, timestamps/archive.

### `maintenance_checklist_template_items`

`id`, `template_id FK CASCADE`, `label`, `description?`, `sort_order`, `is_required`, `created_at`.

### `maintenance_plans`

`id`, `name`, `periodic_price_cents >=0`, `frequency CK monthly|quarterly|yearly`, `included_interventions >=0`, `included_minutes? >=0`, `carryover_mode CK none|next_period|custom`, `checklist_template_id FK?`, `status CK active|archived`, `notes?`, timestamps/archive.

### `maintenance_subscriptions`

`id`, client/project/plan FKs, snapshots du nom, fréquence, quotas, prix catalogue et carryover ; `contract_price_cents >=0`, `start_date`, `end_date?`, `status CK active|suspended|ended|archived`, `notes?`, timestamps/archive. Les snapshots protègent l’historique lorsque le plan change.

### `maintenance_periods`

`id`, `subscription_id FK CASCADE`, bornes de période, quotas copiés, `status CK upcoming|open|to_do|in_progress|completed|closed`, `closed_at?`, `notes?`, timestamps ; UQ souscription/début/fin.

### `maintenance_checks`

`id`, `period_id FK CASCADE`, item modèle FK?, libellé/description/sort/required, `status CK todo|done|not_applicable`, `completed_at?`, `notes?`; UQ période/sort/libellé.

### `maintenance_overage_decisions`

`id`, `period_id FK CASCADE`, `intervention_id UQ FK CASCADE`, décision `bill_out_of_scope|commercial_gesture|include_exceptionally|carry_forward|other`, raison, montant attendu, timestamps.

### `maintenance_report_drafts`

Une ligne par période : `period_id PK/FK CASCADE`, `client_summary?`, `anomalies_actions?`, `recommendations?`, `updated_at`.

## Packs d’heures

### `hour_packs`

`id`, client/project FKs, `name`, `purchased_seconds >0`, `contract_price_cents >=0`, `purchased_at`, `expires_at?`, `status CK active|exhausted|expired|suspended|archived`, `notes?`, timestamps/archive. CK expiration >= achat.

`balanceSeconds` et `consumedSeconds` sont calculés depuis les mouvements.

### `hour_pack_movements`

`id`, `pack_id FK CASCADE`, `intervention_id?`, `time_session_id?`, `reversal_of_movement_id self FK?`, `movement_type CK initial_credit|intervention_debit|manual_correction|commercial_credit|reversal`, `seconds_delta !=0`, `reason`, `source_key UQ?`, `created_at`. Une annulation maximum par mouvement.

### `hour_pack_shortfall_decisions`

`id`, pack/debit/intervention FKs, décision `bill_complement|allow_negative|use_other_pack|commercial_gesture|other`, `reason`, `shortfall_seconds >0`, `expected_amount_cents >=0`, `alternative_pack_id?`, timestamps ; UQ pack/intervention.

## Facturation préparatoire

### `billing_items`

Élément de préparation Abby : client/projet, `source_type` (quote_deposit, project_balance, intervention, maintenance_overage, hour_pack, subscription, other), `source_id`, clé source unique, description, montants >=0, date d’échéance, statut `planned|ready|invoiced|cancelled|offered`, notes, timestamps. **Abby reste la source réglementaire des factures.**

## Documents Client

### `client_documents`

`id PK`, `client_account_id FK ON DELETE RESTRICT`, `category CK contract|quote|invoice|brief|content|technical|legal|other`, `title NOT NULL`, `original_name NOT NULL`, `relative_path UQ NOT NULL`, `mime_type?`, `size_bytes DEFAULT0`, `retention_code?`, `retention_reason?`, `retention_until?`, `notes?`, `archived_at?`, `created_at`, `updated_at`.

Fichiers physiques : `<workspace>/clients/<client-id>/Documents/<catégorie>/...`. L’archivage ne déplace ni ne supprime le fichier. La suppression définitive efface d’abord le fichier puis la métadonnée.

**Écart fonctionnel connu** : les catégories actuelles ne correspondent pas encore à la taxonomie métier validée (Administratif & identité, Identité visuelle, Devis & contrats, Facturation & paiements, Échanges importants, Documents fournis par le client, RGPD, Archives).

## Tables techniques / support

- `settings` : clé/JSON/updated_at.
- `number_sequences` : compteur annuel par type pour devis/projet/intervention.
- `demo_batches`, `demo_records`, `demo_context` : isolation des données de démonstration.
- `search_documents` : index de recherche reconstruisible.
- `schema_migrations` : registre des 19 migrations (moteur de DB, hors inventaire applicatif de 50 tables).

## Règles de suppression / archivage

- Organisation/contact : archivage logique.
- Prospect : `archived_at`, conservation de l’historique.
- Client : statut `archived` + date ; documents conservés.
- Besoin : suppression physique ciblée possible.
- Action : pas de suppression UI standard ; statut annulé/terminé.
- Devis accepté/envoyé : conservation ; snapshots de lignes.
- Projet : statut `archived`, ressources conservées.
- Fichiers projet : métadonnées et fichiers physiques distincts.
- Document client : archivage logique ; suppression définitive explicite et destructive.
- Mouvement pack d’heures : correction par mouvement inverse, pas par réécriture de l’historique.

## Données calculées à ne pas dupliquer

- besoin affiché Prospect à partir de `crm_needs` ;
- prochaine action calculable depuis `crm_actions` (`next_action_*` = cache legacy) ;
- valeurs totales devis recalculées depuis lignes ;
- progression projet et estimation totale depuis `project_nodes` ;
- durée session depuis début/fin/pauses ;
- temps intervention depuis sessions ;
- usage maintenance depuis interventions + temps ;
- solde/consommation pack d’heures depuis mouvements ;
- labels client/projet/contact provenant des relations, pas de copies supplémentaires hors snapshots contractuels.

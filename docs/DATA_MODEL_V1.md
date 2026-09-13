# Modèle de données V1 — AtoumWeb Manager

## Statut

Modèle initial décidé le 13/09/2026. Il sert de base au premier schéma SQLite et peut évoluer par migrations versionnées.

## 1. Principes

- une donnée métier possède une source unique ;
- les écrans n’enregistrent pas de copies indépendantes ;
- les tables d’index/recherche et statistiques sont dérivées ;
- l’archivage est préféré à la suppression ;
- argent en centimes entiers ;
- durées en secondes ;
- timestamps ISO 8601 UTC ;
- IDs UUID texte ;
- snapshots JSON uniquement quand l’historique doit figer un état (devis, modèles, document finalisé).

## 2. Système

### `schema_migrations`

Suit les migrations déjà appliquées.

Champs principaux : `version`, `name`, `applied_at`.

### `app_settings`

Préférences globales : thème, aides au survol, dashboard, notifications, règles de temps, chemins, rétention des sauvegardes.

Champs : `key`, `value_json`, `updated_at`.

### `storage_roots`

Emplacements connus du CRM.

Champs : `id`, `label`, `kind` (`workspace`, `external`, `server`, `other`), `path_or_url`, `is_default`, `created_at`.

### `number_sequences`

Numérotation des devis, projets, interventions, contrats et autres documents.

Champs : `id`, `sequence_key`, `prefix`, `year`, `next_value`, `format`.

## 3. Organisations, contacts et clients

### `organizations`

Sociétés/structures connues, qu’elles soient prospect, client, fournisseur ou partenaire.

Champs principaux :

- `id`
- `name`
- `legal_name`
- `siret`
- `email`
- `phone`
- `website`
- adresse structurée
- `notes`
- `archived_at`
- `created_at`, `updated_at`

### `contacts`

Personnes physiques, avec ou sans organisation.

Champs : `id`, `organization_id`, `first_name`, `last_name`, `role`, `email`, `phone`, `preferred_channel`, `notes`, `avatar_asset_id`, `archived_at`.

### `client_accounts`

Matérialise la relation client sans recopier l’identité de l’organisation/contact.

Champs :

- `id`
- `organization_id` nullable
- `primary_contact_id` nullable
- `status` (`active`, `inactive`, `archived`)
- `became_client_at`
- `archived_at`
- `notes`

Règle : un client archivé peut être réactivé. « A déjà été client » est déduit de l’existence/historique de ce compte.

### `directory_entries`

Classe une organisation/contact dans l’annuaire interne.

Champs : `id`, `organization_id`, `contact_id`, `category`, `is_favorite`, `notes`.

## 4. Prospects

### `prospects`

Le prospect référence une organisation/contact existant, ce qui permet la conversion en client sans double saisie.

Champs :

- `id`
- `organization_id`
- `contact_id`
- `stage`
- `temperature`
- `source`
- `primary_need`
- `secondary_need`
- `budget_min_cents`, `budget_max_cents`
- `estimated_value_cents`
- `probability_percent`
- `next_action_at`
- `next_action_text`
- `lost_reason`
- `won_at`
- `client_account_id`
- `archived_at`
- timestamps

## 5. Catalogue — Services et Offres

### `catalog_items`

Identité stable d’un service ou d’une offre.

Champs : `id`, `kind` (`service`, `offer`), `code`, `name`, `category`, `status`, `public_visible`, `archived_at`.

### `catalog_versions`

Version figée du contenu/tarif d’un item.

Champs :

- `id`
- `catalog_item_id`
- `version_number`
- `effective_from`
- `description`
- `price_mode`
- `price_cents`
- `recommended_price_cents`
- `hourly_rate_cents`
- `monthly_rate_cents`
- `estimated_seconds`
- `recommended_delivery_days`
- `default_deposit_percent`
- `contract_type`
- `inclusions_json`
- `exclusions_json`
- `prerequisites_json`
- `options_json`
- `advice_json`
- `created_at`

### `offer_version_components`

Composition d’une version d’offre.

Champs : `id`, `offer_version_id`, `component_catalog_version_id`, `quantity`, `is_optional`, `position`.

## 6. Devis

### `quotes`

Champs :

- `id`
- `quote_number`
- `prospect_id`
- `client_account_id`
- `project_type`
- `status`
- `currency`
- `catalog_value_cents`
- `discount_total_cents`
- `total_cents`
- `deposit_percent`
- `valid_until`
- `estimated_delivery_text`
- `conditions_json`
- dates d’envoi/vue/acceptation/refus
- `archived_at`
- timestamps

### `quote_lines`

Chaque ligne contient son snapshot indépendant du catalogue.

Champs :

- `id`
- `quote_id`
- `source_catalog_item_id` nullable
- `source_catalog_version_id` nullable
- `label`
- `description`
- `quantity`
- `catalog_unit_price_cents`
- `proposed_unit_price_cents`
- `discount_type`
- `discount_value`
- `discount_reason`
- `line_total_cents`
- `snapshot_json`
- `position`

Règle : une modification ultérieure du catalogue n’affecte jamais cette ligne.

## 7. Modèles de projets

### `project_templates`

Identité stable d’un modèle : site vitrine, e-commerce, application, logiciel, etc.

Champs : `id`, `name`, `project_type`, `status`, `archived_at`.

### `project_template_versions`

Champs : `id`, `project_template_id`, `version_number`, `description`, `is_active`, `created_at`.

### `project_template_nodes`

Arbre standard du modèle.

Champs :

- `id`
- `template_version_id`
- `parent_id`
- `node_type` (`lot`, `module`, `task`, `checklist`)
- `name`
- `description`
- `position`
- `estimated_seconds`
- `is_required`
- `default_status`

## 8. Projets

### `projects`

Champs :

- `id`
- `project_number`
- `client_account_id`
- `source_quote_id`
- `template_version_id`
- `name`
- `project_type`
- `status`
- `commercial_mode` (`normal`, `discounted`, `offered`, `partnership`, `internal`)
- `commercial_value_cents`
- `contracted_amount_cents`
- `start_date`
- `target_date`
- `completed_at`
- `archived_at`
- timestamps

Les montants facturés/encaissés sont calculés depuis la facturation ; ils ne sont pas copiés dans le projet.

### `project_nodes`

Arbre réel du projet, indépendant du modèle après instanciation.

Champs :

- `id`
- `project_id`
- `parent_id`
- `source_template_node_id`
- `node_type`
- `name`
- `description`
- `status`
- `position`
- `estimated_seconds`
- `is_required`
- `completed_at`
- timestamps

Le temps réel est calculé depuis `time_sessions`.

### `project_prerequisites`

Champs : `id`, `project_id`, `label`, `status`, `due_date`, `notes`, `position`.

### `project_services`

Relie le projet aux prestations réellement vendues, sans dépendre ensuite du catalogue courant.

Champs : `id`, `project_id`, `quote_line_id`, `snapshot_json`, `position`.

## 9. Temps et timer

### `time_sessions`

Source unique de vérité du temps travaillé.

Champs :

- `id`
- `client_account_id`
- `project_id`
- `project_node_id`
- `intervention_id`
- `category`
- `started_at`
- `ended_at` nullable
- `duration_seconds`
- `is_billable`
- `source` (`timer`, `manual`, `import`)
- `note`
- timestamps

Une session avec `ended_at = NULL` est la session active.

Une contrainte/index partiel doit garantir **une seule session active dans toute l’application**.

### `time_session_pauses`

Permet de persister Pause/Reprise.

Champs : `id`, `time_session_id`, `paused_at`, `resumed_at`, `duration_seconds`.

## 10. Demandes et interventions

### `service_requests`

Champs : `id`, `client_account_id`, `project_id`, `channel`, `origin`, `subject`, `description`, `priority`, `status`, `received_at`, `closed_at`, `archived_at`.

### `interventions`

Champs :

- `id`
- `request_id`
- `client_account_id`
- `project_id`
- `project_node_id`
- `intervention_type`
- `status`
- `billing_mode`
- `theoretical_value_cents`
- `billable_amount_cents`
- `started_at`
- `resolved_at`
- `summary`
- `internal_notes`
- `archived_at`

Les temps liés restent dans `time_sessions`.

## 11. Maintenance

### `maintenance_plans`

Modèles de forfaits configurables.

Champs : `id`, `name`, `price_cents`, `period_unit`, `included_interventions`, `rollover_enabled`, `status`.

### `maintenance_subscriptions`

Contrat/service actif d’un client.

Champs : `id`, `client_account_id`, `project_id`, `maintenance_plan_id`, `start_date`, `end_date`, `status`, `price_override_cents`, `notes`.

### `maintenance_periods`

Périodes mensuelles ou autres, sans créer de nouveau projet.

Champs : `id`, `subscription_id`, `period_start`, `period_end`, `included_quota`, `status`, `closed_at`.

### `maintenance_checklist_templates`

Identité d’une checklist standard.

### `maintenance_checklist_template_items`

Items d’un modèle de checklist.

### `maintenance_checks`

Checklist réelle d’une période.

Champs : `id`, `maintenance_period_id`, `source_template_item_id`, `label`, `status`, `completed_at`, `notes`, `position`.

## 12. Packs d’heures

### `hour_packs`

Champs : `id`, `client_account_id`, `project_id`, `name`, `purchased_seconds`, `price_cents`, `purchased_at`, `expires_at`, `status`.

### `hour_pack_movements`

Journal des crédits/débits.

Champs : `id`, `hour_pack_id`, `intervention_id`, `time_session_id`, `movement_type`, `seconds`, `note`, `created_at`.

Le solde est calculé depuis les mouvements.

## 13. Fichiers et ressources

### `file_assets`

Fichier maître unique.

Champs :

- `id`
- `client_account_id`
- `project_id`
- `storage_root_id`
- `location_type` (`workspace`, `external`, `server`, `url`)
- `category`
- `filename`
- `relative_path`
- `external_path_or_url`
- `mime_type`
- `size_bytes`
- `checksum_sha256`
- `status` (`received`, `to_process`, `in_progress`, `validated`, `obsolete`)
- `archived_at`
- timestamps

Un fichier n’est pas recopié pour être visible ailleurs : les autres tables le référencent par ID.

## 14. Documents et contrats

### `document_templates`

Champs : `id`, `name`, `document_type`, `status`, `archived_at`.

### `document_template_versions`

Champs : `id`, `document_template_id`, `version_number`, `content_json`, `variables_json`, `created_at`.

### `documents`

Document lié au client et éventuellement au projet.

Champs :

- `id`
- `client_account_id`
- `project_id`
- `document_type`
- `title`
- `document_number`
- `status`
- `source_template_version_id`
- `master_asset_id`
- `signed_at`
- `finalized_at`
- `archived_at`
- timestamps

### `document_versions`

Champs : `id`, `document_id`, `version_number`, `content_json`, `asset_id`, `status`, `created_at`.

Une version finalisée est immuable.

### `clauses`

Identité stable d’une clause.

### `clause_versions`

Version du texte d’une clause.

## 15. Bibliothèques techniques

### `technical_items`

Une seule table pour la Bibliothèque projet et la Bibliothèque AtoumWeb, différenciée par `scope`.

Champs :

- `id`
- `scope` (`project`, `atoumweb`)
- `project_id` nullable
- `origin_technical_item_id` nullable
- `name`
- `category`
- `language`
- `description`
- `reuse_status` (`ready`, `adapt`, `reference`)
- `archived_at`
- timestamps

Règle : `project_id` obligatoire si `scope = project`, interdit si `scope = atoumweb`.

### `technical_item_versions`

Champs : `id`, `technical_item_id`, `version_number`, `code_text`, `notes`, `is_stable`, `created_at`.

### `technical_item_assets`

Relie une version technique à ses fichiers/captures/exports JSON.

Champs : `id`, `technical_item_version_id`, `file_asset_id`, `role`, `position`.

La création d’un item AtoumWeb depuis un item projet est volontaire et produit une nouvelle entité indépendante.

## 16. Sauvegardes métier

### `backup_records`

Décrit le point de sauvegarde.

Champs : `id`, `client_account_id`, `project_id`, `backup_type`, `reason`, `is_functional_version`, `notes`, `created_at`.

### `backup_locations`

Une sauvegarde peut avoir plusieurs copies réelles.

Champs :

- `id`
- `backup_record_id`
- `location_type` (`server`, `local`, `external`, `other`)
- `storage_root_id`
- `path_or_url`
- `size_bytes`
- `checksum_sha256`
- `verified_at`

Règle : une sauvegarde serveur ne vaut pas sauvegarde locale tant qu’aucune ligne `local` n’existe réellement.

## 17. Facturation / Abby

### `billing_items`

Éléments à facturer ou à suivre.

Champs : `id`, `client_account_id`, `project_id`, `intervention_id`, `quote_id`, `billing_type`, `description`, `expected_amount_cents`, `due_date`, `status`, `created_at`.

### `invoices`

Référence une facture créée dans Abby.

Champs : `id`, `client_account_id`, `project_id`, `abby_number`, `invoice_date`, `amount_cents`, `due_date`, `status`, `external_reference`, `notes`, `created_at`.

### `invoice_billing_items`

Joint les éléments prévus aux factures Abby réelles.

### `payments`

Permet paiements complets ou partiels.

Champs : `id`, `invoice_id`, `amount_cents`, `paid_at`, `method`, `note`.

## 18. Dépenses

### `expenses`

Champs :

- `id`
- `supplier_organization_id`
- `client_account_id`
- `project_id`
- `category`
- `expense_type` (`internal`, `client`, `shared`, `refacturable`)
- `description`
- `amount_ht_cents`
- `amount_ttc_cents`
- `vat_cents`
- `expense_date`
- `payment_method`
- `paid_from`
- `receipt_asset_id`
- `recurring_expense_id`
- `archived_at`

### `recurring_expenses`

Abonnements/charges récurrentes.

Champs : `id`, `supplier_organization_id`, `name`, montants, `frequency`, `next_due_date`, `auto_renew`, `cancellation_deadline`, `status`, moyens de paiement, liens client/projet éventuels.

### `installment_plans`

Financement/achat en plusieurs fois.

Champs : `id`, `expense_id`, `total_financed_cents`, `installment_count`, `installment_amount_cents`, `fees_cents`, `rate_basis_points`, `start_date`, `end_date`, `status`.

### `installment_payments`

Échéancier réel.

## 19. Rappels et notifications

### `reminders`

Champs : `id`, `entity_type`, `entity_id`, `reminder_type`, `due_at`, `message`, `status`, `created_at`.

Les alertes de dashboard peuvent être calculées à partir de cette table et des échéances métier.

## 20. Journal d’activité

### `activity_events`

Append-only.

Champs :

- `id`
- `event_type`
- `title`
- `client_account_id`
- `project_id`
- `prospect_id`
- `quote_id`
- `intervention_id`
- `document_id`
- `payload_json`
- `created_at`

## 21. Recherche globale

### `search_documents`

Index dérivé, non source de vérité.

Champs :

- `entity_type`
- `entity_id`
- `title`
- `subtitle`
- `search_text`
- `client_account_id`
- `project_id`
- `updated_at`

Contrainte unique : `(entity_type, entity_id)`.

Il est reconstruit depuis les tables métier si nécessaire.

## 22. Statistiques

Pas de tables de statistiques métier obligatoires en V1.

Les indicateurs sont calculés à partir de :

- devis ;
- projets ;
- sessions de temps ;
- interventions ;
- factures/paiements ;
- dépenses ;
- prospects ;
- clients.

Des vues SQL ou caches pourront être ajoutés plus tard uniquement pour la performance.

## 23. Relations essentielles

```text
organization ──< contacts
      │
      ├──< prospects >── client_account
      └──< client_account ──< projects
                               ├──< project_nodes
                               ├──< file_assets
                               ├──< technical_items(scope=project)
                               ├──< interventions
                               └──< time_sessions

catalog_item ──< catalog_versions ──< quote_lines(snapshot)
quote ──> project
project_template ──< template_versions ──< template_nodes

document_template ──< template_versions
client_account ──< documents ──< document_versions

maintenance_subscription ──< maintenance_periods ──< maintenance_checks
hour_pack ──< hour_pack_movements

backup_record ──< backup_locations
invoice ──< payments
```

## 24. Contraintes métier à imposer en base quand possible

- une seule session de temps active globalement ;
- numéros de devis/projet uniques ;
- montants non négatifs sauf mouvement explicitement signé ;
- `technical_items.scope = project` exige `project_id` ;
- une version de catalogue a un numéro unique par item ;
- une version de template projet a un numéro unique par template ;
- une version de document a un numéro unique par document ;
- foreign keys activées ;
- suppression en cascade réservée aux sous-objets purement internes d’une entité non historique ;
- les données commerciales historiques utilisent archivage/restriction, pas cascade destructive.

## 25. Première migration recommandée

La première migration ne doit pas forcément créer toutes les tables fonctionnelles d’un coup.

Ordre recommandé :

1. système/settings/storage ;
2. organisations/contacts/clients/prospects ;
3. catalogue/devis ;
4. modèles projets/projets/nodes ;
5. temps ;
6. fichiers/documents ;
7. interventions/maintenance/packs ;
8. facturation/dépenses ;
9. bibliothèques/sauvegardes ;
10. activité/recherche.

Le schéma pourra ainsi être testé domaine par domaine tout en gardant ce modèle cible comme référence.

# AtoumWeb Manager — Modèle des workflows

> **Référence analysée** : branche documentaire créée depuis `fix/recette-commerciale-prospects` au commit `be9d086bd4b284269eabeb7b0199b275cbda59a7`.
>
> Ce document décrit le **code réellement présent** à ce point de référence. Codex effectue en parallèle une validation locale de la branche fonctionnelle ; si un nouveau commit est poussé, un contrôle de delta est requis avant de déclarer cette documentation définitive.

## Principes de source de vérité

- **Identité société** : `organizations`.
- **Personnes** : `contacts`.
- **Coordonnées multiples** : `contact_methods`. Les colonnes historiques `organizations.email/phone` et `contacts.email/phone` restent des valeurs de compatibilité/repli.
- **Besoins structurés** : `crm_needs`. `prospects.primary_need` reste un champ historique/de repli ; l’affichage Prospect calcule le besoin courant depuis `crm_needs`.
- **Actions / relances** : `crm_actions`. `prospects.next_action_*` et `client_accounts.next_action_*` sont des caches de compatibilité synchronisés par `ActionService`.
- **Devis contractuel** : `quotes` + `quote_lines`; les lignes issues du catalogue conservent un `snapshot_json`.
- **Production** : `projects`, `project_nodes`, `project_services`, `project_prerequisites`.
- **Temps** : `time_sessions` + `time_session_pauses` ; durée et synthèses sont calculées.
- **Maintenance / packs d’heures** : tables dédiées ; leurs soldes/consommations sont calculés à partir des mouvements/sessions.
- **Historique CRM** : `activity_events`. Les modules opérations/projets/temps utilisent aussi `activity_log` : il existe donc deux journaux techniques à distinguer.

## Diagramme entité-relation métier

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ CONTACTS : emploie
  ORGANIZATIONS ||--o{ CONTACT_METHODS : coordonnees
  CONTACTS ||--o{ CONTACT_METHODS : coordonnees
  ORGANIZATIONS ||--o{ PROSPECTS : identifie
  CONTACTS ||--o{ PROSPECTS : interlocuteur
  ORGANIZATIONS ||--o{ CLIENT_ACCOUNTS : identifie
  CONTACTS ||--o{ CLIENT_ACCOUNTS : contact_principal
  CLIENT_ACCOUNTS ||--o{ CLIENT_CONTACT_ROLES : roles
  CONTACTS ||--o{ CLIENT_CONTACT_ROLES : personne

  PROSPECTS ||--o{ CRM_NEEDS : besoins
  CLIENT_ACCOUNTS ||--o{ CRM_NEEDS : besoins_transmis
  CATALOG_ITEMS ||--o{ CRM_NEEDS : prestation

  PROSPECTS ||--o{ CRM_ACTIONS : actions
  CLIENT_ACCOUNTS ||--o{ CRM_ACTIONS : actions
  PROSPECTS ||--o{ QUOTES : devis
  CLIENT_ACCOUNTS ||--o{ QUOTES : devis
  QUOTES ||--|{ QUOTE_LINES : lignes
  CATALOG_ITEMS ||--o{ QUOTE_LINES : origine
  CATALOG_VERSIONS ||--o{ QUOTE_LINES : version_snapshot

  CLIENT_ACCOUNTS ||--o{ CLIENT_DOCUMENTS : documents
  CLIENT_ACCOUNTS ||--o{ PROJECTS : projets
  QUOTES ||--o| PROJECTS : source
  PROJECT_TEMPLATES ||--o{ PROJECT_TEMPLATE_VERSIONS : versions
  PROJECT_TEMPLATE_VERSIONS ||--o{ PROJECT_TEMPLATE_NODES : modele
  PROJECT_TEMPLATE_VERSIONS ||--o{ PROJECTS : instancie
  PROJECTS ||--o{ PROJECT_NODES : structure
  PROJECTS ||--o{ PROJECT_SERVICES : prestations_snapshot
  PROJECTS ||--o{ PROJECT_PREREQUISITES : prerequis
  PROJECTS ||--o{ FILE_ASSETS : ressources
  FILE_ASSETS ||--o{ FILE_ASSET_LINKS : lie
  PROJECT_NODES ||--o{ FILE_ASSET_LINKS : cible

  CLIENT_ACCOUNTS ||--o{ SERVICE_REQUESTS : demandes
  PROJECTS ||--o{ SERVICE_REQUESTS : contexte
  SERVICE_REQUESTS ||--o| INTERVENTIONS : transforme
  CLIENT_ACCOUNTS ||--o{ INTERVENTIONS : interventions
  PROJECTS ||--o{ INTERVENTIONS : contexte
  PROJECT_NODES ||--o{ INTERVENTIONS : rattachement

  PROJECTS ||--o{ TIME_SESSIONS : temps
  PROJECT_NODES ||--o{ TIME_SESSIONS : temps
  INTERVENTIONS ||--o{ TIME_SESSIONS : temps
  TIME_SESSIONS ||--o{ TIME_SESSION_PAUSES : pauses

  CLIENT_ACCOUNTS ||--o{ MAINTENANCE_SUBSCRIPTIONS : souscriptions
  PROJECTS ||--o{ MAINTENANCE_SUBSCRIPTIONS : site
  MAINTENANCE_PLANS ||--o{ MAINTENANCE_SUBSCRIPTIONS : plan
  MAINTENANCE_SUBSCRIPTIONS ||--o{ MAINTENANCE_PERIODS : periodes
  MAINTENANCE_PERIODS ||--o{ MAINTENANCE_CHECKS : checklist
  MAINTENANCE_PERIODS ||--o{ INTERVENTIONS : couvre

  CLIENT_ACCOUNTS ||--o{ HOUR_PACKS : packs
  PROJECTS ||--o{ HOUR_PACKS : contexte
  HOUR_PACKS ||--o{ HOUR_PACK_MOVEMENTS : mouvements
  HOUR_PACKS ||--o{ INTERVENTIONS : couvre
```

## 1. Prospect

États : `new`, `qualifying`, `need_identified`, `quote_to_prepare`, `quote_to_send`, `quote_sent`, `follow_up`, `negotiation`, `waiting`, `won`, `lost`.

Le service vérifie qu’un besoin persistant existe pour toute destination autre que `new`, `qualifying` ou `lost`, mais **n’impose pas de matrice d’adjacence** : tout état valide peut techniquement être demandé par `changeProspectStage`. Le passage `lost` exige une raison.

```mermaid
stateDiagram-v2
  [*] --> new
  new --> qualifying: Commencer la prospection
  qualifying --> need_identified: qualification enregistrée + critères UI + besoin requis service
  need_identified --> quote_to_prepare: création devis
  quote_to_prepare --> quote_to_send: finalisation devis
  quote_to_send --> quote_sent: envoi devis
  quote_sent --> follow_up: relance créée
  quote_sent --> negotiation: négociation
  quote_sent --> waiting: mise en attente
  follow_up --> negotiation
  follow_up --> waiting
  negotiation --> quote_to_prepare: duplication devis
  waiting --> follow_up
  quote_sent --> won: acceptation / conversion
  follow_up --> won
  negotiation --> won
  waiting --> won
  new --> lost
  qualifying --> lost
  need_identified --> lost
  quote_to_prepare --> lost
  quote_to_send --> lost
  quote_sent --> lost
  follow_up --> lost
  negotiation --> lost
  waiting --> lost
  won --> [*]
  lost --> [*]
```

**Important** : les flèches ci-dessus sont le parcours métier recommandé. Le service actuel permet davantage de sauts manuels que ce diagramme.

## 2. Devis

États SQLite : `draft`, `sent`, `viewed`, `accepted`, `refused`, `expired`, `cancelled`.

`finalized_at` est **orthogonal** au statut : un devis finalisé reste `draft`, ce qui matérialise correctement la distinction « prêt à envoyer » / « envoyé ».

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> draft: finaliser / finalized_at renseigné
  draft --> sent: markSent
  sent --> viewed: markViewed
  viewed --> viewed: markViewed répété actuellement possible
  sent --> accepted: accept
  viewed --> accepted: accept
  sent --> refused: refuse
  viewed --> refused: refuse
  sent --> expired: expire
  viewed --> expired: expire
  sent --> draft: duplicate = nouveau devis
  viewed --> draft: duplicate = nouveau devis
  refused --> draft: duplicate = nouveau devis
  expired --> draft: duplicate = nouveau devis
  cancelled --> draft: duplicate = nouveau devis
  accepted --> [*]
```

- Les lignes d’un devis non `draft` sont protégées par le service d’édition.
- `accept()` est idempotent si le devis est déjà accepté.
- `finalize()` n’est pas strictement idempotent : un deuxième appel réécrit `finalized_at` et recrée un événement.

## 3. Client

États : `active`, `inactive`, `archived`.

```mermaid
stateDiagram-v2
  [*] --> active
  active --> inactive
  inactive --> active
  active --> archived
  inactive --> archived
  archived --> active: reactivate
  archived --> inactive: reactivate
```

L’archivage est logique : il ne supprime ni le client ni les documents physiques. La réactivation conserve le même identifiant et le même dossier.

## 4. Projet

États : `to_prepare`, `in_progress`, `waiting_client`, `blocked`, `to_validate`, `completed`, `archived`.

```mermaid
stateDiagram-v2
  [*] --> to_prepare
  to_prepare --> in_progress
  in_progress --> waiting_client
  waiting_client --> in_progress
  in_progress --> blocked
  blocked --> in_progress
  in_progress --> to_validate
  to_validate --> in_progress
  to_validate --> completed
  completed --> archived
```

**Écart actuel** : `changeProjectStatus()` accepte n’importe quel statut valide depuis n’importe quel autre statut. Les flèches ci-dessus sont la machine métier recommandée, pas une contrainte actuellement imposée par le service.

## 5. Demande

États : `new`, `to_qualify`, `waiting_client`, `planned`, `converted`, `closed`, `archived`.

```mermaid
stateDiagram-v2
  [*] --> new
  new --> to_qualify
  to_qualify --> waiting_client
  waiting_client --> to_qualify
  to_qualify --> planned
  planned --> converted: transformer en intervention
  new --> closed: fermer sans intervention
  to_qualify --> closed
  waiting_client --> closed
  closed --> archived
  converted --> converted: état protégé
```

Une demande `converted` ne peut plus être repassée à un autre statut par le service. La transformation est idempotente grâce à l’unicité de `interventions.source_request_id` et à une recherche préalable.

## 6. Intervention

États : `to_plan`, `planned`, `in_progress`, `waiting_client`, `blocked`, `to_validate`, `completed`, `cancelled`, `archived`.

```mermaid
stateDiagram-v2
  [*] --> to_plan
  to_plan --> planned
  planned --> in_progress
  in_progress --> waiting_client
  waiting_client --> in_progress
  in_progress --> blocked
  blocked --> in_progress
  in_progress --> to_validate
  to_validate --> completed
  to_plan --> cancelled
  planned --> cancelled
  completed --> archived
  cancelled --> archived
```

**Écart actuel** : comme pour Projet, `changeInterventionStatus()` valide la valeur mais pas le chemin. Passer hors `completed` efface `completed_at`; repasser hors `archived` efface `archived_at`.

## 7. Maintenance

### Souscription

États : `active`, `suspended`, `ended`, `archived`.

```mermaid
stateDiagram-v2
  [*] --> active
  active --> suspended
  suspended --> active
  active --> ended
  suspended --> ended
  ended --> archived
  active --> archived
```

Le service ne contraint pas actuellement l’adjacence ; toute valeur valide peut être appliquée.

### Période

États : `upcoming`, `open`, `to_do`, `in_progress`, `completed`, `closed`.

```mermaid
stateDiagram-v2
  [*] --> upcoming
  upcoming --> to_do
  to_do --> in_progress
  in_progress --> completed
  completed --> closed
  to_do --> open
  open --> in_progress
```

`ensurePeriod()` est idempotent sur `(subscription_id, period_start, period_end)`.

## 8. Pack d’heures

États : `active`, `exhausted`, `expired`, `suspended`, `archived`.

```mermaid
stateDiagram-v2
  [*] --> active
  active --> suspended: action utilisateur
  suspended --> active: action utilisateur
  active --> archived: action utilisateur
  active --> exhausted: solde <= 0 calculé
  active --> expired: date dépassée calculée
  exhausted --> active: crédit / correction
  expired --> active: selon réactivation + date cohérente
```

`exhausted` et `expired` sont calculés et ne peuvent pas être choisis manuellement. Le débit d’une intervention est idempotent via `source_key`; l’annulation d’un mouvement est idempotente via `reversal_of_movement_id`.

## 9. Timer / session de temps

Le Timer n’a pas une colonne de statut : son état découle de `ended_at` et de l’existence d’une pause ouverte.

```mermaid
stateDiagram-v2
  [*] --> stopped
  stopped --> running: start
  running --> paused: pause
  paused --> running: resume
  running --> stopped: stop
  paused --> stopped: stop
  running --> recovering: heartbeat devenu stale
  recovering --> running: recoverResume
  recovering --> stopped: stopAtLastKnown
```

Invariants techniques : une seule `time_session` active globalement via index partiel ; une seule pause ouverte par session ; `pause`, `resume` et `stop` ont des comportements idempotents partiels.

# Parcours commercial transversal

```mermaid
flowchart LR
  A[Nouveau contact] --> B[À qualifier]
  B --> C[Besoin identifié]
  C --> D[Devis en préparation]
  D --> E[Devis à envoyer]
  E --> F[Devis envoyé]
  F --> G{Suivi}
  G --> H[À relancer]
  G --> I[Négociation]
  G --> J[En attente]
  I --> D
  H --> G
  J --> G
  G --> K[Devis accepté]
  K --> L[Client]
  L --> M[Projet à préparer]
```

## Séquence 1 — création du devis depuis Prospect

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant UI as ProspectsPageV2
  participant IPC as preload/IPC
  participant W as WorkflowService
  participant Q as QuoteService
  participant DB as SQLite
  U->>UI: Créer le devis depuis les besoins
  UI->>W: needs(prospect,id)
  W->>DB: SELECT crm_needs + catalog_items
  UI->>IPC: quotes.createWithLines(...)
  IPC->>Q: createWithLines
  Q->>DB: BEGIN IMMEDIATE
  Q->>DB: INSERT quotes status=draft
  Q->>DB: UPDATE prospects stage=quote_to_prepare
  loop chaque besoin
    Q->>DB: INSERT quote_lines + snapshot_json
  end
  Q->>DB: COMMIT
  Q-->>UI: QuoteDetail
```

## Séquence 2 — finalisation puis envoi

```mermaid
sequenceDiagram
  actor U as Utilisateur
  participant P as ProspectQuotePanel
  participant Q as QuoteService
  participant A as ActionService
  participant DB as SQLite
  U->>P: Devis prêt à envoyer
  P->>Q: finalize(quoteId)
  Q->>DB: finalized_at=now
  Q->>DB: prospect.stage=quote_to_send
  U->>P: Confirmer l'envoi + canal + destinataire
  P->>Q: markSent(quoteId)
  Q->>DB: quote.status=sent, sent_at=now
  Q->>DB: prospect.stage=quote_sent
  P->>A: create action "Devis envoyé"
  P->>A: complete(channel,outcome,notes)
  A->>DB: trace contexte d'envoi dans crm_actions
```

## Séquence 3 — relance

```mermaid
sequenceDiagram
  actor U
  participant UI as ProspectQuotePanel / ProspectsPageV2
  participant A as ActionService
  participant DB as SQLite
  U->>UI: Programmer une relance
  UI->>A: create(type=follow_up,dueAt,related=quote)
  A->>DB: INSERT crm_actions
  A->>DB: prospect.stage=follow_up
  A->>DB: synchronise next_action_*
  U->>UI: Terminer la relance
  UI->>A: complete(channel,outcome,notes)
  A->>DB: status=done + completion_*
  A->>DB: éventuelle prochaine occurrence
  A->>DB: resynchronise next_action_*
```

## Séquence 4 — négociation / duplication

```mermaid
sequenceDiagram
  actor U
  participant UI as ProspectQuotePanel
  participant CRM as CrmService
  participant Q as QuoteService
  participant DB as SQLite
  U->>UI: Négociation
  UI->>CRM: changeStage(negotiation)
  U->>UI: Refaire / dupliquer
  UI->>Q: duplicate(oldQuote)
  Q->>DB: INSERT nouveau devis draft
  Q->>DB: copie lignes + snapshots
  Q->>DB: prospect.stage=quote_to_prepare
```

## Séquence 5 — acceptation

```mermaid
sequenceDiagram
  actor U
  participant UI as ProspectQuotePanel
  participant Q as QuoteService
  participant CRM as CrmService
  participant DB as SQLite
  U->>UI: Devis accepté
  UI->>Q: accept(quoteId)
  alt pas encore de client
    Q->>CRM: convertProspectToClient(prospectId)
    CRM->>DB: crée ou réutilise client
    CRM->>DB: prospect stage=won + client_account_id
  end
  Q->>DB: quote status=accepted
  Q->>DB: accepted_at + snapshot_locked_at + project_ready_at
```

## Séquence 6 — conversion idempotente Prospect → Client

```mermaid
sequenceDiagram
  participant C as CrmService
  participant DB as SQLite
  C->>DB: lire prospect
  alt client_account_id déjà renseigné
    C-->>C: retourne même client, createdClient=false
  else organisation déjà cliente
    C->>DB: SELECT client par organization_id
    C->>DB: lier prospect au client existant
  else contact individuel déjà client
    C->>DB: SELECT client par primary_contact_id
    C->>DB: lier prospect au client existant
  else aucun client
    C->>DB: INSERT client_accounts
    C->>DB: créer rôle contact principal
  end
  C->>DB: prospect won + won_at COALESCE
```

## Séquence 7 — création Projet depuis devis accepté

```mermaid
sequenceDiagram
  actor U
  participant UI as Projets
  participant P as ProjectService
  participant FS as Workspace fichiers
  participant DB as SQLite
  U->>P: transformQuote(quoteId,templateVersion)
  P->>DB: recherche projet existant par source_quote_id
  alt existe
    P-->>U: retourne projet existant
  else nouveau
    P->>DB: vérifie devis accepted + client + modèle published
    P->>FS: crée arborescence Ressources
    P->>DB: BEGIN
    P->>DB: INSERT project status=to_prepare
    P->>DB: copie template nodes
    P->>DB: copie quote_lines vers project_services
    P->>DB: initialise prerequisites
    P->>DB: quote.project_id=project.id
    P->>DB: COMMIT
    note over P,FS: rollback => suppression du dossier nouvellement créé
  end
```

## Séquence 8 — archivage Client et documents

```mermaid
sequenceDiagram
  actor U
  participant C as CrmService
  participant D as ClientDocumentService
  participant DB as SQLite
  participant FS as Workspace
  U->>C: archiveClient(clientId)
  C->>DB: status=archived + archived_at
  note over DB,FS: aucun DELETE client_documents
  note over DB,FS: aucun unlink des fichiers physiques
  U->>D: list(clientId, includeArchived=true)
  D->>DB: SELECT client_documents
  D-->>U: documents toujours accessibles
```

# Recommandations de cohérence

1. **Formaliser les matrices de transitions dans les services**, pas seulement dans l’UI, pour Prospect, Projet, Intervention, Maintenance et souscriptions.
2. **Rendre `finalize()` idempotent** ou refuser proprement une deuxième finalisation sans réécrire la date.
3. **Inclure le besoin dans le calcul UI de qualification** : aujourd’hui l’UI affiche 4/4 sans vérifier `crm_needs`, alors que le service refuse `need_identified` sans besoin.
4. **Conserver `contact_methods` comme source de vérité des coordonnées** et traiter les colonnes email/téléphone historiques uniquement comme compatibilité ; les vues Client doivent progressivement lire la nouvelle source.
5. **Garder la distinction finale : Prospect = cockpit commercial, Devis = édition détaillée, Client = relation durable, Projet = production.**
6. **Ne pas automatiser une suppression RGPD** : l’échéance doit déclencher une revue, jamais un effacement silencieux.
7. **Unifier ou documenter explicitement les deux journaux** (`activity_events` CRM vs `activity_log` opérations/projets) pour éviter une timeline incomplète selon l’écran.

# AtoumWeb Manager — Revue critique de cohérence

> Référence : `fix/recette-commerciale-prospects` @ `be9d086bd4b284269eabeb7b0199b275cbda59a7`.
>
> **Aucune anomalie ci-dessous n’est corrigée par ce document.** Elles sont regroupées pour validation métier avant modification fonctionnelle.

## Synthèse

Le socle est globalement cohérent : identité séparée, besoins structurés, devis snapshotés, conversion Client idempotente, Projet idempotent, fichiers physiques hors SQLite, timer robuste et packs d’heures par mouvements. Les risques principaux sont moins des pertes de données que des **machines à états trop permissives côté services** et quelques divergences entre la nouvelle UI Prospect et les invariants backend.

### Classement global

- Cohérent et correctement protégé : conversion Prospect→Client, projet créé une seule fois depuis devis, snapshots devis/projet, timer unique, mouvements pack d’heures, fichiers hors SQLite.
- Cohérent mais insuffisamment testé : documents Client, traçabilité d’envoi, qualification V2, recherche sur coordonnées multiples dans tous les écrans.
- Ambigu / à décider : transitions autorisées Projet/Intervention/Maintenance ; portée exacte de la « pause » devis.
- Incohérences confirmées : calcul qualification sans besoin ; transitions service trop larges ; coordonnées Client encore partiellement legacy ; catégories du Dossier client non conformes au modèle métier validé.

## Anomalies et recommandations

### LOGIC-001 — Qualification UI « complète » sans vérifier le besoin

- **Gravité** : Majeur
- **État** : Confirmé par le code
- **Couche** : React / Service
- **Scénario** : Prospect `qualifying`, résumé + décideur + budget + calendrier renseignés, aucun `crm_need`.
- **Actuel** : l’UI affiche `4/4`, annonce que l’enregistrement passera en Besoin identifié, puis appelle `changeStage('need_identified')`. Le service refuse car aucun besoin persistant n’existe.
- **Attendu** : l’état « prêt » doit inclure un besoin ou expliquer clairement qu’il manque encore la prestation.
- **Fichiers** : `ProspectQualificationPanelV2.tsx`, `CrmService.ts`, `WorkflowService.ts`.
- **Correction recommandée** : calculer une readiness métier commune incluant au moins un `crm_need`; idéalement exposer une fonction/service de readiness pour éviter une règle duplicative UI/backend.
- **Test** : intégration Prospect sans besoin puis avec besoin.

### LOGIC-002 — Pipeline Prospect non protégé par une matrice de transitions

- **Gravité** : Majeur
- **État** : Confirmé par le code
- **Couche** : Service / IPC
- **Scénario** : appel direct `changeStage(new → quote_sent)` avec au moins un besoin.
- **Actuel** : toute destination valide est acceptée (hors contraintes besoin/perdu), même si le parcours métier est sauté.
- **Attendu** : transitions contrôlées ou action administrative explicite de correction.
- **Fichiers** : `CrmService.ts`, `ProspectsPageV2.tsx`.
- **Correction** : table de transitions autorisées côté service + option de régression explicite lorsque nécessaire.
- **Test** : matrice de transitions acceptées/refusées.

### LOGIC-003 — Relance rapide disponible trop tôt et change automatiquement l’étape

- **Gravité** : Majeur
- **État** : Confirmé par le code
- **Couche** : UX / ActionService
- **Scénario** : sur un `Nouveau contact`, clic `Relance demain`.
- **Actuel** : une action `follow_up` déplace automatiquement le Prospect en `follow_up`, court-circuitant qualification/besoin/devis.
- **Attendu** : soit une action de contact initial qui ne modifie pas le pipeline, soit la relance commerciale n’est disponible qu’après un stade approprié.
- **Fichiers** : `ProspectsPageV2.tsx`, `ActionService.ts`.
- **Correction** : dissocier « rappel/action » de « relance devis », ou conditionner le changement d’étape au contexte commercial.
- **Test** : relance sur new/qualifying/quote_sent.

### LOGIC-004 — `finalize()` Devis non idempotent

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Service
- **Scénario** : double clic ou appel répété sur `Devis prêt à envoyer`.
- **Actuel** : le devis reste `draft`, donc un second `finalize()` est accepté ; `finalized_at` est réécrit et un nouvel événement est généré.
- **Attendu** : deuxième appel sans effet ou erreur explicite « déjà finalisé ».
- **Fichiers** : `QuoteService.ts`, `ProspectQuotePanel.tsx`.
- **Correction** : si `finalized_at` existe, retourner le devis sans réécriture ou interdire.
- **Test** : double finalisation.

### LOGIC-005 — Projet : toute transition de statut valide est permise

- **Gravité** : Majeur
- **État** : Confirmé par le code
- **Couche** : Service
- **Scénario** : `to_prepare → completed` ou `archived → in_progress` directement.
- **Actuel** : `changeProjectStatus()` ne vérifie que l’appartenance à l’enum.
- **Attendu** : machine métier validée ; completion devrait passer par les préconditions/revue prévues.
- **Fichiers** : `ProjectService.ts`, `ProjectCompletionService.ts`.
- **Correction** : matrice de transitions + précondition de complétion.
- **Test** : sauts interdits et revue de fin.

### LOGIC-006 — Projet : quitter `completed` efface `completed_at`

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Service / traçabilité
- **Scénario** : Projet terminé puis remis `in_progress`.
- **Actuel** : `completed_at` devient `NULL`.
- **Attendu** : décider si réouverture est autorisée ; si oui, conserver la date historique via événement ou champ dédié au lieu de perdre la trace.
- **Fichiers** : `ProjectService.ts`.
- **Correction** : politique de réouverture + historique.
- **Test** : completed → réouvert.

### LOGIC-007 — Intervention : transitions libres et date de complétion effaçable

- **Gravité** : Majeur
- **État** : Confirmé par le code
- **Couche** : Service
- **Scénario** : completed → planned ou to_plan → completed.
- **Actuel** : toute valeur enum est acceptée ; quitter completed remet `completed_at` à NULL.
- **Attendu** : règles de transition et éventuelle réouverture explicite.
- **Fichiers** : `OperationsService.ts`, `InterventionCompletionService.ts`.
- **Correction** : matrice de transitions et commande dédiée `reopen` si utile.
- **Test** : statut + completion.

### LOGIC-008 — Maintenance : statuts souscription/période sans matrice métier

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Service
- **Scénario** : souscription `archived → active` ou période `closed → in_progress` par appel direct.
- **Actuel** : toute valeur valide est acceptée.
- **Attendu** : transitions terminales/protégées définies.
- **Fichiers** : `MaintenanceService.ts`.
- **Correction** : matrices séparées souscription/période.
- **Test** : transitions terminales.

### LOGIC-009 — Résumé Client encore alimenté par email/téléphone legacy

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Service / UI / données dupliquées
- **Scénario** : modifier/ajouter un email principal dans `contact_methods` sans modifier `contacts.email`.
- **Actuel** : `ClientSummary.email/phone` peut afficher l’ancienne valeur tandis que le panneau Coordonnées montre la nouvelle.
- **Attendu** : les écrans Client utilisent `contact_methods` comme source principale ; legacy uniquement fallback.
- **Fichiers** : `CrmService.ts`, `ClientsPage.tsx`, `ContactMethodsPanel.tsx`.
- **Correction** : projection SQL du moyen principal avec fallback legacy.
- **Test** : modification coordonnée principale puis liste Clients/recherche.

### LOGIC-010 — Deux journaux d’activité distincts

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Architecture / traçabilité
- **Scénario** : consulter le journal Client/Prospect puis une opération/projet.
- **Actuel** : CRM utilise largement `activity_events`, d’autres services `activity_log`. Il n’existe pas une timeline unique garantie.
- **Attendu** : une vue d’historique transverse ou règle explicite de répartition.
- **Fichiers** : migrations, `CrmService`, `WorkflowService`, `QuoteService`, `ProjectService`, `OperationsService`.
- **Correction** : ne pas migrer à l’aveugle ; définir un agrégateur de lecture commun ou une convention stable.
- **Test** : timeline multi-entités.

### LOGIC-011 — Catégories Dossier Client différentes du modèle métier validé

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : SQLite / Service / UX
- **Actuel** : contract, quote, invoice, brief, content, technical, legal, other.
- **Attendu** : Administratif & identité ; Identité visuelle ; Devis & contrats ; Facturation & paiements ; Échanges importants ; Documents fournis par le client ; RGPD/consentements/demandes ; Archives.
- **Fichiers** : migration19, `shared/clientDocuments.ts`, `ClientDocumentService.ts`, `ClientDocumentsPanel.tsx`.
- **Correction** : migration dédiée ultérieure après validation de mapping des catégories existantes.
- **Test** : migration catégorie + conservation chemin/fichier.

### LOGIC-012 — Changer la catégorie d’un document ne déplace pas le fichier physique

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Service / fichiers
- **Scénario** : document importé dans `01 Contrats`, puis catégorie modifiée en Facture.
- **Actuel** : seule la colonne `category` change ; `relative_path` reste dans le dossier initial.
- **Attendu** : soit catégorie = métadonnée indépendante assumée, soit déplacement physique transactionnel/cohérent.
- **Fichiers** : `ClientDocumentService.ts`.
- **Correction** : décider la règle avant refonte taxonomie ; recommandation : déplacer physiquement de façon sûre et mettre à jour `relative_path`, avec rollback en cas d’échec.
- **Test** : changement catégorie sur fichier réel.

### LOGIC-013 — Suppression document : fichier supprimé avant la métadonnée sans transaction de récupération

- **Gravité** : Moyen
- **État** : Confirmé par le code
- **Couche** : Service / risque de perte
- **Scénario** : `unlinkSync` réussit puis DELETE SQLite échoue.
- **Actuel** : le fichier est déjà détruit alors que la ligne pourrait subsister.
- **Attendu** : suppression robuste (corbeille/quarantaine puis DB, ou journal/rollback filesystem).
- **Fichiers** : `ClientDocumentService.ts`.
- **Correction** : déplacement vers zone temporaire, transaction DB, suppression finale après succès.
- **Test** : simulation d’échec DB après déplacement.

### LOGIC-014 — Traçabilité envoi Devis stockée comme action plutôt que comme données d’envoi dédiées

- **Gravité** : Mineur à Moyen
- **État** : Confirmé par le code
- **Couche** : Modèle / traçabilité
- **Actuel** : `sent_at` est sur le devis ; canal, destinataire et note sont dans une `crm_action` liée au devis.
- **Attendu** : acceptable si cette action devient la source officielle de la preuve d’envoi et reste facilement retrouvable ; sinon prévoir une entité `quote_dispatches` plus tard.
- **Fichiers** : `ProspectQuotePanel.tsx`, `ActionService.ts`, `QuoteService.ts`.
- **Correction** : pour V1, conserver le modèle actuel mais ajouter lecture structurée du dernier envoi dans la fiche et test de persistance.
- **Test** : envoi → redémarrage → canal/destinataire toujours affichables.

### LOGIC-015 — UI V2 utilise encore plusieurs `window.prompt`

- **Gravité** : Mineur UX
- **État** : Confirmé par le code
- **Couche** : React / UX
- **Scénario** : ajout action, clôture relance, perte Prospect, pause devis.
- **Actuel** : prompts système, peu lisibles et peu contrôlables.
- **Attendu** : éditeurs structurés, valeurs proposées et validations explicites.
- **Fichiers** : `ProspectsPageV2.tsx`, `ProspectQuotePanel.tsx`.
- **Correction** : après validation de la logique métier, remplacer par panneaux inline/modales applicatives.
- **Test** : recette visuelle.

### LOGIC-016 — `missing_information` encode du JSON dans un champ texte générique

- **Gravité** : Mineur
- **État** : Confirmé par le code
- **Couche** : Modèle / compatibilité
- **Actuel** : ancien texte libre accepté ; V2 encode `{selected,other}` JSON et sait retomber sur du texte legacy.
- **Attendu** : acceptable en V1, mais documenter le format si d’autres modules le lisent.
- **Correction** : soit type structuré futur, soit helper partagé de parsing/serialization.
- **Test** : ancien texte libre + nouveau JSON.

## Invariants correctement protégés

### INV-001 — Une conversion Prospect → Client répétée ne crée pas un nouveau Client

Protection : early return sur `client_account_id`, recherche client par organisation/contact, index uniques partiels. **Cohérent et important à préserver.**

### INV-002 — Un devis envoyé/accepté n’est plus éditable comme un draft

Protection : `QuoteService` vérifie le statut pour lignes/conditions ; la négociation passe par duplication. **Cohérent.**

### INV-003 — Le snapshot catalogue d’un devis/projet est conservé

Protection : `quote_lines.snapshot_json`, puis copie vers `project_services`. **Cohérent.**

### INV-004 — Un Projet n’est créé qu’une fois depuis un devis

Protection : `projects.source_quote_id` unique + lecture préalable + `quotes.project_id`. **Cohérent/idempotent.**

### INV-005 — Une seule session Timer active

Protection : vérification service + index unique partiel SQLite. **Fort.**

### INV-006 — Un débit de Pack pour une intervention n’est pas doublé

Protection : `source_key` unique + lookup préalable. Les annulations sont des mouvements inverses. **Fort.**

### INV-007 — Les fichiers métier ne sont pas stockés en BLOB SQLite

Documents client et ressources projet utilisent des chemins relatifs + fichiers workspace. **Cohérent.**

### INV-008 — Archiver un Client ne supprime pas ses documents

`archiveClient` ne touche pas `client_documents`; FK document est `ON DELETE RESTRICT`. **Cohérent.**

## Questions métier nécessitant une décision

1. Un Prospect doit-il pouvoir reculer librement dans le pipeline, ou seulement via une commande « Corriger l’étape » ?
2. La création d’une simple relance sur un Nouveau contact doit-elle changer le pipeline en `À relancer` ? Recommandation : **non**.
3. Une qualification est-elle « complète » avec Résumé + Décideur + Budget + Calendrier + au moins un besoin, même si l’existant reste inconnu ? Recommandation : **oui**, l’existant est informatif mais non bloquant.
4. Un Projet `completed` peut-il être rouvert ? Si oui, faut-il conserver la première date de complétion ? Recommandation : commande `Rouvrir` + historique, ne pas effacer silencieusement la trace.
5. Même question pour Intervention terminée et période Maintenance close.
6. Changer la catégorie d’un document doit-il physiquement déplacer le fichier ? Recommandation : **oui**, pour que le dossier Windows reste compréhensible.
7. À terme, veut-on un seul journal transverse visible ou simplement un agrégateur de `activity_events` + `activity_log` ? Recommandation : agrégateur d’abord, migration plus tard si nécessaire.
8. La preuve d’envoi d’un devis V1 peut-elle rester une action liée au devis ? Recommandation : **oui pour V1**, si l’UI sait la relire et si un test garantit la persistance.

# Recommandation de recette

**OUI AVEC RÉSERVES.**

Le parcours Prospect/Devis est suffisamment construit pour reprendre la recette Windows après succès des tests locaux de Codex, mais la recette doit explicitement vérifier LOGIC-001, LOGIC-003, LOGIC-004, LOGIC-009 et la traçabilité d’envoi. Le chantier Projet reste volontairement hors recette visuelle immédiate.

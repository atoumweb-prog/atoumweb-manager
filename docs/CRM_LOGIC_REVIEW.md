# AtoumWeb Manager — Revue critique consolidée de cohérence

> Branche : `fix/recette-commerciale-coherence`.
>
> Cette version reprend l’audit initial et indique ce qui a été corrigé dans la passe commerciale. Les sujets Projet / Intervention / Maintenance et la migration du Dossier Client restent volontairement séparés.

## Synthèse

Le socle commercial est maintenant nettement plus cohérent : la qualification partage la même exigence métier que le backend, le pipeline Prospect est protégé, le rappel précoce ne devient plus une fausse relance devis, la finalisation de devis est idempotente, l’envoi exige la finalisation, et les coordonnées multiples alimentent la liste/recherche Client en priorité.

Le risque principal restant sur ce périmètre n’est plus une incohérence de machine d’état mais la validation d’intégration Windows/React et la persistance réelle après redémarrage.

## Suivi des anomalies de l’audit initial

### LOGIC-001 — Qualification « complète » sans besoin

**Statut : CORRIGÉ.**

La readiness comporte désormais cinq critères, dont au moins un besoin persistant. Le service continue de refuser un passage avancé sans besoin, ce qui garde une seconde protection indépendante de l’UI.

### LOGIC-002 — Pipeline Prospect trop permissif

**Statut : CORRIGÉ SUR LE PÉRIMÈTRE COMMERCIAL.**

`CrmService` possède une matrice de transitions manuelles. Les opérations structurantes restent attachées à leurs actions dédiées : création du devis, finalisation, envoi, acceptation et duplication.

### LOGIC-003 — Relance rapide trop tôt

**Statut : CORRIGÉ.**

Avant le contexte devis, le raccourci crée une action/rappel sans déplacer le Prospect. Une `follow_up` ne force `follow_up` que depuis `quote_sent`, `follow_up`, `negotiation` ou `waiting`.

### LOGIC-004 — `finalize()` non idempotent

**Statut : CORRIGÉ.**

Un devis déjà finalisé est retourné sans nouvelle date ni nouvel événement. `markSent()` refuse en outre un devis non finalisé.

### LOGIC-005 — Projet : transitions libres

**Statut : DIFFÉRÉ À LA PASSE PROJET.**

Le parcours cible est documenté dans `CRM_TRANSITION_MATRIX.md`, mais il ne faut pas modifier cette machine pendant la recette commerciale.

### LOGIC-006 — Projet : perte de `completed_at` lors d’une réouverture

**Statut : DIFFÉRÉ À LA PASSE PROJET.**

Décision à prendre avec une commande de réouverture explicite et une trace historique.

### LOGIC-007 — Intervention : transitions libres / date de complétion effaçable

**Statut : DIFFÉRÉ À LA PASSE OPÉRATIONS.**

Même principe que Projet : matrice et éventuelle commande `reopen` devront être traitées ensemble.

### LOGIC-008 — Maintenance : transitions non protégées

**Statut : DIFFÉRÉ À LA PASSE OPÉRATIONS/MAINTENANCE.**

Pas de modification dans la branche commerciale.

### LOGIC-009 — ClientSummary alimenté par legacy email/téléphone

**Statut : CORRIGÉ CÔTÉ SERVICE/RECHERCHE.**

La projection Client choisit en priorité une coordonnée active de `contact_methods` puis retombe sur les colonnes historiques. L’index de recherche inclut aussi les coordonnées multiples.

La recette Windows doit encore confirmer que liste et fiche affichent immédiatement la nouvelle coordonnée après modification.

### LOGIC-010 — Deux journaux d’activité

**Statut : CONNU / NON BLOQUANT V1.**

`activity_events` reste le journal CRM ; `activity_log` continue d’exister pour d’autres modules. Aucun chantier de migration n’est lancé pendant cette passe.

### LOGIC-011 — Catégories Dossier Client non conformes au modèle métier

**Statut : CONFIRMÉ / DIFFÉRÉ AVEC MIGRATION DÉDIÉE.**

Le code utilise encore : `contract|quote|invoice|brief|content|technical|legal|other`.

Taxonomie cible validée : Administratif & identité ; Identité visuelle ; Devis & contrats ; Facturation & paiements ; Échanges importants ; Documents fournis par le client ; RGPD / consentements / demandes ; Archives.

Aucune migration improvisée ne doit être faite sans mapping explicite et tests fichier + métadonnées.

### LOGIC-012 — Changer catégorie document sans déplacer le fichier

**Statut : À TRAITER AVEC LOGIC-011.**

La règle physique du Dossier Client sera décidée dans le même lot que la taxonomie.

### LOGIC-013 — Suppression document non transactionnelle avec le filesystem

**Statut : À SÉCURISER DANS LE LOT DOSSIER CLIENT.**

Recommandation conservée : quarantaine/déplacement temporaire, transaction DB, puis suppression finale.

### LOGIC-014 — Preuve d’envoi Devis portée par une action CRM

**Statut : ACCEPTÉ POUR V1 ET MIEUX EXPLOITÉ.**

`sent_at` reste sur le devis. Canal, destinataire et note restent dans l’action liée ; la fiche Prospect les relit désormais et affiche aussi dernière/prochaine relance.

### LOGIC-015 — `window.prompt` sur le parcours commercial

**Statut : LARGEMENT CORRIGÉ.**

Le parcours principal dispose maintenant de formulaires structurés pour actions/relances, clôture, perte Prospect, pause devis et refus devis. Toute occurrence résiduelle hors parcours principal doit être relevée pendant la recette visuelle.

### LOGIC-016 — `missing_information` JSON dans TEXT

**Statut : ACCEPTÉ V1.**

Le parseur garde la compatibilité avec un ancien texte libre. Une migration de structure n’est pas nécessaire pour la stabilisation commerciale.

## Invariants à préserver

- Conversion Prospect → Client idempotente.
- Un seul Client par organisation dans le parcours normal.
- Besoin persistant obligatoire pour les étapes commerciales avancées.
- Devis finalisé avant envoi.
- Devis envoyé/accepté non éditable directement.
- Négociation par duplication, ancien devis intact.
- Snapshot catalogue figé.
- Projet unique par devis accepté.
- Une seule session Timer active.
- Débit de pack d’heures idempotent.
- Fichiers métier hors SQLite.
- Archivage Client non destructif.

## Décision de sortie de la passe commerciale

La logique commerciale pourra être déclarée prête pour reprise de recette lorsque :

1. `npm run typecheck` est vert sur Windows ;
2. `npm test` est vert sur Windows ;
3. les cinq documents d’audit sont présents sur la même branche que le code ;
4. la recette manuelle confirme les points visuels/persistance ;
5. aucune correction de cette passe n’a modifié les prix catalogue ni engagé le chantier Projet.

Le Dossier Client et la machine Projet restent des lots suivants et ne doivent pas bloquer la validation de la cohérence Prospect/Devis, à condition que leurs écarts soient explicitement documentés comme ici.
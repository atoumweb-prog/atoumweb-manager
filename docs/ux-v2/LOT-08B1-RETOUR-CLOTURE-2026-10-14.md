# Lot 08B.1 — Retour de clôture d'incident et sécurité du message (14/10/2026)

Statut : **correctif React publié, tests non exécutés**. Branche `feature/ux-v2-lot08a-audit-v1`, dernier commit de code `1ec52be65bea959b671f8072d13a4e175b4dbc20`.

## Défaut identifié
Dans `src/renderer/operations/OperationsPage.tsx`, `changeInterventionStatus` interceptait l'erreur de `window.atoumweb.operations.interventions.complete` sans la relancer. `InterventionConclusionPanel.save(true)` attendait son `onComplete()` (Promise<void>) puis fermait le panneau et annonçait une clôture même en cas d'échec métier. La conclusion était enregistrée séparément avant la tentative de clôture.

## Modification
- `changeInterventionStatus` renvoie désormais `Promise<boolean>` : true après réponse réussie et rafraîchissement, false après échec notifié ou intervention absente.
- Prop `InterventionDetail.onStatus` et `InterventionConclusionPanel.onComplete` alignées sur le retour boolean.
- Dans `save(true)`, le panneau ne se ferme et n'annonce la clôture que si `onComplete()` a renvoyé true.
- Libellé corrigé : ne prétend plus qu'un rapport de fin a été enregistré par ce seul flux.

## Limites et recette requise
Ce correctif **ne rend pas atomique** l'enregistrement de la conclusion puis la clôture : la conclusion peut rester sauvegardée en cas de refus de clôture. C'est un comportement à expliciter dans le parcours UI. Un échec de rafraîchissement après clôture pourrait aussi produire un retour false malgré mutation métier réussie ; il faudra distinguer l'acquittement métier du rafraîchissement avant certification. Ne pas créer de deuxième clôture pour masquer cet état.

Scénarios à vérifier localement : refus de clôture et conclusion conservée; réussite réelle; erreur IPC; double clic pendant `busy`; brouillon UX-01/transition et focus; statut conservé; absence de message mensonger; typecheck; Vitest; Electron sur 3 thèmes × 3 densités. Utiliser SQLite TEMP, jamais Validation-MSI.

## Suite
Avant toute fenêtre de prévisualisation de débit : inventorier les projections fiables réellement disponibles depuis IPC/services. Ne pas fabriquer côté React un solde pack ou quota de maintenance. Recette humaine globale différée; ni merge `main` ni CI revendiqués.

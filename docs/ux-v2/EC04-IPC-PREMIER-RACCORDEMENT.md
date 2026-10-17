# EC04 — premier raccordement de la barrière aux handlers réels (incrément 10)

Branche `feature/ec04-workspace-file-inventory-v1`, base au commit `15d4a2faa82fd8011e7e9f4f0815736c82b9a8df`. Aucun changement de schéma SQLite, pas d'archive exposée à l'utilisateur.

## Branchement effectif

Le processus principal Electron crée **une unique instance** de `WorkspaceMutationGate` et la transmet au registre `registerIpcHandlers`. L'argument reste optionnel pour conserver les fixtures anciennes. L'outil `runWorkspaceMutationIfAvailable` préserve le retour synchrone des fixtures non protégées ; avec le verrou, les mutations sont comptées/attendues avant reprise.

Les opérations suivantes sont désormais réellement enveloppées côté IPC principal :

- Identité CRM : import et suppression de logos/avatars, avec revérification **dans** le verrou après la confirmation.
- Documents Client : import, changement de métadonnées, archivage et suppression confirmée.
- Facturation : import et rattachement d'une facture Abby en **une** opération protégée (inventaire, copie, empreinte, rattachement).
- Dépenses : création, mise à jour, changement de statut et import de justificatif.
- Ressources projets : import, statut, rôle, rattachement/détachement à une tâche et relocalisation d'un fichier.

Les dialogues de choix/confirmation sont volontairement **en dehors** du verrou : une attente humaine ne bloque pas indéfiniment les opérations et n'empêche pas le drainage. Les éventuelles vérifications de concurrence nécessaires après ces boîtes sont réalisées à l'intérieur du verrou, ou conservées lorsqu'elles étaient déjà présentes.

## Ce que cela ne garantit PAS encore

- Beaucoup de handlers mutateurs ne sont PAS protégés : devis/CGV, chronomètres, transactions multi-services, certains catalogues, Bridge, référentiels et les registres IPC spécialisés `operationsIpc`, `referentialsIpc`, `businessBackupsIpc`, `timeIpc`.
- Des services peuvent modifier les fichiers/SQLite **hors IPC**, et l'amorçage/maintenance du Manager exécute des mutations indépendantes.
- Certains services ont des lectures à effets de bord (ex. création de dossiers) à inventorier.
- Le prototype ne déclenche **aucune sauvegarde complète** : aucun coordinateur de capture raccordé à ce verrou, pas de bouton, pas de planificateur, pas de certification de cohérence.
- Un arrêt brutal pendant une opération SQLite+fichiers peut laisser des fichiers orphelins ; ce n'est pas une transaction atomique multi-fichiers. L'archive ne doit être créée que sur état stable et après recette.

## Vérifications

- Compilation TypeScript locale ciblée des modules gate / adaptateur : OK.
- 4 scénarios Node ciblés : absence de verrou compatible fixtures, file d'attente pendant capture, flux asynchrone, propagation d'erreur : OK.
- 3 scénarios Vitest supplémentaires committés dans `WorkspaceMutationIpcBoundary.test.ts` ; non encore exécutés par la CI Windows/Node24 du projet.
- Compilation TypeScript complète et tests Electron Windows **non disponibles ici** ; pas de CI hébergée déclenchée sans accord.

Le raccordement demeure **partiel**. Ni fusion dans `main`, ni installation, ni accès aux bases réelles.

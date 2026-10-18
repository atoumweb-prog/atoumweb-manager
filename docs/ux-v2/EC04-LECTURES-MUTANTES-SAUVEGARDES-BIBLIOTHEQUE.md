# EC04 — Écritures indirectes dans les listes des sauvegardes métier et les assets

## Audit du code des services

`BusinessBackupService.list → mapRecord → listLocations → mapLocation` contient des **UPDATE de `backup_locations.missing_at`** lorsqu'un emplacement local change de disponibilité. `get`, `overview` et `BusinessBackupAlertService.listAlerts` rejoignent ces mêmes chemins et ne sont donc pas de simples lectures.

`AtoumWebTechnicalAssetService.get → map` actualise **`atoumweb_technical_assets.missing_at`** ; `absolutePath(assetId)` appelle `get`. `versionDirectory` effectue `mkdirSync(recursive:true)` et était utilisé sans barrière lors de l'ouverture/importation de fichiers. Un choix d'import annulé appelait également `list`, qui actualise la même colonne.

## Modifications

Le verrou `WorkspaceMutationGate` existant est maintenant utilisé par les registres IPC :
- Sauvegardes métier : `list`, `get`, `overview`, liste des alertes, ainsi que le parcours de relocalisation annulée.
- Bibliothèque : résolution du chemin lors de l'ouverture du fichier, création éventuelle de son dossier, préparation du dossier proposé par la fenêtre d'import et rafraîchissement de la liste si cette fenêtre est annulée.
- L'attente du choix de l'utilisateur et `shell.openPath` restent **hors de la barrière**.

Trois tests Vitest de couverture source et deux tests IPC simulés ont été ajoutés pour contrôler le blocage des effets de bord pendant une future capture.

## Réserves

La barrière est coopérative et reste insuffisante pour certifier des processus ou tâches externes. Les listes et services non énumérés sont à auditer ; le coordinateur n'est pas branché à une sauvegarde complète dans l'interface. CI, TypeScript global et Windows/Electron non exécutés sur ce candidat. Aucun changement de `main` ou de workspace réel.
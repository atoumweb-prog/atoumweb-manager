# EC04 — plan de raccordement de la barrière d'écriture (audit de `main`)

État : audit de code ciblé, **pas** une barrière active ni une recette de production.
Référence contrôlée : `main@376eef943e741e2967465b0016c05fc1977a97ea`.

## Pourquoi un simple verrou SQLite ne suffit pas

La fenêtre principale et les fenêtres Prospect utilisent le même processus principal Electron, mais **plusieurs chemins écrivent sur disque avant, pendant ou après SQLite**. Faire `backupTo()` pendant que l'utilisateur importe un document pourrait archiver l'enregistrement SQLite sans le fichier ou inversement. Arrêter seulement les `database.run()` risquerait aussi de bloquer une transaction dont le fichier vient d'être copié, créant un état incohérent.

## Entrées et services identifiés dans le code réel

| Zone | Fichiers inspectés / exemples | Risque |
|---|---|---|
| Registre principal IPC | `src/main/ipc.ts` : nombreux `ipcMain.handle`, dont configuration, devis, clients, Bridge, importations et sauvegardes | Flux simultanés de plusieurs fenêtres ; traitements `async` pouvant rester actifs |
| Registres IPC spécialisés | `src/main/operations/operationsIpc.ts`, `referentials/referentialsIpc.ts`, `backups/businessBackupsIpc.ts`, time IPC, préférences | Mutations absentes d'un éventuel verrou limité au seul fichier `ipc.ts` |
| SQLite et amorçage | `src/main/database/DatabaseService.ts` et `NodeSqliteAdapter.ts` | Migrateur, réindexation, seed, backup automatique, transaction en cours |
| Chronomètre | `src/main/time/TimeService.ts` | INSERT/UPDATE sessions, pauses, transactions `BEGIN IMMEDIATE` |
| Documents et contrats | `src/main/crm/ClientDocumentService.ts` | Copies de pièces et preuves `preuves-devis`, puis INSERT/UPDATE SQLite ; preuves historiques immuables |
| Logos | `src/main/crm/CrmIdentityAssetService.ts` | Fichiers physiques `crm-identites` + références DB |
| Ressources projet | `src/main/projects/ProjectResourceService.ts` | Copies de ressources + `file_assets`, répertoires de ressources éventuellement personnalisés |
| Dépenses | `src/main/expenses/ExpenseService.ts` | Justificatifs et champs de chemin SQLite |
| Bibliothèque | `src/main/referentials/AtoumWebTechnicalAssetService.ts` et IPC d'import/export | Assets et compositions en fichiers avec références DB |
| Projets | `src/main/projects/ProjectService.ts` | Transactions et création de répertoires ; parcours métier longs |

Ce relevé couvre les chemins examinés, **pas tous les services**. Les accès matériels du plugin WordPress Bridge distant et les secrets Windows doivent être analysés séparément.

## Séquence minimale à implémenter et prouver

1. Rejeter toute nouvelle opération mutante IPC avant son entrée ; ne pas perturber les lectures pures.
2. Attendre la fin des opérations mutantes déjà commencées, **y compris** les opérations `async` multi-étapes, fichiers et DB ; refuser la capture si une transaction longue ne se termine pas dans le délai défini.
3. Conserver l'état des brouillons en cours : ni fermeture de fenêtre, ni conversion automatique des brouillons en données sauvegardées, ni remise à zéro du timer ; afficher clairement que les brouillons non enregistrés ne sont pas dans l'archive.
4. Une fois le monde applicatif réellement immobile, capturer SQLite ET les fichiers ; ne pas relâcher le verrou avant que les fichiers cohérents soient dans un espace de staging privé. Le prototype actuel conserve le verrou pendant toute l'archive, solution sûre seulement si tous les producteurs sont effectivement bloqués, mais potentiellement très longue.
5. Relâcher le verrou dans un `finally` contrôlé, y compris en cas d'espace disque insuffisant, archive altérée, timeout et annulation.
6. Ne déclarer la sauvegarde complète que si les références DB↔fichiers, chemins personnalisés, secrets et éventuelles dépendances externes ont été vérifiés, puis restauration testée sur un workspace neuf.

## Tests de convergence à concevoir

- Deux fenêtres qui modifient le même client ; une importation de PDF `async` en cours pendant la demande de backup.
- Timer de session active et pause/reprise sans double écriture ni perte de temps ; interruption de l'acquisition du verrou.
- Échec du snapshot au milieu de l'opération, reprise effective des écritures ; deux sauvegardes simultanées.
- Mutation de fichier pendant la copie, création/suppression de ressources sous les racines, ressources manquantes, paths hors workspace.
- Redémarrage pendant installation d'une restauration : marqueur `.EC04-RESTORE-INCOMPLETE`, aucune sélection automatique de ce dossier.
- Double PC Windows et chemins DPAPI, permissions NTFS, symlinks/junctions, chemins longs, Unicode/casse.
- Aucune sauvegarde appliquée aux données réelles avant validation de l'utilisateur.

**Décision d'architecture actuelle :** `Ec04CaptureCoordinator` reste non raccordé aux handlers `ipcMain`, à `DatabaseService` et à la sauvegarde automatique ; aucune promesse de cohérence ne peut être donnée à ce stade.

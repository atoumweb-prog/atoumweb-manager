# EC04 — Copie relocalisée expérimentale d'un workspace déjà restauré

Branche : `feature/ec04-workspace-file-inventory-v1`. Module autonome : `WorkspaceRelocatedCopy.ts`. Aucune modification des handlers Electron ni de la base réelle.

## Ce que fait l'incrément

`createRelocatedWorkspaceCopy()` prend une restauration B1 **déjà vérifiée et non utilisée**, le manifeste d'origine, l'ancien chemin logique du workspace et une **nouvelle destination qui ne doit pas exister**.

1. Vérifie l'état intact de la restauration B1 et son manifeste SHA-256, puis prépare un plan des racines `projects.resource_root_path`.
2. Refuse avant toute écriture les racines externes, ambiguës, partagées, les schémas manquants et les secrets Windows chiffrés non portables.
3. Crée une **nouvelle copie**, marquée `.EC04-RELOCATION-INCOMPLETE`, et transfère SQLite + tous les fichiers du manifeste. Contrôle de nouveau les empreintes de la source et de la copie.
4. Sur **la nouvelle copie uniquement**, effectue une transaction SQLite pour remplacer les racines des projets par les chemins du nouvel emplacement. Contrôle les lignes réellement modifiées et l'intégrité SQLite.
5. Reconstruit les **sept sous-dossiers Ressources** prévus dans `ProjectService.createResourceFolders()`, y compris les dossiers qui étaient vides dans la capture B1. Les fichiers originaux ne sont pas déplacés.
6. Écrit un reçu `.EC04-RELOCATION-RECEIPT.json` contenant le SHA-256 de la base avant/après, l'identifiant du manifeste et des compteurs, puis supprime le marqueur d'inachèvement uniquement en cas de succès.

Une erreur laisse la destination avec son marqueur de danger. La fonction refuse d'écraser même un répertoire vide, et refuse les destinations incluses dans le workspace source.

## Ce que l'incrément ne garantit toujours PAS

**Le fichier SQLite est volontairement modifié après la copie.** Son SHA-256 n'est donc plus celui du manifeste B1. Le reçu de migration documente l'écart ; il n'authentifie pas le nouveau workspace. La vérification B1 d'origine doit continuer à refuser une nouvelle copie ainsi modifiée.

Le test de service `ProjectResourceService.projectResourceRoot()` vérifie que la **logique métier** retrouve le nouveau chemin sur une base fictive. Il **ne prouve pas** le démarrage d'Electron sur Windows, la validité des secrets DPAPI, la sécurité des flux hors IPC ou la fiabilité complète de la copie.

Le module refuse tout secret Windows chiffré (pas de déchiffrement, aucun export en clair). Il ne recopie pas `backups`, qui reste exclu du format B1. Il ne garantit pas la conservation des autres dossiers vides ou de chemins enfouis dans les données JSON/historiques. Un audit de toutes les références et la recette Windows restent obligatoires.

## Tests

Six tests Vitest de bout en bout ajoutés : archive → restauration → copie relocalisée → lecture par le vrai service Ressources, source inchangée, dossier conservé/créé, refus pour racine externe, secrets DPAPI, collisions, destination existante et restauration altérée. Ces tests ne sont pas encore exécutés dans la CI de projet.

Aucun appel à ce module depuis l'interface/IPC, aucune migration du schéma, aucune fusion vers `main`, aucune écriture dans un workspace réel.

# EC04 — Lectures avec écritures indirectes et diagnostic de portabilité (incrément 15)

Référence : branche EC04, après dc0ed7ee523dccadffee751bf93d8470c8a857cf.

## Effets de bord confirmés dans le code

`ProjectResourceService.map()` modifie `file_assets.missing_at` et `updated_at` lorsqu'un fichier n'existe plus ou réapparaît. Ainsi, `projects:resources:list` et `projects:resources:open-file` sont **des opérations mutantes potentielles**, même si leurs noms ressemblent à des lectures. Elles passent maintenant par `guardedMutation`. La liste retournée lorsqu'une sélection d'import est annulée passe également par le verrou.

La relocalisation de ressource effectue une première lecture protégée avant la boîte de dialogue, puis après celle-ci une **revérification du chemin et de l'empreinte** dans le verrou avant copie/modification de SQLite. Une modification concurrente de la référence est refusée.

## Portabilité : lecture seule sur le snapshot SQLite

`inspectWorkspacePortabilityRisks(sqliteSnapshot,workspaceRoot)` inspecte seulement deux catégories de dépendances connues :
- `projects.resource_root_path` : racines absolues à relocaliser lors d'une restauration sur un autre ordinateur, racines situées à l'extérieur, ou chemins relatifs qui ne sont pas nécessairement associés au workspace ;
- `project_node_secrets.secret_ciphertext` : nombre et identifiants des secrets Windows nécessitant un mécanisme de renouvellement / réenregistrement sur le nouvel ordinateur. Le chiffrement `safeStorage/DPAPI` est conservé : **aucun secret n'est déchiffré ou journalisé**.

Le rapport retourne `crossPcCertified:false` et `completeReferenceCoverage:false` **sans exception**. L'absence de schéma ou de colonne est indiquée dans `unavailableSchema`. Il n'est pour l'instant pas raccordé au flux productif ni au format de l'archive, précisément pour ne pas faire croire que ces dépendances ont été réparées. Le remplacement automatique d'un chemin ou d'un secret est interdit avant un protocole de migration documenté.

## Validation

- TypeScript isolé, Node 22 expérimental `node:sqlite` : OK.
- Fumée SQLite sur 4 projets + un secret chiffré : 5 risques identifiés, empreinte SHA256 du fichier SQLite inchangée.
- 7 tests Vitest supplémentaires écrits (3 IPC statiques et 4 SQLite), pas encore exécutés par la CI GitHub Windows.

**Non couvert** : autres références de fichiers, métadonnées JSON, registre IPC complet, processus externes, données brouillons non sauvegardées, cohérence globale de l'application, export sécurisé des secrets et restauration native Windows.

Aucune migration SQLite, aucun changement de `main`, aucune installation ou lecture de données réelles.

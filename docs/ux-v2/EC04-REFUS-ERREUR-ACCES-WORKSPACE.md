# EC04 — Refus explicite des erreurs d’accès au workspace configuré

Complément du verrouillage de démarrage EC04.

Avant ce correctif, `resolveWorkspace` couvrait lecture du JSON de configuration **et initialisation du workspace choisi** par un seul `try/catch`. Hors du cas spécial des marqueurs EC04, toute erreur (disque inaccessible, fichier au lieu d'un dossier, permission refusée, JSON illisible) pouvait déclencher silencieusement la création et l'ouverture du workspace par défaut.

Le code distingue désormais :
- **Fichier de configuration absent (ENOENT)** : le démarrage initial utilise normalement le dossier par défaut.
- **JSON syntaxiquement invalide** : conserve le fallback historique, sans le confondre avec une erreur système.
- **Configuration illisible, ou workspace explicitement choisi inaccessible** : lancement refusé, `WorkspaceAccessError` explicite, sans ouverture d'une nouvelle base sous un autre chemin.
- **Marqueur EC04 incomplet** : `WorkspaceIncompleteError` conservée et propagée sans fallback.

`main.ts` affiche une boîte d'erreur dédiée à l'accès workspace. Deux tests s'ajoutent : chemin configuré pointant vers un fichier plutôt qu'un répertoire, et emplacement du bootstrap étant un répertoire illisible comme fichier de configuration.

L'écriture de la configuration `workspace.json` reste l'implémentation historique ; cet incrément ne change ni les migrations SQLite ni le format de l'archive. Pas de CI complète ni de recette Windows exécutées à ce stade. Aucune fusion vers main.
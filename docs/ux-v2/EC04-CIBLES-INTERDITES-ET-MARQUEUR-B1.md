# EC04 — destinations interdites et marqueur de restauration B1

Sur la branche expérimentale `feature/ec04-workspace-file-inventory-v1`, deux contrôles de sécurité complémentaires ont été ajoutés sans activation de l'interface ni du moteur de production.

## Destinations relocalisées dans l'ancien workspace

La restauration B1 vérifiée peut provenir d'un répertoire de test distinct de l'**ancien workspace d'origine**, qui reste parfois actif. La première implémentation ne refusait explicitement que le répertoire de la restauration B1 elle-même. Il restait donc possible de désigner une destination à l'intérieur de l'ancien workspace.

`createRelocatedWorkspaceCopy` refuse maintenant une destination située **à l'intérieur ou au-dessus** de la racine logique d'origine lorsque son chemin est absolu natif. Sur Linux, un chemin source Windows ne peut pas être comparé lexicalement à une destination POSIX : cette situation reste sous le contrôle de `WorkspaceRelocationPlan` et ne saurait certifier un accès Windows réel.

Deux scénarios de test ont été ajoutés : cible imbriquée dans l'ancien workspace, et cible à un niveau supérieur. La source doit rester inchangée et aucun nouveau dossier cible ne doit être créé.

## Création du marqueur d'inachèvement B1

Le module `WorkspacePortableArchive` créait la destination avec `mkdirSync`, puis tentait d'écrire `.EC04-RESTORE-INCOMPLETE`. Si cette dernière opération échouait, un dossier de restauration vide pouvait subsister sans marqueur.

La création du marqueur est à présent protégée par `try/catch`. En cas d'échec, le module retire **uniquement le dossier exclusivement créé et toujours vide** avec `rmdirSync`. Si même ce nettoyage échoue, `AggregateError` signale la double défaillance. Une restauration qui a déjà commencé à copier des fichiers conserve quant à elle son marqueur, conformément au fonctionnement antérieur.

Une assertion de structure permet de vérifier dans la suite Vitest que ces étapes restent dans le bon ordre. **Ce test statique ne remplace pas un scénario de panne de permissions disque**, encore nécessaire dans la recette Windows.

## Limites

Aucun résultat CI complet n'est encore disponible ; l'ajout de tests n'est pas leur exécution. Des variantes symlink/jonction de dossiers ancêtres et des interruptions concurrentes restent à explorer en environnement Windows isolé. Le format B1 ne garantit toujours ni chiffrement ni authentification cryptographique, et la couverture des écritures hors IPC n'est pas achevée.

Ne pas fusionner, installer, ni toucher aux données utilisateur.

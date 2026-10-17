# EC04 — Projets, Workflow, secrets Windows : intégration progressive du verrou

Branche isolée : `feature/ec04-workspace-file-inventory-v1`, base `2eb240e90fb780cd9b69e1baf92dfd86b6c91d88`.

## Périmètre effectivement raccordé

**44 nouvelles routes IPC** disposent de `guardedMutation()` sur le verrou commun du processus principal Electron :
- Workflow : besoins et archivage de prospects, création/capture de démonstrations et remise à zéro des données de démonstration.
- Projet : modèles et versions, passages devis→projet, préparation/synchronisation commerciale, redémarrage contrôlé, cible et résolution de conflits, création interne, états des projets.
- Sites/pages et nœuds : création, rattachement, application de blueprint, ordonnancement, pauses, phases et prérequis.
- Bibliothèque technique des projets : versions, stabilité, liens de ressources, préparation de réutilisation, archivage.
- Secrets projet : **enregistrement et suppression** de la référence chiffrée SQLite. Le chiffrement `safeStorage` de Windows est conservé, jamais déchiffré par la sauvegarde ; la route de révélation reste inchangée.
- Racine des ressources projet : la consultation de dossier étant potentiellement créatrice de répertoire, son accès dans les dialogues d'import et d'ouverture est également protégé.

## Deux opérations multi-étapes

La réinitialisation des données demo continue à demander une confirmation **avant** d'acquérir le verrou. Après la suspension éventuelle, le périmètre confirmé est relu et doit être identique ; la sauvegarde SQLite préalable, la suppression, et la reconstruction de l'index CRM ont lieu sous le **même permis**. Un changement concurrent interdit la réinitialisation au lieu d'agir sur un jeu différent.

La sauvegarde du secret n'enregistre que les octets déjà chiffrés par le mécanisme existant de l'OS. Cela **ne rend pas la restauration du secret portable** sur un second ordinateur : DPAPI/safeStorage et une procédure de renouvellement sont des sujets encore ouverts.

## Ce qui manque toujours à la certification

- Certaines consultations peuvent déclencher des écritures indirectes ; elles restent à auditer.
- Les opérations IPC principales restantes et les mutateurs hors IPC ne sont pas tous protégés ; le compteur de routes couvertes ne mesure pas l'exhaustivité.
- Le coordinateur de création d'archive n'est toujours **pas connecté au verrou**, pas de bouton ni de processus de capture réelle.
- Pas d'authentification, chiffrement de l'archive, inventaire complet des références, portabilité des secrets, validation de restauration Windows/Electron.
- Pas de CI GitHub ni de compilation complète du projet exécutées lors de ce changement.

`WorkspaceProjectWorkflowMutationCoverage.test.ts` ajoute quatre tests de **couverture statique**, non équivalents à une recette fonctionnelle Electron. Les contrôles autonomes effectués sur le code candidat sont distincts des tests Vitest non exécutés.

`main` et les bases de l'utilisateur restent inchangés. Aucun merge/installation.

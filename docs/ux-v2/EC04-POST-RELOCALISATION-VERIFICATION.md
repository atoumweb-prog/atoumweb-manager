# EC04 — Contrôle post-migration du workspace relocalisé

Incrément dédié à la branche `feature/ec04-workspace-file-inventory-v1`, sans activation IPC ni intégration `main`.

## Développement

Ajout de `verifyRelocatedWorkspaceCopy()` dans `WorkspaceRelocatedCopy.ts` pour une **vérification indépendante après migration**, et utilisation d'un vérificateur interne AVANT la suppression du marqueur `.EC04-RELOCATION-INCOMPLETE`.

Contrôles réalisés :
- Maintien de l'intégrité de la restauration source B1 et cohérence du reçu avec son identifiant et son empreinte SQLite initiale.
- État du marqueur d'inachèvement, empreinte de la nouvelle base par rapport au reçu, absence de journaux SQLite, `PRAGMA integrity_check`, `foreign_key_check` et identité des migrations.
- Examen en lecture seule de la colonne `projects.resource_root_path` pour toutes les lignes non nulles, qui doivent correspondre exactement au plan reconstruit depuis la source, et contrôle du nombre de dossiers recréés.
- Présence sûre des sept sous-dossiers Ressources par projet, refus des liens symboliques, jonctions et chemins manquants.
- **Inventaire complet des huit racines de fichiers possédées par le workspace** et comparaison des chemins, tailles et SHA-256 au manifeste B1 ; un fichier supplémentaire ou manquant, une collision Windows et une modification des bytes doivent faire échouer la vérification.

Cette vérification tient compte du fait qu'après relocalisation **l'empreinte SQLite change intentionnellement**. Le reçu n'est pas signé ni authentifié et aucun contrôle ne certifie les chemins externes ou la portabilité DPAPI.

## Essais

Quatre cas supplémentaires sont ajoutés au fichier `WorkspaceRelocatedCopy.test.ts` : contrôle post-migration réussi, fichier supplémentaire, dossier Ressources effacé, reçu falsifié. Le test d'intégration de migration d'origine est conservé.

Les tests sont committés mais leur exécution Vitest avec la suite complète est en attente d'un environnement disposant du dépôt entier. Les vérifications statiques de structure ne constituent pas une exécution des tests.

## Restrictions

L'API est **expérimentale et hors production**. La vérification exige la présence de la restauration B1 d'origine. Elle ne remplace pas un examen exhaustif des relations fichiers/SQLite, des données JSON, du chiffrement des sauvegardes, ni un essai Windows/Electron. Aucune fusion, aucune migration réelle, aucun installateur.
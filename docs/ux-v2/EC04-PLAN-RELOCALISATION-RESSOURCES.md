# EC04 — Plan de relocalisation des dossiers Ressources (proposition seulement)

## Constat vérifié dans le code métier

Les projets stockent une valeur **absolue** `projects.resource_root_path`, réutilisée par le service des ressources lors des imports. Sur un autre PC, cette valeur pointe encore vers l'ancien emplacement. Le conteneur B1 d'EC04 inventorie et copie les **fichiers**, mais pas les répertoires vides (par exemple les sept sous-dossiers d'un projet neuf).

## Développement

`src/main/backups/WorkspaceRelocationPlan.ts` expose `planProjectResourceRelocations(snapshotSQLite, sourceWorkspace, newWorkspace)`.

- Lit une **copie SQLite en lecture seule** sans `UPDATE`, sans déplacement de fichier ni déchiffrement de secret.
- N'émet des **propositions** que pour les chemins absolus contenus dans l'ancien workspace, avec racine `clients`, `projets-internes` ou `projets-previsionnels`, et suffixe `Ressources`.
- Calcule le chemin relatif vérifié puis la destination projetée dans le nouveau workspace, en utilisant la sémantique Windows ou POSIX selon les chaînes reçues ; les chemins Windows sont traités sans tenir compte de la casse.
- Classe en **examen manuel** les chemins externes, relatifs, traversées `..`, noms réservés Windows, chemins UNC/périphériques, répertoires inattendus et chemins Ressources partagés par plusieurs projets.
- Signale explicitement une structure SQL manquante. Aucun plan n'autorise une migration automatique.

Le résultat conserve toujours `readyForAutomaticMigration:false`, `sqliteChanged:false` et `emptyDirectoriesPreserved:false` : ce sont des garanties de **non-action**, pas une certification.

**Important :** le module ne prouve pas que les répertoires projetés existent, que le nouvel espace disque est accessible, que les références externes sont rapatriées, ni que `safeStorage/DPAPI` fonctionne sur l'ordinateur cible. Il n'est **pas connecté à une restauration en production**. Le protocole de réécriture des chemins sur une **copie restaurée** et la recréation des dossiers vides devront être ajoutés et testés séparément, avec refus avant ouverture du workspace si toutes les préconditions ne sont pas remplies.

## Vérifications réalisées

TypeScript isolé strict (Node 22) : OK. Scripts de fumée sur SQLite fictif : dossiers POSIX, chemins Windows avec changement de lecteur, casse, dossiers extérieurs, collisions, traversées et noms réservés : OK. Tests de portabilité précédents et coordinateur : OK. Quatre tests Vitest sont ajoutés mais non exécutés dans la CI projet. Aucun essai sur Windows réel.

Branche dédiée EC04, sans fusion, sans changement de la base réelle ou de `main`.

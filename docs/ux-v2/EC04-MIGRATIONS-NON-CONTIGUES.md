# EC04 — Registre migrations à identifiants non consécutifs

## Anomalie prouvée

Le cœur `WorkspacePortableArchive.ts` validait `schema_migrations` et les migrations du manifeste avec `row.id === index+1`. Cette hypothèse est **différente** de celle du Manager, qui vérifie les migrations appliquées par leur **id et nom exacts** en construisant une table d'identité des migrations. La continuité numérique des identifiants ne doit pas être inventée.

Ce contrôle pouvait donc rejeter comme invalide une archive cohérente provenant d'une base contenant, par exemple, les migrations 1, 3 et 71.

## Correction

Le même validateur `validateEc04MigrationLedger` est réutilisé pour la lecture SQLite et pour les métadonnées du conteneur B1. Il accepte les IDs **strictement croissants** même en présence de trous, mais refuse ID non entier/≤0, doublon d'ID ou de nom, mauvais ordre, nom vide et liste vide ou supérieure à 1000 entrées. Les noms et IDs ne sont jamais re-numérotés.

Le prototype ne revendique **pas** la validation de la compatibilité de chaque migration avec le Manager installé : elle relève du contrôle de schéma exact existant dans le service de restauration classique et de la recette Windows.

## Tests

- Test de bout en bout archive→vérification→restauration avec le jeu `[1,3,71]`.
- Tests de refus du registre SQLite contenant nom dupliqué ou ID nul.
- Trois tests unitaires du validateur, dont les collisions, l'ordre et le volume.

Tests ajoutés, **non exécutés** dans la CI du dépôt. Aucun changement au schéma ni migration réelle.

Ne pas fusionner vers main ou activer les sauvegardes complètes avant validation de bout en bout.
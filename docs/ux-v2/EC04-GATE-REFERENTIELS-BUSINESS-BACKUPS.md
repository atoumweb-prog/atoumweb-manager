# EC04 — raccordement incrémental des registres Bibliothèque et Sauvegardes métier

Référence : branche `feature/ec04-workspace-file-inventory-v1`, après raccordement Chronomètre/Opérations.

Le même verrou partagé est transmis par `main.ts` à deux registres supplémentaires.

- `referentialsIpc.ts` : **36 handlers** encadrés (création, versions, mise à jour, archivage, import d'assets, fonctions de composition, gestion des variantes, export/import de packages et retours Bridge). Les listes et aperçus d'assets sont aussi inclus : certains accès « lecture » du service actualisent `missing_at` dans SQLite.
- `businessBackupsIpc.ts` : **9 handlers** encadrés (enregistrements métier, emplacements, vérifications, politiques et interventions). Lors de la relocalisation, la boîte de dialogue reste en dehors du verrou ; le chemin précédemment connu est revérifié **dans** le verrou avant de modifier la référence, avec refus si un autre écran l'a changée.

L'argument `gate?` reste optionnel afin de conserver les tests historiques et le comportement synchrone de leurs fixtures. Les traitements dans le processus principal utilisent la même instance.

Tests Vitest synthétiques ajoutés : attente d'un ajout en Bibliothèque et d'une exportation, liste d'assets à effet de bord, création d'une sauvegarde métier pendant pause, et détection d'une relocalisation concurrente. Non exécutés sur Windows ni dans la CI complète.

**Limites bloquantes** : pas de sauvegarde EC04 active, couverture générale non certifiée, autres écritures dans le registre principal `ipc.ts`, mutateurs autonomes, chemins externes, secrets Windows, intégrité de la source et recettes natives. Le moteur ne doit pas être fusionné ni installé en production.

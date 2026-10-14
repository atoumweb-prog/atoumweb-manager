# Lot 06F — Recette transversale et intégration

Branche indépendante issue de main ; aucune fusion réalisée.

## Sous-lots et PR

- 06A #110 : prix, validation et acceptation Abby.
- 06B #112 : protections brouillon, navigation A→B→A et Electron.
- 06C #117 : composition, options et versions catalogue.
- 06D #120 : contrats, refus, envoi et conséquences métier.
- 06E #122 : révisions et historique.

## Critères de validation avant intégration

1. CI réussie au HEAD exact de chaque branche.
2. Candidat de convergence isolé : résoudre les conflits entre branches et les lots 04/05 sans écraser leurs modifications.
3. Rejouer installation, TypeScript, Vitest, migrations, restaurations, Electron Windows TEMP et scénario A→B→A.
4. Vérifier les conséquences métier : brouillon, envoi, refus, validation, acceptation, Client, Projet, pièces Abby et clauses CGV.
5. Archiver pour chaque contrôle le commit exact, la CI et les éventuelles réserves.
6. Aucune fusion dans main sans décision explicite.

Ce document décrit une recette à exécuter : il ne constitue pas une preuve de validation consolidée.
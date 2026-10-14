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

## Vérification des HEAD et CI du 14/10/2026

| Sous-lot | PR | HEAD | GitHub Actions | Contrôle |
| --- | --- | --- | --- | --- |
| 06A | #110 | `46e13a5` | #912 | **Échec** ; journal indisponible (BlobNotFound), ne pas valider |
| 06B | #112 | `959f25d` | #1022 | Réussite, Electron UX-01 et A→B→A |
| 06C | #117 | `f48a242` | #1060 | Réussite |
| 06D | #120 | `01ab32c` | #1070 | Réussite |
| 06E | #122 | `80868c9` | #1075 | Réussite |
| 06F | #123 | `f7b1f5f` | #1080 | En cours à la vérification |

Les comparaisons GitHub de chaque branche avec `main` indiquent zéro commit de retard au contrôle, mais cela ne certifie **pas** la compatibilité des branches entre elles. Surfaces communes : `QuotesPage.tsx` (06A/06B) et `QuoteService.test.ts` (06C/06D/06E). Les changements doivent être réunis avec contrôle de la compilation puis exécution des tests après consolidation. Éviter une simple substitution de fichier par un autre.

Action prioritaire : nouvelle exécution diagnostique de 06A, puis préparation d'un candidat combiné distinct de `main` ; les CI individuelles ne constituent pas une preuve de recette 06F.

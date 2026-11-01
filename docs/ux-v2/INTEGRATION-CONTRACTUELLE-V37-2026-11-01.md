# Intégration contractuelle V3.7

## État du lot

La bibliothèque Word retenue par AtoumWeb a été extraite en un référentiel structuré de 118 clauses. La source comporte 118 codes uniques et trois publics contractuels. La comparaison avec la proposition documentaire précédente relève 77 clauses dont le texte, le titre, le code ou le public change.

Ce lot prépare uniquement des versions brouillon. Il ne publie aucune clause, ne remplace aucun texte accepté et ne recalcule aucun devis ou contrat historique.

## Sources contrôlées

- Bibliothèque contractuelle V3.7 du 1er novembre 2026 : SHA-256 `fe9f793cfef5f7bcbcaf721ef3336be526119a89ea4cc940a233d958e19191ec`.
- Accord RGPD V3 du 1er novembre 2026 : SHA-256 `7c646476c7f35e73d1681f2dad602994873c018048a98ecce086cddd7b07b51f`.
- Le second document est inventorié pour le lot RGPD séparé. Il n'est pas intégré automatiquement aux devis dans ce lot.

## Comportement ajouté

- La simulation de convergence utilise désormais le référentiel V3.7 retenu et non les propositions du 25 octobre.
- Un import V3.7 peut succéder à un ancien import éditorial sans écraser son brouillon ni son historique.
- Le code et le public sont portés par chaque version de clause. Ils restent inchangés sur le modèle publié tant que le nouveau brouillon n'est pas publié.
- La publication explicite d'une version peut adopter son nouveau code et son nouveau public. L'ancien code est alors conservé dans la table d'alias.
- Le renommage préparé est `BLOG-DONNEES` vers `BLOG-ROLES-CONTENUS`.
- Le changement de public préparé pour `MARIAGE-PRIVE` est `all` vers `consumer`.
- Les six brouillons Catalogue restent séparés des versions publiées. Les textes de maintenance et d'hébergement précisent désormais les sauvegardes o2switch Cloud, l'absence de copie indépendante AtoumWeb, la fin de maintenance mensuelle, l'engagement annuel exprès et la transition sans double facturation.

## Migration

La migration SQLite 79 ajoute `code` et `audience` aux versions de clauses et crée `contract_clause_code_aliases`. Elle est additive. Les valeurs historiques sont recopiées depuis le modèle existant. Les devis et contrats conservent leurs snapshots immuables.

## Contrôles exécutés

- TypeScript : réussi.
- Tests ciblés migration, bibliothèque, convergence, Catalogue et frontière de confirmation : réussis après actualisation des attentes V3.7.
- Recette SQLite sur copie isolée : 118 brouillons contractuels et 6 brouillons Catalogue préparés ; rejeu idempotent ; rollback contrôlé ; devis, clauses publiées et versions Catalogue publiées identiques avant et après.
- Aucune campagne PDF n'a été relancée : ce lot ne modifie pas le moteur de rendu ni une version publiée.

## Suite distincte

Le lot suivant doit intégrer l'accord RGPD V3 comme document séparé par client et par site, avec ses fiches, ses statuts et son blocage limité aux traitements nécessitant un accord signé. Il ne doit pas être joint automatiquement à tous les devis.

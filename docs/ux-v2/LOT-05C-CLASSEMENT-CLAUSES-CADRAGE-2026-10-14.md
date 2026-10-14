# Lot UX/UI 05C — Cadrage du classement des clauses contractuelles

## Préalable validé

05B.3 : code `e92b5be9f14e995557a7aed43138f961e1aa7bf6`, CI #895 **SUCCESS**, typecheck et recette Electron 05B TEMP réussis ; Vitest **1047/1047** (110 fichiers). Sept confirmations UX-01 dans le banc natif. Les trois densités et la recette juridique humaine restent hors certification. Pas de fusion vers `main`.

## Règle fondamentale à préserver

Le contrat est **intégré au devis**, et l'acceptation du devis vaut référence à son snapshot contractuel figé. Abby demeure la sortie de finalisation externe. Aucun classement ne doit modifier les identifiants canoniques, le texte original des versions, les liens Catalogue, les snapshots `draft/frozen/historical_missing`, les preuves Abby ni les données réelles.

## Approche 05C — d'abord un inventaire non destructif

Distinguer systématiquement :
- **CGV communes** (scope `base`) : applicabilité selon le public contractuel ;
- **Clauses spécifiques** (scope `catalog`) : applicabilité par prestations réellement sélectionnées ;
- **Conditions particulières** : propres à un devis, à ne pas reclasser automatiquement dans la bibliothèque.

Les dimensions de classement proposées pour la future interface sont : famille juridique à arbitrer, public (`all`, `professional`, `consumer`), portée, prestations associées, état et version, provenance et revue documentaire. Les libellés de familles ne valent **jamais** une validation juridique.

## Étapes sûres

1. Lire le référentiel contractuel et inventorier les clauses existantes sans les réécrire.
2. Réaliser une vue de tri / recherche **présentation uniquement**, sans nouvelle colonne, migration ou réaffectation automatique.
3. Tester qu'une clause liée à plusieurs prestations conserve exactement sa référence et son texte, et que les versions figées de devis ne changent jamais.
4. Vérifier trois thèmes × trois densités, navigation clavier, focus, listes longues et abandon des brouillons.
5. Soumettre les catégories juridiques et leur contenu à une **validation humaine distincte** avant toute édition ou publication de textes.

## Non-objectifs

Pas de remplacement de CGV, aucune décision juridique automatique, aucune republication, aucune mutation de données utilisateur, aucune fusion. Les travaux 03/04 restent indépendants.

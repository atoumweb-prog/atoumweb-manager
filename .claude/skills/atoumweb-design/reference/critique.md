# Critique : revue de conception par lecture du code et des captures

Aucun programme externe, aucun binaire, aucun script. La critique repose sur trois sources : le code (renderer, CSS, tokens des trois thèmes), les captures d'écran fournies ou prises avec les outils déjà autorisés dans la session, et `docs/refonte/DESIGN.md` s'il existe.

## Invariants

- Limite-toi à la cible nommée et au lot en cours. Une critique ne modifie rien.
- Chaque constat cite une preuve : fichier et sélecteur, ou capture. Pas de jugement sans preuve.
- Sépare ce que tu as vu (code, captures) de ce que tu n'as pas pu vérifier (rendu réel, interactions, états rares). Dis-le explicitement.
- Ne propose jamais de refonte complète d'un écran sans validation de l'utilisateur : présente-la comme une option, avec son coût, et attends sa décision.
- Respecte AGENTS.md et le cahier des charges ; en cas de conflit, signale-le au lieu de choisir.

## Déroulé

1. **Cadrer** : cible (écran, composant, parcours), utilisateur type, tâche principale. Lis le code concerné et regarde les captures disponibles. Si aucune capture n'existe, demande-en ou dis que le rendu n'a pas été vu.
2. **Revue de conception** : réponds par des preuves à chaque point.
   - Hiérarchie : test du plissement des yeux, un élément principal clair ?
   - Charge cognitive : combien de choix simultanés, divulgation progressive (voir `critique-reference.md`).
   - Cohérence : mêmes rôles = mêmes composants, avec les tokens du projet, sur les trois thèmes.
   - États : vide, chargement, erreur, succès, désactivé, contenu long.
   - Accessibilité : contraste, focus, noms accessibles, cibles de clic.
   - Texte : libellés clairs, vocabulaire du métier, pas de jargon technique côté utilisateur.
3. **Notation** : applique la grille de `critique-reference.md` (10 heuristiques de Nielsen, 0 à 4 chacune), puis le total sur 40.
4. **Personas** : teste mentalement le parcours avec les personas de `critique-reference.md`, plus ceux déduits de la documentation du projet.
5. **Rapport** (dans le chat) :
   - Verdict en deux phrases.
   - Score et ce qui le tire vers le bas.
   - Problèmes classés P0 (bloquant), P1 (important), P2 (amélioration), chacun avec preuve, impact et correction proposée.
   - Ce qui fonctionne et doit être conservé.
   - Ce qui n'a pas pu être vérifié.
6. **Suite** : propose 2 à 4 actions concrètes (par exemple `polish`, `layout`, `typeset`, `clarify`) et demande laquelle lancer. Ne commence aucune modification sans accord.

Le rapport n'est enregistré dans un fichier que si l'utilisateur le demande, après qu'il en a vu le contenu.

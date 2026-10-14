# UX/UI V2 — 05B.2 : navigation unifiée dans la bibliothèque

**Base :** PR #106 / 05B.1 validé par CI #886 (Typecheck, 1024 Vitest, 144 Electron, 6 confirmations, TEMP).  
**Référentiel source :** PR #82 `LOT-05B-BIBLIOTHEQUE-EDITOR.md`.

Ce nouvel incrément ajoute une navigation **en lecture seule** à côté de la liste historique des types : **CGV communes** et **clauses spécifiques**, chacune conservant son **ID canonique, son code, son public, son statut**. Une recherche francophone par titre, code ou public tolère les accents et ouvre le même éditeur de module existant, sans copie, publication ni synchronisation automatique.

Le moteur, les contrats, les CGV et la persistance sont strictement inchangés. Les liens Catalogue ne sont pas modifiés. L'action réutilise `guardedNavigation` et la garde UX-01 de l'éditeur existant.

**Recette :** tests unitaires filtre/accents/identité/non-mutation et contrôles Electron dans le banc `--ux05b`. Les captures du banc historique contrôlent les thèmes AtoumWeb/Noir/Blanc. La grille 3 densités et les comportements des longues listes restent à valider ; pas de validation humaine des textes juridiques.

Ne pas fusionner tant que la nouvelle CI HEAD et la recette ciblée ne sont pas vertes ; aucune intervention sur #104 Catalogue, #105 Client ou les bases réelles.

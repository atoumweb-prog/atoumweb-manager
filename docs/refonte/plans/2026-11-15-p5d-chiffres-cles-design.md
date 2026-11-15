# P5d : un seul composant de chiffres clés (F27), fiche courte

Statut : **décisions de Carlos prises le 15/11/2026** (outil de question) ; Carlos a demandé l'exécution sans résumé des plans.
Skills : `superpowers:brainstorming`, `atoumweb-design` (extract, layout). Thème Noir, densité Confort.

## Pourquoi

F27 : plusieurs composants presque identiques pour afficher un chiffre clé. Un seul composant rend les écrans homogènes (mêmes tailles, mêmes espacements, même comportement au clic et au clavier) et supprime du code en double.

## Constat (relevé du code, 15/11/2026)

Huit façons d'afficher des chiffres clés :

| Variante | Où | Particularités |
|---|---|---|
| `KeyFigures` / `KeyFigureCard` (`ui/KeyFigures.tsx`, `.aw-keyfigure`) | 9 pages de liste ; Statistiques (cartes du haut, depuis P4b) | libellé, valeur, aide, action facultative |
| `.project-keyfigure` | fiche projet, onglets Commercial et Résumé | libellé et valeur ; « Prérequis manquants » cliquable |
| `.maintenance-dashboard` | Interventions, onglet Maintenance | icône (glyphe), libellé, valeur, aide |
| `.hour-pack-kpi-grid` | fiche d'un pack d'heures | libellé, valeur ; « Restant » en alerte si négatif |
| `.intervention-kpi-grid` | fiche d'une intervention | libellé, valeur ; contient le champ modifiable « Estimation actuelle » |
| `.statistics-snapshot` | Statistiques, rangée du bas | icône, libellé, valeur, aide, chevron, ouvre une page |
| `OperationKpi` (`.client-operation-kpi`) | fiche client, onglet Interventions | icône, valeur puis libellé |
| `.home-kpi-card` | Accueil | icône, couleur d'état, libellé, valeur, chevron, ouvre une page |

## Décisions de Carlos (15/11/2026)

1. **Les huit variantes, en deux lots** : **P5d1** (projet, Maintenance, Packs, Interventions, rangée du bas de Statistiques, fiche client) puis **P5d2** (Accueil, à part car c'est l'écran le plus visible).
2. **Icône et couleur d'état facultatives** : même structure et mêmes tailles partout ; les cartes qui ont une icône ou une couleur la gardent ; les listes restent sans icône.

## Approche retenue

Un seul composant, celui des listes (`KeyFigureCard`), enrichi de trois options facultatives, sans rien changer à ses usages actuels :
- `icon?: ReactNode` (une `OperationIcon` ou un glyphe), affichée avant le libellé ;
- `tone?: 'success' | 'warning' | 'danger' | 'info' | 'accent'`, avec les jetons sémantiques de R0 (`--aw-{rôle}-soft-bg` / `-soft-fg`), aucune couleur en dur ;
- `KeyFigures` accepte des `children` rendus après les cartes (le champ « Estimation actuelle » d'une intervention reste dans la même grille).

Ordre dans la carte partout : icône, libellé, valeur, aide, indice d'action. La fiche client passe de « valeur puis libellé » à « libellé puis valeur » (même ordre que partout).

Approches écartées : garder les variantes et seulement partager des jetons CSS (le code en double reste) ; tout rendre sobre sans icône (refusé par Carlos).

## Hors périmètre

Aucune donnée, règle ni calcul modifié : seules les valeurs déjà affichées passent dans le composant commun. Disposition des pages inchangée (mêmes emplacements).

## Preuves prévues (par lot)

Tests d'abord (le composant et chaque écran migré, garde de source : plus aucune classe de l'ancienne variante), suite complète, natifs 72, 18/18, 25, 857, `lot10` 59, budget des petits textes 12, `!important` 86, captures avant / après des écrans touchés (`captures-p5d1\`, puis `captures-p5d2\`).

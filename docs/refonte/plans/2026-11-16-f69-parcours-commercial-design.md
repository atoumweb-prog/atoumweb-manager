# F69 : vue « Parcours commercial » de Prospection, tableau compact (fiche à valider)

Date : 16/11/2026. Retour de Carlos du 15/11 (« ni esthétique ni pratique »). Disposition d'un écran : règle A, validation par fiche (règle J). Skill `atoumweb-design` (critique sur code et capture).

## Constat

Capture : Noir, Confort, grande fenêtre (1 488 × 948), rail déplié, base de test copiée. Fichier `C:\DEV\Livrables\Cadrage-parcours\captures-f69\avant\large\001`.

| Point | Preuve |
|---|---|
| Les 6 colonnes de 200 px ne tiennent pas dans les 1 198 px du plateau : la colonne « Finalisation » est coupée et le plateau défile en largeur | mesure `kanban-board` (`scrollWidth` > `clientWidth`) |
| Noms coupés au bout de deux lignes : « TEST — Cabinet… », « Garag… », « Prospec… » | capture ; en-tête de carte avec avatar et icône d'étape dans 170 px |
| Une barre de défilement horizontale dans chaque carte | capture |
| La colonne « Préparer le devis » (4 dossiers) défile à l'intérieur et coupe sa deuxième carte | mesure (`defileInterne: true`) |
| Cartes de 240 à 290 px de haut pour trois informations | mesure (`hauteurCarte`) |
| Le lien « Ouvrir la fiche » double le clic sur la carte | `ProspectsPageV2.tsx`, `pipeline-card-summary` |
| Une colonne vide garde un grand cadre avec « Aucun dossier » coupé | capture, colonne 6 |

Ce qui va bien et reste : les filtres « Tous / À relancer / En retard », les compteurs par étape, le glisser-déposer entre étapes, les rappels rapides et le changement d'étape, et « Clients acquis » en bas.

## Direction choisie par Carlos (16/11/2026) : tableau compact

Les 6 colonnes et le glisser-déposer restent. Tout tient dans la largeur de la page.

```
Tous 8 | À relancer 3 | En retard 3
┌À qualifier 1┐┌Besoins 1┐┌Devis 4──┐┌Attente 1┐┌Négo 1┐┌Final 0┐
│TEST — Cabinet││TEST —   ││TEST      ││TEST     ││TEST   ││ vide  │
│Archimed      ││Jardin   ││Garage    ││Prospect ││Coopé- │└───────┘
│Préparer…     ││Préparer…││Martin    ││en att.  ││rative │
│05/11 retard ⋯││05/11  ⋯ ││Plaquette ││—       ⋯││—    ⋯ │
└──────────────┘└─────────┘│14/11 ⋯   │└─────────┘└───────┘
                           │TEST Café │
                           │du Port ⋯ │
                           └──────────┘
```

## Ce que fait le lot

1. **Plateau** : les colonnes se partagent la largeur disponible au lieu de 200 px fixes. Une colonne vide se réduit, garde son en-tête et son compteur, et reste une cible du glisser-déposer. Plus de défilement en largeur en grande fenêtre.
2. **Pas de défilement interne** : une colonne grandit avec ses cartes, c'est la page qui défile. Les barres horizontales dans les cartes disparaissent.
3. **Carte** :
   - le **nom complet** passe à la ligne, sans coupure ;
   - l'avatar reste ;
   - l'icône d'étape ne s'affiche que si elle dit autre chose que la colonne (signal « accord de principe » en finalisation) ;
   - la **prochaine action** tient sur deux lignes au plus, avec son **échéance** en rouge si elle est dépassée ;
   - « **Ouvrir la fiche** » est retiré : toute la carte ouvre déjà la fiche, à la souris et au clavier ;
   - « **Rappel et étape** » devient un bouton icône « ⋯ » nommé pour les lecteurs d'écran (« Rappel et étape de [nom] »). Il ouvre exactement le même contenu : Demain, Dans 7 jours, Choisir une date, changement d'étape.
4. **En-tête de colonne** : « Étape N », le libellé, puis le compteur au plancher de 14 px, sur une ou deux lignes sans coupure.
5. **Fenêtre étroite** : si les colonnes ne tiennent plus à leur largeur minimale de lecture (environ 170 px), le plateau seul défile en largeur, avec une seule barre. Ni la page ni les cartes ne défilent.
6. **Thèmes et densités** : les règles sont communes à tous les thèmes et toutes les densités, comme en fin de refonte. Seules les couleurs en dur restent propres au Noir.

Aucune donnée, aucune règle métier, aucun ordre d'étape n'est modifié. Aucune fonction n'est retirée : le lien « Ouvrir la fiche » doublait la carte, qui garde son ouverture.

## Preuves prévues

- **Tests d'abord**, de câblage :
  - plus de `pipeline-card-summary` ;
  - `pipeline-card-tools` garde son contenu, avec un résumé icône nommé ;
  - colonnes en largeur fluide ;
  - plus de débordement interne ;
  - colonne vide réduite et toujours cible du dépôt.
- **Mesures avant / après** :
  - Noir Confort, grande fenêtre (rail déplié et replié) et fenêtre étroite ;
  - 0 défilement horizontal du plateau en grande fenêtre ;
  - 0 nom coupé, 0 défilement interne, 0 texte sous 14 px ;
  - hauteur des cartes.
- **Relevé rapide** en Blanc et AtoumWeb, en Compact et en Confort +.
- **Recettes de Prospection** (`prospection-ux-lots`, `final-crm`, `lot01a`) : celles qui utilisent `.pipeline-card-tools` restent valables. Une recette qui cliquerait « Ouvrir la fiche » serait réécrite sur la carte (règle H).
- Suite complète et typecheck.

## Hors lot

Les autres vues de Prospection (Liste, Historique) ; la fiche de travail du prospect ; les règles de « Prochaine étape » (F57).

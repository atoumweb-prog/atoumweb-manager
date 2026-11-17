# P5 : petits textes à zéro et chiffres clés unifiés (fiche courte de la passe de finitions)

Statut : **validée par Carlos le 15/11/2026** (« Je valide et pas besoin de me résumer fait » : le plan de P5a s'écrit et s'exécute sans résumé préalable).
Skills : `superpowers:brainstorming`, `atoumweb-design` (typeset, layout, adapt). Thème Noir, densité Confort (règle E).
Entrées du registre `FINITIONS.md` : F9 (budget), F24 (Accueil, 30), F26 (`operations.css` 36, `time.css` 13), F27 (chiffres clés), F34 (Bibliothèque, 53), F36 (Sites, 42), le reste de F35 et de F40.

## Pourquoi

Décisions de Carlos du 14/11/2026 (non rouvertes) : **plancher de 14 px absolu**, **budget des petits textes à zéro**, **F27 dans P5**. Le but est la lisibilité : aucun texte utile sous 14 px, nulle part.

## D'où viennent les constats

- Budget du code (`ui/fontFloorBaseline.json`) : **617 déclarations** `font-size` sous 14 px dans **54 fichiers** ; les huit plus gros en portent la moitié (Bibliothèque 53, Sites 42, `projects.css` 42, `operations.css` 36, `commercial.css` 32, `crm.css` 32, Accueil 30, `prospect-recipe.css` 25).
- **Mesure du rendu réel** (15/11/2026, copie jetable, 17 pages, premier écran de chaque page, fiches non ouvertes, outil `outils-audit\p5-releve.txt`) : textes visibles calculés sous 14 px : **Offres & Tarifs 219**, Annuaire 33, Statistiques 32, Sites 31, Projets 20, Prospection 18, Clients 10, Temps 8 ; en-tête sur toutes les pages : pastille du nombre d'alertes (12 px), symbole pause du chrono (13 px), « MANAGER » du logo (11 px). Les autres pages : 0 au premier écran (leurs déclarations sont dans les fiches, ou ne s'appliquent plus).
- **Non vu** : les fiches (Bibliothèque, projet, client, intervention, prospect), les menus « Plus », les fenêtres de dialogue ; la part exacte de déclarations mortes.

## Approches considérées

1. **Par écran, quatre lots** (**choisie par Carlos le 15/11/2026**) : chaque lot touche un groupe d'écrans, se recette sur leurs captures avant / après, et fait baisser le budget de ses fichiers ; le dernier lot finit à zéro.
2. Par fichier CSS, les plus gros d'abord : plus mécanique, mais un même écran change dans plusieurs lots et la recette s'éparpille.
3. Un seul lot : une recette sur des dizaines d'écrans, illisible.

## Découpage décidé

| Lot | Écrans | Ce qui est fait |
|---|---|---|
| **P5a** | Offres & Tarifs (liste, familles, fiche d'offre, éditeur du catalogue) | les 219 textes visibles et les déclarations de leurs fichiers (`commercial/catalog-workspace-v2.css`, `catalog-editor-v2.css`, la part catalogue de `commercial.css`) passent au plancher ; largeurs et retours à la ligne adaptés |
| **P5b** | Statistiques, Annuaire, Sites, Projets (liste), Prospection, Clients, Temps, en-tête | idem ; avatars et pastille d'alertes agrandis pour tenir 14 px ; cadran de l'horloge sans chiffres |
| **P5c** | Fiches : Bibliothèque, projet, client, intervention, prospect ; Accueil (F24) ; Interventions et Temps (F26) ; tout le reste | toutes les déclarations restantes, y compris celles qui ne s'affichent plus, jusqu'à **617 → 0** ; le test de budget devient « zéro » |
| **P5d** | Chiffres clés (F27) | un seul composant pour `KeyFigures` (`.aw-keyfigure`), les cartes de projet (`.project-keyfigure`) et les tuiles de l'Accueil ; fiche courte propre, avant code, car la disposition de l'Accueil peut bouger |

## Petits éléments décoratifs (décision de Carlos du 15/11/2026)

**14 px partout, sauf le logo** : les initiales des avatars et la pastille du nombre d'alertes passent à 14 px, leur forme est agrandie pour les contenir ; le cadran de l'horloge de Temps perd ses chiffres (les traits restent, l'heure est écrite en clair à côté) ; le mot « MANAGER » du logo fait partie du dessin de la marque (texte d'une image, hors budget CSS) et n'est pas touché.

## Règles communes aux quatre lots

- Relever à `var(--aw-font-functional)` (14 px) plutôt qu'écrire `14px` en dur ; retirer au passage `text-transform: uppercase` et `letter-spacing` des petits sur-titres (outil `outils-edition\css-raise-font.cjs`).
- Aucun `!important`, aucune couleur en dur ajoutés ; `!important` d'`ui-consistency-v2.css` au plus 86.
- Un texte relevé peut faire grandir sa boîte : **mesurer les cadres après** (défilement horizontal, textes coupés, éléments qui dépassent) aux deux tailles de fenêtre (1510 × 1030, 760 × 720 zoom 150 %).
- Test d'abord : le test de budget (`ui/fontFloor.test.ts`) baisse fichier par fichier ; un garde de source par lot pour les adaptations de mise en page.
- Aucune donnée, règle métier ni parcours modifiés ; un commit local par lot après la recette de Carlos.

## Hors périmètre

Styles AtoumWeb et Blanc, densités Compact et Confort + (fin de refonte) ; acompte par défaut (lot dédié) ; décisions F55 à F63 du relevé P6b.

## Preuves prévues (par lot)

Typecheck ; suite complète ; quatre scripts natifs sans option (72, 18/18, 25, 857 ; la typographie doit rester verte) ; `lot10` 59 ; budget en baisse (valeur exacte par lot) ; relevé du rendu réel des écrans du lot (`p5-releve`) : **0 texte visible sous 14 px** sur ces écrans ; captures avant / après dans `C:\DEV\Livrables\Cadrage-parcours\captures-p5a\` (puis `p5b`, …).

## Décisions de Carlos

Validées le 15/11/2026 par l'outil de question : découpage par écran en quatre lots (P5a, P5b, P5c, P5d) ; 14 px partout sauf le logo.

## Révisions

(aucune pour l'instant)

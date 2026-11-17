# P5d1 Chiffres clés (hors Accueil) : plan d'exécution

> `superpowers:executing-plans` (avec `test-driven-development`, `verification-before-completion`) ; `atoumweb-design` (extract, layout).

**But :** les six variantes hors Accueil (fiche projet, Maintenance, pack d'heures, intervention, rangée du bas de Statistiques, fiche client) passent par `KeyFigures` / `KeyFigureCard`.
**Fiche :** `docs/refonte/plans/2026-11-15-p5d-chiffres-cles-design.md` (décisions de Carlos du 15/11/2026).

## Interfaces (ui/KeyFigures.tsx)

- `KeyFigureItem` gagne `icon?: ReactNode` (rendue dans `<span className="aw-keyfigure-icon" aria-hidden="true">`, avant le libellé) et `tone?: 'success' | 'warning' | 'danger' | 'info' | 'accent'` (classe `aw-keyfigure--tone-{tone}`).
- La valeur porte la classe `aw-keyfigure-value` (repère durable pour les recettes ; la règle `.aw-keyfigure > span` reste).
- `KeyFigures({ items, ariaLabel, className?, children? })` : `className` s'ajoute à `aw-keyfigures` ; `children` est rendu après les cartes, dans la même grille.
- CSS (`ui/list-page.css`) : carte avec icône en deux colonnes (icône, contenu) ; tons par jetons `--aw-{tone}-soft-bg` et `--aw-{tone}-soft-fg` ; aucune couleur en dur, aucun `!important`, aucun texte sous 14 px.

## Écrans

| Écran | Fichier | Particularité conservée |
|---|---|---|
| Fiche projet, Commercial et Résumé | `projects/ProjectCommercialTab.tsx`, `ProjectSummaryTab.tsx` | « Prérequis manquants » cliquable quand il en manque (`onAction`, « ouvrir l'onglet Prérequis ») |
| Maintenance | `operations/MaintenancePanel.tsx` | glyphes ✓ Ⅱ ▤ € en icône |
| Pack d'heures | `operations/HourPacksPanel.tsx` | « Restant » en ton `warning` si négatif |
| Intervention | `operations/OperationsPage.tsx` | le champ « Estimation actuelle » passé en `children` |
| Statistiques, rangée du bas | `statistics/StatisticsPage.tsx` (`Snapshot`) | icône, navigation (`onAction`) |
| Fiche client, Interventions | `crm/ClientOperationsTab.tsx` | icônes ; ordre libellé puis valeur ; « — » si indisponible |

Classes et règles CSS des anciennes variantes retirées après preuve (règle F) ; la recette `check-client-interventions.cjs` vise `.client-operations-kpis .aw-keyfigure-value` (règle H).

### Tâche 1 : captures « avant » (fiche projet Commercial et Résumé, Maintenance, un pack, une intervention, Statistiques, fiche client onglet Interventions ; deux tailles) dans `captures-p5d1\avant\`.
### Tâche 2 : composant (test d'abord dans `ui/p5d1Wiring.test.tsx`), puis chaque écran (test d'abord : `<KeyFigures` présent, ancienne classe absente), puis CSS mort retiré et recette adaptée ; typecheck.
### Tâche 3 : captures « après », mesures (débordements, petits textes : 0), adaptations éventuelles avec garde.
### Tâche 4 : preuves (suite, natifs, `lot10`, `check-client-interventions`, budget 12, `!important` 86, empreinte), recette de Carlos, clôture, commit local.

## Révisions

(aucune pour l'instant)

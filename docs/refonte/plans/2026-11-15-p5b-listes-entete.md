# P5b Listes et en-tête : petits textes au plancher, plan d'exécution

> **Pour l'agent qui exécute** : `superpowers:executing-plans` (avec `test-driven-development` et `verification-before-completion`) ; skill `atoumweb-design` (typeset, layout, adapt).

**But :** plus aucun texte visible sous 14 px sur Statistiques, Annuaire, Sites, Projets (liste), Prospection, Clients, Gestion des temps et l'en-tête (152 mesurés au premier écran le 15/11/2026), sans débordement.

**Approche :** même méthode que P5a (`css-raise-font.cjs` vers `var(--aw-font-functional)`), fichier entier quand le fichier appartient aux écrans du lot, règles précises dans les feuilles partagées ; trois adaptations décidées par Carlos (14 px partout sauf le logo) : initiales d'avatar à 14 px, pastille du nombre d'alertes à 14 px agrandie, cadran de l'horloge de Temps sans chiffres (des traits à la place).

**Fiche :** `docs/refonte/plans/2026-11-15-p5-petits-textes-design.md` (validée ; exécution sans résumé du plan à la demande de Carlos).

## Contraintes globales

Celles de P5a : Noir / Confort ; aucun `!important`, aucune couleur en dur ajoutés (`#ad263b` de la pastille existe déjà, non touché) ; budget à la baisse seulement ; copie jetable ; aucune donnée ni règle métier ; un commit local après la recette de Carlos.

## Points de vigilance (Review Focus)

1. Pastilles de relation (« Client ») et cellules de l'Annuaire : pas de coupure, pas de débordement de colonne.
2. Onglets de contenu de Sites et métriques : pas de passage sur deux lignes à 1510 px.
3. Tableau de Projets : noms de client et pourcentages à 14 px dans leurs colonnes, sans défilement horizontal nouveau.
4. Pastille d'alertes de l'en-tête : le nombre reste lisible et dans le bouton (deux chiffres compris).
5. Fenêtre étroite (507 px) : aucun défilement horizontal nouveau sur les sept écrans.

## Fichiers et règles

| Fichier | Portée |
|---|---|
| `statistics/StatisticsPage.css` | fichier entier (18) |
| `bridge/BridgeSitesPage.css` | fichier entier (42) |
| `directory/DirectoryPage.css` | fichier entier (7) |
| `crm-identity.css` | fichier entier (3) |
| `crm/client-list-quick-v2.css` | fichier entier (10) |
| `ui/workspace-header.css` | `.aw-header-alert-count` (1), pastille portée à 20 px |
| `time.css` | `.timer-*`, `.time-table *`, `.time-clock-mark` (9) ; les règles `.project-time-*` (fiche projet) restent pour P5c |
| `time/TimePage.tsx` | les quatre `time-clock-mark` deviennent des traits sans texte |
| `projects.css` | `.project-table th`, `td`, `td > small`, `.project-progress-cell > span` (4) |
| `crm.css` | `.module-toolbar > div:first-child`, `.link-button` (2) |
| `prospect-workflow.css` | `.prospect-view-switch button span` (1) |
| `ui/p5bWiring.test.ts` (nouveau) | gardes |

Budget attendu : **570 → 473** (−97).

### Tâche 1 : captures « avant »
- [ ] Outil `p5b-captures.txt` (comme `p5a-captures.txt`) : les sept pages (haut de page), Sites avec une page ouverte, Annuaire vue Contacts, en-tête ; mesures `MESURE`, nombre de petits textes, hauteur des cadres ; deux tailles ; `captures-p5b\avant\`.

### Tâche 2 : relever (test d'abord)
- [ ] `p5bWiring.test.ts` : 0 déclaration sous 14 px dans les cinq fichiers entiers ; aucune des règles ciblées ci-dessus sous 14 px ; `.aw-header-alert-count` sans taille en px sous 14 ; `TimePage.tsx` ne contient plus `>12</span>` dans le cadran. Le voir échouer.
- [ ] `css-raise-font.cjs` ; cadran : retirer les chiffres du TSX, `.time-clock-mark` dessine un trait (2 × 8 px, `var(--text-muted)`, sans `font-size`) ; pastille : `min-width` et `height` 20 px. `eol-report.cjs`, typecheck, test vert, `gen-font-baseline.cjs` (attendu 473, uniquement des baisses).

### Tâche 3 : mesurer et adapter
- [ ] Captures « après » ; attendu 0 petit texte visible sur les écrans du lot (hors « MANAGER » du logo) et aucun débordement nouveau ; corriger chaque défaut mesuré, garde de source d'abord.

### Tâche 4 : preuves, recette, clôture
- [ ] Suite complète ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `03e-directory` 206 ; `home-shell-lot1` 96 ; `!important` 86 ; empreinte identique. Recette de Carlos, puis registre, statut, passation, mémoire, un commit local.

## Révisions

(aucune pour l'instant)

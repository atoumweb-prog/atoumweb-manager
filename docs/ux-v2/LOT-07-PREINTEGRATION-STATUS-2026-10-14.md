# Lot 07 — état de pré-intégration contrôlée (14/10/2026)

**Ce document ne valide pas tout le lot 07. Aucune fusion autorisée ou exécutée.**

## Périmètre réellement validé

- PR #111 — 07A, HEAD `e71f9ec02ff6c7e1acb19bdebe08c516e1ca5c92` : 1 042/1 042 Vitest, 73/73 scénarios natifs, 65/65 composition, 183/183 UX-01, selon la recette Windows Codex ; PR toujours draft.
- PR #114 — premier incrément 07B, HEAD `20b81d830b631d2f9072a0db659089adc17b198e` : affichage et filtre commercial Projet, source Devis, navigation aller-retour via routeur central ; PR draft.
- PR #116 — **branche de convergence/validation, non candidate à fusion directe**. Dernier SHA **entièrement vert confirmé :** `198e21ce884e5058679cf1b601d7074861a9c599`, [CI quality](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38597477034) et [4 jobs Windows](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38597476979) : contrôle de composition 07A/07C, retour Projet ↔ Devis 07B, réutilisation guidée, exports/Bridge 07E. Les scénarios réels Electron utilisent %TEMP%, le bouton d'origine de Devis, l'identité du Projet et du Site sélectionné ; aucune instance WP réelle touchée.
- Depuis le dernier SHA vert, protections synchrones contre les doubles clics Site/Page/chrono et recette de création Site en double clic ajoutées (commits `3d1701b`, `e229312`, `e4de586` et `734e0a9`). **Pas encore validées comme vertes sur le dernier SHA :** ne pas hériter abusivement du résultat de `198e21c`.
- L'aller-retour Projet → Devis → Projet a été vérifié par clic **réel**, garde de brouillon, confirmation/refus, focus, restauration onglet Commercial, recherche/filtre, puis sélection du deuxième Site. Le sélecteur d'identité Projet a été corrigé pour fonctionner hors onglet Production.

## Matrice par sous-lot

| Sous-lot | État réel | Portes restantes |
| --- | --- | --- |
| 07A | Recettes de protection de composition validées sous Electron Windows sur candidat combiné | Captures et inspection humaine finale, convergence avec les branches d'autres lots |
| 07B | Retour Devis/Projet et contexte d'atelier validés ; recherche et filtres, onglet et Site préservés | Parcours exhaustifs fiche/production/prérequis/temps ; dépendances et intégration ordonnée |
| 07C | Services métier blueprint existants ; tests ciblés présents, non équivalents à recette V2 exhaustive | Révisions de devis, remplacement atomique, idempotence, rollback, historique humain à prouver |
| 07D | Atelier compositions sous Electron : 65 contrôles natifs validés ; Undo/Redo local déjà présent dans l'éditeur ; protection de sélection Site/Page en cours de stabilisation | Rejouer le test des doubles clics sur SHA final, vérification manuelle responsive et thèmes |
| 07E | Réutilisation guidée Electron verte, tests dédiés de paquets/provenance verts | Couvrir variantes complètes, conflits et revue humaine de candidats |
| 07F | Bridge exports/snapshots validés par suites unitaires et intégrations isolées | Démo WordPress/Workbench, limites Divi, absence de publication WP automatique confirmée |
| 07G | Recettes Windows indépendantes 07A/B/D/E vertes sur `198e21c` | R07G-01 à R07G-27 non toutes démontrées, convergence, SQLite et captures sur SHA final |

## Stratégie de livraison

1. Ne pas fusionner la PR #116 : elle contient un assemblage de validation et des scripts de test non encore promus en candidat de livraison.
2. Conserver la PR #111 séparée et la PR #114 séparée jusqu'à une décision d'intégration ordonnée. Le fichier commun `ProjectsPage.tsx` a été combiné dans #116, sans preuve que le futur merge Git automatique le reproduira sans conflit.
3. Pour clôturer **07B**, compléter les scénarios non encore couverts de fiche/production/prérequis/temps ; les retours Devis, onglet, filtres et Site sont déjà attestés par recette réelle.
4. Développer/auditer et recetter explicitement 07C, 07D, 07E et 07F selon le référentiel #82 ; ne pas considérer 07A+07B comme lot 07 complet.
5. Exécuter 07G sur le **SHA final du candidat de livraison**, avec les 27 scénarios évalués sans omission silencieuse. Ensuite seulement présenter une demande explicite de fusion de l'ensemble dans `main`.
6. Ne pas toucher à Validation-MSI ni à un WordPress Client réel.

## Risques et décisions à suivre

- E72/E153 : progression du Prospect `new` lors de la création d'un Devis, prérequis de conformité du flux commercial.
- E216–E221 : dirty registry, remplacements atomiques, historisation locale, Bridge Workbench, différences Divi et contrôle de publication (hors périmètre automatique).
- Dépendances et concurrence des lots 04/05/06/08/09 : vérifier `main` au moment d'intégrer, pas à partir du seul SHA de base 07A/07B.

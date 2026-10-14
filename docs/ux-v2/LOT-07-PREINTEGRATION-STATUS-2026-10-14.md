# Lot 07 — état de pré-intégration contrôlée (14/10/2026)

**Ce document ne valide pas tout le lot 07. Aucune fusion autorisée ou exécutée.**

## Périmètre réellement validé

- PR #111 — 07A, HEAD `e71f9ec02ff6c7e1acb19bdebe08c516e1ca5c92` : 1 042/1 042 Vitest, 73/73 scénarios natifs, 65/65 composition, 183/183 UX-01, selon la recette Windows Codex ; PR toujours draft.
- PR #114 — premier incrément 07B, HEAD `20b81d830b631d2f9072a0db659089adc17b198e` : affichage et filtre commercial Projet, source Devis, navigation aller-retour via routeur central ; PR draft.
- PR #116 — **assemblage temporaire** des deux, HEAD `cb3f407ced3ecc780839a3784a4a930781aa3119` : workflows [quality #38578955128](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38578955128) et [Electron #38578955210](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38578955210) **SUCCESS** sur le SHA exact ; TypeScript, Vitest, recette 07A native sur arbre combiné, 10 contrôles statiques de navigation, recette Electron native retour Projet avec garde du brouillon et focus.
- La recette native actuelle **déclenche le même événement de navigation que le bouton Projet, mais ne clique pas directement ce bouton sur un Projet possédant effectivement le Devis source**. Elle ne prouve donc pas le parcours complet par tous les contrôles UI réels.

## Matrice par sous-lot

| Sous-lot | État réel | Portes restantes |
| --- | --- | --- |
| 07A | Validé techniquement localement et intégré dans candidat CI | Recette visuelle humaine globale, intégration séparée |
| 07B | En développement, incrément navigation contrôlé sous Electron | Couvrir totalité liste/fiche/production/prérequis/timer, test clic réel Projet → Devis, fermeture/retour sur filtre et nœud |
| 07C | Cadré, services existants non équivalents à recette V2 | Conflits de révision, blueprint idempotent, rollback, acceptation courante et remplacement atomique |
| 07D | Cadré avec protections 07A sur composition | Undo/Redo local, HTML/CSS/JS, destination exacte, protections multi-page et contrôle 3 thèmes × 3 densités |
| 07E | Cadré, réutilisation V1 existante | Copie/variante avec provenance et validation humaine, absence de modification globale |
| 07F | Cadré, intégration Manager/Bridge existante | Export/idempotence/retour d'observation et contrôle du périmètre Workbench ; publication WP exclue sans projet dédié |
| 07G | Partiel : première recette d'intégration 07A+07B verte | Matrice R07G-01 à 27 non intégralement exécutée ; bout-en-bout, temps, Blueprints, Bridge, rollback, captures et contrôle humain |

## Stratégie de livraison

1. Ne pas fusionner la PR #116 : elle contient un assemblage de validation et des scripts de test non encore promus en candidat de livraison.
2. Conserver la PR #111 séparée et la PR #114 séparée jusqu'à une décision d'intégration ordonnée. Le fichier commun `ProjectsPage.tsx` a été combiné dans #116, sans preuve que le futur merge Git automatique le reproduira sans conflit.
3. Pour clôturer **07B**, compléter ses 16 scénarios, en commençant par le clic réel Projet → Devis et les pertes de contexte des sous-onglets.
4. Développer/auditer et recetter explicitement 07C, 07D, 07E et 07F selon le référentiel #82 ; ne pas considérer 07A+07B comme lot 07 complet.
5. Exécuter 07G sur le **SHA final du candidat de livraison**, avec les 27 scénarios évalués sans omission silencieuse. Ensuite seulement présenter une demande explicite de fusion de l'ensemble dans `main`.
6. Ne pas toucher à Validation-MSI ni à un WordPress Client réel.

## Risques et décisions à suivre

- E72/E153 : progression du Prospect `new` lors de la création d'un Devis, prérequis de conformité du flux commercial.
- E216–E221 : dirty registry, remplacements atomiques, historisation locale, Bridge Workbench, différences Divi et contrôle de publication (hors périmètre automatique).
- Dépendances et concurrence des lots 04/05/06/08/09 : vérifier `main` au moment d'intégrer, pas à partir du seul SHA de base 07A/07B.

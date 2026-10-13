# Consolidation GitHub 01A → 01B → 01C — proposition du 12/10/2026

**Reprise de consolidation après93 :** voir le [bilan86–93](UXV2_CONSOLIDATION_86_93_PREPARATION.md), qui actualise lesHEAD/simulations, analyse le timeout20s de main etétend le plan aux huitPR. Aucun trigger/merge/retarget exécuté. Quota/Stopusage restentàconfirmer ; les6runs de principe ne sont ni un quota acquis ni l'autorisation d'exécuter16runs.

**Plan seulement, aucune fusion ni CI déclenchée.** Main distant vérifié : `07dde9c85dab337ee0ed3a5a92034a139d7ebad2`. Recette humaine globale différée ; tests techniques et sûreté métier restent obligatoires.

**Actualisation12/10 après01D.4 :** l'utilisateur autorise au maximum les six CI du plan, mais demande explicitement de différer tout lancement tant que quota gratuit/protections budgétaires pas confirmés. Budget0USD/StopusageYes historiquement vérifié ; quota pas encore vérifié. Jeton actuel : API usage facturation inaccessible (scopeuser absent), Actionsenabled/all. Aucune modification de jeton/budget ni tentative de contournement. Candidate86 toujours7f5dbbf2a462f652b32dd2a2c08a8039f516b778, draft/baseMain, sans check. Main toujours07dde9c8, cibles/HEAD87–88 inchangés. Prochaine actionCI : confirmation de quota puis relectureHEAD/arbres/droits, un seul trigger si nécessaire ; résultat réel à présenter avant demande de merge. **Aucun run consommé dans cette campagne, aucun merge/retarget exécuté.** Préserver les nouveaux commits01D dePR89 ; le port Prospection reste proposé séparément.

## Chaîne actuelle vérifiée

| PR | Source / HEAD | Cible | Avance / retard sur sa cible | Diff propre |
| --- | --- | --- | --- | --- |
| #86 /01A | feature/ux-v2-lot01a-typography-v1 /7f5dbbf2a462f652b32dd2a2c08a8039f516b778 | main | 29/0 | 9 fichiers, +1021/−2 |
| #87 /01B | feature/ux-v2-lot01b-components-v1 /2d1ddb7604422850df4921e10250b6186a0094b4 | source86 | 48/0 | 27 fichiers, +2135/−31 |
| #88 /01C | codex/ux-v2-lot01c-panels-v1 /0fab2ae50b029e3a0734d6d78833686f91224295 | source87 | 4/0 | 12 fichiers, +387/−0 |

Toutes draft et MERGEABLE au pointage. Chaque cible est ancêtre de sa source. Simulations **git merge-tree --write-tree** sans index/checkout/commit de fusion : aucun conflit ; arbre simulé identique à celui de la source dans chaque cas. Aucun fichier appliqué à main. Ces constats seront à recontrôler avant exécution si une branche avance.

Les checks GitHub des trois HEAD sont absents : les preuves locales à leurs SHAs ne sont pas une CI verte. Le dépôt est privé, merge commits autorisés, suppression automatique des branches désactivée ; **main est actuellement non protégée** selon l'API. Nous appliquons donc un verrou de procédure : accord humain, HEAD vérifié, contrôles réels, aucune fusion malgré un simple MERGEABLE. Aucun paramètre du dépôt modifié.

## Ordre recommandé, sous autorisation

1. **#86 → main.** Figer son HEAD, relire le diff et valider le candidat contre le main courant. Après accord de CI et vérification du quota gratuit/budget bloqué, un commit vide sans skip si nécessaire déclenche une seule CI quality sur la PR. Contrôler installation, typecheck, suite et logs, HEAD source et checkout réellement testé. Passer ready et fusionner par merge commit normal uniquement après accord ; message de merge sans `[skip ci]`. Vérifier les deux parents, le contenu résultant et le run automatique main.
2. **#87 → main après #86.** Conserver la branche86. Retargeter87 explicitement vers main ; vérifier le diff propre01B (aucun réaffichage trompeur de tout01A). Le merge commit main de86 et tout nouveau commit CI de86 ne seront pas nécessairement ancêtres de87 : intégrer origin/main par **merge normal**, pas rebase/squash, si nécessaire. Si main n'a pas d'autres changements, le contenu doit rester celui01B validé. Résoudre toute divergence explicitement, contrôler localement puis pousser selon l'autorisation CI. Une CI PR verte, accord humain, merge normal, vérification main et de son run automatique.
3. **#88 → main après #87.** Même procédure : garder87, retargeter88, intégrer le nouveau main normalement si nécessaire, vérifier que seul le périmètre01C reste dans la PR et que les contenus hérités sont conservés. Contrôler atelier, geste, préférences et UX-01 avant CI/merge autorisés. Vérifier le SHA final main et la CI post-merge.
4. **Branches suivantes.** 01D reste empilée sur88 pendant cette préparation. Après consolidation, retargeter sa PR vers main et intégrer main normalement si nécessaire, en préservant ses travaux. Pas de suppression de86/87/88 tant que leurs PR enfants ne sont pas reciblées. #82 reste une PR documentaire draft distincte, hors de ce plan de fusion logicielle.

Un main mis à jour peut ne pas être un ancêtre Git d'une branche enfant alors que son contenu est déjà présent : le merge normal d'actualisation règle cette différence sans rejouer ni réécrire les anciens commits. Le diff après retarget et la revue des arbres doivent confirmer la conservation des fonctions, pas seulement les comptages.

## Déclenchements de CI à anticiper

Le workflow actuel est Windows2022 /Node24 /npmci /typecheck /suite deux workers. `push` cible main et quelques branches historiques ; `pull_request.branches` filtre la **cible**, pas la source. 87/88 actuellement empilées ne sont pas ciblées par ce filtre. Le simple passage ready ou une modification de cible ne doit pas être pris pour une validation exécutée : les activités PR par défaut sont opened/synchronize/reopened. Prévoir un événement autorisé et vérifier le run créé, sans double dispatch ou rerun.

Un commit source sans skip après reciblage vers main peut déclencher la CI PR ; une fusion main sans skip déclenche la CI push main. Chemin conservateur : **3 validations PR +3 runs post-merge main**, hors reruns (jamais automatiques). Autoriser ces exécutions avant les actions qui les provoquent ; aucun changement de budget/paiement. Si quota/permission empêche l'exécution, arrêter l'étape et présenter le blocage. Les derniers messages `[skip ci]` ne doivent pas être propagés au message de merge ni interprétés comme un check réussi.

La CI `pull_request` avec checkout par défaut teste généralement la référence de merge synthétique ; relever le HEAD source **et** le commit checkout/arbres dans les preuves. Après fusion, la CI push main contrôle le véritable merge commit main. Ne pas rerun un ancien SHA pour prétendre valider une nouvelle combinaison.

Sources officielles : [événements et références testées](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request), [marqueurs skip et checks pending](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs). Workflow inspecté sans modification.

## Contrôles et risques

- **01A :** cascade CSS globale, Compact14/Confort16/Confort+18, tailles/focus et neuf configurations ; références du lot01A et écrans historiques.
- **01B :** aides, actions async, garde Abby dirty/pending du bon devis, sous-éditeurs et refus de copie. Références801 tests et ateliers datés, à recontrôler sur le vrai candidat publié.
- **01C :** même éditeur/onglet/scroll, refus UX-01, largeur immédiate/une écriture finale, reset/module/erreur de préférence ; références810 tests et66 contrôles datés.
- **Chaque étape :** typecheck/suite complète sur fixtures, migrations1–66/intégrité/FK sur bases temporaires, aucun changement historique/snapshot, aucun artefact dans Git. Tests supplémentaires seulement si résolution de conflit ou risque nouveau. Pas de Validation-MSI ni recette humaine globale intermédiaire.
- **Conflits futurs :** surtout fichiers de suivi partagés et CSS si main avance. Aucun conflit actuel ; ce n'est pas une garantie future. Un risque de perte de saisie/mutation incorrecte stoppe l'étape.
- **Sûreté Git :** ne pas cumuler trois merges avant les vérifications ; ne pas effacer une branche mère ; ne pas utiliser squash/rebase pour cette chaîne ; ne pas retirer une exigence CI pour forcer la fusion.

**Décision à obtenir :** accord sur cette séquence, sur les CI hébergées prévues et sur les fusions (global ou par étape, explicitement). Rien de cela n'est exécuté par la publication de ce plan.

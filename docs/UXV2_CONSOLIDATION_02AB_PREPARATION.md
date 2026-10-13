# Préparation de consolidation UX/UI V2 — 02A / 02B

13/10/2026. Rapport local soumis à autorisation, sans publication, PR ou CI GitHub. Référentiel #82 `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`, LOT-02A-RAIL-NAVIGATION et LOT-02B-ENTETE-RACCOURCIS ; E42 conservée.

## Références contrôlées

| Référence | SHA |
|---|---|
| origin/main après #95 / CI #661 SUCCESS | `a01c60d9b92c249ce3f8495a634e924eb71fed9c` |
| #92, ouverte draft, base #91 | `893b40bca5714c2cf595ec8643558b479d40fdbb` |
| #93, ouverte draft, base #92 | `f7e2ae9b934853a34994fcbf3ece577f8fb0e88c` |
| #91, base historique commune | `765f66dbce2b08d2624e496c7dd8a5555edc8e20` |
| #90, inchangée | `4653e58cfc6bfa338d34ece98fd9cb945d020656` |

Working tree initial propre sur codex/fix-95-native-buffer-assertions@9accc3e. Références récupérées par fetch ; aucune branche originale modifiée. Les résultats #661 (873/873) et les anciennes recettes 02A/02B sont des preuves antérieures, distinctes des exécutions ci-dessous.

## Historique et chevauchements

#91 est déjà ancêtre de main ; #92 ajoute cinq commits, #93 en ajoute huit à #92. Comparaison symétrique main/#92 : 11 commits uniquement main, 5 uniquement #92 ; main/#93 : 11/13. Les onze commits de main comprennent les consolidations et corrections intervenues après le départ des ateliers : ne pas remplacer main par la branche #93 ni perdre Échap/Buffer.equals.

Le seul propriétaire partagé nouveau est `src/shared/workspaceVisualPreferences.ts` : 02A ajoute une clé rail et 02B une clé header, avec schémas et whitelist ; le stockage settings workspace 01F reste la source unique. Aucun schéma SQLite ni migration supplémentaire. Les deux clés sont indépendantes ; le bandeau Bibliothèque reste local, non sauvegardé comme une troisième préférence. Ni note, query, selectedId, session ni état flyout dans les préférences.

Le diff groupé vers main contient 24 fichiers, +904/-1 : composants/ateliers/CSS préfixés, deux types/tests partagés, adaptateur visuel, bancs/lanceurs et documentation. Les 17 routes et App.tsx ne changent pas. GlobalTimer, GlobalSearch, GlobalClock privé, IPC, services métier/commerciaux, migrations, workflow, timeouts et hook RPC sont identiques à main.

## Simulations Git réellement réalisées

`git merge-tree --write-tree` exécuté sans mutation de main ni des sources. Les trois essais détectent exclusivement un conflit de contenu dans PROJECT_STATUS.md. Aucun conflit de code.

| Simulation | Commit local de simulation | Arbre résolu |
|---|---|---|
| main + 02A seul | `b52659df7cc8c89b9e33fd854590cbdf89dec380` | `e4468c0965ff6740adfebea0b6231c5d768a7693` |
| main + 02A+02B | `83127f07cebf045ba98629582d866f2e0e92fcc5` | `b462dce8f6944b6ec9cf426f299ac8676cbafdef` |
| simulation 02A puis #93 | arbre brut `e5b4c22b818b108416ea09ac7ee93cd9074e7791` | conflit documentaire ; tous les autres fichiers identiques au groupé |

Les commits locaux ont été produits avec commit-tree sur un index temporaire sous outputs, parents main/source : objets de simulation uniquement, aucune fusion de PR. La résolution locale garde les deux insertions historiques du journal, sans suppression d'entrée ni sélection automatique d'un côté. Les fichiers communs hors conflit sont fusionnés par Git. La branche locale `codex/prep-consolidation-ux-v2-02ab` a été créée au commit de simulation groupé pour exécuter les tests sur un arbre propre et identifiable. Pas de push, rebase, squash, force-push ou suppression.

Contrôles `git diff --quiet` : scripts/fixtures/01ef-escape-scenarios.cjs, FormFeedbackWorkshop, TableWorkshop, FoundationWorkshop, registre renderer UX-01, main/unsaved, restore.ts, restore.test.ts et restoreBinaryEquality.test.ts strictement identiques à main. Les 61 assertions Échap, les 14 comparaisons Buffer.equals et les six contrôles d'équivalence sont conservés. Aucun retour au code ancien des parents.

02A seul a été simulé et comparé ; il n'a pas fait l'objet d'une seconde suite complète sur son propre arbre. Les validations runtime portent sur le groupé, qui est le scénario recommandé.

## Exécutions Windows locales sur le candidat groupé exact

Toutes les lignes suivantes ont été exécutées dans cette mission sur `83127f07cebf045ba98629582d866f2e0e92fcc5`, arbre `b462dce8f6944b6ec9cf426f299ac8676cbafdef`, avant ajout du présent rapport. Ateliers avec manifestes dirty:false. Résultats non repris des rapports précédents.

| Contrôle | Résultat réel |
|---|---|
| npm run typecheck | OK, sortie 0 |
| npm test -- --maxWorkers=2 | 893/893, 97/97 fichiers, 82,38 s, sortie 0 ; aucune erreur RPC/non gérée |
| Ciblés navigationRail/headerPresentation/workspaceVisualPreferences/restore/restoreBinaryEquality | 69/69, 5 fichiers, 5,49 s |
| Restaurations dans la suite complète | 35/35, fichier 3,932 s ; DELETE 345 ms ; durées WAL/A→B non publiées individuellement par ce reporter |
| Six contrôles binaires | 6/6, 108 ms dans la suite complète |
| Atelier 02B | 158 + 9 = 167/167, deux processus TEMP, 18 captures synchronisées |
| Atelier 02A | 117 + 8 = 125/125, deux processus TEMP, 9 captures synchronisées |
| Atelier 01F avec régressions Échap | 123 + 14 = 137/137 ; message 01EF_ESCAPE_REGRESSIONS passed |
| UX-01 natif --lot-b --lot-c --review | 183/183, trois thèmes, failed:[] |
| UX-01 sections contractuelles (sans flags, contrôle supplémentaire) | 33/33, failed:[] |

Les 893 tests correspondent aux 873 de main plus 10 rail et 10 header. Le résultat ancien #93 887/887 était antérieur aux six contrôles Buffer.equals ; ne pas le confondre avec le total actuel.

Les scénarios Electron vérifient : E42/17 références, navigation par garde avant transition, Rester par défaut, pending, favoris et reset refusé/accepté, mode Projet contextuel sans écriture durable, indépendance des huit combinaisons header/rail/bandeau, session/composant TEST unique, même fiche/brouillon lors des replis, focus Options/recherche/chrono et aide imbriquée, frappe input/textarea/contenteditable non interceptée, stockage refusé et reprise au deuxième processus. Les 61 régressions 01E/F contrôlent les comptes exacts de confirmations, composants cachés restant montés, textes/identités conservés, réponses tardives, Rester/Quitter et onglets.

02A : neuf thèmes/densités, 500/850 px et zoom 100/125/150 ; 02B : neuf variantes développé/compact, 620/1000 px et zoom 100/125/150. Inspection visuelle directe de deux captures (02B AtoumWeb/Confort compact, 02A Noir/Compact), pas une nouvelle recette humaine globale ni une certification WCAG.

Bases/profils uniquement TEMP. Bancs 02A/02B/01F : comparaison des tables hors settings sans mutation ; intégrité SQLite OK, FK vide, migrations 1–66 vérifiées ; nettoyages confirmés. UX-01 : migrations/intégrité/FK et nettoyage confirmés. Les refus de stockage et conflits serveur injectés affichés dans les logs sont attendus et assertés, pas des échecs masqués. Aucune base Validation-MSI ouverte/copied/inspectée.

Preuves locales ignorées sous outputs : prep-consolidation-02ab-simulations.json, prep-02ab-typecheck.log, prep-02ab-full.log, prep-02ab-targeted.log, prep-02ab-native-02a.log, prep-02ab-native-02b.log, prep-02ab-native-01f.log, prep-02ab-native-ux01-all.log et prep-02ab-native-ux01.log. Captures/manifestes : outputs/ux-v2-lot02a-reference et outputs/ux-v2-lot02b-reference. Elles ne seront pas incluses dans le commit.

## Risques et corrections préalables

1. Conflit documentaire réel : les insertions historiques ont été conservées dans la simulation. Refaire ce choix et vérifier l'arbre lors de la préparation de la branche de publication ; aucune correction de code préalable démontrée nécessaire.
2. Les ateliers ne sont pas montés dans App.tsx. Le chrono TEST du header et celui du rail restent distincts du véritable GlobalTimer ; ce n'est pas une intégration du chrono, recherche ou navigation métier.
3. Risques hérités confirmés par lecture de code : GlobalSearch Escape ne consomme pas l'événement ; ProjectsPage, Bibliothèque et Bridge ont des listeners window susceptibles de traiter le même événement ; édition de métadonnées Bibliothèque peut être effacée au closeDetail. Ces collisions globales ne sont pas reproduites/corrigées dans cette préparation. Leur qualification native reste bloquante avant raccordement métier, pas avant consolidation d'ateliers isolés.
4. Pointerdown extérieur du vrai GlobalTimer : qualifier le repli et le maintien de ses dialogues avant 02B.5. Aucune mutation TimeService via préférences ; session réelle non recettée ici.
5. Dimensions/logo/pictogrammes provisoires, clavier OS/menu packagé et lecteur d'écran non certifiés. 02B.5/02B.6 et 02C restent à faire ; aucun nouveau raccourci global attribué.
6. Les documents historiques 02A/02B et certains journaux mentionnent encore main31167754 / #90-91 non fusionnées à leur date. Garder ces preuves historiques et s'appuyer sur ce rapport pour l'état actuel ; ne pas réécrire les anciens résultats.
7. Tout changement futur de main/#92/#93 invalide cette préparation et exige une nouvelle comparaison avant publication.

## Scénario recommandé et autorisations distinctes

**Consolider 02A et 02B ensemble au périmètre composants/ateliers/audit.** L'empilement est linéaire, 02B réutilise NavigationRail et son adaptateur, les deux simulations ont le même contenu de code que le groupé, et les interactions sont testées ensemble. Une intégration séparée impose deux cycles et le même conflit documentaire sans sécuriser davantage le pilote actuel.

Après validation humaine du présent rapport seulement :

1. Recontrôler les refs, créer une nouvelle branche de consolidation depuis #93, actualiser par merge commit normal de main sur cette seule branche et résoudre le journal en gardant les deux historiques. Préserver les sources #90–93. Comparer le code résultant au candidat testé ; tout changement de code exige des tests adaptés. Le rapport/documentation ajouté après les tests doit être identifié comme tel.
2. Publication normale et une PR draft unique vers main, sous autorisation spécifique de publication et de CI. La branche codex n'est pas dans le filtre push actuel ; l'ouverture de la PR vers main déclenche quality (pull_request:opened), sans dispatch. Un HEAD sans skip ci est nécessaire ; ne pas contourner les contrôles. Ne pas lancer en plus une CI manuelle.
3. Une seule CI candidate Windows 2022/Node 24/npm ci/typecheck/893 tests/deux workers, incluant restaurations/RPC. Les ateliers Electron locaux ne sont pas exécutés par ce workflow et doivent rester explicitement distingués.
4. Après SUCCESS et autorisation de fusion distincte : Ready for review, merge commit normal, sans suppression/retarget des sources, puis une seule CI post-fusion push main. Arrêt au premier échec, aucun rerun automatique.

**Minimum recommandé : deux CI, candidate + post-fusion** (contre quatre si séparées). Aucune de ces actions de publication, PR, CI ou fusion n'est effectuée par cette préparation.

# CONSOLIDATION 02A / 02B — PRÊTE À SOUMETTRE À VALIDATION

Verdict limité au socle et aux ateliers déjà autorisés, sans clôture de l'intégration métier 02B et sans démarrage de 02C. main et PR90–93 inchangés, aucune facturation/workflow/donnée réelle modifiés. Attendre l'autorisation avant toute publication.

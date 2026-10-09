# CI #84 — Analyse ciblée des trois timeouts de fixtures

Date : 09/10/2026. Branche `codex/fix-ci-windows-hosted`, diagnostic depuis `1b069575`, correctif local `5a175eb`. Publication ensuite autorisée avec un HEAD documentaire [skip ci], sans réécriture du correctif et sans nouveau run GitHub Actions. Aucune fusion ni ouverture de Validation-MSI.

## Échec GitHub constaté

[Run 37934890745](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37934890745), Windows hébergé 2022, deux workers, Electron 44.3.0 / Node 24.20.0 : typecheck OK ; **692/695 tests réussis**, trois timeouts à **5 000 ms** ; job 4 min 45 s, Vitest 222,02 s.

| Test | Temps GitHub observé | Temps local avant correction (mêmes tests) | Temps local après correction |
| --- | --- | --- | --- |
| OperationalRecipeService : deux sessions indépendantes, fixture déterministe | 55,939 s | 2,173 s | 0,445 s |
| Histoire : préparation / conservation / replay / rollback | 26,352 s | 1,137 s | Environ 0,24 s (fichier entier 0,543 s) |
| Histoire : moteur staging / Essentiel / Grand Jour / actions et temps inchangés | 27,487 s | 1,128 s | 0,301 s |

Les trois tests existent et restent inchangés. Aucune assertion métier en échec n’est signalée dans leurs logs CI ; ils dépassent le délai. Cela ne démontre pas leur succès sur ce runner : il faudra une nouvelle validation réelle après autorisation.

## Cause et limites de l’analyse

`createOperationalRecipeFixture` appliquait les migrations réelles puis insérait les références sur une base SQLite disque. Le profilage local des vrais appels de l’adaptateur montre **176 écritures en autocommit et 68 fins de transactions/savepoints disque** pour une fixture actuelle (163 autocommit pour la variante historique). Le scénario des deux sessions reconstruit deux bases : 352 autocommit et 138 fins de transactions/savepoints, dont deux frontières de preview.

Ces petites écritures durables en série dépendent de la latence du stockage. Localement, construction de fixture ~0,85–1,00 s, dont ~0,5 s dans les `run`; le preview métier est ~8–12 ms. Les journaux CI montrent une amplification sur les scénarios qui reconstruisent ces fixtures, alors que les autres services passent. Le coût principal identifié est la préparation SQLite/disque, pas le nombre d’actions ou les règles Histoire.

La latence du stockage Windows hébergé est l’explication probable de cette amplification. L’analyse ne mesure pas les fsync, l’antivirus ou la CPU du runner à distance ; elle ne prétend pas isoler lequel de ces facteurs produit les 26–56 secondes. Aucun réglage runner, antivirus, journal ou durabilité SQLite n’est changé.

Une **simulation locale distincte** injecte une attente minimale de 20 ms par écriture autocommit/fin de transaction disque. Elle ne reproduit pas exactement GitHub, mais teste la sensibilité à ce coût :

| Profilage isolé | Avant | Après |
| --- | --- | --- |
| Fixture actuelle, sans latence injectée | 846 ms | 191 ms |
| Deux sessions + preview/fermeture, sans latence injectée | 1 815 ms | 424 ms |
| Fixture avec attente disque injectée | 8 684 ms | 228 ms |
| Deux sessions avec attente disque injectée | 17 822 ms | 574 ms |

L’attente est minimale, les délais effectifs de l’ordonnanceur ne sont pas exactement 20 ms. Ces mesures incluent les vraies opérations SQLite et le traitement : aucune fixture simplifiée ni mock métier. Les instruments n’existent que dans une compilation temporaire du helper historique et courant ; ils ne sont pas injectés dans la suite normale.

## Correctif préparé

Seul le constructeur de fixtures `src/main/testSupport/operationalRecipeFixture.ts` change :

1. Appliquer **toutes les migrations réelles** et charger les **mêmes références** dans une base SQLite `:memory:` indépendante.
2. Conserver les contrôles integrity_check et foreign_key_check.
3. Exporter la base complète sur le fichier propre à chaque appel via SQLite **VACUUM INTO**.
4. Fermer la base en mémoire dans le finally existant.

Ce changement élimine les commits disque de construction ; il conserve une vraie base fichier pour les services testés, les sources, les copies, les previews, les snapshots, les transactions et les nettoyages. Pas de cache partagé, pas de dépendance à Validation-MSI, pas de modèles/temps/prix altérés. La variante historique Histoire utilise le même export et reste couverte.

L’export n’a lieu qu’après préparation réussie et refuse une destination non vide. Aucune désactivation du journal, de synchronous ou des FK, aucun retry, skip de test, modification des timeouts ou du nombre de workers. Le workflow et la configuration Vitest ne changent pas pendant ce correctif. Le helper est également utilisé par le banc technique operational-recipe ; seules sa préparation de fixture et sa vitesse changent, pas le moteur ni l’interface.

## Contrôles

- Typecheck OK.
- **27/27 tests ciblés**, durée 3,36 s : les 24 tests existants + trois contrôles permanents d’export.
- Tests nouveaux : migrations/JSON modèles/intégrité/FK conservés sur les fichiers exportés ; deux bases indépendantes ; journal DELETE et synchronous FULL inchangés ; aucun fichier partiellement chargé après erreur injectée ; fichier SQLite préexistant conservé octet pour octet après refus.
- Les tests Histoire existants vérifient les quatre Pages, profils inactifs, associations draft, références/actions/temps Essentiel/Grand Jour conservés, snapshot après rollback et replay. Le test des deux sessions vérifie l’égalité des previews et 10 actions / 1 650 min / 1 Site / 4 Pages.
- Suite complète locale **698/698 dans 80 fichiers**, durée **72,02 s**, `npm test -- --maxWorkers=2`. Aucun résultat local présenté comme une CI réussie.
- Fixtures de tests supprimées dans leurs finally/afterEach ; instruments de profilage dans un répertoire TEMP propre, contrôlé puis supprimé. Aucun SQLite/capture/output ajouté à Git.

## Suite

Publication de 5a175eb dans #84 autorisée par AtoumWeb ; un commit documentaire de suivi [skip ci] est poussé avec lui pour préserver ce hash et empêcher un run automatique. Les cinq fichiers affectés restent le helper, son nouveau test, ce rapport, PROJECT_STATUS et la roadmap. Le YAML, les trois tests initialement en timeout, Vitest, migrations, données/règles métier et référentiel V2 ne changent pas dans ce correctif.

Dernier rejeu prépublication : typecheck OK et 27/27 ciblés en 4,58 s, intégrité/FK, migrations 1–66, indépendance, journal DELETE/synchronous FULL, erreur sans fichier partiel et destination existante intacte. Le complet 698/698 sur les mêmes sources n’est pas répété pour des changements de documentation seulement.

### Protocole du prochain run Windows hébergé — à autoriser séparément

1. Vérifier HEAD de #84 et working tree, confirmer que le budget Actions 0 USD / Stop usage reste celui approuvé par AtoumWeb. Ne modifier ni budget ni moyen de paiement ; si GitHub bloque, arrêter sans retry/contournement.
2. Après accord explicite, pousser **un nouveau commit sans skip** sur cette branche. Ne pas relancer le run 37934890745 : il reste lié à l’ancien code. Ne pas utiliser workflow_dispatch sur main, qui n’a pas encore ce workflow corrigé.
3. Vérifier que le nouveau run pull_request est lié au nouveau HEAD contenant 5a175eb, qu’il utilise **windows-2022** et Node 24, npm ci avec le lockfile, typecheck et `npm test -- --maxWorkers=2`.
4. Attendre sa fin effective ; conserver lien/run ID/head SHA, nom du runner, runtime Electron/Node, conclusions/durées de chaque étape, résumé Vitest et liste exacte des erreurs. Ne pas remplacer ces preuves par des résultats locaux.
5. À contenu stable, le comptage local est 698 tests dans 80 fichiers ; constater le comptage réel dans les logs, ne pas en faire un nouvel invariant métier. Vérifier explicitement les trois scénarios précédemment en timeout et les trois tests d’export, sans retirer les autres tests.
6. Succès = installation/typecheck/tests verts sur ce HEAD, sans skip ni retry masquant une erreur. Un échec appelle un bilan et un nouvel arbitrage avant une nouvelle exécution. Garder #84 draft/non fusionnée jusqu’à validation humaine.

### Plan d’intégration #81 et #83 — aucune branche modifiée

Références contrôlées : #81 `593a4611`, #83 `5b38cbe1`, toutes deux ouvertes en draft. Le plan n’exécute aucun merge, rebase, cherry-pick ou push de leurs branches.

1. Après CI #84 verte et **accord de fusion séparé**, intégrer #84 dans main ; relever le HEAD exact. Cela apporte le workflow hébergé et la fixture corrigée, pas UX-03/UX-16/UX-01.
2. Mettre ensuite à jour la branche #81 depuis ce main par **merge normal**, après autorisation. merge-tree préparatoire ne trouve que des conflits PROJECT_STATUS/roadmap : préserver les historiques, définir un état courant exact. Ne pas modifier les transactions/savepoints, contrôles de restauration, destination immuable, sauvegarde/récupération, idempotence ou modèles historiques.
3. Contrôler localement le typecheck, la suite complète et les tests de restauration/pack/terminaison sur fixtures temporaires ; pousser pour produire un **nouveau run de #81 utilisant le nouveau YAML**. Attendre les logs CI réels, revue humaine et accord distinct de fusion. Ne pas supposer que l’ancien run en attente s’adapte.
4. Après intégration validée de #81, mettre à jour #83 depuis main par merge normal, sur sa branche et après autorisation. Préparer le conflit `src/main/ipc.ts` : conserver destination/détail et `scheduleDatabaseRestore(sourcePath, workspace)` de #81, ainsi que confirmations dirty/pending, recontrôle après dialogue et `app.quit()` de #83. Le merge automatique de main.ts devra être revu pour conserver message de restauration refusée et cleanup seulement à will-quit.
5. Conserver l’ensemble des commits UX-01A/B/C et de revue : brouillons indépendants/CAS/conflits, garde par éditeur, fenêtre détachée, workspace différé, archivage/suppression avant mutation et sections réduites conservées. Préserver aussi toutes les protections #81 ; aucun Enregistrer et quitter V2 ni réparation de dossiers historiques.
6. Rejouer les tests ciblés des deux protections, typecheck/suite complète/intégrité-FK/1–66 et parcours natifs concernés sur trois thèmes dans des fixtures isolées. Pousser #83 seulement après contrôles/autorisation, attendre un nouveau run lié au bon HEAD, puis demander validation humaine avant sa fusion.

La simulation Git #84→#81 et #84→#83 rencontre uniquement les deux fichiers de suivi. #81↔#83 rencontre en plus l’IPC de restauration ; leur compatibilité avait été testée sur une copie combinée temporaire, mais ce test passé ne remplace pas la validation du futur tree intégré. Les anciens runs en attente ne sont ni annulés ni relancés ici. #80/#82 et le référentiel V2 restent distincts et inchangés ; leurs éventuels merges nécessitent d’autres décisions.

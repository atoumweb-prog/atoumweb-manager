# PR #95 — Correctif des comparaisons binaires de restauration

13/10/2026. Branche locale dédiée `codex/fix-95-native-buffer-assertions`, dérivée du candidat **b0e9bb0dd5928627d9e870cbcadbb533bfa206f1**. Correctif autorisé localement ; **aucun push, changement de PR, CI ou merge autorisé par cette livraison**.

## Correctif et couverture

Commit de tests **66e0fc2b77a9a4edec3fbcd5c6ff4efa149c9ba7** :

- `src/main/restore.test.ts` : les14comparaisons de Buffers de fichiers utilisent `.equals(expected)` puis `.toBe(true)`. Comparaison exacte de longueur et de chaque octet ; ni identité objet, ni seule taille, ni hash, ni échantillonnage.
- `src/main/restoreBinaryEquality.test.ts` : sixcontrôles permanents sur de vrais fichiers binaires TEMP de2 408 448octets : contenuidentique/pointeursdistincts, différencepremier/milieu/dernieroctet, pluscourt, pluslong. Vérification indépendante par boucle linéaire complète des octets etlongueur. Toutesassertions portent surbooléens/nombres afin de ne pas réintroduire un matcher générique deBuffer dans les tests d'équivalence.

Les3cas de contenu différent gardent exactement la même longueur etdoivent être rejetés ; lescas de taillesdifférentes gardent unpréfixe identique etdoivent être rejetés. Les6cas correspondants du diagnostic sont donc conservés, désormais permanents et sans appel coûteux à un comparator récursif sur desmillionsd'entrées.

Les **35tests de restauration originaux** restent présents et exécutés. Vérifications SQL/snapshots/integrité/FK, historique4/65/66migrations, sources/destinations immuables, pré-restauration récupérable, erreurs injectées, occupation/concurrence, verrous etnon-rejeu restent inchangées. Délai20s, worker2, tauxbackup4096 etfixture/cache ne sont pas modifiés.

## Avant/après : mesures correctement distinguées

L'ancienrun #659 sur b0e9bb0 signalait deux timeoutsDELETE/WAL à20s. Le code de restauration reste le même ; la correction agit seulement sur le coût des assertions des tests.

| Mesure | Avant local b0e9bb0 | Correctif66e0fc2 local | CI659 avant correctif |
| --- | ---: | ---: | ---: |
| DELETE | 4,747s | **0,371s** | 20,355s FAIL |
| WAL | 4,573s | **0,264s** | 21,909s FAIL |
| A→B | 4,474s | **0,067s** | 18,129s PASS |
| Fichier35restaurations danssuitecomplète | 67,987s | **4,197s** | 33/35réussis |

Durées après parcas issues d'une exécution ciblée avec reporterJSON, maxWorkers2, sans instrumentation applicative ;3/3réussis. Lesautresdurées sont les runs complets correspondants, pas une mesure hébergée du nouveau correctif. Lesdifférences de charge/runners empêchent de promettre un ratio hébergé identique.

Le diagnostic précédent (branchelocale `codex/diag-01ef-sqlite-timeouts`, rapport03f70b5) mesurait93,55–95,60% ducorpsDELETE/WAL dans deuxassertions `toEqual(Buffer)` ; applySQLite104–117ms, autresE/S/connexions/backups/intégrité/nettoyage enms. Le matcher Vitest parcourt lesoctets puiscréeObject.entries : travail inutile pour cette vérification de contenu binaire. Instrumentation entièrement retirée, aucun code deprofilage importé enproduction ou danscecorrectif.

## Résultats du code66e0fc2

| Contrôle réellement exécuté | Résultat |
| --- | --- |
| npm run typecheck | OK |
| Ciblés restore + restoreBinaryEquality, maxWorkers2 | **41/41** =35restaurations originales +6contrôlesbinaires,4,70s ; fichiers3,911s et~0,1s |
| npm test -- --maxWorkers=2 | **873/873**,95fichiers,**88,08s**,sortie0 sansRPC |
| Contrôles chronométrés DELETE/WAL/A→B | 3/3,sanshaussetimeout,sansretry |

867tests du candidat conservés +6nouveaux, aucunskip ou désactivation introduit. Lesréglages normaux incluent lehookRPC existant, non modifié. Lesfichiersroot defixtures sont vérifiés avantcleanup ; toutesbases/donnéescréées uniquement sousTEMP, pas deValidation-MSI.

Le présent commit de documentation fige le **HEAD de livraison** ; sources/tests identiques à66e0fc2. Typecheck/ciblés/suite complète sont rejoués sur ce HEAD exact avant livraison, journaux sousoutputs/fix-95-native-bytes-delivery-*. Lesdurées66e0fc2 ci-dessus restent les preuves de cetSHA, etlebilan final donne leSHAetlesmesures du dernierHEAD sans lesconfondre. Aucuncommit ne sera ajouté aprèsces dernierscontrôles.

## Fichiers et invariants

Deux fichiers de tests ci-dessus, puis `PROJECT_STATUS.md` et leprésentrapport pour la traçabilité. Aucun diff depuisb0e9bb0 dans : restore.ts, NodeSqliteAdapter, services commerciaux/temps/restauration, migrations, preload, règles métier, gardesUX-01,61assertionsÉchap, setup/hookRPC, Vitestconfig, scripts/run-tests, workflow, package/lockfile.

Lesbranchesmain et90–93 restent intactes. LaPR95 gardeHEADb0e9bb0/basemain31167754 etstatusdraft ; lesexpériences ne deviennent pas uneCIverte. ValidationWindowslocale suffisante pourproposer la publication, **pas une autorisation de fusion**. Risque résiduel : confirmerlesperformances etla suite surWindows hébergé ; laCIactuelle ne rejouepas lesbancsElectron, dont lecode est inchangé par ce correctif de tests.

## Intégration propre proposée à #95, sous accord distinct

1. Recontrôler que #95/source `codex/consolidation-ux-v2-01ef` resteb0e9bb0 etmain31167754, queleHEADlocal livré estcelui testé, clean, sansinstrumentation.
2. Cettebranche a b0e9bb0 commeancêtre etajoute seulement tests/documents ; un push **normal fast-forward** de sonHEAD vers la branche existante de #95 suffit. Aucunrebase/squash/force, nouvellePR oumerge main. Préserver90–93 etnepasretargeter.
3. Le derniercommit documentaire est normal,sansskipci. Aprèsaccord pourpublication **etcandidateautomatique**, effectuer **un seul push** vers `codex/consolidation-ux-v2-01ef`. L'événement `pull_request:synchronize` déclenchera quality ; cettebranche n'est pas ciblée par letriggerpush. Aucun commitvide, workflow_dispatch ou rerun supplémentaire.
4. Vérifier une seule nouvelle exécution pour #95/nouveauHEAD, parents/arbre du checkoutGitHub, npmci/Node24/Windows2022, typecheck, **873tests attendus**,35restaurations +6contrôlesbinaires etDELETE/WAL/A→B, absenceRPC. Arrêt au premieréchec/refus, sanshausse desdélais ni contournementfacturation.
5. SiCIverte : bilan etaccordhumain **distinct** avantfusion/postCI. Budgets/paiements/Stopusage inchangés ; pasdereprise02A/B/C implicite.

**CI déclenchées pendant ce travail :0.** Les deuxcommits locaux (testsetrapport) peuvent être transmis parunpushunique ; deuxcommits ne demandent pasdeuxCI. Toutepublication modifiant95 attend l'autorisation demandée par l'utilisateur.

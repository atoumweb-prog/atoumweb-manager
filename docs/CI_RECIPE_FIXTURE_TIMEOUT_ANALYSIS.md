# CI #84 — Analyse ciblée des trois timeouts de fixtures

Date : 09/10/2026. Branche `codex/fix-ci-windows-hosted`, diagnostic depuis `1b069575`. Aucun nouveau run GitHub Actions, push ou merge pour cette analyse. Validation-MSI n’est pas ouverte.

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

Correctif local uniquement, non poussé : la CI de #84 reste sur le run échoué précédent. Un nouveau push/run nécessite le nouvel accord AtoumWeb. Le succès sur Windows hébergé reste à démontrer ; pas de recommandation de fusion avant cette vérification.

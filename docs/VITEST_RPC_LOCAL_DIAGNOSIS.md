# PR #81 — diagnostic local du RPC Vitest, 09/10/2026

## État et périmètre

CI Windows #650 : [run 37987598902](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37987598902), SHA `50f2b40250c0789ad46f63791394d1d9fc1c6c22`. Installation et typecheck réussis, 748/748 assertions dans 81 fichiers, dont 35/35 restaurations ; sortie en erreur à cause de `[vitest-worker]: Timeout calling "onTaskUpdate"`. Durée totale 7 min 05 s. Ces résultats ne constituent pas une CI verte.

Diagnostic uniquement local sur `codex/fix-manager-integrity-ux16-ux03`. Aucun accès à Validation-MSI, lancement Manager, push, CI supplémentaire, fusion, modification de #82/#83, budget ou visibilité. Fixtures SQLite mémoire et fichiers temporaires indépendants uniquement.

## Mécanisme identifié

Vitest installé : 3.2.7, pool par défaut `forks`, runtime des tests Electron 44.3.0 / Node 24.20.0. Le transport birpc installé applique un délai de 60 secondes à ses requêtes, distinct des délais des tests. `onTaskUpdate` transmet des mises à jour de résultats ; leur réception et leurs réponses passent par la boucle d'événements du worker.

Des tests SQLite synchrones peuvent s'enchaîner via les microtâches sans laisser le worker traiter ses réponses IPC. Le parent répond, mais le worker reçoit trop tard. Un hook limité à `restore.test.ts` ne protège pas les autres suites synchrones longues.

Instrumentation temporaire : identifiants RPC, timestamps, PID et retards de boucle uniquement, aucun contenu métier. Ni dépendances installées ni code de production modifiés. Les logs du run #650 ne désignent pas la suite responsable : la cause du run réel reste probable, même si le même défaut est reproduit localement.

## Mesures et reproduction

| Expérience locale | Résultat | Durée | Attente RPC maximale |
| --- | --- | --- | --- |
| Deux suites réelles avant correction : Restore + ProjectContributionTargets | 92/92, sortie 0 | 63,00 s | 18 488 ms ; parent 0 ms |
| Même sélection après correction commune | 92/92, sortie 0 | 62,22 s | 5 807 ms ; parent au plus 1 ms |
| Stress isolé, forks sans hook : 60 tests SQLite synchrones de ~1,1 s | 60/60 assertions, erreur onTaskUpdate, sortie 1 | 66,22 s | 66 047 ms ; parent 0 ms |
| Même stress, forks avec hook commun | 60/60, aucune erreur RPC, sortie 0 | 66,28 s | 2 211 ms |
| Même stress, threads sans hook | 60/60, sortie 0 | 66,23 s | Non mesurée de façon fiable |

Dans le stress initial, le retard de boucle du worker atteint 66 155 ms ; avec hook, 2 313 ms. Chaque test reste sous son délai initial de 5 s. Le défaut provient de l'enchaînement, sans contention entre deux workers nécessaire pour le reproduire. Le pool threads est une alternative observée mais non retenue, pour conserver l'isolation actuelle des dépendances natives SQLite.

## Correction minimale

`vitest.config.ts` charge `src/testSupport/yieldTestEventLoop.ts`. Un `afterEach` attend un `setImmediate` natif importé depuis `node:timers` : une occasion de traiter les réponses IPC entre les tests, indépendante des horloges simulées des tests métier.

Aucun changement de version Vitest, pool, nombre de workers, timeout, assertion existante, sélection de tests ou traitement des erreurs non gérées. Aucun changement de service de restauration, sauvegarde, opération, migration ou UI. Le hook ne prétend jamais qu'une opération métier réussit.

Deux tests permanents supplémentaires vérifient que les fake timers restent actifs entre les tests et que leurs timers métier avancent uniquement sur commande. Un contrôle négatif temporaire `expect(1).toBe(2)` conserve une sortie 1 : les erreurs ne sont pas absorbées.

## Validation locale

- Typecheck : OK.
- Horloge simulée, packs, ventes et temps : 24/24 dans quatre fichiers, 2,74 s.
- Restaurations et cibles Projet : 92/92, 62,22 s ; injections, sauvegardes, récupération, concurrence, migrations et contrôles SQLite/FK existants passent sans changement d'assertions.
- Suite complète avec deux workers : **750/750, 82 fichiers, 99,76 s**, sortie 0, aucune erreur RPC. Les 748 tests initiaux plus deux nouveaux contrôles ; tests migrations 1–66 et intégrité/FK des fixtures verts. `git diff --check` OK.

Le stress est un diagnostic externe temporaire, pas un test ajouté à la suite normale. Les 748 tests existants sont conservés ; seuls deux tests de non-régression sont ajoutés.

Nettoyage du seul répertoire temporaire de diagnostic refusé par la revue automatique : `atoumweb-vitest-rpc-diag-vWxSc9` reste dans TEMP, hors Git. Aucun contournement du refus. Les fixtures des tests normaux suivent leur nettoyage habituel.

## Limites et prochaine décision

Le hook agit entre les tests : il ne peut pas interrompre un appel synchrone unique qui bloquerait plus de 60 secondes. Une nouvelle occurrence demanderait un profilage de ce cas précis. Ne pas élargir artificiellement les délais ou ignorer les erreurs RPC.

Les résultats locaux ne remplacent pas une validation Windows hébergée. Une unique confirmation complète sur le futur HEAD publié reste à autoriser ; aucun run n'est déclenché par ce diagnostic.

Autorisation suivante AtoumWeb : revue des six fichiers, commit limité puis push normal sur #81 et une seule CI déclenchée par ce push. Revue : hook référencé uniquement par Vitest, 81 fichiers historiques inchangés et deux tests ajoutés ; workers/délais/assertions inchangés. Répertoire TEMP exclu du commit, refus de suppression respecté. Aucun merge ou rerun autorisé ; résultat hébergé à relever après publication.

Sources primaires : [signalement Vitest #8164](https://github.com/vitest-dev/vitest/issues/8164), [correctif upstream #8297](https://github.com/vitest-dev/vitest/pull/8297), [configuration Vitest 3](https://v3.vitest.dev/config/). Le correctif upstream ne justifie pas de supposer une correction présente dans le bundle installé, ni une mise à niveau majeure non autorisée.

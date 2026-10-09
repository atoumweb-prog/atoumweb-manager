# AtoumWeb Manager — Suivi du projet

## 10/10/2026 — Recette packagée UX-01 : vrai IPC et relancement automatique préparés

- **Harness indépendant** ajouté sur `prep/ux01-restore-quit-gate-v2` : `scripts/check-ux01-packaged-relaunch.cjs` et `scripts/fixtures/ux01-packaged-{main,preload}.cjs`. Il construit un **exécutable Electron packagé temporaire** dans `%TEMP%`, et réutilise les vraies implémentations `registerIpcHandlers`, `DatabaseService`, `registerGuardedShutdown`, `restore`, `RestoreQuitGate`.
- Acceptation : appel réel `backups:restore` sous `app.isPackaged`, quit automatique, marqueur en `will-quit`, **`app.relaunch()` déclenchant un autre PID**, restauration au démarrage et sauvegarde `pre-restore`. Refus : enregistrement pending après accord IPC, fermeture veto et vérification à un démarrage manuel ultérieur sans restauration. **Tout est sous un nouveau profil/workspace TEMP avec nonce, aucune base réelle.**
- **Contrôle effectué :** syntaxe JavaScript des trois fichiers OK ; présence de `@electron/packager@18.4.4` confirmée dans `package-lock.json` ; assertions statiques des garde-fous. **Le test packagé n'a PAS été exécuté sous Windows à ce stade.**
- **Périmètre :** exécutable de test indépendant utilisant le vrai IPC (pas le package final du Manager, son `main.ts` complet ni le MSI). Voir [la recette et ses limites](docs/UX01_PACKAGED_RELAUNCH_RECIPE.md). Ne pas inférer une validation Windows avant la sortie du script.
- `main`, #82, la PR officielle #83, migrations, fichiers `src/`, workflows et Validation-MSI inchangés. Pas de CI ou fusion.

## 10/10/2026 — Validation Windows du parcours natif restauration/fermeture UX-01 × UX-16

- **Révision testée :** `prep/ux01-restore-quit-gate-v2@dbfd0e2f2171f6f66b222e2b7cc1256649af1490`. Exécution PowerShell `node --check scripts/check-restore-quit-roundtrip.cjs` OK ; `node scripts/check-restore-quit-roundtrip.cjs` **12/12 contrôles, 5/5 processus Electron, 0 échec, `Fixture cleaned: true`**.
- Quit accepté : vrais événements Electron `before-quit=1`, `will-quit=1`, fermeture de la fenêtre et de SQLite, marqueur `pending` créé seulement après acceptation. Nouveau processus : `restored:true`, source conforme 66 migrations, sauvegarde `pre-restore`, marqueur consommé. Deuxième lancement : `restored:false` sans rejeu.
- Quit refusé pendant un enregistrement : `before-quit=1`, **pas de `will-quit`**, fenêtre et SQLite conservées, aucun marqueur ; démarrage suivant : `restored:false`, données conservées. Scripts confinés à des workspaces TEMP isolés, effacés à la fin.
- **Comparaison Git :** depuis `88efb788` (801/801 tests, typecheck, 183/183 natifs 3 thèmes validés localement), seuls les scripts de recette et la documentation ont évolué ; aucun fichier de production `src/` ni migration changé.
- **Limite restante :** la recette 5 processus emploie Electron natif avec les vrais services, **pas le binaire distribué en mode `app.isPackaged` et son `app.relaunch()` réel**. Pas de CI combinée sur le HEAD, ni de validation de l'exécutable packagé, ni de fusion. [Protocole / limites](docs/UX01_RESTORE_QUIT_ROUNDTRIP.md).
- `main`, PR officielles #82/#83 et Validation-MSI non modifiés ; #83 reste draft.

## 10/10/2026 — Recette de restauration de bout en bout préparée sur branche isolée UX-01

- AtoumWeb a vérifié `prep/ux01-restore-quit-gate-v2@88efb788` sur Windows : typecheck OK, **31/31** ciblés, **801/801** tests complets dans 87 fichiers et **183/183** contrôles natifs sur les trois thèmes ; fixtures supprimées. Aucune CI GitHub ni recette d'exécutable packagé revendiquée.
- Script additionnel `scripts/check-restore-quit-roundtrip.cjs` ajouté pour tester dans cinq processus Electron natifs (fixtures TEMP exclusivement) le vrai quit, l'application au lancement suivant, la sauvegarde `pre-restore`, l'absence de rejeu et le refus de sortie. [Protocole et limites](docs/UX01_RESTORE_QUIT_ROUNDTRIP.md). **Syntaxe du script vérifiée, mais exécution Electron Windows non réalisée pour ce nouveau script** ; les succès précédents ne le couvrent pas.
- PR officielle #83, #82, main et Validation-MSI inchangés, ni CI ni fusion. Prochaine vérification : exécuter le nouveau script sur Windows et compléter la recette packagée avant intégration.

## 10/10/2026 — #81 fusionnée ; #83 en intégration préparatoire isolée

- **État GitHub confirmé :** #81 fusionnée normalement dans `main@68bfd952e394169ade65e3f0697422d8c00c2cc7`, CI post-merge **#652 SUCCESS** au même SHA ; typecheck et 750/750 tests (35 restaurations) confirmés par le bilan de fusion. L'historique #81 ci-dessous reste relatif à ses checkpoints des 09–10/10.
- **UX-01 / #83 :** PR originale `codex/fix-manager-unsaved-inputs-ux01@5b38cbe1` en draft, **non fusionnée**, travaux A/B/C et revue finale historique ajoutés ci-dessous. Ses anciens 734/734 tests et 177/177 natifs valident seulement sa propre branche à cette date, **pas** la combinaison actuelle avec #81.
- **Préparation combinée dédiée :** `prep/ux01-restore-quit-gate-v2` dérivée de `prep/ux01-with-integrity-v1@8a577f1`. Les gardes de fermeture et la restauration UX-16 sont réunis : restauration packagée programmée à `will-quit` après acceptation Electron, annulation d'intention sur veto. Deux tests supplémentaires de fenêtre UX-01 déjà préparés ; cinq nouveaux tests du garde `RestoreQuitGate` et deux contrôles natifs par thème ajoutés en préparation.
- **Contrôle réel limité :** compilation stricte et **5/5** scénarios isolés du garde sous Node 22. Le typecheck du dépôt, la suite complète, la recette native Electron et une CI de cette combinaison **ne sont pas exécutés**. Les tests cumulés 750 (#81) et 734 (#83) ne doivent jamais être présentés comme validation intégrée.
- **Suite bloquée jusqu'à vérification :** recetter refus de quit, création/absence de marqueur au redémarrage, restauration acceptée, source/cible workspace, fenêtre détachée et enregistrement pending sur fixtures temporaires. Préserver migrations 1–66, CGV, contrats, packs, restauration #81 ; aucune ouverture de Validation-MSI ni modification de #82/#83/main.
- [Préparation, limites et tests à réaliser](docs/UX01_WITH_INTEGRITY_PREPARATION.md).

## 09/10/2026 — Revue finale UX-01 / PR #83 avant fusion

- Trois pertes résiduelles reproduites puis corrigées uniquement dans UX-01 : archivage Prospect/groupe mal hiérarchisé, suppression ligne Devis avant garde, réduction d’une section Prospect démontant son draft. Garde avant mutation (également classement Perdu), groupes cohérents et conservation des sections réduites ; aucun Enregistrer et quitter V2, migration ou règle métier nouvelle.
- Typecheck OK, **734/734 complets**, **177/177 natifs trois thèmes**, intégrité/FK et 1–66 sur fixtures supprimées. Simulation #81+#83 en copie temporaire : typecheck, **87/87 ciblés** et **177/177 natifs** verts ; conflit IPC à résoudre en conservant la destination/restauration #81 et les gardes de sortie #83. Aucun merge réel. #80 : conflits de journaux seulement ; #82 : pas de conflit, garde UX-01 réutilisable pour le futur Lot 01.
- **CI quality toujours queued**, aucun runner enregistré, ne pas annoncer ses contrôles verts. PR prête pour revue humaine ; recommandation de fusion suspendue au succès CI et aux résolutions futures avec #81/#80. [Détail de revue](docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md). Validation-MSI non ouverte, aucun dossier métier modifié, #80/#81/#82 inchangées.

## 09/10/2026 — UX-01A/B/C : correction livrée sur branche indépendante

- Branche `codex/fix-manager-unsaved-inputs-ux01` depuis `main@eb252d5c` ; commits distincts A (`df1b6f3`), B (`80300a4`) et C. [Bilan complet, fichiers, scénarios et limites](docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md). Reprise du travail interrompu sans reset ; B isolé dans l’index puis vérifié dans une copie temporaire, sans perte des changements C.
- A : brouillons contractuels indépendants, fusion des rafraîchissements avec conflits explicites, refus des enregistrements périmés et détail Devis maintenu lors des refresh. B : registre par éditeur, confirmations de sortie Prospection/Devis et sous-formulaires, annulation limitée à la saisie concernée, réponses Devis tardives ignorées. C : fermetures/rechargements/quitter Electron, fenêtre Référence Prospect détachée et choix différé de workspace ; aucun brouillon déclaré enregistré avant confirmation du serveur.
- Validation finale : typecheck OK ; ciblés **75/75**, complets **733/733 dans 82 fichiers** (`npm test -- --maxWorkers=2`), **153 contrôles natifs** sur les trois thèmes. Premier run complet à concurrence par défaut : un timeout de fixture et timeout RPC sous charge ; fixture rejouée isolément 21/21 puis suite complète verte avec deux workers, sans changement de délai ni de règle. Snapshot B seul : typecheck et 81 contrôles natifs verts.
- Fixtures exclusivement temporaires, supprimées après fermeture ; migrations **1–66 inchangées**, integrity_check `ok`, FK vides. **Validation-MSI non ouverte ni modifiée** ; aucune migration, réparation historique, autosauvegarde ou refonte UX/UI V2. Les autres modules ne sont pas encore raccordés au registre ; crash/arrêt forcé/récupération persistante restent hors périmètre.
- Livraison par PR dédiée en draft, sans fusion automatique ; #80 et #81 inchangées. Prochaine action : CI puis validation AtoumWeb avant fusion. Les entrées suivantes sont les checkpoints historiques des lots.

## 09/10/2026 — UX-01B : sorties par éditeur

- Registre/hook par éditeur et groupe, Rester par défaut/abandon limité, attente des saves, sorties sidebar/recherche/événements/fiche/panneau et sous-formulaires Prospection/Devis. Contrôles locaux conservés ; réponses de lecture Devis tardives invalidées, refresh maintient les composants, aucun nouveau style ou serveur métier.
- Séparation prudente à la reprise : UX-01A déjà isolé dans df1b6f3 ; B reconstruit dans l’index sans remettre à zéro le working tree C. Copie temporaire du tree B : typecheck et 81 contrôles natifs trois thèmes verts ; 9 tests de registre en plus des 8 tests de sections. Aucun accès Validation-MSI, copie contrôlée/nettoyée. C reste ensuite à committer et valider.

## 09/10/2026 — UX-01A : sections contractuelles corrigées

- Autorisation AtoumWeb : A/B/C sur la branche indépendante, commits distincts et PR sans fusion. A sépare les baselines des paramètres du devis et de l’administration ; refresh trois voies, conflits explicites et garde optimiste optionnelle à l’enregistrement. Règles de finalisation/snapshots inchangées, aucun schéma nouveau.
- Cause supplémentaire reproduite et corrigée : le loading de refresh remontait tout le détail Devis, détruisant les drafts voisins. Le chargement initial est conservé ; les rafraîchissements gardent les éditeurs montés.
- Contrôles A : 47 tests ciblés et typecheck OK ; 33 contrôles natifs sur trois thèmes, deux sens de conservation et absence de save implicite, conflit interfenêtre refusé/draft conservé/résolution explicite ; 1–66/intégrité/FK verts sur fixture nettoyée. Validation-MSI non ouverte. B/C restent à réaliser.

## 09/10/2026 — UX-01 : diagnostic indépendant avant correction

- AtoumWeb demande la protection des saisies, en commençant par diagnostic/reproduction/proposition, sans modification transversale risquée ni UX/UI V2. Branche `codex/fix-manager-unsaved-inputs-ux01`, depuis `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, origin/main identique après fetch. PR #81 reste draft, sans fusion automatique ; PR #80 et #81 non modifiées, code non fusionné de #81 non repris.
- Inventaire AST : 82 TSX raccordés, 58 fichiers avec contrôles/709 déclarations natives, 8 form ; filtres/readonly/helpers compris. Pas de garde commune de navigation/fermeture ; protections locales à réutiliser (Builder/copies, Qualification, dirty/undo/code, conservation de certains drafts masqués).
- 13 scénarios natifs temporaires avec App/preload/vrais IPC : **9 pertes reproduites**, 3 comportements locaux utiles, 1 risque de workspace différé. Navigation, reload, changement de fiche, Escape/clic extérieur, fermeture native, clause malgré avertissement ; deux directions de perte entre paramètres du devis et administration lors d'un save voisin. Choix du workspace B accepté avec saisie encore dans A, sans bascule immédiate.
- [Diagnostic, inventaire et petits lots proposés](docs/FUNCTIONAL_UNSAVED_INPUTS_UX01_DIAGNOSIS.md) : A préserver les deux sections contractuelles ; B registre/hook et navigation avec pilotes ; C natif/workspace/détaché ; D/E/F extensions progressives. Rester par défaut/abandon explicite, baselines par section, saves en cours et retours asynchrones coordonnés, aucune autosauvegarde/finalisation implicite.
- Fixture fermée/supprimée, intégrité ok/FK vide/migrations 1–66 ; aucun accès Validation-MSI. Trois documents seulement, aucun code/test fonctionnel/graphisme/migration modifié ; tests permanents prévus après validation. Aucun commit/push/PR nouveau ; arrêt au diagnostic pour arbitrage.

## 09/10/2026 — #650 : diagnostic RPC local et hook commun de fin de test

- CI #650 sur 50f2b40 : installation/typecheck et 748/748 assertions réussis, mais sortie en erreur RPC onTaskUpdate ; aucune validation hébergée acquise. Diagnostic local autorisé, aucun push/run/merge/#82/#83 ni accès Validation-MSI.
- Reproduction exacte sur 60 tests SQLite synchrones isolés : 60/60 assertions mais RPC en erreur ; réponse parent immédiate, worker bloqué 66 s pour un délai RPC natif de 60 s. Cause probable de #650, dont les logs ne désignent pas le worker responsable. L'ancien hook Restore ne couvre pas les autres suites synchrones.
- Correctif local minimal : setupFiles commun avec afterEach/setImmediate natif ; pool forks, versions, délais, assertions et code métier conservés. Même stress 60/60 sans RPC, attente maximale 66→2,2 s ; 92 tests réels verts, attente RPC 18,5→5,8 s. Deux tests ajoutés pour préserver les horloges simulées ; contrôle négatif conserve l'échec réel.
- Typecheck OK ; ciblés 24/24 ; suite complète **750/750, 82 fichiers, 99,76 s**, sortie 0 sans RPC. Restaurations 35/35, migrations/intégrité/FK et atomicité existantes passent sur fixtures. [Diagnostic détaillé](docs/VITEST_RPC_LOCAL_DIAGNOSIS.md). Aucun timeout augmenté, test masqué ou mise à niveau majeure. Correction non publiée ; prochaine étape : décision humaine sur publication et unique confirmation Windows hébergée. Un appel synchrone unique >60 s reste une limite à profiler séparément.

## 09/10/2026 — Diagnostic #649 et correction locale ciblée de restore.test.ts

- Échecs d’injection reproduits avec une jonction contrôlée : destination de production canonisée par realpathSync.native, mocks comparant un chemin brut. Ancien filtre ignore la destination réelle : pas d’erreur injectée / pas de callback concurrent. Comparaison canonisée des deux côtés, alias maintenu dans les deux cas pour prévenir la régression, nettoyage explicite de la jonction et preuve supplémentaire replacementInjected=true.
- Fixture historique 65 : vraies migrations 1–65 désormais préparées en SQLite mémoire puis export VACUUM INTO, même registre/données/source indépendante. Mesure locale création **1491→166 ms**, migrations **1489→140 ms**, restauration **94→88–97 ms**. Comparaison byte pour byte ~2 s conservée ; essai de transaction de lecture sans gain retiré. Aucune modification du service, des migrations, du YAML/Vitest ou des délais/assertions existantes.
- Trois tests corrigés **3/3 sur trois répétitions** (65 : 2,500–2,512 s ; récupération : 0,427–0,439 s ; concurrence : 0,173–0,193 s). **35/35 restore.test.ts, 63,91 s**, aucune erreur RPC ; typecheck OK. 80 assertions initiales intactes et un contrôle supplémentaire ; sources historiques, sauvegarde/récupération, writer réellement bloqué et intégrité/FK préservés. Pas de suite complète 748 rejouée, conformément à la demande.
- [Diagnostic et limites](docs/FUNCTIONAL_INTEGRITY_UX16_UX03.md) : graphie précise du TEMP CI non enregistrée, pas d’affirmation d’un nom 8.3 particulier ; mécanisme de comparaison confirmé par reproduction locale. Sondes retirées, fixtures finales et deux résidus de ce diagnostic nettoyés ; anciens TEMP refusés laissés intacts. Correctif committé localement seulement, aucun push/run/rerun/merge/visibilité/budget ou Validation-MSI modifié, #82/#83 non touchées. Nouvelle CI Windows hébergée à autoriser pour confirmer.

## 09/10/2026 — #81 actualisée, contrôles locaux verts, CI préparée

- Main local/distant **2b3906328d237b962f053acdf25b1ebeeba1222c**, #84 merged normalement, contenu exact f4bc0197 validé par #589 ; CI post-merge **#628 /37952828225 success** sur le SHA main. #81 reprend ce main par merge normal local e215125 ; deux conflits de suivi résolus en conservant les deux historiques, aucun conflit fonctionnel.
- Correctif autorisé limité à src/main/restore.test.ts : afterEach async puis setImmediate après fermeture/nettoyage/vérifications. Comparaison automatique au SHA #81 initial 593a4611 : seules ces deux lignes diffèrent ; toutes les assertions/durées et les services restauration/IPC/main/terminaison/packs/migrations sont identiques. Aucun relâchement des protections ni réparation historique.
- **Typecheck OK**, **68/68 ciblés** avec deux workers (141,92 s), **748/748 complets dans 81 fichiers** avec deux workers (207,78 s), aucune erreur RPC. Les 35 restaurations physiques isolées couvrent source/cible/migrations/intégrité/FK, backup/récupération, WAL/DELETE, alias, fichiers occupés et replay ; opérations atomiques et idempotentes, schema 1–66 inchangé. Fixtures finales fermées/supprimées ; aucun accès Validation-MSI.
- Publication de #81 avec HEAD documentaire [skip ci] pour préparer le workflow hébergé sans nouvelle exécution #81. Draft maintenue, aucun merge #81 ; anciennes demandes CI restent liées à leurs anciens commits. Après accord de run, nouveau commit sans skip, quality Windows-2022/Node 24/npm ci/typecheck/complet deux workers sur le vrai HEAD, preuves de résultat puis validation humaine de fusion. #82/#83 non modifiées par Codex, budget inchangé.

## 09/10/2026 — Reprise #81 après fusion normale de #84

- #84 fusionnée après contrôle du HEAD f4bc0197 et du run réel #589 vert (698 tests) : main/origin/main **2b3906328d237b962f053acdf25b1ebeeba1222c**, tree identique au HEAD validé. Mise à jour locale de main en fast-forward, puis intégration normale de ce main dans la branche #81.
- Seuls conflits : PROJECT_STATUS et roadmap ; historiques conservés. Aucun changement des services de restauration/terminaison/packs, des assertions ou délais par cette intégration. Correctif RPC de cycle de test autorisé ensuite, à isoler dans un commit distinct ; contrôles locaux et préparation CI avant toute validation de fusion #81. #82/#83 inchangées par Codex, aucune intervention Validation-MSI, aucun budget modifié.

## 09/10/2026 — UX-16 / UX-03 : corrections fonctionnelles isolées

- Validation AtoumWeb reçue : implémentation des deux corrections, tests permanents, commits et PR dédiée sans fusion sur `codex/fix-manager-integrity-ux16-ux03`. Base `main@eb252d5c` ; PR documentaire #80 inchangée, UX/UI V2 séparé.
- UX-16 : destination canonique/identité épinglées, empreinte source, compatibilité schéma/migrations/intégrité/FK, copie indépendante et contraintes vérifiées avant remplacement ; ancienne demande ambiguë ou interrompue non exécutée. Copie de sécurité validée, remplacement transactionnel SQLite, refus explicites et récupération volontaire, aucun WAL/SHM supprimé manuellement.
- UX-03 : terminaison et débit sous savepoints imbriquables, rollback des statuts/mouvements/solde/timestamps/activités, gardes/facturation/idempotence inchangés, aucune réparation historique automatique.
- Validation finale : **58/58 ciblés, 745/745 complets (80 fichiers), typecheck OK**. Windows : casse/séparateurs/jonctions/hardlinks, writers DELETE/WAL, échec de copie/remplacement, récupération depuis pre-restore et rejeu ; erreurs multiétapes de débit/journaux, transactions parentes et autres couvertures. Fixtures uniquement ; schéma toujours 1–66, intégrité/FK/replay verts, aucun accès Validation-MSI ni lancement Manager.
- 11 fichiers code/tests/suivi ; aucune navigation/React/CSS/règle commerciale/migration changée. [Bilan et limites](docs/FUNCTIONAL_INTEGRITY_UX16_UX03.md). Deux fixtures de premiers tests interrompus restent dans TEMP, suppression native refusée par revue automatique ; aucun contournement, aucun artefact dans Git. Prochaine action : revue de la PR corrective, aucune fusion automatique ; UX-01/04/05/02 ultérieurs.

## 09/10/2026 — UX-16 / UX-03 : diagnostic isolé avant correction

- AtoumWeb autorise un chantier fonctionnel distinct de la PR documentaire #80 et de la conception UX/UI V2 ; commencer par restauration/workspace et terminaison d'intervention, présenter les corrections avant changement risqué. Branche dédiée `codex/fix-manager-integrity-ux16-ux03`, depuis `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.
- **UX-16 reproduit** : restauration programmée dans A appliquée à B après changement de workspace. La sauvegarde pré-restauration préserve B mais n'empêche pas le remplacement incorrect. Une source non SQLite existante est aussi acceptée et rend la destination temporaire illisible.
- **UX-03 reproduit** : sans temps terminé, erreur mais statut devenu `to_validate` ; erreur tardive injectée sur le journal, statut intermédiaire et pack déjà débité. Nominal répété : un seul débit. Propositions : cible de restauration épinglée/validée et terminaison transactionnelle avec débit imbriquable.
- Six probes sur fixtures isolées, 8/8 tests existants ciblés verts ; ces tests n'incluent pas les défauts. Intégrité/FK des fixtures valides correctes, migrations mémoire 1–66, nettoyage effectué. Aucun accès à Validation-MSI, démarrage du Manager ou modification de code/migration/UI.
- Diagnostic, tests à ajouter, limites et fichiers envisagés : [FUNCTIONAL_INTEGRITY_UX16_UX03.md](docs/FUNCTIONAL_INTEGRITY_UX16_UX03.md). **Corrections proposées, non implémentées** ; arrêt pour validation, aucun commit/push/merge. Autres anomalies ensuite, sans refonte graphique.

## 09/10/2026 — Validation GitHub unique du correctif fixtures autorisée

- AtoumWeb autorise un seul nouveau run #84 avec 5a175eb conservé ; workflow Windows 2022/Node 24/npm ci/typecheck/complet deux workers inchangé. Budget 0 USD/Stop usage confirmé dans la session ; API quota toujours inaccessible (scope user absent), aucun solde gratuit inventé ni budget/paiement modifié. Si refus ou échec : pas de nouvelle relance sans accord.
- Commit sans skip déclenche l’essai ; relever depuis les logs les trois anciens timeouts, totaux et durées réels. Si vert, simulations locales isolées et préparation technique #81 puis #83 autorisées ; aucune modification de #81/#82/#83, merge, Validation-MSI ou données réelles. Résultats sur le run du commit et le bilan PR, sans pousser un deuxième commit de résultat déclenchant Actions.

## 09/10/2026 — Publication du correctif fixtures #84 sans déclenchement CI

- AtoumWeb valide 5a175eb et autorise sa publication, avec skip CI ; aucune réécriture du commit. Un commit de suivi uniquement documentaire portant [skip ci] devient le HEAD poussé avec le correctif. Même périmètre : helper/test de fixture et trois fichiers de suivi, aucun code métier/référentiel/migration/timeout global modifié.
- Dernier contrôle avant push : typecheck et **27/27 ciblés** verts, intégrité/FK/migrations 1–66, journal/durabilité inchangés, isolation/échecs/nettoyage vérifiés. Suite complète 698/698 déjà verte sur les mêmes sources. Aucun budget ou Validation-MSI touché.
- [Protocole CI et plan d’intégration](docs/CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS.md) préparés ; aucune modification des branches #81/#83. merge-tree en lecture : #84 contre chacune ne rencontre que les journaux de suivi ; #81 contre #83 nécessite aussi une résolution IPC conservant les protections des deux. Aucun merge réel.
- Attendre accord séparé pour un nouveau commit sans skip/run hébergé ; les résultats locaux ne valident pas GitHub. La publication avec skip ne remplace pas le premier run échoué par un succès. Aucun merge automatique.

## 09/10/2026 — Diagnostic et correctif local des timeouts CI #84

- Analyse des trois timeouts réels : 26–27 s par cas Histoire, 56 s pour deux sessions, délai 5 s. Profilage du helper : 176 autocommit/68 fins de transactions-savepoints sur disque par fixture ; preview ~12 ms. Stockage Windows hébergé probablement amplificateur, sans diagnostic certain CPU/antivirus/fsync à distance. [Analyse, mesures et limites](docs/CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS.md).
- Correctif limité à testSupport : vraies migrations/références construites en SQLite mémoire puis export complet VACUUM INTO une fois ; aucune durabilité/FK/timeout/assertion désactivée, pas de cache partagé. Modèles/actions/temps/blueprints inchangés, variante historique conservée. Fichiers persistants indépendants utilisés normalement ensuite par le banc technique et les tests.
- Typecheck OK, **27/27 ciblés**, **698/698 complets /80 fichiers /72,02 s**. Les trois tests d’origine sont inchangés ; test deux sessions ~0,44 s, Histoire ~0,24/0,30 s. Nouveaux contrôles d’export : intégrité/FK/migrations/modèles, isolation, journal DELETE/synchronous FULL, absence de fichier partiel après erreur et préservation d’une destination existante.
- Fixtures/instruments locaux supprimés, aucune ouverture Validation-MSI, aucune installation ni changement de workflow, de configuration Vitest ou des autres PR. Correctif local non poussé ; run GitHub précédent toujours échoué, aucun nouveau run/merge. Attendre nouvel accord AtoumWeb avant push et vérification réelle sur Windows hébergé.

## 09/10/2026 — Premier essai GitHub Actions autorisé sur #84

- AtoumWeb confirme avoir vérifié le budget Actions : 0 USD, Stop usage = Yes ; dépassements payants bloqués. Autorise un seul premier essai de quality dans le quota gratuit disponible, par nouveau commit sans skip. Aucun budget, paiement ou paramètre de facturation modifié par Codex.
- Workflow Windows hébergé/Node 24/npm ci/typecheck/tests deux workers inchangé. Ce commit déclenche le run de la PR #84 ; résultat à lire dans GitHub, aucune simulation locale présentée comme CI. Si GitHub refuse pour quota/facturation, arrêt sans relance ni contournement. Aucun merge ou accès Validation-MSI.

## 09/10/2026 — Préparation CI Windows hébergée, sans exécution facturable

- Branche technique indépendante depuis main@eb252d5c : quality sur windows-2022, Node 24 conservé, npm ci/lockfile et tests complets avec deux workers. Aucun module métier/UX, migration ou Validation-MSI modifié ; PR #80/#81/#82/#83 conservées.
- Vérification GitHub : Actions enabled/allowed_actions all, permissions dépôt admin/push, zéro runner local ; quatre PR draft et quality queued. Windows hébergé disponible selon GitHub ; quota/usage/budget du compte non vérifiables avec le jeton actuel (API billing 404 et scope user manquant, plan absent). Aucune modification des droits, budgets ou moyens de paiement.
- PR technique préparée avec marqueur [skip ci] : aucune exécution automatique, aucun résultat CI revendiqué. Arrêt avant lancement jusqu’à confirmation du quota restant et d’un blocage des dépassements, ou arbitrage explicite du coût. Après cela, nouveau commit sans marqueur pour tester la PR ; après fusion autorisée de la CI, mise à jour de #81/#83 pour créer de nouveaux runs utilisant ce YAML. Relancer leurs anciens runs ne change pas le workflow de leur ancien commit.

## 09/10/2026 — Checkpoint GitHub et fichiers de liaison autorisés

- AtoumWeb autorise la publication GitHub des sources validées et la mise à jour du suivi. Branche active **main** ; parent de consolidation **8e05a47296d478587b11841e36ca5acb2e936726**, origin/main identique après fetch. Le commit contenant cette entrée est le nouveau checkpoint ; push normal, sans merge ni force.
- Périmètre : Bibliothèque contractuelle, migration additive 66, 13 types/socles, liens versionnés Catalogue, restitution commune Devis/copies/PDF, corrections UX de la recette manuelle. **61 fichiers source/tests/documentation** ; aucune base SQLite, sauvegarde, capture, output ou donnée de recette dans Git. Anciens journaux conservés historiquement.
- README, HANDOFF MSI et état courant de la roadmap alignés sur main /1–66 /695 tests et recette manuelle en cours. Aucun nouveau développement pendant cette publication ; garde-fous inchangés, pas de publication/activation de référentiel, Abby manuel, pas de validation juridique globale ni travail Bridge/8C.
- Lanceur local : **C:/DEV/Lanceurs/AtoumWeb-Recette-Validation-MSI.cmd**, sources via npm start, contrôle du workspace Validation-MSI. Ancien lanceur/package du 29/09 obsolète ; aucun nouveau package livré. Aucune exécution ou remise à zéro de la base pour publier Git.
- Derniers contrôles : **695/695 tests, typecheck OK, UI 134 natifs +37 Prospection +21 préparation +20 options sur trois thèmes**, intégrité/FK correctes. Prochaine action métier : recette manuelle AtoumWeb sur la base existante.

## 09/10/2026 — Corrections de la recette manuelle Prospect / Devis / Contrat

- AtoumWeb autorise la correction des points UX signalés pendant sa recette. Les contrôles contractuels incomplets sont cliquables : ouverture des rubriques/accordéons, défilement et focus sur le premier champ concerné ; bilan de finalisation près du bouton, actualisé après enregistrement.
- Les informations connues proviennent des versions réellement vendues : objet, livrables, événements du preset de paiement, garanties explicites et hébergement/domaine inclus. Aucune qualification juridique, cession, date ou tarification de renouvellement inventée. Qualification avancée, décisions droits/renouvellement et données Catalogue absentes distinctes. Un brouillon incomplet se sauvegarde, sans autoriser sa finalisation ; un jalon peut porter une date ou un événement/délai convenu (JSON compatible, aucune migration nouvelle).
- Contrat/copies/PDF conservent la même source : sections lisibles, groupes de modules fondés sur les familles des versions vendues et périmètre/inclusions/exclusions. Les corps/applicabilités des clauses et anciens snapshots ne sont pas réécrits. Les valeurs administratives TEST sont refusées hors workspace de développement.
- Prospection : Site facultatif/absence explicite, Offres et Services séparés, alias de familles pour l’affichage seulement, contenus commerciaux partagés pendant le RDV et dans Devis, cartes repliables, contrôle avant devis indépendant, décisionnaire modifiable dans Qualification sur les mêmes contacts, défilement borné dans la référence détachée et l’annuaire, action de détachement dédupliquée. Noms/prix/totaux lisibles.
- Validation : typecheck OK, **695/695 tests**, **134 contrôles natifs App/preload/IPC**, **37 contrôles UI Prospection**, **21 préparation /20 options**, trois thèmes. Fixtures/workspaces temporaires uniquement ; aucun dossier automatique créé dans Validation-MSI. Contrôles readonly : 1–66, integrity_check ok, FK vide, 118 clauses /409 liens /13 types /112 rattachements ; le Prospect et le devis de la recette manuelle sont conservés (1 chacun).
- État de livraison : modifications locales non committées sur main, aucun push/merge/publication ni nouvelle sauvegarde. La fenêtre de recette réelle n’est pas redémarrée pendant une possible saisie non enregistrée ; le nouveau backend doit être chargé par un redémarrage normal après sauvegarde de cette saisie. Pas de recette globale automatique.

## 08/10/2026 — Aperçus de contrats de base pour les 13 types

- Retour AtoumWeb : lire le contrat de base sans devoir créer un Devis ; disponible pour tous les socles/types. Dans la Bibliothèque contractuelle, « Voir le contrat type assemblé » propose une référence Catalogue et le choix Professionnel/Particulier.
- Lecture seule : même sélection de clauses que le moteur Devis, socle commun selon audience, périmètre de la référence, clauses applicables et paramètres à compléter. La composition du type n’active pas les options disponibles non achetées. Aucun prix convenu/client/délai inventé, aucun snapshot ou dossier créé.
- Typecheck OK, 32 tests ciblés (dont 13 types et comparaison de toutes les tables avant/après aperçu), 687 tests complets, 106 contrôles natifs sur trois thèmes. Capture/cas uniquement temporaires. Validation-MSI : 13 types, 112 liens, migrations 1–66 et dossiers toujours à zéro ; aucune migration/publication/réinitialisation/sauvegarde nouvelle.
- Redémarrage normal pour charger les nouveaux handlers IPC/preload ; pas de recette globale. Aucun commit/push/merge. Prochaine action : consultation manuelle AtoumWeb des socles et modules.

## État réel — 08/10/2026 — migration 66 et types contractuels appliqués

- Autorisation AtoumWeb : appliquer 66 et initialiser les 13 types/112 rattachements validés, sans nouvelle sauvegarde, publication automatique ni recette globale. Seule correction métier : « Maintenance WordPress & WooCommerce » ; code MAINTENANCE, rattachements et composition inchangés.
- Renommage contrôlé par 15/15 tests ciblés. Les validations de préparation (684 tests complets, typecheck et UI 106/106) restent les contrôles précédents ; aucune suite globale relancée pour le libellé.
- Validation-MSI : migrations 1–66, 13 types et 13 compositions draft, 112 rattachements à des versions Catalogue, 0 composition publiée. 118 clauses et 409 liens existants conservés, comparaison des autres références et compositions avec le plan validé ; intégrité ok/FK vide, zéro dossier de recette créé.
- Sauvegarde existante réutilisée à la demande d’AtoumWeb ; aucune nouvelle sauvegarde. Application sous verrou, écriture concurrente refusée, rejeu 0 création /0 lien /112 inchangés. Rapport hors Git : outputs/parcours-contractuel-2026-10-08/application-reelle-66.json dans le workspace documentaire.
- Démarrage normal du Manager autorisé sur le workspace Validation-MSI existant ; aucune navigation de recette automatique. Aucun nouveau commit/push/merge. Prochaine action : recette manuelle AtoumWeb.

## Historique de préparation — 08/10/2026 — avant application de 66

- Base officielle : `main@8e05a47296d478587b11841e36ca5acb2e936726`. Pas de nouveau commit/push/merge pour cette passe. AtoumWeb a demandé explicitement de travailler sur ce main pour l’évolution contractuelle.
- Validation-MSI a été nettoyée après autorisation : dossiers commerciaux, Projets, opérations, documents et chronos fictifs retirés ; références et réglages conservés. Sauvegarde physique avant nettoyage et sauvegarde complète récupérable. Pas de nouvelle recette globale sur cette base.
- Types de contrat : quatre tables additives préparées en migration 66, avec rattachement à `catalog_versions`, aucune copie de texte. Les versions de modules et les 409 liens existants restent la source d’applicabilité ; type/composition ordonne sans activer les options non vendues.
- Bibliothèque contractuelle accessible depuis Documents & Contrats ; création, versions, modules, ordre, archivage et navigation bidirectionnelle Catalogue. Lecture Devis Contrat & CGV scrollable, copies Abby/contrat/tout et PDF utilisent une présentation commune ; présentation et références de types conservées dans les futurs snapshots. Les anciens snapshots restent inchangés.
- Initialisation sur copie uniquement : 13 types / 13 compositions BROUILLON et 112 rattachements à des versions Catalogue ; aucune conversion de `contract_type` legacy, notamment « test ». Rejeu neutre, tables de référence préservées.
- Vérification locale : typecheck OK, ciblés 85/85, suite complète 684/684, UI native ciblée 106/106 sur trois thèmes, ancien banc Builder 21/21. Tests/captures/projets uniquement temporaires. Une modification manuelle de texte ne conserve pas silencieusement la validation documentaire de l’ancienne rédaction.
- **Migration 66 NON APPLIQUÉE sur Validation-MSI ; base toujours en 1–65, propre, intégrité/FK correctes.** Manager fermé : ne pas le relancer sur cette base avant validation AtoumWeb de l’application. La migration est inscrite dans le registre local testé, donc un démarrage normal l’appliquerait.
- Prochaine action : restituer le bilan et obtenir validation avant application réelle. Pas de publication/activation automatique, aucun travail Bridge/8C.

## Historique — 08/10/2026 — documentation avant consolidation dans main

- Branche consolidée active : **`fix/pre-phase5-commercial-ux`**. Checkpoint fonctionnel validé : **`8662c3fbeaf2e3b26a68cffa779422f395edd400`**, après intégration de Phase 7 dans son parent `1f7dafc…` et port sélectif du réemploi guidé.
- Projet V2, Sites/Pages/compositions, Devis/contrats/Builder CGV, Catalogue 112, opérations et Phase 7 Statistiques/Rentabilité intégrés. **Migrations 1–65** ; aucun nouveau schéma pour le port.
- Dernière validation acquise : **typecheck OK, ciblés 56/56, complets 670/670, UI 55/55 sur trois thèmes, intégrité SQLite OK et foreign_key_check vide**. Les durées restent indicatives et les dossiers de Validation-MSI sont TEST/non productifs.
- Le parcours Projet → préparation indépendante → adaptation humaine → création volontaire d’une brique AtoumWeb avec provenance est désormais disponible sur les services actuels. **Ne pas fusionner #62** : seul ce parcours utile a été porté. **#68 reste un prototype historique de packs commerciaux .atoum V0.2**, non intégré et non bloquant ; ne pas le présenter comme fonctionnalité actuelle.
- Abby manuel ; aucune validation juridique globale des clauses ; Bridge WordPress, Lot 8C et futurs lots restent distincts. Les échanges déjà présents côté Manager sont conservés sans nouveau développement plugin.
- README et HANDOFF MSI remis à jour ; cohérence vérifiée avec ce suivi, la roadmap et AGENTS, dont les règles restent inchangées. Cette passe modifie uniquement la documentation ; les validations fonctionnelles ci-dessus restent celles du checkpoint 8662c3f.
- **Prochaine étape Git : PR finale `fix/pre-phase5-commercial-ux` → `main`**, après autorisation de push des commits locaux. Commit documentaire séparé autorisé, aucun push/PR/merge pendant cette synchronisation.

Les entrées datées suivantes sont le journal historique. Une ancienne mention de branche active, checkpoint, migration ou étape à venir ne remplace pas l’état courant ci-dessus.


## 08/10/2026 — Port sélectif du réemploi guidé depuis la PR #62

- Instruction AtoumWeb : ne merger ni #62 ni #68. #68 reste un prototype historique hors consolidation ; port du seul parcours UI guidé de #62 sur fix/pre-phase5-commercial-ux@1f7dafc, sans nouvelle migration ni reprise de service ancien.
- Panneau ajouté à la Bibliothèque technique du Projet actuel : choix de version source, copie de travail indépendante, adaptation du contenu/métadonnées et création volontaire d’une brique globale avec provenance. Backend ReusePreparationService et API prepareProjectItem/createGlobal/openPackage inchangés.
- Catégories actuelles reprises, dont code_snippet par défaut pour les snippets PHP/JavaScript. État cible par défaut « À adapter », verticale facultative. Relecture humaine requise avant création et réinitialisée après modification ; création réussie non rejouée par le panneau.
- Export simple conservé et libellé distinct, nouvelles versions, liens aux ressources, stabilité, historique et archivage conservés dans le nouvel écran. Aucune généralisation, création globale ou modification du Projet automatique ; seules les étapes explicites sont journalisées.
- Typecheck OK ; 56/56 tests ciblés de réemploi/référentiels ; 670/670 tests complets dans 77 fichiers. Un test de version source ancienne et code_snippet ajouté.
- Recette native App/preload/IPC : 55/55 contrôles sur AtoumWeb, Noir et Blanc. Préparation sans création globale, contenu/version exacts, adaptation humaine, création explicite unique, provenance et conservation des lignes/versions/fichiers Projet vérifiées. Ouverture OS capturée par le harness, chemin réel contrôlé ; services métier non simulés.
- Migrations exactement 1–65, aucune modification de leur code. Intégrité/FK vérifiées sur fixture et Validation-MSI en lecture seule. Aucun import réel, aucune réécriture du référentiel ou donnée client de Validation-MSI. Captures et rapports hors Git.
- Commit local dédié proposé ; arrêt avant push, fusion de PR ou consolidation vers main. Aucune fonctionnalité de packs commerciaux .atoum V0.2 reprise et aucun travail Bridge/8C.


## 07/10/2026 — Réalignement local Phase 7 sur le Manager consolidé

- Autorisation AtoumWeb : intégrer le HEAD de fix/pre-phase5-commercial-ux par merge normal dans feature/phase-7-analytics-v1, sans rebase, push ni fusion de PR #71. Source distante Phase 7 : 14da58bb2cc5c7bfe47f6000c670a8fd131bd8a3 ; cible intégrée : 4ada08050bd4ee40f9094b475dab04ec7083a1db. Les 44 commits spécifiques Phase 7 restent dans l’historique.
- Trois conflits Git résolus : ipc.ts conserve Analytics et TimePauseReason ; preload.ts expose Analytics et toutes les API consolidées, dont bridgeSnapshots ; App.tsx conserve la navigation et les réglages récents. Aucun ancien écran ne remplace silencieusement un écran consolidé.
- Les quatre vues Statistiques consolidées restent accessibles et par défaut. Phase 7 est raccordée dans « Rentabilité & analyse détaillée », avec ses périodes, comparaisons, volumes, délais, rendements et détails agrandis. Classes CSS Phase 7 isolées pour préserver les styles récents.
- Adaptations de compatibilité : suivi facturé lu dans billing_items et dépenses dans expenses ; aucun encaissement fictif. Estimations des projets opérationnels alignées sur les tâches actives, sans conteneur ni tâche archivée, sans transformer un cadrage incomplet en estimation finale. Calcul historique conservé pour les projets sans modèle opérationnel.
- 669/669 tests complets (77 fichiers), typecheck OK et 35/35 contrôles du vrai App/preload/IPC sur workspace temporaire, trois thèmes, sans erreur renderer. Statistiques, rendement, détails agrandis, Devis, Projets, opérations, catalogue et réglages vérifiés ; captures hors Git.
- Migrations 1–65 identiques au Manager consolidé, aucune migration nouvelle. Validation-MSI contrôlée en lecture seule : integrity_check=ok, foreign_key_check vide, 112 AW /118 clauses /409 liens. Aucun démarrage ni modification de cette base pour la recette UI.
- Prochaine action : clôturer le merge local puis restituer son hash, ses deux parents, le périmètre et un working tree propre. Aucun push ou merge GitHub sans nouvelle validation. Aucun travail Bridge/8C ; conservation de leurs API existantes uniquement.


## 07/10/2026 — Validation AtoumWeb et clôture locale autorisée

- AtoumWeb valide la recette des 112 références, les 655 tests, le typecheck, les migrations 63–65, l’intégrité/FK et le rejeu neutre. Commit local autorisé : « Catalogue 112 — parcours Devis, contrat et opérations », limité aux 62 fichiers proposés, sur la branche courante. Aucun push ni merge autorisé.
- Les quotas inutilisés sont perdus à la fin du cycle, sans report. Chaque nouveau cycle remet à disposition uniquement son quota prévu. Cette confirmation conserve la règle déjà implémentée et testée ; aucun changement fonctionnel supplémentaire.
- Les durées estimées, notamment Histoire à 27 h 30, restent des références internes indicatives, ajustables au dossier et recalibrables avec les temps réels. Elles ne constituent pas des durées contractuelles figées.
- Limites inchangées : environnement TEST, aucune validation juridique globale, Abby manuel, aucun paiement ou facturation réel, aucun travail Bridge/8C. Aucune modification de Validation-MSI pour le commit.
- Parent du checkpoint : 111b9196a7ee17ef1d9faa494d8b24197ca1086c. La prochaine étape reste soumise à une instruction séparée après restitution du hash et de l’état Git.

## 07/10/2026 — Intégration et recette des 112 références terminées

- **112/112 références avec dossier TEST accepté et preuve native : 94 en 8A, 18 en 8B.** Parcours réalisés dans App, preload, IPC et services réels. Les 45 dernières références ont été rejouées après correction d’une attente du harness, sans erreur de rendu.
- **655/655 tests déterministes dans 75 fichiers, typecheck OK, diagnostic sur fixtures 484/484 et 783 contrôles finaux en lecture seule.** Les tests normaux ne lisent pas Validation-MSI.
- Validation-MSI en migrations 1–65, intégrité ok et FK vide. 112 modèles courants et 112 associations courantes ready, catalogue en usage TEST, 118 clauses canoniques et 409 liens. Aucun lien BASE, LANDING-GESTION dormant et contrôle consumer hors bibliothèque textuelle. Rejeu des référentiels : zéro modification.
- 432 définitions d’actions conservées, 72 références 8A fixes et 22 variables, 24 variables tous lots. Classification 6 A / 6 B / 43 C / 39 D et mapping 59/33/24/30 intacts. Histoire : 899 €, 1650 min et 4 Pages ; Essentiel 630 min et Grand Jour 1020 min.
- Nouveaux cycles de date à date, facturation distincte et quota par cycle. Annuel : 12 cycles puis arrêt sans renouvellement. Mensuel : poursuite jusqu’à arrêt. Les routines futures reprennent la version vendue ; le calendrier historique reste inchangé. Tests des cycles du 15 au 14, quota renouvelé, treizième cycle refusé, mois courts et résiliation.
- Options : disponibilité sans effet ; achat de 2 Pages et Blog = 34 actions, 31 h et 8 Pages. Même Projet lors de révision et acceptation, renommage conservé et duplication sans modifier l’original. Crédits 3/5/10 h après 45 min : 135/255/555 min.
- Les 112 dossiers sélectionnés possèdent un document maître Client et un PDF TEST importé/rattaché avec SHA. Les essais intermédiaires restent TEST. Aucune édition/signature réelle Abby ni validation juridique globale. La publication contractuelle concerne le développement seulement.
- Rapport, matrice de 9 onglets, captures et preuves dans outputs/recette-native-112, hors Git. Limites : informations réelles et revue juridique avant production, qualification des Sites existants, administration des référentiels et ergonomie détaillée du Projet.
- **62 fichiers code/doc proposés au commit.** HEAD 111b919 sur feature/project-page-compositions-v1, aucun nouveau commit/push/merge. Message proposé : « Catalogue 112 — parcours Devis, contrat et opérations ». Arrêt pour validation avant commit ; Bridge et 8C hors périmètre.

## 07/10/2026 — Intégration112 en recette finale, migrations63–65 appliquées

- Autorisation globale AtoumWeb :94 références8A +18 références8B, vrais dossiersTEST dans Validation-MSI non productive. Source Git111b919 conservée, aucun commit/push/merge nouveau.
- Migrations63/64 appliquées après sauvegarde SQLite coordonnée. Migration65 appliquée après seconde sauvegarde et tests de conservation : ventes et cibles, crédits/mouvements, souscriptions/périodes/checks et interventions existantes conservés cellule par cellule, intégritéok/FKvide.
-112 modèles courants et112 associations courantes mis en usage par les services réels ;118 clauses publiées **pour recette de développement seulement**, sans déclaration de conformité juridique. Versions historiques conservées.409liens contractuels intacts.
- Raccords natifs : sélecteur AW/famille/version/prix, paramètres des lignes et suppléments rattachés, minimum détour45€ quantité réelle, minimum horaire1h sans unités fictives, particularités Histoire au Builder et snapshot, blocs Abby manuels, Projetprévisionnel/sync/acceptation même Projet, ventes8B et cibles explicites, routines/chrono/consommation.
- Recette a fermé le blocage module/Pageparente : Site résolu ne remplace jamais un parentPage pending ; module différé, puis créé sous la Pageexplicitement choisie. Conservation des réaffectations humaines et gardes existantes.
- Derniers compléments8B : GBP ciblé sur contexte d'établissement ; établissement supplémentaire dans **le même abonnement**, sans nouvelle souscription ; routine variable conserve la référence indicative et une estimation courante absente tant que non renseignée. Périodes futures utilisent le modèle de routines vendu, même si catalogue/plan évoluent.
- Décision AtoumWeb07/10 : **nouveaux abonnements de date à date depuis démarrage réel**, facturation indépendante,12cycles mensuels par engagement annuel ; quotas par cycle. Mensuel jusqu'à résiliation, annuel renouvellementexprès. Historiques calendaires inchangés. Configuration versionnée, aucun défaut calendaire imposé aux nouveaux dossiers.
-653/653 tests complets, typecheckOK au dernier état contrôlé. Recette finale112 en cours : ne pas déclarer112validés avant son résultat. Tests normaux surfixtures et bases temporaires ; bancdiagnostic maîtrisé conservé.
- FauxPDF imprimés pour simuler la pièce externe, puis véritable import Manager vers documentmaître Client avecSHA/rattachement. Aucun connecteur ou envoiAbby. Identité/TVA/médiation/RGPD de recette explicitementTEST, sans valeur réelle.
- Preuves : outputs/recette-native-112 horsGit. Sauvegardes physiques dans Validation-MSI/backups. Fichiers sources XLSX et référentiel contractuel canonique non réécrits ; anciens audits restent historiques.
- À achever : recette112 finale +thèmes/scénarios, contrôle final, classeur et bilan, commitproposé seulement.

## 06/10/2026 — Intégration native des 112 références autorisée, en cours

- Audit exhaustif validé. AtoumWeb autorise la clôture des raccords 94 références 8A **et 18 références 8B**, puis la recette exhaustive dans la vraie interface Manager sur Validation-MSI non productive. Cette autorisation remplace la suspension du Lot 8B opérationnel ; Bridge/8C restent hors périmètre.
- Checkpoint de départ `111b9196a7ee17ef1d9faa494d8b24197ca1086c`, branche `feature/project-page-compositions-v1`. Aucun nouveau commit/push/merge autorisé implicitement ; commit proposé à la restitution.
- Abby définitivement manuel : bloc commercial + Builder contractuel à copier, PDF accepté référencé ; aucun connecteur.
- Décisions conservées : Histoire899€/1650min/4Pages/33h vigilance, supplément urgent rattaché et sans production autonome, détour9€/image minimum45€ et quantité réelle, compléments checklists photo sans changement de temps, page document rattachée au principal, 22 estimations variables explicites.
- **Arbitrage complémentaire reçu** : mise en service hébergement99€/an incluse, avec estimation spécifique du dossier à renseigner ; aucun temps standard inventé. Routine20min et renouvellement distincts.
- Préparation code : migrations63 (règles commerciales versionnées/paramètres ligne) et64 (provenance des ventes8B/routines/quotas), non appliquées à ce stade. Réutilisation Quote/Builder/Projet, HourPack/Maintenance/Operations/Time ; pas de moteur parallèle.
- Premiers tests ciblés règles commerciales et ventes8B verts. Première suite complète : 635/643 ; écarts identifiés sur listes de migrations attendues et fixtures variables devenues insuffisantes, en correction explicite. Ne pas présenter la recette112 comme terminée.
- Prochaine action : terminer les raccords et contrôles, sauvegarder avant migration, mettre les référentiels nécessaires en usage par les vrais services dans cet environnement de développement, puis recette native112/112 avec dossiers TEST. Aucun prix/temps arbitraire.

## 06/10/2026 — Audit exhaustif 112 AW terminé, sans activation

- Checkpoint local du découplage **111b9196a7ee17ef1d9faa494d8b24197ca1086c**, branche feature/project-page-compositions-v1, 30 fichiers ; **630/630 tests, typecheck OK, Chromium 484/484**. Working tree propre au commit ; aucun push/merge. Sources/fixtures/doc uniquement, aucun artefact.
- Audit Validation-MSI en lecture seule directe : **112 références / 432 actions effectives (388 8A, 44 8B) / 409 liens contractuels exacts**. 112 modèles validés nativement, 94 politiques 8A valides ; aucune différence non autorisée au manifeste, seul Histoire V2 applique les arbitrages validés. Aucune application Histoire rejouée.
- Classement proposé du référentiel : **64 PRÊTE 8A / 28 À COMPLÉTER 8A / 18 LOT 8B / 2 BLOQUÉE**. Prête = données/raccords disponibles pour vente directe/base compatible, pas publiée ni recette complète. Les 28 incluent 22 estimations/plans Projet et six raccords/checklists. Deux urgences autonomes à 0 min (AW-CONT-URGENT-48/AW-TECH-URGENT) demandent clarification de portée.
- **72 références 8A chiffrées / 22 à estimation Projet obligatoire** (24 tous lots), toutes hypothèses initiales à recalibrer. 12 références avec structure, 41 nécessitant une cible. Les 146 mappings D restent 59/33/24/30. Les définitions historiques Histoire portent le total stocké à 442 actions sur toutes versions, pas 442 actions effectives.
- Défis transversaux : états actuels draft/inactifs, sélection publiée ancienne/lecture AW-version, options d'offres non configurées, données commerciales détaillées/bloc Abby, conditions particulières Histoire, estimation/production personnalisée et recette end-to-end réelle. **0 chaîne V1 complète utilisable actuellement**, conséquence des états et raccords, pas absence de moteur.
- 8B : services génériques périodes/quotas/checklists, interventions, packs/mouvements/solde, consommation/dépassements/rapports déjà présents ; raccords AW/version/ligne et paramètres/calendriers restent à construire. Aucun 8B artificiellement activé dans 8A.
- Rapport et classeur filtrable 11 onglets dans **outputs/audit-exhaustif-112-aw/**, hors Git : BILAN_AUDIT_112_AW.md et AtoumWeb_Matrice_112_References_2026-10-06.xlsx ; 432 actions détaillées/112 revues/118 clauses/409 liens, totaux calculés, aucune erreur de formule, vérification visuelle et export.
- Aucun état, prix, temps, règle métier ou donnée de recette modifié par l'audit. Aucun lot Devis/8B démarré, aucun push/merge. **Arrêt pour validation.** Seuls PROJECT_STATUS/roadmap mis à jour après le checkpoint, non committés ; aucun changement fonctionnel après les contrôles.

## 06/10/2026 — Découplage du banc technique avant checkpoint

- AtoumWeb autorise le correctif, la suite/typecheck/harness et le commit local si verts, puis l'audit exhaustif112AW ; aucun push/merge. Lot Devis et Lot8B non démarrés, aucune publication/ready pendant l'audit.
- Nouvelle doctrine : Validation-MSI = développement/test non productif, données mutables identifiées TEST. Plus de SHA/comptages immuables ni copies systématiques pour la recette métier. Sauvegardes avant migrations/destructions importantes, intégrité et versionnement conservés. AGENTS et exclusions Git alignés.
- Banc conservé comme diagnostic : source par défaut = fixture JSON versionnée (18 modèles/8 structures pour19scénarios), construite par les migrations et sans lecture Validation-MSI. Source explicite optionnelle pour diagnostic maîtrisé, jamais chemin de développement codé. Comptages calculés, validation par schéma/intégrité et non photographie de la base.
- Trois tests Histoire devenus fixture-based, dont état historique23h et état courant27h30/4Pages. Empreintes de documents/packages/fixtures conservées ; empreinte du JSON de fixture documentée, aucune empreinte Validation-MSI dans la suite normale. Fenêtres/harness alimentés par fixture, répertoires temporaires propres par test. Rollback du banc uniquement pour rejouer ses scénarios ; aucun mécanisme de recette utilisateur parallèle ajouté.
- 630/630 tests complets et typecheck OK ; harness Chromium 484/484, 19 scénarios × trois thèmes, sans source Validation-MSI. États métier du Manager, modèleHistoire appliqué et Validation-MSI non modifiés. Anciens simulateurs à SHA de checkpoint conservés comme outils historiques hors suite normale.
- Checkpoint prévu : **Lot 8A.2C — diagnostic opérationnel et checkpoint Mariage Histoire**, sources/doc/tests/fixtures uniquement, aucun SQLite/backup/capture/output. Harness vert : checkpoint local autorisé, audit 112 AW lecture directe ensuite, sans activation ni changement des temps.

## 06/10/2026 — Histoire appliqué au staging réel en BROUILLON uniquement

- Autorisation AtoumWeb appliquée : Catalogue Histoire **V3 draft / 899 €**, modèle opérationnel **V2 draft / 1650 min (27 h 30 internes provisoires)**, structure distincte **1 Site / 4 Pages**, profil inactif, association draft. UUID réels nouvellement alloués ; aucune réutilisation des IDs de simulation.
- Verrou EXCLUSIVE, sauvegarde physique SHA identique, concurrent writer refusé, plan/manifeste/code/Git recontrôlés. SHA avant=sauvegarde **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; SHA final après checkpoint/fermeture/rejeu **9aea84d704841cc8c29c2360031d10e99552514089082572441211b7dbcc65fb**. Aucun WAL/SHM/journal final.
- **108 contrôles application**, **148 contrôles indépendants Python ro/immutable** depuis sauvegarde. Intégrité ok/FK vide, schéma/migrations1–62 exacts. Rejeu complet logique et physique neutre ; mêmes IDs, aucun import/version/lien supplémentaire.
- Diff : quatorze tables avec ajouts seuls, sauf **catalog_items.updated_at** Histoire (une cellule de métadonnée). 104/118 tables identiques, anciennes lignes conservées. Templates8→9, versions9→10, nœuds59→64, Sites modèles8→9, Pages modèles17→21, profils7→8, catalogue159→160, raccords15→16, composants19→20, imports1→2, modèles112→113, liens94→95, activité483→484. Rapport complet hors dépôt.
- **113 modèles draft /0 ready ;95 associations draft /0 ready ;8 profils inactifs**. Essentiel630/GrandJour1020 exacts. Anciens Histoire899 €/23h, devis/projets/Sites/Pages/nœuds/temps, clauses118/liens409 conservés. Aucune Page RSVP/galerie/vidéo implicite.
- Conditions particulières automatiques toujours réservées au prochain lot Devis ; aucun texte de devis/contrat modifié. 33h = vigilance documentaire seulement. Aucun1290 €, ready/publication/activation, action/Projet/cible, Lot8B/Abby/Bridge/8C.
- Premier essai refusé sans écriture par garde trop strict sur les sidecars de son propre verrou ; SHA initial conservé. Garde sous verrou limité au WAL sans frame validée, répétition puis application réussies ; trace de refus conservée.
- Le banc operational-recipe conserve ses gardes du checkpoint antérieur et refusera la source après cette application, sans assouplissement automatique. Code fonctionnel/HEAD **c2bd002deec7e6742a24943132627c2d3a79bb5f** inchangés ; aucun commit/push/merge. **Arrêt pour validation.**
- Preuves/backup/IDs/diff : **outputs/mariage-histoire-33h-brouillon/application-reelle/BILAN_APPLICATION_HISTOIRE.md** (nom de dossier historique ; référence réelle27h30).

## 06/10/2026 — Histoire : dernier arbitrage 27 h 30 provisoires / 899 €, candidats seuls

- Consigne finale AtoumWeb prioritaire : structure 1 Site/4 Pages validée ; référence interne **1650 min/27 h 30 provisoires**, à recalibrer sur les premiers temps réels. **1980 min/33 h = estimation prudente/seuil de vigilance uniquement**. Répartir selon le scénario minimum de la revue : 90/150/420/150/240/150/150/150/90/60. Essentiel 630 et Grand Jour 1020 inchangés.
- Prix **899 € inchangé** ; aucune version à 1290 créée. Propositions 33 h standard et 1290 supersédées avant application, trace conservée. Candidat catalogue V3 draft (textes/périmètre seuls) + modèle V2 draft + structure Histoire distincte/profil inactif/association draft, dans manifeste hors dépôt ; aucune écriture réelle.
- Doctrine : mot de passe de Page seulement, pas de promesse de protection des URLs médias ; portail/protection renforcée hors standard. Livre d'or nom/message, sans compte, avec modération. Une intervention post-mariage maximum 120 min dans les 60 jours, incluse dans A05 240 min ; au-delà complément après accord. Responsable/modalités de modération et dates à renseigner, pas d'invention.
- Textes/checklists candidats adaptés au multipage/fonctions/tests/planification. Référence non dupliquée en durée catalogue et aucune promesse de temps Client. Aucun objet Lot8B, compteur de crédit ou facturation créé. La charge reste une hypothèse, pas un forfait de temps garanti.
- Clauses partagées **intactes** : zéro nouveau template/version/liens. Conditions particulières Histoire proposées via Builder existant ; dérogation explicite 60 jours à la règle générale trois mois pour cette seule prestation. `specialTerms` catalogue seul ne suffit pas lorsque des templates publiés sont liés ; injection/retrait automatiques non implémentés, vérification dans le devis requise avant usage.
- **47/47 contrôles natifs sur copie**, arithmétique/provenance/statuts/historique/rejeu/FK/integrity ; bibliothèque partagée inchangée. Aucun code moteur/UI modifié, suite complète 629 précédemment validée non relancée pour artefacts/documentation. Détail **docs/MARIAGE_HISTOIRE_REVISION_BROUILLON.md** ; manifeste/rapport dans outputs/mariage-histoire-33h-brouillon (nom de dossier historique, contenu courant 27 h 30).
- Validation-MSI SHA inchangé **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, anciens Histoire899/23h, devis/projets/temps/sourceXLSX intacts. Doctrine/matrice/actions/sources/changelog juridiques vivants actualisés, archives de recherche conservées.
- **Arrêt pour validation avant application.** Aucun staging réel, ready/publication/activation, migration/import réel, commit/push/merge, Lot8B/Abby/Bridge/8C.

## 06/10/2026 — Revue métier des 23 h Histoire, propositions sans application

- Structure Histoire 1 Site/4 Pages validée par AtoumWeb ; revue de charge autorisée sans modification de temps/modèle/staging/prix. Référence réelle maintenue à 10 actions/23 h et 899 €.
- **Propositions à arbitrer** : minimum 1650 min/27 h 30/32,69 €/h ; référence recommandée 1980 min/33 h/27,24 €/h ; prudent 2400 min/40 h/22,48 €/h. Ratio brut prix/temps, pas rémunération nette ou rentabilité démontrée. Prudent = +7 h/+21,2 % sur la proposition 33 h.
- Détail par action et hypothèses dans **docs/REVUE_CHARGE_MARIAGE_HISTOIRE.md**. Variation limitée aux A02/A03/A05/A06/A07 ; cinq autres budgets maintenus dans les propositions. Contenus fournis, solutions standard maîtrisées, protection standard sans portail membres, deux cycles bornés, une passe post-mariage bornée. Pas de montage/retouche/développement sur mesure inclus implicitement.
- Point critique : A05 150 min actuel trop serré pour protection/galerie/vidéo/livre d'or/post-mariage ; A06/A07 doivent couvrir quatre Pages, navigation et accès négatifs. Périmètre de protection des médias directs à préciser ; aucun mécanisme choisi ou activé.
- Aucune adoption de 33 h, marge ou réévaluation du prix. Validation-MSI SHA inchangé **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**. Documents de revue seulement ; aucun code, migration, modèle, temps, staging, ready/publication/activation réelle, commit/push/merge ou nouveau lot. **Arrêt pour arbitrage AtoumWeb.**

## 06/10/2026 — Correction préparatoire Mariage Histoire, arbitrage des quatre Pages appliqué sur copies

- AtoumWeb précise Histoire : **1 Site / 4 Pages** — Accueil `/`, Notre histoire `/notre-histoire/`, Le Jour J `/jour-j/`, Espace privé `/espace-prive/`. Espace privé = protection prévue pour galerie/souvenirs, vidéo/diaporama, livre d'or, contenus post-mariage ; aucune protection activée par le plan. RSVP/galerie/vidéo restent des sections/modules selon Projet, pas des Pages supplémentaires.
- Configuration versionnée **mariageHistoireStructure.json** ; préparation distincte du blueprint Page unique partagé, profil inactif et association candidate draft. Raccord Histoire remplacé seulement dans le savepoint de la copie de recette, puis rollback intégral. Aucun moteur normal ni schéma/migration modifié ; aucune application dans Validation-MSI.
- Essentiel et Grand Jour restent 1/1 ; Landing inchangée. Modèle Histoire, dix textes d'actions, checklist, catégories, minutes et politiques/cibles existantes intacts : **10 actions / 1380 min = 23 h**. Aucune multiplication des actions par quatre Pages.
- Quatre tests de non-régression ajoutés : profil distinct/draft/idempotence/rollback/historique ; refus du chemin réel ; vrai staging des trois Mariage et actions exactes ; génération synthétique des quatre slugs et conservation du partage one-page. Le moteur existant normalise les slugs de Projet sans slash final ; chemins de configuration/preview gardés comme demandés, aucune modification de ce moteur.
- **629/629 tests complets**, typecheck OK, Chromium **485/485**, 19 scénarios × trois thèmes. Histoire 1/4/10/23h, chemins et intention de protection contrôlés ; les 18 autres DTO identiques hors exposition descriptive des chemins et descriptions. Trois captures Histoire ajoutées aux 36 captures habituelles.
- Réserve métier avant validation de la charge : A02 architecture/navigation, A03 contenus des quatre Pages, A05 espace privé/enrichissements, A06 responsive multi-pages, A07 navigation/liens/accès protégé méritent précision/revue. Aucun intitulé n'impose une Page unique ; les 23 h ne sont ni changées ni certifiées suffisantes. Checklist protection/navigation non inventée ou ajoutée sans accord.
- Validation-MSI avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables exactes, migrations 1–62, 112 modèles draft / 94 liens draft / sept profils inactifs / zéro action/cible/achat. Le staging réel reste au checkpoint antérieur : seule la préparation sur copies est corrigée ; application réelle sur instruction distincte.
- Preuves : **outputs/mariage-histoire-4-pages/** hors dépôt. Aucun ready/publication/activation réelle, import/backfill, commit/push/merge, Lot8B/Abby/Bridge/8C. **Arrêt pour validation.**

## 06/10/2026 — Recette 8A.2C sur le principe, audit du vrai Devis

- AtoumWeb termine la recette sur le principe : operational-recipe reste un banc d'essai isolé du moteur, jamais une vue métier autonome. Parcours cible Prospect → Devis/prestations/options/clauses → préparation Abby → Projet prévisionnel → même Projet actif après acceptation ; le devis signé comprend le contrat, aucun contrat indépendant.
- Future vraie vue Projet : bloc global **Conditions avant démarrage** (devis accepté, acompte, contenus/visuels, accès, informations légales, autres prérequis), puis **Origine commerciale → Structure prévue → Affectation → Plan de travail**, ce dernier ouvert par défaut en production si pertinent. Réutiliser Sites/Pages/slug/sections/modules, actions manuelles, référence immuable/estimation courante/chrono et provenance ; ne pas ajouter ces fonctions au banc.
- Nouvelle décision : Mariage Essentiel et Grand Jour restent chacun 1 Site/1 Page ; **Histoire devient mini-site multipage**. L'ancienne décision commune 1/1 est dépassée pour Histoire uniquement, et demeure conservée historiquement. Configuration actuelle partagée 1/1 non modifiée : nombre/liste/rôles des Pages Histoire non précisés, question à AtoumWeb en attente. Aucune structure commerciale inventée, temps 10 actions/23 h non modifié. Préparer ensuite un profil/version distinct sans toucher la Page unique des autres formules.
- Audit maître : **docs/AUDIT_DEVIS_POST_RECETTE_8A2C.md**. Devis/option/CGV/snapshot/Client/Projet prévisionnel et moteur opérationnel existent ; principales limites : sélection privilégiant ancien publié, brouillons affichables mais refusés à l'ajout, zéro option configurée sur les V3, 118 clauses draft non consommées, runtime opérationnel exige ready, copie Abby limitée au texte contractuel, absence de taxonomie sous-catégorie et d'admin opérationnel complet.
- Exigence future de roadmap : séparation moteur / base métier ; administration depuis Manager des AW, taxonomie, types/prix/textes Abby/commerciaux, clauses, actions/temps, structures, capacités/cibles, versions/états ; exports complets et métier éditables, réimport avec diff/version brouillon. Architecture versionnée compatible, module non développé. Ne pas confondre publication commerciale/contractuelle et états opérationnels ready.
- Proposition minimale non démarrée : recette sur vraie UI Devis en workspace isolé avec faux dossiers explicites et consultation staging réutilisée, sans ready/publication/Projet matérialisé. Bout-en-bout acceptance/Projet V1 à cadrer séparément sans contourner les guards. Aucun nouveau gros développement.
- **174/174 tests ciblés**, huit fichiers existants. Validation-MSI source SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; contre-vérification avant/après et 118 tables inchangées dans outputs/audit-devis-post-recette-8a2c. Historique, 112 modèles draft, 94 liens draft, sept profils inactifs et zéro action/cible/achat conservés.
- Documentation seulement dans cette passe ; aucun code fonctionnel modifié, aucun import, ready, activation, publication, base/migration, commit/push/merge ou Lot8B/Abby/Bridge/8C. **Arrêt pour validation du diagnostic et précision des Pages Histoire.**

## 05/10/2026 — Lot 8A.2C, passe UX seule réalisée avant recette manuelle

- Validation technique AtoumWeb reçue, puis autorisation d'une passe UX seule. Aucune nouvelle règle métier, aucune modification de moteur, scénario, temps, quantité, mapping ou association.
- Vue principale : noms catalogue, quantités, actions/temps, Sites/Pages/modules, estimation complète/incomplète, option achetée/non achetée, destination définie/à choisir. Codes, UUID, états internes et provenance dans **Détails techniques** repliés par défaut, accessibles sur demande. Libellés accessibles des champs également simplifiés.
- Bandeau courant : **RECETTE — simulation uniquement — aucune donnée enregistrée**. Avertissement visible : rien activé ni enregistré dans devis/projets. Message SEO Performance conforme à la demande ; aucune résolution de destination inventée. Limites Landing existant / contextes / Sites historiques conservées en langage métier.
- **Typecheck OK ; Chromium 481/481**, 19 scénarios dans chacun des trois thèmes et quatre vues, 36 captures après + 36 captures avant conservées. **19 DTO complets strictement identiques** à la recette technique précédente. Empreintes des dix fichiers techniques protégés identiques ; état/effets/handlers UI inchangés. Suite **625/625** précédemment validée, non relancée pour cette passe de présentation uniquement.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, migrations 1–62, intégrité ok, FK vide, aucun WAL/SHM/journal source. Modèles/liens draft uniquement, profils inactifs, zéro action/cible/achat.
- Première passe Chromium interrompue par sa limite de 120 s ; délai du harness adapté, passe finale complète verte. Les copies des sessions terminées et échecs contrôlés sont supprimées. Une copie du premier processus interrompu reste dans **%TEMP%/atoumweb-operational-recipe-2e23Wn** : nettoyage shell refusé par la politique automatique, y compris fichiers explicites sans récursion. Source Validation-MSI intacte ; ce reliquat est signalé, aucun nettoyage global revendiqué.
- Passe limitée à six fichiers déjà dans le Lot 8A.2C : renderer TSX/CSS, harness UI, PROJECT_STATUS, roadmap commune et plan de recette. Preuves et galerie **outputs/operational-lot8a2c-ux/** hors dépôt. **Aucun commit/push/merge, ready, activation ou matérialisation. Arrêt pour recette manuelle AtoumWeb.**

## 05/10/2026 — Lot 8A.2C réalisé, recette manuelle à faire

- Plan et implémentation autorisés par AtoumWeb depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f**, branche **feature/project-page-compositions-v1**. Aucun commit/push/merge.
- Démarrage **--operational-recipe** avant workspace/restore/DatabaseService.initialize ; copie physique éphémère du staging réel, jamais de connexion en écriture à la source. Fixtures privées dans savepoint, rollback et comparaison exhaustive après chaque calcul. Moteur **OperationalStagingService.previewQuote**, adaptateur get/all uniquement.
- Fenêtre dédiée / preload restreint : cinq opérations état, références, scénarios, preview, fermeture. API métier normale absente ; propriétaire/frame et champs contrôlés. Aucun bouton/IPC ready, activation, Projet/action/cible ou chrono.
- UI trois thèmes, quantités/options de recette, choix logiques Site/Page, structure/actions/checklist/provenance/pending ; bandeau **BROUILLON — simulation uniquement — aucune donnée Projet créée**.
- **625/625 tests**, typecheck OK, Chromium **133/133** avec vraie IPC/preload et cycle de fenêtre ; **19/19 scénarios** dont AW-SEO-PERF pending, A04 site/integration ; **36 captures**. Aucun changement des temps, politiques, modèles ou migrations.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** strictement identique. Python SQLite ro/immutable : **118 tables identiques**, migrations 1–62, intégrité ok, FK vide, absence WAL/SHM/journal ; 112 modèles draft/0 ready, 94 liens draft/0 ready, sept profils readiness=0, zéro action/cible/achat. Historique intact.
- Nettoyage vérifié sur fermeture API/native et échec contrôlé d'initialisation/chargement. Rejeu déterministe, aucun résidu du scénario précédent. Refus métier de quantité/cible : rollback neutre, scénario corrigeable.
- Limites conservées : Landing sur Site existant non validé ; contextes D et Sites historiques pending. Options fixtures signalées comme non configurées dans l'offre réelle ; aucune résolution inventée.
- Preuves hors dépôt : **outputs/operational-lot8a2c/BILAN_LOT8A2C.md**, recette-chromium.json, source-before/after.json, journaux et captures. **16 fichiers code/doc**, aucune migration.
- **Arrêt pour validation AtoumWeb ; recette manuelle à faire. Aucun ready/activation/publication, Lot 8B, Abby, Bridge ou 8C.**


## Checkpoint courant — 05/10/2026 — Lot 8A.2C plan UX/technique proposé seulement

- AtoumWeb autorise uniquement la préparation du plan de recette visuelle BROUILLON, depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f** sur feature/project-page-compositions-v1. Working tree propre au départ. **Aucune implémentation autorisée à ce stade**.
- Lecture ciblée des moteurs staging, bootstrap, IPC/preload et composants existants. Le staging calcule déjà les plans, mais exige des lignes persistées et n’est pas exposé à la UI. Le démarrage Manager normal reconstruit des index : une simple page sans bouton de sauvegarde ne garantit pas l’invariance physique.
- Proposition documentée dans **docs/OPERATIONAL_LOT8A2C_PREVIEW_PLAN.md** : mode de lancement recette isolé, copie éphémère du staging réel, scénarios de lignes fictifs clairement signalés, IPC de consultation dédiée, arbre Sites/Pages/modules, actions/temps, provenance et choix logiques. Aucun changement des temps/quantités/politiques.
- Les fixtures d’options ne sont pas présentées comme une composition réelle de Vitrine/Landing V3. Limites explicites du staging actuel : Site/Page de base projetés sélectionnables ; contexts et Sites historiques non affectables par cette API, affichés pending. Aucune extension silencieuse.
- Scénarios prévus : 18 cas validés + vrai D pending AW-SEO-PERF ; gardes et tests envisagés pour source stable, refus de mutation, runtime draft, isolation, trois thèmes Electron et recette manuelle.
- Validation-MSI non ouverte en écriture, SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** recontrôlé, aucun WAL/SHM/journal. Aucun Manager lancé, aucune copie/scénario appliqué, aucun test/simulation lancé pour cette passe documentaire.
- **Plan proposé, non validé.** Seule documentation modifiée. Aucun code, migration, ready, activation, matérialisation Projet/action/cible, commit/push/merge, Lot8B/Abby/Bridge/8C. Attendre la validation du plan avant implémentation.

## Historique — 05/10/2026 — Lot 8A.2B clôture locale dédiée

- AtoumWeb valide le staging réel et autorise le commit local **Lot 8A.2B — stage operational structures and draft associations**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; SHA et vérifications sont consignés hors dépôt dans **outputs/operational-lot8a2b/application-staging-reel/cloture-git-lot8a2b.json**.
- Parent attendu **d9bbac5739310e5ed8ee1645fbad3db22f39ce79**, branche **feature/project-page-compositions-v1**. **27 fichiers code/doc validés** seulement ; aucun SQLite, backup, XLSX, CSV/JSON de preuves ou artefact inclus. Code fonctionnel et migration 62 inchangés depuis **600/600 tests et typecheck OK**.
- Validation-MSI vérifiée en lecture seule : migrations **1–62**, SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**. **112 modèles draft/0 ready ; 94 associations draft/0 ready ; 7 profils operational_ready=0 ; 0 action Projet ; 0 cible contribution**. Aucune écriture pendant cette clôture.
- Staging réel validé, previews et contre-vérifications conservés dans le checkpoint historique suivant. Vitrine/Landing V3 et sept structures demeurent draft ; aucune activation, publication, backfill ou reconstruction historique.
- **Recette manuelle AtoumWeb toujours à faire. Aucun push/merge, aucun Lot 8B/Abby/Bridge/8C. Arrêt après commit propre ; Lot 8A.2C non commencé.**

## Historique — 05/10/2026 — Lot 8A.2B staging réel BROUILLON seul, avant commit

- Autorisation AtoumWeb : staging réel BROUILLON seul. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés. 27 fichiers préparés, code exact des **600/600 tests + typecheck OK** ; aucun changement fonctionnel.
- Empreintes base/XLSX/manifeste/configuration vérifiées ; garde et plan réel recalculés sous verrou EXCLUSIVE, deuxième écriture refusée, sauvegarde physique juste avant écriture. SHA avant=sauvegarde **ea9869f40fcc4867b49d9efe33899fb3c567a236b0bd58760105c3519f861574** ; SHA final après fermeture/rejeu **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**.
- Migrations **1–62** inchangées. Ajouts seuls : templates 2→8, versions blueprint 2→9, nœuds modèles 29→59, slots Site 1→8, Pages modèles 5→17, profils 0→7, raccords catalogue-blueprint 3→15, liens opérationnels 0→94, versions catalogue 157→159.
- Vitrine V3 et Landing V3 **draft**, zéro composant historique hérité, zéro raccord historique hérité et un nouveau raccord explicite chacune. Sept structures draft / sept profils **operational_ready=0** / 94 associations **draft, zéro ready**. UUID réels nouvellement alloués ; les IDs modèles réels sont conservés.
- **112 modèles draft, zéro ready** ; 18 modèles 8B inertes, 432 actions exactes. Instances/cibles/achats zéro ; 112 AW / 112 catalogue V1 draft / 118 clauses draft / 409 liens conservés. Matrice D **59/33/24/30** exacte.
- Page unique partagée Landing/trois Mariage, Landing create/existing explicite, Mariage create uniquement. Capacités selon décisions validées ; aucun Site manuel/historique qualifié, aucune tâche de production dupliquée.
- **18/18 previews** depuis copies du staging réel et ses vrais IDs, 323 contrôles ; contre-épreuve D AW-SEO-PERF réellement pending. Vitrine 21/24h30/1Site/5Pages ; Landing 13/12h45/1/1 ; Woo 20/42h30/1/4 ; Vitrine+2Pages+Blog 34/31h/8Pages. Options disponibles non achetées sans effet. Runtime normal refuse draft ; aucun Projet/action/cible matérialisé.
- **109/118 tables identiques**, neuf tables avec ajouts seuls ; toutes les anciennes cellules/multiplicités conservées. 17511 contrôles application ; 559 contre-vérifications Python indépendantes depuis sauvegarde. Trois devis / deux Projets / tous Sites/Pages/nœuds/sessions et blueprints historiques intacts.
- Rejeu exact : 69 lignes structurelles, 12 raccords, deux V3, 94 liens unchanged ; aucune mutation logique ou physique. Intégrité ok, FK vide, aucun WAL/SHM/journal.
- Bilan/SHA/94 IDs/manifeste réel/previews : **outputs/operational-lot8a2b/application-staging-reel**, hors dépôt. Préparations et conclusions historiques conservées.
- **Arrêt après staging réel. Aucun ready, publication, commit/push/merge, backfill/recalcul, Lot 8B/Abby/Bridge/8C. Recette manuelle AtoumWeb toujours à faire.** Suite uniquement sur nouvelle instruction.

## Historique — 05/10/2026 — Migration 62 seule appliquée, avant commit

- AtoumWeb valide la préparation corrigée 8A.2B et autorise **uniquement migration 62** sur Validation-MSI. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés ; 27 fichiers préparés et code exact des **600/600 tests + typecheck OK**. Aucun commit/push/merge ; aucun nouveau changement fonctionnel.
- Protocole répété sur copie puis réel : verrou EXCLUSIVE, deuxième écriture refusée, sauvegarde physique juste avant écriture et garde recalculée. Source/sauvegarde SHA **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607**. SQL strictement identique à la préparation validée ; migrations 1–61 inchangées.
- Registre désormais **1–62** ; seule colonne **catalog_operational_links.status draft/ready** et triggers/index préparés. UPDATE historique vers ready **0 ligne affectée**, aucun lien présent.
- Après checkpoint/fermeture/rejeu : SHA **ea9869f40fcc4867b49d9efe33899fb3c567a236b0bd58760105c3519f861574**, aucun WAL/SHM/journal. Intégrité **ok**, FK **vide** ; rejeu du vrai point d'entrée migrations **[]**, mutations logique et physique zéro.
- **118 tables historiques contrôlées**, toutes les anciennes cellules conservées ; **117 tables hors ledger sans modification de données**, 61 anciennes migrations exactes + ligne 62. Contre-vérification indépendante read-only immutable depuis la sauvegarde, schémas/colonnes historiques et séquences conservés hors seules modifications autorisées.
- **112 modèles draft / 0 ready**, payloads/import/provenance/IDs/dates strictement identiques. Associations/profils/instances/cibles **0**. 112 AW, 112 versions catalogue V1 draft, 118 clauses draft, 409 liens, 0 achat d'option exacts. Trois devis sans action opérationnelle ; deux Projets, trois Sites, onze Pages, 36 nœuds, six sessions et deux versions blueprint conservés.
- Aucune structure réelle, Vitrine V3/Landing V3, version commerciale, raccord catalogue-blueprint, ready, backfill/recalcul ou objet Lot 8B créé. La préparation candidate sur copies reste séparée et non autorisée pour application.
- Preuves/bilan/sauvegarde/répétition/contre-vérification : **outputs/operational-lot8a2b/application-migration62**, hors dépôt. Recette manuelle AtoumWeb toujours à faire.
- **Arrêt après migration 62 ; ne pas commencer le raccord réel. Aucun commit/push/merge, Lot 8B/Abby/Bridge/8C.** Attendre l'instruction suivante.

## Historique — 05/10/2026 — Lot 8A.2B, blocages fermés en préparation sur copies

- AtoumWeb autorise la préparation du cycle relationnel draft→ready des associations, migration 62 si nécessaire, et Landing V3 autonome. Aucune application réelle autorisée. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés ; aucun commit/push/merge.
- **Migration 62 préparée seulement** : colonne catalog_operational_links.status explicite, défaut draft ; anciennes associations éventuelles conservées avec ready pour préserver leur comportement, activation indépendante contrôlant modèle/profil/capacités, contenu immuable et aucune rétrogradation. Migrations 1–61 inchangées. **Ne pas démarrer Manager sur Validation-MSI tant que 62 pendante/non autorisée.**
- Staging lit les devis/lignes et associations enregistrés sur copie avec les **IDs modèles réels**. Plans marqués staging, impossibles à matérialiser ; runtime filtre ready et markReady ne peut activer un lien draft, notamment C/D. Anciennes révisions actives/épinglées préservées.
- Copie : **7 structures draft / 7 profils operational_ready=0 / 94 associations draft / 12 raccords structurels / Vitrine et Landing V3 draft** sans atoumweb-web-v1 ni raccord hérité. 112 modèles draft / 0 ready, zéro action/cible/Projet généré. 6 A / 6 B / 43 C / 39 D ; D **59/33/24/30** inchangée.
- Capacités explicites : Vitrine/Page unique wordpress ; Woo wordpress+woocommerce. Addons provides=[] consomment la base ; aucun Site manuel/historique implicitement qualifié. Page unique partagée Landing/Mariage, rôles commerciaux conservés. Liens contractuels exacts.
- **600/600 tests (68 fichiers), typecheck OK** ; 18 scénarios du staging enregistré et contre-épreuve D AW-SEO-PERF réellement pending. 17 249 contrôles dry-run, 17 151 contre-vérifications indépendantes, zéro échec. Aucun changement UI/thème ; recette manuelle toujours à faire.
- Les anciens intitulés D pending ne démontraient pas une cible manquante : cadrage WordPress sans cible et application classée C. Mapping conservé ; AW-SEO-PERF démontre quatre actions, zéro Site/Page, un slot Site pending. Rejeu : 69 lignes structurelles, 12 raccords, 94 liens et deux V3 inchangés, zéro mutation logique/physique.
- Toutes les anciennes cellules de la copie conservées ; **108/118 tables identiques**, dix avec ajouts seuls. **Validation-MSI 118/118 tables inchangées, migrations 1–61**, SHA **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607** ; XLSX exact. Profils/liens/instances/cibles réels zéro. Historique, 112 AW, 112 catalogue V1 draft, 118 clauses draft et 409 liens conservés.
- Bilan/SQL/manifeste/CSV94/IDs/scénarios/logs/preuves : **outputs/operational-lot8a2b/staging-draft**, hors dépôt. Préparation partielle précédente conservée historiquement.
- **Arrêt avant application réelle.** Aucun ready, import réel supplémentaire, version/structure/association réelle, backfill, recalcul, publication, Lot 8B/Abby/Bridge/8C. Autorisation séparée pour la suite.

## Historique - 05/10/2026 - Lot 8A.2B, preparation seule avec blocages identifies

- Preparation autorisee sur copies seulement. HEAD d9bbac5739310e5ed8ee1645fbad3db22f39ce79, code et migrations inchanges. Seuls les deux documents de suivi deja modifies sont actualises ; aucun commit/push/merge.
- 94 candidats avec IDs REELS : 6 A / 6 B / 43 C / 39 D ; matrice D 59/33/24/30 conservee. Sept structures draft/operational_ready=0 sur copie, six nouveaux templates, zero tache de production. Future Vitrine V3 preparee en JSON seulement, aucune creation commerciale meme sur copie.
- Copie : versions 2->9, profils 0->7 ; 30 noeuds / 7 slots Site / 12 Pages template ajoutes ; historique conserve. Rejeu structures neutre logique/physique. 112 modeles draft / 0 ready. Liens, instances et cibles zero ; 18 modeles 8B inertes.
- Blocage technique reproduit : simulate/link exigent ready pour un lien, 94 refus attendus sans contournement. Proposer staging draft separe de l activation, aucune implementation ici. Blocage Landing reproduit : atoumweb-web-v1 apporte Vitrine V1 et la composition v2 le refuse ; traitement versionne a valider.
- 18 scenarios de planification, jamais conversions materialisees. 553 controles reussis, 107/107 tests cibles, typecheck OK. Mappings A/B candidats a relire ; D valide. Page unique partage la geometrie, roles commerciaux AW conserves, role SQL standard sans override implicite.
- Validation-MSI 118 tables inchangees cellule par cellule, migrations 1-61, SHA e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607. Profils/liens/instances/cibles zero. Livrables hors depot outputs/operational-lot8a2b.
- Arret avant application. Fermer les blocages et refaire un dry-run complet avant import. Aucun ready/publication/backfill/recalcul/8B/Abby/Bridge/8C. Recette manuelle toujours a faire.

## Historique — 05/10/2026 — Lot 8A.2A, import réel BROUILLON seul appliqué

- AtoumWeb autorise l'import réel strictement limité aux versions de modèles en draft. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés. Code fonctionnel/migrations inchangés ; deux documents de suivi seulement modifiés, aucun commit/push/merge.
- Empreintes validées recontrôlées sous verrou SQLite EXCLUSIVE et plan réel recalculé : **112 create / 0 unchanged / 0 conflit**, jeton **940cad726862ffc8197dadf0b7382e6aec7ad3dad76bcc0f0bd3139810827f13**. Seconde écriture refusée ; sauvegarde physique SHA égal à la source **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**. XLSX/manifeste/empreinte canonique inchangés.
- Seules **operational_import_runs 0→1 / operational_model_versions 0→112** changent ; journal réel **b76ea681-fefd-452e-872c-c39b0002fa83**. **112 versions n°1 draft / 0 ready**, **94 modèles 8A / 18 modèles 8B inertes**, **432 définitions d'actions**, **24 estimateRequired (22 8A / 2 8B)**, catégories 418/14. Trois packs restent sans actions ni crédits activés. Matrice D séparée **59 none / 33 site / 24 page / 30 context**, non activée.
- Les quatre tables blueprint_operational_profiles, catalog_operational_links, project_action_instances, project_contribution_targets restent **vides**. Aucun blueprint V2, version commerciale, association, recalcul, backfill, pack, abonnement, intervention ou objet opérationnel créé.
- Application et répétition sur copie : **681/681 contrôles chacune**, intégrité OK/FK vide. Rejeu réel avec plan recalculé **112 unchanged / 0 create**, zéro INSERT/nouveau journal, aucune mutation logique ou physique. Checkpoint/fermeture, aucun WAL/SHM/journal. SHA final **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607**.
- **116 autres tables strictement identiques cellule par cellule**, schéma et séquences inchangés ; contre-vérification indépendante Python depuis la sauvegarde et le baseline validé. Trois devis historiques résolus à **zéro action opérationnelle**. 112 AW / 112 catalogue V1 draft / 118 clauses draft / 409 liens / options zéro ; Projets/Sites/Pages/nœuds/sessions/blueprints et documents historiques conservés.
- Bilan/IDs réels/CSV/plans/trace SQL/preuves : outputs/operational-lot8a2a/application-reelle, hors dépôt. Préparation antérieure conservée comme snapshot historique. Tests ciblés **87/87** et typecheck OK de la préparation : pas de nouvelle exécution de suite, aucun changement applicatif.
- **Arrêt après import. Ne pas commencer Lot 8A.2B. Aucun ready/raccord/activation Lot 8B, Abby, Bridge ou 8C. Recette manuelle AtoumWeb toujours à faire. Aucun commit autorisé.**

## Historique — 05/10/2026 — Lot 8A.2A, import des modèles BROUILLON préparé seulement

- Base technique vérifiée avant toute préparation : working tree **propre**, branche `feature/project-page-compositions-v1`, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79**. Validation-MSI migrations **1–61**, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**, 118 tables, aucune écriture réelle.
- Manifeste réextrait du XLSX **inchangé** et identique au référentiel validé : **112 modèles / 432 actions** ; **94/388 Lot 8A**, **18/44 Lot 8B**. 22 estimations obligatoires 8A et deux autres 8B conservées ; catégories 418 Inclus au forfait / 14 Supplément facturable ; trois packs heures zéro action. A16/A19 Vitrine complétés selon décisions validées, sans changer les temps. Matrice D **59 none / 33 site / 24 page / 30 context** conservée documentairement, aucune activation.
- Importeur existant inchangé : dry-run sur copie **729/729 contrôles**, **112 versions n°1 en draft**, **1 ligne operational_import_runs**, aucun ready/lien/profil/Projet/action réelle/cible/blueprint/version commerciale. Les IDs catalogue sont exacts ; les UUID modèle/import générés sur copie sont uniquement des preuves de simulation, les UUID réels seront alloués par l'importeur au moment autorisé.
- Rejeu : plan recalculé **112 unchanged**, zéro INSERT et zéro mutation logique/physique. Jeton initial après import périmé et refusé. Changement synthétique de note → V2 draft, puis rollback intégral ; aucune modification des valeurs métier. Absence de conflits présents : 112 codes trouvés exactement, tables opérationnelles vides. Les autres 116 tables et le schéma sont inchangés sur copie.
- **87/87 tests ciblés, typecheck OK**. Les trois devis historiques résolus en lecture seule sur copie restent sans action opérationnelle rétroactive. Les modèles importés mais non associés ne génèrent rien ; une tentative nouvelle avec la dernière version catalogue est bloquée explicitement par la garde de compatibilité existante, pas préparée implicitement.
- Livrables hors dépôt `outputs/operational-lot8a2a` : manifeste réel, enveloppe/empreintes, plan initial, IDs/versions et actions en CSV, dry-run, diff attendu, preuves et logs. Seuls ce suivi et la roadmap sont actualisés dans le dépôt ; aucun changement fonctionnel ni migration.
- **Arrêt avant import réel** : Validation-MSI et XLSX intacts, six tables cibles/opérationnelles toujours vides. Aucun ready, association, Vitrine V2, nouvelle version commerciale, recalcul/backfill, commit/push/merge, Lot 8B activé, Abby, Bridge ou 8C.

## Historique — 05/10/2026 — Lot 8A.1, clôture locale dédiée autorisée

- AtoumWeb valide la migration 61 et autorise le commit local **Lot 8A.1 — secure structural targets and contribution policies**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; son SHA et les contrôles sont consignés hors dépôt dans `outputs/operational-lot8a1/cloture-git-lot8a1.json`.
- Parent attendu **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e**, branche `feature/project-page-compositions-v1`. **40 fichiers Lot 8A.1** vérifiés ; aucun artefact de base/sauvegarde/XLSX/capture/JSON de simulation inclus. Code fonctionnel et migration 61 identiques aux empreintes validées : **590/590 tests, typecheck OK, UI 180/180, simulation 971/971**. Les trois documents post-application ne font que refléter les décisions et résultats validés ; cette clôture ajoute uniquement leur suivi.
- Matrice D V1 : seule correction **AW-SEO-PERF-A04 → site/integration**, répartition **59 none / 33 site / 24 page / 30 context**. Aucune activation ni modification XLSX.
- Validation-MSI en migrations **1–61**, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33** conservé sans écriture pendant clôture. `project_contribution_targets` et les cinq tables Lot 8A vides ; aucun import, modèle ready, Vitrine V2, nouvelle version commerciale ou raccord réel.
- **Recette manuelle AtoumWeb toujours à faire. Aucun push/merge, aucun Lot 8B, Abby, Bridge ou 8C. Étape suivante non commencée ; arrêt après commit.**

## Historique — 04/10/2026 — Migration 61 seule appliquée, commit non autorisé

- AtoumWeb valide la préparation 8A.1 et la matrice D V1 avec une correction unique : **AW-SEO-PERF-A04 none/integration → site/integration**. Répartition finale **59 none / 33 site / 24 page / 30 context = 146 actionKey** ; aucun autre mapping changé. Matrice validée mais non activée, XLSX inchangé.
- Avant écriture : branche `feature/project-page-compositions-v1`, HEAD **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e**, **40 fichiers** conformes aux empreintes du bilan, index vide. Aucun code fonctionnel modifié depuis les contrôles **590/590, typecheck OK, UI 180/180, simulation 971/971**. Verrou SQLite exclusif, seconde écriture refusée et sauvegarde physique avant migration.
- SHA source = sauvegarde **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** ; SHA final après checkpoint/fermeture/rejeu **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**. Migrations **1–61** ; `project_contribution_targets` présente et **vide**. Aucun WAL/SHM/journal résiduel. Intégrité OK/FK vide. Rejeu du point d’entrée migrations neutre logiquement et physiquement.
- **117 tables historiques conservées cellule par cellule**, contre-vérification indépendante depuis la sauvegarde. Exception explicite attendue : `schema_migrations` conserve exactement ses lignes 1–60 et reçoit seulement la ligne 61. Séquences SQLite, schémas historiques et catégories business_category historiques inchangés/NULL.
- Cinq tables 8A toujours vides ; 112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options zéro. Trois devis, deux Projets, trois Sites, onze Pages, 36 nœuds, six sessions, deux versions blueprint conservés.
- Aucun import, modèle réel, ready, Vitrine V2 réelle, nouvelle version commerciale, association opérationnelle, backfill, cible ou recalcul. Aucun Lot 8B, Abby, Bridge ou 8C. **Aucun commit/push/merge ; recette manuelle toujours à faire. Arrêt avant toute activation réelle.**
- Preuves et bilan réel : `outputs/operational-lot8a1/application-migration61-validation-msi.md/json`, `contre-verification-migration61.json`, `sauvegarde-migration61-sous-verrou.json`. Les preuves de préparation antérieures sont conservées comme snapshots historiques.

## Historique — 04/10/2026 — Lot 8A.1 préparé, aucune application réelle

- HEAD **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e** et branche `feature/project-page-compositions-v1` conservés. Aucun commit/push/merge. Préparation autorisée des politiques A/B/C/D, plan v2 multi-bases, cibles persistées et contrôles quantité/capacités.
- Migration **61 additive préparée uniquement** : seule nouvelle table `project_contribution_targets`, quatre index, six triggers. Migrations 1–60 inchangées. Première affectation D après acceptation historisée sans révision commerciale ; actions dépendantes bloquées en pending. Sites manuels/historiques sans capacité implicite.
- **590/590 tests, typecheck OK, UI 180/180 sur trois thèmes, simulation SQLite sur copie 971/971 (47 scénarios)**. Recette manuelle AtoumWeb à faire. Matrice **39 D / 146 actionKey proposée, non validée pour activation**.
- Validation-MSI **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** identique avant/après ; 117 tables existantes comparées, intégrité OK/FK vide, aucun WAL/SHM/journal. Cinq tables 8A toujours vides. 112 AW, 112 catalogue BROUILLON, 118 clauses BROUILLON, 409 liens et tout historique inchangés. XLSX opérationnel inchangé.
- Aucun import réel, ready, Vitrine V2 réelle, nouvelle version commerciale, association métier, backfill ou objet Lot 8B. Aucun Abby, Bridge ou 8C. **Ne pas démarrer Manager sur Validation-MSI : 61 pendante.** Attendre le feu vert distinct pour toute application réelle.
- Bilan : `docs/OPERATIONAL_LOT8A1_TARGETS.md` ; SQL exact, matrice, rapports, logs, captures et preuves dans `outputs/operational-lot8a1`, hors dépôt.

## Historique — 04/10/2026 — Lot 8A appliqué, clôture locale dédiée

- AtoumWeb valide la migration 60 seule et autorise le commit local dédié **Lot 8A — actions opérationnelles, temps et provenance**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; son SHA et les preuves sont consignés hors dépôt dans `outputs/operational-lot8a/cloture-git-lot8a.json`.
- Avant commit : **36 fichiers préparés**, toutes les empreintes validées conformes, aucun artefact de base/sauvegarde/XLSX/JSON de simulation/capture inclus. Code fonctionnel et migration 60 identiques à **534/534 tests, typecheck OK, UI 69/69, simulation 209/209**. Seuls les documents de suivi et le bilan préparatoire sont actualisés pour refléter l’application et cette clôture.
- Validation-MSI **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** conservé sans écriture pendant clôture. Sauvegarde avant migration : **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, égal à la source sous verrou ; seconde écriture refusée. 113 tables historiques comparées exhaustivement et contre-vérifiées indépendamment, intégrité OK/FK vide, rejeu neutre logiquement/physiquement, aucun auxiliaire résiduel.
- Les cinq tables `operational_import_runs`, `operational_model_versions`, `blueprint_operational_profiles`, `catalog_operational_links`, `project_action_instances` sont **vides**. Colonnes business_category historiques **NULL**. Aucun import XLSX, modèle réel, ready, Vitrine V2 réelle, association opérationnelle, recalcul ou backfill.
- 112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options vides intacts ; les trois devis et deux Projets, Sites/Pages, nœuds, sessions, blueprints et documents historiques conservés. Aucun objet Lot 8B.
- **Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Raccord réel des associations commerciales non commencé.** Aucun Lot 8B, Abby, Bridge ou 8C ; aucun push/merge. Attendre une nouvelle autorisation avant import ou raccord réel.
- Bilan préparatoire `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md` ; application réelle et contre-vérification dans `outputs/operational-lot8a/application-migration60-validation-msi.md/json` et `contre-verification-migration60.json`, hors dépôt. Les manifestes préparatoires validés sont conservés historiquement sans réécriture.

## Historique — 04/10/2026 — Lot 8A opérationnel préparé, copie uniquement

- Décisions AtoumWeb appliquées au manifeste : A19 point de restauration avant publication et A16 consentement uniquement technique, 60 min chacune inchangées ; A12 pages légales, A21 sauvegarde livraison. XLSX intact. Projet standard V1 strictement historique.
- Migration **60 préparée seulement** : cinq tables, deux colonnes métier nullable, références initiales/compatibilités immuables. Versions des modèles indépendantes des publications catalogue/clauses. Aucun backfill.
- Audit complet : Vitrine V1 13 tâches / 525 min inchangée ; V2 structurelle simulée sans ces tâches, conteneurs/Site/5 Pages conservés. V1 publiée maintenue ; V2 draft mise en usage opérationnel explicite/figée, associations exactes versionnées. Ancienne V1 + modèle bloquée ; structure sans modèle bloquée.
- **112 modèles / 432 actions importés en BROUILLON sur copie** : 94 refs/388 actions 8A ; 18 refs/44 actions 8B inertes ; trois packs zéro action ; 22 refs 8A à estimation obligatoire gardent estimation courante NULL. Aucun mapping réel inventé ni publication.
- **534/534 tests (63 fichiers, 31 nouveaux), typecheck OK, UI 69/69 sur trois thèmes, simulation SQLite 209/209**, intégrité OK/FK vide. Vitrine 21 actions/24 h 30 ; +2 Pages 29/28 h ; +Blog 34/31 h ; pack 4 articles 4/13 h ; application 3/3 h indicatives, estimation finale absente.
- Génération intégrée au Projet prévisionnel et aux révisions/acceptation ; provenance complète, versions épinglées, manuel conservé, retrait vierge et conflits travaillés. Chrono existant inchangé dans son calcul hors pauses ; cinq catégories métier historisées. Recette manuelle AtoumWeb à faire.
- Validation-MSI **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, et XLSX **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangés. 112 AW/112 catalogue draft/118 clauses draft/409 liens/achats vides/historiques intacts.
- Branche `feature/project-page-compositions-v1`, HEAD **378f11568cddc462e29df6117425631e03e89b80** inchangé. Aucun commit/push/merge ni application réelle ; **ne pas démarrer Manager sur Validation-MSI (60 pendante)**. Aucun Lot 8B, Abby, Bridge ou 8C.
- Bilan `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md`, matrice exhaustive 112 et preuves dans `outputs/operational-lot8a` du dossier documentaire partagé. Les associations commerciales réelles, notamment le service historique inclus lié à Vitrine V1, restent à configurer explicitement après autorisation : les scénarios commerciaux sont synthétiques, le blueprint cloné est réel.

## Historique — 04/10/2026 — Lot 8A, audit des blueprints avant préparation

- AtoumWeb valide une seule source de tâches de production, une nouvelle version structurelle Vitrine et une compatibilité versionnée explicite avec les modèles opérationnels. Préparation locale seulement ; aucun commit ni application de migration 60 sur Validation-MSI.
- Audit exhaustif de la base en lecture immutable : **2 blueprints / 2 versions publiées / 14 tâches**. Vitrine V1 : 13 tâches / 525 minutes, conservées avec PRO-2026-002 ; Projet standard V1 : une validation de livraison sans estimation ni liaison AW, conservée avec PRO-2026-001.
- **Arrêt conformément à la consigne sur les tâches complémentaires** : `launch.backup_before` (15 min) prévoit un point de retour avant publication, non explicite dans A19/A21 ; `quality.rgpd` (45 min pour la tâche entière) inclut le contrôle du bandeau/consentement, non explicite dans A12/A16. Aucun retrait, fusion, neutralisation ou changement du XLSX. La validation de livraison du modèle standard n'a pas de périmètre suffisant pour être rapprochée d'un modèle AW.
- Proposition soumise à AtoumWeb : confirmer les deux contrôles dans le périmètre des actions A19 et A16 et dans leurs temps existants, ou décider explicitement d'un complément avec effet sur les cibles. Aucune décision appliquée. Le modèle standard non lié au catalogue reste hors associations V1.
- Rapport et **matrice complète des 112 AW** : `C:/Users/AtoumWeb/Documents/ChatGPT/manager atoumweb+ bridge/outputs/operational-lot8a/audit-blueprints-et-matrice-aw-lot8a.md`. Aucune version opérationnelle, compatibilité ou nouvelle version structurelle créée. Migration 60 non créée.
- Validation-MSI toujours migrations **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc** ; XLSX opérationnel SHA **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangé. Code fonctionnel inchangé ; contrôles 503/503/typecheck/UI 54/54 restent les contrôles du 7B, aucune validation technique 8A annoncée.
- Seul suivi documentaire mis à jour. Aucun backfill, publication, commit/push/merge, Lot 8B, Abby, Bridge ou 8C. Attendre la décision sur ces compléments avant reprise.

## Checkpoint courant — 04/10/2026 — Clôture locale dédiée Lot 7B

- AtoumWeb valide l'application réelle et autorise le **commit local dédié Lot 7B — projet prévisionnel et révisions commerciales**, sans push ni merge. Le commit contenant ce bloc clôture localement le 7B ; son SHA est consigné hors dépôt dans `outputs/contract-project-provisional-lot7b/cloture-git-lot7b.json`.
- **33 fichiers Lot 7B attendus uniquement**, contrôlés avant commit. Aucun artefact SQLite, sauvegarde, classeur, JSON de simulation ni sortie générée inclus. Aucun changement fonctionnel depuis **503/503 tests, typecheck OK, UI 54/54** ; migration 59 telle qu'appliquée. Seuls les trois documents de suivi ont été actualisés pour cette clôture.
- Validation-MSI reste en migrations **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**. Aucune écriture base pendant la clôture ; données historiques, 112 AW/112 catalogue V1 BROUILLON/118 clauses BROUILLON/409 liens et achats d'options vides conservés. Huit tables 7B vides ; aucun Projet historique requalifié.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 8 non commencé.** Aucun push/merge, publication, Abby, Bridge ou 8C. Attendre une instruction séparée pour la suite.

## Historique — 04/10/2026 — Lot 7B appliqué, avant commit

- AtoumWeb valide la préparation et autorise **migration 59 seule**. Application réelle terminée, aucun commit autorisé ; attendre validation du bilan réel. Branche `feature/project-page-compositions-v1`, HEAD `c1cc00c9934ce78909f6ccf4b9b37952657e3c50` inchangé.
- Avant écriture : les **33 fichiers exacts**, **350 sources** et preuves validées **503/503 tests, typecheck OK, UI 54/54** ont été revérifiés ; aucun changement fonctionnel ni répétition inutile de suite. Index vide, Manager non démarré.
- Sauvegarde physique sous verrou : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot7b-2026-10-04T07-51-43-253Z.sqlite`, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5**, égal à la source. Seconde écriture concurrente refusée, aucun WAL/SHM/journal actif. Jeton `8fa7d0de1b7650f425d3571197846293d4452b80ba6df488d8504340eabdef2c` recalculé avant écriture.
- **Migrations 1–59** ; schéma 7B présent, huit nouvelles tables **vides**, zéro backfill. Reconstruction projects : les **2 Projets / 19 anciennes colonnes / toutes les cellules** et les **21 tables qui les référencent** restent exacts. Indexes et trigger runtime `demo_track_projects` restaurés à SQL identique dans la transaction. Anciens Projets `legacy`, nouvelles relations Prospect/dossier/devis accepté/gel null.
- **104 tables métier + sqlite_sequence** préservées. 3 anciens devis / 6 lignes, 2 Projets, 36 nœuds, 3 Sites / 11 liens Pages, documents et provenance historiques exacts ; aucun Client/Projet/plan/Site/Page/objet Lot 8 créé.
- **112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / quote_option_purchases vide** intacts. Aucune publication ni injection rétroactive.
- Intégrité **ok**, FK **vide** ; rejeu aucune mutation logique **ni physique** ; checkpoints et fermeture réussis, aucun auxiliaire résiduel. SHA final **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**. Contre-vérification Python/SQLite indépendante en lecture immutable depuis la sauvegarde réussie.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Bilan/proofs dans `outputs/contract-project-provisional-lot7b/application-lot7b-validation-msi.md/json` et `contre-verification-lot7b.json`.
- **Lot 7B appliqué, non committé ; attendre validation du bilan réel. Recette manuelle AtoumWeb toujours à faire.** Aucun Lot 8, Abby, Bridge, 8C, publication, push/merge.

## Historique — 04/10/2026 — Lot 7B préparé, copie uniquement

- Lot 7 clôturé localement : **c1cc00c9934ce78909f6ccf4b9b37952657e3c50**, 27 fichiers validés, working tree propre après commit. Aucun push/merge. Les changements 7B sont séparés et non committés.
- Doctrine AtoumWeb validée : un seul Projet par dossier commercial, préparé avant acceptation sans Client artificiel ; révisions explicites, synchronisation différentielle préservant le manuel ; acceptation atomique sur le même Projet et gel exact. Le statut commercial est distinct du travail.
- Migration **59 préparée seulement**, migrations 1–58 intactes. Reconstruction contrôlée de la table projects pour assouplir la contrainte Client, avec copie exacte des anciennes colonnes ; huit tables, conflits/révisions immuables et protections opérationnelles. Aucun backfill historique.
- **503/503 tests**, 62 fichiers, 24 nouveaux tests 7B ; typecheck OK ; **54/54 UI isolée** dans les trois thèmes ; 11 observations de simulation, intégrité OK/FK vide, 104 tables antérieures préservées. Recette manuelle AtoumWeb à faire.
- Validation-MSI réelle inchangée en migrations **1–58**, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; XLSX inchangé au SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Aucune connexion SQLite à la source, seulement lecture physique/copie.
- 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens et anciens devis/Projets/documents conservés. Fixtures synthétiques seulement sur copies ; aucune publication réelle.
- Bilan : `docs/CONTRACTUAL_LOT7B_PROVISIONAL_PROJECTS.md` ; preuves `outputs/contract-project-provisional-lot7b` hors dépôt.
- **Arrêt avant application réelle et commit 7B. Ne pas démarrer Manager sur Validation-MSI : 59 pendante.** Aucun Lot 8, Abby, Bridge, 8C, push/merge. Attendre validation du bilan et autorisation séparée.

## Historique — 03/10/2026 — Clôture locale Lot 7

- Application migration 58 et bilan technique validés par AtoumWeb. Commit local dédié **Lot 7 — blueprints composés et quantités** autorisé, uniquement les 27 fichiers validés ; aucun push ni merge.
- 27 empreintes identiques à la fermeture avant actualisation documentaire ; aucun changement fonctionnel depuis **479/479 tests, typecheck OK, UI 24/24**. Recette manuelle AtoumWeb toujours à faire.
- Validation-MSI inchangée, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5**, contrôle physique sans ouverture SQLite. Aucune publication ni modification historique.
- Audit Projet prévisionnel validé. La préparation du **Lot 7B** est autorisée séparément après ce commit, sur copies uniquement ; migration 58 intacte. Aucun Lot 8, Abby, Bridge ou 8C.
- Le SHA de clôture est obtenu par `git log -1` et consigné hors dépôt dans `outputs/contract-blueprints-lot7/cloture-git-lot7.json`.

## Historique — 03/10/2026 — Lot 7 appliqué, avant validation du bilan réel

Checkpoint historique conservé ; le checkpoint courant en tête fait foi.

- Feu vert AtoumWeb : **application réelle du Lot 7 uniquement / migration 58**, sans backfill, reconstruction historique, politique/destination commerciale inventée, publication ou objet opérationnel. **Application terminée ; aucun commit autorisé avant validation du bilan réel.**
- Branche `feature/project-page-compositions-v1`, HEAD Lot 6 **5cf67f796941690449fc8661fe956c0ffd3e50d1** inchangé. **27 fichiers Lot 7 attendus**, index vide ; aucun push/merge.
- Empreintes vérifiées : 27 fichiers exacts, 336 sources applicatives et preuves validées **479/479 tests, typecheck sortie 0, UI 24/24**. Le plan d'application couvre 343 sources/fichiers de configuration ; aucun code fonctionnel changé, aucune répétition inutile de suite.
- Manager non démarré. Base initiale **1–57**, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide et SHM de verrou 32 768 octets, aucun journal actif.
- Sauvegarde physique immédiatement avant migration sous verrou : `C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot7-2026-10-03T21-01-27-408Z.sqlite`, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, identique au checkpoint initial. Intégrité/FK vérifiées indépendamment en lecture immutable.
- Jeton du plan **61e9e8156b3b20b28b7332584d9a54959b83f1d97022f69db31bde8177c44f4f** recalculé et empreintes revérifiées immédiatement avant le seul changement durable autorisé.
- Migration **58 seule appliquée** : migrations **1–58** présentes ; colonnes `quantity_mode/site_mode` et tables `project_blueprint_plans`, `project_composed_node_bindings`, `project_composed_site_bindings`, `project_composed_prerequisite_sources`. Les **quatre tables sont vides**.
- Seuls les défauts de schéma `once/create` apparaissent sur les **3 anciens liens blueprint** ; aucun mapping AW, règle de quantité ou destination commerciale renseigné. Les anciennes colonnes/valeurs de ces liens sont intactes.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle** ; 44 publications catalogue historiques inchangées. `quote_option_purchases` reste vide.
- Conservation exhaustive des **100 anciennes tables/colonnes/lignes**, hors ligne de migration 58 et nouvelles colonnes techniques autorisées. **DEV-2026-001/002/003**, leurs 2 lignes chacun, les **2 Projets**, leurs Sites/Pages et documents restent exacts ; aucun plan composé historique ni instance contractuelle ajouté.
- `integrity_check=ok`, `foreign_key_check` vide ; rejeu migrations **[]**, aucune modification logique **ni physique**. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; aucun WAL/SHM/journal résiduel. Contre-vérification indépendante Python/SQLite read-only immutable réussie contre la sauvegarde.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Aucun pack/maintenance/intervention, Abby, Bridge, Lot 8 ou 8C.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; preuves `application-lot7-validation-msi.md/json`, `contre-verification-lot7.json` et plan dans `outputs/contract-blueprints-lot7` du dossier documentaire partagé.
- **Lot 7 appliqué, non committé. Attendre validation du résultat avant commit local dédié, sans push/merge. Recette manuelle AtoumWeb toujours à faire.** Le mapping `AW → blueprint → rôle → destination → quantité` reste à décider/configurer explicitement et à versionner dans une étape autorisée séparément.

## Historique — 03/10/2026 — Lot 7 préparé, copie uniquement

Checkpoint historique conservé ; le checkpoint courant en tête fait foi.

- Autorisation AtoumWeb : **Lot 7 — Blueprints composés et quantités**, code/tests/UI/simulation uniquement. **Aucune écriture Validation-MSI ni commit Lot 7 autorisés.**
- Branche `feature/project-page-compositions-v1`, HEAD Lot 6 **5cf67f796941690449fc8661fe956c0ffd3e50d1** inchangé. Aucun push/merge.
- Composition des lignes réellement vendues : base/addon, composants obligatoires, achats persistés Lot 6. Options disponibles seules sans contribution/prérequis. Quantité `once/per_unit`, destination `create/extend_base` explicites ; bases concurrentes bloquées.
- Migration additive **58 préparée seulement**, SQL 1–57 intacts. Plan composé figé et haché ; bindings des nœuds/Sites/unité et provenance des prérequis. Zéro backfill des Projets historiques ; rejeu conservant renommages/ajouts/détachements manuels.
- **479/479 tests**, 61 fichiers, 20 nouveaux cas Lot 7 ; typecheck sortie 0 ; **UI isolée 24/24**, trois thèmes. Recette réelle AtoumWeb à faire.
- Simulation complète sur copie : 11 observations, 1 Site/5 Pages ; +Page x2 → 7 ; +Blog → 6 ; option achetée uniquement → 6 ; Page x2 +Blog+SEO → 8 ; modification quantité 1→3 → 8 ; plusieurs bases bloquées. Rejeux sans mutation, 100 tables antérieures préservées par migration, intégrité ok/FK vide ; zéro objet opérationnel.
- Validation-MSI réelle demeure **migrations 1–57**, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, sans WAL/SHM/journal au contrôle. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** exact.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens** intacts ; devis DEV-2026-001/002/003, Projets et documents conservés.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; simulation, captures et fermeture technique dans `outputs/contract-blueprints-lot7` du dossier documentaire partagé.
- **Arrêt avant application réelle. Ne pas démarrer Manager sur Validation-MSI (58 pendante).** Attendre validation du bilan et autorisation séparée. Aucun Lot 8 opérationnel, Abby, Bridge, 8C ou publication.

## Historique — 03/10/2026 — Lot 6 validé, clôture locale dédiée

Ce bloc fait foi ; les préparations et bilans antérieurs restent historiques.

- AtoumWeb valide le bilan réel et autorise le **commit local dédié Lot 6 — options réellement achetées**, sans push ni merge. Le commit contenant ce bloc clôture localement le Lot 6 ; son SHA et la liste exhaustive des fichiers sont consignés dans outputs/contract-options-lot6/cloture-git-lot6.json.
- Migration **57 appliquée sur Validation-MSI** ; quote_option_purchases présente et **vide**. Aucun backfill historique, aucune requalification implicite, aucune publication catalogue/contractuelle ni création de Projet/Site/Page/pack/maintenance.
- Contrôle avant commit : **24 fichiers Lot 6 attendus uniquement**, index initialement vide ; 335 sources applicatives identiques à la fermeture validée **459/459 tests, typecheck OK et UI 20/20**. Aucun changement fonctionnel depuis ces contrôles ; seules trois documentations de suivi actualisées.
- Aucun artefact de sauvegarde/simulation/base/classeur inclus ; les scripts de simulation/contrôle prévus font partie du code Lot 6, leurs sorties demeurent hors dépôt.
- Validation-MSI demeure au SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens, devis historiques, Projets et documents conservés.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 7 non commencé.** Aucun démarrage Manager ni écriture base pendant cette clôture. Aucun push/merge, publication, Abby, Bridge ou 8C.


## Historique — 03/10/2026 — Lot 6 appliqué, avant validation de clôture

Ce bloc fait foi ; les préparations précédentes restent historiques.

- AtoumWeb autorise l'application réelle du Lot 6 uniquement, migration **57**, après validation 459/459 tests, typecheck OK et UI 20/20. **Application terminée, aucun commit autorisé à ce stade ; attendre validation du bilan réel.**
- Branche feature/project-page-compositions-v1, HEAD **fa52b68911d8649013a4a4e40e19d91a56d0c6e6** inchangé. Les 24 fichiers Lot 6 et leurs empreintes correspondent exactement à la fermeture validée avant écriture ; 335 sources applicatives contrôlées. Aucun code fonctionnel changé, aucune suite répétée inutilement.
- Manager non démarré. Base initiale 1–56 au SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide, SHM de verrou 32 768 octets, aucun journal actif sous verrou.
- Sauvegarde physique immédiatement avant application sous verrou : C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot6-2026-10-03T19-57-38-123Z.sqlite, SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, identique à la base avant. Intégrité de la sauvegarde vérifiée indépendamment en lecture immutable.
- Jeton du plan **7a5e7f86e43f15c815ec437ec102ac51f0a07d1dafd351332fea4fc5eb4d286f** revérifié juste avant migration ; empreintes du plan, de la base, du XLSX, des sources et des preuves de tests inchangées. Aucune autre migration pendante acceptée.
- Migration **57 seule appliquée** : migrations **1–57** présentes ; quote_option_purchases et ses trois triggers créés, **0 achat**, aucun backfill/requalification historique.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts**. 0 nouvelle publication ; les 44 versions catalogue publiées anciennes demeurent inchangées. 0 lien catalogue BASE, LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE hors bibliothèque.
- Conservation exhaustive des **99 anciennes tables**, colonnes, lignes et objets de schéma : toutes les empreintes avant/après identiques, hors nouvelle ligne de migration 57. DEV-2026-001/002/003 et leurs deux lignes chacun strictement inchangés ; 0 clause rétroactive. Deux Projets et état documentaire exacts ; aucun Projet/Site/Page/pack/maintenance/objet opérationnel créé.
- integrity_check **ok**, foreign_key_check **vide** ; rejeu migration **[]**, aucune modification logique ni physique. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; aucun WAL/SHM/journal résiduel.
- Contre-vérification indépendante Python/SQLite mode=ro immutable réussie contre la sauvegarde. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** conservé ; aucune modification Abby, Bridge ou 8C.
- Rapports : outputs/contract-options-lot6/application-lot6-validation-msi.md/json, contre-verification-lot6.json et fermeture-reelle/plan-application-lot6.json.
- **Lot 6 appliqué, non committé. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Aucun push/merge. Lot 7 non commencé. Attendre validation du bilan avant commit local.**


## Historique — 03/10/2026 — Lot 6 préparé localement, avant autorisation réelle

- Autorisation AtoumWeb : **Lot 6 — Options réellement achetées** uniquement, implémentation locale/tests/simulation sur copie. Aucun Lot 7, publication, Abby, Bridge ou 8C.
- Base : commit Lot 5 **fa52b68911d8649013a4a4e40e19d91a56d0c6e6**, feature/project-page-compositions-v1. Lot 6 non committé ; aucun push/merge.
- Relation additive quote_option_purchases : achat explicite par ligne persistée, origine offre/version/composant exacte, jamais par nom. Prix/remise/quantité/version du service restent dans la ligne et son snapshot.
- Migration **57 préparée seulement**. SQL 1–56 inchangé. Validation-MSI réelle reste en **1–56**, SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**.
- UI : services inclus, disponibles non achetés, options achetées, quantité/prix/provenance ; achat/retrait transactionnels et idempotents ; duplication brouillon sans mutation de l'original ; origine incluse dans le snapshot figé.
- **459/459 tests**, 60 fichiers, 16 cas Lot 6, typecheck sortie 0 ; UI isolée **20/20**, trois thèmes. Recette manuelle AtoumWeb à faire ; Manager réel non démarré.
- Simulation 3 devis fictifs : 1/2/3 lignes, 100/120/208,60 euros, 1/3/3 clauses. Quantités 3 et 2 conservées, aucun Projet/Site/Page/objet opérationnel créé. Publications exclusivement synthétiques sur copie.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts** ; trois devis historiques/projets/documents exacts. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** inchangé.
- Bilan docs/CONTRACTUAL_LOT6_PURCHASED_OPTIONS.md ; outputs/contract-options-lot6. **Arrêt avant application Validation-MSI et Lot 7 ; attendre instruction distincte.**


## Historique — 03/10/2026 — Lot 5 validé, clôture locale dédiée

Ce bloc fait foi ; les préparations et bilans d’application antérieurs restent historiques.

- AtoumWeb valide le bilan réel et autorise le commit local dédié **Lot 5 — paramètres contractuels et preuves**, sans push ni merge, sur feature/project-page-compositions-v1. Le commit contenant ce bloc constitue le checkpoint Lot 5 ; son SHA exact figure dans outputs/contract-parameters-lot5/cloture-git-lot5.json et git log -1.
- Migration **56 appliquée avec succès sur Validation-MSI**, aucun backfill des anciens devis, aucune publication catalogue ou contractuelle, aucune donnée administrative fictive.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts** ; devis historiques et Projets inchangés. Aucun DEV-2026-004, aucun document ou preuve fictif.
- Contrôle avant commit : **38 fichiers Lot 5 attendus**, 332 sources applicatives identiques à la fermeture validée 443/443 tests + typecheck OK ; aucun changement fonctionnel. Aucun fichier généré de simulation, base, sauvegarde ou journal inclus ; les trois scripts de contrôle/simulation font partie du code prévu.
- Validation-MSI conserve l’empreinte **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71** ; aucun démarrage Manager ni écriture base pendant la clôture.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 6 non commencé.** Bridge et 8C restent suspendus ; aucune publication ni push/merge.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; application et contre-vérification conservées dans outputs/contract-parameters-lot5. Aucun autre lot inclus dans la clôture.


## Historique — 03/10/2026 — Lot 5 appliqué, avant validation de clôture

Ce bloc fait foi ; les préparations et checkpoints précédents restent historiques.

- AtoumWeb valide le dry-run et autorise l’application réelle du Lot 5, migration 56 seule, sans backfill, devis de simulation, administration fictive ni publication. **Application terminée ; aucun commit Lot 5 autorisé avant validation du résultat.**
- Branche feature/project-page-compositions-v1, HEAD local Lot 4 **31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc** conservé. 38 fichiers Lot 5 attendus, index vide, aucun push/merge. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale.
- Code inchangé depuis les **443/443 tests + typecheck sortie 0**, UI isolée 20/20 ; aucune répétition inutile de suite. Horodatages contrôlés puis empreintes des 332 sources applicatives et des 38 fichiers attendus revérifiées avant écriture.
- Manager non démarré. Verrou exclusif acquis et seconde connexion d’écriture refusée ; WAL vide, SHM 32 768 octets, aucun journal actif. Sauvegarde physique immédiate : C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot5-2026-10-03T18-56-43-167Z.sqlite, SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; intégrité/FK vérifiées.
- Migration **56 seule appliquée**, migrations 1–55 intactes ; comparaison exhaustive des **98 anciennes tables/colonnes/lignes** contre le backup. Aucun devis, preuve, configuration administrative ou empreinte documentaire historique ajouté.
- Validation-MSI : **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle**. Les 44 versions catalogue publiées anciennes sont inchangées. DEV-2026-001/002/003, les 2 Projets et l’état documentaire antérieur sont exacts ; aucun DEV-2026-004, aucune instance de clause rétroactive.
- Nouveaux paramètres de tous les devis NULL ; table de preuves vide ; configuration contract-administration-v1 absente, états à renseigner retournés sans seed. CONS-RETRACTATION-EN-LIGNE hors bibliothèque ; RSVP sensible désactivé, qualification numérique multi-indicateurs. Garde-fous du Builder confirmés en lecture pure, aucun devis test réel.
- integrity_check ok / foreign_key_check vide, migrations **1–56** présentes. Rejeu réel aucune migration et aucune modification logique **ni physique**, checkpoint WAL réussi. Contre-vérification indépendante Python/SQLite read-only réussie.
- Base avant/backup SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; base après fermeture SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**. XLSX inchangé 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; preuves réelles application-lot5-validation-msi.md/json et contre-verification-lot5.json dans outputs/contract-parameters-lot5 du dossier documentaire partagé.
- **Lot 5 appliqué, non committé : attendre validation du bilan réel avant commit local dédié. Aucun Lot 6, publication, Abby, Bridge ou 8C ; aucun push/merge.**


## Historique — 03/10/2026 — Lot 5 préparé, simulation uniquement

Ce bloc fait foi pour l’état actuel ; les checkpoints antérieurs restent historiques.

- AtoumWeb autorise uniquement l’implémentation locale, les tests et le dry-run du Lot 5 — Paramètres contractuels du devis et preuves. **Aucune écriture Validation-MSI ni commit Lot 5 autorisé pour cette passe.**
- Branche feature/project-page-compositions-v1, HEAD local Lot 4 **31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc** conservé, aucun push/merge. Recette manuelle AtoumWeb à faire avant validation fonctionnelle finale.
- Migration additive **56** préparée après contrôle de la base 55 ; exécutée seulement en mémoire/copie. SQL 1–55 intacts ; aucune donnée historique complétée automatiquement.
- Préparation intégrée au devis : échéancier, qualification numérique/contextuelle, garanties 30/60/90 distinctes des droits légaux, validation explicite, droits/renouvellement, administration sans valeurs fictives, B2C et RSVP minimal. Gel transactionnel enrichi ; preuves génériques et PDF SHA-256, contrôle à l’ouverture, historique de remplacement et archivage sans perte.
- Vérifications finales : **443/443 tests (59 fichiers, dont 34 nouveaux cas), typecheck sortie 0, UI Electron isolée 20/20**. Interface simulée distincte de la recette réelle AtoumWeb.
- Dry-run final sur copie : **98 tables historiques préservées à la migration**, integrity_check ok, FK vide, rejeu migration sans effet ; ancien historique exact. DEV-2026-004 test sur copie seulement, finalisation refusée pour administration réellement absente/socle publié manquant. Aucun Client/preuve/PDF inventé.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / 0 publication** conservés. DEV-2026-001/002/003 et Projets inchangés. Seuls compteur +1/index dérivé sont rafraîchis par la création CRM sur copie.
- Validation-MSI réelle toujours migration 55 et SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; XLSX SHA 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8 inchangé. Manager non démarré sur Validation-MSI.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; preuves dans outputs/contract-parameters-lot5 du dossier documentaire partagé. **Arrêt avant application réelle et attente du feu vert. Ne pas démarrer Manager sur Validation-MSI (56 pendante). Aucun Lot 6, publication, Abby, Bridge ou 8C.**


## Historique — 03/10/2026 — Lot 4 validé, clôture locale dédiée

Ce bloc fait foi ; les états précédents restent historiques.

- AtoumWeb valide le résultat réel du Lot 4 et autorise son **commit local dédié uniquement**, intitulé `Lot 4 — import bibliothèque contractuelle V1`, sur `feature/project-page-compositions-v1`. Le commit contenant ce bloc fait foi pour le checkpoint Lot 4 ; récupérer son SHA avec `git log -1 --format=%H`. Aucun push/merge.
- 118 clauses/versions BROUILLON et 409 liens ; aucune publication contractuelle. Les 112 versions catalogue V1 restent également BROUILLON. Textes/provenance et anciens devis/Projets préservés ; migration 55 appliquée seule, intégrité et rejeu validés.
- **RECETTE MANUELLE ATOUMWEB À FAIRE avant validation fonctionnelle finale. Lot 5 non commencé ; attendre un feu vert séparé.** Bridge et 8C restent suspendus.
- Avant clôture : 21 fichiers Lot 4 attendus uniquement, aucun changement fonctionnel depuis suite complète 409/409 et typecheck OK. Validation-MSI inchangée par cette clôture, SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`. Manager non démarré, aucune écriture base.
- Rapports réels dans `outputs/contract-library-lot4` du dossier documentaire, bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`. Le bilan de clôture Git hors dépôt donne l'empreinte exacte du commit et la vérification de working tree propre.


## Historique — 03/10/2026 — Lot 4 appliqué avant validation de clôture

Ce bloc fait foi ; les blocs antérieurs et le dry-run restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local `1ed1152cc55ada1e8731d09b9f1a6c9832ba4934` (commit Lot 3). **Lot 4 non committé, aucun push/merge.** Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale.
- AtoumWeb valide le dry-run et autorise l'application réelle sous conditions. Fermeture sur le code exact : **58 fichiers / 409 tests / 0 échec**, typecheck sortie 0, 21 fichiers Lot 4 prévus, aucun staged. Aucun changement fonctionnel après ces tests.
- Manager non démarré. WAL vide, SHM présent (32 768 octets), aucun journal actif ; writer concurrent bloqué sous verrou exclusif. Sauvegarde physique immédiate, intégrité OK : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot4-2026-10-03T12-37-38-123Z.sqlite`, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`.
- Migration **55** et import sous transaction englobante, savepoints des opérations existantes ; migrations 1–54 intactes. Empreintes XLSX/extraction/manifeste/documents/base/code contrôlées, jeton recalculé immédiatement avant import identique au validé : `8f5b0c9b3ba4a08eab134fed6061de13cd32881f295c5ed6ade66c22d1323bff`.
- Résultat réel : **118 templates / 118 versions initiales BROUILLON / 409 liens explicites** ; 19 base/99 catalog, 105 all/3 professional/10 consumer ; **0 published / 0 lien BASE**, journal 1 passage/118 entrées. LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE absent, aucun ancien alias importé.
- Textes/revues/sources/réserves/provenance exacts au XLSX du 03/10, SHA inchangé `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`. Cinq niveaux et suivi 42/52/22/2 conservés sans visa juriste automatique ; aucun arbitrage métier rouvert ni action hors clause transformée.
- Les **112 AW et 112 versions catalogue V1 BROUILLON** restent intacts ; 44 anciennes versions publiées inchangées. Devis DEV-2026-001/002/003, Projets, anciennes versions, documents et autres tables métier identiques au backup. **0 instance de clause historique**, absence `historical_missing` conservée. Builder : 0 version courante publiée éligible, brouillons non consommés.
- Après COMMIT : rejeu **0 création/version/lien supplémentaire**, toutes les tables identiques, activité/journal inclus. `integrity_check=ok`, FK vide, checkpoint WAL réussi. Contre-vérification indépendante SQLite en lecture seule contre backup : **96 tables historiques**, textes/revues/liens exacts.
- Base avant/backup SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; base après checkpoint/fermeture SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, preuves réelles `outputs/contract-library-lot4/application-lot4-validation-msi.md/json`, contre-vérification et fermeture conservées. **Attendre la validation du bilan réel avant commit local dédié Lot 4. Aucune publication ni Lot 5, Abby, Bridge ou 8C.**


## Historique — 03/10/2026 — Lot 4 préparé, avant autorisation réelle

Ce bloc fait foi ; les blocs antérieurs restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local **`1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`** : commit Lot 3 dédié uniquement, aucun push/merge. Working tree propre constaté avant les modifications Lot 4. Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale, mentionnée dans le commit.
- Lot 3 validé : catalogue réellement importé à Validation-MSI, 112 AW, 91 créations/21 reprises/15 archives/9 conservations, versions V1 brouillon, historique et rejeu préservés. Base réelle migrations **1–54**, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` inchangé pendant Lot 4.
- Autorisation Lot 4 limitée à préparation et dry-run sur copie. Référentiel XLSX du 03/10 SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8` ; textes exacts, huit documents juridiques préservés.
- Migration additive **55 préparée et testée uniquement sur copie/mémoire** : revue/provenance des versions et journal d'import. Migrations 1–54 inchangées, aucun seed/import automatique. **Ne pas démarrer Manager contre Validation-MSI avant feu vert pour la migration/import.**
- Simulation/répétition : **118 clauses / 118 versions BROUILLON / 409 liens explicites**, 19 base/99 catalog ; 105 all/3 professional/10 consumer ; zéro anomalie/publication/lien BASE. `LANDING-GESTION` seule dormante, contrôle `CONS-RETRACTATION-EN-LIGNE` exclu. Rejeu zéro changement, intégrité SQLite OK et FK vide, anciens devis/Projets/catalogue strictement préservés.
- Suivi documentaire 42 modifier/52 inchangé/22 hors clause/2 qualifications et cinq niveaux de revue conservés, sans blocage automatique juriste. Les 16 décisions restent closes ; les 44 actions hors clause ne deviennent pas de nouvelles clauses/tables.
- Tests ciblés **59/59**, typecheck sortie 0, UI Chromium isolée **21/21** ; recette réelle non effectuée puisque import réel interdit pour cette passe. Extraction déterministe contrôlée, empreintes DB/XLSX/documents avant/après identiques.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, dry-run exhaustif MD/CSV/JSON `outputs/contract-library-lot4` du dossier documentaire. **Arrêt avant écriture réelle, attente du feu vert AtoumWeb.** Aucun commit Lot 4, publication, Lot 5, Abby, Bridge ou 8C ; aucun push/merge.


## Historique — 03/10/2026 — Contrats Lot 3 appliqué, avant commit

Ce bloc fait foi pour la reprise actuelle ; les comptes rendus datés ci-dessous restent historiques.

- Branche : `feature/project-page-compositions-v1`. HEAD local Lot 2 `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9` ; Lot 1 `dedb865f4cdabd518391b63f067ed8e2647c869b`. Aucun push/merge. **Lot 3 non committé**, 20 fichiers prévus seulement, aucun changement staged.
- Lots 1/2 validés techniquement ; **RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD avant validation fonctionnelle finale**, réserve portée dans les commits. Brouillon/publication séparés, snapshot vide figé, absence contractuelle historique conservée, PDF rattaché protégé ; empreinte PDF/historique des remplacements différés au Lot 5.
- AtoumWeb a validé le dry-run Lot 3 puis autorisé l'application réelle, après suite complète **57 fichiers / 390 tests / 0 échec**, typecheck sortie 0 et contrôle du working tree. Aucun changement de code depuis ces tests ; seules preuves/documentation ajoutées ensuite.
- Sauvegarde physique immédiate sous verrou d'écriture exclusif : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`, SHA-256 `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. Base mode WAL, WAL vide et SHM présent ; seconde connexion d'écriture bloquée, backup intact et `integrity_check=ok`. Manager n'a pas été démarré.
- Migrations additives **53 et 54 réellement appliquées**, avec l'import dans une transaction englobante. Migrations 1–52 et leurs données préservées, aucun seed ; ancien SQL 53 inchangé. Jeton recalculé immédiatement avant application identique au validé : `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4` ; fichier base, classeur et payload contrôlés, rollback prévu au moindre écart.
- Application réelle : **91 créations, 21 reprises par nouvelle version, 15 archives réversibles sans AW, 9 historiques génériques conservés ; 112/112 codes AW ; 112 nouvelles versions BROUILLON**. Totaux : 136 items, 157 versions, 44 anciennes versions publiées inchangées, 113 brouillons incluant l'ancien, 127 entrées / 1 passage d'import.
- Les huit anciennes ambiguïtés sont archivées sans code AW ni nouvelle version ; les huit cibles V1 sont des références distinctes. Aucun rapprochement par nom. Les 21 reprises gardent leurs UUID ; anciennes versions/prix et compositions exacts préservés, liens blueprint recopiés exactement (2 anciens + 1 copie = 3).
- Trois devis `DEV-2026-001/002/003`, leurs lignes/snapshots, Projets, documents et toutes les autres tables métier inchangés. Comparaison exhaustive contre l'état initial et contre la sauvegarde par une seconde lecture SQLite indépendante. **Aucune clause V1 injectée rétroactivement.**
- `integrity_check=ok`, `foreign_key_check` vide. Rejeu sur l'état réellement committé : **zéro modification**, 136 conservations ; empreinte logique de toutes les tables inchangée, activité/journal inclus. Checkpoint WAL final réussi avant empreinte physique.
- Base avant : `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. Base après : `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`. XLSX inchangé : `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.
- Bilan : `docs/CONTRACTUAL_LOT3_CATALOG_IMPORT.md` ; preuves réelles `outputs/catalogue-lot3/application-lot3-validation-msi.md/json` et `contre-verification-lecture-seule.json` dans le dossier documentaire. Le dry-run antérieur reste conservé comme historique.
- **Aucune version catalogue V1 publiée. Arrêt avant Lot 4, attente du nouveau feu vert.** Aucun import des 118 clauses/409 liens, paramétrage contractuel du devis, options achetées, blueprint composé, Abby ou Bridge. Lot 8C suspendu. Aucun commit Lot 3/push/merge.

## Lot 8A en cours — Export Page Manager

- Branche empilée : `codex/lot8a-page-export`, basée sur le HEAD validé du Lot 7 ; PR #76 non fusionnée.
- L'export générique `atoumweb_bridge_project_package` V1 reste inchangé.
- Une Page rattachée à un Site actif et possédant une composition peut produire une enveloppe V2 avec `scope=page`, `exportId` et destination `projectId/siteId/pageId`.
- Migration additive **52** : historique immuable des exports Page et empreinte du ZIP.
- Les adaptations locales HTML/CSS/JS enregistrées dans l'atelier sont transportées avec checksums recalculés ; la provenance Bibliothèque source reste intacte.
- Contrat et schéma ajoutés : `docs/ATOUMWEB_PAGE_PACKAGE_V2.md` et `.schema.json`.
- Typecheck réussi ; tests ciblés package/migrations : **14/14**.
- État : modifications locales sans commit/push, recette du bouton « Préparer pour Bridge » requise. Le support d'import idempotent côté plugin Bridge reste à implémenter après confirmation de son dépôt local.

## Lot 7 en cours — Squelette blueprint Sites / Pages

- Branche de travail : `codex/lot7-blueprint-sites`, créée depuis le checkpoint canonique `cf747c5855eec90df725861d22375d65f78f12db`.
- Premier incrément local : déclarations explicites Site/Page par version de blueprint, provenance durable et application idempotente lors de la création d'un Projet.
- Les réapplications conservent les renommages, domaines, rattachements et Pages ajoutées manuellement ; elles ne créent aucun doublon ni journal d'activité supplémentaire.
- Le blueprint vitrine V1 déclare un Site principal, une Accueil et quatre Pages complémentaires.
- Les versions brouillon peuvent configurer cette structure via l'API de modèles ; une nouvelle version recopie les déclarations avec les nouveaux identifiants de nœuds.
- L'écran Sites & pages expose « Initialiser depuis le blueprint » pour les Projets historiques ; un blueprint sans déclaration produit un message explicite.
- Migrations additives prévues : **50** pour le modèle Site/Page, puis **51** pour la compatibilité explicite des anciens Projets `web` / `website` déjà liés à un blueprint sans structure Site/Page.
- La recette réelle de `PRO-2026-001` a révélé ce cas historique. Le fallback utilise le type du Projet, jamais son nom, conserve son blueprint d'origine et matérialise uniquement les Pages déclarées et leurs ancêtres manquants.
- Validation locale après correction : `npm run typecheck` réussi ; tests ciblés migrations / ProjectService / ProjectSiteService **33/33 réussis**.
- Recette réelle validée sur `PRO-2026-001` : création de 1 Site et 5 Pages, réapplication sans doublon, renommages Site/Page conservés et Page manuelle conservée ; résultat final 1 Site / 6 Pages.
- Architecture suivante actée : le projet moderne sera composé depuis le devis (`offre de base → options/prestations → blueprint final`). Le mapping par `project_type` ajouté en migration 51 reste strictement une compatibilité legacy.
- État : prêt pour commit, push et PR vers `feature/project-page-compositions-v1`. Le harness Electron n'a pas démarré ses contrôles lors du dernier essai, Chromium ayant arrêté son processus GPU Windows (`GPU process isn't usable`).

## Lot 6B clos — 29/09/2026 — PR #75 intégrée et contrôles post-intégration verts

- Branche de stabilisation : `wip/codex-6b-ui-fix`.
- Branche canonique : `feature/project-page-compositions-v1` au HEAD `3df2168d7a3e662d98f68525550309ea71be0d67`.
- Comparaison pré-intégration vérifiée : la WIP était **strictement devant / 0 derrière** la branche canonique ; aucune divergence concurrente détectée.
- [x] Barre fantôme identifiée et supprimée : `main.project-production-secondary` vide n'est plus rendu sous Sites & pages.
- [x] Structure Sites & pages stabilisée : **Arborescence | Fiche Page | Atelier latéral**.
- [x] Replis/restaurations indépendants de l'Arborescence, de la Fiche Page, de Réglages et de Code / aperçu.
- [x] Réduire la Fiche Page ne démonte plus Réglages / Code ; les brouillons et aperçus restent actifs.
- [x] Réglages et Code / aperçu peuvent être ouverts seuls ou ensemble ; synchro du brouillon Réglages vers Code / aperçu en direct.
- [x] Timer Page compact.
- [x] Informations de Page repliables au-dessus de la composition.
- [x] Aperçus isolés pour éviter la contamination CSS entre composants ; JavaScript source non exécuté.
- [x] Desktop / Tablette / Mobile disponibles dans Réglages et Code / aperçu.
- [x] Grand écran harmonisé Réglages / Code : preview dominante à gauche, outils scrollables à droite, ratio cible ~75/25.
- [x] Validation explicite des modifications locales, Undo / Redo, retour Version Bibliothèque et promotion en variante conservés.
- [x] Pickers couleurs étendus (hex/alpha/HSL) et réglages visuels locaux conservés.
- [x] Migration 49 inchangée ; aucune nouvelle migration ajoutée pendant la stabilisation UX.
- [x] `npm run typecheck` réussi sur MSI.
- [x] Tests Vitest ciblés historiques : **35/35 réussis**.
- [x] Harness Electron final : **65/65 contrôles réussis, 0 échec** sur le checkpoint `d464ad2b2d7f500a6a1443059e50f706dc244200`.
- [x] Recette visuelle réelle Carlos validée le 29/09/2026 : replis, atelier docké, aperçu scrollable, grand écran Réglages, grand écran Code et disposition 75/25 jugés conformes.
- [x] PR **#75** (`wip/codex-6b-ui-fix` → `feature/project-page-compositions-v1`) fusionnée le 29/09/2026 par le merge commit `3df2168d7a3e662d98f68525550309ea71be0d67` ; aucune fusion vers `main`.
- [x] Après intégration sur le HEAD canonique `3df2168d7a3e662d98f68525550309ea71be0d67` : `npm run typecheck` réussi, harness Electron **65/65**, tests Vitest ciblés **35/35**.
- [x] Suite Vitest complète lancée le 29/09/2026 : premier passage **336/339**, 3 échecs transverses identifiés hors UX 6B.
- [x] Correctifs poussés :
  - test migration legacy rendu dynamique jusqu'à la migration courante ;
  - test Workflow aligné sur le Builder CGV structuré ;
  - `quote_contract_clauses` ajouté au tracking/purge DemoService.
- [x] Suite complète relancée après ces trois correctifs : **53 fichiers / 339 tests réussis, 0 échec**.
- [x] `npm run package` : package Windows **win32 x64** généré avec succès.
- [ ] Corriger à faible priorité l'avertissement Electron du harness `console-message` déprécié ; aucun impact fonctionnel Manager.
- [ ] Lot suivant : Lot 7 de la feuille de route Manager ↔ Bridge (préparation Site / package / Workbench), à commencer uniquement après autorisation explicite ; aucun travail Bridge effectué pendant le Lot 6B.

Détails complets et journal de décisions : `docs/MANAGER_BRIDGE_ROADMAP.md`.


## Coordination Manager ↔ Bridge — 27/09/2026

- [x] Note d'architecture Pages hybrides et feuille de route consignées dans [`docs/MANAGER_BRIDGE_ROADMAP.md`](docs/MANAGER_BRIDGE_ROADMAP.md), avec journal partagé des consignes/décisions pour les agents.
- [x] Checkpoint MSI sur `4f8fa15c80da874e084648b1d643a316cbfcbcb2` : typecheck réussi et **34 tests ciblés réussis / 0 échoué** (CGV 9, devis 8, migrations 10, composition 5, package composition 2).
- [x] Validation-MSI contrôlé en lecture seule : migrations 1–43 sans collision CGV ; 44–46 restent à appliquer dans ce workspace. Pas de lancement de l'application ni d'accès Production.
- [ ] Recette visuelle CGV après lancement/migrations à effectuer par Carlos ; aucune suite complète ni packaging relancé pour ce checkpoint.
- Direction proposée : Page opérationnelle existante + Site + composition facultative/partielle, Divi comme atelier, occurrences durables, provenance distincte de la destination.
- Prochaine action : lire la feuille de route, confronter les identités/contrats au vrai plugin Bridge et confirmer les arbitrages avant d'autoriser un lot. **Aucun lot 6–9 commencé ou autorisé par la publication documentaire.**
- La PR #74 est déjà intégrée. Les mentions historiques contraires plus bas ne constituent pas une instruction de la fusionner à nouveau. Le journal partagé contient les consignes courantes ; l'historique ci-dessous est conservé.


## Checkpoint — convergence CGV Builder V1 — 27/09/2026

- [x] Le travail de `feature/quote-cgv-builder-v1` / PR #74 a été sécurisé puis réconcilié avec le HEAD Projet V2 `51b7ca247652a85929ae4ff580beaf329c0f6b9b`.
- [x] Les 28 fichiers fonctionnels du Builder CGV ont été repris sans supprimer les avancées Bridge / Familles / Correspondances / Composition.
- [x] Les migrations CGV initialement numérotées 40 / 41 / 42 sur la branche parallèle sont renumérotées **44 / 45 / 46** pour conserver les migrations actuelles 40 à 43.
- [x] Builder : bibliothèque de clauses versionnées, clauses prestation, conditions particulières, public professionnel/consommateur, snapshot contractuel et copie pour Abby.
- [x] PDF Abby accepté rattachable au devis ; onglet Contrats côté Client conservé.
- [x] Les brouillons `CGV_CONTENT_DRAFT.md` et `CGV_SERVICE_MODULE_TEXTS_DRAFT.md` sont intégrés ; ils ne constituent pas encore des textes juridiques de production.
- [ ] Validation MSI obligatoire après synchronisation : `npm run typecheck`, tests migrations + ContractTerms + QuoteService, puis recette visuelle Devis/Client.
- [ ] Avant d’ouvrir un ancien workspace ayant éventuellement servi à la branche CGV historique, contrôler `schema_migrations` : les anciens IDs 40/41/42 CGV ne doivent pas être confondus avec les migrations 40/41/42 désormais attribuées au chantier Bridge.
- [ ] Le prochain lot d’architecture reste **Projet → Site → Page → Composition**, avant le vrai round-trip multi-composants Bridge.

## Lot suivant — Package projet / Workbench multi-composants — 27/09/2026

- [x] Convention interne `atoumweb_bridge_project_package` 0.1 ajoutée sans modifier les contrats Component / Fields / Identity V1.
- [x] Une composition Manager peut préparer un ZIP unique en conservant l’ordre, la version exacte, la Famille / Variante et les SHA-256 de chaque composant.
- [x] Les Component Package V1 existants sont réutilisés comme source ; aucun composant Bibliothèque n’est réécrit.
- [x] Bibliothèque : action **Préparer pour Bridge** + accès au ZIP généré.
- [x] Bridge 0.8.0 : import du package projet dans **un seul Workbench Divi**, avec un module Code distinct par composant et ordre Manager conservé.
- [x] Bridge crée une **Site Occurrence V1 distincte par composant** du Workbench projet et conserve la provenance de la composition.
- [x] Les Workbenches projet sont distingués des Workbenches composant / production dans l’interface Bridge.
- [ ] Validation MSI Manager : typecheck + tests Composition / Package / migrations.
- [ ] Validation réelle Bridge 0.8.0 : installer le plugin, importer un package de composition et vérifier le Workbench Divi.
- [ ] Lot suivant : provenance/retour multi-composants (configuration et Occurrence Return composant par composant).
- [ ] Publication production et intégration des branches parallèles 40/41/42 restent différées.

## Lot suivant — Composition multi-composants — 27/09/2026

- [x] Migration 43 : stockage dédié des compositions et de leurs occurrences de composants, sans modifier les composants Bibliothèque sources.
- [x] Une composition possède un nom, un métier cible, un statut et un ordre explicite de composants.
- [x] Chaque occurrence de composition mémorise l’item source, la version exacte, la famille, la variante, la catégorie et le métier au moment de l’ajout.
- [x] Ajout, retrait et réorganisation d’occurrences implémentés ; une même source peut être utilisée plusieurs fois sans mutation de la Bibliothèque.
- [x] Les composants Bridge marqués `ready` sans validation humaine restent refusés ; seuls les composants réellement « Prêt à réutiliser » sont composables.
- [x] API Electron / preload ajoutée pour lister, créer et éditer les compositions.
- [x] Bibliothèque : action **Composer un site**, création d’une composition, sélection du métier, panier ordonné et ajout de composants prêts.
- [x] Tests unitaires ajoutés pour provenance/version figée, réorganisation, retrait, refus des composants non prêts, validation humaine Bridge et archivage.
- [ ] Validation MSI : `npm run typecheck`, migrations, tests Composition ciblés puis recette visuelle.
- [ ] Lot suivant après validation : **Package projet / Workbench multi-composants**. Aucun format de package projet ni publication WordPress n’est ouvert dans ce lot.
- [ ] Les branches parallèles 40/41/42 restent volontairement hors intégration jusqu’au checkpoint final des lots.

## Correction UX — Reconnaissance des éléments et réexamen — 26/09/2026

- Retour Carlos : persistance confirmée, mais la validation basée sur des IDs / scores est incompréhensible. La première recette valide le stockage, pas la pertinence des correspondances choisies.
- [x] Revue ouverte directement sous la page concernée. Chargement des aperçus avant/après uniquement à la demande, contexte de page, dates, position, extrait de contenu ; IDs et score repliés dans les détails techniques.
- [x] Décision affichée sur le bloc qui reste en place : « C’est le même élément » / « Ce sont deux éléments différents ». Les propositions peuvent rester en attente sans bloquer le parcours ; « À examiner plus tard » replie la carte sans écrire de décision.
- [x] Les aperçus sont reconstruits, sans exécution JavaScript ni chargement externe ; leur rendu peut être incomplet. Pas de décision proposée sans contenu reconnaissable ; les conteneurs sans aperçu restent en attente.
- [x] Migration 42 additive pour historiser les réexamens, compatible avec les décisions déjà enregistrées sous migration 41. Réexamen transactionnel et idempotent, historique conservé, attributions retirées seulement si aucune validation dépendante ne les utilise. Sinon, message demandant de réexaminer d’abord les validations suivantes.
- [x] Tests ciblés : **35 réussis / 0 échoué** (Snapshot 26, migrations 9) ; typecheck réussi. Aucun contrat V1 ni snapshot modifié. Aucun commit/push, suite complète ou packaging.
- [x] Recette Carlos : nouvelle présentation avant/après, décisions sur place et réexamen validés visuellement. Contrôles ciblés confirmés verts : typecheck + **35/35 tests**.

## Validation humaine des correspondances de nœuds — 26/09/2026

- [x] Migration 41 : identités logiques, attributions et décisions dans des tables Manager séparées. Les snapshots, objets et `bridge_nodes.logical_node_id` importés restent intacts.
- [x] Validation / refus explicites depuis Sites → comparaison → Correspondances modules ; accès possible aux pages sans écart.
- [x] Provenance conservée : couple de nœuds/pages/snapshots, proposition et score au moment de la décision, date, origine `manager_human`, journal d'activité. Aucun nom d'opérateur n'est inventé : le Manager local n'identifie pas l'humain connecté.
- [x] Une identité ne peut désigner deux nœuds d'un même snapshot. Les identités déjà distinctes ne sont jamais fusionnées silencieusement ; les refus restent respectés même par les chaînes de validations.
- [x] Décisions transactionnelles et idempotentes ; erreur de journalisation = annulation complète. Un refus n'attribue aucune identité.
- [x] Les propositions ne constituent plus un appariement validé dans les compteurs. La restriction initiale « décision définitive » est remplacée par le réexamen historisé décrit ci-dessus.
- [x] Typecheck réussi ; tests ciblés finaux : **32 réussis / 0 échoué** (BridgeSnapshotService 23, migrations 9). Suite complète et packaging réservés au checkpoint final.
- [ ] Recette Carlos : valider une proposition vérifiée, refuser une autre, rouvrir la comparaison et vérifier historique/identité, contrôler que le bilan A/B ne change pas. Utiliser le profil de validation.
- [ ] Recette réelle sur une prochaine modification naturelle du site à compléter ; elle ne bloque pas les lots suivants si les contrôles ciblés restent verts.
- Base locale connue : `d05c38fd6e445c7d4adaedc47c0c8266a0df29e6`. Aucun commit, push ou intégration de branches 40/41/42 dans cette passe.
- Prochaine étape : recette de cet écran puis composition multi-composants ; publication production et intégration des branches différées.

## Lot 5 — Familles / Variantes depuis les retours Bridge — 26/09/2026

- [x] Migration 40 : familles de composants et variantes explicites, sans modifier les contrats Bridge V1.
- [x] Un composant source devient la variante de base de sa famille uniquement lors d’une décision humaine de promotion.
- [x] Une occurrence peut rester seule, devenir une nouvelle variante, mettre à jour une variante existante ou être détachée dans une nouvelle famille.
- [x] Une occurrence déjà marquée « Conserver uniquement cette occurrence » peut ensuite être promue ; l’historique des décisions reste journalisé.
- [x] Les changements structurels créent une variante `forked` et imposent une nouvelle validation humaine.
- [x] Les adaptations limitées aux champs configurables d’une source stable et validée peuvent hériter de la validation ; les changements inexpliqués restent « À adapter ».
- [x] Compatibilité avec les retours Bridge 0.7.4 : l’ancien faux positif HTML dû à un espace terminal insignifiant ne bloque pas une promotion sûre.
- [x] Les assets de la version source sont copiés vers la nouvelle version avec compensation des fichiers en cas d’échec transactionnel.
- [x] L’identité Family / Variant gérée par Manager prime lors de l’export du Component Package vers Bridge.
- [x] La Bibliothèque affiche désormais un arbre Famille → Base → Variantes, rend ces éléments recherchables et permet d’ouvrir puis de réexporter un composant promu.
- [x] Les retours Bridge sont revus dans une fenêtre contextuelle avec son propre scroll ; après décision la fenêtre se ferme et la Bibliothèque est rafraîchie.
- [x] L’écran de revue d’un retour active les décisions Famille / Variante et ouvre directement le composant créé ou mis à jour.
- [x] Tests ajoutés pour migration 40, promotion après conservation, variante sûre, variante structurelle forkée, copie d’assets, nouvelle famille, mise à jour de variante et identité exportée.
- [x] Validation MSI : typecheck réussi ; tests ciblés **52/52** (migrations 9, Occurrence Return 10, packages 33) ; recette réelle confirmée avec `Section — Mariage Why`, famille/base/variante et modales de retour.
- [x] Validation humaine de la version réutilisable confirmée : une v4 peut devenir stable et « Prêt à réutiliser » sans écraser l’historique.
- [ ] Finition UX en attente de recette après dernier correctif : actions du bandeau regroupées visuellement et bouton masquer/afficher Bibliothèque aligné sur le bouton masquer/afficher du menu principal.
- Aucun changement automatique de la Bibliothèque à l’import d’un retour ; toute promotion reste une décision humaine.

## Prochain lot — Diff Snapshot A / B — 26/09/2026

- [x] Recette MSI : les 29 écarts et le Workbench #3671 restaient classés modifiés/ajouté sur `d05c38f` ; la distinction technique et l'exclusion décrites dans le document de reprise étaient absentes du code.
- [x] Correctif local : catégorie interne `technical` et compteur dédiés lorsque les versions Bridge diffèrent, que la source brute est présente et identique, sans écart de titre/slug, statut, URL, builder, empreinte brute ou références d'assets. Les écarts d'extraction/dépendances restent visibles ; ce classement ne valide ni le rendu ni les ressources externes.
- [x] Les brouillons de type page portant le préfixe réservé `AWB Workbench — Bibliothèque —` sont exclus du bilan et listés explicitement. Les pages publiées, les titres ordinaires et les transitions vers un contenu non interne restent comparés. Aucun snapshot enregistré n'est modifié.
- [x] Validation locale du correctif : typecheck réussi ; `BridgeSnapshotService.test.ts` **16 réussis / 0 échoué**. Pas de suite complète, packaging, commit ou push.
- [x] Recette Carlos confirmée par capture : 24/09/2026 01:14 → 26/09/2026 13:48, 0 ajouté / 0 supprimé / 0 modifié réel / 29 techniques / 53 sans écart ; Workbench #3671 explicitement ignoré. Les détails affichent « Écart technique » pour les dépendances et les écarts structure/sources.
- [x] Vérification archive-à-archive : les **82/82 contenus communs** conservent le même SHA-256 de source brute WordPress/Divi ; les **169 assets** sont identiques. Les 29 écarts observés proviennent de l’évolution du scanner Bridge 0.4.2 → 0.7.5, pas d’une modification du contenu source.
- [x] Le compteur `ignoredInternal` et la liste explicite des Workbenches ignorés décrivent la même exclusion sans réécrire les snapshots.
- [x] Contrat interne de comparaison en lecture seule ajouté sans modifier Snapshot Schema V1.
- [x] Comparaison de deux snapshots du même site par `source_page_key` : ajouté / supprimé / modifié / inchangé.
- [x] Détection des écarts sur titre/slug, statut, URL, builder, source brute, empreintes, structure/modules, sources, assets et dépendances.
- [x] Comparaison des nœuds sans dépendre de leurs `occurrence_id` ; aucune mutation des snapshots.
- [x] API Electron + preload exposés pour lancer la comparaison depuis la page Sites.
- [x] Fenêtre contextuelle « Comparer deux copies » avec synthèse et détails des pages modifiées.
- [x] Revue des correspondances de modules ajoutée : score, confiance et raisons à partir du type, empreintes, libellé, profondeur, position, classes, IDs et matching hints.
- [x] Les correspondances ambiguës ou concurrentes restent explicitement « faible / à vérifier » et ne sont jamais écrites en base.
- [x] Le diff de structure ignore volontairement `logical_node_id` afin qu’une future annotation Manager ne crée pas elle-même un faux changement de snapshot.
- [x] Tests ajoutés pour comparaison nominale, refus de comparer un snapshot avec lui-même, pages ajoutées/supprimées, avertissements de snapshot partiel et proposition de correspondance non mutante malgré des `occurrence_id` différents.
- [x] Les snapshots partiels / scans incomplets produisent des avertissements explicites afin de ne pas présenter une absence comme une suppression certaine.
- [x] Correctif après recette réelle : les `source_id`, `page_snapshot_id` et `occurrence_id` étant propres à chaque snapshot, le diff compare désormais les fingerprints/contenus stables et non ces IDs volatils.
- [x] `audit_status` n’est plus assimilé à un changement métier du statut WordPress.
- [x] Les sélecteurs Avant / Après sont normalisés chronologiquement, même si la copie actuellement ouverte est la plus ancienne.
- [x] Avertissement prévu lorsque les deux copies proviennent de versions Bridge ou profils de fingerprint différents.
- [x] Test de régression ajouté : deux scans identiques avec IDs techniques différents doivent produire **0 modifié / 1 inchangé**.
- [x] Validation MSI : typecheck + test ciblé `BridgeSnapshotService.test.ts` (8/8 avant correctif, 16/16 après).
- [x] Recette réelle : bilan corrigé validé par Carlos sur les deux snapshots AtoumWeb.fr. Prochaine étape : validation humaine des correspondances de nœuds, sans attribution automatique ni modification des snapshots historiques.
- [x] Attribution des identités logiques uniquement après décision humaine dans le registre Manager (migration 41), sans réécriture des snapshots ; recette de l'écran en attente.

### Finition du round-trip LOT 4

- Bridge 0.7.5 : le diff HTML ignore les espaces finaux non significatifs juste avant la fermeture d’un élément de bloc.
- Le retour réel de `Section — Mariage Why · v4` / Workbench `#3671` a validé le cycle Manager → Bridge → Manager ; les trois couleurs configurées sont revenues comme variables CSS modifiées.
- Le correctif 0.7.5 ne réécrit pas les anciens retours déjà importés ; Manager reconnaît néanmoins ce faux positif historique lors d’une promotion LOT 5.

## Lot 4 — Réception Occurrence Return V1 — 25/09/2026

- [x] Stockage SQL dédié aux retours Bridge sans détourner les snapshots ni les versions de Bibliothèque.
- [x] Inspection ZIP sécurisée : manifest V1, SHA-256 de chaque fichier déclaré, Site Occurrence V1 et cohérence des identifiants.
- [x] Vérification que le composant et la version Bibliothèque source existent réellement dans Manager.
- [x] Import idempotent par empreinte du package et conservation locale du ZIP source.
- [x] API Electron pour lister, ouvrir, inspecter, importer et décider.
- [x] Écran Bibliothèque pour voir les changements, le contenu retourné et la provenance.
- [x] Décision « Conserver uniquement cette occurrence » enregistrée de manière transactionnelle.
- [x] Au périmètre du LOT 4, les choix « nouvelle variante / mise à jour variante / nouvelle famille » étaient visibles mais volontairement désactivés ; ils sont désormais implémentés par le LOT 5.
- [x] Tests ciblés ajoutés pour import nominal, déduplication, checksum invalide, version source inconnue et décision.
- [x] Validation MSI : typecheck réussi ; tests ciblés 12/12 (4 Occurrence Return + 8 migrations), 0 échec.
- Aucun changement des contrats V1, aucune publication production, aucune décision Family / Variant automatique.
- [x] Recette réelle 26/09/2026 : package Manager v4 → Workbench Bridge #3671 → configuration des champs → Occurrence Return V1 → import Manager → décision « occurrence conservée ».

## Lot 3 — Validation humaine des versions réutilisables — 25/09/2026

- [x] Une préparation automatique ne passe plus seule le composant à « Prêt à réutiliser » et ne marque plus la version stable.
- [x] Validation humaine explicite ajoutée avant le couple statut `ready` + version stable.
- [x] La validation humaine est enregistrée par un marqueur interne ; les anciens états auto `ready`/stable ne sont donc pas présentés comme validés humainement.
- [x] Compatibilité historique : les anciens composants Bridge `ready`/stable sans marqueur humain sont présentés comme « À adapter » et leur stabilité est explicitement qualifiée de technique/ancienne, sans réécriture automatique des données.
- [x] Généralisation incomplète et ressources distantes bloquent la validation ; JavaScript et dépendances imposent une confirmation humaine.
- [x] Les badges et messages distinguent désormais « préparé », « à reprendre » et « validé humainement ».
- [x] Le statut « Prêt à réutiliser » n’est plus attribuable par simple édition de métadonnées pour un composant Bridge non validé.
- [x] Tests unitaires ciblés ajoutés pour la décision automatique / humaine.
- [ ] Typecheck et tests locaux à exécuter sur le MSI après synchronisation.
- Aucun changement de migration, de contrat V1, de Famille / Variante ou de retour Bridge.

## Lot 2 — Transport des assets et imports — 25/09/2026

- Base vérifiée avant modification : 4fb795035b32f312ea16496ab13f6a7b8d74e682 ; working tree initialement propre.
- [x] Correspondance des références déclarées avec les fichiers du package par SHA-256 ; récupération ciblée des objets du coffre et déduplication.
- [x] Assets absents, externes ou sans correspondance signalés ; import incomplet refusé avant toute création.
- [x] Préparation des fichiers avant écriture métier ; transaction couvrant version, assets, index et journal ; compensation des seuls fichiers créés lors d'un échec.
- [x] Nouvelle tentative après échec testée pour nouveau composant et nouvelle version.
- [x] Typecheck réussi ; tests ciblés : 46 réussis / 0 échec ; suite complète exécutée une fois : 257 réussis / 0 échec (46 fichiers).
- Aucun changement des contrats V1 ni de migration. Les champs existants hash / checksumSha256 / archivePath assurent la correspondance ; le bilan de transport est calculé, pas ajouté au manifeste.
- Les originaux en base restent inchangés ; une empreinte prouvée peut enrichir seulement le JSON exporté.
- Bridge repo pending. Aucun push ; prochain lot en attente de validation utilisateur.


## Lot 1 — Fiabilisation des contrats V1 — 25/09/2026

- [x] Cibles image explicites src/srcset conservées ; style inline et anciennes images sans attribut cible explicite exportés unresolved.
- [x] Validation des schémas V1 existants aux frontières du package et des occurrences, sans dépendance supplémentaire.
- [x] Identités comparées structurellement ; identifiants Bibliothèque/version cohérents entre composant, identité et provenance.
- [x] Typecheck réussi ; tests ciblés : 53 réussis / 0 échec ; suite complète exécutée une fois : 247 réussis / 0 échec (46 fichiers).
- Aucun changement de migration, de contrat V1, de publication ou de qualification prêt/stable.
- Bridge repo pending.
- Prochaine action : validation utilisateur du lot 1 ; aucun lot 2 engagé.


## État canonique — 24/09/2026

> Cette section prime sur les entrées historiques plus bas. Source de vérité partagée ChatGPT / Codex MSI.

### Socle courant

- Branche de base fonctionnelle : `fix/pre-phase5-commercial-ux` au commit `3494a76`.
- Phase 6 intégrée dans ce socle.
- Phase 5 Administration / Finance : **différée, pas supprimée**.
- Branche active : `feature/project-blueprints-v1`.
- PR active : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**.
- Branche Phase 7 existante en parallèle : `feature/phase-7-analytics-v1` / PR #71 ; ne pas la poursuivre sans la réaligner sur Projet V2.
- Migrations sur Projet V2 / recette visuelle : **36**.
- `main` reste historique et très en retard par rapport au socle de travail ; ne pas l'utiliser comme base de développement courant.

### Projet V2 — réalisé

- [x] devis accepté → projet généré depuis les blueprints Catalogue ;
- [x] snapshot projet indépendant du modèle après création ;
- [x] phases repliées + étapes numérotées ;
- [x] glisser-déposer des étapes ;
- [x] plan / fiche redimensionnables ;
- [x] barre latérale escamotable et masquée automatiquement en Production ;
- [x] timer directement rattaché à une étape ;
- [x] notes et actions libres dans chaque étape ;
- [x] ressources / technique / temps ouverts en fenêtre sans quitter Production ;
- [x] pages renommables directement ;
- [x] validation avant clôture d'une phase et passage groupé de toutes les étapes en Terminé ;
- [x] undo / redo du travail de production ;
- [x] aide contextuelle des champs désactivable dans Réglages ;
- [x] coffre d'accès projet / étape chiffré avec Electron `safeStorage` ;
- [x] couche de cohérence UI transverse pour rapprocher les anciens écrans des pages récemment recettées.
- [x] page Facturation opérationnelle : éléments à facturer, tableau de bord, liste/fiche redimensionnable, import et ouverture du PDF Abby ;
- [x] statut Facturé verrouillé par la présence d’un PDF de facture client ;
- [x] facture PDF classée dans les Documents client / `03 Factures` sans API Abby ;
- [x] création d’un pack d’heures payant raccordée automatiquement aux éléments à facturer.
- [x] page Dépenses opérationnelle : frais internes AtoumWeb, client/projet, catégories, statuts, récurrence et justificatifs ;
- [x] suivi des frais engagés / payés avec dashboard mensuel et montant récurrent mensuel équivalent ;
- [x] justificatifs PDF/images stockés dans le workspace, avec classement client/projet lorsque disponible ;
- [x] migration 33 : table `expenses`.
- [x] thème Noir : contraste CRM/Prospection corrigé avec teintes sémantiques adaptées au sombre ;
- [x] identité visuelle CRM : logo + favicon pour les entreprises, photo/avatar pour les contacts, fallback initiales ;
- [x] identité réutilisée dans Annuaire Prospection, cartes du parcours et Clients ;
- [x] URL CRM normalisées : saisie sans protocole → `https://`, `http://` explicite conservé ;
- [x] migration 34 : table `crm_identity_assets`.
- [x] timer Intervention : démarrage → statut En cours ; arrêt guidé entre résolution et pause ; motif de pause historisé ;
- [x] incident résolu : passage À valider puis panneau Conclusion & rapport de fin avant clôture ;
- [x] migration 35 : motifs de pause sur `time_session_pauses` ;
- [x] Facturation / Dépenses : pictos SVG cohérents, splitter redimensionnable, fiche agrandissable et responsive ;
- [x] Bibliothèque AtoumWeb / Sauvegardes : liste + fiche redimensionnable, plein écran, fermeture explicite, responsive et hiérarchie typographique harmonisée.
- [x] protection renderer globale : une erreur React non interceptée n’aboutit plus à un écran noir muet ; l’erreur exacte est affichée dans AtoumWeb Manager ;
- [x] protection page Clients alignée sur la logique de la fenêtre Référence Prospect pour éviter qu’une fiche défaillante fasse disparaître toute l’interface ;
- [x] Gestion des temps : correction du plantage `ReferenceError: OperationIcon is not defined` introduit lors du remplacement des anciens symboles par les pictos SVG ; correctif confirmé visuellement sur MSI par l’utilisateur ;
- [x] thème Noir : contraste des teintes métier CRM renforcé pendant la recette visuelle continue.
- [x] Annuaire professionnel central : vues Organisations / Contacts, recherche et filtres, liens réels Client / Prospect / Externe, identité visuelle, fiche redimensionnable et agrandissable, sans migration supplémentaire ;
- [x] Statistiques V1 intégrées sur le socle Projet V2 : Vue d’ensemble / Commercial / Projets & temps / Clients, périodes mois / trimestre / année / toutes données, comparaison à la période précédente et indicateurs dérivés des données métier existantes ;
- [x] import Snapshot V1 AtoumWeb Bridge : nouvelle page **Sites**, inspection du ZIP avant import, contrôles SHA-256 / package fingerprint / références / arbres / compteurs, stockage historique Site → Snapshot → Page → Node, Sources / Assets / Dependencies, payloads en lecture seule et conservation des warnings du scan ;
- [x] migration 36 : stockage central des sites, snapshots, pages, nœuds, sources, assets, dépendances, relations et objets adressés par hash issus d’AtoumWeb Bridge ;
- [x] lecteur ZIP durci pour l’import Bridge : chemins dangereux, entrées chiffrées, types Unix spéciaux, doublons, CRC, tailles et ratios de compression suspects refusés ;
- [ ] diff Snapshot A / B et attribution des `logical_node_id` Manager à valider après réception d’un second snapshot réel.
- [ ] analytique avancée Phase 7 encore à réaligner : encaissements/paiements, rentabilité complète par prestation, exports statistiques et pilotage avancé.

### Validation

- [x] dernier checkpoint MSI confirmé par l’utilisateur avant ce lot : **40 fichiers / 187 tests réussis**, SQLite à **34 migrations**.
- [ ] revalider le HEAD actuel après le dernier lot : aide / actions / coffre sécurisé / Catalogue Offres & Tarifs / ateliers Interventions & Packs / Gestion des temps / Facturation PDF Abby / Dépenses / identité CRM / timer Intervention / Bibliothèque / Sauvegardes / Documents & Contrats / Annuaire / Statistiques / migrations 31–36 / import Bridge / cohérence UI globale. La recette visuelle a déjà confirmé le correctif du plantage Gestion des temps après import manquant de `OperationIcon`.
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Validation-MSI : Projet + anciens écrans principaux + trois thèmes.

### Prochaine action

Sur MSI :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Voir aussi : `docs/HANDOFF_CODEX_MSI.md`.


## Lot UX commercial avant Phase 5 — 19/09/2026

Branche `fix/pre-phase5-commercial-ux`, créée depuis `fix/prospect-recipe-ux-v2` à `3bc0f19`. Phase 5 en pause ; Phase 6 non intégrée. Aucune migration modifiée.

- [x] Fiches Prospect et Client : mode compact et vue agrandie avec défilement interne et hauteur disponible corrigée.
- [x] Couleurs métier des fiches, cartes et champs blancs ; température retirée du texte des cartes Prospect sans changer la donnée.
- [x] Qualification Prospect : accès direct aux champs manquants ; raccourcis vers besoin et relance.
- [x] Fiche Client : coordonnées prioritaires, éléments liés réellement présents, échéances conditionnelles et accès secondaires repliés.
- [x] Relation Client : cinq états distincts de la température Prospect, changement rapide, couleur de la fiche et des lignes, historique de transition.
- [x] `npm run typecheck` et `npm test` : 30 fichiers / 135 tests réussis.
- [ ] Recette visuelle Windows finale sur le profil de validation, plusieurs résolutions et trois thèmes.

Prochaine action : terminer la recette visuelle du lot avant toute validation finale ou fusion. Aucune migration ajoutée.

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche Git historique** : `main` (non utilisée comme base courante tant que le socle n'est pas consolidé)
- **Socle fonctionnel courant** : `fix/pre-phase5-commercial-ux`
- **Chantier actif** : `feature/project-blueprints-v1` — PR #73
- **Statistiques V1 initiales intégrées dans le chantier actif** ; la branche historique `feature/phase-7-analytics-v1` / PR #71 reste à réaligner uniquement pour l’analytique avancée non encore reprise
- **Migrations courantes sur Projet V2 / recette visuelle** : 35
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

### Stabilisation transverse — 15/09/2026

- [x] migration SQLite 19 : pipeline enrichi, température neutre, qualification, coordonnées multiples, actions structurées et documents client
- [x] ancien libellé « Dossier partagé » retiré de l’interface ; l’identité, les besoins, les devis et les projets restent des données liées
- [x] parcours devis « en préparation → à envoyer → envoyé » sans modifier le statut technique `draft` avant envoi
- [x] fichiers client stockés hors SQLite sous `clients/<client-id>/Documents`, métadonnées en base
- [x] correction du paquet Windows vide : renderer désormais inclus dans `app.asar`
- [x] validations automatisées : 28 fichiers, 118 tests, TypeScript et packaging
- [ ] recette fonctionnelle et visuelle Windows du scénario Boulangerie Martin

### Prospect Workflow V2 — 15/09/2026

Branche : `feature/prospect-workflow-v2`  
Base fonctionnelle : `fix/recette-commerciale-coherence` au commit `b30d2a89e0515f4193e4958097be838fbd0eba44`.  
Aucune fusion dans `main`.

- [x] migration 20 : origine commerciale, démarrage de prospection, qualification V2 et référence `decision_maker_contact_id`
- [x] parcours clarifié : `Nouveau contact → À qualifier → Besoin à identifier → Devis à préparer`
- [x] bouton explicite `Démarrer la prospection` et ouverture de la fiche de travail bureau
- [x] qualification conditionnelle selon l’origine du contact ; le besoin détaillé n’est plus demandé à cette étape
- [x] `Projet & solution AtoumWeb` raccordé au catalogue existant avec ajout de prestation en une seule action
- [x] contrôle avant devis intégré à l’étape `Besoin à identifier` ; ancien placeholder séparé supprimé
- [x] validation téléphone/email centralisée via `contactValidation`
- [x] décisionnaire rattaché à un vrai `contacts.id` ; coordonnées via `contact_methods`, anciennes colonnes conservées seulement pour compatibilité de migration
- [x] `Compact / Confort / Confort +` disponible dans les Réglages
- [x] température commerciale visible sur la carte, le panneau rapide et la fiche bureau
- [x] rappels rapides `demain / +7 jours / date précise` raccordés à `crm_actions`
- [x] suivi devis recentré sur `Devis à préparer → Devis à envoyer → En attente de retour`
- [x] après envoi : devis, montant, validité, délai restant et prochaine relance mis en évidence dans la fiche et la vignette pipeline
- [x] issues distinctes après envoi : `Accepté / signé`, `À modifier / Négociation`, `Refusé`; refus du devis distinct du statut Prospect `Perdu`
- [x] alerte de validité du devis dans les 7 derniers jours
- [x] ancien composant de qualification V1 supprimé
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] recette visuelle Windows sur le workspace de test propre

La CI de cette branche a été branchée sur le workflow GitHub. Les runners disponibles dans l’environnement GitHub actuel n’exécutent cependant aucune étape (`runner_id` nul/0), y compris avec `windows-latest`; un statut rouge sans étape n’est donc pas un résultat de compilation ou de test. La validation TypeScript/tests doit être exécutée localement tant qu’un runner utilisable n’est pas disponible.

Périmètre volontairement différé : refonte profonde de l’éditeur de devis et système d’import des packs d’offres `.atoum`. Les offres/contrats seront d’abord préparés comme configuration métier, puis le Manager évoluera selon le contrat technique commun validé.

### Correctifs de recette UX Prospect — 16/09/2026

Branche : `fix/prospect-recipe-ux-v2`  
PR : #67, conservée en brouillon.  
Base : `feature/prospect-workflow-v2` au commit validé `8284e1fc64c53bb4e5976a58c1fdb52715c5c671`.  
Aucune fusion dans `feature/prospect-workflow-v2` ni dans `main` avant validation technique et recette visuelle.

- [x] taille de texte fonctionnelle minimale portée à 14 px, y compris en densité Compact
- [x] fiche de travail Prospect élargie et agrandie sans plein écran forcé ; densité verticale réduite
- [x] teinte commerciale conservée sur la fiche avec champs neutres et contours liés à la température
- [x] interlocuteur principal ajoutable ou modifiable après création du prospect
- [x] décisionnaire sélectionnable parmi les Contacts liés, créable comme nouveau Contact ou conservé inconnu
- [x] autres Contacts d’entreprise avec fonction libre (`Gérant`, `Patron`, `Banquier`, `Comptable`…) sans détourner le libellé d’une coordonnée
- [x] bloc Coordonnées pleine largeur : propriétaire distinct de l’usage, plusieurs téléphones/emails par Contact
- [x] Actions / Relances enrichies avec cible Contact, motif, date, heure, contexte et récurrence avancée
- [x] compte rendu d’action en pleine largeur avec suites proposées selon le résultat
- [x] refus catégorique : classement Prospect `Perdu` sans recréation automatique d’une récurrence
- [x] informations nécessaires au devis transformées en checklist conservant les réponses et les points à obtenir plus tard
- [x] historique du dossier replié par défaut avec aperçu des 10 événements les plus récents
- [x] suivi devis du panneau latéral rendu lisible en disposition verticale
- [x] migration 21 limitée au contexte structuré des actions (`target_contact_id`, `reason_code`, `reason_text`)
- [x] tests ajoutés pour le contexte des actions, l’arrêt explicite d’une récurrence et les Contacts liés du workflow
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Windows de la fiche Prospect corrigée

Le workflow CI de la PR #67 est actuellement créé mais reste en file d’attente sur le runner Windows ; aucun résultat de compilation ou de test ne doit être déduit tant qu’aucune étape n’a réellement démarré.

## Phase 0 — Fondation

Validations réelles effectuées sous Windows le 13/09/2026 :

- [x] `npm install`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run package`
- [x] démarrage réel Electron
- [x] navigation principale
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] workspace local
- [x] sauvegarde manuelle SQLite
- [x] restauration SQLite
- [x] sauvegarde automatique `pre-restore` avant restauration
- [x] correction du redémarrage de restauration en mode développement
- [x] `package-lock.json` versionné
- [ ] fusion finale de la fondation dans `main`

Workspace Windows validé :

- `C:\Users\carlo\Documents\AtoumWeb Manager`
- base : `data\atoumweb-manager.sqlite`
- sauvegardes : `backups\automatic`, `manual`, `pre-migration`, `pre-restore`

## Phase 1 — CRM

Branche : `feature/phase-1-crm`  
PR : #58 (brouillon)

### Fonctionnel

- [x] Organisations / Contacts maîtres
- [x] Prospects et pipeline
- [x] Clients
- [x] contacts multiples + rôles
- [x] conversion Prospect → Client transactionnelle et idempotente
- [x] archivage/réactivation
- [x] recherche globale CRM
- [x] journal d’activité
- [x] Actions / Relances multiples
- [x] prochaine échéance dérivée des actions ouvertes
- [x] Relance → étape `À relancer`
- [x] vue Prospects Pipeline / Historique
- [x] panneaux Prospect/Client à droite avec retour pleine largeur quand fermés
- [ ] deep-links précis Client/Prospect depuis tous les résultats de recherche
- [ ] enrichissement Client avec Projets/Facturation/Temps au fil des phases suivantes

### Validation réelle Windows

- [x] SQLite à 4 migrations
- [x] `npm run typecheck`
- [x] `npm test` — **5 fichiers / 17 tests réussis**
- [x] pipeline / drag-and-drop / piles de cartes
- [x] comportement panneaux latéraux validé visuellement
- [ ] dernier test visuel Actions / Relances multiples + Historique dédié

## Phase 2 — Commercial

Branche : `feature/phase-2-commercial`  
PR : #59 (brouillon)

### Développé

- [x] migration 5 — Catalogue Services / Offres
- [x] migration 6 — Devis
- [x] Services et Offres versionnés
- [x] composition d’une Offre à partir de versions de Services
- [x] inclus / optionnels / quantités
- [x] prix, prix conseillé, modes tarifaires, prérequis, inclusions/exclusions
- [x] version publiée immuable
- [x] création de nouvelle version sans modifier l’historique
- [x] numérotation `DEV-YYYY-001`
- [x] lignes Catalogue et lignes libres
- [x] snapshots autonomes du catalogue et des compositions d’Offres
- [x] remises % / montant / prix imposé / gratuité
- [x] valeur catalogue distincte de la valeur contractuelle
- [x] acompte / solde
- [x] statuts Devis
- [x] acceptation Prospect → Client
- [x] prévisualisation client sans données internes
- [x] génération PDF sous `exports\devis`
- [x] recherche globale Offres / Services / Devis

### Validation restante

- [ ] migration réelle 4 → 6 sous Windows avec sauvegarde `pre-migration`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] parcours visuel complet Catalogue / Devis / PDF
- [ ] trois thèmes

## Phase 3 — Projets & Production

Branche : `feature/phase-3-projects`  
PR : #60 (brouillon, empilée au-dessus de Phase 2)

### Migration 7 — Projets

- [x] modèles de projets
- [x] versions de modèles
- [x] arbre modèle Lot → Module/Page → Tâche → Checklist
- [x] versions publiées figées
- [x] `projects`, `project_nodes`, `project_services`, `project_prerequisites`
- [x] lien unique Devis ↔ Projet
- [x] numérotation `PRO-YYYY-001`
- [x] transformation Devis accepté → Projet idempotente
- [x] copie du snapshot commercial dans le projet
- [x] prérequis issus du devis/catalogue
- [x] projet interne AtoumWeb sans client externe
- [x] progression calculée depuis les tâches obligatoires
- [x] prévention des boucles parent/enfant
- [x] déplacement/réordonnancement transactionnel des nœuds Projet
- [x] arborescence physique Ressources créée automatiquement
- [x] checklist d’avertissement non bloquante avant passage `Terminé`

### Interface Projets

- [x] liste + filtres
- [x] fiche latérale Projet
- [x] création depuis devis accepté
- [x] création Projet interne
- [x] gestion des Modèles de projets
- [x] publication / nouvelle version de modèle
- [x] Résumé
- [x] Plan / Tâches
- [x] déplacement de parent + ordre ↑/↓ dans le plan
- [x] Prérequis
- [x] Ressources
- [x] Bibliothèque technique projet
- [x] Temps
- [x] Commercial
- [x] recherche globale Projet / tâches / Ressources / Bibliothèque
- [x] Dashboard alimenté par les projets actifs

### Migration 8 — Ressources projet

- [x] `file_assets`
- [x] `file_asset_links`
- [x] fichiers physiques conservés hors SQLite
- [x] dossiers `01 Identité` à `07 Archives`
- [x] import de fichiers dans le workspace
- [x] checksum SHA-256
- [x] prévention des doublons par checksum dans un projet
- [x] statut Reçu / À traiter / En cours / Validé / Obsolète
- [x] rôle Client / Réécriture AtoumWeb / Final / Autre
- [x] même fichier lié à plusieurs tâches sans duplication physique
- [x] détection fichier manquant
- [x] relocalisation/restauration d’une ressource
- [x] ouverture fichier / dossier depuis Electron
- [x] interface Ressources raccordée à la fiche Projet
- [x] indexation dans la recherche globale
- [x] tests Ressources écrits
- [ ] galerie miniature images/médias

### Migration 9 — Bibliothèque technique projet

- [x] `technical_items`
- [x] `technical_item_versions`
- [x] `technical_item_assets`
- [x] catégories Header / Footer / Hero / Page / Section / CSS / JS / PHP / ACF / Divi / Woo / Plugin / Config / Note
- [x] contenu Code / JSON / Texte / Référence
- [x] version actuelle
- [x] version stable distincte de la version actuelle
- [x] historique immuable
- [x] liaison aux vraies Ressources du projet
- [x] archivage
- [x] aucun code exécuté automatiquement
- [x] interface Bibliothèque dans la fiche Projet
- [x] `Préparer pour réutilisation` génère un paquet projet sans généralisation automatique
- [x] recherche globale des éléments techniques
- [x] tests versioning / stable / ressources / réutilisation écrits
- [x] schéma déjà extensible à `scope=atoumweb` pour la future Phase 6 sans modifier les projets clients
- [ ] coloration syntaxique avancée / Monaco plus tard
- [ ] captures/aperçus avancés plus tard

### Migration 10 — Timer & sessions de temps

- [x] `time_sessions`
- [x] `time_session_pauses`
- [x] une seule session active globalement garantie par SQLite
- [x] contexte Client / Projet / Tâche
- [x] catégories de temps
- [x] facturable / non facturable
- [x] source Timer / Manuel / Import
- [x] démarrer / pause / reprendre / arrêter
- [x] durée réelle calculée depuis timestamps et pauses
- [x] session active conservée après navigation et fermeture de l’application
- [x] heartbeat du chrono pour mémoriser le dernier point connu
- [x] détection d’une session oubliée après fermeture/redémarrage
- [x] reprise sans compter l’interruption
- [x] arrêt au dernier point connu
- [x] saisie manuelle
- [x] correction d’une session historique terminée
- [x] protection des pauses existantes pendant une correction
- [x] changement d’activité transactionnel : terminer l’ancienne + démarrer la nouvelle au même instant
- [x] synthèse temps total / facturable / non facturable
- [x] filtres Aujourd’hui / Semaine / Mois / Client / Projet / Catégorie / Facturable
- [x] vrai timer global dans le header
- [x] page `Gestion des temps`
- [x] onglet Temps dans la fiche Projet
- [x] temps estimé vs réel + écart dans Projet
- [x] raccourcis Projet/Tâche → timer global prérempli
- [x] Dashboard : temps du mois dérivé des sessions
- [x] tests Timer/pause/reprise/redémarrage/correction/changement d’activité écrits
- [x] doublon d’enregistrement IPC Timer supprimé

### Reste Phase 3 avant validation finale

- [ ] réorganisation/duplication plus complète des nœuds dans les **modèles** de projets
- [ ] galerie miniature images/médias
- [ ] ergonomie avancée Bibliothèque (copie/agrandissement/coloration)
- [ ] validation du cas de référence Cazor
- [ ] validation locale Windows migrations 6 → 10
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] test visuel complet trois thèmes
- [ ] mise à jour finale documentation Phase 3 après validation

## CI GitHub

Le workflow couvre maintenant les branches Fondation / Phase 1 / Phase 2 / Phase 3.

Les runs Phase 3 observés restent **non exploitables** : GitHub crée le job `windows-latest` mais lui attribue `runner_id: 0` et n’exécute aucune étape. Il n’y a donc ni checkout, ni installation, ni typecheck, ni tests. Le statut rouge ne constitue pas un échec du code.

La validation réelle continue donc d’être effectuée localement sur Windows.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39
- **Phase 6 — Référentiels & Continuité** : #40–#47
- **Phase 7 — Statistiques & Stabilisation V1** : #48–#57

## Règles à ne pas casser

1. Prospect et Client partagent les mêmes Organisations/Contacts ; aucune recopie d’identité.
2. Archivage plutôt que suppression destructive.
3. Conversion Prospect → Client idempotente.
4. Valeur commerciale, valeur contractuelle, facturé, encaissé et dépenses restent distincts.
5. Fichiers lourds hors SQLite ; la base stocke les références et métadonnées.
6. Abby reste la source des factures réglementaires en V1.
7. Bibliothèque projet et Bibliothèque AtoumWeb restent indépendantes.
8. Aucun code de bibliothèque n’est exécuté automatiquement.
9. Une sauvegarde serveur n’est jamais considérée comme une sauvegarde locale.
10. Statistiques et recherche sont dérivées/reconstruisibles.
11. Tous les éléments historiques importants sont journalisés.
12. Une Relance et une Action sont deux objets distincts ; plusieurs peuvent coexister sur un même dossier.
13. Les panneaux latéraux Prospect/Client/Projet restent à droite et les listes reprennent la largeur disponible lorsqu’ils sont fermés.
14. Le temps réel a une seule source : `time_sessions`. Aucun module ne maintient un compteur indépendant.
15. Une version de modèle, de catalogue ou de composant déjà utilisée ne modifie jamais rétroactivement un dossier existant.

## Travail en cours

**Phase 3 — fermeture des derniers écarts fonctionnels avant validation Windows.**

Prochaine validation Windows après stabilisation de la branche : migration vers 10 migrations, `npm run typecheck`, `npm test`, puis parcours Projet / Ressources / Bibliothèque / Timer / Gestion des temps.

## Phase 4 — Validation automatisée du 14/09/2026

Cette entrée actualise le travail en cours décrit plus haut : Phase 4 en gel fonctionnel, validation visuelle Windows restante.
Branche : feature/phase-4-operations — PR #61 conservée en brouillon.
Point de départ distant vérifié : 6d09156.

- [x] Node local 20.19.3 / npm 10.8.2 vérifiés.
- [x] npm run typecheck : aucune erreur.
- [x] npm test : **26 fichiers / 102 tests réussis**, aucun échec ni test désactivé.
- [x] Tests exécutés par le script du dépôt sous Electron 44.3.0 / Node embarqué 24.20.0.
- [x] Correction du tri SQLite des alertes : alias explicite created_at dans le UNION ALL.
- [x] Temps Intervention calculé par TimeService : suppression de la troncature SQL imprécise, mêmes pauses et même arrêt au dernier point connu que le Timer.
- [x] Tests de non-régression des pauses avec millisecondes et de la récupération d'une session oubliée.
- [x] Migrations 1 à 17 : base vierge, ordre, application unique, mises à niveau depuis 4 / 6 / 10, préservation des données sentinelles et d'une session Phase 3, index composite, intégrité SQLite.
- [x] Revue du périmètre : services Opérations, tests et suivi documentaire uniquement ; aucune migration modifiée ou renumérotée.
- [ ] Validation visuelle Windows et migration sur données existantes avec sauvegarde pré-migration.
- [ ] Parcours Intervention / Demande → Intervention / modification et retrait du rattachement / Timer au contexte sauvegardé / persistance après redémarrage.
- [ ] Régressions Opérations / Maintenance / Packs / Incidents / recherche / fiches Client et Projet / trois thèmes.

Aucune donnée du dossier utilisateur Documents\AtoumWeb Manager touchée. Les tests utilisent uniquement des bases en mémoire et des espaces temporaires de test.
Le nouveau test d'index a été corrigé après constat : l'index existant comprend intervention_id puis started_at DESC ; l'assertion contrôle ces deux colonnes et leur ordre.
Gel fonctionnel Phase 4 maintenu. Phase 5 différée, aucun apport de la branche Phase 6, aucune fusion.
Point d'attention manuel : vérifier aussi la fluidité des listes d'interventions avec un historique de temps volumineux, le total utilisant désormais le service de temps commun.

Prochaine action : lancement normal du Manager et parcours du plan docs/PHASE_4_VALIDATION_WINDOWS.md avec les données existantes et sauvegarde pré-migration. Conserver la PR #61 en brouillon ; aucune fusion avant validation Phase 4.


## Stabilisation transverse — issue #65

Branche feature/stabilisation-parcours-metier créée depuis 4f1323a (Phases 1 à 4 validées). Périmètre étendu explicitement par la demande utilisateur : catalogue AtoumWeb, besoins CRM référencés, continuité devis/projet/dashboard, données demo et responsive. Phase 6 non intégrée, Phase 5 non démarrée, aucune fusion.

- [x] Socle propre vérifié : 26 fichiers / 102 tests, typecheck vert.
- [x] Migration 18 ajoutée sans renuméroter 1 à 17 : catalogue AtoumWeb, conditions commerciales, besoins CRM et marquage des lots demo.
- [x] Parcours raccordé : fiche Prospect/Client, devis et conditions, acceptation vers Projet, dashboard et liens profonds.
- [x] Saisies de démonstration identifiables, trois parcours cohérents, sauvegarde obligatoire et purge transactionnelle sélective.
- [x] Responsive, défilement des panneaux et taille des textes harmonisés.
- [x] `npm run typecheck` : aucune erreur.
- [x] `npm test` : **27 fichiers / 113 tests réussis**, aucun échec ni test désactivé.
- [x] `npm run package` : package Electron Windows x64 généré avec succès pendant la stabilisation.
- [ ] Validation visuelle Windows sur un workspace temporaire, puis parcours métier sur données utilisateur uniquement après sauvegarde explicite.

Les tests couvrent les migrations vierges et mises à niveau, les prix confirmés / Sur devis, les besoins multiples, la conversion idempotente, les données vivantes, les snapshots, les lignes de devis atomiques, la création Projet, le dashboard et la purge demo sans suppression des références ni des dossiers réels.

Prochaine action : validation visuelle du parcours complet et des trois thèmes sous Windows. Aucune ouverture du workspace utilisateur sans sauvegarde explicite.

Clôture Lot 3 — 03/10/2026 : bilan réel validé par AtoumWeb ; commit local dédié autorisé, sans push ni merge. La recette manuelle AtoumWeb reste à faire avant validation fonctionnelle finale. Cette clôture ne contient aucune modification du Lot 4.

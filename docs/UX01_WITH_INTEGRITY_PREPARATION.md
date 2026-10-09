# Reprise UX-01 après la fusion de #81 — garde de restauration au quit

**10/10/2026 — branche isolée `prep/ux01-restore-quit-gate-v2`. NON PRÊTE À FUSIONNER.**

## Historique et intention

- `main` contient #81 (merge commit `68bfd952e394169ade65e3f0697422d8c00c2cc7`), dont les protections UX-16/UX-03 restent intactes.
- Reprise de la composition préparatoire `prep/ux01-with-integrity-v1@8a577f1`; la branche officielle de PR #83 et #82 ne sont pas modifiées.
- Risque identifié : le flux packagé écrivait `pending-database-restore.json` avant `app.quit()`. Une confirmation de fermeture rejetée pouvait laisser un marqueur exécutable au démarrage suivant.

## Modifications sur cette branche

- Base Git réalignée par **merge commit normal** de `main@68bfd952` sur la branche préparatoire après vérification de l'identité des trees `main` et HEAD validé de #81. `main` est maintenant ancêtre de la préparation, sans modification du tree par le commit de merge.
- `PROJECT_STATUS.md` et `docs/MANAGER_BRIDGE_ROADMAP.md` réunissent maintenant les historiques de #81 et #83 en préservant les chronologies originales (ancien contenu #81 conservé, blocs #83 ajoutés).
- `RestoreQuitGate` conserve uniquement en mémoire une intention de restauration avec un ticket non réutilisable. Elle n'est exécutée qu'au **`will-quit`**. Chaque veto connu du cycle de sortie (`before-quit` ou `will-prevent-unload`) annule l'intention.
- `backups:restore` conserve la prévalidation de la source et les contrôles de brouillons ; pour le **mode packagé**, `scheduleDatabaseRestore(sourcePath, workspace)` puis `app.relaunch()` sont différés jusqu'au `will-quit`. Aucun marqueur de cette demande n'est écrit pendant l'attente de sortie. L'ancien minuteur ne peut pas fermer une nouvelle demande après annulation.
- En **mode développement**, « Programmer la restauration » conserve son sens distinct : la demande est écrite pour un prochain démarrage manuel, sans fermeture ni relance automatique.
- Si la vérification finale refuse la source/cible pendant `will-quit`, la relance n'est **pas** demandée : le Manager se ferme normalement avec un dialogue explicite. L'utilisateur doit le relancer et renouveler la demande. Aucun contournement des vérifications UX-16 n'est introduit.

## Vérifications à ce stade

- Recette multi-processus Electron `scripts/check-restore-quit-roundtrip.cjs` ajoutée, [protocole et limites](UX01_RESTORE_QUIT_ROUNDTRIP.md). Elle utilise cinq processus Electron natifs isolés, source/destination et profils TEMP, deux redémarrages contrôlés, sauvegarde pre-restore, refus de fermeture et absence de rejeu. **Syntaxe CJS vérifiée seulement ; exécution réelle sur Windows non encore faite.**
- Cinq scénarios du garde isolé reproduits et réussis localement avec Node 22 / test runner natif (équivalent de la logique livrée) : commit uniquement à `will-quit`, sortie annulée, ticket périmé, échec une seule fois, deux demandes concurrentes.
- Cinq tests permanents Vitest du garde ajoutés dans `src/main/restoreQuitGate.test.ts`, **non exécutés dans l'environnement complet**.
- Cinq tests supplémentaires de raccordement `registerGuardedShutdown` / `bindUnsavedWindow` / événements Electron simulés dans `src/main/restoreQuitLifecycle.test.ts`, également **non exécutés**. Ils couvrent `before-quit`, `will-quit`, `will-prevent-unload`, pending et échec de programmation finale ; ces mocks ne remplacent pas une vraie recette Electron.
- Recette native `scripts/check-unsaved-inputs-ui.cjs` enrichie de deux contrôles de refus de quit par thème (fenêtre principale et fenêtre détachée), **non exécutée**. Syntaxe CJS analysée avec succès.
- **Typecheck global, suite Vitest complète, recette Electron Windows et CI GitHub non exécutés** sur ce nouveau SHA. Les précédents 750/750 de #81 ne valident pas cette nouvelle combinaison.

## Points de contrôle avant décision

1. Tester la sortie réelle packagée acceptée et le redémarrage voulu, en plus des sorties refusées ; vérifier l'absence de marqueur au lancement suivant quand « Rester » a été choisi.
2. Tester source invalide, cible/workspace modifiés, pending, nouvelle saisie et fenêtres détachées sur **fixtures temporaires** uniquement ; aucune ouverture de Validation-MSI.
3. Vérifier que le runtime Electron déclenche bien `will-quit` après validation de toutes les fenêtres, et qu'aucun autre listener ne le bloque.
4. Réconcilier `PROJECT_STATUS.md` et `docs/MANAGER_BRIDGE_ROADMAP.md` avec l'historique #83 (actuellement restés en version #81 sur la branche préliminaire).
5. Exécuter typecheck, tests ciblés, suite complète, recette trois thèmes et une CI Windows sur le SHA définitif **après accord distinct**.
6. Conserver #83 draft tant que ces contrôles ne sont pas verts. Aucune fusion automatique.

---

## Checkpoint antérieur (composition statique #81 + #83)

# Préparation : intégration UX-01 avec restauration sécurisée

Statut : composition statique NON TESTÉE, branche isolée ; aucune fusion dans les PR #81 ou #83.

- Base : #81 SHA 073496df0ba22498b98f574cc80d6e895ca1ab2b (CI Windows #651 verte).
- UX-01 repris de #83 SHA 5b38cbe1e32e48aaf38154fb7c8e94bb36e2121f.
- Correctif supplémentaire depuis prep/ux01-window-approval-v1 : éviter une seconde boîte de confirmation, deux tests ajoutés.
- IPC : conserver destination workspace et scheduleDatabaseRestore(sourcePath, workspace) de #81, plus autorisations de quitter de #83.
- Main : conserver DatabaseRestoreError et dialog.showErrorBox de #81, plus bindUnsavedWindow, registerGuardedShutdown et cleanup will-quit de #83.
- Documents PROJECT_STATUS.md et docs/MANAGER_BRIDGE_ROADMAP.md laissés à la version #81 provisoirement : fusion documentaire ultérieure indispensable.
- Aucune exécution de ces sources combinées. Ni typecheck ni tests sur cette branche ne sont affirmés.

Points à vérifier avant intégration :
1. Tests restore.test.ts, unsavedWindows.test.ts, unsavedRegistry.test.ts, draftSection.test.ts, QuoteContractPreparationService.test.ts.
2. Après programmation restauration, toute annulation de fermeture/nouvelle saisie ne doit pas permettre une restauration différée non désirée.
3. Workspace, sélecteur annulé, nouvelle saisie après consentement, fenêtres détachées et cleanup DB : aucune perte.
4. Recette graphique 3 thèmes, typecheck, suite complète et CI Windows autorisée au SHA final.
5. Reporter les historiques #81 et #83 dans PROJECT_STATUS et roadmap sans écraser aucune chronologie.

Ce fichier prépare les tests ; il ne constitue pas une validation.
## 10/10/2026 — Décision de préparation de l'intégration #83

- **Source validée** : `prep/ux01-restore-quit-gate-v2` (HEAD à vérifier à la remise). Descend de `main@68bfd952` (#81 fusionnée) : comparaison GitHub `main..prep` = **38 commits ahead / 0 behind** au point de contrôle documentaire, **49 fichiers modifiés**, y compris les gardes UX-01, tests et preuves. La divergence historique est volontaire ; **aucun code de production `src/` n'a changé après `88efb788`**, SHA des validations Windows typecheck/801/183. Les recettes natives 12/12 (`dbfd0e2`) et packagées (2/2, `61786e1`) se sont déroulées plus tard sans modification des services métier.
- **PR officielle historique #83** : base `main`, HEAD `5b38cbe1`, draft, GitHub `mergeable:false`. `main..#83` est **divergé : 4 ahead / 17 behind**, car #83 était issue d'une base antérieure à #81. Ne pas tenter une fusion brute de cette vieille version.
- **Recommandation d'intégration, non exécutée** : ouvrir en temps voulu une **nouvelle PR de remplacement** de `prep/ux01-restore-quit-gate-v2` vers `main` (ou transférer explicitement ce travail dans #83 après sauvegarde de son historique), sans effacer l'ancienne PR tant que la traçabilité n'est pas assurée. La création d'une PR peut déclencher automatiquement des **GitHub Actions payantes** ; demander l'accord de l'utilisateur pour cette étape et la CI. Les documents historiques doivent être conservés.
- **Avant fusion** : revoir la portée UX-01, obtenir la CI sur le SHA réellement destiné à `main`, conserver un retour arrière humain, confirmer que le package Forge final n'a pas été testé par la recette packagée indépendante. Pas de migration 67, pas de modification des offres/commercial/CGV/maintenance/Bridge.
- **État** : aucune PR nouvelle créée, aucun changement de `main`, #82, de la PR officielle #83 ou de Validation-MSI. Aucun déclenchement CI.


## Vérification finale de l'intégration (PR #85)

- La PR de remplacement **#85** utilise `prep/ux01-restore-quit-gate-v2` sur `main`, sans conflit GitHub. L'ancienne #83 reste conservée pour l'historique.
- Le dernier changement avant CI est **exclusivement documentaire** ; le code de production `src/` correspond aux tests Windows vérifiés : typecheck, 801/801 tests, 183/183 UI, recette native 12/12 et relance packagée 2/2.
- La vérification CI attendue est `quality` (Windows 2022, Node 24, `npm ci`, `npm run typecheck`, `npm test -- --maxWorkers=2`). Une validation n'est considérée acquise que si le run associé au HEAD de #85 est `completed/success`. Les logs et le SHA doivent être reportés avant la fusion.
- Contrats : aucune modification volontaire des CGV, modèles juridiques ni migrations ; les éditeurs contractuels protègent les brouillons et contrôlent les mises à jour périmées.

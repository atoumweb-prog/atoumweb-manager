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
# Lot 09A — Raccordement UI de l'historique des justificatifs
Date : 14 octobre 2026

## Code ajouté
- `src/shared/expenses.ts` : type `ExpenseReceiptVersion` et méthode typée `ExpensesApi.listReceiptVersions`.
- `src/main/ipc.ts` : canal en lecture seule `expenses:list-receipt-versions`.
- `src/preload/preload.ts` : exposé typé au renderer.
- `src/renderer/expenses/ExpensesPage.tsx` : chargement sur changement de dépense et après import ; historique affiché dans la section justificatif avec les états vérifié / modifié / manquant / non certifié.
- Service préexistant `ExpenseService.listReceiptVersions` réutilisé, aucune nouvelle table ou migration.

## Limites
Pas d'ouverture ou de restauration d'anciennes versions depuis l'UI. Pas de certitude rétroactive pour les fichiers anciens sans SHA-256. Aucune validation visuelle Windows, Electron ou tests Vitest/typecheck encore exécutés. La stabilité des changements de sélection et erreurs IPC doit être testée avant intégration.

## Recette attendue
1. Ouvrir une dépense ancienne sans historique, vérifier absence d'erreur.
2. Importer deux justificatifs en fixture TEMP, observer deux versions sans perdre le fichier ancien.
3. Altérer la première copie hors application, rafraîchir et vérifier l'état `modifié`.
4. Retirer une copie dans la fixture, constater `manquant`, sans suppression des métadonnées.
5. Vérifier navigation entre dépenses, champs de formulaire et absence de perte de brouillon UX-01.
6. Typecheck, Vitest ExpenseService/ClientDocumentService/Billing, suite complète, migrations, restaurations, Electron trois thèmes et trois densités.

Branche de travail indépendante ; aucune fusion dans main ni résultat de test revendiqué.

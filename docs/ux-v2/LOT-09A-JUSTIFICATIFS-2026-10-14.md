# Lot 09A — Contrôle des justificatifs (14 octobre 2026)

## Constat de code
Dans `ExpenseService.absoluteReceiptPath`, la vérification `absolute.startsWith(resolve(workspace.root))` acceptait également des chemins dans un répertoire voisin dont le nom partageait le préfixe du workspace. La vérification exige maintenant `resolve(workspace.root) + sep`, où `sep` respecte Windows et les autres systèmes.

Un test de non-régression a été ajouté à `ExpenseService.test.ts` pour un chemin relatif `../atoumweb-expenses-external/facture.pdf` et vérifie son refus. Ce test est **ajouté mais non exécuté**.

## Point identifié, non corrigé
`ExpenseService.importReceipt` importe un nouveau justificatif sous un nom unique et écrase le pointeur `receipt_relative_path` de la dépense. Le fichier ancien n'est pas explicitement supprimé par cette méthode, mais la relation entre dépense et versions précédentes n'est pas conservée dans la fiche. Une migration ou un journal versionné nécessitera cadrage et tests de restauration.

## A vérifier avant merge
Typecheck Windows, test ExpenseService, tests ClientDocumentService et BillingHandoffService, suite complète, migrations, intégrité et recette Electron. Les modifications sont limitées à la branche du lot 09 ; aucune réussite de test n'est revendiquée.
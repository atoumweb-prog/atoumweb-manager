# Lot 09A — Prévisualisation par copie temporaire (14/10/2026)

## Réalisation sur branche isolée
- Nouvelle méthode `ExpenseService.prepareReceiptVersionPreview` : validation de l'appartenance à l'historique et du SHA-256, création d'un dossier temporaire distinct, copie avec nom UUID et extension d'origine, revérification SHA-256 sur la copie, permissions `0444` sur le fichier.
- Le canal IPC `expenses:open-receipt-version` ouvre désormais cette copie plutôt que le fichier original.
- Nettoyage du dossier temporaire en cas d'échec de préparation.
- Test ajouté pour comparer les octets et vérifier que le chemin de prévisualisation diffère de l'original.

## Réserves et validation
- Les copies temporaires après ouverture réussie ne sont **pas encore nettoyées automatiquement**. Une stratégie de rétention/nettoyage contrôlée est nécessaire, sans supprimer de fichier encore utilisé par une application externe.
- `0444` n'empêche pas nécessairement un logiciel externe de modifier la copie ni ne garantit une lecture seule sur toutes les plateformes. L'original du workspace n'est pas ouvert par ce chemin.
- Il subsiste une fenêtre temporelle entre lecture initiale, copie et lancement du logiciel externe ; la copie est vérifiée avant `shell.openPath`.
- Aucune recette Windows, typecheck, Vitest, migrations ou restauration exécutée depuis cette session. **Ne pas fusionner** avant exécution des tests et correction des régressions.
- Pas de migration, pas de modification de `main`.

## Gate suivante
Tests Windows ciblés ExpenseService, ClientDocumentService et Billing, suite complète, contrôle Electron, cycle de vie/nettoyage des copies et régression UX-01.

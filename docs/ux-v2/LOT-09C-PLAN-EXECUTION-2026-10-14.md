# Lot 09C — Plan d'exécution

Base : branche 09A (PR #113), indépendante du 09B (PR #119). Aucun merge dans main.

Référentiel : LOT-09C-DEPENSES-ECHEANCES.md au commit historique 0bb0860.

Audit initial : ExpenseService possède déjà les validations montants/TVA, fréquence, échéances et statuts. Le 09A a déjà ajouté historique des reçus, SHA-256 et prévisualisations contrôlées : préserver ces acquis.

Écart principal : ExpensesPage ne mobilise pas encore la protection UX-01 pour conserver les champs sales à la fermeture, au changement de dépense ou à la navigation. Autre point : distinguer un paiement déclaré par l'utilisateur d'un paiement réellement vérifié en banque.

Étapes : (1) protéger les brouillons ; (2) sécuriser les libellés et corrections des statuts ; (3) tester reçus, versions, annulation et intégrité ; (4) recette R09C-01 à R09C-17 en SQLite TEMP, UI Electron et neuf modes visuels ; (5) CI Windows, revue, PR draft. Ne jamais inventer des occurrences récurrentes, une API bancaire, des calculs fiscaux ou des règles légales de conservation.

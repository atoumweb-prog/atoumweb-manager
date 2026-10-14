# Lot 09C — Plan d'exécution

Base : branche 09A (PR #113), indépendante du 09B (PR #119). Aucun merge dans main.

Référentiel : LOT-09C-DEPENSES-ECHEANCES.md au commit historique 0bb0860.

Audit initial : ExpenseService possède déjà les validations montants/TVA, fréquence, échéances et statuts. Le 09A a déjà ajouté historique des reçus, SHA-256 et prévisualisations contrôlées : préserver ces acquis.

Écart principal : ExpensesPage ne mobilise pas encore la protection UX-01 pour conserver les champs sales à la fermeture, au changement de dépense ou à la navigation. Autre point : distinguer un paiement déclaré par l'utilisateur d'un paiement réellement vérifié en banque.

Étapes : (1) protéger les brouillons ; (2) sécuriser les libellés et corrections des statuts ; (3) tester reçus, versions, annulation et intégrité ; (4) recette R09C-01 à R09C-17 en SQLite TEMP, UI Electron et neuf modes visuels ; (5) CI Windows, revue, PR draft. Ne jamais inventer des occurrences récurrentes, une API bancaire, des calculs fiscaux ou des règles légales de conservation.


## Avancement effectif (14/10/2026)
- PR #129 draft (base 09A #113, sœur de #119), pas de merge dans `main`.
- 09C en développement : formulaire protégé avec `useUnsavedDraft` (fermeture, création, sélection, rafraîchissement, import reçu et paiement déclaré).
- `ExpenseService.importReceipt` protège copie et journal de version par SAVEPOINT SQLite ; annulation de toute modification et nettoyage de la nouvelle copie sur échec.
- Transitions de statut et corrections de dépenses atomiques avec journal précédent/nouveau, sans qualification bancaire ; confirmation explicite avant correction d'une dépense déjà déclarée payée.
- Échéance passée signalée si dépense non payée/non annulée ; aucune occurrence automatique ni paiement bancaire simulé.
- Tests régressions : reçu remplacé et conservé, rollback justificatif, statut payé déclaratif, correction payée, montant/TVA, dépense interne mensuelle, fichier de preuve disparu.
- Fixture Electron réelle `--lot09c` (vrai React + preload + IPC + SQLite et PDFs isolés TEMP) : import/annulation, versions, garde UX-01, date dépassée, confirmation correction payée, neuf combinaisons thème/densité ; workflow Windows dédié lancé.
- Dernière CI **terminée** au démarrage : #38598952756 verte sur `f44b34d` (TypeScript, Vitest, Electron 09C, UX globale et restauration). Les derniers changements demandent **une nouvelle CI verte** avant validation technique complète.

## Matrice de couverture restante R09C
| Cas | État des vérifications / réserves |
|---|---|
| R09C-01 | Test création interne sans client ajouté |
| R09C-02 / 03 | Cohérence Projet/Client déjà contrôlée dans `ExpenseService.normalize` ; ajouter explicitement une recette projet valide/étranger |
| R09C-04 / 05 | Montant négatif et TVA supérieure au montant : tests dédiés ajoutés |
| R09C-06 / 07 | Statut planned→committed→paid, journal atomique, paiement déclaratif et absence de double événement |
| R09C-08 | Fréquence mensuelle stockée, liste inchangée après transition : test ajouté |
| R09C-09 | Alerte visuelle d'échéance dépassée ; aucun moteur de génération |
| R09C-10 / 11 / 12 | Import/annulation/remplacement réel Electron, conservation et versions de justificatif |
| R09C-13 | Test fichier supprimé : état `missing`, refus d'ouverture de la pièce disparue |
| R09C-14 | Confirmation humaine avant correction payée, journal avant/après, refus/acceptation testés dans Electron |
| R09C-15 | Contrôle Client/Projet existant ; recette ciblée de changement client à compléter |
| R09C-16 | Brouillon et refus de quitter testés sur vraie interface et boîte de confirmation native |
| R09C-17 | Fixtures Windows TEMP, trois thèmes × trois densités, restauration et SQLite ; CI finale à confirmer |

La validation humaine et les vérifications de merge `main` restent séparées ; 09C n'est pas encore déclaré techniquement validé.

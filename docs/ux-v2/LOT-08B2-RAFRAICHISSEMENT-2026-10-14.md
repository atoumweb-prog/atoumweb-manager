# Lot 08B.2 — Résultat métier distinct du rafraîchissement

Date : 14/10/2026. Branche : `feature/ux-v2-lot08a-audit-v1`. Code : `a22a7064eb12b24c5af396cadcf8b08f2d224a63`.

## Modification
- `OperationsPage.refresh` renvoie maintenant un booléen : true si les quatre listes ont été lues et projetées, false en cas d'échec (message d'erreur existant préservé).
- `changeInterventionStatus` attend d'abord le **retour effectif du service de clôture**. Dès réception, l'intervention sélectionnée et son entrée déjà affichée dans la liste sont synchronisées avec cet objet.
- Le résultat du rafraîchissement n'altère plus le booléen de succès métier retourné au panneau de conclusion.
- Pour la clôture, si la lecture des listes échoue, un avertissement indique que la **clôture a été confirmée par le service** mais que la liste n'est pas à jour ; l'utilisateur doit vérifier avant toute nouvelle action.

## État et limites
Ceci n'est pas un acquittement côté serveur réinterrogé après perte de connexion : si l'appel `complete` lui-même échoue ou que sa réponse est perdue après commit, le cas « résultat inconnu » reste à traiter. Le service métier est idempotent, mais l'UI ne peut déduire un succès d'une erreur réseau/IPC. Les rafraîchissements concurrents (réponse ancienne après réponse récente) et les conflits d'édition UX-01 nécessitent encore une recette spécifique. La conclusion de l'incident est toujours sauvegardée séparément de la clôture : ce correctif ne crée pas de transaction UI couvrant les deux opérations.

## Scénarios à exécuter
- Clôture réussie + listes rechargées : une confirmation, statut terminé.
- Clôture réussie + échec lecture d'une des listes : confirmation métier conservée, avertissement, aucun second `complete` automatique.
- Rejet de `complete` : panneau de conclusion ouvert, aucune annonce de clôture réussie.
- Échec après réponse perdue : statut considéré inconnu jusqu'à relecture fiable par ID.
- Double clic, état pending, garde UX-01, focus et brouillon conservés.
- Typecheck, Vitest, bancs Electron 3 thèmes × 3 densités ; SQLite TEMP, aucun accès Validation-MSI.

**Aucun test exécuté ni CI verte revendiquée pour ce commit** ; `main` inchangé.

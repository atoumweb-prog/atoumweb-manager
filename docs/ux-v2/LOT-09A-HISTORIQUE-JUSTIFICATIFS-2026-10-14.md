# Lot 09A — Historique non destructif des justificatifs

Date : 14 octobre 2026. Branche : `audit/ux-v2-lot09-20261014`.

## Réalisation
L'import `ExpenseService.importReceipt` conserve désormais dans `activity_log.metadata_json` un enregistrement `expense_receipt_version` portant les chemins relatifs et les noms du justificatif précédent et du nouveau justificatif. Le fichier précédent reste présent sur disque, comme auparavant. L'enregistrement utilise la table d'audit existante : **aucune nouvelle migration** ni modification des autres lots.

Un test de caractérisation a été ajouté : deux imports successifs pour une dépense de recette, contrôle du fichier d'origine et des deux entrées de l'historique.

## Limites et points bloquants avant promotion
- Ce journal fournit une **trace technique**, pas encore une interface utilisateur de restauration ou une gestion complète de versions.
- L'écriture du fichier, la mise à jour de la dépense et l'écriture du journal ne sont pas atomiques entre disque et base. Ajouter gestion des échecs et recette dédiée avant de revendiquer une garantie transactionnelle.
- Il reste à définir comment exposer les versions en lecture seule, valider les empreintes SHA-256 et traiter les justificatifs historiquement attachés.
- **Aucun test exécuté dans cette session** ; typecheck, Vitest, migrations, sauvegarde/restauration et contrôle Electron restent indispensables.
- Le registre des migrations peut diverger avec les lots en parallèle ; aucun nouvel identifiant de migration n'a été réservé.
- Ne pas fusionner `main` ni déclarer le lot 09 terminé.

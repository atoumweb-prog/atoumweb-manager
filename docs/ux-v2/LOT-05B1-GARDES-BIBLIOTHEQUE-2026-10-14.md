# Lot UX/UI V2 05B.1 — Gardes des éditeurs de la bibliothèque

**Date** : 14/10/2026. **Base de travail** : PR #106 issue de `main@b2796812`.  
**Référentiel** : PR #82, `LOT-05B-BIBLIOTHEQUE-EDITOR.md`, `LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md`, protection UX-01 existante.

## Premier incrément de code — non encore certifié en Electron

- `ContractLibraryPage` rattache trois éditeurs (type, texte de clause, nouveau module) à la garde `useUnsavedDraft` existante, dans un groupe **local à l'instance**.
- Retour aux Documents, changement de type/version ou changement de module/version : **un seul appel** au registre UX-01, abandon possible seulement après confirmation ; un enregistrement en cours reste bloquant.
- La fermeture du formulaire « Nouveau module » appelle sa garde spécifique ; les autres brouillons ne sont pas abandonnés.
- Les effets qui repopulent les champs sont limités aux changements d'identité/version, et non à chaque rafraîchissement des listes. Après création du module, les champs temporaires sont vidés.
- Le comparateur des saisies de type et de nouveau module est isolé en fonction pure et couvert par tests unitaires.

**Ne change pas** : services, SQL, migrations, API/IPC, partage de clauses, tarifs, public contractuel, avis juridique, critères de publication, instantanés historiques, documents Abby ou écrans du Catalogue/Client.

## Limites et gates

Ce correctif est une première passe ; avant toute fusion, **exécuter réellement** :
- `npm run typecheck` et `npm test` sur le commit exact (preuves CI, pas estimation) ;
- recette Electron native de la bibliothèque (création de type et de clause, changement de sélection et de version, formulaire partiellement saisi, Rester/Quitter, pending, rejet, succès) ;
- navigation au clavier, `Escape`, souris, 3 thèmes × 3 densités, largeur réduite ;
- non-régression du Builder, des références Catalogue, des clauses partagées et du Devis accepté ; tests SQLite en données TEMP seulement ;
- vérifier les cas d'annulation avec **plusieurs brouillons actifs** simultanément.

L'audit 05A ne constitue pas à lui seul une validation dynamique. Aucun « PASS Electron » ne sera annoncé sans exécution.

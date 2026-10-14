# Lot 09D — Documents, archives, preuves et navigation

Branche indépendante `feature/ux-v2-lot09d-documents-20261014` basée sur la 09A/PR #113. Aucun merge dans main. Référentiel `LOT-09D-DOCUMENTS-ARCHIVES-PREUVES.md` depuis `0bb0860`.

## État confirmé
- `DocumentsPage`, `ClientDocumentsPanel` et `ClientDocumentService` existent ; la bibliothèque contractuelle est déjà ouverte via la vraie `ContractLibraryPage`, pas une copie.
- 09A protège la suppression des PDF Abby actuellement rattachés et les preuves Devis, intègre SHA-256 ; 09B/#119 protège de plus les factures Abby remplacées via leur historique. **La convergence des protections 09B devra être testée lors de l'intégration**, car cette branche 09D ne dépend pas de #119.
- `DocumentsPage` possède formulaires import et métadonnées, recherche, archives, mais aucune protection `useUnsavedDraft` observée.
- Aucune bibliothèque générique transversale hors Client n'existe de façon prouvée. Ne pas présenter « Autres documents » comme système de stockage déjà opérationnel.

## Travail à réaliser
1. Protéger avec UX-01 les saisies de création et les métadonnées éditées lors du changement de document, fermeture, rafraîchissement, passage à la bibliothèque et navigation.
2. Revoir clairement les quatre portes : Bibliothèque contractuelle réelle, éditeur de brouillons contractuels réel, documents clients réels, documents généraux **non encore disponibles** sans API et espace dédiés.
3. Vérifier fichiers manquants, intégrité SHA-256, preuves sans empreinte, archives/restauration et refus définitif des pièces protégées au **service**, même si les boutons sont disponibles.
4. Recette R09D-01 à R09D-18 via TypeScript, Vitest, SQLite/FK TEMP, parcours Electron réel et neuf combinaisons visuelles.
5. Conserver PR draft indépendante et reporter intégration 09A + 09B + 09D, validation humaine et main sans fusion anticipée.

Ne pas inventer des obligations légales de rétention, un classement générique hors Client, des copies de contrats publiés ou un connecteur Abby.
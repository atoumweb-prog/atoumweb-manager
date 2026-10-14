# UX/UI V2 — 05B.3 : chargements indépendants et sorties vers Catalogue

PR #106, branche indépendante `feature/ux-v2-05a-audit-contractuel-20261014`. Incrément de code, **non certifié** tant que la CI sur le HEAD final et les recettes Electron ciblées ne sont pas réussies.

## Changements ciblés

- `ContractLibraryPage.refresh()` utilise `Promise.allSettled` : chaque résultat valide met à jour uniquement sa rubrique (types, clauses, prestations Catalogue), sans écraser les données d'une autre rubrique en cas d'échec.
- La défaillance est explicite dans une erreur « Chargement incomplet », sans faire croire à une liste vide. Une réussite ne masque pas un échec d'une autre rubrique.
- Les deux chemins d'ouverture d'une prestation Catalogue (depuis un type ou depuis la liste des prestations associées à une clause) utilisent `guardedNavigation` et UX-01 avant l'événement existant `atoumweb:open-catalog-item`.
- Aucun changement de contrat, CGV, IPC, preload, schéma, migration, lien Catalogue ou preuve Abby.

## Contrôles encore requis

1. Typecheck et tests Vitest sur le dernier SHA, sans réinterpréter les CI antérieures.
2. Recette Electron en base TEMP : perte simulée de chacune des trois sources, maintien des listes chargées, erreurs visibles et reprise.
3. UX-01 avec brouillon de type, de texte de module et de nouveau module : ouvrir une prestation, choisir **Rester** puis **Quitter**, et confirmer qu'aucune navigation n'est envoyée si Rester.
4. Vérifier la gestion des rafraîchissements concurrents, trois thèmes × trois densités, focus et clavier avant clôture fonctionnelle.

**Fusion interdite sans validation explicite de l'utilisateur.** La présente étape ne constitue pas une validation juridique.

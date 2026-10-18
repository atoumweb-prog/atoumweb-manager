# EC04 — incrément 01 : inventaire sûr des fichiers du workspace

Statut : **développement isolé, non intégré, pas une sauvegarde opérationnelle.**

Branche `feature/ec04-workspace-file-inventory-v1`, issue du merge UX V2 `376eef943e741e2967465b0016c05fc1977a97ea`.

Le scanner `inventoryWorkspaceFiles` inspecte uniquement huit racines possédées : identités CRM, clients, projets internes/prévisionnels, dépenses, bibliothèque AtoumWeb, Bridge, exports. Il calcule la taille et l’empreinte SHA-256 de chaque fichier par lecture séquentielle, détecte les modifications observables pendant lecture et refuse les liens/jonctions, les fichiers non ordinaires, les chemins dangereux et les collisions de noms Windows. Il n’explore **ni** la base SQLite active, **ni** `backups`, ni les caches Electron.

### Limites explicites
- Aucun instantané SQLite ni archive ZIP, aucune restauration, aucun accès au workspace utilisateur.
- La cohérence DB↔fichiers, les fichiers externes/customisés, les chemins absolus et la portabilité des secrets Windows restent à traiter.
- Ne pas utiliser la sortie comme certificat de sauvegarde complète ; `referencesVerified` vaut `false` par conception.
- La barrière d’écriture interfenêtres et les tests Windows/Electron/Vitest complets restent à développer avant tout déploiement.

### Validation
Contrôle TypeScript isolé réussi (Node 22 / TypeScript 5.8 disponible ici), six groupes d’assertions Node exécutés sur répertoires temporaires. Les cinq tests Vitest fournis avec l’incrément n’ont **pas** été exécutés par la CI du projet ni sur Windows ; il faudra les exécuter ultérieurement avec le reste de la suite.

### Prochaine étape
Concevoir la capture cohérente SQLite + fichiers (barrière de mutation, staging) et le manifeste versionné, puis la vérification/restauration sur workspace neuf. Aucune migration SQL n’est ajoutée.

# Lot 09A — Ouverture contrôlée des versions antérieures
Date : 14 octobre 2026.

## Implémentation
- `ExpenseService.verifiedReceiptVersionPath` vérifie l'appartenance à l'historique de la dépense, puis refuse les versions manquantes, modifiées ou sans empreinte certifiable.
- Raccordement du contrat partagé, preload et canal IPC `expenses:open-receipt-version`.
- Bouton « Ouvrir la version » affiché seulement pour les versions d'intégrité `verified`.
- Test de service étendu pour la version intègre, puis pour le refus après altération.
- Aucune migration créée ni modification de `main`.

## Limites de sécurité importantes
- `shell.openPath` ouvre le fichier dans son application associée : **l'application externe peut autoriser sa modification**. Ce n'est pas une ouverture matériellement « en lecture seule ». Ne pas présenter cette fonctionnalité comme un verrouillage d'écriture.
- Entre la vérification du SHA-256 et l'ouverture externe, un changement du fichier reste théoriquement possible (TOCTOU). La protection forte exigera une copie temporaire contrôlée, une isolation ou un visualiseur dédié, avec nettoyage et tests.
- Les anciennes versions sans empreinte sont refusées. Pas de restauration ni suppression de versions depuis l'UI.
- Les données `activity_log` n'ont pas encore de modèle dédié versionné ; le stockage disque, les mises à jour SQL et la journalisation ne sont pas atomiques.
- Les tests, le typecheck, la recette Electron et les restaurations **n'ont pas été exécutés** dans cette session : passage en PR prête à fusionner interdit avant ces contrôles.

## Gate suivante
Valider TypeScript et tests ciblés ; tester la navigation sur plusieurs dépenses, le refus de fichier corrompu et les rafraîchissements UI. Étudier copie temporaire pour lecture sans altérer l'original.

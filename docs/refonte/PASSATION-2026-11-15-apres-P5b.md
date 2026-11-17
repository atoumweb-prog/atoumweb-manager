# Passation de la refonte du Manager (15/11/2026, après P5b)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P5a.md`, dont les pièges et ceux des passations antérieures restent valables.

## 1. Où on en est

- Dépôt `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166`, branche `claude/refonte-manager`, **rien de poussé**. Derniers commits : P5b (voir `git log`), P5a `87b84996`, P6b `71726ffa`.
- Passe de finitions : tout est fait sauf **P5c** (fiches et reste jusqu’à zéro, F70) et **P5d** (F27 chiffres clés, fiche courte propre). Budget des petits textes : **473**. `!important` : 86.
- Retours de Carlos en test direct (15/11/2026) : F69 (vue « Parcours commercial » de Prospection à repenser, lot à part avec fiche), F70 (fiche Maintenance, dans P5c), F71 (moteur des devis et mentions légales à tester après la refonte, avec l’acompte par défaut).

## 2. Prochaine action concrète

1. **P5c** : mesurer d’abord les fiches (projet, client, prospect, intervention, Bibliothèque, Maintenance, Accueil, aperçu du devis) avec une sonde comme `p5b-sonde.txt` ; puis relever les 473 déclarations restantes (fichiers entiers avec `css-raise-all.cjs`) jusqu’à **zéro** ; le test de budget devient « zéro » (`fontFloorBaseline.json` vide). Plan à écrire puis exécuter sans résumé (accord de Carlos).
2. P5d (F27), puis la fiche de F69 si Carlos la veut avant la fin de refonte.

## 3. Ce qu’on a appris pendant P5b

- **Test direct par Carlos** : `npx electron-forge start -- --user-data-dir=<profil>` avec un profil qui contient `workspace.json` (`{"workspaceRoot":"C:/…/workspace"}`, barres obliques : des antislashs non doublés rendent le JSON invalide) pointant vers une **copie** de `Workspace` dans `%TEMP%` (sans `backups`) ; empreinte de la base de la préproduction notée avant et vérifiée après ; supprimer la copie quand la fenêtre est fermée.
- **Sonde des règles** (`p5b-sonde.txt`) : pour chaque petit texte, les règles dont le `font-size` en px vaut exactement la taille calculée, sur l’élément ou un parent : cela donne directement le sélecteur à relever.
- **`css-raise-all.cjs`** (hors dépôt) relève toutes les règles d’un fichier ; réservé aux fichiers qui appartiennent aux écrans du lot.

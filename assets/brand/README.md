# Identité Atoum Manager — symbole approuvé le 15/10/2026

L’utilisateur a approuvé le symbole et la direction du pilote avant la généralisation. Le dossier `candidate/` garde son nom historique pour préserver les références. Le symbole vectoriel est une interprétation approuvée des images fournies ; les deux wordmarks restent des approximations système, sans prétendre restituer une police originale.

Les trois originaux de `references/` sont conservés sans modification ; provenance et SHA-256 dans `references/provenance.json`. Source unique : `src/shared/brandArtwork.ts`, génération : `node scripts/prepare-brand-preview.cjs`. SVG/PNG transparents, symbole16/24/32/48/64/128/256 et ICO sept résolutions.

`BrandMark` utilise le symbole approuvé dans le rail. `forge.config.ts` utilise le même ICO pour l’EXE et `MakerSquirrel.setupIcon`, et l’embarque comme ressource. `windowBrandIcon` résout cette ressource dans le package et le fichier du dépôt en développement, pour les fenêtres principale, Référence et recette. Nom d’exécutable et identifiants conservés.

La configuration ne vaut pas installation Windows validée. Les contrôles de packaging sont distincts de la certification des raccourcis, du cache Windows et d’une installation Squirrel/MSI. Aucun raccourci, profil utilisateur, workspace ou exécutable déjà livré n’est remplacé par la génération locale.

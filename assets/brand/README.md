# Identité Atoum Manager — proposition pour validation visuelle

Les trois images dans `references/` sont les fichiers fournis le 15/10/2026,
copiés sans modification. Leur provenance et leur SHA-256 figurent dans
`references/provenance.json`. Aucune présentation de marque supplémentaire,
aucun SVG original ni police de logo n'existait dans le dépôt inspecté.

`candidate/` contient une **interprétation vectorielle proposée**, pas une
vectorisation certifiée ni un logo définitivement approuvé. Le symbole reprend
la structure triangulaire de l'icône jaune ; la typographie des deux wordmarks
est une approximation système, à vérifier face aux originaux. Les originaux
présentent des bords irréguliers : ils ne sont pas automatiquement présentés
comme des masters prêts pour toutes les tailles.

- `primary-dark.svg/png` : proposition principale jaune/blanc sur fond sombre.
- `symbol.svg`, `symbol.png` et 16/24/32/48/64/128/256 px.
- `horizontal-light.svg/png`, `horizontal-dark.svg/png`, transparents.
- `atoum-manager.ico` : sept résolutions avec canaux alpha PNG.
- Source unique des propositions : `src/shared/brandArtwork.ts`.
- Génération des formats : `node scripts/prepare-brand-preview.cjs`.

Le symbole est visible **uniquement dans la branche pilote** via `BrandMark` ;
les trois thèmes gardent un carré jaune lisible. Le nom commercial n'est pas
renommé dans les services, contrats ou données.

## Fenêtre, exécutable et installateur : activation après approbation

Configuration actuelle inspectée : `src/main/main.ts` n'a pas d'icône explicite
pour la fenêtre principale et Référence ; `forge.config.ts` n'a pas de
`packagerConfig.icon` ni de `MakerSquirrel.setupIcon`.

Après validation du master, utiliser le même ICO pour le `packagerConfig.icon`
(base `assets/brand/candidate/atoum-manager`), le `setupIcon` Squirrel (chemin
absolu vers l'ICO) et une ressource embarquée pour `BrowserWindow.icon`. Vérifier
également les fenêtres de référence et de recette, le taskbar/AppUserModelID,
les raccourcis et le cache d'icônes Windows sur une installation isolée.

Ces ressources sont **préparées**, pas encore activées dans le packaging de
production. Aucun installateur, raccourci, exécutable livré ou profil utilisateur
n'a été remplacé. Une compilation ne certifiera pas à elle seule une installation
Squirrel ou MSI. Pas d'activation silencieuse d'une reconstruction non approuvée.

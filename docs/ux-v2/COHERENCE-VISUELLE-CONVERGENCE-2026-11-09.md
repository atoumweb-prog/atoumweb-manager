# Corrections de cohérence visuelle — 9 novembre 2026

Demande utilisateur : champs paraissant vides, tableau/colonnes illisibles et styles différents entre modules. Intervention sur le seul worktree `codex/convergence-ux-v2-20261108`, sans commit/push.

## Causes et corrections

- **Styles et logo variables selon la page** : Accueil et Clients redéfinissaient des couleurs du shell selon la route ; le rail utilisait trois variantes de logo. Le cadre Noir/Confort reprend désormais une palette bleu nuit/jaune commune, le même logo sans plaque blanche et une taille de titre commune. Les cartes conservent leur rôle métier et leurs couleurs sémantiques. Les autres thèmes ne reçoivent pas cette généralisation graphique.
- **Colonnes trop comprimées** : le tableau cherchait à faire tenir dix colonnes dans la largeur restante. Des largeurs de présentation par défaut lisibles sont désormais fournies au Catalogue. Les largeurs explicitement enregistrées par l'utilisateur ont priorité ; aucune préférence n'est effacée. Tri, ordre/visibilité des colonnes, vues personnelles et pagination utilisent les mêmes mécanismes existants. À largeur insuffisante, le tableau défile horizontalement au lieu de couper « AtoumWeb » ou « Abonnement » en morceaux. La colonne Ouvrir suit sa piste normale pour éviter les superpositions pendant ce défilement.
- **Une seule ligne visible** : l'ajustement à la hauteur d'écran réservait trop peu de place au tableau après le bandeau, les compteurs et les filtres. La liste suit désormais le défilement vertical de la page, avec sa pagination après les résultats ; aucune petite fenêtre verticale imbriquée ne masque les lignes. La capture filtrée Mariage montre les six résultats et la pagination.
- **Champs absents** : la fiche Landing page consultait la version publiée historique v1, qui ne contient pas les métadonnées importées. Un avertissement explique maintenant cette situation et le bouton **Consulter le brouillon** ouvre explicitement v2 sans publication ni modification. Les champs de la version publiée ne sont pas complétés avec ceux d'une autre version. Les valeurs réellement absentes du référentiel, notamment certains prix conseillés/délais/acomptes par défaut, restent absentes ; aucun tarif, texte ou événement n'est inventé.
- **Provenance** : la source d'attribution de la carte d'identité est présentée sur toute la largeur sous son libellé ; la source de version conserve sa ligne étendue. Les chaînes longues peuvent revenir à la ligne, sans écraser le libellé.

## Vérifications réelles

- Typecheck et diff-check réussis.
- **23 tests ciblés** des préférences de tableau, du tri et des largeurs adaptatives réussis. Les autres tests validés de la convergence sont conservés, sans campagne générale.
- **47 contrôles Electron** sur copie TEMP au schéma 81 : palette/logo communs vérifiés sur les 17 modules, hauteur utile du tableau, en-tête, tri, priorité des redimensionnements utilisateur, affichage de la version historique, consultation explicite du brouillon réel, et comparaison exacte avant/après des articles, versions, clauses et devis. Aucune erreur backend/renderer.
- **23 contrôles sur le vrai paquet Windows** : isolation, navigation, palette/logo communs sur six modules, 130 brouillons, bibliothèque, Source lisible et absence d'erreur.
- Cinq captures finales 1920×1080, zoom 100 % : Accueil, Prospection, Clients, tableau Catalogue et fiche Landing page sur son brouillon. Les captures proviennent du banc React/preload/IPC compilé depuis ce code ; le paquet distribué est contrôlé séparément avec son bandeau RECETTE / TEST.

La vérification des 17 modules porte sur le cadre et les variables communes, pas sur une refonte exhaustive de chacun de leurs formulaires. Aucun lot 3 ni changement des décisions OT.

## Livraison isolée

Nouveau dossier : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-CONVERGENCE-UX-V2-COHERENCE-20261109`.

Ouvrir **`OUVRIR-CONVERGENCE-TEMP.cmd`** dans ce dossier pour examiner les corrections. L'exemplaire déjà ouvert du 08/11 continue d'afficher l'ancien code : il n'a pas été arrêté ou remplacé.

La nouvelle livraison utilise un nouveau profil de recette et une nouvelle copie SQLite cohérente du workspace TEMP précédent, avec redirection de ses trois chemins de ressources vers les fichiers copiés. Les préférences de l'ancien profil restent dans cet ancien profil, intactes ; ce n'est pas une migration de son profil Chromium vivant.

La copie conserve les 130 versions et les 119 clauses en brouillon, les 18 V39 sans canonique inventé, les 47 délégations, les 23 anciens articles et les historiques ; aucune association activée, migration/import habituels ou publication commerciale.

Construction : deux tentatives Forge ont rencontré un HTTP 504 pendant le téléchargement d'Electron, après compilation Vite réussie. Le paquet final est construit par Forge avec une archive locale de la distribution Electron 44.3.0 déjà installée et utilisée par les tests. Option de build explicite `ATOUMWEB_ELECTRON_ZIP_DIR` ajoutée au fichier Forge ; son absence conserve le chemin de build normal. Aucun téléchargement ou changement de version nécessaire pour le paquet livré.

Preuves et captures : `outputs/Coherence-Visuelle-20261109/`, notamment `CONTROLES-VALIDES.json`, `PACKAGE-VALIDE.json`, `LIVRAISON.json`. Dossier de revue ZIP avec index HTML, rapport et empreintes. L'installation habituelle et la publication restent soumises aux autorisations distinctes déjà définies dans le rapport de convergence.

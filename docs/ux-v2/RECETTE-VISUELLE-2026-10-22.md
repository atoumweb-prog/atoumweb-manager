# Recette visuelle — Accueil, en-tête et navigation — 22 octobre 2026

## Décision et limites

Demande utilisateur : reprendre page par page ; commencer par Accueil/en-tête/rail commun, supprimer doublons et annotations inutiles, rendre les blocs repliables et adapter la présentation aux tailles de fenêtre/échelles/zooms de PC. [Image fournie](references/2026-10-22/accueil-direction-utilisateur.png) conservée comme **direction graphique** ; chiffres, nouvelles appellations du pipeline et modules dessinés n'autorisent aucune règle métier/route supplémentaire.

Branche `codex/ux-v2-shell-home-simplification`, départ main `921f0066fb780634b51cd49dd32f84f11cd2c45e`. La version de recette portable précédemment livrée reste inchangée. Ce lot est un candidat local à revoir visuellement ; aucune fusion/CI hébergée/publication/installation autorisée par ce travail. EC04 reste expérimental et non exposé.

## Registre du premier incrément

| Point | Écart constaté dans le code | Correction candidate | Réserve |
|---|---|---|---|
| VIS01 Identité | Symbole et nom/version dans le rail + logo complet dans l'en-tête | Logo original complet dans le rail déployé, symbole réduit ; une seule marque complète | Validation visuelle utilisateur attendue |
| VIS02 Commandes | Deux commandes de réduction du rail | Une commande dans le rail ; mode compact de l'en-tête distinct et conservé | Raccourcis et focus conservés |
| VIS03 Navigation | Favoris vides et explication permanents, étoiles sur chaque ligne | Aucune rubrique vide ; épinglage au survol/focus ou sur écran tactile | Favoris existants et réorganisation conservés |
| VIS04 Groupes | Cinq groupes toujours déployés | Groupes repliables, choix mémorisés par workspace | Les17 destinations restent disponibles, y compris via rail réduit |
| VIS05 Accueil | Pas de repli individuel depuis chaque bloc | Six blocs avec commande explicite de repli/dépli ; composants conservés montés | Aujourd'hui reste accessible et les alertes critiques ne sont jamais masquées |
| VIS06 Textes | Sous-titre générique, détails de source et répétitions de compteurs | Sous-titre retiré, sources dans Personnaliser, compteurs pipeline uniques ; aides/KPI dans leurs intitulés | Erreurs, actualisation incertaine et historique des conversions conservés |
| VIS07 Adaptation | Critère utilisateur « écran27p » sans résolution/échelle précisées | Recherche intégrée quand l'espace le permet ; commande compacte sinon ; rail et grilles adaptatifs | Tests de fenêtres/zoom ne certifient pas tous les moniteurs physiques |

## Architecture conservée

Aucun service/IPC/moteur métier/contrat/prix/migration modifié. Les17 routes et le pipeline6+1 restent leurs références existantes. GlobalTimer conserve son instance et tous ses dialogues, confirmations UX-01 et gardes de navigation existants. Fiche Prospect A et Client B non modifiées.

Les champs optionnels `collapsed` (Accueil) et `collapsedGroups` (rail) utilisent les clés de préférences visuelles existantes. Normalisation en liste blanche, compatibilité des anciennes valeurs et exclusion de toute identité/note/brouillon. Réduire le rail ne réinitialise pas les groupes. Masquer/replier un bloc ne le démonte pas ; les commandes pour le retrouver restent disponibles. La source « Aujourd'hui » ne peut pas être masquée via hidden ; son contenu peut être replié depuis son en-tête visible. Les alertes critiques restent indépendantes de cette présentation.

## Validation et preuves

Tests de développement :22 tests ciblés de normalisation verts ; ancienne recette Accueil65 contrôles verts (y compris erreurs injectées, données périmées, contraste critique, préférences et brouillon Client). Premier banc combiné a révélé une précondition manquante du banc : la recette shell finit dans Bibliothèque alors que la recette Accueil attend Accueil. Transition explicite ajoutée, aucun délai/assertion modifié. Banc combiné de développement676 contrôles verts et270 états mesurés.

Le protocole permanent `node scripts/check-shell-home-simplification.cjs` réutilise le vrai App/preload/IPC/SQLite sur TEMP : ancienne recette shell (chrono réel/dialogues/UX-01/focus), recette Accueil, six replis, groupes du rail, Escape natif, absence de mutation métier, puis3 thèmes×3 densités×5 tailles×3 zooms×2 modes de rail =270 états. Tailles demandées760×720,1280×720,1920×1080,2560×1440,3440×1440 ; zoom100/125/150. Le rapport distingue taille demandée Electron et viewport CSS réellement obtenu : échelle native Windows et cadre de fenêtre influencent l'image. Aucune modification des réglages d'écran du poste.

Captures synchronisées par sentinelle compositée :9 thèmes/densités en1920,2 états rail à1280/150%,2560/125%,3440/125%. Galerie autonome et report.json dans `outputs/shell-home-review-*/`. Ces dossiers ignorés ne sont pas des preuves GitHub. La galerie définitive doit annoncer le SHA commité propre. Les données sont synthétiques, pas celles de la recette utilisateur.

Après commit : typecheck, suite complète Vitest une fois et banc combiné au même HEAD. Résultats réels, SHA et chemin de galerie dans le bilan de livraison local. Aucune recette humaine n'est déclarée validée par les tests.

## Suite proposée

Avis visuel sur ce premier incrément, puis corrections ciblées. Reprise des autres pages uniquement avec les comparatifs avant/après fournis et les arbitrages nécessaires. Aucune généralisation automatique aux fiches CRM. Une prochaine livraison de recette devra être construite séparément après validation ; le ZIP déjà remis ne se met pas à jour automatiquement.

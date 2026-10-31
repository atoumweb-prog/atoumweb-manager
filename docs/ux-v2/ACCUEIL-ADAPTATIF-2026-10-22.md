# Accueil et commandes réelles — correction après recette portable

## Demande

Le portable139d7e71 conservait à tort les commandes compactage/burger. L’utilisateur demande cloche/engrenage, indicateurs encadrés et repli à droite, deux listes du haut défilantes et meilleure utilisation de la surface disponible. Même branche pilote, aucun changement métier, migration ou donnée réelle. Pas de campagne exhaustive : Noir/Confort/100%,1920×1080 et un redimensionnement ciblé1280×720.

## Corrections

- Dans le vrai Manager seulement : plus de compactage ni burger. Une ancienne préférence compact=true ne force plus ce mode. Atelier historique isolé conservé avec ses commandes propres.
- Cloche : lecture de l’API existante operationsAlerts, compteur réel (sans notion inventée de non-lu), liste des alertes, erreur explicite/Réessayer, retour de focus par Escape natif, fermeture extérieure. Générations de lecture contre retours tardifs, rafraîchissement à l’événement existant. Aucune écriture métier.
- Engrenage : route Réglages existante, via la garde App/UX01. Les deux nouvelles commandes sont désactivées quand un dialogue du véritable chrono possède la couche. Recherche et instance de chrono conservées. Le réglage du bandeau Bibliothèque reste accessible indépendamment ; nom/workspace et réglages continuent d’exister dans la page Réglages.
- Indicateurs : cadre global, titre et bouton de repli à droite ; quatre cartes existantes, pliées ensemble sans démontage.
- Aujourd’hui/À surveiller : suppression de la hauteur fixe258px ; hauteur naturelle selon contenu et plafond proportionnel à la hauteur disponible. Défilement vertical réellement testé sur longues listes. L’état vide ne réserve plus une grande zone. Accès clavier au scroll, alertes critiques hors repli conservées.
- Mise à l’échelle : redistribution des grilles et dimensions bornées selon largeur/hauteur de fenêtre. Aucun zoom automatique, changement d’échelle Windows, choix de densité ou police réduit par le code. Le zoom de l’utilisateur reste libre. Ce n’est pas une certification de tous les écrans physiques.

## Contrôles et limites

Typecheck et `node scripts/check-shell-home-simplification.cjs --adaptive`.20 contrôles natifs ciblés, profil/SQLite TEMP : listes débordantes, cadre/repli, source réelle de8 alertes, Escape/focus, erreur injectée et récupération, réponse périmée refusée, bonne navigation d’alerte, bonne route Réglages, exclusivité du dialogue chrono, UX01 Rester sans perte de texte, unicité chrono, intégrité/FK/migrations71 et aucune mutation métier. Deux géométries seulement, captures et SHA dans `outputs/home-adaptive-standard`. La ligne d’erreur TEST service unavailable est une injection volontaire vérifiée, pas une anomalie masquée.

Les anciennes recettes qui cliquent header-mode/header-options-trigger dans le vrai Manager devront être adaptées à cette décision avant une campagne de convergence ; elles ne sont pas déclarées exécutées ni compatibles par ces20 contrôles. Aucune CI hébergée. Aucun main/installation ni remplacement d’une recette déjà ouverte. Nouveau portable distinct, même dataset synthétique préparé depuis les services, sans copie d’une base en cours de recette.

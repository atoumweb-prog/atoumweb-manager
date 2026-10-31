# Prospection — passe ergonomique pilote, 22/10/2026

## Consignes et périmètre

Utilisateur autorise les corrections après examen des 13 visuels `AtoumWeb-Prospection-13-visuels.zip`. Pas de nouvelle conception CRM ni de moteur métier. Base locale01909b4b, branche `codex/ux-v2-prospection-visual-pilot`, sans main/publication/CI/installation. Client reste en attente. Une seule configuration : Noir, Confort,1920×1080,100%, fixtures/profil SQLite TEMP uniquement.

## Réalisé

- Quatre compteurs cliquables, utilisant les populations existantes : tous non archivés, à qualifier, relances dues selon la règle existante, devis à préparer. Ces populations se chevauchent ; aucune addition implicite. Le filtre À suivre historique reste le défaut.
- Recherche, activité, ville, statut et effacement visibles ; actualisation conservée. Aucun bouton de sélection multiple ou pagination fictif.
- Tableau partagé conservé : identité obligatoire, prochaine action et échéance ajoutées comme colonnes de présentation ; autres colonnes/vues/tri/redimensionnement conservés. Registre de présentation actualisé ; anciennes vues compatibles par normalisation existante. Pas de lecture d’historique par ligne inventée.
- Fiche rapide : prochaine action réelle, contact, dernière activité enregistrée, informations/préparation et associations dans des détails. Référence, démarrage, agrandissement, fermeture et source du résumé conservés. Le bouton Consulter l’action mène à la fiche de travail existante ; pas de nouvel éditeur parallèle.
- Filtrer ou trier ne ferme ni ne remonte la fiche sélectionnée. Éditeurs complets de Prospect A et ses trois groupes inchangés.
- Pipeline : titres/compteurs flexibles, six colonnes avec largeur minimale et défilement ; prochaine action/échéance visibles sur les cartes fermées, retard rouge indépendant de la température/étape. Conversion reste un historique séparé sans drag/drop de conversion.
- Historique existant conservé et espacé ; aucun nouveau compteur catégoriel ni export inventé. État vide couvert dans la capture : ce n’est pas une preuve de tous les dossiers historiques.
- Titre et aide contextuelle existants conservés ; diagnostic SQLite permanent masqué pour ce seul écran, disponible ailleurs. Le garde du ModulePlaceholder existant a été rétabli après une erreur de remplacement intermédiaire ; aucune correction applicative de ce garde n’était nécessaire dans la base initiale.
- Logo AtoumWeb validé réutilisé pour ce pilote ; palette de l’Accueil limitée ici à Prospection, sans généralisation aux autres modules. Les commandes de l’en-tête sont conservées ; remplacement compactage/burger par cloche/réglages reste un ajustement distinct non livré par cette passe.

## Vérifications ciblées

Typecheck,12 tests unitaires du pipeline/schéma visuel ; banc `node scripts/check-shell-home-simplification.cjs --prospection` (22 contrôles incluant invariants repris du harnais) sur fenêtre unique. Vrais App/preload/IPC, migration71 et intégrité/FK sur TEMP ; aucune campagne de restauration ou Vitest complète relancée.

Assertions : compteurs réellement filtrants, colonnes action/échéance, sélection et nœud de fiche conservés lorsque le filtre masque sa ligne et lors du tri, absence du faux placeholder, largeur lisible des filtres, ouverture de la fiche Prospect A, trois groupes conservés, confirmation UX01 exactement une fois et Rester par défaut, texte exact du brouillon conservé après refus de navigation et après changements de vues, chrono unique et même nœud, aucune mutation des lignes métier pendant ces gestes. Recette en développement : déplacement du titre abandonné pour préserver les points d’entrée existants ; garde de placeholder rétabli après remplacement trop large, barre de filtres en grille pour éviter son écrasement par les règles héritées. Corrections ciblées, sans délai ajouté.

Galerie et rapport SHA : `outputs/prospection-pilot-standard/`. Captures : annuaire avec fiche rapide, pipeline, historique vide. Les données sont synthétiques, les actions ne prouvent pas toutes les opérations commerciales. Recette visuelle humaine attendue. Les contrôles finaux au SHA propre sont relevés dans le compte rendu, distincts des essais en working tree.

## Réserves

Pas de généralisation, aucune modification de Client B, EC03, sauvegardes ou migrations. Pas de certification multithème/multiécran pendant cette passe. Pas de pagination/exports/actions groupées ajoutés pour copier des boutons des maquettes. Aucun moteur contractuel ou service modifié. Aucun changement de l’application installée ni des données réelles.

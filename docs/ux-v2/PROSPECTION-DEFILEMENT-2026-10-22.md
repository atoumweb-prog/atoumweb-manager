# Prospection — défilement et lisibilité après recette portable

Demande : corriger la table écrasée par la fiche rapide, les mots coupés et les contenus inaccessibles, sans reprendre l’Accueil/en-tête validés ni modifier le métier.

- L’annuaire occupe la hauteur disponible ; son tableau possède un défilement vertical et horizontal accessible au clavier. Largeurs minimales des colonnes conservées, aucune coupure forcée au milieu des mots. Le réglage automatique historique reste inchangé pour les autres modules.
- Fiche rapide bornée à340–480px ; en espace restreint elle se superpose plutôt que d’écraser le tableau. Même instance et mêmes gardes UX01. En-tête fixe et corps défilant jusqu’aux actions du bas. Cliquer les barres de défilement ou le séparateur ne ferme plus la fiche.
- Titre unique et bouton Entreprise sur la même ligne ; indicateurs moins hauts et repliables. Filtres, colonnes/vues, création, fiche de travail, parcours et historique conservés. Parcours et historique restent défilants.

## Vérification ciblée

Une seule configuration :1920×1080,Noir,Confort,100%. `npm run typecheck` et `node scripts/check-shell-home-simplification.cjs --scroll`.40 entreprises synthétiques dans SQLite TEMP ; véritables événements Electron de molette verticale/horizontale et PageDown, accès aux boutons inférieurs, séparateur borné, sélection conservée après filtrage vide, repli, parcours accessible et instance chrono inchangée. Intégrité SQLite, FK et registre71 vérifiés ; comparaison des tables métier avant/après. Capture/mesures/SHA dans `outputs/prospection-scroll-standard`.

Aucune campagne générale ni validation de tous les écrans. Aucun changement des migrations, IPC, services ou données réelles ; EC04 reste expérimental non exposé. Pas de fusion, push, CI ou installateur. Tout nouveau portable est distinct de la recette en cours et contient exclusivement un nouveau jeu synthétique.

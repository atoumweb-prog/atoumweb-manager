# Prospection — réalisation des six lots

Autorisation utilisateur du 22/10 : tous les lots séquentiels, sans validation intermédiaire. Disposition confirmée : identité en haut, Identité/logo et Associations à la demande, deux onglets pleine largeur. Cette décision remplace les trois colonnes permanentes du cahier joint. Branche codex/prospection-ux-six-lots ; référence avant : galerie69 captures, baseline50b749b0. Aucun changement de modèle, migration ou donnée réelle autorisé par ce chantier.

## UX-PRO-01 — Annuaire

Vue initiale compacte Entreprise/Action/Échéance/Situation/Ouvrir pour nouvelles préférences ; vues personnelles existantes conservées. Tableau adaptatif, volet superposé en fenêtre étroite, scroll accessible en faible hauteur. Personnalisation en panneau superposé, KPI compacts et définitions, compteur de filtres ; fermeture rend le focus à la ligne. Typecheck réussi ;20 contrôles Electron TEMP, six combinaisons de fenêtre/zoom (1920,1440,1366 ;100/125/150 %), sélection après tri et filtrage. Captures outputs/prospection-ux-lots/lot-01. Aucune règle de compteur modifiée.


## UX-PRO-02 — Creation et contacts

Creation en dialogue natif focalise, champs facultatifs regroupes, annulation protegee ; editeur entreprise ou contact/decideur a la fois, saisies montees. Recherche de contacts existants et association d'un contact sans entreprise via l'API existante avec comparaison de version ; refus de doublon nom/email, aucune reaffectation d'une autre entreprise. Le modele actuel Contact.organizationId est simple : multi-entreprises et role par relation non simules, pas de migration. Typecheck et10 controles Electron TEMP dont garde Rester sur creation, captures1920/1366.

# Prospection — réalisation des six lots

Autorisation utilisateur du 22/10 : tous les lots séquentiels, sans validation intermédiaire. Disposition confirmée : identité en haut, Identité/logo et Associations à la demande, deux onglets pleine largeur. Cette décision remplace les trois colonnes permanentes du cahier joint. Branche codex/prospection-ux-six-lots ; référence avant : galerie69 captures, baseline50b749b0. Aucun changement de modèle, migration ou donnée réelle autorisé par ce chantier.

## UX-PRO-01 — Annuaire

Vue initiale compacte Entreprise/Action/Échéance/Situation/Ouvrir pour nouvelles préférences ; vues personnelles existantes conservées. Tableau adaptatif, volet superposé en fenêtre étroite, scroll accessible en faible hauteur. Personnalisation en panneau superposé, KPI compacts et définitions, compteur de filtres ; fermeture rend le focus à la ligne. Typecheck réussi ;20 contrôles Electron TEMP, six combinaisons de fenêtre/zoom (1920,1440,1366 ;100/125/150 %), sélection après tri et filtrage. Captures outputs/prospection-ux-lots/lot-01. Aucune règle de compteur modifiée.


## UX-PRO-02 — Creation et contacts

Creation en dialogue natif focalise, champs facultatifs regroupes, annulation protegee ; editeur entreprise ou contact/decideur a la fois, saisies montees. Recherche de contacts existants et association d'un contact sans entreprise via l'API existante avec comparaison de version ; refus de doublon nom/email, aucune reaffectation d'une autre entreprise. Le modele actuel Contact.organizationId est simple : multi-entreprises et role par relation non simules, pas de migration. Typecheck et10 controles Electron TEMP dont garde Rester sur creation, captures1920/1366.

## UX-PRO-03 — Fiche, qualification, besoins et devis

En-tete conserve identite/statut/interet/prochaine action ; deux onglets pleine largeur. Bureau en dialogue natif (focus/Escape), synthese sans controles dupliques ; groupe pertinent initialement ouvert, replis memorises, editeurs toujours montes. Qualification accompagnee de la liste reelle des manques ; prestations retenues et catalogue repliable, chiffrage conserve ; brouillon avec Modifier comme action principale et validation pour envoi distincte. Typecheck et12 controles Electron TEMP dont absence de creation implicite de devis, captures1920/1366. Statuts devis complets a couvrir dans la regression transversale.

## UX-PRO-04 — Actions et historique

Planification et compte rendu/suite dans dialogues natifs dedies avec actions de saisie proches ; Escape garde les brouillons. Annuler la saisie distinct d'annuler l'action programmee ; erreurs presentes dans l'editeur actif. Confirmations Perdu/Archive alignees sur les tokens lisibles ; journal complet a la demande (limite20 retiree), historique filtre par issue/date et tri. Typecheck et10 controles Electron TEMP, dialogue imbrique et archivage annule sans mutation ; captures1920/1366.

## UX-PRO-05 — Reference prospect

Sept groupes de controles conserves, depliables avec comptes des etats reels, grille compacte en lecture et edition, memes six rubriques et source/date/version. Saisies montees au repli ; boutons Enregistrer/Annuler existants accessibles ; chargement avec generation et erreur explicite. Une version externe observee bloque l'enregistrement stale et conserve la saisie ; liste relue avant sauvegarde. La sauvegarde est append-only : pas d'ecrasement des anciennes versions. Limite : l'API publique ne fournit pas de compare-and-swap atomique entre deux saves exactement simultanes ; aucun contrat IPC modifie dans ce chantier. Le theme detache suit deja le parametrage persiste : les premieres captures claires venaient de la fixture ne persistant pas le choix Noir, pas d'une fonction de theme manquante. Typecheck et11 controles Electron TEMP : version unique, repli conservant notes, conflit detecte, theme persiste identique ; captures1920/1366.

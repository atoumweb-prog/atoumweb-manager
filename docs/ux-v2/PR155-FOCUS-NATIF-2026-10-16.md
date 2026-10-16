# PR155 - preparation du focus natif, 16 octobre 2026

## Avant / cause reproduite

Base ca2f3b6638414cdc0542d5a06e6ad3248ffe5fb0, CI1804 en echec sur Native Shift-Tab returns to same qualification textarea. Deux recettes instrumentees locales reproduisent le meme echec apres les vraies navigations, captures, themes/densites et zooms du scenario. Une premiere tentative de copie diagnostique a echoue sur son chemin relatif de compilation, avant le test ; elle ne compte pas comme reproduction du focus.

Fenetre visible, win.isFocused=true, webContents.isFocused=true, document.hasFocus=true. Pourtant le premier textarea de qualification est dans details[data-group=needs] ferme : checkVisibility=false, getClientRects().length=1. Le helper historique remplit puis appelle e.focus() sur ce champ cache ; aucun evenement focusin/focusout, activeElement=BODY. Tab atteint Replier Identite : l'assertion faible "ailleurs dans la fiche" passe. Maj+Tab atteint un lien du tableau sous-jacent, pas le textarea. Les evenements keydown/keyup Tab et shiftKey=true sont correctement recus. Aucun clavier perdu ni preuve de perte du focus natif Windows. Le groupe ferme est la presentation Prospect A validee, pas une anomalie de l'application.

## Correction minimale du banc

Uniquement la fixture final-visual et documentation. Ciblage de la fiche complete active, ouverture conditionnelle via le summary existant, attente de checkVisibility, puis acquisition de focus Windows/webContents et vrai clic souris par sendInputEvent. Aucune affectation DOM de focus pour faire passer l'assertion ; le peuplement synthetique du brouillon ne prend plus le focus par e.focus().

Les vrais keyDown/keyUp Tab et Maj+Tab, les assertions d'origine et les delais restent identiques. Deux assertions supplementaires imposent le focus natif sur le bon champ AVANT Tab et l'arrivee sur le second textarea visible. Traces des trois phases : focus Windows/webContents/document, visibilite, activeElement et ordre des controles visibles (checkVisibility, pas simplement getClientRects). Aucun retry d'assertion clavier, aucun masquage d'erreur.

## Validation ciblee

Premier essai avant commit : 530/530, 135 captures, 15 scenes x9 themes/densites, aucun consoleErrors. Inclut les erreurs de sauvegarde, brouillon/instance conserves, confirmations Rester/Quitter exactes, conversion idempotente et chrono unique. Cette preuve preliminaire ne remplace pas les repetitions sur le commit fige.

Le bilan final local et les repetitions sont produits dans outputs/pr155-focus-validation/ (JSON, logs, SHA/arbre, empreintes). Rejouer uniquement cette recette et les controles directement concernes : EC01, Prospect A, Client B, EC03, UX-01. Les autres recettes natives deja vertes au code ead8a16a sont reutilisables apres verification de l'identite de leurs sources et fixtures ; ne pas les presenter comme executees sur GitHub ou a nouveau localement. Typecheck/Vitest1532/restaurations35/binaires6 : preuves CI1804, aucun code TS touche, pas de relance complete.

Conditions comparables : Windows, Electron du lockfile, wrappers avec windowsHide=true, show explicite, vraie App/preload/IPC/SQLite TEMP, captures et variations de zoom avant la sequence. Le runner heberge lui-meme ne peut pas etre reexecute sans autorisation : diagnostic de cause reproduit localement, confirmation hebergee encore necessaire.

## Limites

PR155 et ses branches distantes inchangees. Aucun changement applicatif, Prospect A/Client B, moteur EC03, schema, dependance ou workflow. Pas de migration reelle ni installation. Logos/fichiers externes hors sauvegarde SQLite seule, archivage Annuaire non expose, recette humaine globale differee. Toute nouvelle CI ou publication attend un accord distinct.

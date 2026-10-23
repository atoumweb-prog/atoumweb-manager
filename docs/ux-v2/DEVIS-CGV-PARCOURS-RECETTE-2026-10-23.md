# Devis et CGV — parcours lisible livré le 23/10/2026

Autorisation Carlos : maquette « Une rubrique à la fois » acceptée, compléter copie de toutes les clauses / PDF / Word et travailler directement. Branche locale `codex/devis-cgv-parcours-humain`, base c4ab9cfc. Ce chantier est distinct de PR #1 Nouvelle entreprise ; aucune fusion, aucun push, aucune CI ou modification Bridge/installateur.

## Réalisation

- Un seul `QuoteJourney` utilisé par le registre Devis et l’éditeur intégré de Prospection : Prestations et prix / Conditions et CGV / Vérifier et sortir. Même identité de devis, dernière rubrique de session retrouvée entre les deux accès. Panneau global agrandi par défaut.
- Lignes et montants d’abord. Options détaillées, préparation du Projet et transfert Abby accessibles à la demande. Production et diagnostics ne précèdent plus la saisie du devis.
- Bureau de clauses : socle commun / clauses des prestations / conditions particulières, sélection d’un texte à la fois, lecture, modification du titre et du texte, sauvegarde ou annulation, ajout particulier. Exclusion/réintégration, retour au modèle et ordre restent accessibles. Aucun tarif ni texte juridique réécrit par cette passe.
- Socle : ouverture de son modèle dans la bibliothèque, nouvelle version brouillon puis publication explicite ; les contrats existants ne sont pas réécrits. Adaptations de clauses prestation et conditions particulières propres au devis.
- Comparaison explicite avant actualisation depuis la bibliothèque ; proposition, jeton, confirmation et conservation des adaptations existants inchangés. Aperçu contractuel complet et provenance restent disponibles dans les détails.
- Copie de toutes les clauses incluses depuis les valeurs enregistrées ; véritable PDF du devis avec contrat ; véritable DOCX de travail via l’export existant. Éditeurs non enregistrés protégés avant navigation, copie et exports ; annulation de sortie conserve la saisie.
- Vérification par rubriques Client, Paiement, Livraison et corrections, Droits, Hébergement, Qualification, Annexes, Pièces, AtoumWeb ; rubriques contextuelles préservées. Une rubrique à la fois. Liens d’anomalies ouvrent la bonne rubrique et ciblent le champ. Contrôle final unique, option de classement approuvé rangée dans les détails.
- Schéma 74, moteurs contractuels, gardes serveur, brouillons, comparaison, instantanés préparés/gelés/envoyés/acceptés et modèle Abby inchangés. On considère les textes existants comme la base de recette ; cela n’invente pas les informations administratives ou propres au dossier manquantes.

## Validation effective

- `npm run typecheck` : réussite.
- 60 tests ciblés : ContractTermsService (20), QuoteTransmission (28), unsavedRegistry (12), tous réussis.
- `node scripts/check-quote-journey-native.cjs` : 32 assertions, vrai renderer/preload/IPC/Electron/SQLite TEMP, aucune erreur renderer. Lecture d’un texte à la fois, adaptation enregistrée sans toucher au modèle, version brouillon du socle sans altérer publié/devis, condition particulière, garde d’abandon, presse-papiers réel contenant tous les textes, véritable DOCX dont texte extrait contrôlé, véritable PDF produit, devis restant brouillon, trois thèmes, accès intégré identique sans duplication.
- Galerie et exemples TEST : `outputs/quote-journey-20261023/index.html`, `TEST-devis.pdf`, `TEST-conditions.docx`.
- `npm run package` : réussite. Exécutable réel : 31 assertions, 12 visites, thèmes et profil TEMP, aucune erreur renderer ; intégrité/FK et registre 74.

## Livraison et conservation

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261023-c0bb85a3/LANCER-LE-MANAGER.cmd`

- app.asar SHA256 `c0bb85a36899569200c859965e6d2c75de31bfdc3292cabd534e12b45a88f4af` ; exécutable `1e32f95517560ba41d137dbd22c5e4c2276bd41ceec5f7dcea3ad48a0e245ea1`.
- `prepare-devis-portable.cjs` crée uniquement une nouvelle livraison. Ancien Workspace 1ddd01fb lu seul, sauvegarde SQLite cohérente, fichiers métiers copiés hors anciennes sauvegardes ; vérification de chaque ligne de chaque table avant tout ajustement des seuls chemins de Projet dans la copie. Aucun seed neuf ni resynchronisation automatique des devis.
- Conservation vérifiée : 118 modèles et 118 versions de clauses, 409 liens Catalogue, 13 types / versions conservés en brouillon, 112 liens ; 5 prospects, 3 devis et 6 lignes existantes, toutes les autres lignes préservées. Intégrité `ok`, FK vide, registre 74. Rapport `DONNEES-CONSERVEES.json` dans la livraison.
- Profil et Workspace propres au nouveau portable, empreintes et préparation du profil contrôlées. Ancien portable et Manager natif inchangés. Galerie dans `Captures/index.html`.
- Les champs réellement manquants restent à compléter ; aucun classement 05C approuvé fabriqué, aucune publication automatique. Le Word est un document de travail, pas une acceptation ou un envoi.

Prochaine action : recette utilisateur du parcours dans ce nouveau lanceur. Ne pas lancer une nouvelle campagne sans changement pertinent ni pousser vers l’ancien remote `origin`.

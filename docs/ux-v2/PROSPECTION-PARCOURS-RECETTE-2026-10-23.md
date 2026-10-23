# Prospection — parcours et devis intégrés — 23/10/2026

## Autorisation et réalisation

Passe autorisée après le relevé utilisateur : corrections du parcours, texte noir du bouton Entreprise et nouvel exécutable. Branche codex/crm-saisie-coherente ; travail local non committé conservé, aucune fusion/push/CI/installateur ni intervention Bridge.

- Sept onglets : Entreprise, Contacts, Préparer l’échange, Besoins, Actions et échanges, Devis, Historique. Analyse / Objectif et questions remplacent Recherche / Préparation ; pas de second Historique dans l’analyse.
- Onglets actifs jaune et texte sombre, sans dépendre du focus ; bouton Entreprise noir sur jaune.
- Entreprise : identité, adresse complète, informations légales et coordonnées générales ; site directement renseignable (existant, absent, à vérifier). URL canonique et observation partagée sauvegardées atomiquement, avec contrôle de conflit ; préparation privée conservée.
- Contacts : coordonnées visibles sur les cartes, choix du principal et du décisionnaire, création et correction sur place. Fonction conservée par relation avec l’entreprise. Champs courts regroupés et formulaires plus compacts.
- Besoins : Qualification ; Demande et besoin ; Budget et délais ; Prestations et points à confirmer. Demande initiale distincte du besoin confirmé, cartes côte à côte ; informations manquantes signalées avec liens et champs marqués.
- Prestations : intentions par cases à cocher sans prix ni offre forcée, ajout libre et anciennes sélections conservées. Cocher ne crée pas de devis ni de ligne tarifée.
- Devis : contexte du dossier et contrôle avant devis à côté du véritable éditeur partagé avec le registre global. Préparation d’un brouillon vide après contrôle ; lignes, catalogue et chiffrage dans Devis. Réutilisation atomique du brouillon existant et vérification des informations fraîches avant création.
- Consultation distincte du statut : avertissement avant une phase ultérieure incomplète, choix de compléter ou de continuer sans changer d’étape. Passage explicite, lien vers les informations manquantes ; protections des brouillons, devis acceptés et transitions conservées.
- Historique : filtres des événements utiles, journal complet accessible ; pas d’invention de détails absents des anciens événements.

## Validation proportionnée

Typecheck et package réussis. 94 tests ciblés distincts sur sept fichiers (projection, brouillons, workflow, sources CRM, options/transmission et préparation de devis), plus cinq tests du plan avant devis déjà passés pendant cette passe. Recette native TEMP : 29 assertions, aucune erreur renderer, 16 captures. Elle couvre les coordonnées après ajout, décisionnaire, absence de site, avertissement de phase, qualification enregistrée puis avancée explicite, intentions sans prix, création sans ligne, édition intégrée et protection d’une saisie de devis lors du changement d’onglet.

Véritable exécutable : 31 assertions, 12 visites, trois thèmes en Confort, aucune erreur renderer ; intégrité SQLite, clés étrangères et registre 1–74 conformes. Le premier essai du banc attendait indéfiniment deux frames dans la fenêtre en arrière-plan ; attente rendue bornée dans le banc uniquement, puis recette réussie. Aucun changement du produit pour ce point.

Galerie : C:/Users/AtoumWeb/Downloads/Prospection-parcours-20261023-166160dc/index.html. Les vues principales ont été inspectées à 1920×1080 CSS, Noir/Confort/100 %, avec contrôles de contraste dans les autres thèmes.

## Livraison et limites

Lanceur : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-166160dc/LANCER-LE-MANAGER.cmd

Application/resources/app.asar SHA256 : 166160dc9a16deba27999b392a2fe5fc78fe532e8043b1369703e271f2de6984

Application/atoumweb-manager.exe SHA256 : 33952e3fb435581bdaa08ad24e51c22cf80b17b34a95f27558a28952449f1802

Empreintes de la copie vérifiées, syntaxe PowerShell du lanceur vérifiée, profil pointant sur son propre Workspace. Nouveau profil et Workspace TEST indépendants ; anciennes recettes, dont 16cfd49e et leurs saisies, intactes. Aucun transfert automatique. Schéma 74 inchangé ; aucune nouvelle migration. L’exécutable se lance via le CMD, en conservant tous les dossiers ensemble.

La préparation initiale exige les informations avant devis ; le brouillon ne chiffre pas automatiquement les intentions. Les contrôles de validation/envoi/acceptation restent ceux du gestionnaire partagé. L’historique ancien ne contient que les détails réellement enregistrés. Prochaine action : recette utilisateur de cette version.

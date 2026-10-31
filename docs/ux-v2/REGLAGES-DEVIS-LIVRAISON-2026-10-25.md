# Réglages entreprise, modèles et aperçu paginé — 25/10/2026

## Réalisation autorisée

Carlos demande l’intégration dans Réglages, puis la poursuite de l’éditeur de devis. Réglages > Mon entreprise et devis comprend quatre onglets : Mon entreprise, Logo et présentation, Paramètres du devis, Conditions contractuelles. L’accès depuis l’éditeur ouvre la page et amène à cette rubrique.

Informations communes : identité légale/commerciale, adresse/immatriculation/coordonnées, TVA ; autres mentions dans Conditions contractuelles. Les champs administratifs réutilisent strictement `contract-administration-v1`, sans deuxième source d’identité. Les données restent actuellement regroupées dans des zones de texte explicites : pas encore de fiche d’entreprise structurée séparant chaque élément d’adresse/SIRET/téléphone.

Modèle : nom d’en-tête, signature de marque, logo PNG/JPEG importé/remplacé/retiré, couleurs, police, taille du texte, marges latérales, largeur de logo, pied de page ; validité et acompte proposés, titres, introduction et acceptation. Valeurs bornées et textes échappés ; aucune saisie CSS/HTML arbitraire. Enregistrement conjoint modèle/administration atomique avec détection des sauvegardes concurrentes et protection des saisies non enregistrées.

La bibliothèque des clauses et types est accessible depuis Conditions contractuelles ; composant versionné existant réutilisé. Copies intégrales, Word et PDF existants conservés.

## Documents et conservation

Le modèle commun est stocké dans `settings` sous `quote-document-settings-v1`. Chaque nouveau devis adopte explicitement une copie documentaire sous `quote-document:<id>` dans la transaction de création. Modifier le modèle commun ne remplace pas celui des devis existants. Le bouton « Reprendre le modèle enregistré » est réservé aux brouillons modifiables. Modèle/logo sont inclus dans `snapshot.presentation` lors de la préparation/transmission ; les chemins historiques restent sur leur présentation sauvegardée, sans lecture du nouveau modèle. Aucun nouveau schéma : registre74 inchangé.

Les formulaires de création Devis et Prospection reprennent les valeurs par défaut ; choix explicites et dossiers existants préservés. Les coordonnées communes des brouillons non figés restent actualisables ; celles des versions figées sont conservées par le snapshot existant.

Le modèle d’aperçu paginé est le même PDF Chromium que l’export. Nouvelle fonction `renderQuotePdfBuffer` : lecture, production en mémoire, aucune création de devis/export/envoi automatique. Pages rendues avec PDF.js6.4.299 embarqué localement, worker fourni dans le package, aucune ressource web nécessaire. Zoom, pages numérotées, aperçu à côté de l’édition et actualisation explicite après enregistrement. Protection si une saisie n’est pas enregistrée. L’aperçu HTML continu historique reste disponible dans la prévisualisation côté client ; le bouton « Afficher l’aperçu paginé » est celui à utiliser pour vérifier les coupures.

Correction supplémentaire du moteur : tous les sauts de ligne des coordonnées sont désormais repris sur la première page, notamment SIRET/email/téléphone auparavant omis. En-tête compact pour préserver la synthèse commerciale sur une page.

## Vérifications

Typecheck réussi. 79 tests ciblés distincts réussis : settings3, PDF9, préparation39, transmission28. Cas nouveaux : neutralité d’une entreprise vierge, style invalide/conflit, rollback commun si administration invalide, valeurs proposées aux nouveaux devis, conservation des anciens modèles, reprise volontaire et modèle figé, coordonnées multilignes intégrales. Un premier test de validité lisait un champ inexistant ; corrigé pour vérifier les dates réelles.

Recette native TEMP44 assertions, zéro erreur renderer : réglages enregistrés puis retrouvés après navigation, même identité canonique, bibliothèque existante, logo, pages réellement dessinées, édition à côté de l’aperçu, protections, copies et exports. Trois thèmes du parcours existant. Adaptation du banc pour fournir le worker local à esbuild ; première tentative avec plugin synchrone non supporté, remplacée par alias local. Seul le processus de ce banc a été arrêté ; aucun Manager utilisateur fermé.

Binaire réel reconstruit :34 assertions/13visites, zéro erreur renderer ; aperçu PDF dans Réglages réellement rendu depuis les assets packagés. Exemple DEV00310pages,35corps de clauses retrouvés, SIRET/email présents page1 ; pages rendues et inspectées. Pas de campagne globale ni d’installateur.

## Livraison

`C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261025-47db9101/LANCER-LE-MANAGER.cmd`.
Source :91dedc1c lue seule et sauvegardée SQLite. Chaque ligne de toutes les tables vérifiée avant rebasing des chemins Projet dans la copie. Bibliothèque, prospects,3devis/7lignes et paramètres de maintenance conservés. Rapport DONNEES-CONSERVEES.json.

Après copie et sauvegarde avant modification, informations professionnelles fournies/confirmées intégrées dans cette nouvelle copie seulement : identité et adresse du document Guichet unique, SIREN/SIRET, téléphone/site, agence@atoumweb.fr, franchise en base de TVA confirmée actuelle. Autres mentions non connues restent à renseigner, sans invention. Modèle Atoum initialisé et adopté pour le brouillonDEV003 seulement ; autres devis non remplacés. Paramètres et rapport avant/après dans Workspace/backups/informations-entreprise.json. Aucun numéro de sécurité sociale, naissance ou situation familiale importé. Anciennes livraisons inchangées.0109811a est une construction intermédiaire non livrée, marquée comme telle.

Mention fiscale utilisée : « TVA non applicable, article293B du CGI », encore admise pendant la tolérance jusqu’à fin2027. Source officielle consultée : https://entreprendre.service-public.gouv.fr/vosdroits/F36244 . Ce lot ne développe aucun moteur de collecte/calcul de TVA ; ce champ est une mention fiscale, pas un taux de taxe.

SHA asar :47db9101af27fe80d5fc65b2ac2a9d205245937d2948f70526ee48e2c48d6659.
SHA exe :2f8fd1c4348348110695ebf7a257143fa35362083c077c7bf35010345901b8a2.

## Suite et limites

Recette Carlos dans Réglages et dans l’éditeur ; poursuivre ensuite l’ergonomie de l’édition. Pas d’éditeur libre de PDF : les fautes se corrigent dans les champs/clause sources, puis aperçu actualisé. Pas encore de redimensionnement manuel des colonnes ou déplacement libre des blocs. La neutralité des coordonnées et du modèle prépare une réutilisation par d’autres entreprises ; elle ne rend pas le Manager prêt à commercialiser (licence/distribution/multi-entreprise simultanée hors lot).

Le devis reste brouillon : calendrier, renouvellement, mentions/réclamations et qualifications applicables non inventés. L’exemple complet35clauses applique20ajouts sur TEMP uniquement, comme la recette précédente. Transmission/acceptation indépendante d’Abby reste un chantier distinct non réalisé. Pas de push/main/fusion/CI/installateur/Bridge.

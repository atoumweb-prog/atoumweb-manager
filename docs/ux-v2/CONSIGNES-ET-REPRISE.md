# Manager — consignes et reprise courte

Mise à jour : 23/10/2026. Les demandes récentes de l’utilisateur priment. Suivi général : PROJECT_STATUS.md. Périmètre actuel : Prospection, composants CRM partagés concernés et lanceur ; aucun chantier Bridge implicitement autorisé.

## Travail et validations

- Lire AGENTS.md et les lectures obligatoires du dépôt. Réponses courtes et concrètes, pas de reprise du chat complet.
- Aucune délégation sans demande. Pas de recherche web pour ces corrections locales.
- Respecter les brouillons UX-01, conflits et règles métier. Informations liées à leurs identités canoniques ; aucune duplication de système Entreprise / Contacts / Prospects.
- Garder six étapes actives du pipeline, conversions protégées, contrats, devis et snapshots acceptés, historiques.
- Référence de recette : Noir, densité Confort, zoom 100 %, fenêtre 1920×1080 CSS. Adaptable aux autres thèmes ; contrôles ciblés si anomalie réelle.
- Contrôles proportionnés : pas de suite complète, matrice ou reconstruction sans changement pertinent. Ne pas relancer les contrôles déjà réussis uniquement pour reprendre.
- Bases de test TEMP déterministes ; nouveaux portables sur Workspace TEST distinct. Ne pas toucher ni écraser les saisies dans les anciennes recettes.
- Pas de main/fusion/push/CI/installateur ou activation EC04/B1 sans autorisation correspondante.
- À la fin d’une étape significative, actualiser PROJECT_STATUS et remplacer ce mémo par l’état utile courant.

## Dernier état

- Passation ChatGPT publiée à la racine : PASSATION-CHATGPT.md (organisation métier, carte des sources, contrôles, livraison et limites). README fournit le lien d’entrée ; la recette utilisateur reste la prochaine étape.

- Nouvelle demande autorisée : dépôt privé dédié https://github.com/atoumweb-prog/atoumweb-manager-prospection créé pour cette version ; commit/push de la branche codex/crm-saisie-coherente autorisés vers ce dépôt uniquement. Remote prospection ; origin historique inchangé. Actions désactivé avant push ; aucun exécutable ni donnée utilisateur publié.

- Dépôt : C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation ; branche codex/crm-saisie-coherente, commit applicatif de référence 3c118101, toutes les passes consolidées et publiées dans le nouveau dépôt. Ne pas réinitialiser un travail local ultérieur.
- Dernière autorisation : appliquer les corrections relevées et corriger l’exécutable, texte noir du bouton Entreprise inclus. Passe réalisée.
- Sept onglets : Entreprise / Contacts / Préparer l’échange / Besoins / Actions et échanges / Devis / Historique. Préparation contient Analyse et Objectif/questions. Besoins réparti en quatre sous-onglets, formulaires compacts ; intentions sans prix ni offre forcée.
- Entreprise : URL canonique éditable et présence du site sauvegardées atomiquement avec CAS ; coordonnées générales. Contacts : cartes avec téléphone/email, choix du principal/décisionnaire, fonction contextuelle. Éditeur réel du devis intégré avec contexte et contrôle avant devis ; même source et éditeur que le registre global.
- Consultation distincte de l’étape, avertissement préalable et liens vers champs manquants, saisies protégées. Création du brouillon atomique/rejouable et vide de lignes, après contrôle du dossier ; aucun chiffrage automatique des intentions.
- Modèle : SQLite 74 inchangé ; sources uniques, relations multi-entreprises, CAS, demande initiale / besoin confirmé distincts, continuité historique conservés.
- Validation : typecheck/package ; 94 tests ciblés distincts + 5 plan avant devis ; 29 assertions natives TEMP sans erreur renderer ; 16 captures. Véritable package : 31 assertions/12 visites/trois thèmes, intégrité/FK/registre conformes. Pas de répétition sans changement pertinent. Banc smoke : attente RAF bornée pour fenêtres en arrière-plan.
- Livraison : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-166160dc/LANCER-LE-MANAGER.cmd. Empreintes et syntaxe du lanceur vérifiées. app.asar 166160dc9a16deba27999b392a2fe5fc78fe532e8043b1369703e271f2de6984 ; exe 33952e3fb435581bdaa08ad24e51c22cf80b17b34a95f27558a28952449f1802.
- Nouveau profil et Workspace TEST indépendants. Ancienne recette Manager-Prospection-20261023-16cfd49e avec saisies Le Bon Pain intacte, autres anciens portables intacts. Aucun transfert/migration automatique des données utilisateur.
- Galerie : C:/Users/AtoumWeb/Downloads/Prospection-parcours-20261023-166160dc/index.html ; aussi outputs/prospection-parcours-20261023 et Captures de la livraison.
- Bilan : PROSPECTION-PARCOURS-RECETTE-2026-10-23.md. Bilan précédent : PROSPECTION-ONGLETS-RECETTE-2026-10-23.md ; socle : PROSPECTION-CRM-CINQ-LOTS-2026-10-23.md.
- Limites : pas d’enrichissement fictif de l’historique ; catalogue/chiffrage dans Devis, intentions distinctes. Règles existantes de validation/envoi/acceptation conservées. Aucun main/push/CI/installateur/Bridge.
- Prochaine action : recette utilisateur du portable ; aucun autre chantier implicitement autorisé.

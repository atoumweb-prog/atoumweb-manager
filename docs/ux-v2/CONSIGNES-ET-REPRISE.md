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

- **État courant prioritaire** : maquette Devis « Une rubrique à la fois » approuvée + copie intégrale/PDF/Word, implémentée sur branche locale `codex/devis-cgv-parcours-humain`, distincte de PR #1. Parcours commun Devis/Prospection en trois onglets ; lecture/édition un texte à la fois, bibliothèque versionnée, vérification par rubrique, exports réels. Moteurs/gardes/snapshots/textes/schéma 74 préservés. Typecheck, 60 tests ciblés, 32 assertions natives TEMP, 31 assertions binaire réel : succès sans erreur renderer. Bilan `DEVIS-CGV-PARCOURS-RECETTE-2026-10-23.md`.
- **Nouveau lanceur** : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Devis-CGV-20261023-c0bb85a3/LANCER-LE-MANAGER.cmd`. app.asar c0bb85a36899569200c859965e6d2c75de31bfdc3292cabd534e12b45a88f4af. Workspace repris par sauvegarde SQLite de 1ddd01fb lu seul + fichiers métiers, chaque ancienne ligne vérifiée identique, seuls chemins Projet rebases dans la copie. 118 clauses /409 liens /13 types brouillon, 5 prospects /3 devis /6 lignes préservés ; intégrité/FK/74 vérifiés. Pas de seed vide. Anciennes recettes et Manager natif inchangés. `DONNEES-CONSERVEES.json`, `Captures/index.html`. Prochaine action : recette utilisateur ; pas de nouvelle campagne sans changement pertinent. Aucun push/fusion/CI/installateur/Bridge. Les entrées ci-dessous décrivent les étapes précédentes, pas une absence d’implémentation courante.

- Ajout de données autorisé et réalisé dans Workspace du portable1ddd01fb : bibliothèque Reference-V2-20261015 (118 clauses publiées recette, 409 liens, 13 types brouillon, 112 rattachements) avec dépendances Catalogue ; 21 références de version en brouillon pour préserver versions vendues/prix. Sauvegarde, essai copie/rejeu, contrôle de toutes les anciennes lignes (2 devis/4 lignes), intégrité/FK ; véritable assemblage E-commerce sur copie : 15 socle+13 prestation. Aucun code/UI changé ; même lanceur. Bilan PORTABLE-BIBLIOTHEQUE-CONTRACTUELLE-2026-10-23.md. Les devis existants ne sont pas resynchronisés, administration reste à compléter. Pour la prochaine livraison, reprendre explicitement ces données : le seed portable actuel n’importe pas la bibliothèque. Ne pas perdre les saisies ni publier de brouillons.

- Nouvelle demande : audit des règles prévues Devis/CGV et corrections nécessaires. Effectué en documentation/statique, bilan DEVIS-CGV-AUDIT-REPRISE-2026-10-23.md ; aucun changement applicatif/donnée/test/package/push. Ne pas inclure cette reprise Devis/CGV dans PR #1 Nouvelle entreprise. Dernière sortie : restituer les règles retrouvées et l’ordre de correction, pas prétendre le nouveau parcours réalisé.

- Chantier autorisé : PR #1 https://github.com/atoumweb-prog/atoumweb-manager-prospection/pull/1, uniquement Nouvelle entreprise de l’annuaire. Branche chatgpt/creation-entreprise-compacte-20261023, source initiale 0a37d3d90cc5623e1e21970299330d879f93dad4. Cible codex/crm-saisie-coherente inchangée ; pas de fusion. Commit/push permis vers la branche source Prospection uniquement.
- Local : C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager-ec04-validation ; remote prospection = dépôt dédié, origin = ancien Manager, ne pas y pousser. Actions désactivé.
- PR auditée : TypeScript/JSX initiaux corrects ; Analyse partielle, objectif absent, opportunités confondues avec préparation, aperçu logo perdu. Finalisé : quatre cartes 2×2, édition structurée et compteurs, numérique/opportunités/sources persistés, zone et objectif facultatifs dans le snapshot JSON existant ; aucun schéma nouveau (74).
- Préparation compacte en deux colonnes avec points multiligne, objectifs/actions proposés et texte libre ; logo miniature dans la barre, retrait et annulation préservés. Identités canoniques non dupliquées, observations et opportunités séparées des besoins confirmés ; action prévue open, pas effectuée.
- Exception partagée minimale : lecture conditionnelle zone/objectif dans ProspectResearchPanel pour les retrouver après création ; aucune autre fiche/règle métier remaniée. Nouvelle propriété activityArea et conversation.objective conservées par le snapshot existant ; pas d’éditeur ajouté hors création.
- Succès de création : brouillon réinitialisé et ouverture du dossier sauvegardé sans repasser par la garde globale en cours ; protection d’abandon avant sauvegarde vérifiée.
- Validation : typecheck, 21 tests ciblés distincts ; recette native TEMP 42 assertions sans erreur renderer, 13 captures ; réouverture réelle de toutes les rubriques, logo, données et protections. Référence Noir/Confort/100 %/1920×1080 CSS ; autres thèmes ciblés.
- Bilan : CREATION-ENTREPRISE-PR1-RECETTE-2026-10-23.md. Galerie outputs/creation-company-20261023 et C:/Users/AtoumWeb/Downloads/Creation-entreprise-PR1-20261023-1ddd01fb/index.html, avec deux références antérieures identifiées.
- Précédente livraison préservée : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-166160dc/LANCER-LE-MANAGER.cmd. Ancienne 16cfd49e avec saisies Le Bon Pain intacte. Aucun transfert automatique de données.
- Portable construit depuis 4d6021e5 : C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-Prospection-20261023-1ddd01fb/LANCER-LE-MANAGER.cmd ; profil/Workspace TEST propres, empreintes vérifiées. Véritable exécutable : 31 assertions/12 visites/trois thèmes sans erreur renderer, intégrité/FK/registre74 conformes. app.asar 1ddd01fb904aae936d00e67e3f4c82113878d07ba8b00bd8850d6ed6fbe44f28.
- Prochaine action : recette utilisateur du portable de PR #1, laissée ouverte. Commit/push sur sa seule branche ; pas de fusion/CI/installateur/Bridge.

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

# UX/UI V2 — Couverture fonctionnelle et stratégie de livraison

**Référence de comparaison** : `docs/ux-audit/02-CARTOGRAPHIE-ECRANS.md`, `03-INTERACTIONS.md`, `07-REGLES-METIER-A-PRESERVER.md` sur `docs/ux-audit-manager-v1`. Audit ancré au code `eb252d5c...` ; pas certification du HEAD actuel.

## Couverture des 17 modules
| Entrée existante | Cible UX V2, fonctions à conserver / détailler | Vérification avant implémentation |
|---|---|---|
| Accueil | Dashboard compact personnalisable, priorités, chrono global, navigation vers bons objets | Agrégations et alertes |
| Prospection | Annuaire, pipeline 7 colonnes visuelles, historique, fiche rapide/grande, qualification, besoins, contrôle pré-devis, fenêtre référence détachée | transitions, brouillons UX-01, catégories température |
| Clients | Résumé, contacts, commercial, contrats, projets, interventions, documents, historique, avatars, états relationnels | intégrité de source commune |
| Offres & Tarifs | Administration complète, catégories, formules, recherche sémantique/mots clés, suggestions, aides, versions, CGV | versions et droits d'édition |
| Devis | Assistant 6 étapes, lignes, options explicites, préparation Abby, contrats, prévisualisation, révision/duplication/finalisation/acceptation | libellés vs transitions réelles, contrôles UX-04/05 |
| Projets | Prévisionnel/réconciliation, commercial, production, prérequis, accès, ressources, sites/pages, compositions, recette, temps | blueprints, cibles, secrets et disponibilité opérationnelle |
| Interventions & Maintenance | Demandes, incidents, interventions, packs, cycles, quotas, rapports, conclusion | UX-03, UX-02, atomicité des débits |
| Gestion des temps | Sessions, correction manuelle, filtres et chrono global | récupération, contexte et facturabilité |
| Facturation | Éléments à traiter, référence Abby, PDFs importés, suivi des sources et échéances | UX-14 : ne pas inventer sources |
| Dépenses | Liste, création, édition, récurrence, justificatifs, échéances, liens client/projet | règles de suppression et statut |
| Documents & Contrats | Archive, conservation, classement, import, restauration, preuves + bibliothèque contractuelle, édition CGV | documents figés, versions et contrôles juridiques |
| Bibliothèque AtoumWeb | Arbre/listes, versions, stabilité, assets, original/travail/réutilisable, packages et provenance | UX-19, permissions et copies indépendantes |
| Sites (Bridge) | Module autonome de snapshots, Pages/Articles/Divi/Theme Builder, comparaisons et actifs techniques | capacités Bridge réelles, pas de publication fictive |
| Sauvegardes | Registre métier ≠ backup technique ; destinations, preuves, vérifier/relier, sécurité restauration | UX-16 et UX-12 selon code courant |
| Annuaire | Organisations, personnes, coordonnées, fiches, dernière vérification | identité unique, différence Prospect |
| Statistiques | Ensemble, Commercial, Projets & temps, Clients, Rentabilité ; définitions traçables | revenus vs encaissements inconnus |
| Réglages | Thèmes, densités, aide, vues, workspace, backup/restauration, outils demo isolés | aucune sécurité désactivable |

## Hors visibilité simplifiée, mais à conserver
- Fenêtres détachées, menus contextuels, import/export, archivage/réactivation, récits d'erreur, états vides/chargement.
- Distinction Sites du Projet et snapshots WordPress Bridge.
- Distinction publication d'une version locale du catalogue et publication WordPress.
- Prévisualisations techniques et recette opérationnelle restent des outils contrôlés, pas des boutons métier disponibles implicitement.
- Modèles, ACL/capacités, dépendances, états ready vs operational_ready et versions source/copie.

## Invariants de non-régression
| ID | Invariant |
|---|---|
| NR-01 | Aucun écran/contrôle actif ne disparaît sans tableau ancienne → nouvelle destination + décision. |
| NR-02 | Identité Prospect/Client/Contact d'origine unique, sans fiche dupliquée. |
| NR-03 | Versions vendues, clauses et preuves contractuelles figées ; acceptation explicite distincte. |
| NR-04 | Besoin/suggestion non acheté ne produit ni montant, ni contrat, ni blueprint. |
| NR-05 | Un Projet prévisionnel demeure le même projet après acceptation, travail existant préservé. |
| NR-06 | Sites/Pages cibles explicites ; ready ≠ operational_ready. |
| NR-07 | Chrono global unique, quotas et cycles métier historiques préservés. |
| NR-08 | Réutilisation humaine par copie indépendante et provenance ; production Bridge jamais implicite. |
| NR-09 | Document de preuve protégé, suppression/restore/archives selon garde métier. |
| NR-10 | Validation-MSI jamais utilisée comme fixture modifiable en tests ordinaires. |

## Lots de réalisation — cibles, pas ordre de fusion automatique
| Lot | Contenu |
|---|---|
| 00 | **UX-01 #83** revue au HEAD `5b38cbe` (734/734 tests, 177/177 natifs, draft, CI queued) ; **UX-03/UX-16 #81** restent distinctes. Résoudre conflit IPC à la future intégration (simulation 87/87 ciblés, 177/177 natifs), vérifier CI + revue humaine ; aucun chantier en parallèle sur mêmes fichiers. |
| 01A | Audit styles/tokens, palette/typographie, trois thèmes/densités |
| 01B | Champs, boutons, icônes, messages, aides |
| 01C | Fiches rapides/agrandies, panneaux redimensionnables |
| 01D | Tableaux/filtres/colonnes/vues persistées |
| 01E | Intégration de la garde UX-01, sans seconde implémentation |
| 01F | Préférences, atelier démo, recette accessible |
| 02 | Navigation et accueil |
| 03 | Prospection, Clients, Annuaire |
| 04 | Catalogue, offres, formules, services, aides commerciales |
| 05 | Types contractuels, bibliothèque clauses et builder CGV ordonné |
| 06 | Devis et Abby |
| 07 | Projets, Sites & Pages, bibliothèque, Bridge progressif |
| 08 | Interventions, Maintenance et Temps |
| 09 | Facturation, Dépenses, Documents Word/PDF |
| 10 | Statistiques, Sauvegardes, Réglages, recette transversale |

## Définition de « terminé » pour un lot
1. État des lieux HEAD actuel et sélection des composants à **réutiliser**.
2. Tableau `ancienne action / nouvel emplacement / action service / état d'erreur / test` par écran touché.
3. Migration incrémentale, sans modifier les autres parcours métier.
4. Tests unitaires/services, typecheck et suite complète ; checks SQLite/migrations/FK sur fixtures isolées.
5. Recette UI trois thèmes × trois densités ; clavier, focus, raccourcis, fermetures, sauvegarde et petites fenêtres.
6. Capture des régressions et de l'état des protections UX-01/03/16.
7. Commit par incrément, PR, revue humaine avant fusion.

## Travail documentaire encore nécessaire
L'audit a un index d'environ 84 fichiers React, **pas 84 écrans uniques**, et déclare sa matrice non exhaustive. Avant chaque lot, réaliser le relevé de ses handlers, IPC, services, retours d'erreurs, états et raccourcis, puis ajouter à ce référentiel les IDs `UX2-MODULE-NNN` correspondants. Ne pas prétendre qu'une simple liste couvre tous les boutons.

En particulier : décision UX-02 nouveaux abonnements manuels ; édition Word avec fidélité des formats ; rubriques finales de CGV ; inventaire des offres/catégories existantes ; disponibilité de Bridge ; états de réouverture des interventions et projets.

## Dépendance CI — rapport Codex du 09/10/2026
Le workflow `.github/workflows/ci.yml` du code de référence requiert un runner self-hosted Windows X64 et n'a pas de runner correspondant selon le rapport Codex. Passage recommandé **mais non validé par AtoumWeb** vers GitHub-hosted Windows (ex. `windows-2022`), `npm ci` et exécution à deux workers, dans une PR **séparée**. Voir [CI-GITHUB-ACTIONS.md](CI-GITHUB-ACTIONS.md). Les quotas/coûts du compte restent à vérifier. **Aucune fusion, installation ou configuration CI n'est autorisée par cette documentation.**

## Fondations — couverture documentaire
Les six spécifications **01A–01F** sont détaillées dans [Lot 01 — Fondations](LOT-01-FONDATIONS.md) et ses liens. Uniquement **documentation de conception** : cette couverture ne confirme ni une implémentation, ni une recette UX des 17 modules. Le Lot 01F impose un **atelier de démonstration isolé** ; le `DemoPanel` métier existant utilise de vraies APIs de création/réinitialisation, à ne pas détourner pour une recette de composants.

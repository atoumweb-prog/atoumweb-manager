# 08 — Tests, preuve et couverture

Référence : **eb252d5cbd0e95137eafa2b4759fcbcfd7263eda**. Tests de service ≠ preuve d’une expérience utilisateur complète. Les résultats ci-dessous sont ceux de l’audit et des checkpoints explicitement distingués, pas de nouveaux tests exécutés pour la publication documentaire.

## Contrôles exécutés pendant l’audit

| Contrôle | Résultat | Limite |
|---|---|---|
| npm run typecheck | OK | Compilation/types, pas UX |
| npm test -- --cache=false | **695/695**, **79 fichiers** | Suite métier/schéma/shared, pas tous les bancs UI |
| Schéma/intégrité Validation-MSI, lecture seule | 1–66 ; integrity_check OK ; foreign_key_check vide | État observé, pas oracle figé ni garantie de tous les dossiers |
| Création maintenance mensuelle en mémoire | Calendar ; départ 15/10, novembre 01/11 → 30/11 | UX-02 ; chemin manuel précis |
| Offre active avec seule version draft, mémoire | Retenue par filtre du besoin ; devis refusé ; zéro devis résiduel | UX-05 ; garde/rollback corrects, UI à expliciter |
| Terminaison intervention sur pack, mémoire | Erreur sans temps terminé ; in_progress → to_validate ; solde 3 600 s inchangé | UX-03 ; pas généralisation à toutes les couvertures |
| Deux appels création sauvegarde métier, mémoire | Deux enregistrements distincts | UX-12 ; ne prouve pas un double clic utilisateur |
| Banc Phase 7 existant | Échec avant ouverture UI sur « migrations 1–65 » | Défaut du banc, pas preuve d’échec Statistiques |
| Sonde native adaptée à l’audit | Expiration à 240 s | Non concluante ; aucune reproduction visuelle revendiquée pour UX-01/07 |
| CI GitHub du commit au contrôle | En attente | Aucune étape réussie nouvellement revendiquée |

Les expériences mémoire n’ont pas été ajoutées à la suite permanente. Elles utilisaient les services actuels, migrations et données TEST isolées. Elles ne modifient ni Validation-MSI ni ses réglages. Les chiffres d’états courants de cette base ne doivent pas être copiés dans des assertions de la suite normale.

## Distribution des 79 fichiers de tests normaux

| Famille | Fichiers | Interactions/règles couvertes identifiables | Limites UX |
|---|---:|---|---|
| CRM | 5 | Identités, méthodes contact, recherche, transitions, conversion, actions/récurrences, documents | Formulaires composites et fenêtres pas tous recettés |
| Commercial/contrats | 10 | Lignes, achats, identité/import Catalogue, clauses, types, versions, gel/proofs et règles de dossier | Bilan finalisation complet, saisie/navigation et libellés |
| Projet | 17 | Structures/Sites/Pages, composition, périmètre/révisions, cibles/capacités, actions, ressources, diagnostic et gardes | Tous les panneaux/gestes/tailles de fenêtre |
| Opérations | 10 | Souscriptions/périodes, routines, packs/débits, dépassements, prises en charge, alertes/rapports/complétion | Doctrine du chemin manuel et effets d’erreur composites |
| Temps | 3 | Chrono, pauses, switch, récupération et corrections | Campagne clavier/ergonomie et tous les contextes visuels |
| Référentiels | 7 | Bibliothèque/assets, réutilisation, packages/compositions, retours et identité/provenance | Pannes SQL/fichiers composites et adaptation humaine réelle |
| Bridge | 2 | Packages/snapshots, validation, imports et comparaisons | Plugin WordPress/Workbench/publication live |
| Sauvegardes métier | 2 | Emplacements, vérification, stabilité et alertes | Double clic UI ; ne couvre pas tout scénario de restauration SQLite |
| Facturation | 1 | Interventions/packs/dépassements, statuts et rattachement facture | Sources seulement déclarées, pas connecteur/paiement |
| Dépenses | 1 | Données, montants, échéances et projections | Expérience complète et justificatifs sous panne |
| Analytics | 2 | Périodes, agrégats, rendement, indisponibilité des encaissements | UI/funnel/libellés/export réel |
| Migrations/schéma | 7 | Registre et migrations ciblées, contraintes, conservation | Pas une recette utilisateur |
| Shared | 11 | Validateurs, présentations/défauts et contrats de données/identités | Pas end-to-end |
| **Total** | **79** | **68 main +11 shared** | Aucun pourcentage UX déduit |

Exemples : [preuves/gel](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/commercial/QuoteContractPreparationService.test.ts), [même Projet](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/projects/ProjectCommercialService.test.ts), [cycles et provision](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/operations/OperationalSalesService.test.ts), [chrono](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/time/TimeService.test.ts), [réutilisation](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/referentials/ReusePreparationService.test.ts), [métriques indisponibles](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/main/analytics/AnalyticsService.test.ts).

## Les 15 bancs UI séparés

| Script | Nature inspectée | Remarque |
|---|---|---|
| check-catalog-identity-ui.cjs | React/Chromium avec IPC simulé | Identité Catalogue ; pas toute vente réelle |
| check-contract-library-ui.cjs | App/preload/IPC réels sur fixture temporaire | Sans --source pour recette maîtrisée ; option source de migration distincte |
| check-contract-terms-builder-ui.cjs | React/IPC simulé | Builder et erreurs ciblées |
| check-contribution-targets-ui.cjs | React/IPC simulé | Cibles ; services testés séparément |
| check-guided-reuse-ui.cjs | App/preload/IPC réels temporaire | Attente exactement 1–65, incompatible avec registre présent |
| check-native-commercial-ui.cjs | Recette native sur source de recette explicitement fournie | Ne pas lancer sans examiner workspace/options ; aucune recette réelle menée dans l’audit |
| check-operational-recipe-ui.cjs | Fenêtre diagnostic sur source maîtrisée | Ne valide pas toute vraie interface Devis/Projet |
| check-phase7-realignment-ui.cjs | App/preload/IPC réels temporaire | Échec exécuté sur 1–65 |
| check-project-blueprint-origins-ui.cjs | Banc ciblé d’origine blueprint | Pas certificat de tous les écrans Projet |
| check-project-composition-ui.cjs | Banc ciblé de composition | Source/renderer temporaire ; frontières à conserver |
| check-project-operational-ui.cjs | React/IPC simulé | Actions/estimation ciblées |
| check-project-provisional-ui.cjs | React/IPC simulé | Périmètre prévisionnel ciblé |
| check-prospect-ux-ui.cjs | React/IPC simulé | Alias, onglets, blocs, décisionnaire, scroll/thèmes |
| check-quote-contract-preparation-ui.cjs | React/IPC simulé | Formulaire/états/annexes ; pas tous les effets d’erreur |
| check-quote-options-ui.cjs | React/IPC simulé | Achat explicite, modifications, retrait, erreurs et gel |

Les scripts sont présents dans [scripts](../../scripts). Ils ne sont pas tous équivalents et **ne sont pas exécutés par npm test ou par la CI actuelle**. Des manipulations de fixtures peuvent simuler des états sans parcourir leur vraie création ; cela doit être indiqué dans les preuves.

## Checkpoints UI précédents, pas tests rejoués dans cet audit

Le checkpoint technique précédant l’audit rapporte : 134 contrôles App/preload/IPC contractuels, 37 Prospection, 21 préparation et 20 options, sur trois thèmes. Ils sont conservés comme preuves antérieures du périmètre testé, pas comme couverture de tous les écrans ni campagne accessibilité globale.

Les anciens 35/35 Phase 7 et 55/55 réemploi sont historiques ; les exigences 1–65 de leurs bancs empêchent de les présenter comme nouveaux résultats verts du code 1–66.

Sources : [checkpoint 09/10](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/PROJECT_STATUS.md), [banc contrat](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/scripts/check-contract-library-ui.cjs), [banc Prospection](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/scripts/check-prospect-ux-ui.cjs), [condition 1–65](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/scripts/check-phase7-realignment-ui.cjs), [condition historique](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/scripts/check-guided-reuse-ui.cjs).

## CI et environnement

[CI](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/.github/workflows/ci.yml) vise un runner self-hosted Windows X64 et exécute installation, typecheck et suite normale. Les bancs UI ne sont pas dans ses steps actuels. L’état « en attente » observé ne vaut ni succès ni échec de code ; accès au runner à vérifier.

Aucun code/migration/base utilisateur corrigé pendant l’audit. La sonde temporaire non concluante a rencontré un refus automatique de nettoyage (« blocked by policy ») ; aucune reprise destructive ou contournement n’est présenté comme réalisé. Les chemins personnels, logs et captures locaux ne sont pas publiés.

## Angles morts et contrôles humains restants

1. Abandon/reload de saisie non enregistrée et domaines de sauvegarde.
2. Pannes entre étapes de création (identité/Prospect, global/fichiers, terminaison/facturation).
3. Concordance du bilan UI avec tous les refus serveur.
4. Ciblage recherche et conservation de filtres/onglets.
5. Deux fenêtres, focus, Échap/Tab et retour du focus.
6. Tous les écrans, thèmes, densités et tailles ; overflow et contrastes.
7. Restauration différée avec changement de workspace, sur fixtures uniquement.
8. WordPress/Workbench/publication avec plugin externe et source de recette autorisée.
9. Installation/package réel ; un push source ne reconstruit pas l’ancien package.
10. Interactions secondaires du recensement non encore tracées une par une.

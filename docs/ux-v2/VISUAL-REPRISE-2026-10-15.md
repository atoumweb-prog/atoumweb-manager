# Reprise visuelle UX/UI V2 — audit et pilote réel du 15/10/2026

## Références et portée

- `origin/main` contrôlé : `c4bb744dbe58531350a61fb16ad5f8fbe90bd59d`, PR153 fusionnée le 15/10/2026. CI1803 SUCCESS sur ce SHA : https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38685281188.
- Référentiel officiel récupéré : `docs/ux-v2-reference-v1@0bb0860ee7618af92a53d8711b4a06edbbadc4d6`. DESIGN-SYSTEM, DECISIONS, 01/01B/01C/01D, 02/02A/02B, 03B/03C/03D et référentiels détaillés04–10 confrontés au code. Les propositions de 2026 non tranchées ne sont pas de nouvelles décisions.
- Branche `codex/ux-v2-visual-pilot`, base main + correctif du rail `241bf1d6` et son bilan `e71ad012`, préservés. Pilote `78bad55f4c2f62f6a76daa968cdcd995051b229b` ; correction du token primaire `5c6086d5fd96f62620800416c3ea18303a867065`.
- L'intégration technique des lots01–10 est acquise dans main ; **leur conformité visuelle globale n'est pas acquise**. La reprise ne réimplémente aucun moteur métier.
- Premier arrêt demandé par l'utilisateur : validation de la direction du pilote Prospection et de l'asset de marque avant généralisation. La recette humaine globale reste distincte.

## Matrice de conformité

États appréciés au candidat local après corrections. « Partiel » signifie écart de présentation/adoption, pas absence du moteur métier. Une visite de page ne certifie pas tous ses éditeurs. Les tests cités sans résultat nouveau détaillé ci-dessous désignent la couverture existante de la suite, pas une nouvelle recette exhaustive de chaque lot.

| Lot | Sous-lot | Exigence | Code actuel | État | Écart | Correction / suite | Test / preuve |
|---|---|---|---|---|---|---|---|
| 01 | 01A | Tokens et 14/16/18 px | display-density.css ; ui-typography-consistency.css | conforme | Alias primary absent corrigé sur candidat ; empilement CSS historique encore dense | Alias vers base ; contrôler les autres petits textes en généralisation | 105 natifs pilote + interface réelle |
| 01 | 01B | Icônes, boutons, champs et aide | OperationIcon ; AppButton ; FieldHelp | partiel | 48 icônes communes ; usage des boutons et aides non universel dans les pages | Pilote réel ; ne pas convertir les actions critiques en icônes seules | 43 ciblés ; galerie 42 ; 3×3 |
| 01 | 01C | Liste → fiche rapide → agrandir/réduire | RecordPane ; ResizableSplitView ; ClientsPage ; ProspectDetailV2 | partiel | Socle présent ; fiches métier utilisent aussi leurs dispositions spécialisées | Conserver ces moteurs ; pas de remontage gratuit ni réécriture générale | 840 interface réelle ; 192 UX-01 ; 76 CRM |
| 01 | 01D | Colonnes, largeurs, ordre et vues | DataTable ; TableControls ; SavedViewPicker | partiel | Seulement atelier avant ce pilote ; port réel Prospection désormais opérationnel | Schéma de colonnes paramétrable, mêmes contrôles, clés explicitement enregistrées | 126 atelier ; 105 pilote ; tests de schémas |
| 01 | 01E | États des formulaires et sorties | FormFeedbackIndicator ; unsaved/unsaved | partiel | Registre et gardes présents ; adoption de feedback non exhaustive | Ne pas créer un deuxième registre ; garder les confirmations natives | 192 UX-01 ; erreurs/pending/conflits |
| 01 | 01F | Préférences distinctes du métier | WorkspaceVisualPreferenceStore ; shellVisualPreferences | conforme | Deux nouvelles clés Prospect seulement ; aucune ouverture aux clés arbitraires | Liste blanche, projection sûre et exclusion identités/recherche/brouillons | Ciblés préférences + 105 natifs |
| 02 | 02A | Rail E42, favoris, 17 modules et identité | NavigationRail ; navigationRail.ts ; BrandMark | à valider humainement | Flyout corrigé ; six initiales remplacées ; symbole proposé, pas approuvé | Conserver E42 ; vérifier master de marque avant packaging | 415/470 rail antérieur ; 125 atelier ; nouveau pilote |
| 02 | 02B | En-tête discret, chrono unique, repères | WorkspaceHeader ; GlobalTimer | à valider humainement | En-tête allégé ; recherche unique sur commande, secondaires sous Options | Même nœud du chrono ; mêmes dialogues/handlers ; commandes nommées accessibles | 167 atelier en-tête ; 840 interface réelle |
| 02 | 02C | Recherche réelle et ouverture du bon ID | GlobalSearch ; searchNavigation ; useSearchTargetConfirmation | conforme | Mécanismes conservés ; pas de nouveau routeur | Ne pas modifier le service de recherche pour le visuel | Suite complète ; 17 routes réelles |
| 02 | 02D | Accueil opérationnel et widgets | home/HomeDashboard.tsx ; HomeResourceLoad | partiel | Chargement et widgets réels présents ; revue graphique approfondie reste à faire | Préserver indépendance des données, alertes et sélection des widgets | Navigation réelle ; tests Home inclus Vitest |
| 02 | 02E | Parcours, focus, brouillons | App ; unsaved ; searchNavigation | conforme | Correctifs de convergence et garde conservés | Rejouer après chaque port métier significatif | 192 UX-01 ; 76 CRM ; interface réelle |
| 03 | 03A | Inventaire CRM et identités | crm/ ; directory/ ; prospectPipelineProjection | conforme | Convergence intégrée ; il ne faut pas recommencer cet audit métier | Mise à jour limitée à adoption visuelle et écarts | Suite complète CRM |
| 03 | 03B | Trois vues et pipeline 6+1 | ProspectsPageV2 ; projectPipeline | à valider humainement | Tableau réel configurable ; cartes/températures sobres ; mêmes populations | Valider direction de la liste et du pipeline avant autres modules | 105 pilote ; 76 CRM ; aucune conversion au tri |
| 03 | 03C | Fiche rapide, sections, besoins et devis | ProspectDetailV2 ; ProspectWorkAccordion ; panneaux existants | partiel | Fiches neutralisées visuellement ; organisation commerciale/référence conservée | Accordéons autorisés ; pas de sept onglets inventés. Évaluer encore parcours et maintien des états | 36 captures après ; 192 UX-01 ; 76 CRM |
| 03 | 03D | Huit onglets Client et navigation liée | clientPresentation.ts ; ClientsPage.tsx | partiel | Huit onglets réels et navigation clavier constatés ; tableau encore natif | Harmonisation après validation du pilote ; ne pas recréer les onglets | Tests client inclus suite ; visite réelle |
| 03 | 03E | Annuaire commun, contacts et provenance | DirectoryPage ; CrmService | partiel | Deux tableaux/fiches fonctionnels ; pas de tableau commun configurable | Port ultérieur des contrôles, identité inchangée. Archivage des identités Annuaire toujours non exposé | Suite CRM/identités ; visite réelle |
| 04 | 04A | Inventaire du Catalogue réel | CatalogService ; CatalogPage | conforme | Historique déjà consolidé ; les anciens constats ne valent plus état actuel | Ne pas rejouer les imports ou migrations | Suite Catalogue et migrations |
| 04 | 04B | Navigation, catégories et recherche | CatalogPage ; CatalogCategoryService | partiel | Catégories administrables réellement présentes ; trois tables natives | Réutiliser la navigation métier ; proposer colonnes adaptées après pilote | Tests catégories ; visite réelle Catalogue |
| 04 | 04C | Versions, tarifs, publication | CatalogPage ; CatalogService | partiel | Éditeurs et versions effectifs ; contrôles visuels encore hétérogènes | Regrouper actions et icônes sans changer publication/prix vendus | Tests versions/tarifs dans suite complète |
| 04 | 04D | Associations et recommandations | CatalogRecommendationsService ; panneaux Catalogue | partiel | Services et relations présents ; ne pas annoncer leur absence depuis ancien audit | Harmoniser inclus/option/recommandation sans achat implicite | Tests recommandations existants |
| 04 | 04E | Aides commerciales versionnées | catalogSalesGuidance ; CatalogPage ; ProspectNeedsPanel | partiel | Contenus métier et aides présents ; présentation à alléger progressivement | Réutiliser FieldHelp sans masquer des conditions commerciales | CatalogSalesGuidance04E + suite |
| 04 | 04F | Recette et intégration | Rapports convergence ; CatalogPage | à valider humainement | Intégration technique ne vaut pas acceptation graphique | Nouvelle recette ciblée au port de la présentation | CI1803 historique ; pas de nouvelle CI |
| 05 | 05A | Inventaire contrats/CGV | ContractLibraryPage ; ContractTypeService | conforme | Édition spécialisée existante ; ne pas imposer un tableau générique | Conserver les moteurs et versions | Suite contractuelle |
| 05 | 05B | Organisation des rubriques | ContractLibraryPage ; contract-library.css | partiel | Organisation et filtres réels ; iconographie non généralisée | Barres d’outils et aides à revoir après pilote | Tests clauses/rubriques |
| 05 | 05C | Édition et limites métier | Éditeurs contractuels existants | partiel | Réserves fonctionnelles déjà documentées ; pas résolues par une CSS | Ne pas modifier les règles ni prétendre conformité juridique | Réserves de convergence maintenues |
| 05 | 05D | Assemblage versionné et prévisualisation | contractTerms ; ContractTypeService | partiel | Moteur présent ; mise en page spécialisée à conserver | Icônes non critiques et hiérarchie des panneaux uniquement | Tests assemblage/snapshots |
| 05 | 05E | Liens Catalogue/Devis et publication | CatalogService ; ContractReadPanel | partiel | Rattachements effectifs ; aucune publication implicite ajoutée | Préserver libellés visibles pour publier/finaliser | Tests contrats/Devis |
| 05 | 05F | Recette contrats | Bibliothèque contractuelle + rapports | à valider humainement | Technique consolidée ; validation légale et graphique distinctes | Recette dédiée après harmonisation autorisée | Pas de certification juridique |
| 06 | 06A | Inventaire états du devis | QuoteService ; QuotesPage | conforme | États/versions et conservation métier présents | Aucun recalcul ni relabellisation métier | Tests devis |
| 06 | 06B | Liste, assistant et fiche | QuotesPage ; QuoteLineEditor | partiel | Table natif et fiche spécialisée ; traitements boutons dispersés | Port visuel progressif et contexte conservé | 840 interface réelle ; 192 UX-01 |
| 06 | 06C | Composition Catalogue | Panneaux Catalogue/options du devis | partiel | Choix volontaires et snapshots existants | Clarifier visuellement inclus/disponible/acheté | Tests options et snapshots |
| 06 | 06D | Contrats et prévisualisation | ContractReadPanel ; QuoteContractPreparation | partiel | Fonctions présentes ; forte densité de texte dans certains panneaux | Aides contextuelles sans cacher alertes ou obligations | Tests versions contractuelles + UX-01 |
| 06 | 06E | Abby, révisions et projet | QuoteAbbyPanel ; parcours Projet prévisionnel | partiel | Garde dirty/pending et provenance conservées | Copier reste bloqué si saisie non enregistrée | Tests Abby/UX-01 existants |
| 06 | 06F | Recette et intégration | Convergence 06 + tests métier | à valider humainement | Technique intégrée ; ergonomie détaillée encore à revoir | Ne pas confondre CI et acceptation humaine | CI1803 de main, distincte du pilote |
| 07 | 07A | Inventaire des capacités | ProjectsPage ; ProjectService | conforme | Lot technique repris, ne pas le recommencer | Maintenir l’historique des références | Tests Projets de la suite |
| 07 | 07B | Fiche Projet et production | ProjectsPage ; panneaux spécialisés | partiel | Arborescences et panneaux réels, styles historiques coexistants | Harmoniser les outils sans imposer le modèle CRM | Visite réelle Projets ; tests métier |
| 07 | 07C | Blueprints et dossier commercial | ProjectCommercialSyncService ; modèles | partiel | Snapshots et synchronisations conservés | Mieux hiérarchiser les actions après pilote | Tests snapshots/conflits |
| 07 | 07D | Sites, Pages et composition | ProjectsPage ; ateliers de composition | partiel | Éditeurs spécialisés nécessaires ; ne pas substituer une table générique | Icônes/outils et panneaux à revoir séparément | Tests Sites/Pages/composition |
| 07 | 07E | Bibliothèque et réemploi | AtoumWebLibraryPage ; services de réemploi | partiel | Fonctions et provenances réelles ; beaucoup de JSX dédié | Aides, actions et hiérarchie à alléger sans perdre les textes techniques | Tests réemploi/ressources |
| 07 | 07F | Bridge et publication | BridgeSitesPage ; workbench | partiel | Parcours spécialisé, aucune publication déclenchée par ce pilote | Revue graphique future, pas de déploiement Bridge | Tests locaux existants seulement |
| 07 | 07G / 07P | Recette et Projet prévisionnel | Projet lié au devis courant | à valider humainement | Fonctionnel intégré ; réserves WordPress/externe non certifiées | Conserver même Projet et historique, pas de génération depuis un besoin seul | Tests projet provisoire + suite |
| 08 | 08A | Inventaire opérations/temps | OperationsPage ; TimePage | conforme | Moteurs intégrés ; ne pas rouvrir les arbitrages métier par le visuel | Conserver la séparation opérationnel/facturation | Suite opérations |
| 08 | 08B | Demandes et interventions | OperationsPage ; InterventionCompletionService | partiel | Tables natives et fiches spécialisées ; transaction conservée | Harmoniser actions répétitives, statut toujours explicite | Tests atomiques/rollbacks |
| 08 | 08C | Maintenance et cycles | MaintenanceService ; panneaux Maintenance | partiel | Périodes opérationnelles existantes | Aucune modification de cycles historiques pour densifier | Tests maintenance |
| 08 | 08D | Packs et mouvements | Panneaux packs ; mouvements existants | partiel | Solde et provenance conservés ; vues à harmoniser | Ne pas activer contrepassation/réouverture au titre du graphisme | Tests idempotence/doubles mouvements |
| 08 | 08E | Chrono, temps et rapports | GlobalTimer ; TimePage | partiel | En-tête réel allégé, même instance et dialogues ; table temps encore native | Ne pas recréer le chrono ; améliorer table ultérieurement | 840 interface réelle ; tests TimeService |
| 08 | 08F | Recette opérations | Rapports convergence08 | à valider humainement | Les temps réels et la recette quotidienne ne sont pas modifiés | Respecter les réserves de convergence | Tests métier, pas de données réelles |
| 09 | 09A | Inventaire finances/documents | BillingPage ; ExpensesPage ; DocumentsPage | conforme | Liens et protections repris dans main | Ne pas réinterpréter Abby ou l’encaissement | Suite facturation/documents |
| 09 | 09B | Facturation Abby | BillingPage | partiel | Tableau natif, filtres et états existants | Port visuel après pilote ; actions critiques gardent leur texte | Tests facturation conservés |
| 09 | 09C | Dépenses et échéances | ExpensesPage | partiel | Table native et pièces justificatives existantes | Harmoniser filtres/outils et lisibilité | Tests Dépenses |
| 09 | 09D | Documents et archives | DocumentsPage ; ClientDocumentService | partiel | Conservation de pièces, SHA et archives réelle | Présentation et aperçu à moderniser sans changer les protections | Tests documents et conservation |
| 09 | 09E | Word/PDF et retour contrôlé | ContractLibraryPage ; revue Word | partiel | Éditeur et garde existants ; pas de nouveau texte juridique | Revue graphique spécialisée, aucun DOCX signé altéré | Tests Word/drafts existants |
| 09 | 09F | Recette gestion/documents | Rapports09 | à valider humainement | Réserves Word/installation déjà explicites | Aucune certification Office/MSI implicite | Convergence historique + suite |
| 10 | 10A | Inventaire indicateurs | StatisticsPage ; AnalyticsService | conforme | Indicateurs et limites de sources déjà documentés | Pas de nouvelle formule de gestion | Suite statistiques |
| 10 | 10B | KPI, graphiques et navigation | statistics/StatisticsPage ; analytics/StatisticsPage | partiel | Calculs/retours conservés ; graphiques à revoir visuellement | Harmoniser cartes et filtres après pilote | Tests cohortes/filtres exacts |
| 10 | 10C | Sauvegardes et restauration | BusinessBackupsPage ; restore.ts | partiel | Moteurs sûrs conservés ; interface non refondue par le pilote | Actions de restauration toujours explicites | 35 restaurations + intégrité/FK |
| 10 | 10D | Réglages et préférences | SettingsPage dans App ; WorkspaceVisualPreferenceStore | partiel | Organisation existante et recherche ; espace vide signalé non traité hors pilote | Réorganisation des catégories seulement après direction approuvée | Tests settings + visite réelle |
| 10 | 10E | Recette finale | Matrices de convergence + présente revue | à valider humainement | Technique ne signifie pas achèvement graphique des lots01–10 | Poursuivre seulement après approbation pilote ; garder réserves externes | Pas de certification globale prématurée |

## Adoption réelle : inventaire reproductible

Commande : `node scripts/audit-visual-adoption.cjs`. Analyse directe du fichier, non transitive. Zéro `AppButton` dans une page ne prouve pas absence de bouton accessible ni de composant enfant ; zéro garde directe ne signifie pas absence du registre global. Ces chiffres identifient des ports restant à inspecter, pas des fonctionnalités manquantes présumées.

| Fichier renderer | Tables natives | AppButton directs | Tableau configurable | FieldHelp directs | Gardes directes |
|---|---:|---:|---:|---:|---:|
| `src/renderer/App.tsx` | 0 | 0 | 0 | 1 | 4 |
| `src/renderer/home/HomeDashboard.tsx` | 0 | 4 | 0 | 0 | 0 |
| `src/renderer/crm/ProspectsPageV2.tsx` | 0 | 2 | 1 | 6 | 12 |
| `src/renderer/crm/ClientsPage.tsx` | 1 | 0 | 0 | 7 | 11 |
| `src/renderer/directory/DirectoryPage.tsx` | 2 | 0 | 0 | 0 | 8 |
| `src/renderer/commercial/CatalogPage.tsx` | 3 | 0 | 0 | 24 | 12 |
| `src/renderer/commercial/ContractLibraryPage.tsx` | 0 | 0 | 0 | 0 | 7 |
| `src/renderer/commercial/QuotesPage.tsx` | 1 | 0 | 0 | 0 | 14 |
| `src/renderer/projects/ProjectsPage.tsx` | 1 | 0 | 0 | 0 | 8 |
| `src/renderer/referentials/AtoumWebLibraryPage.tsx` | 0 | 0 | 0 | 0 | 2 |
| `src/renderer/operations/OperationsPage.tsx` | 2 | 0 | 0 | 0 | 17 |
| `src/renderer/time/TimePage.tsx` | 1 | 0 | 0 | 0 | 0 |
| `src/renderer/billing/BillingPage.tsx` | 1 | 0 | 0 | 0 | 2 |
| `src/renderer/expenses/ExpensesPage.tsx` | 1 | 0 | 0 | 0 | 2 |
| `src/renderer/documents/DocumentsPage.tsx` | 1 | 0 | 0 | 0 | 2 |
| `src/renderer/statistics/StatisticsPage.tsx` | 2 | 0 | 0 | 0 | 0 |
| `src/renderer/bridge/BridgeSitesPage.tsx` | 0 | 0 | 0 | 0 | 0 |
| `src/renderer/backups/BusinessBackupsPage.tsx` | 0 | 0 | 0 | 0 | 3 |

## Registre priorisé

| ID | Priorité | Origine | Constat avant | État candidat / suite |
|---|---|---|---|---|
| V01 | P0 rendu | 02A | Flyout derrière l'en-tête, titre et premières commandes occultés | Corrigé, géométrie et hit-testing permanents |
| V02 | P1 | 01B/02A | Six modules avec initiales provisoires | Corrigé : home/users/file-check/layers/contact/settings |
| V03 | P1 | Identité | AWM en guise de logo, aucune ressource Windows configurée | Symbole candidat visible, SVG/PNG/ICO préparés ; approbation graphique et activation packaging ouvertes |
| V04 | P1 | 01A | Token partagé primary non défini, tailles de texte de secours | Alias vers ui-font-base ; preuve réelle14/16/18 |
| V05 | P1 | 01D/03B | Table configurable uniquement à l'atelier | Port réel Prospection, préférences dans le magasin workspace existant |
| V06 | P1 | 02B | En-tête développé haut, recherche et titres répétés | Commandes iconifiées nommées, secondaires sous Options, même chrono/recherche montés |
| V07 | P1 | 03B/03C | Aplats de température couvrant lignes et fiches | Point/trait discret, surfaces du thème, texte du statut conservé |
| V08 | P1 | 01B/03 | Actualiser/Agrandir/Fermer/détacher et onglets hétérogènes | Pilote raccordé à OperationIcon ; textes critiques préservés |
| V09 | P2 | 03C | Fiche de travail et référence avec accordéons spécialisés | Conservation ; ergonomie de navigation à juger sur les captures, pas sept onglets imposés |
| V10 | P2 | 03D/03E | Huit onglets Client déjà présents, listes encore spécifiques | Ne pas recréer ; port visuel après validation pilote ; archivage Annuaire non exposé |
| V11 | P2 | 04–10 | Beaucoup de JSX/tableaux et styles historiques malgré socle disponible | Généralisation suspendue jusqu'à accord, adaptée à chaque workflow |
| V12 | P2 | 10D | Catégories Réglages et grands espaces encore à améliorer | Constat conservé, aucun traitement arbitraire hors pilote |

## Corrections effectives et invariants

Le port réutilise DataTable, TableColumnManager, SavedViewPicker et leurs normalisations. Les fonctions de préférences acceptent désormais un schéma explicite de colonnes ; les arguments par défaut de l'atelier restent inchangés. Deux clés réelles de Prospection sont ajoutées à la liste blanche ; aucune clé arbitraire ne devient accessible. Les préférences excluent IDs, recherche, notes et brouillons ; seuls colonnes, largeurs, ordre, tri et noms de vues sont persistés. Les filtres métier existants ne sont ni renommés ni sauvegardés comme données.

La sélection reste détenue par ProspectsPageV2, indépendamment des lignes filtrées et triées. Une ligne masquée ne démonte pas sa fiche. Les handlers de transition, contacts, qualification, besoins et devis sont inchangés. Pas de nouvelle garde de sortie : UX-01 conserve Rester par défaut et l'abandon explicite.

Aucun fichier `src/main` ou `src/preload` modifié ; migrations1–70 inchangées. Aucun workspace réel, contrat, temps, document, exécutable ou lanceur utilisateur modifié. Les tests utilisent des identités synthétiques, profils et SQLite temporaires ; SQL de mise en état de fixture clairement distingué d'une preuve de transition métier.

## Catalogue d'icônes

48 SVG partagent le même viewport24, trait1.8, bouts et joints arrondis, couleur courante et rôle décoratif. Le nom accessible est porté par le bouton ; les actions importantes gardent leur texte. Les 36 icônes antérieures sont conservées ; ajout de home, users, file-check, layers, contact, settings, search, filter, menu, plus, arrow-left, columns.

| Destination | Icône |
|---|---|
| Accueil | `home` |
| Prospects | `user` |
| Clients | `users` |
| Offres & Tarifs | `package` |
| Devis | `file-text` |
| Projets | `folder` |
| Interventions & Maintenance | `wrench` |
| Gestion des temps | `clock` |
| Facturation | `receipt` |
| Dépenses | `wallet` |
| Documents & Contrats | `file-check` |
| Bibliothèque AtoumWeb | `layers` |
| Sites | `server` |
| Sauvegardes | `database` |
| Annuaire | `contact` |
| Statistiques | `chart` |
| Réglages | `settings` |

Groupes : Commercial/users ; Production/folder ; Gestion/receipt ; Ressources/layers ; Pilotage/settings. Les commandes de présentation utilisent menu/search/expand/collapse/settings ; rafraîchissement/fermeture/détachement utilisent refresh/close/external-link. Aucun remplacement systématique des actions critiques par une icône seule.

## Identité et packaging

Voir `assets/brand/README.md` et `references/provenance.json`. Trois originaux conservés octet pour octet. Quatre SVG proposés et PNG transparents, ICO7 résolutions16–256. Le principal jaune/blanc et l'horizontal jaune/noir restent des interprétations, avec typographie système approximative. **Ils ne sont pas des masters approuvés.** Le symbole est une proposition visible dans le pilote. Aucun remplacement de l'icône Windows installée ni de la configuration de packaging avant cet accord.

Fenêtres/EXE/Squirrel/raccourcis : absence d'icône explicite constatée dans main.ts et forge.config.ts. Activation du même asset approuvé, embarquement, contrôles d'EXE/Setup et raccourcis prévus après validation. Build réussi ne vaudra pas certification d'installation MSI.

## Captures et arbitrage demandé

36 captures avant, puis36 après, mêmes fixtures et neuf combinaisons thème/densité : liste, fiche rapide, fiche complète, pipeline6+1. Synchronisation du compositeur vérifiée par marqueur, pas une temporisation supposée suffisante. Avant : copie de travail e71ad012 avec seulement le banc de capture. Après final : code5c6086d5. Les captures des itérations intermédiaires ne sont pas les preuves finales.

Comparateur local : `captures/visual-pilot-review/index.html` ; avant `captures/visual-pilot-before/`, après `captures/visual-pilot-typography-final/`. Les dossiers de captures sont ignorés par Git ; pas de données utilisateur dans ces images.

**Arbitrages ouverts :** approuver ou ajuster le pilote (en-tête, surfaces, outils, tableau, fiches) ; confirmer la fidélité du symbole ou fournir un master vectoriel ; valider la typographie du logo avant son usage définitif. Aucun de ces accords n'est déduit des tests.

## Validation locale

Les résultats ci-dessous sont locaux sous Windows, distincts de toute CI hébergée. Les fichiers applicatifs TypeScript et assets du code78bad55f sont identiques à5c6086d5 ; ce dernier ajoute seulement l’alias CSS primaire, revalidé en Electron réel. Aucune CI n'a été déclenchée pour le pilote. CI1803 ne teste que main, pas cette branche. Aucun merge ni push de cette reprise n'est réalisé.

## Suite après accord humain

1. Valider ce pilote et le master de marque ; ajuster localement si demandé.
2. Généraliser d'abord Clients et Annuaire, puis Catalogue et Devis, avec schémas de colonnes propres et sans changer les services.
3. Harmoniser les éditeurs spécialisés05/07, puis opérations/temps08, gestion/documents09 et pilotage/réglages10 ; conserver les parcours spécialisés.
4. Activer l'asset approuvé dans le packaging, vérifier l'application empaquetée et les raccourcis sur environnement isolé.
5. Regrouper contrôles complets et CI candidate autorisée au point d'intégration ; fusion seulement avec accord explicite.

**Verdict : pilote technique prêt à la revue graphique ; refonte globale non déclarée terminée.**


## Bilan de recette locale du candidat

| Commande / contrôle | Résultat réel | Référence |
|---|---|---|
| Typecheck | OK | Sources TS du candidat ; aucun TS changé par5c6086d5 |
| Vitest final | 1 461/1 461,164 fichiers,103,90 s ; aucun échec ni erreur RPC rapportée | `outputs-pilot-5c6086-vitest.log` |
| Restauration et binaire |35/35 restaurations et6/6 binaires inclus dans Vitest ; pas de restauration réelle | `restore.test.ts`, `restoreBinaryEquality.test.ts` |
| Pilote réel + captures finales |105 assertions,36 captures,0 échec |5c6086d5, `outputs-pilot-typography-final.log` |
| Toutes destinations réelles |840 assertions,17 routes,54 visites thème/densité,5 étroites,10 zoom ;0 débordement/erreur console |5c6086d5, `outputs-pilot-5c6086-real.log` |
| Rail atelier initial/redémarrage |117+8 assertions |5c6086d5 propre, `outputs-pilot-5c6086-rail.log` |
| Tableau atelier120 dossiers |126 assertions ;9 captures | Candidat + confirmation après token, `outputs-pilot-5c6086-tables.log` |
| Galerie commune48 icônes |42 assertions,9 configurations et clavier natif | `outputs-pilot-5c6086-icons.log` |
| En-tête atelier initial/redémarrage |158+9 assertions | Copie de travail du code78bad55f ; `outputs-pilot-header.log` |
| CRM03B/03C réel |76 assertions ; conflits interfenêtres injectés et refusés | Code78bad55f, `outputs-pilot-crm.log` |
| UX-01 Prospection/Devis/natif |192 assertions ;0 échec ; intégrité/FK et registre des migrations exacts | Code78bad55f, `outputs-pilot-ux01-final.log` |
| Assets et ICO |3 tests permanents,7 résolutions vérifiées, provenance vérifiée | Inclus dans suite finale |

Les logs IPC de conflits provoqués dans les recettes CRM/UX-01 sont attendus : chaque refus et la conservation du brouillon sont vérifiés. Ils ne doivent pas être présentés comme erreurs RPC ou comme succès anticipés.

Échecs rencontrés et réellement corrigés pendant la préparation :

- Nouveau port de table initialement refusé par la liste blanche du shell : ajout limité aux deux clés enregistrées, test d’un suffixe arbitraire toujours refusé.
- Ancien sélecteur UX-01 cherchait le caractère décoratif «+» dans le texte : recherche du libellé réel «Ajouter une entreprise», toutes les192 assertions métier conservées.
- Nouveau contrôle de police Confort en échec : token primaire non défini, alias vers la densité réelle ; aucune assertion de taille affaiblie.
- Certaines fiches restaient colorées malgré les nouveaux styles : neutralisation ciblée des variables/couches historiques avec `!important`, sans modifier la donnée température.

Les recettes qui précèdent l’alias CSS sont distinguées de celles rejouées sur5c6086d5. Les journaux et captures sont des preuves locales ignorées par Git. Les copies de travail intermédiaires ne sont pas présentées comme CI réussies.

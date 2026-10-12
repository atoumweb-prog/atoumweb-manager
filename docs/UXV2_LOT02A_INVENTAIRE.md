# 02A.1 — Inventaire du rail existant

12/10/2026. Départ #91 **765f66dbce2b08d2624e496c7dd8a5555edc8e20**, checkout propre, revue ChatGPT de#91 lue. Référentiel #82 `LOT-02A-RAIL-NAVIGATION.md`, E42 **optionA déjà validée**. Branches86–91 conservées. Aucun code de navigation métier changé par cet inventaire.

## Destinations et source de vérité

`App.tsx:NAV_ITEMS` conserve17clés. La présentation peut grouper/épingler ces références ; elle ne redéfinit pas les routes.

| Groupe | Clé réelle | Libellé UI | Pictogramme de travail / réserve |
|---|---|---|---|
| Accueil | Accueil | Accueil | emplacementAC ; home non présent dansOperationIcon |
| Commercial | Prospects | Prospection | user existant |
| Commercial | Clients | Clients | emplacementCL ; users à faire approuver |
| Commercial | Offres & Tarifs | Offres & Tarifs | package existant |
| Commercial | Devis | Devis | file-text existant |
| Production | Projets | Projets | folder existant |
| Production | Interventions & Maintenance | Interventions & Maintenance | wrench existant |
| Production | Gestion des temps | Gestion des temps | clock existant |
| Gestion | Facturation | Facturation | receipt existant |
| Gestion | Dépenses | Dépenses | wallet existant |
| Gestion | Documents & Contrats | Documents & Contrats | emplacementDC ; file-check non approuvé |
| Ressources | Bibliothèque AtoumWeb | Bibliothèque AtoumWeb | emplacementBA ; layers non approuvé |
| Ressources | Sites | Sites | server existant, clé inchangée |
| Ressources | Sauvegardes | Sauvegardes | database existant |
| Ressources | Annuaire | Annuaire | emplacementAN ; contact non approuvé |
| Pilotage | Statistiques | Statistiques | chart existant |
| Pilotage | Réglages | Réglages | emplacementRE ; settings non approuvé |

Les icônes existantes sont réutilisées viaOperationIcon, sans second catalogueSVG ; tous les emplacements nouveaux et le futur logo triangulaire restent explicitement provisoires. Aucun atlas ou logo final adopté.

## Navigation, événements et gardes

| Source / événement | Traitement actuel / vigilance |
|---|---|
| Sidebar, `navigate` | `requestPage` avant`navigateDirect`, no-op surmodule déjàactif ; remet àzéro certaines cibles de module lors d'un choix volontaire. Garder ces différences avecouverture ciblée. |
| `atoumweb:open-page` | Accueil, Clients, opérations, statistiques émettent une clé de page ; App soumet au garde avantchangeractivePage. |
| `atoumweb:navigate` | DossierPanel.openEntity, ProspectQuote/PreQuoteReview, ProjectReusePreparationPanel, statistiques émettentSearchResult(type/id/title) ; App garde puisouvre bonnefiche. Ce routage demeure horsréécriture02A (02C). |
| `atoumweb:open-prospects-view` | Accueil/statistiques ouvrentdirectory/pipeline/history avecfilter ; requestPage tient compte deschangements de contexte pourgarderlesbrouillons. |
| `atoumweb:open-contract-library` / `open-catalog-item` | CatalogContractPanel, ContractReadPanel, ContractLibraryPage : gardes deApp puisciblescontractType/catalog. Aucune publication parnavigation. |
| `atoumweb:open-library-item` | BridgeSitesPage → App/library cible, garde avantchangement. |
| `atoumweb:open-intervention-conclusion` | GlobalTimer → App/opérations cible intervention ; nepasremplacer cechemin parunmodule sansid. |
| `atoumweb:sidebar-collapse` | ProjectsPage émetBoolean(detail), puisfalse àsortie/démontage. App actuelappliqueétatlocal nonpersisté. Danspilote : demande temporairetrue, libérationfalse, sansécritureduchoixdurable. |
| Recherche globale | GlobalSearch: flècheshaut/bas naviguentrésultats, Enterchoisit, Escapeferme ; pasderaccourciglobalCtrl/Meta dansApp/GlobalSearchaupointage. Préserver, n'en inventeraucun en02A. |
| Autres raccourcis | Escapeferme desdétails via leursgardes ; flèchesredimensionnent despanels. Le flyout doit arrêter sonEscape pournepasfermer unéditeur dessous. |

`requestPage`/`requestUnsavedExit` protègeavantdémonter ; groupesDevis/Prospection etbrouillons restentpropriétaires de leursservices. Favoris, groupeouvert etmode de rail sontdespréférencesvisuelles, sans garde quandaucunéditeur n'estdétruit. Aucun nouveau registre.

## CSS et chrono

- `styles.css` : app-shell258px, variantes220px ; sidebar-collapsed0px, opacity0/pointer-eventsnone. `workflow.css` réduitencoreà190/135px ; `display-density`/typography/consistency fixent14/16/18. Ne pas appliquerune modificationglobale aux17modules dansl'atelier.
- Le pilote reçoit unCSSstrictement préfixé02A etunrail de largeurpositive. Flyout bornéàla fenêtre etscrollvertical ; mesurespetitesfenêtres/zoom àproduire.
- `GlobalTimer` est montéune seulefois parApp, horscontenu desmodules, avecétat/timeIPC etévénementconclusion. Aucune modification deGlobalTimer/App prévue ; atelierutilise unchronométrageTEST indépendant, explicitement simulé, pourcontrôlerl'absence deremount entrepages. Cela necertifie pasun nouveauchrono métier.

## Contrat de l'atelier autorisé

Composant de railprésentation + modèle de17références, préférencenavigation parworkspace via01F, formulaire fictifdirty/pending avecUX-01. Événementsopen-page etsidebar-collapse exercés sansservicesclients. Aucun traitement desévénementsSearchResultouverturesciblées réinventé ; comparaisonparnon-régression duvrai renderer surTEMP. ModèleE42, focus/keyboard/favoris/reset confirmés, neufconfigurations etcaptures. Pas02B/03, paslogo définitif, pasmigration deApp.tsx.

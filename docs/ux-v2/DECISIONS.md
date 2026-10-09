# Décisions UX/UI V2 — registre initial

Statut : **DÉCIDÉ** sauf mention explicite. Ces exigences sont des cibles ; l'implémentation actuelle doit être vérifiée.

## Structure et interaction
| ID | Décision vérifiable |
|---|---|
| UX2-GEN-001 | Conserver tous les modules, sous-écrans et comportements métier actifs ; ne rien supprimer sans validation humaine explicite. |
| UX2-NAV-001 | Navigation principale compacte par icônes, menus contextuels, groupes et favoris personnalisables ; accès maintenu aux 17 entrées existantes. |
| UX2-NAV-002 | Un clic sur un dossier ouvre d'abord une fiche rapide ; commande **Agrandir** pour la fiche complète, contexte et onglet conservés. |
| UX2-LAY-001 | Disposition par défaut **liste + détail**, adaptée par module ; éditeurs techniques et CGV autorisés à utiliser une mise en page spécialisée. |
| UX2-LAY-002 | Persister automatiquement dispositions, colonnes, ordres, largeur/visibilité des panneaux, filtres/vues définis ; préférences par écran avec retour aux défauts. |
| UX2-LAY-003 | Les préférences d'interface n'enregistrent jamais un formulaire métier. |
| UX2-HELP-001 | Aide `?` courte, détaillée au clic et, si activée, au survol prolongé ; réglable, accessible au clavier. |
| UX2-VIS-001 | Échelle typographique par densité : cible de texte principal **Compact 14 px**, Confort 16 px, Confort+ 18 px ; conserver trois thèmes et trois densités et vérifier lisibilité/contrastes au rendu. |
| UX2-VIS-002 | Identité AtoumWeb, piste visuelle de triangles imbriqués ; logo final à valider séparément. |
| UX2-VIS-003 | **Arbitrage E01 validé le 09/10/2026** : le code Compact est actuellement à 15 px et doit viser **14 px** en V2, sans baisser les modes Confort (16 px) ni Confort+ (18 px). Texte secondaire et petit texte au minimum 14 px, hauteurs de contrôles 36/42/48 px conservées à ce stade ; recette visuelle requise avant livraison. |
| UX2-DATA-001 | Tout éditeur métier suit les modifications non sauvées ; signal discret et protection de toute sortie destructive. |
| UX2-DATA-002 | Lorsque l'éditeur sait enregistrer : **Enregistrer et quitter**, **Continuer la modification** (choix sûr initial), **Quitter sans enregistrer** ; quitter seulement après succès vérifié. |
| UX2-DATA-003 | Les validations métier, publications, clôtures et destructions demandent leurs contrôles spécifiques ; enregistrer un brouillon ne publie rien. |
| UX2-DATA-004 | Conflits concurrents, lectures asynchrones tardives, rafraîchissements parent/enfant et fenêtres détachées ne doivent pas effacer silencieusement les brouillons. |
| UX2-DATA-005 | La garde commune s'appuie sur la sécurisation UX-01 existante une fois intégrée ; aucun second registre concurrent. |

## Commercial et contrats
| ID | Décision vérifiable |
|---|---|
| UX2-CAT-001 | Catalogue commun et administrable : offres, formules, services, catégories, prix, textes, liens métiers, aides et historique. |
| UX2-CAT-002 | Afficher d'abord les offres principales (site vitrine, e-commerce, mariage, maintenance), puis les services complémentaires par catégorie et ordre alphabétique FR. |
| UX2-CAT-003 | Une seule catégorie principale par prestation ; mots-clés de recherche et associations multiples avec les offres autorisées. |
| UX2-CAT-004 | La recherche privilégie noms, besoins, descriptions, bénéfices ; codes Abby secondaires mais toujours recherchables par référence exacte. |
| UX2-CAT-005 | Même catalogue en Prospection pour identifier les besoins et en Devis pour ajouter les lignes vendues ; affichage adapté au contexte. |
| UX2-CAT-006 | Première ligne/offre du devis priorise suggestions cohérentes ; accès permanent au catalogue complet. |
| UX2-CAT-007 | Besoin identifié ≠ suggestion ≠ service acheté ; aucun achat, calcul de prix, clause ou blueprint implicite. |
| UX2-CAT-008 | Administration : créer, modifier, dupliquer, publier, désactiver, archiver, restaurer ; suppression uniquement sans dépendance historique protégée. |
| UX2-CAT-009 | Nouveaux prix/conditions sous nouvelle version, sans réécriture des devis finalisés ou acceptés. |
| UX2-CAT-010 | Fiches d'aide à la vente éditables : utilité, bénéfices, quand proposer, questions, arguments, vigilances, inclusions/exclusions. |
| UX2-CON-001 | Chaque offre/formule/service dispose d'un onglet **Contrat & CGV** : consulter, créer, associer, modifier les clauses depuis la fiche. |
| UX2-CON-002 | Source contractuelle unique : bibliothèque de types, CGV communes, clauses spécifiques et versions ; la fiche commerciale gère des références, pas des copies divergentes. |
| UX2-CON-003 | Avant publication vendable, vérifier le périmètre contractuel requis, les inclusions/exclusions et la compatibilité des références ; validation juridique humaine distincte. |
| UX2-CON-004 | Assemblage des seules prestations achetées : socle commun et modules spécifiques classés **par rubriques sémantiques**, non simplement concaténés par produit. |
| UX2-CON-005 | Classement configurable, conditions d'application, gestion des doublons exacts, signalement des collisions/contradictions, numérotation et renvois stables. |
| UX2-CON-006 | Texte client clair, homogène, sans codes Abby/IDs internes ni placeholders ; prévisualisation du document final et simulation avant publication du service. |
| UX2-CON-007 | Builder : aperçu sommaire/document/alertes ; copie propre pour Abby ; PDF et Word, réimport contrôlé et versionné lorsque le document est éditable. |
| UX2-CON-008 | Contrat intégré au devis ; preuve d'acceptation gérée dans le parcours officiel Abby. Snapshots et documents acceptés immuables. |

## Production, finances, intégrations
| ID | Décision vérifiable |
|---|---|
| UX2-PRO-001 | Projet prévisionnel avant acceptation, même projet réconcilié et figé selon la décision commerciale, sans doublon ni démarrage de production implicite. |
| UX2-PRO-002 | Navigation Projet couvre commercial, prérequis, accès, sites/pages, compositions, tâches, ressources, temps, bibliothèque et opérations. |
| UX2-PRO-003 | **Avant acceptation** : blueprint prévisionnel sur lignes du devis courant, non considérées achetées ; **après signature Abby** : périmètre figé sur prestations effectivement vendues. Application volontaire, idempotente et sans effacement silencieux ; choix de régénération sécurisé explicite. |
| UX2-BRG-001 | Bridge prévu dans Projet et dans Sites autonome ; boutons actifs seulement si capacité réelle vérifiée. Workbench et production séparés ; publication contrôlée humaine. |
| UX2-TIM-001 | Un seul chrono global, associé à la bonne activité et récupérable après navigation. |
| UX2-MNT-001 | Pour nouveaux abonnements vendus : périodes date à date depuis démarrage réel, indépendantes de la facturation ; quotas sans report ; historique préservé. |
| UX2-BIL-001 | Manager prépare/suit ; Abby émet le devis/facture officiels ; PDFs/références importés, pas de comptabilité fictive. |
| UX2-DOC-001 | Document éditable : export Word, réimport comparé, validation explicite, version ; document figé/preuve jamais écrasé. |
| UX2-LIB-001 | Réutilisation technique par copie indépendante, adaptation humaine et provenance ; aucun changement silencieux de la source. |
| UX2-SAF-001 | Sauvegardes métier ≠ véritable sauvegarde/restauration workspace ; protections des données et des fichiers. |

## Arbitrages encore ouverts (pas des décisions)
| Sujet | Point à trancher / vérifier |
|---|---|
| Design tokens exacts | **E01 tranché** (Compact cible 14 px, Confort 16 px, Confort+ 18 px) ; restent à valider contrastes mesurés, exceptions CSS, espacements détaillés et logo définitif. |
| Sauvegarde automatique des vues | Portée locale vs workspace/utilisateur ; comportement en cas de conflit entre fenêtres ou réinitialisation. |
| Garde de sortie | Stratégie technique précise pour les éditeurs ne disposant pas d'un `save()` synchrone ou dans le cycle Electron ; UX-01 doit faire foi après fusion. |
| Contrats | Vocabulaire réel des rubriques et ordre de référence final à aligner avec les clauses juridiquement validées ; cas des incompatibilités non résolues. |
| Catalogue | Nomenclature exacte des catégories et des offres/formules à reprendre de la BDD sans supprimer de données historiques. |
| Service manuel | UX-02 : alignement des nouveaux abonnements manuels avec les règles vendues, sans migration implicite. |
| Interventions | Réouverture, états intermédiaires et cas d'échec ; ne pas inventer de transitions. |
| Bridge | Capacités actuelles à constater à la version déployée ; publication finale non présumée livrée. |
| Statistiques/exports | Encaissements et exports éventuels à qualifier : prévu vs disponible. |

Décisions nouvelles : proposer modification par PR et demander arbitrage si cela change une règle métier, une obligation contractuelle ou une action destructive.

## Note de vérification pour l'aide contextuelle (écart E05, 09/10/2026)
Le CSS actuel `src/renderer/ui-consistency-v2.css` masque intégralement les `.field-help` lorsque `.app-shell.help-disabled` est actif. Cela **ne doit pas devenir** le comportement V2 : l'option utilisateur ne désactive que le survol automatique, **jamais le point d'interrogation activable au clic/clavier**. Cette différence est déjà couverte par UX2-HELP-001 et documentée dans [Lot 01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md). Correction non codée.

## Vérifications de conception — Lot 01C (09/10/2026)
- **DÉCIDÉ** : premier clic = fiche rapide ; **Agrandir** = même dossier dans une vue complète ; liste+détail par défaut, ateliers spécialisés admis ; réglages de disposition mémorisés automatiquement par vue (UX2-NAV-002, UX2-LAY-001/002/003).
- **À VÉRIFIER, pas un nouvel arbitrage métier** : E08 portée (poste/workspace/profil) de la persistance ; E09 adaptation desk/overlay/fullscreen sans re-écriture des moteurs existants ; E10 contraintes largeur/accessibilité ; E11 protections des éditeurs Clients/Catalogue/Projets/Opérations non couvertes universellement par #83.
- **Recette impérative** : réduire/agrandir, changer de dossier, cliquer hors fiche, Échap, redimensionnement clavier/pointeur, revenir après redémarrage, fenêtre étroite et conservation du brouillon. La protection n'est pas présumée acquise pour tous les modules tant que l'implémentation n'est pas vérifiée.
- Détails : [Lot 01C](LOT-01C-FICHES-PANNEAUX.md).

## Proposition opérationnelle hors arbitrage UX — CI GitHub Actions
Le rapport Codex MSI recommande un runner Windows hébergé par GitHub pour éviter la dépendance au MSI. Le dépôt contient `.github/workflows/ci.yml` avec `runs-on: [self-hosted, Windows, X64]` et un `package-lock.json`. **Statut : recommandé / décision AtoumWeb encore ouverte**. En cas d'accord explicite, PR technique isolée, `npm ci`, deux workers et vérification des CI avant fusion, sans toucher aux données réelles. Détails : [CI-GITHUB-ACTIONS.md](CI-GITHUB-ACTIONS.md).

## Lot 01E — Spécification traçable (09/10/2026)
**DÉCIDÉ :** préserver le registre UX-01 de #83 lors de l'intégration, pas de système parallèle ; affichage `modifié / enregistrement en cours / erreur / conflit / enregistré` uniquement selon un résultat réel. **DÉCIDÉ comme cible V2, non livré :** ajouter « Enregistrer et quitter » seulement quand **le formulaire concerné peut valider/sauver de façon certaine** ; « Continuer la modification » reste le défaut sûr et « Quitter sans enregistrer » une sortie explicitement destructive. **Ne jamais assimiler cette action à la finalisation d'un devis, publication contractuelle ou publication Bridge.**

**À INSTRUIRE (E17–E22) :** protocole async compatible avec dialogue natif synchrone et tickets multi-fenêtres ; capacité de sauvegarde par section, gestion de baselines/conflits, type de dialogue, éditeurs non encore raccordés, récupération après crash **hors scope**. [Cahier des charges 01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## Lot 01F — Préférences et atelier sans mutation métier
- **DÉCIDÉ** : enregistrer automatiquement uniquement apparence, disposition, colonnes, tris/filtres et options de confort ; **jamais** une modification d'entité, une CGV, un devis, un pack ou une publication via le magasin de préférences.
- **Constat de code** : `src/renderer/workflow/DemoPanel.tsx` utilise `workflow.createDemo` et `workflow.resetDemo` ; ce module **n'est pas** un laboratoire de composants visuels statique. La recette UX V2 requiert un atelier isolé avec fixtures synthétiques, sans écriture IPC métier ni accès à Validation-MSI.
- **À instruire E23–E27** : source/portée exacte des settings, déploiement de l'atelier, taille des fenêtres/mesures visuelles, calendrier de migration, statut réel de CI. Détails : [Lot 01F](LOT-01F-PREFERENCES-RECETTE.md).

## Lot 02 — Navigation/Accueil, constats E28–E41
- **DÉCIDÉ :** 17 modules accessibles, rail compact **visible** même replié, groupes de présentation, favoris, recherche ouvrant le **bon dossier**, Accueil « Aujourd'hui/alertes », sept colonnes visuelles du pipeline (sans nouveau statut backend), widgets personnalisables, et **un chrono global seulement**.
- **Observé dans `main` :** rail actuel disparaît complètement, route Catalogue via recherche n'utilise pas `entityId`, 4 raccourcis « + » de l'Accueil n'ouvrent que les pages, pipeline Accueil a 5 agrégats, certaines polices des cartes sont 10–13 px. **Ces écarts sont à corriger lors du développement V2, pas réglés par le seul référentiel.**
- La spécification [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md) et la [matrice code→cible](LOT-02-MATRICE-EXISTANT-CIBLE.md) décrivent les modes et tests ; préférences persistées en réutilisant 01F, UX-01 avant sorties destructrices.

## Infrastructure — PR #84
La proposition de runner Windows GitHub-hosted est **développée et publiée** en [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84), **non fusionnée, non exécutée** (`[skip ci]`). Autorisation de lancement en attente de contrôle des minutes incluses et **budget/actions avec arrêt des dépassements** ou d'un plafond explicitement validé par AtoumWeb. L'absence de permission de l'API Billing ne vaut pas quota épuisé ni facturation autorisée. [Dossier CI](CI-GITHUB-ACTIONS.md).

## Lot 02A — E42 **DÉCIDÉ : option A validée le 09/10/2026**
**Option A choisie explicitement par AtoumWeb :** en mode réduit, **Accueil + favoris épinglés + 5 icônes de groupes (Commercial, Production, Gestion, Ressources, Pilotage)** ouvrant un panneau de sous-navigation ; en mode déployé, les **17 modules** accessibles avec leurs intitulés. Le groupe n'est pas un module ni une navigation implicite. **Option B (17 icônes directes) écartée.** La représentation précise des icônes et la taille du rail nécessitent encore une recette. [Détails 02A](LOT-02A-RAIL-NAVIGATION.md).

## Lot 02B — En-tête et chrono
**DÉCIDÉ :** en-tête compact/réductible, recherche et session de chrono toujours accessibles, **une seule session globale** ; bandeau Bibliothèque distinct ; audit clavier avant attribution de nouveaux raccourcis. [Détails 02B](LOT-02B-ENTETE-RACCOURCIS.md).

## CI #84 — statut après le premier lancement
**VÉRIFIÉ par GitHub** : commit `1b069575`, run [#549](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37934890745) exécuté sur le runner Windows hébergé. Installation et typecheck réussis, **3 timeouts/695 tests** (692 réussis), donc **CI en échec**. La branche #84 reste draft non fusionnée. Diagnostic ciblé requis avant fusion ; aucune hausse globale de timeout sans cause analysée. [Dossier CI](CI-GITHUB-ACTIONS.md).

## Lot 02C/02D/02E — Recherche, Accueil et recette
- **DÉCIDÉ :** les 14 types de résultats recherchables ouvrent leur entité identifiée lorsqu'elle existe ; si navigation refusée par UX-01, la palette et la saisie restent intactes. Le routeur ne transforme pas « trouvé » en « ouvert », ni un type inconnu en page Clients. [02C](LOT-02C-RECHERCHE-ROUTAGE.md).
- **DÉCIDÉ :** Accueil donne la priorité à Aujourd'hui, alertes et actions opérantes ; widgets configurables, chrono global unique, 7 intitulés commerciaux **visuels** ; aucun nouveau statut technique. [02D](LOT-02D-ACCUEIL-PILOTAGE.md).
- **E59 PARTIELLEMENT DÉCIDÉ — Conversion :** AtoumWeb valide un **historique consultable des Prospects effectivement convertis en Clients**, **hors pipeline actif** ; utiliser le lien/événement Client réellement enregistré, exclure `lost` et ne pas compter un simple `won` sans conversion attestée ; compter une conversion une fois, avec accès à la fiche Client. **DÉCISION E72 :** `new` reste dans l’Annuaire jusqu’à « Démarrer la prospection », puis `qualifying` rejoint « À qualifier ». **RESTENT OUVERTS TECHNIQUEMENT :** marqueur explicite de l'accord de principe pour « Finalisation » (**sens métier validé**), période de l'historique. Ne créer ni `finalization` ni duplication de `won` actifs. [Détail 02D](LOT-02D-ACCUEIL-PILOTAGE.md).
- [02E](LOT-02E-RECETTE-ET-MIGRATION.md) prépare vingt tests bout en bout ; ni ces tests, ni les **18+16+18+22 scénarios** détaillés des sous-lots ne sont des résultats d'exécution.

### E59 Finalisation — constat technique initial, définition métier validée ensuite (09/10/2026)
Le code `src/shared/crm.ts` n'a pas de statut Prospect `finalization`. **Attention : `quotes.finalize` / `finalizedAt` désigne le Devis prêt à envoyer et non la finalisation commerciale.** Le vrai `quotes.accept` après signature dans Abby convertit le Prospect en Client, désormais rangé dans **Conversion historique**. **Décision AtoumWeb confirmée plus bas** : Finalisation = **accord de principe obtenu, signature/dernières formalités en attente**, avec marqueur traçable à étudier ; ne pas le déduire automatiquement de tout devis `sent/viewed`. [Analyse détaillée](LOT-02D-ACCUEIL-PILOTAGE.md#11-complément-daudit-e59--finalisation-source-main-consultée-le-09102026).

## 09/10/2026 — Préparation de Projet avant signature, décision métier validée
- **UX2-PRJ-PROV-001 — DÉCIDÉ :** AtoumWeb peut **préparer volontairement un Projet** lié aux **lignes réellement présentes dans le devis courant**, même s'il est encore **non signé** (`draft/sent/viewed` selon capacités et validation du service). Ce Projet est **prévisionnel**, pas une acceptation ; aucun Client fictif, abonnement, facture ni publication implicite.
- **UX2-PRJ-PROV-002 — DÉCIDÉ :** un Projet préparatoire conserve ses propres modifications de tâches, Sites/Pages, contenus et ressources. Le devis peut changer ; il faut pouvoir choisir **Adapter/Synchroniser le Projet courant** OU **Repartir de zéro depuis le devis actualisé**, y compris traitement contrôlé (suppression possible seulement si sûre, sinon archive + remplacement) de l'ancien Projet. **Aucune perte silencieuse** ni deux projets actifs liés au même dossier.
- **UX2-PRJ-PROV-003 — DÉCIDÉ :** chaque préparation/régénération se base sur la **révision commerciale actuelle**, les lignes, versions, quantités et contributions effectives ; un besoin non repris au devis n'est pas généré. Sur validation **effective** du devis Abby, accepter/figer le Projet retenu et convertir le Prospect en Client selon les services, sans doublon.
- **E66–E71 À INSTRUIRE TECHNIQUEMENT :** localisation des boutons, capacité de remplacer un Project ID lié à un dossier, liens historiques/FK, fichiers/temps/Bridge et règles de sécurité. Le **backend comporte déjà** `prepareQuote/previewQuote/syncCommercial`, `provisional/frozen`, conflits et figeage ; le formulaire traditionnel Projets n'affiche que les devis acceptés. **Aucun `deleteProject` public attesté** à la rédaction. [Spécification détaillée](LOT-07-PROJET-PRE-SIGNATURE.md).
- **E59 Finalisation — DÉCIDÉ fonctionnellement :** accord commercial de principe obtenu, signature/dernières formalités en attente. Ce n'est ni `quotes.finalize` (devis prêt à envoyer) ni la création d'un pré-projet. **Le signal/indicateur permettant ce classement sans nouveau statut Prospect reste à déterminer** ; ne pas le déduire automatiquement des devis envoyés. Conversion historique (Prospect devenu Client) déjà validée.

## Lot 03 — Couverture documentaire et arbitrages
- **DÉCIDÉ :** le pipeline présente les 6 étapes **actives** À qualifier/Besoins/Préparer le devis/Attente du retour/Négociation/Finalisation ; la septième **Conversion** est **historique** et consultable, uniquement pour les Prospects reliés à un vrai Client. Aucun drag & drop vers Conversion, pas de création Client avant validation réelle du Devis.
- **DÉCIDÉ :** « Préparer le Projet » est une action volontaire depuis **les lignes d'un devis courant non signé** (indépendante de l'étape Prospect) et conserve un Projet `provisional` ; Devis modifié = Adapter ou Repartir de zéro de manière sécurisée. Projet préparé ≠ accord de principe ≠ signature.
- **DÉCIDÉ :** la fiche Client comporte huit onglets **Résumé, Contacts, Commercial, Contrats, Projets, Interventions, Documents, Historique**, alimentés par les services existants et sans copies de fiches.
- **E72 DÉCIDÉ par AtoumWeb :** le nouveau Prospect `stage='new'` reste dans l’Annuaire et **n’apparaît pas dans le pipeline**. Seul le clic volontaire « Démarrer la prospection » et sa réussite côté service (`new → qualifying`) l’affichent en « À qualifier ». Aucune entrée automatique au pipeline depuis la création d’une fiche, d’un Devis ou d’un Projet prévisionnel.
- **E73 TECHNIQUE NON TRANCHÉ :** signal explicite d'accord de principe, fiable et horodaté, sans introduire `ProspectStage='finalization'` par facilité.
- Documents : [03A](LOT-03A-MATRICE-CRM-EXISTANT-CIBLE.md), [03B](LOT-03B-PROSPECTION-PIPELINE.md), [03C](LOT-03C-FICHE-PROSPECT-BESOINS.md), [03D](LOT-03D-FICHE-CLIENT.md), [03E](LOT-03E-ANNUAIRE-PARCOURS.md). Tous les cas d'acceptation sont **prévus**, non exécutés.

## Lot 04 — Organisation/catalogue et constats du code
- **DÉCIDÉ :** Offres principales (Site vitrine, Site e-commerce, Site mariage, Maintenance WordPress) en tête. **« Services complémentaires » = SECTION d'interface**, pas catégorie obligatoire unique ; chaque prestation complémentaire garde **une catégorie métier principale** et les catégories/prestations s'affichent en **A–Z français**. Codes Abby/canoniques secondaires à l'écran, recherchables et conservés dans les données.
- **DÉCIDÉ :** administration complète depuis Manager, publication volontaire de versions, contenu inclus/exclu, aide commerciale modifiable, association à plusieurs offres sans duplicata, recherche par besoin/mots-clés, CGV versionnées et production/blueprint liés aux **versions**.
- **CONSTAT TECHNIQUE :** `CatalogItemType='offer'|'service'` ; `CatalogCommercialKind` offre/service/option/pack/abonnement est un **attribut de version**, pas cinq types d'item. `category` est **un texte libre** ; aucun CRUD de catégories identifié dans `CatalogApi`. `CatalogService.createVersion/publishVersion/setOfferComponents` existe, et la composition d'offre publiée n'est pas modifiable en place. Les recommandations de `ProspectNeedsPanel` sont actuellement codées en dur. Ne pas prétendre un référentiel de catégories ou une aide complète déjà livrés.
- **E88–E103 TECHNIQUES À INSTRUIRE** : entité catégorie et migration historique, pertinence/recommandations versionnées, aides structurées/mots-clés, seuils de publication CGV/blueprint, granularité d'édition brouillon et garanties d'immutabilité des devis.
- [04A inventaire](LOT-04A-MATRICE-CATALOGUE.md), [04B navigation et catégories](LOT-04B-NAVIGATION-CATEGORIES.md), [04C éditeur](LOT-04C-EDITEUR-VERSIONS.md). **Statut : documents rédigés, code non modifié.**

## CI — premier succès Windows-hosted après correction des fixtures, 09/10/2026
**STATUT TECHNIQUE VÉRIFIÉ :** [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84) au SHA `f4bc0197` a obtenu [`quality` vert sur run #589](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37945827513) : installation, typecheck et **698/698 tests**. **Cette observation n'autorise aucune fusion**. Préparer revue de #84, puis seulement après décision humaine éventuelle fusion, synchronisation/validation de #81 puis #83. Aucun test UX V2 exécuté sur ce run ; [détails](CI-GITHUB-ACTIONS.md).

## Lot 04D — Associations/recommandations (spécification documentée)
- **DÉCIDÉ :** **Inclus** (composition de l'offre), **Option disponible** (achetée seulement par une ligne Devis dédiée et une provenance figée) et **Complément recommandé** (conseil commercial avec motif éditable, **sans achat implicite**) sont trois notions distinctes. Un Service peut être lié à plusieurs Offres sans duplication du Service/Abby ; même catalogue pour administration, besoins Prospect et composition Devis.
- **DÉCIDÉ :** en Prospection, l'ajout humain d'une suggestion devient seulement un **besoin** ; dans un Devis, option de composition achetée via `selectOfferOption`, prestation recommandée libre ajoutée via la ligne versionnée après clic. Une **suggestion ignorée** n'entraîne ni prix, ni CGV, ni blueprint, ni projet prévisionnel.
- **EXISTANT VÉRIFIÉ :** composants inclus/optionnels déjà versionnés, snapshots d'Offre et options figés par `QuoteService`; les suggestions de `ProspectNeedsPanel` utilisent actuellement une constante `SUGGESTIONS` codée en dur.
- **E104–E110 À INSTRUIRE TECHNIQUEMENT :** dédoublonner par service (aujourd'hui contrôle par version), concevoir le N:N recommandé éditable et versionné, contexte d'offres multiples, règles d'exclusion « Déjà inclus / Déjà acheté » et provenance des achats. **Convention proposée, non validée comme comportement existant :** première ligne d'Offre du Devis pour classer les recommandations. [Cahier des charges 04D](LOT-04D-ASSOCIATIONS-RECOMMANDATIONS.md).

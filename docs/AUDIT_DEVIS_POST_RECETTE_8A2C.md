# Audit de la vraie vue Devis après recette Lot 8A.2C

Date : **06/10/2026**. Branche `feature/project-page-compositions-v1`, HEAD `c2bd002deec7e6742a24943132627c2d3a79bb5f`. Les 16 fichiers de préparation 8A.2C restent non committés. Cette passe ne change aucun code fonctionnel ni aucune donnée réelle : lecture ciblée, observation SQLite ro/immutable, tests existants, documentation uniquement.

## 1. Décisions AtoumWeb prises lors de la recette

La recette `operational-recipe` est terminée **sur le principe**. Cet écran est un banc d'essai isolé du moteur, pas une nouvelle vue métier. Aucun renommage du banc en vraie vue Projet ni élargissement de ses cinq opérations.

Parcours cible : **Prospect → Devis → prestations/options → clauses/contrat → préparation Abby → Projet prévisionnel → même Projet actif après acceptation du devis**. Le devis signé valide les clauses associées. Aucun contrat métier indépendant à recréer.

La simulation vérifie seulement **prestation vendue → structure → affectation → actions → temps**. La vraie recette suivante doit utiliser Devis/Projet existants.

## 2. Mariage Histoire : constat initial avant arbitrage détaillé (historique)

| Formule | Doctrine actuelle validée | Staging actuel observé | Suite |
|---|---|---|---|
| Essentiel | 1 Site / 1 Page one-page | 1 / 1 | Aucun changement |
| Grand Jour | 1 Site / 1 Page one-page enrichie | 1 / 1 | Aucun changement |
| Histoire | 1 Site / mini-site multipage | 1 / 1, ancienne décision désormais dépassée | Profil distinct à préparer après définition des Pages |

**Le profil Histoire en base n'est pas encore corrigé.** Le nombre de Pages, leur liste et leur rôle ne figurent pas dans la nouvelle consigne ni dans la version catalogue V2 observée. Celle-ci décrit « Grand Jour + espace privé », galerie, livre d'or, intégrations et mise à jour après mariage, sans répartition de ces contenus en Pages. On ne peut pas assimiler implicitement espace privé ou galerie à une Page WordPress.

Question adressée à AtoumWeb : combien de Pages et lesquelles pour Histoire ? Aucune réponse reçue au moment de ce rapport. Aucune quantité commerciale ni destination inventée.

Modification minimale à préparer ensuite : une version structurelle multipage distincte pour Histoire, profil structurel inactif et révision d'association draft ciblant cette version. Conserver intégralement la Page unique partagée Landing/Essentiel/Grand Jour, les versions/associations déjà présentes et leurs sources. Réutiliser le même moteur générique de contributions ; pas de branche runtime par nom. Les **10 actions / 23 h** restent inchangées tant qu'AtoumWeb ne décide pas autrement. Tester Histoire seul et la non-régression des deux autres formules. Aucun import ou application sur Validation-MSI dans cette passe.

## 3. Sélection réelle des prestations

**Existe** : assistant Devis en étapes destinataire/besoin/offre/services/conditions/aperçu ; choix Prospect ou Client, une offre principale, services additionnels et lignes libres ; détails modifiables après création. [QuotesPage.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/commercial/QuotesPage.tsx:35)

**Écarts confirmés** :

- Pas de filtre métier famille/catégorie/sous-catégorie dans les sélecteurs du devis : listes simples. Le catalogue possède `category`, `familyCode`, `commercialKind` et code AW, mais pas de sous-catégorie métier dédiée dans `catalog_items`/les types catalogue. Les catégories historiques (« Web », « Contenu ») et familles V1 (« WEB », « CONTENU ») coexistent ; ne pas les fusionner silencieusement.
- L'étape « Offre de départ » n'affiche que `item.type === 'offer'`, malgré son texte indiquant Offre ou Service. Un service peut être ajouté par l'étape suivante ; ne pas reconstruire le parcours.
- La liste privilégie une version **published** avant la dernière **draft**. Pour les 21 références reprises, l'ancien publié reste choisi ; les brouillons V1 sont invisibles dans ce choix. Pour les références sans publié, le brouillon peut apparaître dans la liste, puis être refusé à l'ajout. [CatalogService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/commercial/CatalogService.ts:187)
- `QuoteService.addCatalogLine` refuse toute version non publiée ou prestation inactive. Ce garde est justifié en production et ne doit pas être contourné pour cette recette. [QuoteService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/commercial/QuoteService.ts:283)
- Le bouton actuel « Remplir avec des données test » réutilise des IDs historiques codés et peut choisir le premier vrai Prospect si aucun Prospect DEMO n'est trouvé ; il ne crée pas un workspace isolé. Il n'est pas une garantie de faux devis sans impact réel.

**Base réelle** : 112 AW ; **114 versions commerciales AW draft** (112 V1 + Vitrine/Landing V3), 21 anciennes AW published. Ne pas présenter ces 21 anciennes publications comme la publication du catalogue V1.

## 4. Lignes et personnalisation

**Existe** : snapshot du catalogue vendu, libellé/description, quantités milli-unités, prix catalogue/proposé, remise pourcentage/montant/prix imposé/gratuité et motif ; lignes libres ; recalcul des totaux, acompte/arrhes, solde. Une version précise est référencée ; les changements catalogue ne réécrivent pas sa copie vendue.

Les prestations sur devis nécessitent un prix proposé. Les lignes sont immuables une fois finalisées/acceptées ; duplication et révision commerciale sont deux parcours distincts.

**Limite** : une ligne libre n'apporte pas automatiquement un modèle opérationnel ni une clause catalogue. La désigner comme une prestation V1 par son seul libellé ne suffit pas.

## 5. Options disponibles / réellement achetées

**Existe** : panneau Services inclus et options, distinction inclus/disponible/acheté ; achat = vraie ligne persistée avec provenance `quote_option_purchases`, offre/version/composant/service/version, quantité/prix/remise. Rejeu sans doublon, retrait avant gel, conservation de provenance à la duplication ; pas de fusion par nom. [QuoteOfferOptionsPanel.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/commercial/QuoteOfferOptionsPanel.tsx:12)

**Écart de configuration** : Vitrine V3 et Landing V3 possèdent actuellement **zéro composant**, conformément au staging validé sans héritage historique. Aucune liste réelle d'options V1 n'y a été configurée. Leurs options du banc d'essai sont des fixtures, pas une composition commerciale réelle. Le panneau existe, mais afficher des options réelles réclame une configuration explicite, versionnée et séparément autorisée.

Le configurateur catalogue exige actuellement un Service publié avant de l'ajouter à une offre. Un parcours de staging commercial complet en brouillon n'existe pas encore pour cette configuration. Ne pas publier pour contourner ce point.

## 6. Textes commerciaux et Abby

**Existe** : catalogue nature/description/inclusions/exclusions/prérequis/modalités et libellé Abby versionnés. Une ligne vendue copie les données catalogue et `abbyLabel` dans son snapshot. L'aperçu client utilise le libellé/description de ligne et ses inclusions ; il peut produire un PDF Manager.

**Existe pour Abby** : Builder CGV → texte contractuel compilé ou snapshot figé → bouton Copier pour Abby ; copie locale au presse-papiers. Référence Abby rattachée au devis et document accepté conservé. [ContractTermsBuilder.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/commercial/ContractTermsBuilder.tsx:158)

**Manque démontré** : pas de préparation/copie d'un bloc complet de lignes commerciales pour Abby utilisant `abbyLabel`, quantités, prix/remises et textes personnalisés. `abbyLabel` est conservé mais ne devient pas le libellé affiché de ligne ni un export commercial automatique. La génération du PDF Manager ne constitue pas la génération du devis Abby ni une signature.

Aucune intégration Abby ou nouvelle gestion de factures à développer dans cette passe.

## 7. Clauses / contrat et snapshot

**Existe** : clauses communes scope base + clauses catalogue selon les lignes et composants obligatoires ; options non achetées exclues ; déduplication par identité ; personnalisations, clauses particulières, ordre, désactivation, orphelins et audiences professionnel/consommateur. Synchronisation du Builder dans le brouillon ; aucun recalcul après gel. [ContractTermsService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/commercial/ContractTermsService.ts:520)

**Existe** : création/version de clause en brouillon, publication volontaire séparée. La finalisation fige textes, versions, paramètres, lignes et preuves disponibles dans le snapshot ; présence de snapshot indépendante du contenu vide. L'ajout futur de clauses ne reconstruit pas les contrats historiques. [ContractTermsService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/commercial/ContractTermsService.ts:461)

**Garde actuel** : seuls les templates actifs avec version **published** sont consommés. Les **118 clauses V1 sont draft**, donc aucune injection V1 dans la vraie vue Devis ; une finalisation V1 sans socle publié doit être refusée. C'est le comportement attendu, pas un manque à résoudre par publication implicite.

**Conditions hors clauses** : formulaire existant de canal/audience/qualification numérique, échéancier, délais/jalons, garanties, droits/licences, renouvellement, RSVP minimal, RGPD/annexes/preuves et administration. Finalisation refusée si les données requises manquent. Les informations administratives non réellement renseignées restent absentes. [QuoteContractPreparationService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/commercial/QuoteContractPreparationService.ts:123)

## 8. Acceptation et preuve documentaire

**Existe** : états draft → finalisé → sent/viewed → accepted ; preuve explicite exigée pour les nouveaux snapshots paramétrés ; pas d'acceptation par silence. PDF Abby accepté ou attestation sont des preuves tracées, avec contrôle d'intégrité pour les fichiers. Le rattachement contractuel renvoie au document maître, et le Client expose sa référence contractuelle.

Les trois devis historiques `DEV-2026-001/002/003` ont **zéro snapshot contractuel** ; cette absence demeure explicite et n'est jamais remplacée par la V1. Aucun devis fictif ajouté dans Validation-MSI.

**Point UX** : le bouton « Valider » appelle l'acceptation du devis ; il ne doit pas être compris comme une simple validation interne. La preuve d'acceptation par le Client reste nécessaire selon le parcours nouveau.

## 9. Projet prévisionnel et synchronisation

**Existe dans la vraie vue Devis** : bouton vérifier le plan sans Projet, préparation d'un Projet depuis draft/sent/viewed, ouverture du Projet déjà lié. Preview/SHA de garde, dossier commercial unique, origines de lignes et révisions, synchronisation explicite, prérequis, structure composée et quantités. [QuoteWorkflow.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/workflow/QuoteWorkflow.tsx:8) [ProjectCommercialService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/projects/ProjectCommercialService.ts:61) [ipc.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/ipc.ts:496)

Modifications humaines préservées ; retrait d'éléments renommés/travaillés = conflit visible ; ajouts manuels pas repris par nom. Synchronisation idempotente tant que prévisionnel, refus sur historique ou périmètre accepté. Les révisions du même dossier réutilisent le même Projet ; duplication indépendante ne doit pas adopter celui de l'original.

**Acceptation** : si un Projet prévisionnel existe, le service le resynchronise, vérifie conflits/cibles, fige le plan et les lignes acceptées, rattache le Client et conserve **le même ID Projet**. Il ne crée pas un second Projet. [ProjectCommercialService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/projects/ProjectCommercialService.ts:144)

**Précision** : activation du périmètre = `commercial_state='frozen'`, plus la permission de passer en production. Le statut de production (`to_prepare`, etc.) n'est pas automatiquement basculé à `in_progress` par cette méthode. Cela évite de démarrer le travail avant vérification de l'acompte/contenus/accès. Les Conditions avant démarrage doivent rendre cette distinction explicite.

## 10. Raccord avec Lot 8A

**Existe** : ProjectCommercialService appelle ProjectOperationalService lors de preview/préparation/synchronisation. Génération dans `project_nodes`, provenance, référence de temps immuable, estimation courante, temps réel et contrôles de cible ; catégories métier distinctes des catégories d'activité. Aucun deuxième moteur à créer. [ProjectOperationalService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/projects/ProjectOperationalService.ts:29) [OperationalActionDetails.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/projects/OperationalActionDetails.tsx:4)

**Garde actuel** : parcours normal exige modèle ready + association ready + profil structurel opérationnel, lorsque nécessaire. Les 112 modèles / 94 liens draft et sept profils inactifs sont donc refusés/ignorés conformément aux gardes. Une ligne historique peut encore utiliser un chemin historique sans actions opérationnelles V1 : une préparation historique réussie ne démontre pas la recette V1.

**Existe séparément** : `OperationalStagingService.previewQuote` calcule les modèles/liens draft et des choix logiques sans matérialisation. Il n'est pas exposé comme preview de staging des vraies lignes de la vue Devis ; celle-ci appelle le runtime normal. [OperationalStagingService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/projects/OperationalStagingService.ts:16)

**Manque pour une recette V1 sans activation** : raccord de consultation du staging aux vraies lignes de faux devis, en réutilisant cette méthode. Le staging ne doit jamais être transmis à `prepareQuote`, à l'acceptation ni à l'application de tâches. Pas de désactivation des guards runtime.

## 11. Future organisation de la vraie vue Projet

Bloc global **Conditions avant démarrage** : devis accepté, acompte, contenus/visuels, accès, informations légales et autres prérequis applicables.

Onglets dans l'ordre **Origine commerciale → Structure prévue → Affectation → Plan de travail**. Le Plan de travail peut être ouvert par défaut en production. [ProjectsPage.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/projects/ProjectsPage.tsx:689)

**Briques à réutiliser** : panneau commercial/origines, Sites & Pages (identités, renommage, `desired_path`/slug), cibles persistées Site/Page/context, arbre de phases/tâches/actions manuelles, estimations, checklist et chrono. [ProjectCommercialScopePanel.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/projects/ProjectCommercialScopePanel.tsx:30) [ProjectSiteService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/projects/ProjectSiteService.ts:80) [OperationalActionDetails.tsx](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/renderer/projects/OperationalActionDetails.tsx:4)

**À organiser/compléter ensuite** : bloc global de conditions, nouvel ordre/présentation des onglets, exposition cohérente des sections/modules prévus et de leurs réorganisations, lecture provenance automatique/manuelle. Ne pas promettre que toutes ces fonctions ont déjà une recette réelle. Aucune de ces fonctions ajoutée au banc d'essai isolé dans cette passe.

## 12. Administration future des référentiels : compatibilité architecturale

L'architecture **ne bloque pas** la séparation moteur applicatif / base métier AtoumWeb : modèle catalogue versionné, templates/versions de clauses, modèles opérationnels JSON versionnés, profils structurels et associations révisionnées, politiques A/B/C/D lues depuis configuration persistée. [OperationalReferenceService.ts](C:/DEV/01_PROJETS/AtoumWeb/atoumweb-manager/src/main/projects/OperationalReferenceService.ts:64)

Administrer à terme code AW, famille/catégorie/sous-catégorie, type commercial offre/service/option/pack/abonnement, prix, texte commercial/Abby, clauses, actions, temps, structure/profil, capacités/cibles, versions et états. L'UI Catalogue et le Builder gèrent déjà plusieurs champs ; cela ne constitue pas encore un module complet de gestion des modèles/politiques opérationnels.

**Points à traiter plus tard** : sous-catégories/taxonomie explicites ; éditeur et validation générique des modèles/actions/politiques ; workflows distincts publié commercial / publié contractuel / modèle ready / association ready / profil opérationnel. Ne pas fusionner ces états dans un bouton global.

Exports à prévoir : sauvegarde complète liée des référentiels, grille tarifaire, catalogue, CGV/contrat type/modules, opérationnel ; formats externes modifiables ; réimport avec diff, validation et version brouillon. Sauvegarder seulement le SQLite n'est pas un export métier éditable. Les importeurs existants possèdent SHA/manifeste/dry-run/idempotence : les réutiliser pour la future UX, préserver IDs/codes/version/relations et l'historique. Aucun module d'administration/export développé ici.

## 13. Prochain lot minimal proposé, non démarré

**Recette native Devis V1 en environnement de test isolé**, avec le vrai composant Devis, pas un nouvel écran autonome ni des faux devis sur Validation-MSI.

1. Choisir un workspace jetable/données synthétiques explicites, sans vrai Prospect choisi par défaut, et garde empêchant toute écriture à Validation-MSI. Distinguer fichier source et workspace de recette.
2. Réutiliser le wizard/lignes/options ; rendre lisibles le code AW, la famille et la version effectivement vendue. Éliminer le décalage « brouillon affiché puis refusé » sans affaiblir l'exigence publié en production.
3. Raccorder uniquement une consultation staging sur les lignes persistées de ces faux devis ; montrer clauses en aperçu de brouillon et préparation/copie Abby existantes, sans snapshot juridique définitif ni activation d'actions.
4. Recetter Vitrine, option disponible/achetée/retirée, C sans structure, D à choisir et les trois Mariage après arbitrage des Pages Histoire ; toujours sans publication/ready réels.

**Frontière obligatoire** : un bout-en-bout finalisation/acceptation/Projet réellement matérialisé V1 réclame soit une autorisation séparée de fixtures publiées/ready exclusivement en copie, soit un plan spécifique de parcours staging qui reste non exécutable. La consigne actuelle interdit ready/publication/activation : aucune de ces possibilités n'est exécutée ni supposée autorisée. Le premier sous-lot se limite aux faux devis et previews ; ne pas simuler une acceptation valide en contournant les contrôles contractuels.

Après validation du diagnostic et du périmètre de recette, préciser le mode isolé retenu avant code. Aucun gros chantier d'administration ni refonte du Projet requis pour commencer.

## 14. Tests, preuves et limites

**174/174 tests**, huit fichiers ciblés : QuoteService, QuoteOptions, ContractTermsService, QuoteContractPreparationService, ProjectCommercialService, ProjectContributionTargets, OperationalCommercialPreparationService, OperationalRecipeService. Tests existants uniquement, pas de suite complète relancée pour l'audit documentaire. Ces tests ne prouvent pas une correction multipage Histoire qui reste non implémentée.

SHA source avant/après attendu et vérifié : `3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526`. Lecture SQLite immutable, aucune connexion en écriture à Validation-MSI ; registre 1–62 ; modèles/associations draft et profils inactifs, instances/cibles/achats nuls. Aucun commit/push/merge, aucun Lot8B/Abby/Bridge/8C.

Rapports SQLite et tests : `outputs/audit-devis-post-recette-8a2c/`. Aucun changement de XLSX, migration, modèle, temps, mapping D, historique ou composition réelle. **Arrêt pour validation ; correction technique Histoire suspendue jusqu'à précision des Pages.**


## 15. Mise à jour après arbitrage détaillé du 06/10/2026

La question du §2 est résolue : Histoire = 1 Site/4 Pages avec les quatre chemins définis par AtoumWeb. La configuration préparatoire et la simulation sont corrigées, les dix actions/23 h conservées. Essentiel/Grand Jour non modifiés. Le staging réel n’a pas été écrit ; cette distinction complète le constat historique sans le réécrire rétroactivement.

## 06/10/2026 — Correction préparatoire Mariage Histoire, arbitrage des quatre Pages appliqué sur copies

- AtoumWeb précise Histoire : **1 Site / 4 Pages** — Accueil `/`, Notre histoire `/notre-histoire/`, Le Jour J `/jour-j/`, Espace privé `/espace-prive/`. Espace privé = protection prévue pour galerie/souvenirs, vidéo/diaporama, livre d'or, contenus post-mariage ; aucune protection activée par le plan. RSVP/galerie/vidéo restent des sections/modules selon Projet, pas des Pages supplémentaires.
- Configuration versionnée **mariageHistoireStructure.json** ; préparation distincte du blueprint Page unique partagé, profil inactif et association candidate draft. Raccord Histoire remplacé seulement dans le savepoint de la copie de recette, puis rollback intégral. Aucun moteur normal ni schéma/migration modifié ; aucune application dans Validation-MSI.
- Essentiel et Grand Jour restent 1/1 ; Landing inchangée. Modèle Histoire, dix textes d'actions, checklist, catégories, minutes et politiques/cibles existantes intacts : **10 actions / 1380 min = 23 h**. Aucune multiplication des actions par quatre Pages.
- Quatre tests de non-régression ajoutés : profil distinct/draft/idempotence/rollback/historique ; refus du chemin réel ; vrai staging des trois Mariage et actions exactes ; génération synthétique des quatre slugs et conservation du partage one-page. Le moteur existant normalise les slugs de Projet sans slash final ; chemins de configuration/preview gardés comme demandés, aucune modification de ce moteur.
- **629/629 tests complets**, typecheck OK, Chromium **485/485**, 19 scénarios × trois thèmes. Histoire 1/4/10/23h, chemins et intention de protection contrôlés ; les 18 autres DTO identiques hors exposition descriptive des chemins et descriptions. Trois captures Histoire ajoutées aux 36 captures habituelles.
- Réserve métier avant validation de la charge : A02 architecture/navigation, A03 contenus des quatre Pages, A05 espace privé/enrichissements, A06 responsive multi-pages, A07 navigation/liens/accès protégé méritent précision/revue. Aucun intitulé n'impose une Page unique ; les 23 h ne sont ni changées ni certifiées suffisantes. Checklist protection/navigation non inventée ou ajoutée sans accord.
- Validation-MSI avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables exactes, migrations 1–62, 112 modèles draft / 94 liens draft / sept profils inactifs / zéro action/cible/achat. Le staging réel reste au checkpoint antérieur : seule la préparation sur copies est corrigée ; application réelle sur instruction distincte.
- Preuves : **outputs/mariage-histoire-4-pages/** hors dépôt. Aucun ready/publication/activation réelle, import/backfill, commit/push/merge, Lot8B/Abby/Bridge/8C. **Arrêt pour validation.**


## Mise à jour 06/10/2026 — doctrine et banc technique

Les contraintes de copies/SHA et comptages de Validation-MSI ci-dessus sont des décisions historiques désormais remplacées. Validation-MSI est la base non productive de recette réelle, mutable. Le banc technique démarre désormais sur une fixture versionnée maîtrisée ; il ne remplace ni Devis ni Projet. Suite normale indépendante de Validation-MSI. Aucun nouveau lot Devis ni publication/ready engagé par ce découplage.

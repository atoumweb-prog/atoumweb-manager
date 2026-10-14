# Lot 04A — Inventaire du catalogue réel et contrat de cohérence V2

**Statut : inspection statique du code + spécification, NON implémentée.**  
**Source de comparaison : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, 09/10/2026.** Confirmer les versions réelles avant toute PR d'application.
**Références :** [Lot 04](LOT-04-CATALOGUE.md), [source métier Catalogue/CGV](CATALOGUE-CGV.md), [Lot 03 CRM](LOT-03-CRM.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Lot 07P Projet prévisionnel](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Les décisions de produit à conserver
- **Un seul catalogue**, accessible en trois usages : **administration complète**, **besoins Prospect consultatifs**, **composition volontaire des lignes de Devis**.
- Présentation prioritaire des quatre offres **Site vitrine / Site e-commerce / Site mariage / Maintenance WordPress** ; les autres offres existantes restent disponibles. **Une section visuelle « Services complémentaires »** pour les prestations de service, chacune attachée à **une catégorie métier principale** administrable (par exemple SEO, Contenu, Maintenance selon inventaire), puis affichée par **catégories en français A–Z** et prestations A–Z. « Services complémentaires » n'est **pas une valeur de catégorie imposée à tous les services** ; voir 04B.
- Chaque prestation possède **une catégorie principale** et peut être **associée à plusieurs offres** comme service inclus, optionnel ou recommandé **sans duplication de l'item**. L'appartenance catalogue n'est pas une commande.
- **Codes Abby et canoniques internes secondaires à l'écran**, conservés intacts dans les données/snapshots. Recherche nom, besoin, bénéfices, mots-clés ; recherche exacte par code toujours possible.
- **Version publiée ≠ brouillon**, pas d'édition rétroactive d'une version vendue ou d'un devis accepté ; les clauses CGV ne sont pas éditées par simple texte libre « conseils internes ».

## 2. Modèle technique observé
| Source/objet | Réalité vérifiée | Écart ou risque V2 |
|---|---|---|
| `src/shared/commercial.ts` | `CatalogItemType='service'|'offer'`. `CatalogCommercialKind='offer'|'service'|'option'|'pack'|'subscription'` est un **attribut commercial de version**, pas cinq types d'item. | Ne pas réécrire SQL en pensant qu'il existe 5 `CatalogItemType`. Libellés/sections selon `commercialKind`. |
| `CatalogItemStatus` | `active/inactive/archived` ; autre booléen `visiblePublic`. | **Visibilité sur site ≠ disponibilité de vente** ni publication de version. |
| `CatalogVersionStatus` | `draft/published/retired`, numéros, dates, historique. | Contrôle de publication ciblé sans modifier les devis déjà établis ; révision nouvelle avant modification vendue. |
| `PriceMode` | `fixed/starting_from/hourly/monthly/yearly/quote_only/free`, plus `priceBasis=listed/actual_cost`. | Modes explicites, centimes et unités, coût tiers réel toujours `quote_only` sans prix catalogue fixé. |
| `CatalogItemInput.category` | **Chaîne libre `category?: string`**, sans API `catalog.categories` dans `CatalogApi` relu. | La **gestion native créer/renommer/fusionner/archiver une catégorie** est une capacité cible, non attestée comme déjà existante. Plan migration/liaisons à auditer. |
| `CatalogVersionInput` | `nature/description/inclusions/exclusions/prerequisites/priceMode/priceCents/recommendedPriceCents/specialTerms/internalAdvice/contractType`, paramètres commerciaux/version. | Aide à la vente **partiellement représentée** ; bénéfices/questions/mots-clés/vigilances structurés et éditables ne sont pas établis par ce type. |
| `OfferComponent` | Lien version **d'offre** → version **de service**, avec quantité, `isOptional`, `sortOrder`. | Couvre la **composition incluse/optionnelle** des offres, pas encore une matrice explicite N:N « pertinence/motif de recommandation ». |
| `CatalogService.create` | Crée item + **première version brouillon** dans savepoint SQLite, activités. | Déjà utile ; ne pas dupliquer cette fonction dans la UI V2. |
| `CatalogService.createVersion` | Crée une nouvelle version brouillon et **recopie** certains liens des contrats, règles commerciales, compositions et blueprints depuis la version précédente. | Préserver la provenance de liens et contraintes ; ne jamais tenter une copie manuelle incomplète en React. |
| `CatalogService.publishVersion` | Publie une version et passe une autre publiée à `retired`. | Contrôles juridiques/production préalables à définir avec les services concernés ; ne pas dire « conformité juridique validée » sur simple publication. |
| `CatalogService.setOfferComponents` | Modifiable **seulement pour une version d'offre `draft`**, exige Service **`published`** et empêche doublon du même service dans une offre. | Préserver l'immutabilité des compositions publiées ; comparer propositions des services vs modules achetés. |
| `CatalogService.list` | Filtre `type/status/category/visiblePublic/priceMode/search` et renvoie des versions selon priorité `published/draft/retired`; catégorie et nom triés SQL. | Dans l'admin montrer précisément **quelle version on consulte** ; l'UI V2 classe en français et n'affiche pas le code Abby en premier. |
| `src/renderer/commercial/CatalogPage.tsx` | Liste, filtres type/statut/recherche, cartes/tableau, panneau de détail élargissable, formulaire de création, nouvelle version, publication, statut, visibilité site, composition d'offre, panneau Contrat & CGV. | Écran **déjà administrable en partie** ; le Lot 04 recompose l'UX, ne doit pas dupliquer le moteur. |
| `src/renderer/commercial/catalogDisplay.ts` | Alias d'affichage pour famille et distinction offre/service ; **ne modifie pas identités, catégories ou modèles métier**. | Couches d'affichage possibles pour l'accueil des quatre offres sans schéma improvisé. |
| `src/renderer/crm/ProspectNeedsPanel.tsx` | Catalogue `active`, besoins et propositions, suggestions `SUGGESTIONS` par id codées dans le front. | Les suggestions V2 doivent être **administrables depuis le catalogue**, et non maintenues comme table de code, **sans vendre automatiquement**. |
| `src/renderer/crm/ProspectPreQuoteReview.tsx` | `quotes.createWithLines` matérialise des **lignes de Devis** avec versions catalogue ou ligne libre, après contrôle. | Délimitation explicite : besoins/suggestions ≠ devis ; la **révision commerciale du devis** est la source du Projet prévisionnel. |
| `src/renderer/commercial/QuotesPage.tsx` | Recherche des lignes par code/nom/catégorie ; ajoute explicitement via `quotes.addCatalogLine`, uniquement versions publiées chargées. | Lors des suggestions V2, le bouton `Ajouter` doit rester volontaire, visible et idempotent ; pas de re-facturation automatique. |

## 3. Constat important : les concepts du catalogue sont déjà distincts
**Ne pas confondre :**
1. **`item.type`** : offre versus service.
2. **`version.commercialKind`** : rôle commercial offer/service/option/pack/subscription, utile pour visualiser mais pas pour remplacer `type`.
3. **`item.category`** : texte libre actuel, destiné à devenir une catégorie contrôlée si un service de catégories est retenu.
4. **`version.familyCode`** : regroupement canonique/identité de version, **pas** un substitut aux catégories UI éditables.
5. **`canonicalCode` / `abbyLabel`** : références techniques/commerciales, pas priorité de présentation.
6. **`visiblePublic`** : affichage sur site, distinct de l'état catalogue et de la publication d'une version.
7. **`version.status='published'`** : version utilisable ; ne signifie **pas** contrat juridiquement correct ou prestation achetée.

## 4. Gouvernance, tarifs, contrats et Projet prévisionnel
- **Besoins Prospect :** sélectionner une prestation ne crée ni ligne Devis ni obligation contractuelle.
- **Devis :** ajout volontaire et version de catalogue exacte ; snapshot lors de la transition métier officielle.
- **Projet prévisionnel avant signature :** source = lignes, quantités et versions de la **révision courante du Devis non accepté** ; ne pas générer depuis `item.currentVersion` si la ligne cite une autre version.
- **Modification du catalogue après devis :** pas de propagation silencieuse dans Devis existant, Projet déjà préparé ou CGV attachées ; proposer une révision explicitement validée.
- **Abby :** le code demeure pour export/rapprochement, jamais un préalable visuel imposé pour trouver « Audit SEO » ou « site mariage ».
- **CGV :** publication commerciale à confronter aux **liens de clauses versionnées**, sans déclaration automatisée de conformité juridique.

## 5. Plan de préparation Codex futur (après autorisation distincte)
| Étape | Travail | Preuve attendue |
|---|---|---|
| 04A.1 | Relever SHAs, services, tests et écrans Catalogue + autres consommateurs | Matrice `champ → API → table → appelant → test` |
| 04A.2 | Inventorier toute catégorie réellement stockée, valeurs libres/historiques et clés canoniques | Rapport de migration possible, sans modifier base réelle |
| 04A.3 | Établir le schéma de recherche nom/bénéfices/mots-clés/code, et les limites de l'indexation actuelle | Vrai contrat de recherche, pas d'affirmation de fonction inexistante |
| 04A.4 | Faire le relevé des versions, liens offre/composant, contractuel et blueprints | Cas immutables, copie/version/réactivation |
| 04A.5 | Proposer l'architecture UI avec pilote catalogue isolé + fixtures synthétiques | Aucun nouvel autosave métier, garde UX-01 |
| 04A.6 | Recette et compatibilité Devis/Projet/CGV | Tests ciblés, suite réelle sur fixture, revue humaine |

## 6. Scénarios à couvrir lors de l'implémentation (NON exécutés)
| ID | Scénario | Résultat |
|---|---|---|
| R04A-01 | Créer un item service depuis interface | Première version `draft`, aucun effet sur les devis |
| R04A-02 | Publier version | Une seule version publiée courante, ancienne `retired`, provenance conservée |
| R04A-03 | Modifier offre publiée | Nouvelle version brouillon, ancienne prestation et devis historiques inchangés |
| R04A-04 | Rattacher un Service inclus/optionnel à une offre | Version de service publiée requise, pas de doublon |
| R04A-05 | Tenter modifier composition d'une offre publiée | Refus service, invitation à créer nouvelle version |
| R04A-06 | Choisir besoin Prospect | Aucune ligne de Devis créée implicitement |
| R04A-07 | Ajouter intentionnellement ligne depuis Devis | Bon `catalogVersionId`, quantité et prix pertinents |
| R04A-08 | Préparer Projet avant signature | Utilise uniquement lignes du Devis, ni suggestions ni besoins |
| R04A-09 | Archiver item avec devis accepté existant | Devis accepté/snapshot reste lisible |
| R04A-10 | Coût réel de tiers `actual_cost` | Mode `quote_only`, pas de prix catalogue fixe imposé |
| R04A-11 | Chercher par nom et code canonique | Bonne identité, sans priorité excessive au code |
| R04A-12 | Catégorie ancienne ou manquante | Écran non cassé ; migration proposée sans données perdues |
| R04A-13 | Nouveaux conseils commerciaux | Brouillon interne distinct du contenu client/CGV |
| R04A-14 | Tests SQL/contrats/rollback | Zéro mutation Validation-MSI, compte rendu sur SHA réel |

## 7. Points techniques encore ouverts
- **E88** : catégories libres actuelles → entités administrables/versionnables ? Examiner données/migrations/dépendances avant nouveau schéma.
- **E89** : suggestions actuellement définies côté Prospect `SUGGESTIONS` → modèle administrable avec motifs/compatibilités ; pas de remplacement sans audit.
- **E90** : aides commerciales structurées (bénéfices, questions, vigilance, mots-clés) et indexation ; distinguer de `internalAdvice` libre.
- **E91** : clés/familles/offres principales et ordre, sans adapter `canonicalCode` par simple CSS.
- **E92** : garanties de snapshots Devis/projet préparé lorsqu'une version est `retired` ou archivée.
- **E93** : contrôles de publication croisés Contrats/CGV/Blueprint et droits ; validation juridique humaine requise.

**La couverture documentaire indique le travail à réaliser. Aucun composant V2, migration ou scénario listé n'est livré par ce fichier.**

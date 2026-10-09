# Lot 04B — Architecture du catalogue, navigation, catégories et recherche

**Statut : spécification documentaire, AUCUN développement ou test effectué.**  
**Code de référence : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (lecture statique du 09/10/2026).**
**Sources :** [Lot 04](LOT-04-CATALOGUE.md), [04A inventaire](LOT-04A-MATRICE-CATALOGUE.md), [CATALOGUE-CGV](CATALOGUE-CGV.md), [01D Tableaux](LOT-01D-TABLEAUX-VUES.md), [01C Fiches](LOT-01C-FICHES-PANNEAUX.md), [02C Recherche](LOT-02C-RECHERCHE-ROUTAGE.md).

## 1. Structure visuelle décidée
Deux niveaux de lecture, sans nouveaux types techniques arbitraires :

1. **Offres principales**, en tête de la page : **Site vitrine**, **Site e-commerce**, **Site mariage**, **Maintenance WordPress**. Montrer les autres offres existantes, sans les supprimer ni les confondre avec les services. Présenter tarifs/formules et principales inclusions de la version publiée, avec ouverture de la fiche.
2. **Services complémentaires**, une section visuelle unique dont les articles sont rangés **dans une catégorie métier principale**, puis **par ordre A–Z français** de catégories et de prestations. Une prestation n'a **qu'une catégorie principale** ; ses liens vers plusieurs offres sont **des associations**, pas des catégories supplémentaires.

**Précision :** « Services complémentaires » est une **grande section de l'interface**, pas une valeur de `item.category` à imposer à tous les services. La catégorie principale reste, par exemple, `SEO & visibilité`, `Création de contenu`, etc. **Les intitulés et le périmètre précis des catégories ne sont pas figés** sans inventaire des données existantes. Une prestation peut rester sans catégorie de manière transitoire, avec signalement et possibilité de classement.

Le groupe Offres principales est une préférence de **présentation**, pas un nouveau `CatalogItemType`, ni la duplication des produits sous une deuxième clé. Les codes Abby sont secondaires mais accessibles en fiche et dans la recherche.

## 2. État réel du code et écarts UX
| Source | Fonction présente | Besoin V2 |
|---|---|---|
| `CatalogPage.tsx` | Une liste filtrée `query/typeFilter/statusFilter`, modes cartes/tableau, panneau détail + bouton Agrandir, formulaire et éditeur de version. | Accueil en sections claires offres principales/services, sans retirer la table d'administration complète ni les statuts. |
| `CatalogPage.tsx` | `filtered` trie par `item.category` puis nom `localeCompare('fr-FR')`. | Maintenir tri alphabétique français, mais distinguer catégories affichées, sections et recommandations contextuelles. |
| `CatalogPage.tsx` | Recherche locale sur nom, code, `familyCode`, `abbyLabel`, nature, description, inclus/exclus, conseils internes et champs contractuels libres. | Étendre à **besoin client, bénéfices et mots-clés** réellement éditables/stockés ; ne pas dire que la recherche sémantique existe déjà. |
| `CatalogService.list` | Filtrage côté service `search/type/status/category/visiblePublic/priceMode`. | Les listes d'administration doivent conserver accès aux items archivés, masqués et brouillons, sans exposer des versions non publiées dans Devis. |
| `src/shared/commercial.ts` | `CatalogItemInput.category?: string`, **aucune API de gestion de catégories** exposée par `CatalogApi`. | Définir un référentiel administrable de catégories après inventaire et conservation des historiques. |
| `catalogDisplay.ts` | `catalogueFamilyLabel` affiche la famille de version ou catégorie et `catalogueIsOffer` sépare `item.type`. | **Ne pas remplacer** cette simple fonction d'alias par un changement métier de `category` ou `familyCode` sans audit. |
| `ProspectNeedsPanel.tsx` | Onglets Offres/Services et catégorie sélectionnée, suggestions statiques `SUGGESTIONS`; article ajouté aux besoins après clic. | Rechercher **par intention/besoin**, aide `?`, recommandations versionnées du Catalogue, **pas** de sélection ni vente automatique. |
| `QuotesPage.tsx` | Catalogue filtré par version publiée, recherche par code/nom/catégorie et ajout explicite `quotes.addCatalogLine`. | Suggestions cohérentes avec l'offre de la première ligne du devis, mais catalogue complet toujours accessible ; action « Ajouter au devis » volontaire. |

## 3. Parcours « trouver une prestation » — trois contextes
| Contexte | Ce que l'utilisateur voit | Ce que l'action a le droit de faire |
|---|---|---|
| **Offres & Tarifs (administration)** | Offres principales, catégories services en A–Z, recherche, statuts, historique, prix, versions | Créer/éditer une **version brouillon**, publier après contrôle, archiver volontairement et affecter une catégorie ; aucune nouvelle vente |
| **Prospect / Besoins** | Même catalogue **publié et actif**, conseils/suggestions, inclus/exclus, recherche en français | **Ajouter un besoin** au dossier Prospect, pas une ligne Devis, pas Projet, pas achat |
| **Devis / Ajout de lignes** | Offres et services publiés, pertinence d'une suggestion, quantité/prix et versions sélectionnées | **Ajouter la prestation choisie au devis** explicitement, puis enregistrer selon l'éditeur ; pas de signature ni Projet sans action séparée |

- Le filtrage doit rester **visible et réinitialisable** ; ne pas avoir une offre absente sous prétexte de suggestion recommandée.
- Un nom semblable de prestation doit être distingué par type, description et version ; le code peut servir à désambiguïser, **pas dominer la navigation**.
- Un article archivé peut rester lisible en admin/historique, mais **n'est pas insérable dans un nouveau devis** sans réactivation et version publiée autorisées.
- Une prestation ajoutée dans le Devis porte la **version choisie, pas seulement l'ID de l'item**, pour maintenir prix, périmètre, CGV et génération de Projet cohérents.

## 4. Administration des catégories — cible à réaliser
| Fonction | Comportement |
|---|---|
| **Lister** | Catégories distinctes triées `fr-FR`, quantité et liste des items, état actif/inactif si retenu |
| **Créer** | Libellé français contrôlé (normalisation espaces/variantes/casse), unicité explicite sans créer de doublons `SEO`/`Seo ` |
| **Renommer** | Aperçu des items concernés et migration contrôlée ; ne pas perdre provenance, historique de devis et identités canoniques |
| **Réaffecter** | Choix d'une autre catégorie valide pour les items, validation volontaire ; retour avec bon filtre |
| **Archiver** | Ne pas supprimer catégorie utilisée : désactiver pour nouveaux rattachements ou la conserver en historique, avec message |
| **Restaurer** | Réactivation sans recréer une seconde clé catégorie |
| **Ordonner** | Catégories et services **A–Z français automatiquement** ; pas de priorité commerciale donnée arbitrairement par code Abby |

### Contraintes
- Aujourd'hui `category` est un **texte libre sur catalog_items**. Le schéma de catégorie normalisé, s'il est ajouté, doit prévoir **migration, cohérence/rollback, FK et compatibility** avec les filtres et devis figés. **Ne pas présumer une catégorie SQL existante.**
- Le catalogage **ne touche pas les liens d'assemblage des CGV**, ni les versions de prestations vendues ou les sources `canonicalCode/familyCode`.
- Un renommage de catégorie de présentation ne renomme pas une prestation ni les descriptions conservées dans le devis accepté ; seule l'expérience de classement peut évoluer après vérification.
- Les **formules** Site mariage/maintenance, packs et abonnement restent des rôles commerciaux (attributs de version), pas de nouveaux `item.type` créés pour la mise en page.
- Ne pas afficher un article seulement parce qu'il a `visiblePublic=true` ; vérifier aussi **item actif + version publiée** pour le contexte Devis.

## 5. Recherche et aide
- Recherche tolérante à la casse/accents selon mécanisme choisi et réellement testé, mots-clés administrés, champ **besoin client**/bénéfices et synonymes métier uniquement si structurés dans le modèle.
- Un moteur de recherche ne doit pas indexer des brouillons internes et les proposer comme achetables au Prospect/Devis sans publication.
- **`?`** : survol court ou clic détaillé (01B), lisible sur clavier même sans survol automatique ; contenu commercial versionné et éditable, **distinct de la description client et des clauses CGV**.
- Suggestions : motifs humains (« pourquoi ce complément »), relation N:N offre–service versionnée, déduplication inclus/ajouté/inactif/incompatible, jamais de ligne injectée automatiquement.
- Recherche de code Abby/canonique exacte toujours disponible à l'administrateur, sans code visible sur les cartes par défaut.

## 6. Séquence recommandée de développement (après autorisation)
1. Relever les **catégories réellement présentes**, leurs alias actuels, les offres et la composition des versions.
2. Faire des maquettes de l'accueil offres + services en catégories, avec vue tableau admin et fiche rapide.
3. Concevoir contrat de catégories en conservant les données antérieures, protections SQLite et utilisateurs de `category`.
4. Unifier la recherche dans les trois contextes sans confondre « consultable » avec « vendable ».
5. Ajouter filtres/catégories pilotables et préférences de vue 01D, sans autosave métier ; réutiliser `CatalogService` existant.
6. Exécuter tests sur fixtures isolées, neuf modes thème/densité, listes/versions/Devis/Prospect, et valider humainement avant fusion.

## 7. Scénarios de recette proposés, non exécutés
| ID | Scénario | Résultat |
|---|---|---|
| R04B-01 | Ouvrir Offres & Tarifs | Quatre offres principales visibles si réellement disponibles, autres offres non supprimées |
| R04B-02 | Parcourir Services complémentaires | Catégories A–Z françaises, produits A–Z dans chacune |
| R04B-03 | Créer un Service dans une catégorie | Un item, une catégorie principale et une première version brouillon |
| R04B-04 | Renommer catégorie utilisée | Liens conservés, données et devis historiques intacts |
| R04B-05 | Tenter deux catégories identiques casse/espace | Doublon refusé/réconcilié par choix explicite, sans pertes |
| R04B-06 | Archiver catégorie utilisée | Réaffectation/archivage contrôlé et ancienne référence consultable |
| R04B-07 | Chercher « visibilité Google » | Résultats pertinents selon champs réellement indexés, y compris mots-clés ajoutés |
| R04B-08 | Rechercher code canonique exact | Bon item, sans code comme premier intitulé par défaut |
| R04B-09 | Prospection : sélectionner un besoin | Aucun Devis/Projet généré automatiquement |
| R04B-10 | Devis : ajouter complément recommandé | Ligne volontaire avec version, quantité et prix |
| R04B-11 | Suggestion déjà incluse dans offre | Pas de double vente automatique, distinction Inclus/Recommandé |
| R04B-12 | Devis puis Projet prévisionnel | Source = lignes du devis courant, pas catégories/besoins suggérés |
| R04B-13 | Désactiver/version retirer une prestation déjà vendue | Ancien Devis accepté et Projet historique demeurent lisibles |
| R04B-14 | Changer thème/densité/taille de fenêtre | Compact >=14px fonctionnel ; liste/fiche et catégories accessibles |
| R04B-15 | Tests service/catégorie/migration puis suite complète | Captures/logs/SHA vérifiés, Validation-MSI non touchée |

## 8. Questions techniques restant ouvertes
- **E94** : quelles sont les catégories métier et les libellés déjà présents, comment préserver les alias d'affichage `catalogDisplay` ?
- **E95** : données et API de catégorie normalisée : nouvelle table/version ou alternative sûre, sans nouvelle migration avant décision ?
- **E96** : ajout de mots-clés/bénéfices structurés, indexation et filtres ; besoin du référentiel existant avant schéma.
- **E97** : coût/effets du regroupement automatique Site mariage/maintenance en première section lorsque `commercialKind` diffère de `item.type`.
- **E98** : présentation comparée d'une offre publiée et des brouillons, sans révéler en Devis des versions non publiées.

**Ce dossier décrit la navigation cible, pas une catégorie déjà déployée ni des regroupements techniquement existants.**

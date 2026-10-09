# Lot 04C — Éditeur intégral d'offre/service, versions, tarifs et publication

**Statut : spécification UX/UI V2 uniquement, non implémentée, tests non exécutés.**
**Référence code : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (inspection statique, 09/10/2026).**
**Documents liés :** [Lot 04](LOT-04-CATALOGUE.md), [04A modèle réel](LOT-04A-MATRICE-CATALOGUE.md), [04B navigation](LOT-04B-NAVIGATION-CATEGORIES.md), [CATALOGUE-CGV](CATALOGUE-CGV.md), [Lot 05 CGV](LOT-05-CONTRATS-CGV.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Projet 07P](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Objectif et invariants
L'administrateur AtoumWeb doit pouvoir **créer, modifier via une nouvelle version, publier, désactiver, archiver et restaurer les prestations dans le Manager**, sans recourir à un changement de code ni réécrire les prix/devis vendus.

- **Les actes métiers sont explicites** : sauvegarder un brouillon de catalogue ≠ publier, publier ≠ afficher sur le site, afficher sur le site ≠ inclure au devis, ajouter au devis ≠ accepter, accepter ≠ publier le site WordPress.
- **Les préférences d'interface** (colonnes, onglets, largeur, recherche) se mémorisent automatiquement ; **les données de la fiche catalogue ne se sauvegardent pas silencieusement**.
- Les anciennes versions publiées/retirées sont conservées ; les devis historiques continuent de citer leurs **versions et snapshots**, même si le prix actuel a changé.
- Ne pas injecter un texte libre d'aide commerciale dans un contrat/CGV officiel ; les **clauses contractuelles** sont une bibliothèque versionnée et leur publication nécessite contrôles séparés.
- L'éditeur doit réutiliser les services existants `CatalogApi.create/createVersion/publishVersion/setStatus/setVisiblePublic`, `setOfferComponents` et les panneaux contractuels actuels, pas reconstruire un second moteur.

## 2. Structure cible de la fiche (onglets adaptables selon type)
| Ordre | Onglet | Champs / capacités |
|---|---|---|
| 1 | **Identité** | Nom/description courte, type réel `offer/service`, rôle commercial `commercialKind`, catégorie principale, libellés destinés au client, mots-clés lorsque structurés, provenance et code canonique secondaire |
| 2 | **Tarifs & Abby** | Prix catalogue et conseillé (centimes), unité, périodicité, base `listed/actual_cost`, mode, code/libellé Abby, acompte, délais et estimations selon champs existants |
| 3 | **Contenu et périmètre** | Nature, description client, inclus, exclus, prérequis, contraintes, variantes/formules si versionnées, conditions/paramètres commerciaux |
| 4 | **Associations** | Pour l'Offre : services inclus/optionnels via `OfferComponent` et versions ; pour tous : recommandations administrables envisagées 04D, sans générer d'achat |
| 5 | **Aide à la vente** | Utilité, bénéfices, questions, situations pertinentes, argumentaires, vigilances et conseils internes, distincts du texte public et des clauses |
| 6 | **Contrat & CGV** | Références de clauses et types de contrat, versions applicables, alertes, simulation ; ouvrir l'éditeur central, jamais collage implicite de clauses |
| 7 | **Production** | Blueprint de production, livrables, durée/conditions et liens vers modèles ; **avant signature** seules les lignes Devis alimentent un Projet `provisional` après confirmation |
| 8 | **Historique** | Liste numérotée des versions `draft/published/retired`, dates, origine, comparaison, publication, archivage et actions autorisées |

Ne pas présenter un onglet vide comme une capacité pleinement opérationnelle : en migration progressive, annoncer **« À compléter »**, **« Non configuré »** ou conserver un bouton vers le module existant jusqu'au raccordement.

## 3. Capacités déjà réellement établies
| Besoin V2 | Mécanisme actuel inspecté | Point restant |
|---|---|---|
| Créer item + brouillon | `CatalogService.create` transactionnel, `CatalogPage.createItem`. | Présentation unifiée et validation des champs/catégories. |
| Nouvelle version | `createVersion`, `CatalogPage.prepareNewVersion` ; copie liens composant/CGV/blueprint depuis ancienne version. | Montrer ce qui est repris, avertir avant publication des dépendances non revalidées. |
| Publier | `publishVersion`, version précédente `retired`; historique affiché. | Contrôle de publication croisé sur CGV, structure, prix, associations, aide interne, droits et provenance, selon règles juridiquement validées. |
| Modifier composition d'offre | `setOfferComponents` **seulement version `draft`**, Service référencé obligatoirement `published`. | Intégrer dans onglet Associations et séparer service inclus/optionnel/recommandé. |
| Tarifs | `PriceMode`, `priceBasis`, plusieurs paramètres versionnés, prix convertis en centimes. | Nouvelles règles affichage/erreurs, arrondis, périodicité/quotas sans confondre les cycles de maintenance. |
| Statut/visibilité | `setStatus(active/inactive/archived)` et `setVisiblePublic` distincts. | Confirmer les effets, bloquer insertion Devis sur non vendable, conserver preuves historiques. |
| Conseils internes | `internalAdvice` libre et champs descriptifs. | Aide structurée/éditable à proposer 04E ; ne pas prétendre que l'onglet complet existe. |
| Périmètre | Inclusions/exclusions/prérequis sérialisés en listes de chaînes dans `CatalogVersion`. | Comparateur de versions lisible ; garder la distinction inclus/optionnel/complément. |
| CGV | `CatalogContractPanel` existant et liens de version copiés au brouillon suivant. | Contrôles de version/compatibilité exacts, pas de validation légale implicite. |
| Production | `catalog_project_blueprints` copiés lors de nouvelle version. | Ne pas générer Sites/Pages sans révision Devis/périmètre et confirmation explicite. |

## 4. Édition des brouillons sans perte de saisie
- La fiche ouverte a une identité `itemId/versionId` stable ; le bouton **Agrandir** ne remonte pas l'éditeur et conserve les champs.
- Afficher clairement les états « Brouillon non enregistré », « Enregistrement… », « Enregistré » (après retour service), « Version publiée, lecture seule », « Conflit ».
- Reprendre **un seul système de garde UX-01**, étendu aux sous-éditeurs Catalogue si nécessaire. La couverture actuelle #83 n'est pas universelle.
- Un clic sur une autre prestation, une recherche, le repli du panneau ou un retour depuis CGV ne doit pas **effacer silencieusement** un brouillon.
- `save` d'une version brouillon et `publish` sont des actions **distinctes** ; si l'API actuelle crée **une nouvelle version** plutôt que sauver en place, l'interface doit refléter l'effet exact et ne pas promettre un simple « Enregistrer » qui multiplie les versions par inadvertance.
- L'éditeur de composition ne doit pas rendre modifiable une version publiée ; une nouvelle version brouillon devient le lieu de mise à jour.
- En cas d'erreur IPC après soumission, conserver l'éditeur et la saisie, puis relire l'état serveur pour éviter une **seconde version dupliquée** sur nouvelle tentative.

## 5. Prépublication et portée des garanties
| Contrôle | Exemple de question | Nature |
|---|---|---|
| Identité | Nom présent, catégorie unique valide, code canonique/Abby si nécessaire | Métadonnée/catalogue |
| Prix | Base, unité, périodicité et mode cohérents, montant entier en centimes si applicable | Commercial |
| Contenu | Périmètre inclus/exclus et prérequis assez précis pour ne pas induire le Prospect en erreur | Revue humaine |
| Composition | Service versionné `published`, absence doublon, quantité et caractère optionnel clairement définis | Service actuel à réutiliser |
| Recommandations | Raisons, compatibilités, non-duplication des inclusions | Cible 04D, pas déjà livrée |
| Contrats/CGV | Liens requis, versions, placeholders, rubriques compatibles et validation juridique préalable lorsque demandée | Lot 05, non remplacé par simple test |
| Production | Blueprint nécessaire uniquement si offre vendable/exécutable et selon la prestation ; pas de création automatique | Lot 07/07P |
| Audit | Résumé des différences vs dernière version publiée et éventuels impacts sur devis futurs | Comparatif + confirmation |

**Aucun contrôle technique ne vaut validation juridique.** Ne pas bloquer toutes les prestations au seul motif qu'elles n'ont pas besoin de blueprint ou de clause spécifique ; leurs prérequis sont **par type de prestation**, à instruire.

## 6. Prix et comparaison de versions
- Formats `fr-FR` lisibles avec TTC/HT **uniquement si la règle contractuelle/fiscale correspondante est connue** ; ne pas inférer TVA/HT depuis un nombre `priceCents`.
- Distinguer `Prix catalogue`, `Prix conseillé`, `Coût réel tiers` et `Prix proposé dans le devis`. Les montants du Devis peuvent différer sans réécrire la valeur de la prestation.
- Une version retirée peut être **lisible et citée** par un devis ou un Projet existant ; elle n'est pas réinjectée dans un nouveau devis sans vérification explicite.
- Copier l'identité/version du service dans le devis de préparation et dans l'export Abby selon le contrat réel, jamais chercher le « prix courant » à la place du prix accepté.
- Pour maintenance/abonnements, garder les règles **périodes opérationnelles date-à-date** distinctes de la facturation ; le choix de tarif mensuel/annuel ne déclenche aucun abonnement réel à la publication.

## 7. Ordre de développement (après autorisation)
1. Cartographier `CatalogDraft`/état React → `CatalogVersionInput`/service → SQLite → versions/CGV/blueprint ; préciser la notion de sauvegarde de brouillon.
2. Concevoir UI huit onglets adaptatifs sans modifier le moteur métier, avec rendu de version/status/prix.
3. Raccorder édition et garde UX-01 aux éditeurs contenant de vrais brouillons, gérer chargement tardif et erreurs.
4. Mettre en place un comparateur version publiée vs brouillon et des contrôles de publication par type, reliés aux services existants.
5. Recetter la propagation contrôlée en Prospection/Devis/Projet prévisionnel sur **fixtures isolées**, sans modifier les anciennes versions acceptées.
6. Publier rapport exact : SHA, tests, 3 thèmes × 3 densités, photos/captures d'atelier, validation humaine, aucun merge sans accord.

## 8. Scénarios de recette proposés, non exécutés
| ID | Situation | Résultat attendu |
|---|---|---|
| R04C-01 | Créer fiche et première version | Item `draft`, aucune publication automatique |
| R04C-02 | Quitter édition sale | Garde UX-01, saisie intacte sur annulation |
| R04C-03 | Créer nouvelle version depuis version publiée | Copie liens et composition autorisés, ancienne version inchangée |
| R04C-04 | Modifier prix de brouillon / publier | Confirmation et état réel `published`, ancien `retired` |
| R04C-05 | Afficher une version historique | Lecture seule, aucune réécriture du devis qui la cite |
| R04C-06 | Tenter modifier offre publiée et composition | Refus, nouveau brouillon requis |
| R04C-07 | Changer statut item actif/inactif/archivé | Effet explicite, historique intact et nouvelles sélections encadrées |
| R04C-08 | Sélectionner « visible site » | Ne déclenche ni Bridge ni publication WordPress ; uniquement statut prévu |
| R04C-09 | Échec lors de création version | Brouillon conservé, pas de doublon sur nouvelle tentative |
| R04C-10 | Créer service en coût tiers réel | `quote_only`, pas de prix imposé |
| R04C-11 | Définir prix mensuel sur maintenance | Ne crée pas un abonnement ni quota opérationnel |
| R04C-12 | Modifier inclus/exclus d'une offre | Devis acceptés anciens inchangés et historique cohérent |
| R04C-13 | Contrat incomplet à publication | Contrôle selon règles juridiquement validées, pas de faux « conforme » |
| R04C-14 | Offre publiée sans blueprint si non applicable | Ne pas bloquer à tort l'offre |
| R04C-15 | Projet provisoire depuis devis courant | Versions des lignes du Devis conservées, aucune commande acceptée |
| R04C-16 | 3 thèmes × 3 densités / fenêtre étroite | Tous les champs/actions lisibles, Compact texte >=14px |
| R04C-17 | Tests de version, retour arrière et migrations | Intégrité SQLite, tests réels SHA, Validation-MSI non touchée |

## 9. Questions de raccord technique à instruire
- **E99** : quelle granularité d'enregistrement du brouillon est possible avec `createVersion` (API actuelle créée une nouvelle version) et faut-il une API d'édition **d'un brouillon existant** sous contrôle de révision ?
- **E100** : règle d'historisation des modifications d'`item.category`/nom, actuellement portés par l'item et non systématiquement versionnés comme le prix.
- **E101** : critères bloquants vs alertes à publier : contrats, production, prix, composition, provenance.
- **E102** : récupération après save IPC interrompu sans duplication de version ni retrait involontaire.
- **E103** : limites précises des devis historiques et des liens de production/clauses face aux versions retirées.

**Tout développement et toute exécution de la recette restent soumis au feu vert AtoumWeb après la stabilisation CI et le choix du chantier de code.**

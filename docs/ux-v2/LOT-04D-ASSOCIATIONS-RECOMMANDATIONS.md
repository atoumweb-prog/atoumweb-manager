# Lot 04D — Associations entre offres, options et recommandations commerciales

**Statut : spécification documentaire, aucun développement ni test exécuté.**
**Audit du code : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (09/10/2026).**
Liens : [Catalogue](LOT-04-CATALOGUE.md), [04A](LOT-04A-MATRICE-CATALOGUE.md), [04B](LOT-04B-NAVIGATION-CATEGORIES.md), [04C](LOT-04C-EDITEUR-VERSIONS.md), [référentiel métier](CATALOGUE-CGV.md), [Prospect](LOT-03C-FICHE-PROSPECT-BESOINS.md), [Devis](LOT-06-DEVIS-ABBY.md), [pré-projet](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Décisions commerciales conservées
- **Un catalogue commun** pour administrer, sélectionner un besoin Prospect et composer volontairement les lignes de Devis. Un Service peut appartenir à plusieurs Offres **sans duplication d'identité ou de code Abby**.
- Trois rôles **distincts** : **Inclus** dans une offre, **Option disponible** et **Complément recommandé**. Un quatrième état, **Acheté / ajouté au Devis**, naît **uniquement d'un clic explicite** et d'une ligne réelle.
- **Inclus** : prestation déjà couverte par la version de l'Offre ; ne pas vendre automatiquement une seconde fois.
- **Option disponible** : proposée par l'Offre, mais non achetée avant création d'une ligne Devis avec provenance de la composition figée.
- **Recommandé** : conseil commercial avec motif éditable ; **aucune ligne, prix, clause, prestation achetée, abonnement, blueprint ou Projet créée implicitement**.
- La **première offre pertinente du Devis** oriente le classement des recommandations ; les besoins Prospect ajoutent du contexte. Le **catalogue complet** reste accessible.
- Modifier les associations/recommandations d'une Offre publiée ne réécrit **jamais** le snapshot ou les devis historiques. Une version future doit être préparée et publiée volontairement.

## 2. Inventaire du code réel et écarts
| Fichier / contrat | Ce qui existe | Limite |
|---|---|---|
| `src/shared/commercial.ts` | `OfferComponentInput` relie `offerVersionId` à `serviceVersionId`, `isOptional`, `quantityMilli`, `sortOrder`. | Couvre **Inclus/Option**, sans rôle autonome « recommandé ». |
| `src/main/commercial/CatalogService.ts` | `setOfferComponents` transactionnel **seulement sur Offre draft**, service de version **published**, quantité positive, retour du composant. | Garder ce mécanisme ; construire un **modèle séparé** pour conseils N:N avec raison/priorité. |
| `CatalogService.setOfferComponents` | Vérification des doublons par **`serviceVersionId`**. | **E104** : deux versions différentes du **même service** pourraient échapper au contrôle ; tester l'unicité par `serviceItemId`. |
| `CatalogService.createVersion` | Recopie la composition de la version précédente vers un nouveau brouillon. | Préserver les références des **versions exactes** au lieu de substituer la version la plus récente. |
| `src/renderer/commercial/CatalogPage.tsx` | Ajout/suppression de services d'Offre brouillon : quantité, optionnalité ; affichage des composants. | Pas d'éditeur constaté de **recommandations motivées N:N**. |
| `src/renderer/crm/ProspectNeedsPanel.tsx` | `SUGGESTIONS: Record<string,string[]>` codé en dur par quelques IDs. Clic = ajout au **besoin Prospect**. | Remplacer par suggestions administrées, **sans transformer un besoin en Devis**. |
| `src/main/commercial/QuoteService.ts` | `addCatalogLine` accepte une **version published** d'item actif et sauvegarde un **snapshot de composants** lorsqu'une Offre entre au Devis. | Ne pas recalculer les options d'un ancien Devis depuis la version actuelle du Catalogue. |
| `QuoteService.selectOfferOption` | Achat d'une option **du snapshot** via `sourceOfferLineId + sourceComponentId`, ligne Devis distincte, journal/provenance et prévention du doublon au rejeu. | **Réutiliser** pour les options, ne pas les acheter via un ajout générique qui perdrait la provenance. |
| `QuoteService.deselectOfferOption` | Retrait de l'option achetée si Devis encore éditable. | Respecter le verrouillage/acceptation et les clauses. |
| `QuoteOfferOptionsPanel.tsx` | Montre « Services obligatoires inclus », « Options disponibles / achetées », détails, actions « Ajouter au devis » sur Devis éditable. | **Mécanisme option déjà opérationnel** ; le volet recommandation reste un chantier supplémentaire. |
| `QuotesPage.tsx` | Ajout volontaire d'autres versions publiées via `quotes.addCatalogLine`. | Pour un **complément recommandé libre**, utiliser ce chemin sans usurper une origine d'option. |

## 3. Modèle conceptuel des trois relations
| Rôle UI | Source de vérité | Devis | Projet préparatoire |
|---|---|---|---|
| **Inclus** | `OfferComponent.isOptional=false` sur version de l'Offre | Couvert par la ligne Offre ; pas une seconde ligne payante par défaut | Contributions réellement incluses selon le snapshot et les règles du blueprint |
| **Option disponible** | `OfferComponent.isOptional=true` | « Disponible, non achetée », puis achat volontaire via `selectOfferOption`, provenance figée | Uniquement après sélection et présence réelle d'une ligne option achetée |
| **Complément recommandé** | **Nouvelle association commerciale administrable**, distincte des composants `OfferComponent` | Conseil et motif ; ajout volontaire via ligne de version publiée ; pas de somme implicite | **Aucune contribution** tant que non ajouté au Devis |

Les libellés « inclus / option / recommandé » décrivent **l'UI cible**, pas trois valeurs SQL actuellement disponibles. Ne jamais transformer « recommandé » en `isOptional=true` par commodité.

## 4. Administration cible : Offres & Tarifs → Associations
- Sur **Offre/version brouillon** : trois groupes lisibles **Inclus**, **Options proposées**, **Compléments recommandés**, avec version, quantité/prix, compteur et actions adaptées.
- Rechercher un Service depuis le catalogue entier (catégorie métier, nom, mots-clés selon modèle), afficher statut/versions/prérequis et éviter un deuxième item.
- Ajouter/retirer « Inclus » ou « Option » via **`setOfferComponents`** avec confirmation du vrai effet et protection des brouillons.
- Éditer une règle « Recommandé » avec au minimum **source offre/version**, **service cible/version**, **motif interne**, **priorité**, **état**, **conditions/compatibilités si disponibles**, origine humaine et dates.
- La prestation peut être recommandée depuis **plusieurs Offres** ; la règle appartient au contexte offre/version, pas à une duplication du Service.
- Publication : nouvelle version/règle, lecture seule sur versions publiées, historique des liens et contrôle des dépendances. Le texte d'aide interne et les CGV restent séparés.
- Si la prestation est déjà **incluse**, le conseil ne propose pas de second achat. Si c'est une **option de l'offre**, la commande d'achat respecte la provenance de ce composant.
- Si Service/Version devient indisponible : prévenir, exclure des **nouveaux achats**, préserver les anciennes lignes et snapshots.

## 5. Règle de sélection et déduplication
1. Dans un Devis, détecter l'**Offre principale** : proposition de convention = **première ligne d'Offre** dans l'ordre des lignes, même si une ligne Service la précède. Si plusieurs Offres, expliquer laquelle sert au classement ; ne pas figer cette convention sans validation technique.
2. Compléter avec les **besoins Prospect explicitement enregistrés** ; aucune inférence opaque sur une entreprise ou un secteur.
3. Trier selon priorité/motif d'association déclaré, puis ordre stable et **nom FR**. Les versions cibles admissibles doivent être clairement déterminées.
4. **Dédupliquer par `serviceItemId`**, même si plusieurs Offres ou versions proposent le même complément. Afficher les motifs multiples au besoin.
5. Séparer **Déjà inclus / Option disponible / Déjà ajouté / Recommandé**, et exclure du bouton « Ajouter » les services incompatibles, inactifs, versions brouillon/retirées et ceux déjà achetés.
6. **Ne jamais cacher le catalogue complet** en l'absence de recommandations. L'absence de raison connue ne devient pas une promesse commerciale.
7. Une option achetée conserve la clé **ligne Offre + composant snapshot**, un service recommandé ajouté librement conserve sa **ligne Catalogue + version exacte**, sans origine d'option inventée.

## 6. Trois usages, trois actions différentes
| Écran | Présentation | Action humaine |
|---|---|---|
| **Catalogue administrateur** | Composer Offres, voir versions et recommandations/motifs | Sauvegarder explicitement le brouillon de lien, puis publier selon service |
| **Prospection / Besoins** | Suggestions explicables « Pourquoi proposer ? », inclus/exclus, aide `?` | **Ajouter aux besoins** ; aucun Devis/Client/Projet automatique |
| **Devis** | Composition figée, options disponibles et compléments pertinents | **Ajouter l'option au devis** par `selectOfferOption` ; autre complément par **`addCatalogLine`** avec version publiée et prix explicite |

Les CGV spécifiques s'appliquent uniquement selon les **lignes réellement retenues et composantes contractuellement applicables**. Le Projet prévisionnel reprend **les lignes courantes** et leurs versions, pas les suggestions ignorées.

## 7. Exemples pour l'atelier — illustratifs, pas ajoutés au Catalogue
| Offre source | Complément envisageable | Contrôle préalable |
|---|---|---|
| Site vitrine | Création de contenu ou SEO local | Ne pas suggérer en supplément un service déjà **inclus dans la formule publiée** |
| Site e-commerce | Fiches produits, maintenance ou accompagnement WooCommerce | S'il existe comme **option** de la version de l'Offre, utiliser la procédure d'option |
| Site mariage | Retouche photo, adaptation de visuels | Conseil volontaire ; aucune ligne ajoutée au devis sans choix |
| Maintenance WordPress | Pack d'heures ou intervention supplémentaire, sous réserve des offres présentes | Ne pas créer abonnement, quota, intervention ni période opérationnelle sur simple conseil |

Les **tarifs, inclusions et associations réelles** proviennent du catalogue versionné, jamais d'un exemple rédigé dans ce dossier.

## 8. Déroulement technique proposé après autorisation
| Phase | Travail | Preuve demandée |
|---|---|---|
| 04D.1 | Inventorier composants d'offres, suggestions codées, provenances d'options, clients des API et tests | Matrice `Offre/version → Service/version → quote snapshot → action → test` |
| 04D.2 | Proposer schéma minimal de **recommandations N:N versionnées**, distinct de `OfferComponent`, avec provenance/motif/ordre/état/compatibilité et politique de version | Migrations SQLite à blanc, contrat API, refus/rollback et conservation des historiques |
| 04D.3 | Concevoir l'onglet Associations et simulation en prospection/devis | Maquettes 3 thèmes × 3 densités, clavier, aide `?` |
| 04D.4 | Remplacer progressivement `SUGGESTIONS` par source catalogue éditable en Prospection | Suggestion explicable, ajout au besoin seulement, sans doublon |
| 04D.5 | Intégrer les conseils dans Devis sans changer les options existantes | `selectOfferOption` pour composition, `addCatalogLine` pour recommandé libre ; garde idempotence |
| 04D.6 | Vérifier CGV, révisions de Devis et Projet prévisionnel avec snapshots immuables ; recette et retour arrière | Suite de tests réels, fixtures isolées, zéro accès Validation-MSI |

## 9. Matrice de recette (26 scénarios proposés, **non exécutés**)
| ID | Scénario | Attendu |
|---|---|---|
| R04D-01 | Associer le même Service à deux Offres | Une identité Catalogue, deux associations ; pas de copie |
| R04D-02 | Ajouter Service inclus à Offre brouillon | Version Service publiée, quantité/ordre, `isOptional=false` |
| R04D-03 | Ajouter Service comme option à Offre brouillon | `isOptional=true`, visible **non acheté** |
| R04D-04 | Éditer la composition d'une Offre publiée | Refus service, créer une nouvelle version |
| R04D-05 | Ajouter deux versions différentes du même service à une Offre | Détecter conflit par `serviceItemId`, pas seulement par version |
| R04D-06 | Ajouter complément recommandé avec motif | Conseil seulement, aucune composition ou vente modifiée |
| R04D-07 | Même complément recommandé par plusieurs Offres | Une prestation affichée avec origines/motifs lisibles |
| R04D-08 | Modifier recommandation publiée | Version/trace explicite, anciens Devis inchangés |
| R04D-09 | Archiver service recommandé | Nouveau conseil d'achat indisponible, historique conservé |
| R04D-10 | Prospect reçoit suggestion depuis besoin enregistré | Motif expliqué, bouton **Ajouter aux besoins** |
| R04D-11 | Prospect lit une suggestion sans la sélectionner | Aucune ligne Devis, Client ou Projet créé |
| R04D-12 | Cliquer deux fois sur ajout de besoin | Pas de deux besoins identiques pour le même article |
| R04D-13 | Devis avec un Service en ligne 1 et une Offre en ligne 2 | Recommandations issues de l'Offre réellement identifiée |
| R04D-14 | Deux Offres suggèrent même Service | Pas de doublon de proposition, raisons consultables |
| R04D-15 | Service recommandé déjà inclus dans Offre | Badge **Inclus**, pas de double achat proposé |
| R04D-16 | Acheter une option depuis composition d'offre | `selectOfferOption`, ID composant exact et lien d'origine |
| R04D-17 | Rejouer le même achat d'option | Même Devis, aucune ligne optionnelle doublée |
| R04D-18 | Retirer option sur Devis éditable | Une seule option retirée, autres lignes intactes |
| R04D-19 | Retirer option d'un Devis figé/accepté | Refus service, aucun changement contractuel |
| R04D-20 | Ajouter librement complément recommandé | Ligne de **version publiée exacte** uniquement après clic |
| R04D-21 | Conseil concernant service déjà présent dans Devis | Badge **Déjà ajouté**, aucun second achat suggéré |
| R04D-22 | Recommandation vers service inactif/version `retired` | Pas d'ajout commercial nouveau automatique |
| R04D-23 | Ancien snapshot sans `componentId` | Pas d'origine optionnelle reconstituée artificiellement |
| R04D-24 | Devis contenant option achetée puis pré-projet | Seules lignes retenues et composants inclus applicables sont projetés ; pas les suggestions |
| R04D-25 | Clavier, petite fenêtre, trois thèmes × trois densités | Inclus, option et recommandé compréhensibles sans couleur seule ; Compact >=14 px |
| R04D-26 | Tests SQLite, service, Devis, CGV et Projet sur fixtures | Intégrité/rollback, journaux et SHA réels, Validation-MSI intacte |

## 10. Écarts de conception encore à instruire
- **E104 — Dédoublonnage par prestation :** la composition actuelle vérifie `serviceVersionId`, pas une unicité par `serviceItemId` à travers les versions. Préciser le traitement voulu sans casser les Offres historiques.
- **E105 — Structure des recommandations :** champs source offre/version, destination Service/version, motif, priorité, état, conditions, provenance. Une extension Service→Service serait une fonction distincte à auditer.
- **E106 — Source partagée :** remplacer les `SUGGESTIONS` codées en dur par un service administrable consommé par Prospect/Devis, sans changer la signification des besoins.
- **E107 — Offre principale :** convention technique proposée = première ligne d'Offre dans le Devis, avec gestion explicite des Devis multi-offres ; à confirmer lors du développement.
- **E108 — Provenance d'achat :** garder `QuoteOptionPurchase` pour option de composition, et ne pas fabriquer cette origine pour un complément libre.
- **E109 — Compatibilités et déduplication :** versions différentes du même item, inclus/option/déjà acheté, états non publiés, prix, contraintes et motifs.
- **E110 — Versionnement et historique des conseils :** conservation des règles et éventuel motif présenté, sans transformer un conseil interne en preuve contractuelle.

**Lot 04D « prêt pour développement »** uniquement après validation du modèle de recommandation, des choix E104/E107, du parcours visuel et de la migration, puis accord spécifique d'AtoumWeb. **Ce document ne modifie aucun contrat, Devis, Projet, API, test ou donnée métier.**

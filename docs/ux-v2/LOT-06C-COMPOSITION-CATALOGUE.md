# Lot 06C — Composition du Devis, catalogue, options et prix

**Statut : cahier des charges documentaire, tests non exécutés.** Audit `main@eb252d5c` (09/10/2026).  
Dépendances : [04A modèle Catalogue](LOT-04A-MATRICE-CATALOGUE.md), [04D associations](LOT-04D-ASSOCIATIONS-RECOMMANDATIONS.md), [04E aides](LOT-04E-AIDES-COMMERCIALES.md), [06A](LOT-06A-MATRICE-DEVIS-ET-ETATS.md), [Lot 05 CGV](LOT-05-CONTRATS-CGV.md).

## 1. Délimitation métier
**Besoin Prospect ≠ conseil/recommandation ≠ service inclus ≠ option disponible ≠ prestation ajoutée au Devis ≠ prestation acceptée.** Le Devis ne comporte que les lignes expressément choisies et les composants inclus de leurs versions applicables ; le Projet provisoire n'exploite que ce périmètre.

## 2. Source de vérité
- `CatalogItem` = **offre ou service** ; `CatalogVersion` = tarif, périmètre, code, version, règles et composants.
- `QuoteLine` = snapshot de la **version choisie** : `catalogVersionId`, `quantityMilli`, prix catalogue, prix proposé, `adjustmentMode/Value`, motif, total et origine. Ne pas substituer le tarif actuel à une ligne déjà enregistrée.
- Modes de remise existants `none/percent/fixed_amount/override_price/free`, motifs `negotiated/commercial_gesture/pilot_client/partnership/loyalty/pack/other`. **L'éditeur doit conserver ces modes et justifications**, et permettre l'accord humain sur le prix.
- Les options de l'offre figurent dans **son snapshot** : une option non achetée ne crée ni montant ni CGV ; achat via `selectOfferOption(offerLineId, componentId)`, provenance `QuoteOptionPurchase` et ligne distincte.
- Compléments recommandés (04D) : conseils futurs éditables, **sans achat** tant que l'utilisateur n'ajoute pas le service via `addCatalogLine`/création du Devis.
- `CommercialScope` et l'aide `?` doivent refléter le **texte de la version exacte**, sans injecter du conseil interne dans le PDF client ni dans la clause CGV.

## 3. Picker de catalogue — interface V2
| Zone | Cible | Protection |
|---|---|---|
| **Offres principales** | Site vitrine, Site e-commerce, Site mariage, Maintenance WordPress, puis autres offres | Afficher seulement les offres/version réellement publiées et sélectionnables |
| **Services complémentaires** | Catégories métiers FR A–Z, recherche par nom, besoin, mots-clés et code technique en recherche secondaire | Un item a **une catégorie principale**, associations multi-offres sans duplication |
| **Inclus dans l'offre** | Composants obligatoires + quantité, affichage informatif | Pas de deuxième ligne payante implicite |
| **Options disponibles** | Prix et version du snapshot Offre, bouton **Ajouter au devis** explicite | Provenance `sourceOfferLineId/componentId`, anti-double clic |
| **Compléments recommandés** | Motif, pertinence et `?`, provenant d'associations administrables 04D futures | Jamais sélectionnés, vendus ou insérés automatiquement |
| **Lignes libres** | Texte, unité/quantité, prix et notes adaptées au contexte | Enregistrer une ligne libre sans prétendre qu'elle possède un code Abby canonique |

## 4. Prix, remises et dédoublement
- Afficher **prix catalogue / prix proposé / ajustement et motif / total de ligne** séparément. Ne jamais arrondir silencieusement autrement que par les règles serveur de centimes.
- Prix sur devis (`quote_only`), tiers à coût réel (`actual_cost`) : montant à compléter par l'utilisateur ; jamais prix fictif « 0 € » prétendument contractuel.
- Différencier **remise sur prestation** et **option de service** : une remise n'ajoute pas un nouveau service, et le prix total suit le moteur `QuoteService.calculateLine/recalculate`.
- Déduplication **informative et contextualisée** : deux lignes du même service peuvent être légitimes si quantités, destinations ou prestations différentes ; ne pas les supprimer automatiquement. En revanche, ne pas proposer deux fois une option achetée de la même offre/composant.
- **E151** : l'étape 6 de l'assistant doit afficher le prix **proposé** de l'étape 3, pas seulement `catalog.currentVersion.priceCents`. Tous les totaux de prévisualisation doivent correspondre à ceux réellement enregistrés.
- Modification d'une ligne peut affecter les clauses CGV, contributions du Projet prévisionnel et conditions : alerte **Devis modifié, synchroniser la préparation** ; pas de mutation du Projet sans action humaine.

## 5. Séquence sûre des actions
1. Rechercher la prestation dans le catalogue **publié et actif** ; version sélectionnée visible.
2. Examiner inclus/exclus, mode tarif, dépendances et éventuel complément conseillé.
3. Ajouter ou sélectionner la ligne **explicitement** ; valider quantité, prix, ajustement et motif (aucune commande implicite par suggestion).
4. Rafraîchir les totaux et la liste du Devis depuis le **retour de `QuoteService`**, ne pas annoncer succès avant persistence.
5. Si un Devis est **finalisé/accepté**, édition directe **refusée** : créer une **révision du même dossier** ou nouvelle copie selon l'intention.
6. En cas d'erreur ou de conflit IPC, conserver données saisies et l'état de la ligne jusqu'à reprise, sans seconde création accidentelle.

## 6. Recette (18 tests futurs, non exécutés)
| ID | Cas | Attendu |
|---|---|---|
| R06C-01 | Choisir offre principale publiée | Version + périmètre exacts |
| R06C-02 | Prix proposé différent du catalogue | Aperçu avant création et devis identiques |
| R06C-03 | Prestation `quote_only` sans prix | Alerte, non assimilée à gratuite |
| R06C-04 | Ajouter Service inclus dans Offre | Pas de ligne payante en doublon automatique |
| R06C-05 | Consulter option non achetée | Total/CGV inchangés |
| R06C-06 | Acheter option puis rejouer | Une ligne, origine snapshot |
| R06C-07 | Retirer option avant finalisation | Ligne retirée selon service, CGV resynchronisées |
| R06C-08 | Option historique sans ID composant | Pas de fausse provenance créée |
| R06C-09 | Conseil « SEO local » ignoré | Pas de Need/ligne/Projet nouveau |
| R06C-10 | Conseil ajouté volontairement | Ligne créée avec la bonne version publiée |
| R06C-11 | Modifier quantité d'une ligne | Recalcul serveur et justification conservée |
| R06C-12 | Remise en pourcentage avec motif | Valeur en centimes, raison stockée |
| R06C-13 | Prix personnalisé et coût tiers réel | Pas de montant inventé |
| R06C-14 | Deux lignes même prestation, usages différents | Conserver si volontaire, alerter si duplicata non souhaité |
| R06C-15 | Retirer prestation déclenchant une clause | Signalement sync CGV sans perte de personnalisation |
| R06C-16 | Devis avec Projet prévisionnel déjà créé | Alerte de changement, pas d'effacement automatique du Projet |
| R06C-17 | Modifier Devis finalisé | Refus de modification en place, révision prévue |
| R06C-18 | Filtres, thèmes/densités et SQLite fictif | Aucun doublon involontaire ni perte, tests à réaliser |

## 7. Points de conception ouverts
**E159** schéma d'association recommandations N:N de 04D ; **E160** règle de déduplication informelle versus métier pour lignes similaires ; **E161** cohérence exacte du preview/client avec snapshots de prix ; **E162** actions de synchronisation CGV/Projet consécutives aux changements, sans cascades de données ; **E163** garanties de source/version des suggestions et options.

**Ce document ne crée aucun nouveau tarif, ligne, contrat ou projet.**

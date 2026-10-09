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

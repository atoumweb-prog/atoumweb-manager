# Lot 04F — Prépublication, vérifications croisées et recette du Catalogue

**Statut : plan de validation documentaire, NON exécuté et non implémenté.**
**Code de référence : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, audit ciblé du 09/10/2026.** Relever le HEAD réellement intégré avant développement.
**Références :** [Lot 04](LOT-04-CATALOGUE.md), [04A — état réel](LOT-04A-MATRICE-CATALOGUE.md), [04B — navigation](LOT-04B-NAVIGATION-CATEGORIES.md), [04C — éditeur et versions](LOT-04C-EDITEUR-VERSIONS.md), [04D — associations](LOT-04D-ASSOCIATIONS-RECOMMANDATIONS.md), [04E — aide](LOT-04E-AIDES-COMMERCIALES.md), [contrats 05](LOT-05-CONTRATS-CGV.md), [devis 06](LOT-06-DEVIS-ABBY.md), [pré-projet 07P](LOT-07-PROJET-PRE-SIGNATURE.md), [01E — sorties non enregistrées](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Conditions de passage entre les états
Une fiche catalogue possède des **états différents** qu'il ne faut pas fusionner :
- **Item `active/inactive/archived`** : autorisation générale de sélection dans les listes et la vente.
- **Version `draft/published/retired`** : contenu commercial/version exactement proposé.
- **`visiblePublic`** : signal de visibilité publique, **pas une publication de page WordPress**.
- **Ligne de Devis** : prestation explicitement ajoutée et versionnée, **pas signature**.
- **Devis signé/accepté dans Abby** : engagement commercial confirmé par processus distinct, snapshots et clauses figés, Client et Projet selon services.

**Publier la version commerciale ne doit déclencher ni création de Devis, ni Client, ni Projet, ni facture/abonnement, ni page WordPress.** Modifier des paramètres de vente ne réécrit aucun contrat signé.

## 2. Audit existant → capacités de contrôle à compléter
| Capacité | Existant constaté | Écart / exigence |
|---|---|---|
| Créer | `CatalogService.create` crée l'item et une première version brouillon. | Afficher le vrai retour de service, pas « publié » avant action. |
| Versionner | `CatalogService.createVersion` recopie des liens (compositions, règles commerciales, CGV/contrats, blueprints selon source). | Avertir que ces **copies** doivent être revues quand une version change ; ne pas présumer compatibilité automatique. |
| Publier | `CatalogService.publishVersion` publie et retire la version publiée précédente, journalise. | Préciser critères de blocage/avertissement et droits, **sans prétendre** que tout contrôle légal est déjà livré. |
| Compositions | `setOfferComponents` sur **offre brouillon** uniquement ; Service version publié exigé. | Vérifier compatibilité, duplications par service, versions retirées et options non achetées. |
| CGV | `CatalogContractPanel` associe types et clauses en contexte d'une version. | Vérifier existence/version/applicabilité ; toute qualification **juridique** exige revue des textes et décisions spécifiques du Lot 05. |
| Aides | `internalAdvice` et `commercialParameters` décrivent partiellement le champ commercial. | Structurer selon 04E sans utiliser texte de conseil comme clause contractuelle. |
| Production | Liens vers blueprints et modèles opérationnels versionnés. | Leur applicabilité doit correspondre à l'offre et à ses lignes vendues ; **ne pas** déclencher de génération automatique à publication. |
| Prix | Modes et centimes, périodicité, coût tiers réel, paramètres commerciaux. | Contrôler unités et conditions, distinguer abonnement opérationnel et facturation, ne pas inférer TVA/HT sans règle. |
| Statut archive | `setStatus` modifie le statut item, versions conservées. | Conserver devis/projets existants, éviter suppression physique avec liens et historique. |

## 3. Checklist de prépublication selon la prestation
Chaque rubrique retourne **OK / À vérifier / Manquant / Non applicable**, source de contrôle et commentaire, pas un « conforme » global trompeur.

| Domaine | Contrôle typique | Effet proposé |
|---|---|---|
| Identité | Nom, type `offer/service`, code interne, catégorie principale, unicité | Bloquant **si** identité invalide ou collision réelle |
| Version | Brouillon courant et numéro, historique exact, origine | Bloquant si action sur une version non modifiable ou périmée |
| Tarif | Prix/mode/unité/quantité, prix sur devis, coût tiers `quote_only` | Bloquant si contradiction calculatoire ; vérification si élément non requis |
| Périmètre | Description, inclus, exclus, prérequis, prestations promises | Avertissement/revue humaine ; bloquant seulement selon règle métier explicite |
| Offre & options | Services publiés/admissibles, quantités, inclusion, option, duplications | Bloquant pour référence cassée, statut incompatible ou version non autorisée |
| Recommandations 04D | Motif/pertinence, compatibilité, statut, déduplication | N'empêche pas publication si conseil facultatif non applicable ; bloque seulement incohérences réelles |
| Aides 04E | Conseils internes, vigilance, utilité, questions, texte client séparé | Avertissement pour aide absente, **pas publication légale automatique** |
| Contrat & CGV 05 | Socle commun, clauses pertinentes, version et validité de la bibliothèque | Contrôle de références ; revue juridique et humain selon texte réel, pas de fausse certification |
| Production 07 | Modèles opérationnels/blueprints si pertinents, version, relations | Bloquant seulement pour produit requérant un modèle pour être exécuté |
| Historique & permissions | Rôle autorisé, diff vs version publiée et empreinte/horodatage | Confirmation humaine, pas d'écrasement concurrent |
| Visibilité publique | Booléen `visiblePublic`, sortie et version | État affiché, **aucun déploiement de site WordPress** |

**Statut de la checklist :** matrice de conception. Les catégories « bloquant » et « simple alerte » exactes devront être décidées sur les services/contrats réels par type de prestation. **Un test automatisé ne peut valider le droit applicable à lui seul**.

## 4. Prévisualisation et confirmation
1. L'utilisateur ouvre un **brouillon** ; le Manager propose le récapitulatif de la version, des associations et de ses contrôles.
2. Un tableau de **différences** affiche ajout/retrait/modification de prix, inclusions, exclusions, composants, références CGV, aides et production, avec une alerte sur les versions sources périmées.
3. Les éléments bloquants empêchent réellement `publishVersion` **après validation de leur règle par le métier** ; les avertissements nécessitant revue humaine sont visibles, non silencieusement effacés.
4. L'action **« Publier cette version »** demande confirmation et indique l'effet : nouvelle version publiée, précédente retirée ; aucun devis existant modifié.
5. Le résultat **succès** n'est montré **qu'après confirmation par le service**. Erreur/échec → brouillon et sélection conservés, aucune version prétendument publiée.
6. L'interface affiche version/status/dernière publication, auteur/source si disponibles, et reprend des données à jour après l'opération.
7. Un Devis créé **après** publication utilise la version explicitement sélectionnée. Un Devis antérieur conserve prix, périmètre et références de **sa propre version/snapshot**.
8. Le bouton **« Archiver l'item »** est une action distincte, confirmée et contrôlée ; ne pas supprimer physiquement des références vendues.

## 5. Conduite de l'intégration, sans interrompre les autres PR
- PR de conception #82 = référentiel seul ; **aucune** modification du code métier dans ce document.
- CI #84 sur son propre périmètre : un run vert ne prouve pas la V2 ; reprendre les éventuelles intégrations #81/#83 **dans leur ordre et seulement sur approbation**.
- Les futurs sous-lots Catalogue pourront être séparés en PR de code : catégorie/référentiel de tags, recommandations N:N, éditeur d'aides, migration UI/validation ; aucun chantier ne doit **réécrire le moteur de devis et son comportement optionnel déjà vérifié**.
- **Validation-MSI jamais utilisée pour démo, tests ou migrations**, seulement fixtures fictives isolées et restaurables.
- Démonstration UI non mutante (pas de `DemoPanel` réel appelant `createDemo/resetDemo` dans la base utilisée en production).

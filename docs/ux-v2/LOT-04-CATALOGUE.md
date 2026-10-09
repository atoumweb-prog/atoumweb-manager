# Lot 04 — Administration complète des offres, formules et services
**Statut : spécification cible. Source normative détaillée : [CATALOGUE-CGV.md](CATALOGUE-CGV.md).**
## Objectif
Une administration complète des fiches et catégories, sans intervention sur le code pour ajouter, modifier, désactiver ou archiver une prestation.
## Vue par défaut
Offres principales d'abord : Site vitrine, Site e-commerce, Site mariage, Maintenance WordPress ; autres offres existantes accessibles. Services complémentaires ensuite, **catégories en A–Z français et services en A–Z français**. Codes Abby secondaires, recherche nom/besoin/bénéfice/mots-clés ; code exact possible.
## Une seule source et trois usages
- Administration : consulter, éditer, créer, dupliquer, publier, versionner, archiver et réactiver.
- Prospection : parcourir pour identifier les besoins ; inclus/exclus et `?` ; aucune ligne vendue automatiquement.
- Devis : première ligne priorise recommandations cohérentes ; catalogue complet toujours accessible ; ajout volontaire uniquement.
## Fiche intégralement administrable
Identité, catégorie principale, mots-clés, Tarifs & Abby, Contenu (inclus/exclus), Formules, Associations de compléments, Aide à la vente, **Contrat & CGV**, Production/blueprints, Historique.
Une seule catégorie principale ; plusieurs liens offre→service, sans dupliquer les références.
## Aides
Éditer utilité, bénéfices, quand proposer, questions, argumentaire, vigilance, inclusions/exclusions ; séparer aide interne / description client. Historiser les versions ; restauration initiale avec confirmation.
## États et sécurité
Brouillon, publication volontaire, désactivation/archivage ; suppression uniquement sans liens historiques protégés. Édition versionnée des prix/conditions, jamais rétroactive.
## Ordre proposé
[04A inventaire réel](LOT-04A-MATRICE-CATALOGUE.md) ; [04B navigation/offres/catégories](LOT-04B-NAVIGATION-CATEGORIES.md) ; [04C éditeur/versionnement/publication](LOT-04C-EDITEUR-VERSIONS.md) ; [04D associations et recommandations](LOT-04D-ASSOCIATIONS-RECOMMANDATIONS.md) ; **04E** aides éditables ; **04F** contrôles et recette. **04A–04D = documentation rédigée uniquement**, aucune migration ou fonctionnalité V2 livrée.

**Précision produit :** « Services complémentaires » est une **section visuelle** ; chaque service garde sa **catégorie métier principale propre**, triée avec ses pairs en A–Z français. Ne pas imposer une catégorie technique unique à tous.
## Recette
Créer un nouveau service entièrement depuis l'UI, catégorie unique, aide et association, recherche normale/code Abby, publier après précontrôles, utiliser en Prospection sans achat, insérer en devis, archiver sans toucher les documents figés.
## Dépendance
Lot 05 contractuel pour publier un service requérant des clauses ; ne pas simuler qu'une clause est juridiquement validée.

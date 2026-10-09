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

## 6. Ordre de développement recommandé
| Phase | Travaux futurs | Preuves |
|---|---|---|
| 04F.1 | Cartographier toutes les validations existantes (`CatalogService`, contrats, Devis, blueprints) et vérifier HEAD/PR de référence | Matrice `champ → garde existante/manquante → service → test` |
| 04F.2 | Arrêter les conditions bloquantes/avertissements **par type de prestation** avec AtoumWeb et revue juridique adéquate | Checklist métier versionnée, exclusions légales documentées |
| 04F.3 | Construire une prévisualisation du changement, des copies de liens et de l'effet sur les futures ventes | Atelier sans écriture réelle, aperçu/versions, UI 3×3 |
| 04F.4 | Implémenter les contrôles pertinents **au service** et les messages au front | Transaction/validation serveur, UI pas seule source d'autorisation |
| 04F.5 | Rejouer les parcours Prospection → Devis → options/compléments → Projet prévisionnel → acceptation | Lignes/versions exactes, contrats et provenance, aucune rétroactivité |
| 04F.6 | Typecheck, tests ciblés puis complets, recette réelle, CI du SHA d'intégration et revue humaine avant fusion | Matrice tests/logs et retour arrière, aucune mutation Validation-MSI |

## 7. Recette transverse du Catalogue (25 cas proposés, **non exécutés**)
| ID | Situation | Attendu |
|---|---|---|
| R04F-01 | Créer Offre puis Service depuis l'administration | Deux articles propres avec première version brouillon, aucune vente |
| R04F-02 | Créer/renommer catégorie en français | Association non perdue, tri A–Z en FR, anciens Devis inchangés |
| R04F-03 | Recherche dans Offres & Tarifs | Nom/besoins/mots-clés selon index réellement livré, code Abby secondaire |
| R04F-04 | Publier une prestation prête | Version `published`, ancienne `retired`, aucune publication WordPress |
| R04F-05 | Publier item sans modèle non applicable | Ne bloque pas injustement une prestation ne requérant pas de blueprint |
| R04F-06 | Publier avec composant Service `draft` | Refus des références non admissibles, brouillon et versions préservés |
| R04F-07 | Modifier prix d'une offre déjà publiée | Nouvelle version, Devis précédents inchangés |
| R04F-08 | Editer une offre ayant des clauses CGV | Liens versionnés contrôlés ; aucun label « juridiquement conforme » sans revue |
| R04F-09 | Ajouter Service inclus et optionnel | Les rôles sont distincts et persistants dans la composition |
| R04F-10 | Deux versions du même Service dans la même Offre | Pas de double inclusion accidentelle après règle E104 résolue |
| R04F-11 | Ajouter recommandation N:N avec motif | Conseil affichable en Prospect/Devis, **aucune ligne ajoutée** |
| R04F-12 | Prospect consulte et ajoute conseil aux besoins | Un Need, pas de Devis ni de Projet créé |
| R04F-13 | Créer Devis depuis les besoins après choix explicite | Lignes correctes avec versions et quantités ; suggestions ignorées absentes |
| R04F-14 | Ajouter option depuis snapshot de l'Offre au Devis | `selectOfferOption` + origine composant + une seule ligne |
| R04F-15 | Ajouter complément recommandé libre | `addCatalogLine` volontaire, bonne version, absence de doublon trompeur |
| R04F-16 | Abandonner un devis non signé | Aucun Client/contrat accepté/projet opérationnel |
| R04F-17 | Préparer Projet depuis devis non signé | Projet `provisional` seulement sur lignes et inclusions applicables |
| R04F-18 | Modifier le devis en profondeur | Comparaison + adapter/repartir de zéro sécurisé (07P), zéro perte silencieuse |
| R04F-19 | Accepter devis Abby après résolution | Client exact, Projet courant figé, CGV/versions acceptées préservées |
| R04F-20 | Désactiver/archiver Service vendu dans ancien Devis | Pas de nouveau choix commercial, document historique toujours lisible |
| R04F-21 | Perte de connexion au clic Publier | Pas de faux succès ni nouvelle version supplémentaire au rejeu |
| R04F-22 | Quitter éditeur dirty par recherche ou navigation | Garde UX-01, texte et fiche conservés sur « Rester » |
| R04F-23 | Désactiver aide au survol dans les trois thèmes | `?` disponible par clic/clavier, aide non injectée au contrat |
| R04F-24 | Trois thèmes × trois densités, 1280×720, zoom/clavier | Tous les contrôles accessibles, Compact texte fonctionnel >=14px |
| R04F-25 | Migrations/test suites et rollback sur fixtures | FK et intégrité, aucune donnée Validation-MSI touchée, rapport SHA |

## 8. Dossier de preuves attendu à chaque PR de code
- **SHA de base, branche, fichiers et migrations exacts**, versions de Node/Electron/SQLite, portée de l'atelier.
- **Matrice des écrans** catalogue/Prospect/Devis/Projet/CGV et preuves que les actions sont **réellement connectées** aux services.
- **Liste des tests exécutés** (ciblés, complets, UI 3×3, CI hébergée si requise), résultats/temps/échecs et cas non couverts. Les tableaux R04A–F sont des **tests projetés**, pas des résultats d'exécution.
- **Mesures de compatibilité** : aucune prestation vendue ou devise acceptée mise à jour rétroactivement, signatures/CGV/historiques conservés, idempotence options et pré-projets.
- **Sécurité/permissions**, données de tests isolées, restauration en cas d'échec et revue humaine du diff avant tout merge.

## 9. Questions techniques à résoudre avant le chantier de code
- **E117** : quelles validations catalogue doivent être bloquantes **au service** versus simple avertissement **dans l'UI**, et pour quelles familles de prestations ?
- **E118** : comment vérifier exactement les références versions de CGV/types de contrat/blueprints recopiées sans prétendre conformité juridique automatique ?
- **E119** : concurrence de publication et comparaison du dernier brouillon à la dernière version publiée ; gestion du retrait et rollback sur échec intermédiaire.
- **E120** : droits de publication, réactivation et archivage selon sécurité effective de l'application, sans ACL fictives.
- **E121** : preuves bout en bout de conservation des snapshots Devis, options achetées, relations Projet avant/après acceptation.
- **E122** : protocole d'atelier isolé et méthode de validation de la matrice **3 thèmes × 3 densités**, sans toucher aux opérations réelles.

**Statut Lot 04A–04F : la spécification détaillée est complète, la conception technique de certains modèles reste ouverte, aucune fonctionnalité V2 ni migration n'est livrée par cette PR documentaire.**

# Lot 04E — Aides commerciales éditables, consultables et versionnées

**Statut : cahier des charges documentaire, aucune interface V2 développée, aucune recette exécutée.**  
**Code consulté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (09/10/2026).**  
**Références :** [Catalogue](LOT-04-CATALOGUE.md), [socle Catalogue/CGV](CATALOGUE-CGV.md), [04C — éditeur](LOT-04C-EDITEUR-VERSIONS.md), [04D — recommandations](LOT-04D-ASSOCIATIONS-RECOMMANDATIONS.md), [03C — Prospect](LOT-03C-FICHE-PROSPECT-BESOINS.md), [06 — Devis](LOT-06-DEVIS-ABBY.md), [05 — Contrats](LOT-05-CONTRATS-CGV.md), [01B — aide et contrôles](LOT-01B-COMPOSANTS-ELEMENTAIRES.md).

## 1. Ce que l'aide commerciale doit réellement apporter
AtoumWeb doit pouvoir expliquer et recommander chaque offre ou service **depuis le Manager, sans modifier le code**. Le commercial trouve rapidement :
- **À quoi sert cette prestation ?**
- **Pour quel besoin / dans quelles situations la proposer ?**
- **Quels bénéfices raisonnables peut-on présenter au prospect ?**
- **Quelles questions poser et quelles informations vérifier ?**
- **Que couvre la prestation et qu'exclut-elle ?**
- **Quelles réserves, dépendances et promesses éviter ?**
- **À quelles autres offres/services l'associer, et pour quelle raison ?**

Ces contenus sont des **conseils internes éditables**, non des déclarations contractuelles, des garanties de résultat ni des devis automatiquement produits. L'aide est accessible par `?` au survol **et au clic/clavier**, même si « aide au survol » est désactivée.

## 2. Inventaire observé dans le code
| Source | Capacités réellement constatées | Limites V2 |
|---|---|---|
| `src/shared/commercial.ts` | `CatalogVersionInput.internalAdvice` (texte libre), `description`, `nature`, `inclusions/exclusions/prerequisites`, `specialTerms`, et `commercialParameters`. | Aucun contrat typé recensé pour **questions à poser, bénéfices, situations, mots-clés, vigilances et liens vers recommandations** comme champs distincts. |
| `src/renderer/commercial/CatalogPage.tsx` | Formulaire Catalogue inclut `internalAdvice`, description, inclus/exclus et termes particuliers dans le brouillon. | Le contenu peut être saisi, mais une édition structurée des sept thèmes et un aperçu multi-écrans ne sont **pas attestés**. |
| `src/renderer/commercial/CommercialScope.tsx` | Affiche `commercialParameters.clientNeed/work/options/quoteRequiredWhen`, `description`, `inclusions/exclusions` dans le contexte commercial. Le commentaire du composant précise que ce sont **des descriptions et non des règles de contrats**. | La vue visible ne couvre pas tous les champs d'aide attendus ni un bouton `?` enrichi. |
| `src/renderer/crm/ProspectNeedsPanel.tsx` | Affiche `CommercialScope` de la version sélectionnée ; un conseil de Service dans `SUGGESTIONS` existe par IDs codés. | Pas de contenu d'aide structuré modifiable depuis la fiche et déployé universellement en Prospection. |
| `src/renderer/commercial/QuoteOfferOptionsPanel.tsx` | Affiche `CommercialScope` d'une option, issue du snapshot Devis ou de la version exacte, avec bouton explicite de sélection si Devis modifiable. | Ajouter l'aide `?` **sans** modifier la provenance d'achat ou rétroactivement remplacer l'ancien snapshot. |
| `src/main/commercial/CatalogService.ts` | `createVersion` produit une nouvelle version, sauvegarde notamment `internalAdvice` ; `publishVersion` active une version. | Un système de **restauration/édition structurée indépendante** de l'aide n'est pas attesté. À concevoir si nécessaire, sans multiplier les versions à chaque frappe. |

**Point de vigilance :** des champs de `commercialParameters` descriptifs existent déjà ; **faire l'inventaire de leurs producteurs et consommateurs réels** avant de créer des doublons `benefits` ou `clientNeed`. La nouvelle interface doit réutiliser les textes appropriés plutôt que les réécrire arbitrairement.

## 3. Structure fonctionnelle de l'onglet « Aide à la vente »
| Rubrique | Usage et contrôle |
|---|---|
| **Utilité / besoin client** | Formulation compréhensible du problème auquel répond la prestation, sans promettre un résultat garanti |
| **Situations pertinentes** | Contextes d'emploi, exigences préalables, non-pertinence éventuelle ; possibilité de plusieurs cas lisibles |
| **Bénéfices possibles** | Arguments plausibles, sans chiffres/performance inventés ; validation humaine des promesses |
| **Questions à poser** | Liste ordonnable, réutilisable en rendez-vous ou qualification ; réponse reste dans le **Prospect**, pas dans le modèle Catalogue |
| **Argumentaire** | Version courte et détaillée, messages internes, points de différenciation |
| **Vigilance / à ne pas promettre** | Dépendances du client, limites, risques, points techniques ou juridiques à vérifier |
| **Inclus / exclus** | **Lecture des éléments de périmètre de version** du Catalogue, ou lien vers « Contenu et périmètre » ; ne pas créer une deuxième source contradictoire |
| **Compléments liés** | Raisons et pertinence issues des associations **04D**, pas un deuxième dictionnaire écrit dans les aides |
| **Mots-clés / synonymes métier** | Recherche en français, indexation seulement sur un champ réellement stocké/testé, sans modifier le code canonique ni Abby |

**Les premières suggestions rédigées par IA peuvent être proposées comme brouillons**, mais doivent rester modifiables, explicables et soumises à relecture humaine. **Ne pas prétendre** que ces brouillons sont automatiquement juridiquement exacts ou correspondent à la prestation vendue.

## 4. Visibilité par contexte et séparation des destinataires
| Écran | Informations attendues | Actions permises |
|---|---|---|
| **Offres & Tarifs / administrateur** | Onglet complet, versions d'aide, état de publication, aperçu court/long, modification explicite | Modifier un brouillon d'aide/version puis enregistrer après confirmation |
| **Prospection / Besoins** | `?` : utilité, bénéfices, questions, vigilances, inclus/exclus, compléments recommandés | Ajouter un besoin au Prospect par une action distincte, **pas de ligne Devis** |
| **Devis** | `?` : périmètre de la version proposée, bénéfices approuvés, points de vigilance de prix et délais, option vs recommandé | Ajouter une prestation au Devis séparément, **sans injeter les conseils internes dans le PDF/CGV** |
| **Documents / Contrats** | Vue des **véritables clauses contractuelles** rattachées à la version | Gérer les clauses dans la bibliothèque CGV dédiée, pas publier des conseils comme clauses |
| **Projet prévisionnel** | Périmètre contractuellement proposé depuis **les lignes du devis courant**, version/snapshot et prérequis utiles à la production | Préparer seulement les composants prévus ; le conseil `?` ne génère aucune tâche |

Si une ancienne version est retirée, les devis historiques affichent leurs **données descriptives figées** ou le contexte identifié avec une mention claire ; **ne pas actualiser silencieusement les conseils passés** à partir de l'aide courante si cela change le sens de la vente.

## 5. Édition, versions et restauration
- Boutons **Modifier l'aide**, **Enregistrer le brouillon**, **Annuler**, **Comparer**, **Voir la version publiée**, **Restaurer le contenu initial** (avec confirmation et **sans altérer la version publiée**).
- **Ne pas inventer** une API `catalog.updateAdvice` tant que le schéma et la politique de version ne sont pas définis : examiner si l'édition suit `CatalogVersion` ou une entité d'aide versionnée attachée à `catalogVersionId`.
- L'état est explicite : *Brouillon non enregistré / en cours / enregistré / publié / obsolète / erreur* ; une préférence de panneau n'enregistre jamais le texte métier.
- Éviter de créer **une nouvelle version à chaque sauvegarde d'une phrase**. L'historisation doit être **comparable** et les éditions de brouillon possibles sans écraser des données commerciales figées.
- Les utilisateurs peuvent **revenir au contenu initial** ou à une version d'aide précédente comme **nouveau brouillon**, avec prévisualisation, jamais en réécrivant les preuves des anciens devis.
- Contrôler les mises à jour concurrentes et effets IPC en retard ; conserver la saisie `dirty` et le même garde UX-01 que les autres éditeurs, sans deuxième registre.

## 6. Présentation et ergonomie
- Aide courte au survol (si activée), **aide complète au clic ou via Entrée/Espace**, indépendamment de l'option `showHoverHelp`. Fermeture via Escape et restitution du focus au bouton `?`.
- Éviter de rendre un `?` opaque : associer un intitulé accessible « Aide à la vente pour [prestation] » sans afficher son code Abby en titre.
- Sur écran compact, afficher la fiche/infobulle avec scroll interne, sans masquer le bouton de fermeture ni l'action du Devis.
- Contrastes et textes fonctionnels >=14px en Compact ; neuf combinaisons de thèmes/densités, modes clavier et souris.
- Distinguer **contenu public/contractuel**, **arguments internes**, **questions de découverte** par libellés et séparateurs, non par couleur uniquement.

## 7. Déroulement technique futur, après décision de développement
| Phase | Action | Preuve |
|---|---|---|
| 04E.1 | Auditer `internalAdvice`, `commercialParameters` et composants `CommercialScope` dans Catalogue, Prospect, Devis et leurs snapshots | Matrice champ → source → écran → droits et non-duplication |
| 04E.2 | Définir le schéma minimal éditable et la politique des versions, sans copier des clauses contractuelles | Contrat API/migration éventuelle, risques devis anciens |
| 04E.3 | Concevoir éditeur d'aide, mode brouillon, prévisualisation et restauration contrôlée | Maquettes compact/confort, refus de perte de saisie |
| 04E.4 | Afficher aide courte/complète depuis Catalogue, Prospection et Devis | `?` au clic/clavier, partage version exacte |
| 04E.5 | Relier les motifs des recommandations 04D, sans génération de ligne ni contrat | Tests de conseils et de séparations des contenus |
| 04E.6 | Tester annulations, copies de versions, recherche, preview et intégrité | Fixtures isolées, typecheck/tests/CI réels, revue humaine |

## 8. Scénarios de recette proposés (18 cas, aucun exécuté)
| ID | Scénario | Résultat attendu |
|---|---|---|
| R04E-01 | Éditer utilité/bénéfices sur une nouvelle prestation | Brouillon éditable, pas de publication automatique |
| R04E-02 | Créer une question de découverte | Modèle d'aide enrichi, aucune réponse Prospect inventée |
| R04E-03 | Enregistrer argumentaire/vigilance | Conseils internes distincts des textes clients |
| R04E-04 | Ajouter une exclusion de prestation | Source unique de périmètre, pas deux versions contradictoires |
| R04E-05 | Afficher « compléments liés » | Réutilise recommandations 04D et leurs motifs, pas un second dictionnaire |
| R04E-06 | Taper dans une aide, fermer puis choisir Rester | Brouillon `dirty` conservé par garde UX-01 |
| R04E-07 | Enregistrer après panne IPC | Erreur affichée, contenu gardé, aucune nouvelle version dupliquée |
| R04E-08 | Demander restauration du contenu initial | Aperçu + confirmation, ancienne version publiée intacte |
| R04E-09 | Comparer deux versions d'aide | Diff lisible, date/source et origine contrôlées |
| R04E-10 | Désactiver aide au survol | `?` reste accessible au clic et au clavier |
| R04E-11 | Lire aide dans Prospection | Intérêt, questions, inclus/exclus de version, aucun achat |
| R04E-12 | Lire aide dans Devis | Bons éléments et version du composant, aucun ajout de ligne |
| R04E-13 | Devis historique lié à ancienne version | Snapshot/ancienne prestation non rétroactivement modifiés |
| R04E-14 | Aide interne contenant une vigilance | Aucune injection automatique dans CGV/PDF destiné au client |
| R04E-15 | Mot-clé commercial français et code Abby | Recherche adéquate après indexation réelle, codes secondaires |
| R04E-16 | Texte de conseil suggéré par IA | Marqué brouillon, relecture humaine requise, pas de validation juridique implicite |
| R04E-17 | Écran étroit et neuf combinaisons thème/densité | Aide lisible et fermable, taille fonctionnelle >=14px |
| R04E-18 | Tests SQLite/versions/contrats/UX-01 | Journaux sur SHA réel, rollback, Validation-MSI intacte |

## 9. Questions ouvertes avant implémentation
- **E111** : reprendre et structurer `internalAdvice` / `commercialParameters` existants ou créer une entité d'aide attachée à la version ? Éviter un modèle en doublon.
- **E112** : définir la bonne granularité d'enregistrement de l'aide pour **ne pas multiplier les versions du Catalogue** à chaque édition.
- **E113** : décider comment comparer/restaurer aide et version initiale avec date/auteur/provenance, sans écraser documents passés.
- **E114** : déployer les mêmes contenus par `?` dans Catalogue, Prospect et Devis tout en respectant les snapshots de versions et les permissions.
- **E115** : recherche par bénéfices/mots-clés **uniquement si données structurées et index réellement livrés** ; pas de promesse de moteur sémantique existant.
- **E116** : frontières exactes entre commentaire commercial, objet du contrat, clauses CGV et Description de Devis ; aucune duplication vivante.

**La conception est complète au niveau fonctionnel ; le schéma d'aide, les écrans et les tests sont encore à développer après arbitrage technique.**

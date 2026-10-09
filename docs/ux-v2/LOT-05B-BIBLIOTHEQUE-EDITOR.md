# Lot 05B — Bibliothèque centrale et éditeur de clauses / types

**Statut : UX/UI V2 documentaire, non implémentée ni testée.** Référence : audit statique `main@eb252d5c` du 09/10/2026.  
Dépendances : [05A état réel](LOT-05A-AUDIT-CONTRACTUEL-EXISTANT.md), [05C classement](LOT-05C-METADONNEES-CLASSEMENT.md), [05D Builder](LOT-05D-BUILDER-RESOLUTION.md), [CATALOGUE-CGV](CATALOGUE-CGV.md), [01E brouillons](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Organisation de l'interface
**Entrée principale** : Documents & Contrats → **Bibliothèque contractuelle** ; raccourcis contextuels depuis Offre/Service → **Contrat & CGV**, Devis → Builder, et Client → Contrats. Une seule bibliothèque d'entités canoniques.

**Mise en page** :
- **Liste gauche** : catégories **Socle CGV / Types contractuels / Clauses spécifiques**, recherche par libellé, code technique, prestation liée, public, statut et version. Possibilité d'archivés, avertissements « publié / brouillon / ancien ».
- **Centre** : titre, objet, version sélectionnée, texte intégral, sections, auteur/provenance/date si conservés, boutons **Agrandir / comparer / ouvrir l'édition du brouillon**.
- **Droite (repliable)** : sources, prestations Catalogue qui utilisent la clause, types liés, rubriques sémantiques, rang, revue documentaire et avertissements (absence de validation juridique, incompatibilités).
- **Pied / barre d'action** : `Enregistrer brouillon`, `Nouvelle version`, `Prévisualiser la référence`, `Publier`, `Archiver`, `Revenir` lorsque l'action existe réellement. Les commandes ne publient rien sans confirmation humaine.

Une même clause peut être rattachée à plusieurs produits, sans clonage silencieux. **Le formulaire d'une prestation choisit une référence de clause**, pas une copie de son texte dans le Catalogue.

## 2. Modèle existant et limites
| Source | État vérifié | UX à raccorder |
|---|---|---|
| `ContractTermsApi.library` | `list/get/create/createVersion/publishVersion/setStatus/setAudience/setCatalogLinks`. | Activer des commandes **sur la bonne clause/version** sans enregistrer à chaque changement de filtre. |
| `ContractClauseTemplate` | `code/title/scope/audience/sortOrder/status/currentVersion/versions/catalogItemIds`. | Montrer statut, public visé, historique et prestations déclenchantes ; tri **par sens métier** futur 05C, pas seulement ordre numérique. |
| `ContractClauseVersion` | `body/status/versionNumber/review`, journal des versions. | Rendu du texte fidèle, nouvelle version plutôt qu'écrasement d'une version vendue ou publiée. |
| `ContractTypeVersion` | `name/description/moduleIds` ordonnés ; API d'`updateDraft`, `publish`, `createVersion`. | Gérer l'ordre visuel d'un type, mais **ne pas confondre** « module dans type » et « clause applicable au devis ». |
| `ContractLibraryPage` | Écrans réels avec liste de types, recherche, modules, brouillons, archivage, aperçu de référence en lecture seule. | Réorganiser l'ergonomie sans supprimer les fonctions ; empêcher les pertes de saisie lors de sélection, mise à jour asynchrone ou repli. |
| `CatalogContractPanel` | Rattache des types contractuels à une **version catalogue** et ouvre la Bibliothèque. | Afficher aussi liens directs d'applicabilité des clauses si permis et la provenance, en un seul point de vérité. |

## 3. Parcours « créer un nouveau type / module / lien »
1. Depuis la bibliothèque, **Nouveau type** : nom, description, code, audience/usage s'il est réellement dans le modèle et liste de modules. Création = **brouillon**, pas contrat publiable automatiquement.
2. **Nouveau module** : identifiant, titre, scope `base/catalog`, public `all/professional/consumer`, texte, revue documentaire éventuelle ; sauvegarder une nouvelle clause et sa version initiale **draft**.
3. **Rattacher à un type** : ajouter la référence de clause, placer le module dans l'ordre du type pour l'aperçu, sans créer de copie ou de règles juridiques de vente.
4. **Rattacher au Catalogue** : choisir la vraie Offre/Service et sa version d'applicabilité, vérifier les liens source, montrer les **autres usages partagés** avant tout changement.
5. **Simuler** une prestation/version et un public en lecture seule. La simulation ne crée **ni devis, ni client, ni projet**, ne change aucune date d'acceptation.
6. **Publier** uniquement la version voulue, avec validation des références et contrôles juridiques appropriés ; ne pas présenter une validation automatique comme suffisante.

## 4. Versions et protection des historiques
- Statut de **template** (`active/inactive/archived`) distinct du statut de **version** (`draft/published/retired`). Une référence historique retirée peut rester consultée depuis un devis figé.
- Une clause publiée utilisée par plusieurs prestations se modifie par **nouvelle version** et revue des impacts. Aucune modification de texte directement sur une version vendue.
- Une mise à jour d'un type de contrat n'ajoute pas rétroactivement de clauses à des devis existants ; seuls des **nouveaux devis** suivent les références actuellement autorisées.
- Un lien de clause vers un produit est une action métier ; changer ce lien peut modifier les **futurs devis**, d'où confirmation et audit nécessaires, sans toucher aux anciens snapshots.
- L'archivage doit conserver l'identité et toutes les références historiques ; la suppression physique est bloquée si une pièce, clause de devis, version ou type en dépend.
- **Revue documentaire** et **publication** sont deux états distincts : un indicateur de revue externe manquante reste visible.

## 5. Garde UX-01 et navigation
- Brouillon `dirty` : avertir avant changement de type, module, version, prestation, recherche ou fermeture ; la sortie par défaut **Continuer la modification**. Une commande « Enregistrer et quitter » seulement si service valide réellement la sauvegarde du brouillon.
- Ne pas réinitialiser `body` ni sélection après une réponse asynchrone tardive de `get` ; tenir compte des IDs/versions.
- **Repli / Agrandir** conserve texte, sélection et scroll ; les aides `?` restent consultables même sans survol.
- **Retour au Catalogue** retrouve la version de prestation et l'onglet Contrat & CGV sans recréer de saisie.
- Aucun `autosave` métier : seules les préférences de disposition, taille et filtres s'enregistrent sans validation.

## 6. Recette prévue (15 scénarios, aucun exécuté)
| ID | Scénario | Résultat |
|---|---|---|
| R05B-01 | Créer un type | Version brouillon sans publication |
| R05B-02 | Créer une clause commune | Scope `base`, public et première version `draft` |
| R05B-03 | Créer une clause prestation | Scope `catalog`, statut/version affichés |
| R05B-04 | Relier clause à deux prestations | Une identité canonique, deux liens sans clones |
| R05B-05 | Relier module à type de contrat | Composition de type ordonnée, pas application forcée |
| R05B-06 | Modifier corps d'une clause publiée | Nouvelle version, source publiée précédente inchangée |
| R05B-07 | Publier nouvelle version | Une version courante, historique conservé |
| R05B-08 | Archiver clause utilisée par devis ancien | Historique accessible, snapshot intact |
| R05B-09 | Filtrer `consumer` et `professional` | Population explicite, pas d'application erronée par la vue |
| R05B-10 | Prévisualiser type avec Offre publiée | Aucune création Devis/Projet/Client |
| R05B-11 | Revenir au Catalogue depuis module | Identifiant Offre/version et onglet restaurés |
| R05B-12 | Changer de module avec texte non enregistré | Garde UX-01 et brouillon conservé |
| R05B-13 | Agrandir / Réduire ou perte connexion | Saisie conservée, message erreur |
| R05B-14 | Aide et opérations en 3 thèmes × 3 densités | Lisible clavier, Compact >=14px |
| R05B-15 | Typecheck/tests SQLite sur fixture et UI | Intégrité des données, aucune Validation-MSI |

## 7. Risques et décisions techniques ouvertes
- **E123** : rangement à gauche catégories/types/clauses sans masquer les fonctions existantes, et navigation/recherche vers bonne entité.
- **E124** : gestion des brouillons et de la **révision concurrente** sur les modules/types depuis Catalogue/Devis.
- **E125** : liens Catalogue vers clause/type ; afficher provenance/version sans multiplier les règles d'applicabilité.
- **E126** : gestion des statuts d'archivage et publication avec références consommées, sans suppression physique.
- **E127** : métadonnées de revues juridiques, auteur et statut documentaire visibles mais jamais supposés validés.

**La bibliothèque V2 est un travail d'ergonomie et de règles d'édition sur des services déjà présents ; pas une nouvelle bibliothèque parallèle.**

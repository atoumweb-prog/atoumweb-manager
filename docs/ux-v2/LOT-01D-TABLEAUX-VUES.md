# Lot 01D — Tableaux, filtres, colonnes et vues personnalisables

**Statut : cahier des charges technique UX/UI, non implémenté.**
**Code de comparaison : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`, inspection statique du 09/10/2026.** Vérifier le HEAD réel et les PR en cours avant exécution.
**Dépendances :** [Lot 01](LOT-01-FONDATIONS.md), [01A](LOT-01A-TOKENS-VISUELS.md), [01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md), [01C](LOT-01C-FICHES-PANNEAUX.md), [Décisions](DECISIONS.md).

## 1. Objectif et décisions déjà validées
Le Manager doit offrir des **listes lisibles et personnalisables** : recherche, filtres, tris, affichage/masquage de colonnes, ordre et largeur des colonnes, adaptation à la taille des fenêtres, vues enregistrées. Les préférences de présentation sont **mémorisées automatiquement** sans toucher aux données métier.

- Les listes peuvent ouvrir une **fiche rapide**, puis **Agrandir** (Lot 01C). Aucun clic sur un tri/filtre/colonne ne valide un Devis, ne consomme un pack et ne transforme un Prospect.
- **Chaque module a un défaut raisonnable**. Un tableau unique ne remplace ni pipeline Kanban, ni éditeur technique, ni builder CGV.
- Le système commun doit **réutiliser les recherches et filtres métier existants**, pas reproduire leurs calculs/permissions dans un simple composant visuel.
- Les réglages de présentation sont sauvegardés automatiquement **par écran et par type de vue** ; une commande explicite restaure les défauts.
- La recherche globale du Manager **reste distincte** des recherches internes des tableaux. Le Lot 01D ne réécrit pas le routage de la recherche globale (Lot 02).
- Les noms, statuts, montants, dates, codes et couleurs ont chacun leur rendu propre ; l'identité d'un Client ou Prospect n'est pas uniquement une couleur.
- **Compact : texte principal cible 14 px**, Confort 16 px, Confort+ 18 px ; aucune petite information fonctionnelle sous 14 px (E01 décidé).

## 2. Existant identifié dans le code (constat statique, pas recette)
| Module | Sources observées | Recherche / filtre actuel repéré | Ce qu'il ne faut pas prétendre livré |
|---|---|---|---|
| Prospection | `src/renderer/crm/ProspectsPageV2.tsx` | `view` annuaire/pipeline/historique, `directorySearch`, `directoryIndustry`, `directoryCity`, `directoryStatusFilter`, `pipelineFilter`, listes dérivées | Vues persistées par utilisateur, ordre des colonnes personnalisé ou tri général configurable **non établis** |
| Clients | `src/renderer/crm/ClientsPage.tsx` | `query`, `statusFilter`, filtrage local calculé dans `useMemo` ; sélection et fiche | Enregistrement général des filtres/colonnes **non établi** |
| Catalogue | `src/renderer/commercial/CatalogPage.tsx` | `query`, `typeFilter`, `statusFilter`, tri explicite des éléments par catégorie et nom FR | Tri manuel arbitraire des prestations ou persistance de colonnes **non établis** ; préserver l'ordre métier validé |
| Devis | `src/renderer/commercial/QuotesPage.tsx` | `query`, `statusFilter`, liste + panneau de détail | Table générique configurable, tri serveur et colonnes persistées **non établis** |
| Projets | `src/renderer/projects/ProjectsPage.tsx` | `view` projets/modèles, `query`, `statusFilter` ; tableau projets, détail et arborescence production | Ne pas faire du tableau un remplacement des arbres, planifications et raccourcis métier |
| Opérations | `src/renderer/operations/OperationsPage.tsx` | `view` demandes/interventions/maintenance/packs, `query`, `requestStatus`, `interventionStatus` ; deux espaces séparés | Ne pas confondre les filtres Demandes et Interventions ni réutiliser leur disposition l'un pour l'autre |
| Recherche globale | `src/renderer/crm/GlobalSearch.tsx` | Recherche asynchrone, navigation des résultats avec clavier, `onOpen` | Pas un composant de table réutilisable en remplacement |

**Limite de l'audit actuel :** les 17 modules ne sont pas ici cartographiés colonne par colonne. Le code des listes Facturation, Dépenses, Annuaire, Temps, Sauvegardes, Statistiques, Bibliothèque et Sites doit être inspecté au moment de leur migration métier. Aucune couverture globale ne doit être déclarée sur ces seules observations.

## 3. Composants cibles (noms conceptuels)
| Composant | Responsabilité UX/UI | Hors de sa responsabilité |
|---|---|---|
| `DataTableWithViews` | Rendu, colonnes, sélection, tri/filtres visibles, focus, états et commandes | Validation Devis, modification d'un Client, SQL implicite |
| `TableColumnManager` | Montrer/masquer, déplacer, redimensionner, réinitialiser | Droits d'accès métiers |
| `TableFilterBar` | Recherche, filtres actifs, compteur et commandes de remise à zéro | Effacer les données ou changer le statut d'un objet |
| `SavedViewPicker` | Vue par défaut, favoris, vues personnelles, nom/dupliquer/restaurer | Copier des données client dans les réglages |
| `ViewPreferenceStore` | Persistance des **paramètres de présentation** avec schéma versionné | Sauvegarde des brouillons et champs métiers |
| `ResponsiveListMode` | Table ou cartes adaptées à la largeur, accès aux actions et au détail | Inventer des colonnes absentes et perdre les filtres |

**Important :** les noms ci-dessus ne certifient pas des classes existantes ; inventorier et réutiliser avant d'en créer. Séparer clairement « visible à l'utilisateur » de « autorisé selon le service ».

## 4. Contrat de fonctionnement

### 4.1 Colonnes
- Chaque colonne dispose d'un **identifiant technique stable**, d'un libellé français, d'un type (texte, statut, date, montant, nombre, action, identité), de formats/compareurs pertinents et d'une largeur initiale **par module**.
- Montrer/masquer, réordonner, ajuster la largeur via un contrôle accessible ; réinitialiser un tableau **sans modifier les données métier**.
- Garder visibles au moins l'**identité du dossier** et son accès à la fiche ; refuser une configuration qui rendrait une ligne indiscernable/inaccessible. Ne pas « cacher » une interdiction de droit par masquage.
- Colonnes inconnues après mise à jour : ignorer leur préférence, restaurer les nouvelles colonnes obligatoires, proposer réinitialisation sans écran vide ; migrations de clés/documentation.
- Si une colonne dépend d'une capacité, masquer correctement l'**action** mais ne pas considérer l'utilisateur autorisé à la requérir simplement parce que la colonne est affichée.
- Largeurs exprimées de façon appropriée à la table, **bornées** par les contraintes de la fenêtre (zoom, mode Compact, panneaux de détail). Aucune action essentielle perdue hors écran sans accès de repli.

### 4.2 Tri
- Clic en-tête / commande accessible : premier ordre → ordre inverse → revenir au défaut **si le module le permet**. Indicateur textuel/ARIA et flèche, jamais couleur seule.
- **Tri stable** : deux valeurs identiques suivent une clé secondaire stable, ex. identifiant. Pour les nombres et montants, comparer les valeurs numériques (centimes), pas les chaînes formatées ; pour dates, date normalisée ; pour texte français, collation `fr-FR`.
- Le tri **présentation** ne change pas `sortOrder` des tâches/blueprints, ordre contractualisé des clauses CGV ou classement du catalogue imposé par la règle commerciale.
- Avec pagination/filtrage serveur, ne pas trier uniquement les quelques lignes chargées en laissant croire que toute la base est triée ; adapter au service ou indiquer la portée réelle.

### 4.3 Recherche et filtres
- Une barre contextuelle par vue, avec filtres multi-critères selon champs existants ; afficher visiblement tout **filtre actif** et fournir « Effacer les filtres ».
- Les filtres de statut sont **propres aux modules** ; ne pas créer de nouveaux statuts techniques pour le pipeline visuel, les devis, interventions ou abonnements.
- Ne pas retirer automatiquement les archivés/perdus si l'écran courant prévoit de pouvoir les afficher ; préserver ces capacités.
- La recherche saisie est une **préférence de vue seulement si c'est pertinent et approuvé par la portée retenue** ; elle ne déclenche aucune sauvegarde d'entité.
- Les résultats vides distinguent « aucun dossier » de « zéro résultat à cause des filtres », avec actions de rétablissement adaptées.
- Recherche, tri et filtre ne doivent pas provoquer un remount d'éditeur contenant un brouillon. Si la fiche sélectionnée sort du résultat, permettre de la conserver/fermer **avec garde UX-01** selon vraie destruction.

### 4.4 Vues personnalisables
- Système de **vue par défaut** propre à chaque écran ; vues personnalisées nommables, duplicables, choisissables, réinitialisables, sans libre construction de menus métier ou écran blanc.
- L'ordre, largeur, visibilité de colonnes et préférences de tri/filtre sont restaurés lorsqu'on revient sur la vue ; une sauvegarde de préférences **automatique** ne doit pas demander « Enregistrer » à chaque redimensionnement.
- **Définition à préciser avant code :** portée poste / workspace / profil utilisateur, clé stable `module / écran / mode / version`, version de schéma, migration et résolution multi-fenêtres. Cette décision est de stockage de préférences, non de règle métier.
- Par défaut, un changement de filtre dans une vue **personnalisée** est mémorisé ; pour une **vue standard partagée**, conserver un défaut réinitialisable et éviter que l'utilisateur croie avoir modifié un modèle global.
- Préférences stockées sous forme de **clés de colonnes/valeurs de filtre autorisées**, pas d'enregistrements métiers complets ni de secrets.

### 4.5 Sélection, fiche et accessibilité
- Clic sur une ligne → fiche rapide correcte, Agrandir garde contexte (voir 01C). Ne pas activer une action destructrice par simple sélection.
- Clavier : navigation dans filtres, tris, menu colonnes ; libellés pour icônes, focus visible, en-têtes avec `aria-sort` lorsqu'applicable ; focus ramené au point utile après fermeture.
- Éviter les lignes de tableau `<tr>` cliquables sans alternative bouton/activation clavier. Toute ligne actionable a une commande `Ouvrir` ou un pattern accessible.
- Nombre de résultats explicite, états « chargement », « erreur », « aucun résultat », compteur cohérent avec la liste réellement affichée.

## 5. Portée de l'atelier 01D
Le sous-lot 01D prépare **les composants communs et une démonstration sur données fictives**, ainsi qu'un **pilote technique non destructif**. Il **ne refond pas les 17 tableaux métier**. Les migrations CRM, Catalogue, Devis, Projets et Opérations interviennent dans les Lots 03/04/06/07/08 selon leur calendrier, chacune avec matrice de contrôles et tests.

## 6. Ordre de réalisation recommandé
| Étape | Travail de Codex après autorisation | Livrable vérifiable |
|---|---|---|
| 01D.1 | Relever le HEAD et l'inventaire des listes actuelles + filtres/handlers/services ; choisir le bon composant à réutiliser | Tableau `module/vue/champs/tri/filtre/handler` |
| 01D.2 | Définir types et contrats des colonnes / filtres / sorts et exigences de clavier | API de présentation documentée |
| 01D.3 | Construire table, barre de recherche et menus colonnes sur fixtures synthétiques | Atelier isolé sous 3 thèmes × 3 densités |
| 01D.4 | Ajouter vues personnelles, auto-persistance, schéma versionné, restauration défaut | Migration et tests de préférences seulement |
| 01D.5 | Tester le branchement à une source de liste **sans écriture métier** et parcours fiche rapide | Vérifier aucun effet sur données/UX-01 |
| 01D.6 | Recette, comparaison aux anciens tableaux et revue humaine | Tests, captures, anomalies, plan de migration par module |

## 7. Critères d'acceptation
| ID | Scénario | Résultat exigé |
|---|---|---|
| R01D-01 | Ouvrir tableau sur 3 thèmes × 3 densités | Compact **14 px cible**, lisibilité et focus, contrastes corrects |
| R01D-02 | Afficher/masquer/déplacer des colonnes | Données inchangées, identité et accès dossier toujours visibles |
| R01D-03 | Réduire/agrandir et restaurer largeur des colonnes | Min/max respectés, pas de masquage définitif des actions |
| R01D-04 | Trier dates, montants et noms FR | Ordre stable et types corrects, tri non confondu avec ordre métier |
| R01D-05 | Rechercher et filtrer par statut/catégorie | Résultats attendus et compteur exact, filtres actifs identifiables |
| R01D-06 | Afficher zéro résultat puis réinitialiser | Message contextualisé et retour immédiat au jeu visible |
| R01D-07 | Personnaliser une vue, naviguer, relancer | Colonnes/largeurs/filtres/sorts mémorisés, hors données métier |
| R01D-08 | Changer une vue standard, restaurer défaut | Aucun paramètre global/métier corrompu |
| R01D-09 | Changer de version de colonne ou supprimer un champ | Ancienne préférence résolue/ignorée sans casser le tableau |
| R01D-10 | Filtre masque la sélection avec brouillon dirty | Pas de perte : conserver fiche ou demander sortie via UX-01 |
| R01D-11 | Cliquer Ouvrir et Agrandir | Bon identifiant, même onglet et brouillon, clavier accessible |
| R01D-12 | Tester une pagination/chargement asynchrone | Pas de tri trompeur, résultats tardifs n'effacent pas les nouveaux |
| R01D-13 | Afficher 100+ lignes et resizer rapidement | Interface utilisable, persistance non déclenchée à chaque mouvement |
| R01D-14 | Fenêtre étroite et zoom | Vue de repli utilisable, filtres et ouverture accessibles |
| R01D-15 | Mettre deux vues/modules côte à côte | Préférences indépendantes, pas de contamination des filtres |
| R01D-16 | Lancer les tests complets + tests UI des pilotes | Aucun échec nouveau, typecheck, 3 thèmes × 3 densités documentés |

## 8. Incertitudes et garde-fous
- **E12 — Source des vues persistées** : aucune sauvegarde transversale des colonnes/vues n'a été établie dans les fichiers examinés. Choisir stockage et portée après inspection des settings existants (E08 du 01C), pas de migration SQLite improvisée.
- **E13 — Tri et pagination** : les services peuvent avoir des limites ou filtres serveur ; relever les contrats avant de promettre un tri sur toute la base.
- **E14 — Colonnes obligatoires** : définir par module les colonnes identifiant/action, sans inventer une règle unique insensible au métier.
- **E15 — Données sensibles** : toute valeur persistée dans un profil doit exclure secrets, identifiants de connexion, texte libre contractuel non sauvé et données clientes non indispensables.
- **E16 — Vue standard vs personnelle** : nommage et comportement éditable à valider à partir d'une démonstration, sans ajouter du travail au quotidien.
- **UX-01** : PR #83 non intégrée au code de référence à ce stade ; aucun deuxième registre ou garde concurrent n'est autorisé.

**Les arbitrages d'UX fondamentaux (table configurable, sauvegarde automatique des vues, retour aux défauts, lien fiche rapide) sont déjà décidés. Les détails techniques E12–E16 seront instruits par inspection avant toute PR de développement.**

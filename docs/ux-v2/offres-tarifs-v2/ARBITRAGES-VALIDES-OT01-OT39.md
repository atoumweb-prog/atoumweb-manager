# AtoumWeb Manager — Offres & Tarifs
## Registre consolidé des arbitrages OT-01 à OT-39 et cadrage de lancement du lot 1

**Date de synthèse :** 6 novembre 2026
**Statut :** 39 décisions fonctionnelles confirmées par l'utilisateur dans la conversation. Accord donné pour **préparer le lancement du lot 1** ; chaque action Git ou changement de données reste soumise au périmètre explicite du message de mission Codex.
**Référence du code étudié :** `codex/client-v2-ab-20261104` — `2fda54610aa6b204a69c6ba3b4a626e7f8dd61a5`.
**Sources de cadrage :** étude Electron des 39 captures, rapport de comparaison Codex des huit maquettes, décisions exprimées dans la conversation. Le présent document formalise des **besoins futurs**, et ne prétend pas que ces fonctionnalités sont déjà implémentées.

## A. Trente-neuf arbitrages validés

| ID | Domaine | Décision validée | Invariants et précautions |
|---|---|---|---|
| OT-01 | Création | Assistant de création guidée ; **brouillon incomplet sauvegardable et reprenable après fermeture**. | Ne jamais publier automatiquement ; éviter doublons et pertes de saisie. Minimum précisé par OT-31 : nom provisoire + type Offre/Service. |
| OT-02 | Familles | Clic sur une carte de famille → **tableau d'administration filtré**, avec retour vers la vue organisée. | Familles calculées sur les données réelles ; pas de reclassement silencieux des catégories stockées. |
| OT-03 | Duplication | Dupliquer une offre ou un service dans un **nouvel article brouillon**. | Identité/code distincts ; vérifier manuellement les références sensibles ; versions et dossiers d'origine intacts. |
| OT-04 | Compteurs | Total, actifs, inactifs, archivés, articles avec version publiée et avec brouillon ; totaux filtrés et total général identifiable. | Un article peut avoir un publié **et** un brouillon ; ne pas additionner ces compteurs comme s'ils étaient exclusifs. |
| OT-05 | Utilisations | Afficher les utilisations **réelles** de chaque version (devis et autres dossiers effectivement reliés). | Consultation sourcée ; aucun recalcul rétroactif. |
| OT-06 | Formules | Formules commerciales distinctes mais regroupables et comparables (Essentiel, Business, Visibilité, etc.). | Chaque formule garde identité, versions, tarifs et conditions ; tarifs non figés dans l'UI. |
| OT-07 | Catégories | Administration en **deux niveaux** : catégories parentes et sous-catégories, rattachement/déplacement/ordre. | Conserver anciennes valeurs, IDs, alias et réconciliation ; pas de reclassement automatique d'articles. |
| OT-08 | Tarifs mixtes | Présenter ensemble coûts initiaux, mensuels et annuels des **prestations distinctes** associées. | Inclus / obligatoire / facultatif explicites ; pas de somme entre périodes incompatibles ni de facturation implicite. |
| OT-09 | Abby | **Gestion manuelle**, sans API payante ni synchronisation. | Conserver libellés/repères pour saisie manuelle ; aucun faux état « synchronisé ». |
| OT-10 | Contrat & CGV | Configuration contractuelle **guidée** à partir des types, règles, clauses et bibliothèques existants. | Source unique ; ne pas dupliquer les clauses ni modifier les contrats historiques ; pas de validation juridique automatique. |
| OT-11 | Publication | Revue assistée : identité, tarifs, contenus, associations, références contractuelles, production. | Distinguer erreur bloquante, avertissement, validation humaine ; publication interne explicite, distincte de WordPress. |
| OT-12 | Versions | **Sélecteur principal** de version dans la fiche et contexte local explicite lorsque nécessaire. | Garder les huit onglets, sélecteurs spécifiques, gardes et sauvegardes séparées ; pas de sauvegarde par simple changement de version. |
| OT-13 | Import/export | **CSV + JSON structuré** ; importation assistée avec simulation, conflits et confirmation. | Préserver versions, historiques, associations prises en charge, IDs et devis ; pas de restauration universelle garantie sans mapping. |
| OT-14 | Associations | Rubriques **Inclus, Optionnel, Recommandé** avec recherche, choix de versions, quantités et contrôles. | Composition et recommandations ont des mécanismes d'écriture distincts ; pas de ligne de devis créée automatiquement. |
| OT-15 | Contenu & périmètre | Éditeur guidé : description, inclusions, exclusions, prérequis, ordre, prévisualisation et alertes. | Données versionnées ; pas de réécriture automatique des tarifs, associations ni clauses. |
| OT-16 | Aide à la vente | Assistant commercial structuré : profils, besoins, bénéfices, questions, objections, conseils internes. | Séparation contenus communicables/notes internes ; contenus liés à la version. |
| OT-17 | Production | Association guidée de modèles/blueprints existants, consultation, quantités et contrôle de disponibilité. | Versionnement ; bibliothèque de production comme référence ; aucun Projet créé à la lecture de la fiche. |
| OT-18 | Historique | Chronologie des versions **et** des opérations réellement journalisées (création, modification, publication, retrait, archive, restauration). | Dates/auteur si connus ; ne pas inventer le passé ; utilisations d'une version séparées de l'audit. |
| OT-19 | Actions groupées | Affectation de catégorie, activation/désactivation, archivage/restauration sur sélection multiple. | Prévisualisation, confirmation, résultat par élément ; pas de modification collective prix/clauses/versions/compositions. |
| OT-20 | Tableau | Filtres avancés, pagination 25/50/100, vues personnelles sauvegardant filtres, tri et colonnes. | Compteurs indépendants de la pagination ; sélection multiple explicite ; préserver les préférences actuelles. |
| OT-21 | Promotions | Promotions temporaires par montant ou pourcentage, dates et conditions, sélection explicite dans les nouveaux devis. | Tarif normal conservé, chevauchements contrôlés, anciens devis inchangés. |
| OT-22 | Site WordPress | Préparer, prévisualiser, copier/exporter une fiche commerciale issue d'une version publiée pour intégration **manuelle** dans Divi. | Éligible/prêt/confirmation manuelle de mise en ligne distincts ; aucune synchronisation WordPress supposée. |
| OT-23 | Performance | Statistiques consultatives issues des vrais devis : décompte sans doublon, statuts réels, évolution, comparaisons et filtres. | Pas de CA encaissé inféré d'un devis accepté ; sources et versions conservées. |
| OT-24 | Modèles commerciaux | Bibliothèque simple de modèles de fiches : descriptions, périmètre, questions, structure de création. | Préremplissage par copie ; modèle distinct de duplication d'article et du blueprint de production ; pas de propagation automatique. |
| OT-25 | Santé | Diagnostic global : doublons potentiels, références invalides, catégories historiques, informations manquantes, incohérences. | Erreurs/avertissements/vérifications humaines ; corrections individuellement confirmées, jamais automatiques. |
| OT-26 | Archivage | Archivage/restauration assistés avec présentation des conséquences connues. | Garder devis et historiques ; restaurer ne republie pas, ne relance pas une promotion expirée, ne publie pas sur WordPress. |
| OT-27 | À suivre | Centre discret d'alertes : promotions, brouillons anciens, dates de révision volontaires, anomalies majeures. | Délais configurables, acquittement/report pertinent ; aucune action commerciale automatique. |
| OT-28 | Sécurité | Protections proportionnées import/export, groupes, publication et archive ; traçabilité des résultats. | Gardes de brouillon, concurrency/CAS, validation métier ; pas de nouveau système de comptes/permissions. |
| OT-29 | Paramètres | Espace centralisé : affichage, pagination, alertes, import/export, familles et accès Santé. | Préférences personnelles distinctes des paramètres communs ; réutiliser les préférences de tableaux existantes. |
| OT-30 | Navigation | **Une entrée** `Commercial → Offres & Tarifs`, **trois espaces internes** : Catalogue, Pilotage, Administration. | Fiche Offre/Service avec ses huit onglets distincts ; aucun allongement forcé de la navigation latérale principale. |
| OT-31 | Premier brouillon | **Nom (éventuellement provisoire) et type Offre/Service uniquement** pour première sauvegarde d'un brouillon incomplet. | Identifiant technique unique ; catégories, tarif et conditions complétés après. |
| OT-32 | Sauvegarde | **Manuelle**, bouton Enregistrer le brouillon toujours accessible ; protection de sortie et choix enregistrer / poursuivre / abandonner. | Ne jamais publier ; garder la saisie en cas d'erreur ou conflit. |
| OT-33 | Code | **Code commercial attribuable ultérieurement**, distinct de l'ID technique assigné dès la création. | Unicité et immutabilité du code une fois attribué, sans recodage automatique au renommage. |
| OT-34 | Concurrence | Détection des conflits, **comparaison et résolution manuelle** avec conservation de la saisie. | Jamais d'écrasement silencieux, de fusion automatique des prix, contrats ou associations. |
| OT-35 | Brouillons | Espace **Mes brouillons** dans Catalogue, liste, recherches et reprise de la même fiche/version ; suggestion de brouillons similaires. | Pas de création en double à la reprise ; abandon confirmé ; réutiliser tableaux/alertes. |
| OT-36 | Comparateur | Comparaison détaillée de **2 à 4 offres ou services**, différences, périodes/prix, inclus/optionnels/exclus, versions et conditions. | Filtre différences seulement ; ne pas mélanger montants et périodes ou brouillons/publiés. |
| OT-37 | Export PDF comparatif | PDF professionnel personnalisable, **Client** ou **Interne**, prévisualisation, date et références des versions figées. | Notes internes jamais dans document client ; document informatif distinct d'un devis/contrat. |
| OT-38 | Modèles documentaires | Bibliothèque de modèles de présentation (détaillé, synthétique, interne), personnalisables selon identité AtoumWeb. | Distincte de modèles commerciaux/production ; documents déjà produits inchangés. |
| OT-39 | Import existants | Import CSV/JSON **intelligent et contrôlé** : création, mise à jour d'un brouillon après comparaison, préparation d'un nouveau brouillon depuis publiée, ignorer, résolution manuelle. | Colonne absente ≠ effacement ; aucun changement des versions publiées, devis et contrats ; journal de résultats. |

## B. Architecture de navigation cible — validée en OT-30

```text
Commercial
└── Offres & Tarifs
    ├── Catalogue
    │   ├── Vue organisée et cartes de familles / Comparateur
    │   ├── Tableau d'administration (filtres, vues, pagination, actions groupées)
    │   ├── Créer / Mes brouillons / Reprendre / Dupliquer
    │   └── Fiche Offre ou Service — les 8 onglets existants
    │       ├── Identité
    │       ├── Tarifs & Abby (reprise manuelle Abby)
    │       ├── Contenu & périmètre
    │       ├── Associations
    │       ├── Aide à la vente
    │       ├── Contrat & CGV
    │       ├── Production
    │       └── Historique (comparaison / revue avant publication / audit)
    ├── Pilotage
    │   ├── Statistiques commerciales
    │   └── À suivre / alertes / échéances
    └── Administration
        ├── Catégories (deux niveaux, réconciliation historique)
        ├── Modèles commerciaux
        ├── Santé du Catalogue
        ├── Import / Export (CSV et JSON)
        └── Paramètres du Catalogue
```

Les fonctionnalités comme promotions, préparation de contenus WordPress, suivi des utilisations, archivage et contrôles de publication sont **des parcours/commandes associés aux fiches**, pas nécessairement des entrées de navigation supplémentaires.

## C. Ce qui existe déjà et ce qui constitue un nouveau développement

**Socle à préserver :** Catalogue et ses services, `ConfiguredDataTable` (vues, colonnes, tri), catégories et mécanisme de réconciliation, fiches à huit onglets, versions brouillon/publiée/retirée, sauvegardes et conflits, compositions et recommandations, liens contractuels, références de blueprints, revue de publication, archives et historique des versions. Cette liste correspond à l'inventaire fonctionnel de Codex, pas à une recette complète de tous les parcours.

**Évolutions d'interface / parcours principalement :** trois espaces internes, lecture plus claire des prix/statuts/versions, création guidée par sections, tableau et catégories mieux présentés, aide à la vente, cartes de comparaison, aperçu de publication, commandes plus accessibles.

**Développements métier significatifs :** sauvegarde/reprise d'un brouillon incomplet (OT-01/31 à 35), duplication indépendante, hiérarchie de catégories avec migration, import/export fiable et sécurisé, nouvelles données de promotions, tableaux de bord intermodules, journal enrichi, opérations de masse, centre d'alertes, modèles commerciaux, contrôles de cohérence, préparation de fiches WordPress et éventuellement nouveaux liens de blueprints. Le fait d'avoir validé le besoin ne signifie ni qu'une architecture est arrêtée, ni qu'un développement est autorisé.

**Explicitement écarté pour l'instant :** connecteur/API Abby payant (OT-09). Les prix, TVA, clauses, dates et statuts présents dans les maquettes sont des exemples, jamais des données à importer ou à publier.

## D. Visuels : couverture existante et compléments à concevoir

### Huit maquettes déjà produites

1. Accueil / vue organisée du Catalogue — **direction graphique acceptée**.
2. Tableau d'administration — direction de présentation.
3. Catégories — direction de présentation ; ne montre pas encore la réconciliation historique complète.
4. Création d'offre — direction de présentation ; à adapter à OT-01 (sauvegarde/reprise).
5. Fiche Identité — direction de présentation ; afficher les statuts distincts et la bonne version.
6. Tarifs & Abby — direction de présentation ; **supprimer les faux états de synchronisation** et respecter OT-08/09.
7. Contrat & CGV — direction de présentation ; **supprimer les clauses et reconductions inventées**.
8. Revue avant publication — direction de présentation ; ne pas afficher « prêt » sans critère réel.

Les visuels 06 à 08 doivent être harmonisés avec les **huit onglets réels** ; la revue de publication ne remplace pas la navigation normale de la fiche. Les PNG sont des intentions visuelles, pas un modèle de données ni une autorisation de développement au pixel près.

### Priorités des maquettes complémentaires

**Priorité 1 — Cohérence transversale (avant de dessiner dix écrans isolés)**
- Cadre général 1920×1080, thème Noir/Confort : navigation Catalogue/Pilotage/Administration et conservation du mode fiche partagé/agrandi.
- Fiche avec sélecteur principal de version, rappel de l'état **article / version / visibilité site** et versions locales si nécessaire.
- Brouillon de création incomplet : état sauvegardé, reprise, erreurs, sortie protégée, premier enregistrement.

**Priorité 2 — Cinq onglets encore non maquetés individuellement**
- Contenu & périmètre : édition guidée, ordre, prévisualisation.
- Associations : inclus/optionnel/recommandé, versions, quantités, sauvegardes distinctes.
- Aide à la vente : contenu commercial versus note interne.
- Production : blueprints versionnés, sélection et validation, sans création automatique de Projet.
- Historique : versions, opérations, utilisations, reprise et comparaison sans rétroactivité.

**Priorité 3 — Espaces nouveaux**
- Pilotage : statistiques sourcées et centre « À suivre ».
- Administration : catégories hiérarchisées et héritage historique, modèles commerciaux, Santé, import/export avec simulation, paramètres.
- Dialogues/états représentatifs : duplication, promotions, archivage assisté, revue de publication avec blocages, actions groupées et confirmation.

Produire des **maquettes de référence représentatives**, et non une image pour chaque permutation de filtre, de statut ou d'onglet. Vérifier ensuite l'application réelle avec des captures Electron et les données TEST, 1920×1080 et zoom 100 %.

## E. Détails techniques à spécifier au moment du lot concerné — sans rouvrir les décisions OT

1. **OT-01/31 à 35 : brouillons incomplets** — nom et type seuls suffisent à la première sauvegarde ; définir le moment de création technique, la gestion des associations ultérieures et la reprise. Sauvegarde manuelle et résolution des conflits déjà validées.
2. **OT-07 : hiérarchie des catégories** — type de parents, contraintes de cycle/archives, impact de catégorie historique et compatibilité des filtres. Deux niveaux restent obligatoires.
3. **OT-13/39 : imports/exports** — portée des versions/relations, correspondances par ID/code, simulation, gestion transactionnelle et reprise après échec. Aucun écrasement d'historique.
4. **OT-21 : promotions** — chevauchement, règles de cumul, règles de dates, devis snapshots.
5. **OT-23 : indicateurs** — statuts des Devis réels, comptage des lignes de versions composites, période et dénominateurs ; pas de chiffre financier non fondé.
6. **OT-28 : opérations de masse** — atomique ou partiel par article, limites, autorisations et bilan ; respect des protections existantes.
7. **Raccord contrats/production** — seules les références sourcées sont affichées ; documentations CGV, versionnement et sauvegardes indépendantes.

## F. Ordre de réalisation et limites d’autorisation

La décision utilisateur au 06/11/2026 est de **cesser les nouveaux arbitrages généraux à OT-39 et de faire démarrer Codex par le lot 1**. Les détails indispensables seront définis au fil des lots. **OT-40 (sauvegarde/retour arrière d’import massif) est reportée au lot Import/export, pas abandonnée.**

**Lot 1 — socle Catalogue et navigation (à démarrer en premier) :**
- Une seule destination latérale Commercial → Offres & Tarifs, trois espaces internes Catalogue / Pilotage / Administration. Les futurs espaces peuvent être aménagés en états d’attente honnêtes, sans simuler des statistiques ou fonctions non développées.
- Vue organisée et tableau d’administration, recherche/filtres, états de version et d’article bien séparés ; familles avec action vers le tableau filtré (OT-02).
- Indicateurs exacts et sourcés (OT-04) ; pagination 25/50/100 et vues/colonnes/tri (OT-20) sans régression.
- Qualité visuelle Noir/Confort conforme à la maquette 01 et à l'application existante, adaptative en 1920×1080.

**Lots suivants (décidés fonctionnellement mais non autorisés par le seul lancement du lot 1) :**
1. **Lot 2 :** création et fiches, huit onglets, versions, brouillons incomplets, sauvegarde/reprise, duplication et résolution des conflits.
2. **Lot 3 :** familles comparables, tarifs mixtes, promotions, associations, contenu, aide à la vente, production, contrats, contrôle de publication et usages des versions.
3. **Lot 4 :** administration de catégories à deux niveaux, import/export CSV/JSON, modèles, Santé du Catalogue, opérations de masse et paramètres.
4. **Lot 5 :** statistiques fiables, centre À suivre, historique enrichi, comparateur/export PDF, préparation WordPress et revue finale.

Ce découpage est un point de départ ; Codex peut signaler des dépendances justifiant un autre ordre **sans remettre en cause les OT validées**. Les développements lourds exigent des spécifications concrètes, tests et, si nécessaire, migrations explicites séparées.

**Interdits transversaux :** modifier les prix/clauses/offres commerciales réels, recalculer les anciens devis/contrats, supposer un connecteur Abby, promettre une publication WordPress, copier des données fictives des maquettes, effacer/renommer silencieusement les catégories ou écraser les autres worktrees. Le code doit exploiter le Catalogue existant.

**Référence Git :** `codex/client-v2-ab-20261104` au SHA `2fda54610aa6b204a69c6ba3b4a626e7f8dd61a5`. Un nouveau worktree isolé et une branche dédiée au lot 1 sont recommandés, à créer uniquement si la mission donnée à Codex l'autorise explicitement. **Aucun commit, push, PR, merge, migration ni opération destructrice par simple présence de ce document.**

## G. Références de l'étude

- `Offres-Tarifs-Etude-2026-11-06.zip` : 39 captures Electron et inventaire de l’existant.
- `AtoumWeb_Offres_Tarifs_8_maquettes_et_evolutions_2026-11-06.zip` : 8 visuels de direction et registre des fonctionnalités candidates.
- `RAPPORT-COMPARAISON-CODEX.md` : distinction entre UI existante, nouvelles fonctions et contraintes.
- `docs/ux-v2/REPRISE-APRES-CLIENTS-V2-2026-11-06.md` : passation et protections des worktrees.

Les visuels sont des intentions graphiques : la navigation, les huit onglets, les prix, les données et les processus réels priment sur leurs illustrations.

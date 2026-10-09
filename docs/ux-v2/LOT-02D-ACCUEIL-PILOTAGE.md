# Lot 02D — Accueil opérationnel, alertes, KPI, pipeline et widgets

**Statut : spécification de conception, aucune modification applicative ni recette exécutée.**
**Code inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (09/10/2026).**
**Dépendances :** [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md), [matrice code → cible](LOT-02-MATRICE-EXISTANT-CIBLE.md), [02A — navigation option A validée](LOT-02A-RAIL-NAVIGATION.md), [02B](LOT-02B-ENTETE-RACCOURCIS.md), [02C](LOT-02C-RECHERCHE-ROUTAGE.md), [01C](LOT-01C-FICHES-PANNEAUX.md), [01F](LOT-01F-PREFERENCES-RECETTE.md).

## 1. Cible UX décidée
Faire d'**Accueil** le point de pilotage quotidien d'AtoumWeb : **Aujourd'hui**, priorités, échéances, relances, alertes, opérations et accès direct aux bons dossiers, avec un affichage compact (idéalement zéro ou un scroll de la partie « Aujourd'hui »). Le widget est un **point d'entrée**, jamais la source normative d'un état CRM, d'une opération comptable ou du chrono.

- Quatre indicateurs existants à reconsidérer selon l'utilité métier, sans les supprimer silencieusement.
- Les **alertes critiques restent visibles ou immédiatement accessibles**, même si l'utilisateur masque un widget décoratif.
- Accueil personnalisable : déplacer/masquer/restaurer ses widgets ; **présentation mémorisée**, aucun champ métier enregistré automatiquement.
- **Sept étapes visuelles commerciales** validées, pas des états backend nouveaux ; règle d'agrégation explicitement prouvée avant modification.
- Les actions « + ... » doivent **ouvrir un vrai formulaire** sans créer l'entité avant enregistrement, ou être renommées « Ouvrir ... » si elles ne font que naviguer.
- Un **chrono global unique** reste dans l'en-tête existant, non dupliqué.

## 2. Constat détaillé à partir de `HomeDashboard.tsx`
| Source / calcul | Comportement présent | Prudence UX |
|---|---|---|
| `load()` | `Promise.all` de **8 sources** : `workflow.dashboard`, Prospects, actions, Projets, Interventions, résumé temps sur le mois, Facturation, alertes Opérations. | Une seule source en erreur fait échouer l'agrégat `Promise.all` ; une vue déjà chargée peut demeurer affichée avec `loadError` et message global. Ne pas transformer un état partiel en « tout à jour ». |
| `atoumweb:changed`, `time-changed`, `intervention-updated` | Déclenchent `load()` ; aucune génération/request ID visible dans le composant audité. | Éviter que des réponses antérieures remplacent les plus récentes ; maîtriser rafraîchissements fréquents. |
| `todayEntries` | Entrées `DashboardEntry` dont `group === 'Aujourd’hui'`. Le clic appelle `openEntity(entry.target)`. | Les données viennent de `workflow.dashboard()` ; analyser ce que ce groupe inclut **réellement**, sans inventer les échéances. |
| `activeProspects` / `pipelineProspects` | Écarte archivés, Prospects convertis avec `clientAccountId` et stages `won/lost` ; l'autre liste écarte aussi stage `new`. | Passage aux sept colonnes nécessite décider/projeter ce que valent **new**, **won**, **lost**, et éviter doubles comptes. |
| `dueFollowUps` | Compte une fois les `ownerId` d'actions Prospect `follow_up/open` dont `dueAt` précède fin de journée ; `overdue` calculé contre l'instant courant. | Un Prospect avec plusieurs relances ne doit pas être compté deux fois ; libellés `Aujourd'hui`/`En retard` conformes aux dates. |
| `quotePrepareCount` | Compte Prospects stages `quote_to_prepare` ou `quote_to_send`. | Le KPI **Devis à préparer** ouvre actuellement la page Devis entière, **pas** ces fiches ou un filtre pré-sélectionné. |
| `projectsToStart` | Compte Projets avec statut `to_prepare`. | Le clic ouvre **Projets** sans filtrer explicitement sur cette sélection. |
| `interventionsInProgress` | Compte Interventions statut `in_progress`. | Le clic ouvre **Interventions & Maintenance**, pas une vue filtrée prouvée. |
| `pipeline` | **5 groupes** : `qualifying`, `need_identified`, `quote_to_prepare/quote_to_send`, `quote_sent/follow_up/waiting`, `negotiation`. CSS grille 5 colonnes. Tous les clics ouvrent le pipeline générique. | V2 : **7 étapes visuelles**, clic sur étape doit être contextualisé ; ne pas ajouter de statuts SQL. |
| `time.summary` et `billing.list` | Temps facturable/non facturable mensuel, facture « À facturer » via items de facturation `status === 'ready'`, somme `expectedAmountCents`. | Montants attendus ≠ factures officiellement émises par Abby ; ne jamais prétendre à une facture officielle à partir d'un simple KPI. |
| `alerts` | Affiche nombre, titre de **la première alerte**, bouton ouvre sa cible (intervention/pack/maintenance) ou module Opérations en repli. | Permettre accès à toutes les alertes, leurs priorités et chaque objet exact ; ne pas masquer une alerte critique avec widget. |
| Quatre « actions rapides » | `+ Prospect`, `+ Devis`, `+ Projet`, `+ Demande` ne font que `openPage` vers les modules. | En V2, ouvrir modal/formulaire réel ou **renommer** honnêtement « Ouvrir Prospection/Devis/Projets/Demandes ». |
| `HomeDashboard.css` | Grilles KPI 4 colonnes, responsive et scrolls ; boutons rapides `font-size:11px`, textes secondaires parfois <14px. | Revoir les neuf combinaisons thème/densité ; Compact **14 px minimum pour texte fonctionnel**, conserver les espaces utiles. |

## 3. Hiérarchie de l'Accueil V2, sans préjuger du design pixel
1. **En haut** : « Aujourd'hui » (dossiers/échéances/actions réellement issues du service), indicateur de priorité et boutons « Ouvrir ... » ciblés. Un état vide ne dit « Rien d'urgent » **que si le chargement des sources pertinentes a réussi**.
2. **Alertes et exceptions** : résumé permanent ou point d'accès visible, compteur + liste complète ouvrant chaque objet ; distinguer critique et information selon sémantique réelle fournie par le service.
3. **Actions rapides réellement opérantes** : création via écran/modal préexistante **sans insertion en base au clic** ; sinon libellés de navigation clairs.
4. **KPI / relances** : chiffres expliqués (périmètre, date, unités) et clic menant à la bonne vue filtrée ou au bon ensemble, avec retour au dashboard.
5. **Pipeline commercial** : sept étapes visuelles, progression et compteurs fiables, avec liens vers Prospection (Lot 03).
6. **Temps & facturation** : résumé du temps, éléments à facturer et contexte Abby, sans raccourci trompeur vers une émission officielle.
7. **Widgets secondaires** : statistiques, résumés ou aides selon source de données existante, ajout futur uniquement après cadrage.

**Proposition de mise en page** : un bloc Aujourd'hui visible dès l'ouverture, alertes sans effort de découverte, KPI et temps sous formes compactes, pipeline lisible ou défilable sans microscopie. Tester fenêtre 1280×720 et formats réels, **ne pas figer une hauteur fixe** avant recette.

## 4. Pipeline — **E59 partiellement tranché : Conversion validée, autres points ouverts**
Les **sept intitulés visuels validés** :
1. À qualifier
2. Besoins
3. Préparer le devis
4. Attente du retour
5. Négociation
6. Finalisation
7. Conversion

### Projection candidate **NON VALIDÉE comme règle métier**
| Étape visuelle | États candidats (à auditer et confirmer) | Décision non encore prouvée |
|---|---|---|
| À qualifier | `new`, `qualifying` | La V1 cache `new` dans son pipeline. Doit-il compter dans « À qualifier » ou seulement dans l'annuaire « non traité » ? |
| Besoins | `need_identified` | En l'absence d'une étape technique autonome « besoins », ceci est le seul état évident. |
| Préparer le devis | `quote_to_prepare`, `quote_to_send` | Éviter confusion devis créé / devis prêt à être envoyé. |
| Attente du retour | `quote_sent`, `follow_up`, `waiting` | Préserver relances dues comme **filtre transversal**, pas colonne supplémentaire. |
| Négociation | `negotiation` | Aucune règle de migration nécessaire si statut reste stable. |
| Finalisation | **aucun statut backend évident** parmi les cinq catégories actuelles | Représentation visuelle à préciser, sans inventer `finalization` dans la base. Peut être **vide/étape de synthèse** ou portée par un indicateur commercial existant à inspecter. |
| Conversion | **DÉCIDÉ** : historique des **Prospects effectivement convertis en Clients**, établi par un lien/événement de conversion vérifiable ; `won` seul ne suffit pas si aucune conversion Client n'est prouvée. | **Pas une étape du pipeline actif** : la vue est historique et consultable, lien vers fiche Client et fiche/historique Prospect si conservé ; `lost` exclu, une conversion comptée une seule fois. Période et affichage du compteur à préciser avant implémentation. |

**Arbitrage validé par AtoumWeb : « Conversion » affiche l'historique des Prospects réellement convertis en Clients, et non des dossiers encore actifs.** Ne pas inventer d'autres règles E59 : l'inclusion de `new` et la nature de « Finalisation » restent ouvertes. Séparer expressément dans le visuel/compteur les **étapes 1–6 du pipeline actif** de l'**historique des conversions** ; une période/calcul comparables devront être explicités. Le lien de conversion Client doit être vérifiable dans le service, sans créer de nouvelle étape SQL ni doublon. Cadrer avec Lot 03 CRM avant code.

## 5. Alertes et confiance dans les données
- Afficher l'horodatage/source ou signal de fraîcheur lorsque service disponible ; distinguer *chargé*, *en cours*, *échec*, *partiel* ; ne pas transformer l'échec d'une des huit sources en zéro alerte.
- Conserver si pertinent les **dernières données cohérentes**, mais marquer l'état « données peut-être anciennes » ; ne pas affirmer « Tout est à jour » tant que le dernier chargement critique est invalide.
- Chaque alerte ouvre sa **cible spécifique** via le routeur 02C et n'exécute aucune action destructive au seul clic.
- Afficher toute la liste dans un accès dédié et filtre priorité/type ; dans la grille Accueil, une synthèse compacte suffit **si le reste est à un clic et une erreur critique persiste visuellement**.
- Ne pas masquer les alertes de sauvegarde/restauration ou les problèmes d'intégrité au motif que l'utilisateur a choisi de masquer « À surveiller ». Déterminer lesquels sont véritablement fournis par les services présents ; **pas de nouveaux détecteurs supposés déjà existants**.

## 6. Actions rapides, KPI et navigation
- Chaque raccourci est un contrat `libellé → intention → formulaire/vue → confirmation → résultat`. Ne pas donner un libellé « + Projet » à une simple transition vers `Projets` si celle-ci n'ouvre aucun formulaire.
- **Choix technique autorisé sans arbitrage nouveau** : reprendre la création existante avec une intention `new`, validée contre les services, ou renommer la commande selon l'effet réel ; ne pas créer de donnée avant soumission explicite.
- Un KPI avec 17 « Devis à préparer » doit ouvrir une liste **filtrée sur ces 17 unités** ou annoncer clairement « Voir les devis » comme navigation générique. Ne pas afficher de compteur issu des Prospects puis ouvrir un filtre qui ne peut matériellement montrer ces Prospects.
- Les filtres de retour au module et la fiche rapide reçoivent `entityType/entityId` lorsqu'il existe ; toutes les sorties potentiellement destructives suivent UX-01. Les préférences de disposition n'enregistrent pas de brouillons.

## 7. Préférences et widgets
- Widgets configurables : visibilité, ordre et éventuellement dimensions parmi un ensemble contrôlé ; **Réinitialiser l'Accueil** restaure la disposition **sans** réinitialiser les données de démo, le cache métier, les contrats ou le workspace.
- **Éléments toujours accessibles** : alertes critiques, navigation, chrono actif, erreur de chargement significative.
- Une configuration périmée ne peut pas rendre l'Accueil vide sans commande de restauration ; nouveaux widgets intégrés raisonnablement.
- Stockage via 01F (portée à vérifier, version de schéma), pas d'écriture à chaque mouvement pendant drag & drop.
- Sous Compact, Confort, Confort+ vérifier taille des clics, lisibilité des montants et débordement des labels.

## 8. Ordre de travail après feu vert Codex
| Étape | Action | Résultat attendu |
|---|---|---|
| 02D.1 | Inventorier les 8 sources, filtres exacts, signaux d'actualisation et clics de `HomeDashboard` | Matrice service → KPI/widget → handler → destination → erreur |
| 02D.2 | Spécifier et tester une projection pipeline à 7 colonnes avec **E59 explicitement arbitré** | Table état backend → étape visualisée → inclusion/compteur, 0 doublon |
| 02D.3 | Construire un atelier isolé « Aujourd'hui », alertes, KPI, pipeline, temps sur **fixtures synthétiques** | Vue 3 thèmes × 3 densités sans vraie DB/IPC écrivant |
| 02D.4 | Accès direct aux bons dossiers et actions rapides honnêtes via routeur 02C | Tests exact ID/annulation/garde UX-01 |
| 02D.5 | Introduire préférences de widgets + état partial/fail sans nouveau calcul métier | Tests reset, réouverture et erreur d'IPC |
| 02D.6 | Comparer rendu ancien/nouveau, performance, min-height et contrat d'alertes | Typecheck/tests/UI réels, revue humaine, rollback |

## 9. Recette de validation — **non exécutée**
| ID | Test | Attendu |
|---|---|---|
| R02D-01 | Charger Accueil avec 0 résultat métier | État vide honnête ; pas de faux « Tout est à jour » sur erreur |
| R02D-02 | Charger 8 sources, puis provoquer une erreur sur une | Dégradation contrôlée, source/erreur indiquée, données non faussement à 0 |
| R02D-03 | Deux actualisations dont la première est plus lente | Seul le résultat de la plus récente fait foi |
| R02D-04 | Ouvrir une entrée Aujourd'hui | Bon `entityType/entityId` dans fiche réelle |
| R02D-05 | Compter des relances multiples du même Prospect | Aucun double comptage, retards distincts des relances du jour |
| R02D-06 | Cliquer KPI Devis à préparer | Affiche la population annoncée, ou navigation générique explicitement nommée |
| R02D-07 | Cliquer KPI Projets/Interventions | Cible/filtre cohérent avec le compteur, aucun mauvais état |
| R02D-08 | Pipeline 7 colonnes avec état `new/qualifying/won/lost` | Projection **E59 validée** sans nouveaux statuts backend et sans doublons |
| R02D-09 | Cliquer chaque étape de pipeline | Ouvre la vue/filtre correspondante lorsque pris en charge |
| R02D-10 | Afficher conversion historique validée | Uniquement Prospects **réellement convertis en Clients** avec lien vérifiable ; `won` sans Client lié et `lost` non comptés ; zéro doublon ; navigation vers le Client réel |
| R02D-11 | Deux alertes dont une critique et une non critique | Les deux accessibles, priorités fiables et bon objet |
| R02D-12 | Masquer widget À surveiller | Signal critique **reste accessible/visible** par autre canal |
| R02D-13 | Cliquer « + Prospect / Devis / Projet / Demande » | Vrai formulaire sans création anticipée **ou libellé changé en Ouvrir** |
| R02D-14 | Temps mensuel facturable/non facturable | Résumés corrects, aucune session chrono supplémentaire |
| R02D-15 | Afficher montant « À facturer » | Unité/état `ready` clair, aucune mention trompeuse de facture Abby émise |
| R02D-16 | Trier/masquer/déplacer widgets puis relancer | Préférence mémorisée, reset fonctionne, aucun enregistrement métier |
| R02D-17 | Tableau 1280×720 / fenêtre étroite / zoom | Aujourd'hui prioritaire, actions critiques atteignables, un scroll maximum ciblé |
| R02D-18 | 3 thèmes × 3 densités | Texte fonctionnel >=14px, contrastes/lisibilité et état clair |
| R02D-19 | Accueil rafraîchi pendant brouillon dans une autre fiche | Pas de route fantôme, pas de perte de saisie |
| R02D-20 | Fermer/réouvrir Accueil avec chrono en cours | Même chrono global, aucune interruption/pause involontaire |
| R02D-21 | Service alertes indisponible | Aucune présentation « Tout est à jour » comme vérité |
| R02D-22 | Recette UI, typecheck, suite complète et reprise après erreur | Preuves datées/SHA, Validation-MSI jamais touchée |

## 10. Questions de conception restant ouvertes
- **E59 — Mapping 7 colonnes, partiellement tranché** : **Conversion validée comme historique consultable des conversions Client réelles, non comme étape active**. Restent ouverts : inclusion de `new` dans « À qualifier », représentation de « Finalisation » sans statut backend, et période d'affichage des conversions. Aucun nouveau statut technique.
- **E60 — Disponibilité vraie des KPI ciblés** : les sources filtres doivent correspondre à la population des compteurs, sinon revoir libellés/cibles.
- **E61 — Hiérarchie des alertes** : quelles catégories sont réellement « critiques » et doivent rester visibles hors widget ; inspecter `operationsAlerts` avant tout automatisme.
- **E62 — Niveau de personnalisation d'Accueil** : masquer/ordonner obligatoire ; dimensions et grilles adaptatives à prototyper.
- **E63 — Actualisation partielle** : stratégie simple et déterministe de cache/erreur/données périmées pour les huit IPC.
- **E64 — Répartition sur écran 720px et densités** : mesurer réellement ce qui tient dans une première hauteur, éviter les polices 11px de l'existant.
- **E65 — Liens commerciaux** : « ouvrir » et « créer » sont deux intentions distinctes ; vérifier formulaires et permissions existants.

**Aucune modification SQL, CRM, Abby, chronométrage ou facturation n'est autorisée par ce cahier des charges. La correction de CI PR #84 reste totalement indépendante.**

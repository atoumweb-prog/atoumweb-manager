# Lot 02 — Navigation, recherche transversale et Accueil V2

**Statut : spécification documentaire détaillée, aucune refonte codée, aucune recette UI exécutée.**  
**Source technique :** [LOT-02-MATRICE-EXISTANT-CIBLE.md](LOT-02-MATRICE-EXISTANT-CIBLE.md) — analyse statique de `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.
**Préalables :** Lot 01A–01F, code UX-01 #83 en cours de validation, CI #84 en brouillon ; aucune fusion automatique.

## 1. Ambition et principes UX validés
Le Manager doit offrir **un point d'entrée clair vers ses 17 modules**, navigation compacte, favoris, accès contextuel aux bons dossiers et un Accueil opérationnel en priorité « Aujourd'hui », échéances, alertes, actions réellement exécutables. L'interface doit rester accessible au clavier, fonctionner dans les trois thèmes et trois densités (Compact **14 px cible**), et ne jamais créer un deuxième chrono.

Le rail réduit doit rester **visible et utilisable**, contrairement au comportement CSS actuel qui fait disparaître totalement la sidebar. Les intitulés métier existants ne sont pas des statuts à migrer ; « Prospects » peut conserver la clé interne tout en affichant « Prospection ».

### 1.1 Navigation regroupée
| Groupe visuel | Destinations conservées |
|---|---|
| Accueil | Accueil |
| Commercial | Prospection, Clients, Offres & Tarifs, Devis |
| Production | Projets, Interventions & Maintenance, Gestion des temps |
| Gestion | Facturation, Dépenses, Documents & Contrats |
| Ressources | Bibliothèque AtoumWeb, Sites, Sauvegardes, Annuaire |
| Pilotage | Statistiques, Réglages |

**17 destinations maintenues** ; aucun doublon « Favoris » ne modifie les modules sources. Un clic direct et une recherche d'entité doivent préserver la différence entre **ouvrir un module** et **ouvrir la fiche d'un objet précis**.

## 2. Lot 02A — Rail et navigation de premier niveau

### Constat vérifié
- `App.tsx` détient `NAV_ITEMS`, `activePage`, `navigate`, `sidebarCollapsed`, routeurs de `CustomEvent`.
- Le menu actuel affiche `nav-dot` + libellé en 17 lignes.
- `.app-shell.sidebar-collapsed` dans `styles.css` fixe la colonne à `0`, masque la sidebar et désactive son interactivité.
- Un `sidebar-toggle` existant est accessible dans la topbar, et `atoumweb:sidebar-collapse` est utilisé par des écrans comme Projet.

### Contrat UX V2
- Rail sombre avec pictogramme distinct et libellé au survol/focus ; mode déployé avec texte complet et groupes. Le bouton de réduction reste accessible ; état actif perceptible par couleur **et** autre indicateur.
- Les groupes « Commercial », etc. sont des rubriques de **présentation**, non des nouvelles routes ou permissions. Favoris épinglables vers les mêmes modules, ordonnables, restaurés au démarrage.
- Cliquer une rubrique de groupe ouvre/ferme sans remplacer le module courant ; cliquer un vrai module navigue vers lui et respecte **UX-01 avant destruction de brouillon**.
- Menus flottants : rôle ARIA approprié, retour de focus, Escape, pas d'ouverture piégeuse au seul survol, prise en charge tablette/écran étroit.
- Préférences de rail, favoris, ordre et position gérées par le stockage visuel 01F ; pas de mutation métier. Le repli demandé par Projet peut être **temporaire de contexte**, sans écraser le choix durable de l'utilisateur.
- Logo triangles imbriqués **reste à approuver** ; les composants du rail ne figent ni SVG ni police distante avant validation.

### Critères
Accès aux 17 modules sur rail étroit et déployé, raccourcis fonctionnels, bascules stables, focus/lecteur d'écran, restauration, aucun remount destructif sur navigation refusée.

## 3. Lot 02B — En-tête, favoris et raccourcis
- Préserver **`GlobalSearch`**, **`GlobalTimer`** et **`GlobalClock`** existants dans App.
- Un bandeau repliable ne peut pas enlever tout accès au chrono quand une session est active ni masquer le retour à la recherche ou à la navigation. Sur fenêtre étroite, préférer un repli contrôlé/flyout accessible.
- Le bandeau de Bibliothèque `libraryHeaderCollapsed` est **spécifique à la Bibliothèque**, à ne pas confondre avec le bandeau global.
- Raccourcis : répertorier ceux déjà utilisés par Electron/éditeur avant d'assigner de nouvelles touches. Ne pas déclencher une action dans un champ de saisie par conflit de raccourci.
- Favoris et destinations récentes : l'absence de cible/id valide doit laisser l'écran fonctionnel ; ne pas stocker le contenu des fiches dans la préférence.
- Les commandes « retour » et « historique » ne doivent pas perdre l'éditeur sale ni réinitialiser les filtres d'une vue.

## 4. Lot 02C — Recherche globale et routage vers les fiches

### Existant à réutiliser
`src/renderer/crm/GlobalSearch.tsx` gère saisie dès deux caractères, debounce 180 ms, `requestId` pour résultats périmés, flèches/Entrée/Escape et `role=listbox`. `App.openSearchResult` a des routes par `entityType` ; `DossierPanel.openEntity` émet `atoumweb:navigate`.

### Correction structurelle V2
- Résultat de recherche = **type métier + identifiant exact + contexte de vue** si disponible ; destination ouvre le bon objet et garde l'onglet attendu, pas seulement une page.
- **Écart vérifié E31** : `case 'catalog'` dans `App.openSearchResult` se contente de `setActivePage('Offres & Tarifs')` ; les recherches Catalogue doivent transmettre `setCatalogTarget(result.entityId)` ou une route équivalente et tester `CatalogPage.initialId`.
- Revoir tous les cas type/id, les événements historiques, les `key={...}` provoquant remount et les cibles effacées par `navigate`.
- Lancer **la garde UX-01** avant tout changement destructif de module, fiche, onglet ou fenêtre ; refuser navigation préserve recherche et brouillon et garde le focus utile.
- Une réponse tardive/erreur IPC ne ferme pas un éditeur, ne présente pas un résultat de recherche périmé, ne prétend pas que la fiche est ouverte si le chargement a échoué.
- Échap ferme le résultat de recherche si ouvert, pas la fiche active par inadvertance ; recherche doit être réouvrable au clavier.

## 5. Lot 02D — Accueil opérationnel et widgets

### Constat vérifié
`src/renderer/home/HomeDashboard.tsx` charge huit familles de données : tableau métier (`workflow.dashboard()`), Prospects, actions CRM, Projets, Interventions, Temps, Facturation et alertes opérationnelles. Le composant réagit à `atoumweb:changed`, `time-changed`, `intervention-updated`. Les panneaux actuels incluent quatre KPI, Aujourd'hui, un pipeline **à cinq** agrégats, temps/facturation, « À surveiller », et quatre « Actions rapides ».

### Priorités visuelles V2
1. **Aujourd'hui et échéances** : actions/relances/événements à traiter ; une action ouvre le bon dossier, état terminé/retard sans inférence non prouvée.
2. **Alertes critiques** : distinctes de simples KPI ; restent accessibles même si le widget correspondant est masqué par préférence.
3. **Actions rapides** : vérification de leur effet avant de les baptiser « + Prospect », « + Devis » etc. **Le code actuel ne fait que naviguer vers le module** pour les quatre raccourcis ; la cible V2 devra ouvrir un vrai formulaire de création sans créer le dossier avant sauvegarde, ou renommer honnêtement en « Ouvrir ».
4. **Pipeline commercial** : passer de **cinq catégories actuelles** aux **sept étapes visuelles déjà validées** (À qualifier, Besoins, Préparer le devis, Attente du retour, Négociation, Finalisation, Conversion), en projection des statuts backend existants, **sans créer de nouvelles phases techniques**. Comptage, fusionnement/archivage, `won/lost` et navigation du widget à tester.
5. **Temps/facturation** : vue résumée du temps et montant « À facturer », jamais une seconde session Chrono ; vérifier liens vers facturation réelle/élément du compteur.
6. **Personnalisation** : widgets ordonnables/masquables et disposés pour écran quotidien à zéro ou un scroll principal, sans cacher les alertes, sans empêcher un retour à la vue par défaut.

### Garde-fous
- Reprendre les services métier existants plutôt que doubler leurs calculs dans l'UI, documenter séparément tout agrégat nouveau nécessaire.
- Écran chargement/échec/partiellement disponible ; bouton « Réessayer » ; ne pas effacer les bonnes données lors d'une actualisation partielle.
- Réponses asynchrones récentes uniquement, pas de rafraîchissement en boucle au déplacement des widgets.
- **Écart E40** : `HomeDashboard.css` contient actuellement des textes fonctionnels à 10–13 px ; contrôler effets des CSS globaux et viser un minimum **14 px** conformément à E01 avant recette.
- Design couleur méticuleux : codes de priorité/état accessibles sans couleur seule, trois thèmes × trois densités.

## 6. Lot 02E — Recette et migration progressive
1. Relever SHA/PR actifs et déterminer les conventions UX-01 réellement fusionnées.
2. Créer/valider un **contrat de routage de navigation** (`module/entityType/entityId/view/tab/source` conceptuel) ; les noms restent à ajuster au code existant.
3. Faire l'inventaire `ancienne action → handler App → événement → destinataire → cible → service → erreur → test` sur 17 modules, sans supprimer un ancien chemin.
4. Développer sur atelier UX isolé du Lot 01F ; pas de reprise du `workflow.createDemo()` dans le workspace actif.
5. Migrer rail, recherche, Accueil en incréments séparés et réversibles ; captures avant/après et changements tracés dans la PR d'implémentation.
6. Tester navigation et interaction réelles (clavier, scroll, touch/pointeur, fenêtres étroites, chrono actif, gardes de brouillon), et faire valider humainement avant toute fusion.

## 7. Matrice de recette (tests proposés, PAS exécutés)
| ID | Scénario | Exigence |
|---|---|---|
| R02-01 | Parcourir 17 destinations avec menu déployé | Chaque nom/route accessible et correct |
| R02-02 | Replier le menu | **Rail d'icônes reste visible** et utilisable |
| R02-03 | Ouvrir sous-menu via clic/Tab/Entrée/Espace | Menu accessible, focus/fermeture par Escape |
| R02-04 | Ajouter/supprimer/réordonner favoris puis relancer | Préférence conservée, destination métier inchangée |
| R02-05 | Changer de module pendant éditeur dirty | Garde UX-01, choix « Rester » conserve brouillon et cible |
| R02-06 | Recherche globale résultat Catalogue | **Bon item** ouvert, pas simplement la liste Catalogue |
| R02-07 | Recherche Prospect/Client/Devis/Projet/Intervention | Identifiant correct, bonne fiche, et retour possible |
| R02-08 | Recherche rapide puis réponse périmée/erreur | Pas de résultat obsolète visible, état d'erreur clair |
| R02-09 | Résultat sélectionné au clavier | Entrée ouvre bon dossier, focus prêt pour l'édition |
| R02-10 | Réouvrir même dossier avec saisie non enregistrée | Pas de remount ni discard ; cas `key`/initialId couvert |
| R02-11 | Replier en-tête durant chrono actif | Toujours un accès évident au **chrono unique** |
| R02-12 | Accueil après installation sans données | Message vide, pas de fausse alerte/création |
| R02-13 | Cliquer KPI avec plusieurs éléments | Vue filtrée appropriée ou contenu explicitement annoncé |
| R02-14 | Cliquer les « + » rapides | Véritable **formulaire de création**, sans mutation tant que non sauvegardé, ou libellé « Ouvrir » |
| R02-15 | Pipeline 7 colonnes | Chaque étape visuelle projetée depuis anciens statuts, compteurs sans doublons |
| R02-16 | Widget critique masqué | Alerte de sécurité reste visible dans une autre zone persistante |
| R02-17 | Modifier ordre/visibilité widgets, relancer | Disposition restaurée, reset clair et sans mutation métier |
| R02-18 | Reprise chrono/navigations Projet/Intervention | Une seule session, pas de pause/stop involontaire |
| R02-19 | 3 thèmes × 3 densités, petit écran et zoom | Texte fonctionnel >=14px, aucun raccourci critique perdu |
| R02-20 | Échec de chargement Accueil et retour partiel | Réessayer fonctionne, pas de notification mensongère |
| R02-21 | Historique de navigation et retour après Agrandir | Même objet et onglet pertinents, filtres/scroll préservés |
| R02-22 | Tests service/IPC, typecheck et natifs | Résultats réels horodatés/SHAs, zéro écriture Validation-MSI |

## 8. Questions techniques à résoudre avant Codex
- **E28–E30 :** icônes et structure de rail, conservation du menu réduit, persistance des favoris/contexte.
- **E31–E33 :** standardisation du routage exact et des événements avec protection des brouillons.
- **E34–E38 :** agrégations Accueil, pipeline 7 étapes, sémantique des boutons de création, widgets critiques et mémorisation.
- **E39–E41 :** chrono unique, textes sous 14 px, contrats d'événements transverses.

**Aucune nouvelle décision métier nécessaire pour les principes validés**. L'implémentation devra seulement définir les contrôles de détail et vérifier en contexte les exceptions et contraintes d'IPC.

## 9. Définition de terminé
Lot 02 n'est « terminé » que si les 17 modules demeurent accessibles, les résultats de recherche ouvrent l'entité correcte, les gardes de sortie sont préservées, le chrono global n'est pas doublé, les sept étapes visuelles du pipeline respectent les statuts actuels, les actions rapides ont un effet conforme à leur libellé, les alertes critiques ne sont pas cachées et la recette 3 thèmes × 3 densités réussit sur environnement isolé.

**Ce fichier remplace le simple cadrage initial. Il ne vaut ni implémentation ni certification des tests.**

## 10. Spécifications détaillées des sous-lots 02A/02B
- [LOT-02A-RAIL-NAVIGATION.md](LOT-02A-RAIL-NAVIGATION.md) : correspondance des 17 modules/icônes, favoris, commandes, accessibilité, conservation des handlers et **18 scénarios**. **E42 validé : rail réduit = Accueil + favoris + cinq groupes**, avec panneau de sous-navigation, plutôt que 17 icônes. Les 17 restent visibles en mode déployé ; tailles/icônes à recetter.
- [LOT-02B-ENTETE-RACCOURCIS.md](LOT-02B-ENTETE-RACCOURCIS.md) : barre supérieure, chrono global unique, variantes repliées, recherche accessible, raccourcis sans collision, **16 scénarios** ; aucun repli global de header n'est établi comme déjà livré.
- **Étapes suivantes :** 02C recherche et routage précis, 02D dashboard et agrégats, 02E recette transversale. Garder la PR documentaire distincte de #84 et des correctifs UX-01.

## 11. Couverture détaillée du Lot 02 et état des décisions
- **02A** [rail option A](LOT-02A-RAIL-NAVIGATION.md) — E42 **DÉCIDÉ** : Accueil + favoris + 5 groupes, 17 modules déployés.
- **02B** [en-tête/chrono](LOT-02B-ENTETE-RACCOURCIS.md) — recherche accessible, chrono unique, raccourcis sans collision.
- **02C** [recherche et routage](LOT-02C-RECHERCHE-ROUTAGE.md) — 14 types, exact `entityId`, garde UX-01, anti-races, 18 tests ; E51–E58.
- **02D** [Accueil et widgets](LOT-02D-ACCUEIL-PILOTAGE.md) — 8 sources, priorités Aujourd'hui, alertes, 7 étapes visuelles, 22 tests ; **E59 partiellement tranché** : Conversion = historique de Prospects devenus Clients ; `new` et Finalisation restent ouverts.
- **02E** [recette transverse](LOT-02E-RECETTE-ET-MIGRATION.md) — 20 parcours de bout en bout et livraison par incréments réversibles.

**Statut : documentation 02A–02E disponible dans GitHub. Aucune de ces fonctionnalités n'est livrée par la PR documentaire #82.** Relever le code et la CI intégrés avant mise en œuvre ; **E59 à finaliser** (`new`, « Finalisation » et fenêtre de l'historique) avant de coder le pipeline ; Conversion historique est décidée.

## Raccord Lot 10 — Accueil vs analyse statistique
[10A](LOT-10A-AUDIT-INDICATEURS.md) et [10B](LOT-10B-STATISTIQUES-NAVIGATION.md) précisent que **l'Accueil reste un tableau d'actions prioritaires** (Aujourd'hui, chrono, alertes, facturation à préparer), pas un duplicateur des vues financières. Les calculs Statistiques doivent préciser la population, les périodes et le statut `new` hors pipeline (décision E72), alors que `HomeDashboard` peut afficher séparément l'annuaire/contact si explicitement nommé. Les cartes renvoient aux vraies listes/IDs; **aucun CA encaissé n'est attesté** par les PDF Abby. La restauration SQLite de [10C](LOT-10C-SAUVEGARDES-RESTAURATION.md) n'est pas une action de la page Accueil et ne doit pas être activée sans garde UX-16.

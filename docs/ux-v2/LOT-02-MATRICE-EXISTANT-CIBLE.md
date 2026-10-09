# Lot 02 — Matrice code réel → Navigation et Accueil V2

**Inspection statique ciblée du code : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (09/10/2026).**  
**Statut : traçabilité documentaire, aucune modification de code, aucune recette exécutée.**
**Voir :** [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md), [Décisions](DECISIONS.md), [Lot 01C](LOT-01C-FICHES-PANNEAUX.md), [Lot 01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Fichiers lus et flux observés
| Référence | Fonction réellement observée | Précaution |
|---|---|---|
| `src/renderer/App.tsx` | `NAV_ITEMS` (17 entrées), `activePage`, `navigate`, `openSearchResult`, `GlobalSearch`, `HomeDashboard`, `GlobalTimer`, `GlobalClock`, notices et événements `atoumweb:*` | **Routage central actuellement informel** ; modifications risquent des remounts et pertes de contexte hors UX-01. |
| `src/renderer/styles.css` | Sidebar à labels/points, `sidebarCollapsed` supprime **complètement** sa largeur et son interactivité, bouton de repli dans la topbar | Le futur rail réduit doit rester **accessible**, et ne pas imiter le masquage intégral actuel. |
| `src/renderer/crm/GlobalSearch.tsx` | Saisie min. 2 caractères, délai de 180 ms, `requestId` anti-résultats périmés, flèches/Entrée/Escape, liste de résultats | Préserver debounce, clavier, sélection et prévention des réponses anciennes ; traiter erreurs service/focus. |
| `src/renderer/workflow/DossierPanel.tsx` | `openEntity(target)` répartit via `CustomEvent('atoumweb:navigate', {detail:target})` | Réutiliser ce point de connexion, le remplacer seulement avec compatibilité vérifiée. |
| `src/renderer/home/HomeDashboard.tsx` | Charge huit familles de données via IPC et écoute `atoumweb:changed`, `time-changed`, `intervention-updated`; KPI, Aujourd'hui, pipeline, temps/facturation, alertes, actions rapides | Vue existante à **réorganiser**, non à recréer en inventant un autre agrégat. |
| `src/renderer/home/HomeDashboard.css` | Grilles et scroll interne, valeurs de police diverses ; pipeline `repeat(5, ...)` | Lisibilité cible E01 Compact 14 px ; petite fenêtre et état de charge doivent être vérifiés. |
| `src/renderer/time/GlobalTimer.tsx` | Un chrono global avec reprise de session, menu, catégories et contexte intervention/projet | **Jamais un second chrono dans Accueil**, ni remise à zéro sur navigation. |
| `src/shared/crm.ts` | `PROSPECT_STAGES` backend existants `new/qualifying/need_identified/quote_to_prepare/quote_to_send/quote_sent/follow_up/negotiation/waiting/won/lost` | Les **7 colonnes visuelles V2** ne doivent **pas** introduire de nouveaux statuts techniques. |

## 2. Cartographie obligatoire des 17 entrées du Manager
| Groupe V2 indicatif (sans changer les routes) | Entrées métier déjà dans `NAV_ITEMS` |
|---|---|
| Accueil | Accueil |
| Commercial | Prospects (label public **Prospection**), Clients, Offres & Tarifs, Devis |
| Production | Projets, Interventions & Maintenance, Gestion des temps |
| Gestion | Facturation, Dépenses, Documents & Contrats |
| Ressources | Bibliothèque AtoumWeb, Sites, Sauvegardes, Annuaire |
| Pilotage | Statistiques, Réglages |

Le découpage est une **organisation visuelle** sans nouvel identifiant de module ni suppression de l'annuaire, du catalogue ou de la bibliothèque. Garder 17 destinations indépendantes. Favoris = raccourcis supplémentaires vers **ces mêmes destinations**, sans copie d'un module.

## 3. Écarts précis et preuves source
| ID | Observation réelle | Cible V2 | Risque / vérification |
|---|---|---|---|
| E28 | `App.tsx`: `NAV_ITEMS.map` dessine des `nav-dot` avec texte, pas des icônes métier. | Rail sombre avec icônes identifiables, libellés au déploiement, groupe/favoris. | Réutiliser `OperationIcon` si son jeu convient, noms accessibles et absence de menus duplicatifs. |
| E29 | `styles.css`: `.app-shell.sidebar-collapsed` donne `grid-template-columns: 0 ...`, rend le menu caché/inactif. | **Rail compact toujours visible** avec accès souris/clavier ; pouvoir afficher menus sans perdre le module courant. | Tester recouvrements entre sidebar, GlobalSearch, timer et petit écran. |
| E30 | `App.tsx`: `sidebarCollapsed` et `libraryHeaderCollapsed` en mémoire locale, pas de persistance de ces deux réglages constatée. | Restaurer préférences de navigation, préserver l'état du bandeau Bibliothèque. | Ne pas persister une préférence comme champ métier ; valider portée E08/E23. |
| E31 | `App.openSearchResult` : `case 'catalog': setActivePage('Offres & Tarifs');` sans `setCatalogTarget(result.entityId)`; chemin événement `atoumweb:open-catalog-item` existe pourtant. | Résultat Catalogue → ouvrir **la bonne fiche produit/offre**, pas la seule page. | Inspecter flux `CatalogPage.initialId` et test recherche sur 2 articles homonymes. |
| E32 | `openSearchResult` a plusieurs `setTarget` mais `navigate` réinitialise certaines cibles ; `key` React avec cible spécifique pour Prospects/Clients/Devis. | Route cible stable `module/type/id/tab/source` ; contextualiser recherches/favoris/Accueil. | Éviter remounts et effacement de brouillons, conserver UI-01 #83, gérer même page avec cible différente. |
| E33 | `GlobalSearch` : debounce 180 ms, `requestId` protège le résultat obsolète mais la liste gère le blur par délai de 120 ms ; rejet d'IPC non traité dans l'effet inspecté. | Résultat fiable avec erreurs visibles, focus géré et écran de destination atteint ; préserver clavier. | Tester clic alors que blur arrive, erreur réseau, recherche rapide, Escape et accessibilité combobox. |
| E34 | `HomeDashboard` : quatre KPI, zone Aujourd'hui, pipeline, temps/facturation, alertes et quatre actions rapides ; données chargées via huit IPC. | Accueil piloté par **Aujourd'hui/alertes/échéances/actions utiles**, vues secondaires configurables. | Pas de nouveau backend implicite ; vérifier sources des échéances et règles de priorité. |
| E35 | `HomeDashboard` : `pipeline` de **5** agrégats et CSS `repeat(5,...)`. | Pipeline V2 **7 colonnes visuelles** : À qualifier, Besoins, Préparer le devis, Attente du retour, Négociation, Finalisation, Conversion. | Construire projection UI depuis statuts existants avec tableaux de mapping et tests de compteurs. Pas de nouveaux statuts backend. |
| E36 | `HomeDashboard` : les KPI `Devis à préparer/Projets à démarrer/Interventions` ouvrent une **page**, pas forcément les éléments du compteur ; les « + Prospect / + Devis / + Projet / + Demande » appellent `openPage`, sans action de création dans ce code. | La promesse visuelle d'une action rapide doit **exécuter vraiment l'action nommée** ou afficher « Ouvrir ... ». | Pour « + » : définir une intention de création ciblée et autorisée sans créer automatiquement le dossier lors du clic ; sauvegarde explicite. |
| E37 | `HomeDashboard`: `alertTarget` ouvre la première alerte si sa cible est identifiable ; sinon module Opérations. | Afficher critiques sans masquer, ouvrir la **vraie entité** et son onglet, garder consultation de toutes les alertes. | Vérifier priorités, absence d'alertes, alertes multiples, mauvais fallback et suppression de widget. |
| E38 | `HomeDashboard`: pas de gestion de widgets masqués/ordonnés visible dans le composant. | Widgets classables/masquables, disposition persistée ; alerte critique **toujours visible ailleurs**. | Persistance = préférence, aucune suppression d'événement métier ; écran minimal Accueil. |
| E39 | `App.tsx`: `GlobalTimer` dans la topbar et `HomeDashboard` affiche un *résumé temps*, pas une seconde session. | Chrono **unique** conservé, ne pas confondre KPI temps et bouton démarrer un deuxième timer. | Scénarios de reprise de session/onglets/projets et redimensionnements. |
| E40 | `HomeDashboard.css` : certains textes `10/11/12/13px` sont déclarés dans les cartes. | **Aucune information fonctionnelle sous 14 px** après alignement 01A ; Compact principal cible 14 px. | Vérifier cascade CSS après override, libellés longs et densités 3 thèmes × 3 densités. |
| E41 | `App.tsx` : événements globaux `atoumweb:open-page`, `open-prospects-view`, `open-catalog-item`, `navigate`, `sidebar-collapse`, etc. | Contrat d'événement/routage documenté, destination idempotente et garde sortie. | Ne pas désactiver les liens intermodule existants (Bridge, Bibliothèque, contrats, intervention). |

## 4. Parcours cible « Rechercher → ouvrir bon dossier »
1. Saisie + filtre dans `GlobalSearch`, résultat type/id + sous-titre statut éventuellement.
2. Choix du résultat, navigation déclenchée **seulement après contrôle UX-01** si cela démonte un éditeur sale.
3. `App` achemine type + id + vue/onglet cible; les données se chargent **sans désigner par défaut un autre objet** lorsque la cible est présente.
4. Fiche rapide correcte, puis `Agrandir` (01C), même dossier et même contexte ; historique et retour navigables.
5. Erreur/introuvable/entité archivée : afficher le contexte et possibilité de retour, **aucun succès factice**.
6. Quand l'utilisateur cherche le même objet déjà ouvert : le choix met le focus sur lui, pas une recréation ou perte de brouillon.

## 5. Pipeline de l'Accueil — projection obligatoire, sans nouveaux statuts
La liste décidée des **sept étapes visuelles** est fixe. Le mapping exact `PROSPECT_STAGES` existant → étapes visuelles doit être **explicité et testé** avant implementation, en particulier pour les statuts techniques `new`, `quote_to_prepare`, `quote_to_send`, `quote_sent`, `follow_up`, `waiting`, `won`, `lost`. Les fiches perdues/archive ne doivent pas apparaître comme conversion réussie ; le traitement `won`/compte client doit être cohérent. La couleur des colonnes reste discrète et n'est pas une nouvelle « température ».

Le schéma de 5 compteurs actuellement dans `HomeDashboard` n'est **pas conforme** à la projection à sept colonnes prévue ; cela relève du **Lot 02D** et de la cohérence avec le **Lot 03 CRM**, sans modifier ici les transitions de pipeline.

## 6. Définition de prêt pour développement Lot 02
- Toutes les routes et événements `App` actuels recensés, avec modules de destination et gestion de l'objet sélectionné (pas seulement le changement de page).
- Contrat de navigation avec garde UX-01 sur les sorties potentiellement destructives et un seul chrono.
- Stratégie d'accessibilité/focus pour rail, sous-menus, favoris, recherche et fenêtres réduites.
- Mapping pipeline à sept colonnes revu et testable **sans ajouter de stade backend**.
- Comparatif accueil actuel → accueil cible, y compris boutons « + » et liens direct d'alertes.
- 3 thèmes × 3 densités avec **Compact 14 px cible**, sans perte de lisibilité, et validation humaine.
- Les résultats CI **n'ont pas été exécutés** par le présent document ; la PR #84 reste indépendante et en attente de quota/budget Actions.

**Cette matrice est une inspection initiale, pas un inventaire exhaustif de tous les handlers des 17 modules. Compléter les chemins IPC et scénarios dans les sous-lots 02A–02E avant implémentation.**

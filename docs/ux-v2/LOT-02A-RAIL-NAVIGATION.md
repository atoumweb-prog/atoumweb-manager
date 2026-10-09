# Lot 02A — Rail de navigation, groupes, icônes et favoris

**Statut : spécification préparatoire documentée le 09/10/2026 ; pas de code appliqué, pas de recette effectuée.**
**Référence de comparaison : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.** Déterminer le HEAD intégré et la situation #81/#83/#84 au démarrage des travaux.
**Dépendances :** [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md), [matrice 02](LOT-02-MATRICE-EXISTANT-CIBLE.md), [01A](LOT-01A-TOKENS-VISUELS.md), [01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md), [01C](LOT-01C-FICHES-PANNEAUX.md), [01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md), [01F](LOT-01F-PREFERENCES-RECETTE.md).

## 1. Décisions produit établies
- **Conserver les 17 modules** et toutes leurs actions/identifiants internes. Groupes et favoris = organisation de navigation **seulement** ; aucun module supprimé, répliqué, renommé au niveau backend.
- Direction UI : **rail compact sombre** d'icônes, intitulés explicites au déploiement, menus contextuels et favoris personnalisables. Thèmes AtoumWeb/Noir/Blanc et densités Compact **14 px cible** / Confort 16 / Confort+ 18.
- Le rail **replié reste visible et navigable** : jamais reprendre le CSS actuel `grid-template-columns:0` avec `opacity:0`.
- Navigation clavier/souris, état actif intelligible indépendamment de la couleur, aide `?` accessible.
- Préférences de navigation mémorisées automatiquement ; modifier un favori n'est **jamais** une opération métier.
- Les changements de module susceptibles de détruire un brouillon sont soumis à la **garde UX-01 existante** : confirmer **avant** de changer `activePage`, pas après démontage des éditeurs.

## 2. Code réellement vérifié
| Fichier / symbole | Observation code | Conséquence |
|---|---|---|
| `src/renderer/App.tsx` `NAV_ITEMS` (lignes 26–44) | Tableau de **17 clés** de pages ; libellé `Prospects` affiché `Prospection`. | Ne pas changer les clés sans migration prouvée ; fournir `label` de présentation distinct. |
| `App.tsx` `activePage` et `navigate` | Navigation par `setActivePage`, remise à zéro de certaines cibles Recherche. | Conserver le comportement de navigation volontaire module ; y connecter garde avant changement, ne pas altérer les chemins d'ouverture ciblée. |
| `App.tsx` `sidebarCollapsed` | État React local `false` au démarrage ; bascule dans topbar ; événement `atoumweb:sidebar-collapse`. | 02A doit conserver l'événement historique, différencier préférence durable et demande contextuelle/temporisée. |
| `App.tsx` `NAV_ITEMS.map` | Une seule liste de boutons avec `nav-dot`, pas de rôle d'icône distinct. | Ajouter association stable clé → groupe/label/icône plutôt qu'écraser la liste du routeur. |
| `src/renderer/styles.css` | Déployé `.app-shell {grid-template-columns:258px 1fr}`; réduit `0 minmax(0,1fr)`, sidebar inaccessible `opacity:0;pointer-events:none`. | Revoir CSS de rail, `min-width`, overflow, focus, pas de masquage complet. |
| `src/renderer/operations/OperationIcon.tsx` | SVG intégré et ensemble typé `OperationIconName` : `user`, `folder`, `wrench`, `clock`, `receipt`, `wallet`, `file-text`, `package`, `database`, `server`, `chart` disponibles. | Réutiliser l'existant, ajouter les quelques pictos manquants dans **un seul catalogue**, sans dépendance nouvelle arbitraire. |
| `src/renderer/workflow/DossierPanel.tsx` | `openEntity` émet `atoumweb:navigate` et l'application écoute plusieurs événements `atoumweb:*`. | Éviter de casser les ouvertures contextuelles depuis Bibliothèque, Devis, Projets et Accueil. |
| `src/renderer/time/GlobalTimer.tsx` | Chrono unique monté dans l'en-tête `App`, distinct des modules. | Pas d'un deuxième chrono dans le rail, et aucune interruption due au changement de groupe. |

## 3. Plan des destinations et icônes — proposition traçable
Les noms ci-dessous sont des **libellés UI** et les pictogrammes des **propositions**, pas une nouvelle taxonomie backend.

| Groupe | Clé `NAV_ITEMS` inchangée | Libellé affiché | Icône proposée | Existant ? |
|---|---|---|---|---|
| Accueil | `Accueil` | Accueil | `home` | **à ajouter** à `OperationIcon` |
| Commercial | `Prospects` | Prospection | `user` | oui |
| Commercial | `Clients` | Clients | `users` | à ajouter |
| Commercial | `Offres & Tarifs` | Offres & Tarifs | `package` | oui |
| Commercial | `Devis` | Devis | `file-text` | oui |
| Production | `Projets` | Projets | `folder` | oui |
| Production | `Interventions & Maintenance` | Interventions & Maintenance | `wrench` | oui |
| Production | `Gestion des temps` | Gestion des temps | `clock` | oui |
| Gestion | `Facturation` | Facturation | `receipt` | oui |
| Gestion | `Dépenses` | Dépenses | `wallet` | oui |
| Gestion | `Documents & Contrats` | Documents & Contrats | `file-check` | à ajouter pour différencier Devis |
| Ressources | `Bibliothèque AtoumWeb` | Bibliothèque AtoumWeb | `layers` | à ajouter |
| Ressources | `Sites` | Sites (Bridge) | `server` | oui |
| Ressources | `Sauvegardes` | Sauvegardes | `database` | oui |
| Ressources | `Annuaire` | Annuaire | `contact` | à ajouter pour différencier Clients |
| Pilotage | `Statistiques` | Statistiques | `chart` | oui |
| Pilotage | `Réglages` | Réglages | `settings` | à ajouter |

**Validation visuelle restant à faire :** distinguer de petits pictogrammes proches (Prospects/Clients/Annuaire, Devis/Documents, Projets/Bibliothèque) à 16–20px sans imposer une nouvelle librairie. SVG d'icône décorative = `aria-hidden` ; bouton parent = nom accessible.

## 4. Choix de composition du rail compact — **E42, à arbitrer par AtoumWeb**
Deux modèles cohérents avec les décisions prises jusqu'à présent :

**A — Recommandation ergonomique : rail à groupes + favoris**
- En haut : Accueil, puis icônes des **favoris réellement épinglés** (0 ou plusieurs, sans doublon involontaire).
- Ensuite : 5 icônes de groupes **Commercial / Production / Gestion / Ressources / Pilotage**.
- Clic/touche Entrée sur une icône de groupe = panneau de sous-navigation avec intitulés des modules ; l'icône de groupe n'ouvre **aucun** module indéterminé.
- En mode déployé : les 17 modules sont visibles sous leurs groupes avec leurs libellés, compte tenu du scroll vertical.

**B — Accès direct aux 17 modules en rail replié**
- Une icône par module dans la barre, éventuellement répartie par séparateurs de groupe et favoris.
- Avantage : un clic par module ; inconvénient : surcharge/scroll selon hauteur de fenêtre et confusion entre icônes proches.

**Arbitrage attendu :** A ou B pour le **mode réduit**, sans rouvrir les décisions sur les 17 modules, les groupes et les favoris. Aucune implémentation ne doit acter A comme une validation implicite.

## 5. Contrat d'interaction — quelle que soit l'option E42
### Déployer / réduire
- Commande en en-tête du rail et/ou topbar accessible : état `aria-expanded` + nom « Déployer la navigation / Réduire la navigation ».
- Le rail réduit conserve largeur positive ; **ordre et emplacement testés visuellement**, non figés à 64/72px sans maquette.
- Un groupe/une fiche ne change pas de module par un simple `hover`. Survol = aperçu facultatif et tooltip lisible ; clic, Entrée ou Espace = action explicite.
- `Escape` ferme le sous-menu et rend le focus à son déclencheur ; retour aux modules sans souris.
- Sur fenêtre étroite, flyout/panneau peut recouvrir temporairement le contenu **sans masquer le bouton de fermeture**, la recherche et le chrono actif.

### Favoris
- Épingler/désépingler par commande explicite, nom et icône ; un favori est une **référence de module**, non une copie de données ou un deuxième écran.
- Pas de doublon visuel inexplicable si le module figure déjà en accès direct ; état épinglé visible/accessibilisé.
- Tri volontaire (clavier et/ou boutons Déplacer vers le haut/bas) ; reset « Réinitialiser les favoris » avec confirmation UX appropriée si l'action supprime une personnalisation, **sans intervention métier**.
- Après relance : favoris et ordre restitués, clés inconnues ignorées, nouvelles entrées obligatoires toujours trouvables via groupes.
- Si aucun favori, guider l'utilisateur sans ajouter d'entrée imposée.

### État actif, accès et contexte
- `aria-current="page"` sur la destination active réelle et distinction visuelle non basée uniquement sur une couleur.
- Dans un groupe fermé, marquer aussi le groupe parent actif sans faire croire que cliquer groupe est la navigation vers une autre fiche.
- À la navigation directe vers module, appliquer les comportements de sélection du module cible ; ne pas réinitialiser silencieusement un éditeur d'un autre module.
- Si navigation depuis recherche/Accueil : afficher la bonne cible (type/id), et laisser le routeur 02C contrôler gardes et historique.
- Pas de création/suppression/archivage par clic sur un favori, une rubrique ou une icône de navigation.

## 6. Persistance, données et sécurité
- La préférence navigation doit passer par le futur stockage visuel 01F : `railCollapsed`, `favoriteModuleKeys`, `favoriteOrder`, `groupsExpanded` si cette dernière préférence a un intérêt testé.
- **À instruire** : profil utilisateur / installation / workspace ; clés de route valides au bootstrap, règle lorsque données/droits changent, migration de version et exceptions d'atelier. Ne jamais persister données clientes ou contenu de formulaire dans ce magasin.
- L'événement existant `atoumweb:sidebar-collapse` pourra exprimer une **demande temporaire** (atelier Projet) sans écraser le choix par défaut du rail. Préserver les autres événements historiques.
- Un changement de préférences de navigation n'est **pas** couvert par UX-01, car il n'abandonne pas de brouillon. Un changement destructif d'écran **l'est**.
- Vérifier le comportement quand le processus principal refuse la sauvegarde de préférence : affichage correct, erreur signalée, aucun faux message « préférence enregistrée ».

## 7. Ordre de développement proposé (après approbation)
| Étape | Travail | Preuve demandée |
|---|---|---|
| 02A.1 | Inventaire `NAV_ITEMS`, événements `atoumweb:*`, chemins source→route, CSS et icônes actuelles | Matrice de sources/handlers et cas de remount |
| 02A.2 | Arbitrer E42, faire atelier rail A/B selon thème/densité | Maquette/atelier comparatif et choix validé humainement |
| 02A.3 | Créer modèle de présentation `moduleKey/label/group/icon/description` sans changer les clés métier | Typecheck et tests des 17 routes |
| 02A.4 | Migrer styles/components nav avec compatibilité `sidebarCollapsed` et garde UX-01 | Test déclencheurs, ESC/focus, petites fenêtres |
| 02A.5 | Ajouter favoris et persistance visuelle contrôlée ; réinitialiser | Tests de redémarrage / clé périmée / cas erreur |
| 02A.6 | Comparer capture/rendu et tests métier entre `main` et nouvelle navigation | Recette 3 thèmes × 3 densités et non-régression |

## 8. Recette précise — tests non exécutés
| ID | Scénario | Résultat |
|---|---|---|
| R02A-01 | Ouvrir chacun des 17 modules déployés | La bonne vue s'affiche, intitulés et clés stables |
| R02A-02 | Réduire le rail | Navigation reste **visible** ; aucun bouton hors écran sans accès |
| R02A-03 | Accéder module via rail réduit | Tous les modules restent atteignables en quelques actions |
| R02A-04 | Groupes/sous-menus par clic, clavier, Escape | Focus géré, pas de navigation au simple survol |
| R02A-05 | Tester lecteur d'écran et focus | Icônes nommées ; `aria-current` correct ; pas d'icône seule inaccessible |
| R02A-06 | Ajouter, retirer et réordonner favoris | Module d'origine inchangé, pas de doublon confus |
| R02A-07 | Quitter puis relancer | Favoris/largeur/mode restaurés selon portée validée |
| R02A-08 | Favoris contenant une clé retirée/renommée | Ne plante pas, conserve accès aux autres modules |
| R02A-09 | Changer module avec brouillon `dirty` | Garde UX-01 avant démontage ; « Rester » conserve sélection et saisie |
| R02A-10 | Réduire/déployer avec brouillon `dirty` | Aucune garde inutile, brouillon intact |
| R02A-11 | Changer via `atoumweb:open-page` et raccourcis historiques | Bonne destination et garde, navigation directe non cassée |
| R02A-12 | Déclencher `atoumweb:sidebar-collapse` depuis atelier Projet | Demande contextuelle non confondue avec choix durable |
| R02A-13 | Ouvrir le rail pendant chrono actif | Chrono unique continue et commande reste trouvable |
| R02A-14 | Changer les thèmes et densités | Compact principal 14 px cible, pictos/labels visibles dans neuf combinaisons |
| R02A-15 | Tester petites fenêtres/zoom/hauteur 720px et inférieure | Groupes, favoris et contrôle d'extension restent atteignables |
| R02A-16 | Simuler panne d'enregistrement des préférences | Erreur visible, aucun changement métier |
| R02A-17 | Fermer/revenir depuis fiche agrandie | Module et contexte restaurés, pas de remount silencieux |
| R02A-18 | Rejouer tests ciblés et complets après migration | Résultats horodatés et comparés, pas de nouveau test présenté comme effectué avant exécution |

## 9. Risques et exclusions
- **E42**, choix visuel rail replié : **en attente de validation** ; les deux approches doivent être comparées avant implémentation.
- **E43**, usage réel de `atoumweb:sidebar-collapse` et persistance actuelle : inventorier les émetteurs, décider comment gérer demande temporaire vs préférence stockée.
- **E44**, hiérarchie des favoris : s'ils pointent seulement sur des modules, ne pas laisser entendre qu'ils ouvrent une fiche identifiée ; favoris de dossiers, si un jour demandés, relèveront d'un cadrage séparé.
- **E45**, largeur/flyout : mesurer zoom et trois densités ; les valeurs CSS actuelles 258px déployé/0px réduit sont des constats, pas la cible.
- Ne pas intégrer ici des modifications de recherche, de workflow CRM, de pipeline métier, de chrono, de CGV, de contrats, de projets ou de SQLite.
- Aucun logo triangulaire final adopté avant validation visuelle AtoumWeb ; emplacement réservé et compatibilité avec `brand-mark` actuel.
- **PR #84** sur CI, indépendamment de 02A : un run CI peut être lancé par Codex sur autorisation distincte ; ne pas confondre ses résultats avec ceux de ce lot.

**Définition de prêt pour code 02A : arbitrage E42 validé, cartographie handlers/event CSS consolidée, atlas d'icônes approuvé, fixtures isolées, garde UX-01 intégrée ou précisément planifiée. Ce fichier seul n'autorise pas la refonte.**

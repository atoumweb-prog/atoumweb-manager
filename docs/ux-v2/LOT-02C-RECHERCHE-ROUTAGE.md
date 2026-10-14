# Lot 02C — Recherche globale et routage fiable vers les fiches

**Statut : spécification UX/UI V2, non développée.**  
**Inspection statique : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` le 09/10/2026.** La PR UX-01 #83 reste une dépendance : vérifier sa version réellement intégrée avant de toucher au routeur ou au démontage des éditeurs.
**Documents liés :** [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md), [matrice 02](LOT-02-MATRICE-EXISTANT-CIBLE.md), [02A — rail option A validée](LOT-02A-RAIL-NAVIGATION.md), [02B](LOT-02B-ENTETE-RACCOURCIS.md), [01C](LOT-01C-FICHES-PANNEAUX.md), [01E](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Résultat attendu, sans nouvelle règle métier
- Chercher un Prospect, Client, prestation, Devis, Projet, Intervention ou autre objet référencé, **choisir un résultat identifié**, et ouvrir **sa fiche** — pas seulement son module.
- La recherche et la navigation depuis Accueil, favori, intervention, document et autres écrans utilisent un **contrat de destination compatible** avec l'existant.
- Si une sortie provoquerait la destruction d'un brouillon, la **garde UX-01 intervient avant le changement de page/id/clé React**. « Rester » conserve objet, éditeur, saisie, filtres et recherche ; seule une navigation réellement autorisée peut nettoyer une recherche.
- Un échec de recherche/IPC/chargement de fiche ne déclenche **aucun message de succès** (« trouvé » ne vaut pas « ouvert »), n'efface pas la saisie de recherche et ne sélectionne pas une fiche voisine.
- Aucune duplication des services métier, ni de `UnsavedRegistry` ; aucune écriture en base lors de l'ouverture d'un résultat.

## 2. Code existant — observations vérifiées, pas exécution
| Chemin / rôle | Comportement de référence | Écart et conservation |
|---|---|---|
| `src/renderer/crm/GlobalSearch.tsx` | Recherche après **2 caractères**, délai **180 ms** ; `requestId.current` écarte les réponses anciennes **dans le `.then`** ; navigation flèches, Entrée, Escape ; `listbox` et `option`. | Garder ces avantages et revoir gestion des erreurs, réponse après effacement de la requête, délai `onBlur` de **120 ms**, cycle focus/clavier. |
| `GlobalSearch.choose(result)` | Appelle `onOpen(result)`, **vide aussitôt la requête et ferme** le résultat, sans accusé de réussite. | Un refus UX-01 ou une cible introuvable doit conserver/restituer recherche et sélection ; transition UI après résultat de navigation, pas avant. |
| `src/renderer/App.tsx` `openSearchResult` | Switch sur `SearchResult.entityType`, `set*Target(entityId)`, `setActivePage` ; notification « trouvé ». | Router l'**identité exacte**, ne pas déclarer l'ouverture réussie avant que la fiche ne soit chargée ; gérer entité inconnue sans fallback silencieux. |
| `App.tsx` `case 'catalog'` | `setActivePage('Offres & Tarifs')` **sans affectation de `catalogTarget`**. | **E31 confirmé** : joindre `entityId` via le canal actuellement fonctionnel `setCatalogTarget`, sans modifier données du Catalogue. |
| `src/renderer/commercial/CatalogPage.tsx` | `initialId` consommé par effet `setSelectedId(initialId)` + `loadDetail(initialId)` via service `catalog.getItem`. | Le composant **peut déjà recevoir un ID** ; préserver les brouillons/version et ne pas écraser un résultat plus récent par un chargement tardif. |
| `App.tsx` `navigate(page)` | Réinitialise volontairement des cibles `operations/project/library/backup/document/catalog/directory` selon destination. | Distinguer **ouvrir module** (sélection neutre) de **ouvrir objet identifié** ; ne pas appeler la route de nettoyage après une cible explicite. |
| `App.tsx` composants | `ProspectsPage key=` dépend de cible/vue/filtre ; `ClientsPage key={crmTarget}`, `QuotesPage key={quoteTarget}`. | **E32** : une nouvelle cible peut provoquer un remount/abandon ; appliquer garde UX-01 avant la modification de `key`, conserver l'onglet quand la cible est identique. |
| `src/renderer/workflow/DossierPanel.tsx` | `openEntity(target)` émet `CustomEvent('atoumweb:navigate',{detail:target})`. | Maintenir le canal de navigation intermodule ; publier une API de routage unique avant retrait d'un ancien événement. |
| `App.tsx` `atoumweb:open-page`, `open-prospects-view`, `open-intervention-conclusion`, `open-catalog-item`, `open-library-item` | Canaux distincts employés par modules et Accueil ; l'ouverture de conclusion passe déjà `focus:'conclusion'`. | Ne pas « simplifier » en supprimant le **focus métier** ou les routes spécialisées. |
| `src/renderer/commercial/QuotesPage.tsx` | `initialId` initialise la fiche, effets `Escape`/`pointerdown` peuvent fermer le panneau. | Tester fermetures et brouillons sur code réellement intégré de #83 ; ne pas propager une garde de manière redondante. |
| `src/renderer/projects/ProjectsPage.tsx` | `openProject(id)` réinitialise onglet `plan`, nœud, historiques locaux et charge le projet via un `await`. | Sur retour vers le **même** projet, éviter une perte d'onglet et de brouillon ; sur **autre** projet, garde et contrôle réponses tardives. |
| `src/renderer/crm/ClientsPage.tsx` | `selectedId`, données annexes chargées en parallèle, fermeture de fiche sur `pointerdown` extérieur. | Pas de protection universelle Clients dans #83 ; intégrer aux lots métiers, protéger les chemins destructifs avant de les déclarer sûrs. |

## 3. Matrice des types issus de la recherche globale
Les noms `entityType` ci-dessous sont vérifiés dans `GlobalSearch.entityLabel` et `App.openSearchResult` de `main` :

| Type | Module cible actuel | Objet exact à ouvrir dans V2 |
|---|---|---|
| `prospect` | Prospects / « Prospection » | Fiche du prospect identifié, vue demandée ou annuaire ; onglet existant conservé si même objet |
| `client` | Clients | Fiche du Client ID |
| `catalog` | Offres & Tarifs | **Article du catalogue ID** — écart actuel |
| `quote` | Devis | Devis ID |
| `project` | Projets | Projet ID et, si explicite, onglet/nœud de contexte |
| `service_request` | Interventions & Maintenance | Demande ID |
| `intervention` | Interventions & Maintenance | Intervention ID, cible de conclusion quand c'est le contexte |
| `maintenance` | Interventions & Maintenance | Abonnement ID |
| `hour_pack` | Interventions & Maintenance | Pack d'heures ID |
| `client_document` | Documents & Contrats | Document client ID |
| `atoumweb_library` | Bibliothèque AtoumWeb | Ressource ID |
| `backup_record` | Sauvegardes | Sauvegarde ID (ouvrir/consulter ne veut **pas** dire restaurer) |
| `organization` | Annuaire | Organisation ID |
| `contact` | Annuaire | Contact ID |

**Cas inconnu :** le `default` actuel ouvre **Clients**. La V2 doit au contraire signaler qu'un type n'est pas pris en charge, rester sur l'écran actif et consigner le problème. Ne jamais tomber sur une fiche Client quelconque.

## 4. Contrat conceptuel de routage (non implémenté)
`NavigationTarget = { moduleKey, entityType?, entityId?, view?, tab?, focus?, source? }`.
- **`moduleKey`** reprend l'une des 17 clés internes (`Prospects`, `Offres & Tarifs`, etc.) ; `label` public peut différer. Ne jamais créer de nouveau module nommé « Recherche ».
- **`entityType/entityId`** identifient sans ambiguïté la fiche ; jamais de recherche par **libellé seul** lorsque l'ID existe.
- **`view/tab/focus`** optionnels doivent être acceptés **uniquement** si le module les connaît, et normalisés sans fabriquer un onglet.
- **`source`** est une information de contexte (recherche/Accueil/fiche) sans permission supplémentaire ; ne pas laisser un événement IPC client contourner le contrôle de service métier.
- **Résultat de navigation** : `opened`, `cancelled`, `failed`, `unsupported` ; cette forme est une proposition, pas une API existante. Seul `opened` peut fermer automatiquement la palette/afficher une notification de dossier réellement ouvert.
- **Idempotence** : rouvrir la fiche déjà active ne provoque pas de `key` différente, ne remet pas l'onglet à zéro ni ne perd le brouillon.
- **Invariants** : l'onglet/brouillon actuel ne change pas jusqu'à l'autorisation de sortie ; aucun `setActivePage` anticipé suivi d'un dialogue.

### 4.1 Cycle d'une ouverture ciblée
1. Choix d'une entrée dans `GlobalSearch` (ou émission ancienne `atoumweb:navigate`) ; le texte reste conservé **tant que l'ouverture n'est pas confirmée**.
2. Normaliser `entityType + entityId` et vérifier que la destination existe ; un lien simple de module a sa propre intention.
3. Interroger la **garde UX-01 existante** pour la sortie potentiellement destructive, sur le **groupe correct**. Réponse annulation = ne rien changer, garder saisie/focus.
4. Après autorisation, annoncer un chargement de destination ; vérifier que l'objet demandé est reçu sans erreur et sans écraser un objet ouvert entre-temps.
5. Passer à la vue/fiche exacte et son focus, puis éventuellement fermer la palette et confirmer. Échec = explication, retour à l'état précédent ou vue stable selon la transaction réellement possible.
6. Les effets `Escape`, clic hors fenêtre, nouvelle recherche et notifications concurrents ne peuvent pas déclencher une seconde ouverture fantôme.

**Séquence à adapter au modèle actuel** : le routeur React peut devoir changer le module avant de charger la fiche ; s'il n'est pas techniquement possible de charger avant navigation, il faut gérer état de transition/réversion, jamais annoncer une ouverture réussie tant que l'objet est introuvable.

## 5. Erreurs, accessibilité et recherches concurrentes
- Le délai `180 ms` est un constat ; conserver ou ajuster après mesure, **pas créer une requête par frappe** sans contrôle.
- Invalider explicitement les requêtes lorsque texte passe à 0–1 caractère, qu'une recherche est fermée, qu'un module change, ou qu'un nouveau terme est saisi : le mécanisme `requestId` actuel n'est incrémenté que sur la branche de recherche valide, ce qui mérite un test de réponse tardive **après effacement**.
- `.catch` attendu sur appel IPC `window.atoumweb.crm.search.global` : erreur visible dans palette, sans promesse de résultat ; pas d'`unhandledRejection`.
- Liste de résultat accessible : rôle/liaison `combobox` vs `listbox`, `aria-activedescendant` si nécessaire, fermeture par `Escape`, focus prévisible ; l'emploi de boutons avec `role=option` et `aria-selected` doit être revu pour une sémantique cohérente.
- `onBlur` avec temporisation de 120 ms, `onMouseDown.preventDefault` : vérifier souris/tactile/lecteur d'écran avant de conserver un contournement de blur.
- Résultats homonymes : **titre + catégorie + sous-titre + statut**, et ID utilisé pour ouvrir le bon dossier sans dévoiler de secret.
- Aucun résultat / chargement / délai / erreur doivent être distinguables ; ne pas désactiver la recherche si le service répond lentement.
- Touches flèches, Entrée, Tab, Shift-Tab, Escape testées en présence d'éditeurs Code et de modales de confirmation UX-01.

## 6. Sous-étapes du développement après accord
| Phase | Action | Preuve |
|---|---|---|
| 02C.1 | Cartographier 14 `entityType` : appelant, routeur, props, effet module, service, focus, erreur et garde | Matrice source → type/id → destination, chemins historiques |
| 02C.2 | Spécifier destination et réponse d'ouverture ; conserver `atoumweb:navigate` et `open-*` via adaptateurs | Contrat typé/test d'idempotence, pas de régression événementielle |
| 02C.3 | Ajouter le pilote **Catalog ID**, les cas inconnus et la confirmation réelle d'ouverture | Tests bon ID/erreur/aucune cible fantôme |
| 02C.4 | Piloter la garde UX-01 **avant** remount de la sélection avec reprise de la palette après annulation | Tests dirty/pending/Escape et édition |
| 02C.5 | Durcir `GlobalSearch` asynchrone, erreurs, focus et petit écran | Tests anti-races/ARIA/clic-clavier |
| 02C.6 | Répéter sur autres modules en respectant leurs lots, puis recette neuf modes | Résultats tests/captures SHA datés et validation humaine |

**Périmètre du lot 02C initial :** une solution de routage commune, un pilote Catalog et des tests sur les chemins intermodule les plus risqués. Pas de migration d'un coup des 14 éditeurs ni de modification des états backend.

## 7. Recette proposée (AUCUN test exécuté par ce fichier)
| ID | Scénario | Résultat attendu |
|---|---|---|
| R02C-01 | Rechercher deux prestations de titre proche | Bon **`catalog.entityId`**, pas simple ouverture liste Catalogue |
| R02C-02 | Rechercher Prospect/Client/Devis/Projet | Même identifiant ciblé que le résultat, jamais une fiche « voisine » |
| R02C-03 | Rechercher Demande/Intervention/Abonnement/Pack | Bonne sous-vue dans Opérations et ID conservé |
| R02C-04 | Rechercher Document/Bibliothèque/Sauvegarde/Organisation/Contact | Cible exacte ; ouverture de Sauvegarde **sans restauration** |
| R02C-05 | Résultat d'un type inconnu | Message « type non pris en charge », aucune navigation forcée vers Clients |
| R02C-06 | Sélection avec brouillon Prospect/Devis sale | « Rester » laisse même dossier, champ, onglet, recherche disponible |
| R02C-07 | Naviguer vers même fiche déjà ouverte avec brouillon | Aucune nouvelle instance ni reset du contenu |
| R02C-08 | Changer de cible pendant un chargement lent | L'ancien retour n'écrase pas la nouvelle fiche |
| R02C-09 | Taper 3 caractères puis effacer pendant requête | Résultats périmés **ne réapparaissent pas** |
| R02C-10 | Erreur/timeout du service de recherche | Erreur compréhensible, pas d'`unhandledRejection`, requête intacte |
| R02C-11 | Objet supprimé/archivé avant ouverture | Échec explicite, pas de message « trouvé = ouvert » |
| R02C-12 | Flèches, Entrée, Escape, Tab/Shift-Tab | Focus et liste cohérents, pas de navigation fantôme |
| R02C-13 | Choisir au pointeur alors que `onBlur` se déclenche | Même résultat que clavier, pas de sélection perdue |
| R02C-14 | Ouvrir depuis `DossierPanel.openEntity` | Ancien événement `atoumweb:navigate` compatible |
| R02C-15 | Ouvrir depuis Accueil ou événement `open-intervention-conclusion` | Bonne fiche / bon focus spécifique, sans écriture métier |
| R02C-16 | Revenir à la liste ou agrandir après recherche | Filtres, sélection et onglet pertinents conservés |
| R02C-17 | Recherche dans fenêtre étroite, 3 thèmes × 3 densités | Compact texte principal 14 px, liste lisible, actions accessibles |
| R02C-18 | Lancer tests ciblés, suite complète et protections UX-01 | Logs, SHA, CI distincte réellement exécutée, aucune écriture Validation-MSI |

## 8. Écarts spécifiques à résoudre, hors arbitrages nouveaux
- **E51** : `choose` vide la requête/ferme avant résultat de navigation et même si UX-01 annule ; prendre en charge réponse.
- **E52** : `requestId` n'est pas invalidé lorsque `query.length<2` ; possible retour d'ancienne recherche après effacement.
- **E53** : `.then` de recherche sans `.catch` ; erreur IPC non affichée et rejet potentiellement non géré.
- **E54** : fallback `default` vers Clients sans type valide ; signaler plutôt que naviguer.
- **E55** : `key` React et `navigate` de nettoyage de cible ; garde et idempotence à tracer.
- **E56** : notification « trouvé » avant preuve d'ouverture ; distinguer sélection/changement de page/objet vraiment chargé.
- **E57** : `GlobalSearch` avec input `aria-controls` vers `role=listbox` et boutons `role=option` ; vérification ARIA/blur/tactile à conduire.
- **E58** : état de navigation courant déclenché depuis différents canaux `atoumweb:*` ; centraliser l'intention sans casser la compatibilité.

**Les huit écarts E51–E58 complètent E31–E33 et le registre Lot 02.** Cette spécification ne prouve pas leur reproduction par test : ce sont des observations statiques et exigences de recette. Aucun code, aucune CI, aucun service métier n'a été modifié ici.

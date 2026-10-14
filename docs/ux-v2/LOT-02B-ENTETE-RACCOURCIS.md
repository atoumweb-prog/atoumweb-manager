# Lot 02B — En-tête, chrono global, raccourcis et repères de navigation

**Statut : spécification documentaire, aucune modification du Manager.**  
**Code inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda`.**
**Références :** [Lot 02](LOT-02-NAVIGATION-ACCUEIL.md), [02A — rail](LOT-02A-RAIL-NAVIGATION.md), [matrice de référence](LOT-02-MATRICE-EXISTANT-CIBLE.md), [01B — composants](LOT-01B-COMPOSANTS-ELEMENTAIRES.md), [01C — panneaux](LOT-01C-FICHES-PANNEAUX.md), [01E — brouillons](LOT-01E-FORMULAIRES-CONFIRMATIONS.md).

## 1. Objectif décidé
Un en-tête **discret, réductible, pratique** pour la recherche globale, le temps de travail, les notifications et le contexte du module, sans perdre les accès essentiels. Les raccourcis doivent **réellement déclencher** l'action annoncée. Le rail d'icônes et l'en-tête ne doivent pas entrer en concurrence, surtout en fenêtre étroite.

## 2. Existant vérifié
| Fichier / élément | Constat de code | Contrainte V2 |
|---|---|---|
| `src/renderer/App.tsx`, `<header className='topbar'>` | `sidebar-toggle`, `GlobalSearch`, bouton spécial Bibliothèque, `GlobalTimer`, `GlobalClock`. | Ne pas supprimer ces accès ni détourner leurs handlers. |
| `src/renderer/styles.css` | `.main-area` lignes 83+ : rangée d'en-tête de **68 px** ; `.topbar` ; règles réactives ~1220, 900 et 760 px. | Garder un espace de travail suffisant sans cacher un contrôle critique. |
| `src/renderer/time/GlobalTimer.tsx` | Un chrono global avec session `active`, `recovery`, `pendingSwitch`, `busy`, dialogues de récupération, arrêt et pause ; éléments `role=dialog` pour actions. | **Ne pas reproduire dans le rail un second chrono**. Replier l'en-tête ne ferme pas les décisions en cours ni la session. |
| `src/renderer/App.tsx` | `GlobalClock` ajouté à la droite du timer ; recherche à gauche. | Heure affichée distincte du compteur de durée ; peut être secondaire en petit écran. |
| `App.tsx` `libraryHeaderCollapsed` | État local qui agit **sur le bandeau de Bibliothèque** seulement, avec commande topbar. | Ne pas mélanger avec éventuel repli du header global. |
| `src/renderer/crm/GlobalSearch.tsx` | Recherche des entités, entrée clavier ; routage dans `App.openSearchResult`. | Le champ doit rester accessible même en en-tête compact ; détail routeur traité 02C. |
| `App.tsx` `message`, `messageAction` | Notification dans contenu, pouvant fournir action `Ouvrir dans l'Explorateur`. | Ne pas déplacer sans préserver l'action et sans afficher de succès avant effet confirmé. |

## 3. Composition cible — rôles plutôt qu'encombrement fixe
| Zone | Rôle V2 | Comportement petit écran |
|---|---|---|
| Début d'en-tête | Bouton rail (02A), contexte de page/chemin si utile | Icône toujours disponible, pas d'action cachée |
| Centre | Recherche globale, avec cible/type compréhensibles | Champ réduit ou commande explicite `Rechercher` ouvrant un dialogue utilisable |
| Droite | **Chrono unique**, état en cours/pausé/récupération et actions | Représentation courte avec durée ou voyant + commande `Ouvrir le chrono`; session non interrompue |
| Options secondaires | Horloge, aides, actions d'espace/paramètres non destructives | Peuvent passer dans un menu de débordement avec libellés |
| Message global | Retour exact et contextualisé des actions | Notice non intrusive, texte et action conservés ; erreurs de sécurité/contrats visibles |

**Pas de règle définitive sur les pixels et breakpoints sans recette**. L'en-tête peut se rétracter, mais jamais masquer complètement **navigation + recherche + chrono actif**.

## 4. Repli de l'en-tête — état proposé, non codé
- L'utilisateur peut choisir **En-tête développé / compact**, préférence de **présentation** persistable via 01F ; commande explicite pour revenir.
- En compact : minimum d'accès direct au rail, à la recherche et à l'état du chrono (indicateur lisible + commande), avec menu pour les secondaires ; la zone de travail gagne de la hauteur.
- La **réduction du bandeau Bibliothèque** reste un état spécifique et indépendant.
- Quand une modal de récupération/arrêt/pause chrono est ouverte, le basculement du header ne doit ni la fermer ni lui faire perdre le focus ; si nécessaire différer la réduction de la représentation visuelle.
- Changement d'onglet/module, repli de rail, déroulé de menu ou navigation historique **ne doivent jamais** stopper, suspendre ou créer une session temps.
- Les préférences d'affichage s'enregistrent automatiquement, pas les réglages d'une session temps ; l'IPC de temps reste le propriétaire de toute mutation.

## 5. Raccourcis clavier — exigences avant attribution
- Faire l'inventaire des raccourcis existants dans `App`, `GlobalTimer`, `ProjectsPage`, les éditeurs Code/Divi et le menu Electron ; **aucune combinaison nouvelle considérée « libre » sans audit**.
- Proposer après audit un contrat `shortcut → écran actif → contexte/zone saisie → action → garde UX-01`; empêcher les raccourcis globaux de détourner la frappe dans un champ/textarea/éditeur.
- Raccourcis vers recherche/navigation = **ouvrir l'UI puis valider explicitement**. Pas de conversion CRM, acceptation de Devis, publication Bridge, suppression ou arrêt du chrono par un raccourci accidentel.
- États modaux (CGV/édition/chrono) prioritaires ; `Escape` ferme uniquement la couche concernée, pas l'éditeur sans garde. À défaut, ne pas exposer de nouveau raccourci.
- Lorsque la commande est disponible, afficher l'indication de raccourci dans le tooltip ou la commande ; support clavier et lecteur d'écran.

## 6. Repères de contexte et parcours
- Le fil de navigation doit différencier **module ouvert** de **fiche identifiée** (type/id) ; un clic sur le niveau parent consulte la liste, sans mutation métier.
- Un « Retour à la liste » depuis une fiche agrandie peut préserver filtres/scroll et appelle la garde UX-01 **si** l'éditeur serait réellement démonté.
- Un lien vers un dossier via recherche globale ou Accueil doit le faire ouvrir au bon identifiant (02C) : le breadcrumb ne doit pas afficher « fiche ouverte » avant chargement réel.
- L'utilisateur doit pouvoir localiser clairement la session de travail en cours et le workspace courant ; ne pas confondre le badge `Local` avec un état de sauvegarde métier.
- Éviter un second en-tête doublonné dans chaque module quand `page-heading` existe déjà ; considérer la lisibilité en Compact 14 px cible, Confort 16px, Confort+ 18px.

## 7. Séquence technique future (après accord)
| ID | Opération | Preuve |
|---|---|---|
| 02B.1 | Relever composants/breakpoints de l'en-tête, événements et affichages chrono/horloge | Matrice contrôle → handler → effet → tests |
| 02B.2 | Définir les compositions développé/compact/petit écran dans atelier fictif | Maquettes 3 thèmes × 3 densités |
| 02B.3 | Distinguer repli global et repli du bandeau Bibliothèque | Pas de contamination de préférence |
| 02B.4 | Audit des raccourcis actuels puis propositions non conflictuelles | Inventaire clavier, priorités de couche |
| 02B.5 | Intégrer uniquement UI/prefs sans déplacer le service `GlobalTimer` ni son état React | Tests de chronométrage/navigation/close |
| 02B.6 | Recette réelle, captures, performance et rollback | Tests/CI et validation humaine |

## 8. Critères d'acceptation (non exécutés)
| Test | Scénario | Attendu |
|---|---|---|
| R02B-01 | Ouvrir Manager normalement | Rail, recherche, chrono, horloge accessibles selon la densité |
| R02B-02 | Replier/enlever repli de l'en-tête | La recherche et le chrono restent atteignables, gain de place réel |
| R02B-03 | Replier la barre latérale | En-tête reste accessible et bouton déployer fonctionne |
| R02B-04 | Replier le bandeau Bibliothèque | N'affecte pas le repli global ni les préférences du rail |
| R02B-05 | Démarrer chrono puis changer de module | **Même session** conserve état et durée |
| R02B-06 | Pause/reprise/arrêt d'une intervention avec demande de motif | Les dialogues fonctionnent, aucune sortie involontaire |
| R02B-07 | Session ancienne nécessitant récupération | Alerte/récupération restent visibles malgré en-tête compact |
| R02B-08 | Petite fenêtre et zoom, écran Compact 14 px | Accès chrono/recherche/rail sans boutons coupés |
| R02B-09 | Naviguer au clavier dans en-tête compact | Focus lisible, Escape ferme la bonne couche |
| R02B-10 | Taper dans textarea/projet éditeur | Raccourcis globaux n'interceptent pas la frappe |
| R02B-11 | Changer vue avec brouillon dirty | Aucune sortie sans garde UX-01 ; repli non destructif |
| R02B-12 | Notification avec action (Explorateur) | Action existante disponible et succès réel confirmé |
| R02B-13 | Désactiver aide au survol | L'aide explicite reste accessible au clic/clavier (E05) |
| R02B-14 | Redémarrer application | Préférence de header conservée, session Chrono récupérée selon les règles existantes |
| R02B-15 | Ouvrir une fiche depuis Accueil puis revenir | Navigation et identité cohérentes, pas de fausse cible |
| R02B-16 | 3 thèmes × 3 densités + suite complète / tests UI | Résultats chiffrés réels, pas de régression |

## 9. Écarts / questions restant à mesurer
- **E46** : existence et méthode de repli du header global : **non établie dans App** ; à concevoir sans détruire `GlobalTimer`.
- **E47** : accessibilité de récupération/pause/arrêt chrono dans header réduit.
- **E48** : collisions de raccourcis et touches spécifiques à l'éditeur.
- **E49** : distinction préférence rail vs header vs bannière Bibliothèque.
- **E50** : emplacement de messages et chemin de contexte, à recetter sans redondance.

**02B est une conception V2 seulement. Aucune CI, capture, test natif ou intégration des modules n'a été réalisée par ce document.**

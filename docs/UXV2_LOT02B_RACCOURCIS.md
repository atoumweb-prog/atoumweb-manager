# 02B.4 — Audit des raccourcis et priorités de couche

12/10/2026. Audit sur `codex/ux-v2-lot02b-header-v1`, code `e78f1ee719d0ab58b7b4ad7d16f47a98908426c2`, référentiel #82 `LOT-02B-ENTETE-RACCOURCIS.md`. Aucun accelerator nouveau, aucune modification des écrans métier, du menu Electron ou des services. Les constats de production ci-dessous sont une lecture de code ; seuls les scénarios explicitement listés comme natifs sont reproduits dans l'atelier/les fixtures.

## Contrat de touches observé

| Zone / source | Touche / effet existant | Garde / priorité et résultat |
| --- | --- | --- |
| WorkspaceHeader : recherche TEST | Escape ferme la recherche et revient au déclencheur | preventDefault + stopPropagation ; query conservée en mémoire, aucune navigation ni IPC métier ; test natif |
| WorkspaceHeader : Options | Escape ferme Options, revient au bouton Options | Corrigé après reproduction : le focus restait sur un contrôle désormais caché. Entrée dans Options cible un bouton accessible. Test natif |
| FieldHelp | Escape ferme l'aide en capture document | stopPropagation ; aide explicite revient au bouton ?. Test imbriqué : premier Escape ferme seulement l'aide, second seulement Options |
| NavigationRail | Escape ferme le flyout ; Up/Down/Home/End parcourent ses destinations | Gestion locale au rail ; retour au déclencheur du groupe. Les changements de module utilisent UX-01, aucune commande métier. Régression 02A |
| PrototypeTimer | Escape demande l'annulation du motif ; boutons de confirmation seuls changent l'état TEST | requestUnsavedExit existant, Rester par défaut ; refuse/pending/brouillon conservés. Repli ne déplace plus un focus déjà dans le dialogue ; retour au déclencheur après confirmation TEST |
| HeaderEditor input / textarea / contenteditable | Frappe, Ctrl+K, modifiers et composition | Pas d'écoute globale introduite : événements non annulés et frappe native conservée. Escape dans la fiche ne ferme aucun menu ni brouillon |
| GlobalSearch réel | Up/Down sélection, Enter ouvre, Escape ferme les résultats | Local au champ, routage existant via App/UX-01. Escape ne stoppe pas la propagation dans l'existant : risque de concurrence avec une fiche/module à étudier au port |
| GlobalTimer réel | Boutons et document.pointerdown pour fermeture extérieure | Aucun keydown global trouvé. Le pointerdown d'un futur bouton de repli peut être assimilé à une fermeture extérieure : contrôle obligatoire avant 02B.5, aucun handler modifié ici |
| ProjectsPage | Escape ferme revue de phase, overlay production ou détail ; Escape local au nom de nœud annule sa valeur | Listener window sans arbitrage partagé defaultPrevented ; le Escape d'une couche locale doit être consommé avant cette couche. Pas d'affirmation de collision native reproduite dans ce lot |
| Bibliothèque AtoumWeb | Escape ferme le détail ou les retours d'occurrence | Listeners window ; closeDetail efface aussi l'état local d'édition de métadonnées. Risque potentiel de perte de saisie à qualifier et bloquant avant port ; aucune prétention que les gardes Prospection/Devis couvrent cet éditeur |
| BridgeSitesPage | Escape ferme diagnostic/comparaison | Listeners window sans consommation exclusive : plusieurs couches pourraient réagir. Aucun déploiement ni correctif Bridge dans ce lot |
| Operations / Maintenance / Statistiques | Escape sur fenêtres/details ; flèches sur séparateurs | Gestion existante au module, pas un raccourci global nouvellement attribué ; collisions de couches à tester lors des ports |
| Séparateurs / colonnes 01C/01D / Projects | Left/Right/Home/End, Enter selon contrôle | Gestes uniquement sur contrôle ciblé. Ne pas capter globalement les flèches d'un champ ou éditeur |
| UX-01 Electron | Fermeture/quit/reload via beforeunload, will-prevent-unload et veto de quit | Pas de nouvel intercepteur F5/Ctrl+R créé ; mécanisme existant rejoué avec fixtures natives, y compris pending et fenêtres détachées |
| Menu Electron / OS | Raccourcis natifs propres au runtime/système | Aucun Menu.buildFromTemplate, accelerator personnalisé ou globalShortcut dans le code applicatif inspecté. Le menu relevé par l'atelier est vide : ce n'est pas une preuve du menu du binaire distribué ni de la disponibilité d'une combinaison OS/IME |

## Priorité proposée pour le futur raccordement (aucune architecture ajoutée)

1. Aide explicitement ouverte : ferme uniquement cette aide et restaure son déclencheur.
2. Dialogue chrono / éditeur actif : traite son Escape par sa garde UX-01, avant menus/recherche et module. Aucun arrêt/pause/acceptation/suppression via touche globale.
3. Recherche, Options ou flyout contenant le focus : ferme uniquement sa couche, consomme l'événement, revient à son déclencheur.
4. Fiche/module : peut demander une sortie uniquement après vérification que l'événement n'a pas déjà été traité, et avec les protections existantes avant démontage.
5. Input, textarea, contenteditable, composition IME et événements répétés : ne pas détourner la frappe par une commande globale.

Ces priorités sont démontrées dans l'atelier pour aide/Options/recherche/chrono/fiche ; leur raccordement aux listeners des anciens modules n'est pas effectué. Aucun deuxième registre UX-01 ni gestionnaire global de confirmation créé.

## Attribution de raccourcis

Aucune combinaison Ctrl/Meta/Alt n'est déclarée libre ni attribuée. Recherche, rail et chrono restent accessibles par boutons, Tab, Entrée/Espace. Une éventuelle commande vers recherche ou navigation ouvrira l'UI, sans action métier, après inventaire du vrai menu distribué, des zones de saisie et des collisions ; elle devra être annoncée seulement quand réellement active.

## Limites et points bloquants avant 02B.5 / ports métier

- Préserver GlobalTimer et ses véritables dialogues sans déplacement de propriétaire ; neutraliser l'interaction repli/pointerdown avec preuve native dédiée avant raccordement.
- Qualifier les Escape concurrents de GlobalSearch/Projects/Bibliothèque/Bridge et les brouillons de métadonnées Bibliothèque. Aucun défaut de cet héritage corrigé arbitrairement dans le pilote ; ne pas l'intégrer sans tests et correction ciblée du risque démontré.
- Le test d'atelier n'est pas un audit des raccourcis OS, extensions, lecteur d'écran ou exécutable packagé. Pas de certification de focus modal globale.
- 02C (requêtes/routage recherche), 02B.5 et raccordement massif restent non commencés. #90/#91 non fusionnées dans main ; conserver l'empilement et attendre la prochaine consolidation.


# UX/UI V2 — 01C : socle et atelier fonctionnel, 12/10/2026

## Bilan final du périmètre socle/atelier — correction de la revue #88

Observation traitée : chaque pointermove appelait aussi la sauvegarde. Code corrigé au SHA **01b95a4a8ded84984e908fa982324e63e83ca1ef** : aperçu de largeur immédiat en mémoire ; une écriture de la dernière largeur au pointerup ou à la fin par blur. Geste sans déplacement : zéro écriture ; pointercancel : retour visuel, zéro écriture ; changement de module/store ou démontage : nettoyage sans écriture tardive. Clavier et reset restent des commandes ponctuelles. Aucun champ métier enregistré par le geste.

Contrôle permanent du banc : trois vrais mouvements natifs, zéro write avant relâchement, affichage modifié avant la fin, exactement un write après, dernière valeur conforme à la précision de sérialisation CSS, fin doublée ignorée. Compléments : annulation, blur, changement de module en plein geste, préférence corrompue et reset refusé/réussi sans effacer le brouillon.

Résultats actualisés sur ce SHA : **atelier 66/66 et neuf captures synchronisées**, ciblés **19/19**, typecheck **OK**, suite complète **810/810 dans 88 fichiers, 107,08 s**, sortie 0 et aucune erreur RPC. TEMP nettoyé. Les preuves anciennes ci-dessous restent attachées à f8d60c4 et ne doivent pas être attribuées au nouveau code.

**01C techniquement livré au périmètre socle/atelier**, recette humaine globale différée. Les ports métiers et la persistance applicative/settings stable ne sont pas inclus dans cette clôture ; leur couverture future ne découle pas de66tests pilote. #88 reste draft, sans fusion ni CI hébergée. [Cadrage01D](UXV2_LOT01D_CADRAGE.md) préparé depuis #82 ; aucun écran métier01D ni nouvelle primitive de tableau implémenté.

## Historique du premier incrément

Branche `codex/ux-v2-lot01c-panels-v1`, empilée sur #87 à **2d1ddb7604422850df4921e10250b6186a0094b4**. Référentiel `LOT-01C-FICHES-PANNEAUX.md` lu sur #82. 01B publié et techniquement achevé au périmètre pilote ; acceptation humaine globale différée. #82/#86/#87 restent draft. Aucun merge, CI hébergée ou accès Validation-MSI.

Code de cet incrément : **f8d60c4deef5109b8179722f20e612b43d10be85**. Le commit de suivi ultérieur ne modifie pas ce code. Messages `[skip ci]` ; aucun déclenchement volontaire de CI hébergée.

## Inventaire avant développement

| Source actuelle | États / commandes / CSS | Réemploi et précautions |
| --- | --- | --- |
| ProspectsPageV2 / ProspectDetailV2 | selectedId, deskModeId, expandedId ; split66 ; pointer/flèches/double clic ; prospect-detail.css | Gestes repris ; UX-01 et sections montées conservés dans le produit. Pas de migration de ce module. |
| ClientsPage | selectedId/largeView/activeTab ; split68 ; client-detail.css | Même principe de splitter ; openClient réinitialise onglets/éditeurs : port à traiter dans Lot03, pas de protection globale revendiquée. |
| CatalogPage | selectedId/detailExpanded/split40 ; commercial.css | Reprendre modes et reset, préserver les versions publiées lors du futur Lot04. |
| QuotesPage | detail/detailExpanded/backdrop ; quote-detail-panel ; requestUnsavedExit | Pas de splitter existant inventé dans cet écran ; éditeurs conservés, Abby garde 01B. Ports futurs Lot06. |
| ProjectsPage | detailTab/selectedNodeId ; productionSplit40 | Séparateur interne spécialisé, pas remplacement par une fiche générique dans 01C. Lot07 futur. |
| OperationsPage | requestSplit38/interventionSplit34, agrandissements indépendants | Préférences séparées : ne pas confondre changement de vue et terminaison. Lot08 futur. |
| Réglages / DatabaseService | Table settings existante, getSetting/setSetting ; IPC public thème/densité/aide | Pas de nouvel IPC ni de migration dans cet atelier. Adaptateur de préférence visuelle injecté : raccord à settings à prévoir lors des ports si portée workspace retenue. |

Il n'existait pas de primitive unique de split réutilisable : les gestes étaient dupliqués dans les modules. Ils sont factorisés dans un nouveau composant isolé, sans remplacer les implémentations métier testées.

## Contrat livré

- `ResizableSplitView` : liste gauche/détail droite ; pourcentage borné, min liste240/détail320 nominal, séparateur10 ; ResizeObserver ; clavier flèches/Home/End, souris, double-clic/reset ; nettoyage des listeners sur fin de drag/blur/démontage. Sous760px utiles, empilement accessible. Agrandissement masque la liste en CSS, sans la démonter.
- `RecordPane` : **une même arborescence** pour fiche rapide et complète ; seuls mode/CSS changent. Onglet, saisie et scroll demeurent. Réutilisation AppButton/OperationIcon de01B.
- `panelLayout` : clé module/vue/version, JSON whitelist `{version:1,listPercent}`, bornes, rejet corruption et compatibilité de format0 ; aucun identifiant de dossier, texte, note ou état métier stocké.
- `RecordWorkshop` : deux dossiers TEST, deux modules fictifs, résumé/notes ; sélection/fermeture via le **même requestUnsavedExit**. Hooks useUnsavedDraft/installUnsavedLifecycleBridge, confirmations/lifecycle Electron existants ; « Rester » défaut, pending interdit la sortie. La confirmation d'une note est une simulation mémoire clairement indiquée, pas une sauvegarde métier.

**Portée des préférences pilote :** localStorage du profil Electron isolé, par module/vue, synchronisation via événements storage. Erreurs de lecture/écriture/reset visibles, sans effacer les saisies. Le wrapper crée et supprime son TEMP : ces préférences sont restaurées après rechargement ou retour au module dans l'atelier, pas conservées après fermeture de ce profil de test. L'interface de stockage est injectable ; aucun réglage de la base client n'est modifié. La persistance applicative stable/workspace et les cas multi-fenêtres réels devront être raccordés/testés lors de l'intégration, sans prétendre qu'ils sont déjà déployés.

## Visualiser l'atelier

Depuis le dépôt : `node scripts/check-ux-v2-lot01c-workshop.cjs --interactive`, ou `scripts/launch-ux-v2-lot01c-workshop.cmd`. Fenêtre TEST indépendante, aucune base SQLite ouverte. Sélectionner un dossier, Notes, saisir, Agrandir/Réduire ; déplacer le séparateur ; changer de module puis revenir ; réinitialiser. En fermeture avec une saisie, la vraie confirmation UX-01 s'applique.

Mode test : `node scripts/check-ux-v2-lot01c-workshop.cjs`. Les neuf PNG sont écrits sous `outputs/ux-v2-lot01c-reference/`, **ignorés par Git**, avec témoin de frame et vérification pixel avant capture. Ce témoin est une instrumentation, pas une UI produit. Captures examinées pour AtoumWeb/Confort, Noir/Confort et Blanc/Confort+ ; neuf états vérifiés automatiquement. Référence d'atelier, pas nouvelles pages métier.

## Validation et état des critères

- Typecheck OK ; tests ciblés **19/19** (9préférences +10registre) ; atelier Electron **51/51**, neuf captures synchronisées, TEMP nettoyé.
- Sélection exacte, identité DOM/onglet/saisie/scroll80px conservés après agrandir/réduire ; choix d'un autre dossier refusé sans abandon ; fermeture native dirty et pending veto ; clavier/souris, reset et erreur de stockage ; retour au module et reload sans rouvrir un ancien dossier ; neuf thèmes/densités ; étroit/zoom100/125/150%.
- UX-01 existant rejoué : **183/183** sur trois thèmes, migrations1–66/intégritéOK/FKvide sur SQLiteTEMP. Trois refus IPC de version périmée sont des erreurs **attendues** avec brouillon préservé.
- Suite complète sur **f8d60c4** : **810/810, 88 fichiers, 107,47 s**, sortie0, aucune erreur RPC ; 35restaurations et migrations/intégrité/FK sur fixtures. Aucune CI hébergée revendiquée.

| Critères | État / portée |
| --- | --- |
| R01C-01 à09 | PASS atelier : sélection, modes, brouillons, garde, resize/reset, retour/reload, neuf configurations, étroit/zoom. |
| R01C-10/11 | PASS fermeture native dirty/pending et Échap ; clic extérieur ne ferme pas implicitement le pilote. Non-régression lifecycle/workspace :183. |
| R01C-12/13 | PASS hérités du banc183 : sections Prospect réduites et suppression Devis avec brouillon voisin. Aucun handler de ces modules modifié. |
| R01C-14 | Pas de port métier : imports App/CSS historiques inchangés, non-régression native183 et suite complète ; référence300 de01B àaf5cdc5. Pas de nouvelle campagne17pages revendiquée pour01C. |
| R01C-15 | PASS reset et rechargement pilote ; aucune suppression de données métier. Profil TEMP supprimé seulement en fin de banc. |
| R01C-16 | Atelier à dossiers synchrones : aucun chargement async à écraser. Non-régression des réponses tardives héritée du banc183. À vérifier sur chaque futur port métier. |

Incident du premier banc : échec clavier avec `keyCode:'ArrowLeft'`. Géométrie/focus vérifiés, puis correction du **protocole d'injection Electron** (`Left` fournit la touche DOM ArrowLeft), assertion inchangée. Pas de contournement via clic artificiel ni de délai global accru.

## Limites et suite

Premier incrément 01C exploitable dans l'atelier, **pas clôture des ports métier**. Pas d'autosave de champs, pas de récupération crash, pas de nouvelle architecture de confirmation, pas d'« Enregistrer et quitter ». Aucune modification des17modules, des contrats, du Catalogue, des opérations ou des migrations.

Suite technique : étendre les essais du pilote aux préférences corrompues/reset refusé et fenêtres détachées synchronisées, puis préciser l'adaptateur settings/workspace avant les ports dédiés. Recette humaine complète différée ; risque de perte de saisie/mutation métier toujours bloquant. Aucune fusion sans accord.

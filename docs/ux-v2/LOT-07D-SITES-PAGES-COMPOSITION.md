# Lot 07D — Sites & Pages, composition AtoumWeb et éditeur HTML/CSS/JS

**Statut : cible UX/UI V2 ancrée dans le code, non développée et non testée par ce dossier.**
**Sources lues :** `ProjectSitesTab.tsx`, `ProjectPageCompositionPanel.tsx`, `ProjectCompositionItemSettings.tsx`, `AtoumWebCompositionService.ts`, `AtoumWebCompositionPackageService.ts` sur `manager/main` le 09/10/2026.
Liens : [07A inventaire](LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md), [07C blueprint](LOT-07C-BLUEPRINTS-DOSSIER-COMMERCIAL.md), [07E Bibliothèque](LOT-07E-BIBLIOTHEQUE-REUTILISATION.md), [07F Bridge](LOT-07F-BRIDGE-WORKBENCH-PUBLICATION.md).

## 1. Schéma d'écran
- **Colonne gauche** : Sites du Projet, Pages rattachées ou non rattachées, archivées explicitement visibles/filtrables, compteur et badges ; sélectionner le Site ou la **Page exacte** par ID.
- **Centre** : composition ordonnée de la Page, aperçu global ou édition du composant sélectionné, bouton **Préparer pour Bridge** seulement quand éligible.
- **Panneau droit rétractable** : réglages du composant, HTML/CSS/JS, inspection et aperçu, avec séparateurs/largeurs ajustables. Ne pas remonter les éditeurs en changeant de disposition.
- **Bandeau supérieur** : site, nom de page, rôle/chemin, Projet source, **Temps réel** et **▶ Démarrer le travail** en lien avec **le chrono global**, pas un timer parallèle.

## 2. Fonctions vérifiées en code
| Composant | Présent maintenant | Limites / cible |
|---|---|---|
| `ProjectSitesTab` | `applyBlueprint`, création Site/Page, édition Site/nom, détachement Page, archive Site, séparation réglable, arbre des Pages. | Les confirmations destructrices/déplacement/rattachement doivent préserver pages et ressources réelles. |
| `ProjectSitesTab` | Chrono Page `time.active/start/pause/resume/stop`, sessions et temps réel ; vérifie autre chrono actif et propose la transition via le timer global. | Pas de temps attribué au mauvais `projectNodeId`, activité interne provisoire explicitement marquée. |
| `ProjectPageCompositionPanel` | Composition facultative ; ajout bibliothèque, création code direct, création **variante d'un modèle**, déplacement ▲▼, retrait, édition locale. | Retirer de la Page n'est **pas** supprimer la source globale. |
| `splitCompleteCode` | Analyse un collage **complet** et sépare HTML/CSS/JavaScript ; édition distincte possible. | Détecter limites, scripts/styles externes et collisions ; un extrait peut dépendre de Divi/WordPress pour s'afficher correctement. |
| `ProjectCompositionItemSettings` | Extraction de textes/visuels/couleurs, édition par clic, HTML/CSS/JS, aperçu et **historique local `undoStack/redoStack`**, bouton « Version Bibliothèque » (`resetItemLocalCode`). | **L'Undo/Redo EXISTE dans les réglages locaux du composant** ; ne pas affirmer le contraire. Il **ne couvre pas** globalement la composition, les déplacements de composants, les changements de Site/Page, les exports ou les effets externes. |
| `ProjectPageCompositionPanel` | Aperçu composant et page, dispositifs **Desktop/Tablette/Mobile** ; iframe `sandbox=""` dans les aperçus inspectés. | L'aperçu n'exécute pas le JS de page dans le mode protégé et **n'est pas le rendu fidèle du Visual Builder Divi** ni une publication. |
| `AtoumWebCompositionService` | `ensureForProjectPage`, `attachToProjectPage`, `addItem`, `moveItem`, `removeItem`, `updateItemLocalCode`, `resetItemLocalCode`, `promoteItemVariant`. | Une composition est rattachée à une seule Page au moment du lien ; ne pas réutiliser une même instance mutable pour plusieurs Pages. |
| `AtoumWebCompositionPackageService` | `exportPagePackage` vérifie **Site actif + composition + éléments** ; donne `exportId`, projet/site/page, ordre/versions des composants, fingerprint et fichiers. | Préparer/ouvrir le package **ne signifie pas importer sur WordPress**. Pas d'export valable depuis Page orpheline ou Site archivé. |

## 3. Actions de Page et gestion des brouillons
1. **Initialiser** Sites/Pages depuis blueprint applicable : afficher prévisualisation, créer seulement les éléments manquants, protéger les éléments humains et rejouer sans doublon.
2. **Créer Page / rattacher à Site** : fournir Site destinataire, rôle, éventuel chemin et avertissement de collision avant enregistrement.
3. **Composer** : ajouter depuis Bibliothèque AtoumWeb (version réutilisable valide) ; ou **Créer composant** par HTML/CSS/JS complets, ou **Créer déclinaison** à partir d'un modèle choisi. La source et la version restent identifiables.
4. **Modifier un composant localement** : texte, couleurs, typo/espacements/visuels selon capacité de l'éditeur réel, code séparé ; bouton **Enregistrer les réglages locaux** et état `dirty`. Le contenu de la Bibliothèque source **n'est pas muté**.
5. **Undo/Redo local existant** : conserver les 40 snapshots locaux et leur portée effective lors de reconfiguration. Le retour **Version Bibliothèque** est une réinitialisation explicite du code local (requiert aperçu des pertes/confirmation et garde), **pas** un Undo de l'ensemble du Projet.
6. **Évolution V2 à concevoir** : historique **global de composition** (ajout/retrait/réordonnancement, remplacement de source, évolution de version, éventuels snapshots) avec une politique de restauration/versionnement et gestion des conflits, indépendante des exports Bridge.
7. **Prévisualiser** composant seul ou Page ordonnée, changer Desktop/Tablette/Mobile, afficher limitations JS/dépendances. Ne pas considérer la prévisualisation comme une « validation en production ».
8. **Préparer pour Bridge** : afficher le résumé exportable (Projet/Site/Page, ordre, versions, fichiers, `exportId`, empreinte), puis package préparé et action **Ouvrir dans l'Explorateur** ; aucun WP/production sans import Workbench séparé.

## 4. Protection du travail
- **Une Page peut avoir zéro composant Manager** : elle pourra être réalisée dans Divi ; la composition Manager n'est **pas obligatoire** pour l'existence de la Page, mais une composition exportable est exigée pour Page V2.
- **Sélectionner un autre composant pendant édition dirty** : aujourd'hui `inspect`/toggleSettings peuvent changer `settingsItemId/settingsDraft` ; la V2 doit intégrer **la garde UX-01 avant démontage**, sans perdre local HTML/CSS/JS et couleurs.
- Modalités : fermeture modale par croix/clic extérieur/Escape, repli de panneau, autre Site/Page/Projet, navigation vers Bridge ou Catalogue → tous les chemins de sortie **doivent respecter UX-01 si brouillon en cours**.
- Les réponses async (reload, inspection de bibliothèque, images/fichiers tardifs) **ne remplacent pas** une saisie locale de code ou réglages sans consentement.
- Le code importé/collé peut être **non sûr** : interdire son exécution dans la prévisualisation isolée, signaler les scripts/dépendances externes, préserver le texte brut pour traitement contrôlé dans le Workbench.
- CSS/JS local vs CSS/JS **du thème enfant WordPress** : aucune suppression automatique d'assets communs sur export/révision ; leur nettoyage relève d'un registre/lot technique ultérieur.

## 5. Recette proposée (21 scénarios, aucun exécuté ici)
| ID | Situation | Attendu |
|---|---|---|
| R07D-01 | Appliquer blueprint vitrine compatible | Pages attendues et provenance exacte |
| R07D-02 | Réappliquer le blueprint | Aucun site/page/nœud doublé |
| R07D-03 | Créer Page non rattachée puis rattacher | Identité Page conservée, destination explicite |
| R07D-04 | Changer chemin/rôle en collision | Refus service, liens précédents intacts |
| R07D-05 | Créer composition depuis première Page | Une composition liée à cette Page |
| R07D-06 | Ajouter même modèle deux fois volontairement | Deux **occurrences** distinctes avec même source version |
| R07D-07 | Déplacer composant puis retirer | Ordre effectif, bibliothèque intacte |
| R07D-08 | Coller HTML + style + script | Séparation analysée et texte préservé |
| R07D-09 | Créer composant direct | Nouvelle brique, non-clonage inutile |
| R07D-10 | Créer déclinaison modèle | Origine/identifiant famille conservés |
| R07D-11 | Modifier texte/couleur/HTML/CSS/JS locaux | Version globale de référence intacte |
| R07D-12 | Annuler/rétablir réglages locaux | Bon snapshot **local**, sans toucher ordre de Page |
| R07D-13 | Réinitialiser Version Bibliothèque | Confirmation, résultat et provenance corrects |
| R07D-14 | Quitter éditeur local dirty | Garde UX-01 sur toutes sorties |
| R07D-15 | Prévisualiser Page/Composant Desktop/Tablette/Mobile | Aperçu en sandbox et limitations explicites |
| R07D-16 | Démarrer travail sur Page | Timer global unique sur bonne Page |
| R07D-17 | Timer actif sur autre Page | Confirmation de basculement, zéro session simultanée |
| R07D-18 | Export Page sans Site actif | Refus et pas de package |
| R07D-19 | Export Page sans composition | Refus et pas de package |
| R07D-20 | Export Page complète | Bon ordre, IDs, versions, `awexp:` et empreinte |
| R07D-21 | Tests UI 3×3, SQLite isolé et code non fiable | Aucun projet réel/Validation-MSI modifié |

## 6. Écarts à instruire
**E196** undo/redo **global de composition** vs historique local déjà en place ; **E197** garde dirty sur `inspect/toggleSettings` et fermeture des overlays ; **E198** collisions de Site/Page/chemin ; **E199** représentativité de l'aperçu/JS sandbox ; **E200** versionnement de l'export et traçabilité du package ; **E201** partage éventuel d'une composition entre plusieurs Pages (aujourd'hui refus du même ID), **E202** relation assets CSS/JS locaux vs thème enfant.

**Aucun bouton « Publier sur le site » n'est introduit par la spécification de la Page.**

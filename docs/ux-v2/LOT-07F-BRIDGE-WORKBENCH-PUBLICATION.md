# Lot 07F — Bridge : export Manager, Workbench Divi, retour d'observation et publication future

**Statut : spécification UX/UI et contrat de capacités, NON implémenté/testé par ce dossier.**
**Sources consultées 09/10/2026 :** `atoumweb-manager/main` (`AtoumWebCompositionPackageService.ts`, `BridgeSnapshotService.ts`, `BridgeSitesPage.tsx`) et `atoumweb-bridge/feature/workbench-occurrence-v1@d1ecf89dab4f48230269a0cb10fb796f33c60bfc` (README 0.8.1, `class-awb-library-importer.php`, `class-awb-workbench.php`, `class-awb-site-occurrence.php`).
Références : [07A audit](LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md), [07D Site/Page](LOT-07D-SITES-PAGES-COMPOSITION.md), [07E Bibliothèque](LOT-07E-BIBLIOTHEQUE-REUTILISATION.md), [07P Projet avant signature](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Règle d'architecture sans exception implicite
- **Manager** produit le package d'une **Page de Projet** avec composants/versions/ordre et destination `projectId/siteId/pageId`.
- **Bridge** importe sur WordPress en **Workbench Divi brouillon**, pas en page de production ; Divi est l'atelier humain d'édition, visualisation et sauvegarde.
- **Snapshot WordPress** est une observation de ce qui est détecté sur le site ; un snapshot partiel n'est jamais la preuve que du contenu a disparu.
- **Publication Workbench → production et rollback WordPress sont une étape ultérieure**, nécessitant un moteur de publication humain contrôlé et des sauvegardes. Le README Bridge 0.8.1 précise **qu'aucune publication Workbench vers production n'est activée**. Ne pas ajouter un bouton fonctionnel fictif.
- Un Projet **prévisionnel non signé** peut exporter un brouillon de travail si ses capacités/autorités le permettent, mais **ne publie jamais sur le site Client** ni n'active maintenance/facturation automatiquement.

## 2. Capacités actuelles prouvées et bornes
| Étape | Dans Manager / Bridge aujourd'hui | Précaution UX |
|---|---|---|
| **Préparer export Page V2** | `AtoumWebCompositionPackageService.exportPagePackage` vérifie Site actif, lien Page-Site, composition existante et non vide ; `exportId='awexp:…'`, empreinte, ordre composants, versions source et chemins. | Bouton présent `Préparer pour Bridge`, résultat **fichier local** ; pas de réseau/WP automatique. |
| **Ouvrir package** | `showPackage(exported.path)` via action de notification, ouvrable dans l'Explorateur. | Copier/importer manuellement sur Bridge ou parcours explicite à venir, sans suggérer une transmission réussie tant que WordPress n'a pas confirmé. |
| **Importer Page V2 sur Bridge** | `AWB_Library_Importer::import_manager_project_package` vérifie manifest `workbench_first`, `exportId` et hash ; crée Workbench unique avec **plusieurs modules Code** ordonnés. | Même package déjà importé → même Workbench ; **même exportId + contenu changé → refus** ; un nouvel export Manager est nécessaire. |
| **Workbench WordPress** | `AWB_Workbench::create_from_project_payloads` crée `post_status='draft'` et conserve provenance/destination. | Ne pas présenter comme Page WordPress finale dans Pages publiques ; brouillon Workbench distinct. |
| **Identité des occurrences** | Bridge associe un `siteOccurrenceId` `awocc:…` à chacun des composants du Workbench, lié aux sources et empreintes du package. | Distinction **composant logique, occurrence de Page, module Divi, post Workbench** ; ne pas confondre leurs IDs ou recopier le même `awocc:` sur plusieurs modules. |
| **Modifier avec Divi** | L'édition du Workbench dans WordPress est possible selon WordPress/Divi et authentification. | Bouton **« Modifier avec Divi » depuis Manager** = souhait cible, **pas une intégration automatique prouvée**. Ne l'afficher comme action que si URL réelle et autorisation/capacité confirmées ; ne pas inventer URL. |
| **Observation/retour** | Bridge Site Occurrence analyse les changements et conserve une baseline ; Manager `BridgeSnapshotService` importe/analyse snapshots, diffs et rapprochements ; capacités d'occurrence retour à vérifier à l'interface pour le flux exact. | Ne pas prétendre que toute retouche Divi se synchronise automatiquement en direct avec le composant Manager ; utiliser retour **explicitement déclenché et comparé**. |
| **Publication** | **Désactivée/non livrée** en Bridge 0.8.1 selon README. | **Aucun envoi direct en production**, aucun effacement du CSS/JS ni rollback promis comme bouton actuel. |

## 3. Parcours UX à présenter par états réels
| État affiché | Condition vérifiable | Actions possibles |
|---|---|---|
| **À préparer** | Page sans composition éligible ou Site non assigné | Ouvrir Site/Page, configurer, créer/choisir composants |
| **Package préparé** | Export local réussi avec `exportId` + fingerprint | Ouvrir package, copier identifiants, relancer nouvel export |
| **À importer dans Bridge** | Aucun accusé d'import côté WordPress relié à ce package | Indiquer procédure manuelle ; ne pas afficher « Envoyé » |
| **Workbench créé** | Identifiant `post_id` et retour WordPress de l'import confirmé | Ouvrir Workbench dans WP, « Modifier avec Divi » seulement si URL certifiée |
| **Travail Divi à vérifier** | Workbench ouvert, éventuelles modifications humaines | Retourner au Workbench/aperçu, conserver les sources |
| **Retour observé** | Snapshot/Occurrence Return correspondant à destination et fingerprint importé | Diff avant/après, problèmes de couverture, rapprochement humain et décision de mise à jour Manager |
| **Validé humainement** | Décision consignée de conserver/adapter/promouvoir la variante ou la configuration | Mise à jour volontaire de bibliothèque/occurrence, source et historique préservés |
| **Publication production indisponible** | Bridge installé 0.8.1 sans fonctionnalité publication | Mention explicite « Non disponible » et parcours WP manuel séparé, **aucune simulation de succès** |

Une action de **préparation** n'est pas une confirmation d'import, de validation ou de publication. L'interface doit indiquer la **source de chaque statut et l'heure de dernière confirmation**, pas inférer une réussite d'une simple existence de fichier.

## 4. Audit du retour et des limites Divi
- Diff des **sections, lignes, colonnes, modules Code Divi**, contenus HTML/CSS/JS, classes et IDs, styles responsives, médias, dépendances, CSS de page/global/Theme Builder selon couverture effective du scanner.
- **Divi 4** est le périmètre de référence actuel ; **Divi 5 non certifié** tant que tests de couverture correspondants n'existent pas.
- **Contrôle identité** : `siteOccurrenceId` présent, absent, dupliqué ou perdu dans le Visual Builder ; afficher « à rapprocher » si équivoque. Les correspondances humaines doivent être tracées, pas auto-réconciliées sur seul nom.
- **Observation partielle** : fichier manquant, scan `partial_failure`, dépendance globale non capturée, média absent, CSS inline non attribué → ne pas déclarer la composition entièrement réutilisable ni inférer la suppression.
- Diff entre **source Manager**, **package envoyé**, **Workbench au retour** et **état WordPress du site** ; ne pas écraser une édition plus récente d'un côté par une version ancienne de l'autre.

## 5. Publication contrôlée future (non livrée aujourd'hui)
Avant tout chantier « publier », exiger :
1. Choisir **Site WordPress réel et Page finale exacte** (WP `post_id`), environnements Dev/Préprod/Production clairement affichés et authentifiés. **Un `project_page_id` n'est pas un WP `post_id`**.
2. **Sauvegarde** de la page cible et de ses méta Divi, CSS/JS, dépendances et état WP ; journal origine/empreintes avant publication.
3. Comparatif Workbench → cible : structure, responsive, styles globaux, assets, code, conflits sur changements humains externes.
4. **Confirmation humaine avec impact** : ce qui est remplacé, conservé, fusionné, et risques de CSS/JS communs, scripts, classes, médias, droits de publication.
5. **Publication transactionnelle autant que l'API WP le permet**, avec état vérifié en frontal, cache, erreurs, liens et point de retour. Un échec ne doit pas annoncer « publié ».
6. **Rollback humain contrôlé** vers snapshot antérieur clairement identifié, incluant fichiers/références/accès si le moteur sait le restaurer ; jamais supprimer assets communs au seul motif qu'ils ne sont plus dans une Page.
7. **Conservation du Workbench** et de la provenance même après publication, pour révisions futures.

**Le registre/nettoyage CSS/JS et leur externalisation vers le thème enfant** sont des travaux techniques connexes **non livrés par le bouton Export**. Tant qu'ils ne sont pas implémentés, ne pas promettre un « nettoyage des orphelins » sûr.

## 6. Recette prévue (22 cas, aucun exécuté)
| ID | Scénario | Attendu |
|---|---|---|
| R07F-01 | Export Page sans Site actif | Refus Manager, pas de fichier |
| R07F-02 | Export Page sans composition | Refus Manager |
| R07F-03 | Export de 3 composants | Ordre et versions en package |
| R07F-04 | Exporter une nouvelle fois depuis composition modifiée | Nouvel `exportId`, provenance cohérente |
| R07F-05 | Import Bridge 0.8.1 d'un package | Workbench brouillon unique multi-modules |
| R07F-06 | Réimporter même `exportId`/hash | Pas de nouveau Workbench |
| R07F-07 | Même `exportId`, autre hash | Refus Bridge |
| R07F-08 | Ouvrir Workbench Divi | Modifications et sauvegarde dans brouillon, pas production |
| R07F-09 | « Modifier avec Divi » sans URL confirmée | Action indisponible, pas de lien inventé |
| R07F-10 | Module avec `awocc:` absent | Avertissement d'identité |
| R07F-11 | `awocc:` dupliqué | Pas de rapprochement automatique destructeur |
| R07F-12 | Scanner snapshot complet | Inventaire et limites de couverture cohérents |
| R07F-13 | Scanner snapshot partiel | Aucune fausse suppression |
| R07F-14 | Diff source Manager vs Workbench édité | Provenance et modifications humaines conservées |
| R07F-15 | Rejouer import snapshot | Pas de données doublées non prévues |
| R07F-16 | Préparer variante depuis retour | Validation humaine et brique source non écrasée |
| R07F-17 | Projet prévisionnel exporte un Workbench | Pas de publication, pas d'acceptation Abby |
| R07F-18 | Publication non installée | Bouton indisponible, pas de statut « Publié » |
| R07F-19 | Publication future avec page WordPress modifiée par tiers | Conflit et arrêt avant perte |
| R07F-20 | Publication future puis rollback | Versions et CSS/JS/médias rétablis selon protocole testé |
| R07F-21 | Dépendance CSS/JS globale toujours partagée | Jamais effacée par simple export ou nettoyage |
| R07F-22 | Contrôles Bridge/Manager, thèmes×densités et sécurité | Journal SHAs/capacités réelles, pas de site client modifié sans consentement |

## 7. Points techniques à résoudre
**E209** liaison Projet/Site/Page → WP site/post/Workbench/occurrence et affichage du lien Divi, **E210** détection de capacités Bridge par version et contexte authentifié, **E211** import/retour d'Occurrence avec conflits/identités et snapshots partiels, **E212** conformité Divi 4/5, CSS/JS/assets globaux, **E213** design du moteur **publication + rollback** après audit WP, **E214** registre/nettoyage CSS/JS (assets partagés et provenance), **E215** états UX d'export/import/observation sans fausse confirmation.

**Référence Bridge concrète : version de branche 0.8.1, Workbench-first, publication production désactivée.**

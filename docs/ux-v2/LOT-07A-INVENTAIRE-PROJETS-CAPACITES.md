# Lot 07A — Inventaire Projet, Site/Page, composition, réutilisation et Bridge

**Statut : audit statique + spécification UX/UI V2 ; aucune modification métier, aucune recette exécutée.**
**Sources lues le 09/10/2026 :** `atoumweb-manager/main` (fichiers cités) et `atoumweb-bridge/feature/workbench-occurrence-v1@d1ecf89dab4f48230269a0cb10fb796f33c60bfc` pour les capacités Workbench. Le HEAD `main` a évolué avec la fusion de #84 ; refaire la matrice au SHA réel au lancement du code.  
Liens : [Lot 07](LOT-07-PROJETS-BRIDGE.md), [07P pré-signature](LOT-07-PROJET-PRE-SIGNATURE.md), [06E Abby & révisions](LOT-06E-ABBY-REVISIONS-PROJET.md), [Lot 01 panneaux](LOT-01C-FICHES-PANNEAUX.md), [Lot 02 routage](LOT-02C-RECHERCHE-ROUTAGE.md).

## 1. Deux systèmes, aucune confusion d'identité
- **Manager** est source du **Projet commercial/technique**, ses Sites, Pages, tâches, compositions, bibliothèques, travaux et versions. Un projet préparé depuis un devis non signé demeure **`commercialState='provisional'`**.
- **Bridge (WordPress)** est source d'observation des pages WordPress et de leurs **brouillons Workbench Divi** ; un Workbench **n'est ni** un projet Manager, **ni** une page de production automatiquement publiée.
- L'association de l'export Manager à une page Workbench utilise provenance/versions/identifiants et empreintes ; les observations retournées ne doivent pas effacer les modifications humaines de l'une ou l'autre source.

## 2. Code réellement présent : matrice source ↔ capacité ↔ lacune
| Source vérifiée | Capacité déjà présente | Limite UX ou développement futur |
|---|---|---|
| `src/shared/projects.ts` | Projets, modèles/versionnements, Sites/Pages, nœuds, ressources, prérequis, temps, bibliothèque technique, périmètre commercial, statut `provisional/frozen/legacy`. | Ne pas inventer de nouveaux états ou un projet distinct après signature. |
| `ProjectCommercialService.ts` | `previewQuote/prepareQuote/syncCommercial/accept`, dossier commercial et révisions, contrôles SHA d'aperçu, conflits/provenance. | Pas de capacité démontrée de **remplacer tout un Projet par un autre ID** relié atomiquement au même dossier. |
| `ProjectService.ts` | Projet provisoire `to_prepare`, ressources provisoires ; refus de passage en production avant acceptation selon règles. | Préparation interne permise, production facturable non activée silencieusement. |
| `ProjectsPage.tsx` | Vue Projets et mode **Production**, onglets `summary/plan/sites/prerequisites/resources/technical/operations/time/commercial`, plan, tâches, historique undo/redo des **nœuds**. | La création classique depuis Devis sélectionne aujourd'hui **`accepted`** ; rendre préparation non signée accessible via parcours Devis existant. Ne pas présenter undo/redo des nœuds comme undo global CSS/JS. |
| `ProjectSitesTab.tsx` | Liste sites/pages gauche, fiche droite, panneau composition, création/lien/archivage, tailles, bouton **Initialiser depuis blueprint**, **Temps réel**, `▶ Démarrer` relié au chrono global. | Assurer retour au bon Projet/Site/Page, préservation du contexte et des brouillons à chaque repli/choix. |
| `ProjectSiteService.applyBlueprint` | Sites/Pages liés à blueprint, recherche par identité source pour éviter les doublons, compatibilité modèles anciens. | Idempotence et protection des pages humaines à revalider sur chaque blueprint/contribution et révision. |
| `ProjectBlueprintCompositionService.ts` | Plans commerciaux/compositions de plusieurs prestations, contributions et destinations, modes `staging` vs matérialisation. | Cible requise par contribution : pas de Site/Page inventé silencieusement pour un ajout. |
| `ProjectPageCompositionPanel.tsx` | Composants bibliothèque, création code réutilisable/variante, **collage HTML/CSS/JS complet analysable**, paramètres locaux, aperçu composant ou page, Desktop/Tablette/Mobile, export package Page. | Undo/redo/snapshots **de composition** et protections contre pertes de saisie à cadrer ; aperçu n'est pas un navigateur WordPress/Divi fidèle. |
| `AtoumWebCompositionService.ts` | Composition et items ordonnés, copies d'ajustements locaux, rattachement à **une** Page, déplacement/retrait. | Les modifications locales ne doivent pas modifier une version source globale utilisée ailleurs. |
| `AtoumWebCompositionPackageService.ts` | Export Page V2 avec `exportId`, site/projet/page, empreinte, versions et fichiers ; **refuse absence de Site actif ou composition vide**. | L'export est un package local, **pas un téléversement automatique** ni une publication de page WP. |
| `ProjectTechnicalLibraryTab.tsx` | Bibliothèque **locale au Projet**, versions, état stable, liens vers fichiers Ressources, archive, paquet de réutilisation. | Distinguer Projet source / Bibliothèque AtoumWeb globale, et version stable / validation humaine. |
| `ProjectReusePreparationPanel.tsx` + `ReusePreparationService.ts` | Copie de travail **indépendante**, adaptation, bouton de création volontaire de brique globale, source et assets tracés. | Garantir l'absence de modification du Projet source et le traitement explicite des fichiers manquants. |
| `BridgeSnapshotService.ts` + `BridgeSitesPage.tsx` | Import de snapshots WordPress, sites/pages/nœuds, inventaire et dépendances, diffs et revue de rapprochement. | Un snapshot `partial` ne prouve pas une suppression, identité manquante/dupliquée = avertissement, pas rapprochement silencieux. |
| Bridge `README.md` et `class-awb-library-importer.php` | Bridge 0.8.1 : import **Page V2 idempotent** par `exportId`, **un Workbench** avec plusieurs modules Code Divi ordonnés, refus `exportId` déjà utilisé avec contenu différent. | Le WP reçoit un **brouillon Workbench**, pas une page finale en production. |
| Bridge `class-awb-site-occurrence.php` | Occurrences `siteOccurrenceId` et analyse/retour basés sur une empreinte de source. | Ne pas affirmer le même niveau d'identité dans toutes les anciennes pages Divi 4/5. |
| Bridge `README.md` | Indique explicitement **« Aucune publication Workbench → production n'est encore activée »**. | Publication contrôlée + rollback WP **sont des objectifs futurs**, pas des boutons actuellement utilisables. |

## 3. Périmètre visuel du Lot 07
- **07B :** liste Projets, fiche rapide/agrandie, plan, prérequis, temps et contexte.
- **07C :** blueprint, origine Devis/révision, destinations, préparation avant signature et **Adapter/Repartir de zéro**.
- **07D :** Sites & Pages et composition graphique/code, timers, export.
- **07E :** bibliothèque locale/globalisée et réutilisation guidée.
- **07F :** Bridge à capacités vérifiées et séparation Workbench/production.
- **07G :** recette transversale.

## 4. Principes de fiabilité et données
1. **Identifiant courant** : Projet, Devis/révision, Site, Page, composition, version, export `awexp:`, Workbench post ID et `siteOccurrenceId` ne se confondent pas.
2. **Hors signature** : devis provisoire peut alimenter un plan/tâches/pages internes mais **pas** créer factures/Client/maintenance/opérations actives.
3. **Source & variants** : l'édition locale conserve bibliothèque source et version ; variante réutilisable créée volontairement.
4. **E72** : créer un devis depuis un Prospect `new` ne devrait pas activer la prospection ; conflit technique déjà consigné au [06A](LOT-06A-MATRICE-DEVIS-ET-ETATS.md). Le Projet provisoire n'est pas une exception implicite.
5. **UX-01** : toutes sorties destructrices ou démontages de formulaires doivent utiliser le registre de protection au moment où #83 sera réellement intégré.
6. **CI verte #84** et tests d'autres PR ≠ recette UI Lot 07 exécutée.

## 5. Recette d'inventaire (14 cas, non exécutés)
| ID | Test à faire | Résultat attendu |
|---|---|---|
| R07A-01 | Ouvrir Projet via recherche globale | Bon Projet ID et onglet |
| R07A-02 | Ouvrir Devis actuel d'un pré-Projet | Bonne révision, pas acceptation |
| R07A-03 | Lire Site/Page et structure | Séparation Site métier vs page WP |
| R07A-04 | Appliquer blueprint deux fois | Pas de doublons de Sites/Pages/nœuds |
| R07A-05 | Examiner 1 Site/5 Pages vitrine de référence | Ensemble correct **si blueprint applicable**, pas règle universelle |
| R07A-06 | Éditer composition locale | Version source Bibliothèque intacte |
| R07A-07 | Ouvrir PDF/ressource depuis bon Projet | Pas de fichier d'autre Projet |
| R07A-08 | Exporter Page sans Site actif | Refus au service |
| R07A-09 | Exporter Page sans composant | Refus au service |
| R07A-10 | Importer Workbench 0.8.1 deux fois même package | Identité/Workbench réutilisés sans doublon |
| R07A-11 | Rejouer `exportId` avec contenu différent | Refus Bridge et aucun écrasement |
| R07A-12 | Snapshot partiel WordPress | Pas de fausse suppression |
| R07A-13 | Projet prévisionnel | Aucune commande ou publication WP activée |
| R07A-14 | Rapport sur SHAs réels, SQL et fiches | Aucun changement Validation-MSI |

## 6. Questions de raccord
- **E179** : matrices des routeurs et des opérations réellement accessibles selon `provisional/frozen`.
- **E180** : provenance de Projet/ligne → Site/Page/composition/Workbench/snapshot, y compris versions anciennes.
- **E181** : capacité Bridge détectable réellement par version/canal, sans bouton fantôme de publication.
- **E182** : critères de maturité `prêt` vs `validé humainement` et dépendances médias/styles globales.
- **E183** : garder le périmètre de codage du lot séparé des PR CI/restauration/UX-01.

**Aucune opération réalisée sur une base, WordPress, un Projet réel, ou le dépôt Bridge.**

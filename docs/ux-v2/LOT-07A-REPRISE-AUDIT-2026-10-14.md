# UX/UI V2 — Lot 07A : reprise de l'audit (14/10/2026)

Statut : **audit documentaire en cours**, aucune recette native exécutée, aucune modification métier.

## Références vérifiées
- Référentiel PR #82, commit `0bb0860ee7618af92a53d8711b4a06edbbadc4d6`, `docs/ux-v2/LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md`.
- `main` : `docs/ux-v2/SUIVI-AVANCEMENT.md` et `PROJECT_STATUS.md` consultés le 14 octobre.
- Point de référence connu du suivi : main après #102, `b2796812ee24c9e9e824f3d66564f2c1a335bffe`. Ce n'est pas une preuve que HEAD main est encore à ce SHA.
- Branches concurrentes CRM 03D/03E, Catalogue 04, Contrats 05 et Devis 06 : travail séparé, ne pas importer leur code implicitement.

## Inventaire initial conservateur
1. Projet commercial et technique / Projet provisoire : modèles, nœuds, ressources, prérequis, temps, dossier commercial existants. Les états `provisional/frozen/legacy` ne doivent pas être remplacés sans justification.
2. Sites & Pages : panneau existant, blueprints, compositions. Valider les transitions et le contexte courant avant refonte.
3. Composition : HTML/CSS/JS, réglages locaux, variantes, aperçu responsive et export Page V2 existants ; l'Undo/Redo local n'est pas un Undo/Redo global.
4. Bibliothèque : locale au Projet vs globale AtoumWeb et création explicite de variantes ; ne pas muter les sources.
5. Manager ↔ Bridge : export `exportId` et création de Workbench ; ni publication WordPress finale ni rollback de production présumés disponibles.
6. Provenances : distinguer Projet, Devis/révision, Site, Page, composition, version, export, Workbench, occurrence et snapshot.
7. UX-01 : confirmer garde de sortie pour brouillons, opérations concurrentes et réponses tardives.

## Matrice de recette 07A à exécuter, sans résultat anticipé
- R07A-01 / 02 : routage vers Projet et révision correcte du Devis.
- R07A-03 / 04 / 05 : identité Site/Page et blueprint répété sans doublon ; cas vitrine non universel.
- R07A-06 / 07 : composition locale indépendante ; Ressources du bon Projet.
- R07A-08 / 09 : exports invalides refusés.
- R07A-10 / 11 : import Workbench idempotent ; conflit exportId refusé.
- R07A-12 / 13 : snapshot partiel sans fausse suppression ; Projet provisoire sans activation commerciale/production.
- R07A-14 : traces des SHAs, intégrité et absence d'accès aux données réelles.

## Questions E179–E183
- E179 : autorisations en fonction des états provisoire/gelé.
- E180 : provenance des versions historiques de bout en bout.
- E181 : détection honnête des capacités Bridge selon version.
- E182 : maturité prêt / validation humaine, dépendances médias et styles.
- E183 : isolation du lot vis-à-vis CI, restaurations, UX-01 et branches parallèles.

## Suite
Comparer au HEAD réellement en vigueur les fichiers et contrats cités dans le référentiel. Puis établir la matrice présent / écart / test / dépendance avant tout correctif 07B–07G. Exécuter TypeScript, Vitest, restaurations et tests Electron Windows en environnement TEMP sur la branche de développement dédiée. **Ne pas déclarer la recette réussie à ce stade.**

Interdits dans cette reprise : fusion dans main, migration, accès Validation-MSI, mutation du dépôt Bridge et publication WordPress.


## Deuxième passe — concordance des spécifications vérifiée (14/10/2026)
Sources lues directement dans le référentiel PR82 : `LOT-07B-FICHE-PROJET-PRODUCTION.md`, `LOT-07C-BLUEPRINTS-DOSSIER-COMMERCIAL.md`, `LOT-07D-SITES-PAGES-COMPOSITION.md` et `LOT-07-PROJETS-BRIDGE.md`. Les chemins de composants sont cités par ces audits du 09/10 ; leurs fichiers de production n'ont **pas** été vérifiés individuellement au nouveau HEAD dans cette passe.

| Porte | Fonction préexistante selon audit source | Écart à vérifier par code et test actuel | Priorité |
| --- | --- | --- | --- |
| 07B-Identité | Un Projet et un dossier commercial, `commercialState` distinct du statut opérationnel | Badge devis non signé, routage Devis exact, bon projet après navigation et repli | P0 |
| 07B-Temps | Chrono global partagé, sessions par page | Un seul chrono actif, basculement A→B confirmé, pas de session mal rattachée | P0 |
| 07B-UX01 | Onglets, tâches, panels et historique des nœuds | Guard pour éditions dirty à chaque démontage, refresh tardif non destructeur | P0 |
| 07C-Préparation | `previewQuote/prepareQuote/syncCommercial/accept` et contrôle hash | Projet provisoire réellement distinct d'une vente, acceptation bonne révision, idempotence | P0 |
| 07C-Remplacement | Sync conservant même `projectId`; « supprimer si vierge » limité aux éléments | Remplacement de **Projet entier** absent du contrat attesté ; transaction et récupération à concevoir, aucun bouton prématuré | P0 bloquant |
| 07D-Composition | Collage complet, édition locale, Undo/Redo de réglages, aperçu protégé | Undo/Redo **global** absent du périmètre local : ne pas le présenter comme livré ; protège brouillons et version source | P1 |
| 07D-Export | Page V2 `exportId`, Site actif et composants exigés | Contrôle des refus et de l'idempotence ; export ≠ publication WP | P0 |
| 07F-Bridge | Workbench Divi et observation | Publication finale/rollback WP non activés selon référence ; détection par capacité exigée | P0 |

### Risques de rapprochement inter-lots
- 03D/03E : liens Client/Prospect/Annuaire ; ne pas changer l'identité ni le focus.
- 04/05/06 : Catalogue, conditions contractuelles, Devis et révisions ; 07C ne doit pas précéder le contrat de révision/acceptation réellement intégré.
- 01/02/UX-01 : garder le shell, le chrono global et les gardes existantes ; pas de mécanisme concurrent.
- Bridge : observation/exploration autorisées sur fixtures, aucune mutation WordPress réelle.

### Ordre de vérification technique
1. R07A-01/02/13 : navigation, bon Devis courant, état provisoire et aucune activation.
2. R07A-04/06/08/09 : blueprint idempotent, source locale intacte, exports invalides refusés.
3. R07A-10/11/12 : Bridge en banc isolé uniquement, import sans doublon et snapshot partiel.
4. R07A-03/05/07/14 : arborescence, cas vitrine conditionnel, ressources et preuve SQL/SHAs.

**Statut réel : revue croisée documentaire achevée pour 07B/07C/07D, revue du code au HEAD et 14 tests toujours à faire.** Aucun résultat de CI/Vitest/Electron n'est revendiqué.


## Troisième passe — vérifications directes sur main (14/10/2026)
- `src/shared/projects.ts` a été lu directement sur `main` ; SHA du blob `015ae1f20897bc690ed23750f5662381cde72277`.
- Contrat confirmé : `commercialState?: 'legacy' | 'provisional' | 'frozen'` et les méthodes `prepareQuote`, `previewQuote`, `syncCommercial` sont déclarés dans l'interface. **Déclaration de contrat ≠ test d'exécution du service.**
- La liste des statuts opérationnels confirmée est `to_prepare/in_progress/waiting_client/blocked/to_validate/completed/archived`. Ne pas confondre avec état commercial.
- Comparaison GitHub `main...audit/ux-v2-07a-projets-20261014` : branche en avance de **deux commits**, zéro commit de retard lors du contrôle ; **un seul fichier de documentation ajouté**. Aucune source métier changée.
- Les chemins présumés `src/main/services/ProjectCommercialService.ts`, `src/renderer/components/ProjectSitesTab.tsx` et `src/renderer/pages/ProjectsPage.tsx` ont retourné 404. Cela indique des **chemins inexacts**, pas l'absence des modules. Leurs chemins effectifs doivent être déterminés avant audit de code.
- Aucune suite de tests ni Electron Windows exécutés. R07A-01 à R07A-14 : toujours non démontrés.

## Prochaine porte de travail
Localiser les chemins exacts des services, composants et tests depuis l'arbre Git, vérifier les implémentations des contrats plutôt que déduire la conformité depuis les types, puis faire la recette sur fixture isolée. Ne pas démarrer 07B avec un faux vert de 07A.


## Quatrième passe — chemins et code de production effectivement vérifiés (14/10/2026)
Arbre GitHub `main` lu via l'API Git Trees recursive (762 entrées, `truncated=false`). Contrairement aux hypothèses de la passe précédente, les modules sont dans les chemins suivants :

| Composant réel | Blob SHA lu sur main | Preuve statique limitée |
| --- | --- | --- |
| `src/shared/projects.ts` | `015ae1f20897bc690ed23750f5662381cde72277` | états commerciaux et contrat des opérations Projet |
| `src/main/projects/ProjectCommercialService.ts` | `634351705b2bf957d273d57d67c8cde05e4d17fc` | garde `provisional` pour synchronisation (ligne 108), passage `frozen` lors d'acceptation (lignes 143–158) |
| `src/renderer/projects/ProjectSitesTab.tsx` | `24d93c6764204c146194f54e0e8efdee51889b0e` | appel au chrono commun `window.atoumweb.time.start` (ligne 316) |
| `src/renderer/projects/ProjectPageCompositionPanel.tsx` | `c86f732218ef55b0e07ac976e5b94bcca8eb000f` | `compositions.exportPagePackage(page.id)` (ligne 436), aperçus iframe `sandbox=""` (lignes 599 et 710) |
| `src/main/referentials/AtoumWebCompositionPackageService.ts` | `1284514a656929618b1c0d375d4cb71a520059ca` | `exportPagePackage`, `awexp:${randomUUID()}` (lignes 56,72) |
| `src/main/bridge/BridgeSnapshotService.ts` | `0eeb7974f994ad575729fac3a6b9604a5d32cec8` | service d'observation et score de correspondance des nœuds |

Les tests proches sont présents dans l'arbre : `src/main/projects/ProjectCommercialService.test.ts`, `src/main/projects/ProjectBlueprintCompositionService.test.ts`, `src/main/referentials/AtoumWebCompositionPackageService.test.ts`, `src/main/bridge/BridgeSnapshotService.test.ts`. **Leur existence ne prouve pas leur succès.**

### Points désormais établis / à ne pas surinterpréter
- Les trois fichiers demandés aux mauvais chemins lors de la troisième passe existent bien sous `src/main/projects` ou `src/renderer/projects` ; supprimer la suspicion d'absence.
- La présence d'une garde et de la mise à jour `frozen` ne démontre pas toute l'atomicité d'acceptation ni le comportement de toutes les révisions.
- L'appel `time.start` ne démontre pas à lui seul l'unicité de session ; tester un changement de page avec un chrono déjà actif.
- Les aperçus sandbox et la génération `awexp:` n'attestent ni import Bridge ni publication WordPress.
- Les tests R07A-01 à R07A-14 sont toujours **non exécutés** dans cette branche. Aucune validation Electron Windows ou Vitest n'est revendiquée.

### Prochain pas testable
Lire les tests correspondants et le chemin des gardes UX-01, identifier les assertions déjà couvertes puis réaliser les tests R07A sur fixture TEMP. Ne pas démarrer des écritures métier dans cette branche d'audit.

 
## Cinquième passe — inspection des tests source (14/10/2026)
Les quatre fichiers de tests ci-dessous ont été lus directement sur `main`, sans exécution de test :
- `src/main/projects/ProjectCommercialService.test.ts` : blob `c345d06313512f8e81329e1e419c2e1fe23fb8df`. Cas déclarés : projet provisoire, idempotence, révisions, suppression conditionnelle d'éléments vierges, conflits, acceptation transactionnelle, refus d'une ancienne révision, rollback, absence d'activation opérationnelle (lignes 23–170).
- `src/main/projects/ProjectBlueprintCompositionService.test.ts` : blob `eb5af07d4e895948778ae174a2f31ea1ae9862fc`. Cas : vitrine 1 Site/5 Pages selon offre, destinations multi-sites, rejouabilité, coexistence de prestations, contribution et provenance, rollback (lignes 16–114).
- `src/main/referentials/AtoumWebCompositionPackageService.test.ts` : blob `1acb6cea8ccfeb3caf962db7fe0b781436694a27`. Cas : export Page V2 `exportId`, refus sans Site ou composition, ordre, refus vide (lignes 101–197).
- `src/main/bridge/BridgeSnapshotService.test.ts` : blob `5e1377b0ce9c3a073272506c7066f3dfb1476e48`. Cas : import idempotent, identité `siteOccurrenceId`, collision, comparaison, snapshots partiels, décisions, conflits et rollback journal (lignes 32–460).

### Raccord scénario 07A → couverture identifiée
| Scénario | Tests existants candidats | Gap conservateur |
| --- | --- | --- |
| R07A-01/02 navigation Projet et Devis | Aucun test de routage UI identifié parmi ces 4 fichiers | Inspecter suites renderer/navigation et tester focus/identité |
| R07A-03 Site/Page | BlueprintCompositionService tests 17,100 | Confirmer séparation objet Site métier / page WP en UI |
| R07A-04/05 blueprint rejoué et vitrine | CommercialService tests 24,65 ; Blueprint tests 17,43 | Exécution réelle sur HEAD et cas autres templates |
| R07A-06 composant local vs source | Aucun test explicite trouvé parmi ces quatre suites | Rechercher suite AtoumWebCompositionService et édition UI |
| R07A-07 ressources | Aucun test identifié parmi ces quatre suites | Test permissions/inter-projets Ressources |
| R07A-08/09 refus exports | PackageService tests 147,197 | Exécuter, confirmer erreur UI et zéro package résiduel |
| R07A-10/11 Workbench idempotent / conflit exportId | Tests **Manager Snapshot**, pas preuve du plugin WordPress | Tests Bridge PHP séparés obligatoires |
| R07A-12 snapshot partiel | BridgeSnapshotService test 281 | Vérifier absence de suppression UI/service sur cas partiel |
| R07A-13 provisoire sans activation | CommercialService tests 106,101,170 | Exécuter, contrôler UI et objets opérationnels |
| R07A-14 SHA/SQL/intégrité/non-mutation | Rollbacks testés à plusieurs niveaux | Recette TEMP + migrations + intégrité + contrôle absence Validation-MSI nécessaire |

### Verdict de couverture
La couverture statique est **substantielle sur les services**, mais ne suffit pas à solder la recette 07A. Les lacunes prioritaires sont les chemins UI, protection dirty UX-01, Ressources inter-projets et import Workbench exécuté côté plugin. Ne pas confondre `describe('Lot 7B')` dans un test historique avec la livraison de la refonte UX/UI V2 07B.

**Aucun Vitest, typecheck, Electron ni test PHP n'a été exécuté lors de cette passe.** `main` et les autres branches restent hors modification.

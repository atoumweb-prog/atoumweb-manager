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

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

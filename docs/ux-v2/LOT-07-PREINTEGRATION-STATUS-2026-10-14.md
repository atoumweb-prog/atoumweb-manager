# Lot 07 — état technique vérifiable (14/10/2026)

**Périmètre :** PR #116, assemblage de validation UX V2 07A–07G sur `integration/ux-v2-07a-07b-navigation-validation`. **Draft, ne pas fusionner dans main.** Les PR #111 (07A) et #114 (07B) restent séparées pour la livraison. Aucun test n'a utilisé Validation-MSI ni un WordPress Client réel.

## Dernier SHA intégralement validé

- **`0d8c663ce5c212efe8955cf08379c7471d6011b2` : 6/6 contrôles SUCCESS sur le même SHA.**
- [CI générale Windows #38604296540](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38604296540) : typecheck OK, **1 049/1 049 tests Vitest** sur 109 fichiers.
- [Recettes Windows #38604296449](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38604296449) : navigation Projet ↔ Devis, ateliers 07A/07C et UX-01, blueprints/commercial 07C, réutilisation guidée 07D, Bridge/exports 07E–07F, tous verts.
- Autre preuve déjà disponible : le job Windows `ux07ab` du [commit `cfe8e8b`](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38605433094) a passé **80/80 assertions Chromium**, y compris neuf combinaisons thème × densité. Le nouveau SHA de ce run ne doit pas être déclaré intégralement vert avant sa CI qualité.
- **Modifications plus récentes :** sécurité du manifest Workbench, test Prospect `new` E72 intégré au gate commercial, test hash de prévisualisation périmé R07G-05 et exécution commerciale mono-worker pour limiter la contention. Leur certification dépend des jobs du nouveau commit, et n'hérite pas automatiquement de `0d8c663`.

## Avancement factuel des sous-lots

| Sous-lot | Contrôles réellement disponibles | Réserves ouvertes |
|---|---|---|
| 07A | Brouillons, garde de sortie/fermeture, undo/redo composant et recette Electron réelle verte | Inspection manuelle globale et convergence de livraison |
| 07B | Filtres, projets prévisionnels/historiques, source Devis, navigation réelle avec garde, focus, onglets, recherche et Site exact restaurés | Exhaustivité fiche/ressources/prérequis, dépendances inter-lots |
| 07C | Blueprint idempotent et révisions commerciales sous tests SQLite ; double clic et réponses IPC obsolètes Site/Page/chrono corrigés | Arbitrage et recette de remplacement « repartir de zéro » sur Projet travaillé, conflits inter-versions |
| 07D | Atelier réel Chromium, code local HTML/CSS/JS, édition locale et undo/redo ; neuf thèmes × densités testés en environnement isolé | Contrôle humain responsive et pages représentatives |
| 07E | Réutilisation guidée, provenance, exports techniques isolés ; tests d'échec transactionnel et de non-écrasement | Revue humaine des candidats/variantes et éventuelles licences médias |
| 07F | Page Package V2 et trois composants ordonnés, destination Site/Page, exportId distinct, historique transactionnel, avertissement de snapshot partiel | Import/retour Workbench WordPress en environnement de démonstration, Divi 4/5, aucune publication réelle certifiée |
| 07G | Six jobs CI sur SHA cité, tests Windows, SQLite/FK et scénarios R07G supplémentaires ; 80/80 visuels sur commit ultérieur | Matrice 27 scénarios non encore démontrée intégralement en bout-en-bout |

## Matrice R07G — preuves ciblées et limites

- **R07G-01 :** correction E72 présente dans `QuoteService` (un Prospect `new` reste `new` après Devis) et test dans `QuoteService.test.ts`. Inclus dans le nouveau gate commercial à confirmer sur SHA final.
- **R07G-02/03/04/06/07/08/10/11/15/16 :** scénarios métier représentés par `ProjectCommercialService.test.ts`, `ProjectBlueprintCompositionService.test.ts` et `ProjectContributionTargets.test.ts` ; preuves unitaires/fixtures, **pas une recette unique intégrale sur l'UI réelle**.
- **R07G-05 :** nouveau test de prévisualisation périmée sur Devis révisé ; le SHA obsolète doit être refusé sans création de Projet, puis le SHA courant accepté. À confirmer sur le dernier commit.
- **R07G-17/18/19 :** tests chrono, codes locaux, garde des brouillons et undo/redo présents ; allers-retours réels couverts en partie, pas tous les scénarios exacts.
- **R07G-21/22 :** refus d'export Page sans Site actif/composition, trois composants dans l'ordre, `awexp:` distinct, archive précédente inchangée. Échecs simulés du journal/INSERT/BEGIN avec rollback SQLite et nettoyage du ZIP Page, tous testés sur fixtures.
- **R07G-25 :** snapshot partiel : avertissements explicites, aucune suppression des Pages déjà importées malgré une absence observée.
- **R07G-26 :** contrat du paquet `workbench_first`, `workbenchRequired=true`, `directProductionInjection=false` : **test de contrat, pas test WP réel**.
- **R07G-27 :** 3 thèmes × 3 densités vérifiés en Chromium pour lisibilité/largeur atelier (80/80 contrôles du job récent) ; revue de captures, clavier étendu et WordPress de démonstration toujours ouverts.
- **R07G-09/12/13/14/20/23/24 :** acceptation **non certifiée** : arbitrages du remplacement complet, compatibilité add-ons et import/rejeu/conflict hash Workbench réel à démontrer.

## Convergence et protection du projet

1. Ne pas déclarer PR #116 prête à fusionner : elle est le laboratoire de convergence des PR #111/#114 et contient des travaux supplémentaires 07C–07G. Les différences par rapport au dernier `main` devront être réévaluées au stade d'intégration.
2. Préserver les données humaines, versions de Bibliothèque, ressources, temps, snapshots Bridge et marqueurs d'identité. Pas de suppression automatique à partir d'un snapshot partiel.
3. Pas d'injection directe ni publication WordPress en 0.8.1 : cette capacité demande un chantier et une preuve de démonstration distincts.
4. Validation-MSI et sites Clients réels hors de toute recette. Aucun merge `main` sans autorisation explicite.

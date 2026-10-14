# Lot 10B — Incrément initial : fraîcheur et cohérence des réponses statistiques

**Date** : 14/10/2026. **Statut** : code commité sur branche empilée ; typecheck/CI/test Electron **non effectués sur cette branche**.

## Point de départ et séparation
- Branche `feature/ux-v2-lot10b-statistics-load-v1` dérivée du code documentaire `10A@d4dff050` (PR #125, CI Windows du 10A verte).
- Périmètre : les deux écrans statistiques déjà présents, jamais un troisième calcul ni une API métier supplémentaire.
- Aucune mise à jour de `main`, migration, facture ou sauvegarde.

## Écart 10B traité en premier
- **R10B-14 / E298** : la version analytique laissait une requête lente de période A remplacer les résultats de période B, après réponse de plusieurs IPC.
- Un compteur `requestVersion` invalide les réponses/erreurs/états de chargement antérieurs lors d'un nouveau chargement, d'un changement de filtre ou du démontage.
- Les trois jeux (financier, commercial, projets/temps) sont posés ensemble seulement pour la **requête encore courante**.
- En sélection personnalisée encore incomplète, les chiffres antérieurs sont conservés sans requête fausse et marqués comme « dernière période calculée » ; la période effectivement calculée figure au-dessus.
- La version simplifiée protège aussi l'agrégation de huit listes métier lors des rafraîchissements concurrents (`atoumweb:changed`, temps, interventions).
- Fonction pure `analyticsSnapshotMatchesSelection` et tests associés : changement de preset, dates personnalisées inchangées et modifiées.

## Recette restante et garanties non acquises
1. TypeScript, suite Vitest et recette **Electron Windows réelle** à exécuter sur le HEAD précis de cette branche.
2. Test contrôlé d'inversion de réponses A/B, une requête rejetée hors sélection, démontage avant résolution, réponses rapides multiples, aucune fuite de message erroné.
3. 10B est beaucoup plus large : barre de période unique entre vue simplifiée/analytique, fenêtres calendaires ISO/locales, fil d'Ariane, drilldowns fondés sur population réelle, comparatifs « Toutes les données » indisponibles, graphes accessibles et neuf combinaisons.
4. Ne pas considérer une CI du parent #125 comme celle de 10B. Il n'y a pas de fusion autorisée, la revue et recette Windows restent nécessaires.

## Complément sur périodes personnalisées (14/10/2026)
- Une plage avec date impossible (dont 30 février) ou inversion début/fin est rejetée dès la vue, sans solliciter les IPC ni écraser le dernier résultat valide.
- L'API côté main reste responsable de la validation serveur définitive.
- Tests purs couvrent changements rapides de preset, plages modifiées/incomplètes/invalides.
- Pour valider la CI du cumul 10A + 10B, la PR #126 est **temporairement ciblée sur main**, en draft et avec dépendance #125 inscrite en tête ; cela ne fusionne rien, et le diff contient les deux couches.

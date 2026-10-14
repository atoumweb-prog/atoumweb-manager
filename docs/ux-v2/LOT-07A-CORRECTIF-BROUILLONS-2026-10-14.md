# Lot 07A — Premier incrément UX-01 sur les composants

Date : 14/10/2026. Branche indépendante `fix/ux-v2-07a-composition-unsaved-20261014`.

## Portée du correctif
- `ProjectCompositionItemSettings.tsx` : enregistre l'édition locale du composant dans le registre existant UX-01 via `useUnsavedDraft`, avec `dirty`, `pending`, mise à jour de référence après sauvegarde/réinitialisation réussies.
- `ProjectPageCompositionPanel.tsx` : protège le changement de composant (inspecter/réglages) et la fermeture des réglages via `requestUnsavedExit`.
- `ProjectSitesTab.tsx` : protège la sélection d'un autre Site ou d'une autre Page avant de démonter l'éditeur de composition.

## Limites / blocages de validation
Ce correctif est **partiel** : les créations/suppressions, autres changements d'onglet, navigation vers un autre Projet, fermeture de panneaux globaux, resets et effets asynchrones n'ont pas tous été audités/branchés sur UX-01. Une garde globale de sortie non filtrée peut toujours être nécessaire pour certains chemins du shell. Les brouillons de création de composants sont hors de ce premier incrément.

Aucun TypeScript, Vitest ou test Electron n'a été exécuté ici ; **ne pas interpréter les commits comme des tests réussis**. Le dépôt local Windows du développeur n'est pas accessible dans cette session.

## Recette indispensable avant fusion
1. Éditer HTML/CSS/JS + note, choisir un autre composant et **annuler** : contenu et composant inchangés.
2. Refaire puis **confirmer** : une seule transition, référence enregistrée source inchangée.
3. Éditer et changer Site/Page : garde avant changement et aucun brouillon perdu si refus.
4. Sauvegarder : confirmation absente si `dirty=false` ; bascule libre et valeur persistée.
5. Écriture `pending` : changement de sélection refusé durant la sauvegarde.
6. Chemins supplémentaires : autre Projet/onglet, panneau replié, suppression composant, réinitialisation source, latence d'inspection et création d'un composant.
7. Typecheck, suite Vitest complète, tests UI Electron sur TEMP, 3 thèmes × 3 densités ; intégrité et FK, absence de mutation Validation-MSI.
8. Rebase/convergence explicitement contrôlés avec lots 03–06 et évolutions UX-01.

**Pas de fusion, pas d'intervention WordPress, pas de modification de main.**

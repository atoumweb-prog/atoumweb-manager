# UX/UI V2 — Lot 10C : registre de sauvegardes, incrément de sûreté

## Base et périmètre
- Branche dédiée depuis `main@cc0bc679400321f5afacdbee3317ea8acc451518`.
- Contrôle du code de `BusinessBackupService` : `create` enregistre une fiche, `verifyLocation` ne teste que l'existence locale ou consigne la confirmation humaine sur site distant, `markStable` ne certifie pas l'intégrité.
- Aucun moteur WordPress ou mécanisme de restauration externe ajouté.
- Aucune modification de `restore.ts`, `App.tsx`, `main`, migration, base SQLite réelle ni Validation-MSI.

## Livrables
- Précise en tête de la page que déclarer n'effectue **aucun backup physique**.
- Sépare les états : `local.exists === true` (chemin présent), `false` (introuvable), `null` (non contrôlé), confirmation externe manuelle ; ni une existence ni une confirmation ne prouvent une archive intègre ou restaurable.
- Action de vérification explicitement différente selon source locale/externe.
- Libellé « référence stable déclarée » sans label de fiabilité trompeur.
- Verrou synchrone + désactivation des commandes mutantes pendant leur exécution : double clic concurrent sur création, emplacement, vérification, relocalisation et version stable.
- Tests purs de toutes les valeurs d'état du registre, y compris null/confirmation externe.

## Gates
- Aucune action de restauration SQLite ni de sauvegarde réelle n'est déclenchée depuis cette branche.
- Tests Electron Windows, Vitest complète, UX-01 et UI 3 thèmes × 3 densités **à exécuter**. Le CI de PR permettra typecheck + Vitest, pas tous les scénarios natifs.
- Le 10C complet exige aussi des tests de restauration SQLite réels sur fixtures TEMP, UX-16/WAL/SHM, et non des garanties inférées de la seule PR #81 fusionnée.

# Passation de la refonte du Manager (15/11/2026, après P6b)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d’entrée** `PASSATION-2026-11-15-apres-P6a.md`, dont les pièges, ceux de `-apres-P4b.md`, `-apres-P4a.md`, `-apres-P3b.md`, `-apres-P3a.md`, `-apres-P2.md`, les dix décisions de `PASSATION-2026-11-14-apres-P1.md` et `PASSATION-2026-11-14-apres-R9.md` (données de test, outils, cycle d’un lot) restent valables. Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n’est poussé** (la branche distante est restée sur un ancien commit), aucune PR. Derniers commits : P6b (voir `git log --oneline -5`), P6a `67101d76`, P4b `cd115045`, P4a `45259baf`, P3b `22426028`.
- **Passe de finitions** : P1, P2, P3a, P3b, P4a, P4b, P6a, **P6b (faits)** ; **à faire** : **P5 Petits textes** (budget visé à zéro, F27 chiffres clés unifiés) ; puis fin de refonte (styles AtoumWeb et Blanc, densités Compact et Confort +). Lot dédié hors interface : l’acompte par défaut.
- **Preuves de P6b** : typecheck propre ; 313 fichiers passés, 2 561 tests ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; bancs 01b 50, 01d 127, 01f 123 et 14 ; `03e-directory` 206 ; contrats 148 ; Offres lot 1 32 ; `home-shell-lot1` 96 (stable : 6 sur 6) ; budget petits textes 617 ; `!important` 86.
- **Seule recette rouge connue** : `check-convergence-visual-consistency` (F66), rouge aussi sur `67101d76`, antérieure ; elle prend deux arguments (une base dans TEMP, un rapport neuf).

## 2. Prochaine action concrète

1. **P5 Petits textes** : fiche courte à faire valider (skills `atoumweb-design`, `superpowers:brainstorming`) : 617 déclarations sous 14 px à zéro, fichier par fichier ; F27 ; F24, F26, F34 (`AtoumWebLibraryPage.css` 53), le reste de F35 et de F40 (`.muted`, `styles.css`), les 42 de `BridgeSitesPage.css` (F36).
2. Décisions de Carlos en attente au registre (relevé P6b) : F55 à F63 (devis accepté qui garde ses étapes de rédaction, plusieurs boutons jaunes, « Prochaine étape », projet terminé, rail en fenêtre étroite, focus de la fiche rapide, boîtes natives, en-tête de fiche, vocabulaire de Sites) ; petits points F64, F65 ; F66 à diagnostiquer.
3. À vérifier à la main par Carlos (non vu par capture) : le redimensionnement de colonne à la souris dans les pages à tableau.

## 3. Ce qu’on a appris pendant P6b (à ajouter aux pièges)

- **Forcer un état rare dans la copie jetable** : prélude `outils-audit\p6b-force.txt` (devis envoyé par `quotePreparationFixture`, étapes du prospect, projet, intervention, maintenance, pack, chrono, Sites). Les règles métier tiennent dans la copie : un prospect ne saute pas de `new` à `negotiation` (transition refusée), il faut un besoin identifié puis un devis envoyé ; le chrono de l’en-tête attend l’événement `atoumweb:time-changed`.
- **Sites rempli sans fichier Bridge** : la fonction `buildSnapshot` de `src/main/bridge/BridgeSnapshotService.test.ts` est extraite du texte du test, compilée par esbuild et importée (`importPackage`) dans la copie.
- **Erreurs simulées** : `gen-audit-p6b.cjs` garde les gestionnaires IPC dans `registered` ; `withFailure([canaux], fn)` remplace puis remet le vrai gestionnaire.
- **Une boîte native bloque l’outil** : un `window.confirm` (cliquer le premier bouton d’une ligne de Devis demande « Confirmer accepté dans Abby ? ») a bloqué le rendu jusqu’au délai de 560 s. Le prélude intercepte `confirm`, `alert`, `prompt` et `dialog.showMessageBox*` (réponse « annuler », journalisée) et écrit le journal au fil de l’eau.
- **Délai de 560 s de l’outil** : une série par taille (`AUDIT_TAILLE=large|etroite`), `AUDIT_PARTIE=fiche` pour une partie ; la mesure des cartes est lente sur les grosses fiches.
- **L’outil peut créer un faux défaut** : rouvrir le rail pour cliquer sans le replier le laissait par-dessus la page ; lire une valeur au lieu du libellé a fait croire à un champ sans nom (C4). Vérifier la cause dans le code avant de classer un défaut.
- **Un test existant peut lire la première règle d’un sélecteur** (`tableLayoutCss.test.ts`) : ajouter une propriété dans la règle existante plutôt qu’une nouvelle règle placée avant.
- **Recettes à arguments** : `check-contract-library-ui` exige `--output <dossier neuf>` ; `check-convergence-visual-consistency` exige `<base dans TEMP> <rapport neuf>` ; une copie détachée neuve n’a pas de dossier `outputs/` (le créer).
- **Instabilité diagnostiquée par sonde au moment exact du contrôle** (F53) : la sonde lit l’état juste avant `check`, la cause n’apparaît qu’une fois sur dix ; remplacer l’attente sur un élément par une attente sur l’état complet.

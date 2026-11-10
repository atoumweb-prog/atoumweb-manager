# Reprise Claude — état au 10/11/2026 (après lot 4)

Point d'entrée pour reprendre le travail de Claude dans une **nouvelle conversation**. Lire aussi `AGENTS.md`, puis les entrées du 09/11 en tête de `PROJECT_STATUS.md`.

## Où travailler

- Dossier : `C:/DEV/01_PROJETS/AtoumWeb/claude-review-pr166` (worktree ; ne pas travailler dans `atoumweb-manager`, ni dans les worktrees Codex).
- Branche courante : `claude/lot4-envoyer-accepter` (locale, non poussée), empilée sur `claude/lot3-devis-rapide` ; pile poussée :
  `codex/integration-v394-v15-20261108` (PR #166) → `claude/v394-decisions-20261109` (PR #168, poussée) → `claude/mode-operatoire-20261109` → `claude/atelier-manager` (reprise des corrections locales Codex du 09/11, outil d'activation, préproduction) → `claude/lot2-cgv-disponibles` → `claude/lot1-mon-entreprise` → `claude/lot3-devis-rapide`.
- Poussé le 10/11 avec l'accord de Carlos, en PR brouillon empilées : #169 mode opératoire, #170 atelier, #171 lot 2, #172 lot 1, #173 lot 3. **Tout nouveau push demande de nouveau l'accord explicite de Carlos (dépôt PUBLIC).** Aucune fusion sans son accord.
- `node_modules` est une jonction vers celui du worktree Codex `offres-tarifs-v2-20261106`.

## Préproduction de Carlos

- `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-PREPRODUCTION-V394-Claude-20261109` (raccourci Bureau « AtoumWeb — PRÉPROD V3.9.4 (Claude) »). Données de TEST + pack V3.9.4.
- Mettre à jour le Manager après un commit : `npx electron-forge package --arch=x64` puis `node scripts/preproduction/update-runtime.cjs --dest <préproduction>` (préproduction fermée ; données conservées).
- Lot 2 appliqué (`publish-starter-offers.cjs`), lot 1 appliqué (`set-company-info.cjs` avec `C:/DEV/Livrables/Mon-entreprise/mon-entreprise.json`, **hors dépôt**). Sauvegardes avant chaque lot dans `Sauvegardes-lots/`.
- Préproduction du 04/11 (Codex) intacte.

## Décisions de Carlos (09/11/2026)

- Tutoiement, français simple, comptes rendus sans jargon ; Carlos est freelance (micro-entrepreneur, sans comptable), n'a jamais utilisé le Manager, veut un outil pratique : icônes, parcours simples, mots qui ont du sens.
- **Un seul modèle visuel** : bleu nuit / jaune (thème Noir, Confort), logo de l'Accueil sur toutes les pages, cartes de l'Accueil aussi en bleu nuit / jaune. Pas de refonte des thèmes AtoumWeb/Blanc pour l'instant.
- **Abby option 1** : devis + CGV produits et envoyés depuis le Manager ; facture faite dans Abby. Pas d'API Abby.
- Qualification avant devis : **conseillée**, plus bloquante (fait au lot 3 ; un prospect tout neuf peut recevoir un devis).
- 10/11 : options suggérées = seulement celles liées à l’offre dans le Catalogue (aucune liée pour l’instant : liste à proposer à Carlos) ; échéancier vitrine : « 40 % à la commande, 60 % avant mise en ligne » (texte du référentiel, confirmé).
- Pack V3.9.4 laissé sur la branche publique ; données personnelles déjà publiées par Codex (docs) : **laisser en l'état**.
- 13 fiches renommées et familles uniques à l'activation ; « À vérifier — ancienne offre 499 € » lu « sur devis » ; annexes de la bibliothèque non intégrées.
- Clauses 119 (références commerciales) et 033 (médiation, texte « À COMPLÉTER ») **non publiées**.
- Formules V39 : clauses de la formule de base + clauses des services que la grille dit inclus — proposition, validation de Carlos attendue.

## Plan (audits du 09/11 : `C:/DEV/Livrables/Audit-visuel-2026-11-09`, `C:/DEV/Livrables/Audit-premier-jour-2026-11-09`)

| Lot | État |
|---|---|
| 1 Mon entreprise | fait (préproduction) |
| 2 CGV disponibles (8 offres, 48 clauses) | fait (préproduction) |
| 3 Devis rapide : un seul parcours depuis le prospect, qualification conseillée, besoin repris, offre choisie une fois par familles/icônes sans « Sans code · v1 », options suggérées, acompte selon l'offre (40/60 vitrine, 30/40/30 Woo), CGV ajoutées automatiquement à un devis neuf | fait (préproduction à jour, commit 832dc49e ; options par offre enregistrées avec `publish-suggested-options.cjs` ; l’assistant suit seul la version publiée des options) |
| 4 Envoyer et faire accepter : bouton « Envoyer le devis » (PDF devis + CGV), liste de vérification en français (6 points restants : canal, livraison, jalons, garantie, licences, renouvellement), fiche « à recopier dans Abby » | fait en local (essai réel réussi ; préproduction et push en attente de l’accord de Carlos) |
| 5 Prospect simplifié : « + Prospect », une étape de création, 2 niveaux de navigation max, « Enregistrer et continuer », boutons rapides sur l'Accueil | **prochain** |
| A–F visuel : en-tête unique (retirer « SQLite · 81 migrations »), barre d'outils, tableaux, cartes, texte ≥ 14 px, finitions (messages vides, 18 familles, bandeau Bibliothèque, retour en haut) | à faire |

## Méthode qui a fonctionné

- Une branche par lot, empilée ; tests ciblés puis `npx tsc --noEmit` + `node scripts/run-tests.cjs` (≈1 911 tests) **avant** chaque commit.
- Vérifier en conditions réelles avec un pilote Electron sur **copie jetable** de la préproduction (jamais sur la préproduction elle-même), captures à l'appui.
- Mettre à jour `PROJECT_STATUS.md` à chaque lot. Aucune donnée personnelle dans le dépôt.

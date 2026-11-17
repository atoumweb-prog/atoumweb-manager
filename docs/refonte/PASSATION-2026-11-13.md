# Passation de la refonte du Manager (13/11/2026)

À lire en premier dans la nouvelle conversation. Ce fichier ne remplace ni `PROJECT_STATUS.md` ni `docs/refonte/DESIGN.md` : il dit où on en est, comment travailler, et quoi faire ensuite.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n'est poussé**, aucune PR.
- **Derniers commits locaux** : `fac69dde` (suivi), `b2ad606e` (code de R2), `72834411` (documents : règles A à J, audit, plans), au-dessus de `84e43486`.
- **Fait** : R0 (jetons, police), R1 (composants partagés), cadrage des parcours, **audit ergonomique complet**, **R2 « Socle commun » terminé, validé par Carlos sur captures et commité**.
- **Preuves de R2** : typecheck propre ; `node scripts/run-tests.cjs` : 268 fichiers, 2 075 tests, 1 ignoré ; quatre scripts natifs à 0 échec (typographie 72 contrôles, états 18/18, garde Abby 25, interface réelle 857 contrôles sur 17 écrans).
- **Prochaine action** : **R3 Prospection**. Par la règle J, commencer par une **fiche de refonte à faire valider par Carlos avant tout code**.

## 2. Documents à lire, dans cet ordre

1. `AGENTS.md` (règles du dépôt + section « Règles de travail de la refonte », A à J).
2. `PROJECT_STATUS.md` (en-tête : entrées « Audit ergonomique » et « R2 EXÉCUTÉ »).
3. `docs/refonte/DESIGN.md` (charte, décisions, ordre des lots, section 11).
4. `docs/refonte/plans/2026-11-13-r2-socle-commun.md` (dont la section « Révisions ») et `…-design.md`.
5. `C:\DEV\Livrables\Cadrage-parcours\AUDIT-ERGONOMIQUE.md` (rapport final : notes, P0 à P2, doublons, ordre des lots) et `CADRAGE.md` (sections 3, 5, 6, 13, 14).
6. Skills à citer à chaque étape : `atoumweb-design` (obligatoire pour toute interface), `superpowers:brainstorming` (choix ouverts), `writing-plans`, `executing-plans`, `test-driven-development`.

## 3. Comment travailler avec Carlos

- Tutoiement, accord action par action, **pas de tirets longs**, ne jamais écrire « assuré », citer les skills utilisées à chaque étape, dire ce qui n'a pas été vu.
- Il n'a jamais utilisé le Manager : l'audit repose sur le code et les captures, pas sur sa recette.
- **Règles A à J** (résumé) : A trois niveaux de décision (autonome pour ce qui applique la charte, à valider par lot pour la disposition d'un écran, sa décision pour données, règles métier, légal, ordre du parcours) ; B ordre des étapes Prospect → Devis → Projet figé ; **C commit local par lot seulement après tests verts et captures vues par lui, push/PR/fusion sur accord explicite** ; D lancement de l'application autorisé pour captures et vérifications (copie jetable, sans port de débogage) ; **E un seul thème (Noir) et une seule densité (Confort)** pendant la refonte ; F nettoyage du code prouvé inutilisé ; G journal sans redemander le texte ; H scripts de recette sur règles durables ; I écart mineur de plan = une ligne « révision », changement de périmètre = son accord ; J deux validations par lot (fiche avant le code, captures après).
- Il demande des explications simples : quand un numéro de tâche ou un jargon sort, l'expliquer en une phrase.
- Il valide en regardant des **captures** : en fournir pour chaque lot (dossier dans `C:\DEV\Livrables\Cadrage-parcours\`).

## 4. Décisions déjà prises (ne pas les rouvrir)

- Refonte des pages existantes autorisée, **aucune fonction supprimée**, aucun doublon, chaque écran validé avant d'être codé.
- Ordre : R3 Prospection, R4 Devis (un seul assistant, saute « Pour qui » depuis un contact), R5 Projets, R6 Accueil « À faire maintenant », R7 Gestion, R8 Offres / Bibliothèque / Sites / Sauvegardes / Statistiques, R9 Réglages (« Mon entreprise » d'abord, outils de test repliés en « Recette »), puis styles AtoumWeb et Blanc et densités Compact / Confort +.
- Fiche prospect : **les 7 onglets restent visibles** ; seuls les niveaux 2 et 3 deviennent des sections repliables ; « Prochaine étape » au-dessus.
- « Contacts » (Prospection, Clients, Annuaire) : regroupement d'affichage seulement, aucune migration.
- La puce « SQLite · N migrations » a quitté les en-têtes (le détail reste dans Réglages).
- **Une seule action principale jaune par vue** ; Fermer, Annuler, Retour, Réduire, Replier, Actualiser ne sont jamais principaux (test `ui/buttonHierarchy.test.ts`).
- Acompte : jamais de 30 % par défaut ; règles d'échéancier du référentiel (voir `DESIGN.md` section 11 et `CADRAGE.md` section 13). Rien n'est appliqué dans le Manager.
- `PageHeader` : branché seulement sur l'en-tête générique (14 écrans) ; **Prospection, Clients et Offres gardent leur en-tête propre jusqu'à R3 et R8** (accepté par Carlos).
- Plancher de 14 px pour tout texte fonctionnel.
- Couleurs de statut : palette métier à 4 couleurs conservée (température, relation client, relation d'annuaire) ; pastilles d'étape de prospect ramenées à six rôles de couleur. `StatusPill` (R1) à brancher dans Devis, Clients, Annuaire, Projets dans leurs lots.

## 5. Contenu prévu de R3 Prospection (à présenter en fiche, pas à coder d'emblée)

- Fiche de travail : « Prochaine étape » en tête (composants `NextStepCard`, `MoreMenu`, `RecordHeader` de R1, jamais branchés encore) ; **un seul bouton « Enregistrer »** (aujourd'hui trois : « Enregistrer et continuer », « Enregistrer le besoin », « Enregistrer et faire le devis ») ; **une seule façon de programmer une action** (aujourd'hui « Prochaine action », « Programmer une action », « + Action ») ; la fiche s'ouvre sur l'onglet logique de l'étape (aujourd'hui Besoins) ; niveaux 2 et 3 repliables.
- Liste : `PageHeader` à adopter (retire une des quatre règles `:has()` qui masquent l'en-tête générique), pastilles via `StatusPill`.
- Clients : `PageHeader` et l'en-tête de `ClientsPage.tsx` (barre d'outils), retrait de la règle `:has()` correspondante ; réécrire `scripts/fixtures/prospection-gallery.cjs` (obsolète : cherche `.prospect-workspace-identity>summary`, absent du code avant R2).
- Réécrire pendant R2 puis R3/R4 les scénarios de `check-unsaved-inputs-ui.cjs` (suppression d'une ligne de devis) et `check-contract-library-ui.cjs` (texte du PDF commun) : pas de lot R1b.

## 6. Dette connue (mineurs différés de la relecture indépendante)

M1 Temps ne compte ni la période ni le drilldown dans son message vide ; M2 Documents tout archivé affiche « Rien à afficher » ; M3 Offres a deux définitions de « filtres actifs » ; M4 minuteur de notice sans garde sur le message courant (théorique) ; M5 le détecteur de boutons accepte toute balise contenant `secondary-button` ; M6 `page-header.css` hors de la liste gardée de `importantBudget.test.ts` ; M7 CSS mort `.database-chip` et `.health-dot` ; M8 en-têtes de Prospection en 14 px gras 600 par des règles plus spécifiques ; M9 `emptyText` n'est passé par aucun écran. Autres : titre de projet coupé dans le corps de cellule (R5) ; 11 fichiers orphelins à confirmer avant retrait (`WorkflowDashboard.tsx` = base possible de « À faire maintenant », `CatalogOverview.tsx`, `QuoteFinalizationPanel.tsx`, `DashboardOperationsWatch.tsx`, 3 ateliers, `project-tree-arrangement.css`) ; 678 déclarations sous 14 px au total (budget `ui/fontFloorBaseline.json`, ne peut que baisser : chaque lot doit abaisser celui de ses fichiers) ; `!important` : `ui-consistency-v2.css` 86 (plafond du test).

## 7. Méthode et outils

- **Tests d'abord** (voir `test-driven-development`) : écrire le test, le voir échouer, coder, voir passer, puis suite complète.
- **Commandes** (depuis le worktree) : `node scripts/run-tests.cjs` (tout) ou `node scripts/run-tests.cjs chemin/du/test` ; `npm run typecheck` ; scripts natifs `node scripts/check-ux-v2-lot01a-real-ui.cjs`, `check-ux-v2-lot01a-typography.cjs`, `check-ux-v2-lot01a-states.cjs`, `check-ux-v2-lot01b-abby-guard.cjs` (durent plusieurs minutes, lancer en arrière-plan, ne pas les lancer en même temps qu'une capture : fenêtres et focus).
- **Captures** : `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-captures.cjs` (copie du script de session, hors dépôt). Il copie `C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-Claude-Codex-20261110\Workspace` (base fictive) dans un dossier jetable, vérifie par empreinte que la source ne bouge pas, lance l'application sans port de débogage, passe en Noir / Confort, capture les 17 écrans, la fiche prospect et ses onglets, l'assistant de devis, l'éditeur, le projet, le client, et écrit `journal-captures.json` (boutons, mesures d'en-têtes, contrastes). Variables : `AUDIT_OUT` (dossier de sortie), `AUDIT_ALLOW_UNVERIFIED=1` (la fiche prospect est une fenêtre superposée où le repère de contrôle d'image reste invisible : les images portent « NON-VERIFIE » et se relisent à l'œil). Lancer : `node chemin\audit-captures.cjs` depuis le worktree (il charge `electron` et `esbuild` du dépôt).
- Autres outils copiés dans le même dossier : `gen-font-baseline.cjs` (régénère `ui/fontFloorBaseline.json` : seulement à la baisse), `css-stats.cjs` (relevé CSS), `orphans.cjs` (composants non importés), `r2-ledger.md` (journal d'exécution de R2).

## 8. Pièges rencontrés (à ne pas refaire)

- **Un test ne voit pas les conflits de cascade CSS** : mes pastilles d'étape sont devenues toutes grises car `crm/prospect-visual-pilot.css:24` (spécificité 0,3,0) écrasait mes règles ; seule la capture l'a montré. Toujours recapturer après un changement de couleur.
- Les écrans redéfinissent localement des variables (`--accent-strong` en jaune en Noir) : une règle de base avec `color:#fff` devient illisible (1,37 pour 1 mesuré). Utiliser les jetons `--aw-*` ; le contraste des boutons en Noir est maintenant mesuré par `check-ux-v2-lot01a-real-ui.cjs`.
- `overflow-wrap:anywhere` sur les `th` coupait les mots ; les anciennes classes de tableau (`.project-table th`, `.quote-table th`…) passées à `DataTable` imposaient capitales et 10 px : corrigé par `.aw-data-table > thead > tr > th` (spécificité plus haute, sans `!important`).
- `headerMinWidth` = 9 px par lettre + 40 : 11 px provoquait un défilement horizontal qui masquait la colonne « Cible » ; les minimums sont transmis à `shared/adaptiveTableWidths.ts`.
- **Shell** : ne pas passer d'expressions régulières ou de texte avec accents graves dans `node -e "…"` (les barres obliques inverses sautent) ; écrire un fichier `.cjs` à la place. Node sous Windows ne lit pas `/tmp` : utiliser le dossier temporaire de la session.
- Les fichiers du dépôt ont des fins de ligne CRLF mélangées ; conserver celles du fichier édité (avertissements « LF sera remplacé » sans effet).
- Un script natif cassé n'est pas toujours dû à ton lot : vérifier avec `git grep … HEAD` que le sélecteur existait avant.
- Avant tout commit : suite complète, typecheck, scripts natifs, **captures vues par Carlos**.

## 9. Pour démarrer la nouvelle conversation

1. Lire les documents du § 2, dans l'ordre.
2. Vérifier l'état : `git status` (doit être propre), `git log --oneline -4`.
3. Annoncer les skills (`atoumweb-design`, `superpowers:brainstorming`), puis **présenter à Carlos la fiche de refonte de R3** (périmètre : § 5), avec captures « avant » existantes dans `C:\DEV\Livrables\Cadrage-parcours\captures-audit\` (dont `complement-fiche\` pour la fiche prospect).
4. Après sa validation : plan (`writing-plans`, rangé dans `docs/refonte/plans/`), exécution par tests d'abord, captures « après », sa recette, puis commit.

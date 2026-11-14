# Passation de la refonte du Manager (14/11/2026, après R5a)

À lire en premier dans la nouvelle conversation. Ce fichier **complète** `PASSATION-2026-11-13.md` (méthode, règles, pièges, outils) : il dit où on en est après R3, R4 et R5a, ce qui reste, et où sont les données de test. Il ne remplace ni `PROJECT_STATUS.md` ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n'est poussé**, aucune PR.
- **Commits locaux de la refonte** (du plus récent au plus ancien) : R5a (dernier commit, voir `git log --oneline -5`), `5ea17298` R4 Devis, `d47d69db` R3 Prospection, puis R2, R1, R0 et les documents.
- **Fait et validé par Carlos sur captures** : R0 fondations, R1 composants partagés, R2 socle commun, R3 Prospection, R4 Devis, R5a Projets (cadre, Production, ligne « En ce moment », liste, onglet d'ouverture).
- **Preuves de R5a** : typecheck propre ; `node scripts/run-tests.cjs` : 280 fichiers, 2 239 tests, 1 ignoré ; scripts natifs : typographie 72 contrôles, états 18/18, garde Abby 25, interface réelle 857 contrôles sur 17 écrans.

## 2. À lire, dans l'ordre

1. `AGENTS.md` (règles du dépôt et règles de travail A à J de la refonte).
2. `PROJECT_STATUS.md` (en-tête : entrées R5a, R5, finitions, R4, R3).
3. `docs/refonte/PASSATION-2026-11-13.md` (méthode, pièges, outils de capture).
4. **`docs/refonte/FINITIONS.md`** : le registre des finitions F1 à F17, avec le créneau de la passe dédiée.
5. `docs/refonte/plans/2026-11-14-r5-projets-design.md` (fiche R5 validée, découpée en R5a puis R5b) et `…-r5a-projets.md` (plan exécuté).
6. `docs/refonte/DESIGN.md` (charte, décisions, ordre des lots, section 11).

## 3. Ce qui reste à faire (rien n'est perdu : tout est ici)

**Lots de la refonte, dans l'ordre décidé**
1. **R5b** Projets : Résumé (types en français, zone vide supprimée, « ecommerce » et « Normal » bruts), Commercial (message vide qui dit pourquoi), **Interventions** (texte à 10 px, quatre compteurs à 0 et quatre sections vides à remplacer par un seul message utile), Prérequis (tableau compact libellé et statut côte à côte, compteur « 1 validé sur 4 », filtre « seulement ce qui manque »). Fiche déjà validée dans son principe (section D de `r5-projets-design.md`) ; refaire la lecture des captures `captures-r5\avant\` des onglets Sites et pages, Prérequis, Commercial de la boutique et de la landing page avant d'écrire le plan.
2. **R6** Accueil « À faire maintenant » (compteur « Devis à préparer » honnête ; `WorkflowDashboard.tsx` est une base possible).
3. **R7** Gestion (Facturation, Dépenses, Documents, Temps, Interventions) : modèle de liste unique, groupe GESTION qui s'ouvre sur la page active, M1 (message vide du Temps) et M2 (Documents tout archivé).
4. **R8** Offres, Bibliothèque, Sites, Sauvegardes, Statistiques (M3 : deux définitions de « filtres actifs » dans Offres).
5. **R9** Réglages (« Mon entreprise » d'abord, outils de test repliés en « Recette »).
6. **Passe de finitions** (décidée par Carlos le 14/11/2026) : **après R9, avant** la mise à jour finale des styles AtoumWeb et Blanc et des densités Compact et Confort +. Elle traite tout `FINITIONS.md`. **Règle : à la fin de chaque recette de lot, mettre à jour le registre avant le commit du lot.**
7. **Fin de refonte** : styles AtoumWeb et Blanc, densités Compact et Confort +.

**Lot dédié, hors refonte d'interface (décision de Carlos du 14/11/2026)** : **l'acompte par défaut**. L'assistant de devis reprend `depositPercent` des Réglages (valeur d'attente codée « 30 » dans `QuoteWizard.tsx`), ce qui contredit la décision « jamais de 30 % par défaut, échéancier « à définir », envoi bloqué ». Règle métier : ne jamais la changer dans un lot d'interface. Détails dans `DESIGN.md` section 11 et `CADRAGE.md` section 13.

**Règles métier laissées de côté, à valider à part** : « Prochaine étape » du projet, étapes de l'offre posées à la création, acompte à encaisser, préparation Abby (acompte, solde), garantie de 30 jours, relances de devis J+7 / J+14, acceptation avec preuve.

## 4. Dette connue (liste complète, rien n'est caché)

- **Scripts de recette déjà en échec avant la refonte** (causes non établies) : `scripts/check-contract-library-ui.cjs --output <dossier>` échoue sur « PDF common presentation » (HTML du PDF, `src/main` non touché) ; `scripts/check-contribution-targets-ui.cjs --output <dossier>` échoue sur « Affecter la cible » en mode prévisionnel (vérifié avec l'ancien panneau). Les deux exigent `--output`.
- **Sept scénarios de recette Prospection obsolètes** : `prospect-density-scenarios`, `prospection-corrections`, `-desk`, `-flow`, `-pilot`, `-tabs`, `-ux-lots` (dans `scripts/fixtures/`).
- **Finitions F1 à F17** dans `FINITIONS.md` : titres en double (Qualification, Analyse de l'entreprise), ordre « Plus » puis croix dans l'en-tête de la fiche prospect, raison du blocage de « Suivant » trop à droite, résumés absents pour « Prestations », note « Plan issu du modèle d'origine » (75 px), plan à 429 px au lieu de 420, traits qui dépassent à droite des phases, noms de tâche coupés, ligne « En ce moment » jamais vue avec des compteurs non nuls, fichiers orphelins, mineurs M4 à M9.
- **Jamais vus** : états d'erreur, textes très longs, fenêtre étroite, clavier, thèmes AtoumWeb et Blanc, densités Compact et Confort +, un projet réellement avancé issu du parcours moderne.
- **Budgets** : petits textes 676 (ne peut que baisser) ; `!important` d'`ui-consistency-v2.css` (plafond du test).

## 5. Données de test gardées en base

- **Préproduction de test** : `C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-Claude-Codex-20261110\Workspace` (`PREPRODUCTION_TEST`, base fictive).
- **Trois clients fictifs** (devis acceptés, projets figés par le parcours moderne) : `TEST — Boulangerie Lefèvre` (Site vitrine 5 pages, **699 €**, DEV-2026-005, PRO-2026-004, 15 éléments), `TEST — Atelier des Saveurs` (Boutique WooCommerce, 1 490 €, DEV-2026-006, PRO-2026-005, 16 éléments), `TEST — Studio Horizon` (Landing Page, 499 €, DEV-2026-007, PRO-2026-006, 10 éléments).
- **Recréer ou vérifier** : `node scripts/seed-clients-fictifs.cjs --workspace "<dossier Workspace>"` (simulation sur copie jetable) ; ajouter `--apply` pour écrire (sauvegarde automatique avant écriture dans `Sauvegardes-lots\`). Idempotent : relancer ne duplique rien. Repère : `Workspace\DONNEES-FICTIVES-CLIENTS.json`.
- Ces projets n'ont **aucun avancement** (0 %). Pour juger un plan avancé : `node scripts/check-shell-home-simplification.cjs --projet` crée un projet interne en cours (base temporaire).

## 6. Outils et commandes (depuis le worktree)

- Tests : `node scripts/run-tests.cjs [chemin]` ; `npm run typecheck`.
- Scripts natifs de référence : `check-ux-v2-lot01a-typography.cjs`, `check-ux-v2-lot01a-states.cjs`, `check-ux-v2-lot01b-abby-guard.cjs`, `check-ux-v2-lot01a-real-ui.cjs`. **Un seul Electron à la fois**, en tâche de fond.
- Galeries de recette (harnais `check-shell-home-simplification.cjs`) : `--gallery` (Prospection), `--devis` (Devis), `--projet` (projet interne en cours).
- Captures : `C:\DEV\Livrables\Cadrage-parcours\outils-audit\` : `audit-captures.cjs` (écrans), **`audit-projets.cjs`** (`AUDIT_MODE=projets AUDIT_ALLOW_UNVERIFIED=1 AUDIT_OUT=<dossier>`, ouvre les trois clients, capture les six onglets et consigne les mesures : hauteur de la barre d'onglets, début du plan, ligne « En ce moment »). Dossiers livrés : `captures-r3\`, `captures-r4\`, `captures-r5\`.

## 7. Pièges rencontrés (à ne pas refaire)

- **Les antislashs de mes expressions régulières ont plusieurs fois été perdus** quand je générais des fichiers de test par un script ou un bloc shell ; un test a même passé à vide à cause d'un `||` non échappé. **Écrire les tests avec l'outil d'écriture ou d'édition, jamais par un bloc shell, et vérifier qu'un test passe pour la bonne raison.**
- Dans un gabarit JavaScript (backticks), `\s` devient la lettre « s » ; écrire `\\s` ou éviter l'expression régulière. La flèche « ← » peut être mal encodée via un shell : utiliser `\u2190`.
- Plusieurs scripts natifs exigent `--output <dossier>` : sans lui, le script expire à 240 s sans verdict.
- Les fichiers du dépôt ont des fins de ligne mêlées (CRLF et LF) : conserver celles du fichier édité.
- **Un script cassé n'est pas toujours dû à ton lot** : vérifier en le relançant avec le fichier d'origine (`git show HEAD:chemin`) avant de conclure.
- Un test ne voit pas les conflits de cascade CSS : recapturer après tout changement de couleur ou de mise en page. Les mesures réelles (hauteurs, positions) valent mieux qu'une impression.
- La fenêtre de capture doit rester à la taille réelle (1510 x 1030) : à 1500 px de haut, j'avais pris un étirement de mise en page pour un défaut de contenu.
- Propriété privée `database` de `DatabaseService` : utilisable à l'exécution dans un script esbuild (`(db as any).database`), pas dans du code d'application.

## 8. Comment travailler avec Carlos (inchangé)

Tutoiement, accord action par action, **pas de tirets longs**, ne jamais écrire « assuré », citer les skills à chaque étape, dire ce qui n'a pas été vu. Deux validations par lot : la fiche avant le code, les captures avant le commit (règle J). Commit local par lot **seulement après tes captures vues**, push et PR sur accord explicite (règle C). Il valide sur captures ; lui fournir un dossier avant / après pour chaque lot. Il a demandé de ne rien laisser derrière : **consigner dans le registre des finitions, pas dans sa tête**.

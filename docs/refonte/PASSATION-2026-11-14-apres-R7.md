# Passation de la refonte du Manager (14/11/2026, après R7)

À lire en premier dans la nouvelle conversation. Ce fichier **remplace comme point d'entrée** `PASSATION-2026-11-14.md` (état après R5a) et complète `PASSATION-2026-11-13.md` (méthode des lots R2 à R4, règles A à J). Il ne remplace ni `AGENTS.md`, ni `PROJECT_STATUS.md`, ni `docs/refonte/DESIGN.md`.

## 1. Où on en est

- **Dépôt** : `C:\DEV\01_PROJETS\AtoumWeb\claude-review-pr166` (worktree), branche `claude/refonte-manager`. **Rien n'est poussé**, aucune PR.
- **Commits locaux de la refonte** (récent en premier ; `git log --oneline -9`) : **R7** (message `feat(r7): Gestion sur un seul modèle de liste…`), R6 `cae093e4`, R5b `e3f8c8bf`, R5a `1d2ebf84`, R4 `5ea17298`, R3 `d47d69db`, puis les documents `30cafc73`, `fac69dde`, R2 `b2ad606e`, `72834411`.
- **Fait et validé par Carlos sur captures** : R0 fondations, R1 composants partagés, cadrage des parcours, audit ergonomique, R2 socle commun, R3 Prospection, R4 Devis, R5a et R5b Projets, **R6 Accueil** (« À faire maintenant »), **R7 Gestion** (Facturation, Dépenses, Documents, Temps, Interventions).
- **Preuves de R7** : `npm run typecheck` propre ; `node scripts/run-tests.cjs` : 299 fichiers, 2 396 tests, 1 ignoré ; scripts natifs : typographie 72 contrôles, états 18/18, garde Abby 25, interface réelle 857 contrôles sur 17 écrans ; recettes de Gestion : `--lot09b` 85, `--lot09c` 67, `--lot09d` 73, `--lot09e` 70, `check-ux-v2-lot10-ui.cjs` 59 ; 0 erreur console sur les captures ; budget des petits textes 648.
- **Prochaine action concrète** : **fiche de R8** (voir section 3), à faire valider par Carlos **avant tout code** (règle J).

## 2. À lire, dans l'ordre

1. `AGENTS.md` (règles du dépôt et règles de travail A à J de la refonte).
2. `PROJECT_STATUS.md` (en-tête : entrées R7, R6, R5b, R5…).
3. Ce fichier.
4. `docs/refonte/PASSATION-2026-11-13.md` (méthode, règles A à J résumées, composants de R0 à R2).
5. **`docs/refonte/FINITIONS.md`** : registre F1 à F30, avec les points déjà rattachés à un lot.
6. `docs/refonte/DESIGN.md` (charte, décisions, ordre des lots, section 11).
7. Pour copier la forme d'un lot : `docs/refonte/plans/2026-11-14-r7-gestion-design.md` (fiche) et `…-r7-gestion.md` (plan en tâches, tests d'abord, section « Révisions »).
8. `C:\DEV\Livrables\Cadrage-parcours\outils-edition\LISEZ-MOI.md` (outils d'édition hors dépôt) et `AUDIT-ERGONOMIQUE.md`, `CADRAGE.md` dans `C:\DEV\Livrables\Cadrage-parcours\`.

## 3. Ce qui reste à faire (rien n'est perdu : tout est ici)

**Lots de la refonte, dans l'ordre décidé**
1. **R8** : Offres, Bibliothèque, Sites, Sauvegardes, Statistiques. Points déjà identifiés : M3 (deux définitions de « filtres actifs » dans Offres), Offres : onglet « Pilotage À venir », deux niveaux de vues qui se recoupent, 4 compteurs sur 6 à zéro ; Bibliothèque notée 17/40 (la plus basse avec Réglages), textes minuscules ; Sauvegardes : bandeau en petit texte ; Sites : état vide déjà bon. **À trancher dans la fiche : la page Annuaire (groupe Ressources du rail) n'est dans aucun lot.** Réutiliser les briques de R7 là où elles s'appliquent : `ui/KeyFigures.tsx`, `ui/ListToolbar.tsx`, `shared/gestionEmpty.ts` (modèle de message vide qui dit pourquoi), `shared/projectTabs.ts` (`plural`).
2. **R9** : Réglages (« Mon entreprise » d'abord, outils de test repliés en « Recette »).
3. **Passe de finitions** (décidée par Carlos le 14/11/2026) : **après R9, avant** la mise à jour finale des styles AtoumWeb et Blanc et des densités. Elle traite tout `FINITIONS.md`. **Règle : à la fin de chaque recette de lot, mettre à jour le registre avant le commit du lot.**
4. **Fin de refonte** : styles AtoumWeb et Blanc, densités Compact et Confort +.

**Lot dédié, hors refonte d'interface (décision de Carlos du 14/11/2026)** : **l'acompte par défaut**. L'assistant de devis reprend `depositPercent` des Réglages (valeur d'attente « 30 » dans `QuoteWizard.tsx`), ce qui contredit la décision « jamais de 30 % par défaut, échéancier « à définir », envoi bloqué ». Règle métier : **ne jamais la changer dans un lot d'interface**. Détails : `DESIGN.md` section 11 et `CADRAGE.md` section 13.

**Règles métier laissées de côté, à valider à part** (ne pas les coder dans un lot d'interface) : « Prochaine étape » du projet, étapes de l'offre posées à la création, acompte à encaisser, préparation Abby (acompte, solde), garantie de 30 jours, relances de devis J+7 / J+14 / J+30 (réglables), acceptation avec preuve. Elles entreront dans la liste « À faire maintenant » de l'Accueil (`shared/homeTodo.ts`) quand elles seront validées, sans changer l'écran.

## 4. Dette connue (rien n'est caché)

- **Registre `FINITIONS.md` F1 à F30** : à lire en entier. Les plus utiles à savoir avant R8 : F9 (budget des petits textes à faire baisser à chaque lot), F10 (fichiers orphelins à confirmer), F20 (lien « Voir tout » de l'onglet Interventions d'un projet : demande un filtre par projet sur la page Interventions, laissé en finition), F25 à F28 (finitions de R7).
- **Recettes déjà en échec avant la refonte** (vérifiées sur le dernier commit à chaque fois) : F5 (sept scénarios de Prospection obsolètes), F6 (`check-contract-library-ui.cjs` sur « PDF common presentation »), F12 (`check-contribution-targets-ui.cjs`), F21 (`check-ux-v2-02d-home.cjs`, `check-shell-home-simplification.cjs` s'arrêtent à « Failed persistence… »), F22 (`check-home-shell-lot1.cjs`, logo dans le rail de Prospection, exige `ATOUMWEB_UX_LOT1_OUTPUT`).
- **Jamais vus** : états d'erreur, textes très longs, fenêtre étroite, clavier, thèmes AtoumWeb et Blanc, densités Compact et Confort +, fiches détaillées d'Interventions, un projet réellement avancé issu du parcours moderne.
- **Budgets** : petits textes **648** (ne peut que baisser, `ui/fontFloorBaseline.json`) ; `!important` (plafond de `ui/importantBudget.test.ts`).
- **Revue** : à chaque lot la « revue finale » est l'autocontrôle de l'auteur, pas un relecteur indépendant ; le dire à Carlos.

## 5. Données de test gardées en base

**Préproduction de test** : `C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-Claude-Codex-20261110\Workspace` (`PREPRODUCTION_TEST`, base fictive). Quatre scripts, **tous idempotents, en simulation sur copie jetable par défaut**, `--apply` écrit avec sauvegarde automatique dans `…\Sauvegardes-lots\` et **seulement avec l'accord explicite de Carlos** (poser la question avec l'outil de question, jamais écrire de sa propre initiative). Ordre de dépendance : le premier d'abord.

| Script (`scripts/`) | Cas (`scripts/fixtures/`) | Repère dans `Workspace\` | Contenu |
|---|---|---|---|
| `seed-clients-fictifs.cjs` | (dans le script) | `DONNEES-FICTIVES-CLIENTS.json` | 3 clients TEST avec devis acceptés et projets figés : Boulangerie Lefèvre (vitrine 699 €, PRO-2026-004), Atelier des Saveurs (boutique 1 490 €, PRO-2026-005), Studio Horizon (landing 499 €, PRO-2026-006) |
| `seed-projets-cas-de-figure.cjs` | `projets-cas-de-figure.json` | `DONNEES-FICTIVES-CAS-DE-FIGURE.json` | Prérequis de chaque statut, demandes, interventions, maintenance, packs d'heures (40 éléments) |
| `seed-accueil-cas-de-figure.cjs` | `accueil-cas-de-figure.json` | `DONNEES-FICTIVES-CAS-ACCUEIL.json` | 2 prospects TEST dont un avec devis brouillon, 2 actions (5 éléments) |
| `seed-gestion-cas-de-figure.cjs` | `gestion-cas-de-figure.json` | `DONNEES-FICTIVES-CAS-GESTION.json` | Documents (dont tous archivés pour Atelier des Saveurs), interventions facturables, éléments à facturer, une facture rattachée, 7 sessions de temps (20 éléments) |

Particularités à connaître :
- **La base garde un réglage visuel enregistré** (clé `ux_v2_visual_preferences_v1`) : Accueil avec seul « À surveiller » replié, rail avec le groupe « Gestion » replié. Il **masque les valeurs par défaut** : pour voir un défaut, capturer avec le réglage retiré (outil `make-accueil-defaut.cjs`).
- Un `-wal` et un `-shm` **vides** traînent dans `Workspace\data` (F29) ; sans danger ; les scripts de cas de figure récents les tolèrent (un `-wal` **non vide** reste refusé).
- Aucune session de chrono n'est laissée en cours (elle resterait active dans la base).
- Ces projets n'ont aucun avancement (0 %). Pour juger un plan avancé : `node scripts/check-shell-home-simplification.cjs --projet`.

## 6. Outils et commandes (depuis le worktree)

- Tests : `node scripts/run-tests.cjs [chemin]` (tourne sous Electron) ; `npm run typecheck`.
- **Scripts natifs de référence : AUCUNE option** (ils refusent `--output`) : `check-ux-v2-lot01a-typography.cjs`, `…-states.cjs`, `check-ux-v2-lot01b-abby-guard.cjs`, `check-ux-v2-lot01a-real-ui.cjs` ; ce dernier accepte seulement `--lot09b|--lot09c|--lot09d|--lot09e|--lot08a|--lot03b|--search-only|--captures`. Autres recettes utiles : `check-ux-v2-lot10-ui.cjs`. **Un seul Electron à la fois**, en tâche de fond, jamais en parallèle.
- Galeries (`check-shell-home-simplification.cjs --gallery` Prospection, `--devis`, `--projet`).
- **Captures** (dans `C:\DEV\Livrables\Cadrage-parcours\outils-audit\`) : `audit-captures.cjs` (17 écrans et fiches), `audit-projets.cjs` (projets, `AUDIT_MODE=projets`), `audit-accueil-defaut.cjs` (Accueil sans réglage). Variables : `AUDIT_ALLOW_UNVERIFIED=1`, `AUDIT_OUT=<dossier>`. Elles copient la base dans un dossier jetable, vérifient que la source n'a pas changé (`SOURCE_UNCHANGED true`), n'ouvrent aucun port de débogage. Dossiers livrés : `captures-r3` à `captures-r7` (`avant\`, `apres\`).
- **Captures « avant » sur le dernier commit** : `git worktree add --detach C:\DEV\01_PROJETS\AtoumWeb\<nom>-avant-tmp HEAD`, `mklink /J …\node_modules` vers `node_modules` du worktree principal, copier l'outil de capture en remplaçant la constante `const repo = '…'` par la copie, lancer depuis la copie. **Nettoyage : retirer d'abord le lien (`cmd /c rmdir …\node_modules`, sans `/s`), vérifier que `node_modules` principal existe encore, puis `git worktree remove --force`.** Jamais l'inverse.
- Budget des petits textes : `node C:\DEV\Livrables\Cadrage-parcours\outils-audit\gen-font-baseline.cjs` (à la baisse seulement ; relire `git diff`).
- **Outils d'édition** (hors dépôt) : `C:\DEV\Livrables\Cadrage-parcours\outils-edition\` (`eol-report.cjs`, `css-prune.cjs`, `css-raise-font.cjs`, `small-fonts.cjs`, modèles dans `exemples\`) ; mode d'emploi dans `LISEZ-MOI.md`.
- Composants et règles réutilisables créés pendant R5b à R7 : `shared/projectTabs.ts` (`plural`, `limitItems`, libellés), `shared/operationLabels.ts`, `shared/gestionEmpty.ts`, `shared/homeTodo.ts`, `ui/KeyFigures.tsx`, `ui/ListToolbar.tsx`, `ui/list-page.css`, `ui/operationStatusTone.ts`, `isGroupExpanded` dans `shared/navigationRail.ts`, prop `emptyFilteredText` de `DataTable`.

## 7. Pièges rencontrés (à ne pas refaire)

- **Fins de ligne** : les fichiers du dépôt sont mêlés (CRLF et LF). **`grep -c $'\r'` renvoie 0 même sur un fichier CRLF** : utiliser `eol-report.cjs`. L'outil d'édition ordinaire conserve la fin de ligne sur une ligne unique ; tout script qui insère du texte doit convertir en la fin de ligne du fichier (voir `exemples\`). Lancer `eol-report.cjs` sur tous les fichiers modifiés avant un commit.
- **Écrire les tests avec l'outil d'écriture**, jamais par un bloc shell (les antislashs des expressions régulières se perdent) ; vérifier qu'un test échoue d'abord, pour la bonne raison.
- **Un test ne voit pas les conflits de cascade CSS** : recapturer après tout changement de couleur ou de mise en page. Les mesures réelles valent mieux qu'une impression. Un défaut a été trouvé par la capture et non par un test à chaque lot (durée « 0 min », double ascenseur, boutons rejetés sur une deuxième ligne).
- **Un test de CSS qui sépare les sélecteurs par virgule ne comprend pas `:is(a, b)`** : écrire des sélecteurs séparés.
- **Un script cassé n'est pas toujours dû à ton lot** : relancer sur une copie détachée du dernier commit avant de conclure (règle H). Les recettes de l'Accueil et la bibliothèque contractuelle échouaient déjà avant la refonte.
- **Les réglages enregistrés de la base de test masquent les valeurs par défaut** (voir section 5).
- **Le classificateur de permissions refuse les suppressions de fichiers dans la préproduction** : ne pas contourner ; adapter le script (comme pour le `-wal` vide) ou demander à Carlos.
- Dans la préproduction, **ne jamais écrire sans accord** ; toujours simuler d'abord ; la source ne doit jamais bouger pendant une capture (`SOURCE_UNCHANGED true`).
- La fenêtre de capture doit rester à 1510 x 1030 ; un étirement de mise en page n'est pas un défaut de contenu.
- Plusieurs scripts natifs exigent ou refusent des options : lire le message d'usage de la première erreur, ne pas deviner.
- Un message `ERREUR … Object has been destroyed` en fin d'un outil de capture « variante » est sans importance (l'application est fermée volontairement).

## 8. Comment travailler avec Carlos (inchangé)

Tutoiement, **pas de tirets longs**, ne jamais employer le mot qu'il a interdit (il est noté dans la mémoire `feedback-carlos-facon-de-travailler` et dans `PASSATION-2026-11-13.md` section 3), citer les skills à chaque étape (`atoumweb-design` pour toute interface ; `superpowers:brainstorming` pour une fiche, `writing-plans`, `executing-plans`, `test-driven-development`), dire ce qui n'a pas été vu, expliquer un jargon en une phrase. Il valide sur **captures** : lui fournir un dossier avant / après par lot.

**Cycle d'un lot** (à suivre tel quel) :
1. **Fiche** dans `docs/refonte/plans/AAAA-MM-JJ-rN-<sujet>-design.md` : critique chiffrée sur captures et code, intention, hors périmètre, approches (A recommandée, B et C écartées), proposition avec croquis, points à trancher numérotés, « ce que je n'ai pas pu voir », preuves prévues. **Il valide point par point** avant tout code.
2. **Plan** `…-rN-<sujet>.md` : contraintes globales, points de vigilance (Review Focus), révisions, carte des fichiers, tâches tests d'abord. Il valide ou demande « exécute ».
3. **Exécution** : un seul commit local par lot, **après ses captures vues** (règle C) ; push, PR et fusion sur accord explicite.
4. **Cas de figure** : quand les écrans sont vides en base de test, écrire un script de cas de figure, le simuler, demander l'accord, l'appliquer.
5. **Recette** : captures `avant\` (dernier commit, mêmes données) et `apres\` ; relire chaque capture ; corriger ce qu'elles montrent ; preuves chiffrées.
6. **Après son accord** : `FINITIONS.md`, `PROJECT_STATUS.md`, passation, mémoire, puis le commit.
7. **Écarts de plan** : une ligne « Révisions » dans le plan (règle I) ; un changement de périmètre demande son accord.

**Règles de fond qui ne changent pas** : aucune donnée métier dupliquée ; devis acceptés jamais modifiés ; Abby seule à émettre les factures ; « Contacts » = regroupement d'affichage sans migration ; pas de commit sur `main` ; plancher de 14 px ; thème Noir et densité Confort seuls pendant la refonte ; une seule action principale jaune par vue ; aucune fonction retirée (seulement rangée) ; l'acompte par défaut est un lot dédié.

## 9. Pour démarrer la nouvelle conversation

1. Lire les documents de la section 2, dans l'ordre.
2. `git status` (doit être propre) et `git log --oneline -9`.
3. Annoncer les skills (`atoumweb-design`, `superpowers:brainstorming`).
4. Faire la **fiche de R8** : relire les captures `captures-r7\apres\` (rail, écrans voisins) et celles de l'audit pour Offres, Bibliothèque, Sites, Sauvegardes, Statistiques (`C:\DEV\Livrables\Cadrage-parcours\captures-r2\` et `captures-audit\`), lire le code des cinq écrans, **demander à Carlos où va l'Annuaire**, proposer un jeu de cas de figure si des écrans sont vides, puis attendre sa validation avant le plan.

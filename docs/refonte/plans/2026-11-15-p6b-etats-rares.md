# P6b États rares : plan d'exécution

> **Pour l'agent qui exécute** : sous-skill obligatoire `superpowers:executing-plans` (avec `superpowers:test-driven-development`, `superpowers:systematic-debugging` et `superpowers:verification-before-completion`) ; skill `atoumweb-design` (audit, harden, adapt) pour tout ce qui touche l'interface. Les cases `- [ ]` suivent l'avancement.

**But :** regarder pour de vrai ce que la refonte n'a jamais montré (devis envoyé ou accepté, étapes rares du parcours, erreurs, textes très longs, fenêtre étroite, clavier, états de projet et de temps, onglets de Réglages), corriger ce qui relève de la charte, inscrire le reste.

**Approche :** un lot **d'audit** : un outil de capture qui **force les états dans la copie jetable** (jamais dans la préproduction), un relevé de défauts prouvé par capture et par mesure, puis des corrections **tests d'abord** pour ceux que la charte tranche seule (règle A), et une entrée du registre pour ceux qui demandent une décision. Le lot est découpé en trois séries de captures pour que la recette de Carlos reste lisible.

**Technologies :** React 18, TypeScript, vitest, Electron (outil de capture hors dépôt, `outils-audit\gen-audit-p4a.cjs` pour fabriquer un outil à partir d'un fichier d'étapes).

**Fiche :** `docs/refonte/plans/2026-11-15-p6-etats-rares-design.md` (validée le 15/11/2026 : option A, états forcés dans la copie jetable ; F7, F19, F30, F36, F41, F42 ; **F53** ajoutée au registre le même jour). Plan de P6a : `…-p6a-filet-de-securite.md` (commit `67101d76`).

## Contraintes globales

- Thème Noir, densité Confort seuls. Budget des petits textes **617, il ne peut que baisser** ; `!important` d'`ui-consistency-v2.css` au plus **86** ; aucun `!important`, aucune couleur en dur, aucun texte sous 14 px ajoutés.
- **Aucune écriture dans la préproduction** `C:\DEV\03_LIVRAISONS\AtoumWeb\Manager-Claude-Codex-20261110\Workspace` : tout état rare est forcé dans la copie jetable de l'outil de capture (`SOURCE_UNCHANGED true` à chaque lancement). Aucune donnée, règle métier, parcours ni acompte modifiés ; aucun devis accepté modifié.
- Tests et scripts d'édition écrits avec l'outil d'écriture (jamais dans un bloc shell) ; `eol-report.cjs` (`C:\DEV\Livrables\Cadrage-parcours\outils-edition\`) sur chaque fichier modifié ; ne pas convertir les fins de ligne en masse.
- Un seul Electron à la fois, en tâche de fond ; scripts natifs de référence sans option ; **relancer la suite complète** avant de dire « vert » (aujourd'hui : 312 fichiers passés, 1 ignoré, 2 538 tests).
- Un défaut trouvé est **prouvé** (capture et mesure) avant d'être corrigé ; un test échoue d'abord. Ce qui change la disposition d'un écran en profondeur n'est pas fait : il est inscrit au registre avec sa capture.
- Un seul commit local pour le lot, **après la recette de Carlos**, aucun push, aucune PR. Aucun mot interdit par Carlos dans les textes rédigés.

## Points de vigilance (Review Focus)

1. **Fenêtre étroite** (760 × 720, zoom 150 %, 497 px utiles) : aucun défilement horizontal parasite ; boutons et barres d'outils atteignables ; mesurer `scrollWidth` contre `clientWidth` sur le cadre de la page, pas seulement regarder la capture.
2. **Textes très longs** (nom de client de 80 caractères, projet à nom long, référence longue) : rien ne se coupe au milieu d'un mot ni ne déborde de sa carte ; les pastilles et les cellules de tableau passent à la ligne ou s'abrègent avec leur texte complet accessible.
3. **Clavier** : ordre de tabulation logique sur les écrans touchés, focus visible, aucune action seulement à la souris (le redimensionnement de colonne au clavier existe déjà).
4. **États d'erreur** : message qui dit quoi faire, bouton « Réessayer » quand c'est pertinent, aucune donnée affichée comme vraie quand la source a échoué.
5. **Devis envoyé et accepté** : aucune action ne modifie un devis accepté ; la fiche et la liste disent clairement l'état (pastille, action visible unique).

## Carte des fichiers

| Fichier | Rôle dans le lot |
|---|---|
| `C:\DEV\Livrables\Cadrage-parcours\outils-audit\p6b-middle-*.txt` et `audit-p6b-*.cjs` (hors dépôt) | séries de captures avec états forcés |
| `docs/refonte/FINITIONS.md` | F7, F19, F30, F36, F41, F42, F53 et les défauts trouvés |
| `src/renderer/ui/p6bWiring.test.ts` (nouveau) | gardes de source des corrections du lot |
| fichiers d'écran touchés par une correction | décidés par le relevé de la tâche 4 |
| `PROJECT_STATUS.md`, `PASSATION-2026-11-15-apres-P6b.md`, mémoire | clôture |

---

### Tâche 1 : l'outil et la façon de forcer chaque état (sondes, sans rien corriger)

**Fichiers :** `C:\DEV\Livrables\Cadrage-parcours\outils-audit\p6b-middle-etats.txt` et `audit-p6b-etats.cjs` (fabriqué par `node gen-audit-p4a.cjs p6b-middle-etats.txt audit-p6b-etats.cjs`, qui reprend la mise en place de la copie jetable d'`audit-p3b.cjs` : `shot`, `navigate`, `clickText`, `step`, vérification `SOURCE_UNCHANGED`).

- [ ] **Étape 1 : recensement de ce qui se force et comment.** Dans la copie jetable, depuis le processus principal de l'outil (`db`), écrire pour chaque état la commande qui le produit, en réutilisant ce que les recettes font déjà : **devis envoyé et accepté** : `require('src/main/testSupport/quotePreparationFixture.ts')` (`finalizeForTest`, `sendForTest`), `db.quotePreparation.recordAcceptance(…)` et `window.atoumweb.quotes.accept(id)` (voir `scripts/fixtures/integration-02-03-scenarios.cjs`) ; **projet terminé, incident, maintenance expirée, pack épuisé** : service `db.projects` / `db.operations` si l'API existe, sinon `UPDATE` SQL **dans la copie jetable seulement** ; **chrono en cours** : clic sur le bouton du minuteur de l'en-tête ; **erreurs** : `ipcMain.removeHandler` puis `ipcMain.handle` qui lance une erreur (modèle : `scripts/fixtures/03e-directory-scenarios.cjs`) ; **noms très longs** : `db.crm.createOrganization({ name: '<80 caractères>' })`, projets à nom long ; **Sites rempli** : chercher dans `src/main/bridge` une API d'import utilisable avec une donnée synthétique ; si aucune, le dire et classer F36 « non vu : aucun site de test sans fichier Bridge ».
- [ ] **Étape 2 : sondes.** Pour chaque état, une étape `step(...)` qui l'applique, vérifie par `get(...)` qu'il est bien en place (texte, pastille, compteur attendu) et capture ; une étape dont la vérification échoue est notée « état non obtenu » (jamais capturée comme si elle l'était).
- [ ] **Étape 3 : lancer** (`$env:AUDIT_ALLOW_UNVERIFIED='1'; $env:AUDIT_OUT='…\captures-p6b\sondes'; node …\audit-p6b-etats.cjs`), attendu `SOURCE_UNCHANGED true`, `TEMP_CLEANED true`, `CONSOLE_ERRORS 0`. Écrire dans « Révisions » un tableau : état, comment il est forcé, obtenu ou non.

---

### Tâche 2 : série A, parcours commercial (F7)

- [ ] **Étape 1 : captures** (Noir, Confort, 1510 × 1030 puis 760 × 720 zoom 150 %) : liste Devis avec un devis **envoyé** et un **accepté** (pastille, action visible, « Plus ») ; fiche d'un devis envoyé et d'un devis accepté (aucune action de modification d'un devis accepté) ; fiche prospect aux étapes « négociation » et « en attente » (carte « Prochaine étape », onglets) ; assistant de devis aux étapes 2 à 5 (une capture par étape, « Suivant » et sa raison, « Vérifier et envoyer ») ; **un nom de client de 80 caractères** dans la liste, la fiche et l'assistant.
- [ ] **Étape 2 : mesures** par `get(...)` : défilement horizontal du cadre (`scrollWidth` / `clientWidth`), éléments dépassant de leur carte, noms coupés au milieu d'un mot, nombre de boutons jaunes visibles (au plus 1).
- [ ] **Étape 3 : relevé** : liste numérotée de défauts (preuve : capture et mesure), chacun classé **charte** (corrigé dans ce lot) ou **décision** (inscrit au registre).

---

### Tâche 3 : série B, production, temps et ressources (F19, F30, F36, F41)

- [ ] **Étape 1 : captures** : projet terminé, projet avec incident, maintenance expirée, pack d'heures épuisé (fiche et onglets Résumé, Production, Interventions) ; page Gestion des temps avec un **chrono en cours** (en-tête, tableau, ligne « En cours ») ; Sites rempli (si obtenu) ; Réglages : onglets « Logo et présentation », « Paramètres du devis », « Conditions contractuelles » avec aperçu paginé, bibliothèque des conditions, **confirmations** (remise à zéro des données de test, restauration, largeur d'une liste), aux deux tailles de fenêtre.
- [ ] **Étapes 2 et 3** : mesures et relevé comme à la tâche 2.

---

### Tâche 4 : série C, erreurs, clavier et relevé général (F42)

- [ ] **Étape 1 : erreurs forcées** (une source qui échoue par page) : Accueil (carte « À faire maintenant » et « À surveiller »), Prospection, Devis, Projets, Facturation, Statistiques, Sauvegardes, Annuaire : message, bouton « Réessayer », aucune donnée présentée comme vraie.
- [ ] **Étape 2 : clavier** : sur les écrans de P4a à P6a (listes, fiche prospect, Réglages) parcours à `Tab` avec capture de chaque focus ; relever les éléments non atteignables ou sans focus visible.
- [ ] **Étape 3 : relevé général** : réunir les défauts des trois séries dans un seul tableau (écran, preuve, classement charte ou décision, estimation) et le **montrer à Carlos dans le chat avant toute correction**, avec ce qui n'a pas pu être vu.

---

### Tâche 5 : corrections (seulement ce que le relevé classe « charte »)

Pour **chaque** défaut classé « charte » :

- [ ] **Étape 1 : test qui échoue** dans `src/renderer/ui/p6bWiring.test.ts` (garde de source sur la règle CSS ou le texte, même méthode que `p4aWiring.test.ts`) ; le voir échouer.
- [ ] **Étape 2 : correction minimale** (jetons, `min-width: 0`, retour à la ligne, texte, ordre du focus), sans `!important`, sans texte sous 14 px.
- [ ] **Étape 3 : recapturer** le même état et relire la mesure (leçon de P3a : mesurer les cadres après un changement de défilement ou de retour à la ligne).
- [ ] **Étape 4 :** `eol-report.cjs`, `npm run typecheck`. Les défauts classés « décision » ne sont **pas** corrigés : ils vont au registre avec leur capture.

---

### Tâche 6 : F53, la recette instable `check-home-shell-lot1`

- [ ] **Étape 1 : reproduire** : la lancer cinq fois de suite seule (`ATOUMWEB_UX_LOT1_OUTPUT` sur un dossier **inexistant** à chaque fois) et compter les échecs.
- [ ] **Étape 2 : comparer au dernier commit** (règle H) sur une copie détachée (procédure de `PASSATION-2026-11-14-apres-R9.md`, section 6) : si elle échoue aussi, c'est antérieur au lot.
- [ ] **Étape 3 : sonde jetable** du contrôle « Active timer dialog preserves timer and exclusive layer » (`scripts/fixtures/home-shell-lot1.cjs`) pour voir ce qui varie (chronométrage, ouverture de la fenêtre du minuteur). Si c'est une attente trop courte, la remplacer par une attente sur l'état (jamais un `sleep` plus long) ; sinon inscrire la cause au registre.

---

### Tâche 7 : recette et preuves

- [ ] **Étape 1 :** captures « après » des états corrigés (vider le dossier avant de recapturer) ; dossier `C:\DEV\Livrables\Cadrage-parcours\captures-p6b\` (`sondes\`, `avant\`, `apres\`).
- [ ] **Étape 2 : preuves** (résultats rapportés tels quels, échecs compris) : `npm run typecheck` propre ; `node scripts/run-tests.cjs` (313 fichiers avec `p6bWiring.test.ts`, 0 échec) ; natifs typographie 72, états 18/18, garde Abby 25, interface réelle 857 ; `check-ux-v2-lot10-ui` 59 ; bancs 01b, 01d, 01f verts ; `check-ux-v2-03e-directory` 206 ; `check-contract-library-ui` 148 ; recettes de P1 à P6a toujours vertes ; budget des petits textes ≤ 617 et `!important` ≤ 86 ; `eol-report.cjs` sur tous les fichiers modifiés ; empreinte de la préproduction identique.
- [ ] **Étape 3 : montrer à Carlos** les captures avant / après et le tableau des défauts (corrigés, inscrits, non vus), dire ce qui n'a pas été vu et que la revue est un autocontrôle. **Attendre sa recette.**

---

### Tâche 8 : clôture et commit local (seulement après la recette de Carlos)

- [ ] **Étape 1 :** `docs/refonte/FINITIONS.md` : F7, F19, F30, F36, F41, F42 (et F53 si traitée) passent en « fait dans P6b » ou « non vu : raison » ; chaque défaut trouvé reçoit sa ligne ; ligne P6b du tableau d'avancement.
- [ ] **Étape 2 :** `PROJECT_STATUS.md` (entrée en tête), `docs/refonte/PASSATION-2026-11-15-apres-P6b.md` (état, prochaine action P5, pièges appris), mémoire (`projet-refonte-passation-r2.md` et sa ligne de `MEMORY.md`).
- [ ] **Étape 3 :** `git status` ; un seul commit local `feat(p6b): …` terminé par la ligne d'attribution demandée ; aucun push.

---

## Révisions

- **15/11/2026 : plan validé par Carlos** (outil de question), avec un ajout : **F42 complet**. Le texte du registre de F42 (le test de câblage de Réglages ne vérifie pas la largeur de 380 px de la recherche) est traité dans ce lot par un garde de test ; les états « erreurs, noms très longs, fenêtre étroite, clavier » (partie de F7) restent la série C.
- **Tâche 1, sondes (15/11/2026)** : outil `outils-audit\gen-audit-p6b.cjs` (comme `gen-audit-p4a.cjs`, mais garde les gestionnaires IPC dans `registered` pour simuler une erreur puis remettre le vrai, et accepte plusieurs fichiers d'étapes) ; prélude commun `p6b-force.txt`. Lancement : `SOURCE_UNCHANGED true`, `TEMP_CLEANED true`, `CONSOLE_ERRORS 0`.

| État | Comment il est forcé (copie jetable) | Obtenu |
|---|---|---|
| Devis envoyé | `quotes.create`, `finalizeForTest`, `sendForTest` | oui |
| Prospect « négociation » et « en attente » | après l'envoi du devis (étape `quote_sent`), `changeProspectStage` ; un saut direct depuis `new` est refusé par la règle métier (voulu) | oui, au second essai |
| Devis accepté | déjà dans les données de test (3) | oui |
| Projet terminé | `changeProjectStatus(…, 'completed')` (Landing page) | oui |
| Incident critique | `createIntervention` type `incident` (Boutique) | oui |
| Maintenance expirée | date de fin au 30/09/2026 (`UPDATE`) et statut `ended` | oui |
| Pack épuisé | mouvement du reste puis statut `exhausted` | oui |
| Chrono en cours | `time.start` puis l'événement `atoumweb:time-changed` (sans lui l'en-tête reste sur « Aucune activité ») | oui, au second essai |
| Sites rempli (F36) | deux paquets Bridge **synthétiques** fabriqués par la fonction `buildSnapshot` du test `BridgeSnapshotService.test.ts`, importés par `importPackage` | **oui** (F36 n'est donc pas « non vu ») |
| Erreur d'une source | `ipcMain.removeHandler` puis un gestionnaire qui lance une erreur, remis ensuite | oui |
| Nom de 79 caractères | `createOrganization` | oui |
| Fenêtre étroite | 760 × 720, zoom 150 % (507 px utiles) | oui |

- **Tâches 2 à 4 (15/11/2026)** : séries A (46 captures), B (58), C (26) ; relevé `captures-p6b\RELEVE-P6B.md` montré à Carlos avant toute correction. F53 reproduite : 2 échecs sur 5.
- **Exécution terminée (15/11/2026)** : tâches 1 à 8 faites ; recette de Carlos sur captures avant / après validée (« Ok je valide ») ; détail et preuves dans `PROJECT_STATUS.md` et `PASSATION-2026-11-15-apres-P6b.md`. Écarts : C4 retiré (artefact de sonde) ; C8 placé dans la règle existante (`tableLayoutCss.test.ts`) ; barre « Colonnes et vues » à « — résultats » ajoutée après la capture « après » ; `check-convergence-visual-consistency` rouge antérieure (F66).
- **Décisions de Carlos sur le relevé (15/11/2026, outil de question)** : C1 à C8 corrigés dans ce lot (charte, test d'abord) ; **D1 et D2 traités dans ce lot** (état d'erreur des listes avec « Réessayer » sans « 0 » présenté comme vrai ; avis d'erreur qui ne suit plus l'utilisateur d'une page à l'autre) ; D3 à D11 au registre avec capture.

## Auto-relecture du plan

- Couverture de la fiche : F7 (tâche 2), F19, F30, F36, F41 (3), F42 et le relevé général (4), corrections de la charte (5), F53 (6), recette (7), clôture (8).
- Limite connue : lot d'audit, son contenu exact dépend du relevé ; les règles de décision sont écrites (charte : corrigé avec test d'abord ; décision : inscrit au registre) et **le relevé est montré à Carlos avant toute correction** (tâche 4, étape 3).
- Les états non obtenus (Sites rempli surtout) sont dits « non vus », jamais présentés comme regardés.

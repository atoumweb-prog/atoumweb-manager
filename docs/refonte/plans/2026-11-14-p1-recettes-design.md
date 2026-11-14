# P1 Recettes : fiche courte (le filet de sécurité de la passe de finitions)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J). Aucun code écrit, aucune recette relancée pour cette fiche.
Skills : `atoumweb-design`, `superpowers:brainstorming`. Thème Noir, densité Confort. Parent : `2026-11-14-passe-finitions-design.md` (décisions 1 et 2 validées le 14/11/2026).

## Intention

Que chaque recette du dépôt soit **verte, ou retirée pour une raison écrite**, avant les lots qui changent des écrans (P3, P4). Aujourd'hui sept entrées du registre sont rouges depuis avant la refonte : un lot d'écran ne peut pas dire « je n'ai rien cassé » là où elles regardent. P1 ne change **aucun écran, aucune donnée, aucune règle métier**.

## Ce que le code montre (relevé, pas diagnostic)

Les sept entrées recouvrent en réalité **une quinzaine de scripts** :

| Entrée | Scripts | Ce que dit le registre |
|---|---|---|
| F5 | 7 scénarios de Prospection : `prospect-density-scenarios.cjs`, et les fixtures `prospection-corrections`, `-desk`, `-pilot`, `-ux-lots`, plus les scénarios `flow` et `tabs` appelés par `check-prospection-flow-native.cjs` et `check-prospection-tabs-native.cjs` | visent `prospect-focus-*`, anciennes associations, « Classer comme perdu » en bouton |
| F6 | `check-contract-library-ui.cjs` (279 lignes) | échoue sur « PDF common presentation » |
| F12 | `check-contribution-targets-ui.cjs` (50 lignes) | échoue sur « Affecter la cible » en mode prévisionnel |
| F21 | `check-ux-v2-02d-home.cjs`, `check-shell-home-simplification.cjs` (petits lanceurs, la logique est dans `scripts/fixtures/`) | s'arrêtent à « Failed persistence never announces or applies saved layout » |
| F22 | `check-home-shell-lot1.cjs` | exige `ATOUMWEB_UX_LOT1_OUTPUT` ; échoue sur le logo dans le rail de Prospection |
| F32 | `check-ux-v2-03e-directory.cjs`, `check-offres-tarifs-lot1.cjs` | « C08 Home search focuses exact Prospect » ; champ « État de version » introuvable |
| F39 | `check-quote-journey-native.cjs` | « Missing button Afficher l'aperçu paginé » |

Les scénarios et documents de Prospection sont cités par `ProspectsPageV2.tsx`, `prospectR3Wiring.test.ts`, `docs/ux-v2/*` et `CLOTURE-PREUVES-2026-10-16.json` : **retirer un scénario demande de vérifier ces références**, pas seulement de supprimer un fichier.

## Méthode proposée

Pour **chaque** script, dans cet ordre, un script à la fois (un seul Electron à la fois, en tâche de fond) :

1. **Relancer sur le dernier commit** (copie détachée, règle H) et noter l'échec exact.
2. **Classer la cause** dans l'une de ces cinq catégories, écrite dans un journal `docs/refonte/plans/2026-11-14-p1-recettes-journal.md` :
   - **A. Attente périmée** (le sélecteur ou le texte n'existe plus, l'écran est volontairement différent) : réécrire sur une règle durable (règle H).
   - **B. Obsolète** (vise un parcours ou un composant qui n'existe plus) : **retirer**, avec la liste de ce qui protège désormais ce parcours (décision 2).
   - **C. Mode d'emploi** (variable d'environnement ou argument manquant) : documenter dans le script et dans la passation, ou lui donner une valeur par défaut sûre.
   - **D. Fragile** (dépend d'un réglage de la base de test ou d'un ordre d'exécution) : rendre déterministe sur copie jetable.
   - **E. Vrai défaut du produit** : **je m'arrête, je te le montre, je ne le corrige pas dans P1** (voir point 2 ci-dessous).
3. **Jamais** détendre une attente pour « passer au vert » : une recette ne devient verte que parce que l'attente est juste, ou disparaît parce que le parcours n'existe plus.
4. À la fin : tableau « script, avant, après, catégorie » dans le journal, et `FINITIONS.md` mis à jour (chaque entrée en « fait dans P1 », « retirée dans P1 » ou « ouverte : défaut produit »).

## Périmètre et garde-fous

- **Touche** : `scripts/`, `scripts/fixtures/`, la documentation (`docs/ux-v2/*` seulement pour corriger une référence cassée), `FINITIONS.md`, `PROJECT_STATUS.md`, le fichier de reprise.
- **Ne touche pas** : `src/` (sauf un point E que tu aurais autorisé), les données, la préproduction de test (aucune écriture, recettes sur copie jetable), l'acompte par défaut.
- Aucun commit tant que tu n'as pas vu le journal et validé la liste des retraits (pas de captures : aucun écran ne change).

## Approches

- **A (recommandée) : diagnostic d'abord pour tous, puis traitement par catégorie.** Je relance les quinze scripts sur le dernier commit, tu vois le tableau des causes **avant** que je réécrive ou retire quoi que ce soit.
- **B : traiter chaque entrée de bout en bout, l'une après l'autre.** Pas de tableau d'ensemble, on découvre les retraits au fil de l'eau.
- **C : réécrire tout, ne rien retirer.** Couverture maximale, mais long et contraire à ta décision 2.

## Points à trancher

1. **Approche A** : OK ?
2. **Un défaut produit trouvé (catégorie E)** : je te le montre et je **ne corrige pas** dans P1 (il rejoint P3 ou P4 selon l'écran, ou devient un lot dédié), OK ? Sinon tu autorises la correction d'un défaut visible et petit dans P1.
3. **Retrait d'un scénario** : je te donne la liste des retraits avec ce qui protège le parcours à la place, et **tu valides la liste avant** que j'efface, OK ? Ou je retire sans te redemander ce qui vise un composant disparu (décision 2).

## Ce que je n'ai pas pu voir

La cause réelle de chacun des échecs (aucun relancé), le contenu des fixtures `flow` et `tabs`, et si l'un des scripts protège un parcours qu'aucun autre ne regarde.

## Preuves prévues

`npm run typecheck` ; suite complète (305 fichiers, 2 471 tests aujourd'hui, ne doit pas baisser sauf retrait d'un test justifié) ; les quatre scripts natifs sans option (typographie 72, états 18/18, garde Abby 25, interface réelle 857) ; chaque recette touchée verte ou retirée dans le journal ; budget des petits textes (625) et `!important` inchangés ; fins de ligne par `eol-report.cjs`. **La revue finale est un autocontrôle, pas un relecteur indépendant.**

## Révisions

(aucune pour l'instant)

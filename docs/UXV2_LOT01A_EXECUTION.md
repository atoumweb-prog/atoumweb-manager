# UX/UI V2 — Lot 01A : premier incrément E01 (Compact 14 px)

**Référentiel de décision :** PR [#82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82), `docs/ux-v2/DECISIONS.md` (UX2-VIS-001/003), `LOT-01A-TOKENS-VISUELS.md` (E01, R01A-01/02/07) et `LOT-01-MATRICE-EXISTANT-CIBLE.md` (L01A-02). On **exécute ces décisions**, sans réexaminer la feuille de route ni changer les règles métier.

**Base de code :** `main@07dde9c85dab337ee0ed3a5a92034a139d7ebad2`, #81 + #85 intégrées. Branche de réalisation séparée `feature/ux-v2-lot01a-typography-v1`.

## Ce qui est codé (périmètre strict de E01)

| Valeur | Avant | Maintenant | Fichier |
|---|---|---|---|
| `--ui-font-base` Compact | **15 px** | **14 px** | `src/renderer/display-density.css` |
| `--ui-font-base` Confort | **16 px** | **16 px**, inchangé | idem |
| `--ui-font-base` Confort+ | **18 px** | **18 px**, inchangé | idem |
| `--aw-font-body` | `max(15px, var(--ui-font-base))` | `max(14px, var(--ui-font-base))` | `src/renderer/ui-typography-consistency.css` |
| `--ui-font-secondary` Compact / Confort / Confort+ | 14 / 15 / 16 px | inchangé | `display-density.css` |
| `--ui-font-small` | 14 px | inchangé | idem |
| `--ui-control-height` | 36 / 42 / 48 px | inchangé | idem |
| `--ui-panel-pad` | 16 / 22 / 26 px | inchangé | idem |
| `--ui-gap` | 8 / 12 / 16 px | inchangé | idem |

Le second changement est **nécessaire** pour que les conteneurs soumis à `--aw-font-body` ne rétablissent pas automatiquement 15 px en Compact. Il préserve l'interdiction d'un texte fonctionnel inférieur à 14 px.

**Non modifiés :** les trois thèmes et accents actuels, la palette métier rouge/jaune/bleu/vert, les composants React, la navigation, les éditeurs contractuels, CGV, Devis, les services IPC/SQLite, les migrations, la sauvegarde/restauration, les données et les workflows. Aucun nouveau logo ni asset graphique.

## Recette dédiée, sans données réelles

`scripts/check-ux-v2-lot01a-typography.cjs` :

- Crée une page HTML isolée et temporaire en respectant **l'ordre effectif des imports CSS** de `src/renderer/main.tsx`. Aucun `main.ts`, bootstrap, IPC, fichier contractuel ou workspace n'est chargé.
- Vérifie via le vrai moteur CSS Chromium/Electron les neuf combinaisons **AtoumWeb / Noir / Blanc × Compact / Confort / Confort+**.
- Mesure huit tailles calculées (`body`, Prospect, Opérations, Projets, Catalogue, Devis, Temps, Bibliothèque) par combinaison, les tokens de hauteur de contrôle et le contraste du texte principal sur son arrière-plan, avec seuil WCAG 4,5:1.
- Si la chaîne d'import CSS change, refuse la recette plutôt que de simuler une nouvelle priorité de cascade.
- Utilise uniquement `%TEMP%` / répertoire temporaire OS, avec nettoyage contrôlé et sans lancement du Manager installé.

### Commandes de recette sous Windows

Exécuter depuis un **clone de développement isolé**, sans dossier Validation-MSI :

```powershell
git fetch origin
git switch --detach origin/feature/ux-v2-lot01a-typography-v1
node --check scripts/check-ux-v2-lot01a-typography.cjs
node scripts/check-ux-v2-lot01a-typography.cjs
```

**Validation Windows native du 10/10/2026 — acquise sur le SHA `466b8e45a05c0122297dcbd5eec1f7f6d6deb602`.** Exécution effective de `node scripts/check-ux-v2-lot01a-typography.cjs` dans le clone indépendant `atoumweb-manager-ux01-validation` :

- Les **31 CSS réels** du renderer ont été chargés dans leur ordre de `main.tsx`.
- **9/9 combinaisons PASS** : AtoumWeb / Noir / Blanc × Compact / Confort / Confort+.
- **72/72** tailles calculées des conteneurs représentatifs, **9/9** hauteurs de contrôle et **9/9** contrastes de texte principal.
- Pour les trois thèmes, **Compact 14 px**, **Confort 16 px**, **Confort+ 18 px**.
- Contraste calculé du corps : **AtoumWeb 14,67:1**, **Noir 17,16:1**, **Blanc 13,89:1** (les valeurs sont indépendantes de la densité).
- Sortie finale : `PASS 3 themes × 3 densities; 72 computed font checks; 9 control heights; 9 body contrasts.` puis **`Fixture cleaned: true`**.
- **Limite :** page Chromium synthétique et styles effectivement calculés, pas de capture humaine des **17 écrans réels**, ni preuve d'ergonomie complète / persistance des réglages au redémarrage, ni des contrastes des états alertes/focus. Les huit critères R01A ne sont **pas** tous clôturés par ce test.

### Inventaire des tokens et styles — terminé pour les imports directs de `main.tsx`

L'inventaire source des **31 feuilles CSS** et de leurs variables déclarées/consommées est versionné dans [`UXV2_LOT01A_TOKENS_INVENTORY.md`](UXV2_LOT01A_TOKENS_INVENTORY.md). Il fournit les **14 rôles généraux par thème**, les **8 variables par densité**, les trois variables de compatibilité `--aw-font-*`, les propriétés contextuelles des modules, l'ordre de cascade et les feuilles riches en `!important`.

**Décision conservatrice du référentiel :** les noms existants couvrent déjà les rôles de base ; aucune nouvelle palette ou migration des 31 CSS n'est engagée sans preuve d'un besoin. Les occurrences `var(--...)` hors noyau ne sont pas déclarées erronées sans analyse du sélecteur et du fallback.

**Nature de la preuve :** lecture directe des sources de la branche après E01, pas encore un audit visuel exhaustif des 17 écrans. Les validations natives 9/9 / 72/72 / 9/9 / 9/9 restent celles du SHA `466b8e45` ; les commits documentaires ultérieurs ne touchent pas le code exécuté.

### Nouvelle recette des écrans React réels — validée sur Windows

Ajout de `scripts/check-ux-v2-lot01a-real-ui.cjs` sur la PR #86. À la différence de la première recette CSS synthétique (9/9), celle-ci charge **le véritable `src/renderer/main.tsx`**, le preload Electron et les IPC métier sur un **workspace SQLite TEMP créé exprès**. Elle n'ouvre jamais l'exécutable installé, le workspace courant ou Validation-MSI.

- **17 destinations réelles** du menu ouvertes au moins une fois, sous AtoumWeb/Confort initial, sans créer de dossier métier.
- **6 écrans réels** (Accueil, Prospection, Devis, Projets, Interventions & Maintenance, Réglages) contrôlés dans **3 thèmes × 3 densités**, soit **54 visites** représentatives.
- Sur Réglages, les contrôles React de thème et de densité utilisent **les vrais IPC**, et on vérifie la sauvegarde de la préférence et les valeurs CSS calculées (14/16/18 px et 36/42/48 px).
- **5 visites supplémentaires en fenêtre 1024 × 720**, puis rechargement du renderer et contrôle de restauration des préférences.
- À chaque visite : rendu sans écran d'erreur fatal, menu/entête, accès recherche/chrono, bascule thème/densité, présence d'une zone de contenu. Les débordements éventuels du conteneur sont **signalés comme candidats à examiner** et ne sont pas masqués.
- Option `--captures <CHEMIN_ABSOLU_NOUVEAU>` pour exporter **54 captures** dans un dossier neuf, **hors Validation-MSI**. Cette option est désactivée par défaut, sans chemin de sortie implicite.

**Validation Windows native du 10/10/2026 — réussie sur le SHA `347117477ea3db6c34a67a99433e4d43d0de7650`.** Exécution par AtoumWeb dans le clone de validation `atoumweb-manager-ux01-validation`, avec `node --check` et `node scripts/check-ux-v2-lot01a-real-ui.cjs` :

- **261/261 contrôles réussis, 0 échec**.
- **17/17** destinations du vrai menu React/IPC ouvertes et vérifiées.
- **9/9** combinaisons AtoumWeb / Noir / Blanc × Compact / Confort / Confort+ validées sur **6 écrans réels** chacune, soit **54 visites représentatives**.
- **5 visites en fenêtre 1024 × 720**, **76 visites au total**.
- Tailles calculées confirmées : **14/16/18 px** et hauteurs de contrôles **36/42/48 px** ; préférences enregistrées par IPC et retrouvées après rechargement.
- Bilan exact : `{"passed":261,"failed":0,"realPages":17,"sampleVisits":54,"narrowVisits":5,"visits":76,"overflowCandidates":[],"consoleErrors":[],"onlyTemp":true}`.
- Sortie de sécurité : **`Fixture cleaned: true`** ; base SQLite et profil de test uniquement dans `%TEMP%`.

**Portée :** recette native Electron/React fonctionnelle sur de vrais écrans et services, et **aucun candidat de débordement du conteneur ni erreur de console détecté**. Ne pas confondre cela avec une validation visuelle humaine exhaustive, ni avec une preuve de contraste de tous les messages d'alerte/focus, d'accès clavier, du zoom et de l'aide `?`.

Commande de recette depuis le worktree indépendant et propre :

```powershell
cd "C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ux01-validation"
if (git status --porcelain) { throw "Modifications locales présentes : arrêt par sécurité." }
git fetch origin
git switch --detach origin/feature/ux-v2-lot01a-typography-v1
node --check scripts/check-ux-v2-lot01a-real-ui.cjs
node scripts/check-ux-v2-lot01a-real-ui.cjs
```

Le banc d'essai crée et supprime uniquement ses propres répertoires dans `%TEMP%`. Les **textes contractuels** ne sont ni modifiés ni validés pendant le parcours en lecture seule.

### Extension R01A-03, R01A-05 et R01A-08 — validation native Windows 300/300

Une nouvelle révision **`4579143aa4a8beb645afe33a0ce62d2e6dfecb53`** du **même** banc d'essai `check-ux-v2-lot01a-real-ui.cjs` ajoute, après le parcours déjà validé :

- Une **vraie touche Tab envoyée par Electron** à deux boutons de vérification temporaires dans Réglages ; attente du focus sur le second et d'un anneau `:focus-visible` d'au moins **2 px**.
- Activation/désactivation **réelle** du réglage « Conseils au survol » par sa case à cocher React, avec enregistrement par IPC ; vérification qu'un élément témoin `.field-help` est masqué puis réaffiché par la CSS existante. Le témoin est supprimé ensuite.
- Fenêtre **1024 × 720**, zooms Electron **125 % et 150 %**, cinq écrans réels visités à chaque zoom (10 visites supplémentaires), puis retour au zoom normal.
- **Validation Windows du 10/10/2026 confirmée sur le SHA `1c8c526735c942edd08fdd661d0b48eb56a47ecd`** par exécution de `node --check scripts/check-ux-v2-lot01a-real-ui.cjs` puis `node scripts/check-ux-v2-lot01a-real-ui.cjs` dans `atoumweb-manager-ux01-validation`. Bilan exact : **`{"passed":300,"failed":0,"realPages":17,"sampleVisits":54,"narrowVisits":5,"zoomVisits":10,"visits":86,"overflowCandidates":[],"consoleErrors":[],"onlyTemp":true}`**, puis **`Fixture cleaned: true`**. Focus mesuré : `{"last":"Focus TEST 1","isVisible":true,"style":"solid","width":"2px"}`. Les 9 combinaisons thème/densité et les 10 visites supplémentaires sous zoom 125 %/150 % ont réussi. La désactivation/réactivation de l'aide contextuelle et sa persistance IPC sont comprises dans les 300 contrôles.
- **Portée précise** : `:focus-visible` a été vérifié sur une paire de boutons temporaires de la vraie interface, et le réglage d'aide sur un témoin CSS temporaire. Cela ne certifie pas le parcours clavier intégral ni les vrais libellés `?` dans chaque module. La recette relève les débordements du conteneur, pas tous les débordements internes ou pertes d'actions visibles. L'absence de captures et de jugement visuel humain subsiste.

Aucun `src/` supplémentaire, module métier, écran React ni CGV n'est modifié ; uniquement le script de recette et la présente documentation.

### R01A-07 — diagnostic des contrastes d'état, à exécuter

Nouveau script `scripts/check-ux-v2-lot01a-states.cjs` (après la validation **300/300**) : fenêtre Chromium/Electron TEMP, **31 vraies feuilles CSS** directement importées par `main.tsx`, **trois thèmes** et **six classes réelles d'état** (`success-badge`, `notice`, `priority-high`, `priority-urgent`, `alert-critical`, `alert-warning`). Calcule les couleurs effectivement rendues et leur rapport de contraste de texte sur le fond (composantes alpha superposées), avec seuil de contrôle de **4,5:1**.

**Premier diagnostic Windows exécuté le 10/10/2026 sur `05a89e76bc62f098fb0b298026068567cbc51dff` : 14/18 PASS, 4 états sous 4,5:1 (script code 1 attendu).** Détail mesuré :

| Thème | Élément | Contraste avant | Correctif ciblé dans `ui-consistency-v2.css` |
|---|---|---:|---|
| AtoumWeb | `.success-badge` | **4,39:1** | Texte uniquement : `color-mix(in srgb, var(--success) 88%, #000)` |
| Blanc | `.success-badge` | **4,41:1** | Même assombrissement localisé du texte, token `--success` conservé |
| Noir | `.priority-high` | **2,71:1** | Texte : `var(--aw-status-yellow-fg)`, rôle sombre existant |
| Noir | `.priority-urgent` | **2,33:1** | Texte : `var(--aw-status-red-fg)`, rôle sombre existant |

**Nouvelle recette Windows effective du 10/10/2026 — HEAD testé `8f0ce32d1658831c0828263bd0ec01affa61c9cb` : 18/18 contrastes PASS**, 0 `issues`, `cssChain:31`, `onlyTemp:true`, `Fixture cleaned: true`.

Les quatre états précédemment sous le seuil mesurent maintenant :

| Thème | Élément | Avant | Après | Verdict |
|---|---|---:|---:|---|
| AtoumWeb | `.success-badge` | 4,39:1 | **5,36:1** | PASS |
| Blanc | `.success-badge` | 4,41:1 | **5,39:1** | PASS |
| Noir | `.priority-high` | 2,71:1 | **9,73:1** | PASS |
| Noir | `.priority-urgent` | 2,33:1 | **8,95:1** | PASS |

Les **14 autres états mesurés passent toujours** et ne sont pas modifiés. Les fonds, couleurs métier et tokens globaux sont inchangés. La mesure porte sur **six classes d'état × trois thèmes**, pas tous les contrastes imaginables dans chaque module.

**Recette React/IPC de non-régression immédiatement rejouée sur le même SHA `8f0ce32d`** : **300/300 PASS**, **17/17** destinations, **9/9** combinaisons, **86 visites réelles** (54 échantillonnées, 5 fenêtre réduite, 10 zoom), focus clavier `2px solid`, aide contextuelle et préférences persistées ; `overflowCandidates:[]`, `consoleErrors:[]`, `onlyTemp:true` et `Fixture cleaned: true`.

Le correctif de contraste est donc **validé sur Windows en rendu CSS et en parcours React réel**. Ce n'est pas une recette visuelle humaine exhaustive ni une exécution des tests unitaires complets R01A-06.

**Correctif code** : `3a75266ba53d888f660b209ad281ae1fd9e8896c`. Test Windows réussi sur `8f0ce32d` : `node scripts/check-ux-v2-lot01a-states.cjs` avec **18/18 PASS**. Le premier échec était un **échec voulu de la barrière d'accessibilité**, et `Fixture cleaned: true` confirme que le répertoire temporaire a été supprimé.

Commande dans le même clone de validation indépendant :

```powershell
git fetch origin
git switch --detach origin/feature/ux-v2-lot01a-typography-v1
node --check scripts/check-ux-v2-lot01a-states.cjs
node scripts/check-ux-v2-lot01a-states.cjs
```

Sont encore nécessaires avant la clôture complète de 01A : appréciation visuelle de captures comparatives (trois thèmes × trois densités) des écrans représentatifs, contrôle des états réels/focus et des zones de défilement, ainsi que **R01A-06** (tests de régression pertinents, dont CI au bon SHA). Aucun changement d'accent métier ni de CSS global n'est proposé sur la seule base du diagnostic préparé.

### Portes de recette R01A — état probant au 10/10/2026

| Critère du référentiel #82 | État actuel | Preuve disponible / limite exacte |
|---|---|---|
| **R01A-01 — Trois thèmes** | **Automatisé, revue visuelle restante** | 9 configurations React, 3 thèmes et contrastes représentatifs. Aucune comparaison de captures réelles revue humainement. |
| **R01A-02 — Trois densités et préférence** | **Automatisé** | 14/16/18 px, contrôles 36/42/48 px ; IPC réel, sauvegarde et rechargement du renderer. Un arrêt/redémarrage complet du binaire installé n'a pas été réalisé. |
| **R01A-03 — 17 entrées et focus** | **Partiellement automatisé** | 17 destinations ouvrent, vraie touche Tab et anneau `:focus-visible` 2 px sur deux boutons témoins. Toutes les actions par clavier ne sont pas certifiées. |
| **R01A-04 — Fiches Prospect, Devis, Projet, Intervention** | **Partiellement automatisé** | Six pages et 9 variantes montées sur SQLite TEMP vide. Les fiches détaillées et les actions de données spécifiques ne sont pas toutes ouvertes ni évaluées au pixel près. |
| **R01A-05 — Petite fenêtre, zoom, scroll** | **Partiellement automatisé** | 1024 × 720, zoom 125/150 %, 10 visites zoom ; `overflowCandidates:[]` concerne le conteneur principal et n'exclut pas les masquages internes. |
| **R01A-06 — Non-régression** | **Typecheck et suite complète locale Windows validés** | `npm test -- --maxWorkers=2` : **87/87 fichiers, 801/801 tests**, 102,58 s ; **35/35 restaurations SQLite**. `npm run typecheck` : **PASS** confirmé séparément sur `2953001` (`tsc --noEmit`, code retour zéro). La CI GitHub sur le SHA de #86 reste non exécutée. |
| **R01A-07 — États et focus** | **Partiellement automatisé, états mesurés PASS** | 6 classes d'état × 3 thèmes = **18/18 à ≥4,5:1**, focus 2 px. D'autres états/icônes et lisibilité humaine peuvent encore exister. |
| **R01A-08 — Chrono, aide, icônes** | **Partiellement automatisé** | Chrono/recherche présents sur 86 visites, aide `?` témoin masquée/réaffichée via réglage IPC. Tous les vrais contrôles d'aide/icônes et le démarrage/arrêt chrono ne sont pas couverts. |

**Décision de recette :** Correctifs CSS **validés en automatique Windows** sur `8f0ce32d` ; **sous-lot 01A non encore clos**. Le référentiel réclame des captures comparatives, les contrôles visuels/comportementaux manquants et R01A-06 avant l'autorisation de fusion puis le démarrage de 01B.

### Commandes R01A-06 et captures comparatives (à exécuter sur worktree indépendant)

```powershell
# Depuis le worktree atoumweb-manager-ux01-validation, propre et détaché
npm run typecheck
npm test -- --maxWorkers=2

# Pour revue humaine, dossier de sortie qui n'existe PAS encore :
# node scripts/check-ux-v2-lot01a-real-ui.cjs --captures "C:\DEV\01_PROJETS\AtoumWeb\uxv2-01a-captures-10oct"
```

L'option `--captures` exporte **54 vues** pour comparaison, sans publier de fichiers utilisateur sur GitHub. Les captures ne doivent pas contenir de données métier réelles : le script travaille uniquement sur la fixture TEMP. Une erreur de test doit rester visible et ne peut pas être requalifiée comme succès. Un CI GitHub Windows final sur le HEAD courant, si nécessaire, doit être autorisé et tracé avant fusion.

### R01A-06 — suite complète Windows exécutée, preuve apportée par le rapport AtoumWeb

Résultat fourni le 10/10/2026 sous forme de journal Vitest du worktree `C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ux01-validation`. Le journal contient `RUN v3.2.7`, runtime **Electron 44.3.0 / Node 24.20.0**, et :

- **`Test Files 87 passed (87)` ; `Tests 801 passed (801)`**.
- **Durée : 102,58 secondes**.
- **`src/main/restore.test.ts` : 35 tests passés, 66 256 ms** ; « refuse A vers B avant toute copie et ne restaure pas A au démarrage suivant » **PASS, 4 137 ms**. L'échec de timeout du CI post-fusion #85 n'est donc pas reproduit **dans cette exécution locale**, sans prouver qu'il ne se reproduira jamais dans la CI.
- Contrats / CGV : les suites `ContractLibraryImportService.test.ts` (19), `QuoteContractPreparationService.test.ts` (39), `ContractTypeService.test.ts` (17) et `ContractTermsService.test.ts` (15) sont **vertes** ; ceci ne constitue **pas** une validation juridique des textes.
- Le message « The CJS build of Vite's Node API is deprecated » est un **avertissement non bloquant**, pas un échec de test.
- Le journal ne contient **pas la sortie de `npm run typecheck`**, ni un nouvel identifiant de commit. La dernière référence de branche contrôlée avant le rapport était `66f1cc46d14d6a60dd0ab600a4eb9c75932ac92b` (commits postérieurs à `8f0ce32d` documentaires uniquement). Le fichier de tests n'atteste pas **à lui seul** le SHA exact exécuté. Ne pas mentionner une CI GitHub verte pour #86.

**État R01A-06** : suite de tests complète locale **VALIDÉE (801/801)** et contrôle TypeScript **VALIDÉ séparément** dans le nouveau journal PowerShell sur `2953001` : `npm run typecheck` → `tsc --noEmit` → contrôle `$LASTEXITCODE -ne 0` sans erreur → message **`TYPECHECK OK — LOT 01A`**. Le journal atteste explicitement le SHA `29530015ba4443136f2560a29b4ade17e149c0b9` et le statut du worktree propre avant `git fetch` / `git switch --detach`. Recette UI native précédente **300/300** et contrastes **18/18** acquis sur `8f0ce32d`. Il reste les captures / la revue visuelle comparative exigées par le référentiel, puis la décision de validation humaine et les contrôles de publication appropriés. Aucune commande supplémentaire sur des données métier réelles n'est nécessaire.

### Vérifications humaines et suite de 01A

Après le test calculé, examiner la lisibilité et les débordements sur Accueil, Prospection, Devis, Projet, Interventions et Réglages, avec les **trois thèmes et trois densités** ; puis le focus/clavier/zoom, le chrono et l'aide `?`. Les adaptations de couleurs/tokens sémantiques et le catalogue complet des variables restent du travail **01A** à produire par incréments conformes au référentiel, pas de nouveaux lots.

**Incident CI préexistant, suivi séparément :** le run post-fusion #85 sur `main@07dde9c8`, [#38006715403](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38006715403), a échoué avec **800/801 tests**, le test `src/main/restore.test.ts` « refuse A vers B… » dépassant le délai de 20 s, malgré une CI pré-fusion réussie à **801/801** [#38006158408](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38006158408). Aucun changement de restauration/test timeout n'est inclus dans 01A. Ne pas masquer cet échec ni l'attribuer aux CSS.

**Garde de fusion :** 01A reste non fusionné jusqu'à une recette réelle, des contrôles ciblés et une validation de l'impact visuel ; aucun feu vert implicite pour les autres lots.

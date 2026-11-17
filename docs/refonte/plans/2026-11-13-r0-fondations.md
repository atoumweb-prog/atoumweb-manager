# R0 Fondations Implementation Plan

> **Révision du 13/11/2026 (décision de Carlos)** : Inter embarquée est **abandonnée** (troncatures causées par sa largeur, environ 10 % de plus que Segoe UI ; aucun gain sur un poste unique). R0 devient : tokens sémantiques + correction de `--danger` + **police explicite : `"Segoe UI"` en tête de la pile de `styles.css`**, sans fichier embarqué. **La tâche 2 (Inter embarquée) est abandonnée et remplacée par la mise en pile explicite de `"Segoe UI"` (test `src/renderer/fontStack.test.ts`).** Les parties de ce document qui décrivent Inter (fichiers, licence, `fonts.css`, chargeurs `.woff2`, second changement visible) sont **caduques** ; elles sont conservées pour l'historique. Une police de marque pourra être étudiée plus tard avec un audit des largeurs.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Définir des tokens de couleur sémantiques (succès, alerte, danger, info, accent) pour les trois thèmes, corriger `--danger`, et embarquer la police Inter, sans modifier aucun écran existant.

**Architecture:** Deux nouvelles feuilles CSS (`tokens.css`, `fonts.css`) importées en tête de `main.tsx`, une police variable copiée dans `src/renderer/fonts/`, et des tests vitest (environnement node) qui lisent les fichiers CSS pour vérifier valeurs, contrastes WCAG et présence des fichiers. Rien de l'existant n'est réécrit.

**Tech Stack:** CSS, React/Vite (renderer Electron), vitest 3.2.7 (`include: src/**/*.test.ts`, environnement node), TypeScript.

**Spec:** `docs/refonte/plans/2026-11-13-r0-fondations-design.md` (valeurs exactes des tokens dans son tableau). Référence produit : `docs/refonte/DESIGN.md`.

## Global Constraints

- Aucune dépendance npm ajoutée (`package.json` et `package-lock.json` inchangés).
- Aucun `!important` ajouté. Aucun CSS existant modifié, sauf l'ajout de deux `import` dans `src/renderer/main.tsx`.
- `--accent`, `--success`, `--aw-status-*` et tous les écrans existants restent inchangés.
- Noms de variables : `--aw-{role}-{solid|on-solid|soft-bg|soft-fg}`, rôles `success`, `warning`, `danger`, `info`, `accent` (« alerte » = `warning`). Valeurs en hexadécimal fixe, pas de `color-mix`.
- Sélecteurs de thème identiques à `styles.css` : `:root, :root[data-theme='atoumweb']`, `:root[data-theme='noir']`, `:root[data-theme='blanc']`. Aucun sélecteur de densité.
- Accent Noir = `#ffda00` ; AtoumWeb = `#b9965c` ; Blanc = `#92733f`.
- Police : Inter 4.1 (rsms/inter, release `v4.1`), licence SIL OFL 1.1. Copier le texte de licence et le copyright avec la police.
- **Aucun commit avant que Carlos ait vu les captures et le résultat des tests** (décision du 13/11/2026, prime sur les étapes « Commit » des tâches) ; pas de push sans accord. Vérification dans l'application réelle : seulement avec l'accord de Carlos, une fois par session, sans port de débogage.
- Texte français pour tout ce qui est lisible par Carlos (commentaires de fichiers de provenance, documentation).

## Review Focus

1. Aucun attribut `data-theme` (premier lancement) : les tokens doivent exister via `:root` (thème AtoumWeb). Test : `:root` seul définit les 20 variables.
2. Poids intermédiaires 650 et 750 déjà utilisés dans les CSS : la déclaration `@font-face` doit couvrir 100 à 900. Test dédié.
3. Fichier de police absent ou illisible : la pile de secours de `styles.css` doit rester intacte. Test : `styles.css` contient toujours `ui-sans-serif, system-ui` après `Inter`.
4. Les 3 emplacements de `--danger` sans valeur de secours et les 4 avec : le rouge doit venir du thème pour les trois thèmes. Test : `--danger` défini et égal à `var(--aw-danger-solid)` dans chaque thème.
5. Les tokens ne doivent pas dépendre de la densité ni d'une fonction CSS récente : test qu'aucun sélecteur `data-density` ni `color-mix(` n'apparaît dans `tokens.css`.

---

### Task 1: Tokens sémantiques et correction de `--danger`

**Files:**
- Create: `src/renderer/tokens.css`
- Create: `src/renderer/tokens.test.ts`
- Modify: `src/renderer/main.tsx` (ajouter `import './tokens.css';` avant `import './styles.css';`, ligne 5)
- Modify: `docs/refonte/DESIGN.md` (section 5 : noms et valeurs réels des tokens, coexistence `--accent` / `--aw-accent-*`, exception de contraste Blanc)

**Interfaces:**
- Produces: 20 variables CSS par thème, `--aw-{success|warning|danger|info|accent}-{solid|on-solid|soft-bg|soft-fg}` ; `--danger: var(--aw-danger-solid)` dans chaque thème. Task 2 n'en dépend pas.

- [ ] **Step 1: Écrire le test qui échoue** dans `src/renderer/tokens.test.ts`. Il lit `tokens.css` et `main.tsx` avec `fs`, extrait pour chacun des blocs `:root, :root[data-theme='atoumweb']`, `:root[data-theme='noir']`, `:root[data-theme='blanc']` les déclarations `--nom: valeur;`. Fonction locale `contrast(a: string, b: string): number` (formule WCAG 2.x sur luminance relative). Tests :
  - `defines the 20 semantic tokens in each theme` : pour chaque thème et chaque rôle × variante, la variable existe et vaut un hexadécimal `#rrggbb`.
  - `matches the values pinned in the spec` : table des 60 valeurs du tableau de la spec, comparées exactement.
  - `text pairs reach WCAG AA` : pour chaque thème et rôle, `contrast(on-solid, solid) >= 4.5` et `contrast(soft-fg, soft-bg) >= 4.5`, avec l'unique exception explicite `blanc/accent` (`on-solid` sur `solid`) à `>= 4.4`.
  - `:root alone defines the default (atoumweb) tokens` (Review Focus 1).
  - `--danger resolves to the danger solid token in every theme` (Review Focus 4).
  - `has no density selector and no color-mix` (Review Focus 5).
  - `is imported before styles.css in main.tsx` : l'index de `./tokens.css` précède celui de `./styles.css`.

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `npx vitest run src/renderer/tokens.test.ts`
Expected: FAIL (fichier `tokens.css` introuvable).

- [ ] **Step 3: Créer `src/renderer/tokens.css`** avec les trois blocs de thème et les 60 valeurs du tableau de la spec, plus `--danger: var(--aw-danger-solid);` dans chaque bloc. En-tête de commentaire en français : rôle du fichier, renvoi vers `docs/refonte/DESIGN.md`, rappel que `solid` seul ne suffit pas comme icône ou bordure sur fond clair pour `warning` et pour `accent` AtoumWeb.

- [ ] **Step 4: Ajouter l'import dans `src/renderer/main.tsx`** avant `./styles.css`.

- [ ] **Step 5: Lancer le test, vérifier qu'il passe**

Run: `npx vitest run src/renderer/tokens.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Mettre à jour `docs/refonte/DESIGN.md`** (section 5) avec les noms de variables, le renvoi vers la spec pour les valeurs, la règle de coexistence et l'exception de contraste ; ne rien retirer d'autre.

- [ ] **Step 7: Vérifier le typage et la suite complète**

Run: `npm run typecheck` puis `npm test`
Expected: sans erreur ; aucun test existant en échec (rapporter les résultats réels).

- [ ] **Step 8: Commit** (après accord de Carlos)

```bash
git add src/renderer/tokens.css src/renderer/tokens.test.ts src/renderer/main.tsx docs/refonte/DESIGN.md
git commit -m "feat(r0): tokens sémantiques par thème et définition de --danger"
```

---

### Task 2: Inter embarquée

**Files:**
- Create: `src/renderer/fonts/InterVariable.woff2` (copié de la release officielle)
- Create: `src/renderer/fonts/LICENSE-Inter.txt` (texte OFL 1.1 et copyright « The Inter Project Authors »)
- Create: `src/renderer/fonts/SOURCE.txt` (URL, version `v4.1`, date de copie, SHA-256 du fichier, en français)
- Create: `src/renderer/fonts.css`
- Create: `src/renderer/fonts.test.ts`
- Modify: `src/renderer/main.tsx` (ajouter `import './fonts.css';` juste après `./tokens.css`)
- Modify: `docs/refonte/DESIGN.md` (section 4 : Inter embarquée, plus « non réalisé »)

**Interfaces:**
- Consumes: l'import de `tokens.css` en tête de `main.tsx` (Task 1) pour l'ordre des imports.
- Produces: `@font-face` de famille `Inter` ; la pile `font-family` de `styles.css` l'utilise sans modification.

- [ ] **Step 1: Écrire le test qui échoue** dans `src/renderer/fonts.test.ts`. Tests :
  - `ships the variable font file with its provenance` : `fonts/InterVariable.woff2` existe, taille entre 100 Ko et 1 Mo, commence par la signature `wOF2`, et son SHA-256 (calculé avec `node:crypto`) égale celui noté dans `SOURCE.txt`.
  - `ships the OFL 1.1 text and the copyright` : `LICENSE-Inter.txt` contient `SIL OPEN FONT LICENSE Version 1.1` et `The Inter Project Authors`.
  - `declares one Inter face covering weights 100 to 900` : `fonts.css` contient `font-family: 'Inter'`, `font-weight: 100 900`, `font-display: swap`, un `src` `url('./fonts/InterVariable.woff2') format('woff2')` (Review Focus 2).
  - `keeps the system fallback stack` : `styles.css` contient toujours `Inter, ui-sans-serif, system-ui` (Review Focus 3).
  - `is imported right after tokens.css in main.tsx`.

- [ ] **Step 2: Lancer le test, vérifier qu'il échoue**

Run: `npx vitest run src/renderer/fonts.test.ts`
Expected: FAIL (fichiers absents).

- [ ] **Step 3: Obtenir les fichiers officiels (avec l'accord de Carlos, déjà donné pour la copie)** : télécharger `Inter-4.1.zip` depuis `https://github.com/rsms/inter/releases/tag/v4.1` (≈ 34 Mo) dans un dossier temporaire vide hors du dépôt, lister l'archive, extraire uniquement `InterVariable.woff2` (dossier `web/` de l'archive) et le fichier de licence, calculer le SHA-256, puis copier ces fichiers dans `src/renderer/fonts/`. Ne rien exécuter de l'archive. Écrire `SOURCE.txt` avec l'URL, la version, la date et le SHA-256.

- [ ] **Step 4: Créer `src/renderer/fonts.css`** avec le `@font-face` décrit ci-dessus, et ajouter l'import dans `src/renderer/main.tsx`.

- [ ] **Step 5: Lancer le test, vérifier qu'il passe**

Run: `npx vitest run src/renderer/fonts.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Mettre à jour `docs/refonte/DESIGN.md`** (section 4 : Inter désormais embarquée, fichiers et licence ; garder « non réalisé » uniquement pour ce qui reste).

- [ ] **Step 7: Commit** (après accord de Carlos)

```bash
git add src/renderer/fonts src/renderer/fonts.css src/renderer/fonts.test.ts src/renderer/main.tsx docs/refonte/DESIGN.md
git commit -m "feat(r0): police Inter embarquée (OFL 1.1)"
```

---

### Task 3: Vérification globale et clôture de R0

**Files:**
- Modify: `PROJECT_STATUS.md` (section R0 : réalisé, vérifié, non vérifié, prochaine action)
- Modify: `docs/refonte/DESIGN.md` (section 11 : R0 réalisé)

**Interfaces:**
- Consumes: tokens (Task 1) et police (Task 2).

- [ ] **Step 1: Construire le renderer et vérifier que la police est emportée**

Run: `npx vite build -c vite.renderer.config.ts --outDir <dossier temporaire hors dépôt> --emptyOutDir`
Expected: la sortie contient un fichier `InterVariable-*.woff2` référencé par le CSS compilé ; aucun avertissement de fichier introuvable.

- [ ] **Step 2: Suite de tests complète et typage**

Run: `npm run typecheck` puis `npm test`
Expected: sans erreur ; comparer le nombre de tests à celui d'avant R0 (+12 attendus : 7 + 5).

- [ ] **Step 3: Captures dans l'application réelle (accord de Carlos donné le 13/11/2026, une fois par session, sans port de débogage)** : lancer l'application en mode développement, puis capturer en **Noir/Confort** et en **AtoumWeb/Confort** : Accueil, Prospection (liste), Devis, Catalogue, et l'écran Projet / Sites avec la barrière RGPD « blocked ». Montrer les captures à Carlos. Attendu : aucun changement visible hors rendu d'Inter et rouge des 7 emplacements de `--danger` (`BusinessBackupsPage`, `QuoteOfferOptionsPanel`, `HomeDashboard`, `operations.css` `.required-mark`, `ProjectSitesTab` ×2, `prospect-workflow-v2` `.field-error`). Si un écran ne peut pas être atteint (données absentes), le noter « rendu non vérifié ».

- [ ] **Step 4: Mettre à jour `PROJECT_STATUS.md` et la section 11 de `DESIGN.md`** : ce qui est fait, les résultats réels des commandes, ce qui n'est pas vérifié, prochaine action (R1).

- [ ] **Step 5: Commit** (après accord de Carlos)

```bash
git add PROJECT_STATUS.md docs/refonte/DESIGN.md
git commit -m "docs(r0): clôture de R0, vérifications et état"
```

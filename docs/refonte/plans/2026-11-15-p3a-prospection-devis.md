# P3a Prospection et Devis : plan d'exécution

> **Pour l'exécutant** : skills à citer à chaque étape : `atoumweb-design`, `superpowers:executing-plans`, `superpowers:test-driven-development` (tâches 2 à 8), `superpowers:verification-before-completion` (tâche 9). Les étapes utilisent des cases `- [ ]`.

**Objectif** : corriger F1, F2, F3, F4, F44, F45, F46 et M8 sans toucher aux parcours, aux règles métier ni aux données, avec captures avant / après et recette de Carlos avant tout commit.

**Architecture** : huit petites corrections indépendantes, chacune avec son test d'abord (source, composant ou mesure native) ; `RecordHeader` gagne une propriété `closeAction`, `needsSectionSummary` gagne le cas `services`, un assistant pur décide du focus de la recherche, CSS en jetons uniquement.

**Stack** : TypeScript/React (vitest, `renderToStaticMarkup`), CSS, scripts Node/Electron de `scripts/` et outils de capture hors dépôt `C:\DEV\Livrables\Cadrage-parcours\outils-audit\`.

**Fiche** : `docs/refonte/plans/2026-11-15-p3a-prospection-devis-design.md` (validée le 15/11/2026, cinq décisions).

## Contraintes globales

- **Thème Noir, densité Confort seuls.** Aucun nouveau texte sous 14 px ; jetons `--aw-*`, **aucun `!important` ajouté**, aucune couleur écrite en dur.
- **Ne touche pas** : l'acompte par défaut, toute règle métier, tout parcours ni l'ordre des étapes, les données, la préproduction (aucune écriture), `App.tsx`, les ateliers, `check-ux-v2-03e-directory` (F47 reste à P6), l'Accueil (F43 reste à P4), le plan de projet (P3b).
- Écrire tests et scripts d'édition avec l'outil d'écriture ; fins de ligne contrôlées par `eol-report.cjs` (dépôt en `autocrlf`, ne pas convertir en masse) ; un seul Electron à la fois, en tâche de fond ; scripts natifs de référence sans option ; les captures partent d'une copie jetable de la base fictive, contrôle d'empreinte, sans port de débogage, dossier `apres\` vidé avant chaque recapture.
- Budgets : petits textes ≤ 617, `!important` d'`ui-consistency-v2.css` ≤ 86 (ne peuvent que baisser).
- Pas de tirets longs, tutoiement, jamais le mot interdit. **Pas de commit avant que Carlos ait vu les captures** ; pas de push.

## Review Focus

1. **F2 change l'ordre de tabulation** (Plus avant la croix) et pourrait casser une recette qui clique `[aria-label="Fermer la fiche prospect"]` : attendu, le libellé et la classe `close-detail` restent, les recettes `flow`, `desk`, `pilot`, `tabs` restent vertes.
2. **F1 retire un titre dans la fenêtre « Référence prospect »** qui réutilise `ProspectResearchPanel` sans section : attendu, le titre n'est caché que lorsque `hideTitle` est passé par la section de la fiche ; un test lit les deux emplacements.
3. **F44 supprime un refocus légitime** (Échap dans la recherche doit rendre le focus au champ ou au déclencheur) : attendu, l'assistant ne l'empêche que si le focus est déjà **hors de l'en-tête** (sur la fiche) ; focus dans l'en-tête ou sur `body` : restauré comme avant.
4. **F46 modifie la mise en page à hauteur normale** : attendu, la règle n'existe que dans une requête `max-height` ; les captures à 1510 × 1030 sont identiques avant et après.
5. **F3 : la raison disparaît pour un lecteur d'écran** en changeant de place : attendu, `role="status"` conservé et `aria-describedby` du bouton « Suivant » pointe sur la raison tant que le bouton est bloqué.

---

### Tâche 1 : Baseline et captures « avant »

**Fichiers** : outil de capture hors dépôt `C:\DEV\Livrables\Cadrage-parcours\outils-audit\audit-p3a.cjs` (copie adaptée d'`audit-reglages.cjs`), dossier `C:\DEV\Livrables\Cadrage-parcours\captures-p3a\avant\`.

- [ ] **Étape 1** : `git status` propre hors fiche et plan ; `git log --oneline -1` donne `f037954e` ; empreinte de la préproduction `5da9e5fc…2c43d` ; budgets (617, 86) ; 305 fichiers, 2 471 tests.
- [ ] **Étape 2** : écrire `audit-p3a.cjs` : prospect « TEST — … » en état `qualifying`, captures : fiche prospect (en-tête, onglet Besoins avec la section Qualification ouverte et la section Prestations repliée), onglet Préparer l'échange (Analyse de l'entreprise ouverte), assistant de devis « Pour qui » **sans** choix (raison visible), table de Prospection, puis **fiche à 1280 × 720 zoom 150 %** et table à **1440 × 900 zoom 150 %**. Variable `AUDIT_OUT`. Vérifier `SOURCE_UNCHANGED true`.
- [ ] **Étape 3** : lancer l'outil sur le dernier commit : `AUDIT_OUT=…\captures-p3a\avant` ; relire les images.

### Tâche 2 : F2, « Plus » avant la croix (test d'abord)

**Fichiers** : modifier `src/renderer/ui/nextStepComponents.test.ts` (bloc `RecordHeader`), `src/renderer/ui/RecordHeader.tsx`, `src/renderer/crm/ProspectsPageV2.tsx` (ligne du `RecordHeader`, bouton `close-detail`).

**Interfaces** : produit `RecordHeader({..., closeAction?: ReactNode})`, rendu **après** le menu « Plus ».

- [ ] **Étape 1 (test, il doit échouer)** : dans le bloc `RecordHeader`, test `« place l'action de fermeture après le menu Plus »` : `html(createElement(RecordHeader, {title, moreItems:[…], closeAction: createElement('button', {className:'close-detail'}, 'X')}))` ; assertion `markup.indexOf('aw-more-menu') < markup.indexOf('close-detail')` et que `closeAction` absent ne laisse aucun conteneur vide.
- [ ] **Étape 2** : lancer `node scripts/run-tests.cjs src/renderer/ui/nextStepComponents.test.ts`. Attendu : **échec** (propriété inconnue, bouton absent).
- [ ] **Étape 3** : `RecordHeader` : ajouter la propriété et la rendre après `MoreMenu`. Dans `ProspectsPageV2.tsx`, sortir le `<button className="close-detail" aria-label="Fermer la fiche prospect" …>` de `actions` et le passer en `closeAction`. Mettre à jour `prospectR3Wiring.test.ts` si une assertion lit l'ordre.
- [ ] **Étape 4** : relancer les deux fichiers de test. Attendu : **passent**.

### Tâche 3 : F1, un titre une fois (tests d'abord)

**Fichiers** : modifier `src/renderer/crm/prospectR3Wiring.test.ts`, `src/renderer/crm/ProspectResearchPanel.tsx` (propriété `hideTitle`), `src/renderer/crm/ProspectsPageV2.tsx` (section « Analyse de l'entreprise »), `src/renderer/crm/ProspectQualificationPanelV2.tsx` (étiquette ligne 282).

- [ ] **Étape 1 (tests, ils doivent échouer)** dans `prospectR3Wiring.test.ts` : (a) `ProspectsPageV2.tsx` passe `hideTitle` au panneau `scope="research"` de l'onglet Préparer l'échange ; (b) `ProspectResearchPanel.tsx` ne rend le `<h3>` « Analyse de l'entreprise » que si `!hideTitle` ; (c) `ProspectReferenceWindow.tsx` n'utilise **pas** `hideTitle` ; (d) `ProspectQualificationPanelV2.tsx` ne contient plus `Qualification · ` et contient `Origine · `.
- [ ] **Étape 2** : lancer le fichier. Attendu : **échec** sur (a), (b) et (d).
- [ ] **Étape 3** : implémenter : propriété `hideTitle?: boolean` ; masquer **le `<h3>` et le sur-titre** « Recherche entreprise » quand `hideTitle`, en gardant la phrase d'aide et les boutons ; étiquette `Origine · {ORIGIN_LABELS[origin]}` (le mot « Qualification » est déjà porté par l'en-tête de section).
- [ ] **Étape 4** : relancer. Attendu : **passent**.

### Tâche 4 : F4, résumé de « Prestations et points à confirmer » (test d'abord)

**Fichiers** : modifier `src/shared/prospectNeedsSections.test.ts`, `src/shared/prospectNeedsSections.ts`, `src/renderer/crm/ProspectNeedsPanel.tsx` (fonction `sectionSummary` et l'en-tête `services`).

**Interfaces** : `needsSectionSummary(id, input)` : `input` gagne `openInformationCount?: number`, `blockingInformationCount?: number`, `informationCount?: number`. Cas `services` : `informationCount` absent ou 0 → `'À préciser'` ; tous résolus (`openInformationCount === 0`) → `'Tout est confirmé'` ; sinon `` `${n} point${n>1?'s':''} à confirmer` `` suivi de `` ` · ${m} bloquant${m>1?'s':''}` `` si `m > 0`.

- [ ] **Étape 1 (tests, ils doivent échouer)** : `services` sans données = `'À préciser'` ; 3 points dont 0 ouvert = `'Tout est confirmé'` ; 1 ouvert = `'1 point à confirmer'` ; 2 ouverts dont 1 bloquant = `'2 points à confirmer · 1 bloquant'`.
- [ ] **Étape 2** : lancer le fichier. Attendu : **échec** (la fonction renvoie une chaîne vide).
- [ ] **Étape 3** : implémenter dans `needsSectionSummary` ; dans `ProspectNeedsPanel.tsx`, étendre `sectionSummary` à `'services'` à partir de `informationItems` (ouvert = statut `open` ; bloquant = `isBlocking` et ouvert) et le passer à `<NeedsSectionHeader id="services" … summary={…}>`.
- [ ] **Étape 4** : relancer. Attendu : **passent**.

### Tâche 5 : F3, la raison à gauche de « Suivant » (test d'abord)

**Fichiers** : modifier `src/renderer/commercial/quoteR4Wiring.test.ts`, `src/renderer/commercial/QuoteWizard.tsx` (pied, lignes du `quote-wizard-actions`), `src/renderer/commercial/quote-wizard.css` (règle `.quote-wizard-hint`).

- [ ] **Étape 1 (tests, ils doivent échouer)** : dans `quoteR4Wiring.test.ts` : le pied de l'assistant contient un conteneur `quote-wizard-next` qui regroupe la raison **avant** le bouton « Suivant → » ; le bouton a `aria-describedby` pointant l'identifiant de la raison ; `quote-wizard.css` ne contient plus `margin-left` pour `.quote-wizard-hint` et définit `.quote-wizard-next` en `display: flex` aligné à droite.
- [ ] **Étape 2** : lancer le fichier. Attendu : **échec**.
- [ ] **Étape 3** : `QuoteWizard.tsx` : `<div className="quote-wizard-next">{blockedReason && <span id="quote-wizard-hint" className="quote-wizard-hint" role="status">…</span>}<button … aria-describedby={blockedReason ? 'quote-wizard-hint' : undefined}>Suivant →</button></div>` ; même texte qu'aujourd'hui. CSS : `.quote-wizard-next { display: flex; align-items: center; gap: var(--ui-gap); }` et retirer `margin-left` de la raison. La règle `.quote-wizard-actions { justify-content: space-between }` de `commercial.css` reste.
- [ ] **Étape 4** : relancer. Attendu : **passent**.

### Tâche 6 : F44, le focus va à la fiche (test d'abord)

**Fichiers** : créer `src/renderer/ui/searchFocus.ts` et `src/renderer/ui/searchFocus.test.ts` ; modifier `src/renderer/ui/WorkspaceHeader.tsx` (fonction `closeSearch`, ligne 37).

**Interfaces** : `shouldRestoreSearchFocus(active: Element | null, header: { contains(node: Node): boolean } | null, body: Element | null): boolean` : vrai si `active` est nul ou `body`, ou si l'en-tête contient `active` ; faux si le focus est déjà ailleurs (la fiche).

- [ ] **Étape 1 (test, il doit échouer)** : fichier `searchFocus.test.ts` avec des objets factices : focus nul, `body`, un élément dans l'en-tête → `true` ; un élément hors en-tête (la fiche) → `false`.
- [ ] **Étape 2** : lancer. Attendu : **échec** (module absent).
- [ ] **Étape 3** : implémenter l'assistant ; dans `closeSearch`, la fonction de `requestAnimationFrame` appelle `shouldRestoreSearchFocus(document.activeElement, root.current, document.body)` avant de redonner le focus.
- [ ] **Étape 4** : relancer. Attendu : **passe**. **Preuve native** (en fin de tâche 9) : `check-ux-v2-03e-directory` ne s'arrête plus sur `C08 Home search focuses exact Prospect` (elle s'arrête plus loin sur `.start-qualification-button`, déjà connu en F47).

### Tâche 7 : F45, la table de Prospection à 960 px utiles (mesure, puis correction)

**Fichiers** : à déterminer par la mesure (feuilles `crm/prospect-*.css` ou `ui/data-table*.css`).

- [ ] **Étape 1 (mesure)** : sonde jetable dans `outputs/` (copie du scénario `--ux-lot`) qui liste, à 1440 × 900 zoom 150 %, les éléments dont le bord droit dépasse celui du conteneur `.aw-data-table-scroll` ; noter l'élément fautif et sa règle CSS dans le plan (section « Mesures »).
- [ ] **Étape 2 (test, il doit échouer)** : test de **source** précis sur la règle fautive une fois connue (ex. largeur minimale ou marge) ; la preuve réelle est la recette `--ux-lot`.
- [ ] **Étape 3** : correction minimale de la règle ; relancer `node scripts/check-shell-home-simplification.cjs --ux-lot`. Attendu : **verte**.
- [ ] **Étape 4** : supprimer la sonde (`outputs/`).

### Tâche 8 : F46 et M8 (tests d'abord)

**Fichiers** : modifier `src/renderer/crm/prospectR3Wiring.test.ts`, la feuille de la fiche en superposition (`crm/prospect-workspace-*.css` ou `prospect-detail-v2` : à confirmer en lisant la structure de `.prospect-detail-desk`), `src/renderer/crm/prospect-visual-pilot.css` (ligne 15).

- [ ] **Étape 1 (tests, ils doivent échouer)** : (a) la feuille contient une requête `@media (max-height: 600px)` qui fait défiler **ensemble** l'en-tête, la carte « Prochaine étape » et les étapes avec le contenu, onglets visibles ; (b) cette règle **n'existe qu'à l'intérieur** de la requête `max-height` (aucun changement hors fenêtre basse) ; (c) `prospect-visual-pilot.css` ne contient plus `.aw-data-table th{font-weight:600}`.
- [ ] **Étape 2** : lancer le fichier. Attendu : **échec** sur (a) et (c).
- [ ] **Étape 3** : implémenter : F46 par la requête (le conteneur de contenu cesse d'avoir sa propre zone de défilement, le conteneur de la fiche défile) ; M8 par la suppression de la règle locale.
- [ ] **Étape 4** : relancer les tests puis `node scripts/check-shell-home-simplification.cjs --desk`. Attendu : **verte** (le contrôle « 33 px » devient > 150 px).

### Tâche 9 : vérification complète (verification-before-completion)

- [ ] **Étape 1** : `npm run typecheck` propre ; `node scripts/run-tests.cjs` : noter fichiers et tests (attendu : 305 + 2 fichiers de test nouveaux, tests en hausse seulement, justifiés dans le plan) ; budgets : petits textes ≤ 617 (`gen-font-baseline.cjs`, lire le `git diff`), `!important` ≤ 86.
- [ ] **Étape 2** : un Electron à la fois, en tâche de fond : typographie 72, états 18/18, garde Abby 25, interface réelle 857, `check-ux-v2-lot10-ui` 59 ; recettes de P1 vertes (devis 44, Offres lot 1 32, 02d 56, rail 96, contrats 139, cibles 51, flow 29, pilote 22, tabs 27) ; **`--ux-lot` et `--desk` passent au vert** ; `check-shell-home-simplification` reste rouge sur F43 seulement ; `check-ux-v2-03e-directory` dépasse C08.
- [ ] **Étape 3** : empreinte de la préproduction identique ; aucun résidu dans `outputs/` ; `eol-report.cjs` sur tous les fichiers modifiés.

### Tâche 10 : captures « après » et recette de Carlos

**Fichiers** : dossier `C:\DEV\Livrables\Cadrage-parcours\captures-p3a\apres\`.

- [ ] **Étape 1** : vider `apres\`, lancer `audit-p3a.cjs` sur le code modifié ; relire chaque image et corriger ce qu'elle montre (un défaut trouvé par capture est consigné).
- [ ] **Étape 2** : présenter à Carlos le dossier `avant\` / `apres\` avec la liste de ce qui change (F1, F2, F3, F4, F46, M8 se voient ; F44 et F45 se mesurent) et **attendre son accord**.

### Tâche 11 : documents puis commit

**Fichiers** : `docs/refonte/FINITIONS.md` (F1 à F4, F44, F45, F46 « fait dans P3a », M8 « fait dans P3a », avancement), `PROJECT_STATUS.md`, `docs/refonte/PASSATION-2026-11-15-apres-P3a.md`, mémoire.

- [ ] **Étape 1** : mettre à jour les documents (chiffres réels, ce qui n'a pas été vu, revue finale = autocontrôle).
- [ ] **Étape 2** : après accord de Carlos, **un seul commit local** `feat(p3a): fiche prospect et assistant de devis, finitions F1 F2 F3 F4 F44 F45 F46 M8` terminé par la ligne d'attribution demandée. Pas de push.

## Mesures (à remplir à l'exécution)

Départ : 305 fichiers, 2 471 tests ; budget 617 ; empreinte `5da9e5fc…2c43d`. Élément qui déborde en F45 : à mesurer.

## Couverture de la fiche

| Exigence | Tâche |
|---|---|
| F2 Plus avant la croix | 2 |
| F1 un titre une fois | 3 |
| F4 résumé de section | 4 |
| F3 raison à gauche de Suivant | 5 |
| F44 focus vers la fiche | 6 |
| F45 débordement de la table | 7 |
| F46 option A (tout défile en fenêtre basse), M8 | 8 |
| Preuves, captures avant / après, accord avant commit | 1, 9, 10, 11 |

## Révisions

- **Révision (règle I) sur F4** : la section « Prestations et points à confirmer » ne contient plus de liste de prestations dans la fiche existante (la sélection du catalogue est dans le formulaire de création et l'assistant de devis) ; le résumé porte donc sur les **points à confirmer** et leurs bloquants, pas sur un nombre de prestations. Même périmètre, même intention (un résumé quand la section est repliée).
- **Révision sur F1** : le sur-titre « Qualification · Recommandation » est en réalité « Qualification · *origine du prospect* » ; je le remplace par « Origine · Recommandation » plutôt que de ne garder que « Recommandation » (ambigu).

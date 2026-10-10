# UX/UI V2 — Lot 01B — Exécution incrémentale (E05 aide contextuelle)

**Statut au 10/10/2026 : premier incrément codé sur branche dépendante de 01A, recette Windows encore à exécuter.**  
**Référentiel normatif :** PR #82, `docs/ux-v2/LOT-01B-COMPOSANTS-ELEMENTAIRES.md`, `LOT-01-FONDATIONS.md`, `DECISIONS.md`, décision **UX2-HELP-001 / écart E05**.

**Branche :** `feature/ux-v2-lot01b-components-v1`, créée directement depuis **`feature/ux-v2-lot01a-typography-v1@7f5dbbf2a462f652b32dd2a2c08a8039f516b778`**. Ce chaînage est **volontaire** : 01A reste dans PR #86 en brouillon, 01B ne doit pas être fusionné seul dans `main` ni prétendre que 01A est déjà fusionné.

## 01B.1 — Contrôles existants et correspondance

| Famille / source inspectée | Contrôle / handler conservé | Évolution V2 souhaitée | Risque / preuve |
|---|---|---|---|
| Aide `src/renderer/ui/FieldHelp.tsx`, appelée via `ProspectQualificationPanelV2.tsx` et `ProspectsPageV2.tsx` | `text` court, `span` + `role=note` + `title` + `tabIndex` ; **aucun handler de sauvegarde** | **01B E05 en cours** : bouton `?` accessible et toujours présent, clic/Entrée/Espace, détail explicite, Escape et focus restauré ; survol auto seulement si option active | Ne pas déclencher le champ parent `<label>` ni une soumission en cliquant sur `?`. Test Electron isolé ciblé |
| Style `ui-consistency-v2.css` `.app-shell.help-disabled .field-help` | Ancienne règle `display:none!important` | **01B E05 en cours** : plus de masquage de l'icône ; état automatique lu sur `.app-shell.help-disabled` | Important : l'ancien test 01A reposait sur la disparition de l'icône ; son assertion est adaptée **sur 01B seulement** |
| Réglage `App.tsx` `showHoverHelp` / `updateShowHoverHelp` | Persisté par IPC réel, booléen historique inchangé | Conserver API et valeur ; modifier uniquement sa description pour clarifier que seul l'automatique est désactivé | Pas de migration ni de changement de persistance |
| `OperationIcon.tsx` | SVG décoratif `aria-hidden`; nom d'action porté par le bouton parent | Réutiliser ; catalogue d'icônes pilote à documenter en **01B.3** | Pas d'extension d'enum ou de remplacement métier avant inventaire des commandes |
| Boutons `.primary-button`, `.secondary-button` dans `styles.css` et `ui-consistency-v2.css` | Classes et `onClick` variés selon chaque module | Conventions et composant de présentation futurs en **01B.2** | Ne pas déplacer `onClick` métiers ou transactions lors du premier incrément |
| Messages `App.tsx` `message`, `messageAction`, `.notice` | `role=status`, fermeture, action Explorateur après effet confirmé | Typage et queue éventuels en **01B.5**, après étude des producteurs | Ne pas transformer échec en succès ni perdre action Explorateur |
| Confirmations UX-01, `window.confirm`, Electron dialog | Handlers/sûretés dédiés, garde commune déjà livrée sur la base du lot 01A | Étudier avant un `AppDialog` en **01B.5** | Surtout pas une deuxième garde concurrente ou un remplacement en masse |
| `ProspectsPageV2.tsx` et `QuoteLineEditor.tsx` | Validations formulaire, édition et handlers métiers existants | Échantillons de contrôle 01B.2/01B.5, **pas de migration immédiate** | Ne pas sauver, facturer, convertir ou modifier les CGV par une simple action UI |

Cette matrice couvre les **familles et parcours pilotes inspectés**, pas les **1 921 déclarations JSX** d'audit. Les composants métier non migrés conservent leurs propres mécanismes.

## Premier incrément implémenté — aide `?`

1. `FieldHelp.tsx` garde le **nom d'export existant** et la prop `text`; ajoute une prop optionnelle `detail` sans exiger de modification des appelants.
2. L'ancien `span` non actionnable devient `<button type="button">` avec nom accessible et `aria-expanded` ; clic/Entrée/Espace ouvre un panneau descriptif accessible au clavier.
3. Le panneau n'enregistre **aucune donnée métier**, ne demande aucun IPC, se ferme par Escape (focus rendu au bouton), bouton de fermeture, clic extérieur et survol quitté s'il s'agit d'une ouverture automatique.
4. **Délai automatique de 2,5 secondes** en survol et seulement lorsque `.app-shell.help-disabled` est absent ; passer le réglage à Désactivé ne ferme pas une aide ouverte volontairement.
5. Réutilisation de `--surface`, `--text`, `--border`, `--shadow`, `--accent-strong` et `--ui-font-secondary`; pas de couleur globale nouvelle ni de texte fonctionnel sous 14 px.
6. Le bouton `?` peut être imbriqué dans un `<label>` hérité : l'ouverture/fermeture empêche explicitement le clic d'activer un champ ou de soumettre le formulaire.
7. L'ancienne assertion du banc de recette 01A « aide masquée si désactivée » est changée **uniquement sur la branche 01B** pour vérifier au contraire la permanence de l'icône. Le rapport 01A déjà approuvé conserve sa preuve d'origine.

## Vérifications

Nouveau `scripts/check-ux-v2-lot01b-help.cjs` : **React réel et FieldHelp réel** dans une fenêtre Chromium/Electron isolée, styles chargés d'après les **31 vrais imports CSS** de `main.tsx`; tests thèmes × densités, visibilité de l'icône, réglage `help-disabled`, clic explicite, contenu et `role=dialog`, Escape et retour de focus, absence d'activation du champ parent, survol court/prolongé, suppression automatique après sortie. Fixture éphémère dans `%TEMP%`, sans base ni données utilisateurs.

**Recette Windows du 10/10/2026 — obtenue sur le SHA exact `2ef6e748ea067f8206ecff9081c0702113d7b183`.** Journal PowerShell transmis par AtoumWeb depuis le clone indépendant de validation :

- `git log -1 --oneline` : **`2ef6e74`**, identique au HEAD de la PR #87 avant les commits documentaires ultérieurs.
- `node --check scripts/check-ux-v2-lot01b-help.cjs` : **OK**.
- `node scripts/check-ux-v2-lot01b-help.cjs` : **`{"checks":37,"failed":0,"themeDensityCombinations":9,"explicitHelp":true,"hoverDisabled":true,"delayedHover":true,"escapeAndFocus":true,"onlyTemp":true}`**.
- **9/9 combinaisons** AtoumWeb / Noir / Blanc × Compact / Confort / Confort+ : icône affichée, base 14/16/18 px. Aide désactivée : icône maintenue ; détail volontaire clic et clavier / Échap / focus, non-activation du champ parent ; survol court/prolongé vérifié.
- `Fixture cleaned: true` : **répertoire %TEMP% supprimé**.
- `npm run typecheck` ⇒ `tsc --noEmit` **sans erreur**, code retour PowerShell OK, `PREMIERS CONTROLES 01B OK`.

**Statut E05 : premier incrément validé sur Windows (37/37 + typecheck).** Ce résultat ne prouve **pas encore** la non-régression des 17 modules sur la branche 01B, la suite Vitest complète, ni tous les scénarios R01B-01…12. Les tests 01A antérieurs restent ceux de leur propre SHA et ne doivent pas être crédités à 01B.

Commande à exécuter après checkout de cette branche **dans un clone de test indépendant**, sans toucher au checkout original :

```powershell
cd "C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ux01-validation"
if (git status --porcelain) { throw "Dossier non propre." }
git fetch origin
git switch --detach origin/feature/ux-v2-lot01b-components-v1
node --check scripts/check-ux-v2-lot01b-help.cjs
node scripts/check-ux-v2-lot01b-help.cjs
npm run typecheck
```

Après le test ciblé et le typecheck, resteront : non-régression Electron 01A adaptée, suite de tests complète, 01B.2 boutons/champs, 01B.3 icônes, 01B.5 confirmations/notifications, 01B.6 atelier, puis les **12 scénarios R01B** réellement pertinents. **Ne pas clôturer 01B avec seulement E05.**

## 01B.2 — Pilotage des boutons et champs (codé, **recette non encore exécutée**)

Nouveaux éléments de présentation **non branchés aux parcours métier** :

| Composant | Source | Comportement et contrat | Limites |
|---|---|---|---|
| `AppButton` | `src/renderer/ui/AppButton.tsx` | Variantes `primary / secondary / quiet / danger`, icône + texte ou icône seule avec `aria-label` **obligatoire au type** ; bouton natif `type="button"`, ne soumet jamais implicitement un formulaire ; état `pending` externe, promesse `onAction` verrouillée contre double déclenchement, retour `onActionError`, erreur neutre `role=alert` sur rejet. | Ni enregistrement, ni transaction, ni succès implicite ; dans le pilote uniquement. Son `onAction` ne remplace pas les handlers des formulaires historiques. |
| `AppTextField` | `src/renderer/ui/AppTextField.tsx` | Input natif contrôlé par son propriétaire : label / `htmlFor` / id, description et erreur `aria-describedby`, `aria-invalid`, `required`, aide optionnelle indépendante des valeurs. | Aucune validation métier ni sauvegarde/normalisation de données. |
| Styles pilotes | `src/renderer/ui-consistency-v2.css` | Sélecteurs **`.aw-ui-*` exclusivement**, typographie ≥14px, tailles 36/42/48px selon densité, couleurs issues des trois thèmes, focus clavier et états d'erreur visibles. | Pas de remplacement des anciennes classes et aucune modification des autres modules. |

**Recette autonome préparée** : `scripts/check-ux-v2-lot01b-controls.cjs`, vrai React dans Chromium/Electron avec les 31 CSS du renderer, **SQLite et profil utilisateur non ouverts**, environnement éphémère `%TEMP%` ; 9 variantes thème×densité, taille/texte lisibles, quatre boutons, icon-only nommé, `label/id`, description/erreur liés, double clic asynchrone bloqué, rejet d'opération signalé et nettoyage. **Syntaxe JavaScript vérifiée avant publication ; aucune réussite Windows non observée n'est annoncée.**

### Validation Windows du pilote — à réaliser dans le worktree séparé

```powershell
cd "C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ux01-validation"
if (git status --porcelain) { throw "Dossier de validation non propre." }
git fetch origin
if ($LASTEXITCODE -ne 0) { throw "Fetch échoué" }
git switch --detach origin/feature/ux-v2-lot01b-components-v1
if ($LASTEXITCODE -ne 0) { throw "Switch échoué" }
git log -1 --oneline
node --check scripts/check-ux-v2-lot01b-controls.cjs
if ($LASTEXITCODE -ne 0) { throw "Syntaxe du test invalide" }
node scripts/check-ux-v2-lot01b-controls.cjs
if ($LASTEXITCODE -ne 0) { throw "Recette UI 01B.2 échouée" }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck 01B.2 échoué" }
```

Les composants sont **disponibles pour un atelier**, pas encore migrés sur un module existant. La revue d'accessibilité finale, l'atelier 01B.6 comparatif, la suite complète Vitest et les critères R01B restants demeurent exigibles avant clôture.

## Contrôle Windows reçu après 01B.2 — preuve partielle mais concluante

Le 10/10/2026, un extrait de PowerShell fourni par AtoumWeb se termine par :

- `[UXV2 01B] RESULT {"checks":37,"failed":0,"themeDensityCombinations":9,"explicitHelp":true,"hoverDisabled":true,"delayedHover":true,"escapeAndFocus":true,"onlyTemp":true}` puis `Fixture cleaned: true` : **régression E05 37/37 PASS** ;
- la commande `if ($LASTEXITCODE -ne 0) { throw "Régression aide contextuelle" }` n'a pas déclenché de refus ;
- `npm run typecheck` affiche `tsc --noEmit` et revient sans erreur ; garde `$LASTEXITCODE` non déclenchée : **TypeScript PASS** ;
- `Write-Host "VALIDATION CIBLEE 01B OK"` apparaît : les gardes PowerShell précédentes n'ont pas bloqué le déroulement.

**Limite probante explicite :** cet extrait **ne contient ni le JSON `UXV2 01B CONTROLS`, ni le `git log`**, donc le nombre d'assertions `AppButton/AppTextField` et le SHA exact exécuté **ne peuvent pas être affirmés à partir de cet extrait**. En revanche, si les commandes ont été exécutées intégralement dans l'ordre demandé, la garde après le script boutons/champs implique un code retour zéro. La version GitHub avant cette saisie était `4c3c38205b6c489dcf5c017099be360a5efe16e7`.

**Statut honnête :** aide E05 et TypeScript validés dans la trace disponible ; contrôle boutons/champs **sans arrêt observé mais total non vérifiable**, pas de « 100 % R01B » annoncé. La suite complète Vitest et l'atelier 01B.3+ sont toujours hors champ de cette preuve.

## 01B.3 — Icônes et boutons d'action (pilotage non encore exécuté Windows)

Inventaire réel dans [`UXV2_LOT01B_ICONS_CATALOG.md`](UXV2_LOT01B_ICONS_CATALOG.md) : **36 symboles `OperationIconName`** existants dans `src/renderer/operations/OperationIcon.tsx`. SVG décoratifs `aria-hidden=true`, `focusable=false`, `stroke=currentColor`, taille par défaut 20 px. **Aucun changement de cette source ni nouvelle bibliothèque d'icônes**.

Règles pilotes : `AppButton` icône seule ⇒ `aria-label` obligatoire ; icône + texte ⇒ le texte décrit l'action ; indicateur métier ⇒ symbole et libellé d'état, jamais couleur/picto seul. La commande parent conserve la responsabilité de l'action métier et de sa confirmation.

Nouveau `scripts/check-ux-v2-lot01b-icons.cjs` : galerie des 36 SVG et deux commandes `AppButton` réellement rendues dans React/Chromium avec les **31 CSS du renderer**, **9 combinaisons thème/densité** ; mesure taille 20×20, hauteur 36/42/48, noms accessibles des commandes, activation native par touche Entrée, focus et nettoyage de fixture `%TEMP%`. **Syntaxe JS vérifiée statiquement ; la recette n'a pas encore été lancée sur Windows**.

Commande ciblée (depuis le clone indépendant propre après `git fetch` et `git switch --detach origin/feature/ux-v2-lot01b-components-v1`) :

```powershell
node --check scripts/check-ux-v2-lot01b-icons.cjs
if ($LASTEXITCODE -ne 0) { throw "Syntaxe test icônes invalide." }
node scripts/check-ux-v2-lot01b-icons.cjs
if ($LASTEXITCODE -ne 0) { throw "Recette icônes échouée." }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck 01B échoué." }
```

Les composants du pilote ne sont **pas encore migrés sur les 17 modules** ; le catalogue est une carte de réemploi, pas une application automatisée.

## R01B-02 — incident Windows sur la touche Entrée (10/10/2026)

**Première recette 01B.3 du SHA `3eca47951e2606ae87bf69695937d78e652eaf16` : ÉCHEC**, à conserver dans le bilan (ne pas l'interpréter comme PASS) :

- `node --check scripts/check-ux-v2-lot01b-icons.cjs` : **OK** ;
- **9/9** variantes `atoumweb/noir/blanc × compact/comfort/comfort_plus` : **PASS** du rendu des 36 SVG décoratifs et des noms accessibles vérifiés avant la simulation du clavier ;
- **blocage** `Error: Timeout Keyboard Enter action` dans la recette `check-ux-v2-lot01b-icons.cjs`. `Electron icon gallery recipe failed status 1` ;
- `Fixture cleaned: true` — environnement indépendant bien supprimé ;
- après le `throw "Recette icônes échouée"`, une commande `Write-Host "RECETTE ICONES 01B OK"` lancée séparément a affiché du vert **sans modifier l'échec précédent**. Le message vert ne constitue aucune validation.

**Diagnostic probable, non encore démontré :** la fenêtre Electron du banc était invisible (`show:false`), le bouton DOM recevait `focus()` **avant** `win.webContents.focus()` et l'événement natif Entrée ne provoquait pas l'action observée. Le composant `AppButton` n'est pas encore incriminé par cet échec : une erreur de focus du banc reste possible.

**Correction du seul banc d'essai, sans retrait de l'assertion clavier :** `check-ux-v2-lot01b-icons.cjs` rend maintenant sa fenêtre temporaire visible pour ce test, focalise d'abord fenêtre et webContents, **puis** le bouton réel ; vérifie `document.hasFocus()`, l'élément actif et la réception du **keydown natif Enter**, exige toujours exactement **une action du bon handler**. Un diagnostic `Native keyboard failure probe` affichera `focused/active/nativeKeys/calls/labels` si l'action échoue encore. Le script conserve la fenêtre cachée pendant les 9 variantes puis l'affiche au moment du vrai contrôle clavier. Pas de simulation d'un clic à la place de la touche Entrée, pas de baisse du seuil.

**Statut : correction syntaxiquement vérifiée, nouveau passage Windows À FAIRE.** Ce correctif n'affecte ni `AppButton` ni `OperationIcon`, ni les classes CSS, Devis, contrats/CGV, IPC, SQLite, schéma, base réelle ou `main`. La PR #87 reste draft et dépend de #86.

## Second diagnostic clavier Windows — événement reçu, action absente

**Deuxième recette sur le SHA `c6ab309e9439153c5fd8e9b95bcf6a60060b610e` : ÉCHEC confirmé.** Les 9/9 combinaisons graphiques passent de nouveau, puis le nouveau journal établit :

```text
Native keyboard focus {"focused":true,"active":"icon-action","keys":0}
Native keyboard failure probe {"focused":true,"active":"icon-action","nativeKeys":["Enter"],"calls":0,"labels":[]}
ERROR Error: Timeout Keyboard Enter action
Fixture cleaned: true
```

**Observation** : le focus est **correct** et le `keydown Enter` arrive bien dans le DOM ; la séquence `keyDown → keyUp` de `webContents.sendInputEvent` **ne produit pas le clic** observé par `AppButton`. Le problème n'est donc plus explicable par la seule absence de focus. Il reste à distinguer la traduction des événements clavier d'Electron et la gestion d'un bouton React.

**Nouveau banc comparatif préparé** : dans **la même fenêtre Electron**, rendre un `<button type="button">` HTML témoin et le `AppButton` React ; donner le focus à chacun ; injecter une touche Entrée **uniquement via `webContents.sendInputEvent`**, mesurer les `keydown` reçus et les vrais événements `click` ; en cas de défaut d'activation après `keyDown`, injecter le `char` natif `\r` avant `keyUp`, conformément au modèle d'entrée Electron/Chromium. Réclamer **une seule activation exacte** pour chaque bouton. Le log comporte `afterDown`, `usedChar`, `delivered`, focus, cibles, `isTrusted`, nombre de clics et handlers. Pas de `element.click()` ni de `dispatchEvent(new KeyboardEvent(...))` pour réussir le critère clavier ; l'éventuel clic programmatique séparé du test original reste une vérification distincte du handler.

**Statut : code JavaScript syntaxiquement contrôlé, recette Windows comparative encore à exécuter.** Ni `AppButton.tsx`, ni `OperationIcon.tsx`, ni CSS, métier, SQLite ou migrations modifiés. Si le témoin natif échoue, il faudra revoir l'envoi du clavier par le banc avant d'incriminer l'application. S'il passe mais pas `AppButton`, le composant React devra être inspecté sans contournement artificiel.

## Troisième recette Windows 01B.3 — **42/42 PASS**, cause du test clavier isolée (10/10/2026)

Sur `18040b2920351b1302daa270bf515331480a61f5`, le compte rendu PowerShell montre une exécution du vrai `check-ux-v2-lot01b-icons.cjs` avec le résultat :

- **9/9 configurations PASS**, 36 icônes SVG décoratives, noms accessibles et dimensions testés.
- **Bouton HTML natif témoin** : `afterDown:false`, `usedChar:true`, `delivered:true` ; `nativeKeys:[{"key":"Enter","target":"native-reference","prevented":false,"trusted":true}]`, vrai clic `{"target":"native-reference","trusted":true,"detail":0}`, **`nativeCalls:1`**.
- **Notre `AppButton`** : `afterDown:false`, `usedChar:true`, `delivered:true`, `nativeKeys` contient `Enter` ciblant `icon-action` avec `trusted:true`, vrai clic `{"target":"icon-action","trusted":true,"detail":0}`, **`appCalls:1`** et `labels:["expand"]`.
- **Bilan exact** : `{"checks":42,"failed":0,"icons":36,"combinations":9,"iconSize":20,"decorativeSvg":true,"accessibleAction":true,"keyboardEnter":true,"onlyTemp":true}` ; `Fixture cleaned: true`.
- La **barrière PowerShell finale** n'a pas échoué et a affiché `RECETTE ICONES 01B VALIDEE` **après** la sortie complète avec code retour nul.

**Diagnostic résolu pour la fixture** : sous Electron 44 / Windows, l'injection utilisée nécessitait une **entrée caractère `char('\r')` via `webContents.sendInputEvent`** en plus du `keyDown` natif pour déclencher l'activation du bouton. Le bouton HTML témoin et `AppButton` réagissent **de manière identique**. Les deux échecs précédents restent archivés, mais **ne prouvent pas un dysfonctionnement du composant**.

**Portée de preuve :** critère R01B-02 sur la **touche Entrée des deux boutons pilotes**, pas tous les parcours clavier des 17 écrans. Aucun changement de production n'a été nécessaire ; seul le banc de test a été ajusté. L'archive iconographique ne vaut pas recette WCAG exhaustive ni validation de 01B complet. Les autres vérifications non exécutées (suite entière de tests sur la branche, 01B.5/6, certains cas R01B) restent ouvertes.

## 01B.5 — Notifications et confirmations : inventaire et pilote limité

**Constat sur le code de la branche** : `src/renderer/App.tsx` conserve un seul message global `message` et éventuellement `messageAction`. `showMessage(nextMessage, action?)` maintient l'action uniquement pour le message correspondant ; la classe CSS historique `.notice.is-actionable` porte un bouton `notice-action` contenant le libellé `Ouvrir dans l’Explorateur`, et `notice-close` ferme le message. Certaines pages passent `onMessage={setMessage}`, le volet Projets passe `showMessage`. **Les messages existants n'ont pas encore de niveau `success/info/warning/error` explicite** ; leur texte varie selon les opérations. Toute conversion automatique en « succès » serait injustifiée.

**Protections de sortie :** `src/renderer/unsaved/unsaved.tsx` possède déjà `requestUnsavedExit(...)` relié à `window.atoumweb.unsaved.confirmExit(labels,pending)`, un `UnsavedRegistry` et le suivi `beforeunload`. **Aucune seconde confirmation ni suppression/remplacement de ces protections**. Le statut historique de la PR #83 n'est pas une preuve de fusion ; l'API actuelle, observée dans ce fichier, fait autorité pour 01B.

### Pilote ajouté, non intégré aux écrans métier

- Nouveau `src/renderer/ui/AppNotice.tsx` : quatre niveaux **`info/success/warning/error`** explicitement attribués par le seul appelant ; `error` annoncé en `role=alert`, les autres en `role=status` ; éventuellement **action avec libellé** et **bouton de fermeture** avec `aria-label`.
- Aucun `timer`, aucune queue, ni effectuation de service ou annonce de succès automatique. **Le composant ne reçoit aucune identité de sauvegarde ni commande métier par défaut**. Un échec du service ne peut devenir « succès » que par une mauvaise classification volontaire du parent, qui reste hors responsabilité de la présentation.
- CSS `.aw-ui-notice*` scoped dans `ui-consistency-v2.css` : trois thèmes, trois densités, couleurs existantes et bordure sémantique. La CSS historique `.notice` et le JSX du bandeau global ne sont pas modifiés.
- Banc d'essai `scripts/check-ux-v2-lot01b-notices.cjs` : **4 messages** React, un `Ouvrir dans l’Explorateur` témoin, fermeture indépendante, sémantique `role` / `aria-live`, présence et taille dans **9 combinaisons** et preuve **zéro effet lors du rendu**. Electron/Chromium + 31 CSS réelles dans `%TEMP%`, aucune donnée ou service en production. **Recette Windows VALIDÉE le 10/10/2026 sur `4da508d52c5c35679f884d4c4a6343c4981053b7` : `30/30` contrôles PASS**, 4 niveaux, 9/9 combinaisons, sémantique `role/status/alert`, action seulement au clic et fermeture indépendante, `onlyTemp:true`, `Fixture cleaned: true`. Le même journal montre `npm run typecheck` → `tsc --noEmit` sans erreur, suivi de `RECETTE NOTIFICATIONS 01B VALIDEE`. Ce test est isolé : le bandeau global historique et les confirmations UX-01 ne sont pas remplacés.

**Politique des confirmations 01B.5 :** cartographie seulement pour le moment ; conserver la garde UX-01 et les confirmateurs métier actuels jusqu'à examen des appels réels, notamment les décisions irréversibles. **Pas d'`AppDialog` ni d'éditeur commercial nouveau**. Toute confirmation future doit distinguer suppression/annulation/transition sans mutation si l'utilisateur refuse.

### Commandes pilotes 01B.5 (clone Windows indépendant)

```powershell
node --check scripts/check-ux-v2-lot01b-notices.cjs
if ($LASTEXITCODE -ne 0) { throw "Syntaxe du test notifications incorrecte." }
node scripts/check-ux-v2-lot01b-notices.cjs
if ($LASTEXITCODE -ne 0) { throw "Recette de notifications échouée." }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck échoué." }
```

La galerie des notifications est **une expérimentation de présentation** ; les parcours de success/error en réponse à des services réels, le comparatif de captures 01B.6, la non-régression complète des 17 écrans et la suite Vitest restent à produire. Cette PR n'est pas prête à fusionner.

## 01B.6 — Atelier intégré isolé : créé, recette Windows en attente

**Livrable nouveau :** `scripts/check-ux-v2-lot01b-workshop.cjs`. Il compile et affiche les **vrais composants React** de présentation (`AppButton`, `AppTextField`, `FieldHelp`, `AppNotice` et `OperationIcon`) ensemble, avec les 31 imports CSS réels de `main.tsx`. Les données, boutons et notices sont **fictifs** ; ni Main process métier ni SQLite, profil client, IPC, devis ou contrats ne sont ouverts. Tous les fichiers temporaires et le profil Electron sont dans un `%TEMP%` créé pour la recette et supprimé ensuite.

**Scénarios automatisés du nouvel atelier :** cinq variantes/états de bouton, deux champs (label/description/erreur), aide `?`, quatre notifications et cinq SVG décoratifs ; 3 thèmes × 3 densités avec 14/16/18 px, hauteurs 36/42/48 px, lisibilité, absence de débordement horizontal grossier ; aucune action déclenchée à l'affichage ; clic explicite sur une action factice, fermeture de notification indépendante et aide réellement ouverte puis fermée avec focus rendu. **Le banc ne valide pas les confirmations de sortie UX-01 ni les vrais formulaires remplis**.

**Mode comparatif facultatif** `--captures NEW-ABSOLUTE-FOLDER` : fenêtre Electron de recette visible uniquement dans ce mode, création de **9 PNG**, avec témoin couleur temporaire en bas à droite et **vérification pixel du compositeur** avant écriture. Le script refuse le dossier de destination existant et les chemins Validation-MSI et n'efface que sa propre fixture `%TEMP%`. Les captures ne représentent pas les nouveaux écrans V2, seulement l'atelier des composants 01B.

**Statut probant actuel :** syntaxe JavaScript du script vérifiée pendant sa publication GitHub ; **la recette Electron intégrée, les captures et le typecheck au HEAD incluant cet atelier restent À EXÉCUTER sur Windows**. Aucun nombre de tests réussis annoncé par anticipation.

Commandes à lancer dans le clone de validation propre et détaché :

```powershell
node --check scripts/check-ux-v2-lot01b-workshop.cjs
if ($LASTEXITCODE -ne 0) { throw "Syntaxe atelier invalide." }
node scripts/check-ux-v2-lot01b-workshop.cjs
if ($LASTEXITCODE -ne 0) { throw "Atelier intégré échoué." }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck échoué." }
```

**Avant clôture 01B :** recette de l'atelier dans les neuf configurations puis examen éventuel des captures, tests de non-régression Electron sur les 17 destinations réelles (avec l'assertion d'aide V2), `npm test -- --maxWorkers=2` de la branche 01B et contrôle des autres gates R01B. Les confirmations critiques ne seront pas refaites sans examen et preuve de coexistence avec l'API `requestUnsavedExit`.

## Non-modifications

**Zéro changement métier** : aucun Devis, Catalogue, CGV, contrat, signature Abby, Projet, Bridge, CRM, migration, base SQLite, API ou droits utilisateur ; aucun remplacement des confirmations UX-01. Le composant n'intègre aucune dépendance externe. Retour arrière : revenir à la branche 01A (l'ancien `FieldHelp` et la règle `display:none` sont inchangés sur cette branche).

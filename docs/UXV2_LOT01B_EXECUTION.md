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

## Non-modifications

**Zéro changement métier** : aucun Devis, Catalogue, CGV, contrat, signature Abby, Projet, Bridge, CRM, migration, base SQLite, API ou droits utilisateur ; aucun remplacement des confirmations UX-01. Le composant n'intègre aucune dépendance externe. Retour arrière : revenir à la branche 01A (l'ancien `FieldHelp` et la règle `display:none` sont inchangés sur cette branche).

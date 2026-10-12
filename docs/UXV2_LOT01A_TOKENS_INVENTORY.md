# UX/UI V2 — Lot 01A — Inventaire des tokens CSS et dépendances

**Statut : inventaire de source du 10/10/2026, sans modification des valeurs ni des règles métier.**

Référence de conception inchangée : PR [#82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82), `docs/ux-v2/LOT-01A-TOKENS-VISUELS.md`, `DECISIONS.md` et `LOT-01-MATRICE-EXISTANT-CIBLE.md`. Source de code : `feature/ux-v2-lot01a-typography-v1` après l'incrément Compact 14 px. **La matrice ci-dessous relève le réel ; elle ne crée aucun arbitrage UX inédit.**

## 1. Méthode et limites de lecture

- Inspection directe des **31 imports CSS** de `src/renderer/main.tsx`, **dans leur ordre réel**, sans présumer que ces imports couvrent les feuilles CSS éventuellement importées depuis les composants.
- Recherche statique des **déclarations de propriétés CSS personnalisées** (`--nom: valeur`), consommations `var(--nom)` et marqueurs `!important` ; ceci est un **inventaire source**, pas la preuve de priorité de tous les sélecteurs sur chacun des 17 écrans.
- Des variables telles que `--metric-tone` ou `--business-color` sont réassignées **volontairement selon le contexte ou la classe**. Plusieurs définitions du même nom ne signifient pas nécessairement un conflit CSS.
- Les références à `--text-muted`, `--danger`, `--accent-contrast`, `--bg` ou `--border-color` doivent être examinées **avec leur sélecteur, fallback et autres sources éventuelles**, avant de les classer comme défauts. Cette étape ne remplace pas une inspection calculée dans Chromium pour chaque vue.

## 2. Noyau de tokens existants et rôle cible

**Tokens généraux déjà définis dans `styles.css` pour les trois thèmes** (exemples ci-dessous : valeurs source exactes). Ce sont des rôles d'interface, **pas** les couleurs métier rouge/jaune/bleu/vert :

| Token existant | Rôle sémantique à conserver | AtoumWeb | Noir | Blanc |
|---|---|---|---|---|
| `--sidebar` | Fond navigation | `#101b25` | `#080a0d` | `#ffffff` |
| `--sidebar-text` | Texte navigation | `#eef1f2` | `#f5f5f3` | `#202833` |
| `--sidebar-muted` | Navigation secondaire | `#91a0ab` | `#89929e` | `#77818c` |
| `--canvas` | Fond principal | `#f5f3ee` | `#0e1115` | `#f7f8fa` |
| `--surface` | Panneau premier plan | `#ffffff` | `#161a20` | `#ffffff` |
| `--surface-soft` | Panneau secondaire | `#faf9f6` | `#11151a` | `#f8fafb` |
| `--text` | Texte principal | `#18212b` | `#f2f4f6` | `#1f2933` |
| `--muted` | Texte secondaire | `#6e7882` | `#9aa4af` | `#6d7782` |
| `--border` | Bordures | `#e5e1d8` | `#2a3038` | `#e6e9ed` |
| `--accent` | Accent interactif | `#b9965c` | `#c6a46c` | `#92733f` |
| `--accent-strong` | Accent soutenu | `#92733f` | `#dfbd83` | `#755a30` |
| `--accent-soft` | Accent discret | `#f2eadc` | `#2a241b` | `#f7f1e6` |
| `--success` | Succès | `#2d7a58` | `#55b98b` | `#287a55` |
| `--shadow` | Ombre de profondeur | `0 12px 35px rgba(36, 43, 50, 0.07)` | `0 16px 40px rgba(0, 0, 0, 0.28)` | `0 12px 32px rgba(31, 41, 51, 0.06)` |

**Conclusion 01A :** aucun remplacement massif de ces 14 tokens n'est justifié. Les noms actuels font déjà office de rôles sémantiques ; les nouveaux composants V2 peuvent les **consommer directement ou via alias rétrocompatibles**, sans modifier les thèmes historiques.

## 3. Typographie, densités et contrôles (valeurs codées de E01)

| Token actuel | Compact | Confort | Confort+ | Consommateurs / provenance |
|---|---:|---:|---:|---|
| `--ui-font-base` | **14px** | **16px** | **18px** | `display-density.css` ; `body`, Prospection |
| `--ui-font-secondary` | 14px | 15px | 16px | Libellés secondaires, tables et panneaux |
| `--ui-font-small` | 14px | 14px | 14px | Texte fonctionnel réduit |
| `--ui-control-height` | 36px | 42px | 48px | Champs et boutons |
| `--ui-control-pad-y` | 7px | 10px | 12px | Marges internes verticales des contrôles |
| `--ui-control-pad-x` | 9px | 12px | 14px | Marges internes horizontales des contrôles |
| `--ui-panel-pad` | 16px | 22px | 26px | Panneaux |
| `--ui-gap` | 8px | 12px | 16px | Espacement |
| `--aw-font-functional` | 14px min | 14px min | 14px min | `ui-typography-consistency.css`, contrôles et libellés |
| `--aw-font-secondary` | 14px | 15px | 16px | Tables et textes secondaires |
| `--aw-font-body` | **14px** | **16px** | **18px** | Conteneurs Opérations, Projets, Catalogue, Devis, Temps, Bibliothèque |

Les tailles `--aw-*` sont des expressions `max(14px, var(--ui-font-...))`, non une seconde valeur configurée indépendamment.

## 4. Tokens spécialisés et propriétaires

| Déclaration présente dans les CSS | Propriété / contexte | Risque d'une globalisation prématurée |
|---|---|---|
| `--metric-tone`, `--metric-soft` | `analytics.css` ; variantes statistiques par catégorie | Perte du sens des mesures / séries si remplacées par un accent unique |
| `--prospect-tint`, `--prospect-line` | `prospect-workflow-v2.css`, `prospect-recipe-fixes.css` ; segmentation de cartes Prospect | Confondre code visuel du pipeline et états métier |
| `--card-business-color`, `--business-color`, `--business-pastel` | `pre-phase5-commercial-ux.css` ; palette par cas métier | Effacer les couleurs métier validées ou désynchroniser les cartes |
| `--prospect-temperature-color`, `--prospect-temperature-pastel` | `prospection-commercial-v2.css` ; couleur de température/carte | Forcer un libellé ou statut absent des règles UX validées |
| `--aw-status-green/blue/yellow/orange/red/purple/neutral-{bg,fg}` | `ui-consistency-v2.css` ; variantes d'états et couleurs de texte | Rompre les contrastes spécifiques du thème sombre et des étiquettes |
| `--business-ink` et réassignations de `--business-color` / `--prospect-temperature-color` | `ui-consistency-v2.css` ; ajustements chargés **après** les modules | Écraser la cascade et les contrastes sans capture avant/après |

Les quatre couleurs métier validées **`#D62828`, `#F2B705`, `#1565C0`, `#198754`** sont visibles dans `pre-phase5-commercial-ux.css` et `prospection-commercial-v2.css`. Elles **ne remplacent pas** `--accent` des thèmes.

## 5. Fichiers CSS inspectés et dépendances

Chaque ligne correspond à un import réel de `src/renderer/main.tsx`, dans son ordre (les nombres de `!important` sont des occurrences textuelles, **pas** des défauts prouvés) :

| # | Feuille | Déclarations de tokens repérées | `!important` | Note |
|---:|---|---|---:|---|
| 1 | `styles.css` | 14 rôles × 3 thèmes | 0 | Source des surfaces, textes et accents |
| 2 | `crm.css` | — | 0 | Consomme rôles généraux |
| 3 | `crm-extras.css` | — | 0 | Consomme rôles généraux |
| 4 | `crm-identity.css` | — | 0 | Consomme `--aw-font-*` |
| 5 | `prospect-detail.css` | — | 0 | Consomme rôles généraux |
| 6 | `client-detail.css` | — | 0 | Références à `--text-muted` à contextualiser |
| 7 | `search-extra.css` | — | 0 | Recherche |
| 8 | `detail-layout-overrides.css` | — | **18** | Surcharges de disposition à protéger |
| 9 | `prospect-workflow.css` | — | 0 | Workflow Prospect |
| 10 | `prospect-recipe.css` | — | 0 | Recette Prospect |
| 11 | `commercial.css` | — | **9** | Devis/Catalogue, références `--text-muted` |
| 12 | `billing.css` | — | 2 | Facturation et densité |
| 13 | `expenses.css` | — | 2 | Dépenses et densité |
| 14 | `quote-line-editor.css` | — | 0 | Éditeur de devis |
| 15 | `quote-client-preview.css` | — | 0 | Prévisualisation |
| 16 | `projects.css` | — | **30** | Plus grosse feuille de styles Projet de cette sélection |
| 17 | `project-resources.css` | — | 0 | Ressources |
| 18 | `project-technical-library.css` | — | 1 | Bibliothèque |
| 19 | `project-completion.css` | — | 0 | Finalisation projet |
| 20 | `time.css` | — | 5 | Chronomètre/temps |
| 21 | `time-recovery.css` | — | 3 | Reprise de temps |
| 22 | `operations.css` | — | 7 | Références à `--danger`, `--text-muted` |
| 23 | `analytics.css` | `--metric-tone`, `--metric-soft` | 0 | Couleurs contextuelles |
| 24 | `workflow.css` | — | 0 | Workflow |
| 25 | `display-density.css` | 8 tokens × 3 densités | 0 | Incrément Compact 14px |
| 26 | `prospect-workflow-v2.css` | `--prospect-tint` | 0 | Couleurs des cartes |
| 27 | `prospect-recipe-fixes.css` | `--prospect-line` | 0 | Bordures contextuelles |
| 28 | `pre-phase5-commercial-ux.css` | `--card-business-color`, `--business-color`, `--business-pastel` | **48** | Couleurs métier / overrides |
| 29 | `prospection-commercial-v2.css` | `--prospect-temperature-color`, `--prospect-temperature-pastel` | 3 | Couleurs métier |
| 30 | `ui-typography-consistency.css` | `--aw-font-functional/secondary/body` | 0 | Typographie transverse |
| 31 | `ui-consistency-v2.css` | États `--aw-status-*`, couleurs métier dérivées | **99** | Surcharges tardives et couleurs adaptées |

**Points de vigilance explicitement relevés :** les plus fortes concentrations de `!important` sont `ui-consistency-v2.css`, `pre-phase5-commercial-ux.css`, `projects.css` et `detail-layout-overrides.css`. La seule présence d'un `!important` ne justifie pas sa suppression. La dernière feuille `ui-consistency-v2.css` suit la feuille typographique ; sa spécificité peut donc modifier le rendu calculé.

## 6. Preuves et prochain contrôle 01A

Recette native Electron **PASS au commit `466b8e45a05c0122297dcbd5eec1f7f6d6deb602`** : 31 CSS réellement chargés, **9/9** combinaisons, **72/72** tailles calculées, **9/9** hauteurs de contrôle, **9/9** contrastes corps ; contrastes AtoumWeb 14,67, Noir 17,16, Blanc 13,89 ; **fixture nettoyée**. [Rapport d'exécution](UXV2_LOT01A_EXECUTION.md).

Ce succès ne remplace pas les recettes R01A-01 à R01A-08 sur **les vraies vues** : focus et contraste des messages d'état, petits écrans/zoom, sauvegarde de la densité, menus, chrono et aides. **Aucun token spécialisé ni style hors E01 n'est modifié ici.**

**Décision d'implémentation conforme au référentiel :** réutiliser les tokens existants et leurs noms stables ; ne créer d'alias/surcouche V2 que lorsqu'un composant en aura démontré le besoin avec un test de compatibilité. Toute modification future exige un différentiel de CSS calculé dans les neuf configurations.

**Hors périmètre :** textes et versions des contrats, CGV, contenu devis, migrations, IPC, service Bridge, navigation, pièces jointes, installation et données réelles.

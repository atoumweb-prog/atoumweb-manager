# UX/UI V2 — Lot 01B.6 — Revue visuelle des 9 captures de l'atelier

## Complément du 12/10/2026

Les neuf captures ci-dessous restent historiques à leur SHA. Reprise locale #87 au correctif `af5cdc559517e049c45f80acf551928e0dd28772` : contrôles **40/40**, aide **70/70**, atelier **50/50 sans nouvelle capture**, interface réelle **300/300**. Mesures et interactions Electron : longs labels/erreurs, aide longue défilable, fermeture et focus, fenêtres étroites et zoom 125/150 %. Coupure d'aide reproduite puis corrigée dans le calcul vertical ; aucune CSS globale modifiée. [Preuves et limites](UXV2_LOT01B_REPRISE_2026-10-12.md). Pas de nouvelle revue d'images ni certification WCAG revendiquée ; pas de refonte des futures fiches 01C.

## Historique — revue des captures du 10/10

**Date de revue :** 10/10/2026. **Statut : revue visuelle des captures synchronisées ACCEPTABLE**, avec deux améliorations de présentation non bloquantes. **Un journal PowerShell distinct a depuis été transmis** : il prouve 51/51 assertions Electron et le typecheck sur le SHA `d80409a`. Ces éléments n'étaient pas démontrables par le ZIP seul.

## Source examinée

Archive fournie dans la conversation : `uxv2-01b-atelier-20261010-040237.zip` ; SHA-256 de l'archive réellement lue : `e6ce248eb23b661ee813f3f094e01690c18d1575a99f0b57c31d276555a9b0ca`. Intégrité ZIP : **OK** (aucune entrée corrompue), exactement **9 PNG** de **2019 × 1377 px**.

| Thème | Compact | Confort | Confort+ |
|---|---|---|---|
| AtoumWeb | `atoumweb-compact.png` | `atoumweb-comfort.png` | `atoumweb-comfort_plus.png` |
| Noir | `noir-compact.png` | `noir-comfort.png` | `noir-comfort_plus.png` |
| Blanc | `blanc-compact.png` | `blanc-comfort.png` | `blanc-comfort_plus.png` |

**Fraîcheur des captures : 9/9 témoin-pixels EXACTS.** Chaque témoin de couleur de la fixture 01B.6, évalué à `(largeur - 17, hauteur - 17)`, correspond à la couleur attendue pour le numéro de capture 1 à 9 selon l'ordre de génération thèmes AtoumWeb/Noir/Blanc puis densités Compact/Confort/Confort+. Les petits carrés de couleur en bas à droite sont des **marqueurs de test**, pas l'interface livrée.

## Constat visuel, comparaison directe

- **Résolution du premier défaut de fixture** : on distingue la véritable structure grille **sidebar fictive à gauche / topbar / main-area / content-area**, au lieu du panneau de 258 px de la première tentative. La largeur utile du contenu paraît rétablie dans les neuf vues.
- Les cartes « Boutons et icônes », « Champs et aide ? », « Notifications » et « Périmètre 01B » sont toutes visibles. Aucun débordement horizontal majeur, recouvrement de carte, écran vide ou texte principal tronqué visible dans les neuf photos à la fenêtre de l'atelier.
- Thèmes **AtoumWeb**, **Noir**, **Blanc** : fonds, cartes, bordures, textes et états colorés restent différenciés et cohérents. En particulier, les contrastes apparents du thème Noir ne révèlent pas de libellé devenu illisible sur cette galerie, sans constituer une mesure WCAG complète.
- Les densités montrent des différences de taille de police, de hauteur de contrôles et de retour à la ligne. Les éléments essentiels restent accessibles visuellement, y compris en Confort+.
- Quatre notifications présentées : information, succès avec action explicite « Ouvrir dans l’Explorateur (démo) », avertissement avec fermeture, erreur. Les champs possèdent label, description et erreur visible. Les boutons « Indisponible » et « Action sensible » se distinguent visuellement.
- **Polish mineur avant migration en masse** : la ligne « Temps / Interventions » du bloc d'icônes juxtapose trop étroitement les pictogrammes aux mots (absence de vrai `gap` dédié dans l'atelier). Le bouton icône-seule « Agrandir » avec variante `quiet` semble presque sans affordance visuelle au repos ; vérifier sa cible et son focus sur l'atelier/dans le contexte réel, sans imposer un style global arbitraire.
- Le menu latéral volontairement quasi vide appartient à la **fixture**, pas à la nouvelle navigation du Manager. Pas un défaut de production.
- Les neuf captures montrent des **composants pilotes avec données fictives** ; la **nouvelle architecture des écrans UX V2 n'est pas encore livrée**.

## Portée de la validation et preuves encore dues

**Démontré à partir des fichiers :** 9 images présentes, ZIP intact, 9/9 pixels de fraîcheur corrects, neuf rendus visuels cohérents sans débordement horizontal manifeste. Ce ZIP montre que la grille a la bonne répartition ; la mesure automatisée réelle de `scrollWidth/clientWidth` doit, elle, provenir du journal du banc.

**Non démontré par les images seules :** le nombre `[UXV2 01B WORKSHOP] RESULT ... checks`, la sortie `npm run typecheck`, le SHA exact du checkout Windows, les interactions clavier/clic/Échap, la fermeture des aides, la préservation des handlers sur les écrans métier, le contraste WCAG mesuré, les fenêtres étroites/zoom, la suite Vitest ou les confirmations destructives. **Ne pas annoncer ces barrières comme réussies à partir des neuf PNG.**

### Prochaines barrières

1. **Acquis par journal PowerShell distinct** : `git log -1` = `d80409a`, `Shell geometry` confirme `sidebar=258/main=1088/content=1088`, neuf `CAPTURE ... VERIFIED`, `RESULT {"checks":51,"failed":0,"combinations":9,"components":5,"onlyTemp":true,"capturesVerified":9}`, `Fixture cleaned: true`, `npm run typecheck`/`tsc --noEmit` sans erreur et message final `ATELIER UX 01B VALIDE`. La preuve complète est enregistrée dans `UXV2_LOT01B_EXECUTION.md`.
2. **Acquis sur SHA `36ef9e8`** : `node scripts/check-ux-v2-lot01a-real-ui.cjs` exécuté sur la branche 01B — **300/300**, 17 destinations réelles, `overflowCandidates:[]`, `consoleErrors:[]`, fixture nettoyée. Cette preuve porte sur les écrans existants, pas les futures pages UX V2.
3. **Acquis sur le même SHA** : suite complète `npm test -- --maxWorkers=2` — **87/87 fichiers, 801/801 tests** en 97,27 secondes ; `npm run typecheck` **OK** ; en complément `check-ux-v2-lot01b-controls.cjs` **32/32**. Voir la synthèse détaillée dans `UXV2_LOT01B_EXECUTION.md`.
4. Réconcilier les cas **R01B-01…12** du référentiel #82 : certains cas UX-01 protégés par IPC ne sont pas prouvés par l'atelier fictif.
5. Garder la PR #87 **draft** et empilée sur #86. Aucune fusion automatique ou modification de `main`, contrats, migrations, SQLite réel ou Bridge.

**Conclusion :** les neuf captures apportent une **preuve visuelle utile et positive pour l'atelier isolé**, pas une validation complète du lot 01B ni des futurs écrans V2.

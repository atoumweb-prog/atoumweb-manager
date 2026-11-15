# P5c Fiches et reste : petits textes à zéro, plan d'exécution

> **Pour l'agent qui exécute** : `superpowers:executing-plans` (avec `test-driven-development` et `verification-before-completion`) ; skill `atoumweb-design` (typeset, adapt).

**But :** budget des petits textes de **473 à zéro**, hors une exception décidée par Carlos ; plus aucun texte d'interface visible sous 14 px sur les fiches (projet, client, prospect et ses onglets, Parcours commercial, Interventions, Maintenance (F70), Packs, Bibliothèque, devis, Documents, Dépenses, Facturation, Sauvegardes, Réglages, Accueil).

**Approche :** `outils-edition\css-raise-all.cjs` sur les 45 fichiers restants ; dans `quote-client-preview.css`, seules la barre d'outils et les messages de l'aperçu (`.quote-client-preview-toolbar strong`, `.quote-pdf-result, .quote-pdf-error`) sont relevés. Mesure du rendu et des cadres avant / après sur 37 vues par taille (`outils-audit\p5c-captures.txt`, parties a et b).

**Fiche :** `docs/refonte/plans/2026-11-15-p5-petits-textes-design.md` (validée ; exécution sans résumé du plan).

## Décision de Carlos (15/11/2026, outil de question)

**Exception : l'aperçu du devis « côté client » reste fidèle au PDF.** Les 12 règles `.quote-document-*` de `quote-client-preview.css` gardent les tailles du document (9 à 13 px) : c'est l'image du document envoyé, pas l'interface. Le PDF réel est produit à part (`buildQuoteHtml`, `quotePdf.ts`) et n'est pas touché.

## Contraintes globales

Celles de P5a et P5b ; budget final : `fontFloorBaseline.json` ne garde que `"quote-client-preview.css": 12` ; un test vérifie que ces 12 déclarations sont toutes dans des règles `.quote-document-*`.

## Points de vigilance (Review Focus)

1. Parcours commercial (49 petits textes) : cartes et colonnes étroites, pas de nouveau débordement (la refonte de la vue reste F69).
2. Fiche projet, onglet Production : pastilles d'état, chrono de l'étape, unité « min » à côté du champ.
3. Fiche Documents : noms de client et catégories dans les lignes.
4. Fenêtre étroite (507 px) : aucun défilement horizontal nouveau.
5. Thèmes et densités non vus (fin de refonte) : la typographie native (72 contrôles, trois thèmes × trois densités) doit rester verte.

### Tâche 1 : captures « avant » (faites le 15/11/2026, `captures-p5c\avant\`)

### Tâche 2 : relever (test d'abord)
- [ ] `ui/p5cWiring.test.ts` : somme des `countSmallFontDeclarations` de tous les CSS du rendu = **12** ; les seules déclarations sous 14 px sont dans `quote-client-preview.css`, dans des règles dont tous les sélecteurs commencent par `.quote-document`. Le voir échouer (473).
- [ ] `css-raise-all.cjs` sur les 45 fichiers ; `css-raise-font.cjs` pour les deux règles de `quote-client-preview.css` ; `eol-report.cjs` ; `git diff` relu (seules des lignes de taille, de capitales ou d'espacement) ; `gen-font-baseline.cjs` (attendu 12) ; test vert ; typecheck.

### Tâche 3 : mesurer et adapter
- [ ] Captures « après » (mêmes vues) : 0 texte d'interface visible sous 14 px (seul l'aperçu du document garde ses tailles) ; défauts de cadre nouveaux corrigés avec garde de source, ou inscrits au registre.

### Tâche 4 : preuves, recette, clôture
- [ ] Suite complète ; natifs 72, 18/18, 25, 857 ; `lot10` 59 ; `03e-directory` 206 ; `home-shell-lot1` 96 ; `check-offres-tarifs-lot1` 32 ; `!important` 86 ; empreinte identique. Recette de Carlos ; registre (F9, F24, F26, F34, F36, F40, F70), statut, passation, mémoire ; un commit local.

## Révisions

(aucune pour l'instant)

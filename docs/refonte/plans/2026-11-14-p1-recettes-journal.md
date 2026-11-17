# P1 Recettes : journal des causes

Statut : **P1 exécuté le 14/11/2026, en attente de la recette de Carlos avant commit.** Plan : `2026-11-14-p1-recettes.md`. Fiche : `2026-11-14-p1-recettes-design.md`. Skills : `atoumweb-design`, `superpowers:executing-plans`, `superpowers:verification-before-completion`.

## Résumé

- Au départ : **15 recettes rouges sur 15** (diagnostic du 14/11/2026, 20 h 42).
- À l'arrivée (15 = 9 + 2 + 4) : **9 recettes vertes**, **2 retirées** (`corrections`, `density`), **4 rouges** dont **3 pour un défaut du produit mesuré** (`check-shell-home-simplification` sur F43, `--ux-lot` sur F45, `--desk` sur F46) et **1 à décider** (`check-ux-v2-03e-directory`, F47). Aucune attente affaiblie (sauf la précision ci-dessous sur le défilement natif), aucun code de `src/` touché.
- Retirés (réversibles par l'historique) : `prospection-corrections.cjs`, `prospect-density-scenarios.cjs`, `check-ux-v2-prospect-density.cjs`, et l'entrée `prospect-a` de `scripts/convergence-state.json`.

## Baseline et preuves

- Dépôt : branche `claude/refonte-manager`, dernier commit `d06555ae` (R9). `src/` identique au dernier commit pendant tout P1.
- Empreinte SHA-256 de la préproduction avant et après : `5da9e5fcf5115d9174c224b41b4a5f6aa037fc7d3cc463ca0b11a18c72d2c43d` (identique, vérifiée après la dernière série).
- `npm run typecheck` propre ; `node scripts/run-tests.cjs` : **305 fichiers, 2 471 tests, 1 ignoré** (inchangé : P1 ne touche ni test ni code) ; scripts natifs sans option : typographie **72**, états **18 sur 18**, garde Abby **25** (0 échec), interface réelle **857 contrôles sur 17 écrans**, `check-ux-v2-lot10-ui` **59**.
- Aucun processus Electron en cours, aucun harnais résiduel. Les dossiers `outputs/shell-home-review-*` sont des captures produites par les recettes (ignorés par git).
- Budgets : petits textes **625**, `!important` d'`ui-consistency-v2.css` **86** : inchangés (aucun CSS touché).

## Résultat par recette (série finale du 14/11/2026, 22 h 49 à 22 h 54)

| Recette (entrée) | Résultat final | Cause réelle |
|---|---|---|
| `check-quote-journey-native` (F39) | **verte, 44** | actions du devis dans des menus « Plus » (R4) ; deux menus dans la page, dont un dans un volet masqué ; assistant `viaMenu` qui ouvre le menu **visible** |
| `check-offres-tarifs-lot1` (F32) | **verte, 32** | « État de version » seulement après « Filtres avancés » ; garde « non enregistré » = boîte dans la page (`UnsavedSaveDialog`) ; `.ot-counters` devenu `.ot-keyfigures` |
| `check-ux-v2-02d-home` (F21) | **verte, 56** | « Descendre » désactivé sur la dernière carte ; « + Nouveau client » dans l'en-tête de page ; ordre standard `today,watch,kpis,pipeline,time,actions` depuis R6 |
| `check-shell-home-simplification` sans option (F21) | **rouge sur F43 seul** (824 contrôles passent) | cartes repliées par défaut (R6), logo deux fois dont un masqué, `#header-options-trigger` retiré du Manager réel (tolérance déjà utilisée par `02e`, `real-shell`, `rail-render`) ; reste le débordement de 4 px (F43) |
| `check-home-shell-lot1` (F22) | **verte, 96** | groupe de la page active ouvert depuis R7 ; même logo partout depuis R2 ; dossier de sortie neuf requis |
| `check-contract-library-ui --output` (F6) | **verte, 139** | section « Informations AtoumWeb » sans titre dans le PDF refondu mais **contenu présent** (contrôle sur chaque valeur) ; migrations « contiguës depuis 1, au moins 71 » ; deux points « non vérifié, à réparer » signalés par le script (F48) |
| `check-contribution-targets-ui --output` (F12) | **verte, 51** | donnée synthétique sans `dossierId` ni `currentQuoteId` ; section repliée (R5a) : lecture par `textContent` avec « 0 à choisir » |
| `check-prospection-flow-native` (F5) | **verte, 29** | en-tête de page (`PageHeader`) ; en-têtes de section = boutons avec flèche (assistant `section`) ; `#needs-section-commercial` |
| `--desk` (F5) | **rouge sur F46 seul** (16 contrôles passent) | associations retirées (contrôles supprimés) ; référence dans « Préparer l'échange » ; historique des vérifications dans l'onglet principal « Historique » (filtre « Vérifications de l'entreprise ») ; contrôle de tenue en largeur **repris** de l'ancienne recette de densité, qui révèle F46 |
| `--prospection` pilote (F5) | **verte, 22** | fiche : « Prochaine étape » et sept onglets |
| `check-prospection-tabs-native` (F5) | **verte, 27** | « huit onglets » retiré (contredisait `flow`) ; « Préparer l'échange » ; menu « Plus » pour « Classer comme perdu » ; création de prospect = un formulaire à sections (plus d'onglets) ; contrôles du catalogue retirés (voir ci-dessous) |
| `--ux-lot` (F5) | **rouge sur F45 seul** (51 contrôles passent avant) | table de Prospection qui déborde de 15 px à 1440 px, zoom 150 % |
| `check-ux-v2-03e-directory` (F32) | **rouge** | F44 (focus) puis parcours à réécrire (F47) |
| `check-prospect-catalog-recommendations-ui` (info) | verte | couvre le sélecteur de prestations de la création de prospect (« seul un clic explicite ajoute un besoin ») |
| `check-ux-v2-lot10-ui` (info) | verte, 59 | — |
| `check-ux-v2-02c` (info) | refuse de tourner (« Commit local changes before final validation ») | non évaluée ; contient la même attente périmée `.client-toolbar` (ligne 133 de `02c-search-scenarios.cjs`), idem `02e-shell-journeys.cjs:70` |

## Défauts du produit trouvés (non corrigés dans P1)

| Registre | Où | Mesure |
|---|---|---|
| **F43** | Accueil, 760 × 720 à zoom 150 % (497 px utiles), trois thèmes dont Noir | 4 px de défilement horizontal (contenu 357 px pour 353 px), bouton secondaire de 26 px |
| **F44** | Recherche globale vers une fiche prospect | le focus reste dans « Recherche globale » une seconde après ; la fiche est ouverte, identifiée, et peut recevoir le focus à la main ; cause non trouvée |
| **F45** | Table de Prospection, 1440 px, zoom 150 % (960 px utiles) | 15 px de débordement du conteneur (653 pour 638) ; six autres tailles tiennent |
| **F46** | Fiche prospect, 1280 × 720, zoom 150 % (853 × 480 px utiles) | zone de contenu de **33 px** de haut (391 et 431 px aux deux autres tailles) ; pas de débordement horizontal |

## Décisions de Carlos appliquées (14/11/2026)

- Retirer `corrections` et `density`, réécrire `desk`, `flow`, `pilot`, `tabs` : fait. Pour `desk`, seuls les contrôles de l'ancienne fiche (associations) sont retirés ; tout ce qui reste vivant est conservé.
- Non tranché : **F47**, la recette de parcours `check-ux-v2-03e-directory`.

## Ce qui est perdu ou déplacé (liste des contrôles)

- `corrections` (16 contrôles) : mise en page de l'ancienne fiche (thème sombre des cartes, bouton Annuler horizontal, ligne d'historique compacte, six étapes sans volet latéral…). Remplacé par les captures de R3 et `prospectR3Wiring.test.ts`. **Non remplacé un à un.**
- `density` (18 contrôles) : synthèse `prospect-focus-*`, groupes de sections, trois thèmes × trois densités. Les thèmes AtoumWeb et Blanc et les densités Compact et Confort + sont **hors périmètre** pendant la refonte. Repris : tenue en largeur (dans `desk`), brouillon de devis conservé (dans `flow`), chrono unique (`desk`, `pilot`), données inchangées (`desk`, `pilot`).
- `desk` : « associations sur demande » et « associations repliables » (2 contrôles) ; identité compacte conservée.
- `tabs` : « huit onglets », « catalogue : résultats sélectionnables » et « choix enregistré une fois » (3 contrôles). Le dernier couple est couvert par `check-prospect-catalog-recommendations-ui`.
- `flow`, `pilot` : aucun contrôle perdu ; sélecteurs mis à jour.

## Rulings

- Pas de copie détachée du dernier commit (`src/` non touché).
- Diagnostic groupé (15 recettes d'affilée, un seul Electron à la fois).
- Plusieurs sondes jetables (copies avec affichage au lieu d'échec ; lignes `P1DBG` ou `P1NONFATAL` posées puis retirées). Contrôle final : aucune occurrence dans `scripts/`. Les fixtures modifiées temporairement ont été restaurées par `git checkout` ou par édition inverse.
- Une vérification a été rendue non bloquante **dans une copie de travail temporaire** (débordement de l'Accueil, puis historique de la référence) pour voir la suite, puis restaurée stricte.
- Seule affaiblissement de condition : « native wheel scrolls work » de `desk` ne demande le défilement que si le contenu déborde (l'onglet Entreprise tient désormais dans la hauteur) ; le défilement natif reste prouvé par « Reference save remains reachable ».
- Le dépôt est en `autocrlf` : les fins de ligne des fichiers modifiés sont uniformes dans chaque fichier, le commit normalise.

## Ce qui n'a pas été vu

- Les deux contrôles « non vérifié » de `check-contract-library-ui` (F48).
- `check-ux-v2-02c` et `check-ux-v2-02e` (non lancées avec succès ; attente `.client-toolbar` identique) : non traitées.
- Les captures produites par les recettes n'ont pas été relues.
- **Revue finale : autocontrôle de l'auteur, pas un relecteur indépendant.**

## Révisions

(aucune)

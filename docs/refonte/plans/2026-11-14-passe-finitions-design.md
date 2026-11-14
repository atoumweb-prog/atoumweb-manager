# Passe de finitions : fiche de cadrage (F1 à F42 classées en six lots courts)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J). Aucun code écrit. Cette fiche **classe** les 42 entrées du registre `docs/refonte/FINITIONS.md` et propose un ordre ; elle ne les traite pas.
Skills : `atoumweb-design` (critique, polish, audit), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Décision de Carlos du 14/11/2026 : cette passe vient **après R9 et avant** la mise à jour des styles AtoumWeb et Blanc et des densités.

## D'où viennent les constats

- **Registre lu en entier** : `docs/refonte/FINITIONS.md` (F1 à F42, statuts « à faire », « à voir », « à diagnostiquer », « information », « à confirmer », « chaque lot »).
- **Chiffres relus dans le dépôt** (14/11/2026, après R9, commit `d06555ae`) : budget des petits textes **625 déclarations sous 14 px dans 56 fichiers CSS** (`ui/fontFloorBaseline.json`) ; plafond d'`!important` d'`ui-consistency-v2.css` à 86 (`ui/importantBudget.test.ts`). Les plus chargés : `AtoumWebLibraryPage.css` 53, `BridgeSitesPage.css` 42, `projects.css` 42, `operations.css` 36, `commercial.css` 32, `crm.css` 32, `home/HomeDashboard.css` 30, `prospect-recipe.css` 25, `styles.css` 24, `StatisticsPage.css` 18, `catalog-workspace-v2.css` 17, `prospect-workflow.css` 17.
- **Limites** : je n'ai **pas** relancé les recettes en échec ni revérifié les fichiers orphelins (F10) pour écrire cette fiche : leurs statuts sont ceux du registre. Aucune capture nouvelle. Les entrées « à voir » n'ont pas été regardées.

## Ce que le registre montre

42 entrées, de poids très différent : sept **recettes en échec**, une vingtaine de **défauts d'écran** d'une ligne à une demi-journée, trois **décisions qui sont à toi**, des **états jamais vus** (les écrans rares, les erreurs, la fenêtre étroite, le clavier), de la **dette de code** (orphelins, CSS mort, composants en double) et quelques **informations** sans action.

Le plus utile avant de toucher les écrans : **retrouver un filet de sécurité**. Sept recettes sont rouges depuis avant la refonte (F5, F6, F12, F21, F22, F32, F39) : tant qu'elles le sont, un lot d'écran ne peut pas dire qu'il n'a rien cassé là où ces recettes regardent.

## Classement des 42 entrées

| Lot proposé | Entrées | Nature | Effort |
|---|---|---|---|
| **P1 Recettes** | F5, F6, F12, F21, F22, F32, F39 | diagnostiquer les échecs sur le dernier commit, réécrire sur des règles durables ou retirer ce qui est obsolète (ta décision pour F5) | moyen, aucun écran |
| **P2 Nettoyage** | F10, F11, F29 | confirmer puis retirer 11 fichiers orphelins ; mineurs M4 à M9 (notice sans garde, détecteur de boutons trop large, `page-header.css` hors liste du budget, CSS mort `.database-chip` et `.health-dot`, en-têtes de Prospection en 14 px gras, `emptyText` jamais passé) ; `-wal` et `-shm` vides de la base de test | petit |
| **P3 Prospection, Devis, Projets** | F1, F2, F3, F4, F13, F14, F15, F16, F17, F18 (+ F7 et F20 à décider) | défauts visibles des fiches et du plan : titres en double, ordre de « Plus » et de la croix, raison du blocage de « Suivant », résumés de sections, note « Plan issu du modèle » repliable, 429 px à 420, noms de tâche sur deux lignes, onglet Sites et pages vide | moyen |
| **P4 Accueil, Gestion, Ressources, Réglages** | F23, F25, F28, F33, F35, F38, F40 (+ F31 et F37 à décider) | défauts de listes et de pages : liste de l'Accueil sur la demi-largeur, action principale sur une deuxième ligne (Temps, Documents), messages vides locaux de Dépenses et Facturation, rail coupé en bas, Statistiques (répétition, indice du clic), Avant / après intervention, Réglages pleine largeur | moyen |
| **P5 Petits textes** | F9, F24, F26, F34 (part), F35 (part), F36 (part), F40 (part) | descendre les 625 déclarations sous 14 px, **fichier par fichier**, en commençant par ceux que les lots P3 et P4 ont déjà ouverts | gros, mécanique |
| **P6 États rares** | F7, F15, F16, F19, F30, F36, F41, F42 | étendre les jeux de cas de figure (projet terminé, incident, maintenance expirée, pack épuisé, chrono en cours), puis **regarder** ce qui n'a jamais été vu : devis envoyé ou accepté, erreurs, textes très longs, fenêtre étroite, clavier, Sites rempli, onglets de Mon entreprise, confirmations | moyen, surtout des captures |

**Informations sans action** : F8 (captures « avant » de R4 approximatives), F37 (Pilotage non listé, à réafficher quand il aura une fonction), F29 et F42 (déjà dans P2 et P6 pour mémoire).
**Mis de côté (autres lots)** : F27 (unifier les trois composants de chiffres clés) : je propose de le traiter **dans P5 ou à la fin de refonte**, avec les thèmes, parce qu'il touche l'Accueil, les onglets de Projet et les écrans de listes.

## Intention

Rendre le Manager **cohérent et sans angle mort** avant d'aligner les deux autres thèmes : plus aucune recette rouge sans raison connue, plus de code mort, les défauts d'écran fermés, le plancher de 14 px tenu partout, et ce qui n'a jamais été vu, regardé. La passe ne change **ni données, ni règles métier, ni parcours**. L'acompte par défaut reste un lot dédié.

## Hors périmètre

- Les thèmes AtoumWeb et Blanc et les densités Compact et Confort + : **fin de refonte**, après cette passe.
- **L'acompte par défaut** (lot dédié, décision du 14/11/2026), les règles métier mises de côté (prochaine étape du projet, relances, acceptation avec preuve), les cinq offres sans règle d'échéancier.
- Toute fonction nouvelle : F20 (filtre par projet de la page Interventions) en est une, voir les décisions.

## Approches envisagées

- **A (recommandée) : six lots courts, dans l'ordre P1, P2, P3, P4, P6, P5.** Un lot = une fiche courte, des captures avant / après quand l'écran change, un seul commit. P1 d'abord (le filet), P5 en dernier (le plus mécanique, il profite des fichiers déjà ouverts par P3 et P4). Chaque lot garde les règles A à J.
- **B : un seul grand lot « finitions ».** Moins de cérémonie, mais une recette de Carlos sur des dizaines de changements mêlés, et un commit impossible à relire ou à revenir en arrière.
- **C : traiter seulement ce qui se voit (P3, P4) et laisser les recettes, le code mort et les petits textes à la fin de refonte.** Rapide, mais la fin de refonte (deux thèmes et deux densités) se ferait **sans filet** et sur 625 petits textes.

Je recommande **A**.

## Décisions qui sont à toi

1. **Ordre et découpage** (A : P1, P2, P3, P4, P6, P5) : OK, ou tu changes l'ordre ou fusionnes des lots ?
2. **F5, sept scénarios de Prospection obsolètes** : les **réécrire** sur la fiche actuelle (long, ils couvrent la densité, les corrections, le bureau, le flux, le pilote, les onglets) ou les **retirer** et garder les scénarios déjà verts (`check-ux-v2-lot01a-real-ui`, 857 contrôles) ? Je recommande de **retirer** ceux qui ne visent plus rien d'existant, et de réécrire seulement ce qui protège un parcours encore vivant.
3. **F10, onze fichiers orphelins** : OK pour les retirer **après** preuve (recherche des importations, build, tests verts), listés dans le lot, réversibles par l'historique (règle F) ? `WorkflowDashboard.tsx` avait été envisagé comme base de R6 : je le garde ou je le retire ?
4. **F20, filtre par projet de la page Interventions** (fonction nouvelle : état de page, événement de navigation) pour que « + N autres non affichées » devienne un lien : **oui dans P3**, ou **non** (laissé tel quel) ?
5. **F31, bouton « Replier le bandeau Bibliothèque »** : le déplacer dans la page demande de toucher l'en-tête global validé au lot UX 1, l'atelier d'en-tête et quatre recettes. **Le déplacer en P4** (avec ces recettes réécrites), ou **le laisser** dans l'en-tête ?
6. **F37, l'espace « Pilotage » d'Offres** : il reste non listé jusqu'à ce qu'il ait une fonction : OK ?
7. **F18, onglet « Sites et pages » vide** : **masquer l'onglet** tant qu'un projet n'a ni site ni page, ou **le garder** avec un vrai état vide ?
8. **F40, Réglages** : garder toutes les sections pleine largeur, ou **remettre Apparence et Navigation côte à côte** pour réduire le vide ?
9. **F27, composants de chiffres clés** : à unifier dans **P5**, ou **à la fin de refonte**, ou **jamais** ?
10. **Objectif du budget de petits textes (P5)** : **zéro** déclaration sous 14 px (le plancher devient absolu), ou **un plafond plus bas** (par exemple moins de 300) et on arrête quand le plafond est atteint ?

## Ce que je n'ai pas pu voir

Les recettes rouges (non relancées pour cette fiche), les onze orphelins (non revérifiés), tout ce que le registre classe « à voir » : plan de projet avancé, ligne « En ce moment » avec blocages, Sites rempli, devis envoyé ou accepté, états d'erreur, textes longs, fenêtre étroite, clavier, onglets de Mon entreprise.

## Preuves prévues si tu valides

Pour **chaque lot** : fiche courte validée, plan, tests d'abord quand du code change, typecheck, suite complète (305 fichiers, 2 471 tests aujourd'hui), les quatre scripts natifs sans option (typographie 72, états 18/18, garde Abby 25, interface réelle 857), recettes touchées comparées au dernier commit (règle H), captures avant / après quand l'écran change, budget des petits textes à la baisse (625 aujourd'hui) et `!important` sous le plafond, fins de ligne par `eol-report.cjs`, mise à jour de `FINITIONS.md` (chaque entrée traitée passe en « fait dans … »), `PROJECT_STATUS.md` et du fichier de reprise, un seul commit local par lot après tes captures vues.

## Décisions de Carlos (14/11/2026, dans le chat)

1. **Ordre** : P1, P2, P3, P4, P6, P5, six lots courts (approche A).
2. **F5** : retirer les scénarios qui ne visent plus rien d'existant ; réécrire seulement ce qui protège un parcours encore vivant.
3. **F10** : retirer les 11 orphelins, `WorkflowDashboard.tsx` compris, **après preuve** (recherche des importations, build, tests verts), listés dans le lot, réversibles par l'historique.
4. **F20** : oui, filtre par projet de la page Interventions, **dans P3** (petite fonction nouvelle : état de page et événement de navigation).
5. **F31** : le bouton « Replier le bandeau Bibliothèque » **reste dans l'en-tête global** (rien à déplacer, F31 passe en « laissé tel quel »).
6. **F37** : « Pilotage » d'Offres **reste non listé** (l'Accueil porte le pilotage quotidien, Statistiques le pilotage dans la durée ; pas de troisième écran). Une éventuelle vue « offres les plus utilisées » irait dans Statistiques, sur décision de Carlos.
7. **F18** : onglet « Sites et pages » **gardé**, avec un vrai état vide (message qui dit pourquoi et quoi faire).
8. **F40** : **Apparence et Navigation remises côte à côte** dans Réglages (P4) ; les autres sections restent pleine largeur.
9. **F27** : unifier les trois composants de chiffres clés **dans P5**.
10. **Budget P5** : **zéro**, le plancher de 14 px devient absolu (plus aucune déclaration sous 14 px ; le budget disparaît à la fin au profit d'un test sans exception).

## Révisions

(aucune pour l'instant)

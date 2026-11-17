# P6 : filet de sécurité et états rares (fiche courte de la passe de finitions)

Statut : **proposition, à valider par Carlos avant tout plan et tout code** (règle J).
Skills : `superpowers:brainstorming`, `atoumweb-design` (audit, harden, adapt pour P6b). Thème Noir, densité Confort (règle E).
Entrées du registre `FINITIONS.md` : F47, F48, F49, F50, F51 (filet de sécurité) ; F7, F19, F30, F36, F41, F42 (états rares). F9 reste « chaque lot ».

## D'où viennent les constats

Diagnostic du 15/11/2026, sur le dernier commit `cd115045`, arbre propre : les trois bancs d'atelier rouges lancés, deux sondes jetables (copies dans `outputs/`, ignoré par git), une expérience temporaire de trois lignes dans `DataTable.tsx` (annulée par `git checkout`, arbre revenu propre). Lu : `check-ux-v2-lot01b/01d/01f-workshop.cjs`, `ui/DataTable.tsx`, l'historique git de `ColumnSizer`, `scripts/fixtures/integration-02-03-scenarios.cjs` (F47), `check-contract-library-ui.cjs` (F48).
**Non vu** : le redimensionnement de colonne à la souris dans l'application elle-même (conclu par les bancs et la lecture du code) ; aucune capture nouvelle pour cette fiche ; les états rares (P6b) n'ont pas été regardés.

## Ce que le diagnostic dit

| Entrée | Cause établie | Nature |
|---|---|---|
| **F49** | `check-ux-v2-lot01b-workshop.cjs` ligne 20 : `files.length===31` ; `main.tsx` importe **37** feuilles CSS depuis R1 et R2 | attente figée périmée (règle H) |
| **F50 et F51** | **Défaut du produit.** `DataTable` donne à `ColumnSizer` la largeur **avec l'aperçu** ; son effet `[id, width]` se nettoie au premier aperçu et **annule le geste** : la largeur revient, rien n'est écrit. Introduit par `50b749b0` (22/10/2026), `b3cdf081` (15/10) l'avait corrigé. **Le redimensionnement de colonne à la souris ne marche donc pas** dans tous les tableaux (le clavier, si). Une seule cause pour les deux bancs | défaut du produit, correctif de 3 lignes, banc 01d (127 contrôles) et 01f (123 et 14) verts avec l'expérience |
| **F47** | `integration-02-03-scenarios.cjs` clique `.prospect-desk-overlay .start-qualification-button`, `.qualification-panel-v2`, « Enregistrer la qualification » : l'ancien « bureau de travail » a été remplacé par la fiche de R3 (Besoins, Prochaine étape) | parcours à réécrire (148 lignes, 32 contrôles) |
| **F48** | `check-contract-library-ui.cjs` lignes 254 et 258 : deux contrôles **sautés** (zone de lecture masquée dans un `details` fermé ; aperçu client paginé) | contrôles à rendre réels |

## Proposition

**Deux lots**, dans cet ordre :

**P6a Filet de sécurité** (code et scripts, un écran touché : les tableaux) :
- F50 / F51 : correctif de `DataTable` (largeur enregistrée, sans l'aperçu, pour `ColumnSizer`), **test d'abord** (garde de source et banc natif), bancs 01d et 01f au vert ; vérifié aussi sur une vraie page (Dépenses, Facturation) avec capture avant / après du geste.
- F49 : remplacer `=== 31` par une règle durable (au moins 31 feuilles ; ordre relatif des couches vérifié : typographie avant cohérence globale, etc.), règle H.
- F47 : réécrire le long parcours sur la fiche actuelle.
- F48 : rendre les deux contrôles réels.
- Résultat attendu : **plus aucune recette rouge sans raison connue** (`check-ux-v2-03e-directory` verte, bancs 01b, 01d, 01f verts).

**P6b États rares** (captures, correctifs d'écran) : regarder ce qui n'a jamais été vu, corriger ce qui relève de la charte, inscrire le reste. Ce qui sera regardé : devis envoyé et accepté, étapes 2 à 5 de l'assistant, étapes « négociation » et « en attente » de la fiche prospect (F7) ; Sites rempli (F36) ; onglets de Réglages et confirmations (F41) ; projet terminé, incident, maintenance expirée, pack épuisé (F19) ; chrono en cours (F30) ; états d'erreur, noms très longs, fenêtre étroite, clavier (F42).

## À toi (disposition et périmètre)

1. **Découpage** : P6a puis P6b (recommandé), ou un seul lot P6.
2. **F47** : (A, recommandé) réécrire le parcours en gardant **les contrôles qui protègent un comportement encore vivant** (recherche qui replace le focus sur la fiche, « Rester » par défaut quand une saisie est modifiée, enregistrement refusé qui garde le brouillon) et en abandonnant ceux qui visent des éléments disparus ; (B) tout réécrire, 32 contrôles ; (C) retirer le parcours et garder les recettes de P3a (`--desk`, `--ux-lot`) et les 857 contrôles.
3. **F48** : (A, recommandé) rendre les deux contrôles réels (ouvrir le `details`, vérifier le texte dans l'aperçu client paginé) ; (B) retirer les deux lignes.
4. **États rares** : (A, recommandé) forcer les états **dans la copie jetable** de l'outil de capture, sans rien écrire dans la préproduction ; (B) étendre les scripts de cas de figure (F19, F30) et les appliquer à la préproduction, **sur ton accord explicite** après simulation. Sites rempli (F36) ne peut pas être préparé sans fichier Bridge : forcé dans la copie, ou laissé « non vu » si ce n'est pas possible.

## Hors périmètre

Petits textes sous 14 px et chiffres clés (P5) ; styles AtoumWeb et Blanc, densités Compact et Confort + (fin de refonte) ; acompte par défaut (lot dédié) ; aucune donnée, règle métier ni parcours modifiés.

## Preuves prévues

P6a : tests d'abord, typecheck, suite complète (311 fichiers, 2 532 tests aujourd'hui), les quatre scripts natifs sans option, bancs 01b, 01d, 01f verts, `check-ux-v2-03e-directory` verte, `check-contract-library-ui` sans contrôle sauté, `check-home-shell-lot1` relancée, budget des petits textes 617 et `!important` ≤ 86 inchangés, captures avant / après du redimensionnement. P6b : captures `captures-p6b\` (avant / après) et liste des défauts trouvés.

## Décisions de Carlos

Validées le 15/11/2026 dans le chat, les quatre selon la recommandation :

1. **Découpage** : deux lots, **P6a Filet de sécurité** (F47 à F51) puis **P6b États rares** (F7, F19, F30, F36, F41, F42).
2. **F47** : option A, réécrire en gardant les contrôles qui protègent un comportement encore vivant, abandonner ceux qui visent des éléments disparus.
3. **F48** : option A, rendre réels les deux contrôles sautés.
4. **États rares** : option A, états forcés dans la copie jetable de l'outil de capture, rien n'est écrit dans la préproduction.

Annoncés sans question (règle A) : F49 (règle durable à la place de `=== 31`) et le correctif de F50 / F51 (restaure le comportement de `b3cdf081`), tests d'abord.

## Révisions

(aucune pour l'instant)

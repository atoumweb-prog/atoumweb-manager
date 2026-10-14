# 02E — Parcours transverses indépendants et focus réel

Référentiel [LOT-02E-RECETTE-ET-MIGRATION.md](https://github.com/atoumweb-prog/atoumweb-manager/blob/docs/ux-v2-reference-v1/docs/ux-v2/LOT-02E-RECETTE-ET-MIGRATION.md), lu avant développement. Poursuite autonome autorisée, sans fusion ni modification de #98. Branche `codex/ux-v2-02e-transverse-shell` depuis #100 àd3ef589.

## Baseline et périmètre

Main278ff2da inchangé ; #99/#100 drafts à7549770/d3ef589. Registre UX-01 réellement présent et unique. Anciennes références recontrôlées : #81/#84 fusionnées, #83 fermée sans fusion, #80 ouverte, #82 ouverte/draft à0bb0860. La protection UX-01 actuelle vient du socle intégré ; ne pas prétendre que #83 a été fusionnée. E42 optionA conservée ; E59/pipeline reste le périmètre #98.

Le lot02E est une recette/intégration transverse, **pas un nouveau module métier**. Ce jalon développe ses corrections indépendantes, son banc de parcours réels et sa cartographie de convergence ; il ne déclare pas la clôture globale02E ni l'intégration CRM combinée.

## Défauts reproduits puis corrigés

1. **Commande Rechercher sans focus réel** : l'effet ciblait uniquement #header-demo-search. Le champ de production est désormais focalisé après ouverture, y compris si le panneau était déjà ouvert.
2. **Champ masqué pendant frappe au breakpoint** : une réduction1510→850px cachait la recherche inline et le focus devenait BODY. L'en-tête existant conserve le champ/sa saisie en présentant la couche correspondante. Un focus dans un éditeur de module ne lance pas la recherche ; aucun raccourci global ajouté. Les dialogues réels du chrono restent prioritaires.
3. **Recherche flottante après ouverture réussie** : la liste se fermait, mais pas sa représentation dans l'en-tête. La présentation ne se ferme désormais automatiquement qu'après opened ; Rester/erreurs conservent requête et couche. Le même dossier reste monté et reçoit son focus sans réinitialisation.
4. **Fiche Historique non reconnue** : son panneau visible utilisait une classe différente du panneau Annuaire. L'adaptateur commun reconnaît aussi cette présentation, refuse un panneau caché, privilégie le modal visible et vérifie les remplacements de panneau à ID constant. Test sur un Prospect archivé avec l'API métier existante en TEMP, sans modifier ProspectsPageV2.

Fichiers applicatifs modifiés : App.tsx, GlobalSearch.tsx, WorkspaceHeader.tsx, useSearchTargetConfirmation.ts. **Aucun des trois fichiers communs à #98 n'a été édité**, aucun fichier métier backend/preload/migration, aucune règle E72/E73 modifiée. Les nouveaux scripts réutilisent le banc partagé via une entrée générée propriétaire supprimée après usage, sans réécrire ce banc en conflit.

## Preuves réellement exécutées

**SHA de code : bf7eae0bf35289bbbf933ed3ea733c34d1c2551a** ; arbre01f07154e47ecf08c2d049599aab47244aca8fdb. Working tree propre avant/après la recette groupée `node scripts/check-ux-v2-02e-validate.cjs`.

Manifest : outputs/02e-bf7eae0b-1791917001299/manifest.json. Pas de nouvelle exécution présentée à partir d'un ancien rapport.

| Contrôle | Résultat réel |
|---|---|
| Carte de compatibilité statique | Présences/empreintes des trois sources vérifiées, aucune exécution combinée |
| Typecheck | OK,7,09s |
| Ciblés navigation/registre/drafts | 54/54,3 fichiers |
| Suite Vitest,2 workers | **963/963**,102 fichiers,73,91s Vitest/74,44s processus |
| Restaurations, incluses dans la suite | 35/35,3,868s |
| Équivalence binaire, incluse dans la suite | 6/6,73ms |
| Nouveaux parcours Electron02E | **61/61**, renderer/preload/IPC réels |
| Recherche02C | 92/92 |
| Accueil02D | 54/54,9 captures synchronisées |
| Shell réel/17 routes | 374/374,63 captures synchronisées, étroit/zoom |
| UX-01 B/C/revue | 183/183 |
| Atelier en-tête02B | 167/167 (158 initiaux +9 après relance) |

Aucun RPC, timeout, assertion supprimée ou hausse de délai. Les erreurs IPC délibérément injectées dans les bancs existants restent enregistrées et leurs effets assertés. Les profils et SQLite sont TEMP ; integrity/FK/migrations1–66 contrôlés et nettoyages confirmés. Le nouvel itinéraire compare toutes les tables et tous les settings hors **seul** propriétaire de préférences visuelles ; traces historiques de synchronisation CGV qualifiées précisément. Les créations/archivages et sessions de test sont explicitement réalisés sur TEMP, pas sur une base réelle.

## Couverture des critères02E

| Critères | Preuves et limites |
|---|---|
| 01 | Fiche historique réelle et ID/focus ; agrandissement/bureau testé par les bancs existants, pas certification complète du futur parcours Conversion |
| 02/09 | **Projection pipeline/comptages E72/E73 combinés réservés à la convergence #98**, non validés ici |
| 03 | Rail E42/17 routes conservés et banc shell rejoué ; pas de nouvelle règle de navigation de groupe |
| 04 | Favori Offres & Tarifs restauré après vrai reload, puis recherche article par ID |
| 05/06 | Devis dirty → Projet : une confirmation, Rester préserve exact DOM/texte, Quitter n'enregistre pas la saisie ; voisinage contractuel rejoué par UX-01 |
| 07/08/17 | Véritable session unique pendant navigation/repli, récupération réelle après interruption TEMP, dialogues et choix préservés |
| 10/11/12/18 | Banc Accueil rejoué : alertes/cache/erreurs, accès honnêtes sans insertion, reset seulement visuel |
| 13/14 | Frappe d'un formulaire Client préservée au resize, aucune recherche lancée ; focus/Tab/Shift-Tab/Échap dans neuf variantes, étroit/zoom par shell |
| 15/16 | Anti-races/introuvable via recherche02C rejouée, pas de faux succès |
| 19 | Ressource Bibliothèque → Contrats → retour même ID, états du header/bandeau indépendants |
| 20 | Typecheck, suite et bancs au SHA annoncé, preuve locale distincte d'une future CI |

## Convergence et publication

[Matrice et tests d'intégration préparés](LOT-02E-CONVERGENCE-03C-2026-10-13.md). #98 a évolué à46a190f pendant le travail ; ses trois fichiers communs sont inchangés depuis69e8904, mais son nouveau CI ne doit pas être confondu avec746. Rien n'a été importé, fusionné ou remplacé depuis cette branche.

Publication autorisée dans une **PR draft distincte vers main**, pour une seule CI candidate automatique du workflow existant. Cette branche contient les parents #99/#100 ; son delta indépendant est celui comparé àd3ef589. Ordre d'intégration à décider : #99 → #100 → ce complément, puis convergence CRM en branche explicitement autorisée. Les résultats CI seront ajoutés au corps de PR sans second push documentaire.

**Jalon indépendant validé localement ;02E global reste ouvert** : convergence CRM, projection Accueil sept étapes et validation humaine globale différée. Les17 modules sont toujours des couvertures partielles, jamais une certification universelle de tous les sous-éditeurs. Aucun merge, rebase, force-push, modification #98, budget ou Validation-MSI.

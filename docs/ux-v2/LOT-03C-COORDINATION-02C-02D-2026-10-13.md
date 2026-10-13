# Coordination UX V2 : PR #99 (02C), #100 (02D), #98 (03A–03C)

**13 octobre 2026 — note préparatoire, aucune fusion.**

## Bases et validations réellement observées

| PR | HEAD vérifié | Base déclarée | CI vérifiée | Portée |
| --- | --- | --- | --- | --- |
| #99 — 02C | `7549770428fcbb53d89a60fcc92dd5cb6d8f258d` | `278ff2da022ba5e58ae333de11e74bc4d12a2995` | #737 SUCCESS, 943/943 Vitest | recherche ciblée, navigation et protections UX-01 |
| #100 — 02D | `d3ef589be9090bc1a5f04cab625228d2a4aa42d7` | `278ff2da022ba5e58ae333de11e74bc4d12a2995` | #741 SUCCESS, 963/963 Vitest | Accueil, alertes, widgets ; **contient également les commits de #99** |
| #98 — 03A–03C | `9f697b0c9c0d7e99e928843bf5438670f20bbb79` | `278ff2da022ba5e58ae333de11e74bc4d12a2995` | #740 SUCCESS, 934/934 Vitest (102 fichiers), 66 assertions Electron, 9 captures vérifiées/empreintes, TEMP nettoyé | pipeline 6+1, E72/E73, qualification, besoins, pré-devis, attaches Contacts atomiques |

Les tests Electron supplémentaires annoncés par Codex sur #99/#100 sont des validations **locales distinctes** des CI publiées ; ne pas attribuer leurs assertions aux CI #737/#741. Les neuf PNG 03C du runner Windows #740 ne sont pas archivés en artefacts (quota GitHub) : seules les empreintes sont publiées ; la revue humaine reste requise.

## Recouvrements effectivement constatés dans les fichiers modifiés

Les listes de fichiers des PR ont trois chemins communs à #98 et #99/#100 :

1. `scripts/check-ux-v2-lot01a-real-ui.cjs` — **conflit probable sur les mêmes blocs** : #99/#100 ajoute le mode `--search-only`, collecte les vrais handlers IPC, et affiche une fenêtre en mode recherche ; #98 ajoute `--lot03b` et la capture de neuf panneaux commerciaux. Conserver les deux modes ; analyser l'ordre du parsing, des conditions d'exclusivité et les cas `--captures` ; ne pas remplacer l'un par l'autre.
2. `src/renderer/commercial/QuotesPage.tsx` — #99/#100 ajoute `useSearchTargetConfirmation`, `onEntityReady` et l'échec explicite de l'ouverture d'un Devis ; #98 ajoute `canAccessQuoteProject` pour respecter la préparation Projet/Devis. Conserver les deux comportements (ouverture par ID exact et règle commerciale réelle).
3. `src/renderer/crm/ProspectsPageV2.tsx` — #99/#100 ajoute la confirmation de cible de recherche et l'API `onEntityReady`; #98 restructure le pipeline 6+1, historique Conversion et sélection des étapes commerciales. Garder la confirmation sur un Prospect effectivement chargé, y compris dans les vues Annuaire, Pipeline, Historique et Conversion. Empêcher les réponses tardives ou la sélection d'un ID inconnu de perdre la saisie.

**La liste de fichiers communs ne signifie pas automatiquement trois conflits Git hunk par hunk.** Le banc Electron modifie effectivement la même zone de parsing et de bootstrap. Pour les deux composants métier, vérifier les vrais marqueurs de conflit sur un rapprochement isolé plutôt que réinventer les modifications.

## Ordre de rapprochement proposé — sous autorisation distincte

1. Préserver les trois PR **draft** et leurs SHA ; ne pas fusionner sans autorisation.
2. Lorsque la fusion de #99 aura été autorisée et validée, évaluer #100 **après** #99 : sa base actuelle est main mais son historique contient 02C. Recontrôler le delta spécifique 02D par rapport à `7549770`, puis les tests combinés 02C+02D.
3. Créer ensuite une **branche de consolidation jetable/dédiée** depuis la cible autorisée mise à jour, sans rebase ni force-push sur #98. Y réappliquer 03A–03C avec résolution humaine des trois chevauchements.
4. Recette croisée : `--search-only` sur Prospect/Devis (ID exact, 2 réponses IPC tardives, introuvable), `--lot03b` E72/E73/Conversion/UX-01/Contacts, routes des 17 modules, widgets Accueil et priorité des alertes, tests du vrai brouillon pendant navigation depuis l'Accueil, tests SQL integrity/FK/migrations et restaurations.
5. Vérifier retour focus, Tab/Shift-Tab, 3 thèmes × 3 densités, fenêtre étroite/zoom et aucune perte de saisie entre Home → recherche → Prospect → Devis → Client.
6. **Pas de fusion de la branche de consolidation ni de la PR #98 sans feu vert explicite.**

## Réserves métier qui restent ouvertes

- La projection commerciale sur l'Accueil (02D R02D08–10) est volontairement non réalisée par #100 car dépendante de la source 03A–03C : ne pas l'annoncer complète avant le rapprochement.
- Protection universelle de tous les sous-éditeurs : reste une recette par module, non certifiée par le seul passage du shell.
- Plusieurs opérations Identité (société, coordonnées, qualification) restent des IPC distincts ; seules la création+liaison du Contact principal et du décisionnaire ont été rendues atomiques côté #98.
- Vérifier les écrans réels après le rapprochement, et conserver les anciennes migrations et contrats Abby sans modification.

**Cette note est une cartographie de convergence, pas une autorisation de fusion et pas une validation d'intégration.**

## Mise à jour du 13/10/2026 — PR #101 (02E)

- **PR #101** : `codex/ux-v2-02e-transverse-shell`, HEAD `bd1985b33f56bd1e37902d4bc91af41b868806dc`, **draft**, base commune `278ff2da`. [CI #760](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38450317465) **SUCCESS** (typecheck, 963/963 tests). Le code testé `bf7eae0` est suivi du HEAD documentaire `bd1985b`.
- #101 **contient** les incréments #99 (02C) et #100 (02D) : en cas d'autorisation de fusion, respecter l'ordre **#99 → #100 → #101**, vérifier le delta propre à chacun et les nouveaux HEAD, sans intégrer deux fois la même évolution.
- Delta **propre 02E vs #100** : 11 fichiers, notamment `WorkspaceHeader.tsx`, `useSearchTargetConfirmation.ts`, `GlobalSearch.tsx`, scripts 02E, App et documentation. **Aucun nouveau chemin commun avec #98** : les trois chemins de recouvrement restent `scripts/check-ux-v2-lot01a-real-ui.cjs`, `QuotesPage.tsx`, `ProspectsPageV2.tsx`. Les conflits sémantiques peuvent toutefois dépasser ces fichiers.
- Matrice Codex : `docs/ux-v2/LOT-02E-CONVERGENCE-03C-2026-10-13.md` sur #101. Ses scénarios **C01–C11** restent à exécuter sur un **commit combiné** : aucun passage réussi des CI isolées ne prouve la convergence.
- **#98 a progressé depuis les SHA de la matrice Codex** : code de sécurité Projet/Budget validé sur `f2afd34d4c08200923c5c183e1c7efbb61cd3d88`, [CI #769](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38451894534) **SUCCESS** (943/943 Vitest, 75 Electron). Qualif. commerciale sous contrôle optimiste sur une version ultérieure en vérification.
- La projection commerciale de l'Accueil (02D) et la certification **globale** de 02E restent bloquées par les tests combinés. Ne rien fusionner ni modifier les PR #99/#100/#101 à partir de #98.

**Ce document ne constitue ni un merge, ni une rebase, ni une validation de compatibilité.**

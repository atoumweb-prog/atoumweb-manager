# 01E + 01F — Préparation de publication contrôlée

13/10/2026. Nouvelle branche `codex/consolidation-ux-v2-01ef`, dérivée du correctif validé. **PR non créée : son ouverture déclencherait une CI non encore autorisée.** Un push de cette branche seule, sans PR, est couvert par l'autorisation conditionnelle et ne correspond à aucun déclencheur automatique vérifié.

## Historique et arbre après actualisation

Références recontrôlées inchangées : main `31167754cbb16dcca323c9f5e0e8db3ea27a3004`, correctif `1e593d0c4e0f01cbdf1166d043a1cd3bb6016263`, code testé initial `85040fb898356c0d482f7a27fcd617baf62e2970`.

Merge normal local **`00f37774a0b780fa017dd59f5fd78a9d641bab41`** : parents correctif1e593d0 et main31167754. Sortie0, aucun conflit, arbre **`ee378ea0ddf0cf16665886b45150f112c4040cd6`** exactement identique au correctif validé ; aucun fichier modifié par le merge. Historique E → F → correctif conservé. Main est désormais ancêtre du candidat.

Le présent commit ne modifie que documentation et suivi. Les derniers tests seront exécutés sur son HEAD exact avant le push ; aucun nouveau commit ne sera ajouté ensuite. Le bilan de livraison/description de PR préparée consigneront ce SHA et les résultats réels. Cela évite de faire avancer le candidat après ses validations.

#90@4653e58cfc6bfa338d34ece98fd9cb945d020656 (base89), #91@765f66dbce2b08d2624e496c7dd8a5555edc8e20 (base90), #92@893b40bca5714c2cf595ec8643558b479d40fdbb (base91), #93@f7e2ae9b934853a34994fcbf3ece577f8fb0e88c (base92) restent drafts, branches/bases inchangées.

## Contrôles et distinction des preuves

- Typecheck et suite complète ont réellement été rejoués sur le merge00f37774 : **867/867**,94fichiers,113,60s,sansRPC ; restaurations35/35,A→B4,951s.
- Le correctif85040fb disposait des preuves validées : ciblés97/97, F137/137 dont61nouvellesassertions, E95/D126/C66/UX-01183. Ces nombres sont des preuves **antérieures**, pas encore une exécution du dernier candidat documentaire.
- Après ce commit : typecheck, ciblés, suite complète/restaurations et bancs F/E/D/C/UX-01 seront rejoués sur un checkout propre du HEAD final, manifestes au SHA exact. Le bilan final distinguera les résultats réellement obtenus.
- Le diff source depuis85040fb est vide. Code des61assertions permanentes présent dans scripts/fixtures/01ef-escape-scenarios.cjs, appelé par le banc01F. Aucun backend, preload, gardeUX-01, servicecommercial/temps/restauration, contrat/CGV ou migration ajouté/modifié.
- Fixtures TEMP uniquement ; compare des tables horssettings, intégrité/FK/migrations1–66 et cleanup. Aucune utilisation Validation-MSI ni donnée réelle.

## Déclencheurs vérifiés avant publication

Le seul fichier workflow dans les arbres main et candidat est **.github/workflows/ci.yml** ; son contenu est inchangé. L'API GitHub confirme cette liste dans main.

| Action | Conséquence actuelle |
| --- | --- |
| Push codex/consolidation-ux-v2-01ef sans PR | Aucun run : cette branche n'est pas dans on.push.branches |
| Ouvrir une PR, même draft, cible main | **Run automatique CI/quality via pull_request opened** : main est dans on.pull_request.branches ; aucun filtre excluant les drafts |
| Push ultérieur dans une PR ouverte | Peut déclencher pull_request synchronize : ne pas avancer le HEAD pendant la candidate |
| workflow_dispatch ou rerun | Déclenchement supplémentaire manuel, non autorisé et non effectué |
| Merge futur main | Déclenche push main / CI post-fusion, autorisation distincte obligatoire |

Les autres branches push listées sont foundation/electron-react-sqlite, feature/phase-1-crm, feature/phase-2-commercial, feature/phase-3-projects, feature/phase-4-operations, fix/recette-commerciale-coherence, feature/prospect-workflow-v2. Aucun wildcard pour codex ou consolidation.

L'API Actions conserve aussi l'inscription historique **Prospect Recipe Validation**, id359319559. Son fichier a été retiré par3bc0f19 et est absent du candidat/main ; son ancienne définition d238dc8 ciblait uniquement push fix/prospect-recipe-ux-v2 et workflow_dispatch. Son dernier run connu35057438720 date de cette ancienne branche. Cette inscription historique ne fournit aucun déclencheur pour la publication actuelle. Aucun ancien run n'est relancé.

## Arrêt et autorisation CI requise

La branche peut être poussée seule après tests verts et un dernier recontrôle des triggers/références. **Ne pas créer de PR à ce stade.** Ne pas ajouter skipci pour ouvrir une PR sans contrôles, désactiver/modifier le workflow, créer la PR vers une autre base puis retargeter, utiliser une condition draft ou changer un budget : ces moyens contourneraient le déclenchement à autoriser.

Après accord explicite pour la candidate :
1. Recontrôler main et HEAD publié, absence de PR/candidate existante.
2. Ouvrir une **unique PR draft groupée vers main** sur le HEAD déjà testé, qui ne contient pas skipci dans son dernier commit.
3. Laisser l'événement opened déclencher le run ; identifier son SHA/checkout synthétique et vérifier ses parents/arbre. Aucun workflow_dispatch, rerun, push ou commit vide additionnel si le run existe.
4. Un seul run attendu de ce workflow pour cette ouverture et ce HEAD ; vérifier l'inventaire des runs, ne pas considérer cette procédure comme une garantie absolue contre une action manuelle externe. Si absence/refus de run, diagnostiquer sans relance implicite ni modification de facturation.
5. Installation npmci, Node24/Windows2022, typecheck, Vitest2workers/restaurations/RPC. Les61assertions Electron sont locales : le workflow actuel ne lance pas ces bancs, distinction à garder dans la PR.
6. Candidate verte et nouvelle validation humaine avant tout merge main/postCI. Les originales90–93 restent intactes ; aucunretarget/fermeture automatique ni reprise02A/02B/02C.

Consommation pendant cette préparation : **0 CI**. Plan futur : **1 candidate**, puis **1 post-fusion** sous autorisation séparée. Budgets/paiements/Stop usage inchangés.

Risques résiduels : variabilité Windows surA→B (seuil inchangé), périmètre ateliers/fixtures plutôt que17modules ou chrono réel, CI ne rejouant pas les bancs Electron, et effets d'éventuelles nouvelles références/actions GitHub externes entre préparation et ouverture. Aucun changement métier introduit.

# 01E / 01F — Correctif Échap et consolidation locale validée

12/10/2026. **CONSOLIDATION 01E / 01F — PRÊTE À SOUMETTRE À VALIDATION**, après correction locale du blocage décrit dans la préparation validée sur `codex/prep-consolidation-01ef@ffab359`. Cette conclusion n'autorise ni publication, CI, PR, merge main ni reprise02B.5/02B.6/02C.

## Références

- Nouvelle branche corrective uniquement : `codex/fix-ux-v2-01ef-escape`.
- Base exacte #91 : `765f66dbce2b08d2624e496c7dd8a5555edc8e20`.
- Commit de code/tests validé : **`85040fb898356c0d482f7a27fcd617baf62e2970`**, message skipci, non poussé.
- Main officiel recontrôlé après tests : `31167754cbb16dcca323c9f5e0e8db3ea27a3004` ; branche locale main ancienne2b390632 laissée intacte.
- #90 `4653e58cfc6bfa338d34ece98fd9cb945d020656`, base #89 ; #91 ci-dessus, base #90 ; #92 `893b40bca5714c2cf595ec8643558b479d40fdbb`, base #91 ; #93 `f7e2ae9b934853a34994fcbf3ece577f8fb0e88c`, base #92. HEAD/bases/drafts inchangés.

## Cause et correction

FoundationWorkshop garde volontairement les deux ateliers montés, via hidden. Le tableau écoutait Escape sur window même quand caché. Le formulaire traitait la même touche sans stopper sa propagation. D'où deux confirmations ou démontage du tableau propre malgré Rester dans le formulaire actif.

- `TableWorkshop` : écoute globale supprimée, traitement local à sa zone React. Escape n'est traité que si l'atelier est actif, l'événement non consommé et hors composition IME ; l'événement traité est consommé avant requestUnsavedExit.
- `FormFeedbackWorkshop` : même filtre de propriété de l'événement et stopPropagation après traitement local de l'éditeur A/B.
- `FoundationWorkshop` : transmet active à l'atelier de l'onglet courant, **sans conditionner son montage**. Les deux composants, leurs états, baselines et inscriptions UX-01 restent montés.
- active est optionnel et vrai par défaut pour les ateliers autonomes ; manageLifecycle reste indépendant. Aucun nouveau registre, dialogue de sauvegarde ou mécanisme de protection.

Escape hors atelier ne ferme plus sa fiche ; les couches qui ont déjà consommé la touche et l'aide imbriquée gardent la priorité. Les autres touches/raccourcis et les mécanismes de navigation existants sont inchangés.

## Tests permanents ajoutés

`scripts/fixtures/01ef-escape-scenarios.cjs` est invoqué systématiquement par le banc existant `check-ux-v2-lot01f-workshop.cjs` en phase initiale, uniquement sur son profil et ses bases TEMP. **61 nouvelles assertions**, en plus des76 contrôles précédents.

| Cas | Assertions explicites |
| --- | --- |
| A dirty + tableau caché dirty, Escape / Rester | Exactement1confirmation, détailA seulement, défautRester ; textesA/B/tableau inchangés, mêmes éléments DOM et token de fiche |
| A dirty + tableau caché propre, Escape / Rester | Exactement1confirmation ; A conservé, sélection et instance cachée identiques, aucun démontage |
| Sens inverse : tableau actif + A/B cachés dirty | Exactement1confirmation appartenant au tableau ; aucun nettoyage/remount des formulaires |
| Événement extérieur / caché | Escape dans réglage apparence :0confirmation ; dispatch vers atelier inactif :0confirmation, identité conservée |
| Changements d'onglets | Six bascules :0confirmation, textesA/B/tableau et identités DOM conservés |
| Aide imbriquée | Premier Escape ferme uniquement l'aide,0confirmation et focus rendu ; Escape suivant dans la fiche :1garde de tableau |
| Événement consommé / IME | 0confirmation ni fermeture parasite, dans les deux ateliers |
| Pending A | 1confirmation A, Rester seul ; enregistrement et tableau conservés. Nouvelle saisie pendant save puis bascule : réponse ancienne ne perd ni texte récent ni autre brouillon |
| Quitter A | 1confirmation ; ferme A seulement, B/tableau restent montés et leurs textes intacts |
| Quitter tableau | 1confirmation ; ferme sa fiche seulement, identités/textes des formulaires cachés conservés |
| Préférences | JSON settings de dispositions strictement identique avant/après toute la série Escape/onglets/confirmations |

Les touches critiques sont envoyées par Electron natif dans une fenêtre réellement focalisée. Les probes consommées/IME/atelier caché sont explicitement des événements DOM synthétiques complémentaires, pas une frappe physique revendiquée. Les réponses du dialogue utilisent le mécanisme natif UX-01 existant et ses choix sûrs ; pas de garde contournée.

L'ancien diagnostic avait deux sorties1. Les assertions correspondantes sont désormais permanentes et passent ; aucun test existant supprimé, assertion affaiblie ou timeout augmenté. Les champs restent simulés, sans service métier ni Enregistrer et quitter.

## Exécutions Windows finales au SHA85040fb

Checkout propre, manifestes E/F/D SHA exact et dirty:false. Runtime Vitest Electron44.3.0 / Node24.20.0 ; dépendances locales existantes, lockfile inchangé ; aucune installation ou CI nouvelle revendiquée.

| Contrôle réellement exécuté | Résultat |
| --- | --- |
| Typecheck | OK, sortie0 |
| Ciblés Vitest (9fichiers) | **97/97**, 0,927s |
| Suite complète à2workers | **867/867**, 94fichiers, **104,73s**, sortie0 sans RPC |
| restore.test.ts | **35/35**, 66,892s ; A→B **4,464s** |
| Electron01F avec nouvelles régressions | **123+14=137/137**, deuxprocessus, deuxbasesTEMP, neufcaptures |
| Electron01E | **95/95**, neufcaptures |
| Electron01D | **126/126**, source120 immuable, neufcaptures |
| Electron01C | **66/66**, neufcaptures |
| UX-01 natif --lot-b --lot-c --review | **183/183**, troisthèmes, erreurs/version/refus/pending/fermetures/détachées/workspace différé |

Les61 nouvelles assertions sont des régressions **Electron**, pas des nouveaux tests Vitest : le nombre867 reste inchangé. Ces compteurs ne sont pas additionnés. Le banc01F standard lance toujours ces régressions ; le workflow CI actuel appelle seulement typecheck/Vitest et ne les lance pas automatiquement.

Les deux bases natives ont exactement les migrations1–66, integrity_check=ok et foreign_key_check=[] ; toutes tables hors settings avant/après sont identiques. Préférences d'apparence/restauration entre processus, indépendance entre deuxworkspaces et deuxfenêtres, refus d'écriture et reset sont aussi retestés dans le banc01F. Cleanup confirmé pour tous les bancs. Les erreurs Injected preference disk refusal et refus IPC de version périmée sont les scénarios attendus, pas des erreurs masquées.

Tests intermédiaires avant commit exécutés mais **non utilisés comme preuve de SHA final**. Captures/logs sous outputs ignoré ; pas de validation humaine globale/WCAG revendiquée. Aucun accès Validation-MSI.

## Diff exact du correctif

Cinq fichiers de code/tests depuis #91 :

- src/renderer/ui/FormFeedbackWorkshop.tsx
- src/renderer/ui/FoundationWorkshop.tsx
- src/renderer/ui/TableWorkshop.tsx
- scripts/check-ux-v2-lot01f-workshop.cjs
- scripts/fixtures/01ef-escape-scenarios.cjs

Diff correctif85040fb : +109/-9. Aucun diff backend/main, preload, migrations, contrats/CGV, services commerciaux/temps/restauration, architecture renderer UX-01 ou shared registries/draftSection, workflow, workers/délais/assertions existants. La section locale ajoutée au tableau a passé les recettes autonomes sans migration visuelle d'écran métier.

Documentation de livraison séparée : présent fichier et PROJECT_STATUS.md. Seule cette nouvelle branche est modifiée, aucune PR/commentaire GitHub changé.

## Nouvelle simulation groupée — non appliquée

Après toutes les validations, fetch/recontrôle de main puis `git merge-tree --write-tree origin/main 85040fb898356c0d482f7a27fcd617baf62e2970` : **sortie0, aucun conflit**.

- Merge-base : `366395ad402169c985f83fd46e808d89cc2f0b19`.
- Arbre main : `bf540eb34e21c5630ee4486be1b653a2f7fc54d0`.
- Ancien arbre91 non corrigé : `8a8fbb1834848d1bf9971724b9c845443d50c538`.
- **Arbre code85040fb et arbre d'intégration simulé identiques : `f7d7486d78103e1277889e7e977aeead4efc7e1d`.**
- Diff groupé code vers main : **23fichiers, +1209/-14**, historiqueE puisF puiscorrectif préservé. Aucun merge réel, aucun HEAD de main modifié. Main a4commits propres / sourcecorrigée35 ; ils seront réunis par un merge normal seulement après accord.

La documentation finale ajoute son propre commit ; la simulation de son HEAD sera également vérifiée sans appliquer de merge. Aucun changement source/tests entre le commit validé et ce commit documentaire.

## Risques et plan soumis à autorisation distincte

- Clôture du défaut au périmètre ateliers : pas une certification des17modules. Les risques Escape hérités relevés dans l'audit02B.4, les vrais dialogues chrono et les futurs ports restent distincts et suspendus.
- Les brouillons cachés restent enregistrés dans UX-01 et participent toujours aux gardes globales de quit/reload ; active ne sert qu'à la propriété de la touche. Ne pas réutiliser active pour désinscrire un brouillon.
- Les nouveaux tests doivent continuer à être exécutés par le banc01F. La candidate GitHub actuelle confirmera npmci/typecheck/Vitest/restaurations/RPC, **pas une exécution hébergée de ces bancs Electron**. Aucun changement de workflow proposé implicitement.
- A→B4,464s local ne garantit pas la vitesse Windows hébergée ; seuils inchangés, arrêt/diagnostic au premier échec. Pas de rerun implicite.

Ordre proposé :
1. Validation humaine du présent correctif et autorisation de publication de la branche corrective/rapport, sans toucher90–93.
2. Après accord, créer si souhaité une branche groupée depuis ce HEAD, recontrôler main/source, merge normal de main sur cette branche uniquement, comparer arbres et pousser normalement. Aucun rebase/squash/force.
3. Après autorisation explicite, ouvrir **une unique PR draft E+F+correctif → main**. Son ouverture peut déclencher la seule candidate ; prévoir un HEAD non skipci pour ce déclenchement autorisé, sans lancement manuel/commit vide supplémentaire si le run existe.
4. Candidate entièrement verte, référence exacte confirmée et accord distinct → merge commit normal dans main et **une seule CI post-fusion**. Budget/Stop usage jamais modifiés ; arrêt si blocage GitHub.
5. Décider séparément du traitement des originales et de l'actualisation92/93 pour hériter du correctif ; aucun retarget/clôture/push enfant automatique. 02B.5/02B.6/02C ne reprennent pas implicitement.

Consommation : **0 CI dans cette correction ; 2 prévues après autorisations — candidate + post-fusion**. Aucun push, PR ou fusion effectué. Validation-MSI et données réelles intactes.

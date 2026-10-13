# Préparation de consolidation #86 → #93 — 12/10/2026

**Préparation seulement : aucune fusion, aucun reciblage, rebase, squash, force-push ou workflow déclenché. 02B.3 suspendu.** Publication documentaire autorisée dans #93 ; son HEAD avancera uniquement pour ce bilan. Les pointages et simulations ci-dessous précèdent cette publication et restent attachés à leurs SHA.

## Pointage GitHub et dépendances

Départ local propre sur codex/ux-v2-lot02b-header-v1@88aedfe0d546b276dfc4e673220c26123757d703. Fetch effectué. Main officiel : **07dde9c85dab337ee0ed3a5a92034a139d7ebad2** ; sa branche locale n'a pas été basculée ni mise à jour. Toutes les PR sont OPEN, draft, MERGEABLE et sans check sur leur HEAD actuel. Chaque base est ancêtre de sa source, retard0.

| PR | HEAD avant bilan | Base effective | Commits propres | Fichiers | + / − |
|---|---|---|---:|---:|---:|
| 86 | 7f5dbbf2a462f652b32dd2a2c08a8039f516b778 | main@07dde9c8 | 29 | 9 | 1021 /2 |
| 87 | 2d1ddb7604422850df4921e10250b6186a0094b4 | feature/ux-v2-lot01a-typography-v1 (#86) | 48 | 27 | 2135 /31 |
| 88 | 0fab2ae50b029e3a0734d6d78833686f91224295 | feature/ux-v2-lot01b-components-v1 (#87) | 4 | 12 | 387 /0 |
| 89 | 366395ad402169c985f83fd46e808d89cc2f0b19 | codex/ux-v2-lot01c-panels-v1 (#88) | 8 | 21 | 898 /0 |
| 90 | 4653e58cfc6bfa338d34ece98fd9cb945d020656 | codex/ux-v2-lot01d-inventory-v1 (#89) | 31 | 12 | 776 /0 |
| 91 | 765f66dbce2b08d2624e496c7dd8a5555edc8e20 | feature/ux-v2-lot01e-form-feedback-v1 (#90) | 3 | 13 | 332 /13 |
| 92 | 893b40bca5714c2cf595ec8643558b479d40fdbb | codex/ux-v2-lot01f-preferences-v1 (#91) | 5 | 12 | 304 /1 |
| 93 | 88aedfe0d546b276dfc4e673220c26123757d703 | codex/ux-v2-lot02a-navigation-v1 (#92) | 4 | 13 | 265 /4 |

Chaîne linéaire : main →86→87→88→89→90→91→92→93. Cumul avant bilan : **132 commits,99fichiers,+6099/−32**, retard0 surmain. Aucun changement cumulé de src/main, schéma/migrations, contracts.ts, package/lockfile, Vitest, lanceur des tests ou workflow. Les nouvelles fonctions sont principalement renderer/shared/ateliers/docs ; #87 contient notamment les raccords de gardes Devis/Abby à conserver.

Le dépôt est privé, merge commits autorisés, suppression automatique des branches désactivée. ViewerPermission ADMIN et Actions enabled/all ; **main non protégée** selonAPI. MERGEABLE et droitsADMIN ne constituent donc jamais un feu vert automatique : la procédure impose checks réels et accord humain.

## Dernier échec main : pas corrigé dans la pile

[Run38006715403](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38006715403) : push surmain@07dde9c8, 09/10/2026 23:55UTC, conclusion failure. Windows2022, Electron44.3.0/Node24.20.0, Vitest3.2.7, deuxworkers.

- Installation OK20s ; typecheck OK19s.
- Tests : **800 réussis /1 échec,87fichiers**, duréeVitest345,63s ; job quality environ6min56s, run environ7min.
- Échec unique : restore.test.ts:151, « refuse A vers B avant toute copie et ne restaure pas A au démarrage suivant », **timeout20000ms**.
- Suite restore :35tests,34 réussis,1timeout,284,689s. Aucun échec d'assertion de sécurité identifié et aucune erreur RPC dans les logs examinés. Ce n'est pas une CI verte.

Les blobs suivants sont **strictement identiques surmain et chacun des huit HEAD** :

| Fichier | Blob |
|---|---|
| src/main/restore.test.ts | 1cc141e3dcc08082f1dfd8c7a7c09c50adf003a8 |
| src/main/restore.ts | 27b63af478b6273dcea43a5af6c02e5525d81c35 |
| vitest.config.ts | 45ddf673e4d00dab9f07865e4b5f903f953b7312 |

Le hook event-loop, le lanceur et les dépendances sont également sansdiff. Les correctifs antérieurs (chemins canonisés/mocks, fixture historique enmémoire/export, yield RPC) sont **déjà dansmain** : aucun correctif nouveau du timeout A→B dans86–93.

La CI pré-fusion [38006158408](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38006158408) était verte. Son checkout synthétique, **91b6d31bed184d1488d934a07fa14352ace5d50a**, etmain07dde9c8 ont le **même arbre4f8772e86f67cc9c2dffb54d23a88109bcbce98e** (logs du checkout etAPI commit contrôlés). Une régression de contenu introduite par le merge n'explique donc pas cet échec.

**Cause probable, pas démontrée par phase** : variation de performance CPU/disque/ordonnancement du runner au voisinage de20s, en présence de validationsSQLite et opérations disque. Le test programme/vérifie la source puis crée B ; applyPendingDatabaseRestore(B) rejette la destination avant toute copie/backupSQLite. Ne pas attribuer le timeout à une copie de restauration A→B réalisée : celle-ci doit précisément rester interdite. Les logs n'isolent pas le segment lent.

### Vérifications locales nouvelles, sans modifier le code

Sur88aedfe (code de restauration identique àmain), runtime Electron44.3.0/Node24.20.0, fixturesTEMP :

- Test A→B seul, trois processus : **3/3**, durées du test **4,665 /4,655 /4,644s**. Les34autres tests sont volontairement exclus dans cesruns ciblés, pas supprimés.
- Puis restore.test.ts entier : **35/35**, duréeVitest **73,59s**, A→B **4,727s** ; intégrité/FK/rejeu/concurrence/copie/refus des sources et préservation des données couverts par assertions existantes.
- Aucun timeout, assertion, limite deworkers ou fichier métier modifié. Pas de nouvelle suite globale884 répétée dans cette mission documentaire.

Ces résultats ne reproduisent pas le runner hébergé et **ne prouvent aucune correction définitive**. Avantfusion, obtenir une CI candidate verte contenant le main actuel. Si le timeout revient, arrêter : diagnostic par phases surfixtures et correction ciblée sousautorisation, sans augmenter arbitrairement20s ni affaiblir les assertions.

## Simulations sans application de merge

git merge-tree --write-tree utilisé pour **les huit paires base/source**, puis pour chaque source contre main actuel (16comparaisons). Pas de checkout de main, modification d'index, commit de fusion, branche temporaire, fichier appliqué ni changement de refs locales de travail.

| PR | Arbre résultant de sa base/source = arbre source |
|---|---|
| 86 | 8f0c01122598e1c8afbe228412bef3a695e79be1 |
| 87 | f3379980d9b1233f8dbd42f69c851f00f05826c7 |
| 88 | 7ffe6fe0084c39fd94bc640d27660fe071286daf |
| 89 | bf540eb34e21c5630ee4486be1b653a2f7fc54d0 |
| 90 | 7a6a9cb045a4479116c0373aff13059c0f36db1f |
| 91 | 8a8fbb1834848d1bf9971724b9c845443d50c538 |
| 92 | a08663d1ccf44e9ecd51759d115de28a3d170ace |
| 93 | 0779bac6764e4174aa83bd075f15de091d91e93e |

Toutes sorties0, aucun conflit. Les comparaisons directes àmain donnent aussi l'arbre source. Comme chaque enfant contient son parent et que les arbres projetés sont identiques aux sources, la progression86→93 conserve leur contenu **si aucun changement extérieur n'intervient**. Cela ne fabrique pas les futurs SHA de merge GitHub : recontrôler après chaque véritable merge, nouveau commitCI ou retarget autorisé. La publication du présent bilan ajoute uniquement desMarkdown à93 ; son nouveau HEAD est àpointage dans le commentaire depublication.

## Quota, protection budgétaire et nombre de CI

Le quota gratuit restant et Stopusage ne sont **pas confirmés aujourd'hui**. Budget0USD/StopusageYes : dernière déclaration utilisateur seulement. API usage utilisateur :404 avecscope user requis ; aucun jeton/scoperefresh ou budget modifié. Les droitsrepoADMIN ne donnent pas ce fait de facturation.

Pour un dépôt privé, allowance du propriétaire partagée au niveau compte ; dépassements potentiellement facturés et dashboard pouvant afficher un montant plutôt que desminutes. Référence : [facturationActions](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [budgets etarrêt](https://docs.github.com/en/billing/concepts/budgets-and-alerts). **Pas de conversion automatique walltime→quota disponible**, pas de passage public, largerrunner ou contournement proposés.

Chemin conservateur : **1CI candidate +1CI post-merge parPR** =6runs pour86–88, **16runs pour86–93**, sansrerun. Une CI séparée main avant86 serait optionnelle etporterait ce total à17 ; elle n'est pas nécessaire si la candidate86 teste explicitement l'intégration du main actuel. La précédente autorisation de principe des6runs ne vaut ni disponibilité actuelle, ni autorisation des10runs suivants.

Estimation de temps de calcul uniquement, surle run observé ~7min :42min pour6runs,112min pour16runs ; prévoir marge etconsommation partagée. Ce ne sont ni un solde dequota, ni une garantie de coût/durée. Confirmer dans l'interface du compte propriétaire : période/reset, allowance restante, budgetActions0USD etStopusageYes applicable. Si GitHubbloque le run, arrêter sanscontournement.

## Procédure proposée, une PR à la fois

1. **Gate initial86** : figer nouveaupointage main/source, comparer arbres etdiff ; typecheck/complet etrestaurations surcandidat Windows isolé, régressionstypo/renderernatif pertinentes. LaCI doit conserver Windows2022, Node24, npmci/lockfile, typecheck et npmtest --maxWorkers=2. Aucune CI déclenchée maintenant.
2. Aprèsconfirmation quota etaccord d'exécution : **un trigger unique**. PR86 cible déjàmain ; commitvide sansskipci seulement si nécessaire, sousautorisation, avecarbre inchangé. Un push qui déclenche laCI remplace dispatch/emptycommit additionnel ; nepasfaire dedoublon. ReleverHEADsource, base, checkout/mergeref réellement testé, résultats etdurées,35restaurations, A→B eterreursRPC.
3. Si rouge, arrêt total de laconsolidation. Si verte, présenter candidat etSHA pour **accord distinct de Ready/merge normal86**, sanssquash/rebase/force, sanssuppression debranche. Le message demerge ne doitpaspropager skipci ; **laCI post-merge main est donc àautoriser avantlemerge**.
4. Vérifier parents ducommit, nouvelorigin/main, arbre identique àcandidat saufdiffs explicitementreviewées, CIpost-merge verte. Si échecmain, nepascontinuer87.
5. **87puis88** : aprèsaccord, retargeter seulement laPRsuivante versmain ; intégrerorigin/main parmerge normal danssasource si nécessaire etautorisé. Les nouveaux commitsCI/merge créent desdifférences d'ascendance mêmequandcontenu esthérité. Vérifier diffpropre, arbres etabsence de conflit, contrôlesWindows puisCIunique. Présenter chaqueSHA/candidat avantdemander sonmerge. Ne passecontenter deMERGEABLE.
6. Mêmeprotocole **89→90→91→92→93**, aprèsles trois premiers. Pasdebascule de touteslesbases d'unseulcoup, ni d'absorption anticipée deslotsfuturs. Conserver touteslesbranches tantqueleurs dépendances sont ouvertes.

Activités duworkflow : pushmain etPR ciblantmain déclenchentquality ; lesPR empilées surbranchesUX ne correspondentpas au filtre. Ready/retarget seuls ne valentpas un run effectivementcréé. Le checkout PR est synthétique, celui d'un pushmain est lemergecommitréel : enregistrer lesdeuxréférences. Tous leschecks desHEAD actuels sontabsents, pas verts.

### Contrôles Windows par incrément futur

| PR | Complément ciblé àla suite complète etaux35restaurations |
|---|---|
| 86 | Typographie/densités, vrai renderer/17destinations et neufconfigurations |
| 87 | Boutons/champs/aide/icônes/notices, gardeAbby dirty/pending, UIUX-01 |
| 88 | ResizableSplitView/RecordPane, écriture unique fin degeste etannulation |
| 89 | Colonnes/vues/async/pages, réponsepérimée, mêmefiche/onglet/brouillon |
| 90 | États/formulairesA/B, snapshotsoumis, conflits etdialoguesnatifs |
| 91 | PréférencesSQLiteTEMP, deuxworkspaces/fenêtres, reset/restart sansmutation |
| 92 | RailE42,17destinations, focus/favoris etdemandeProjettemporaire |
| 93 | Headerdéveloppé/compact, slotschronoTEST etmotifs, pasraccourciglobal ; métier réel laisséintact |

Ne pas additionner assertions desbancs auxcompteursVitest. Les preuveslocales historiques801/810/846/859/867/877/884 ne sont pas desCIcandidate actualisées. Recettehumaineglobale toujoursdifférée ; scriptsnatifs propres au poste, aucuneValidation-MSI.

## Autorisations encore requises

| Action | Statut |
|---|---|
| Audit, simulations, tests locaux ciblés etpublicationMarkdown | Autorisés, réalisés sansactionmétier |
| Confirmerquota/restant/période etbudget0/StopusageYes | Faits àfournir avanttouteexécutionhébergée |
| TriggerCI86 / commitvide éventuel / push qui provoqueCI | Àautoriser aprèsconfirmationbudgétaire, unrun seulement |
| Correction de fixture/testtimeout si nécessaire | Proposition àvalider avantcode ; aucune correctiondanscebilan |
| Readyforreview etmerge86, avecCIpostmerge | Accordhumain distinct surleHEADvert exact |
| Retarget87 puis merge d'actualisation/push/CI | Accord pourcetteétape, pasréalisé |
| Chaqueprsuivante etchaquemergepostCI | Décisionuneparune ; extensionà16runs àvalider |
| Budgets/paiement/visibilité/force/rebase/squash/suppressionbranches/Validation-MSI | Non autorisés, aucunchangement |

Point ouvert de revue93 : Escape du panneau Options sansretourfocus explicite ; àtraiter dansun futur incrément02B.3, **noncorrigé pendantcette préparation**. Ce prototype n'estpasmontédansApp ; iln'explique pas letimeoutrestore préexistant. Aucun nouveau développement02B/02C/03.

**Conclusion : préparation desarbres favorable, fusion encore nonautorisée. RisqueCI20s noncorrigé etquota nonconfirmé ; aucun candidat n'est aujourd'hui déclaré prêtàfusionner.**

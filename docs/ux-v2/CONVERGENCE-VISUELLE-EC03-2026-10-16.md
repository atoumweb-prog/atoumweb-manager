# Préparation de convergence — visuel validé et EC03

État vérifié le 16/10/2026. **Aucune publication, PR, CI ou fusion exécutée pendant cette préparation.** Les branches sources restent intactes.

## Références exactes

| Niveau | Branche / référence | SHA | Situation |
|---|---|---|---|
| main | `origin/main` | `c4bb744dbe58531350a61fb16ad5f8fbe90bd59d` | Dernier distant contrôlé, arbre `710a062c6ec0dbe6f65fd2dae2e967b375cdf4cb` |
| Socle visuel | `codex/ux-v2-final-crm-brand-help` | `f66a06d11c13d8f0d4a0eb7a2eed2780f08e215b` | Distant, 23 commits / 139 fichiers au-delà de main ; aucune PR de cette branche trouvée par interrogation GitHub tous états |
| Prospect A | `codex/ux-v2-prospect-a-approved` / PR #154 | `03693f861c86ad77780d6f400b744cf7761cec15` | Distant, OPEN draft, base socle visuel, aucun check retourné ; 27 commits / 145 fichiers cumulés |
| EC01 | candidat de revue shell | `4f0b0a1234f06727ac0e219a2d401fbef7d8ce28` | Local, 30 commits / 148 fichiers cumulés |
| Client B | `codex/ux-v2-client-b-final` | `f85fd498ff9bbe8bc04242144d10efb737e91716` | Local, 31 commits / 152 fichiers cumulés |
| EC03 | `codex/ec03-explicit-contract-lifecycle` | `b77a3ce5015661ce2b12ac9b9e83459f3f2d8f26` | Local, 34 commits / 197 fichiers cumulés ; migration 71 incluse |
| Registre de migrations de recette | `codex/ux-v2-closure-convergence-audit` | `768b32b7f179a659b9631c6989948270a0d55053` | Local, 35 commits / 198 fichiers cumulés ; deux attentes 1–70 devenues 1–71, aucun fichier `src/` modifié |
| Visibilité des recettes Windows | `codex/ux-v2-closure-convergence-audit` | `ead8a16a684c89f2dbb9ec26763574adec3fb3fe` | Local, 36 commits / 198 fichiers cumulés ; affichage explicite des fenêtres voulues visibles, aucune modification de production |

Les nombres sont des différences **cumulées avec main**, pas des ensembles disjoints à additionner. Les documents de clôture sont un commit local ultérieur, explicitement distingué du SHA exécuté par les tests.

Dernière CI de main : **#1803 SUCCESS**, run [38685281188](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38685281188), `push` sur `c4bb744d…`. Logs réellement relus : **1 453 tests / 162 fichiers**, typecheck et `CONVERGENCE_COMPLETE`. Ce résultat n’est ni une CI des nouvelles corrections visuelles ni celle d’EC03. La suite locale récente compte 1 532 tests ; ne pas remplacer le nombre hébergé par ce nombre local.

## Simulations et absence de doublons

`git merge-base --is-ancestor` confirme la chaîne :

`main → socle visuel → Prospect A → EC01 → Client B → plan EC03 → EC03 → correctifs de recette → clôture documentaire`.

`git merge-tree --write-tree origin/main <candidat>` réussit pour chacun des cinq premiers candidats. Chaque résultat est exactement l’arbre du candidat, sans conflit :

| Candidat | Arbre simulé |
|---|---|
| Socle visuel | `d4cd84de38391b5b392fba71f4aad7a94bf8e8e3` |
| Prospect A | `f3523f795c59eb9d0d338bf5c29bf68a90e734e4` |
| EC01 | `111f3372361392887c4813784ec8310ef8118fe0` |
| Client B | `0f681e02c08f0ebd2c6852f109f8c356b2f5d65b` |
| EC03 | `3e9b851c1944a751eb0427911f30f70cf35304ef` |
| Registre de migrations de recette | `c0d861cdc99da4be5bd1cbd384a7274b02e2bfaa` — à recontrôler avant publication |

Simulation du candidat final `ead8a16a684c89f2dbb9ec26763574adec3fb3fe` également sans conflit : arbre `995d5ad06b67158dc34769b3dca8f5807054cfe2`, strictement identique au candidat.

Il n’y a pas à cherry-picker ces séries ni à fusionner leurs commits une seconde fois. La PR #154 reste empilée, sans retarget/fermeture ici. Prospect A et Client B ne sont pas redessinés. Leur code de production dans le candidat de recette est celui d’EC03, sans changement supplémentaire de cette mission.

## Migrations et compatibilité

| ID | Nom exact | Présence |
|---|---|---|
| 1–66 | historique du Manager | Inchangé |
| 67 | `catalog_category_registry_v1` | Déjà dans main |
| 68 | `catalog_version_recommendations_v1` | Déjà dans main |
| 69 | `contract_clause_section_review_v1` | Déjà dans main |
| 70 | `catalog_recommendation_details_v1` | Déjà dans main |
| 71 | `quote_contract_transmission_v1` | EC03 seulement, autorisation actuelle limitée aux bases temporaires |

Audit Git : 195 références locales/distantes après création de la branche de clôture, 15 worktrees contrôlés en lecture seule : aucune modification non commitée ou fichier non suivi dans `src/main/database`. Aucune donnée de workspace examinée. Les seuls hits de déclaration `id: 71` sont les deux branches locales EC03 et clôture, issues du même commit ; aucune seconde migration 71 détectée dans ces références. Ce relevé n’inclut pas une branche distante non récupérée ou un travail hors des 15 worktrees inspectés : recontrôler avant publication.

Les 53 fichiers sources liés aux migrations, hors agrégateur et tests, sont identiques à main. `migrations.ts` ajoute uniquement l’import et l’entrée 71 ; aucune réécriture des SQL historiques. Le schéma mémoire applique 1–71, intégrité `ok`, FK vide. Ancienne collision lot 05 67→69 : ne pas modifier une base persistante sur la foi de cet audit ; l’historique réel doit correspondre exactement au registre, sinon refus et procédure distincte.

EC03 reste additif : aucune reconstruction ou décongélation automatique des anciens devis. Préparation distincte de l’envoi, snapshot/destinataire figés et preuves exactes. Les cas legacy ambigus restent refusés, sans inventer une transmission Abby. `DatabaseService.initialize` peut appliquer des migrations au démarrage : **aucun lancement du nouveau candidat sur une base réelle tant que la migration réelle 71 n’est pas autorisée**.

## Scénario recommandé — une convergence groupée, revue structurée

1. Après accord de publication, créer une branche dédiée `codex/convergence-ux-v2-visual-ec03` depuis le candidat de clôture contrôlé. Relever à nouveau main, les branches sources et #154. Si main a changé, nouvelle simulation et analyse du delta avant toute actualisation ; merge normal dans cette branche uniquement si autorisé.
2. Comparer les arbres et les sous-ensembles : visuel partagé → Prospect A → EC01 → Client B → EC03/migration 71 → corrections de recette/documentation. Conserver tous les commits et les validations graphiques. La PR groupée expose ces sections pour revue sans prétendre qu’EC03 est une simple modification graphique.
3. Pousser normalement puis ouvrir **une seule PR draft vers main**, uniquement après autorisation du push, de la PR et de sa première CI automatique. Ne pas modifier #154 ou les branches existantes pour provoquer des runs. Aucune nouvelle fusion préalable des PR sources n’est nécessaire.
4. Une CI candidate sur le SHA exact + arbre de merge contrôlé. Au premier échec, diagnostic et arrêt, pas de relance automatique. Après revue humaine du résultat, accord explicite pour Ready/merge commit normal ; aucune suppression de branche.
5. Une CI post-fusion automatique sur main, comparaison arbre intégré/validé, contrôle complet terminé avant installation ou migration réelle. Clôture éventuelle des PR remplacées uniquement après preuve d’ascendance et accord.

**Minimum recommandé : 2 CI futures** (candidate + post-fusion), aucune lancée ici. Si la revue impose une intégration séparée visuel puis EC03, prévoir deux couples de CI ; ce surcoût est un choix de découpage, pas une nécessité de Git. Les accords de cette mission ne couvrent ni option.

## Déclencheurs exacts et couverture à préparer

Workflow actuel `.github/workflows/ci.yml` : push sur main et branches historiques nommées, `pull_request` ciblant main, `workflow_dispatch`. Une branche nouvelle `codex/convergence-…` n’est pas dans la liste push ; son ouverture vers main déclenche `pull_request: opened`. Un push ultérieur déclenche `synchronize`. Une draft n’empêche pas la CI. Aucun dispatch/commit vide/rerun ne doit s’y ajouter.

Sur un événement pull_request, le checkout par défaut peut être le commit de merge synthétique GitHub. Relever séparément le HEAD source, la base, le SHA effectivement checkouté et son arbre ; ce dernier doit correspondre à la simulation du candidat avec la base courante. Un SHA synthétique différent du HEAD source n’est pas, à lui seul, un mauvais candidat.

Le job `quality` conserve Windows 2022, Node 24, `npm ci`, typecheck et Vitest deux workers. La fin du workflow active `check-convergence-native.cjs` pour les branches `codex/convergence-`, main et dispatch : il ne faut donc pas affirmer que tous les tests natifs seraient ignorés. Plusieurs anciens blocs restent conditionnés à d’anciens numéros de PR, mais la recette commune les remplace en partie. Inspecter **les jobs/étapes réellement exécutés**, pas seulement le voyant global.

Le registre `scripts/convergence-state.json` contient la recette commune historique. Les nouveaux contrôles EC01/Client B/Prospect A/EC03 ne sont pas tous explicitement listés : avant la CI autorisée, préparer un incrément **de recette uniquement** qui les sélectionne sans double suite. En particulier EC03 exige `ATOUMWEB_EC03_ONLY=1` pour sa recette dédiée. Les modes UX-01 B/C/review peuvent s’enchaîner ; les modes qui retournent tôt (Abby, acceptation, PDF, etc.) doivent être invoqués séparément. Ne pas comptabiliser un mode non atteint.

## Contrôles de convergence à conserver

- Typecheck + 1 532 tests Vitest attendus sans modification de suite, 167 fichiers ; 35 restaurations, six comparaisons binaires, migrations 1–71, intégrité/FK, aucun RPC. Les comptes devront être relus, pas supposés.
- Natifs Catalogue (éditeur réel et simulé distingués, catégories, 112 références via tests d’import, associations/aides), CRM/Annuaire, recherche/Accueil/parcours, préférences indépendantes et retour de focus.
- EC01 rail réduit/déployé, trois thèmes/densités, fenêtres étroites et zoom jusqu’à 150 % ; aucune perte de l’unique chrono.
- Prospect A et Client B inchangés, huit onglets et éditeurs montés ; UX-01 dirty/pending, fermetures/rechargements/fenêtres détachées/changement de workspace sur TEMP.
- EC03 : ouverture/PDF purs, comparaison et confirmation explicites, finalisation distincte de l’envoi, rejet d’une préparation obsolète, envoi atomique/idempotent, identité figée, preuves Abby exactes, acceptation et révision traçables, compatibilité legacy et refus des ambiguïtés.
- Aucun test n’établit une sauvegarde complète des logos/documents hors SQLite. Les réserves Word réel, publication distante Bridge et grands volumes sont explicites ; aucun service externe ne doit être déclenché en CI pour les masquer.

## Autorisations encore nécessaires

Publication/PR/CI candidate, puis merge/post-fusion ; mise en œuvre du moteur complet de sauvegarde et éventuelle migration réelle 71/installation sont des décisions séparées. Archiver des identités Annuaire, activer de nouvelles contrepassations/réouvertures, synchroniser deux PC ou traiter un devis historique ambigu restent des périmètres métier distincts. La recette humaine globale demeure différée ; aucune nouvelle validation de conception Prospect A/Client B n’est demandée.

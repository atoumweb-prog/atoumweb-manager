# CI GitHub Actions — diagnostic et proposition d'évolution

**Statut : RECOMMANDATION EN ATTENTE D'ACCORD EXPLICITE — aucune modification du workflow autorisée par ce document.**
**Contexte :** PR #83 UX-01, PR #81 UX-03/16, PR #82 référentiel V2. Dernier bilan Codex MSI du 09/10/2026.

## 1. Diagnostic confirmé dans le dépôt
Source lue : [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) sur `main@eb252d5c` : job nommé `quality`, sélecteur **`runs-on: [self-hosted, Windows, X64]`**, checkout, installation Node 24, `npm install`, `npm run typecheck`, `npm test`.
Le `package-lock.json` est présent. Le run #518 de la PR #83 était **en file d'attente, sans conclusion** au dernier contrôle. D'après Codex MSI, GitHub indique **zéro runner self-hosted enregistré**. Ce blocage **n'est pas un échec de tests** et les résultats locaux ne remplacent pas une CI au vert.

## 2. Options examinées par Codex
| Option | Avantages | Vigilances |
|---|---|---|
| **GitHub-hosted Windows (`windows-2022`) — recommandée** | Pas de MSI connecté, Windows cohérent pour Electron et tests en mode Node, lancement automatique des PR | Quota Actions et éventuelle facturation, environnement différent du MSI, première exécution nécessaire |
| Runner local self-hosted Windows | Contrôle de l'environnement et outils installés | Disponibilité, maintenance, sécurité du compte exécutant le code ; **déconseillé sur MSI contenant des données métier** |

**Prix/quota :** les tarifs cités dans le bilan peuvent évoluer ; vérifier [tarification GitHub Actions](https://docs.github.com/en/billing/reference/actions-runner-pricing) et quotas du compte avant acceptation. Aucune estimation de coût spécifique au dépôt n'a été vérifiée.

## 3. Modification minimale proposée — NON AUTORISÉE À CE STADE
Sur une **PR technique distincte** :
1. Remplacer le job `quality` `runs-on: [self-hosted, Windows, X64]` par un runner Windows hébergé compatible, exemple `windows-2022` (disponibilité à confirmer au moment de la PR).
2. Remplacer `npm install` par **`npm ci`**, après confirmation que `package-lock.json` est synchronisé avec `package.json`.
3. Conserver `npm run typecheck` et la suite complète ; limiter les workers à **2** si la commande et le runner le supportent, p. ex. `npm test -- --maxWorkers=2`.
4. Tester sur la PR dédiée avec dépendances réelles, puis **rejouer/actualiser les contrôles sur #83 et #81** selon ce que GitHub déclenche réellement. Ne pas promettre que modifier `main` débloquera automatiquement les runs déjà en file d'attente sur d'autres branches.
5. Vérifier les permissions du workflow, téléchargements Electron, scripts de postinstall, temps d'exécution, consommation Actions et éventuels secrets. Aucun accès à Validation-MSI, ni données cliente, ni secrets locaux.
6. Publier résultats réels : identifiant de run, SHA, typecheck, tests, erreurs, consommation/temps, et anomalies d'environnement.

## 4. Contraintes de gouvernance
- **Attendre l'accord AtoumWeb** avant toute modification de `.github/workflows/ci.yml`, installation, activation Actions facturable ou autorisation de fusion.
- Ne pas fusionner automatiquement #80, #81, #82, #83.
- Les simulations combinées #81/#83 déjà rapportées ne remplacent pas la recette du code effectivement fusionné.
- Les tests React/Node sur GitHub-hosted Windows **ne prouvent pas** à eux seuls le rendu graphique natif MSI ; conserver une recette UI séparée en 3 thèmes × 3 densités et une validation humaine.
- Pas de runner installé sur le MSI de production/validation ; garder fixtures et base réelle séparées.

## 5. Questions à vérifier au feu vert
- Quota et facturation des jobs Windows pour **ce compte**.
- Existence de limitations/exigences de licence réseau, téléchargements Electron et Windows-hosted.
- Besoin d'un job Windows natif et d'un job portable complémentaire ; **hors périmètre de la proposition minimale**.
- Politique des workflows sur les contributions externes et droits du token GitHub.

**Décision enregistrée :** choix du runner **recommandé** par Codex, **pas encore validé ni appliqué par AtoumWeb**.

## 6. État actualisé — PR #84 publiée le 09/10/2026

**Vérification GitHub :** [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84) **draft, non fusionnée**, branche `codex/fix-ci-windows-hosted`, HEAD `3a02ff0ded5d0bdaea88f013c64eee6320c8c7da`. Les fichiers déclarés dans cette PR sont `.github/workflows/ci.yml`, `PROJECT_STATUS.md` et `docs/MANAGER_BRIDGE_ROADMAP.md`.

**Changement réel lu dans le workflow de #84 :** `runs-on: windows-2022`, `actions/setup-node@v4` avec Node 24, `npm ci`, `npm run typecheck`, `npm test -- --maxWorkers=2`. Les triggers existants `push`, `pull_request` et `workflow_dispatch` sont conservés.

**Aucun run CI réel réussi ni échoué sur #84** d'après le bilan Codex MSI : commit initial avec `[skip ci]`, zéro run annoncé. Le contrôle statique du lockfile et des options Vitest ne démontre pas la compatibilité Windows hébergé. La tentative de consultation de facturation a été refusée (permission `user` du jeton manquante) : **quota inclus restant, budgets et dépassements actuellement inconnus**. Ne pas présumer une autorisation de dépense.

**Conditions avant la première exécution** : le titulaire ou gestionnaire de facturation contrôle le quota réel et configure, si possible, un budget `Actions` avec arrêt de la consommation payante au seuil choisi. GitHub prévoit des budgets bloquants pour produits mesurés : [guide officiel](https://docs.github.com/en/billing/how-tos/set-up-budgets) ; écran de compte personnel [Billing](https://github.com/settings/billing). L'usage `windows-2022` coûte selon la grille standard Windows x64 si hors quota ; [tarif officiel](https://docs.github.com/en/billing/reference/actions-runner-pricing), à contrôler au lancement.

**Après autorisation explicite uniquement :** Codex prépare un nouveau commit non exclu de la CI, relève URL/ID du run, résultat `quality`, durée et erreurs ; aucune fusion automatique. En cas de feu vert à la fusion de #84, préparer l'intégration du YAML corrigé dans #81/#83 puis de nouveaux commits de validation. Les runs passés ne prennent pas automatiquement la nouvelle définition de workflow. Respecter les conflits et la préservation des mécanismes UX-01/03/16.

**Cette note remplace le simple stade « recommandation » dans l'historique ci-dessus : configuration maintenant préparée en draft #84, toujours NON exécutée et NON fusionnée.**

### Contrôle manuel du budget — marche à suivre propriétaire du compte
1. Ouvrir la [facturation GitHub](https://github.com/settings/billing) **sur le compte qui paie les Actions pour le dépôt** (personnel ou organisation).
2. Vérifier **l'utilisation Actions incluse encore disponible** et le contexte du plan ; ne pas interpréter une erreur `scope user` comme preuve de quota épuisé.
3. Dans **Budgets and alerts / Budgets et alertes**, chercher un budget de **produit Actions**, idéalement limité au dépôt s'il est possible ; contrôler l'option **Stop usage when budget limit is reached** et les éventuels budgets existants cumulés. Activer les alertes d'utilisation incluse, si disponible.
4. **Ne pas créer ni augmenter un budget payant par défaut** : choisir délibérément le montant/plafond, ou vérifier la configuration permettant de ne pas consommer hors quota. La documentation avertit que le **premier cycle d'un nouveau budget** peut ne pas couvrir rétroactivement la consommation déjà engagée ; vérifier l'historique de facturation.
5. Confirmer explicitement au développeur le **droit de lancer un premier run** (avec ou sans dépassement accepté) seulement après ces contrôles. Sans feu vert, garder #84 en draft et CI non exécutée.

Sources officielles : [Créer un budget et bloquer l'usage](https://docs.github.com/en/billing/how-tos/set-up-budgets), [Fonctionnement et limites des budgets](https://docs.github.com/fr/billing/concepts/budgets-and-alerts), [Prix runner Windows x64](https://docs.github.com/en/billing/reference/actions-runner-pricing).

## 7. Contrôle du compte transmis par AtoumWeb — 09/10/2026

**Information vérifiée sur captures de l'interface GitHub personnelle** de `atoumweb-prog`, sans consultation API Billing : 
- Compte **GitHub Free**.
- Page **Budgets and alerts** : budget produit **Actions = 0 USD/mois**, **Stop usage = Yes**, dépense budgétaire indiquée **0 USD** ; alertes d'utilisation incluse **On**.
- Page **Billing Overview** : consommation Actions brute octobre **0,13 USD** prise en charge par l'utilisation incluse (**0,13 USD de remise**) ; montant **billable = 0 USD**, prochain paiement non indiqué.
- Selon la [documentation officielle du quota inclus](https://docs.github.com/en/billing/reference/product-usage-included), GitHub Free prévoit **2 000 minutes Actions par mois** (équivalent de facturation dépendant du runner) et 500 Mo de stockage ; **ce chiffre est le quota nominal, PAS le solde réel restant**. Les minutes Windows sont facturées/consommées à un coût différent de Linux, à confirmer dans l'écran Usage.
- Le budget Actions `0 USD + Stop usage Yes` est le garde-fou constaté contre les consommations **payantes** après épuisement des allocations incluses, conformément à [GitHub Budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets). **Attention au cas du premier cycle suivant création de budget**, où GitHub signale que des consommations antérieures au budget ne sont pas rétroactivement plafonnées. Aucune configuration ou date de création du budget n'a été vérifiée.
- Il n'y a **pas de preuve de CI passée**, ni du solde de minutes incluses courant, ni de disponibilité effective du runner `windows-2022` à ce stade.

**Conséquence :** la condition de protection contre les dépassements payants est **vérifiée dans l'interface du compte**. L'ancien blocage « budget inconnu » peut être levé pour la **préparation de la décision humaine**, mais **l'utilisateur n'a pas encore autorisé explicitement le nouveau commit et le premier run** de #84. Relever éventuellement le solde restant via `Billing and licensing > Usage > Actions`, puis demander l'accord de lancement. Ne modifier aucun budget, ne fusionner aucune PR, ne présenter aucun résultat CI sans exécution réelle.

**Recommandation à Codex après feu vert uniquement :** pousser un nouveau commit sans `[skip ci]` sur #84 ; observer l'exécution réelle `quality`, remonter SHA, URL, tests, typecheck, durée, erreur éventuelle, consommation affichée. Si l'exécution se bloque à cause du budget nul, ne pas augmenter le plafond automatiquement ; expliquer la raison et demander une nouvelle décision.

## 8. Première validation exécutée après autorisation AtoumWeb — 09/10/2026
AtoumWeb a **autorisé explicitement** à Codex MSI le premier run dans la limite de l'utilisation gratuite du compte, après confirmation en capture du budget Actions 0 USD, `Stop usage = Yes`. **Ce droit ne permet pas de relever le budget ni de fusionner.**

**GitHub vérifié :** [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84), nouveau HEAD `1b069575891dae3b695c0afa1c76a3964890a03a` (commit « ci: trigger first hosted Windows validation within free allowance »). [Workflow #549](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/37934890745), run ID `37934890745`, job `quality` ID `113834365264`, Windows hébergé. **Début 13:09:51Z, fin 13:14:36Z**.

**Étapes GitHub réellement passées :** checkout OK, Node 24 OK, `npm ci` OK, `npm run typecheck` OK. **Étape tests = FAILURE** : **692 réussis, 3 échoués sur 695**, suite à `Test timed out in 5000ms`. Les journaux identifient :
- `src/main/projects/OperationalRecipeService.test.ts`, test à la ligne 15 ;
- `src/main/projects/recipe/mariageHistoireRecipeStructure.test.ts`, test à la ligne 11 ;
- le même fichier, test à la ligne 37.

Ce sont **trois échecs par timeout**, non la preuve que les calculs métier sont corrects ou incorrects ; la cause exacte doit être déterminée. Deux workers configurés ; il faut diagnostiquer séparément les tests concernés sur Windows GitHub-hosted, les opérations synchrones/SQLite/fixtures et l'éventuelle pression sur les ressources. **Ne pas augmenter arbitrairement tous les délais ni masquer/skip les tests.** Rejouer les tests ciblés puis la suite complète, relever les vrais résultats et le coût constaté. Le job a fini en échec : **CI NON VERTE**, aucune fusion de #84 autorisée à ce stade.

Cette section **actualise les anciennes mentions « aucun run »** qui décrivaient le stade de préparation initial de #84. Les résultats de tests de #84 (branche fondée sur `main`) ne doivent pas être confondus avec les **734 tests locaux** annoncés sur la branche différente de #83.

**Alternative locale** : si les investigations sont bloquées par le runner hébergé, exécuter les tests ciblés sur une machine ou VM Windows locale de développement avec **fixtures isolées**, hors Validation-MSI. Cette solution ne vaut **pas** un succès de CI GitHub.

### Retour Codex MSI après run #549 — 09/10/2026
Codex a confirmé : **`npm ci` OK ; typecheck OK en ~16 s ; 692 réussis / 3 timeouts sur 695 ; durée Vitest ~3 min 42 s ; job ~4 min 45 s.** Échecs de fixtures `OperationalRecipeService.test.ts` (déterminisme entre sessions) et **2 tests** dans `mariageHistoireRecipeStructure.test.ts` (structure/staging). **Aucun échec d'assertion métier rapporté pour ces trois cas** ; cela ne prouve pas que les scénarios sont fonctionnellement corrects. **Aucun blocage quota/facturation signalé** ; zéro budget modifié. PR #84 toujours draft au dernier contrôle, aucune nouvelle relance ni merge annoncés.

**Prochaine demande à Codex, sans nouvelle exécution Actions non autorisée** : mesurer séparément ces fixtures sur environnement Windows isolé, inspecter créations/copies SQLite, attente I/O et ressources, comparer les durées Linux/MSI si réellement disponibles, établir cause et correction ciblée (ou timeout local au scénario justifié), sans skip ni changement arbitraire de `testTimeout` global. Exécuter ensuite typecheck/tests locaux sur fixtures ; demander un **nouveau feu vert pour relance CI** lorsque le correctif et la consommation prévisible sont expliqués. Un test local ne constitue pas une CI verte.

## 9. Correctif local de fixtures annoncé par Codex MSI — 09/10/2026, 15:45
**Rapport transmis par AtoumWeb, non vérifié directement dans GitHub :** Codex indique avoir identifié le coût principal de préparation des fixtures SQLite : 176 écritures individuelles en autocommit, et avoir remplacé ce cycle par une préparation **en mémoire**, suivie de l'export d'une base SQLite réelle en une fois, avec les mêmes migrations et données. La cause précise de la latence sur GitHub-hosted (disque/antivirus/CPU) **reste non mesurée** ; le preview métier est annoncé à ~12 ms.

| Test ciblé | Avant local | Après local |
|---|---:|---:|
| Sessions indépendantes | 2,17 s | 0,45 s |
| Mariage Histoire préparation/historique/rollback | 1,14 s | ~0,24 s |
| Mariage Histoire staging/actions | 1,13 s | 0,30 s |

**Résultats rapportés, pas des tests exécutés par cette documentation :** typecheck OK, ciblés **27/27**, suite complète **698/698** (80 fichiers, **72,02 s**), intégrité/FK, séparation des bases, conservation d'un fichier existant. **Aucun test supprimé/masqué ni timeout global relevé selon Codex.**

Commit Codex annoncé : **`5a175eb` local sur `codex/fix-ci-windows-hosted`** ; fichiers notamment `src/main/testSupport/operationalRecipeFixture.ts`, test de fixture, analyse `docs/CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS.md` et un quatrième fichier signalé mais non nommé dans le rapport. **Le HEAD GitHub #84 restait `1b069575` lors de la vérification : ne pas présenter ce commit local comme déjà publié/relu.**

**Appréciation technique :** démarche ciblée et résultats locaux cohérents ; feu vert **pour publier et faire relire le correctif**, **pas pour déclarer la CI verte**. Instruction proposée à Codex : pousser les sources revues **avec `[skip ci]`** puis présenter le diff/HEAD et le protocole d'une nouvelle validation Windows-hosted. **Nouvelle exécution GitHub soumise à un accord séparé d'AtoumWeb**, aucune fusion, aucune hausse de budget, ni opération sur Validation-MSI.

## 10. Correctif #84 **publié**, validation hébergée encore à faire — vérifié 09/10/2026
GitHub [PR #84](https://github.com/atoumweb-prog/atoumweb-manager/pull/84) affiche maintenant le correctif **`5a175ebc14bc909b1b14e0de0ab9ea9af768f5e4`** (préparation des fixtures SQLite en mémoire, test d'export et rapport), puis un commit de suivi HEAD **`495775da284ac09f09667bc6eca86bdb78477a3c`**, marqué **`[skip ci]`**. Cette vérification **remplace** la mention historique « seulement local » de la section 9. PR toujours **draft, non fusionnée**.

**Contrôle GitHub : aucun nouveau workflow run associé au HEAD `495775da`** au moment de cette consultation. Les succès `698/698` et `27/27` restent des **résultats locaux annoncés par Codex**, pas une CI passée. Le run #549 de l'ancien commit reste **rouge**.

**Étape nécessaire :** AtoumWeb doit **autoriser explicitement un deuxième essai GitHub Actions** (dans le quota gratuit et avec budget 0 USD / Stop usage = Yes vérifiés). Alors seulement, Codex doit pousser un nouveau commit **sans skip** pour exécuter `quality` sur le correctif actuel, puis publier SHA/run/temps/typecheck/total tests. En cas d'échec, diagnostic ciblé avant toute fusion. Aucune permission donnée ici pour merge #84 ou réécrire #81/#83.

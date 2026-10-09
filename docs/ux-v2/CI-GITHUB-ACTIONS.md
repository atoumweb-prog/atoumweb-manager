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

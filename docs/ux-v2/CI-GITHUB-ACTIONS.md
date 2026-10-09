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

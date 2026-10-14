# ATOUMWEB MANAGER — Lot 10 — Passation finale Codex (UX/UI V2)

**Date de référence :** 14 octobre 2026  
**Responsable technique du candidat :** branche `integration/ux-v2-lot10-candidate-v1`, PR [#130](https://github.com/atoumweb-prog/atoumweb-manager/pull/130), **draft / non fusionnée**.  
**SHA applicatif validé :** `0aaf1ada0bab4bd06c9ca8b8d1c2a8ce452a1746`.  
**CI sur ce SHA exact :** [#38641773530](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38641773530) **SUCCESS**.  
**Attention :** la mise à jour *documentaire* de cette passation crée un SHA ultérieur ; elle ne modifie pas le candidat applicatif précédemment testé. Ne pas attribuer une CI d'un SHA au SHA suivant sans vérifier les fichiers modifiés et les résultats.

## 1. Périmètre livré

- **10A — Pilotage et métriques :** définitions de sources et cohortes, exclusions métier, taux d'acceptation et affichage « non disponible » quand un calcul n'est pas fondé.
- **10B — Statistiques :** une période commune aux cinq onglets, dates personnalisées contrôlées, réponses asynchrones obsolètes ignorées, comparaisons conformes, affichage des enregistrements justifiant les KPI. Navigation vers **Devis**, **Facturation** et **Gestion des temps** par IDs exacts de la cohorte prise au clic. Sortie explicite du filtre ; élément absent/changé d'état signalé sans remplacement silencieux ; cohorte des décisions acceptées/refusées/expirées aussi prise en charge.
- **10C — Sauvegardes :** registre déclaratif sans fiction de copie physique, alertes Client/Projet, contrôle de contexte avant/après intervention, confirmation avant association d'une référence existante. Protections service IPC : cohérence projet/client, chronologie et idempotence ; pas de restauration WordPress créée.
- **10D — Réglages :** recherche de sections, thèmes et densités accessibles, avertissements sur workspace et restauration, gestion de l'état du rail, favoris et dispositions Clientes/Annuaire dans le stockage existant, confirmations ciblées. Rubrique Documents fondée sur conventions des répertoires du workspace ; rubrique Avancé en **lecture seule** via `database.health()`. Aucune politique globale de conservation légale inventée.
- **10E — Recette :** bancs Electron Windows sur TEMP, restauration UX-16, contrôles UX-01, cas ciblés et [matrice des 102 scénarios](LOT-10E-RECETTE-102.json) avec garde CI.

Les quatre PR de travaux sources restent indépendantes : [#125](https://github.com/atoumweb-prog/atoumweb-manager/pull/125) (10A), [#126](https://github.com/atoumweb-prog/atoumweb-manager/pull/126) (10B), [#127](https://github.com/atoumweb-prog/atoumweb-manager/pull/127) (10C), [#128](https://github.com/atoumweb-prog/atoumweb-manager/pull/128) (10D). **La PR #130 est le candidat combiné à reprendre**, pas une somme de merges à refaire.

## 2. Gates obtenues (CI #38641773530 au SHA applicatif exact)

| Contrôle | Preuve |
| --- | --- |
| TypeScript | PASS |
| Vitest | **116 fichiers / 1 071 tests réussis** |
| Inventaire 10A–10E | **102 IDs uniques :** A=17, B=17, C=20, D=18, E=30 |
| Electron global Windows TEMP | **374/374**, 17 modules, 63 captures vérifiées automatiquement, pas de débordement détecté ni erreur console |
| SQLite restore UX-16, Electron TEMP | **12/12**, nettoyage confirmé |
| Electron ciblé 10B–10D | **58/58**, aucune erreur console, `onlyTemp=true` |
| Nettoyage des fixtures | Confirmé par les bancs concernés |

**Ne pas confondre la matrice et une certification exhaustive :** 42 scénarios disposent de **traces automatisables identifiées**, 43 d'une **couverture partielle**, 17 nécessitent **validation humaine ou intégration complémentaire**. Un scénario « trace automatisable » n'est pas nécessairement certifié de bout en bout. Référentiel et preuves : `docs/ux-v2/LOT-10E-RECETTE-102.json`, garde `scripts/check-ux-v2-lot10-coverage.cjs`. Les 102 cas doivent être rapprochés du référentiel lors de la convergence générale.

## 3. SQLite, sécurité des données et limites

- **Aucune migration SQLite ajoutée ni modifiée par le lot 10** ; `main` était à **66 migrations** lors de la validation. La collision transversale identifiée sur **l'ID 67** (lots 04 et 05) doit être arbitrée **hors lot 10** avant une fusion globale et avant application sur bases persistantes.
- Aucun schéma, base persistante, workspace réel ou dossier **Validation-MSI** n'a été modifié depuis ce développement distant.
- Les gates Windows utilisent Electron et fixtures SQLite en **TEMP** : elles ne certifient **ni un MSI installé**, ni une restauration sur les données de l'utilisateur, ni l'intégrité des sauvegardes externes.
- Maintenir les gardes de saisie non enregistrée UX-01, l'absence de restauration WordPress fictive, les contrôles temporels avant/après intervention et la séparation des sauvegardes métier/SQLite.

## 4. Fichiers sensibles à la convergence et vérifications Codex

1. Partir de la **PR #130** ; comparer son HEAD actuel à `0aaf1ada0bab4bd06c9ca8b8d1c2a8ce452a1746` et à `main`. Ne **pas** refaire les sous-lots déjà développés ni résoudre les collisions SQLite en choisissant arbitrairement un numéro.
2. Recouper les modifications communes avec les lots 06/09 avant fusion : `src/renderer/App.tsx`, `src/renderer/commercial/QuotesPage.tsx`, `src/renderer/billing/BillingPage.tsx`, `src/renderer/time/TimePage.tsx`, et les composants de navigation et de paramètres.
3. Vérifier le passage des IDs exacts des cohortes statistiques et la gestion d'éléments devenus absents ; restaurer les filtres généraux seulement après sortie explicite. Préserver les dates personnalisées et le garde UX-01 en navigation.
4. Faire passer les tests sur le **nouveau SHA de convergence** : TypeScript, Vitest, `node scripts/check-ux-v2-lot10-coverage.cjs`, `node scripts/check-ux-v2-integration-validate.cjs --native-only`, `node scripts/check-restore-quit-roundtrip.cjs`, `node scripts/check-ux-v2-lot10-ui.cjs`.
5. Effectuer la recette humaine des interfaces/captures et les contrôles MSI sur **copies/sandbox autorisés seulement** ; ne jamais toucher une base de production ni renuméroter une migration appliquée.
6. Fournir les cas R10A–R10E non certifiés dans le bilan, et demander **l'autorisation explicite** avant toute fusion dans `main`.

## 5. Réserves de passation

**Restent à la convergence / à la recette :** arbitrage de la collision SQLite transversale 67, compatibilité des fichiers communs avec les autres lots, validation humaine des écrans et **60 cas sans certification complète déclarée (43 partiels + 17 humains/intégration)**, contrôle MSI installé. **Aucune fusion dans `main` autorisée à ce stade.**

Les échecs intermédiaires de CI liés à des assertions de fixture ont été corrigés ; pour décider de l'état du candidat applicatif, utiliser la **CI finale verte #38641773530**, pas les runs d'essais précédents.

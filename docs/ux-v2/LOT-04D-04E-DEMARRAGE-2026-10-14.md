# Lot 04D / 04E — démarrage isolé (14/10/2026)

## Bases et dépendances
Branche `feature/ux-v2-lot04d-04e-catalogue-v1`, créée depuis le HEAD de 04C / PR #108 `2412513be4fb0f2ca87602adcdef4aaa31760ea3`. 04C dépend de 04B / PR #104. Aucun merge vers `main`.

## 04D — associations/recommandations
Premier incrément : `catalogRecommendationRules.ts` et tests Vitest. Déduplication par prestation cible ; rejet de référence à soi-même, brouillons, versions retirées, prestations inactives/archivées et services déjà inclus dans une offre. Aucun changement de devis automatique.

**Non livré** : stockage N:N et migrations, service SQLite transactionnel, API IPC/preload, édition des liens depuis le Catalogue, règles de cycle de vie des versions et recette Electron.

## 04E — aide commerciale
Premier incrément : `catalogSalesGuidance.ts` et tests Vitest. Champs humains associés explicitement à une version, normalisés sans génération automatique, statut non configuré si vide ; aucune assimilation aux CGV/clauses.

**Non livré** : persistance versionnée des objections et argumentaires structurés, interface de saisie/lecture, contrôles UX-01 des brouillons, éventuelles migrations/API, recette Electron.

## Réserves et portes de validation
Les nouveaux tests sont **écrits, pas encore exécutés**. TypeScript, Vitest, Electron Windows et migrations n'ont pas été lancés sur ce nouvel HEAD. Les résultats CI #883 (04B) et #1003 (04C) ne sont pas transférables à cette branche.

Exiger avant clôture : mise en œuvre stockage/IPC/UI, tests SQLite/UX-01/Electron, CI verte sur HEAD, convergence de 04B→main puis 04C→04B puis 04D/04E→04C. Conserver lot 05 CGV indépendant, aucune modification de données réelles.
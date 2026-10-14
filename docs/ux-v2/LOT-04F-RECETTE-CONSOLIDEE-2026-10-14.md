# Lot 04F — Recette consolidée et portes de convergence (14 octobre 2026)

## Périmètre vérifié séparément

| Couche | Couverture et constat | Limite de preuve |
|---|---|---|
| 04B / PR #104 | CI #1045 verte sur HEAD `57afcdae`. Classement, recherche, catégories administrées, historique, capture Electron | Ne prouve pas la convergence avec `main` actuel ni la validation visuelle humaine |
| 04C / PR #108 | CI #1003 verte sur HEAD `2412513b`. Brouillons, CAS, création vN+1 idempotente, publications, 8 onglets, UX-01 | PR #108 cible la branche de #104 ; sa CI seule n'est pas une recette du candidat convergé |
| 04D / PR #118 | CI #1171 verte : 1 111/1 111 Vitest et 14/14 scénarios du panneau React dans Electron avec IPC simulé. #1192 verte (règles 04D) | La recette complémentaire avec le vrai preload de production a été validée par #1230 ; une assertion d'accessibilité du retrait a ensuite été ajoutée au pilote React |
| 04D intégré / PR #118 | CI #1207 verte : fenêtre Electron, transport IPC réel, SQLite et service métier sur base TEMP, CAS testé. CI #1213 verte, restauration/fermeture ajoutée | Le script a depuis été étendu au **véritable preload de production** ; CI **#1230 verte** |
| 04E / PR #118 | Champs humains versionnés et tests unitaires / SQLite ; aide commerciale distincte du contrat et sans publication automatique | Recette du **formulaire réel** ajoutée et validée par CI **#1236 verte** |
| 04F non-régression | Workflow PR #118 : Windows TEMP Catalogue, native 04D, UX-01 navigation et restauration/fermeture, typecheck et Vitest complet | Régression après convergence des PR empilées et inspection visuelle humaine encore ouvertes |

## Dépendances et ordre à préserver

1. `main` reçoit uniquement les changements autorisés séparément ; aucun merge par l'agent. À l'audit de convergence, `main` = `cc0bc679`, PR #118 = 10 commits derrière / 279 devant `main`. La divergence est une **réserve réelle**, pas un test déjà effectué sur candidat réconcilié.
2. PR #104 (04B) base `main` ; PR #108 (04C) base branche 04B ; PR #118 (04D/04E) base branche 04C.
3. Les fichiers communs modifiés dans les trois branches incluent `src/main/commercial/CatalogService.ts`, `src/main/ipc.ts`, `src/preload/preload.ts`, `src/renderer/commercial/CatalogPage.tsx` et `.github/workflows/ci.yml`. Attention à l'ascendance et aux changements intercalés sur la branche 04B.
4. Migration additive **67** de 04B puis **68** de 04D : identifier les collisions de migration avec le `main` le plus récent avant la convergence. `schema_migrations` ne doit jamais attribuer deux schémas au même identifiant.
5. Ne pas modifier CGV (lot 05), devis historiques, tarification de référence, données utilisateur ni Validation-MSI.

## Critères de clôture de 04F

- [x] CI #1045 verte sur HEAD de 04B.
- [x] CI #1003 verte sur HEAD de 04C.
- [x] CI #1171, #1192, #1207, #1213 vertes sur leurs commits respectifs de 04D/04E.
- [x] Panneau 04D testé en Electron avec IPC simulé ; scénario de conflit concurrents et conservation du brouillon.
- [x] Test natif Electron + IPC + SQLite TEMP sous CI #1207.
- [x] CI #1230 verte avec **préchargement réel de production** (IPC Electron et SQLite TEMP).
- [x] CI #1236 verte avec saisie réelle de l'argumentaire, questions de qualification et objections dans l'éditeur 04E.
- [ ] Confirmer le contrôle de **sauvegarde/restauration de la base SQLite recommandation** sur son HEAD (CI #1245 en cours au constat).
- [ ] Confirmer les **neuf captures de thème/densité** sur le HEAD (CI #1252 en cours au constat).
- [ ] Vérifier migrations 67/68 et clés étrangères sur le candidat réellement convergé.
- [ ] Rejouer toute la suite TypeScript/Vitest/Electron/UX-01 sur la convergence avec le `main` récent.
- [ ] Inspection visuelle des captures et validation humaine des parcours métiers sensibles, ou réserve explicitement acceptée.
- [ ] Préparer le dossier de fusion et attendre une autorisation explicite avant `main`.

## Politique d'intégration

Aucun pourcentage de clôture technique certifié tant que les critères ouverts ne sont pas traités. Les résultats de CI portent uniquement sur les SHA effectivement exécutés. Une PR draft, même verte, n'est pas une PR convergée ni autorisée à fusionner.

## Actualisation de passation — CI #1619, SHA 3e7ce07

**Preuve contrôlée** : [CI #1619](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38634238850) terminée **success** sur le commit complet `3e7ce07929a7d9d8ab1ff708e670d36e00c1f32b` de la PR #118. Les étapes réussies comprennent : TypeScript, Vitest complet, Electron Catalogue 04D/04E avec 9 captures automatiques, recommandations 04D, aide commerciale 04E (clavier/Escape/focus), parcours Prospect et Devis, Electron natif IPC/SQLite sur TEMP, UX-01 Catalogue et restauration/fermeture. Les jobs dédiés 04B et 04C sont **skipped** sur cette PR : leurs CI spécifiques restent les preuves séparées et non une certification intégrée.

**Régression traitée** : CI #1599 a échoué sur deux fixtures de `quoteRecommendationStatus.test.ts` qui omettaient la version de leur ligne Offre ; commit correctif `bf77617f9ce92308632223d515cf673800222fc6`, CI #1614 verte. Nouveau test historique sans provenance vérifiable `3e7ce07`, certifié par CI #1619.

**Préflight isolé** : `integration/ux04-preflight-20261014` a été créé au SHA `bf77617` (instantané antérieur au dernier HEAD, à **ne pas présenter comme le candidat final**). Il n'incorpore ni les 10 commits de `main` en divergence constatée au moment de sa création, ni la décision de renumérotation des migrations.

**Portes restantes avant clôture 04F** : (1) arbitrage du conflit de migration 67 entre lots 04 et 05, sans renumérotation spéculative ; (2) réconciliation des branches empilées 04B→04C→04D/04E avec le `main` récent ; (3) rejouer TypeScript, Vitest, Electron Windows, UX-01 et migrations/FK sur **le SHA convergé** ; (4) inspection visuelle humaine des captures et parcours sensibles, ou réserve approuvée ; (5) dossier et autorisation explicite de fusion. Ne jamais modifier `Validation-MSI` ni une base utilisateur pour cette recette.

**Décision** : développement 04D/04E validé sur son dernier HEAD par CI #1619, **lot 04F non clôturé**, aucune fusion vers `main`.

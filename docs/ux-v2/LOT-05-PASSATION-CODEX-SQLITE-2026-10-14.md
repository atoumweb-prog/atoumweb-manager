# ATOUMWEB MANAGER — LOT 05 — Passation de clôture technique isolée

Mise à jour : 15 octobre 2026. **Aucune fusion dans `main`, aucune écriture sur les bases Windows persistantes.**

## Candidats et CI vérifiées

| Périmètre | Branche / PR | SHA contrôlé | CI Windows |
| --- | --- | --- | --- |
| Lot 05 isolé | `integration/ux05-candidate-20261014` / [#121](https://github.com/atoumweb-prog/atoumweb-manager/pull/121) | `e97ffb8099e034ace1359cf9ef20806f9aa0f4df` | [#1786](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38645214324) **verte**, 1 131/1 131 tests, 124 fichiers |
| Convergence réelle 67–69 | `validation/ux04-05-sqlite-67-69-20261014` / [#147](https://github.com/atoumweb-prog/atoumweb-manager/pull/147) (**draft de test, NE PAS FUSIONNER**) | `df4c46d85c88ee502a1ef9a4d5b7e80dbab58d60` | [#1789](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38645306055) **verte**, 1 132/1 132 tests, 125 fichiers |

**Attention :** un commit ultérieur actualisant cette passation ne doit pas être présenté comme testé à ces SHA sans nouvelle CI. Les verdicts ci-dessus sont associés strictement aux SHA indiqués.

La CI #1786 a validé TypeScript, Electron Windows TEMP 05B (29 contrôles natifs), round-trip restauration/fermeture UX-01 (12 contrôles), brouillons UX-01 (183 contrôles), UX 02E, coexistence CRM 03B/03D/03E, et Vitest intégral. Aucun exécutable MSI installé n'a été testé. Les tests échouant précédemment sur des assertions `67` et une égalité `MIGRATIONS.length === lastId` ont été corrigés sans altérer la migration 69 ni les données métier.

La CI #1789 a exécuté le test d'export SQLite indépendamment (`--maxWorkers=1`, 3/3), puis la suite complète (`--maxWorkers=2`, 1 132/1 132). Les deux bases exportées restent **distinctes**, avec `VACUUM INTO`, contrôles d'intégrité et FK, non-écrasement et absence de fichier partiel. Sur le runner Windows : par base, migrations 228–256 ms, alimentation 14–20 ms, intégrité source 4–5 ms, VACUUM 69–81 ms ; contrôle final des deux exports 29–35 ms. Pas de ralentissement SQLite reproductible ; timeout porté uniquement à **30 s pour ce test**, pas au global. La CI a validé les véritables migrations 67, 68 puis 69, l'idempotence et les vérifications d'intégrité.

## SQLite — numérotation conforme au référentiel

- Socle `main` du candidat : migrations **1 à 66** inchangées.
- Lot 04 : **67** `catalog_category_registry_v1` et **68** `catalog_version_recommendations_v1`, fichiers réels récupérés du candidat PR #118.
- Lot 05 : **69** `contract_clause_section_review_v1` dans `src/main/database/contractSectionReviewMigration.ts`, enregistrée dans `migrations.ts`. Pas de doublon d'identifiant.
- Le lot 04 possède également une migration **70** `catalog_recommendation_details_v1`, provisoire sur son candidat. **La CI #1789 ne valide pas encore 70**. Le coordinateur devra arrêter son ordre définitif et faire tester **1–70** à partir du candidat 04 confirmé, avant convergence complète.
- Inventaire Codex des bases Windows : 186 bases inspectées sur copies temporaires ; aucune migration 67/68/69 ni table `contract_clause_section_reviews` trouvée. Bases avec données à préserver : production (18), Validation-MSI (66), Profil-Validation-MSI (34), sauvegarde 08/10 (65), entre autres. Aucune base persistante modifiée. **Limites :** profils Windows `carlo`, `Anne-Sophie` et lecteur `Z:` inaccessibles ; vérifier toute base provenant de ces emplacements avant migration.
- Le moteur `getPendingMigrations` compare les identifiants appliqués ; vérifier aussi les **noms** enregistrés lors de l'intégration pour écarter toute collision provenant d'un emplacement non inspecté.

## Fonctionnalités livrées et frontières

| Sous-lot | Réalisé et testé sur le périmètre isolé | Réserve avant certification produit |
| --- | --- | --- |
| **05A** Audit | Architecture des clauses, versions, contrats intégrés aux devis et protections historiques analysées | Recette inter-lots sur le `main` final |
| **05B** Bibliothèque | UI de classement par version, proposition puis approbation humaine nominative, SQLite/IPC, protection des brouillons ; recette native Windows TEMP verte | Validation visuelle humaine sur MSI et textes juridiques réels |
| **05C** Assemblage | Huit rubriques ordonnées, numérotation stable, exclusions, contexte et conflits au niveau des fonctions pures, tests. Assemblage canonique approuvé raccordé à `ContractTermsService.freezeQuote` et à `QuoteService.finalize` avec mode 05C explicite dans l'UI/IPC ; contrôle transactionnel et protection du mode historique | **Les règles d'applicabilité par produit/option, quantité et les fiches de conflits juridiques ne sont pas toutes persistées/renseignées depuis le vrai devis dans ce candidat isolé.** Le moteur sait les évaluer si elles sont fournies, mais ne pas considérer ce périmètre comme une certification juridique en production. Revalider avec les lots 04/06 et décision humaine |
| **05D** Builder | Aperçu de l'assemblage approuvé, brouillons, sommaire, comparaison en lecture seule et refus d'altération des snapshots ; la présentation figée canonique réutilise le texte du snapshot | Recette inter-lots et vérification humaine des cas mixtes |
| **05E** Documents | Export DOCX de travail OpenXML, import DOCX/TXT **comparatif et non destructif**, tests de l'aller-retour, prévisualisation et copie Abby basées sur valeurs enregistrées | DOCX n'assure pas fidélité de mise en page complexe, PDF de travail/interopérabilité du lot 09 à confirmer ; **aucun export n'est une preuve de signature** |
| **05F** Recette | Vitest intégral, Electron/IPC Windows TEMP, non-régressions UX-01 et CRM, tests d'upgrade et CI ci-dessus | Matrice de recette humaine et inter-lots, MSI installé non validé |

## Garanties et arbitrages à conserver

1. Le contrat fait partie du devis ; la signature du devis vaut acceptation selon le circuit métier, **jamais** un import Word ou une prévisualisation. Ne pas inférer une signature Abby d'un nom de fichier ou d'une copie.
2. Aucun texte juridique publié ni classement approuvé ne doit être modifié automatiquement. Les propositions ne remplacent pas l'approbation humaine. Conserver les anciens contrats `frozen`, `historical_missing`, les versions et les preuves Abby.
3. Le parcours historique des devis conserve sa compatibilité ; l'option explicite **« Finaliser avec contrôle juridique 05C »** refuse une préparation ou un classement incomplet, sans enregistrer de contrat figé.
4. La résolution des conditions métiers et des conflits encore absents du contexte réel demande un raccord inter-lots 04/06 et une approbation humaine des clauses/règles. **Ne pas contourner** ces exigences pour obtenir une CI verte.
5. Confirmer la migration 70 du lot 04 et tester la séquence réelle 1–70 sur base **temporaire**, avec intégrité, FK, idempotence, sauvegarde des données représentatives et test Electron de convergence.
6. Rester sans fusion dans `main` jusqu'à l'accord de l'utilisateur, la validation de convergence et la recette humaine Windows/MSI.

**Verdict :** lot 05 **techniquement validé sur branche isolée** aux SHA/CI indiqués, **prêt pour la phase de convergence encadrée**, mais ni validation juridique, ni recette MSI, ni convergence complète 1–70 certifiées.

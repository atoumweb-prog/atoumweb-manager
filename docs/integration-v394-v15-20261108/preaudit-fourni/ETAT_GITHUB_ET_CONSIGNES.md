# AtoumWeb Manager — V3.9.4 / V1.5 — reprise opérationnelle documentée

Date : 8 novembre 2026. **Document technique de préparation, pas une intégration effectuée dans Manager.**

## Source métier expressément approuvée

Se référer aux trois Word du ZIP d'origine : grille V3.9.4, métier V1.5, bibliothèque CGV V3.9.4 avec rectificatif 019. Le statut est **APPROUVÉ MÉTIER POUR INTÉGRATION INTERNE**, **NON PUBLIÉ**, sans certification juridique. Aucun nouveau vote global de tarifs/clauses à demander.

Les extractions JSON sont dérivées des Word et ne remplacent pas leurs textes en cas de divergence. Vérification de l'archive `verify_bundle.py` : 22/22 empreintes vérifiées ; 130 références et codes distincts, 119 clauses et codes distincts, 47 prix délégués, 6 fiches à vérifier, 18 codes provisoires V39, clause 019 rectifiée.

## État GitHub effectivement consulté

Dépôt : `atoumweb-prog/atoumweb-manager`, branche de lecture : `codex/ux-v2-offres-tarifs-20261106`.

`AGENTS.md`, début de `PROJECT_STATUS.md`, `README.md`, `docs/ux-v2/CONSIGNES-ET-REPRISE.md`, `CatalogService.ts`, `CatalogImportService.ts`, `CatalogCommercialConvergenceService.ts`, `ContractLibraryImportService.ts`, `migrations.ts`, `contractClauseVersionIdentityMigration.ts` consultés sur GitHub. **Pas de checkout local complet, pas d'exécution des tests TypeScript/Electron/SQLite sur le véritable dépôt, pas d'accès aux 50 fichiers locaux non committés du lot 2.**

Les messages de travail précédents indiquent : dernier HEAD/remote lot 1 = `57ad50fd41c2de038015b346edae0751c7f8b785`; 50 fichiers locaux encore modifiés/non suivis pour le lot 2 et la préparation de migration 81. Ce HEAD est à revérifier dans le worktree local avant tout commit. GitHub ne contient pas les modifications non publiées du lot 2. **Ne pas ouvrir une PR déclarant l'intégration fonctionnelle complète sur une branche construite uniquement depuis le lot 1.**

## Moteurs existants et incompatibilités à traiter

1. `src/main/commercial/CatalogImportService.ts` : sait simuler un plan, exige mapping explicite, refus d'import ambigu, hash du plan, commit volontaire et préservation des versions historiques. `CatalogImportRecord` utilise un `canonicalCode` et une version typée ; 18 `V39-` ne doivent pas devenir des codes `AW-` fictifs sans preuve de correspondance. Le statut de validation/délégation doit rester traçable même s'il nécessite une extension du modèle.
2. `src/main/commercial/ContractLibraryImportService.ts` : validation de source héritée **118 clauses, 409 liens, doctrine du 03/10, huit sources**. Le modèle V3.9.4 cible 119 clauses avec textes nouveaux ; il faut faire évoluer ces gardes en conservant la traçabilité/version et sans affaiblir les autres contrôles.
3. `ContractTermsService` et versions de clause existantes : conserver les anciens textes et les snapshots des devis acceptés ; créer des *versions candidates non publiées* des mêmes codes, pas 119 nouvelles identités en doublon pour les clauses identiques.
4. Migration 79 `contract_clause_versions` et alias : codes et audience historisés à la version ; à respecter lors des rapprochements.
5. Migration 81 : développée localement pour les brouillons incomplets, recette TEMP satisfaisante selon Codex, non activée dans la préproduction. Ne pas confondre avec une migration d'intégration contractuelle.
6. Facturation réglementaire : Abby reste l'unique référence V1 ; éviter tout moteur parallèle.

## Priorités de reprise dans le worktree Windows

1. Inspecter l'état réel des 50 changements du lot 2 et leur relation au dernier HEAD publié. Les préserver sans reset, clean, stash ou changement destructif.
2. Exécuter le préaudit fourni sur la base de travail en **lecture seule** (voir commande ci-dessous), sans toucher à la recette et sans migrer.
3. Résoudre explicitement les 18 `V39-` : ID exact, éventuel alias déjà utilisé, version publiée/draft, usages/snapshots, collision éventuelle. Une suggestion par nom n'est pas une preuve. Reporter les cas bloqués.
4. Construire un import commercial V3.9.4 utilisant les services existants : 130 entrées, statuts exacts dont 47 délégations et six vérifications, prix/valeurs visibles sans conversion erronée « Sur devis », « Dès » ou frais registrar ; versions non publiées et historisées.
5. Construire l'import de 119 clauses V3.9.4 avec `BASE-PAIEMENT`/019 corrigée, code/audience/ordre/version/provenance conservés ; rapprochement sans réécrire les clauses historiques. Sélection des clauses selon offre, client et devis, sans injecter notes internes.
6. Ajouter les règles V1.5 aux contrôles pertinents seulement : droit de rétractation, reconductions par type, accord RGPD distinct, médiation non conventionnée tant que non prouvée, RC Pro non attestée et non arbitrée, refus de publication automatique, Abby manuel.
7. Tester simulation, idempotence, sauvegardes de versions, doublons, changement de source, textes complets et snapshots immuables ; sur bases TEMP et vraies interfaces Electron/exports si disponibles. Typecheck/Vitest + vérification documentaire. Rapporter les tests réellement exécutés.
8. Sur branche dédiée **basée sur le vrai code courant** (lot 2 inclus si c'est la base retenue) : commits ciblés, PR en brouillon pour revue, sans fusion `main`, sans mise en service, sans insertion dans la préproduction sans autorisation distincte.

## Commande de préaudit read-only (Windows)

```powershell
python audit_preintegration.py --pack-root "C:\\chemin\\vers\\pack-decompresse" --db "C:\\DEV\\03_LIVRAISONS\\AtoumWeb\\Manager-PREPRODUCTION-UX-V2-20261104\\Workspace-TEST\\data\\atoumweb-manager.sqlite" --out "C:\\chemin\\rapports-preaudit"
```

La base est ouverte par SQLite `mode=ro` et `PRAGMA query_only=ON`. Aucun écrit SQL n'est envoyé. Le script produit notamment `RAPPROCHEMENT_V39_18.csv` avec des suggestions **non approuvées** ; il ne faut jamais en déduire automatiquement un alias ou une mutation.

## Frontière de cette intervention

**Réalisé ici** : lecture des consignes, audit documentaire de l'intégrité, lecture du code GitHub publié, repérage de deux préconditions anciennes, création/test d'un préaudit non mutant et inventaire V39.

**Non réalisé ici** : lecture des modifications locales non committées, correspondance aux IDs réels, modifications du code applicatif, migration, exécution des tests du Manager, commit/push ou PR. Ces tâches demandent la reprise sur le worktree Windows contenant le lot 2.

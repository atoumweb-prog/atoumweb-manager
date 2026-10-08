# Contrats — Lot 3 : reprise commerciale V1, application réelle autorisée

03/10/2026. **Application réelle Lot 3 autorisée et effectuée après fermeture technique. 112 versions nouvelles en BROUILLON, aucune publication.** Lot 3 validé et committé seul localement : `1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`, recette manuelle restant à faire. Aucun push/merge. Lot 4 désormais appliqué après autorisation séparée, uniquement en brouillon ; voir le bilan réel `CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`. Aucun travail Bridge ou 8C. La préparation et le dry-run ci-dessous sont conservés comme historique avant cette application ; la section finale fait foi pour l'état réel.

## Séparation des lots

Lot 2 committé localement, seul : **`1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9`**, branche `feature/project-page-compositions-v1`. Son message mentionne la recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale. Arbre propre avant tout code Lot 3. Lot 1 antérieur : `dedb865f4cdabd518391b63f067ed8e2647c869b`. Aucun des deux commits n'a été poussé.

## Référentiel et mapping

Source : `C:\Users\AtoumWeb\Documents\ChatGPT\manager atoumweb+ bridge\outputs\catalogue-contractuel-v1\AtoumWeb_Catalogue_V1_Contractuel_consolide.xlsx`, onglet `Catalogue`, colonnes A:T uniquement (commerciales). Classeur ouvert en lecture seule, SHA-256 **`3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`**. Aucune feuille/code/lien contractuel importé.

Extraction commerciale : 112 codes AW uniques ; 6 offres, 45 services, 37 options, 13 packs, 11 abonnements. Modes : 77 fixes, 16 à partir de, 18 sur devis, 1 coût tiers réel. Les modes ne deviennent pas mensuel/annuel par déduction : unité et périodicité restent indépendantes. Un coût tiers réel reste sans montant catalogue, `quote_only` / `actual_cost`.

Manifeste des 45 anciens IDs : mapping explicite, avec UUID de version contrôlée. Après décision AtoumWeb : 21 reprises, 9 conservations génériques et 15 archives réversibles (7 déjà prévues + les 8 anciennes ambiguïtés). Aucun rapprochement par nom/ordre/similarité ; aucune création de substitution lorsqu'un ancien ID explicitement repris manque. Les 8 codes cibles précédemment bloqués sont créés comme nouveaux objets distincts.

## Résultat exact de la simulation

**Aucune prestation créée, mise à jour ou archivée dans Validation-MSI.** Les nombres suivants sont le plan et la répétition sur copie temporaire.

| Action | Nombre |
| --- | ---: |
| Créer (identité certaine) | 91 |
| Reprendre un ancien UUID, nouvelle version | 21 |
| Conserver un ancien objet générique | 9 |
| Archiver réversiblement | 15 |
| Rapprochements métier À VÉRIFIER | 0 |
| Codes AW bloqués | 0 |

Le tableau exhaustif comprend **136 lignes** : 112 références AW + 24 anciennes entrées sans code cible attribué. **112/112 cibles = 91 créations + 21 reprises. Zéro `verify`, zéro code bloqué, zéro anomalie technique.** Les 24 anciennes entrées sans AW sont les 9 conservations et 15 archives. Ancien plan historique : 83 créations et huit cibles suspendues, remplacé par la décision explicite AtoumWeb de ne rapprocher aucun des huit anciens objets ambigus.

Fichiers de simulation dans `C:\Users\AtoumWeb\Documents\ChatGPT\manager atoumweb+ bridge\outputs\catalogue-lot3` :

- `simulation-catalogue-v1.md` : tableau complet, anciennes versions/prix, nouvelles versions/prix et décisions closes ;
- `simulation-catalogue-v1.csv` : tableau exploitable ;
- `simulation-catalogue-v1.json` : plan et empreinte de contrôle, preuves avant/après, conservation par table, résultat du rejeu.

### Huit décisions métier closes

| Ancien ID | Décision validée | Code sur l'ancien objet |
| --- | --- | --- |
| `atoumweb-applications` | Archive réversible, nouvelle référence distincte | Aucun |
| `atoumweb-migration` | Archive réversible, nouvelles références distinctes | Aucun |
| `atoumweb-remise` | Archive réversible, nouvelles références distinctes | Aucun |
| `atoumweb-page` | Archive réversible, nouvelle référence distincte | Aucun |
| `atoumweb-produits100` | Archive réversible ; AW-ECOM-IMPORT reste la reprise prévue de atoumweb-import | Aucun |
| `atoumweb-page-eco` | Archive réversible ; aucune double attribution de AW-WEB-PAGE-SUP | Aucun |
| `atoumweb-contenu-client` | Archive réversible, nouvelle référence distincte | Aucun |
| `atoumweb-images` | Archive réversible, nouvelle référence distincte | Aucun |

Les huit créations distinctes sont : `AW-APP-DEV`, `AW-CONT-IMG3`, `AW-CONT-INTEG-WP`, `AW-TECH-MIGRATION-AW`, `AW-TECH-MIGRATION-CPLX`, `AW-TECH-REMISE-WC`, `AW-TECH-REMISE-WP`, `AW-WEB-PAGE-SUP`. Chaque nouvel UUID est différent des anciens et reçoit sa version V1 brouillon. Aucune exception technique nécessaire pour ces huit archives : les anciennes versions et relations restent accessibles par ID ; aucune sélection commerciale active ne les propose. Les neuf génériques conservés pour l'historique et les compositions restent inchangés.

## Comportement réalisé

| Sujet | Avant | Après Lot 3 testé |
| --- | --- | --- |
| Reprise | Pas de pipeline commercial V1 | Extraction traçable et mapping UUID → AW contrôlé, simulation sans écritures |
| Historique | Versions existantes publiées | Même UUID, nouvelle version BROUILLON ; ancienne version/prix/composition intacts |
| Métadonnées de l'item | Nom/catégorie courants | Nom/catégorie V1 ; ancienne ligne d'item conservée dans le journal avant/après, snapshots de devis intacts |
| Blueprint | Nouvelle version sans copie des liens | Copie des liens `base/addon`, versions de blueprint et ordre conservés |
| Composition | Copie des composants d'offre existante | Copie conservée, IDs de versions de composants historiques inchangés ; aucune nouvelle composition inventée |
| Paramètres | Données catalogue non toutes représentables | JSON descriptif versionné : travail, options, livrables, délais, recette, garantie, coûts tiers ; aucun lien de clause généré |
| Publication | Action distincte déjà disponible | Import n'appelle jamais la publication ; anciennes versions publiées toujours commerciales jusqu'à publication séparée |
| Archive | Statut réversible | Quinze anciens items archivés sans suppression ; versions/références conservées et réactivation respectée |
| Rejeu | Risque de doublons | Empreinte par source/record et version importée ; second passage sans modification, refus si changement humain constaté |
| Contrôle d'accord | Aucun plan | Jeton SHA-256 lié au plan, versions, identités, compositions et liens ; refus d'un plan périmé |
| Atomicité | Opérations unitaires | Transaction entière ; savepoints pour création/version/attribution imbriquées, rollback complet si échec |

Les types techniques historiques `offer/service` ne sont pas changés implicitement, même si la nature commerciale V1 est `pack`. Les compositions existantes utiles restent portées par leurs offres techniques. Les 9 services génériques conservés n'ont pas de code AW inventé.

L'Excel ne fournit pas un graphe de composition machine-readable complet : les inclusions de nouvelles prestations sont conservées textuellement ; aucun lien supplémentaire n'est déduit de ces phrases. Les compositions historiques, y compris leurs options facultatives, sont préservées sans résoudre les options achetées. Les blueprints composés relèvent du Lot 7 du chantier métier.

## Migration

**54 — `catalog_import_v1_provenance`**, après vérification que la séquence actuelle s'arrêtait à 53 :

- colonne nullable `catalog_versions.commercial_parameters_json`, JSON valide ;
- `catalog_import_runs`, empreintes source/manifeste/payload et bilan ;
- `catalog_import_entries`, action/item/versions source-cible, empreinte du record et ligne d'item avant/après ;
- clés étrangères et unicité des entrées d'un passage.

Aucun seed ni modification des SQL 1–53. Migration 54 testée en mémoire ; migrations 53/54 testées aussi sur sauvegarde temporaire. **Ni 53 ni 54 appliquées à Validation-MSI.** Ne pas démarrer ce code contre la base réelle avant autorisation, car l'initialisation normale applique les migrations pendantes.

## Vérification et preuves

- `npm run typecheck` : sortie 0, incluant le simulateur TypeScript.
- Suite complète initiale avant clôture des décisions : **57 fichiers / 388 tests / 0 échec**. Non relancée pour cette seule mise à jour ciblée du plan.
- Après décisions : **13/13 tests ciblés d'import**, zéro échec, typecheck réussi. Contrôles supplémentaires des huit archives sans code ni nouvelle version, huit créations distinctes et maintien du refus des ambiguïtés dans un manifeste non décidé. Conservation des snapshots DEV-001/002/003, projet témoin, compositions, liens blueprint, quatre modes de prix, unités, rejeu et rollback complet toujours couverts.
- Harness UI `node scripts/check-catalog-identity-ui.cjs` : **18/18**, dont consultation du brouillon importé, paramètres/inclusions/provenance visibles et ancienne version publiée inchangée. Renderer réel, IPC simulé et profil temporaire ; ne remplace pas la recette manuelle AtoumWeb.
- Répétition intégrale sur copie de la base réelle : **91 nouveaux items, 21 nouvelles versions, 15 archives ; 112 nouvelles versions toutes brouillon**. Total temporaire 136 items / 157 versions. 44 anciennes versions publiées conservées. 127 entrées de journal. 112/112 codes uniques effectivement présents.
- Rejeu : **0 création / 0 reprise / 0 archive / 0 verify**, 136 conservations ; toutes les tables, versions, activité et journal de la copie strictement inchangés au deuxième passage.
- Preuve dédiée pour les huit anciens objets : noms/type/identités/métadonnées hors statut et dates d'archivage inchangés, aucun code AW, aucune nouvelle version, exclusions de sélection active et relations historiques conservées. Les huit nouveaux UUID sont distincts de tous les UUID historiques. Résultats détaillés `legacyPreservation` et `distinctCreation` dans le JSON.
- Comparaison de chaque ancienne version/composition/lien blueprint ; UUID des anciens items conservés, changements de leurs métadonnées tracés dans le journal. Toutes les autres tables métier strictement inchangées, dont devis/lignes/projets/documents/instances contractuelles. Migrations additives également contrôlées sur chaque ancienne colonne.
- `foreign_key_check` vide, `integrity_check=ok` sur la copie ; copie supprimée à la sortie.
- Validation-MSI avant/après : **`5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`**, WAL/SHM absents et restés absents ; classeur source inchangé.

Commande reproductible, **toujours sur copie**, aucun argument d'application réelle disponible :

```powershell
node scripts/simulate-catalogue-v1-import.cjs --database 'C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\data\atoumweb-manager.sqlite' --workbook 'C:\Users\AtoumWeb\Documents\ChatGPT\manager atoumweb+ bridge\outputs\catalogue-contractuel-v1\AtoumWeb_Catalogue_V1_Contractuel_consolide.xlsx' --output 'C:\Users\AtoumWeb\Documents\ChatGPT\manager atoumweb+ bridge\outputs\catalogue-lot3' --rehearse-temporary
```

Le service conserve le refus d'une application intégrale avec ambiguïtés. Il n'y en a plus dans ce manifeste validé ; la répétition utilise désormais le chemin intégral normal, sans `allowPartial`. Aucune API IPC/UI d'import en production n'est exposée dans ce lot.

## Fichiers Lot 3

- `data/catalogue/atoumweb-catalogue-v1.json` ; `data/catalogue/atoumweb-reprise-v1.json` ;
- `scripts/extract-catalogue-v1.py` ; `scripts/simulate-catalogue-v1-import.cjs` ; `scripts/simulate-catalogue-v1-import.ts` ;
- `src/main/commercial/CatalogImportService.ts` ; `src/main/commercial/CatalogImportService.test.ts` ; `src/main/commercial/CatalogService.ts` ;
- `src/main/database/catalogImportV1Migration.ts` ; `src/main/database/migrations.ts` ; `src/main/database/migrations.test.ts` ; `src/main/database/catalogIdentityV1Migration.test.ts` (attentes de fin de séquence seulement) ;
- `src/shared/commercial.ts` ; `src/renderer/commercial/CatalogPage.tsx` ; `scripts/check-catalog-identity-ui.cjs` ; `tsconfig.json` ;
- `PROJECT_STATUS.md` ; `docs/HANDOFF_CODEX_MSI.md` ; `docs/MANAGER_BRIDGE_ROADMAP.md` ; ce bilan.

## Arrêt / périmètre restant

Les huit décisions métier sont closes. Il reste uniquement à obtenir le feu vert AtoumWeb séparé pour la première écriture réelle et, distinctement, l'activation commerciale des versions. Aucune donnée réelle, migration réelle, nouvelle clause ou liaison contractuelle créée. Les 118 clauses, 409 liens, paramètres contractuels du devis, options achetées, blueprints composés, objets opérationnels, Abby, Bridge et Lot 8C sont hors périmètre. Aucun Lot 4 sans nouveau feu vert.


## Mise à jour — application réelle Lot 3 (état actuel)

03/10/2026 — Application autorisée par AtoumWeb après fermeture technique. Aucun démarrage de Manager, aucun commit/push/merge. Arrêt avant Lot 4.

## Contrôles avant application

- Suite complète sur le code exact du Lot 3 : **57 fichiers / 390 tests / 0 échec** ; `npm run typecheck` : sortie 0.
- Working tree : **20 fichiers attendus du Lot 3 seulement**, aucun fichier staged, branche `feature/project-page-compositions-v1`, HEAD local `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9`. Aucun changement de code après ces tests ; seules les preuves d'exécution et la documentation sont ensuite produites.
- Nouveau dry-run complet conservé dans `fermeture-technique` ; DB, XLSX, payload, manifeste et jeton égaux aux empreintes validées.
- Base en mode WAL : **WAL présent mais vide (0 octet), SHM présent (32 768 octets)** ; aucune donnée durable à récupérer du WAL et aucun journal de rollback actif. La mémoire partagée SHM sert aux verrous, pas à une sauvegarde de données ; sa lecture brute sous verrou est refusée par Windows et n'est pas requise.
- Transaction d'écriture exclusive acquise, vérifiée par une seconde connexion dont `BEGIN IMMEDIATE` est effectivement refusé. Cela exclut une écriture concurrente pendant copie/migrations/import ; ce contrôle ne prétend pas interdire des lecteurs.
- Copie physique sous ce verrou, identité SHA-256 avec la base validée, `integrity_check=ok` sur la copie avant toute migration.
- Migrations 53/54 et import réalisés dans **une transaction englobante**, avec savepoints pour les opérations existantes. Les anciennes colonnes de toutes les tables sont comparées après les migrations et avant l'import. Recalcul du jeton immédiatement avant l'import ; toute différence provoque un rollback complet. Le service vérifie à nouveau le jeton sous transaction.

## Sauvegarde et empreintes

Sauvegarde physique : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`.

| Élément | SHA-256 |
| --- | --- |
| Base avant / sauvegarde physique | `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c` |
| Base après, WAL vidé et connexion fermée | `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` |
| Classeur source inchangé | `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686` |
| Jeton du plan validé et recalculé | `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4` |
| Payload source + manifeste | `ee464c14b1296c1409976908aba5ef3b404f3b5bec62918158263aee04f45bff` |
| Manifeste structuré | `c038f1b15e864e55aca0fad6289052cb4657131099679ca0f405a4749946464a` |

Sauvegarde vérifiée à `10/03/2026 11:33:56` ; import commencé à `10/03/2026 11:33:56` (UTC). Contrôles finaux : `10/03/2026 11:33:58`. Aucun démarrage de l'application entre les étapes.

## Résultat réel

| Action / contrôle | Résultat |
| --- | ---: |
| Migrations appliquées | 53 et 54 |
| Créations | 91 |
| Reprises par nouvelle version | 21 |
| Archives réversibles, sans code AW | 15 |
| Historiques génériques conservés sans AW | 9 |
| Codes AW canoniques présents | 112/112 |
| Nouvelles versions en BROUILLON | 112 |
| Publication automatique | 0 |
| Items totaux | 136 |
| Versions totales | 157 |
| Anciennes versions publiées, inchangées | 44 |
| Brouillons totaux (112 nouveaux + 1 ancien) | 113 |
| Passages d'import journalisés | 1 |
| Opérations journalisées | 127 |
| Liens blueprint totaux | 3 (2 anciens + 1 copie) |

Les huit anciens objets autrefois ambigus restent distincts des nouvelles références V1, sans AW ni nouvelle version. Les métadonnées des archives sont identiques hors statut et dates d'archivage. Les neuf génériques sont inchangés.

Les 21 reprises conservent leurs anciens UUID et versions exactes. Leurs nouvelles versions reprennent exactement les liens blueprint (version de template, rôle, ordre) et compositions existants. L'absence de lien chez certaines prestations reste une absence : aucun blueprint inventé.

## Conservation historique et intégrité

Comparaison de toutes les anciennes lignes/colonnes contre l'état pré-application puis contre la sauvegarde physique, avec une contre-vérification indépendante Python/sqlite3 en lecture seule :

- `DEV-2026-001` : accepté, ligne exacte inchangée ;
- `DEV-2026-002` : envoyé, ligne exacte inchangée ;
- `DEV-2026-003` : accepté, ligne exacte inchangée ;
- lignes et snapshots de devis, Projets, services, Sites/Pages existants, documents et tables contractuelles : inchangés ;
- toutes les anciennes versions catalogue, compositions et relations blueprint : conservées exactement ;
- seuls les changements catalogue et leur activité/journal autorisés sont ajoutés ; aucun import des 118 clauses/409 liens.

`integrity_check=ok` ; `foreign_key_check` vide après application. Checkpoint WAL final sans blocage, fichiers de données synchronisés et connexion fermée avant calcul de l'empreinte finale.

## Rejeu sur la base réellement appliquée

**0 création / 0 reprise / 0 archive / 0 verify / 136 conservations.** Rejeu effectué après COMMIT de l'application ; empreinte logique de toutes les tables strictement identique avant/après, activité et journal inclus. Aucun nouveau passage d'import ajouté.

## Preuves et limites

- `application-lot3-validation-msi.json` : transaction, sauvegarde, empreintes, comptages, conservation par table/ancien objet, devis et liens blueprint, rejeu.
- `contre-verification-lecture-seule.json` : comparaison indépendante directe SQLite contre la sauvegarde physique.
- `fermeture-technique/simulation-catalogue-v1.*` : répétition finale sans altérer le dry-run validé original.
- `fermeture-technique/application-helper-rehearsal.json` : essai préalable du même lanceur sur copie ; il ne décrit pas une seconde application réelle.
- `fermeture-technique/apply-validated-lot3.cjs` et `run-closure.cjs` : trace du lanceur ponctuel, hors dépôt. Toute réexécution réelle sur la nouvelle base est refusée par l'empreinte avant attendue ; ils ne constituent pas une API d'import utilisateur.

La recette manuelle AtoumWeb reste à faire avant validation fonctionnelle finale. Aucune version V1 publiée ; activation commerciale séparée. Lot 3 reste non committé. Aucun Lot 4 sans nouveau feu vert, aucun import de clauses, Abby, Bridge ou Lot 8C.


Clôture Lot 3 — 03/10/2026 : bilan réel validé par AtoumWeb ; commit local dédié autorisé, sans push ni merge. La recette manuelle AtoumWeb reste à faire avant validation fonctionnelle finale. Cette clôture ne contient aucune modification du Lot 4.

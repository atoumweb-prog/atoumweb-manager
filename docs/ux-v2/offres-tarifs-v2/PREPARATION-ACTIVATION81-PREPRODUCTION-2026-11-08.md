# Migration 81 — préparation PRÉPRODUCTION — 08/11/2026

## Autorisation et source confirmée

Carlos valide le lot 2 graphique/fonctionnel dans son périmètre TEMP et autorise identification, sauvegarde, restauration, essai sur copie isolée et préparation technique d'activation. Aucun commit/push/PR/fusion ni migration sur la base habituelle. Données clients fictives, mais aucune suppression automatique autorisée ; Catalogue/prix/configurations/CGV/clauses/référentiels/associations/paramètres et travaux à préserver.

Aucun Manager ouvert lors de l'identification. Plusieurs profils trouvés, sélection **confirmée par Carlos** : « PRÉPRODUCTION UX V2 — Workspace-TEST du 04/11 ».

- Lanceur : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-PREPRODUCTION-UX-V2-20261104/OUVRIR-PREPRODUCTION-UX-V2.cmd`.
- Profil : même dossier `/Profil-TEST`, confirmé par `Runtime/launch.cjs` et `Profil-TEST/workspace.json`.
- Base : `C:/DEV/03_LIVRAISONS/AtoumWeb/Manager-PREPRODUCTION-UX-V2-20261104/Workspace-TEST/data/atoumweb-manager.sqlite`.
- Distincts : `Manager-RECETTE-UX-V2-20261104/Workspace-TEST`, les fixtures `%TEMP%`, et l'ancien profil `%APPDATA%/AtoumWeb Manager/workspace.json` qui pointe vers Validation-MSI. Ce dernier fichier de configuration a été lu pour identifier la différence ; **aucune base Validation-MSI n'a été ouverte**.

## Compatibilité et conservation constatées

Registre exact compatible 1–80, pas de 81 ; aucun brouillon historique multiple incompatible dans la base sélectionnée. Précontrôle et intégrité conformes. **142 tables** et **487 objets applicatifs** avant migration inventoriés ; comparaison de toutes les lignes et de tous les champs historiques, IDs et FK, pas seulement d'une liste commerciale. Registre conservé avec ajout explicite 81 sur copie. Définitions des objets existants conservées, sauf reconstruction prévue de `catalog_versions` et adaptation prévue des triggers actual-cost.

Contenu effectivement présent avant recette : **44 articles / 44 versions Catalogue**, **2 rattachements de blueprints**, **2 modèles / 2 versions de modèles**, **11 paramètres** ; compositions existantes préservées (duplication testée avec une référence non vide). Tarifs et configurations contenus dans les lignes Catalogue intégralement comparés avant/après ; aucun changement de prix ou clause.

**Réserve importante : la bibliothèque contractuelle de cette préproduction est vide** : 0 `contract_clause_templates`, 0 `contract_clause_versions`, 0 `contract_types`, 0 `catalog_contract_clause_links`, 0 `catalog_contract_type_links`. L'essai conserve cet état ; il ne prouve pas qu'une bibliothèque CGV remplie d'un autre environnement a été sauvegardée. Confirmer le rôle de cette base de démonstration avant mise en service. Ne pas importer automatiquement un autre référentiel. Les preuves TEMP antérieures restent utiles, mais ne remplacent pas l'identification d'une source CGV de travail si elle est différente.

Relations protégées : `catalog_items` → `catalog_versions` ; compositions → versions de services ; catégories et recommandations ; liens Catalogue/clauses/types/versions contractuelles/modules ; modèles/versions/blueprints ; règles commerciales et liens opérationnels ; settings ; Devis/contrats/projets et leurs snapshots, ainsi que toutes les autres tables inventoriées. L'inventaire JSON contient les FK de chaque table et leurs effectifs, y compris les tables vides.

## Sauvegarde et restauration réalisées

Preuves locales : `outputs/Activation81-Preproduction-2026-11-08/`.

- `SAUVEGARDE-RESTAURATION.json`, `backup-coherent.sqlite` : API SQLite de backup depuis connexion source **read-only**. Aucun frame WAL au moment constaté ; mode immutable utilisé uniquement dans ce cas afin d'éviter la création de journaux. Si un WAL non vide existe, utilisation de la vue normale de backup SQLite incluant ses transactions, jamais immutable ni copie du seul fichier ouvert.
- Source SHA256 avant/après : `38f496cbe586b00f8b86dc438ca555b9657cc3a09e013c7246b129111f15e80b` ; WAL vide SHA256 inchangé. Empreintes revérifiées après les essais.
- Backup SHA256 : `307dcde895cb5d6788edd237e761680a3c5d1c34d627cbce67366035525e6f4e`.
- Restauration par API SQLite vers `C:/Users/AtoumWeb/AppData/Local/Temp/atoumweb-catalog-activation-47n7nq7i/restored.sqlite` ; égalité logique complète du dump, intégrité `ok`, FK vides. La copie restaurée est ensuite devenue copie de recette ; la sauvegarde reste intacte.
- Sauvegarde **SQLite**, pas archive complète des fichiers du workspace ni du profil Chromium. Les références externes n'ont pas été déplacées ; aucun fichier technique/contrat n'a été exécuté. Pour une future restauration globale, conserver également les ressources et la configuration de profil correspondantes.

Le nouveau script de sauvegarde a aussi été vérifié sur fixture déterministe avec WAL **non vide** : ligne commitée présente uniquement dans le WAL incluse dans la restauration, empreintes source inchangées. Premier essai sur fixture arrêté car SQLite read-only créait un WAL vide ; comportement corrigé par sélection conditionnelle du mode immutable sans frames WAL. Aucun essai défectueux sur la base habituelle.

## Essai de migration et fonctions

`ESSAI-MIGRATION-COPIE.json` : migration 81 exécutée **seulement sur la restauration TEMP**, sans toucher aux protections du helper. Toutes les données historiques des 142 tables comparées avant les écritures fonctionnelles ; IDs, références, index/triggers et FK préservés selon les adaptations documentées. Intégrité finale `ok`, aucune violation FK.

Sur la copie : création nom/type seuls sans tarif fictif, sauvegarde manuelle, fermeture physique/réouverture et reprise du même ID/version ; duplication indépendante depuis version explicitement choisie avec références et rejeu du même reçu sans doublon. Duplication testée ici avec une composition non vide. Les 74 tests et recettes 18/24/25/19 antérieurs sont conservés, sans campagne générale ni nouvelles captures.

## Préparation technique et activation future proposée

Nouveaux fichiers : `catalogDraftActivation.ts` (précontrôle read-only + point d'essai TEMP), 4 tests ciblés, `prepare-catalog-draft-snapshot.py` (source/profil explicites, backup/restauration/empreintes), `rehearse-catalog-draft-copy.cjs` (restauration TEMP vérifiée uniquement, inventaire/conservation/essai), ce rapport. Typecheck et 4/4 tests réussis ; diff-check conforme.

`PLAN-ACTIVATION-NON-AUTORISE.json` épingle source/profil/backup, capacités et étapes restant soumises à décision. **Aucun handler de migration réel ni ajout aux migrations automatiques n'est activé**. La fonction expérimentale conserve son refus hors TEMP. Le module de préparation n'est relié ni au démarrage ni à l'IPC.

Proposition adaptée au développement : après confirmation du contenu Catalogue/CGV et autorisation explicite, livrer un runtime lot 2 compilé depuis ce seul checkout dans un nouveau dossier de livraison ; conserver l'ancien runtime. Préparer une commande de maintenance distincte et explicitement approuvée pour le chemin/profil exacts, avec précontrôle, sauvegarde/restauration vérifiées, transaction, contrôle final et journal des vrais débuts/échecs/succès (chemins, empreintes, backup, schéma, erreurs, timestamp). Ne pas détourner le helper TEMP pour la base réelle ; toute extension hors TEMP doit être distincte, contrôlée et revue avant exécution. Pas d'activation par ouverture ordinaire d'un autre profil.

La livraison du 04/11 utilise son runtime figé : migrer son fichier SQLite seul ne mettrait pas les nouveaux écrans en service. Renouveler inventaire/backup si la base change entre préparation et activation. Si des brouillons multiples apparaissent, bloquer et présenter leurs IDs/contenus/références et conséquences ; pas de choix automatique même sur données fictives.

Retour arrière : rollback transactionnel avant succès ; après succès, restauration de la sauvegarde cohérente avec code/profil compatibles, sous décision explicite et après préservation séparée des nouvelles écritures. Pas de downgrade SQL destructif ni ancien binaire seul sur nouveau schéma.

## État et prochaine décision

Lot 2 accepté dans son périmètre TEMP ; essai sur copie de la préproduction réussi. Attendre le retour de Carlos sur la réserve CGV et l'autorisation d'activation/livraison. Aucune modification ni migration de la source, aucune suppression/reclassification, aucun autre worktree touché, aucune opération Git ni lot 3. Les JSON/SQLite restent locaux dans outputs/TEMP et ne sont pas destinés au dépôt.

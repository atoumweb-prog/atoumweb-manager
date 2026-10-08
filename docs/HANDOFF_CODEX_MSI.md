# Handoff Codex MSI — AtoumWeb Manager

## État courant — 08/10/2026

- Dépôt : `C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager`.
- **Branche consolidée active : `fix/pre-phase5-commercial-ux`.** `feature/project-blueprints-v1` et les branches de Phase ne sont plus les bases de travail actuelles.
- Checkpoint fonctionnel validé : **`8662c3fbeaf2e3b26a68cffa779422f395edd400`**. Son parent `1f7dafc8e90c78aec3871ee19917adb56f43a511` intègre Phase 7 ; le commit de port ajoute seulement le parcours guidé de réemploi et ses contrôles.
- **Projet V2, Sites/Pages/compositions, Devis/contrats/Builder CGV, Catalogue 112, opérations et Phase 7 Statistiques/Rentabilité intégrés.**
- **Migrations SQLite exactement 1–65**. Le checkpoint migration 60 et ses tables vides décrivent l’historique, pas l’état actuel.

| Validation du checkpoint fonctionnel | Résultat |
|---|---|
| Typecheck | OK |
| Tests ciblés réemploi/référentiels | 56/56 |
| Suite complète | 670/670 dans 77 fichiers |
| Recette UI sur les trois thèmes | 55/55 |
| integrity_check | OK |
| foreign_key_check | Vide |

Les résultats sont ceux du port de réemploi validé par AtoumWeb. La synchronisation documentaire qui suit ne modifie aucun code fonctionnel et ne constitue pas une nouvelle recette.

## Doctrine de reprise

Validation-MSI (`C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI`) reste une **base mutable de développement/test**, non productive. Les dossiers sont identifiés TEST ; ne pas transformer son SHA ou ses comptages en oracle de tests. Sauvegarder avant une migration ou une modification destructive importante ; maintenir intégrité, relations et migrations rejouables.

Ne pas réimporter ou remettre à zéro les référentiels déjà configurés pour la recette, ni réappliquer les anciens lots pour reproduire leurs anciennes empreintes. Les publications et mises en usage constatées concernent les dossiers TEST. Les informations administratives fictives ne permettent aucun usage productif.

Les parcours actuels restent fondés sur les sources existantes : lignes réellement vendues et options persistées, clauses/snapshot figé, même Projet prévisionnel puis accepté, actions/temps/provenance, objets récurrents ou crédits propres aux opérations. Nouveaux cycles de date à date avec quotas sans report ; version vendue conservée ; moteur calendaire historique non migré silencieusement. Estimations internes indicatives et ajustables, dont Mariage Histoire à 27 h 30 provisoires.

## Réutilisation guidée portée

`Projet → Bibliothèque technique → Préparer pour réutilisation → copie indépendante → adaptation humaine → création volontaire d’une brique AtoumWeb avec provenance`.

Le backend `ReusePreparationService` et les API `referentials.reuse.prepareProjectItem`, `createGlobal`, `openPackage` restent la référence. Le panneau est adapté aux catégories actuelles, dont `code_snippet`, avec relecture humaine avant création. Export simple, versions, ressources, stabilité et archivage existants sont conservés. Aucun code n’est exécuté ou généralisé automatiquement ; le Projet source reste inchangé, les étapes explicites sont journalisées.

- **Ne pas fusionner la PR #62** : seul son parcours UI utile a été porté ; aucune ancienne migration/service/écran complet repris.
- **Ne pas fusionner la PR #68** : son import de packs commerciaux `.atoum` V0.2 reste un prototype historique non intégré, distinct des packages techniques actuels. Il ne bloque pas la PR finale Manager.

## Limites et chantiers distincts

- Abby manuel : préparation et copie des blocs, édition/signature externes, import du PDF accepté. Aucun connecteur ni envoi automatique.
- Aucune validation juridique globale des clauses. Les réserves et données réelles à renseigner restent applicables.
- Statistiques/rendement et suivi facturé/dépenses intégrés ; pas de suivi réel d’encaissements bancaires implicite.
- Bridge WordPress, Lot 8C et futurs lots séparés. Ne pas confondre les échanges/imports existants côté Manager avec une autorisation de modifier le plugin WordPress.

## Reprise Git et prochaine étape

Vérifier d’abord le checkout, les commits locaux et le suivi ; ne pas réinitialiser le travail local :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git status -sb
git branch --show-current
git log -2 --oneline
```

La branche attendue est `fix/pre-phase5-commercial-ux`. Le checkpoint fonctionnel à conserver est `8662c3f…`, suivi du commit documentaire de synchronisation. Les deux restent locaux tant qu’AtoumWeb n’autorise pas leur push.

**Prochaine étape : PR finale `fix/pre-phase5-commercial-ux` → `main`, après autorisation de push.** Ne créer ni PR ni merge sans instruction distincte. La CI actuelle vise un runner self-hosted Windows X64 ; son absence constatée lors de l’audit doit être contrôlée au moment du contrôle final.

## Archives de reprise — ne pas les utiliser comme état courant

Les blocs ci-dessous conservent les checkpoints, preuves et consignes à leurs dates respectives. Les anciennes mentions de tables vides, migration 60, branches actives, SHA figés ou « prochain lot » ne décrivent plus le présent. Les anciennes commandes sont conservées comme texte d’archive et ne doivent pas servir à une synchronisation actuelle. Pour l’état présent, les sections précédentes font foi, en cohérence avec README, PROJECT_STATUS, roadmap et AGENTS.

## Historique — checkpoint du 04/10/2026 — Lot 8A appliqué, clôture locale dédiée

- AtoumWeb valide la migration 60 seule et autorise le commit local dédié **Lot 8A — actions opérationnelles, temps et provenance**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; son SHA et les preuves sont consignés hors dépôt dans `outputs/operational-lot8a/cloture-git-lot8a.json`.
- Avant commit : **36 fichiers préparés**, toutes les empreintes validées conformes, aucun artefact de base/sauvegarde/XLSX/JSON de simulation/capture inclus. Code fonctionnel et migration 60 identiques à **534/534 tests, typecheck OK, UI 69/69, simulation 209/209**. Seuls les documents de suivi et le bilan préparatoire sont actualisés pour refléter l’application et cette clôture.
- Validation-MSI **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** conservé sans écriture pendant clôture. Sauvegarde avant migration : **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, égal à la source sous verrou ; seconde écriture refusée. 113 tables historiques comparées exhaustivement et contre-vérifiées indépendamment, intégrité OK/FK vide, rejeu neutre logiquement/physiquement, aucun auxiliaire résiduel.
- Les cinq tables `operational_import_runs`, `operational_model_versions`, `blueprint_operational_profiles`, `catalog_operational_links`, `project_action_instances` sont **vides**. Colonnes business_category historiques **NULL**. Aucun import XLSX, modèle réel, ready, Vitrine V2 réelle, association opérationnelle, recalcul ou backfill.
- 112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options vides intacts ; les trois devis et deux Projets, Sites/Pages, nœuds, sessions, blueprints et documents historiques conservés. Aucun objet Lot 8B.
- **Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Raccord réel des associations commerciales non commencé.** Aucun Lot 8B, Abby, Bridge ou 8C ; aucun push/merge. Attendre une nouvelle autorisation avant import ou raccord réel.
- Bilan préparatoire `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md` ; application réelle et contre-vérification dans `outputs/operational-lot8a/application-migration60-validation-msi.md/json` et `contre-verification-migration60.json`, hors dépôt. Les manifestes préparatoires validés sont conservés historiquement sans réécriture.

## Historique — 04/10/2026 — Lot 8A opérationnel préparé, copie uniquement

- Décisions AtoumWeb appliquées au manifeste : A19 point de restauration avant publication et A16 consentement uniquement technique, 60 min chacune inchangées ; A12 pages légales, A21 sauvegarde livraison. XLSX intact. Projet standard V1 strictement historique.
- Migration **60 préparée seulement** : cinq tables, deux colonnes métier nullable, références initiales/compatibilités immuables. Versions des modèles indépendantes des publications catalogue/clauses. Aucun backfill.
- Audit complet : Vitrine V1 13 tâches / 525 min inchangée ; V2 structurelle simulée sans ces tâches, conteneurs/Site/5 Pages conservés. V1 publiée maintenue ; V2 draft mise en usage opérationnel explicite/figée, associations exactes versionnées. Ancienne V1 + modèle bloquée ; structure sans modèle bloquée.
- **112 modèles / 432 actions importés en BROUILLON sur copie** : 94 refs/388 actions 8A ; 18 refs/44 actions 8B inertes ; trois packs zéro action ; 22 refs 8A à estimation obligatoire gardent estimation courante NULL. Aucun mapping réel inventé ni publication.
- **534/534 tests (63 fichiers, 31 nouveaux), typecheck OK, UI 69/69 sur trois thèmes, simulation SQLite 209/209**, intégrité OK/FK vide. Vitrine 21 actions/24 h 30 ; +2 Pages 29/28 h ; +Blog 34/31 h ; pack 4 articles 4/13 h ; application 3/3 h indicatives, estimation finale absente.
- Génération intégrée au Projet prévisionnel et aux révisions/acceptation ; provenance complète, versions épinglées, manuel conservé, retrait vierge et conflits travaillés. Chrono existant inchangé dans son calcul hors pauses ; cinq catégories métier historisées. Recette manuelle AtoumWeb à faire.
- Validation-MSI **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, et XLSX **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangés. 112 AW/112 catalogue draft/118 clauses draft/409 liens/achats vides/historiques intacts.
- Branche `feature/project-page-compositions-v1`, HEAD **378f11568cddc462e29df6117425631e03e89b80** inchangé. Aucun commit/push/merge ni application réelle ; **ne pas démarrer Manager sur Validation-MSI (60 pendante)**. Aucun Lot 8B, Abby, Bridge ou 8C.
- Bilan `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md`, matrice exhaustive 112 et preuves dans `outputs/operational-lot8a` du dossier documentaire partagé. Les associations commerciales réelles, notamment le service historique inclus lié à Vitrine V1, restent à configurer explicitement après autorisation : les scénarios commerciaux sont synthétiques, le blueprint cloné est réel.

## Historique — 03/10/2026 — Lot 5 validé, clôture locale dédiée

Ce bloc faisait foi à sa date ; les préparations et bilans d’application antérieurs restent historiques.

- AtoumWeb valide le bilan réel et autorise le commit local dédié **Lot 5 — paramètres contractuels et preuves**, sans push ni merge, sur feature/project-page-compositions-v1. Le commit contenant ce bloc constitue le checkpoint Lot 5 ; son SHA exact figure dans outputs/contract-parameters-lot5/cloture-git-lot5.json et git log -1.
- Migration **56 appliquée avec succès sur Validation-MSI**, aucun backfill des anciens devis, aucune publication catalogue ou contractuelle, aucune donnée administrative fictive.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts** ; devis historiques et Projets inchangés. Aucun DEV-2026-004, aucun document ou preuve fictif.
- Contrôle avant commit : **38 fichiers Lot 5 attendus**, 332 sources applicatives identiques à la fermeture validée 443/443 tests + typecheck OK ; aucun changement fonctionnel. Aucun fichier généré de simulation, base, sauvegarde ou journal inclus ; les trois scripts de contrôle/simulation font partie du code prévu.
- Validation-MSI conserve l’empreinte **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71** ; aucun démarrage Manager ni écriture base pendant la clôture.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 6 non commencé.** Bridge et 8C restent suspendus ; aucune publication ni push/merge.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; application et contre-vérification conservées dans outputs/contract-parameters-lot5. Aucun autre lot inclus dans la clôture.


## Historique — 03/10/2026 — Lot 5 appliqué, avant validation de clôture

Ce bloc faisait foi à sa date ; les préparations et checkpoints précédents restent historiques.

- AtoumWeb valide le dry-run et autorise l’application réelle du Lot 5, migration 56 seule, sans backfill, devis de simulation, administration fictive ni publication. **Application terminée ; aucun commit Lot 5 autorisé avant validation du résultat.**
- Branche feature/project-page-compositions-v1, HEAD local Lot 4 **31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc** conservé. 38 fichiers Lot 5 attendus, index vide, aucun push/merge. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale.
- Code inchangé depuis les **443/443 tests + typecheck sortie 0**, UI isolée 20/20 ; aucune répétition inutile de suite. Horodatages contrôlés puis empreintes des 332 sources applicatives et des 38 fichiers attendus revérifiées avant écriture.
- Manager non démarré. Verrou exclusif acquis et seconde connexion d’écriture refusée ; WAL vide, SHM 32 768 octets, aucun journal actif. Sauvegarde physique immédiate : C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot5-2026-10-03T18-56-43-167Z.sqlite, SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; intégrité/FK vérifiées.
- Migration **56 seule appliquée**, migrations 1–55 intactes ; comparaison exhaustive des **98 anciennes tables/colonnes/lignes** contre le backup. Aucun devis, preuve, configuration administrative ou empreinte documentaire historique ajouté.
- Validation-MSI : **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle**. Les 44 versions catalogue publiées anciennes sont inchangées. DEV-2026-001/002/003, les 2 Projets et l’état documentaire antérieur sont exacts ; aucun DEV-2026-004, aucune instance de clause rétroactive.
- Nouveaux paramètres de tous les devis NULL ; table de preuves vide ; configuration contract-administration-v1 absente, états à renseigner retournés sans seed. CONS-RETRACTATION-EN-LIGNE hors bibliothèque ; RSVP sensible désactivé, qualification numérique multi-indicateurs. Garde-fous du Builder confirmés en lecture pure, aucun devis test réel.
- integrity_check ok / foreign_key_check vide, migrations **1–56** présentes. Rejeu réel aucune migration et aucune modification logique **ni physique**, checkpoint WAL réussi. Contre-vérification indépendante Python/SQLite read-only réussie.
- Base avant/backup SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; base après fermeture SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**. XLSX inchangé 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; preuves réelles application-lot5-validation-msi.md/json et contre-verification-lot5.json dans outputs/contract-parameters-lot5 du dossier documentaire partagé.
- **Lot 5 appliqué, non committé : attendre validation du bilan réel avant commit local dédié. Aucun Lot 6, publication, Abby, Bridge ou 8C ; aucun push/merge.**


## Historique — 03/10/2026 — Lot 5 préparé, simulation uniquement

Ce bloc faisait foi pour l’état de son checkpoint ; les checkpoints antérieurs restent historiques.

- AtoumWeb autorise uniquement l’implémentation locale, les tests et le dry-run du Lot 5 — Paramètres contractuels du devis et preuves. **Aucune écriture Validation-MSI ni commit Lot 5 autorisé pour cette passe.**
- Branche feature/project-page-compositions-v1, HEAD local Lot 4 **31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc** conservé, aucun push/merge. Recette manuelle AtoumWeb à faire avant validation fonctionnelle finale.
- Migration additive **56** préparée après contrôle de la base 55 ; exécutée seulement en mémoire/copie. SQL 1–55 intacts ; aucune donnée historique complétée automatiquement.
- Préparation intégrée au devis : échéancier, qualification numérique/contextuelle, garanties 30/60/90 distinctes des droits légaux, validation explicite, droits/renouvellement, administration sans valeurs fictives, B2C et RSVP minimal. Gel transactionnel enrichi ; preuves génériques et PDF SHA-256, contrôle à l’ouverture, historique de remplacement et archivage sans perte.
- Vérifications finales : **443/443 tests (59 fichiers, dont 34 nouveaux cas), typecheck sortie 0, UI Electron isolée 20/20**. Interface simulée distincte de la recette réelle AtoumWeb.
- Dry-run final sur copie : **98 tables historiques préservées à la migration**, integrity_check ok, FK vide, rejeu migration sans effet ; ancien historique exact. DEV-2026-004 test sur copie seulement, finalisation refusée pour administration réellement absente/socle publié manquant. Aucun Client/preuve/PDF inventé.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / 0 publication** conservés. DEV-2026-001/002/003 et Projets inchangés. Seuls compteur +1/index dérivé sont rafraîchis par la création CRM sur copie.
- Validation-MSI réelle toujours migration 55 et SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; XLSX SHA 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8 inchangé. Manager non démarré sur Validation-MSI.
- Bilan docs/CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md ; preuves dans outputs/contract-parameters-lot5 du dossier documentaire partagé. **Arrêt avant application réelle et attente du feu vert. Ne pas démarrer Manager sur Validation-MSI (56 pendante). Aucun Lot 6, publication, Abby, Bridge ou 8C.**


## Historique — 03/10/2026 — Lot 4 validé, clôture locale dédiée

Ce bloc faisait foi à sa date ; les états précédents restent historiques.

- AtoumWeb valide le résultat réel du Lot 4 et autorise son **commit local dédié uniquement**, intitulé `Lot 4 — import bibliothèque contractuelle V1`, sur `feature/project-page-compositions-v1`. Le commit contenant ce bloc fait foi pour le checkpoint Lot 4 ; récupérer son SHA avec `git log -1 --format=%H`. Aucun push/merge.
- 118 clauses/versions BROUILLON et 409 liens ; aucune publication contractuelle. Les 112 versions catalogue V1 restent également BROUILLON. Textes/provenance et anciens devis/Projets préservés ; migration 55 appliquée seule, intégrité et rejeu validés.
- **RECETTE MANUELLE ATOUMWEB À FAIRE avant validation fonctionnelle finale. Lot 5 non commencé ; attendre un feu vert séparé.** Bridge et 8C restent suspendus.
- Avant clôture : 21 fichiers Lot 4 attendus uniquement, aucun changement fonctionnel depuis suite complète 409/409 et typecheck OK. Validation-MSI inchangée par cette clôture, SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`. Manager non démarré, aucune écriture base.
- Rapports réels dans `outputs/contract-library-lot4` du dossier documentaire, bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`. Le bilan de clôture Git hors dépôt donne l'empreinte exacte du commit et la vérification de working tree propre.

## Historique — 03/10/2026 — Lot 4 appliqué avant validation de clôture

Ce bloc faisait foi à sa date ; les blocs antérieurs et le dry-run restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local `1ed1152cc55ada1e8731d09b9f1a6c9832ba4934` (commit Lot 3). **Lot 4 non committé, aucun push/merge.** Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale.
- AtoumWeb valide le dry-run et autorise l'application réelle sous conditions. Fermeture sur le code exact : **58 fichiers / 409 tests / 0 échec**, typecheck sortie 0, 21 fichiers Lot 4 prévus, aucun staged. Aucun changement fonctionnel après ces tests.
- Manager non démarré. WAL vide, SHM présent (32 768 octets), aucun journal actif ; writer concurrent bloqué sous verrou exclusif. Sauvegarde physique immédiate, intégrité OK : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot4-2026-10-03T12-37-38-123Z.sqlite`, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`.
- Migration **55** et import sous transaction englobante, savepoints des opérations existantes ; migrations 1–54 intactes. Empreintes XLSX/extraction/manifeste/documents/base/code contrôlées, jeton recalculé immédiatement avant import identique au validé : `8f5b0c9b3ba4a08eab134fed6061de13cd32881f295c5ed6ade66c22d1323bff`.
- Résultat réel : **118 templates / 118 versions initiales BROUILLON / 409 liens explicites** ; 19 base/99 catalog, 105 all/3 professional/10 consumer ; **0 published / 0 lien BASE**, journal 1 passage/118 entrées. LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE absent, aucun ancien alias importé.
- Textes/revues/sources/réserves/provenance exacts au XLSX du 03/10, SHA inchangé `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`. Cinq niveaux et suivi 42/52/22/2 conservés sans visa juriste automatique ; aucun arbitrage métier rouvert ni action hors clause transformée.
- Les **112 AW et 112 versions catalogue V1 BROUILLON** restent intacts ; 44 anciennes versions publiées inchangées. Devis DEV-2026-001/002/003, Projets, anciennes versions, documents et autres tables métier identiques au backup. **0 instance de clause historique**, absence `historical_missing` conservée. Builder : 0 version courante publiée éligible, brouillons non consommés.
- Après COMMIT : rejeu **0 création/version/lien supplémentaire**, toutes les tables identiques, activité/journal inclus. `integrity_check=ok`, FK vide, checkpoint WAL réussi. Contre-vérification indépendante SQLite en lecture seule contre backup : **96 tables historiques**, textes/revues/liens exacts.
- Base avant/backup SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; base après checkpoint/fermeture SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, preuves réelles `outputs/contract-library-lot4/application-lot4-validation-msi.md/json`, contre-vérification et fermeture conservées. **Attendre la validation du bilan réel avant commit local dédié Lot 4. Aucune publication ni Lot 5, Abby, Bridge ou 8C.**

## Historique — 03/10/2026 — Lot 4 préparé, avant autorisation réelle

Ce bloc faisait foi à sa date ; les blocs antérieurs restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local **`1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`** : commit Lot 3 dédié uniquement, aucun push/merge. Working tree propre constaté avant les modifications Lot 4. Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale, mentionnée dans le commit.
- Lot 3 validé : catalogue réellement importé à Validation-MSI, 112 AW, 91 créations/21 reprises/15 archives/9 conservations, versions V1 brouillon, historique et rejeu préservés. Base réelle migrations **1–54**, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` inchangé pendant Lot 4.
- Autorisation Lot 4 limitée à préparation et dry-run sur copie. Référentiel XLSX du 03/10 SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8` ; textes exacts, huit documents juridiques préservés.
- Migration additive **55 préparée et testée uniquement sur copie/mémoire** : revue/provenance des versions et journal d'import. Migrations 1–54 inchangées, aucun seed/import automatique. **Ne pas démarrer Manager contre Validation-MSI avant feu vert pour la migration/import.**
- Simulation/répétition : **118 clauses / 118 versions BROUILLON / 409 liens explicites**, 19 base/99 catalog ; 105 all/3 professional/10 consumer ; zéro anomalie/publication/lien BASE. `LANDING-GESTION` seule dormante, contrôle `CONS-RETRACTATION-EN-LIGNE` exclu. Rejeu zéro changement, intégrité SQLite OK et FK vide, anciens devis/Projets/catalogue strictement préservés.
- Suivi documentaire 42 modifier/52 inchangé/22 hors clause/2 qualifications et cinq niveaux de revue conservés, sans blocage automatique juriste. Les 16 décisions restent closes ; les 44 actions hors clause ne deviennent pas de nouvelles clauses/tables.
- Tests ciblés **59/59**, typecheck sortie 0, UI Chromium isolée **21/21** ; recette réelle non effectuée puisque import réel interdit pour cette passe. Extraction déterministe contrôlée, empreintes DB/XLSX/documents avant/après identiques.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, dry-run exhaustif MD/CSV/JSON `outputs/contract-library-lot4` du dossier documentaire. **Arrêt avant écriture réelle, attente du feu vert AtoumWeb.** Aucun commit Lot 4, publication, Lot 5, Abby, Bridge ou 8C ; aucun push/merge.

> ## HISTORIQUE — 03/10/2026 — LOT 3 APPLIQUÉ AVANT CLÔTURE LOCALE
>
> Ce bloc remplace les anciennes consignes de reprise ci-dessous, conservées comme historique.
>
> - Branche `feature/project-page-compositions-v1`, HEAD local Lot 2 `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9`, Lot 1 `dedb865f4cdabd518391b63f067ed8e2647c869b`, distante 8B `ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81`. Lot 3 non committé ; aucun push/merge.
> - Lots 1/2 validés techniquement ; recette manuelle AtoumWeb reportée avant validation fonctionnelle finale. Les empreintes PDF et l'historique documentaire restent au Lot 5.
> - Feu vert réel reçu pour Lot 3 après fermeture : **390/390 tests complets (57 fichiers), typecheck OK**, working tree 20 fichiers Lot 3 prévus et aucun staged. Aucun changement de code après tests.
> - Manager non démarré. Sauvegarde physique sous verrou d'écriture exclusif vérifié ; WAL vide, SHM présent, aucun journal actif. Backup : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`, SHA `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`, intégrité vérifiée avant application.
> - **Migrations 53 et 54 appliquées à Validation-MSI**, aucune migration 1–52 modifiée, aucun seed. Migrations et import sous transaction englobante ; jeton recalculé `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4` égal au validé, empreintes base/XLSX/payload inchangées juste avant import.
> - Résultat réel : **91 créations / 21 reprises / 15 archives réversibles / 9 conservations / 112 AW / 112 nouvelles versions BROUILLON**. Totaux 136 items / 157 versions / 44 anciennes publiées inchangées / 113 brouillons / 127 entrées de journal / 1 passage. Aucune publication automatique.
> - Huit anciens objets ambigus archivés sans AW ni nouvelle version, huit cibles distinctes ; aucun matching par nom. Les versions historiques, trois devis `DEV-2026-001/002/003`, Projets, documents, compositions et tables contractuelles sont exactement préservés. Liens blueprint des 21 reprises contrôlés : 2 historiques + 1 copie = 3, rôle/ordre/version exacts.
> - Intégrité SQLite OK, aucune violation FK. Rejeu réel **0 création / 0 reprise / 0 archive / 0 verify / 136 conservations**, toutes les tables inchangées. Contre-vérification indépendante SQLite contre le backup réussie. Base après checkpoint/fermeture SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; XLSX inchangé `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.
> - Rapport `CONTRACTUAL_LOT3_CATALOG_IMPORT.md`, preuves `C:\Users\AtoumWeb\Documents\ChatGPT\manager atoumweb+ bridge\outputs\catalogue-lot3\application-lot3-validation-msi.md/json` et `contre-verification-lecture-seule.json`. Le dry-run et les anciennes entrées de journal restent historiques : ne pas reprendre une consigne antérieure indiquant que les migrations sont pendantes.
> - **ARRÊT AVANT LOT 4 : attendre un nouveau feu vert. Ne publier aucune version V1.** Aucun import de clauses/409 liens, travail Abby/Bridge ou Lot 8C. Aucun commit Lot 3 autorisé dans cette passe.

> ## HISTORIQUE — 29/09/2026 — Lot 6B
>
> Ce bloc **remplace les anciennes consignes de branche/PR mentionnées plus bas** pour la reprise actuelle. L'historique est conservé volontairement.
>
> **État de ce checkpoint historique : Lot 6B clos — Sites & pages / composition de Page.**
>
> - Branche de stabilisation : `wip/codex-6b-ui-fix`
> - Dernier HEAD canonique validé après intégration : `3df2168d7a3e662d98f68525550309ea71be0d67`
> - Merge commit de la PR : `3df2168d7a3e662d98f68525550309ea71be0d67`
> - Branche canonique cible : `feature/project-page-compositions-v1`
> - PR de réintégration **#75** : **MERGED** le 29/09/2026 ; branche WIP conservée.
> - **Ne pas fusionner vers `main`**.
>
> **Validation acquise du Lot 6B :**
>
> - recette visuelle réelle validée ;
> - `npm run typecheck` : vert ;
> - harness UI Electron : **65/65** ;
> - suite complète : **53 fichiers / 339 tests, 339/339 réussis** ;
> - `npm run package` : réussi, package **win32 x64** ;
> - après intégration : `npm run typecheck` réussi, harness **65/65**, tests ciblés **35/35** ;
> - migration courante : **49**, aucune nouvelle migration introduite par la stabilisation UX ;
> - aucun changement Bridge pendant la stabilisation 6B.
>
> **Trois corrections transverses intégrées après la première suite complète :**
>
> 1. test legacy des migrations rendu dynamique jusqu'à l'état courant au lieu d'être figé à 38 ;
> 2. test Workflow aligné avec le Builder CGV structuré : `specialTerms` du devis n'est plus supposé contenir automatiquement les conditions catalogue ;
> 3. `DemoService` suit désormais `quote_contract_clauses` pour permettre une purge correcte des scénarios de démonstration.
>
> **Ce que Codex ne doit pas refaire :**
>
> - ne pas reprendre la recette UX 6B depuis zéro ;
> - ne pas modifier les replis, l'atelier Réglages / Code ou le grand écran 75/25 sauf régression démontrée ;
> - ne pas ajouter de migration ;
> - ne pas toucher au dépôt Bridge pour clôturer le 6B ;
> - ne pas repartir de `main`, de la PR #73 ou d'une ancienne branche historique.
>
> **Clôture effectuée :**
>
> - checkout canonique synchronisé au merge commit `3df2168d7a3e662d98f68525550309ea71be0d67` ;
> - typecheck, harness, tests ciblés, suite complète et packaging verts ;
> - Lot 6B consigné comme clos dans `PROJECT_STATUS.md` et `docs/MANAGER_BRIDGE_ROADMAP.md`.
>
> **Après clôture seulement :** reprendre la feuille de route Manager ↔ Bridge avec le Lot 7 (Site / préparation Bridge), puis Lot 8 (retour d'occurrences), puis Lot 9 (assemblage multi-pages / livraison), uniquement après autorisation explicite.
>
## Historique — handoff initial Manager

## Historique — chantier alors actif — Lot 8A Export Page Manager

- Branche locale empilée : `codex/lot8a-page-export`, basée sur `codex/lot7-blueprint-sites@bfda981bb4243d8138ed862a4e1f9395e7827e6f` ; PR #76 reste ouverte et non fusionnée.
- Nouveau contrat additionnel explicite : `atoumweb_bridge_project_package` schemaVersion 2, `scope=page`, `exportId`, destination Projet/Site/Page.
- Le package projet générique V1 et les contrats Component/Fields/Identity V1 restent inchangés.
- Migration 52 : historique des exports Page avec empreinte et provenance de destination.
- Le package transporte les adaptations locales enregistrées dans l'atelier Page, sans modifier les sources Bibliothèque.
- Validation locale : typecheck réussi ; **14/14 tests ciblés**.
- Aucun commit/push sur le Lot 8A. L'import idempotent et le marqueur Divi nécessitent le dépôt Bridge local confirmé.
- Dépôt Bridge désormais confirmé et synchronisé : `C:\DEV\01_PROJETS\AtoumWeb\atoumweb-bridge`, base 0.8.0 `36d1076`. L'incrément idempotent Page V2 est préparé localement sur `codex/lot8a-idempotent-page-import` en version 0.8.1, sans commit/push.

## Historique — chantier alors actif — Lot 7 Squelette blueprint Sites / Pages

- Branche locale : `codex/lot7-blueprint-sites`, base canonique `cf747c5855eec90df725861d22375d65f78f12db`.
- Objectif limité : générer les Sites et Pages déclarés par un blueprint avec des clés explicites et une provenance durable.
- Premier incrément local validé par typecheck et **33/33 tests ciblés** après correction du cas historique réel `PRO-2026-001`.
- Configuration des Sites/Pages disponible sur les versions brouillon, recopiée lors d'une nouvelle version ; commande visible de réapplication pour les Projets historiques.
- Migration additive 50 pour les déclarations et liaisons ; migration 51 séparée pour appliquer la compatibilité `web` / `website` aux bases où 50 a déjà été exécutée.
- Un ancien Projet lié à un blueprint sans Site/Page reçoit le blueprint Site/Page canonique selon son type, sans changer son `template_version_id` et sans déduire quoi que ce soit de son nom.
- Cette association par type est uniquement un filet de compatibilité legacy. La cible fonctionnelle est la composition pilotée par les lignes du devis : offre principale comme base, options/prestations comme contributions additives, puis matérialisation du blueprint final du Projet.
- Aucun changement des contrats Manager ↔ Bridge, aucun export Page, aucun Lot 8.
- Ne pas reprendre l'UX 6B. Ne pas fusionner vers `main`.
- Recette réelle validée : 1 Site + 5 Pages, réapplication sans doublon, renommages conservés, ajout manuel conservé ; résultat final 1 Site / 6 Pages.
- Les modifications sont prêtes pour commit, push et PR vers `feature/project-page-compositions-v1`.
- Dernier essai du harness 6B interrompu avant contrôles par Chromium/GPU Windows ; aucune régression renderer rapportée.


## Historique — Checkpoint supplémentaire — CGV Builder intégré le 27/09/2026

Le chantier parallèle `feature/quote-cgv-builder-v1` / PR #74 a été réconcilié avec Projet V2 avant de poursuivre les lots Bridge.

À retenir :
- logique CGV / clauses / snapshot contractuel intégrée ;
- UI Builder CGV intégrée ;
- PDF Abby accepté + onglet Contrats Client intégrés ;
- textes brouillons des modules de prestations intégrés ;
- migrations CGV renumérotées **44 / 45 / 46** lors de la convergence ;
- migrations 40 à 43 restent celles du chantier Bridge / Familles / Correspondances / Composition ;
- aucune validation juridique de production n’est implicite ;
- validation locale MSI encore requise après synchronisation.

Avant de lancer l’application sur un workspace déjà utilisé historiquement avec la branche CGV, vérifier la table `schema_migrations` afin d’écarter toute collision d’anciens IDs 40/41/42.

Le prochain chantier d’architecture prévu est :
`Devis accepté → Projet → Site → Page → Composition → occurrences de composants`.


> État partagé au 24/09/2026. À lire avec `AGENTS.md`, `PROJECT_STATUS.md` et le document de phase concerné.

## Historique — branche utilisée au checkpoint du 24/09/2026

- Dépôt : `atoumweb-prog/atoumweb-manager`
- Branche de travail à ce checkpoint : `feature/project-blueprints-v1`
- PR : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**
- Base de la PR : `fix/pre-phase5-commercial-ux`
- Ne pas travailler directement sur `main`.
- Ne pas fusionner la PR #73 tant que la recette du dernier lot n'est pas terminée.

Synchronisation MSI :

```text
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
```

Pour détecter un travail local non poussé avant toute modification :

```text
git status -sb
git branch -vv
git log --oneline --decorate --branches --not --remotes
```

Si la dernière commande ne retourne rien, aucun commit local n'attend d'être poussé. Ne pas pousser une ancienne branche uniquement parce qu'elle existe localement.

Contrôle local recommandé :

```text
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Le workspace de validation reste :

`C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI`

Ne jamais utiliser la base Production pour une recette.

## Historique — état fonctionnel à cette date

Le socle utilisé par l'application contient les phases CRM, Commercial, Projets, Opérations, Référentiels et les correctifs UX validés avant Phase 5. La Phase 5 Administration/Finance reste volontairement différée.

Le chantier actif est **Projet V2 / atelier de production** :

- Devis accepté → Projet avec blueprint de production ;
- snapshot du projet indépendant des futurs changements de modèle ;
- phases / étapes numérotées ;
- phases repliées par défaut ;
- glisser-déposer des étapes ;
- séparation Plan / Fiche redimensionnable ;
- barre latérale globale escamotable et masquée automatiquement en Production ;
- timer rattaché à l'étape ;
- notes et mini-actions par étape ;
- Ressources / Technique / Temps en fenêtre au-dessus de Production ;
- pages renommables directement dans l'arbre ;
- validation d'une phase avec avertissement sur les champs manquants ;
- clôture d'une phase = toutes ses étapes passent en Terminé ;
- undo / redo du travail courant ;
- aide contextuelle désactivable dans Réglages ;
- coffre d'accès projet/étape chiffré par Electron `safeStorage` ;
- couche UI transverse appliquée aux écrans historiques : champs, boutons, onglets, focus, débordements et lisibilité.

## Historique — Migrations

La branche Projet V2 porte désormais **36 migrations SQLite**.

La dernière validation complète connue sur MSI avant la passe Catalogue était à **36 fichiers / 177 tests réussis** avec **30 migrations**.

La migration 30 ajoute `project_node_secrets` pour les métadonnées et le ciphertext des accès sécurisés.

La migration 31 ajoute `catalog_versions.nature` pour distinguer la nature courte d’une prestation de sa description détaillée.

La migration 32 rattache un élément de facturation à son PDF client (`invoice_document_id`, référence et date de facture). Le PDF est stocké via le système Documents client dans `03 Factures` ; aucune API Abby n’est utilisée.

La migration 33 ajoute le suivi des dépenses : frais AtoumWeb, rattachement facultatif client/projet, catégorie, fournisseur, montant, TVA, statut, dates, récurrence et justificatif.

La migration 34 ajoute les identités visuelles CRM (`crm_identity_assets`) : logo et favicon d’entreprise, photo/avatar de contact, stockés localement dans le workspace.

La migration 35 ajoute les motifs de pause du timer sur `time_session_pauses` : besoin d’informations, manque de temps, autre urgence ou autre raison, avec note facultative.

La migration 36 ajoute le stockage AtoumWeb Bridge Snapshot V1 : sites, snapshots, pages, occurrences de nœuds, sources, assets, dépendances, relations et registre d’objets SHA-256.

Les mots de passe / clés ne doivent jamais être stockés en clair dans SQLite, les logs ou les documents de suivi.

## Historique — Validation

La recette locale précédente a confirmé typecheck/tests verts avant le dernier lot « aide / actions / coffre sécurisé / cohérence UI globale ».

Le **HEAD actuel doit donc être revalidé** sur MSI avec :

- `npm run typecheck`
- `npm test`
- `npm run package`
- lancement du profil Validation-MSI
- vérification des migrations 30, 31, 32, 33, 34, 35 et 36
- test du coffre avec une fausse clé, jamais une vraie
- vérification rapide des anciens écrans après la nouvelle couche UI globale.

## Historique — AtoumWeb Bridge Snapshot V1

Le contrat `atoumweb-bridge-snapshot` **1.0.0** est gelé. Le premier snapshot réel d’AtoumWeb.fr a été produit par **AtoumWeb Bridge 0.4.2** et vérifié avant l’implémentation Manager.

Le Manager possède désormais une page **Sites** dédiée et un import V1 séparé de la Bibliothèque AtoumWeb :

- inspection du ZIP avant import ;
- validation du contrat / version / fingerprint profile ;
- vérification des checksums et du `package_fingerprint` ;
- contrôle des objets SHA-256, références, arbres, parents et compteurs ;
- import idempotent par `snapshot_id + package_fingerprint` ;
- conservation des warnings Bridge, notamment `FRONTEND_AUDIT_NOT_ATTACHED` ;
- stockage des payloads dans `workspace/bridge/objects/sha256` et métadonnées en SQLite ;
- copie du ZIP original dans `workspace/bridge/packages` ;
- navigation Site → Snapshot → Page → Structure / Sources / Assets / Dépendances ;
- aperçu texte des payloads en lecture seule : aucun HTML / CSS / JS importé n’est exécuté.

Le premier snapshot réel observé contient **82 pages, 1 507 nœuds, 1 114 sources, 169 assets, 16 dépendances, 3 147 relations et 1 892 objets**. Son statut est `complete_with_warnings`. Les contenus Divi 5 observés restent best-effort tant que Bridge n’annonce pas la capability Divi 5.

Le diff Snapshot A / B et l’attribution historique des `logical_node_id` restent pour le lot suivant, après réception d’un deuxième snapshot réel.

## Historique — Phase 7

La branche `feature/phase-7-analytics-v1` / PR #71 existe toujours comme chantier historique d’analytique avancée.

Une première page **Statistiques V1** est désormais intégrée directement dans `feature/project-blueprints-v1` afin de rester cohérente avec le vrai socle Projet V2. Elle dérive ses chiffres des données métier existantes et n’ajoute aucune migration : Vue d’ensemble, Commercial, Projets & temps et Clients, avec filtres mois / trimestre / année / toutes données et comparaison à la période précédente.

La branche Phase 7 historique ne doit pas être fusionnée telle quelle. Elle reste utile pour reprendre plus tard les fonctions non encore intégrées : encaissements/paiements, rentabilité avancée, statistiques par prestation, exports et pilotage approfondi.

## Historique — Branches historiques

De nombreuses branches `feature/phase-*`, `feature/atoum-v02-*` et anciennes branches de recette sont encore présentes sur GitHub. Elles servent d'historique mais ne doivent pas être choisies comme nouvelle base de travail.

Avant toute nouvelle branche, partir de la branche fonctionnelle explicitement indiquée dans `PROJECT_STATUS.md`.

## Historique — Règles UI désormais transverses

- aucun texte fonctionnel sous 14 px ;
- contrôles lisibles avec fond cohérent avec le thème ;
- pas de champ noir natif en thème clair ;
- champs et boutons dimensionnés selon la densité globale ;
- panneaux et onglets doivent gérer leur propre défilement sans casser toute la page ;
- contenu secondaire accessible à la demande plutôt qu'affiché en permanence ;
- aide contextuelle utile au survol, désactivable ;
- panneau latéral global escamotable ;
- fermeture des fenêtres secondaires par × / clic extérieur / Échap quand le composant le permet ;
- couleur utilisée pour l'état et la progression, pas pour surcharger l'écran.

## Historique — Règle de coordination ChatGPT / Codex

ChatGPT pilote actuellement la conception et les modifications de la branche Projet V2. Codex MSI peut auditer, tester, diagnostiquer ou appliquer un lot explicitement demandé, mais ne doit pas lancer une refonte parallèle ni repartir d'une branche historique sans instruction.
## Historique — Recette visuelle continue

> Je vais continuer à t’envoyer des captures page par page. Prends-les comme une recette visuelle continue et garde les corrections cohérentes avec les précédentes.

## Historique — Facturation sans API Abby

- Abby reste l’outil qui produit la facture réglementaire.
- AtoumWeb Manager ne dépend d’aucune API Abby payante.
- Le Manager prépare les éléments à facturer et conserve le suivi interne.
- Une facture devient **Facturée** dans le Manager lorsque son PDF est importé et rattaché.
- Le PDF est classé dans les Documents du client, catégorie Factures (`03 Factures`), et reste ouvrable depuis Facturation.
- Les packs d’heures payants alimentent automatiquement la file des éléments à facturer.

## Historique — Dépenses et frais engagés

- page Dépenses dédiée, sans logiciel comptable externe ;
- dépenses ponctuelles ou récurrentes ;
- rattachement facultatif à un client et/ou un projet ;
- statuts : Prévu / Engagé / Payé / Annulé ;
- catégories métier : hébergement, domaine, logiciel, licence, sous-traitance, publicité, déplacement, matériel, banque, taxe, bureau, autre ;
- montant TTC et TVA facultative ;
- date de dépense, échéance, date de paiement, prochaine échéance ;
- justificatif PDF/image importable et ouvrable depuis la fiche ;
- justificatif client classé sous `Documents/09 Depenses`, avec sous-dossier projet si disponible ;
- dashboard : engagé ce mois, à payer, payé ce mois, récurrent mensuel équivalent.

## Historique — Identité visuelle CRM & thème Noir

- le thème Noir doit conserver les codes couleur métier sans utiliser de fonds pastel clairs ;
- Prospection et Clients utilisent des teintes sémantiques recalculées sur les surfaces sombres ;
- une entreprise peut recevoir un **logo** et une **favicon** ;
- un contact peut recevoir une **photo/avatar** ;
- ordre d’affichage : logo entreprise → favicon → avatar du contact → initiales ;
- les images sont copiées dans le workspace sous `crm-identites/` et les aperçus passent par l’API locale du Manager ;
- conversion Prospect → Client : l’identité visuelle est conservée automatiquement car elle appartient à l’entreprise/contact, pas au statut commercial ;
- URL CRM : saisir `atoumweb.fr` suffit ; le backend stocke `https://atoumweb.fr`. Un `http://` saisi explicitement est conservé.

## Historique — Ergonomie transverse — ateliers liste / fiche

- Facturation et Dépenses utilisent les pictos SVG communs, une liste compacte lorsqu’une fiche est ouverte, un splitter redimensionnable, un mode fiche agrandie et un comportement responsive.
- Bibliothèque AtoumWeb et Sauvegardes utilisent désormais la même logique : liste à gauche, barre centrale redimensionnable, fiche à droite, agrandissement `⛶`, réduction, fermeture explicite et empilement responsive sur petite largeur.
- Sur Bibliothèque et Sauvegardes, appliquer la règle typographique commune : titre / libellé / champ en gras, valeur ou contenu saisi en poids normal, commentaire discret, statut et bouton semi-gras.
- Annuaire suit la même logique liste / fiche : Organisations et Contacts, splitter redimensionnable, agrandissement, responsive, identité visuelle et accès direct aux fiches Client / Prospect liées.
- Statistiques reste une page de lecture compacte : pictos, KPI, graphiques CSS simples et onglets courts ; les chiffres restent dérivés des sources métier et ne deviennent jamais une nouvelle source de vérité.

## Historique — Derniers correctifs de recette — 23/09/2026

- une protection renderer globale a été ajoutée : si React rencontre une erreur non interceptée, le Manager affiche maintenant l’erreur exacte au lieu d’une fenêtre noire vide ;
- la page Clients possède une barrière d’erreur dédiée, calquée sur la protection déjà validée de la fenêtre Référence Prospect ;
- le thème Noir conserve désormais des teintes métier CRM plus contrastées ;
- la page **Gestion des temps** a planté pendant la recette avec `ReferenceError: OperationIcon is not defined` dans `TimePage.tsx` après le remplacement des anciens symboles par les nouveaux pictos SVG ;
- correctif appliqué au commit `b8c5af96` : import explicite de `OperationIcon` dans `TimePage.tsx` ;
- l’utilisateur a confirmé juste après relance que **Gestion des temps fonctionne de nouveau** ;
- ce retour est une validation visuelle ciblée, pas une validation complète `typecheck / tests / package`.

## Historique — Timer Intervention / Incident

- une session démarrée depuis une Intervention conserve réellement `interventionId` ;
- démarrer/reprendre le timer place l’Intervention en **En cours** ;
- arrêter le timer d’une Intervention ouvre un choix **travail résolu / mettre en pause** ;
- une pause demande un motif métier et l’enregistre dans l’historique du temps ;
- besoin d’informations → Intervention en **En attente client** ; autres interruptions → **Bloquée** ;
- reprise du timer → retour **En cours** ;
- incident résolu → timer arrêté, date de résolution renseignée, statut **À valider**, puis ouverture de **Conclusion & rapport de fin** ;
- la conclusion réutilise Cause / Diagnostic / Solution / Suivi ; la Solution est obligatoire pour clôturer l’incident ;
- les données de conclusion servent de base au futur document/PDF de fin dans Documents & Contrats.

Clôture Lot 3 — 03/10/2026 : bilan réel validé par AtoumWeb ; commit local dédié autorisé, sans push ni merge. La recette manuelle AtoumWeb reste à faire avant validation fonctionnelle finale. Cette clôture ne contient aucune modification du Lot 4.

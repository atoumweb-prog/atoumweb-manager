# AtoumWeb Manager — Suivi du projet

## Checkpoint courant — 03/10/2026 — Lot 4 validé, clôture locale dédiée

Ce bloc fait foi ; les états précédents restent historiques.

- AtoumWeb valide le résultat réel du Lot 4 et autorise son **commit local dédié uniquement**, intitulé `Lot 4 — import bibliothèque contractuelle V1`, sur `feature/project-page-compositions-v1`. Le commit contenant ce bloc fait foi pour le checkpoint Lot 4 ; récupérer son SHA avec `git log -1 --format=%H`. Aucun push/merge.
- 118 clauses/versions BROUILLON et 409 liens ; aucune publication contractuelle. Les 112 versions catalogue V1 restent également BROUILLON. Textes/provenance et anciens devis/Projets préservés ; migration 55 appliquée seule, intégrité et rejeu validés.
- **RECETTE MANUELLE ATOUMWEB À FAIRE avant validation fonctionnelle finale. Lot 5 non commencé ; attendre un feu vert séparé.** Bridge et 8C restent suspendus.
- Avant clôture : 21 fichiers Lot 4 attendus uniquement, aucun changement fonctionnel depuis suite complète 409/409 et typecheck OK. Validation-MSI inchangée par cette clôture, SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`. Manager non démarré, aucune écriture base.
- Rapports réels dans `outputs/contract-library-lot4` du dossier documentaire, bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`. Le bilan de clôture Git hors dépôt donne l'empreinte exacte du commit et la vérification de working tree propre.


## Historique — 03/10/2026 — Lot 4 appliqué avant validation de clôture

Ce bloc fait foi ; les blocs antérieurs et le dry-run restent historiques.

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

Ce bloc fait foi ; les blocs antérieurs restent historiques.

- Branche `feature/project-page-compositions-v1`, HEAD local **`1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`** : commit Lot 3 dédié uniquement, aucun push/merge. Working tree propre constaté avant les modifications Lot 4. Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale, mentionnée dans le commit.
- Lot 3 validé : catalogue réellement importé à Validation-MSI, 112 AW, 91 créations/21 reprises/15 archives/9 conservations, versions V1 brouillon, historique et rejeu préservés. Base réelle migrations **1–54**, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` inchangé pendant Lot 4.
- Autorisation Lot 4 limitée à préparation et dry-run sur copie. Référentiel XLSX du 03/10 SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8` ; textes exacts, huit documents juridiques préservés.
- Migration additive **55 préparée et testée uniquement sur copie/mémoire** : revue/provenance des versions et journal d'import. Migrations 1–54 inchangées, aucun seed/import automatique. **Ne pas démarrer Manager contre Validation-MSI avant feu vert pour la migration/import.**
- Simulation/répétition : **118 clauses / 118 versions BROUILLON / 409 liens explicites**, 19 base/99 catalog ; 105 all/3 professional/10 consumer ; zéro anomalie/publication/lien BASE. `LANDING-GESTION` seule dormante, contrôle `CONS-RETRACTATION-EN-LIGNE` exclu. Rejeu zéro changement, intégrité SQLite OK et FK vide, anciens devis/Projets/catalogue strictement préservés.
- Suivi documentaire 42 modifier/52 inchangé/22 hors clause/2 qualifications et cinq niveaux de revue conservés, sans blocage automatique juriste. Les 16 décisions restent closes ; les 44 actions hors clause ne deviennent pas de nouvelles clauses/tables.
- Tests ciblés **59/59**, typecheck sortie 0, UI Chromium isolée **21/21** ; recette réelle non effectuée puisque import réel interdit pour cette passe. Extraction déterministe contrôlée, empreintes DB/XLSX/documents avant/après identiques.
- Bilan `docs/CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, dry-run exhaustif MD/CSV/JSON `outputs/contract-library-lot4` du dossier documentaire. **Arrêt avant écriture réelle, attente du feu vert AtoumWeb.** Aucun commit Lot 4, publication, Lot 5, Abby, Bridge ou 8C ; aucun push/merge.


## Historique — 03/10/2026 — Contrats Lot 3 appliqué, avant commit

Ce bloc fait foi pour la reprise actuelle ; les comptes rendus datés ci-dessous restent historiques.

- Branche : `feature/project-page-compositions-v1`. HEAD local Lot 2 `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9` ; Lot 1 `dedb865f4cdabd518391b63f067ed8e2647c869b`. Aucun push/merge. **Lot 3 non committé**, 20 fichiers prévus seulement, aucun changement staged.
- Lots 1/2 validés techniquement ; **RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD avant validation fonctionnelle finale**, réserve portée dans les commits. Brouillon/publication séparés, snapshot vide figé, absence contractuelle historique conservée, PDF rattaché protégé ; empreinte PDF/historique des remplacements différés au Lot 5.
- AtoumWeb a validé le dry-run Lot 3 puis autorisé l'application réelle, après suite complète **57 fichiers / 390 tests / 0 échec**, typecheck sortie 0 et contrôle du working tree. Aucun changement de code depuis ces tests ; seules preuves/documentation ajoutées ensuite.
- Sauvegarde physique immédiate sous verrou d'écriture exclusif : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`, SHA-256 `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. Base mode WAL, WAL vide et SHM présent ; seconde connexion d'écriture bloquée, backup intact et `integrity_check=ok`. Manager n'a pas été démarré.
- Migrations additives **53 et 54 réellement appliquées**, avec l'import dans une transaction englobante. Migrations 1–52 et leurs données préservées, aucun seed ; ancien SQL 53 inchangé. Jeton recalculé immédiatement avant application identique au validé : `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4` ; fichier base, classeur et payload contrôlés, rollback prévu au moindre écart.
- Application réelle : **91 créations, 21 reprises par nouvelle version, 15 archives réversibles sans AW, 9 historiques génériques conservés ; 112/112 codes AW ; 112 nouvelles versions BROUILLON**. Totaux : 136 items, 157 versions, 44 anciennes versions publiées inchangées, 113 brouillons incluant l'ancien, 127 entrées / 1 passage d'import.
- Les huit anciennes ambiguïtés sont archivées sans code AW ni nouvelle version ; les huit cibles V1 sont des références distinctes. Aucun rapprochement par nom. Les 21 reprises gardent leurs UUID ; anciennes versions/prix et compositions exacts préservés, liens blueprint recopiés exactement (2 anciens + 1 copie = 3).
- Trois devis `DEV-2026-001/002/003`, leurs lignes/snapshots, Projets, documents et toutes les autres tables métier inchangés. Comparaison exhaustive contre l'état initial et contre la sauvegarde par une seconde lecture SQLite indépendante. **Aucune clause V1 injectée rétroactivement.**
- `integrity_check=ok`, `foreign_key_check` vide. Rejeu sur l'état réellement committé : **zéro modification**, 136 conservations ; empreinte logique de toutes les tables inchangée, activité/journal inclus. Checkpoint WAL final réussi avant empreinte physique.
- Base avant : `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. Base après : `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`. XLSX inchangé : `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.
- Bilan : `docs/CONTRACTUAL_LOT3_CATALOG_IMPORT.md` ; preuves réelles `outputs/catalogue-lot3/application-lot3-validation-msi.md/json` et `contre-verification-lecture-seule.json` dans le dossier documentaire. Le dry-run antérieur reste conservé comme historique.
- **Aucune version catalogue V1 publiée. Arrêt avant Lot 4, attente du nouveau feu vert.** Aucun import des 118 clauses/409 liens, paramétrage contractuel du devis, options achetées, blueprint composé, Abby ou Bridge. Lot 8C suspendu. Aucun commit Lot 3/push/merge.

## Lot 8A en cours — Export Page Manager

- Branche empilée : `codex/lot8a-page-export`, basée sur le HEAD validé du Lot 7 ; PR #76 non fusionnée.
- L'export générique `atoumweb_bridge_project_package` V1 reste inchangé.
- Une Page rattachée à un Site actif et possédant une composition peut produire une enveloppe V2 avec `scope=page`, `exportId` et destination `projectId/siteId/pageId`.
- Migration additive **52** : historique immuable des exports Page et empreinte du ZIP.
- Les adaptations locales HTML/CSS/JS enregistrées dans l'atelier sont transportées avec checksums recalculés ; la provenance Bibliothèque source reste intacte.
- Contrat et schéma ajoutés : `docs/ATOUMWEB_PAGE_PACKAGE_V2.md` et `.schema.json`.
- Typecheck réussi ; tests ciblés package/migrations : **14/14**.
- État : modifications locales sans commit/push, recette du bouton « Préparer pour Bridge » requise. Le support d'import idempotent côté plugin Bridge reste à implémenter après confirmation de son dépôt local.

## Lot 7 en cours — Squelette blueprint Sites / Pages

- Branche de travail : `codex/lot7-blueprint-sites`, créée depuis le checkpoint canonique `cf747c5855eec90df725861d22375d65f78f12db`.
- Premier incrément local : déclarations explicites Site/Page par version de blueprint, provenance durable et application idempotente lors de la création d'un Projet.
- Les réapplications conservent les renommages, domaines, rattachements et Pages ajoutées manuellement ; elles ne créent aucun doublon ni journal d'activité supplémentaire.
- Le blueprint vitrine V1 déclare un Site principal, une Accueil et quatre Pages complémentaires.
- Les versions brouillon peuvent configurer cette structure via l'API de modèles ; une nouvelle version recopie les déclarations avec les nouveaux identifiants de nœuds.
- L'écran Sites & pages expose « Initialiser depuis le blueprint » pour les Projets historiques ; un blueprint sans déclaration produit un message explicite.
- Migrations additives prévues : **50** pour le modèle Site/Page, puis **51** pour la compatibilité explicite des anciens Projets `web` / `website` déjà liés à un blueprint sans structure Site/Page.
- La recette réelle de `PRO-2026-001` a révélé ce cas historique. Le fallback utilise le type du Projet, jamais son nom, conserve son blueprint d'origine et matérialise uniquement les Pages déclarées et leurs ancêtres manquants.
- Validation locale après correction : `npm run typecheck` réussi ; tests ciblés migrations / ProjectService / ProjectSiteService **33/33 réussis**.
- Recette réelle validée sur `PRO-2026-001` : création de 1 Site et 5 Pages, réapplication sans doublon, renommages Site/Page conservés et Page manuelle conservée ; résultat final 1 Site / 6 Pages.
- Architecture suivante actée : le projet moderne sera composé depuis le devis (`offre de base → options/prestations → blueprint final`). Le mapping par `project_type` ajouté en migration 51 reste strictement une compatibilité legacy.
- État : prêt pour commit, push et PR vers `feature/project-page-compositions-v1`. Le harness Electron n'a pas démarré ses contrôles lors du dernier essai, Chromium ayant arrêté son processus GPU Windows (`GPU process isn't usable`).

## Lot 6B clos — 29/09/2026 — PR #75 intégrée et contrôles post-intégration verts

- Branche de stabilisation : `wip/codex-6b-ui-fix`.
- Branche canonique : `feature/project-page-compositions-v1` au HEAD `3df2168d7a3e662d98f68525550309ea71be0d67`.
- Comparaison pré-intégration vérifiée : la WIP était **strictement devant / 0 derrière** la branche canonique ; aucune divergence concurrente détectée.
- [x] Barre fantôme identifiée et supprimée : `main.project-production-secondary` vide n'est plus rendu sous Sites & pages.
- [x] Structure Sites & pages stabilisée : **Arborescence | Fiche Page | Atelier latéral**.
- [x] Replis/restaurations indépendants de l'Arborescence, de la Fiche Page, de Réglages et de Code / aperçu.
- [x] Réduire la Fiche Page ne démonte plus Réglages / Code ; les brouillons et aperçus restent actifs.
- [x] Réglages et Code / aperçu peuvent être ouverts seuls ou ensemble ; synchro du brouillon Réglages vers Code / aperçu en direct.
- [x] Timer Page compact.
- [x] Informations de Page repliables au-dessus de la composition.
- [x] Aperçus isolés pour éviter la contamination CSS entre composants ; JavaScript source non exécuté.
- [x] Desktop / Tablette / Mobile disponibles dans Réglages et Code / aperçu.
- [x] Grand écran harmonisé Réglages / Code : preview dominante à gauche, outils scrollables à droite, ratio cible ~75/25.
- [x] Validation explicite des modifications locales, Undo / Redo, retour Version Bibliothèque et promotion en variante conservés.
- [x] Pickers couleurs étendus (hex/alpha/HSL) et réglages visuels locaux conservés.
- [x] Migration 49 inchangée ; aucune nouvelle migration ajoutée pendant la stabilisation UX.
- [x] `npm run typecheck` réussi sur MSI.
- [x] Tests Vitest ciblés historiques : **35/35 réussis**.
- [x] Harness Electron final : **65/65 contrôles réussis, 0 échec** sur le checkpoint `d464ad2b2d7f500a6a1443059e50f706dc244200`.
- [x] Recette visuelle réelle Carlos validée le 29/09/2026 : replis, atelier docké, aperçu scrollable, grand écran Réglages, grand écran Code et disposition 75/25 jugés conformes.
- [x] PR **#75** (`wip/codex-6b-ui-fix` → `feature/project-page-compositions-v1`) fusionnée le 29/09/2026 par le merge commit `3df2168d7a3e662d98f68525550309ea71be0d67` ; aucune fusion vers `main`.
- [x] Après intégration sur le HEAD canonique `3df2168d7a3e662d98f68525550309ea71be0d67` : `npm run typecheck` réussi, harness Electron **65/65**, tests Vitest ciblés **35/35**.
- [x] Suite Vitest complète lancée le 29/09/2026 : premier passage **336/339**, 3 échecs transverses identifiés hors UX 6B.
- [x] Correctifs poussés :
  - test migration legacy rendu dynamique jusqu'à la migration courante ;
  - test Workflow aligné sur le Builder CGV structuré ;
  - `quote_contract_clauses` ajouté au tracking/purge DemoService.
- [x] Suite complète relancée après ces trois correctifs : **53 fichiers / 339 tests réussis, 0 échec**.
- [x] `npm run package` : package Windows **win32 x64** généré avec succès.
- [ ] Corriger à faible priorité l'avertissement Electron du harness `console-message` déprécié ; aucun impact fonctionnel Manager.
- [ ] Lot suivant : Lot 7 de la feuille de route Manager ↔ Bridge (préparation Site / package / Workbench), à commencer uniquement après autorisation explicite ; aucun travail Bridge effectué pendant le Lot 6B.

Détails complets et journal de décisions : `docs/MANAGER_BRIDGE_ROADMAP.md`.


## Coordination Manager ↔ Bridge — 27/09/2026

- [x] Note d'architecture Pages hybrides et feuille de route consignées dans [`docs/MANAGER_BRIDGE_ROADMAP.md`](docs/MANAGER_BRIDGE_ROADMAP.md), avec journal partagé des consignes/décisions pour les agents.
- [x] Checkpoint MSI sur `4f8fa15c80da874e084648b1d643a316cbfcbcb2` : typecheck réussi et **34 tests ciblés réussis / 0 échoué** (CGV 9, devis 8, migrations 10, composition 5, package composition 2).
- [x] Validation-MSI contrôlé en lecture seule : migrations 1–43 sans collision CGV ; 44–46 restent à appliquer dans ce workspace. Pas de lancement de l'application ni d'accès Production.
- [ ] Recette visuelle CGV après lancement/migrations à effectuer par Carlos ; aucune suite complète ni packaging relancé pour ce checkpoint.
- Direction proposée : Page opérationnelle existante + Site + composition facultative/partielle, Divi comme atelier, occurrences durables, provenance distincte de la destination.
- Prochaine action : lire la feuille de route, confronter les identités/contrats au vrai plugin Bridge et confirmer les arbitrages avant d'autoriser un lot. **Aucun lot 6–9 commencé ou autorisé par la publication documentaire.**
- La PR #74 est déjà intégrée. Les mentions historiques contraires plus bas ne constituent pas une instruction de la fusionner à nouveau. Le journal partagé contient les consignes courantes ; l'historique ci-dessous est conservé.


## Checkpoint — convergence CGV Builder V1 — 27/09/2026

- [x] Le travail de `feature/quote-cgv-builder-v1` / PR #74 a été sécurisé puis réconcilié avec le HEAD Projet V2 `51b7ca247652a85929ae4ff580beaf329c0f6b9b`.
- [x] Les 28 fichiers fonctionnels du Builder CGV ont été repris sans supprimer les avancées Bridge / Familles / Correspondances / Composition.
- [x] Les migrations CGV initialement numérotées 40 / 41 / 42 sur la branche parallèle sont renumérotées **44 / 45 / 46** pour conserver les migrations actuelles 40 à 43.
- [x] Builder : bibliothèque de clauses versionnées, clauses prestation, conditions particulières, public professionnel/consommateur, snapshot contractuel et copie pour Abby.
- [x] PDF Abby accepté rattachable au devis ; onglet Contrats côté Client conservé.
- [x] Les brouillons `CGV_CONTENT_DRAFT.md` et `CGV_SERVICE_MODULE_TEXTS_DRAFT.md` sont intégrés ; ils ne constituent pas encore des textes juridiques de production.
- [ ] Validation MSI obligatoire après synchronisation : `npm run typecheck`, tests migrations + ContractTerms + QuoteService, puis recette visuelle Devis/Client.
- [ ] Avant d’ouvrir un ancien workspace ayant éventuellement servi à la branche CGV historique, contrôler `schema_migrations` : les anciens IDs 40/41/42 CGV ne doivent pas être confondus avec les migrations 40/41/42 désormais attribuées au chantier Bridge.
- [ ] Le prochain lot d’architecture reste **Projet → Site → Page → Composition**, avant le vrai round-trip multi-composants Bridge.

## Lot suivant — Package projet / Workbench multi-composants — 27/09/2026

- [x] Convention interne `atoumweb_bridge_project_package` 0.1 ajoutée sans modifier les contrats Component / Fields / Identity V1.
- [x] Une composition Manager peut préparer un ZIP unique en conservant l’ordre, la version exacte, la Famille / Variante et les SHA-256 de chaque composant.
- [x] Les Component Package V1 existants sont réutilisés comme source ; aucun composant Bibliothèque n’est réécrit.
- [x] Bibliothèque : action **Préparer pour Bridge** + accès au ZIP généré.
- [x] Bridge 0.8.0 : import du package projet dans **un seul Workbench Divi**, avec un module Code distinct par composant et ordre Manager conservé.
- [x] Bridge crée une **Site Occurrence V1 distincte par composant** du Workbench projet et conserve la provenance de la composition.
- [x] Les Workbenches projet sont distingués des Workbenches composant / production dans l’interface Bridge.
- [ ] Validation MSI Manager : typecheck + tests Composition / Package / migrations.
- [ ] Validation réelle Bridge 0.8.0 : installer le plugin, importer un package de composition et vérifier le Workbench Divi.
- [ ] Lot suivant : provenance/retour multi-composants (configuration et Occurrence Return composant par composant).
- [ ] Publication production et intégration des branches parallèles 40/41/42 restent différées.

## Lot suivant — Composition multi-composants — 27/09/2026

- [x] Migration 43 : stockage dédié des compositions et de leurs occurrences de composants, sans modifier les composants Bibliothèque sources.
- [x] Une composition possède un nom, un métier cible, un statut et un ordre explicite de composants.
- [x] Chaque occurrence de composition mémorise l’item source, la version exacte, la famille, la variante, la catégorie et le métier au moment de l’ajout.
- [x] Ajout, retrait et réorganisation d’occurrences implémentés ; une même source peut être utilisée plusieurs fois sans mutation de la Bibliothèque.
- [x] Les composants Bridge marqués `ready` sans validation humaine restent refusés ; seuls les composants réellement « Prêt à réutiliser » sont composables.
- [x] API Electron / preload ajoutée pour lister, créer et éditer les compositions.
- [x] Bibliothèque : action **Composer un site**, création d’une composition, sélection du métier, panier ordonné et ajout de composants prêts.
- [x] Tests unitaires ajoutés pour provenance/version figée, réorganisation, retrait, refus des composants non prêts, validation humaine Bridge et archivage.
- [ ] Validation MSI : `npm run typecheck`, migrations, tests Composition ciblés puis recette visuelle.
- [ ] Lot suivant après validation : **Package projet / Workbench multi-composants**. Aucun format de package projet ni publication WordPress n’est ouvert dans ce lot.
- [ ] Les branches parallèles 40/41/42 restent volontairement hors intégration jusqu’au checkpoint final des lots.

## Correction UX — Reconnaissance des éléments et réexamen — 26/09/2026

- Retour Carlos : persistance confirmée, mais la validation basée sur des IDs / scores est incompréhensible. La première recette valide le stockage, pas la pertinence des correspondances choisies.
- [x] Revue ouverte directement sous la page concernée. Chargement des aperçus avant/après uniquement à la demande, contexte de page, dates, position, extrait de contenu ; IDs et score repliés dans les détails techniques.
- [x] Décision affichée sur le bloc qui reste en place : « C’est le même élément » / « Ce sont deux éléments différents ». Les propositions peuvent rester en attente sans bloquer le parcours ; « À examiner plus tard » replie la carte sans écrire de décision.
- [x] Les aperçus sont reconstruits, sans exécution JavaScript ni chargement externe ; leur rendu peut être incomplet. Pas de décision proposée sans contenu reconnaissable ; les conteneurs sans aperçu restent en attente.
- [x] Migration 42 additive pour historiser les réexamens, compatible avec les décisions déjà enregistrées sous migration 41. Réexamen transactionnel et idempotent, historique conservé, attributions retirées seulement si aucune validation dépendante ne les utilise. Sinon, message demandant de réexaminer d’abord les validations suivantes.
- [x] Tests ciblés : **35 réussis / 0 échoué** (Snapshot 26, migrations 9) ; typecheck réussi. Aucun contrat V1 ni snapshot modifié. Aucun commit/push, suite complète ou packaging.
- [x] Recette Carlos : nouvelle présentation avant/après, décisions sur place et réexamen validés visuellement. Contrôles ciblés confirmés verts : typecheck + **35/35 tests**.

## Validation humaine des correspondances de nœuds — 26/09/2026

- [x] Migration 41 : identités logiques, attributions et décisions dans des tables Manager séparées. Les snapshots, objets et `bridge_nodes.logical_node_id` importés restent intacts.
- [x] Validation / refus explicites depuis Sites → comparaison → Correspondances modules ; accès possible aux pages sans écart.
- [x] Provenance conservée : couple de nœuds/pages/snapshots, proposition et score au moment de la décision, date, origine `manager_human`, journal d'activité. Aucun nom d'opérateur n'est inventé : le Manager local n'identifie pas l'humain connecté.
- [x] Une identité ne peut désigner deux nœuds d'un même snapshot. Les identités déjà distinctes ne sont jamais fusionnées silencieusement ; les refus restent respectés même par les chaînes de validations.
- [x] Décisions transactionnelles et idempotentes ; erreur de journalisation = annulation complète. Un refus n'attribue aucune identité.
- [x] Les propositions ne constituent plus un appariement validé dans les compteurs. La restriction initiale « décision définitive » est remplacée par le réexamen historisé décrit ci-dessus.
- [x] Typecheck réussi ; tests ciblés finaux : **32 réussis / 0 échoué** (BridgeSnapshotService 23, migrations 9). Suite complète et packaging réservés au checkpoint final.
- [ ] Recette Carlos : valider une proposition vérifiée, refuser une autre, rouvrir la comparaison et vérifier historique/identité, contrôler que le bilan A/B ne change pas. Utiliser le profil de validation.
- [ ] Recette réelle sur une prochaine modification naturelle du site à compléter ; elle ne bloque pas les lots suivants si les contrôles ciblés restent verts.
- Base locale connue : `d05c38fd6e445c7d4adaedc47c0c8266a0df29e6`. Aucun commit, push ou intégration de branches 40/41/42 dans cette passe.
- Prochaine étape : recette de cet écran puis composition multi-composants ; publication production et intégration des branches différées.

## Lot 5 — Familles / Variantes depuis les retours Bridge — 26/09/2026

- [x] Migration 40 : familles de composants et variantes explicites, sans modifier les contrats Bridge V1.
- [x] Un composant source devient la variante de base de sa famille uniquement lors d’une décision humaine de promotion.
- [x] Une occurrence peut rester seule, devenir une nouvelle variante, mettre à jour une variante existante ou être détachée dans une nouvelle famille.
- [x] Une occurrence déjà marquée « Conserver uniquement cette occurrence » peut ensuite être promue ; l’historique des décisions reste journalisé.
- [x] Les changements structurels créent une variante `forked` et imposent une nouvelle validation humaine.
- [x] Les adaptations limitées aux champs configurables d’une source stable et validée peuvent hériter de la validation ; les changements inexpliqués restent « À adapter ».
- [x] Compatibilité avec les retours Bridge 0.7.4 : l’ancien faux positif HTML dû à un espace terminal insignifiant ne bloque pas une promotion sûre.
- [x] Les assets de la version source sont copiés vers la nouvelle version avec compensation des fichiers en cas d’échec transactionnel.
- [x] L’identité Family / Variant gérée par Manager prime lors de l’export du Component Package vers Bridge.
- [x] La Bibliothèque affiche désormais un arbre Famille → Base → Variantes, rend ces éléments recherchables et permet d’ouvrir puis de réexporter un composant promu.
- [x] Les retours Bridge sont revus dans une fenêtre contextuelle avec son propre scroll ; après décision la fenêtre se ferme et la Bibliothèque est rafraîchie.
- [x] L’écran de revue d’un retour active les décisions Famille / Variante et ouvre directement le composant créé ou mis à jour.
- [x] Tests ajoutés pour migration 40, promotion après conservation, variante sûre, variante structurelle forkée, copie d’assets, nouvelle famille, mise à jour de variante et identité exportée.
- [x] Validation MSI : typecheck réussi ; tests ciblés **52/52** (migrations 9, Occurrence Return 10, packages 33) ; recette réelle confirmée avec `Section — Mariage Why`, famille/base/variante et modales de retour.
- [x] Validation humaine de la version réutilisable confirmée : une v4 peut devenir stable et « Prêt à réutiliser » sans écraser l’historique.
- [ ] Finition UX en attente de recette après dernier correctif : actions du bandeau regroupées visuellement et bouton masquer/afficher Bibliothèque aligné sur le bouton masquer/afficher du menu principal.
- Aucun changement automatique de la Bibliothèque à l’import d’un retour ; toute promotion reste une décision humaine.

## Prochain lot — Diff Snapshot A / B — 26/09/2026

- [x] Recette MSI : les 29 écarts et le Workbench #3671 restaient classés modifiés/ajouté sur `d05c38f` ; la distinction technique et l'exclusion décrites dans le document de reprise étaient absentes du code.
- [x] Correctif local : catégorie interne `technical` et compteur dédiés lorsque les versions Bridge diffèrent, que la source brute est présente et identique, sans écart de titre/slug, statut, URL, builder, empreinte brute ou références d'assets. Les écarts d'extraction/dépendances restent visibles ; ce classement ne valide ni le rendu ni les ressources externes.
- [x] Les brouillons de type page portant le préfixe réservé `AWB Workbench — Bibliothèque —` sont exclus du bilan et listés explicitement. Les pages publiées, les titres ordinaires et les transitions vers un contenu non interne restent comparés. Aucun snapshot enregistré n'est modifié.
- [x] Validation locale du correctif : typecheck réussi ; `BridgeSnapshotService.test.ts` **16 réussis / 0 échoué**. Pas de suite complète, packaging, commit ou push.
- [x] Recette Carlos confirmée par capture : 24/09/2026 01:14 → 26/09/2026 13:48, 0 ajouté / 0 supprimé / 0 modifié réel / 29 techniques / 53 sans écart ; Workbench #3671 explicitement ignoré. Les détails affichent « Écart technique » pour les dépendances et les écarts structure/sources.
- [x] Vérification archive-à-archive : les **82/82 contenus communs** conservent le même SHA-256 de source brute WordPress/Divi ; les **169 assets** sont identiques. Les 29 écarts observés proviennent de l’évolution du scanner Bridge 0.4.2 → 0.7.5, pas d’une modification du contenu source.
- [x] Le compteur `ignoredInternal` et la liste explicite des Workbenches ignorés décrivent la même exclusion sans réécrire les snapshots.
- [x] Contrat interne de comparaison en lecture seule ajouté sans modifier Snapshot Schema V1.
- [x] Comparaison de deux snapshots du même site par `source_page_key` : ajouté / supprimé / modifié / inchangé.
- [x] Détection des écarts sur titre/slug, statut, URL, builder, source brute, empreintes, structure/modules, sources, assets et dépendances.
- [x] Comparaison des nœuds sans dépendre de leurs `occurrence_id` ; aucune mutation des snapshots.
- [x] API Electron + preload exposés pour lancer la comparaison depuis la page Sites.
- [x] Fenêtre contextuelle « Comparer deux copies » avec synthèse et détails des pages modifiées.
- [x] Revue des correspondances de modules ajoutée : score, confiance et raisons à partir du type, empreintes, libellé, profondeur, position, classes, IDs et matching hints.
- [x] Les correspondances ambiguës ou concurrentes restent explicitement « faible / à vérifier » et ne sont jamais écrites en base.
- [x] Le diff de structure ignore volontairement `logical_node_id` afin qu’une future annotation Manager ne crée pas elle-même un faux changement de snapshot.
- [x] Tests ajoutés pour comparaison nominale, refus de comparer un snapshot avec lui-même, pages ajoutées/supprimées, avertissements de snapshot partiel et proposition de correspondance non mutante malgré des `occurrence_id` différents.
- [x] Les snapshots partiels / scans incomplets produisent des avertissements explicites afin de ne pas présenter une absence comme une suppression certaine.
- [x] Correctif après recette réelle : les `source_id`, `page_snapshot_id` et `occurrence_id` étant propres à chaque snapshot, le diff compare désormais les fingerprints/contenus stables et non ces IDs volatils.
- [x] `audit_status` n’est plus assimilé à un changement métier du statut WordPress.
- [x] Les sélecteurs Avant / Après sont normalisés chronologiquement, même si la copie actuellement ouverte est la plus ancienne.
- [x] Avertissement prévu lorsque les deux copies proviennent de versions Bridge ou profils de fingerprint différents.
- [x] Test de régression ajouté : deux scans identiques avec IDs techniques différents doivent produire **0 modifié / 1 inchangé**.
- [x] Validation MSI : typecheck + test ciblé `BridgeSnapshotService.test.ts` (8/8 avant correctif, 16/16 après).
- [x] Recette réelle : bilan corrigé validé par Carlos sur les deux snapshots AtoumWeb.fr. Prochaine étape : validation humaine des correspondances de nœuds, sans attribution automatique ni modification des snapshots historiques.
- [x] Attribution des identités logiques uniquement après décision humaine dans le registre Manager (migration 41), sans réécriture des snapshots ; recette de l'écran en attente.

### Finition du round-trip LOT 4

- Bridge 0.7.5 : le diff HTML ignore les espaces finaux non significatifs juste avant la fermeture d’un élément de bloc.
- Le retour réel de `Section — Mariage Why · v4` / Workbench `#3671` a validé le cycle Manager → Bridge → Manager ; les trois couleurs configurées sont revenues comme variables CSS modifiées.
- Le correctif 0.7.5 ne réécrit pas les anciens retours déjà importés ; Manager reconnaît néanmoins ce faux positif historique lors d’une promotion LOT 5.

## Lot 4 — Réception Occurrence Return V1 — 25/09/2026

- [x] Stockage SQL dédié aux retours Bridge sans détourner les snapshots ni les versions de Bibliothèque.
- [x] Inspection ZIP sécurisée : manifest V1, SHA-256 de chaque fichier déclaré, Site Occurrence V1 et cohérence des identifiants.
- [x] Vérification que le composant et la version Bibliothèque source existent réellement dans Manager.
- [x] Import idempotent par empreinte du package et conservation locale du ZIP source.
- [x] API Electron pour lister, ouvrir, inspecter, importer et décider.
- [x] Écran Bibliothèque pour voir les changements, le contenu retourné et la provenance.
- [x] Décision « Conserver uniquement cette occurrence » enregistrée de manière transactionnelle.
- [x] Au périmètre du LOT 4, les choix « nouvelle variante / mise à jour variante / nouvelle famille » étaient visibles mais volontairement désactivés ; ils sont désormais implémentés par le LOT 5.
- [x] Tests ciblés ajoutés pour import nominal, déduplication, checksum invalide, version source inconnue et décision.
- [x] Validation MSI : typecheck réussi ; tests ciblés 12/12 (4 Occurrence Return + 8 migrations), 0 échec.
- Aucun changement des contrats V1, aucune publication production, aucune décision Family / Variant automatique.
- [x] Recette réelle 26/09/2026 : package Manager v4 → Workbench Bridge #3671 → configuration des champs → Occurrence Return V1 → import Manager → décision « occurrence conservée ».

## Lot 3 — Validation humaine des versions réutilisables — 25/09/2026

- [x] Une préparation automatique ne passe plus seule le composant à « Prêt à réutiliser » et ne marque plus la version stable.
- [x] Validation humaine explicite ajoutée avant le couple statut `ready` + version stable.
- [x] La validation humaine est enregistrée par un marqueur interne ; les anciens états auto `ready`/stable ne sont donc pas présentés comme validés humainement.
- [x] Compatibilité historique : les anciens composants Bridge `ready`/stable sans marqueur humain sont présentés comme « À adapter » et leur stabilité est explicitement qualifiée de technique/ancienne, sans réécriture automatique des données.
- [x] Généralisation incomplète et ressources distantes bloquent la validation ; JavaScript et dépendances imposent une confirmation humaine.
- [x] Les badges et messages distinguent désormais « préparé », « à reprendre » et « validé humainement ».
- [x] Le statut « Prêt à réutiliser » n’est plus attribuable par simple édition de métadonnées pour un composant Bridge non validé.
- [x] Tests unitaires ciblés ajoutés pour la décision automatique / humaine.
- [ ] Typecheck et tests locaux à exécuter sur le MSI après synchronisation.
- Aucun changement de migration, de contrat V1, de Famille / Variante ou de retour Bridge.

## Lot 2 — Transport des assets et imports — 25/09/2026

- Base vérifiée avant modification : 4fb795035b32f312ea16496ab13f6a7b8d74e682 ; working tree initialement propre.
- [x] Correspondance des références déclarées avec les fichiers du package par SHA-256 ; récupération ciblée des objets du coffre et déduplication.
- [x] Assets absents, externes ou sans correspondance signalés ; import incomplet refusé avant toute création.
- [x] Préparation des fichiers avant écriture métier ; transaction couvrant version, assets, index et journal ; compensation des seuls fichiers créés lors d'un échec.
- [x] Nouvelle tentative après échec testée pour nouveau composant et nouvelle version.
- [x] Typecheck réussi ; tests ciblés : 46 réussis / 0 échec ; suite complète exécutée une fois : 257 réussis / 0 échec (46 fichiers).
- Aucun changement des contrats V1 ni de migration. Les champs existants hash / checksumSha256 / archivePath assurent la correspondance ; le bilan de transport est calculé, pas ajouté au manifeste.
- Les originaux en base restent inchangés ; une empreinte prouvée peut enrichir seulement le JSON exporté.
- Bridge repo pending. Aucun push ; prochain lot en attente de validation utilisateur.


## Lot 1 — Fiabilisation des contrats V1 — 25/09/2026

- [x] Cibles image explicites src/srcset conservées ; style inline et anciennes images sans attribut cible explicite exportés unresolved.
- [x] Validation des schémas V1 existants aux frontières du package et des occurrences, sans dépendance supplémentaire.
- [x] Identités comparées structurellement ; identifiants Bibliothèque/version cohérents entre composant, identité et provenance.
- [x] Typecheck réussi ; tests ciblés : 53 réussis / 0 échec ; suite complète exécutée une fois : 247 réussis / 0 échec (46 fichiers).
- Aucun changement de migration, de contrat V1, de publication ou de qualification prêt/stable.
- Bridge repo pending.
- Prochaine action : validation utilisateur du lot 1 ; aucun lot 2 engagé.


## État canonique — 24/09/2026

> Cette section prime sur les entrées historiques plus bas. Source de vérité partagée ChatGPT / Codex MSI.

### Socle courant

- Branche de base fonctionnelle : `fix/pre-phase5-commercial-ux` au commit `3494a76`.
- Phase 6 intégrée dans ce socle.
- Phase 5 Administration / Finance : **différée, pas supprimée**.
- Branche active : `feature/project-blueprints-v1`.
- PR active : **#73 — Projet V2 — Blueprints de production et atelier AtoumWeb**.
- Branche Phase 7 existante en parallèle : `feature/phase-7-analytics-v1` / PR #71 ; ne pas la poursuivre sans la réaligner sur Projet V2.
- Migrations sur Projet V2 / recette visuelle : **36**.
- `main` reste historique et très en retard par rapport au socle de travail ; ne pas l'utiliser comme base de développement courant.

### Projet V2 — réalisé

- [x] devis accepté → projet généré depuis les blueprints Catalogue ;
- [x] snapshot projet indépendant du modèle après création ;
- [x] phases repliées + étapes numérotées ;
- [x] glisser-déposer des étapes ;
- [x] plan / fiche redimensionnables ;
- [x] barre latérale escamotable et masquée automatiquement en Production ;
- [x] timer directement rattaché à une étape ;
- [x] notes et actions libres dans chaque étape ;
- [x] ressources / technique / temps ouverts en fenêtre sans quitter Production ;
- [x] pages renommables directement ;
- [x] validation avant clôture d'une phase et passage groupé de toutes les étapes en Terminé ;
- [x] undo / redo du travail de production ;
- [x] aide contextuelle des champs désactivable dans Réglages ;
- [x] coffre d'accès projet / étape chiffré avec Electron `safeStorage` ;
- [x] couche de cohérence UI transverse pour rapprocher les anciens écrans des pages récemment recettées.
- [x] page Facturation opérationnelle : éléments à facturer, tableau de bord, liste/fiche redimensionnable, import et ouverture du PDF Abby ;
- [x] statut Facturé verrouillé par la présence d’un PDF de facture client ;
- [x] facture PDF classée dans les Documents client / `03 Factures` sans API Abby ;
- [x] création d’un pack d’heures payant raccordée automatiquement aux éléments à facturer.
- [x] page Dépenses opérationnelle : frais internes AtoumWeb, client/projet, catégories, statuts, récurrence et justificatifs ;
- [x] suivi des frais engagés / payés avec dashboard mensuel et montant récurrent mensuel équivalent ;
- [x] justificatifs PDF/images stockés dans le workspace, avec classement client/projet lorsque disponible ;
- [x] migration 33 : table `expenses`.
- [x] thème Noir : contraste CRM/Prospection corrigé avec teintes sémantiques adaptées au sombre ;
- [x] identité visuelle CRM : logo + favicon pour les entreprises, photo/avatar pour les contacts, fallback initiales ;
- [x] identité réutilisée dans Annuaire Prospection, cartes du parcours et Clients ;
- [x] URL CRM normalisées : saisie sans protocole → `https://`, `http://` explicite conservé ;
- [x] migration 34 : table `crm_identity_assets`.
- [x] timer Intervention : démarrage → statut En cours ; arrêt guidé entre résolution et pause ; motif de pause historisé ;
- [x] incident résolu : passage À valider puis panneau Conclusion & rapport de fin avant clôture ;
- [x] migration 35 : motifs de pause sur `time_session_pauses` ;
- [x] Facturation / Dépenses : pictos SVG cohérents, splitter redimensionnable, fiche agrandissable et responsive ;
- [x] Bibliothèque AtoumWeb / Sauvegardes : liste + fiche redimensionnable, plein écran, fermeture explicite, responsive et hiérarchie typographique harmonisée.
- [x] protection renderer globale : une erreur React non interceptée n’aboutit plus à un écran noir muet ; l’erreur exacte est affichée dans AtoumWeb Manager ;
- [x] protection page Clients alignée sur la logique de la fenêtre Référence Prospect pour éviter qu’une fiche défaillante fasse disparaître toute l’interface ;
- [x] Gestion des temps : correction du plantage `ReferenceError: OperationIcon is not defined` introduit lors du remplacement des anciens symboles par les pictos SVG ; correctif confirmé visuellement sur MSI par l’utilisateur ;
- [x] thème Noir : contraste des teintes métier CRM renforcé pendant la recette visuelle continue.
- [x] Annuaire professionnel central : vues Organisations / Contacts, recherche et filtres, liens réels Client / Prospect / Externe, identité visuelle, fiche redimensionnable et agrandissable, sans migration supplémentaire ;
- [x] Statistiques V1 intégrées sur le socle Projet V2 : Vue d’ensemble / Commercial / Projets & temps / Clients, périodes mois / trimestre / année / toutes données, comparaison à la période précédente et indicateurs dérivés des données métier existantes ;
- [x] import Snapshot V1 AtoumWeb Bridge : nouvelle page **Sites**, inspection du ZIP avant import, contrôles SHA-256 / package fingerprint / références / arbres / compteurs, stockage historique Site → Snapshot → Page → Node, Sources / Assets / Dependencies, payloads en lecture seule et conservation des warnings du scan ;
- [x] migration 36 : stockage central des sites, snapshots, pages, nœuds, sources, assets, dépendances, relations et objets adressés par hash issus d’AtoumWeb Bridge ;
- [x] lecteur ZIP durci pour l’import Bridge : chemins dangereux, entrées chiffrées, types Unix spéciaux, doublons, CRC, tailles et ratios de compression suspects refusés ;
- [ ] diff Snapshot A / B et attribution des `logical_node_id` Manager à valider après réception d’un second snapshot réel.
- [ ] analytique avancée Phase 7 encore à réaligner : encaissements/paiements, rentabilité complète par prestation, exports statistiques et pilotage avancé.

### Validation

- [x] dernier checkpoint MSI confirmé par l’utilisateur avant ce lot : **40 fichiers / 187 tests réussis**, SQLite à **34 migrations**.
- [ ] revalider le HEAD actuel après le dernier lot : aide / actions / coffre sécurisé / Catalogue Offres & Tarifs / ateliers Interventions & Packs / Gestion des temps / Facturation PDF Abby / Dépenses / identité CRM / timer Intervention / Bibliothèque / Sauvegardes / Documents & Contrats / Annuaire / Statistiques / migrations 31–36 / import Bridge / cohérence UI globale. La recette visuelle a déjà confirmé le correctif du plantage Gestion des temps après import manquant de `OperationIcon`.
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Validation-MSI : Projet + anciens écrans principaux + trois thèmes.

### Prochaine action

Sur MSI :

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch --all --prune
git switch feature/project-blueprints-v1
git pull --ff-only
npm run typecheck
npm test
npm run package
C:\DEV\Lanceurs\AtoumWeb-Validation-MSI.cmd
```

Voir aussi : `docs/HANDOFF_CODEX_MSI.md`.


## Lot UX commercial avant Phase 5 — 19/09/2026

Branche `fix/pre-phase5-commercial-ux`, créée depuis `fix/prospect-recipe-ux-v2` à `3bc0f19`. Phase 5 en pause ; Phase 6 non intégrée. Aucune migration modifiée.

- [x] Fiches Prospect et Client : mode compact et vue agrandie avec défilement interne et hauteur disponible corrigée.
- [x] Couleurs métier des fiches, cartes et champs blancs ; température retirée du texte des cartes Prospect sans changer la donnée.
- [x] Qualification Prospect : accès direct aux champs manquants ; raccourcis vers besoin et relance.
- [x] Fiche Client : coordonnées prioritaires, éléments liés réellement présents, échéances conditionnelles et accès secondaires repliés.
- [x] Relation Client : cinq états distincts de la température Prospect, changement rapide, couleur de la fiche et des lignes, historique de transition.
- [x] `npm run typecheck` et `npm test` : 30 fichiers / 135 tests réussis.
- [ ] Recette visuelle Windows finale sur le profil de validation, plusieurs résolutions et trois thèmes.

Prochaine action : terminer la recette visuelle du lot avant toute validation finale ou fusion. Aucune migration ajoutée.

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche Git historique** : `main` (non utilisée comme base courante tant que le socle n'est pas consolidé)
- **Socle fonctionnel courant** : `fix/pre-phase5-commercial-ux`
- **Chantier actif** : `feature/project-blueprints-v1` — PR #73
- **Statistiques V1 initiales intégrées dans le chantier actif** ; la branche historique `feature/phase-7-analytics-v1` / PR #71 reste à réaligner uniquement pour l’analytique avancée non encore reprise
- **Migrations courantes sur Projet V2 / recette visuelle** : 35
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

### Stabilisation transverse — 15/09/2026

- [x] migration SQLite 19 : pipeline enrichi, température neutre, qualification, coordonnées multiples, actions structurées et documents client
- [x] ancien libellé « Dossier partagé » retiré de l’interface ; l’identité, les besoins, les devis et les projets restent des données liées
- [x] parcours devis « en préparation → à envoyer → envoyé » sans modifier le statut technique `draft` avant envoi
- [x] fichiers client stockés hors SQLite sous `clients/<client-id>/Documents`, métadonnées en base
- [x] correction du paquet Windows vide : renderer désormais inclus dans `app.asar`
- [x] validations automatisées : 28 fichiers, 118 tests, TypeScript et packaging
- [ ] recette fonctionnelle et visuelle Windows du scénario Boulangerie Martin

### Prospect Workflow V2 — 15/09/2026

Branche : `feature/prospect-workflow-v2`  
Base fonctionnelle : `fix/recette-commerciale-coherence` au commit `b30d2a89e0515f4193e4958097be838fbd0eba44`.  
Aucune fusion dans `main`.

- [x] migration 20 : origine commerciale, démarrage de prospection, qualification V2 et référence `decision_maker_contact_id`
- [x] parcours clarifié : `Nouveau contact → À qualifier → Besoin à identifier → Devis à préparer`
- [x] bouton explicite `Démarrer la prospection` et ouverture de la fiche de travail bureau
- [x] qualification conditionnelle selon l’origine du contact ; le besoin détaillé n’est plus demandé à cette étape
- [x] `Projet & solution AtoumWeb` raccordé au catalogue existant avec ajout de prestation en une seule action
- [x] contrôle avant devis intégré à l’étape `Besoin à identifier` ; ancien placeholder séparé supprimé
- [x] validation téléphone/email centralisée via `contactValidation`
- [x] décisionnaire rattaché à un vrai `contacts.id` ; coordonnées via `contact_methods`, anciennes colonnes conservées seulement pour compatibilité de migration
- [x] `Compact / Confort / Confort +` disponible dans les Réglages
- [x] température commerciale visible sur la carte, le panneau rapide et la fiche bureau
- [x] rappels rapides `demain / +7 jours / date précise` raccordés à `crm_actions`
- [x] suivi devis recentré sur `Devis à préparer → Devis à envoyer → En attente de retour`
- [x] après envoi : devis, montant, validité, délai restant et prochaine relance mis en évidence dans la fiche et la vignette pipeline
- [x] issues distinctes après envoi : `Accepté / signé`, `À modifier / Négociation`, `Refusé`; refus du devis distinct du statut Prospect `Perdu`
- [x] alerte de validité du devis dans les 7 derniers jours
- [x] ancien composant de qualification V1 supprimé
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] recette visuelle Windows sur le workspace de test propre

La CI de cette branche a été branchée sur le workflow GitHub. Les runners disponibles dans l’environnement GitHub actuel n’exécutent cependant aucune étape (`runner_id` nul/0), y compris avec `windows-latest`; un statut rouge sans étape n’est donc pas un résultat de compilation ou de test. La validation TypeScript/tests doit être exécutée localement tant qu’un runner utilisable n’est pas disponible.

Périmètre volontairement différé : refonte profonde de l’éditeur de devis et système d’import des packs d’offres `.atoum`. Les offres/contrats seront d’abord préparés comme configuration métier, puis le Manager évoluera selon le contrat technique commun validé.

### Correctifs de recette UX Prospect — 16/09/2026

Branche : `fix/prospect-recipe-ux-v2`  
PR : #67, conservée en brouillon.  
Base : `feature/prospect-workflow-v2` au commit validé `8284e1fc64c53bb4e5976a58c1fdb52715c5c671`.  
Aucune fusion dans `feature/prospect-workflow-v2` ni dans `main` avant validation technique et recette visuelle.

- [x] taille de texte fonctionnelle minimale portée à 14 px, y compris en densité Compact
- [x] fiche de travail Prospect élargie et agrandie sans plein écran forcé ; densité verticale réduite
- [x] teinte commerciale conservée sur la fiche avec champs neutres et contours liés à la température
- [x] interlocuteur principal ajoutable ou modifiable après création du prospect
- [x] décisionnaire sélectionnable parmi les Contacts liés, créable comme nouveau Contact ou conservé inconnu
- [x] autres Contacts d’entreprise avec fonction libre (`Gérant`, `Patron`, `Banquier`, `Comptable`…) sans détourner le libellé d’une coordonnée
- [x] bloc Coordonnées pleine largeur : propriétaire distinct de l’usage, plusieurs téléphones/emails par Contact
- [x] Actions / Relances enrichies avec cible Contact, motif, date, heure, contexte et récurrence avancée
- [x] compte rendu d’action en pleine largeur avec suites proposées selon le résultat
- [x] refus catégorique : classement Prospect `Perdu` sans recréation automatique d’une récurrence
- [x] informations nécessaires au devis transformées en checklist conservant les réponses et les points à obtenir plus tard
- [x] historique du dossier replié par défaut avec aperçu des 10 événements les plus récents
- [x] suivi devis du panneau latéral rendu lisible en disposition verticale
- [x] migration 21 limitée au contexte structuré des actions (`target_contact_id`, `reason_code`, `reason_text`)
- [x] tests ajoutés pour le contexte des actions, l’arrêt explicite d’une récurrence et les Contacts liés du workflow
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] recette visuelle Windows de la fiche Prospect corrigée

Le workflow CI de la PR #67 est actuellement créé mais reste en file d’attente sur le runner Windows ; aucun résultat de compilation ou de test ne doit être déduit tant qu’aucune étape n’a réellement démarré.

## Phase 0 — Fondation

Validations réelles effectuées sous Windows le 13/09/2026 :

- [x] `npm install`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run package`
- [x] démarrage réel Electron
- [x] navigation principale
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] workspace local
- [x] sauvegarde manuelle SQLite
- [x] restauration SQLite
- [x] sauvegarde automatique `pre-restore` avant restauration
- [x] correction du redémarrage de restauration en mode développement
- [x] `package-lock.json` versionné
- [ ] fusion finale de la fondation dans `main`

Workspace Windows validé :

- `C:\Users\carlo\Documents\AtoumWeb Manager`
- base : `data\atoumweb-manager.sqlite`
- sauvegardes : `backups\automatic`, `manual`, `pre-migration`, `pre-restore`

## Phase 1 — CRM

Branche : `feature/phase-1-crm`  
PR : #58 (brouillon)

### Fonctionnel

- [x] Organisations / Contacts maîtres
- [x] Prospects et pipeline
- [x] Clients
- [x] contacts multiples + rôles
- [x] conversion Prospect → Client transactionnelle et idempotente
- [x] archivage/réactivation
- [x] recherche globale CRM
- [x] journal d’activité
- [x] Actions / Relances multiples
- [x] prochaine échéance dérivée des actions ouvertes
- [x] Relance → étape `À relancer`
- [x] vue Prospects Pipeline / Historique
- [x] panneaux Prospect/Client à droite avec retour pleine largeur quand fermés
- [ ] deep-links précis Client/Prospect depuis tous les résultats de recherche
- [ ] enrichissement Client avec Projets/Facturation/Temps au fil des phases suivantes

### Validation réelle Windows

- [x] SQLite à 4 migrations
- [x] `npm run typecheck`
- [x] `npm test` — **5 fichiers / 17 tests réussis**
- [x] pipeline / drag-and-drop / piles de cartes
- [x] comportement panneaux latéraux validé visuellement
- [ ] dernier test visuel Actions / Relances multiples + Historique dédié

## Phase 2 — Commercial

Branche : `feature/phase-2-commercial`  
PR : #59 (brouillon)

### Développé

- [x] migration 5 — Catalogue Services / Offres
- [x] migration 6 — Devis
- [x] Services et Offres versionnés
- [x] composition d’une Offre à partir de versions de Services
- [x] inclus / optionnels / quantités
- [x] prix, prix conseillé, modes tarifaires, prérequis, inclusions/exclusions
- [x] version publiée immuable
- [x] création de nouvelle version sans modifier l’historique
- [x] numérotation `DEV-YYYY-001`
- [x] lignes Catalogue et lignes libres
- [x] snapshots autonomes du catalogue et des compositions d’Offres
- [x] remises % / montant / prix imposé / gratuité
- [x] valeur catalogue distincte de la valeur contractuelle
- [x] acompte / solde
- [x] statuts Devis
- [x] acceptation Prospect → Client
- [x] prévisualisation client sans données internes
- [x] génération PDF sous `exports\devis`
- [x] recherche globale Offres / Services / Devis

### Validation restante

- [ ] migration réelle 4 → 6 sous Windows avec sauvegarde `pre-migration`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] parcours visuel complet Catalogue / Devis / PDF
- [ ] trois thèmes

## Phase 3 — Projets & Production

Branche : `feature/phase-3-projects`  
PR : #60 (brouillon, empilée au-dessus de Phase 2)

### Migration 7 — Projets

- [x] modèles de projets
- [x] versions de modèles
- [x] arbre modèle Lot → Module/Page → Tâche → Checklist
- [x] versions publiées figées
- [x] `projects`, `project_nodes`, `project_services`, `project_prerequisites`
- [x] lien unique Devis ↔ Projet
- [x] numérotation `PRO-YYYY-001`
- [x] transformation Devis accepté → Projet idempotente
- [x] copie du snapshot commercial dans le projet
- [x] prérequis issus du devis/catalogue
- [x] projet interne AtoumWeb sans client externe
- [x] progression calculée depuis les tâches obligatoires
- [x] prévention des boucles parent/enfant
- [x] déplacement/réordonnancement transactionnel des nœuds Projet
- [x] arborescence physique Ressources créée automatiquement
- [x] checklist d’avertissement non bloquante avant passage `Terminé`

### Interface Projets

- [x] liste + filtres
- [x] fiche latérale Projet
- [x] création depuis devis accepté
- [x] création Projet interne
- [x] gestion des Modèles de projets
- [x] publication / nouvelle version de modèle
- [x] Résumé
- [x] Plan / Tâches
- [x] déplacement de parent + ordre ↑/↓ dans le plan
- [x] Prérequis
- [x] Ressources
- [x] Bibliothèque technique projet
- [x] Temps
- [x] Commercial
- [x] recherche globale Projet / tâches / Ressources / Bibliothèque
- [x] Dashboard alimenté par les projets actifs

### Migration 8 — Ressources projet

- [x] `file_assets`
- [x] `file_asset_links`
- [x] fichiers physiques conservés hors SQLite
- [x] dossiers `01 Identité` à `07 Archives`
- [x] import de fichiers dans le workspace
- [x] checksum SHA-256
- [x] prévention des doublons par checksum dans un projet
- [x] statut Reçu / À traiter / En cours / Validé / Obsolète
- [x] rôle Client / Réécriture AtoumWeb / Final / Autre
- [x] même fichier lié à plusieurs tâches sans duplication physique
- [x] détection fichier manquant
- [x] relocalisation/restauration d’une ressource
- [x] ouverture fichier / dossier depuis Electron
- [x] interface Ressources raccordée à la fiche Projet
- [x] indexation dans la recherche globale
- [x] tests Ressources écrits
- [ ] galerie miniature images/médias

### Migration 9 — Bibliothèque technique projet

- [x] `technical_items`
- [x] `technical_item_versions`
- [x] `technical_item_assets`
- [x] catégories Header / Footer / Hero / Page / Section / CSS / JS / PHP / ACF / Divi / Woo / Plugin / Config / Note
- [x] contenu Code / JSON / Texte / Référence
- [x] version actuelle
- [x] version stable distincte de la version actuelle
- [x] historique immuable
- [x] liaison aux vraies Ressources du projet
- [x] archivage
- [x] aucun code exécuté automatiquement
- [x] interface Bibliothèque dans la fiche Projet
- [x] `Préparer pour réutilisation` génère un paquet projet sans généralisation automatique
- [x] recherche globale des éléments techniques
- [x] tests versioning / stable / ressources / réutilisation écrits
- [x] schéma déjà extensible à `scope=atoumweb` pour la future Phase 6 sans modifier les projets clients
- [ ] coloration syntaxique avancée / Monaco plus tard
- [ ] captures/aperçus avancés plus tard

### Migration 10 — Timer & sessions de temps

- [x] `time_sessions`
- [x] `time_session_pauses`
- [x] une seule session active globalement garantie par SQLite
- [x] contexte Client / Projet / Tâche
- [x] catégories de temps
- [x] facturable / non facturable
- [x] source Timer / Manuel / Import
- [x] démarrer / pause / reprendre / arrêter
- [x] durée réelle calculée depuis timestamps et pauses
- [x] session active conservée après navigation et fermeture de l’application
- [x] heartbeat du chrono pour mémoriser le dernier point connu
- [x] détection d’une session oubliée après fermeture/redémarrage
- [x] reprise sans compter l’interruption
- [x] arrêt au dernier point connu
- [x] saisie manuelle
- [x] correction d’une session historique terminée
- [x] protection des pauses existantes pendant une correction
- [x] changement d’activité transactionnel : terminer l’ancienne + démarrer la nouvelle au même instant
- [x] synthèse temps total / facturable / non facturable
- [x] filtres Aujourd’hui / Semaine / Mois / Client / Projet / Catégorie / Facturable
- [x] vrai timer global dans le header
- [x] page `Gestion des temps`
- [x] onglet Temps dans la fiche Projet
- [x] temps estimé vs réel + écart dans Projet
- [x] raccourcis Projet/Tâche → timer global prérempli
- [x] Dashboard : temps du mois dérivé des sessions
- [x] tests Timer/pause/reprise/redémarrage/correction/changement d’activité écrits
- [x] doublon d’enregistrement IPC Timer supprimé

### Reste Phase 3 avant validation finale

- [ ] réorganisation/duplication plus complète des nœuds dans les **modèles** de projets
- [ ] galerie miniature images/médias
- [ ] ergonomie avancée Bibliothèque (copie/agrandissement/coloration)
- [ ] validation du cas de référence Cazor
- [ ] validation locale Windows migrations 6 → 10
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] test visuel complet trois thèmes
- [ ] mise à jour finale documentation Phase 3 après validation

## CI GitHub

Le workflow couvre maintenant les branches Fondation / Phase 1 / Phase 2 / Phase 3.

Les runs Phase 3 observés restent **non exploitables** : GitHub crée le job `windows-latest` mais lui attribue `runner_id: 0` et n’exécute aucune étape. Il n’y a donc ni checkout, ni installation, ni typecheck, ni tests. Le statut rouge ne constitue pas un échec du code.

La validation réelle continue donc d’être effectuée localement sur Windows.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39
- **Phase 6 — Référentiels & Continuité** : #40–#47
- **Phase 7 — Statistiques & Stabilisation V1** : #48–#57

## Règles à ne pas casser

1. Prospect et Client partagent les mêmes Organisations/Contacts ; aucune recopie d’identité.
2. Archivage plutôt que suppression destructive.
3. Conversion Prospect → Client idempotente.
4. Valeur commerciale, valeur contractuelle, facturé, encaissé et dépenses restent distincts.
5. Fichiers lourds hors SQLite ; la base stocke les références et métadonnées.
6. Abby reste la source des factures réglementaires en V1.
7. Bibliothèque projet et Bibliothèque AtoumWeb restent indépendantes.
8. Aucun code de bibliothèque n’est exécuté automatiquement.
9. Une sauvegarde serveur n’est jamais considérée comme une sauvegarde locale.
10. Statistiques et recherche sont dérivées/reconstruisibles.
11. Tous les éléments historiques importants sont journalisés.
12. Une Relance et une Action sont deux objets distincts ; plusieurs peuvent coexister sur un même dossier.
13. Les panneaux latéraux Prospect/Client/Projet restent à droite et les listes reprennent la largeur disponible lorsqu’ils sont fermés.
14. Le temps réel a une seule source : `time_sessions`. Aucun module ne maintient un compteur indépendant.
15. Une version de modèle, de catalogue ou de composant déjà utilisée ne modifie jamais rétroactivement un dossier existant.

## Travail en cours

**Phase 3 — fermeture des derniers écarts fonctionnels avant validation Windows.**

Prochaine validation Windows après stabilisation de la branche : migration vers 10 migrations, `npm run typecheck`, `npm test`, puis parcours Projet / Ressources / Bibliothèque / Timer / Gestion des temps.

## Phase 4 — Validation automatisée du 14/09/2026

Cette entrée actualise le travail en cours décrit plus haut : Phase 4 en gel fonctionnel, validation visuelle Windows restante.
Branche : feature/phase-4-operations — PR #61 conservée en brouillon.
Point de départ distant vérifié : 6d09156.

- [x] Node local 20.19.3 / npm 10.8.2 vérifiés.
- [x] npm run typecheck : aucune erreur.
- [x] npm test : **26 fichiers / 102 tests réussis**, aucun échec ni test désactivé.
- [x] Tests exécutés par le script du dépôt sous Electron 44.3.0 / Node embarqué 24.20.0.
- [x] Correction du tri SQLite des alertes : alias explicite created_at dans le UNION ALL.
- [x] Temps Intervention calculé par TimeService : suppression de la troncature SQL imprécise, mêmes pauses et même arrêt au dernier point connu que le Timer.
- [x] Tests de non-régression des pauses avec millisecondes et de la récupération d'une session oubliée.
- [x] Migrations 1 à 17 : base vierge, ordre, application unique, mises à niveau depuis 4 / 6 / 10, préservation des données sentinelles et d'une session Phase 3, index composite, intégrité SQLite.
- [x] Revue du périmètre : services Opérations, tests et suivi documentaire uniquement ; aucune migration modifiée ou renumérotée.
- [ ] Validation visuelle Windows et migration sur données existantes avec sauvegarde pré-migration.
- [ ] Parcours Intervention / Demande → Intervention / modification et retrait du rattachement / Timer au contexte sauvegardé / persistance après redémarrage.
- [ ] Régressions Opérations / Maintenance / Packs / Incidents / recherche / fiches Client et Projet / trois thèmes.

Aucune donnée du dossier utilisateur Documents\AtoumWeb Manager touchée. Les tests utilisent uniquement des bases en mémoire et des espaces temporaires de test.
Le nouveau test d'index a été corrigé après constat : l'index existant comprend intervention_id puis started_at DESC ; l'assertion contrôle ces deux colonnes et leur ordre.
Gel fonctionnel Phase 4 maintenu. Phase 5 différée, aucun apport de la branche Phase 6, aucune fusion.
Point d'attention manuel : vérifier aussi la fluidité des listes d'interventions avec un historique de temps volumineux, le total utilisant désormais le service de temps commun.

Prochaine action : lancement normal du Manager et parcours du plan docs/PHASE_4_VALIDATION_WINDOWS.md avec les données existantes et sauvegarde pré-migration. Conserver la PR #61 en brouillon ; aucune fusion avant validation Phase 4.


## Stabilisation transverse — issue #65

Branche feature/stabilisation-parcours-metier créée depuis 4f1323a (Phases 1 à 4 validées). Périmètre étendu explicitement par la demande utilisateur : catalogue AtoumWeb, besoins CRM référencés, continuité devis/projet/dashboard, données demo et responsive. Phase 6 non intégrée, Phase 5 non démarrée, aucune fusion.

- [x] Socle propre vérifié : 26 fichiers / 102 tests, typecheck vert.
- [x] Migration 18 ajoutée sans renuméroter 1 à 17 : catalogue AtoumWeb, conditions commerciales, besoins CRM et marquage des lots demo.
- [x] Parcours raccordé : fiche Prospect/Client, devis et conditions, acceptation vers Projet, dashboard et liens profonds.
- [x] Saisies de démonstration identifiables, trois parcours cohérents, sauvegarde obligatoire et purge transactionnelle sélective.
- [x] Responsive, défilement des panneaux et taille des textes harmonisés.
- [x] `npm run typecheck` : aucune erreur.
- [x] `npm test` : **27 fichiers / 113 tests réussis**, aucun échec ni test désactivé.
- [x] `npm run package` : package Electron Windows x64 généré avec succès pendant la stabilisation.
- [ ] Validation visuelle Windows sur un workspace temporaire, puis parcours métier sur données utilisateur uniquement après sauvegarde explicite.

Les tests couvrent les migrations vierges et mises à niveau, les prix confirmés / Sur devis, les besoins multiples, la conversion idempotente, les données vivantes, les snapshots, les lignes de devis atomiques, la création Projet, le dashboard et la purge demo sans suppression des références ni des dossiers réels.

Prochaine action : validation visuelle du parcours complet et des trois thèmes sous Windows. Aucune ouverture du workspace utilisateur sans sauvegarde explicite.

Clôture Lot 3 — 03/10/2026 : bilan réel validé par AtoumWeb ; commit local dédié autorisé, sans push ni merge. La recette manuelle AtoumWeb reste à faire avant validation fonctionnelle finale. Cette clôture ne contient aucune modification du Lot 4.

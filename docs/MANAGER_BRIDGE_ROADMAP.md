# Manager ↔ Bridge — Architecture, feuille de route et journal partagé

**31/10 — consolidation contractuelle PR #161 :** demande autorisée limitée au chantier Manager contractuel, sans Bridge. Réutilisation des 118 propositions et six brouillons, aucune nouvelle réécriture. Migration77 additive et interface de décision humaine séparée de la publication : individuel/groupe, relecteur, note, confirmation et journal. Rapport de clôture, suivi CSV118 et plan d’intégration #158→#159→#161 préparés ; #158 fusionnable mais UNSTABLE, #159/#161 CLEAN. Typecheck, paquet Electron,32tests ciblés et suite complète1746/1746+1ignoré ; recette SQLite groupée réussie, SHA source inchangé. Aucune base active, publication, tarif, historique, merge ou déploiement modifié.

**12/10 — pause02B.3, préparation consolidation86–93 :** huitHEAD/bases/commits pointés ;16simulationsmerge-tree sansconflit/arbreidentique, pasfusion/retarget. Échecmain38006715403 auSHA07dde9c8 :A→Btimeout20s,800/801 ; mêmesblobsrestore surpile, doncnoncorrigé. Anciencheckoutvert etmain mêmecontenu. Local3ciblésPASS puis35restaurationsPASS73,59s, paspreuvehosted. [Bilan86–93](UXV2_CONSOLIDATION_86_93_PREPARATION.md) avecgatesWindows/CI, coûtquota nonconfirmé/APIusage sansscopeuser ; plan6runs puis16total sousaccords, aucunworkflow déclenché. Publicationdocumentaire93 seulement ; aucuneactivitémétier/Validation-MSI/Bridge, budgets etbranchespréservés. Chaque Ready/merge/retarget/actualisation future nécessiteaccord explicite.

**12/10 — 02B.1–02B.2 dans #93 draft/base92 :** audit header/chrono/horloge/recherche/notifications/clavier puis atelier autonome. Slot chrono TEST unique pendant repli/module/dialogue, contrôles02A partagés, préférenceheader01F séparée du bandeauBibliothèque, gardesUX-01 surformulaires/motifs. Codef7099aa : typecheckOK,25ciblés,884/884complet(96fichiers,117,82s,sansRPC),86natif/deuxprocessus/18captures,125rail/183UX-01/300renderer ; intégrité/FK/migrations1–66 et tables horssettings préservées surTEMP. [Bilan/limites](UXV2_LOT02B_EXECUTION.md), [inventaire](UXV2_LOT02B_INVENTAIRE.md). Aucun port App/GlobalTimer/GlobalSearch réel, accelerator global,02C/03, merge/main, CIhébergée ouValidation-MSI. Recette humaine globale différée.

**12/10 — 02A préparé, atelier publié dans #92 draft/base91 :** départ765f66d et revueChatGPT vérifiés ; [inventaire](UXV2_LOT02A_INVENTAIRE.md) des 17 clés/events/CSS/UX-01, puis rail E42 A avec groupes/favoris/clavier et stockage01F. Demande Projet temporaire distincte du choix durable ; logo/pictos non approuvés réservés. Code5f8480e, typecheckOK, ciblés18, complet877/877 (95fichiers,112,99s,sansRPC), natif125/deuxprocessus/neufcaptures/SHAexact ; F76/UX-01183/renderer300 hérités rejoués, tables horssettings intactes et intégrité/FK/migrations1–66 TEMP. [Bilan et critères](UXV2_LOT02A_EXECUTION.md). Atelier seul, pas de migrationApp/routes/GlobalTimer ; aucun02B/03, CIhébergée, merge/main, Bridge ou Validation-MSI. Raccord réel et revue visuelle finale restent ultérieurs.

**12/10 — 01F développé et recetté techniquement :** branche séparée depuis90@4653e58, codefc3fc3e puis31ed71e. Dispositions versionnées viaSQLite/settings parworkspace, composants01A–01E assemblés dansatelier autonome, notes/id/query exclus, resetnonmétier et notifications2fenêtres. TypecheckOK, ciblés49, complet867/867(94fichiers,100,46s,sansRPC), natif76/deuxprocessus/neufcaptures/SHAexact ; E95/D126/C66/UX-01183 etrenderer300hérités rejoués aucheckpointfc3, B70/40/Abby25 finaux. Tables métier/références inchangées, intégrité/FK/migrations1–66 TEMP, aucunValidation-MSI. [Rapport01F](UXV2_LOT01F_EXECUTION.md) et[22gates](UXV2_LOT01F_GATES.md), CI et recettehumaineglobale différées. PublicationPRdistincte draft/base90 ; aucune fusion niBridge. Suiteconforme : revue/consolidation puislot02, paslot03/Prospection àce stade.

**12/10 — 01E Windows :** PR90 récupéréece8d1767 sansécrasement ; syntaxetest etshellbanc corrigés, code8f52747/bancd4b38798. TypecheckOK, ciblés52, complet859/859(93fichiers,100,20s,sansRPC), natif95/neufcaptures, UX-01183/D126/C66 ; migrations/intégrité/FK TEMP, pasValidation-MSI. [Bilan01E](UXV2_LOT01E_EXECUTION.md) et20gates : pilote01E.5/6 stabilisé, save-and-exit nonactivé, crashnonpromis. Suite01F autorisée séparément ; niBridge ni01F/lot02présentéscomme déjàlivrés. Aucunmerge/CIhébergée ; dépendances86–90préservées.

**12/10 — checkpoint01D.4 :** code7c46651 PR89 draft/base88, source synthétique complète/paginée, filtre/tri global, exactitude des comptes, étatsloading/erreur/vide/retry, refus réponses tardives avec fiche/brouillon conservés. TypecheckOK, ciblés36, complet846/846(92fichiers,121,24s,sansRPC), atelier126/neufcaptures/SHAexact, C66/UX-01183/B40/Abby25 ; migrations/intégrité/FK TEMP, zéro service réel/Validation-MSI. [Bilan01D et proposition de clôture socle](UXV2_LOT01D_EXECUTION.md). Annuaire prospects proposé comme premier port, non commencé ; adaptationsréglages/workspace et recettehumaine restent ultérieures. CI86 différée tant quequota/protections pasconfirmés, sixruns autorisés conditionnellement, aucune fusion/CI/retarget.

**12/10 — checkpoint01D.3 :** PR89/base88 préservées, code17499bf, colonnes drag/clavier et resize à écriture unique, vues personnelles et défaut sûrv2/v1 ; fiche/brouillon conservés, aucun port métier. TypecheckOK, ciblés27, complet837/837(91fichiers,116,53s,sansRPC), natif112/neufcaptures, C66/UX-01183/B40/Abby25 ; intégrité/FK TEMP, aucune Validation-MSI. [Rapport](UXV2_LOT01D_EXECUTION.md). Suite01D.4 autorisée, recette humaine différée. Six CI autorisées mais86 en attente quota/protections confirmés ; aucune CI/merge/retarget exécuté.

Date d'ouverture : 27/09/2026.

## 0. État courant et lecture de la roadmap — 09/10/2026

**12/10 — premier atelier01D.2 publié dans89 :** source120dossiers synthétiques, DataTable/recherche/filtres/tri/colonnes et fiche01C ; même selectedId, montage, onglet et note lorsque la ligne disparaît du filtre ou change de place. Primitives01B/01C et mêmeUX-01, aucune règle métier nouvelle. Codefbc029d /banceda2eae, typecheckOK, ciblés16/16, complet826/826 (90fichiers,109,41s,sansRPC), natif92/92/neuf captures ; non-régression01C66 etUX-01183. [État/limites](UXV2_LOT01D_EXECUTION.md), pas migration des17modules. Consolidation86→87→88 reste préparée, aucune cible/fusion/CI modifiée dans cette tâche ; budgets et Validation-MSI intacts, recette humaine globale différée.

**12/10 — consolidation préparée, 01D.1 documenté :** #86/#87/#88 draft et mergeable, cibles ancêtres, aucun conflit dans les simulations ; plan86→main puis87 puis88, validations locales/CI réelles et autorisation avant exécution. Main07dde9c8 non protégée, aucun paramètre changé ; pas de fusion/CI/retarget effectué. [Plan](UXV2_CONSOLIDATION_01ABC_PLAN.md). Branche distincte01D depuis0fab2ae, [inventaire de sept vues et atelier120 dossiers défini](UXV2_LOT01D_INVENTAIRE_01.md), aucun écran métier ou table configurable encore modifié/implémenté. Réemploi01B/01C/UX-01, recette humaine différée et risques métier bloquants conservés. Pas de Validation-MSI, migration ou Bridge.

**12/10 — bilan 01C et cadrage 01D :** revue #88 traitée au code01b95a4 : aperçu immédiat, sauvegarde unique en fin de glissement ; annulation et changement de module sans écriture tardive. Atelier66/66, ciblés19/19, typecheckOK, suite810/810 dans88fichiers en107,08s, sansRPC ; captures horsGit et TEMP nettoyé. [Bilan01C](UXV2_LOT01C_EXECUTION.md) au périmètre socle/atelier ; [01D cadré](UXV2_LOT01D_CADRAGE.md) depuis #82, aucun écran métier modifié. Recette humaine globale différée, risques de perte/mutation toujours bloquants. Publication #88 draft avec skipci, aucune fusion/main, CI hébergée, migration réelle, Validation-MSI ou Bridge.

**État du12/10 — publication01B et premier incrément01C :** AtoumWeb valide la clôture technique01B et diffère la recette humaine globale à la fin V2. #87 publié à2d1ddb7, #82référentiel actualisé à0bb0860 ; drafts conservées, aucun merge/CIhébergée. Branche01C `codex/ux-v2-lot01c-panels-v1` depuis87 : socle RecordPane/ResizableSplitView et atelier isolé, pas port des17modules. Code f8d60c4, typecheckOK, ciblés19, atelier51 avec9captures synchronisées, UX-01natif183. [Rapport et résultats complets](UXV2_LOT01C_EXECUTION.md). Stockage pilote profilTEMP, adaptateur injectable et ports/settings ultérieurs ; aucun accès Validation-MSI, restauration/migration réelle, règle contractuelle ou Bridge modifiés. Tests techniques obligatoires à chaque incrément ; toute perte de saisie/mutation incorrecte reste bloquante.

**Reprise actuelle du 12/10/2026 — UX/UI V2 01B :** main vérifié `07dde9c8`, #81 terminée, #83 fermée sans fusion ; #82/#86/#87 draft. Travail sur #87 depuis b9679c3, correctif local `af5cdc559517e049c45f80acf551928e0dd28772` : raccords manquants au registre UX-01 pour bloquer Abby sur dirty/pending du devis, et placement d'aide longue corrigé après reproduction. Recettes isolées Windows : Abby25, Devis21, UX-01 183, contrôles40, aide70, icônes42, notifications30, atelier50 et interface réelle300, tous PASS ; typecheck OK, **801/801 dans 87 fichiers, 108,59 s, sans RPC**. [Rapport](UXV2_LOT01B_REPRISE_2026-10-12.md) et [matrice R01B](UXV2_LOT01B_GATES.md) : clôture technique du pilote soumise à validation humaine. Aucun push/CI hébergée/merge, donnée réelle, migration ou Bridge modifié. 01C proposé seulement en plan, pas commencé. Les passages suivants restent historiques.

**Validation packagée additionnelle du 10/10/2026 — UX-01/UX-16 :** `scripts/check-ux01-packaged-relaunch.cjs` **exécuté avec succès sur Windows** à `61786e1`, Electron 44.3.0, **2/2 scénarios**, récupération réelle `backups:restore` sous `app.isPackaged`, nouveau PID par **`app.relaunch()`**, sauvegarde `pre-restore`, et fermeture refusée sans marqueur ni restauration ultérieure. `Fixture cleaned: true`. Il s'agit d'un **exécutable de test indépendant**, pas du package final du Manager. Pas de CI GitHub sur ce nouveau HEAD, ni de fusion. [Détails](UX01_PACKAGED_RELAUNCH_RECIPE.md).

**Lot UX-01 packagé préparé au 10/10/2026 :** nouveau banc d'essai `scripts/check-ux01-packaged-relaunch.cjs` avec exécutable Electron de recette sous `%TEMP%`, vrai `backups:restore` dans `app.isPackaged`, `app.relaunch()` automatique, sauvegarde `pre-restore` et cas de fermeture refusée. **Syntaxe JavaScript contrôlée ; aucune exécution Windows de ce test packagé à cette date.** Il reste distinct du package réel Manager Forge et ne modifie ni `main`, #82, #83, les migrations ni Validation-MSI. [Procédure](UX01_PACKAGED_RELAUNCH_RECIPE.md).

**Validation additionnelle du 10/10 — UX-01 × UX-16 :** la recette multi-processus Electron avec base TEMP a réussi **12/12 vérifications, 5/5 étapes**, aucun échec et nettoyage confirmé, sur `prep/ux01-restore-quit-gate-v2@dbfd0e2`. Quit accepté, reprise SQLite au démarrage, copie de sécurité, absence de rejeu, quit refusé et absence de restauration ultérieure vérifiés. Les **801/801 tests complets, typecheck et 183/183 natifs trois thèmes** restent des preuves antérieures du HEAD `88efb788` : entre ces SHA, aucun code de production `src/` n'a changé, uniquement la recette et le suivi. **Reste non validé :** véritable exécutable packagé avec `app.isPackaged`/`app.relaunch()`, CI intégrée sur le SHA final ; aucune fusion ni changement #82/#83/main/Validation-MSI. [Rapport détaillé](UX01_RESTORE_QUIT_ROUNDTRIP.md).

**État complémentaire 10/10/2026 — validation #83 :** sur la branche isolée UX-01 au commit `88efb788`, AtoumWeb a exécuté sur Windows le typecheck, **801/801 tests /87 fichiers** et **183/183 contrôles Electron trois thèmes**, tous verts. Nouvelle recette `scripts/check-restore-quit-roundtrip.cjs` ensuite préparée pour la sortie, restauration et relance sur plusieurs processus natifs avec profils TEMP (voir [protocole](UX01_RESTORE_QUIT_ROUNDTRIP.md)) : **non exécutée sur Windows**. Ni CI du HEAD ultérieur ni exécutable packagé validés. Pas de fusion ni changement Validation-MSI, #82 ou #83.

**État actuel du 10/10/2026 — suite #81 → #83 :** `main@68bfd952` contient #81 fusionnée normalement, CI #652 **SUCCESS**, typecheck et 750/750 tests dont 35 restaurations. #83 reste draft à `5b38cbe1` ; #82 reste distincte. Le code UX-01 a été combiné en branche isolée `prep/ux01-with-integrity-v1@8a577f1`, puis renforcé sur `prep/ux01-restore-quit-gate-v2` : programmation de restauration packagée uniquement lors du `will-quit` réellement accepté, intention annulée sur refus de fermeture, relance seulement après programmation réussie. Cinq tests isolés du garde passés sous Node 22 ; tests Vitest globaux, Electron Windows trois thèmes, redémarrage/restauration réelle et CI **non exécutés** sur cette combinaison. Aucun merge #83, changement Validation-MSI ou lot UX/UI V2. L'historique #83 et les anciens checkpoints #81 ci-dessous conservent leurs statuts d'origine et ne décrivent pas la validation actuelle. [Préparation](UX01_WITH_INTEGRITY_PREPARATION.md).

**Revue finale #83 :** trois pertes résiduelles reproduites/corrigées (groupe archivage Prospect, suppression ligne Devis avant garde, section réduite démontée). Typecheck, 734 tests et 177 contrôles natifs trois thèmes verts ; compatibilité #81 simulée sur copie isolée : typecheck/87 tests ciblés/177 natifs verts après résolution proposée de l’IPC. #80 conflits de suivi uniquement, #82 sans conflit. CI quality queued sans runner enregistré : attendre résultat avant recommandation de fusion. Validation-MSI fermée, aucun merge ni développement V2 ; Enregistrer et quitter reste futur.

**UX-01A/B/C : corrections terminées sur branche indépendante**, `codex/fix-manager-unsaved-inputs-ux01`, depuis `main@eb252d5c`. Commits distincts A (`df1b6f3`), B (`80300a4`) et C : sections contractuelles indépendantes/conflits, sorties Prospection/Devis, cycle Electron/fenêtre détachée/workspace différé. [Livraison et limites](FUNCTIONAL_UNSAVED_INPUTS_UX01_DELIVERY.md) ; [diagnostic historique](FUNCTIONAL_UNSAVED_INPUTS_UX01_DIAGNOSIS.md). Typecheck OK, 75 tests ciblés, 733 tests complets (deux workers), 153 contrôles natifs trois thèmes, migrations 1–66/intégrité/FK sur fixtures supprimées. Aucun accès Validation-MSI, aucune refonte UX/UI V2, aucune migration ou modification des règles métier. Publication d’une PR corrective dédiée autorisée ; aucune fusion automatique. #80/#81 non modifiées. Prochaine action : CI puis validation AtoumWeb ; extensions aux autres modules à arbitrer séparément.

**#81 après CI #650 : diagnostic RPC et correction locale commune, non publiée.** #650 a réussi 748 assertions/typecheck mais échoué sur onTaskUpdate. Reproduction isolée : 60 assertions réussies, parent répond immédiatement mais worker synchrone traite ses réponses après 66 s (limite RPC 60 s). Hook commun afterEach/setImmediate natif, sans changer pool/version/délais/assertions ; stress corrigé 60/60, ciblés 24/24 et 92/92, suite complète **750/750 dans 82 fichiers, 99,76 s**, typecheck OK et aucune erreur RPC. Deux tests supplémentaires protègent les fake timers ; restaurations/migrations/intégrité/FK existantes passent sur fixtures. [Preuves et limites](VITEST_RPC_LOCAL_DIAGNOSIS.md). Aucun push, CI hébergée supplémentaire, merge, changement #82/#83 ou accès Validation-MSI ; attente d'arbitrage pour confirmation Windows. Les entrées suivantes conservent l'historique à leur date.

**#81 après échec CI #649 : correctif local ciblé, non publié.** Mocks de remplacement/concurrence canonisent désormais les deux chemins ; défaut reproduit avec jonction, injections réelles vérifiées. Fixtures historiques construites par vraies migrations en mémoire puis export, aucun délai/80 assertions initiales/service relâché ; un contrôle d’injection ajouté. Typecheck, 3 tests répétés trois fois et 35/35 restaurations (63,91 s) verts, sans RPC. Pas de 748 tests rejoués, nouvelle CI à autoriser ; aucun push/merge/visibilité/budget/#82/#83 ou Validation-MSI modifié.

**#81 reprise et préparée pour CI :** main 2b390632 après merge normal #84 et CI post-merge #628 verte ; merge normal e215125 sur #81. Correctif RPC test-only afterEach async/setImmediate, assertions/délais/services/protections identiques au 593a4611. Typecheck/68 ciblés/748 complets verts (81 fichiers,207,78 s), schema 1–66/intégrité/FK sur fixtures nettoyées. Publication [skip ci], draft et nouveau run #81 à autoriser avant validation de fusion ; aucune CI #81 actuelle annoncée verte. #82/#83, budget et Validation-MSI non modifiés par Codex.

**Reprise #81 sur main CI stabilisé :** #84 fusionnée normalement en 2b390632 (run #589 f4bc0197 vert). main local fast-forward, intégration normale dans #81 ; seuls conflits documentaires, historiques conservés. Correctif de cycle de test RPC à isoler puis contrôles locaux et préparation CI ; aucune fusion #81, modification #82/#83, budget ou Validation-MSI. Les checkpoints suivants décrivent leurs dates respectives.

**Chantier fonctionnel UX-16 / UX-03 validé et implémenté**, sur `codex/fix-manager-integrity-ux16-ux03`, base `main@eb252d5c`. Destination de restauration épinglée/validée et copie transactionnelle ; terminaison atomique et débit imbriquable. **58/58 ciblés, 745/745 complets, typecheck OK** ; tests physiques temporaires Windows et fixtures mémoire, schéma 1–66 inchangé. Aucun accès Validation-MSI, réparation historique, nouvelle migration ou refonte d'écran. [Bilan et limites](FUNCTIONAL_INTEGRITY_UX16_UX03.md). AtoumWeb autorise commits et PR corrective dédiée sans fusion ; PR #80 documentaire inchangée, conception UX/UI V2 séparée. Prochaine action : revue de la PR corrective ; UX-01/04/05/02 restent ultérieurs.

**CI #84 : publication autorisée du correctif fixtures 5a175eb, sans réécriture, avec commit de suivi [skip ci] au HEAD.** Diff limité au helper de fixture, ses tests et suivi ; 27 ciblés/typecheck réaffirmés, 698 complets déjà verts. Aucune exécution Actions supplémentaire, fusion ou mutation Validation-MSI/budget. Protocole Windows hébergé et intégration future #81/#83 préparés dans CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS ; branches inchangées. Attendre accord de nouveau run, puis succès réel avant fusion. Les checkpoints ci-dessous restent historiques.

**Préparation CI distincte :** quality proposé sur Windows hébergé windows-2022/Node 24/npm ci/tests deux workers. Actions autorisé, zéro runner local ; #80–#83 draft et queued. Facturation/quota non lisibles avec le jeton (scope user absent) : PR préparée avec [skip ci], aucun run hébergé déclenché ni succès CI annoncé. Attendre quota/budget ou arbitrage de dépense avant nouveau commit sans marqueur. Aucun code métier, UX V2, migration ou Validation-MSI modifié.

**Manager officiel : main.** PR #79 fusionnée normalement (8e05a47296d478587b11841e36ca5acb2e936726). Le checkpoint contenant cette entrée publie l’évolution contractuelle et les corrections UX de la recette, après autorisation AtoumWeb ; fix/pre-phase5-commercial-ux et le checkpoint 1–65 sont historiques.

Projet V2, Sites/Pages/compositions, Devis/contrats/Builder CGV, Catalogue 112, opérations et Phase 7 Statistiques/Rentabilité intégrés. **Migrations 1–66** : types/compositions versionnés et liens aux versions Catalogue, sans copie des textes ni réécriture des snapshots acceptés. Validation-MSI : 13 types draft /112 liens ; références existantes conservées.

Derniers contrôles : **typecheck OK, 695/695 tests, UI 134 natifs +37 Prospection +21 préparation +20 options sur trois thèmes ; intégrité SQLite OK/FK vide**. Corrections UX dans PROJECT_STATUS ; recette manuelle AtoumWeb en cours. Lanceur local : **C:/DEV/Lanceurs/AtoumWeb-Recette-Validation-MSI.cmd**, sources via npm start. Ancien package du 29/09 obsolète ; ce push n’est pas un rebuild/installateur.

Abby manuel ; aucune validation juridique globale. Validation-MSI TEST/non productive, mutable, dossier humain conservé ; tests sur fixtures/bases temporaires. Pas de nouvelle publication/activation par ce checkpoint. Réemploi #62 porté sélectivement, ancienne branche non fusionnée ; #68 .atoum V0.2 prototype historique non intégré. Bridge WordPress/8C et futurs chantiers séparés.

**Autorisation Git du 09/10 : commit/push sur main des sources et fichiers de liaison.** Pas de merge ni nouveau lot métier. Prochaine action : poursuivre la recette manuelle avec le bon lanceur. Les anciens checkpoints valent à leur date ; ne pas réutiliser leurs SHA/comptages comme état actuel de la base.

### Historique des checkpoints antérieurs


### Historique — port du réemploi guidé, 08/10/2026

Décision AtoumWeb : #68 reste prototype historique non bloquant ; ne merger ni #68 ni #62. Le parcours guidé de #62 est porté seul dans la Bibliothèque Projet actuelle, avec backend/API existants, copie indépendante, adaptation/relecture humaine et création volontaire avec provenance. Export simple et fonctions récentes conservés ; code_snippet compatible. Typecheck OK, ciblés 56/56, complets 670/670, UI native 55/55 sur trois thèmes. Migrations 1–65 inchangées, intégrité/FK correctes, Validation-MSI contrôlée en lecture seule. Arrêt avant push et PR finale main ; aucun packs commercial V0.2 ou travail Bridge/8C.

### Historique — réalignement Phase 7, 07/10/2026

La reprise de PR #71 est autorisée localement : merge normal de fix/pre-phase5-commercial-ux@4ada080 dans feature/phase-7-analytics-v1@14da58b, sans push. Trois conflits de raccord résolus, Manager consolidé conservé et Phase 7 accessible dans les Statistiques. 669 tests/typecheck OK, 35 contrôles UI sur trois thèmes. Migrations 1–65 conservées ; Validation-MSI vérifiée en lecture seule, intégrité/FK correctes. Arrêt après commit de merge local pour validation.

### Checkpoint Catalogue 112 du 07/10/2026

Intégration globale terminée dans Validation-MSI de développement : 94 références 8A et 18 références 8B, 112 recettes natives réussies, 655 tests et typecheck OK, diagnostic 484/484 et 783 contre-contrôles. Migrations 1–65 et rejeu des référentiels neutre. Publications et ready explicites pour TEST, aucune validation juridique globale. Codes, temps et prix convenus conservés.

Nouveaux cycles de date à date depuis le démarrage réel, facturation distincte et calendrier historique conservé. Rapport et matrice dans outputs/recette-native-112. Parent du checkpoint : 111b919 sur feature/project-page-compositions-v1. AtoumWeb valide les résultats et autorise le commit local des 62 fichiers proposés ; aucun push/merge autorisé. Bridge et 8C hors périmètre.

Les checkpoints plus anciens ci-dessous décrivent leurs dates respectives. Ils ne constituent pas des invariants de la base de développement courante.

Checkpoint 03/10/2026 : Lot 7 techniquement validé ; commit local dédié de ses 27 fichiers autorisé sans push/merge, code identique aux 479/479 tests + typecheck OK + UI 24/24. Base Validation-MSI inchangée (ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5). Audit 7B validé : préparation séparée après clôture, copies uniquement, aucun Lot 8/Abby/Bridge/8C. Les checkpoints précédents restent historiques ; recette manuelle AtoumWeb à faire.

**Document de coordination commun. Publication de la feuille de route autorisée ; aucun lot de développement autorisé par cette publication.**

- Dépôt : `atoumweb-prog/atoumweb-manager`.
- Base historique Manager au checkpoint de clôture 8B : `feature/project-page-compositions-v1@ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81` (vérifiée localement le 03/10/2026).
- Base historique Bridge annoncée par AtoumWeb au checkpoint de clôture 8B : `feature/workbench-occurrence-v1@d1ecf89dab4f48230269a0cb10fb796f33c60bfc`, plugin **0.8.4**. Aucun travail Bridge pendant le chantier contractuel.
- Priorité à ce checkpoint historique : **Contrats Lot 7 — migration 58 appliquée sur Validation-MSI**, après autorisation AtoumWeb. HEAD local Lot 6 `5cf67f796941690449fc8661fe956c0ffd3e50d1` conservé, Lot 7 non committé. Base réelle migrations 1–58, SHA `ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5` ; plan et bindings vides, historique intact, aucune publication. Attendre validation du bilan réel avant commit local dédié. Le mapping commercial des blueprints reste à décider/versionner explicitement ; aucun Lot 8 opérationnel, Lot 8C, Abby ou Bridge.
- Checkpoint Lots 7 + 8A validé : typecheck Manager, **37/37 tests ciblés**, **346/346 tests complets**, recettes Manager/Bridge et Workbench multi-composants validées. Les lots suivants restent soumis à autorisation explicite.
- PR #74 / CGV Builder déjà intégrée : ne pas la fusionner à nouveau.
- Les choix ci-dessous sont les recommandations issues de l'audit. Les arbitrages de la section 14 doivent être confirmés avant implémentation ; un lot nécessite une autorisation explicite.
- Ce document complète le cahier des charges ; il ne remplace pas `PROJECT_STATUS.md`, qui résume l'avancement réellement vérifié.
- Code Bridge confronté à la roadmap : dépôt `atoumweb-prog/atoumweb-bridge`, branche fonctionnelle et base canonique indiquées ci-dessus. Le `main` Bridge n'est pas la baseline fonctionnelle.

### Règle de coordination demandée par Carlos

À chaque échange comportant une consigne, une décision, une correction, un résultat de validation, un blocage ou un transfert entre agents, ajouter une entrée au **journal de la section 16** dans ce même fichier.

Ne pas recopier intégralement la conversation. Consigner les faits utiles, leur origine, leur statut, les références et la prochaine action. Ne pas inscrire de secrets ni de données client inutiles. Ne pas présenter une proposition comme une décision validée ou une fonction réalisée.

Avant de travailler sur un lot Manager/Bridge, lire le présent document et ses dernières entrées. Identifier le lot autorisé, le propriétaire du travail et la base utilisée. Ne pas lancer un autre lot implicitement.

Pour chaque entrée, utiliser un identifiant unique et préciser : date, auteur/rôle, type (consigne/proposition/décision/résultat/blocage), base ou commit vérifié, résumé, validations, prochaine action et responsable si connu. Une ancienne décision corrigée reste dans l'historique ; une nouvelle entrée la remplace explicitement et la section d'architecture concernée est actualisée.

En cas de travail parallèle, conserver les entrées des autres agents. Ne jamais écraser une mise à jour distante ou forcer un push. Un agent sans accès en écriture au dépôt Manager fournit une entrée prête à intégrer à Carlos ou à l'agent responsable ; ne pas créer une feuille de route concurrente côté Bridge.

La mise à jour documentaire ne donne pas, à elle seule, une autorisation permanente de commit, push, fusion ou déploiement. Indiquer à chaque transfert si les informations sont locales ou publiées. Les échanges invisibles à un agent ne peuvent être consignés automatiquement par cet agent.

## 1. Compréhension métier

Manager organise le Projet, prépare des composants et conserve leur provenance. Divi reste l'atelier visuel principal. Une page peut commencer avec trois composants Manager puis être largement complétée dans Divi : modules natifs, structure, spacing, responsive, CSS ou JavaScript local.

La Bibliothèque reste volontaire. Un module natif ou une règle CSS observée ne devient jamais automatiquement un composant réutilisable.

Au retour, Manager doit expliquer quels composants et versions sont utilisés, ce qui a changé dans leurs occurrences, ce qui relève du contexte de page/site et ce qui pourrait être promu volontairement en Bibliothèque.

## 2. Constat sur le code actuel

### Manager — existant vérifié

| Existant | Conséquence |
| --- | --- |
| Projet créé depuis un devis accepté ; prestations et références des sources conservées | Séparation commercial/opérationnel déjà amorcée. |
| Nœuds Projet de type module et `displaySubtype=page` | Réutiliser cette identité au lieu de créer un second arbre de pages. |
| Composition ordonnée avec version Bibliothèque précise par élément | Base adaptée à une sélection de composants, pas à la totalité d'une page. |
| Composition sans lien Projet/Site/Page | Destination métier à ajouter. |
| Snapshots Manager : pages, nœuds, parents, attributs, responsive, design, classes, IDs et références de sources | Réutiliser ce socle pour observer la page réelle. |
| Sources avec scope, origine, propriétaire et références de contenu | Conserver la provenance du CSS plutôt que le fusionner dans le composant. |
| Retour d'occurrence V1, contrôle d’empreintes et décisions Famille/Variante | Conserver ces contrats ; compléter le cas multi-composants plutôt que les réécrire. |

### Bridge 0.8.0 — existant vérifié dans le code

| Existant Bridge | Conséquence |
| --- | --- |
| Import `atoumweb_bridge_project_package` schemaVersion 1 | Le transport multi-composants existe déjà ; ne pas le reconstruire. |
| Un Workbench WordPress/Divi unique par package projet | Base de préparation partielle déjà disponible. |
| Un module Code distinct par composant, ordre Manager conservé | Les composants préparés restent séparés dans Divi. |
| Une `siteOccurrenceId` créée par Bridge pour chaque composant | Conserver le principe `createdBy=bridge` des contrats V1. |
| `compositionItemId` et ordre conservés dans les metas/provenances | Point d’ancrage Manager déjà disponible pour associer l’intention d’insertion à l’occurrence Bridge. |
| Baseline HTML/CSS/JS conservée par occurrence | Base déjà présente pour calculer les différences. |
| Scanner Divi 4 parent-aware : section/row/column/module, attributs, design, responsive, classes et IDs | LOT 8B doit surtout valider/compléter la couverture, pas recréer un scanner. |
| Sources CSS/JS de page et globales, `_et_pb_custom_css`, contexte Theme Builder connu | La séparation composant/occurrence/page/site est compatible avec le scanner actuel. |
| Workbench-first et aucune publication production automatique | Principe de sécurité déjà aligné avec la roadmap. |
| `actionPolicy=manager_decides` sur Occurrence Return V1 | Promotion Bibliothèque volontaire déjà cohérente avec le besoin métier. |

### Écarts réellement constatés

- Le package projet V1 ne connaît pas `scope=page`, `projectId`, `siteId`, `pageId` ni `exportId`.
- L’empreinte du package est conservée mais l’import complet d’un package projet n’est pas encore idempotent : le même ZIP peut créer un nouveau Workbench.
- La `siteOccurrenceId` est conservée en meta Bridge, mais elle n’est pas encore portée par un marqueur stable du module Divi lui-même. Déplacement/duplication exigent donc un mécanisme d’identité plus robuste.
- `AWB_Site_Occurrence::build_return_zip()` est aujourd’hui réservé aux Workbenches `manager_library` mono-composant. Le retour individuel des occurrences d’un Workbench `manager_project` reste à implémenter.
- Les affectations Theme Builder et les presets/couleurs/polices globaux Divi restent partiellement normalisés ; une absence observée ne doit pas être assimilée à une suppression certaine.
- Les semantic keys Manager restent rapprochées à l’échelle du Projet ; `pages.home` ne distingue pas deux Sites.

Sources Manager :
- `src/main/projects/ProjectService.ts`, `src/shared/projects.ts`, `src/main/database/projectBlueprintMigrations.ts` ;
- `src/main/referentials/AtoumWebCompositionService.ts`, `AtoumWebCompositionPackageService.ts`, migration 43 ;
- `src/main/database/bridgeSnapshotMigration.ts` ;
- `src/main/referentials/AtoumWebOccurrenceReturnService.ts`, migration 39 ;
- contrats Site Occurrence / Occurrence Return V1.

Sources Bridge 0.8.0 :
- `includes/class-awb-library-importer.php` ;
- `includes/class-awb-workbench.php` ;
- `includes/class-awb-site-occurrence.php` ;
- `includes/class-awb-scanner.php` ;
- `docs/ATOUMWEB_BRIDGE_PROJECT_PACKAGE_INTAKE_V0_1.md`.

## 3. Architecture recommandée

```text
Devis accepté — référence commerciale figée
└── Projet — organisation opérationnelle
    └── Site — destination logique
        └── Page — identité et suivi opérationnels
            ├── Composition facultative de composants AtoumWeb
            ├── Occurrences suivies individuellement
            └── États observés de la page réelle via Bridge
```

La composition est toujours potentiellement partielle. Une page peut n'avoir aucun composant Manager. Aucun champ `mode=hybrid` n'est nécessaire.

Libellé conseillé : **Composants préparés pour cette page**. Le terme technique Composition peut rester dans le code ; éviter « Composer un site » pour cette opération.

## 4. Modèle de données recommandé

Les noms ci-dessous sont des propositions, pas une instruction de créer immédiatement toutes les tables.

| Objet | Responsabilité |
| --- | --- |
| `projects` | Client, devis source, organisation et suivi existants. |
| `project_sites` | Identifiant stable, projet, nom opérationnel, archivage ; domaine souhaité facultatif, jamais une identité. |
| `project_nodes` | Identité et nom opérationnels de la page, description, statut de travail, tâches, ordre dans le Projet. |
| `project_site_pages` | Extension avec `project_node_id` comme clé primaire, lien Site, rôle éventuel et chemin souhaité facultatif. |
| Composition existante | Lien facultatif vers la Page et sélection ordonnée des composants. |
| Occurrences suivies | Association durable Page + `compositionItemId` + version Bibliothèque source + `siteOccurrenceId` créée par Bridge. Un identifiant d’occurrence supplémentaire côté Manager n’est ajouté que s’il répond à un besoin démontré. |
| Liaisons Bridge | Association explicite avec installation WordPress, page externe et Workbench. |
| Exports/retours | Échanges immuables, identifiants, empreintes, bases de comparaison et résultats d'application. |
| Snapshots existants | État observé, structure et sources ; aucune Bibliothèque parallèle. |

`pageId` reste l'identifiant du nœud Projet. L'extension ne copie pas titre/statut. Le titre WordPress observé et le nom opérationnel peuvent différer et restent distingués.

Pour commencer : une composition active par Page, des exports successifs figés. Les compositions historiques restent non rattachées jusqu'à une action explicite. Le Site et le Projet se déduisent du rattachement Page plutôt que d'être recopiés comme vérités éditables dans la composition.

Contrôler les liens inter-projets/inter-sites, le subtype page et l'archivage. Un nœud déjà lié à une Page ne peut être retypé ou déplacé vers un autre projet en invalidant silencieusement ses références. Archiver conserve exports et provenance.

## 5. Responsabilités Manager / Bridge / Divi

| Manager | Bridge | Divi |
| --- | --- | --- |
| Organise Projet/Site/Page | Vérifie destination et compatibilité | Construit la page réelle |
| Gère Bibliothèque et versions | Prépare le Workbench | Gère structure, rendu et responsive |
| Prépare certains composants | Associe occurrences et éléments réels | Permet ajouts et modifications libres |
| Conserve historique et décisions | Observe composants, modules natifs et contexte | Reste l'atelier visuel |
| Décide de la promotion | Rapporte les changements et ambiguïtés | Ne dépend pas d'une composition exhaustive |

Ajouter un composant ne doit pas nécessiter l'envoi d'une reconstruction complète de la page.

## 6. Composants, occurrences et contenu natif

| Niveau | Données |
| --- | --- |
| Composant Bibliothèque | Identité métier, famille, rôle, variantes. |
| Version | HTML/CSS/JS, assets, champs, configuration par défaut et design interne de référence. |
| Occurrence | Version source, valeurs locales, assets choisis, adaptations locales et identité durable. |
| Placement | Parent/conteneur Divi, ordre réel, contraintes de largeur et espacement extérieur. |
| Page | Structure complète, modules natifs, CSS spécifique, réglages et contexte de rendu. |

Distinctions d'identité :

- `compositionItemId` : intention d'insertion préparée et stable côté Manager ;
- `siteOccurrenceId` V1 : identité de l’instance réellement créée par Bridge, conformément à `createdBy=bridge` ;
- identifiant de nœud Snapshot : observation technique, potentiellement variable ;
- un éventuel `managerOccurrenceId` supplémentaire est **non décidé** et ne doit pas être créé tant que `compositionItemId + siteOccurrenceId` suffit.

Le package sortant conserve `compositionItemId`. Bridge crée ensuite `siteOccurrenceId` et doit renvoyer/persister l’association entre les deux. Le module Divi doit disposer d’un marqueur technique stable permettant de retrouver cette `siteOccurrenceId` après déplacement. Une duplication doit produire une nouvelle occurrence ou être signalée comme ambiguë ; deux modules ne doivent jamais être acceptés silencieusement avec le même marqueur.

Les modules natifs restent dans les données Snapshot/Page state existantes, avec références brutes et métadonnées utiles. Ne pas les recopier comme entités éditables d'un second builder. Un état courant affiché est une projection des observations conservées, pas une autre source du contenu.

Promotion d'un élément natif : sélection volontaire → candidat → préparation/nettoyage → validation Bibliothèque. Ne pas inventer une origine Bibliothèque pour le faire entrer dans Occurrence Return V1.

## 7. CSS et spacing

La frontière dépend de la cible et de la responsabilité de la règle, pas de son nom seul.

| Exemple | Propriétaire |
| --- | --- |
| Padding interne 80 px du Hero de référence | Version Bibliothèque |
| Padding interne ramené à 40 px uniquement ici | Adaptation d'occurrence |
| Margin-bottom 30 px après ce Hero | Placement local |
| Padding de Section contenant plusieurs composants | Structure de Page |
| Largeur de Row, réglage de Colonne | Conteneur de Page |
| Responsive interne livré avec le Hero | Version Bibliothèque |
| Responsive local du conteneur | Placement/Page |
| Classe intrinsèque du composant | Version Bibliothèque |
| Classe ajoutée localement | Occurrence/Page selon la cible |
| CSS global influençant le Hero | Dépendance de Site observée |

Le `margin-bottom=30px` local ne crée aucune nouvelle version générale du Hero.

Manager conserve la version immuable, les adaptations identifiées et les liens vers les sources observées. Bridge/Snapshot conserve le contexte natif et les preuves. Distinguer lieu de stockage et effet d'une règle : du CSS Page peut cibler un seul Hero ; une classe globale peut affecter plusieurs composants.

Si l'attribution est incertaine, conserver « règle de Page affectant cette occurrence ». Ne pas extraire automatiquement ce CSS dans le composant. Même vigilance pour le JavaScript et ses dépendances.

Utiliser un conteneur technique de placement minimal et identifié si nécessaire ; éviter d'empiler des wrappers avec paddings implicites. Les IDs HTML ne sont pas des identités métier ; contrôler leurs collisions et les références CSS/JS associées.

## 8. Round-trip et package

### État réel Bridge 0.8.0 à conserver

Le flux multi-composants existe déjà :

```text
Composition Manager
→ atoumweb_bridge_project_package V1
→ Bridge
→ un Workbench Divi
→ un module Code par composant
→ une siteOccurrenceId Bridge par composant
```

Ce flux est **Workbench-first**, ne publie pas en production et conserve la version Bibliothèque source, la provenance, `compositionItemId`, l’ordre et les baselines HTML/CSS/JS.

Limites actuelles à ne pas masquer :

- le package V1 représente une composition, pas explicitement une Page ;
- réimporter le même package complet n’est pas encore idempotent ;
- la `siteOccurrenceId` n’est pas encore un marqueur stable directement exploitable dans le module Divi ;
- le retour multi-composants `manager_project` n’existe pas encore ;
- le scanner observe déjà largement la Page réelle mais sa couverture Theme Builder/presets reste partielle.

Une Page sans composant Manager est valide et n’a aucun package de composition à envoyer.

### Cible du round-trip

1. Manager prépare éventuellement quelques composants pour une Page avec versions sources précises.
2. Il produit un export immuable identifié par `exportId`, avec destination Projet/Site/Page et `compositionItemId`.
3. Bridge vérifie version, destination et import antérieur, puis crée ou reconnaît le Workbench correspondant sans doublon silencieux.
4. Pour chaque composant, Bridge crée `siteOccurrenceId`, l’associe à `compositionItemId` et inscrit un marqueur technique stable dans/avec le module Divi.
5. L'utilisateur travaille librement dans Divi : déplacement, spacing, modules natifs, CSS Page, etc.
6. Bridge observe occurrences et contexte Page en déclarant la couverture du scan.
7. Le retour multi-composants référence l’export de base, la Page et chaque `siteOccurrenceId`.
8. Manager compare base exportée, préparation actuelle et état retourné, puis laisse l’utilisateur conserver localement ou préparer volontairement une promotion.

### Enveloppe Page versionnée proposée

Faire évoluer `atoumweb_bridge_project_package` par **schemaVersion 2 ou contrat additionnel explicitement versionné**, sans modifier silencieusement V1. Les contrats Component/Fields/Identity/Site Occurrence/Return V1 et Snapshot V1 restent lisibles.

| Groupe | Champs conceptuels |
| --- | --- |
| Destination | `scope=page`, `projectId`, `siteId`, `pageId` |
| Préparation | `compositionId`, révision/empreinte |
| Échange | `exportId`, empreinte du manifeste, versions de contrat |
| Composants sortants | `compositionItemId`, source Bibliothèque/version, configuration, ordre initial |
| Placement prévu | Conteneur attendu ou politique de placement, sans prétendre décrire toute la Page |
| Provenance | Origines Bibliothèque séparées de la destination Projet |
| Accusé Bridge | `exportId`, Workbench, `compositionItemId ↔ siteOccurrenceId`, marqueur/nœud externe si disponible |

Le package Manager **ne fournit pas `siteOccurrenceId`** : V1 établit que Bridge la crée. `scope=page` décrit la destination et non une autorisation à remplacer toute la Page.

Préférer un seul identifiant logique `exportId` pour l’export/package, distinct de l’empreinte SHA-256 du contenu.

### Retour cible

- `returnId`, `exportId` de base et révision observée ;
- Projet/Site/Page/Workbench ;
- `compositionItemId`, `siteOccurrenceId` et correspondance au module/nœud observé ;
- configuration actuelle, changements de contenu et de placement, dépendances ;
- références Snapshot/fichiers et empreintes ;
- couverture du scan, éléments non résolus et suppressions seulement si elles sont confirmées.

Idempotence : même ID/même contenu = pas de doublon ; même ID/contenu différent = rejet ; retour ancien = historique conservé sans remplacer l'état récent.

Comparer trois états : base exportée, préparation Manager actuelle, état Divi retourné. Détecter les conflits avant application. Aucun moteur général de fusion HTML/CSS ; conserver une importation atomique ou compensée.

## 9. Multi-site, blueprints et éléments globaux

Un Site opérationnel est une cible logique. Son URL peut changer. Ses installations staging/production sont distinctes et reliées explicitement. Le Workbench et la Page finale restent distincts : un Workbench prêt ne prouve pas la mise à jour de la Page finale.

Blueprint : déclarer Sites/Pages par des rôles explicites, générer une identité durable au premier passage, conserver site et version du blueprint d'origine, rendre la répétition idempotente. Préserver ensuite renommages, ajouts et suppressions manuels ; un devis « cinq pages » n'interdit pas une sixième page opérationnelle.

Une clé effective `site:<id-stable>:pages.home` permet de distinguer deux Accueil sans dépendre du domaine. Le blueprint initialise le Projet ; il ne synchronise pas rétroactivement le devis. L'ordre du Projet n'est pas automatiquement l'ordre des menus WordPress.

Header/Footer/Theme Builder : réserver un type futur de cible template distinct de Page. Une occurrence globale appartient au template ; elle n'est pas copiée comme une occurrence indépendante sur chaque Page qui l'affiche. Observer les relations d'application, presets et dépendances globales. Reporter leur édition/déploiement à un lot dédié si nécessaire.

### Publication contrôlée vers une Page WordPress finale

La publication future reste une responsabilité Bridge et une action humaine explicite. Le parcours cible est :

```text
Workbench validé
→ sélection explicite de la Page WordPress cible
→ snapshot avant
→ injection atomique ou compensée du contenu Divi
→ installation des CSS/JS gérés dans Divi Child
→ contrôle front
→ snapshot après
→ enregistrement de la provenance
→ rollback complet disponible
```

La destination est résolue à partir des identités stables `projectId`, `siteId` et `pageId` transportées par le package Page. Le nom du Workbench, le titre WordPress, le slug ou l'URL peuvent aider l'utilisateur à reconnaître la cible, mais ne constituent jamais une preuve d'identité. Workbench et Page finale restent deux objets distincts. Aucun Workbench validé ne déclenche une écriture Production automatique.

### Cycle de vie CSS/JavaScript géré par Bridge

Le placement cible reste : HTML dans Divi ; CSS/JS dans le Divi Child AtoumWeb sous `assets/atoumweb/css|js/components|pages|global`. Avant toute publication Production, Bridge doit tenir un registre des assets qu'il gère avec :

- un identifiant technique stable indépendant du nom de fichier affiché ;
- un scope et un propriétaire explicites : `component`, `page` ou `global` ;
- la provenance Manager/Bridge, la version et l'empreinte du contenu ;
- les occurrences/Pages utilisatrices ou un comptage traçable de leurs références ;
- un historique de révisions permettant de restaurer l'ensemble HTML/CSS/JS cohérent.

Un remplacement ou retrait décrémente les références. Un asset encore référencé reste installé. À zéro utilisation, il devient `orphaned` et seulement éligible à un nettoyage explicite : prévisualisation de l'impact, contrôle de l'empreinte et confirmation humaine. Un fichier modifié manuellement, inconnu du registre ou déclaré comme override humain n'est jamais écrasé ni supprimé implicitement. Bridge distingue donc strictement les assets `managed` des fichiers/overrides non gérés.

Le remplacement d'une version se prépare et se teste d'abord dans un Workbench. La publication installe le nouvel ensemble puis retire seulement les références à l'ancien. Le rollback restaure le contenu Divi **et** la révision correspondante de tous les CSS/JS gérés ; restaurer uniquement le HTML est insuffisant.

## 10. Risques

- Marqueur absent/dupliqué : position et ressemblance sont des indices, jamais une preuve suffisante d'identité.
- Scan partiel : une absence ne confirme pas une suppression.
- Rendu contextuel : même HTML ne signifie pas même rendu sous un thème, preset ou CSS global différent.
- Réexport : ne jamais écraser silencieusement les modules natifs ou le travail humain.
- Retour obsolète/concurrent : conserver l'histoire sans régresser l'état courant.
- Promotion : éviter d'embarquer structure/CSS de Page dans une Variante.
- Clone WordPress : ne pas identifier une installation par URL ou identifiant copié sans contrôle.
- Scanner : vérifier la couverture sur des fixtures Divi réelles, notamment réglages, duplication et suppression.
- UX : noms, extraits, contexte et différences visibles ; UUID et scores ne justifient pas une validation humaine.

## 11. Hors périmètre à préserver

- Aucun clone du Divi Builder dans Manager.
- Aucun import automatique de tous les modules dans la Bibliothèque.
- Aucun second arbre Page concurrent de Projet V2.
- Aucun moteur général de fusion automatique CSS.
- Aucune propagation automatique des versions Bibliothèque aux Pages.
- Aucune publication directe Manager → WordPress.
- Aucun framework générique prématuré pour templates/environnements.
- Aucun lot de code, migration, fusion de branche ou publication production autorisé par ce document.

## 12. Ordre proposé

Le préalable de lecture du vrai Bridge est **réalisé**. Le package Page V2 et l'idempotence sont validés dans le checkpoint 8A. La corrélation durable avec le nœud Divi réel reste à valider/compléter dans 8B.

Ordre recommandé :

```text
6A Projet/Site/Page
→ 6B Composition partielle
→ 7 Squelette blueprint
→ décision contrat Page + marqueur occurrence
→ 8A Export Page / idempotence / association Bridge
→ 8B Validation et compléments de l’observation hybride existante
→ 8C Retour multi-composants et décisions
→ 9 Préparation multi-pages
→ 10 Registre et cycle de vie des assets Divi Child
→ 11 Publication contrôlée Workbench → Page finale
→ checkpoint final
```

Le checkpoint canonique couvre désormais 6A, 6B, 7 et 8A. Le prochain lot de code recommandé est 8B. Les Lots 10 et 11 restent futurs : le registre d'assets doit être validé avant toute première écriture contrôlée vers une Page finale.

Tous les lots restent **non autorisés** tant que Carlos ne donne pas son accord explicite.

## 13. Lots détaillés

### Préalable — Contrat partagé Manager/Bridge — réalisé

- État : checkpoint Manager/Bridge 8A validé sur les bases canoniques de la section 0.
- Confirmé : package Page V2, `exportId`, destination Projet/Site/Page, Workbench unique multi-composants, `siteOccurrenceId` par composant, idempotence et Workbench-first.
- Restant pour 8B : valider/compléter le marqueur technique permettant de retrouver `siteOccurrenceId` dans le nœud Divi réel après déplacement/duplication.
- Migrations : aucune.
- Validation restante : déplacement, duplication et observation du marqueur sur fixtures Divi réelles ; le retour multi-composants relève de 8C.
- Dépendance : aucun blocage contractuel pour démarrer 8B après autorisation.

### LOT 6A — Projet/Site/Page

- Objectif : destinations opérationnelles durables, création manuelle et archivage.
- Changements : `project_sites`, extension Page et contrôles de cohérence.
- Migrations : nouvelles tables additives, aucun renommage de migration historique.
- Périmètre : `ProjectService`, types Projet, `ProjectsPage`, migrations ciblées.
- Tests/acceptation : deux Sites avec chacun Accueil ; renommage sans changement d'identité ; liens incohérents refusés ; anciens Projets préservés ; archivage conservant l'histoire.
- Dépendance : fournit les destinations à 6B/7.

### LOT 6B — Composition partielle

- Objectif : préparer certains composants d'une Page, sans prétendre décrire toute la Page.
- Changements : lien Page facultatif pour l'existant, libellés explicites, une composition active par Page.
- Migrations : lien Page et contrainte d'unicité adaptée à l'archivage.
- Périmètre : `AtoumWebCompositionService`, types, interface Bibliothèque/compositions.
- Tests/acceptation : Page sans composant valide ; deux utilisations distinctes d'une même source ; rattachement manuel des anciennes compositions ; aucune inférence par nom.
- Dépendance : fournit les préparations à 8A.

### LOT 7 — Squelette blueprint

- Objectif : générer Sites/Pages sans figer le travail opérationnel.
- Changements : rôles explicites, génération par Site, provenance du blueprint et idempotence.
- Migrations : métadonnées/table de génération seulement si nécessaires après choix du modèle.
- Périmètre : `ProjectService`, blueprints, types et tests Projet.
- Tests/acceptation : réexécution sans doublons ; deux Sites ; changements manuels préservés ; devis intact ; Page ajoutée manuellement possible.
- Dépendance : utilise 6A ; non bloquant pour essayer le transport sur une Page manuelle.

### LOT 8A — Export Page, idempotence et association Bridge

- État : réalisé et validé dans le checkpoint canonique du 30/09/2026.
- Objectif : compléter l’import multi-composants existant pour qu’il représente explicitement une préparation partielle de Page et soit réimportable sans doublon silencieux.
- À conserver : `atoumweb_bridge_project_package` V1, Workbench unique, modules Code séparés, création Bridge des `siteOccurrenceId`, baselines et provenance.
- Changements réalisés : enveloppe Page V2 ; `exportId` ; `projectId/siteId/pageId` ; contrôle d’import antérieur ; association `compositionItemId ↔ siteOccurrenceId`. La validation/corrélation du marqueur dans le nœud Divi réel relève de 8B.
- À ne pas ajouter sans besoin démontré : un second identifiant d’occurrence Manager faisant doublon avec `compositionItemId + siteOccurrenceId`.
- Migrations Manager : exports/liaisons uniquement si nécessaires ; préserver compositions et retours historiques.
- Périmètre : `AtoumWebCompositionPackageService`, validations partagées, `AWB_Library_Importer`, `AWB_Workbench`, `AWB_Site_Occurrence`.
- Tests/acceptation : même export réimporté sans nouveau Workbench ; même `exportId` avec contenu différent refusé ; mauvaise destination/version refusée ; source exacte conservée ; déplacement conserve l’identité ; duplication ne crée pas deux modules avec la même identité silencieusement.
- Dépendance : 6B + décisions contractuelles du préalable.

### LOT 8B — Validation et compléments de l'observation hybride

- Objectif : exploiter le scanner existant pour comprendre occurrences, modules natifs, placement et contexte, sans transformer Manager en builder.
- À conserver : parsing Divi 4 section/row/column/module, attributs complets, design/responsive, classes/IDs, CSS/JS Page/global, metas utiles, contexte Theme Builder déjà collecté.
- Changements : fixtures et couverture explicite ; corrélation avec le marqueur `siteOccurrenceId` ; uniquement les métadonnées réellement manquantes.
- Migrations : réutiliser Snapshots ; ajouter seulement les liens/révisions nécessaires, sans modifier Snapshot V1.
- Périmètre : `BridgeSnapshotService`, `AWB_Scanner`, liaisons d’occurrence.
- Tests/acceptation : Texte/Image/Code natifs ajoutés, Hero déplacé, marge/padding local, CSS Page, duplication, suppression, scan partiel ; aucune mutation Bibliothèque ; absence non traitée comme suppression certaine.
- Couverture à signaler : Theme Builder/presets/couleurs/polices globales restent partiellement normalisés tant que des fixtures ne prouvent pas mieux.
- Dépendance : 8A.

### LOT 8C — Retour multi-composants et décisions

- Objectif : ajouter le retour qui manque réellement pour les Workbenches `manager_project`, occurrence par occurrence, puis conserver les décisions utilisateur.
- À conserver : Occurrence Return V1 mono-composant existant et `actionPolicy=manager_decides`.
- Changements : retour lié à `exportId/pageId` ; plusieurs `siteOccurrenceId` ; historique de révisions ; détection retour répété/ancien/concurrent ; changements de placement séparés des changements intrinsèques ; entrée volontaire pour candidat natif.
- Migrations : liens/historique d’application si nécessaires, sans effacer les retours V1.
- Périmètre : `AtoumWebOccurrenceReturnService`, `AWB_Site_Occurrence`, Familles/Variantes et interface de revue.
- Tests/acceptation : retour multi-composants réel ; même retour sans doublon ; retour ancien conservé sans régression ; source Bibliothèque intacte ; spacing local exclu par défaut d’une promotion ; élément natif jamais promu automatiquement.
- Dépendance : 8B et les fonctions Bibliothèque existantes.

### LOT 9 — Préparation multi-pages

- Objectif : suivre plusieurs Pages et préparer la livraison via Bridge.
- Changements : progression, liaisons Pages réelles, dépendances globales, distinction Workbench/Page finale.
- Migrations : réutiliser le modèle ; liens de templates seulement si un périmètre explicite les nécessite.
- Périmètre : services Projet/Bridge et écran de suivi ; pas de publication directe.
- Tests/acceptation : destinations distinctes, dépendances globales visibles, absence de faux état publié, navigation compréhensible.
- Dépendance : parcours unitaire 8C validé avant généralisation multi-pages.

### LOT 10 — Registre et cycle de vie des assets Divi Child

- Objectif : préparer la future publication sans accumuler de CSS/JS orphelin et sans toucher aux fichiers humains.
- Changements : registre Bridge des assets `managed`, identité stable, scope/propriétaire, provenance/version/hash, références d'utilisation, révisions, états actif/orphelin et opération explicite de nettoyage sûre.
- Stockage cible : `assets/atoumweb/css|js/components|pages|global`, sans revendiquer les fichiers inconnus ou overrides humains.
- Règles : remplacement atomique ou compensé ; décrément des références ; aucune suppression à zéro référence sans contrôle d'empreinte, aperçu d'impact et confirmation ; conflit manuel signalé sans écrasement.
- Tests/acceptation : asset partagé conservé tant qu'une Page l'utilise ; retrait final marqué orphelin ; nettoyage explicite ; fichier modifié manuellement protégé ; rollback restaurant la révision CSS/JS complète.
- Dépendance : 8B pour l'observation fiable des usages et 9 pour les dépendances multi-pages. Prérequis du Lot 11.

### LOT 11 — Publication contrôlée Workbench → Page WordPress finale

- Objectif : appliquer volontairement un Workbench validé sur une Page WordPress cible, avec preuve, contrôle front et rollback complet.
- Parcours : destination stable Projet/Site/Page → snapshot avant → injection Divi → déploiement des assets gérés par le Lot 10 → contrôle front → snapshot après → provenance → rollback.
- Sécurité : sélection et validation humaines obligatoires ; aucune déduction depuis un nom/slug ; aucune publication automatique ; aucune confusion entre Workbench et Page finale.
- Atomicité : en cas d'échec du contenu Divi, des assets ou du contrôle, restaurer l'état précédent ou conserver un état explicitement incomplet et réparable, jamais un succès silencieux.
- Tests/acceptation : bonne destination malgré renommage ; mauvaise identité refusée ; snapshot avant/après ; CSS/JS cohérents avec le HTML ; rollback du triplet HTML/CSS/JS ; répétition contrôlée sans duplication ; production intacte avant confirmation.
- Dépendance : Lots 8C, 9 et 10 validés.

### Checkpoint final

- Objectif : vérifier la chaîne complète et préparer l'intégration finale.
- Changements/migrations : aucun prévu hors correction explicitement cadrée.
- Validation : typecheck, tests ciblés, suite complète, packaging, recette humaine et régressions.
- Dépendance : lots retenus terminés. Fusion PR #73/main uniquement sur instruction explicite.

Réversibilité : nouvelles relations facultatives pour l'historique, formats anciens lisibles, échanges immuables, aucun rattachement massif déduit. Numérotation des migrations à attribuer lors de l'implémentation ; ne pas réécrire 40–46.

## 14. Arbitrages et statut après confrontation Bridge

Les statuts ci-dessous distinguent **validation métier**, **compatibilité technique** et **décision encore requise**.

1. **Page = nœud Projet + extension** — compatible techniquement avec Bridge ; à confirmer avant 6A.
2. **Composition facultative et partielle** — validée comme besoin métier : Divi reste l’atelier principal ; une Page peut avoir zéro composant Manager.
3. **Site logique Manager distinct de l’installation Bridge ; Workbench distinct de la Page finale** — compatible avec le code actuel et recommandé.
4. **Identité d’occurrence** — le couple `compositionItemId` puis `siteOccurrenceId` est validé sans second identifiant Manager. Le marqueur/corrélateur dans le nœud Divi réel et la règle de duplication relèvent de 8B.
5. **Enveloppe Page versionnée** — `atoumweb_bridge_project_package` schemaVersion 2 avec `scope=page`, `exportId` et destination Projet/Site/Page est validé par 8A.
6. **Conservation locale par défaut, promotion Bibliothèque volontaire** — validée métier et alignée avec `actionPolicy=manager_decides`.
7. **Idempotence** — validée en 8A : même ZIP rouvert sans doublon ; même `exportId` avec contenu différent refusé.
8. **Scanner hybride** — existe déjà largement. 8B est un lot de validation/corrélation/complément, pas un nouveau scanner.
9. **Retour multi-composants** — explicitement absent aujourd’hui pour `manager_project`; relève de 8C et ne doit pas être supposé acquis.
10. **Assets Divi Child** — registre Bridge dédié en Lot 10, avec références, historique, protection des overrides humains et nettoyage explicite uniquement.
11. **Publication Production** — couche Bridge dédiée en Lot 11, après le multi-pages et le cycle de vie des assets ; action humaine, destination par identités stables et rollback HTML/CSS/JS.

## 15. Recommandation d'exécution

Le checkpoint 7 + 8A est la base canonique. Continuer par 8B pour fiabiliser l'observation et la corrélation réelles, puis 8C pour le retour multi-composants et 9 pour la préparation multi-pages. Construire ensuite le registre d'assets du Lot 10 avant d'autoriser le parcours de publication contrôlée du Lot 11.

Recette de référence : trois composants Manager, ajouts natifs Divi, déplacement, spacing local, CSS Page, retour correctement attribué, répétition du retour sans doublon et absence de mutation Bibliothèque. Carlos réalise la navigation/recette visuelle ; les agents analysent le code et exécutent les contrôles ciblés autorisés.

Critère métier : terminer librement une Page dans Divi, puis comprendre dans Manager ce qui a changé, où et pourquoi, sans reconstruire la Page ni interpréter des UUID.

## 16. Journal partagé des consignes, décisions et validations

### 31/10/2026 — CONTRATS-CONVERGENCE-118-01 — audit et préparation locale

- Origine : reprise Codex demandée sur PR #159 brouillon, dépendante de #158 ; aucun chantier Bridge autorisé. Base auditée `c7f73f2c`, branche isolée `codex/contract-convergence-audit-20261031`.
- Résultat : 118 propositions reliées exactement aux 118 versions publiées exportées ; IDs, corps, SHA-256, scopes, audiences et 28 dépendances conformes ; aucun indicateur d’approbation, publication ou adoption. Audit JSON/Markdown et commande reproductible ajoutés.
- Provenance commerciale corrigée : les références mensuelles 49/99 € et annuelles facultatives 539/1 089 € ont été introduites ensemble le 03/10/2026 (`1ed1152c`). Deux blocages restent : hébergement 99 € face à 149 € avec Lune, migration interne gratuite non séparée de l’externe sur devis. Aucun tarif modifié arbitrairement.
- Préparation locale : migration 76 additive, titres de clauses désormais versionnés, import éditorial atomique simulable et idempotent. Sur base mémoire, 118 brouillons créés, 118 publiées conservées, snapshots/devis non touchés, rollback et dérives refusés. Typecheck OK et suite complète 1 741/1 741 verte (206 fichiers).
- Brouillons Catalogue préparés hors base utilisateur : six versions contrôlées (WP/Woo mensuelles et annuelles, hébergement 149 €, migration externe sur devis), prix maintenance inchangés, origines publiées vérifiées, rejeu neutre et plan périmé refusé. Tests ciblés 3/3 et typecheck verts.
- Statut : aucune base utilisateur modifiée, aucun brouillon Catalogue ou contractuel appliqué hors fixtures, aucune publication, PDF, campagne, exécutable, fusion ou action Bridge. Branche et PR brouillon de revue uniquement. Prochaine action : raccord contrôlé des simulations dans le Manager, puis validations d’assemblage/PDF après convergence. Responsable : agent Manager courant.

### 08/10/2026 — CONTRATS-APERCUS-SOCLES — retour UX et réalisation

- AtoumWeb demande la consultation du contrat de base pour tous les socles, pas seulement Vitrine : CGV communes + prestation de base, modules complémentaires selon les éléments réellement vendus.
- Aperçu générique pour les 13 types dans la Bibliothèque contractuelle, par référence Catalogue et audience, réutilisant le résolveur Devis et la restitution commune. Aucun Devis fictif persisté ou publication ; options disponibles exclues. Les textes courants consultés ne remplacent aucun snapshot accepté.
- Typecheck OK, ciblés 32/32, complets 687/687, UI trois thèmes 106/106. Bases temporaires seulement ; Validation-MSI garde 13 types/112 rattachements, schéma 1–66, zéro dossier. Aucun travail Bridge/8C ni commit/push/merge.
- Prochaine action : lecture des contrats types par AtoumWeb depuis le vrai Manager, après rechargement normal des API Electron ; pas de recette globale.



### 08/10/2026 — CONTRATS-TYPES-66-APPLICATION — validation et réalisation

- AtoumWeb valide les 13 types et les 112 rattachements avec seul renommage « Maintenance WordPress & WooCommerce », sans autre classification/composition ; interdit une nouvelle sauvegarde et demande le démarrage normal sans recette globale.
- 15/15 tests ciblés, migration 66 appliquée sous verrou sur Validation-MSI ; 13 types/versions draft et 112 rattachements, zéro publication et zéro dossier créé. Comparaison avec la préparation : seuls le libellé validé et les nouveaux IDs/dates réels diffèrent ; 118 clauses/409 liens et anciennes références conservés.
- Intégrité ok/FK vide, rejeu neutre. Sauvegarde existante conservée/réutilisée, aucun fichier de sauvegarde ajouté. Démarrage normal autorisé ; aucune nouvelle recette ni travail Bridge/8C. Pas de nouveau commit/push/merge.
- Prochaine action/responsable : AtoumWeb réalise sa recette manuelle depuis les vues Devis et Bibliothèque contractuelle. L’ancienne consigne de ne pas démarrer avant application de 66 est levée par cette autorisation.



### 08/10/2026 — CONTRATS-TYPES-66 — autorisation et préparation locale

- Origine : AtoumWeb valide les quatre structures de types versionnés et demande la reprise des quatre fichiers locaux après interruption, sans réécriture du travail correct. Rattachement aux versions Catalogue, pas au seul article ; aucune conversion de legacy « test ».
- Base : main@8e05a47296d478587b11841e36ca5acb2e936726. Migration 66 additive préparée/testée uniquement hors Validation-MSI ; 118 clauses et 409 liens, modèles, blueprints et anciennes données conservés sur copie. Les prestations vendues continuent seules à déclencher leurs modules, avec déduplication/orphelines et snapshot inchangé.
- Réalisation locale : Bibliothèque contractuelle depuis Documents, navigation Catalogue, types/modules administrables et versionnés, lecture Devis et copies/PDF à partir d’une présentation commune. Aucune deuxième bibliothèque de textes, pas de contrat séparé du Devis. Initialisation depuis les familles réelles, 13 types draft et 112 rattachements préparés sur copie ; rejeu neutre.
- Contrôles : typecheck OK, ciblés 85/85, complets 684/684, UI ciblée 106/106 sur trois thèmes, banc Builder 21/21. Capture PDF limitée au vrai endpoint système, intercepté à la frontière OS pendant le harness ; aucun lecteur externe lancé sur des fichiers utilisateur.
- Statut/limite : Validation-MSI en 1–65, zéro dossier et SHA inchangé ; Manager fermé. Registre local contenant 66 : ne pas lancer Manager sur cette base tant que l’application n’a pas été validée séparément. Aucun commit/push/merge, aucune déclaration de conformité juridique ni travail Bridge/8C.
- Prochaine action/responsable : bilan à AtoumWeb et validation avant migration réelle ; aucun test permanent ajouté à Validation-MSI.



### 08/10/2026 — Synchronisation documentaire avant PR finale main

- Instruction : documentation seule, commit séparé, aucun code fonctionnel ni push. Port de réemploi validé au commit 8662c3f ; branche active fix/pre-phase5-commercial-ux.
- État courant harmonisé en tête du README, du HANDOFF MSI, de PROJECT_STATUS et de cette roadmap : Phase 7 et Manager consolidé intégrés, schéma 1–65, typecheck OK, 56/56 ciblés, 670/670 complets, UI 55/55, intégrité/FK correctes. AGENTS vérifié cohérent et laissé inchangé.
- Réemploi guidé porté sélectivement ; ne pas merger #62. #68 prototype commercial V0.2 conservé hors périmètre et non bloquant. Abby manuel, aucune validation juridique globale, séparation des futurs travaux Bridge WordPress/8C maintenue.
- Historique conservé avec étiquettes explicites ; anciennes branches/checkpoints ne sont plus des instructions de reprise. Prochaine étape : accord de push puis PR finale fix/pre-phase5-commercial-ux vers main ; aucun push/PR/merge réalisé ici.


### 08/10/2026 — Port sélectif de la réutilisation guidée, sans merge #62/#68

- Autorisation : UI seule depuis la référence #62, backend et schéma consolidés conservés. Prototype #68 explicitement maintenu hors de la consolidation.
- Réalisation : panneau guidé dans l’écran actuel, sélection d’une version, copie indépendante, édition humaine, catégorie code_snippet et création globale explicite/provenance. Export simple conservé ; aucune création ou modification automatique du Projet.
- Contrôles : typecheck OK, 56/56 ciblés, 670/670 complets et 55/55 UI sur trois thèmes. Schéma 1–65 et intégrité/FK validés ; base de développement en lecture seule, tests sur fixtures temporaires. Pas de nouvelle migration ou reprise de backend.
- Suite : commit local dédié au port et bilan ; attendre validation avant push ou PR main. Aucune fusion des anciennes branches, aucun Bridge/8C et aucun code .atoum V0.2.


### 07/10/2026 — Réalignement local PR #71

- Instruction : partir de Phase 7, intégrer le nouveau HEAD cible par merge normal, préserver les fonctionnalités récentes, vérifier, puis s’arrêter avant push. Aucun rebase ou merge GitHub autorisé.
- Réalisation : conflits ipc/preload/App résolus par conservation des raccords des deux branches. Les écrans récents restent accessibles ; ajout de l’analyse Phase 7 dans un onglet dédié, styles isolés. Sources facturation/dépenses et estimation opérationnelle adaptées sans modifier les règles commerciales, les quotas ou les durées de référence.
- Validation technique : 669/669 tests, typecheck OK, 35/35 contrôles UI sur trois thèmes. Migrations inchangées 1–65, intégrité/FK vérifiées sur fixture et sur Validation-MSI en lecture seule. Aucune activation, nouvelle migration, modification de Validation-MSI ou travail Bridge/8C.
- Suite : commit de merge local, bilan des conflits et état Git. Attendre la validation AtoumWeb avant push de Phase 7 ou fusion de PR #71.


### 07/10/2026 — Validation AtoumWeb et commit local autorisé

- AtoumWeb valide 112/112 références (94 en 8A, 18 en 8B), 655/655 tests, typecheck, migrations 63–65, intégrité/FK et rejeu neutre. Autorisation du commit « Catalogue 112 — parcours Devis, contrat et opérations », avec les 62 fichiers prévus uniquement. Aucun push ni merge.
- Confirmation : quotas inutilisés perdus en fin de cycle, sans report ; remise à disposition du seul quota du nouveau cycle. Références de temps internes indicatives et recalibrables au dossier, dont Histoire, sans durée contractuelle figée. Aucun changement de code requis par ces confirmations.
- Limites conservées : TEST uniquement, aucune validation juridique globale, Abby manuel, aucun paiement/facturation réel et aucun Bridge/8C. Restituer le hash, l’état Git et le périmètre exact ; ne pas démarrer de nouvel exercice.

### 07/10/2026 — Clôture technique de la recette des 112 références

- Décision utilisateur : cycles de date à date depuis le démarrage réel, 12 cycles pour un engagement annuel, quota par cycle et facturation distincte. Mensuel jusqu’à arrêt ; annuel exprès arrêté à échéance. Version vendue conservée pour les périodes futures ; calendrier historique inchangé.
- Exécution autorisée 94 A + 18 B : 112 références intégrées et recettées nativement dans de faux dossiers. 655/655 tests, typecheck OK, trois thèmes, diagnostic 484/484 et 783 contrôles de base. Rejeu sans modification. Sauvegardes, migrations 63–65 et preuves tracées.
- Rapport, matrice de 112 références, 432 actions, limites et 62 fichiers proposés fournis. Aucun commit/push/merge, Bridge ou 8C. Arrêt pour validation. Ce bilan technique ne valide pas juridiquement les textes.


### 2026-09-27 — CP-001 — Checkpoint technique vérifié

- Auteur/rôle : agent Manager MSI, résultats communiqués à Carlos.
- Type : résultat ; base `4f8fa15c80da874e084648b1d643a316cbfcbcb2`.
- Git propre et aligné sur la branche distante au checkpoint ; PR #74 déjà intégrée.
- Validation-MSI lu sans écriture : migrations 1–43 présentes, aucune ancienne collision CGV 40/41/42. Migrations CGV 44/45/46 présentes dans le code, non appliquées par l'agent à ce workspace.
- Typecheck réussi. Tests ciblés : ContractTermsService 9, QuoteService 8, migrations 10, CompositionService 5, CompositionPackageService 2, soit **34 réussis / 0 échoué**.
- Aucun lancement de l'application, suite complète ou packaging. Recette CGV post-migrations non effectuée dans ce checkpoint. Production non touchée.
- Prochaine action : réflexion d'architecture, pas lancement d'un lot.

### 2026-09-27 — ARCH-001 — Demande de réflexion sur les Pages hybrides

- Origine : consigne de Carlos et note d'architecture produite dans le chat Manager MSI.
- Type : consigne + proposition ; même socle technique.
- Divi doit rester l'atelier principal ; Page réelle plus large que la composition ; modules natifs et CSS Page/Site préservés ; Bibliothèque volontaire.
- Résultat : recommandations des sections 1–15, étayées par lecture ciblée du code Manager et des schémas. Plugin Bridge non audité dans cette passe.
- Aucun code modifié ni contrôle technique relancé pour cette réflexion.
- Prochaine action : confronter les arbitrages au vrai Bridge et obtenir l'autorisation explicite du premier lot.

### 2026-09-27 — COORD-001 — Publication et suivi partagé demandés

- Origine : Carlos : ancrer la feuille de route sur GitHub, fournir le moyen d'informer l'autre agent et consigner les prochains échanges/consignes dans ce fichier.
- Type : consigne documentaire validée ; **n'autorise pas l'implémentation des lots**.
- Action : création du présent document et liens depuis `AGENTS.md` et `PROJECT_STATUS.md`. Publication autorisée sur `feature/project-blueprints-v1`, sans fusion dans main.
- Contrôles préalables : checkout propre au socle attendu ; après fetch origin, divergence HEAD/suivi distant `0 / 0`.
- Validation prévue de cette modification documentaire : revue du diff et `git diff --check` ; aucun test applicatif nécessaire. Le commit de publication et son état distant seront communiqués avec le transfert ; ne pas considérer cette entrée seule comme preuve de push.
- Prochaine action : transmettre le lien à l'autre agent ; lui demander de lire le journal et de rendre son analyse/les arbitrages nécessaires avant tout développement. Responsable de la transmission : Carlos.


### 2026-09-27 — BRIDGE-AUDIT-001 — Confrontation de la roadmap au code Bridge 0.8.0

- Auteur/rôle : agent Manager/Bridge ChatGPT, audit en lecture seule demandé par Carlos après retranscription des propositions Codex dans la roadmap.
- Type : résultat d’audit + écarts ; **aucune autorisation de développement**.
- Base Manager vérifiée : `feature/project-blueprints-v1` @ `ea866775b35db089279c363a264d40720375fdd0`.
- Base Bridge inspectée : dépôt `atoumweb-prog/atoumweb-bridge`, branche `feature/workbench-occurrence-v1` @ `36d1076dbac1f031356632d8b95427e0ee58739c`, plugin déclaré **0.8.0**. Le `main` Bridge courant ne contient qu’un README ; il ne doit pas être pris comme baseline du code fonctionnel.
- Point confirmé : Bridge conserve le flux Workbench-first, crée un brouillon WordPress distinct, une `siteOccurrenceId` Bridge par composant et n’écrit pas en production. `actionPolicy=manager_decides` reste cohérent avec la Bibliothèque volontaire.
- Écart contrat destination : `atoumweb_bridge_project_package` n’accepte actuellement que `schemaVersion=1`, exige `composition.id` + `composition.name` et 1 à 50 composants. Il ne transporte pas `scope=page`, `projectId`, `siteId`, `pageId` ni `exportId`. Le futur contrat Page doit donc être versionné/additif et préserver V1.
- Écart Page hybride : le Workbench projet actuel est construit uniquement avec les composants Manager importés, chacun dans un module Code distinct. Cela convient comme préparation partielle, mais Bridge ne fusionne pas encore ce package dans une Page/Workbench existant. Une Page sans composant Manager ne doit donc pas produire de package ; elle reste valide côté Manager.
- Écart idempotence d’import : l’empreinte SHA-256 du package est enregistrée dans la provenance, mais aucun contrôle global ne réutilise/refuse actuellement un Workbench projet déjà importé avec la même empreinte. L’idempotence actuelle des occurrences ne vaut qu’à l’intérieur d’un même Workbench déjà créé.
- Écart identité d’occurrence ↔ module Divi : Bridge crée bien une `awocc:...` distincte par composant et conserve `compositionItemId`/ordre dans les metas du Workbench. En revanche, le module Divi créé porte surtout un `admin_label="AWB Project — <nom>"` ; l’`occurrenceId` n’est pas actuellement embarquée comme marqueur stable dans le module lui-même. Après déplacement ou duplication dans Divi, la correspondance occurrence ↔ nœud réel peut donc devenir ambiguë. Ce point doit être tranché avant LOT 8A.
- Écart retour multi-composants : `AWB_Site_Occurrence::build_return_zip()` refuse aujourd’hui les Workbenches `manager_project` et réserve Occurrence Return V1 aux Workbenches `manager_library`. La documentation Bridge 0.8.0 indique elle-même que les Occurrence Returns individuels du package projet restent hors convention 0.1. Le round-trip multi-composants reste donc à développer plus tard ; ne pas le considérer comme acquis.
- Observation hybride confirmée partiellement : le scanner Bridge lit tous les shortcodes Divi 4 `et_pb_*`, reconstruit section/row/column/module, conserve attributs, champs responsive/design, classes et IDs ; il capture aussi CSS/JS de page, `_et_pb_custom_css`, sources globales WordPress/Divi et contexte Theme Builder connu. Les avertissements du scanner indiquent toutefois que les affectations Theme Builder et les presets/couleurs/polices globales Divi restent partiellement normalisés. La couverture doit donc être déclarée dans les retours et testée sur fixtures réelles, comme proposé dans 8B.
- Arbitrages §14 : (1) Page = nœud Projet + extension reste compatible avec Bridge ; (2) composition facultative/partielle est compatible conceptuellement ; (3) Site logique Manager doit rester distinct du `siteKey/siteUrl` de l’installation Bridge ; (4) occurrence durable est pertinente mais nécessite un marqueur stable côté Divi ; (5) enveloppe Page versionnée est nécessaire ; (6) promotion volontaire est déjà alignée ; (7) réimport Workbench/idempotence nécessite encore une vraie règle de package.
- Blocage actuel : aucun blocage pour poursuivre la réflexion Manager 6A/6B, mais **ne pas implémenter 8A/8B/8C avant décision sur l’identité stable d’une occurrence dans le contenu Divi et sur la version du contrat Page**.
- Prochaine action : Carlos/agents valident ou corrigent les arbitrages §14 à la lumière de ces écarts. Aucun code Manager ou Bridge à modifier sans autorisation explicite.


### 2026-09-28 — ROADMAP-CLEAN-001 — Roadmap réalignée sur le Bridge réellement implémenté

- Auteur/rôle : agent Manager/Bridge ChatGPT, sur autorisation de Carlos de nettoyer le document après BRIDGE-AUDIT-001.
- Type : correction documentaire + clarification d’architecture ; **aucun développement autorisé ni commencé**.
- Base avant modification : `feature/project-blueprints-v1@d7ef19827e3c9f88024355a5f73c8b4989b45b20`.
- Action : sections 0, 2, 4, 6, 8, 12, 13, 14 et 15 réalignées sur le code réel Bridge 0.8.0.
- Capacités désormais marquées comme existantes et à conserver : package projet V1 multi-composants, Workbench unique, modules Code séparés, `siteOccurrenceId` Bridge par composant, `compositionItemId`, baselines, scanner Divi large, Workbench-first, `manager_decides`.
- Travaux restant explicitement isolés : destination Projet/Site/Page, enveloppe Page versionnée, `exportId` et idempotence d’import, marqueur stable d’occurrence dans Divi, validation/corrélation du scanner hybride, retour multi-composants `manager_project`.
- Simplification : aucun `occurrenceId` Manager supplémentaire ne doit être créé par défaut. Le couple de continuité visé est `compositionItemId` côté Manager puis `siteOccurrenceId` créée par Bridge, avec association persistée.
- Lots 8A/8B/8C resserrés pour compléter l’existant au lieu de le reconstruire.
- Prochaine action : validation explicite des arbitrages §14, en priorité 1, 4 et 5, avant autorisation de tout lot de code.


### 2026-09-28 — LOT6A-START-001 — Autorisation et démarrage du Lot 6A

- Origine : autorisation explicite de Carlos après validation de la feuille de route commune.
- Auteur/rôle : agent ChatGPT responsable de l’implémentation du Lot 6A.
- Type : décision + consigne d’exécution.
- Base de départ : `feature/project-blueprints-v1@be9d936ac5fae7b5b88b0f3402bb1095da0eb531`.
- Lot autorisé : **6A — Projet / Site / Page uniquement**.
- Périmètre : entité Site opérationnelle, extension des nœuds Projet `displaySubtype=page`, création/édition/archivage manuel, contrôles d’appartenance Projet/Site/Page, API/UI minimale et tests ciblés.
- Hors périmètre : composition/rattachement Bibliothèque (6B), génération automatique blueprint (7), contrat Page/Bridge et occurrences (8A+), toute modification du dépôt Bridge.
- Stratégie Git : développement isolé sur `feature/project-sites-v1`, puis validation avant toute intégration dans `feature/project-blueprints-v1`.
- Prochaine action : implémenter migration 47 et Lot 6A ; aucun autre lot ne doit être commencé implicitement.


### 2026-09-28 — LOT6A-IMPL-001 — Implémentation du Lot 6A publiée sur branche dédiée

- Auteur/rôle : agent ChatGPT, implémentation sur `feature/project-sites-v1`.
- Type : résultat d’implémentation ; périmètre 6A uniquement.
- Base : branche créée depuis `cc0a557beca451ffe0c7fd0bbfc3856b3eb6ff13`.
- Implémenté : migration 47 `project_sites_pages_v1`, service Site/Page, contrôles inter-projets et subtype Page, protection contre le retypage d’une Page liée, IPC/preload/types, onglet Projet « Sites & pages », création manuelle d’un nœud Page depuis le plan et tests ciblés du service.
- Archivage : un Site archivé reste en base et conserve ses rattachements Page ; aucune suppression de Site n’est exposée par l’UI.
- Hors périmètre préservé : aucune composition 6B, aucun blueprint Lot 7, aucun contrat ou code Bridge 8A+.
- Validation : code publié pour contrôle ; les tests/typecheck doivent être exécutés sur le workspace MSI avant intégration dans `feature/project-blueprints-v1`.
- Prochaine action : checkpoint technique ciblé migration 47 + ProjectSiteService + ProjectService, puis recette visuelle Sites & pages. Ne pas lancer 6B avant validation explicite.


### 2026-09-28 — LOT6A-TECH-VALID-001 — Checkpoint technique MSI vert

- Validation exécutée localement sur MSI par Carlos.
- Branche : `feature/project-sites-v1`.
- HEAD validé : `e6561ab69907a32e7e255e841070dca9a45a08db`.
- Working tree : propre avant validation.
- `npm run typecheck` : réussi.
- Tests ciblés exécutés : `ProjectSiteService.test.ts`, `ProjectService.test.ts`, `migrations.test.ts` ; résultat communiqué : **tout vert**.
- Statut : socle technique du Lot 6A validé.
- Non encore validé : application réelle des migrations 44–47 sur Validation-MSI et recette visuelle/fonctionnelle de l’onglet « Sites & pages ».
- Hors périmètre inchangé : aucun Lot 6B, 7 ou 8 lancé.
- Prochaine action : lancer le Manager sur le workspace Validation-MSI, confirmer les migrations 44–47, puis effectuer la recette manuelle du Lot 6A avant toute intégration.


### 2026-09-28 — LOT6A-UX-001 — Corrections de recette Sites & pages

- Origine : recette visuelle de Carlos sur Validation-MSI après passage à 47 migrations.
- Constats : liste de Pages non scrollable ; libellé « Domaine souhaité » ambigu ; « Chemin souhaité » ambigu alors qu’il s’agit du slug/chemin URL ; placeholder /contact trompeur sur les Pages non rattachées.
- Correction : scrollbar interne sur la liste de Pages ; libellés « Nom de domaine prévu » et « Slug / chemin URL » ; aide par exemples ; champ slug désactivé tant que la Page n’est pas rattachée.
- Règle métier clarifiée : une Page au rôle Accueil reçoit toujours le chemin `/`; `/` est réservé à l’Accueil.
- Périmètre : correction Lot 6A uniquement ; aucun démarrage 6B/7/8.
- Validation restante : typecheck + tests ciblés ProjectSiteService, puis nouvelle capture/recette visuelle.


### 2026-09-28 — LOT6A-UX-002 — Harmonisation UX Sites & pages avec Production

- Origine : recette visuelle de Carlos ; l’écran fonctionnait mais restait trop proche d’une table d’administration et ne proposait pas d’action directe de création/ouverture d’une Page.
- Décision : l’écran « Sites & pages » adopte la même logique d’interaction que Production : arborescence scrollable à gauche, fiche détaillée à droite.
- Actions ajoutées : `+ Site`, `+ Page`, `+ Ajouter une Page` sous un Site et `Ouvrir dans Production` depuis la fiche Page.
- Sémantique : `+ Page` crée uniquement un nœud Page du Projet (et peut le rattacher au Site choisi). Cela **ne crée pas encore une Page WordPress/Divi** et ne démarre pas le Lot 8A.
- Source de vérité préservée : le nom/statut de la Page restent portés par le `project_node`; l’écran Site/Page n’en crée pas une copie.
- Hors périmètre : aucun bouton « Préparer dans Divi » tant que le contrat Page/Bridge n’est pas développé.
- Validation restante : typecheck puis recette visuelle création Page, rattachement Site, renommage et ouverture dans Production.


### 2026-09-28 — LOT6A-UX-003 — Splitter Production + chrono Page dans Sites & pages

- Origine : recette visuelle de Carlos après UX-002.
- Constats : absence de séparateur redimensionnable entre arborescence et fiche ; débordement horizontal visuel ; action « Ouvrir dans Production » insuffisamment mise en évidence ; absence du temps réel et du démarrage direct sur la Page.
- Correction UX : même logique que Production avec splitter central 40/60 redimensionnable de 24 à 68 %, double-clic pour revenir à 40 %, touches gauche/droite et panneaux scrollables indépendamment.
- Correction débordement : conteneurs `min-width:0`, overflow horizontal masqué et arborescence avec ellipsis ; suppression de la barre horizontale parasite.
- Temps Page : la fiche affiche le temps réel cumulé des sessions rattachées au `project_node` Page et indique si son chrono est actif/en pause.
- Actions Page : « Ouvrir la fiche Production », « Démarrer le travail sur cette Page », puis Pause/Reprendre/Arrêter si le chrono actif appartient à cette Page.
- Cohérence globale : un seul chrono reste possible. Si une autre activité est active, le démarrage depuis Sites & pages passe par la confirmation de changement du timer global existant.
- Aucune migration ni nouveau modèle de temps : réutilisation de `time_sessions.project_node_id`.
- Hors périmètre inchangé : aucune création WordPress/Divi, aucun Lot 6B/7/8.
- Validation restante : typecheck puis recette visuelle splitter, scrolls, temps réel et démarrage/changement de chrono.


### 2026-09-28 — LOT6B-DESIGN-001 — Création directe de composants depuis une Page

- Origine : demande métier de Carlos avant démarrage du Lot 6B.
- Statut : décision fonctionnelle à intégrer au périmètre 6B ; **aucun développement 6B encore autorisé par cette entrée seule**.
- Principe : depuis la fiche d’une Page dans « Sites & pages », l’utilisateur peut soit sélectionner un composant existant de la Bibliothèque AtoumWeb, soit créer directement un nouvel élément réutilisable sans quitter le contexte de la Page.
- Cas 1 — réutilisation : « Ajouter depuis la Bibliothèque » ouvre le catalogue des éléments réutilisables et permet d’ajouter une version précise à la composition partielle de la Page.
- Cas 2 — création : « Créer un composant / une section » ouvre un éditeur permettant de coller ou saisir un code complet (HTML/CSS/JS et métadonnées disponibles selon le type), de visualiser le rendu/code avec les capacités déjà présentes dans la Bibliothèque, puis d’enregistrer :
  - soit comme **nouvel élément** de Bibliothèque ;
  - soit comme **nouvelle variante / déclinaison** rattachée à un modèle/famille existant ;
  - soit comme élément local de travail tant qu’il n’est pas promu.
- Cas d’usage attendu : Carlos fournit les informations d’un Hero ; un agent peut produire le code complet ; ce code est collé dans l’éditeur depuis la Page ; l’utilisateur choisit ensuite « Nouveau composant » ou « Rattacher à un modèle / variante ».
- Règle d’identité : si le code correspond à une déclinaison d’un modèle existant, conserver la famille/modèle source et créer une variante distincte plutôt qu’écraser le modèle.
- Règle Bibliothèque : aucune création ou promotion ne doit être implicite. L’utilisateur choisit explicitement si l’élément devient réutilisable.
- Règle Page hybride : une Page peut contenir simultanément composants AtoumWeb, éléments créés localement puis promus, et modules Divi natifs non suivis par la Bibliothèque.
- UX cible 6B : dans la fiche Page, bloc « Composants AtoumWeb » avec liste ordonnée, aperçu/code, actions Ajouter depuis la Bibliothèque, Créer un composant/section, Réordonner, Retirer, Ouvrir la fiche Bibliothèque.
- Hors périmètre 6B : aucune génération WordPress/Divi, aucun package `scope=page`, aucun envoi Bridge ; cela reste 8A+.
- Prochaine action : valider explicitement le démarrage du Lot 6B avant toute modification de code.


### 2026-09-28 — LOT6B-DESIGN-002 — Vue globale assemblée de la Page

- Origine : demande métier de Carlos avant démarrage du Lot 6B.
- Statut : exigence fonctionnelle à intégrer au Lot 6B ; aucun développement lancé par cette entrée seule.
- Besoin : lorsqu’une Page contient plusieurs composants AtoumWeb (ex. 10 modules/sections), l’utilisateur doit pouvoir voir une prévisualisation globale assemblée dans l’ordre réel de la composition, sans ouvrir chaque composant séparément.
- Réutilisation technique : la Bibliothèque possède déjà un visualiseur HTML sandboxé par iframe et les compositions connaissent pour chaque item la version source exacte. Le Lot 6B doit réutiliser ces briques, pas créer un nouveau moteur de rendu.
- UX cible : bouton « Aperçu de la Page » ou « Voir la composition complète » depuis la fiche Page ; ouverture d’une vue large/plein écran montrant les composants concaténés dans l’ordre, avec possibilité Desktop / Tablette / Mobile et retour rapide à la liste.
- La vue doit permettre d’identifier les limites entre composants en mode inspection, sans imposer ces repères dans l’aperçu visuel normal.
- Sémantique importante : avant retour Bridge, cette vue est **l’aperçu de la composition AtoumWeb préparée**, pas nécessairement la Page Divi complète. Une Page hybride peut aussi contenir modules Divi natifs, spacing ou CSS ajoutés directement dans Divi et inconnus du Manager à ce stade.
- Après scan/retour Bridge, une future vue peut distinguer clairement :
  1. « Composition préparée par Manager » ;
  2. « Page réelle observée dans Divi ».
- Rendu : concaténer les HTML/CSS/JS compatibles de chaque version sélectionnée dans un document d’aperçu isolé ; éviter toute mutation du code source ou de la Bibliothèque.
- Erreurs : un composant non prévisualisable doit apparaître comme bloc signalé dans l’aperçu/inspection plutôt que faire échouer toute la Page.
- Performance : prévoir un rendu paresseux/recalcul uniquement après modification de la composition ou sur demande, afin qu’une Page de nombreux composants reste fluide.
- Hors périmètre : ne pas prétendre reproduire les wrappers/spacing Divi réels avant Bridge ; la fidélité complète à la Page Divi reste un objectif des lots 8B/8C.
- Prochaine action : intégrer cette vue au cahier des charges détaillé 6B au moment où Carlos autorisera explicitement son démarrage.


### 2026-09-28 — LOT6B-START-001 — Démarrage autorisé du Lot 6B

- Origine : autorisation explicite de Carlos (« je te laisse continuer ») après validation des exigences DESIGN-001 et DESIGN-002.
- Branche d’implémentation : `feature/project-page-compositions-v1`, créée depuis `feature/project-sites-v1@661485a23445d521fab3628aed20c6c3aa9c86be`.
- Sous-checkpoint 6B.1 implémenté : migration 48 `project_page_compositions_v1` ; zéro ou une Composition par Page ; une Composition ne peut appartenir qu’à une seule Page ; anciennes compositions laissées non rattachées par défaut.
- API 6B.1 : retrouver, créer automatiquement, rattacher ou détacher une Composition depuis un `project_node` Page.
- Hors périmètre inchangé : aucun package Page/Bridge, aucune création WordPress/Divi, aucun Lot 7/8.
- Étapes suivantes du même Lot : 6B.2 catalogue/réordonnancement, 6B.3 création directe/déclinaison, 6B.4 aperçu global.


### 2026-09-28 — LOT6B-IMPL-001 — Composition partielle de Page implémentée sur branche dédiée

- Branche : `feature/project-page-compositions-v1`.
- Migration : **48 — `project_page_compositions_v1`**.
- 6B.1 : une Page Projet peut avoir zéro ou une Composition AtoumWeb ; une Composition rattachée ne peut appartenir qu’à une seule Page ; les compositions historiques restent non rattachées tant que l’utilisateur ne les choisit pas.
- 6B.2 : depuis la fiche Page, bloc « Composants AtoumWeb » avec ajout depuis la Bibliothèque, recherche, ordre, montée/descente, retrait sans mutation de la source et rattachement explicite d’une composition historique.
- 6B.3 : éditeur direct HTML/CSS/JS avec aperçu sandboxé. Deux parcours validés :
  - créer un **nouvel élément réutilisable** avec famille + variante base, version stable et ajout immédiat à la Page ;
  - créer une **déclinaison complète** d’un modèle existant, sous forme de variante `forked`, sans écraser la source.
- Règle de validation : la création directe est une action humaine explicite ; le composant est marqué prêt/stable et conserve une identité Famille/Variante.
- Règle verticale : une famille `vertical` conserve son métier lors de la création d’une déclinaison.
- 6B.4 : « Aperçu de la Page » assemble les versions exactes des composants dans l’ordre ; modes Desktop/Tablette/Mobile + mode Inspection ; composants non prévisualisables signalés sans faire échouer tout le rendu.
- Sécurité aperçu : HTML/CSS rendus dans un iframe sandboxé ; JavaScript conservé/inspectable mais **non exécuté** dans l’aperçu Manager.
- Distinction maintenue : l’aperçu est celui de la **composition préparée par Manager**, pas encore celui de la Page Divi réelle.
- Choix de simplification : le mode « élément local hors Bibliothèque » évoqué dans DESIGN-001 n’est pas implémenté à ce stade, car il créerait une deuxième source de vérité technique. Les besoins exprimés par Carlos (« nouvel élément » ou « déclinaison ») sont couverts par le modèle versionné existant.
- Hors périmètre : aucun export `scope=page`, aucun `exportId`, aucun envoi Bridge, aucune création WordPress/Divi, aucun Lot 7/8.
- Validation restante : typecheck + tests ciblés migrations / CompositionService / TechnicalLibraryService, puis recette visuelle sur Validation-MSI avant intégration.


### 2026-09-28 — LOT6B-UX-001 — Corrections de recette Bibliothèque / éditeur direct

- Origine : recette visuelle de Carlos sur la branche 6B.
- Constats :
  - fin de la liste de droite difficile/inaccessible ;
  - barre horizontale parasite en bas ;
  - Bibliothèque Page n’affichant que les éléments prêts, donnant l’impression que des composants avaient disparu ;
  - ajout multiple du même CTA bien enregistré mais ambigu visuellement ;
  - éditeur direct trop contraint par les trois zones HTML/CSS/JS et hauteur de fenêtre.
- Correction :
  - Bibliothèque ouverte dans une vraie modale scrollable ;
  - création directe ouverte dans une vraie modale scrollable ;
  - suppression des largeurs minimales responsables du débordement horizontal ;
  - affichage de tous les éléments visuels de Bibliothèque avec statut ; seuls les éléments prêts restent ajoutables ;
  - compteur « prêts / éléments visuels » ;
  - occurrences du même composant numérotées explicitement dans la composition ;
  - mode « Code complet » acceptant HTML + <style> + <script>, avec action « Analyser et répartir le code » vers HTML/CSS/JavaScript.
- Le doublon CTA n’était pas perdu : le service Composition autorise plusieurs occurrences du même composant ; le problème était uniquement l’affichage/scroll.
- Validation restante : typecheck + recette visuelle sur MSI.

### 2026-09-28 — LOT6B-DESIGN-003 — Préparation locale des textes et couleurs par occurrence

- Origine : proposition de Carlos pendant la recette 6B.
- Besoin : avant passage WordPress/Divi, pouvoir préparer une occurrence de composant en modifiant ses textes, liens et couleurs, tout en gardant la Bibliothèque source intacte.
- Direction retenue : les personnalisations appartiennent à **l’occurrence dans la Composition**, jamais au modèle source.
- Cible UX : action « Préparer ce bloc » depuis la liste Page, avec aperçu immédiat et contrôles pour les champs explicitement configurables.
- Champs visés en priorité : titres, textes, libellés/boutons, URLs, couleurs principales/secondaires, éventuellement images lorsque le composant les déclare.
- Stockage cible : overrides/configuration structurés au niveau `atoumweb_composition_items`, versionnés séparément de la version Bibliothèque source.
- Principe de sécurité : ne pas tenter une réécriture arbitraire de n’importe quel HTML/CSS. Les composants doivent déclarer des champs configurables ou des tokens explicites ; les overrides sont appliqués au rendu préparé et seront transportables plus tard vers Bridge.
- Intérêt : partir dans Divi avec une base déjà contextualisée (textes/couleurs du client), puis n’utiliser Divi que pour le réglage final.
- Hors périmètre immédiat de la correction UX-001 : cette personnalisation sera développée après validation du flux création directe + aperçu.


### 2026-09-28 — LOT6B-DESIGN-004 — Réglages locaux d’occurrence et promotion en variante

- Origine : précision métier de Carlos pendant la recette 6B.
- Besoin : une Page construite avec des blocs AtoumWeb doit pouvoir être préparée en amont avant WordPress/Divi : textes, libellés, liens, couleurs et autres valeurs simples doivent pouvoir être adaptés localement si l’utilisateur le souhaite.
- UX : chaque occurrence de composant dans la Page possède un volet **« Réglages du bloc »** replié par défaut. L’utilisation de ce volet est facultative ; si aucun réglage n’est saisi, l’occurrence reste strictement basée sur la version Bibliothèque sélectionnée.
- Contenu visé :
  - textes : titre, sous-titre, paragraphes, libellés CTA ;
  - liens : URL/bouton ;
  - couleurs : fond, texte, accent(s), boutons, bordures lorsque le composant les expose ;
  - médias simples lorsque le composant les déclare comme configurables ;
  - valeurs locales supplémentaires définies explicitement par le composant.
- Règle de source de vérité : les réglages sont stockés **sur l’occurrence de composition**, jamais dans la version Bibliothèque source. Le modèle reste immuable.
- Aperçu : l’aperçu du composant et l’aperçu global de Page appliquent les réglages locaux afin de montrer la version préparée réellement attendue avant Divi.
- Modification avancée : si l’utilisateur modifie le code ou réalise une adaptation qui dépasse les simples réglages, l’occurrence est considérée comme une adaptation locale dérivée du modèle source.
- Action **« Envoyer vers la Bibliothèque comme variante »** :
  - crée un nouvel élément/variant lié à la Famille et au modèle source ;
  - copie le rendu/code adapté de l’occurrence ;
  - ne modifie jamais le modèle source ;
  - crée la variante avec un statut **à valider / non prête à réutiliser** par défaut ;
  - demande ensuite une validation humaine explicite avant de passer la variante en « prête à réutiliser ».
- Le bouton de promotion n’est jamais automatique : une adaptation locale peut rester uniquement dans cette Page pendant toute la vie du Projet.
- Proposition d’état : variante créée depuis une occurrence locale → `reuseStatus='adapt'` tant qu’elle n’a pas été relue/validée ; passage à `ready` uniquement via action explicite.
- Traçabilité : conserver source item/version, famille/variante d’origine, Page/Projet d’origine, date de promotion et relation « dérivée de ».
- Intégration future Bridge : les overrides locaux devront être transportables sans réécrire la provenance de la Bibliothèque. Le mapping exact vers le contrat Page/Bridge reste réservé à 8A+.
- Hors périmètre immédiat : ne pas inventer de modification automatique de n’importe quel CSS/HTML. Les réglages simples doivent reposer sur des champs/tokens explicitement exposés par le composant ; l’édition libre de code reste une action avancée séparée.


### 2026-09-28 — LOT6B-LOCAL-SETTINGS-001 — Réglages locaux et promotion en variante implémentés

- Origine : autorisation de Carlos de réaliser DESIGN-004 avant recette.
- Migration : **49 — `project_page_composition_local_settings_v1`**.
- Chaque occurrence de `atoumweb_composition_items` peut désormais conserver :
  - HTML local préparé ;
  - CSS local préparé ;
  - JavaScript local préparé ;
  - métadonnées de réglages (textes/couleurs/note) ;
  - date de dernière adaptation locale.
- Source de vérité préservée : `source_item_id` et `source_version_id` restent inchangés. Réinitialiser l’occurrence supprime uniquement l’adaptation locale.
- UX : bouton repliable **« Réglages ▾ »** sur chaque occurrence.
- Réglages rapides :
  - détection des textes visibles simples dans le HTML ;
  - détection des couleurs CSS simples ;
  - modification locale avec aperçu immédiat ;
  - note locale facultative.
- Mode avancé : HTML/CSS/JS de l’occurrence restent éditables librement dans le volet.
- Aperçus : « Code / aperçu » et « Aperçu de la Page » utilisent maintenant l’état local préparé lorsqu’il existe ; sinon la version Bibliothèque figée.
- Promotion : bouton **« Envoyer vers la Bibliothèque »** depuis le volet de réglages.
- La promotion :
  - crée une nouvelle variante `forked` dans la famille du composant source ;
  - ne modifie jamais le modèle source ;
  - utilise le code local préparé ;
  - crée l’élément Bibliothèque avec `reuseStatus='adapt'` ;
  - ne marque pas la version stable ;
  - ajoute le marqueur `manager-variant-to-review` ;
  - conserve une note de provenance Projet/Page/occurrence.
- Validation humaine obligatoire avant passage ultérieur à `ready`.
- Hors périmètre : aucun export Page/Bridge, aucune mutation WordPress/Divi, aucun Lot 7/8.
- Validation restante : typecheck, migrations, tests Composition/Library puis recette visuelle de Carlos sur Validation-MSI.


### 2026-09-28 — LOT6B-FIX-002 — Retour d’identité d’une variante non stable

- Détecté par le checkpoint MSI après LOCAL-SETTINGS-001 : 33/34 tests réussis, échec du test de promotion locale car `variantMode` retournait `null` au lieu de `forked`.
- Cause : `createVariantCode()` créait bien la ligne `atoumweb_component_variants`, mais lorsque `markStable=false`, l’objet retourné était encore celui chargé avant cette insertion d’identité.
- Correction : rechargement systématique de l’élément après insertion de la variante lorsqu’elle n’est pas marquée stable.
- Aucun schéma ni contrat modifié ; migration 49 inchangée.
- Validation attendue : typecheck + tests ciblés CompositionService / TechnicalLibraryService / migrations.


### 2026-09-28 — LOT6B-UX-002 — Scroll colonne droite, aperçu et historique local

- Origine : recette visuelle de Carlos après migration 49.
- Défaut structurel identifié : `ProjectSitesTab` vivait dans la troisième ligne `minmax(0,1fr)` de la Page Projet tout en imposant à son workspace une hauteur propre. L’ensemble dépassait l’espace réellement disponible, ce qui coupait le bas du panneau droit et favorisait un débordement horizontal.
- Correction structurelle :
  - `ProjectSitesTab` devient un conteneur flex vertical occupant exactement la hauteur disponible ;
  - `project-sites-workspace` prend uniquement l’espace restant (`flex:1; min-height:0`) au lieu d’imposer une hauteur calculée ;
  - overflow horizontal clipsé à tous les niveaux du workspace 6B ;
  - panneau droit avec scroll vertical indépendant, marge/scroll-padding basse et overscroll contenu ;
  - iframes d’aperçu intégrées non interactives afin que la molette continue de piloter la colonne droite.
- Aperçu global :
  - chaque composant est maintenant enveloppé dans une tranche de Page ;
  - les CSS des composants sont chargés avant les garde-fous de l’iframe ;
  - `html`, `body` et les tranches restent forcés visibles afin qu’un CSS global d’un composant ne puisse masquer tout l’aperçu ;
  - iframe forcée à se recharger lors du changement de device/inspection.
- Réglages couleurs :
  - sélecteur natif visuel à la souris pour les couleurs convertibles en hex ;
  - pastille d’aperçu + saisie CSS manuelle conservée.
- Historique local :
  - boutons Annuler / Rétablir avec historique local borné ;
  - bouton « Version Bibliothèque » pour revenir exactement à la source figée de l’occurrence.
- Aperçu module :
  - aperçu du module seul toujours visible dans le volet ;
  - bouton « Agrandir » / « Voir le module seul » ouvrant une modale grand format indépendante de l’aperçu global de Page.
- Aucune migration supplémentaire : dernière migration = 49.
- Validation restante : typecheck + tests ciblés puis recette visuelle du scroll complet, absence de barre horizontale, aperçu global, couleur, undo/redo/reset et module seul.


### 2026-09-28 — LOT6B-UX-003 — Correction du conteneur global Projets et visibilité Composition

- Origine : recette Carlos montrant encore une barre horizontale globale et l'absence apparente du bloc Composants AtoumWeb.
- Diagnostic corrigé : les fixes UX-001/002 agissaient principalement dans `ProjectSitesTab`, mais la barre horizontale provenait aussi du conteneur global `.content-area` de la page Projets, qui n'avait pas de restriction `overflow-x` contrairement aux workspaces Bibliothèque/Sites.
- Correction :
  - ajout d'une classe `projects-content` au conteneur global lorsque la page active est Projets ;
  - `overflow-x:hidden` appliqué à ce niveau ;
  - `project-production-page` bornée à `width/max-width:100%` avec overflow horizontal interdit ;
  - panneaux Site/Page bornés à 100 % de largeur ;
  - fin de panneau remise dans le flux normal : suppression du `margin-top:auto` sur la note Divi ;
  - chaque enfant du panneau droit reste `flex:0 0 auto`, afin que le scroll vertical atteigne réellement le dernier élément ;
  - bloc `ProjectPageCompositionPanel` déplacé immédiatement sous le résumé Temps réel, avant les champs Page ;
  - badge visible `6B · Composition AtoumWeb` ajouté dans l'en-tête Page pour permettre de vérifier immédiatement que le renderer courant contient bien le correctif.
- Critère recette : après redémarrage sur ce commit, le badge 6B et le bloc Composants AtoumWeb doivent être visibles sans scroller ; aucune barre horizontale globale ne doit rester.


### 2026-09-28 — LOT6B-HANDOFF-CODEX-001 — Reprise critique UX 6B par Codex

- Contexte : Carlos demande à Codex de reprendre la recette/correction UX du Lot 6B après plusieurs itérations. Ne pas considérer les diagnostics précédents comme acquis : repartir du rendu réel et du code actuel.
- Branche canonique de travail : `feature/project-page-compositions-v1`.
- HEAD de référence au moment du handoff : `4bdf3df31ccfc9a84a5f3d08742c002ba6467443`.
- Dernière migration : **49**.
- Blocage visible encore présent : **barre horizontale parasite en bas de la vue Projets / Sites & pages**, confirmée sur la dernière capture utilisateur malgré UX-001/002/003. La cause doit être retrouvée par inspection réelle du layout, pas supposée.
- Scroll colonne droite : considéré **non validé** tant que la fin réelle du contenu n'est pas atteignable sans contournement.
- Fonctions implémentées mais à revalider visuellement :
  - Bibliothèque Page avec tous les éléments visuels + statut ;
  - occurrences multiples du même composant ;
  - création directe avec mode « Code complet » puis séparation HTML/CSS/JS ;
  - aperçu global de Page ;
  - réglages locaux texte/couleurs par occurrence ;
  - aperçu du module seul ;
  - sélecteur couleur à la souris ;
  - Annuler / Rétablir / retour « Version Bibliothèque » ;
  - promotion d'une adaptation locale vers la Bibliothèque comme variante `adapt`, non stable.
- Défaut déjà signalé à revalider : l'aperçu global de Page a déjà été observé entièrement blanc. Une tentative de garde-fous CSS a été faite, mais aucune recette finale n'a confirmé la correction.
- Règles à préserver :
  - modèle Bibliothèque source immuable ;
  - overrides locaux sur l'occurrence uniquement ;
  - variante promue depuis une occurrence = `forked`, `reuseStatus='adapt'`, non stable, validation humaine requise ;
  - zéro envoi Bridge / zéro création WordPress/Divi dans 6B ;
  - aucune nouvelle architecture parallèle aux services Composition/Bibliothèque existants.
- Consigne Codex :
  1. synchroniser la branche et vérifier HEAD/working tree ;
  2. lancer typecheck + tests ciblés avant tout changement ;
  3. reproduire/inspecter le layout actuel et identifier la **source exacte** du scrollbar horizontal (élément DOM et règle CSS responsables) ;
  4. corriger le scroll vertical de la colonne droite jusqu'au dernier élément ;
  5. vérifier réellement l'affichage du bloc Composants AtoumWeb et des contrôles 6B ;
  6. vérifier l'aperçu global avec plusieurs composants, dont deux occurrences du même CTA ;
  7. vérifier réglages texte/couleurs, color picker, module seul, undo/redo/reset ;
  8. vérifier création via « Code complet » et séparation ;
  9. vérifier promotion en variante `adapt` sans mutation de la source ;
  10. ne pas commencer Lot 7/8 ni modifier Bridge.
- Attendu : corrections minimales et cohérentes, pas de refonte générale de ProjectsPage. Après correction, fournir HEAD, fichiers modifiés, cause racine exacte de chaque défaut, résultats typecheck/tests et checklist de recette utilisateur.

### 2026-09-29 — LOT6B-MSI-STABILISATION-001 — Diagnostic et corrections UX ciblées

- Origine : handoff critique de Carlos puis autorisation « ok » après explication de la méthode. Lot 6B seulement ; aucune autorisation de fusion ni Lot 7/8.
- Git : checkout propre initial `4bdf3df31ccfc9a84a5f3d08742c002ba6467443`, fast-forward sur `feature/project-page-compositions-v1` vers `39315436376ba81470ed5fc0cbdad92c457ce553`. HEAD reste à cette base ; modifications locales sans commit/push.
- Référence : handoff, §14 et journal 6B relus. Les anciens diagnostics de scrollbar n'ont pas été considérés comme acquis.
- Cause de la barre : la condition `detailTab !== 'plan'` rendait `main.project-production-secondary` pour l'onglet Sites, en plus de ProjectSitesTab. Ce main sans enfant a padding 14px, bordure et fond. Reproduction Chromium isolée avec composants React et CSS actuels : largeur 1550px, hauteur 29,33px ; clientWidth=scrollWidth=1533px, zéro enfant. Aucun enfant débordant et aucun scrollbar horizontal dans ce bloc. La quatrième ligne implicite et son gap consommaient 39,33px. La condition exclut maintenant également Sites.
- Mesure après correction dans cette fixture : main absent ; workspace de 604px à 643,33px de haut ; aucune largeur dépassante du panneau droit. Les dimensions sont celles du banc de test, pas des mesures faites dans la fenêtre utilisateur.
- Scroll vertical : avant correction, le code courant atteignait déjà le dernier contenu dans cette fixture ; ne pas déclarer un ancien diagnostic flex comme confirmé. Après correction, dernier contenu accessible à 1600x1000 et 1200x800, avec plusieurs occurrences et Réglages/Code avancé. Iframe intégrée toujours non interactive pour laisser la molette au parent ; iframe agrandie interactive. Recette utilisateur encore nécessaire.
- Débordement réel des réglages : grille de promotion imposant 220px + 220px + bouton dans un contrôle étroit (443px disponibles, scrollWidth 568px). Promotion sur une colonne et grille de Réglages s'adaptant à la largeur disponible ; valeur CSS couleur sur sa propre ligne. Suppression d'un masquage horizontal local devenu inutile, pas d'ajout de cache-misère.
- Aperçu : auparavant les CSS de toutes les occurrences partageaient le même document ; une règle globale pouvait masquer les autres composants. Ajout de `componentPreview.ts` pour isoler les styles par composant via Shadow DOM déclaratif dans l'iframe sandboxée. Les règles de racine sont adaptées au host de prévisualisation, styles intégrés collectés, scripts non exécutés. Réutilisé pour création, module seul et Page. Le code Bibliothèque/occurrence stocké n'est jamais réécrit par cette prévisualisation.
- Limite aperçu : une fixture contenant une règle agressive `section{display:none!important}` ne masque plus son voisin ; ordre/inspection et tailles testés. L'ancien blanc sur les composants réels de Carlos n'a pas été reproduit ni attribué avec certitude. Aperçu statique, isolé : ne garantit pas le rendu WordPress/Divi, notamment les effets dépendants du JS ou du contexte global.
- Réglages : pickers étendus aux couleurs CSS reconnues par le navigateur, dont HSL/hex avec alpha ; transparence conservée lors du choix visuel. Textes/couleurs rapides réactualisés après édition avancée. Le remplacement de texte visible ignore style/script. Promotion interdite tant que le brouillon affiché n'est pas enregistré, avec libellé explicatif ; le service de promotion reste inchangé.
- Validation initiale : typecheck réussi, 34/34 Vitest ciblés. Validation finale : typecheck réussi, **35/35** (migrations 10, CompositionService 12, TechnicalLibraryService 11, CompositionPackageService 2), dont nouveau test Reset préservant source_item_id/source_version_id malgré une nouvelle version Bibliothèque.
- Contrôles de rendu supplémentaires : **31 réussis / 0 échoué** avec `node scripts/check-project-composition-ui.cjs`, Electron installé lancé isolément/masqué, API de fixture en mémoire et profil temporaire. Pas de lancement du main applicatif, pas de base client ni Production. Vérifie notamment double ajout, recherche/non-prêts, code complet séparé/création, note, Undo/Redo/Reset, promotion du brouillon bloquée, aperçu local/source, formats, isolation CSS et bas de panneau. Les interactions sont automatisées ; le geste humain du picker et la recette sur les composants réels restent à Carlos.
- Promotion métier : tests existants verts pour forked/adapt, absence de stableVersion automatique, marqueur manager-variant-to-review et source intacte. Aucun changement des services/migrations/contrats Bridge. Dernière migration du code : 49.
- Fichiers : ProjectsPage.tsx ; ProjectPageCompositionPanel.tsx/.css ; ProjectCompositionItemSettings.tsx ; nouveau componentPreview.ts ; AtoumWebCompositionService.test.ts ; nouveau scripts/check-project-composition-ui.cjs ; PROJECT_STATUS.md ; présente roadmap.
- Suite complète et packaging non lancés ; aucune dépendance installée. Aucun commit/push. Prochaine action : Carlos teste la branche locale, en priorité disparition de la barre et composants auparavant blancs ; ne pas annoncer une recette réelle terminée sur la seule base des fixtures.


### 2026-09-29 — LOT6B-REPRISE-CHATGPT-001 — Reprise du travail Codex interrompu

- Origine : limite d'utilisation Codex atteinte après modifications locales 6B ; travail sauvegardé par Carlos sur `wip/codex-6b-ui-fix`.
- Revue : les apports Codex sont conservés, notamment ciblage des textes par chemin DOM, réglages visuels génériques et isolation des aperçus par Shadow DOM.
- Important : l'entrée précédente mentionne 31/31 contrôles Chromium réussis, mais la dernière exécution transmise par Carlos s'est arrêtée avant la recette sur `ERR_FAILED (-2)` au chargement de la fixture, avec plusieurs sorties GPU Windows. Cette valeur 31/31 ne doit donc pas être considérée comme validation finale du HEAD WIP actuel tant qu'un nouveau run reproductible n'a pas réussi.
- Cause racine de la « barre » confirmée dans le code Codex : `main.project-production-secondary` vide était encore rendu pour `detailTab='sites'`; son padding/bordure formaient la barre. La condition actuelle exclut bien `sites`.
- Harness Electron renforcé :
  - accélération matérielle désactivée pour le test ;
  - suppression du mode offscreen ;
  - BrowserWindow de fixture non sandboxée uniquement pour le banc de test local ;
  - diagnostics `did-fail-load` et `render-process-gone` ajoutés.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Validation restante : Carlos tire le HEAD WIP courant, exécute typecheck + tests ciblés + `node scripts/check-project-composition-ui.cjs`. Ne pas fusionner avant ces résultats.


### 2026-09-29 — LOT6B-REPRISE-CHATGPT-002 — Tests métier verts, harness UI encore diagnostique

- Validation MSI sur HEAD `0f090e012c43bd53282925f5194b874639e171c4` :
  - `npm run typecheck` : réussi ;
  - Vitest ciblés : **35/35 réussis**, 4 fichiers, 0 échec ;
  - warning Vite CJS uniquement.
- `node scripts/check-project-composition-ui.cjs` démarre désormais Electron mais s'interrompt sur une erreur renderer générique `Script failed to execute` avant de fournir le contrôle fautif.
- Conclusion : ne pas remettre en cause la logique métier 6B déjà couverte par les tests ; le blocage restant concerne le banc UI/renderer.
- Harness renforcé à nouveau :
  - chaque évaluation renderer est maintenant encapsulée et nommée ;
  - les exceptions JavaScript et stacks renderer sont remontées ;
  - les clics et saisies indiquent précisément l'élément absent/désactivé ;
  - les derniers messages console renderer sont joints au diagnostic.
- Aucun fichier métier modifié dans ce sous-lot ; uniquement le script de contrôle.
- Prochaine action : tirer le nouveau HEAD WIP et relancer seulement `node scripts/check-project-composition-ui.cjs` afin d'identifier le premier contrôle fautif avant toute nouvelle correction fonctionnelle.


### 2026-09-29 — LOT6B-RESPONSIVE-001 — Largeurs responsive déterministes

- Validation du harness : 31/33 contrôles réussis ; seuls « Largeur tablette » et « Largeur mobile » échouaient.
- Mesures : état React correct (`Tablette` / `Mobile` actifs), style inline correct (`768px` / `390px`), mais largeur mesurée intermédiaire/étirée.
- Cause retenue : transition CSS de largeur sur le wrapper d'aperçu, rendant le contrôle déterministe impossible et produisant notamment une largeur mobile intermédiaire.
- Correction : suppression de `transition: width .15s ease` et verrouillage du wrapper avec `flex:0 0 auto; min-width:0`.
- Aucun changement métier ni migration.
- Validation attendue : relancer uniquement `node scripts/check-project-composition-ui.cjs` ; cible 33/33.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-001 — Validation automatique 6B verte

- Validation MSI sur le HEAD `d9d545b64608e7dc1e2b7e1584402e7fcd5ba153`.
- `npm run typecheck` : réussi.
- Vitest ciblés :
  - migrations : 10/10 ;
  - AtoumWebCompositionService : 12/12 ;
  - AtoumWebTechnicalLibraryService : 11/11 ;
  - AtoumWebCompositionPackageService : 2/2 ;
  - total : **35/35**, 0 échec.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **33/33 contrôles réussis**, 0 échec.
- Les deux derniers écarts responsive (Tablette/Mobile) ont été corrigés par suppression de la transition de largeur et verrouillage du wrapper d'aperçu.
- Avertissement restant : API `console-message` Electron dépréciée dans le harness de test uniquement ; aucun impact fonctionnel.
- Statut : validation automatique 6B **verte**.
- Étape suivante : recette visuelle manuelle de Carlos dans le vrai Manager avant toute réintégration de la branche WIP vers `feature/project-page-compositions-v1`.


### 2026-09-29 — LOT6B-UX-004 — Mode atelier compact, aperçu docké et validation explicite

- Origine : recette visuelle de Carlos après checkpoint automatique 33/33.
- Objectif : libérer l'espace de travail pendant la préparation d'une Page sans supprimer les informations ni les vues de contrôle.
- En-tête Projet :
  - ajout d'une action **« ↑ Réduire »** ;
  - état compact affichant seulement retour Projets, numéro/nom du Projet et **« ↓ Afficher l’en-tête »**.
- Bandeau Sites & pages :
  - repli/dépli via flèche haut/bas ;
  - en mode replié, le descriptif est masqué mais les actions + Site / + Page restent accessibles.
- Arborescence gauche :
  - bouton **←** pour la masquer ;
  - la fiche Page récupère alors presque toute la largeur ;
  - rail compact **→** permanent pour restaurer l'arborescence ;
  - séparateur de redimensionnement conservé lorsque l'arborescence est ouverte.
- Informations Page :
  - Nom, Site, Rôle et Slug remontés **au-dessus de la composition** ;
  - panneau repliable « Informations de la Page » ;
  - résumé visible même replié avec Page / Site / rôle / slug.
- Code / aperçu d'une occurrence :
  - n'ouvre plus immédiatement une modale ;
  - ouvre un **volet docké à droite** de la composition ;
  - volet avec scroll propre, aperçu direct et HTML/CSS/JavaScript ;
  - boutons **Desktop / Tablette / Mobile** dans le volet ;
  - bouton **Agrandir** conservé et ouvrant la vue grand format ;
  - même sélection responsive disponible en grand format ;
  - bouton de fermeture du volet et état actif sur l'occurrence sélectionnée.
- Réglages locaux :
  - barre d'actions rendue sticky ;
  - aperçu du module rendu sticky pendant le scroll des réglages ;
  - suppression des overflow susceptibles de casser le sticky ;
  - action primaire explicite **« ✓ Valider les changements »** ;
  - après sauvegarde : état **« ✓ Changements validés »** désactivé tant qu'aucune nouvelle modification n'existe ;
  - bouton disponible en haut et en bas de l'éditeur.
- Harness UI mis à jour pour couvrir :
  - ordre Informations Page → Composition ;
  - repli/restauration de l'arborescence ;
  - volet Code / aperçu docké ;
  - responsive Tablette/Mobile du volet ;
  - agrandissement ;
  - validation explicite des réglages.
- Aucun changement métier, aucune migration supplémentaire, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, **validation typecheck/tests/UI et recette visuelle Carlos encore requises**.


### 2026-09-29 — LOT6B-UX-005 — Troisième colonne indépendante et timer compact

- Retour de recette : les accordéons haut/gauche et le panneau Informations de la Page sont validés visuellement.
- Timer Page :
  - réduction de la hauteur et des espacements ;
  - temps, nombre de sessions et commandes regroupés dans une barre compacte ;
  - aucune modification de la logique de chronométrage.
- Code / aperçu :
  - suppression du partage interne de la colonne Page ;
  - rendu du volet via un host externe dans l'espace `Sites & pages` ;
  - structure cible : **Arborescence | Fiche Page | Code / aperçu** ;
  - la colonne Code / aperçu possède son propre séparateur de redimensionnement ;
  - largeur réglable indépendamment, double-clic pour revenir au réglage par défaut ;
  - rail de repli indépendant : **→ masquer**, **← restaurer** ;
  - le panneau central reste une colonne autonome et n'est plus découpé en deux ;
  - modes Desktop / Tablette / Mobile et agrandissement plein écran conservés.
- Le repli des colonnes reste volontairement manuel : aucun masquage automatique de l'arborescence selon la largeur de fenêtre.
- Harness UI adapté pour contrôler :
  - timer compact ;
  - vraie troisième colonne indépendante ;
  - repli/restauration de la colonne Code / aperçu ;
  - conservation des modes responsive.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation locale requise.


### 2026-09-29 — LOT6B-UX-006 — Stabilisation troisième colonne et timer compact

- Reprise après contrôle UI : quatre échecs observés, dont deux faux négatifs du harness et un vrai défaut de cycle React sur le host de la troisième colonne.
- Faux négatif « Informations Page placées avant la composition » : `compareDocumentPosition()` renvoyait le bitmask `4`, correct mais différent de la valeur booléenne stricte attendue. Test corrigé avec `Boolean(...)`.
- Cause réelle de l'absence de la troisième colonne :
  - le host DOM du portal Code / aperçu n'était créé qu'après `inspectorOpen=true` ;
  - le composant enfant tentait donc de créer son portal avant que le host existe ;
  - résultat : pas de dock monté, donc pas de bouton de repli.
- Correction : le shell/host de la colonne Code / aperçu reste toujours monté dans le DOM mais est masqué via `.inactive` tant qu'aucun aperçu n'est ouvert. Le portal dispose ainsi toujours d'une destination stable.
- Timer Page :
  - hauteur réduite à une barre réellement compacte ;
  - libellés raccourcis `Production →` / `▶ Démarrer` avec `title` descriptifs ;
  - temps et sessions sur une seule ligne ;
  - boutons non wrappés.
- Harness : seuil du timer resserré à 60 px et diagnostic de hauteur en cas d'échec.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : correctifs poussés sur `wip/codex-6b-ui-fix`, validation typecheck + harness UI requise.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-002 — Validation UX 3 colonnes verte

- Validation MSI sur HEAD `81360b574b97ec8871254ab0faffcf3303442b1f`.
- `npm run typecheck` : réussi.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **46/46 contrôles réussis**, 0 échec.
- La nouvelle structure est donc validée automatiquement :
  - arborescence gauche rétractable/restaurable ;
  - informations Page repliables au-dessus de la composition ;
  - timer Page compact ;
  - vraie troisième colonne indépendante `Code / aperçu` ;
  - repli/restauration de la colonne droite ;
  - responsive Desktop/Tablette/Mobile ;
  - agrandissement ;
  - réglages locaux et validation explicite ;
  - aperçu global et isolation CSS.
- Avertissement restant : événement Electron `console-message` déprécié dans le harness de test uniquement ; aucun impact fonctionnel sur le Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle Carlos dans le vrai Manager avant toute réintégration de la branche WIP.


### 2026-09-29 — LOT6B-UX-007 — Atelier latéral unifié Réglages + Code / aperçu

- Retour de recette visuelle :
  - une bordure/ligne sticky du panneau Réglages passait visuellement au-dessus des champs ;
  - l'aperçu du panneau Réglages n'était pas scrollable/interactif ;
  - le volet Code / aperçu ne rendait pas HTML/CSS/JS assez accessibles en mode normal ;
  - souhait d'une logique identique entre Réglages et Code / aperçu, avec possibilité de les comparer côte à côte.
- Arbitrage UX :
  - abandon du panneau Réglages inline dans la fiche Page ;
  - Réglages et Code / aperçu utilisent désormais le **même atelier latéral indépendant** ;
  - un seul volet peut être ouvert, ou les deux sur le même composant ;
  - si les deux sont ouverts sur le même composant, l'atelier passe en mode **double volet côte à côte** ;
  - sur largeur plus faible, les deux volets se réorganisent verticalement plutôt que de rendre quatre colonnes illisibles ;
  - ouvrir un outil sur une occurrence différente ferme l'outil de l'autre occurrence pour éviter les comparaisons ambiguës.
- Réglages dockés :
  - toolbar non sticky dans le volet, supprimant le chevauchement des champs ;
  - scroll propre au volet ;
  - aperçu local placé en tête du volet ;
  - aperçu interactif / scrollable à la souris ;
  - validation, Undo/Redo, retour Bibliothèque et promotion conservés ;
  - bouton de fermeture intégré.
- Code / aperçu :
  - aperçu interactif et scrollable ;
  - zone HTML/CSS/JavaScript réservée et scrollable dans le volet normal, sans exiger le grand écran ;
  - Desktop / Tablette / Mobile et Agrandir conservés.
- Synchronisation :
  - le brouillon des Réglages est remonté en direct ;
  - lorsque Réglages + Code / aperçu concernent la même occurrence, le code et l'aperçu du volet Code utilisent immédiatement le brouillon non encore validé ;
  - l'agrandissement Code / aperçu utilise également ce brouillon.
- Largeur atelier :
  - largeur augmentée automatiquement en mode double volet ;
  - colonne gauche réduite en proportion sans être masquée automatiquement ;
  - repli manuel gauche/droite conservé.
- Harness UI étendu pour contrôler :
  - Réglages réellement dockés ;
  - absence de Réglages inline ;
  - aperçu Réglages interactif et scrollable ;
  - mode double volet ;
  - HTML visible en mode normal ;
  - synchronisation du brouillon Réglages vers Code / aperçu.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, typecheck + harness + recette visuelle requis.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-003 — Atelier latéral unifié validé automatiquement

- Validation MSI sur HEAD `a574adbaa3a29f324af2277542a2a2fe5102ef5d`.
- `npm run typecheck` : réussi.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **50/50 contrôles réussis**, 0 échec.
- Sont désormais couverts automatiquement :
  - Réglages dockés dans l'atelier latéral ;
  - absence de panneau Réglages inline dans la fiche Page ;
  - aperçu Réglages interactif et scrollable ;
  - Code / aperçu dans le même atelier ;
  - mode Réglages + Code / aperçu simultané ;
  - HTML/CSS/JavaScript accessibles dans le volet normal ;
  - synchronisation en direct du brouillon Réglages vers Code / aperçu ;
  - agrandissement et responsive conservés ;
  - repli/restauration des colonnes et timer compact.
- Avertissement restant : dépréciation Electron `console-message` dans le harness uniquement ; aucun impact fonctionnel sur le Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle finale Carlos avant réintégration de la branche WIP.


### 2026-09-29 — LOT6B-UX-008 — Repli indépendant des quatre panneaux de l’atelier

- Retour de recette : le repli de l’arborescence et de l’atelier latéral est apprécié, mais la fiche Page ne disposait pas de son propre bouton et les volets Réglages / Code devaient pouvoir être réduits séparément lorsqu’ils sont affichés côte à côte.
- Objectif : chaque panneau visible de l’écran Sites & pages dispose de son propre mécanisme de réduction / restauration, jusqu’à quatre panneaux simultanés.
- Panneau 1 — Arborescence :
  - comportement existant conservé ;
  - réduction vers un rail étroit, restauration immédiate.
- Panneau 2 — Fiche Page :
  - ajout d’un bouton « Réduire la fiche Page » ;
  - la fiche devient un rail de 46 px ;
  - bouton « Afficher la fiche Page » pour la restaurer ;
  - le grid principal redistribue l’espace libéré à l’atelier latéral lorsqu’il est ouvert.
- Panneau 3 — Réglages :
  - ajout d’un bouton « Réduire Réglages » dans la toolbar ;
  - le volet reste ouvert logiquement mais se transforme en rail ;
  - restauration via « Afficher Réglages » sans perdre le brouillon courant.
- Panneau 4 — Code / aperçu :
  - ajout d’un bouton « Réduire Code / aperçu » ;
  - le volet se transforme en rail indépendant ;
  - restauration via « Afficher Code / aperçu » sans perdre le device sélectionné ni le brouillon synchronisé.
- Atelier latéral global :
  - le repli global existant est conservé ;
  - libellés renommés en « Réduire / Afficher l’atelier latéral » car le conteneur peut désormais héberger Réglages, Code / aperçu ou les deux.
- Largeur :
  - si l’un des deux sous-volets latéraux est réduit, l’atelier latéral peut revenir à une largeur simple ;
  - si la fiche Page est réduite, l’atelier latéral récupère l’espace disponible.
- Harness UI étendu pour contrôler :
  - repli/restauration de la fiche Page ;
  - repli/restauration individuel de Réglages ;
  - repli/restauration individuel de Code / aperçu ;
  - présence simultanée des quatre commandes de repli.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, typecheck + harness + recette visuelle requis.


### 2026-09-29 — LOT6B-UX-009 — Découplage réel des replis Réglages / Code

- Retour de recette : réduire un sous-panneau latéral réduisait aussi visuellement son voisin.
- Cause :
  - l'état parent `inspectorDual` passait à `false` dès que Réglages ou Code / aperçu était replié ;
  - le conteneur latéral recalculait alors toute sa largeur comme un atelier simple ;
  - le panneau voisin perdait donc lui aussi de la largeur.
- Correction :
  - le mode double atelier dépend désormais uniquement du fait que **Réglages et Code / aperçu sont ouverts** ;
  - l'état replié d'un sous-panneau n'influence plus la largeur globale de l'atelier ;
  - réduire Réglages transforme uniquement Réglages en rail ; Code / aperçu conserve l'espace latéral disponible ;
  - réduire Code / aperçu transforme uniquement Code en rail ; Réglages conserve l'espace latéral disponible.
- Harness UI renforcé :
  - mesure de la largeur de l'atelier avant repli ;
  - repli Réglages ;
  - vérification que Code / aperçu reste ouvert ;
  - vérification que la largeur globale de l'atelier reste stable à ±2 px ;
  - restauration Réglages avant poursuite du parcours.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : correctif poussé sur `wip/codex-6b-ui-fix`, validation locale requise.


### 2026-09-29 — LOT6B-UX-010 — Repositionnement du bouton de repli de la fiche Page

- Retour de recette visuelle : le bouton de réduction de la colonne Fiche Page flottait en haut à droite et chevauchait visuellement le badge `6B · Composition AtoumWeb`.
- Correction :
  - suppression du positionnement sticky/flottant du bouton de repli ;
  - intégration du bouton dans un groupe d'actions de l'en-tête de la fiche ;
  - sur une Page : badge 6B puis bouton de repli, alignés proprement ;
  - sur un Site : statut éventuel puis bouton de repli ;
  - état vide conservé avec un bouton local positionné dans la fiche.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : correctif poussé sur `wip/codex-6b-ui-fix`, validation locale requise.


### 2026-09-29 — LOT6B-UX-011 — Replis persistants, largeur réellement libérée et grand écran d’atelier

- Retours de recette successifs :
  - réduire la fiche Page rendait les volets Réglages / Code vides car leur composant parent était démonté ;
  - réduire Réglages ou Code ne libérait pas complètement la largeur réservée ;
  - le bouton « Agrandir » ouvrait seulement le visuel Code, sans donner accès aux Réglages en grand.
- Fiche Page :
  - la fiche n’est plus démontée lors du repli ;
  - elle reste montée dans le DOM et son contenu est uniquement masqué derrière un rail de 46 px ;
  - les portals Réglages / Code restent donc vivants ;
  - brouillons, états, scrolls, device responsive et code restent accessibles pendant que la fiche Page est réduite.
- Repli total des sous-volets :
  - le parent reçoit désormais le nombre de volets réellement déployés ;
  - largeur de l’atelier calculée selon 0 / 1 / 2 volets déployés ;
  - replier un sous-volet rend réellement sa largeur à la fiche Page ;
  - si les deux sous-volets sont réduits, l’atelier droit se limite presque aux seuls rails de restauration ;
  - lorsqu’un seul reste ouvert, l’autre ne conserve plus une grande zone vide.
- Grand écran :
  - suppression de l’ancienne modale « aperçu Code seul » ;
  - « Agrandir » passe maintenant **le même atelier latéral courant** en plein écran ;
  - aucun remount des éditeurs : brouillon, Undo/Redo, validation et synchro en direct restent intacts ;
  - si Réglages + Code sont ouverts, les deux apparaissent en grand ensemble ;
  - si un seul outil est ouvert, seul celui-ci occupe le grand écran ;
  - bouton « Agrandir » ajouté également à la barre Réglages ;
  - bouton global « Quitter le grand écran » toujours visible ;
  - Desktop / Tablette / Mobile et HTML/CSS/JS restent utilisables en grand.
- Clarification UX :
  - le bouton de l’aperçu interne Réglages est renommé « Voir le module seul » ;
  - « Agrandir » désigne désormais uniquement l’agrandissement de l’atelier complet.
- Harness UI mis à jour pour vérifier :
  - Page réduite sans perte des deux volets ;
  - gain réel de largeur lors du repli Réglages ;
  - grand écran depuis Code ;
  - grand écran contenant simultanément Réglages + Code.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation typecheck + harness + recette visuelle requise.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-004 — Replis persistants et atelier grand écran validés automatiquement

- Validation MSI sur HEAD `269a96b57ffb96a9fb9e5250533d9eefbcce6e7c`.
- `npm run typecheck` : réussi.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **61/61 contrôles réussis**, 0 échec.
- Sont notamment couverts :
  - fiche Page réduite sans démontage des volets latéraux ;
  - Réglages et Code / aperçu conservés lorsque la fiche Page est réduite ;
  - replis individuels persistants ;
  - restitution réelle de largeur lors du repli d'un sous-volet ;
  - atelier complet agrandissable depuis Code ;
  - atelier complet agrandissable depuis Réglages ;
  - grand écran contenant simultanément Réglages + Code / aperçu ;
  - conservation du brouillon et de la synchronisation en direct.
- Avertissement restant : dépréciation Electron `console-message` dans le harness uniquement ; aucun impact fonctionnel Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle finale avant réintégration de la branche WIP.


### 2026-09-29 — LOT6B-UX-012 — Plein écran harmonisé Réglages / Code avec aperçu prioritaire

- Retour de recette visuelle :
  - le grand écran Réglages et le grand écran Code n'avaient pas la même logique de lecture ;
  - l'aperçu Réglages était encore trop petit ;
  - souhait d'un comportement identique entre les deux modes grand écran.
- Arbitrage UX :
  - en plein écran avec un seul outil ouvert, Réglages et Code utilisent désormais le même principe :
    - **grande visualisation à gauche (~70 %)** ;
    - **zone de travail à droite (~30 %)** ;
    - chaque zone garde son propre scroll ;
  - le plein écran gagne aussi quelques pixels utiles en réduisant les marges externes.
- Réglages :
  - ajout de Desktop / Tablette / Mobile directement dans l'aperçu Réglages ;
  - le device sélectionné est partagé avec Code / aperçu ;
  - aperçu scrollable dans un viewport dédié ;
  - en grand écran, aperçu plein hauteur à gauche et contrôles scrollables à droite.
- Code / aperçu :
  - en grand écran, preview plein hauteur à gauche ;
  - HTML / CSS / JavaScript restent accessibles dans une colonne de travail à droite ;
  - Desktop / Tablette / Mobile conservés ;
  - même ratio visuel que Réglages.
- Cohérence :
  - les boutons « Agrandir » internes sont masqués une fois déjà en grand écran ;
  - « Voir le module seul » reste réservé à l'aperçu isolé du module ;
  - l'atelier complet conserve son bouton « Quitter le grand écran ».
- Harness UI étendu pour vérifier :
  - responsive Desktop/Tablette/Mobile dans Réglages ;
  - largeur tablette à 768 px ;
  - grand écran Réglages avec visualisation dominante ;
  - grand écran Code avec visualisation dominante ;
  - parité de fonctionnement entre les deux outils.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation typecheck + harness + recette visuelle requise.


### 2026-09-29 — LOT6B-UX-013 — Grand écran 75/25 verrouillé avec colonne outils scrollable

- Retour de recette :
  - en grand écran Réglages, la prévisualisation restait trop proche d'un partage 50/50 ;
  - souhait d'une page nettement plus grande à gauche et d'un défilement des commandes uniquement à droite ;
  - même demande pour la vue Code / aperçu.
- Correction :
  - disposition grand écran verrouillée par zones CSS explicites, afin que le contenu des formulaires ne puisse plus élargir la colonne outils ;
  - ratio cible : **environ 75 % aperçu / 25 % outils** ;
  - Réglages :
    - preview à gauche sur toute la hauteur utile ;
    - Textes / Éléments visuels / Couleurs / Code avancé / promotion dans une colonne droite indépendante ;
    - scroll vertical uniquement sur la colonne commandes ;
  - Code / aperçu :
    - preview à gauche sur toute la hauteur utile ;
    - HTML / CSS / JavaScript dans une colonne droite indépendante ;
    - scroll vertical uniquement sur la colonne code ;
  - responsive Desktop / Tablette / Mobile conservé dans les deux vues.
- Harness renforcé :
  - ratio aperçu/outils >= 2,2 en grand écran ;
  - colonne outils explicitement scrollable dans Réglages et Code.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation harness + recette visuelle requise.


### 2026-09-29 — LOT6B-TEST-014 — Débordement responsive volontaire distingué des vrais masquages

- Validation locale précédente : typecheck vert, harness **64/65** ; seul le contrôle « Pas de contenu horizontal masqué dans les réglages » échouait.
- Cause :
  - les aperçus Tablette / Mobile utilisent volontairement une largeur fixe (768 / 390 px) dans un viewport `overflow:auto` ;
  - l’ancien contrôle considérait tout `scrollWidth > clientWidth` comme une erreur, même lorsque le débordement était explicitement scrollable.
- Correction du harness :
  - les éléments ou ancêtres en `overflow-x:auto|scroll` sont désormais considérés comme des zones de débordement volontaire ;
  - les vrais débordements cachés restent détectés ;
  - en cas de nouvel échec, le harness renvoie maintenant les éléments fautifs avec tag, classe, largeur visible et largeur scrollable.
- Aucun changement fonctionnel Manager, aucune migration, aucun changement Bridge.
- Statut : correctif de test poussé sur `wip/codex-6b-ui-fix`, rerun harness requis.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-005 — Grand écran 75/25 validé automatiquement

- Validation MSI sur HEAD `d464ad2b2d7f500a6a1443059e50f706dc244200`.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **65/65 contrôles réussis**, 0 échec.
- Le contrôle de débordement horizontal distingue désormais correctement :
  - les vrais contenus masqués ;
  - les débordements volontaires contenus dans une zone scrollable (notamment preview Tablette / Mobile).
- Sont couverts à ce checkpoint :
  - grand écran Réglages avec aperçu dominant ;
  - grand écran Code avec aperçu dominant ;
  - ratio aperçu / outils verrouillé ;
  - colonne commandes scrollable ;
  - responsive Desktop / Tablette / Mobile ;
  - replis persistants et indépendants ;
  - conservation des volets lors du repli de la fiche Page ;
  - synchro en direct du brouillon Réglages vers Code / aperçu.
- Avertissement restant : dépréciation Electron `console-message` dans le harness uniquement ; aucun impact fonctionnel Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle finale avant réintégration.


### 2026-09-29 — LOT6B-RECETTE-FINALE-001 — Recette visuelle validée et préparation de clôture

- Recette visuelle réelle validée par Carlos sur le Manager MSI après les itérations UX du 29/09/2026.
- Validation finale automatisée :
  - `npm run typecheck` : réussi ;
  - harness Electron `scripts/check-project-composition-ui.cjs` : **65/65 contrôles réussis**, 0 échec ;
  - tests Vitest ciblés déjà validés pendant la stabilisation : **35/35** ;
  - migration courante inchangée : **49**, aucune migration ajoutée par la passe UX.
- Recette visuelle validée :
  - arborescence rétractable ;
  - fiche Page rétractable sans démontage des outils ;
  - Réglages rétractables/restaurables indépendamment ;
  - Code / aperçu rétractable/restaurable indépendamment ;
  - Réglages + Code utilisables côte à côte ;
  - brouillon Réglages synchronisé en direct avec Code / aperçu ;
  - aperçu scrollable ;
  - responsive Desktop / Tablette / Mobile ;
  - grand écran Réglages et Code harmonisé ;
  - grand écran avec aperçu dominant (~75 %) et outils scrollables (~25 %) ;
  - validation explicite, Undo / Redo, Version Bibliothèque et promotion en variante conservés.
- Comparaison GitHub contrôlée avant l'ouverture de la PR de réintégration :
  - `wip/codex-6b-ui-fix` est **strictement devant / 0 derrière** `feature/project-page-compositions-v1` ;
  - merge base : `39315436376ba81470ed5fc0cbdad92c457ce553` ;
  - aucune divergence concurrente détectée entre la branche canonique 6B et la WIP ;
  - aucun PR ouvert actuellement pour la WIP ni pour `feature/project-page-compositions-v1`.
- Aucun changement Bridge effectué pendant cette stabilisation UX.

#### Clôture officielle Lot 6B — effectuée le 29/09/2026

1. [x] Working tree MSI propre avant intégration ; checkout synchronisé sur `feature/project-page-compositions-v1`.
2. [x] PR **#75** intégrée le 29/09/2026 depuis `wip/codex-6b-ui-fix` ; merge commit `3df2168d7a3e662d98f68525550309ea71be0d67`.
3. [x] Validation post-intégration sur le HEAD canonique `3df2168d7a3e662d98f68525550309ea71be0d67` : typecheck réussi, harness Electron **65/65**, tests ciblés **35/35**.
4. [x] Gate complet et packaging confirmés : suite **53 fichiers / 339 tests réussis**, package Windows **win32 x64** réussi.
5. [x] Lot 6B marqué clos dans `PROJECT_STATUS.md` et ce journal. Aucune fusion vers `main` ; aucun code UX repris après validation.
6. Nettoyage facultatif / faible priorité :
   - adapter le listener Electron `console-message` du harness à la nouvelle signature pour supprimer le warning de dépréciation ;
   - aucun impact fonctionnel Manager en l'état.

#### Après Lot 6B — ordre de travail recommandé

- **Lot 7 — Site / préparation Bridge** :
  - partir de la chaîne validée `Devis accepté → Projet → Site → Page → Composition → occurrences` ;
  - préparer l'export/package au niveau de la Page/Site sans imposer une Page 100 % issue de la Bibliothèque ;
  - conserver Divi comme atelier principal ;
  - ne pas casser les contrats Component / Fields / Identity existants.
- **Lot 8 — retour d'occurrences** :
  - retour Bridge occurrence par occurrence ;
  - provenance immutable ;
  - rattachement au Projet/Site/Page/composition/occurrence correct ;
  - réanalyse et validation humaine.
- **Lot 9 — assemblage multi-pages / livraison** :
  - seulement après validation des Lots 7 et 8 ;
  - aucune publication production automatique avant recette dédiée.
- Les chantiers CGV et autres branches parallèles restent indépendants ; aucune réécriture ou renumérotation des migrations 40–49.


### 2026-09-29 — LOT6B-INTEGRATION-PR-001 — PR de réintégration créée

- PR **#75** créée en brouillon : `wip/codex-6b-ui-fix` → `feature/project-page-compositions-v1`.
- Objet : regrouper toute la stabilisation UX 6B validée sans fusion automatique.
- La PR rappelle les validations acquises : typecheck vert, **65/65** harness, **35/35** tests ciblés historiques, migration 49 inchangée, recette visuelle validée.
- Au moment de cette entrée, la PR était en brouillon et aucun merge n'avait encore été effectué ; voir l'entrée de clôture ci-dessous pour son état final.
- Les derniers gates documentaires (suite complète / packaging) puis les contrôles post-intégration sont désormais confirmés verts.


### 2026-09-29 — LOT6B-GATE-FULL-SUITE-001 — Suite complète 336/339 puis correctifs transverses

- Gate de clôture lancé sur MSI après recette visuelle 6B :
  - `git status -sb` propre sur `wip/codex-6b-ui-fix` ;
  - `npm test` : **53 fichiers**, **339 tests**, premier passage **336 réussis / 3 échoués**.
- Échec 1 — `StabilisationPhase19.test.ts` :
  - test historique figé sur migrations 19→38 ;
  - base courante 19→49 ;
  - correction : comparaison avec la chaîne réellement retournée par `getPendingMigrations`, tout en conservant le contrôle que 19/20/21 restent les trois premières.
- Échec 2 — `WorkflowService.test.ts` / `specialTerms` :
  - ancien test attendait la condition catalogue « 40 % » directement dans `quote.specialTerms` ;
  - depuis le Builder CGV, `specialTerms` est une condition particulière libre du devis et peut rester vide ;
  - la condition catalogue reste figée dans le snapshot de ligne ;
  - correction : vérifier `specialTerms === null` puis la présence de « 40 % » dans `lines[0].snapshot.specialTerms`.
- Échec 3 — purge scénario e-commerce :
  - `quote_contract_clauses` créé par la compilation CGV n'était pas inclus dans les tables métier suivies par `DemoService` ;
  - ces lignes étaient donc vues comme « non demo » et bloquaient volontairement le reset ;
  - correction : ajout de `quote_contract_clauses` dans `TABLES` pour héritage du batch via FK `quote_id` et suppression enfant→parent.
- Aucun changement UX 6B, aucune migration, aucun changement Bridge.
- Statut : correctifs poussés, **rerun complet `npm test` requis** avant clôture.


### 2026-09-29 — LOT6B-CHECKPOINT-FINAL-002 — Suite complète et packaging verts

- Validation MSI après correction des trois derniers échecs transverses :
  - `npm test` : **53 fichiers de tests réussis / 53** ;
  - **339 tests réussis / 339** ;
  - durée Vitest : 7,81 s ;
  - aucune erreur de test restante.
- Correctifs inclus avant cette validation :
  - test de migration legacy aligné dynamiquement sur la chaîne courante jusqu'à la migration **49** ;
  - test Workflow aligné avec le Builder CGV structuré : `specialTerms` du devis reste libre, la condition catalogue reste figée dans le snapshot de ligne ;
  - `DemoService` suit désormais `quote_contract_clauses` afin que les scénarios de démonstration puissent être purgés sans faux positif de données non-demo.
- Packaging :
  - `npm run package` / `electron-forge package` : **réussi** ;
  - bundles Vite main + preload + renderer : réussis ;
  - package **win32 x64** généré avec succès ;
  - hooks prePackage / postPackage : réussis.
- Gates 6B désormais verts :
  - typecheck ;
  - harness UI **65/65** ;
  - suite complète **339/339** ;
  - packaging Windows x64 ;
  - recette visuelle réelle validée.
- La PR #75 a depuis été intégrée ; le merge et les validations post-intégration sont consignés dans `LOT6B-CLOSURE-PR-001` ci-dessous.
- Aucun changement Bridge dans cette passe.


### 2026-09-29 — LOT6B-CLOSURE-PR-001 — PR #75 intégrée et Lot 6B clos

- PR **#75** fusionnée dans `feature/project-page-compositions-v1` le 29/09/2026 ; URL : https://github.com/atoumweb-prog/atoumweb-manager/pull/75.
- Merge commit et nouveau HEAD canonique : `3df2168d7a3e662d98f68525550309ea71be0d67`.
- La branche WIP `wip/codex-6b-ui-fix` a été conservée ; `main` n'a pas été touchée.
- Carlos a synchronisé le checkout canonique par fast-forward et confirmé le HEAD attendu.
- Contrôles post-intégration sur le HEAD canonique :
  - `npm run typecheck` : réussi ;
  - harness `scripts/check-project-composition-ui.cjs` : **65 réussis / 0 échec** ;
  - tests ciblés (migrations, CompositionService, TechnicalLibraryService, CompositionPackageService) : **35 réussis / 0 échec**.
- Gates complets déjà terminés sur le contenu fonctionnel de cette PR : `npm test` **339/339** et `npm run package` réussi pour Windows x64.
- Seul avertissement observé : API Electron `console-message` dépréciée dans le harness ; aucun échec ni impact fonctionnel signalé.
- Lot 6B clos. La suite de la feuille de route Manager ↔ Bridge est distincte et nécessite une autorisation explicite avant de commencer le Lot 7.


### 2026-09-29 — LOT7-BLUEPRINT-001 — Premier incrément Sites / Pages idempotent

- Autorisation : Carlos demande de continuer le projet après la clôture du Lot 6B.
- Branche dédiée : `codex/lot7-blueprint-sites`, créée depuis `feature/project-page-compositions-v1@cf747c5855eec90df725861d22375d65f78f12db`.
- Décision de modèle : ne pas déduire les Sites ou rôles de Page depuis le nom ou `semanticKey`. Une version de blueprint porte des déclarations Site/Page explicites, avec clés stables.
- Migration additive **50** : déclarations `project_template_sites` / `project_template_site_pages` et liaisons de provenance `project_blueprint_site_bindings` / `project_blueprint_page_bindings`.
- Le blueprint vitrine V1 déclare un Site principal, une Page Accueil et quatre Pages complémentaires, reliés aux nœuds de modèle existants.
- La création d'un Projet applique automatiquement le squelette. Une réapplication :
  - reconnaît les objets par leur provenance plutôt que par leur nom ;
  - ne crée pas de doublon ;
  - conserve renommages, domaines, rattachements et Pages manuelles ;
  - n'ajoute pas une nouvelle activité lorsqu'aucun changement n'est effectué.
- API interne/IPC ajoutée pour réappliquer explicitement un blueprint figé au Projet.
- Les versions brouillon exposent une configuration typée Site/Page ; la création d'une version recopie les déclarations en les reliant aux nouveaux identifiants de nœuds.
- L'écran Sites & pages propose « Initialiser depuis le blueprint » pour les Projets historiques. Un blueprint sans déclaration est signalé explicitement.
- Validation locale : typecheck réussi ; **31/31 tests ciblés** (migrations 10, ProjectService 12, ProjectSiteService 9).
- Harness Electron 6B : essai interrompu avant exécution des contrôles par l'arrêt du processus GPU Chromium sous Windows (`GPU process isn't usable`) ; aucune erreur renderer ou assertion fonctionnelle observée.
- Aucun contrat Bridge, export Page, `siteOccurrenceId`, retour d'occurrence ou code UX 6B modifié.
- État : travail local non commité/non poussé ; revue finale et recette fonctionnelle ciblée requises avant intégration.

### 2026-09-29 — LOT7-LEGACY-BLUEPRINT-001 — Compatibilité des anciens Projets web

- Recette réelle bloquante : `PRO-2026-001 - création de site vitrine` pointait vers l'ancienne version publiée « Projet standard », contenant uniquement une tâche et aucune déclaration Site/Page. La migration 50 avait correctement enrichi le blueprint vitrine canonique, mais le Projet historique ne le référençait pas.
- Décision : aucune déduction depuis le nom du Projet. Une table de compatibilité explicite associe les types `web` et `website` au blueprint Site/Page canonique.
- Cette compatibilité est portée par la migration additive **51**, séparée de 50 car la recette avait déjà enregistré la migration 50 dans le workspace MSI.
- Lorsqu'un ancien Projet n'a pas reçu les nœuds du blueprint canonique, le service matérialise seulement les cinq Pages déclarées et leurs ancêtres nécessaires, puis les rattache au Site principal.
- Le `template_version_id` historique du Projet reste inchangé. Les tâches existantes et les ajouts manuels sont conservés.
- La réapplication est idempotente : aucun Site, nœud Page, rattachement ou journal fonctionnel en double.
- Un type de Projet sans compatibilité déclarée reste sans structure et conserve le message explicite existant.
- Validation : typecheck réussi ; **33/33 tests ciblés** réussis (migrations 10, ProjectService 12, ProjectSiteService 11).
- Aucun commit ni push. Nouvelle recette réelle attendue avant intégration.

### 2026-09-29 — LOT7-RECETTE-STATE-001 — Rafraîchissement de l'arborescence après initialisation

- La recette réelle a confirmé le succès backend (« 1 Site créé, 5 Pages rattachées »), mais l'arborescence affichait encore 0 Page.
- Vérification directe en lecture seule de la base Validation-MSI : **1 Site, 5 nœuds Page et 5 rattachements** sont réellement enregistrés pour `PRO-2026-001`. Accueil possède le rôle `home` et le chemin `/`.
- Cause : `ProjectSitesTab.reload()` rechargeait les Sites et leurs rattachements, tandis que la liste des Pages restait dérivée de `detail.nodes`, prop du parent non rafraîchie après `applyBlueprint`.
- Correction : relire le `ProjectDetail` après application, transmettre cette version à `onProjectChanged`, puis recharger les Sites/rattachements.
- Validation : typecheck réussi ; **33/33 tests ciblés** toujours verts.
- Aucun commit ni push ; recette visuelle de confirmation attendue.

### 2026-09-29 — LOT7-RECETTE-FINALE-001 — Recette fonctionnelle validée

- Initialisation du Projet historique : **1 Site + 5 Pages** correctement affichés.
- Réapplication : aucun doublon.
- Renommage du Site conservé.
- Renommage d'une Page conservé.
- Ajout manuel d'une Page conservé.
- Résultat final observé : **1 Site / 6 Pages**.
- Gates acquis : typecheck réussi ; **33/33 tests ciblés** réussis.
- Lot 7 autorisé pour commit, push et ouverture d'une PR vers `feature/project-page-compositions-v1`.

### 2026-09-29 — LOT7-ARCHITECTURE-DEVIS-001 — Le devis compose le blueprint final

- Direction validée : **offre de base → options/prestations du devis → blueprint final du Projet**.
- L'offre principale choisit la contribution de base. Chaque ligne optionnelle peut ajouter des Pages, des structures métier, des tâches, des prérequis, des échéances et, selon son domaine, la préparation d'un pack, contrat ou intervention.
- Exemples attendus : Site vitrine 5 Pages comme base ; Page supplémentaire comme contribution Page ; Blog comme structure ; SEO local comme tâches/contrôles ; Maintenance comme pack/contrat/échéances ; Formation comme tâche ou intervention à planifier.
- Le socle possède déjà les concepts utiles : `catalog_project_blueprints`, résolution `base` / `addons`, `project_node_sources` et provenance par `quote_line_id`. Ils doivent devenir la source de composition, y compris pour les déclarations Site/Page et les autres objets préparés.
- La table `project_type_site_blueprints` de migration 51 reste strictement un mécanisme de reprise des anciens Projets dont le blueprint ne déclare aucune structure. Elle ne doit pas devenir la règle de création des nouveaux Projets.
- Évolution recommandée après le Lot 7 : faire produire à chaque contribution du devis des déclarations typées et fusionnables, avec clés stables et provenance de ligne, puis appliquer l'ensemble dans une transaction idempotente. Une contribution absente ou retirée doit être distinguée d'un objet déjà modifié manuellement afin d'éviter toute suppression implicite.
- Le Lot 7 conserve volontairement un périmètre restreint : il installe les primitives Site/Page et leur provenance, sans développer le moteur complet de composition commerciale.

### 2026-09-29 — LOT8A-MANAGER-EXPORT-001 — Enveloppe Page V2

- Branche locale empilée sur le Lot 7 validé : `codex/lot8a-page-export`. La PR #76 n'est pas fusionnée et `main` n'est pas touchée.
- Décision contractuelle : conserver le package projet générique V1 et ajouter une version 2 explicite du même contrat uniquement pour une préparation de Page.
- Champs obligatoires V2 : `scope=page`, `exportId`, puis `destination.projectId/siteId/pageId`.
- Le Manager refuse l'export si la Page n'est pas rattachée à un Site actif ou si elle ne possède pas de composition.
- Chaque export est enregistré comme objet immuable avec l'empreinte du ZIP en migration additive **52**.
- Les adaptations locales HTML/CSS/JS de chaque `compositionItemId` remplacent les fichiers transportés avec checksums recalculés ; l'identité et la provenance de la version Bibliothèque source restent inchangées.
- Bouton Page ajouté : « Préparer pour Bridge ». Aucun envoi direct et aucune publication WordPress.
- Documentation : `docs/ATOUMWEB_PAGE_PACKAGE_V2.md` et `docs/ATOUMWEB_PAGE_PACKAGE_V2.schema.json` ; validation du manifest exécutée avant écriture.
- Validation locale : typecheck réussi ; **14/14 tests ciblés** (package 4, migrations 10).
- Limite explicite : le plugin Bridge n'est pas modifié dans cet incrément. Import idempotent par `exportId`, accusé `compositionItemId ↔ siteOccurrenceId` et marqueur stable Divi restent à réaliser dans son dépôt source confirmé.
- État : local, sans commit ni push ; recette Manager du bouton d'export requise.

### 2026-09-29 — LOT8A-BRIDGE-IDEMPOTENCE-001 — Dépôt Bridge confirmé et incrément 0.8.1

- Dépôt local confirmé : `C:\DEV\01_PROJETS\AtoumWeb\atoumweb-bridge`.
- Après synchronisation GitHub, la vraie base Bridge est `feature/workbench-occurrence-v1@36d1076` en version **0.8.0**. Elle contient déjà le package projet multi-composants V1, le Workbench unique, les modules Code séparés et une occurrence par `compositionItemId`.
- Branche locale dédiée : `codex/lot8a-idempotent-page-import`, sans fusion vers `main`.
- Incrément 0.8.1 préparé : support Page V2, mémorisation de `exportId`, empreinte et destination ; réimport identique ouvrant le Workbench existant ; même `exportId` avec contenu différent refusé.
- L'import retourne et conserve les associations `compositionItemId ↔ siteOccurrenceId`.
- Le flux reste Workbench-first et la publication production reste désactivée.
- Le runtime PHP n'est pas disponible dans le `PATH` MSI : aucune installation ni recherche disque lancée. Validation syntaxique/runtime et recette réelle à effectuer avec le ZIP produit par Manager avant commit/push.

### 2026-09-30 — LOT8A-CHECKPOINT-001 — Recettes croisées et accès au package

- Recette Manager validée : une Page rattachée contenant des composants produit un package ZIP Page V2 ; une Page vide ne propose pas l'action ; le refus sans Site actif reste couvert par le test de service.
- Recette Bridge 0.8.1 validée : premier import réussi, rejeu strict sans doublon et refus d'un même `exportId` associé à un contenu différent.
- Correction Bridge validée : le Workbench multi-composants conserve tous les composants, dans leur ordre, après sauvegarde et réouverture du Visual Builder.
- Amélioration Manager : la notification « Package Page prêt » transporte une action explicite qui appelle l'IPC sécurisé existant et sélectionne le ZIP dans l'Explorateur Windows.
- Recette visuelle validée : un clic sur la notification ouvre le dossier d'exports et sélectionne le ZIP préparé. Le typecheck est vert et l'IPC réutilisé reste borné au dossier d'exports.
- Intégration terminée hors `main` : PR Manager #76 puis #77 fusionnées dans `feature/project-page-compositions-v1` ; PR Bridge #2 fusionnée dans `feature/workbench-occurrence-v1`.
- Checkpoint canonique : Manager `d2898b516e94d4c577795bab8508e7a126eeb4b1`, Bridge `283829914ea74dbe756b74ca62e7f0fc1dc3867f`.
- Validation finale Manager : typecheck vert, **37/37 tests ciblés** et **346/346 tests complets**.

### 2026-09-30 — ARCH-PRODUCTION-ASSETS-001 — Publication contrôlée et cycle de vie Divi Child

- Origine : cadrage Carlos après validation du checkpoint Lot 7 + 8A ; mise à jour documentaire uniquement.
- Décision : conserver les Lots 8B, 8C et 9 existants. Ajouter après eux le Lot 10 pour le registre/cycle de vie des assets gérés, puis le Lot 11 pour la publication contrôlée Workbench → Page finale.
- Publication cible : sélection explicite par identités stables Projet/Site/Page, snapshot avant, injection Divi, assets Divi Child, contrôle front, snapshot après, provenance et rollback complet. Aucune écriture automatique.
- Assets : identité stable, scope/propriétaire, provenance/version/hash, références d'utilisation, historique, état orphelin et nettoyage explicite. Les overrides humains et fichiers non gérés restent protégés.
- Prochaine action recommandée : Lot 8B uniquement, après autorisation explicite. Aucun code 8B, 10 ou 11 commencé par cette entrée.

### 2026-10-03 — CONTRACT-LOT1-001 — Brouillon, gel et preuve historique

- Origine : audit Manager validé par AtoumWeb et autorisation du seul Lot 1 « Sécuriser brouillon et gel ». Lot 8B clos ; 8C suspendu.
- Base locale vérifiée propre avant travaux : branche canonique Manager, HEAD `ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81`. Les checkpoints 7/8A ci-dessus restent historiques.
- Le Builder enregistre désormais clauses et nouvelles versions en brouillon ; la publication est une action distincte sur une version enregistrée.
- Un snapshot vide est figé explicitement par son texte vide, JSON et date. Les lectures/copies/exports ne recalculent pas ce gel ; les textes et versions figés restent identiques après évolution de la bibliothèque.
- Le chemin de compatibilité d'acceptation reconstruisant le contrat des anciens devis est supprimé. Absence historique visible et acceptation tracée sans injection rétroactive ; aucune modification des trois devis réels.
- La suppression définitive d'un PDF rattaché est bloquée avant écriture disque/base. Archivage réversible, fichier et rattachement conservés ; erreur visible dans Documents Client.
- Empreinte/intégrité PDF et conservation de l'historique des remplacements : **Lot 5**, précisément différés dans `CGV_BUILDER_V1.md` et `CONTRACTUAL_LOT1_DRAFT_FREEZE.md`.
- Vérification : typecheck OK, 43/43 tests ciblés, 14/14 contrôles UI isolés. Bases de tests en mémoire ; base réelle inchangée. Aucune migration, aucune suite complète.
- Statut : implémentation locale sans commit/push, aucune publication de clause réelle, aucun import catalogue/contractuel, aucun travail Abby/Bridge, aucun merge `main`.
- Prochaine action : présentation du bilan et recette utilisateur du Lot 1 ; ne pas démarrer Lot 2 sans accord explicite.

### 2026-10-03 — CONTRACT-LOT1-002 — Validation technique et recette manuelle différée

- Décision AtoumWeb : **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD**, avant validation fonctionnelle finale.
- Contrôles demandés avant commit local : suite complète `npm test` 356/356 (54 fichiers), typecheck sortie 0, aucun changement inattendu ; base réelle inchangée.
- Autorisation : commit local dédié au seul Lot 1, sans push/merge. La réserve de recette doit apparaître dans son message et le bilan.
- Après ce commit, Lot 2 — Identité catalogue V1 autorisé séparément ; arrêt et bilan avant Lot 3. Aucun travail Bridge/8C.

### 2026-10-03 — CONTRACT-LOT2-001 — Identité catalogue V1, sans reprise des données

- Autorisation AtoumWeb : après suite complète et typecheck Lot 1 verts, commit local Lot 1 uniquement puis implémentation du Lot 2 du plan métier en neuf lots ; arrêt avant Lot 3.
- Lot 1 committé seul : `dedb865f4cdabd518391b63f067ed8e2647c869b`. Son message porte **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD** ; 356/356 tests avant commit, aucune anomalie inattendue, arbre propre avant Lot 2. Aucun push.
- Lot 2 : code AW unique et durable sur l'item ; unité, nature commerciale, famille, libellé Abby descriptif, périodicité, règle de coût tiers réel et provenance sur les versions. UUID techniques et anciennes relations conservés.
- Attribution explicite ancien UUID → AW, atomique/idempotente avec provenance et journal d'activité. Jamais de rapprochement par nom ; aucune correspondance réelle créée dans Validation-MSI. Le catalogue reste vide de codes AW tant que les attributions ne sont pas décidées/appliquées.
- Migration additive **53**, numéro contrôlé disponible après 52 : pas de reconstruction des tables, pas de seed/backfill et pas de modification des migrations antérieures. Testée en mémoire ; non appliquée à la base réelle.
- Les nouvelles lignes de devis figent ces métadonnées et celles des composants d'offre ; les anciens JSON et versions ne sont pas réécrits. Aucune résolution d'options vendues ni composition de blueprint ajoutée ici.
- Vérification : typecheck OK ; tests ciblés 45/45 ; suite complète **377/377**, 56 fichiers ; UI catalogue isolée **15/15**, Builder Lot 1 **14/14**. Empreinte réelle Validation-MSI inchangée ; zéro échec.
- Bilan/fichiers/migration et limites : `CONTRACTUAL_LOT2_CATALOG_IDENTITY.md`. Modifications Lot 2 non committées, distinctes du commit Lot 1. Aucune publication/import contractuel, aucun travail Abby/Bridge, aucun merge `main`.
- Suite : **arrêt et bilan avant Lot 3**, reprise contrôlée des 112 prestations seulement sur feu vert séparé. Lot 8C reste suspendu ; recette manuelle Lot 1 toujours à faire.

### 2026-10-03 — CONTRACT-LOT2-002 — Validation technique et clôture locale

- Décision AtoumWeb : Lot 2 validé techniquement, contrôles 377/377, typecheck OK, UI catalogue 15/15 et régression Lot 1 14/14 suffisants pour poursuivre. Recette manuelle AtoumWeb reportée, obligatoire avant validation fonctionnelle finale.
- Autorisation : commit local Lot 2 dédié uniquement, sans push/merge, avec cette réserve dans le message. Aucun code Lot 3 dans ce commit.
- Autorisation suivante : Lot 3 — reprise du catalogue canonique 112 AW, sur base temporaire, avec mapping ancien ID → AW → action, simulation, idempotence et historique préservé. Les huit ambiguïtés restent à soumettre ; aucun choix métier automatique par nom.
- Arrêt avant écriture réelle dans Validation-MSI et présentation du dry-run pour feu vert séparé. Aucun Lot 4, import contractuel, Abby, Bridge ou 8C.

### 2026-10-03 — CONTRACT-LOT3-001 — Reprise commerciale préparée, arrêt avant application réelle

- Lot 2 committé seul : `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9`. Message explicitement réservé **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE ULTÉRIEUREMENT**, avant validation fonctionnelle finale. Arbre propre avant Lot 3 ; aucun push/merge.
- Source : onglet commercial `Catalogue` du V1 consolidé, SHA-256 `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`. Extraction de 112 codes uniques, aucune feuille contractuelle importée. 77 prix fixes, 16 à partir de, 18 sur devis, 1 coût tiers réel sans montant fixe.
- Manifeste explicite ancien ID → AW → action, basé sur l'audit des 45 entrées. Aucun matching par nom. Simulation de la base réelle sauvegardée en lecture seule : **83 créations, 21 reprises, 9 conservations, 7 archives réversibles**, 8 rapprochements restant à décider. Ils bloquent 8 codes AW ; tableau exhaustif de 136 lignes (112 cibles + 24 anciennes entrées sans attribution). Les 16 `verify` comptent 8 anciens objets et 8 cibles.
- Identités bloquées : `AW-APP-DEV`, `AW-CONT-IMG3`, `AW-CONT-INTEG-WP`, `AW-TECH-MIGRATION-AW`, `AW-TECH-MIGRATION-CPLX`, `AW-TECH-REMISE-WC`, `AW-TECH-REMISE-WP`, `AW-WEB-PAGE-SUP`. Le cas `atoumweb-produits100` concerne le sort d'une seconde ancienne entrée ; `AW-ECOM-IMPORT` est déjà rattaché explicitement à `atoumweb-import`. Aucun doublon créé.
- Migration additive 54, numéro disponible après 53 : paramètres commerciaux descriptifs versionnés et journal d'import avant/après, pas de seed. Migrations 1–53 intactes. Les paramètres restent séparés des clauses ; aucune bibliothèque contractuelle importée.
- Création/reprise en brouillon ; anciennes versions et prix exacts conservés. Liens blueprint et compositions recopiés avec leurs références de versions ; aucune composition déduite de la prose, aucune correction du moteur de blueprint composé (Lot 7). UI permet de consulter le brouillon importé et ses paramètres sans publication.
- Répétition sur copie temporaire exclusivement : 83 nouveaux items + 21 nouvelles versions + 7 archives, puis rejeu zéro nouvelle opération. Toutes les anciennes versions, compositions et liens blueprint préservés ; toutes les autres tables métier inchangées, dont DEV-2026-001/002/003, Projets et tables contractuelles. Copie supprimée.
- Vérification : **388/388 tests**, 57 fichiers, typecheck sortie 0, UI isolée **18/18**. 11 tests supplémentaires : source/tarifs, dry-run, ambiguïtés, historique, modes/unités, copie blueprint, archive réversible, rejeu, simulation périmée et rollback complet sur échec tardif.
- Source Validation-MSI et classeur inchangés, SHA DB `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. 53/54 uniquement sur mémoire/copie, aucune écriture réelle ni clause publiée.
- Bilan : `CONTRACTUAL_LOT3_CATALOG_IMPORT.md`. Dry-run MD/CSV/JSON : `outputs/catalogue-lot3` du dossier documentaire. Lot 3 non committé. Arrêt avant décision des huit rapprochements et feu vert pour première écriture réelle ; ne pas démarrer ce Manager contre Validation-MSI avant autorisation. Aucun Lot 4, Abby, Bridge ou 8C, push ou merge.

### 2026-10-03 — CONTRACT-LOT3-002 — Huit décisions closes, dry-run intégral avant feu vert réel

- Décision AtoumWeb explicite : **aucun rapprochement direct avec les huit anciens objets ambigus**. Les huit codes auparavant bloqués sont de nouvelles références V1 distinctes ; anciens UUID sans code AW, historique intact et retrait réversible des nouvelles sélections commerciales. Aucune exception technique nécessaire : l'archivage préserve les accès par ID et les relations historiques.
- Manifeste mis à jour, candidats antérieurs conservés uniquement comme trace `formerCandidates`, décision `distinct_v1_archive_legacy`. Aucune attribution depuis le nom. Les 21 reprises déjà prévues restent inchangées, dont `AW-ECOM-IMPORT` sur `atoumweb-import` ; `atoumweb-produits100` devient une archive historique sans AW.
- Nouveau plan exact : **91 créations, 21 reprises, 9 conservations, 15 archives (7 + 8) ; 112/112 AW couverts ; 0 verify métier, 0 code bloqué, 0 anomalie**. Remplace le plan 83/21/9/7 avec huit cibles suspendues de l'entrée précédente, conservée historiquement.
- Répétition intégrale sur sauvegarde temporaire de Validation-MSI, sans mode partiel : **112 codes réellement présents dans la copie**, 136 items / 157 versions, 112 nouvelles versions brouillon, 127 entrées de journal. Huit nouveaux UUID distincts ; huit anciens objets sans AW ni nouvelle version, métadonnées hors statut/dates et relations exactes conservées. Trois devis, Projets et autres tables historiques inchangés.
- Rejeu : **0 création, 0 reprise, 0 archive, 0 verify ; 136 conservations**, toutes les tables de la copie inchangées. `integrity_check=ok`, `foreign_key_check` vide. Copie supprimée après rapport.
- Vérification ciblée : **13/13 tests d'import**, typecheck sortie 0. Pas de répétition de suite complète/UI inchangées ; résultats initiaux 388/388 et UI 18/18 restent historiques. Aucune nouvelle migration ; 53/54 exécutées seulement sur la copie.
- Base réelle SHA-256 toujours `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c` ; classeur SHA-256 `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`, inchangés.
- Dry-run MD/CSV/JSON régénéré dans `outputs/catalogue-lot3`, bilan `CONTRACTUAL_LOT3_CATALOG_IMPORT.md` mis à jour. **Arrêt avant toute écriture réelle, attente du feu vert AtoumWeb.** Aucun commit/push/merge, publication, Lot 4, Bridge ou 8C.

### 2026-10-03 — CONTRACT-LOT3-003 — Fermeture technique et application réelle autorisée

- Décision AtoumWeb : nouveau dry-run validé ; application Lot 3 à Validation-MSI autorisée si suite complète/typecheck verts, diff prévu, backup physique immédiat, aucun WAL actif non sauvegardé et jeton/empreintes inchangés. Ne pas démarrer Manager, publier V1 ni commencer Lot 4.
- Fermeture sur le code exact : **57 fichiers / 390 tests / 0 échec**, typecheck sortie 0, 20 fichiers Lot 3 attendus, aucun staged, HEAD local Lot 2 inchangé. Nouveau dry-run sur copie retrouve les mêmes hashes et le jeton `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4`.
- WAL présent vide / SHM présent ; verrou d'écriture exclusif vérifié en refusant une seconde connexion d'écriture. Sauvegarde physique immédiatement avant application, intégrité OK, SHA `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`, fichier `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`. Manager non démarré.
- Migrations **53/54** et import réalisés sous une transaction englobante, opérations existantes imbriquées via savepoints ; contrôle du plan et des fichiers immédiatement avant import, conservation des anciennes colonnes après migrations, rollback complet au moindre écart avant COMMIT. SQL 1–53 intact, aucun seed.
- Résultat réel : **91 créations, 21 reprises par nouvelle version, 15 archives réversibles sans AW, 9 génériques conservés, 112/112 codes AW, 112 nouvelles versions BROUILLON**, 136 items / 157 versions / 44 anciennes versions publiées inchangées / 113 brouillons / 127 entrées de journal / 1 passage.
- Les huit anciens objets ambigus n'ont aucun code AW ni nouvelle version ; leurs métadonnées hors statut/dates sont intactes. Les 21 reprises gardent UUID/anciennes versions ; liens blueprint et compositions recopiés exactement. Deux anciens liens blueprint conservés + une copie = trois liens totaux.
- Comparaisons exhaustives par table puis contre-vérification SQLite indépendante avec backup : anciens devis `DEV-2026-001/002/003`, lignes/snapshots, Projets, documents, anciennes versions et tables contractuelles inchangés. Aucune clause injectée rétroactivement.
- Après COMMIT : `integrity_check=ok`, `foreign_key_check` vide. Rejeu réel zéro opération et toutes les tables strictement inchangées, activité et journal compris. Checkpoint WAL réussi, base après SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; XLSX toujours `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.
- Bilan `CONTRACTUAL_LOT3_CATALOG_IMPORT.md`, preuves réelles `outputs/catalogue-lot3/application-lot3-validation-msi.md/json`, contre-vérification et fermeture sur copie conservées. Les entrées -001/-002 décrivent la préparation antérieure et ne font plus foi pour l'état réel.
- **Lot 3 appliqué sans publication, non committé. Arrêt et attente du feu vert avant Lot 4.** Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale ; aucun push/merge, clauses/409 liens, Abby, Bridge ou Lot 8C.

### 2026-10-03 — CONTRACT-LOT3-004 — Clôture locale dédiée autorisée

- AtoumWeb valide le bilan réel du Lot 3 : 112 AW, 91 créations/21 reprises/15 archives/9 conservations, 112 versions brouillon, historique et rejeu préservés.
- Autorisation : commit local dédié « Lot 3 — reprise catalogue commercial V1 », sans push ni merge, rappelant la recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale.
- Aucune modification du Lot 4 incluse dans cette clôture.

### 2026-10-03 — CONTRACT-LOT4-001 — Autorisation limitée, préparation et dry-run avant application réelle

- AtoumWeb valide Lot 3 et autorise son commit dédié local, sans push/merge. Réalisation : `1ed1152cc55ada1e8731d09b9f1a6c9832ba4934`, réserve de recette manuelle maintenue. Working tree propre avant Lot 4 ; aucun code Lot 4 dans ce commit.
- Feu vert Lot 4 : préparer l'import de la bibliothèque existante, puis simulation exhaustive sur copie. **Aucune écriture réelle à Validation-MSI autorisée pour cette passe** ; pas de publication, Lot 5, activation catalogue, options vendues, blueprints, Abby, Bridge ou 8C.
- Source XLSX synchronisée 03/10 SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`, huit documents juridiques vivants contrôlés et inchangés. Extraction déterministe SHA `4b8224816ae527b181d3cc795b5f4efebfef358dd600b7a36f2abc1cb9dd5068` ; aucun texte reformulé, anciens codes/aliases/27 archives conservés uniquement comme historique documentaire.
- Implémentation dans le moteur existant, création brouillon composable sous transaction, publication distincte inchangée. Migration additive 55 réservée après contrôle du dépôt/base 54 : revue/provenance JSON et journal d'import, aucun seed ou import automatique. Migration 55 uniquement sur mémoire/copie ; 1–54 intactes.
- Répétition : 118 clauses/118 versions BROUILLON/409 liens explicites, scopes 19/99, audiences 105/3/10, zéro anomalie/publication/lien BASE. LANDING-GESTION seule dormante ; contrôle CONS-RETRACTATION-EN-LIGNE exclu. 42/52/22/2 suivis et cinq niveaux documentaires conservés sans ancien visa juriste automatique. Les 16 décisions restent closes ; 44 actions hors clause non transformées en clauses/tables.
- Rejeu : aucune création/version/relation/activité/journal supplémentaire, 118 clauses et 409 liens conservés ; integrity_check OK, aucune violation FK. Rollback tardif complet couvert par test. Catalogue, versions historiques, Projets et DEV-2026-001/002/003 inchangés, absence contractuelle historique explicitement conservée.
- Vérifications : 59/59 tests ciblés (19 nouveaux), typecheck sortie 0, UI isolée 21/21 avec IPC simulé. Pas de suite complète inutile. Sources réelles avant/après identiques, base toujours SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`, Manager non démarré.
- Rapport `CONTRACTUAL_LOT4_LIBRARY_IMPORT.md` ; dry-run exhaustif MD/CSV/JSON dans `outputs/contract-library-lot4` du dossier documentaire. **Arrêt avant écriture réelle ; attendre le feu vert AtoumWeb. Ne pas démarrer Manager sur Validation-MSI avant autorisation de la migration 55/import.** Aucun commit Lot 4 ni push/merge. Recette fonctionnelle manuelle toujours à effectuer ultérieurement.

### 2026-10-03 — CONTRACT-LOT4-002 — Fermeture technique et application réelle autorisée

- Décision AtoumWeb : dry-run validé, Lot 4 réel autorisé uniquement après suite complète/typecheck, diff prévu, sauvegarde physique sous contrôle WAL/SHM et empreintes/jeton identiques. Ne pas démarrer Manager avant application ; ne publier aucune clause/catalogue V1, ne pas commencer Lot 5. Commit local seulement après validation ultérieure du bilan réel.
- Fermeture code exact : **58 fichiers / 409 tests / 0 échec**, typecheck sortie 0, 21 fichiers Lot 4 prévus, index vide et HEAD Lot 3 inchangé. Helper hors dépôt répété sur copie, aucun code applicatif changé après tests.
- WAL vide / SHM 32 768 octets / pas de journal actif, writer concurrent bloqué sous verrou exclusif. Sauvegarde physique immédiatement avant application : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot4-2026-10-03T12-37-38-123Z.sqlite`, SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b`, intégrité/FK contrôlées.
- Réalisation : migration **55** et import sous transaction englobante ; migrations 1–54/données intactes. Fichiers/code/base/XLSX/8 documents revérifiés, jeton recalculé `8f5b0c9b3ba4a08eab134fed6061de13cd32881f295c5ed6ade66c22d1323bff` identique au validé. Refus/rollback au moindre écart ; aucun fallback depuis un nom/alias.
- Résultat réel : **118 templates / 118 versions BROUILLON / 409 liens**, scopes 19/99, audiences 105/3/10, zéro publication/lien BASE. LANDING-GESTION seule dormante ; contrôle CONS-RETRACTATION-EN-LIGNE et anciens aliases exclus. Textes/revues/sources/réserves/provenance exacts, aucun arbitrage rouvert ; journal 1 passage/118 entrées.
- Catalogue Lot 3 intact : 112 AW, 112 nouvelles versions brouillon, 44 anciennes publiées inchangées. DEV-2026-001/002/003 et Projets/versions/documents inchangés ; zéro instance de clause historique, absence historical_missing conservée. Builder : zéro version courante publiée éligible.
- Après COMMIT : rejeu réel zéro création/version/lien supplémentaire, toutes les tables inchangées, activité/journal compris. integrity_check OK, FK vide, checkpoint WAL réussi. Contre-vérification SQLite indépendante en lecture seule contre backup : **96 tables historiques**, textes/métadonnées/liens exacts.
- Base après fermeture SHA `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8` ; XLSX inchangé `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`. Manager non démarré.
- Bilan `CONTRACTUAL_LOT4_LIBRARY_IMPORT.md`, preuves réelles `outputs/contract-library-lot4/application-lot4-validation-msi.md/json`, contre-vérification et fermeture conservées. Les consignes d'arrêt avant écriture de -001 décrivent la phase antérieure. **Lot 4 appliqué, non committé : attendre validation du bilan réel avant commit local dédié.** Recette manuelle restant à faire, aucun push/merge, publication, Lot 5, Abby, Bridge ou 8C.

### 2026-10-03 — CONTRACT-LOT4-003 — Validation et clôture locale dédiée

- AtoumWeb valide le bilan réel et autorise **Lot 4 — import bibliothèque contractuelle V1**, commit local dédié uniquement, sans push/merge. Aucune reprise de Lot 5 autorisée.
- Contrôle : 21 fichiers Lot 4 attendus seulement, aucun code fonctionnel modifié après les 409/409 tests/typecheck de fermeture, historique préservé. Validation-MSI conserve le SHA validé `afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8`.
- Le message de clôture rappelle : 118 clauses BROUILLON, aucune publication contractuelle, 112 versions catalogue V1 BROUILLON, recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale, Lot 5 non commencé. Le commit contenant cette entrée sert de checkpoint local ; empreinte exacte dans le bilan hors dépôt et `git log -1 --format=%H`.
- Aucun push/merge, démarrage Manager, modification de Validation-MSI, publication, Lot 5, Bridge ou 8C.


### 2026-10-03 — CONTRACT-LOT5-001 — Préparation autorisée et fermeture sur copie uniquement

- Feu vert AtoumWeb : implémentation locale, tests et dry-run du Lot 5 ; aucune écriture Validation-MSI, publication, Lot 6, Abby, Bridge, 8C ou merge. Checkpoint Lot 4 local 31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc, non poussé, conservé.
- Extension du moteur existant, contrat intégré au devis : paramètres structurés, échéancier/garanties/canal/qualification numérique, droits/renouvellement, B2C, RSVP minimal sans collecte sensible, administration sans valeur fictive. Snapshot enrichi transactionnel, pas de reconstruction historique.
- Migration nouvelle 56 : paramètres nullable des devis, empreinte/provenance des fichiers, relations génériques de preuves/annexes/remplacements. SQL 1–55 conservé. PDF actif et historique protégés, SHA à l’import/rattachement et contrôle à l’ouverture ; absence historique de SHA conservée sans certification rétroactive.
- Garde-fou service : catalogue brouillon/inactif refusé même par identifiant direct. Aucun brouillon contractuel consommé ni publié. CONS-RETRACTATION-EN-LIGNE reste un contrôle applicatif ; aucune clause textuelle ou fonctionnalité publique activée.
- Vérifications : suite complète 59 fichiers / 443 tests / 0 échec, 34 nouveaux cas Lot 5, typecheck sortie 0, interface Electron isolée 20/20. Les tests mémoire utilisent leurs propres fixtures, jamais la base réelle.
- Dry-run sur sauvegarde temporaire : migration 56, 98 anciennes tables/colonnes/lignes conservées, rejeu sans effet, SQLite ok/FK vide. Nouveau DEV-2026-004 uniquement sur copie, ligne libre 100,01 euros, paramètres 30/70 ; finalisation refusée pour 4 informations administratives absentes et socle publié manquant. Aucun Client ni preuve inventé.
- 112 AW, 112 catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens, 0 publication conservés. DEV-2026-001/002/003 et Projets inchangés ; compteur/index dérivé rafraîchis sur copie seulement.
- Validation-MSI réelle toujours migration 55, SHA afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8 ; XLSX SHA 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8 inchangé. Manager non démarré.
- Bilan CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md, rapports/preuves outputs/contract-parameters-lot5. Recette manuelle AtoumWeb à faire, limites de qualification/probatoire documentées. **Arrêt avant application réelle, aucun commit Lot 5/push/merge. Attendre le feu vert.**


### 2026-10-03 — CONTRACT-LOT5-002 — Feu vert et application réelle de migration 56 seule

- AtoumWeb valide le dry-run et autorise l’application réelle sur Validation-MSI, sous verrou/sauvegarde physique/empreintes/intégrité/diff. Aucun DEV-2026-004, backfill, seed administratif, publication, changement de 409 liens, Lot 6 ou commit avant validation du bilan réel.
- Code inchangé depuis 443/443 tests et typecheck OK ; 38 fichiers Lot 5 prévus, index vide, 332 sources applicatives hachées avant application. Pas de changement fonctionnel ni répétition inutile des suites. HEAD Lot 4 31e9df44b36f6ca0ad20fd594c904eac7b9aa8fc conservé.
- Protocole répété sur copie jetable avec migration seule ; Manager non démarré. BEGIN EXCLUSIVE, seconde connexion d’écriture refusée ; WAL vide, SHM 32 768 octets, aucun journal actif. Backup physique immédiat C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot5-2026-10-03T18-56-43-167Z.sqlite, hash identique à la base avant : afaf9b8a7fa196a54dfd29e0fff881b099ad4b1d8bcc2e2da4dd8adc47bf31b8.
- Plan/empreintes revérifiés immédiatement avant écriture ; jeton 7e2ab1e6f4688dca9856a55857b50eadadb50c609f71330116f92c5dc9c9a865. Migration 56 seule, sous transaction englobante, SQL 1–55 inchangés. Les 98 anciennes tables/colonnes/lignes sont identiques au backup ; zéro modification de données existantes.
- Migrations 1–56 présentes ; 112 AW, 112 versions V1 catalogue BROUILLON, 118 clauses BROUILLON, 409 liens intacts, zéro publication contractuelle. Les 44 anciennes versions catalogue publiées restent inchangées. LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE hors texte.
- DEV-2026-001/002/003 et 2 Projets exacts, paramètres/snapshot inconnus restent NULL, aucune clause injectée, aucun DEV-2026-004. Aucun paramètre administratif seedé, table de preuves vide, aucun document maître métier importé/dupliqué, aucun invité sensible stocké.
- Garde-fous Builder vérifiés en lecture pure : socle publié absent et informations réellement obligatoires manquantes restent bloquants. Qualification multi-indicateurs et RSVP minimal/sensible désactivé conservés.
- integrity_check ok / FK vide. Rejeu réel aucune migration, zéro modification logique et physique ; checkpoint WAL réussi. Contre-vérification indépendante Python/SQLite read-only contre backup réussie.
- Base après fermeture SHA 877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71 ; XLSX inchangé 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8.
- Preuves application-lot5-validation-msi.md/json et contre-verification-lot5.json dans outputs/contract-parameters-lot5 ; bilan CONTRACTUAL_LOT5_PARAMETERS_AND_EVIDENCE.md mis à jour. Dry-run conservé historiquement.
- **Lot 5 appliqué, non committé. Attendre la validation du bilan réel avant commit local dédié, sans push/merge. Recette manuelle AtoumWeb à faire. Aucun Lot 6, publication, Abby, Bridge ou 8C.**


### 2026-10-03 — CONTRACT-LOT5-003 — Validation et clôture locale dédiée

- AtoumWeb valide Lot 5 et autorise le commit local dédié « Lot 5 — paramètres contractuels et preuves », sans push/merge. Ne pas commencer Lot 6.
- Vérification : 38 fichiers Lot 5 attendus, index initialement vide, 332 sources applicatives inchangées depuis 443/443 tests/typecheck OK. Aucun code fonctionnel modifié ; seules les mentions de clôture documentaire sont ajoutées.
- Aucun fichier parasite de simulation/sauvegarde/base/XLSX/log inclus. Les scripts de simulation et de contrôle font partie des fichiers attendus ; leurs sorties restent hors dépôt.
- Le message rappelle : migration 56 réussie dans Validation-MSI ; aucun backfill historique, aucune publication catalogue/contractuelle, aucune donnée administrative fictive ; recette manuelle AtoumWeb à faire avant validation fonctionnelle finale ; Lot 6 non commencé.
- Validation-MSI demeure au SHA 877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71 ; 112 AW, 112 catalogue V1 brouillon, 118 clauses brouillon, 409 liens et historique inchangés par cette clôture.
- Le commit contenant cette entrée fait foi ; SHA et liste exhaustive des fichiers dans outputs/contract-parameters-lot5/cloture-git-lot5.md/json. Aucun push/merge, démarrage Manager, écriture base, publication, Abby, Bridge, Lot 6 ou 8C.

### 2026-10-03 — CONTRACT-LOT6-001 — Autorisation limitée et constat

- AtoumWeb autorise Lot 6 uniquement : code local/tests/simulation sur copie ; aucune écriture Validation-MSI, publication des 112/118 brouillons, Lot 7, Abby, Bridge, 8C, commit/push/merge.
- Option disponible ≠ achetée : seule une ligne persistée avec origine offre/version/composant/service/version vendue/quantité/prix/remise matérialise l'achat. Pas de rapprochement par nom ni backfill historique.
- Constat : ContractTermsService et ProjectService filtrent déjà les composants facultatifs ; réutiliser ce mécanisme. Manquent l'achat affilié explicite et la duplication des brouillons.
- HEAD de départ Lot 5 fa52b68911d8649013a4a4e40e19d91a56d0c6e6, working tree propre ; prochain numéro libre 57.

### 2026-10-03 — CONTRACT-LOT6-002 — Préparation locale et simulation terminées

- Migration 57 additive, quote_option_purchases : contraintes d'identité, unicité, origine immuable et gel. Prix/quantité/remise restent sur les lignes. Aucun backfill.
- Achat/retrait transactionnels ; rejeu zéro mutation ; suppression de l'offre retire seulement ses achats liés. Garantie de ligne nettoyée et clauses synchronisées via orphelins existants. Adaptation humaine orpheline conservée/signalée.
- UI Devis enregistré : obligatoires inclus, options disponibles/achetées, édition quantité/prix/remise existante, provenance lisible. Pas d'achat implicite dans l'assistant.
- Duplication avec/sans options : remappage des lignes d'offre, version/provenance/quantité/prix exacts, aucune fusion avec service manuel ; original intact. Origine d'achat dans snapshot figé, retrait/modification refusés.
- 60 fichiers / 459 tests / 0 échec ; typecheck sortie 0 ; UI React réelle avec IPC simulé 20/20, trois thèmes. Assertions historiques adaptées au numéro 57, SQL 1–56 intact.
- Copie physique contrôlée par SHA sans connexion SQLite source : 99 tables intactes après migration 57. Trois devis fictifs (1/2/3 lignes, 100/120/208,60 euros), diff exact/contributions futures. Aucun objet opérationnel créé.
- Incident technique tracé : premier essai SQLite read-only ayant créé un WAL vide/SHM, base intacte. Auxiliaires identifiés par création à 21:28:21, retirés après contrôle WAL vide/SHA et absence de processus Manager/Electron. Script final remplacé par lecture/copie binaire vérifiée ; aucun auxiliaire résiduel et aucune écriture de données/migration réelle.
- Validation-MSI réelle toujours 1–56, SHA 877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71 ; XLSX 6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8 inchangé. 112 AW, 112 catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens et historique conservés.
- Bilan docs/CONTRACTUAL_LOT6_PURCHASED_OPTIONS.md et sorties outputs/contract-options-lot6.
- **Lot 6 préparé, non appliqué/non committé. Recette manuelle à faire. Arrêt et attente de validation ; aucun autre lot, publication, push/merge.**


### 2026-10-03 — CONTRACT-LOT6-003 — Autorisation et application réelle terminée

- AtoumWeb autorise l'application réelle du Lot 6 uniquement, migration **57**, après validation 459/459 tests, typecheck OK et UI 20/20. **Application terminée, aucun commit autorisé à ce stade ; attendre validation du bilan réel.**
- Branche feature/project-page-compositions-v1, HEAD **fa52b68911d8649013a4a4e40e19d91a56d0c6e6** inchangé. Les 24 fichiers Lot 6 et leurs empreintes correspondent exactement à la fermeture validée avant écriture ; 335 sources applicatives contrôlées. Aucun code fonctionnel changé, aucune suite répétée inutilement.
- Manager non démarré. Base initiale 1–56 au SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide, SHM de verrou 32 768 octets, aucun journal actif sous verrou.
- Sauvegarde physique immédiatement avant application sous verrou : C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot6-2026-10-03T19-57-38-123Z.sqlite, SHA **877192a41131737424fb03e808885c22faa3e876b798f54b7929a672e8459e71**, identique à la base avant. Intégrité de la sauvegarde vérifiée indépendamment en lecture immutable.
- Jeton du plan **7a5e7f86e43f15c815ec437ec102ac51f0a07d1dafd351332fea4fc5eb4d286f** revérifié juste avant migration ; empreintes du plan, de la base, du XLSX, des sources et des preuves de tests inchangées. Aucune autre migration pendante acceptée.
- Migration **57 seule appliquée** : migrations **1–57** présentes ; quote_option_purchases et ses trois triggers créés, **0 achat**, aucun backfill/requalification historique.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts**. 0 nouvelle publication ; les 44 versions catalogue publiées anciennes demeurent inchangées. 0 lien catalogue BASE, LANDING-GESTION seule dormante, CONS-RETRACTATION-EN-LIGNE hors bibliothèque.
- Conservation exhaustive des **99 anciennes tables**, colonnes, lignes et objets de schéma : toutes les empreintes avant/après identiques, hors nouvelle ligne de migration 57. DEV-2026-001/002/003 et leurs deux lignes chacun strictement inchangés ; 0 clause rétroactive. Deux Projets et état documentaire exacts ; aucun Projet/Site/Page/pack/maintenance/objet opérationnel créé.
- integrity_check **ok**, foreign_key_check **vide** ; rejeu migration **[]**, aucune modification logique ni physique. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; aucun WAL/SHM/journal résiduel.
- Contre-vérification indépendante Python/SQLite mode=ro immutable réussie contre la sauvegarde. XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** conservé ; aucune modification Abby, Bridge ou 8C.
- Rapports : outputs/contract-options-lot6/application-lot6-validation-msi.md/json, contre-verification-lot6.json et fermeture-reelle/plan-application-lot6.json.
- **Lot 6 appliqué, non committé. Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Aucun push/merge. Lot 7 non commencé. Attendre validation du bilan avant commit local.**


### 2026-10-03 — CONTRACT-LOT6-004 — Validation et clôture locale dédiée

- AtoumWeb valide le bilan réel et autorise le **commit local dédié Lot 6 — options réellement achetées**, sans push ni merge. Le commit contenant ce bloc clôture localement le Lot 6 ; son SHA et la liste exhaustive des fichiers sont consignés dans outputs/contract-options-lot6/cloture-git-lot6.json.
- Migration **57 appliquée sur Validation-MSI** ; quote_option_purchases présente et **vide**. Aucun backfill historique, aucune requalification implicite, aucune publication catalogue/contractuelle ni création de Projet/Site/Page/pack/maintenance.
- Contrôle avant commit : **24 fichiers Lot 6 attendus uniquement**, index initialement vide ; 335 sources applicatives identiques à la fermeture validée **459/459 tests, typecheck OK et UI 20/20**. Aucun changement fonctionnel depuis ces contrôles ; seules trois documentations de suivi actualisées.
- Aucun artefact de sauvegarde/simulation/base/classeur inclus ; les scripts de simulation/contrôle prévus font partie du code Lot 6, leurs sorties demeurent hors dépôt.
- Validation-MSI demeure au SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4** ; 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, 409 liens, devis historiques, Projets et documents conservés.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE avant validation fonctionnelle finale. Lot 7 non commencé.** Aucun démarrage Manager ni écriture base pendant cette clôture. Aucun push/merge, publication, Abby, Bridge ou 8C.


### 2026-10-03 — CONTRACT-LOT7-001 — Autorisation limitée et constat

- Auteur : AtoumWeb (consigne), Codex (constat). Base locale Lot 6 `5cf67f796941690449fc8661fe956c0ffd3e50d1`, branche `feature/project-page-compositions-v1`.
- Feu vert : Lot 7 uniquement, code/tests/UI/simulation sur copie ; aucune application Validation-MSI, publication des 112/118 brouillons, Lot 8 opérationnel, Abby, Bridge, 8C ou commit/push/merge.
- Constat : choix silencieux de la première base, addons surtout dans l'arbre métier, Sites/Pages alimentés seulement par la base ; quantités non expansées ; prérequis inclus incomplets et copie globale susceptible de devenir fantôme après retrait.
- Découpage : réutiliser liens base/addon, identités sémantiques et sources existantes ; ajouter politiques quantité/destination et plan figé des ventes. Aucune déduction par nom.

### 2026-10-03 — CONTRACT-LOT7-002 — Préparation locale et simulation terminées

- Auteur : Codex, résultat technique local **non committé**. HEAD Lot 6 inchangé.
- Migration **58 additive**, réservée après contrôle de l'état 57 ; anciennes migrations intactes. Tables plan/bindings/prérequis, `once/per_unit` et `create/extend_base` ; pas de seed/backfill.
- Moteur : contributions réellement vendues, achats Lot 6, quantités explicites, Pages/descendants distincts, Sites déclarés par addons, sources exactes. Plan figé et haché ; rejeu pur, manuel conservé ; bases concurrentes bloquées avant création. Choix explicite d'une seule base tracé avec les origines remplacées ; fallback historique préservé hors nouveaux plans.
- Contrôles **479/479 tests**, 61 fichiers, 20 nouveaux tests Lot 7 ; typecheck sortie 0 ; **24/24 UI isolée**, Blanc/Noir/AtoumWeb. Recette manuelle à faire.
- Simulation 11 observations sur copie : Site vitrine 1/5 ; Pages x2 1/7 ; Blog 1/6 ; option disponible 1/5, achetée 1/6 ; addons multiples 1/8 ; renommages et Page manuelle conservés ; quantité finale 1→3 1/8 ; plusieurs bases bloquées. Rejeux sans mutation. 100 anciennes tables préservées à la migration, historique exact, intégrité ok/FK vide, zéro création opérationnelle.
- Source réelle jamais connectée par le simulateur : copie binaire vérifiée seulement. Validation-MSI toujours migrations 1–57, SHA `7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4` ; XLSX SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8`. 112 AW/112 catalogue V1 brouillon/118 clauses brouillon/409 liens et anciens devis/Projets/documents préservés.
- Les vrais liens répétables/destinations doivent être configurés explicitement avant recette commerciale ; aucune configuration/publication V1 sur la base réelle pendant cette préparation.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; preuves `outputs/contract-blueprints-lot7` dans le dossier documentaire partagé.
- **Lot 7 préparé, non appliqué/non committé. Attendre validation du bilan et autorisation réelle séparée. Ne pas démarrer Manager sur Validation-MSI (58 pendante). Aucun Lot 8, Abby, Bridge, 8C, publication, push/merge.**


### 2026-10-03 — CONTRACT-LOT7-003 — Feu vert et application réelle de migration 58 seule

Auteur : AtoumWeb (autorisation), Codex (application et contrôle).

- Feu vert AtoumWeb : **application réelle du Lot 7 uniquement / migration 58**, sans backfill, reconstruction historique, politique/destination commerciale inventée, publication ou objet opérationnel. **Application terminée ; aucun commit autorisé avant validation du bilan réel.**
- Branche `feature/project-page-compositions-v1`, HEAD Lot 6 **5cf67f796941690449fc8661fe956c0ffd3e50d1** inchangé. **27 fichiers Lot 7 attendus**, index vide ; aucun push/merge.
- Empreintes vérifiées : 27 fichiers exacts, 336 sources applicatives et preuves validées **479/479 tests, typecheck sortie 0, UI 24/24**. Le plan d'application couvre 343 sources/fichiers de configuration ; aucun code fonctionnel changé, aucune répétition inutile de suite.
- Manager non démarré. Base initiale **1–57**, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, sans WAL/SHM/journal. Verrou exclusif acquis et seconde connexion d'écriture refusée ; WAL vide et SHM de verrou 32 768 octets, aucun journal actif.
- Sauvegarde physique immédiatement avant migration sous verrou : `C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI/backups/before-lot7-2026-10-03T21-01-27-408Z.sqlite`, SHA **7a54bb9905b16370f3c98f9d0e5dacd88bb38a65cae5b506525e1ea6e86496d4**, identique au checkpoint initial. Intégrité/FK vérifiées indépendamment en lecture immutable.
- Jeton du plan **61e9e8156b3b20b28b7332584d9a54959b83f1d97022f69db31bde8177c44f4f** recalculé et empreintes revérifiées immédiatement avant le seul changement durable autorisé.
- Migration **58 seule appliquée** : migrations **1–58** présentes ; colonnes `quantity_mode/site_mode` et tables `project_blueprint_plans`, `project_composed_node_bindings`, `project_composed_site_bindings`, `project_composed_prerequisite_sources`. Les **quatre tables sont vides**.
- Seuls les défauts de schéma `once/create` apparaissent sur les **3 anciens liens blueprint** ; aucun mapping AW, règle de quantité ou destination commerciale renseigné. Les anciennes colonnes/valeurs de ces liens sont intactes.
- **112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens intacts / 0 publication contractuelle** ; 44 publications catalogue historiques inchangées. `quote_option_purchases` reste vide.
- Conservation exhaustive des **100 anciennes tables/colonnes/lignes**, hors ligne de migration 58 et nouvelles colonnes techniques autorisées. **DEV-2026-001/002/003**, leurs 2 lignes chacun, les **2 Projets**, leurs Sites/Pages et documents restent exacts ; aucun plan composé historique ni instance contractuelle ajouté.
- `integrity_check=ok`, `foreign_key_check` vide ; rejeu migrations **[]**, aucune modification logique **ni physique**. Checkpoints WAL TRUNCATE réussis, fermeture puis SHA final **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; aucun WAL/SHM/journal résiduel. Contre-vérification indépendante Python/SQLite read-only immutable réussie contre la sauvegarde.
- XLSX inchangé, SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8**. Aucun pack/maintenance/intervention, Abby, Bridge, Lot 8 ou 8C.
- Bilan `docs/CONTRACTUAL_LOT7_COMPOSED_BLUEPRINTS.md` ; preuves `application-lot7-validation-msi.md/json`, `contre-verification-lot7.json` et plan dans `outputs/contract-blueprints-lot7` du dossier documentaire partagé.
- **Lot 7 appliqué, non committé. Attendre validation du résultat avant commit local dédié, sans push/merge. Recette manuelle AtoumWeb toujours à faire.** Le mapping `AW → blueprint → rôle → destination → quantité` reste à décider/configurer explicitement et à versionner dans une étape autorisée séparément.


### 2026-10-04 — CONTRACT-LOT7B-001 — Clôture Lot 7 et préparation autorisée du Projet prévisionnel

Auteur : AtoumWeb (doctrine et autorisation limitée), Codex (réalisation locale).

- Audit 7B validé ; Lot 7 techniquement terminé. Commit local **c1cc00c9934ce78909f6ccf4b9b37952657e3c50**, 27 fichiers Lot 7 uniquement, working tree propre après commit, aucun push/merge.
- Nouvelle doctrine validée : **un Projet par dossier commercial**, possible avant acceptation sur Prospect ; révisions explicites et origines de lignes stables, aucune identité par nom. À l'acceptation : dernière synchronisation et même Projet rattaché au Client/figé, sans objet opérationnel.
- Lot 7B autorisé uniquement en code/tests/UI/simulation sur copie. Migration **59 préparée**, 58 et toutes les anciennes migrations inchangées. Reconstruction SQLite contrôlée de projects avec anciens identifiants/colonnes intactes ; huit nouvelles tables, archivage nœuds/prérequis, révisions immuables et triggers anti-opérations prévisionnelles. Aucun historique requalifié.
- Moteur Lot 7 réutilisé : différentiels de lignes/quantités, options achetées Lot 6 seules ; manuel conservé, conflits visibles et choix keep/archive/detach/delete si vierge. Bases/destinations ambiguës bloquées ; aucune règle commerciale AW inventée.
- **503/503 tests**, 62 fichiers, 24 nouveaux tests 7B ; typecheck sortie 0 ; **54/54 UI isolée** Blanc/Noir/AtoumWeb ; recette manuelle AtoumWeb toujours à faire.
- Simulation **11 observations** sur copie : un Projet Prospect 1 Site/5 Pages ; +Page ×2 →7 ; 2→1 →6 ; Blog vierge ajouté/retiré ; Blog travaillé conservé avec conflit ; Page manuelle/renommages conservés ; SEO acheté sans Page inventée ; révision et acceptation gardent les identités. Seconde acceptation/conversion/rejeu : zéro mutation. 104 tables antérieures préservées à la migration, intégrité OK/FK vide, zéro objet opérationnel.
- Validation-MSI inchangée, migrations 1–58, SHA **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5** ; XLSX SHA **6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8** inchangé. Source SQLite jamais ouverte par simulateur ; lecture binaire/copie seulement. 112 AW/112 catalogue V1 BROUILLON/118 clauses BROUILLON/409 liens et historique intacts.
- Bilan `docs/CONTRACTUAL_LOT7B_PROVISIONAL_PROJECTS.md`, preuves et fichiers/empreintes dans `outputs/contract-project-provisional-lot7b` hors dépôt.
- **Lot 7B non appliqué, non committé ; attendre validation et autorisation séparées. Ne pas démarrer Manager sur Validation-MSI (59 pendante).** Aucun Lot 8, Abby, Bridge, 8C, publication, push/merge.


### 2026-10-04 — CONTRACT-LOT7B-002 — Application réelle autorisée de migration 59 seule

Auteur : AtoumWeb (validation et feu vert limité), Codex (application contrôlée).

- Les 33 fichiers exactement validés 503/503 tests/typecheck/UI 54/54 et 350 sources ont été contrôlés avant écriture. Aucune modification fonctionnelle. HEAD `c1cc00c9934ce78909f6ccf4b9b37952657e3c50` inchangé, branche `feature/project-page-compositions-v1`, index vide.
- Sauvegarde physique sous verrou : `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot7b-2026-10-04T07-51-43-253Z.sqlite`. SHA avant = sauvegarde **ca5ab5a58af53197662000e0fb9edf27762b0c93cd606e2b49ca9391dde09db5**. Verrou confirmé par seconde connexion refusée ; aucun auxiliaire actif. Plan/jeton `8fa7d0de1b7650f425d3571197846293d4452b80ba6df488d8504340eabdef2c` vérifiés immédiatement avant migration.
- **59 seule appliquée** sous transaction exclusive ; contraintes FK suspendues avant le rebuild, réactivées ensuite. Les 19 anciennes colonnes de projects, ses deux lignes et les 21 tables référentes sont identiques. 104 tables métier et sqlite_sequence conservées. Les indexes et `demo_track_projects` runtime ont été rejoués avec leur SQL historique exact dans la transaction pour éviter leur perte au DROP.
- Migrations **1–59**, huit tables 7B vides. Anciens Projets legacy, nouvelles relations null. Aucun Client, Projet, plan prévisionnel, Site/Page ni objet opérationnel créé ; devis/provenances/documents historiques exacts.
- 112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens et achats d'options vide intacts. Aucune publication.
- Intégrité OK/FK vide ; rejeu sans mutation logique ni physique. Checkpoints, fermeture et SHA final **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc** ; aucun WAL/SHM/journal restant. Contre-vérification indépendante Python 3.12.14/SQLite 3.53.1 immutable sauvegarde/base finale : 105 tables, 21 relations et cellules Projet exactes.
- XLSX SHA `6bc3eddaee0e1d77008c0bdc98984eea89ac54838c483c12c58b95cd3b237ad8` inchangé. Preuves `application-lot7b-validation-msi.md/json`, `contre-verification-lot7b.json`, plan et fermeture dans `outputs/contract-project-provisional-lot7b` hors dépôt.
- **Application terminée, aucun commit autorisé. Attendre validation du bilan réel ; recette manuelle AtoumWeb à faire. Aucun Lot 8, Abby, Bridge, 8C, push/merge.**


### 2026-10-04 — CONTRACT-LOT7B-003 — Validation et clôture locale dédiée

Auteur : AtoumWeb (validation et autorisation de commit local), Codex (clôture).

- Bilan réel migration 59 validé. Commit local dédié **Lot 7B — projet prévisionnel et révisions commerciales**, uniquement les **33 fichiers 7B**, sans push/merge. Son SHA et les fichiers sont enregistrés hors dépôt dans `outputs/contract-project-provisional-lot7b/cloture-git-lot7b.json`.
- Contrôle avant commit : 33 fichiers attendus et empreintes conformes à la fermeture après application ; code fonctionnel identique à l'état **503/503 tests, typecheck OK, UI 54/54**. Migration 59 inchangée. Seuls trois documents de suivi actualisés ; aucun artefact base/sauvegarde/classeur/JSON généré inclus.
- Validation-MSI en migrations **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc** conservé, aucune écriture pendant clôture. 112 AW/112 catalogue V1 BROUILLON/118 clauses BROUILLON/409 liens, achats d'options vides et historiques intacts ; huit nouvelles tables 7B vides, aucun Client/Projet/plan/objet opérationnel créé.
- **RECETTE MANUELLE ATOUMWEB TOUJOURS À FAIRE. Lot 8 non commencé.** Aucun push/merge, publication, Abby, Bridge ou 8C. Attendre instruction séparée pour la suite.

### 2026-10-04 — OPERATIONAL-LOT8A-001 — Audit avant association blueprint / modèles d'actions

Auteur : AtoumWeb (validation et préparation limitée), Codex (audit et proposition documentaire).

- AtoumWeb autorise le Lot 8A opérationnel en préparation locale : référentiel Excel revu, une seule source de tâches de production, blueprint Vitrine structurel distinct de sa version complète historique, compatibilité persistée/versionnée, aucun rapprochement par nom. Aucune application Validation-MSI ni commit. Ce lot opérationnel est distinct des anciens lots d'export Bridge.
- Audit complet des blueprints en base : **2 versions publiées, 14 tâches**. Vitrine V1 conserve ses 13 tâches / 525 min et ses usages ; Projet standard V1 conserve sa tâche de validation de livraison sans AW associé. Aucun blueprint de test traité comme association commerciale réelle.
- **Point d'arrêt demandé sur les compléments** : sauvegarde avant publication `launch.backup_before` (15 min), et contrôle bandeau/consentement dans `quality.rgpd` (45 min pour l'ensemble pages légales + cookies) non explicitement couverts par les checklists A19/A21 et A12/A16. Le modèle standard est trop peu décrit pour une correspondance et reste hors associations V1. Aucune tâche retirée ou neutralisée.
- Proposition non appliquée : faire confirmer par AtoumWeb la couverture de ces contrôles dans A19/A16 avec temps inchangés, ou arbitrer un complément explicite. Rapport et matrice 112 lignes : `outputs/operational-lot8a/audit-blueprints-et-matrice-aw-lot8a.md` dans le dossier documentaire partagé.
- Aucune migration 60, version structurelle, modèle ou association créé. Code inchangé ; ni suite ni UI relancées pour ce seul audit. Deux fichiers de suivi documentaire mis à jour.
- Validation-MSI **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc** ; XLSX opérationnel **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangés. Aucun backfill, publication, commit/push/merge, Lot 8B, Abby, Bridge ou 8C. Attendre validation des compléments avant reprise de préparation.


### 2026-10-04 — OPERATIONAL-LOT8A-002 — Décisions complémentaires et préparation terminée

Auteur : AtoumWeb (décisions A19/A16), Codex (implémentation et simulation autorisées uniquement).

- Décisions AtoumWeb appliquées au manifeste : A19 point de restauration avant publication et A16 consentement uniquement technique, 60 min chacune inchangées ; A12 pages légales, A21 sauvegarde livraison. XLSX intact. Projet standard V1 strictement historique.
- Migration **60 préparée seulement** : cinq tables, deux colonnes métier nullable, références initiales/compatibilités immuables. Versions des modèles indépendantes des publications catalogue/clauses. Aucun backfill.
- Audit complet : Vitrine V1 13 tâches / 525 min inchangée ; V2 structurelle simulée sans ces tâches, conteneurs/Site/5 Pages conservés. V1 publiée maintenue ; V2 draft mise en usage opérationnel explicite/figée, associations exactes versionnées. Ancienne V1 + modèle bloquée ; structure sans modèle bloquée.
- **112 modèles / 432 actions importés en BROUILLON sur copie** : 94 refs/388 actions 8A ; 18 refs/44 actions 8B inertes ; trois packs zéro action ; 22 refs 8A à estimation obligatoire gardent estimation courante NULL. Aucun mapping réel inventé ni publication.
- **534/534 tests (63 fichiers, 31 nouveaux), typecheck OK, UI 69/69 sur trois thèmes, simulation SQLite 209/209**, intégrité OK/FK vide. Vitrine 21 actions/24 h 30 ; +2 Pages 29/28 h ; +Blog 34/31 h ; pack 4 articles 4/13 h ; application 3/3 h indicatives, estimation finale absente.
- Génération intégrée au Projet prévisionnel et aux révisions/acceptation ; provenance complète, versions épinglées, manuel conservé, retrait vierge et conflits travaillés. Chrono existant inchangé dans son calcul hors pauses ; cinq catégories métier historisées. Recette manuelle AtoumWeb à faire.
- Validation-MSI **1–59**, SHA **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, et XLSX **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf** inchangés. 112 AW/112 catalogue draft/118 clauses draft/409 liens/achats vides/historiques intacts.
- Branche `feature/project-page-compositions-v1`, HEAD **378f11568cddc462e29df6117425631e03e89b80** inchangé. Aucun commit/push/merge ni application réelle ; **ne pas démarrer Manager sur Validation-MSI (60 pendante)**. Aucun Lot 8B, Abby, Bridge ou 8C.
- Bilan `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md`, matrice exhaustive 112 et preuves dans `outputs/operational-lot8a` du dossier documentaire partagé. Les associations commerciales réelles, notamment le service historique inclus lié à Vitrine V1, restent à configurer explicitement après autorisation : les scénarios commerciaux sont synthétiques, le blueprint cloné est réel.


### 2026-10-04 — OPERATIONAL-LOT8A-003 — Migration 60 validée et clôture locale dédiée

Auteur : AtoumWeb (validation et commit local autorisé), Codex (application vérifiée et clôture).

- AtoumWeb valide la migration 60 seule et autorise le commit local dédié **Lot 8A — actions opérationnelles, temps et provenance**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; son SHA et les preuves sont consignés hors dépôt dans `outputs/operational-lot8a/cloture-git-lot8a.json`.
- Avant commit : **36 fichiers préparés**, toutes les empreintes validées conformes, aucun artefact de base/sauvegarde/XLSX/JSON de simulation/capture inclus. Code fonctionnel et migration 60 identiques à **534/534 tests, typecheck OK, UI 69/69, simulation 209/209**. Seuls les documents de suivi et le bilan préparatoire sont actualisés pour refléter l’application et cette clôture.
- Validation-MSI **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8** conservé sans écriture pendant clôture. Sauvegarde avant migration : **c0bda21b97924758f211d463382001d24bb5872e20e2a61c5831802a942cd1fc**, égal à la source sous verrou ; seconde écriture refusée. 113 tables historiques comparées exhaustivement et contre-vérifiées indépendamment, intégrité OK/FK vide, rejeu neutre logiquement/physiquement, aucun auxiliaire résiduel.
- Les cinq tables `operational_import_runs`, `operational_model_versions`, `blueprint_operational_profiles`, `catalog_operational_links`, `project_action_instances` sont **vides**. Colonnes business_category historiques **NULL**. Aucun import XLSX, modèle réel, ready, Vitrine V2 réelle, association opérationnelle, recalcul ou backfill.
- 112 AW / 112 versions catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options vides intacts ; les trois devis et deux Projets, Sites/Pages, nœuds, sessions, blueprints et documents historiques conservés. Aucun objet Lot 8B.
- **Recette manuelle AtoumWeb toujours à faire avant validation fonctionnelle finale. Raccord réel des associations commerciales non commencé.** Aucun Lot 8B, Abby, Bridge ou 8C ; aucun push/merge. Attendre une nouvelle autorisation avant import ou raccord réel.
- Bilan préparatoire `docs/OPERATIONAL_LOT8A_ACTIONS_AND_TIME.md` ; application réelle et contre-vérification dans `outputs/operational-lot8a/application-migration60-validation-msi.md/json` et `contre-verification-migration60.json`, hors dépôt. Les manifestes préparatoires validés sont conservés historiquement sans réécriture.

### 2026-10-04 — OPERATIONAL-LOT8A1-001 — Cibles et invariants préparés, application suspendue

Auteur : AtoumWeb (plan et précisions métier validés), Codex (implémentation locale et simulations).

- Plan structurel v2 `bases[]`, occurrences isolées par origine commerciale ; politiques A/B/C/D versionnées, contrats structurels et `provides/requires` explicites. A maximum 1 par ligne, Blog maximum 1 par Site, modules dans une Page parente choisie par ID. C sans structure fictive ; Sites manuels sans capacités implicites.
- D acceptée en pending : cadrage possible, actions dépendantes bloquées. Première affectation après acceptation journalisée comme décision opérationnelle sans changer le périmètre commercial ; aucune réaffectation silencieuse. Matrice **39 D / 146 actionKey proposée**, à valider avant activation réelle.
- Migration **61 additive, seule table `project_contribution_targets`**, préparée et testée uniquement sur copies. SQL, triggers de protection, preview sans création de Projet et jeton de plan, sélections/conflits UI, guards chrono/clôture, conservation v1/historique décrits dans `docs/OPERATIONAL_LOT8A1_TARGETS.md`.
- **590/590 tests, typecheck OK, UI 180/180 trois thèmes, simulation physique SQLite 971/971 et 47 scénarios**. Temps/quantités métier inchangés, modèles AW-TEST8A1 synthétiques ; recette manuelle AtoumWeb reste à faire.
- Validation-MSI reste **1–60**, SHA **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8**, tables 8A vides, historiques et XLSX intacts. Preuves sur les 117 tables existantes et résultats dans `outputs/operational-lot8a1` hors dépôt.
- **Aucune application 61, import réel, ready, Vitrine V2 réelle, nouvelle version commerciale ou association métier ; aucun backfill/commit/push/merge. Ne pas démarrer Manager contre Validation-MSI avant autorisation de migration.** Aucun Lot 8B, Abby, Bridge ou 8C. Arrêt avant toute activation réelle.

### 2026-10-04 — OPERATIONAL-LOT8A1-002 — Matrice D validée, migration 61 seule appliquée

Auteur : AtoumWeb (validation et application seule autorisées), Codex (application et contre-vérification).

- Matrice 39 D validée V1, **146 actionKey**, unique changement **AW-SEO-PERF-A04 none/integration → site/integration**. Répartition **59 none / 33 site / 24 page / 30 context**. Ancienne matrice conservée historiquement ; aucune activation réelle ni modification XLSX.
- Avant écriture, **40 fichiers préparés conformes aux empreintes**, branche/HEAD inchangés (**cfe3a01f5365b885f51bdbe9b9d47fbf408f832e**). Aucun changement applicatif depuis 590/590 tests, typecheck OK, UI 180/180 et simulation 971/971. Verrou exclusif, seconde écriture refusée, sauvegarde physique SHA identique à la source. Mode WAL sans trame avant écriture, checkpoint/fermeture, aucun WAL/SHM/journal résiduel.
- Migration **61 seulement**, désormais migrations **1–61** ; `project_contribution_targets` **0 ligne**, cinq tables 8A **0 ligne**. Source/sauvegarde **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8**, après **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**. Intégrité OK/FK vide ; rejeu du moteur migrations sans mutation logique/physique.
- Comparaison des **117 tables historiques**, colonne/ligne/valeur, et contre-vérification indépendante par multiensembles de tuples typés depuis la sauvegarde. Les 60 lignes historiques du registre sont inchangées, seule l’entrée 61 est ajoutée. Catégories métier et séquences inchangées. 112 AW / 112 catalogue V1 BROUILLON / 118 clauses BROUILLON / 409 liens / achats d’options zéro, trois devis, deux Projets, trois Sites, onze Pages, 36 nœuds, six sessions et deux versions blueprint conservés.
- Aucun import/modèle réel/ready/Vitrine V2/version commerciale/association/backfill/cible/recalcul. Aucun commit/push/merge. Aucun Lot 8B, Abby, Bridge ou 8C. Recette manuelle reste à faire. **Arrêt avant activation réelle et avant commit.**
- Bilan et preuves hors dépôt : `outputs/operational-lot8a1/application-migration61-validation-msi.md/json`, `contre-verification-migration61.json`, `sauvegarde-migration61-sous-verrou.json`, `validation-matrice-39D.json`. Les preuves de préparation restent historiques ; les empreintes après mise à jour documentaire sont consignées séparément.

### 2026-10-05 — OPERATIONAL-LOT8A1-003 — Clôture locale dédiée autorisée

Auteur : AtoumWeb (migration 61 validée et commit local autorisé), Codex (vérifications et clôture).

- Commit local **Lot 8A.1 — secure structural targets and contribution policies** autorisé sur `feature/project-page-compositions-v1`, parent **cfe3a01f5365b885f51bdbe9b9d47fbf408f832e**. Le commit contenant ce bloc clôture localement le lot ; SHA et preuve hors dépôt dans `outputs/operational-lot8a1/cloture-git-lot8a1.json`.
- **40 fichiers**, empreintes code/migration 61 identiques aux contrôles **590/590, typecheck OK, UI 180/180, simulation 971/971**. Aucun artefact ajouté. Relecture des trois documents post-application : uniquement état validé, aucune nouvelle règle métier. Matrice D conservée à **59 none / 33 site / 24 page / 30 context**, seul AW-SEO-PERF-A04 corrigé ; aucune activation.
- Base Validation-MSI toujours **1–61**, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**, cibles et cinq tables 8A vides. Aucun import/modèle ready/Vitrine V2/version commerciale/raccord réel.
- **Recette manuelle restant à faire ; aucun push/merge, aucun Lot 8B, Abby, Bridge ou 8C. Étape suivante non commencée. Arrêt après clôture locale.**

### 2026-10-05 — OPERATIONAL-LOT8A2A-001 — Import des modèles réels en BROUILLON, préparation uniquement

Auteur : AtoumWeb (préparation autorisée, aucune écriture Validation-MSI), Codex (extraction et dry-run sur copie).

- Working tree initial propre, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79**, branche canonique inchangée. Source **1–61**, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**. XLSX SHA **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf**, extraction identique au référentiel validé.
- **112 modèles / 432 actions** : 94/388 8A, 18/44 8B ; temps/règles/catégories/récurrences intacts, 22 estimations obligatoires 8A et deux 8B conservées, trois packs zéro action. Compléments A16/A19 déjà validés conservés. Matrice D corrigée **59/33/24/30**, sans association ni activation ; elle reste une configuration documentaire distincte du contenu des modèles.
- Importeur figé utilisé sur copie sans initialisation Manager : **729 contrôles réussis**, toutes les versions **draft n°1**, une provenance d'import ; seules **operational_import_runs +1 / operational_model_versions +112** changent. Aucune tâche Projet créée : les 432 actions sont les définitions dans les JSON des modèles. IDs catalogue exacts, UUID de simulation non réservés pour la base réelle.
- Rejeu avec plan recalculé : 112 unchanged, aucune mutation logique/physique ; ancien jeton refusé. Contre-épreuves de données invalides et versionnement sur copie, rollback intégral. Historique, schéma et autres tables conservés. 18 modèles 8B inertes, zéro ready et zéro association ; garde de compatibilité bloque toute tentative non configurée sur les nouvelles versions.
- **87/87 tests ciblés, typecheck OK** ; code fonctionnel/migrations inchangés, pas de nouvelle UI. Rapports et manifests dans `outputs/operational-lot8a2a` hors dépôt. Base réelle inchangée et six tables opérationnelles/cibles vides ; seul suivi documentaire actualisé.
- **Arrêt avant import réel**, aucun ready/profil/blueprint V2/version commerciale/raccord/recalcul/backfill/commit/push/merge. Aucun Lot 8B activé, Abby, Bridge ou 8C. Attendre la validation du dry-run et un feu vert distinct d'écriture.

### 2026-10-05 — OPERATIONAL-LOT8A2A-002 — Import réel autorisé et appliqué, BROUILLON uniquement

Auteur : AtoumWeb (feu vert d'import strictement limité), Codex (application sous verrou et contre-vérification indépendante).

- Branche/HEAD **feature/project-page-compositions-v1 / d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés, aucune modification fonctionnelle ou migration. Plan recalculé **112 create / 0 unchanged / 0 conflit** et empreintes XLSX/manifeste/canonique validées. Verrou SQLite EXCLUSIVE, écriture concurrente refusée, sauvegarde physique avant import SHA identique à la source **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**.
- Seules deux tables autorisées changent : **1 journal d'import / 112 versions opérationnelles n°1 draft / 0 ready**. ID journal réel **b76ea681-fefd-452e-872c-c39b0002fa83**. **94/388/22 Lot 8A ; 18/44/2 Lot 8B**, total 432 définitions et 24 estimations obligatoires, catégories 418/14. Les modèles 8B restent inertes, packs zéro action, aucun crédit/abonnement/intervention créé.
- Matrice D séparée inchangée **59/33/24/30**, non activée. Quatre tables profils/liens/instances/cibles **zéro** ; aucun blueprint V2, nouvelle version commerciale, raccord, recalcul ou backfill. Trois devis historiques : zéro action opérationnelle.
- **681 contrôles réussis sur copie et 681 sur base réelle**, intégrité OK/FK vide ; **116 autres tables identiques cellule par cellule**, schéma et séquences conservés. Contre-vérification indépendante Python depuis la sauvegarde et le baseline. Rejeu **112 unchanged**, zéro INSERT/journal supplémentaire, mutations logique/physique zéro.
- SHA après checkpoint/fermeture **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607**, aucun WAL/SHM/journal. 112 AW / 112 catalogue draft / 118 clauses draft / 409 liens / options zéro, tous devis/Projets/Sites/Pages/nœuds/sessions/documents/blueprints historiques conservés.
- Preuves et IDs réels hors dépôt dans outputs/operational-lot8a2a/application-reelle. Les livrables de préparation restent historiques. **Aucun commit/push/merge. Arrêt après import ; Lot 8A.2B non commencé.** Aucun ready/activation Lot 8B, Abby, Bridge ou 8C ; recette manuelle AtoumWeb toujours à faire.

### 2026-10-05 - OPERATIONAL-LOT8A2B-001 - Candidats, aucune activation

Auteur : AtoumWeb (preparation autorisee sur copies), Codex (manifeste et gardes).

- HEAD d9bbac5739310e5ed8ee1645fbad3db22f39ce79 inchange, aucun code/migration/commit/push/merge. 94 candidats avec IDs reels ; 6 A / 6 B / 43 C / 39 D ; matrice D 59/33/24/30 conservee.
- Sept structures candidates draft/operational_ready=0 sur copie, zero tache de production ; Page unique partagee Landing/Mariage, role commercial AW conserve, role SQL generique standard. Future Vitrine V3 sans composant historique preparee en JSON, non creee meme sur copie.
- Copie : templates 2->8, versions 2->9, profils 0->7 ; 94 liens operationnels / 12 liens structurels candidats non inseres. Modeles 112 draft / 0 ready ; aucun Projet/action/cible cree. Rejeu structures neutre.
- Deux blocages reproduits : API de liens exige ready meme pour staging ; Landing V2 contient atoumweb-web-v1 dont l apport historique est refuse par la composition v2. Propositions de staging distinct et traitement versionne Landing, pas de decision/implementation implicite.
- 18 cas de planification, pas conversions materialisees ; 553 controles, 107/107 tests cibles, typecheck OK. Choix addon ambigu/Page parente proposes et pending. Mappings A/B candidats ; mapping D valide.
- Validation-MSI 118 tables inchangees cellule par cellule, migrations 1-61, SHA e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607. Aucun profil/lien/instance/cible reel. Rapports outputs/operational-lot8a2b hors depot.
- Arret avant application reelle ; fermer les blocages et refaire un dry-run complet avant import. Aucun ready/publication/backfill/recalcul/8B/Abby/Bridge/8C.

### 2026-10-05 — OPERATIONAL-LOT8A2B-002 — Staging relationnel préparé, aucune application réelle

Auteur : AtoumWeb (décisions explicites et préparation seule), Codex (implémentation locale et copies).

- Deux blocages du bilan précédent fermés en préparation. Migration **62 préparée seulement**, colonne SQL catalog_operational_links.status draft/ready indépendante du modèle, défaut draft. Anciennes lignes/payloads conservés avec leur comportement opérationnel ; aucune migration 1–61 modifiée.
- Modèle ready + lien ready + profil operational_ready=1 si requis : gardes runtime/activation. Lien draft avec modèle draft enregistrable/testable seulement par staging explicite. MarkReady ne change aucun lien. Ready non rétrogradable ; contenu immuable, révision pour évolution. Plans staging non exécutables, anciennes révisions actives/épinglées conservées.
- Landing V3, comme Vitrine V3 : sans atoumweb-web-v1 ni aucun raccord hérité, offre seule propriétaire des actions. V2, service historique, blueprints publiés et usages anciens conservés ; 409 liens contractuels exacts, sans copie par version.
- Bases provides : Vitrine/Page unique wordpress ; Woo wordpress+woocommerce. Addons sans capacité indépendante consomment leur Site cible ; aucune capacité implicite pour Site historique/manuel.
- Copie seule : **7 structures draft, 7 profils operational_ready=0, 2 V3 draft, 12 raccords structurels, 94 liens draft/0 ready**. Modèles **112 draft/0 ready** inchangés ; 18 modèles 8B inertes. Classes 6/6/43/39, D 59/33/24/30 exacte.
- 18 scénarios depuis les lignes et associations persistées ; aucun Projet/action/cible matérialisé. Contre-épreuve D AW-SEO-PERF avec un vrai slot Site pending : les deux anciens intitulés D pending désignaient cadrage sans cible et application classée C ; aucun mapping métier modifié.
- **600/600 tests, typecheck OK, 17 249 contrôles dry-run, 17 151 contre-vérifications indépendantes**. Aucun écran/thème modifié, recette manuelle à faire. Rejeu structures/raccords/liens/V3/migration neutre logique/physique.
- Copie : anciennes cellules préservées, 108 tables identiques et dix avec ajouts seuls. Source **118/118 tables inchangées, migrations 1–61**, SHA **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607** ; XLSX exact. Aucune association/profil/instance/cible réel.
- Livrables **outputs/operational-lot8a2b/staging-draft** hors dépôt ; anciens rapports conservés. Branche/HEAD inchangés. **Aucune écriture réelle, aucun commit/push/merge, aucun ready/publication/backfill/recalcul/8B/Abby/Bridge/8C.**
- Arrêt avant application. **Ne pas lancer Manager sur Validation-MSI avec migration 62 pendante** ; application seulement sur nouvelle instruction.

### 2026-10-05 — OPERATIONAL-LOT8A2B-003 — Migration 62 seule appliquée

Auteur : AtoumWeb (autorisation explicite migration seule), Codex (application protégée et contre-vérification).

- Branche/HEAD **feature/project-page-compositions-v1 / d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés ; 27 fichiers préparés, code exact des 600/600 tests et typecheck OK. Aucune modification fonctionnelle, aucun commit/push/merge.
- Répétition sur copie réussie ; application réelle sous verrou SQLite EXCLUSIVE, deuxième écriture refusée, sauvegarde physique immédiate. SHA avant=sauvegarde **e4ae819264ef5b015368bc35b81a5ac761e0ed2a3d0e7a514898ae2e199bb607** ; SHA final **ea9869f40fcc4867b49d9efe33899fb3c567a236b0bd58760105c3519f861574**.
- Migrations **1–62** ; uniquement status SQL draft/ready des associations, triggers/index validés. UPDATE de compatibilité ready **0 ligne**. Aucune structure/V3/association/raccord réelle.
- **112 modèles draft/0 ready strictement inchangés** ; profils/liens/instances/cibles zéro. 112 AW / 112 catalogue V1 draft / 118 clauses draft / 409 liens exacts ; aucun achat ni action sur les trois devis historiques, deux Projets et tous autres objets historiques conservés.
- 118 tables comparées, anciennes cellules et multiplicité conservées ; 117 tables hors ledger sans modification de données, 61 anciennes migrations + seule ligne 62. Métadonnées/schémas historiques conservés hors migration autorisée ; séquences exactes. Contre-vérification indépendante depuis la sauvegarde read-only immutable.
- Intégrité ok, FK vide ; rejeu réel migrations [] neutre logique/physique. Checkpoint/fermeture et aucun WAL/SHM/journal.
- Bilan/preuves dans **outputs/operational-lot8a2b/application-migration62**, hors dépôt. Préparation sur copies conservée historiquement. Recette manuelle à faire.
- **Arrêt après migration62.** Aucun raccord/ready/structure/V3/publication/backfill/recalcul, aucun Lot8B/Abby/Bridge/8C. Aucun commit/push/merge ; suite sur instruction distincte.

### 2026-10-05 — OPERATIONAL-LOT8A2B-004 — Staging réel BROUILLON seul appliqué

Auteur : AtoumWeb (autorisation explicite), Codex (application protégée et vérifications).

- Autorisation AtoumWeb : staging réel BROUILLON seul. Branche feature/project-page-compositions-v1, HEAD **d9bbac5739310e5ed8ee1645fbad3db22f39ce79** inchangés. 27 fichiers préparés, code exact des **600/600 tests + typecheck OK** ; aucun changement fonctionnel.
- Empreintes base/XLSX/manifeste/configuration vérifiées ; garde et plan réel recalculés sous verrou EXCLUSIVE, deuxième écriture refusée, sauvegarde physique juste avant écriture. SHA avant=sauvegarde **ea9869f40fcc4867b49d9efe33899fb3c567a236b0bd58760105c3519f861574** ; SHA final après fermeture/rejeu **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**.
- Migrations **1–62** inchangées. Ajouts seuls : templates 2→8, versions blueprint 2→9, nœuds modèles 29→59, slots Site 1→8, Pages modèles 5→17, profils 0→7, raccords catalogue-blueprint 3→15, liens opérationnels 0→94, versions catalogue 157→159.
- Vitrine V3 et Landing V3 **draft**, zéro composant historique hérité, zéro raccord historique hérité et un nouveau raccord explicite chacune. Sept structures draft / sept profils **operational_ready=0** / 94 associations **draft, zéro ready**. UUID réels nouvellement alloués ; les IDs modèles réels sont conservés.
- **112 modèles draft, zéro ready** ; 18 modèles 8B inertes, 432 actions exactes. Instances/cibles/achats zéro ; 112 AW / 112 catalogue V1 draft / 118 clauses draft / 409 liens conservés. Matrice D **59/33/24/30** exacte.
- Page unique partagée Landing/trois Mariage, Landing create/existing explicite, Mariage create uniquement. Capacités selon décisions validées ; aucun Site manuel/historique qualifié, aucune tâche de production dupliquée.
- **18/18 previews** depuis copies du staging réel et ses vrais IDs, 323 contrôles ; contre-épreuve D AW-SEO-PERF réellement pending. Vitrine 21/24h30/1Site/5Pages ; Landing 13/12h45/1/1 ; Woo 20/42h30/1/4 ; Vitrine+2Pages+Blog 34/31h/8Pages. Options disponibles non achetées sans effet. Runtime normal refuse draft ; aucun Projet/action/cible matérialisé.
- **109/118 tables identiques**, neuf tables avec ajouts seuls ; toutes les anciennes cellules/multiplicités conservées. 17511 contrôles application ; 559 contre-vérifications Python indépendantes depuis sauvegarde. Trois devis / deux Projets / tous Sites/Pages/nœuds/sessions et blueprints historiques intacts.
- Rejeu exact : 69 lignes structurelles, 12 raccords, deux V3, 94 liens unchanged ; aucune mutation logique ou physique. Intégrité ok, FK vide, aucun WAL/SHM/journal.
- Bilan/SHA/94 IDs/manifeste réel/previews : **outputs/operational-lot8a2b/application-staging-reel**, hors dépôt. Préparations et conclusions historiques conservées.
- **Arrêt après staging réel. Aucun ready, publication, commit/push/merge, backfill/recalcul, Lot 8B/Abby/Bridge/8C. Recette manuelle AtoumWeb toujours à faire.** Suite uniquement sur nouvelle instruction.

### 2026-10-05 — OPERATIONAL-LOT8A2B-005 — Clôture locale dédiée autorisée

Auteur : AtoumWeb (validation/commit local autorisé), Codex (contrôles Git et conservation base).

- AtoumWeb valide le staging réel et autorise le commit local **Lot 8A.2B — stage operational structures and draft associations**, sans push ni merge. Le commit contenant ce bloc clôture localement le lot ; SHA et vérifications sont consignés hors dépôt dans **outputs/operational-lot8a2b/application-staging-reel/cloture-git-lot8a2b.json**.
- Parent attendu **d9bbac5739310e5ed8ee1645fbad3db22f39ce79**, branche **feature/project-page-compositions-v1**. **27 fichiers code/doc validés** seulement ; aucun SQLite, backup, XLSX, CSV/JSON de preuves ou artefact inclus. Code fonctionnel et migration 62 inchangés depuis **600/600 tests et typecheck OK**.
- Validation-MSI vérifiée en lecture seule : migrations **1–62**, SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**. **112 modèles draft/0 ready ; 94 associations draft/0 ready ; 7 profils operational_ready=0 ; 0 action Projet ; 0 cible contribution**. Aucune écriture pendant cette clôture.
- Staging réel validé, previews et contre-vérifications conservés dans le checkpoint historique suivant. Vitrine/Landing V3 et sept structures demeurent draft ; aucune activation, publication, backfill ou reconstruction historique.
- **Recette manuelle AtoumWeb toujours à faire. Aucun push/merge, aucun Lot 8B/Abby/Bridge/8C. Arrêt après commit propre ; Lot 8A.2C non commencé.**

### 2026-10-05 — OPERATIONAL-LOT8A2C-001 — Plan de recette visuelle, proposition seulement

Auteur : AtoumWeb (plan seulement autorisé), Codex (lecture et proposition UX/technique).

- AtoumWeb autorise uniquement la préparation du plan de recette visuelle BROUILLON, depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f** sur feature/project-page-compositions-v1. Working tree propre au départ. **Aucune implémentation autorisée à ce stade**.
- Lecture ciblée des moteurs staging, bootstrap, IPC/preload et composants existants. Le staging calcule déjà les plans, mais exige des lignes persistées et n’est pas exposé à la UI. Le démarrage Manager normal reconstruit des index : une simple page sans bouton de sauvegarde ne garantit pas l’invariance physique.
- Proposition documentée dans **docs/OPERATIONAL_LOT8A2C_PREVIEW_PLAN.md** : mode de lancement recette isolé, copie éphémère du staging réel, scénarios de lignes fictifs clairement signalés, IPC de consultation dédiée, arbre Sites/Pages/modules, actions/temps, provenance et choix logiques. Aucun changement des temps/quantités/politiques.
- Les fixtures d’options ne sont pas présentées comme une composition réelle de Vitrine/Landing V3. Limites explicites du staging actuel : Site/Page de base projetés sélectionnables ; contexts et Sites historiques non affectables par cette API, affichés pending. Aucune extension silencieuse.
- Scénarios prévus : 18 cas validés + vrai D pending AW-SEO-PERF ; gardes et tests envisagés pour source stable, refus de mutation, runtime draft, isolation, trois thèmes Electron et recette manuelle.
- Validation-MSI non ouverte en écriture, SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** recontrôlé, aucun WAL/SHM/journal. Aucun Manager lancé, aucune copie/scénario appliqué, aucun test/simulation lancé pour cette passe documentaire.
- **Plan proposé, non validé.** Seule documentation modifiée. Aucun code, migration, ready, activation, matérialisation Projet/action/cible, commit/push/merge, Lot8B/Abby/Bridge/8C. Attendre la validation du plan avant implémentation.


## 05/10/2026 — Lot 8A.2C réalisé, recette manuelle à faire

- Plan et implémentation autorisés par AtoumWeb depuis **c2bd002deec7e6742a24943132627c2d3a79bb5f**, branche **feature/project-page-compositions-v1**. Aucun commit/push/merge.
- Démarrage **--operational-recipe** avant workspace/restore/DatabaseService.initialize ; copie physique éphémère du staging réel, jamais de connexion en écriture à la source. Fixtures privées dans savepoint, rollback et comparaison exhaustive après chaque calcul. Moteur **OperationalStagingService.previewQuote**, adaptateur get/all uniquement.
- Fenêtre dédiée / preload restreint : cinq opérations état, références, scénarios, preview, fermeture. API métier normale absente ; propriétaire/frame et champs contrôlés. Aucun bouton/IPC ready, activation, Projet/action/cible ou chrono.
- UI trois thèmes, quantités/options de recette, choix logiques Site/Page, structure/actions/checklist/provenance/pending ; bandeau **BROUILLON — simulation uniquement — aucune donnée Projet créée**.
- **625/625 tests**, typecheck OK, Chromium **133/133** avec vraie IPC/preload et cycle de fenêtre ; **19/19 scénarios** dont AW-SEO-PERF pending, A04 site/integration ; **36 captures**. Aucun changement des temps, politiques, modèles ou migrations.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** strictement identique. Python SQLite ro/immutable : **118 tables identiques**, migrations 1–62, intégrité ok, FK vide, absence WAL/SHM/journal ; 112 modèles draft/0 ready, 94 liens draft/0 ready, sept profils readiness=0, zéro action/cible/achat. Historique intact.
- Nettoyage vérifié sur fermeture API/native et échec contrôlé d'initialisation/chargement. Rejeu déterministe, aucun résidu du scénario précédent. Refus métier de quantité/cible : rollback neutre, scénario corrigeable.
- Limites conservées : Landing sur Site existant non validé ; contextes D et Sites historiques pending. Options fixtures signalées comme non configurées dans l'offre réelle ; aucune résolution inventée.
- Preuves hors dépôt : **outputs/operational-lot8a2c/BILAN_LOT8A2C.md**, recette-chromium.json, source-before/after.json, journaux et captures. **16 fichiers code/doc**, aucune migration.
- **Arrêt pour validation AtoumWeb ; recette manuelle à faire. Aucun ready/activation/publication, Lot 8B, Abby, Bridge ou 8C.**


### 2026-10-05 — OPERATIONAL-LOT8A2C-002 — Passe UX seule autorisée et réalisée

Auteur : AtoumWeb (validation technique et demande UX), Codex (présentation et contrôles).

## 05/10/2026 — Lot 8A.2C, passe UX seule réalisée avant recette manuelle

- Validation technique AtoumWeb reçue, puis autorisation d'une passe UX seule. Aucune nouvelle règle métier, aucune modification de moteur, scénario, temps, quantité, mapping ou association.
- Vue principale : noms catalogue, quantités, actions/temps, Sites/Pages/modules, estimation complète/incomplète, option achetée/non achetée, destination définie/à choisir. Codes, UUID, états internes et provenance dans **Détails techniques** repliés par défaut, accessibles sur demande. Libellés accessibles des champs également simplifiés.
- Bandeau courant : **RECETTE — simulation uniquement — aucune donnée enregistrée**. Avertissement visible : rien activé ni enregistré dans devis/projets. Message SEO Performance conforme à la demande ; aucune résolution de destination inventée. Limites Landing existant / contextes / Sites historiques conservées en langage métier.
- **Typecheck OK ; Chromium 481/481**, 19 scénarios dans chacun des trois thèmes et quatre vues, 36 captures après + 36 captures avant conservées. **19 DTO complets strictement identiques** à la recette technique précédente. Empreintes des dix fichiers techniques protégés identiques ; état/effets/handlers UI inchangés. Suite **625/625** précédemment validée, non relancée pour cette passe de présentation uniquement.
- Validation-MSI SHA avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, migrations 1–62, intégrité ok, FK vide, aucun WAL/SHM/journal source. Modèles/liens draft uniquement, profils inactifs, zéro action/cible/achat.
- Première passe Chromium interrompue par sa limite de 120 s ; délai du harness adapté, passe finale complète verte. Les copies des sessions terminées et échecs contrôlés sont supprimées. Une copie du premier processus interrompu reste dans **%TEMP%/atoumweb-operational-recipe-2e23Wn** : nettoyage shell refusé par la politique automatique, y compris fichiers explicites sans récursion. Source Validation-MSI intacte ; ce reliquat est signalé, aucun nettoyage global revendiqué.
- Passe limitée à six fichiers déjà dans le Lot 8A.2C : renderer TSX/CSS, harness UI, PROJECT_STATUS, roadmap commune et plan de recette. Preuves et galerie **outputs/operational-lot8a2c-ux/** hors dépôt. **Aucun commit/push/merge, ready, activation ou matérialisation. Arrêt pour recette manuelle AtoumWeb.**


### 2026-10-06 — OPERATIONAL-LOT8A2C-003 — Recette sur le principe et prochaine recette métier

Auteur : AtoumWeb (décisions), Codex (audit et documentation).

## 06/10/2026 — Recette 8A.2C sur le principe, audit du vrai Devis

- AtoumWeb termine la recette sur le principe : operational-recipe reste un banc d'essai isolé du moteur, jamais une vue métier autonome. Parcours cible Prospect → Devis/prestations/options/clauses → préparation Abby → Projet prévisionnel → même Projet actif après acceptation ; le devis signé comprend le contrat, aucun contrat indépendant.
- Future vraie vue Projet : bloc global **Conditions avant démarrage** (devis accepté, acompte, contenus/visuels, accès, informations légales, autres prérequis), puis **Origine commerciale → Structure prévue → Affectation → Plan de travail**, ce dernier ouvert par défaut en production si pertinent. Réutiliser Sites/Pages/slug/sections/modules, actions manuelles, référence immuable/estimation courante/chrono et provenance ; ne pas ajouter ces fonctions au banc.
- Nouvelle décision : Mariage Essentiel et Grand Jour restent chacun 1 Site/1 Page ; **Histoire devient mini-site multipage**. L'ancienne décision commune 1/1 est dépassée pour Histoire uniquement, et demeure conservée historiquement. Configuration actuelle partagée 1/1 non modifiée : nombre/liste/rôles des Pages Histoire non précisés, question à AtoumWeb en attente. Aucune structure commerciale inventée, temps 10 actions/23 h non modifié. Préparer ensuite un profil/version distinct sans toucher la Page unique des autres formules.
- Audit maître : **docs/AUDIT_DEVIS_POST_RECETTE_8A2C.md**. Devis/option/CGV/snapshot/Client/Projet prévisionnel et moteur opérationnel existent ; principales limites : sélection privilégiant ancien publié, brouillons affichables mais refusés à l'ajout, zéro option configurée sur les V3, 118 clauses draft non consommées, runtime opérationnel exige ready, copie Abby limitée au texte contractuel, absence de taxonomie sous-catégorie et d'admin opérationnel complet.
- Exigence future de roadmap : séparation moteur / base métier ; administration depuis Manager des AW, taxonomie, types/prix/textes Abby/commerciaux, clauses, actions/temps, structures, capacités/cibles, versions/états ; exports complets et métier éditables, réimport avec diff/version brouillon. Architecture versionnée compatible, module non développé. Ne pas confondre publication commerciale/contractuelle et états opérationnels ready.
- Proposition minimale non démarrée : recette sur vraie UI Devis en workspace isolé avec faux dossiers explicites et consultation staging réutilisée, sans ready/publication/Projet matérialisé. Bout-en-bout acceptance/Projet V1 à cadrer séparément sans contourner les guards. Aucun nouveau gros développement.
- **174/174 tests ciblés**, huit fichiers existants. Validation-MSI source SHA **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; contre-vérification avant/après et 118 tables inchangées dans outputs/audit-devis-post-recette-8a2c. Historique, 112 modèles draft, 94 liens draft, sept profils inactifs et zéro action/cible/achat conservés.
- Documentation seulement dans cette passe ; aucun code fonctionnel modifié, aucun import, ready, activation, publication, base/migration, commit/push/merge ou Lot8B/Abby/Bridge/8C. **Arrêt pour validation du diagnostic et précision des Pages Histoire.**


### 2026-10-06 — OPERATIONAL-LOT8A2C-004 — Histoire multipage : décision et correction préparatoire

Auteur : AtoumWeb (quatre Pages et temps conservés), Codex (préparation/test sur copies).

## 06/10/2026 — Correction préparatoire Mariage Histoire, arbitrage des quatre Pages appliqué sur copies

- AtoumWeb précise Histoire : **1 Site / 4 Pages** — Accueil `/`, Notre histoire `/notre-histoire/`, Le Jour J `/jour-j/`, Espace privé `/espace-prive/`. Espace privé = protection prévue pour galerie/souvenirs, vidéo/diaporama, livre d'or, contenus post-mariage ; aucune protection activée par le plan. RSVP/galerie/vidéo restent des sections/modules selon Projet, pas des Pages supplémentaires.
- Configuration versionnée **mariageHistoireStructure.json** ; préparation distincte du blueprint Page unique partagé, profil inactif et association candidate draft. Raccord Histoire remplacé seulement dans le savepoint de la copie de recette, puis rollback intégral. Aucun moteur normal ni schéma/migration modifié ; aucune application dans Validation-MSI.
- Essentiel et Grand Jour restent 1/1 ; Landing inchangée. Modèle Histoire, dix textes d'actions, checklist, catégories, minutes et politiques/cibles existantes intacts : **10 actions / 1380 min = 23 h**. Aucune multiplication des actions par quatre Pages.
- Quatre tests de non-régression ajoutés : profil distinct/draft/idempotence/rollback/historique ; refus du chemin réel ; vrai staging des trois Mariage et actions exactes ; génération synthétique des quatre slugs et conservation du partage one-page. Le moteur existant normalise les slugs de Projet sans slash final ; chemins de configuration/preview gardés comme demandés, aucune modification de ce moteur.
- **629/629 tests complets**, typecheck OK, Chromium **485/485**, 19 scénarios × trois thèmes. Histoire 1/4/10/23h, chemins et intention de protection contrôlés ; les 18 autres DTO identiques hors exposition descriptive des chemins et descriptions. Trois captures Histoire ajoutées aux 36 captures habituelles.
- Réserve métier avant validation de la charge : A02 architecture/navigation, A03 contenus des quatre Pages, A05 espace privé/enrichissements, A06 responsive multi-pages, A07 navigation/liens/accès protégé méritent précision/revue. Aucun intitulé n'impose une Page unique ; les 23 h ne sont ni changées ni certifiées suffisantes. Checklist protection/navigation non inventée ou ajoutée sans accord.
- Validation-MSI avant/après **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables exactes, migrations 1–62, 112 modèles draft / 94 liens draft / sept profils inactifs / zéro action/cible/achat. Le staging réel reste au checkpoint antérieur : seule la préparation sur copies est corrigée ; application réelle sur instruction distincte.
- Preuves : **outputs/mariage-histoire-4-pages/** hors dépôt. Aucun ready/publication/activation réelle, import/backfill, commit/push/merge, Lot8B/Abby/Bridge/8C. **Arrêt pour validation.**


### 2026-10-06 — OPERATIONAL-LOT8A2C-005 — Revue charge Histoire, propositions seulement

## 06/10/2026 — Revue métier des 23 h Histoire, propositions sans application

- Structure Histoire 1 Site/4 Pages validée par AtoumWeb ; revue de charge autorisée sans modification de temps/modèle/staging/prix. Référence réelle maintenue à 10 actions/23 h et 899 €.
- **Propositions à arbitrer** : minimum 1650 min/27 h 30/32,69 €/h ; référence recommandée 1980 min/33 h/27,24 €/h ; prudent 2400 min/40 h/22,48 €/h. Ratio brut prix/temps, pas rémunération nette ou rentabilité démontrée. Prudent = +7 h/+21,2 % sur la proposition 33 h.
- Détail par action et hypothèses dans **docs/REVUE_CHARGE_MARIAGE_HISTOIRE.md**. Variation limitée aux A02/A03/A05/A06/A07 ; cinq autres budgets maintenus dans les propositions. Contenus fournis, solutions standard maîtrisées, protection standard sans portail membres, deux cycles bornés, une passe post-mariage bornée. Pas de montage/retouche/développement sur mesure inclus implicitement.
- Point critique : A05 150 min actuel trop serré pour protection/galerie/vidéo/livre d'or/post-mariage ; A06/A07 doivent couvrir quatre Pages, navigation et accès négatifs. Périmètre de protection des médias directs à préciser ; aucun mécanisme choisi ou activé.
- Aucune adoption de 33 h, marge ou réévaluation du prix. Validation-MSI SHA inchangé **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**. Documents de revue seulement ; aucun code, migration, modèle, temps, staging, ready/publication/activation réelle, commit/push/merge ou nouveau lot. **Arrêt pour arbitrage AtoumWeb.**


### 2026-10-06 — OPERATIONAL-LOT8A2C-006 — Candidats Histoire, dernier arbitrage 27 h 30

## 06/10/2026 — Histoire : dernier arbitrage 27 h 30 provisoires / 899 €, candidats seuls

- Consigne finale AtoumWeb prioritaire : structure 1 Site/4 Pages validée ; référence interne **1650 min/27 h 30 provisoires**, à recalibrer sur les premiers temps réels. **1980 min/33 h = estimation prudente/seuil de vigilance uniquement**. Répartir selon le scénario minimum de la revue : 90/150/420/150/240/150/150/150/90/60. Essentiel 630 et Grand Jour 1020 inchangés.
- Prix **899 € inchangé** ; aucune version à 1290 créée. Propositions 33 h standard et 1290 supersédées avant application, trace conservée. Candidat catalogue V3 draft (textes/périmètre seuls) + modèle V2 draft + structure Histoire distincte/profil inactif/association draft, dans manifeste hors dépôt ; aucune écriture réelle.
- Doctrine : mot de passe de Page seulement, pas de promesse de protection des URLs médias ; portail/protection renforcée hors standard. Livre d'or nom/message, sans compte, avec modération. Une intervention post-mariage maximum 120 min dans les 60 jours, incluse dans A05 240 min ; au-delà complément après accord. Responsable/modalités de modération et dates à renseigner, pas d'invention.
- Textes/checklists candidats adaptés au multipage/fonctions/tests/planification. Référence non dupliquée en durée catalogue et aucune promesse de temps Client. Aucun objet Lot8B, compteur de crédit ou facturation créé. La charge reste une hypothèse, pas un forfait de temps garanti.
- Clauses partagées **intactes** : zéro nouveau template/version/liens. Conditions particulières Histoire proposées via Builder existant ; dérogation explicite 60 jours à la règle générale trois mois pour cette seule prestation. `specialTerms` catalogue seul ne suffit pas lorsque des templates publiés sont liés ; injection/retrait automatiques non implémentés, vérification dans le devis requise avant usage.
- **47/47 contrôles natifs sur copie**, arithmétique/provenance/statuts/historique/rejeu/FK/integrity ; bibliothèque partagée inchangée. Aucun code moteur/UI modifié, suite complète 629 précédemment validée non relancée pour artefacts/documentation. Détail **docs/MARIAGE_HISTOIRE_REVISION_BROUILLON.md** ; manifeste/rapport dans outputs/mariage-histoire-33h-brouillon (nom de dossier historique, contenu courant 27 h 30).
- Validation-MSI SHA inchangé **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526**, 118 tables identiques, anciens Histoire899/23h, devis/projets/temps/sourceXLSX intacts. Doctrine/matrice/actions/sources/changelog juridiques vivants actualisés, archives de recherche conservées.
- **Arrêt pour validation avant application.** Aucun staging réel, ready/publication/activation, migration/import réel, commit/push/merge, Lot8B/Abby/Bridge/8C.


### 2026-10-06 — OPERATIONAL-LOT8A2C-007 — Histoire staging réel BROUILLON autorisé et appliqué

## 06/10/2026 — Histoire appliqué au staging réel en BROUILLON uniquement

- Autorisation AtoumWeb appliquée : Catalogue Histoire **V3 draft / 899 €**, modèle opérationnel **V2 draft / 1650 min (27 h 30 internes provisoires)**, structure distincte **1 Site / 4 Pages**, profil inactif, association draft. UUID réels nouvellement alloués ; aucune réutilisation des IDs de simulation.
- Verrou EXCLUSIVE, sauvegarde physique SHA identique, concurrent writer refusé, plan/manifeste/code/Git recontrôlés. SHA avant=sauvegarde **3804d50e3e87b3136c1f5c784aa8ec31125780c988f3e87b4b3e23e601f8f526** ; SHA final après checkpoint/fermeture/rejeu **9aea84d704841cc8c29c2360031d10e99552514089082572441211b7dbcc65fb**. Aucun WAL/SHM/journal final.
- **108 contrôles application**, **148 contrôles indépendants Python ro/immutable** depuis sauvegarde. Intégrité ok/FK vide, schéma/migrations1–62 exacts. Rejeu complet logique et physique neutre ; mêmes IDs, aucun import/version/lien supplémentaire.
- Diff : quatorze tables avec ajouts seuls, sauf **catalog_items.updated_at** Histoire (une cellule de métadonnée). 104/118 tables identiques, anciennes lignes conservées. Templates8→9, versions9→10, nœuds59→64, Sites modèles8→9, Pages modèles17→21, profils7→8, catalogue159→160, raccords15→16, composants19→20, imports1→2, modèles112→113, liens94→95, activité483→484. Rapport complet hors dépôt.
- **113 modèles draft /0 ready ;95 associations draft /0 ready ;8 profils inactifs**. Essentiel630/GrandJour1020 exacts. Anciens Histoire899 €/23h, devis/projets/Sites/Pages/nœuds/temps, clauses118/liens409 conservés. Aucune Page RSVP/galerie/vidéo implicite.
- Conditions particulières automatiques toujours réservées au prochain lot Devis ; aucun texte de devis/contrat modifié. 33h = vigilance documentaire seulement. Aucun1290 €, ready/publication/activation, action/Projet/cible, Lot8B/Abby/Bridge/8C.
- Premier essai refusé sans écriture par garde trop strict sur les sidecars de son propre verrou ; SHA initial conservé. Garde sous verrou limité au WAL sans frame validée, répétition puis application réussies ; trace de refus conservée.
- Le banc operational-recipe conserve ses gardes du checkpoint antérieur et refusera la source après cette application, sans assouplissement automatique. Code fonctionnel/HEAD **c2bd002deec7e6742a24943132627c2d3a79bb5f** inchangés ; aucun commit/push/merge. **Arrêt pour validation.**
- Preuves/backup/IDs/diff : **outputs/mariage-histoire-33h-brouillon/application-reelle/BILAN_APPLICATION_HISTOIRE.md** (nom de dossier historique ; référence réelle27h30).


### 2026-10-06 — OPERATIONAL-LOT8A2C-008 — Validation-MSI développement et découplage autorisé

## 06/10/2026 — Découplage du banc technique avant checkpoint

- AtoumWeb autorise le correctif, la suite/typecheck/harness et le commit local si verts, puis l'audit exhaustif112AW ; aucun push/merge. Lot Devis et Lot8B non démarrés, aucune publication/ready pendant l'audit.
- Nouvelle doctrine : Validation-MSI = développement/test non productif, données mutables identifiées TEST. Plus de SHA/comptages immuables ni copies systématiques pour la recette métier. Sauvegardes avant migrations/destructions importantes, intégrité et versionnement conservés. AGENTS et exclusions Git alignés.
- Banc conservé comme diagnostic : source par défaut = fixture JSON versionnée (18 modèles/8 structures pour19scénarios), construite par les migrations et sans lecture Validation-MSI. Source explicite optionnelle pour diagnostic maîtrisé, jamais chemin de développement codé. Comptages calculés, validation par schéma/intégrité et non photographie de la base.
- Trois tests Histoire devenus fixture-based, dont état historique23h et état courant27h30/4Pages. Empreintes de documents/packages/fixtures conservées ; empreinte du JSON de fixture documentée, aucune empreinte Validation-MSI dans la suite normale. Fenêtres/harness alimentés par fixture, répertoires temporaires propres par test. Rollback du banc uniquement pour rejouer ses scénarios ; aucun mécanisme de recette utilisateur parallèle ajouté.
- 630/630 tests complets et typecheck OK ; harness Chromium 484/484, 19 scénarios × trois thèmes, sans source Validation-MSI. États métier du Manager, modèleHistoire appliqué et Validation-MSI non modifiés. Anciens simulateurs à SHA de checkpoint conservés comme outils historiques hors suite normale.
- Checkpoint prévu : **Lot 8A.2C — diagnostic opérationnel et checkpoint Mariage Histoire**, sources/doc/tests/fixtures uniquement, aucun SQLite/backup/capture/output. Harness vert : checkpoint local autorisé, audit 112 AW lecture directe ensuite, sans activation ni changement des temps.


### 2026-10-06 — OPERATIONAL-LOT8A2C-009 — Checkpoint et matrice exhaustive, arrêt pour validation

## 06/10/2026 — Audit exhaustif 112 AW terminé, sans activation

- Checkpoint local du découplage **111b9196a7ee17ef1d9faa494d8b24197ca1086c**, branche feature/project-page-compositions-v1, 30 fichiers ; **630/630 tests, typecheck OK, Chromium 484/484**. Working tree propre au commit ; aucun push/merge. Sources/fixtures/doc uniquement, aucun artefact.
- Audit Validation-MSI en lecture seule directe : **112 références / 432 actions effectives (388 8A, 44 8B) / 409 liens contractuels exacts**. 112 modèles validés nativement, 94 politiques 8A valides ; aucune différence non autorisée au manifeste, seul Histoire V2 applique les arbitrages validés. Aucune application Histoire rejouée.
- Classement proposé du référentiel : **64 PRÊTE 8A / 28 À COMPLÉTER 8A / 18 LOT 8B / 2 BLOQUÉE**. Prête = données/raccords disponibles pour vente directe/base compatible, pas publiée ni recette complète. Les 28 incluent 22 estimations/plans Projet et six raccords/checklists. Deux urgences autonomes à 0 min (AW-CONT-URGENT-48/AW-TECH-URGENT) demandent clarification de portée.
- **72 références 8A chiffrées / 22 à estimation Projet obligatoire** (24 tous lots), toutes hypothèses initiales à recalibrer. 12 références avec structure, 41 nécessitant une cible. Les 146 mappings D restent 59/33/24/30. Les définitions historiques Histoire portent le total stocké à 442 actions sur toutes versions, pas 442 actions effectives.
- Défis transversaux : états actuels draft/inactifs, sélection publiée ancienne/lecture AW-version, options d'offres non configurées, données commerciales détaillées/bloc Abby, conditions particulières Histoire, estimation/production personnalisée et recette end-to-end réelle. **0 chaîne V1 complète utilisable actuellement**, conséquence des états et raccords, pas absence de moteur.
- 8B : services génériques périodes/quotas/checklists, interventions, packs/mouvements/solde, consommation/dépassements/rapports déjà présents ; raccords AW/version/ligne et paramètres/calendriers restent à construire. Aucun 8B artificiellement activé dans 8A.
- Rapport et classeur filtrable 11 onglets dans **outputs/audit-exhaustif-112-aw/**, hors Git : BILAN_AUDIT_112_AW.md et AtoumWeb_Matrice_112_References_2026-10-06.xlsx ; 432 actions détaillées/112 revues/118 clauses/409 liens, totaux calculés, aucune erreur de formule, vérification visuelle et export.
- Aucun état, prix, temps, règle métier ou donnée de recette modifié par l'audit. Aucun lot Devis/8B démarré, aucun push/merge. **Arrêt pour validation.** Seuls PROJECT_STATUS/roadmap mis à jour après le checkpoint, non committés ; aucun changement fonctionnel après les contrôles.


### 2026-10-06 — AW-112-INTEGRATION — autorisation AtoumWeb / implémentation en cours

Base `feature/project-page-compositions-v1@111b9196a7ee17ef1d9faa494d8b24197ca1086c`. Audit112 validé ; fin des audits/re-arbitrages. Autorisation de terminer les94A+18B et le vrai parcours Devis/Builder/Abby manuel/Projet/consommation, puis recette native112 dans Validation-MSI de développement. Suspension8B opérationnel levée par instruction distincte ; aucun Bridge/8C/push/merge.

Règles métier acquises reprises dans les configurations versionnées : Histoire899/1650/4Pages, urgence rattachée sans production autonome, détour9€ minimum45€ quantité conservée, checklists photo, document parent, estimations dossier variables. Réponse AtoumWeb complémentaire : hébergement, mise en service **incluse avec estimation spécifique à renseigner**, aucune référence minute inventée. Mensuel jusqu’à résiliation et annuel renouvellement exprès conservés depuis doctrine canonique.

Implémentation préparatoire : migrations63/64 additives, services existants réutilisés, paramètres source de ligne/particularités au snapshot ; provenance8B vers crédits/interventions/périodes. Pas encore d'application de ces migrations ni de nouvelle mise en usage au moment de cette entrée. Tests et recette finale à achever. Responsable : agent courant ; restitution finale avec preuves et commit proposé.


### 2026-10-07 — AW112-CYCLES — décision AtoumWeb et raccords, recette en cours

AtoumWeb tranche les nouveaux abonnements : cycles opérationnels de dateàdate depuis démarrage réel, indépendants de la facturation ; annuel=12cycles mensuels, quotas remis à chaque cycle. Mensuel jusqu'àrésiliation et annuel par renouvellementexprès conservés. Moteur calendaire historique non migré. Configurations d'association versionnées et snapshots vendus préservés.

Migrations63–65 appliquées après sauvegardes et tests ; état courant :112modèles/112associations enusage dans baseTEST,118clauses consommables pour recette locale et409liens inchangés. Aucun travailBridge/8C. Une nouvelle version commerciale sans variation de prix conserve règles/minimums et versions utilisées ; une nouvelle version de modèle ne remplace pas les routines vendues.

Résultats corrigés en recette : moduleWoo/section avec Siteactif mais parentPagepending diffère la matérialisation ; parent exact àcréation et préservation après usage. GBPétablissement supplémentaire réutilise la souscription principale, avec routines/provenance/cible propres. Estimation requise ne copie pas la référence du cadrage comme estimationfinale.

Dernière suite complète653/653 +typecheckOK ; vraie UI, preload etIPC pour la recette112, dossiersTEST et piècesPDFfictives, compteur final encore en cours. Aucun oracle Validation-MSI ni suite normale dépendante de la base. Aucun commit/push/merge. Prochaine action : terminer la recette et rendre la matrice avec anomalies/limites et commitproposé.


### 09/10/2026 — UX-RECETTE-PROSPECT-CONTRAT-01 (Codex, résultat local)

Autorisation AtoumWeb : corriger les captures de la recette manuelle, puis rendre les contrôles juridiques incomplets navigables jusqu’au champ. Base main@8e05a472 ; migration 66 déjà validée/appliquée, aucun schéma nouveau. Prefill descriptif des seules versions vendues, décisions juridiques explicites conservées, événements convenus admis pour les jalons, brouillons incomplets sauvegardables mais non finalisables, snapshots figés. Prospection : absence de Site, Offres/Services, alias d’affichage, contenus repliables, contrôle indépendant, décisionnaire inline, fenêtre détachée cohérente et scrollable.

Typecheck /695 tests OK ; UI 134 natifs +37 Prospection +21 préparation +20 options sur trois thèmes. Tests isolés ; Validation-MSI contrôlée readonly, intégrité/FK correctes, recette humaine conservée. Aucun commit/push/merge, publication, nouvelle sauvegarde ou travail Bridge/8C. Prochaine action : charger le backend corrigé par redémarrage normal après enregistrement de la saisie utilisateur, puis laisser AtoumWeb poursuivre sa recette manuelle.


### 09/10/2026 — INTEGRITE-UX16-UX03-02 (Codex, autorisation / réalisation)

AtoumWeb valide UX-16/03 et précise : source réellement Manager compatible, schéma/migrations/intégrité/FK, cible immuable, ancienne demande ambiguë refusée, copie sûre/récupération, Windows/fichiers occupés/rejeu ; transaction englobant statuts, débit, solde, timestamps et journaux, erreurs multiétapes et autres couvertures, aucun rattrapage historique. Commits/PR corrective autorisés, aucune fusion automatique ; pas de changement destructif/migration/règle imprévue sans arbitrage.

Implémentation : source readonly et copie indépendante vérifiée y compris CHECK, destination canonique/identité, empreinte, consommation des demandes avant application, sauvegarde pre-restore vérifiée, SQLite Backup API transactionnelle et erreurs natives explicites. Clôture sous savepoint avec débit imbriquable, statut dérivé et activité dans la transaction. 58 tests ciblés, 745 complets/typecheck verts ; Windows temporaires, intégrité/FK/replay, récupération et idempotence. 11 fichiers source/tests/suivi, aucun React/CSS, schéma 1–66 inchangé ; aucun accès/démarrage Validation-MSI, publication métier ou travail UX V2/Bridge/8C. Deux anciennes fixtures TEMP interrompues non supprimées après refus automatique d'approbation, pas de contournement ; exécutions finales nettoyées et aucun artefact committé. Prochaine action : PR corrective vers main, revue humaine avant fusion.

### 09/10/2026 — INTEGRITE-UX16-UX03-01 (Codex, diagnostic / proposition)

Instruction AtoumWeb : traiter les anomalies fonctionnelles de l'audit #80 en lots indépendants, sans refonte UX/UI V2 ni modification de Validation-MSI. Commencer UX-16/03 et présenter le diagnostic avant changement risqué. Branche `codex/fix-manager-integrity-ux16-ux03` créée depuis main@eb252d5c ; PR documentaire non modifiée.

Résultats isolés : restauration A appliquée à B après changement de workspace, source non SQLite acceptée ; terminaison sans temps terminé laissant `to_validate`, erreur tardive injectée laissant aussi le débit engagé. Cas nominaux vérifiés. Six probes sur bases/profil temporaires ou mémoire, nettoyés/fermés ; intégrité des fixtures lisibles OK/FK vide, registre mémoire 1–66. Tests existants ciblés 8/8 verts mais incomplets.

Propositions : épingler/contrôler la destination et la source de restauration, refuser les marqueurs legacy ambiguës, sécuriser les échecs de remplacement ; transaction commune de terminaison et savepoint de débit incluant statut dérivé/journal. Aucun changement fonctionnel réalisé, aucune migration, aucun démarrage Manager/accès Validation-MSI, commit/push/merge. Rapport lié depuis PROJECT_STATUS ; prochaine action : validation AtoumWeb puis lots séparés avec tests de non-régression. UX-01/04/05/02 restent ultérieurs.

### 09/10/2026 — GIT-LIAISON-MANAGER-01 (Codex, autorisation / checkpoint)

AtoumWeb demande la mise à jour GitHub et des fichiers de liaison sur l’état du Manager. Base main@8e05a472, origin/main identique après fetch ; aucune nouvelle fonctionnalité développée pendant cette publication. Checkpoint des 61 fichiers code/tests/documentation de la Bibliothèque contractuelle, migration 66 et recette UX, contrôles 695 tests/typecheck et UI trois thèmes déjà verts. README, HANDOFF MSI, PROJECT_STATUS et roadmap alignés : main, 1–66, recette humaine en cours, lanceur local npm start et package ancien obsolète. SQLite/sauvegardes/captures/outputs et données TEST exclus de Git. Push normal après revue ; aucun merge, build MSI, activation ou travail Bridge/8C. Le commit contenant cette entrée est la référence Git de reprise.


### 09/10/2026 — CI-HOSTED-PREP-01 (Codex, préparation autorisée / exécution arrêtée)

AtoumWeb autorise une branche/PR CI distinctes depuis main eb252d5c : Windows hébergé windows-2022, Node 24 conservé, npm ci avec lockfile existant, typecheck et npm test -- --maxWorkers=2. Trois lignes de workflow seulement ; option Vitest vérifiée par --help, cohérence package/lock et diff exact contrôlés sans installation. Pas de code métier, protections UX-01/UX-03/UX-16, migration, UX V2 ou Validation-MSI modifiés. #80/#81/#82/#83 toujours draft/queued, aucune mutation de ces PR.

Actions autorisé, accès dépôt admin/push, runner local absent. Facturation personnelle inaccessible : API usage/actions 404 et scope user absent, plan non retourné. Aucune extension de droits ni budget/paiement changés. PR créée avec [skip ci] pour rendre le correctif reviewable sans lancement automatique ; aucune validation réelle typecheck/tests/durée CI disponible. Attendre confirmation du quota et absence de dépassement facturable ou arbitrage explicite de dépense ; nouveau commit sans marqueur ensuite pour lancer la validation. Après succès et fusion humaine autorisée de la CI, reporter le workflow corrigé sur #81/#83 ou intégrer main puis pousser pour obtenir des nouveaux runs ; leurs anciens jobs n’adoptent pas le nouveau YAML. Responsable de l’arbitrage : AtoumWeb. Aucun merge automatique.


### 09/10/2026 — CI-HOSTED-TRY-01 (AtoumWeb, autorisation / premier essai)

AtoumWeb confirme dans la session le budget Actions 0 USD avec Stop usage = Yes et autorise un premier run #84 dans le quota gratuit disponible. Nouveau commit sans skip sur codex/fix-ci-windows-hosted, workflow inchangé ; relever typecheck/tests/durée et erreur éventuelle depuis GitHub réel. Aucun changement de budget, paiement ou droit ; si blocage GitHub, ne pas relancer ni contourner. Pas de merge, UX V2, migration ou Validation-MSI. Le résultat est accessible sur le run du commit de cette entrée et dans le bilan PR, sans déclencher un deuxième run par un commit de résultat.


### 09/10/2026 — CI-FIXTURE-TIMEOUT-01 (Codex, diagnostic et correctif local autorisés)

AtoumWeb demande analyse des trois timeouts #84, correction ciblée sans délai global accru ni tests masqués ; diagnostics/tests locaux isolés autorisés, pas de nouveau run Actions/push/merge sans nouvel accord. Logs run 37934890745 : 26–27 s Histoire, 56 s deux sessions, 5 s limite. Profilage local : fixture 176 autocommit/68 fins de transactions-savepoints disque, preview ~12 ms ; latence disque hébergée probable, détail CPU/antivirus/fsync non mesuré à distance. Simulation locale de délai par commit confirme la sensibilité, pas présentée comme preuve GitHub.

Helper testSupport construit migrations et mêmes références en mémoire puis export SQLite complet unique ; aucune modification moteur/règle/migration/temps/FK/durabilité/global timeout. Assertions des trois tests inchangées ; trois tests d’export ajoutés (données/intégrité/indépendance, erreur sans fichier partiel, destination intacte). Typecheck/27 ciblés/698 complets (80 fichiers,72,02 s) verts. Deux sessions ~0,44 s, Histoire ~0,24/0,30 s. Fixtures et instrumentation TEMP nettoyées ; Validation-MSI non ouverte, workflow/Vitest et autres PR inchangés. Commit local non poussé ; CI distante reste échouée, attendre accord AtoumWeb avant nouveau push/run et succès réel avant fusion.


### 09/10/2026 — CI-FIXTURE-PUBLISH-01 (AtoumWeb, publication sans CI / plan préparé)

AtoumWeb valide le correctif 5a175eb et autorise le push avec skip CI ; hash conservé, commit documentaire de suivi [skip ci] comme HEAD. Diff vérifié, sources métier/UI/migrations/timeout et données JSON inchangés ; typecheck/27 ciblés verts avant publication, intégrité/FK/1–66, isolation/durabilité/destination préservée/nettoyage. Complet 698/698 déjà vert, pas rejoué pour suivi uniquement. Même liste de cinq fichiers du diagnostic, aucun artefact.

Protocole prochain run et intégration #81 puis #83 préparés dans CI_RECIPE_FIXTURE_TIMEOUT_ANALYSIS : nouveau commit sans skip seulement sur nouvel accord, logs GitHub du bon HEAD, pas re-run de l’ancien code. Après CI réelle verte et accord de fusion #84, main mis à jour ; merges normaux contrôlés de #81 puis #83, conflits journaux et IPC à combiner sans perdre les protections, tests locaux isolés puis nouveaux runs, accord humain à chaque fusion. Préparation merge-tree seulement, branches #81 593a4611/#83 5b38cbe1 inchangées. Aucun budget, Validation-MSI, référentiel V2, run supplémentaire ou merge. Prochaine action AtoumWeb : autoriser séparément le nouveau run #84.


### 09/10/2026 — CI-FIXTURE-VALIDATE-01 (AtoumWeb, unique run autorisé / préparation conditionnelle)

AtoumWeb autorise une seule nouvelle validation #84 avec correctif 5a175eb, nouveau commit sans skip et workflow Windows-2022/Node 24/npm ci/typecheck/complet deux workers inchangé. API billing encore 404/scope user absent ; protection budget 0 USD/Stop usage confirmée par l’utilisateur, aucun solde inventé ni modification de facturation. Si quota/refus/échec, arrêter sans deuxième relance ; relever totaux/durées/anciens timeouts dans les logs réels.

Si vert : préparation technique des intégrations #81 593a4611 puis #83 5b38cbe1 par analyses/simulations locales isolées seulement ; #82 HEAD documentaire 3c258d5 au contrôle. Aucune modification de leurs branches/PR, fusion, budget, Validation-MSI ou données réelles. Résultats liés au run de ce commit et au bilan #84, sans nouveau push automatique de résultat. Les fusions et futurs runs sur les branches intégrées restent à autoriser.


### 09/10/2026 — PR84-MERGE-PR81-RESUME-01 (AtoumWeb, fusion autorisée / reprise)

Autorisation de fusion normale #84 après contrôle HEAD f4bc0197 et run #589 : merge main 2b3906328d237b962f053acdf25b1ebeeba1222c, tree sans différence avec le HEAD validé. main local actualisé en fast-forward ; #81 part de 593a4611, merge normal de main, conflits PROJECT_STATUS/roadmap uniquement conservant les historiques. Aucun processus Manager du dépôt trouvé avant changement de checkout. Correctif RPC afterEach async/setImmediate autorisé sur #81, assertions/délais/services conservés ; commit distinct et contrôles locaux puis préparation CI. Aucune autorisation de fusion #81, ni modification #82/#83, budget ou Validation-MSI.


### 09/10/2026 — PR81-RPC-READY-01 (Codex, correctif autorisé et contrôles locaux)

Main/origin 2b390632 et CI post-merge #628 success ; #81 merge normal e215125 puis commit de test 67aeccd9fdd6feef00a7911eb913c01f0429a3bd. Après cleanup vérifié, afterEach async/setImmediate : comparaison exacte au 593a4611, deux changements seuls, aucune assertion/durée/service/migration modifiés. Typecheck/68 ciblés deux workers (141,92 s)/748 complets deux workers (81 fichiers,207,78 s) verts, aucune erreur RPC ; toutes les protections UX-16/UX-03 et intégrité/FK/1–66/replay sur fixtures préservées.

Publication de la préparation #81 avec HEAD documentaire [skip ci], draft/non fusionnée ; pas de nouveau run #81 sans accord, anciens runs non annulés ni relancés. Avant fusion : autoriser commit sans skip/run Windows-2022 Node 24 npm ci/typecheck/complet deux workers, examiner résultats réels restaurations/débits/journaux/idempotence et toute erreur worker ; validation humaine après CI verte. Aucun budget ni Validation-MSI modifié, pas d’intervention #82/#83. Les dossiers TEMP anciennement refusés au nettoyage ne sont pas repris.


### 09/10/2026 — PR81-CI649-LOCAL-FIX-01 (AtoumWeb, diagnostic/correctif local autorisés)

Échec run #649 confirmé : historique65 timeout23,134s/20s, récupération non injectée et attempted=false. Autorisation de ciblage des trois tests, répétition puis fichier entier, pas 748 systématiques, pas CI/push/merge/Validation-MSI. Défaut des mocks reproduit avec jonction : raw/canonical différents, branches d’injection ignorées ; comparaison canonisée des deux côtés, alias permanent de test et cleanup, preuve replacementInjected ajoutée sans changer les 80 attentes existantes. Historique65 préparé par vraies migrations en mémoire puis export (1491→166ms fixture), restauration~94ms, bytecompare~2s conservée. Essai de transaction lecture sans gain retiré, sondes supprimées ; aucun délai/services/migration/YAML changés.

Typecheck/3 tests trois répétitions/35 tests restore (63,91s) verts, RPC absent, intégrité/FK/backup/recovery/writerbloqué/65→66/replay conservés. Deux seuls résidus de diagnostic alias explicitement nettoyés, anciens TEMP refusés laissés intacts. Commit local préparé, aucune publication ni nouvelle CI ; attendre accord run complet Windows hébergé. Pas de blocage GitHub pour corriger localement ni intérêt technique à rendre public pour ces échecs ; visibilité inchangée, aucun audit d’exposition public prétendu. #82/#83, budget et Validation-MSI non modifiés.

# Intégrité fonctionnelle — UX-16 et UX-03

## Diagnostic et correction locale des trois échecs #649 — 09/10/2026

Base de travail #81 **5d43e16** ; run GitHub #649 : 745/748 tests verts, un timeout à 20 s et deux assertions d’injection en échec. Autorisation : diagnostiquer/corriger localement les trois cas puis tout restore.test.ts, sans nouvelle CI, push ou merge ni accès Validation-MSI. Seul fichier de code modifié : **src/main/restore.test.ts** ; suivi dans ce document, PROJECT_STATUS et la roadmap.

### Causes confirmées et limites

1. **Échec du remplacement non injecté.** La destination passée par la production est `realpathSync.native(resolve(file))`, en minuscules sous Windows. Le mock ne comparait que `String(destination).toLowerCase()` au chemin brut workspace.databaseFile. Deux représentations du même fichier peuvent différer : jonction, alias court/long, etc. Le filtre retourne faux et délègue à la vraie copie, d’où `restored:true` au lieu de l’erreur attendue.
2. **Écriture concurrente non tentée.** Même filtre brut dans le deuxième mock : la branche installant le progress callback n’est pas exécutée, donc `attempted=false`. L’échec ne démontre pas un défaut du verrou SQLite : le test n’avait pas tenté l’écriture.
3. **Historique 65 trop lent.** Le helper exécutait les vraies migrations historiques directement sur fichier, sans regroupement de leurs DDL/registre. Les commits disque de construction rendent la fixture sensible à la latence Windows hébergée. La mesure locale sépare ce coût du vrai traitement de restauration et des assertions ; la comparaison byte pour byte a également un coût CPU normal, conservé.

La reproduction locale crée une jonction `workspace-alias` vers le vrai workspace-A dans le seul dossier temporaire du test. Le chemin brut/canonisé est effectivement différent ; avant correction les **deux erreurs CI sont reproduites**, sans modifier les assertions. Après canonisation des deux côtés, les mêmes cas passent avec la jonction toujours présente. La graphie précise du TEMP hébergé n’est pas imprimée dans le log #649 : on ne prétend pas démontrer un alias 8.3 particulier. Le mécanisme fautif est confirmé ; une nouvelle CI reste nécessaire pour confirmer toutes les particularités de ce runner.

### Corrections limitées aux tests

- `isWorkspaceDestination` : vérifier d’abord l’existence (les destinations de sauvegarde de sécurité n’existent pas encore au premier appel), comparer les deux realpathSync.native(resolve(...)), minuscules uniquement sous Windows. Aucun changement du canonicalPath ou des protections de production.
- Les deux tests instrumentés passent systématiquement par la jonction ; cleanup la retire explicitement avant de supprimer son dossier. Le premier ajoute **replacementInjected=true** : l’erreur de remplacement a réellement été provoquée. Les assertions de sauvegarde récupérable, cible intacte, demande non rejouée et récupération volontaire restent identiques. Le second garde ses assertions **attempted=true / blocked=true** et l’égalité de toutes les cellules après copie : callback et tentative d’écriture réellement exercés.
- Construction des fixtures non mises en cache dans SQLite **:memory:** : toutes les vraies migrations requises restent exécutées, les noms/IDs/dates historiques du registre sont conservés. Export **VACUUM INTO** vers un fichier propre à ce test ; cache actuel toujours copié dans un fichier indépendant. Aucune utilisation de Validation-MSI, version 65 non remplacée par 66, aucun schéma simplifié ni mock de restauration. Le test vérifie encore migrationCount=65, source byte-identique après restauration, données de destination égales à la source, application de la seule migration restante et replay neutre/intégrité.
- Sondes de profilage temporaires supprimées du code final. Le test de transaction de lecture des snapshots n’apportait aucun gain et a été retiré : helper snapshot original conservé. **80 assertions originales identiques**, vérifiées par AST ; une assertion supplémentaire d’injection. Délais 20 s, configuration Vitest, workflow, services et migrations identiques au HEAD de départ.

### Mesures locales / résultats

| Phase historique 65 | Avant | Après |
| --- | --- | --- |
| Exécution des migrations pour créer la fixture | 1489 ms | 140 ms |
| Création complète de la fixture | 1491 ms | 164–168 ms |
| Validation de la source | 156 ms | 154–163 ms |
| Programmation de restauration | 17 ms | 17–18 ms |
| Restauration effective | 94 ms | 88–97 ms |
| Lecture/comparaison des snapshots de tables | — | 17 ms |
| Comparaison byte pour byte de la source | Conservée | 2011 ms |
| Migration 66 restante / replay | — | 10–11 ms |
| Intégrité finale | — | 6–7 ms |
| Scénario complet, run de mesure | 3895 ms | 2502–2601 ms |

Le timeout CI original était **23134 ms**. Il ne s’agit pas d’un avant/après hébergé : les durées après sont locales uniquement. Réduction du coût disque attendue sur ce runner grâce à un seul export, sans hausse de timeout ni réduction du véritable scénario de sécurité. Le coût des assertions n’est pas masqué.

- Les trois tests, sur le code final sans sondes, sont rejoués **trois fois** à deux workers : **3/3 à chaque fois**, fichier ciblé 3,86 /3,88 /3,87 s. Historique65 : **2503 /2512 /2500 ms** ; récupération avec injection : **427 /439 /437 ms** ; concurrence réellement bloquée : **173 /187 /193 ms**.
- Puis **tout restore.test.ts : 35/35, aucune exclusion ni erreur RPC, 63,91 s**. Historique 65 dans ce run : **2363 ms**. Typecheck OK. Aucune suite complète des 748 relancée.
- Les 32 cas non sélectionnés pendant le ciblage ont ensuite tous été exécutés dans le run complet du fichier : aucun test supprimé ou masqué. Toutes les garanties de restauration DELETE/WAL, intégrité/FK, sources incompatibles, destination immuable/A-B, sauvegarde/récupération, fichiers occupés, verrous, alias et replay sont couvertes.
- Deux premiers résidus de ce diagnostic liés à la jonction ont été identifiés précisément et nettoyés après retrait du lien ; aucun nettoyage global de TEMP, les anciens dossiers dont la suppression avait été refusée n’ont pas été repris. Les runs corrigés suppriment leurs fixtures dans afterEach et vérifient la disparition des dossiers.

### Accès, visibilité et prochain contrôle

Aucun accès GitHub supplémentaire n’est nécessaire pour ce correctif local : le dépôt privé a déjà exécuté la CI hébergée. Le manque de scope user pour la facturation personnelle, constaté précédemment, n’empêche pas la lecture des runs ni ces tests locaux ; si nécessaire le propriétaire peut consulter Billing sans élargir le jeton. Rendre le dépôt public ne corrige ni les chemins ni les fixtures : aucun changement de visibilité proposé comme contournement. Un éventuel changement nécessiterait une décision distincte et un audit de l’historique/des secrets/données confidentielles, non réalisé ici.

Correctif en commit local seulement, pas de push, modification de PR #82/#83, nouvelle CI, budget, source de production ou donnée réelle. Recommandation : autoriser ensuite une seule CI complète Windows hébergée sur le contenu corrigé, vérifier particulièrement ces trois cas et les erreurs RPC, puis validation humaine avant fusion #81.

Les bilans qui suivent sont historiques ; ils ne constituent pas une validation GitHub de ce correctif.

## Reprise de #81 après stabilisation CI — 09/10/2026

- #84 merged normalement dans main **2b3906328d237b962f053acdf25b1ebeeba1222c**, contenu identique au HEAD f4bc0197 / run #589 vert ; run main post-merge #628 également vert. Intégration de ce main dans #81 par merge normal **e215125**, aucun rebase/squash. Conflits PROJECT_STATUS/roadmap seulement, historiques conservés.
- Petit correctif de cycle de test autorisé : afterEach devient async et attend setImmediate après ses vérifications et cleanup. Les traitements applicatifs sont comparés au #81 initial **593a4611**, inchangés ; aucune assertion ni timeout modifié. La boucle d’événements peut traiter le RPC Vitest entre les cas de restauration, sans ignorer les erreurs.
- Vérifications sur la vraie branche : typecheck OK ; **68/68 ciblés** (35 restauration +17 terminaison +6 packs +10 migrations), deux workers, **141,92 s** ; **748/748 complets, 81 fichiers, 207,78 s**, deux workers, sans erreur RPC. Le passage de 745 à 748 correspond aux trois tests d’export fixture de #84, pas à une modification des règles métier.
- Intégrité/FK/replay sur fixtures isolées, schema **1–66** inchangé, sources historiques et tables préservées. Aucun processus Manager du dépôt trouvé avant checkout ; aucune ouverture, restauration ou migration de Validation-MSI. Toutes les fixtures finales nettoyées par les tests ; les anciens dossiers TEMP dont la suppression avait été refusée restent hors intervention.
- #81 actualisée et publiée avec [skip ci] pour préparation CI ; **aucune exécution réelle #81 de ce nouveau code n’est encore validée**. Draft et attente d’accord de run/fusion, aucun changement de budget ni modification #82/#83. Tests locaux ne remplacent pas la CI du nouveau HEAD.
- Avant fusion : nouveau commit sans skip seulement après autorisation ; contrôler le HEAD exact, runner windows-2022, Node 24, npm ci/typecheck/complet deux workers ; examiner les 35 tests de restauration, les tests de débit/journaux/idempotence et toute erreur worker. En cas de blocage quota ou échec, arrêter sans retry/contournement ; demander validation humaine après CI verte.

Les sections suivantes sont le bilan historique avant intégration de #84 ; leurs comptages/base Git ne décrivent pas le nouveau checkpoint.

## Livraison corrective — 09/10/2026

AtoumWeb a validé les deux corrections, leur implémentation, les tests permanents et une PR dédiée sans fusion. **UX-16 et UX-03 corrigés** sur `codex/fix-manager-integrity-ux16-ux03`, base `main@eb252d5c`. Aucun travail UX/UI V2 ni intervention sur la PR #80.

### UX-16 réalisé

- Demande versionnée avec cible canonique, workspace, identité du fichier Windows (device/inode en précision entière), empreinte SHA-256 de la source et date. Confirmation existante enrichie avec la destination ; aucune nouvelle navigation.
- Sources autonomes uniquement : absence de WAL/SHM/journal, source distincte même via lien physique. Source en lecture seule : intégrité/FK, registre des migrations contigu et noms connus, objets et colonnes/PK/nullabilité du schéma attendu construit en mémoire pour cette version. Les sauvegardes historiques compatibles restent admises ; aucune migration de la source.
- Copie indépendante vérifiée avant toute sauvegarde/remplacement de la cible. Vérification complète des contraintes sur cette copie ouverte en écriture : le runtime SQLite utilisé peut omettre les CHECK lors d'un integrity_check en lecture seule. Aucun SQL d'écriture sur la source utilisateur.
- Destination contrôlée à nouveau au démarrage : changement de workspace, remplacement du fichier ou jonction retargetée refusés. Demande consommée avant validation ; marqueur legacy/incomplet/interrompu refusé et conservé hors des demandes exécutables. Une restauration rejetée ne ressuscite pas si l'utilisateur revient sur A.
- Verrous de demande/profil et cible ; contrôle SQLite sans attente d'un writer déjà actif. Copie de sécurité SQLite validée avant remplacement. Remplacement par la [SQLite Online Backup API](https://www.sqlite.org/c3ref/backup_finish.html), sous transaction destination, sans écrasement brut ni suppression manuelle des WAL/SHM. Erreurs explicites ; seule une sauvegarde effectivement créée/vérifiée est annoncée récupérable.
- Succès retourné après copie et contre-vérification. Échec au bootstrap : message natif existant, sans initialisation du Manager sur la cible. Une récupération est volontaire : reprogrammer la sauvegarde pre-restore ; aucun ancien dossier réparé automatiquement.

### UX-03 réalisé

- Savepoint englobant tout `complete`, toutes prises en charge comprises. Débit local imbriquable avec son propre savepoint ; statut dérivé, activité et lecture du résultat inclus avant validation.
- En cas de refus/erreur : cellules intervention, pack, mouvements, timestamps et activités identiques à l'état précédent. L'échec de facturation hors forfait ou de synchronisation maintenance annule aussi la transition.
- Gardes, secondes terminées, dépassements, couverture, facturation et clé d'idempotence inchangés. Succès répété sans nouveau débit ni activité. Transaction parente non validée ou annulée par le service.

### Recette technique et avant/après

| Anomalie | Avant | Après vérifié |
| --- | --- | --- |
| UX-16, A → B | B remplacée par la sauvegarde A | Refus avant copie ; A et B conservées, demande non rejouée |
| UX-16, source invalide/incompatible | Existence du fichier suffisante | Non SQLite, schéma étranger, migrations futures/trou/nom inconnu, table/colonne manquante, FK et corruption refusés |
| UX-16, échec de remplacement | Risque de copie physique partielle | Copie préparée/validée, remplacement transactionnel ; ancienne base sauvegardée, récupération explicite testée |
| UX-03, aucun temps terminé | Erreur, statut `to_validate`, activité ajoutée | Erreur, état initial strictement conservé |
| UX-03, erreur après débit/journal | Débit conservé et statut intermédiaire | Débit, statut, solde, timestamps et activités annulés |
| UX-03, succès répété | Un seul débit dans le cas nominal | Un seul débit, aucune cellule/activité supplémentaire ; autres couvertures conservées |

- Tests permanents ciblés : **58/58**, dont 35 restauration, 17 terminaison et 6 packs. **50 tests ajoutés** par rapport à la base de 695.
- Suite complète : **745/745, 80 fichiers de tests**. Typecheck OK ; diff sans erreur de whitespace. Registre des migrations inchangé **1–66** ; replay/intégrité/FK contrôlés dans les fixtures. Aucune migration supplémentaire.
- Restauration : succès/rejeu en DELETE **et WAL (mode du Manager)**, historiques 4/65 puis migration/rejeu temporaires, A/B, demandes anciennes/incomplètes/interrompues, source modifiée/disparue, CHECK sur copie, inode remplacé, alias/hardlink, casse/séparateurs Windows et jonction, copie en échec/altérée, sauvegarde/récupération, writers DELETE/WAL, écriture concurrente pendant copie et verrou de profil.
- Terminaison : absence de temps, erreur avant insertion, insertion du débit, calcul du solde, journal du débit, transition finale et journal final ; retry, double appel, parent transactionnel, facturation hors forfait et maintenance, inclus Projet/interne/geste commercial.
- Toutes les fixtures des exécutions finales sont fermées/supprimées par les tests, y compris les refus. Aucun accès à Validation-MSI, lancement du Manager ou donnée utilisateur créé par ces contrôles. Aucun changement React/CSS, navigation, prix, temps, référentiel ou règle métier.

### Limites conservées

- SQLite seulement : les documents externes ne sont pas restaurés par cette opération. Une source avec sidecars est refusée ; utiliser une vraie sauvegarde autonome.
- Pas de test matériel de coupure électrique, ni garantie face à un logiciel externe qui contourne les verrous SQLite ou remplace les fichiers. Les verrous orphelins d'un processus tué demandent une vérification humaine avant retrait ; aucune reprise destructive automatique.
- Aucun diagnostic/rattrapage des anciens dossiers : chantier distinct. UX-01/04/05/02 non traités ; UX/UI V2 séparé.
- Les premiers runs de restauration ont été interrompus ou échoué pendant la mise au point des fixtures, des délais de tests et de la vérification des CHECK. Ils ne constituent pas la recette finale. Deux dossiers de fixtures interrompues restent dans TEMP (`atoumweb-restore-test-ohGEdk`, `atoumweb-restore-test-QjBigR`) : suppression native refusée par le contrôle automatique d'approbation, aucun contournement. Aucun fichier de ces dossiers dans Git ni lien avec Validation-MSI.

### Fichiers de ce lot

UX-16 : `src/main/restore.ts`, `src/main/restore.test.ts`, `src/main/ipc.ts`, `src/main/main.ts`.

UX-03 : `src/main/operations/InterventionCompletionService.ts`, `src/main/operations/InterventionCompletionService.test.ts`, `src/main/operations/HourPackService.ts`, `src/main/operations/HourPackService.test.ts`.

Suivi : ce document, `PROJECT_STATUS.md`, `docs/MANAGER_BRIDGE_ROADMAP.md`. **11 fichiers**, aucune base/sauvegarde/capture/output. Commits correctifs séparés, suivi commun et complément de test nominal WAL ; publication sur la branche dédiée et PR #81 en draft vers main, sans fusion automatique.

## Diagnostic initial — archivé, 09/10/2026

À cette étape initiale, diagnostic exécuté et corrections proposées, **non encore implémentées**. AtoumWeb demandait de sécuriser le Manager actuel, indépendamment de la conception UX/UI V2, et de présenter les corrections avant tout changement risqué. Le résultat courant figure dans la section de livraison ci-dessus.

- Référence : [PR documentaire #80](https://github.com/atoumweb-prog/atoumweb-manager/pull/80), `docs/ux-audit/05-REGISTRE-ECARTS.md` sur `docs/ux-audit-manager-v1`.
- Base fonctionnelle : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` ; même code que l'audit. Branche dédiée : `codex/fix-manager-integrity-ux16-ux03`, créée depuis main, sans intégrer la branche documentaire.
- Aucun changement de code, migration, composant visuel ou navigation. Aucun démarrage du Manager, accès à Validation-MSI, commit, push ou merge pendant ce diagnostic.
- Expériences avec les vrais services dans Electron 44.3.0 / Node 24.20.0. Profil Electron simulé vers un dossier temporaire ; aucune utilisation du profil utilisateur réel.

## UX-16 — Restauration différée : risque confirmé

### Cause

`scheduleDatabaseRestore` ne conserve que `sourcePath` et `requestedAt`. L'IPC ne transmet pas le workspace actif. Le choix d'un autre workspace modifie le bootstrap ; au redémarrage, `applyPendingDatabaseRestore` utilise cette nouvelle destination. La confirmation initiale ne protège donc pas la destination réellement remplacée.

La source est seulement vérifiée par son existence. Un fichier non SQLite avec l'extension `.sqlite` peut remplacer une base valide. La sauvegarde pré-restauration existe mais ne prévient pas cette erreur.

### Résultats exécutés

Bases SQLite physiques minimales, indépendantes, chacune avec un marqueur d'identité ; aucun dossier utilisateur.

| Cas | Résultat constaté |
| --- | --- |
| Programmer dans A, sélectionner B, redémarrer sur B | A conserve `A-original` ; B contient `backup-A` ; sauvegarde de sécurité : `B-original`. Restauration annoncée réussie : mauvaise destination confirmée. |
| Programmer et redémarrer sur le même workspace | Restauration nominale réussie ; intégrité `ok`. |
| Source existante mais non SQLite | Restauration annoncée réussie ; destination illisible (`file is not a database`). Sauvegarde pré-restauration lisible et conservant l'original. |

Les bases lisibles ont une intégrité `ok` et aucun échec FK. Cette expérience démontre les défauts de destination et de validation du fichier ; elle ne valide pas une restauration complète du schéma Manager ou des fichiers métier associés.

### Correction proposée — lot indépendant

1. Épingler la destination à la programmation : workspace actif et fichier SQLite cible issus du backend qui possède la connexion courante. Afficher cette destination dans la confirmation existante.
2. Au redémarrage, comparer la cible épinglée au workspace résolu, avec normalisation Windows et contrôle des alias de chemin. En cas d'écart, refuser avant sauvegarde/remplacement ou initialisation de base et signaler la demande refusée. Ne jamais rediriger vers B ni restaurer A en arrière-plan.
3. Refuser les anciens marqueurs sans cible ; les conserver comme demandes refusées pour diagnostic et demander une nouvelle programmation explicite. Aucun rattachement supposé depuis la source ou le workspace courant.
4. Vérifier la source en lecture seule à la programmation et au démarrage : fichier SQLite Manager, schéma compatible, intégrité et FK. Détecter une source remplacée entre confirmation et application. Ne pas appeler `DatabaseService.initialize` sur la source.
5. Préparer et vérifier une copie avant remplacement ; garder la sauvegarde pré-restauration. Tester les échecs de remplacement sous Windows, notamment une cible occupée. Ne pas supprimer les fichiers WAL/SHM avant satisfaction des contrôles et sécurisation du remplacement. Aucun succès annoncé si l'opération n'est pas terminée.

Fichiers envisagés : `src/main/restore.ts`, `src/main/ipc.ts`, `src/main/main.ts`, nouveaux tests ; éventuellement un helper de chemin dans `src/main/workspace.ts`. Aucune migration ni refonte de Réglages/Sauvegardes.

Tests à ajouter : cible identique ; A vers B ; changement de workspace avant/après programmation ; marqueur legacy/invalide ; source absente, invalide ou remplacée ; sauvegarde pré-restauration ; erreur de copie/remplacement ; cible occupée ; rejeu après réussite. Workspaces temporaires construits par migrations, comparaison des données des destinations non concernées, intégrité/FK et nettoyage après succès/échec.

Limites : restaurer SQLite ne restaure pas automatiquement les documents du workspace. L'exclusion des processus concurrents et les alias de chemin doivent être testés avant de déclarer le lot terminé ; les probes ne les prouvent pas.

## UX-03 — Terminaison sur pack : mutation partielle confirmée

### Cause

`InterventionCompletionService.complete` passe l'intervention en `to_validate` avant `HourPackService.debitIntervention`. Aucune transaction commune ne couvre statut, débit et journaux. Le débit valide sa propre transaction avant le calcul du statut du pack et l'écriture du journal.

En cas d'erreur, l'UI affiche le message sans recharger le résultat et peut montrer l'ancien état. La correction de fond doit rendre l'opération atomique, sans masquer la mutation par un rafraîchissement.

### Résultats exécutés

Vrais services sur SQLite mémoire, migrations **1–66**, client/intervention/pack créés uniquement dans la fixture. Pack initial de 3 600 secondes, intervention `in_progress`.

| Cas | Erreur / résultat | Statut après | Solde après | Débits | Activités ajoutées |
| --- | --- | --- | ---: | ---: | ---: |
| Aucun temps terminé | `Aucun temps terminé à débiter pour cette intervention.` | `to_validate` | 3 600 s | 0 | 1 |
| 30 min terminées, erreur injectée sur le journal après débit | `Injected late debit error` | `to_validate` | 1 800 s | 1 | 1 |
| 30 min terminées, succès et répétition du même appel | Succès, un seul débit | `completed` | 1 800 s | 1 | 3 |

Erreur tardive injectée par un trigger SQLite temporaire refusant uniquement l'activité `hour_pack_intervention_debited`, après insertion du débit. Ce n'est pas une erreur spontanée observée sur Validation-MSI. Toutes les fixtures mémoire : intégrité `ok`, FK vides. L'intégrité relationnelle n'exclut donc pas une incohérence métier.

### Correction proposée — lot indépendant

1. Encadrer toute la terminaison dans un périmètre transactionnel : préconditions, transitions, débit, statut dérivé et journaux. Toute erreur restitue l'état antérieur, timestamps et activités compris.
2. Rendre la transaction locale de `debitIntervention` imbriquable avec un savepoint ; conserver statut dérivé, journal et lecture du résultat dans ce périmètre. Un simple `BEGIN` autour de `complete` échouerait avec le `BEGIN IMMEDIATE` interne actuel.
3. Conserver gardes client/projet/cible, secondes réellement terminées, règles de dépassement et clé d'idempotence actuelle. Aucun débit inventé sans temps terminé ni correction rétroactive des dossiers existants.
4. Si le périmètre commun couvre les autres prises en charge de `complete`, vérifier leur facturation/maintenance : pas de mutation partielle introduite, règles identiques.

Fichiers envisagés : `src/main/operations/InterventionCompletionService.ts`, `src/main/operations/HourPackService.ts` et leurs tests. Pas de changement visuel ; IPC existant conservé.

Tests à ajouter : absence de temps terminé ; refus d'insertion du débit ; erreur du statut dérivé/journal ; erreur de transition finale ; appel dans une transaction existante ; succès puis répétition sans double débit. Comparer cellule par cellule intervention, pack, mouvements et activités avant/après refus. Conserver les tests des gardes/autres prises en charge, puis suite complète/typecheck après implémentation.

Limite : aucun dossier existant automatiquement réparé ; une recherche de dossiers affectés nécessite un périmètre et une autorisation distincts. Validation-MSI est exclue de ce lot.

## Vérifications et prochaine étape du diagnostic initial

- **Six expériences de diagnostic exécutées** : trois de restauration, trois de terminaison. Anomalies reproduites, non corrigées.
- Suite ciblée existante : **8/8 tests** (`InterventionCompletionService.test.ts` et `HourPackService.test.ts`). Ils ne couvrent pas les échecs reproduits ; leur réussite n'invalide pas les constats.
- Fixtures physiques et profil temporaires supprimés ; bases mémoire fermées. Aucun SQLite, sauvegarde ou output ajouté au dépôt.
- Migrations inchangées. Pas de suite complète/typecheck rejoués pour cette passe documentaire ; nécessaires après corrections.
- Prochaine étape : validation des deux propositions avant implémentation. UX-01/04/05/02 restent à traiter progressivement, sans engager UX/UI V2.

# Intégrité fonctionnelle — UX-16 et UX-03

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

# UX/UI V2 — Lot 08A : reprise contrôlée (14 octobre 2026)

## Référence et séparation des chantiers

- Base de branche : `main@cc0bc679400321f5afacdbee3317ea8acc451518` (après fusion du lot 03D/E).
- Référentiel préexistant : `docs/ux-v2/LOT-08A-AUDIT-REGLES-ET-PARCOURS.md` dans la PR #82 ; ne pas confondre avec les lots techniques 8A/8B Manager ↔ Bridge.
- Cette étape **ouvre uniquement un audit de reprise**. Aucun code, test, migration, service, composant, statut métier ni profil utilisateur modifié. Ne pas revendiquer une nouvelle recette Electron ou une analyse du code actuel sans la réaliser.
- PR #104 (lot 04) et #106 (lot 05) laissées intactes. Travaux 06/07/08 indépendants ; toute convergence doit être recalculée avant intégration.
- Ne jamais utiliser Validation-MSI ni données réelles.

## Audit à mener avant correction

1. **E222 — clôture atomique d'Intervention.** Examiner `InterventionCompletionService.complete` et ses appels de débit, maintenance, handoff facturation. Écrire un test de panne injectée entre chaque effet et confirmer l'intégrité statut/mouvements/handoff au rollback. Ne pas déclarer l'atomicité acquise avant preuve.
2. **E223 — nouveaux abonnements manuels.** Contrôler `MaintenanceService.createSubscription` et ses périodes. Cible validée : démarrage réel, cycles opérationnels mensuels date-à-date, même lorsque payés annuellement, sans report de quota. Préserver les abonnements historiques `calendar`.
3. **E224 — compteurs.** Clarifier le calcul `routineSeconds` / consommation du quota avant toute modification.
4. **E225 — packs.** Prouver l'idempotence des débits et des reversals et expliciter la prévisualisation d'un dépassement ; aucune émission Abby automatique.
5. **E226 — UX-01.** Reproduire les scénarios de navigation/pending/brouillons dans les fiches opérationnelles et sessions.
6. **E227 — réouverture.** Auditer transitions légales et conséquences avant d'ajouter une action de réouverture ; ne pas introduire un statut inconnu.

## Gates d'acceptation pour les incréments suivants

- Repartir des 14 scénarios R08A-01 à R08A-14 déjà décrits dans le référentiel ; tracer séparément tests nouvellement ajoutés et preuves historiques.
- Tests sur SQLite/profils TEMP : typecheck, suite Vitest, 35 restaurations et 6 binaires si toujours applicables, intégrité/FK/migrations, Electron natif ciblé et non-régression du chrono global unique.
- Identifier le SHA de chaque preuve et la CI correspondant exactement à ce SHA.
- Si changement de schéma devenu nécessaire, audit des migrations sur le `main` récent avant nouvelle numérotation et validation préalable ; aucune migration 67 héritée du lot 04 ici.
- Documentation et tests avant toute demande de merge. Recette visuelle humaine différée, jamais marquée PASS.

## État

**08A : démarré, audit de reprise documentaire uniquement.** E222 à E227 non reproduits sur le code courant dans cet incrément ; aucune validation fonctionnelle revendiquée. Aucun impact attendu sur les autres lots.

## Revue du code et incrément E223 — 14/10/2026

- **E222 : audit statique actualisé.** Le service actuel `InterventionCompletionService.complete` englobe bien le parcours dans un `SAVEPOINT intervention_complete` avec `ROLLBACK TO`. Son test existant injecte six erreurs à différentes étapes, couvre une transaction parente, le hors forfait et la maintenance, et vérifie les instantanés/intégrité/FK. Cela corrige le soupçon formulé dans le référentiel historique ; **aucun rejeu de ces tests n'est revendiqué ici**.
- **E223 : défaut confirmé à la lecture du code.** `MaintenanceService.createSubscription` n'écrivait pas `period_alignment` et héritait donc de la valeur `calendar`, contrairement à la règle validée pour les *nouvelles* souscriptions manuelles.
- Correctif minimal dans `MaintenanceService.ts` : INSERT explicite `period_alignment='anniversary'` uniquement à la création manuelle. Aucune migration ni modification d'abonnements existants.
- Test ajouté à `MaintenanceService.test.ts` : création le 15/10, cycles 15/10–14/11 et 15/11–14/12, puis contrôle du comportement `calendar` sur un enregistrement historique simulé. La règle des ventes annuelles et du quota sans report reste à vérifier séparément.
- **Statut** : code et test publiés sur branche isolée, validation Vitest/typecheck/CI et Electron **non encore obtenue**. Ne pas fusionner sans leurs résultats.

## E224 / E225 — audit ciblé sur code courant

### E224 — compteur des périodes
- `MaintenanceService.mapPeriod` calcule séparément le temps mineur et le temps routine : `usage.usedSeconds = usedSeconds + routineSeconds`, mais `remainingSeconds` et `secondsOverQuota` se fondent sur le temps mineur seulement. Cette asymétrie **est effectivement présente**. Ne pas corriger arithmétiquement `remainingSeconds` sans vérifier la règle métier : les routines peuvent être affichées dans le temps réalisé sans consommer le quota de maintenance mineure.
- Tests à ajouter : deux sessions (mineure/routine) avec pauses, quota partiellement puis totalement consommé ; vérifier séparément temps total, routine, solde et dépassement. Confronter les libellés UI au contrat réel.
- Décision en attente : clarifier si le temps routine doit être imputé au quota, ou uniquement affiché dans le cumul. **Aucune modification des compteurs à ce stade**.

### E225 — débit, correction et inversion de pack
- `HourPackService.debitIntervention` utilise `source_key=intervention:<pack>:<intervention>`, contrôle les rattachements et englobe son débit dans un savepoint ; sa protection contre les doublons est explicitement présente. La clôture englobante utilise également son propre savepoint (E222).
- `reverseMovement` refuse indirectement un deuxième inverse en retrouvant `reversal_of_movement_id` ; l'inverse compense le mouvement par son delta opposé. Le solde est reconstitué depuis la somme des deltas, sans plancher silencieux à zéro.
- **Risque à reproduire avant correction** : `addMovement` et `reverseMovement` enchaînent insertion, actualisation du statut et journal d'activité sans savepoint englobant visible. Une panne injectée après l'insertion pourrait laisser un mouvement enregistré sans journal ou statut cohérent. Prévoir tests d'injection dans `HourPackService.test.ts` et correction transactionnelle ciblée si le défaut est confirmé.
- Tests à ajouter : échec de journal après correction manuelle / reversal, rollback exact du snapshot ; deux appels identiques de reversal ; solde négatif conservé ; mouvement opposé unique ; contrôle `PRAGMA integrity_check` et FK. Une action de correction volontaire ne doit pas être rendue idempotente à tort sans identifiant métier de demande.

### CI #910 du candidat E223
- Exécution GitHub Actions #910 / run 38561121938 : job quality **failure**. Le journal renvoyé par la connexion GitHub est indisponible (404 sur blob des logs), et les détails d'étapes ne sont pas accessibles. **Cause indéterminée ; E223 n'est pas validé.**
- Garder #109 en draft. Ne pas modifier `main`, ni les branches 04/05 ; récupérer la cause exacte du job, corriger sur cette branche, puis obtenir la CI verte au HEAD avant toute fusion.

## E226 — première analyse de navigation / brouillons

- `OperationsPage.tsx` emploie `requestUnsavedExit` pour la navigation humaine entre vues, la sélection de Demandes/Interventions, la fermeture des panneaux et Échap. Le panneau de conclusion enregistre bien un brouillon avec groupe fondé sur l'identité d'Intervention et état `pending`.
- **Point à tester** : le `useEffect` de routage `initialTarget` réinitialise directement `setSelectedRequest(null)` et `setSelectedIntervention(null)` avant le chargement de la cible, sans garde explicite dans ce bloc. Le comportement réel dépend aussi de la garde globale de routage ; ne pas déclarer une perte de brouillon sans reproduire le parcours dans l'application réelle.
- **Point à tester** : `refresh()` remplace la fiche sélectionnée par la réponse de liste, tandis que `useDraftSection.receive(remote)` met à jour le brouillon de conclusion. Vérifier identité A→B→A et réponses tardives pour éviter de contaminer une autre fiche.
- Scénarios ciblés à développer : (1) saisir conclusion A, cliquer B, choisir Rester ; (2) choisir Quitter, vérifier le nettoyage limité à A ; (3) navigation externe vers B avec pending ; (4) rafraîchissement tardif de A pendant affichage B ; (5) Échap et changement de vue ; (6) rejet IPC et tentative de sauvegarde répétée. Vérifier boutons, clavier et absence de changement de chrono.
- État : **audit statique uniquement, aucun test E226 exécuté ni correction UI validée**.

## CI E225 #1077

- Première tentative : Typecheck SUCCESS, Vitest 1008 réussis ; 1 suite `src/main/restore.test.ts` échoue par timeout du `beforeAll` à 10 s, avec 35 tests de restauration ignorés dans cette tentative. Ce n'est **pas une preuve d'échec métier E225** ; la première exécution n'est néanmoins pas verte.
- Relance des jobs en échec demandée via GitHub Actions le 14/10/2026 ; résultat à examiner sur la tentative suivante. Aucune augmentation arbitraire du timeout ni modification de la recette existante avant le diagnostic.

## Incrément E226 — garde de routage externe

- Sur `OperationsPage.tsx`, le changement de cible `initialTarget` effaçait directement les sélections, sans appel à `requestUnsavedExit` dans cet effet. Les clics dans les listes restaient gardés, mais pas cette entrée externe.
- L'effet passe désormais la réinitialisation et les chargements par la même garde UX-01 ; une sortie refusée ou une écriture `pending` conserve la fiche et son brouillon. Les résolutions asynchrones vérifient toujours `live` avant d'appliquer une réponse.
- **Limite** : le comportement doit être confirmé dans l'application Electron avec une cible externe et un brouillon A non sauvegardé, plus la séquence A→B→A, erreur IPC et clavier. Pas de revendication de test Electron pour ce commit ; la CI et la recette ciblée demeurent des gates.
- Le chronomètre, les données réelles, les API métier et les autres lots ne sont pas modifiés.

## E227 — réouverture et mouvements financiers (audit du 14/10)

- `OperationsService.changeInterventionStatus` permet techniquement `completed → in_progress` : la méthode vérifie l'appartenance à l'union de statuts et certains rattachements commerciaux, **pas** une matrice de transitions métier, et efface `completed_at` en quittant `completed`. Il n'existe pas de statut `reopened`.
- `InterventionCompletionService.complete` réutilise la clé idempotente du débit pack et `BillingHandoffService.ensureForIntervention` pour les autres couvertures. La réouverture n'inverse pas automatiquement les mouvements ni les préparations de facturation. Une modification ultérieure des temps ne doit donc pas être traitée comme une nouvelle consommation implicite.
- Test Vitest documentaire ajouté à `InterventionCompletionService.test.ts` : une clôture pack avec débit, transition `in_progress`, puis seconde clôture ; vérifie maintien du débit historique unique et du solde ainsi que FK. **Ne vaut pas autorisation métier d'un bouton Réouvrir.**
- Décision à cadrer séparément : conditions de réouverture, éventuel mouvement compensatoire explicite, recalcul des temps et conséquences facturation. Aucune nouvelle commande, statut ni annulation automatique ajoutés.
- Test publié sur branche isolée, **à valider dans sa propre CI**. Le code des lots 04/05 et `main` demeure hors périmètre.

## Complément E227 — préparation de facturation hors forfait

- Test de non-régression supplémentaire dans `InterventionCompletionService.test.ts` : intervention hors forfait, première clôture et préparation de facturation, transition technique vers `in_progress`, puis nouvelle clôture. Le test compare la liste des préparations et vérifie qu'une seule reste associée à la source, avec son montant et son statut.
- Ce test **ne valide pas une politique de réouverture** et ne déclenche aucune facture Abby. Il sert uniquement à empêcher le double enregistrement d'un handoff existant.
- Contrôles à poursuivre : scénario Electron A→B→A, annulation/confirmation des brouillons pendant routage externe et gestion du `pending`, puis convergence de la branche avec `main`.
- CI #1119 du correctif E226 : réussite typecheck/Vitest ; étapes natives réservées à d'autres PR ignorées. CI #1127 : résultat à confirmer séparément. Le dernier test E227 exige sa propre CI verte.

## Recette Electron E226 — validation Windows TEMP

- Candidat code : `230e618123d3e00d073b9855db1449e4673e8088`.
- CI #1195 : [run 38594272280](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38594272280) — **SUCCESS** ; Typecheck SUCCESS ; suite Vitest **109 fichiers PASS**.
- **28 assertions natives E226** réussies sur le véritable Manager Electron + React + preload + IPC et SQLite %TEMP% : A→B→A, confirmation « Rester » par défaut, « Quitter », isolement des brouillons et données, appel IPC d'enregistrement artificiellement retardé, sortie refusée pendant `pending`, reprise de l'écriture, absence de double navigation et absence de contamination B. Cinq confirmations réellement interceptées dans la fixture.
- **373 assertions natives shell générales** réussies ; 17 destinations, 86 visites de contrôle, aucun débordement candidat ni erreur console ; deux fixtures TEMP nettoyées (`Fixture cleaned: true`).
- `OperationsPage.refresh()` utilise désormais la **sélection courante** dans les mises à jour fonctionnelles React, plutôt qu'une sélection capturée avant l'attente d'IPC : une ancienne réponse de liste ne doit pas ressusciter une autre fiche. La recette native confirme le maintien de la sélection après sauvegarde ; un test distinct injectant un délai de *liste* reste pertinent avant intégration.
- Les scénarios natifs se lancent par `node scripts/check-ux-v2-lot01a-real-ui.cjs --lot08a` et s'exécutent automatiquement dans la CI de la seule PR #109, avant le smoke Electron général. Le profil et la base sont créés hors Validation-MSI et détruits après recette.
- La première version du scénario pending (#1193) échouait sur un mauvais sélecteur du fieldset **dans le test**, corrigé au commit ci-dessus ; le passage vert #1195 est la preuve de référence. Aucune modification des tests métiers pour masquer cet échec.

### Réserves avant clôture / intégration

1. E224 : expliciter auprès du métier la part des routines dans les quotas avant de modifier les compteurs.
2. E227 : règles d'autorisation de réouverture, régularisation explicite de temps et handoff ; les régressions empêchent le double débit ou la double préparation, sans créer une nouvelle règle commerciale.
3. Inspection visuelle humaine du Manager Electron différée ; les tests natifs ne prouvent pas l'aspect visuel subjectif.
4. Actualiser la branche avec `main` récent puis refaire typecheck, suite complète, recettes natives et contrôler les migrations/fixtures avant toute proposition de fusion. Aucune fusion autorisée à ce stade.

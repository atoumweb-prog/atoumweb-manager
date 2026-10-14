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

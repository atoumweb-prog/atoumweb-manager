# Lot 10A — Première reprise contrôlée des métriques (14/10/2026)

## Sources et base de travail
- **Base Git isolée** : `main@cc0bc679400321f5afacdbee3317ea8acc451518`.
- **Référentiel** : `docs/ux-v2/LOT-10A-AUDIT-INDICATEURS.md` (PR #82 encore draft), `AGENTS.md`, `PROJECT_STATUS.md`.
- **Modules touchés** : `shared/statistics.ts`, `main/analytics/AnalyticsService.ts`, `renderer/statistics/StatisticsPage.tsx` et CSS + test unitaire du module partagé.
- Aucune migration, opération SQLite en écriture, calcul de facture Abby, sauvegarde/restauration, modification de Client ou Projet.

## Incrément livré au code, à valider
| Écart | Avant | Après code |
|---|---|---|
| E290 taux d'acceptation | simple : acceptés/(acceptés+refusés), analytics : inclut expirés | aide et helper commun `accepted/(accepted+refused+expired)` ; échantillon vide renvoie `null` (UI « — »). Statuts/dates métier de chaque couche inchangés. |
| E293 CRM | `stage=new` (Annuaire) inclus au KPI « Prospects actifs » et dans un des cinq segments | stade `new` exclu, ainsi que `won/lost` et archivés. Quatre segments engagés visibles, entrants libellés « contacts ». |
| E297 classement Clients | score arbitraire secondes + (centimes × 20) | tri explicite par centimes facturés suivis, départage secondes puis nom, huit lignes affichées. |
| E291 libellé | « Rentabilité & analyse détaillée » | « Analyse financière & rendement » sans prétendre calculer une marge nette. |
| Valeur offerte | max global après somme, susceptible de neutraliser des écarts négatifs individuels | somme des écarts positifs **par devis**, comme `AnalyticsService`. |

## Cas couverts par tests ajoutés, **sans prétendre qu'ils sont déjà verts**
- Contrôle arithmétique des devis expirés : 1 accepté / (1 accepté + 1 refusé + 1 expiré) = 33,33 %, zéro décision = « — ».
- Pipeline : le nouveau contact Annuaire ne devient pas prospect actif sans acte de prospection ; archives, gagnés/perdus exclus.
- Clients : aucune addition euros/secondes ; classement en centimes et départage déterministe ; entrée d'origine inchangée.
- Test SQL `AnalyticsService.test.ts` existant : cas 1 accepté / 1 refusé / 1 expiré avec attente 33,33 %, réutilisé pour détecter une divergence de formule.

## Réserves — 10A non clôturé
- **Aucune CI, typecheck, suite Vitest ou recette Electron Windows exécutés au moment de la rédaction**. Prouver ensuite le SHA exact sur CI, puis recette 3 thèmes × 3 densités et vérification native ciblée.
- Les **cohortes SQL (dates d'événement)** et les **listes UI (statuts courants)** peuvent encore diverger en cas de réouverture d'un devis historique : leur reconciliation n'est **pas** certifiée par une seule fonction de taux.
- E294 et 10B : unifier la barre de période et les comparaisons sans inventer de flux ; gérer chargements périmés.
- E292/E295 : encaissements `cash_collected` indisponibles ; `Facturé suivi Abby` ≠ encaissé ; rendement horaire ≠ marge.
- E296 : vérifier en Accueil le comptage des nouveaux contacts/Annuaire.
- R10A-01 à R10A-17 : **aucun scénario du lot complet n'est certifié** par cet incrément.
- Aucun accès à Validation-MSI, aucune fusion dans `main`, aucune restauration réelle.

## Prochaine séquence
1. Contrôler CI TypeScript/Vitest de la PR draft au HEAD publié, corriger le moindre échec.
2. Matrice source → dates → statut → KPI simple / AnalyticsService, notamment devis passés par plusieurs statuts.
3. Compléter 10A, puis ouvrir 10B sur une base consolidée et testée sans interférer avec les lots 04–09.

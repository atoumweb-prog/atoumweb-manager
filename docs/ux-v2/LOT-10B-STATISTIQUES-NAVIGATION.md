# Lot 10B — Statistiques : navigation, périodes, comparaisons et tableaux de pilotage

**Statut : conception UX V2, aucune interface réécrite.** Sources : `renderer/statistics/StatisticsPage.tsx`, `renderer/analytics/StatisticsPage.tsx`, `HomeDashboard.tsx` sur main au 09/10/2026.  
Références : [10A audit métriques](LOT-10A-AUDIT-INDICATEURS.md), [Lot 02 Accueil](LOT-02-NAVIGATION-ACCUEIL.md), [Lot 03 CRM](LOT-03-CRM.md), [09B Abby](LOT-09B-FACTURATION-ABBY.md).

## 1. Navigation V2 cible sur le module unique « Statistiques »
- **Vue d'ensemble** : quatre repères fiables (Valeur contractuelle acceptée, Facturé suivi Abby, Temps enregistré, nouveaux Clients), **dans leurs définitions exactes**; ne jamais afficher CA encaissé sans source.
- **Commercial** : contacts entrants, pipeline **hors nouveaux Annuaire E72**, devis créés, décisions, taux avec dénominateur lisible, délais, sources et motifs de pertes selon service réel.
- **Projets & temps** : projets préparatoires vs confirmés, terminés, temps net facturable/non facturable/avant-vente, prévu vs réalisé **sur bon échantillon**; ateliers de composition/Bridge n'impliquent pas facturation.
- **Clients** : activité par Client exact, interventions, temps et PDF factures suivies, jamais « chiffre encaissé Client » imaginé; navigation vers fiche et retour filtre.
- **Analyse financière & rendement** : indicateurs de `AnalyticsService`, notamment signé, livré, facturé suivi, dépenses, valeur offerte et **taux horaire contractuel apparent**. **Ne pas le nommer marge nette/rentabilité réalisée** sans vrai coût complet.
- **Accueil ≠ Statistiques** : `HomeDashboard` garde sa priorité « Aujourd'hui », chrono et alertes, avec cartes ciblées renvoyant à Statistiques pour l'analyse longue.

L'onglet détaillé actuel monte **une seconde page analytique** au sein de `StatisticsPage`. La V2 doit **réutiliser les appels `analytics.*` et les calculateurs réellement utiles**, en unifiant la navigation et la période au niveau parent, plutôt que dupliquer les KPI.

## 2. Barre de période canonique
**Périodes existantes mais différentes** :
- statistique simple : `month/quarter/year/all`;
- couche analytique : `today/week/month/quarter/year/previous_year/custom` et dates `from/to` comparatives.

**Cible** : une seule barre commune **Aujourd'hui / Semaine / Mois / Trimestre / Année / Année précédente / Personnalisée / Toutes données**; pour chaque métrique, afficher dates effectives et plage comparaison, ou **comparaison indisponible** quand impossible (toutes données). Les actions `Actualiser` n'effacent ni filtres ni valeurs affichées si rechargement échoue : garder dernier snapshot avec label « données précédentes ».

Un filtrage par date doit utiliser **la date métier de la métrique** (ex. Devis signé `accepted_at`, Facture `invoiced_at`, temps `started_at` ou allocation de temps validée), pas universellement `created_at`.

## 3. Maquettes comportementales par zone
| Zone | Interactions | Garantie |
|---|---|---|
| Bandeau | Période, comparaison, horodatage de chargement, export éventuel **si service livré** | Aucun changement métier par filtre |
| Cartes KPI | Valeur, unité, variation, échantillon, `?` « calcul et source » et clic « Voir les éléments » | Lien ID/filtres exacts, pas liste qui ne correspond pas au chiffre |
| Graphiques | Courbes ou barres sur périodes, légendes et tableaux de valeurs | Graphique accessible sans couleur seule, pas interpolation de données absentes |
| Commercial | Répartition sept étapes conformes aux décisions CRM, contacts Annuaire séparés | E72, E59/E73 non résolus dans code non masqués |
| Production | Prévisionnel vs confirmé, estimé/réel, catégories de temps | Heures « facturables » ≠ « facturées » |
| Finances | Valeur acceptée, facturé suivi, dépenses et métriques indisponibles | CA encaissé et encours sans source **indisponibles**, pas 0 |
| Clients | Tableau avec ordre de tri documenté, recherche/filtres et ouverture Client | Aucun score hybride non expliqué comme comparabilité financière |

**Écart UX identifié** : dans `renderer/statistics/StatisticsPage.tsx`, les Clients sont triés par un score `seconds + invoiced * 20` qui combine **secondes et centimes** avec un multiplicateur arbitraire, puis coupe aux huit premiers. **E297 : retirer ce classement non dimensionnel ou l'étiqueter comme score expérimental, préférer colonnes triables par unité réelle**.

## 4. Cohérence du parcours drilldown
- Clic **« Facturé suivi »** ouvre Facturation **filtrée sur période/statut** avec la même population si routeur/filtre supportés; sinon, ne prétendre qu'un simple bouton « Facturation » équivaut au détail chiffré.
- Clic **« Taux d'acceptation »** ouvre la liste des devis et les décisions/expirations retenues, avec formule et échantillon.
- Clic Projet renvoie au bon `projectId`, conserve les filtres et distingue `provisional/frozen`.
- Les données **absentes** sont rendues par `— / Non disponible`, pas un zéro décoratif.
- La navigation vers le pipeline exclut les prospects `new` mais conserve des contacts Annuaire non prospectés dans leur contexte propre.
- Chargement asynchrone : changement rapide de période ou d'onglet ne doit pas afficher une réponse périmée sous le mauvais libellé.

## 5. Accessibilité & états
Trois thèmes AtoumWeb/Noir/Blanc × trois densités Compact/Confort/Confort+ ; **Compact ≥14 px**, contrastes/focus, tables responsive, barre unique accessible, chiffres à unités explicites, légende sans couleur seule, graphiques accessibles au clavier si interactifs. Aucun formulaire métier altéré par une préférence Statistiques.

## 6. Recette future (17 cas, non exécutés)
| ID | Situation | Attendu |
|---|---|---|
| R10B-01 | Voir 5 onglets cibles | Un module/statut cohérent |
| R10B-02 | Changer période simple→détaillée | Même plage répercutée |
| R10B-03 | Plage personnalisée invalide | Refus et précision |
| R10B-04 | Toutes données | Aucune comparaison fictive |
| R10B-05 | Accueil→Stats→Retour | Navigation et état conservés |
| R10B-06 | Ouvrir indicateur valeur signée | Devis acceptés exacts |
| R10B-07 | Ouvrir métrique facturation | Factures PDF réellement liées |
| R10B-08 | Voir « CA encaissé » | Marqué indisponible |
| R10B-09 | Projet provisoire | Ne gonfle pas la valeur acceptée |
| R10B-10 | Pipeline avec Prospect new | N'apparaît pas actif |
| R10B-11 | Taux d'acceptation sur même période | Un dénominateur canonique |
| R10B-12 | Heure travail + facture | Mesures distinctes |
| R10B-13 | Classement Client par € | Tri par vraie unité et bon Client |
| R10B-14 | Changement rapide filtre pendant chargement | Résultat périmé rejeté |
| R10B-15 | Graphique sans couleur | Valeurs/table accessibles |
| R10B-16 | 3 thèmes×3 densités, clavier/étroit | Lisibilité et focus |
| R10B-17 | SQL + test UI navigation drilldown | Lien et agrégat concordants, Validation-MSI exclue |

**E298** stratégie commune de dates/period; **E299** réutilisation renderer vs AnalyticsService; **E300** drilldown par métrique sans routage fantôme; **E301** libellé « rentabilité » et score Client; **E302** vue Accueil condensée vs Stats étendues.

# Lot 10A — Audit des indicateurs et de leurs sources

**Statut : audit statique et matrice de définitions UX/UI V2 ; aucun test ou changement métier effectué.**  
Code lu sur `main` le 09/10/2026 : `src/shared/statistics.ts`, `src/shared/analytics.ts`, `src/main/analytics/AnalyticsService.ts`, `AnalyticsPeriodService.ts`, `src/renderer/statistics/StatisticsPage.tsx`, `src/renderer/analytics/StatisticsPage.tsx`, `HomeDashboard.tsx`.
Références : [Lot 10](LOT-10-PILOTAGE-REGLAGES.md), [Lot 03 CRM](LOT-03-CRM.md), [Lot 06 Devis](LOT-06-DEVIS-ABBY.md), [Lot 07 Projets](LOT-07-PROJETS-BRIDGE.md), [Lot 08 Temps](LOT-08-OPERATIONS-TEMPS.md), [Lot 09 Finances](LOT-09-GESTION-DOCUMENTS.md).

## 1. Deux couches déjà présentes
- **`src/renderer/statistics/StatisticsPage.tsx`** récupère des listes `prospects/clients/quotes/projects/time/billing/expenses/interventions` et calcule **dans le renderer** quatre onglets : Vue d'ensemble, Commercial, Projets & temps, Clients. Filtre période mois/trimestre/année/toutes données.
- Son cinquième onglet **« Rentabilité & analyse détaillée »** monte `src/renderer/analytics/StatisticsPage.tsx`, qui utilise **`AnalyticsService` côté main/SQLite** via `analytics.financialSnapshot/commercialSnapshot/projectTimeSnapshot`, avec comparaisons et périodes aujourd'hui/semaine/mois/trimestre/année/année précédente/personnalisée.
- **Ce ne sont pas deux modules à reconstruire**. Le Lot 10 doit proposer une surface cohérente et **un registre canonique de métriques**, pas deux calculs divergents ou deux filtres de date contradictoires.
- **Accueil** est une vue d'actions quotidiennes, non une troisième comptabilité; éviter duplication permanente de tous les graphiques dans `HomeDashboard`.

## 2. Matrice des chiffres réellement calculés et de leurs bornes
| Indicateur | Source réellement observée | Définition/caution |
|---|---|---|
| Valeur commerciale signée | `quotes.catalog_value_cents`, devis acceptés, `accepted_at` | Tarif catalogue historique, **pas montant encaissé** |
| Valeur contractuelle signée | `quotes.contract_value_cents`, devis acceptés, `accepted_at` | Montant convenu; **pas facture** |
| Valeur offerte | Écart positif catalogue−contractuel, devis acceptés | S'assurer que le texte correspond au plafonnement réellement utilisé |
| Valeur commerciale livrée | Projets terminés `commercial_value_cents` + interventions terminées `theoretical_value_cents` **hors `included_project`** | Éviter double comptage, ne pas promettre marge/résultat net |
| Facturé suivi Abby | `billing_items.expected_amount_cents` si `invoiced`, date `invoiced_at` | **Facture PDF importée**, montant **attendu Manager**, pas nécessairement montant OCR/vérifié du PDF |
| À facturer | `billing_items` `ready/planned` (vue simple, stock actuel) | **Stock à date de consultation**, pas un flux « nouveau sur la période » ; ne pas comparer aux flux signés sur la même échelle sans préciser |
| Dépenses | `expenses.amount_cents` hors `cancelled`, `expense_date` | **Dépense enregistrée**, pas paiement bancaire, même si état autre que `paid` |
| CA encaissé | Définition `payments.amount_cents` dans `analytics.ts` | **available=false** ; données de paiements non exploitées. Afficher **« Non disponible »**, jamais 0 €. |
| Reste à encaisser | Définition `invoices - payments` dans `analytics.ts` | **available=false**, pas de créances chiffrées à inventer |
| Prospects entrants et pipeline | `prospects.created_at`, stades (UI) et événements (backend) | **E72** : nouveau `stage='new'` = Annuaire, **pas prospection active** ; ne pas l'inclure aux chiffres « Pipeline actif » |
| Devis créés/acceptés/refusés | `quotes.created_at` ou `accepted_at/refused_at` selon métrique | Comparer sur une même population/dénominateur explicites, choix de cohorte vs décisions sur période à spécifier |
| Taux d'acceptation | UI simple : acceptés/(acceptés+refusés); AnalyticsService : acceptés/(acceptés+refusés+expirés) | **E290 : deux dénominateurs réellement différents**. Choisir/nommer la définition avant harmonisation, ne pas publier des taux contradictoires. |
| Projets actifs/terminés | `projects.status` et `completed_at` | **`commercialState='provisional'`** distinct de production acquise; ne pas les sommer comme CA signé |
| Temps travaillé | `time_sessions` net et fermées selon source; `started_at` filtré | Distinguer temps brut, pauses, sessions fermées, facturable et en cours; une session traversant la frontière de période mérite règle explicite |
| Rentabilité effective | La page Analytics affiche surtout **€/heure contractuels/commerciaux** sur projets terminés avec temps | **E291 : indicateur de rendement horaire, pas marge nette**; coûts, sous-traitance, dépenses affectées, éventuelle TVA non intégrés dans ce ratio |

## 3. Dérives et risques audités
- **E290 : double calcul** du taux d'acceptation : onglet simple exclut les expirés, `AnalyticsService.commercialStats` les inclut. Ils ne doivent pas être affichés sous le même nom sans dénominateur.
- **E291 : « Rentabilité »** dans le libellé actuel peut suggérer bénéfice/marge; `AnalyticsService.projectEconomics` calcule surtout `contract_value_cents/tracked_seconds` et `commercial_value_cents/tracked_seconds`, **pas** les coûts complets.
- **E292 : « Facturé suivi »** somme le `expected_amount_cents` de Manager pour les items liés à un PDF Abby; ne pas l'appeler montant vérifié du PDF, chiffre encaissé ou CA comptable.
- **E293 : statuts commerciaux E72** : `StatisticsPage.activeProspects` inclut actuellement `new` car filtre seulement gagnés/perdus et archives; corriger la notion de **Prospects actifs** vs **contacts Annuaire** en respectant le clic `Démarrer la prospection`.
- **E294 : deux modèles de périodes** et distinction **stocks vs flux**; définir l'horodatage de chaque métrique et synchroniser les filtres sans masquer la comparaison.
- **E295 : audience et sources** : les temps avant signature (Projet `provisional`), les dépenses planifiées et les factures suivies ne doivent pas construire automatiquement un « bénéfice dégagé ».
- **E296 : source du compteur de préparation Devis** dans Accueil et pipeline; même règle E72/absence de conversion fictive à appliquer.

## 4. Registre cible de la métrique, vérifiable et navigable
Chaque KPI doit exposer via une icône `?` ou `Voir le calcul` : **nom exact**, unité (€ TTC/HT seulement si attesté, sinon **€ enregistré**), population, table/champs, période de référence, statut filtré, date métier, exclusions, formule, échantillon, comparaison, lien vers la liste filtrée et dernière actualisation. « Inconnu/indisponible » ≠ « zéro ». Les pourcentages sans dénominateur renvoient **indéfini**, pas 0 %.

Un graphique n'est jamais la seule représentation : tableau/valeurs accessibles, navigation de retour, pas de catégorie inventée pour les données absentes.

## 5. Recette future (17 cas, non exécutés)
| ID | Test | Attendu |
|---|---|---|
| R10A-01 | Valeur contrat signée | Uniquement devis acceptés |
| R10A-02 | Montant facturé | PDF Abby lié, pas encaissement |
| R10A-03 | Dépenses engagées vs payées | Libellés/stats non trompeurs |
| R10A-04 | CA encaissé indisponible | « Non disponible », pas 0 € |
| R10A-05 | Reste à encaisser indisponible | Même règle |
| R10A-06 | Calcul taux simple vs Analytics | Différence E290 explicitée puis définition harmonisée |
| R10A-07 | Expiré dans le dénominateur | Conforme définition retenue |
| R10A-08 | Nouveau contact `stage=new` | Annuaire, hors Pipeline actif |
| R10A-09 | Prospect qualifié volontairement | Entre au Pipeline |
| R10A-10 | Projet prévisionnel non signé | Pas CA signé |
| R10A-11 | Intervention `included_project` | Pas de valeur livrée comptée deux fois |
| R10A-12 | Projet sans temps suivi | Ratio €/h indisponible, pas 0 inventé |
| R10A-13 | Échantillon projet partiel | Taille `n` affichée |
| R10A-14 | Stock À facturer et filtre période | Stock identifié distinct du flux |
| R10A-15 | Session chevauchant début de période | Règle date explicite et testée |
| R10A-16 | Données annulées/archivées | Exclusions auditables |
| R10A-17 | Recalcul SQLite/test UI 3 thèmes×3 densités | Résultat traçable, Validation-MSI intacte |

**Les constats sont documentaires et les métriques actuelles n'ont pas été modifiées.**

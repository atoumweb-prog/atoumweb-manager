# Lot 08D — Packs d'heures, solde, mouvements, débits et dépassements

**Statut : spécification V2 documentaire, sans code ni test exécuté.** `HourPackService`, `HourPackShortfallService`, `HourPacksPanel`, `InterventionCompletionService` relus sur `main` le 09/10/2026.
Liens : [08A audit](LOT-08A-AUDIT-REGLES-ET-PARCOURS.md), [08B Interventions](LOT-08B-INTERVENTIONS-DEMANDES.md), [08E Temps](LOT-08E-CHRONO-TEMPS-RAPPORTS.md), [06E Abby](LOT-06E-ABBY-REVISIONS-PROJET.md).

## 1. Modèle métier réel
Un **Pack d'heures** appartient à un **Client**, éventuellement à un **Projet**, avec durée achetée, date d'achat, expiration éventuelle, prix contractuel et statut `active/exhausted/expired/suspended/archived`. Ses mouvements sont **une comptabilité de secondes**, pas une modification directe du champ « heures restantes ».

Les mouvements existants sont :
- `initial_credit` : crédit initial à création.
- `intervention_debit` : débit du **temps effectivement terminé** de l'Intervention, avec provenance; `source_key=intervention:packId:interventionId` protège le rejeu.
- `manual_correction` : correction **positive ou négative** justifiée.
- `commercial_credit` : ajout de crédit commercial, **positif uniquement**.
- `reversal` : contrepassation d'un mouvement existant, sans le supprimer ni écraser son origine.

Le **solde réel peut être négatif**; `HourPackShortfallService` détecte les dépassements et prévoit des décisions explicites sur le manque de crédit, y compris la préparation d'une facture complémentaire selon le contrat. Ce n'est pas une raison d'interdire automatiquement l'exécution de toute intervention.

## 2. Existant et objectifs
| Source | Réalité vérifiée | Cible |
|---|---|---|
| `HourPacksPanel.tsx` | Liste/recherche, création à partir offre Catalogue, Client/Projet, solde, mouvements, débit d'Intervention, correction, crédit, contrepassation, avertissement de solde bas. | Fiche **liste gauche + détail droit agrandissable**, timeline complète, montant et durées compréhensibles. |
| `HourPackService.create` | Crée Pack + crédit initial dans savepoint; statuts calculés exhausted/expired. | Création volontaire depuis offre vendue acceptée ou **création manuelle identifiable** : pas d'achat Abby fictif. |
| `HourPackService.debitIntervention` | Vérifie état du pack, Client/Projet, statut Intervention `to_validate/completed`, temps terminé; enregistre ID source unique dans transaction; rejeu identique neutre. | Débit automatique contrôlé à clôture, aperçu du temps déduit, une seule ligne de débit et conséquences sur solde. |
| `HourPackService.reverseMovement` | Contrepassation avec motif, refus du double renversement. | Aucun effacement du débit original : solde recomposé depuis mouvement. |
| `HourPackShortfallService.review/decide` | Détecte débits conduisant à solde négatif et garde décision, motif, prix éventuel, synchronisation BillingHandoff. | Une Intervention peut être **terminée avec solde négatif** selon politique; ensuite traitement explicite du manque, pas facture Abby automatique. |
| `InterventionCompletionService.complete` | Appelle le débit pack et les changements statut de l'Intervention, sans transaction visible qui englobe **tous** les effets dans cette méthode. | **UX-03 / E222 :** recette de panne partielle et enveloppe atomique si requise. |

## 3. Fiche Pack cible
- **Identité** : nom, Client/Projet, produit/offre source si vendu, date d'achat, prix/snapshot, expiration, statut.
- **Résumé de crédit** : acheté (h/min), utilisé (h/min), disponible **positif ou négatif**, mouvements non encore compensés, seuil d'alerte, source de chaque donnée.
- **Historique** : une ligne par mouvement avec type, date, durée signée (+/-), Intervention/session éventuellement liée, auteur/résolution si disponible, motif et possibilité d'ouvrir l'origine.
- **Interventions rattachées** : statut, temps réel hors pause, couverture et mouvement de débit, avertissement « déjà débité ». Aucun bouton « Débiter à nouveau » si `source_key` déjà présente.
- **Dépassement** : durée du manque, montant éventuel, choix et justification humaine, statut de préparation de facturation (élément Abby prêt ≠ facture émise).
- **Actions** : `Ajouter correction`, `Ajouter crédit commercial`, `Débiter intervention éligible`, `Annuler un mouvement` avec confirmation; `Suspendre`/`Archiver` et avertissement sur l'historique.
- **Facturabilité** : distinguer **temps facturable** et **temps déduit du pack déjà payé** ; l'Intervention débitée n'est pas automatiquement une deuxième facture.

## 4. Séquence sûre et invariants
1. Afficher **solde avant, temps imputable exact (sessions terminées), solde après** avant action de débit/correction/contrepassation.
2. Contrôler **Client/Projet**, état Pack, état Intervention, sessions rattachées, temps hors pauses et protections de cible opérationnelle.
3. Confirmer et enregistrer côté **service transactionnel**, pas en déduisant localement le solde. Recharger le Pack après succès.
4. Rejouer la même opération doit produire **zéro débit supplémentaire**, y compris double clic/réponse IPC lente.
5. Si une session débitée est **corrigée après clôture**, calculer l'écart et proposer **régularisation par mouvement** traçable, jamais réécriture du débit historique ou seconde imputation totale (à construire/valider).
6. Une Intervention abandonnée/réouverte ne fait pas disparaître un mouvement. Annulation explicite `reversal` et rapport d'effets sur le statut éventuel.
7. Solde négatif : montrer la dette de temps, **ne pas corriger silencieusement à zéro**. Toute décision de facturer un complément crée seulement **un élément de facturation à traiter**.
8. Les protections de « couvert par maintenance », « payé par pack », « hors forfait facturable » ne se mélangent pas : elles appartiennent à **une Intervention identifiée** et sa prise en charge.

## 5. Recette future (15 cas, aucun exécuté)
| ID | Test | Résultat |
|---|---|---|
| R08D-01 | Créer Pack manuel | Crédit initial exact et origine documentée |
| R08D-02 | Créer Pack depuis devis accepté | Une vente/Pack liés, sans doublon au rejeu |
| R08D-03 | Débiter une Intervention d'un autre Client | Refus |
| R08D-04 | Débiter pack Projet incompatible | Refus |
| R08D-05 | Débiter Pack suspendu/archivé/expiré | Refus |
| R08D-06 | Débiter Intervention sans temps terminé | Refus |
| R08D-07 | Débiter 90 minutes | Mouvement -5400 secondes exact |
| R08D-08 | Rejouer débit même source | Solde/mouvements inchangés |
| R08D-09 | Correction manuelle -15 minutes | Mouvement motivé, solde explicite |
| R08D-10 | Crédit commercial +30 minutes | Mouvement positif seulement, raison |
| R08D-11 | Contrepasser un débit | Mouvement `reversal` et débit original conservé |
| R08D-12 | Rejouer contrepassation | Une seule annulation |
| R08D-13 | Débit provoquant solde négatif | Affiche dépassement sans l'effacer |
| R08D-14 | Décider facturation du manque | Un élément prêt pour Abby, pas facture envoyée |
| R08D-15 | Correction de session, UI 3×3 et SQL | Pas de second débit total, Validation-MSI intacte |

## 6. Questions techniques ouvertes
**E239** correction d'un temps déjà débité; **E240** stratégie de réouverture et reversal; **E241** identité commerciale des Pack manuels ou vendus; **E242** droits/justifications sur mouvements négatifs; **E243** lien des décisions de shortfall vers Abby; **E244** atomicité de clôture englobant débit pack/statut et audit.

**Le moteur de mouvements existe; l'UX V2 en clarifie les décisions et ne doit jamais convertir un mouvement correctif en nouvelle vente silencieuse.**

# Lot 09 — Matrice d'audit et plan d'exécution initial
Date : 14 octobre 2026

## Portée et confiance
Ceci est un plan opérationnel, **pas une preuve d'implémentation**. Source d'orientation : référentiel UX/UI V2 PR #82 et cadrage du lot 09. Le code source et les scénarios 09A–09F ne sont pas encore parcourus intégralement. Ne pas déclarer 108 scénarios réussis : leur liste détaillée et leur résultat restent à vérifier.

## Grille de traçabilité à renseigner
Pour chaque action : module / écran / champ / handler / API IPC / service / table / contraintes SQLite / tests existants / risque UX-01 / résultat (existant, partiel, absent, décision requise).

| Zone | Inspection prioritaire | Critère de décision | État |
|---|---|---|---|
| Facturation/Abby | Facture, référence externe, statut, synchronisation, PDF, liens devis/client | Ne pas confondre émise, encaissée, annulée ; préserver provenance | Non vérifié |
| Dépenses | Création, affectation, montant/taxe, justificatif, doublon, suppression | Total fiable, contrôles de saisie, justificatif préservé | Non vérifié |
| Documents | Pièces jointes, stockage, export/import Word et PDF, permissions | Traçabilité, intégrité, absence d'écrasement silencieux | Non vérifié |
| Historique | Révisions, auteur/date, remplacement et restauration | Anciennes versions accessibles, comparaison possible | Non vérifié |
| Liens métier | Client, prospect, devis, contrat, projet, interventions | Relations explicites, suppression contrôlée | Non vérifié |
| UX et sécurité | Brouillons, conflits, erreurs, clavier, confirmations | Maintien des protections UX-01 | Non vérifié |

## Plan séquentiel conseillé (noms provisoires, à réconcilier avec #82)
1. **09A — Audit transversal et cartographie** : identifier le comportement réel et livrer la matrice UI → backend → preuve ; sans migration.
2. **09B — Factures et statuts** : clarification des états et de l'autorité d'Abby, après audit.
3. **09C — Dépenses et justificatifs** : contrôle des doublons, montants, affectations et conservation.
4. **09D — Documents et versions** : préserver originaux, historique, provenance.
5. **09E — Flux Word/PDF** : export, réimport, comparaison, validation explicite.
6. **09F — Recette intégrée** : parcours complets et scénarios intermodules.

**Important :** ce découpage est une hypothèse de travail et ne doit pas remplacer les intitulés officiels des sous-lots de la PR #82 s'ils diffèrent.

## Première livraison de code autorisable
Uniquement après repérage des fichiers : tests de caractérisation non destructifs autour de l'association facture ↔ devis ↔ client, puis correctif minimal si une lacune est confirmée. Pas d'évolution de schéma tant que l'impact avec les autres lots n'est pas mesuré.

## Gates obligatoires
- Rebase/merge-base contrôlés avant reprise d'autres branches ;
- Typecheck, tests ciblés, suite complète, contrôle migrations et restauration sur copies TEMP ;
- SQLite integrity_check, foreign_key_check et non-régression UX-01 ;
- Recette Electron Windows sur fixtures, pas sur données métier réelles ;
- Validation spécifique des relations Abby/facturation et conservation des originaux ;
- PR en draft sans merge automatique, résultats et SHA consignés.

## Interdictions immédiates
Ne pas toucher aux branches des lots 03–08, à `main`, à une base utilisateur réelle, ni remplacer/supprimer une facture ou un justificatif. Aucun succès de test revendiqué sans exécution.

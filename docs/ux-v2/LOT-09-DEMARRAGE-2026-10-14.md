# UX/UI V2 — Lot 09 : démarrage isolé (14 octobre 2026)

## État
Démarrage documentaire / audit uniquement. Aucune implémentation métier, migration, modification IPC, écriture de base ou fusion dans `main`.

## Source et frontières
Référentiel UX/UI V2 : PR #82. Lot 09 : Facturation, Dépenses et Documents. Découpage attendu : 09A à 09F ; 108 scénarios annoncés dans le cadrage, à rapprocher des scénarios effectifs du référentiel avant toute revendication de couverture.

## Règles métier non négociables
- Abby émet les factures ; le Manager prépare, suit, rapproche et archive.
- « Facturé » et « payé » sont deux états distincts. Aucun paiement déduit de la seule existence d'une facture.
- Ne jamais créer de faux PDF présenté comme facture émise.
- Protéger les PDF de factures rattachées contre la suppression accidentelle.
- Garder les versions et l'historique des justificatifs remplacés.
- Pour Word : export, modification externe, réimport, comparaison et versionnement traçables.
- Garantir intégrité, liens client/projet/devis/contrat, conservation des brouillons et protections UX-01.

## Audit initial à effectuer avant développement
1. Inventorier écrans et parcours existants Facturation, Dépenses, Documents, Archives, échéances et états.
2. Identifier les fonctions existantes : stockage, provenance, Abby, export/import Word, archivage PDF, suppressions, liens.
3. Établir pour chaque interaction la chaîne UI → handler → IPC → service → tables → tests.
4. Comparer l'existant aux scénarios 09A–09F dans #82 : réalisé, partiel, absent, à arbitrer.
5. Établir une matrice des risques : écriture concurrente, doublons, suppression, migrations, confidentialité et provenance.
6. Proposer un premier sous-lot minimal sans empiéter sur lots 03 à 08.

## Isolation et recette
- Branche propre : `audit/ux-v2-lot09-20261014` issue de `main`.
- Ne modifier aucun chantier des lots 04–08 et ne pas fusionner.
- Privilégier audits/documentation avant interventions sur code, migrations ou modèles partagés.
- Toute implémentation ultérieure devra passer typecheck, tests ciblés, suite complète, contrôle des migrations, restauration, intégrité SQLite, FK et recette Electron.
- CI hébergée à éviter tant que le budget GitHub Actions est contraint ; résultats de tests non exécutés = non validés.

## Statut au démarrage
Branche créée. Audit du code et matrice de traçabilité à compléter. Aucun test exécuté ni fonctionnalité 09 déclarée livrée.

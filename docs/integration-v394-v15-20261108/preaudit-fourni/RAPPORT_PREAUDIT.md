# Préaudit AtoumWeb V3.9.4 / V1.5

Statut : contrôle en lecture seule. Aucun prix, contrat, historique ou base modifié.

## Vérifications du pack
- 130_references: OK
- 130_codes_distincts: OK
- statuts_attendus: OK
- 18_codes_v39: OK
- 119_clauses: OK
- clauses_001_a_119: OK
- 119_codes_contractuels_distincts: OK
- clause_019_rectificatif: OK
- hash_word_catalogue: OK
- hash_word_clauses: OK
- hash_word_metier: OK

## Bibliothèque contractuelle
119 versions candidates non publiées. Le texte de la clause 019 doit provenir du rectificatif ; ne pas réintroduire PAY-005 dans le corps client.

## Rapprochement
- Base locale non accessible dans cette exécution : les identifiants actifs sont **à déterminer sur le worktree Windows**.
- 18 codes V39- listés dans le CSV ; aucune équivalence par nom n’est validée.

## Conditions de livraison
- Réutiliser les services Catalogue / Import Catalogue / Contrats existants ; ils comportent des préconditions héritées (notamment 118 clauses et 409 liens) à faire évoluer sous tests.
- Préserver les 47 statuts de délégation, les 6 fiches à vérifier et les versions historiques.
- Choisir explicitement les versions proposées, sans publication ni activation automatique.
- Ne pas démarrer une PR sur une branche distante antérieure à un lot 2 encore non committé sans réconciliation Git.
- La validation métier ne certifie pas la conformité légale.

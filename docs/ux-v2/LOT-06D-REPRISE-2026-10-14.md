# Lot 06D — Contrats et conséquences métier du Devis

**Reprise du 14/10/2026 — branche autonome issue de main, aucune modification du moteur contractuel.**

## Invariants à préserver
- La signature du devis vaut acceptation du contrat intégré ; pas de signature parallèle créée dans Manager.
- Les CGV communes et clauses par prestation appartiennent au Builder du lot 05 ; ce lot 06D doit les consulter et les afficher, sans dupliquer la logique métier.
- `finalize` prépare le devis à l'envoi et fige son contenu contractuel ; `accept` atteste l'acceptation externe effectivement obtenue via Abby.
- Les états `sent` et `viewed` restent des déclarations, pas une preuve d'envoi ni de signature via l'API Abby.
- Conversion Prospect → Client et préparation Projet ne doivent découler que de la transition métier autorisée ; aucune conversion en simple brouillon.
- L'acceptation et la création de documents restent idempotentes ; les versions historiques et le texte contractuel doivent être traçables.

## Audit et recette restants
1. Recenser les contrôles avant `finalize` : prix, lignes, paramètres contractuels, client professionnel/consommateur, clauses.
2. Contrôler le snapshot juridique et l'attachement PDF après acceptation Abby ; aucune pièce absente présentée comme existante.
3. Tester refus, expiration, annulation, révision et acceptation répétée, avec vérification stricte des conséquences Client / Projet / opérations.
4. Contrôler navigation, brouillons et erreurs de chargement à travers 06B et CGV lot 05.
5. Exécuter typecheck, Vitest, scénarios Electron Windows TEMP, puis une recette intégrée avec 06A/06B/06C/05.

**Statut** : audit lancé ; aucun test 06D ni aucune CI lancés sur cette branche. Ne pas fusionner avec main avant arbitrage des dépendances.

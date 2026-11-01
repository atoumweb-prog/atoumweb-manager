# AtoumWeb — Revue rédactionnelle autonome de 27 clauses (29 octobre 2026)

**État : uniquement des propositions contractuelles dans la PR #159.** Aucune publication, aucune adoption humaine, aucune modification d'un devis signé ou contrat historique. L'ancienne proposition est conservée dans `previousEditorialProposal` et l'original publié dans `origin`.

## Périmètre vérifié

- **7 clauses e-commerce** : `ECOM-CATALOGUE`, `ECOM-IMPORT`, `ECOM-LEGAL`, `ECOM-LIVRAISON`, `ECOM-MULTILINGUE`, `ECOM-PAIEMENT`, `ECOM-STOCK`.
- **10 clauses communes** : `BASE-ACCEPTATION`, `BASE-COOPERATION`, `BASE-DELAIS`, `BASE-DONNEES`, `BASE-OBJET`, `BASE-PAIEMENT`, `BASE-PI`, `BASE-PRIX`, `BASE-RESPONSABILITE`, `BASE-VALIDATION`. Les deux autres clauses BASE (confidentialité et force majeure) avaient déjà été révisées ; elles ne sont pas comprises dans ce lot.
- **10 clauses applications et outils métier** : `APP-CADRAGE`, `APP-COMPATIBILITE`, `APP-ENVIRONNEMENTS-ACCES`, `APP-EVOLUTIONS`, `APP-GARANTIE`, `APP-MAINTENANCE`, `APP-MVP`, `APP-PI-REUTILISATION`, `APP-PROTOTYPE`, `APP-RECETTE`.

## Principes de réécriture

Rédaction lisible (« nous / vous »), phrase compréhensible par un particulier ou un professionnel, différence entre une prestation vendue et une demande nouvelle, rappel des corrections et garanties déjà dues, absence de délais, prix, quota, licences ou transfert de droits inventés. Préférence pour **étapes de relecture et de correction** plutôt que « allers-retours ».

### Points de cohérence traités

1. **E-commerce :** fournir des données produits exactes reste le rôle du marchand ; les erreurs d'intégration imputables à AtoumWeb restent à corriger. Import de catalogue seulement dans le périmètre vendu.
2. **Paiement e-commerce :** le client reste titulaire du compte auprès de Stripe/PayPal et reçoit directement les fonds, conformément à la clause `WEB-PAIEMENT-TIERS` ; AtoumWeb n'encaisse ni ne redistribue les paiements.
3. **Contenus juridiques marchands :** distinguer les CGV de vente du client des conditions de prestation AtoumWeb ; intégration technique distincte de la consultation juridique.
4. **Prestations communes :** accord écrit, échéances convenues, corrections dues, droits d'utilisation et responsabilité propre de chaque partie.
5. **Applications :** cadrage autonome sans promesse de développement ; prototype distinct d'un MVP exploitable ; garantie corrective distincte des évolutions ; maintenance seulement si commandée.
6. **Validation :** silence, paiement ou mise en ligne ne valent pas automatiquement acceptation ; les garanties et corrections ne sont pas annulées par une étape de relecture.

## Points à vérifier avant adoption — arbitrages seulement si non définis dans les devis

| Point | Vérification / arbitrage |
| --- | --- |
| Licences et propriété intellectuelle des applications | Décrire précisément l'exploitation autorisée, les livrables remis (application, code, dépôt, documentation) et les ressources tierces. Une exclusivité ou cession ne se présume pas. |
| Durée de garantie corrective | Vérifier la durée et le point de départ dans chaque offre et dans le devis ; aucune durée universelle (notamment « 90 jours ») n'est imposée par la proposition. |
| Paiements et acomptes | Vérifier la qualification expresse de l'acompte sur les devis, les droits propres aux consommateurs et les restrictions de paiement pour les contrats concernés. |
| Données personnelles | Identifier les traitements sous-traités, les accords RGPD adaptés et les procédures réelles de gestion des accès/secrets. |
| Paiements/transporteurs/stock | Confirmer le mode de paiement direct et les fonctionnalités réellement configurées, ainsi que les prestataires et permissions utilisés. |
| Délais d'exécution B2C | Contrôler les dates/délais précontractuels figurant sur les devis adressés à des consommateurs. |

Aucun de ces points n'a été arbitrairement fixé pour l'ensemble des clients à la place d'un devis.

## Commits des propositions

- ECOM 7 : `1203ed68841375d990d5593b103e57d6e015d304`
- BASE 5 premiers : `0fac53bfee8d2924ce086992ce014450115b6925`
- BASE 5 derniers : `2bf8585de473f3e1c5c3b41788b142c26eaf86a8`
- APP 5 premiers : `cf19ed09c6d4e0567a61215178419c9115d74498`
- APP 5 derniers : `6d595888743bf350ee5a38c884b0fd0b0f0f4a91`

## Vérification automatique du registre

Comparaison effectuée avec la branche à l'état du commit `8fecb0ef9ac2de78eb053e7163faa5193922cb38`, avant ce lot :

- **27/27 propositions** ont changé et **27/27 anciennes propositions** sont conservées.
- **27/27 corps d'origine publiés** restent identiques.
- **27/27 décisions humaines, approbations et informations de publication** sont inchangées.
- Aucune proposition hors de ces 27 entrées n'a changé dans ce lot.
- **118 clauses toujours présentes**, sans doublon de code ; **0 approbation**, toutes les décisions humaines **En attente**.

**Limites** : revue rédactionnelle/documentaire uniquement ; aucune validation juridique définitive, aucun test des PDF, devis B2B/B2C, contrats signés, moteur ou base de données. Avant adoption, une revue juridique et une recette dans les modèles de devis sont recommandées.

# UX/UI V2 — 05D : états contractuels visibles dans le devis

## Incrément 05D.1

La vue `ContractTermsBuilder` explique explicitement le statut du document :
- `draft` : préparation encore modifiable avant finalisation ;
- `frozen` : texte figé avec le devis, y compris le cas d'un snapshot vide ;
- `historical_missing` : absence historique de snapshot, aucune reconstitution automatique.

Ces messages ne modifient **ni le contrat**, **ni les clauses**, **ni les versions**, **ni les pièces Abby**, **ni les données réelles**. Ils sont distincts des avertissements remontés par le moteur.

## Recette restant obligatoire

Vérifier par test et Electron TEMP la présence du bon message pour chacun des trois états, en particulier le snapshot figé vide. Tester les parcours devis brouillon / finalisé / historique sans snapshot, puis valider contraste, focus, clavier, trois thèmes × trois densités. Aucun historique ne doit être recomposé ou sauvegardé durant ce contrôle.

05C demeure non validé : CI #907 (y compris sa deuxième tentative) et #911 arrêtées avant attribution du runner Windows. 05D est un nouvel incrément **non certifié**. Ne pas fusionner la PR #106 dans `main` sans tests et accord explicite.

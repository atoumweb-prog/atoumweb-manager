# Lot 05D — suivi des validations de changement de devis

## Tests ajoutés
- Ne pas réutiliser le brouillon d'un devis A lors de l'initialisation indépendante du devis B (mêmes identifiants de clause dans le jeu de test).
- Ne pas muter les clauses canoniques ni les brouillons locaux durant la fusion.

Ces tests ciblent uniquement la fonction pure `mergeContractClauseDrafts`. Ils **ne certifient pas** le cycle de vie React de `ContractTermsBuilder`, ni les changements de devis dans une vraie fenêtre Electron.

## Reste à vérifier avant clôture
- Passage réel d'un devis A comportant plusieurs saisies non enregistrées vers B : confirmation UX-01 et absence de fuite d'une clause A vers B.
- Requête de prévisualisation tardive après changement de devis : aucun résultat A affiché sur B.
- Retour vers A avec conservation ou abandon explicite du brouillon selon la décision UX-01.
- Trois thèmes, trois densités, clavier et focus, et cas `frozen` / `historical_missing`.
- CI typecheck, Vitest et Electron sur le HEAD publié.

La branche reste en draft ; ne pas fusionner dans `main` sans validation humaine.

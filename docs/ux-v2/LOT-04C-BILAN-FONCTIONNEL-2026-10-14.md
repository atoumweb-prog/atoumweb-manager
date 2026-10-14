# Lot 04C — Éditeur Catalogue V2 : état d'implémentation

**Date :** 14 octobre 2026 — **PR :** #108 (draft, base #104) — **Pas de fusion**.
Ce document constate le code publié et ses réserves. **Il ne vaut pas recette validée** et n'annonce aucune certification juridique.

## Huit onglets réellement raccordés

| Onglet | Fonction actuelle | Limite explicite |
|---|---|---|
| 1. Identité | Code canonique, catégorie existante, nature/famille commerciales et provenance versionnée, statut avec confirmation | Nom et catégorie métier sont portés par l'item (pas historiés comme un prix) ; gouvernance de catégorie en E95/04B |
| 2. Tarifs & Abby | Mode, prix Catalogue/conseillé, coût tiers, unité, périodicité, acompte, durée, délai, libellé Abby | Montants en centimes ; pas de TVA/HT/TTC inventés ; aucun abonnement réel créé |
| 3. Contenu & périmètre | Nature, description, inclus, exclus, prérequis dans le brouillon versionné | Pas d'enregistrement automatique ; textes humains |
| 4. Associations | Réutilise les services publiés liés à une Offre, optionnel/inclus, quantité, suppression, refus de modification d'une Offre publiée | Recommandations et relations N:N **04D** distinctes ; Service sans composant d'offre |
| 5. Aide à la vente | Besoin, bénéfices, mots-clés versionnés E96 et conseil interne ; affiche « non configuré » si aucun contenu | Argumentaires structurés **04E** non prétendus livrés ; aucun conseil ajouté aux CGV automatiquement |
| 6. Contrat & CGV | Réutilise `CatalogContractPanel`, types associés à une version, navigation bibliothèque, brouillons protégés UX-01 | CGV/juridique traités par le **lot 05**, aucun résultat « conforme » fictif |
| 7. Production | API `catalog.listProductionBlueprints(versionId)` : vraie lecture SQLite des modèles liés, version/état/rôle/quantité/site ; liens recopiés à vN+1 | **Lecture seule** : configuration avancée dans la bibliothèque existante, aucun Projet/Site/Bridge créé ici |
| 8. Historique | Versions numérotées, publication en deux actes explicites, comparaison publiée/brouillon enregistré, horodatage, immutabilité des versions retirées | Aucune publication WordPress/Abby ni signature impliquée |

**Navigation** : tablist ARIA avec tabpanel dédié, champs édités dans un `versionDraft` React commun. Passer d'Identité vers Tarifs, Contenu, Vente ou Contrat n'efface pas les changements non enregistrés ; quitter un brouillon sale passe par UX-01. Les références de types contractuels ont leur propre garde UX-01. La production est consultative.

## Moteur et sécurité

- Première création et nouvelle version restent des actes séparés.
- Sauvegarde en place du **même draft ID** avec comparaison de tous les champs versionnés et transaction `BEGIN IMMEDIATE` ; écritures concurrentes refusées.
- Création d'une vN+1 avec UUID idempotent fourni par l'éditeur ; réponse IPC perdue et second clic ne produisent pas une vN+2 ; UUID divergent, version déjà publiée ou mauvais item refusés.
- `publishVersion(versionId, expected?)` refuse une version publiée/retirée, contrôle le snapshot sous verrou et retire la publication ancienne **seulement si l'opération est autorisée**.
- Prépublication : comparaison des champs commerciaux enregistrés ; avertissements humains (périmètre, composants, CGV et production), blocages exclusivement sur incohérences techniques démontrables. Aucun contrôle ne vaut certification juridique.
- Modification actif/inactif/archivé nécessite une confirmation d'action explicite ; les Devis historiques restent sur leurs snapshots, pas sur les prix actuels.
- Modifier une composition d'Offre est indisponible tant qu'un autre formulaire de version est ouvert.
- Pas de nouvelle migration au titre du 04C : base du registre de catégories E95 via migration 67 fournie par #104.

## Preuves de test proposées et implémentées

- `CatalogDraftEditing04C.test.ts` : sauvegarde CAS, retry IPC UUID, conflits multi-fenêtres, prix/historique, retrait/publication, prépublication incohérente.
- `catalogVersionReview.test.ts`, `CatalogPublicationReview.test.ts` : comparateur pur et panneau de confirmation sans faux statut CGV.
- `catalogEditorTabs.test.ts` : huit identifiants de navigation et segmentation des champs.
- `CatalogProduction04C.test.ts` : lecture des vrais blueprints, copie des liens d'une version à l'autre, intégrité FK, aucune création automatique de Projet.
- `check-catalog-identity-ui.cjs` : exercice de l'interface dans Electron TEMP avec huit onglets, champs, brouillon conservé, sécurité de statut, historique et production. Il ne vaut **pas** inspection visuelle humaine.

## Réserves et critères de réception

1. **CI GitHub Actions indisponible** : depuis plusieurs runs, les jobs sur différentes branches échouent en quelques secondes avec `steps=null`. La cause racine n'est pas prouvée. Aucun test n'a été exécuté sur le dernier SHA 04C au moment de ce rapport. Le dernier typecheck/Vitest effectivement réussi concernait un état antérieur, pas les huit onglets actuels.
2. Sur le **SHA final**, relancer `npm run typecheck`, `npm test -- --maxWorkers=2`, `node scripts/check-catalog-identity-ui.cjs`, migrations 1–67 / FK / sauvegarde-restauration, et les régressions UX-01 sur un atelier Windows isolé. Aucun passage ne peut être annoncé « PASS » avant exécution.
3. Valider la convergence avec le `main` issu du lot 03 ; #104 doit être réconciliée avant la PR empilée #108, sans double intégration ni écrasement des projets #106 (lot 05).
4. Les extensions recommandation 04D et argumentaires 04E **ne sont pas une partie livrée du 04C** ; les contrôles CGV ne sont pas une validation juridique, et l'identité item-level n'est pas une historique de versions.
5. **Recette visuelle humaine non réalisée** conformément à la demande expresse. Les données réelles Validation-MSI n'ont pas été ouvertes.

**Conclusion :** périmètre fonctionnel du 04C codé et publié en draft, **réception technique finale en attente**, aucune fusion autorisée.


## Dernier complément de réalisation (04C, même PR)

- Les changements actif/inactif/archivé utilisent un **choix provisoire** puis un bouton « Confirmer le statut ». Aucun appel de modification avant confirmation ; Annuler ramène la valeur réellement enregistrée.
- Les composants d'une Offre ne sont pas modifiables lorsque le formulaire de version est en cours, pour éviter une modification de composition malgré une autre saisie non sauvegardée.
- La navigation tablist gère aussi **Flèche gauche**, **Flèche droite**, **Home**, **End** et conserve le focus de l'onglet courant, avec confirmation UX-01 si l'on quitte des rattachements contractuels sales.
- `catalogEditorTabs.test.ts` et `scripts/check-catalog-identity-ui.cjs` contiennent désormais des scénarios pour la segmentation en huit onglets, le focus/clavier, les données persistantes en changeant d'onglet, et le cycle d'annulation/confirmation de statut. La fonction `CatalogProductionPanel` est en consultation stricte et ne configure pas de blueprint.
- Les textes d'aide à la vente non configurés sont clairement annoncés comme tels plutôt que remplis avec des données fictives.

**Résultat de contrôle externe :** CI [#985](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38570317448), sur le SHA `25baf1403fb123b932cbd619c7f3c6a9e4c8247e`, **failure sans aucune étape d'exécution (`steps=null`)**. Il ne s'agit pas d'un résultat négatif sur TypeScript ou Vitest, mais **il ne constitue pas une preuve de réussite**. Ce SHA reste en attente de vrais tests automatiques et de contrôle de convergence. Pas de revue visuelle humaine.

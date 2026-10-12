# Lot 01B — reprise, audit Abby et recette Windows du 12/10/2026

## Base et périmètre

- Branche : `feature/ux-v2-lot01b-components-v1`, PR #87 draft, base `feature/ux-v2-lot01a-typography-v1` (#86 draft).
- Départ propre : `b9679c30e74d837d69561544253fede5d6785fb3`. Référentiel de reprise lu sur #82 à `efb4fe6cf54bf9278315f9a5580ff1b8d9ebb9c4`.
- Main distant vérifié : `07dde9c85dab337ee0ed3a5a92034a139d7ebad2`, ancêtre de cette branche. #81 terminée ; #83 fermée sans fusion. Aucun ancien travail réinitialisé ou réintégré.
- Correctif local : `af5cdc559517e049c45f80acf551928e0dd28772`. Les validations ci-dessous portent sur son contenu, pas sur le seul ancien résultat `36ef9e8`.
- Aucun push, CI hébergée, merge, accès Validation-MSI, migration réelle, restauration réelle ou déploiement. Services, IPC, preload, schéma, montants, textes contractuels et signature inchangés.

## Audit et défauts reproduits avant correction

Le `QuoteAbbyPanel` existant est conservé : abonnement `useSyncExternalStore`, filtre exact `quote:<id>` et descendants, raison visible, contrôle supplémentaire au clic, succès après résolution et erreur de copie. Le banc initial passe 15/15. Il ne prouvait pas que tous les sous-éditeurs publient effectivement leurs états.

Les extensions de recette ont échoué avant correction sur les cas suivants, puis réussi :

| Défaut démontré | Correction ciblée |
| --- | --- |
| Référence Abby modifiée sans blocage de copie | `QuoteContractDocumentPanel` inscrit valeur différente du champ enregistré et `busy` dans le groupe du devis ; abandon reprend la valeur enregistrée. |
| Retrait d'une option en attente, sans éditeur dirty | `QuoteOfferOptionsPanel` inscrit son `busy`, sans inventer de brouillon ni de confirmation. |
| Suppression directe d'une ligne en attente dans le vrai écran | `QuotesPage` suit les mutations de son détail dans le registre UX-01, compteur décrémenté dans `finally`. Même suivi pour ajout/édition, synchronisation, transitions et prolongation ; mêmes services, arguments et gardes. |
| Date de préparation Projet modifiée sans blocage | `QuoteProjectPanel` rattache template/date et opération en cours à `quote:<id>/project`, jusqu'à la création ou l'abandon. |
| Destination opérationnelle du devis accepté modifiée sans blocage | `SaleTarget` réutilise le groupe hérité du devis, suit son enregistrement et marque le brouillon enregistré seulement après résolution et rafraîchissement. |
| Aide longue coupée près du bas de la fenêtre | `FieldHelp` réserve les 240 px maximum définis par sa CSS, plutôt que 120 px. Reproduction : bas du panneau à 537 px pour un viewport de 417 px. CSS, textes, délai et ouverture existants conservés. |

Les gardes déjà présentes restent intactes : ligne principale et options (`QuoteLineEditor`), paramètres de prestation (`QuoteLineParametersPanel`), prérequis (`QuoteConditions`), préparation et administration contractuelles, clauses et sous-formulaires du Builder, ajout catalogue/ligne libre. Aucun second registre ou dialogue concurrent. Une lecture seule n'est pas présentée comme une modification contractuelle ; les opérations Projet restent celles déjà disponibles.

## Recettes et preuves

| Commande | Résultat réel / portée |
| --- | --- |
| `node scripts/check-ux-v2-lot01b-abby-guard.cjs` | **25/25** : vrais panneaux React et registre ; dirty/pending imbriqués, autre devis dirty et pending indépendant, course au clic, reprise après sauvegarde confirmée, service refusé conservant la référence, presse-papiers refusé sans faux succès, Projet et destination opérationnelle. Services/presse-papiers simulés explicitement ; aucune écriture dans le presse-papiers réel. |
| `node scripts/check-unsaved-inputs-ui.cjs --abby` | **21/21** : vrai écran Devis/IPC/services sur SQLite TEMP, trois thèmes, préparation/administration/ligne dirty, suppression réellement retardée puis confirmée, migrations exactes 1–66, intégrité OK/FK vide. |
| `node scripts/check-unsaved-inputs-ui.cjs --lot-b --lot-c --review` | **183/183** : annulations, refus avant suppression/archivage, brouillons conservés, erreurs de concurrence sur le vrai service d'administration, sorties, panneaux, réponses tardives, Electron, fenêtre détachée, workspace différé. Les trois erreurs IPC de version périmée sont attendues et testées, pas des échecs de recette. |
| `node scripts/check-ux-v2-lot01b-controls.cjs` | **40/40** : 9 thèmes/densités, double action, erreur, champ contrôlé préservé, vraie tabulation (ordre, saut du bouton désactivé), vraie touche Espace, libellé/erreur longs à 100/125/150 %. Fixture corrigée pour reproduire sidebar/main-area/content-area. |
| `node scripts/check-ux-v2-lot01b-help.cjs` | **70/70** : 9 thèmes/densités, option OFF/ON, court/prolongé, Entrée/Espace/Échap natifs et focus restauré, aucune activation du champ parent, détail long défilable et fermeture accessibles en fenêtre étroite à 100/125/150 %, trois thèmes. |
| `node scripts/check-ux-v2-lot01b-icons.cjs` | **42/42** : 36 icônes, noms accessibles et vraie touche Entrée, 9 combinaisons. |
| `node scripts/check-ux-v2-lot01b-notices.cjs` | **30/30** : quatre niveaux, fermeture indépendante, action seulement au clic, 9 combinaisons. |
| `node scripts/check-ux-v2-lot01b-workshop.cjs` | **50/50 sans export de captures** : cinq composants, 9 combinaisons. L'ancien 51/51 incluait le contrôle supplémentaire du mode captures ; ne pas comparer ces totaux comme un échec. |
| `node scripts/check-ux-v2-lot01a-real-ui.cjs` | **300/300** sur 17 destinations, 86 visites, 5 étroites et 10 zooms ; zéro erreur console ou candidat dépassement. |
| `npm run typecheck` | **OK**, après les derniers raccords. |
| `npm test -- --maxWorkers=2` | **801/801, 87 fichiers, 108,59 s** sur `af5cdc5`, sortie 0, sans RPC. Dont 35 restaurations et contrôles migrations/intégrité/FK sur fixtures. |

Tous les bancs natifs ci-dessus confinent profils/fichiers/bases à leurs TEMP et annoncent `Fixture cleaned: true`. Aucun artefact de recette dans Git. Les tests Vitest ne sont pas additionnés aux assertions des scripts comme une suite unique.

## Fichiers du correctif

- Production renderer uniquement : `QuoteContractDocumentPanel.tsx`, `QuoteOfferOptionsPanel.tsx`, `QuoteOperationalSalesPanel.tsx`, `QuotesPage.tsx`, `QuoteWorkflow.tsx`, `FieldHelp.tsx`.
- Recettes permanentes : `check-ux-v2-lot01b-abby-guard.cjs`, `check-unsaved-inputs-ui.cjs`, `check-ux-v2-lot01b-controls.cjs`, `check-ux-v2-lot01b-help.cjs`.
- Suivi : présent rapport, `UXV2_LOT01B_GATES.md`, `UXV2_LOT01B_EXECUTION.md`, `UXV2_LOT01B_VISUAL_REVIEW.md`, `PROJECT_STATUS.md`, `MANAGER_BRIDGE_ROADMAP.md`.

## Proposition de clôture et limites

Proposer la clôture technique **du pilote 01B** après validation humaine de la matrice R01B, garder #86/#87 draft. Cela ne signifie pas migration des 17 modules en V2, audit WCAG/lecteur d'écran complet, validation juridique, intégration GitHub ou validation du package final. Les neuf captures anciennes restent attachées à leur SHA ; aucun nouveau ZIP ou examen de captures récentes n'est revendiqué ici. Les compléments étroits/zoom sont des mesures DOM et interactions Electron réelles.

Le prochain lot **01C** doit partir de la bibliothèque et des protections UX-01 actuelles, inventorier les fiches/panneaux pilotes et leurs ouvertures/fermetures, puis prévoir la réutilisation du même registre. Avant intégration : arbitrer l'ordre #86 → #87, puis contrôle du HEAD réellement publié/CI selon autorisation. Aucun développement 01C, refonte de navigation, nouveau `AppDialog` ou bouton « Enregistrer et quitter » n'est commencé.

# AtoumWeb Manager

## Audit UX/UI et fonctionnel

[Documentation de l’état des lieux du 09/10/2026](docs/ux-audit/README.md), fondée sur main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda. Cartographie, interactions critiques, règles à préserver, preuves et limites ; aucun cahier des charges UX V2 ni développement de refonte validé par cette publication.

## État courant — 09/10/2026

La branche officielle et active est **main** depuis la fusion normale de la PR #79 (8e05a47296d478587b11841e36ca5acb2e936726). Le commit contenant cette documentation ajoute la Bibliothèque contractuelle versionnée et les corrections de la recette manuelle Prospect / Devis. Consulter git log -1 pour son identifiant.

**SQLite : migrations 1–66.** La migration 66 est additive : types, versions, compositions référencées aux clauses existantes, rattachements aux versions Catalogue. Validation-MSI a reçu après autorisation 13 types/compositions en brouillon et 112 rattachements ; 118 clauses et 409 liens Catalogue → clauses conservés. Aucune publication automatique de type.

La Bibliothèque contractuelle permet de consulter les 13 socles sans créer un devis. Le devis propose Contrat & CGV lisible, copies Abby/contrat/tout et PDF depuis une source commune ; les snapshots acceptés restent figés. Corrections UX : Site facultatif/absence explicite, Offres/Services, contenus repliables, décisionnaire dans Qualification, contrôle avant devis indépendant, défilement et raccourcis vers les champs contractuels. Aucune décision juridique ni date de livraison inventée.

Derniers contrôles : **typecheck OK, 695/695 tests (79 fichiers), UI 134 natifs +37 Prospection +21 préparation +20 options, trois thèmes**. Intégrité/FK correctes ; tests déterministes sur fixtures ou bases temporaires. La recette manuelle globale AtoumWeb est en cours et reste à valider.

### Lancer la recette MSI actuelle

Le lanceur local **C:/DEV/Lanceurs/AtoumWeb-Recette-Validation-MSI.cmd** lance le code du checkout par npm start. Il contrôle que le profil de développement utilise le workspace existant **C:/DEV/02_DONNEES/AtoumWeb/Validation-MSI** ; aucune réinitialisation. Enregistrer la saisie avant un redémarrage.

L’ancien AtoumWeb-Validation-MSI.cmd lance le package généré le 29/09/2026 : **il ne contient pas ces correctifs**. Aucun nouveau package/installateur livré par ce checkpoint Git. Le lanceur de recette est local à la machine MSI et hors Git.

CRM local AtoumWeb : Prospects, Clients, Catalogue, Devis, Projets, temps, interventions, maintenance, bibliothèques, documents, préparation manuelle Abby et statistiques.

## Historique — consolidation du 08/10/2026

**Manager consolidé sur `fix/pre-phase5-commercial-ux`.** Phase 7 est intégrée, ainsi que Projet V2, Sites/Pages/compositions, contrats et Builder CGV, Catalogue 112, opérations et statistiques/rentabilité.

Checkpoint fonctionnel validé : **`8662c3fbeaf2e3b26a68cffa779422f395edd400`**, incluant le port sélectif du réemploi guidé. Schéma SQLite : **migrations 1–65**.

| Dernière validation | Résultat |
|---|---|
| Typecheck | OK |
| Tests ciblés réemploi/référentiels | 56/56 |
| Suite complète | 670/670 |
| Recette UI sur AtoumWeb, Noir et Blanc | 55/55 |
| Intégrité SQLite | OK |
| foreign_key_check | Vide |

Validation-MSI est un environnement **de développement/test non productif**. Les référentiels y sont utilisables pour les dossiers TEST. Ces validations ne certifient ni un usage productif ni une conformité juridique globale.

## Parcours et périmètre intégrés

`Prospect → Devis → prestations/options → clauses et snapshot → préparation manuelle Abby → Projet prévisionnel → acceptation et gel du même Projet → production et suivi`

Les prestations récurrentes, packs et interventions utilisent leurs objets opérationnels propres. Une option disponible ne contribue que lorsqu’une ligne d’achat est réellement persistée. Les nouveaux abonnements ont des cycles de date à date, distincts de la facturation ; les quotas inutilisés ne sont pas reportés. Les estimations restent indicatives et ajustables au dossier.

Le parcours guidé `Projet → Bibliothèque technique → préparation indépendante → adaptation humaine → création volontaire d’une brique AtoumWeb avec provenance` est porté depuis l’idée de la PR #62 sur le backend actuel. **Ne pas fusionner #62** : les services et migrations anciens n’ont pas été repris.

La PR #68, consacrée aux **packs commerciaux `.atoum` V0.2**, reste un prototype historique non intégré. Elle ne décrit pas une fonctionnalité actuelle et ne bloque pas la consolidation. Les packages techniques de la Bibliothèque actuelle sont distincts de ce prototype.

## Limites conservées

- Abby reste manuel : blocs commercial/contractuel à copier et PDF accepté à importer ; aucun connecteur ni envoi automatique.
- Aucune validation juridique globale de la bibliothèque contractuelle. Les données administratives TEST ne sont pas des informations de production.
- Le suivi des factures et dépenses est intégré ; les encaissements bancaires restent une limite distincte.
- Bridge WordPress, Lot 8C et futurs chantiers restent séparés. Les fonctions d’échange déjà présentes côté Manager n’autorisent aucun travail sur le plugin WordPress.

## Sources de vérité

- `PROJECT_STATUS.md` : avancement, validations et journal des étapes.
- `docs/HANDOFF_CODEX_MSI.md` : reprise opérationnelle sur le MSI, état actuel puis archives.
- `docs/MANAGER_BRIDGE_ROADMAP.md` : coordination Manager/Bridge et journal des décisions.
- `AGENTS.md` : règles de travail ; ne pas dupliquer les sources métier ni réécrire les historiques réels.
- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md` : périmètre fonctionnel initial, à lire avec les décisions datées du suivi.

## Reprise Git et prochaine étape

Travailler sur **main**, préserver les modifications locales avant toute synchronisation et utiliser des mises à jour normales sans reset destructif ni force-push. L’autorisation AtoumWeb du 09/10 couvre le commit/push de l’évolution contractuelle, des corrections UX validées techniquement et des fichiers de liaison. La consolidation vers main est déjà réalisée : ne pas recréer la PR #79.

Prochaine étape métier : poursuivre la recette manuelle AtoumWeb avec le lanceur de développement et la base existante. Le checkpoint technique ne vaut pas validation juridique globale ni validation finale de cette recette. Aucun travail Bridge/8C ou nouvelle activation des référentiels n’est autorisé par cette publication.

# AtoumWeb Manager

CRM local AtoumWeb : Prospects, Clients, Catalogue, Devis, Projets, temps, interventions, maintenance, bibliothèques, documents, préparation manuelle Abby et statistiques.

## État courant — 08/10/2026

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

## Prochaine étape Git

**PR finale `fix/pre-phase5-commercial-ux` → `main`.** Les commits locaux validés restent à pousser après autorisation AtoumWeb. Aucun push, création de PR ou merge n’est autorisé par ce document.

Utiliser la branche consolidée actuelle pour la reprise, et non une ancienne branche de Phase ou `feature/project-blueprints-v1`. Les références anciennes restent des checkpoints historiques. Sauvegarde avant migration ou modification destructive importante ; tests déterministes sur fixtures et schéma temporaire, sans SHA/comptages immuables de Validation-MSI.

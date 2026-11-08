# Lot 2 — spécification de persistance à approuver séparément

**Direction technique approuvée par Carlos le 07/11/2026.** L'incrément 2 a depuis été développé et vérifié exclusivement sur TEMP : [rapport de réalisation et limites](RAPPORT-LOT2-INCREMENT2-2026-11-07.md). Les sections ci-dessous conservent la conception initiale ; la règle supplémentaire d'un seul brouillon opérationnel et sa pré-vérification sont précisées dans [la note de compatibilité](COMPATIBILITE-BROUILLON-UNIQUE.md). La migration expérimentale 81 n'est pas appliquée au démarrage normal ; aucune application à une base utilisateur ou Validation-MSI n'est autorisée.


## Référence contrôlée

Branche `codex/ux-v2-offres-tarifs-20261106`, socle lot 1 `57ad50fd41c2de038015b346edae0751c7f8b785`. Structure actuelle examinée dans les migrations source et dans `sqlite_master` d'une base **TEMP** construite par le registre existant (preuve locale : `outputs/Offres-Tarifs-Lot2-Increment1-2026-11-07/schema-existing.json`). Aucun accès à une base utilisateur pour cette étude. Numéro de migration futur non réservé : le déterminer depuis le registre au moment autorisé.

## Schéma cible proposé

Tous les champs et objets non cités restent identiques, notamment IDs, numéros, prix, clauses, JSON et références historiques. Pas de table parallèle de contenu de brouillon.

| Objet | Changement exact proposé | Reprise des lignes existantes |
|---|---|---|
| `catalog_versions.price_mode` | Retirer `NOT NULL`, conserver la liste des sept modes et ajouter la contrainte ci-dessous. Aucun nouveau faux mode commercial. | Copier chaque valeur telle quelle. |
| `catalog_versions.last_saved_at` | `TEXT` nullable : date UTC du dernier enregistrement manuel réussi de **cette version**. | `NULL`, faute de date fiable. Afficher « dernière sauvegarde inconnue », création séparée ; ne pas utiliser l'heure de migration. |
| `catalog_versions.save_revision` | `INTEGER NOT NULL DEFAULT 0 CHECK(save_revision>=0)`, incrémenté atomiquement pour la sauvegarde des champs de version et les transitions publication/abandon/restauration. | `0` représente le point de départ technique, pas un nombre de modifications historiques. |
| `catalog_versions.abandoned_at` | `TEXT` nullable ; abandon réversible d'une version brouillon, sans suppression ni état commercial fictif. | `NULL`, aucun abandon inféré. |
| `catalog_command_receipts` | Table STRICT de reçus d'idempotence, définition ci-dessous. Aucun prix/texte contractuel dupliqué. | Vide. |

Contraintes nouvelles de `catalog_versions`, à intégrer dans la définition reconstruite :

```sql
CHECK (price_mode IS NULL OR price_mode IN
 ('fixed','starting_from','hourly','monthly','yearly','quote_only','free'))
CHECK (price_mode IS NOT NULL OR (status='draft' AND price_cents IS NULL))
CHECK (abandoned_at IS NULL OR status='draft')
CHECK (save_revision >= 0)
```

Le mode absent implique donc brouillon et prix absent. Un brouillon abandonné conserve `status='draft'` et sa version ; il n'est pas transformé en retirée avec un prix inventé. Le retour de `abandoned_at` à NULL est une restauration explicite sous CAS. Un abandon ne modifie jamais `catalog_items.status` ni une version publiée.

Reçu de commande proposé, **définition documentaire uniquement** :

```sql
CREATE TABLE catalog_command_receipts (
 request_id TEXT PRIMARY KEY,
 operation TEXT NOT NULL CHECK(operation IN ('create_minimal','duplicate')),
 intent_sha256 TEXT NOT NULL CHECK(length(intent_sha256)=64),
 item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
 version_id TEXT NOT NULL REFERENCES catalog_versions(id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL
) STRICT;
```

Le service vérifie UUID, hexadécimal SHA-256 et appartenance `version_id.item_id=item_id`. L'empreinte couvre la commande normalisée, y compris version/révision source et choix de copie pour une duplication. Un même UUID avec une intention différente produit un conflit. Un rejeu identique retrouve les mêmes IDs même si le brouillon a été modifié, abandonné ou publié depuis : renvoyer l'identité du résultat et son état actuel, ne pas réappliquer l'intention. Transaction unique pour article + version + références copiées + activité + reçu. Après perte IPC, le client conserve le même UUID et la même intention jusqu'à résolution. Désactiver le bouton n'est pas une garantie d'idempotence.

`createVersion` possède déjà un rejeu par UUID de version ; le conserver avec ses contrôles existants. Ne pas annoncer cette garantie pour la création initiale ou la duplication avant leur implémentation.

## Contraintes, index et triggers à préserver/adopter

La reconstruction conserve : table STRICT, PK `id`, FK `item_id -> catalog_items(id) ON DELETE CASCADE`, `UNIQUE(item_id,version_number)`, numéro positif ; états draft/published/retired ; JSON valides, montants/durées/délais non négatifs, acompte 0–100, natures commerciales et bases tarifaires existantes. Les clauses et snapshots ne sont pas réinterprétés.

Index à recréer à l'identique :

- `idx_catalog_versions_item(item_id,version_number DESC)` ;
- `idx_catalog_versions_status(status,published_at DESC)` ;
- `idx_catalog_versions_one_published(item_id) WHERE status='published'`, unique ;
- auto-index de PK et d'unicité recréés par leurs contraintes, sans manipulation de leurs noms SQLite.

Index supplémentaire proposé : `idx_catalog_versions_open_drafts(last_saved_at DESC,created_at DESC,id) WHERE status='draft' AND abandoned_at IS NULL`. Il sert la liste opérationnelle des brouillons ; les dates inconnues restent identifiables, sans garantie d'un ordre historique inventé.

Triggers directs existants `catalog_actual_cost_insert` et `catalog_actual_cost_update` : conserver l'interdiction d'un coût tiers réel avec prix fixe, mais gérer explicitement NULL. Prédicat proposé :

```sql
NEW.price_basis='actual_cost' AND
 (NEW.price_cents IS NOT NULL OR
  (NEW.price_mode IS NOT NULL AND NEW.price_mode<>'quote_only') OR
  (NEW.status<>'draft' AND NEW.price_mode IS NULL))
```

Le trigger UPDATE doit surveiller aussi `status` pour couvrir la transition depuis un brouillon incomplet. Les CHECK de table bloquent également une publication avec mode absent. `catalog_canonical_code_immutable` et l'index `idx_catalog_items_canonical_code` appartiennent à l'article : ils sont **inchangés**. Aucun renommage/recodage implicite.

Les triggers de `quote_option_purchases` (`quote_option_purchase_validate`, `quote_option_purchase_no_update`, `quote_option_purchase_no_frozen_delete`) restent inchangés, ainsi que les gardes des snapshots de devis et contrats. Inventorier à nouveau tous les triggers et vues contenant le nom `catalog_versions` lors de l'implémentation ; le registre peut avoir évolué.

## Clés étrangères entrantes

Les IDs de versions ne changent pas et les règles ON DELETE restent celles du registre :

| Table | Colonne(s) vers `catalog_versions.id` |
|---|---|
| `offer_components` | `offer_version_id`, `service_version_id` |
| `quote_lines` | `catalog_version_id` |
| `quote_option_purchases` | `source_offer_version_id` |
| `project_services` | `catalog_version_id` |
| `project_node_sources` | `catalog_version_id` |
| `catalog_project_blueprints` | `catalog_version_id` |
| `catalog_contract_type_links` | `catalog_version_id` |
| `catalog_version_recommendations` | `source_version_id`, `target_version_id` |
| `catalog_import_entries` | `from_version_id`, `to_version_id` |
| `catalog_operational_links` | `catalog_version_id` |
| `operational_sales` | `catalog_version_id` |
| `catalog_commercial_rules` | `catalog_version_id` |
| `catalog_command_receipts` (nouvelle) | `version_id` |

`catalog_contract_clause_links` référence l'article, pas sa version : ne pas transformer ce lien sous prétexte de cette migration. Liste vérifiée à cette référence, à revalider avec `PRAGMA foreign_key_list` de toutes les tables avant l'implémentation.

Procédure envisagée : service arrêté/exclusif, sauvegarde vérifiée, reconstruction dans une transaction avec copie explicite de **toutes** les colonnes ; garder le nom logique final et les IDs. Éviter de renommer d'abord l'ancienne table, ce qui peut réécrire les FK entrantes. Si le mécanisme du registre `disableForeignKeys` est requis, désactiver hors transaction, reconstruire, exécuter `foreign_key_check` **avant validation**, annuler au moindre résultat, puis réactiver et recontrôler. L'implémentation devra fournir ce contrôle bloquant, pas seulement un rapport après commit. Comparer aussi les définitions avant/après des index, triggers et vues.

## Publication, Devis et contrats

Séparer validation d'un brouillon et validation d'une publication. Un brouillon minimal garde nom/type valides, mais peut avoir mode/prix/catégorie/conditions absents. Aucun ajout automatique de `quote_only`, zéro, acompte, catégorie ou clause. Les valeurs déjà renseignées gardent leurs validations métier.

`publishVersion` refuse mode absent, version abandonnée ou snapshot/révision périmé ; conserver revue explicite, erreurs/avertissements, transaction et unicité de la publiée. La vérification doit précéder tout retrait de la version publiée actuelle. Un échec laisse l'ancienne référence et ses liens intacts.

`QuoteService` refuse déjà une version non publiée ou un article non actif. Renforcer la frontière d'entrée : mode réel et version non abandonnée, y compris composants et options ; aucun calcul ou snapshot ne doit transformer NULL en zéro/Sur devis. Les anciennes lignes et snapshots restent inchangés. Compositions, recommandations, contrats et production conservent leurs gardes de source publiée/draft/ready ; un brouillon incomplet ne permet pas d'activer une vente ou un projet.

Les types doivent distinguer version brouillon avec mode nullable et version utilisable commercialement avec mode réel. Ne pas rendre tous les calculs de prix silencieusement permissifs. Lectures de comparaison/import/export et anciens adaptateurs doivent afficher « À compléter » ou rejeter une opération non compatible ; pas de conversion de tarif.

## Sauvegarde et abandon

`last_saved_at` est écrit seulement après une commande explicite réussie, dans la transaction ; pas lors d'une consultation, navigation, étape, échec, conflit ou rejeu d'une création. La création minimale fixe sa propre date. Le tri de Mes brouillons utilise les dates connues, avec date de création séparée. Pour les sous-domaines, afficher leur contexte/date propre si disponible ; ne pas faire croire que sauver une version a enregistré les liens contractuels ou la production.

CAS proposé sur ID + statut draft + révision attendue + absence d'abandon, en conservant la comparaison des champs existante et la saisie locale. Publication/abandon/restauration concurrents invalident la révision. Résolution manuelle avec dernier snapshot distant puis nouvel essai ; pas de fusion automatique. Les services de liens gardent leurs CAS spécifiques.

Avant persistance, abandon = suppression de la seule saisie locale après confirmation. Après persistance, abandon = marqueur réversible, date et activité ; pas de suppression de lignes ni d'archivage de l'article entier. Reprise interdite sans restauration explicite. Article et versions historiques restent retrouvables.

**Incidence OT-04 à approuver :** proposer que le compteur/filtre « Avec brouillon » et Mes brouillons désignent les brouillons opérationnels non abandonnés ; l'historique montre aussi les abandonnés. La référence commerciale exclut les abandonnés. Cette adaptation doit être décidée et testée explicitement, elle n'est pas appliquée par la présente étude. Aucun autre compteur d'article n'est recalculé d'après le seul abandon d'une version.

## Tests, sauvegarde et retour arrière proposés

Tests de migration sur bases TEMP issues du registre, vides et peuplées : vérifier chaque colonne historique (prix/JSON/clauses inclus), IDs et relations ; FK/intégrité ; index et triggers ; ancienne application vs schéma cible explicitement incompatible ; migration enregistrée une fois et second démarrage sans effet. Ne pas prendre une base Validation-MSI comme oracle.

Matrice métier : nom/type seuls persistés puis même ID/version après redémarrage ; refus publication/Devis/composants incomplets ; transition publiée conservée après échec ; compléter puis publier explicitement ; dates inconnues non inventées ; révision et saisie conservées sur conflit ; abandon/restauration réversibles ; reçu identique rejoué sans doublon et intention différente rejetée ; duplication transactionnelle, code non copié et source immuable ; panne simulée au milieu d'une copie avec rollback complet.

Avant une future application autorisée : arrêter les écritures, créer une sauvegarde locale cohérente avec l'API de sauvegarde existante (SQLite/WAL pris en compte), conserver profil/version applicative compatibles, contrôler intégrité et restauration sur une copie isolée. Aucun simple copier-coller du `.sqlite` ouvert sans son WAL. Résultat de sauvegarde et restauration testée requis avant migration.

Retour arrière pendant migration : rollback transactionnel, ne pas marquer la migration appliquée. Après succès : pas de downgrade automatique supprimant les modes NULL ou brouillons récents. Restaurer la sauvegarde **et** le code compatible seulement après décision explicite, avec sauvegarde séparée des écritures postérieures pour éviter leur perte ; sinon correction en avant. Un retour binaire seul sur une base au nouveau schéma est interdit.

Direction approuvée et testée sur TEMP pour l'incrément 2, selon le rapport. Toute activation hors TEMP reste soumise à une nouvelle autorisation explicite, avec sauvegarde et vérification des incompatibilités historiques ; elle n'est pas déduite de cette approbation.

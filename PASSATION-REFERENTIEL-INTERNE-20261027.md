# Passation GitHub — données commerciales AtoumWeb

Date : 27 octobre 2026
Branche : `codex/internal-reference-handoff-20261027`

Cette branche centralise l'état du code déjà transmis pour le moteur de devis et un export en lecture seule des données commerciales présentes dans le Manager. Elle ne modifie ni les tarifs, ni les clauses, ni les contrats historiques, ni la base utilisateur.

## Fichiers principaux

- `data/handoff/2026-10-27/catalogue.json` : 136 éléments et 163 versions avec identifiants, catégories, prix, unités, périodicités, descriptions, inclusions, exclusions, prérequis, paramètres commerciaux, statuts et provenance. Le fichier contient aussi les 11 composants d'offres et les liens vers les modèles de projet.
- `data/handoff/2026-10-27/contrats-publies.json` : 118 clauses et 118 versions publiées telles qu'enregistrées, 409 associations Catalogue/clauses, 13 types de contrat et leurs 147 modules, plus les métadonnées d'import.
- `data/handoff/2026-10-27/temps-et-modeles-execution.json` : temps présents dans le Catalogue, 28 nœuds du modèle de projet et 7 actions de la checklist de maintenance. Les valeurs absentes restent absentes.
- `data/handoff/2026-10-27/manifest.json` : empreintes, comptages et périmètre d'exclusion.
- `data/handoff/2026-10-27/inventaires-et-audits/` : derniers constats commerciaux déjà produits le 27 octobre, sans nouvelle analyse.
- `docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json` : 118 propositions humanisées documentaires, séparées des clauses publiées et non adoptées.
- `docs/ux-v2/audit-redaction-20261025/` et `docs/ux-v2/bibliotheque-humaine-118-20261025/` : inventaires, rapports, tableaux de validation et preuves documentaires existants.

Les sources canoniques historiques déjà versionnées restent disponibles dans `data/catalogue/` et `data/contracts/`.

## Reproduire l'export

L'exporteur ouvre SQLite en `mode=ro&immutable=1`, ne sélectionne que des tables explicitement autorisées et vérifie l'empreinte de la base avant et après lecture.

```powershell
python scripts/export-commercial-reference.py `
  "CHEMIN/atoumweb-manager.sqlite" `
  "data/handoff/2026-10-27"
```

## Limites constatées, sans correction

- `catalog_categories` est vide : les catégories et familles sont encore portées par les champs texte `category` et `family_code`. Aucune sous-catégorie normalisée supplémentaire n'a été inventée.
- `catalog_commercial_rules` et `catalog_version_recommendations` sont vides.
- Une seule des 163 versions Catalogue possède `estimated_minutes` et une seule possède `recommended_delay_days`. Les 28 nœuds de modèle contiennent leurs temps lorsqu'ils existent ; les 7 actions de maintenance n'ont pas de temps de référence enregistré.
- Les valeurs textuelles et les problèmes d'encodage présents dans la source sont conservés à l'identique.
- Les 13 versions de types de contrat sont au statut `draft`, tandis que les 118 versions de clauses sont au statut `published` dans la base exportée.
- Les propositions humanisées restent documentaires : aucune n'est publiée ni appliquée automatiquement.

## Données volontairement non exportées

La base SQLite n'est pas publiée. Les prospects, clients, contacts, coordonnées, devis réels, contrats de dossiers, réglages personnels, documents, secrets et chemins locaux sont exclus. Les fichiers PDF, Excel, exécutables, archives et sorties de campagnes restent également hors du dépôt.

La source locale utilisée pour l'export est identifiée uniquement par son empreinte dans le manifeste. Aucun fichier privé séparé supplémentaire n'est nécessaire pour exploiter le référentiel commercial exporté ; seules les données personnelles et opérationnelles ci-dessus restent locales.

# AtoumWeb Page Package V2

Date : 29/09/2026  
Statut : contrat Manager proposé pour le Lot 8A ; support Bridge à compléter.

## Objectif

Versionner l'enveloppe du package multi-composants lorsqu'une composition est préparée pour une Page précise.

Les contrats embarqués Component Package, Fields et Identity restent en V1. Le package projet générique V1 reste lisible et inchangé.

## Identité

```json
{
  "contract": "atoumweb_bridge_project_package",
  "schemaVersion": 2,
  "scope": "page",
  "exportId": "awexp:opaque-id",
  "destination": {
    "projectId": "project-id",
    "siteId": "site-id",
    "pageId": "project-page-node-id"
  }
}
```

`exportId` identifie un export immuable. Bridge doit mémoriser le premier contenu accepté pour cet identifiant : une répétition strictement identique est idempotente, tandis qu'un contenu différent avec le même identifiant doit être refusé.

La destination est descriptive et obligatoire. Bridge vérifie sa cohérence avant de créer ou retrouver le Workbench ; elle n'autorise aucune publication directe.

## Composants

Chaque entrée conserve son `compositionItemId`, son ordre et la version Bibliothèque source exacte. Quand la Page comporte une adaptation locale enregistrée, les fichiers HTML/CSS/JS transportent cette préparation, avec des checksums recalculés. La provenance source reste inchangée.

Bridge crée un `siteOccurrenceId` distinct pour chaque `compositionItemId`, puis retourne leur association dans son accusé d'import. Aucun second identifiant d'occurrence Manager n'est ajouté.

## Sécurité

Les invariants restent :

- `flow = workbench_first` ;
- `workbenchRequired = true` ;
- `directProductionInjection = false` ;
- `sourceLibraryMutation = false`.

## État d'implémentation

Manager produit et historise cette enveloppe. L'import idempotent, l'accusé d'association et le marqueur stable dans Divi doivent être implémentés et validés dans le dépôt Bridge avant de considérer le trajet 8A complet.


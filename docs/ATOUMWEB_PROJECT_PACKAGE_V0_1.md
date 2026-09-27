# AtoumWeb Project Package — convention 0.1

Date : 27/09/2026  
Statut : **convention interne évolutive, non gelée**.

## Objectif

Transporter une composition ordonnée de plusieurs composants de la Bibliothèque Manager vers **un seul Workbench Bridge**, sans modifier les Component Package / Fields / Identity Contracts V1 existants.

```text
Composition Manager
  Header
  Hero
  Section
  Footer
        ↓
Project Package ZIP
        ↓
Bridge
        ↓
1 Workbench Divi isolé
  1 module Code par composant
        ↓
1 Site Occurrence V1 distincte par composant
```

## Règles

- Workbench-first obligatoire.
- Aucune injection directe en production.
- Aucune mutation des composants sources de Bibliothèque.
- L’ordre de la composition est explicite et conservé.
- Chaque composant transporte sa version exacte et ses contrats V1 existants.
- Bridge crée une identité `siteOccurrenceId` distincte pour chaque utilisation.
- Le package projet n’introduit pas de Component Package V2 : il orchestre plusieurs Component Package V1.
- Publication production et rollback restent hors de ce lot.

## Manifest racine

```json
{
  "contract": "atoumweb_bridge_project_package",
  "schemaVersion": 1,
  "exportedAt": "2026-09-27T14:00:00.000Z",
  "safety": {
    "flow": "workbench_first",
    "workbenchRequired": true,
    "directProductionInjection": false,
    "sourceLibraryMutation": false
  },
  "composition": {
    "id": "awcomp:...",
    "name": "Site Fleuriste Dupont",
    "targetVertical": "fleuriste",
    "notes": null
  },
  "components": []
}
```

Chaque entrée `components[]` conserve :

- `compositionItemId` et `sortOrder` ;
- nom/catégorie/métier ;
- `libraryItemId`, `libraryVersionId`, `libraryVersionNumber` ;
- famille / componentKey / variante lorsqu’elles existent ;
- descripteurs SHA-256 vers HTML, CSS, JS, fields, identity, dépendances, assets source et provenance.

Les fichiers sont rangés sous :

```text
components/001/...
components/002/...
components/003/...
```

## Bridge

Bridge 0.8.0 accepte ce package dans le même écran d’import que les composants unitaires.

Il crée un seul brouillon :

```text
AWB Workbench — Projet — <nom>
```

Chaque composant devient un module Code distinct, dans l’ordre Manager.

Bridge mémorise séparément :

- la composition ;
- les composants sources ;
- leurs versions ;
- leurs identités Famille / Variante ;
- une Site Occurrence V1 par composant.

Le configurateur multi-composants et les retours individuels vers Manager seront traités par le lot de provenance suivant.

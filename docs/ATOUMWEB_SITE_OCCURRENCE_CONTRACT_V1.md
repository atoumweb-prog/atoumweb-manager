# AtoumWeb Site Occurrence & Return Contract V1

Date : 25/09/2026
Statut : **contrat canonique V1 proposé côté Manager pour alignement Bridge**
Indépendant du Snapshot Schema V1.

## 1. Objectif

Définir comment AtoumWeb Bridge :

1. matérialise une occurrence d’un composant dans un Workbench ;
2. conserve sa provenance Manager ;
3. suit ses personnalisations et modifications ;
4. peut restituer cette occurrence au Manager sans décider lui-même de son avenir dans la Bibliothèque.

Principe :

~~~text
Originale immuable
→ Famille / Variante
→ Occurrence site
→ modification réelle dans un Workbench
→ retour éventuel au Manager
→ décision utilisateur
~~~

## 2. Création du siteOccurrenceId

Le siteOccurrenceId est créé par Bridge. Il ne vient jamais du package Manager.

C’est un identifiant opaque, stable et unique de l’occurrence installée dans un Workbench/site.

Exemple :

~~~text
awocc:01J...
~~~

Une nouvelle utilisation du même composant sur le même site crée une nouvelle occurrence.

## 3. Site Occurrence V1

Contrat :

~~~json
{
  "contract": "atoumweb_site_occurrence",
  "schemaVersion": 1
}
~~~

Schéma JSON :

docs/ATOUMWEB_SITE_OCCURRENCE_V1.schema.json

Structure :

~~~json
{
  "contract": "atoumweb_site_occurrence",
  "schemaVersion": 1,
  "siteOccurrenceId": "awocc:example",
  "createdBy": "bridge",
  "source": {},
  "target": {},
  "state": "modified",
  "configuration": {},
  "changes": {},
  "createdAt": "2026-09-25T09:00:00.000Z",
  "updatedAt": "2026-09-25T10:00:00.000Z"
}
~~~

## 4. Source Manager à conserver

Bridge doit conserver la source exacte qui a créé l’occurrence :

~~~json
{
  "source": {
    "componentPackageContractVersion": 1,
    "fieldsContractVersion": 1,
    "identityContractVersion": 1,
    "libraryItemId": "item-123",
    "libraryVersionId": "version-4",
    "libraryVersionNumber": 4,
    "componentFamilyId": "awcf:feature-bubbles",
    "componentKey": "aw-feature-bubbles",
    "libraryVariantId": "awv:florist",
    "variantKey": "florist",
    "sourcePackageFingerprint": null,
    "sourceHtmlSha256": null,
    "sourceCssSha256": null,
    "sourceJavascriptSha256": null
  }
}
~~~

Pour un composant historique non classifié, les identités de famille/variante restent nulles. Bridge ne doit pas les inventer.

## 5. Cible Workbench

~~~json
{
  "target": {
    "siteUrl": "https://fleuriste.example.test/",
    "siteKey": "fleuriste-dupont",
    "workbenchId": "awb-workbench:123",
    "workbenchPostId": "456",
    "bridgeVersion": "0.6.x"
  }
}
~~~

workbenchId est obligatoire. Les autres informations peuvent être nulles si Bridge ne les possède pas encore.

## 6. États V1

~~~text
created
configured
workbench_created
modified
analyzed
ready_for_review
validated
published
archived
~~~

Ces états décrivent l’occurrence, pas une décision de Bibliothèque.

ready_for_review signifie que Bridge peut restituer une occurrence analysée au Manager. Cela ne signifie jamais create_variant.

## 7. Configuration appliquée

Bridge conserve les valeurs effectivement appliquées dans le Workbench :

~~~json
{
  "configuration": {
    "fieldValues": {
      "title": "Nos créations florales",
      "intro": "Des bouquets pour toutes vos occasions"
    },
    "cssVariables": {
      "--aw-primary": "#315a45",
      "--aw-accent": "#e8c9a8"
    },
    "assetSelections": {
      "hero-image": "asset:bouquet-1"
    }
  }
}
~~~

Les valeurs de champs restent des primitives V1 : string, number, boolean ou null.

## 8. Résumé factuel des différences

Bridge fournit un résumé des changements par rapport au composant importé :

~~~json
{
  "changes": {
    "changedFieldIds": ["title", "intro"],
    "changedCssVariables": ["--aw-primary"],
    "changedAssetIds": ["hero-image"],
    "htmlChanged": true,
    "cssChanged": true,
    "javascriptChanged": false,
    "structuralChange": false
  }
}
~~~

structuralChange = false signifie que l’adaptation reste globalement dans la structure source.

structuralChange = true signale une divergence structurelle importante, par exemple nœuds majeurs ajoutés/supprimés, structure Divi profondément modifiée ou comportement JavaScript significativement transformé.

Bridge ne doit jamais traduire automatiquement structuralChange = true en nouvelle famille. Il signale uniquement le fait.

## 9. Retour Bridge → Manager

Contrat :

~~~json
{
  "contract": "atoumweb_bridge_occurrence_return",
  "schemaVersion": 1,
  "occurrenceContractVersion": 1,
  "sourceComponentPackageContractVersion": 1,
  "actionPolicy": "manager_decides"
}
~~~

Schéma JSON :

docs/ATOUMWEB_OCCURRENCE_RETURN_V1.schema.json

actionPolicy = manager_decides est obligatoire.

Bridge ne décide jamais : créer une variante, mettre à jour une variante, créer une famille ou ignorer le retour.

## 10. Package de retour V1

Organisation recommandée :

~~~text
manifest.json
occurrence/
├─ occurrence.json
├─ component.html
├─ component.css
├─ component.js
├─ assets.json
└─ provenance.json
~~~

component.css et component.js peuvent être absents si vides. Chaque fichier déclaré possède un SHA-256.

Exemple de manifest :

~~~json
{
  "contract": "atoumweb_bridge_occurrence_return",
  "schemaVersion": 1,
  "occurrenceContractVersion": 1,
  "sourceComponentPackageContractVersion": 1,
  "returnedAt": "2026-09-25T10:15:00.000Z",
  "actionPolicy": "manager_decides",
  "siteOccurrenceId": "awocc:example",
  "files": {
    "occurrence": {
      "path": "occurrence/occurrence.json",
      "sha256": "..."
    },
    "html": {
      "path": "occurrence/component.html",
      "sha256": "..."
    },
    "css": {
      "path": "occurrence/component.css",
      "sha256": "..."
    },
    "javascript": null,
    "assets": {
      "path": "occurrence/assets.json",
      "sha256": "..."
    },
    "provenance": {
      "path": "occurrence/provenance.json",
      "sha256": "..."
    }
  },
  "changes": {
    "changedFieldIds": ["title"],
    "changedCssVariables": ["--aw-primary"],
    "changedAssetIds": ["hero-image"],
    "htmlChanged": true,
    "cssChanged": true,
    "javascriptChanged": false,
    "structuralChange": false
  }
}
~~~

## 11. Décision dans Manager

Le futur écran Manager reconnaît l’occurrence et affiche sa provenance et ses changements.

Il demande ensuite :

~~~text
Que voulez-vous faire ?

○ Conserver uniquement cette occurrence
○ Créer une nouvelle variante
○ Mettre à jour une variante existante
○ Détacher / créer une nouvelle famille
~~~

Aucune option n’est choisie automatiquement.

## 12. Cas Fleuriste

Départ :

~~~text
aw-feature-bubbles
└── base générique
~~~

Utilisation :

~~~text
Manager
→ package
→ Bridge
→ siteOccurrenceId = awocc:florist-01
→ Workbench Fleuriste Dupont
~~~

Après personnalisation et retour :

~~~text
awocc:florist-01
→ Manager
→ décision utilisateur : Créer une variante
→ variantKey = florist
→ vertical = fleuriste
~~~

L’occurrence du site reste liée à son propre siteOccurrenceId.

## 13. Mise à jour d’une variante

Si une future occurrence provient déjà de la variante florist, Manager pourra proposer Mettre à jour la variante Fleuriste.

Cette action doit créer une nouvelle version de variante. La version précédente reste dans l’historique.

## 14. Fork / nouvelle famille

Si Bridge signale structuralChange = true, Manager pourra mettre davantage en évidence l’option Détacher / créer une nouvelle famille.

Cela reste une proposition d’interface. La décision est humaine.

## 15. Assets

assets.json doit permettre au Manager de distinguer :

- assets hérités du package source ;
- assets remplacés ;
- nouveaux assets introduits sur le site ;
- assets distants encore non localisés.

La politique de coffre local définie dans BRIDGE_SNAPSHOT_ASSET_STORAGE.md reste applicable.

## 16. Provenance

provenance.json doit permettre de reconstruire :

~~~text
Snapshot / site source
→ Bibliothèque Manager
→ famille / variante
→ package Manager
→ Bridge
→ Workbench
→ siteOccurrenceId
→ modifications
→ retour Manager
~~~

Les identifiants Manager d’origine ne doivent jamais être perdus.

## 17. Hors périmètre V1

V1 ne définit pas encore :

- panier multi-composants ;
- page complète assemblée ;
- déploiement production ;
- rollback production ;
- fusion automatique occurrence → variante ;
- algorithme exact de divergence structurelle ;
- stockage SQL final des occurrences dans Manager.

Ces sujets viennent après stabilisation du trajet mono-composant.

## 18. Décision V1

~~~text
Manager package
     ↓
Bridge
     ↓
Site Occurrence V1
     ↓
Workbench
     ↓
modifications
     ↓
Occurrence Return V1
     ↓
Manager
     ↓
décision utilisateur
~~~

Bridge produit les faits.

Manager propose les choix.

L’utilisateur décide.

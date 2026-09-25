# AtoumWeb Component Identity Contract V1

Date : 25/09/2026  
Statut : **contrat canonique V1 proposé et implémenté côté Manager**  
Indépendant du Snapshot Schema V1.

## 1. Objectif

Distinguer trois niveaux qui ne doivent jamais être confondus :

```text
Component Family
      ↓
Library Variant
      ↓
Site Occurrence
```

Exemple :

```text
aw-feature-bubbles
      ↓
Variante Fleuriste
      ↓
Occurrence sur le site Fleuriste Dupont
```

Le nom visible dans la Bibliothèque reste une donnée éditoriale.  
La clé technique du composant est indépendante du métier et du nom affiché.

## 2. Identifiants canoniques

### Component Family

`componentFamilyId`

Identifiant opaque, stable et immuable de la famille dans le Manager.

Exemple :

```text
awcf:8b4d...
```

Il ne doit pas être construit à partir du nom affiché.

`componentKey`

Clé technique lisible et stable de la famille.

Format V1 :

```text
aw-feature-bubbles
aw-split-hero
aw-testimonial-slider
```

Règle :

```regex
^aw-[a-z0-9]+(?:-[a-z0-9]+)*$
```

Bridge travaille avec cette clé technique lorsqu’elle est classifiée.

### Library Variant

`libraryVariantId`

Identifiant opaque et immuable de la variante dans la Bibliothèque.

`variantKey`

Clé courte unique dans la famille.

Exemples :

```text
wedding
automotive
florist
pastry
dark
compact
```

`variantOf`

Référence à la famille technique. En V1, la valeur recommandée est `componentKey`.

`variantMode`

Valeurs :

```text
base
inherit
forked
none
```

- `base` : composant de référence de la famille ;
- `inherit` : variante qui conserve la structure de base et stocke surtout ses différences ;
- `forked` : variante détachée devenue structurellement indépendante ;
- `none` : composant historique ou non classifié sans logique de variante.

### Site Occurrence

`siteOccurrenceId`

Cet identifiant **n’appartient pas au package Bibliothèque source**.

Il est créé par Bridge lorsqu’un composant est instancié dans un Workbench ou sur un site.

L’occurrence doit conserver au minimum la provenance suivante :

```text
componentFamilyId / componentKey
libraryVariantId / variantKey éventuels
libraryItemId
libraryVersionId
libraryVersionNumber
package/version
workbench
site cible
```

La personnalisation de l’occurrence ne modifie jamais automatiquement la famille ni la variante source.

## 3. Nom visible et identité technique

Exemple :

```text
libraryDisplayName:
"Section bulles — Fleuriste"

componentKey:
"aw-feature-bubbles"

variantKey:
"florist"
```

HTML recommandé :

```html
<section
  class="aw-feature-bubbles"
  data-aw-component="feature-bubbles">
```

La classe sert au style.

`data-aw-component` donne une identité technique explicite dans le markup.

Important :

> Le Manager ne doit pas renommer automatiquement les classes existantes d’un composant historique pour fabriquer une famille générique.

Le changement de classe peut casser le CSS, le JavaScript ou les sélecteurs.

La classification d’un ancien composant doit donc être une opération explicite.

## 4. Classification de réutilisabilité

`reusabilityScope`

Valeurs V1 :

```text
generic
vertical
site_specific
unclassified
```

Correspondance métier :

- `generic` = générique ;
- `vertical` = spécifique à un métier ;
- `site_specific` = spécifique à un site ;
- `unclassified` = ancien composant ou composant pas encore qualifié.

`classificationStatus`

Valeurs :

```text
classified
unclassified
```

Un composant n’est `classified` que si un `componentKey` valide existe et que sa réutilisabilité a été explicitement définie.

Le Manager ne doit pas déduire automatiquement qu’un composant `atoum-mariage-why` est la famille `aw-feature-bubbles`.

## 5. Vertical / métier

`vertical`

Slug métier libre et extensible.

Exemples :

```text
mariage
automobile
fleuriste
patisserie
restaurant
artisan
coach
immobilier
```

La liste n’est pas fermée dans le contrat.

Elle pourra être gérée plus tard par un référentiel du Manager.

La recherche Bibliothèque devra pouvoir filtrer sur ce champ.

## 6. Tags

`tags` reste complémentaire de `vertical`.

Exemple :

```json
{
  "vertical": "fleuriste",
  "tags": [
    "services",
    "présentation",
    "bulles"
  ]
}
```

Le métier ne doit pas être encodé uniquement dans les tags.

## 7. Structure canonique identity.json

```json
{
  "contract": "atoumweb_component_identity",
  "schemaVersion": 1,
  "classificationStatus": "classified",
  "libraryDisplayName": "Section bulles — Fleuriste",
  "componentFamilyId": "awcf:1234",
  "componentKey": "aw-feature-bubbles",
  "libraryVariantId": "awv:5678",
  "variantKey": "florist",
  "variantOf": "aw-feature-bubbles",
  "variantMode": "inherit",
  "vertical": "fleuriste",
  "reusabilityScope": "vertical",
  "tags": [
    "fleuriste",
    "services",
    "présentation"
  ],
  "libraryItemId": "manager-item-id",
  "libraryVersionId": "manager-version-id",
  "libraryVersionNumber": 4
}
```

Schéma JSON :

`docs/ATOUMWEB_COMPONENT_IDENTITY_V1.schema.json`

## 8. Héritage d’une variante

Une variante `inherit` doit idéalement conserver seulement ce qui diffère de la famille :

```text
base component
+
field values
+
CSS variables
+
assets de variante
+
overrides CSS éventuels
+
provenance
```

Le format exact des deltas de variantes sera versionné séparément lorsqu’il sera implémenté.

V1 fixe déjà l’identité et la relation d’héritage pour éviter une refonte future.

## 9. Fork / détachement

Une variante peut être détachée lorsqu’elle devient structurellement trop différente.

Le résultat devient :

- soit une nouvelle `Component Family` ;
- soit une variante `forked` pendant une étape transitoire.

Un fork doit recevoir une nouvelle identité technique.

Il ne doit jamais réécrire rétroactivement la famille source.

## 10. Package Manager → Bridge

Le package Réutilisable transporte maintenant :

```text
manifest.json
component/
├─ component.html
├─ component.css
├─ component.js
├─ fields.json
├─ identity.json
├─ dependencies.json
├─ source-assets.json
└─ provenance.json
```

Le manifest annonce :

```json
{
  "componentPackageContractVersion": 1,
  "fieldsContractVersion": 1,
  "identityContractVersion": 1
}
```

Bridge doit utiliser `componentKey` comme identité technique quand elle est classifiée.

Bridge ne doit jamais utiliser `libraryDisplayName` comme clé technique.

## 11. Composants historiques

Pour les composants actuels qui ne possèdent pas encore d’identité de famille :

```json
{
  "classificationStatus": "unclassified",
  "componentFamilyId": null,
  "componentKey": null,
  "libraryVariantId": null,
  "variantKey": null,
  "variantOf": null,
  "variantMode": "none",
  "vertical": null,
  "reusabilityScope": "unclassified"
}
```

C’est volontaire.

Le Manager préfère une absence explicite d’identité à une classification incorrecte.

Ils pourront être classifiés progressivement sans recréer leurs versions historiques.

## 12. Responsabilités

### Manager

Le Manager est responsable de :

- l’identité de famille ;
- la clé technique ;
- les variantes de Bibliothèque ;
- leur métier ;
- leur réutilisabilité ;
- leur héritage ou fork ;
- la recherche et le classement ;
- la version et la provenance du package.

### Bridge

Bridge est responsable de :

- la création de l’occurrence site ;
- le Workbench ;
- l’application des champs et variantes ;
- la conservation de la provenance ;
- la transformation WordPress/Divi ;
- le contrôle avant publication ;
- la publication et le rollback lorsque ces fonctions seront ouvertes.

## 13. Décision V1

La hiérarchie canonique est :

```text
Component Family
  componentFamilyId
  componentKey
       ↓
Library Variant
  libraryVariantId
  variantKey
  vertical
  variantMode
       ↓
Site Occurrence
  siteOccurrenceId (Bridge)
```

Le nom affiché reste indépendant :

```text
libraryDisplayName != componentKey
```

Cette séparation est obligatoire pour éviter de lier l’identité technique du composant à son usage métier actuel.

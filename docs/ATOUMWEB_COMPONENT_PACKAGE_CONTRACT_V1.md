# AtoumWeb Component Package Contract V1 — champs configurables

Date : 25/09/2026  
Statut : **contrat canonique V1 proposé et implémenté côté Manager**  
Indépendant du Snapshot Schema V1.

## 1. Objectif

Permettre à AtoumWeb Manager de déclarer les champs configurables d’un composant afin qu’AtoumWeb Bridge puisse construire une interface générique de personnalisation dans un Workbench Divi.

Flux cible :

```text
Bibliothèque Manager
       ↓
Component Package
       ↓
Bridge
       ↓
Interface générique
       ↓
Workbench Divi
       ↓
adaptation / Visual Builder
       ↓
validation
       ↓
HTML → Divi
CSS/JS → Divi Child
```

Le package n’autorise jamais une injection directe en production.

## 2. Versionnement

Le Snapshot Schema V1 reste gelé.

Le package et les champs disposent de leurs propres versions :

```json
{
  "componentPackageContractVersion": 1,
  "fieldsContractVersion": 1
}
```

Le fichier canonique des champs utilise :

```json
{
  "contract": "atoumweb_component_fields",
  "schemaVersion": 1,
  "fields": []
}
```

Schéma de validation :

`docs/ATOUMWEB_COMPONENT_FIELDS_V1.schema.json`

## 3. Types de champs V1

Types standardisés :

```text
text
textarea
rich_text
url
image
color
number
select
toggle
icon
```

Le type décrit l’interface que Bridge peut proposer.

Le `binding` décrit la manière d’appliquer la valeur.

## 4. Structure canonique d’un champ

```json
{
  "id": "title",
  "type": "text",
  "label": "Titre principal",
  "description": "Titre visible du composant",
  "group": "Contenu",
  "default": "Votre titre",
  "required": true,
  "binding": {
    "type": "html_text",
    "selector": "[data-aw-field-text=\"title\"]"
  },
  "validation": {
    "maxLength": 90
  },
  "options": null,
  "source": {
    "mode": "declared"
  }
}
```

Champs obligatoires V1 :

- `id`
- `type`
- `label`
- `default`
- `required`
- `binding`
- `source`

Champs facultatifs :

- `description`
- `group`
- `validation`
- `options`

## 5. Bindings V1

### Texte HTML

```json
{
  "type": "html_text",
  "selector": "[data-aw-field-text=\"title\"]"
}
```

Bridge remplace le contenu texte de l’élément ciblé.

### HTML riche

```json
{
  "type": "html_html",
  "selector": "[data-aw-field-rich=\"intro\"]"
}
```

Réservé à un champ `rich_text`. Bridge applique un HTML contrôlé dans l’élément ciblé.

### Attribut HTML

Exemple URL :

```json
{
  "type": "html_attribute",
  "selector": "[data-aw-field-link=\"cta-link\"]",
  "attribute": "href"
}
```

Exemple image :

```json
{
  "type": "html_attribute",
  "selector": "[data-aw-field-image=\"hero-image\"]",
  "attribute": "src"
}
```

### Variable CSS

Binding recommandé pour les couleurs, nombres de design, espacements ou autres valeurs thématiques :

```json
{
  "type": "css_variable",
  "name": "--aw-primary",
  "selector": ".atoum-component"
}
```

Le sélecteur peut être `null` si la variable est portée par la racine connue du composant.

Les couleurs ne doivent pas être généralisées par recherche/remplacement arbitraire de valeurs hexadécimales.

### URL CSS détectée

```json
{
  "type": "css_url",
  "token": "image-3"
}
```

Ce binding existe principalement pour la compatibilité avec des composants historiques dont une image de fond a été détectée avant la standardisation des variables CSS.

Un champ `css_url` détecté automatiquement doit normalement être revu avant modification automatique par Bridge.

### Binding non résolu

```json
{
  "type": "unresolved",
  "reason": "Plusieurs cibles correspondent au champ détecté."
}
```

Bridge peut afficher le champ à titre informatif mais ne doit pas l’appliquer automatiquement.

## 6. Source et détection automatique

Chaque champ précise son origine :

### Champ déclaré

```json
{
  "source": {
    "mode": "declared"
  }
}
```

Le Manager considère le binding comme intentionnel.

### Champ détecté automatiquement

```json
{
  "source": {
    "mode": "auto_detected",
    "confidence": "medium",
    "ambiguous": true,
    "note": "Deux cibles possibles ont été détectées."
  }
}
```

Règle :

> Un champ `auto_detected` marqué `ambiguous: true` ne doit jamais être modifié automatiquement par Bridge sans validation explicite.

Les valeurs possibles de confiance sont :

```text
high
medium
low
```

## 7. Validation

Le contrat V1 permet :

```json
{
  "minLength": 3,
  "maxLength": 90,
  "min": 0,
  "max": 100,
  "step": 1,
  "pattern": "^[A-Za-z].+$",
  "allowedMimeTypes": [
    "image/jpeg",
    "image/png",
    "image/webp"
  ]
}
```

Bridge décide de l’UI appropriée mais doit respecter ces contraintes avant application.

## 8. Options

Pour un champ `select` :

```json
{
  "options": [
    { "value": "light", "label": "Clair" },
    { "value": "dark", "label": "Sombre" }
  ]
}
```

## 9. Groupes

`group` est une indication d’interface.

Exemples recommandés :

```text
Contenu
Contenu · Titres
Liens
Images
Couleurs
Mise en page
Options
```

Bridge peut regrouper automatiquement les champs par cette valeur.

Il ne doit pas dépendre d’une liste fermée de groupes.

## 10. Exemple complet

HTML :

```html
<section class="atoum-component">
  <h2 data-aw-field-text="title">Votre titre</h2>
  <p data-aw-field-text="description">Votre présentation.</p>
  <a href="/contact/" data-aw-field-link="cta-link">Nous contacter</a>
</section>
```

CSS :

```css
.atoum-component {
  --aw-primary: #071b3a;
  --aw-accent: #f4c542;
  --aw-background: #ffffff;

  color: var(--aw-primary);
  background: var(--aw-background);
}

.atoum-component a {
  background: var(--aw-accent);
}
```

`fields.json` :

```json
{
  "contract": "atoumweb_component_fields",
  "schemaVersion": 1,
  "fields": [
    {
      "id": "title",
      "type": "text",
      "label": "Titre principal",
      "group": "Contenu · Titres",
      "default": "Votre titre",
      "required": true,
      "binding": {
        "type": "html_text",
        "selector": "[data-aw-field-text=\"title\"]"
      },
      "source": { "mode": "declared" }
    },
    {
      "id": "cta-link",
      "type": "url",
      "label": "Lien du bouton",
      "group": "Liens",
      "default": "/contact/",
      "required": false,
      "binding": {
        "type": "html_attribute",
        "selector": "[data-aw-field-link=\"cta-link\"]",
        "attribute": "href"
      },
      "source": { "mode": "declared" }
    },
    {
      "id": "primary-color",
      "type": "color",
      "label": "Couleur principale",
      "group": "Couleurs",
      "default": "#071b3a",
      "required": true,
      "binding": {
        "type": "css_variable",
        "name": "--aw-primary",
        "selector": ".atoum-component"
      },
      "source": { "mode": "declared" }
    }
  ]
}
```

## 11. Compatibilité avec les composants actuels du Manager

Les composants actuels utilisent historiquement une structure plus simple :

```json
{
  "id": "text-1",
  "type": "text",
  "label": "Titre principal",
  "selector": "[data-aw-field-text=\"text-1\"]",
  "originalValue": "Titre source",
  "defaultValue": "Votre titre"
}
```

Le Manager conserve la compatibilité.

Lors de l’export du package Bridge, cette structure est convertie en V1 canonique :

- ancien `text` → `text` + binding `html_text`
- ancien `link` → `url` + binding `html_attribute/href`
- ancien `image` HTML → `image` + binding `html_attribute/src`
- ancienne image CSS → `image` + binding `css_url` + détection automatique

Les composants existants n’ont donc pas besoin d’être recréés pour tester Bridge.

## 12. Responsabilités Manager / Bridge

### Manager

- définit ou détecte les champs ;
- conserve la définition versionnée ;
- exporte `fields.json` ;
- conserve HTML/CSS/JS brut ;
- conserve provenance et version Bibliothèque ;
- signale les champs automatiques/ambigus.

### Bridge

- valide le contrat reçu ;
- construit l’interface générique ;
- applique les valeurs via les bindings ;
- refuse l’application automatique d’un binding ambigu ;
- applique les changements dans un Workbench ;
- conserve la provenance Manager ;
- laisse disponible l’édition avancée Divi / HTML / CSS / JS ;
- ne publie pas directement en production.

## 13. Occurrence installée

L’occurrence créée dans un Workbench est distincte du composant Bibliothèque.

La personnalisation d’une occurrence :

- ne modifie pas le composant source ;
- ne modifie pas sa version ;
- conserve un lien de provenance ;
- peut ensuite évoluer indépendamment sur le site cible.

## 14. Décision V1

Le contrat canonique retenu est :

```text
Component Package Contract V1
└── Fields Contract V1
    ├── type
    ├── label
    ├── group
    ├── default
    ├── required
    ├── binding
    ├── validation
    ├── options
    └── source
```

Les nouveaux types ou bindings devront être ajoutés dans une version ultérieure du contrat sans modifier rétroactivement V1.

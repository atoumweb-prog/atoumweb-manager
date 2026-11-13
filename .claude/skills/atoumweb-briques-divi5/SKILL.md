---
name: "atoumweb-briques-divi5"
description: "Use when working on AtoumWeb Manager's Bibliothèque, Sites, compositions, packages or the Bridge: block archiving, reuse, HTML/CSS/JS separation and Divi 5 transfer."
---

# Briques AtoumWeb → Divi 5

Cette skill décrit le format et les règles de la partie « briques » d'AtoumWeb Manager : archivage des sites, bibliothèque de composants, réutilisation, composition de pages et transfert vers WordPress/Divi 5 via AtoumWeb Bridge.

**Cible : Divi 5 uniquement** pour toute nouvelle production. Les sources Divi 4 historiques (snapshots, originales) restent lisibles en lecture seule ; ne supprime pas leur lecture sans décision explicite de l'utilisateur.

## 0. Sources de vérité (à lire avant de coder)

Les contrats du dépôt priment sur cette skill. En cas d'écart, suis le dépôt et signale l'écart.

- `docs/BRIDGE_WORKBENCH_MANAGER_INTEGRATION.md` — architecture et responsabilités
- `docs/ATOUMWEB_COMPONENT_PACKAGE_CONTRACT_V1.md` + `ATOUMWEB_COMPONENT_FIELDS_V1.schema.json`
- `docs/ATOUMWEB_COMPONENT_IDENTITY_CONTRACT_V1.md` + `ATOUMWEB_COMPONENT_IDENTITY_V1.schema.json`
- `docs/ATOUMWEB_SITE_OCCURRENCE_CONTRACT_V1.md` + schémas occurrence et retour
- `docs/ATOUMWEB_PAGE_PACKAGE_V2.schema.json` — package de page / composition
- `docs/BRIDGE_SNAPSHOT_ASSET_STORAGE.md` — coffre d'assets
- Code : `src/main/bridge/`, `src/main/referentials/` (TechnicalLibrary, Composition, Package, ReusePreparation, OccurrenceReturn), `src/shared/bridgeSnapshots.ts`, `src/shared/bridgeReusableValidation.ts`

Règles générales du projet : `AGENTS.md` (jamais sur `main`, branche dédiée, rien de fusionné, publié ou activé sans accord explicite).

## 1. Partage des rôles — à ne jamais brouiller

**Bridge (plugin WordPress) est le seul point d'entrée WordPress/Divi.** Il crée les Workbenches, clone les pages, analyse et détecte les composants, sépare HTML/CSS/JS, écrit dans Divi et dans Divi Child, contrôle le front, fait les snapshots avant/après et le rollback, et crée les occurrences site.

**Le Manager ne devient pas un éditeur Divi et n'écrit jamais dans WordPress.** Il conserve l'historique, affiche et compare, versionne, gère la provenance, capitalise les composants, prépare et exporte les packages, et suit les Workbenches.

Interdits côté Manager (sauf décision explicite) :
- écrire dans WordPress ou créer une API WordPress parallèle à Bridge ;
- simuler un éditeur Divi ;
- dupliquer la logique de séparation HTML/CSS/JS de Bridge ;
- ouvrir une publication directe vers la production ;
- modifier le contrat Snapshot V1, qui est gelé.

## 2. Cycle de vie d'une brique

```
Site réel → Snapshot Bridge → Originale (immuable) → Travail → Famille générique
→ Variante → package → Bridge → Workbench Divi → Occurrence site → retour éventuel
```

- **L'Originale ne se modifie jamais.** Toute transformation crée une nouvelle couche.
- Originale ≠ Travail ≠ Famille ≠ Variante ≠ Occurrence : ce sont des entités distinctes.
- **Une occurrence site est créée par Bridge** (`siteOccurrenceId`) ; le Manager ne la fabrique pas.
- Personnaliser une occurrence ne remonte **jamais** automatiquement vers la Bibliothèque. Au retour, l'utilisateur choisit : garder l'occurrence seule, créer une variante, mettre à jour une variante, ou détacher une nouvelle famille.
- Un composant de Bibliothèque passe **toujours** par un Workbench : `workbenchRequired: true`, `directProductionInjection: false`.
- Une composition (panier de composants pour une page ou un site) ne modifie jamais les sources de Bibliothèque ; chaque utilisation crée une occurrence indépendante.

## 3. Identité d'un composant

- `componentKey` (famille) : `^aw-[a-z0-9]+(?:-[a-z0-9]+)*$`, par ex. `aw-feature-bubbles`.
- Markup racine : `class="aw-feature-bubbles"` + `data-aw-component="feature-bubbles"`.
- `libraryDisplayName` est éditorial : jamais une clé technique.
- `variantMode` : `base`, `inherit`, `forked`, `none`.
- `reusabilityScope` : `generic`, `vertical`, `site_specific`, `unclassified`. Le métier va dans `vertical`, pas dans les tags.
- **Composants historiques** : restent `unclassified` tant que l'utilisateur n'a pas défini leur famille. Ne renomme jamais automatiquement une classe historique (ex. `atoum-mariage-why`) pour en faire une famille générique supposée.

## 4. Séparation HTML / CSS / JS

Pendant la conception, un bloc mélangé (HTML + `<style>` + `<script>`) est toléré dans Divi. La séparation propre se fait après validation, côté Bridge :

```
HTML              → Divi (contenu du module)
CSS               → Divi Child : assets/atoumweb/css/{components|pages|global}/<nom>.css
JS                → Divi Child : assets/atoumweb/js/{components|pages|global}/<nom>.js
JSON / provenance → Bridge + Manager
```

Le nom de fichier suit la classe racine du composant. Règles d'écriture d'une brique propre :
- CSS **scopé sous la classe racine** (`.aw-xxx …`), aucun sélecteur global nu (`h2 {}`, `body {}`) dans un composant ;
- valeurs thématiques (couleurs, espacements, tailles) en **variables CSS** `--aw-*` déclarées sur la racine ;
- JS encapsulé, qui cible la racine du composant, supporte plusieurs instances sur la même page et ne pollue pas l'espace global ;
- pas de styles inline pour ce qui doit rester personnalisable.

## 5. Package composant (export Manager → Bridge)

```
manifest.json             # contrat Bibliothèque + section bridgeWorkbench
technical/source.json     # conservation complète côté Manager
component/
  component.html
  component.css           # si présent
  component.js            # si présent
  fields.json
  identity.json
  dependencies.json
  source-assets.json
  provenance.json
```

Versions annoncées : `componentPackageContractVersion: 1`, `fieldsContractVersion: 1`, `identityContractVersion: 1`. Chaque fichier déclaré porte son SHA-256, vérifié à la relecture. Les dépendances (Forminator, WooCommerce…) sont déclarées et transportées ; le Manager ne recrée pas les plugins.

## 6. Champs personnalisables (`fields.json`)

`{ "contract": "atoumweb_component_fields", "schemaVersion": 1, "fields": [] }`

- Types : `text`, `textarea`, `rich_text`, `url`, `image`, `color`, `number`, `select`, `toggle`, `icon`.
- Bindings : `html_text`, `html_html`, `html_attribute`, `css_variable`, `css_url`, `unresolved`.
- Obligatoires : `id`, `type`, `label`, `default`, `required`, `binding`, `source`.
- Marquage HTML des cibles : `data-aw-field-text`, `data-aw-field-rich`, `data-aw-field-link`, `data-aw-field-image`.
- **Couleurs = `css_variable`.** Jamais de recherche/remplacement de valeurs hexadécimales.
- Un champ `auto_detected` avec `ambiguous: true`, ou un binding `unresolved`, ne doit jamais être appliqué automatiquement.

## 7. Format Divi 5 — l'essentiel

Divi 5 stocke les pages dans `post_content` sous forme de commentaires de blocs WordPress, sans shortcodes :

```
<!-- wp:divi/placeholder -->
  <!-- wp:divi/section {JSON} -->
    <!-- wp:divi/row {JSON} -->
      <!-- wp:divi/column {JSON} -->
        <!-- wp:divi/code {JSON} /-->
      <!-- /wp:divi/column -->
    <!-- /wp:divi/row -->
  <!-- /wp:divi/section -->
<!-- /wp:divi/placeholder -->
```

- Conteneurs (section, row, column, placeholder) : balises ouvrante et fermante. Modules feuilles (code, text, button…) : auto-fermants `/-->`.
- JSON d'un bloc : `module` (meta, decoration, advanced), `content` (dont `innerContent`), `builderVersion`.
- Valeurs responsives : `{ "desktop": { "value": … }, "tablet": {…}, "phone": {…} }`.
- Le HTML dans `innerContent` est encodé en échappements unicode (`<`, `>`, `"`).
- Les briques AtoumWeb vivent principalement dans des modules **`divi/code`** ; le Manager extrait leur HTML depuis `<!-- wp:divi/code {…} -->` (voir `extractHtmlFromDiviSource` dans `BridgeSnapshotService.ts`).
- Snapshots : `builder_generation = '5'`, `storage_format = 'divi5_serialized_blocks'`.
- Conserve tels quels les attributs inconnus ; ne change jamais un type de bloc ; ne réordonne pas l'arbre.

Ce format provient de documentation communautaire, pas d'une spécification officielle d'Elegant Themes. Avant de s'appuyer sur un chemin d'attribut, vérifie-le sur un vrai snapshot Divi 5 du dépôt (fixtures de test) ou sur un site de préproduction.

## 8. Avant de terminer une tâche sur les briques

- [ ] L'Originale et les sources de Bibliothèque n'ont pas été modifiées.
- [ ] Aucune écriture WordPress depuis le Manager ; Snapshot V1 intact.
- [ ] Identité conforme (`aw-…`, `data-aw-component`) ; aucun composant historique reclassé automatiquement.
- [ ] CSS scopé sous la racine, valeurs thématiques en `--aw-*`, JS multi-instance.
- [ ] `fields.json` valide au schéma ; aucun champ ambigu appliqué automatiquement.
- [ ] SHA-256 du package cohérents ; versions de contrat annoncées.
- [ ] Typecheck et tests ciblés lancés (commandes et résultats rapportés).
- [ ] Tout écart avec les contrats `docs/` signalé à l'utilisateur, pas corrigé en silence.
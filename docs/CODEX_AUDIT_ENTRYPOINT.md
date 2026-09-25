# CODEX AUDIT ENTRYPOINT — AtoumWeb Manager + Bridge

Date : 25/09/2026  
But : fournir à Codex MSI un point d'entrée unique pour auditer l'écosystème AtoumWeb sans lancer un scan large et coûteux.

## 0. Règles d'exécution — IMPORTANT

Commencer en **lecture seule**.

Ne modifier aucun fichier, ne créer aucun commit, ne lancer aucune migration et ne fusionner aucune branche tant que le rapport d'audit n'a pas été présenté et validé.

Éviter les opérations chronophages ou très larges :

- ne pas scanner `node_modules/` ;
- ne pas scanner `out/`, `dist/`, builds Electron ou APK ;
- ne pas parcourir `.git/` ;
- ne pas analyser les ZIP/snapshots binaires ou les bases SQLite en masse sans besoin ciblé ;
- ne pas lancer de recherche globale récursive non filtrée ;
- ne pas réinstaller les dépendances ;
- ne pas reconstruire l'application ;
- ne pas lancer toute la suite de tests pendant la phase de lecture seule sauf si une anomalie précise l'exige.

Préférer :

1. Git / état de branche ;
2. documents d'architecture listés ci-dessous ;
3. fichiers source explicitement ciblés ;
4. recherche de symboles précise ;
5. tests ciblés seulement si nécessaire.

## 1. Dépôt Manager

Repository GitHub :

`atoumweb-prog/atoumweb-manager`

Branche de travail :

`feature/project-blueprints-v1`

PR de référence :

`#73 — Projet V2 — Blueprints de production et atelier AtoumWeb`

Le HEAD peut évoluer : toujours vérifier le HEAD réel avant toute analyse.

## 2. Dépôt Bridge

Dépôt GitHub :

`atoumweb-prog/atoumweb-bridge`

Branche de travail :

`feature/workbench-occurrence-v1`

HEAD Bridge raccordé :

`844d702c1fabab9fcd2a61c6baaf3af93c446729`

Chemin local MSI confirmé :

`C:\DEV\01_PROJETS\AtoumWeb\atoumweb-bridge`

État du miroir source :

`COMPLÉTÉ POUR AUDIT`

Le commit `844d702` ajoute les 26 fichiers 0.7.2 absents du dépôt à partir du ZIP canonique vérifié par SHA-256, sans écraser les fichiers Git déjà présents.

Références de baseline :

- ZIP canonique plugin 0.7.2 : 35 fichiers vérifiés ;
- `HANDOFF_CODEX.md` : artefact documentaire vérifié séparément ;
- `SOURCE_BASELINE_SHA256.txt` : 36 entrées de référence ;
- `includes/class-awb-child-theme-assets.php` diffère réellement du ZIP canonique mais correspond à une évolution Git existante (`feat: add child theme asset manager`) et doit être auditée comme telle, pas rétrogradée.

Conséquences :

- l'audit croisé Manager ↔ Bridge peut maintenant commencer ;
- ne pas forcer un retour byte-for-byte au ZIP 0.7.2 pour les fichiers Git ayant déjà évolué ;
- distinguer la baseline packagée 0.7.2 de la ligne de développement de la branche ;
- vérifier le HEAD réel des deux dépôts avant toute modification ;
- commencer en lecture seule et produire un rapport avant tout nouveau lot de code.

Référence Bridge à lire en premier :

1. `HANDOFF_CODEX.md`
2. `SOURCE_BASELINE_SHA256.txt`
3. `README.md`
4. `includes/class-awb-library-importer.php`
5. `includes/class-awb-site-occurrence.php`
6. `includes/class-awb-workbench.php`


## 3. Architecture Manager à lire en premier

Lire dans cet ordre :

1. `docs/ARCHITECTURE.md`
2. `docs/BRIDGE_WORKBENCH_MANAGER_INTEGRATION.md`
3. `docs/ATOUMWEB_COMPONENT_PACKAGE_CONTRACT_V1.md`
4. `docs/ATOUMWEB_COMPONENT_FIELDS_V1.schema.json`
5. `docs/ATOUMWEB_COMPONENT_IDENTITY_CONTRACT_V1.md`
6. `docs/ATOUMWEB_COMPONENT_IDENTITY_V1.schema.json`
7. `docs/ATOUMWEB_SITE_OCCURRENCE_CONTRACT_V1.md`
8. `docs/ATOUMWEB_SITE_OCCURRENCE_V1.schema.json`
9. `docs/ATOUMWEB_OCCURRENCE_RETURN_V1.schema.json`
10. `docs/BRIDGE_SNAPSHOT_ASSET_STORAGE.md`

Le Snapshot Schema V1 est gelé et ne doit pas être redéfini pendant cet audit.

## 4. Direction fonctionnelle validée

Principe général :

```text
Site réel
→ Snapshot Bridge
→ Originale immuable
→ Version de travail
→ Famille générique
→ Variantes réutilisables
→ Occurrences site
→ retour éventuel vers Manager
```

Retour depuis un site :

```text
Occurrence modifiée
→ Bridge
→ Manager
→ décision utilisateur :
   - garder seulement l'occurrence
   - créer une nouvelle variante
   - mettre à jour une variante
   - détacher / créer une nouvelle famille
```

Bridge produit les faits.

Manager propose les choix.

L'utilisateur décide.

## 5. Futur flux cible

À terme :

```text
Bibliothèque AtoumWeb
→ sélection de plusieurs composants
→ composition projet
→ Bridge
→ Workbench WordPress / Divi
→ personnalisation
→ Divi
→ validation
→ production
```

Le panier / assemblage multi-composants est une direction future, pas une fonctionnalité à implémenter pendant cet audit.

## 6. Contrats à ne pas casser

### Component Package V1

Manager → Bridge.

Le package réutilisable contient notamment :

```text
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

### Fields Contract V1

Types :

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

Bindings :

```text
html_text
html_html
html_attribute
css_variable
css_url
unresolved
```

Un champ `auto_detected` ambigu ne doit pas être appliqué silencieusement.

### Component Identity V1

```text
Component Family
      ↓
Library Variant
      ↓
Site Occurrence
```

Règle :

```text
libraryDisplayName != componentKey
```

Bridge doit utiliser `componentKey` quand il existe, jamais dériver une identité technique depuis un nom métier.

### Site Occurrence V1

Bridge crée `siteOccurrenceId`.

Manager ne le fournit pas.

### Occurrence Return V1

Règle :

```text
actionPolicy = manager_decides
```

Bridge ne décide jamais automatiquement de créer une variante ou une famille.

## 7. Bibliothèque — règles actuelles

Conserver toujours l'original provenant du site.

Étapes :

```text
Originale
→ Travail
→ Réutilisable
```

La Bibliothèque prévoit aussi :

- métier / `vertical` ;
- filtres par métier ;
- catégorie `Code snippets` ;
- tags séparés du métier ;
- futurs Component Family / Library Variant ;
- provenance et versionnement ;
- snippets techniques pouvant rester hors workflow Family/Variant.

Un élément peut avoir :

```text
vertical = fleuriste
classificationStatus = unclassified
componentKey = null
```

sans contradiction.

## 8. Fichiers source Manager à cibler après les docs

Ne pas lire tout le dépôt.

Commencer par :

```text
src/shared/componentPackageFields.ts
src/shared/componentIdentity.ts
src/shared/siteOccurrence.ts
src/shared/referentials.ts

src/main/referentials/AtoumWebTechnicalLibraryService.ts
src/main/referentials/AtoumWebPackageService.ts

src/main/database/migrations.ts
src/main/database/phase6Migrations.ts
src/main/database/atoumWebLibraryVerticalMigration.ts

src/main/bridge/BridgeSnapshotService.ts

src/renderer/referentials/AtoumWebLibraryPage.tsx
src/renderer/referentials/AtoumWebLibraryPage.css
```

N'élargir la lecture qu'en suivant une dépendance réellement nécessaire.

## 9. Tests existants utiles

Cibler d'abord :

```text
src/shared/componentPackageFields.test.ts
src/shared/componentIdentity.test.ts
src/shared/siteOccurrence.test.ts
src/main/referentials/AtoumWebTechnicalLibraryService.test.ts
src/main/referentials/AtoumWebPackageService.test.ts
src/main/database/migrations.test.ts
src/main/bridge/BridgeSnapshotService.test.ts
```

Ne lancer toute la suite que si le rapport d'audit ou une modification le justifie.

## 10. Mission d'audit Codex

Produire d'abord un rapport, sans code.

Répondre aux questions suivantes :

### A. Cohérence Manager

- Les modèles Bibliothèque / Package / Family / Variant / Occurrence sont-ils cohérents entre eux ?
- Existe-t-il des duplications de concepts ou des noms concurrents ?
- Les anciennes données restent-elles compatibles ?
- Les frontières Manager / Bridge sont-elles respectées ?
- Les règles Original immuable / versions / provenance sont-elles solides ?

### B. Processus Manager

Identifier les prochaines étapes qui apportent le plus de valeur pour :

- classement par métier ;
- classification Family / Variant ;
- création d'une famille à partir d'un composant existant ;
- rattachement à une famille existante ;
- affichage de provenance ;
- futur retour d'une occurrence ;
- recherche catalogue ;
- gestion Code snippets.

### C. Processus Bridge

Quand le dépôt Bridge sera disponible, vérifier :

- import Package V1 ;
- lecture `fields.json` ;
- lecture `identity.json` ;
- configurateur générique ;
- création `siteOccurrenceId` ;
- conservation provenance ;
- Workbench obligatoire ;
- analyse des changements ;
- futur Occurrence Return V1.

### D. UX

Relever uniquement les problèmes UX qui ont un impact concret sur le flux de production.

Ne pas proposer une refonte esthétique globale sans besoin métier.

### E. Technique

Chercher :

- contrats dupliqués ;
- sérialisations fragiles ;
- migration SQLite à risque ;
- validations manquantes ;
- chemins de compatibilité legacy ;
- dépendances circulaires ;
- endroits où Manager et Bridge pourraient diverger ;
- zones où une automatisation raisonnable éviterait du travail manuel.

## 11. Format du rapport attendu

Limiter le premier rapport à environ 20 points maximum.

Classer ainsi :

```text
🔴 Bloquant / risque réel
🟡 À améliorer prochainement
🟢 Solide / cohérent
💡 Idée future
```

Pour chaque point :

```text
- constat
- fichier(s) concerné(s)
- impact concret
- recommandation
- coût estimé : faible / moyen / fort
```

Puis fournir :

```text
Top 5 des prochaines actions recommandées
```

sans modifier le code.

## 12. Interdictions pendant le premier passage

Ne pas :

- fusionner la PR ;
- rebaser ;
- renommer massivement les fichiers ;
- réécrire les contrats V1 ;
- modifier Snapshot Schema V1 ;
- installer une nouvelle librairie ;
- convertir l'architecture en un autre framework ;
- publier vers WordPress ;
- créer le panier multi-composants ;
- refactorer “pour faire propre” sans problème démontré.

## 13. Après validation humaine

Seulement après validation du rapport :

1. choisir un lot ;
2. créer une petite branche ou utiliser la branche convenue ;
3. réaliser un changement ciblé ;
4. typecheck ;
5. tests ciblés ;
6. suite complète si nécessaire ;
7. commit petit et descriptif ;
8. ne jamais merger sans demande explicite.

## 14. Résultat attendu

Le but de l'audit n'est pas de refaire le CRM.

Le but est de répondre :

> Qu'est-ce qui est déjà solide, qu'est-ce qui risque de nous bloquer, et quelles sont les prochaines étapes les plus utiles pour faire avancer ensemble Manager + Bridge avec le moins de dette et le moins de travail inutile ?

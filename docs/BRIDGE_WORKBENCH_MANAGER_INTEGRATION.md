# Décision d’architecture — Bridge Workbench Divi et intégration future du Manager

Date de décision : 24/09/2026  
Projets : AtoumWeb Bridge / AtoumWeb Manager  
Statut : **architecture future validée — Snapshot V1 reste gelé et inchangé**

## 1. Règle de compatibilité

Le contrat **Snapshot V1 reste inchangé**.

L’évolution Bridge en série `0.6.x` ne doit pas casser ni réinterpréter le flux actuel du Manager :

```text
Bridge Snapshot V1
      ↓
import Manager
      ↓
Sites / historique / Bibliothèque
```

Le Manager continue donc l’import Snapshot V1 tel qu’il existe aujourd’hui.

Le Workbench Divi, les packages de composants et la publication Workbench → Production constituent une **couche future séparée**.

## 2. Nouvelle direction Bridge

Bridge évolue vers un **Page Code Organizer + Workbench Divi**.

Principe de travail validé :

```text
Production
   ↓
Snapshot / sauvegarde
   ↓
Workbench Divi isolé
   ↓
travail visuel dans Divi
HTML + CSS + JS mélangés autorisés pendant le chantier
   ↓
validation
   ↓
Bridge resépare
HTML → Divi
CSS  → Divi Child
JS   → Divi Child
JSON / structure / provenance → Bridge + Manager
   ↓
Snapshot après
```

Pendant la conception, l’utilisateur peut continuer à coller un bloc complet HTML + `<style>` + `<script>` dans Divi.

La séparation propre intervient après validation, côté Bridge.

## 3. Architecture de production cible

```text
Divi
└── structure + HTML + réglages

Divi Child AtoumWeb
└── assets/
    └── atoumweb/
        ├── css/
        │   ├── components/
        │   ├── pages/
        │   └── global/
        └── js/
            ├── components/
            ├── pages/
            └── global/

Bridge
└── snapshots / workbenches / provenance / rollback
```

Exemple :

```text
composant : atoum-about-page

HTML
→ reste dans Divi

CSS
→ assets/atoumweb/css/components/atoum-about-page.css

JS
→ assets/atoumweb/js/components/atoum-about-page.js
```

Bridge détecte les composants à partir des classes racines et conserve aussi les sous-composants détectés.

## 4. Workbench Divi

Pour une modification importante, Bridge crée une vraie page WordPress brouillon qui clone la page de production et son contexte Divi.

Le Workbench doit conserver au minimum :

```text
source_page
source_component
workbench_post_id
component_name
état
date de création
provenance
```

Le Workbench ne doit jamais modifier la production avant validation explicite.

Parcours cible :

```text
Production
[Créer Workbench]
[Modifier avec Divi]
[Prévisualiser]
[Analyser]
[Comparer]
[Valider vers production]
[Rollback]
```

## 5. Publication Workbench → Production

Cette publication n’est **pas ouverte actuellement**.

Elle sera ajoutée seulement après validation complète du parcours Workbench et devra intégrer au minimum :

```text
snapshot avant
séparation HTML/CSS/JS
écriture HTML dans Divi
écriture CSS/JS dans Divi Child
contrôle front
snapshot après
rollback
```

Cette séquence devra être traitée comme une opération sensible et traçable.

## 6. Responsabilités strictes

### Bridge

Bridge reste responsable de ce qui comprend et transforme WordPress/Divi :

- création du Workbench ;
- clonage de page/contexte Divi ;
- analyse du code ;
- détection de composants ;
- séparation HTML/CSS/JS ;
- écriture dans Divi ;
- écriture dans Divi Child ;
- validation ;
- contrôle front ;
- snapshots avant/après ;
- rollback ;
- import d’un package Bibliothèque vers un Workbench.

### Manager

Le Manager ne devient pas un éditeur Divi et n’écrit pas directement dans WordPress.

Il reste responsable de :

- conserver l’historique ;
- afficher et comparer ;
- présenter HTML/CSS/JS/structure/assets/dépendances ;
- conserver versions et provenance ;
- relier snapshots avant/après ;
- capitaliser les composants ;
- préparer/exporter les packages Bibliothèque ;
- suivre les Workbenches quand Bridge exposera leur contrat.

## 7. Modèle futur côté Manager

Pour une page ou un composant, le modèle doit pouvoir accueillir sans refonte majeure :

```text
HTML
CSS
JavaScript
structure Divi / JSON
assets
dépendances
version
provenance
snapshots avant/après
```

Le modèle devra également pouvoir représenter :

- une source de production ;
- un ou plusieurs Workbenches ;
- leur état ;
- leur `workbench_post_id` ;
- le composant ou la page source ;
- le snapshot avant ;
- le snapshot après ;
- une opération de publication ;
- un rollback éventuel.

Ces champs peuvent être ajoutés plus tard par migrations dédiées. Ils ne doivent pas être forcés dans Snapshot V1.

## 8. Bibliothèque AtoumWeb → Bridge

Flux cible validé :

```text
Bibliothèque Manager
      ↓
package composant
      ↓
Bridge
      ↓
Workbench Divi
      ↓
modification / adaptation avec Divi
      ↓
validation
      ↓
HTML → Divi
CSS/JS → Divi Child
provenance → Manager
```

Règle de sécurité métier :

> Un composant provenant de la Bibliothèque ne doit jamais être injecté directement en production par défaut. Il passe d’abord par un Workbench.

## 9. Contrat futur d’un package composant

Le package devra pouvoir transporter au minimum :

```text
manifest
HTML
CSS
JS éventuel
assets
dépendances
version
provenance
```

Le manifest devra être extensible afin d’ajouter ultérieurement :

- structure Divi/JSON ;
- classes racines ;
- sous-composants ;
- champs personnalisables du modèle générique ;
- exigences de plugin ;
- informations de compatibilité ;
- hash/intégrité des fichiers ;
- identité/version du composant source.

Le package n’implique aucune écriture directe en production.

## 10. Occurrence installée distincte du composant Bibliothèque

Une fois un composant utilisé sur un site :

- le composant original de Bibliothèque reste inchangé ;
- l’occurrence installée sur le site devient une entité distincte ;
- sa provenance doit pointer vers le composant Bibliothèque et sa version d’origine ;
- ses évolutions futures n’écrasent pas automatiquement le composant Bibliothèque ;
- un nouveau snapshot peut documenter ce que l’occurrence est devenue sur le site.

Conceptuellement :

```text
Composant Bibliothèque
  id: component-A
  version: 4
        ↓ utilisé via Bridge
Occurrence site
  id/site occurrence: site-X/component-A/...
  provenance: component-A v4
  workbench: ...
  production: ...
```

## 11. Provenance à conserver

La provenance est une donnée centrale et doit pouvoir relier :

```text
Bibliothèque Manager
→ package
→ import Bridge
→ Workbench
→ version modifiée
→ validation
→ production
→ snapshot après
```

Le Manager devra pouvoir présenter cette chaîne sans devenir l’outil qui l’exécute.

## 12. Workbench et snapshots

Le Workbench est un état de travail ; le snapshot est un état historique.

Ils ne doivent pas être confondus.

Le parcours recommandé est :

```text
Snapshot production avant
        ↓
Workbench
        ↓
modifications
        ↓
validation
        ↓
production
        ↓
Snapshot production après
```

Le couple snapshot avant / snapshot après permettra ensuite au Manager de comparer les effets réels de la publication.

## 13. Relation avec le coffre d’assets

La stratégie définie dans `docs/BRIDGE_SNAPSHOT_ASSET_STORAGE.md` reste applicable.

Un package Bibliothèque peut référencer ou embarquer des assets, mais :

- le Manager doit éviter les duplications inutiles ;
- les hashes restent la référence d’intégrité ;
- Bridge est responsable de l’import WordPress et du remapping final ;
- l’occurrence installée conserve sa propre provenance ;
- la copie du package ne doit jamais modifier l’objet source de Bibliothèque.

## 14. Plugins et dépendances

Le package peut déclarer des dépendances telles que Forminator, WooCommerce ou autres extensions.

Le Manager :

- conserve et affiche la dépendance ;
- transporte l’export/configuration si disponible ;
- ne tente pas de recréer le plugin.

Bridge :

- interprète la dépendance dans le contexte WordPress ;
- prépare le Workbench ;
- réalise ou guide l’import de la configuration lorsque son contrat le permet.

## 15. États futurs suggérés pour un Workbench

Sans figer encore le schéma SQL, le Manager doit être compatible conceptuellement avec des états tels que :

```text
créé
en modification
à réanalyser
analysé
à comparer
prêt à valider
validé
publié
échec
rollback disponible
rollback effectué
abandonné
```

Le vocabulaire exact sera aligné plus tard sur le contrat réel de Bridge.

## 16. Ce qu’il ne faut pas implémenter maintenant côté Manager

Tant que le contrat Bridge n’est pas stabilisé, ne pas :

- écrire directement dans WordPress ;
- créer une API WordPress parallèle à Bridge ;
- simuler un éditeur Divi dans le Manager ;
- inventer le format final du Workbench ;
- ouvrir une publication vers production ;
- modifier Snapshot V1 pour y forcer les Workbenches ;
- dupliquer côté Manager la logique de séparation HTML/CSS/JS déjà portée par Bridge.

## 17. Ce que le Manager peut préparer sans risque

Le Manager peut continuer à renforcer :

- import Snapshot V1 ;
- historique des snapshots ;
- affichage HTML/CSS/JS/Divi/assets/dépendances ;
- Bibliothèque Originale → Travail → Réutilisable ;
- modèle générique et champs personnalisables ;
- package de composant extensible ;
- provenance ;
- liens logiques entre composant source, package et occurrence future ;
- coffre local/déduplication d’assets.

## 18. État Bridge communiqué au 24/09/2026

Bridge est en série **0.6.x**.

Déjà présent côté Bridge :

- Workbench Divi ;
- création possible du Divi Child AtoumWeb ;
- analyse HTML/CSS/JS ;
- parcours en cours de fiabilisation :

```text
créer Workbench
→ modifier avec Divi
→ sauvegarder
→ réanalyser
→ retrouver HTML/CSS/JS
```

Pas encore ouvert :

- publication finale Workbench → Production.

La publication finale ne devra être considérée disponible dans le Manager qu’après stabilisation explicite du contrat Bridge correspondant.

## 19. Décision à retenir

Le futur échange doit respecter cette séparation :

```text
Manager = mémoire, bibliothèque, comparaison, package, provenance
Bridge  = WordPress, Divi, Workbench, transformation, publication, rollback
```

Le Snapshot V1 reste la fondation historique actuelle et ne doit pas être cassé pour anticiper la suite.

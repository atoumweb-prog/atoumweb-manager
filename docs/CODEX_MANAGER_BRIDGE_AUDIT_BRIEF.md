# Codex MSI — Audit ciblé Manager + Bridge

Date : 25/09/2026  
Projet : AtoumWeb Manager / AtoumWeb Bridge  
Mode demandé : **audit d'abord, aucune modification automatique**

## 1. But

Faire une revue technique et fonctionnelle du CRM AtoumWeb Manager et de son articulation avec AtoumWeb Bridge afin de :

- détecter les incohérences, doublons, risques et dettes techniques réellement utiles à corriger ;
- vérifier que les deux processus Manager ↔ Bridge sont cohérents de bout en bout ;
- proposer des améliorations concrètes, classées par impact / coût / risque ;
- identifier les prochains lots qui apportent le plus de valeur ;
- éviter les refontes inutiles ou les travaux chronophages sans bénéfice clair.

L'audit doit rester **ciblé et économique en tokens/temps**.

## 2. Source de vérité Manager

Repository :

`atoumweb-prog/atoumweb-manager`

PR de travail :

`#73 — Projet V2 — Blueprints de production et atelier AtoumWeb`

Base :

`fix/pre-phase5-commercial-ux`

Branche :

`feature/project-blueprints-v1`

Ne pas analyser tout l'historique Git. Utiliser en priorité :

```powershell
git status
git log --oneline --decorate -20
git diff --stat fix/pre-phase5-commercial-ux...feature/project-blueprints-v1
```

Puis ouvrir uniquement les fichiers nécessaires.

## 3. Documents canoniques à lire en premier

Avant d'inspecter largement le code, lire seulement :

1. `docs/ARCHITECTURE.md`
2. `docs/BRIDGE_WORKBENCH_MANAGER_INTEGRATION.md`
3. `docs/BRIDGE_SNAPSHOT_ASSET_STORAGE.md`
4. `docs/ATOUMWEB_COMPONENT_PACKAGE_CONTRACT_V1.md`
5. `docs/ATOUMWEB_COMPONENT_FIELDS_V1.schema.json`
6. `docs/ATOUMWEB_COMPONENT_IDENTITY_CONTRACT_V1.md`
7. `docs/ATOUMWEB_COMPONENT_IDENTITY_V1.schema.json`
8. `docs/ATOUMWEB_SITE_OCCURRENCE_CONTRACT_V1.md`
9. `docs/ATOUMWEB_SITE_OCCURRENCE_V1.schema.json`
10. `docs/ATOUMWEB_OCCURRENCE_RETURN_V1.schema.json`

Ces fichiers priment sur les suppositions.

## 4. Architecture fonctionnelle à préserver

Flux principal :

```text
Site réel
→ Snapshot Bridge
→ Originale immuable
→ Version de travail
→ Famille générique
→ Variantes réutilisables
→ Occurrences site
→ retour éventuel vers Manager
→ décision utilisateur
```

À terme :

```text
Bibliothèque AtoumWeb
→ sélection de plusieurs composants
→ composition projet
→ package
→ Bridge
→ Workbench WordPress / Divi
→ personnalisation
→ validation
→ production
```

Règles non négociables :

- Snapshot V1 reste gelé.
- L'original d'un vrai site est immuable.
- Manager ne modifie pas directement WordPress.
- Bridge est la couche WordPress / Divi.
- Aucun composant importé ne va directement en production.
- Workbench obligatoire avant production.
- `libraryDisplayName` n'est jamais une identité technique.
- `componentKey` est la clé technique de famille.
- Bridge crée `siteOccurrenceId`.
- Bridge retourne des faits ; Manager propose les choix ; l'utilisateur décide.
- Une occurrence personnalisée ne modifie jamais automatiquement sa famille ou sa variante source.
- Les anciens composants non classifiés restent `unclassified`.
- Un champ `auto_detected` ambigu ne doit pas être appliqué silencieusement.
- Les couleurs doivent privilégier les variables CSS plutôt que le remplacement arbitraire de codes hexadécimaux.

## 5. Bibliothèque

État cible :

```text
Originale
≠ Travail
≠ Famille
≠ Variante
≠ Occurrence
```

Métadonnées importantes :

- catégorie technique ;
- métier / `vertical` ;
- tags ;
- statut de réutilisation ;
- Family / Variant ;
- version ;
- provenance.

Nouvelle catégorie :

`code_snippet` / **Code snippets**

Elle sert aux petits extraits HTML, CSS, JavaScript, PHP, JSON ou autres ressources techniques qui ne sont pas nécessairement des composants visuels Family / Variant.

Le métier est indépendant des tags et de l'identité technique.

## 6. Contrats Manager → Bridge

Package réutilisable :

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

Contrats actuels :

- Component Package Contract V1
- Fields Contract V1
- Component Identity Contract V1
- Site Occurrence Contract V1
- Occurrence Return Contract V1

Ne proposer une modification de contrat que si elle corrige un problème réel. Sinon, considérer ces V1 comme le socle courant.

## 7. Bridge

Si le dépôt Bridge est déjà ouvert/localisé dans l'environnement, l'auditer à partir de sa racine.

**Ne pas scanner tout le disque pour le trouver.**

Si son chemin n'est pas évident dans l'environnement courant, arrêter cette partie et demander le chemin exact.

Points à vérifier côté Bridge :

- validation du package Manager ;
- lecture de `fields.json` ;
- configurateur générique ;
- lecture de `identity.json` ;
- conservation des identifiants Manager ;
- création de `siteOccurrenceId` ;
- stockage dans le Workbench ;
- modifications Divi ;
- réanalyse après sauvegarde ;
- suivi HTML / CSS / JS / assets ;
- calcul factuel des changements ;
- préparation future du package de retour ;
- aucune décision automatique de variante/famille ;
- aucune publication directe depuis un package Bibliothèque.

## 8. Méthode d'audit économique

### Phase A — préflight

Exécuter uniquement :

```powershell
git status
git branch --show-current
npm run typecheck
npm test
```

Si typecheck ou tests échouent :

1. identifier la cause précise ;
2. la signaler ;
3. ne pas lancer d'audit large tant que l'état de base n'est pas compris.

### Phase B — vue d'ensemble

Lire les documents canoniques et le diff de la PR.

Ne pas lire tous les fichiers du dépôt.

### Phase C — revue ciblée

Inspecter uniquement les zones utiles :

```text
src/main/bridge/
src/main/referentials/
src/shared/component*
src/shared/siteOccurrence*
src/renderer/referentials/
src/main/database/
docs/ATOUMWEB_*
docs/BRIDGE_*
```

Élargir à d'autres dossiers seulement lorsqu'une dépendance réelle l'exige.

### Phase D — synthèse

Ne modifier aucun fichier.

Produire d'abord un rapport.

## 9. Format du rapport demandé

Maximum environ 2 000 à 3 000 mots.

### A. État actuel

- ce qui est solide ;
- ce qui est partiellement implémenté ;
- ce qui est seulement conçu/documenté.

### B. Risques / incohérences

Pour chaque point :

```text
Impact : faible / moyen / fort
Effort : faible / moyen / fort
Risque de régression : faible / moyen / fort
Fichiers concernés
Pourquoi cela compte
```

### C. Manager ↔ Bridge

Tracer un parcours réel :

```text
Bibliothèque
→ export package
→ Bridge
→ Workbench
→ Divi
→ retour
→ décision Manager
```

Signaler précisément les trous du parcours.

### D. Améliorations proposées

Maximum 10 propositions.

Pour chaque idée :

- problème résolu ;
- bénéfice utilisateur ;
- coût estimatif relatif ;
- dépendances ;
- ce qui peut attendre.

### E. Ordre recommandé des prochains lots

Maximum 5 lots.

Ne pas coder ces lots avant validation humaine.

## 10. Ce qu'il ne faut pas faire pendant cet audit

- pas de refactor massif ;
- pas de renommage global ;
- pas de migration de base supplémentaire sans nécessité démontrée ;
- pas de réécriture d'architecture ;
- pas de changement de Snapshot V1 ;
- pas d'installation/réinstallation de dépendances si `node_modules` fonctionne ;
- pas de scan exhaustif de tous les fichiers ;
- pas de lecture exhaustive de l'historique Git ;
- pas de benchmark ou profiling long sans symptôme concret ;
- pas de génération de documentation redondante ;
- pas de modification de code avant accord ;
- pas de push / merge.

## 11. Question centrale

À la fin, répondre clairement à ceci :

> Quel est le chemin le plus court et le plus sûr pour passer de l'état actuel à un cycle réellement utilisable : Bibliothèque Manager → Bridge → Workbench Divi → retour Manager, tout en préparant le futur catalogue multi-composants sans le construire trop tôt ?


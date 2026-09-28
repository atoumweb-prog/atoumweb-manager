# Manager ↔ Bridge — Architecture, feuille de route et journal partagé

Date d'ouverture : 27/09/2026.

## 0. Statut et mode d'emploi pour les agents

**Document de coordination commun. Publication de la feuille de route autorisée ; aucun lot de développement autorisé par cette publication.**

- Dépôt : `atoumweb-prog/atoumweb-manager`.
- Branche de référence : `feature/project-blueprints-v1` ; PR principale : #73.
- Socle Manager fonctionnel audité : `4f8fa15c80da874e084648b1d643a316cbfcbcb2` ; les commits suivants de cette roadmap sont documentaires tant qu’aucun lot n’est explicitement autorisé.
- PR #74 / CGV Builder déjà intégrée : ne pas la fusionner à nouveau.
- Les choix ci-dessous sont les recommandations issues de l'audit. Les arbitrages de la section 14 doivent être confirmés avant implémentation ; un lot nécessite une autorisation explicite.
- Ce document complète le cahier des charges ; il ne remplace pas `PROJECT_STATUS.md`, qui résume l'avancement réellement vérifié.
- Code Bridge confronté à la roadmap : dépôt `atoumweb-prog/atoumweb-bridge`, branche fonctionnelle `feature/workbench-occurrence-v1` @ `36d1076dbac1f031356632d8b95427e0ee58739c`, plugin déclaré **0.8.0**. Le `main` Bridge courant ne contient qu’un README et n’est pas la baseline fonctionnelle.

### Règle de coordination demandée par Carlos

À chaque échange comportant une consigne, une décision, une correction, un résultat de validation, un blocage ou un transfert entre agents, ajouter une entrée au **journal de la section 16** dans ce même fichier.

Ne pas recopier intégralement la conversation. Consigner les faits utiles, leur origine, leur statut, les références et la prochaine action. Ne pas inscrire de secrets ni de données client inutiles. Ne pas présenter une proposition comme une décision validée ou une fonction réalisée.

Avant de travailler sur un lot Manager/Bridge, lire le présent document et ses dernières entrées. Identifier le lot autorisé, le propriétaire du travail et la base utilisée. Ne pas lancer un autre lot implicitement.

Pour chaque entrée, utiliser un identifiant unique et préciser : date, auteur/rôle, type (consigne/proposition/décision/résultat/blocage), base ou commit vérifié, résumé, validations, prochaine action et responsable si connu. Une ancienne décision corrigée reste dans l'historique ; une nouvelle entrée la remplace explicitement et la section d'architecture concernée est actualisée.

En cas de travail parallèle, conserver les entrées des autres agents. Ne jamais écraser une mise à jour distante ou forcer un push. Un agent sans accès en écriture au dépôt Manager fournit une entrée prête à intégrer à Carlos ou à l'agent responsable ; ne pas créer une feuille de route concurrente côté Bridge.

La mise à jour documentaire ne donne pas, à elle seule, une autorisation permanente de commit, push, fusion ou déploiement. Indiquer à chaque transfert si les informations sont locales ou publiées. Les échanges invisibles à un agent ne peuvent être consignés automatiquement par cet agent.

## 1. Compréhension métier

Manager organise le Projet, prépare des composants et conserve leur provenance. Divi reste l'atelier visuel principal. Une page peut commencer avec trois composants Manager puis être largement complétée dans Divi : modules natifs, structure, spacing, responsive, CSS ou JavaScript local.

La Bibliothèque reste volontaire. Un module natif ou une règle CSS observée ne devient jamais automatiquement un composant réutilisable.

Au retour, Manager doit expliquer quels composants et versions sont utilisés, ce qui a changé dans leurs occurrences, ce qui relève du contexte de page/site et ce qui pourrait être promu volontairement en Bibliothèque.

## 2. Constat sur le code actuel

### Manager — existant vérifié

| Existant | Conséquence |
| --- | --- |
| Projet créé depuis un devis accepté ; prestations et références des sources conservées | Séparation commercial/opérationnel déjà amorcée. |
| Nœuds Projet de type module et `displaySubtype=page` | Réutiliser cette identité au lieu de créer un second arbre de pages. |
| Composition ordonnée avec version Bibliothèque précise par élément | Base adaptée à une sélection de composants, pas à la totalité d'une page. |
| Composition sans lien Projet/Site/Page | Destination métier à ajouter. |
| Snapshots Manager : pages, nœuds, parents, attributs, responsive, design, classes, IDs et références de sources | Réutiliser ce socle pour observer la page réelle. |
| Sources avec scope, origine, propriétaire et références de contenu | Conserver la provenance du CSS plutôt que le fusionner dans le composant. |
| Retour d'occurrence V1, contrôle d’empreintes et décisions Famille/Variante | Conserver ces contrats ; compléter le cas multi-composants plutôt que les réécrire. |

### Bridge 0.8.0 — existant vérifié dans le code

| Existant Bridge | Conséquence |
| --- | --- |
| Import `atoumweb_bridge_project_package` schemaVersion 1 | Le transport multi-composants existe déjà ; ne pas le reconstruire. |
| Un Workbench WordPress/Divi unique par package projet | Base de préparation partielle déjà disponible. |
| Un module Code distinct par composant, ordre Manager conservé | Les composants préparés restent séparés dans Divi. |
| Une `siteOccurrenceId` créée par Bridge pour chaque composant | Conserver le principe `createdBy=bridge` des contrats V1. |
| `compositionItemId` et ordre conservés dans les metas/provenances | Point d’ancrage Manager déjà disponible pour associer l’intention d’insertion à l’occurrence Bridge. |
| Baseline HTML/CSS/JS conservée par occurrence | Base déjà présente pour calculer les différences. |
| Scanner Divi 4 parent-aware : section/row/column/module, attributs, design, responsive, classes et IDs | LOT 8B doit surtout valider/compléter la couverture, pas recréer un scanner. |
| Sources CSS/JS de page et globales, `_et_pb_custom_css`, contexte Theme Builder connu | La séparation composant/occurrence/page/site est compatible avec le scanner actuel. |
| Workbench-first et aucune publication production automatique | Principe de sécurité déjà aligné avec la roadmap. |
| `actionPolicy=manager_decides` sur Occurrence Return V1 | Promotion Bibliothèque volontaire déjà cohérente avec le besoin métier. |

### Écarts réellement constatés

- Le package projet V1 ne connaît pas `scope=page`, `projectId`, `siteId`, `pageId` ni `exportId`.
- L’empreinte du package est conservée mais l’import complet d’un package projet n’est pas encore idempotent : le même ZIP peut créer un nouveau Workbench.
- La `siteOccurrenceId` est conservée en meta Bridge, mais elle n’est pas encore portée par un marqueur stable du module Divi lui-même. Déplacement/duplication exigent donc un mécanisme d’identité plus robuste.
- `AWB_Site_Occurrence::build_return_zip()` est aujourd’hui réservé aux Workbenches `manager_library` mono-composant. Le retour individuel des occurrences d’un Workbench `manager_project` reste à implémenter.
- Les affectations Theme Builder et les presets/couleurs/polices globaux Divi restent partiellement normalisés ; une absence observée ne doit pas être assimilée à une suppression certaine.
- Les semantic keys Manager restent rapprochées à l’échelle du Projet ; `pages.home` ne distingue pas deux Sites.

Sources Manager :
- `src/main/projects/ProjectService.ts`, `src/shared/projects.ts`, `src/main/database/projectBlueprintMigrations.ts` ;
- `src/main/referentials/AtoumWebCompositionService.ts`, `AtoumWebCompositionPackageService.ts`, migration 43 ;
- `src/main/database/bridgeSnapshotMigration.ts` ;
- `src/main/referentials/AtoumWebOccurrenceReturnService.ts`, migration 39 ;
- contrats Site Occurrence / Occurrence Return V1.

Sources Bridge 0.8.0 :
- `includes/class-awb-library-importer.php` ;
- `includes/class-awb-workbench.php` ;
- `includes/class-awb-site-occurrence.php` ;
- `includes/class-awb-scanner.php` ;
- `docs/ATOUMWEB_BRIDGE_PROJECT_PACKAGE_INTAKE_V0_1.md`.

## 3. Architecture recommandée

```text
Devis accepté — référence commerciale figée
└── Projet — organisation opérationnelle
    └── Site — destination logique
        └── Page — identité et suivi opérationnels
            ├── Composition facultative de composants AtoumWeb
            ├── Occurrences suivies individuellement
            └── États observés de la page réelle via Bridge
```

La composition est toujours potentiellement partielle. Une page peut n'avoir aucun composant Manager. Aucun champ `mode=hybrid` n'est nécessaire.

Libellé conseillé : **Composants préparés pour cette page**. Le terme technique Composition peut rester dans le code ; éviter « Composer un site » pour cette opération.

## 4. Modèle de données recommandé

Les noms ci-dessous sont des propositions, pas une instruction de créer immédiatement toutes les tables.

| Objet | Responsabilité |
| --- | --- |
| `projects` | Client, devis source, organisation et suivi existants. |
| `project_sites` | Identifiant stable, projet, nom opérationnel, archivage ; domaine souhaité facultatif, jamais une identité. |
| `project_nodes` | Identité et nom opérationnels de la page, description, statut de travail, tâches, ordre dans le Projet. |
| `project_site_pages` | Extension avec `project_node_id` comme clé primaire, lien Site, rôle éventuel et chemin souhaité facultatif. |
| Composition existante | Lien facultatif vers la Page et sélection ordonnée des composants. |
| Occurrences suivies | Association durable Page + `compositionItemId` + version Bibliothèque source + `siteOccurrenceId` créée par Bridge. Un identifiant d’occurrence supplémentaire côté Manager n’est ajouté que s’il répond à un besoin démontré. |
| Liaisons Bridge | Association explicite avec installation WordPress, page externe et Workbench. |
| Exports/retours | Échanges immuables, identifiants, empreintes, bases de comparaison et résultats d'application. |
| Snapshots existants | État observé, structure et sources ; aucune Bibliothèque parallèle. |

`pageId` reste l'identifiant du nœud Projet. L'extension ne copie pas titre/statut. Le titre WordPress observé et le nom opérationnel peuvent différer et restent distingués.

Pour commencer : une composition active par Page, des exports successifs figés. Les compositions historiques restent non rattachées jusqu'à une action explicite. Le Site et le Projet se déduisent du rattachement Page plutôt que d'être recopiés comme vérités éditables dans la composition.

Contrôler les liens inter-projets/inter-sites, le subtype page et l'archivage. Un nœud déjà lié à une Page ne peut être retypé ou déplacé vers un autre projet en invalidant silencieusement ses références. Archiver conserve exports et provenance.

## 5. Responsabilités Manager / Bridge / Divi

| Manager | Bridge | Divi |
| --- | --- | --- |
| Organise Projet/Site/Page | Vérifie destination et compatibilité | Construit la page réelle |
| Gère Bibliothèque et versions | Prépare le Workbench | Gère structure, rendu et responsive |
| Prépare certains composants | Associe occurrences et éléments réels | Permet ajouts et modifications libres |
| Conserve historique et décisions | Observe composants, modules natifs et contexte | Reste l'atelier visuel |
| Décide de la promotion | Rapporte les changements et ambiguïtés | Ne dépend pas d'une composition exhaustive |

Ajouter un composant ne doit pas nécessiter l'envoi d'une reconstruction complète de la page.

## 6. Composants, occurrences et contenu natif

| Niveau | Données |
| --- | --- |
| Composant Bibliothèque | Identité métier, famille, rôle, variantes. |
| Version | HTML/CSS/JS, assets, champs, configuration par défaut et design interne de référence. |
| Occurrence | Version source, valeurs locales, assets choisis, adaptations locales et identité durable. |
| Placement | Parent/conteneur Divi, ordre réel, contraintes de largeur et espacement extérieur. |
| Page | Structure complète, modules natifs, CSS spécifique, réglages et contexte de rendu. |

Distinctions d'identité :

- `compositionItemId` : intention d'insertion préparée et stable côté Manager ;
- `siteOccurrenceId` V1 : identité de l’instance réellement créée par Bridge, conformément à `createdBy=bridge` ;
- identifiant de nœud Snapshot : observation technique, potentiellement variable ;
- un éventuel `managerOccurrenceId` supplémentaire est **non décidé** et ne doit pas être créé tant que `compositionItemId + siteOccurrenceId` suffit.

Le package sortant conserve `compositionItemId`. Bridge crée ensuite `siteOccurrenceId` et doit renvoyer/persister l’association entre les deux. Le module Divi doit disposer d’un marqueur technique stable permettant de retrouver cette `siteOccurrenceId` après déplacement. Une duplication doit produire une nouvelle occurrence ou être signalée comme ambiguë ; deux modules ne doivent jamais être acceptés silencieusement avec le même marqueur.

Les modules natifs restent dans les données Snapshot/Page state existantes, avec références brutes et métadonnées utiles. Ne pas les recopier comme entités éditables d'un second builder. Un état courant affiché est une projection des observations conservées, pas une autre source du contenu.

Promotion d'un élément natif : sélection volontaire → candidat → préparation/nettoyage → validation Bibliothèque. Ne pas inventer une origine Bibliothèque pour le faire entrer dans Occurrence Return V1.

## 7. CSS et spacing

La frontière dépend de la cible et de la responsabilité de la règle, pas de son nom seul.

| Exemple | Propriétaire |
| --- | --- |
| Padding interne 80 px du Hero de référence | Version Bibliothèque |
| Padding interne ramené à 40 px uniquement ici | Adaptation d'occurrence |
| Margin-bottom 30 px après ce Hero | Placement local |
| Padding de Section contenant plusieurs composants | Structure de Page |
| Largeur de Row, réglage de Colonne | Conteneur de Page |
| Responsive interne livré avec le Hero | Version Bibliothèque |
| Responsive local du conteneur | Placement/Page |
| Classe intrinsèque du composant | Version Bibliothèque |
| Classe ajoutée localement | Occurrence/Page selon la cible |
| CSS global influençant le Hero | Dépendance de Site observée |

Le `margin-bottom=30px` local ne crée aucune nouvelle version générale du Hero.

Manager conserve la version immuable, les adaptations identifiées et les liens vers les sources observées. Bridge/Snapshot conserve le contexte natif et les preuves. Distinguer lieu de stockage et effet d'une règle : du CSS Page peut cibler un seul Hero ; une classe globale peut affecter plusieurs composants.

Si l'attribution est incertaine, conserver « règle de Page affectant cette occurrence ». Ne pas extraire automatiquement ce CSS dans le composant. Même vigilance pour le JavaScript et ses dépendances.

Utiliser un conteneur technique de placement minimal et identifié si nécessaire ; éviter d'empiler des wrappers avec paddings implicites. Les IDs HTML ne sont pas des identités métier ; contrôler leurs collisions et les références CSS/JS associées.

## 8. Round-trip et package

### État réel Bridge 0.8.0 à conserver

Le flux multi-composants existe déjà :

```text
Composition Manager
→ atoumweb_bridge_project_package V1
→ Bridge
→ un Workbench Divi
→ un module Code par composant
→ une siteOccurrenceId Bridge par composant
```

Ce flux est **Workbench-first**, ne publie pas en production et conserve la version Bibliothèque source, la provenance, `compositionItemId`, l’ordre et les baselines HTML/CSS/JS.

Limites actuelles à ne pas masquer :

- le package V1 représente une composition, pas explicitement une Page ;
- réimporter le même package complet n’est pas encore idempotent ;
- la `siteOccurrenceId` n’est pas encore un marqueur stable directement exploitable dans le module Divi ;
- le retour multi-composants `manager_project` n’existe pas encore ;
- le scanner observe déjà largement la Page réelle mais sa couverture Theme Builder/presets reste partielle.

Une Page sans composant Manager est valide et n’a aucun package de composition à envoyer.

### Cible du round-trip

1. Manager prépare éventuellement quelques composants pour une Page avec versions sources précises.
2. Il produit un export immuable identifié par `exportId`, avec destination Projet/Site/Page et `compositionItemId`.
3. Bridge vérifie version, destination et import antérieur, puis crée ou reconnaît le Workbench correspondant sans doublon silencieux.
4. Pour chaque composant, Bridge crée `siteOccurrenceId`, l’associe à `compositionItemId` et inscrit un marqueur technique stable dans/avec le module Divi.
5. L'utilisateur travaille librement dans Divi : déplacement, spacing, modules natifs, CSS Page, etc.
6. Bridge observe occurrences et contexte Page en déclarant la couverture du scan.
7. Le retour multi-composants référence l’export de base, la Page et chaque `siteOccurrenceId`.
8. Manager compare base exportée, préparation actuelle et état retourné, puis laisse l’utilisateur conserver localement ou préparer volontairement une promotion.

### Enveloppe Page versionnée proposée

Faire évoluer `atoumweb_bridge_project_package` par **schemaVersion 2 ou contrat additionnel explicitement versionné**, sans modifier silencieusement V1. Les contrats Component/Fields/Identity/Site Occurrence/Return V1 et Snapshot V1 restent lisibles.

| Groupe | Champs conceptuels |
| --- | --- |
| Destination | `scope=page`, `projectId`, `siteId`, `pageId` |
| Préparation | `compositionId`, révision/empreinte |
| Échange | `exportId`, empreinte du manifeste, versions de contrat |
| Composants sortants | `compositionItemId`, source Bibliothèque/version, configuration, ordre initial |
| Placement prévu | Conteneur attendu ou politique de placement, sans prétendre décrire toute la Page |
| Provenance | Origines Bibliothèque séparées de la destination Projet |
| Accusé Bridge | `exportId`, Workbench, `compositionItemId ↔ siteOccurrenceId`, marqueur/nœud externe si disponible |

Le package Manager **ne fournit pas `siteOccurrenceId`** : V1 établit que Bridge la crée. `scope=page` décrit la destination et non une autorisation à remplacer toute la Page.

Préférer un seul identifiant logique `exportId` pour l’export/package, distinct de l’empreinte SHA-256 du contenu.

### Retour cible

- `returnId`, `exportId` de base et révision observée ;
- Projet/Site/Page/Workbench ;
- `compositionItemId`, `siteOccurrenceId` et correspondance au module/nœud observé ;
- configuration actuelle, changements de contenu et de placement, dépendances ;
- références Snapshot/fichiers et empreintes ;
- couverture du scan, éléments non résolus et suppressions seulement si elles sont confirmées.

Idempotence : même ID/même contenu = pas de doublon ; même ID/contenu différent = rejet ; retour ancien = historique conservé sans remplacer l'état récent.

Comparer trois états : base exportée, préparation Manager actuelle, état Divi retourné. Détecter les conflits avant application. Aucun moteur général de fusion HTML/CSS ; conserver une importation atomique ou compensée.

## 9. Multi-site, blueprints et éléments globaux

Un Site opérationnel est une cible logique. Son URL peut changer. Ses installations staging/production sont distinctes et reliées explicitement. Le Workbench et la Page finale restent distincts : un Workbench prêt ne prouve pas la mise à jour de la Page finale.

Blueprint : déclarer Sites/Pages par des rôles explicites, générer une identité durable au premier passage, conserver site et version du blueprint d'origine, rendre la répétition idempotente. Préserver ensuite renommages, ajouts et suppressions manuels ; un devis « cinq pages » n'interdit pas une sixième page opérationnelle.

Une clé effective `site:<id-stable>:pages.home` permet de distinguer deux Accueil sans dépendre du domaine. Le blueprint initialise le Projet ; il ne synchronise pas rétroactivement le devis. L'ordre du Projet n'est pas automatiquement l'ordre des menus WordPress.

Header/Footer/Theme Builder : réserver un type futur de cible template distinct de Page. Une occurrence globale appartient au template ; elle n'est pas copiée comme une occurrence indépendante sur chaque Page qui l'affiche. Observer les relations d'application, presets et dépendances globales. Reporter leur édition/déploiement à un lot dédié si nécessaire.

## 10. Risques

- Marqueur absent/dupliqué : position et ressemblance sont des indices, jamais une preuve suffisante d'identité.
- Scan partiel : une absence ne confirme pas une suppression.
- Rendu contextuel : même HTML ne signifie pas même rendu sous un thème, preset ou CSS global différent.
- Réexport : ne jamais écraser silencieusement les modules natifs ou le travail humain.
- Retour obsolète/concurrent : conserver l'histoire sans régresser l'état courant.
- Promotion : éviter d'embarquer structure/CSS de Page dans une Variante.
- Clone WordPress : ne pas identifier une installation par URL ou identifiant copié sans contrôle.
- Scanner : vérifier la couverture sur des fixtures Divi réelles, notamment réglages, duplication et suppression.
- UX : noms, extraits, contexte et différences visibles ; UUID et scores ne justifient pas une validation humaine.

## 11. Hors périmètre à préserver

- Aucun clone du Divi Builder dans Manager.
- Aucun import automatique de tous les modules dans la Bibliothèque.
- Aucun second arbre Page concurrent de Projet V2.
- Aucun moteur général de fusion automatique CSS.
- Aucune propagation automatique des versions Bibliothèque aux Pages.
- Aucune publication directe Manager → WordPress.
- Aucun framework générique prématuré pour templates/environnements.
- Aucun lot de code, migration, fusion de branche ou publication production autorisé par ce document.

## 12. Ordre proposé

Le préalable de lecture du vrai Bridge est désormais **réalisé**. Il reste deux décisions contractuelles avant 8A : format Page versionné et marqueur stable d’occurrence dans Divi.

Ordre recommandé :

```text
6A Projet/Site/Page
→ 6B Composition partielle
→ 7 Squelette blueprint
→ décision contrat Page + marqueur occurrence
→ 8A Export Page / idempotence / association Bridge
→ 8B Validation et compléments de l’observation hybride existante
→ 8C Retour multi-composants et décisions
→ 9 Préparation multi-pages
→ checkpoint final
```

6A et 6B peuvent être conçus sans réécrire Bridge. Les lots 8A/8B/8C ne doivent pas commencer tant que les deux décisions contractuelles ci-dessus ne sont pas explicites.

Tous les lots restent **non autorisés** tant que Carlos ne donne pas son accord explicite.

## 13. Lots détaillés

### Préalable — Contrat partagé Manager/Bridge — audit code réalisé, décisions restantes

- État : lecture du vrai Bridge 0.8.0 effectuée sur `feature/workbench-occurrence-v1@36d1076`.
- Confirmé : package projet V1, Workbench unique multi-composants, modules Code séparés, `siteOccurrenceId` par composant, scanner large, Workbench-first.
- Restant avant 8A : décider la forme de l’enveloppe Page V2/additive et le marqueur technique stable permettant de retrouver `siteOccurrenceId` dans Divi après déplacement/duplication.
- Migrations : aucune.
- Validation restante : scénario contractuel documenté avec import répété, déplacement, duplication et retour multi-composants attendu.
- Dépendance : n’empêche pas 6A/6B ; bloque l’implémentation 8A.

### LOT 6A — Projet/Site/Page

- Objectif : destinations opérationnelles durables, création manuelle et archivage.
- Changements : `project_sites`, extension Page et contrôles de cohérence.
- Migrations : nouvelles tables additives, aucun renommage de migration historique.
- Périmètre : `ProjectService`, types Projet, `ProjectsPage`, migrations ciblées.
- Tests/acceptation : deux Sites avec chacun Accueil ; renommage sans changement d'identité ; liens incohérents refusés ; anciens Projets préservés ; archivage conservant l'histoire.
- Dépendance : fournit les destinations à 6B/7.

### LOT 6B — Composition partielle

- Objectif : préparer certains composants d'une Page, sans prétendre décrire toute la Page.
- Changements : lien Page facultatif pour l'existant, libellés explicites, une composition active par Page.
- Migrations : lien Page et contrainte d'unicité adaptée à l'archivage.
- Périmètre : `AtoumWebCompositionService`, types, interface Bibliothèque/compositions.
- Tests/acceptation : Page sans composant valide ; deux utilisations distinctes d'une même source ; rattachement manuel des anciennes compositions ; aucune inférence par nom.
- Dépendance : fournit les préparations à 8A.

### LOT 7 — Squelette blueprint

- Objectif : générer Sites/Pages sans figer le travail opérationnel.
- Changements : rôles explicites, génération par Site, provenance du blueprint et idempotence.
- Migrations : métadonnées/table de génération seulement si nécessaires après choix du modèle.
- Périmètre : `ProjectService`, blueprints, types et tests Projet.
- Tests/acceptation : réexécution sans doublons ; deux Sites ; changements manuels préservés ; devis intact ; Page ajoutée manuellement possible.
- Dépendance : utilise 6A ; non bloquant pour essayer le transport sur une Page manuelle.

### LOT 8A — Export Page, idempotence et association Bridge

- Objectif : compléter l’import multi-composants existant pour qu’il représente explicitement une préparation partielle de Page et soit réimportable sans doublon silencieux.
- À conserver : `atoumweb_bridge_project_package` V1, Workbench unique, modules Code séparés, création Bridge des `siteOccurrenceId`, baselines et provenance.
- Changements : enveloppe Page versionnée/additive ; `exportId` ; `projectId/siteId/pageId` ; contrôle d’import antérieur ; accusé Bridge ; association `compositionItemId ↔ siteOccurrenceId` ; marqueur stable dans/avec le module Divi.
- À ne pas ajouter sans besoin démontré : un second identifiant d’occurrence Manager faisant doublon avec `compositionItemId + siteOccurrenceId`.
- Migrations Manager : exports/liaisons uniquement si nécessaires ; préserver compositions et retours historiques.
- Périmètre : `AtoumWebCompositionPackageService`, validations partagées, `AWB_Library_Importer`, `AWB_Workbench`, `AWB_Site_Occurrence`.
- Tests/acceptation : même export réimporté sans nouveau Workbench ; même `exportId` avec contenu différent refusé ; mauvaise destination/version refusée ; source exacte conservée ; déplacement conserve l’identité ; duplication ne crée pas deux modules avec la même identité silencieusement.
- Dépendance : 6B + décisions contractuelles du préalable.

### LOT 8B — Validation et compléments de l'observation hybride

- Objectif : exploiter le scanner existant pour comprendre occurrences, modules natifs, placement et contexte, sans transformer Manager en builder.
- À conserver : parsing Divi 4 section/row/column/module, attributs complets, design/responsive, classes/IDs, CSS/JS Page/global, metas utiles, contexte Theme Builder déjà collecté.
- Changements : fixtures et couverture explicite ; corrélation avec le marqueur `siteOccurrenceId` ; uniquement les métadonnées réellement manquantes.
- Migrations : réutiliser Snapshots ; ajouter seulement les liens/révisions nécessaires, sans modifier Snapshot V1.
- Périmètre : `BridgeSnapshotService`, `AWB_Scanner`, liaisons d’occurrence.
- Tests/acceptation : Texte/Image/Code natifs ajoutés, Hero déplacé, marge/padding local, CSS Page, duplication, suppression, scan partiel ; aucune mutation Bibliothèque ; absence non traitée comme suppression certaine.
- Couverture à signaler : Theme Builder/presets/couleurs/polices globales restent partiellement normalisés tant que des fixtures ne prouvent pas mieux.
- Dépendance : 8A.

### LOT 8C — Retour multi-composants et décisions

- Objectif : ajouter le retour qui manque réellement pour les Workbenches `manager_project`, occurrence par occurrence, puis conserver les décisions utilisateur.
- À conserver : Occurrence Return V1 mono-composant existant et `actionPolicy=manager_decides`.
- Changements : retour lié à `exportId/pageId` ; plusieurs `siteOccurrenceId` ; historique de révisions ; détection retour répété/ancien/concurrent ; changements de placement séparés des changements intrinsèques ; entrée volontaire pour candidat natif.
- Migrations : liens/historique d’application si nécessaires, sans effacer les retours V1.
- Périmètre : `AtoumWebOccurrenceReturnService`, `AWB_Site_Occurrence`, Familles/Variantes et interface de revue.
- Tests/acceptation : retour multi-composants réel ; même retour sans doublon ; retour ancien conservé sans régression ; source Bibliothèque intacte ; spacing local exclu par défaut d’une promotion ; élément natif jamais promu automatiquement.
- Dépendance : 8B et les fonctions Bibliothèque existantes.

### LOT 9 — Préparation multi-pages

- Objectif : suivre plusieurs Pages et préparer la livraison via Bridge.
- Changements : progression, liaisons Pages réelles, dépendances globales, distinction Workbench/Page finale.
- Migrations : réutiliser le modèle ; liens de templates seulement si un périmètre explicite les nécessite.
- Périmètre : services Projet/Bridge et écran de suivi ; pas de publication directe.
- Tests/acceptation : destinations distinctes, dépendances globales visibles, absence de faux état publié, navigation compréhensible.
- Dépendance : parcours unitaire 8C validé avant généralisation multi-pages.

### Checkpoint final

- Objectif : vérifier la chaîne complète et préparer l'intégration finale.
- Changements/migrations : aucun prévu hors correction explicitement cadrée.
- Validation : typecheck, tests ciblés, suite complète, packaging, recette humaine et régressions.
- Dépendance : lots retenus terminés. Fusion PR #73/main uniquement sur instruction explicite.

Réversibilité : nouvelles relations facultatives pour l'historique, formats anciens lisibles, échanges immuables, aucun rattachement massif déduit. Numérotation des migrations à attribuer lors de l'implémentation ; ne pas réécrire 40–46.

## 14. Arbitrages et statut après confrontation Bridge

Les statuts ci-dessous distinguent **validation métier**, **compatibilité technique** et **décision encore requise**.

1. **Page = nœud Projet + extension** — compatible techniquement avec Bridge ; à confirmer avant 6A.
2. **Composition facultative et partielle** — validée comme besoin métier : Divi reste l’atelier principal ; une Page peut avoir zéro composant Manager.
3. **Site logique Manager distinct de l’installation Bridge ; Workbench distinct de la Page finale** — compatible avec le code actuel et recommandé.
4. **Identité d’occurrence** — ne pas créer pour l’instant un `occurrenceId` Manager supplémentaire. Utiliser `compositionItemId` avant import, puis `siteOccurrenceId` créée par Bridge. **Décision requise avant 8A : forme du marqueur stable dans Divi et règle de duplication.**
5. **Enveloppe Page versionnée** — nécessité confirmée par le code actuel. **Décision requise avant 8A : schemaVersion 2 du package projet ou nouveau contrat additionnel.**
6. **Conservation locale par défaut, promotion Bibliothèque volontaire** — validée métier et alignée avec `actionPolicy=manager_decides`.
7. **Idempotence** — le package projet actuel ne la garantit pas au niveau Workbench. 8A doit définir `exportId` + comportement de réimport avant tout round-trip.
8. **Scanner hybride** — existe déjà largement. 8B est un lot de validation/corrélation/complément, pas un nouveau scanner.
9. **Retour multi-composants** — explicitement absent aujourd’hui pour `manager_project`; relève de 8C et ne doit pas être supposé acquis.

## 15. Recommandation d'exécution

Le code Bridge ayant maintenant été vérifié, cadrer 6A/6B sans reconstruire les capacités déjà présentes. Ajouter ensuite le squelette blueprint avec 7. Avant 8A, arrêter explicitement le contrat Page versionné et le marqueur stable d’occurrence Divi. Réussir ensuite un parcours complet sur une Page hybride avant de passer au multi-pages.

Recette de référence : trois composants Manager, ajouts natifs Divi, déplacement, spacing local, CSS Page, retour correctement attribué, répétition du retour sans doublon et absence de mutation Bibliothèque. Carlos réalise la navigation/recette visuelle ; les agents analysent le code et exécutent les contrôles ciblés autorisés.

Critère métier : terminer librement une Page dans Divi, puis comprendre dans Manager ce qui a changé, où et pourquoi, sans reconstruire la Page ni interpréter des UUID.

## 16. Journal partagé des consignes, décisions et validations

### 2026-09-27 — CP-001 — Checkpoint technique vérifié

- Auteur/rôle : agent Manager MSI, résultats communiqués à Carlos.
- Type : résultat ; base `4f8fa15c80da874e084648b1d643a316cbfcbcb2`.
- Git propre et aligné sur la branche distante au checkpoint ; PR #74 déjà intégrée.
- Validation-MSI lu sans écriture : migrations 1–43 présentes, aucune ancienne collision CGV 40/41/42. Migrations CGV 44/45/46 présentes dans le code, non appliquées par l'agent à ce workspace.
- Typecheck réussi. Tests ciblés : ContractTermsService 9, QuoteService 8, migrations 10, CompositionService 5, CompositionPackageService 2, soit **34 réussis / 0 échoué**.
- Aucun lancement de l'application, suite complète ou packaging. Recette CGV post-migrations non effectuée dans ce checkpoint. Production non touchée.
- Prochaine action : réflexion d'architecture, pas lancement d'un lot.

### 2026-09-27 — ARCH-001 — Demande de réflexion sur les Pages hybrides

- Origine : consigne de Carlos et note d'architecture produite dans le chat Manager MSI.
- Type : consigne + proposition ; même socle technique.
- Divi doit rester l'atelier principal ; Page réelle plus large que la composition ; modules natifs et CSS Page/Site préservés ; Bibliothèque volontaire.
- Résultat : recommandations des sections 1–15, étayées par lecture ciblée du code Manager et des schémas. Plugin Bridge non audité dans cette passe.
- Aucun code modifié ni contrôle technique relancé pour cette réflexion.
- Prochaine action : confronter les arbitrages au vrai Bridge et obtenir l'autorisation explicite du premier lot.

### 2026-09-27 — COORD-001 — Publication et suivi partagé demandés

- Origine : Carlos : ancrer la feuille de route sur GitHub, fournir le moyen d'informer l'autre agent et consigner les prochains échanges/consignes dans ce fichier.
- Type : consigne documentaire validée ; **n'autorise pas l'implémentation des lots**.
- Action : création du présent document et liens depuis `AGENTS.md` et `PROJECT_STATUS.md`. Publication autorisée sur `feature/project-blueprints-v1`, sans fusion dans main.
- Contrôles préalables : checkout propre au socle attendu ; après fetch origin, divergence HEAD/suivi distant `0 / 0`.
- Validation prévue de cette modification documentaire : revue du diff et `git diff --check` ; aucun test applicatif nécessaire. Le commit de publication et son état distant seront communiqués avec le transfert ; ne pas considérer cette entrée seule comme preuve de push.
- Prochaine action : transmettre le lien à l'autre agent ; lui demander de lire le journal et de rendre son analyse/les arbitrages nécessaires avant tout développement. Responsable de la transmission : Carlos.


### 2026-09-27 — BRIDGE-AUDIT-001 — Confrontation de la roadmap au code Bridge 0.8.0

- Auteur/rôle : agent Manager/Bridge ChatGPT, audit en lecture seule demandé par Carlos après retranscription des propositions Codex dans la roadmap.
- Type : résultat d’audit + écarts ; **aucune autorisation de développement**.
- Base Manager vérifiée : `feature/project-blueprints-v1` @ `ea866775b35db089279c363a264d40720375fdd0`.
- Base Bridge inspectée : dépôt `atoumweb-prog/atoumweb-bridge`, branche `feature/workbench-occurrence-v1` @ `36d1076dbac1f031356632d8b95427e0ee58739c`, plugin déclaré **0.8.0**. Le `main` Bridge courant ne contient qu’un README ; il ne doit pas être pris comme baseline du code fonctionnel.
- Point confirmé : Bridge conserve le flux Workbench-first, crée un brouillon WordPress distinct, une `siteOccurrenceId` Bridge par composant et n’écrit pas en production. `actionPolicy=manager_decides` reste cohérent avec la Bibliothèque volontaire.
- Écart contrat destination : `atoumweb_bridge_project_package` n’accepte actuellement que `schemaVersion=1`, exige `composition.id` + `composition.name` et 1 à 50 composants. Il ne transporte pas `scope=page`, `projectId`, `siteId`, `pageId` ni `exportId`. Le futur contrat Page doit donc être versionné/additif et préserver V1.
- Écart Page hybride : le Workbench projet actuel est construit uniquement avec les composants Manager importés, chacun dans un module Code distinct. Cela convient comme préparation partielle, mais Bridge ne fusionne pas encore ce package dans une Page/Workbench existant. Une Page sans composant Manager ne doit donc pas produire de package ; elle reste valide côté Manager.
- Écart idempotence d’import : l’empreinte SHA-256 du package est enregistrée dans la provenance, mais aucun contrôle global ne réutilise/refuse actuellement un Workbench projet déjà importé avec la même empreinte. L’idempotence actuelle des occurrences ne vaut qu’à l’intérieur d’un même Workbench déjà créé.
- Écart identité d’occurrence ↔ module Divi : Bridge crée bien une `awocc:...` distincte par composant et conserve `compositionItemId`/ordre dans les metas du Workbench. En revanche, le module Divi créé porte surtout un `admin_label="AWB Project — <nom>"` ; l’`occurrenceId` n’est pas actuellement embarquée comme marqueur stable dans le module lui-même. Après déplacement ou duplication dans Divi, la correspondance occurrence ↔ nœud réel peut donc devenir ambiguë. Ce point doit être tranché avant LOT 8A.
- Écart retour multi-composants : `AWB_Site_Occurrence::build_return_zip()` refuse aujourd’hui les Workbenches `manager_project` et réserve Occurrence Return V1 aux Workbenches `manager_library`. La documentation Bridge 0.8.0 indique elle-même que les Occurrence Returns individuels du package projet restent hors convention 0.1. Le round-trip multi-composants reste donc à développer plus tard ; ne pas le considérer comme acquis.
- Observation hybride confirmée partiellement : le scanner Bridge lit tous les shortcodes Divi 4 `et_pb_*`, reconstruit section/row/column/module, conserve attributs, champs responsive/design, classes et IDs ; il capture aussi CSS/JS de page, `_et_pb_custom_css`, sources globales WordPress/Divi et contexte Theme Builder connu. Les avertissements du scanner indiquent toutefois que les affectations Theme Builder et les presets/couleurs/polices globales Divi restent partiellement normalisés. La couverture doit donc être déclarée dans les retours et testée sur fixtures réelles, comme proposé dans 8B.
- Arbitrages §14 : (1) Page = nœud Projet + extension reste compatible avec Bridge ; (2) composition facultative/partielle est compatible conceptuellement ; (3) Site logique Manager doit rester distinct du `siteKey/siteUrl` de l’installation Bridge ; (4) occurrence durable est pertinente mais nécessite un marqueur stable côté Divi ; (5) enveloppe Page versionnée est nécessaire ; (6) promotion volontaire est déjà alignée ; (7) réimport Workbench/idempotence nécessite encore une vraie règle de package.
- Blocage actuel : aucun blocage pour poursuivre la réflexion Manager 6A/6B, mais **ne pas implémenter 8A/8B/8C avant décision sur l’identité stable d’une occurrence dans le contenu Divi et sur la version du contrat Page**.
- Prochaine action : Carlos/agents valident ou corrigent les arbitrages §14 à la lumière de ces écarts. Aucun code Manager ou Bridge à modifier sans autorisation explicite.


### 2026-09-28 — ROADMAP-CLEAN-001 — Roadmap réalignée sur le Bridge réellement implémenté

- Auteur/rôle : agent Manager/Bridge ChatGPT, sur autorisation de Carlos de nettoyer le document après BRIDGE-AUDIT-001.
- Type : correction documentaire + clarification d’architecture ; **aucun développement autorisé ni commencé**.
- Base avant modification : `feature/project-blueprints-v1@d7ef19827e3c9f88024355a5f73c8b4989b45b20`.
- Action : sections 0, 2, 4, 6, 8, 12, 13, 14 et 15 réalignées sur le code réel Bridge 0.8.0.
- Capacités désormais marquées comme existantes et à conserver : package projet V1 multi-composants, Workbench unique, modules Code séparés, `siteOccurrenceId` Bridge par composant, `compositionItemId`, baselines, scanner Divi large, Workbench-first, `manager_decides`.
- Travaux restant explicitement isolés : destination Projet/Site/Page, enveloppe Page versionnée, `exportId` et idempotence d’import, marqueur stable d’occurrence dans Divi, validation/corrélation du scanner hybride, retour multi-composants `manager_project`.
- Simplification : aucun `occurrenceId` Manager supplémentaire ne doit être créé par défaut. Le couple de continuité visé est `compositionItemId` côté Manager puis `siteOccurrenceId` créée par Bridge, avec association persistée.
- Lots 8A/8B/8C resserrés pour compléter l’existant au lieu de le reconstruire.
- Prochaine action : validation explicite des arbitrages §14, en priorité 1, 4 et 5, avant autorisation de tout lot de code.


### 2026-09-28 — LOT6A-START-001 — Autorisation et démarrage du Lot 6A

- Origine : autorisation explicite de Carlos après validation de la feuille de route commune.
- Auteur/rôle : agent ChatGPT responsable de l’implémentation du Lot 6A.
- Type : décision + consigne d’exécution.
- Base de départ : `feature/project-blueprints-v1@be9d936ac5fae7b5b88b0f3402bb1095da0eb531`.
- Lot autorisé : **6A — Projet / Site / Page uniquement**.
- Périmètre : entité Site opérationnelle, extension des nœuds Projet `displaySubtype=page`, création/édition/archivage manuel, contrôles d’appartenance Projet/Site/Page, API/UI minimale et tests ciblés.
- Hors périmètre : composition/rattachement Bibliothèque (6B), génération automatique blueprint (7), contrat Page/Bridge et occurrences (8A+), toute modification du dépôt Bridge.
- Stratégie Git : développement isolé sur `feature/project-sites-v1`, puis validation avant toute intégration dans `feature/project-blueprints-v1`.
- Prochaine action : implémenter migration 47 et Lot 6A ; aucun autre lot ne doit être commencé implicitement.


### 2026-09-28 — LOT6A-IMPL-001 — Implémentation du Lot 6A publiée sur branche dédiée

- Auteur/rôle : agent ChatGPT, implémentation sur `feature/project-sites-v1`.
- Type : résultat d’implémentation ; périmètre 6A uniquement.
- Base : branche créée depuis `cc0a557beca451ffe0c7fd0bbfc3856b3eb6ff13`.
- Implémenté : migration 47 `project_sites_pages_v1`, service Site/Page, contrôles inter-projets et subtype Page, protection contre le retypage d’une Page liée, IPC/preload/types, onglet Projet « Sites & pages », création manuelle d’un nœud Page depuis le plan et tests ciblés du service.
- Archivage : un Site archivé reste en base et conserve ses rattachements Page ; aucune suppression de Site n’est exposée par l’UI.
- Hors périmètre préservé : aucune composition 6B, aucun blueprint Lot 7, aucun contrat ou code Bridge 8A+.
- Validation : code publié pour contrôle ; les tests/typecheck doivent être exécutés sur le workspace MSI avant intégration dans `feature/project-blueprints-v1`.
- Prochaine action : checkpoint technique ciblé migration 47 + ProjectSiteService + ProjectService, puis recette visuelle Sites & pages. Ne pas lancer 6B avant validation explicite.


### 2026-09-28 — LOT6A-TECH-VALID-001 — Checkpoint technique MSI vert

- Validation exécutée localement sur MSI par Carlos.
- Branche : `feature/project-sites-v1`.
- HEAD validé : `e6561ab69907a32e7e255e841070dca9a45a08db`.
- Working tree : propre avant validation.
- `npm run typecheck` : réussi.
- Tests ciblés exécutés : `ProjectSiteService.test.ts`, `ProjectService.test.ts`, `migrations.test.ts` ; résultat communiqué : **tout vert**.
- Statut : socle technique du Lot 6A validé.
- Non encore validé : application réelle des migrations 44–47 sur Validation-MSI et recette visuelle/fonctionnelle de l’onglet « Sites & pages ».
- Hors périmètre inchangé : aucun Lot 6B, 7 ou 8 lancé.
- Prochaine action : lancer le Manager sur le workspace Validation-MSI, confirmer les migrations 44–47, puis effectuer la recette manuelle du Lot 6A avant toute intégration.


### 2026-09-28 — LOT6A-UX-001 — Corrections de recette Sites & pages

- Origine : recette visuelle de Carlos sur Validation-MSI après passage à 47 migrations.
- Constats : liste de Pages non scrollable ; libellé « Domaine souhaité » ambigu ; « Chemin souhaité » ambigu alors qu’il s’agit du slug/chemin URL ; placeholder /contact trompeur sur les Pages non rattachées.
- Correction : scrollbar interne sur la liste de Pages ; libellés « Nom de domaine prévu » et « Slug / chemin URL » ; aide par exemples ; champ slug désactivé tant que la Page n’est pas rattachée.
- Règle métier clarifiée : une Page au rôle Accueil reçoit toujours le chemin `/`; `/` est réservé à l’Accueil.
- Périmètre : correction Lot 6A uniquement ; aucun démarrage 6B/7/8.
- Validation restante : typecheck + tests ciblés ProjectSiteService, puis nouvelle capture/recette visuelle.


### 2026-09-28 — LOT6A-UX-002 — Harmonisation UX Sites & pages avec Production

- Origine : recette visuelle de Carlos ; l’écran fonctionnait mais restait trop proche d’une table d’administration et ne proposait pas d’action directe de création/ouverture d’une Page.
- Décision : l’écran « Sites & pages » adopte la même logique d’interaction que Production : arborescence scrollable à gauche, fiche détaillée à droite.
- Actions ajoutées : `+ Site`, `+ Page`, `+ Ajouter une Page` sous un Site et `Ouvrir dans Production` depuis la fiche Page.
- Sémantique : `+ Page` crée uniquement un nœud Page du Projet (et peut le rattacher au Site choisi). Cela **ne crée pas encore une Page WordPress/Divi** et ne démarre pas le Lot 8A.
- Source de vérité préservée : le nom/statut de la Page restent portés par le `project_node`; l’écran Site/Page n’en crée pas une copie.
- Hors périmètre : aucun bouton « Préparer dans Divi » tant que le contrat Page/Bridge n’est pas développé.
- Validation restante : typecheck puis recette visuelle création Page, rattachement Site, renommage et ouverture dans Production.


### 2026-09-28 — LOT6A-UX-003 — Splitter Production + chrono Page dans Sites & pages

- Origine : recette visuelle de Carlos après UX-002.
- Constats : absence de séparateur redimensionnable entre arborescence et fiche ; débordement horizontal visuel ; action « Ouvrir dans Production » insuffisamment mise en évidence ; absence du temps réel et du démarrage direct sur la Page.
- Correction UX : même logique que Production avec splitter central 40/60 redimensionnable de 24 à 68 %, double-clic pour revenir à 40 %, touches gauche/droite et panneaux scrollables indépendamment.
- Correction débordement : conteneurs `min-width:0`, overflow horizontal masqué et arborescence avec ellipsis ; suppression de la barre horizontale parasite.
- Temps Page : la fiche affiche le temps réel cumulé des sessions rattachées au `project_node` Page et indique si son chrono est actif/en pause.
- Actions Page : « Ouvrir la fiche Production », « Démarrer le travail sur cette Page », puis Pause/Reprendre/Arrêter si le chrono actif appartient à cette Page.
- Cohérence globale : un seul chrono reste possible. Si une autre activité est active, le démarrage depuis Sites & pages passe par la confirmation de changement du timer global existant.
- Aucune migration ni nouveau modèle de temps : réutilisation de `time_sessions.project_node_id`.
- Hors périmètre inchangé : aucune création WordPress/Divi, aucun Lot 6B/7/8.
- Validation restante : typecheck puis recette visuelle splitter, scrolls, temps réel et démarrage/changement de chrono.

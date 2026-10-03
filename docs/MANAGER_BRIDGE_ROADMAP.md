# Manager ↔ Bridge — Architecture, feuille de route et journal partagé

Date d'ouverture : 27/09/2026.

## 0. Statut et mode d'emploi pour les agents

**Document de coordination commun. Publication de la feuille de route autorisée ; aucun lot de développement autorisé par cette publication.**

- Dépôt : `atoumweb-prog/atoumweb-manager`.
- Base canonique Manager après clôture 8B : `feature/project-page-compositions-v1@ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81` (vérifiée localement le 03/10/2026).
- Base canonique Bridge après clôture 8B annoncée par AtoumWeb : `feature/workbench-occurrence-v1@d1ecf89dab4f48230269a0cb10fb796f33c60bfc`, plugin **0.8.4**. Aucun travail Bridge pendant le chantier contractuel.
- Priorité courante : **Contrats Lot 3 — reprise du catalogue commercial**, autorisé après clôture locale des Lots 1/2. HEAD local `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9` ; Lot 3 testé mais non committé. Huit décisions métier closes : aucune reprise directe des anciens objets ambigus. Nouveau dry-run complet présenté avant toute écriture réelle ; feu vert séparé requis. Lot 4, Lot 8C et travail Bridge suspendus.
- Checkpoint Lots 7 + 8A validé : typecheck Manager, **37/37 tests ciblés**, **346/346 tests complets**, recettes Manager/Bridge et Workbench multi-composants validées. Les lots suivants restent soumis à autorisation explicite.
- PR #74 / CGV Builder déjà intégrée : ne pas la fusionner à nouveau.
- Les choix ci-dessous sont les recommandations issues de l'audit. Les arbitrages de la section 14 doivent être confirmés avant implémentation ; un lot nécessite une autorisation explicite.
- Ce document complète le cahier des charges ; il ne remplace pas `PROJECT_STATUS.md`, qui résume l'avancement réellement vérifié.
- Code Bridge confronté à la roadmap : dépôt `atoumweb-prog/atoumweb-bridge`, branche fonctionnelle et base canonique indiquées ci-dessus. Le `main` Bridge n'est pas la baseline fonctionnelle.

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

### Publication contrôlée vers une Page WordPress finale

La publication future reste une responsabilité Bridge et une action humaine explicite. Le parcours cible est :

```text
Workbench validé
→ sélection explicite de la Page WordPress cible
→ snapshot avant
→ injection atomique ou compensée du contenu Divi
→ installation des CSS/JS gérés dans Divi Child
→ contrôle front
→ snapshot après
→ enregistrement de la provenance
→ rollback complet disponible
```

La destination est résolue à partir des identités stables `projectId`, `siteId` et `pageId` transportées par le package Page. Le nom du Workbench, le titre WordPress, le slug ou l'URL peuvent aider l'utilisateur à reconnaître la cible, mais ne constituent jamais une preuve d'identité. Workbench et Page finale restent deux objets distincts. Aucun Workbench validé ne déclenche une écriture Production automatique.

### Cycle de vie CSS/JavaScript géré par Bridge

Le placement cible reste : HTML dans Divi ; CSS/JS dans le Divi Child AtoumWeb sous `assets/atoumweb/css|js/components|pages|global`. Avant toute publication Production, Bridge doit tenir un registre des assets qu'il gère avec :

- un identifiant technique stable indépendant du nom de fichier affiché ;
- un scope et un propriétaire explicites : `component`, `page` ou `global` ;
- la provenance Manager/Bridge, la version et l'empreinte du contenu ;
- les occurrences/Pages utilisatrices ou un comptage traçable de leurs références ;
- un historique de révisions permettant de restaurer l'ensemble HTML/CSS/JS cohérent.

Un remplacement ou retrait décrémente les références. Un asset encore référencé reste installé. À zéro utilisation, il devient `orphaned` et seulement éligible à un nettoyage explicite : prévisualisation de l'impact, contrôle de l'empreinte et confirmation humaine. Un fichier modifié manuellement, inconnu du registre ou déclaré comme override humain n'est jamais écrasé ni supprimé implicitement. Bridge distingue donc strictement les assets `managed` des fichiers/overrides non gérés.

Le remplacement d'une version se prépare et se teste d'abord dans un Workbench. La publication installe le nouvel ensemble puis retire seulement les références à l'ancien. Le rollback restaure le contenu Divi **et** la révision correspondante de tous les CSS/JS gérés ; restaurer uniquement le HTML est insuffisant.

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

Le préalable de lecture du vrai Bridge est **réalisé**. Le package Page V2 et l'idempotence sont validés dans le checkpoint 8A. La corrélation durable avec le nœud Divi réel reste à valider/compléter dans 8B.

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
→ 10 Registre et cycle de vie des assets Divi Child
→ 11 Publication contrôlée Workbench → Page finale
→ checkpoint final
```

Le checkpoint canonique couvre désormais 6A, 6B, 7 et 8A. Le prochain lot de code recommandé est 8B. Les Lots 10 et 11 restent futurs : le registre d'assets doit être validé avant toute première écriture contrôlée vers une Page finale.

Tous les lots restent **non autorisés** tant que Carlos ne donne pas son accord explicite.

## 13. Lots détaillés

### Préalable — Contrat partagé Manager/Bridge — réalisé

- État : checkpoint Manager/Bridge 8A validé sur les bases canoniques de la section 0.
- Confirmé : package Page V2, `exportId`, destination Projet/Site/Page, Workbench unique multi-composants, `siteOccurrenceId` par composant, idempotence et Workbench-first.
- Restant pour 8B : valider/compléter le marqueur technique permettant de retrouver `siteOccurrenceId` dans le nœud Divi réel après déplacement/duplication.
- Migrations : aucune.
- Validation restante : déplacement, duplication et observation du marqueur sur fixtures Divi réelles ; le retour multi-composants relève de 8C.
- Dépendance : aucun blocage contractuel pour démarrer 8B après autorisation.

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

- État : réalisé et validé dans le checkpoint canonique du 30/09/2026.
- Objectif : compléter l’import multi-composants existant pour qu’il représente explicitement une préparation partielle de Page et soit réimportable sans doublon silencieux.
- À conserver : `atoumweb_bridge_project_package` V1, Workbench unique, modules Code séparés, création Bridge des `siteOccurrenceId`, baselines et provenance.
- Changements réalisés : enveloppe Page V2 ; `exportId` ; `projectId/siteId/pageId` ; contrôle d’import antérieur ; association `compositionItemId ↔ siteOccurrenceId`. La validation/corrélation du marqueur dans le nœud Divi réel relève de 8B.
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

### LOT 10 — Registre et cycle de vie des assets Divi Child

- Objectif : préparer la future publication sans accumuler de CSS/JS orphelin et sans toucher aux fichiers humains.
- Changements : registre Bridge des assets `managed`, identité stable, scope/propriétaire, provenance/version/hash, références d'utilisation, révisions, états actif/orphelin et opération explicite de nettoyage sûre.
- Stockage cible : `assets/atoumweb/css|js/components|pages|global`, sans revendiquer les fichiers inconnus ou overrides humains.
- Règles : remplacement atomique ou compensé ; décrément des références ; aucune suppression à zéro référence sans contrôle d'empreinte, aperçu d'impact et confirmation ; conflit manuel signalé sans écrasement.
- Tests/acceptation : asset partagé conservé tant qu'une Page l'utilise ; retrait final marqué orphelin ; nettoyage explicite ; fichier modifié manuellement protégé ; rollback restaurant la révision CSS/JS complète.
- Dépendance : 8B pour l'observation fiable des usages et 9 pour les dépendances multi-pages. Prérequis du Lot 11.

### LOT 11 — Publication contrôlée Workbench → Page WordPress finale

- Objectif : appliquer volontairement un Workbench validé sur une Page WordPress cible, avec preuve, contrôle front et rollback complet.
- Parcours : destination stable Projet/Site/Page → snapshot avant → injection Divi → déploiement des assets gérés par le Lot 10 → contrôle front → snapshot après → provenance → rollback.
- Sécurité : sélection et validation humaines obligatoires ; aucune déduction depuis un nom/slug ; aucune publication automatique ; aucune confusion entre Workbench et Page finale.
- Atomicité : en cas d'échec du contenu Divi, des assets ou du contrôle, restaurer l'état précédent ou conserver un état explicitement incomplet et réparable, jamais un succès silencieux.
- Tests/acceptation : bonne destination malgré renommage ; mauvaise identité refusée ; snapshot avant/après ; CSS/JS cohérents avec le HTML ; rollback du triplet HTML/CSS/JS ; répétition contrôlée sans duplication ; production intacte avant confirmation.
- Dépendance : Lots 8C, 9 et 10 validés.

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
4. **Identité d’occurrence** — le couple `compositionItemId` puis `siteOccurrenceId` est validé sans second identifiant Manager. Le marqueur/corrélateur dans le nœud Divi réel et la règle de duplication relèvent de 8B.
5. **Enveloppe Page versionnée** — `atoumweb_bridge_project_package` schemaVersion 2 avec `scope=page`, `exportId` et destination Projet/Site/Page est validé par 8A.
6. **Conservation locale par défaut, promotion Bibliothèque volontaire** — validée métier et alignée avec `actionPolicy=manager_decides`.
7. **Idempotence** — validée en 8A : même ZIP rouvert sans doublon ; même `exportId` avec contenu différent refusé.
8. **Scanner hybride** — existe déjà largement. 8B est un lot de validation/corrélation/complément, pas un nouveau scanner.
9. **Retour multi-composants** — explicitement absent aujourd’hui pour `manager_project`; relève de 8C et ne doit pas être supposé acquis.
10. **Assets Divi Child** — registre Bridge dédié en Lot 10, avec références, historique, protection des overrides humains et nettoyage explicite uniquement.
11. **Publication Production** — couche Bridge dédiée en Lot 11, après le multi-pages et le cycle de vie des assets ; action humaine, destination par identités stables et rollback HTML/CSS/JS.

## 15. Recommandation d'exécution

Le checkpoint 7 + 8A est la base canonique. Continuer par 8B pour fiabiliser l'observation et la corrélation réelles, puis 8C pour le retour multi-composants et 9 pour la préparation multi-pages. Construire ensuite le registre d'assets du Lot 10 avant d'autoriser le parcours de publication contrôlée du Lot 11.

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


### 2026-09-28 — LOT6B-DESIGN-001 — Création directe de composants depuis une Page

- Origine : demande métier de Carlos avant démarrage du Lot 6B.
- Statut : décision fonctionnelle à intégrer au périmètre 6B ; **aucun développement 6B encore autorisé par cette entrée seule**.
- Principe : depuis la fiche d’une Page dans « Sites & pages », l’utilisateur peut soit sélectionner un composant existant de la Bibliothèque AtoumWeb, soit créer directement un nouvel élément réutilisable sans quitter le contexte de la Page.
- Cas 1 — réutilisation : « Ajouter depuis la Bibliothèque » ouvre le catalogue des éléments réutilisables et permet d’ajouter une version précise à la composition partielle de la Page.
- Cas 2 — création : « Créer un composant / une section » ouvre un éditeur permettant de coller ou saisir un code complet (HTML/CSS/JS et métadonnées disponibles selon le type), de visualiser le rendu/code avec les capacités déjà présentes dans la Bibliothèque, puis d’enregistrer :
  - soit comme **nouvel élément** de Bibliothèque ;
  - soit comme **nouvelle variante / déclinaison** rattachée à un modèle/famille existant ;
  - soit comme élément local de travail tant qu’il n’est pas promu.
- Cas d’usage attendu : Carlos fournit les informations d’un Hero ; un agent peut produire le code complet ; ce code est collé dans l’éditeur depuis la Page ; l’utilisateur choisit ensuite « Nouveau composant » ou « Rattacher à un modèle / variante ».
- Règle d’identité : si le code correspond à une déclinaison d’un modèle existant, conserver la famille/modèle source et créer une variante distincte plutôt qu’écraser le modèle.
- Règle Bibliothèque : aucune création ou promotion ne doit être implicite. L’utilisateur choisit explicitement si l’élément devient réutilisable.
- Règle Page hybride : une Page peut contenir simultanément composants AtoumWeb, éléments créés localement puis promus, et modules Divi natifs non suivis par la Bibliothèque.
- UX cible 6B : dans la fiche Page, bloc « Composants AtoumWeb » avec liste ordonnée, aperçu/code, actions Ajouter depuis la Bibliothèque, Créer un composant/section, Réordonner, Retirer, Ouvrir la fiche Bibliothèque.
- Hors périmètre 6B : aucune génération WordPress/Divi, aucun package `scope=page`, aucun envoi Bridge ; cela reste 8A+.
- Prochaine action : valider explicitement le démarrage du Lot 6B avant toute modification de code.


### 2026-09-28 — LOT6B-DESIGN-002 — Vue globale assemblée de la Page

- Origine : demande métier de Carlos avant démarrage du Lot 6B.
- Statut : exigence fonctionnelle à intégrer au Lot 6B ; aucun développement lancé par cette entrée seule.
- Besoin : lorsqu’une Page contient plusieurs composants AtoumWeb (ex. 10 modules/sections), l’utilisateur doit pouvoir voir une prévisualisation globale assemblée dans l’ordre réel de la composition, sans ouvrir chaque composant séparément.
- Réutilisation technique : la Bibliothèque possède déjà un visualiseur HTML sandboxé par iframe et les compositions connaissent pour chaque item la version source exacte. Le Lot 6B doit réutiliser ces briques, pas créer un nouveau moteur de rendu.
- UX cible : bouton « Aperçu de la Page » ou « Voir la composition complète » depuis la fiche Page ; ouverture d’une vue large/plein écran montrant les composants concaténés dans l’ordre, avec possibilité Desktop / Tablette / Mobile et retour rapide à la liste.
- La vue doit permettre d’identifier les limites entre composants en mode inspection, sans imposer ces repères dans l’aperçu visuel normal.
- Sémantique importante : avant retour Bridge, cette vue est **l’aperçu de la composition AtoumWeb préparée**, pas nécessairement la Page Divi complète. Une Page hybride peut aussi contenir modules Divi natifs, spacing ou CSS ajoutés directement dans Divi et inconnus du Manager à ce stade.
- Après scan/retour Bridge, une future vue peut distinguer clairement :
  1. « Composition préparée par Manager » ;
  2. « Page réelle observée dans Divi ».
- Rendu : concaténer les HTML/CSS/JS compatibles de chaque version sélectionnée dans un document d’aperçu isolé ; éviter toute mutation du code source ou de la Bibliothèque.
- Erreurs : un composant non prévisualisable doit apparaître comme bloc signalé dans l’aperçu/inspection plutôt que faire échouer toute la Page.
- Performance : prévoir un rendu paresseux/recalcul uniquement après modification de la composition ou sur demande, afin qu’une Page de nombreux composants reste fluide.
- Hors périmètre : ne pas prétendre reproduire les wrappers/spacing Divi réels avant Bridge ; la fidélité complète à la Page Divi reste un objectif des lots 8B/8C.
- Prochaine action : intégrer cette vue au cahier des charges détaillé 6B au moment où Carlos autorisera explicitement son démarrage.


### 2026-09-28 — LOT6B-START-001 — Démarrage autorisé du Lot 6B

- Origine : autorisation explicite de Carlos (« je te laisse continuer ») après validation des exigences DESIGN-001 et DESIGN-002.
- Branche d’implémentation : `feature/project-page-compositions-v1`, créée depuis `feature/project-sites-v1@661485a23445d521fab3628aed20c6c3aa9c86be`.
- Sous-checkpoint 6B.1 implémenté : migration 48 `project_page_compositions_v1` ; zéro ou une Composition par Page ; une Composition ne peut appartenir qu’à une seule Page ; anciennes compositions laissées non rattachées par défaut.
- API 6B.1 : retrouver, créer automatiquement, rattacher ou détacher une Composition depuis un `project_node` Page.
- Hors périmètre inchangé : aucun package Page/Bridge, aucune création WordPress/Divi, aucun Lot 7/8.
- Étapes suivantes du même Lot : 6B.2 catalogue/réordonnancement, 6B.3 création directe/déclinaison, 6B.4 aperçu global.


### 2026-09-28 — LOT6B-IMPL-001 — Composition partielle de Page implémentée sur branche dédiée

- Branche : `feature/project-page-compositions-v1`.
- Migration : **48 — `project_page_compositions_v1`**.
- 6B.1 : une Page Projet peut avoir zéro ou une Composition AtoumWeb ; une Composition rattachée ne peut appartenir qu’à une seule Page ; les compositions historiques restent non rattachées tant que l’utilisateur ne les choisit pas.
- 6B.2 : depuis la fiche Page, bloc « Composants AtoumWeb » avec ajout depuis la Bibliothèque, recherche, ordre, montée/descente, retrait sans mutation de la source et rattachement explicite d’une composition historique.
- 6B.3 : éditeur direct HTML/CSS/JS avec aperçu sandboxé. Deux parcours validés :
  - créer un **nouvel élément réutilisable** avec famille + variante base, version stable et ajout immédiat à la Page ;
  - créer une **déclinaison complète** d’un modèle existant, sous forme de variante `forked`, sans écraser la source.
- Règle de validation : la création directe est une action humaine explicite ; le composant est marqué prêt/stable et conserve une identité Famille/Variante.
- Règle verticale : une famille `vertical` conserve son métier lors de la création d’une déclinaison.
- 6B.4 : « Aperçu de la Page » assemble les versions exactes des composants dans l’ordre ; modes Desktop/Tablette/Mobile + mode Inspection ; composants non prévisualisables signalés sans faire échouer tout le rendu.
- Sécurité aperçu : HTML/CSS rendus dans un iframe sandboxé ; JavaScript conservé/inspectable mais **non exécuté** dans l’aperçu Manager.
- Distinction maintenue : l’aperçu est celui de la **composition préparée par Manager**, pas encore celui de la Page Divi réelle.
- Choix de simplification : le mode « élément local hors Bibliothèque » évoqué dans DESIGN-001 n’est pas implémenté à ce stade, car il créerait une deuxième source de vérité technique. Les besoins exprimés par Carlos (« nouvel élément » ou « déclinaison ») sont couverts par le modèle versionné existant.
- Hors périmètre : aucun export `scope=page`, aucun `exportId`, aucun envoi Bridge, aucune création WordPress/Divi, aucun Lot 7/8.
- Validation restante : typecheck + tests ciblés migrations / CompositionService / TechnicalLibraryService, puis recette visuelle sur Validation-MSI avant intégration.


### 2026-09-28 — LOT6B-UX-001 — Corrections de recette Bibliothèque / éditeur direct

- Origine : recette visuelle de Carlos sur la branche 6B.
- Constats :
  - fin de la liste de droite difficile/inaccessible ;
  - barre horizontale parasite en bas ;
  - Bibliothèque Page n’affichant que les éléments prêts, donnant l’impression que des composants avaient disparu ;
  - ajout multiple du même CTA bien enregistré mais ambigu visuellement ;
  - éditeur direct trop contraint par les trois zones HTML/CSS/JS et hauteur de fenêtre.
- Correction :
  - Bibliothèque ouverte dans une vraie modale scrollable ;
  - création directe ouverte dans une vraie modale scrollable ;
  - suppression des largeurs minimales responsables du débordement horizontal ;
  - affichage de tous les éléments visuels de Bibliothèque avec statut ; seuls les éléments prêts restent ajoutables ;
  - compteur « prêts / éléments visuels » ;
  - occurrences du même composant numérotées explicitement dans la composition ;
  - mode « Code complet » acceptant HTML + <style> + <script>, avec action « Analyser et répartir le code » vers HTML/CSS/JavaScript.
- Le doublon CTA n’était pas perdu : le service Composition autorise plusieurs occurrences du même composant ; le problème était uniquement l’affichage/scroll.
- Validation restante : typecheck + recette visuelle sur MSI.

### 2026-09-28 — LOT6B-DESIGN-003 — Préparation locale des textes et couleurs par occurrence

- Origine : proposition de Carlos pendant la recette 6B.
- Besoin : avant passage WordPress/Divi, pouvoir préparer une occurrence de composant en modifiant ses textes, liens et couleurs, tout en gardant la Bibliothèque source intacte.
- Direction retenue : les personnalisations appartiennent à **l’occurrence dans la Composition**, jamais au modèle source.
- Cible UX : action « Préparer ce bloc » depuis la liste Page, avec aperçu immédiat et contrôles pour les champs explicitement configurables.
- Champs visés en priorité : titres, textes, libellés/boutons, URLs, couleurs principales/secondaires, éventuellement images lorsque le composant les déclare.
- Stockage cible : overrides/configuration structurés au niveau `atoumweb_composition_items`, versionnés séparément de la version Bibliothèque source.
- Principe de sécurité : ne pas tenter une réécriture arbitraire de n’importe quel HTML/CSS. Les composants doivent déclarer des champs configurables ou des tokens explicites ; les overrides sont appliqués au rendu préparé et seront transportables plus tard vers Bridge.
- Intérêt : partir dans Divi avec une base déjà contextualisée (textes/couleurs du client), puis n’utiliser Divi que pour le réglage final.
- Hors périmètre immédiat de la correction UX-001 : cette personnalisation sera développée après validation du flux création directe + aperçu.


### 2026-09-28 — LOT6B-DESIGN-004 — Réglages locaux d’occurrence et promotion en variante

- Origine : précision métier de Carlos pendant la recette 6B.
- Besoin : une Page construite avec des blocs AtoumWeb doit pouvoir être préparée en amont avant WordPress/Divi : textes, libellés, liens, couleurs et autres valeurs simples doivent pouvoir être adaptés localement si l’utilisateur le souhaite.
- UX : chaque occurrence de composant dans la Page possède un volet **« Réglages du bloc »** replié par défaut. L’utilisation de ce volet est facultative ; si aucun réglage n’est saisi, l’occurrence reste strictement basée sur la version Bibliothèque sélectionnée.
- Contenu visé :
  - textes : titre, sous-titre, paragraphes, libellés CTA ;
  - liens : URL/bouton ;
  - couleurs : fond, texte, accent(s), boutons, bordures lorsque le composant les expose ;
  - médias simples lorsque le composant les déclare comme configurables ;
  - valeurs locales supplémentaires définies explicitement par le composant.
- Règle de source de vérité : les réglages sont stockés **sur l’occurrence de composition**, jamais dans la version Bibliothèque source. Le modèle reste immuable.
- Aperçu : l’aperçu du composant et l’aperçu global de Page appliquent les réglages locaux afin de montrer la version préparée réellement attendue avant Divi.
- Modification avancée : si l’utilisateur modifie le code ou réalise une adaptation qui dépasse les simples réglages, l’occurrence est considérée comme une adaptation locale dérivée du modèle source.
- Action **« Envoyer vers la Bibliothèque comme variante »** :
  - crée un nouvel élément/variant lié à la Famille et au modèle source ;
  - copie le rendu/code adapté de l’occurrence ;
  - ne modifie jamais le modèle source ;
  - crée la variante avec un statut **à valider / non prête à réutiliser** par défaut ;
  - demande ensuite une validation humaine explicite avant de passer la variante en « prête à réutiliser ».
- Le bouton de promotion n’est jamais automatique : une adaptation locale peut rester uniquement dans cette Page pendant toute la vie du Projet.
- Proposition d’état : variante créée depuis une occurrence locale → `reuseStatus='adapt'` tant qu’elle n’a pas été relue/validée ; passage à `ready` uniquement via action explicite.
- Traçabilité : conserver source item/version, famille/variante d’origine, Page/Projet d’origine, date de promotion et relation « dérivée de ».
- Intégration future Bridge : les overrides locaux devront être transportables sans réécrire la provenance de la Bibliothèque. Le mapping exact vers le contrat Page/Bridge reste réservé à 8A+.
- Hors périmètre immédiat : ne pas inventer de modification automatique de n’importe quel CSS/HTML. Les réglages simples doivent reposer sur des champs/tokens explicitement exposés par le composant ; l’édition libre de code reste une action avancée séparée.


### 2026-09-28 — LOT6B-LOCAL-SETTINGS-001 — Réglages locaux et promotion en variante implémentés

- Origine : autorisation de Carlos de réaliser DESIGN-004 avant recette.
- Migration : **49 — `project_page_composition_local_settings_v1`**.
- Chaque occurrence de `atoumweb_composition_items` peut désormais conserver :
  - HTML local préparé ;
  - CSS local préparé ;
  - JavaScript local préparé ;
  - métadonnées de réglages (textes/couleurs/note) ;
  - date de dernière adaptation locale.
- Source de vérité préservée : `source_item_id` et `source_version_id` restent inchangés. Réinitialiser l’occurrence supprime uniquement l’adaptation locale.
- UX : bouton repliable **« Réglages ▾ »** sur chaque occurrence.
- Réglages rapides :
  - détection des textes visibles simples dans le HTML ;
  - détection des couleurs CSS simples ;
  - modification locale avec aperçu immédiat ;
  - note locale facultative.
- Mode avancé : HTML/CSS/JS de l’occurrence restent éditables librement dans le volet.
- Aperçus : « Code / aperçu » et « Aperçu de la Page » utilisent maintenant l’état local préparé lorsqu’il existe ; sinon la version Bibliothèque figée.
- Promotion : bouton **« Envoyer vers la Bibliothèque »** depuis le volet de réglages.
- La promotion :
  - crée une nouvelle variante `forked` dans la famille du composant source ;
  - ne modifie jamais le modèle source ;
  - utilise le code local préparé ;
  - crée l’élément Bibliothèque avec `reuseStatus='adapt'` ;
  - ne marque pas la version stable ;
  - ajoute le marqueur `manager-variant-to-review` ;
  - conserve une note de provenance Projet/Page/occurrence.
- Validation humaine obligatoire avant passage ultérieur à `ready`.
- Hors périmètre : aucun export Page/Bridge, aucune mutation WordPress/Divi, aucun Lot 7/8.
- Validation restante : typecheck, migrations, tests Composition/Library puis recette visuelle de Carlos sur Validation-MSI.


### 2026-09-28 — LOT6B-FIX-002 — Retour d’identité d’une variante non stable

- Détecté par le checkpoint MSI après LOCAL-SETTINGS-001 : 33/34 tests réussis, échec du test de promotion locale car `variantMode` retournait `null` au lieu de `forked`.
- Cause : `createVariantCode()` créait bien la ligne `atoumweb_component_variants`, mais lorsque `markStable=false`, l’objet retourné était encore celui chargé avant cette insertion d’identité.
- Correction : rechargement systématique de l’élément après insertion de la variante lorsqu’elle n’est pas marquée stable.
- Aucun schéma ni contrat modifié ; migration 49 inchangée.
- Validation attendue : typecheck + tests ciblés CompositionService / TechnicalLibraryService / migrations.


### 2026-09-28 — LOT6B-UX-002 — Scroll colonne droite, aperçu et historique local

- Origine : recette visuelle de Carlos après migration 49.
- Défaut structurel identifié : `ProjectSitesTab` vivait dans la troisième ligne `minmax(0,1fr)` de la Page Projet tout en imposant à son workspace une hauteur propre. L’ensemble dépassait l’espace réellement disponible, ce qui coupait le bas du panneau droit et favorisait un débordement horizontal.
- Correction structurelle :
  - `ProjectSitesTab` devient un conteneur flex vertical occupant exactement la hauteur disponible ;
  - `project-sites-workspace` prend uniquement l’espace restant (`flex:1; min-height:0`) au lieu d’imposer une hauteur calculée ;
  - overflow horizontal clipsé à tous les niveaux du workspace 6B ;
  - panneau droit avec scroll vertical indépendant, marge/scroll-padding basse et overscroll contenu ;
  - iframes d’aperçu intégrées non interactives afin que la molette continue de piloter la colonne droite.
- Aperçu global :
  - chaque composant est maintenant enveloppé dans une tranche de Page ;
  - les CSS des composants sont chargés avant les garde-fous de l’iframe ;
  - `html`, `body` et les tranches restent forcés visibles afin qu’un CSS global d’un composant ne puisse masquer tout l’aperçu ;
  - iframe forcée à se recharger lors du changement de device/inspection.
- Réglages couleurs :
  - sélecteur natif visuel à la souris pour les couleurs convertibles en hex ;
  - pastille d’aperçu + saisie CSS manuelle conservée.
- Historique local :
  - boutons Annuler / Rétablir avec historique local borné ;
  - bouton « Version Bibliothèque » pour revenir exactement à la source figée de l’occurrence.
- Aperçu module :
  - aperçu du module seul toujours visible dans le volet ;
  - bouton « Agrandir » / « Voir le module seul » ouvrant une modale grand format indépendante de l’aperçu global de Page.
- Aucune migration supplémentaire : dernière migration = 49.
- Validation restante : typecheck + tests ciblés puis recette visuelle du scroll complet, absence de barre horizontale, aperçu global, couleur, undo/redo/reset et module seul.


### 2026-09-28 — LOT6B-UX-003 — Correction du conteneur global Projets et visibilité Composition

- Origine : recette Carlos montrant encore une barre horizontale globale et l'absence apparente du bloc Composants AtoumWeb.
- Diagnostic corrigé : les fixes UX-001/002 agissaient principalement dans `ProjectSitesTab`, mais la barre horizontale provenait aussi du conteneur global `.content-area` de la page Projets, qui n'avait pas de restriction `overflow-x` contrairement aux workspaces Bibliothèque/Sites.
- Correction :
  - ajout d'une classe `projects-content` au conteneur global lorsque la page active est Projets ;
  - `overflow-x:hidden` appliqué à ce niveau ;
  - `project-production-page` bornée à `width/max-width:100%` avec overflow horizontal interdit ;
  - panneaux Site/Page bornés à 100 % de largeur ;
  - fin de panneau remise dans le flux normal : suppression du `margin-top:auto` sur la note Divi ;
  - chaque enfant du panneau droit reste `flex:0 0 auto`, afin que le scroll vertical atteigne réellement le dernier élément ;
  - bloc `ProjectPageCompositionPanel` déplacé immédiatement sous le résumé Temps réel, avant les champs Page ;
  - badge visible `6B · Composition AtoumWeb` ajouté dans l'en-tête Page pour permettre de vérifier immédiatement que le renderer courant contient bien le correctif.
- Critère recette : après redémarrage sur ce commit, le badge 6B et le bloc Composants AtoumWeb doivent être visibles sans scroller ; aucune barre horizontale globale ne doit rester.


### 2026-09-28 — LOT6B-HANDOFF-CODEX-001 — Reprise critique UX 6B par Codex

- Contexte : Carlos demande à Codex de reprendre la recette/correction UX du Lot 6B après plusieurs itérations. Ne pas considérer les diagnostics précédents comme acquis : repartir du rendu réel et du code actuel.
- Branche canonique de travail : `feature/project-page-compositions-v1`.
- HEAD de référence au moment du handoff : `4bdf3df31ccfc9a84a5f3d08742c002ba6467443`.
- Dernière migration : **49**.
- Blocage visible encore présent : **barre horizontale parasite en bas de la vue Projets / Sites & pages**, confirmée sur la dernière capture utilisateur malgré UX-001/002/003. La cause doit être retrouvée par inspection réelle du layout, pas supposée.
- Scroll colonne droite : considéré **non validé** tant que la fin réelle du contenu n'est pas atteignable sans contournement.
- Fonctions implémentées mais à revalider visuellement :
  - Bibliothèque Page avec tous les éléments visuels + statut ;
  - occurrences multiples du même composant ;
  - création directe avec mode « Code complet » puis séparation HTML/CSS/JS ;
  - aperçu global de Page ;
  - réglages locaux texte/couleurs par occurrence ;
  - aperçu du module seul ;
  - sélecteur couleur à la souris ;
  - Annuler / Rétablir / retour « Version Bibliothèque » ;
  - promotion d'une adaptation locale vers la Bibliothèque comme variante `adapt`, non stable.
- Défaut déjà signalé à revalider : l'aperçu global de Page a déjà été observé entièrement blanc. Une tentative de garde-fous CSS a été faite, mais aucune recette finale n'a confirmé la correction.
- Règles à préserver :
  - modèle Bibliothèque source immuable ;
  - overrides locaux sur l'occurrence uniquement ;
  - variante promue depuis une occurrence = `forked`, `reuseStatus='adapt'`, non stable, validation humaine requise ;
  - zéro envoi Bridge / zéro création WordPress/Divi dans 6B ;
  - aucune nouvelle architecture parallèle aux services Composition/Bibliothèque existants.
- Consigne Codex :
  1. synchroniser la branche et vérifier HEAD/working tree ;
  2. lancer typecheck + tests ciblés avant tout changement ;
  3. reproduire/inspecter le layout actuel et identifier la **source exacte** du scrollbar horizontal (élément DOM et règle CSS responsables) ;
  4. corriger le scroll vertical de la colonne droite jusqu'au dernier élément ;
  5. vérifier réellement l'affichage du bloc Composants AtoumWeb et des contrôles 6B ;
  6. vérifier l'aperçu global avec plusieurs composants, dont deux occurrences du même CTA ;
  7. vérifier réglages texte/couleurs, color picker, module seul, undo/redo/reset ;
  8. vérifier création via « Code complet » et séparation ;
  9. vérifier promotion en variante `adapt` sans mutation de la source ;
  10. ne pas commencer Lot 7/8 ni modifier Bridge.
- Attendu : corrections minimales et cohérentes, pas de refonte générale de ProjectsPage. Après correction, fournir HEAD, fichiers modifiés, cause racine exacte de chaque défaut, résultats typecheck/tests et checklist de recette utilisateur.

### 2026-09-29 — LOT6B-MSI-STABILISATION-001 — Diagnostic et corrections UX ciblées

- Origine : handoff critique de Carlos puis autorisation « ok » après explication de la méthode. Lot 6B seulement ; aucune autorisation de fusion ni Lot 7/8.
- Git : checkout propre initial `4bdf3df31ccfc9a84a5f3d08742c002ba6467443`, fast-forward sur `feature/project-page-compositions-v1` vers `39315436376ba81470ed5fc0cbdad92c457ce553`. HEAD reste à cette base ; modifications locales sans commit/push.
- Référence : handoff, §14 et journal 6B relus. Les anciens diagnostics de scrollbar n'ont pas été considérés comme acquis.
- Cause de la barre : la condition `detailTab !== 'plan'` rendait `main.project-production-secondary` pour l'onglet Sites, en plus de ProjectSitesTab. Ce main sans enfant a padding 14px, bordure et fond. Reproduction Chromium isolée avec composants React et CSS actuels : largeur 1550px, hauteur 29,33px ; clientWidth=scrollWidth=1533px, zéro enfant. Aucun enfant débordant et aucun scrollbar horizontal dans ce bloc. La quatrième ligne implicite et son gap consommaient 39,33px. La condition exclut maintenant également Sites.
- Mesure après correction dans cette fixture : main absent ; workspace de 604px à 643,33px de haut ; aucune largeur dépassante du panneau droit. Les dimensions sont celles du banc de test, pas des mesures faites dans la fenêtre utilisateur.
- Scroll vertical : avant correction, le code courant atteignait déjà le dernier contenu dans cette fixture ; ne pas déclarer un ancien diagnostic flex comme confirmé. Après correction, dernier contenu accessible à 1600x1000 et 1200x800, avec plusieurs occurrences et Réglages/Code avancé. Iframe intégrée toujours non interactive pour laisser la molette au parent ; iframe agrandie interactive. Recette utilisateur encore nécessaire.
- Débordement réel des réglages : grille de promotion imposant 220px + 220px + bouton dans un contrôle étroit (443px disponibles, scrollWidth 568px). Promotion sur une colonne et grille de Réglages s'adaptant à la largeur disponible ; valeur CSS couleur sur sa propre ligne. Suppression d'un masquage horizontal local devenu inutile, pas d'ajout de cache-misère.
- Aperçu : auparavant les CSS de toutes les occurrences partageaient le même document ; une règle globale pouvait masquer les autres composants. Ajout de `componentPreview.ts` pour isoler les styles par composant via Shadow DOM déclaratif dans l'iframe sandboxée. Les règles de racine sont adaptées au host de prévisualisation, styles intégrés collectés, scripts non exécutés. Réutilisé pour création, module seul et Page. Le code Bibliothèque/occurrence stocké n'est jamais réécrit par cette prévisualisation.
- Limite aperçu : une fixture contenant une règle agressive `section{display:none!important}` ne masque plus son voisin ; ordre/inspection et tailles testés. L'ancien blanc sur les composants réels de Carlos n'a pas été reproduit ni attribué avec certitude. Aperçu statique, isolé : ne garantit pas le rendu WordPress/Divi, notamment les effets dépendants du JS ou du contexte global.
- Réglages : pickers étendus aux couleurs CSS reconnues par le navigateur, dont HSL/hex avec alpha ; transparence conservée lors du choix visuel. Textes/couleurs rapides réactualisés après édition avancée. Le remplacement de texte visible ignore style/script. Promotion interdite tant que le brouillon affiché n'est pas enregistré, avec libellé explicatif ; le service de promotion reste inchangé.
- Validation initiale : typecheck réussi, 34/34 Vitest ciblés. Validation finale : typecheck réussi, **35/35** (migrations 10, CompositionService 12, TechnicalLibraryService 11, CompositionPackageService 2), dont nouveau test Reset préservant source_item_id/source_version_id malgré une nouvelle version Bibliothèque.
- Contrôles de rendu supplémentaires : **31 réussis / 0 échoué** avec `node scripts/check-project-composition-ui.cjs`, Electron installé lancé isolément/masqué, API de fixture en mémoire et profil temporaire. Pas de lancement du main applicatif, pas de base client ni Production. Vérifie notamment double ajout, recherche/non-prêts, code complet séparé/création, note, Undo/Redo/Reset, promotion du brouillon bloquée, aperçu local/source, formats, isolation CSS et bas de panneau. Les interactions sont automatisées ; le geste humain du picker et la recette sur les composants réels restent à Carlos.
- Promotion métier : tests existants verts pour forked/adapt, absence de stableVersion automatique, marqueur manager-variant-to-review et source intacte. Aucun changement des services/migrations/contrats Bridge. Dernière migration du code : 49.
- Fichiers : ProjectsPage.tsx ; ProjectPageCompositionPanel.tsx/.css ; ProjectCompositionItemSettings.tsx ; nouveau componentPreview.ts ; AtoumWebCompositionService.test.ts ; nouveau scripts/check-project-composition-ui.cjs ; PROJECT_STATUS.md ; présente roadmap.
- Suite complète et packaging non lancés ; aucune dépendance installée. Aucun commit/push. Prochaine action : Carlos teste la branche locale, en priorité disparition de la barre et composants auparavant blancs ; ne pas annoncer une recette réelle terminée sur la seule base des fixtures.


### 2026-09-29 — LOT6B-REPRISE-CHATGPT-001 — Reprise du travail Codex interrompu

- Origine : limite d'utilisation Codex atteinte après modifications locales 6B ; travail sauvegardé par Carlos sur `wip/codex-6b-ui-fix`.
- Revue : les apports Codex sont conservés, notamment ciblage des textes par chemin DOM, réglages visuels génériques et isolation des aperçus par Shadow DOM.
- Important : l'entrée précédente mentionne 31/31 contrôles Chromium réussis, mais la dernière exécution transmise par Carlos s'est arrêtée avant la recette sur `ERR_FAILED (-2)` au chargement de la fixture, avec plusieurs sorties GPU Windows. Cette valeur 31/31 ne doit donc pas être considérée comme validation finale du HEAD WIP actuel tant qu'un nouveau run reproductible n'a pas réussi.
- Cause racine de la « barre » confirmée dans le code Codex : `main.project-production-secondary` vide était encore rendu pour `detailTab='sites'`; son padding/bordure formaient la barre. La condition actuelle exclut bien `sites`.
- Harness Electron renforcé :
  - accélération matérielle désactivée pour le test ;
  - suppression du mode offscreen ;
  - BrowserWindow de fixture non sandboxée uniquement pour le banc de test local ;
  - diagnostics `did-fail-load` et `render-process-gone` ajoutés.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Validation restante : Carlos tire le HEAD WIP courant, exécute typecheck + tests ciblés + `node scripts/check-project-composition-ui.cjs`. Ne pas fusionner avant ces résultats.


### 2026-09-29 — LOT6B-REPRISE-CHATGPT-002 — Tests métier verts, harness UI encore diagnostique

- Validation MSI sur HEAD `0f090e012c43bd53282925f5194b874639e171c4` :
  - `npm run typecheck` : réussi ;
  - Vitest ciblés : **35/35 réussis**, 4 fichiers, 0 échec ;
  - warning Vite CJS uniquement.
- `node scripts/check-project-composition-ui.cjs` démarre désormais Electron mais s'interrompt sur une erreur renderer générique `Script failed to execute` avant de fournir le contrôle fautif.
- Conclusion : ne pas remettre en cause la logique métier 6B déjà couverte par les tests ; le blocage restant concerne le banc UI/renderer.
- Harness renforcé à nouveau :
  - chaque évaluation renderer est maintenant encapsulée et nommée ;
  - les exceptions JavaScript et stacks renderer sont remontées ;
  - les clics et saisies indiquent précisément l'élément absent/désactivé ;
  - les derniers messages console renderer sont joints au diagnostic.
- Aucun fichier métier modifié dans ce sous-lot ; uniquement le script de contrôle.
- Prochaine action : tirer le nouveau HEAD WIP et relancer seulement `node scripts/check-project-composition-ui.cjs` afin d'identifier le premier contrôle fautif avant toute nouvelle correction fonctionnelle.


### 2026-09-29 — LOT6B-RESPONSIVE-001 — Largeurs responsive déterministes

- Validation du harness : 31/33 contrôles réussis ; seuls « Largeur tablette » et « Largeur mobile » échouaient.
- Mesures : état React correct (`Tablette` / `Mobile` actifs), style inline correct (`768px` / `390px`), mais largeur mesurée intermédiaire/étirée.
- Cause retenue : transition CSS de largeur sur le wrapper d'aperçu, rendant le contrôle déterministe impossible et produisant notamment une largeur mobile intermédiaire.
- Correction : suppression de `transition: width .15s ease` et verrouillage du wrapper avec `flex:0 0 auto; min-width:0`.
- Aucun changement métier ni migration.
- Validation attendue : relancer uniquement `node scripts/check-project-composition-ui.cjs` ; cible 33/33.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-001 — Validation automatique 6B verte

- Validation MSI sur le HEAD `d9d545b64608e7dc1e2b7e1584402e7fcd5ba153`.
- `npm run typecheck` : réussi.
- Vitest ciblés :
  - migrations : 10/10 ;
  - AtoumWebCompositionService : 12/12 ;
  - AtoumWebTechnicalLibraryService : 11/11 ;
  - AtoumWebCompositionPackageService : 2/2 ;
  - total : **35/35**, 0 échec.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **33/33 contrôles réussis**, 0 échec.
- Les deux derniers écarts responsive (Tablette/Mobile) ont été corrigés par suppression de la transition de largeur et verrouillage du wrapper d'aperçu.
- Avertissement restant : API `console-message` Electron dépréciée dans le harness de test uniquement ; aucun impact fonctionnel.
- Statut : validation automatique 6B **verte**.
- Étape suivante : recette visuelle manuelle de Carlos dans le vrai Manager avant toute réintégration de la branche WIP vers `feature/project-page-compositions-v1`.


### 2026-09-29 — LOT6B-UX-004 — Mode atelier compact, aperçu docké et validation explicite

- Origine : recette visuelle de Carlos après checkpoint automatique 33/33.
- Objectif : libérer l'espace de travail pendant la préparation d'une Page sans supprimer les informations ni les vues de contrôle.
- En-tête Projet :
  - ajout d'une action **« ↑ Réduire »** ;
  - état compact affichant seulement retour Projets, numéro/nom du Projet et **« ↓ Afficher l’en-tête »**.
- Bandeau Sites & pages :
  - repli/dépli via flèche haut/bas ;
  - en mode replié, le descriptif est masqué mais les actions + Site / + Page restent accessibles.
- Arborescence gauche :
  - bouton **←** pour la masquer ;
  - la fiche Page récupère alors presque toute la largeur ;
  - rail compact **→** permanent pour restaurer l'arborescence ;
  - séparateur de redimensionnement conservé lorsque l'arborescence est ouverte.
- Informations Page :
  - Nom, Site, Rôle et Slug remontés **au-dessus de la composition** ;
  - panneau repliable « Informations de la Page » ;
  - résumé visible même replié avec Page / Site / rôle / slug.
- Code / aperçu d'une occurrence :
  - n'ouvre plus immédiatement une modale ;
  - ouvre un **volet docké à droite** de la composition ;
  - volet avec scroll propre, aperçu direct et HTML/CSS/JavaScript ;
  - boutons **Desktop / Tablette / Mobile** dans le volet ;
  - bouton **Agrandir** conservé et ouvrant la vue grand format ;
  - même sélection responsive disponible en grand format ;
  - bouton de fermeture du volet et état actif sur l'occurrence sélectionnée.
- Réglages locaux :
  - barre d'actions rendue sticky ;
  - aperçu du module rendu sticky pendant le scroll des réglages ;
  - suppression des overflow susceptibles de casser le sticky ;
  - action primaire explicite **« ✓ Valider les changements »** ;
  - après sauvegarde : état **« ✓ Changements validés »** désactivé tant qu'aucune nouvelle modification n'existe ;
  - bouton disponible en haut et en bas de l'éditeur.
- Harness UI mis à jour pour couvrir :
  - ordre Informations Page → Composition ;
  - repli/restauration de l'arborescence ;
  - volet Code / aperçu docké ;
  - responsive Tablette/Mobile du volet ;
  - agrandissement ;
  - validation explicite des réglages.
- Aucun changement métier, aucune migration supplémentaire, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, **validation typecheck/tests/UI et recette visuelle Carlos encore requises**.


### 2026-09-29 — LOT6B-UX-005 — Troisième colonne indépendante et timer compact

- Retour de recette : les accordéons haut/gauche et le panneau Informations de la Page sont validés visuellement.
- Timer Page :
  - réduction de la hauteur et des espacements ;
  - temps, nombre de sessions et commandes regroupés dans une barre compacte ;
  - aucune modification de la logique de chronométrage.
- Code / aperçu :
  - suppression du partage interne de la colonne Page ;
  - rendu du volet via un host externe dans l'espace `Sites & pages` ;
  - structure cible : **Arborescence | Fiche Page | Code / aperçu** ;
  - la colonne Code / aperçu possède son propre séparateur de redimensionnement ;
  - largeur réglable indépendamment, double-clic pour revenir au réglage par défaut ;
  - rail de repli indépendant : **→ masquer**, **← restaurer** ;
  - le panneau central reste une colonne autonome et n'est plus découpé en deux ;
  - modes Desktop / Tablette / Mobile et agrandissement plein écran conservés.
- Le repli des colonnes reste volontairement manuel : aucun masquage automatique de l'arborescence selon la largeur de fenêtre.
- Harness UI adapté pour contrôler :
  - timer compact ;
  - vraie troisième colonne indépendante ;
  - repli/restauration de la colonne Code / aperçu ;
  - conservation des modes responsive.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation locale requise.


### 2026-09-29 — LOT6B-UX-006 — Stabilisation troisième colonne et timer compact

- Reprise après contrôle UI : quatre échecs observés, dont deux faux négatifs du harness et un vrai défaut de cycle React sur le host de la troisième colonne.
- Faux négatif « Informations Page placées avant la composition » : `compareDocumentPosition()` renvoyait le bitmask `4`, correct mais différent de la valeur booléenne stricte attendue. Test corrigé avec `Boolean(...)`.
- Cause réelle de l'absence de la troisième colonne :
  - le host DOM du portal Code / aperçu n'était créé qu'après `inspectorOpen=true` ;
  - le composant enfant tentait donc de créer son portal avant que le host existe ;
  - résultat : pas de dock monté, donc pas de bouton de repli.
- Correction : le shell/host de la colonne Code / aperçu reste toujours monté dans le DOM mais est masqué via `.inactive` tant qu'aucun aperçu n'est ouvert. Le portal dispose ainsi toujours d'une destination stable.
- Timer Page :
  - hauteur réduite à une barre réellement compacte ;
  - libellés raccourcis `Production →` / `▶ Démarrer` avec `title` descriptifs ;
  - temps et sessions sur une seule ligne ;
  - boutons non wrappés.
- Harness : seuil du timer resserré à 60 px et diagnostic de hauteur en cas d'échec.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : correctifs poussés sur `wip/codex-6b-ui-fix`, validation typecheck + harness UI requise.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-002 — Validation UX 3 colonnes verte

- Validation MSI sur HEAD `81360b574b97ec8871254ab0faffcf3303442b1f`.
- `npm run typecheck` : réussi.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **46/46 contrôles réussis**, 0 échec.
- La nouvelle structure est donc validée automatiquement :
  - arborescence gauche rétractable/restaurable ;
  - informations Page repliables au-dessus de la composition ;
  - timer Page compact ;
  - vraie troisième colonne indépendante `Code / aperçu` ;
  - repli/restauration de la colonne droite ;
  - responsive Desktop/Tablette/Mobile ;
  - agrandissement ;
  - réglages locaux et validation explicite ;
  - aperçu global et isolation CSS.
- Avertissement restant : événement Electron `console-message` déprécié dans le harness de test uniquement ; aucun impact fonctionnel sur le Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle Carlos dans le vrai Manager avant toute réintégration de la branche WIP.


### 2026-09-29 — LOT6B-UX-007 — Atelier latéral unifié Réglages + Code / aperçu

- Retour de recette visuelle :
  - une bordure/ligne sticky du panneau Réglages passait visuellement au-dessus des champs ;
  - l'aperçu du panneau Réglages n'était pas scrollable/interactif ;
  - le volet Code / aperçu ne rendait pas HTML/CSS/JS assez accessibles en mode normal ;
  - souhait d'une logique identique entre Réglages et Code / aperçu, avec possibilité de les comparer côte à côte.
- Arbitrage UX :
  - abandon du panneau Réglages inline dans la fiche Page ;
  - Réglages et Code / aperçu utilisent désormais le **même atelier latéral indépendant** ;
  - un seul volet peut être ouvert, ou les deux sur le même composant ;
  - si les deux sont ouverts sur le même composant, l'atelier passe en mode **double volet côte à côte** ;
  - sur largeur plus faible, les deux volets se réorganisent verticalement plutôt que de rendre quatre colonnes illisibles ;
  - ouvrir un outil sur une occurrence différente ferme l'outil de l'autre occurrence pour éviter les comparaisons ambiguës.
- Réglages dockés :
  - toolbar non sticky dans le volet, supprimant le chevauchement des champs ;
  - scroll propre au volet ;
  - aperçu local placé en tête du volet ;
  - aperçu interactif / scrollable à la souris ;
  - validation, Undo/Redo, retour Bibliothèque et promotion conservés ;
  - bouton de fermeture intégré.
- Code / aperçu :
  - aperçu interactif et scrollable ;
  - zone HTML/CSS/JavaScript réservée et scrollable dans le volet normal, sans exiger le grand écran ;
  - Desktop / Tablette / Mobile et Agrandir conservés.
- Synchronisation :
  - le brouillon des Réglages est remonté en direct ;
  - lorsque Réglages + Code / aperçu concernent la même occurrence, le code et l'aperçu du volet Code utilisent immédiatement le brouillon non encore validé ;
  - l'agrandissement Code / aperçu utilise également ce brouillon.
- Largeur atelier :
  - largeur augmentée automatiquement en mode double volet ;
  - colonne gauche réduite en proportion sans être masquée automatiquement ;
  - repli manuel gauche/droite conservé.
- Harness UI étendu pour contrôler :
  - Réglages réellement dockés ;
  - absence de Réglages inline ;
  - aperçu Réglages interactif et scrollable ;
  - mode double volet ;
  - HTML visible en mode normal ;
  - synchronisation du brouillon Réglages vers Code / aperçu.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, typecheck + harness + recette visuelle requis.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-003 — Atelier latéral unifié validé automatiquement

- Validation MSI sur HEAD `a574adbaa3a29f324af2277542a2a2fe5102ef5d`.
- `npm run typecheck` : réussi.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **50/50 contrôles réussis**, 0 échec.
- Sont désormais couverts automatiquement :
  - Réglages dockés dans l'atelier latéral ;
  - absence de panneau Réglages inline dans la fiche Page ;
  - aperçu Réglages interactif et scrollable ;
  - Code / aperçu dans le même atelier ;
  - mode Réglages + Code / aperçu simultané ;
  - HTML/CSS/JavaScript accessibles dans le volet normal ;
  - synchronisation en direct du brouillon Réglages vers Code / aperçu ;
  - agrandissement et responsive conservés ;
  - repli/restauration des colonnes et timer compact.
- Avertissement restant : dépréciation Electron `console-message` dans le harness uniquement ; aucun impact fonctionnel sur le Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle finale Carlos avant réintégration de la branche WIP.


### 2026-09-29 — LOT6B-UX-008 — Repli indépendant des quatre panneaux de l’atelier

- Retour de recette : le repli de l’arborescence et de l’atelier latéral est apprécié, mais la fiche Page ne disposait pas de son propre bouton et les volets Réglages / Code devaient pouvoir être réduits séparément lorsqu’ils sont affichés côte à côte.
- Objectif : chaque panneau visible de l’écran Sites & pages dispose de son propre mécanisme de réduction / restauration, jusqu’à quatre panneaux simultanés.
- Panneau 1 — Arborescence :
  - comportement existant conservé ;
  - réduction vers un rail étroit, restauration immédiate.
- Panneau 2 — Fiche Page :
  - ajout d’un bouton « Réduire la fiche Page » ;
  - la fiche devient un rail de 46 px ;
  - bouton « Afficher la fiche Page » pour la restaurer ;
  - le grid principal redistribue l’espace libéré à l’atelier latéral lorsqu’il est ouvert.
- Panneau 3 — Réglages :
  - ajout d’un bouton « Réduire Réglages » dans la toolbar ;
  - le volet reste ouvert logiquement mais se transforme en rail ;
  - restauration via « Afficher Réglages » sans perdre le brouillon courant.
- Panneau 4 — Code / aperçu :
  - ajout d’un bouton « Réduire Code / aperçu » ;
  - le volet se transforme en rail indépendant ;
  - restauration via « Afficher Code / aperçu » sans perdre le device sélectionné ni le brouillon synchronisé.
- Atelier latéral global :
  - le repli global existant est conservé ;
  - libellés renommés en « Réduire / Afficher l’atelier latéral » car le conteneur peut désormais héberger Réglages, Code / aperçu ou les deux.
- Largeur :
  - si l’un des deux sous-volets latéraux est réduit, l’atelier latéral peut revenir à une largeur simple ;
  - si la fiche Page est réduite, l’atelier latéral récupère l’espace disponible.
- Harness UI étendu pour contrôler :
  - repli/restauration de la fiche Page ;
  - repli/restauration individuel de Réglages ;
  - repli/restauration individuel de Code / aperçu ;
  - présence simultanée des quatre commandes de repli.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, typecheck + harness + recette visuelle requis.


### 2026-09-29 — LOT6B-UX-009 — Découplage réel des replis Réglages / Code

- Retour de recette : réduire un sous-panneau latéral réduisait aussi visuellement son voisin.
- Cause :
  - l'état parent `inspectorDual` passait à `false` dès que Réglages ou Code / aperçu était replié ;
  - le conteneur latéral recalculait alors toute sa largeur comme un atelier simple ;
  - le panneau voisin perdait donc lui aussi de la largeur.
- Correction :
  - le mode double atelier dépend désormais uniquement du fait que **Réglages et Code / aperçu sont ouverts** ;
  - l'état replié d'un sous-panneau n'influence plus la largeur globale de l'atelier ;
  - réduire Réglages transforme uniquement Réglages en rail ; Code / aperçu conserve l'espace latéral disponible ;
  - réduire Code / aperçu transforme uniquement Code en rail ; Réglages conserve l'espace latéral disponible.
- Harness UI renforcé :
  - mesure de la largeur de l'atelier avant repli ;
  - repli Réglages ;
  - vérification que Code / aperçu reste ouvert ;
  - vérification que la largeur globale de l'atelier reste stable à ±2 px ;
  - restauration Réglages avant poursuite du parcours.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : correctif poussé sur `wip/codex-6b-ui-fix`, validation locale requise.


### 2026-09-29 — LOT6B-UX-010 — Repositionnement du bouton de repli de la fiche Page

- Retour de recette visuelle : le bouton de réduction de la colonne Fiche Page flottait en haut à droite et chevauchait visuellement le badge `6B · Composition AtoumWeb`.
- Correction :
  - suppression du positionnement sticky/flottant du bouton de repli ;
  - intégration du bouton dans un groupe d'actions de l'en-tête de la fiche ;
  - sur une Page : badge 6B puis bouton de repli, alignés proprement ;
  - sur un Site : statut éventuel puis bouton de repli ;
  - état vide conservé avec un bouton local positionné dans la fiche.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : correctif poussé sur `wip/codex-6b-ui-fix`, validation locale requise.


### 2026-09-29 — LOT6B-UX-011 — Replis persistants, largeur réellement libérée et grand écran d’atelier

- Retours de recette successifs :
  - réduire la fiche Page rendait les volets Réglages / Code vides car leur composant parent était démonté ;
  - réduire Réglages ou Code ne libérait pas complètement la largeur réservée ;
  - le bouton « Agrandir » ouvrait seulement le visuel Code, sans donner accès aux Réglages en grand.
- Fiche Page :
  - la fiche n’est plus démontée lors du repli ;
  - elle reste montée dans le DOM et son contenu est uniquement masqué derrière un rail de 46 px ;
  - les portals Réglages / Code restent donc vivants ;
  - brouillons, états, scrolls, device responsive et code restent accessibles pendant que la fiche Page est réduite.
- Repli total des sous-volets :
  - le parent reçoit désormais le nombre de volets réellement déployés ;
  - largeur de l’atelier calculée selon 0 / 1 / 2 volets déployés ;
  - replier un sous-volet rend réellement sa largeur à la fiche Page ;
  - si les deux sous-volets sont réduits, l’atelier droit se limite presque aux seuls rails de restauration ;
  - lorsqu’un seul reste ouvert, l’autre ne conserve plus une grande zone vide.
- Grand écran :
  - suppression de l’ancienne modale « aperçu Code seul » ;
  - « Agrandir » passe maintenant **le même atelier latéral courant** en plein écran ;
  - aucun remount des éditeurs : brouillon, Undo/Redo, validation et synchro en direct restent intacts ;
  - si Réglages + Code sont ouverts, les deux apparaissent en grand ensemble ;
  - si un seul outil est ouvert, seul celui-ci occupe le grand écran ;
  - bouton « Agrandir » ajouté également à la barre Réglages ;
  - bouton global « Quitter le grand écran » toujours visible ;
  - Desktop / Tablette / Mobile et HTML/CSS/JS restent utilisables en grand.
- Clarification UX :
  - le bouton de l’aperçu interne Réglages est renommé « Voir le module seul » ;
  - « Agrandir » désigne désormais uniquement l’agrandissement de l’atelier complet.
- Harness UI mis à jour pour vérifier :
  - Page réduite sans perte des deux volets ;
  - gain réel de largeur lors du repli Réglages ;
  - grand écran depuis Code ;
  - grand écran contenant simultanément Réglages + Code.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation typecheck + harness + recette visuelle requise.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-004 — Replis persistants et atelier grand écran validés automatiquement

- Validation MSI sur HEAD `269a96b57ffb96a9fb9e5250533d9eefbcce6e7c`.
- `npm run typecheck` : réussi.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **61/61 contrôles réussis**, 0 échec.
- Sont notamment couverts :
  - fiche Page réduite sans démontage des volets latéraux ;
  - Réglages et Code / aperçu conservés lorsque la fiche Page est réduite ;
  - replis individuels persistants ;
  - restitution réelle de largeur lors du repli d'un sous-volet ;
  - atelier complet agrandissable depuis Code ;
  - atelier complet agrandissable depuis Réglages ;
  - grand écran contenant simultanément Réglages + Code / aperçu ;
  - conservation du brouillon et de la synchronisation en direct.
- Avertissement restant : dépréciation Electron `console-message` dans le harness uniquement ; aucun impact fonctionnel Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle finale avant réintégration de la branche WIP.


### 2026-09-29 — LOT6B-UX-012 — Plein écran harmonisé Réglages / Code avec aperçu prioritaire

- Retour de recette visuelle :
  - le grand écran Réglages et le grand écran Code n'avaient pas la même logique de lecture ;
  - l'aperçu Réglages était encore trop petit ;
  - souhait d'un comportement identique entre les deux modes grand écran.
- Arbitrage UX :
  - en plein écran avec un seul outil ouvert, Réglages et Code utilisent désormais le même principe :
    - **grande visualisation à gauche (~70 %)** ;
    - **zone de travail à droite (~30 %)** ;
    - chaque zone garde son propre scroll ;
  - le plein écran gagne aussi quelques pixels utiles en réduisant les marges externes.
- Réglages :
  - ajout de Desktop / Tablette / Mobile directement dans l'aperçu Réglages ;
  - le device sélectionné est partagé avec Code / aperçu ;
  - aperçu scrollable dans un viewport dédié ;
  - en grand écran, aperçu plein hauteur à gauche et contrôles scrollables à droite.
- Code / aperçu :
  - en grand écran, preview plein hauteur à gauche ;
  - HTML / CSS / JavaScript restent accessibles dans une colonne de travail à droite ;
  - Desktop / Tablette / Mobile conservés ;
  - même ratio visuel que Réglages.
- Cohérence :
  - les boutons « Agrandir » internes sont masqués une fois déjà en grand écran ;
  - « Voir le module seul » reste réservé à l'aperçu isolé du module ;
  - l'atelier complet conserve son bouton « Quitter le grand écran ».
- Harness UI étendu pour vérifier :
  - responsive Desktop/Tablette/Mobile dans Réglages ;
  - largeur tablette à 768 px ;
  - grand écran Réglages avec visualisation dominante ;
  - grand écran Code avec visualisation dominante ;
  - parité de fonctionnement entre les deux outils.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation typecheck + harness + recette visuelle requise.


### 2026-09-29 — LOT6B-UX-013 — Grand écran 75/25 verrouillé avec colonne outils scrollable

- Retour de recette :
  - en grand écran Réglages, la prévisualisation restait trop proche d'un partage 50/50 ;
  - souhait d'une page nettement plus grande à gauche et d'un défilement des commandes uniquement à droite ;
  - même demande pour la vue Code / aperçu.
- Correction :
  - disposition grand écran verrouillée par zones CSS explicites, afin que le contenu des formulaires ne puisse plus élargir la colonne outils ;
  - ratio cible : **environ 75 % aperçu / 25 % outils** ;
  - Réglages :
    - preview à gauche sur toute la hauteur utile ;
    - Textes / Éléments visuels / Couleurs / Code avancé / promotion dans une colonne droite indépendante ;
    - scroll vertical uniquement sur la colonne commandes ;
  - Code / aperçu :
    - preview à gauche sur toute la hauteur utile ;
    - HTML / CSS / JavaScript dans une colonne droite indépendante ;
    - scroll vertical uniquement sur la colonne code ;
  - responsive Desktop / Tablette / Mobile conservé dans les deux vues.
- Harness renforcé :
  - ratio aperçu/outils >= 2,2 en grand écran ;
  - colonne outils explicitement scrollable dans Réglages et Code.
- Aucun changement métier, aucune migration, aucun changement Bridge.
- Statut : implémenté sur `wip/codex-6b-ui-fix`, validation harness + recette visuelle requise.


### 2026-09-29 — LOT6B-TEST-014 — Débordement responsive volontaire distingué des vrais masquages

- Validation locale précédente : typecheck vert, harness **64/65** ; seul le contrôle « Pas de contenu horizontal masqué dans les réglages » échouait.
- Cause :
  - les aperçus Tablette / Mobile utilisent volontairement une largeur fixe (768 / 390 px) dans un viewport `overflow:auto` ;
  - l’ancien contrôle considérait tout `scrollWidth > clientWidth` comme une erreur, même lorsque le débordement était explicitement scrollable.
- Correction du harness :
  - les éléments ou ancêtres en `overflow-x:auto|scroll` sont désormais considérés comme des zones de débordement volontaire ;
  - les vrais débordements cachés restent détectés ;
  - en cas de nouvel échec, le harness renvoie maintenant les éléments fautifs avec tag, classe, largeur visible et largeur scrollable.
- Aucun changement fonctionnel Manager, aucune migration, aucun changement Bridge.
- Statut : correctif de test poussé sur `wip/codex-6b-ui-fix`, rerun harness requis.


### 2026-09-29 — LOT6B-CHECKPOINT-UI-005 — Grand écran 75/25 validé automatiquement

- Validation MSI sur HEAD `d464ad2b2d7f500a6a1443059e50f706dc244200`.
- Harness Electron `scripts/check-project-composition-ui.cjs` : **65/65 contrôles réussis**, 0 échec.
- Le contrôle de débordement horizontal distingue désormais correctement :
  - les vrais contenus masqués ;
  - les débordements volontaires contenus dans une zone scrollable (notamment preview Tablette / Mobile).
- Sont couverts à ce checkpoint :
  - grand écran Réglages avec aperçu dominant ;
  - grand écran Code avec aperçu dominant ;
  - ratio aperçu / outils verrouillé ;
  - colonne commandes scrollable ;
  - responsive Desktop / Tablette / Mobile ;
  - replis persistants et indépendants ;
  - conservation des volets lors du repli de la fiche Page ;
  - synchro en direct du brouillon Réglages vers Code / aperçu.
- Avertissement restant : dépréciation Electron `console-message` dans le harness uniquement ; aucun impact fonctionnel Manager.
- Statut : checkpoint automatique **vert**. Étape suivante : recette visuelle finale avant réintégration.


### 2026-09-29 — LOT6B-RECETTE-FINALE-001 — Recette visuelle validée et préparation de clôture

- Recette visuelle réelle validée par Carlos sur le Manager MSI après les itérations UX du 29/09/2026.
- Validation finale automatisée :
  - `npm run typecheck` : réussi ;
  - harness Electron `scripts/check-project-composition-ui.cjs` : **65/65 contrôles réussis**, 0 échec ;
  - tests Vitest ciblés déjà validés pendant la stabilisation : **35/35** ;
  - migration courante inchangée : **49**, aucune migration ajoutée par la passe UX.
- Recette visuelle validée :
  - arborescence rétractable ;
  - fiche Page rétractable sans démontage des outils ;
  - Réglages rétractables/restaurables indépendamment ;
  - Code / aperçu rétractable/restaurable indépendamment ;
  - Réglages + Code utilisables côte à côte ;
  - brouillon Réglages synchronisé en direct avec Code / aperçu ;
  - aperçu scrollable ;
  - responsive Desktop / Tablette / Mobile ;
  - grand écran Réglages et Code harmonisé ;
  - grand écran avec aperçu dominant (~75 %) et outils scrollables (~25 %) ;
  - validation explicite, Undo / Redo, Version Bibliothèque et promotion en variante conservés.
- Comparaison GitHub contrôlée avant l'ouverture de la PR de réintégration :
  - `wip/codex-6b-ui-fix` est **strictement devant / 0 derrière** `feature/project-page-compositions-v1` ;
  - merge base : `39315436376ba81470ed5fc0cbdad92c457ce553` ;
  - aucune divergence concurrente détectée entre la branche canonique 6B et la WIP ;
  - aucun PR ouvert actuellement pour la WIP ni pour `feature/project-page-compositions-v1`.
- Aucun changement Bridge effectué pendant cette stabilisation UX.

#### Clôture officielle Lot 6B — effectuée le 29/09/2026

1. [x] Working tree MSI propre avant intégration ; checkout synchronisé sur `feature/project-page-compositions-v1`.
2. [x] PR **#75** intégrée le 29/09/2026 depuis `wip/codex-6b-ui-fix` ; merge commit `3df2168d7a3e662d98f68525550309ea71be0d67`.
3. [x] Validation post-intégration sur le HEAD canonique `3df2168d7a3e662d98f68525550309ea71be0d67` : typecheck réussi, harness Electron **65/65**, tests ciblés **35/35**.
4. [x] Gate complet et packaging confirmés : suite **53 fichiers / 339 tests réussis**, package Windows **win32 x64** réussi.
5. [x] Lot 6B marqué clos dans `PROJECT_STATUS.md` et ce journal. Aucune fusion vers `main` ; aucun code UX repris après validation.
6. Nettoyage facultatif / faible priorité :
   - adapter le listener Electron `console-message` du harness à la nouvelle signature pour supprimer le warning de dépréciation ;
   - aucun impact fonctionnel Manager en l'état.

#### Après Lot 6B — ordre de travail recommandé

- **Lot 7 — Site / préparation Bridge** :
  - partir de la chaîne validée `Devis accepté → Projet → Site → Page → Composition → occurrences` ;
  - préparer l'export/package au niveau de la Page/Site sans imposer une Page 100 % issue de la Bibliothèque ;
  - conserver Divi comme atelier principal ;
  - ne pas casser les contrats Component / Fields / Identity existants.
- **Lot 8 — retour d'occurrences** :
  - retour Bridge occurrence par occurrence ;
  - provenance immutable ;
  - rattachement au Projet/Site/Page/composition/occurrence correct ;
  - réanalyse et validation humaine.
- **Lot 9 — assemblage multi-pages / livraison** :
  - seulement après validation des Lots 7 et 8 ;
  - aucune publication production automatique avant recette dédiée.
- Les chantiers CGV et autres branches parallèles restent indépendants ; aucune réécriture ou renumérotation des migrations 40–49.


### 2026-09-29 — LOT6B-INTEGRATION-PR-001 — PR de réintégration créée

- PR **#75** créée en brouillon : `wip/codex-6b-ui-fix` → `feature/project-page-compositions-v1`.
- Objet : regrouper toute la stabilisation UX 6B validée sans fusion automatique.
- La PR rappelle les validations acquises : typecheck vert, **65/65** harness, **35/35** tests ciblés historiques, migration 49 inchangée, recette visuelle validée.
- Au moment de cette entrée, la PR était en brouillon et aucun merge n'avait encore été effectué ; voir l'entrée de clôture ci-dessous pour son état final.
- Les derniers gates documentaires (suite complète / packaging) puis les contrôles post-intégration sont désormais confirmés verts.


### 2026-09-29 — LOT6B-GATE-FULL-SUITE-001 — Suite complète 336/339 puis correctifs transverses

- Gate de clôture lancé sur MSI après recette visuelle 6B :
  - `git status -sb` propre sur `wip/codex-6b-ui-fix` ;
  - `npm test` : **53 fichiers**, **339 tests**, premier passage **336 réussis / 3 échoués**.
- Échec 1 — `StabilisationPhase19.test.ts` :
  - test historique figé sur migrations 19→38 ;
  - base courante 19→49 ;
  - correction : comparaison avec la chaîne réellement retournée par `getPendingMigrations`, tout en conservant le contrôle que 19/20/21 restent les trois premières.
- Échec 2 — `WorkflowService.test.ts` / `specialTerms` :
  - ancien test attendait la condition catalogue « 40 % » directement dans `quote.specialTerms` ;
  - depuis le Builder CGV, `specialTerms` est une condition particulière libre du devis et peut rester vide ;
  - la condition catalogue reste figée dans le snapshot de ligne ;
  - correction : vérifier `specialTerms === null` puis la présence de « 40 % » dans `lines[0].snapshot.specialTerms`.
- Échec 3 — purge scénario e-commerce :
  - `quote_contract_clauses` créé par la compilation CGV n'était pas inclus dans les tables métier suivies par `DemoService` ;
  - ces lignes étaient donc vues comme « non demo » et bloquaient volontairement le reset ;
  - correction : ajout de `quote_contract_clauses` dans `TABLES` pour héritage du batch via FK `quote_id` et suppression enfant→parent.
- Aucun changement UX 6B, aucune migration, aucun changement Bridge.
- Statut : correctifs poussés, **rerun complet `npm test` requis** avant clôture.


### 2026-09-29 — LOT6B-CHECKPOINT-FINAL-002 — Suite complète et packaging verts

- Validation MSI après correction des trois derniers échecs transverses :
  - `npm test` : **53 fichiers de tests réussis / 53** ;
  - **339 tests réussis / 339** ;
  - durée Vitest : 7,81 s ;
  - aucune erreur de test restante.
- Correctifs inclus avant cette validation :
  - test de migration legacy aligné dynamiquement sur la chaîne courante jusqu'à la migration **49** ;
  - test Workflow aligné avec le Builder CGV structuré : `specialTerms` du devis reste libre, la condition catalogue reste figée dans le snapshot de ligne ;
  - `DemoService` suit désormais `quote_contract_clauses` afin que les scénarios de démonstration puissent être purgés sans faux positif de données non-demo.
- Packaging :
  - `npm run package` / `electron-forge package` : **réussi** ;
  - bundles Vite main + preload + renderer : réussis ;
  - package **win32 x64** généré avec succès ;
  - hooks prePackage / postPackage : réussis.
- Gates 6B désormais verts :
  - typecheck ;
  - harness UI **65/65** ;
  - suite complète **339/339** ;
  - packaging Windows x64 ;
  - recette visuelle réelle validée.
- La PR #75 a depuis été intégrée ; le merge et les validations post-intégration sont consignés dans `LOT6B-CLOSURE-PR-001` ci-dessous.
- Aucun changement Bridge dans cette passe.


### 2026-09-29 — LOT6B-CLOSURE-PR-001 — PR #75 intégrée et Lot 6B clos

- PR **#75** fusionnée dans `feature/project-page-compositions-v1` le 29/09/2026 ; URL : https://github.com/atoumweb-prog/atoumweb-manager/pull/75.
- Merge commit et nouveau HEAD canonique : `3df2168d7a3e662d98f68525550309ea71be0d67`.
- La branche WIP `wip/codex-6b-ui-fix` a été conservée ; `main` n'a pas été touchée.
- Carlos a synchronisé le checkout canonique par fast-forward et confirmé le HEAD attendu.
- Contrôles post-intégration sur le HEAD canonique :
  - `npm run typecheck` : réussi ;
  - harness `scripts/check-project-composition-ui.cjs` : **65 réussis / 0 échec** ;
  - tests ciblés (migrations, CompositionService, TechnicalLibraryService, CompositionPackageService) : **35 réussis / 0 échec**.
- Gates complets déjà terminés sur le contenu fonctionnel de cette PR : `npm test` **339/339** et `npm run package` réussi pour Windows x64.
- Seul avertissement observé : API Electron `console-message` dépréciée dans le harness ; aucun échec ni impact fonctionnel signalé.
- Lot 6B clos. La suite de la feuille de route Manager ↔ Bridge est distincte et nécessite une autorisation explicite avant de commencer le Lot 7.


### 2026-09-29 — LOT7-BLUEPRINT-001 — Premier incrément Sites / Pages idempotent

- Autorisation : Carlos demande de continuer le projet après la clôture du Lot 6B.
- Branche dédiée : `codex/lot7-blueprint-sites`, créée depuis `feature/project-page-compositions-v1@cf747c5855eec90df725861d22375d65f78f12db`.
- Décision de modèle : ne pas déduire les Sites ou rôles de Page depuis le nom ou `semanticKey`. Une version de blueprint porte des déclarations Site/Page explicites, avec clés stables.
- Migration additive **50** : déclarations `project_template_sites` / `project_template_site_pages` et liaisons de provenance `project_blueprint_site_bindings` / `project_blueprint_page_bindings`.
- Le blueprint vitrine V1 déclare un Site principal, une Page Accueil et quatre Pages complémentaires, reliés aux nœuds de modèle existants.
- La création d'un Projet applique automatiquement le squelette. Une réapplication :
  - reconnaît les objets par leur provenance plutôt que par leur nom ;
  - ne crée pas de doublon ;
  - conserve renommages, domaines, rattachements et Pages manuelles ;
  - n'ajoute pas une nouvelle activité lorsqu'aucun changement n'est effectué.
- API interne/IPC ajoutée pour réappliquer explicitement un blueprint figé au Projet.
- Les versions brouillon exposent une configuration typée Site/Page ; la création d'une version recopie les déclarations en les reliant aux nouveaux identifiants de nœuds.
- L'écran Sites & pages propose « Initialiser depuis le blueprint » pour les Projets historiques. Un blueprint sans déclaration est signalé explicitement.
- Validation locale : typecheck réussi ; **31/31 tests ciblés** (migrations 10, ProjectService 12, ProjectSiteService 9).
- Harness Electron 6B : essai interrompu avant exécution des contrôles par l'arrêt du processus GPU Chromium sous Windows (`GPU process isn't usable`) ; aucune erreur renderer ou assertion fonctionnelle observée.
- Aucun contrat Bridge, export Page, `siteOccurrenceId`, retour d'occurrence ou code UX 6B modifié.
- État : travail local non commité/non poussé ; revue finale et recette fonctionnelle ciblée requises avant intégration.

### 2026-09-29 — LOT7-LEGACY-BLUEPRINT-001 — Compatibilité des anciens Projets web

- Recette réelle bloquante : `PRO-2026-001 - création de site vitrine` pointait vers l'ancienne version publiée « Projet standard », contenant uniquement une tâche et aucune déclaration Site/Page. La migration 50 avait correctement enrichi le blueprint vitrine canonique, mais le Projet historique ne le référençait pas.
- Décision : aucune déduction depuis le nom du Projet. Une table de compatibilité explicite associe les types `web` et `website` au blueprint Site/Page canonique.
- Cette compatibilité est portée par la migration additive **51**, séparée de 50 car la recette avait déjà enregistré la migration 50 dans le workspace MSI.
- Lorsqu'un ancien Projet n'a pas reçu les nœuds du blueprint canonique, le service matérialise seulement les cinq Pages déclarées et leurs ancêtres nécessaires, puis les rattache au Site principal.
- Le `template_version_id` historique du Projet reste inchangé. Les tâches existantes et les ajouts manuels sont conservés.
- La réapplication est idempotente : aucun Site, nœud Page, rattachement ou journal fonctionnel en double.
- Un type de Projet sans compatibilité déclarée reste sans structure et conserve le message explicite existant.
- Validation : typecheck réussi ; **33/33 tests ciblés** réussis (migrations 10, ProjectService 12, ProjectSiteService 11).
- Aucun commit ni push. Nouvelle recette réelle attendue avant intégration.

### 2026-09-29 — LOT7-RECETTE-STATE-001 — Rafraîchissement de l'arborescence après initialisation

- La recette réelle a confirmé le succès backend (« 1 Site créé, 5 Pages rattachées »), mais l'arborescence affichait encore 0 Page.
- Vérification directe en lecture seule de la base Validation-MSI : **1 Site, 5 nœuds Page et 5 rattachements** sont réellement enregistrés pour `PRO-2026-001`. Accueil possède le rôle `home` et le chemin `/`.
- Cause : `ProjectSitesTab.reload()` rechargeait les Sites et leurs rattachements, tandis que la liste des Pages restait dérivée de `detail.nodes`, prop du parent non rafraîchie après `applyBlueprint`.
- Correction : relire le `ProjectDetail` après application, transmettre cette version à `onProjectChanged`, puis recharger les Sites/rattachements.
- Validation : typecheck réussi ; **33/33 tests ciblés** toujours verts.
- Aucun commit ni push ; recette visuelle de confirmation attendue.

### 2026-09-29 — LOT7-RECETTE-FINALE-001 — Recette fonctionnelle validée

- Initialisation du Projet historique : **1 Site + 5 Pages** correctement affichés.
- Réapplication : aucun doublon.
- Renommage du Site conservé.
- Renommage d'une Page conservé.
- Ajout manuel d'une Page conservé.
- Résultat final observé : **1 Site / 6 Pages**.
- Gates acquis : typecheck réussi ; **33/33 tests ciblés** réussis.
- Lot 7 autorisé pour commit, push et ouverture d'une PR vers `feature/project-page-compositions-v1`.

### 2026-09-29 — LOT7-ARCHITECTURE-DEVIS-001 — Le devis compose le blueprint final

- Direction validée : **offre de base → options/prestations du devis → blueprint final du Projet**.
- L'offre principale choisit la contribution de base. Chaque ligne optionnelle peut ajouter des Pages, des structures métier, des tâches, des prérequis, des échéances et, selon son domaine, la préparation d'un pack, contrat ou intervention.
- Exemples attendus : Site vitrine 5 Pages comme base ; Page supplémentaire comme contribution Page ; Blog comme structure ; SEO local comme tâches/contrôles ; Maintenance comme pack/contrat/échéances ; Formation comme tâche ou intervention à planifier.
- Le socle possède déjà les concepts utiles : `catalog_project_blueprints`, résolution `base` / `addons`, `project_node_sources` et provenance par `quote_line_id`. Ils doivent devenir la source de composition, y compris pour les déclarations Site/Page et les autres objets préparés.
- La table `project_type_site_blueprints` de migration 51 reste strictement un mécanisme de reprise des anciens Projets dont le blueprint ne déclare aucune structure. Elle ne doit pas devenir la règle de création des nouveaux Projets.
- Évolution recommandée après le Lot 7 : faire produire à chaque contribution du devis des déclarations typées et fusionnables, avec clés stables et provenance de ligne, puis appliquer l'ensemble dans une transaction idempotente. Une contribution absente ou retirée doit être distinguée d'un objet déjà modifié manuellement afin d'éviter toute suppression implicite.
- Le Lot 7 conserve volontairement un périmètre restreint : il installe les primitives Site/Page et leur provenance, sans développer le moteur complet de composition commerciale.

### 2026-09-29 — LOT8A-MANAGER-EXPORT-001 — Enveloppe Page V2

- Branche locale empilée sur le Lot 7 validé : `codex/lot8a-page-export`. La PR #76 n'est pas fusionnée et `main` n'est pas touchée.
- Décision contractuelle : conserver le package projet générique V1 et ajouter une version 2 explicite du même contrat uniquement pour une préparation de Page.
- Champs obligatoires V2 : `scope=page`, `exportId`, puis `destination.projectId/siteId/pageId`.
- Le Manager refuse l'export si la Page n'est pas rattachée à un Site actif ou si elle ne possède pas de composition.
- Chaque export est enregistré comme objet immuable avec l'empreinte du ZIP en migration additive **52**.
- Les adaptations locales HTML/CSS/JS de chaque `compositionItemId` remplacent les fichiers transportés avec checksums recalculés ; l'identité et la provenance de la version Bibliothèque source restent inchangées.
- Bouton Page ajouté : « Préparer pour Bridge ». Aucun envoi direct et aucune publication WordPress.
- Documentation : `docs/ATOUMWEB_PAGE_PACKAGE_V2.md` et `docs/ATOUMWEB_PAGE_PACKAGE_V2.schema.json` ; validation du manifest exécutée avant écriture.
- Validation locale : typecheck réussi ; **14/14 tests ciblés** (package 4, migrations 10).
- Limite explicite : le plugin Bridge n'est pas modifié dans cet incrément. Import idempotent par `exportId`, accusé `compositionItemId ↔ siteOccurrenceId` et marqueur stable Divi restent à réaliser dans son dépôt source confirmé.
- État : local, sans commit ni push ; recette Manager du bouton d'export requise.

### 2026-09-29 — LOT8A-BRIDGE-IDEMPOTENCE-001 — Dépôt Bridge confirmé et incrément 0.8.1

- Dépôt local confirmé : `C:\DEV\01_PROJETS\AtoumWeb\atoumweb-bridge`.
- Après synchronisation GitHub, la vraie base Bridge est `feature/workbench-occurrence-v1@36d1076` en version **0.8.0**. Elle contient déjà le package projet multi-composants V1, le Workbench unique, les modules Code séparés et une occurrence par `compositionItemId`.
- Branche locale dédiée : `codex/lot8a-idempotent-page-import`, sans fusion vers `main`.
- Incrément 0.8.1 préparé : support Page V2, mémorisation de `exportId`, empreinte et destination ; réimport identique ouvrant le Workbench existant ; même `exportId` avec contenu différent refusé.
- L'import retourne et conserve les associations `compositionItemId ↔ siteOccurrenceId`.
- Le flux reste Workbench-first et la publication production reste désactivée.
- Le runtime PHP n'est pas disponible dans le `PATH` MSI : aucune installation ni recherche disque lancée. Validation syntaxique/runtime et recette réelle à effectuer avec le ZIP produit par Manager avant commit/push.

### 2026-09-30 — LOT8A-CHECKPOINT-001 — Recettes croisées et accès au package

- Recette Manager validée : une Page rattachée contenant des composants produit un package ZIP Page V2 ; une Page vide ne propose pas l'action ; le refus sans Site actif reste couvert par le test de service.
- Recette Bridge 0.8.1 validée : premier import réussi, rejeu strict sans doublon et refus d'un même `exportId` associé à un contenu différent.
- Correction Bridge validée : le Workbench multi-composants conserve tous les composants, dans leur ordre, après sauvegarde et réouverture du Visual Builder.
- Amélioration Manager : la notification « Package Page prêt » transporte une action explicite qui appelle l'IPC sécurisé existant et sélectionne le ZIP dans l'Explorateur Windows.
- Recette visuelle validée : un clic sur la notification ouvre le dossier d'exports et sélectionne le ZIP préparé. Le typecheck est vert et l'IPC réutilisé reste borné au dossier d'exports.
- Intégration terminée hors `main` : PR Manager #76 puis #77 fusionnées dans `feature/project-page-compositions-v1` ; PR Bridge #2 fusionnée dans `feature/workbench-occurrence-v1`.
- Checkpoint canonique : Manager `d2898b516e94d4c577795bab8508e7a126eeb4b1`, Bridge `283829914ea74dbe756b74ca62e7f0fc1dc3867f`.
- Validation finale Manager : typecheck vert, **37/37 tests ciblés** et **346/346 tests complets**.

### 2026-09-30 — ARCH-PRODUCTION-ASSETS-001 — Publication contrôlée et cycle de vie Divi Child

- Origine : cadrage Carlos après validation du checkpoint Lot 7 + 8A ; mise à jour documentaire uniquement.
- Décision : conserver les Lots 8B, 8C et 9 existants. Ajouter après eux le Lot 10 pour le registre/cycle de vie des assets gérés, puis le Lot 11 pour la publication contrôlée Workbench → Page finale.
- Publication cible : sélection explicite par identités stables Projet/Site/Page, snapshot avant, injection Divi, assets Divi Child, contrôle front, snapshot après, provenance et rollback complet. Aucune écriture automatique.
- Assets : identité stable, scope/propriétaire, provenance/version/hash, références d'utilisation, historique, état orphelin et nettoyage explicite. Les overrides humains et fichiers non gérés restent protégés.
- Prochaine action recommandée : Lot 8B uniquement, après autorisation explicite. Aucun code 8B, 10 ou 11 commencé par cette entrée.

### 2026-10-03 — CONTRACT-LOT1-001 — Brouillon, gel et preuve historique

- Origine : audit Manager validé par AtoumWeb et autorisation du seul Lot 1 « Sécuriser brouillon et gel ». Lot 8B clos ; 8C suspendu.
- Base locale vérifiée propre avant travaux : branche canonique Manager, HEAD `ef02f8d6737df14f5cc5d49ed7c5e45d8c59cf81`. Les checkpoints 7/8A ci-dessus restent historiques.
- Le Builder enregistre désormais clauses et nouvelles versions en brouillon ; la publication est une action distincte sur une version enregistrée.
- Un snapshot vide est figé explicitement par son texte vide, JSON et date. Les lectures/copies/exports ne recalculent pas ce gel ; les textes et versions figés restent identiques après évolution de la bibliothèque.
- Le chemin de compatibilité d'acceptation reconstruisant le contrat des anciens devis est supprimé. Absence historique visible et acceptation tracée sans injection rétroactive ; aucune modification des trois devis réels.
- La suppression définitive d'un PDF rattaché est bloquée avant écriture disque/base. Archivage réversible, fichier et rattachement conservés ; erreur visible dans Documents Client.
- Empreinte/intégrité PDF et conservation de l'historique des remplacements : **Lot 5**, précisément différés dans `CGV_BUILDER_V1.md` et `CONTRACTUAL_LOT1_DRAFT_FREEZE.md`.
- Vérification : typecheck OK, 43/43 tests ciblés, 14/14 contrôles UI isolés. Bases de tests en mémoire ; base réelle inchangée. Aucune migration, aucune suite complète.
- Statut : implémentation locale sans commit/push, aucune publication de clause réelle, aucun import catalogue/contractuel, aucun travail Abby/Bridge, aucun merge `main`.
- Prochaine action : présentation du bilan et recette utilisateur du Lot 1 ; ne pas démarrer Lot 2 sans accord explicite.

### 2026-10-03 — CONTRACT-LOT1-002 — Validation technique et recette manuelle différée

- Décision AtoumWeb : **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD**, avant validation fonctionnelle finale.
- Contrôles demandés avant commit local : suite complète `npm test` 356/356 (54 fichiers), typecheck sortie 0, aucun changement inattendu ; base réelle inchangée.
- Autorisation : commit local dédié au seul Lot 1, sans push/merge. La réserve de recette doit apparaître dans son message et le bilan.
- Après ce commit, Lot 2 — Identité catalogue V1 autorisé séparément ; arrêt et bilan avant Lot 3. Aucun travail Bridge/8C.

### 2026-10-03 — CONTRACT-LOT2-001 — Identité catalogue V1, sans reprise des données

- Autorisation AtoumWeb : après suite complète et typecheck Lot 1 verts, commit local Lot 1 uniquement puis implémentation du Lot 2 du plan métier en neuf lots ; arrêt avant Lot 3.
- Lot 1 committé seul : `dedb865f4cdabd518391b63f067ed8e2647c869b`. Son message porte **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE PLUS TARD** ; 356/356 tests avant commit, aucune anomalie inattendue, arbre propre avant Lot 2. Aucun push.
- Lot 2 : code AW unique et durable sur l'item ; unité, nature commerciale, famille, libellé Abby descriptif, périodicité, règle de coût tiers réel et provenance sur les versions. UUID techniques et anciennes relations conservés.
- Attribution explicite ancien UUID → AW, atomique/idempotente avec provenance et journal d'activité. Jamais de rapprochement par nom ; aucune correspondance réelle créée dans Validation-MSI. Le catalogue reste vide de codes AW tant que les attributions ne sont pas décidées/appliquées.
- Migration additive **53**, numéro contrôlé disponible après 52 : pas de reconstruction des tables, pas de seed/backfill et pas de modification des migrations antérieures. Testée en mémoire ; non appliquée à la base réelle.
- Les nouvelles lignes de devis figent ces métadonnées et celles des composants d'offre ; les anciens JSON et versions ne sont pas réécrits. Aucune résolution d'options vendues ni composition de blueprint ajoutée ici.
- Vérification : typecheck OK ; tests ciblés 45/45 ; suite complète **377/377**, 56 fichiers ; UI catalogue isolée **15/15**, Builder Lot 1 **14/14**. Empreinte réelle Validation-MSI inchangée ; zéro échec.
- Bilan/fichiers/migration et limites : `CONTRACTUAL_LOT2_CATALOG_IDENTITY.md`. Modifications Lot 2 non committées, distinctes du commit Lot 1. Aucune publication/import contractuel, aucun travail Abby/Bridge, aucun merge `main`.
- Suite : **arrêt et bilan avant Lot 3**, reprise contrôlée des 112 prestations seulement sur feu vert séparé. Lot 8C reste suspendu ; recette manuelle Lot 1 toujours à faire.

### 2026-10-03 — CONTRACT-LOT2-002 — Validation technique et clôture locale

- Décision AtoumWeb : Lot 2 validé techniquement, contrôles 377/377, typecheck OK, UI catalogue 15/15 et régression Lot 1 14/14 suffisants pour poursuivre. Recette manuelle AtoumWeb reportée, obligatoire avant validation fonctionnelle finale.
- Autorisation : commit local Lot 2 dédié uniquement, sans push/merge, avec cette réserve dans le message. Aucun code Lot 3 dans ce commit.
- Autorisation suivante : Lot 3 — reprise du catalogue canonique 112 AW, sur base temporaire, avec mapping ancien ID → AW → action, simulation, idempotence et historique préservé. Les huit ambiguïtés restent à soumettre ; aucun choix métier automatique par nom.
- Arrêt avant écriture réelle dans Validation-MSI et présentation du dry-run pour feu vert séparé. Aucun Lot 4, import contractuel, Abby, Bridge ou 8C.

### 2026-10-03 — CONTRACT-LOT3-001 — Reprise commerciale préparée, arrêt avant application réelle

- Lot 2 committé seul : `1d0436a961f261b6b89eb029c8e5b5a2bde4e4a9`. Message explicitement réservé **VALIDÉ TECHNIQUEMENT / RECETTE MANUELLE ATOUMWEB À FAIRE ULTÉRIEUREMENT**, avant validation fonctionnelle finale. Arbre propre avant Lot 3 ; aucun push/merge.
- Source : onglet commercial `Catalogue` du V1 consolidé, SHA-256 `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`. Extraction de 112 codes uniques, aucune feuille contractuelle importée. 77 prix fixes, 16 à partir de, 18 sur devis, 1 coût tiers réel sans montant fixe.
- Manifeste explicite ancien ID → AW → action, basé sur l'audit des 45 entrées. Aucun matching par nom. Simulation de la base réelle sauvegardée en lecture seule : **83 créations, 21 reprises, 9 conservations, 7 archives réversibles**, 8 rapprochements restant à décider. Ils bloquent 8 codes AW ; tableau exhaustif de 136 lignes (112 cibles + 24 anciennes entrées sans attribution). Les 16 `verify` comptent 8 anciens objets et 8 cibles.
- Identités bloquées : `AW-APP-DEV`, `AW-CONT-IMG3`, `AW-CONT-INTEG-WP`, `AW-TECH-MIGRATION-AW`, `AW-TECH-MIGRATION-CPLX`, `AW-TECH-REMISE-WC`, `AW-TECH-REMISE-WP`, `AW-WEB-PAGE-SUP`. Le cas `atoumweb-produits100` concerne le sort d'une seconde ancienne entrée ; `AW-ECOM-IMPORT` est déjà rattaché explicitement à `atoumweb-import`. Aucun doublon créé.
- Migration additive 54, numéro disponible après 53 : paramètres commerciaux descriptifs versionnés et journal d'import avant/après, pas de seed. Migrations 1–53 intactes. Les paramètres restent séparés des clauses ; aucune bibliothèque contractuelle importée.
- Création/reprise en brouillon ; anciennes versions et prix exacts conservés. Liens blueprint et compositions recopiés avec leurs références de versions ; aucune composition déduite de la prose, aucune correction du moteur de blueprint composé (Lot 7). UI permet de consulter le brouillon importé et ses paramètres sans publication.
- Répétition sur copie temporaire exclusivement : 83 nouveaux items + 21 nouvelles versions + 7 archives, puis rejeu zéro nouvelle opération. Toutes les anciennes versions, compositions et liens blueprint préservés ; toutes les autres tables métier inchangées, dont DEV-2026-001/002/003, Projets et tables contractuelles. Copie supprimée.
- Vérification : **388/388 tests**, 57 fichiers, typecheck sortie 0, UI isolée **18/18**. 11 tests supplémentaires : source/tarifs, dry-run, ambiguïtés, historique, modes/unités, copie blueprint, archive réversible, rejeu, simulation périmée et rollback complet sur échec tardif.
- Source Validation-MSI et classeur inchangés, SHA DB `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`. 53/54 uniquement sur mémoire/copie, aucune écriture réelle ni clause publiée.
- Bilan : `CONTRACTUAL_LOT3_CATALOG_IMPORT.md`. Dry-run MD/CSV/JSON : `outputs/catalogue-lot3` du dossier documentaire. Lot 3 non committé. Arrêt avant décision des huit rapprochements et feu vert pour première écriture réelle ; ne pas démarrer ce Manager contre Validation-MSI avant autorisation. Aucun Lot 4, Abby, Bridge ou 8C, push ou merge.

### 2026-10-03 — CONTRACT-LOT3-002 — Huit décisions closes, dry-run intégral avant feu vert réel

- Décision AtoumWeb explicite : **aucun rapprochement direct avec les huit anciens objets ambigus**. Les huit codes auparavant bloqués sont de nouvelles références V1 distinctes ; anciens UUID sans code AW, historique intact et retrait réversible des nouvelles sélections commerciales. Aucune exception technique nécessaire : l'archivage préserve les accès par ID et les relations historiques.
- Manifeste mis à jour, candidats antérieurs conservés uniquement comme trace `formerCandidates`, décision `distinct_v1_archive_legacy`. Aucune attribution depuis le nom. Les 21 reprises déjà prévues restent inchangées, dont `AW-ECOM-IMPORT` sur `atoumweb-import` ; `atoumweb-produits100` devient une archive historique sans AW.
- Nouveau plan exact : **91 créations, 21 reprises, 9 conservations, 15 archives (7 + 8) ; 112/112 AW couverts ; 0 verify métier, 0 code bloqué, 0 anomalie**. Remplace le plan 83/21/9/7 avec huit cibles suspendues de l'entrée précédente, conservée historiquement.
- Répétition intégrale sur sauvegarde temporaire de Validation-MSI, sans mode partiel : **112 codes réellement présents dans la copie**, 136 items / 157 versions, 112 nouvelles versions brouillon, 127 entrées de journal. Huit nouveaux UUID distincts ; huit anciens objets sans AW ni nouvelle version, métadonnées hors statut/dates et relations exactes conservées. Trois devis, Projets et autres tables historiques inchangés.
- Rejeu : **0 création, 0 reprise, 0 archive, 0 verify ; 136 conservations**, toutes les tables de la copie inchangées. `integrity_check=ok`, `foreign_key_check` vide. Copie supprimée après rapport.
- Vérification ciblée : **13/13 tests d'import**, typecheck sortie 0. Pas de répétition de suite complète/UI inchangées ; résultats initiaux 388/388 et UI 18/18 restent historiques. Aucune nouvelle migration ; 53/54 exécutées seulement sur la copie.
- Base réelle SHA-256 toujours `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c` ; classeur SHA-256 `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`, inchangés.
- Dry-run MD/CSV/JSON régénéré dans `outputs/catalogue-lot3`, bilan `CONTRACTUAL_LOT3_CATALOG_IMPORT.md` mis à jour. **Arrêt avant toute écriture réelle, attente du feu vert AtoumWeb.** Aucun commit/push/merge, publication, Lot 4, Bridge ou 8C.

### 2026-10-03 — CONTRACT-LOT3-003 — Fermeture technique et application réelle autorisée

- Décision AtoumWeb : nouveau dry-run validé ; application Lot 3 à Validation-MSI autorisée si suite complète/typecheck verts, diff prévu, backup physique immédiat, aucun WAL actif non sauvegardé et jeton/empreintes inchangés. Ne pas démarrer Manager, publier V1 ni commencer Lot 4.
- Fermeture sur le code exact : **57 fichiers / 390 tests / 0 échec**, typecheck sortie 0, 20 fichiers Lot 3 attendus, aucun staged, HEAD local Lot 2 inchangé. Nouveau dry-run sur copie retrouve les mêmes hashes et le jeton `a2e19182789da172c8097e796293ea1e778d7b0bfaa23edb02020275215b3bd4`.
- WAL présent vide / SHM présent ; verrou d'écriture exclusif vérifié en refusant une seconde connexion d'écriture. Sauvegarde physique immédiatement avant application, intégrité OK, SHA `5756168d25f3fcac9677da52919213a5953d5eb717150f3be287e7966798eb0c`, fichier `C:\DEV\02_DONNEES\AtoumWeb\Validation-MSI\backups\before-lot3-2026-10-03T11-33-56-510Z.sqlite`. Manager non démarré.
- Migrations **53/54** et import réalisés sous une transaction englobante, opérations existantes imbriquées via savepoints ; contrôle du plan et des fichiers immédiatement avant import, conservation des anciennes colonnes après migrations, rollback complet au moindre écart avant COMMIT. SQL 1–53 intact, aucun seed.
- Résultat réel : **91 créations, 21 reprises par nouvelle version, 15 archives réversibles sans AW, 9 génériques conservés, 112/112 codes AW, 112 nouvelles versions BROUILLON**, 136 items / 157 versions / 44 anciennes versions publiées inchangées / 113 brouillons / 127 entrées de journal / 1 passage.
- Les huit anciens objets ambigus n'ont aucun code AW ni nouvelle version ; leurs métadonnées hors statut/dates sont intactes. Les 21 reprises gardent UUID/anciennes versions ; liens blueprint et compositions recopiés exactement. Deux anciens liens blueprint conservés + une copie = trois liens totaux.
- Comparaisons exhaustives par table puis contre-vérification SQLite indépendante avec backup : anciens devis `DEV-2026-001/002/003`, lignes/snapshots, Projets, documents, anciennes versions et tables contractuelles inchangés. Aucune clause injectée rétroactivement.
- Après COMMIT : `integrity_check=ok`, `foreign_key_check` vide. Rejeu réel zéro opération et toutes les tables strictement inchangées, activité et journal compris. Checkpoint WAL réussi, base après SHA `81395f7ea2cd6a5c821100b3e1dc952a238a25523b73c1f32eb7af90fb111f5b` ; XLSX toujours `3652a835d847aec83eb346ec0ba212d2f8bf91f1e8d7235d1773bb088485b686`.
- Bilan `CONTRACTUAL_LOT3_CATALOG_IMPORT.md`, preuves réelles `outputs/catalogue-lot3/application-lot3-validation-msi.md/json`, contre-vérification et fermeture sur copie conservées. Les entrées -001/-002 décrivent la préparation antérieure et ne font plus foi pour l'état réel.
- **Lot 3 appliqué sans publication, non committé. Arrêt et attente du feu vert avant Lot 4.** Recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale ; aucun push/merge, clauses/409 liens, Abby, Bridge ou Lot 8C.

### 2026-10-03 — CONTRACT-LOT3-004 — Clôture locale dédiée autorisée

- AtoumWeb valide le bilan réel du Lot 3 : 112 AW, 91 créations/21 reprises/15 archives/9 conservations, 112 versions brouillon, historique et rejeu préservés.
- Autorisation : commit local dédié « Lot 3 — reprise catalogue commercial V1 », sans push ni merge, rappelant la recette manuelle AtoumWeb restant à faire avant validation fonctionnelle finale.
- Aucune modification du Lot 4 incluse dans cette clôture.

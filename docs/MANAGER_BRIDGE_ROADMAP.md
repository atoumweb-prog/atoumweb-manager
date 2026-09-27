# Manager ↔ Bridge — Architecture, feuille de route et journal partagé

Date d'ouverture : 27/09/2026.

## 0. Statut et mode d'emploi pour les agents

**Document de coordination commun. Publication de la feuille de route autorisée ; aucun lot de développement autorisé par cette publication.**

- Dépôt : `atoumweb-prog/atoumweb-manager`.
- Branche de référence : `feature/project-blueprints-v1` ; PR principale : #73.
- Socle technique audité : `4f8fa15c80da874e084648b1d643a316cbfcbcb2`.
- PR #74 / CGV Builder déjà intégrée : ne pas la fusionner à nouveau.
- Les choix ci-dessous sont les recommandations issues de l'audit. Les arbitrages de la section 14 doivent être confirmés avant implémentation ; un lot nécessite une autorisation explicite.
- Ce document complète le cahier des charges ; il ne remplace pas `PROJECT_STATUS.md`, qui résume l'avancement réellement vérifié.
- Le code du plugin Bridge n'a pas été examiné dans cet audit d'architecture. Bridge 0.8.0 et ses capacités annoncées restent à confronter au code et à la recette, pas à supposer acquises.

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

| Existant vérifié côté Manager | Conséquence |
| --- | --- |
| Projet créé depuis un devis accepté ; prestations et références des sources conservées | Séparation commercial/opérationnel déjà amorcée. |
| Nœuds Projet de type module et `displaySubtype=page` | Réutiliser cette identité au lieu de créer un second arbre de pages. |
| Composition ordonnée avec version Bibliothèque précise par élément | Base adaptée à une sélection de composants, pas à la totalité d'une page. |
| Composition sans lien Projet/Site/Page | Destination métier à ajouter. |
| Snapshots : pages, nœuds, parents, attributs, responsive, design, classes, IDs et références de sources | Réutiliser ce socle pour observer la page réelle. |
| Sources avec scope, origine, propriétaire et références de contenu | Conserver la provenance du CSS plutôt que le fusionner dans le composant. |
| Retour d'occurrence validé, fichiers contrôlés par empreinte, décisions Famille/Variante | Prolonger le suivi de destination et des révisions locales. |

Limites : les semantic keys sont rapprochées à l'échelle du projet ; `pages.home` ne distingue pas deux sites. L'idempotence des retours par empreinte de package ne suffit pas à gérer les retours obsolètes ou concurrents. Les champs du Snapshot ne prouvent pas que tous les réglages Divi soient effectivement capturés.

Sources de cet audit :

- `src/main/projects/ProjectService.ts`, `src/shared/projects.ts` et `src/main/database/projectBlueprintMigrations.ts` ;
- `src/main/referentials/AtoumWebCompositionService.ts`, `AtoumWebCompositionPackageService.ts` et migration 43 ;
- `src/main/database/bridgeSnapshotMigration.ts` ;
- `src/main/referentials/AtoumWebOccurrenceReturnService.ts` et migration 39 ;
- `docs/ATOUMWEB_SITE_OCCURRENCE_V1.schema.json` et `docs/ATOUMWEB_OCCURRENCE_RETURN_V1.schema.json`.

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
| Occurrences suivies | Identité durable, Page, élément de composition d'origine, version Bibliothèque source et révisions locales. |
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

- `compositionItemId` : intention d'insertion préparée dans Manager ;
- `occurrenceId` : utilisation suivie durablement dans une page ;
- `siteOccurrenceId` V1 : identité créée par Bridge, conformément à `createdBy=bridge` ;
- identifiant de nœud Snapshot : observation technique, potentiellement variable.

La nouvelle enveloppe relie explicitement ces identités ; elle ne change pas silencieusement le sens du V1. Un déplacement conserve l'identité ; une duplication crée une nouvelle occurrence. Un marqueur dupliqué doit être détecté, pas accepté comme deux occurrences identiques.

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

1. Manager prépare une Page et certaines occurrences avec versions sources précises.
2. Il enregistre un export immuable et son empreinte.
3. Bridge vérifie format, destination et imports antérieurs, puis prépare un Workbench.
4. Un accusé de réception associe export, occurrences et éléments WordPress/Divi.
5. L'utilisateur travaille librement dans Divi.
6. Bridge observe occurrences et contexte Page, en déclarant la couverture du scan.
7. Manager importe le retour et compare à la base connue.
8. L'utilisateur conserve localement, examine une divergence ou prépare une promotion.

### Enveloppe page versionnée proposée

Faire évoluer `atoumweb_bridge_project_package` par une version explicite ou un contrat additionnel négocié avec Bridge. Conserver les contrats internes Component/Fields/Identity/Site Occurrence/Return V1 et Snapshot V1.

| Groupe | Champs conceptuels |
| --- | --- |
| Destination | `scope=page`, `projectId`, `siteId`, `pageId` |
| Préparation | `compositionId`, révision ou empreinte |
| Échange | `exportId`, empreinte du manifeste, versions de contrat |
| Occurrences | `occurrenceId`, `compositionItemId`, source Bibliothèque/version, configuration |
| Placement prévu | Ordre initial, conteneur attendu ou politique de placement |
| Provenance | Origines des composants, séparées de la destination |

`scope=page` désigne la destination, jamais une autorisation de remplacer toute la page. Déclarer explicitement le contenu partiel et la politique d'application. Un conteneur attendu absent est une anomalie, pas une permission de placement arbitraire.

Préférer un seul identifiant logique `exportId`, également identifiant du package, à deux UUID synonymes. L'empreinte du contenu reste distincte. Les champs imbriqués nécessaires vont dans la nouvelle enveloppe ; les schémas V1 fermés ne doivent pas recevoir des propriétés interdites.

### Retour proposé

- `returnId`, export de base et révision observée ;
- Site, Page, Workbench, occurrences et correspondances externes ;
- configuration actuelle, changements de contenu et de placement, dépendances ;
- références Snapshot/fichiers et empreintes ;
- couverture, éléments non résolus et éventuelles suppressions confirmées.

Idempotence : même ID/même contenu = pas de doublon ; même ID/contenu différent = rejet ; retour ancien = historique conservé sans remplacer l'état récent.

Comparer trois états : base exportée, préparation Manager actuelle, état Divi retourné. Détecter les conflits avant toute application. Pas de fusion automatique générale HTML/CSS. Valider/préparer les fichiers avant l'écriture définitive, conserver une importation atomique ou compensée.

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

Préalable contractuel → 6A Cibles métier → 6B Composition partielle → 7 Blueprint → 8A Identités/export → 8B Observation hybride → 8C Retours/décisions → 9 Préparation multi-pages → checkpoint final.

Les lots suivants sont tous **non commencés dans le cadre de cette feuille de route**. Leurs numéros sont des repères proposés, pas des autorisations.

## 13. Lots détaillés

### Préalable — Contrat partagé Manager/Bridge

- Objectif : vérifier le vrai plugin, ses identités, la duplication Divi, sa couverture de scan et le format multi-composants.
- Changements : exemples d'échanges et arbitrages documentés ; pas d'implémentation.
- Migrations : aucune.
- Périmètre : contrats Manager, importeur/occurrences/Workbench/scanner Bridge après identification de leur état réel.
- Validation : scénario complet d'une Page avec composants et modules natifs, cas ambigus explicités.
- Dépendance : requis avant 8A ; doit confirmer les choix structurants de 6A.

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

### LOT 8A — Identités, export et réception

- Objectif : exporter une préparation partielle vers un Workbench avec associations vérifiables.
- Changements : occurrences durables, export figé, enveloppe page versionnée, accusé de réception.
- Migrations : occurrences/exports/liaisons strictement nécessaires ; préserver les compositions et retours historiques.
- Périmètre : `AtoumWebCompositionPackageService`, validations partagées, importeur Bridge.
- Tests/acceptation : réimport sans doublons ; mauvaise destination et version non supportée refusées ; source exacte conservée ; accusé complet ; échec sans état faussement terminé.
- Dépendance : préalable + 6B. Préparation Workbench et idempotence seulement ; ne pas généraliser à un écrasement de Page modifiée.

### LOT 8B — Observation d'une Page hybride

- Objectif : comprendre occurrences, modules natifs, placement et contexte sans modifier la Bibliothèque.
- Changements : associations identitaires et observations contextualisées, couverture explicite.
- Migrations : réutiliser Snapshots ; ajouter uniquement liens/révisions manquants, sans modifier Snapshot V1.
- Périmètre : `BridgeSnapshotService`, scanner et suivi d'occurrence Bridge.
- Tests/acceptation : Texte/Image/Code natifs ajoutés, Hero déplacé, padding et CSS Page modifiés ; conservation des observations ; duplication détectée ; scan incomplet sans fausse suppression.
- Dépendance : identités de 8A, base du retour 8C.

### LOT 8C — Retour et décisions

- Objectif : conserver les changements locaux, détecter les conflits et promouvoir volontairement.
- Changements : retours révisés, ordre des observations, décisions par occurrence, entrée volontaire pour candidat natif.
- Migrations : liens/historique d'application nécessaires, sans effacer les retours V1.
- Périmètre : `AtoumWebOccurrenceReturnService`, Familles/Variantes, interface de revue.
- Tests/acceptation : retour répété/ancien/concurrent ; échec compensé ; source intacte ; spacing de placement exclu par défaut d'une promotion ; élément natif jamais promu automatiquement.
- Dépendance : utilise 8B et les fonctions Bibliothèque existantes.

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

## 14. Arbitrages à confirmer avant implémentation

Recommandations à examiner/valider, pas validations supposées :

1. Page = nœud Projet + extension, une seule identité.
2. Composition partielle/facultative, une active par Page au départ.
3. Site logique distinct de l'installation ; Workbench distinct de la Page finale.
4. Occurrence durable distincte du nœud Snapshot, duplication explicitement traitée.
5. Enveloppe page versionnée sans remplacement implicite ; contrats internes V1 préservés.
6. Conservation locale par défaut, promotion Bibliothèque volontaire.
7. Premier réimport limité au Workbench et à l'idempotence ; mise à jour d'une Page modifiée à cadrer séparément.

## 15. Recommandation d'exécution

Vérifier le contrat d'identité Bridge, puis 6A/6B. Ajouter le confort de génération par blueprint avec 7. Réussir ensuite un parcours complet sur une Page hybride avant de passer au multi-pages.

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

# Lot 8A.1 — Bilan de préparation locale

Date : 04/10/2026. Statut courant : **migration 61 seule appliquée, aucune activation réelle, recette manuelle à faire**.

Mise à jour après autorisation AtoumWeb : les 40 fichiers préparés étaient conformes aux empreintes avant écriture. Validation-MSI est maintenant en migrations 1–61, SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33** ; source/sauvegarde avant application **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8**. Table 61 et cinq tables 8A vides ; 117 tables historiques comparées et contre-vérifiées indépendamment (lignes 1–60 du registre conservées, seule entrée 61 ajoutée). Intégrité OK/FK vide, rejeu neutre, aucun auxiliaire résiduel. Aucun import/ready/raccord/backfill/commit/push/merge. Les sections de préparation ci-dessous décrivent les preuves et scénarios antérieurs ; le bilan d’application fait foi pour l’état actuel de la base.

Branche `feature/project-page-compositions-v1`, HEAD conservé `cfe3a01f5365b885f51bdbe9b9d47fbf408f832e`. Aucun commit, push ou merge. Les décisions AtoumWeb complètent le plan historique `outputs/operational-lot8a1/PLAN_LOT8A1.md` ; ses trois questions restantes sont désormais tranchées comme décrit ci-dessous. La classification métier reste **6 A / 6 B / 43 C / 39 D**.

## Résultat et périmètre

Les contributions gouvernées par une configuration 8A.1 utilisent un plan structurel **schemaVersion 2, bases[]**. Une occurrence commerciale possède sa propre branche, son identité de Site et ses Pages. Les addons ciblent des identités persistées, sans fusion par nom. Les actions restent les tâches du moteur opérationnel 8A ; les calculs du chrono et des pauses restent ceux du système existant.

Les politiques A/B/C/D sont vérifiées contre la version exacte du catalogue, du modèle opérationnel et du blueprint structurel. Leur configuration est conservée dans la provenance versionnée des associations existantes, puis épinglée dans les révisions commerciales et instances d’actions. Le modèle n’introduit pas de second moteur de production.

La seule nouvelle table SQL est `project_contribution_targets`. La migration 61 et les nouvelles configurations ont été exécutées **sur copies/fixtures uniquement**. Aucune publication, aucun import des 112 modèles réels, aucun passage réel en ready, aucune Vitrine V2 réelle, aucune nouvelle version commerciale réelle, aucune association métier réelle ni backfill. Aucun Lot 8B, Abby, Bridge ou 8C.

## Modèle, versionnement et manifeste

`ContributionPolicy` contient : version de schéma ; classe A/B/C/D ; rôle base/addon/none ; nécessité de blueprint ; modes Site permis ; quantité minimum/maximum entière ; mode actions `per_sold_unit` ; mode structure `once/per_unit/none` ; limite agrégée par Site ; slots exacts Site/Page/context ; moment preparation/integration ; politique de sélection automatique ; capacités requises ; mapping exhaustif des **actionKey** ; origine `direct_sold_line` ; source de décision ; validation métier du mapping D.

`StructureContract` décrit les slots Site avec `provides` et modes autorisés, les Pages par ID de nœud de template et quota content/auxiliary, et les modules avec leur slot de Page parente. Cette déclaration est comparée au blueprint exact. Les Pages légales auxiliaires restent une liste explicite, non déduite du nom et non inventée pendant cette préparation.

Le manifeste de configuration implémenté est :

```ts
{
  schemaVersion: 1,
  sourceSHA256: string,
  decisionReference: string,
  entries: [{
    code: string,
    catalogVersionId: string,
    modelVersionId: string,
    blueprintVersionId: string | null,
    configuration: ContributionPolicy
  }]
}
```

Le service vérifie l’égalité des codes/objets catalogue/modèle, les versions exactes et les politiques. Il simule les révisions d’association, calcule les empreintes manifeste/plan et refuse un plan devenu différent au moment de l’application transactionnelle. Un rejeu identique est neutre. Il ne publie rien et ne met aucun modèle en ready. Les fixtures prêtes sont préparées séparément sur copie. L’exemple `manifest-fixture-8a1.json` utilise des IDs temporaires : **ce n’est pas un manifeste d’import réel autorisé**.

Les nouvelles politiques ne requalifient pas les anciennes versions commerciales. Les liens gouvernés ne peuvent pas être rétrogradés silencieusement vers une configuration absente. Un Projet déjà préparé conserve ses versions/configurations épinglées ; une nouvelle version du référentiel ne le remplace pas.

## Migration 61 et persistance

SQL exact : `src/main/database/projectContributionTargetMigration.ts`, export intégral hors dépôt `outputs/operational-lot8a1/migration61.sql`. Migration strictement additive : **une table STRICT, quatre index et six triggers**, sans ALTER d’une ancienne table, import, données initiales ni backfill. Les migrations 1–60 sont inchangées ; seul le registre ajoute la 61.

Clé primaire : `(project_id, line_origin_id, target_slot_key, unit_index)`. Champs : type de cible ; origine/slot propriétaire du Site ; IDs Site/Page/contexte ; sélection pending/auto_unique/explicit ; état pending/active/out_of_scope ; dernière révision commerciale ; dates de création/mise à jour. Relations vers Projet, Site, nœuds et révision en DELETE RESTRICT.

Les CHECK/guards imposent la cohérence du type et des IDs, la paire propriétaire/slot, l’appartenance au même Projet, une Page reliée au Site choisi et une cible non archivée. L’identité est immuable. L’insertion sur historique/Projet figé est interdite. Après gel, seule la première affectation explicite pending→active d’une contribution D déjà présente est admise ; la suppression d’une cible figée est refusée.

L’historisation utilise le journal existant : auteur, date, ancien pending/cible, nouvelle cible, capacités vérifiées, origine commerciale, association/politique/version et nature de décision. Le gel ne produit pas de nouvelle révision commerciale lors de cette première affectation D.

## Invariants runtime et décisions validées

| Sujet | Comportement implémenté |
|---|---|
| A | Blueprint compatible obligatoire, quantité entière maximum 1 par ligne. Structure requise vérifiée centralement, même si une action individuelle ne demande pas de cible. Deux lignes distinctes donnent deux occurrences isolées. |
| B | Blueprint addon et destination nécessaires. Un unique Site de base compatible peut être ciblé automatiquement ; ambiguïté ou absence donne pending/conflit et aucun effet structurel fictif. Page parente toujours explicitement choisie pour les modules. |
| C | Aucun blueprint/slot/capacité structurelle propre autorisé, zéro faux Site/Page. Un autre achat A peut néanmoins créer la structure de ce même Projet. |
| D | Aucun effet structurel automatique. Cadrage sans cible possible. Acceptation autorisée avec pending, y compris si une action est marquée preparation ; les actions exigeant Site/Page/context restent bloquées jusqu’à affectation valide. |
| D après acceptation | Première affectation opérationnelle tracée, sans modifier prestation/prix/quantité/périmètre ni révision commerciale. Réaffectation figée refusée. Un changement commercial exige un nouveau parcours commercial. |
| Action dépendante | Démarrage, chrono manuel/automatique, reprise, déplacement d’une session sur une autre action et clôture d’action/phase protégés. Une correction de durée historique ne devient pas une nouvelle action d’intégration. |
| Capacités | Fournies uniquement par la base explicitement configurée sur le Site effectivement ciblé. Aucun emprunt aux capacités d’un autre Site. Site manuel/historique : liste vide, choix possible seulement sans exigence spéciale. |
| Blog | Quantité 1 par ligne et maximum 1 par Site, contrôlé aussi entre lignes distinctes, cibles explicites et automatiques. Un Blog sur chacun de deux Sites reste possible. |
| Landing | Nouveau Site standard ; Site existant uniquement par choix explicite et politique autorisée. Une Page, pas huit Pages pour les huit sections. |
| Woo | Boutique/Panier/Commande/Mon compte, pas d’Accueil ajouté implicitement. Produits simples/variables : modules, zéro Page supplémentaire, capacité woocommerce obligatoire. |
| Mariage | Une Page par formule ; variantes de sections/contenus, sans activation de données RSVP sensibles. |
| Modifications humaines | Noms, estimations, checklist, position et statut restent protégés. IDs/cibles conservés au rejeu ; aucun rapprochement par libellé. |
| Retrait | Action vierge retirée selon le moteur existant ; action travaillée/avec temps : conflit visible et historique conservé. Cible utilisée par effet structurel/temps/action dépendante verrouillée par unité/slot, sans bloquer abusivement les autres unités de la ligne. |
| Historique | Plans v1 et blueprints historiques restent utilisables dans leur parcours. Blueprint complet avec tâches + nouveau modèle est bloqué, sans retrait automatique de tâches. |

Pour les projets multi-bases, `projects.template_version_id` reste NULL et `bases[]` fait foi. La forme historique mono-base est préservée. La simulation démontre aussi l’ajout ultérieur d’une seconde base sans redirection implicite d’un addon déjà choisi.

## UI et garde de préparation

Le devis dispose d’un aperçu **sans création de Projet** : bases, actions, origines, classes et destinations pending. Le jeton d’aperçu est recalculé/contrôlé avant préparation ; changement du devis ou du contexte = refus de l’ancien aperçu.

Le panneau du périmètre Projet expose les choix Site/Page/context par IDs, les capacités requises, la cible actuelle, les conflits et les verrouillages. Une Page parente n’est jamais choisie par son nom. Après acceptation, le panneau permet la première affectation D admissible mais ne rejoue pas le commerce figé. Le détail de l’action explique le blocage d’intégration.

L’auteur est renseigné dans l’interface locale et journalisé ; ce champ ne constitue pas une authentification utilisateur externe. Recette réelle AtoumWeb restant à faire. Les contrôles UI utilisent les vrais composants React dans Chromium avec IPC simulé, sans démarrer Manager sur Validation-MSI.

## Tests et simulations

- **Suite complète : 590/590**, 65 fichiers, zéro échec. 55 cas ciblés de contributions et un test dédié de migration/rejeu s’ajoutent au socle antérieur.
- **Typecheck : OK**.
- **UI trois thèmes : 180/180**, zéro échec : cibles 51, parcours prévisionnel/aperçu 60, actions/temps 69. Captures blanc/noir/Atoum contrôlées visuellement.
- **Simulation SQLite physique sur copie : 971/971**, 47 enregistrements de scénarios, zéro échec. Intégrité OK, foreign_key_check vide. Copie temporaire supprimée par le lanceur.
- Migration 61 sur copie : ancienne donnée comparée colonne/ligne, table nouvelle initialement vide, rejeu sans mutation logique ou physique. Test de migration indépendant également présent dans la suite.

Les scénarios emploient **19 modèles sélectionnés AW-TEST8A1**, des lignes/catalogues synthétiques et des structures de fixture. Les temps proviennent du référentiel normalisé. Vitrine structurelle est clonée du blueprint publié réel uniquement sur copie ; les 13 tâches historiques sont écartées seulement dans ce clone conformément à la règle validée. Le changement de modèle V2 avec +5 minutes concerne exclusivement une fixture de test de versionnement, jamais le référentiel métier.

### Résultats arithmétiques et structurels

| Cas | Actions | Référence | Sites / Pages |
|---|---:|---:|---:|
| Vitrine | 21 | 24 h 30 | 1 / 5 |
| Deux occurrences Vitrine distinctes | 42 | 49 h | 2 / 10 |
| Landing | 13 | 12 h 45 | 1 / 1 |
| WooCommerce | 20 | 42 h 30 | 1 / 4 |
| Mariage Essentiel / Grand Jour / Histoire | 9 / 10 / 10 | 10 h 30 / 17 h / 23 h | chacun 1 / 1 |
| Vitrine + 1 Page + Blog | 30 | 29 h 15 | 1 / 7 |
| Vitrine + 2 Pages | 29 | 28 h | 1 / 7 |
| Vitrine + option 2 Pages + Blog | 34 | 31 h | 1 / 8 |
| Option disponible seulement | 21 | 24 h 30 | 1 / 5, aucun effet option |
| Landing + Section | 16 | 13 h 20 | 1 / 1 |
| Woo + produit simple / variable | 23 / 23 | 43 h / 43 h 15 | 1 / 4 |
| Woo + 2 produits simples | 26 | 43 h 30 | 1 / 4, cibles par unité |
| Pack 4 articles SEO | 4 | 13 h | 0 / 0 |
| Article SEO / Logo / Audit SEO | 5 / 6 / 6 | 3 h 30 / 7 h / 4 h 30 | chacun 0 / 0 |
| Application sur mesure | 3 | 3 h indicatives | 0 / 0, estimation finale absente |
| D WordPress synthétique en cadrage pending | 3 | 2 h indicatives | 0 / 0, estimation finale absente |

Les heures indicatives ne deviennent pas une estimation finale pour les références à estimation obligatoire. Les 18 références/44 actions Lot 8B et les packs restent sans activation ; aucune nouvelle valeur métier n’a été appliquée au XLSX.

### Couverture du §10 du plan

| Groupe de scénarios | Preuve |
|---|---|
| A sans structure/incompatible, A×2, deux bases isolées | Tests ciblés + simulation copy : refus/absence de mutation, IDs distincts |
| Landing nouveau/existant, Woo 4 Pages, trois Mariage | Tests + copie avec comptages ci-dessus |
| Page/Blog, quantité 2, provenance achat explicite | Tests + copie ; disponible ≠ acheté, même service manuel distinct |
| Blog×2/deux lignes même Site/explicite + automatique | Tests + copie ; refus agrégé, deux Sites un Blog chacun autorisé |
| Landing Section et Woo simple/variable | Tests + copie ; parent exact, capacité locale, quantité par unité |
| Mauvaise capacité, Site manuel/historique, Woo ailleurs | Tests + copie ; aucun privilège implicite |
| Deux bases + addon / seconde base après auto-choix | Tests + copie ; sélection explicite, aucune redirection silencieuse |
| C sans structure et C avec blueprint accidentel | Tests + copie ; cas non-WEB, refus configuration incohérente |
| D pending, acceptation et première cible tardive | Tests + copie ; journal et révision commerciale immobile |
| D Site/Page/context, intégration, chrono et clôture | Tests + copie ; exigences synthétiques, aucune activation des 39 D réelles |
| Page déplacée/archivée et corrections du temps historique | Tests + copie ; garde cible et conservation de l’historique |
| Révision/rejeu, manuel, retrait vierge/travaillé/base utilisée | Tests + copie ; conflits et provenance conservés |
| Nouvelle version modèle/configuration | Tests + copie ; ancien Projet épinglé, nouveau Projet distinct |
| Plan v1/historique, blueprint complet / structure sans modèle | Tests + copie ; absence de backfill et blocage du doublon |
| Aperçu sans écriture, jeton périmé | Tests + copie + UI |
| Migration additive/rejeu/integrity/FK/ancienne donnée | Test dédié + copie physique + preuve source immutable |

Les 47 scénarios comprennent des succès et refus ; le JSON conserve les contrôles détaillés et instantanés, le tableau arithmétique ne constitue pas à lui seul la totalité de la simulation.

## Matrice D proposée, sans activation

`matrice-39D-proposee.md/csv/json` contient **39 références et 146 actionKey**, chacune avec requirement none/site/page/context, requiredAt preparation/integration, justification et provenance de ligne. Répartition V1 validée : **59 none, 33 site, 24 page, 30 context**. Seule correction AtoumWeb : `AW-SEO-PERF-A04`, none/integration → site/integration, car la mesure après intervention requiert le Site mesuré. L’ancienne matrice est conservée dans `historique/matrice-39D-avant-validation.json`.

Statut : **VALIDÉ V1 PAR ATOUMWEB, NON ACTIVÉ**. Le moteur requiert une revue approved explicite pour les mappings réels D ; la seule exception fixture est limitée aux codes AW-TEST8A1. Le runtime ne lit pas les intitulés pour établir les exigences. Les guards d’intégration sont testés avec des configurations synthétiques ; la validation documentaire ne crée aucune association réelle.

## Invariance de Validation-MSI et des sources

SHA source avant/après : **fdbc81cb98e20fe5f2fa862d7f8311448215dc98e99d1c3bc49d7753aee667a8**. Ouverture de vérification SQLite `mode=ro&immutable=1`, aucun checkpoint source. Les **117 tables existantes, y compris auxiliaires FTS**, ont les mêmes empreintes de lignes que le relevé initial ; l’empreinte physique de toute la base est identique. Aucun WAL/SHM/journal détecté.

État réel conservé : migrations **1–60** ; table 61 absente ; cinq tables Lot 8A vides ; 112 AW, 112 versions catalogue V1 BROUILLON, 118 clauses BROUILLON, zéro clause publiée, 409 liens, achats d’options zéro. Trois devis, deux Projets, trois Sites, onze Pages, 36 nœuds, six sessions et deux versions blueprint inchangés. Intégrité OK/FK vide.

XLSX source inchangé : **c2c5c139d66d4d9fe9d90863f3cdacb6dad617eb4ce692e6ac31cf352eeb26cf**. Preuve exhaustive : `verification-finale-preparation.json` ; état initial : `baseline-8a1-source.json`.

## Fichiers et limites avant application

Liste exhaustive des fichiers et SHA : `fichiers-modifies.md` et `verification-finale-preparation.json`, hors dépôt. Les six tests existants de fin de chaîne migrations sont adaptés pour attendre 61 ; leur rôle métier n’est pas refondu. Les modifications couvrent les types, moteur/provenance, table/guards, IPC, UI, contrôles temps/statuts, tests et scripts isolés. Aucun SQLite, sauvegarde, XLSX, JSON de simulation ou capture dans les modifications du dépôt.

Reste à faire après validation distincte : recette manuelle ; préparation des associations/versionnements réels et de leurs manifestes exacts ; choix explicites des données du Projet non encore connus. Matrice 39 D désormais validée mais non activée. Aucune qualification de capacités d’un Site manuel, aucun scan ou activation récurrente n’est ajouté.

**Migration 61 seule désormais appliquée à Validation-MSI, table vide.** L’application ne comprend ni import, ni ready, ni raccord commercial réel. Bilan réel et contre-vérification dans `outputs/operational-lot8a1/application-migration61-validation-msi.md/json` et `contre-verification-migration61.json`. Arrêt pour revue AtoumWeb, aucun commit.

## Clôture locale autorisée — 05/10/2026

AtoumWeb valide la migration 61 et autorise le commit local dédié du Lot 8A.1, sans push ni merge. Les 40 fichiers, le code fonctionnel et la migration sont conformes aux contrôles validés ; les mises à jour documentaires ci-dessus ne créent aucune nouvelle règle métier. Le commit contenant cette section clôture le lot ; SHA et preuve dans `outputs/operational-lot8a1/cloture-git-lot8a1.json`, hors dépôt. Base conservée au SHA **fab939b09609a76fde90cfabc57ea38cf6ddaf353c2f4b9499c9ec072edcfc33**, migrations 1–61, six tables opérationnelles/cibles vides. Aucun import/ready/raccord réel ; recette manuelle à faire. Arrêt après commit, étape suivante non commencée.

# LOT 04 — Audit d'avancement et clôture technique (14 octobre 2026)

**Décision : EN DÉVELOPPEMENT. PR #118 draft, aucune intégration dans `main`.**

## Méthode et limites des chiffres

Pourcentage **indicatif de couverture fonctionnelle**, calculé à partir de rubriques de réception regroupées et pondérées également : une rubrique compte **1** seulement si le code attendu est effectivement présent ; les rubriques partiellement livrées restent ouvertes. Pour la validation, une rubrique compte **1** lorsque la preuve sur un SHA est disponible et couvre le risque, même si la recette intermodules reste ouverte. Ces pourcentages ne mesurent ni les heures passées, ni la probabilité de fusion, ni le taux de tests unitaires réussis. Les listes de rubriques sont ci-dessous ; toute absence de preuves doit être réévaluée et ne doit pas être comptée comme validation.

| Sous-lot | Développement (rubriques satisfaites) | Tests/validation (rubriques prouvées) | Intégration | Écart principal | Blocage |
|---|---:|---:|---|---|---|
| **04A** Audit et reprise | **67 % (4/6)** | **33 % (2/6)** | Non prêt | Inventaire de données de catégorie sur fixture et audit sur dernier main non clos | Dépendance |
| **04B** Catégories/navigation | **89 % (8/9)** | **78 % (7/9)** | Prêt sur branche, non convergé | Revue visuelle humaine et épreuves sur candidat convergé | Dépendance |
| **04C** Édition/versions/brouillons | **78 % (7/9)** | **67 % (6/9)** | Prêt sur branche, non convergé | Certaines comparaisons/restaurations ciblées et recette consolidée | Technique |
| **04D** Associations/recommandations | **50 % (4/8)** | **50 % (4/8)** | Non prêt | Motif/priorité/état, recommandations en Prospect/Devis, recette intermodules | Technique + métier |
| **04E** Aide à la vente | **50 % (4/8)** | **38 % (3/8)** | Non prêt | Versionnement/restauration comparée, motifs, contrôles contextuels complets | Technique |
| **04F** Recette/intégration | **80 % (8/10)** | **70 % (7/10)** | Non prêt | Intermodules, revue humaine, convergence `main` | Dépendance + technique |

**Développement global = 70 %** (35 rubriques fonctionnelles codées sur 50 : 4+8+7+4+4+8 ; pondération égale par rubrique, estimation prudente). **Validation globale = 58 %** (29 rubriques prouvées sur 50 : 2+7+6+4+3+7=29). **Préparation convergence = 20 %** (1/5 portes : cartographie des dépendances ; restent candidate à jour de main, conflits, CI convergée, revue de fusion). Ces ratios sont des **estimations d'acceptation**, non des certifications.

### Rubriques d'acceptation retenues (liste auditable)

- **04A (6)** : cartographie modèle et invariants ✅ ; composants/pages/usages ✅ ; frontières CGV/devis/projets ✅ ; inventaire catégories de fixture ✅ (112 fiches / 13 catégories ; test CI en attente) ; revue du code sur main courant ☐ ; recette indépendante du diagnostic 04A ☐.
- **04B (9)** : offres prioritaires ✅ ; autres offres accessibles ✅ ; catégories A–Z ✅ ; administration des catégories ✅ ; recherche versionnée ✅ ; états/filtres/historique ✅ ; recherche Prospect ✅ ; recherche Devis ✅ ; revue visuelle finale ☐. Tests spécifiques cross-context encore à rapprocher du référentiel.
- **04C (9)** : huit onglets ✅ ; édition brouillon CAS ✅ ; vN+1 idempotente ✅ ; publication contrôlée ✅ ; tarification/Abby ✅ ; références contrat/production ✅ ; historique lisible ✅ ; restauration/compare de tous champs ☐ ; recette consolidée de tous parcours avec navigation et `main` ☐.
- **04D (8)** : stockage N:N/version et migrations ✅ ; validations déduplication/CAS ✅ ; copie vN+1/historique ✅ ; panneau d'administration/UX-01 ✅ ; motif/priorité/état administrables ☐ ; consommation réelle Prospect ☐ ; consommation réelle Devis ☐ ; recette cross-module complète ☐.
- **04E (8)** : modèle versionné ✅ ; édition de brouillon ✅ ; persistance et copie historique ✅ ; composant d'aide contextuelle commun Prospect/Devis (développé, CI nouvelle à valider) ✅ ; comparaison/restauration ciblée ☐ ; motifs de recommandations partagés ☐ ; parcours clavier/focus complets dans tous les contextes ☐ ; recette contextuelle de bout en bout ☐.
- **04F (10)** : typecheck ✅ ; Vitest complet ✅ ; SQLite/FK/migrations ✅ ; restauration ✅ ; Electron réel TEMP ✅ ; UX-01 ✅ ; erreurs/réponses tardives ✅ ; neuf captures émises avec empreintes ✅ ; recette Prospect→Devis→Projet et autres lots ☐ ; convergence et CI candidate `main` ☐.

> Le score 04E ci-dessus inclut du **code récent non encore certifié** ; le score de validation 04E exclut la CI en attente. Les calculs globaux ne doivent pas être confondus avec des « 100 % » par sous-lot.

## Périmètre Git et preuves

| Périmètre | PR / branche | SHA contrôlé | CI ou statut |
|---|---|---|---|
| Référentiel normatif | [#82](https://github.com/atoumweb-prog/atoumweb-manager/pull/82) / `docs/ux-v2-reference-v1` | `0bb0860ee7618af92a53d8711b4a06edbbadc4d6` | PR de documentation, non intégrée |
| Audit 04A | [#103](https://github.com/atoumweb-prog/atoumweb-manager/pull/103) | `00c048ddc77ae69ff24ad058c6255ab572324c40` | Audit documentaire de l'ancien main |
| 04B | [#104](https://github.com/atoumweb-prog/atoumweb-manager/pull/104) | `57afcdae599fccfee6ab15d0055d58494c42c2d7` | [CI #1045](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38579679237) : PASS |
| 04C | [#108](https://github.com/atoumweb-prog/atoumweb-manager/pull/108) | `2412513be4fb0f2ca87602adcdef4aaa31760ea3` | [CI #1003](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38573720049) : PASS |
| 04D/04E/04F — précédent HEAD certifié | [#118](https://github.com/atoumweb-prog/atoumweb-manager/pull/118) | `b56c1f6d6de540087774486654df3e80d99ed84f` | [CI #1275](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38597862198) : **PASS** |
| 04E — champs situations/vigilances | PR #118 | `3ea612a33f5c999fd953d83e2e9aa735a3d6231d` | [CI #1300](https://github.com/atoumweb-prog/atoumweb-manager/actions/runs/38598595582) : **FAIL typecheck**, erreur de test (deux propriétés doublées), corrigée ultérieurement |
| 04E — aide contextuelle | PR #118 | À relever à chaque nouveau HEAD | CI post-correction en cours ; **aucune validation attribuée par anticipation** |

**CI #1275** : TypeScript PASS, **1 113/1 113 Vitest**, **122/122 fichiers**, **15/15 assertions Electron 04D avec IPC simulé**, **7/7 assertions Electron natif/IPC/vrai preload/SQLite TEMP**, **FK=0**, **9 captures PNG avec SHA-256** (3 thèmes × 3 densités), recettes UX-01 et restauration exécutées. Les captures ont été créées et contrôlées par empreinte, **pas examinées visuellement par un humain**.

**Écart avec `main` constaté sur SHA `261a12b3`** : `main@cc0bc679400321f5afacdbee3317ea8acc451518`, branche 04D/04E **296 commits devant / 10 derrière**, ancêtre commun `b2796812ee24c9e9e824f3d66564f2c1a335bffe`, 69 fichiers différents. La PR #108 est également divergente de la tête mise à jour de la branche #104 (**77 devant / 2 derrière**). Le candidat n'est **pas convergé**. Fichiers transverses sensibles : `CatalogService.ts`, `ipc.ts`, `preload.ts`, `CatalogPage.tsx`, workflows CI, migrations.

**04A — contrôle de fixture ajouté** : `docs/ux-v2/LOT-04A-INVENTAIRE-FIXTURE-2026-10-14.md` documente **112 fiches (6 offres, 106 services), 13 catégories techniques**, aucune collision normalisée sur noms/categories/codes de la fixture ; nouveau test `CatalogInventory04A.test.ts`. **Il ne s'agit pas d'une inspection de données réelles.** Résultat CI de ce nouvel incrément à confirmer.

### Incréments correctifs réalisés pendant l'audit

- **04E** : `commercialParameters.relevantSituations` et `commercialCautions` ajoutés au modèle versionné et au formulaire ; contrôles de projection unitaire, SQLite et Electron ajoutés. `CommercialScope`, déjà consommé dans Prospect et Devis, affiche désormais une aide contextuelle `?` consultative sur la **version reçue** (donc snapshots de lignes préservés), sans aucune action d'achat. Test SSR ajouté. CI #1300 avait échoué sur des clés dupliquées dans une fixture, corrigées au commit `df37e55c`; **CI #1308 verte** sur ce correctif.
- **04D — amélioration complémentaire** : le sélecteur des besoins Prospect préfère désormais les recommandations administrées de versions publiées avec sélection par identifiant de version, filtrage actif/publié, déduplication, garde de réponses IPC tardives ; la table historique `SUGGESTIONS` demeure **repli de compatibilité** uniquement lorsqu'aucun résultat administré admissible n'est trouvé. Cela n'est **pas encore** une clôture d'E106 ni un remplacement définitif. Tests purs et test SQLite de liaison ajouté, CI des derniers commits en attente.
- Le pourcentage 04D reste inchangé dans la grille de tête tant que le parcours Prospect n'est pas certifié de bout en bout et que le motif n'est pas expliqué.
- **Aucune extension du moteur d'achat ni de la provenance d'option de Devis** réalisée durant cet audit.

## Tâches restantes — attribution et priorité

| Priorité | Cat. | Responsable | Tâche précise et preuve de sortie |
|---|---|---|---|
| P0 | A | GPT 04 | Corriger les échecs CI éventuels du dernier HEAD ; TypeScript, Vitest, Electron 04D/04E, UX-01, restaurations, FK et 9 captures **sur le même SHA** |
| P0 | A | GPT 04 | Rapprocher les 15 scénarios 04B, les scénarios 04C, les 26 scénarios 04D, les 18 scénarios 04E et les 25 scénarios 04F du code/test exact : verdict PASS/FAIL/NON EXÉCUTÉ, sans faux succès |
| P1 | B | AtoumWeb / lot 06 | **E105 / E107** : préciser motif, priorité et provenance des recommandations ; convention de l'offre principale quand plusieurs offres sont dans un Devis ; éviter d'inventer une politique commerciale |
| P1 | A | GPT 04 | Ajouter motif et priorité aux recommandations après arbitrage du modèle ; l'UI/SQLite actuelle ne stocke qu'ordre + liens, sans règle de vente |
| P1 | A | GPT 04 + lot 03 | Remplacer la table `SUGGESTIONS` du Prospect par les recommandations effectivement publiées, en préservant l'action distincte « Ajouter aux besoins » et sans création de Devis |
| P1 | A | GPT 04 + lot 06 | Lire les recommandations d'une offre de ligne de Devis avec version exacte, états inclus/option/ajouté/recommandé et achat explicitement volontaire ; pas d'écriture directe dans CGV ou Projet |
| P1 | A | GPT 04 | Compléter la comparaison/restauration d'aides et le focus/Échap dans les trois usages ; tester version ancienne vs brouillon courant |
| P1 | A | GPT 04 | Compléter matrice de prépublication : statut et cible des recommandations, contrôles effectivement bloquants et simples avertissements ; pas de certification juridique |
| P1 | B | Lots 03/05/06/07 | Vérifier versions et snapshots Prospect/Devis/CGV/Projet sans écriture rétrospective ; dépendances des schémas et des API |
| P2 | A | GPT 04 | Mettre à jour l'audit 04A sur le dernier `main` ; inventorier les catégories dans des fixtures et leurs collisions, pas dans Validation-MSI |
| P2 | B | Validation humaine | Inspection réelle des captures et des interactions métier clavier/focus ; cette validation n'est pas un résultat automatisé |
| P2 | A | GPT 04 | Préparer **branche de convergence distincte**, analyser l'ascendance et collisions migrations 67/68, résoudre sans écraser les PR empilées, CI complète sur candidate |
| P2 | C | Codex uniquement en cas de preuve de limite | Recette manuelle Windows complète / manipulation de fusion impossible via outils GPT, **seulement après** épuisement des alternatives et dossier d'opérations précises |

**Codex indispensable à ce stade : NON.** Les modifications de code, lecture GitHub et CI restent possibles avec les outils GPT. **Fusion dans `main` : INTERDITE sans autorisation explicite**, même si la candidate future est verte.


- **Complément 04D post-audit** : le sélecteur de besoins Prospect préfère les liens administrés publiés et actifs, avec déduplication et protection contre les réponses tardives ; la liste historique `SUGGESTIONS` reste un repli **transitoire**, notamment faute de distinguer absence de configuration et intention de ne recommander personne (à décider avant suppression du repli). Tests purs de sélection et contrôle SQLite « pas de Devis créé » ajoutés. Le service retourne maintenant le statut de la **version cible**, et le panneau distingue une version retirée d'une prestation inactive. Test de conservation des cibles retirées ajouté. **Ces nouveaux commits ne sont pas encore certifiés par CI sur dernier HEAD**.

## Risques ouverts

1. Concurrence des PR parallèles et migrations identiques dans des branches différentes ; migration 67/68 non certifiée sur `main` convergé.
2. Recommandation administrative encore sans motif/priorité : risque de conseil opaque.
3. Usage Prospect/Devis non encore alimenté par la nouvelle source 04D ; `SUGGESTIONS` codées en dur.
4. Différence entre capture produite/empreinte vérifiée et validation visuelle humaine ; focus, accessibilité et contrastes à revoir.
5. Aides internes à conserver hors CGV et snapshots contractuels ; ne pas remplacer silencieusement l'aide d'une ancienne version.
6. Les CI sur PR individuelles et SHA anciens ne prouvent pas la compatibilité multi-lots d'un candidat convergé.

**Statut : EN DÉVELOPPEMENT.**

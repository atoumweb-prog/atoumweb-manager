# UX/UI V2 — Lot 04B : alignement strict sur le référentiel (14/10/2026)

**Source normative :** PR #82, `docs/ux-v2/LOT-04B-NAVIGATION-CATEGORIES.md` + `LOT-04-CATALOGUE.md` et `CATALOGUE-CGV.md`.  
**Branche applicative :** `feature/ux-v2-lot04b-catalogue-navigation-v1`, PR #104 (draft).  
**Base initiale :** `main@b2796812ee24c9e9e824f3d66564f2c1a335bffe`.  
**Audit initial :** PR #103 (documentaire).  
**Statut :** incrément de code proposé, **pas de recette Windows exhaustive ni validation humaine**.

## 1. Exigences produit et réponse de l'incrément

| Référentiel 04B | Comportement codé | Limite à traiter |
|---|---|---|
| Quatre offres principales en priorité | Classement dans `catalogSections.ts` : vitrine, e-commerce, mariage, maintenance WordPress. | Les versions/identités des items doivent être vérifiées avec des données de référence et les anciens devis. Maintenance reste `service/subscription` selon l'item. |
| Autres offres toujours visibles | Section distincte ; le tableau historique reste disponible. | Vérifier filtres + panneau détail en recette native. |
| Services complémentaires, catégories et noms A–Z FR | Groupement par `item.category`, alias `catalogDisplay`, `localeCompare('fr-FR')`. | Aucun changement de `familyCode`, item, Abby, version ou catégorie SQL. Catégories sans classification présentées en dernier. |
| Tarifs, formules, inclusions | Cartes principales affichent prix et deux inclusions descriptives **uniquement depuis une version `published`** ; brouillons et retraités explicitement signalés. | Vue administrative, pas validateur juridique ni tableau détaillé de composition. La fiche actuelle reste source des versions complètes. |
| Recherche nom, besoin et code | `catalogAdminFilters.ts` cherche nom, code canonique, Abby, descriptions et `commercialParameters.clientNeed/work` effectivement stockés ; accents/casse normalisés. | Pas d'index de mots-clés/bénéfices libres avant modèle 04E/E96. Les suggestions 04D ne sont pas des achats. |
| Codes techniques secondaires | Les cartes n'affichent plus de `canonicalCode` de manière systématique ; champ/recherche historiques conservés. | Confirmer ergonomie en thèmes et taille réduite. |
| Filtres visibles et réinitialisables | Types, statuts, catégorie principale issue des données, recherche et bouton de réinitialisation. | Préférences de vue 01D/01F à raccorder séparément après test. |
| Administration des catégories | Écart E95 **non résolu** : `catalog_items.category` reste texte libre, sans API `catalog.categories`. | Ne pas simuler créer/renommer/archiver en UI sans contrat service/migration testé. |
| Besoins vs Devis vs projets | Aucune API ou mutation de ces modules dans ce lot ; moteur `CatalogService` et `QuoteService` inchangé. | Parcours de non-régression intermodule à exécuter. |
| UX-01, fiche rapide/agrandie | Nouveau clic de carte appelle `openItem` historique, maintien `useUnsavedDraft`. | Vérifier sortie et remount sur éditeurs réels par recette Electron. |

## 2. État précis des scénarios de recette R04B-01 à R04B-15

**Légende :** « Codé/test prévu » n'est **pas** « validé en exécution ». Les résultats CI et natifs doivent être attachés au SHA final.

| ID | État au 14/10/2026 | Preuve/condition restant à fournir |
|---|---|---|
| R04B-01 | **Codé/test ajouté** : quatre groupes présentés si présents, autres offres conservées. | Vérifier avec fixtures peuplées et captures Electron. |
| R04B-02 | **Codé/test ajouté** : catégories et items A–Z FR. | Cas libellés réels, aliases et petit écran. |
| R04B-03 | **Capacité historique** de création item+brouillon, champ catégorie libre. | Catégorie administrée selon E95 ; valider end-to-end. |
| R04B-04 | **Non réalisé** : renommer une catégorie référentielle. | Décision E95 puis migration/API contrôlées, préserver historiques. |
| R04B-05 | **Non réalisé** : unicité normalisée des catégories. | Analyser collisions réelles, stratégie alias/clé contrôlée. |
| R04B-06 | **Non réalisé** : archive/restauration catégorie. | Règles de réaffectation, statut catégorie et rollback. |
| R04B-07 | **Partiel/test ajouté** : recherche accent/casse et `clientNeed` existant. | Champs mots-clés/bénéfices E96 non créés ; valider sur fixture réelle. |
| R04B-08 | **Codé/test ajouté** : code canonique/Abby trouvables sans cartes dominées par code. | Recette Electron et recherche globale. |
| R04B-09 | **Non modifié** : sélection consultative des besoins Prospect. | Test transversal sur le même SHA, zéro création de Devis. |
| R04B-10 | **Non modifié** : `quotes.addCatalogLine` volontaire. | Test Devis option/recommandé 04D/06 ; ne pas transformer conseil en achat. |
| R04B-11 | **Dépend 04D** : composition et déduplication déjà partielle. | Distinguer inclus/option/recommandé, test double vente. |
| R04B-12 | **Non modifié** : Projet provisoire part des lignes courantes du Devis. | Recette 07P intermodule sur fixtures. |
| R04B-13 | **Non modifié** : retrait/archive conserve snapshots historiques. | Rejouer service/Devis/Projet sur fixture et contrôle SQLite. |
| R04B-14 | **À recetter** : CSS réutilise thèmes, cibles >=14px, grille responsive. | 3 thèmes × 3 densités, fenêtre étroite, zoom, focus et capture par contrôle natif. |
| R04B-15 | **À conclure** : unit tests et GitHub CI déclenchée sur PR #104. | Résultats exacts, scripts Electron isolés, FK/rollback et revue humaine. |

## 3. Décision E95 à instruire, non présumée

**Constat code :** la catégorie est `category?: string | null` dans `CatalogItemInput`, et le SQL stocke cette valeur sur `catalog_items`. Les alias d'affichage et familles canoniques ne constituent **pas** une table de catégories administrables.

**Deux pistes possibles, aucune adoptée ici :**

- **A — Référentiel de catégories versionné/dédié :** identifiant stable, libellé français, clé de comparaison normalisée, état actif/archivé, liaison explicite aux items, compatibilité de lecture avec `category` historique. Tests migration/rollback et impact Devis/CGV avant application.
- **B — Registre/administration compatible texte existant :** table auxiliaire et opérations contrôlées traduites sur les valeurs `category` existantes. Moins de rupture initiale, mais risque plus élevé de collisions et de renommage non traçable.

**Préconisation de travail :** avant choix, inventorier sur des fixtures isolées toutes les valeurs réelles, collisions Unicode/casse/espaces, usages dans IPC, listes, Devis et rapprochement des catégories canoniques V1 (13 codes, 112 fiches de référence). Aucun renommage implicite ni migration du poste MSI.

## 4. Règles de non-régression à garder

- L'affichage « Offres principales » ne change **jamais** `item.type`, `commercialKind`, `familyCode` ou les codes canoniques/Abby.
- La présence d'un prix en administration n'implique **aucune vente** ; aucune version `draft` n'est proposée par la vue comme « publiée ».
- `visiblePublic` n'est pas une publication de page WordPress ; aucune commande Bridge.
- Ajouter un besoin Prospect ne crée ni Devis, ni Client, ni Projet.
- Seules les lignes de Devis explicitement ajoutées et versionnées peuvent déclencher une préparation volontaire de Projet provisoire.
- Le parcours `openItem`, les gardes UX-01, les versions et le tableau d'administration existants restent en place.
- **Aucune modification `main` ou Validation-MSI. Aucun auto-merge.**

## 5. Gate de sortie 04B

1. Typecheck et Vitest sur HEAD final (compter les nouveaux tests, relever SHA et logs).
2. Recette `check-catalog-identity-ui.cjs` mise à jour, puis parcours Electron 04B peuplé avec recherche/filtres.
3. Recette Windows 3 thèmes × 3 densités, fenêtres réduites, clavier, garde brouillons, comparatif des captures.
4. Valider explicitement le contrat E95 avant administration native des catégories.
5. Finaliser R04B-01 à R04B-15 et réaliser la revue métier humaine ; **ne pas fusionner en l'état**.

**Document de traçabilité : il ne vaut pas rapport de recette exécutée.**

## 6. Incrément E94 — inventaire réel des catégories (suite du 14/10)

L'inventaire est désormais intégré dans **Offres & Tarifs** via le bouton **Catégories existantes**, en lecture seule. Il utilise le tableau chargé par le service déjà présent et n'introduit ni appel IPC ni effet SQL. Il indique les valeurs persistées **sans les normaliser de force** : `SEO` et ` SEO ` restent distinctes, même si elles peuvent être candidates à une réconciliation. Des alertes explicites signalent les collisions par normalisation et celles dues aux alias d'affichage.

- `src/renderer/commercial/catalogCategoryInventory.ts` : comptage par valeur brute et statut, recensement des collisions et des éléments sans catégorie, projection pure.
- `src/renderer/commercial/CatalogCategoryInventory.tsx` : panneau consultable, tableau, statut, avertissements, bouton « Voir les prestations » qui réutilise le filtrage existant.
- `CatalogPage.tsx` : bascule de panneau sans démonter la fiche ou effacer les saisies en cours ; filtre de catégorie par **valeur brute**, libellé affiché avec le code d'origine pour lever l'ambiguïté.
- `catalogSections.ts`, `catalogAdminFilters.ts` : ne fusionnent plus implicitement les libellés bruts qui ne diffèrent que par des espaces.
- `CatalogCategoryInventory.test.tsx` : couverture du compteur actif/archivé, alias, valeurs brutes et rendu informatif sans faux bouton de modification.

**Ne pas confondre ceci avec E95 terminé :** créer/renommer/archiver/restaurer des catégories demeure absent, conformément à la nécessité d'un schéma contrôlé et d'un arbitrage métier avant migration.

### Observations CI, distinctions impératives

- CI #797/#799/#800/#802 : échecs documentés de la **vieille fixture Electron Catalogue** après ouverture de fiche. Typecheck/Vitest passaient ; la fixture a été complétée avec les mocks CGV et UX-01 nécessaires, sans neutralisation des vérifications.
- CI #808 : un test de tri des variantes `Contenu/contenu` attendait un ordre inexact ; assertion corrigée.
- CI #809 : timeout ponctuel (5 s) dans `src/main/projects/OperationalRecipeService.test.ts`, **sans modification de ce module par la branche 04B**. À confirmer par rejeu sur SHA identique ; ne pas masquer en relevant globalement les timeouts.
- Recette native et contrôle 3 thèmes × 3 densités **restent non acquises** tant que les logs du HEAD final ne montrent pas explicitement leur succès.

**Aucun merge vers `main` sans bilan de recette sur SHA exact et validation humaine.**

## 7. Recette CSS native, 3 thèmes × 3 densités (incrément suivant, 14/10)

`scripts/check-catalog-identity-ui.cjs` charge à présent **la chaîne de CSS du vrai renderer** depuis `src/renderer/main.tsx`, dans une coquille Electron à deux colonnes ; les services Catalogue/catégories restent simulés, sans aucune connexion à la base réelle. Après la recette fonctionnelle, le script passe par **AtoumWeb, Noir et Blanc** × **Compact, Confort et Confort+** (neuf combinaisons) pour contrôler :

- panneau d'administration réellement rendu et commandes disponibles ;
- taille de police du thème/densité appliqué (14/16/18 px) et labels d'au moins 14 px ;
- absence de débordement horizontal sur la page et la zone de contenu, le défilement du tableau restant contenu ;
- contrôle positif du rendu et de la stabilité de la page après chaque changement ;
- maintien des actions Catalogue/E95 et de la protection UX-01 dans la même recette.

Pour produire **9 captures PNG vérifiées sur Windows** dans un répertoire **nouveau et absolu** en dehors de Validation-MSI :

```powershell
node scripts/check-catalog-identity-ui.cjs --captures "$env:TEMP\atoumweb-lot04b-captures-20261014"
```

Le script refuse l'écrasement d'une destination existante et exige que chaque capture corresponde à une frame réellement peinte grâce à une sentinelle de composition en bord de fenêtre. Il garde sa base/profil Electron exclusivement dans le TEMP, détruit la fixture et ne touche pas à l'application utilisateur.

**Attention :** la CI peut attester des neuf vérifications CSS ; elle n'atteste **pas** à elle seule de la revue humaine des PNG. Le workflow d'autres lots signale que le stockage GitHub des artefacts PNG est saturé : ne pas présumer qu'un upload est possible. Pour la conformité R04B-14/R04B-15, il faudra produire et examiner les captures localement, consigner les observations, puis effectuer une revue humaine sur l'application Manager complète.

### Corrections UX-01 additionnelles

- Le panneau explique désormais correctement la distinction entre **inventaire consultable** et **administration des catégories avec confirmations**.
- L'action « Voir les prestations » déclenche la **garde UX-01 avant la fermeture du panneau**, afin de ne pas perdre un brouillon de catégorie ou de renommage.

Les 15 scénarios R04B restent ouverts tant que leurs preuves intermodules ne sont pas consolidées et que le SHA final de la PR n'a pas une CI verte.


## 8. R04B-07 / E96 — champs de recherche versionnés et trois contextes

**Décision technique : utiliser le `commercial_parameters_json` déjà versionné sur `catalog_versions`, sans migration 68 ni modification d'un contrat.** Deux propriétés descriptives sont ajoutées au type `CatalogCommercialParameters` : `benefits` (bénéfices client) et `keywords` (mots-clés/synonymes saisis par un humain). Le champ `clientNeed` existait déjà, mais n'était pas disponible dans l'éditeur Catalogue.

- **Administration Catalogue :** `CatalogPage.tsx` permet d'éditer besoin, bénéfices et mots-clés dans le formulaire d'une nouvelle version. `buildVersion()` conserve également les autres valeurs `commercialParameters` des versions précédentes pour ne pas les effacer lors d'une réédition.
- **Recherche partagée :** `src/shared/catalogDiscovery.ts` normalise accents/casse/espaces puis cherche exclusivement dans les champs réellement persistés. Ce n'est **pas** un moteur sémantique, une suggestion automatique ni une garantie de résultat SEO.
- **Service Catalogue :** `CatalogService.list({search})` applique le même filtrage français aux résumés de la version effectivement sélectionnée, y compris besoin/bénéfices/mots-clés. Les autres filtres SQL et la catégorie brute restent conservés.
- **Prospect / Besoins :** les deux sélecteurs `ProspectNeedsPanel` et `NeedDraftSelector` recherchent au-delà d'une catégorie, mais seulement les items actifs avec version publiée ; le clic reste une action explicite **d'ajout d'un besoin**. Aucune création de Devis/Projet.
- **Devis :** `QuotesPage` utilise le même moteur pour sélectionner une version active et publiée. Il ne crée aucune ligne sans clic utilisateur sur « Ajouter une ligne » ; aucun texte interne `internalAdvice` n'est utilisé comme mot-clé commercial public.
- **Compatibilité :** codes canoniques et Abby restent recherchables. Les items archivés et les versions brouillon demeurent consultables en **administration**, pas sélectionnables en Prospect/Devis.
- **Tests ajoutés :** `src/shared/catalogDiscovery.test.ts`, `src/main/commercial/CatalogDiscoveryE96.test.ts` et assertions supplémentaires `scripts/check-catalog-identity-ui.cjs`. Les tests couvrent les accents, les champs versionnés, l'exclusion des brouillons, les archives, les conseils internes, la non-mutation de données, le stockage SQL et le maintien de la version publiée quand un nouveau brouillon est préparé.

**Frontières restant ouvertes :** E96 n'implémente pas d'index de synonymes automatiques ; les recommandations offre-service versionnées, leur déduplication et leur motif humain appartiennent à **04D**, les aides `?` commerciales détaillées à **04E**. Le parcours complet Prospect → Devis → Projet reste un contrôle transversal indépendant, sans pouvoir être présumé sur la seule validation de la recherche.

**Décision de recette de cette intervention :** la validation visuelle humaine n'est **pas exécutée**, conformément à la demande expresse de poursuivre **sans recette visuelle**. Les tests métier, CI, SQLite et Electron fonctionnels restent attendus sur le SHA final ; la non-réalisation de la recette visuelle est conservée comme réserve, et non transformée en succès.


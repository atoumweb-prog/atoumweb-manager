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

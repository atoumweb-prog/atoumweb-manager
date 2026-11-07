# Offres & Tarifs V2 — cadrage technique du lot 2

État : étude du 07/11/2026, **aucun développement du lot 2 commencé**. Lot 1 validé graphiquement par Carlos, finitions de clôture vérifiées séparément. Ce document propose une architecture ; il n'autorise aucune migration ni publication Git.

## Références effectivement réutilisées

- Les 18 visuels du dossier utilisateur `Demarrage-Offres-Tarifs-V2/01_MAQUETTES_PRINCIPALES` : ensemble réexaminé sur planche de référence ; 04 Création, 05 Identité et 16 Mes brouillons réouverts individuellement. 01/02 fondent la charte acceptée du lot 1 ; 06–13 fournissent les déclinaisons de fiche ; 03, 14–15 et 17–18 délimitent les autres lots. Les images sont des directions de présentation, leurs données ne sont pas des règles métier.
- [Arbitrages intégraux OT-01 à OT-39](ARBITRAGES-VALIDES-OT01-OT39.md) et [registre de réalisation](SUIVI-OT01-OT39.md), notamment OT-01/03/12/28/31–35.
- Rapport initial relu : `C:/Users/AtoumWeb/.codex/visualizations/2026/11/06/01a1aec9-744d-71e0-8a78-91ca4ee7a96f/Demarrage-Offres-Tarifs-V2/04_DOCUMENTATION/RAPPORT_ECARTS_MAQUETTES_VS_CODE_CODEX.md`. Ses écarts restent pertinents : huit onglets, sauvegardes distinctes, états séparés, code distinct d'Abby, champs absents des maquettes à conserver. Les arbitrages ultérieurs remplacent ses questions désormais résolues.
- Comparaison initiale Clients/Contrats relue dans `Offres-Tarifs-Etude-2026-11-06/Dossier-Offres-Tarifs/COMPARAISON-BRANCHES.md`, sous la même racine de visualisations : aucun delta Catalogue à reprendre à ces références (Clients `2fda546…`, Contrats `8a24ae3…`). Résultat historique, sans prétendre à une nouvelle comparaison de travaux ultérieurs. Aucun autre worktree touché.
- Sources locales : `CatalogPage.tsx` (création, édition, gardes), `catalogEditorTabs.ts`, `CatalogService.ts`, types `commercial.ts`, migrations Catalogue initiale et identité, tests existants `CatalogDraftEditing04C.test.ts`. Référence Clients : `ClientQuickSummary.tsx`, cadre rapide/agrandi et styles `ClientsPageV2.css`. Composants partagés : `OperationIcon`, `AppButton`, `ConfiguredDataTable`, `useUnsavedDraft`/`requestUnsavedExit`. Ils sont réutilisables, sans transfert de logique métier Client.

## Périmètre et présentation dès le premier incrément

Conserver les huit onglets, leurs identifiants et leurs contextes : **Identité ; Tarifs & Abby ; Contenu & périmètre ; Associations ; Aide à la vente ; Contrat & CGV ; Production ; Historique**. La création guidée est un mode de cette fiche, pas une fiche concurrente à six onglets. Un parcours d'étapes peut guider l'utilisateur sans masquer ces rubriques ni enregistrer implicitement.

Reprendre dès le début les surfaces bleu nuit, cartes bordées, relief discret, icônes partagées, jaune d'action/sélection, typographie et états de focus du lot 1 validé. En-tête de fiche avec identité stable et version sélectionnée ; synthèse contextuelle inspirée de Clients V2 ; contenu lisible et barre d'actions de sauvegarde persistante. CSS local aux fiches Catalogue, variables compatibles avec les trois thèmes. Première recette visuelle sur création minimale et Identité, avant d'étendre les autres onglets.

Les différences voulues avec 04/05/16 sont explicites : code et catégorie facultatifs au premier enregistrement ; pas de faux slug public, KPI, référence Abby synchronisée, publication WordPress ou checklist juridique certifiée. Les illustrations n'imposent aucune limite artificielle de 160/500 caractères aux données existantes. « Mes brouillons » désigne les brouillons du Catalogue local ; aucun propriétaire ou compte utilisateur n'est inventé.

## Écarts techniques à traiter

| Sujet | Existant vérifié | Adaptation proposée pour le lot 2 |
|---|---|---|
| Création minimale | `CatalogService.create` crée atomiquement article et v1 ; nom/type, ID UUID et code facultatif existent. `validateVersion` exige un mode tarifaire reconnu. | Commande explicite de création minimale, nom/type seuls, article non visible et v1 brouillon sans tarif défini. Un ID/version durable dès la première sauvegarde ; pas d'article supplémentaire lors de la reprise. |
| Formulaire | `CatalogFields` est actuellement interne à `CatalogPage` ; modèle React partagé et `buildVersion`. | Extraire progressivement présentation et état d'édition réutilisables, sans réécrire les moteurs métier. Garder toutes les valeurs non affichées lors d'une sauvegarde. |
| Sauvegarde | `saveDraftVersion` transactionnelle avec comparaison du snapshot attendu ; `createVersion` accepte un identifiant de requête pour rejouer une création de version. | Enregistrer manuellement dans la même version brouillon. Ajouter l'idempotence pour création initiale/duplication, au lieu d'étendre abusivement la garantie actuelle de création de version. Bouton occupé pendant l'appel ; erreur = saisie conservée. |
| Reprise | Détail et versions persistants, mais aucun vrai parcours « Mes brouillons incomplets ». | Liste issue des versions brouillon réelles, recherche/tri et reprise exacte `(itemId, versionId)`. Une version publiée reste la référence commerciale ; ouvrir explicitement le brouillon choisi. Suggestions de noms proches consultatives, jamais fusion/dédoublonnage automatique. |
| Versions | Référence publiée prioritaire, reprise d'un brouillon et comparaison dans Historique ; liens locaux spécifiques. | Sélecteur principal de consultation ; afficher le contexte propre aux compositions/contrats/production. Changer de version n'enregistre ni ne publie ; garde préalable si une section est modifiée. |
| Duplication | Pas de commande de duplication d'article dans `CatalogService`. | Nouvelle commande transactionnelle à partir d'une version explicitement choisie : nouvel article/ID, v1 brouillon, visibilité désactivée, code canonique non copié. Tarifs conservés comme valeurs de la source choisie, sans recalcul ; références versionnées proposées à contrôler. |
| Conflits | CAS sur les champs éditables de la version dans `saveDraftVersion`, conflit si état modifié ; pas d'interface de résolution complète. | Conserver base chargée, saisie locale et état distant. Comparaison par champ ; choix manuel puis nouvelle sauvegarde avec le dernier état attendu. Si le distant change encore, nouveau conflit. Pas d'écrasement forcé ni fusion de prix/clauses/associations. |

## Brouillons incomplets et migrations candidates — non exécutées

**Blocage concret :** `phase2Migrations.ts` impose `catalog_versions.price_mode NOT NULL` et une liste de modes ; `CatalogVersionInput.priceMode` est obligatoire. On ne doit pas stocker `quote_only`, `free`, zéro euro ou un faux prix pour signifier « non renseigné ». Nom/type seuls ne correspondent donc pas au contrat actuel de première version.

**Option recommandée à spécifier avant codage :** autoriser un mode tarifaire absent uniquement pour une version brouillon, avec un montant absent. La validation de publication exige un mode réel et conserve toutes les règles actuelles. L'UI affiche « Tarif à compléter », jamais « Sur devis » par défaut. Étendre les types et adaptateurs de lecture concernés ; protéger Devis, compositions, imports et fonctions de calcul contre l'utilisation d'une version incomplète. Complétude calculée depuis les sources, sans second catalogue ni copie de fiche JSON.

Cette option nécessite vraisemblablement une migration du CHECK/NOT NULL de `catalog_versions` (reconstruction SQLite contrôlée) et l'adaptation des triggers dépendants, notamment coût tiers réel. Conserver IDs, clés étrangères, unicité du numéro et de la publiée, index, triggers et snapshots historiques. Pas de réécriture des prix/clauses des versions existantes. Tests sur bases temporaires issues du registre, contrôle FK et rejouabilité ; sauvegarde préalable seulement lors d'une future application autorisée à une base existante.

Autres besoins de persistance à décider dans la spécification de migration :

- Date de dernière sauvegarde **de version** pour Mes brouillons : `created_at` n'est pas une date de modification. Une colonne dédiée peut être nécessaire ; ne pas fabriquer de dates historiques lors du backfill. Un compteur de révision est une option si la concurrence entre plusieurs sous-domaines le justifie ; le CAS par snapshot existant ne doit pas être supprimé.
- Rejeu de création initiale et duplication après réponse IPC perdue : reçu de commande/idempotence durable, si aucune infrastructure existante adaptée n'est réutilisable. Unicité et transaction communes, pas un simple drapeau React.
- Abandon d'un brouillon déjà enregistré : conserver l'historique et distinguer abandon de saisie non enregistrée, archivage d'article et retrait d'une version. Préférer un marqueur réversible dédié à une suppression physique. Définir son incidence sur Mes brouillons et les compteurs OT-04 avant de choisir une colonne/état ; ne pas transformer silencieusement une version publiée en retirée ni archiver tout un article pour abandonner une seule nouvelle version.

Aucune migration n'est nécessaire pour le seul habillage graphique. Le numéro exact de toute future migration sera choisi depuis le registre au moment de l'implémentation, sans réserver un numéro aujourd'hui. Aucune migration n'est créée ou exécutée par cette étude.

## Sauvegardes, duplication et protections

Au départ : saisie locale → sauvegarde explicite nom/type → article + v1 brouillon persistés → compléments dans cette même version. Retour/fermeture : **enregistrer / poursuivre la saisie / abandonner**, sans publication ni autosauvegarde. Reprendre après fermeture recharge l'identité persistée. Ne jamais déclarer « enregistré » avant réponse positive ; garder les champs après erreur IPC, validation ou conflit.

Les associations, recommandations, contrats et blueprints conservent leurs services, versions de référence et commandes de sauvegarde propres. La barre persistante indique la section réellement sauvegardée ; elle ne promet pas une transaction globale de tous les onglets. Les changements de version/dossier vérifient toutes les gardes concernées. Contrat & CGV et Production reçoivent l'habillage du lot 2 ; leurs nouveaux assistants métier restent au lot 3.

Duplication : choisir la version source, proposer un nom modifiable, montrer ce qui sera repris ; confirmer les références sensibles. Copier des références aux bibliothèques, jamais dupliquer les clauses ou remplacer leurs sources maîtres. Pas de copie des utilisations, historiques de publication, dates/auteurs, identités Abby présumées, devis/projets ou code canonique. Création atomique et journalisée ; source inchangée. La copie des compositions/recommandations/liens contractuels/blueprints doit être spécifiée par sous-domaine et testée, sans annoncer une copie complète si un domaine n'est pas pris en charge.

L'ID technique est attribué immédiatement ; attribution du code commercial plus tard via `assignCanonicalCode`, unicité incluant les archives et trigger d'immutabilité conservés. Les modifications d'identité commune doivent avoir leur propre contrôle de concurrence ; ne pas les dissimuler dans une sauvegarde de version.

## Découpage proposé et critères d'acceptation

1. **Socle visuel fiche/création** : composants locaux, huit onglets, sélecteur principal et contextes ; revue Noir/Confort dès Identité/création. Aucun faux champ ni nouveau contenu commercial.
2. **Persistance minimale** : spécification puis autorisation du schéma ; commande minimale et sauvegarde/reprise exacte, idempotence et gardes. Fermer/réouvrir doit retrouver la même version sans doublon.
3. **Mes brouillons** : liste réelle, dates fiables, recherche, suggestions non bloquantes, reprise et abandon confirmé selon le cycle de vie retenu.
4. **Duplication et conflits** : transaction indépendante, provenance/reçus de commande, comparaison manuelle et conservation de saisie ; validation concurrente de chaque sous-domaine.

Tests futurs ciblés : nom/type seuls sans faux tarif ; deux enregistrements = même ID/version ; redémarrage/reprise ; réponse perdue puis rejeu ; code facultatif puis immutable ; brouillon publié entre lecture et sauvegarde ; modifications concurrentes ; annulation/refus de navigation ; copie sans mutation de source ; prix périodiques conservés ; zéro propagation vers anciens Devis/Projets. Reprendre les tests métier existants de Catalogue/identité/édition et les étendre seulement aux nouveaux contrats. Recette visuelle limitée aux écrans modifiés, trois thèmes vérifiés pour fonctionnement, Noir/Confort prioritaire.

## Frontière des décisions

Lot 2 cible OT-01, OT-03, OT-12, OT-31 à OT-35 ; OT-28 s'applique transversalement. OT-05/08–11/14–18/21/26 restent dans leurs lots pour leurs extensions métier. OT-07/13/19/24/25/29/38/39 et OT-22/23/27/36/37 ne sont pas réalisés ici. OT-06/20/29/30 gardent leur livraison **partielle lot 1**. La validation du lot 1 ne valide ni ces futurs développements ni l'ensemble des 39 décisions.

Prochaine action proposée : examiner ce cadrage, puis autoriser explicitement le développement du lot 2 et le traitement des migrations nécessaires. Le chantier reste sur le worktree/branche Offres & Tarifs existant ; aucune création de branche/worktree, aucun commit/push/PR/fusion n'est réalisé.

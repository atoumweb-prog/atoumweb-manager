# 01 — État des lieux et méthode

Code de référence : **main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda**. Voir [l’index](README.md) pour la portée et les statuts de preuve.

## Synthèse

Le Manager contient des parcours commerciaux, contractuels, Projet, temps et opérations réellement raccordés. Sa documentation et ses conventions UX ne forment pas encore un référentiel homogène. **695 tests verts ne prouvent pas que chaque interaction utilisateur est correcte.** Des écarts ont été retrouvés dans les interfaces et trois comportements ont été reproduits sur SQLite en mémoire.

La recette globale manuelle reste en cours. L’environnement observé est de développement/test, pas une livraison productive ou une validation juridique globale.

## Chiffres du recensement statique

| Objet | Nombre | Signification |
|---|---:|---|
| Entrées de navigation principale | 17 | NAV_ITEMS dans App |
| Fichiers React TSX | 84 | Renderer, y compris wrappers et diagnostic |
| Fichiers TSX raccordés par les imports | 82 | Graphe depuis main.tsx ; inclut le diagnostic conditionnel |
| Déclarations JSX de contrôles/handlers repérées | 1 921 | Comptage source, pas nombre de commandes métier |
| Déclarations de boutons natifs | 753 | Les boucles ne sont pas développées en éléments visibles |
| Champs input/select/textarea | 709 | 362 input, 245 select, 102 textarea |
| Details / summary | 92 /92 | Ne garantit pas leur indépendance ou leur ergonomie |
| Handlers JSX onKeyDown | 20 | N’inclut pas tous les listeners de fenêtre |
| Fichiers CSS du renderer | 52 | Plusieurs couches et règles par module |
| Appels directs window.atoumweb repérés | 608 | Les alias locaux et callbacks indirects sont exclus |
| Chemins API directs distincts | 314 | Ne mesure ni les transitions ni la couverture |
| Fichiers de tests normaux | 79 | 68 dans main, 11 dans shared |
| Bancs UI check*.cjs | 15 | Scripts séparés de la suite normale |

### Méthode de comptage

Lecture du filesystem source et analyse de l’AST TypeScript. Une déclaration est retenue si son tag est button/input/select/textarea/a/form/details/summary ou s’il porte un handler JSX onX. Les labels focalisables, comportements natifs implicites et contrôles indirects ne sont pas tous comptés. Le graphe suit les imports/exports relatifs TypeScript/TSX depuis le point d’entrée ; il ne démontre pas que toutes les branches conditionnelles sont affichées.

Sources : [App / NAV_ITEMS](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/App.tsx), [point d’entrée renderer](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/renderer/main.tsx), [API et préférences partagées](https://github.com/atoumweb-prog/atoumweb-manager/blob/eb252d5cbd0e95137eafa2b4759fcbcfd7263eda/src/shared/contracts.ts).

## Travail effectué

1. Branche/HEAD/working tree vérifiés.
2. Structure des modules, composants et appels directs inventoriée.
3. Principaux handlers, IPC et services examinés.
4. Documentation historique confrontée aux évolutions Projet V2, contrats et opérations.
5. Typecheck et suite normale rejoués, cache désactivé pour les tests.
6. Expériences SQLite en mémoire : maintenance manuelle, catalogue brouillon, terminaison sur pack et appels répétés de création d’enregistrement de sauvegarde.
7. Validation-MSI ouverte en lecture seule pour des propriétés de schéma/intégrité et des états de référence ; aucun oracle de tests n’en a été extrait.

## Principales conclusions

- Protection forte des snapshots acceptés, versions vendues, achats optionnels et synchronisation du même Projet.
- Divergence de période entre souscription issue du devis et création manuelle.
- Refus de terminaison d’intervention pouvant laisser une transition intermédiaire.
- Sélecteur de besoin plus permissif que la création de devis quant aux brouillons Catalogue.
- Protection des saisies, navigation, messages et confirmations hétérogènes.
- Facturation, réglages finaux et exports plus limités que certaines spécifications anciennes.
- Deux bancs UI conservent une attente de migrations 1–65 incompatible avec le registre actuel 1–66.

## Limites de cette passe

L’inventaire structurel couvre les modules du dépôt. **La matrice de chaque contrôle, de chaque état et de chaque taille de fenêtre n’est pas terminée.** Les interactions critiques ont été examinées plus profondément que les commandes secondaires. Aucun taux de couverture UX global n’est calculé.

La sonde UI adaptée pour l’audit a expiré et n’apporte aucune preuve visuelle. Un nettoyage de son répertoire temporaire a été refusé par le contrôle automatique ; c’est une limite d’outillage, pas une anomalie du Manager. Aucun chemin de profil ou d’utilisateur personnel n’est publié ici.

Les vérifications WordPress réel, Workbench externe, installation MSI, focus interfenêtres et tous les thèmes/densités/résolutions restent hors preuve complète de cette passe.

## Garantie de périmètre

Pas de correction du code, CSS, IPC, services ou migrations pendant l’audit ; pas de migration, activation, publication de référentiel ou écriture de dossier dans Validation-MSI. La présente opération publie seulement les résultats documentaires.

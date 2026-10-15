# Généralisation de la direction graphique approuvée — 15/10/2026

Suite du [pilote et audit](VISUAL-REPRISE-2026-10-15.md), sans réécriture des lots métier. L’approbation utilisateur porte sur la direction graphique et le symbole ; elle autorise ensuite les autres onglets, le pipeline, les icônes et les comportements du référentiel. Les résultats antérieurs restent dans leur rapport, pas réattribués au présent candidat.

## Périmètre réel

- Treize schémas explicites : Prospection, Clients, deux vues Annuaire, Catalogue administration, Devis, Projets, Demandes, Interventions, Temps, Facturation, Dépenses et Documents.
- Réutilisation stricte de DataTable, TableColumnManager, SavedViewPicker et du magasin de préférences workspace. Schémas propres par liste ; colonnes d’identité et accès/actions obligatoires, ainsi que Décision du Devis. Aucun ID métier, filtre de recherche, onglet ou brouillon sérialisé. Ordre de service conservé tant qu’aucun tri volontaire n’est choisi.
- Contenu des cellules et callbacks métier conservés ; les tris ne font aucune mutation. Listes compactes et fiches rapides/agrandies restent celles des lots existants. Les Temps n’acquièrent aucune action au clic ligne : seule la correction explicite d’une session terminée reste disponible.
- Clients : huit onglets iconifiés sans changer leurs identifiants, leurs gardes ou leurs panneaux montés. Annuaire : identités communes et écritures atomiques conservées. Catalogue : huit onglets iconifiés ; versions/prix/publication inchangés. Devis : décisions commerciales conservées, colonne correspondante non masquable, gardes Abby et sections contractuelles existantes.
- Pipeline : six colonnes actives plus Conversion historique, pictogrammes communs, numéros/compteurs maintenus. Ouverture par Entrée/Espace via le même handler gardé que le clic. Le glisser-déposer, E72/E73 et les conditions de conversion ne sont pas changés.
- Titres des modules : icône issue de la même source que le rail, aide existante FieldHelp au lieu du paragraphe répétitif. Réglages : recherche pleine largeur, panneaux alignés en haut pour supprimer la grande zone vide. Notifications, aides, rail et fenêtres spécialisées : fermeture/retrait via OperationIcon, mêmes callbacks, noms accessibles conservés ou ajoutés.
- Symbole approuvé raccordé à la fenêtre principale, aux Références, à la recette et au packaging EXE/Squirrel. Aucun identifiant d’installation, nom d’exécutable, raccourci ou profil existant remplacé. Les wordmarks restent des approximations typographiques documentées.

## Nouvelles vérifications permanentes

- Chaque schéma réel : accès standard/personnel explicitement autorisé, refus des clés voisines arbitraires, persistance/normalisation des seuls champs de présentation, colonnes obligatoires, isolation workspace, tables métier intactes.
- Client : tri et colonnes pendant un brouillon Contact, même instance du champ et texte exact.
- Pipeline : neuf configurations, sept icônes, ouverture de la bonne identité par clavier et même bascule d’expansion ; snapshot de toutes les tables métier inchangé.
- Banc `check-visual-generalization.cjs` : vrais App/preload/IPC, parcours03A–E existant puis treize listes sur neuf configurations. Identités avant/après tri, colonnes obligatoires, chrono identique, zoom/fenêtre étroite et absence de mutation métier. Captures optionnelles synchronisées via le banc existant, exigent un candidat commité.

## Exécution et limites

Départ `b1c3964b`, branche `codex/ux-v2-visual-generalization`. Résultats finaux à relever au commit de code avant clôture. Recettes exclusivement TEMP, aucune ouverture de Validation-MSI ni donnée réelle. Pas de migration, changement contractuel, service ou IPC métier. Pas de publication GitHub/CI/fusion dans ce jalon.

L’harmonisation des commandes et listes ne prétend pas refaire tous les sous-éditeurs spécialisés07/09 ni certifier une installation Windows. Les mises en page spécialisées sont préservées et leur recette visuelle humaine demeure distincte de la vérification technique.

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

## Correctifs révélés par la recette

- `selected-row` historique conservé en complément de `data-selected`, pour les styles et les consommateurs natifs existants (la recette Contrats05D l’a détecté).
- Le banc transversal repart d’un renderer neuf après le parcours CRM complet, sur la même base TEMP. Le contexte précédent conservait une cible Devis et rouvrait sa fiche, déclenchant la synchronisation contractuelle existante. Ni ce service ni ses règles n’ont été modifiés ; le snapshot complet sans mutation reste exigé pour le parcours de présentation isolé.
- Redimensionnement/zoom du banc synchronisé sur deux frames du renderer ; pas d’allongement du timeout ni de suppression d’assertion.
- Actualiser et Réduire utilisent les SVG communs, libellés textuels inchangés ; pictogramme crayon `edit` ajouté dans la même famille (49 icônes) pour éviter de représenter Modifier par une feuille de document. Sélecteurs de recettes actualisés vers le texte Actualiser, assertions conservées.
- Le premier smoke de package a signalé des erreurs console sans en conserver le détail. Une exécution diagnostique du même binaire a ensuite passé331 contrôles/162 visites ; cette répétition n’explique pas rétroactivement la première erreur. Le banc conserve désormais le détail de toute erreur et un `failure.json` sur sa base TEMP pour éviter une perte de diagnostic. La dernière exécution officielle reste à relever ci-dessous.

Les35 gates de convergence ont réellement réussi au code `0b6d598e` : Catalogue, contrats, devis, UX-01, restauration/redémarrage, CRM/recherche/Accueil, projets/composition, opérations, finances/documents/Word, réglages et ateliers de préférences/rail/en-tête. Les raffinements suivants sont de présentation (pictogrammes Actualiser/Modifier/Réduire) et de banc ; nouvelle validation ciblée et globale au SHA final requise, sans réattribuer ces35 gates à un autre arbre.

La séparation finale du banc est par **processus et fixture indépendants**, sans rechargement forcé du renderer CRM. La recette03E reste exécutée par son banc existant ; le nouveau banc initialise ses propres Clients/Prospects/Devis/Projets/Demandes/Interventions/Packs/Facturation/Dépenses/Documents/Temps synthétiques avant le snapshot. Un rechargement réutilisant l’ancien contexte a été refusé par UX-01 lors d’une exécution avec captures ; le contrôle a été interrompu, pas présenté comme réussi. Aucune garde de l’application n’a été désactivée pour résoudre cette dépendance de recette.

## Bilan vérifié de ce jalon

Branche `codex/ux-v2-visual-generalization`. Code applicatif final `43a2129b4571f75934d69198b047bfb3c899d9a3` ; `68d82c75` sépare les fixtures et `a6396f50` corrige l’attente du fichier de diagnostic Windows. Diff `43a2129b..a6396f50` sur `src`, `forge.config.ts` et `assets` vide. Aucun changement métier, service, IPC, migration ou donnée réelle. `origin/main` revérifié : `c4bb744dbe58531350a61fb16ad5f8fbe90bd59d`.

| Vérification réellement exécutée | Résultat | Référence |
|---|---|---|
| Typecheck | OK | Sources43a2129b puis a6396f50 |
| Vitest final |1487/1487,164 fichiers,109,41 s ; aucune erreur RPC | `outputs-generalization-43a212-vitest.log` |
| Restauration / équivalence binaire |35/35 et6/6 inclus dans Vitest ; migrations1–70, intégrité et FK testées | Aucun essai sur base réelle |
|35 gates natives04–10 |35 étapes toutes vertes,491,71 s | Code0b6d598e ; manifeste `outputs/convergence-final-04-10-0b6d598e-1792050559350/manifest.json` |
| Treize tableaux réels × neuf configurations |825 contrôles,117 captures synchronisées, aucune mutation des tables métier | Code applicatif43a2129b, banc68d82c75 ; `outputs-generalization-final-tables.log` |
| CRM03A–E, Client/Annuaire |205 contrôles,0 erreur console | `outputs-generalization-final-crm.log`, code applicatif43a2129b |
| Prospection/pipeline, clavier et brouillons |132 contrôles,36 captures synchronisées | Banc au HEAD68d82c75, `outputs-generalization-final-pipeline.log` |
| Client huit onglets / Annuaire en conflit |72+9 captures synchronisées | Code43a2129b, phases CRM achevées avant le rechargement du banc ensuite refusé ; ne pas présenter cette ancienne exécution combinée comme verte |
| Catalogue réel |109 contrôles, zoom/étroit sans débordement | `outputs-generalization-43a212-catalog.log` |
| UX-01 réel |192 contrôles,0 échec | `outputs-generalization-43a212-ux01.log` |
| Catalogue49 pictogrammes |42 contrôles, neuf configurations et clavier natif | `outputs-generalization-43a212-icons.log` |
| Package réel produit |Build Windows réussi, aucun déploiement/installation | Build au HEAD68d82c75 ; sources applicatives identiques à43a2129b |
| Package réel sur nouveau profil/workspace TEMP |331 contrôles,162 visites,0 erreur console, intégrité/FK/migrations exactes, pas de démarrage de chrono | `outputs-generalization-final-package-readiness.log`, banc a6396f50 |

L’ancienne propriété `buildWorktreeSha` du smoke désigne le checkout au moment de l’inspection, pas un SHA embarqué dans le binaire. Le build réel était68d82c75 ; ne pas déduire son origine de ce seul champ. Empreintes du dernier package : EXE `c41cb2aee584bc6b9c588e8cfd7f42185cd20aa6270d234355eed92f1bf42b3e`, ASAR `7e9009abd692470c1abaf73625b38a9399111017ba10ca74e626bd80db5f747f`.

Le dernier démarrage avait révélé une course de lecture du fichier Chromium `DevToolsActivePort` (`EBUSY` entre existence et lecture). Le banc attend désormais ses deux lignes complètes et lisibles, avec le même délai maximal et sans rejouer d’action applicative. Les erreurs restent enregistrées et bloquantes. Le premier échec console de l’ancien smoke reste sans diagnostic rétroactif ; aucune de ces exécutions refusées n’est comptée comme réussie.

Galerie locale : `captures/visual-generalization-review/index.html`, avec listes, fiches Client/Annuaire et pipeline.234 captures :117 listes +72 onglets Client +9 Annuaire +36 Prospection. La trace de chaque capture indique son SHA ; les images des itérations de diagnostic ne sont pas utilisées dans cette galerie.

**État : harmonisation des commandes, icônes, titres et treize listes réelle et testée.** Les éditeurs spécialisés (CGV, composition, Word, graphiques) gardent leur disposition et leurs règles ; aucun moteur parallèle. Réserves humaines/Word/Abby/Bridge et archivage Annuaire non exposé conservées. Ce jalon n’est pas une certification visuelle de chaque sous-écran, ni une installation Squirrel/MSI certifiée.

Aucun push, workflow hébergé ou merge. Aucun remplacement de l’exécutable, du profil, du lanceur ou du workspace quotidien. Les fichiers de preuve sont ignorés par Git et ne contiennent que des données synthétiques.

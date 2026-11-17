# R8 Ressources : fiche de refonte (Offres, Bibliothèque, Sites, Sauvegardes, Statistiques, et l'Annuaire à trancher)

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Aucun code écrit.
Skills : `atoumweb-design` (critique, shape), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Règle A : la disposition des écrans est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).

## D'où viennent les constats

- **Code lu** : `commercial/CatalogPage.tsx` (1 141 lignes, rendu principal lignes 645 à 760), `referentials/AtoumWebLibraryPage.tsx` (en-tête et barre d'outils, lignes 1195 à 1245), `bridge/BridgeSitesPage.tsx` (1 188 lignes), `backups/BusinessBackupsPage.tsx` (522), `statistics/StatisticsPage.tsx` (500) et `directory/DirectoryPage.tsx` (502). Briques de R7 relues : `ui/KeyFigures.tsx`, `ui/ListToolbar.tsx`, `shared/gestionEmpty.ts`, `plural` de `shared/projectTabs.ts`.
- **Captures** (Noir / Confort, après R7) : `C:\DEV\Livrables\Cadrage-parcours\captures-r7\apres\` : `007` et `008` Offres, `019` Bibliothèque, `020` Sites, `021` et `022` Sauvegardes, `023` Statistiques, `005` Annuaire. Les captures de `captures-r2\` et `captures-audit\` datent d'avant R3 à R7 : je ne m'en suis servi que pour la note de l'audit (Bibliothèque 17/40).
- **Limites** : **Sites est vide** (0 site) : son état rempli n'a jamais été vu. Sauvegardes : 0 sauvegarde déclarée, seules les cinq alertes de projets sont remplies. Bibliothèque : 3 composants de test, 0 variante, 0 archivé. Offres et Statistiques ont des données (125 articles). Les éditeurs et fiches détaillées (fiche d'une offre, version d'un composant, comparaison de copies) : non vus.

## Ce que les écrans montrent (critique)

**Cinq écrans de Ressources et Pilotage, quatre mises en page**, alors que R7 vient de fixer un modèle de liste (titre, chiffres clés, barre d'outils sur une ligne, une seule action jaune, message vide qui dit pourquoi).

| Écran | Chiffres clés | Barre d'outils | Action principale | Défaut le plus visible |
|---|---|---|---|---|
| Offres & Tarifs | 6 cartes avec icône | 4 filtres + « Filtres avancés » + « Réinitialiser » sur une rangée, puis 3 boutons de vue, puis un texte d'aide en petit | « + Service / Offre » (jaune) | onglet « Pilotage À venir » (page vide), 3 compteurs identiques (125) et 3 à zéro, deux définitions de « filtre actif » |
| Bibliothèque | 4 cartes avec icône, libellés en très petit | 5 filtres (dont une case « Archivés » minuscule), puis 5 boutons sur deux groupes | « Nouveau composant » (jaune) | un bouton « Replier le bandeau Bibliothèque » **dans la barre du haut**, propre à cette page ; boîte à défilement interne ; étiquettes d'état illisibles |
| Sites | aucun | aucune | « Importer un snapshot Bridge » (jaune) | état vide bon mais deux grands panneaux vides côte à côte ; « snapshot » est un mot technique |
| Sauvegardes | 4 cartes avec icône (0, 0, 0, 0) | 4 filtres, recherche tronquée (« Rechercher une sauvegarde ou ») et « Tous les emplac » coupé | « Déclarer une sauvegarde » (jaune) | bandeau d'explication en **tout petit texte** ; message vide « Aucune sauvegarde ne correspond aux filtres » alors qu'**aucun filtre** n'est actif ; cinq alertes identiques |
| Statistiques | 4 cartes avec icône + 4 tuiles de raccourci | barre de période : un grand panneau presque vide avec « Période » et « Actualiser » tout à droite | aucune (page de lecture) | « Nouveau sur la période » répété sur les quatre cartes, « Voir les éléments exacts » en petit, en-têtes en capitales jaunes espacées |
| Annuaire | 4 cartes avec icône | **empilée** : onglets à gauche, Actualiser, recherche, 2 filtres, puis « + Organisation » seul sur une deuxième ligne | « + Organisation » (jaune) | sous-titre « Organisation professionn… » coupé sur chaque ligne, colonnes Activité et Ville vides (« - ») |

**Ce que je constate de plus précis**
- **Offres** : sur 125 articles, « Total », « Actifs » et « Avec version publiée » valent tous 125 ; « Inactifs », « Archivés » et « Avec brouillon » valent 0 (la passation en comptait 4 sur 6 à zéro ; sur la capture j'en vois 3, et 3 autres identiques). **M3** confirmé dans le code : le bouton « Réinitialiser les filtres » s'appuie sur `hasFilters` (ligne 340 : recherche, type, statut, catégorie, famille, version, visibilité), le tableau sur un second calcul (`filtersActive`, ligne 754, qui compare tout le contexte au contexte par défaut). Deux règles pour la même idée. L'onglet « Pilotage » affiche « À venir » et ouvre une page qui dit que rien n'est calculé ; l'onglet « Administration » est le seul des trois à contenir autre chose que le catalogue. Les familles (« 18 familles ») et les offres du catalogue ne se voient qu'après avoir fait défiler.
- **Bibliothèque** : le bouton de repli est branché sur `WorkspaceHeader` (`ui/WorkspaceHeader.tsx` ligne 51) et sur l'état `libraryHeaderCollapsed` d'`App.tsx` : une commande de page rangée dans l'en-tête global. Les mots « Famille ✓ », « Base ✓ », « Réutil. ⚠ » sont en minuscules illisibles. Budget de petits textes : 58 dans `AtoumWebLibraryPage.css`, 6 dans `TechnicalContentViewer.css`.
- **Sauvegardes** : l'état vide ment par omission (même défaut que M1 et M2 de R7). Les cinq alertes disent la même chose pour cinq projets (« Aucune sauvegarde connue »). Budget 11.
- **Sites** : budget de petits textes **42** dans `BridgeSitesPage.css`, le plus élevé de ces écrans après la Bibliothèque ; je n'ai pas pu voir ces textes puisque la page est vide.
- **Statistiques** : les cartes de chiffres sont **cliquables** (elles ouvrent le détail exact : « Voir les éléments exacts »). `KeyFigures` n'a pas d'action : à ajouter pour que Statistiques l'utilise. Budget 24 + 1.
- **Annuaire** : même maladie que Dépenses avant R7 (barre empilée, compteurs, message). Il n'est dans aucun lot.
- **Rail** : à 948 px de haut, « Statistiques » est coupé en bas du rail (le rail défile, mais le dernier élément est à moitié caché). Je ne le traite pas ici ; noté en finition.

**Budget total de petits textes concerné** : environ 180 sur 648 (`BridgeSitesPage.css` 42, `AtoumWebLibraryPage.css` 58, `StatisticsPage.css` 24, `catalog-workspace-v2.css` 21, `catalog-editor-v2.css` 12, `BusinessBackupsPage.css` 11, `DirectoryPage.css` 7, `TechnicalContentViewer.css` 6, `analytics.css` 1). Je ne les traiterai que dans la partie qui change (en-tête, barre d'outils, liste), pas dans les éditeurs.

**À conserver** : le catalogue complet et ses vues (organisée, administration, brouillons), tous les filtres (aucun n'est retiré, y compris les filtres avancés), l'espace Administration, « Composer un site », les imports et retours Bridge, les copies de sites et la comparaison, la déclaration de sauvegarde et le contrôle avant / après intervention, les cinq onglets de Statistiques et le détail exact de chaque chiffre, la recherche et les onglets de l'Annuaire.

## Intention

Que les écrans de Ressources et de Pilotage **se lisent comme ceux de Gestion** : le titre, une rangée de chiffres, une barre d'outils sur une ligne avec **une seule action principale**, puis le contenu. Qu'un écran vide **dise pourquoi** il est vide et **quoi faire**. Que les écrans les plus lourds (Offres, Bibliothèque) montrent d'abord ce qu'on y cherche. R8 reste sur la **surface** : aucune règle métier, aucune donnée, aucun éditeur.

## Hors périmètre

- Le contenu des éditeurs et fiches : fiche d'une offre ou d'un service (versions, publication), version d'un composant, parcours Originale, Version de travail, Réutilisable, transfert Divi, comparaison de copies de site, formulaire de déclaration. Je ne touche à leur contenu que si un test échoue à cause d'un renommage de l'en-tête.
- Règles de publication du Catalogue, règles d'échéancier (« Offres sans règle d'échéancier » : décision à toi, hors interface), règles de sauvegarde, Bridge.
- Le **groupe du rail** de chaque page : je ne déplace aucune entrée (le regroupement est ta décision, voir point 1).
- **L'acompte par défaut** (lot dédié) et les fichiers orphelins (F10).

## Approches envisagées

- **A (recommandée) : un seul lot R8, le modèle de liste de R7 appliqué à la partie haute de chaque écran** (titre, chiffres clés, barre d'outils, message vide), plus les corrections propres à chaque écran listées ci-dessous. Six écrans touchés avec les mêmes briques ; aucune fiche détaillée.
- **B : couper en deux lots, R8a (Offres, Bibliothèque : les deux gros fichiers) puis R8b (Sites, Sauvegardes, Statistiques, Annuaire).** Chaque recette est plus courte et le risque d'une régression dans le Catalogue reste isolé, mais deux fiches, deux jeux de captures et deux commits pour des écrans qui partagent les mêmes briques.
- **C : n'appliquer que les corrections partagées** (accord des compteurs, messages vides, une définition de « filtre actif »). Très rapide, mais Offres et Bibliothèque gardent leur barre d'outils et leurs défauts les plus visibles.

Je recommande **A**, avec l'Annuaire en plus **seulement si tu le décides au point 1**. Si tu trouves le lot trop gros, **B** est le bon découpage (Offres et Bibliothèque ensemble, le reste ensuite).

## Proposition (approche A)

### 1. Le modèle commun, étendu
```
Titre de la page                                   (existant)
[ chiffres clés : 3 ou 4 cartes sans icône, 14 px minimum ]
[ 126 offres ] [Actualiser] [ recherche… ] [filtre ▾] [filtre ▾]   [ + Action principale ]
contenu : tableau ou cartes, la page défile (pas de boîte à ascenseur intérieure)
```
- `KeyFigures` reçoit **une action facultative** (`onAction` et libellé) : une carte cliquable devient un vrai bouton avec un nom accessible. Aucun changement pour les écrans de R7.
- `ListToolbar` est réutilisée telle quelle ; ses filtres sont ceux qui existent déjà.
- `shared/gestionEmpty.ts` reçoit des fonctions voisines pour Offres, Bibliothèque, Sauvegardes et Annuaire (ou un fichier `ressourcesEmpty.ts` si tu préfères ne pas mélanger Gestion et Ressources : mon choix par défaut, un fichier séparé).

### 2. Écran par écran

**Offres & Tarifs**
- Chiffres clés : je garde les **six** chiffres (aucune information retirée) mais en `KeyFigures`, sans icône, et j'**affiche l'aide « dans les résultats filtrés »** sous la valeur seulement quand un filtre est actif (déjà le cas). Le texte d'aide permanent (« Publié et brouillon peuvent concerner le même article… ») devient une aide au survol d'un petit « ? » (composant `FieldHelp` existant), plus une ligne en petit texte.
- **Une seule définition de « filtre actif »** (M3) : une fonction pure `catalogFiltersActive(filters)` qui sert le bouton « Réinitialiser les filtres », le tableau et le message vide ; elle ignore la taille de page et le tri (ce ne sont pas des filtres). Tests d'abord.
- Barre d'outils : recherche, type, catégorie, statut, « Filtres avancés » et « Réinitialiser » restent ; « + Service / Offre » reste le seul bouton jaune ; « Actualiser » rejoint la barre commune.
- **Onglet « Pilotage À venir »** : je propose de **ne plus l'afficher tant qu'il n'a aucune fonction** (la page ne calcule rien). Rien n'est retiré du code (l'espace reste défini, simplement non listé) ; il réapparaît quand il aura un contenu. Voir point 3.
- Vue : « Vue organisée », « Tableau d'administration » et « Mes brouillons » restent, mais sous forme d'un seul groupe de choix (déjà le cas) sans le second niveau d'onglets qui se recoupe : les deux niveaux d'aujourd'hui sont « Catalogue / Pilotage / Administration » et les trois vues. Après retrait de Pilotage, il reste **Catalogue / Administration** puis les trois vues : lisible.
- Message vide du tableau : « Aucune offre ou service pour ces filtres. » reste pour le cas filtré ; sans filtre : « Le catalogue est vide. Crée une offre ou un service avec « + Service / Offre ». ».

**Bibliothèque AtoumWeb**
- En-tête et barre d'outils : `KeyFigures` (Composants affichés, Prêts, À adapter, Références), `ListToolbar` avec compteur accordé (« 3 composants », « 1 composant »), recherche, catégorie, statut, métier, « Archivés » comme vrai filtre (case en 14 px). Boutons : « Nouveau composant » reste seul en jaune (et redevient secondaire quand sa zone est ouverte, comme aujourd'hui) ; « Importer un composant », « Composer un site », « Importer un retour » (et « Retours importés ») rangés dans un menu **« Plus »** comme en R4.
- Le **bouton « Replier le bandeau Bibliothèque »** quitte la barre du haut : il devient un bouton calme de la barre d'outils de la page (« Replier les filtres » / « Afficher les filtres »), branché sur le même état `libraryHeaderCollapsed`. La fonction reste, le composant global de l'en-tête perd une commande propre à une seule page. Voir point 4.
- Étiquettes d'état (« Famille ✓ », « Base ✓ », « Réutil. ⚠ ») : en 14 px et en toutes lettres (« Famille », « Base », « À réutiliser ») avec le même ton de pastille que les projets (`operationStatusTone`).
- Liste : les familles et composants restent ; le défilement intérieur de la liste disparaît (la page défile) sauf dans le volet de détail à droite.
- Message vide : « Aucun composant dans la Bibliothèque. Ajoute-en un avec « Nouveau composant » ou importe un package. » ; avec filtres : « Aucun composant pour ces filtres. » ; seulement des archivés : message qui le dit (comme les documents de R7).

**Sites**
- État vide : le titre garde « Aucun site importé ». Le mot « snapshot » est expliqué une fois : « Importe la première copie envoyée par AtoumWeb Bridge (un « snapshot » : une photographie lisible du site). ». Quand il n'y a aucun site, **un seul grand message** avec le bouton, à la place des deux panneaux vides ; quand il y en a, la mise en page actuelle (liste à gauche, pages à droite) reste.
- Je ne retouche **rien d'autre** de l'écran rempli, puisque je ne l'ai jamais vu (voir « Ce que je n'ai pas pu voir »).

**Sauvegardes**
- Chiffres clés : les quatre existants en `KeyFigures` (« Sauvegardes connues », « Copies locales présentes », « Copies locales manquantes », « Référence stable déclarée »).
- Le bandeau d'explication passe en texte normal, en casse normale, une phrase par ligne, sur trois lignes au maximum, avec le même contenu.
- **Alertes des projets** : regroupées. Un titre « 5 projets sans sauvegarde connue » ; les trois premières lignes visibles avec « Voir ce projet » ; « Afficher les 2 autres » sur place (même comportement que « À faire maintenant » de R6, `limitItems`). Aucune alerte n'est retirée.
- Barre d'outils unique (`ListToolbar`) : recherche, client, projet, type, emplacement, « Déclarer une sauvegarde » en seul bouton jaune ; champs assez larges pour ne plus couper « Rechercher une sauvegarde ou un chemin » ni « Tous les emplacements ».
- **Message vide qui dit pourquoi** : sans aucune sauvegarde : « Aucune sauvegarde déclarée. Déclare-en une avec « Déclarer une sauvegarde ». » ; avec filtre : « Aucune sauvegarde pour ces filtres. ».
- « Avant / après intervention » : même contenu, plus compact (le sélecteur et son message sur une ligne), toujours sans lancer de sauvegarde ni certifier de restauration.

**Statistiques**
- Barre de période : un seul panneau sur une ligne, à gauche : « Période », le sélecteur, les dates choisies, « Actualiser ». Plus de grand panneau à moitié vide.
- Chiffres clés : `KeyFigures` avec action (« Voir les éléments exacts » devient le bouton de la carte entière ; le texte « Nouveau sur la période » n'est répété que quand il apporte une comparaison : « 3 de plus que la période précédente » sinon rien).
- En-têtes de carte : plus de capitales jaunes espacées (« FINANCES » devient un petit libellé en casse normale), même règle que les autres écrans.
- Onglets et graphiques : inchangés (jamais vus pleins sur le thème Noir pour Commercial, Projets & temps, Clients, Analyse financière).

**Annuaire (si tu décides de l'inclure, point 1)**
- Modèle de liste de R7 : `KeyFigures`, `ListToolbar` (compteur « 10 organisations » ou « 10 contacts » selon l'onglet, recherche, deux filtres, « + Organisation » ou « + Contact » en seule action jaune), colonnes Organisation, Activité, Ville, Coordonnées, Contacts, Relation.
- Le sous-titre « Organisation professionnelle » répété sur chaque ligne est retiré (il n'apprend rien) ; le champ vide s'affiche « Non renseigné » en gris plutôt que « - ».
- Message vide : « Aucune organisation. Ajoute-en une avec « + Organisation ». » / avec filtres : « Aucune organisation pour ces filtres. ».

### 3. Budget et nettoyage
- Les petits textes de `BridgeSitesPage.css`, `AtoumWebLibraryPage.css`, `StatisticsPage.css`, `catalog-workspace-v2.css`, `BusinessBackupsPage.css` et `DirectoryPage.css` baissent **là où je retouche** (en-têtes, barre d'outils, listes) ; aucun `!important` ajouté ; règles CSS prouvées inutilisées retirées après recherche (règle F, via `css-prune.cjs`).
- F27 (unifier les composants de chiffres clés) : R8 ajoute l'action à `KeyFigures` ; je laisse les cartes de l'Accueil et des onglets de projet comme elles sont (finition F27).

## Points à trancher par toi

1. **Annuaire** : la page n'est dans aucun lot. Trois choix : **(a)** l'ajouter à R8 sur le modèle de liste (surface seulement, il reste dans le groupe Ressources), **(b)** la laisser pour le lot « Contacts » (regroupement Prospection, Clients, Annuaire décidé le 13/11/2026 « au niveau de l'interface seulement »), **(c)** la déplacer dès maintenant dans le groupe Commercial à côté de Prospection et Clients (changement du rail, ta décision). Je recommande **(a)** : elle a exactement les défauts des listes de R7 et coûte peu ; le regroupement « Contacts » reste alors à planifier à part. Ajouter l'Annuaire change le périmètre de R8 (règle I) : il me faut ton accord.
2. **Modèle commun** (chiffres clés sans icône, barre d'outils sur une ligne, une seule action jaune, les boutons secondaires de la Bibliothèque rangés dans « Plus ») : OK pour les cinq écrans ?
3. **Offres** : ne plus afficher l'onglet « Pilotage À venir » tant qu'il n'a aucune fonction (le code et l'espace restent, rien n'est supprimé). OK ? Sinon je le garde et je le grise.
4. **Bibliothèque** : le bouton « Replier le bandeau Bibliothèque » quitte la barre du haut et passe dans la barre d'outils de la page (« Replier les filtres »). OK ?
5. **Sauvegardes** : les cinq alertes de projets sont regroupées sous un titre avec trois lignes visibles et « Afficher les autres » sur place. OK ?
6. **Statistiques** : les cartes de chiffres deviennent des boutons entiers (le détail exact s'ouvre en cliquant la carte, plus le petit lien) et « Nouveau sur la période » disparaît quand il n'y a rien à comparer. OK ?
7. **Textes** : je te propose les messages vides ci-dessus ; dis-moi si tu veux changer un mot. Le mot « snapshot » est expliqué une fois à l'écran vide de Sites, puis gardé tel quel (c'est le nom du bouton et du document que Bridge produit).
8. **Découpage** : un seul lot (A, recommandé) ou deux (B : Offres et Bibliothèque d'abord, le reste ensuite) ?
9. **Jeu de cas de figure** : voir ci-dessous. OK pour le principe ?

## Jeu de cas de figure proposé (simulation d'abord, écriture avec ton accord explicite)

Écrans vides ou pauvres en base de test : **Sauvegardes** (0 déclarée), **Sites** (0 site), **Bibliothèque** (3 composants sans variante ni archive), **Offres** (aucun brouillon, aucun inactif, aucun archivé), **Annuaire** (aucun nom long, aucun champ vide en dehors de « Activité » et « Ville »). Statistiques a des données, mais pas de période vide à tester (je la verrai par la période « Aujourd'hui »).

Script `scripts/seed-ressources-cas-de-figure.cjs` avec `scripts/fixtures/ressources-cas-de-figure.json`, **sur le modèle des quatre scripts existants** (simulation sur copie jetable par défaut, `--apply` avec sauvegarde dans `Sauvegardes-lots\`, idempotent, repère `Workspace\DONNEES-FICTIVES-CAS-RESSOURCES.json`, libellés TEST) :
- **Sauvegardes** : 4 déclarations (une avec copie locale présente, une avec copie locale manquante, une référence stable, une pour un client TEST) pour voir les quatre chiffres, l'historique rempli et un état d'alerte réduit.
- **Offres** : 3 articles TEST (un avec brouillon seul, un inactif, un archivé) pour que les six compteurs ne soient pas tous 125 / 0.
- **Bibliothèque** : 2 composants TEST de plus (un « À adapter », un archivé) et 1 référence.
- **Annuaire** : 2 organisations TEST avec un nom très long et des champs vides, 1 contact sans organisation.
- **Sites** : **je ne suis pas sûr de pouvoir le faire sans fichier Bridge** (un site naît d'un import de snapshot produit par Bridge). Je regarde d'abord si le service accepte un snapshot de test ; sinon, **Sites reste vu seulement vide** et je te le dis clairement.

Je ne l'écris pas tant que tu n'as pas dit oui (point 9) ; je te montre d'abord la simulation.

**Information** : Offres, Bibliothèque, Sites, Sauvegardes et Annuaire sont dans RESSOURCES, Statistiques dans PILOTAGE, Offres & Tarifs dans COMMERCIAL. Je ne déplace aucune entrée.

## Ce que je n'ai pas pu voir

Sites rempli, l'espace Administration d'Offres et ses catégories, la fiche d'une offre, la Bibliothèque avec variantes, archivés et références, les fenêtres de composition et de retour Bridge, les onglets Commercial, Projets & temps, Clients et Analyse financière de Statistiques, les sauvegardes déclarées, le contrôle avant / après intervention rempli, l'Annuaire avec noms longs, états d'erreur, fenêtre étroite, clavier, thèmes AtoumWeb et Blanc, densités Compact et Confort +.

## Preuves prévues si tu valides

Tests d'abord (définition unique de « filtre actif » du Catalogue, messages vides de Ressources, regroupement des alertes de Sauvegardes avec `limitItems`, action facultative de `KeyFigures`, câblage par lecture du source comme R3 à R7), typecheck, suite complète, les quatre scripts natifs sans option, comparaison au dernier commit de toute recette qui échoue (règle H), recettes ciblées des cinq écrans à adapter (`check-catalog-*`, `check-library-*`, `check-bridge-*`, `check-business-backups-*`, `check-statistics-*` : je liste celles qui existent avant de coder), captures avant / après dans `captures-r8\` sur les mêmes données, budget des petits textes à la baisse, fins de ligne contrôlées par `eol-report.cjs`.

## Révisions

- **14/11/2026, décision de Carlos au point 1 : l'Annuaire est ajouté à R8** (choix a : modèle de liste sur la surface seulement, l'entrée reste dans le groupe Ressources, le regroupement « Contacts » reste à planifier à part). Le périmètre de R8 passe à six écrans. Les points 2 à 9 restent à valider.
- **14/11/2026, « ok global » de Carlos : points 2 à 9 validés avec mes recommandations** : modèle commun sur les cinq autres écrans, onglet « Pilotage » d'Offres masqué (code conservé), bouton de repli de la Bibliothèque dans la barre d'outils de la page, alertes de Sauvegardes regroupées, cartes de Statistiques cliquables, textes des messages vides tels que proposés, **un seul lot (approche A)**, jeu de cas de figure d'accord sur le principe. **L'écriture dans la préproduction reste soumise à son accord explicite après la simulation.**

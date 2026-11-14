# R7 Gestion : fiche de refonte (cinq listes sur un seul modèle)

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Aucun code écrit.
Skills : `atoumweb-design` (critique, shape), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Règle A : la disposition des écrans est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).

## D'où viennent les constats

- **Code lu** : `billing/BillingPage.tsx` (399 lignes), `expenses/ExpensesPage.tsx` (559), `documents/DocumentsPage.tsx` (465), `time/TimePage.tsx` (339), `operations/OperationsPage.tsx` (839), `shared/navigationRail.ts` et `ui/NavigationRail.tsx` (rail), `ui/tableEmpty.ts` (messages vides de R2).
- **Captures** : `C:\DEV\Livrables\Cadrage-parcours\captures-r6\apres\` (Noir / Confort, clients TEST enrichis) : `011` et `012` Interventions, `013` Temps, `014` Facturation, `015` Dépenses, `016` Documents. Les cinq écrans n'ont pas été touchés depuis R2.
- **Limites** : **Facturation, Temps et Documents sont vides sur la base de test** (0 élément, 0 session, 0 document) : leurs états remplis n'ont jamais été vus. Dépenses n'a qu'une ligne, Interventions onze demandes. Noms longs, fenêtre étroite, clavier, états d'erreur : non vus.

## Ce que les cinq écrans montrent (critique)

**Cinq écrans, cinq mises en page pour la même chose** (une liste de lignes avec des chiffres au-dessus) :

| Écran | Au-dessus de la liste | Barre d'outils | Liste |
|---|---|---|---|
| Dépenses | 4 cartes avec icône | une ligne : compteur, Actualiser, recherche, 3 filtres, « + Dépense » | tableau |
| Facturation | bandeau « Facturation sans API », 4 cartes | une ligne : compteur, Actualiser, recherche, 2 filtres, puis un repli « Filtres complémentaires » | tableau |
| Documents | 4 cartes d'accès, puis 4 cartes de chiffres | une ligne : compteur, Actualiser, recherche, 3 filtres, « + Document » | tableau, **deux** messages vides |
| Temps | onglets de période **coupés** (barre de défilement), 4 filtres empilés, panneau horloge, 3 cartes | filtres en haut, « + Temps manuel » | tableau |
| Interventions | 4 cartes, panneau « Suivi opérationnel », 4 onglets | **empilée verticalement** : compteur à gauche, Actualiser, recherche, filtre et « + Nouvelle demande » l'un sous l'autre | tableau dans une boîte à **défilement interne** (double ascenseur) |

**Compteurs au jargon de programmeur** : « 0 élément(s) », « 1 dépense(s) », « 11 demande(s) » (audit P2).

**Messages vides trompeurs** (M1 et M2 de la passation) :
- **Temps (M1)** : « Rien à afficher pour l'instant. » alors que le tableau est vide à cause de la **période** (« Aujourd'hui ») ou d'un filtre exact venu de Statistiques ; le message ne les mentionne pas.
- **Documents (M2)** : avec tous les documents archivés, le filtre par défaut « Actifs » ne montre rien et le message dit « Rien à afficher pour l'instant. » **puis** « Aucun document dans cette vue. » (deux messages, et aucun ne dit que des documents archivés existent).

**Doublons dans Documents** : « Bibliothèque contractuelle » et « Éditeur contractuel » ouvrent **la même** bibliothèque (`setLibraryOpen(true)` pour les deux) ; « Documents clients » ne fait que faire défiler la page vers la barre d'outils ; « Autres documents » est une carte pour une fonction qui n'existe pas (« aucun stockage implicite »).

**Textes sous 14 px** : budget actuel `operations.css` 45, `time.css` 14, `documents/DocumentsPage.css` 3 (visibles sur la capture 011 : « SUIVI OPÉRATIONNEL », « À SURVEILLER », « Seuil pack : 1 h ou 20 % · expiration : 14 j »).

**Rail** : le groupe GESTION replié par l'utilisateur **cache Facturation, Dépenses et Documents même quand l'un d'eux est la page ouverte** (capture 014 : la page Facturation est affichée, mais le rail ne montre que « GESTION » avec une pastille). `NavigationRail.tsx` marque le groupe actif (`data-group-active`) mais ne l'ouvre pas.

**À conserver** : « Colonnes et vues » (tableaux configurables), les filtres existants (aucun retiré), le bandeau qui rappelle qu'Abby émet les factures (règle du produit), les quatre onglets d'Interventions, le panneau d'alertes, le chrono et « + Temps manuel », la fiche détaillée de chaque ligne, les chiffres clés eux-mêmes.

## Intention

Que Facturation, Dépenses, Documents, Temps et Interventions se **lisent de la même façon** : le titre, une rangée de chiffres, une barre d'outils sur une ligne avec **une seule action principale**, puis la liste. Qu'un tableau vide **dise pourquoi** il est vide. Qu'on sache toujours dans quel groupe du rail on est. R7 reste sur la **surface** : aucune règle métier, aucune donnée.

## Hors périmètre

- Règles de facturation, d'archivage, de conservation, de temps ; le bandeau Abby reste (Abby seule à émettre les factures).
- Le contenu des fiches détaillées de chaque ligne, les formulaires de saisie (« + Dépense », « + Document », « + Temps manuel », « Nouvelle demande »).
- Le **contenu des groupes du rail** : Interventions et Temps sont dans PRODUCTION, Facturation, Dépenses et Documents dans GESTION. Je ne déplace rien (voir information ci-dessous).
- `WorkflowDashboard.tsx` et autres fichiers orphelins (F10).

## Approches envisagées

- **A (recommandée) : un modèle partagé de liste (barre d'outils et chiffres clés) appliqué aux cinq écrans, sans changer leurs fonctions.** Un composant de barre d'outils, un composant de chiffres clés, un message vide qui dit pourquoi, l'ouverture du groupe du rail. Cinq écrans retouchés avec les mêmes briques.
- **B : fusionner les cinq écrans en un seul module « Gestion » à onglets.** Moins d'entrées dans le rail, mais retire des points d'accès (contraire à « les 17 entrées existantes gardent un point d'accès ») et mélange des métiers distincts. Écartée.
- **C : corriger seulement M1, M2 et le rail.** Rapide, mais les cinq écrans restent cinq mises en page et la barre d'Interventions reste empilée.

## Proposition (approche A)

### 1. Le modèle commun
```
Titre de la page                                  (existant)
┌ chiffres clés : 3 ou 4 cartes sans icône, 14 px minimum ┐
[ 11 demandes ] [Actualiser] [ recherche…] [filtre ▾] [filtre ▾]  [ + Action principale ]
┌ Colonnes et vues ─────────────────────────────────────────┐
│ tableau (défilement de la page, pas de boîte à ascenseur) │
```
- **Barre d'outils partagée** (`ListToolbar`) : compteur au bon accord (« 1 dépense », « 11 demandes », « 0 élément »), Actualiser, recherche, filtres déjà présents, **une action principale** à droite (la seule à être jaune). Elle passe à la ligne proprement quand la place manque.
- **Chiffres clés partagés** (`KeyFigures`) : libellé, valeur en grand, aide courte ; sans icône ; mêmes cartes que celles des onglets de projet (R5b) ; 14 px minimum.
- **Message vide partagé** : s'appuie sur `tableEmptyMessage` (R2) en ajoutant le contexte propre à chaque écran (voir 3).

### 2. Écran par écran
- **Dépenses** : modèle commun tel quel (c'est l'écran le plus proche).
- **Facturation** : le bandeau « Facturation sans API » devient une note sur une ligne (même texte, en casse normale au lieu des capitales espacées) ; les « Filtres complémentaires » restent repliés dans la barre d'outils.
- **Documents** : les quatre cartes d'accès deviennent une rangée de **deux** boutons : « Bibliothèque et éditeur contractuels » (un seul bouton pour la même fenêtre) et rien d'autre ; « Documents clients » (simple défilement) disparaît puisque la liste est juste dessous ; « Autres documents » devient une ligne grisée sous la liste : « Dépôt général hors client : pas encore disponible. ». **Aucune fonction retirée** ; le jargon « aucun stockage implicite » disparaît.
- **Temps** : les onglets de période et les filtres tiennent sur la barre d'outils commune (plus de défilement dans la barre) ; le panneau horloge et le chrono restent, au-dessus.
- **Interventions** : barre d'outils horizontale commune, **un seul ascenseur** (la page défile, le tableau n'a plus de boîte intérieure) ; le panneau « Suivi opérationnel » garde son contenu, à 14 px minimum et sans capitales espacées ; les quatre onglets restent.

### 3. Messages vides qui disent pourquoi (textes à valider, question 3)
- **Temps** : « Aucune session aujourd'hui. » / « cette semaine » / « ce mois » (selon la période) ; avec un filtre actif : « Aucune session pour ces filtres sur cette période. » + « Effacer les filtres » ; avec le filtre exact de Statistiques : « Aucune des sessions de ce filtre n'est encore disponible. ». Sans session du tout : suggestion « Lance le chrono ou ajoute du temps avec « + Temps manuel ». ».
- **Documents** : tous archivés : « Tous les documents sont archivés. Choisis « Archivés » pour les retrouver. » (avec le nombre) ; aucun document : « Aucun document pour l'instant. Ajoute-en un avec « + Document ». » ; filtres actifs : message standard. **Un seul message** (le double message disparaît).
- **Facturation** : « Rien à facturer pour l'instant. » + « Les éléments apparaissent quand un acompte, un solde, une intervention, un pack ou un abonnement est à facturer. » (déduit des sept origines du code).
- **Dépenses** et **Interventions** : message standard (déjà juste) ; vide sans filtre : « Aucune dépense enregistrée. Ajoute-en une avec « + Dépense ». » / « Aucune demande. Ajoute-en une avec « + Nouvelle demande ». ».

### 4. Le rail : la page ouverte est toujours visible
- Si la page active appartient à un groupe replié, **ce groupe s'affiche ouvert** tant qu'on y est ; la préférence de repli de l'utilisateur n'est **jamais modifiée** (en quittant le groupe, il redevient replié). Règle pure testée.

### 5. Budget et nettoyage
- Les petits textes de `operations.css`, `time.css` et `DocumentsPage.css` baissent là où ils sont retouchés ; aucun `!important` ajouté ; règles CSS prouvées inutilisées retirées (règle F).

## Points à trancher par toi

1. **Modèle commun** (chiffres clés sans icône, barre d'outils sur une ligne avec une seule action jaune, un seul ascenseur) : OK ?
2. **Documents** : un seul bouton « Bibliothèque et éditeur contractuels » (les deux ouvrent la même chose), « Documents clients » retiré (simple défilement), « Autres documents » en ligne grisée : OK ?
3. **Textes des messages vides** de la section 3 (surtout Facturation, qui décrit d'où viennent les éléments) : OK ?
4. **Rail** : le groupe de la page ouverte s'affiche ouvert sans changer ta préférence de repli : OK ?
5. **Lien « Voir tout »** de l'onglet Interventions d'un projet (F20) : la page Interventions n'a **aucun filtre par projet** ; le brancher demande d'en ajouter un. Je recommande de **le laisser en finition**. OK, ou tu veux le filtre dans R7 ?
6. **Jeu de cas de figure Gestion** : Facturation, Temps et Documents sont vides en base de test. Je propose un script (simulation par défaut, écriture seulement avec ton accord) qui ajoute : des sessions de temps (dont une en cours), des éléments à facturer de plusieurs origines dont un facturé, des documents clients dont **tous archivés** pour un client. OK ?

**Information** : Interventions et Temps sont dans le groupe PRODUCTION du rail, Facturation, Dépenses et Documents dans GESTION. Je ne déplace aucune entrée (le regroupement du rail est ta décision) ; dis-moi si tu veux les réunir.

## Ce que je n'ai pas pu voir

Les trois écrans vides avec des données, les fiches détaillées, noms longs, fenêtre étroite, clavier, états d'erreur, thèmes AtoumWeb et Blanc, densités Compact et Confort +.

## Preuves prévues si tu valides

Tests d'abord (règle d'ouverture du groupe du rail, messages vides de Temps et de Documents selon période, filtres et archives, accord des compteurs, câblage par lecture du source comme R3 à R6), typecheck, suite complète, les quatre scripts natifs sans option, comparaison au dernier commit de toute recette qui échoue (règle H), captures avant / après dans `captures-r7\` sur les données de cas de figure, budget des petits textes qui doit baisser, plan `docs/refonte/plans/2026-11-14-r7-gestion.md`, mise à jour de `FINITIONS.md` avant le commit (F20 y reste ou en sort selon la question 5), un seul commit local après tes captures.

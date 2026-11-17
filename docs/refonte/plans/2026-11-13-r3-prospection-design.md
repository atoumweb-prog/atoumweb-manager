# R3 Prospection : fiche de refonte

Statut : **proposition, à valider par Carlos avant tout code** (règle J : la fiche avant le code, puis la recette sur captures avant / après). Rien n'est modifié dans le Manager tant que cette fiche n'est pas validée. Aucun commit n'est fait.
Skills : `atoumweb-design` (shape, critique), `superpowers:brainstorming`. Ensuite, après validation : `writing-plans`, `executing-plans`, `test-driven-development`.
Thème Noir, densité Confort (règle E). Niveau de décision (règle A) : la disposition de l'écran est à valider ici ; aucune donnée, règle métier ni ordre du parcours n'est touché (règle B).

## Intention

Quand tu ouvres un prospect, tu dois voir tout de suite **où il en est et quoi faire ensuite**, au lieu de trouver sept onglets, trois boutons « Enregistrer » et trois façons de programmer une action. R3 refait la fiche de travail autour de la « Prochaine étape », applique la même charte à la liste Prospection, et fait de même pour l'en-tête de Clients (qui était dans le plan).

Objectifs :
1. Une fiche qui dit l'étape et propose **une** action principale.
2. **Un seul bouton « Enregistrer »** par formulaire.
3. **Une seule façon de programmer une action** (un verbe, une fenêtre).
4. La fiche s'ouvre sur **l'onglet qui correspond à l'étape**.
5. Les sous-niveaux deviennent des sections repliables, sans rien retirer.
6. En-têtes de Prospection et de Clients passés au composant commun, sans règle `:has()` pour les masquer.

## Hors périmètre et anti-objectifs

- Aucune fonction supprimée : tout ce qui est rangé reste à un clic.
- Aucun changement de données, de règle d'étape, d'ordre Prospect → Devis → Projet, ni de règle de perte, d'archivage ou de qualification.
- Relances de devis J+7 / J+14, « Relance faite », acceptation : c'est R4 (Devis), pas ici. En R3, la « Prochaine étape » reflète la logique **actuelle** de l'application.
- L'assistant de devis et l'onglet Devis ne sont pas refaits (R4). Seul leur point d'entrée change.
- Aucun `!important` ajouté, aucune couleur en dur, aucune nouvelle règle `:has()` (leçon de R2).
- Thèmes AtoumWeb et Blanc, densités Compact et Confort + : en fin de refonte.

## Ce que la lecture du code établit

- Fiche de travail : `ProspectsPageV2.tsx:733` à `749`. L'en-tête empile identité, deux boutons d'outils, un bloc de synthèse (température, prochaine action, bouton principal, « Changer la situation », « Classer comme perdu », « Archiver »), six repères d'étape, puis sept onglets. Les composants `NextStepCard`, `MoreMenu` et `RecordHeader` (R1) existent mais ne sont branchés nulle part.
- Trois enregistrements dans Besoins : « Enregistrer et continuer » et « Enregistrer le besoin » (`ProspectNeedsPanel.tsx:547`) et « Enregistrer et faire le devis » (`:552`, en pied, visible quelle que soit la section). Ces trois boutons sont jaunes en même temps (capture 104).
- Trois façons de programmer une action : « Programmer une action » dans l'en-tête (`ProspectsPageV2.tsx:737`, qui **ouvre seulement l'onglet** Actions et n'ouvre pas la fenêtre de saisie), « + Action » dans l'onglet (`ProspectActionsPanel.tsx:298`, qui ouvre la fenêtre), et « Programmer une action » du volet rapide (`:707`, qui ouvre la fiche agrandie sur l'onglet Actions). À côté, « Prochaine action » est à la fois un libellé et un bouton selon l'endroit. Les rappels rapides « Demain / Dans 7 jours / Choisir une date » des cartes du parcours commercial sont un quatrième chemin, mais sur une autre surface (voir point 3 plus bas).
- Onglet d'ouverture (`:659`) : nouveau contact → Entreprise ; à qualifier → Préparer l'échange ; **tout le reste → Besoins**, même pour un devis déjà envoyé.
- Besoins : quatre sous-onglets (`:745`). Le panneau « Demande et besoin », « Budget et délais » et « Prestations » est **un seul formulaire** dont les sections sont masquées par `hidden` ; « Qualification » est un panneau à part avec son propre bouton.
- Liste Prospection : en-tête propre (`:515`) restylé par deux feuilles (`prospect-visual-pilot.css:51` à `54` et `prospection-directory-pilot.css:42` à `44`, dont un `font-size:30px!important`). Statuts : pastille maison `prospect-directory-status-*`.
- Clients : en-tête propre (`ClientsPage.tsx:629`) ; l'en-tête générique d'`App.tsx:430` est rendu puis caché par `client-list-quick-v2.css:5`.

## Proposition

### A. La fiche de travail

Avant (capture 101) : identité, « Identité et logo », « Associations », fermer ; température ; prochaine action ; « Poursuivre le devis » en jaune ; « Classer comme perdu » ; « Archiver » ; six repères ; sept onglets.

Après :

```
┌──────────────────────────────────────────────────────────────────────┐
│ [logo] Mairie                         [Devis à préparer]  Plus ▾   ✕ │
│        Collectivité locale · Vaux saules   Température : À évaluer ▾  │
│                                                                      │
│ PROSPECTION  1. À qualifier · 2. Besoins · 3. Préparer le devis ...  │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Prochaine étape : Poursuivre le devis                            │ │
│ │ Aucune action programmée.                                        │ │
│ │ [ Poursuivre le devis ]  [ Programmer une action ]               │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ Entreprise  Contacts  Préparer l'échange  Besoins  Actions  Devis  Historique │
└──────────────────────────────────────────────────────────────────────┘
```

- **En-tête** : `RecordHeader` (titre, sous-titre « activité · ville », pastille d'étape via `StatusPill`). Le logo reste cliquable comme aujourd'hui. La température reste un choix visible en en-tête (c'est une donnée qu'on corrige souvent).
- **Menu « Plus »** (`MoreMenu`) : « Identité et logo », « Associations », « Changer la situation », « Classer comme perdu » (danger), « Archiver » (danger). Les fenêtres de confirmation de perte et d'archivage ne changent pas. Seuls les changements de situation que le code propose aujourd'hui restent proposés (`manualStages`).
- **Carte « Prochaine étape »** (`NextStepCard`) : une action principale jaune, la prochaine action programmée en rappel (titre, date, « En retard »), et « Programmer une action » en secondaire.
- **Les sept onglets restent visibles** (décision déjà prise). Les six repères d'étape restent, en lecture.
- Plus de « Poursuivre le devis » jaune isolé dans le bloc de synthèse : c'est la carte qui le porte.

**Règles de la carte, sans nouvelle règle métier** : chaque ligne reprend le bouton qui existe déjà.

| Étape du dossier | Action principale | Existe déjà |
|---|---|---|
| Nouveau contact | Démarrer la prospection | oui |
| À qualifier | Valider la qualification et passer à Besoins (ou « Compléter la qualification » s'il manque des éléments) | oui |
| Besoin à identifier | Préparer le devis | oui |
| Devis à préparer, à envoyer, en attente de retour, négociation, en attente | Poursuivre le devis | oui |
| Gagné, perdu, client, archivé | Aucune action principale : le dossier est clos ; un lien « Ouvrir la fiche Client » si le dossier est converti | oui |

### B. Un seul « Enregistrer »

- Besoins (Demande et besoin, Budget et délais, Prestations) : **un seul bouton « Enregistrer »**, secondaire, en pied de formulaire. Il enregistre et reste sur place. Les anciens enchaînements (« et continuer », « et faire le devis ») disparaissent comme boutons ; ils restent faisables par les sous-onglets et par la carte « Prochaine étape ».
- Qualification, Entreprise, Contacts, Préparer l'échange gardent chacun leur enregistrement (un par formulaire, libellé « Enregistrer »).
- « Enregistrer » est le seul bouton jaune d'un formulaire **modifié** ; sinon il est secondaire (voir point 1 à trancher).

### C. Une seule façon de programmer une action

- Un seul verbe : **« Programmer une action »**, une seule fenêtre (la fenêtre « Planifier une action » existante, sans changer ses champs).
- Deux portes vers cette même fenêtre : la carte « Prochaine étape » et le bouton de l'onglet Actions (« + Action » devient « Programmer une action »). Les deux **ouvrent la fenêtre directement**, au lieu de seulement changer d'onglet.
- Le volet rapide ouvre la fiche agrandie puis la fenêtre.
- « Prochaine action » n'est plus jamais un bouton : c'est seulement l'étiquette de ce qui est prévu.
- La fenêtre « Compte rendu » (« Effectuée ») ne change pas.

### D. L'onglet d'ouverture

| Étape | Onglet à l'ouverture | Aujourd'hui |
|---|---|---|
| Nouveau contact | Entreprise | Entreprise |
| À qualifier | Préparer l'échange | Préparer l'échange |
| Besoin à identifier | Besoins | Besoins |
| Devis à préparer, à envoyer, en attente, négociation | **Devis** | Besoins |
| Gagné, perdu, converti en client | **Historique** | Besoins |

Un lien venant de « Programmer une action » ou de « Référence » garde sa destination actuelle.

### E. Niveaux 2 et 3 repliables

Ma lecture des « niveaux » : niveau 1 = les sept onglets ; niveau 2 = les sous-onglets de Besoins (quatre) et de Préparer l'échange (deux) ; niveau 3 = les accordéons et blocs à l'intérieur (`ProspectWorkAccordion`, « Lecture du périmètre », liste d'intentions).
- Besoins : les quatre sous-onglets deviennent **quatre sections repliables dans une seule colonne**. La section qui correspond à l'étape (Qualification tant que le dossier est « À qualifier », sinon « Demande et besoin ») est ouverte ; les autres sont repliées avec un résumé d'une ligne. L'état ouvert / fermé est mémorisé comme le fait déjà `ProspectSectionGroup`.
- Préparer l'échange : même principe pour ses deux parties.
- Le contenu et les champs ne changent pas ; seule la navigation passe de « cliquer pour changer de page » à « déplier ».

### F. Liste Prospection

- `PageHeader` (R2) à la place de l'en-tête maison : icône, titre, aide `?`, « + Prospect » à droite. Quand la création est ouverte, le bouton devient « Fermer la création » en secondaire (comportement actuel, règle du bouton principal respectée).
- Retrait des règles `:has()` et `!important` de ces deux fichiers qui n'existent que pour restyler cet en-tête.
- Pastilles de statut via `StatusPill`, avec la palette de six rôles déjà décidée (R2). La température commerciale garde sa palette à quatre couleurs, avec son libellé : la couleur ne porte jamais seule l'information.
- Les indicateurs, filtres, colonnes et « Colonnes et vues » de la liste ne changent pas.

### F bis. Les trois vues : liste, parcours commercial, historique

Lecture du code seulement (`ProspectsPageV2.tsx:515` à `519`, `588` à `606`) : je n'ai aucune capture du parcours commercial ni de l'historique, leur rendu n'a pas été vu.
- **Onglets de vue** : gardés avec leurs compteurs et leurs boutons actuels (il n'existe pas de composant d'onglets commun, révision du plan : on n'en crée pas). « Annuaire prospects » est renommé **« Liste »**, pour ne plus ressembler à la page Annuaire du rail (audit, P1 n°12).
- **Parcours commercial** : les filtres « Tous », « À relancer » et « En retard » ne sont plus des boutons jaunes quand ils sont actifs (`primary-button`, contraire à la règle d'une action principale par vue) : filtres à bascule neutres, comme les indicateurs de la liste. Le bouton « Annuaire prospects » de cette barre est retiré (doublon de l'onglet du haut). « Clients acquis · N » et « Retour au parcours commercial » deviennent des liens discrets. Colonnes, cartes, glisser-déposer et rappels rapides ne changent pas.
- **Historique** : table, filtres, détail et « Ouvrir la fiche Client » gardés ; en-têtes, casse et pastille de résultat alignés sur le socle R2.

### G. Clients (en-tête seulement)

- `PageHeader` à la place du `<header>` de `ClientsPage.tsx:629` ; la barre d'outils (recherche, statut, colonnes) reste dessous.
- `App.tsx:430` n'affiche plus l'en-tête générique pour Clients, et la règle `client-list-quick-v2.css:5` est retirée (deux causes supprimées, pas de masquage).
- Le contenu de la page Clients n'est pas refait dans R3.

### H. Scripts de recette (règle H)

- `scripts/fixtures/prospection-gallery.cjs` est obsolète (il cherche `.prospect-workspace-identity>summary`, absent) : réécrit pour la nouvelle fiche.
- Les scénarios de `check-unsaved-inputs-ui.cjs` (ligne de devis) et `check-contract-library-ui.cjs` (PDF commun) concernent R4 : **hors R3**, comme prévu à la passation.

## Approches envisagées

| | Idée | Pour | Contre |
|---|---|---|---|
| **A (retenue)** | Refaire l'en-tête de la fiche avec les composants R1, fusionner les enregistrements et les entrées d'action, ouvrir sur le bon onglet, sections repliables | Résout les problèmes P1 n°6 et 10 de l'audit sans rien retirer ; réutilise du code déjà testé | Touche `ProspectsPageV2.tsx` (762 lignes très denses) : captures avant / après indispensables |
| B | Ne changer que les boutons (un Enregistrer, une action) et laisser l'en-tête | Petit et rapide | La fiche reste sans « Prochaine étape » : on ne règle pas le constat du cadrage |
| C | Réécrire la fiche en vue unique (sans onglets) | Parcours le plus court | Contredit la décision « les sept onglets restent visibles » ; trop gros pour un lot |

## Points à trancher par toi (niveau 3 de la règle A, sauf mention)

1. **Jaune du formulaire et de la carte** : « une seule action principale jaune par vue ». Dans Besoins, la carte propose « Préparer le devis » et le formulaire propose « Enregistrer ». Je propose : **la carte reste la seule jaune** tant que rien n'est modifié ; dès qu'un champ est modifié, « Enregistrer » devient le seul jaune et la carte passe en secondaire. Autre choix : « Enregistrer » toujours secondaire. Je recommande le premier : on voit qu'il reste quelque chose à sauvegarder.
2. **Passer au devis avec des modifications non enregistrées** : aujourd'hui « Enregistrer et faire le devis » le fait en un clic. Avec un seul « Enregistrer », deux options : (a) la garde de sortie actuelle apparaît (« Rester » ou « Quitter sans enregistrer ») ; (b) le bouton de la carte enregistre puis ouvre l'onglet Devis. Je recommande (b), pour ne pas perdre ce raccourci. Je vérifie au plan que c'est faisable sans deuxième registre de brouillons.
3. **Rappels rapides des cartes du parcours commercial** (« Demain », « Dans 7 jours », « Choisir une date ») : je les garde tels quels, car c'est un raccourci de liste et non la fiche. Dis-moi si tu veux aussi les faire passer par « Programmer une action ».
4. **Menu « Plus »** : « Associations » ouvre aujourd'hui un bloc dépliant dans l'en-tête ; en menu, il ouvrirait une fenêtre. Acceptes-tu ce changement ? (À confirmer par capture : le menu peut être masqué par le `z-index: 20` des fenêtres superposées, point déjà noté à l'audit.)
5. **Libellé de l'étape qui tombe sur « Devis »** (onglet d'ouverture) : OK pour que les dossiers déjà au stade devis s'ouvrent directement sur l'onglet Devis ?

6. **Les trois vues** (section F bis) : renommer « Annuaire prospects » en « Liste », retirer le bouton doublon du parcours commercial, filtres neutres au lieu de jaunes. D'accord ?

## Ce que je n'ai pas pu voir

- Le rendu du parcours commercial et de l'historique (aucune capture prise à l'audit).

- Le rendu réel de la fiche modifiée (rien n'est codé).
- Les huit captures de la fiche prospect non relues une à une à l'audit (onglets Entreprise, Contacts, Préparer, Historique) : je les relirai avant le plan.
- Le menu « Plus » dans une fenêtre superposée (relu dans le code, jamais exécuté).
- Les états d'erreur, les textes très longs, la fenêtre étroite, le clavier.
- La faisabilité du point 2 (option b) : à lire dans `UnsavedGroup` au moment du plan.

## Preuves prévues si tu valides

- Tests d'abord : règles de la carte (une ligne par étape), onglet d'ouverture par étape, un seul bouton d'enregistrement dans Besoins, une seule entrée « Programmer une action », en-têtes passés à `PageHeader`, `buttonHierarchy.test.ts` toujours vert.
- Typecheck, suite complète, les quatre scripts natifs (budget de petits textes qui ne peut que baisser, y compris pour les fichiers de Prospection et de Clients).
- Captures avant / après dans `C:\DEV\Livrables\Cadrage-parcours\` (liste, fiche à plusieurs étapes, Besoins, fenêtre d'action, menu « Plus », Clients), que tu vois **avant** tout commit local.
- Plan détaillé rangé dans `docs/refonte/plans/2026-11-13-r3-prospection.md`, avec la ligne « révision » pour tout écart mineur.

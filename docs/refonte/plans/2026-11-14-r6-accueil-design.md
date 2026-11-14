# R6 Accueil : fiche de refonte (« À faire maintenant »)

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Aucun code écrit.
Skills : `atoumweb-design` (critique, shape), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Règle A : la disposition de l'écran est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).

## D'où viennent les constats

- **Code lu** : `home/HomeDashboard.tsx` (260 lignes, six blocs), `main/workflow/WorkflowService.ts` (`dashboard()`, qui fournit les dossiers du jour), `shared/homeWidgetPreference.ts` (disposition mémorisée), `shared/prospectNextStep.ts` (R3), `workflow/WorkflowDashboard.tsx` (ancien tableau de bord par groupes, 9 lignes, `WorkflowDashboard` n'est importé nulle part : fichier orphelin F10).
- **Captures** : `captures-r2\001-page-accueil.png` et `002-page-accueil-bas.png` (Accueil de R2, Noir / Confort, base fictive d'avant les clients TEST de R5). L'Accueil n'a pas été touché depuis (dernier commit sur `src/renderer/home` : lot 5). **Je n'ai pas encore recapturé l'Accueil avec les clients fictifs et leurs cas de figure** : ce sera l'« avant » de la recette.
- **Cible** : la maquette du cadrage, `C:\DEV\Livrables\Cadrage-parcours\maquette\captures\01-accueil-a-faire.png` (liste « À faire maintenant », un bouton principal « + Devis », indicateurs et pipeline à un clic).
- **Limites** : états d'erreur de source, noms très longs, fenêtre étroite, clavier, « À surveiller » avec des alertes réelles, Accueil personnalisé par l'utilisateur : non vus.

## Ce que l'Accueil montre aujourd'hui (critique)

**Il dit combien, pas quoi faire.** Six blocs (Aujourd'hui, À surveiller, Indicateurs, Pipeline commercial, Temps & facturation, Projets récents) occupent deux écrans de défilement ; aucun ne dit « fais ceci d'abord ».

**Le bloc « Aujourd'hui » ne dit pas de qui il parle.** Sur la capture : trois lignes identiques « TEST Préparer le prochain échange · 2026-11-05 », sans nom de prospect ni de client, avec une date déjà passée de plusieurs jours. Le titre affiché est celui de l'action seule (`WorkflowService.ts` ligne 129 : `title: action.title`), le groupe « Aujourd'hui » regroupe tout ce qui est dû avant la fin de la journée, retards compris, et la date est brute (« 2026-11-05 »).

**Un compteur qui ment** (P0 de l'audit) : « Devis à préparer : 2 » compte des **prospects** au stade « Devis à préparer » ou « Devis à envoyer » (`HomeDashboard.tsx` ligne 146), mais son clic ouvre la **liste des devis**, qui est vide. Le texte d'aide dit « Compteur issu des Prospects · Ouvrir tous les devis » : il avoue la contradiction.

**Le même fait répété trois fois.** Les relances : « Prospects à relancer 3 » (indicateurs), les trois lignes d'« Aujourd'hui », « 3 relances à traiter » (pied du pipeline). Les devis à préparer : l'indicateur et la colonne « Préparer le devis » du pipeline.

**Trois boutons jaunes** en tête (« + Prospect », « + Devis », « + Demande ») : la règle « une seule action principale par vue » n'est pas respectée (le test de hiérarchie ne regarde que les noms Fermer, Annuler, Retour…).

**Un nom pour deux choses.** Le bloc `actions` s'appelle « Projets récents » dans Personnaliser et « Actions rapides » dans sa carte (`HomeDashboard.tsx` lignes 96 et 224) ; il contient les trois projets récents et un repli « Accès rapides ».

**Textes sous 14 px** : `HomeDashboard.css` porte 32 déclarations sous 14 px (budget `fontFloorBaseline.json`).

**À conserver** : le chargement par source avec message précis quand une source échoue (« Sources indisponibles : … »), le détail des sources dans Personnaliser, le bandeau « À traiter en priorité » des alertes critiques, les « — » à la place d'un faux zéro quand une source manque, la mémorisation de la disposition (replier, masquer, déplacer), les indicateurs et le pipeline cliquables, les trois créations rapides.

## Intention

Qu'en ouvrant le Manager on voie **ce qu'il faut faire maintenant, dans l'ordre, avec le nom du dossier concerné et un bouton**, et que chaque chiffre affiché compte ce qu'il dit et ouvre ce qu'il compte. R6 reste sur la **surface** : aucune règle métier, aucune donnée nouvelle.

## Hors périmètre (règles métier, validation à part)

- Les relances de devis à J+7 / J+14 / J+30, l'acompte à préparer dans Abby, le solde, la « Prochaine étape » du projet (étapes de l'offre) : ces éléments de la maquette arriveront **dans la même liste** quand leurs règles seront validées, sans changer l'écran.
- Temps & facturation (traité par R7 Gestion), le contenu du pipeline, les alertes opérationnelles, la barre de recherche et le rail (R2).
- L'acompte par défaut (lot dédié).

## Approches envisagées

- **A (recommandée) : une liste « À faire maintenant » en tête, les autres blocs gardés mais repliés par défaut.** Aucune fonction retirée, la disposition déjà mémorisée par l'utilisateur n'est jamais écrasée, le premier écran devient la liste.
- **B : supprimer indicateurs, pipeline, temps et projets récents de l'Accueil** (la maquette les range sous « Plus »). Plus net, mais retire des accès et casse « Personnaliser » : contraire au principe « aucune fonction supprimée ».
- **C : corriger seulement le compteur et les boutons.** Rapide, mais l'Accueil continue de dire combien sans dire quoi : le gain de clics de l'audit (16 à 7) n'est pas obtenu.

## Proposition (approche A)

### 1. Bloc « À faire maintenant » (remplace « Aujourd'hui », même emplacement fixe en tête)
```
À faire maintenant                                     7 éléments
 [Action en retard]  Préparer le prochain échange · TEST Atelier des Saveurs
                     en retard de 9 jours                                 [Ouvrir]
 [À relancer]        TEST Studio Horizon · relance prévue aujourd'hui     [Ouvrir]
 [Devis à envoyer]   DEV-2026-007 · TEST Studio Horizon                   [Ouvrir]
 [Projet à créer]    DEV-2026-005 accepté, pas de projet · Boulangerie    [Ouvrir]
 ...                                    Afficher les 4 autres éléments ▾
```
- **Clé de disposition inchangée** (`today`) : les dispositions déjà enregistrées restent valides ; seul le libellé change dans Personnaliser. Le bloc reste non masquable, comme « Aujourd'hui » aujourd'hui.
- Une ligne par dossier : pastille du type de tâche (`StatusPill`), **nom du prospect, du client ou numéro du devis**, détail court (« en retard de 9 jours », « prévue aujourd'hui »), bouton « Ouvrir » vers la fiche existante (`openEntity`).
- Sept lignes visibles, « Afficher les N autres » déplie la suite **sur place** (aucune navigation nouvelle).
- **Que du déjà calculé** : les groupes de `WorkflowService.dashboard()` existent déjà. Ordre proposé (ta décision, voir question 1) : actions en retard ou du jour, prospects à relancer, devis à préparer, devis à envoyer, devis acceptés sans projet (« Projet à créer »), projets en retard, projets bloqués ou à valider, demandes nouvelles, interventions à valider. Hors liste (restent accessibles par leurs blocs) : projets en cours, échéances proches, interventions en cours, conservation RGPD.
- Un dossier n'apparaît qu'**une fois**, à son rang le plus haut (aujourd'hui un prospect avec un devis brouillon figure deux fois dans « Devis à préparer »).
- **Vide** : « Rien d'urgent pour le moment. » suivi de la suggestion « Prépare un devis ou fais avancer un prospect. », avec « + Devis » déjà visible en haut.
- **Source indisponible** : « Dossiers du jour indisponibles » reste dit comme aujourd'hui, jamais « Rien d'urgent » à tort.
- **Données** : `WorkflowService.dashboard()` renseigne le nom du dossier (`subtitle`) et la date lisible pour les actions ; **présentation seulement**, aucun calcul métier ne change (voir question 5).

### 2. Compteurs honnêtes
- « **Devis à préparer** » devient « **Devis en brouillon** » et compte les **devis** au statut brouillon ; son clic ouvre la liste Devis, qui contient bien ces devis.
- Les prospects qui attendent un devis restent comptés dans la colonne « Préparer le devis » du pipeline (même nombre qu'aujourd'hui, ouvert au bon endroit) et apparaissent dans la liste « À faire maintenant ». Le texte d'aide contradictoire disparaît.
- Les trois autres indicateurs gardent leur sens ; chaque aide dit où le clic mène.

### 3. En-tête : une seule action principale
- « + Devis » seul en jaune (le devis direct depuis l'Accueil est le chemin du cadrage) ; « + Prospect » et « + Demande » deviennent secondaires. Personnaliser et Actualiser restent secondaires. Aucun chemin retiré.

### 4. Les autres blocs, repliés par défaut
- Indicateurs, Pipeline commercial, Temps & facturation, Projets récents : **repliés par défaut** (un clic les déplie, comme aujourd'hui) ; « À surveiller » reste visible quand il y a une alerte. Les utilisateurs qui ont déjà une disposition enregistrée ne voient aucun changement.
- Le bloc `actions` prend un seul nom : « Projets récents ».
- Texte à 14 px minimum dans les blocs retouchés ; les tuiles gardent leurs couleurs de palette métier.

## Points à trancher par toi

1. **Ordre de la liste** (proposé ci-dessus) : OK, ou tu changes les rangs ?
2. **« Devis à préparer » devient « Devis en brouillon »** (compte de vrais devis) : OK ?
3. **Blocs Indicateurs, Pipeline, Temps, Projets récents repliés par défaut** (sans toucher aux dispositions déjà enregistrées) : OK ?
4. **Un seul bouton jaune, « + Devis »** : OK ?
5. **Nom du dossier et date lisible fournis par `WorkflowService.dashboard()`** (côté application, présentation seulement) : OK ?

## Ce que je n'ai pas pu voir

L'Accueil actuel avec les clients TEST de R5, l'Accueil avec alertes réelles, noms longs, fenêtre étroite, clavier, états d'erreur de source, thèmes AtoumWeb et Blanc, densités Compact et Confort +.

## Preuves prévues si tu valides

Tests d'abord (règles pures : ordre, rang unique par dossier, limite de sept, libellés « en retard de N jours », compteur de devis brouillon ; `WorkflowService.dashboard()` avec nom du dossier sur une base temporaire), câblage par lecture du source comme R3 à R5, typecheck, suite complète, les quatre scripts natifs, **examen des scripts de recette de l'Accueil** (`check-home-shell-lot1.cjs`, `check-ux-v2-02d-home.cjs`, `check-shell-home-simplification.cjs` : règle H, ils sont réécrits sur des règles durables s'ils visent l'ordre ou le libellé des blocs), captures avant / après sur les trois clients enrichis dans `captures-r6\`, budget des petits textes qui doit baisser (`HomeDashboard.css` : 32), plan `docs/refonte/plans/2026-11-14-r6-accueil.md`, mise à jour de `FINITIONS.md` avant le commit, un seul commit local après tes captures.

# R9 Réglages : fiche de refonte (Mon entreprise d'abord, outils de test rangés en « Recette »)

Statut : **proposition, à valider par Carlos avant tout code** (règle J). Aucun code écrit.
Skills : `atoumweb-design` (critique, shape), `superpowers:brainstorming`. Thème Noir, densité Confort (règle E). Règle A : la disposition de l'écran est à valider ici ; données, règles métier, légal et ordre du parcours restent ta décision (règle B).

## D'où viennent les constats

- **Code lu** : `App.tsx` (`SettingsPage`, lignes 490 à 686 ; le rendu de la page ajoute `DemoPanel` **avant** elle, ligne 439), `workflow/DemoPanel.tsx`, `commercial/CompanyQuoteSettings.tsx` (41 lignes denses) et `company-quote-settings.css`, `ui/KeyFigures.tsx` et `shared/projectTabs.ts` (`plural`) pour les briques de R7 et R8.
- **Captures** : `C:\DEV\Livrables\Cadrage-parcours\captures-r8\apres\` : `026` (haut de page), `027` (bas), `028` (l'étape « Mon entreprise » de l'outil, qui montre la même vue que `026`). Les captures d'audit (`captures-audit\022` à `024`) datent d'avant R2 : note de l'audit **17/40**, page de **4 499 px** de haut.
- **Lecture seule de la base de test** (copie jetable, rien écrit) : les quatre informations de « Mon entreprise » (identité, administratif, TVA, réclamations) sont **renseignées** ; les quatre informations contractuelles (médiateur, destinataire de la rétractation, sous-traitants, RGPD) sont **à renseigner** ; **aucun logo** ; validité 30 jours, acompte proposé 30 %. 51 enregistrements de test.
- **Limites** : je n'ai vu que le haut et le bas de la page. Le milieu (apparence, navigation, aide, documents, diagnostics) est lu dans le code, pas sur capture. Les trois autres onglets de « Mon entreprise » (Logo et présentation, Paramètres du devis, Conditions contractuelles), l'aperçu paginé et les confirmations ne sont pas vus.

## Ce que l'écran montre (critique)

**L'ordre d'aujourd'hui, de haut en bas :**

| # | Bloc | Constat |
|---|---|---|
| 1 | **Données de démonstration** (`DemoPanel`) | Premier bloc de la page : trois boutons « Créer un parcours test complet », « 51 enregistrements de test », un bouton **rouge** « Réinitialiser les données de test ». Un outil de recette ouvre la page de configuration. |
| 2 | Rechercher un réglage | Un panneau entier (165 px) pour un champ et une phrase d'aide. |
| 3 | **Mon entreprise et devis** | Troisième bloc, à 717 px. Quatre onglets ; l'onglet actif est **jaune plein** (`#ffda00` écrit en dur dans `company-quote-settings.css`), donc il se lit comme un bouton principal. Rien ne dit que les informations sont complètes ou non, alors qu'elles conditionnent l'envoi d'un devis. |
| 4 | Apparence (thème, densité) | Six cartes de choix. |
| 5 | Navigation et vues | Rail, favoris « 0 favori(s) » (jargon de programmeur), remise à zéro de la largeur des listes Clients et Annuaire. |
| 6 | Aide contextuelle | Un seul interrupteur, dans un panneau pleine largeur. |
| 7 | Documents et classement | Trois chemins et un bouton de 60 caractères : « Ouvrir Documents & Contrats sans changer les règles d'archivage ». |
| 8 | Diagnostics du Manager | Sept lignes techniques toujours ouvertes, lecture seule. |
| 9 | Dossier de travail | Un bouton **jaune** « Choisir un autre dossier » : changer de workspace est une action rare et lourde, pas l'action principale de la page. |
| 10 | Sauvegarde de la base | Deux boutons, à droite du dossier de travail. |

**Autres défauts :**
- **Plusieurs jaunes** : l'onglet « Mon entreprise », « Enregistrer et actualiser l'aperçu », « Choisir un autre dossier ».
- **Capitales espacées** en sur-titre (« STOCKAGE · WORKSPACE », « SÉCURITÉ · BASE SQLITE », « APPARENCE », « AVANCÉ · LECTURE SEULE ») et **textes sous 14 px** : `.eyebrow` 9 px, `.theme-card strong` 12 px, `.theme-card > span` 10 px, `.path-value` 10 px, `.settings-diagnostic-list dt` 12 px (budget de `styles.css` : 28 en tout, dont ces règles).
- **Longs paragraphes** d'explication au-dessus de chaque bloc (jusqu'à cinq lignes).
- **Le code de la page est dans `App.tsx`** (694 lignes), à côté du routage.

**À conserver** : toutes les fonctions (aucune n'est retirée) : les quatre onglets de Mon entreprise, l'enregistrement avec aperçu paginé, la garde de sortie, le thème et la densité, le rail et les favoris, la largeur des listes, l'aide au survol, les chemins de Documents, le diagnostic en lecture seule, le choix du workspace, la sauvegarde et la restauration SQLite, la création et la remise à zéro des données de test, la recherche d'un réglage et ses accès directs. Les identifiants `settings-*` restent (de nombreuses recettes les lisent).

## Intention

Que Réglages s'ouvre sur **ce dont on a vraiment besoin** : « Mon entreprise » (elle conditionne l'envoi des devis) et dise **où elle en est**. Que les réglages courants (apparence, navigation, aide) viennent ensuite, que les actions rares et lourdes (dossier de travail, sauvegarde, diagnostic) soient rangées, et que les outils de test sortent du chemin principal, dans une section repliée **« Recette »** (décision de Carlos du 13/11/2026). R9 reste sur la **surface** : aucune règle métier, aucune donnée, aucun réglage modifié.

## Hors périmètre

- **L'acompte proposé** (« Acompte proposé (%) », valeur 30 dans « Paramètres du devis ») et `depositPercent` : **lot dédié**, décidé le 14/11/2026. R9 ne change ni la valeur, ni le champ, ni son texte.
- Les règles de « Mon entreprise » : quelles informations sont exigées (`COMPANY_KEYS`), l'état d'une information, l'enregistrement et l'aperçu PDF.
- Le contenu de la bibliothèque des conditions (fenêtre « Ouvrir la bibliothèque des conditions »).
- Les règles de sauvegarde et de restauration SQLite, le choix du workspace, le contenu des données de test (ce qu'elles créent et suppriment).

## Approches envisagées

- **A (recommandée) : une seule page qui défile, réordonnée et regroupée en six sections**, avec « Recette » et « Diagnostic » repliés. Les accès directs et la recherche gardent leur sens, tous les identifiants restent.
- **B : une navigation latérale interne, une seule section visible à la fois** (Entreprise, Apparence, Navigation, Données, Diagnostic, Recette). Page courte, mais la recherche (« filtre les rubriques visibles ») et les accès directs doivent être repensés et plusieurs recettes lisent tout dans la même page. Plus de risque, pour un écran visité rarement.
- **C : seulement déplacer « Mon entreprise » en premier et ranger les données de démonstration en bas.** Rapide, mais le jaune multiple, les textes minuscules et les paragraphes restent.

Je recommande **A**.

## Proposition (approche A)

### Croquis
```
Réglages                                              [ Rechercher un réglage…        ]
(Aller à : …) seulement quand on cherche

┌ Mon entreprise et devis ───────────────────────────────────────────────────────┐
│ Mon entreprise · Logo et présentation · Paramètres du devis · Conditions        │
│ ✓ Les 4 informations de tes devis sont renseignées.                             │
│ [ champs de l'onglet ]                                  [ Enregistrer et actualiser l'aperçu ]  (seul jaune)
└─────────────────────────────────────────────────────────────────────────────────┘
┌ Apparence ── thème (3 cartes) · densité (3 cartes) ─────────────────────────────┐
┌ Navigation et aide ── rail · favoris · largeur des listes · aide au survol ─────┐
┌ Données et sauvegarde ──────────────────────────────────────────────────────────┐
│ Dossier de travail     C:\…\workspace                       [ Choisir un autre dossier ]
│ Documents des clients  C:\…\clients · exports  C:\…\exports [ Ouvrir Documents & Contrats ]
│ Base du Manager        sauvegarde quotidienne               [ Sauvegarder maintenant ] [ Restaurer… ]
▸ Diagnostic (lecture seule)                                        (replié)
▸ Recette · 51 enregistrements de test                              (replié, en dernier)
```

### 1. Ordre et regroupement
Six sections, dans l'ordre : **Mon entreprise et devis**, **Apparence**, **Navigation et aide** (« Navigation et vues » et « Aide contextuelle » réunies : deux préférences d'affichage), **Données et sauvegarde** (dossier de travail, chemins de Documents, sauvegarde de la base : trois lignes au lieu de trois panneaux), **Diagnostic** (replié), **Recette** (replié, dernier). Aucun contenu n'est retiré ; les anciens titres restent comme intitulés de ligne.

### 2. « Recette » replié, en dernier
`DemoPanel` quitte le haut de la page. Il devient la section **« Recette »** repliée par défaut, avec le nombre d'enregistrements de test dans son titre (« Recette · 51 enregistrements de test »). Dedans : les trois boutons de création et « Réinitialiser les données de test » (en rouge, inchangé), même texte de confirmation. Je ne touche ni à ce qu'ils créent ni à ce qu'ils suppriment.

### 3. « Mon entreprise » dit où elle en est
Une ligne d'état, calculée avec les **états existants** (`admin[clé].state`), sans nouvelle règle : sur l'onglet « Mon entreprise » : « Les 4 informations de tes devis sont renseignées. » ou « Il manque : réclamations, TVA. » ; sur « Conditions contractuelles » : « 4 informations à renseigner : médiateur, … ». L'onglet actif devient un **repère calme** (bordure et soulignement d'accent, comme les onglets de Projet) et non plus un jaune plein. « Enregistrer et actualiser l'aperçu » est **le seul bouton jaune** de la page.

### 4. Recherche d'un réglage
Une ligne (champ à largeur bornée, sans panneau ni phrase d'aide permanente : l'aide devient une info-bulle). Les « Aller à : … » restent, affichés seulement quand on cherche. Le filtrage des rubriques reste identique.

### 5. Textes et petits textes
Sur-titres en capitales supprimés (le titre de section suffit) ; paragraphes réduits à une ou deux phrases (le texte complet reste en info-bulle `FieldHelp` quand il explique une limite) ; « 0 favori(s) » devient « 0 favori » avec `plural` ; le bouton de Documents devient « Ouvrir Documents & Contrats » (les règles d'archivage ne changent pas, la phrase le dit déjà) ; chemins et libellés des cartes à 14 px au moins ; « Choisir un autre dossier » devient un bouton secondaire.

### 6. Code
`SettingsPage` sort d'`App.tsx` vers `settings/SettingsPage.tsx` (déplacement du code, mêmes propriétés, mêmes identifiants). Les règles pures de la page (ordre des sections, phrases d'état de Mon entreprise, compteur de favoris) vont dans `shared/settingsSections.ts` avec leurs tests.

### 7. Budget et nettoyage
Les petits textes de `styles.css` (blocs Réglages), de `workflow.css` et de `company-quote-settings.css` baissent là où je retouche ; le jaune écrit en dur de l'onglet disparaît (jetons `--aw-accent-*`) ; aucun `!important` ajouté ; règles CSS prouvées inutilisées retirées (règle F).

## Points à trancher par toi

1. **Ordre et regroupement** en six sections (point 1) : OK ?
2. **« Recette » replié, en dernier** (point 2), avec le compte de données de test dans son titre : OK ?
3. **Ligne d'état de « Mon entreprise »** (point 3) et onglet actif calme : OK ? Elle lit les états existants ; elle n'ajoute aucune règle (les informations exigées sont celles du code actuel : identité, administratif, TVA, réclamations).
4. **Recherche sur une ligne**, accès directs gardés (point 4) : OK ?
5. **Textes** du point 5 (surtout les sur-titres supprimés et « Ouvrir Documents & Contrats ») : OK ? Et « Choisir un autre dossier » en secondaire ?
6. **Sortir `SettingsPage` d'`App.tsx`** (point 6) : OK, ou tu préfères ne pas déplacer le code dans ce lot ?
7. **Jeu de cas de figure** : rien à écrire dans la préproduction. L'état « Mon entreprise incomplète » (une information vide) sera vu **sur une copie jetable** par une variante de l'outil de capture, comme pour l'Accueil sans réglage. OK ?

**Information** : « Acompte proposé (%) » reste à 30 : lot dédié, non touché.

## Ce que je n'ai pas pu voir

Le milieu de la page sur capture, les onglets « Logo et présentation », « Paramètres du devis » et « Conditions contractuelles », l'aperçu paginé après enregistrement, la fenêtre « bibliothèque des conditions », les confirmations (réinitialisation des données de test, restauration, remise à zéro de la largeur), les états d'erreur, la fenêtre étroite, le clavier, les thèmes AtoumWeb et Blanc, les densités Compact et Confort +.

## Preuves prévues si tu valides

Tests d'abord (ordre des sections, phrases d'état de Mon entreprise pour 0, 1 et 4 informations manquantes, accord du compteur de favoris, sections repliées par défaut, un seul bouton principal par lecture du source comme R3 à R8), typecheck, suite complète, les quatre scripts natifs sans option, comparaison au dernier commit de toute recette qui échoue (règle H ; les recettes `check-packaged-quote-settings`, `check-contract-library-ui`, `check-native-commercial-ui` et d'autres lisent Réglages : je les liste avant de coder), captures avant / après dans `captures-r9\` (dont Mon entreprise sur chaque onglet et la variante « incomplète »), budget des petits textes à la baisse, fins de ligne par `eol-report.cjs`.

## Révisions

- **14/11/2026, « OK global » de Carlos : points 1 à 7 validés avec mes recommandations** (six sections, Recette repliée en dernier, ligne d'état de Mon entreprise et onglet actif calme, recherche sur une ligne, textes du point 5 dont « Choisir un autre dossier » en secondaire, `SettingsPage` sorti d'`App.tsx`, aucun cas de figure écrit dans la préproduction).

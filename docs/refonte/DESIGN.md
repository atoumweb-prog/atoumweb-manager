# DESIGN : charte et référence de la refonte d'AtoumWeb Manager

Statut : **document de référence unique de la refonte visuelle et ergonomique**. Les décisions de la section 11 ont été prises par Carlos le 13/11/2026 ; le reste de la partie A est un état des lieux tiré du code, à relire. Il reprend intégralement la spécification décidée de l'ancien `docs/ux-v2/DESIGN-SYSTEM.md` (partie B).
Légende : **[EXISTE]** = constaté dans le code (source indiquée). **[SUGGÉRÉ]** = proposition non décidée. **[DÉCIDÉ]** = décision de Carlos (date indiquée).
Aucun changement de ce document sans accord de Carlos.

## Objectif de la refonte

1. **Priorité 1 : l'ergonomie.** Moins de clics, des parcours clairs, et l'information comme l'action utiles trouvées tout de suite.
2. **Priorité 2 : un style moderne et agréable**, soigné, qui n'a pas l'air générique.
3. **Le fond ne change pas sans validation de Carlos** : données, règles métier et parcours **Prospect → Devis → Projet** restent tels quels tant qu'il n'a pas validé un changement.

## Partie A : état des lieux et décisions

### 1. Nature de l'interface

[EXISTE] Application de bureau (Electron + React) : outil de travail quotidien, mode « Operate » (tâches, listes, fiches, tableaux).
[SUGGÉRÉ] Priorités de conception : ergonomie et lisibilité, cohérence entre écrans, états complets (vide, chargement, erreur, contenu long) avant l'expression. La marque vit dans les détails (accent, rail, icône), pas dans la décoration.

### 2. Thèmes

[EXISTE] Trois thèmes, `THEME_NAMES = ['atoumweb','noir','blanc']` (`src/shared/contracts.ts`), appliqués via `:root[data-theme=…]` (`src/renderer/styles.css`). Thème par défaut actuel : `atoumweb`.

| Token | AtoumWeb (défaut) | Noir | Blanc |
|---|---|---|---|
| Fond (`--canvas`) | #f5f3ee | #0e1115 | #f7f8fa |
| Surface (`--surface`) | #ffffff | #161a20 | #ffffff |
| Surface douce (`--surface-soft`) | #faf9f6 | #11151a | #f8fafb |
| Texte (`--text`) | #18212b | #f2f4f6 | #1f2933 |
| Texte atténué (`--muted`) | #6e7882 | #9aa4af | #6d7782 |
| Bordure (`--border`) | #e5e1d8 | #2a3038 | #e6e9ed |
| Accent (`--accent`) | #b9965c | #c6a46c | #92733f |
| Accent fort | #92733f | #dfbd83 | #755a30 |
| Accent doux | #f2eadc | #2a241b | #f7f1e6 |
| Succès | #2d7a58 | #55b98b | #287a55 |
| Rail latéral (`--sidebar`) | #101b25 (marine) | #080a0d | #ffffff |

- [EXISTE] Descriptions affichées à l'utilisateur (`App.tsx`) : AtoumWeb « Marine, clair et accent or » ; Noir « Interface sombre et neutre » ; Blanc « Interface claire et minimaliste ».
- [EXISTE] L'identité bleu nuit / jaune du Noir (#101b25, #ffda00 / #ffda29) est déjà dans le code, mais seulement sur des écrans précis (Catalogue, parcours du devis, onglets Prospection ; `catalog-workspace-v2.css`, `quote-journey.css`, `prospect-workspace-tabs.css`). Les valeurs de base du Noir dans `styles.css` restent neutres avec accent or.
- [DÉCIDÉ 13/11/2026] **Thème de référence : Noir / Confort.** Les deux autres thèmes (AtoumWeb, Blanc) sont alignés ensuite sur les mêmes rôles de tokens, écran par écran.

### 3. Densités

[EXISTE] `DISPLAY_DENSITIES = compact | comfort | comfort_plus` (`display-density.css`). Réglage par défaut : Confort.

| Variable | Compact | Confort | Confort + |
|---|---|---|---|
| Texte principal | 14 px | 16 px | 18 px |
| Texte secondaire | 14 px | 15 px | 16 px |
| Petit texte | 14 px | 14 px | 14 px |
| Hauteur de contrôle | 36 px | 42 px | 48 px |
| Marge de panneau | 16 px | 22 px | 26 px |
| Espacement (`--ui-gap`) | 8 px | 12 px | 16 px |

Règle déjà posée : aucun texte fonctionnel sous 14 px (`display-density.css`, `ui-typography-consistency.css`). Décision E01 du 09/10/2026 : Compact passe de 15 à 14 px.

### 4. Typographie

[EXISTE depuis R0] Une seule famille, **Segoe UI explicite en premier** : `"Segoe UI", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif` (`styles.css`). Avant R0, la pile commençait par Inter, non installée sur le poste ni embarquée : le rendu réel était déjà Segoe UI, par le secours. Le changement est donc invisible, mais le rendu ne dépend plus de la présence d'Inter sur un poste. Aucun fichier de police n'est embarqué.
[EXISTE] Police à chasse fixe `ui-monospace, SFMono-Regular, Consolas` pour chemins et code.
[EXISTE] Variables de taille : `--aw-font-functional`, `--aw-font-secondary`, `--aw-font-body` (couche finale `ui-typography-consistency.css`, utilisée 194 fois).
[DÉCIDÉ 13/11/2026] **Inter embarquée abandonnée** (troncatures causées par sa largeur, environ 10 % de plus que Segoe UI, et aucun gain sur un poste unique). Une police de marque pourra être étudiée plus tard, avec un audit des largeurs sur tous les écrans.
[SUGGÉRÉ] Limiter la hiérarchie à des rôles nommés (titre de page, titre de panneau, corps, secondaire, étiquette, donnée tabulaire) plutôt qu'à des tailles libres.

### 5. Couleurs et tokens sémantiques

[EXISTE] Tokens de thème : voir section 2. Utilisations les plus fréquentes : `--border` (1008), `--accent` (567), `--surface` (542), `--muted` (450), `--text` (439).
[EXISTE] Palette métier (reprise dans la partie B) : rouge #D62828, jaune #F2B705, bleu #1565C0, vert #198754. Ce sont les valeurs les plus répétées en dur dans les CSS (jaune 40 fois, bleu 28, rouge 24, vert 17).
[EXISTE] Couleurs d'état factorisées en variables seulement en partie (`--aw-status-green/blue/yellow/red-bg/-fg`, `ui-consistency-v2.css`).
[EXISTE] Règle déjà décidée : une couleur décorative ne reçoit pas systématiquement un rôle d'état ; contraste et focus ne reposent jamais sur la couleur seule.
[DÉCIDÉ 13/11/2026] **Tokens sémantiques par thème : succès, alerte, danger, info, accent, définis AVANT toute refonte d'écran.** Les valeurs écrites en dur sont ensuite remplacées progressivement par ces tokens.
[Historique, réalisé en R0] Point de départ proposé : succès = vert #198754, alerte = jaune #F2B705, danger = rouge #D62828, info = bleu #1565C0, accent = jaune/or du thème ; chacun avec fond, texte et bordure par thème et vérification du contraste. Les noms ont été fixés en R0 (voir ci-dessous) ; les `--aw-status-*` existants restent en place jusqu'à R1.
[EXISTE depuis R0] Les tokens sont définis dans `src/renderer/tokens.css` (importé en premier dans `main.tsx`) : pour chacun des cinq rôles (`success`, `warning` = alerte, `danger`, `info`, `accent`), quatre variables `--aw-{rôle}-solid`, `--aw-{rôle}-on-solid`, `--aw-{rôle}-soft-bg`, `--aw-{rôle}-soft-fg`, avec des valeurs fixes par thème (tableau dans `docs/refonte/plans/2026-11-13-r0-fondations-design.md`, valeurs vérifiées par `tokens.test.ts`, qui contrôle aussi le seuil de contraste AA 4,5). `--danger` est désormais défini dans les trois thèmes.
[EXISTE depuis R0] Accent : AtoumWeb `#b9965c`, Blanc `#92733f`, **Noir `#ffda00`**. Le `--accent` historique (or dans Noir, 567 usages) n'est pas modifié ; les deux coexistent jusqu'à la migration écran par écran (R1 et R2+).
[À CORRIGER EN R1] Texte sur fond plein de l'accent Blanc : contraste 4,42, sous le seuil de 4,5 ; accepté pour R0 (texte gras ou grand). Sur fond clair, `warning solid` et `accent solid` (AtoumWeb) ne suffisent pas seuls pour une icône ou une bordure.

### 6. Forme, espacement, relief

[EXISTE] Rayons les plus fréquents : 10 px (211 fois), 9 px, 8 px, pastilles à 999 px, 12 px, 11 px. Ombre unique par thème (`--shadow`).
[EXISTE] Rail latéral de 258 px, barre supérieure de 68 px avec recherche globale (max 620 px), widget chrono et horloge globale (`styles.css`).
[SUGGÉRÉ] Réduire l'échelle de rayons à trois valeurs (petit / moyen / pastille) après relevé de ce que chaque valeur sert.

### 7. Composants

[EXISTE] Composants partagés (`src/renderer/ui/`) : `AppButton` (variantes `primary`, `secondary`, `quiet`, `danger`, anti-double clic, erreur visible), `AppNotice`, `AppTextField`, `DataTable` et `ConfiguredDataTable`, `TableControls`, `SavedViewPicker`, `NavigationRail`, `RecordPane`, `ResizableSplitView`, `WorkspaceHeader`, `HeaderAlerts`, `FieldHelp`, `FormFeedbackIndicator`, `BrandMark`. Des « ateliers » (`*Workshop.tsx`) servent de démonstration isolée.
[EXISTE] Classes CSS historiques très utilisées directement : `secondary-button` (494 usages), `primary-button` (195), `eyebrow` (175), `panel` (108), `status-pill` (40), `panel-title` (27). Une partie des écrans n'utilise donc pas encore `AppButton`.
[EXISTE] Conventions déjà décidées (partie B) : liste + détail par défaut, fiche rapide au premier clic puis « Agrandir », actions critiques en texte + icône, garde de sortie en trois choix, aide contextuelle `?`.
[SUGGÉRÉ] Faire d'`AppButton` et des composants partagés l'unique source des boutons et contrôles, et migrer les écrans par lot, sur accord.

### 8. Accessibilité

[EXISTE] Focus visible dans 42 règles CSS ; une icône seule impose un `aria-label` dans `AppButton` ; tests prévus trois thèmes × trois densités.
[SUGGÉRÉ] Ajouter à la recette de chaque lot : contraste des états (survol, actif, désactivé) sur les trois thèmes et navigation clavier complète.

### 9. Constats sur l'existant (dette visible)

- **[EXISTE] 86 fichiers CSS, 542 `!important`.** Les surcharges empilées rendent les changements de thème imprévisibles (ex. onglets actifs en jaune forcé via `html[data-theme] … !important`, quel que soit le thème).
- **[EXISTE] Valeurs en dur** : jaune #ffda29 / #ffda00 dans 6 fichiers, couleurs métier répétées partout.
- **[EXISTE] `--text-muted` est utilisé 268 fois** mais défini une seule fois (`projects/sites-pages-v2.css`) ; sa portée n'a pas été vérifiée.
- **[EXISTE] Petites tailles dans les CSS** : plus de 220 déclarations à 8 ou 9 px, 117 à 10 px. Elles sont neutralisées par la couche finale `ui-typography-consistency.css` d'après son commentaire ; le rendu réel n'a pas été vérifié.
- **[SUGGÉRÉ]** Ordre de traitement : tokens sémantiques → composants partagés → suppression des surcharges, lot par lot.

### 10. Principes de la refonte

1. [SUGGÉRÉ] Un lot = un périmètre validé ; pas de refonte complète d'un écran sans accord.
2. [EXISTE] Aucune donnée métier dupliquée pour faciliter un écran (`AGENTS.md`).
3. [EXISTE] Les trois thèmes restent cohérents ; vérification à chaque lot (`AGENTS.md`).
4. [SUGGÉRÉ] Toute décision durable est ajoutée à ce document après accord de Carlos.
5. [DÉCIDÉ 13/11/2026] Pour tout travail d'interface, la skill `atoumweb-design` est obligatoire. À chaque étape, les skills utilisées sont indiquées à Carlos.

### 11. Décisions et points ouverts

**Décisions prises le 13/11/2026**

- **Thème de référence : Noir / Confort**, les deux autres thèmes alignés ensuite.
- **Police : Segoe UI explicite, Inter abandonnée le 13/11** (troncatures, poste unique). Une police de marque pourra être étudiée plus tard avec audit des largeurs. Pas de fichier embarqué ; la pile commence par `"Segoe UI"` (`styles.css`).
- **Tokens sémantiques** (succès, alerte, danger, info, accent) définis par thème **avant** toute refonte d'écran.
- **Document unique** : ce fichier remplace `docs/ux-v2/DESIGN-SYSTEM.md`, qui ne contient plus qu'un renvoi.

**Ce qui est déjà validé (à ne pas confondre)**

- **Lot UX 1 : Accueil, en-tête et rail de navigation, thème Noir / Confort.** Validé officiellement par Carlos le 03/11/2026, sur décision après revue du dossier AVANT/APRÈS (recette visuelle sur captures). Contrôles techniques associés : typecheck, 44 tests ciblés, 96 contrôles natifs (`docs/ux-v2/CONSIGNES-ET-REPRISE.md`, `PROJECT_STATUS.md`). La portée est limitée à ces trois zones ; aucune refonte volontaire de Blanc ni d'AtoumWeb à ce stade.
- **Les lots 1 à 6 de fonctionnalités** (branches `claude/lot1-mon-entreprise` à `claude/lot6-rgpd-au-devis` : Mon entreprise, CGV disponibles, Devis rapide, Envoyer et faire accepter, Prospect simplifié, RGPD au devis) **n'ont pas encore été testés par Carlos.** Ils ne sont pas validés.

**Décisions de parcours du 13/11/2026 (cadrage validé dans son principe : fil « Prochaine étape »)**

- Relances d'un devis envoyé : J+7, J+14, expiration J+30, **réglables dans les paramètres**.
- Projet créé à l'acceptation, avec confirmation ; « + Depuis un devis » conservé. Client particulier : rappel du délai de rétractation, démarrage après ce délai ou sur demande expresse écrite.
- « Contacts » regroupe Prospection, Clients et Annuaire **au niveau de l'interface seulement**, sans migration de données à ce stade.
- CM2C : alerte à la création d'un contact particulier et **blocage de l'envoi** d'un devis à un particulier tant que « Convention de médiation conclue » n'est pas cochée dans Mon entreprise.
- Échéancier (exigence pour R2+) : pas d'acompte par défaut à 30 % quand l'offre n'a pas d'échéancier ; le devis affiche « Échéancier à définir » et l'envoi est bloqué tant qu'il n'est pas choisi.
- Étapes « Proposé, à valider » : d'abord les 8 offres de départ, relues avec Carlos avant intégration.
- Référence du parcours : `C:\DEV\Livrables\Cadrage-parcours\CADRAGE.md` et sa maquette cliquable.

**Ordre des lots de la refonte (décidé le 13/11/2026)**

1. **R0 Fondations** : tokens sémantiques par thème (succès, alerte, danger, info, accent), correction de `--danger` et police explicite (Segoe UI en tête de pile).
1b. **Cadrage des parcours** (ajouté le 13/11/2026, avant R1, aucun code). Principe : la refonte est ergonomique et pratique, **aucune fonctionnalité n'est supprimée** ; le chemin courant devient court et évident, le reste est rangé à un clic. Le Manager doit appliquer le Référentiel interne V1 (lot 1 grille et règles, lot 2 fiches de vente et étapes à faire, lot 3 clauses et matrice, lot 4 méthode, situations réflexes, FAQ) et dire, sur un contact, un devis ou un projet, **quoi faire ensuite**. Livrables : critique des écrans face au déroulé du lot 4, parcours cible (contact → offre et fiche de vente → devis pré-rempli, clauses posées par la matrice → envoi → relances → acceptation → projet avec les étapes de l'offre → préparation Abby, Abby restant seule à émettre la facture ; devis possible directement depuis un contact), tableau garder / simplifier l'accès / regrouper / masquer par défaut, 3 scénarios avant / après, étapes « Proposé, à valider » à faire valider. Skills : `superpowers:brainstorming` et `atoumweb-design` (shape, critique, distill, onboard, clarify). Rapport hors dépôt : `C:\DEV\Livrables\Cadrage-parcours\`.
2. **R1 Composants partagés** alignés sur les tokens (`AppButton`, `status-pill`, tables, notices), en réduisant les `!important` des fichiers touchés. **R1 répare aussi les 3 scripts de recette natifs cassés avant R0** (`check-unsaved-inputs-ui`, `check-contract-library-ui`, `check-ux-v2-lot01a-real-ui`, voir `PROJECT_STATUS.md`).
3. **Pause : recette des lots fonctionnels 1 à 6 par Carlos.** Aucun lot R2+ ne démarre avant.
4. **Audit ergonomique** (ajouté le 13/11/2026, entre la pause et R2 ; depuis l'ajout du cadrage des parcours, il devient la **mise à jour du cadrage** avec les points de friction de la recette : proposition de Claude, à confirmer). Carlos remet les points de friction notés pendant sa recette. Une critique avec la skill `atoumweb-design` porte sur les parcours principaux, sur captures réelles. Elle livre une **liste priorisée (impact / effort)** qui **fixe le contenu et l'ordre de R2 et suivants**. Aucune modification de code pendant l'audit.
5. **R2 et suivants : un écran par lot.** Ordre provisoire (modifiable par Carlos, et révisé à l'issue de l'audit) : Prospection, Devis, Projets, Catalogue, Bibliothèque / Sites, Paramètres.

**Défauts déjà constatés sur les captures du 13/11/2026, à instruire dans l'audit ergonomique** (R0 n'y touche pas) :

- Logo différent selon les écrans (thème AtoumWeb).
- Devis : le message de liste vide parle de filtres alors qu'aucun filtre n'est actif.
- Devis : casse incohérente des en-têtes de colonnes.
- Accueil : « Devis à préparer : 1 » alors que la liste Devis est vide.
- Textes tronqués relevés par Carlos : listes déroulantes de Prospection (« Tous les métier », villes, statuts) et d'Offres (« Toutes les catégorie »), en-tête « Destinatai/re » dans Devis, bouton « Rédui » sur Projet, chevauchement « Heures facturables— 0 h » sur l'Accueil (causés par la largeur d'Inter, donc disparus avec son abandon ; « Destinatai/re » existait déjà avant R0).

Chaque lot reste dans son périmètre, est présenté avant d'être codé, et ne modifie ni les données, ni les règles métier, ni le parcours Prospect → Devis → Projet.

**Reste à décider**

- Rien à ce stade. L'ordre de R2 et suivants est provisoire.

## Partie B : spécification UX/UI décidée (reprise intégrale de `docs/ux-v2/DESIGN-SYSTEM.md`)

Reprise sans modification de fond : seuls les liens relatifs sont adaptés au nouvel emplacement, et les titres sont descendus d'un niveau.

**UX/UI V2 — Fondations et composants partagés**

Statut : **spécification cible décidée**, avec valeurs indicatives marquées comme telles. Ce fichier ne crée pas de composants et ne lance aucun chantier.

### Conventions visuelles
- 3 **thèmes** et 3 **densités** existants à conserver/harmoniser ; mesurer leur couverture réelle.
- Palette métier existante : rouge `#D62828`, jaune `#F2B705`, bleu `#1565C0`, vert `#198754`. Ne pas donner systématiquement un rôle d'état à une couleur décorative.
- Direction de marque : triangle(s) imbriqués, lisibilité en taille d'icône, couleurs AtoumWeb. **Logo définitif non validé comme asset**.
- **Échelle validée du texte principal par densité (E01)** : **Compact 14 px (cible V2, code actuel 15 px)** ; **Confort 16 px** ; **Confort+ 18 px**. Texte secondaire : 14/15/16 px ; petites tailles : pas sous 14 px. Hauteur des contrôles conservée à ce stade : 36/42/48 px. Les titres de page ~22–24 px, titres de section ~17–18 px et icônes ~16–18 px restent indicatifs avant recette visuelle. Les anciennes suggestions de bouton 34–38 px sont remplacées par les hauteurs selon densité.
- Les densités ajustent surtout hauteur, marges et espacement, pas une réduction agressive de taille de police.
- Contraste et état focus ne reposent jamais uniquement sur la couleur. Marqueur Prospect `cold/neutral/warm/hot` distinct de sentiment de relation Client ; carte pipeline non recouverte de couleur.

### Navigation
- Rail d'icônes sombre, groupes et menus contextuels ; recherche globale ; favoris épinglables ; accessibles au clavier.
- Les **17 entrées existantes** continuent d'avoir un point d'accès. Regroupements visuels : Accueil, Commercial, Production, Gestion, Ressources, Pilotage.
- Ne pas relabelliser un état backend pour le faire correspondre aux 7 colonnes métier sans table explicite : pipeline visuel **À qualifier → Besoins → Préparer le devis → Attente retour → Négociation → Finalisation → Conversion** ; les deux dernières colonnes peuvent être des regroupements visuels, **pas des états backend inventés**.
- Changement de contexte préserve route, sélection, onglet, filtres et dimensions selon la portée choisie ; ne dégrade pas les brouillons.

### Fiches
- Premier clic : **fiche rapide**, adaptée au contexte.
- Commande explicite **Agrandir** : fiche complète ; retour conserve dossier et onglet.
- **Liste + détail** par défaut ; panneaux réglables/masquables ; cas éditeurs de page, CGV et prévisualisations disposent de mises en page propres.
- Données client : avatar pouvant être logo, photo ou icône ; distinguer personne morale/physique.
- Actions critiques toujours en texte + icône ; icônes seules réservées aux actions non ambiguës avec tooltip/nom accessible.

### Tableaux et vues
Recherche, tri, filtres, colonnes (visibilité, ordre, largeur), modes liste/carte/kanban lorsque pertinent, vues personnelles enregistrées. Ordre et largeur mémorisés **automatiquement** ; rétablir défaut possible.

Persistance des vues : clé stable `module/vue/contexte` (**modèle conceptuel** à vérifier contre persistence existante) ; ne pas stocker d'identifiants sensibles dans les options UI. Restauration en cas de colonnes disparues : migrer/projeter sans écran cassé. Ne pas remplacer les permissions ou validations métier par le masquage d'un champ.

### Formulaires et garde de sortie
`UX2-DATA-001..005` : état de formulaire **propre à l'éditeur**, basé sur le contenu modifié réellement ; les rafraîchissements parents ne doivent pas démonter et effacer un brouillon enfant. Ignorer réponses asynchrones obsolètes.

Si sortie destructive avec changements :
1. **Enregistrer et quitter** lorsque l'éditeur sait valider et enregistrer de manière fiable.
2. **Continuer la modification** — focus et choix sûr par défaut.
3. **Quitter sans enregistrer** — décision volontaire avec effets bornés au(x) brouillon(s) concernés.

La navigation est autorisée seulement après confirmation de l'enregistrement ; validation échouée ou conflit → garder les saisies et afficher le problème. Les éditeurs sans capacité de sauvegarde en sortie ne doivent pas simuler ce bouton : rester/quitter et explication de la contrainte, à arbitrer selon la réalité d'UX-01. Le changement de workspace programmé au redémarrage et les fenêtres détachées doivent être protégés aux moments appropriés.

Préférences de disposition auto-enregistrées **distinctes** des données métier. Contrats : `Enregistrer` un brouillon ≠ publier une clause ou finaliser un devis.

### Aide contextuelle
- Icône `?` : texte court au survol, explication détaillée après 2–3 secondes de survol si activée, immédiate au clic ou clavier.
- Paramètres utilisateurs pour désactiver les aides automatiques ; ne jamais désactiver confirmations et sécurités critiques.
- Aide métier et aide commerciale du Catalogue partagent un composant de présentation mais pas leur contenu ni leur domaine de publication.
- Éviter des descriptions permanentes sur chaque carte.

### Composants cibles
`AppShell` / `NavigationRail` ; `ContextMenu` ; `QuickDetailPane` / `ExpandedRecordView` ; `ResizableSplitView` ; `DataTableWithViews` ; `FormDirtyIndicator` / `UnsavedChangesGuard` ; `ConfirmActionDialog` ; `ContextHelp` ; `Toast` ; `ActivityHistory` ; `CataloguePicker`. **Noms de conception**, pas classes actuellement présentes ni obligation d'API.

Inventorier les composants réellement présents, réutiliser, ne pas introduire une deuxième logique de formulaire ou de chrono. Composants pilotes dans un **atelier de démonstration isolé** sans écriture métier.

### Accessibilité et tests
- Focus visible, ordre tabulation, actions clavier, Escape sécurisé, retour de focus depuis modale.
- Iconographie avec étiquette accessible ; ne pas cacher le nom d'une action importante.
- Trois thèmes × trois densités, largeurs réduites et fenêtres détachées.
- Test de navigation sans modification et avec brouillon ; validation en cours ; réponse tardive ; conflit de version ; erreur d'enregistrement ; fermeture et recharge ; retour vers fiche.
- Le résultat d'un test de service n'est pas une certification visuelle : tests React/UI et scénarios natifs en supplément.

### Confrontation initiale avec l'existant (09/10/2026)
Voir [Lot 01 — matrice existant/cible](../ux-v2/LOT-01-MATRICE-EXISTANT-CIBLE.md), inspection statique de `main@eb252d5c`. **E01 décidé le 09/10/2026 : Compact passe de 15 px existants à 14 px cible V2** ; Confort reste à 16 px et Confort+ à 18 px. Il s'agit d'une spécification documentaire et non d'une modification CSS réalisée : la recette de lisibilité reste obligatoire. La protection UX-01 livrée en draft #83 offre « Rester / Quitter sans enregistrer » ; « Enregistrer et quitter » est une **cible ultérieure non livrée**, à intégrer sans deuxième registre.

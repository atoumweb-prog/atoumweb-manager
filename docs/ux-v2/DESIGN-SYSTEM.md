# UX/UI V2 — Fondations et composants partagés

Statut : **spécification cible décidée**, avec valeurs indicatives marquées comme telles. Ce fichier ne crée pas de composants et ne lance aucun chantier.

## Conventions visuelles
- 3 **thèmes** et 3 **densités** existants à conserver/harmoniser ; mesurer leur couverture réelle.
- Palette métier existante : rouge `#D62828`, jaune `#F2B705`, bleu `#1565C0`, vert `#198754`. Ne pas donner systématiquement un rôle d'état à une couleur décorative.
- Direction de marque : triangle(s) imbriqués, lisibilité en taille d'icône, couleurs AtoumWeb. **Logo définitif non validé comme asset**.
- **Échelle indicative** (à ajuster par tests visuels et accessibilité) : texte courant 14–15px ; titres page 22–24 ; titres section 17–18 ; légendes 12–13 ; icônes courantes 16–18 ; hauteur de boutons standards ~34–38px.
- Les densités ajustent surtout hauteur, marges et espacement, pas une réduction agressive de taille de police.
- Contraste et état focus ne reposent jamais uniquement sur la couleur. Marqueur Prospect `cold/neutral/warm/hot` distinct de sentiment de relation Client ; carte pipeline non recouverte de couleur.

## Navigation
- Rail d'icônes sombre, groupes et menus contextuels ; recherche globale ; favoris épinglables ; accessibles au clavier.
- Les **17 entrées existantes** continuent d'avoir un point d'accès. Regroupements visuels : Accueil, Commercial, Production, Gestion, Ressources, Pilotage.
- Ne pas relabelliser un état backend pour le faire correspondre aux 7 colonnes métier sans table explicite : pipeline visuel **À qualifier → Besoins → Préparer le devis → Attente retour → Négociation → Finalisation → Conversion** ; les deux dernières colonnes peuvent être des regroupements visuels, **pas des états backend inventés**.
- Changement de contexte préserve route, sélection, onglet, filtres et dimensions selon la portée choisie ; ne dégrade pas les brouillons.

## Fiches
- Premier clic : **fiche rapide**, adaptée au contexte.
- Commande explicite **Agrandir** : fiche complète ; retour conserve dossier et onglet.
- **Liste + détail** par défaut ; panneaux réglables/masquables ; cas éditeurs de page, CGV et prévisualisations disposent de mises en page propres.
- Données client : avatar pouvant être logo, photo ou icône ; distinguer personne morale/physique.
- Actions critiques toujours en texte + icône ; icônes seules réservées aux actions non ambiguës avec tooltip/nom accessible.

## Tableaux et vues
Recherche, tri, filtres, colonnes (visibilité, ordre, largeur), modes liste/carte/kanban lorsque pertinent, vues personnelles enregistrées. Ordre et largeur mémorisés **automatiquement** ; rétablir défaut possible.

Persistance des vues : clé stable `module/vue/contexte` (**modèle conceptuel** à vérifier contre persistence existante) ; ne pas stocker d'identifiants sensibles dans les options UI. Restauration en cas de colonnes disparues : migrer/projeter sans écran cassé. Ne pas remplacer les permissions ou validations métier par le masquage d'un champ.

## Formulaires et garde de sortie
`UX2-DATA-001..005` : état de formulaire **propre à l'éditeur**, basé sur le contenu modifié réellement ; les rafraîchissements parents ne doivent pas démonter et effacer un brouillon enfant. Ignorer réponses asynchrones obsolètes.

Si sortie destructive avec changements :
1. **Enregistrer et quitter** lorsque l'éditeur sait valider et enregistrer de manière fiable.
2. **Continuer la modification** — focus et choix sûr par défaut.
3. **Quitter sans enregistrer** — décision volontaire avec effets bornés au(x) brouillon(s) concernés.

La navigation est autorisée seulement après confirmation de l'enregistrement ; validation échouée ou conflit → garder les saisies et afficher le problème. Les éditeurs sans capacité de sauvegarde en sortie ne doivent pas simuler ce bouton : rester/quitter et explication de la contrainte, à arbitrer selon la réalité d'UX-01. Le changement de workspace programmé au redémarrage et les fenêtres détachées doivent être protégés aux moments appropriés.

Préférences de disposition auto-enregistrées **distinctes** des données métier. Contrats : `Enregistrer` un brouillon ≠ publier une clause ou finaliser un devis.

## Aide contextuelle
- Icône `?` : texte court au survol, explication détaillée après 2–3 secondes de survol si activée, immédiate au clic ou clavier.
- Paramètres utilisateurs pour désactiver les aides automatiques ; ne jamais désactiver confirmations et sécurités critiques.
- Aide métier et aide commerciale du Catalogue partagent un composant de présentation mais pas leur contenu ni leur domaine de publication.
- Éviter des descriptions permanentes sur chaque carte.

## Composants cibles
`AppShell` / `NavigationRail` ; `ContextMenu` ; `QuickDetailPane` / `ExpandedRecordView` ; `ResizableSplitView` ; `DataTableWithViews` ; `FormDirtyIndicator` / `UnsavedChangesGuard` ; `ConfirmActionDialog` ; `ContextHelp` ; `Toast` ; `ActivityHistory` ; `CataloguePicker`. **Noms de conception**, pas classes actuellement présentes ni obligation d'API.

Inventorier les composants réellement présents, réutiliser, ne pas introduire une deuxième logique de formulaire ou de chrono. Composants pilotes dans un **atelier de démonstration isolé** sans écriture métier.

## Accessibilité et tests
- Focus visible, ordre tabulation, actions clavier, Escape sécurisé, retour de focus depuis modale.
- Iconographie avec étiquette accessible ; ne pas cacher le nom d'une action importante.
- Trois thèmes × trois densités, largeurs réduites et fenêtres détachées.
- Test de navigation sans modification et avec brouillon ; validation en cours ; réponse tardive ; conflit de version ; erreur d'enregistrement ; fermeture et recharge ; retour vers fiche.
- Le résultat d'un test de service n'est pas une certification visuelle : tests React/UI et scénarios natifs en supplément.

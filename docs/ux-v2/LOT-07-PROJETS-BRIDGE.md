# Lot 07 — Projets, Sites & Pages, Bibliothèque technique, Bridge
**Statut : spécification cible, disponibilité Bridge réelle à vérifier.**
## Projet
Liste+fiche rapide/agrandie, résumé configurable ; navigation secondaire : vue générale, commercial, tâches/production, prérequis et recette, ressources/accès, Sites & Pages, Bibliothèque, Bridge, temps, documents/historique. Panneaux réglables, retour au dernier contexte.
Projet prévisionnel créé avant acceptation et réconcilié sur **le même projet**. Conflits sur tâches/pages travaillées ≠ suppression silencieuse. Pas de démarrage production implicite.
## Blueprints
Choix associé aux prestations effectivement achetées ; bouton d'initialisation explicite ; aperçu des sites/pages/tâches ; rejouable sans doublons, protection du travail existant. Multi-sites et destination Site/Page explicite ; `ready` n'est pas équivalent à `operational_ready`.
## Sites & Pages
Liste sites/pages à gauche, composition à droite, panneau de réglage masquable ; HTML/CSS/JS avec collage complet lorsque possible, composants AtoumWeb/Divi/Code, design couleur/typo/marges à clic, undo/redo/version, preview composant ou page, ordinateur/tablette/mobile. Bouton démarrer travail lié au chrono global, pas un deuxième chrono.
## Bibliothèque technique
Rechercher, examiner, copier indépendante, adapter, valider humainement, conserver provenance et dépendances, créer variante dans bibliothèque sans altérer la source.
## Bridge
Prévoir toutes étapes d'UX : préparer/exporter, Workbench, ouvrir avec Divi, observer/comparer, valider, publication contrôlée et rollback **seulement si implémentés et capacités vérifiées**. Module autonome Sites/Bridge conservé ; site Projet ≠ snapshot WordPress. Échec Bridge ne fait pas perdre la composition Manager.
## Ordre proposé
07A inventaire des sections techniques et accès ; 07B liste/projet ; 07C blueprints/targets ; 07D composition ; 07E bibliothèque ; 07F intégration capability-driven Bridge ; 07G recette.
## Recette
Site vitrine 1 Site/5 Pages sur le blueprint de référence si applicable, création sans doublon, revue composant, annuler/rétablir, temps sur bonne page, refus d'export sans cible/composition, ouverture Workbench selon capacités, aucune publication directe implicite.

## 09/10/2026 — Préparation avant signature et nouvelle génération (décision validée)
Voir [LOT-07-PROJET-PRE-SIGNATURE.md](LOT-07-PROJET-PRE-SIGNATURE.md) : Projet **prévisionnel volontaire** depuis un devis **non accepté** avec ses lignes/version/quantités, permettant à AtoumWeb de préparer les tâches, Sites/Pages et ressources. Quand le devis est révisé : **Comparer**, **Adapter/Synchroniser** le Projet existant **ou Repartir de zéro** (ancien Projet retiré/archivé/supprimé **seulement si sans risque**, nouvel ID lié atomiquement au dossier commercial). Après signature réelle Abby, **figer/activer uniquement le Projet courant**, sans nouveau doublon et sans publications/abonnements/factures implicites.
**Analyse code :** `ProjectCommercialService.prepare/sync/accept` et `ProjectsApi.prepareQuote` sont déjà prévus ; `ProjectCommercialScopePanel` affiche le prévisionnel et les conflits ; le formulaire classique de `ProjectsPage` filtre `quotes.list({status:'accepted'})`. Pas de `deleteProject` attesté pour la suppression d'un Projet entier. Le parcours V2 doit mettre en valeur l'existant et construire en sécurité la capacité de régénération. **Decision UX2-PRJ-PROV-001/002/003**.

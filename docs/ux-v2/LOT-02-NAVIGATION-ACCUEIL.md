# Lot 02 — Navigation et Accueil
**Statut : spécification cible, non implémentée par ce document.**
## Objectif
Navigation compacte et rapide, Accueil opérationnel sans perte d'accès aux 17 modules.
## Décisions validées
- Rail sombre d'icônes, marque AtoumWeb triangulaire à finaliser, sous-menus au survol/clic, favoris, menus accessibles au clavier.
- Groupes Accueil, Commercial, Production, Gestion, Ressources, Pilotage ; tous les modules restent accessibles.
- Mémorisation automatique des préférences de présentation, recherche globale avec **ouverture du bon objet** plutôt qu'une simple page.
- En-tête repliable, chrono global visible, Accueil compact priorisant aujourd'hui, échéances, alertes et actions ; widgets ordonnables/masquables.
- Ne jamais masquer complètement une alerte critique parce qu'un widget est désactivé.
## Ordre proposé
02A cartographier App/NAV_ITEMS/recherche et fonctions de l'Accueil ; 02B rail/navigation/favoris ; 02C recherche et routage précis ; 02D dashboard/widgets ; 02E recette transversale.
## Réutiliser/préserver
HomeDashboard, App, recherche existante, Workflow/CRM/Projet/Temps, contrôles d'accès et historique. Distinguer dashboard actif de vues anciennes non importées (audit).
## Acceptation
Naviguer vers chaque module, ouvrir fiche par recherche, conserver onglet/filtre, replier/agrandir rail, contrôler clavier, 3 thèmes × 3 densités et pas de second chrono.
## À vérifier
Routage détaillé recherche UX-07 ; champs et états des widgets ; comportement multi-fenêtres.

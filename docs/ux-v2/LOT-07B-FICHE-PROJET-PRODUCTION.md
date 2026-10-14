# Lot 07B — Liste Projet, fiche, production, prérequis et temps

**Statut : spécification UX/UI V2, non développée/testée.** Comparaison du code `main` au 09/10/2026 ; [07A audit](LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md), [07P pré-signature](LOT-07-PROJET-PRE-SIGNATURE.md), [01C panneaux](LOT-01C-FICHES-PANNEAUX.md), [02C routage](LOT-02C-RECHERCHE-ROUTAGE.md).

## 1. Règle de conception
Conserver **un seul Projet**, identifié par `projectId`, comprenant le dossier commercial, les tâches/étapes, les prérequis, sites/pages, ressources, Bibliothèque, chrono, documents et informations Bridge ; la signature change son **état commercial**, pas son identité. La liste peut afficher un **Projet prévisionnel** non signé, sans le compter comme commande acquise.

## 2. Existant vérifié
| Source | Fonction constatée | Écart UX à traiter |
|---|---|---|
| `ProjectsPage.tsx` | Liste/filtre, création devis accepté ou Projet interne, fiche production, onglets **Résumé, Production, Sites & pages, Prérequis, Opérations, Commercial** et panneaux Ressources/Technique/Temps/Accès. | Clarifier l'organisation et rendre **Devis source/Client/Projet provisoire** prioritaires dans la fiche ; éviter d'inventer des onglets vides. |
| `ProjectsPage.tsx` | Plan arbre + fiche nœud, séparation réglable, historique Undo/Redo lié aux **éditions de nœuds**, tâches, statuts et fin de projet. | **Ne pas promettre Undo/Redo universel** aux compositions/ressources/export Bridge. |
| `ProjectsPage.refresh` | Charge les Devis `accepted` pour la création classique depuis Devis. | L'entrée « Préparer projet non signé » doit rester via `QuoteProjectPanel` ou un raccourci guidé au bon Devis ; réutiliser `prepareQuote`. |
| `ProjectCommercialScopePanel` | Affiche état **prévisionnel**, synchronisation du périmètre, conflits et choix `Conserver/Archiver/Détacher/Supprimer si vierge`. | Préserver les décisions de conflit/ressources, montrer la **révision courante** et les dépendances. |
| `ProjectCompletionReviewPanel` | Contrôles de fin de projet avec avertissements d'opérations et de pièces. | Revue d'achèvement ≠ acceptation d'un devis, signature/production réelle ou clôture automatique Abby. |
| `ProjectSitesTab` | Chrono de Page, cumul Sessions, boutons Démarrer/Pause/Reprendre/Arrêter, branchement au timer global. | Un seul chrono actif, pas de deuxième horloge : l'utilisateur peut revenir sur une autre Page sans changer silencieusement son temps. |

## 3. Architecture écran cible
- **Liste / sélection** : Projet n°, Client/Prospect, Site principal si présent, statut opérationnel, **commercialState** (Prévisionnel / Confirmé / Historique), Devis courant, dernière activité, prochaine action ; filtres séparés Provisoires / Actifs / Archivés.
- **Fiche rapide** : bandeau identité, badge explicite **« Projet prévisionnel · devis non signé »** si nécessaire, Devis source et bouton **Ouvrir**, état du plan, Sites/Pages, travail déjà effectué et **alerte Devis modifié**.
- **Agrandir** sans perdre contexte : panneaux ajustables, onglet, nœud, Site/Page, filtre et historique de navigation ; retour fiche rapide sans remonter les éditeurs.
- **Navigation secondaire réelle** : Résumé, Plan/Production, Sites & pages, Prérequis, Ressources, Bibliothèque technique, Temps, Commercial, Opérations lorsque autorisées, Documents/Historique depuis leurs modules si non intégrés. Des liens peuvent ouvrir des panneaux existants au lieu de nouveaux onglets redondants.
- **Actions** : Ajouter au plan, ouvrir Site/Page, démarrer travail (timer global), préparer/adapter projet, résoudre conflit, valider prérequis, consulter ressources/contrats, revue de fin uniquement au bon état.
- **Alerte** : le plan d'un Projet prévisionnel provient d'un **Devis non signé** ; ne pas libeller « Prestations acquises », « Client gagné » ni rendre les opérations actives.

## 4. Statuts et droits
| État réel | Consultation | Édition permise | Action exclue |
|---|---|---|---|
| `legacy` | Historique, projet et sources selon données | Capacités historiques autorisées par service | Requalifier rétroactivement en Projet provisoire sans migration contrôlée |
| `provisional` | Devis source, comparaison, tâches/ressources/sites/pages et temps internes | Préparation **`to_prepare`**, conflits/affectations, ressources et compositions dans leurs services | Activer maintenance/vente/Client/facture/publier WP par simple préparation |
| `frozen` | Devis accepté, snapshots et actions de production | Travail opérationnel selon statuts/règles existants | Modifier sans révision le périmètre commercial accepté |

La liste des **statuts opérationnels** `to_prepare/in_progress/waiting_client/blocked/to_validate/completed/archived` est indépendante de `commercialState`. Un badge de couleur ne suffit pas pour les différencier.

## 5. Protections UX-01 et navigation
- Clic autre Projet/onglet, fermeture panneau, repli, retour, changement de filtre et navigation Devis/Client → garder le brouillon si un éditeur est démonté ; utiliser **le registre de garde UX-01 de #83 une fois fusionné**, pas un second mécanisme.
- `refresh`/événements asynchrones ne remplacent pas le détail et la note dirty ; vérifier IDs et éditions concurrentes.
- Le badge chronométrique affiche **la Page réellement active** ; démarrer Page B alors que timer A tourne propose une **confirmation de changement dans le timer global**, jamais une nouvelle session concurrente.
- Réorganiser les panneaux sans dupliquer les sources de vérité (projet/time/ressource/document) ; le module Ressources ne doit pas être recopié dans 3 bases.

## 6. Recette future (16 tests, aucun exécuté)
| ID | Scénario | Attendu |
|---|---|---|
| R07B-01 | Ouvrir projet depuis recherche globale | Bon ID et dossier |
| R07B-02 | Projet provisoire lié Prospect | Badge « Non signé » et aucune fiche Client inventée |
| R07B-03 | Agrandir puis réduire | Onglet, nœud et édition préservés |
| R07B-04 | Parcourir plan/Prérequis/Sites/Temps | Bon périmètre, pas de chargement croisé |
| R07B-05 | Editer tâche puis utiliser Undo/Redo | Historique des **nœuds** correct |
| R07B-06 | Composer Page puis essayer Undo global du plan | Ne pas prétendre annuler un changement HTML/CSS/JS |
| R07B-07 | Afficher tâche `blocked` / `waiting_client` | Statut textuel lisible, pas couleur seule |
| R07B-08 | Commencer travail sur Page A | Un chrono global, contexte correct |
| R07B-09 | Commencer B alors que A tourne | Confirmation du changement, pas deuxième timer |
| R07B-10 | Stopper/pause/reprendre la Page | Durée et sessions rattachées exactement à cette Page |
| R07B-11 | Devis préparatoire révisé | Projet affiche écart à traiter, pas d'effacement |
| R07B-12 | Projet accepté avec conflit encore ouvert | Activation refusée par service |
| R07B-13 | Projet archivé | Travail/historique consultables, aucune suppression des fichiers |
| R07B-14 | Fermer fiche avec formulaire sale | Garde UX-01 et contenu conservé |
| R07B-15 | 3 thèmes × 3 densités / clavier | Tous les onglets/actions accessibles et Compact >=14px |
| R07B-16 | Tester navigation, SQL, timer et rôles sur fixture | SHA/bilan, aucune Validation-MSI |

## 7. Questions techniques
**E184** réorganisation des onglets/panneaux existants sans créer de doublons, **E185** restauration de filtres/largeurs/nœuds, **E186** garde des overlays et des éditeurs de tâche, **E187** statut et temps de préparation provisoire, **E188** affichage de l'ancienne vs révision courante, **E189** fin Projet avec contrôles opérationnels et rôle contractuel.

**La structure V2 est cible documentaire ; les capacités de production restent soumises aux services et à la signature réellement enregistrée.**

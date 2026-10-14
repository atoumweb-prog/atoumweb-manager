# Lot 07G — Recette transverse Projet, Devis, Sites/Pages, Bibliothèque et Bridge

**Statut : plan de validation et de livraison documentaire, aucun test ni migration exécutés.**
**Audits : `atoumweb-manager/main` et `atoumweb-bridge/feature/workbench-occurrence-v1@d1ecf89`, consultés le 09/10/2026.**
Dossiers : [07A audit](LOT-07A-INVENTAIRE-PROJETS-CAPACITES.md), [07B Projet](LOT-07B-FICHE-PROJET-PRODUCTION.md), [07C Blueprint](LOT-07C-BLUEPRINTS-DOSSIER-COMMERCIAL.md), [07D Pages](LOT-07D-SITES-PAGES-COMPOSITION.md), [07E Bibliothèque](LOT-07E-BIBLIOTHEQUE-REUTILISATION.md), [07F Bridge](LOT-07F-BRIDGE-WORKBENCH-PUBLICATION.md), [07P pré-signature](LOT-07-PROJET-PRE-SIGNATURE.md).

## 1. Règles de non-régression prioritaires
1. **Devis courant, Projet unique** : le Projet prévisionnel créé volontairement depuis le Devis non signé conserve un **dossier commercial unique** ; l'acceptation réelle dans Abby fige **le bon Projet de la révision courante**, sans doublon.
2. **Préparer ≠ accepter** : pas de conversion Client, vente, facture, abonnement actif, opération de maintenance ni publication WordPress lors de la préparation du Projet.
3. **Changer le Devis** : choix explicite **Adapter l'ancien Projet** ou **Repartir de zéro**, avec aperçu/confirmation, absence de perte silencieuse de temps, ressources, secrets, compositions, pages ou exports Bridge.
4. **Blueprint idempotent** : mêmes Sites/Pages/nœuds après rejeu quand le modèle applicable le permet ; pas de reset d'éléments humains. La référence vitrine **1 Site + 5 Pages** est un cas **conditionnel à l'offre/blueprint retenu**.
5. **Destination explicite** : projet/site/page exacts, compatibilités d'addon et version du Devis/composant ; pas de Site forcé depuis une suggestion non achetée.
6. **Composition locale et Bibliothèque** : même source immutable, occurrences distinctes, modifications locales et Undo/Redo **composant seulement** ; la Bibliothèque globale n'est enrichie qu'après validation humaine volontaire.
7. **Bridge Workbench-first** : package Page V2 exporté localement, import idempotent par `exportId`/empreinte, Workbench Divi brouillon, provenance et `siteOccurrenceId` conservés ; pas de publication automatique en 0.8.1.
8. **Snapshots partiels** : aucun diff partiel ne justifie à lui seul suppression WP ou remplacement de contenu Manager.
9. **UX-01** : brouillon de Site/Page/composant/tâche/bibliothèque préservé lors d'une sortie/fermeture/rafraîchissement ; intégrer le registre de #83 **seulement s'il est réellement fusionné**, sans double mécanisme.
10. **Validation-MSI** : hors de toute recette, duplication de chantier, test de migration ou export ; bases et fichiers synthétiques isolés, aucune intervention sur sites WordPress de Clients réels.
11. **E72 + E153** : le conflit `QuoteService.create` faisant progresser `new` à `quote_to_prepare` reste à corriger au backend avant de prétendre le pipeline conforme ; la préparation de Projet ne contourne pas cette décision.

## 2. Architecture d'implémentation future — PR indépendantes si nécessaire
| Phase | Objectif | Garde de sortie |
|---|---|---|
| **07.0 — Audit HEAD réel** | Lire `main` après PR #84 fusionnée et toute intégration approuvée #81/#83 ; vérifier IPC/services/migrations, SHAs et dépendances Bridge | Matrice `interface → action → IPC → service → données/état → test`; état des capacités WP authentifié |
| **07.1 — Projet et navigation 07B** | Fiche, filtres, contexte, parcours Devis et chrono global | Aucun raccourci produisant Client/prod sans acceptation |
| **07.2 — Blueprints/provisoire 07C** | Aperçu/Idempotence, multi-contributions, comparaison des Devis, **remplacement atomique du pré-Projet** avec sauvegardes et refus des suppressions dangereuses | Tests de rollback avec temps/Ressources/Pages/Workbench, un seul Projet courant |
| **07.3 — Composition 07D** | Réutiliser Sites/Pages, édition HTML/CSS/JS, couleur/aperçu, Undo/Redo local, garde UX-01 et éventuel historique global séparé | Jamais modifier Bibliothèque source ou écraser Page dirty sans consentement |
| **07.4 — Réutilisation 07E** | Copie technique Projet → adaptation humaine → brique globale → occurrence Page | Provenance complète et aucune fuite de secrets/médias tiers |
| **07.5 — Bridge 07F** | Export/retour Workbench et observation, états de capacités ; **pas publication WP dans la V2 sans sous-chantier explicite dédié** | Export non accepté sans destination, Workbench idempotent, snapshots incomplets honnêtement signalés |
| **07.6 — Recette** | Typecheck/tests ciblés et complets sur SHA exact, tests d'intégrité, UI 3 thèmes × 3 densités, captures et revue humaine | Rapport précis + accord de fusion distinct |

**La publication WP et le registre CSS/JS communs** sont des sous-chantiers techniques de plus haut risque, soumis à spécification propre, environnement de démonstration WP et autorisation séparée avant toute mise en production.

## 3. Matrice de recette transversale (27 scénarios FUTURS)
| ID | Scénario | Attendu |
|---|---|---|
| R07G-01 | Prospect `new` et création d'un Devis | Respect E72 après correction E153 |
| R07G-02 | Préparer Projet depuis Devis draft non signé | Un Projet `provisional`, Client non créé |
| R07G-03 | Préparer Projet depuis Devis déjà envoyé | Toujours préparation interne, pas acceptation |
| R07G-04 | Rejouer préparation même révision | Même Projet ID, pas de duplication |
| R07G-05 | Prévisualiser puis réviser Devis avant confirmation | Hash périmé refusé |
| R07G-06 | Appliquer blueprint vitrine applicable | 1 Site / 5 Pages attendus, provenance correcte |
| R07G-07 | Réappliquer blueprint après modification humaine | Pas de doublon ni perte |
| R07G-08 | Offre+option réellement achetée | Contributions correctes, suggestion ignorée hors Projet |
| R07G-09 | Multi-sites/addon sans destination compatible | Refus + possibilité de choix explicite |
| R07G-10 | Réviser Devis avec Page déjà travaillée | Conflit visible, Page/temps/fichiers conservés |
| R07G-11 | Adapter Projet au nouveau Devis | Même projet et provenance ajustée |
| R07G-12 | Repartir de zéro sur Projet vierge | Nouveau Projet courant atomiquement lié |
| R07G-13 | Repartir de zéro sur Projet travaillé | Archive/retrait sécurisé de l'ancien, aucune suppression physique non éligible |
| R07G-14 | Simulation de panne pendant remplacement | Rollback et absence de deux Projets actifs |
| R07G-15 | Accepter ancienne révision | Refus, Projet courant non activé |
| R07G-16 | Accepter Devis courant résolu | Projet courant figé, Client exact, opérations contrôlées |
| R07G-17 | Démarrer/pause chrono sur Page | Timer global unique, bonne Page et cumul |
| R07G-18 | Ajuster HTML/CSS/JS local et Undo/Redo | Édition du composant restaurée, source globale inchangée |
| R07G-19 | Fermer composant dirty par clic extérieur/Escape | Garde UX-01, saisie préservée |
| R07G-20 | Créer variante globale depuis source Projet | Copie indépendante, revue, provenance et assets contrôlés |
| R07G-21 | Exporter Page sans Site/composition | Refus au service |
| R07G-22 | Exporter Page avec trois composants | Package `awexp:` exact et versions ordonnées |
| R07G-23 | Importer/rejouer Workbench Bridge | Brouillon unique, identité des occurrences stable |
| R07G-24 | Importer `exportId` collision hash | Refus sans altération du Workbench |
| R07G-25 | Importer snapshot partiel et chercher diff | Aucune suppression automatique |
| R07G-26 | Publication non disponible en Bridge 0.8.1 | Aucune action réelle de publication/rollback prétendue |
| R07G-27 | Recette thèmes×densités, clavier, SQLite, WP de démo | Rapport SHA/états exacts, ni Validation-MSI ni site Client touchés |

## 4. Dossier de preuves de chaque future PR de code
- Liste des branches, SHA de base, commit testé, migrations ajoutées et rapport `git diff` ; ne pas confondre les résultats CI de #84 avec ceux du Lot 07.
- Schéma des identités : `commercialDossierId / sourceQuoteId / acceptedQuoteId / projectId / projectSiteId / projectNodeId / compositionId / compositionItemId / exportId / workbenchPostId / siteOccurrenceId`.
- Rejouabilité des actions et protections transactionnelles SQLite sur bases fictives, captation des sauvegardes/fichiers temporaires.
- Screenshots/contrôles 3 thèmes × 3 densités, petite fenêtre, sélecteurs/accessibilité, navigation Devis↔Projet↔Page et timer global.
- Rapport Bridge séparé : branche/version installée, authentification et capacités réelles, Workbench WP brouillon, témoins du diff, scan incomplet et manque de publication.
- Revue d'impact **des suppressions et remplacements** et conservation des composants/ressources, sans écrasement de versions de bibliothèques ou de pages WordPress réelles.

## 5. Questions de développement encore ouvertes
- **E216** : couverture effective des états/protections des nouveaux onglets et du registre dirty après intégrations #81/#83.
- **E217** : stratégie transactionnelle de remplacement de Projet, migrations et relations WordPress/Bridge.
- **E218** : versionnement d'Undo global composition et restauration de snapshots en cas d'export déjà réalisé.
- **E219** : état de présence/absence du Workbench et validation du retour WordPress dans l'interface Manager.
- **E220** : essais Divi 4/Divi 5 et intégrité CSS/JS médias, différence aperçu Manager/Visual Builder.
- **E221** : bornes exactes de la future publication contrôlée, rollback et journal du CSS/JS.

**Statut : les dossiers 07A–07G et 07P sont une base de conception. Aucun de leurs tests de recette n'est exécuté et aucune publication, suppression, régénération ou fusion n'a lieu par ce document.**

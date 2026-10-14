# Lot 01C — Fiches rapides, agrandissement et panneaux redimensionnables

**État : cahier des charges de conception, non implémenté.**  
**Code inspecté : `main@eb252d5cbd0e95137eafa2b4759fcbcfd7263eda` (inspection statique ciblée), et bilan UX-01 de la PR #83 (`5b38cbe` lors de la revue).**  
**Dépendances :** [Lot 01](LOT-01-FONDATIONS.md), [matrice existant → cible](LOT-01-MATRICE-EXISTANT-CIBLE.md), [Lot 01A](LOT-01A-TOKENS-VISUELS.md), [Lot 01B](LOT-01B-COMPOSANTS-ELEMENTAIRES.md), [Décisions](DECISIONS.md).

## 1. Objectif décidé
Rendre cohérents les parcours **liste → fiche rapide → Agrandir → fiche complète → retour**, avec une séparation ajustable et une **mémorisation automatique des seules préférences de présentation**.

**Décisions de produit déjà validées par AtoumWeb :**
- Un premier clic sur un dossier ouvre sa **fiche rapide**.
- La commande **Agrandir** ouvre la vue complète **sans perdre objet, onglet, contexte ou brouillon**.
- Le schéma habituel est **liste à gauche / détail à droite** ; chaque module garde la liberté d'un atelier spécialisé (CGV, compositions Page, opérations).
- La disposition est réglable, le séparateur utilisable souris **et** clavier ; une action restaure le défaut.
- La disposition est enregistrée automatiquement, **indépendamment** des données métier, et restaurée à la réouverture.
- La fermeture, un changement d'objet et les opérations de lifecycle respectent les protections **UX-01** selon les modules effectivement raccordés ; aucune perte silencieuse de saisie n'est admise comme cible V2.

**Ce sous-lot développe d'abord des composants génériques et un pilote isolé.** Les migrations des écrans métier interviennent ensuite dans leurs lots respectifs (Prospection/Clients Lot 03, Catalogue Lot 04, Devis Lot 06, Projets Lot 07, Interventions Lot 08).

## 2. Cartographie actuelle vérifiée — ne pas recréer à l'identique
| Module et source | Comportement repéré dans le code de référence | Limite / stratégie |
|---|---|---|
| **Prospection** `src/renderer/crm/ProspectsPageV2.tsx` | `selectedId`, `deskModeId`, `expandedId` ; fiche latérale `ProspectDetailV2`, mode `panel` ; `prospectSplitPercent=66`, séparateur `role=separator` accessible par flèches, double-clic reset 66, limites de largeur. | Réutiliser le schéma de fiche rapide / desk et gestes ; état en mémoire non prouvé durable, fermeture extérieure historiquement risquée. Revoir sur branche intégrée #83 avant adaptation. |
| **Clients** `src/renderer/crm/ClientsPage.tsx` | `selectedId`, `largeView`, `activeTab`, `clientSplitPercent=68` ; séparateur clavier/flèches, double-clic reset 68 ; agrandir via `OperationIcon`. | `openClient` remet `activeTab` à `summary` et ferme plusieurs éditeurs lors du passage de dossier : valider préservation pertinente du contexte et brouillons. **Pas de garde universelle livrée ici par #83.** |
| **Catalogue** `src/renderer/commercial/CatalogPage.tsx` | `selectedId`, `detailExpanded`, `detailSplitPercent=40`; séparateur manipulé au pointeur, valeurs 18–68 %, retour `openItem` et `closeDetail`. | Harmoniser le clavier/double-clic reset et futures préférences ; protéger brouillons/version publiable lors de changement de fiche, sans nouvelle politique métier. |
| **Devis** `src/renderer/commercial/QuotesPage.tsx` | `detail`, `detailExpanded` ; panneau `quote-detail-panel` avec backdrop ; `closeQuoteDetail` ; navigation entre cibles; preview client distinct. | **Pas de séparateur de liste attesté** : ne pas en inventer au départ. Garde UX-01 #83 à conserver ; agrandir/fermer ne doit pas reconstruire les éditeurs. |
| **Projets** `src/renderer/projects/ProjectsPage.tsx` | `detailTab`, `selectedNodeId`, phases ; séparateur **interne à la production** `productionSplitPercent=40` (18–68 %) ; différentes couches de projet. | Ne pas transformer la composition en simple fiche latérale. `openProject` réinitialise certains états et définit `detailTab='plan'` : vérifier ce qui relève d'une ouverture nouvelle vs retour à contexte. Sécurité UX-01 encore à étendre. |
| **Demandes / Interventions** `src/renderer/operations/OperationsPage.tsx` | États séparés `requestSplitPercent=38`, `interventionSplitPercent=34`, vues agrandies distinctes ; handlers de resize souris, séparateurs accessibles au clavier, reset par double-clic. | Conserver deux espaces de travail indépendants. Ne pas confondre bascule de l'onglet, fin d'intervention et fermeture d'une fiche. Pas de protection universelle des brouillons #83. |
| **CSS** `src/renderer/prospect-detail.css`, `detail-layout-overrides.css`, `client-detail.css`, `commercial.css`, `projects.css` et CSS Opérations | Breakpoints, `min-width`, listes/overlays, `overflow`, positions sticky, plusieurs surcharges. | Examiner cascade et petites fenêtres avant de déployer un `ResizableSplitView` ; éviter le débordement latéral ou la disparition du détail. |

**Niveau de preuve :** constat sur le code de référence et audit statique. Aucune campagne visuelle, mesure de largeur réelle ou simulation native n'a été exécutée à la rédaction de ce document. Les pourcentages ci-dessus sont des **défauts internes existants**, non des valeurs globales imposées en V2.

## 3. Contrat UX des vues

### 3.1. Liste et sélection
- Clic sur une entrée → sélection visible + fiche rapide du **bon identifiant**, avec titre/statut/actions pertinents.
- La liste reste disponible lorsque la fenêtre est assez large et doit garder ses tris, filtres, recherche et position de scroll dans un passage fiche rapide ↔ complète, si possible sans reconstruire toute la page.
- Clic sur une autre entrée avec brouillon actif → **garde de sortie**, puis navigation seulement si autorisée. Ne jamais faire une mutation métier en réaction au seul déplacement de sélection.
- L'absence de résultats et le chargement partiel doivent être représentés sans fermer un éditeur contenant des saisies.

### 3.2. Fiche rapide
- Le panneau utilise la place disponible ; affiche identité, statut, actions utiles et informations essentielles ; le reste devient accessible via onglets, accordéons ou agrandissement.
- Titre de la fiche et actions `Agrandir` / `Fermer` visibles et accessibles ; ne pas remplacer un libellé critique par une icône inconnue.
- Aucun second mécanisme d'enregistrement : chaque sous-éditeur reste propriétaire de ses brouillons, validations et services.

### 3.3. Agrandissement et retour
- `Agrandir` ne crée **ni nouveau dossier ni nouvelle version métier**.
- L'objet, l'onglet, les données saisies, le sous-formulaire actif, et les alertes de validation demeurent identiques. **Changement de présentation ≠ action destructive** : aucune demande d'abandon ne doit apparaître lors d'un agrandissement qui conserve l'éditeur.
- `Réduire` doit revenir au panneau sans perdre les données ; si le changement nécessitait réellement le démontage d'un éditeur, conserver son état ou déclencher la garde UX-01 **avant** démontage (mais privilégier le maintien monté).
- Les vues dites `fullscreen`, `dialog`, `overlay` doivent disposer d'une gestion focus correcte et d'un retour explicite, sans contredire leur sémantique ARIA.
- Échap : ferme une vue **uniquement si la sortie est sûre** ; avec brouillon non enregistré, garde et choix sûr par défaut. Ne pas confondre réduction non destructive et fermeture destructive.

### 3.4. Séparateurs / resize
- `role=separator`, orientation et intitulé explicites, focus visible ; touches fléchées modifient la largeur et restent bornées par dimensions minimales réelles des panneaux.
- Souris/tactile/pointeur selon support actuel ; double-clic ou commande dédiée **Réinitialiser les largeurs**.
- Clavier : indiquer la valeur actuelle/accessibilité du séparateur (par ex. `aria-valuenow`, `aria-valuemin/max` **si ce sont des séparateurs de réglage** et conforme aux pratiques d'accessibilité), comportement borné.
- Éviter la persistance à chaque `pointermove` : l'état peut bouger en mémoire, mais une écriture de préférence doit être **déclenchée/agrégée** à la fin du geste, ou de manière raisonnablement limitée.
- Quand la fenêtre est étroite, comportement de repli fonctionnel (stack, overlay ou liste masquée provisoirement) sans masquer les actions critiques ; garder une entrée facile pour revenir à la liste.

## 4. Persistance des dispositions — décision validée, implémentation encore à qualifier
À mémoriser **par module et par vue**, avec valeurs par défaut spécifiques (ex. Prospection ≠ Interventions) :
- largeur relative ou logique des panneaux ;
- panneau replié ou affiché quand ce réglage relève bien d'une préférence de vue ;
- mode liste/détail/agrandi **uniquement si sa restauration n'ouvre pas un dossier hors contexte** ;
- état de configuration de la vue (géré avec Lot 01D : colonnes, tri, filtres).

**Ne jamais enregistrer dans les préférences** le texte d'un champ, le contenu d'une note non sauvée, un mot de passe, des accès Projet, des snapshots contractuels ou un changement de statut métier.

À définir techniquement avant écriture : portée poste / utilisateur / workspace, clé stable `module/vue/version` conceptuelle, valeurs valides après renommage de modules, reset et migration des préférences, gestion des fenêtres détachées et erreurs de sauvegarde des réglages. Ces décisions **ne bloquent pas la documentation**, mais sont indispensables avant d'implémenter 01C.

### Exemple de comportement attendu
1. Prospection : déplacer le séparateur à la largeur souhaitée.
2. Ouvrir un Prospect, agrandir, travailler dans un onglet, réduire.
3. Quitter puis rouvrir Prospection : largeur précédente retrouvée.
4. Changer le thème/la densité : largeur ajustée aux min-width et au viewport, sans sortir du cadre.
5. Réinitialiser : retour au défaut Prospection ; largeur Interventions inchangée.

## 5. Compatibilité UX-01 : risques à ne pas reproduire
La branche corrective #83 (commits A/B/C + revue `5b38cbe`) couvre surtout **Prospection, Devis et Référence Prospect** ; ne pas supposer que les fiches Clients, Catalogue, Projets et Opérations sont protégées.

- **Prospection** : conserver les sections déjà ouvertes *montées* quand elles sont réduites ; la revue #83 corrige un effacement de brouillon lors de cette réduction. Ajouter au registre de test.
- **Devis** : suppression d'une ligne et archivage Prospect doivent demander autorisation avant mutation ; réduction/agrandissement ne peut pas contourner les gardes.
- Les réinitialisations par `key={...}`, remounts conditionnels, overlay/backdrop, pointerdown global ou refresh async constituent des points de risque : identifier les destructeurs réels, puis appliquer la garde commune sur les sorties destructives.
- **01C ne développe pas** la fonction `Enregistrer et quitter` de la V2 (prévue Lot 01E) ; pas de deuxième registre de saisie.
- Aucune récupération après crash/arrêt forcé ni autosave de brouillon implicite.

## 6. Ordre de réalisation après autorisation
| Étape | Travail | Livrable |
|---|---|---|
| **01C.1** Inventaire | Recenser panneaux, agrandissements, overlay/backdrop, séparateurs, événements de fermeture et domaines UX-01 pour les écrans pilotes | Matrice `composant actuel → commande → état local → garde → CSS → test` |
| **01C.2** Contrat commun | Spécifier `QuickDetailPane`, `ExpandedRecordView`, `ResizableSplitView` **comme noms de conception** (pas classes existantes) | Interfaces de présentation et invariants d'identité/draft |
| **01C.3** Atelier isolé | Exemples avec données fictives de sélection, largeur, agrandissement, retour, vues étroites | Banc démonstration sans écriture métier |
| **01C.4** Persistences | Adapter le mécanisme de réglages existant à **des préférences visuelles seulement**, avec reset/migration | Schéma de préférences et tests multi-vues |
| **01C.5** Connexion UX-01 | Assurer non-destruction lors d'agrandissement/réduction ; intégrer les gardes aux véritables sorties du pilote | Tests dirty/pending/annulation et cycle fenêtre |
| **01C.6** Recette | Vérifier 3 thèmes × 3 densités, zoom, clavier, petits viewport et compatibilité CSS | Rapports visuels et non-régression, PR indépendante |

**Règle de migration :** 01C produit une base + un atelier. Les migrations Prospection/Clients/Catalogue/Devis/Projets/Opérations suivent leurs lots métier ; aucune réécriture massive de leurs panneaux pendant 01C.

## 7. Scénarios d'acceptation — aucun résultat prétendu
| ID | Action à exécuter | Résultat exigé |
|---|---|---|
| R01C-01 | Sélectionner un dossier dans la liste | Fiche rapide du bon dossier sans navigation métier parasite |
| R01C-02 | Agrandir, puis réduire | Même objet, onglet, scroll local pertinent, éditeur/brouillon conservés |
| R01C-03 | Modifier un champ et agrandir/réduire | Aucune perte de saisie ni fausse déclaration « enregistré » |
| R01C-04 | Avec brouillon, sélectionner un autre dossier | Garde de sortie ; « Rester » conserve champs et fiche ; abandon confirmé limité au domaine concerné |
| R01C-05 | Redimensionner à la souris et au clavier | Largeurs bornées, navigation/focus corrects, pas de colonne hors écran |
| R01C-06 | Double-clic reset / commande Réinitialiser | Retrouve le défaut du module, pas celui d'un autre |
| R01C-07 | Quitter et revenir après redimensionnement | Largeur restaurée ; enregistrement des préférences visuelles, pas du champ métier |
| R01C-08 | Passer Compact/Confort/Confort+ dans trois thèmes | Compact texte principal **14 px cible**, Confort 16, Confort+ 18 ; panneaux sans coupure d'action |
| R01C-09 | Fenêtre de taille réduite + zoom | Passage à un mode de repli accessible, aucune action métier cachée |
| R01C-10 | Fermer avec brouillon et pending | Blocage ou garde conforme UX-01 ; pas de DB fermée sur annulation |
| R01C-11 | Cliquer hors fiche / utiliser Échap | Aucune destruction de brouillon sans confirmation sur les pilotes effectivement raccordés |
| R01C-12 | Réduire une section Prospect avec brouillon | Saisie préservée, scénario correctif #83 conservé |
| R01C-13 | Supprimer une ligne Devis pendant un autre brouillon | Aucune mutation avant confirmation ; brouillon voisin préservé, correctif #83 |
| R01C-14 | Naviguer vers Clients, Catalogue, Projets, Opérations | Pas de régression des vues existantes tant qu'elles ne sont pas migrées |
| R01C-15 | Réinitialiser les préférences et relancer | État visuel par défaut stable, aucune suppression de données métier |
| R01C-16 | Changer d'objet pendant un chargement asynchrone | Résultat obsolète ne remplace pas la nouvelle fiche ni son brouillon |

## 8. Questions d'implémentation à instruire, sans contredire les choix validés
- **E08 — Portée de la persistance** : poste, workspace ou profil utilisateur ; examiner les `settings` et l'emplacement de stockage actuels avant de proposer.
- **E09 — Format de fiche complète** : garder les représentations existantes (desk, overlay, panneau élargi) ou converger uniquement après comparaison ; exigence commune de comportement, pas uniformité d'animation/DOM imposée.
- **E10 — Contraintes minimales/ARIA** : valeurs de largeur et sémantique des séparateurs à déterminer en fonction de chaque fenêtre ; auditer comportement petit écran.
- **E11 — Remount des modules hors #83** : inspecter chaque domaine de saisie Clients/Catalogue/Projets/Opérations avant raccordement du garde.

Ces questions ne requièrent pas une décision immédiate d'AtoumWeb si l'inventaire technique suffit. **Demander arbitrage uniquement pour une différence visible majeure ou une nouvelle règle métier.**

## 9. Définition de terminé
- Correspondance des fonctions actuelles et des nouveaux composants publiée dans la PR d'implémentation.
- Tests et recette visuelle réussis sur environnement isolé, avec preuves datées et SHA ; 3 thèmes × 3 densités.
- Aucune perte de saisie, aucun retour involontaire à une autre fiche, aucune mutation métier par redimensionnement.
- Préférences restaurées et reset fonctionnel, indépendants des données.
- Scénarios UX-01 déjà protégés conservés ; les autres modules ne sont pas présentés comme couverts tant que non raccordés.
- Validation humaine avant merge, Validation-MSI jamais utilisée pour les tests.

**Le présent fichier ne constitue pas une livraison de fonctionnalités 01C.**

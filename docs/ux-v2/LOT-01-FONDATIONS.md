# Lot 01 — Fondations UX/UI V2

**Statut : spécification à exécuter après stabilisation UX-01 ; aucun développement autorisé par ce document.**  
**Décision AtoumWeb :** les composants communs précèdent la modernisation des modules. **Ne pas refaire les 17 modules dans ce lot.**

## 1. Objectif et portée
Créer un socle visuel et interactionnel réutilisable, accessible, testable, compatible avec la base actuelle. Coexistence UX existante et nouveaux composants pendant la migration.

### Contenu du lot
| Brique | Comportement cible | Référence |
|---|---|---|
| Design system | Typographie, couleurs, espacements, 3 thèmes, 3 densités | UX2-VIS-001/002 |
| Boutons et icônes | États identiques, noms accessibles, libellé pour action critique | DESIGN-SYSTEM |
| Fiches rapides | Premier clic ouvre détail contextuel, Agrandir ouvre la fiche complète | UX2-NAV-002 |
| Panneaux ajustables | Redimensionner, masquer, restaurer ; dimensions mémorisées | UX2-LAY-001/002 |
| Tableaux et listes | Colonnes, tri, filtres, recherche, vues et restauration des choix | UX2-LAY-002 |
| Formulaires | Indicateur non enregistré, protection sortie, conflits, erreur de sauvegarde | UX2-DATA-001..005 |
| Confirmations | Composant cohérent, choix sûr, destructive/métier explicite | UX2-DATA-003 |
| Aide contextuelle | `?`, survol court/prolongé, clic/clavier, préférences | UX2-HELP-001 |
| Préférences | Auto-enregistrement uniquement de la présentation, jamais de champs métier | UX2-LAY-003 |
| Notifications | Succès confirmé, erreur, avertissement, sans faux succès | DESIGN-SYSTEM |

## 2. Décisions techniques à respecter
1. **Inventorier et réutiliser avant de reconstruire** : composants/styles/helpers réels et leurs tests ; éviter la duplication.
2. **Séparer interface et métier** : les composants communs consomment les services existants ; aucune logique Devis/CGV/Projet/maintenance réimplémentée.
3. **Cohabitation progressive** : les anciens écrans restent utilisables ; migrations incrémentales, retours arrière possibles.
4. **Garde UX-01 unique** : attendre son intégration vérifiée, adapter l'API réelle plutôt que coder une deuxième garde concurrente.
5. **Persistance de disposition ≠ sauvegarde métier** ; ne jamais enregistrer les brouillons lors d'un simple déplacement de panneau.
6. **Aucune donnée réelle dans les démonstrations** : atelier UI isolé, fixtures synthétiques, sans accès à Validation-MSI.
7. **Contrôler la compatibilité** : fenêtres détachées, 3 thèmes × 3 densités, taille de fenêtre, clavier, focus, contrastes et anciennes CSS.
8. **Pas d'exigence technique de renommer/extraire tout le CSS d'un coup** ; choisir une stratégie de migration des tokens après inventaire.

## 3. Ordre de réalisation et livrables

### 01A — Tokens visuels
**Périmètre :** audit des styles existants ; palette de référence (#D62828, #F2B705, #1565C0, #198754), rôles sémantiques, variables de densité, typographie et espacements. Trois thèmes préservés.

**Livrables :** carte des styles/tokens actuels, échelle de tailles, matrice thèmes/densités, tokens centralisés si compatibles ; exemple de rendu isolé. Ne pas imposer un asset/logo tant que le symbole triangulaire définitif n'est pas validé.

**Acceptation :** aucun écran ancien rendu illisible, contrastes/focus testés, aucune suppression de thème/densité.

### 01B — Composants élémentaires
**Périmètre :** boutons, champs, listes déroulantes, labels, icônes, états chargement/désactivé/erreur, aide `?`, notifications et confirmation de base.

**Livrables :** inventaire avant/après, composants réutilisés/adaptés, documentation d'usage, atelier démo. Bouton critique = icône + texte, actions non ambiguës = icône seule avec nom accessible.

**Acceptation :** composants avec états clairs et navigation clavier ; l'aide contextuelle ne remplace jamais les garde-fous métier.

### 01C — Conteneurs et fiches
**Périmètre :** fiche rapide, bouton Agrandir, vue complète, panneaux séparateurs réglables, masquage et restauration.

**Livrables :** composants paramétrables + exemples sur données fictives ; APIs d'ouverture/fermeture conservant identité/onglet ; largeur persistante.

**Acceptation :** premier clic = fiche rapide, Agrandir = fiche complète ; pas de perte de brouillon en fermant un panneau ; aucun écrasement hors écran.

### 01D — Tableaux et vues personnalisées
**Périmètre :** recherche, tri, filtres, gestion des colonnes (ordre/largeur/visibilité), vue liste par défaut et vues enregistrées.

**Livrables :** table réutilisable, schéma de préférences/migration, restauration des réglages, commande réinitialiser. Catégories et noms en priorité sur références techniques dans sélecteurs métier.

**Acceptation :** disposition persistée sans modifier les données métier, préférences robustes face à colonnes renommées/disparues, résultats inchangés par le seul changement de vue.

### 01E — Formulaires et confirmations critiques
**Préalable bloquant :** bilan d'UX-01A/B/C intégré et ses tests, puis lecture des contrats réels de la garde commune.

**Périmètre :** indicateur modifié, conflits, protections de sorties ; confirmations de validation/archivage/suppression selon contexte.

**Livrables :** intégration du mécanisme UX-01, scénarios de navigation et erreurs. Trois actions **quand l'éditeur le permet** : Enregistrer et quitter / Continuer la modification (défaut) / Quitter sans enregistrer.

**Acceptation :** refus ou échec sauvegarde => pas de navigation ; modification du formulaire voisin conservée ; aucune seconde garde concurrente ; pas d'auto-publication.

### 01F — Préférences, démonstration et recette du socle
**Périmètre :** préférences de vue par module/écran, configuration aide, rendu commun, atelier isolé.

**Livrables :** documentation des composants et leurs limites, tests permanents, scénarios de recette, comparatif ancien/nouveau, démo hors données métier.

**Acceptation :** 3 thèmes × 3 densités ; clavier, fenêtres, états vides/chargement/erreur ; aucune régression fonctionnelle sur modules non modernisés ; retour arrière vérifié.

## 4. Recette transverse obligatoire
Pour chaque incrément : typecheck ; tests de services et UI ciblés ; suite complète ; test visuel/interaction dans 3 thèmes et 3 densités ; focus et Escape ; resizing/fenêtres secondaires lorsqu'applicable. Tests DB/migrations/FK sur fixtures isolées uniquement.

Critères de sécurité :
- Une modification de disposition ne publie aucune nouvelle offre/CGV et ne sauvegarde aucun champ.
- Un clic « Agrandir » conserve la fiche et son contexte.
- La fermeture d'un panneau avec données modifiées suit la garde existante.
- L'éditeur qui échoue à enregistrer reste ouvert.
- Les messages de succès ne sont affichés qu'après retour du service.
- Tous les points d'accès existants demeurent joignables pendant la migration.

## 5. Stratégie de commits et revue
Commits distincts pour 01A–01F, PR de travail indépendante de ce référentiel, sans fusion automatique. Chaque PR indique anciennes références composants, diff métier nul ou expliqué, screenshots ou recette visuelle, résultats chiffrés exacts et TODO restant.

## 6. Préparation nécessaire avant feu vert
- Confirmer le statut de PR #80/#81 et de la branche UX-01 (les tests annoncés ne suffisent pas à présumer le merge).
- Relever le code HEAD et inventorier les composants/thèmes/densités actuels, avec liens source.
- Confirmer si les tokens actuels admettent un mode contrasté et comment migrer les anciennes règles CSS sans collisions.
- Déterminer la portée effective de la persistance des préférences (poste, utilisateur, workspace) **sans modifier une décision métier**.
- Vérifier les capacités de fermeture d'Electron et du garde UX-01 pour « Enregistrer et quitter » ; ne pas feindre un enregistrement si le sous-formulaire ne peut pas le faire.

**Ce document est normatif sur les comportements validés et non sur les détails d'implémentation encore inconnus.**

## 7. État du préalable UX-01 — PR #83
Au 09/10/2026, Codex MSI a publié [UX-01 #83](https://github.com/atoumweb-prog/atoumweb-manager/pull/83) en **draft non fusionné**, commits `df1b6f3` (A), `80300a4` (B), `14d8f9c` (C). 75 tests ciblés, 733 tests complets à deux workers et 153 contrôles natifs sur trois thèmes ont été déclarés réussis dans la livraison ; le statut CI et la fusion restent à vérifier.

Conséquences pour 01E :
- Faire l'inventaire des APIs `draftSection`, `unsavedRegistry`, `unsavedWindows` et des hooks intégrés avant tout design.
- La V2 souhaite proposer **Enregistrer et quitter / Continuer / Quitter sans enregistrer**, mais le comportement livré dans #83 est une garde **Rester / Quitter sans enregistrer**. **Le bouton « Enregistrer et quitter » constitue une extension future**, uniquement pour les éditeurs capables de valider/sauver et après confirmation réelle ; ne pas déclarer qu'il existe déjà.
- Prospection, Devis et fenêtre Référence Prospect sont les seuls pilotes explicitement raccordés dans cette livraison. Étendre progressivement aux autres modules après recette, sans promettre la protection des 17 modules à ce stade.
- Absence de récupération après crash/arrêt forcé et d'autosave durable : hors livraison #83. Ne pas confondre ce mécanisme avec des sauvegardes métier.
- Réexaminer le lot avant son implémentation si #83 n'est pas fusionnée ou si une résolution de conflits est nécessaire avec #81.

## 8. Matrice source → cible et arbitrages avant développement
**Document de travail détaillé : [LOT-01-MATRICE-EXISTANT-CIBLE.md](LOT-01-MATRICE-EXISTANT-CIBLE.md).** La matrice associe chaque famille du Lot 01 aux fichiers et mécanismes existants, aux précautions d'intégration et aux tests d'acceptation.

Point **E01 à arbitrer** : le socle CSS actuel utilise 15/16/18px selon la densité et des hauteurs de contrôle 36/42/48px. Les anciennes cibles numériques 14–15px et 34–38px étaient **indicatives**, pas un ordre de réduction générale ; préserver les réglages existants en attendant validation.

L'exécution ne peut pas commencer uniquement sur la base de ce fichier : vérifier les HEAD des PR #80/#81/#83, réaliser la recette comparative et arrêter E01–E04 selon leur incidence réelle.

### Spécification du sous-lot 01A
[LOT-01A-TOKENS-VISUELS.md](LOT-01A-TOKENS-VISUELS.md) : ordre d'exécution exact, mapping des fichiers CSS existants, seuils de lisibilité et critères d'acceptation, sans autorisation de développement.

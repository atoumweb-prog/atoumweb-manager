# Phase 3 — Projets & Production


## Mise à jour Projet V2 — 22/09/2026

Le socle historique de cette phase reste valable pour les sources de vérité (projets, ressources, bibliothèque technique, timer), mais l'interface et la logique de production sont désormais prolongées par `feature/project-blueprints-v1` / PR #73.

Projet V2 ajoute notamment : blueprints liés au catalogue, snapshot de production, phases/étapes numérotées, glisser-déposer, atelier plein écran, séparation redimensionnable, timer de fiche, notes/actions, outils en fenêtre, validation de phase, aide contextuelle et coffre d'accès chiffré.

Pour l'état réel et les commandes de validation, utiliser `PROJECT_STATUS.md` et `docs/HANDOFF_CODEX_MSI.md`.

## Statut

Spécification préparée en avance. Le développement de cette phase ne doit commencer qu'après validation de la Phase 2 Commercial.

## 1. Objectif

Transformer un devis accepté en **projet réellement exploitable** dans AtoumWeb Manager, puis fournir le cœur de production quotidien :

- modèles de projets versionnés ;
- transformation Devis → Projet ;
- lots / étapes ;
- modules / pages ;
- tâches / sous-tâches ;
- prérequis client ;
- ressources projet ;
- bibliothèque technique projet ;
- timer global raccordé ;
- sessions de temps ;
- suivi prévu / réel ;
- critères de fin de projet.

Le projet devient le centre opérationnel entre le commercial et les futures phases Interventions / Maintenance / Facturation.

## 2. Principe majeur : le devis ne devient pas le projet

Le devis accepté reste un document commercial figé.

La transformation crée une nouvelle entité `project` qui référence :

- le devis source ;
- le client ;
- la version du modèle de projet utilisée ;
- les prestations réellement vendues ;
- les options ;
- la valeur commerciale ;
- le montant contractuel.

Modifier ensuite le devis, le catalogue ou le modèle ne doit jamais modifier rétroactivement le projet existant.

## 3. Modèles de projets

### 3.1 Identité stable

`project_templates` représente le type logique du modèle :

- Site vitrine ;
- E-commerce ;
- Landing page ;
- Application ;
- Logiciel ;
- Projet interne AtoumWeb ;
- autres types ajoutables dans Réglages.

### 3.2 Versions

Chaque évolution structurante crée une nouvelle `project_template_version`.

Exemple :

- Site vitrine v1 ;
- Site vitrine v2 ;
- Site vitrine v3.

Un projet créé avec v1 reste lié à v1 pour toujours.

### 3.3 Arbre standard

Une version de modèle contient des nœuds hiérarchiques :

`Lot → Module/Page → Tâche → Sous-tâche/Checklist`

Champs utiles :

- nom ;
- description ;
- type de nœud ;
- ordre ;
- temps estimé ;
- obligatoire ou non ;
- statut initial ;
- éventuellement catégorie de temps par défaut.

### 3.4 Modification

Une version publiée ne doit pas être éditée en place si elle a déjà servi à créer un projet.

Action attendue :

**Créer une nouvelle version à partir de celle-ci**.

## 4. Transformation Devis → Projet

### 4.1 Précondition

Le devis doit être :

- accepté ;
- rattaché à un client ;
- non encore transformé en projet.

### 4.2 Transaction unique

La transformation doit être transactionnelle et idempotente.

Si l'action est relancée, elle retourne le projet existant au lieu d'en créer un second.

### 4.3 Étapes de création

La transformation doit :

1. choisir/résoudre le modèle adapté au `project_type` ;
2. figer la version de modèle ;
3. créer `projects` ;
4. copier l'arbre du modèle vers `project_nodes` ;
5. créer `project_services` à partir des lignes du devis ;
6. ajouter les éventuelles tâches/options hors socle ;
7. créer les prérequis standards ;
8. créer l'arborescence physique Ressources projet ;
9. initialiser la Bibliothèque projet ;
10. journaliser la transformation ;
11. marquer le devis comme transformé ;
12. préparer les futurs éléments de facturation attendus sans créer de facture Abby.

### 4.4 Choix du modèle

Le système peut proposer automatiquement le modèle correspondant au type du devis, mais l'utilisateur peut choisir une autre version active avant validation de la transformation.

Le choix devient définitif une fois le projet créé.

## 5. Numérotation projet

Format par défaut :

`PRO-YYYY-001`

Utiliser `number_sequences`.

La numérotation est créée dans la même transaction que le projet.

## 6. Projet — données principales

La fiche projet contient au minimum :

- numéro ;
- nom ;
- client ;
- devis source ;
- type de projet ;
- version de modèle ;
- statut ;
- mode commercial ;
- date de début ;
- date cible ;
- progression ;
- valeur commerciale ;
- montant contractuel ;
- temps estimé ;
- temps réel ;
- prochaine action / point bloquant éventuel.

### 6.1 Modes commerciaux

Valeurs par défaut :

- normal ;
- remisé ;
- offert ;
- partenariat ;
- interne AtoumWeb.

Le mode ne change pas la mesure du temps réel ni la valeur commerciale.

## 7. Statuts projet

Valeurs par défaut proposées :

- À préparer ;
- En cours ;
- En attente client ;
- Bloqué ;
- À valider ;
- Terminé ;
- Archivé.

L'archivage est distinct de Terminé.

Les listes doivent rester configurables dans Réglages tout en conservant des valeurs système minimales nécessaires au fonctionnement.

## 8. Arbre projet réel

### 8.1 Types

- lot ;
- module ;
- page ;
- tâche ;
- sous-tâche ;
- checklist.

Le modèle de données peut conserver un ensemble technique réduit (`lot`, `module`, `task`, `checklist`) et un sous-type d'affichage si nécessaire. L'objectif est d'éviter une table différente par niveau.

### 8.2 Statuts tâche/module

Valeurs par défaut :

- À faire ;
- En cours ;
- En attente client ;
- Bloqué ;
- À valider ;
- Terminé.

### 8.3 Progression

La progression d'un projet/module est **calculée**, pas saisie manuellement par défaut.

Première règle V1 :

- tâches obligatoires terminées / tâches obligatoires totales ;
- les checklists peuvent contribuer si elles sont définies comme obligatoires ;
- les nœuds purement structurants ne comptent pas directement.

Une pondération par temps estimé pourra être ajoutée plus tard, sans bloquer la V1.

## 9. Temps estimé et temps réel

- estimé = somme des estimations des tâches/nœuds pertinents ;
- réel = somme des `time_sessions` liées ;
- écart = réel - estimé ;
- comparaison possible par module, projet et type de projet.

Le temps réel ne doit jamais être recopié dans `projects` ou `project_nodes` comme source indépendante.

## 10. Prérequis client

Table `project_prerequisites`.

Exemples pour un site :

- logo ;
- textes ;
- photos ;
- accès nom de domaine ;
- accès hébergement ;
- mentions légales ;
- choix couleurs ;
- validation arborescence.

Statuts proposés :

- À demander ;
- Demandé ;
- Reçu ;
- Incomplet ;
- Validé ;
- Non applicable.

Un projet peut commencer même avec des prérequis manquants ; le CRM signale les blocages mais ne doit pas imposer artificiellement un arrêt.

## 11. Arborescence physique Fichiers & Ressources

Lors de la création du projet, créer automatiquement :

```text
<Client>/<Projet>/Ressources/
├─ 01 Identité/
├─ 02 Textes/
├─ 03 Images & médias/
├─ 04 Documents projet/
├─ 05 Technique - Sources - Exports/
├─ 06 Livrables/
└─ 07 Archives/
```

Le chemin réel dépend du workspace configuré.

### 11.1 Règle de stockage

- les fichiers restent sur disque ;
- SQLite contient les références et métadonnées ;
- pas de duplication physique pour lier le même fichier à plusieurs tâches ;
- si un fichier est déplacé/manquant, le CRM doit pouvoir afficher un statut `introuvable` et permettre de le relocaliser.

### 11.2 États ressources

- Reçu ;
- À traiter ;
- En cours ;
- Validé ;
- Obsolète.

## 12. Textes et versions de ressources

Pour les textes reçus/retravaillés, l'interface doit permettre d'identifier clairement :

- fourni par le client ;
- réécriture AtoumWeb ;
- version finale validée.

La V1 n'a pas besoin de devenir un traitement de texte complet : le CRM référence les fichiers/versions et les rattache au bon projet/page/tâche.

## 13. Bibliothèque projet

Chaque projet possède une Bibliothèque technique propre.

Elle décrit/référence ce qui est réellement utilisé :

- Header ;
- Footer ;
- Hero ;
- pages ;
- sections ;
- CSS ;
- JavaScript ;
- PHP/snippets ;
- ACF ;
- exports Divi ;
- WooCommerce ;
- extensions spécifiques ;
- notes techniques.

### 13.1 Indépendance

La Bibliothèque projet représente le réel du client.

Elle ne doit pas suivre automatiquement les modifications d'un futur module générique AtoumWeb.

### 13.2 Versions

Un `technical_item` peut avoir plusieurs `technical_item_versions`.

Une version peut être marquée :

- stable ;
- actuelle ;
- historique.

Le code est affiché comme texte avec coloration syntaxique ; aucune exécution automatique.

### 13.3 Préparation pour réutilisation

Action UI future :

**Préparer pour réutilisation** / **Exporter pour adaptation**.

Cette action ne transforme pas automatiquement le code en module générique. Elle rassemble/exporte les éléments à fournir pour adaptation manuelle/assistée vers la Bibliothèque AtoumWeb.

## 14. Timer global raccordé aux projets

Le widget déjà présent dans le shell devient fonctionnel.

### 14.1 Contexte

`Client > Projet > Lot/Module > Tâche/activité`

Une session peut aussi être rattachée directement au projet si aucun niveau plus fin n'est pertinent.

### 14.2 Règles

- une seule session active globalement ;
- démarrer une nouvelle session clôt l'ancienne après confirmation légère ou comportement configurable ;
- Pause/Reprise persistées ;
- navigation sans arrêt ;
- fermeture de l'application : la session reste techniquement active et est détectée au prochain démarrage ;
- au redémarrage, proposer : reprendre / arrêter à l'heure de fermeture connue / corriger manuellement ;
- saisie manuelle possible ;
- modification d'une session historisable si nécessaire.

### 14.3 Catégories temps

Valeurs par défaut :

- Production ;
- Développement ;
- Design ;
- Réunion ;
- Support ;
- Correction client ;
- Correction interne ;
- Recherche / formation ;
- Administratif ;
- Autre.

## 15. Session de temps

Source unique : `time_sessions`.

Champs fonctionnels :

- client ;
- projet ;
- nœud projet ;
- future intervention éventuelle ;
- catégorie ;
- début ;
- fin ;
- durée ;
- facturable oui/non ;
- source timer/manuelle/import ;
- note.

La durée finale est recalculée depuis début/fin/pauses ; elle ne doit pas devenir incohérente avec les timestamps.

## 16. Gestion des temps — première version

Même si le module complet de statistiques temps sera enrichi plus tard, Phase 3 doit déjà fournir :

- Aujourd'hui ;
- Cette semaine ;
- Ce mois ;
- filtre client ;
- filtre projet ;
- filtre catégorie ;
- total ;
- facturable / non facturable ;
- édition d'une session ;
- ajout manuel ;
- comparaison estimé/réel sur le projet.

Aucune table de total séparée.

## 17. Projet interne AtoumWeb

Le système doit permettre un projet sans client externe.

Exemples :

- AtoumWeb Manager ;
- refonte du site AtoumWeb ;
- création d'un module réutilisable ;
- veille/formation structurée.

Règle : `client_account_id` peut être nullable uniquement pour un projet `internal`.

Le projet interne utilise néanmoins le même arbre, timer, ressources et historique.

## 18. Projet Cazor — cas de validation de référence

La Phase 3 doit pouvoir représenter proprement un projet du type :

### Projet

**Cazor Auto Passion — Site WordPress**

### Lot 1 — Structure

- Header ;
- Footer ;
- Navigation ;
- Responsive.

### Lot 2 — Pages

- Accueil ;
- Detailing ;
- Vente accompagnée ;
- Recherche personnalisée ;
- Nos ventes ;
- Véhicules à vendre ;
- À propos ;
- Contact ;
- Mentions légales ;
- Confidentialité.

### Lot 3 — Données / contenu

- import véhicules ;
- fiches ;
- photos ;
- ACF.

### Lot 4 — Développement spécifique

- CPT ;
- ACF ;
- galerie/lightbox ;
- pagination/recherche ;
- logique vendu ;
- snippets/extensions spécifiques.

Ce cas doit permettre : temps par lot/module, ressources, snippets réels, progression et mode commercial partenariat/offert sans perdre la valeur commerciale.

## 19. Vue liste Projets

Colonnes par défaut :

- numéro ;
- client ;
- nom ;
- type ;
- statut ;
- progression ;
- temps réel / estimé ;
- date cible ;
- prochaine alerte éventuelle.

Filtres :

- actif / terminé / archivé ;
- client ;
- type ;
- statut ;
- mode commercial.

## 20. Fiche Projet

Onglets proposés :

1. Résumé
2. Plan / Tâches
3. Ressources
4. Bibliothèque projet
5. Temps
6. Commercial
7. Documents
8. Sauvegardes
9. Historique

Certains onglets peuvent d'abord afficher des états vides en attendant leurs phases dédiées, mais leurs données ne doivent pas être dupliquées.

## 21. Résumé Projet

Afficher au minimum :

- progression ;
- tâches en retard ;
- prérequis manquants ;
- temps estimé / réel ;
- valeur commerciale ;
- montant contractuel ;
- prochaines tâches ;
- activité récente ;
- éventuel solde/facturation à venir lorsqu'il sera disponible.

## 22. Actions rapides Projet

- démarrer le timer ;
- ajouter une tâche ;
- ajouter un prérequis ;
- ouvrir le dossier Ressources ;
- ajouter une ressource ;
- ajouter un élément technique ;
- créer une sauvegarde métier/référence plus tard ;
- marquer Terminé ;
- archiver.

## 23. Fin de projet

Passer un projet à `Terminé` ne doit pas être bloqué artificiellement.

Le CRM affiche une checklist d'alerte :

- tâches obligatoires terminées ?
- prérequis restants ?
- sauvegarde finale enregistrée ?
- livrables présents ?
- solde à facturer ?
- formation réalisée ?
- maintenance proposée/activée ?
- éléments techniques intéressants à préparer pour Bibliothèque AtoumWeb ?

L'utilisateur peut confirmer malgré les avertissements.

## 24. Archivage

Terminé ≠ Archivé.

Un projet terminé reste visible dans les historiques/statistiques.

Archiver masque le projet des vues opérationnelles mais conserve :

- temps ;
- ressources ;
- bibliothèque ;
- documents ;
- valeur ;
- historique.

Réactivation possible si nécessaire.

## 25. Journal d'activité Phase 3

Événements métier utiles :

- projet créé depuis devis ;
- statut projet changé ;
- tâche importante terminée ;
- prérequis reçu/validé ;
- ressource ajoutée/validée ;
- version technique marquée stable ;
- timer démarré/arrêté uniquement si utile au journal détaillé, sans polluer la timeline principale ;
- projet terminé ;
- projet archivé/réactivé.

## 26. Recherche globale Phase 3

Ajouter à l'index :

- projets ;
- noms de lots/modules/tâches pertinents ;
- noms/métadonnées de ressources ;
- éléments de Bibliothèque projet.

Résultats groupés et ouverture directe du bon projet/onglet si possible.

## 27. Contraintes d'intégrité

À garantir au niveau service + DB quand possible :

- un devis accepté ne crée qu'un projet ;
- un projet externe a toujours un client ;
- une version de modèle utilisée ne peut être supprimée ;
- arbre projet sans boucle parent/enfant ;
- positions cohérentes entre frères ;
- une seule session timer active globalement ;
- une ressource projet appartient au projet/client cohérent ;
- un élément technique `scope=project` référence obligatoirement son projet ;
- pas de suppression destructive d'un projet ayant du temps ou des données historiques.

## 28. Tests obligatoires

### Modèles

- création d'un modèle ;
- création v2 à partir de v1 ;
- projet v1 inchangé après publication de v2.

### Transformation

- devis accepté → projet ;
- appel répété → même projet ;
- copie correcte des services ;
- génération du numéro ;
- arbre créé ;
- dossiers créés ;
- rollback complet si une étape échoue.

### Arbre

- ajout/déplacement/réorganisation ;
- statuts ;
- progression calculée ;
- estimations.

### Ressources

- création arborescence ;
- ajout référence ;
- fichier manquant ;
- relocalisation ;
- pas de duplication physique automatique.

### Timer

- une seule session active ;
- démarrage/stop ;
- pause/reprise ;
- navigation ;
- redémarrage avec session ouverte ;
- saisie manuelle ;
- calcul durées.

### Bibliothèque projet

- ajout item ;
- versions ;
- stable ;
- référence fichier ;
- aucune exécution du code.

### Projet

- terminaison avec avertissements ;
- archivage/réactivation ;
- projet interne sans client ;
- trois thèmes.

## 29. Découpage recommandé GitHub

- Phase 3 parent — Projets & Production
- 3A — Modèles de projets versionnés
- 3B — Transformation Devis → Projet
- 3C — Fiche Projet, arbre et prérequis
- 3D — Fichiers & Ressources projet
- 3E — Bibliothèque projet
- 3F — Timer global + sessions de temps
- 3G — Validation complète Phase 3

## 30. Critère final Phase 3

La phase est terminée lorsqu'un devis accepté peut devenir **une seule fois** un projet complet et immédiatement exploitable, que le travail peut être structuré et chronométré sans duplication de données, que les fichiers réels restent sur disque, et que l'historique du projet reste stable même lorsque les modèles AtoumWeb évoluent ensuite.

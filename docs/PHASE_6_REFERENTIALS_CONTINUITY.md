# Phase 6 — Référentiels & Continuité

## 1. Objectif

La Phase 6 transforme AtoumWeb Manager en mémoire technique durable d’AtoumWeb et consolide la continuité opérationnelle.

Elle couvre :

- Bibliothèque AtoumWeb globale ;
- workflow de préparation d’un élément projet pour réutilisation ;
- visualisation/versionnement des composants techniques ;
- Sauvegardes métier des sites/projets clients ;
- emplacements serveur/local/disque externe/autre ;
- rappels de sauvegarde et versions stables ;
- Annuaire interne fournisseurs/partenaires/prestataires ;
- liens entre Annuaire, Dépenses, Projets et Services.

## 2. Dépendances

Cette phase s’appuie sur :

- Phase 1 : organisations / contacts / clients ;
- Phase 3 : projets, ressources et Bibliothèque projet ;
- Phase 4 : interventions/incidents et lien aux sauvegardes ;
- Phase 5 : dépenses, abonnements et fournisseurs ;
- `technical_items` / `technical_item_versions` / `technical_item_assets` ;
- `backup_records` / `backup_locations` ;
- `directory_entries` ;
- `file_assets` ;
- recherche globale et journal d’activité.

## 3. Bibliothèque AtoumWeb — rôle

La Bibliothèque AtoumWeb contient les briques **génériques réutilisables** d’AtoumWeb.

Elle ne doit pas devenir une copie automatique de chaque projet client.

Exemples de catégories :

- Headers ;
- Footers ;
- Heroes / Accueils ;
- Pages / modèles ;
- Sections / modules ;
- Formulaires ;
- Galeries ;
- Carrousels ;
- Navigation ;
- CSS ;
- JavaScript ;
- PHP / Snippets ;
- WooCommerce ;
- ACF / données dynamiques ;
- Divi / Theme Builder ;
- Applications / composants ;
- Notes techniques ;
- autres catégories configurables.

## 4. Bibliothèque projet vs Bibliothèque AtoumWeb

### Bibliothèque projet

- décrit ce qui est réellement utilisé chez le client ;
- peut contenir noms/classes/ACF/IDs/configurations spécifiques ;
- reste fidèle au projet ;
- ses versions ne sont pas modifiées automatiquement depuis la bibliothèque globale.

### Bibliothèque AtoumWeb

- contient une version générique réutilisable ;
- indépendante du projet source ;
- peut être adaptée à un futur client ;
- n’écrase jamais le composant du projet d’origine.

## 5. Workflow « Préparer pour réutilisation »

Action disponible depuis un `technical_item` de scope `project` :

**Préparer pour réutilisation / Exporter pour adaptation**

Le CRM ne généralise pas automatiquement le code ou le JSON.

Processus :

1. sélectionner la version projet source ;
2. rassembler code/JSON/assets/captures utiles ;
3. produire un paquet/dossier d’export de travail ;
4. enregistrer l’origine (`origin_technical_item_id`) ;
5. adaptation manuelle/assistée en dehors de la logique automatique du CRM ;
6. import/création volontaire d’un nouvel item scope `atoumweb` ;
7. vérifier les dépendances et paramètres ;
8. marquer `Prêt à réutiliser`, `À adapter` ou `Référence`.

## 6. Exemple Cazor

Source projet :

`Cazor — Galerie véhicules`

Peut être exportée avec :

- code PHP ;
- CSS ;
- JS ;
- JSON/ACF éventuel ;
- captures ;
- notes techniques.

Après adaptation assistée :

`AtoumWeb — Galerie dynamique ACF`

À retirer/paramétrer si nécessaire :

- classes spécifiques Cazor ;
- couleurs Cazor ;
- IDs ;
- shortcodes particuliers ;
- noms de champs ACF imposés ;
- URLs ;
- règles métier exclusivement Cazor.

Les deux éléments sont ensuite indépendants.

## 7. États de réutilisation

Valeurs :

- `ready` — Prêt à réutiliser ;
- `adapt` — Nécessite adaptation ;
- `reference` — Référence / exemple.

Des badges peuvent être affichés dans la bibliothèque.

## 8. Versionnement global

Chaque `technical_item` AtoumWeb possède des `technical_item_versions`.

Règles :

- création d’une nouvelle version pour une évolution significative ;
- possibilité de marquer une version stable ;
- historique conservé ;
- changement de version globale sans effet sur les projets existants ;
- lors d’une future utilisation dans un projet, le projet reçoit sa propre copie/version de travail ou une référence initiale qui devient indépendante après instanciation.

## 9. Visualisation technique

Utiliser Monaco Editor pour les formats texte/code.

Fonctions :

- coloration syntaxique ;
- numéros de lignes ;
- recherche ;
- copie ;
- agrandissement ;
- édition volontaire ;
- sauvegarde comme nouvelle version ;
- aucun bouton Exécuter.

Pour ACF/JSON :

- vue lisible structurée ;
- vue brute JSON.

Pour Divi/éléments visuels :

- capture/aperçu ;
- export source ;
- notes ;
- fichiers liés.

## 10. Filtres Bibliothèque AtoumWeb

Filtres :

- catégorie ;
- langage/type ;
- statut de réutilisation ;
- version stable ;
- tags ;
- origine projet éventuelle ;
- date de mise à jour.

Recherche globale sur : nom, description, tags, notes et contenu textuel indexable.

## 11. Import / export d’un composant

Le CRM doit permettre :

- exporter un item avec métadonnées et fichiers liés ;
- importer un paquet préparé ;
- éviter les doublons évidents ;
- demander s’il faut créer un nouvel item ou une nouvelle version.

Le format interne exact sera documenté lors de l’implémentation, idéalement ZIP + manifeste JSON.

## 12. Sauvegardes métier — rôle

Les sauvegardes métier concernent les sites/projets clients et leurs points de restauration.

Elles sont distinctes :

- des sauvegardes de la base AtoumWeb Manager elle-même ;
- des ressources projet ;
- de Git/GitHub.

## 13. `backup_records`

Un `backup_record` décrit un point de sauvegarde logique :

- client ;
- projet ;
- type ;
- date ;
- motif ;
- commentaire ;
- version fonctionnelle/stable oui/non ;
- intervention liée éventuellement ;
- événement pré-intervention éventuellement.

Types proposés :

- complète ;
- base de données ;
- fichiers/code ;
- export/configuration ;
- pré-intervention ;
- post-validation ;
- autre.

## 14. `backup_locations`

Une sauvegarde logique peut posséder plusieurs copies physiques.

Types :

- `server` — hébergeur/serveur ;
- `local` — PC/workspace ;
- `external` — disque externe/NAS ;
- `other`.

Chaque emplacement peut contenir :

- chemin/URL ;
- taille ;
- checksum si disponible ;
- date de vérification ;
- note.

## 15. Règle serveur ≠ local

Règle obligatoire :

> Une sauvegarde présente uniquement chez l’hébergeur ne doit jamais être affichée comme sauvegarde locale.

Exemple :

`Cazor — 13/09/2026 — avant intervention`

- Serveur : ✅
- Local : ❌
- Disque externe : ❌

Après téléchargement réel :

- Serveur : ✅
- Local : ✅ `D:\AtoumWeb\Sauvegardes\Cazor\...`

## 16. Vérification d’existence

Pour les emplacements locaux accessibles :

- vérifier que le fichier/dossier existe ;
- signaler « introuvable » si déplacé/supprimé ;
- permettre relocalisation.

Pour serveur/URL :

- V1 peut simplement conserver une date `verified_at` et une confirmation manuelle ;
- ne pas prétendre vérifier automatiquement un serveur si aucun connecteur sûr n’existe.

## 17. Version stable

Un `backup_record` peut être marqué :

**Version fonctionnelle / stable**

But : retrouver rapidement le dernier état client validé.

Le CRM peut afficher :

- dernière sauvegarde connue ;
- dernière copie locale ;
- dernière version stable ;
- âge de la sauvegarde.

## 18. Rappels de sauvegarde

Réglages configurables :

- âge maximum recommandé ;
- rappel avant intervention importante ;
- rappel après changement majeur ;
- alerte si aucune copie locale depuis X jours ;
- alerte si sauvegarde présente uniquement sur serveur.

Les rappels n’empêchent jamais le travail.

## 19. Intervention et sauvegarde

Depuis une Intervention :

- action « Enregistrer une sauvegarde avant intervention » ;
- sélectionner/créer `backup_record` ;
- lier l’intervention ;
- après validation, proposer « Marquer cette version comme stable ».

Incident : possibilité de référencer la sauvegarde restaurée/utilisée.

## 20. Pas d’automatisation risquée en V1

La V1 ne doit pas automatiquement :

- se connecter en SSH/SFTP à tous les clients ;
- télécharger des sauvegardes sans configuration explicite ;
- exécuter JetBackup/plugins distants ;
- restaurer WordPress automatiquement.

Elle **rappelle, enregistre, référence et vérifie ce qu’elle peut réellement vérifier**.

Des automatisations sûres pourront être ajoutées plus tard.

## 21. Annuaire interne — rôle

L’Annuaire est un répertoire professionnel simple, pas un second CRM.

Il réutilise `organizations` et `contacts` existants, classés via `directory_entries`.

## 22. Catégories Annuaire

Valeurs initiales modifiables :

- Fournisseur ;
- Partenaire ;
- Freelance ;
- Hébergeur ;
- Registrar ;
- Imprimeur ;
- Photographe ;
- Développeur / technique ;
- Comptable ;
- Juridique ;
- Autre.

Une même organisation/contact peut avoir plusieurs usages si nécessaire.

## 23. Fiche Annuaire

Afficher :

- société/personne ;
- catégorie ;
- contact principal ;
- téléphone ;
- email ;
- site web ;
- adresse si utile ;
- notes ;
- favori ;
- liens métiers.

Pas de duplication des coordonnées : elles restent dans `organizations` / `contacts`.

## 24. Liens Annuaire

Une entrée peut être liée à :

- Dépenses ;
- Abonnements ;
- Projet ;
- Client ;
- Service/prestation ;
- sauvegarde/hébergeur si utile.

Exemple : o2switch peut être retrouvé comme fournisseur/hébergeur et relié aux dépenses d’hébergement sans recopier ses coordonnées.

## 25. Recherche et favoris

Fonctions V1 :

- recherche par nom/catégorie/contact ;
- filtre favoris ;
- filtre catégorie ;
- accès rapide depuis Dépenses/Projet.

## 26. Dashboard / alertes

La Phase 6 alimente « À surveiller » avec :

- sauvegarde projet trop ancienne ;
- aucune copie locale récente ;
- sauvegarde uniquement serveur ;
- composant technique à revoir si statut/alerte configuré ;
- éventuellement fournisseur/contrat relié à une échéance Phase 5.

## 27. Recherche globale

Indexer :

- items Bibliothèque AtoumWeb ;
- versions/notes/tags pertinents ;
- sauvegardes (client/projet/type/date) ;
- annuaire (organisation/contact/catégorie).

## 28. Journal d’activité

Événements utiles :

- composant AtoumWeb créé / nouvelle version / version stable ;
- export « Préparer pour réutilisation » ;
- sauvegarde enregistrée ;
- copie locale ajoutée ;
- sauvegarde vérifiée ;
- version stable marquée ;
- entrée annuaire classée/favorisée.

Ne pas journaliser chaque lecture/copier-coller.

## 29. Réglages

Ajouter/compléter :

### Bibliothèque

- catégories ;
- emplacement racine d’exports ;
- tags/statuts personnalisables si nécessaire.

### Sauvegardes métier

- seuil d’âge ;
- dossier local recommandé ;
- rappels pré/post intervention ;
- règle copie locale.

### Annuaire

- catégories ;
- favoris ;
- types de relations.

## 30. Découpage recommandé

1. Bibliothèque AtoumWeb : données / UI / versions ;
2. workflow Préparer pour réutilisation / import-export ;
3. visualiseur Monaco / JSON / previews ;
4. Sauvegardes métier : records / locations / vérification ;
5. alertes / intervention / stable version ;
6. Annuaire interne et liens fournisseurs ;
7. intégration Recherche / Dashboard / Réglages ;
8. validation complète.

## 31. Critères d’acceptation

La Phase 6 est terminée si :

- un item projet peut être exporté pour adaptation sans être généralisé automatiquement ;
- un item AtoumWeb indépendant peut ensuite être créé/importé ;
- modifier l’item AtoumWeb ne touche jamais au projet source ;
- versions techniques et version stable sont conservées ;
- le code est visualisable mais jamais exécuté automatiquement ;
- une sauvegarde peut avoir plusieurs emplacements réels ;
- serveur et local restent explicitement distincts ;
- un fichier local manquant est détectable/relocalisable ;
- dernière sauvegarde / dernière locale / dernière stable sont visibles ;
- une intervention peut référencer sa sauvegarde pré-intervention ;
- les rappels de sauvegarde ne bloquent pas le travail ;
- l’Annuaire réutilise organisations/contacts sans duplication ;
- un fournisseur peut être relié aux dépenses/projets ;
- recherche globale, dashboard et journal sont alimentés ;
- les trois thèmes restent cohérents ;
- les tests automatisés passent.

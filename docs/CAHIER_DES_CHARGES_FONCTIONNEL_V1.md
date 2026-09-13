# AtoumWeb Manager — Cahier des charges fonctionnel V1

## 1. Objectif

AtoumWeb Manager est le CRM / outil de gestion métier central d’AtoumWeb. Il doit permettre de piloter l’ensemble du cycle d’activité sans multiplier les outils ni dupliquer les données : prospects, clients, offres, devis, projets, temps, interventions, maintenance, fichiers, documents, facturation suivie via Abby, dépenses, bibliothèques techniques, sauvegardes et statistiques.

L’interface doit rester simple, lisible et professionnelle. La puissance fonctionnelle ne doit pas transformer le produit en « usine à gaz ».

## 2. Principes transversaux

### 2.1 Source unique des données

Une information métier ne doit exister qu’une fois comme source de vérité. Les autres modules l’affichent ou la référencent.

Exemples :

- coordonnées client → fiche Client ;
- prix accepté → snapshot du Devis ;
- contrat signé → Documents du client ;
- code réellement utilisé → Bibliothèque projet ;
- module générique → Bibliothèque AtoumWeb ;
- temps passé → sessions de temps ;
- facture réglementaire → Abby, référencée dans le CRM ;
- dépense → module Dépenses.

### 2.2 Archivage plutôt que suppression

Clients, projets, devis, contrats, interventions et éléments historiques doivent être archivables. L’archivage client est réversible.

### 2.3 Historique

Un journal d’activité centralisé doit enregistrer les événements importants. Les timelines Client et Projet sont des vues filtrées du même journal.

### 2.4 Recherche globale

Une recherche globale doit permettre de retrouver rapidement :

- clients ;
- prospects ;
- projets ;
- devis ;
- documents ;
- interventions ;
- éléments de bibliothèque ;
- fichiers et ressources.

## 3. Navigation principale

Ordre par défaut :

1. Accueil
2. Prospects
3. Clients
4. Offres & Tarifs
5. Devis
6. Projets
7. Interventions & Maintenance
8. Gestion des temps
9. Facturation
10. Dépenses
11. Documents & Contrats
12. Bibliothèque AtoumWeb
13. Sauvegardes
14. Annuaire
15. Statistiques
16. Réglages

Les Ressources projet et la Bibliothèque projet restent à l’intérieur de chaque projet et ne prennent pas de place dans le menu principal.

## 4. Interface et thèmes

Trois thèmes :

- **AtoumWeb** — thème par défaut ;
- **Noir** ;
- **Blanc**.

Le thème AtoumWeb utilise l’identité visuelle AtoumWeb : navigation sombre, surfaces claires, accents or/beige, composants SaaS sobres et lisibles.

Les réglages doivent permettre de revenir aux valeurs par défaut sans effacer les données métier.

Une option globale doit permettre d’activer/désactiver les aides au survol.

## 5. Timer global

Le timer est toujours visible dans le header, en haut à droite.

Contexte affiché :

`Client > Projet > Lot/Module > Tâche/activité`

Règles :

- un seul timer actif à la fois ;
- la navigation dans le CRM ne l’arrête pas ;
- Pause conserve le contexte ;
- Stop enregistre et clôt la session ;
- démarrer une autre activité clôt automatiquement la précédente puis démarre la nouvelle à zéro ;
- les sessions de temps servent ensuite à toutes les vues : projet, intervention, gestion des temps, statistiques.

## 6. Accueil / Dashboard

Objectif : montrer uniquement ce qui aide à décider ou agir aujourd’hui.

### 6.1 KPIs principaux

Maximum quatre :

- prospects actifs ;
- projets en cours ;
- CA encaissé du mois ;
- temps travaillé du mois.

### 6.2 Blocs

- Aujourd’hui ;
- À surveiller ;
- Projets actifs ;
- Activité récente ;
- graphique simple sur six mois.

À surveiller peut inclure : maintenances, renouvellements, contrats, abonnements, packs faibles, devis proches d’expiration, travaux terminés non facturés.

## 7. Prospects

Vue Kanban avec colonnes commerciales :

- Nouveau contact ;
- À qualifier ;
- Besoin identifié ;
- Devis à préparer / envoyé ;
- À relancer / Négociation ;
- Gagné ;
- Perdu ;
- éventuellement En attente / plus tard.

Chaque prospect contient : identité, coordonnées, source, besoins, budget, valeur estimée, probabilité, température, prochaine action, notes, timeline, devis et rappels.

La prochaine action doit être facilement programmable : demain, 3 jours, 7 jours, 30 jours ou date personnalisée.

Un prospect gagné peut devenir client sans perte d’historique.

## 8. Clients

### 8.1 Liste Clients

Vue tableau par défaut avec recherche, filtres et actions rapides.

Statuts :

- Actif ;
- Inactif ;
- Archivé.

Archivage réversible.

Le champ **A déjà été client** est historique et doit autant que possible être déterminé automatiquement à partir des relations commerciales validées.

### 8.2 Fiche Client

Contient : résumé, contacts, projets, services souscrits, commercial, contrats, facturation, interventions, documents, technique, sauvegardes, historique.

Les contacts peuvent être principal, administratif, facturation, technique.

Le total de temps client agrège tous les projets/interventions.

## 9. Offres & Tarifs

Deux notions :

- **Service** = prestation atomique ;
- **Offre** = composition de services.

Les offres peuvent ajouter, retirer, ordonner des services et rendre certains services optionnels.

### 9.1 Grille tarifaire

Doit contenir : catégorie, service/offre, tarif actuel, tarif recommandé/référence, mode de tarification, statut, visibilité site public.

### 9.2 Fiche Service

Onglets :

- Vue d’ensemble ;
- Inclus ;
- Options ;
- Tarification ;
- Prérequis ;
- Contrat ;
- Conseils.

Les tarifs et modèles doivent être versionnables.

## 10. Devis

Création guidée :

1. Client/prospect
2. Projet
3. Offre
4. Services/prestations
5. Conditions
6. Prévisualisation

Chaque ligne conserve prix catalogue, prix proposé, remise, quantité et total.

Remises : pourcentage, montant fixe, prix négocié, geste commercial, pilote, partenariat, gratuité, fidélité, pack.

### 10.1 Snapshot obligatoire

Lorsqu’une offre/service est ajouté à un devis, le CRM en conserve une photographie indépendante : prix, description, inclusions, options, conditions.

Une modification future du catalogue ne modifie jamais un ancien devis.

### 10.2 Statuts

Brouillon → Envoyé → Vu → Accepté → Refusé → Expiré.

Un devis accepté peut être transformé en projet.

## 11. Projets

Hiérarchie :

`Projet > Lots/Étapes > Modules/Pages > Tâches/Sous-tâches > Sessions de temps`

Chaque module peut contenir : statut, checklist, progression, temps estimé, temps réel, notes et documents.

Statuts de tâches : À faire, En cours, En attente client, Bloqué, À valider, Terminé.

### 11.1 Modèles de projet

Modèles standards : Site vitrine, E-commerce, Application, Logiciel, etc.

Lors de la création depuis un devis :

- appliquer le socle standard du type de projet ;
- ajouter les options/services validés ;
- conserver la version du modèle utilisée.

Une nouvelle version du modèle ne modifie jamais les projets existants.

### 11.2 Modes commerciaux

- normalement facturé ;
- remisé ;
- offert ;
- partenariat ;
- interne AtoumWeb.

### 11.3 Fin de projet

Le CRM peut vérifier sans bloquer : tâches obligatoires, sauvegarde finale, solde à facturer, documents, maintenance, formation, livrables et éventuels éléments techniques intéressants à généraliser.

## 12. Fichiers & Ressources projet

Chaque projet reçoit automatiquement une arborescence de production :

- 01 Identité
- 02 Textes
- 03 Images & médias
- 04 Documents projet
- 05 Technique / exports
- 06 Livrables
- 07 Archives

Les fichiers lourds ne sont pas obligatoirement stockés dans la base du CRM : le CRM référence leur emplacement réel.

Les ressources peuvent être liées à des tâches/modules sans duplication physique.

## 13. Documents client

Arborescence au niveau Client :

- 01 Devis
- 02 Contrats
- 03 Avenants
- 04 Facturation / justificatifs
- 05 Rapports
- 06 Documents fournis par le client
- 07 Documents signés
- 08 Archives

Un document maître reste stocké une seule fois mais peut être accessible depuis les projets concernés par référence.

## 14. Bibliothèque projet

Liée à chaque projet. Elle conserve fidèlement les éléments techniques réellement utilisés :

- headers ;
- footers ;
- pages ;
- snippets ;
- ACF ;
- exports Divi ;
- modules ;
- extensions ;
- notes techniques.

Le code peut être visualisé avec coloration syntaxique, recherche, copie, agrandissement et édition/versionnement. Le CRM ne doit pas exécuter automatiquement ce code.

Les fichiers réels peuvent rester dans Ressources/Technique ; la bibliothèque est la fiche intelligente qui les décrit/référence.

## 15. Bibliothèque AtoumWeb

Bibliothèque globale de briques réutilisables.

Catégories de base : Headers, Footers, Accueils/Heroes, Pages/modèles, Sections/modules, Formulaires, Galeries, Carrousels, Navigation, CSS, JavaScript, PHP/Snippets, WooCommerce, ACF/données dynamiques, Applications/composants, Notes techniques.

États possibles : prêt à réutiliser, à adapter, référence/exemple.

### 15.1 Généralisation non automatique

Une version projet spécifique ne devient pas automatiquement générique.

Processus prévu :

1. exporter ou fournir le JSON/code du projet ;
2. préparer/nettoyer avec assistance ;
3. séparer les éléments réutilisables ;
4. retirer les dépendances client inutiles ;
5. enregistrer le résultat comme nouvelle entrée indépendante dans la Bibliothèque AtoumWeb.

Modifier ensuite le module générique ne modifie jamais le projet client d’origine.

## 16. Gestion des temps

Filtres : période, client, projet, type de projet, prestation, module, tâche/intervention, catégorie de temps.

KPIs : temps total, facturable, non facturable, nombre d’interventions, moyenne, prévu/réel, écart.

Catégories possibles : Production, Développement, Design, Réunion, Support, Correction client, Correction interne, Recherche/formation, Administratif, Autre.

Comparaisons uniquement entre projets/modules comparables.

Exports possibles : PDF, CSV, Excel ; vue interne et vue client.

## 17. Interventions & Maintenance

Vues :

- Demandes ;
- Interventions ;
- Maintenance ;
- Packs d’heures.

Une demande peut devenir intervention ou être classée sans intervention.

Types : correction, modification, ajout, maintenance, incident, support, formation, autre.

Prise en charge : maintenance, pack d’heures, hors forfait facturable, geste commercial, inclus projet, interne AtoumWeb.

### 17.1 Maintenance

Les forfaits sont configurables. Les dépassements ne bloquent jamais : facturer, geste commercial, reporter, inclure exceptionnellement.

Chaque service de maintenance possède des périodes mensuelles historisées et une checklist standard + tâches spécifiques client.

Ne pas créer un nouveau projet chaque mois.

### 17.2 Incidents

Incident = intervention avec priorité, début, résolution, durée, cause, action et éventuelle sauvegarde utilisée.

### 17.3 Packs d’heures

Solde décrémenté automatiquement selon les interventions liées. Alerte lorsque le solde devient faible.

## 18. Facturation / Abby

AtoumWeb Manager prépare et suit. Abby reste l’outil de facturation réglementaire.

Vues : À facturer, Factures créées, Paiements, Retards.

Le CRM conserve : numéro Abby, date, montant, échéance, statut, date de paiement et lien vers devis/projet/intervention.

Toujours distinguer :

- valeur commerciale ;
- montant contractuellement facturé ;
- montant encaissé.

## 19. Dépenses AtoumWeb

Vues : Vue d’ensemble, Abonnements, Dépenses ponctuelles, Échéances.

Une dépense contient : fournisseur/service, catégorie, HT/TTC, date, moyen de paiement, récurrence, prochaine échéance, justificatif, éventuel lien client/projet.

Types : interne, liée à un client, mutualisée, refacturable.

Les financements/achats en plusieurs fois sont suivis dans un sous-bloc dédié.

## 20. Documents & Contrats

Vues : Tous les documents, Modèles, Contrats, Devis, Avenants, Rapports, Documents clients.

Fonctionnement :

`Modèle → remplissage automatique → prévisualisation → modification manuelle → validation → PDF → archivage`

Une fois finalisé, un document est figé.

Modèles prévus : site vitrine, e-commerce, maintenance, application/logiciel, partenariat/prestation offerte, avenant, rapport intervention, rapport maintenance, cahier des charges simplifié, livraison/réception.

Les modèles peuvent utiliser une bibliothèque de clauses.

## 21. Sauvegardes

V1 : surtout rappel, suivi et traçabilité.

Le CRM enregistre : projet, date, type, commentaire, emplacement réel, taille éventuelle, version fonctionnelle oui/non.

Emplacements possibles : serveur/hébergeur, PC local, disque externe, autre.

Une sauvegarde présente uniquement sur le serveur ne doit jamais être affichée comme copie locale.

Le CRM peut suggérer une sauvegarde avant une intervention importante et proposer de marquer une version comme stable après validation.

L’automatisation réelle de sauvegardes pourra être ajoutée plus tard pour des mécanismes maîtrisés/testés.

## 22. Annuaire interne

Répertoire professionnel simple : fournisseurs, partenaires, freelances, hébergeurs/registrars, imprimeurs, photographes, développeurs/techniques, comptable/juridique, autres.

Une fiche peut être liée à un client, projet, dépense ou service.

## 23. Statistiques

Onglets : Vue d’ensemble, Commercial, Projets & Temps, Rentabilité, Clients, Prestations.

Périodes : mois, trimestre, année, année précédente, personnalisé, avec comparaison à la période précédente.

Indicateurs : CA encaissé, valeur commerciale, dépenses, temps, taux horaire réel, nouveaux clients, conversions, sources de prospects, rentabilité client/prestation, revenus récurrents, dépenses récurrentes.

Maximum 1 à 2 graphiques par onglet.

Les statistiques calculent à partir des données sources ; elles ne stockent pas de copies indépendantes des chiffres métier.

## 24. Réglages généraux

Sections :

- Identité AtoumWeb ;
- Apparence ;
- Dashboard ;
- Temps ;
- Projets & modèles ;
- Listes personnalisables ;
- Stockage ;
- Sauvegarde & sécurité ;
- Numérotation ;
- Notifications.

### 24.1 Valeurs par défaut

Le CRM doit être immédiatement utilisable avec l’ordre logique, catégories, statuts et modèles définis dans le projet.

Bouton de restauration des réglages par défaut avec confirmation. Cette action ne doit jamais supprimer les données clients/projets.

## 25. Parcours complet attendu

`Prospect → Devis → Client → Projet → Production → Livraison → Facturation → Maintenance → Statistiques`

Lorsqu’un devis est accepté, le CRM doit pouvoir :

- créer/rattacher le client ;
- créer le projet ;
- appliquer le bon modèle versionné ;
- ajouter les options ;
- générer lots/modules/tâches/prérequis ;
- créer l’arborescence de ressources ;
- initialiser la Bibliothèque projet ;
- relier devis et contrat ;
- préparer les éléments à facturer ;
- rendre le projet disponible au timer.

## 26. Critères généraux d’acceptation V1

La V1 est cohérente si :

- chaque donnée métier possède une source identifiable ;
- les écrans ne créent pas de doublons divergents ;
- les devis et modèles historiques restent stables ;
- les temps sont traçables depuis une session unique ;
- les documents maîtres ne sont pas dupliqués ;
- la recherche globale retrouve les principales entités ;
- les trois thèmes restent utilisables ;
- les fichiers/sauvegardes indiquent leur emplacement réel ;
- les bibliothèques projet et AtoumWeb restent indépendantes ;
- le CRM peut évoluer sans modifier rétroactivement les données historiques.

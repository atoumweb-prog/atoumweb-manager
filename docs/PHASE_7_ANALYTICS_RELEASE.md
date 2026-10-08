# Phase 7 — Statistiques, rentabilité, exports & stabilisation V1

## Objectif

Terminer AtoumWeb Manager V1 avec des statistiques fiables, des exports, un Dashboard final, des réglages complets, un export total des données et une validation Windows avant passage en `1.0.0`.

Principe : **les statistiques sont dérivées des données métier et ne deviennent jamais une nouvelle source de vérité.**

## Périodes

Filtres : aujourd’hui, semaine, mois, trimestre, année, année précédente, personnalisé, avec comparaison à la période précédente. Chaque indicateur utilise une date métier explicite.

## Définitions financières

- **Valeur commerciale signée** : valeur catalogue/commerciale historique des devis acceptés.
- **Valeur contractuelle signée** : montant réellement convenu des devis acceptés.
- **Valeur commerciale livrée** : valeur commerciale des projets terminés + valeur théorique d’interventions terminées non déjà incluse dans le projet.
- **CA facturé** : factures Abby actives selon date facture.
- **CA encaissé** : somme de `payments.amount_cents` selon `paid_at`.
- **Reste à encaisser** : facturé restant non couvert par paiements.
- **Dépenses** : dépenses enregistrées selon période.
- **Valeur offerte** : différence documentée entre valeur commerciale et valeur contractuelle pour gratuité/geste/partenariat.

Une règle anti-double-compte est obligatoire.

## Onglets Statistiques

### Vue d’ensemble
CA encaissé, CA facturé, valeur commerciale livrée, dépenses, temps travaillé, taux horaire réel, nouveaux clients. Maximum 1–2 graphiques principaux.

### Commercial
Prospects, gagnés/perdus, conversion, devis, taux d’acceptation, valeur, sources, conversion par source, motifs de perte, délais Prospect → Devis → Acceptation.

### Projets & Temps
Projets créés/terminés, temps total, facturable/non facturable, estimé vs réel, temps par catégorie/module, durée calendaire. Comparer uniquement des projets comparables et afficher la taille d’échantillon `n`.

### Rentabilité
- rendement contractuel horaire = montant contractuel / temps réel ;
- valeur commerciale horaire = valeur commerciale / temps réel ;
- rendement facturé horaire = facturé projet / temps réel ;
- rendement encaissé horaire = paiements projet / temps réel ;
- marge simple = montant contractuel - dépenses directes ;
- option : marge après valorisation du temps avec coût horaire interne configuré.

Alertes possibles : temps très supérieur à l’estimé, rendement sous seuil, prestation régulièrement sous-tarifée. Aucune modification automatique des prix.

### Clients
Valeur commerciale, contractuel, facturé, encaissé, dépenses directes, temps, projets, interventions, maintenance, packs, récurrent, valeur offerte, rendement horaire.

### Prestations
Nombre vendu, valeur, montant contractuel, temps réel, rendement horaire, taux d’acceptation, remises et options. Distinguer « se vend le plus » de « plus rentable ».

## Revenus récurrents

Afficher revenu récurrent client mensuel équivalent, coûts récurrents mensuels équivalents et récurrent net indicatif. Ne pas confondre revenu contractuel récurrent et encaissements réellement reçus.

## Analyse AtoumWeb

Panneau facultatif basé sur des règles déterministes et des chiffres traçables. Pas d’analyse opaque obligatoire.

## Exports

CSV, Excel et PDF. Deux vues lorsque nécessaire : Interne (coûts/marge/pilotage) et Client (sans coûts internes, marge, prix conseillé ni notes internes).

## Export complet des données

Réglages > Sauvegarde & sécurité > **Exporter toutes mes données**.

Le paquet contient au minimum : base SQLite, manifeste/version, réglages exportables, index des fichiers référencés et README de restauration. Option pour inclure les fichiers du workspace.

## Données dérivées

`search_documents`, caches et agrégats temporaires doivent pouvoir être entièrement reconstruits depuis les données sources.

## Dashboard final

### Aujourd’hui
Prospects à relancer, tâches, demandes, maintenances, échéances.

### À surveiller
Retards, factures, renouvellements, sauvegardes, packs faibles, projets/tâches en retard.

### KPIs par défaut
Prospects actifs, projets actifs, CA encaissé du mois, temps travaillé du mois. Blocs masquables et réordonnables.

## Réglages finaux

Identité, Apparence, Dashboard, Temps, Projets & modèles, Listes, Stockage, Sauvegarde & sécurité, Numérotation, Notifications et Pilotage/coût horaire interne facultatif.

`Rétablir les réglages par défaut` fonctionne par section et ne supprime jamais de données métier.

## Qualité et sécurité V1

États vides utiles, erreurs lisibles, confirmations destructives, navigation clavier raisonnable, logs locaux tournants sans secrets, opérations critiques transactionnelles.

Revue sécurité : context isolation, Node désactivé dans renderer, sandbox, IPC autorisés explicitement, validation arguments, CSP, ouverture contrôlée des fichiers, aucun secret en clair, aucun code bibliothèque exécuté, aucune transmission Internet automatique.

## Tests transverses

Tester migrations, sauvegarde/restauration, export complet, reconstruction recherche, snapshots devis, conversions, devis → projet, timer unique, maintenance, packs, PDF, paiements, bibliothèques, sauvegardes métier, statistiques et trois thèmes.

## Packaging Windows

Valider installateur, installation/désinstallation, conservation volontaire du workspace, réinstallation et reconnexion au workspace, icône, nom et version.

## Versioning / Release Candidate

Développement en `0.x`. Première RC : `1.0.0-rc.1`. V1 stable : `1.0.0`. Créer `CHANGELOG.md` à partir de la RC.

Tester d’abord avec données de démonstration, puis avec une copie contrôlée de vraies données AtoumWeb.

## Jeu de démonstration

Inclure sans secrets réels : prospect entreprise, prospect particulier, client classique, Cazor partenariat/offert, site vitrine, application, maintenance, pack, facture partielle, dépense, sauvegarde serveur/local et composants techniques.

## Parcours final V1

`Prospect → Devis → Client → Projet → Tâches → Temps → Livraison → Facturation Abby → Paiement → Maintenance → Intervention → Statistiques`

Cas complémentaires : partenariat/offert, dépassement maintenance, pack d’heures, document signé, sauvegarde serveur puis locale, composant projet adapté vers Bibliothèque AtoumWeb.

## Critères de sortie `1.0.0`

- toutes les phases critiques validées ;
- aucune perte de données connue ;
- migrations/restaurations testées ;
- statistiques cohérentes avec les sources ;
- recherche reconstruisible ;
- chaque total financier a une source identifiable ;
- trois thèmes validés ;
- installateur Windows validé ;
- export complet des données validé ;
- documentation utilisateur minimale disponible ;
- `PROJECT_STATUS.md` et `CHANGELOG.md` à jour ;
- aucun blocage critique ouvert.

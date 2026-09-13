# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Fondation** : `foundation/electron-react-sqlite` — PR #3
- **Branche de travail actuelle** : `feature/phase-1-crm`
- **PR Phase 1** : #58 — `Phase 1 CRM — Prospects, Clients et recherche globale` — brouillon, validation locale en cours
- **Statut** : fondation validée sur Windows ; typecheck/tests initiaux Phase 1 validés ; migration SQLite 4 appliquée ; UX Prospects/Clients en validation itérative.
- **Principe directeur** : une donnée métier possède une source unique ; les autres écrans la référencent sans duplication.

## Phase 0 — Fondation

Validations réelles effectuées sous Windows le 13/09/2026 :

- [x] `npm install`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run package`
- [x] démarrage réel Electron
- [x] navigation principale
- [x] thèmes AtoumWeb / Noir / Blanc
- [x] workspace local
- [x] sauvegarde manuelle SQLite
- [x] restauration SQLite
- [x] sauvegarde automatique `pre-restore` avant restauration
- [x] correction du redémarrage de restauration en mode développement
- [x] versionner le `package-lock.json` généré localement
- [ ] finaliser/fusionner PR #3 dans `main`

La restauration est volontairement différente selon l’environnement :

- **version packagée** : restauration + redémarrage automatique ;
- **`npm start`** : restauration programmée, puis fermeture et relance manuelle pour conserver le contexte Electron Forge/Vite.

## Phase 1 — Socle CRM

Branche : `feature/phase-1-crm`  
PR : #58 (brouillon)

### Base de données

- [x] migration `organizations`
- [x] migration `contacts`
- [x] migration `client_accounts`
- [x] migration `client_contact_roles`
- [x] migration `prospects`
- [x] journal métier `activity_events`
- [x] index dérivé `search_documents`
- [x] contrainte d’identité Prospect/Client
- [x] contact principal client unique
- [x] unicité d’un client par organisation / particulier
- [x] index métiers (stages, prochaines actions, relations)
- [x] migration 4 `crm_actions` pour Actions / Relances multiples
- [x] reprise automatique des anciennes prochaines actions vers `crm_actions`

### Services métier / IPC

- [x] Organisations : créer / modifier
- [x] Contacts : créer / modifier
- [x] Prospects : lister / créer / modifier
- [x] changement de stage
- [x] raison obligatoire si Perdu
- [x] conversion Prospect → Client transactionnelle et idempotente
- [x] Clients : lister / créer / modifier
- [x] archivage / réactivation
- [x] plusieurs contacts par client
- [x] rôles Principal / Administratif / Facturation / Technique / Autre
- [x] changement de contact principal avec unicité garantie
- [x] journal d’activité centralisé
- [x] recherche globale locale
- [x] reconstruction complète de l’index de recherche
- [x] API IPC typée ; aucun accès SQLite depuis le renderer
- [x] service Actions : lister / créer / terminer / annuler / rouvrir
- [x] distinction métier `action` / `follow_up`
- [x] plusieurs Actions/Relances ouvertes simultanément
- [x] prochaine échéance dérivée automatiquement des actions ouvertes
- [x] création d’une Relance Prospect → déplacement automatique vers `À relancer`

### Interface

- [x] Kanban Prospects réel
- [x] formulaire Nouveau prospect
- [x] température, source, besoin, valeur estimée
- [x] changement de stage par sélection
- [x] glisser-déposer entre étapes actives
- [x] cartes Prospects empilées et ouverture au clic
- [x] conversion vers Client depuis une carte Prospect
- [x] fiche Prospect latérale détaillée
- [x] panneau Prospect à droite, scrollable et conservé dans les fenêtres réduites
- [x] tableau Clients réel
- [x] formulaire Nouveau client
- [x] filtres Clients
- [x] archivage / réactivation
- [x] fiche Client latérale
- [x] comportement Client validé : pleine largeur sans fiche, fiche à droite uniquement lorsqu’un client est ouvert
- [x] onglets Client Résumé / Contacts / Commercial / Historique interactifs
- [x] ajout de contacts supplémentaires depuis la fiche Client
- [x] choix du rôle de chaque contact
- [x] changement du contact principal depuis la fiche Client
- [x] activité récente / historique Client
- [x] recherche globale avec résultats Clients / Prospects / Organisations / Contacts
- [x] navigation clavier recherche : ↑ / ↓ / Entrée / Échap
- [x] dashboard raccordé aux premiers compteurs CRM
- [x] vue dédiée Prospects `Pipeline / Historique`
- [x] filtres Gagnés / Perdus + recherche dans l’historique Prospect
- [x] Relances séparées visuellement des Actions
- [x] raccourcis Relance Demain / +3 j / +7 j / +30 j / date personnalisée
- [x] plusieurs Actions affichées les unes sous les autres dans la fiche
- [x] terminer / annuler / rouvrir une Action ou Relance
- [ ] revalidation Windows de la nouvelle interface Actions / Relances / Historique

### Reste fonctionnel Phase 1

- [ ] deep-link précis depuis un résultat de recherche vers la fiche Client/Prospect sélectionnée
- [ ] résolution relationnelle d’un résultat Organisation/Contact vers la bonne fiche Client/Prospect
- [ ] enrichissement Commercial Client lorsque Projets/Facturation/Temps seront disponibles
- [ ] raccorder ensuite le système Actions multiples à la fiche Client (l’ancien champ reste compatible pour l’instant)

### Tests

Validés localement avant la migration Actions :

- [x] migrations CRM
- [x] création organisation/contact/prospect
- [x] recherche
- [x] perte avec raison obligatoire
- [x] conversion idempotente
- [x] archivage/réactivation
- [x] validation budgets / probabilité
- [x] multi-contact client + changement de principal
- [x] `npm run typecheck` — succès réel sous Windows
- [x] `npm test` — 4 fichiers / 13 tests passés sous Electron 44.3.0 / Node 24.20.0

Nouveaux tests ajoutés, à exécuter localement après récupération :

- [ ] migration 4 + table `crm_actions`
- [ ] plusieurs actions ouvertes sur un prospect
- [ ] séparation Action / Relance
- [ ] Relance → étape `À relancer`
- [ ] calcul de la prochaine échéance
- [ ] terminer puis rouvrir une action
- [ ] nouveau `npm run typecheck`
- [ ] nouveau `npm test`

### Validation visuelle Windows du 13/09/2026

- [x] SQLite affiche réellement **4 migrations** après mise à niveau
- [x] pipeline sans gros défilement horizontal
- [x] glisser-déposer des cartes
- [x] pile de cartes compacte
- [x] panneau Prospect à droite utilisable en fenêtre réduite
- [x] panneau Client à droite utilisable en fenêtre réduite
- [x] tableau Client reprend toute la largeur quand aucune fiche n’est ouverte
- [ ] nouvelle vue Historique dédiée à tester
- [ ] nouvelles Actions / Relances multiples à tester

### CI GitHub

Le workflow a été étendu à `feature/phase-1-crm` et aux PR vers la branche de fondation.

Premier run : **non exploitable**. GitHub a terminé le job en échec avant toute étape, avec `runner_id: 0` et une liste d’étapes vide. Aucun checkout, `npm install`, typecheck ou test n’a été exécuté. Cela ne constitue donc pas un échec du code.

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9 — validation en cours
- **Phase 2 — Commercial** : #10–#15
- **Phase 3 — Projets & Production** : #16–#23
- **Phase 4 — Interventions, Maintenance & Packs** : #24–#31
- **Phase 5 — Administration & Finance** : #32–#39
- **Phase 6 — Référentiels & Continuité** : #40–#47
- **Phase 7 — Statistiques & Stabilisation V1** : #48–#57

## Règles à ne pas casser

1. Prospect et Client partagent les mêmes Organisations/Contacts ; aucune recopie d’identité.
2. Archivage plutôt que suppression destructive.
3. Conversion Prospect → Client idempotente.
4. Valeur commerciale, facturé, encaissé et dépenses restent distincts.
5. Fichiers lourds hors SQLite ; la base stocke les références.
6. Abby reste la source des factures réglementaires en V1.
7. Bibliothèque projet et Bibliothèque AtoumWeb restent indépendantes.
8. Une sauvegarde serveur n’est jamais considérée comme une sauvegarde locale.
9. Statistiques et recherche sont dérivées/reconstruisibles.
10. Tous les éléments historiques importants sont journalisés.
11. Une Relance et une Action sont deux objets distincts ; plusieurs peuvent coexister sur un même dossier.
12. Les panneaux latéraux Prospect/Client restent à droite ; ils ne passent pas sous la vue principale.

## Travail en cours

**Phase 1 CRM : nouveau système Actions / Relances multiples et Historique Prospects dédié implémentés sur la branche.**

Prochaine validation locale : `git pull`, `npm run typecheck`, `npm test`, puis test visuel des vues Pipeline / Historique et des Actions / Relances multiples.

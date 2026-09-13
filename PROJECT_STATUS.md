# AtoumWeb Manager — Suivi du projet

> Source de vérité partagée entre AtoumWeb, ChatGPT et Codex. À mettre à jour après chaque étape significative.

## État général

- **Version cible** : V1
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Fondation** : `foundation/electron-react-sqlite` — PR #3
- **Branche de travail actuelle** : `feature/phase-1-crm`
- **PR Phase 1** : #58 — `Phase 1 CRM — Prospects, Clients et recherche globale` — brouillon, fusionnable, non validée localement
- **Statut** : fondation validée sur Windows ; Phase 1 CRM implémentée en première passe avancée et en attente de validation réelle.
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
- [ ] versionner le `package-lock.json` généré localement
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

### Services métier / IPC

- [x] Organisations : créer / modifier
- [x] Contacts : créer / modifier
- [x] Prospects : lister / créer / modifier
- [x] changement de stage
- [x] raison obligatoire si Perdu
- [x] prochaine action + raccourcis J+1 / J+3 / J+7 / J+30 + date personnalisée
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

### Interface

- [x] Kanban Prospects réel
- [x] formulaire Nouveau prospect
- [x] température, source, besoin, valeur estimée, prochaine action
- [x] changement de stage sans dépendre du drag-and-drop
- [x] conversion vers Client depuis une carte Prospect
- [x] raccourcis de relance J+1 / J+3 / J+7 / J+30 / date personnalisée
- [x] fiche Prospect latérale détaillée
- [x] historique Prospect
- [x] tableau Clients réel
- [x] formulaire Nouveau client
- [x] filtres Clients
- [x] archivage / réactivation
- [x] fiche Client latérale
- [x] onglets Client Résumé / Contacts / Commercial / Historique interactifs
- [x] ajout de contacts supplémentaires depuis la fiche Client
- [x] choix du rôle de chaque contact
- [x] changement du contact principal depuis la fiche Client
- [x] programmation d’une prochaine action Client
- [x] activité récente / historique Client
- [x] recherche globale avec résultats Clients / Prospects / Organisations / Contacts
- [x] dashboard raccordé aux premiers compteurs CRM

### Reste fonctionnel Phase 1

- [ ] deep-link précis depuis recherche globale vers une fiche Organisation/Contact
- [ ] navigation clavier complète dans les résultats de recherche
- [ ] enrichissement Commercial Client lorsque Projets/Facturation/Temps seront disponibles

### Tests ajoutés

- [x] migrations CRM
- [x] création organisation/contact/prospect
- [x] recherche
- [x] perte avec raison obligatoire
- [x] conversion idempotente
- [x] archivage/réactivation
- [x] validation budgets / probabilité
- [x] multi-contact client + changement de principal
- [ ] exécution réelle typecheck/tests de la branche Phase 1 sur Windows
- [ ] validation de la migration depuis une base Phase 0 existante
- [ ] validation visuelle Phase 1

## Phases V1 préparées

- **Phase 1 — Socle CRM** : issues #4–#9 — développement en cours
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

## Travail en cours

**Phase 1 CRM : première passe fonctionnelle avancée terminée sur la branche ; PR #58 ouverte en brouillon.**

Aucune validation n’est déclarée comme réussie tant que les commandes n’ont pas été réellement exécutées. La prochaine validation locale devra vérifier la sauvegarde `pre-migration`, le passage à 3 migrations, le typecheck, les tests, la création d’un prospect, les raccourcis de relance, sa conversion en client, les fiches Prospect/Client, les contacts multiples, l’archivage/réactivation et la recherche globale.

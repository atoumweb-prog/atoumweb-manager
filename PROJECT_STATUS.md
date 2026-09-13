# AtoumWeb Manager — Suivi du projet

> Fichier de référence partagé entre AtoumWeb, ChatGPT et Codex. Il doit être mis à jour à chaque étape importante du développement.

## État général

- **Projet** : AtoumWeb Manager
- **Version cible actuelle** : V1
- **Statut global** : Fondation applicative en cours — premier socle Electron/React/SQLite implémenté sur branche dédiée
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche de travail actuelle** : `foundation/electron-react-sqlite`
- **Principe** : une donnée possède une source unique ; les autres écrans la référencent sans duplication.

## Références

- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md` — fonctionnel
- `docs/ARCHITECTURE.md` — architecture technique décidée
- `docs/DATA_MODEL_V1.md` — modèle de données cible V1
- `docs/ROADMAP_V1.md` — ordre de développement
- `docs/DEVELOPMENT.md` — démarrage local et commandes de développement

## Phase actuelle

### Phase 0 — Fondation

- [x] Créer le dépôt GitHub `atoumweb-manager`
- [x] Ajouter la documentation de référence et `AGENTS.md`
- [x] Définir et documenter l'architecture technique
- [x] Définir le modèle de données initial
- [x] Créer la branche `foundation/electron-react-sqlite`
- [x] Initialiser Electron Forge + React + TypeScript
- [x] Créer l'arborescence `main / preload / renderer / shared`
- [x] Isoler le renderer du système (`contextIsolation`, `nodeIntegration: false`, sandbox)
- [x] Ajouter la couche SQLite via `node:sqlite`
- [x] Ajouter une abstraction `DatabaseAdapter`
- [x] Ajouter le moteur de migrations SQLite
- [x] Ajouter la première migration système (`settings`, `activity_log`)
- [x] Ajouter le workspace local configurable
- [x] Ajouter les sauvegardes quotidiennes et manuelles
- [x] Ajouter une sauvegarde automatique avant migration
- [x] Ajouter une restauration sécurisée avec copie `pre-restore`
- [x] Ajouter le shell de navigation V1 dans le bon ordre
- [x] Ajouter les thèmes AtoumWeb / Noir / Blanc
- [x] Ajouter un écran Réglages minimal (thème, workspace, sauvegarde/restauration)
- [x] Ajouter les premiers tests unitaires/migrations
- [x] Ajouter un workflow CI GitHub
- [ ] Générer et versionner `package-lock.json`
- [ ] Valider `npm install`, `npm run typecheck`, `npm test` et `npm start` sur un runner/PC Windows
- [ ] Valider le packaging Windows
- [ ] Finaliser puis fusionner la PR de fondation

## Avancement par module

| Module | Conception | Développement | Tests | Statut |
|---|---|---|---|---|
| Accueil / Dashboard | ✅ | 🟡 socle | ⬜ | Shell de fondation |
| Recherche globale | ✅ | 🟡 shell | ⬜ | Champ présent, moteur à développer |
| Prospects | ✅ | ⬜ | ⬜ | À développer |
| Clients | ✅ | ⬜ | ⬜ | À développer |
| Offres & Tarifs | ✅ | ⬜ | ⬜ | À développer |
| Devis | ✅ | ⬜ | ⬜ | À développer |
| Projets | ✅ | ⬜ | ⬜ | À développer |
| Fichiers & Ressources projet | ✅ | ⬜ | ⬜ | À développer |
| Bibliothèque projet | ✅ | ⬜ | ⬜ | À développer |
| Bibliothèque AtoumWeb | ✅ | ⬜ | ⬜ | À développer |
| Timer global | ✅ | 🟡 shell | ⬜ | Widget visible, logique à raccorder |
| Gestion des temps | ✅ | ⬜ | ⬜ | À développer |
| Interventions & Maintenance | ✅ | ⬜ | ⬜ | À développer |
| Packs d'heures | ✅ | ⬜ | ⬜ | À développer |
| Facturation / suivi Abby | ✅ | ⬜ | ⬜ | À développer |
| Dépenses AtoumWeb | ✅ | ⬜ | ⬜ | À développer |
| Documents & Contrats | ✅ | ⬜ | ⬜ | À développer |
| Sauvegardes | ✅ | 🟡 fondation | ⬜ | DB locale : création/restauration implémentées |
| Annuaire interne | ✅ | ⬜ | ⬜ | À développer |
| Statistiques | ✅ | ⬜ | ⬜ | À développer |
| Journal d'activité | ✅ | 🟡 schéma | ⬜ | Table initiale créée |
| Réglages généraux | ✅ | 🟡 socle | ⬜ | Thème/workspace/DB présents |
| Thèmes AtoumWeb / Noir / Blanc | ✅ | ✅ socle | ⬜ | Sélection et persistance implémentées |

## Règles fonctionnelles à ne pas casser

1. **Source unique des données** : pas de duplication simplement parce qu'une information doit être visible à plusieurs endroits.
2. **Devis figés** : un devis conserve prix, contenu et conditions au moment de sa création.
3. **Modèles de projets versionnés** : une évolution d'un modèle ne modifie jamais les anciens projets.
4. **Archivage réversible** : les clients archivés peuvent être réactivés ; éviter les suppressions destructives.
5. **Timer unique** : un seul timer actif à la fois, persistant pendant la navigation.
6. **Valeurs distinctes** : séparer valeur commerciale, montant facturé et montant encaissé.
7. **Abby** : le CRM prépare et suit, mais Abby reste la source des factures réglementaires en V1.
8. **Maintenance** : périodes d'un même service ; ne pas créer un nouveau projet chaque mois.
9. **Bibliothèque projet** : conserver fidèlement ce qui est réellement utilisé sur le projet.
10. **Bibliothèque AtoumWeb** : modules génériques préparés volontairement à partir d'exports projet ; aucune généralisation automatique.
11. **Code visualisable sans exécution** : afficher/éditer/versionner le code sans l'exécuter dans le CRM.
12. **Sauvegardes avec emplacement réel** : serveur/hébergeur, PC local, disque externe ou autre ; ne jamais considérer locale une sauvegarde uniquement présente sur le serveur.
13. **Ressources et documents séparés** : projet = production ; client = relation commerciale/contractuelle.
14. **Documents liés sans duplication** : un fichier maître peut être visible depuis plusieurs écrans via des références.
15. **Recherche globale essentielle** : clients, prospects, projets, documents, interventions, bibliothèque et fichiers.
16. **Journal d'activité centralisé** : les timelines Client/Projet affichent des vues filtrées du même journal.
17. **Réglages par défaut** : ordre logique établi dans le cahier des charges, avec retour aux valeurs par défaut sans toucher aux données métier.
18. **Trois thèmes** : AtoumWeb par défaut, Noir, Blanc.

## Architecture technique décidée

- Electron 44.x
- React 19.3
- TypeScript strict
- Electron Forge 7 + Vite 5
- SQLite locale via `node:sqlite`, encapsulé derrière `DatabaseAdapter`
- SQL et migrations versionnées sans ORM lourd pour la V1
- renderer isolé ; fichiers/base/PDF dans le main process via IPC typé
- Monaco Editor prévu pour visualiser/éditer le code sans l'exécuter
- PDF prévu via rendu HTML + `webContents.printToPDF()`
- workspace local configurable, par défaut dans Documents
- sauvegarde quotidienne, manuelle, pré-migration et pré-restauration

## Parcours métier de référence

`Prospect → Devis → Client → Projet → Production → Livraison → Facturation → Maintenance → Statistiques`

## Décisions

### 2026-09-13 — Conception V1 validée

- Tous les grands modules fonctionnels sont validés.
- Trois thèmes : **AtoumWeb** (défaut), **Noir**, **Blanc**.
- Recherche globale ajoutée comme fonction transverse essentielle.
- Bibliothèque technique divisée en **Bibliothèque projet** et **Bibliothèque AtoumWeb**.
- Les modules réutilisables AtoumWeb sont préparés à partir d'exports fournis avec assistance, et non généralisés automatiquement par le CRM.
- Les sauvegardes enregistrent leur emplacement réel.

### 2026-09-13 — Architecture et modèle de données

- Application Windows locale Electron + React + TypeScript.
- SQLite locale, fichiers lourds hors base et référencés.
- Modèle V1 documenté dans `docs/DATA_MODEL_V1.md`.
- Journal d'activité centralisé et recherche reconstruisible.

### 2026-09-13 — Première fondation applicative

- Electron/React/Vite configurés sur `foundation/electron-react-sqlite`.
- Backend local SQLite + migrations + workspace ajouté.
- IPC sécurisé et preload minimal ajoutés.
- Shell de navigation et trois thèmes ajoutés.
- Sauvegarde quotidienne/manuelle/pré-migration et restauration avec sauvegarde `pre-restore` ajoutées.
- Pile de build conservatrice retenue : Forge 7.11.2 + Vite 5.4.19 + TypeScript 5.9.2.
- Workflow CI ajouté mais les exécutions GitHub observées n'ont pas obtenu de runner (aucune étape exécutée) ; validation réelle toujours requise sur runner/PC Windows.

## Travail en cours

**Validation exécutable de la fondation puis première PR vers `main`.**

## Blocages / points ouverts

- Les runs GitHub Actions observés se terminent avant l'exécution des étapes (runner absent). Ce n'est pas un échec de compilation démontré.
- `package-lock.json` devra être généré par un `npm install` effectif puis versionné.

## Prochaines actions

1. Valider l'installation et les tests sur Windows/Codex avec accès npm.
2. Générer `package-lock.json`.
3. Corriger les éventuelles erreurs révélées par typecheck/tests/démarrage.
4. Valider la PR de fondation.
5. Démarrer le socle CRM : contacts, prospects, clients et recherche globale réelle.

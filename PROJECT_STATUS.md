# AtoumWeb Manager — Suivi du projet

> Fichier de référence partagé entre AtoumWeb, ChatGPT et Codex. Il doit être mis à jour à chaque étape importante du développement.

## État général

- **Projet** : AtoumWeb Manager
- **Version cible actuelle** : V1
- **Statut global** : Fondation implémentée — validation exécutable requise — Phases 1 CRM et 2 Commercial préparées
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Branche de travail actuelle** : `foundation/electron-react-sqlite`
- **PR actuelle** : #3 — Fondation V1 — Electron, React, SQLite et shell AtoumWeb (brouillon)
- **Principe** : une donnée possède une source unique ; les autres écrans la référencent sans duplication.

## Références

- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md` — fonctionnel
- `docs/ARCHITECTURE.md` — architecture technique
- `docs/DATA_MODEL_V1.md` — modèle de données cible V1
- `docs/ROADMAP_V1.md` — ordre de développement
- `docs/DEVELOPMENT.md` — démarrage local
- `docs/PHASE_1_CRM.md` — Contacts / Prospects / Clients / Recherche
- `docs/PHASE_1_CRM_ISSUES.md` — découpage Phase 1
- `docs/PHASE_2_COMMERCIAL.md` — Offres & Tarifs + Devis

## Phase 0 — Fondation

- [x] Dépôt GitHub et documentation de référence
- [x] Architecture technique et modèle de données
- [x] Branche `foundation/electron-react-sqlite`
- [x] Electron Forge + React + TypeScript
- [x] Séparation `main / preload / renderer / shared`
- [x] Sécurité Electron (`contextIsolation`, `nodeIntegration: false`, sandbox)
- [x] SQLite via `node:sqlite` derrière `DatabaseAdapter`
- [x] Migrations SQLite + première migration système
- [x] Workspace local configurable
- [x] Sauvegardes quotidienne / manuelle / pré-migration
- [x] Restauration sécurisée avec copie `pre-restore`
- [x] Shell V1 et trois thèmes
- [x] Réglages minimum et retour au thème AtoumWeb
- [x] Premiers tests et workflow CI
- [ ] Générer/versionner `package-lock.json`
- [ ] Valider `npm install`, typecheck, tests et `npm start` sur Windows
- [ ] Valider packaging Windows
- [ ] Finaliser/fusionner PR #3

## Phase 1 — Socle CRM — préparation terminée

- [x] Organisations / Contacts comme identité commune
- [x] Prospects et stages Kanban
- [x] Température, source, budget, valeur, prochaine action
- [x] Perdu avec raison
- [x] Conversion Prospect → Client transactionnelle/idempotente
- [x] Liste Clients + statuts Actif/Inactif/Archivé
- [x] Fiche Client : Résumé / Contacts / Commercial / Historique
- [x] Rôles contacts multiples
- [x] Archivage/réactivation
- [x] Journal d’activité Phase 1
- [x] Recherche globale Prospect/Client/Organisation/Contact
- [x] Tests et critères d’acceptation
- [x] Issues #4 à #9 créées
- [ ] Code Phase 1 après fusion de la fondation

## Phase 2 — Commercial — préparation terminée

- [x] Services et Offres distincts
- [x] Catalogue versionné
- [x] États item/version
- [x] Modes de tarification
- [x] Prix AtoumWeb + prix conseillé interne
- [x] Assistant Devis en 6 étapes
- [x] Lignes catalogue + lignes libres
- [x] Snapshots de devis indépendants du catalogue futur
- [x] Quantités déterministes via `quantity_milli`
- [x] Remises : calcul séparé de la raison commerciale
- [x] Valeur catalogue / remise / valeur contractuelle distinctes
- [x] Numérotation `DEV-YYYY-001`
- [x] Statuts Brouillon / Envoyé / Vu / Accepté / Refusé / Expiré / Annulé
- [x] Acceptation prospect → client dans la même transaction
- [x] Devis accepté figé
- [x] Handoff « prêt à transformer en projet » sans faux projet provisoire
- [x] Prévisualisation client + PDF prévue
- [x] Issues #10 à #15 créées
- [ ] Code Phase 2 après validation Phase 1

## Avancement par module

| Module | Conception | Développement | Tests | Statut |
|---|---|---|---|---|
| Accueil / Dashboard | ✅ | 🟡 socle | ⬜ | Shell de fondation |
| Recherche globale | ✅ | 🟡 shell | ⬜ | Phase 1 — #8 |
| Prospects | ✅ | ⬜ | ⬜ | Phase 1 — #6 |
| Clients | ✅ | ⬜ | ⬜ | Phase 1 — #7 |
| Offres & Tarifs | ✅ | ⬜ | ⬜ | Phase 2 — #11 |
| Devis | ✅ | ⬜ | ⬜ | Phase 2 — #12 à #15 |
| Projets | ✅ | ⬜ | ⬜ | Prochaine phase à préparer |
| Fichiers & Ressources projet | ✅ | ⬜ | ⬜ | À développer avec Projets |
| Bibliothèque projet | ✅ | ⬜ | ⬜ | À développer |
| Bibliothèque AtoumWeb | ✅ | ⬜ | ⬜ | À développer |
| Timer global | ✅ | 🟡 shell | ⬜ | Widget visible, logique à raccorder |
| Gestion des temps | ✅ | ⬜ | ⬜ | À développer |
| Interventions & Maintenance | ✅ | ⬜ | ⬜ | À développer |
| Packs d'heures | ✅ | ⬜ | ⬜ | À développer |
| Facturation / suivi Abby | ✅ | ⬜ | ⬜ | À développer |
| Dépenses AtoumWeb | ✅ | ⬜ | ⬜ | À développer |
| Documents & Contrats | ✅ | ⬜ | ⬜ | PDF devis amorcé en Phase 2 |
| Sauvegardes | ✅ | 🟡 fondation | ⬜ | DB locale implémentée |
| Annuaire interne | ✅ | ⬜ | ⬜ | À développer |
| Statistiques | ✅ | ⬜ | ⬜ | À développer |
| Journal d'activité | ✅ | 🟡 schéma | ⬜ | Normalisation prévue #5 |
| Réglages généraux | ✅ | 🟡 socle | ⬜ | Thème/workspace/DB présents |
| Thèmes AtoumWeb / Noir / Blanc | ✅ | ✅ socle | ⬜ | Implémentés, validation requise |

## Règles fonctionnelles à ne pas casser

1. Une donnée métier possède une source unique.
2. Les devis conservent leur snapshot ; le catalogue futur ne les modifie jamais.
3. Les modèles de projets sont versionnés ; une nouvelle version ne modifie pas les anciens projets.
4. Archivage réversible plutôt que suppression destructive.
5. Un seul timer actif dans toute l’application.
6. Valeur commerciale, montant facturé et montant encaissé restent distincts.
7. Abby reste l’outil de facturation réglementaire en V1.
8. Une maintenance mensuelle est une période, pas un nouveau projet.
9. Bibliothèque projet = réel utilisé ; Bibliothèque AtoumWeb = version générique indépendante.
10. Le code stocké n’est jamais exécuté automatiquement.
11. Une sauvegarde serveur n’est pas une sauvegarde locale.
12. Ressources projet et documents client restent distincts.
13. Les documents maîtres sont référencés, pas dupliqués.
14. Recherche globale et journal d’activité sont transverses.
15. Prospect et Client utilisent les mêmes `organizations` / `contacts`.
16. Conversion Prospect → Client idempotente.
17. Une version Catalogue publiée n’est pas modifiée rétroactivement.
18. Un devis accepté est figé.
19. Phase 2 ne crée pas de projet provisoire : la transformation complète est Phase 3.
20. Trois thèmes : AtoumWeb par défaut, Noir, Blanc.

## Architecture technique décidée

- Electron 44.x
- React 19.3
- TypeScript 5.9 strict
- Electron Forge 7.11.2 + Vite 5.4.19
- SQLite locale via `node:sqlite` derrière `DatabaseAdapter`
- SQL + migrations versionnées sans ORM lourd
- renderer isolé ; accès système uniquement via IPC typé
- Monaco Editor prévu pour la bibliothèque technique
- PDF via HTML + `webContents.printToPDF()`
- workspace local configurable
- sauvegarde quotidienne, manuelle, pré-migration et pré-restauration

## Parcours métier de référence

`Prospect → Devis → Client → Projet → Production → Livraison → Facturation → Maintenance → Statistiques`

## Décisions du 13/09/2026

### Conception V1

- Tous les grands modules fonctionnels validés.
- Recherche globale essentielle.
- Bibliothèque projet et Bibliothèque AtoumWeb séparées.
- Généralisation d’un module projet non automatique.
- Sauvegardes avec emplacement réel.

### Fondation

- Application locale Electron/React/TypeScript + SQLite.
- Shell, thèmes, workspace et sauvegarde/restauration implémentés sur la branche de fondation.
- CI présente mais aucun runner GitHub n’a encore réellement exécuté les commandes (`runner_id=0`, `steps=[]`).

### Phase 1 préparée

- Identité partagée organisations/contacts.
- Conversion Prospect → Client sans copie ni doublon.
- Kanban, Clients, journal et recherche globale détaillés.
- Issues #4 à #9.

### Phase 2 préparée

- Catalogue Services/Offres versionné.
- Snapshot obligatoire des devis.
- Ajustements commerciaux avec valeur catalogue conservée.
- Acceptation prospect → client intégrée.
- Devis accepté figé puis signalé « prêt à transformer en projet ».
- Issues #10 à #15.

## Travail en cours

**Valider la fondation exécutable. Les Phases 1 et 2 sont déjà préparées et prêtes à être confiées à Codex dans l’ordre prévu.**

## Blocages / points ouverts

- Les runs GitHub Actions observés n’ont obtenu aucun runner ; aucune commande npm n’a réellement été exécutée.
- `package-lock.json` doit être produit par un `npm install` réel.

## Prochaines actions

1. Valider la fondation sur Windows/Codex.
2. Finaliser et fusionner PR #3.
3. Développer Phase 1 : #5 → #6/#7/#8 → #9.
4. Développer Phase 2 : #11 → #12 → #13/#14 → #15.
5. Préparer Phase 3 Projets : transformation d’un devis accepté, modèles versionnés, lots/modules/tâches, ressources et prérequis.

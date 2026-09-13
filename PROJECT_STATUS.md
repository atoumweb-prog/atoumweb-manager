# AtoumWeb Manager — Suivi du projet

> Fichier de référence partagé entre AtoumWeb, ChatGPT et Codex. Il doit être mis à jour à chaque étape importante du développement.

## État général

- **Projet** : AtoumWeb Manager
- **Version cible actuelle** : V1
- **Statut global** : Conception fonctionnelle, architecture technique et modèle de données validés — socle applicatif à créer
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Principe** : une donnée possède une source unique ; les autres écrans la référencent sans duplication.

## Références

- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md` — fonctionnel
- `docs/ARCHITECTURE.md` — architecture technique décidée
- `docs/DATA_MODEL_V1.md` — modèle de données cible V1
- `docs/ROADMAP_V1.md` — ordre de développement

## Phase actuelle

### Phase 0 — Fondation

- [x] Créer le dépôt GitHub `atoumweb-manager`
- [x] Ajouter le README
- [x] Ajouter `AGENTS.md`
- [x] Ajouter ce fichier `PROJECT_STATUS.md`
- [x] Ajouter le cahier des charges fonctionnel V1 en Markdown
- [x] Définir et documenter l'architecture technique
- [x] Définir le modèle de données initial
- [x] Définir la stratégie de stockage utilisateur
- [x] Définir la stratégie de sauvegarde/restauration de la base du CRM
- [x] Préparer la roadmap V1
- [x] Ajouter un modèle d'issue GitHub
- [x] Créer l'issue de pilotage #1
- [ ] Créer le socle Electron / React / TypeScript
- [ ] Créer l'arborescence de code
- [ ] Ajouter le moteur de migrations SQLite
- [ ] Ajouter les premiers tests et la CI GitHub

## Avancement par module

| Module | Conception | Développement | Tests | Statut |
|---|---|---|---|---|
| Accueil / Dashboard | ✅ | ⬜ | ⬜ | À développer |
| Recherche globale | ✅ | ⬜ | ⬜ | À développer |
| Prospects | ✅ | ⬜ | ⬜ | À développer |
| Clients | ✅ | ⬜ | ⬜ | À développer |
| Offres & Tarifs | ✅ | ⬜ | ⬜ | À développer |
| Devis | ✅ | ⬜ | ⬜ | À développer |
| Projets | ✅ | ⬜ | ⬜ | À développer |
| Fichiers & Ressources projet | ✅ | ⬜ | ⬜ | À développer |
| Bibliothèque projet | ✅ | ⬜ | ⬜ | À développer |
| Bibliothèque AtoumWeb | ✅ | ⬜ | ⬜ | À développer |
| Timer global | ✅ | ⬜ | ⬜ | À développer |
| Gestion des temps | ✅ | ⬜ | ⬜ | À développer |
| Interventions & Maintenance | ✅ | ⬜ | ⬜ | À développer |
| Packs d'heures | ✅ | ⬜ | ⬜ | À développer |
| Facturation / suivi Abby | ✅ | ⬜ | ⬜ | À développer |
| Dépenses AtoumWeb | ✅ | ⬜ | ⬜ | À développer |
| Documents & Contrats | ✅ | ⬜ | ⬜ | À développer |
| Sauvegardes | ✅ | ⬜ | ⬜ | À développer |
| Annuaire interne | ✅ | ⬜ | ⬜ | À développer |
| Statistiques | ✅ | ⬜ | ⬜ | À développer |
| Journal d'activité | ✅ | ⬜ | ⬜ | À développer |
| Réglages généraux | ✅ | ⬜ | ⬜ | À développer |
| Thèmes AtoumWeb / Noir / Blanc | ✅ | ⬜ | ⬜ | À développer |

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
- Electron Forge, template Webpack + TypeScript
- SQLite locale via `node:sqlite`, encapsulé derrière une couche repository/adapter
- SQL et migrations versionnées sans ORM lourd pour la V1
- renderer isolé du système ; fichiers/base/PDF dans le main process via IPC typé
- Monaco Editor pour visualiser/éditer le code sans l'exécuter
- PDF via rendu HTML + `webContents.printToPDF()`
- workspace local configurable, par défaut dans Documents
- sauvegarde quotidienne de la base + sauvegarde avant migration

## Parcours métier de référence

`Prospect → Devis → Client → Projet → Production → Livraison → Facturation → Maintenance → Statistiques`

Lorsqu'un devis est accepté, le CRM doit pouvoir :

- créer ou rattacher le client ;
- créer le projet ;
- appliquer la bonne version du modèle de projet ;
- ajouter les options/prestations du devis ;
- générer lots, modules, tâches et prérequis ;
- créer l'arborescence Fichiers & Ressources ;
- initialiser la Bibliothèque projet ;
- relier devis et contrat ;
- préparer les éléments à facturer ;
- rendre le projet disponible dans le timer et la gestion des temps.

## Décisions

### 2026-09-13 — Conception V1 validée

- Tous les grands modules fonctionnels sont validés.
- Trois thèmes : **AtoumWeb** (défaut), **Noir**, **Blanc**.
- Bouton de retour aux réglages par défaut, sans suppression de données métier.
- Recherche globale ajoutée comme fonction transverse essentielle.
- Bibliothèque technique divisée en **Bibliothèque projet** et **Bibliothèque AtoumWeb**.
- Les modules réutilisables AtoumWeb sont préparés à partir d'exports fournis (JSON/Divi/code) avec assistance, et non généralisés automatiquement par le CRM.
- Les sauvegardes doivent enregistrer leur emplacement réel ; une copie sur serveur n'est pas une copie locale.

### 2026-09-13 — Dépôt GitHub initialisé

- Dépôt privé créé : `atoumweb-prog/atoumweb-manager`.
- Documentation de démarrage ajoutée sur `main`.
- Cahier des charges V1 ajouté en Markdown pour Codex.
- Roadmap et modèle d'issue ajoutés.

### 2026-09-13 — Architecture et modèle de données décidés

- Application Windows locale Electron + React + TypeScript.
- SQLite locale, fichiers lourds conservés hors base et référencés.
- Modèle de données V1 documenté dans `docs/DATA_MODEL_V1.md`.
- Recherche globale basée sur un index dérivé reconstruisible.
- Journal d'activité centralisé append-only.
- Sauvegarde/restauration de la base prévue dès le socle.

## Travail en cours

**Préparation du socle applicatif et des premières migrations SQLite.**

## Blocages

Aucun blocage fonctionnel connu.

## Prochaines actions

1. Créer une branche de fondation.
2. Initialiser Electron Forge + React + TypeScript.
3. Créer l'arborescence `main / preload / renderer / shared`.
4. Ajouter SQLite et le moteur de migrations.
5. Ajouter les réglages de workspace et la sauvegarde DB.
6. Ajouter les trois thèmes et le shell de navigation.
7. Ajouter les premiers tests et la CI GitHub.

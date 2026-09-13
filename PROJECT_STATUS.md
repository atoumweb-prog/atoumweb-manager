# AtoumWeb Manager — Suivi du projet

> Fichier de référence partagé entre AtoumWeb, ChatGPT et Codex. Il doit être mis à jour à chaque étape importante du développement.

## État général

- **Projet** : AtoumWeb Manager
- **Version cible actuelle** : V1
- **Statut global** : Conception fonctionnelle validée — dépôt GitHub initialisé — architecture technique à définir
- **Dépôt** : `atoumweb-prog/atoumweb-manager`
- **Branche stable** : `main`
- **Principe** : une donnée possède une source unique ; les autres écrans la référencent sans duplication.

## Référence fonctionnelle

Document principal pour Codex :

- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md`

Le DOCX complet reste le document humain de référence hors dépôt si nécessaire.

## Phase actuelle

### Phase 0 — Initialisation du projet

- [x] Créer le dépôt GitHub `atoumweb-manager`
- [x] Ajouter le README
- [x] Ajouter `AGENTS.md`
- [x] Ajouter ce fichier `PROJECT_STATUS.md`
- [x] Ajouter le cahier des charges fonctionnel V1 en Markdown
- [x] Ajouter un espace de décision pour l'architecture (`docs/ARCHITECTURE.md`)
- [x] Préparer la première roadmap de développement (`docs/ROADMAP_V1.md`)
- [x] Ajouter un modèle d'issue GitHub
- [x] Créer la première issue de pilotage GitHub (#1)
- [ ] Choisir et documenter l'architecture technique
- [ ] Définir le modèle de données initial
- [ ] Créer la structure de dossiers applicative
- [ ] Définir la stratégie de sauvegarde de la base du CRM

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
- `docs/ARCHITECTURE.md` créé pour documenter les choix techniques.
- Roadmap V1 ajoutée.
- Première issue de pilotage créée : **#1 — Phase 0 — Définir l’architecture technique et le modèle de données**.

## Travail en cours

**Architecture technique et modèle de données à préparer avant le premier développement applicatif.**

## Blocages

Aucun blocage fonctionnel connu.

## Prochaines actions

1. Définir l'architecture technique de l'application.
2. Définir le modèle de données initial.
3. Définir l'arborescence du code source et du stockage utilisateur.
4. Définir la sauvegarde/restauration de la base du CRM.
5. Créer le socle applicatif sur une branche dédiée.

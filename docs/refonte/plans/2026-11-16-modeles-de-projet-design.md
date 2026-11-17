# Fiche : des modèles de projet pour toutes les offres

Statut : **validée par Carlos le 16/11/2026** (règle J, fiche avant le code), réponses en section 6. L'écriture dans la préproduction reste soumise à un accord explicite après la simulation (section 5).
Skills : `atoumweb-design` (aucun écran nouveau : seules les données changent), `superpowers:brainstorming`.

## 1. Pourquoi

Quand un devis est accepté, le Manager crée le projet à partir du **modèle de projet** relié à l'offre vendue : la liste des lots et des tâches à réaliser pour la mener à terme. Sans modèle relié, il refuse de créer le projet (« Aucun blueprint de base n'est lié à ce devis »).

Aujourd'hui, dans la base de test (Manager-Claude-Codex) :

- 125 offres actives sur 126 sont publiées : le catalogue et les devis fonctionnent pour toutes ;
- **une seule offre est reliée à un modèle de projet** : « Site vitrine 5 pages », reliée à « AtoumWeb · Site vitrine » (6 lots, 28 tâches avec durées) ;
- trois modèles « TEST — Parcours vitrine / ecommerce / landing » existent, mais aucune offre n'y est reliée ;
- le référentiel du 12/11 (`scripts/referentiel/etapes.cjs`) propose des étapes pour chaque offre, regroupées en 35 ensembles. Elles ont trois provenances : Manuel métier (M), Manuel complété (MP), entièrement proposées (P, 66 offres).

But : qu'une offre vendue devienne un projet avec ses étapes, comme le site vitrine.

## 2. Trois natures d'offres

Le Manager distingue un modèle **de base** (il crée le projet) et un modèle **complément** (il ajoute des tâches au projet de base). Un devis doit toujours contenir une base. Et AGENTS.md fixe qu'une maintenance est une période de contrat, pas un nouveau projet.

| Nature | Offres (environ) | Traitement proposé |
|---|---|---|
| **A. Prestations qui deviennent un projet** | 79 : sites vitrines et boutiques, landing, mariage, identité visuelle, contenus, photo, SEO ponctuel, interventions techniques, développement, statistiques ponctuelles, newsletters ponctuelles | un **modèle de base** par ensemble d'étapes |
| **B. Options d'un site ou d'une landing** | 24 : options de site et de boutique (blog, portfolio, réservation, langue, newsletter, avis Google…), options de landing (section, rédaction, page merci, pop-up, langue), domaine mariage | un **modèle complément** qui ajoute ses tâches au projet du site vendu dans le même devis |
| **C. Services récurrents** | 24 : maintenances WordPress et WooCommerce, abonnements Google Business Profile et statistiques, newsletters récurrentes, hébergement Lune et domaine, renouvellement mariage, packs d'heures, maintenance applicative | **pas de modèle de projet** : ce sont des contrats ou des crédits d'heures, suivis par période dans Interventions et Maintenance |

## 3. Comment une étape du référentiel devient une tâche

1. **Les étapes d'avant-vente restent hors du projet.** « Qualifier le besoin », « Chiffrer au devis », « Faire accepter le devis » se font dans Prospection et Devis, avant que le projet existe. Le modèle commence à « Contrôler avant de démarrer ».
2. **Les encaissements deviennent des tâches de contrôle**, par exemple « Vérifier dans Abby l'encaissement de l'acompte de 40 % ». Abby reste seule à émettre les factures ; le Manager ne facture rien.
3. **Structure** : quatre lots au plus, dans cet ordre : Démarrage, Réalisation, Corrections et validation, Livraison. Chaque étape devient une tâche dans le lot correspondant.
4. **Provenance visible** : la description de chaque tâche reprend la provenance du référentiel. Les tâches proposées portent « Proposé, à valider ».
5. **Durées** : le référentiel n'en donne pas. Les tâches sont créées **sans durée estimée** (0 min), à compléter par Carlos dans l'éditeur de modèles. Le modèle vitrine existant garde ses durées.

## 4. Règles conservées

- Le modèle « AtoumWeb · Site vitrine » et son lien ne changent pas.
- Chaque nouveau modèle est publié en version 1 ; il ne touche aucun devis accepté ni aucun projet déjà créé (les projets gardent la version de modèle avec laquelle ils ont été créés).
- Les liens se font sur la version publiée actuelle de chaque offre. Une nouvelle version d'offre reprend ses liens par l'action habituelle du catalogue.
- Aucune donnée dupliquée : les étapes sont saisies une fois, dans le modèle ; le référentiel Word reste généré depuis le Manager.

## 5. Mise en œuvre proposée

1. Un script de préparation, sur le modèle de `scripts/preproduction/*.cjs` : il lit `etapes.cjs` et le catalogue, puis construit les modèles et les liens.
2. **Simulation d'abord** : le script écrit le résultat dans une copie jetable et produit un rapport (modèles, tâches, liens, offres non traitées). Carlos relit ce rapport.
3. Écriture dans la préproduction **seulement après accord explicite**, avec sauvegarde avant écriture et refus si le Manager est ouvert.
4. Contrôle : la recette commerciale native (F85) doit alors pouvoir créer un projet pour chaque offre de nature A et B. Les offres de nature C sont exclues de cette étape de la recette.
5. Tests automatiques du script sur une base construite (pas sur la préproduction), commit local après tests verts.

## 6. Décisions demandées à Carlos

1. **Les trois natures** (A projet, B complément, C service récurrent) et le classement proposé : d'accord ?
2. **Avant-vente hors du projet** (qualification, chiffrage, acceptation) : d'accord ?
3. **Encaissements en tâches de contrôle « Vérifier dans Abby »** : d'accord, ou les retirer du projet ?
4. **Durées vides** au départ, à compléter ensuite : d'accord, ou faut-il une durée indicative par tâche ?
5. **Étapes « proposées » (P)** : on les importe telles quelles avec la mention « Proposé, à valider », ou tu préfères les relire famille par famille avant l'import ?
6. **Boutique et landing** : on remplace les modèles « TEST — Parcours ecommerce » et « TEST — Parcours landing » par les nouveaux, ou on les garde à part ?

**Réponses de Carlos (16/11/2026)** :

1. Classement A / B / C : d'accord ; les services récurrents n'ont pas de modèle de projet.
2. Avant-vente hors du projet : d'accord.
3. Encaissements en tâches « Vérifier dans Abby l'encaissement de… » : d'accord.
4. et 5. Import des étapes proposées telles quelles, avec la mention « Proposé, à valider », et durées vides à compléter ensuite.
6. Modèles « TEST » de boutique et de landing : gardés à part ; des modèles neufs sont créés.

## 7. Hors de cette fiche

- Les 18 offres V39 sans code canonique et les 3 options prioritaires absentes (Livraison prioritaire Landing, Priorité contenu, Traitement prioritaire identité).
- Les 10 offres publiées que le pack du 08/11 marquait « à vérifier » ou « ancien sur devis ».
- Le suivi des services récurrents (nature C) dans Interventions et Maintenance.

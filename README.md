# AtoumWeb Manager

CRM / outil de gestion métier destiné à centraliser l'activité AtoumWeb : prospects, clients, offres, devis, projets, temps, interventions, maintenance, ressources, documents, suivi de facturation Abby, dépenses, bibliothèques techniques, sauvegardes et statistiques.

## Statut

**V1 — développement métier avancé. Projet V2 / atelier de production en recette sur `feature/project-blueprints-v1`.**

Documents de référence :

- `PROJECT_STATUS.md` — avancement réel, branche active, validations et prochaine action ;
- `docs/HANDOFF_CODEX_MSI.md` — état opérationnel à utiliser pour synchroniser Codex sur le MSI ;
- `AGENTS.md` — règles obligatoires pour Codex et tout agent travaillant sur le dépôt ;
- `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md` — périmètre fonctionnel V1 validé.

## Principe directeur

Une donnée métier possède une **source unique**. Les différents écrans peuvent la présenter ou la référencer, mais ne doivent jamais créer de copies divergentes simplement pour faciliter l'interface.

## Parcours métier principal

`Prospect → Devis → Client → Projet → Production → Livraison → Facturation → Maintenance → Statistiques`

## Règles majeures

- les devis acceptés restent figés ;
- les modèles de projets sont versionnés ;
- l'archivage est privilégié à la suppression destructive ;
- un seul timer peut être actif à la fois ;
- valeur commerciale, montant facturé et montant encaissé restent distincts ;
- Abby reste l'outil de facturation réglementaire en V1 ;
- le code de la bibliothèque peut être visualisé/édité sans exécution automatique ;
- les sauvegardes enregistrent leur emplacement réel : serveur, local, disque externe ou autre ;
- la Bibliothèque projet conserve le réel du client ; la Bibliothèque AtoumWeb conserve des versions génériques réutilisables préparées séparément.

## Développement

La branche `main` reste la référence Git historique mais elle est actuellement très en retard sur le socle fonctionnel. Le développement courant part du socle explicitement indiqué dans `PROJECT_STATUS.md`. Ne jamais choisir une ancienne branche Phase comme nouvelle base sans vérifier le suivi.
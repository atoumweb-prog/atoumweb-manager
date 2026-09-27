# AGENTS.md — AtoumWeb Manager

Ce fichier contient les règles de travail pour Codex et tout agent intervenant sur ce dépôt.

## Source de vérité

Avant toute modification importante, lire dans cet ordre :

1. `PROJECT_STATUS.md`
2. `docs/CAHIER_DES_CHARGES_FONCTIONNEL_V1.md`
3. `README.md`

Si une implémentation envisagée contredit le cahier des charges, ne pas improviser silencieusement : documenter le point dans `PROJECT_STATUS.md` et demander une décision.

## Principes obligatoires

- Ne pas dupliquer une donnée métier pour faciliter un écran.
- Préférer les relations/références vers une source unique.
- Ne jamais modifier rétroactivement un devis accepté ou un projet créé depuis une ancienne version de modèle.
- Conserver l'historique et privilégier l'archivage réversible.
- Ne jamais stocker de mots de passe WordPress ou d'autres secrets en clair.
- Ne pas exécuter automatiquement le code conservé dans les bibliothèques techniques.
- Ne pas considérer une sauvegarde distante comme une sauvegarde locale.
- Abby reste la source des factures réglementaires en V1.
- Une maintenance mensuelle est une période liée à un contrat/service de maintenance, pas un nouveau projet.
- Les modules génériques de la Bibliothèque AtoumWeb ne doivent jamais modifier automatiquement les versions utilisées par les projets clients.
- La généralisation d'un export client vers un module AtoumWeb réutilisable n'est pas automatique : elle passe par une étape volontaire d'adaptation/nettoyage.

## Suivi obligatoire

Pour le chantier Manager ↔ Bridge, lire également
[`docs/MANAGER_BRIDGE_ROADMAP.md`](docs/MANAGER_BRIDGE_ROADMAP.md) avant toute intervention.
Ce fichier est la feuille de route et le journal de coordination commun demandés par Carlos.
À chaque échange significatif, y consigner les consignes, décisions, validations, blocages et prochaines actions
selon son protocole ; distinguer proposition, autorisation et réalisation. Ne pas créer de feuille de route concurrente.
Une publication documentaire n'autorise aucun nouveau lot de code. Respecter les autorisations de commit/push de la session.

À chaque étape significative :

- mettre à jour `PROJECT_STATUS.md` ;
- cocher les tâches réellement terminées ;
- noter les décisions d'architecture importantes ;
- noter les blocages ;
- indiquer la prochaine action concrète.

## Qualité

Avant de considérer une fonctionnalité terminée :

- vérifier le parcours nominal ;
- tester les états vides ;
- tester les modifications et archivages ;
- vérifier qu'aucune donnée métier n'est dupliquée inutilement ;
- vérifier la cohérence avec les trois thèmes ;
- vérifier le comportement avec la recherche globale et le journal d'activité quand pertinent ;
- vérifier que les fichiers liés restent référencés depuis un emplacement maître unique.

## Git

- `main` doit rester stable.
- Développer les fonctionnalités dans des branches dédiées.
- Utiliser des commits compréhensibles.
- Préférer des PR petites et cohérentes plutôt qu'une énorme PR multi-modules.
- Ne pas modifier le périmètre fonctionnel sans l'inscrire dans `PROJECT_STATUS.md`.

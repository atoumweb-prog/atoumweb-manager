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

## Environnement de développement — décision AtoumWeb du 06/10/2026

Validation-MSI est une base de développement/test non productive. Les dossiers présents sont fictifs et peuvent être modifiés, remplacés ou supprimés pour les besoins de développement et recette, avec des libellés TEST explicites. Les règles de conservation ci-dessus restent des invariants du produit pour les futures données réelles ; elles ne rendent pas les données de recette intouchables.

Ne pas utiliser son SHA, ses comptages ou son contenu courant comme oracle de la suite automatisée normale. Tests métier sur fixtures déterministes ; tests de migrations sur bases temporaires construites par le registre. Intégrations sur Validation-MSI opt-in, identifiées comme telles, vérifiant propriétés métier/intégrité. Pas de copie ni rollback global systématique pour la recette utilisateur. Une sauvegarde reste nécessaire avant migration ou modification destructive importante.

Le banc operational-recipe reste technique, sur source maîtrisée, sans invariant Validation-MSI. La vraie recette passe par les interfaces Devis et Projet. Les gardes draft/published/ready ne doivent pas être contournés. Aucune publication ou activation n'est autorisée par un audit.

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
- vérifier le rendu sur le thème travaillé (Noir / Confort pendant la refonte, décision du 13/11/2026) ; les thèmes AtoumWeb et Blanc sont mis à jour une fois la refonte terminée ;
- vérifier le comportement avec la recherche globale et le journal d'activité quand pertinent ;
- vérifier que les fichiers liés restent référencés depuis un emplacement maître unique.

## Git

- `main` doit rester stable.
- Développer les fonctionnalités dans des branches dédiées.
- Utiliser des commits compréhensibles.
- Préférer des PR petites et cohérentes plutôt qu'une énorme PR multi-modules.
- Ne pas modifier le périmètre fonctionnel sans l'inscrire dans `PROJECT_STATUS.md`.

## Recette visuelle — économie de contexte (22/10/2026)

Pour la refonte visuelle du Manager, lire une fois [les consignes et la reprise courte](docs/ux-v2/CONSIGNES-ET-REPRISE.md). Ce mémo synthétise les décisions utilisateur, le périmètre et la dernière livraison ; il ne remplace pas PROJECT_STATUS ni les règles métier ci-dessus. Ne pas recopier le chat complet dans les instructions.

## Règles de travail de la refonte : validées par Carlos le 13/11/2026

Ces dix règles précisent la façon de travailler pendant la refonte visuelle et ergonomique. Elles ne touchent ni aux règles métier ni aux invariants ci-dessus. Détail et justification : `docs/refonte/DESIGN.md`, section 11.

- **A. Trois niveaux de décision.** *Autonome* : ce qui applique la charte (jetons, plancher de 14 px, états vides, casse, libellés, composants partagés), vu par Carlos en fin de lot. *À valider par lot* : la disposition d'un écran, sur la fiche de refonte. *Décision de Carlos* : données, règles métier, légal, ordre du parcours.
- **B. Parcours Prospect → Devis → Projet.** L'ordre des étapes et les règles restent figés. Points d'entrée, libellés, regroupements et mise en page sont libres dans un lot validé.
- **C. Commit.** Commit local par lot autorisé d'avance, seulement après tests verts et captures vues par Carlos. Push, PR et fusion : sur accord explicite.
- **D. Lancement de l'application.** Autorisé à volonté pour captures et vérifications, sur copie jetable d'une base fictive, sans port de débogage, avec contrôle d'empreinte de la source.
- **E. Densité.** Confort seule pendant la refonte, comme le thème Noir ; Compact et Confort + sont vérifiés à la fin avec les thèmes AtoumWeb et Blanc.
- **F. Nettoyage.** Le code et les feuilles CSS prouvés inutilisés (recherche, build et tests verts) peuvent être retirés, listés dans le lot, réversibles par l'historique. Une fonction réelle n'est jamais retirée.
- **G. Journal et document de référence.** Les décisions validées par Carlos dans le chat et le journal de travail sont consignés sans redemander le texte. Tout changement de fond de `docs/refonte/DESIGN.md` lui est montré.
- **H. Scripts de recette.** Les exigences figées sur le nombre de feuilles CSS sont remplacées par des règles durables (ordre relatif des couches). Les scénarios de devis sont réécrits dans le lot concerné.
- **I. Plans.** Un écart mineur (même périmètre, même résultat) est consigné dans le plan par une ligne « révision » ; un changement de périmètre demande l'accord de Carlos.
- **J. Deux validations par lot.** La fiche avant le code, puis la recette sur captures avant / après.

Ce qui ne change pas : aucune donnée métier dupliquée, devis acceptés jamais modifiés, Abby seule à émettre les factures, « Contacts » = regroupement d'affichage sans migration, pas de commit sur `main`, plancher de 14 px.

# Clôture de la convergence contractuelle — préparation de l’intégration

Date : 31 octobre 2026. Branche : `codex/contract-convergence-audit-20261031`. PR : #161.

## 1. Travail terminé

- Les 118 propositions rédactionnelles sont rapprochées sans ambiguïté de leurs 118 versions publiées d’origine.
- Les textes publiés, devis acceptés, contrats, snapshots et associations historiques sont préservés.
- La migration 76 versionne les titres et permet de préparer 118 nouvelles versions brouillon sans altérer les titres historiques.
- Les six évolutions Catalogue sont simulables et préparables en brouillon, avec réconciliation des deux maintenances mensuelles historiques sans doublon.
- La simulation, l’idempotence, le rollback et la conservation historique ont été contrôlés.
- Les 14 scénarios PDF ont été exécutés avec les propositions : 202 pages inspectées, sans défaut bloquant constaté.
- L’interface compare publié et proposé, affiche les différences, dépendances, décisions documentées et blocages.
- Les migrations 77 et 78 ajoutent une décision humaine individuelle ou groupée avec note obligatoire et un historique append-only par brouillon. Cette décision ne publie rien.

Le tableau exhaustif demandé est disponible dans [SUIVI-FINAL-118-CLAUSES-2026-10-31.csv](SUIVI-FINAL-118-CLAUSES-2026-10-31.csv). Il reprend le code, le titre, la famille, la vigilance, l’état rédactionnel, le contrôle technique et le véritable blocage documenté. Il ne réécrit aucune clause.

## 2. Lecture correcte du suivi des 118 clauses

Les 118 formulations ont été examinées et peuvent être préparées comme brouillons. Le contrôle technique prouve leur provenance, leur intégrité et leur capacité à être assemblées. Il ne vaut pas approbation juridique. Un niveau de vigilance élevé est une priorité de lecture, pas un défaut ni un refus automatique.

La décision humaine peut désormais être enregistrée dans le Manager avec deux résultats :

- **Prête à soumettre à publication** : rédaction acceptée pour l’étape de publication ultérieure ;
- **Révision demandée** : réserve explicite avec note.

Le relecteur, la date, la note, le brouillon exact et son empreinte sont conservés. Une confirmation native précède toute décision groupée. La publication reste une opération distincte.

## 3. Six évolutions commerciales

| Évolution | Décision commerciale | État |
| --- | --- | --- |
| `AW-MAINT-WP-M` | 49 €/mois, formule mensuelle de référence | Validée ; réconciliation historique testée ; brouillon prêt |
| `AW-MAINT-WC-M` | 99 €/mois, formule mensuelle de référence | Validée ; réconciliation historique testée ; brouillon prêt |
| `AW-MAINT-WP-A` | 539 €/an, choix exprès, pas de renouvellement annuel automatique | Validée ; brouillon prêt |
| `AW-MAINT-WC-A` | 1 089 €/an, choix exprès, pas de renouvellement annuel automatique | Validée ; brouillon prêt |
| Hébergement isolé | 149 €/an = 99 € hébergement + 50 € Lune, sans maintenance applicative | D09 et D10 validées ; brouillon prêt ; accès cPanel à décider |
| Migration externe | Hébergeur extérieur vers AtoumWeb payant sur devis ; transfert AtoumWeb vers AtoumWeb gratuit | Validée ; brouillon prêt |

Aucun de ces brouillons n’est publié et aucun tarif actif n’a été modifié.

## 4. Arbitrages documentés et décision cPanel clôturée

| Code et titre | Problème exact | Décision existante | Risque concret | Recommandation | Décision attendue |
| --- | --- | --- | --- | --- | --- |
| `CONS-MEDIATION` — Médiation de la consommation | Le texte nomme CM2C, mais l’adhésion effective et le champ de la convention ne sont pas prouvés dans le dépôt. | CM2C est l’organisme choisi. | Mentionner un médiateur non effectivement compétent. | Vérifier l’attestation ou la convention CM2C avant publication. | Confirmer l’adhésion effective et le périmètre couvert. |
| `MAINT-SAUVEGARDE` — Sauvegardes | La fréquence est définie par l’offre, mais la restauration et l’articulation avec l’hébergeur doivent correspondre au service réel. | Les sauvegardes ne garantissent pas à elles seules toute restauration. | Promesse opérationnelle supérieure au service fourni. | Conserver l’obligation de moyens et décrire les restaurations réellement incluses. | Confirmer le périmètre de restauration inclus. |
| `MAINT-RENOUVELLEMENT` — Durée et renouvellement | Le texte distingue mensuel et annuel ; le parcours opérationnel de fin doit être cohérent avec l’outil. | Annuel uniquement sur accord exprès, sans reconduction annuelle automatique. | Texte exact mais parcours réel différent. | Aligner le texte sur le moyen concret de résiliation et de renouvellement. | Confirmer le parcours opérationnel prévu. |
| `MAINT-INTERVENTIONS` — Nombre d’interventions ou temps inclus | Le non-cumul et le non-report sont rédigés mais pas encore marqués comme approuvés. | Les quotas mensuels ne forment pas une banque annuelle. | Contestation sur un solde supposé reportable. | Valider la formulation actuelle, qui respecte la décision commerciale. | Accepter la formulation ou préciser l’exception voulue. |
| `TECH-HEBERGEMENT` — Hébergement seul sans maintenance | **Résolu le 31/10/2026** : accès cPanel propre à la Lune remis sur demande du client, de façon sécurisée et traçable ; jamais le compte maître AtoumWeb. | Décision explicite du responsable ; proposition `TECH-HEBERGEMENT` actualisée sur #159 et #161. | Aucune validation supplémentaire sur le principe. | Vérifier seulement les modalités opérationnelles de remise sécurisée. | Décision commerciale clôturée. |

Les autres niveaux de vigilance restent visibles pour la revue humaine, sans être transformés artificiellement en 43 blocages.

## 5. État de l’interface de validation

L’interface permet maintenant :

1. de simuler sans écriture ;
2. de préparer explicitement les brouillons contractuels et Catalogue ;
3. de comparer la version publiée et le brouillon ;
4. de filtrer et sélectionner une clause ou un groupe cohérent ;
5. d’enregistrer « prête à soumettre » ou « révision demandée » avec relecteur et **note obligatoire**, refusée si vide ;
6. de relire la dernière décision, **toutes ses révisions successives dans un journal append-only**, et le journal d'activité.

Les décisions sont liées au brouillon exact. Une décision ultérieure ne détruit pas la précédente : la table d'événements créée par la migration 78 conserve chaque étape, tandis que la migration 77 maintient l'état courant. Un brouillon modifié doit repasser par une décision. Aucune absence de remarque ne vaut approbation. La publication n’est pas déclenchée par ce parcours.

## 6. Plan d’intégration des PR #158, #159 et #161

### Dépendances Git constatées

- PR #158 : `codex/internal-reference-handoff-20261027` → `main`, fusionnable mais contrôle GitHub `UNSTABLE` ;
- PR #159 : `chatgpt/humanisation-maintenance-socle-20261028` → branche #158, fusionnable et `CLEAN` ;
- PR #161 : `codex/contract-convergence-audit-20261031` → branche #159, fusionnable et `CLEAN`.

### Ordre sûr

1. Identifier et corriger le contrôle en échec de la PR #158 sans changer les données métier.
2. Sauvegarder la base utilisateur et vérifier `PRAGMA integrity_check`, les clés étrangères et le registre des migrations.
3. Fusionner #158 dans `main` après validation de ses contrôles.
4. Rebaser ou retargeter #159 sur le nouveau `main`, vérifier que son diff ne contient que les propositions documentaires attendues, puis la fusionner.
5. Rebaser ou retargeter #161 sur ce nouveau `main`, résoudre uniquement les conflits mécaniques, puis exécuter les tests ciblés et complets.
6. Déployer d’abord sur une copie de recette. Les migrations 76 et 77 sont additives.
7. Simuler, préparer les brouillons, enregistrer les décisions humaines, puis publier seulement par une action séparée et autorisée.

### Contrôles préalables et retour arrière

- sauvegarde fichier de la base et empreinte SHA-256 avant migration ;
- export du registre `schema_migrations`, des versions publiées, liens Catalogue et snapshots de devis ;
- test d’idempotence et `PRAGMA foreign_key_check` ;
- comparaison des 118 versions publiées et six versions Catalogue avant/après ;
- non-régression des devis, contrats figés et 14 scénarios PDF.

Avant publication, le retour arrière consiste à restaurer la sauvegarde de recette ou à supprimer uniquement les brouillons et décisions créés sur la copie. Après publication, aucune réécriture historique : une correction passe par une nouvelle version.

## 7. Résultats complémentaires

- TypeScript : réussi.
- Tests ciblés migration, frontière IPC et préservation : 32/32 réussis.
- Recette SQLite isolée de la décision groupée : réussie ; base source SHA-256 inchangée.
- Suite complète : 208 fichiers réussis, 1 ignoré ; 1 746 tests réussis, 1 ignoré.
- Paquet Electron : construit avec succès.


## Complément de finition du 31 octobre 2026

- **Accès cPanel : décidé par le responsable** : remise sur demande au client, limitée à sa propre Lune dédiée, via un moyen sécurisé et avec traçabilité ; jamais le cPanel principal d’AtoumWeb. Le texte `TECH-HEBERGEMENT` a été mis à jour dans les deux branches #159 et #161 ; aucune version active modifiée.
- **Historique des décisions** : migration additive 78, note obligatoire contrôlée côté interface et service ; insertion d’un événement distinct pour chaque décision, même si l’état courant est modifié. Des tests de non-régression ont été ajoutés, mais leur exécution sur le nouveau commit reste à confirmer en local.
- **CI de la PR #158** : le journal GitHub identifiait un timeout du test `crmReconciliationMigration.test.ts` (5 s, durée observée de 34 s sur Windows). Délai explicite de 120 s ajouté au test et reporté sur les branches #158, #159 et #161. **La nouvelle exécution CI GitHub n° 41232704332 sur #158 s'est terminée avec succès.** Ce succès ne constitue pas une validation indépendante de la PR #161.
- **CM2C** : organisme choisi, mais confirmation de l’adhésion/convention effective toujours requise avant publication de la clause consommateur.
- **Sauvegardes** : lieu de stockage effectif, redondance, restitution et modalités de restauration à confirmer par les configurations et procédures réelles avant toute promesse contractuelle. Ne pas inventer un lieu de stockage.
- **Résiliation électronique** : contrôler les canaux réels de souscription/résiliation et la fonctionnalité légalement requise selon le public et les modalités de conclusion, sans affirmer qu'une fonctionnalité est déjà en production.
- Ces changements ne représentent ni une approbation des 118 propositions, ni une publication, ni un feu vert de fusion.

- **Recette à relancer sur #161 après la migration 78** : vérifier `npm run typecheck`, les tests dédiés à l'historique, puis la suite complète et le paquet Electron. Ces nouveaux changements ont été versionnés sur GitHub, mais aucun résultat de CI sur ce dernier commit n'est encore disponible.

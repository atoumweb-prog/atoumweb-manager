# Rapport de convergence PR #161 / PR #164 — 2 novembre 2026

État : consolidation technique terminée sur `codex/rgpd-v3-site-agreements-20261101`, sans fusion, publication de clause, activation contractuelle ni écriture dans une base utilisateur.

## Corrections consolidées

- Envoi RGPD : l’action est nommée et stockée comme **attestation d’un envoi externe**. Le Manager ne prétend pas avoir transporté le message.
- Version transmise : canal, destinataire, référence, date et empreinte SHA-256 du contenu exact sont conservés.
- Signature : version et empreinte attendues sont exigées ; la preuve doit être un document actif du même client. Une tentative visant une autre version ne produit aucune écriture partielle.
- Historique : envoi, signature, preuve, révision et empreintes restent associés à la version concernée.
- Fiche Site : prestataires multiples modifiables, titulaire du compte, rôle RGPD, pays, autorisation, transfert hors EEE, mécanisme et date de vérification.
- Aucun transfert : la conclusion est refusée tant que chaque prestataire n’a pas été vérifié et déclaré hors EEE ou non.
- Absence de fiche : nouvel état d’évaluation `to_assess`; il bloque seulement un traitement concerné. Une conclusion `not_required` exige motif, relecteur et date de vérification.
- Migration 80 : structures additives, aucune création automatique d’accord, aucune modification de devis, contrat ou historique existant.
- Compatibilité convergence : attentes de tests mises à jour pour les migrations 78–80 ; purge de démonstration rendue compatible avec les nouveaux paramètres de lignes et tables RGPD.

## Blocage métier ciblé

Le service expose un contrôle par Site mais il n’est volontairement pas branché sur les chronos, la création de Projet ou les fonctions génériques.

Les opérations candidates identifiées sont celles qui manipulent effectivement des données personnelles du Site : hébergement, maintenance avec accès, migration/import, sauvegarde/restauration et support avec accès. Le raccord final doit être placé à l’entrée de chaque commande métier concernée, avec `siteId` et opération explicites. Il ne doit pas être placé sur un conteneur Projet ou un chrono sans rapport avec ces traitements.

Cette absence de raccord global est une protection contre un blocage excessif, pas une autorisation implicite de traitement. Elle reste à valider fonctionnellement avant le raccord opérationnel.

## Tests réellement exécutés

- `npm run typecheck` : réussi.
- Suite complète : **214 fichiers réussis, 1 fichier opt-in ignoré ; 1 771 tests réussis, 1 ignoré ; 0 échec**.
- Ciblés migrations 78/79/80, collisions et RGPD : **5 fichiers, 26 tests réussis**.
- Recette opt-in croisée sur copie SQLite : **1 test réussi**.
- `npm run package` : compilation et packaging Electron Windows x64 réussis.
- `git diff --check` : réussi.

La recette croisée a préparé dans la copie seulement 118 brouillons contractuels et 6 brouillons Catalogue, validé l’atomicité et l’historique des décisions, puis exécuté : évaluation sans fiche, accord requis, prestataire vérifié, absence de transfert vérifiée, attestation externe, empreinte SHA-256, refus d’une mauvaise version, preuve signée exacte, révision et nouveau blocage. Les empreintes des devis, clauses de devis, clauses publiées et versions Catalogue publiées sont identiques avant/après. La source SQLite est restée inchangée : SHA-256 `B742346AD076946531418F099DE8BC243812EDF62D332A3160E290645C4D7A12`.

## Campagne PDF

La campagne de convergence existante contient 14 scénarios, 103 contrôles, 14 exports IPC identiques et 10 modifications. Les **131 pages** ont été rendues et inspectées visuellement : identité AtoumWeb, tableaux, annexes, titres, signatures, marges et pieds de page sont lisibles ; aucune page vide, coupure, superposition ou contenu hors page observé.

L’écart avec les 129 pages du 27 octobre est expliqué par deux documents :

| Scénario | Ancien | Convergence | Écart |
|---|---:|---:|---:|
| DEV-TEST-01 | 7 | 8 | +1 |
| DEV-TEST-04 | 9 | 10 | +1 |
| 12 autres scénarios | 113 | 113 | 0 |
| **Total** | **129** | **131** | **+2** |

Les pages supplémentaires résultent de la redistribution du contenu contractuel ; elles ne sont ni vides ni tronquées. Les dernières pages parfois peu remplies contiennent l’acceptation et la signature communes au devis et à l’annexe.

## Git, dépendances et ordre d’intégration

- PR #161 : `codex/contract-convergence-audit-20261031` vers `chatgpt/humanisation-maintenance-socle-20261028` (#159).
- PR #164 : `codex/rgpd-v3-site-agreements-20261101` vers la branche de #161. Elle dépend donc explicitement de #161.
- Migrations : 78 historique des décisions, 79 identité versionnée des clauses, 80 accords RGPD. Registre sans collision ; ordre appliqué et rejoué avec succès.
- Ordre recommandé : **#158 vers `main`, puis #159, puis #161, puis #164**. Après chaque intégration, rebaser/retargeter la PR suivante sans réécrire l’historique déjà fusionné.

## Validation fonctionnelle restante

- Cliquer le parcours complet dans l’application packagée avec une fiche Site de recette : évaluation, prestataires, attestation externe, sélection de preuve, signature, révision et historique.
- Confirmer les libellés et les champs métier avec AtoumWeb, notamment titulaire du compte et rôles des prestataires réels.
- Décider précisément quelles commandes d’hébergement, maintenance, migration, sauvegarde et support appelleront le contrôle ciblé.
- Ne raccorder ce contrôle qu’après cette cartographie ; ne pas bloquer les chronos, projets ou fonctions non concernés.
- Aucune validation juridique globale n’est déduite des tests techniques. Les clauses restent en brouillon jusqu’à décision humaine explicite.

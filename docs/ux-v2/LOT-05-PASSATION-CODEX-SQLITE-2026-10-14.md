# LOT 05 — Passation Codex avant convergence (14 octobre 2026)

**Branche :** `integration/ux05-candidate-20261014` — **PR #121 draft**. Aucune fusion autorisée dans `main`.
**Socle :** lots 01–03, migrations SQLite 1–66. Les versions historiques, CGV publiées et preuves Abby ne doivent pas être modifiées.

## Périmètre réellement démontré

| Sous-lot | Livré sur la branche | Non terminé / réserve |
| --- | --- | --- |
| 05A Audit | Cartographie et analyse des parcours existants | Revalidation face au `main` final |
| 05B Bibliothèque | Interface de classement, contrôle des brouillons UX-01, navigation, tests automatisés TEMP | Recette visuelle Windows et parcours clavier réels |
| 05C Rubriques | Huit rubriques canoniques, classement proposé/approuvé par version, persistance SQLite, IPC, tests de politiques et planificateur de brouillon en lecture seule | **Raccordement effectif au compilateur des nouveaux devis, règles contextuelles issues du catalogue et conflit bloquant dans le flux réel** ; revue juridique humaine indispensable |
| 05D Builder | Brouillons préservés, historique/frozen séparés, sommaire, navigation et comparaison d'impact en lecture seule | Recette Electron UX complète, orchestration du 05C et compatibilité lot 06 |
| 05E Documents | Prévisualisation, copie Abby à partir des valeurs enregistrées, comparaison TXT/DOCX sans écriture, export DOCX de travail au format OpenXML, tests unitaires d'aller-retour | Mise en forme DOCX complexe, fidelity round-trip document original, export PDF de travail clairement distinct, preuves Abby bout-en-bout, vérification native Windows, interopérabilité lot 09 |
| 05F Recette | CI Windows, tests unitaires, plusieurs recettes TEMP et protections croisées | Matrice complète 25 cas, visualisation/clavier humain, non-régression exhaustive après convergence |

Un **test vert n'est pas une validation juridique**. Ne jamais classifier automatiquement les clauses réelles : les propositions exigent une validation nominative humaine avant approbation/publication.

## SQLite — réservation 69, aucun changement autorisé pour l'instant

- `main` : 66 migrations.
- **Code actuel du lot 05** : `src/main/database/contractSectionReviewMigration.ts` déclare `id:67`, `name:'contract_clause_section_review_v1'`. `src/main/database/migrations.ts` enregistre cette migration, et `migrations.test.ts` attend 67.
- Collision confirmée **dans le code** avec le lot 04 : attribution envisagée 67 et 68 pour 04, **69 pour 05**. Aucun changement de numéro dans le lot 05 tant que les bases persistantes ne sont pas inventoriées.
- `migrationCollisionAudit.ts` + tests : interprétation **en lecture seule** des cas 67/69, ne lit/modifie aucune base par lui-même.
- **Inconnu :** la migration 67 du lot 05 a-t-elle été appliquée à une base locale persistante Windows ? Les CI TEMP ne permettent pas de le savoir.

### Protocole Codex, avant convergence

1. Localiser toutes les bases Windows concernées et leurs copies de sauvegarde ; documenter leur destination, la nature des données, leur caractère reconstructible et créer une sauvegarde testée des bases à conserver.
2. Sur une connexion strictement **en lecture seule** exécuter :
   ```sql
   SELECT id, name, applied_at FROM schema_migrations ORDER BY id;
   SELECT type, name FROM sqlite_master
   WHERE name IN ('contract_clause_section_reviews','idx_contract_section_review_sort');
   SELECT COUNT(*) FROM contract_clause_section_reviews;
   ```
   La dernière requête n'est applicable que si la table existe. Ne pas insérer/effacer d'historique dans `schema_migrations`.
3. Si **aucune** base persistante n'a appliqué l'ancienne 67 du lot 05 : après accord du coordinateur, renuméroter uniquement la déclaration 05 de 67 vers **69**, mettre à jour le test 67 et valider la séquence unique 1–69 sur une base TEMP neuve et une copie du schéma 1–66.
4. Si une base contient `67/contract_clause_section_review_v1` : préserver sa ligne, ses données et son schéma. **Bloquer le changement automatique** ; produire un plan de compatibilité ou de reconstruction sur copie, avec décision du coordinateur et sauvegarde avant toute écriture. Tenir compte de la 67 du lot 04 qui n'a pas pu s'exécuter sous le même numéro.
5. Si une base contient la 67 du lot 04, **ne pas considérer** la migration contractuelle comme appliquée : `getPendingMigrations` ne compare actuellement que les identifiants, non les noms. Le correctif 69 devra être traité au bon moment de la convergence.
6. Contrôler `PRAGMA foreign_key_check;`, `PRAGMA integrity_check;`, les duplications d'identifiants/noms, les requêtes de lecture réelles et les tests d'upgrade. Pas de changement des migrations 1–66.

## Contraintes d'intégration inter-lots

- **04 Catalogue** : utiliser les identités/versionIds réellement publiés, ne pas extrapoler les classifications juridiques à partir des catégories catalogue.
- **06 Devis** : compiler le contrat comme partie du devis ; éviter toute mutation des versions figées ; seules les conditions explicitement déterminées et les sections approuvées peuvent entrer dans un nouveau rendu juridiquement prêt.
- **09 Word/PDF** : conserver la séparation entre DOCX/PDF de travail et la pièce acceptée Abby ; aucun fichier exporté n'est une signature. Le parser DOCX présent est volontairement limité à l'extraction textuelle et ne garantit aucune fidélité de mise en forme. Le moteur DOCX d'export produit un document Word simple, pas un éditeur WYSIWYG.
- Ne publier automatiquement **aucun** texte juridique. Interdire toute preuve d'acceptation déduite d'un simple nom de fichier ou de métadonnées non vérifiées.

## Vérifications Codex réservées au poste Windows

- Inventaire et sauvegardes des vraies bases MSI, puis résolution 67 → 69 si compatible.
- Validation visuelle Electron, clavier et densités × thèmes, parcours d'édition, import/export Word/PDF avec documents utilisateurs représentatifs.
- Revues de diff et non-régressions lot 04 + 05 + 06 + 09 ; finalisation des sous-lots 05C/05E/05F encore incomplets.
- Confirmer HEAD, SHA et CI **au moment de la convergence** ; ne pas confondre une CI précédente avec la validation du dernier commit.

**Situation** : candidat de développement actif, **pas une clôture technique complète**. La convergence et la fusion sont différées.

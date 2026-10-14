# Lot 09E — Word éditable, retour contrôlé et PDF de travail

**État : audit et amorçage technique, aucun flux DOCX prétendu opérationnel.**
Branche indépendante `feature/ux-v2-lot09e-word-drafts-20261014`, basée sur 09A/PR #113. PR draft séparée de 09B/09C/09D, sans merge dans main.

## Audit vérifié
- Le Manager installe Node/Electron/React/SQLite, mais **aucune dépendance DOCX ZIP/OOXML** (`docx`, `mammoth`, `jszip`, etc.) n'est installée dans `package.json`.
- `ContractTermsService.createVersion` crée déjà une nouvelle version de clause en `draft` ; `publishVersion` publie ensuite sous transaction. La voie Word ne doit jamais modifier directement une version publiée ou un Devis gelé.
- La simple importation de fichiers DOCX dans Documents Clients n'est **pas** un réimport de clauses ni une comparaison de versions.
- Les PDF Abby acceptés/signés et les preuves quote ne sont pas une source éditable.

## Étapes autonomes
1. Construire un module pur de manifeste/version/empreinte pour un brouillon de clause et un diff déterministe des paragraphes. Refuser `published`, `retired`, `frozen` et source périmée. **Aucune mutation** à ce stade.
2. Sélectionner et intégrer un véritable parseur/générateur OOXML offline, avec validation ZIP, protections contre les fichiers compressés malveillants, absence de macros/external fetch et tests DOCX réels. Mettre à jour le lockfile de manière reproductible (GitHub Windows).
3. Exporter le DOCX éditable avec manifeste attaché, puis importer dans TEMP : comparaison et signalement honnête des styles/listes/tableaux non supportés.
4. Valider humainement avant création d'une **nouvelle** version brouillon dans le propriétaire `ContractTermsService`, avec contrôle concurrent version + hash et journal. Pas de publication automatique.
5. PDF de **travail** explicitement distinct d'une facture Abby ou d'un devis signé.
6. Recette R09E-01 à R09E-17, TypeScript, Vitest, Electron Windows, UX-01, 3 thèmes × 3 densités, sans toucher aux pièces probantes.

## Risques et contraintes
- Le module d'empreinte/diff pur ne constitue pas une fonctionnalité Word utilisable. La clôture 09E sera refusée tant qu'export, import, analyse des pertes, conflit de version et validation humaine ne sont pas réellement testés.
- Le module propriétaire doit garder les clauses publiées et Devis gelés immuables ; aucune modification directe d'une preuve et aucune vérification juridique inventée.

## Implémentation 09E — jalon réel à valider
- Codec ZIP/OOXML `wordDocxCodec.ts` sans dépendance réseau ou ZIP externe : génération de **vrais DOCX** avec paragraphes modifiables et manifeste intégré `customXml/item1.xml` ; réimport offline strictement borné. Les macros, objets actifs, liens OOXML externes, ZIP corrompus, XML entités/DOCTYPE, images/tableaux/suivi des modifications non représentables sont refusés.
- IPC Electron sélectionne les fichiers par boîtes natives ; aucune lecture de chemin arbitraire transmis par le renderer. Session de prévisualisation en mémoire valable 20 min ; diff avant/après sans écriture.
- `ContractLibraryPage` : boutons exporter/réimporter sur **dernière version brouillon** seulement ; diff des paragraphes, avertissements de mise en forme et approbation explicite via case à cocher. Annuler ne modifie rien.
- `ContractTermsService.createReviewedWordDraft` crée une **nouvelle** version brouillon avec historique provenance, jamais une mutation de la version d'origine ni une publication, revalide ID/empreinte/source courante et fait rollback si le journal échoue.
- Limites honnêtes : Word riche (tableaux, images, changements suivis) non supporté ; si manifeste custom XML retiré par Word, import **refusé** (réexport). Styles simples visibles avec avertissement, non importés. PDF de travail distinct des preuves Abby à cadrer. Ne pas déclarer R09E-01..17 entièrement clos tant que la recette native et les tests de convergence ne sont pas verts.

## Campagne d'acceptation Word/PDF — 14/10/2026
- Export et import Word réellement raccordés à `ContractLibraryPage`, `ipcMain` et au preload. Les fichiers DOCX contiennent un package ZIP OOXML réel et un manifeste lié à la version de clause, consulté après sélection native du fichier.
- Diff textuel avant toute validation ; boîte de revue dans l'éditeur ; l'acceptation explicite crée une **nouvelle version brouillon** et une provenance historisée, annuler ou importer sans changement n'écrit rien.
- Blocages au service : source publiée/archivée, vieux manifest, document d'une autre clause, version modifiée depuis l'export, deuxième approbation du même import. Transactions avec rollback si la journalisation échoue.
- Format : texte/paragraphe seulement ; styles ou listes avec avertissement ; tableaux, images, macros, révisions suivies, ZIP suspect, DTD et liens externes refusés. Ne pas interpréter un style importé comme une mise à jour juridique.
- Export distinct **PDF de travail** via `printToPDF` Electron avec bannière « DOCUMENT DE TRAVAIL — NON SIGNÉ, NON PUBLIÉ, NON FACTURE ABBY », sans lien à la facturation ni au Devis signé.
- Nouvelle recette Electron `--lot09e` en TEMP : vraie navigation bibliothèque de 09A, export Word, PDF, annulation, diff vide, modification réelle d'un ZIP DOCX, approbation, test de version périmée et 3 thèmes × 3 densités.
- Première CI complète TypeScript/Vitest `#38605290730` verte avec 112 fichiers. Première recette Electron `#38605904519` a détecté une dépendance incorrecte aux tuiles 09D dans la fixture ; correction appliquée sur 09A. Réexécution complète du dernier code nécessaire avant validation technique. Aucun merge.

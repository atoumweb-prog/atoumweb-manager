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

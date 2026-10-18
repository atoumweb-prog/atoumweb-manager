# EC04 — Effets de bord des consultations et exports de fichiers

Cinq handlers précédemment non couverts sont maintenant protégés :
1. `expenses:open-receipt-version` : la création et la vérification de la copie temporaire du justificatif sont encadrées par le verrou, **pas** l'ouverture de cette copie par le logiciel associé.
2. `bridge:export-diagnostic` : écriture du JSON sous le verrou après la fenêtre de destination.
3. `contract-terms:word:export` : production et écriture du DOCX de travail sous le verrou, avec relecture du brouillon **après** la sélection du fichier et une éventuelle suspension EC04.
4. `contract-terms:word:pdf` : production asynchrone du PDF de travail sous le verrou, relecture de la source après attente.
5. `contract-terms:export-working-docx` : relecture de la présentation contractuelle avant génération du DOCX de travail.

Ces exports n'attestent **jamais** l'envoi d'un devis ni sa signature. Les boîtes de dialogue restent hors verrou : éviter de bloquer toutes les écritures pendant la décision d'un humain.

Ce sont des opérations physiques (fichier ou copie temporaire), pas une preuve exhaustive de couverture. Des écritures indirectes existent potentiellement parmi d'autres routes de lecture, ainsi que des tâches autonomes hors IPC ; la couverture EC04 globale reste non certifiée.

`WorkspaceFileSideEffectCoverage.test.ts` ajoute trois vérifications **statiques** du placement des gardes. Aucune migration SQLite, pas de modification de `main`, pas de sauvegarde complète activée, aucune recette Windows.

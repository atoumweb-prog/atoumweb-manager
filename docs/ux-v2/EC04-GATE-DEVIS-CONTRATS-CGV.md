# EC04 — Protection des écritures Devis / Contrats / CGV (incrément 12)

Branche : `feature/ec04-workspace-file-inventory-v1`.
Base avant incrément : `abbad992cce9576364d426392de599d8090bd644`.

## Périmètre développé

**56 handlers du registre IPC principal** sont nouvellement encadrés par le verrou partagé :

- Types de contrats, versions, publication, catalogue de clauses et revues de sections.
- Bibliothèque de CGV / clauses, synchronisation et édition de clauses spécifiques aux devis.
- Préparation et administration contractuelles, rattachement de documents et import de preuves.
- Devis : lignes/options, versions, attestation réelle d'envoi, accord de principe, finalisation, validité, visibilité, acceptation, refus et révision.
- Facturation : statut et métadonnées de factures.
- Import de devis PDF contractuel : **sélection et confirmation en dehors du verrou**, puis contrôle de version/de destinataire et import + rattachement **dans un seul permis**, pour rejeter un changement intervenu dans une autre fenêtre.
- Génération de PDF : capture de la lecture commerciale et de l'écriture du fichier dans un seul permis, sans transformer l'export en attestation d'envoi.
- Validation d'une revue Word : vérification de la session **après** l'attente du verrou, avant de créer une nouvelle version.
- Création des dossiers documentaires à l'ouverture du sélecteur ou d'un dossier également protégée (car un simple getter pouvait créer des dossiers).

Le contrat EC03 n'est pas changé : **il se fige à la transmission réellement attestée, pas à la signature**. L'aperçu, la lecture et la génération du PDF ne valent ni attestation d'envoi, ni acceptation. Les clauses historiques restent soumises aux protections déjà présentes dans les services métier. Aucune migration SQLite ni nouvelle règle juridique.

## Vérifications et limites

Un nouveau test source `WorkspaceContractMutationCoverage.test.ts` énumère les 56 routes protégées, vérifie la distinction des routes EC03 et la revalidation après un dialogue. Il s'agit d'un **test statique** du registre, pas d'une preuve d'intégration Electron. Le test `WorkspaceContractMutationGate.test.ts` simule concurrence et erreur de copie avec une fausse persistance.

Les tests Vitest complets et la compilation TypeScript de tout le dépôt n'ont pas été exécutés ici : l'environnement actuel ne dispose pas du dépôt complet en local. Aucun résultat de CI ne doit être inventé.

**Blocages pour une sauvegarde complète :** d'autres écritures demeurent non protégées dans `ipc.ts` (Prospects/Clients, catalogues, projets, secrets, Bridge et réglages), et certaines lectures possèdent des effets de bord. Les traitements autonomes hors IPC et les chemins de ressources externes sont également à inventorier. Le coordinateur EC04 reste non exposé, aucun test de restauration Windows/DPAPI n'a eu lieu.

**Ne pas fusionner vers main, ne pas installer, ne pas manipuler de bases réelles.**

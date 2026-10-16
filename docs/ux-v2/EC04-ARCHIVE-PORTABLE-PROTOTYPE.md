# EC04 — incrément 02–04 : archive portable et restauration isolée (prototype)

**État : code de recherche et validation sur données fictives. NE PAS BRANCHER AU MANAGER EN PRODUCTION.**
Branche `feature/ec04-workspace-file-inventory-v1`. Aucun changement à main, aux migrations, à IPC, à l'interface ou aux données personnelles.

## Ce qui est réellement implémenté

- Le scanner EC04-01 identifie huit racines de fichiers possédées et refuse les chemins dangereux, les fichiers spéciaux et les jonctions.
- `WorkspacePortableArchive.ts` fournit trois fonctions **non exposées à l'interface** :
  - `createOfflineWorkspaceArchive` assemble un instantané SQLite fourni par rappel et les ressources inventoriées.
  - `verifyOfflineWorkspaceArchive` contrôle le format, les chemins et empreintes de tous les fichiers, puis l'intégrité/FK et le registre SQLite.
  - `restoreOfflineArchiveToNewWorkspace` extrait et vérifie vers un **dossier neuf**, jamais par-dessus le workspace quotidien.
- Lecture/écriture par morceaux bornés, format binaire `.awbackup` documenté ci-dessous ; archive déposée par lien dur exclusif après vérification, pas de remplacement d'un fichier existant.
- Gestion d'échec : dossiers de travail temporaires nettoyés, refus de l'archive modifiée/tronquée, refus d'une destination existante, détection des modifications observables de fichiers durant la capture.

## Format expérimental non compressé « B1 »

Octets : ASCII `ATOUM-EC04-B1\n`, puis longueur du manifeste JSON en entier non signé little-endian 64 bits, puis le manifeste UTF-8 et les octets bruts des fichiers concaténés dans l'ordre exact annoncé. Le manifeste versionné comporte l'identifiant d'archive, date, chemins relatifs autorisés, tailles, SHA-256 et noms/identifiants du registre SQLite. Une entrée `database/atoumweb-manager.sqlite` est obligatoire ; les fichiers sont préfixés de `workspace/`.

Ce format est documenté mais **pas un ZIP** ; il ne bénéficie pas d'une compatibilité avec Windows Explorer. Il n'est pas compressé, chiffré ou signé. Les empreintes attestent une concordance binaire, **pas l'origine ou l'authenticité** du producteur.

Les deux marqueurs `referencesVerified: false` et `consistencyCertified: false` sont obligatoires : aucun utilisateur ne doit pouvoir interpréter cette archive comme une sauvegarde professionnelle validée.

## Vérifications effectuées dans l'environnement de développement de ChatGPT

- TypeScript 5.8 isolé : OK pour les deux modules TypeScript (pas la compilation du projet Electron complet).
- Simulation Node 22 `node:sqlite` : création d'une base factice et de 4 fichiers, capture, vérification, restauration vers un dossier neuf, puis relecture de chaque octet/ligne SQLite.
- Refus testés : archive altérée, destination existante, modification de fichier pendant la capture.
- Six cas Vitest supplémentaires sont ajoutés au dépôt, **non encore exécutés dans la CI Windows du projet**.

## Bloqueurs avant toute sauvegarde utilisable

1. **Barrière de cohérence interfenêtres et multiservices** : les écritures SQLite et sur fichiers doivent être coordonnées pendant tout le snapshot, sans perdre les brouillons ni le chrono. Le rappel de capture ne remplace pas cette barrière.
2. **Contrôle complet des références** SQLite↔logos/justificatifs/documents/Bridge et des chemins absolus/customisés hors des huit racines ; actuellement `referencesVerified=false`. Prévoir exceptions/résolution explicites.
3. **Validation des migrations historiques et portabilité des chemins** sur copie ; le moteur vérifie l'intégrité et le registre tel qu'archivé, pas son identité complète avec le référentiel de production.
4. **Portabilité des secrets Windows DPAPI** : une copie chiffrée sur un PC peut être illisible sur un autre. Ni déchiffrement automatique ni export clair ici.
5. **Protection des archives sensibles** : choisir et développer chiffrement authentifié, gestion de clés, rétention, espace disque, rotation, destinations et authentification.
6. **Compatibilité Windows et crash recovery** : tests Windows/Electron/SQLite 71, données fictives volumineuses, jonctions, fichiers ouverts, coupure disque et promotion de dossier sans substitution concurrente. Ne pas autoriser l'installation sans ces recettes.
7. **Restauration existante UX-16** : l'intégrer au lieu de créer un second système de remplacement. Cette API ne restaure volontairement **que dans un nouveau dossier**.

## Périmètre

Aucune migration SQLite ajoutée. Aucune PR, aucune CI hébergée déclenchée sur cette branche. Le workspace quotidien n'est pas ouvert. `main` demeure la version fusionnée UX/UI V2 avec EC03.

**Prochaine tranche recommandée :** développer le coordinateur d'écriture interfenêtres et le registre SQLite↔fichiers sur fixtures, puis durcir le format et la recette avant raccordement de l'interface.

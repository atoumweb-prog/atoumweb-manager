> Mise à jour convergence du18/10 : PR draft [#156](https://github.com/atoumweb-prog/atoumweb-manager/pull/156) ouverte après autorisation. CI1808 échoue sur une fixture CRM historique ; correctif de préparation du schéma uniquement, assertions et délais conservés. [Rapport de convergence](EC04-CONVERGENCE-2026-10-18.md). Les preuves MSI ci-dessous restent rattachées à leurs SHA historiques ; le bilan final de la PR donnera les résultats hébergés du nouveau HEAD. Aucune fusion/activation autorisée.

# Actualisation MSI - 18 octobre 2026

**GO technique local pour proposer la convergence du socle EXPERIMENTAL NON EXPOSE. NO-GO pour activation ou sauvegarde quotidienne de production.** Aucune fusion autorisee/executée.

La passation historique ci-dessous reste conservee. Sa demande de validation Windows a ete executee sur un worktree dedie, uniquement TEMP. [Bilan MSI et limites](EC04-MSI-VALIDATION-2026-10-18.md), [audit des ecritures](EC04-MSI-AUDIT-ECRITURES-2026-10-18.md). Le dernier commit de cette branche identifie le candidat final ; les preuves de preparation et la campagne finale sont distinguees dans le bilan. Aucune CI EC04 n'a ete declenchee : un push seul sur cette branche ne correspond pas aux filtres du workflow, aucune PR n'est ouverte.

Corrections nouvelles : bail invalide ne masquant plus le refus initial ; jonctions pour les fixtures Windows sans privilege ; preferences synchrones et trois lectures documentaires a empreinte legacy encadrees ; bootstrap corrompu/invalide refuse sans ouverture de secours ; normalisation du SEUL snapshot prive en DELETE avant empreinte, liens physiques/symboliques refuses, lecteurs d'audit refusant WAL avant ouverture ; audit de trois references Bridge selon leurs bases et cle reelles. Migrations historiques inchangees.

Validation de preparation au code `cf59ca432ec97df8e77f989344a839a1d1da0622` : typecheck vert, 1660/1660 Vitest (194 fichiers,116 s),36 controles natifs (23 capture/incidents +13 reprise), 71 migrations exactes et133 tables sur fixture. La seule modification non commitee pendant cette preparation etait l'ajout de l'etape CI native. Une campagne typecheck/Vitest/natif supplementaire est executee apres le commit documentaire final pour satisfaire la correspondance exacte du SHA ; son resultat et son empreinte sont consignes lors de la publication. Aucun resultat heberge n'est suppose.

**Reserves determinantes :** couverture des references toujours partielle ; appels directs aux services, arret et outils hors processus non verrouilles universellement ; B1 non chiffre/non authentifie ; DPAPI valide seulement sur cet utilisateur Windows, pas sur un autre PC ; disque physique distinct et refus NTFS reels non certifies. Aucun bouton/IPC de capture globale active, aucun installateur, aucune base reelle. Details des limites et operations restantes dans le bilan.

---

# EC04 — PASSATION CODEX MSI — VALIDATION NATIVE AVANT CONVERGENCE

**Statut : candidat EXPÉRIMENTAL, non certifié, non fusionné.** Cette passation est destinée à Codex sur le poste Windows MSI. Aucun installateur, aucun workspace réel, aucune base utilisateur ne doivent être touchés.

## 1. Source de vérité et périmètre

- Dépôt : `atoumweb-prog/atoumweb-manager`.
- Branche source : `feature/ec04-workspace-file-inventory-v1`.
- Base de la passation technique : `40138dc70d7e00882791d09979818c62f199a53e` ; **utiliser le HEAD réel de la branche incluant ce document**, pas une ancienne copie.
- Référence `main` au moment de la préparation : `376eef943e741e2967465b0016c05fc1977a97ea`. **Recontrôler avant convergence**.
- Aucun merge vers `main`, PR de fusion automatique, publication de release ou démarrage d'une sauvegarde complète ne sont autorisés.
- L'interface et les IPC de capture **ne sont pas connectés au coordinateur EC04** ; les anciens endpoints `backups:create-manual` et `backups:restore` concernent SQLite, pas le conteneur `.awbackup` complet.

## 2. Réalisé et présent dans la branche

- Inventaire SHA-256 des huit racines de fichiers possédées, refus des symlinks, noms Windows incompatibles et collisions.
- Format expérimental `.awbackup` B1 (manifeste + SQLite + fichiers), vérification de l'archive et restauration uniquement dans un **nouveau** workspace, marqueurs d'inachèvement et contrôles SQLite.
- Audit partiel des références physiques depuis SQLite. Il est **explicitement incomplet** : `referencesVerified:false`.
- Barrière coopérative `WorkspaceMutationGate` raccordée à une grande partie des handlers IPC : CRM, devis/contrats/CGV, temps, opérations, projets, bibliothèque, Bridge et sauvegardes métier. Des chemins d'écriture non IPC peuvent subsister.
- Détection des dépendances de portabilité (racines de ressources externes et secrets Windows DPAPI), plan de relocalisation, copie relocalisée de workspace fictif et reçu avant/après empreintes.
- Refus par l'application d'ouvrir un workspace marqué `.EC04-RESTORE-INCOMPLETE` / `.EC04-RELOCATION-INCOMPLETE`, et refus de basculer silencieusement vers un workspace par défaut après erreur système.
- Derniers correctifs :
  - `279af2d` : le ledger `schema_migrations` est validé par **id/nom exacts et ordre croissant**, sans hypothèse `id=index+1` ; tests de migrations espacées `[1,3,71]`.
  - `40138dc` : protections des écritures cachées de `BusinessBackupService.mapLocation` et `AtoumWebTechnicalAssetService.map`, dossiers d'import et ouvertures de fichiers.
- Test `WorkspaceEc04ReleaseBarriers.test.ts` ajouté avec cette passation pour vérifier que la capture complète reste non exposée.

## 3. Travail Codex MSI — ordre impératif

**A. Préparer un worktree isolé sur Windows.** Ne pas modifier le workspace de développement habituel, ni copier les bases réelles.

```powershell
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager
git fetch origin
git worktree add C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ec04-validation origin/feature/ec04-workspace-file-inventory-v1
cd C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ec04-validation
git rev-parse HEAD
git status --porcelain
npm ci
```

Arrêter si la branche ne contient pas le présent document ou si `git status` montre des fichiers modifiés inattendus.

**B. Compiler et tester AVANT d'ouvrir Electron.**

```powershell
npm run typecheck
npm test -- src/main/backups/WorkspaceMigrationLedger.test.ts src/main/backups/WorkspacePortableArchive.test.ts
npm test -- src/main/backups/WorkspaceRelocationPlan.test.ts src/main/backups/WorkspaceRelocatedCopy.test.ts
npm test -- src/main/backups/WorkspaceIncompleteGuard.test.ts src/main/backups/WorkspaceIncompleteIntegration.test.ts
npm test -- src/main/backups/WorkspaceHiddenReadMutationCoverage.test.ts src/main/backups/businessBackupsIpc.ec04.test.ts src/main/referentials/referentialsIpc.ec04.test.ts
npm test
```

`npm test` lance `scripts/run-tests.cjs`, qui utilise **Electron avec `ELECTRON_RUN_AS_NODE=1`** ; ne pas remplacer arbitrairement par un exécutable Node ni augmenter les timeouts pour masquer une panne RPC. En cas d'échec, relever la commande, le premier message d'erreur, le dernier SHA, corriger sur la branche EC04 et **relancer les tests au HEAD corrigé**. Éviter les merges opportunistes d'autres lots.

**C. Recette native Electron sur workspace fictif uniquement.** Créer une base de test avec les migrations exactes du Manager, plusieurs projets, devis, PDF, dépenses, ressources, identités, Composition/Bridge et sessions de temps. Ne jamais réutiliser un fichier de données réel.

1. Capturer/restaurer vers un dossier neuf, hors du workspace d'origine ; valider les contenus, l'intégrité, les clés étrangères, les fichiers et les liens SQLite connus.
2. Construire une copie relocalisée et vérifier que `projects.resource_root_path` pointe vers la nouvelle racine, que les sept sous-dossiers Ressources existent, et que le service Projet peut les ouvrir.
3. Tester les chemins avec lettre de lecteur différente, espaces/accents, collision de noms Windows, symlink/jonction et dossier externe.
4. Vérifier les refus **avant toute ouverture** : marqueur RESTORE ou RELOCATION, répertoire inaccessible, configuration persistante illisible, destination déjà existante, fichier ajouté/altéré, base corrompue, interruption simulée.
5. Vérifier une vraie fenêtre Electron de test : lecture des devis/contrats, clients, dossiers, fichiers, chronomètres après reprise, sans démarrage sur un autre workspace à l'insu de l'utilisateur.
6. Vérifier la gestion de plusieurs fenêtres et du verrou de capture : attente des écritures longues, reprise après erreur, absence d'interblocage, et comportement du heartbeat du chronomètre.
7. Vérifier la limitation DPAPI : **les secrets enregistrés sur l'ancien PC ne sont pas déclarés portables ni exportés en clair**. La migration inter-PC doit les refuser ou proposer une réinitialisation humaine documentée.

**D. Audit des écritures hors IPC.** Tracer les mutations automatiques exécutées après `DatabaseService.initialize()`, les lectures à effets de bord et les importeurs/exporteurs qui utilisent les services directement. La barrière IPC seule ne prouve pas la cohérence de la capture. Ne raccorder **aucun bouton de sauvegarde globale** tant que ces accès ne sont pas couverts et testés.

**E. Ne pas confondre les sauvegardes :** `backups:create-manual` et l'ancien parcours de restauration manipulent des sauvegardes SQLite seules, pas le B1 complet. Tester séparément leurs fonctionnalités existantes sans les rebaptiser ni les modifier sans anomalie démontrée.

## 4. Critères de passation / interdictions

**Il est interdit d'annoncer EC04 prêt à la production si l'un de ces points n'est pas acquis :**

- Compilation complète et suite Vitest complètes vertes **sur le même SHA**.
- Test de restauration native Windows/Electron vert, sur un workspace entièrement fictif et distinct.
- Vérification de la cohérence des écritures SQLite/fichiers avec un vrai coordinateur relié à un verrou couvrant toutes les voies mutantes.
- Couverture suffisamment complète des références de fichiers et protocole sûr pour celles non portables.
- Politique de confidentialité : le prototype B1 est **non chiffré**, contient potentiellement devis et documents sensibles et n'est pas authentifié ; exiger une décision explicite avant exposition utilisateur.
- Gestion déterministe des secrets Windows, changements de PC, interruptions et marqueurs d'échec.
- Accord humain exprès avant merge sur `main`, activation d'IPC ou création d'un installateur.

Règles métier conservées : le contrat est fixé à la **transmission attestée** du devis (EC03), sans anticipation à la signature, et les opérations de facturation/maintenance restent soumises aux contrôles existants.

## 5. Bilan à retourner après Codex

Transmettre : branche, dernier SHA exact, `main` de référence, état Git, sortie `npm run typecheck`, total réel Vitest et éventuels échecs, scripts Windows/Electron exécutés, chemins des fixtures, vérifications SQLite, anomalies corrigées, fichiers changés, CI correspondant au SHA, risques résiduels, **GO/NO-GO motivé** et demandes de validation humaine.

Si l'environnement ne permet pas l'essai Electron sécurisé, livrer un **NO-GO documenté**, pas une validation supposée. Ne pas lancer de compilation d'installateur sur le poste utilisateur sans nouvelle demande.

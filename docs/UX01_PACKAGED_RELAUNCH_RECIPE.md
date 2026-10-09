# UX-01 × UX-16 — Recette **packagée** isolée (`app.isPackaged` / `app.relaunch`)

**Statut : préparation du harness vérifiée statiquement le 10/10/2026 ; aucune exécution packagée Windows n'a encore été réalisée.** Les résultats Windows `12/12` de la recette [multi-processus native](UX01_RESTORE_QUIT_ROUNDTRIP.md) ne prouvent pas ce nouveau parcours : les deux recettes sont complémentaires.

## Exécution, sans Codex et sans GitHub Actions

Utiliser seulement le worktree de validation indépendant, avec un état Git propre :

```powershell
cd "C:\DEV\01_PROJETS\AtoumWeb\atoumweb-manager-ux01-validation"
if (git status --porcelain) { throw "Worktree modifié : arrêt par sécurité." }
git fetch origin
git switch --detach origin/prep/ux01-restore-quit-gate-v2
node --check scripts/check-ux01-packaged-relaunch.cjs
node --check scripts/fixtures/ux01-packaged-main.cjs
node --check scripts/fixtures/ux01-packaged-preload.cjs
node scripts/check-ux01-packaged-relaunch.cjs
```

Ce test **peut télécharger le zip Electron** via `@electron/packager` si son cache est vide. Il ne consomme aucun crédit Codex, ne déclenche aucune GitHub Actions et ne crée **aucun MSI ni installation**. La commande n'accepte pas d'argument de workspace ou de profil.

## Architecture et garanties

- Le parent Node crée un nouveau répertoire `%TEMP%\atoumweb-ux01-packaged-*`. Il y construit un **minuscule exécutable Electron indépendant**, nommé `atoumweb-ux01-fixture.exe`, à partir de `@electron/packager` déjà présent dans `package-lock.json`. Il n'ouvre **jamais** `atoumweb-manager.exe`.
- Le bundle CJS importe les **vrais** `DatabaseService`, `registerIpcHandlers`, `restore`, `unsaved`, `RestoreQuitGate` et `workspace`. Il ne reprend pas `main.ts` ou l'interface habituelle ; le préchargement du test expose uniquement `ipcRenderer.invoke('backups:restore')`.
- L'app packagée refuse de démarrer en dehors de ses sous-dossiers `accepted` ou `refused` sous un répertoire à préfixe strict dans `%TEMP%`, ou si le nonce secret aléatoire communiqué par le parent ne correspond pas à son garde local. Elle vérifie `app.isPackaged === true` et redirige `app.setPath('userData', ...)` vers son propre profil TEMP **avant** tout démarrage de la base.
- Chaque scénario part d'une base SQLite fraîche sur 66 migrations, marque l'état `before`, fabrique une vraie sauvegarde manuelle puis une **copie autonome `VACUUM INTO`** validée, avant de modifier la base courante en `after`. Aucune suppression directe de fichiers WAL/SHM n'est autorisée.
- Les boîtes de dialogue **du test seulement** choisissent la source TEMP et autorisent la confirmation ; le code IPC métier ne change pas.
- **Acceptation :** appel réel à `backups:restore` en mode packagé, `app.quit()` issu du timer réel, `will-quit` et programmation du marqueur, **`app.relaunch()` réel sans intervention du parent**, second PID packagé vérifié, application de la sauvegarde `before`, copie `pre-restore` contenant `after`, intégrité SQLite/FK et disparition du marqueur.
- **Refus :** après confirmation de l'IPC, le test signale un **enregistrement pending** dans la fenêtre, avant le timer de fermeture. `before-quit` refuse alors la fermeture ; `will-quit` ne doit pas se produire, la fenêtre et SQLite restent ouvertes, et aucun marqueur n'est présent. Le parent relance ensuite volontairement le binaire de recette : `restored:false` et l'état `after` sont exigés.
- Un résultat valide est la présence de la ligne `SUCCESS`, des deux scénarios réussis, puis de `Fixture cleaned: true` avec un code de sortie 0. **Aucun résultat d'essai n'est encore acquis.**

## Échec et nettoyage

Le parent affiche l'étape courante, attend les états matérialisés par les processus et imprime les 20 derniers événements du journal. En cas de panne, il **conserve uniquement sa fixture sous TEMP pour diagnostic**, plutôt que de tuer à l'aveugle des processus Windows ou de supprimer un exécutable encore actif. Ne pas ouvrir les dossiers utilisateurs ni Validation-MSI pour enquêter ; le chemin de fixture est affiché. L'exécution réussie supprime son dossier TEMP après vérification de son emplacement et de son préfixe.

## Portée exacte et limites

Il s'agit bien d'un **exécutable temporaire réellement packagé** vérifiant `app.isPackaged`, le vrai IPC de restauration et `app.relaunch()`. **Ce n'est pas le package commercial AtoumWeb Manager issu de Forge, pas son `main.ts`/renderer complet et pas un test de l'installateur MSI**. Le banc d'essai ne doit pas être présenté comme une validation de son installateur ou de son intégration avec les données de production.

Les tests antérieurs sur `88efb788` (typecheck, **801/801**, **183/183**) et sur `dbfd0e2` (recette native **12/12**, **5/5**, cleanup) sont acquis sur Windows ; ces nouveaux fichiers de test n'étaient pas présents à ces SHA. Ne pas fusionner #83 sans vérification du nouveau test et une décision explicite sur la CI finale et la couverture du binaire de production.

**Fichiers ajoutés :**
- `scripts/check-ux01-packaged-relaunch.cjs` — orchestrateur, packaging isolé et audit.
- `scripts/fixtures/ux01-packaged-main.cjs` — point d'entrée de l'exécutable temporaire.
- `scripts/fixtures/ux01-packaged-preload.cjs` — IPC minimal de la recette.

Aucune migration, dépendance, workflow, code de production, PR officielle, `main` ou donnée de Validation-MSI n'est modifié par ce lot.
